import { applyAnnotationMerge } from './annotationsSync.js'
// ── Progress sync — push/pull all msl_* keys to Supabase ─────────────────────
//
// Table: user_progress (user_id, key, value, updated_at)
// See docs/SETUP_AUTH.md for the CREATE TABLE SQL.
//
// Static keys are listed explicitly. msl_score:* and msl_activity_* keys are
// collected dynamically by scanning localStorage.

import { supabase } from './supabase.js'

const STATIC_PROGRESS_KEYS = [
  'msl_access',
  'msl_theme',
  'msl_tab',
  'msl_role',
  'msl_bookmarks',
  'msl_streak',
  'msl_last_visit',
  'msl_read',
  'msl_onboarded',
  'msl_trainer_history',
  'msl_combinator_history',
  'msl_verbal_history',
  'msl_staff_reveals',
  'msl_defense_progress',
  'msl_takehome',
  'msl_casestudies',
  'msl_projectlab_churn_data',
  'msl_projectlab_loan_data',
  'msl_projectlab_fraud_data',
  'msl_spot_the_flaw',
  'msl-review-v1',            // spaced-repetition schedule (ReviewTab) - was device-only
  'msl-last-touched-v1',      // Continue-strip: last foundations module opened
  'msl_landscape_region',
  'msl_difficulty_filter',
  // Annotations (2026-07-22): stickies + highlights + delete-tombstones.
  // Pull side merges these per-item (see annotationsSync.js) instead of the
  // remote-overwrite rule used for plain progress keys.
  'lab-stickies-v1',
  'lab-stickies-tomb-v1',
  'msl_page_highlights_v1',
  'msl_page_highlights_v1-tomb-v1',
  // Q3 Wave A item 1 (2026-07-22): "Add to review" cloze cards. Same shape
  // + same per-item merge as the two annotation pairs above.
  'msl-review-cards-v1',
  'msl-review-cards-v1-tomb-v1',
]

function collectAllKeys() {
  const keys = [...STATIC_PROGRESS_KEYS]
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if ((k.startsWith('msl_score:') || k.startsWith('msl_activity_') || k.startsWith('msl_done_')) && !keys.includes(k)) {
        keys.push(k)
      }
      // Foundation family completion keys (e.g. msl-classical-ml-foundation-v1) — these
      // gate the Interview QnA tab, so they must follow the signed-in user, not the device.
      if (k.startsWith('msl-') && k.includes('-foundation-v') && !keys.includes(k)) {
        keys.push(k)
      }
    }
  } catch {}
  return keys
}

/**
 * Push all local progress to Supabase (upsert).
 * Call after sign-in or when user manually syncs.
 */
export async function pushProgressToSupabase(user) {
  if (!supabase || !user) return { error: null }
  const keys = collectAllKeys()
  const rows = []
  try {
    for (const key of keys) {
      const val = localStorage.getItem(key)
      if (val !== null) {
        rows.push({ user_id: user.id, key, value: val, updated_at: new Date().toISOString() })
      }
    }
  } catch {}
  if (rows.length === 0) return { error: null }
  return supabase.from('user_progress').upsert(rows, { onConflict: 'user_id,key' })
}

// Is this a key THIS module owns? The user_progress table is shared with other
// sync systems (tracksSync.js's 'msl-tracks-v1' row stores a {tracks, tombstones}
// envelope with its own item-level merge). Blindly writing every pulled row into
// localStorage overwrote 'msl-tracks-v1' with that envelope — an object where
// tracks.js expects an array — crashing every tracks consumer with
// "TypeError: e is not iterable" for every signed-in user (2026-07-16 bug).
function keyIsOwned(k) {
  return STATIC_PROGRESS_KEYS.includes(k)
    || k.startsWith('msl_score:')
    || k.startsWith('msl_activity_')
    || (k.startsWith('msl-') && k.includes('-foundation-v'))
}

/**
 * Pull progress from Supabase and write to localStorage.
 * Call after sign-in to restore progress from another device.
 * Remote values win over local on conflict (most recent device sync wins).
 * Only keys this module owns are applied — see keyIsOwned().
 */
export async function pullProgressFromSupabase(user) {
  if (!supabase || !user) return { error: null }
  const { data, error } = await supabase
    .from('user_progress')
    .select('key, value')
    .eq('user_id', user.id)
  if (error || !data) return { error }
  try {
    const ANNOT_PAIRS = {
      'lab-stickies-v1': 'lab-stickies-tomb-v1',
      'msl_page_highlights_v1': 'msl_page_highlights_v1-tomb-v1',
      'msl-review-cards-v1': 'msl-review-cards-v1-tomb-v1',
    }
    const TOMB_TO_STORE = Object.fromEntries(Object.entries(ANNOT_PAIRS).map(([st, t]) => [t, st]))
    for (const { key, value } of data) {
      if (!keyIsOwned(key)) continue
      if (ANNOT_PAIRS[key]) { applyAnnotationMerge(key, ANNOT_PAIRS[key], value, null); continue }
      if (TOMB_TO_STORE[key]) { applyAnnotationMerge(TOMB_TO_STORE[key], key, null, value); continue }
      if (typeof value !== 'string') continue
      localStorage.setItem(key, value)
    }
  } catch {}
  return { error: null }
}
