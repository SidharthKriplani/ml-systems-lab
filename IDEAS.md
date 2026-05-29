# IDEAS.md — Build Backlog

Future-facing. Prioritized. Feeds from AUDITS.md findings and creative sessions.  
Last updated: May 2026

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

### Learning Path
- [x] ~~**Guided learning paths with sequenced module order**~~ — done (2026-05-27, HomeTab LEARNING_PATHS with step completion tracking, checkmarks, X/N counter, msl_path_progress localStorage)

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
- [ ] **Add "Start here" pinned row to GradientTab** — Read zone lands on 25+ posts with no entry point. Pin 2–3 recommended beginner posts per domain, or add a single "Start here" row above the filter bar. ~20 min.

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

### "Spot the Flaw" adversarial format (new tab or Interview zone tool)
- [ ] **New format: show a real-looking ML analysis/pipeline with a buried methodological flaw — user must find it.** Distinct from MCQ (which gives options) — this is open diagnosis. Flaw types: data leakage in evaluation, train/test split after imputation, wrong metric for class imbalance, SRM in A/B test, silent feature drift, imputer fit on full dataset, eval metric computed before target lag. Format: show the analysis with context (code snippet or narrative), ask "what's wrong here?", user selects from 4-6 options (flaw category + location), reveal shows the exact failure mode and why it's dangerous in production. Seed: 12 scenarios across Feature Eng, Model Eval, Experimentation, Monitoring. Tab: new "Spot the Flaw" tool in Interview zone (sits alongside CodeBugsTab). Builds: adversarial reading of real analyses — the skill interviewers test when they say "what would you check first?" (Source: PAL experimentation-systems-lab, May 2026)

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
- [ ] Classical ML: Decision boundary visualizer (Pyodide — SVM kernel comparison, tree depth impact)
- [ ] Spark Lab: Memory pressure simulator — given executor config + job spec, predict OOM vs success
- [ ] Deep Learning: Attention head visualization (Pyodide — transformer internals)
- [ ] MLOps: Model Registry Patterns module in CI/CD & Infra tab
- [ ] Monitoring: Alerting decision tree (when to page vs log vs auto-rollback)

### Features
- [ ] Progress export — download full mastery snapshot as JSON (all `msl_*` localStorage keys)
- [ ] Module bookmarking — star a scenario to revisit (`msl_bookmarks`)
- [ ] Scenario difficulty filter in judgment modules (easy/medium/hard)
- [ ] Keyboard navigation: 1/2/3/4 to select options, Enter to confirm
- [ ] Gradient: "Mark as read" per post (localStorage)
- [ ] Global search: keyboard arrow-key navigation through results
- [ ] HomeTab: "Recommended first module" based on role (more opinionated than current CTA)
- [ ] **React.lazy() + Suspense code splitting across all 30+ tabs** — currently all tabs are eagerly imported in App.jsx, which inflates the initial JS bundle. Wrap each tab in `React.lazy()` and add a `<Suspense fallback={<LoadingSpinner />}>` wrapper in the router. Each tab loads only on first visit, then cached. Significant improvement to first-load performance, especially on mobile. ~1–2 hours to wire correctly. (Source: PAL architecture, May 2026)
- [ ] **Role Readiness Score** — compute a Junior / Mid / Senior / Staff readiness label from cross-tab scores (CombinatorTab session score, TrainerTab accuracy, SparkLab completion, ModelEval, StaffLayerTab reveals). Aggregate into a single `msl_readiness_score` with per-domain breakdown. Show on HomeTab Progress section. (Source: PAL role readiness dashboard, May 2026)

### Design
- [x] ~~VerbatimTab: add word count + speaking rate (words/min) in Review screen~~ — done (2026-05-27, word count + WPM with 120–160 wpm callout)
- [x] ~~CombinatorTab: per-domain breakdown chart in Debrief screen~~ — done (2026-05-27, horizontal bars sorted weakest-first, mint/ember/rose coloring)
- [x] ~~StaffLayerTab: "Reset all reveals" button for re-study~~ — done (2026-05-27, "↺ Reset reveals" button)
- [ ] Practice zone: overall progress percentage on grid header
- [ ] Interview zone: session history summary on hub grid (X sessions run, avg score)
- [ ] Gradient: "Start here" sort option within each domain (beginner-first)

### Cross-domain scenarios
- [ ] **"Production Incident" cross-tab scenarios** — a single scenario that requires reasoning across multiple domains simultaneously. E.g., "Model AUC dropped 4 points 72 hours after a feature store migration. Serving P95 latency increased 40ms. What do you check first, in what order, and what's the most likely root cause?" Correct answer requires: Feature Engineering (store migration → feature drift), Monitoring (latency signal = schema mismatch or embedding recomputation), MLOps (was the migration rolled forward or is there a rollback option). Format: multi-step diagnosis with branching — choose your first action, see what that reveals, choose next. 6–8 scenarios. Tab: could be a new "Incident Room" tool in Interview zone. (Source: PAL cross-room challenges concept, May 2026)

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
