# IDEAS.md — Build Backlog

Future-facing. Prioritized. Feeds from AUDITS.md findings and creative sessions.  
Last updated: 2026-05-29 (repo analysis: genai-systems-lab + experimentation-systems-lab)

**Rule:** AUDITS.md feeds this file, not the reverse. Audit findings that are buildable features go into Tier 1 here. Features you want to build don't go into AUDITS.md.

---

## In Progress

*Move items here from Tier 1 at the start of a session. Strike through and move to LINEAGE.md when done.*

- [x] ~~**Improve distractor quality**~~ — done (2026-05-29, 14 questions across CombinatorTab + TrainerTab, replaced trivially-eliminable wrong options with plausibly-wrong options requiring real reasoning)
- [x] ~~**Share Score clipboard button**~~ — done (2026-05-29, CombinatorTab debrief + TrainerTab ResultsScreen, navigator.clipboard, copied/setCopied 2s toggle)
- [x] ~~**Fidelity/simulation badges**~~ — done (2026-05-29, 6 tabs: ✓ Real execution on SparkLab + ModelsMath, ~ Simulated on Combinator/Trainer/Verbatim/StaffLayer)
- [x] ~~**Streak tracking + 91-day heatmap**~~ — done (2026-05-29, HomeTab — msl_streak/msl_last_visit/msl_activity_YYYY-MM-DD, 7×13 GitHub-style grid, streak pill)

---

## Tier 1 — High impact, buildable now

### Emoji → SVG replacement (identified 2026-05-29, post v4.14 partial audit)
- [ ] **Full emoji sweep + SVG replacement** — v4.14 cleaned `icon:` data fields and prefix emoji across 18 tabs. Residual emoji remain in rendered UI copy, button labels, section headers, and inline content. Next pass: grep all tab files for emoji codepoints, categorise (decorative → replace with inline SVG using CSS variable colors; functional glyphs like ✓ ✗ → keep; country flags → keep), then replace. SVGs should reference `currentColor` or CSS vars so they theme correctly. Run audit #009 first to get the full per-tab list before starting.

### Mobile layout verification (identified 2026-05-29, after v4.16)
- [ ] **HomeTab TODAY row on narrow screens** — Two-column `gridTemplateColumns: 'minmax(0, 1fr) auto'` not tested below 375px. Activity widget is ~90px; at 320px the case card gets ~220px which may be too narrow for the scenario text. Fix if needed: add `@media (max-width: 480px)` to stack columns vertically. All other v4.16 changes (flex-wrap role buttons, `minmax(240px)` track grid) are mobile-safe patterns — just the TODAY two-col needs a live check.

### Positioning & Discoverability (from external review, May 2026)
- [ ] **README positioning rewrite** — current README leads with scope ("200+ scenarios, 6 domains, 9 tools") rather than product thesis. Rewrite: open with the judgment gap the product solves, foreground the flagship experience (45-min mock + Defense Plan flow as the Interview zone entry), then scope. Add a "What makes this different" section explicitly naming Pyodide, Web Speech API, StaffLayer, CodeBugs as the four things hard to find anywhere else. ~30 min. High external-perception return. (Source: external review, May 2026)
- [ ] **New user cold-state entry path** — HomeTab is correctly for returning users (DECISIONS.md). New users arriving from GitHub, search, or a share link have no orientation. Detect new user state (no `msl_tab` + no `msl_score:*` keys + no `msl_access`) and show a one-time orientation banner: "New here? Start with the 45-min mock →" with 2–3 tab suggestions. Banner disappears permanently after any tab is visited. No permanent HomeTab real estate — one-time surface only. ~45 min. (Source: external review, May 2026)
- [ ] **Social proof signal** — the repo looks identical with 0 users or 10,000. When there are verifiable numbers (beta signups, tester count, any usage metric), add a single line to the README. Even "used by N engineers in their interview prep" changes the perception from "is this maintained?" to "real users exist." ~10 min whenever the data is available. (Source: external review, May 2026)

