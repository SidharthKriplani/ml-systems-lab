# METRICS.md — Analytics & Storage Taxonomy

Single source of truth for what is tracked, what each localStorage key means, and what the intended event schema is.  
Keep this in sync whenever new events are added or new keys introduced.

---

## Product metrics (from PM audit, 2026-06-03)

These are the 12 product-level metrics MSL should track. They are distinct from the PostHog event taxonomy below — those are implementation signals. These are the outcomes that determine whether the product is working.

| Metric | Type | Definition | Why it matters |
|--------|------|------------|----------------|
| First-scenario completion rate | Activation | % of new users who complete at least one full scenario reveal (sees all three-tier callouts) within first session | Primary activation signal — did the user get the core product experience? |
| Combinator attempt rate | Activation | % of users who start a Combinator timed exam within first 3 sessions | Measures whether users reach the flagship interview simulation |
| 7-day return rate | Retention | % of users who return within 7 days of first visit | Core retention signal for a habit-forming study tool |
| Session depth | Depth | Mean number of scenario reveals per session | Are users consuming content or just browsing? |
| Streak length distribution | Habit | % of users with 3+ day streaks; % with 7+ day streaks | Habit loop signal — daily use is the goal |
| Wrong-answer rate by scenario | Content quality | % of users who select the wrong answer on first attempt per scenario | High = good discrimination (scenario is doing its job); low = too easy, question needs stronger distractors |
| Access gate conversion | Gating | % of users who hit an AccessGate and successfully enter a code within the same session | Measures friction and intent at the paywall — also flags if the code has leaked publicly |
| Guided path completion | Engagement | % of users who complete all steps in any Guided Path | Measures whether the structured learning paths create follow-through |
| Weak-area return rate | Depth | % of users who return to their lowest-scoring section within 7 days of completing it | Measures whether the product creates targeted self-improvement behavior |
| Section coverage breadth | Depth | Mean number of distinct sections accessed per user within first 14 days | Do users explore beyond the entry point or get stuck in one area? |
| Project Lab phase completion | Quality | % of Project Lab users (any dataset) who complete all phases | Project Labs are the most differentiated feature — do users finish them? |
| antiPattern selection rate | Content quality | % of users who select the canonical wrong answer per MCQ question | High = distractor is well-calibrated; low = too obvious, reduces judgment signal |

**Implementation note:** Most of these require PostHog event coverage beyond what is currently tracked. See "Known gaps" section below. Priority order for instrumentation: first-scenario completion → Combinator attempt → 7-day return (PostHog cohort) → access gate conversion.

---

## PostHog event taxonomy

All events are fired via `track()` in `src/analytics.js`. Events only fire when `VITE_POSTHOG_KEY` is set — the app runs identically without it.

| Event | Fired from | Properties | What it measures |
|-------|-----------|------------|-----------------|
| `tab_switch` | `App.jsx` — every zone/tab change | `tab: string` | Navigation patterns, most-visited tabs |
| `module_start` | `SparkLabTab.jsx` — on first interaction | `module, tab` | Engagement start signal |
| `module_complete` | `SparkLabTab.jsx`, `TrainerTab.jsx`, `CombinatorTab.jsx`, `StaffLayerTab.jsx` | `module, tab, score` | Completion rate, score distribution |

### `module_complete` score conventions

| Tab | Module value | Score meaning |
|-----|-------------|---------------|
| `SparkLabTab` | `'Shuffle Hell'` | `100` on healthy result |
| `TrainerTab` | `'trainer_session'` | `0–100` percentage correct |
| `CombinatorTab` | `'combinator_session'` | `0–100` percentage MCQ correct |
| `StaffLayerTab` | `'staff_scenario'` | scenario `id` string (e.g. `'s1'`) passed as score |

### Known gaps (not yet tracked)

| Action | Tab(s) | Priority |
|--------|--------|----------|
| Score submissions / reveals | All MCQ tabs | High |
| Verbatim practice session start/end | `VerbatimTab` | Medium |
| Interview Q&A question viewed | `InterviewPrepTab` | Medium |
| Gradient post opened | `GradientTab` | Medium |
| Defense Plan: JD paste + analysis run | `DefenseDocTab` (Defense Plan screen 1) | Low |
| Defense Plan: plan generated | `DefenseDocTab` (Defense Plan screen 3) | Low |
| Access code unlocked | `AccessGate` / `DefenseDocTab` inline gate | Medium |

---

## PostHog configuration

```js
posthog.init(key, {
  capture_pageview: true,   // auto-captures route changes
  autocapture: false,        // disabled — no implicit click/input capture (PII risk)
  persistence: 'localStorage',
})
```

