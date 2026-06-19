# FOUNDATIONS_PATH.md — The Self-Contained ML Foundation Curriculum

**Status:** Planning doc (Session 1 of 3–4). Not yet built.
**Drafted:** 2026-06-19.
**Goal:** Turn the scattered Gradient posts into a sequenced, first-principles ladder a beginner can climb from "what's a probability" to "I can hold my own in a senior MLE interview" — without ever leaving the path.

---

## The vision in one paragraph

A user lands on Home, sees a card called **"Foundations Path — start here."** Clicking opens a sequenced ladder of ~32 Gradient posts, organised into 7 tiers. Each tier has prerequisites, a clear "what you'll be able to do after this" outcome, and at the end of each tier, a forward pointer into the relevant MSL practice tab. Progress is tracked (per-post read state, per-tier completion). Every post is augmented with a **production tell** ("here's what breaks in real systems when you misuse this concept") that GFG and most textbooks skip. By the end, the user has covered everything on the GFG ML interview list — but with judgment, not flashcards.

---

## The ladder

Status legend:
- ✅ = post exists in Gradient today, can be slotted in
- 🟡 = post exists but needs a "production tell" supplement (audit)
- 🔴 = post needs to be written from scratch

### Tier 0 — Pure Math Foundations (6 posts)

*Prerequisite: high-school math. Outcome: you can read any ML paper's notation.*

| # | Post | Status | Notes |
|---|------|--------|-------|
| 1 | Probability for ML: Distributions, Bayes, Conditional Independence | ✅ post 101 | |
| 2 | Linear Algebra for ML: Eigenvalues, SVD, and Why They Are Everywhere | ✅ post 102 | |
| 3 | Calculus for ML: Gradients, Chain Rule, Differentiating Through Neural Nets | ✅ post 103 | |
| 4 | Matrix Calculus: Deriving OLS and Backprop Through a Linear Layer by Hand | ✅ post 120 | |
| 5 | Information Theory: Entropy, KL Divergence, and Why Cross-Entropy Is the Right Loss | ✅ post 104 | |
| 6 | Convex Optimisation: Why Convexity Guarantees a Global Minimum and Why NNs Work Without It | ✅ post 115 | |

**Forward pointer at tier end:** Math Foundations tab → ModelsMath module.

### Tier 1 — Statistics & Estimation (4 posts)

*Prerequisite: Tier 0. Outcome: you understand what a model is actually trying to do mathematically.*

| # | Post | Status | Notes |
|---|------|--------|-------|
| 7 | Hypothesis Testing: t-Tests, p-Values, and What a Confidence Interval Actually Means | ✅ post 113 | |
| 8 | MLE and MAP: The Unifying Framework Behind Every Model | ✅ post 105 | |
| 9 | The EM Algorithm: GMMs, the k-Means Connection, and Hidden Variable Models | ✅ post 106 | |
| 10 | Bayesian Inference: Prior, Likelihood, Posterior, and When to Use It | ✅ post 74 | currently in `found` series |

**Forward pointer:** Data Science tab → Statistics modules.

### Tier 2 — Linear Models (4 posts)

*Prerequisite: Tier 1. Outcome: you understand how the simplest models actually fit data, and what regularisation geometrically means.*

| # | Post | Status | Notes |
|---|------|--------|-------|
| 11 | OLS and Linear Regression: Normal Equations, Gauss-Markov, and When It Breaks | ✅ post 111 | |
| 12 | Logistic Regression From Scratch: MLE, the GLM Connection, and Why It Still Matters | ✅ post 107 | |
| 13 | Regularisation: The Geometric Picture of Why L1 Is Sparse and L2 Is Not | ✅ post 112 | |
| 14 | Generalisation Theory: VC Dimension, Double Descent, and Why Overparameterised Models Work | ✅ post 119 | |

**Forward pointer:** Classical ML tab → Linear Models module + DecisionBoundaryLab.

### Tier 3 — Classical Algorithms (8 posts) — **biggest gap**

*Prerequisite: Tier 2. Outcome: you can pick the right classical algorithm for a problem, explain its assumptions, and know when it breaks.*

| # | Post | Status | Notes |
|---|------|--------|-------|
| 15 | K-Nearest Neighbors: The Lazy Algorithm, the Curse of Dimensionality, and When KNN Wins | 🔴 **needs writing** | not in Gradient anywhere |
| 16 | Naive Bayes: The Independence Assumption, When It Lies, and Why It Still Works | 🔴 **needs writing** | not in Gradient anywhere |
| 17 | Decision Trees and Random Forests: From Information Gain to Why Bagging Reduces Variance | ✅ post 108 | |
| 18 | Gradient Boosted Trees: What XGBoost Is Actually Doing | ✅ post 72 | currently in `recsys`, fits better here |
| 19 | Ensemble Methods: Bagging, Boosting, Stacking — The Mechanics and When Each Wins | 🔴 **needs writing** | AdaBoost / CatBoost mechanics, stacking theory |
| 20 | SVMs: The Kernel Trick, Maximum Margin, and When They Still Win | ✅ post 97 | currently in `found` |
| 21 | The Bias-Variance Tradeoff: The Formal MSE Decomposition | ✅ post 73 | currently in `found` |
| 22 | Model Calibration: Why Neural Networks Are Overconfident and How to Fix It | ✅ post 75 | currently in `found` |