### HomeTab polish (identified 2026-05-29, post v4.16)
- [ ] **Activity widget: hide heatmap when sparse** — For users with ≤3 days of activity, the 4-week grid is 27 dark squares and 1 lit dot. It looks broken, not informative. Either hide the grid until there are ≥7 active days, or replace it with a simple "Day 1" / "Day N" message for new users. The streak number alone is enough for early days.
- [ ] **Continue bar: only show if pct > 0** — Currently shows "Spark Lab · 0%" which signals no progress. A 0% bar is noise. Should only render if `nextUp.pct > 0`, i.e., the user has genuinely started the track. If nothing has been started, suppress the bar entirely.
- [ ] **HomeTab visual hierarchy** — Role → Continue → All Tracks three full-width sections carry equal weight. Add a subtle divider or increase spacing before "All Tracks" to signal the shift from "your session" context to "browse everything".
- [ ] **Domain completion bars on HomeTab** — PAL's Progress page shows per-room completion bars (e.g., "Stats 1/20", "RCA 1/24") which makes domain progress instantly readable. MSL's HomeTab has streak and activity data but doesn't show "X of Y scenarios completed in this domain." Implementation: read `msl_score:*` keys (already exist per-tab), map to known scenario counts per tab, render compact bars in the "All tracks" section — tab name, X/total count, thin progress bar. ~1 hour. The data is already in localStorage; this is purely a display change. (Source: PAL comparison, May 2026)

### Learning Path
- [x] ~~**Guided learning paths with sequenced module order**~~ — done then removed (built 2026-05-27; removed v4.15 2026-05-29 — duplicated Practice zone nav, role selector 3-step sequence covers the same job more lightly)

### Learning Quality (from Audit #008)
- [x] ~~**Expand MCQ explanations to include production failure mode + recognition signal**~~ — done (2026-05-27, 190 explanations expanded across CombinatorTab + TrainerTab with "In production, this breaks as: [X]. The tell: [Y]." pattern)
- [x] ~~**Improve distractor quality in CombinatorTab and TrainerTab**~~ — done (2026-05-29, 14 questions fixed, 2-of-3 wrong options now require genuine judgment)
- [x] ~~**Add StaffLayerTab scenarios in thin domains**~~ — done (2026-05-27, 6 new scenarios: Experiment Design ×4 (SRM, novelty effect, 12 simultaneous tests, SUTVA), Feature Engineering ×2 (covariate shift, leakage). Total 17 → 23)
- [x] ~~**Fix IC3 strawman reveals in StaffLayerTab**~~ — done (2026-05-27, s1 and s2 IC3 revised to competent-but-incomplete responses)

### Content
- [ ] **StaffLayerTab or SystemDesignTab: "Do we even need ML?" scenario type** — present a business request framed as an ML problem, user must judge whether ML is actually warranted or if a simpler solution dominates. Seed scenarios: (1) churn prediction where the action is "send an email" → correct answer is just send everyone the email; (2) support ticket auto-categoriser, 8 categories, 2 tickets/day → ML ROI is negative, regex + human triage wins; (3) "AI-powered" fraud flag where the fraud rate is 0.001% → precision/recall economics make a rules engine better. Core judgment: what's the counterfactual action? What volume justifies the model? What's the real cost of a false positive vs. a simpler system? Reveal should model the PM/engineer dialogue cadence from the post — short Socratic questions that expose the assumption. Ties directly into StaffLayerTab's "kill more projects than you ship" ethos. (Source: LinkedIn post, May 2026)
- [ ] Add 5+ Gradient posts — priority order: "feature store time-travel bug" → Feature Engineering, "validation set leakage" → Feature Engineering, "Forecast Failure Zoo" → Time Series, "two failure modes of A/B tests" → Experimentation cross-link, "quantization from first principles: what FP16 throws away" → DL Serving
- [ ] Add YouTube embed IDs to remaining Gradient posts (currently only 3 have videos)
- [x] ~~**Interview Q&A: expand to 100+**~~ — already at 128 questions (confirmed 2026-05-29)
- [x] ~~**TrainerTab: expand MCQ bank from 30 → 60**~~ — already at 60 questions (confirmed 2026-05-29)
- [x] ~~**CombinatorTab: expand question bank from 50 → 100**~~ — already at 100 questions (confirmed 2026-05-29)

