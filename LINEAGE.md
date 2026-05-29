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

### v4.16 — HomeTab dashboard-first rebuild (May 2026)

Continued the declutter with a structural redesign. The guiding principle: HomeTab serves returning users (dashboard), not first-time visitors (landing page). Every section that didn't pass the "does a daily user need this?" test was cut.

**Removed:**
- Hero section — two-column grid with ScenarioMockup, ambient orb, gradient headline, CTAs, "Free · no account" tagline. Pure landing-page content, zero value on return visits.
- FEATURES stats strip — "200+ Scenarios / 9 Interview tools / 4 Career levels". Marketing copy for a product you already have.
- Python callout — "Run sklearn, numpy, matplotlib". Promoted a tab that's already in the Practice nav.
- Ecosystem section — "Three labs. One production mindset." An ad for other products. ECOSYSTEM constant removed.
- Standalone streak + heatmap section — replaced by the activity widget inside the TODAY row (see below).
- Marketing h2 from track grid ("7 domains · 100+ scenarios · all free").
- "What brings you here today?" heading from role selector.

**Redesigned:**
- **TODAY row**: Two-column grid — Today's Case card (left, `1fr`) + compact activity widget (right, `auto`). Activity widget contains streak number + 4-week heatmap (28 cells, 8px, `gridTemplateRows: repeat(7, 8px)`, `gridAutoColumns: 8px`). Case and widget match height.
- **Role selector**: Stripped gradient card background + heavy shadow. Now a flat section with `ROLE` eyebrow. Expanded role panel toned down (`rgba(240,165,0,0.07)` background, no `boxShadow`).
- **Jump Back In bug fix**: `msl_tab` was being set to `'home'` on HomeTab mount, causing the pill to show "Continue: home →". Fixed by filtering `lastTab !== 'home'` before `setJumpBackTab`.
- **Gap**: outer flex gap reduced 40px → 28px.

Net: −173 lines from HomeTab.jsx since v4.14.

---

### v4.15 — HomeTab declutter (May 2026)

Removed three sections that were adding weight without earning it:

- **Learning Paths** (7-path accordion, ~110 lines of data + render): duplicated the Practice zone's navigation with extra ceremony. The role selector's "Your path" 3-step sequence covers the same job. `LEARNING_PATHS` constant, `openPath`/`pathDone` state, `markStepDone`, and `msl_goto_path` localStorage logic all removed. `msl_path_progress` key is now dead.
- **Export progress snapshot**: utility action buried in the home page. Not wrong to have, but wrong placement.
- **"Find your path" hero button**: linked to the now-removed Learning Paths section.

**Role selector collapse:** First-time visitors see the full 7-button grid. On return visits, the selected role renders as a compact chip + "Change" link. `msl_role` persistence was already wired; only the render logic changed.

**Heatmap full width:** Changed from fixed 10×10px cells with `overflowX: auto` to `gridAutoColumns: '1fr'` with `aspectRatio: '13 / 7'` — 91 cells, 7 rows × 13 columns, squares fill the card width.

---

### v4.14 — Satoshi font swap + emoji audit (May 2026)

**Font swap:** Replaced Space Grotesk with Satoshi (Fontshare CDN). Single change point: `--font-sans` in `index.css`. `index.html` updated to load from `api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400`. JetBrains Mono preserved from Google Fonts. Inter and Playfair Display dropped (unused). Satoshi reads crisper at smaller weights, tighter at heavy weights — better fit for the amber/dark design system than Space Grotesk's rounded neutrality.

**Emoji audit:** Systematic removal of all decorative emoji from tab files. Rule: Unicode symbols (✓ ✗ ⚠ → ← ↺ etc.) kept — they carry semantic meaning and render crisply in monospace. Emoji removed: all `icon: 'emoji'` fields in MODULES/ROADMAP/STRATEGIES/SECTIONS data arrays across 18 tabs; inline emoji prefixes in headings and status strings (📊 Post-mortem, 🔔 Alert, 📖 Go deeper, etc.); ✅/❌ UI spans replaced with ✓/✗. Country flags in LandscapeTab kept — geographically meaningful, not decorative. Two inline non-icon replacements: DataScienceTab feature type indicator (📝/🖼 → TEXT/IMAGE monospace labels), ClassicalMLTab production note pin (📌 → →).

