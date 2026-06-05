# NEXT.md — Session Queue

Updated: 2026-06-05. Private test is now unblocked. Next focus: intuition sprint (HowTo framing, forward pointers, UX clarity).

---

## ✅ DONE: Private-test readiness (P0) — v4.68
1. ~~Remove DAI2026 from public README~~
2. ~~Fix "Senior MLE in 4 weeks" guided path step 1~~ — changed to `classical`
3. ~~Remove dead `ds` domain from PRACTICE_DOMAINS~~
4. ~~Add first-session directive to Home~~

## ✅ DONE: MVP coherence (P1) — v4.69
1. ~~Skill-first nav~~ — Features/Evaluation/Systems/Training/Data/Interview/Labs/Learn
2. ~~Code Bugs → Bug Hunt~~
3. ~~Gating model decision~~ — tab-level is single enforcement; isFree flags enforced in 4 free tabs only
4. ~~README cleanup~~

## ✅ DONE: PAL/GSL parity sprint — v4.70
1. ~~`src/utils/unlock.js`~~ — single source of truth
2. ~~AccessGate outcome-framed copy~~ — GATE_COPY map, 27 entries
3. ~~Plans & Access tab~~
4. ~~Recently Added strip on Home~~
5. ~~`docs/CONTENT_QUALITY_BAR.md`~~
6. ~~DECISIONS.md monetization + content quality rules~~

## ✅ DONE: 3-tier gating — v4.71
1. ~~Scenario-level gate re-render fixed~~ — `isUnlocked()` + useState in all 4 free tabs
2. ~~PlansTab true 3-tier~~ — Guest / Free (coming soon) / Full Lab + feature table
3. ~~guestMode bypass~~ — "Explore without signing in" works
4. ~~DECISIONS.md two-layer gating model documented~~

## ✅ DONE: Auth sprint — v4.72
1. ~~`src/utils/supabase.js`~~ — env-var gated client
2. ~~`src/utils/auth.js`~~ — Google, GitHub, email magic link
3. ~~`src/utils/syncProgress.js`~~ — push/pull all msl_* keys
4. ~~`src/components/auth/AuthModal.jsx`~~ — 3-method sign-in modal
5. ~~`src/tabs/SignedOutHome.jsx`~~ — full-screen landing, ghost snippets
6. ~~`src/tabs/ProfilePage.jsx`~~ — 5 cards
7. ~~App.jsx wiring~~ — user state, topbar sign-in/avatar, AuthModal at root
8. ~~`docs/SETUP_AUTH.md`~~ — full setup guide
9. ~~Google OAuth live~~ — Supabase project bgwhbpjjlbgtiukaywnv

## ✅ DONE: Depth sprint — v4.73
1. ~~Incident Room → 12/12~~ — inc7–inc12 shipped (stale data, train/serve skew, cold start, GPU OOM, label leakage, canary miss)
2. ~~ML Coding → 12/12~~ — mlc8–mlc12 shipped (time-safe split, weighted P@K, Welford, early stopping, permutation importance)
3. ~~RECENTLY_ADDED updated~~

---

## CURRENT SPRINT: Intuition sprint (P2)

MSL is now at private-test threshold. The highest-leverage work is UX clarity — making every tab self-explanatory without a tutorial.

1. **HowTo framing strip on every tab** — borrow GSL pattern: "What you're building / Steps: 3 / 1. Configure 2. Observe 3. Diagnose." Always visible at tab entry. Applies to: IncidentRoomTab, MLCodingTab, SpotTheFlawTab, FeatureEngTab, ModelEvalTab, ClassicalMLTab, SystemDesignTab, MonitoringTab. Pure copy + layout work in each tab file.

2. **Forward pointers on scenario reveals** — at the end of every scenario reveal, link to the most relevant Gradient post. "Go deeper → [post title] in ∇ Gradient." Add `relatedPost: { id, title }` field to scenario data in FeatureEngTab, ClassicalMLTab, ModelEvalTab. Render after staffFraming. Closes the read→practice loop that GSL identified as mandatory.

3. **Unlock state propagation fix** — when a user unlocks via scenario-level gate in a free tab (e.g. FeatureEngTab), App.jsx `isUnlocked` state doesn't update. Premium tabs still show gates. Fix: dispatch `CustomEvent('msl-unlock')` from AccessGate on success; App.jsx listens and calls `setIsUnlocked(true)`. One event, no prop threading.

4. **SpotTheFlawTab audit** — 12 scenarios exist with `reveal` + `fix`. Check whether the reveal quality meets CONTENT_QUALITY_BAR.md standard (scenario-specific, production tell present). Strengthen any reveals that are too generic.

5. **DLFineTuningTab + DLServingTab content audit** — neither was touched in the three-tier pass. Check scenario count and staffFraming coverage.

---

## NEXT: UX loop sprint (P2-later)

After intuition sprint:

1. **Quiz Me on Gradient posts** — precomputed 3 MCQs per post. Static, no LLM. Read→practice loop.
2. **Challenge Log on Home** — global completion summary (X/Y scenarios, wrong-answer count, uncovered tabs).
3. **91-day practice heatmap** — GitHub-style activity grid. Data in `msl_activity_YYYY-MM-DD` already written.
4. **ELI5 mode on Gradient posts** — simplified-language toggle. Static simplified version per post.

---

## DEFERRED (P3 — post private-test signal)

- GitHub OAuth (Supabase config exists, not yet tested)
- Per-section readiness badges (Developing/Proficient/Senior)
- Continue-your-path CTA on Home
- Stripe integration
- Company-specific tracks in Combinator
- Interview Experiences tab (blocked on Formspree + Tally credentials from Avinash)

---

## Blockers

- **Interview Experiences:** Awaiting Avinash signup for Formspree + Tally.so (`REPLACE_WITH_YOUR_FORMSPREE_ID` in FeedbackChip.jsx, `REPLACE_WITH_YOUR_TALLY_ID` in App.jsx InterviewGrid)
- **Git lock:** User must run `rm -f .git/index.lock .git/HEAD.lock` before each commit (sandbox cannot remove lock files)
- **GitHub OAuth:** Supabase provider enabled but Google Cloud Console redirect URI may need a second entry for GitHub — not yet verified live

---

## Notes for next session

- Read CLAUDE.md + this file first. Then grep AUDITS.md for open findings before touching code.
- v4.68–v4.73 all in one large uncommitted batch — user must push from terminal
- `RECENTLY_ADDED` in HomeTab.jsx must be updated every time content ships (5-item static array)
- `GATE_COPY` in App.jsx must have an entry for any new premium tab
- `BRAIN-TRANSFER.md` + `PENDING.md` stubs still need `git rm` — open finding #030.6
