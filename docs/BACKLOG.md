# MSL Backlog — leftover work

_As of 2026-07-03. Everything **conversion-critical is done** — MSL is a complete interview gym
(L2 case-chains + spoken practice shipped). This file logs the deferred work so nothing is lost
while focus moves to GSL. Nothing here blocks using MSL._

Companion docs: `docs/DRILL_SYSTEM_RUBRIC.md` (the portable interview-gym rubric),
`AUDITS.md` (health log), `CLAUDE.md` (session briefing / current state).

---

## Add-to-track sweep completed — 2026-07-03

Added `AddTrackBtn` to the 3 MSL content surfaces that still lacked it: the JUDGE drill browser (`src/components/judge/DrillBrowser.jsx`, type `drill` → tab `judge_browser`), ML Coding rounds (`src/tabs/MLCodingTab.jsx`, `ml_code` → `mlcoding`), and System Design → Design Drills (`src/tabs/SystemDesignDrills.jsx`, `sd_drill` → `design`). Registered the 3 new types in `src/tabs/MyTracksTab.jsx` (ITEM_TYPE_LABEL + TYPE_TAB with Open→ nav). Button-in-button avoided via flex-wrapper / role="button" restructures. MSL foundations (all 19 families) + the 6 interview/content tabs already had it, so + coverage is now complete across MSL. Verify: all edited files + whole App bundle clean (esbuild@0.21.5).

---

## Content Map search indexes all modules + track add/remove toggle — 2026-07-03

(1) **Search bug (reported: "data quality audit" returns nothing):** the Cmd+K Content Map (`ContentMap.jsx`) searched `SEARCH_INDEX` (196 curated tab-level entries) + tabs — NOT the ~203 foundation modules, so module titles like "Data Quality Audit" never surfaced. Built `src/data/foundationsModuleIndex.js` (`FOUNDATION_MODULE_INDEX` — flat {id:tabId, moduleId, label, desc, domain} over all 19 module families, mirrors the ReviewTab FAMILIES registry). Imported into `ContentMap.jsx`, appended to `allItems`; `go()` now sets `localStorage['msl_goto_module']` when a result carries `moduleId` so the family tab opens that exact module; `SearchRow`/Enter pass the full item. Verify: 203 modules indexed, "data quality"→found; ContentMap + App bundle clean. (2) **Track remove:** Add-to-Track popover could only add; added `removeItemRef`/`removeModuleFromTrack`/`removeGenericFromTrack` to `utils/tracks.js` and made `AddToTrackPopover.handleToggle` remove-when-already-added (untick ✓), rows always clickable with tooltip. Verify: tracks.js + popover + App bundle clean.

---

## Depth-audit + Pricing track authored — 2026-07-03

Ran a full structural depth-audit over all ~203 MSL foundation modules (bundled each `*Modules.js`, checked summary length / keyPoints / checkQuestions / recap / takeaway per module). Result: **196/203 already at the S-tier bar** — the earlier "≈190 unaudited/uneven" worry was wrong; MSL content is strong. The ONLY gap was `pricingModules.js` (7 modules), which were honest `skeleton: true` outlines (spec-only, runner showed "in development"). Authored all 7 to full S-tier depth matching `recsysModules.js` (summary w/ [FIGURE], keyPoints, takeaway, checkQuestions, recap, inline SVG figures; removed skeleton/spec): price_elasticity_of_demand, revenue_vs_margin_objective, price_optimization_under_constraints, dynamic_and_surge_pricing, causal_price_experiments (A/B + geo/diff-in-diff + switchback), promotion_and_discount_uplift, willingness_to_pay_and_competition. Verify: bundle clean; field check = 7/7 at bar, 0 skeleton flags left. MSL is now effectively 203/203 at the S-tier bar. NOT pushed.

---

## Implement Drills — auto-graded from-scratch coding — 2026-07-03

