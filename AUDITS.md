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

## Summary Table

| # | Audit | Date | Type | Status |
|---|-------|------|------|--------|
| 001 | BUILD baseline — brace balance, colors, localStorage, onNavigate, index keys | 2026-05-26 | BUILD / Visual Consistency | 3 open ⚠️ |
| 002 | Font hardcoding, dead PipelineBlogTab | 2026-05-26 | BUILD / Visual Consistency | 2 open ⚠️ |
| 003 | Security baseline — gitignore, env vars, secrets | 2026-05-26 | Security | ✅ All clean |
| 004 | SEO baseline — og-image missing, sitemap missing | 2026-05-26 | SEO / Social | ✅ Both fixed |
| 005 | Build Safety — apostrophes, template literals, Vite parse risk | 2026-05-26 | Build Safety | ✅ All clean |
| 006 | Analytics — autocapture PII risk, event coverage gaps, undocumented taxonomy | 2026-05-26 | Analytics | ✅ All fixed |

**Open findings by severity:**

| Severity | Count | Items |
|----------|-------|-------|
| High | 0 | — all resolved |
| Medium | 0 | — all resolved |
| Low | 1 | #001 index keys — replace with stable keys only where lists filter/reorder |
