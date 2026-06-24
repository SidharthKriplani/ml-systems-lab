# COMPONENT_RUBRICS.md — Component-Level Existence + Quality Standard

The tier **above** `CONTENT_QUALITY_BAR.md`.

`CONTENT_QUALITY_BAR.md` governs **items** — a single scenario, MCQ, or post. This file governs **components** — a whole tab, shared component, or subsystem. The two questions it answers:

1. **Should this component exist at all?** → Rubric A (Existence Gate)
2. **Is this component any good?** → Rubric B (Quality Rubric)

**Unit of evaluation = one distinct functional unit.** Gradient is *one* component; its ~140 posts are repeated items, not components. Project Lab is *one* component; Telco / Loans / Fraud are three dataset *instances*, not three components. If a thing repeats the same structure with different data, it is an item, not a component — governed by `CONTENT_QUALITY_BAR.md`, not this file.

---

## RUBRIC A — The Existence Gate

Run **before building any new component**, and against the existing inventory in any audit. Four axes, each **0–3**. **The gate is the per-axis floor, not the sum** — a high total cannot rescue a 0 on any single axis.

### Axis 1 — Name overlap
| Score | Meaning |
|---|---|
| 0 | An identically-named component already exists. |
| 1 | Strong synonym / same head-noun exists ("Search" when `ContentMap` already searches). |
| 2 | Partial / qualifier overlap only ("DL Serving" vs "DL Training"). |
| 3 | No name collision anywhere in the inventory. |

### Axis 2 — Content overlap
| Score | Meaning |
|---|---|
| 0 | Same content, repackaged. A skin over what exists. |
| 1 | More than half the content already exists in another component. |
| 2 | Some shared content, but the majority is net-new. |
| 3 | Net-new content that exists nowhere else. |

### Axis 3 — Adjacency (the almost-overlap)
| Score | Meaning |
|---|---|
| 0 | It is an **instance** of an existing component (another post, another dataset, another MCQ). Not a component. |
| 1 | An existing component could **absorb** this as a mode, tab, section, or filter. |
| 2 | Adjacent, but a clean separate unit is genuinely justified. |
| 3 | Stands fully alone; nothing adjacent. |

### Axis 4 — Merit
| Score | Meaning |
|---|---|
| 0 | No clear job-to-be-done. Nothing it does matters for the goal. |
| 1 | Marginal. A nice-to-have no one would miss. |
| 2 | Clear job, but **below the depth threshold** (< 12 items) — a preview, not a feature. |
| 3 | Clear, distinct job; meets/exceeds ≥12 items; tests judgment, not recall. |

### Decision matrix — read the **lowest axis first**
| Trigger | Verdict | Action |
|---|---|---|
| Name = 0 **or** Content = 0 | **DUPLICATE** | Don't build. Merge into the existing component, or reject. |
| Adjacency = 0 | **INSTANCE** | Not a component. Add as an item to the existing component. |
| Merit = 0 | **REJECT** | No job. Kill it. |
| Adjacency = 1 (no 0 above) | **EXTEND** | Build as a mode/section/filter inside the adjacent component. |
| Merit = 2 (no 0/1 above) | **BUILD AS PREVIEW** | Allowed, unmarketed + unlinked until it crosses the depth threshold. |
| All axes ≥ 2, none triggering above | **BUILD** | Ship as a new component. |

The **sum (0–12)** is a summary only. Never let it override a floor trigger.

---

## RUBRIC B — The Component Quality Rubric

Eight dimensions, each **0–3**: **0 Absent · 1 Below bar · 2 At bar · 3 Exemplary**.

