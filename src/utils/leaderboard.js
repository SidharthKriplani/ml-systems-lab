// Leaderboard — ranks signed-in users by total problems/modules solved across ALL rooms.
//
// Total is computed directly from saved progress (localStorage), using the same per-room
// completion predicates the Progress page uses, so the number matches the Progress total.
// Each user only ever writes their own row (RLS); the board is publicly readable.
//
// SQL schema — run once in the Supabase SQL editor:
//   create table if not exists leaderboard (
//     user_id       uuid        primary key references auth.users(id) on delete cascade,
//     display_name  text        not null,
//     total_solved  int         not null default 0,
//     updated_at    timestamptz default now(),
//     room_breakdown jsonb,
//     avatar_url    text,
//     last_active_at timestamptz
//   );
//   alter table leaderboard enable row level security;
//   create policy "Public read leaderboard" on leaderboard for select using (true);
//   create policy "Users upsert own row" on leaderboard
//     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
//
// Optional columns (add with ALTER TABLE if you need them):
//   linkedin_url         text
//   current_company      text
//   current_role         text
//   company_updated_at   timestamptz
//   resume_url           text

import { supabase } from './supabase.js';

// Completion counting is done by a GENERIC scan of every `msl_done_<tabId>_<moduleKey>`
// key (value '1') plus the foundation blobs below — so any room that writes a done
// flag is counted automatically, current or future. (An older hardcoded module map
// lived here; it was unused dead code and referenced retired tabs, so it was removed.)

// ─── Foundation completion key space ─────────────────────────────────────────
// Each key maps to a JSON blob: { [moduleId]: { completedAt: <iso-string> } }
// A module is "done" if its entry has a truthy completedAt.

const FOUNDATION_KEYS = [
  { id: 'math-stats',        key: 'msl-math-stats-foundation-v1' },
  { id: 'classical-ml',      key: 'msl-classical-ml-foundation-v1' },
  { id: 'eval',              key: 'msl-eval-foundation-v1' },
  { id: 'unsupervised',      key: 'msl-unsupervised-foundation-v1' },
  { id: 'causal',            key: 'msl-causal-foundation-v1' },
  { id: 'production',        key: 'msl-production-foundation-v1' },
  { id: 'monitoring',        key: 'msl-monitoring-foundation-v1' },
  { id: 'system-design',     key: 'msl-system-design-foundation-v1' },
  { id: 'dl',                key: 'msl-dl-foundation-v1' },
  // New domains
  { id: 'rl',                key: 'msl-rl-foundation-v1' },
  { id: 'time-series',       key: 'msl-time-series-foundation-v1' },
  { id: 'self-supervised',   key: 'msl-self-supervised-foundation-v1' },
  { id: 'graph-ml',          key: 'msl-graph-ml-foundation-v1' },
  { id: 'bandits',           key: 'msl-bandits-foundation-v1' },
  { id: 'probabilistic-ml',  key: 'msl-probabilistic-ml-foundation-v1' },
  { id: 'optimization',      key: 'msl-optimization-foundation-v1' },
  { id: 'data',              key: 'msl-data-foundation-v1' },
];

// Prefix used by ALL practice-module done flags.
const PRACTICE_PREFIX = 'msl_done_';

// ─── Helper: count completed entries in a foundation blob ────────────────────
function countFoundationKey(lsKey) {
  let raw;
  try { raw = localStorage.getItem(lsKey); } catch { return 0; }
  if (!raw) return 0;
  let val;
  try { val = JSON.parse(raw); } catch { return 0; }
  if (!val || typeof val !== 'object') return 0;
  return Object.values(val).filter(entry => entry && entry.completedAt).length;
}

// ─── computeTotalSolved ───────────────────────────────────────────────────────
// Scans all of localStorage for:
//   1. Keys with prefix 'msl_done_' and value '1'  → each counts as 1
//   2. Foundation blob keys: each entry with completedAt → counts as 1
export function computeTotalSolved() {
  let total = 0;

  // 1. Practice modules — one full scan of localStorage.
  // We count every msl_done_* key with value '1', regardless of tabId, so tracks
  // that don't yet have explicit module lists (airflow, dbt, …) are captured too.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PRACTICE_PREFIX)) continue;
      try {
        if (localStorage.getItem(k) === '1') total += 1;
      } catch { /* ignore */ }
    }
  } catch { /* localStorage unavailable */ }

  // 2. Foundation completions.
  for (const { key } of FOUNDATION_KEYS) {
    total += countFoundationKey(key);
  }

  return total;
}