MSL already ran Python in-browser (`python.js` Pyodide + `PythonCell` show-stdout), but had NO auto-grading (problems said "Expected ~0.236, verify yourself"). Added an auto-graded "write it from scratch → run → pass/fail" layer. New `src/components/GradedCell.jsx` — `MLImplementBrowser` (exercise card list) + default `GradedCell` (prompt + editor prefilled from `starter` + **Run** [stdout] + **Check** [composes `userCode + tests`, grades: no exception = green all-pass + onSolved, else rose error] + reveal-solution + progressive hints); reuses `../python.js` `loadPython`/`runPython`, MSL-native styling. 8 numpy exercises `src/data/mlCodeExercisesList.js` (re-exported via `mlCodeExercises.js`): sigmoid, zscore-standardize, gini-impurity, entropy-infogain, logistic-gradient-step, kmeans-one-iteration, confusion-prf1, roc-auc-rank. **Real logic verification (sandbox python3 + numpy): all 8 → solution passes, starter fails.** Integrated into `MLCodingTab.jsx` as a mode toggle ("Coding rounds" [existing curated problems] | "Implement drills" [graded]) — own localStorage key `msl_ml_code_exercises_done`, no orphan surface. Verify (esbuild@0.21.5): GradedCell + index + MLCodingTab + whole App bundle clean; 8/8 resolve. Pyodide runtime verified only by bundle (real run on macOS). Mirrors the GSL runnable-coding layer built same day (shared program item 2). NOT pushed.

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

