# NEXT.md — Session Queue

Updated: 2026-06-17. Study Room v1 code shipped (activation pending). Current focus: intuition sprint (HowTo framing, forward pointers, UX clarity).

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

## ✅ DONE: Intuition sprint (v4.74)

1. ~~Unlock statefulness~~ — `CustomEvent('msl-unlock')` from AccessGate; App.jsx listener calls `setIsUnlocked(true)`
2. ~~HowToStrip component~~ — applied to 9 tabs: IncidentRoom, MLCoding, SpotTheFlaw, FeatureEng, ClassicalML, ModelEval, ModelsMath, Combinator, Verbal
3. ~~Session memory~~ — `msl_featureeng_active`, `msl_classical_active`, `msl_modeleval_active`, `msl_mathfound_active` keys; module persisted on every switch

---

## ✅ DONE: Two-gate access model (v4.79)
1. ~~Auth gate before content gate in App.jsx (premium tabs)~~
2. ~~`guestPreview` flag on one module per free tab (store/zoo/metric/pca)~~
3. ~~Two-gate logic in 4 free tabs: auth check → content check~~
4. ~~PlansTab footer copy fixed — "sign in separately to access free cases"~~
5. ~~DECISIONS.md updated with canonical gate model~~

## ✅ DONE: PlansTab pricing redesign (v4.78)
1. ~~4-plan cards: Monthly/Quarterly/Annual/Sprint with ₹ pricing~~
2. ~~Beta banner: inline sign-in + access code~~
3. ~~Feature table updated to 20 rows~~

## ✅ DONE: ResourcesTab + nav fixes (v4.77)
1. ~~"Deep Dives" → "Gradient" in NAV_SECTIONS~~
2. ~~`src/tabs/ResourcesTab.jsx` — Interview Trainer Prompt with copy button~~
3. ~~"Resources" NavItem in left sidebar~~
4. ~~Trainer prompt removed from PlansTab~~

---

## ✅ DONE: Gradient Ground Up series complete — 10 more posts (v4.87, 2026-06-18)

Posts 111–120. Ground Up series now 20 posts total (101–120). Every foundational layer covered.
OLS/Normal Equations · Regularisation geometry · Hypothesis Testing · Evaluation Metrics · Convex Optimisation · NN Initialisation · Data Preprocessing · Survival Analysis · Generalisation Theory · Matrix Calculus.
Each post: full derivation + 4 interview Qs with answers + Colab challenge.
Total: 120 posts, 12 series, ~11,500 lines. Brace diff 0.

---

## ✅ DONE: Gradient "From Ground Up" series — 10 foundational posts (v4.86, 2026-06-17)

Posts 101–110. New SERIES 'ground' (From Ground Up). Each post includes 4 interview Qs with full answers + Colab challenge.
Probability · Linear Algebra · Calculus · Information Theory · MLE/MAP · EM Algorithm · Logistic Regression · Decision Trees/RF · Word2Vec · CV Before ViTs.
Total: 110 posts, 12 series. File ~9,200 lines. Brace diff 0.

---

## ✅ DONE: Gradient 100 posts milestone — 5 final posts (v4.85, 2026-06-17)

Posts 96–100. GradientTab complete at 100 posts:
Multi-Armed Bandits (Thompson/UCB) · SVMs + Kernel Trick · Fairness in ML (impossibility theorem, Fairlearn) · RLHF + DPO · Federated Learning (FedAvg, DP, SecAgg).
New SERIES 'ethics' (Fairness & Ethics). All 11 series updated.

---

## ✅ DONE: Gradient complete FAANG DS/ML curriculum — 17 more posts (v4.84, 2026-06-17)

Posts 79–95. Gradient now has 95 posts covering the complete staff DS/ML interview surface:
BM25/TF-IDF · Semantic Search Stack · Price Elasticity · LTV/Churn · Attribution/MMM · Uplift Modeling · Multiple Testing/FDR · PCA · Clustering · Time Series · Ads CTR · RAG · Network Effects/SUTVA · DiD/RDD · Metrics Definition · Concept Drift · Anomaly Detection.
New SERIES: 'search' (Search & IR), 'ds' (DS & Causal). Total: 95 posts, 8 series.

---

## ✅ DONE: Gradient staff-level curriculum — 15 more posts (v4.83, 2026-06-17)

