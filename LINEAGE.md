# Lineage & Ideas

Design history, inspiration, and future directions for ML Systems Lab.
Last updated: May 2026

---

## Origin

Started as a personal study tool — a place to collect production ML judgment patterns that don't appear in textbooks or standard courses. The gap it targets: you can finish an ML course and still freeze when a model degrades silently in production, or when asked to choose between blue-green and canary at 3am. This lab is the answer to "where do you practice that?"

---

## Inspiration

| Source | What it shaped |
|---|---|
| **Experimentation Lab** (own project) | Scenario-first judgment module pattern; room-based navigation; "no slides, just calls" framing |
| **GenAI Systems Lab** (own project) | Confrontational hero headline; production failure as primary learning frame; free + no login philosophy |
| **Josh Starmer / StatQuest** | Concept → intuition → math order. Gradient posts follow this arc. |
| **3Blue1Brown** | Visual + animated math. Aspiration for interactive visualizations in Pyodide cells. |
| **Chip Huyen's writing** | Production ML framing — what actually breaks vs what textbooks cover. |
| **Will Larson's Staff Engineer** | Staff/principal content — decisions at scale, cross-domain trade-offs, platform thinking. |
| **Airbnb/Uber/Spotify eng blogs** | Source material for scenarios. Real incidents, real architectures. |

---

## Design evolution

### v1 — Pill navigation
Two-level domain → tab navigation. Required 3 clicks to reach content. Cognitive load too high. Abandoned.

### v2 — Topbar + content area
Horizontal tab bar. Scrolled off screen on mobile. Didn't scale past 10 tabs. Abandoned.

### v3 — Sidebar + topbar (long-running)
Persistent 220px left sidebar with domain groups and color-coded labels. Topbar with logo + search. Worked well on desktop, poor on mobile. Ran for many versions.

### v4 — Bottom-nav 5-zone (current)
Replaced sidebar entirely with a fixed bottom nav bar — 5 zones: Today / Practice / Read / Interview / Ask. Each zone has its own drill-down state. Practice shows a domain grid → module. Interview shows a tool hub → tool. Topbar shows breadcrumb and back button when inside a sub-tab. Mobile-first, works well on desktop too.

Key routing architecture:
- `TAB_TO_ZONE`: maps every tabId → zone (omit = defaults to `practice`)
- `ZONE_DEFAULTS`: what each zone shows fresh (`null` = grid, string = specific tabId)
- `zoneTab`: per-zone active tab state — zones are independent
- Tapping active zone button resets it to its default (Practice → domain grid, Interview → tool hub)
- `goTo(tabId)`: programmatic navigation from any tab via `onNavigate` prop

### v4.5 — Bug fix + animation pass (May 2026)

**Bug fix:**
- `ForecastFailureZoo` in `TimeSeriesTab.jsx`: all 8 scenarios had `correct: <number>` (index) but the reveal logic used `findIndex(o => o.id === s.correct)` — comparing a number to string IDs. `correctIdx` was always `-1`, so the correct answer never highlighted green and the score never incremented. Fixed all 8 to use the matching string ID (`'split'`, `'sparse'`, `'all'`, `'hierarchy'`, `'autocorr'`, `'structural'`, `'all'`, `'lag'`). Pre-existing bug, only caught now.

**Animations — `index.css` + 15 tabs:**
- Added keyframes to `index.css`: `fadeSlideUp`, `fadeSlideDown`, `scaleIn` (with cubic-bezier spring).
- Added utility classes: `.tab-enter` (fade + slide up, 0.22s), `.accordion-enter` (fade + slide down, 0.18s), `.reveal-enter` (scale in with spring, 0.18s), `.fade-in` (plain fade), `.stagger-1` through `.stagger-5` (delay helpers).
- Applied `.tab-enter` with `key={active}` on `<ActiveModule />` wrapper in 15 tabs: SparkLab, TimeSeries, SystemDesign, DeepLearning, FeatureEng, ModelEval, Airflow, dbt, DataModeling, DLFineTuning, DataScience, CausalInference, Monitoring, MLOpsDeploy, MLOpsPipelines. Every sub-tab switch now fades and slides up.
- Applied `.accordion-enter` on accordion body divs in SparkLab, SystemDesign, TimeSeriesTab — panel slides down when opened.
- Most other tabs already had `animate-slide-up` on their reveal panels from prior sessions.