### First-Time User friction (from Audit #007)
- [x] ~~**Rename "Ask" zone → "Search"**~~ — done (nav label is 'Search', zone id stays 'ask')
- [x] ~~**Rename Practice-zone "Interview Tools" domain card to "Drills"**~~ — done (domain label is 'Drills')
- [x] ~~**Add numbered sequence labels to Interview zone hub cards**~~ — done (v4.10, steps 01/02/03 on Defense Plan/Combinator/Verbal)
- [x] ~~**Add "Start here" pinned row to GradientTab**~~ — explicitly rejected (2026-05-29). "Start here" is prescriptive and adds friction. The Series + Tags redesign (see Tier 2) replaces this with user-driven navigation.

### HomeTab redesign (from PAL screenshot review, May 2026)
- [x] ~~**"Jump Back In" chip**~~ — done (2026-05-29, amber pill top of HomeTab, reads msl_tab, navigates on click)
- [x] ~~**"Today's Case" featured card**~~ — done (2026-05-29, DAILY_CASES array 15 scenarios, date-seeded rotation, domain badge + scenario text + nav)
- [x] ~~**HomeTab hero copy fixes**~~ — done (2026-05-29, dropped "You can train a model.", new headline "Production ML breaks in silence. / Can you find it?", tightened sub-headline)
- [x] ~~**Role selector CTA labels**~~ — done (2026-05-29, ROLE_SEQUENCES map, numbered 3-step path shown in active role panel)

### Freemium gate v2 — granular scenario-level difficulty gating
- [ ] **Tag all 200+ scenarios by difficulty (easy/junior/mid/senior/staff)** — v1 gate is tab-level (free = 4 intro tabs, premium = everything else). v2 should gate within free tabs too: easy/junior scenarios free, medium/hard gated. Requires a `difficulty` field on every scenario object and a `PremiumGate` wrapper in each tab that slices to free content. ~3-4 hours content work + 2 hours implementation. (Source: freemium architecture decision, May 2026)

