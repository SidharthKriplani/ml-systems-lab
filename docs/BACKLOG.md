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

---

## Backprop text-scene mismatch fix + highlight-to-track MVP + mobile audit — 2026-07-08 (later)

**Backprop content bug found and fixed.** The `backprop` module's prose described a scalar 2-layer sigmoid
toy example (x=2.0, w1=0.5, w2=0.3, "6.6× shrink") that did NOT match the actual `BackpropViz.jsx`
interactive, which renders a completely different 2-input/2-hidden-ReLU/1-sigmoid-output network — a real
Text-Scene Lock violation (see root `3B1B-STANDARD.md`). Worse: that network's ReLU hidden layer barely
shrinks the gradient at all (factor ≈1), so the "6.6× shrink" claim was false for the shipped interactive
regardless. Rewrote `summary` in `deepLearningModules.js` to describe the REAL network with real computed
numbers (x₁=1.0,x₂=0.5 → loss≈0.234, W₂ grad≈−0.115, W₁ grad≈−0.109 — nearly equal because ReLU passes
gradient through untouched; the real toll is the one sigmoid hop at the output, ≈0.25×). Fixed two stale
caption strings in `BackpropViz.jsx` that repeated the same false "6.6× shrink" claim, and softened the
live predict-gate reveal text to stay accurate across every slider position rather than assuming a shrink
direction. Also fixed a real **production-breaking bug**: `scripts/prerender-modules.cjs`'s
`renderCheckQuestions` called `q.answer.trim()` assuming `answer` is always a string — crashed on every
multi-select question (`answer: ['A','B']`) added by this session's quiz fix, which broke `npm run build`
entirely (`prerender-modules.cjs` runs before `vite build` in the build chain) — the whole site failed to
deploy, not just the SEO pages. Fixed to handle both shapes. All re-verified by actually running the
script (not just esbuild syntax-checking) and spot-checking the regenerated `backprop.html`.

**Highlight-to-track MVP, MSL side.** Same mechanism as GSL/PAL (see root `CLAUDE.md` for the full
cross-lab description) — new `src/components/foundations/HighlightPopover.jsx`, `tracks.js` gained
`updateItemMeta`, `MyTracksTab.jsx` renders/edits/navigates highlight items. Now wired on **all 19**
`*FoundationTab.jsx` files (shipped in two passes: 3 families first as a proof point, then the remaining
16 with the identical 3-line diff — import + `contentRef` + `<HighlightPopover>` — applied cleanly to
every file with no structural surprises, confirmed via per-file diff showing exactly 5 changed lines
each). All 19 esbuild-verified clean.

**Mobile-unfriendliness audit + fix, MSL Foundations interactives.** Swept `src/components/interactive/`
(~85 files) against the same 6 patterns as GSL's pass. Zero drag-and-drop, zero hover-only interactions
found anywhere (grep-confirmed) — MSL's interactives were already built touch-safe on those two fronts.
Real bugs found and fixed in the two files touched THIS session: `HighlightPopover.jsx` relied solely on
`mouseup` for selection detection, which doesn't reliably fire for touch-based text selection on mobile —
added a `touchend` listener; also bumped its 18px color swatches and Save button up to 36-40px touch
targets. `BackpropViz.jsx` checked clean (already `viewBox`-responsive, already `auto-fill` grids, no
hover-only logic). Tap-target bumps also landed in `RandomForestViz.jsx`, `AttentionViz.jsx`,
`CrossValidationViz.jsx`, `DecisionTreeViz.jsx`, `ROCCurveViz.jsx` (buttons were 22-30px, now ≥32-36px).
**Not fixed, flagged:** a shared base button style (~28-30px tall) reused across dozens of the remaining
interactive files is borderline-small but not egregious — a full sweep needs a shared style-constant
change repo-wide, out of scope this pass. All touched files esbuild-verified clean.

**Not pushed.** Same standard MSL git workflow as above.

## 2026-07-08 (session cont.) — Deep Learning foundation triage vs 3B1B (all 14 modules)

Ran the same 3B1B-STANDARD.md condensed triage used on GSL this session against MSL's
`src/data/foundations/deepLearningModules.js` (14 modules), per user decision that MSL should also be
measured against 3B1B rather than CONTENT-AUDIT-RUBRIC alone. MSL has no `groundUp`/`explanation`/
`scenario` field names — mapped `summary` (intro) → groundUp's role, the main prose → explanation's role,
closing "NOT this" paragraphs → scenario's role, for the purpose of applying the same 4 checks.

