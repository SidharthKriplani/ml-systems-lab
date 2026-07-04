// Order a family's foundation modules by difficulty for display:
// foundational → intermediate → advanced, stable within each band
// (same-difficulty modules keep their authored order).
const RANK = { foundational: 0, beginner: 0, intermediate: 1, advanced: 2 };

export function sortByDifficulty(modules) {
  return (modules || [])
    .map((m, i) => ({ m, i }))
    .sort((a, b) => (RANK[a.m.difficulty] ?? 1) - (RANK[b.m.difficulty] ?? 1) || a.i - b.i)
    .map((x) => x.m);
}