**`autocapture: false` is non-negotiable.** Tabs with free-text inputs (VerbatimTab, CodeBugsTab, AskTab, TakeHomeTab) would expose user-entered content if autocapture were enabled.

---

## localStorage key taxonomy

All keys are `msl_`-prefixed per CLAUDE.md rule #2.

| Key | Type | Set by | Purpose |
|-----|------|--------|---------|
| `msl_score:{tabPrefix}` | `number` \| `JSON` | Per-tab score logic | Cumulative score for each practice tab. `tabPrefix` examples: `spark`, `ts`, `classical`, `spark_broadcast`, `spark_oom`, `deeplearn_optimizer`, `deeplearn_regularize`, `deeplearn_transformer`, `dl_arch`, `causal_uplift`, `causal_obs_exp`, `causal_exp`, `classical_boundary` (JSON `{completed:true, ts}`). All keys use `msl_score:` prefix. |
| `msl_trainer_history` | `JSON array` | `TrainerTab` | Last 50 MCQ session records: `{ date, score, total, domainBreakdown }`. `domainBreakdown` schema: `{ [domainLabel: string]: { correct: number, total: number } }`. Domain labels match TrainerTab categories (e.g. `'Feature Engineering'`, `'Model Evaluation'`, `'Spark / Data Engineering'`). Used by GradientTab Revise mode v2 to identify weak domains. |
| `msl_combinator_session` | `JSON` | `CombinatorTab` | Active in-progress session state: `{ screen, duration, questionIds, currentIdx, userAnswers, timeLeft, timePerQuestion, selfRatings, savedAt }`. `savedAt` is a Unix timestamp — elapsed time is subtracted on restore to correct timer drift across zone switches. Cleared on session end. |
| `msl_combinator_history` | `JSON array` | `CombinatorTab` | Last 50 timed session records: `{ date, duration, score, total, domainBreakdown }`. `domainBreakdown` same schema as `msl_trainer_history` — `{ [domainLabel]: { correct, total } }`. Also consumed by GradientTab Revise mode v2. |
| `msl_verbal_history` | `JSON array` | `VerbatimTab` | Practice session history |
| `msl_staff_reveals` | `JSON object` | `StaffLayerTab` | Map of `{ scenarioId: revealLevel }` — persists reveal state across sessions |
| `msl_defense_progress` | `JSON` | `DefenseDocTab` | Defense doc generation state |
| `msl_takehome` | `JSON` | `TakeHomeTab` | Take-home exercise state |
| `msl_jdprep_last` | `string` | `JDPrepTab` (retired) | Last pasted JD text — **deprecated** (JDPrepTab retired in v4.10, merged into Defense Plan). Safe to drop from localStorage; `msl_defense_progress` holds all Defense Plan state. |
| `msl_read` | `JSON` | `GradientTab` | Set of post IDs marked as read |
| `msl_role` | `string` | `HomeTab` | Selected role for personalization |
| `msl_tab` | `string` | `App.jsx` | Last active tab — used for restore on reload |
| `msl_goto_module` | `string` | Navigation helpers | Deep-link target module, cleared after use |
| ~~`msl_goto_path`~~ | `string` | ~~Navigation helpers~~ | **Retired v4.15** — Learning Paths removed. Key is dead; do not reuse. |
| ~~`msl_path_progress`~~ | `JSON object` | ~~`HomeTab`~~ | **Retired v4.15** — Learning Paths removed. Key is dead; do not reuse. |
| `msl_access` | `string` | `AccessGate` / `App.jsx` | Access code entered by user. Value `'DAI2026'` = premium unlocked. Permanent — never expires. Set on code entry, checked on every app load via `useState` initializer. |
| `msl_streak` | `number` (as string) | `HomeTab` | Consecutive-day visit streak. Incremented when `msl_last_visit` was yesterday; reset to `1` when gap > 1 day; unchanged when already visited today. |
| `msl_last_visit` | `string` (ISO date) | `HomeTab` | Date of the most recent HomeTab mount in `YYYY-MM-DD` format. Used to compute streak continuity. |
| `msl_activity_YYYY-MM-DD` | `string ('1')` | `HomeTab`, `FeatureEngTab`, `ClassicalMLTab`, `ModelEvalTab`, `IncidentRoomTab`, `MLCodingTab`, `GradientTab` | Written (value `'1'`) on any scenario completion or HomeTab mount. Key is dynamic — one key per calendar day. Powers the 91-day activity heatmap on Home (13×7 grid). Written by `src/utils/activity.js markActivity()`. |
| `msl_quiz_{postId}` | `JSON { a: number, t: number }` | `GradientTab` — QuizMeSection | Per-post quiz score. `a` = correct answers, `t` = total answered. One key per Gradient post (posts 1–50 active in v4.97). Persists across sessions. |
| `msl_casestudies` | `JSON object` | `CaseStudiesTab` | Map of `{ caseId: { q0: answered, q1: answered, ... } }` — persists which questions in each case study have been expanded/answered across sessions. |
| `msl_projectlab_churn_data` | `JSON { cellsDone: string[], checkpointsDone: string[] }` | `ProjectLabTab` | Progress across all 5 phases of the Telco Churn notebook (all complete v4.40). `cellsDone` ∈ `['cell1'…'cell19']`. `checkpointsDone` ∈ `['cp1'…'cp5']`. Phase 1: cell1–3, cp1–cp2. Phase 2: cell4–6, cp3. Phase 3: cell7–10, cp4. Phase 4: cell11–14, cp5. Phase 5: cell15–19, mark-as-read (no checkpoint). Cleared by "Reset notebook" button. |
| `msl_onboarded` | `string ('1')` | `HomeTab` | Written once when a first-time user dismisses the cold-state orientation banner or clicks through to a tab. Prevents the banner from showing on subsequent HomeTab visits. Never expires. |
| `msl_feedback_last` | `string (Unix timestamp)` | `FeedbackChip` | Timestamp (ms) of last feedback form submission. Chip re-shows after 30 days. Set on successful Formspree POST. Never expires — just determines cooldown window. |
| `msl_projectlab_loan_data` | `JSON { cellsDone: string[], checkpointsDone: string[] }` | `LoanDefaultTab` | Progress for the Loan Default notebook. All 4 phases complete. `cellsDone` ∈ `['loan_cell1'…'loan_cell14']`. `checkpointsDone` ∈ `['cpL1','cpL2','cpL3']`. Phase 1: loan_cell1–3, cpL1. Phase 2: loan_cell4–6, cpL2. Phase 3: loan_cell7–9, cpL3. Phase 4: loan_cell10–14 (mark-as-read, no checkpoint). |
| `msl_projectlab_fraud_data` | `JSON { cellsDone: string[], checkpointsDone: string[] }` | `FraudDetectionTab` | Progress for the Fraud Detection notebook. ALL 4 PHASES COMPLETE (v4.45). `cellsDone` ∈ `['fraud_cell1'…'fraud_cell14']`. `checkpointsDone` ∈ `['cpF1','cpF2','cpF3']`. Phase 1: fraud_cell1–3, cpF1. Phase 2: fraud_cell4–6, cpF2. Phase 3: fraud_cell7–9, cpF3. Phase 4: fraud_cell10–14, mark-as-read (no checkpoint). |
| `msl_spot_the_flaw` | `JSON object` | `SpotTheFlawTab` | Map of `{ scenarioId: { selected: string, correct: boolean } }` — persists which scenarios have been attempted and whether the flaw category was identified correctly. Powers score strip (`attempted/total` and percentage). |
| `msl_score:causal_dag` | `JSON` | `CausalInferenceTab` — CausalDAGExplorer | Custom score for the DAG node-role identification module. Tracks correct/attempted across 3 pre-built DAGs. |
| `msl_score:causal_exp` | `JSON` | `CausalInferenceTab` — ExperimentDesignFailures | AccordionMCQ score for experiment design failures module (SRM, novelty effect, SUTVA). |
| `msl_score:dl_arch` | `JSON` | `DeepLearningTab` — ArchDecisionLab | AccordionMCQ score for architecture decision scenarios (CNN vs ViT, TFT vs LSTM, MoE vs dense). |
| `msl_score:classical_boundary` | `JSON {completed:true, ts:number}` | `ClassicalMLTab` — DecisionBoundaryLab | Written once when user has explored all 5 classifier modes. `ts` is Unix timestamp of completion. |
| `msl_landscape_region` | `string` | `LandscapeTab` — Region selector | Selected region for career data filtering: 'Global' (default) or 'India'/'UK'/'US'/'EU'. Persists across sessions. |
| `msl_score:behavioral` | `JSON {completed:true, ts:number}` | `InterviewPrepTab` — Behavioral scenarios | Interview behavioral judgment score. Written when behavioral scenario is completed. Tracks correctness and timestamps. |
| `msl_difficulty_filter` | `string` | `PracticeDomainCard` | Active difficulty pill filter (easy/junior/mid/senior/staff). User-selected filter persists across sessions. |
| `msl_readiness_score` | `JSON object` | `HomeTab` (computed) | Domain-by-domain seniority levels {mle: 'senior', features: 'mid', ...}. Computed from `msl_trainer_history` + `msl_combinator_history` aggregation, not persisted. Display-only for readiness badge grid. |
| `msl_bookmarks` | `JSON array` | (infrastructure) | Bookmarked tab IDs `['defense', 'combinator', ...]`. Infrastructure ready for v4.49 "Save for Later" feature. Not yet populated. |
| `msl_score:incidentroom` | `JSON array of incident IDs` | `IncidentRoomTab` | Array of completed incident IDs e.g. `['inc1','inc2']`. Appended when user completes all diagnostic steps of an incident. 3 incidents total (v4.58). |
| `msl_score:mlcoding` | `JSON array of problem IDs` | `MLCodingTab` | Array of solved problem IDs e.g. `['mlc1','mlc2']`. Appended when user clicks "Mark solved". 3 problems total (v4.58). |
| `msl_foundations_read` | `JSON array of post IDs` | `GradientTab` — `FoundationsPathView` + `PostReader` path strip | Per-post "read in Foundations Path" state. Independent of `msl_read` (the global Gradient read state) so a user can mark posts in the path without polluting general reading progress. Reads via `readFoundationsRead()` in `src/data/foundationsPath.js`. Powers tier completion bars + overall path progress. Added v4.105. |
| `msl_foundations_tier` | `string ('t0'\|'t1'\|…'t6')` | `GradientTab` — `FoundationsPathView` | Currently-active tier id, written when user expands a tier. Used to default the open tier on next mount so "resume where you left off" works. Added v4.105. |

