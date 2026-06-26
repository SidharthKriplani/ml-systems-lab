const KEY = 'msl-classical-ml-foundation-v1'

export function getFoundationProgress() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
export function markModuleDone(moduleId) {
  const p = getFoundationProgress()
  p[moduleId] = { completedAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify(p))
  window.dispatchEvent(new CustomEvent('msl_progress'))
}
export function unmarkModuleDone(moduleId) {
  const p = getFoundationProgress()
  delete p[moduleId]
  localStorage.setItem(KEY, JSON.stringify(p))
  window.dispatchEvent(new CustomEvent('msl_progress'))
}
export function isModuleDone(moduleId) {
  const p = getFoundationProgress()
  return !!p[moduleId]?.completedAt
}
export function getDoneCount(modules) {
  const p = getFoundationProgress()
  return modules.filter(m => p[m.id]?.completedAt).length
}
export function getLastCompletedAt(modules) {
  const p = getFoundationProgress()
  const times = modules.map(m => p[m.id]?.completedAt).filter(Boolean)
  return times.length ? times.sort().at(-1) : null
}