Posts 64–78. Full FAANG staff DS/ML interview coverage now in Gradient:
Diffusion Models · GANs · Transfer Learning · BERT vs GPT · Tokenization · Contrastive/CLIP · Two-Tower · Learning to Rank · RecSys Stack · XGBoost · Bias-Variance · Bayesian Inference · Calibration · Feature Stores · Distillation.
New SERIES: 'recsys' (RecSys & Ranking). Total Gradient posts: 78.

---

## ✅ DONE: Gradient DL expansion — 10 more posts (v4.82, 2026-06-17)

Posts 54–63 added. Full DL curriculum in Gradient now covers 13 posts across the 'Deep Learning' series (ids 30,37,51–63):
Self-Attention · Transformer Architecture · Optimization (SGD→Adam) · RNNs + LSTMs · Batch/Layer Norm · Dropout + Regularization · Loss Functions · Embeddings · VAEs · Reinforcement Learning.
New SERIES 'dl' (Deep Learning) created in GradientTab. Brace balance verified.

---

## ✅ DONE: Gradient DL deep-dive sprint (v4.81, 2026-06-17)

3 new foundational Deep Learning posts in GradientTab. Written at "deep enough to have your own Colab ideas" level — not production failure modes. All tagged domain: 'dl', added to Math & Foundations series.

- Post 51: Backpropagation: What the Chain Rule Is Actually Doing (featured, 14 min)
- Post 52: CNNs: What the Layers Are Actually Computing (13 min)
- Post 53: Graph Neural Networks: From Message Passing to PinSage (15 min)

Domain coverage: NN/Backprop, CNN/ResNet, GNN/PinSage. Each ends with a concrete Colab challenge.

---

## ✅ DONE: Study Room v1 — code shipped (v4.80, 2026-06-17)

All code is merged. The feature is NOT yet live because the Supabase tables haven't been created and the Anki cards haven't been imported. That's manual one-time setup, deferred.

Files shipped:
- `src/study/sr.js` — 4-bucket SR engine (1/3/7/14 days)
- `src/study/StudyRoom.jsx` — full-screen overlay, Supabase-fetched queue, flip/rate loop, Shift+Ctrl+K entry
- `supabase/study_schema.sql` — schema to run in Supabase SQL editor (study_cards + card_progress + RLS)
- `scripts/import_anki.py` — APKG → Supabase seeder (988 MSL cards across lane1–lane6)
- `src/App.jsx` — Shift+Ctrl+K wired, studyOpen state, StudyRoom rendered as overlay

## ⏳ PENDING: Study Room activation (one-time manual setup, ~20 min)

Do this when there's time. In order:

1. **Supabase schema** — paste `supabase/study_schema.sql` into Supabase dashboard → SQL Editor → Run
2. **Env vars in Terminal:**
   ```
   export SUPABASE_URL="https://yourproject.supabase.co"
   export SUPABASE_SERVICE_KEY="eyJ..."   # Settings → API → service_role key
   export MSL_USER_ID="your-uuid"        # Authentication → Users → your row
   export ANKI_DIR="/Users/ASUS/Documents/Professional/Anki Files/active work (claude)/batch 1"
   ```
3. **Install dep:** `pip install supabase`
4. **Navigate:** `cd "/Users/ASUS/Documents/Professional/GitHub/upskill platforms (4)/ml-systems-lab"`
5. **Dry run:** `python scripts/import_anki.py --dry-run --lane lane4`
6. **Import:** `python scripts/import_anki.py --lane lane4` (Spark, 146 cards — start here)
7. **Verify:** run the verification query at the bottom of `study_schema.sql`
8. **Test:** open MSL → sign in → Shift+Ctrl+K

Start with lane4 only. Import lane3 + lane6 once lane4 loop feels right.

## STUDY ROOM v2 (after activation is confirmed — P3)
- Code drill cards (Pyodide cell in back, assertion-based auto-rating)
- System design drills (timed textarea + rubric reveal, self-rating)
- Weak topic tracker (per-lane mastery score, surface overdue lanes)
- Import lane1 (RecSys, 387 cards) + lane2 (DL, 150) + lane5 (Cloud, 75)
- "Copy queue as checklist" for manual paste into To Do / Notion

---

## CURRENT SPRINT: Intuition sprint continued (P2)

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
5. **"Start Interview Sim" context export** — button reads localStorage (weak modules, scores, session memory) → generates pre-filled prompt block → user pastes into Claude/ChatGPT + trainer prompt + resume/JD. S effort. Architecture decision logged in DECISIONS.md: MSL = context generator, LLM = trainer. No LLM calls inside MSL.

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
