# AUDITS.md — Health Log

Diagnostic, not prescriptive. Every audit run is logged here with findings, resolved status, and date.  
Resolved findings that become buildable features go into **IDEAS.md**. Findings that reveal a missing architectural rule go into **DECISIONS.md**.

---

## How to use this file

**Starting an audit session:**
1. Pick a type from the reference table below
2. Read all open (⚠️) findings first — don't re-discover known issues
3. Add new findings with severity (High / Medium / Low) and status ⚠️ Open
4. When resolved, mark ✅ and note what was done

**After a build sprint:**
- Always run a BUILD scan after any large refactor
- If 5+ scenarios added to any tab, run a Coverage pass
- If any new tab added, check Navigation & Discoverability and update `TAB_TO_ZONE` wiring

**Promoting findings:**
- Finding implies a buildable feature → IDEAS.md Tier 1 or 2
- Finding reveals a broken rule → DECISIONS.md
- AUDITS.md is diagnosis only. IDEAS.md is treatment.

---

## Audit type reference

| Type | What it covers | Suggested frequency |
|------|---------------|-------------------|
| **Architecture** | Stack decisions, zone IA, file structure, scope, strategic risk | Quarterly |
| **BUILD** | Prop wiring, dead code, duplicate keys, component contracts, brace balance | After any large refactor |
| **Build Safety** | Syntax errors, Vite parse failures, escape issues in JS data files | After any data file edits |
| **Visual Consistency** | Color drift, hardcoded hex, font hardcoding, CSS variable adherence | Monthly |
| **Framework / Technical** | Hook usage, render correctness, React patterns, Pyodide integration | After React upgrades |
| **Navigation & Discoverability** | Hidden features, dead-end flows, tab/zone structure, zone routing | After adding new tabs/zones |
| **Content Integrity** | Stale copy, scenario counts vs targets, duplicate localStorage keys | Monthly |
| **Coverage** | Which domains/topics lack questions, cross-links, or practice modules | When planning content sprints |
| **Source Material** | Benchmark scenario quality against real interview standards and competitor content | Before content sprints |
| **Performance** | Bundle size, lazy loading, render bottlenecks, Pyodide cold start | After adding heavy modules |
| **Security** | `.gitignore`, no secrets in source, env var hygiene, PII exposure | Before any public launch |
| **Analytics** | localStorage key taxonomy, what's tracked vs. what should be, PII hygiene | Quarterly |
| **SEO / Social** | OG tags, meta descriptions, og-image, sitemap, sharing previews | Before any marketing push |
| **Mobile** | Safe area, touch targets, grid overflow, tap highlight, scroll behavior | After any CSS or layout change |
| **UX / Human Elements** | Empty states, tone, onboarding friction, first-load experience | Quarterly |
| **First-Time User** | Cold walk-through in incognito — every confusion point noted live | Before any public promotion |
| **MVP / Weight** | Which features earn their place? Cut or consolidate candidates | When the app feels heavy |
| **IP / Moat** | What's hard to replicate? What's original? What to double down on? | Annually |
| **Guidance Completeness** | Every interactive surface has appropriate guiding text — tab descriptions, interaction hints, empty states, CTAs | After adding any new tab or major component |
| **Positioning & Discoverability** | README opens with product thesis (not scope inventory); flagship experience is findable by a new visitor; four unique differentiators (Pyodide, Web Speech, StaffLayer, CodeBugs) are surface-visible; new user has a cold-state orientation path; social proof signal exists | Before any external promotion, sharing, or public launch |
| **Content Linkage** | Every Gradient post has a YouTube ID (where applicable), a practice module CTA, and optionally a related-post link; every practice tab links back to its Gradient post | After adding any new post or practice module |

**Audit types not yet run (high value):**
- First-Time User, Source Material, Coverage, Analytics, MVP / Weight, IP / Moat, Architecture, Guidance Completeness, Content Linkage

**Recurring Build Safety risk — Python f-string `${` in JS template literals:**  
`ProjectLabTab.jsx` defines Pyodide cell code as JS template literals (backtick strings). Any Python f-string inside those cells that formats a dollar amount (e.g., `f'${val:.0f}'`) contains `${` which esbuild interprets as a JS interpolation — build fails with "Expected } but found :". The brace-balance check does NOT catch this (braces remain balanced). Fix: escape to `f'\${val:.0f}'`. Pre-commit check: `grep -n '\${' src/tabs/ProjectLabTab.jsx | grep "f['\"]"` — any hit needs escaping. First hit: v4.35 build, fixed in v4.35.2 (two occurrences).

**Recurring Runtime risk — Pyodide package omissions:**  
`python.js` `loadPython()` must explicitly load every package used across all Pyodide cells. Missing a package produces `ModuleNotFoundError` at runtime (not at build time). Current load list: `numpy`, `pandas`, `scikit-learn`, `matplotlib`, `scipy`. When adding new cells that import new packages (e.g., `xgboost`, `statsmodels`), update the `loadPackage` call in `python.js` first — the cell code won't warn you. pandas was missing until v4.36.2.

**Mobile input font-size rule:**  
Any `<input>` or `<textarea>` rendered inside an overlay or modal must have `fontSize: '16px'` minimum. iOS Safari auto-zooms the viewport on focus when input font-size is below 16px — this breaks overlay positioning and is jarring on mobile. ContentMap input was 15px; fixed to 16px in v4.36.2. Apply same check to any future overlays.

**Mobile touch target rule:**  
Any interactive button in an overlay or compact list must have `minHeight: '40px'` (leaf/tab items) or `minHeight: '44px'` (primary action rows). Found in ContentMap tree `TabLeaf` (was ~22px effective height from `padding: '5px 8px'`) — fixed in v4.37 to `padding: '8px 8px'` + `minHeight: '40px'`. `SearchRow` fixed to `minHeight: '44px'`. Apply same check to any new compact list components.

**Mobile overlay affordance rule:**  
Desktop-only hints (keyboard shortcut legends like `↵ open / esc close`) must be hidden on mobile via a CSS class — they are meaningless on touchscreens and waste footer space. Pattern: add a `.map-kbd-hints` class (or similar) and `@media (max-width: 480px) { display: none }` in `index.css`. Inline desc text in compact tree rows should also be hidden on narrow screens (`<480px`) — the label alone is sufficient for navigation. Pattern established in ContentMap v4.37.

---

## Guidance Completeness — Audit Spec

**What this audit checks, surface by surface:**

### Tab level (every tab file)
- `<h1>` or equivalent tab title — present and specific (not generic like "Module")
- Domain description paragraph — 1–2 sentences explaining what this tab covers and why it matters in production. Should be `var(--ink-mid)` or `var(--ink-low)`, 13–14px, below the title.
- Interaction hint paragraph — explains *how* to use the tab. Present below the description, above the module nav. Format varies by tab type (see below). Added in v4.17; must be present on all tabs including any added after that version.

### By tab type — what the interaction hint must cover

| Tab type | Must explain |
|----------|-------------|
| MCQ / accordion (e.g. FeatureEngTab, ModelEvalTab) | That each module opens with a scenario; that user picks an answer; that reveal shows production failure mode + why wrong options fail |
| Sequential reveal (StaffLayerTab) | That scenarios show IC3 → IC5 → Staff answers in sequence; that user should form their own read before expanding each level |
| Multi-part case (CaseStudiesTab) | That each case has 4 connected questions; that user should read the situation before expanding any question |
| Simulation (SparkLabTab) | What each control does; what the output shows |
| Python sandbox (ModelsMathTab) | That cells run real Python; that output is live; that user can edit and re-run |
| Free-text / speech (VerbatimTab) | The record → review → self-rate loop; what the 4 dimensions are |
| Code reading (CodeBugsTab) | That each scenario contains exactly one bug; the expand → locate → reveal flow |
| Bank + modes (InterviewPrepTab) | The 4 modes (Bank, Timed, Fluency, Design) and when to use each |
| Configuration → session (TrainerTab, CombinatorTab) | Domain/count selection → question flow → debrief |
| Document builder (JDPrepTab, DefenseDocTab) | What the output is; what inputs are needed; what the document is for |
| Read-only content (GradientTab) | The recommended entry path (featured / "new here" strip); that posts link to practice modules |
| Information / reference (LandscapeTab, AskTab) | What the content covers; how to navigate it (filter, search, expand) |

