# NEXT.md — Session Queue

Updated: 2026-06-05. Objective: Depth sprint (P1.5) — Incident Room and ML Coding to 12. Forward pointers on scenarios. Quiz Me on Gradient posts.

---

## ✅ DONE: Private-test readiness (P0) — v4.68

1. ~~Remove DAI2026 from public README~~ — done, committed
2. ~~Fix "Senior MLE in 4 weeks" guided path step 1~~ — changed to `classical` (free tab)
3. ~~Remove dead `ds` domain from PRACTICE_DOMAINS~~ — domain renamed `causal_ts`, DS tab removed
4. ~~Add first-session directive to Home~~ — amber callout, renders only when `totalAttempted === 0`

## ✅ DONE: MVP coherence (P1) — v4.69

1. ~~Skill-first nav restructure~~ — Features/Evaluation/Systems/Training/Data/Interview/Labs/Learn. Trainer moved to Labs.
2. ~~Code Bugs → Bug Hunt~~ — renamed in nav + README.
3. ~~Gating model decision~~ — tab-level AccessGate is the single model; isFree flags informational only. Logged in DECISIONS.md.
4. ~~README cleanup~~ — DS Fundamentals removed, Bug Hunt count corrected (20), Gradient posts updated (50).

---

## ✅ DONE: Auth sprint (v4.72)

1. ~~`src/utils/supabase.js`~~ — env-var gated client, authEnabled export
2. ~~`src/utils/auth.js`~~ — signInWithGoogle/GitHub/Email, signOut
3. ~~`src/utils/syncProgress.js`~~ — push/pull all msl_* keys to Supabase user_progress table
4. ~~`src/components/auth/AuthModal.jsx`~~ — 3-method sign-in modal (Google, GitHub, email magic link)
5. ~~`src/tabs/SignedOutHome.jsx`~~ — full-screen landing with ghost data snippets
6. ~~`src/tabs/ProfilePage.jsx`~~ — 5 cards: identity, stats, sync, study plans, settings
7. ~~App.jsx wiring~~ — user state, onAuthStateChange, topbar sign-in/avatar, AuthModal at root end
8. ~~`docs/SETUP_AUTH.md`~~ — setup guide (Supabase project, OAuth, SQL table, Vercel env vars)
9. ~~`@supabase/supabase-js`~~ — installed

**To activate:** Run `npm install @supabase/supabase-js` (done), create Supabase project, run SQL from SETUP_AUTH.md, enable Google + GitHub OAuth, add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to Vercel → redeploy.

## ✅ DONE: PAL/GSL parity sprint (v4.70)

1. ~~`src/utils/unlock.js`~~ — single source of truth for access logic (`isUnlocked`, `unlock`, `getAccessTier`, `ACCESS_CODE`, `STORAGE_KEY`)
2. ~~AccessGate outcome-framed copy~~ — accepts `title`/`body`/`ctaLabel` props. `GATE_COPY` map in App.jsx covers every premium tab with surface-specific copy.
3. ~~Plans & Access tab~~ — `PlansTab.jsx` wired as `plans` tab. Free vs Premium tier breakdown + access code entry. NAV link "Plans & Access" added to sidebar.
4. ~~Recently Added strip on Home~~ — `RECENTLY_ADDED` array in HomeTab. Shows top 3 to returning users (`totalAttempted > 0`).
5. ~~`docs/CONTENT_QUALITY_BAR.md`~~ — four-check quality standard + interactive module standard (Configure→Logic→Outcome→Diagnosis).
6. ~~DECISIONS.md~~ — monetization plumbing rules + content quality rules logged.

---

## CURRENT SPRINT: Depth sprint (P1.5)

1. **Incident Room → 12 scenarios** — currently 6. Add inc7–inc12 across cross-domain failure modes. Each must meet CONTENT_QUALITY_BAR.md standard.

2. **ML Coding → 12 problems** — currently 7. Add mlc8–mlc12 targeting senior/staff difficulty. Live Pyodide execution required.

3. **Forward pointers on scenarios** — add `relatedPost` field to FeatureEngTab, ModelEvalTab, ClassicalMLTab scenario data. Render "Read next → [post title]" at reveal. Closes the learn loop.

4. **SpotTheFlawTab three-tier pass** — 12 scenarios, none have `whatsTested`/`antiPattern`/`staffFraming`. Required by CONTENT_QUALITY_BAR.md.

5. **DLFineTuningTab + DLServingTab audit** — check scenario count, three-tier coverage, format consistency against CONTENT_QUALITY_BAR.md.

---

## NEXT: UX loop sprint (P2-early)

After depth sprint, in order:

1. **Quiz Me on Gradient posts** — precomputed 3 MCQs per post embedded in GradientTab data. Static, no LLM call. Closes the read→practice loop.
2. **ELI5 mode on Gradient posts** — simplified-language toggle. Static simplified version per post.
3. **Challenge Log panel on Home** — global completion summary: X/Y scenarios across all tabs, wrong-answer count, tabs with 0% coverage. localStorage data already exists.
4. **91-day practice heatmap** — GitHub-style activity grid. `msl_streak` data already partially tracked.
5. **Auth sprint** — Supabase, email + Google OAuth. See `docs/PAL_ARCHITECTURE_REFERENCE.md`. Only after Quiz Me + heatmap ship.

---

## DEFERRED (P3 — post-auth)

- Signed-out landing page (no sidebar, full-screen pitch)
- Per-section readiness badges (Developing/Proficient/Senior)
- Continue-your-path CTA on Home (needs auth for cross-device)
- Stripe integration
- Company-specific tracks in Combinator

---

## Blockers

**Interview Experiences:** Awaiting Avinash signup for Formspree + Tally.so.
**Git lock:** User must run `rm -f .git/index.lock .git/HEAD.lock` before each commit from their terminal.

---

## Notes for next session

- v4.68+v4.69+v4.70 all uncommitted — one combined push needed (git lock on sandbox)
- `RECENTLY_ADDED` in HomeTab.jsx must be updated each time content ships
- `GATE_COPY` in App.jsx must have an entry for any new premium tab
- BRAIN-TRANSFER.md + PENDING.md stubs still need `git rm` (open finding #030.6)
- Depth sprint items (Incident Room, ML Coding) are pure content additions — read CONTENT_QUALITY_BAR.md before writing any new scenario
