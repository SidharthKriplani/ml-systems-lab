// src/utils/tracksSync.js — cross-device merge sync for My Tracks.
//
// Unlike other synced progress (streak, bookmarks, foundation completion —
// see STATIC_PROGRESS_KEYS in ./syncProgress.js), Tracks are a hand-curated,
// growing artifact edited from multiple devices, so whole-value overwrite is
// unsafe: syncProgress.js's own comment says "remote wins" on pull, which
// would silently discard track items added locally since the last sync. This
// module does a real item-level union merge, using tombstones (see
// getTombstones() in tracks.js) so deletions propagate correctly instead of
// being resurrected by a stale device's local copy. It also auto-pushes on
// every edit (debounced) rather than relying on this repo's manual-only
// "Sync now" button, since that's the sync path proper for tracks here.
//
// Reuses the existing generic `user_progress` table (no schema change) under
// its own dedicated key so it never collides with STATIC_PROGRESS_KEYS' path.

import { supabase } from './supabase.js'
import { getTracks, getTombstones, applyMergedState } from './tracks.js'

const KEY = 'msl-tracks-v1'
const TOMBSTONE_TTL_DAYS = 180

function pruneTombstones(tombstones) {
  const cutoff = Date.now() - TOMBSTONE_TTL_DAYS * 86400000
  return {
    trackDeletes: (tombstones.trackDeletes || []).filter(t => t.deletedAt > cutoff),
    itemDeletes: (tombstones.itemDeletes || []).filter(t => t.deletedAt > cutoff),
  }
}

function itemIdentity(item) {
  if (item.uid) return item.uid
  if (item.type === 'preplab') return `preplab:${item.questionId}`
  if (item.type === 'note') return `note:${item.addedAt}`
  return `${item.type}:${item.itemId}`
}

function trackLastTouched(t) {
  let max = t.updatedAt || t.createdAt || 0
  for (const it of t.items || []) max = Math.max(max, it.updatedAt || it.addedAt || 0)
  return max
}

function dedupeTombstones(list, keyFn) {
  const seen = new Map()
  for (const t of list) {
    const k = keyFn(t)
    const prev = seen.get(k)
    if (!prev || t.deletedAt > prev.deletedAt) seen.set(k, t)
  }
  return [...seen.values()]
}

// Exported for standalone testing — pure function, no localStorage/network.
export function mergeTracks(local, remote) {
  const localTombstones = pruneTombstones(local.tombstones || {})
  const remoteTombstones = pruneTombstones(remote.tombstones || {})

  const deletedTrackIds = new Set([
    ...localTombstones.trackDeletes.map(t => t.id),
    ...remoteTombstones.trackDeletes.map(t => t.id),
  ])
  const deletedItemKeys = new Set([
    ...localTombstones.itemDeletes.map(t => `${t.trackId}::${t.itemUid}`),
    ...remoteTombstones.itemDeletes.map(t => `${t.trackId}::${t.itemUid}`),
  ])

  const byId = new Map()
  for (const t of [...(local.tracks || []), ...(remote.tracks || [])]) {
    if (deletedTrackIds.has(t.id)) continue
    const existing = byId.get(t.id)
    if (!existing) { byId.set(t.id, { ...t, items: [...(t.items || [])] }); continue }
    const merged = trackLastTouched(t) > trackLastTouched(existing) ? { ...t } : { ...existing }
    const itemMap = new Map()
    for (const it of [...(existing.items || []), ...(t.items || [])]) {
      const key = itemIdentity(it)
      if (deletedItemKeys.has(`${merged.id}::${key}`)) continue
      const prev = itemMap.get(key)
      if (!prev || (it.updatedAt || it.addedAt || 0) > (prev.updatedAt || prev.addedAt || 0)) itemMap.set(key, it)
    }
    merged.items = [...itemMap.values()].sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0))
    byId.set(t.id, merged)
  }
  for (const [id, t] of byId) {
    t.items = t.items.filter(it => !deletedItemKeys.has(`${id}::${itemIdentity(it)}`))
  }

  const tracks = [...byId.values()].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  const tombstones = {
    trackDeletes: dedupeTombstones([...localTombstones.trackDeletes, ...remoteTombstones.trackDeletes], t => t.id),
    itemDeletes: dedupeTombstones([...localTombstones.itemDeletes, ...remoteTombstones.itemDeletes], t => `${t.trackId}::${t.itemUid}`),
  }
  return { tracks, tombstones }
}

// Sync status ledger (2026-07-16): every push/pull outcome lands in
// localStorage + an event, so My Tracks can SHOW sync health instead of
// failures dying silently in a debounced setTimeout.
const STATUS_KEY = 'msl-tracks-sync-status'
function noteSyncStatus(status, message) {
  try { localStorage.setItem(STATUS_KEY, JSON.stringify({ status, message: message || '', at: Date.now() })) } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('msl_tracks_sync')) } catch { /* ignore */ }
}
export function getSyncStatus() {
  try { return JSON.parse(localStorage.getItem(STATUS_KEY)) } catch { return null }
}

let pushTimer = null

// Debounced auto-push, called after every local track mutation (wired in App.jsx
// via a listener on the 'msl_tracks' event tracks.js already dispatches).
export function scheduleTracksPush(user) {
  if (!user || !supabase) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => { pushTracksNow(user) }, 1500)
}

export async function pushTracksNow(user) {
  if (!user || !supabase) { noteSyncStatus('offline', !user ? 'not signed in' : 'no backend'); return { error: null } }
  // THE 2026-07-16 SYNC BUG: MSL's user_progress.value column is TEXT
  // (docs/SETUP_AUTH.md) — GSL's is jsonb. Pushing the raw {tracks, tombstones}
  // OBJECT was rejected by Postgres on EVERY push (error swallowed pre-status-row),
  // so nothing ever reached Supabase and other devices pulled nothing. Stringify
  // on push + parse on pull works under text today and under jsonb if the schema
  // ever migrates (a JSON string stored in jsonb still comes back as a string).
  const value = JSON.stringify({ tracks: getTracks(), tombstones: getTombstones() })
  const res = await supabase.from('user_progress').upsert(
    [{ user_id: user.id, key: KEY, value, updated_at: new Date().toISOString() }],
    { onConflict: 'user_id,key' }
  )
  if (res.error) noteSyncStatus('error', res.error.message)
  else noteSyncStatus('ok')
  return res
}

// Pull remote, merge with local, write merged result back locally, then push
// the merged result so both sides converge immediately. Call on sign-in and
// from the manual "Sync now" button.
export async function pullAndMergeTracks(user) {
  if (!user || !supabase) { noteSyncStatus('offline', !user ? 'not signed in' : 'no backend'); return { error: null } }
  const { data, error } = await supabase
    .from('user_progress').select('value').eq('user_id', user.id).eq('key', KEY).maybeSingle()
  if (error) { noteSyncStatus('error', error.message); return { error } }
  let remote = data?.value || { tracks: [], tombstones: {} }
  if (typeof remote === 'string') {
    try { remote = JSON.parse(remote) || { tracks: [], tombstones: {} } }
    catch { remote = { tracks: [], tombstones: {} } }
  }
  const local = { tracks: getTracks(), tombstones: getTombstones() }
  const merged = mergeTracks(local, remote)
  applyMergedState(merged)
  await pushTracksNow(user)
  return { error: null }
}
