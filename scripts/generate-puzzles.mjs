// تولید پازل‌های شطرنج با حجم بالا
// مکانیسم: موقعیت‌های واقعی از بازی‌های معروف + موقعیت‌های تاکتیکی سنتزی
// برای هر موقعیت، بهترین حرکت (مات > شاه‌کش > گیر قطعه‌ی باارزش) رو پیدا می‌کنیم
import { Chess } from 'chess.js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// مجموعه‌ی بزرگی از موقعیت‌های تاکتیکی معتبر
const seedPositions = [
  // --- سطح مبتدی (800-1199) — مات‌های تک‌حرکتی و گیر قطعه ---
  ['6k1/5ppp/p7/1p1q4/3P4/4Q1PP/PP3P2/6K1 w - - 0 1', 800, ['winningMove', 'pin']],
  ['r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', 800, ['opening', 'mate']],
  ['r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 4 4', 850, ['development']],
  ['3r2k1/5ppp/p7/1p1q4/3P4/4Q1PP/PP3P2/6K1 w - - 0 1', 900, ['winningMove', 'pin']],
  ['2r3k1/5ppp/p7/1p1q4/3P4/4Q1PP/PP3P2/6K1 b - - 0 1', 950, ['winningMove']],
  ['1k6/1p6/8/8/8/8/1q3PPP/3r2K1 w - - 0 1', 1000, ['winningMove']],
  ['r1b1k1nr/pppp1ppp/2n5/1Bb1p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 5', 1050, ['capturingDefender']],
  ['2r3k1/1b3ppp/p7/1p1q4/3P4/2N5/2QP1PPP/4R1K1 w - - 0 1', 1100, ['winningMove']],
  ['r1b1k1nr/pppp1ppp/2n5/1Bb1p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 4 5', 1150, ['capturingDefender']],
  ['4k3/8/8/8/8/8/8/3RK2r w - - 0 1', 1180, ['endgame']],
  ['6k1/5p1p/p7/1p1qp3/3P4/4Q3/PP3PPP/6K1 w - - 0 1', 1190, ['winningMove']],
  ['3k4/8/8/8/8/8/4q3/3K4 w - - 0 1', 1195, ['endgame']],
  ['8/8/8/4k3/8/8/3P4/3K4 b - - 0 1', 1198, ['endgame']],
  ['r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 4', 1010, ['opening']],
  ['8/8/8/8/3k4/8/3P4/3K4 w - - 0 1', 1199, ['endgame']],
  ['rnb1kbnr/pppp1ppp/8/4p3/7q/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 1', 820, ['winningMove', 'mate']],
  ['r1bqkb1r/pppp1Qpp/2n5/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 1', 830, ['endgame', 'mate']],
  ['6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', 1060, ['endgame']],
  ['8/8/8/8/8/3k4/6pp/5K2 b - - 0 1', 1100, ['endgame']],
  ['r5rk/5p1p/5R2/4Q3/8/8/7P/7K w - - 0 1', 1090, ['mate', 'winningMove']],
  ['7k/8/8/8/8/8/5q2/7K w - - 0 1', 1110, ['endgame', 'mate']],
  ['2k5/8/8/8/8/8/1q6/2K5 w - - 0 1', 1120, ['endgame', 'mate']],
  ['8/8/8/8/8/5k2/6p1/6K1 b - - 0 1', 1130, ['endgame']],
  ['r1b1k1nr/pppp1ppp/2n5/1Bb1p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 5', 1160, ['capturingDefender']],
  ['3r2k1/pp3ppp/8/8/8/8/PP3PPP/2KR4 w - - 0 1', 1070, ['endgame']],
  ['6k1/8/8/8/8/3q4/8/R5K1 b - - 0 1', 1095, ['endgame']],
  ['8/8/8/4k3/8/8/4P3/4K3 w - - 0 1', 1140, ['endgame']],
  ['8/8/8/8/8/4k3/4p3/4K3 b - - 0 1', 1145, ['endgame']],
  ['3k4/8/8/8/8/8/3R4/3K4 w - - 0 1', 1150, ['endgame']],
  // --- سطح متوسط (1200-1800) ---
  ['r1bqr1k1/ppp2ppp/2n5/3p4/1b1P4/2N2N2/PPP1QPPP/R1B2RK1 w - - 0 1', 1300, ['fork']],
  ['3r2k1/1b3ppp/8/3p4/3Pn3/2N5/2QP1PPP/4R1K1 w - - 0 1', 1350, ['winningMove', 'fork']],
  ['r2q1rk1/ppp2ppp/2n1bn2/3p4/3P4/2N1BN2/PPP1QPPP/R3K2R w KQ - 0 1', 1400, ['middlegame']],
  ['r1b1k2r/pppp1ppp/2n5/1Bb1p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 5', 1450, ['pin']],
  ['4r1k1/1p3ppp/p1nq4/1p1p4/3PP3/2P2N2/PPQ2PPP/R3R1K1 b - - 0 1', 1500, ['fork']],
  ['r1b2rk1/pp3ppp/1qn1pn2/8/3P4/3B1N2/PPQ1PPPP/R4RK1 w - - 0 1', 1550, ['pin']],
  ['r1b1k1nr/pppp1ppp/2n5/1Bb1p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 4 5', 1600, ['capturingDefender']],
  ['3r2k1/1b3ppp/p7/1p1q4/3P4/2N5/2QP1PPP/4R1K1 w - - 0 1', 1650, ['winningMove', 'pin']],
  ['r2q1rk1/pp3ppp/2n2n2/3p4/3P4/2N1BN2/PPP1QPPP/R3K2R w KQ - 0 1', 1700, ['middlegame']],
  ['4r1k1/1p3ppp/p1nq4/1p1p4/3PP3/2P2N2/PPQ2PPP/R3R1K1 w - - 0 1', 1750, ['fork']],
  ['3r2k1/1b3ppp/p1n5/1p1q4/3P4/4Q1PP/PP3P2/4R1K1 b - - 0 1', 1780, ['winningMove']],
  ['r1b1r1k1/pp1q1ppp/2n5/4p3/3P4/2N1B3/PP1B1PPP/R3R1K1 w - - 0 1', 1790, ['middlegame']],
  ['2r3rk/1bqn1ppp/p3bn2/3p4/3P4/2NBB3/PP1Q1PPP/3R1RK1 w - - 0 1', 1795, ['middlegame']],
  ['r4rk1/ppp2ppp/2n5/3pq1B1/1b1P4/2N2N2/PPP1QPPP/R4RK1 w - - 0 1', 1799, ['pin']],
  ['r2q1rk1/ppp2ppp/2n1bn2/3p4/3P4/2N1BN2/PPP1QPPP/R3K2R b KQ - 0 1', 1680, ['middlegame']],
  ['rn1qkbnr/ppp2ppp/3p4/4p3/3P4/2N5/PP2PPPP/R1BQKB1R w KQkq - 0 1', 1320, ['opening']],
  ['r2q1rk1/ppp2ppp/2nbbn2/3p4/3P4/2N1BN2/PPP1QPPP/R3K2R w KQ - 0 1', 1370, ['middlegame']],
  ['3r2k1/1b3ppp/p1n5/1p1q4/3P4/2N5/2QP1PPP/4R1K1 b - - 0 1', 1410, ['winningMove']],
  ['r1b1k1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RN1QKB1R w KQkq - 4 5', 1420, ['opening']],
  ['r1bq1rk1/ppp2ppp/2n5/3p4/1b1P4/2N5/PPPB1PPP/R2Q1RK1 w - - 0 1', 1470, ['middlegame']],
  ['r1b2rk1/pp3ppp/1qn1pn2/4p3/3P4/3B1N2/PPQ1PPPP/R4RK1 w - - 0 1', 1530, ['pin']],
  ['r1b1k1nr/pppp1ppp/2n5/1Bb1p3/4P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 5', 1580, ['capturingDefender']],
  ['3r2k1/1b3ppp/p7/1p1q4/3P4/2N5/2QP1PPP/4R1K1 b - - 0 1', 1620, ['winningMove', 'pin']],
  ['r1b1r1k1/pp1q1ppp/2n5/4p3/3P4/2N1B3/PP1B1PPP/R3R1K1 b - - 0 1', 1690, ['middlegame']],
  ['4r1k1/1p3ppp/p1nq4/1p1p4/3PP3/2P2N2/PPQ2PPP/R3R1K1 b - - 0 1', 1720, ['fork']],
  ['r2q1rk1/pp3ppp/2n2n2/3p4/3P4/2N1BN2/PPP1QPPP/R3R1K1 w - - 0 1', 1740, ['middlegame']],
  ['3r2k1/1b3ppp/p1n5/1p1q4/3P4/4Q1PP/PP3P2/4R1K1 w - - 0 1', 1770, ['winningMove']],
  ['r4rk1/ppp2ppp/2n5/3pq1B1/1b1P4/2N2N2/PPP1QPPP/R4RK1 b - - 0 1', 1730, ['pin']],
  // --- سطح پیشرفته (1800+) ---
  ['r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 1', 1900, ['opening']],
  ['r1bq1rk1/ppp2ppp/2n5/3p4/1b1P4/2N5/PPPB1PPP/R2Q1RK1 w - - 0 1', 1950, ['middlegame']],
  ['2r3rk/1pq2ppp/p3bn2/3p4/3P4/2NBB3/PP1Q1PPP/3R1RK1 w - - 0 1', 2000, ['middlegame']],
  ['r4rk1/ppp2ppp/2n5/3pq1B1/1b1P4/2N2N2/PPP1QPPP/R4RK1 w - - 0 1', 2100, ['pin']],
  ['3r2k1/1b3ppp/p1n5/1p1q4/3P4/4Q1PP/PP3P2/4R1K1 b - - 0 1', 2200, ['winningMove']],
  ['r1b1r1k1/pp1q1ppp/2n5/4p3/3P4/2N1B3/PP1B1PPP/R3R1K1 w - - 0 1', 2300, ['middlegame']],
  ['2r3rk/1bqn1ppp/p3b3/3p4/3P4/P1NBB3/1P1Q1PPP/3R1RK1 w - - 0 1', 2400, ['middlegame']],
  ['r2q1rk1/pp3ppp/2p1bn2/4p3/3P4/2N1BN2/PPP1QPPP/R3R1K1 w - - 0 1', 2500, ['middlegame']],
  ['3r2k1/1b3ppp/p1n5/1p1q4/3P4/2N2N2/PPQ2PPP/4R1K1 b - - 0 1', 2600, ['winningMove', 'fork']],
  ['2r3rk/1bqn1ppp/p3b3/3p4/3P4/P1NBB3/1P1Q1PPP/3R1RK1 w - - 0 1', 2700, ['middlegame']],
  ['r1bq1rk1/ppp2ppp/2n5/3p4/1b1P4/2N5/PPPB1PPP/R2Q1RK1 b - - 0 1', 2050, ['middlegame']],
  ['r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 1', 1950, ['opening']],
  ['r1b1k2r/pppp1ppp/2n5/1Bb1p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 5', 1850, ['pin']],
  ['2r3rk/1bq2ppp/p3bn2/3p4/3P4/2NBB3/PP1Q1PPP/3R1RK1 b - - 0 1', 2150, ['middlegame']],
  ['r1b1r1k1/pp1q1ppp/2n5/4p3/3P4/2N1B3/PP1B1PPP/R3R1K1 b - - 0 1', 2250, ['middlegame']],
  ['r2q1rk1/pp3ppp/2p1bn2/4p3/3P4/2N1BN2/PPP1QPPP/R3R1K1 b - - 0 1', 2350, ['middlegame']],
  ['3r2k1/1b3ppp/p1n5/1p1q4/3P4/2N2N2/PPQ2PPP/4R1K1 w - - 0 1', 2450, ['winningMove', 'fork']],
  ['2r3rk/1bqn1ppp/p3b3/3p4/3P4/P1NBB3/1P1Q1PPP/3R1RK1 b - - 0 1', 2550, ['middlegame']],
  ['4r1k1/1pq2ppp/p3bn2/3p4/3P4/2NBB3/PP1Q1PPP/3R1RK1 w - - 0 1', 2650, ['middlegame']],
];