---

---

## FidelityBadge tier assignments (src/components/FidelityBadge.jsx)

Not localStorage — component-level metadata. Documents which tier each tab/module uses for consistency across future additions.

| Tier | Label | Color | Meaning |
|------|-------|-------|---------|
| `faithful` | Mathematically Faithful | `var(--mint)` | Real computation — exact algorithm, live Pyodide output |
| `simplified` | Simplified | `var(--prime)` | Correct concept, reduced scale or pre-computed data |
| `conceptual` | Conceptual | `var(--ink-low)` | Judgment scenarios — builds mental model, not a runnable implementation |

| Tab | Module(s) | Tier |
|-----|-----------|------|
| SparkLabTab | Pyodide execution cells | `faithful` |
| SparkLabTab | MemoryPressureSimulator | `simplified` |
| ModelsMathTab | All Pyodide cells | `faithful` |
| ProjectLabTab | All phases | `faithful` |
| LoanDefaultTab | All Pyodide cells | `faithful` |
| FraudDetectionTab | All Pyodide cells | `faithful` |
| ClassicalMLTab | DecisionBoundaryLab | `simplified` |
| ClassicalMLTab | All AccordionMCQ modules | `conceptual` |
| DeepLearningTab | AttentionHeadVisualizer | `simplified` |
| DeepLearningTab | All other modules | `conceptual` |
| FeatureEngTab | All modules | `conceptual` |
| ModelEvalTab | All modules | `conceptual` |
| SystemDesignTab, MonitoringTab, MLOpsDeployTab, MLOpsPipelinesTab, DataScienceTab, CausalInferenceTab, TimeSeriesTab, AirflowTab, dbtTab, DataModelingTab | All modules | `conceptual` |

