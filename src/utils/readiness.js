// readiness.js — Interview readiness % aggregation.
// Combines MLE Path progress (50%) + practice scores (30%) + recent activity (20%).
// Output: { score: 0–100, level: 'novice'|'building'|'competent'|'strong'|'interview-ready', breakdown }.

import { readFoundationsRead, overallCompletion } from '../data/foundationsPath.js'

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
  const foundations = overallCompletion(readFoundationsRead())
  const pathPct = foundations.total > 0 ? (foundations.read / foundations.total) * 100 : 0
  const { practiceScore, accuracyScore, attempted } = readPracticeScore()
  const activityScore = readActivityScore()

  // Weighted blend
  const score = Math.round(0.5 * pathPct + 0.3 * practiceScore + 0.2 * activityScore)

  let level = 'novice'
  if (score >= 80) level = 'interview-ready'
  else if (score >= 60) level = 'strong'
  else if (score >= 40) level = 'competent'
  else if (score >= 20) level = 'building'

  return {
    score,
    level,
    breakdown: {
      path: Math.round(pathPct),
      practice: practiceScore,
      activity: activityScore,
      accuracy: accuracyScore,
      attempted,
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