---

### v4.13 — HomeTab redesign + unlock moment (May 2026)

**HomeTab redesign:**
- **Hero copy:** Dropped "You can train a model." opener (weak, presumptuous). New h1: "Production ML breaks in silence. / Can you find it?" — gradient on first two lines, plain on third. Sub-headline tightened from a domain list to a 200+ / 4-domain / incident-framing sentence.
- **Jump Back In chip:** Amber pill at top of HomeTab, visible only when `msl_tab` is set (returning user). Reads the tab label from TRACKS, navigates on click. One line of state, strong returning-user signal.
- **Today's Case:** 15-scenario `DAILY_CASES` array covering all 15 domains. Date-seeded rotation (sum of YYYY+MM+DD mod 15) — same scenario all day, new one tomorrow. Card shows domain badge + scenario question + "Try it →" link to the relevant tab. Placed between feature stat cards and role selector.
- **Role sequences:** `ROLE_SEQUENCES` map (7 roles × 3 steps). When a role is selected, the active panel now shows a numbered 3-step path (e.g., "01 Defense Plan → 02 Combinator → 03 Verbal Practice" for MLE Interview) above the existing CTAs. Makes role selection visibly alter the recommended path.

**Premium unlock moment (v4.12 — same session):**
- `AccessGate.jsx`: scale-in animation + amber glow pulse on correct code entry. "You're in." screen for 1.3s before content loads.
- `DefenseDocTab.jsx` inline gate: `inlineSuccess` state, same moment at 35% gate. Gate box cross-fades to amber + circle-check + "You're in." before plan sections reveal.

**Content expansion confirmed:**
- CombinatorTab already at 100 questions (target met, confirmed)
- TrainerTab already at 60 questions (target met, confirmed)
- InterviewPrepTab already at 128 questions (target met, confirmed)

---

### v4.11 — Share Score, fidelity badges, streak + 91-day heatmap (May 2026)

**Share Score button** added to CombinatorTab debrief and TrainerTab ResultsScreen. One button: copies a one-line plain-text summary to clipboard (`ML Systems Lab [Tab]: X/Y · Z% · Weak: [domain] → url`). `copied` state toggles the button label to `✓ Copied!` for 2 seconds, then resets. `navigator.clipboard.writeText` — no external dependency.

**Fidelity badges** added to 6 module headers as small monospace chip spans. Three variants: `✓ Real execution` (mint, Pyodide runs actual Python — SparkLabTab, ModelsMathTab), `~ Simulated` (prime/amber, scripted scenarios — CombinatorTab, TrainerTab, VerbatimTab, StaffLayerTab). No new component — inline `<span>` with CSS variable colors.

**Streak tracking + 91-day heatmap** added to HomeTab. On every HomeTab mount: increments `msl_activity_YYYY-MM-DD` (visit count per day), updates `msl_streak` (consecutive-day counter, reset if gap > 1 day) and `msl_last_visit`. Renders a 7×13 GitHub-style activity grid (gridTemplateRows + gridAutoFlow: column) with amber squares on active days. Streak shown as a pill alongside "Practice activity" eyebrow. Mobile-scrollable horizontally.

**Distractor quality pass** (14 questions, CombinatorTab + TrainerTab): replaced trivially-eliminable wrong options with plausibly-wrong options requiring genuine reasoning to eliminate. Target ratio: 2 of 3 wrong options should require judgment, not just recall or pattern-matching.

---

### v4.10 — Defense Plan (May 2026)

JDPrepTab and DefenseDocTab merged into a single 3-screen tool: **Defense Plan**.

**Motivation:** Both tabs started with "paste a JD" — forcing users to paste the same JD twice and reconcile two different outputs. The workflow is inherently linear (parse → self-assess → plan), so it belongs in one tool.