// ─── Difficulty weighting ─────────────────────────────────────────────────────
// The completion keys (msl_done_<tabId>_<moduleKey> and the foundation blobs)
// carry NO per-item difficulty. The cleanly-reachable difficulty signal is the
// ROOM / DOMAIN a completion belongs to — so we weight each solved item by the
// difficulty tier of its room. This makes the leaderboard reward depth (system
// design, optimization, RL/causal) over grinding easy foundational modules.
//
//   foundational (×1) : math, classical ML, eval, unsupervised, data, basic practice
//   intermediate (×3) : DL, probabilistic, self-supervised, RL, time-series, graph,
//                       bandits, causal, monitoring, production, recsys, pricing, eval practice
//   staff / hard (×6) : system design, optimization, interview design/coding
//
// Anything unmapped falls back to ×1 (never zero), so future rooms still count.
const WEIGHT_FOUNDATIONAL = 1
const WEIGHT_INTERMEDIATE = 3
const WEIGHT_STAFF = 6

// tabId (practice) → weight
const PRACTICE_ROOM_WEIGHT = {
  models: WEIGHT_FOUNDATIONAL,
  features: WEIGHT_INTERMEDIATE,
  eval: WEIGHT_INTERMEDIATE,
  spark: WEIGHT_INTERMEDIATE,
  monitor: WEIGHT_INTERMEDIATE,
  classical: WEIGHT_FOUNDATIONAL,
  gradient: WEIGHT_FOUNDATIONAL,
  ts: WEIGHT_INTERMEDIATE,
  causal: WEIGHT_INTERMEDIATE,
  design: WEIGHT_STAFF,
  interview: WEIGHT_STAFF,
}

// foundation id (from FOUNDATION_KEYS) → weight
const FOUNDATION_WEIGHT = {
  'math-stats': WEIGHT_FOUNDATIONAL,
  'classical-ml': WEIGHT_FOUNDATIONAL,
  'eval': WEIGHT_INTERMEDIATE,
  'unsupervised': WEIGHT_FOUNDATIONAL,
  'data': WEIGHT_FOUNDATIONAL,
  'causal': WEIGHT_INTERMEDIATE,
  'production': WEIGHT_INTERMEDIATE,
  'monitoring': WEIGHT_INTERMEDIATE,
  'dl': WEIGHT_INTERMEDIATE,
  'rl': WEIGHT_INTERMEDIATE,
  'time-series': WEIGHT_INTERMEDIATE,
  'self-supervised': WEIGHT_INTERMEDIATE,
  'graph-ml': WEIGHT_INTERMEDIATE,
  'bandits': WEIGHT_INTERMEDIATE,
  'probabilistic-ml': WEIGHT_INTERMEDIATE,
  'system-design': WEIGHT_STAFF,
  'optimization': WEIGHT_STAFF,
}

function practiceWeight(tabId) {
  return PRACTICE_ROOM_WEIGHT[tabId] != null ? PRACTICE_ROOM_WEIGHT[tabId] : WEIGHT_FOUNDATIONAL
}
function foundationWeight(id) {
  return FOUNDATION_WEIGHT[id] != null ? FOUNDATION_WEIGHT[id] : WEIGHT_INTERMEDIATE
}

// ─── computeWeightedScore ─────────────────────────────────────────────────────
// Same completion scan as computeTotalSolved, but each solved item is weighted by
// its room's difficulty tier (see above). This is the value the leaderboard now
// ranks on — a better proxy for interview readiness than a plain count.
export function computeWeightedScore() {
  let score = 0

  // 1. Practice modules — weight by the tabId extracted from the key.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(PRACTICE_PREFIX)) continue
      try {
        if (localStorage.getItem(k) !== '1') continue
      } catch { continue }
      const rest = k.slice(PRACTICE_PREFIX.length) // '<tabId>_<moduleKey>'
      const sep = rest.indexOf('_')
      const tabId = sep === -1 ? rest : rest.slice(0, sep)
      score += practiceWeight(tabId)
    }
  } catch { /* localStorage unavailable */ }

  // 2. Foundation completions — weight each foundation's completed entries.
  for (const { id, key } of FOUNDATION_KEYS) {
    const n = countFoundationKey(key)
    if (n > 0) score += n * foundationWeight(id)
  }

  return score
}

