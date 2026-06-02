# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. Gradient posts — add 5 high-impact posts (2 hours)
Add posts to `src/tabs/GradientTab.jsx` in priority order from IDEAS.md:
- **"Feature Store Time-Travel Bug"** → link to FeatureEngTab. Scenario: you rebuild a feature store, suddenly model AUC is 3 points lower, and features for tomorrow are already computed. Root cause: computed features are using tomorrow's data (off-by-one). Checkpoint: why does this break silently in production? (Data leakage at scale, difficult to detect because metrics look plausible during batch window.)
- **"Validation Set Leakage"** → link to FeatureEngTab. Scenario: train/val split looks clean, but validation set distribution leaks tomorrow's data (temporal leakage). Why your backtest AUC (0.91) ≠ production AUC (0.68).
- **"Forecast Failure Zoo"** → link to TimeSeriesTab. Scenario: 6 failure modes of time-series models (seasonality shift, nonstationarity, trend change, forecast stale beyond T+7, auto-correlation ignored, exogenous variable dependency). Each with a production signal.
- **"Two Failure Modes of A/B Tests"** → cross-link to StaffLayerTab/CombinatorTab. SRM (Sample Ratio Mismatch) and novelty effect as the two most common reasons valid A/B tests give misleading results.
- **"Quantization from First Principles"** → link to DLServingTab. What FP16 throws away vs FP32, when it matters (inference on edge), and when it doesn't (large batch serving).

Each post should: describe the scenario, explain the production consequence, link to the practice tab at the end. ~15-20 min per post. No YouTube IDs required yet.

### 2. LandscapeTab — add country/region filter (1.5 hours)
Extend `LandscapeTab.jsx` to add a region filter (India/UK/US/EU/Global). Store selection in localStorage as `msl_landscape_region` (default: 'Global'). Tabs already exist (Roles, Salaries, Stack, Companies, Timeline, Market) — add a compact filter row above them showing buttons: India | UK | US | EU | Global. When a region is selected, show region-specific data (e.g., salary ranges for India are 2–4x lower than US; role distribution differs; companies differ). Modify the Salaries tab first (easiest to implement filtering), then add region-aware context to Company Explorer. ~1.5 hours implementation + 30 min data cleanup (add `region` field to company/salary data objects if they don't have it).

### 3. HomeTab — domain completion bars (1 hour)
Add a new section above the "All tracks" grid showing compact completion bars for each domain. For each domain (Feature Engineering, Model Evaluation, Classical ML, Deep Learning, etc.), display: domain name | X/Y scenarios completed | thin progress bar. Data already exists in localStorage (read `msl_score:*` keys, compute as `completed / totalScenarios`). Renders a 3–4 row grid of domain cards. Cards show domain name (left), "X/Y" count (center-right), and a slim progress bar (right). Clicking a card navigates to that domain. ~1 hour for rendering + localStorage logic.

### 4. Interview Experiences v2 — seed data + frequency chart (1 hour)
Prepare for the Interview Experiences feature. Create `src/data/interviewExperiences.js` with a hardcoded array of 15+ sample interview experience records. Schema: `{ name, company, role, yearsExp, round, date, tags: ['ml_fundamentals', 'system_design', 'deep_learning', ...], prep_source, result }`. Add a placeholder component in HomeTab or InterviewGrid that shows a frequency bar chart of tags (e.g., "system_design was covered 12/15 times, ml_fundamentals 14/15"). Chart uses Chart.js. This is a pre-req for the real Tally form integration (when N≥15 real submissions arrive, admin will add them to the data file and this chart auto-updates).

### 5. Difficulty tagging — free modules subset (1.5 hours)
Start tagging scenarios by difficulty (easy/junior/mid/senior/staff). Focus on the 4 free modules that will gate freemium v2: ModelsMathTab, FeatureEngTab, ModelEvalTab, ClassicalMLTab. Add a `difficulty` field to each scenario object (easy/junior/mid/senior/staff). For v1, tag just these 4 modules (roughly 100 scenarios total). Don't implement the gate yet — just the metadata. Plan: 25–30 min per module (reading scenarios + assigning difficulty). Output: all scenarios in 4 modules have a `difficulty` field. Store in each tab's MODULES or individual scenario definitions. This unblocks freemium gate v2 in a later session.

---

## Pending from Avinash's side

- **Formspree ID** — sign up at formspree.io, replace `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx` line 5.
- **Tally form ID** — create form at tally.so, replace `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid.

---

## Blocked

Nothing currently blocked.

---

## Done this session (v4.42 → v4.44)

- ~~Loan Default Phase 1 — schema + EDA + proxy audit (4/5ths) + cpL1 ECOA judgment.~~
- ~~Loan Default Phase 2 — split + model training + eval/threshold + cpL2 ECOA threshold check.~~
- ~~Loan Default Phase 3 — PSI + KS + prediction drift + denial rate shift + cpL3 alert-or-wait.~~
- ~~Loan Default Phase 4 — deployment scaffold + regulatory model card (7 ECOA fields) — lab complete.~~
- ~~Fraud Detection Phase 1 — schema + EDA + precision@K comparison + cpF1 metric selection judgment.~~
- ~~SystemDesign RAG audit — rag1–rag6 removed (GAL), RetrievalFailures kept (MSL).~~
- ~~Two new Gradient posts — Feature Store Time-Travel Bug + Validation Set Leakage.~~
- ~~HomeTab domain bars + changelog June 2026 entry + testimonials section.~~
- ~~AUDITS #024, CLAUDE.md file structure + session model, METRICS.md keys updated, IDEAS/LINEAGE/DECISIONS staleness fixed.~~

---

## What comes after (not for this session)

- **Difficulty + industry filter** — tag 200+ scenarios; content work prerequisite.
- **Freemium gate v2** — per-scenario `isFree` flags.
- **Interview Experiences v2** — frequency chart (after N≥15 Tally submissions).
- **LandscapeTab country filter** — India/UK/US/EU region field.
- **Simplify toggle for Gradient posts** — build trigger: ≥10 complete posts.
