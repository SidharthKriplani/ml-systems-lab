// ── Read marking utility for Gradient posts ──────────────────────────────────

const KEY = 'msl_read'

export function getRead() {
  try {
    const data = localStorage.getItem(KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function toggleRead(postId) {
  const read = getRead()
  const idx = read.indexOf(postId)
  let next
  if (idx >= 0) {
    next = read.filter((_, i) => i !== idx)
  } else {
    next = [...read, postId]
  }
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('msl_read'))
  return next
}

export function isRead(postId) {
  return getRead().includes(postId)
}