### Module level (within a tab)
- Module nav labels — clear, not ambiguous. "Module 1" is not acceptable; "Feature Stores" is.
- Module description — each module should have a one-line description of the specific scenario or topic it covers, visible before the user expands anything.
- Scenario prompt — the question or situation must be clearly framed. A scenario that opens with code or a table but no framing sentence is incomplete.

### Card / item level (within a module)
- MCQ options — all 4 options must be plausible enough that a user has to think. An obviously-wrong option has no guidance value and wastes a slot.
- Reveal / explanation — must explain: (a) why the correct answer is correct in production terms, (b) why at least 2 wrong options fail (not just "this is wrong"). One-sentence dismissals don't count.
- Empty / zero state — any list, grid, or feed that can be empty must have a message. "No results" is the minimum; "No results — try clearing filters" is better.

### CTA / navigation level
- Every module that has a related Gradient post must have a visible "Go deeper →" link at the bottom of the module content.
- Every tab must have at least one onward path — either a Gradient post link or a "Test this in Combinator / Trainer →" link. A tab that ends silently is incomplete.

**How to run this audit:**
1. Open each tab in the running app (or read the JSX if no live environment).
2. For each surface level above, confirm presence or absence.
3. Log missing items with tab name, surface level, and what's missing.
4. Findings → fix in the same session if < 30 min total, otherwise log as open in AUDITS.md and schedule.

**Frequency:** Run after adding any new tab. Run as a full sweep quarterly or whenever a large content sprint adds 5+ new modules.

---

## Content Linkage — Audit Spec

**What this audit checks:**

### Gradient post → outbound links

For each post in `src/data/gradientPosts.js`:

| Field / element | Requirement |
|----------------|-------------|
| `youtubeId` | Present and valid if a YouTube video exists for this topic. Empty string is acceptable only if no relevant video exists — must be a deliberate choice, not an oversight. Check by searching YouTube for the post title + channel name. |
| `practiceLink` (or equivalent CTA) | Each post must link to the practice module most relevant to its content. The CTA should appear at the end of the post body. Format: "Practice this → [Tab name]" linking to the correct `tabId`. |
| Related post link | Optional but recommended for posts in a series or covering adjacent topics. Should appear inline within the post body at the relevant point, not just in a sidebar. |
| External source link | Any claim citing a specific paper, incident, or company blog should have an inline link. Unsourced claims in a learning tool erode credibility. |

### Practice tab → Gradient post back-links

For each practice tab (FeatureEngTab, ModelEvalTab, SystemDesignTab, MonitoringTab, DeepLearningTab, ClassicalMLTab, etc.):

| Check | Requirement |
|-------|-------------|
| Tab-level "Go deeper" CTA | At minimum one Gradient post link in the tab header area or as a sticky footer within the tab. Already present in FeatureEngTab, ModelEvalTab, MonitoringTab — ensure all others have it. |
| Module-level "Go deeper" CTA | Each module whose topic has a corresponding Gradient post should link to it at the bottom of the module content. This is the forward pointer pattern described in NEXT.md. |
| No orphaned modules | A module whose topic has no Gradient post and no Trainer/Combinator link is a dead end. At minimum add "Test this in Combinator →" so the user has an onward path. |

### How to run this audit
1. Pull the full list of posts from `gradientPosts.js`. For each post: check `youtubeId` is populated, verify the practice CTA exists in the post body, note any missing external source links.
2. For each practice tab: grep for "Go deeper" or "gradient" — confirm at least one outbound link exists. Check module-level CTAs in the highest-traffic modules first (SystemDesign, FeatureEng, ModelEval, Monitoring, DeepLearning).
3. Log: post ID / tab name, missing element, severity (High = no practice CTA at all; Medium = missing YouTube ID; Low = missing related post or source link).

**Frequency:** Run after adding any new Gradient post. Run as a full sweep after any content sprint that adds 3+ posts or 5+ new modules.

---

## Part I — Architecture & Strategic Audits

*None run yet. Recommended before any major zone restructure or monetization decision.*

---

## Part II — Build & Code Quality Audits

### #001 — 2026-05-26 · BUILD + Visual Consistency + Framework/Technical

**Scope:** Static grep scan of all `src/tabs/*.jsx`  
**Trigger:** First audit run — establishing a baseline  
**Output:** Findings documented; no fixes applied in this pass

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | Brace balance clean across all tab files | All tabs | — | ✅ Clean |
| 2 | Hardcoded hex/rgb colors in 5 component files | See detail | Medium | ✅ Partially fixed — most cleaned in v4.3/v4.4. Residual in GradientTab catColor data, ModelEvalTab progress bar, InterviewPrepTab mode tab, dbtTab DANGER_COLORS. See #017. |
| 3 | `DefenseDocTab` hex in print stylesheet | `DefenseDocTab` 401–402 | — | ✅ Exempt — print resets need absolute values |
| 4 | All localStorage key constants properly `msl_`-prefixed | All tabs | — | ✅ Clean |
| 5 | 26 tabs missing `onNavigate` prop in export signature | See detail | Medium | ✅ Fixed v4.2 — confirmed by grep; zero tabs missing onNavigate |
| 6 | 56 instances of array index used as React `key` prop | See detail | Low | ⚠️ Open |
| 7 | No `console.error` / `console.warn` in any tab | All tabs | — | ✅ Clean |
| 8 | `className=` in 25 tabs — all are custom CSS classes (`card`, `btn-primary`, etc.) defined in `index.css`, not Tailwind utilities | All tabs | — | ✅ Acceptable — rule prohibits Tailwind utilities, not custom CSS classes |

**Finding 2 detail — hardcoded hex colors:**

| File | Line(s) | Values |
|------|---------|--------|
| `DLFineTuningTab.jsx` | 300, 303 | `#0d0d0f`, `#c9d1d9` |
| `DLServingTab.jsx` | 22 | `#fff` |
| `CombinatorTab.jsx` | 735 | `#fff` |
| `GradientTab.jsx` | 1566, 1628, 1745 | `#fff`, `#c0b8ae` |
| `SystemDesignTab.jsx` | 140, 149, 999 | `#fff`, `#000` |

**Finding 5 detail — missing `onNavigate` (26 files):**  
`AirflowTab`, `CaseStudiesTab`, `CausalInferenceTab`, `ClassicalMLTab`, `CodeBugsTab`, `CombinatorTab`, `DLFineTuningTab`, `DLServingTab`, `DataModelingTab`, `DataScienceTab`, `DeepLearningTab`, `FeatureEngTab`, `InterviewPrepTab`, `MLOpsDeployTab`, `MLOpsPipelinesTab`, `ModelEvalTab`, `ModelsMathTab`, `MonitoringTab`, `PipelineBlogTab`, `SparkLabTab`, `StaffLayerTab`, `SystemDesignTab`, `TakeHomeTab`, `TimeSeriesTab`, `TrainerTab`, `dbtTab`

**Finding 6 detail — index keys (most affected):**  
`TimeSeriesTab`, `MonitoringTab`, `SparkLabTab`, `DLFineTuningTab`, `FeatureEngTab`, `dbtTab`, `MLOpsDeployTab`, `CaseStudiesTab`, `TrainerTab`, `DefenseDocTab`

**Priority actions:**
1. *(Medium)* Hardcoded hex → replace `#fff`/`#000` with `var(--text)`, `var(--bg)`, `var(--rim)`. ~20 min across 5 files.
2. *(Medium)* `onNavigate` → add `{ onNavigate }` to export signatures in 26 tabs. One-liner per file; do in a single housekeeping pass.
3. *(Low)* Index keys → replace with stable content-derived keys only where lists are filtered or reordered. Static render-once lists are low priority.

---

### #002 — 2026-05-26 · BUILD + Visual Consistency

