// src/utils/tracks.js — My Tracks local storage layer for ml-systems-lab
// localStorage key: 'msl-tracks-v1'
// Track shape: { id, name, createdAt, items: [...] }
// Module item: { type: 'module', tabId, moduleId, label, difficulty, addedAt }
// Note item:   { type: 'note', id, title, blocks: [...], addedAt, updatedAt }
//   Block shapes:
//     { id, type: 'text',  content }
//     { id, type: 'video', url, videoId, platform, title }
//     { id, type: 'link',  url, domain, title, summary }

const KEY = 'msl-tracks-v1'

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function getTracks() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] }
  catch { return [] }
}

function save(tracks) {
  localStorage.setItem(KEY, JSON.stringify(tracks))
  window.dispatchEvent(new CustomEvent('msl_tracks'))
}

export function getTrack(id) {
  return getTracks().find(t => t.id === id) || null
}

export function createTrack(name) {
  const t = { id: uid(), name, createdAt: Date.now(), items: [] }
  save([...getTracks(), t])
  return t
}

export function renameTrack(id, name) {
  save(getTracks().map(t => t.id === id ? { ...t, name } : t))
}

export function deleteTrack(id) {
  save(getTracks().filter(t => t.id !== id))
}

export function addModule(trackId, tabId, moduleId, label, difficulty) {
  const tracks = getTracks()
  save(tracks.map(t => {
    if (t.id !== trackId) return t
    const already = t.items.some(i => i.type === 'module' && i.tabId === tabId && i.moduleId === moduleId)
    if (already) return t
    return { ...t, items: [...t.items, { type: 'module', tabId, moduleId, label, difficulty, addedAt: Date.now() }] }
  }))
}

// ── Note CRUD ─────────────────────────────────────────────────────────────────

export function createNote(trackId, title = 'Untitled note') {
  const note = {
    type: 'note',
    id: uid(),
    title,
    blocks: [{ id: uid(), type: 'text', content: '' }],
    addedAt: Date.now(),
    updatedAt: Date.now(),
  }
  save(getTracks().map(t => {
    if (t.id !== trackId) return t
    return { ...t, items: [...t.items, note] }
  }))
  return note
}

export function updateNote(trackId, noteId, patch) {
  // patch can be { title } or { blocks } or both
  save(getTracks().map(t => {
    if (t.id !== trackId) return t
    return {
      ...t,
      items: t.items.map(i =>
        i.type === 'note' && i.id === noteId
          ? { ...i, ...patch, updatedAt: Date.now() }
          : i
      ),
    }
  }))
}

export function deleteNote(trackId, noteId) {
  save(getTracks().map(t => {
    if (t.id !== trackId) return t
    return { ...t, items: t.items.filter(i => !(i.type === 'note' && i.id === noteId)) }
  }))
}

export function removeItem(trackId, index) {
  save(getTracks().map(t => {
    if (t.id !== trackId) return t
    return { ...t, items: t.items.filter((_, i) => i !== index) }
  }))
}

export function reorderItems(trackId, fromIndex, toIndex) {
  save(getTracks().map(t => {
    if (t.id !== trackId) return t
    const items = [...t.items]
    const [moved] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, moved)
    return { ...t, items }
  }))
}

// Returns array of track IDs containing this module
export function getTracksForModule(tabId, moduleId) {
  return getTracks()
    .filter(t => t.items.some(i => i.type === 'module' && i.tabId === tabId && i.moduleId === moduleId))
    .map(t => t.id)
}

// ── Generic item CRUD (interview, flashcard, case, flaw, bug) ────────────────
// Item shape: { type, itemId, label, meta, addedAt }

export function addItem(trackId, type, itemId, label, meta = {}) {
  const tracks = getTracks()
  save(tracks.map(t => {
    if (t.id !== trackId) return t
    const already = t.items.some(i => i.type === type && i.itemId === String(itemId))
    if (already) return t
    return { ...t, items: [...t.items, { type, itemId: String(itemId), label, meta, addedAt: Date.now() }] }
  }))
}

export function getTracksForItem(type, itemId) {
  return getTracks()
    .filter(t => t.items.some(i => i.type === type && i.itemId === String(itemId)))
    .map(t => t.id)
}