| # | Dimension | At bar (2) means | 0 looks like |
|---|---|---|---|
| 1 | **Purpose clarity** | One-sentence job, visible at entry (a `HowToStrip`). | No framing; user guesses the tab's purpose. |
| 2 | **Interaction standard** | Configure → Logic → Outcome → Diagnosis, OR honestly a reference living in KNOW (not DO/JUDGE). | Reference table dressed as an interactive in a JUDGE/DO frame. |
| 3 | **Item quality & depth** | Items pass the 4 content checks; count ≥ 12 or labeled a preview. | Items fail the bar, or < 12 presented as a finished feature. |
| 4 | **Statefulness & loop-closure** | Progress persists (`msl_*` key); forward pointers close read→practice; deep-linkable. | No persistence, no links out, dead-ends. |
| 5 | **Wiring & reachability** | In `ALL_TABS`, in a nav frame, findable in Cmd+K / `ContentMap`, deep-linkable. | **Orphan** — not in `ALL_TABS` or unreachable. |
| 6 | **Accessibility & responsive** | `aria-current`/`aria-expanded`; works on mobile; keyboard-navigable. | Desktop-only, no aria, breaks < 640px. |
| 7 | **Code health** | Brace diff 0; no hardcoded colors beyond logged debt; passes apostrophe + backtick + schema audits; no dead `.bak`/shim sibling. | Build-breaking strings, `.bak`/`.tmp` siblings, hardcoded palette. |
| 8 | **Distribution-readiness** | If public: OG/meta present, prerendered/indexable, UTM-safe. | Public surface invisible to crawlers / no OG card. |

### Component grade
| Grade | Condition |
|---|---|
| **Keep / Ship** | ≥ 2 on every dimension, no 0. |
| **Fix before marketing** | Any 1s, but no 0. Usable, not promotable. |
| **Repair or retire** | Any 0. Bring to bar or archive (`_legacy/`, never `rm` — D-18). |

---

# APPLIED AUDIT — full component sweep (2026-06-24)

Method: `App.jsx` four-frame nav + `ALL_TABS` registry + orphan scan + per-file item counts (`staffFraming`/`whatsTested`/`reveal`/`question`/`correct` markers) + cross-tab topic fingerprinting + import-graph trace of the question pools. Grounded in source, not nav labels. Complements `docs/FOUR-FRAME-AUDIT.md` (strategic ladder) with the component-redundancy layer it does not cover.

## Inventory (functional units, not items)

**KNOW** gradient · cheatsheet · interview(Q&A) · trainer · models(Math) · landscape
**DO** mlcoding · spark · dbt · `ext_python`→PL ↗ · `ext_sql`→PAL ↗ *(link-outs)*
**BUILD** **Project Lab** *(instances: Telco/Loans/Fraud)* · defense
**JUDGE/Scenarios** features · eval · classical · causal · ts · design · dl · dl_finetune · dl_serving · monitor · mlops_deploy · mlops_pipes · airflow · modeling
**JUDGE/Adversarial** spottheflaw · incidentroom · codebugs · casestudies · stafflayer
**PREP & ASSESS** combinator · mock_interview · takehome · verbal(SAY)
**Utility** home · profile · plans · resources
**Shared** AccessGate · BrandMark · ContentMap · FeedbackChip · FidelityBadge · GlobalSearch · GradientVisuals · HowToStrip · Icon · Icons · LoadingSpinner · Next30Card · PythonCell · QuizCard · auth/AuthModal
**Subsystems** StudyRoom (`Shift+Ctrl+K`) + `sr.js`

## Depth reality (grounded item counts)

| Band | Components | Note |
|---|---|---|
| **Deep (≥20)** | gradient (~140), interview (135), combinator (139), trainer (59), DeepLearning (~37), spottheflaw/codebugs (24/26), incidentroom (24), MLOpsDeploy (21) | Real features — but combinator/trainer overlap heavily (R1). |
| **At bar (12–19)** | classical (15), featureeng (18), modeleval (18), monitoring (17), systemdesign (13), spark (13), timeseries (23), dbt (8→verify) | OK or borderline. |
| **Below threshold (≤ 11)** | **DataModeling 11, dbt 11, DLServing 10, CaseStudies 5** *(see R7 for accurate counts — earlier proxy numbers here were wrong)* | Periphery (Data Eng + DL Serving), not core. |
| **Notebooks (different paradigm)** | projectlab, loan_default, fraud_detection | Pyodide; depth = checkpoints, not item count. |
| **Orphans (unwired, real content)** | **DataScienceTab (~8 scenarios, 1063 lines), AskTab (945-line KB)** | Not in `ALL_TABS`. |