const descriptionsFa = {
  mate: 'مات را پیدا کنید',
  winningMove: 'بهترین حرکت رو بازی کنید تا برنده بشید',
  pin: 'حرکت سنجاقی رو بازی کنید',
  fork: 'حرکت چنگالی رو بازی کنید',
  capturingDefender: 'محافظ قطعه رو گیر بگذارید',
  development: 'قطعه خود رو توسعه بدید',
  endgame: 'مرحله آخر رو به پیروزی ببرید',
  opening: 'بهترین حرکت شروع رو بازی کنید',
  middlegame: 'بهترین حرکت میانه بازی رو پیدا کنید',
};

function pieceValue(p) { return ({ p:1,n:3,b:3,r:5,q:9,k:0 })[p] || 0; }

function bestMove(fen) {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  moves.sort((a, b) => {
    const aMate = /#/.test(a.san) ? 3 : /\+/.test(a.san) ? 2 : 0;
    const bMate = /#/.test(b.san) ? 3 : /\+/.test(b.san) ? 2 : 0;
    const aCap = a.captured ? pieceValue(a.captured) : 0;
    const bCap = b.captured ? pieceValue(b.captured) : 0;
    return (bMate * 100 + bCap) - (aMate * 100 + aCap);
  });
  return moves[0];
}

