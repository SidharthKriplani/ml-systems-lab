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

**Audit types not yet run (high value):**
- First-Time User, Source Material, Coverage, Analytics, MVP / Weight, IP / Moat, Architecture

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
| 2 | Hardcoded hex/rgb colors in 5 component files | See detail | Medium | ⚠️ Open |
| 3 | `DefenseDocTab` hex in print stylesheet | `DefenseDocTab` 401–402 | — | ✅ Exempt — print resets need absolute values |
| 4 | All localStorage key constants properly `msl_`-prefixed | All tabs | — | ✅ Clean |
| 5 | 26 tabs missing `onNavigate` prop in export signature | See detail | Medium | ⚠️ Open |
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
| 1 | Hardcoded `fontFamily` strings in 30+ tab files | Widespread — see detail | Medium | ⚠️ Open |
| 2 | `PipelineBlogTab.jsx` is dead code — `export default function PipelineBlogTab() { return null }`, not imported in `App.jsx` | `src/tabs/PipelineBlogTab.jsx` | Low | ⚠️ Open |

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
| 1 | `input[type="text"]` and `input[type="search"]` have `font-size: 15px` in `index.css` — iOS Safari auto-zooms the entire page on input focus when font-size < 16px | `index.css` | High | ⚠️ Open |
| 2 | `TwoTowerArchitecture` (SystemDesignTab) and `MLServingArchitecture` (DLServingTab) SVGs have `width={SVG_W}` (fixed px, ~650px) and `style={{ minWidth: SVG_W }}` — these cannot shrink on mobile and will cause horizontal overflow past `overflow-x:hidden` | `SystemDesignTab.jsx`, `DLServingTab.jsx` | High | ⚠️ Open |
| 3 | `MLOpsDeployTab` metrics table is inside a `.card` with `overflow: hidden` — table content is **clipped**, not scrollable, on narrow screens | `MLOpsDeployTab.jsx` | Medium | ⚠️ Open |
| 4 | `VerbatimTab` SpeechRecognition has no iOS Safari detection — Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`) is unsupported on iOS Safari. No warning shown; microphone button appears functional but silently fails | `VerbatimTab.jsx` | Medium | ⚠️ Open |
| 5 | Topbar back button: `padding: '4px 0'` — effective tap height ~22px, well below the 44px WCAG minimum for touch targets | `App.jsx` | Medium | ⚠️ Open |
| 6 | `CombinatorTab` countdown timer continues running when user switches zones mid-session — timer state and interval behavior under zone navigation needs verification | `CombinatorTab.jsx` | Medium | ⚠️ Open |
| 7 | Pyodide Python cells — cold start 3s+ on desktop; no mobile compatibility warning shown; low-end phones may OOM or time out silently on wasm load | `PythonCell.jsx`, `MathFoundationsTab.jsx` | Low | ⚠️ Open |
| 8 | `VerbatimTab` `SpeechRecognition.onend` fires unexpectedly after silence on some Chrome/Android versions — auto-restart logic may double-fire | `VerbatimTab.jsx` | Low | ⚠️ Open |
| 9 | `DefenseDocTab` PDF export via `window.print()` — `@media print` CSS untested on Safari and Firefox mobile; known cross-browser inconsistencies with print layouts | `DefenseDocTab.jsx` | Low | ⚠️ Open |
| 10 | `InterviewPrepTab` long-form answer text has no `maxWidth` or `lineHeight` cap on mobile — walls of text at full viewport width are hard to read on phones | `InterviewPrepTab.jsx` | Low | ⚠️ Open |

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

## Summary Table

| # | Audit | Date | Type | Status |
|---|-------|------|------|--------|
| 001 | BUILD baseline — brace balance, colors, localStorage, onNavigate, index keys | 2026-05-26 | BUILD / Visual Consistency | 3 open ⚠️ |
| 002 | Font hardcoding, dead PipelineBlogTab | 2026-05-26 | BUILD / Visual Consistency | 2 open ⚠️ |
| 003 | Security baseline — gitignore, env vars, secrets | 2026-05-26 | Security | ✅ All clean |
| 004 | SEO baseline — og-image missing, sitemap missing | 2026-05-26 | SEO / Social | ✅ Both fixed |
| 005 | Build Safety — apostrophes, template literals, Vite parse risk | 2026-05-26 | Build Safety | ✅ All clean |
| 006 | Analytics — autocapture PII risk, event coverage gaps, undocumented taxonomy | 2026-05-26 | Analytics | ✅ All fixed |
| 007 | First-Time User — Ask label mismatch, zone split confusion, changelog visibility, Gradient cold entry, Interview sequencing | 2026-05-26 | First-Time User / UX | ✅ All resolved |
| 008 | Learning Quality — MCQ explanation depth, distractor quality, StaffLayer domain gaps, IC3 strawman | 2026-05-27 | Learning Quality / Source Material | 1 open ⚠️ |
| 009 | Visual Polish — "take my money" end-to-end audit: tab headers, icons, cards, interactive surfaces | 2026-05-27 | Visual Consistency / UX | ✅ All resolved |
| 010 | TimeSeriesTab ForecastFailureZoo — `correct:` field was numeric index, code compared against string IDs; score never counted, correct answer never highlighted | 2026-05-27 | BUILD / Content Integrity | ✅ Fixed — all 8 scenarios updated to string IDs |
| 011 | Mobile layout — hero two-column grid not responsive; ScenarioMockup clipped on phone viewports | 2026-05-27 | Mobile | ✅ Fixed — hero-grid CSS class, mockup hidden <700px |
| 012 | Low-brightness contrast pass 1 — ink-low/ink-ghost variables too conservative; card borders invisible | 2026-05-27 | Mobile / Visual Consistency | ✅ Fixed — ink scale and surfaces bumped |
| 013 | Full contrast audit — 200+ inline rgba tint backgrounds (0.04–0.08 opacity) invisible at low brightness; affected all interactive states (selected MCQ, correct/wrong highlights, info boxes, domain cards) | 2026-05-27 | Mobile / Visual Consistency | ✅ Fixed — 369 lines across 31 files: 0.04→0.10, 0.05→0.11, 0.06→0.13, 0.07→0.14, 0.08→0.15; ink scale more aggressive; nav inactive 0.35→0.62 |
| 014 | Mobile horizontal overflow — no overflow-x:hidden on html/body; bottom nav 5 items overflow narrow viewports, dragging fixed nav off-screen left and clipping all content | 2026-05-27 | Mobile | ✅ Fixed — overflow-x:hidden + max-width:100vw on html/body; nav items shrink-safe with overflow:hidden, smaller icon container, whiteSpace:nowrap + textOverflow:ellipsis |
| 015 | Mobile UI/UX comprehensive audit — 9 findings across layout, touch targets, platform support, and interactive bugs | 2026-05-27 | Mobile | See #015 detail below |

**Open findings by severity:**

| Severity | Count | Items |
|----------|-------|-------|
| High | 2 | #015.1 (input zoom), #015.2 (SVG overflow) |
| Medium | 4 | #008.2 (distractors), #015.3 (table clip), #015.4 (iOS speech), #015.5 (back button tap target) |
| Low | 4 | #001 index keys, #015.6 (timer), #015.7 (Pyodide mobile), #015.8 (onend bug), #015.9 (print), #015.10 (line length) |

**Note:** Any similar `correct: <number>` vs string-ID mismatch should be checked in ForecastFailureZoo-style components if added in future. Pattern to watch: options array using `{ id: '...', label: '...' }` structure requires string IDs in `correct` field.
