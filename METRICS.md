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
| `msl_score:{tabPrefix}` | `number` | Per-tab score logic | Cumulative score for each practice tab. `tabPrefix` examples: `spark`, `ts`, `classical` |
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
| `msl_projectlab_{dataset}_{phase}` | `JSON` | `ProjectLabTab` (planned) | Per-dataset, per-phase completion state. `dataset` ∈ `{churn, loan, fraud, housing}`. `phase` ∈ `{data, features, model, monitoring, deployment}`. Stores which cells have been run and which judgment checkpoints have been answered. Key is dynamic — one per dataset/phase pair. |

---

## Adding a new event

1. Add the `track()` call at the right moment in the component
2. Add a row to the event taxonomy table above
3. If a new localStorage key is introduced, add it to the key taxonomy table
4. Run the Analytics audit type from AUDITS.md to verify coverage
