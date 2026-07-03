# MSL Backlog — leftover work

_As of 2026-07-03. Everything **conversion-critical is done** — MSL is a complete interview gym
(L2 case-chains + spoken practice shipped). This file logs the deferred work so nothing is lost
while focus moves to GSL. Nothing here blocks using MSL._

Companion docs: `docs/DRILL_SYSTEM_RUBRIC.md` (the portable interview-gym rubric),
`AUDITS.md` (health log), `CLAUDE.md` (session briefing / current state).

---

## System Design Drills (staged trainer) — 2026-07-03

Added a staged, rubric-scored ML-system-design **drill** — the interview-simulation the SD surface lacked (existing SD modules teach + quiz, but there was no attempt-each-stage-then-reveal + self-score drill). New section `Design Drills` inside `SystemDesignTab.jsx` (`MODULES` array, placed first; `import SystemDesignDrills from './SystemDesignDrills.jsx'`). Component `src/tabs/SystemDesignDrills.jsx` — MSL-native styling (inline styles + `--prime`/`--ink-*`/`--rim`/`--mint`/`--rose`, no Tailwind/cyan): scenario picker → per-stage attempt-first `considerations` checklist → "reveal model coverage" (strong=mint / traps=rose / probes) → final 7-dim rubric self-scorecard with readiness verdict + focus areas; localStorage remembers last scenario. 6 scenarios in `src/data/foundations/sdScenariosMSL-a.js` (credit-default-scoring, feed-ranking-recsys, fraud-detection) + `sdScenariosMSL-b.js` (realtime-serving-feature-store, search-ranking-ltr, demand-forecasting), combined via `sdScenariosMSL.js`. Each = 5 stages (requirements → architecture → deep-dive → evaluation → tradeoffs) with {ask, 6-9 considerations, 5-7 strong, 3-4 traps, 2-3 probes} + a 7-dim rubric. Verify (sandbox esbuild@0.21.5): index + SystemDesignDrills + SystemDesignTab bundle clean; node check = 6/6 full-standard. Mirrors the GSL SystemDesignTrainer built same day (shared program to close the #1 senior-signal gap in both labs). NOT pushed — macOS build + approve-first commit.

---

## New KNOW track — Recommender Systems — 2026-07-03

Promoted RecSys from a *subtopic* of `system_design_foundation` to its own dedicated KNOW foundation, `recsys_foundation` (additive; the existing System Design RecSys modules were left intact and are the shared home for two-tower/funnel detail, this new track is the deep first-principles home). 8 staff-level causal-chain modules matching the exact foundation module schema (`{ id, interactiveId?, interactivePrompt?, title, subtitle, difficulty, estimatedMin, tags[], summary (markdown + [FIGURE:] refs), keyPoints[], takeaway, checkQuestions[{q,options,answer}], recap[], figures{} }`).

**Modules (`src/data/foundations/recsysModules.js`):**
1. `two_stage_architecture` — candidate generation → ranking exists because a precise ranker over 10M items (~1ms each = 10,000s) blows a ~100ms budget by 100,000×, forcing a cheap recall stage then an expensive precision stage; retrieval recall is an unraiseable ceiling.
2. `candidate_generation` — joint scoring ties an item's vector to the querying user (impossible at scale) → two-tower decouples it → precompute item embeddings offline + ANN lookup; trained with in-batch negatives + hard-negative mining + logQ popularity correction.
3. `learning_to_rank` — pointwise optimizes absolute score (order-blind) → pairwise minimizes inversions (LambdaMART weights pairs by NDCG delta) → listwise optimizes the whole list (NDCG-aligned); the loss must match the ranking objective.
4. `features_and_freshness` — batch vs real-time features matched to signal decay → train/serve skew (one feature, two implementations) and non-point-in-time joins both hide behind good offline metrics; feature store + as-of joins close both.
5. `cold_start` — user cold start (popularity/context/onboarding/real-time embedding) vs item cold start (content features make a new item embeddable day 1); exploration is the bridge that turns cold items warm.
6. `feedback_loops_bias` — a recommender trains on logs it generated → position bias + popularity bias contaminate raw clicks → closed-loop causal trap → IPS (weight by 1/P(shown|position)) fed by randomization recovers unbiased relevance (doubly-robust / counterfactual LTR same family).
7. `offline_online_eval` — recall@k/NDCG@k/MAP/AUC on biased logs diverge structurally from CTR/dwell/retention (biased logs, counterfactual blindness, metric≠objective, system effects); offline filters, online A/B decides.
8. `multi_objective_tradeoffs` — any single short-term signal has a pathological maximum (CTR→clickbait) → value model fuses calibrated heads with weights tuned online vs a long-term north-star; engagement-vs-quality is a delayed-feedback trap (Netflix/YouTube objective redesign); guardrails ride as negative weights.

Interactives reused (not new): `retrieval_funnel_viz` (modules 1–2), `value_model_mixer_viz` (modules 3, 8). Modules 4–7 are prose-only by design (freshness/skew/cold-start/bias/eval have no clean existing viz).

**Wiring (all additive; no existing ids/routes/hashes/localStorage keys changed):**
- `App.jsx` — lazy import `RecSysFoundationTab`; TAB registry entry `{ id:'recsys_foundation', component:RecSysFoundationTab }` (after system_design); ZONE map `recsys_foundation: 'know'`; NAV KNOW → SYSTEMS & APPLIED group entry `label:'Recommender Systems'` (after ML System Design).
- `src/tabs/foundations/RecSysFoundationTab.jsx` — mirrors ClassicalMLFoundationTab exactly (TAB_ID `recsys_foundation`).
- `src/utils/foundations/recsysFoundationProgress.js` — localStorage key `msl-recsys-foundation-v1`.
- Aggregate registries: `ProgressTab.jsx` FOUNDATION_STORES, `ReviewTab.jsx` import + DOMAINS (spaced-rep), `MyTracksTab.jsx` TAB_LABELS.

Verify: all 5 JSX files acorn-jsx OK; `recsysModules.js` + progress util `node --check` OK; ESM import confirms 8 modules, all required fields present, every checkQuestion has 4 options + a valid A–D answer. (Caught + fixed one unescaped backtick code-span `` `score = …` `` inside a template-literal summary — the known GradientTab-class hazard — by switching to bold/plain text.)

---

## Nav/naming fixes — 2026-07-03

Three surgical display-only nav fixes (no ids/routes/hashes/localStorage keys touched):

1. **JUDGE → Drills nesting collapsed.** The single-child "Drills" wrapper (only child = `judge_browser`) now renders directly as a leaf labelled **"Judgment Drills"**. Added a `flattenWhenSingle: true` flag on the group + a conditional in the sidebar group renderer (`App.jsx` ~line 912): when the flag is set and `items.length === 1`, render the lone item as a bare `SidebarNavItem`. Re-nests automatically if a second drill type is added. `judge_browser` id/route/hash/desc preserved.
2. **"Capstone" framing removed.** MSL's BUILD/tab arcs are parallel modules, not one capstone. Renamed the two user-facing devBrief macros: `AirflowTab.jsx` ("Capstone AirflowTab module" → "Airflow at Scale — the final module in the arc") and `dbtTab.jsx` ("Capstone dbt module" → "dbt at Scale — the final module in the arc"). Wording only; no functionality changed.
3. **"Incident Room" → "Cross-Domain Incidents"** (display label/copy only; id `incidentroom`, route, hash, component filename, and all localStorage keys unchanged). Changed in: `App.jsx` NAV_SECTIONS JUDGE item + JUDGE group label (CAPSTONE → INCIDENTS) + onboarding-step object; `IncidentRoomTab.jsx` TabHeader title + "New to…" body line; `AboutTab.jsx` reference. (Gate-copy object at ~line 200 already reads "Production incident diagnosis" — no user-facing "Incident Room" string there.)

All 5 edited files parse clean (acorn-jsx, 2022/module): App.jsx, IncidentRoomTab.jsx, AboutTab.jsx, AirflowTab.jsx, dbtTab.jsx.

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

---

## 2026-07-03 — Pricing skeleton + first company track + Incident-Room prose rename

### Task A — Pricing Analytics as a premium-niche KNOW track (SKELETON, shipped as in-development)
New files:
- `src/data/foundations/pricingModules.js` — 7 module OUTLINES, each `skeleton: true` with a
  `spec` (1–2 line summary). Canon: price_elasticity_of_demand, revenue_vs_margin_objective,
  price_optimization_under_constraints, dynamic_and_surge_pricing, causal_price_experiments,
  promotion_and_discount_uplift, willingness_to_pay_and_competition.
- `src/utils/foundations/pricingFoundationProgress.js` — mirrors recsysFoundationProgress.js;
  KEY = `msl-pricing-foundation-v1`.
- `src/tabs/foundations/PricingFoundationTab.jsx` — clone of RecSysFoundationTab runner. When a
  module has `skeleton: true` it renders `<SkeletonBody>` (amber "In development" banner +
  "What this module will cover" from `spec` + "Planned components" checklist) INSTEAD of authored
  content. The header also carries an "In development" badge. Add-to-Track + Mark-as-reviewed still work.
  To ship a module: author summary/keyPoints/etc. and drop the `skeleton` flag — runner auto-switches.

Wiring (mirrors recsys_foundation EXACTLY, additive):
- `App.jsx`: lazy import `PricingFoundationTab`; registry `{ id: 'pricing_foundation' }`;
  `TAB_TO_ZONE.pricing_foundation = 'know'`; KNOW nav entry under SYSTEMS & APPLIED
  (label "Pricing Analytics", desc marked "(In development.)").
- `ProgressTab.jsx`: FOUNDATION_STORES row (total 7).
- `ReviewTab.jsx`: import PRICING_MODULES + DOMAINS row.
- `MyTracksTab.jsx`: TAB_LABELS `pricing_foundation: 'Pricing Analytics'`.
Did NOT add an interactive (skeleton modules have no interactiveId).

### Task B — First populated company track: Meta · ML Engineer · Senior
`src/data/companyTracks.js` — `COMPANY_TRACK_ITEMS['Meta|ML Engineer|Senior']` = 23 ordered items,
all REAL tab ids + verified deep-link module ids. Arc: RecSys mental model (recsys_foundation ×5) →
ML system design (system_design_foundation ×4) → production (production_foundation ×2) →
eval (eval_foundation ×3) → monitoring (monitoring_foundation ×2) → mlcoding → incidentroom +
judge_browser → casestudies → ranking_project → interview → mock_interview. Every other grid cell
stays clean coming-soon. (Note: ranking_project is itself a wip skeleton tab — real & registered,
renders its own in-development state.)

### Task C — Finished "Incident Room" → "Cross-Domain Incidents" user-facing prose rename
Renamed (display text only, all point to the JUDGE `incidentroom` tab):
- `HomeTab.jsx` JUDGE card desc.
- `MLCodingTab.jsx` ×2 CTAs ("Cross-Domain Incidents →", "Try multi-step diagnosis in Cross-Domain Incidents").
- `CheatsheetTab.jsx` ×3 study-task strings (Day 3, Day 4, Day 6).
- `PlansTab.jsx` feature-table label ("Cross-Domain Incidents (12 cases)").
Deliberately LEFT (distinct surfaces / internal, per spec): SystemDesignTab "ML Incident Room"
sub-module + its GradientTab post label + searchIndex entry + _legacy GlobalSearch; StaffLayer
"Multi-Team Incident Room"; all drill `source:` strings and comments in systemDesign.js / drillPool.js;
id `incidentroom`, routes, hashes, localStorage keys.

### Verify
acorn-jsx parse OK on every new/edited file (pricingModules.js, pricingFoundationProgress.js,
PricingFoundationTab.jsx, App.jsx, ProgressTab.jsx, ReviewTab.jsx, MyTracksTab.jsx, companyTracks.js,
HomeTab.jsx, MLCodingTab.jsx, CheatsheetTab.jsx, PlansTab.jsx). No npm build (Mac-only).

---

## 2026-07-03 — BUILD frame: navigate to a landing page instead of accordion-expanding

**What changed.** Clicking **BUILD** in the left sidebar no longer opens the accordion to list the
6 Project Labs inline; it now navigates to a right-pane **BUILD landing page** (`src/tabs/BuildHubTab.jsx`)
that renders the same 6 labs as a card grid. Each card deep-links to its project tab. Only BUILD changed —
KNOW / DO / JUDGE / PREP keep their accordion behavior.

**Implementation (additive/surgical).**
- New `src/tabs/BuildHubTab.jsx` — exports `BUILD_PROJECTS` (single source of truth: projectlab/Telco,
  loan_default/Loans, fraud_detection/Fraud, ranking_project/Ranking [wip], forecast_project/Forecasting [wip],
  nlp_content_project/NLP-Content [wip]) + default `BuildHubTab` component (green `#22c55e` BUILD accent,
  StartHere-style cards, "In development" pill on `wip:true`, `onNavigate` per card).
- `App.jsx`:
  - lazy `BuildHubTab` + static `import { BUILD_PROJECTS }` (plain array, safe to import eagerly).
  - registered `{ id: 'build', component: BuildHubTab }` in `ALL_TABS`; added `build: 'build'` to `TAB_TO_ZONE`.
  - NAV_SECTIONS `build` entry: added `landing: 'build'` and set `items: BUILD_PROJECTS` (DRY — mirrors the hub).
  - DesktopSidebar frame-header: `onClick={() => { if (isLanding) goToClose(section.landing); else toggleFrame(section.id) }}`.
    Accordion suppressed for landing frames: `const isLanding = !!section.landing; const frameOpen = isLanding ? false : …`,
    the `SidebarCollapsible` block is wrapped in `{!isLanding && ( … )}` (items never rendered as a sidebar list),
    and the chevron is swapped for a → arrow. `frameActive` also lights when `activeTabId === section.landing`.
- Preserved: all 6 project ids/routes/hashes/localStorage — still directly routable via `ALL_TABS`; only reached
  through the landing now. BUILD landing is not gated (the projects themselves stay in `PREMIUM_TABS`).

**Verify.** acorn-jsx parse OK on `src/App.jsx` + `src/tabs/BuildHubTab.jsx`. No npm build (Mac-only).
