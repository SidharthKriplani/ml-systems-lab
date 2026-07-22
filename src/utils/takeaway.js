// takeaway — user-writable "my takeaway" text per module (Q3 Wave A item 2,
// MSL — 2026-07-23). One free-text box per module, shown atop the existing
// Quick Recap block in each of the 19 *FoundationTab.jsx files (via the
// shared TakeawayBox.jsx component), distinct from any author-written
// content — this is the reader's own words.
//
// Mirrors GSL's src/utils/takeaway.js exactly: storage shape matches this
// lab's other annotation stores — { [pageKey]: [ {id, ts, text} ] } + a
// parallel tombstone array — so it plugs into the existing
// annotationsSync.js per-item merge with zero new merge logic, same as
// localHighlights.js / stickyNotes.js / reviewCards.js. Each page bucket
// holds at most ONE item (a fixed id, 'takeaway', not a fresh id per save)
// so repeated edits to the same box are treated as edits to the same item
// by the merge (recency = max(ts, editedTs) — see annotationsSync.js),
// never as accumulating duplicates.
//
// The 700ms-debounce-and-skip-if-unchanged behavior lives in the CALLER
// (components/foundations/TakeawayBox.jsx), not here — same split GSL uses
// between FoundationsRunner.jsx (debounce) and utils/takeaway.js (storage).
//
// pageKey is `${TAB_ID}::${selected.id}` — the SAME pageKey
// HighlightPopover.jsx already uses for this module, so a takeaway rides
// the same sync bucket as everything else on that page.

const KEY = 'msl-takeaway-v1'
export const TAKEAWAY_STORE_KEY = KEY
export const TAKEAWAY_TOMB_KEY = 'msl-takeaway-v1-tomb-v1'
const ITEM_ID = 'takeaway' // fixed — one box per pageKey, never accumulates

function writeTombstone(pageKey) {
  try {
    const arr = JSON.parse(localStorage.getItem(TAKEAWAY_TOMB_KEY) || '[]')
    arr.push({ k: pageKey, id: ITEM_ID, ts: Date.now() })
    localStorage.setItem(TAKEAWAY_TOMB_KEY, JSON.stringify(arr.slice(-800)))
  } catch { /* ignore */ }
}

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch { return {} }
}
function writeAll(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('annotations-changed')) } catch { /* SSR */ }
}

// Returns the saved text for this module, or '' if none.
export function getTakeaway(pageKey) {
  const arr = readAll()[pageKey] || []
  const item = arr.find(it => it.id === ITEM_ID)
  return (item && item.text) || ''
}

// Empty text deletes the item (with a tombstone) rather than storing an
// empty string, so a cleared box doesn't leave orphaned empty entries.
export function setTakeaway(pageKey, text) {
  const all = readAll()
  const trimmed = (text || '').trim()
  if (!trimmed) {
    if (all[pageKey]?.some(it => it.id === ITEM_ID)) {
      all[pageKey] = all[pageKey].filter(it => it.id !== ITEM_ID)
      if (!all[pageKey].length) delete all[pageKey]
      writeTombstone(pageKey)
      writeAll(all)
    }
    return
  }
  const arr = all[pageKey] || []
  const idx = arr.findIndex(it => it.id === ITEM_ID)
  const item = { id: ITEM_ID, text, ts: idx === -1 ? Date.now() : arr[idx].ts, editedTs: Date.now() }
  if (idx === -1) all[pageKey] = [...arr, item]
  else all[pageKey] = arr.map((it, i) => (i === idx ? item : it))
  writeAll(all)
}