**Ideas logged from cross-repo audit (GenAI Systems Lab + PAL):**
- 9 new items added to IDEAS.md: "Spot the Flaw" adversarial tab, Share Score button, 91-day heatmap, streak tracking, RSS feed, fidelity badges, React.lazy() splitting, Role Readiness Score, cross-domain Production Incident scenarios, PWA manifest.

### v4.3 — Learning quality sprint + visual overhaul (May 2026)

Large session covering four parallel workstreams: learning quality, visual upgrades, content expansion, and code health.

**Bug fixes:**
- Mobile sidebar appeared alongside bottom nav — `display: 'flex'` inline style on `S.aside` overrode the `.desktop-sidebar { display: none }` CSS class (inline wins). Fixed by removing the inline `display` value.
- Scroll on zone switch was smooth, causing disorienting partial-scroll states. Changed `window.scrollTo({ behavior: 'smooth' })` → `window.scrollTo(0, 0)` (instant) in both `goTo` and `handleZoneNav`.
- Vercel build failure (apostrophes in `InterviewPrepTab.jsx`) — behavioral questions (IDs 101–115) used apostrophes inside single-quoted JS strings. Fixed via Python script converting `q:` / `answer:` fields to double-quoted strings.

**Visual upgrades:**
- Bottom nav: height 56→68px, icon 15→19px with glow pill active indicator, label 11px 500→700 weight, inactive tabs at 35% opacity.
- Desktop sidebar: zone icons 15px with `drop-shadow` filter, labels 12px 700 weight, inactive at 40-45% opacity.
- CombinatorTab question navigator pills: 32×32→40×40px touch targets, 0.7→0.8rem font.
- `index.css` main content padding adjusted to 84px to clear the taller 68px nav.