**3-screen flow:**
- **Screen 1 — JD parse:** Paste JD text, extract up to 8 skills weighted by keyword hit count (Must/Important/Good). Gap score seed = JD weight (3/2/1).
- **Screen 2 — Self-rate:** For each extracted skill, user rates Weak / Okay / Strong. User picks time horizon: Cram Up / 3 Days / 7 Days / 2 Weeks. Final gap score = JD weight × inverse rating (Weak=3, Okay=2, Strong=1).
- **Screen 3 — Plan:** Skill gap bars (ranked by gap score), round-by-round coverage (ML Coding / ML System Design / Depth+Onsite / Behavioral), horizon-specific day plan with study sections. Internal gate fires after 35% of plan sections — inline code input, not a wall. Gate converts with FOMO (user has already seen their plan skeleton). Print/PDF export preserved.

**Internal gate model:** Defense Plan is free to enter and free to start. Gate fires at `Math.max(1, Math.floor(sections.length * 0.35))` sections into the plan. Locked sections are blurred but visible — user sees what they're missing. Code `DAI2026` unlocks the rest inline.

**What changed:**
- `DefenseDocTab.jsx`: complete rewrite — 3-screen flow, self-rating, gap score formula, generatePlan(), internal gate, msl_defense_progress persistence
- `App.jsx`: removed `'defense'` and `'jdprep'` from PREMIUM_TABS (Defense Plan handles its own gate); `renderContent()` intercepts both tabIds and renders DefenseDocTab with `isUnlocked`/`onUnlock` props; `InterviewToolCard` now uses per-tool `PREMIUM_TABS.has(tool.id)` check instead of global `isUnlocked` flag; jdprep removed from INTERVIEW_TOOLS, defense card renamed "Defense Plan" (step 01), combinator/verbal renumbered to steps 02/03
- `JDPrepTab.jsx`: replaced with redirect stub — renderContent intercepts at App level so this component is never reached in normal navigation
- `GlobalSearch.jsx`: removed RAG Architecture entry (GenAI Lab territory, wrong lab)

**Gating note:** `'defense'` and `'jdprep'` are no longer in PREMIUM_TABS. The Defense Plan is the funnel — it's free to use and hooks the user, then gates at the point of highest intent.

---

### v4.9 — Freemium access gate (May 2026)

First freemium split. Premium content gated behind access code `DAI2026`. Code is permanent once entered (localStorage key `msl_access`), shared freely during beta.

**Free tier:** HomeTab, LandscapeTab, GradientTab, AskTab, and 4 intro Practice modules (Math Foundations, Feature Engineering, Model Evaluation, Classical ML).

**Premium tier:** All 6 Interview zone tools, all 4 Drills (TrainerTab, CodeBugsTab, CaseStudiesTab, StaffLayerTab), and 14 advanced Practice modules (SystemDesign, Spark, Airflow, dbt, DataModeling, DL/DLFineTuning/DLServing, DataScience, CausalInference, TimeSeries, Monitoring, Deployment, CICD).

**Implementation:** `src/components/AccessGate.jsx` (new) — clean lock screen with code input, error/success states, persistence note. `PREMIUM_TABS` set in App.jsx — single source of truth for what is gated. `renderContent()` checks `isUnlocked` before rendering any premium tab. PracticeCard and InterviewToolCard show SVG padlock + reduced opacity when locked. Grids remain fully visible (FOMO is the conversion mechanism — locked content is discoverable, not hidden).

**Decided against:** hiding locked content entirely. Visible locked state creates upgrade desire. Hidden content creates no signal.

---

### v4.8 — Mobile UI/UX audit fixes (May 2026)

Resolved 8 of 10 findings from Audit #015 (comprehensive mobile pass). 2 deferred (Pyodide mobile warning, InterviewPrepTab line length).

