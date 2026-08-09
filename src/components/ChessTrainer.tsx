'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
  getDailyPuzzles,
  getTodayDate,
  evaluateMove,
  recordDailyProgress,
  getProgress,
} from '@/lib/puzzleEngine';
import type { Puzzle, Progress } from '@/lib/types';
import { PUZZLES_PER_DAY } from '@/lib/constants';

type Status = 'playing' | 'solved' | 'failed';
type DifficultyTier = 'beginner' | 'intermediate' | 'advanced';

const TIER_LABELS: Record<DifficultyTier, string> = {
  beginner: 'مبتدی',
  intermediate: 'متوسط',
  advanced: 'پیشرفته',
};

const TIER_COLORS: Record<DifficultyTier, string> = {
  beginner: '#7fa650',
  intermediate: '#f0a83b',
  advanced: '#e08e3b',
};

function tierOf(rating: number): DifficultyTier {
  if (rating < 1300) return 'beginner';
  if (rating < 2100) return 'intermediate';
  return 'advanced';
}

function emptyProgress(): Progress {
  return { lastActiveDate: '', currentStreak: 0, bestStreak: 0, totalSolved: 0, dailyHistory: {} };
}

function moveUciToSan(fen: string, uci: string): string {
  try {
    const c = new Chess(fen);
    const m = c.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    return m ? m.san : uci;
  } catch {
    return uci;
  }
}

