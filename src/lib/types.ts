export interface Puzzle {
  id: string;
  fen: string;
  moves: string[];      // UCI format: ["d1h5", "g6h5"]
  rating: number;
  themes: string[];
  description: string;
}

export interface DailyPuzzleSet {
  date: string;          // YYYY-MM-DD
  puzzles: Puzzle[];
  completed: string[];   // puzzle IDs completed
}

export interface Progress {
  lastActiveDate: string;
  currentStreak: number;
  bestStreak: number;
  totalSolved: number;
  dailyHistory: {
    [date: string]: {
      solved: number;
      total: number;
    };
  };
}

export type DifficultyTier = 'beginner' | 'intermediate' | 'advanced';

export interface DifficultyConfig {
  ratingRange: [number, number];
  label: string;
  description: string;
}