**Fixes:**
- `index.css`: input `font-size` 15px → 16px — eliminates iOS Safari page-zoom on input tap
- `SystemDesignTab.jsx`, `DLServingTab.jsx`: `maxWidth: '100%'` on fixed-width SVG diagrams — allows horizontal scroll without diagram distortion
- `MLOpsDeployTab.jsx`: metrics table wrapped in `overflowX: auto` div with `minWidth: 480px` — table is now scrollable, not clipped
- `VerbatimTab.jsx`: UA-based iOS Safari detection, platform-specific fallback message, `isStoppingRef` guard on `recognition.onend` to prevent Chrome/Android double-fire
- `App.jsx`: topbar back button padding `4px 0` → `10px 8px` with `margin: -10px -8px` — expands touch target to ~44px without layout shift; bottom nav inactive opacity 0.35 → 0.62
- `CombinatorTab.jsx`: `savedAt: Date.now()` added to localStorage session save; on restore, elapsed wall-clock time is subtracted from `timeLeft` (clamped to 0) — timer no longer shows stale time after zone switch
- `DefenseDocTab.jsx`: `@media print` replaced `body > * { display: none }` (breaks in Safari/Firefox when nested) with cross-browser `* { visibility: hidden }` + `.defense-doc-print { visibility: visible; position: fixed }` pattern; added `@page { margin: 1.2cm }`

---

### v4.7 — Full contrast audit + mobile overflow fix (May 2026)

**Full contrast audit (369 lines, 31 files):**
- Identified root cause of low-brightness illegibility: 200+ inline rgba backgrounds at 0.04–0.08 opacity. These are used for every interactive state — selected MCQ options, correct/wrong answer highlights, info boxes, domain cards. At low phone brightness they were invisible.
- Python script raised all non-black rgba tints across all 31 tab files + App.jsx: `0.04→0.10`, `0.05→0.11`, `0.06→0.13`, `0.07→0.14`, `0.08→0.15`. Black shadows (`rgba(0,0,0,...)`) excluded.
- Ink scale raised more aggressively (previous pass was not perceptible): `--ink-mid` → `#d8cfc6`, `--ink-low` → `#b8ada2`, `--ink-ghost` → `#8c8178`
- Surfaces: `--depth` → `#201d19`, `--surface` → `#2a2620`, `--rim` → `#4a433a`
- Bottom nav inactive state: `rgba(255,255,255,0.35/0.40/0.45)` → `0.62/0.62/0.65`

**Mobile horizontal overflow fix:**
- Root cause: no `overflow-x: hidden` on `html/body`. Any child element slightly wider than viewport caused horizontal scroll, dragging the fixed bottom nav off-screen left and clipping all page content.
- Fix: `overflow-x: hidden; max-width: 100vw` on `html, body`.
- Secondary fix: bottom nav 5 items were overflowing on ~360px phones. Nav row now has `overflow: hidden`, icon container shrunk (44→36px), labels use `whiteSpace: nowrap; textOverflow: ellipsis; maxWidth: 100%` so they truncate rather than push layout.

**Audits logged:** #013 (full contrast), #014 (mobile overflow) — both resolved. #015 (mobile UI/UX comprehensive) — 10 findings logged, 6 open for next sprint.

### v4.6 — Mobile layout + low-brightness contrast (May 2026)

**Hero layout responsive fix:**
- Two-column hero grid was a fixed `gridTemplateColumns` inline style — no media query path. Extracted to `.hero-grid` CSS class in `index.css`. Below 700px: single column, mockup hidden. Above 700px: unchanged.
- `<ScenarioMockup />` wrapped in `<div className="hero-mockup">` — the class carries `display: none` on mobile.

**Low-brightness contrast pass:**
- All four ink variables brightened to maintain readability at reduced phone backlight:
  - `--ink-mid` → `#cec3b9`, `--ink-low` → `#a09489`, `--ink-ghost` → `#756c62` (was `#4a433c`, ~2.3:1 WCAG fail)
- Surface variables lightened for card/void separation: `--depth` → `#1c1916`, `--surface` → `#242119`, `--rim` → `#403930`
- `.card` border opacity raised: `0.09` → `0.13`; hover border `0.15` → `0.22`
- `--void` unchanged — dark aesthetic preserved

**Audits logged:** #011 (mobile hero), #012 (low-brightness contrast) — both resolved.

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