// ─── computeRoomBreakdown ─────────────────────────────────────────────────────
// Returns { [roomId]: count } for every room that has at least one completion.
// roomId for practice tracks  = the tabId (e.g. 'spark', 'models', …)
// roomId for foundation tracks = the short id from FOUNDATION_KEYS (e.g. 'dl')
export function computeRoomBreakdown() {
  const breakdown = {};

  // Practice modules — group by tabId extracted from the key.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PRACTICE_PREFIX)) continue;
      try {
        if (localStorage.getItem(k) !== '1') continue;
      } catch { continue; }
      // k = 'msl_done_<tabId>_<moduleKey>'
      const rest = k.slice(PRACTICE_PREFIX.length); // '<tabId>_<moduleKey>'
      const sep  = rest.indexOf('_');
      if (sep === -1) continue;
      const tabId = rest.slice(0, sep);
      breakdown[tabId] = (breakdown[tabId] || 0) + 1;
    }
  } catch { /* localStorage unavailable */ }

  // Foundation completions — each foundation gets its own room bucket.
  for (const { id, key } of FOUNDATION_KEYS) {
    const n = countFoundationKey(key);
    if (n > 0) breakdown[`foundation-${id}`] = n;
  }

  return breakdown;
}

// ─── getDisplayName ───────────────────────────────────────────────────────────
// Derives a human-friendly name from OAuth metadata (Google / GitHub).
// Falls back to 'MLEng-XXXX' for email-only sign-ins.
export function getDisplayName(user) {
  if (!user) return 'Anonymous';
  const m = user.user_metadata || {};
  const name = m.full_name || m.name || m.user_name || m.preferred_username;
  if (name && String(name).trim()) return String(name).trim().slice(0, 40);
  const tail = (user.id || '').replace(/-/g, '').slice(0, 4).toUpperCase() || 'XXXX';
  return 'MLEng-' + tail;
}

// ─── isMissingColumnError ─────────────────────────────────────────────────────
// Heuristic: detect PostgREST / Postgres "column does not exist" errors so callers
// can gracefully fall back to the pre-migration schema.
function isMissingColumnError(error) {
  if (!error) return false;
  const code = error.code || '';
  const msg  = (error.message || '').toLowerCase();
  // 42703 = undefined_column (Postgres); PGRST204 = column not found in schema cache
  return code === '42703' || code === 'PGRST204'
    || (msg.includes('column') && (msg.includes('does not exist') || msg.includes('not found') || msg.includes('schema cache')));
}

// ─── upsertLeaderboardRow ─────────────────────────────────────────────────────
// Upsert the signed-in user's row. Safe no-op if Supabase/auth unavailable.
// Tries to write the optional room_breakdown / avatar_url columns; if those
// columns are absent (migration not yet run), retries with the base columns only.
// `extra` can carry additional optional columns (e.g. linkedin_url).
export async function upsertLeaderboardRow(user, extra = {}) {
  if (!supabase || !user) return;
  const base = {
    user_id:      user.id,
    display_name: getDisplayName(user),
    total_solved: computeWeightedScore(),
    updated_at:   new Date().toISOString(),
  };
  const full = {
    ...base,
    room_breakdown: computeRoomBreakdown(),
    avatar_url:     user.user_metadata?.avatar_url || null,
    ...extra,
  };
  try {
    const { error } = await supabase.from('leaderboard').upsert(full, { onConflict: 'user_id' });
    if (!error) return;
    // Likely an unknown-column error — retry with base columns only so the
    // leaderboard still updates before the migration runs.
    if (isMissingColumnError(error)) {
      const { error: e2 } = await supabase.from('leaderboard').upsert(base, { onConflict: 'user_id' });
      if (e2) console.warn('[MSL leaderboard] upsert (base) failed:', e2.message);
    } else {
      console.warn('[MSL leaderboard] upsert failed:', error.message);
    }
  } catch (e) {
    console.warn('[MSL leaderboard] upsert threw:', e && e.message);
  }
}

