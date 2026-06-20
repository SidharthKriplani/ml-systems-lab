# Cold Home Spec — "Your Next 30 Minutes"

Drafted 2026-06-19. Build spec, not a strategy doc. Targets a single focused session of work (~4 hours). Closes feedback theme "Onboarding overwhelm for new users" (see `FEEDBACK_LOG.md`).

---

## Principle

Default state = "one thing to do." Not "everything visible." The current Home is the bug; this spec is the fix.

The user lands on Home and sees ONE card. That card answers the only question a new user is actually asking: *what do I do in the next 30 minutes?*

Soft lock by visibility, not by gating. Nothing is forbidden. Advanced surfaces just aren't shown by default — they progressively reveal as the user shows readiness through behaviour, or with a one-click escape ("show me everything").

---

## State model

### New localStorage keys

| Key | Type | Purpose |
|---|---|---|
| `msl_onboarding_level` | `'beginner' \| 'mid' \| 'senior'` | Set by quiz Q1 |
| `msl_onboarding_urgency` | `'week' \| 'month' \| 'learning'` | Set by quiz Q2 |
| `msl_onboarding_completed` | `'1'` | Set when quiz finished OR explicitly skipped |
| `msl_home_mode_override` | `'dashboard'` (optional) | Set when user clicks "show me everything" — persists user's preference to bypass cold Home |

### Derived state (computed, not stored)

```js
const totalAttempted = Object.values(sectionProgress).reduce((s, p) => s + p.attempted, 0)
const foundationsRead = readFoundationsRead().size

// Modes
const isBrandNew     = totalAttempted === 0 && foundationsRead === 0 && !localStorage.getItem('msl_onboarding_completed')
const isEarly        = !isBrandNew && (totalAttempted < 5 || foundationsRead < 3)
const isReturning    = totalAttempted >= 5 || foundationsRead >= 3
const userOverride   = localStorage.getItem('msl_home_mode_override') === 'dashboard'

const homeMode =
  userOverride        ? 'dashboard' :
  isBrandNew          ? 'quiz' :
  isEarly             ? 'next30' :
                        'dashboard'
```

Three render branches:
- `'quiz'` — first visit, no quiz done. Show inline quiz card.
- `'next30'` — quiz done OR user has touched some content but not enough to graduate. Show "Your Next 30 Minutes" card + escape link.
- `'dashboard'` — current Home renders as today. User has earned the full surface OR explicitly opted in.

---

## Component design

### Quiz card (rendered when `homeMode === 'quiz'`)

```
┌──────────────────────────────────────────────────────┐
│  WELCOME                                             │
│                                                      │
│  Give me 5 seconds and I'll point you at the right   │
│  thing to do today.                                  │
│                                                      │
│  Where are you?                                      │
│  ○ New to ML — start at basics                       │
│  ○ Mid-level — fill production gaps                  │
│  ○ Senior — interview prep, high yield               │
│                                                      │
│  When do you need this?                              │
│  ○ Interview this week                               │
│  ○ Interview this month                              │
│  ○ Just learning                                     │
│                                                      │
│  ┌─────────────────────────┐  ┌──────────┐           │
│  │ See my next 30 min  →   │  │ Skip     │           │
│  └─────────────────────────┘  └──────────┘           │
└──────────────────────────────────────────────────────┘
```

Behaviour:
- Six radio options total. Two questions.
- "See my next 30 min →" requires both answered. Disabled otherwise.
- "Skip" sets `msl_onboarding_completed = '1'` with no level/urgency, defaults take over.
- Submitting writes `msl_onboarding_level`, `msl_onboarding_urgency`, `msl_onboarding_completed`, fires PostHog events, transitions to `next30` mode.

### Next 30 Minutes card (rendered when `homeMode === 'next30'`)

```
┌──────────────────────────────────────────────────────┐
│  YOUR NEXT 30 MINUTES                                │
│                                                      │
│  Read:  AUC Is Not Your Friend                       │
│         10 min · Tier 5 of The MLE Path              │
│                                                      │
│  Then practice:  Metric Selector                     │
│                  20 min · Model Evaluation tab       │
│                                                      │
│  ┌────────────┐                                      │
│  │ Start  →   │                                      │
│  └────────────┘                                      │
│                                                      │
│  ─── I'm not a beginner — show me everything ↓ ───   │
└──────────────────────────────────────────────────────┘
```