**Forward pointer:** Classical ML tab → Tree/Ensemble modules + Bug Hunt classical scenarios.

### Tier 4 — Unsupervised & Dimensionality Reduction (3 posts)

*Prerequisite: Tier 1 (Tier 3 helpful but not required). Outcome: you can reduce dimensions and find structure when you have no labels.*

| # | Post | Status | Notes |
|---|------|--------|-------|
| 23 | PCA from Scratch: What the Eigenvectors Are Actually Capturing | ✅ post 86 | currently in `found` |
| 24 | Clustering: What k-Means Is Optimising and When DBSCAN Is Better | ✅ post 87 | currently in `found` |
| 25 | Manifold Learning: t-SNE, UMAP, and Why They Distort Distances | 🔴 **needs writing** | only mentioned in passing today |

**Forward pointer:** Classical ML tab → PCA module (already guestPreview-flagged).

### Tier 5 — Evaluation & Generalization (4 posts)

*Prerequisite: Tier 2. Outcome: you can pick the right metric and detect when offline numbers will not hold online.*

| # | Post | Status | Notes |
|---|------|--------|-------|
| 26 | Evaluation Metrics: Precision, Recall, AUC-ROC, and AUC-PR From First Principles | ✅ post 114 | |
| 27 | AUC Is Not Your Friend: A Guide to ML Metric Selection | ✅ post 5 | the production-judgment companion |
| 28 | Offline Evaluation ≠ Online Performance: The Gap Every ML Engineer Ignores | ✅ post 42 | |
| 29 | The Validation Set Is Lying to You: Four Leakage Patterns | ✅ post 20 | |

**Forward pointer:** Model Evaluation tab → all metric modules.

### Tier 6 — Sequence, Specialized & Bridge to Production (5 posts)

*Prerequisite: Tier 1 and Tier 2. Outcome: you can handle time-ordered data and you've crossed into production-judgment territory — the bridge into the rest of MSL.*

| # | Post | Status | Notes |
|---|------|--------|-------|
| 30 | Time Series Forecasting: ARIMA, Prophet, and When Neural Models Win | ✅ post 88 | currently in `found` |
| 31 | Survival Analysis: Kaplan-Meier, Cox Proportional Hazards, and Why Censoring Matters | ✅ post 118 | |
| 32 | Anomaly Detection: Isolation Forest, Autoencoders, and Statistical Baselines | ✅ post 95 | currently in `found` |
| 33 | Multi-Armed Bandits: Thompson Sampling, UCB, and Explore-Exploit | ✅ post 96 | currently in `found` |
| 34 | Data Preprocessing: Scaling, Categorical Encoding, and the MCAR/MAR/MNAR Taxonomy | ✅ post 117 | |

**Forward pointer:** Time Series tab, Causal Inference tab, Monitoring tab — Tier 6 ends the foundation; the rest of MSL is production judgment built on top of it.

---

## Total: 34 posts in path

- **27 already exist** in Gradient (just need to be sequenced + marked as part of the path)
- **3 need writing from scratch** (KNN, Naive Bayes, Ensemble theory, t-SNE/UMAP — *wait, 4*)

Correction: **4 net-new posts** required —

1. KNN: The Lazy Algorithm, Curse of Dimensionality, and When KNN Wins
2. Naive Bayes: The Independence Assumption, When It Lies, and Why It Still Works
3. Ensemble Methods: Bagging, Boosting, Stacking — Mechanics and When Each Wins
4. Manifold Learning: t-SNE, UMAP, and Why They Distort Distances

Each post: ~600–900 words, intuition → derivation → worked example → **production tell** → 4 interview Q&As with answers → Colab challenge → forward pointer. Roughly 1 session per 4 posts at MSL's quality bar.

---

## Audit pass: production tells

Per DECISIONS.md "every scenario must contain a production tell," every Foundations Path post needs a section: **"In production, this breaks as…"**. This is the GFG difference.

Audit needed:
- ✅ All 20 Ground Up posts (101–120) — most likely already have this from their drafting in v4.86 / v4.87; needs a verification pass
- 🟡 Posts being absorbed from other series (73, 74, 75, 86, 87, 88, 95, 96, 97, 72, 5, 42, 20) — need supplement audit, some predate the production-tell rule
- 🔴 New posts (15, 16, 19, 25) — write with production tell from the start

Audit effort: 1 session, includes writing supplements where missing.

---

## UI scope (Session 2)

