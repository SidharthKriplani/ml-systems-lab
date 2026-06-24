// shuffle.js — Fisher-Yates, returns a new array (Audit #033 DRY, 2026-06-24).
// Was duplicated in TrainerTab + InterviewPrepTab.
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
