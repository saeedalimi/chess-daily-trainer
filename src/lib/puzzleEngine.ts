import { Chess } from 'chess.js';
import puzzlesData from '@/data/puzzles.json';
import type { Puzzle, Progress, DifficultyTier } from './types';
import { DIFFICULTY_CONFIGS, PUZZLES_PER_DAY, PUZZLES_PER_TIER } from './constants';

const PUZZLES: Puzzle[] = puzzleable(puzzlesData as unknown as Puzzle[]);

function puzzleable(arr: Puzzle[]): Puzzle[] {
  return arr.filter(p => Array.isArray(p.moves) && p.moves.length > 0);
}

function tierOf(rating: number): DifficultyTier {
  if (rating < 1200) return 'beginner';
  if (rating < 1801) return 'intermediate';
  return 'advanced';
}

// n-روز دیتا (seed) پایدار
function seedForDate(date: string): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// انتخاب ۳۰ پازل روزانه: ۱۰ از هر سطح
export function getDailyPuzzles(date: string): Puzzle[] {
  const all = PUZZLES;
  const tiers: DifficultyTier[] = ['beginner', 'intermediate', 'advanced'];
  const pool: Record<DifficultyTier, Puzzle[]> = {
    beginner: [],
    intermediate: [],
    advanced: [],
  };
  for (const p of all) {
    pool[tierOf(p.rating)].push(p);
  }
  Object.keys(pool).forEach(k => {
    pool[k as DifficultyTier].sort((a, b) => a.rating - b.rating);
  });

  const seed = seedForDate(date);
  let rand = seed;
  const randFn = () => {
    rand = (Math.imul(rand, 1664525) + 1013904223) >>> 0;
    return rand / 0x100000000;
  };

  const pick = (arr: Puzzle[], n: number): { out: Puzzle[]; remainder: number } => {
    const copy = [...arr];
    const out: Puzzle[] = [];
    while (out.length < n && copy.length > 0) {
      const idx = Math.floor(randFn() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return { out, remainder: n - out.length };
  };

  // ۱۰ پازل از هر سطح؛ اگر سطحی کم بود، بقیه از سطح‌های مجاور پر می‌شه
  const begR = pick(pool.beginner, PUZZLES_PER_TIER);
  const intR = pick(pool.intermediate, PUZZLES_PER_TIER);
  const advR = pick(pool.advanced, PUZZLES_PER_TIER);
  const leftover = [...pool.beginner, ...pool.intermediate, ...pool.advanced];
  const used = new Set([...begR.out, ...intR.out, ...advR.out].map(p => p.id));
  const extraPool = leftover.filter(p => !used.has(p.id));
  const totalShort = begR.remainder + intR.remainder + advR.remainder;
  const extra = pick(extraPool, totalShort).out;

  return [...begR.out, ...intR.out, ...advR.out, ...extra];
}

export function getTodayDate(): string {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function getProgress(): Progress {
  if (typeof window === 'undefined') {
    return {
      lastActiveDate: '',
      currentStreak: 0,
      bestStreak: 0,
      totalSolved: 0,
      dailyHistory: {},
    };
  }
  try {
    const raw = localStorage.getItem('chess-progress');
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    // ignore
  }
  return {
    lastActiveDate: '',
    currentStreak: 0,
    bestStreak: 0,
    totalSolved: 0,
    dailyHistory: {},
  };
}

export function saveProgress(p: Progress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('chess-progress', JSON.stringify(p));
}

export function recordDailyProgress(date: string, solved: number, total: number): Progress {
  const p = getProgress();
  p.dailyHistory[date] = { solved, total };
  if (solved === total && total > 0) {
    const prev = p.lastActiveDate;
    if (prev) {
      const prevDate = new Date(prev);
      const cur = new Date(date);
      const diff = Math.round((cur.getTime() - prevDate.getTime()) / 86400000);
      if (diff === 1) p.currentStreak += 1;
      else if (diff !== 0) p.currentStreak = 1;
    } else {
      p.currentStreak = 1;
    }
    if (p.currentStreak > p.bestStreak) p.bestStreak = p.currentStreak;
  }
  p.totalSolved += 0; // اگر نیاز شد localcount کنیم بعداً
  p.lastActiveDate = date;
  saveProgress(p);
  return p;
}

// اعتبارسنجی حرکت بازیکن با حل پازل
export interface MoveResult {
  type: 'correct' | 'wrong' | 'puzzleComplete' | 'responsePlayed';
  uciPlayed: string;
  message: string;
  solved: boolean;
  newFen: string;        // موقعیت جدید تخته بعد از حرکت بازیکن (+ پاسخ رقیب اگر بود)
  consumedMoves: number; // چند حرکت از solutionMoves مصرف شد
}

export function evaluateMove(fen: string, moveUci: string, solutionMoves: string[]): MoveResult {
  if (solutionMoves.length === 0) {
    return { type: 'wrong', uciPlayed: moveUci, message: 'راه‌حل وجود ندارد', solved: false, newFen: fen, consumedMoves: 0 };
  }
  try {
    const from = moveUci.slice(0, 2);
    const to = moveUci.slice(2, 4);
    const promotion = moveUci.length > 4 ? moveUci[4] : undefined;
    const expected = solutionMoves[0];

    // بررسی اعتبار حرکت بازیکن و برابری با حرکت مورد انتظار
    const chess = new Chess(fen);
    const mv = chess.move({ from, to, promotion });
    if (!mv) {
      return { type: 'wrong', uciPlayed: moveUci, message: 'حرکت نامعتبر', solved: false, newFen: fen, consumedMoves: 0 };
    }
    if (moveUci !== expected) {
      return { type: 'wrong', uciPlayed: moveUci, message: 'نادرست! دوباره فکر کنید', solved: false, newFen: fen, consumedMoves: 0 };
    }

    // حرکت بازیکن درست بود. آیا پازل تمام شد؟
    if (solutionMoves.length === 1) {
      return { type: 'puzzleComplete', uciPlayed: moveUci, message: 'درست! پازل حل شد', solved: true, newFen: chess.fen(), consumedMoves: 1 };
    }
    // پاسخ رقیب رو خودکار بازی کن
    const replyUci = solutionMoves[1];
    const rFrom = replyUci.slice(0, 2);
    const rTo = replyUci.slice(2, 4);
    const rPromo = replyUci.length > 4 ? replyUci[4] : undefined;
    try {
      const reply = chess.move({ from: rFrom, to: rTo, promotion: rPromo });
      if (reply) {
        return {
          type: 'responsePlayed',
          uciPlayed: moveUci,
          message: 'درست! حالا موقعیت پس از پاسخ رقیب',
          solved: false,
          newFen: chess.fen(),
          consumedMoves: 2,
        };
      }
    } catch {
      // پاسخ رقیب نامعتبر بود — پازل رو تمام شده در نظر بگیر
    }
    return { type: 'puzzleComplete', uciPlayed: moveUci, message: 'درست! پازل حل شد', solved: true, newFen: chess.fen(), consumedMoves: 1 };
  } catch {
    return { type: 'wrong', uciPlayed: moveUci, message: 'نادرست!', solved: false, newFen: fen, consumedMoves: 0 };
  }
}

export { PUZZLES, DIFFICULTY_CONFIGS, PUZZLES_PER_DAY };
