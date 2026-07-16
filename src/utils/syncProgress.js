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
  'msl_landscape_region',
  'msl_difficulty_filter',
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
    for (const { key, value } of data) {
      if (!keyIsOwned(key)) continue
      if (typeof value !== 'string') continue
      localStorage.setItem(key, value)
    }
  } catch {}
  return { error: null }
}
