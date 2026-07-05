// readiness.js — Interview readiness % aggregation.
// Combines MLE Path progress (50%) + practice scores (30%) + recent activity (20%).
// Output: { score: 0–100, level: 'novice'|'building'|'competent'|'strong'|'interview-ready', breakdown }.

// NOTE: computeReadiness() used to source "Foundations" coverage from
// readFoundationsRead()/overallCompletion() (below) — a legacy tracker keyed on
// `msl_foundations_read`, populated ONLY by GradientTab.jsx's "mark as read" on its
// 57 blog-post ids. Finishing modules in any of the 19 real Foundation families
// (MathStatsFoundationTab, ClassicalMLFoundationTab, etc.) never touched that key,
// so a user who fully completed e.g. Stat Foundations but never read Gradient posts
// would see readiness stuck at whatever fraction of Gradient posts she'd read —
// completely disconnected from her actual module progress. Fixed below by summing
// the same per-family localStorage trackers ProgressTab.jsx/ProfilePage.jsx use.
// Mirrors FOUNDATION_STORES in ProgressTab.jsx/ProfilePage.jsx (kept in sync
// manually — see note above on why this can't stay sourced from foundationsPath.js).
const FOUNDATION_STORES = [
  { lsKey: 'msl-math-stats-foundation-v1',       total: 18 },
  { lsKey: 'msl-classical-ml-foundation-v1',     total: 14 },
  { lsKey: 'msl-probabilistic-ml-foundation-v1', total:  9 },
  { lsKey: 'msl-eval-foundation-v1',              total: 10 },
  { lsKey: 'msl-unsupervised-foundation-v1',      total: 10 },
  { lsKey: 'msl-causal-foundation-v1',            total: 10 },
  { lsKey: 'msl-dl-foundation-v1',                total: 14 },
  { lsKey: 'msl-self-supervised-foundation-v1',   total:  9 },
  { lsKey: 'msl-rl-foundation-v1',                total: 10 },
  { lsKey: 'msl-production-foundation-v1',        total: 11 },
  { lsKey: 'msl-monitoring-foundation-v1',        total:  8 },
  { lsKey: 'msl-system-design-foundation-v1',     total:  8 },
  { lsKey: 'msl-recsys-foundation-v1',            total:  8 },
  { lsKey: 'msl-pricing-foundation-v1',           total:  7 },
  { lsKey: 'msl-time-series-foundation-v1',       total:  9 },
  { lsKey: 'msl-graph-ml-foundation-v1',          total:  9 },
  { lsKey: 'msl-bandits-foundation-v1',           total:  9 },
  { lsKey: 'msl-optimization-foundation-v1',      total: 12 },
  { lsKey: 'msl-data-foundation-v1',              total: 11 },
]

function getFoundationDone(lsKey) {
  try {
    const data = JSON.parse(localStorage.getItem(lsKey) || '{}')
    return Object.values(data).filter(v => v?.completedAt).length
  } catch { return 0 }
}

function readRealFoundationCompletion() {
  let done = 0, total = 0
  for (const f of FOUNDATION_STORES) {
    done += Math.min(getFoundationDone(f.lsKey), f.total)
    total += f.total
  }
  return { read: done, total }
}

function readPracticeScore() {
  let attempted = 0, correct = 0, totalKeys = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('msl_score:')) continue
      totalKeys++
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const val = JSON.parse(raw)
        if (val && typeof val === 'object') {
          if (typeof val.correct === 'number') correct += val.correct
          if (typeof val.attempted === 'number') attempted += val.attempted
          if (Array.isArray(val)) attempted += val.length
        }
      } catch {}
    }
  } catch {}
  // Heuristic: practice readiness = ratio of attempted to a senior-MLE target of ~80 scenarios.
  const TARGET = 80
  const practiceScore = Math.min(100, Math.round((attempted / TARGET) * 100))
  const accuracyScore = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
  return { practiceScore, accuracyScore, attempted, correct, totalKeys }
}

function readActivityScore() {
  let activeDays = 0
  try {
    // Count days with activity in last 28 days
    for (let i = 0; i < 28; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      if (localStorage.getItem(`msl_activity_${d}`)) activeDays++
    }
  } catch {}
  // 14+ days in last 28 = full activity score
  return Math.min(100, Math.round((activeDays / 14) * 100))
}

export function computeReadiness() {
  const foundations = readRealFoundationCompletion()
  const pathPct = foundations.total > 0 ? (foundations.read / foundations.total) * 100 : 0
  const { practiceScore, accuracyScore, attempted, correct } = readPracticeScore()
  const activityScore = readActivityScore() // kept for the breakdown display only

  // PAL-style readiness: mean of capped per-area coverage. Each area contributes
  // at most 100%, so over-grinding one area can't mask a gap in another — the score
  // rewards breadth across what interviews actually test. Streak/activity is
  // deliberately EXCLUDED from the score: interview prep is a cram-to-a-date goal,
  // not a forever-streak app (learned from Product Analytics Lab).
  const foundationCov = Math.min(pathPct / 100, 1)
  const practiceCov   = Math.min(practiceScore / 100, 1)

  const areas = [
    { key: 'foundations', label: 'Foundations (KNOW)', cov: foundationCov },
    { key: 'practice',    label: 'Practice (drills & questions)', cov: practiceCov },
  ]
  const score = Math.round((areas.reduce((s, a) => s + a.cov, 0) / areas.length) * 100)

  // Weakest area that still has headroom — the "work next" pointer.
  const weakest = areas.filter(a => a.cov < 1).sort((a, b) => a.cov - b.cov)[0] || null

  let level = 'novice'
  if (score >= 80) level = 'interview-ready'
  else if (score >= 60) level = 'strong'
  else if (score >= 40) level = 'competent'
  else if (score >= 20) level = 'building'

  return {
    score,
    level,
    weakest,
    breakdown: {
      path: Math.round(pathPct),
      practice: practiceScore,
      activity: activityScore,
      accuracy: accuracyScore,
      attempted,
      correct,
      pathRead: foundations.read,
      pathTotal: foundations.total,
    },
  }
}

export function readinessLabel(level) {
  return {
    'novice':           'Starting out',
    'building':         'Building foundations',
    'competent':        'Competent',
    'strong':           'Strong',
    'interview-ready':  'Interview-ready',
  }[level] || 'Starting out'
}

export function readinessColor(level) {
  return {
    'novice':           'var(--ink-low)',
    'building':         'var(--ink-mid)',
    'competent':        'var(--prime)',
    'strong':           'var(--prime)',
    'interview-ready':  'var(--mint)',
  }[level] || 'var(--ink-low)'
}
