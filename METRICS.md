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
| JD paste + analysis run | `JDPrepTab` | Low |
| Defense doc generated | `DefenseDocTab` | Low |

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
| `msl_jdprep_last` | `string` | `JDPrepTab` | Last pasted JD text — **pending deprecation** when JDPrepTab is merged into DefenseDocTab (see IDEAS.md Upgrades section); fold into `msl_defense_progress` or drop |
| `msl_read` | `JSON` | `GradientTab` | Set of post IDs marked as read |
| `msl_role` | `string` | `HomeTab` | Selected role for personalization |
| `msl_tab` | `string` | `App.jsx` | Last active tab — used for restore on reload |
| `msl_goto_module` | `string` | Navigation helpers | Deep-link target module, cleared after use |
| `msl_goto_path` | `string` | Navigation helpers | Deep-link target path, cleared after use |
| `msl_path_progress` | `JSON object` | `HomeTab` | Map of `{ pathId: { completedSteps: string[] } }` — persists step completion state for guided learning paths |
| `msl_access` | `string` | `AccessGate` / `App.jsx` | Access code entered by user. Value `'INPRODUCTION'` = premium unlocked. Permanent — never expires. Set on code entry, checked on every app load via `useState` initializer. |

---

## Adding a new event

1. Add the `track()` call at the right moment in the component
2. Add a row to the event taxonomy table above
3. If a new localStorage key is introduced, add it to the key taxonomy table
4. Run the Analytics audit type from AUDITS.md to verify coverage