// ─── touchLastActive ──────────────────────────────────────────────────────────
// Bump the signed-in user's last_active_at = now. Public "last seen" signal —
// call it on app activity (the caller should throttle). Guarded + graceful:
// no-op without a backend, and silently skips if the column is absent (pre-migration).
export async function touchLastActive(user) {
  if (!supabase || !user) return;
  const now = new Date().toISOString();
  const row = {
    user_id:        user.id,
    display_name:   getDisplayName(user),
    total_solved:   computeWeightedScore(),
    last_active_at: now,
    updated_at:     now,
  };
  try {
    const { error } = await supabase.from('leaderboard').upsert(row, { onConflict: 'user_id' });
    if (error && !isMissingColumnError(error)) console.warn('[MSL leaderboard] last-active upsert failed:', error.message);
  } catch { /* ignore */ }
}

// ─── fetchLeaderboard ─────────────────────────────────────────────────────────
// Fetch the top N rows, ranked by total_solved desc then oldest updated_at first
// (to break ties by seniority). Returns an array or null on failure.
export async function fetchLeaderboard(limit = 100) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('user_id, display_name, total_solved, avatar_url, last_active_at, updated_at')
      .order('total_solved', { ascending: false })
      .order('updated_at',   { ascending: true })
      .limit(limit);
    if (error) { console.warn('[MSL leaderboard] fetch failed:', error.message); return null; }
    return data || [];
  } catch (e) {
    console.warn('[MSL leaderboard] fetch threw:', e && e.message);
    return null;
  }
}

// ─── fetchPublicProfile ───────────────────────────────────────────────────────
// Fetch a single user's public profile row. Tries the richer column set first
// (linkedin_url, room_breakdown, employment); if those columns are absent,
// retries with the base columns. Returns a normalized object, or null on
// miss / no backend.
export async function fetchPublicProfile(userId) {
  if (!supabase || !userId) return null;
  const RICH = 'user_id, display_name, total_solved, updated_at, linkedin_url, room_breakdown, current_company, current_role, company_updated_at, resume_url, avatar_url, last_active_at';
  const BASE = 'user_id, display_name, total_solved, updated_at';

  async function run(cols) {
    return supabase.from('leaderboard').select(cols).eq('user_id', userId).maybeSingle();
  }

  try {
    let { data, error } = await run(RICH);
    if (error && isMissingColumnError(error)) {
      ({ data, error } = await run(BASE));
    }
    if (error) { console.warn('[MSL leaderboard] profile fetch failed:', error.message); return null; }
    if (!data) return null;
    return normalizeProfile(data);
  } catch (e) {
    console.warn('[MSL leaderboard] profile fetch threw:', e && e.message);
    return null;
  }
}

function normalizeProfile(row) {
  let breakdown = null;
  const rb = row.room_breakdown;
  if (rb && typeof rb === 'object') {
    breakdown = rb;
  } else if (typeof rb === 'string') {
    try { breakdown = JSON.parse(rb); } catch { breakdown = null; }
  }
  return {
    user_id:            row.user_id,
    display_name:       row.display_name || 'MLEng',
    total_solved:       row.total_solved || 0,
    updated_at:         row.updated_at || null,
    linkedin_url:       row.linkedin_url || null,
    room_breakdown:     breakdown,
    current_company:    row.current_company || null,
    current_role:       row.current_role || null,
    company_updated_at: row.company_updated_at || null,
    resume_url:         row.resume_url || null,
    avatar_url:         row.avatar_url || null,
    last_active_at:     row.last_active_at || null,
  };
}

