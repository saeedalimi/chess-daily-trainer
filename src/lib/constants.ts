export const DIFFICULTY_CONFIGS = {
  beginner: { ratingRange: [0, 1200] as [number, number], label: 'مبتدی', description: 'مناسب برای تازه‌کارها' },
  intermediate: { ratingRange: [1201, 1800] as [number, number], label: 'متوسط', description: 'چالش برانگیز' },
  advanced: { ratingRange: [1801, 3000] as [number, number], label: 'پیشرفته', description: 'فقط برای حرفه‌ای‌ها' },
} as const;

export const PUZZLES_PER_DAY = 30;
export const PUZZLES_PER_TIER = 10; // 10 per tier × 3 tiers = 30