# MSL Backlog — leftover work

_As of 2026-07-03. Everything **conversion-critical is done** — MSL is a complete interview gym
(L2 case-chains + spoken practice shipped). This file logs the deferred work so nothing is lost
while focus moves to GSL. Nothing here blocks using MSL._

Companion docs: `docs/DRILL_SYSTEM_RUBRIC.md` (the portable interview-gym rubric),
`AUDITS.md` (health log), `CLAUDE.md` (session briefing / current state).

---

## Current state snapshot (for quick context)

- **Nav:** top personal strip (Home · Profile · My Progress · Review · My Tracks · Leaderboard · Start Here · Plans · Resources · About) → frames **KNOW · DO · BUILD · JUDGE · PREP & ASSESS**. Landscape retired; EXTRAS dissolved.
- **KNOW:** foundation rooms (17), each deep-openable via `goTo(tabId, moduleId)` + `openModuleId`.
- **JUDGE:** `judge_browser` = **440-drill** tag-driven browser (mcq 386 · multistep 24 · code 17 · rubric 13; 10 subjects; junior→staff) + **Incident Room** (14 multi-step incidents, now with multi-company logos).
- **PREP & ASSESS:** **Interview Questions** (Q&A 210 w/ model answers + multi-company logos · Behavioral/STAR 24 · **Speak** = tiered spoken drill) · **Drill** (MCQ untimed/timed) · **Company Tracks** (scaffold).
- **Readiness:** PAL-style capped-breadth score + "work next: weakest area" (streak excluded from score). Home is a readiness front door. **Review room** = spaced-rep over completed modules.
- **My Tracks:** deep-opens items, groups by source, URL-title fallback.
- **Interactives:** capability-aware shell (no dead Play buttons); the flagged play/throttle/contrast/fit/clutter issues fixed; `--amber`/`--teal` tokens defined (was rendering figures black).

---

## Backlog by priority

### P1 — useful, not urgent
- **Drill-completion tracking** in `DrillBrowser.jsx` — mark drills done + surface "unfinished S-tier drills." (Browser currently filters but tracks no completion.)
- **Extend Review room to drills/Q&A** — `ReviewTab.jsx` spaced-rep currently covers foundation *modules* only; pull in drills + questions.
- **Answer-length tiers on written answers** — the Speak mode has 30s/2-min/deep; the *read* view (`InterviewPrepTab` model answers) does not.

### Content polish
- **Recaps for lower-weight rooms** — deepened for 5 high-weight rooms (SysDesign/RecSys, Eval, DL, Optimization, Causal — 57 modules). Remaining rooms still terse: data, monitoring, production, time_series, RL, bandits, graph_ml, self_supervised, probabilistic_ml, unsupervised, math_stats, classical_ml remainder. Same style as the done ones.
- **Beginner explainer text** — progressive-disclosure hand-holding for juniors (PAL has this; MSL doesn't). Do as an expandable "new here?" layer so it doesn't bloat senior view.
- **Full "should-play?" interactive triage** — every *flagged* interactive is fixed; a blanket per-item pass over the rest was not done (many are correctly slider-driven — it's a judgment triage, not "add play everywhere").

### Scaffolds awaiting content (structure done, content empty by design)
- **BUILD project labs** — Ranking / Forecasting / NLP-Content are skeletons (`ProjectLabSkeleton` + specs), not real Pyodide notebooks. Build order per interview value: Ranking first (RecSys JD relevance).
- **Company Tracks** — `src/data/companyTracks.js` grid (28 companies × 4 roles × 4 levels) is empty. Push curated `{ tabId, target, label, kind }` items into `COMPANY_TRACK_ITEMS`; they open directly via the deep-link already wired.
- **Profile / LinkedIn enrichment** — "where you work + as what" + LinkedIn connect (PAL parity). Not built.

### Portability (do once, across labs)
- The **My Tracks properties** (deep-open, source grouping, URL fallback) and the **Speak-mode** pattern + **case-chain drill schema** should be ported to GSL/PAL rather than reinvented. `DRILL_SYSTEM_RUBRIC.md` is the template.

---

## Known caveats
- **No runtime verification available in the build sandbox** (Vercel build is Mac-arch only). All work is verified by acorn parse + code review, not by clicking the deployed build. Visual/runtime issues may only surface on deploy — screenshot and fix reactively.
- **Retired components still in the repo, off-nav** (VerbatimTab, DefenseDocTab, CaseStudiesTab, LandscapeTab, old scenario tabs). Harmless (unreachable from nav); can be hard-deleted later.
- **Internal strategy docs must NOT be pushed to the public repo** — `EXTERNAL-ASSESSMENT.md` and any pricing/strategy files. This backlog + rubric are safe to commit.

---

## Next session
If continuing MSL: start at **P1** (drill tracking → Review-to-drills). If moving to GSL: run
`DRILL_SYSTEM_RUBRIC.md` against GSL as step one, expect the same L2/spoken weakness, fix those first.
