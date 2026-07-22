// Continue-strip: remembers the last Foundations module opened, so
// ProgressTab can render a "Continue where you left off" strip. Ported from
// PAL's sqlLabContinue.js pattern (T3-followup v2/v3), adapted for MSL:
// foundation modules have no "typed draft" state to prefer over "last
// opened" the way PAL's SQL query editor does (no free-text input per
// module), so this is last-opened only — no typed-wins branch. Honest
// deviation from the PAL pattern, logged in EXEC-LEDGER.md (Q1).
//
// Stored as a plain JSON string under a STATIC_PROGRESS_KEYS entry (see
// syncProgress.js) — the generic push/pull treats localStorage values as
// opaque strings against MSL's TEXT column, so JSON.stringify/parse here is
// all that's needed for safe cross-device sync (no object-vs-text risk).

const KEY = "msl-last-touched-v1";

export function writeLastTouched({ tabId, moduleId, title }) {
  if (!tabId || !moduleId) return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ tabId, moduleId, title: title || "", ts: Date.now() })
    );
  } catch {}
}

export function getLastTouched() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.tabId || !parsed.moduleId) return null;
    return parsed;
  } catch {
    return null;
  }
}