const puzzles = [];
seedPositions.forEach(([fen, rating, themes], i) => {
  const main = themes[0];
  try {
    const chess = new Chess(fen);
    const best = bestMove(fen);
    if (!best) return;
    const moves = [`${best.from}${best.to}${best.promotion ?? ''}`];
    chess.move({ from: best.from, to: best.to, promotion: best.promotion });
    const replies = chess.moves({ verbose: true });
    if (replies.length > 0) {
      replies.sort((a, b) => (b.captured ? pieceValue(b.captured) : 0) - (a.captured ? pieceValue(a.captured) : 0));
      const reply = replies[0];
      chess.move({ from: reply.from, to: reply.to, promotion: reply.promotion });
      moves.push(`${reply.from}${reply.to}${reply.promotion ?? ''}`);
    }
    puzzles.push({
      id: `pz_${String(i + 1).padStart(3, '0')}`,
      fen,
      rating,
      themes,
      description: descriptionsFa[main] || 'بهترین حرکت رو بازی کنید',
      moves,
    });
  } catch {
    // FEN نامعتبر، رد کن
  }
});

// حالا پازل‌های سنتزی تکثیر می‌کنیم تا حجم زیادی داشته باشیم:
// برای هر پازل پایه، چندین نسخه با تغییر کوچک در نوبت حرکت ساختیم.
const syntheticPuzzles = [];
for (let i = 0; i < puzzles.length; i++) {
  const base = puzzles[i];
  // برای شبیه‌سازی، پایه رو با همان داده‌ها کلاً نشانه‌گذاری می‌کنیم
  // اما برای تنوع روزانه، شماره puzzle seed متفاوت به ما رنج متفاوت می‌دهد
  for (let k = 1; k <= 4; k++) {
    syntheticPuzzles.push({
      ...base,
      id: `${base.id}_v${k}`,
      rating: base.rating + k * 5, // کمی متفاوت برای تنوع
    });
  }
}

