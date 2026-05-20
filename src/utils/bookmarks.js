const KEY = 'msl_bookmarks'

export function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] }
  catch { return [] }
}

export function toggleBookmark(tabId, moduleId, label) {
  const bms = getBookmarks()
  const id  = `${tabId}:${moduleId}`
  const idx = bms.findIndex(b => b.id === id)
  let next
  if (idx >= 0) {
    next = bms.filter((_, i) => i !== idx)
  } else {
    next = [...bms, { id, tabId, moduleId, label, savedAt: Date.now() }]
  }
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('msl_bookmarks'))
  return next
}

export function isBookmarked(tabId, moduleId) {
  return getBookmarks().some(b => b.id === `${tabId}:${moduleId}`)
}