**Learning quality (Audit #008 response):**
- 190 MCQ explanations expanded across `CombinatorTab` (130) and `TrainerTab` (60) with production failure mode + recognition signal pattern: "In production, this breaks as: [X]. The tell: [Y]." Ran as two parallel agents.
- `StaffLayerTab` expanded 17 → 23 scenarios: Experiment Design ×4 (SRM, novelty effect, 12-simultaneous-tests mutual contamination, SUTVA/spillover), Feature Engineering ×2 (post-redesign covariate shift, offline-online correlation gap = leakage).
- IC3 strawman fixes: s1 revised from "Ship it — p < 0.05" to competent-but-incomplete; s2 revised from "Retrain immediately" to pipeline-check-first.
- "ML Necessity" domain tag added to `StaffLayerTab`; 4 existing scenarios (ml_need_1–4) tagged.
- "↺ Reset reveals" button added to `StaffLayerTab`.

**Content additions:**
- `InterviewPrepTab`: 13 new questions (IDs 116–128) — Statistics, Evaluation, System Design/Staff, Trees, SQL, Features, Regression. Total 115 → 128.
- `SystemDesignTab`: TwoTowerArchitecture SVG component (10 nodes, 9 edges, 4-panel detail).
- `DLServingTab`: MLServingArchitecture SVG component (8 nodes, 9 edges, 4-panel detail).
- `GradientTab`: YouTube IDs added to posts 26–30.
- Related reading CTAs ("📖 Go deeper →") added to `FeatureEngTab`, `ModelEvalTab`, `MonitoringTab`.
- `CombinatorTab`: debrief domain breakdown chart (horizontal bars, sorted weakest-first, mint/ember/rose coloring).
- `VerbatimTab`: word count + WPM display in Review screen (120–160 wpm = good pace callout).

**Session persistence:**
- `CombinatorTab`: full session state saved to `msl_combinator_session` localStorage on every change; resume banner shown on config screen if session exists; cleared on `endSession` and `startSession`.

**Pyodide UX:**
- `PythonCell.jsx`: loading panel added — visible during ~3s Pyodide cold start, shows progress message + "First run takes ~3s" hint.

**Keyboard nav:**
- `ModelEvalTab`, `DeepLearningTab`: 1/2/3/4 key binding to select MCQ option, Enter to confirm, via `useEffect` on AccordionMCQ.

**Code health:**
- Hex color audit across `GradientTab`, `SystemDesignTab`, `SparkLabTab`, `AskTab`, `MonitoringTab` — `#000`/`#fff` replaced with CSS variables.
- Font hardcoding fixed: `fontFamily` strings → `var(--font-sans)` / `var(--font-mono)` across remaining files.
- Silent style bugs fixed in `SparkLabTab` and `SystemDesignTab` where `fontWeight`/`marginBottom`/`color` props were swallowed into `fontFamily` string values.
- `PipelineBlogTab.jsx` deleted (was dead code — null-returning component, not imported).

**Learning Path:**
- `HomeTab` step completion tracking added: `msl_path_progress` localStorage, `markStepDone(pathId, stepIdx)` helper, checkmark/highlight on done steps, "X/N done" / "✓ Complete" badge in collapsed header.

**Optimization objective established:**
- Confirmed as learning quality (mental model transfer, production failure mode recognition) — not engagement. Documented in `DECISIONS.md` as a content rule.

### v4.4 — "Take my money" visual polish pass (May 2026)

Full end-to-end UI audit and polish pass targeting premium product feel across every surface.

**Hero + grids:**
- `HomeTab` hero redesigned: two-column layout (text left, `ScenarioMockup` right), gradient headline with `clamp` font size, live amber pulse badge, body copy bumped to 17px / `var(--ink-hi)`.
- Feature cards: replaced stats (200+, 9 tools, Free) with 3 SVG-icon cards (Scenarios / Interview tools / Career levels). "Free" card removed.
- `App.jsx` `INTERVIEW_TOOLS`: all 6 unicode icons → SVG, `step` field added (01–04), step badges rendered on cards.
- `InterviewGrid`: "Nine tools. One loop." editorial header + sequence copy.
- `PracticeGrid`: "Practice" eyebrow + "200+ production scenarios." headline.
- Topbar: GitHub link button added (desktop only).

**Design system upgrades (`index.css`):**
- Body background: center-top amber atmosphere (radial-gradient, 50% 0%, 0.22 opacity).
- `.card`: gradient top sheen, rgba border, inset highlight, depth shadow.
- `.card:hover`: `translateY(-4px)` + stronger shadow.
- `.card-glow:hover`: strong amber bloom.
- Keyframes added: `float-mockup` (5s), `orb-pulse` (7s), `mesh-drift`. Utility classes `.mockup-float`, `.orb-pulse`.

**Tab headers — gradient text pass:**
- All 20+ tab h1 headers upgraded: `fontSize: '28px', fontWeight: 900`, domain accent → `var(--ink-hi)` gradient. Domain accent map: ML Eng/Classical/SysDesign = mint, DE = ember, DL = violet, DS = sky, MLOps = rose, Interview = prime.
- All h3 section headers (sub-module titles) upgraded: `fontWeight: 800`, plain `var(--ink-hi)` → domain accent color. Covers FeatureEng, ModelEval, Spark, Airflow, dbt, DataModeling, DeepLearning, DLFineTuning, DLServing, DataScience, Monitoring, MLOpsDeploy, MLOpsPipelines, ClassicalML, SystemDesign.

**Icon replacements:**
- ☆/★ bookmark icons → inline SVG bookmark (outline/filled) in 6 tabs: DeepLearning, InterviewPrep, ModelEval, SparkLab, SystemDesign, TimeSeries.
- ▶ expand/collapse chevron → SVG chevron with smooth rotation in 4 tabs: SparkLab, SystemDesign, TakeHome, TimeSeries. Also fixed `transform: 'none'` → `rotate(0deg)` for proper CSS animation.

**Content surface upgrades:**
- `GradientTab`: PostCard featured redesigned (2-col, Space Grotesk, 220-char excerpt, gradient sheen). Standard PostCard consistent card design. Playfair Display removed — PostReader h1 now Space Grotesk weight 900 gradient.
- `AskTab`: KB Search h2 → 28px weight 900 sky gradient.
- `CombinatorTab`: h1 → rose→white gradient.
- `TrainerTab`: h1 → violet→white gradient.

**Polish details:**
- `InterviewPrepTab` session summary stat cards: plain `var(--depth)` → glass style (gradient bg, inset highlight, depth shadow).
- Tab description copy under h1: `var(--ink-low)` → `var(--ink-mid)` across 11 tabs (was near-invisible at 40% opacity).
- Context blocks in SparkLab, CausalInference, TimeSeries, SystemDesign: upgraded to glass style.
- Score strips in 4 tabs: upgraded from plain `var(--depth)` to gradient sheen + inset highlight.

### v4.2 — Audit sweep + StaffLayerTab expansion (May 2026)

Full baseline audit pass (7 audits, #001–#007). All high and medium findings resolved in the same session. Key changes:

**Analytics hardening:** `autocapture: false` added to `posthog.init()` in `analytics.js` — prevents PII capture from free-text input tabs (VerbatimTab, CodeBugsTab, AskTab, TakeHomeTab). `trackModuleComplete` wired into TrainerTab (session end), CombinatorTab (debrief), StaffLayerTab (staff level reached). `METRICS.md` created as canonical analytics and localStorage taxonomy.

**Design system cleanup:** Three CSS variables added to `:root` in `index.css`: `--white` (#ffffff), `--font-sans`, `--font-mono`. Hardcoded hex colors replaced across 5 files. Hardcoded `fontFamily` strings replaced across 31 files with `var(--font-sans)` / `var(--font-mono)`.

**Structural fixes:** `onNavigate` prop added to all 26 tab exports that were missing it (single housekeeping pass via Python regex). `PipelineBlogTab.jsx` deleted — was dead code returning null, replaced months earlier by `GradientTab`.

**SEO/Social:** `og-image.png` (1200×630px) generated and placed in `public/` — was referenced but missing, breaking all social share previews. `sitemap.xml` created in `public/` covering 28 routes.

**Content expansion (StaffLayerTab):** 5 "Do we need ML?" problem-framing scenarios added (s13–s17: churn→email blast, ticket auto-categoriser at 2 tickets/day, fraud flag at 0.001% base rate, semantic search vs keyword, employee attrition prediction). Domain tag added: `'Problem Framing'`. Progress bar made dynamic (was hardcoded to 12 scenarios). Total scenario count: 17.

**First-Time User audit (#007):** 5 friction points documented — Ask label mismatch, Interview tools zone split, changelog first-timer visibility, Gradient cold entry, Interview sequence not communicated. All open, buildable.

### v4.1 — Mobile optimization
- `env(safe-area-inset-bottom)` on bottom nav for iPhone home indicator
- Responsive grids: `minmax(min(210px, 100%), 1fr)` — no horizontal scroll on 375px
- Touch targets: `min-height: 36px`, 20px slider thumbs on touch devices
- Topbar overflow: breadcrumb truncates with ellipsis
- `WebkitTapHighlightColor: transparent` removes grey tap flash on iOS Safari
- Dead sidebar CSS removed from index.css

### Color system
Dark void background (`#0c0a08`). CSS variables:
- `--prime` (#f0a500) — gold, primary accent
- `--mint` (#34d399) — success/green
- `--sky` (#22d3ee) — data/cyan
- `--ember` (#f97316) — warning/orange
- `--rose` (#f43f5e) — error/red
- `--violet` (#a78bfa) — secondary accent

Each domain has a consistent accent throughout card borders, eyebrows, and badges.

---

## ∇ Gradient philosophy

Gradient is the curriculum entry point, not a blog. Intended flow:
1. User opens a Gradient post (e.g., "Why AUC can lie to you")
2. Post teaches the concept — explanation + embedded YouTube
3. Post ends with CTA linking to the practice module
4. User goes from reading → doing in one click

Posts are categorized by domain and filterable via domain bar.

---

## Python sandbox philosophy

Pyodide runs real Python in the browser. Math Foundations tab uses it for PCA Explorer, SVD Decomposer, Calibration Curves, and NumPy Internals.

Rule: Python cells build intuition, they don't replace reading. Explanatory text always comes first.

Future cells: decision boundary visualizer (ClassicalML), propensity score matching (CausalInference), attention head heatmap (DeepLearning).

---

## Interview zone philosophy

The Interview zone is a simulation layer, not just a Q&A bank. Built for the 2–4 weeks before an interview:

- **Take-Home Bank** — async deep thinking, model answer comparison, self-calibration
- **Trainer** — spaced drilling on weak domains, MCQ + heatmap feedback loop
- **Combinator** — full exam simulation under time pressure; answers locked until done
- **Code Bugs** — production code reading, not algorithm puzzles
- **Case Studies** — multi-part company scenarios (Netflix/Uber/Airbnb/DoorDash/Spotify)
- **Staff Layer** — IC3 → IC5 → Staff reveals teach how seniority changes your answer
- **JD Prep** — makes the study plan adaptive to the actual job description
- **Defense Doc** — structured output (PDF brief) for self-accountability
- **Verbal Practice** — closes the gap between knowing the answer and saying it out loud

Philosophy: by the time you've run through all 9 tools against a specific JD, you're not cramming — you're simulating.

---

## Ecosystem context

```
ML Systems Lab          Core ML, DE, DL, MLOps, DS + 9 interview simulation tools
GenAI Systems Lab       Prompt engineering, RAG, agents, LLM eval
Experimentation Lab     A/B testing, SRM, CUPED, power analysis, stats
```

The labs are intentionally independent — you can use any one without the others. Cross-links exist on each homepage. The unified learning path is the long-term north star.