export default function ChessTrainer() {
  const today = useMemo(() => getTodayDate(), []);
  const allPuzzles = useMemo<Puzzle[]>(() => getDailyPuzzles(today), [today]);

  const [tier, setTier] = useState<DifficultyTier>('beginner');
  const puzzles = useMemo(() => allPuzzles.filter(p => tierOf(p.rating) === tier), [allPuzzles, tier]);

  const [index, setIndex] = useState(0);
  const first = puzzles[0];
  const [fen, setFen] = useState<string>(first ? first.fen : '');
  const [status, setStatus] = useState<Status>('playing');
  const [message, setMessage] = useState(first ? 'حرکت درست رو بازی کن و مات/برنده شو!' : 'تمرینی نیست');
  const [solvedCount, setSolvedCount] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(() => new Array(puzzles.length).fill(false));
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [solutionDepth, setSolutionDepth] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [highlightSquare, setHighlightSquare] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [boardWidth, setBoardWidth] = useState(420);
  const [timeUp, setTimeUp] = useState(false);
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = puzzles[index];
  const remainingMoves = useMemo(() => current?.moves.slice(solutionDepth) ?? [], [current, solutionDepth]);
  const timeLimit = useMemo(() => {
    if (tier === 'beginner') return 30;
    if (tier === 'intermediate') return 60;
    return 120;
  }, [tier]);

  // بارگذاری اولیه
  useEffect(() => {
    setMounted(true);
    setProgress(getProgress());
    if (first) {
      setFen(first.fen);
      setBoardOrientation(first.fen.split(' ')[1] === 'b' ? 'black' : 'white');
      setMessage('حرکت درست رو بازی کن و مات/برنده شو!');
    }
  }, [first]);

  // بارگذاری اولیه با url ج的无نکن ایندکس یا سطح عوض شه
  const loadPuzzle = useCallback((p: Puzzle | undefined) => {
    if (!p) {
      setFen('');
      setMessage('تمرینی در این سطح نیست');
      return;
    }
    setFen(p.fen);
    setStatus('playing');
    setMessage('حرکت درست رو بازی کن و مات/برنده شو!');
    setSolutionDepth(0);
    setHighlightSquare(null);
    setTimeUp(false);
    setBoardOrientation(p.fen.split(' ')[1] === 'b' ? 'black' : 'white');
  }, []);

  useEffect(() => {
    if (mounted) loadPuzzle(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // تایمر شمارش معکوس برای هر پازل
  useEffect(() => {
    if (!mounted) return;
    setTimeUp(false);
    setElapsed(timeLimit);
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev - 1;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeUp(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, mounted, timeLimit]);

  // واکنش‌گرا: تخته‌ای که بر اساس فضای موجود موقعیت خودش تنظیم می‌کند
  useEffect(() => {
    if (!mounted) return;
    const measure = () => {
      const el = boardWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // تخته‌ای مربعی بر اساس عرض یا ارتفاع موجود (کوچکتر)
      const w = Math.max(220, Math.floor(Math.min(rect.width, rect.height)));
      setBoardWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boardWrapRef.current) ro.observe(boardWrapRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [mounted]);

  function changeTier(t: DifficultyTier) {
    setTier(t);
    setIndex(0);
    setSolvedCount(0);
    setElapsed(0);
    setSolutionDepth(0);
    setTimeUp(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const next = allPuzzles.filter(p => tierOf(p.rating) === t);
    setCompleted(new Array(next.length).fill(false));
    if (next[0]) loadPuzzle(next[0]);
  }

  function handlePieceDrop(args: { piece: string; sourceSquare: string; targetSquare: string }): boolean {
    if (status !== 'playing' || !current) return false;
    const from = args.sourceSquare;
    const to = args.targetSquare;
    let promotion: string | undefined;
    try {
      const c = new Chess(fen);
      const pieceOnSquare = c.get(from as never);
      const destRank = Number(to[1]);
      if (pieceOnSquare?.type === 'p' && (destRank === 8 || destRank === 1)) {
        promotion = 'q';
      }
    } catch {
      // ignore
    }
    const uci = from + to + (promotion ?? '');
    const result = evaluateMove(fen, uci, remainingMoves);

    if (result.type === 'wrong') {
      setFen(fen); // قطعه رو به محل اولیه برگردون
      setHighlightSquare(to);
      setStatus('failed');
      setMessage('❌ ' + result.message + ' — دوباره فکر کن یا راه‌حل رو ببین');
      return false;
    }

    setFen(result.newFen); // تخته آپدیت می‌شه (حرکت کاربر + پاسخ رقیب)
    setSolutionDepth(d => d + result.consumedMoves);
    setHighlightSquare(null);

    if (result.solved) {
      const newCompleted = [...completed];
      if (!newCompleted[index]) {
        newCompleted[index] = true;
        setSolvedCount(c => c + 1);
      }
      setCompleted(newCompleted);
      setStatus('solved');
      setMessage('عالی و درست! 🎉 پازل حل شد');
      setProgress(recordDailyProgress(today, solvedCount + 1, PUZZLES_PER_DAY));
    } else {
      setStatus('playing');
      setMessage('✅ درست! حالا حرکت بعدی رو پیدا کن');
    }
    return true;
  }

  function nextPuzzle() {
    if (index < puzzles.length - 1) setIndex(i => i + 1);
    else setMessage('🎉 همه‌ی پازل‌های این سطح رو دیدید!');
  }
  function prevPuzzle() {
    if (index > 0) setIndex(i => i - 1);
  }

  function showSolution() {
    if (!current || current.moves.length === 0) return;
    const chess = new Chess(current.fen);
    const firstUci = current.moves[0];
    const san = moveUciToSan(current.fen, firstUci);
    chess.move({
      from: firstUci.slice(0, 2),
      to: firstUci.slice(2, 4),
      promotion: firstUci.length > 4 ? firstUci[4] : undefined,
    });
    const consumed = current.moves.length > 1 ? 2 : 1;
    if (current.moves.length > 1) {
      const replyUci = current.moves[1];
      try {
        chess.move({
          from: replyUci.slice(0, 2),
          to: replyUci.slice(2, 4),
          promotion: replyUci.length > 4 ? replyUci[4] : undefined,
        });
      } catch {
        // ignore
      }
    }
    setHighlightSquare(firstUci.slice(2, 4));
    setFen(chess.fen());
    setSolutionDepth(consumed);
    setMessage(`💡 راه‌حل: ${san}${current.moves.length > 1 ? ' (ادامه داره...)' : ' — مات شد!'}`);
    setStatus('failed');
  }

  function resetPuzzle() {
    if (current) loadPuzzle(current);
  }

  function resetAll() {
    setIndex(0);
    setSolvedCount(0);
    setCompleted(new Array(puzzles.length).fill(false));
    setProgress(emptyProgress());
    try {
      localStorage.setItem('chess-progress', JSON.stringify(emptyProgress()));
    } catch {}
    if (puzzles[0]) loadPuzzle(puzzles[0]);
  }

  function pick(i: number) {
    if (i >= 0 && i < puzzles.length) setIndex(i);
  }

  const allDone = solvedCount === puzzles.length && puzzles.length > 0;
  const remaining = timeLimit - elapsed;
  const mins = String(Math.floor(elapsed / 60));
  const secs = String(elapsed % 60).padStart(2, '0');
  const timerColor = elapsed <= 10 ? 'text-red-400' : elapsed <= 20 ? 'text-yellow-400' : 'text-green-400';

  const boardOptions = {
    position: fen,
    onPieceDrop: (args: { piece: string; sourceSquare: string; targetSquare: string }) => handlePieceDrop(args),
    boardOrientation: boardOrientation as 'white' | 'black',
    boardStyle: { borderRadius: '8px', overflow: 'hidden' } as React.CSSProperties,
    darkSquareStyle: { backgroundColor: '#b58863' } as React.CSSProperties,
    lightSquareStyle: { backgroundColor: '#f0d9b5' } as React.CSSProperties,
    squareStyles: highlightSquare ? {
      [highlightSquare]: {
        background: 'radial-gradient(circle, rgba(239,68,68,0.85) 35%, transparent 75%)',
      },
    } : undefined,
    showNotation: true,
    animationDurationInMs: 180,
    allowDragging: status === 'playing',
  } as const;

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden flex flex-col">
      {/* نوار بالا شیشه‌ای (apple.md §12) */}
      <header className="shrink-0 backdrop-blur-xl bg-[#1a1a1a]/80 border-b border-white/5 px-4 py-2.5">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e07b1f] to-[#c75d12] flex items-center justify-center text-lg shadow-inner shadow-black/30">
              ♟️
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm text-white tracking-tight">تمرین روزانه</div>
              <div className="text-[11px] text-slate-400">{today}</div>
            </div>
          </div>
          {/* انتخاب سطح — دکمه‌های shrunken */}
          <div className="flex items-center gap-1.5">
            {(['beginner', 'intermediate', 'advanced'] as DifficultyTier[]).map(t => (
              <button
                key={t}
                onClick={() => changeTier(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 ${
                  tier === t
                    ? 'text-white ring-1 ring-white/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
                style={tier === t ? { backgroundColor: TIER_COLORS[t] } : undefined}
              >
                {TIER_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1.5 rounded-lg bg-green-600/90 text-white text-xs font-bold flex items-center gap-1">
              <span>🔥</span> {progress?.currentStreak ?? 0}
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-[#4b9e2c]/90 text-white text-xs font-bold">
              {current?.rating ?? '—'}
            </div>
          </div>
        </div>
      </header>

      {/* محتوای اصلی: تخته + پنل کناری در یک نمای ردیفی که ارتفاع را پر می‌کند */}
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <div className="mx-auto max-w-[1400px] h-full px-4 py-3 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_360px] gap-4">
          {/* ستون تخته */}
          <div className="min-h-0 flex flex-col">
            <div ref={boardWrapRef} className="flex-1 min-h-0 flex items-center justify-center">
              {mounted ? (
                <div className="rounded-lg shadow-2xl overflow-hidden ring-1 ring-black/50" style={{ width: boardWidth }}>
                  <Chessboard options={boardOptions} />
                </div>
              ) : (
                <div style={{ width: boardWidth, height: boardWidth }} className="bg-[#b58863] rounded-lg flex items-center justify-center text-slate-500">
                  در حال بارگذاری...
                </div>
              )}
            </div>
            {/* دکمه‌های پایین تخته */}
            <div className="shrink-0 mt-2 grid grid-cols-4 gap-2">
              <ActionButton variant="secondary" onClick={prevPuzzle} disabled={index === 0}>→ قبلی</ActionButton>
              <ActionButton variant="ghost" onClick={resetPuzzle} disabled={!current}>↻ مجدد</ActionButton>
              <ActionButton variant="ghost" onClick={showSolution} disabled={status === 'solved' || !current}>💡 راه‌حل</ActionButton>
              <ActionButton variant="primary" onClick={nextPuzzle} disabled={index >= puzzles.length - 1}>بعدی ←</ActionButton>
            </div>
          </div>

          {/* پنل کناری شیشه‌ای (apple.md §12 material weight) */}
          <aside className="min-h-0 flex flex-col gap-3 overflow-y-auto md:overflow-hidden">
            {/* آواتار + پیام */}
            <div className="backdrop-blur-xl bg-[#262421]/70 rounded-2xl p-4 ring-1 ring-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e07b1f] to-[#c75d12] flex items-center justify-center text-lg shadow-inner">
                    🧙
                  </div>
                  <div className="leading-tight">
                    <div className="font-bold text-white text-sm">استاد شطرنج</div>
                    <div className="text-[11px] text-slate-400">مربی تمرین</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[11px] text-slate-400">تایمر</div>
                  <div className="font-mono font-bold text-white text-base tabular-nums">{mins}:{secs}</div>
                </div>
              </div>
              {/* پیام */}
              <div className={`rounded-2xl rounded-tr-sm px-4 py-3 text-[13px] leading-relaxed transition-colors duration-200 ${
                status === 'solved' ? 'bg-green-700/50 text-green-100'
                : status === 'failed' ? 'bg-red-800/50 text-red-100'
                : 'bg-white/10 text-white'
              }`}>
                {message}
              </div>
              {/* اطلاعات پازل */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <InfoTile label="پازل" value={current ? `${index + 1}/${puzzles.length}` : '—'} />
                <InfoTile label="سطح" value={current ? TIER_LABELS[tierOf(current.rating)] : '—'} color={current ? TIER_COLORS[tierOf(current.rating)] : undefined} />
                <InfoTile label="حل‌شده" value={`${solvedCount}/${puzzles.length}`} />
              </div>
            </div>

            {/* پیشرفت روزانه */}
            <div className="backdrop-blur-xl bg-[#262421]/70 rounded-2xl p-4 ring-1 ring-white/10 shadow-xl">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-semibold text-white text-[13px]">پیشرفت امروز</span>
                <span className="text-[11px] text-slate-400">{solvedCount}/{puzzles.length}</span>
              </div>
              {puzzles.length > 0 ? (
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: puzzles.length }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      className={`h-6 rounded transition-all duration-150 active:scale-90 ${
                        completed[i]
                          ? 'bg-green-600 hover:bg-green-500'
                          : i === index
                          ? 'bg-[#e07b1f] ring-1 ring-white/40'
                          : i < index
                          ? 'bg-white/10 hover:bg-white/15'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      title={`پازل ${i + 1} — ${completed[i] ? 'حل‌شده' : 'حل‌نشده'}`}
                    >
                      {completed[i] && <span className="text-[9px] text-white leading-none">✓</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">پازلی در این سطح نیست.</p>
              )}
              {allDone && (
                <div className="mt-2 text-center font-bold text-green-400 text-xs py-1.5 bg-green-600/15 rounded-lg">
                  🎉 همه‌ی {puzzles.length} پازل حل شد!
                </div>
              )}
            </div>

            <div className="shrink-0 flex items-center justify-between gap-2 text-[11px] text-slate-400">
              <span className="px-2 py-1 bg-white/5 rounded">رکورد استریک: {progress?.bestStreak ?? 0}</span>
              {current && <span className="px-2 py-1 bg-white/5 rounded">مضامین: {current.themes.join('، ')}</span>}
              <button onClick={resetAll} className="text-slate-500 hover:text-red-400 underline">ریست</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ children, onClick, variant, disabled }: { children: React.ReactNode; onClick: () => void; variant: 'primary' | 'secondary' | 'ghost'; disabled?: boolean }) {
  const styles = {
    primary: 'bg-[#4b9e2c] text-white hover:bg-[#5cb23a]',
    secondary: 'bg-[#e07b1f] text-white hover:bg-[#e88a36]',
    ghost: 'bg-white/8 text-slate-200 hover:bg-white/15',
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-lg font-bold text-[13px] transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${styles}`}
    >
      {children}
    </button>
  );
}

function InfoTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-black/30 rounded-lg py-1.5">
      <div className="text-slate-400">{label}</div>
      <div className="font-bold mt-0.5" style={color ? { color } : { color: '#fff' }}>{value}</div>
    </div>
  );
}
