// reviewCards — user-created cloze review cards, born from "Add to review" on
// a painted highlight (Q3 Wave A item 1, 2026-07-22). A card is a short
// passage with its highlighted term hidden (cloze), fed into ReviewTab's
// existing spaced-repetition queue alongside completed-module rows — same
// due-list, same sort, same SM-2-lite schedule math (ReviewTab computes
// dueAt for cards the exact same way it already does for modules, just
// anchored off the card's own createdAt/lastReviewed).
//
// Storage shape matches localHighlights.js / stickyNotes.js exactly, on
// purpose — { [pageKey]: [ {id, ts, ...} ] } + a parallel tombstone array —
// so this store plugs directly into the existing annotationsSync.js
// per-item merge (mergeAnnotationBlobs/applyAnnotationMerge) with ZERO new
// sync logic: just registering the (store, tomb) key pair in
// syncProgress.js's ANNOT_PAIRS, exactly like msl_page_highlights_v1 and
// lab-stickies-v1 already do (see that file's edit in this same turn).
//
// pageKey is `${tabId}::${moduleId}` — the SAME pageKey HighlightPopover
// already uses for the highlight a card is created from, so a card and its
// source highlight always live in the same sync bucket.

const KEY = 'msl-review-cards-v1'
export const CARD_STORE_KEY = KEY
export const CARD_TOMB_KEY = 'msl-review-cards-v1-tomb-v1'

function writeCardTombstones(pageKey, ids) {
  if (!ids.length) return
  try {
    const arr = JSON.parse(localStorage.getItem(CARD_TOMB_KEY) || '[]')
    const now = Date.now()
    for (const id of ids) arr.push({ k: pageKey, id, ts: now })
    localStorage.setItem(CARD_TOMB_KEY, JSON.stringify(arr.slice(-800)))
  } catch { /* ignore */ }
}

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch { return {} }
}
function writeAll(all) {
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* ignore */ }
  // ReviewTab already listens for this event to refresh its queue after any
  // progress-affecting write (see writeReviewState in ReviewTab.jsx) — reuse
  // it rather than inventing a second event for the same purpose.
  try { window.dispatchEvent(new CustomEvent('msl_progress')) } catch { /* ignore */ }
}

export function listCards(pageKey) {
  return readAll()[pageKey] || []
}

// Every card across every page/module — what ReviewTab needs to build its
// cross-domain due/later queue (mirrors how it already scans all of
// DOMAINS' foundation blobs for completed modules).
export function listAllCards() {
  const all = readAll()
  const out = []
  for (const pageKey of Object.keys(all)) {
    for (const c of all[pageKey] || []) out.push({ ...c, pageKey })
  }
  return out
}

export function addCard(pageKey, card) {
  const all = readAll()
  all[pageKey] = [...(all[pageKey] || []), { ...card, ts: card.ts || Date.now() }]
  writeAll(all)
}

export function removeCard(pageKey, id) {
  const all = readAll()
  const arr = all[pageKey] || []
  writeCardTombstones(pageKey, arr.filter(c => c.id === id).map(c => c.id))
  all[pageKey] = arr.filter(c => c.id !== id)
  if (!all[pageKey].length) delete all[pageKey]
  writeAll(all)
}

// Bump the SM-2-lite counters after a review. Same { reviews, lastReviewed }
// shape ReviewTab's own msl-review-v1 store uses for modules — just inline
// on the card itself, since each card is already its own addressable item
// (unlike modules, which share one blob per domain).
export function markCardReviewed(pageKey, id) {
  const all = readAll()
  const arr = all[pageKey] || []
  const idx = arr.findIndex(c => c.id === id)
  if (idx === -1) return
  const prev = arr[idx]
  arr[idx] = {
    ...prev,
    reviews: (prev.reviews || 0) + 1,
    lastReviewed: new Date().toISOString(),
    editedTs: Date.now(), // so annotationsSync's recency check treats this as the newer version
  }
  all[pageKey] = arr
  writeAll(all)
}
