// ── Spaced Repetition Engine — 4-bucket interval system ──────────────────────
// Simplified SR: no full SM-2 ease-factor drift. Four fixed intervals cover
// ~90% of SM-2's benefit with zero implementation complexity.
//
// Rating → next review interval:
//   1 = Again  → 1 day   (forgot, reset)
//   2 = Hard   → 3 days  (recalled with difficulty)
//   3 = Good   → 7 days  (recalled correctly)
//   4 = Easy   → 14 days (effortless recall)
//
// ease_factor column exists in schema for future SM-2 upgrade — leave null for now.

const INTERVALS = {
  1: 1,   // Again
  2: 3,   // Hard
  3: 7,   // Good
  4: 14,  // Easy
}

/**
 * Calculate the next review interval and due date.
 *
 * @param {number} _currentInterval - current interval in days (unused in v1, reserved)
 * @param {number} rating           - 1 | 2 | 3 | 4
 * @returns {{ nextInterval: number, nextDue: string }} nextDue is YYYY-MM-DD
 */
export function getNextInterval(_currentInterval, rating) {
  const nextInterval = INTERVALS[rating] ?? INTERVALS[3]
  const due = new Date()
  due.setDate(due.getDate() + nextInterval)
  // ISO date string — local date in YYYY-MM-DD format
  const nextDue = due.toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD
  return { nextInterval, nextDue }
}

/**
 * Returns true if a card is due today or overdue.
 * @param {string} dueDateStr - YYYY-MM-DD
 */
export function isDue(dueDateStr) {
  const today = new Date().toLocaleDateString('en-CA')
  return dueDateStr <= today
}