**Entry points:**
- Home: new card "Foundations Path — start here" above the Continue strip. Visible on first visit; auto-dismisses once user has marked any post in the path as read.
- Gradient sidebar: new sticky section above the existing Mode / Series / Domain filter — "Foundations Path" with progress bar.
- Cmd+K (ContentMap): each tier appears as a navigable node.

**The path view itself** (`/?path=foundations#gradient`):
- Sequential tier list with collapse/expand per tier
- Per-tier: prerequisite chip, outcome statement, list of posts, forward pointer to practice tab
- Per-post in path: title, read time, "Read" CTA, ✅ checkmark when read
- Tier completion: full tier marked done when all posts read; "Next: Tier N →" pointer appears
- Top-of-path progress bar: "12 / 34 posts complete" + "Tier 3 / 7"

**State:**
- `msl_foundations_read` — JSON array of post IDs marked read inside the path
- `msl_foundations_tier` — current tier number (for "resume where you left off")
- Both keys documented in METRICS.md when shipped

**Inside each post (PostReader augmentation):**
- If post is part of the path, render a top strip: "Foundations Path · Tier 3 · Post 17 of 34" + "← Previous" / "Next →" buttons that walk the path sequence (not the chronological post ID).
- "Mark as read in Foundations Path" button below the existing read toggle.
- Forward pointer block at the end (if last post of a tier): "You've completed Tier 3. Now practice this in [Classical ML tab → Tree Modules]."

---

## Forward pointers (the read → practice loop)

The path is only half the product. The other half is connecting each tier to MSL's practice tabs so the user doesn't just read theory — they apply it immediately.

| Tier | Practice destination | What user does |
|------|---------------------|---------------|
| 0 | ModelsMathTab | Pyodide cells for matrix ops, derivatives, optimisation |
| 1 | DataScienceTab statistics modules | Hypothesis test scenarios, Bayesian reasoning |
| 2 | ClassicalMLTab → DecisionBoundaryLab | Linear vs non-linear boundary scenarios |
| 3 | ClassicalMLTab → tree/ensemble modules + Bug Hunt classical scenarios | Pick-the-algorithm scenarios + debug |
| 4 | ClassicalMLTab → PCA module (guestPreview) | Dim reduction practice |
| 5 | ModelEvalTab — all modules | Metric selection scenarios |
| 6 | TimeSeriesTab, CausalInferenceTab, MonitoringTab | Production-judgment scenarios |

This is the *only* curriculum in the product where read and practice are sequenced. Every other tab is freeform. This is what makes the path self-contained — a beginner can finish all 34 posts and the connected practice modules and emerge interview-ready without needing any external resource.

---

## Sprint plan

**Session 1 (this doc — done).** Ladder designed, gaps identified, UI scope drafted.

**Session 2 — UI build.**
- Foundations Path view in GradientTab (`/?path=foundations#gradient`)
- Home card
- Sidebar entry
- localStorage state (`msl_foundations_read`, `msl_foundations_tier`)
- PostReader augmentation (path strip, prev/next, mark-as-read-in-path)
- Cmd+K integration
- METRICS.md update
- LINEAGE.md entry

**Session 3 — Content gaps.**
- Write 4 new posts (KNN, Naive Bayes, Ensemble theory, Manifold Learning / t-SNE)
- Production-tell audit on 14 absorbed-from-other-series posts; supplement where missing
- Interview Q&A pass on any post missing 4 Qs

**Session 4 — Polish + production-tell sweep on Ground Up.**
- Verify all 20 Ground Up posts (101–120) have a production tell; add where missing
- Forward pointer audit — every post in path has a pointer to the right MSL tab
- End-to-end walk-through: a fresh user opens Home → completes path → can answer GFG's 82 questions with production judgment
- Documentation pass: README + first-session directive on Home updated to mention Foundations Path

---

## What this is NOT

- **Not a flashcard system.** GFG, Brilliant, ML Cheatsheet already do that. We're building a path with judgment baked in.
- **Not a substitute for Andrew Ng / fast.ai.** Those are video courses. This is a structured reading + practice ladder that complements them.
- **Not exhaustive of every ML topic.** Deep learning specifics (Transformers, RNNs, GANs, diffusion) live in the existing `dl` series. RecSys, RAG, LLM serving live in their own series. Foundations Path is the *first-principles ladder up to senior MLE basics*. Specialised tracks branch off after.

---

## Open questions for next session

1. Should the path be gated (premium-only) or free? Lean: **free**. Foundations are the entry hook; the moat is the production-judgment practice tabs that the path forward-points to.
2. Should completion of the path unlock anything visible (badge, profile entry)? Lean: **yes, lightweight** — a "Foundations complete" tag on ProfilePage.
3. Should we surface this on SignedOutHome too? Lean: **yes** — it's the strongest "what you'll get" demo for unsigned visitors.
4. PAL has its own foundations-style content. Should the Foundations Path link out to PAL where MSL doesn't have coverage (e.g., experimentation depth)? Lean: **no for v1** — keep the path self-contained inside MSL. Cross-lab links are v2.