## REDUNDANCY FINDINGS (the build-waste sources)

### R1 — Question-bank fragmentation *(headline; High; FIX-READY — literal duplication confirmed)*
Four MCQ/Q&A pools, each inline in its own file, **no shared source of truth**:
`quizData.js` (374, imported only by Gradient Quiz Me) · `TrainerTab` (59 inline) · `CombinatorTab` (139 inline) · `InterviewPrepTab` (135 inline).

**Item-level dedup probe (token-Jaccard, 2026-06-24) — not just topic overlap, actual copies:**
- **`CombinatorTab` is a near-superset of `TrainerTab`** — ~23 of Trainer's 59 questions appear **verbatim** (Jaccard = 1.00) inside Combinator; ≥1 (MLE) copied verbatim from `quizData`. **33 cross-pool near-dup pairs**, almost all exact. Combinator did not build a bank — it copy-pasted Trainer's.
- **`InterviewPrepTab` (135) is genuinely distinct** — zero near-dups with the others; it is behavioural ("tell me about a time"). Keep it separate (or tag `format:behavioural`).
- Internal dupes: ~0 within each pool (Combinator 1).

**Fix (now actionable):** one tagged technical bank as source of truth (`{id, topic, format, difficulty, gated}`) merging quizData + Trainer + Combinator with the 23+ verbatim copies collapsed to one; Trainer/Combinator/Gradient-Quiz become **filtered views** over it. Interview behavioural pool stays its own surface. This is the highest-leverage anti-waste move in the lab, and the duplication is now proven, so the merge can start.

### R2 — Concept scatter / no ownership map *(High)*
Concepts bleed across components with no canonical home:
- **Calibration** — modeleval(44) · DataScience-orphan(34) · classical(9) · systemdesign(8) · dl_serving(6) · monitoring(4) · deeplearning(4) + all 4 question pools. ~10 surfaces.
- **Drift/PSI** — monitoring(180, the home) but **systemdesign(42)** + 6 others bleed in.
- **SystemDesign is a topic-sponge** — drift(42)+leak(9)+skew(12)+imbal(9)+calib(8); it re-covers what the specialised tabs own.
**Fix:** a concept→owner map (one canonical teaching home per concept; everyone else cross-links, never re-teaches). Starter map below.

### R3 — Scenario-schema fragmentation *(Medium-High)*
At least **four incompatible scenario schemas** coexist, so the documented quality bar can't be enforced app-wide:
1. `whatsTested`+`staffFraming`+`antiPattern` — only **5 tabs** (classical, incidentroom, combinator, interview, trainer). This is the schema `CONTENT_QUALITY_BAR.md` requires.
2. `reveal`+`fix` — featureeng, modeleval, monitoring, spark, codebugs, spottheflaw, timeseries, deeplearning… (~12 tabs).
3. `question`+`options`+`correct`+`diagnosis` — deeplearning, mlops_deploy, dl_finetune.
4. Pyodide notebook — projectlab/loan/fraud.
**Consequence:** the quality bar (whatsTested/staffFraming mandatory) is **structurally unenforceable on ~15 tabs** — they don't have the fields. Either the bar is silently violated app-wide, or it needs a documented field-mapping across schemas.
**Fix:** pick one canonical scenario schema (or publish a field-map) so the item bar applies everywhere.

