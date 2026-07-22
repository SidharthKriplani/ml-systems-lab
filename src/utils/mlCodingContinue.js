// Shared "Continue" resolution for ML Coding (Q1 leftover: port PAL's
// sqlLabContinue.js pattern to MSL). Single write site, single read site.
//
// SCOPE NOTE (honest deviation from the "typed-wins" ask): PAL's typed-wins
// semantics compare against a live query draft in `pal-sql-query-<id>` —
// that draft-persistence mechanic does not exist anywhere in MSL's ML Coding
// surface (grep-confirmed: neither ProblemCard's PythonCell nor the drills
// GradedCell/MLImplementBrowser persist in-progress code to localStorage).
// Building "typed wins" here would mean either (a) fabricating a signal that
// isn't real, or (b) first adding new draft-persistence to the live coding
// editors — a bigger, separate-scope change with its own risk. Neither done
// here. This ports last-OPENED tracking only (PAL's own v1, pre-typed-wins),
// which is a real, honest, correctly-scoped subset. FLAG: typed-wins proper
// needs draft-persistence added to PythonCell/GradedCell first — a follow-up
// ticket, not a silent gap.
//
// ML Coding has two independent id spaces sharing one tab (mode toggle):
// 'rounds' (curated PROBLEMS, id like "mlc1") and 'drills' (auto-graded
// ML_CODE_EXERCISES). The continue key carries which mode the id belongs to
// so the caller can restore the correct mode + item.

const KEY = 'msl-mlcoding-last-open-v1';

export function writeMLCodingLastOpen(id, mode) {
  if (!id || (mode !== 'rounds' && mode !== 'drills')) return;
  try { localStorage.setItem(KEY, JSON.stringify({ id, mode, ts: Date.now() })); } catch {}
}

// Returns { continueItem, mode } or { continueItem: null, mode: null } if
// nothing resolves (stale id no longer present, or nothing opened yet).
export function getMLCodingContinueInfo(problems, exercises) {
  let last = null;
  try { last = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
  if (!last || !last.id || !last.mode) return { continueItem: null, mode: null };

  if (last.mode === 'rounds') {
    const p = (problems || []).find(p => p.id === last.id);
    return p ? { continueItem: p, mode: 'rounds' } : { continueItem: null, mode: null };
  }
  if (last.mode === 'drills') {
    const e = (exercises || []).find(e => e.id === last.id);
    return e ? { continueItem: e, mode: 'drills' } : { continueItem: null, mode: null };
  }
  return { continueItem: null, mode: null };
}