**Scope:** Static grep scan — font hardcoding, dead files  
**Trigger:** Continuation of #001 baseline sweep  
**Output:** Findings documented; no fixes applied in this pass

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | Hardcoded `fontFamily` strings in 30+ tab files | Widespread — see detail | Medium | ✅ Partially fixed — `--font-sans` / `--font-mono` vars added to `:root`; tab files updated v4.2/v4.3. App.jsx still has 8+ hardcoded literal strings (see #017). |
| 2 | `PipelineBlogTab.jsx` is dead code — `export default function PipelineBlogTab() { return null }`, not imported in `App.jsx` | `src/tabs/PipelineBlogTab.jsx` | Low | ✅ Fixed — deleted v4.3 |

**Finding 1 detail — font hardcoding:**  
No CSS custom properties exist for fonts in `index.css` (fonts are set on `body` and element selectors, not as `--font-sans` / `--font-mono` variables). As a result, tabs hardcode `fontFamily: "'Space Grotesk', sans-serif"` and `fontFamily: "'JetBrains Mono', monospace"` inline. Worst offender: `SystemDesignTab.jsx` (72 instances).

Fix path: add `--font-sans` and `--font-mono` to `:root` in `index.css`, then find-replace across tabs. Prerequisites: confirm variable names, test rendering.

**Finding 2 detail — dead file:**  
`PipelineBlogTab.jsx` contains only: `// Replaced by GradientTab.jsx — this file is unused.` with a null-returning component. Safe to delete. Will also remove it from the `onNavigate` missing list in #001.

**Priority actions:**
1. *(Low)* Delete `PipelineBlogTab.jsx`. Remove from finding #001 missing-`onNavigate` list.
2. *(Medium)* Add `--font-sans` and `--font-mono` to `:root` in `index.css`. Then do a global find-replace pass across tabs in a single session.

---

## Part III — SEO, Security & Infrastructure Audits

### #003 — 2026-05-26 · Security

**Scope:** `.gitignore`, committed files, env var hygiene, secret exposure  
**Trigger:** Baseline security check before any public promotion  
**Output:** All clear — no action required

| # | Finding | Status |
|---|---------|--------|
| 1 | `.gitignore` exists and covers `.env`, `.env.local`, `.env.*.local` | ✅ Clean |
| 2 | `.env.example` committed with placeholder values only — no real keys | ✅ Clean |
| 3 | No `.env` or real secret files tracked by git | ✅ Clean |
| 4 | PostHog key gated behind `VITE_POSTHOG_KEY` env var — app runs without it | ✅ Clean |

---

### #004 — 2026-05-26 · SEO / Social

**Scope:** `index.html` meta tags, `public/` assets, sitemap  
**Trigger:** Baseline SEO check  
**Output:** Two high-severity gaps found

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | `og-image.png` referenced in `index.html` (OG + Twitter image tags) but does not exist in `public/` | `index.html` lines 16, 22 | High | ⚠️ Open |
| 2 | No `sitemap.xml` in `public/` — crawlers have no map of the app | — | Medium | ⚠️ Open |
| 3 | OG title, description, and meta description present and accurate | `index.html` | — | ✅ Clean |
| 4 | Twitter card meta present | `index.html` | — | ✅ Clean |

**Finding 1 detail:**  
Every share of the app URL (LinkedIn, Slack, WhatsApp, Twitter) will render a broken image. This is the highest-visibility gap. Fix: generate a 1200×630 `og-image.png` in `public/`. Can be done with PIL or Figma export.

**Priority actions:**
1. *(High)* Create `og-image.png` (1200×630px) and place in `public/`. Black background, app name, one-line value prop. Fixes broken social previews immediately.
2. *(Medium)* Generate `sitemap.xml` covering the app's main routes and add to `public/`.

---

### #005 — 2026-05-26 · Build Safety

**Scope:** All `src/tabs/*.jsx` and `src/*.js` utility files — template literals, apostrophe risk, Vite parse safety  
**Trigger:** PAL had a production Vercel build failure from unescaped apostrophes in single-quoted JS data strings. Checking before it happens here.  
**Output:** Clean — no build safety risks found

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | Template literals in JSX tab files (102 in `CodeBugsTab`, 80 in `GradientTab`, etc.) — **not a risk** in JSX context; Vite processes these correctly | All JSX tabs | — | ✅ Clean — JSX context, no parse risk |
| 2 | Template literals in `progress.js` and `python.js` — used for dynamic localStorage key construction and Pyodide code execution; legitimate use, not prose data | `src/utils/progress.js`, `src/python.js` | — | ✅ Clean — not data files with prose |
| 3 | Apostrophe pattern scan across all tab files — all matches were false positives; prose content lives in double-quoted strings (`"What's..."`, `"don't..."`) not single-quoted strings | All JSX tabs | — | ✅ Clean — no unescaped apostrophe risk |

**Verdict:** Build safety is clean. The PAL failure mode (apostrophes inside single-quoted JS data strings) does not apply here — prose content is consistently in double-quoted strings and JSX template literals are processed safely by Vite.

---

### #006 — 2026-05-26 · Analytics

**Scope:** `src/analytics.js`, `src/App.jsx`, all tab files — event coverage, autocapture config, localStorage key taxonomy  
**Trigger:** PostHog is wired but no audit has been run on what's actually firing vs. what should be  
**Output:** Two significant gaps found — autocapture PII risk and near-zero event coverage across tabs

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | `autocapture` not explicitly disabled — PostHog default is `autocapture: true`, capturing all clicks, text inputs, form submissions. Tabs with free-text inputs (`VerbatimTab`, `CodeBugsTab`, `AskTab`, `TakeHomeTab`) risk capturing user-entered content | `src/analytics.js` | High | ✅ Fixed — `autocapture: false` added to `posthog.init()` |
| 2 | Only 1 of 30+ tabs (`SparkLabTab`) fires any analytics events — `trackModuleStart` and `trackModuleComplete` are defined but called nowhere else | All tabs except `SparkLabTab` | High | ✅ Partially fixed — added to `TrainerTab` (session end), `CombinatorTab` (debrief), `StaffLayerTab` (staff level reached). 27 tabs still fire nothing. |
| 3 | `trackTabSwitch` fires in `App.jsx` on every zone/tab change — tab navigation is tracked | `src/App.jsx` | — | ✅ Clean |
| 4 | All localStorage keys properly `msl_`-prefixed — 12 distinct keys/prefixes found | All tabs | — | ✅ Clean |
| 5 | No METRICS.md — localStorage key taxonomy and intended event schema are undocumented | — | Medium | ⚠️ Open |

**Finding 1 detail — autocapture PII risk:**  
`posthog.init()` is called without `autocapture: false`. PostHog's default behaviour captures clicks (including button text), input values on change, and form submissions. Fix: add `autocapture: false` to the init config in `analytics.js`. One-line change, no behaviour loss on intentional events.

**Finding 2 detail — event coverage gaps:**  
The following high-value user actions fire zero analytics events:

| Action | Tab(s) | What's missing |
|--------|--------|---------------|
| Scenario reveal (IC3 → IC5 → Staff) | `StaffLayerTab` | Level revealed, scenario id |
| Score submission | `TrainerTab`, `ClassicalMLTab`, `ModelEvalTab`, 12 others | Score, tab, question id |
| Session start / completion | `CombinatorTab`, `VerbatimTab`, `TakeHomeTab` | Session duration, score |
| Question attempt | `InterviewPrepTab` | Question id, category |
| Gradient post read | `GradientTab` | Post id, read duration |

Without completion events, there is no signal on which tabs users actually use vs. open and leave.

**Priority actions:**
1. *(High)* Add `autocapture: false` to `posthog.init()` in `src/analytics.js`. Immediate PII risk mitigation.
2. *(High)* Add `trackModuleComplete` calls to at minimum: `StaffLayerTab` (on staff-level reached), `TrainerTab` (on session end), `CombinatorTab` (on debrief). These are the highest-signal completion events.
3. *(Medium)* Create `METRICS.md` documenting: intended event taxonomy, localStorage key purposes, and what each score key prefix maps to.

---

## Part IV — Content Coverage Audits

*No formal coverage audit run yet. Preliminary signal from scenario count scan:*

| Tab | `id:` count | Note |
|-----|------------|------|
| `InterviewPrepTab` | 109 | Largest bank |
| `TimeSeriesTab` | 92 | — |
| `SystemDesignTab` | 77 | — |
| `CaseStudiesTab` | 5 | Thin — 5 full company case studies (Netflix, Uber, Airbnb, DoorDash, Spotify) |
| `ModelsMathTab` | 7 | Thin — worth a pass |
| `DLServingTab` | 15 | — |
| `dbtTab` | 15 | — |

*Full Coverage audit recommended before next content sprint.*

---

## Part V — UX & First-Time User Audits

### #007 — 2026-05-26 · First-Time User

**Scope:** Simulated cold walk-through based on source-read of `HomeTab.jsx`, `App.jsx` (zone/nav structure), `AskTab.jsx`, `GradientTab.jsx`. No fixes applied in this pass.  
**Trigger:** Requested before any public promotion. Audit type listed as "high value, not yet run" since #001.  
**Output:** 5 friction points found — 2 Medium, 3 Low. No High severity blockers.

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | `AskTab` label mismatch — zone is labelled "Ask" in bottom nav; tab is keyword search over a hardcoded KB, not an AI assistant. First-timer clicks expecting to type a question to Claude, gets a search interface with no explanation | `AskTab.jsx`, `App.jsx` nav label | Medium | ✅ Fixed — nav label → "Search"; heading → "KB Search"; sub-copy updated |
| 2 | Interview tools split across two zones without visible logic — Trainer, CodeBugs, CaseStudies, StaffLayer live in Practice zone under "Interview Tools" domain; Combinator, JDPrep, Defense, Verbal live in Interview zone. First-timer has no mental model for why some tools are in Practice and others in Interview | `App.jsx` (`PRACTICE_DOMAINS`, `INTERVIEW_TOOLS`) | Medium | ✅ Fixed — Practice domain renamed "Drills"; Interview hub tools reordered ①②③④ with "Start here" on JD Prep |
| 3 | CHANGELOG on HomeTab is first-timer-visible — scroll past hero, role selector, stats → changelog entries showing "May 2026 / Apr 2026" update notes. Returning-user content has no visibility guard for cold users | `HomeTab.jsx` | Low | ✅ Fixed — changelog collapsed by default behind "Changelog ▸" toggle |
| 4 | GradientTab has no "start here" signal — Read zone lands directly on 25+ posts with domain filter bar. No recommended first post, no beginner path, no orientation copy. First-timer sees a flat list with no entry point | `GradientTab.jsx` | Low | ✅ Fixed — "New here? Start with these" strip added above filter bar, pinning posts 1, 3, 27, 9; only visible on All Posts view |
| 5 | Interview zone tool sequence not communicated — intended flow is JD Prep → Defense Doc → Combinator → Verbal, but tools are presented as an unordered grid. A first-timer who lands in the Interview zone has no idea what order to run them in | `App.jsx` (`INTERVIEW_TOOLS`), `InterviewGrid` render | Low | ✅ Fixed — tools reordered ①②③④ with "Start here" on JD Prep |

**Finding 1 detail — Ask label mismatch:**  
`AskTab` is a keyword search component querying a hardcoded KB of ML concepts. The word "Ask" on a modern app strongly implies "ask an AI". There is no copy on the tab explaining it's a search interface. Fix options: (a) rename the nav label to "Search" or "Explore"; (b) add a one-line explainer above the search input: "Search the ML Systems KB — concepts, patterns, failure modes."

**Finding 2 detail — Interview tools split:**  
The split exists for architectural reasons (Trainer/CodeBugs/CaseStudies are practice modules that happen to be interview-relevant; the Interview zone tools are specifically simulation tools). But a first-timer doesn't know this. The domain card in Practice is labelled "Interview Tools" which doubles the confusion — why is there an "Interview Tools" domain AND an "Interview" zone? Fix path: rename the Practice-zone domain card from "Interview Tools" to "Practice Drills" or "Scenario Drills", and add a one-liner to the Interview zone hub explaining the simulation sequence.

**Priority actions:**
1. *(Medium)* Add a one-line explainer to `AskTab` above the search input. Rename bottom nav label from "Ask" to "Search". ~15 min.
2. *(Medium)* Rename Practice-zone "Interview Tools" domain card to "Drills" or "Practice Drills". Add sequence hint to Interview zone hub. ~20 min.
3. *(Low)* Add a `showForReturning` guard or collapsible to the CHANGELOG section in HomeTab, or move it to the bottom of the scroll. ~10 min.
4. *(Low)* Add a "Start here" pinned post or recommendation row to GradientTab. ~20 min.
5. *(Low)* Add numbered sequence labels (1→2→3→4) to Interview zone tool cards in the hub grid. ~15 min.

---

### #016 — 2026-05-29 · Visual Consistency — Emoji residue + Mobile layout

**Scope:** Post-v4.14 emoji audit follow-up + post-v4.16 HomeTab layout mobile check  
**Trigger:** v4.14 cleaned `icon:` fields and decorative prefix emoji across 18 tabs. User confirmed residual emoji still present in multiple places. Mobile audit overdue after HomeTab layout redesign (per audit type reference: run Mobile after any CSS/layout change).  
**Status:** Findings logged — not yet fixed.

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | Residual emoji in UI copy, button text, section labels, and inline content across multiple tabs — not caught by v4.14 `icon:` field pass, which only targeted module icon data fields and prefixes | All tabs (unsurveyed) | Medium | ⚠️ Open |
| 2 | Emoji should be replaced with inline SVGs or unicode symbols — not just removed. SVGs allow color theming via CSS variables; bare unicode symbols are acceptable for ✓ ✗ → type glyphs | All tabs | Medium | ⚠️ Open |
| 3 | Mobile audit not run since HomeTab v4.16 layout redesign — two-column TODAY row (`gridTemplateColumns: 'minmax(0, 1fr) auto'`) has not been tested on narrow screens (≤375px). Activity widget at ~90px wide may leave insufficient width for case card text on 320px devices | `HomeTab.jsx` | Medium | ✅ Fixed v4.28 — `@media (max-width: 480px)` stacks TODAY row vertically via `.today-row` class. Sparse heatmap guard (≤3 active days) also added. |
| 4 | All other layout changes (role selector flex-wrap, track grid `minmax(240px, 1fr)`, gap 28px) use mobile-safe CSS patterns — low risk | `HomeTab.jsx` | Low | ✅ Likely clean — needs verification |

**Priority actions:**
1. *(Medium)* Full grep scan for emoji codepoints (`[\u{1F000}-\u{1FFFF}]`, `[\u{2600}-\u{27BF}]`) across all tab files. Categorise: decorative (replace with SVG), functional (keep or replace with unicode glyph), flag/country (keep). Log per-tab findings.
2. *(Medium)* Replace decorative emoji with themed inline SVGs. Priority tabs: any tab where emoji appear in rendered UI (buttons, labels, section headers) rather than just data fields.
3. *(Medium)* Mobile test: open app on 375px viewport (Chrome DevTools), check HomeTab TODAY row, role buttons, track grid. If case card text is too narrow, add `@media (max-width: 480px)` rule to stack TODAY columns vertically.

---

### Audit #010 — Interaction Guidance (2026-05-29)
**Scope:** All 23 interactive tab files  
**Finding:** Every tab had a domain description but no instruction on how to interact. Users landing on MCQ tabs had no indication that scenarios were expandable, that answers revealed per-option explanations, or that answers were interactive at all. Simulation tabs (SparkLab) had no explanation of what the controls did. Specialized formats (StaffLayer sequential reveal, CaseStudies multi-part, Verbatim record→rate) were entirely unexplained.  
**Status:** Resolved v4.17 (2026-05-29) — interaction guidance added to all 23 tabs.

---

## Part VI — Learning Quality Audit

### #008 — 2026-05-27 · Learning Quality / Source Material

**Scope:** Static read of `StaffLayerTab.jsx`, `CombinatorTab.jsx`, `TrainerTab.jsx` — scenario realism, explanation depth, mental model transferability, distractor quality.  
**Trigger:** Optimization objective confirmed as learning quality (explanation depth, scenario realism, mental model transfer — not engagement). First audit targeting the actual learning outcome rather than code health.  
**Output:** 4 findings — 0 High, 2 Medium, 2 Low.

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | MCQ explanations in CombinatorTab and TrainerTab state the correct answer but don't explain the production failure mode — user can pass the question without building transferable judgment | `CombinatorTab.jsx`, `TrainerTab.jsx` | Medium | ✅ Fixed — all 190 explanations (130 CombinatorTab + 60 TrainerTab) expanded with "In production, this breaks as: [X]. The tell: [Y]." pattern (2026-05-27) |
| 2 | Distractor quality is uneven — several wrong options are too obviously wrong (e.g., "Accuracy" in an imbalanced-class MCQ), reducing the judgment signal. A user who knows anything picks the right answer without reasoning through the tradeoff | `CombinatorTab.jsx`, `TrainerTab.jsx` | Medium | ⚠️ Open |
| 3 | StaffLayerTab domain coverage is thin for high-value domains — Experiment Design (1 scenario), Feature Engineering (1), Ranking (1), Ethics/Fairness (1). These are the domains most likely to come up in Staff-level interviews and incidents | `StaffLayerTab.jsx` | Low | ✅ Fixed — 6 new scenarios added: Experiment Design ×4 (SRM, novelty effect, 12 simultaneous tests, SUTVA/spillover), Feature Engineering ×2 (post-redesign covariate shift, offline-online correlation gap = leakage). Total 17 → 23 scenarios (2026-05-27) |
| 4 | IC3 reveals in StaffLayerTab are occasionally strawman-level — "Ship it — p < 0.05" as IC3 is too obviously wrong. A real IC3 engineer knows more than that. Strawman IC3 makes the Staff reveal feel earned without being earned | `StaffLayerTab.jsx` | Low | ✅ Fixed — s1 IC3 revised from "Ship it — p < 0.05" to competent-but-incomplete response; s2 IC3 revised from "Retrain immediately" to pipeline-check-first approach (2026-05-27) |

**Finding 1 detail — thin explanations:**

The explanations in CombinatorTab and TrainerTab follow a consistent pattern: state the mechanism, optionally add a formula or threshold. What they don't do: explain what goes wrong in production if you get this wrong, or give a signal for recognizing the pattern in a real codebase or incident.

Examples of thin explanations and what they're missing:

| Question | Current explanation | Missing |
|----------|-------------------|---------|
| Imputer fit on full dataset | "Fit imputer on train, transform both. Using full dataset leaks test statistics." | Why this matters: offline metrics look fine, production degrades silently because imputed values shift when test distribution differs. The signal: train/val agreement is suspiciously high. |
| Target leakage (TrainerTab) | "Target leakage occurs when features incorporate information from the future." | What failure mode looks like: model AUC is 0.94 where 0.80 was previously the ceiling. The tell: model performs perfectly in backtest, crashes live. |
| Shadow vs canary | "Shadow: mirror traffic to new model, compare outputs, no user impact." | When you choose shadow over canary: when you can't afford to serve degraded results to anyone — high-stakes, irreversible decisions. When canary is better: when you need real user behavior signal. |

The fix pattern: append 1-2 sentences per explanation following "In production, getting this wrong looks like: X. The signal that you're in this situation: Y." This is the **what/why/signal** pattern already used in the StaffLayerTab staff-level reveals and the FeatureStoreArchitecture detail panels — apply it to the MCQ explanations.

**Finding 2 detail — distractor quality:**

Several MCQ wrong options are eliminable without judgment:
- "Accuracy" as a wrong option in any imbalanced-class question — no practitioner above IC3 would pick this
- "Drop rows with missing values" as a wrong option in any feature engineering question about imputation — too obviously destructive
- "All layers simultaneously" for fine-tuning order — anyone who has run fine-tuning knows this is wrong

Better distractors would be options that are: (a) correct in a different context, (b) used commonly but for the wrong reason, or (c) adjacent to the right answer but subtly wrong. Example: replace "Drop rows with missing values" with "Impute with mean computed on training set only, ignoring missingness mechanism" — this is what many practitioners actually do, and it's wrong for a specific reason worth teaching.

Target: 2 of the 3 wrong options per question should require genuine judgment to eliminate, not just recall.

**Finding 3 detail — StaffLayerTab domain gaps:**

17 scenarios total. Distribution:
- Problem Framing: 5 — well covered
- ML Necessity: 4 — well covered (recently added)
- Systems: 3 — adequate
- MLOps: 3 — adequate
- Architecture: 2 — thin
- Experiment Design: 1 — critical gap (A/B testing judgment is the #1 Staff-level interview topic)
- Feature Engineering: 1 — critical gap (feature stores, leakage triage are core production skills)
- Ranking: 1 — gap
- Ethics/Fairness: 1 — gap

Experiment Design has 1 scenario: "A/B test shows p=0.03." That's too narrow. Missing: SRM diagnosis, network effects / SUTVA violations, novelty effect, metric selection before running (not after), sequential testing decisions.

Feature Engineering has 1 scenario. Missing: point-in-time join debugging, feature store version mismatch, leakage triage (where in the pipeline did it enter?).

**Finding 4 detail — IC3 strawman:**

"Ship it — p < 0.05, statistically significant." is not a real IC3 response. A real IC3 engineer has read about A/B testing and knows about practical significance, segment breakdowns, and minimum runtime. The strawman makes the Staff reveal feel more insightful than it is — you're not teaching judgment, you're teaching "don't be like the strawman."

Better IC3: an answer that is competent but incomplete. Something a good engineer would say before they'd seen a few experiments fail: "Check practical significance, confirm no segment regressions, get PM sign-off on the effect size, then ship." This is wrong at Staff level (missing guardrail violations, metric selection, rollback plan) but it's a real human answer.

**Priority actions:**
1. *(Medium)* Expand MCQ explanations in CombinatorTab and TrainerTab to include production failure mode + recognition signal. ~90 min across ~60 questions. Target: every explanation ends with the pattern "In production, this breaks as: [X]" or "The tell is: [Y]."
2. *(Medium)* Audit and improve distractor quality — replace 1 obviously-wrong option per affected question with a plausibly-wrong option that requires real judgment to eliminate. ~60 min across 20-30 questions.
3. *(Low)* Add 4-6 new StaffLayerTab scenarios in thin domains: 2-3 Experiment Design (SRM, network effects, novelty effect), 1-2 Feature Engineering (leakage triage, point-in-time debugging), 1 Ranking.
4. *(Low)* Revise IC3 reveals in StaffLayerTab to be competent-but-incomplete rather than obviously-wrong. Target: IC3 should be something a good mid-level engineer would genuinely say.

---

### #009 — 2026-05-27 · Visual Polish / "Take My Money" Audit

**Scope:** End-to-end visual audit of all major surfaces — home, grids, every content tab, interactive cards, icons, typography  
**Trigger:** User-directed polish pass targeting premium product feel across every screen  
**Output:** All findings resolved in the same session

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | HomeTab hero: single-column, weak stats, emoji feature icons, no product mockup | `HomeTab.jsx` | High | ✅ Fixed — two-column hero, ScenarioMockup, SVG feature cards |
| 2 | All tab h1 headers plain white text — no domain accent differentiation | All 20+ tab files | High | ✅ Fixed — domain accent gradient text, fontWeight 900 |
| 3 | H3 section headers inside modules plain `var(--ink-hi)` — no visual hierarchy vs body | 13 tab files | Medium | ✅ Fixed — domain accent color, fontWeight 800 |
| 4 | ☆/★ bookmark icons — unicode emoji, visually weak and inconsistent with SVG design language | 6 tab files | Medium | ✅ Fixed — SVG bookmark (outline/filled) |
| 5 | ▶ chevron expand/collapse — unicode, no proper animation (transform: 'none') | 4 tab files | Medium | ✅ Fixed — SVG chevron, fixed rotation to rotate(0deg) |
| 6 | Interview tool grid icons — 6 unicode emoji (📝🛡️⏱️🎙️etc.) | `App.jsx` | Medium | ✅ Fixed — SVG icons, step badges (01–04) |
| 7 | InterviewPrepTab session summary stat cards — plain `var(--depth)` + `var(--rim)`, no glass treatment | `InterviewPrepTab.jsx` | Low | ✅ Fixed — glass gradient, inset highlight, depth shadow |
| 8 | Tab description copy under h1 — `var(--ink-low)` at 40% opacity, near-invisible | 11 tab files | Low | ✅ Fixed — bumped to `var(--ink-mid)` |

---

## Part VII — Mobile UI/UX Audits

### #015 — 2026-05-27 · Mobile UI/UX Comprehensive

**Scope:** Full static audit of App.jsx, index.css, and all 30+ tab files for mobile layout, touch targets, platform compatibility, interactive bugs, and content scaling. No physical device — code-only audit.  
**Trigger:** User reported visible horizontal clipping and nav overflow on phone. Extended to a full mobile pass after layout bugs confirmed.  
**Output:** 10 findings — 2 High, 4 Medium, 4 Low.

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | `input[type="text"]` and `input[type="search"]` have `font-size: 15px` in `index.css` — iOS Safari auto-zooms the entire page on input focus when font-size < 16px | `index.css` | High | ✅ Fixed — 15px → 16px |
| 2 | `TwoTowerArchitecture` (SystemDesignTab) and `MLServingArchitecture` (DLServingTab) SVGs have `width={SVG_W}` (fixed px, ~650px) and `style={{ minWidth: SVG_W }}` — these cannot shrink on mobile and will cause horizontal overflow past `overflow-x:hidden` | `SystemDesignTab.jsx`, `DLServingTab.jsx` | High | ✅ Fixed — added `maxWidth: '100%'` to both SVGs; container already had `overflowX: auto` |
| 3 | `MLOpsDeployTab` metrics table is inside a `.card` with `overflow: hidden` — table content is **clipped**, not scrollable, on narrow screens | `MLOpsDeployTab.jsx` | Medium | ✅ Fixed — table wrapped in `overflowX: auto` div, `minWidth: 480px` on table |
| 4 | `VerbatimTab` SpeechRecognition has no iOS Safari detection — Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`) is unsupported on iOS Safari. No warning shown; microphone button appears functional but silently fails | `VerbatimTab.jsx` | Medium | ✅ Fixed — UA detection for iOS; platform-specific fallback message |
| 5 | Topbar back button: `padding: '4px 0'` — effective tap height ~22px, well below the 44px WCAG minimum for touch targets | `App.jsx` | Medium | ✅ Fixed — padding `10px 8px`, negative margin `-10px -8px` to expand tap target without layout shift |
| 6 | `CombinatorTab` countdown timer continues running when user switches zones mid-session — timer state and interval behavior under zone navigation needs verification | `CombinatorTab.jsx` | Medium | ✅ Fixed — component unmounts on zone switch (timer stops); added `savedAt: Date.now()` to localStorage save and subtract elapsed time on restore |
| 7 | Pyodide Python cells — cold start 3s+ on desktop; no mobile compatibility warning shown; low-end phones may OOM or time out silently on wasm load | `PythonCell.jsx`, `MathFoundationsTab.jsx` | Low | ⚠️ Open — deferred |
| 8 | `VerbatimTab` `SpeechRecognition.onend` fires unexpectedly after silence on some Chrome/Android versions — auto-restart logic may double-fire | `VerbatimTab.jsx` | Low | ✅ Fixed — `isStoppingRef` guard; `onend` returns early when stop was intentional |
| 9 | `DefenseDocTab` PDF export via `window.print()` — `@media print` CSS untested on Safari and Firefox mobile; known cross-browser inconsistencies with print layouts | `DefenseDocTab.jsx` | Low | ✅ Fixed — replaced `body > * { display: none }` with `* { visibility: hidden }` + `.defense-doc-print { visibility: visible; position: fixed }` pattern; added `@page { margin: 1.2cm }` |
| 10 | `InterviewPrepTab` long-form answer text has no `maxWidth` or `lineHeight` cap on mobile — walls of text at full viewport width are hard to read on phones | `InterviewPrepTab.jsx` | Low | ⚠️ Open — deferred |

**Finding 1 detail — iOS input zoom:**  
iOS Safari fires a page-level zoom when the user taps any `<input>` with `font-size < 16px`. The CSS sets `font-size: 15px` on `input[type="text"]` and `input[type="search"]`. This affects `AskTab` (KB search), `JDPrepTab` (JD text input), `VerbatimTab`, and others. Fix: change to `font-size: 16px` in `index.css`. No visual change on desktop; eliminates the iOS zoom.

**Finding 2 detail — fixed-size SVG diagrams:**  
`TwoTowerArchitecture` in SystemDesignTab computes `SVG_W = COLS * 155 + PAD*2` — with COLS=4, PAD=20, that is `SVG_W = 660px`. `MLServingArchitecture` in DLServingTab computes `SVG_W = COLS * 160 + PAD*2` ≈ similar. Both set `width={SVG_W}` and `style={{ minWidth: SVG_W }}` on the `<svg>` element. On a 390px phone, these force 660px-wide content. Fix: wrap each SVG in an `overflow-x: auto` container, remove `minWidth`, and replace `width={SVG_W}` with `style={{ width: '100%', minWidth: SVG_W }}` — lets the container scroll horizontally while preserving the diagram layout.

**Finding 3 detail — clipped table:**  
`MLOpsDeployTab` metrics table is inside a `.card` div with `overflow: hidden` (the card's border-radius clip). No `overflow-x: auto` wrapper on the table. On mobile, table columns that exceed viewport width are clipped with no scroll affordance. Fix: wrap the table in `<div style={{ overflowX: 'auto' }}>`.

**Finding 4 detail — iOS Speech API:**  
`window.SpeechRecognition || window.webkitSpeechRecognition` returns `undefined` on iOS Safari (confirmed unsupported as of iOS 17). The `speechSupported` flag is set correctly but no user-facing message explains the limitation on iOS. Users see the full VerbatimTab UI, tap the microphone, and nothing happens. Fix: detect iOS Safari specifically and show an inline notice: "Voice recording requires Chrome or Android. On iOS, type your answer instead."

**Finding 5 detail — back button tap target:**  
The topbar back button (`← Back` with breadcrumb) has `padding: '4px 0'` and `fontSize: '13px'`. Effective touch height is approximately 21px. WCAG 2.5.5 recommends 44×44px. On mobile, users frequently mis-tap and trigger scroll instead of navigation. Fix: increase padding to `'10px 8px'` — no visual change at normal density, full tap target on mobile.

**Priority actions (in order):**
1. *(High)* `font-size: 15px` → `16px` on inputs in `index.css`. One-line change.
2. *(High)* Wrap SVG diagrams in `overflow-x: auto` containers, remove `minWidth` inline style from both SVGs.
3. *(Medium)* Wrap `MLOpsDeployTab` table in `overflowX: 'auto'` div.
4. *(Medium)* Add iOS Safari detection to `VerbatimTab` with fallback message.
5. *(Medium)* Increase topbar back button padding to `'10px 8px'`.
6. *(Medium)* Verify/fix CombinatorTab timer behavior on zone switch.

---

### #017 — 2026-05-29 · Codebase Health Sweep

**Scope:** Full static scan of all `src/tabs/*.jsx`, `src/App.jsx`, `src/index.css`, and all MD spine files  
**Trigger:** Routine audit run to establish current health baseline  
**Output:** 5 findings — 0 High, 2 Medium, 3 Low

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | `CLAUDE.md` file structure had 3 wrong filenames (`MathFoundationsTab.jsx` → `ModelsMathTab.jsx`, `DeploymentTab.jsx` → `MLOpsDeployTab.jsx`, `CICDTab.jsx` → `MLOpsPipelinesTab.jsx`) and `LandscapeTab.jsx` completely absent | `CLAUDE.md` | High | ✅ Fixed — corrected in this session |
| 2 | Hardcoded font literal strings in `App.jsx` — 8+ instances of `"'Space Grotesk',sans-serif"` and `"'JetBrains Mono',monospace"` instead of `var(--font-sans)` / `var(--font-mono)`. Tab files were cleaned in v4.2/v4.3; App.jsx was not updated. Also 3 instances of `'Inter, sans-serif'` in `AskTab.jsx`. | `App.jsx`, `AskTab.jsx` | Medium | ✅ Fixed v4.38 — all `'JetBrains Mono',monospace` → `var(--font-mono)` in App.jsx (5 occurrences); all `Inter, sans-serif` → `var(--font-sans)` in AskTab.jsx (8 occurrences) |
| 3 | Residual hardcoded hex in 4 files: `color: '#000'`/`'#fff'` in `App.jsx` (lines 441, 781), `#f97316` in `dbtTab.jsx` DANGER_COLORS (should be `var(--ember)`), `color: '#000'` in `InterviewPrepTab.jsx` (line 649), `#6366f1`/`#22d3ee` in `ModelEvalTab.jsx` progress bar gradient. | `App.jsx`, `dbtTab.jsx`, `InterviewPrepTab.jsx`, `ModelEvalTab.jsx` | Low | ✅ Partially fixed v4.38 — App.jsx `#000`→`var(--void)`, `#fff`→`var(--white)`; InterviewPrepTab.jsx `#000`→`var(--void)`. dbtTab.jsx `#f97316` not found (already cleaned in prior session). ModelEvalTab gradient hex (`#6366f1`/`#22d3ee`) still open — deferred. |
| 4 | `LandscapeTab.jsx` has no entry in `LINEAGE.md` — 684-line career intelligence tab (roles, salaries, market data, ML timeline) in `today` zone with no documented build history | `LINEAGE.md` | Medium | ⚠️ Open |
| 5 | Bundle size risk — 28,757 total lines across all tab files + App.jsx, no lazy loading. At current growth rate, will exceed 1.5MB bundle threshold within ~3 content sprints. Already tracked in IDEAS.md/NEXT.md. | — | Low | ⚠️ Tracked — deferred pending bundle audit |

**Note — AUDITS.md numbering fix (this session):**  
The emoji/mobile audit had been mislabelled `#009` (duplicate of the Visual Polish audit). Renumbered to `#016`. The summary table had a duplicate `#010` row (TimeSeriesTab bug fix). Deduplicated: TimeSeriesTab fix stays as `#010`, Interaction Guidance promoted to its own row with the correct next sequential number.

**Priority actions:**
1. *(Medium)* Replace hardcoded font strings in `App.jsx` with `var(--font-sans)` / `var(--font-mono)`. ~15 min. Do in a housekeeping pass alongside the AskTab `'Inter, sans-serif'` instances.
2. *(Low)* Replace `#000`/`#fff`/`#f97316`/`#6366f1`/`#22d3ee` hex literals with CSS variables (`var(--void)`, `var(--white)`, `var(--ember)`, `var(--violet)`, `var(--sky)`). ~10 min.
3. *(Medium)* Add `LandscapeTab` build history to `LINEAGE.md`.

---

### #018 — 2026-05-29 · Mobile Hover Sticky Bug Sweep (PAL Fix Pattern)

**Scope:** Automated grep for `e.currentTarget.style` in `onMouseEnter` handlers across all `src/tabs/*.jsx`  
**Trigger:** Follow-on to Audit #017 — the same sticky-hover bug class fixed in PAL v4.33.5–v4.33.6 had never been audited in this codebase  
**Output:** 6 findings — 1 High, 4 Medium (incl. 1 logic bug), 1 Medium crash guard — all fixed same session

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | `TimedPractice` tier rating buttons — `onMouseEnter` imperatively sets `background`; `onMouseLeave` never fires on touch; selected-looking button stuck highlighted | `InterviewPrepTab.jsx` 416–417 | High | ✅ Fixed — `hoveredTier` useState, background computed in style object |
| 2 | Question select buttons in `filteredQuestions.map()` — stuck border color after touch | `VerbatimTab.jsx` 305–306 | Medium | ✅ Fixed — `hoveredQId` useState, border computed via template literal |
| 3 | `ResultCard` link buttons — imperative color + borderColor mutation; standalone component required adding useState inside it | `AskTab.jsx` 418–424 | Medium | ✅ Fixed — `hoveredLink` useState inside `ResultCard` |
| 4 | "Surprise me" button — logic bug: base `rgba(212,175,55,0.15)`, hover `rgba(212,175,55,0.14)` — lower opacity than rest state (inverted, imperceptible) | `AskTab.jsx` 736–737 | Medium (logic) | ✅ Fixed — `surpriseHovered` useState, hover correctly raised to `0.25` |
| 5 | Suggestion chip buttons — imperative borderColor + color mutation in SUGGESTIONS.map() | `AskTab.jsx` 778–784 | Medium | ✅ Fixed — `hoveredSugg` useState indexed by position |
| 6 | `msl_read` JSON.parse without try/catch — null handled (`\|\| '[]'`) but corrupted JSON crashes GradientTab on mount | `GradientTab.jsx` 2230 | Medium (crash) | ✅ Fixed — lazy initializer wrapped in try/catch, falls back to `new Set()` |

**Root cause:** On mobile, touch events fire `onMouseEnter` when components render after navigation. `onMouseLeave` never fires on touch. Any `e.currentTarget.style.*` write in an `onMouseEnter` handler sticks until the component unmounts.

**Canonical fix pattern (PAL v4.33.5–v4.33.6):** `useState(null)` for hoveredId, compute hover value in the style object, no imperative DOM writes. All future hover effects must follow this pattern — never write to `e.currentTarget.style` in event handlers.

**Brace balance:** All 4 modified files verified at `0` post-fix.

---

### #019 — 2026-05-29 · Guidance Completeness Final Sweep

**Scope:** All 31 tab files — header, description, interaction hint, module nav labels  
**Trigger:** Follow-on to v4.17 guidance pass; completing the full-app coverage  
**Method:** Grep for description paragraph patterns → direct reads on all `desc=0` results → confirmed gaps by reading rendered header sections  
**Output:** 4 gaps found and fixed same session; 27 tabs confirmed clean

| # | Finding | File | Severity | Status |
|---|---------|------|----------|--------|
| 1 | Missing interaction hint — no workflow description for expand→write→compare→self-score flow | `TakeHomeTab.jsx` | Medium | ✅ Fixed — added hint below subtitle |
| 2 | Missing navigation hint — description was broad but no guidance on what each of the 5 section tabs contains | `LandscapeTab.jsx` | Low | ✅ Fixed — added Roles/Salary/Stack/etc. navigation hint |
| 3 | Missing session flow explanation — subtitle said "answers locked until time ends" but no description of question flow or debrief | `CombinatorTab.jsx` config screen | Medium | ✅ Fixed — added choose→start→lock→debrief flow hint |
| 4 | Missing interaction hint — description said what KB covers but not how to interact with it | `AskTab.jsx` | Low | ✅ Fixed — added type/suggest/Surprise-me usage hint |

**False negatives in initial grep:** Practice tabs using `fontSize: '15px'` and `color: 'var(--ink-low)'` registered as `desc=0` because the grep pattern targeted `14px`/`var(--ink-mid)`. All 9 tabs confirmed clean on direct read (Airflow, dbt, DataModeling, DeepLearning, DLFineTuning, DLServing, DataScience, CausalInference, TimeSeries).

**Brace balance:** All 4 modified files verified at `0` post-fix.

---

## Summary Table

| # | Audit | Date | Type | Status |
|---|-------|------|------|--------|
| 001 | BUILD baseline — brace balance, colors, localStorage, onNavigate, index keys | 2026-05-26 | BUILD / Visual Consistency | 1 open ⚠️ (index keys) |
| 002 | Font hardcoding, dead PipelineBlogTab | 2026-05-26 | BUILD / Visual Consistency | ✅ Both resolved |
| 003 | Security baseline — gitignore, env vars, secrets | 2026-05-26 | Security | ✅ All clean |
| 004 | SEO baseline — og-image missing, sitemap missing | 2026-05-26 | SEO / Social | ✅ Both fixed |
| 005 | Build Safety — apostrophes, template literals, Vite parse risk | 2026-05-26 | Build Safety | ✅ All clean |
| 006 | Analytics — autocapture PII risk, event coverage gaps, undocumented taxonomy | 2026-05-26 | Analytics | ✅ All fixed |
| 007 | First-Time User — Ask label mismatch, zone split confusion, changelog visibility, Gradient cold entry, Interview sequencing | 2026-05-26 | First-Time User / UX | ✅ All resolved |
| 008 | Learning Quality — MCQ explanation depth, distractor quality, StaffLayer domain gaps, IC3 strawman | 2026-05-27 | Learning Quality / Source Material | 1 open ⚠️ |
| 009 | Visual Polish — "take my money" end-to-end audit: tab headers, icons, cards, interactive surfaces | 2026-05-27 | Visual Consistency / UX | ✅ All resolved |
| 010 | TimeSeriesTab ForecastFailureZoo — `correct:` field was numeric index, compared against string IDs; score never counted | 2026-05-27 | BUILD / Content Integrity | ✅ Fixed |
| 011 | Mobile layout — hero two-column grid not responsive; ScenarioMockup clipped on phone viewports | 2026-05-27 | Mobile | ✅ Fixed |
| 012 | Low-brightness contrast pass 1 — ink-low/ink-ghost variables too conservative; card borders invisible | 2026-05-27 | Mobile / Visual Consistency | ✅ Fixed |
| 013 | Full contrast audit — 200+ inline rgba tint backgrounds invisible at low brightness | 2026-05-27 | Mobile / Visual Consistency | ✅ Fixed |
| 014 | Mobile horizontal overflow — no overflow-x:hidden on html/body; bottom nav overflow narrow viewports | 2026-05-27 | Mobile | ✅ Fixed |
| 015 | Mobile UI/UX comprehensive audit — 10 findings across layout, touch targets, platform support | 2026-05-27 | Mobile | 8/10 fixed ✅ · 2 deferred |
| 016 | Visual Consistency — emoji residue across tabs + HomeTab TODAY row mobile test | 2026-05-29 | Visual Consistency / Mobile | ✅ #16.3 fixed v4.28 · 2 open ⚠️ (emoji residue) |
| 017 | Codebase health sweep — CLAUDE.md stale filenames, hardcoded fonts in App.jsx, residual hex, LandscapeTab undocumented | 2026-05-29 | BUILD / Visual Consistency | 3 open ⚠️ |
| 018 | Mobile hover sticky bug sweep — PAL fix pattern applied to 4 tabs; GradientTab JSON.parse crash guard | 2026-05-29 | Mobile / BUILD | ✅ All 6 fixed |
| 019 | Guidance completeness final sweep — 4 gaps fixed (TakeHome, Landscape, Combinator, Ask); 27 tabs confirmed clean | 2026-05-29 | Guidance Completeness | ✅ All 4 fixed |
| 020 | Post-sprint state check — v4.28 + v4.29 additions (SpotTheFlawTab, 10 new interactive modules, all COMING_SOON cleared) | 2026-05-30 | BUILD / Content Integrity | See below |
| 021 | Post-v4.33 state check — ProjectLabTab routing + brace balance, msl_projectlab_churn_data in METRICS.md, SpotTheFlaw scenario count vs GlobalSearch, .msl-cloud-map mobile render | 2026-05-31 | BUILD / Content Integrity | 1 open ⚠️ |
| 022 | Mobile sidebar always-visible bug — `display:'flex'` inline style on DesktopSidebar overrode CSS `display:none` on all viewports | 2026-05-30 | Mobile / BUILD | ✅ Fixed v4.34 |

### #020 — 2026-05-30 · Post-Sprint State Check (v4.28 + v4.29)

**Scope:** Review of new additions from v4.28 (SpotTheFlawTab, README, HomeTab fixes, StaffLayer, ForwardPointers) and v4.29 (AttentionHeadVisualizer, ArchDecisionLab, ExperimentDesignFailures, CausalDAGExplorer, StreamingStabilityLab, DecisionBoundaryLab, CombinatorTab company tracks + challenge mode, TrainerTab SR queue + weak domain drill).  
**Trigger:** Routine post-sprint check to log any new open issues.  
**Brace balance:** All 10 modified files verified at `0`.

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | SpotTheFlawTab added to Interview zone + PREMIUM_TABS + GlobalSearch + INTERVIEW_TOOLS — routing confirmed clean | `SpotTheFlawTab.jsx`, `App.jsx`, `GlobalSearch.jsx` | — | ✅ Clean |
| 2 | AttentionHeadVisualizer uses hardcoded `rgba(99,102,241,...)` for heatmap cell colors instead of CSS var — technically violates no-hex rule | `DeepLearningTab.jsx` | Low | ⚠️ Open — intentional interpolation pattern; closest CSS var is `var(--prime)`. Fix if doing a color pass. |
| 3 | CombinatorTab agent noted a latent bug in session restore path referencing undefined `QUESTIONS` variable — fixed to search `[...MCQ_QUESTIONS, ...SA_QUESTIONS]` | `CombinatorTab.jsx` | High | ✅ Fixed same session |
| 4 | TrainerTab Spaced Repetition panel is domain-level only — not per-scenario SR with intervals. `msl_trainer_sr_log` key not written. Tracked as partial in IDEAS.md. | `TrainerTab.jsx` | Low | ⚠️ Open (tracked) |
| 5 | CLAUDE.md had stale "9-tool" count and "see README" reference for localStorage keys — corrected. | `CLAUDE.md` | Low | ✅ Fixed 2026-05-30 |
| 6 | IDEAS.md Tier 2: 5 modules marked done (decision boundary, memory pressure, attention head, model registry, alerting); 2 marked partially done (spaced rep, company tracks). | `IDEAS.md` | — | ✅ Updated 2026-05-30 |
| 7 | `msl_score:dl_arch`, `msl_score:causal_exp`, `msl_score:causal_dag`, `msl_score:classical_boundary` not in METRICS.md registry | `METRICS.md` | Medium | ✅ Fixed 2026-05-30 |
| 8 | CausalDAGExplorer and StreamingStabilityLab have no fidelity badges — both are Conceptual/Simplified fidelity, not mathematically faithful | `CausalInferenceTab.jsx`, `SparkLabTab.jsx` | Low | ⚠️ Open — fidelity badge upgrade (3-tier) is a separate Ideas.md item |
| 9 | ROLLOUT.md Batch 0 checklist referenced removed "Learning Paths" (removed v4.15) in HomeTab test item | `ROLLOUT.md` | Low | ✅ Fixed 2026-05-30 |

**Open findings by severity (updated 2026-05-31):**

| Severity | Count | Items |
|----------|-------|-------|
| High | 0 | — |
| Medium | 1 | #017.3 (LandscapeTab undocumented in LINEAGE) |
| Low | 2 | #001 index keys, #017.2 partial (ModelEvalTab `#6366f1`/`#22d3ee` gradient hex still open) |

**Note:** #016.1-2 (decorative color/emoji residue) resolved by Oracle refactor v4.31–v4.32. #017.1 (hardcoded fonts) closed v4.38. #017.2 partially closed v4.38 — App.jsx/InterviewPrepTab fixed; dbtTab was already clean; ModelEvalTab gradient hex deferred. #015.7, #015.10, #020.2, #020.4, #021.5 resolved in earlier sessions.

---

### #022 — 2026-05-30 · Mobile — Sidebar always visible on mobile

**Scope:** `DesktopSidebar` component in `src/App.jsx`  
**Trigger:** User reported sidebar rendering on mobile and never closing  
**Root cause:** `display: 'flex'` in the `<aside>` element's inline style overrides the CSS class rule `.desktop-sidebar { display: none; }`. Inline styles have higher specificity than class selectors — the CSS media query was correctly written but silently losing to the inline style on every viewport.

| # | Finding | File | Severity | Status |
|---|---------|------|----------|--------|
| 1 | `display: 'flex'` in `DesktopSidebar` inline style overrides `.desktop-sidebar { display: none }` CSS class on mobile | `App.jsx` line ~460 | High | ✅ Fixed v4.34 — removed `display` from inline style; added `flex-direction: column` to the `@media (min-width: 769px)` CSS rule |

**Fix:** Removed `display: 'flex'` from the `<aside>` inline style object. Added `flex-direction: column` to `.desktop-sidebar` inside the `@media (min-width: 769px)` block in `index.css`. CSS class now fully owns the `display` property. Brace balance: 0. Commit `7c8eae8`.

**Note:** Any similar `correct: <number>` vs string-ID mismatch should be checked in ForecastFailureZoo-style components if added in future. Pattern to watch: options array using `{ id: '...', label: '...' }` structure requires string IDs in `correct` field.

---

### #021 — 2026-05-31 · Post-v4.33 State Check

**Scope:** ProjectLabTab routing + brace balance, METRICS.md key registration, SpotTheFlaw count vs GlobalSearch, .msl-cloud-map mobile rendering.  
**Trigger:** NEXT.md item #4.

| # | Finding | File | Severity | Status |
|---|---------|------|----------|--------|
| 1 | ProjectLabTab brace balance: 0 ✓ | `ProjectLabTab.jsx` | — | ✅ Clean |
| 2 | ProjectLabTab routing in App.jsx: imported, in PREMIUM_TABS, ML Engineering domain, correct zone | `App.jsx` | — | ✅ Clean |
| 3 | `msl_projectlab_churn_data` present in METRICS.md key registry | `METRICS.md` | — | ✅ Clean |
| 4 | GlobalSearch SpotTheFlaw description said "10 real ML analyses" but tab has 12 scenarios | `GlobalSearch.jsx` | Low | ✅ Fixed — updated to "12" in this session (183bc93) |
| 5 | `.msl-cloud-map` CSS is defined but has no `overflow-x: auto` or `max-width` constraint — wide service chip rows may overflow on narrow mobile viewports | `index.css` lines 524–540 | Low | ⚠️ Open — needs browser verification on 375px viewport |

**Open findings (carry forward):**

| Severity | Count | Items |
|----------|-------|-------|
| High | 0 | — |
| Medium | 1 | #017.3 LandscapeTab undocumented in LINEAGE |
| Low | 2 | #001 index keys, #017.2 partial (ModelEvalTab gradient hex) |