**Architecture check (relevant to trusting this triage):** confirmed MSL's Deep Learning file is a single
flat exported array (`DEEP_LEARNING_MODULES`), imported directly by `DeepLearningFoundationTab.jsx` — NO
multi-file spread/merge system the way GSL's `foundationsRunnerData.js` has. So the GSL-class bug (a good
newer definition silently overridden by an older duplicate spread in later) **cannot occur in this file**.
Found 3 same-title hits in other files (`foundationsSimplify.js`, `quizData.js`, `evalRubrics.js`,
`drills/deepLearning.js`) but confirmed these are separate systems (simplified summaries, quiz bank, eval
rubrics, drill exercises) referencing the same topic name, not competing module definitions — no override
risk. **Not yet done:** this single-file check does not cover MSL's other ~18 foundation-family files
(stats/exp/metrics/rca don't apply, but the other ML-systems families do) for an analogous pattern — open,
unscheduled.

### Needs a fix pass, priority order (by how sharp/high-value the gap is):
1. **Attention Mechanism** — reproduces GSL's `attention` module's exact pre-fix bugs: Q/K/V origin never
   explained (no mention of W_Q/W_K/W_V learned-projection origin), zero worked numeric example anywhere
   (no toy Q·K dot product, no real softmax output — unlike its own CNN/RNN siblings in this same file),
   term named the instant the problem is posed with no prior concrete instance, no metaphor at all. Given
   GSL's fix for the identical problem already exists as a template, this is the fastest high-value port.
2. **Fine-Tuning Strategies** — sharpest single violation in the whole set: `**LoRA: train a tiny add-on,
   freeze the rest.**` and the QLoRA heading both name the technique in the section HEADING itself before
   any concrete instance is shown. No metaphor anywhere. The 4096×4096/rank-8/65K-param worked example
   itself is good — keep it, fix only the naming order + add a metaphor.
3. **DL Model Serving** — same heading-names-first bug on speculative decoding (`**Speculative decoding:
   guess ahead, verify in bulk.**`). Batching section is actually excellent (real "delivery truck" metaphor,
   correctly demonstrated then named) — don't touch that part. Three techniques (batching/KV-cache/spec-
   decoding) read as separate fragments rather than one carried example — consider whether that's
   acceptable (distinct claims, same judgment call made for GSL's `tokenizer`) or needs consolidation.
4. **Deep Learning Optimisers** — no formulas anywhere: Adam/RMSProp/AdaGrad described purely in prose,
   no `v_t`/`m_t`/update-rule ever written out despite this being formula-native, senior-interview content.
   No worked numeric example. No metaphor.
5. **Convolutional Neural Networks** — jargon-first (`"Convolution is the solution... A 3×3 filter slides
   across the image"` — term and mechanism in the same breath), no metaphor at all (contrast with this
   same file's later "gradient highway" language, used elsewhere but not here), hierarchy claim
   (edges→corners→shapes→objects) and receptive-field growth asserted, never traced through one example.
6. **Pre-training & Transfer Learning** — no metaphor (closest is one abstract line, "region of parameter
   space," never developed into a scene); opens as a fresh scenario with no bridge to what the prior
   module in this file's sequence established. The radiology worked example (0.61→0.87 AUC) is good, keep.
7. **DL Training Failure Modes** — crisis-first opening is genuinely well-built and correctly withholds
   jargon, vanishing/exploding gradients correctly demonstrated (10×/10,000× ratio) before naming — but
   the "quick lookup" failure-mode section is four separate one-sentence vignettes, never one worked trace
   through a concrete toy model the way modules 1 and 3 (Neural Net Fundamentals, Backprop) do. No metaphor.
8. **Activation Functions** — real rule-10 violation: re-derives vanishing gradients almost verbatim from
   Backpropagation's own numbers (`~0.25¹⁰ ≈ one-in-a-million`, same as Backprop's identical phrase) with
   zero recall-signal framing ("as you saw," "recall") — restates as new instead of activating recall.
   Also: Backprop's own closing explicitly promises this module picks up on "dead neurons," but it instead
   re-opens with a fresh vanishing-gradient crisis — the specific handoff isn't honored.

### Reasonably clean, no action needed (verified, not just triaged):
- **Neural Network Fundamentals** — XOR is a genuine running example threaded through summary/keyPoints/
  recap. One real gap: universal approximation theorem is asserted ("can approximate any continuous
  function... astronomically many neurons") with no concrete number or worked contrast — minor.
- **Backpropagation** — **numbers independently re-verified by hand this session**: z1=[0.45,0.5],
  a2≈0.516, loss≈0.234, sigmoid'(z2)≈0.25 all confirmed correct; the "W2≈−0.115, W1≈−0.109 — almost the
  same size" claim checks out as mean-|gradient| (W2 mean 0.115 from −0.109/−0.121; W1 mean-abs 0.109 from
  −0.169/−0.085/0.121/0.060). **The previously-logged "6.6× gradient shrink" bug is confirmed fixed — no
  numerical error remains.** Only a minor jargon-order nit (term named before the numeric walkthrough runs).
- **Batch Normalisation & Regularisation** — good crisis-first structure (moving-target scenario before
  naming), reasonably developed metaphor. Gap: no worked numeric computation anywhere (no actual mean/
  variance/γ/β example) — the one thing worth adding, not a full rewrite.
- **RNNs & LSTMs** — strongest of the CNN/RNN pair: vanishing gradient demonstrated with real numbers
  (0.5⁴=0.0625, 0.5²⁰≈10⁻⁶) *before* LSTM is named — correct crisis→inevitability. Gap: the "gradient
  highway" metaphor GSL's register would want only shows up in takeaway/recap, never in the summary itself
  where the teaching actually happens — arrives too late to do its job.
- **Transformer Architecture** — best continuity in the whole set: explicitly recalls the RNN/CNN module's
  residual discussion ("exactly the vanishing-gradient fix from earlier"), correct crisis→term sequencing
  for positional encoding. Gap: no worked numeric trace anywhere (FFN's "4×" width and RoPE are asserted,
  never computed) — same gap as Attention, lower severity since the rest of the module is solid.
- **Quantisation & Model Efficiency** — best of all 14. Real sustained metaphor ("256 evenly spaced
  buckets") that survives into the outlier-handling section and cashes out precisely every time. Behavior
  shown before "quantization" is used as a load-bearing term. One clean worked example throughout.

### Method note (mirrors the GSL entry — do not re-litigate)
Structural check (single-file, no multi-source override risk) is done and closed for this file specifically.
Editorial/qualitative verdicts above rest on a single triage agent's read each — not independently
re-verified line-by-line except where explicitly marked "verified" (Backprop's numbers). Treat the 8
"needs work" items as the actionable list; the 6 "reasonably clean" items need at most the one gap noted
per module, not a rewrite.

---

## Hover/tap glossary for foundation modules — 2026-07-08 (Task 1 of a 3-lab glossary rollout)

Built a hover (desktop) / tap (mobile) glossary for the 19 foundation families (~206 modules): a defined
technical term anywhere in a rendered module's prose gets a dotted underline; hovering or tapping pops a
short definition plus a "→ Full lesson: <module title>" pointer to where it's fully taught.

**Mechanism — single injection point, zero changes to the 19 `*FoundationTab.jsx` files or any
`*Modules.js` data file.** All 19 tabs already route prose through one shared renderer,
`src/utils/renderMd.jsx`. Its `renderInline()` splits paragraph text on `**bold**`/`` `code` ``/`$math$`
and maps each piece; the plain-text pieces (the `else` branch, previously `return part`) now get a
second regex pass via a new `applyGlossary()` helper, which runs `text.split(GLOSSARY_RE)` (one
alternation regex built from every glossary key, longest-first so phrases like "pr-auc" are tried before
"auc") and wraps any matched, not-yet-seen term in `<GlossaryTerm>`. "First occurrence only" is tracked
with a `Set` (`usedGlossaryTerms`) declared once at the top of `renderMd()`'s body and threaded through
all 4 of its `renderInline()` call sites (lede paragraph, regular paragraphs, the two callout blocks) —
since each module body is one `renderMd()` call, the Set naturally resets per module render and is shared
across the whole body, giving "wrap first mention per module" for free.

**Files:**
- `src/data/glossary.js` (new) — `GLOSSARY` dict (key = lowercase match string → `{term, def,
  sourceModuleId, sourceModuleTitle, sourceTabId}`), `GLOSSARY_KEYS_SORTED` (longest-first), and
  `GLOSSARY_PATTERN` (the escaped alternation string, consumed by renderMd.jsx to build the actual
  RegExp). Matching only works reliably for terms whose first/last char is a plain word character —
  documented in the file header why symbol-only terms (e.g. "R²") were deliberately excluded rather than
  key'd, since `\b` can't bound a match ending in a non-word unicode symbol.
- `src/components/foundations/GlossaryTerm.jsx` (new) — dotted-underline `<span>`, hover
  (mouseenter/mouseleave) or tap-toggle (onClick, works for touch since touch fires a click event too;
  outside-click/outside-touch listener closes it), popover positioned `absolute` above the term (no
  portal needed — didn't observe clipping in the foundation-tab layout). Theme-matched to
  `renderMd.jsx`'s existing palette (`--prime`, `--depth`, `--rim`, `--ink-hi`, `--ink-mid`, `--ink-low`,
  `--font-mono`). Co-located with `CheckQuestion.jsx` per the existing shared-component convention.
- `src/utils/renderMd.jsx` (edited) — imports `GLOSSARY`/`GLOSSARY_PATTERN`/`GlossaryTerm`; builds
  `GLOSSARY_RE` once at module scope; `renderMd()` declares `usedGlossaryTerms`; `renderInline()` now
  takes a second param and its final plain-text branch calls the new `applyGlossary()` instead of
  returning the raw string.

**Seed data — 22 terms from 3 already-S-tier modules** (per this file's own S-tier callouts):
- `linear_regression` (`classicalMLModules.js`, family `classical_ml_foundation`) — 9 terms: least
  squares, residual, mean squared error, collinearity, heteroscedasticity, leverage, Cook's distance,
  Gauss-Markov theorem, ordinary least squares.
- `auc_roc` (`evalModules.js`, family `eval_foundation`) — 6 terms: true positive rate, false positive
  rate, AUC, PR-AUC, calibration, Mann-Whitney U statistic.
- `cross_validation` (`evalModules.js`, family `eval_foundation`) — 7 terms: k-fold cross-validation,
  stratified k-fold, group k-fold, walk-forward validation, purge gap, nested cross-validation, data
  leakage.

Each definition is a trimmed version of the sentence that first introduces the term in that module's
actual prose (not invented).

**Pointer status: LABEL-ONLY, not clickable, this pass — flagged as the natural follow-up.** Real
in-app navigation to a specific module already exists and works (`onNavigate(tabId, moduleId)` →
`goTo()` in `App.jsx` → `pendingOpen` → `openModuleId` prop, already consumed by e.g.
`ClassicalMLFoundationTab.jsx`). But wiring it into `GlossaryTerm` would require threading an
`onNavigate` prop from each `*FoundationTab.jsx` through `renderMd()`/`renderInline()` down to
`GlossaryTerm` — i.e. editing all 19 tab files, exactly the surface this task was scoped to leave
untouched (the whole point of the single-injection-point design). Left as plain text: "→ Full lesson:
<module title>".

**Verify (esbuild@0.21.5, sandbox):** `src/utils/renderMd.jsx`, `src/data/glossary.js`, and
`src/components/foundations/GlossaryTerm.jsx` all bundle clean in isolation (the 3 files this task's
verify step named). Also spot-checked two full consuming tab files
(`ClassicalMLFoundationTab.jsx`, `EvalFoundationTab.jsx`) — both surfaced a **pre-existing, unrelated**
esbuild parse error in `deepLearningModules.js` (a backtick-inside-template-literal at
`clip_grad_norm_`, transitively pulled in via `foundationsModuleIndex.js`'s all-modules search index)
plus pre-existing duplicate-`interactiveId`-key warnings in several `*Modules.js` files — neither is
caused by or related to this glossary change; both exist independent of it and are out of this task's
scope to fix.

Not pushed — no git commands run, per instructions for this task.

---

## Deep Learning 3B1B writer pass + Go-Deeper skeleton pilot + recap coverage check — 2026-07-08 (later still)

Executed the writer pass (Pass 1 only, per `3B1B-STANDARD.md` — no adversarial Pass 2 run, that needs a
genuinely separate reviewer) against the 8 modules this file's own earlier triage (`2026-07-08 (session
cont.) — Deep Learning foundation triage vs 3B1B`, above) flagged as needing work, in the priority order
that entry gave. All edits confined to `src/data/foundations/deepLearningModules.js` (content) and
`src/tabs/foundations/DeepLearningFoundationTab.jsx` (Go-Deeper skeleton only).

**8 modules fixed, in priority order:**
1. **Attention** — added the Q/K/V origin (W_Q/W_K/W_V are learned matrices, trained by the same
   backprop as every other weight — stated at first appearance per voice rule 12), a library-catalog
   metaphor for Q/K/V plus a paint-blending metaphor for the attention operation itself, and a full
   worked numeric example: 2-dim toy embeddings, real W_Q/W_K/W_V, computed q_bank=[1,3],
   k_The/k_bank/k_river=[1,1]/[2,0]/[4,2], raw scores 4/2/10, scaled scores 2.83/1.41/7.07, softmax
   weights 1.4%/0.3%/98.2%, blended output ≈[1.98,1.97] (≈v_river=[2,2]) — every number independently
   recomputed in Node, not eyeballed. Also fixed the term-named-before-demonstration issue (two concrete
   disambiguation instances — riverbank vs. financial bank — before naming "attention") and gave the
   module a specific continuity opening naming the LSTM module's ~200-step ceiling. Populated
   `deeperMath` (see below) with the Var(q·k)=d_k derivation, the exact softmax Jacobian
   p_i(δ_ij−p_j), and the 4·d_model² multi-head parameter identity — all re-verified by hand/Node.
2. **Fine-Tuning Strategies** — removed the heading-names-the-technique-first violation on both LoRA and
   QLoRA; added a "sticky note on a textbook page" metaphor; LoRA's 4096×4096/rank-8/65,536-param/99.6%
   numbers preserved exactly, now introduced before the term "LoRA" instead of after; QLoRA reframed as a
   second crisis (frozen base still ~140GB) → fix → name, instead of a pre-named heading.
3. **DL Model Serving** — fixed the same heading-first violation on speculative decoding only (the
   batching section was already flagged as excellent and left untouched); now poses "every token, even
   easy ones, pays for a full pass" as the crisis before naming the technique. Left the
   batching/KV-cache/speculative-decoding three-part structure as distinct fragments — a deliberate,
   noted judgment call (same class of call already made and logged for GSL's `tokenizer` module).
4. **Deep Learning Optimisers** — the biggest gap (zero formulas, zero worked numbers, no metaphor).
   Added: a "hiker with a terrain-sensing cane" metaphor; the actual AdaGrad/RMSProp/Adam update rules
   (v_t, m_t, bias correction, the real w_t update); a worked AdaGrad trace (busy weight v_3=3 vs. a rare
   weight still at v=1 after 99 silent steps — both recomputed); and an Adam bias-correction trace for
   step 1 (g_1=1.0 → m_1=0.1, v_1=0.001 → m̂_1=v̂_1=1.0 → update ≈ −η already, explaining *why* Transformer
   warmup exists, not just asserting that it does) — every number re-verified in Node.
5. **Convolutional Neural Networks** — added a stencil metaphor (a reusable cut-out pattern held over any
   patch of a surface) developed *before* naming "convolution," fixing the jargon-first opening; all
   original numbers (100,352 params, 9-weight filter, 11×11 receptive field at layer 5) preserved exactly.
6. **Pre-training & Transfer Learning** — added a specific continuity opening naming the Transformer
   module's architecture focus as what this module does NOT cover; developed the previously-undeveloped
   "region of parameter space" line into a full mountain-range/base-camp/short-hike metaphor tied
   concretely back to the 0.61→0.87 AUC numbers (the from-scratch stall = a random fog-drop with only
   500 tries; pre-training = a helicopter ride to base camp).
7. **DL Training Failure Modes** — added an ER-doctor "check pulse and breathing before the specific
   complaint" metaphor, plus a continuity line from Model Serving; replaced the four disconnected
   one-sentence vignettes with one continuous worked debugging trace on a single toy classifier (loss
   frozen at log(2)=0.693 → traced to a stray `.detach()` → fixed, single-batch loss to 0.02 → rerun full
   training → NaN at step 47, gradient norm 8.2→41.6→NaN → traced to missing clipping → fixed, loss to
   0.19 by epoch 10), with the remaining two failure modes kept as a short compact pair rather than forced
   into the same narrative (both real numbers, not scattered abstractions).
8. **Activation Functions** — fixed the real rule-10 violation: the module now opens by explicitly
   honoring Backprop's own promised handoff ("ReLU trades vanishing gradients for the dead neuron — that's
   where this module starts") instead of re-deriving the 0.25¹⁰ vanishing-gradient fact as if new; the
   sigmoid-saturation recap of that fact is now framed with explicit recall language ("As you saw in
   Backprop…") per voice rule 10, and the dead-neuron section explicitly contrasts itself against the
   vanishing-gradient failure it was just recalled from ("a different failure... not the signal shrinking
   everywhere, but going *exactly, permanently* zero for one neuron").

**Not touched:** `keyPoints` and `checkQuestions` on all 8 modules (out of scope per 3B1B — narrative-only
rewrite); the 6 modules this file's own triage called "reasonably clean."

**A bug I introduced and then fixed, flagging for the record:** one of my edits to the `dl_debugging`
narrative used un-escaped literal backticks around `.detach()`, `clip_grad_norm_`, and `log(0)` inside the
`summary` template literal (itself backtick-delimited) — the exact "GradientTab-class hazard" this file's
`recsysModules.js` entry already warned about. Caught it myself via the mandated esbuild verification
step and fixed it (removed the inner backticks, kept the code terms as plain text) before moving on. Note
for whoever reads the concurrent **Hover/tap glossary** entry directly above this one: its "pre-existing,
unrelated esbuild parse error... at `clip_grad_norm_`" callout was very likely this exact bug, caught
mid-flight while both sessions were editing the repo at the same time — it is fixed now; re-run esbuild on
`deepLearningModules.js` if in doubt (confirmed clean as of this entry).

**Recap tightening (task 2a):** MSL already has a per-module recap mechanism — `recapMode` toggle +
"Quick recap" button, duplicated across each `*FoundationTab.jsx` (same duplication pattern the shared
`CheckQuestion` component replaced elsewhere) — this was NOT built new, it already existed. Tightened/
extended the `recap` array for all 8 rewritten Deep Learning modules to reflect the new worked examples,
metaphors, and formulas (arrow notation, bold load-bearing term, half the length of the matching
`keyPoints` bullet, per `3B1B-STANDARD.md`'s keyword-spine standard). Spot-checked recap quality across
3 of the other 18 families (`dataModules.js`, `monitoringModules.js`, `classicalMLModules.js` — sampled
multiple modules per file) to decide whether a wider sweep was warranted: all sampled recaps were already
tight, bold-term-led, arrow/formula-dense, and NOT restated-as-paragraph — already at the keyword-spine
bar. Did not do a wholesale rewrite across the other 18 families since the sample didn't surface a real
gap; if a genuine terse/verbose recap turns up in a family not sampled here, treat this as an open item,
not a closed one.

**Go-Deeper / academic-tier skeleton (task 2b):** Confirmed there is NO shared module-detail wrapper
component across MSL's 19 `src/tabs/foundations/*FoundationTab.jsx` files — each duplicates its own render
tree (Concept/Key Insight/interactivePrompt/InteractivePanel/Key Points/CheckQuestions blocks); only
`CheckQuestion`, `HighlightPopover`, `InteractivePanel`, and `AddToTrackPopover` are shared sub-components,
not the module-detail view itself (this matches what the highlight-to-track MVP entry already found and
logged in root `CLAUDE.md`). Per the task's own instruction for this case, **piloted the skeleton on ONE
family only: Deep Learning.** `DeepLearningFoundationTab.jsx` gained a `deeperOpen` state (reset alongside
`recapMode`/`trackPopoverOpen` on module change) and a collapsed "Go Deeper — Academic" section, rendered
only when `selected.deeperMath` exists, placed between the interactive panel and Key Points — closed by
default. Populated `deeperMath` for the `attention` module only (3 items: the Var(q·k)=d_k derivation, the
exact softmax Jacobian, the 4·d_model² multi-head parameter identity) as end-to-end proof the mechanism
renders; the other 13 Deep Learning modules and all other 18 families have NO `deeperMath` field yet — this
is a real skeleton, not a full rollout, exactly like GSL's own `deeperMath`/`rope` pilot. **A full 19-file
rollout (each tab needs its own copy of the toggle + render block, same as the highlight-to-track MVP's
file-by-file port) is a separate, unscoped follow-up.**

**Verify:** `deepLearningModules.js` and `DeepLearningFoundationTab.jsx` both esbuild@0.21.5-clean
individually (only pre-existing duplicate-`interactiveId`/`interactivePrompt`-key warnings, unrelated to
this session). Also loaded the compiled `deepLearningModules.js` bundle in a real Node `import()` — all 14
modules present, all required fields present, `attention.deeperMath.length === 3`,
`attention.recap.length === 9` — a runtime check, not just a syntax check. Every numeric claim introduced
this session (attention's Q/K/V trace, the softmax scaling comparison, Adam's bias-correction step,
AdaGrad's busy-vs-rare trace, the 4·d_model² identity) was independently recomputed in Node, not accepted
on read-through.

Not pushed — no git commands run, per instructions for this task.

## Item-level module hash-encoding — pilot on Deep Learning Foundations — 2026-07-08 (later still)

Task: give individual foundation modules a real, shareable, refresh-safe URL (companion to GSL's own
same-day pass — see its `docs/GSL_PLAN.md` entry). Read PAL's `src/utils/hashRouting.js`
(`stateToHash`/`parseHash`/`RUNNER_ACTIVE_ID_KEY` pattern) as the reference, then re-read this file's own
"2026-07-07 — browser-back fix" entry above before touching anything — that fix already gave MSL real
`goTo(tabId, openTarget, opts)` history-pushing + a `pendingOpen`/`openModuleId` one-shot deep-link channel,
but the module id it carries was NEVER part of the hash itself (confirmed via that entry's own note: "Module
selection *within* a foundation tab is still not hash-encoded... full module-level routing is the
SEO/prerender workstream"). This session is that workstream's first concrete step. Edited `src/App.jsx` +
one pilot tab (`src/tabs/foundations/DeepLearningFoundationTab.jsx`), per scope — did not touch
`src/data/foundations/deepLearningModules.js` (a concurrent session's content file) or
`InterviewPrepTab.jsx`. Note: `DeepLearningFoundationTab.jsx` had already been edited concurrently by that
same content session (added a `deeperOpen`/"Go Deeper" skeleton, logged in the entry directly above this
one) — re-read the file fresh immediately before editing (it had drifted since an earlier read mid-task)
and merged around the new state rather than clobbering it.

**Format:** `#<tabId>/<moduleId>` — a second hash path segment, not a query param (this project already hit
a real stale-query-param bug once, C4 above — a path segment doesn't have that failure mode).

**App.jsx:**
- `getTabFromHash()` now splits off any second segment before matching `ALL_TABS` (`hash.split('/')[0]`),
  so a `#tabId/moduleId` hash still resolves the right tab on mount.
- New `parseTabHash()` → `{ tabId, moduleId }`, the two-segment-aware sibling used everywhere else.
- `setHash(tabId, moduleId = null)` — now takes an optional module id and appends it as `/moduleId` when
  present; unchanged for callers that only pass `tabId`.
- `pendingOpen`'s initial `useState` now calls `parseTabHash().moduleId` instead of a bare `null` — this is
  the actual fix for "refresh loses your place": before this, `pendingOpen` (which every tab reads as its
  `openModuleId` prop) was ALWAYS `null` at mount regardless of the URL, so even the existing My
  Tracks/search-driven deep link couldn't survive a refresh.
- `goTo(tabId, openTarget, opts)`'s `push !== false` branch now builds `targetUrl` including
  `openTarget` (`'#' + tabId + (openTarget ? '/' + openTarget : '')`) — so calling `goTo` with a module id
  from ANY caller (My Tracks, search, the pilot tab) writes a real, refresh-safe URL, not just the pilot.
- The "Hash + localStorage sync" effect now depends on `[activeTab, pendingOpen]` (was `[activeTab]` only)
  and calls `setHash(activeTab, pendingOpen)` — keeps the hash's module segment in sync with `pendingOpen`
  generally, for free, across all 19 tabs (though only the pilot tab pushes real history entries on its own
  internal selection changes — see below).
- `onHashChange` now uses `parseTabHash()` and calls `goTo(t, moduleId, { push: false })` — browser
  Back/Forward across a `#tabId/moduleId` transition resolves both segments, not just the tab.

**DeepLearningFoundationTab.jsx (pilot):**
- New `syncModuleHash(moduleId)` — pushes `#dl_foundation[/<moduleId>]` via `history.pushState` (a REAL
  history entry, not `setHash`'s `replaceState`) on user-driven selection, mirroring GSL's
  `Concepts.jsx` `syncConceptsHash`. Deliberately `pushState`, not a `location.hash=` assignment — it does
  NOT fire `hashchange`/`popstate` itself, so it never loops back through App.jsx's own hash-sync effects;
  only a genuine browser Back/Forward does, which is exactly what should reconcile state here.
- Wired into the module-row click handler (`setSelectedId(next); syncModuleHash(next)`) and the "← All
  modules" back button (adds `syncModuleHash(null)` to the non-tracks branch, left the tracks branch
  — `onNavigate('my_tracks', ...)` — untouched, matching MSL's existing C6-equivalent behavior).
- The existing `openModuleId` effect (which sets `selectedId` when a module is deep-linked in) now has an
  `else if (openModuleId === null)` branch that clears `selectedId` back to `null` — needed so browser Back
  from `#dl_foundation/<id>` to the bare `#dl_foundation` segment actually closes the module view instead of
  leaving stale content on screen. Only fires when the `openModuleId` PROP itself transitions to `null` (a
  real nav event via `goTo`), never during ordinary in-tab browsing (which doesn't touch `pendingOpen`/
  `openModuleId` at all), so it can't fight with the click handler above.

**Verify:** `npx -y esbuild@0.21.5` on `src/App.jsx` (full bundle) and
`src/tabs/foundations/DeepLearningFoundationTab.jsx` (full bundle) — both clean, only pre-existing unrelated
`duplicate-object-key` warnings from concurrent content-data files (`deepLearningModules.js`,
`evalModules.js`, `productionModules.js`).

**Working:** refresh/paste of `#dl_foundation/<moduleId>` restores the exact module; refresh of bare
`#dl_foundation` shows the module list; browser Back/Forward walks module → module-list correctly; any
`goTo(tabId, moduleId)` caller elsewhere in the app (My Tracks, search) now also gets a refresh-safe URL for
free, even without its own tab doing the pilot's local pushState wiring.

**Still open — the other 18 `tabs/foundations/*FoundationTab.jsx` files need the identical two changes**
(the pilot's `syncModuleHash` helper + the two call-site edits) to get real push-on-selection and
Back-clears-to-list behavior; without that, their module opens still work for refresh/paste (via the
App.jsx-level `pendingOpen`/`setHash` fix, which is generic) but browser Back *within* those tabs won't
walk module-by-module the way `dl_foundation` now does — it'll just fall back to whatever `push:false`
`goTo` resolves to (matches the pre-existing "acceptable for now" caveat in the 2026-07-07 entry above, now
narrowed to 18 of 19 tabs instead of all 19). Not pushed — no git commands run, per instructions for this
task.

---

## Deep Learning + Recommender Systems added to the cat/q-based interview bank — 2026-07-08

**Two-surface clarification (source of the original "gap" report):** MSL has two separate interview-question
surfaces. `src/data/questionBank.js` (`TRAINER_QUESTIONS`, MCQ format, keyed by `domain`, feeds the Trainer
tab) already had "Deep Learning" (22 Qs) and "Recommender Systems" (8 Qs) — left untouched, no duplication
attempted there. `src/data/interviewExtra.js` (`EXTRA_QUESTIONS`, aggregates `interviewExtraFoundations.js` +
`interviewExtraSystems.js` + `interviewExtraModeling.js`, feeds `InterviewPrepTab.jsx`'s inline `QUESTIONS`
array) uses a `cat` field, a 3-tier depth shape (`answer`/`whatsTested`/`antiPattern`/`staffFraming`), and had
ZERO Deep Learning and ZERO Recommender Systems cats before this session — that was the actual gap.

**New files** (both exported and spread into `EXTRA_QUESTIONS` via `interviewExtra.js`):
- `src/data/interviewExtraDeepLearning.js` — exports `EXTRA_DEEP_LEARNING`, ids 4001–4018, **18 questions**
  (10 ported + 8 new).
- `src/data/interviewExtraRecSys.js` — exports `EXTRA_RECSYS`, ids 5001–5020, **20 questions**
  (16 ported + 4 new).
- Grounded in `src/data/foundations/deepLearningModules.js` (14 modules: neural nets → backprop →
  activations → batch norm → optimisers → CNNs → RNNs/LSTMs → attention → transformers → pretraining →
  fine-tuning → quantisation → serving → debugging) and `src/data/foundations/recsysModules.js` (9 modules:
  two-stage architecture → candidate generation/two-tower → learning-to-rank → features & freshness → cold
  start → feedback loops & bias → offline/online eval → multi-objective tradeoffs → DL recsys architectures
  → representation learning/negative sampling).

**Source of the ported content:** GSL (sibling repo) extracted 73 orphaned MCQ-format interview questions
with no home in its own product, scratch-dumped at
`labs/genai-systems-lab/_orphaned_qbank_for_msl.json` (read-only reference, not managed by MSL, not
deleted). A prior GSL-side pass had already determined a 42-question subset was genuine, portable
general ML/DL/RecSys theory (the other 31 — Research Engineer rounds, Staff-judgment calls, "FDE build
round survival," Indic-NLP-for-Sarvam/Krutrim — are GSL-career-specific and were correctly excluded from
both products; see full id list below). Each ported question was reformatted from GSL's MCQ shape
(`question`/`options`/`correct`/`explanation`/`trap`) into this bank's shape: `question`→`q`, `options`+
`correct`+`explanation` folded into a mechanism-level `answer`, `trap` used as raw material for
`antiPattern`, and a **freshly written** `staffFraming` in this bank's own voice (not GSL's `explanation`
copy-pasted) — calibrated against this file's existing Deep-Learning-adjacent and Evaluation-cat sibling
questions for depth.

**Routing of the 42 ported ids (final cat assignment):**
| Destination | ids | count |
|---|---|---|
| Deep Learning | ml-theory-2,3,4,10,12 · firstp-2,3,4,6 · bayesext-4 | 10 |
| Recommender Systems | mlsysdesign-2,3 · firstp-5 · restaste-4 · reco-1..12 | 16 |
| Evaluation (existing cat) | ml-theory-1,5,9,11 · restaste-2,3 · bayesext-1,2,5 | 9 |
| Statistics (existing cat) | ml-theory-6,7 · restaste-1 · bayesext-3 | 4 |
| Regression (existing cat) | ml-theory-8 · firstp-1 | 2 |
| System Design (existing cat) | mlsysdesign-1 | 1 |
| **Total ported** | | **42** |

Reasoning for the non-Deep-Learning routing: these 12 ids tested content with no deep-learning mechanism in
them at all (MSE/MAE outlier diagnosis, val-vs-prod accuracy debugging, multiple-comparison/McNemar
statistics, ablation-study rigor, precision/recall business-cost framing, L1/L2 sparsity, benchmark
contamination, Goodhart's Law, collider bias, conformal prediction/calibration, EM/GMM was the one
default-to-DL exception — no old cat fit it either) — forcing them into Deep Learning would have been a
content-quality error, so they went to whichever old cat (Evaluation/Statistics/Regression/System Design)
or new cat (Recommender Systems, for anything that was clearly ranking/RecSys-specific: position bias in
LTR, sponsored-slot insertion, BPR, CTR-gaming-in-recs) actually matched the content. This reading extends
the letter of "route to an already-existing cat if clearly better" to include Recommender Systems, since
that cat was being built out in this exact same batch (per the task's own Step 3) and forcing recsys-only
content like BPR into "Deep Learning" would have been strictly worse than the alternative.

**31 GSL ids deliberately NOT ported** (already correctly excluded on the GSL side, not re-added here):
`hightc-1..3`, `re-1..10`, `staff-1..8`, `fde-1..5`, `indic-1..5` — Research-Engineer-round, Staff-judgment,
FDE-build-round, and Indic-NLP-for-Sarvam/Krutrim content that is GSL-career-specific and doesn't fit a
Deep Learning or Recommender Systems cat in any product.

**New-written questions** (not ported, grounded directly in the foundation module content, distinct
scenarios from both the ported set and from `TRAINER_QUESTIONS`' existing DL/RecSys MCQs — skimmed
`questionBank.js` ids 13–15, 43–45, 85–90 first to avoid restating the same scenarios, e.g. gradient
checkpointing and BatchNorm-vs-LayerNorm already appear there twice, so the new DL entries on those topics
are framed as distinct decision/debugging scenarios rather than repeat MCQs):
- Deep Learning (8): dying ReLU diagnosis, vanishing-gradient debugging methodology, weight initialisation
  schemes (Xavier/He), mixed-precision training tradeoffs, BatchNorm-vs-LayerNorm as an architecture
  decision, gradient-checkpointing placement strategy, backprop-through-time/exploding gradients in RNNs,
  loss-spike/NaN debugging.
- Recommender Systems (4): multi-objective value-model blending (engagement/diversity/revenue), sequential
  vs. matrix-factorization architecture choice per product surface, embedding-table serving at scale
  (sharding/quantization/hot-cold tiering), offline-online evaluation-gap diagnosis for a staged pipeline
  (distinct cause from the ported reco-3 diversity-tradeoff question — this one is a funnel-consistency
  failure between retrieval and ranking).

**Final counts:** Deep Learning = 18 (10 ported + 8 new). Recommender Systems = 20 (16 ported + 4 new).

**Verify:** id range 4001–4018 / 5001–5020 checked for collisions against all of
`src/data/interviewExtra*.js` (1001–1030, 2001–2026, 3001–3030 already in use) — none found. All three
touched/created files (`interviewExtra.js`, `interviewExtraDeepLearning.js`, `interviewExtraRecSys.js`)
bundle clean via `npx -y esbuild@0.21.5 --bundle --format=esm --loader:.jsx=jsx --external:react
--external:react-dom --external:react/jsx-runtime --outfile=/dev/null`. `InterviewPrepTab.jsx` and
`questionBank.js` were not touched (out of scope per this task's instructions). Not pushed — no git
commands run.

---

## 3B1B voice pass — Causal Foundations, `pot_outcomes` + `rct_design` — 2026-07-08 (writer pass only)

Scope: the 2 Causal-family tier-S modules (`src/data/moduleTiers.js` `TIER_S`), per the root
`3B1B-STANDARD.md` spec. Both live in `src/data/foundations/causalModules.js` (`CausalFoundationTab.jsx`
is the consuming tab). **Writer pass only** — Pass-2 adversarial audit is a separate, later task, not run
here.

**Schema adaptation (MSL differs from GSL, confirmed by reading the actual file before writing anything):**
MSL's causal modules have no `groundUp`/`explanation[]`/`scenario` fields at all — the entire narrative
lives in one `summary` template-literal string (`\n\n`-separated paragraphs, `**bold**`, `[FIGURE: id]`
markers, rendered by `src/utils/renderMd.jsx` under the "Concept" card). `keyPoints`/`takeaway`/
`checkQuestions`/`recap`/`figures` are separate fields and were **not touched**, per the spec's own scope
rule ("does NOT apply to keyPoints/recap/mcqs"). Confirmed via `CausalFoundationTab.jsx` read: `summary` is
the only field rendered through the voice-rule-governed prose path.

### `pot_outcomes` (Potential Outcomes Framework) — real starting state
Already reasonably solid content (Rubin notation, ATE/ATT/CATE, SUTVA/consistency/positivity all present
and correct) but violated voice rule 1 (named "counterfactual" and "fundamental problem of causal
inference" after only ONE concrete instance — User 47 — not two), had zero pause-and-predict beats, and
critically had **no worked numeric example anywhere** — ATE/ITE were asserted algebraically, never computed
on real numbers, despite this topic having a natural worked-example structure (explicitly flagged in the
assigning brief).

**What changed:** rewrote `summary` end to end.
- Opened with TWO concrete instances (User 47 got the email, spent $100 — would they have spent $80
  anyway?; User 12 got no email, spent $70 — would they have spent more with it?) before naming
  "counterfactual" / "the fundamental problem of causal inference" — fixes the rule-1 violation.
- Added a pause-and-predict beat ("if the other branch never exists for anyone, how could any experiment
  ever produce a causal number at all?") before the ATE resolution.
- **New worked numeric example** (the real content gap): a 4-user God's-eye-view toy dataset (User 47
  $100/$80, User 12 $90/$70, User 8 $60/$50, User 90 $40/$30 — treated/untreated), true ATE = (20+20+10+10)/4
  = $15. Then shows what's actually computable from ONE random draw (User 47+8 treated, User 12+90
  control): observed diff = mean($100,$60) − mean($70,$30) = $80−$50 = $30, deliberately far from the true
  $15, to make an honest point about single-draw noise. Then computes the observed-difference estimator
  under **all 6 possible C(4,2) draws** ($55, $30, $10, $20, $0, −$25) and shows the average = 90/6 = $15,
  exactly recovering the true ATE — the actual content of "randomization is unbiased in expectation," shown
  as arithmetic, not asserted.
- Kept all original technical claims (grep-verified present, see below) and substituted the SUTVA/
  positivity illustrative examples for continuations of the same User 47/User 12 running example (spillover
  via forwarding the discount code; positivity via users excluded from the campaign) instead of the
  original's disconnected "high-income users" aside — keeps one running example throughout per scene rule 1.
- `[FIGURE: potoutcomes]` marker kept in place (same SVG figure, untouched).

**Independently re-verified numbers (recomputed by hand this pass, not trusted from the first derivation):**
true ATE = (20+20+10+10)/4 = 15 ✓; one-draw estimate mean(100,60)−mean(70,30) = 80−50 = 30 ✓; all 6
C(4,2) splits recomputed individually — {47,12}=55, {47,8}=30, {47,90}=10, {12,8}=20, {12,90}=0, {8,90}=−25
— sum=90, mean=15, exactly matching the true ATE. This is an exact finite-population randomization-inference
result (not approximate), independently confirmed.

### `rct_design` (RCT Design) — real starting state
Solid on unit-of-randomization tradeoffs, stratification/block randomization, power analysis, and
interference — but had a **real "tested but not taught" gap** (CONTENT-AUDIT-RUBRIC.md category 2): the
subtitle lists "Intent-to-Treat" and `checkQuestions` tests ITT/CACE/LATE arithmetic in depth (`CACE = ITT /
compliance_rate = ITT / 0.80`), but `summary` never mentioned ITT, compliance, or CACE at all. Also opened
with no cross-module continuity even though it's the module immediately after `dag_confounding` in the
tab's difficulty-sorted render order (both `intermediate`, `dag_confounding` first — confirmed via
`sortByDifficulty` + array order).

**What changed:** rewrote `summary` end to end.
- Opened by naming `dag_confounding`'s actual stopping point specifically (adjustment sets / backdoor
  paths / "don't control for colliders or mediators") and recalling Potential Outcomes' randomization
  point by name — satisfies voice rule 11 (cross-module continuity) and rule 10 (recall-signal framing for
  a load-bearing concept already taught, rather than re-deriving it as new).
- Added a pause-and-predict beat on covariate balance ("what's the chance the two groups differ
  systematically on some variable you didn't think to record?").
- Added one numeric fact for the power-analysis paragraph that wasn't there before: required sample size
  scales roughly as 1/MDE², so halving the minimum detectable effect roughly quadruples the sample needed
  (standard, verifiable power-analysis fact — n ∝ 1/Δ²).
- **Filled the ITT gap** with a full concrete worked example, demonstrated in two instances before naming
  the term (never-loads-the-new-page in the treatment arm; hits-a-cached-copy in the control arm) then
  named "Intent-to-Treat (ITT)": if 80% compliance and ITT lift = $6.40/user, then CACE = ITT / 0.80 =
  $6.40 / 0.80 = $8.00 — verified this divides out exactly to $8.00, and matches the *formula* the existing
  `checkQuestions` already test (`CACE = ITT / compliance_rate`) without contradicting any number already on
  record (the checkQuestions never state concrete dollar figures, only the formula pattern).
- Kept all original technical claims (grep-verified, see below).

**Independently re-verified:** $6.40 / 0.80 = $8.00 (exact); 1/MDE² scaling direction (halving MDE →
~4× sample size) is the standard power-analysis result, confirmed against the general formula n ∝
σ²/Δ² for a fixed power/α.

### Technical-claims survival check (Definition of Done #4 — grep, not vibes)
Ran a script that greps the rewritten `summary` strings for every named technique/formula/number from the
originals. All present in both:
- `pot_outcomes`: `Y_i(1)`, `Y_i(0)`, `ITE`, `ATE = E`, `SUTVA`, `Consistency`, `Positivity`, `ATT`, `CATE`,
  `sensitivity analysis` — all found.
- `rct_design`: `4.8%`, `4.3%`, `p = 0.02`, `user-level`, `session-level`, `page-level`, `Stratifying`,
  `block randomization`, `80% power`, `α = 0.05`, `SUTVA`, `p = 0.001`, `0.01%`, `$500K` — all found.

### Length discipline — explicit deviation, not silent
Word counts (measured, not estimated): `pot_outcomes` 397 → 801 words (2.02×); `rct_design` 358 → 723 words
(2.02×). Both exceed the spec's ≤1.3× guideline. This is a **deliberate, flagged deviation**, not padding:
the excess is almost entirely the two worked numeric examples the assigning brief explicitly required
(pot_outcomes' 4-user/6-draw arithmetic; rct_design's ITT/CACE gap-fill), which the modules structurally
lacked before. Trimmed everything else (assumption/estimand paragraphs, closings) back to roughly original
length during a second editing pass rather than leaving first-draft bloat — first draft was ~2.5×, current
is 2.02×. Stating this explicitly per the Definition of Done's "deferrals/deviations must be stated, not
silently shrunk" principle (here it's an expansion, but the same honesty rule applies).

### Explicitly NOT done this pass (deferrals, stated per Definition of Done #6)
- **No scene work.** MSL's Causal family has no scene-registry system like GSL's `foundationScenes.jsx`.
  `pot_outcomes` has one static SVG figure (`figures.potoutcomes`, untouched, still referenced via
  `[FIGURE: potoutcomes]`) and no interactive; `rct_design` has neither a figure nor an `interactiveId`.
  Definition of Done #2/#3 (scene updates + a pause-and-predict gate wired into a scene) don't have an
  applicable target in this module pair — the pause-and-predict beats added are prose-only ("Pause here:
  ..." sentences), consistent with how MSL's other rewritten modules (see backprop entry above) handle
  pause beats without a scene mechanism.
- **`keyPoints`/`takeaway`/`checkQuestions`/`recap`/`figures` untouched** — per the spec's explicit scope
  boundary, confirmed consistent with existing content (no contradictions introduced by the new
  `summary` text against the existing recap/keyPoints, spot-checked line by line).
- Pass-2 adversarial audit not run — separate task, per the assignment.

### Verify
`npx -y esbuild@0.21.5 src/data/foundations/causalModules.js --bundle --format=esm --loader:.jsx=jsx
--external:react --external:react-dom --external:react/jsx-runtime --external:recharts
--external:lucide-react --outfile=/dev/null` clean after both edits. Not pushed — no git commands run.

## Pass-2 adversarial audit: causal `pot_outcomes` + `rct_design` — 2026-07-08

Ran the (separate-agent) adversarial pass on the writer draft above, per `3B1B-STANDARD.md`'s
enforcement section + `CONTENT-AUDIT-RUBRIC.md`, adapted to this file's single-`summary`-string schema
(no groundUp/explanation split). Read both modules fresh, recomputed both worked examples from scratch.

**`pot_outcomes` — clean, no fix needed.** Independently rebuilt the 4-user table (47: 100/80 eff 20;
12: 90/70 eff 20; 8: 60/50 eff 10; 90: 40/30 eff 10) → true ATE = 60/4 = $15, matches. Recomputed the
actual-draw estimate ({47,8} treated / {12,90} control) → mean(100,60) − mean(70,30) = 80 − 50 = $30,
matches the claimed 2× overestimate. Independently enumerated all C(4,2)=6 possible 2-vs-2 draws and their
diff-in-means (not just checked the writer's 6 numbers): {47,12}→55, {47,8}→30, {47,90}→10, {12,8}→20,
{12,90}→0, {8,90}→−25 — exactly matches the text's `$55, $30, $10, $20, $0, −$25`, sum 90, mean 90/6 = $15
exactly. All original terms (`Y_i(1)`, `Y_i(0)`, `ITE`, `ATE`, `SUTVA`, `ATT`, `CATE`, positivity/
consistency) re-confirmed present and in-context by direct read, not grep alone. Precision rule: the one
metaphor used ("God's-eye view... for one paragraph only") cashes out immediately ("computable only
because you were God for a paragraph") — no gap. Pause-and-predict gate present and genuinely answerable
before the reveal. One continuous worked illustration (not scattered) satisfies voice rule 8. Causal-chain
read as one continuous argument end to end; the estimand-choice paragraph (ATE/ATT/CATE) is the one
mildest transition but not a real violation. **No edit made.**

**`rct_design` — found and fixed one real bug, one real omission.**
1. **Formula/scenario contradiction (fixed).** The ITT/CACE paragraph's setup describes *two-sided*
   non-compliance ("Reversed: some assigned to the old checkout hit a cached copy of the new one and see
   it anyway" = control-arm crossover into treatment), but then applies `CACE = ITT / compliance_rate`,
   which is only valid under *one-sided* non-compliance (monotonicity — no control-side crossover) — the
   exact assumption the module's own `checkQuestions[0]` correct answer (B) already states ("requires
   monotonicity — no control user would have used the feature if assigned"). The worked example
   contradicted both its own setup and the quiz answer key it sits next to — this is the same failure
   class the assigning brief specifically flagged before (a formula applied outside the conditions that
   make it valid), not a new one. Fixed by: keeping the two-sided crossover as a general fact ("non-
   compliance can run either direction"), then explicitly stating the worked $6.40/0.80=$8.00 example
   assumes the clean one-sided case, and appending one sentence generalizing to the Wald estimator for the
   two-sided case (divide by the *difference* in take-up between arms, not the raw 0.80). Arithmetic itself
   ($6.40/0.80=$8.00) was already correct — the bug was the unstated validity condition, not the division.
   No numbers changed.
   Verified formula correctness: under one-sided non-compliance, ITT = P(complier) × CACE where
   P(complier) = P(D=1|Z=1) − P(D=1|Z=0) = 0.80 − 0 = 0.80, so CACE = ITT/0.80 — confirmed correct as now
   stated with the assumption attached.
2. **Recap omission (fixed).** `recap` had zero bullets on ITT/CACE despite it being both taught (a full
   paragraph in `summary`) and tested (`checkQuestions[0]`'s entire question is about it) — a real gap in
   the keyword-spine recap standard's "one bullet per causal step" requirement. Added one bullet
   (`**Non-compliance dilutes what you observe — ITT vs. CACE:**...`) between the Interference bullet and
   the Peeking bullet, matching summary order, reusing the module's own numbers exactly ($6.40/0.80=$8.00)
   — no new numbers introduced.
   All other original technical claims (4.8%/4.3%/p=0.02, unit-of-randomization tiers, 80%/α=0.05, SUTVA,
   p=0.001/0.01%/$500K) re-confirmed present by direct read. Precision rule: no metaphor used beyond the
   literal coin-flip framing, no cash-out gap. Pause-and-predict gate present and genuine. Cross-module
   continuity (voice rule 11) satisfied explicitly — opening paragraph names the exact DAG-module handoff
   point and callbacks to Potential Outcomes' SUTVA are recall-framed correctly (voice rule 10). One
   continuous worked illustration, not scattered.

**Length discipline (flagged by the writer, re-checked, not re-litigated):** both modules measured at
~2.02× the original length vs. the 1.3× guideline. Confirmed this is earning its length, not padding — the
excess is concentrated almost entirely in the two worked numeric examples (both independently recomputed
above), not narrative filler; everything else was already trimmed back in the writer's second pass. Judgment
call, not a violation — left as-is, per the writer's own explicit flag.

**Verdict:** `pot_outcomes` clean (0 loops needed). `rct_design` needed exactly 1 round — both fixes are
targeted (2 sentences added/reworded in `summary`, 1 recap bullet added), not a rewrite. Both now pass a
second read clean; no further loop needed.

### Verify
`npx -y esbuild@0.21.5 src/data/foundations/causalModules.js --bundle --format=esm --loader:.jsx=jsx
--external:react --external:react-dom --external:react/jsx-runtime --external:recharts
--external:lucide-react --outfile=/dev/null` — clean. Not pushed — no git commands run.

---

## 2026-07-08 — Glossary + interview-question harvest from `pot_outcomes`/`rct_design`

Harvest pass on the two finalized (writer + Pass-2 adversarial audit both complete, see entry above)
causal modules. Module content itself was NOT re-edited here (aside from what the audit already
changed) — this pass only pulls terms/questions out of the now-locked prose.

### Task 1 — Glossary (`src/data/glossary.js`)
Added **15 new terms**, all sourced from `pot_outcomes` / `rct_design`'s actual `summary` (two from
`keyPoints`/`checkQuestions` where `summary` only used the bare acronym — flagged per-term below),
`sourceTabId: 'causal_foundation'`:

From `pot_outcomes`: **Potential Outcomes**, **Counterfactual**, **Fundamental Problem of Causal
Inference**, **Individual Treatment Effect (ITE)**, **Average Treatment Effect (ATE)**, **SUTVA**,
**ATT**, **CATE**.

From `rct_design`: **Intent-to-Treat (ITT)**, **Non-Compliance**, **Complier Average Causal Effect
(CACE)**, **Wald Estimator**, **Minimum Detectable Effect (MDE)** (sourced from `keyPoints`, since
`summary` only used the bare "MDE" acronym), **Design Effect (DEFF)** (sourced from
`checkQuestions[3]`'s correct-answer option, the only place in the module DEFF is actually taught),
**Block Randomization** (substituted for the task brief's suggested "Stratified Randomization" —
that exact phrase is never taught; the module teaches stratifying-then-block-randomizing, and "block
randomization" is the literal phrase in-prose).

Deliberately **not added**, each checked and rejected for a specific reason:
- **Consistency, Positivity** (the other two identification assumptions alongside SUTVA) — not in the
  task's candidate list, and both are common English words used with unrelated meanings elsewhere in
  this app's 200+ foundation modules (e.g. "consistency" appears 50+ times across other families);
  keying them globally would mis-link unrelated prose to this module's popup.
- **Compliance** (bare, not hyphenated) — same collision risk; `monitoringModules.js` uses
  "compliance" for regulatory compliance, a different meaning. Used the hyphenated **"non-compliance"**
  instead, which greps as unique to `causalModules.js` across `src/data/foundations/`.
- **Stratified Randomization** as a literal key — not taught verbatim (see Block Randomization above).

Verified each key's collision risk by grepping `src/data/foundations/` before adding (glossary matching
is global — shared by all 19 `*FoundationTab.jsx` families via `src/utils/renderMd.jsx`, not scoped to
Causal). Verified `minimum detectable effect` is not already a duplicate definition (it's newly added
here; `evalModules.js`'s `online_experimentation_ml` module also uses the term in prose but the term
wasn't in `glossary.js` before this pass).

### Task 2 — Interview questions, both surfaces audited

**Surface (a): `questionBank.js`'s `TRAINER_QUESTIONS`.** Checked exact domain naming — confirmed
**zero** existing Causal-related domain (`grep -i causal` on the file only matches unrelated RecSys
"causal self-attention" content, no `"domain": "Causal..."` anywhere). Since there was nothing existing
to audit, none was needed here per the task's own scoping — but added net-new coverage anyway to keep
this freshly-audited content actually drillable in the Trainer, following the established precedent in
this file (a new domain was added, e.g. `"Experimentation"`, when `online_experimentation_ml` was
finished in an earlier session). Added **8 new MCQs**, ids 135–142 (next free id after the existing
max of 134), `"domain": "Causal Inference"` — potential outcomes/fundamental problem (135), ATE vs ATT
estimand mismatch on a volunteer trial (136), SUTVA network-spillover underestimate direction (137),
why randomization beats a DAG-derived adjustment set for unknown confounders (138), unit-of-
randomization tradeoff for a checkout redesign (139), ITT vs CACE computation under one-sided
non-compliance (140), the AA test as a randomization-validity diagnostic (141), and the cluster-
randomization Design Effect formula (142). Deliberately does NOT overlap with the existing
`"Experimentation"` domain's MDE/CUPED/SRM/peeking/guardrail content (129–134) — same MDE concept
appears once in 134's CUPED framing and once in causal's 139/142 cluster-design framing, but the
questions test different applications, not duplicate wording.
**Length-tell check (mandatory per the assigning brief, re-verified explicitly, not assumed correct
from the first draft):** first draft measured 5/8 = 62.5% flagged (target ~25–35%, using the same
"correct answer is longest, or >1.20x the average of the wrong options" rule as `_verify_mcq_balance.mjs`
uses for the `checkQuestions` shape — adapted here for `TRAINER_QUESTIONS`' `options`/`correct`-index
shape, since the existing script only parses the `checkQuestions`/`answer`-letter shape). Rewrote the
5 flagged questions' options to close the length gap; final measured 2/8 = 25% flagged, in range.
Verified again directly against the live inserted file content (not just the draft), post-insertion.

**Surface (b): the `cat`-based bank feeding `InterviewPrepTab.jsx`.** Confirmed no Causal-equivalent
file existed (`interviewExtra.js` only imported Systems/Modeling/Foundations/DeepLearning/RecSys).
Created **`src/data/interviewExtraCausal.js`**, exporting `EXTRA_CAUSAL`, following the exact pattern
of `interviewExtraDeepLearning.js`/`interviewExtraRecSys.js`: same file-header doc-comment shape, same
`{ id, cat, company, level, q, answer, whatsTested, antiPattern, staffFraming }` object shape, `cat:
'Causal Inference'`, ids **6001–6010** (next free block after Systems~1000s/Modeling~2000s/
Foundations~3000s/DeepLearning~4000s/RecSys~5000s). **10 new questions, all original** (no existing
content to audit here since the file didn't exist): potential-outcomes/fundamental-problem (6001),
ATT-vs-ATE volunteer-trial estimand error (6002), SUTVA network interference (6003), randomization vs.
DAG-adjustment-set for unknown confounders (6004), unit-of-randomization tradeoff (6005), MDE quadratic
scaling and its portfolio/prioritization implication (6006), ITT vs CACE with the Wald-estimator caveat
(6007), the AA test as a pre-publication sanity check (6008), peeking / sequential testing (6009), and
cluster randomization's Design Effect (6010). This surface is free-form q/answer (no `options` array),
so the MCQ length-tell check doesn't apply to it — confirmed by inspecting the shape before assuming
the check was needed.
Wired into `src/data/interviewExtra.js`: added the `EXTRA_CAUSAL` import and spread it into
`EXTRA_QUESTIONS`.
**Known pre-existing gap, not touched (mirrors precedent):** `InterviewPrepTab.jsx`'s `CATEGORIES`
filter-dropdown array doesn't include `'Recommender Systems'` or `'Deep Learning'` either, even though
both are real `cat` values in the extra bank — those questions are only reachable via the "All topics"
filter, not a dedicated dropdown entry. Left `'Causal Inference'` in the same state as those two
(consistent with existing precedent, not a new gap introduced by this pass) rather than unilaterally
changing the shared filter UI as a side effect of a content-harvest task.

### Verify
All four touched files individually verified clean via `npx -y esbuild@0.21.5 <file> --bundle
--format=esm --loader:.jsx=jsx --external:react --external:react-dom --external:react/jsx-runtime
--external:recharts --external:lucide-react --outfile=/dev/null`: `src/data/glossary.js`,
`src/utils/renderMd.jsx` (consumer, sanity-checked), `src/data/questionBank.js`,
`src/data/interviewExtraCausal.js`, `src/data/interviewExtra.js`. Also bundled 3 real consumers end-to-
end (`src/tabs/InterviewPrepTab.jsx`, `src/tabs/TrainerTab.jsx`, `src/tabs/CombinatorTab.jsx`,
`src/tabs/ReviewTab.jsx`) — all bundle clean; the only warnings shown are pre-existing duplicate-key
warnings in `productionModules.js`/`classicalMLModules.js` unrelated to this pass (already noted as
pre-existing in an earlier BACKLOG entry). Not pushed — no git commands run.

---

## Inline-scene mechanism ported from GSL + `$...$` escape-collision fix — 2026-07-09

Infrastructure-only pass (no module content authored). Two independent fixes to `src/utils/renderMd.jsx`,
the single shared renderer behind all 19 `*FoundationTab.jsx` families + `CheckQuestion.jsx`.

### 1. Inline scenes — new API shape for future content tasks

Ported GSL's `explanation[]` inline-scene mechanism (`FoundationsRunner.jsx` +
`nicheViz/foundationScenes.jsx`) into MSL. **`renderMd()`'s signature is now**
`renderMd(text, containerStyle = {}, figures = {}, moduleId = null)` — the 4th arg is new, optional,
defaults to `null`, and every one of the ~203 existing call sites (which pass 1–3 args) is untouched
and behaves exactly as before.

`text` now accepts EITHER:
- a plain string (unchanged behavior — split on `\n\n+`, each block run through the existing
  figure/equation/misconception-callout/formal-statement/lede/paragraph rules), or
- an **array of blocks**, where each item is either a string (rendered via the same per-block rules,
  as a single block — it is NOT re-split on `\n\n`, matching GSL's `explanation[]` convention exactly)
  or `{ type: 'scene', sceneId: '<id>' }`, which looks up
  `FOUNDATION_SCENES[`${moduleId}/${sceneId}`]` (new file `src/data/foundationScenes.js`, same
  `"moduleId/sceneId"` keying convention as GSL) and renders that component inline, at that exact
  position in the sequence, between the surrounding prose blocks.

**For a future content task to add a scene to a module:** (1) build the interactive React component
(anywhere, e.g. `src/components/interactive/`), (2) register it in `src/data/foundationScenes.js` as
`"moduleId/sceneId": Component`, (3) change that module's `summary` (or `keyPoints` item, etc. — any
field a `*FoundationTab.jsx` passes through `renderMd`) from a plain string to an array of
strings/scene-markers, and (4) make sure the call site passes the module's `id` as the 4th arg to
`renderMd` (e.g. `renderMd(selected.summary, {...}, selected.figures || {}, selected.id)` — most
existing call sites will need this 4th arg added when they start passing arrays; until then it's a
no-op default). `foundationScenes.js` ships with an empty registry — no real scenes exist yet.

Refactor note: the per-block rendering logic (figure/equation/callout/lede/paragraph rules) was
extracted into a new `renderTextBlock(block, i, usedGlossaryTerms, figures)` helper so both the
plain-string path and the array path share it — no duplicated logic.

**Verification (not assumed from reading the code):** temporarily wrapped `classicalMLModules.js`'s
`gradient_boosting.summary` into `[para1, {type:'scene', sceneId:'__test__'}, para2+rest]` and
registered a throwaway `"gradient_boosting/__test__"` scene (a plain div rendering "SCENE TEST") in
`foundationScenes.js`. Bundled a small Node harness with `npx esbuild@0.21.5` (`--jsx=automatic`,
`platform=node`, `format=cjs`) importing the real `renderMd` + the real `CLASSICAL_ML_MODULES`, ran it
under Node, and rendered via `react-dom/server`'s `renderToStaticMarkup`. Confirmed via actual string
inspection of the rendered HTML: paragraph 1 text present, `SCENE TEST` present, paragraph 2 text
present, and — critically — the byte offsets in the HTML show paragraph-1 < scene < paragraph-2 (a
real ordering check, not just presence). Also confirmed the plain-string call path (no array, no
moduleId) still renders unchanged, and that omitting `moduleId` on an array call silently no-ops the
scene (renders nothing, no crash) — both required for backward compatibility with the ~203 existing
modules. After confirming, reverted `classicalMLModules.js` to byte-identical original (`git diff`
empty) and stripped the test entry from `foundationScenes.js`, leaving only the real, now-proven,
empty-registry skeleton. Deleted the throwaway test harness file.

### 2. `$...$` math-delimiter escape fix

Bug (user-reported, real, seen on the `pot_outcomes` module): `renderInline()`'s split regex treated
any `$...$` as inline math, so a sentence with two unrelated currency figures ("$100 ... $70") got
greedily matched start-to-end as one "equation" and rendered as garbled LaTeX via `texToHtml()`.

Fix: both the inline split regex and the standalone-equation-block regex now use a negative lookbehind
so a backslash-escaped `\$` can never open or close a math span:
- `renderInline()`: `/(\*\*[^*]+\*\*|`[^`]+`|(?<!\\)\$[^\$\n]+(?<!\\)\$)/g`
- standalone equation block (in `renderTextBlock()`): `/^(?<!\\)\$(.+)(?<!\\)\$$/s`

The plain-text branch of `renderInline()` now strips the backslash before display
(`part.replace(/\\\$/g, '$')`) so `\$100` renders as the literal `$100`, not `\$100`.

**This pass only fixes the renderer.** No sweep of existing module content to escape existing bare `$`
signs was done — that's a separate, later content task (flagged, not attempted here).

**Verification:** same esbuild+Node+`renderToStaticMarkup` harness as above, three cases: (a)
`"...cost \\$100 per seat...\\$70 per seat..."` → renders literal `$100` and `$70` as plain text, no
math span, no stray backslash; (b) `"...$x^2 + b$ at this point..."` → still renders as real math (a
`<sup>2</sup>` from `texToHtml`); (c) mixed sentence with both an escaped currency pair AND a real
`$x^2$` in the same string → currency renders literal, math still renders as math. All checks passed.

### Files touched
`src/utils/renderMd.jsx` (signature + array/scene support + escape fix + `renderTextBlock` extraction),
`src/data/foundationScenes.js` (new, empty registry).

### Verify
`npx -y esbuild@0.21.5 <file> --bundle --format=esm --loader:.jsx=jsx --external:react
--external:react-dom --external:react/jsx-runtime --outfile=/dev/null` clean on `renderMd.jsx`,
`foundationScenes.js`, `classicalMLModules.js` (confirmed byte-identical to its pre-change state via
`git diff` — empty), and one real consumer (`ClassicalMLFoundationTab.jsx`, full bundle). Only warnings
anywhere are the pre-existing `classicalMLModules.js` duplicate-`interactiveId` ones already logged in
earlier BACKLOG entries — unrelated to this pass. Not pushed — no git commands run.

---

## `gradient_boosting` — first real content on the inline-scene mechanism, reference-template rewrite — 2026-07-09

Content pass (writer-pass only, per `3B1B-STANDARD.md`'s two-pass process — a separate agent runs the
Pass-2 adversarial audit next, not attempted here). First module to actually populate
`src/data/foundationScenes.js` (previously an empty, proven skeleton — see the entry directly above) and
the first MSL module using the array/scene `summary` shape end to end. Explicit goal per the task brief:
this becomes the module every future MSL rewrite is measured against, so treated as the highest-bar single
piece of content in the lab, not a routine pass.

### Starting state
`src/data/foundationModules.js` → `classicalMLModules.js`'s `gradient_boosting` module (`src/data/foundations/classicalMLModules.js`,
`CLASSICAL_ML_MODULES`) had a real, already-good 4-house numerical walkthrough (prices 150k/200k/400k/600k,
F0=337.5k, residuals ∓187.5/∓137.5/±62.5/±262.5) but: (1) `summary` was a single plain string (no scenes
possible), (2) the walkthrough never assigned the houses a feature to split on, so there was no actual split
threshold, no leaf values, no learning-rate arithmetic, no round 2 — the prose asserted "misses roughly
halved" without a number; (3) zero XGBoost-specific internals beyond one paragraph naming the objective
formula (which itself had a latent rendering bug — `\tfrac12` and `\lVert...\rVert` are not macros
`texToHtml` (in `renderMd.jsx`) recognizes, so that equation was silently garbling on render — present in
both `summary` and one `keyPoints` bullet); no second-order/Newton derivation, no gain-formula derivation, no
sparsity-aware missing-value handling, no weighted quantile sketch, no row/column subsampling detail. 6
`checkQuestions`, 5 `keyPoints`, 6 `recap` bullets.

### What was added, and how every new number was independently verified
Extended the house data with a `size` feature (800/1200/2000/3000 sqft, paired with the existing
150k/200k/400k/600k prices) so a real depth-1 split becomes computable, then re-derived every downstream
number by hand (shown below with the exact arithmetic, not just the final value — this is what "verify, don't
assert" means in practice):

- **F0 = mean price = (150+200+400+600)/4 = 337.5k.** Unchanged from the original, re-derived from first
  principles (the value minimizing total squared error against 4 unequal targets is the mean).
- **Round-1 split search** (3 candidate thresholds — midpoints of sorted sizes: 1000, 1600, 2500), each
  scored by within-group SSE against the group's own residual mean: split@1000 → 0 + 80,000 = 80,000;
  split@1600 → 1,250 + 20,000 = **21,250** (winner); split@2500 → 35,000 + 0 = 35,000. Independently
  recomputed twice (once via plain SSE, once via the XGBoost gain formula below) — both give the same winner
  and the same ranking.
- **η (learning rate) = 0.5** (matches the paired interactive's default slider value, `GradientBoostingViz.jsx`).
  Tree 1 leaves ∓162.5k → scaled contributions ∓81.25k → F1 = {256.25, 256.25, 418.75, 418.75}k → residuals1 =
  {−106.25, −56.25, −18.75, +181.25}k. MAE: 162.5k→90.625k (a **44.2%** drop, computed as
  1−90.625/162.5). MSE: 31,718.75→11,914.0625 (a **62.4%** drop, computed as 1−11914.0625/31718.75).
- **Round-2 split search on the NEW residuals** — the key non-obvious result the module leans on: the
  winning threshold *moves*, from size<1600 to **size<2500** (SSE ≈ 3,854 vs 21,250 vs ≈32,603), because
  tree 1 already closed the small/big gap and the largest miss left is House D alone (+181.25k). Verified by
  recomputing all three group means and their squared deviations by hand twice, cross-checked against the
  scene component's independently-implemented live calculation (see below) — both agree.
- **XGBoost gradient/Hessian**, using the ℓ=½(y−ŷ)² convention (chosen explicitly in-text so g=−residual,
  h=1 exactly, with the choice of convention stated, not left implicit): g = {187.5, 137.5, −62.5, −262.5},
  h = {1,1,1,1}.
- **Gain formula cross-check**: re-scored all 3 round-1 splits via
  Gain=½[G²_L/(H_L+λ)+G²_R/(H_R+λ)−G²_root/(H_root+λ)] at λ=0: 23,437.5 / **52,812.5** (winner) / 45,937.5 —
  same winner, same order as the plain-SSE search, and the module states and verifies the general identity
  Gain(λ=0,h=1) = ½ × SSE-reduction explicitly (52,812.5 = ½ × (126,875−21,250) = ½×105,625).
- **λ's effect on the optimal leaf weight** w*=−G/(H+λ): at λ=0, w*_L=−162.5 (recovers the plain mean); at
  λ=2, w*_L=−81.25 (exactly half); at λ=6, w*_L=−40.625 — each recomputed by hand, used to make the
  λ-vs-η distinction concrete (both shrink, but at different points in the pipeline — λ during fitting,
  per-leaf, sample-count-sensitive; η after fitting, uniformly across the whole tree).
- **γ minimum-gain bar**: at λ=2 the size<1600 split's gain is 26,406.25; a γ=30,000 example is used to show
  the split gets refused outright even though a real pattern exists.
- **Sparsity-aware missing-value routing**: added a hypothetical second feature (`renovation_year`, present
  for houses B/D, missing for A/C, threshold 2012) and computed both candidate default directions:
  missing→left scores 45,937.5 (coincidentally identical to the round-1 split@2500 gain — a real,
  independently-confirmed coincidence, not a copy-paste error, since it's the same {A,B,C}|{D} grouping under
  the hood); missing→right scores 12,604.17. Left wins by ≈3.65× (computed live in the scene component, not
  hardcoded as a rounded literal in the prose).
- **Weighted quantile sketch** motivated with a real contrasting number pair from log-loss's Hessian
  h=p(1−p): p=0.5 → h=0.25 vs p=0.95 → h=0.0475, a >5× difference, used to explain why the sketch spends its
  bucket budget on uncertain rows rather than confident ones.

All of the above were computed independently at least twice (once for the prose, once again either via the
gain-formula cross-check or the scene component's separate implementation) rather than derived once and
trusted — per the numeric self-check discipline in `3B1B-STANDARD.md`'s enforcement section, even though the
full adversarial Pass-2 is explicitly out of scope for this pass.

### Scenes built (3, all real, registered, none placeholders)
New file `src/components/interactive/GradientBoostingScenes.jsx`, all three registered in
`src/data/foundationScenes.js` (previously empty):
1. **`gradient_boosting/residual_relay`** (`GBResidualRelayScene`) — the persistent object (the same 4
   houses, positioned by size on the x-axis) stepped through rounds 0→1→2; draws the prediction step-function,
   true-price points, and residual stems (red=under-predicted/positive residual, blue=over-predicted/negative
   — reused from `GradientBoostingViz.jsx`'s existing legend convention for text–scene/interactive
   consistency); live-computes MAE/MSE/% drop from the same `preds` arrays rather than hardcoding aggregate
   stats separately (single source of truth). Carries the module's one pause-and-predict gate: before
   advancing to round 2, the user must guess which house grouping the next split will produce (3 options),
   then gets a reveal explaining why the split moved. Closes with a macro-finale caption zooming out to "this
   is the entire boosting loop, run twice."
2. **`gradient_boosting/gain_bars`** (`GBGainBarsScene`) — bar chart of the 3 candidate splits' gains,
   computed live from hardcoded (verified) G/H constants, with live λ and γ sliders that recompute gain and
   leaf-weight readouts in real time, visually refusing (greying out) any split that fails to clear γ. Carries
   a lighter secondary predict-then-reveal (which split wins, size<1000 or size<1600).
3. **`gradient_boosting/missing_route`** (`GBMissingRouteScene`) — the sparsity-aware routing example,
   showing both candidate default directions side by side with live-computed gains, highlighting the winning
   (learned) direction after a reveal click.
All three reuse the *same* per-house g/h constants (documented in a header comment cross-referencing the
prose so the two can't silently drift), satisfying scene rule 1 (one persistent object) at the whole-module
level, not just within a single scene.

### Rewiring
`summary` converted from a single template-string to an array of ~36 blocks (33 prose strings + 3
`{type:'scene', sceneId}` markers), inserted mid-argument (after the round-1/round-2 walkthrough; after the
gain-formula derivation; after the missing-value derivation) rather than clustered at the end.
`ClassicalMLFoundationTab.jsx`'s `renderMd()` call site for `selected.summary` updated to pass `selected.id`
as the 4th argument (the only call site using array-shaped content so far).

### Other fields updated to match the new depth
- **`keyPoints`**: 5→7 bullets. Fixed the `\tfrac`/`\lVert`/`\rVert` rendering bug in the (retained,
  rewritten) family/objective bullet — replaced with plain Unicode (½, ‖·‖) that `texToHtml` doesn't need to
  touch at all, removing the risk entirely rather than adding another special-case macro. Added 2 new
  bullets: one on why the Hessian matters even though it's constant for squared error, one on λ-vs-η and
  sparsity-aware routing/weighted quantile sketch.
- **`checkQuestions`**: 6→9. Added 3 new questions (Hessian rationale, λ/γ regularization mechanics,
  sparsity-aware routing + quantile-sketch weighting — one is multi-select). Ran a length-tell check (own
  small Python script, char-length of each option, flagging any question where the correct answer is the
  unique longest/shortest option by >10 chars over the next-closest) — found 2 **pre-existing** questions
  (not touched by this task's content additions) tripped a shortest-answer tell and one new question tripped
  a longest-answer tell; fixed all of them by trimming/padding option text without changing their meaning.
  Final check: 9/9 clean, no length tell on any question.
- **`takeaway`**: rewritten to name the Taylor-expanded regularized objective and gradient+Hessian gain
  formula, not just "regularisation and curvature."
- **`recap`**: 6→11 bullets, keyword-spine style (arrow notation, bold load-bearing term), extended to cover
  the new causal steps (second-order/Newton, gain formula + its λ=0/h=1 SSE-reduction identity, λ-vs-η
  distinction, sparsity-aware routing, weighted quantile sketch) in the same order the module builds them.
- **`deeperMath`**: checked for — this field/rendering tier does not exist anywhere in MSL's schema or in
  `ClassicalMLFoundationTab.jsx` (unlike PAL, which has a real but-empty `deeperMath` skeleton in
  `FoundationRunnerShell.jsx`). Not added here — folding the deepest math into a field nothing renders would
  silently drop content, so the Newton-approximation/gain-formula/quantile-sketch depth was folded directly
  into `summary` instead. Flagged as a possible future MSL-wide mechanism if a "Go Deeper" tier is ever built,
  mirroring PAL's.
- `interactivePrompt` left unchanged (still refers to the paired interactive's η slider specifically, not the
  new scenes — no conflict).

### Final `summary` array structure (36 items)
33 prose strings (opening crisis/continuity → Kearns/Valiant/Schapire/AdaBoost history → house walkthrough
round 1 → pause-and-predict → round 1 reveal → η/shrinkage → round 2 → gradient-descent-in-function-space
generalization → classification/logit/sigmoid → shallow-trees/η/early-stopping → Taylor expansion/g,h setup
→ Hessian-matters justification → gain-formula derivation/cross-check → λ/leaf-weight → γ → sparsity-aware
routing → quantile sketch → subsampling → hyperparameter roll-up → leakage → importances → library comparison
→ imbalance → closing synthesis), interleaved with 3 `{type:'scene', sceneId:'residual_relay'|'gain_bars'|
'missing_route'}` markers at the 3 positions named above.

### Verification (all run for real, not assumed)
1. **esbuild@0.21.5**, `--bundle --format=esm --loader:.jsx=jsx --loader:.js=jsx --external:react
   --external:react-dom --external:react/jsx-runtime --outfile=/dev/null`, clean (exit 0, only the
   pre-existing unrelated duplicate-`interactiveId` warnings already logged in earlier entries) on all 4
   touched files: `classicalMLModules.js`, `foundationScenes.js`, `ClassicalMLFoundationTab.jsx`,
   `GradientBoostingScenes.jsx`.
2. **Real render check**, not just a bundle check: a Node harness (`--jsx=automatic`, `platform=node`,
   `format=cjs`, `--external:react --external:react-dom`) importing the real `CLASSICAL_ML_MODULES` +
   `renderMd`, rendered via `react-dom/server`'s `renderToStaticMarkup`. Confirmed: (a) `summary` is an array
   of 36 blocks with exactly 3 scene markers; (b) rendering WITHOUT a `moduleId` (simulating every other
   existing call site) succeeds with no crash and renders 0 scenes (27,703 chars); (c) rendering WITH
   `moduleId='gradient_boosting'` succeeds and is longer (35,681 chars), i.e. the scenes actually mount; (d)
   the 3 scenes' distinguishing text appears in the HTML in the same order as their markers in the `summary`
   array (byte-offset check: residual_relay at 9,080 < gain_bars at 21,289 < missing_route at 25,645); (e) the
   phrase "as you can see above/below" does not appear anywhere (Definition-of-Done #6 — prose must stand
   alone on the prerendered static page, which doesn't render scenes).
3. **Technical-claims survival check** (grep, not vibes): every named technique/hyperparameter/number from
   the original text (`AdaBoost`, `LightGBM`, `CatBoost`, `learning_rate`, `n_estimators`, `max_depth`,
   `min_child_weight`, `gamma`, `subsample`, `colsample_bytree`, `reg_lambda`, `reg_alpha`,
   `scale_pos_weight`, `eval_metric`, `Kearns`, `Valiant`, `Schapire`, `1988`, weight/cover/gain importance
   trio, `logit`, `sigmoid`, early stopping, PR-AUC, time-based/group-based splits) confirmed present in the
   rewritten module.
4. **MCQ length-tell check** — see checkQuestions section above; final state 9/9 clean.

### Deferrals (explicit, per Definition of Done's "deferrals must be stated, not silently shrunk")
- Pass-2 adversarial audit against `3B1B-STANDARD.md`'s full checklist — explicitly out of scope for this
  pass per the task brief; a separate agent/context runs it next (task queued).
- `deeperMath` tier — not built (doesn't exist in MSL yet; see above).
- Scrollytelling / scroll-triggered scene reveals — not attempted (matches the standard's stated allowance
  for this specific deferral).
- No sweep of the OTHER ~202 MSL foundation modules' pre-existing MCQ length-tell status was done here
  (2 pre-existing questions in THIS module were fixed opportunistically since this module was being fully
  reworked anyway) — a lab-wide sweep, if wanted, is separate work.

### Files touched
`src/data/foundations/classicalMLModules.js` (`gradient_boosting` module: summary, keyPoints,
checkQuestions, takeaway, recap), `src/data/foundationScenes.js` (populated the previously-empty registry
with 3 real entries), `src/components/interactive/GradientBoostingScenes.jsx` (new, 3 scene components),
`src/tabs/foundations/ClassicalMLFoundationTab.jsx` (one-line `renderMd` call-site update to pass
`selected.id`). Not pushed — no git commands run.

## `gradient_boosting` Pass-2 adversarial audit, chunk 2 (voice/lock, not numerics) — 2026-07-09

Second of the queued Pass-2 audit chunks (3B1B-STANDARD.md's writer+adversarial two-pass process). Chunk 1
already independently reverified the 6 core numeric claims (split gain, w* at three λ values, missing-value
routing gains, Hessian ratio) — not repeated here. This chunk covered 6 different checks, all against the
`gradient_boosting` module (`src/data/foundations/classicalMLModules.js` lines 1256–1452):

1. **Precision rule** — walked every metaphor in `summary` (weak/strong learner "chain", η "keeping a step
   cautious", γ "clearing a bar", quantile-sketch "budget spent where curvature is highest", closing "zoom
   out to the crisis"). Each cashes out to its exact technical claim within a sentence or two. **Clean, no
   fix needed.**
2. **Jargon-second** — read the full 36-item array in order. Terms introduced fresh in this module (weak
   learner, strong learner, boosting, residual-as-gradient, Taylor expansion, gradient g, Hessian h,
   regularized objective, sparsity-aware routing, weighted quantile sketch) all get an immediate concrete
   explanation in the same sentence/paragraph they're named in, and load-bearing ones get a numeric
   demonstration right after (F₀, the 4-house residuals, the split-gain arithmetic). Terms reused from
   *earlier* modules in this same file (**residual** — defined at line 32 in `linear_regression`; **sigmoid**
   / **logit** — defined in `logistic_regression` around line 270) are correctly recalled with a bracket
   reminder on sigmoid's first reappearance here (rule 9), not re-taught from scratch. One borderline case
   checked and judged NOT a violation: "AdaBoost" is named at the start of its own sentence with the
   mechanism explanation immediately following in the same sentence — this is a proper-noun label for a
   historical algorithm, not conceptual jargon requiring a metaphor-first buildup, and it doesn't leave the
   term undefined for multiple sentences (the actual failure mode rule 1 targets, per the `attention` module
   precedent cited in the standard). **Clean, no fix needed.**
3. **Text–Scene Lock (bidirectional)** — read `src/components/interactive/GradientBoostingScenes.jsx` in
   full against the surrounding prose, the same bug class as the `BackpropViz.jsx` mismatch found earlier
   this session. Confirmed line-by-line: scene 1 (`residual_relay`)'s round-0/1/2 predictions
   (337.5/337.5/337.5/337.5 → 256.25/256.25/418.75/418.75 → 226.04167/226.04167/388.54167/509.375), its
   pause-and-predict gate options (`A,B,C | D` as the correct grouping, index 2), and its live MSE-drop
   readout all match the prose's by-hand numbers exactly. Scene 2 (`gain_bars`)'s three `SPLITS` (G_L/H_L/
   G_R/H_R for size<1000, size<1600, size<2500) and its λ/γ sliders reproduce the prose's Gain values
   (23,437.5 / 52,812.5 / 45,937.5 at λ=0) and w* values (−162.5 at λ=0, −81.25 at λ=2) exactly. Scene 3
   (`missing_route`)'s two routing gains (45,937.5 vs 12,604.17, ratio 3.6×) match the prose's
   `renovation_year` walkthrough exactly. Also confirmed the closing prose paragraph ("Zoom out to the
   crisis this module opened with") echoes scene 1's own end-state copy ("Zoom out: this two-tree relay is
   the entire boosting loop, run twice") — genuine shared vocabulary, not a mismatch. Registration double-
   checked in `src/data/foundationScenes.js`: all 3 `sceneId`s (`residual_relay`, `gain_bars`,
   `missing_route`) resolve under the `gradient_boosting/` key to the right exports. **Clean, no fix
   needed** — this is the one check with a known recent failure precedent in this codebase and it came back
   fully clean on independent re-verification.
4. **Remaining unrendered LaTeX** — grepped the whole file for `\frac`, `\sum`, `\geq`, `\leq`, `\cdot`,
   `\partial`, `\sqrt`, `\hat`, `\text`, `\tfrac`, `\lVert`/`\rVert` etc. Matches exist elsewhere in the file
   (linear_regression, bias_variance, SVM modules — pre-existing, out of scope) but **zero matches fall
   inside the `gradient_boosting` module's line range (1256–1452)**. The one formula in this module (line
   1300, XGBoost's objective) already uses plain Unicode (Σ, ᵢ, ½, ‖ ‖). **Clean, no fix needed.**
5. **Causal chain integrity** — re-read the 36-item array end to end as a single argument: forest's bias
   ceiling → weak/strong learner theory → AdaBoost's row-reweighting → generalization to residual-fitting →
   the 4-house worked example (F₀ → residuals → split search → η-scaled tree 1 → tree 2 on the new
   residuals) → boosting as gradient descent in function space → the classification (logit/sigmoid) variant
   → the two stability dials → what XGBoost adds (regularized objective → Taylor expansion → g/h → gain
   formula sanity-checked against the by-hand SSE result) → λ vs η → γ → missing-value routing → the
   quantile sketch → subsample/colsample → a named-hyperparameter consolidation → leakage/validation
   discipline → importance-type caveats → library comparison → imbalance handling → zoom-out close. Each
   paragraph answers a question the previous one leaves open; no fragment reads as a disconnected fact.
   **Clean, no fix needed.**
6. **Dangling cross-references** — every reference to something outside the paragraph itself checked against
   the real codebase, not assumed: "the random forest module" (× 2 references) → confirmed `random_forest`
   module exists at line 1078, immediately before this one. "This module's separate boosting-rounds
   interactive" (claims 8 rounds, train/test MSE divergence at high η) → confirmed against
   `GradientBoostingViz.jsx` directly: `for (let round = 0; round < 8; round++)` and an
   `isOverfitting = eta >= 0.8 && ...` branch with matching copy ("test MSE rises past round X... memorizes
   noise rather than the signal"). Both references are accurate, not dangling. **Clean, no fix needed.**

**Net result: zero fixes required.** No edits were made to `classicalMLModules.js`, `foundationScenes.js`,
or `GradientBoostingScenes.jsx` this pass. Re-ran esbuild@0.21.5 on all three anyway as a confirmatory
check (not because anything changed) — all three bundle clean (exit 0; the only warning is the
pre-existing, unrelated duplicate-`interactiveId` warning at lines 885/1219 vs 1079, already logged in an
earlier entry above and outside this module's range).

Not pushed — no git commands run. Chunk 3 (checkQuestions/MCQ re-verification) is queued separately per the
task brief and was explicitly not attempted here.

---

## `gradient_boosting` Pass-2 adversarial audit, chunk 3 (MCQ length-tell + content re-verification) — 2026-07-09

Third and final queued Pass-2 chunk, covering the module's 9 `checkQuestions` (`src/data/foundations/classicalMLModules.js`
lines 1346–1437). Chunks 1–2 already covered numerics and voice/lock — not repeated here.

**Length-tell check.** MSL already has its own `_verify_mcq_balance.mjs` at repo root (untracked, same class of
tool as GSL's sibling script — read for reference, not copied blind since MSL's already exists and matches the
codebase's actual `checkQuestions`/`options`/`answer` schema, including the newer array-`answer` multi-select
shape from the CheckQuestion consolidation). Adapted a one-off variant (`/tmp/verify_gb.mjs`, not committed) that
bundles just `classicalMLModules.js`, isolates the `gradient_boosting` module by `id`, and applies the same
metric per question: strip the `A)`/`B)` prefix, compare the correct option's length (or, for the two multi-select
questions, the mean length of the correct set) against the mean of the wrong options, flag if the correct option
is literally the longest OR runs >20% over the wrong-option average.

**Result: 0 / 9 flagged, both before and after — no length-tell present.** Every question's length ratio (correct
vs. wrong-average) fell between 0.94× and 1.04×, i.e. already tightly balanced (all 4 options in each question sit
within a ~140–154 character band). This module was evidently already covered by the lab-wide MCQ-rebalance pass
logged under "MCQ length-tell fix + CheckQuestion consolidation — 2026-07-08" — no fresh instance of the bug
class here, unlike GSL's `agents` bucket (89/90 flagged) found dangling the same session. **No option text was
edited.**

**Content re-verification.** Independently answered all 9 questions from the module's own prose (not from the
marked `answer` field) before checking: Q1→B (forest trees vote independently, sharing blind spots; boosting
fixes what's left over), Q2→C (tree fits the current residual, shrunk), Q3→A,B (200-tree overfit + early
stopping), Q4→A (nudges the prediction function via a tree fit to the negative gradient), Q5→B (AdaBoost
reweights rows; GB fits the loss gradient), Q6→C (random split on time-ordered data leaks the future), Q7→A (h
is flat for squared error but the gain formula must also hold for losses like log loss where h=p(1−p) varies),
Q8→A (w*=−G/(H+λ) shrinks with λ, distinct from η's post-fit rescale), Q9→A,B (learned default route from
trying both directions at train time; sketch weighted by Hessian = curvature). **All 9 matched the module's
marked `answer` exactly** — no content bugs found.

**Distractor quality note (not a length-tell finding, logged for awareness only):** most wrong options use
absolutist language ("always", "exactly", "purely", "completely", "entirely") while correct options are more
hedged — a common, legitimate MCQ-writing pattern, not the bug class this audit targets, and out of this
chunk's scope per the task brief (length/specificity only). Left as-is.

**Cross-reference sweep.** Checked all 9 questions for dangling references to other modules/concepts: `n_estimators`,
`learning_rate`, `early stopping`, `AUC`, `time-based split`, `Hessian`, `λ`/`γ`, `weighted quantile sketch` — all
match the terminology and values used in the module's own `summary`/`keyPoints` (no renamed or invented terms).
No dangling cross-references found.

**Verify:** `npx -y esbuild@0.21.5 src/data/foundations/classicalMLModules.js --bundle --format=esm
--loader:.jsx=jsx --external:react --external:react-dom --external:react/jsx-runtime --external:recharts
--external:lucide-react --outfile=/dev/null` — clean (exit 0; only the pre-existing, unrelated duplicate-
`interactiveId` warnings at lines 885/1219 vs 1079/250 etc., already logged, outside this module's range).

**Net result: zero edits to `classicalMLModules.js`.** No length-tell, no content errors, no dangling references
in the 9 `checkQuestions`. Combined with chunks 1–2 (numerics clean, voice/lock clean), the `gradient_boosting`
module's full Pass-2 adversarial audit is now **complete — 3/3 chunks clean, module confirmed as the reference-
template quality bar it was written to be.** Not pushed — no git commands run.

---

## Go-Deeper / deeperMath skeleton — rolled out to all 19 foundation tabs — 2026-07-09

Follow-up to the pilot logged above ("Go-Deeper / academic-tier skeleton (task 2b)", 2026-07-08 later
still), which deliberately shipped the toggle on only ONE family (Deep Learning, with only the `attention`
module's `deeperMath` populated) and flagged the other 18 tabs as unscoped follow-up. This session did that
follow-up — **structurally only, no new content authored.**

**New shared component: `src/components/foundations/GoDeeperPanel.jsx`.** Extracted from
`DeepLearningFoundationTab.jsx`'s original inline block (collapsible "Go Deeper — Academic" trigger,
`▸ expand` / `▾ collapse`, same card chrome as the rest of the app). Manages its own `open` state
internally (`useState`); callers pass `key={selected.id}` so switching modules always resets to collapsed,
same behavior as the original per-tab `deeperOpen` state that reset on `selectedId` change. Renders
`selected.deeperMath` content when present (array of markdown strings or `{content}` objects — unchanged
shape/rendering logic, still via `renderMd`) — when absent/empty, renders a lightweight amber "Coming soon"
placeholder (`rgba(245, 158, 11, 0.08)` background / `rgba(245, 158, 11, 0.5)` border / `#b45309` text —
the same accent already used by every foundation tab's existing "Before you touch the controls"
`interactivePrompt` callout, so the placeholder matches an established in-app convention rather than
inventing a new one) instead of being silently missing or crashing. The panel itself always renders
regardless of `deeperMath` presence, so the entry point is visually identical across every family.

**DeepLearningFoundationTab.jsx refactored to use it too** (per the task's own instruction — 19/19 via one
component, not 18 copies + 1 original): removed its local `deeperOpen` state and the `setDeeperOpen(false)`
line inside the existing module-change reset effect, removed the ~22-line inline collapsible block, replaced
with a single `<GoDeeperPanel key={selected.id} deeperMath={selected.deeperMath} figures={selected.figures} />`
in the exact same position (between `InteractivePanel` and the Key Points block). Content/behavior for the
`attention` module (the one populated module) is unchanged — same 3 `deeperMath` items still render.

**18 remaining `src/tabs/foundations/*FoundationTab.jsx` files wired identically** (BanditsFoundationTab,
CausalFoundationTab, ClassicalMLFoundationTab, DataFoundationTab, EvalFoundationTab, GraphMLFoundationTab,
MathStatsFoundationTab, MonitoringFoundationTab, OptimizationFoundationTab, PricingFoundationTab,
ProbabilisticMLFoundationTab, ProductionFoundationTab, RLFoundationTab, RecSysFoundationTab,
SelfSupervisedFoundationTab, SystemDesignFoundationTab, TimeSeriesFoundationTab,
UnsupervisedFoundationTab). Confirmed beforehand that all 18 shared byte-identical anchor lines (`grep -c`
returned exactly 1 for both the `HighlightPopover` import line and the
`{selected.interactiveId && <InteractivePanel interactiveId={selected.interactiveId} />}` line in every
file), so the same two-line diff was applied mechanically via a small Python script rather than 18 separate
hand-edits: (1) added `import { GoDeeperPanel } from '../../components/foundations/GoDeeperPanel.jsx'`
directly after the `HighlightPopover` import, (2) inserted
`<GoDeeperPanel key={selected.id} deeperMath={selected.deeperMath} figures={selected.figures} />` directly
after the `InteractivePanel` line, before the Key Points block — identical placement to the Deep Learning
pilot. None of these 18 families have `deeperMath` populated on any module, so every module in them shows
the "Coming soon" placeholder when expanded; the entry point itself is present and functional everywhere.

**Coverage confirmed, not just claimed:** `grep -l "GoDeeperPanel" src/tabs/foundations/*.jsx | wc -l` →
**19** (18 newly wired + Deep Learning refactored to use the shared component). Also confirmed
`grep -rn "deeperOpen" src/tabs/foundations/*.jsx` returns zero matches anywhere — no leftover per-tab local
state from the old inline pattern survives, including in Deep Learning itself.

**Verify:** all 18 newly-edited tab files esbuild@0.21.5-clean, checked in 3 batches of 6 (not one
unverified sweep) plus `DeepLearningFoundationTab.jsx` and `GoDeeperPanel.jsx` individually — zero new
errors introduced (only the pre-existing, unrelated duplicate-`interactiveId`-key warnings already logged
elsewhere in this file, e.g. `deepLearningModules.js` lines 572/631 and 635/729).

**Explicitly NOT done this pass, by design:** no new `deeperMath` content was authored for any of the 18
families or for the 13 other Deep Learning modules. Every module outside `attention` will show "Coming
soon" until content is written — that authoring pass is separate, future work, tracked wherever the lab's
content backlog lives, not here. This entry covers the skeleton/UI-wiring pass only.

Not pushed — no git commands run, per standard MSL workflow (hand to Sidharth's Mac for build + push).

---

## Currency `$` content escape sweep (renderMd.jsx follow-up) — 2026-07-09

Earlier this session `src/utils/renderMd.jsx`'s math-mode regex was fixed to require backslash-escaped
`\$` for a literal currency dollar sign, so two unrelated dollar amounts in one paragraph (e.g. "$100 ...
$70") stop getting swallowed as one giant fake LaTeX span. That was a renderer-only fix — the content
itself still needed a sweep to add the `\$` escape to every real currency mention across all 21
`src/data/foundations/*.js` module files (not just `causalModules.js`, the one example mentioned when the
renderer bug was found).

**Method:** grepped every file for bare `$` characters, then read each hit in context to classify it as
(a) real LaTeX math (`$θ̂ = (XᵀX)⁻¹Xᵀy$`, `$10^{500000}$`, `$α = 0.1$`, etc. — left untouched), (b) already-
escaped currency (`\$12k` — already safe, left untouched), (c) `${...}` JS template-literal interpolation
inside inline SVG figure strings (left untouched — not markdown content at all), (d) a lone `$` inside a
`figures: { ... }` raw SVG string rendered via `dangerouslySetInnerHTML` without ever passing through
`texToHtml`/`renderInline` (left untouched — e.g. `pricingModules.js:169`'s axis-label `$`,
`unsupervisedModules.js:1086/1091/1103/1104`'s "$50 cluster"/"$5 cluster" SVG labels,
`monitoringModules.js:777`'s "$ risk" SVG label), or (e) genuine unescaped currency prose — escaped to `\$`.

**Files touched (3 of 21 had real currency; the other 18 were either math-only, already escaped, or
SVG-only and needed no change):**
- `causalModules.js` — **44 `$` escaped** (every `$` in the file was currency prose: `pot_outcomes` module's
  summary — $100/$70/$80/$90/$60/$50/$40/$30/$20/$15/$10/$0/$55/−$25 walkthrough of ITE/ATE/randomization
  math; `randomized_experiments` module's $6.40/$8.00 CACE example and $500K significance-vs-practical-
  significance example (summary + keyPoints); `uplift_modeling` module's $1M budget line; `sensitivity_analysis`
  module's $3,000/year earnings line). Confirmed via `grep -oP '(?<!\\)\$' causalModules.js` → 0 bare `$`
  remain, `grep -o '\\\$'` → 44 escaped.
- `mathStatsModules.js` — **2 `$` escaped** (one line, `bayes_theorem`-family keyPoint: "P(fraud | transaction
  > \$10K) ≠ P(transaction > \$10K | fraud)" — the exact two-dollar-same-string pairing pattern the renderer
  fix targets). All other ~274 `$` in this file are real LaTeX (verified: PCA condition-number formulas,
  cross-entropy/KL derivations, Bayes formulas) and were left alone.
- `pricingModules.js` — **11 `$` escaped** across 6 lines: `revenue_vs_margin_objective` module's
  `interactivePrompt` ($6) and a `checkQuestions` question (c=$6, price $10→$8, 3 instances); 
  `price_optimization_under_constraints` module's `interactivePrompt` ($14, $11) and matching `checkQuestions`
  question + 2 of its 4 options (A/C) — this was the clearest real bug instance, two bare `$` in one string
  ($14 ... $11) that would have opened/closed a fake math span; `per_user_price_randomization`-area paragraph's
  "$9 and ... $12" SUTVA example. The lone `$` at line 169 (SVG axis label, inside `figures:`) was correctly
  left un-escaped since it never goes through `texToHtml`.

**Files checked and found to need NO changes** (grep hits were 100% real math, already-escaped currency, or
`${...}`/SVG-figure noise): `banditsModules.js`, `classicalMLModules.js`, `dataModules.js`,
`deepLearningModules.js`, `evalModules.js`, `evalRubrics.js`, `graphMLModules.js`, `monitoringModules.js`,
`optimizationModules.js`, `probabilisticMLModules.js`, `productionModules.js`, `recsysModules.js`,
`rlModules.js`, `sdScenariosMSL.js`/`-a.js`/`-b.js`, `selfSupervisedModules.js`, `systemDesignModules.js`,
`timeSeriesModules.js`, `unsupervisedModules.js`.

**Verification per batch (`npx esbuild@0.21.5 <file> --bundle --format=esm --loader:.jsx=jsx
--external:react --external:react-dom --external:react/jsx-runtime --external:recharts
--external:lucide-react --outfile=/dev/null`):** all 3 touched files compile clean. `mathStatsModules.js`
surfaces 2 pre-existing `duplicate-object-key` warnings (`interactiveId` reused across modules) — unrelated
to this change, not introduced by it.

**Manual render-trace through `renderMd.jsx` (read `texToHtml()`/`renderInline()` fresh, didn't assume):**
for an escaped pair like `\$100 ... \$70` in `causalModules.js`, `renderInline`'s split regex is
`(\*\*[^*]+\*\*|`[^`]+`|(?<!\\)\$[^\$\n]+(?<!\\)\$)` — the `(?<!\\)` lookbehind fails at both `\$` positions
(each is preceded by a backslash), so neither can open or close a math span; the whole sentence stays one
unsplit plain-text piece. That piece then hits the final branch, `applyGlossary(part.replace(/\\\$/g, '$'),
...)`, whose `.replace(/\\\$/g, '$')` strips the backslash off each `\$`, leaving literal `$100`/`$70` in the
rendered output — confirmed correct, not treated as math. Traced the same path for `mathStatsModules.js`'s
"\$10K ... \$10K" pair and `pricingModules.js`'s "\$14, ... \$11" pair (the `price_optimization_under_constraints`
`checkQuestions.q` string) — both real, previously-live instances of the exact bug pattern the renderer fix
was built for (two bare same-string dollar amounts), both now render as plain currency text instead of a
garbled fake-LaTeX span.

Not pushed — no git commands run, per standard MSL workflow (hand to Sidharth's Mac for build + push).

---

## Classical ML batch 1 writer pass — linear_regression, logistic_regression, regularization — 2026-07-09

3B1B-standard writer pass (per `3B1B-STANDARD.md`, no scenes — plain prose only) on the first 3 modules
of `src/data/foundations/classicalMLModules.js`, using `gradient_boosting` in the same file as the quality
bar (one continuous, hand-checkable running numerical example; ~9 `checkQuestions`; recap matching content
exactly). This entry consolidates a prior run that was interrupted mid-edit (no earlier BACKLOG entry had
been written for it, so nothing to merge).

**`linear_regression`** — found already complete from the interrupted run: a five-house running example
(sizes 10/15/20/25/30 hundred-sqft, prices 200/250/280/310/360k) computed end-to-end — Sxy=1900, Sxx=250,
OLS slope=7.6, intercept=128, residuals, R²=0.989, adjusted R²=0.985, a sixth leverage/influence house
collapsing the slope to ≈0.89, and a full inference-layer (SE, t-stat, 95% CI) worked on the same numbers.
`checkQuestions` at 9 (matches `gradient_boosting`), recap matches the rewritten content. No changes made.

**`logistic_regression`** — found genuinely incomplete: the narrative (four-patient running example: w=1.4,
b=−0.2, logits/sigmoid/log-odds/log-loss/gradient-comparison all computed on real numbers) and recap had
already been rewritten and were coherent, but `checkQuestions` was still at 7, not the 9 the interrupted
agent's own last status line said it intended. Added 2 questions reusing the existing patient numbers: one
multi-select contrasting Patient 3 (σ≈0.931, log loss≈0.07) vs Patient 4 (σ≈0.047, log loss≈3.05, MSE
ceiling≈0.908) on log-loss-vs-MSE, one single-answer on the log-odds/odds-ratio arithmetic (e^1.4≈4.05).
`checkQuestions` now 9/9.

**`regularization`** — found entirely untouched (generic L1/L2 explanation, no computed numbers anywhere).
Full writer pass: built the running example by reusing `linear_regression`'s own Sxy=1900, Sxx=250 (OLS
slope 7.6) rather than inventing new houses, per cross-module continuity. New closed-form arithmetic added:
Ridge's single-feature formula slope=Sxy/(Sxx+λ) → 3.8 at λ=250 (exactly half), ≈0.884 at λ=1900 (never
exactly zero); Lasso's soft-threshold slope=sign(Sxy)×max(|Sxy|−λ/2,0)/Sxx → 6.6 at λ=500, exactly 0 at
λ=3800 (the sparsity claim made numeric, not just geometric). Added a new "duplicate-column trap" section:
adding size to the model twice makes OLS underdetermined (infinitely many weight₁+weight₂=7.6 ties); derived
that Ridge's minimum-norm tie-break gives the exact even split (3.8, 3.8) and Lasso's flat-along-the-tie
penalty has no unique minimum, so a coordinate-descent solver arbitrarily lands on a corner (7.6, 0) — the
mechanism behind "which correlated feature Lasso keeps can flip between runs," previously asserted without
proof. Tied the λI-restores-invertibility explanation to the same duplicate-column case (XᵀX becomes exactly
singular, not just near-singular). `keyPoints` and `recap` rewritten to match; `checkQuestions` taken from
6 → 9 (3 new, testing the closed-form arithmetic, the duplicate-column tie-break, and why Lasso's formula
needs a `max(...,0)` clamp and Ridge's doesn't).

**Verification:**
- `node _verify_mcq_balance.mjs src/data/foundations/classicalMLModules.js` — 65 total matched+flagged
  question count (up from the file's pre-existing 62), all 5 newly-added questions across the two modules
  are clean (none appear in the flagged/length-tell list); file-wide flagged rate 21.5% (14/65, unchanged
  from baseline's 14 pre-existing flags — this pass introduced zero new length-tells). Two of the 5 new
  questions are multi-select (`answer: ['X','Y']`) and are correctly outside this script's single-letter
  length check.
- `npx -y esbuild@0.21.5 src/data/foundations/classicalMLModules.js --bundle --format=esm --loader:.jsx=jsx
  --external:react --external:react-dom --external:react/jsx-runtime --external:recharts
  --external:lucide-react --outfile=/dev/null` — compiles clean; only pre-existing, unrelated
  duplicate-`interactiveId`-key warnings (`decision_tree_viz`, `random_forest_viz`) surfaced, not introduced
  by this change.
- Final `checkQuestions` counts: `linear_regression` 9, `logistic_regression` 9, `regularization` 9 — all
  matching the `gradient_boosting` reference bar.

**Explicitly NOT done this pass (writer pass only, per scope):** no Pass-2 adversarial audit, no glossary
or interview-question harvest — both tracked as separate follow-up work.

Not pushed — no git commands run, per standard MSL workflow (hand to Sidharth's Mac for build + push).

---

## Classical ML batch 1 Pass-2 adversarial audit — linear_regression, logistic_regression, regularization — 2026-07-09

Independent Pass-2 auditor (cold read, no visibility into the writer's reasoning) on the 3 modules from
the writer pass immediately above, checked against the full `3B1B-STANDARD.md` "Enforcement" checklist
and the full `CONTENT-AUDIT-RUBRIC.md` 10-smell pass.

**Numeric self-check — every number in all 3 running examples independently recomputed from scratch, not
read-and-nodded:**
- `linear_regression` five-house example: recomputed x̄=20, ȳ=280, Sxy=1900 (800+150+0+150+800), Sxx=250
  (100+25+0+25+100), slope=7.6, intercept=128, all 5 residuals (−4,+8,0,−8,+4, summing to 0), SSE=160,
  SST=14,600, R²=0.9890 (rounds to 0.989), adjusted R²=0.9854 (rounds to 0.985), MAE=$4,800,
  RMSE=√32≈$5,657, MAPE≈1.778%. **All confirmed correct.** Also independently recomputed the 6-house
  leverage/influence example: new x̄=30, ȳ=283.33, Sxy=2,900 (1666.67+500+33.33−133.33+0+833.33),
  Sxx=3,250 (400+225+100+25+0+2500), slope=2900/3250=0.8923 (rounds to 0.89), an 88.3% drop from 7.6 —
  matches the module's own "88%" and "$76/sqft → $9/sqft" claims. Inference layer: MSE_resid=160/3=53.33,
  SE(slope)=√(53.33/250)=0.4619 (rounds to 0.462), t=7.6/0.462=16.45 (rounds to 16.4), 95% CI with
  t(3)=3.18: 7.6±1.469=[6.13,9.07]. **All confirmed correct, no fix needed.**
- `logistic_regression` four-patient example: recomputed Patient 1 (x=0.5): z=0.5, σ(0.5)=0.6225 (rounds
  to 0.622), odds=1.6455 (rounds to 1.65), ln(1.65)=0.5008 (matches z=0.5). Patient 2 (x=−1.0): z=−1.6,
  σ(−1.6)=0.1680 (rounds to 0.168). x=1.5 case: z=1.9, σ(1.9)=0.8699 (rounds to 0.870), new odds=6.69,
  ratio 6.69/1.65=4.05 (matches e^1.4=4.0552). Patient 3 (x=2.0): z=2.6, σ(2.6)=0.9309 (rounds to 0.931),
  squared error=0.00476 (rounds to 0.005), log loss=−ln(0.931)=0.0715 (rounds to 0.07). Patient 4
  (x=−2.0): z=−3.0, σ(−3.0)=0.04743 (rounds to 0.047), squared error=0.9082 (rounds to 0.908), log
  loss=−ln(0.047)=3.058 (rounds to 3.05); at ŷ=0.0001, squared error=0.9998 and log loss=9.21 — both
  confirmed. Gradient check: ŷ−y=−0.953 (log loss) vs σ(z)(1−σ(z))=0.047×0.953=0.0452≈0.045 (MSE's shrink
  factor, which is also the exact ratio of the two gradients' magnitudes: 0.045/0.953≈4.5%) — confirmed
  correct as written. **One real error found and fixed:** the text claimed Patient 4's log loss was
  "over 40× larger, for a prediction that was only about 20× further from the truth in raw probability
  terms." The 40× is fine (3.05/0.07≈43.6). But the "20×" is wrong — independently computed the actual
  raw-probability distances from truth: Patient 3 missed by 1−0.931=0.069, Patient 4 by 1−0.047=0.953,
  ratio 0.953/0.069≈13.8×, not ≈20×. **Fixed** to "about 14×" with the arithmetic shown inline
  parenthetically so the claim is self-verifying on the page, not just asserted.
- `regularization` Ridge/Lasso closed-form example: recomputed Ridge slope=Sxy/(Sxx+λ): λ=250 →
  1900/500=3.8 (exactly half of 7.6, confirmed exact); λ=1900 → 1900/2150=0.8837 (rounds to 0.884, never
  exactly 0, confirmed). Lasso soft-threshold slope=sign(Sxy)×max(|Sxy|−λ/2,0)/Sxx: λ=500 →
  max(1900−250,0)/250=1650/250=6.6 (confirmed exact); λ=3800 → max(1900−1900,0)/250=0 (confirmed exactly
  zero, not rounded). Duplicate-column tie-break: confirmed Ridge's minimum-norm argument algebraically
  (weight₁=3.8+d, weight₂=3.8−d → sum-of-squares=2(3.8²+d²), minimized only at d=0, i.e. the even split)
  and confirmed Lasso's flat-tie claim (|weight₁|+|weight₂|=7.6 identically along the whole tied line
  since both weights are non-negative here, so the L1 penalty can't distinguish any split — arbitrary
  corner is a genuine consequence of a solver breaking a flat tie, not hand-waved). **All confirmed
  correct, no fix needed.**

**Cross-module continuity claim (writer says `regularization` deliberately reuses `linear_regression`'s
Sxy=1900/Sxx=250 five-house data):** verified by direct comparison — same house data (sizes 10/15/20/25/30
hundred-sqft, prices 200/250/280/310/360k), same Sxy=1900, same Sxx=250, same unpenalized slope=7.6
quoted identically in both modules, no contradiction. **Confirmed genuinely consistent, not just
asserted.**

**Voice rule 11 (cross-module continuity, module openings):** `regularization`'s opening explicitly names
where `linear_regression` left off ("go back to the five houses from the linear regression module") —
compliant. `linear_regression` is the first module in the family, no predecessor to reference — N/A.
**`logistic_regression`'s opening was a generic restart** (straight into the heart-attack/doctor framing)
with no reference to `linear_regression`'s own ending point at all — a real rule-11 violation, not
implied by omission. **Fixed** with a one-sentence transition prepended to the `summary` string: "The
linear regression module ended by picking the right yardstick for predicting a *number* — MAE, RMSE, R².
But not every prediction is a number." — names the specific point (the error-metric section) and pivots
into why classification needs a different approach, before the original doctor-question opening.

**Other checklist items — all clean, zero violations found:**
- Precision rule: every metaphor (loss-as-bowl, lazy-model baseline, S-curve/sigmoid squash, log fixing
  odds' lopsidedness, cramming-students overfitting, L1/L2 diamond-vs-circle geometry) cashes out to an
  exact formula or computed number within a sentence or two of being introduced. No gaps found.
- Scene rule 1 (persistent object): each module runs exactly one running example end to end — five houses
  (`linear_regression`, reused verbatim in `regularization`), four patients (`logistic_regression`). No
  mid-stream metaphor switches.
- Voice rule 7 (mechanical labeling): spot-checked every computed intermediate (Sxy/"co-movement sum",
  Sxx/"size-spread sum", z/"logit", σ(z)/"probability", MSE_resid, SE, t-stat) — each is named the moment
  it's produced.
- Voice rule 8 (one worked illustration): confirmed no scattered partial examples in any of the 3 modules.
- Voice rule 12 (unexplained origins): w=1.4/b=−0.2 in `logistic_regression` are explicitly stated as
  "trained by minimizing the loss we're about to define, via gradient descent" before being used; λ values
  in `regularization` are explicitly addressed in the "How you actually pick lambda" section (tuned via
  CV, not guessed, and the illustrative λ=250/500/1900/3800 values are explicitly distinguished from a
  real CV-tuned choice). No unexplained-origin violations.
- `CONTENT-AUDIT-RUBRIC.md` 10-smell pass: no undefined-term-before-use, no tested-but-not-taught (every
  `checkQuestions` item spot-checked below), no asserted-not-shown claims, no missing "so what," no
  structural/proximity mismatches, no confusable-relationship gaps, no dangling threads at either module's
  end (each closes on a complete thought, not an unstated continuation).

**checkQuestions spot-check (all 27 questions across the 3 modules read against their own module's
narrative content, not just the flagged subset):** every marked-correct answer matches content actually
present in that module's `summary` — none require outside knowledge. Full detail not reproduced here since
zero mismatches were found; sample checks included the multi-select questions (`linear_regression` Q4 and
Q9, `logistic_regression` Q5 and Q8, `regularization` Q1 and Q8), all of which have both marked-correct
options independently verifiable against the prose.

**MCQ length-tell check** — ran `_verify_mcq_balance.mjs` against the whole file (all 14 modules, not just
these 3, since the script bundles the full file): 65 total matched questions, 14 flagged (21.5%),
**identical to the writer's own reported baseline** ("14/65, unchanged... this pass introduced zero new
length-tells"). Independently confirms that claim rather than taking it on faith. Of the 14 flagged
file-wide, 4 fall inside these 3 modules (`linear_regression` Q6 and Q8, `logistic_regression` Q3,
`regularization` Q5) — all 4 are pre-existing from before this rewrite pass (not among the newly-added
questions), so left as-is per the standing convention (see earlier `gradient_boosting` audit entries) of
not fixing pre-existing length-tells inside a targeted content-accuracy pass; a length-rebalancing pass
across the file is separate, already-flagged housekeeping.

**LaTeX/rendering check:** read `texToHtml()` in `src/utils/renderMd.jsx` (the actual substitution list,
not assumed) and grepped these 3 modules' line range (1–765) for `\`-prefixed macros — only hits are
`\hat{y}` and `\log` inside the log-loss formula (line 331), both supported (`\hat{}`→combining circumflex,
`\log`→"log"). No unsupported macros. Also checked every `$...$` pair against `renderInline()`'s actual
split regex (`(?<!\\)\$[^\$\n]+(?<!\\)\$`) — all currency figures in both modules use the escaped `\$`
form already (e.g. `\\$7,600`), and the 4 remaining bare-`$` pairs (`$e^{w}$`, `$-\log(\hat{y})$`,
`$θ̂ = (XᵀX)⁻¹Xᵀy$`, `$θ̂ = (XᵀX + λI)⁻¹Xᵀy$`) are all genuine self-contained equation delimiters with no
stray `$` inside them. No rendering risk found.

**Fixes applied (2 total, both targeted, no full rewrite):**
1. `logistic_regression` summary — corrected "about 20× further from the truth" to "about 14×" (with the
   arithmetic shown inline) — the one real numeric error found on independent recomputation.
2. `logistic_regression` summary — prepended a one-sentence cross-module transition naming
   `linear_regression`'s ending point, fixing the voice-rule-11 gap.

**Verify:** `npx -y esbuild@0.21.5 src/data/foundations/classicalMLModules.js --bundle --format=esm
--loader:.jsx=jsx --external:react --external:react-dom --external:react/jsx-runtime --external:recharts
--external:lucide-react --outfile=/dev/null` — clean (exit 0; only the pre-existing, unrelated
duplicate-`interactiveId` warnings already logged in earlier entries). Re-ran
`_verify_mcq_balance.mjs` post-fix — still 65/14/21.5%, confirming the two text-only fixes didn't touch
any `checkQuestions` option lengths.

**Net result: 1 loop, 2 targeted fixes, both confirmed clean on re-check — no further iterations needed.**
Not pushed — no git commands run, per standard MSL workflow.

---

## Classical ML batch 1 (`linear_regression`, `logistic_regression`, `regularization`) — glossary + interview-question harvest, closing out the writer → Pass-2 audit → harvest pipeline — 2026-07-09

Final step for this batch: mined glossary terms and audited/backfilled interview questions, grounded only
in the finalized, Pass-2-audited module text (not draft text, not outside knowledge).

### Part 1 — Glossary (`src/data/glossary.js`)
Read the existing 37-entry file in full first to match its established schema (`term`/`def`/
`sourceModuleId`/`sourceModuleTitle`/`sourceTabId`, longest-key-first sort, def = lightly trimmed
module-native sentence). Added **12 new entries** (37 → 49 total):
- **11 net-new**, sourced from the actual demonstrate-then-name moments in the finalized text: `logit`
  (log-odds), `odds`, `odds ratio`, `sigmoid`, `log loss` (cross-entropy) — all from `logistic_regression`
  — and `l1` (Lasso), `l2` (Ridge), `shrinkage`, `closed form`, `minimum-norm solution` — all from
  `regularization`. Also `perfect separation` (`logistic_regression`).
- **1 gap-fill**: `influence` — demonstrated right next to `leverage` in `linear_regression` (which the
  earlier session did capture) but was missed at the time; added now since this pass covers that module
  too.
- **Deliberately excluded** (documented in the file's own header comment): `overfitting` (used 50+ times
  across other foundation families with the same meaning — same over-generic risk already established for
  "consistency"/"compliance" in the causal harvest); `bias-variance tradeoff` (the concept is taught in
  `regularization`, but the exact phrase never appears contiguously in the prose, so a glossary key for it
  would never actually highlight anything — the matching mechanism requires the literal string to appear);
  `sparsity` (appears only in the module's `subtitle` metadata, never in the `summary`/`keyPoints` body
  text itself — same "def must trim real body prose" discipline).
- Verified no key collisions against the existing 37 (checked substring/short-key risk for `l1`/`l2`
  specifically — the app's `\b`-bounded regex doesn't false-match inside `l1_ratio` since `_` is a word
  character, so no boundary exists there).

### Part 2 — Interview questions (`src/data/questionBank.js`, `TRAINER_QUESTIONS`)
Checked for an existing domain covering linear/logistic regression and regularization: **zero** existing
match (`grep -i` across all "domain" values — the 13 existing domains are Feature Engineering, Model
Evaluation, ML Systems, Statistics & Probability, Deep Learning, MLOps, Ranking & Retrieval, Experiment
Design, SQL & Data, Optimization, Recommender Systems, Experimentation, Causal Inference; only tangential
one-off mentions of "logistic regression"/"L1"/"L2" appear scattered under Deep Learning/Optimization
content on unrelated topics like weight decay and solver choice). Real gap, not an audit situation —
followed the established precedent (same pattern used for `Experimentation` and `Causal Inference` in
earlier sessions): added a new domain, **`"Classical ML"`**, rather than forcing the content into a
loosely-fitting existing bucket.

Added **6 new MCQs**, ids **143–148** (next free numeric id after the existing max of 142; the `"C1"`–
`"C100"` ids belong to the separate `EXAM_ONLY_MCQ` array, confirmed by reading the file structure, not
assumed). Deliberately did not restate the same ground already covered exhaustively by the 3 modules' own
24 `checkQuestions` (OLS mechanics, MSE vs MAE, R²/adjusted R², collinearity, heteroscedasticity, leverage
vs influence, Cook's distance, the inference layer, Gauss-Markov, log-odds/sigmoid/log-loss mechanics,
perfect separation, L1 vs L2 zeroing, standardization, the duplicate-column tie-break) — instead wrote
applied/staff-interview-style scenarios matching this surface's existing voice (production-tell framing,
`whatsTested`/`antiPattern`/`staffFraming` fields), several deliberately cross-linking two of the three
modules:
143. Odds ratio ≠ risk ratio misinterpretation in a credit-committee scenario (`logistic_regression`).
144. Lasso's p≫n selection cap + correlated-feature instability on a sparse fraud feature set, fixed by
     elastic net (`regularization`).
145. Duplicate/near-collinear feature coefficient instability across retraining runs, and what Ridge's
     minimum-norm tie-break changes (`linear_regression` collinearity × `regularization` Ridge geometry).
146. Missing standardization causing asymmetric L2 shrinkage between a dollar-scale and a 0/1 feature
     (`regularization`).
147. Why tuning λ against training error always selects λ=0 (`regularization` bias-variance/CV section).
148. MAE vs RMSE metric choice under an asymmetric real-world cost structure (`linear_regression`
     "picking the right yardstick" section).

**MCQ length-tell check** (mandatory per this file's established convention): wrote a one-off Node script
measuring each option's string length against the "correct answer >1.20× the average of the wrong
options" rule (same rule `_verify_mcq_balance.mjs` uses for the `checkQuestions` shape, adapted here for
`TRAINER_QUESTIONS`' `options`/`correct`-index shape). First correctly-parsed measurement (after fixing an
off-by-one in the string-splitting regex on the first pass) came back **0/6 flagged** — all 6 ratios
between 1.05 and 1.12, comfortably under 1.20 and inside the file's established "not visibly the longest"
discipline.

**Known pre-existing gap, not touched (mirrors precedent):** `TrainerTab.jsx`'s `ALL_DOMAINS` array (used
for the Trainer setup screen's domain checkboxes, default-select-all) does not include `Recommender
Systems`, `Experimentation`, or `Causal Inference` either, even though all three are real `domain` values
already in `TRAINER_QUESTIONS` from earlier sessions — those questions are only reachable if a user's
`selectedDomains` state is built some other way, not via the default checkbox list. Left `Classical ML` in
the same state as those three (consistent with existing precedent, not a new gap introduced by this pass)
rather than unilaterally changing shared UI as a side effect of a content-harvest task.

### Verify
- `npx -y esbuild@0.21.5 src/data/glossary.js --bundle --format=esm --loader:.jsx=jsx --external:react
  --external:react-dom --external:react/jsx-runtime --external:recharts --external:lucide-react
  --outfile=/dev/null` — clean.
- `npx -y esbuild@0.21.5 src/data/questionBank.js --bundle --format=esm --loader:.jsx=jsx
  --external:react --external:react-dom --external:react/jsx-runtime --external:recharts
  --external:lucide-react --outfile=/dev/null` — clean.
- Loaded both modules directly (`node --input-type=module`) to confirm: `TRAINER_QUESTIONS.length === 148`
  with no duplicate ids (verified programmatically, not by eye) and the new ids 143–148 all present under
  `"Classical ML"`; `GLOSSARY` has 49 keys with all 12 new keys resolving.

**This closes out Classical ML batch 1** — `linear_regression`, `logistic_regression`, and
`regularization` have now completed the full writer → Pass-2 adversarial audit → glossary/interview-
question harvest pipeline. Not pushed — no git commands run, per standard MSL workflow.


---

## Classical ML batch 2 — trees, random_forest, class_imbalance — full 3B1B pipeline — 2026-07-09

Picked up an uncommitted, interrupted writer-pass diff on `trees`/`random_forest`/`class_imbalance` in
`classicalMLModules.js` (190 insertions/61 deletions, no prior BACKLOG entry). First step was verifying
whether the writer pass actually finished cleanly before doing anything else.

**Verification of the writer pass (device-direct read, all worked numbers independently recomputed):**
All 3 modules were found content-complete and matching the `gradient_boosting` reference bar — full
worked running examples (`trees`: 8 loan applicants, Gini/entropy computed by hand, a 2-label-flip
variance demonstration; `random_forest`: Galton ox-crowd analogy → Var(average)=σ²/n+((n−1)/n)ρσ² worked
at n=100/1000 and ρ=0.5/0.1, OOB (1−1/n)ⁿ→1/e; `class_imbalance`: 950/50 fraud dataset scored through
accuracy/precision/recall/F1/cost-matrix for both an unweighted and a class-weighted classifier), 7-9
`checkQuestions` each, full `keyPoints`/`recap`/`takeaway`/`figures`. Every threshold, Gini/entropy value,
variance-formula output, and confusion-matrix/cost number was hand-recomputed and confirmed correct. The
gap was purely a documentation one — the writer pass finished but `docs/BACKLOG.md` was never updated —
not a content gap.

**Pass-2 adversarial audit (3 separate cold-read agents, zero writer visibility, one per module):**
All 3 came back NOT CLEAN against the `3B1B-STANDARD.md` Pass-2 checklist + `CONTENT-AUDIT-RUBRIC.md` 10
smells — no factual/numeric errors in any module (all arithmetic independently reconfirmed by the
auditors), but real voice/structure violations:
- `trees`: twenty-questions opening metaphor cashed out to "split in half" (size-balance) when the tree's
  actual criterion is purity, not size — a real Precision Rule (voice rule 4) violation; "Gini impurity"
  and "Entropy" both named before two demonstrations of their mechanism (voice rule 1); the 48k/0.35 split
  thresholds' origin never stated; MAE/Poisson regression criteria under-explained relative to sibling
  MSE/variance; a keyPoint's disconnected "7/10=70%" aside broke the module's persistent 8-applicant
  illustration; loose "information gain" terminology risked conflating the Gini- and entropy-scored senses.
- `random_forest`: threaded through 4 disconnected concrete examples (loan applicants → ox crowd →
  abstract house-price σ² → a separate house-price extrapolation vignette) instead of one persistent
  object (scene rule 1); "bagging" and "random feature choices" named before their mechanism; a "5×
  improvement" claim rounded 50.5→10.9 (actually ≈4.63×) without a floor/asymptotic qualifier; "Gini" used
  for both the split criterion and the (unrelated) impurity-importance metric with no disambiguation.
- `class_imbalance`: pervasive term-first glossary pattern (Recall/Precision/F1/PR-AUC/threshold all named
  before their mechanism); cold open with no link to `calibration`, the immediately preceding module,
  despite repeatedly leaning on "calibrated probabilities"; the $2,000/$5 cost-matrix figures had no
  stated origin (unlike the 19:1 class-weight ratio, which did); `[FIGURE: imbalance_skew]` was placed
  after, not adjacent to, the paragraph it illustrates; no pause-and-predict beat in the narrative prose
  itself (only in `interactivePrompt`); the closing metric-menu paragraph dumped MCC/balanced
  accuracy/specificity/FPR/FNR with near-zero mechanism versus precision/recall/F1's full worked treatment.

**Fixes applied (targeted, single fix-loop round — not full rewrites):** twenty-questions metaphor
rewritten to cash out to purity/unambiguity, not size; Gini impurity and entropy each restructured to
demonstrate the mechanism on two concrete cases (pure group, 50/50 group) before naming the term; the
48k/0.35 thresholds' origin (midpoints between sorted adjacent feature values) stated explicitly;
MAE/Poisson given one clause of real mechanism each; the disconnected keyPoint aside replaced with the
module's own 4/4 leaf example; "information gain" terminology tightened to flag the Gini-vs-entropy sense
ambiguity; `random_forest`'s bagging/feature-selection paragraphs reordered mechanism-before-name; the
house-price variance example and the house-price extrapolation-trap example explicitly tied together as
one running illustration; the "5×" claim corrected to compare the asymptotic floors (50 vs 10) rather than
the raw before/after numbers; impurity importance disambiguated from the split criterion; `class_imbalance`
opened with an explicit bridge to the calibration module; `imbalance_skew` figure moved adjacent to the
paragraph it illustrates; the $2,000/$5 cost figures given a stated (illustrative business-data) origin;
`threshold`'s undefined first use in paragraph 2 given a parenthetical gloss, and its Step 3 "reintroduction"
given a recall signal instead; `scale_pos_weight` given a recall pointer back to the gradient_boosting
module where it was first taught; a pause-and-predict beat added before the class-weight retrain reveal;
the metric-menu paragraph given one clause of mechanism per term (MCC, specificity, balanced accuracy) plus
a "when to reach for which" framing. Lower-severity, systemic findings (full voice-rule-1 compliance across
every remaining term; every section-transition rewritten to a strict crisis→inevitability arc) were left
as-is per the pipeline's own allowance for judgment after the clear-cut fixes are made — the same tension
is present, unresolved, in the `gradient_boosting` reference template itself.

**Verification:**
- `npx -y esbuild@0.21.5 src/data/foundations/classicalMLModules.js --bundle --format=esm --outfile=/dev/null`
  (run against the fix-applied file before it was written back to disk) — compiles clean; only the same
  pre-existing, unrelated duplicate-`interactiveId`-key warnings as batch 1 (harmless, predates this pass).
- `git diff --stat` on the live file after write-back: 199 insertions / 70 deletions (up from the
  interrupted pass's 190/61 — the fix-loop added net new content, no deletions of prior work).

**Glossary + interview-question harvest (from the finalized/audited text only):** 8 new glossary terms
(`gini impurity`, `information gain`, `cost-complexity pruning` from `trees`; `bagging`, `out-of-bag` from
`random_forest`; `cost matrix`, `precision@k`, `smote` from `class_imbalance`) — all net-new, none collide
with the existing 49 keys. Deliberately excluded as over-generic (same reasoning as prior batches):
precision/recall/F1/threshold/class weight (reused with the same meaning across many other module
families); PR-AUC (already keyed from `auc_roc`, equivalent definition, a dedup not a fresh term); bare
"entropy" (mis-linking risk into unrelated cross-entropy-loss prose elsewhere in the app — "information
gain," the compound term this module actually needs, is keyed instead). 6 new `questionBank.js` entries
(ids 149-154, domain "Classical ML", 2 per module) — Gini-purity-vs-size-balance, regression-tree
extrapolation, the n_estimators-plateau/max_features-lever distinction, an OOB-vs-test-error-gap diagnosis,
F1-drop-but-cost-matrix-cheaper reasoning, and SMOTE-before-split leakage — all grounded strictly in the
finalized module prose, none testing anything not taught.

**This closes out Classical ML batch 2** — `trees`, `random_forest`, and `class_imbalance` have now
completed the full writer → Pass-2 adversarial audit → fix-loop → glossary/interview-question harvest
pipeline. Classical ML foundations (`linear_regression` through `class_imbalance`, all modules up to and
including `gradient_boosting`'s neighbors covered by batches 1-2) are now S-tier-complete by this pipeline's
bar. Not pushed — no git commands run, per standard MSL workflow (hand to Sidharth's Mac for build + push).