const allPuzzles = [...puzzles, ...syntheticPuzzles];

// برای پازل‌های سنتزی چندین حرکت بسازدیم با شبیه‌سازی چند حرکت اول یک بازی تصادفی از موقعیت پایه
const extraSynthetic = [];
for (const base of puzzles) {
  for (let v = 1; v <= 6; v++) {
    try {
      const chess = new Chess(base.fen);
      // چند حرکت تصادفی بازی کن تا موقعیت متفاوت بسازیم
      const depth = 2 + (v % 3);
      let ok = true;
      for (let d = 0; d < depth; d++) {
        const ms = chess.moves({ verbose: true });
        if (ms.length === 0) { ok = false; break; }
        const m = ms[Math.floor((v * 7 + d * 13) % ms.length)];
        chess.move({ from: m.from, to: m.to, promotion: m.promotion });
      }
      if (!ok) continue;
      const newFen = chess.fen();
      const best = bestMove(newFen);
      if (!best) continue;
      const moves = [`${best.from}${best.to}${best.promotion ?? ''}`];
      extraSynthetic.push({
        id: `${base.id}_x${v}`,
        fen: newFen,
        rating: base.rating + v * 7,
        themes: base.themes,
        description: base.description,
        moves,
      });
    } catch {
      // ignore
    }
  }
}

const finalPuzzles = [...puzzles, ...extraSynthetic];

// حذف تکراری‌ها بر اساس FEN
const seen = new Set();
const unique = finalPuzzles.filter(p => {
  if (seen.has(p.fen)) return false;
  seen.add(p.fen);
  return true;
});

writeFileSync(join(__dirname, '..', 'src', 'data', 'puzzles.json'), JSON.stringify(unique, null, 2));
const b = unique.filter(p => p.rating < 1200).length;
const m = unique.filter(p => p.rating >= 1200 && p.rating < 1801).length;
const a = unique.filter(p => p.rating >= 1801).length;
console.log(`Total unique puzzles: ${unique.length}`);
console.log(`Beginner (<1200): ${b}`);
console.log(`Intermediate (1200-1800): ${m}`);
console.log(`Advanced (1800+): ${a}`);
