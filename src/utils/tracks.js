// src/utils/tracks.js — My Tracks local storage layer for ml-systems-lab
// localStorage key: 'msl-tracks-v1'
// Track shape: { id, name, createdAt, items: [...] }
// Module item: { type: 'module', tabId, moduleId, label, difficulty, addedAt }
// Note item:   { type: 'note', id, title, blocks: [...], addedAt, updatedAt }
//   Block shapes:
//     { id, type: 'text',  content }
//     { id, type: 'video', url, videoId, platform, title }
//     { id, type: 'link',  url, domain, title, summary }

import { FOUNDATION_MODULE_INDEX } from '../data/foundationsModuleIndex.js'
import { tierOf } from '../data/moduleTiers.js'

const KEY = 'msl-tracks-v1'
const LAST_KEY = 'msl-tracks-last-v1'      // id of the most-recently-added-to track
const QUICK_KEY = 'msl-tracks-quickadd-v1' // '1' = skip the picker, add straight to last track

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

// One-click: (re)build the S / A / B tier tracks from every Foundation module,
// tagged by interview frequency (moduleTiers.js). Rebuilds cleanly on re-run —
// any existing S/A/B Tier tracks are replaced. Returns [{ name, count }].
export function seedTierTracks() {
  const names = { S: 'S Tier', A: 'A Tier', B: 'B Tier' }
  const now = Date.now()
  const buckets = { S: [], A: [], B: [] }
  const seen = { S: new Set(), A: new Set(), B: new Set() }
  for (const m of FOUNDATION_MODULE_INDEX) {
    const t = tierOf(m.moduleId)
    const key = m.id + '::' + m.moduleId
    if (seen[t].has(key)) continue
    seen[t].add(key)
    buckets[t].push({
      type: 'module',
      tabId: m.id,
      moduleId: m.moduleId,
      label: m.label,
      difficulty: m.difficulty,
      meta: { category: m.domain, tier: t },
      tier: t,
      addedAt: now,
    })
  }
  const kept = getTracks().filter(t => !['S Tier', 'A Tier', 'B Tier'].includes(t.name))
  const tierTracks = ['S', 'A', 'B'].map(t => ({ id: uid(), name: names[t], createdAt: now, items: buckets[t] }))
  save([...kept, ...tierTracks])
  return tierTracks.map(t => ({ name: t.name, count: t.items.length }))
}

export function addModule(trackId, tabId, moduleId, label, difficulty) {
  const tracks = getTracks()
  save(tracks.map(t => {
    if (t.id !== trackId) return t
    const already = t.items.some(i => i.type === 'module' && i.tabId === tabId && i.moduleId === moduleId)
    if (already) return t
    return { ...t, items: [...t.items, { type: 'module', tabId, moduleId, label, difficulty, addedAt: Date.now() }] }
  }))
  setLastTrackId(trackId)
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
  setLastTrackId(trackId)
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

// Remove the first item in a track matching `pred` (used to untick/remove an item
// straight from the Add-to-Track popover).
export function removeItemRef(trackId, pred) {
  const t = getTracks().find(x => x.id === trackId)
  if (!t) return
  const idx = t.items.findIndex(pred)
  if (idx >= 0) removeItem(trackId, idx)
}

export function removeModuleFromTrack(trackId, tabId, moduleId) {
  removeItemRef(trackId, i => i.type === 'module' && i.tabId === tabId && i.moduleId === moduleId)
}

export function removeGenericFromTrack(trackId, type, itemId) {
  removeItemRef(trackId, i => i.type === type && String(i.itemId) === String(itemId))
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

// Move an item from one track to another (drag-and-drop across tracks).
export function moveItem(fromTrackId, toTrackId, index) {
  if (fromTrackId === toTrackId) return
  const src = getTracks().find(t => t.id === fromTrackId)
  if (!src || index < 0 || index >= src.items.length) return
  const item = src.items[index]
  save(getTracks().map(t => {
    if (t.id === fromTrackId) return { ...t, items: t.items.filter((_, i) => i !== index) }
    if (t.id === toTrackId) return { ...t, items: [...t.items, item] }
    return t
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
  setLastTrackId(trackId)
}

export function getTracksForItem(type, itemId) {
  return getTracks()
    .filter(t => t.items.some(i => i.type === type && i.itemId === String(itemId)))
    .map(t => t.id)
}

// Patch the `meta` object of a generic item in place (e.g. editing a saved
// highlight's note). Mirrors removeGenericFromTrack's (type, itemId) lookup.
export function updateItemMeta(trackId, type, itemId, metaPatch) {
  save(getTracks().map(t => {
    if (t.id !== trackId) return t
    return {
      ...t,
      items: t.items.map(i =>
        i.type === type && i.itemId === String(itemId)
          ? { ...i, meta: { ...i.meta, ...metaPatch } }
          : i
      ),
    }
  }))
}

// ── Quick-add: skip the picker, drop into the most-recently-used track ────────

function setLastTrackId(id) { try { if (id) localStorage.setItem(LAST_KEY, id) } catch { /* ignore */ } }
export function getLastTrackId() { try { return localStorage.getItem(LAST_KEY) || null } catch { return null } }
export function getLastTrack() { const id = getLastTrackId(); return id ? getTrack(id) : null }
export function getQuickAdd() { try { return localStorage.getItem(QUICK_KEY) === '1' } catch { return false } }
export function setQuickAdd(on) {
  try { localStorage.setItem(QUICK_KEY, on ? '1' : '0'); window.dispatchEvent(new CustomEvent('msl_tracks')) } catch { /* ignore */ }
}

// Add a generic item straight to the last-used track. Returns the track (for a
// confirmation toast) or null if there's no valid last track.
export function quickAddItem(type, itemId, label, meta = {}) {
  const t = getLastTrack(); if (!t) return null
  addItem(t.id, type, itemId, label, meta); return t
}

// Module variant of quickAddItem.
export function quickAddModule(tabId, moduleId, label, difficulty) {
  const t = getLastTrack(); if (!t) return null
  addModule(t.id, tabId, moduleId, label, difficulty); return t
}
