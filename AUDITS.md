# AUDITS.md — Health Log

Diagnostic, not prescriptive. Every audit run is logged here with findings, resolved status, and date.  
Resolved findings that become buildable features go into **IDEAS.md**. Findings that reveal a missing architectural rule go into **DECISIONS.md**.

---

## Audit type reference

| Type | What it covers | Suggested frequency |
|------|---------------|-------------------|
| **BUILD** | Prop wiring, dead code, duplicate keys, component contracts, brace balance | After any large refactor |
| **Visual Consistency** | Color drift, spacing, border radius, font usage, CSS variable adherence | Monthly |
| **Navigation & Discoverability** | Hidden features, dead-end flows, tab/menu structure, breadcrumb accuracy | After adding new tabs/zones |
| **Content Integrity** | Stale copy, question bank counts vs targets, duplicate localStorage keys, version mismatches | Before interview prep seasons |
| **Framework / Technical** | Hook usage, render correctness, React patterns, Pyodide integration | After React upgrades |
| **UX / Human Elements** | Empty states, tone, onboarding friction, first-load experience, mobile feel | Quarterly |
| **Performance** | Bundle size, lazy loading, render bottlenecks, Pyodide cold start | After adding new heavy modules |
| **Coverage** | Which domains/topics lack questions, cross-links, or practice modules | When planning content sprints |
| **First-Time User** | Cold walk-through in incognito — every confusion point noted live | Before any public promotion |
| **Mobile** | Safe area, touch targets, grid overflow, tap highlight, scroll behavior | After any CSS or layout change |
| **SEO / Social** | OG tags, meta descriptions, sitemap, sharing previews | Before any marketing push |
| **MVP / Weight** | Which features earn their place? Cut or consolidate candidates | When the app feels heavy |
| **IP / Moat** | What's hard to replicate? What's original? What to double down on? | Annually |

---

## Audit log

*Entries are numbered. Each entry lists: date, type, findings, and status (✅ resolved / ⚠️ open).*

---

### #001 — 2026-05-22 · BUILD + Visual Consistency + Framework/Technical

**Scope:** Static grep scan of all `src/tabs/*.jsx`. No manual walk-through.

---

**Finding 1 — Brace balance** ✅  
All tab files pass `open_braces == close_braces`. No truncated or malformed JSX trees detected.

---

**Finding 2 — Hardcoded hex/rgb colors** ⚠️ OPEN  
Rule violation: colors must be CSS variables from `:root`. Offending files and lines:

| File | Line(s) | Values |
|------|---------|--------|
| `DLFineTuningTab.jsx` | 300, 303 | `#0d0d0f`, `#c9d1d9` |
| `DLServingTab.jsx` | 22 | `#fff` |
| `CombinatorTab.jsx` | 735 | `#fff` |
| `GradientTab.jsx` | 1566, 1628, 1745 | `#fff`, `#c0b8ae` (severity badge text + pre block) |
| `SystemDesignTab.jsx` | 140, 149, 999 | `#fff`, `#000` (severity badge text + dot) |
| `DefenseDocTab.jsx` | 401–402 | `#000`, `#fff`, `#ccc` — print stylesheet; intentional, not a variable context |

Action: Replace `#fff`/`#000` hardcodes with `var(--text)`, `var(--bg)`, `var(--rim)` equivalents. DefenseDocTab print styles are exempt (print resets need absolute values).

---

**Finding 3 — localStorage key prefix compliance** ✅  
All `STORAGE_KEY`, `REVEALS_KEY`, and `LS_KEY` constants resolve to `msl_`-prefixed strings. HomeTab iterates all keys for the debug snapshot — intentional, not a violation.

---

**Finding 4 — Missing `onNavigate` prop in export signatures** ⚠️ OPEN  
26 tabs do not destructure `onNavigate` in their default export. This means cross-tab navigation calls from those tabs will silently fail if ever added. Non-breaking now, but violates the contract in CLAUDE.md rule #5.

Affected files (26): `AirflowTab`, `CaseStudiesTab`, `CausalInferenceTab`, `ClassicalMLTab`, `CodeBugsTab`, `CombinatorTab`, `DLFineTuningTab`, `DLServingTab`, `DataModelingTab`, `DataScienceTab`, `DeepLearningTab`, `FeatureEngTab`, `InterviewPrepTab`, `MLOpsDeployTab`, `MLOpsPipelinesTab`, `ModelEvalTab`, `ModelsMathTab`, `MonitoringTab`, `PipelineBlogTab`, `SparkLabTab`, `StaffLayerTab`, `SystemDesignTab`, `TakeHomeTab`, `TimeSeriesTab`, `TrainerTab`, `dbtTab`

Action: Add `{ onNavigate }` to each export signature in the next housekeeping pass. Low-risk one-liner change per file.

---

**Finding 5 — Array index used as React `key` prop** ⚠️ OPEN  
56 instances of `key={idx}`, `key={index}`, or `key={i}` across 10+ files. Using array index as key causes unnecessary re-renders and broken state when lists reorder or filter.

Most-affected files: `TimeSeriesTab`, `MonitoringTab`, `SparkLabTab`, `DLFineTuningTab`, `FeatureEngTab`, `dbtTab`, `MLOpsDeployTab`, `CaseStudiesTab`, `TrainerTab`, `DefenseDocTab`.

Action: Replace with stable content-derived keys (e.g., `key={item.id}`, `key={q.id}`, `key={scenario.title}`) wherever the list is filtered or reordered. Pure static render-once lists are lower priority.

---

**Finding 6 — No `console.error` / `console.warn` calls in any tab** ✅  
Clean. No debug noise left in production code.
