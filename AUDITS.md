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
| 004 | SEO baseline — og-image, sitemap, meta tags | 2026-05-26 | SEO / Social | 2 open ⚠️ |

**Open findings by severity:**

| Severity | Count | Items |
|----------|-------|-------|
| High | 1 | #004 og-image.png missing |
| Medium | 4 | #001 hardcoded colors, #001 missing onNavigate, #002 font hardcoding, #004 sitemap missing |
| Low | 2 | #001 index keys, #002 dead PipelineBlogTab |
