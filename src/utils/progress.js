// ── Progress tracker (localStorage-backed, zero backend) ─────────────────
// Key format: msl_done_<tabId>_<moduleKey>
// Mastery key: msl_mastery_<tabId>_<moduleKey>  → 'exploring'|'practicing'|'mastered'

const PREFIX   = 'msl_done_'
const M_PREFIX = 'msl_mastery_'

// Mastery tiers in ascending order
export const MASTERY_TIERS = ['exploring', 'practicing', 'mastered']

export function setMastery(tabId, moduleKey, tier) {
  if (!MASTERY_TIERS.includes(tier)) return
  localStorage.setItem(`${M_PREFIX}${tabId}_${moduleKey}`, tier)
  window.dispatchEvent(new CustomEvent('msl_progress'))
}

export function getMastery(tabId, moduleKey) {
  return localStorage.getItem(`${M_PREFIX}${tabId}_${moduleKey}`) || null
}

// Infer mastery from % progress when no explicit tier is set
export function inferMastery(pct) {
  if (pct === 100) return 'mastered'
  if (pct >= 50)  return 'practicing'
  if (pct > 0)    return 'exploring'
  return null
}

// Record interview session mastery from tier history (array of {id, tier})
// Aggregates to track-level mastery based on best tier achieved
export function recordInterviewSessionMastery(tierHistory) {
  if (!tierHistory?.length) return
  const tierRank = { junior: 0, analyst: 1, senior: 2, staff: 3 }
  const best = tierHistory.reduce((top, h) => (tierRank[h.tier] ?? 0) > (tierRank[top] ?? 0) ? h.tier : top, 'junior')
  const tierToMastery = { junior: 'exploring', analyst: 'practicing', senior: 'mastered', staff: 'mastered' }
  setMastery('interview', 'timed_practice', tierToMastery[best] || 'exploring')
}

// Get highest mastery across all modules in a track
export function getTrackMastery(tabId) {
  const keys = TRACK_MODULES[tabId] || []
  let best = null
  for (const k of keys) {
    const m = getMastery(tabId, k)
    if (!m) continue
    if (!best || MASTERY_TIERS.indexOf(m) > MASTERY_TIERS.indexOf(best)) best = m
  }
  return best
}

export function markDone(tabId, moduleKey) {
  localStorage.setItem(`${PREFIX}${tabId}_${moduleKey}`, '1')
  window.dispatchEvent(new CustomEvent('msl_progress'))
}

export function unmarkDone(tabId, moduleKey) {
  localStorage.removeItem(`${PREFIX}${tabId}_${moduleKey}`)
  window.dispatchEvent(new CustomEvent('msl_progress'))
}

export function isDone(tabId, moduleKey) {
  return localStorage.getItem(`${PREFIX}${tabId}_${moduleKey}`) === '1'
}

export function getTabProgress(tabId, moduleKeys) {
  const done = moduleKeys.filter(k => isDone(tabId, k)).length
  return { done, total: moduleKeys.length, pct: moduleKeys.length ? Math.round((done / moduleKeys.length) * 100) : 0 }
}

// Per-track module keys — used for progress rings on HomeTab
export const TRACK_MODULES = {
  spark:     ['shuffle', 'skew', 'partition'],
  features:  ['skew_sim', 'feature_store'],
  eval:      ['metric', 'ab_test', 'shadow'],
  models:    ['pca', 'svd', 'pipeline', 'regularization', 'numpy', 'calibration'],
  design:    ['incident_room', 'canvas', 'two_tower'],
  monitor:   ['drift_dash', 'psi_lab'],
  interview: ['system_design', 'features', 'eval', 'spark', 'coding'],
  gradient:  ['post1','post2','post3','post4','post5','post6','post7','post8','post9','post10','post11','post12','post13'],
}

export function getAllProgress() {
  return Object.entries(TRACK_MODULES).map(([tab, keys]) => ({
    tab,
    ...getTabProgress(tab, keys),
  }))
}

// "What to study next" — pick the first track with partial or zero progress
export function getNextRecommendation() {
  const all = getAllProgress()
  // Prefer started-but-incomplete first
  const partial = all.find(t => t.done > 0 && t.done < t.total)
  if (partial) return partial
  // Then first untouched
  return all.find(t => t.done === 0) ?? null
}
