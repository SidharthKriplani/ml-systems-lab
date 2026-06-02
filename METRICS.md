# METRICS.md — Analytics & Storage Taxonomy

Single source of truth for what is tracked, what each localStorage key means, and what the intended event schema is.  
Keep this in sync whenever new events are added or new keys introduced.

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
| `msl_trainer_history` | `JSON array` | `TrainerTab` | Last 50 MCQ session records: `{ date, score, total, domainBreakdown }` |
| `msl_combinator_session` | `JSON` | `CombinatorTab` | Active in-progress session state: `{ screen, duration, questionIds, currentIdx, userAnswers, timeLeft, timePerQuestion, selfRatings, savedAt }`. `savedAt` is a Unix timestamp — elapsed time is subtracted on restore to correct timer drift across zone switches. Cleared on session end. |
| `msl_combinator_history` | `JSON array` | `CombinatorTab` | Last 50 timed session records: `{ date, duration, score, total, domainBreakdown }` |
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
| `msl_activity_YYYY-MM-DD` | `number` (as string) | `HomeTab` | Visit count for a specific calendar day. Key is dynamic — one key per day. Incremented on every HomeTab mount. Powers the activity heatmap (currently 28-day / 4-week window — changed from 91-day in v4.16 because 91 mostly-empty squares looked broken for new users). Keys older than 28 days are still written but not rendered. |
| `msl_casestudies` | `JSON object` | `CaseStudiesTab` | Map of `{ caseId: { q0: answered, q1: answered, ... } }` — persists which questions in each case study have been expanded/answered across sessions. |
| `msl_projectlab_churn_data` | `JSON { cellsDone: string[], checkpointsDone: string[] }` | `ProjectLabTab` | Progress across all phases of the Telco Churn notebook. `cellsDone` ∈ `['cell1'…'cell10']` (grows as phases ship). `checkpointsDone` ∈ `['cp1'…'cp5']`. Written on every cell run (ok result) and every correct checkpoint reveal. Cleared by the "Reset notebook" button. Phase 1: cell1–3, cp1–cp2. Phase 2: cell4–6, cp3. Phase 3: cell7–10, cp4. Phase 4 (planned): cell11–14, cp5. Phase 5 (planned): cell15–19, no checkpoint. |
| `msl_onboarded` | `string ('1')` | `HomeTab` | Written once when a first-time user dismisses the cold-state orientation banner or clicks through to a tab. Prevents the banner from showing on subsequent HomeTab visits. Never expires. |
| `msl_feedback_last` | `string (Unix timestamp)` | `FeedbackChip` | Timestamp (ms) of last feedback form submission. Chip re-shows after 30 days. Set on successful Formspree POST. Never expires — just determines cooldown window. |
| `msl_projectlab_loan_data` | `JSON { cellsDone: string[], checkpointsDone: string[] }` | `LoanDefaultTab` | Progress for the Loan Default notebook. `cellsDone` ∈ `['loan_cell1'…'loan_cell14']` (grows as phases ship). `checkpointsDone` ∈ `['cpL1'…'cpL4']`. Phase 1: loan_cell1–3, cpL1. Phase 2: loan_cell4–6, cpL2. Phase 3: loan_cell7–9, cpL3. Phase 4 (planned): loan_cell10–14, cpL4. |
| `msl_spot_the_flaw` | `JSON object` | `SpotTheFlawTab` | Map of `{ scenarioId: { selected: string, correct: boolean } }` — persists which scenarios have been attempted and whether the flaw category was identified correctly. Powers score strip (`attempted/total` and percentage). |
| `msl_score:causal_dag` | `JSON` | `CausalInferenceTab` — CausalDAGExplorer | Custom score for the DAG node-role identification module. Tracks correct/attempted across 3 pre-built DAGs. |
| `msl_score:causal_exp` | `JSON` | `CausalInferenceTab` — ExperimentDesignFailures | AccordionMCQ score for experiment design failures module (SRM, novelty effect, SUTVA). |
| `msl_score:dl_arch` | `JSON` | `DeepLearningTab` — ArchDecisionLab | AccordionMCQ score for architecture decision scenarios (CNN vs ViT, TFT vs LSTM, MoE vs dense). |
| `msl_score:classical_boundary` | `JSON {completed:true, ts:number}` | `ClassicalMLTab` — DecisionBoundaryLab | Written once when user has explored all 5 classifier modes. `ts` is Unix timestamp of completion. |

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