### Mobile fixes (from Audit #015, 2026-05-27) — v4.8 sprint complete
- [x] iOS input zoom — `font-size: 16px` in `index.css` ✅
- [x] SVG diagrams fixed-width overflow — `maxWidth: '100%'` on both SVGs ✅
- [x] MLOpsDeployTab metrics table clipped — wrapped in `overflowX: auto` ✅
- [x] VerbatimTab iOS Safari fallback — UA detection + platform-specific message ✅
- [x] Topbar back button tap target — padding `10px 8px`, negative margin ✅
- [x] CombinatorTab timer drift after zone switch — `savedAt` timestamp, elapsed subtraction on restore ✅
- [x] VerbatimTab onend double-fire — `isStoppingRef` guard ✅
- [x] DefenseDocTab print CSS — visibility pattern, `@page` margins ✅
- [ ] Pyodide mobile warning — cold start / OOM risk on low-end phones (Source: Audit #015.7) — deferred
- [ ] InterviewPrepTab line length — `maxWidth` + `lineHeight` cap on mobile (Source: Audit #015.10) — deferred

### Modules
- [ ] Behavioral question bank in Interview zone — ML-specific situations (disagreed with a metric, shipped despite uncertainty, stakeholder conflict over model decision)
- [ ] Causal Inference: DAG editor — draw causal graph, identify confounders/colliders/mediators interactively (Pyodide)

### "Spot the Flaw" adversarial format (new tab in Interview zone)
- [ ] **New format: show a real-looking ML analysis/pipeline with a buried methodological flaw — user must find it.** Critical distinction: CodeBugsTab covers code-level bugs (syntax, logic, wrong API call). Spot the Flaw covers methodology-level errors — the system doesn't tell you there's a flaw, you have to find it. This is the higher-order judgment skill interviewers actually test when they say "what would you check first?" Flaw types: data leakage in evaluation, train/test split after imputation, wrong metric for class imbalance, SRM in A/B test, silent feature drift, imputer fit on full dataset, eval metric computed before target lag, peeking at results early, multiple testing without correction, Simpson's paradox in segmented metrics, novelty effect misread as treatment effect, selection bias in experiment enrollment, SUTVA violation, p-hacking via subgroup search, regression to the mean. Format: show analysis with context (code snippet or narrative), ask "what's wrong here?", user selects from 4-6 options (flaw category + location), reveal shows exact failure mode and production impact. Seed: 12 scenarios across Feature Eng, Model Eval, Experimentation, Monitoring. Tab: new "Spot the Flaw" tool in Interview zone (sits between CodeBugsTab and CaseStudiesTab). PAL (experimentation-systems-lab) confirmed this format works — 12 adversarial cases with strong engagement. (Source: PAL experimentation-systems-lab, confirmed May 2026)

### Learning loop completeness (from GenAI Systems Lab + PAL, May 2026)
- [ ] **Pre-Eval Callout pattern** — add a scenario-aware diagnostic beat between "user sees result" and "explanation reveals." Currently: user picks option → explanation shows. The missing beat: after the outcome is shown but before the full reveal, a short prompt that asks the right diagnostic question for *this specific scenario* — e.g., "A stale document is in the retrieved context — look at the source timestamps before evaluating." GenAI Systems Lab calls this a Pre-Eval Callout; it fires as an inline hint, not a separate screen. Target tabs: SystemDesignTab, ModelEvalTab, MonitoringTab, MLOpsDeployTab, CausalInferenceTab. This is the moment in the learning loop where real understanding forms — not after seeing the answer, but while reasoning toward it. ~1–2 hours content work per tab (writing per-scenario hints) + ~1 hour UI pattern.
- [ ] **Module endings with forward pointer** — every tab's content currently ends silently. GenAI Systems Lab ends every module with a link to a PrepLab question, a GT post, or a "next module" suggestion. The equivalent for ML Systems Lab: every tab/module content end should include one forward action — a CombinatorTab question covering this domain, a Gradient post, or the next logical tab. This closes the learn loop and eliminates the "what now?" dead end. Implementation: add a `ForwardPointer` component (consistent style) at the bottom of each module's rendered content. Most tabs already have a "Go deeper → Read X in Gradient" CTA — that pattern exists, just not consistently applied. ~30 min to standardize the component, 1–2 hours to wire all tabs.

### Architecture (from PAL, May 2026)
- [ ] **Slim scenario index + lazy content loading** — PAL separates scenario routing/paywall metadata (id, isFree, title, domain) from full scenario content (question, options, explanation, code snippets). Full content loads only when a case is opened. At 200+ scenarios across 30 tabs, ML Systems Lab likely bundles all scenario data on initial load — every `SCENARIOS`, `QUESTIONS`, `BUGS` constant in every tab file is eagerly imported. Run a bundle size audit first (`npm run build -- --reportCompressedSize` or check Vite bundle analyzer output). If bundle > 1.5 MB, this architectural split is the fix. PAL fixed this in V4.20 and it was listed as P0. (Source: PAL App.jsx architecture, May 2026)

### Features
- [x] ~~**"Share Score" clipboard button on CombinatorTab debrief and TrainerTab session end**~~ — done (2026-05-29)
- [x] ~~**91-day practice heatmap**~~ — done (2026-05-29, HomeTab, 7×13 grid, msl_activity_YYYY-MM-DD)
- [x] ~~**Streak tracking**~~ — done (2026-05-29, HomeTab, msl_streak / msl_last_visit)
- [x] ~~**Fidelity/simulation badges on module headers**~~ — done (2026-05-29, 6 tabs)
- [ ] **Premium unlock moment** — the AccessGate code entry currently confirms with a text message and the content appears. Replace with a brief animated transition: scale + fade in (~300ms), glow pulse on `--prime`, "You're in" heading before content renders. One interaction, no navigation. This is the branding gap — the unlock should feel like crossing a threshold, not submitting a form. ~30 min. (Session: 2026-05-29)
- [ ] **RSS feed for Gradient posts** — generate `/rss.xml` at build time from `gradientPosts.js` metadata. 20 most recent posts. Adds a distribution channel for free. ~30 min to write a Vite plugin or pre-build script. (Source: GenAI Systems Lab, May 2026)

---

## Upgrades — rewrites and merges of existing components

*Items here affect existing UX and have a different risk profile from new features. Different from bug fixes (those go in Known Bugs) and new content (those go in Tier 1). Spin this section out into UPGRADES.md if it grows past 5 items.*

### ~~JDPrepTab + DefenseDocTab → unified Interview Strategy tool~~ — done (2026-05-29, Defense Plan, v4.10)

Merged into **Defense Plan** (DefenseDocTab). 3-screen flow: JD parse → self-rate + horizon → gated day plan. Internal gate at 35% of plan sections. JDPrepTab retired (redirect stub). See LINEAGE.md v4.10.

---

## Tier 2 — High impact, more effort

### Modules
- [ ] **Classical ML: Decision boundary visualizer** — Pyodide cell in ClassicalMLTab. User selects kernel (linear / RBF / polynomial) and adjusts C/gamma sliders; the cell recomputes a 2D decision boundary on a fixed toy dataset and re-renders. Purpose: builds intuition for what "kernel trick" means without formalizing the math first. Scenario framing: "Your SVM is performing well in offline eval but generalising poorly. Which kernel + regularisation combination created this boundary?" The visualizer is the explanation, not decoration. Implementation: sklearn SVC on a 2D Gaussian mixture dataset; matplotlib contourf exported as base64 image in Pyodide; sliders update Python variables and re-run the cell. ~2–3 hours.
- [ ] **Spark Lab: Memory pressure simulator** — new scenario type in SparkLabTab. User is given an executor config (cores, memory, memoryFraction) + a job spec (dataset size, shuffle width, join type) and must predict: OOM, slowdown, or healthy. Rule-based prediction (not ML) — the logic is deterministic given the config inputs. Purpose: teaches the mental model for Spark executor sizing without requiring a live cluster. Reveal shows the calculation path: available memory → reserved fraction → execution memory → estimated shuffle spill → verdict. Format fits the existing SparkLabTab tab structure — one new scenario type alongside Shuffle Hell and Partition Skew. ~2 hours.
- [ ] **Deep Learning: Attention head visualizer** — Pyodide cell in DeepLearningTab. Loads a pre-tokenized input (fixed short sentence), runs a simplified self-attention implementation, renders a heatmap of attention weights per head. User can select which head to inspect. Purpose: makes "what does a head attend to?" concrete. Implementation: numpy-only attention (no torch in Pyodide without wasm build) — simplified single-layer, multi-head. The heatmap is the primary output; the weights are real even if the model isn't pretrained. ~3 hours (Pyodide numpy + matplotlib heatmap).
- [ ] **MLOps: Model Registry Patterns module** — new module in MLOpsPipelinesTab. Three scenarios covering: (1) model versioning strategy (semantic versioning vs. hash-based, when each breaks), (2) model promotion gates (shadow → canary → production promotion logic, what signals gate each stage), (3) rollback triggers (what observable signals should trigger an automated rollback vs. manual review). Format: same AccordionMCQ pattern as other MLOps modules. This is a gap in the current pipeline coverage — CI/CD tab covers the pipeline mechanics but not the registry state machine. ~1.5 hours content + ~30 min wiring.
- [ ] **Monitoring: Alerting decision tree** — new module in MonitoringTab. Interactive branching scenario: user is given an alert (e.g., "feature drift detected on user_age, PSI = 0.18") and must decide: page immediately / log and watch / auto-rollback / suppress (known data pipeline issue). Decision depends on: alert severity, business context (batch inference vs. real-time serving), model role (primary vs. fallback), time of day. Each branch reveals the production reasoning. Format: branching MCQ (not linear — first choice determines next question). This is different from existing Monitoring modules which are linear. Adds the "what do you actually do at 2am" judgment that's missing from pure drift detection scenarios. ~2–3 hours (branching state machine + content).

### Features
- [ ] Progress export — download full mastery snapshot as JSON (all `msl_*` localStorage keys)
- [ ] Module bookmarking — star a scenario to revisit (`msl_bookmarks`)
- [ ] Scenario difficulty filter in judgment modules (easy/medium/hard)
- [ ] Keyboard navigation: 1/2/3/4 to select options, Enter to confirm
- [ ] Gradient: "Mark as read" per post (localStorage)
- [ ] Global search: keyboard arrow-key navigation through results
- [ ] HomeTab: "Recommended first module" based on role (more opinionated than current CTA)
- [ ] **React.lazy() + Suspense code splitting across all 30+ tabs** — currently all tabs are eagerly imported in App.jsx, which inflates the initial JS bundle. Wrap each tab in `React.lazy()` and add a `<Suspense fallback={<LoadingSpinner />}>` wrapper in the router. Each tab loads only on first visit, then cached. Significant improvement to first-load performance, especially on mobile. ~1–2 hours to wire correctly. (Source: PAL architecture, May 2026)
- [ ] **Role Readiness Score** — compute a Junior / Mid / Senior / Staff readiness signal from cross-tab completion and score data. PAL's implementation: per-domain breakdown (not just overall %), mapped to seniority levels, surfaces study recommendations ("You're reading as Senior-Ready in MLOps, Junior-Ready in Experimentation — prioritise CausalInference and ModelEval next"). Input signals: CombinatorTab session score (domain breakdown), TrainerTab accuracy per domain, StaffLayerTab staff-level reveal count, ModelEval completion, SparkLab exercises run. Store as `msl_readiness_score` (JSON object, per-domain). Display on HomeTab alongside Continue bar. The gap from current state: ML Systems Lab produces scenario-level grades; this aggregates them into a study-direction signal. (Source: PAL role readiness dashboard, May 2026)
- [ ] **Spaced repetition queue** — track which scenarios/modules a user completed N days ago and surface them for review. Intervals: 1, 3, 7, 14, 30 days (standard SR schedule). Store completion timestamps in `msl_sr_log` (JSON: `{tabId, moduleId, completedAt}`). Queue rendered in HomeTab or a dedicated Progress view — "Review these 3 scenarios today" with direct nav links. No backend needed — pure localStorage + date arithmetic. This is the highest-retention feature PAL has and ML Systems Lab has nothing equivalent. Completion-only tracking is not retention. (Source: PAL Progress view with spaced rep queue, May 2026)
- [ ] **`isFree` per-case gating** — upgrade freemium from tab-level to case-level. PAL's model: every scenario/case object has an `isFree: boolean` flag; the first 2–3 cases per tab are free to sample, the rest gate. Better acquisition experience than ML Systems Lab's current all-or-nothing tab lock — users can try any domain before hitting the gate. Implementation: add `isFree` to every scenario object in every tab (bulk tagging: first 2 scenarios per module = `isFree: true`), update `AccessGate` to filter rather than fully block when `isFree` cases exist. Subsumes the "granular difficulty gating" Tier 1 item — both require case-level tagging. (Source: PAL freemium architecture, May 2026)
- [ ] **"Next scenario" sticky CTA** — after completing any scenario, a sticky or inline CTA that links directly to the next scenario in the module without requiring the user to return to the module nav. PAL added this in V4.24–V4.25 across all runners. ML Systems Lab has "Next" buttons in some tabs but not consistently. Low effort, measurable friction reduction for users doing consecutive scenarios. (Source: PAL V4.24–V4.25 changelog, May 2026)

### Design
- [x] ~~VerbatimTab: add word count + speaking rate (words/min) in Review screen~~ — done (2026-05-27, word count + WPM with 120–160 wpm callout)
- [x] ~~CombinatorTab: per-domain breakdown chart in Debrief screen~~ — done (2026-05-27, horizontal bars sorted weakest-first, mint/ember/rose coloring)
- [x] ~~StaffLayerTab: "Reset all reveals" button for re-study~~ — done (2026-05-27, "↺ Reset reveals" button)
- [ ] Practice zone: overall progress percentage on grid header
- [ ] Interview zone: session history summary on hub grid (X sessions run, avg score)
- [ ] Gradient: "Start here" sort option within each domain (beginner-first)
- [ ] **Fidelity badge upgrade: 3-tier honesty system** — current badges are binary (✓ Real execution / ~ Simulated) on 6 tabs. GenAI Systems Lab runs a 3-tier system on every module: **Mathematically Faithful** (exact algorithm, real computation), **Simplified** (correct concept, illustrative numbers or reduced dimensionality), **Conceptual** (analogy or demo — builds intuition, not a working implementation). The current binary is ambiguous — "~ Simulated" covers both "simplified but correct" and "demo that skips real math." The 3-tier system is honest infrastructure: users know exactly what they're learning from. Audit every interactive module in SparkLab, ModelsMath, FeatureEng, ModelEval to assign the right tier, then update the badge. (Source: GenAI Systems Lab DECISIONS.md, May 2026)

### Company Tracks (from PAL, May 2026)
- [ ] **Curated scenario sequences by company interview pattern** — PAL has tracks for FAANG companies: each track is a curated sequence of cases from across rooms, weighted by what that company's interview loop actually tests. The ML Systems Lab equivalent: Google MLE track (weights System Design + Spark + MLOps), Meta MLE track (weights Feature Engineering + Model Eval + Deployment), Stripe DS track (weights Causal Inference + TimeSeries + ModelEval + DataScience). Data needed: research what each company's ML interview loop covers at Senior/Staff level (public prep guides + Glassdoor reports). Implementation: a `COMPANY_TRACKS` config in App.jsx mapping company → `[{tabId, moduleId}]` sequences; rendered as a dedicated "Tracks" view in the Interview zone or as a HomeTab section below "All Tracks." Mostly a curation problem, not a code problem. (Source: PAL Company Tracks, May 2026)

### Cross-domain scenarios
- [ ] **"Production Incident" cross-tab scenarios** — a single scenario that requires reasoning across multiple domains simultaneously. E.g., "Model AUC dropped 4 points 72 hours after a feature store migration. Serving P95 latency increased 40ms. What do you check first, in what order, and what's the most likely root cause?" Correct answer requires: Feature Engineering (store migration → feature drift), Monitoring (latency signal = schema mismatch or embedding recomputation), MLOps (was the migration rolled forward or is there a rollback option). Format: multi-step diagnosis with branching — choose your first action, see what that reveals, choose next. 6–8 scenarios. Tab: could be a new "Incident Room" tool in Interview zone. (Source: PAL cross-room challenges concept, May 2026)

### DefenseDocTab v2 — Gap-mapped, cost-weighted prep plan (identified 2026-05-29)

**Concept:** Full rebuild of Defense Plan around the core insight that the only prep that matters is the gap between what the JD requires and what the user can already evidence from their resume. Everything else is noise.

**5-step flow (fast path + optional enrichment):**

1. **JD input** — already exists. Parse required skills, signals, and competencies.
2. **Resume input** *(optional enrichment)* — paste-as-text or file upload (PDF with text-paste fallback for edge cases — column layouts, icon-heavy resumes, non-standard encodings). Map resume signals against JD requirements. Output: the delta — skills/signals in JD not evidenced in resume. This is the actual prep surface. Without resume, default to rating on all JD signals (current behavior).
3. **Self-rating on gaps only** — not "rate yourself on everything the JD mentions" (current behavior), but "rate yourself on the things your resume doesn't cover." Fewer questions, more targeted, doesn't waste time on things already proven.
4. **Round context** — two inputs: (a) round type selector: Technical / Hiring Manager / Behavioral / HR; (b) time horizon: 3 / 7 / 14 days. These two together determine the weighting of the output plan — a 3-day behavioral prep and a 14-day technical prep are completely different documents.
5. **Previous round history** *(optional enrichment)* — if the user is mid-process (already completed a screen or two), they can describe what happened and any feedback received. This is the real personalization signal. Example: "first technical went well but got dinged on scale estimation" → upweight scale estimation questions in the plan regardless of self-rating. No other tool captures this because it requires the user to be mid-loop, not starting fresh.

**Output:** Gated day-by-day prep plan. Gate logic same as v1 (35% threshold). Plan sections weighted by: gap severity (self-rating score) + round type + time horizon + round history signals (if provided).

**Key design constraints:**
- Fast path must exist: JD only → plan in 2 steps (same as v1). Resume + round history are optional enrichment; the plan degrades gracefully without them — don't gate on completing all 5 steps.
- This is DefenseDocTab v2, not a new tab. Same tab, same place in the Interview zone flow.
- localStorage only — resume text, JD text, self-ratings, round history all storable without a backend.

**Build trigger:** Current Defense Plan completion rate shows users actually finishing the 3-step flow regularly. Don't rebuild an underused feature with 5 steps before the 3-step version has traction. (Decided 2026-05-29)

**Risk:** Form fatigue. 5-6 steps before seeing output is a lot of upfront investment. Fast path is non-negotiable — not optional.

### GradientTab UX (identified 2026-05-29)
- [ ] **Series + Tags redesign** — group the 25 posts into 4–5 named series (e.g., "Silent Failures", "Production Diagnostics"); add per-post tags (domains + concepts). Tags filter collapses to a filtered post list with sort options (newest / most relevant to current practice activity). Default sort when no filter: most relevant to user's active domains. Build trigger: when post count hits 50+. Below that threshold the flat list is navigable and series groupings would just add overhead. (Decided 2026-05-29)
- [ ] **Revise / Learn / What's Next — state-aware reading mode** — three reading lenses powered by existing localStorage data: (1) **Revise** = posts in domains where practice scores are weak (`msl_score:*` < 60%); (2) **Learn** = unread posts in domains the user is actively practicing; (3) **What's Next** = unread posts in domains not yet touched. Data source: `msl_read` (read post IDs) + `msl_score:*` keys. Most valuable of the three — turns the feed from chronological browse into a personalized study queue without any backend. Pagination ("view more after N") explicitly decided against — not needed at 25 posts, reassess at 100+. (Decided 2026-05-29)

### Gradient posts (remaining from ideation)
- [ ] "The 6 ways a recommendation system can silently stop recommending" → System Design
- [ ] "When DiD breaks: parallel trends violations in practice" → Causal Inference
- [ ] "Cold-start is not a model problem, it's a product problem" → System Design

---

## Tier 3 — Interesting, lower priority

- [ ] Unified "Systems Engineer" cross-lab learning path spanning ML + GenAI + Experimentation (6–8 weeks, cross-lab capstone)
- [ ] Ecosystem cross-links: deep links from GenAI Lab and Experimentation Lab into this project
- [x] ~~OG image for proper social preview~~ — done (2026-05-26, public/og-image.png)
- [x] ~~sitemap.xml for SEO~~ — done (2026-05-26, public/sitemap.xml)
- [ ] "NEW" badge on tabs updated within last 30 days
- [ ] Dark/light mode toggle (currently dark-only — see DECISIONS.md for why this is excluded for now)
- [ ] **PWA manifest + service worker** — add `manifest.json` to `public/` (name, icons, theme color, display: standalone) and a minimal service worker that caches the app shell. Makes the app installable on mobile from Chrome/Safari. ~30 min. (Source: GenAI Systems Lab, May 2026)

---

## Known Bugs

- [ ] `window.scrollTo` on zone switch can feel jarring mid-scroll — consider only triggering on user-initiated nav, not programmatic `onNavigate`
- [ ] Pyodide cold start (~3s first load) — no loading indicator during init in Math Foundations
- [x] ~~VerbatimTab: SpeechRecognition `onend` fires unexpectedly on some Chrome versions after silence — needs auto-restart~~ — fixed v4.8 (isStoppingRef guard)
- [x] ~~CombinatorTab: countdown timer continues running if user switches zones — should pause~~ — fixed v4.8 (savedAt timestamp + elapsed subtraction on restore)
- [x] ~~DefenseDocTab: `@media print` PDF export — needs cross-browser verification (Safari, Firefox)~~ — fixed v4.8 (visibility pattern + @page margins)

---

## Retired

Ideas consciously decided against. Don't re-propose without new justification.

| Idea | Reason retired |
|------|---------------|
| RAG architecture judgment module | RAG is GenAI Lab territory (prompt engineering, retrieval, reranking). Wrong lab. |
| Backend / server-side storage | Zero-friction access is a core principle. localStorage + JSON export covers the need. |
| Account system / login | Same as above. Adds friction, adds infra, solves no current problem. |
| Sidebar navigation | Replaced in v4. Scaled poorly on mobile, too many clicks. Bottom-nav is permanent. |
| External component libraries (MUI, shadcn) | Custom inline styles keep the visual language consistent and the bundle lean. |
| Tailwind utilities in component files | Design system must live in CSS variables. Tailwind in components creates drift. |
| Pill navigation (v1) | Required 3 clicks to content. Too much cognitive load. |
| Topbar tab bar (v2) | Scrolled off screen on mobile. Didn't scale past 10 tabs. |