---

## Planned data files (not localStorage — static JS arrays, admin-managed)

These are not localStorage keys. They are source files in `src/data/` that Vercel deploys as part of the bundle. Admin edits them to add approved content. Documented here because they are part of the data taxonomy.

| File | Schema | Managed by | Purpose |
|------|--------|------------|---------|
| `src/data/testimonials.js` | `{ name, role, company, rating, text, date, approved: true }` | Admin (Avinash) | Curated testimonials. Ships with 3 placeholder entries. Replace with real Formspree submissions. HomeTab section hidden automatically when array is empty. |
| `src/data/interviewExperiences.js` | `{ id, company, companyTier, role, level, roundType, skills: string[], rawText, date, approved: true }` | Admin (Avinash) | Curated interview experience reports. Admin extracts skill tags from fixed taxonomy (`ml_fundamentals`, `statistics`, `system_design`, `coding_ml`, `coding_general`, `experimentation`, `product_sense`, `deep_learning`, `sql`, `behavioral`). Skills frequency chart reads from this file. |

## Planned PostHog events (not yet implemented)

| Event | When to fire | Properties | Purpose |
|-------|-------------|------------|---------|
| `feedback_chip_opened` | User clicks floating "Rate this" chip | — | Track how often feedback entry point is discovered |
| `feedback_submitted` | User submits feedback form (before redirect to Tally) | `rating_usefulness, rating_realism, rating_recommend, has_comment` | Submission funnel |
| `interview_exp_form_opened` | User clicks "Submit Interview Experience" | — | Track submission intent |

---

## Adding a new event

1. Add the `track()` call at the right moment in the component
2. Add a row to the event taxonomy table above
3. If a new localStorage key is introduced, add it to the key taxonomy table
4. Run the Analytics audit type from AUDITS.md to verify coverage