## 2026-07-05 — MEGA-SESSION (full detail in root CLAUDE.md)
- 3 modules finished + 3 new InteractivePanel interactives + 14 TRAINER_QUESTIONS (ids 121-134, domains Recommender Systems + Experimentation).
- Difficulty ordering: `utils/foundations/sortByDifficulty.js` (user hand-extended RANK — keep) wraps all 19 `tabs/foundations/*FoundationTab.jsx` + GradedCell MLImplementBrowser.
- Mobile: MyTracksTab `.mytracks-*` master-detail + Cheatsheet `.grid-cols-N-mobile` (index.css). App shell + family tabs already had `.foundation-split`+drawer.
- Wave 3: ProfilePage 5-card + company logos (CompanyLogo + COMPANY_DOMAINS, 28); ProgressTab canonical section reorder.
- NEXT = SEO (root HANDOFF-SEO.md): port GSL's build-time prerender to MSL public content.
- Fixed same session: `computeReadiness()` was sourcing "Foundations" coverage from a dead legacy
  tracker (`msl_foundations_read`, only written by GradientTab's blog-post reader) instead of the
  real per-family module trackers — see `src/utils/readiness.js`. Also `upsertLeaderboardRow` was
  defined but never called anywhere (dead export) — signed-in users never got a leaderboard row
  regardless of activity; wired into `App.jsx` on sign-in and `LeaderboardTab.jsx` on mount.

## LOGGED 2026-07-05 — content-quality feedback: end-of-section takeaway MCQs too easy
A real user (friend of the account owner, engaged enough with MSL to notice this) reported that the
takeaway/recap MCQs at the end of foundation sections are too easy to answer correctly — the phrasing
or length of the correct option gives it away without needing to actually reason through the content
(e.g. the right answer is noticeably longer/more complete, or uses more precise technical language than
the distractors). This is a **content-writing problem, not a code bug** — same category as the GSL
from-zero pedagogy rewrite already done (see root CLAUDE.md, "MEGA-SESSION 2026-07-04/05"). Needs a
real difficulty pass across the takeaway-question banks: shorter/more parallel-structured distractors,
remove length/precision tells, consider near-miss distractors that require real discrimination. Scope:
all `checkQuestions`/takeaway MCQ arrays across the 19 `*FoundationTab.jsx` families' data files
(`src/data/foundations/*Modules.js`). Not started — queued for next content work.

## 2026-07-07 — browser-back fix: tracks→module Back landed in Foundations
**Bug (user report):** open a module from My Tracks → browser Back went into the Foundations tab, not back
to the track. **Root cause:** MSL navigation never created history entries — `setHash()` in `App.jsx` used
`history.replaceState` exclusively; `goTo()` was pure React state. Back popped whatever stale real entry
existed (typically an old `?module=…#<tab>` URL), and the `hashchange` listener routed there. MSL was the
only lab with this flaw (PAL pushes via `history.pushState` App.jsx:1110; GSL/PL assign `location.hash`).

**Fix (root-level, app-wide):**
- `App.jsx` `goTo(tabId, openTarget, opts)`: pushes a real history entry on user navigation (strips stale
  query); `hashchange` handler calls `goTo(t, null, { push: false })` so browser moves never double-push;
  bare-URL (no hash) now routes home; unknown hashes (`#/u/…`) untouched. Sync effect keeps `replaceState`.
- New `navOrigin` state (`{ tab: 'my_tracks', trackId }`) set via `opts.origin`, passed to all tab
  components alongside `openModuleId`.
- `MyTracksTab.jsx`: selection synced to URL (`?track=<id>#my_tracks`, `syncTrackUrl()`) — browser Back from
  a module restores the SAME track; new `openTrackId` prop for explicit reopen; `onNavigate` wrapped to
  carry origin from `TrackDetail`.
- All 19 `tabs/foundations/*FoundationTab.jsx`: accept `navOrigin`; the "← All modules" button becomes
  "← Back to My Tracks" (→ `onNavigate('my_tracks', trackId)`) while viewing the module opened from a track;
  reverts to normal once the user browses to another module.

**Verify:** esbuild bundle pass on all 21 touched files (npx esbuild@0.21.5). Real build Mac-only. Also
gives every tab-level navigation (sidebar, search, practice cards) working browser Back for free. Module
selection *within* a foundation tab is still not hash-encoded (Back from module B inside a tab goes to the
previous tab, not module A) — acceptable for now; full module-level routing is the SEO/prerender workstream.

## 2026-07-08 — SEO prerender shipped + LAB-STANDARDS residual contract fixes (C4/C5/C8)

**SEO/prerender.** `scripts/prerender-modules.cjs` (new) — 206 foundation modules (all 19
`src/data/foundations/*Modules.js` families, confirmed uniform schema) → `public/modules/<id>.html`,
title/summary/keyPoints/takeaway/recap rendered as real HTML, CTA to the owning family tab (moduleId→tabId
map built from each `*FoundationTab.jsx`'s `TAB_ID`). 5 ids collide across tracks (e.g. `calibration` in 3
tracks) — disambiguated with a `--<tabId>` suffix rather than dropping content; 206/206 generated, 0
skipped. Also discovered and FIXED two pre-existing, unwired prerender scripts
(`scripts/build-prerendered-posts.mjs` for the 182-post Gradient blog, `scripts/build-sitemap.mjs`):
their regex-based extraction silently dropped 8 posts with double-quoted titles/excerpts and mis-handled 2
real duplicate slugs. Replaced the regex with the same balanced-bracket/string-aware `vm` scanner used for
prerender-modules — all 8 recovered, dupes cleanly deduped. `package.json` `"build"` now runs
prerender-modules → build-prerendered-posts → build-sitemap → generate-rss → `vite build`; `"prerender"`
added for sandbox-only verification. Final: 206 modules + 180 unique posts + 10 static = 396 sitemap URLs.
`public/robots.txt` created (didn't exist). BASE_URL `https://ml-systems-lab-v9xe.vercel.app`,
parameterized via `SITE_BASE_URL`. Verify: `node`-ran the full chain in-sandbox, sample HTML has real
prose + correct CTAs, sitemap XML-valid (396 `<url>` entries).

**C4 (stale params) — real bug, fixed.** `setHash(tabId)` passed a bare `#${tabId}` on the `push:false`
path (browser hashchange, the auth reactive redirect) — a hash-only relative URL, which browsers resolve
against the CURRENT address INCLUDING its query string. A stale `?scenario=`/`?tier=`/`?problem=` from
whatever tab you'd just been on could survive into the next tab's URL (e.g.
`?scenario=stf03#classical_ml_foundation`), later wrongly re-triggering that tab's own read-once
URL-param auto-open logic on refresh. Fixed: `setHash` now always writes the explicit
`window.location.pathname + '#' + tabId`, mirroring `goTo`'s existing query-stripping `targetUrl`
construction.

**C5 (auth transitions bypass goTo) — fixed.** `SIGNED_OUT` (`App.jsx` ~1057) and the reactive
signed-in-lands-on-Progress redirect (~1067) both called raw `setActiveTab(...)`, skipping `goTo` entirely
— no history entry, and stale `pendingOpen`/`navOrigin` from whatever the user was viewing survived past
sign-out. Both now route through `goTo`: `SIGNED_OUT` → `goTo('home')` (real user action → real push,
preserves the pre-signout trail on Back); the reactive redirect → `goTo('progress', null, { push: false })`
(a corrective bounce, not a user nav — `push:false` avoids a Home↔Progress back-button loop while still
getting goTo's stale-state cleanup for free). Required hoisting `pendingOpen`/`navOrigin`/`goTo` above the
auth effect (was declared later in the component body — the auth effect referencing it directly in a
dependency array would have hit a TDZ error at render time, not just async).

**C8 (Tracks/Review-Queue launchers don't consume openModuleId) — re-confirmed via grep, then fixed in
all 6 flagged tabs.** `grep -n "openModuleId" src/tabs/{Interview,Cheatsheet,CaseStudies,SpotTheFlaw,
CodeBugs,MLCoding}Tab.jsx` → 0 matches in all 6 before this fix, despite every tab receiving the prop
generically from `App.jsx`. Fixed:
- `InterviewPrepTab.jsx` — new effect matches `openModuleId` against `QUESTIONS` (loose id match), resets
  filters + `setOpen(match.id)`.
- `CheatsheetTab.jsx` — two bugs, one fix: `Flashcards`' `AddTrackBtn itemId={String(i)}` used the index
  into the FILTERED `cards` array (shifts per group filter, so the same card got a different id depending
  on which filter was active when added) — switched both the add-side id AND the openModuleId-consuming
  effect to the STABLE index into the full `FLASHCARDS` array. Top-level `CheatsheetTab` forces `tier=0`
  when `openModuleId` is set so `Flashcards` mounts at all.
- `CaseStudiesTab.jsx` — straightforward, `openCase` already keys off `c.id` directly.
- `SpotTheFlawTab.jsx` — the existing `?scenario=` URL-param open only ran in the `useState` initializer
  (once, at mount) — added a reactive effect mirroring `handlePick`'s toggle-open + `replaceState` call so
  a prop change on an already-mounted tab is picked up too.
- `CodeBugsTab.jsx` — each `BugCard` owned local `open` state with zero external control; added a
  `forceOpen` prop + effect, parent resets the domain filter and passes `forceOpen={bug.id === openModuleId}`.
- `MLCodingTab.jsx` — `autoExpand` (on `ProblemCard`) was a `useState` initializer only, same
  non-reactivity issue as CodeBugsTab; added the same effect pattern + a `forceOpenId` state that also
  forces `mode='rounds'` + `activeType=0` (All) so the target problem can't be hidden behind the wrong
  mode/filter.

**Verify:** all 8 touched files (App.jsx + 6 tabs + this entry's prerender scripts) esbuild@0.21.5-clean;
only pre-existing unrelated duplicate-key warnings in App.jsx. NOT pushed.

---

## MCQ length-tell fix + CheckQuestion consolidation — 2026-07-08

Companion to the same-day GSL quiz-rebalance fix and root `CONTENT-AUDIT-RUBRIC.md`. Two changes:

**1. Shared `CheckQuestion` component.** New file `src/components/foundations/CheckQuestion.jsx` replaces
the `CheckQuestion` function that was duplicated verbatim across all 19 `src/tabs/foundations/*FoundationTab.jsx`
files. All 19 now `import { CheckQuestion } from '../../components/foundations/CheckQuestion'` instead of
defining it locally — JSX call sites (`<CheckQuestion q={...} options={...} answer={...} />`) unchanged, so
existing single-letter `answer: 'A'` questions render identically. New capability: `answer` can also be an
array of letters (`['A','C']`) for a "Select all that apply" multi-select question — checkbox UI, a "Check
answer" button (since multiple picks are needed before grading), exact-set correctness. esbuild-verified
clean on all 19 tab files + the shared component itself.

**2. MCQ length-tell fix, all 19 `src/data/foundations/*Modules.js` files.** Same bug pattern as GSL: each
module's `checkQuestions` quiz had its correct option almost always the longest/most-detailed of the 4 —
guessable without reading. Built `_verify_mcq_balance.mjs` (repo root, untracked) — bundles a data file via
`npx -y esbuild@0.21.5` (this repo's own `node_modules/esbuild` is a macOS binary synced from the user's
Mac and crashes in the Linux sandbox — always route through npx), measures option character lengths
(stripping the literal backtick-wrapped `A)`/`B)` prefix), flags a question if the correct option is the
single longest OR its length exceeds the wrong-options' average by >20%. Baseline full-repo sweep: 795
questions, 781 flagged (98.2%). Fixed all 19 files by hand (trim over-long correct answers, expand
under-detailed distractors with plausible-but-wrong technical claims, correct answer letter never changed)
in 4 parallel batches, iterating per-file against the script until at/under the ~30% target, PLUS exactly
one `checkQuestions` entry per module converted to multi-select (`answer: ['X','Y']`) per the user's
"at least one multi-option question per module" rule.

Final full-repo verification (re-run independently after all batches, not trusted from agent self-report —
this is the exact lesson learned from GSL's failed first pass):

| File | Flagged after |
|---|---|
| banditsModules.js | 0/22 (0.0%) |
| causalModules.js | 7/28 (25.0%) |
| classicalMLModules.js | 14/59 (23.7%) |
| dataModules.js | 13/57 (22.8%) |
| deepLearningModules.js | 0/28 (0.0%) |
| evalModules.js | 0/50 (0.0%) |
| graphMLModules.js | 0/20 (0.0%) |
| mathStatsModules.js | 0/36 (0.0%) |
| monitoringModules.js | 0/16 (0.0%) |
| optimizationModules.js | 7/42 (16.7%) |
| pricingModules.js | 1/14 (7.1%) |
| probabilisticMLModules.js | 1/19 (5.3%) |
| productionModules.js | 0/33 (0.0%) |
| recsysModules.js | 7/26 (26.9%) |
| rlModules.js | 0/22 (0.0%) |
| selfSupervisedModules.js | 3/23 (13.0%) |
| systemDesignModules.js | 0/30 (0.0%) |
| timeSeriesModules.js | 5/25 (20.0%) |
| unsupervisedModules.js | 0/39 (0.0%) |

All 19 files at or well under the ~25-35% chance-level target (several at 0%, meaning the strict
longest-option rule never trips — expected given the rule's strictness, not itself a red flag). Every
module across all 19 files got exactly one multi-select conversion (matches module-count per file).
esbuild plain syntax-check clean on all 19 data files.

A couple of subagents flagged pre-existing (not introduced by this pass), separate answer-key correctness
concerns spotted while rebalancing — `hypothesis_testing` and `sampling_distributions` in
mathStatsModules.js, `ablation` in evalModules.js — left untouched since the task scope was length-balance
only, not answer-key correctness. Worth a follow-up content-correctness pass if wanted (see root
`CONTENT-AUDIT-RUBRIC.md` category 4, unverified/incorrect factual claim).

**Not pushed.** Standard MSL git workflow — `rm -f .git/index.lock .git/HEAD.lock` before staging,
`git add src/ docs/` (never touch anything outside those), hand to Sidharth's Mac for build+push.
