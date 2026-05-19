// ── Progress tracker (localStorage-backed, zero backend) ─────────────────
// Key format: msl_done_<tabId>_<moduleKey>

const PREFIX = 'msl_done_'

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