// ─── updateMyLinkedin ─────────────────────────────────────────────────────────
// Upsert just the current user's linkedin_url. Returns { ok, reason }.
// If the column doesn't exist yet, returns { ok:false, reason:'migration-pending' }
// instead of throwing, so the caller can fall back to local storage / metadata.
export async function updateMyLinkedin(user, url) {
  if (!supabase || !user) return { ok: false, reason: 'no-backend' };
  const row = {
    user_id:      user.id,
    display_name: getDisplayName(user),
    total_solved: computeWeightedScore(),
    linkedin_url: url || null,
    updated_at:   new Date().toISOString(),
  };
  try {
    const { error } = await supabase.from('leaderboard').upsert(row, { onConflict: 'user_id' });
    if (!error) return { ok: true };
    if (isMissingColumnError(error)) return { ok: false, reason: 'migration-pending' };
    console.warn('[MSL leaderboard] linkedin upsert failed:', error.message);
    return { ok: false, reason: 'error' };
  } catch (e) {
    console.warn('[MSL leaderboard] linkedin upsert threw:', e && e.message);
    return { ok: false, reason: 'error' };
  }
}

// localStorage fallback keys for employment fields — written alongside any
// server upsert so the value persists across reloads before the migration runs.
const COMPANY_LS_KEY        = 'msl-company-v1';
const ROLE_LS_KEY           = 'msl-role-v1';
const COMPANY_CONFIRMED_KEY = 'msl-company-confirmed-v1';

// ─── updateMyEmployment ───────────────────────────────────────────────────────
// Upsert just the current user's employment (current_company, current_role) and
// stamp company_updated_at = now. Returns { ok, reason }. If the columns don't
// exist yet, returns { ok:false, reason:'migration-pending' } instead of throwing,
// so the caller can fall back to local storage. Always writes a localStorage
// fallback regardless of the server result.
export async function updateMyEmployment(user, { company, role } = {}) {
  const now = new Date().toISOString();
  // Always keep a local copy so the value persists across reloads pre-migration.
  try {
    localStorage.setItem(COMPANY_LS_KEY,        company || '');
    localStorage.setItem(ROLE_LS_KEY,           role    || '');
    localStorage.setItem(COMPANY_CONFIRMED_KEY, now);
  } catch { /* ignore */ }

  if (!supabase || !user) return { ok: false, reason: 'no-backend' };
  const row = {
    user_id:            user.id,
    display_name:       getDisplayName(user),
    total_solved:       computeWeightedScore(),
    current_company:    company || null,
    current_role:       role    || null,
    company_updated_at: now,
    updated_at:         now,
  };
  try {
    const { error } = await supabase.from('leaderboard').upsert(row, { onConflict: 'user_id' });
    if (!error) return { ok: true };
    if (isMissingColumnError(error)) return { ok: false, reason: 'migration-pending' };
    console.warn('[MSL leaderboard] employment upsert failed:', error.message);
    return { ok: false, reason: 'error' };
  } catch (e) {
    console.warn('[MSL leaderboard] employment upsert threw:', e && e.message);
    return { ok: false, reason: 'error' };
  }
}

// ─── confirmMyEmployment ──────────────────────────────────────────────────────
// Lightweight confirm — used by a "Still accurate?" reminder button.
// Just bumps company_updated_at = now (and the localStorage confirmed timestamp)
// without touching the company/role values. Returns { ok, reason }; guarded the
// same way as updateMyEmployment.
export async function confirmMyEmployment(user) {
  const now = new Date().toISOString();
  try { localStorage.setItem(COMPANY_CONFIRMED_KEY, now); } catch { /* ignore */ }

  if (!supabase || !user) return { ok: false, reason: 'no-backend' };
  const row = {
    user_id:            user.id,
    display_name:       getDisplayName(user),
    total_solved:       computeWeightedScore(),
    company_updated_at: now,
    updated_at:         now,
  };
  try {
    const { error } = await supabase.from('leaderboard').upsert(row, { onConflict: 'user_id' });
    if (!error) return { ok: true };
    if (isMissingColumnError(error)) return { ok: false, reason: 'migration-pending' };
    console.warn('[MSL leaderboard] employment confirm failed:', error.message);
    return { ok: false, reason: 'error' };
  } catch (e) {
    console.warn('[MSL leaderboard] employment confirm threw:', e && e.message);
    return { ok: false, reason: 'error' };
  }
}