### R4 — Orphans with real content *(Medium)*
`DataScienceTab` (1063 lines, ~8 scenarios, **34 calibration hits — overlaps modeleval's territory**) and `AskTab` (945-line knowledge base) are **not in `ALL_TABS`** — unreachable. Either is wasted build sitting dark.
**Fix:** decide merit. If wired, **dedup DataScience against modeleval/causal first** (Existence Gate Content axis). If not, archive → `_legacy/`.

### R5 — Dead duplicates + cruft *(Low, fast wins — ✅ batch 1 done 2026-06-24)*
**Archived → `_legacy/`:** `GlobalSearch.jsx` (superseded by `ContentMap`; dead App.jsx import also removed) · `JDPrepTab.jsx` (dead fallback, merged into Defense) · `DataScienceTab.jsx` + `AskTab.jsx` (unreachable orphans, per R4). Verified zero live refs; App.jsx brace diff 0.
**Kept:** `Icons.jsx` — not dead, it's a live compatibility shim (20 lines delegating to `Icon.jsx`) with **11 importers**. Full retirement = rewrite 11 files' JSX usages — a real refactor, not freeze-safe hygiene. Deferred as low-priority mechanical follow-up.
**Pending manual `rm` (sandbox perm block):** `TimeSeriesTab.jsx.bak` + `test_write.tmp`.

### R6 — Project Lab instance-vs-component *(resolved; reference case)*
Telco/Loans/Fraud trip Adjacency=0 → **INSTANCE**, not three components. Counted as **one** Project Lab component. This is the canonical worked example of the rule.

### R7 — Depth non-uniformity *(Medium; depth, not redundancy — ACCURATE COUNT 2026-06-24)*

**⚠️ Correction:** the first R7 pass used a single-array proxy and was WRONG — it reported FeatureEng ~6, Monitoring ~6, ModelEval ~6 as "thin flagships." Accurate counting (parsing every content array per tab, separating interactive **modules** from **scenario-items**, excluding diagram/config aux) shows those are healthy. Withdrawn.

Accurate depth of the 22 scenario/practice tabs (M = interactive modules, S = scenario-items, T = total):

| Band | Tabs (T) |
|---|---|
| **Deep (≥40)** | SystemDesign 57 (9M/48S) · CausalInference 50 (9/41) · DeepLearning 44 (7/37) |
| **Healthy (17–37)** | TimeSeries 37 · FeatureEng 32 · StaffLayer 30 · MLOpsDeploy 29 · ModelEval 27 · CodeBugs 26 · MLOpsPipelines 25 · ClassicalML 24 · Monitoring 23 · SparkLab 19 · Airflow 18 · DLFineTuning 17 |
| **At threshold (12–15)** | MLCoding 15 · SpotTheFlaw 12 · IncidentRoom 12 |
| **Below bar (≤11)** | DataModeling 11 · dbt 11 · **DLServing 10** · CaseStudies 5 *(by design — multi-part cases)* |

**Non-uniformity verdict:** real but moderate, and **concentrated in the periphery, not the core.** Spread is ~5× (DLServing 10 → SystemDesign 57); median ≈ 24. The thin cluster is **Data Engineering (DataModeling, dbt) + DL Serving** — the edges. The core ML-judgment tabs (Feature/Eval/Classical/Causal/DL/Monitoring/SystemDesign) are all 23–57. The earlier "broad-but-shallow" alarm was the artifact, not the reality.
**Fix (freeze-gated content):** if leveling depth, targets are **DataModeling, dbt, DLServing** (→ ≥12). Core tabs need nothing. CaseStudies' 5 is fine (each case is a long multi-part timeline).

### R8 — Dead data files *(Low; extends R5)*
`testimonials.js` (0 importers — HomeTab stopped rendering it, confirmed dead) → archive. `interviewExperiences.js` (0 importers — staged, blocked on Formspree/Tally per NEXT.md) → **PARK, not archive** (has a planned wiring). Minor: two quiz renderers coexist (`QuizCard` component vs GradientTab's inline `QuizMeSection`) — cosmetic inconsistency, not redundancy.

## FULL-SWEEP REDUNDANCY MAP — where the redundancy actually is

The decisive output of the complete audit. Where is duplicated build hiding?

| Surface | Method | Verdict |
|---|---|---|
| **Question banks** (quizData/Trainer/Combinator/Interview) | item-level token-Jaccard | **REDUNDANT** — 33 verbatim cross-pool pairs; Combinator ⊃ Trainer. The one real duplication. |
| **~20 JUDGE scenario tabs** | title + body cross-tab Jaccard (all pairs) | **NOT redundant** — ~0 title overlap (1 trivial), **0 body overlap**. Distinct scenarios. Volume ≠ duplication. |
| **Shared components** (15) | importer scan | **NOT redundant** — one spinner, all used; only the dead `GlobalSearch` (already archived). |
| **Data files** (7) | importer scan | 2 dead (`testimonials`, `interviewExperiences`); rest single-source, fine. |

**One-line conclusion:** the only true redundancy in the live app is the **question-bank duplication (R1)**. Everything else is either distinct (scenarios, components), thin (R7 depth), or dead (R5/R8) — not duplicated. So the anti-waste fix is narrow and known: consolidate the banks.

## Existence-Gate cluster verdicts

| Cluster | N/C/Adj/Merit | Verdict | Action |
|---|---|---|---|
| GlobalSearch vs ContentMap | 1/0/1/0 | DUPLICATE | Archive GlobalSearch. |
| Icons vs Icon | 1/0/1/1 | DUPLICATE | Finish shim retirement. |
| JDPrep | 0/0/0/0 | DEAD | Archive. |
| Project Lab ×3 | –/–/0/3 | INSTANCE | One component, 3 datasets. |
| defense vs mock_interview | 2/1/2/3 | EXTEND-watch | Keep both; unify the duplicated JD-paste front-end. |
| resources-prompt vs mock_interview-prompt | 2/1/2/2 | ADJACENT | Cross-link; don't merge. |
| 4 question pools (R1) | 2/1/1/3 | EXTEND | Consolidate to one tagged bank; tabs = views. |
| DataScience / AskTab orphans | –/?/?/? | DECIDE | Wire (after dedup) or archive. |
| DL trio (dl/finetune/serving) | 2/3/2/2 | KEEP, verify depth | finetune+serving below threshold → preview-label or build up. |

## Quality-rubric sample (dims: 1 Purpose·2 Interaction·3 Depth·4 State·5 Wiring·6 A11y·7 Code·8 Distribution)

| Component | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | Grade |
|---|---|---|---|---|---|---|---|---|---|
| gradient | 3 | 2 | 3 | 3 | 3 | 2 | 2 | 3 | **Keep** |
| featureeng | 3 | 3 | 2 | 2 | 3 | 2 | 2 | 1 | **Keep** |
| Project Lab | 3 | 3 | 3 | 2 | 3 | 2 | 2 | 1 | **Keep** |
| dl_finetune | 2 | 2 | **1** | 1 | 3 | 2 | 2 | 1 | **Fix before marketing** |
| modeling | 2 | 2 | **1** | 1 | 3 | 2 | 2 | 1 | **Fix before marketing** |
| DataScienceTab | 2 | 2 | 2 | 1 | **0** | 2 | 2 | 0 | **Repair or retire** |
| GlobalSearch | 1 | **0** | **0** | 0 | **0** | 1 | 2 | 0 | **Repair or retire** |

## Concept → canonical owner (starter map; enforces R2)

| Concept | Canonical owner | Cross-link only (don't re-teach) |
|---|---|---|
| Calibration | Model Evaluation | classical, dl_serving, monitoring, gradient |
| Drift / PSI | Monitoring | systemdesign, mlops_deploy, featureeng |
| Leakage | Feature Engineering | timeseries (temporal), systemdesign |
| Class imbalance / SMOTE | Model Evaluation (+ Fraud notebook) | classical, datascience |
| Train–serve skew | Feature Engineering | systemdesign, spark (data-skew is a different sense) |
| Behavioural / "tell me about a time" | Interview Q&A | — (keep out of the technical pools) |

## ORGANIZATIONAL GAPS (current app only — not future builds)

Scoped to what exists today, these are missing *structures*, not missing content:
**no question-bank source of truth** (R1) · **no concept→owner map** (R2) · **no canonical scenario schema** (R3) · **two orphans unreachable** (R4). Drift/calibration are over-supplied and under-organized, not absent. *(Strategic content gaps — fluency/ownership rungs — live in `FOUR-FRAME-AUDIT.md`; out of scope here.)*

## FIX-READINESS (can we start?)

| Finding | Verified to | Safe to fix now? |
|---|---|---|
| R1 question banks | **Item-level** — verbatim dupes proven (Combinator⊃Trainer) | **✅ DONE (batch 3)** — `questionBank.js` SoT; 31 dupes collapsed; verified 0 cross-file dup. |
| R5 dead dups + cruft | File-level — confirmed unwired/superseded | **✅ Done (batch 1)** — 4 archived; Icons shim kept; cruft pending manual rm. |
| R6 Project Lab | Resolved (instance rule) | **Yes** — copy/labeling only. |
| Depth previews (dl_finetune, modeling, dl_serving) | Count-level — below 12 | **Yes** — preview-label is a copy fix. |
| R2 concept map | Topic fingerprint — owners identifiable | **Yes** — write as a `DECISIONS.md` rule. |
| R3 scenario schema | Structure-level — 4 schemas confirmed | **Yes** — pick canonical / publish field-map. |
| R4 orphans (DataScience, Ask) | File-level — confirmed **unreachable** (not in `ALL_TABS`) | **Yes (archive)** — not in the live app, so out of current-app scope. Archive as hygiene with R5. *Wiring* one in later is a future build that would need an item-dedup pass first — separate effort. |

**Bottom line:** thorough enough to start executing on the entire live app. R4's orphans aren't part of the live app — archive them alongside R5; the only thing needing a further pass is *wiring* them, which is a future build, not this redundancy fix.

### Audit completeness (full sweep done 2026-06-24)
Closed all earlier blind spots: cross-tab scenario overlap (all 22 JUDGE/adversarial tabs, title + body) → **0 real duplication**; shared components (15) → clean; data files (7) → 2 dead found. The redundancy map above is now **complete for the live app**.
Residual honest unknowns (do not block fixing): (1) exact per-tab item counts are ±a few due to ~4 schemas — the R7 thin-list is triangulated, not hand-counted; (2) overlap is lexical (Jaccard), so a *semantically* identical scenario with totally different wording could evade detection — but body-Jaccard = 0 across all pairs makes that very unlikely. Neither changes the conclusion: real redundancy = question banks only.

## Prioritized action list (stop the waste)

1. **R1 — consolidate the 4 question pools into one tagged bank.** Biggest anti-waste win. Tabs become filtered views. *(build, gated by content-freeze)*
2. **R3 — publish one canonical scenario schema + field-map.** Makes the item quality bar enforceable on the ~15 tabs it currently can't touch. *(doc, do now)*
3. **R2 — adopt the concept→owner map** as a `DECISIONS.md` rule; new content checks it before choosing a home. *(doc, do now)*
4. **R4 — decide the two orphans** (wire-after-dedup or archive). *(decision)*
5. **R5 — archive dead dups + delete cruft.** 30-min hygiene. *(do now, freeze-safe)*
6. **DL trio + modeling — preview-label** until ≥12 items. *(copy fix)*

---

## How to use this file
- **Proposing a component?** Score Rubric A. DUPLICATE/INSTANCE/EXTEND/REJECT = answer without writing code.
- **Auditing?** Re-run the sweep above; the R-findings are the 2026-06-24 baseline.
- **Shipping?** Must reach **Keep/Ship** on Rubric B **and** its items must pass `CONTENT_QUALITY_BAR.md`. Both gates apply.

Cross-lab note: the Existence Gate + concept-owner pattern are generic; flag for `HQ/` once validated here.

---
*Created 2026-06-24. Extends `CONTENT_QUALITY_BAR.md` (item tier) to the component tier. Full findings logged as AUDITS.md #033. Baseline: 40 wired tabs + 15 shared components + StudyRoom; 4 fragmented question pools, ~4 scenario schemas, 2 orphans, 3 dead dups, 2 cruft files.*