Behaviour:
- "Start →" opens the recommended post (`?post=<slug>#gradient`).
- "show me everything ↓" sets `msl_home_mode_override = 'dashboard'` and re-renders.
- The card refreshes its recommendation on each Home mount, based on current state (see Recommendation engine below).

### Dashboard (rendered when `homeMode === 'dashboard'`)

Current Home, unchanged. No behaviour difference except a small "← back to focused mode" pill in the top corner that clears `msl_home_mode_override` and returns to `next30`. Pill only appears if `isEarly === true` (returning power users don't need it).

---

## Recommendation engine

A pure function that takes the user state and returns a recommended `(postId, practiceTabId)` pair. Lives in `src/data/recommendationEngine.js`.

```js
function recommendNext({ level, urgency, foundationsRead, sectionProgress }) {
  // Already-started state: continue where they left off
  if (foundationsRead.size > 0) {
    const next = nextUnreadInPath(foundationsRead)
    if (next) return { postId: next.postId, practiceTabId: POST_PRACTICE[next.postId]?.tab }
  }

  // Fresh user: use quiz answers
  const key = `${level || 'beginner'}_${urgency || 'learning'}`
  return RECOMMENDATIONS[key] || RECOMMENDATIONS.default
}
```

### Recommendation table

| Level | Urgency | First recommendation | Why |
|---|---|---|---|
| beginner | week | Post 3 (AUC Is Not Your Friend) + ModelEval | Highest-leverage week-of read; reframes how interviews are scored |
| beginner | month | Post 128 (Observation Discipline) + ModelsMath | Meta-skill first, then foundations |
| beginner | learning | Post 101 (Probability) + ModelsMath | Linear path from the top of Tier 0 |
| mid | week | Post 1 (Training-Serving Skew) + Features | Production red flag every senior interview probes |
| mid | month | Post 73 (XGBoost) + Classical ML | Tabular workhorse depth |
| mid | learning | Post 119 (Generalisation Theory) + ModelEval | Bias-variance + double descent depth |
| senior | week | Post 24 (6-Step Framework) + SystemDesign | System design rounds are highest-variance; framework first |
| senior | month | Post 4 (Recsys Design) + SystemDesign | The canonical senior MLE design problem |
| senior | learning | Post 132 (Model Explainability) + ModelEval | Staff-level signal topic |
| (skipped quiz / default) | — | Post 128 (Observation Discipline) + ModelsMath | Safe — useful to everyone, low jargon, single page |

All recommendations use the post's existing `POST_PRACTICE` mapping for the practice forward-pointer.

### Re-recommendation logic

On every Home mount after the first:
1. If the previously-recommended post is now in `msl_foundations_read` → recommend the next post per `nextPostInPath(lastPostId)`.
2. If not yet read → still recommend the same post (consistency).
3. If the user has graduated to dashboard mode → recommendation engine doesn't run.

---

## PostHog events

All event names lowercase + underscore. All include `homeMode` and current path progress count.

| Event | When | Properties |
|---|---|---|
| `onboarding_quiz_shown` | Quiz card mounts | — |
| `onboarding_quiz_q1_answered` | User picks a level | `level` |
| `onboarding_quiz_q2_answered` | User picks an urgency | `urgency` |
| `onboarding_quiz_submitted` | User clicks "See my next 30 min" | `level`, `urgency` |
| `onboarding_quiz_skipped` | User clicks Skip | — |
| `next30_card_shown` | Next 30 card mounts | `recommendedPostId`, `recommendedPracticeTab` |
| `next30_start_clicked` | User clicks Start | `recommendedPostId` |
| `next30_see_everything_clicked` | User opens dashboard | — |
| `dashboard_back_to_focused_clicked` | User returns to focused mode | — |
| `recommendation_completed` | Recommended post marked read | `recommendedPostId`, `timeFromRecommendationMs` |

Success metrics for the change (defined for review at 2-week mark):
- `next30_start_clicked / next30_card_shown` > 50% — primary success metric.
- `onboarding_quiz_skipped / onboarding_quiz_shown` < 40% — quiz is acceptable, not friction.
- `recommendation_completed / next30_start_clicked` > 30% — recommendations are actually useful.
- `dashboard_back_to_focused_clicked` count > 0 — at least some power users use focused mode after seeing dashboard.

If `next30_see_everything_clicked > 70%`, the experiment failed and we revert.

---

## State transition diagram

```
[fresh user]
     │
     ▼
[quiz mode]  ────skip────►  [next30 with default rec]
     │                              │
     │ submit                       │
     ▼                              │
[next30 with personalised rec]  ◄───┘
     │
     │ click Start
     ▼
[opens recommended post]
     │
     │ marks read
     ▼
[next30 with next rec]
     │
     │ (3 posts read OR 1 tier complete)
     ▼
[dashboard auto-graduation]
     │
     │ optional: click "back to focused"
     ▼
[next30 again, on demand]


At any time in next30 mode:
     │
     │ click "show me everything"
     ▼
[dashboard with override flag set]
```

---

## File changes (no code yet — scope preview)

| File | Change |
|---|---|
| `src/tabs/HomeTab.jsx` | Add `homeMode` derivation; conditional render of QuizCard / Next30Card / current Dashboard |
| `src/data/recommendationEngine.js` | New file: `RECOMMENDATIONS` table + `recommendNext()` function |
| `src/components/QuizCard.jsx` | New file: the inline 2-question card |
| `src/components/Next30Card.jsx` | New file: the recommendation card |
| `src/analytics.js` | Add the 10 new event names to the tracked taxonomy |
| `METRICS.md` | Document 4 new localStorage keys + 10 PostHog events |
| `LINEAGE.md` | v4.112 entry |

Estimated size: ~250 lines of new code, ~30 lines of edits in HomeTab.

---

## Edge cases handled

- **User clears localStorage** → re-enters as brand new user. Acceptable.
- **User signed in, has Supabase progress** → pull progress on sign-in; if any reads, derived mode = `dashboard`. Quiz not re-shown.
- **User completes recommendation in < 30 seconds** → likely didn't read; we still mark the recommendation as completed because the user took the action. No client-side rate-limit.
- **User skips quiz, comes back later** → still gets default recommendation (Post 128). Skipped state persists. Quiz never re-shown.
- **User clicks "show me everything" once, then comes back next day** → `msl_home_mode_override` persists; dashboard renders. The "back to focused" pill is always available to flip back.
- **Recommended post has no practice tab in `POST_PRACTICE`** → render the Read line only; omit the practice line. (Audit reveals this should never happen for path posts after v4.107.)
- **Authenticated user with old progress from before this ships** → derived mode lands them in `dashboard` immediately. They never see the quiz. Acceptable — they're not the target audience for cold Home.

---

## Acceptance criteria

A first-time visitor on a fresh browser:
1. Sees ONE card on Home. Not the current dashboard.
2. The card asks 2 questions in < 5 seconds, OR is skippable in 1 click.
3. After quiz (or skip), sees a single specific recommendation: post title + practice tab + time estimate.
4. The "Start" CTA opens the post immediately.
5. The "show me everything" link is visible but muted — they have to look for it.

A returning user with progress:
6. Sees the current dashboard (no cold Home interruption).
7. Can opt into focused mode via the "back to focused" pill if shown the Next30 card.

PostHog:
8. All 10 events fire correctly with the right properties.
9. The 2-week success metrics are queryable.

---

## What this spec does NOT include

Out of scope for this session:
- The 5 deferred onboarding fixes (interview readiness %, time estimates on tiers, tooltips on nav, empty-state polish on tabs, progressive surfacing of dashboard widgets beyond the mode switch). Revisit after 2 weeks of live data.
- A/B testing infrastructure for the change itself. Ship it for everyone, measure with PostHog, revert if metrics fail.
- Mobile-specific layouts. The card structure works on mobile as-is. Polish if specific mobile issues surface.
- Animation / transitions. Default fade is fine. Polish later if needed.

---

## Build sequence

1. Set `VITE_POSTHOG_KEY` in Vercel env vars (5 min — currently the analytics wrapper is wired but inert).
2. Create `recommendationEngine.js` with table + function. Unit-testable in isolation.
3. Create `QuizCard.jsx` and `Next30Card.jsx` as pure components.
4. Modify `HomeTab.jsx` to derive `homeMode` and conditionally render.
5. Add events to `analytics.js`.
6. Update `METRICS.md` (4 keys + 10 events).
7. Brace + apostrophe audit. Push.
8. LINEAGE entry v4.112.
9. Watch PostHog for 2 weeks. Decide on next round of fixes from real data.

End of spec.
