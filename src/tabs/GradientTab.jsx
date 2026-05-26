import { useState } from 'react'

const POSTS = [
  {
    id: 1,
    slug: 'training-serving-skew',
    title: 'Why Training-Serving Skew Silently Kills Production Models',
    category: 'Feature Engineering',
    catColor: { bg: 'rgba(34,211,238,0.1)', text: 'var(--sky)', border: 'rgba(34,211,238,0.2)' },
    readMin: 8,
    featured: true,
    excerpt: 'Your model has 0.92 AUC in the notebook. It degrades to baseline within two weeks in production. Nobody\'s alarmed because the metrics move slowly. Then one day someone checks the actual conversion rate and it\'s half of what it was at launch. The culprit is almost always the same thing: a gap between how you compute features at training time and how you compute them at serving time.',
    body: `The gap between a model that works in a notebook and one that works in production is almost always a feature engineering problem.

**The four most common forms of training-serving skew:**

**1. Timestamp boundary bugs.** Your training pipeline computes a 7-day rolling window with \`WHERE ts < event_ts\`. Your serving code uses \`WHERE ts <= NOW() - INTERVAL 7 DAYS\`. On the surface these look the same. In practice, training sees a half-open interval at each event's timestamp, while serving uses wall-clock time — and at midnight, they diverge by up to 24 hours.

**2. Different null handling.** Training imputes missing \`age\` with the column mean (34.2). Serving code was written by a different team six months later, and they imputed with 0 for simplicity. A 0-age user looks like a child to your model. Every user with a missing age now gets systematically mis-scored.

**3. Scaler fitted on wrong data.** The classic. \`scaler.fit_transform(X_train)\` at training time. \`scaler.fit_transform([single_row])\` at serving time — re-fitting on every request. A single row has mean = its own value, std ≈ 0. Every scaled feature becomes 0 or undefined.

**4. Aggregation window timezone mismatch.** Training uses a calendar-day window (midnight UTC). Serving uses a rolling 24h window. At 11pm UTC, serving might include the next calendar day. Small difference, consistent bias across all temporal features.

**How to detect it:**

Log your serving features — not just predictions. Ship a feature logging sidecar to your serving infrastructure. Every hour, run PSI between the logged feature distribution and the training distribution baseline. PSI > 0.1: investigate. PSI > 0.2: incident.

**How to prevent it:**

Use a feature store. A real one. The same Python code that computes features for training should be the same code that computes them at serving — called through the same interface. The feature store doesn't need to be fancy. Even a shared library with unit tests is better than two separate code paths maintained by different teams.

The engineering cost of a feature store is front-loaded. The cost of not having one compounds indefinitely.`,
    tags: ['Feature Engineering', 'Production ML', 'Debugging', 'Feature Store'],
    domain: 'features',
    youtube: [{ id: 'pqe-HB7ZcUI', title: 'MFML 082 - The Training-Serving Skew' }],
  },
  {
    id: 2,
    slug: 'spark-shuffle-mental-model',
    title: 'PySpark Shuffle: The Complete Mental Model',
    category: 'PySpark',
    catColor: { bg: 'rgba(245,158,11,0.1)', text: 'var(--gold)', border: 'rgba(245,158,11,0.2)' },
    readMin: 12,
    featured: false,
    excerpt: 'Every wide transformation triggers a shuffle. Most engineers know this. Few have a clear mental model of what actually happens — the partition lifecycle, the disk writes, the network transfers, the sort. Without that model, you\'re guessing when you tune. With it, you can look at a Spark UI and immediately know what\'s wrong.',
    body: `A shuffle happens in three phases: map, shuffle write, shuffle read.

**The map phase:** Each executor runs its tasks on its input partitions. At the end of a map task, the output is partitioned by the shuffle key (hash of the join/group-by key). Each map task writes one output file per downstream reducer.

**Shuffle write:** The map output is spilled to local disk. If executor memory is exceeded before the map phase completes, Spark spills partial output to disk and merges later. This is the first place skew kills you: a task with a hot key writes 10× the data of others.

**Shuffle read:** Each reduce task reads its designated partition from every mapper. If you have 200 mappers and 200 reducers, that's 40,000 small file reads. The network transfer is proportional to data volume, not task count — but the connection overhead scales with task count.

**The key metrics in Spark UI:**
- Shuffle Write: bytes written by map tasks. High = expensive downstream reads.
- Shuffle Read: bytes read by reduce tasks. Should approximately equal shuffle write.
- Task Duration (max vs median): ratio > 5× = data skew.
- GC Time: high GC = executor heap pressure = likely spill incoming.
- Spill (memory): amount spilled from RAM to disk. Non-zero = your partitions are too large for executor heap.

**The key dials:**
- \`spark.sql.shuffle.partitions\` (default: 200): target 128–256 MB per partition after shuffle. For 100GB of shuffled data: 100*1024 / 200 = 512 MB per partition — too large. Try 800.
- \`spark.sql.autoBroadcastJoinThreshold\` (default: 10MB): raise to 500MB if one join side fits.
- \`spark.sql.adaptive.enabled=true\`: AQE dynamically coalesces small partitions and splits large ones at runtime. Enable by default in Spark 3.

**AQE is not magic.** It can't save a job with a 5000:1 key skew if you haven't enabled AQE skew join (\`spark.sql.adaptive.skewJoin.enabled=true\`). And even with skew join enabled, extremely hot keys (> 20× median) may require explicit salting.`,
    tags: ['PySpark', 'Performance', 'Internals', 'Spark UI'],
    domain: 'spark',
    youtube: [{ id: 'q1LtBU_ca20', title: 'Shuffle Partition Spark Optimization: 10x Faster!' }],
  },
  {
    id: 3,
    slug: 'auc-is-not-your-friend',
    title: 'AUC Is Not Your Friend: A Guide to ML Metric Selection',
    category: 'Model Evaluation',
    catColor: { bg: 'rgba(16,185,129,0.1)', text: 'var(--mint)', border: 'rgba(16,185,129,0.2)' },
    readMin: 10,
    featured: false,
    excerpt: 'ROC-AUC is the default metric for classification problems. It\'s in every sklearn tutorial and every Kaggle competition leaderboard. It\'s also the wrong metric for most real production ML problems. Here\'s why — and what to use instead.',
    body: `ROC-AUC measures rank ordering: given a random positive and a random negative, what\'s the probability your model scores the positive higher? This is a useful property. It\'s also completely divorced from what most production ML systems actually need.

**The class imbalance problem.**

ROC-AUC uses True Positive Rate (recall) and False Positive Rate (FPR). FPR = FP / (FP + TN). With 1% positive class, you have 99× more negatives than positives. A model that correctly identifies 80% of positives but has a 10% FPR looks great on ROC-AUC (0.85+). But at 1% prevalence, that 10% FPR means for every true positive you catch, you generate ~12 false positives. In fraud detection, that\'s 12 legitimate transactions blocked for every fraud caught. Your fraud ops team will revolt.

**PR-AUC fixes this.** Precision-Recall AUC is dominated by performance on the positive class. A high PR-AUC requires both high precision (few false positives) and high recall (few false negatives) — there\'s no "free" performance from classifying negatives correctly.

**When to use what:**
- Balanced classes, rank ordering matters → ROC-AUC
- Imbalanced classes, minority class is the target → PR-AUC
- Threshold-based decisions, single operating point → F1 or F-beta
- Probability outputs used downstream → Brier score + calibration
- Business metric is revenue/cost → custom loss or direct business metric

**The threshold problem.**

F1, precision, recall — all computed at a fixed threshold. Move the threshold and your metrics change. ROC-AUC and PR-AUC are threshold-independent. But ultimately, your model operates at a threshold in production. Report threshold-independent metrics for comparison, but always report what the model does at your actual operating threshold.

**The calibration problem.**

A model can have 0.92 AUC and be completely uncalibrated. Uncalibrated means: when the model says P(fraud) = 0.8, the actual frequency of fraud in those predictions might be 0.3. This matters every time you use the score as a probability — risk scoring, expected value calculations, multi-model ensembles. Check with reliability diagrams. Fix with Platt scaling or isotonic regression.`,
    tags: ['Metrics', 'ROC-AUC', 'PR-AUC', 'Classification', 'Calibration'],
    domain: 'eval',
    youtube: [{ id: '4jRBRDbJemM', title: 'ROC and AUC, Clearly Explained — StatQuest' }],
  },
  {
    id: 4,
    slug: 'rec-system-design-framework',
    title: 'How to Design a Recommendation System (The MLE Interview Framework)',
    category: 'ML System Design',
    catColor: { bg: 'rgba(240,165,0,0.08)', text: 'var(--violet)', border: 'rgba(240,165,0,0.18)' },
    readMin: 15,
    featured: true,
    excerpt: 'Every senior MLE interview at Spotify, Netflix, Meta, or Airbnb eventually lands on a recommendation system design question. The surface area is enormous: candidate generation, ranking, serving, monitoring, cold start, exploration. Here\'s the framework that works.',
    body: `There are six components to any recommendation system design. Miss one and you\'ll look junior. Cover all six and you look like someone who has shipped this before.

**1. Problem framing (5 minutes)**

This is where most candidates lose points immediately. They jump to architecture before establishing what the system is optimising for. Ask:
- What is the target action? (play, purchase, watch, click, follow)
- What is the serving context? (homepage, search results, email, push notification)
- What are the latency constraints? (<100ms for real-time, <1s for near-real-time, minutes for batch)
- What is "good"? (engagement? revenue? diversity? user satisfaction?)

These answers fundamentally change everything downstream.

**2. Candidate generation (retrieval)**

At scale (10M+ items), you cannot rank all items for every user. Retrieval narrows the candidate set to ~100–1000 items that are plausibly relevant.

Methods: Collaborative filtering (matrix factorisation), content-based (item embeddings), two-tower model (user embedding + item embedding → ANN lookup), popularity + filters.

Two-tower is the industry standard for large-scale retrieval. User tower: encodes user history, demographics, context. Item tower: encodes item metadata, engagement signals. Train with in-batch negatives. Serve by indexing item embeddings in FAISS or ScaNN.

**3. Ranking**

Given ~500 candidates, rank them. This is where you can afford more expensive models.

Options: GBDT (XGBoost/LightGBM) for tabular features — interpretable, fast, doesn\'t need GPUs. Deep neural networks for feature interaction learning. LTR (Learning to Rank) if you have explicit relevance labels.

Features for ranking: user-item interaction history, item quality signals (CTR, completion rate, rating), freshness, context (time of day, device, location), social signals (friend interactions).

**4. Post-processing**

Raw ranking scores are not what you serve. Apply:
- Business rules (filter out-of-stock, NSFW, legal restrictions)
- Diversity (maximum X% from same creator/category in top-20)
- Freshness boost (promote new items to combat popularity bias)
- Exploration injection (ε-greedy: 10% random items for data collection)

**5. Serving infrastructure**

Online serving: user embedding lookup from feature store → ANN retrieval → candidate features from feature store → ranker inference. Total budget: typically <100ms P99.

Key latency sources: feature lookup (~5ms Redis P50), ANN retrieval (~10ms with FAISS), ranker inference (~20ms GPU batch). Sum to 35ms with headroom.

**6. Monitoring**

Engagement metrics (CTR, completion rate, time spent) — leading indicators.
Satisfaction metrics (ratings, explicit feedback, return visits) — lagging but reliable.
Diversity metrics (ILD, coverage, long-tail ratio) — prevents filter bubbles.
Data quality: feature freshness, null rates, embedding staleness.
Model performance: prediction score distribution drift, AUC on logged feedback.`,
    tags: ['System Design', 'Recommendations', 'Two-Tower', 'Interview Prep', 'Retrieval'],
    domain: 'design',
    youtube: [{ id: 'jkKAeIx7F8c', title: 'ML System Design Interview: YouTube Recommendations' }],
  },
  {
    id: 5,
    slug: 'concept-drift-detection',
    title: 'Concept Drift: How to Detect It Before It Destroys Your Model',
    category: 'Monitoring',
    catColor: { bg: 'rgba(244,63,94,0.1)', text: 'var(--rose)', border: 'rgba(244,63,94,0.2)' },
    readMin: 9,
    featured: false,
    excerpt: 'PSI > 0.2 — trigger alert. This is the rule every ML monitoring guide teaches. It\'s also frequently wrong for your specific use case. Here\'s a framework for actually understanding drift, choosing the right test, and setting thresholds that don\'t page you at 3am for seasonal fluctuations.',
    body: `Drift comes in two flavors and you need to monitor for both differently.

**Data drift (covariate shift)**: The distribution of input features X changes. P(X) ≠ P_ref(X). The model\'s learned mapping from X → y may no longer apply because it was learned on a different X distribution. Example: a model trained on desktop users now receives 40% mobile traffic.

**Concept drift**: The relationship between X and y changes. P(y|X) ≠ P_ref(y|X). Even if features look the same, the world has changed. Example: a price sensitivity model trained pre-inflation now misprices customers because the same income bracket has different purchasing behaviour.

**Detection methods:**

PSI (Population Stability Index): Bins the distribution, computes Σ (actual% - expected%) × ln(actual%/expected%). Good for univariate feature monitoring. Standard thresholds: < 0.1 stable, 0.1–0.2 monitor, > 0.2 significant. But: binning strategy matters enormously. Equal-width bins will miss tail drift. Use quantile-based bins for heavy-tailed distributions.

KS test: Kolmogorov-Smirnov measures the maximum absolute difference between CDFs. Doesn\'t require binning. More sensitive to tail shifts than PSI. Use for continuous features where tail behaviour matters (revenue, session duration).

Model-based drift: Train a classifier to distinguish reference vs current data. If it achieves AUC > 0.7, drift is detectable. This catches multivariate drift that univariate tests miss.

**Setting thresholds that work:**

The 0.2 PSI threshold assumes your reference distribution is stable. If your data has weekly seasonality (as most consumer data does), Monday PSI vs Saturday will always be > 0.2 without any drift. Options: (1) Use same-weekday comparison as reference. (2) Apply seasonal decomposition before computing PSI. (3) Use rolling window comparison (last 7 days vs prior 7 days) instead of fixed reference.

**Distinguishing data drift from concept drift in production:**

You can observe data drift immediately (compare feature distributions). Concept drift requires labels, which often come with a lag. Bridge: use proxy metrics. For a revenue model, track predicted vs actual revenue. For a ranking model, track predicted CTR vs observed CTR on the same items. Divergence = concept drift signal, no labels required.`,
    tags: ['Monitoring', 'Drift', 'PSI', 'KS Test', 'Production ML'],
    domain: 'monitor',
    youtube: [{ id: 'QJTRNxUxmuc', title: 'Concept Drift & Data Drift in ML — Explained' }],
  },
  {
    id: 6,
    slug: 'pca-intuition',
    title: 'PCA: The Intuition No One Teaches',
    category: 'Models & Math',
    catColor: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', border: 'rgba(168,85,247,0.2)' },
    readMin: 11,
    featured: false,
    excerpt: 'Every ML course covers PCA. Very few explain it in a way that builds genuine intuition. What does "variance explained" actually mean? Why does the first principal component always capture the most variance? And when should you NOT use PCA?',
    body: `PCA is fundamentally about finding a new coordinate system where the axes align with the directions of maximum variance in your data.

**The geometric view:**

Imagine a cloud of points in 3D space. The cloud is elongated in one direction (high variance along axis 1), somewhat spread in a second direction (moderate variance along axis 2), and nearly flat in the third (low variance). PCA finds these three directions — PC1, PC2, PC3 — and orders them by variance explained.

Each principal component is a linear combination of your original features. PC1 = a₁×feature₁ + a₂×feature₂ + ... + aₙ×featureₙ. The coefficients are the eigenvectors of the covariance matrix. The variance explained is the corresponding eigenvalue.

**The covariance matrix view:**

Compute Σ = (1/n) × XᵀX (on mean-centered, standardised data). SVD: Σ = UΛUᵀ. The columns of U are the principal components. The diagonal of Λ contains the variances. This is why you always standardise before PCA — features on different scales will have their variance dominated by the highest-magnitude features, and PCA will find them first regardless of information content.

**When PCA hurts:**

When your task is classification. PCA maximises variance, not class separability. A feature with high variance might be pure noise. LDA (Linear Discriminant Analysis) maximises class separability instead — that\'s what you want for supervised dimensionality reduction.

When interpretability matters. PC1 = 0.4×age - 0.3×income + 0.7×account_age ... is not something you can explain to a product team or a regulator. If your features need to remain interpretable, use feature selection (RFE, SHAP-based) instead of PCA.

When your data is sparse. PCA is dense by construction. For text (TF-IDF matrices), image features, or any high-dimensional sparse data, truncated SVD (LSA) or sparse PCA will work better.

**The scree plot and the elbow rule:**

Plot eigenvalues in descending order. The "elbow" — where the curve flattens — is typically a good cutoff. But rules of thumb vary by domain: "keep 90% of variance" is common but arbitrary. Better: keep enough components that cross-validation performance on your downstream task doesn\'t degrade significantly when you add more.`,
    tags: ['PCA', 'Dimensionality Reduction', 'SVD', 'Math', 'sklearn'],
    domain: 'math',
    youtube: [{ id: 'FgakZw6K1QQ', title: 'Principal Component Analysis (PCA) — StatQuest' }],
  },
  {
    id: 7,
    slug: 'feature-store-architecture',
    title: 'Feature Store Architecture: What the Tutorials Skip',
    category: 'Feature Engineering',
    catColor: { bg: 'rgba(34,211,238,0.1)', text: 'var(--sky)', border: 'rgba(34,211,238,0.2)' },
    readMin: 13,
    featured: false,
    excerpt: 'Every feature store has an offline layer and an online layer. The tutorial stops there. What it doesn\'t cover: how to keep them in sync, how to handle late-arriving data, how to version features across training runs, and what happens when the online store falls over at 2am.',
    body: `A feature store has three jobs: compute features consistently, serve them fast, and keep them fresh. Most teams get the first one wrong, the second one right-ish, and ignore the third until it causes an incident.

**The offline layer:**

Typically Hive, BigQuery, or Delta Lake. Stores historical feature values at entity-timestamp granularity (user_id, timestamp → feature_values). Used for: training data generation (point-in-time correct joins), batch scoring, backfilling.

Point-in-time correct joins are non-negotiable. If you\'re training a model to predict purchase at time T, you must use feature values as they existed at time T — not the values that existed when you ran the training job. This requires an \`asof\` join on timestamp, which is expensive but correct.

**The online layer:**

Redis, DynamoDB, Bigtable, or Cassandra. Stores the latest feature values per entity for real-time lookup. Used for: live inference requests.

Key design decision: who writes to the online layer? Two patterns: (1) Stream processor (Flink/Kafka Streams): computes features from event stream, writes to online store in near-real-time. Good for session features. (2) Batch materialization: offline pipeline runs, materialises to online store. Acceptable for features that change hourly or daily.

**The consistency problem:**

The training data was generated from the offline store at time T. The online store serves features computed by a possibly different code path. If these diverge (different null handling, different timestamp semantics, different aggregation windows) you have training-serving skew.

The fix is a single feature definition that runs in both contexts. Feast, Tecton, and Hopsworks solve this by providing a Python SDK that generates both offline SQL and online computation from the same feature definition. If you\'re not using one of these, you need strict engineering discipline and integration tests that compare offline vs online feature values on known entities.

**Late-arriving data:**

Event timestamps and processing timestamps differ. A purchase that happened at 14:00 might arrive in your pipeline at 14:03. If your feature window is 1-hour, features computed at 14:01 will be missing the last 3 minutes of purchases. Strategies: (1) Watermarks: process events up to max_timestamp - delay_tolerance. (2) Lambda architecture: fast path for recent data, batch correction pass for accuracy. (3) Design features to be robust to 5-minute staleness.

**Feature versioning:**

Training run 42 used features_v3. Training run 57 used features_v5. When you investigate why run 57 underperformed in production, you need to reproduce the exact features that run 42 used. This requires: (1) Store feature definitions with immutable versioning. (2) Log which feature version was used in each training run. (3) Keep old feature computation code runnable.`,
    tags: ['Feature Store', 'Architecture', 'Online Features', 'Data Engineering'],
    domain: 'features',
    youtube: [{ id: 'qh7bh4YVI2E', title: 'Rethinking Feature Stores with Feast and Tecton — apply() 2021' }],
  },
  {
    id: 8,
    slug: 'mle-interview-system-design-prep',
    title: 'The MLE Interview Framework: What Top Companies Actually Ask',
    category: 'Interview Prep',
    catColor: { bg: 'rgba(240,165,0,0.08)', text: 'var(--violet)', border: 'rgba(240,165,0,0.18)' },
    readMin: 7,
    featured: false,
    excerpt: 'After 200+ MLE interviews (as both candidate and interviewer), here\'s what I\'ve learned about what separates strong candidates from weak ones in the ML system design round. It\'s not about knowing more frameworks. It\'s about a specific sequence of reasoning that signals production ML experience.',
    body: `The ML system design round is 45 minutes. Most candidates spend 35 minutes on architecture and 10 minutes on everything else. Strong candidates invert this.

**The sequence that works:**

Minutes 0–8: Problem framing. What is the target action? What are the latency constraints? What is "good"? What are the scale requirements? Don\'t touch architecture until you have answers to these. Interviewers are testing whether you ask the right questions.

Minutes 8–15: Data and labels. Where does training data come from? What are the label sources (explicit: ratings; implicit: clicks, plays, purchases)? What are the biases? (position bias, selection bias, survivor bias). What is the label delay?

Minutes 15–28: Model architecture. Now you earn the right to talk about two-tower models and GBDTs. But always justify why for the specific constraints you established. "I\'d use a two-tower retrieval model because we need sub-50ms P99 and have 10M+ items" is good. "I\'d use a two-tower model" without justification is not.

Minutes 28–38: Serving infrastructure. Feature store, inference service, caching, latency budget. Work through the latency budget explicitly.

Minutes 38–45: Monitoring. What metrics? What thresholds? What do you do when drift is detected? This is where most candidates run out of time. Budget for it.

**The signals that separate candidates:**

Strong: Mentions position bias before the interviewer does. Brings up cold start unprompted. Discusses evaluation offline vs online. Talks about feature freshness SLAs. Mentions what happens when the model is wrong (graceful degradation).

Weak: Jumps to neural network architecture before understanding the problem. Uses "just use transformer" as a default answer. Can\'t explain what happens at P99 latency. Doesn\'t know what PSI is.

**The calibration question (often asked):**

"If you deploy this model and it\'s getting worse, how do you detect it?" Expected: feature drift monitoring (PSI/KS), prediction distribution monitoring, proxy metric monitoring (predicted CTR vs observed CTR), label delay handling. Not expected: "I\'d check the logs."`,
    tags: ['Interview Prep', 'System Design', 'MLE', 'Career'],
    domain: 'interview',
    youtube: [{ id: 's-MaQ6S9_DA', title: 'ML Engineer Interviews Explained — Exponent' }],
  },
  {
    id: 9,
    slug: 'gradient-descent-intuition',
    title: 'Gradient Descent: What Your Intuition Gets Wrong',
    category: 'Models & Math',
    catColor: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', border: 'rgba(168,85,247,0.2)' },
    readMin: 11,
    featured: false,
    excerpt: 'The "ball rolling down a hill" analogy is everywhere. It\'s also subtly wrong in ways that matter. Loss landscapes for neural networks are not convex bowls. They have saddle points, flat regions, and narrow ravines — and the optimiser you choose determines whether you escape them or get stuck.',
    body: `The standard mental model: we have a loss surface, gradient descent finds the downhill direction, and we step in that direction until we reach the minimum. Simple, intuitive, incomplete.

**Why the bowl analogy fails:**

For neural networks, the loss surface is non-convex and exists in millions of dimensions. Visualisations showing a smooth bowl with a single minimum are generated for two-parameter toy models. Real loss surfaces have: saddle points (gradient = 0 but not a minimum), plateaus (gradient ≈ 0, not a minimum), sharp ravines (very different curvature in different directions), and many local minima.

In high dimensions, local minima are surprisingly rare — saddle points are far more common. The real enemy isn't getting stuck in a local minimum; it's getting stuck near a saddle point where gradients are near zero.

**SGD vs momentum vs Adam:**

SGD: gradient = mean over mini-batch, step = -learning_rate * gradient. Unbiased but high variance. Sensitive to learning rate. Struggles in ravines (oscillates across, moves slowly along).

Momentum: keeps an exponential moving average of past gradients (velocity). Helps escape saddle points. Smooths oscillations in ravines. The β parameter (typically 0.9) controls how much history to retain.

RMSProp: divides the gradient by a running average of squared gradients. Adapts learning rate per parameter. Parameters with consistently large gradients get smaller updates. Useful for sparse features.

Adam: combines momentum and RMSProp. First moment (mean) + second moment (uncentered variance). Bias correction for the first few steps. Most commonly used, but has known convergence issues and can generalise worse than SGD with careful tuning.

**The learning rate is the most important hyperparameter:**

Too high: loss diverges (explodes) or oscillates without converging.
Too low: convergence is slow and may stall near saddle points.
Warmup: start small, ramp up to target, then decay. Standard for transformer training.
Cosine annealing: smoothly reduces learning rate following a cosine curve. Often improves final accuracy.

**Batch size interacts with learning rate:**

Larger batch → more accurate gradient estimate → can use larger learning rate → fewer updates to converge. The linear scaling rule: if you multiply batch size by k, multiply learning rate by k (with warmup). This breaks down at very large batch sizes.

**What practitioners actually get wrong:**

Not checking that training loss is actually decreasing in the first 100 steps. Using Adam's default parameters (lr=0.001) for fine-tuning LLMs without adjusting. Using the same learning rate for all parameter groups. Not visualising the gradient norms over training — norm collapse or explosion is diagnostic. Not logging the loss curve at all.`,
    tags: ['Optimisation', 'Gradient Descent', 'Adam', 'SGD', 'Deep Learning'],
    domain: 'math',
    youtube: [{ id: 'IHZwWFHWa-w', title: 'Gradient descent — 3Blue1Brown' }],
  },
  {
    id: 10,
    slug: 'shap-feature-importance',
    title: 'SHAP Values: Feature Importance That Actually Makes Sense',
    category: 'Model Evaluation',
    catColor: { bg: 'rgba(16,185,129,0.1)', text: 'var(--mint)', border: 'rgba(16,185,129,0.2)' },
    readMin: 9,
    featured: false,
    excerpt: 'Feature importance from a random forest is not the same as feature contribution to a specific prediction. And feature contribution is not the same as causal effect. SHAP values give you the first correctly — and they\'re game-theoretic, not heuristic. Here\'s what that actually means.',
    body: `There are four common ways to compute feature importance, and they measure four different things.

**1. Impurity-based importance (default in sklearn forests):** How much did this feature reduce impurity (Gini/entropy) on average across all splits? Problem: biased toward high-cardinality features. A random UUID feature will have high importance by this measure. Don't use this for anything serious.

**2. Permutation importance:** Randomly shuffle one feature's values, measure the drop in model performance. Measures how much the model relies on this feature. Not biased by cardinality. Slow for many features. Can be misleading when features are correlated — shuffling one correlated feature still leaves signal in the others.

**3. LIME (Local Interpretable Model-agnostic Explanations):** Fit a simple linear model around a specific prediction in the local neighbourhood. Fast, intuitive, model-agnostic. Problem: the neighbourhood is defined heuristically, explanations are unstable, and they don't guarantee consistency between local explanations.

**4. SHAP (SHapley Additive exPlanations):** Based on Shapley values from cooperative game theory. The Shapley value of player i is the average marginal contribution of i across all possible orderings of players.

In ML terms: the SHAP value for feature j on prediction x is the expected change in model output when we add feature j to a coalition, averaged over all possible feature coalitions. It satisfies three axioms: efficiency (SHAP values sum to prediction minus baseline), symmetry (features with equal contributions get equal values), dummy (features with no effect get zero SHAP value).

**TreeSHAP:** For tree-based models (XGBoost, LightGBM, sklearn forests), SHAP can be computed exactly in O(TLD²) where T=trees, L=leaves, D=depth. This is fast enough for production feature attribution.

**What SHAP tells you — and what it doesn't:**

SHAP measures model-based contribution — not causal effect. A feature can have high SHAP values because it's correlated with a causal feature that isn't in the model. Don't use SHAP to make causal claims.

Useful applications: explaining individual predictions to fraud analysts, auditing model behaviour for protected attributes, debugging why a model makes unexpected predictions, prioritising feature development.

**Common misuses:**

Using global SHAP importance (mean |SHAP|) as the only ranking — misses local heterogeneity. Showing SHAP plots without a baseline — the "expected output" interpretation only makes sense with a reference distribution. Using SHAP to justify removing features — high SHAP value can come from a feature correlated with many others; removing it may or may not hurt performance.`,
    tags: ['SHAP', 'Feature Importance', 'Explainability', 'Model Interpretability'],
    domain: 'eval',
    youtube: [{ id: 'VaIXMiNMEJU', title: 'SHAP Values, Clearly Explained — StatQuest' }],
  },
  {
    id: 11,
    slug: 'cold-start-problem',
    title: 'The Cold Start Problem: Beyond Popularity Heuristics',
    category: 'ML System Design',
    catColor: { bg: 'rgba(244,63,94,0.1)', text: 'var(--rose)', border: 'rgba(244,63,94,0.2)' },
    readMin: 10,
    featured: false,
    excerpt: 'Every recommendation system has a cold start problem. Most teams solve it by falling back to popularity rankings. This works for items. It doesn\'t work for users. And it leaves a lot of personalisation quality on the table from the very first session.',
    body: `Cold start manifests in three forms, each requiring a different solution.

**User cold start (new user, no history):**

The wrong approach: show popular items. This creates a feedback loop — popular items get more exposure, accumulate more clicks, become more popular. You end up serving the same 50 items to every new user.

Better approaches:

1. Onboarding signals. Ask for explicit preferences (genre, interest, category). Even 3–5 data points enable personalisation. Spotify's onboarding artist selection reduces cold start significantly. The friction cost is worth the quality gain.

2. Contextual features. Browser/OS, time of day, location, UTM source, device type — all available before the first interaction. A new user arriving via a "Python tutorial" referral is not the same as one arriving from "deep learning paper."

3. Item-based fallback. Instead of "most popular overall," serve "most popular in your apparent context." New user, evening, mobile → entertainment; new user, weekday morning, desktop → professional content.

4. Meta-learning (few-shot). Train a model to quickly adapt to a user with few examples. MAML and its variants. Expensive to train but powerful for high-value users. Used at some scale by Netflix and Spotify for new premium subscribers.

**Item cold start (new item, no interactions):**

Content-based embeddings. Embed items using their metadata (title, description, category, author) using a pretrained encoder. New items immediately have a representation in the same space as established items. Quality improves as interactions accumulate.

Exploration budget. Allocate a fixed fraction of impressions to new items across all users, regardless of predicted CTR. Treat it as a multi-armed bandit problem — Thompson sampling or UCB will naturally allocate more to items that are accruing positive signals.

**System cold start (new recommendation system):**

This is the hardest form. You have no historical interactions at all.

Sequence of phases: (1) Popularity-based serving. Log everything. (2) Content-based model. Build from item metadata + contextual features. No interaction data needed. (3) Collaborative signals. Once you have enough interactions (typically 100k+ user-item events), matrix factorisation or two-tower starts outperforming content-based. (4) Hybrid model. Blend content-based scores with collaborative scores, weighting toward collaborative as interaction data grows.

The mistake is trying to jump to phase 3 too early. A collaborative model trained on 1000 interactions is worse than a well-designed content-based model.`,
    tags: ['Cold Start', 'Recommendation Systems', 'ML System Design', 'Exploration'],
    domain: 'design',
    youtube: [{ id: 'UFpF108gyaw', title: 'Mitigating Cold Start in TensorFlow Recommenders' }],
  },
  {
    id: 12,
    slug: 'distributed-training-patterns',
    title: 'Distributed Training: Data Parallel vs Model Parallel',
    category: 'Models & Math',
    catColor: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', border: 'rgba(168,85,247,0.2)' },
    readMin: 12,
    featured: false,
    excerpt: 'When your model doesn\'t fit on one GPU, you need model parallelism. When it fits but training is too slow, you need data parallelism. When it\'s both, you need pipeline parallelism or tensor parallelism — and the choices interact in non-obvious ways.',
    body: `**Data Parallelism:**

Each GPU gets a full copy of the model and a different mini-batch. Gradients are synchronised across GPUs after each backward pass. This is the default and works well when the model fits in a single GPU's memory.

AllReduce: the standard gradient synchronisation primitive. Each GPU computes its gradients, then AllReduce averages them across all GPUs. With ring-AllReduce (used by NCCL), communication cost is proportional to gradient size × 2, independent of the number of GPUs.

PyTorch DDP (DistributedDataParallel): hooks into the backward pass to overlap gradient communication with backward computation. As soon as a gradient is ready, it starts being communicated while other gradients are still being computed. Near-linear scaling up to ~64 GPUs for large models.

ZeRO (Zero Redundancy Optimizer): addresses memory inefficiency in data parallelism. With naive DDP, each GPU stores the full model parameters, gradients, AND optimiser state. ZeRO-1: shard optimiser state. ZeRO-2: shard gradients. ZeRO-3: shard parameters. ZeRO-3 reduces per-GPU memory by the number of GPUs but introduces communication overhead.

**Model Parallelism:**

When the model doesn't fit on one GPU. Two main variants:

Tensor parallelism: split individual layers across GPUs. A matrix multiply A × B is split so each GPU holds a column shard of B and computes a partial result. Requires all-to-all communication for each layer. Used in Megatron-LM for large transformer models.

Pipeline parallelism: split the model into stages, each stage on a different GPU. GPU 1 processes layers 1–8, GPU 2 processes layers 9–16, etc. The key challenge: GPU 2 is idle while GPU 1 processes the first micro-batch. Solved with micro-batching: break each batch into 8 micro-batches, pipeline them through the stages. GPU utilisation approaches ~(n-1)/n where n is the number of stages.

**3D Parallelism:**

Large language models (GPT-3, PaLM scale) use all three simultaneously: data parallelism across groups of GPUs, pipeline parallelism across stages within a group, tensor parallelism within each stage. Megatron-DeepSpeed uses this configuration for models with hundreds of billions of parameters.

**Gradient accumulation:**

Simulates a larger batch size by computing gradients over multiple micro-batches before updating. Useful when you can't increase batch size due to memory but want the stability benefits of larger batches. gradient_accumulation_steps=8 with micro_batch=16 is equivalent to batch=128.

**Practical guidance:**

Start with DDP. Add ZeRO stages if you need memory relief. Only add model parallelism if the model genuinely doesn't fit on a single node. Communication costs scale super-linearly with node count — profile before scaling.`,
    tags: ['Distributed Training', 'Data Parallel', 'Model Parallel', 'ZeRO', 'Deep Learning'],
    domain: 'dl',
    youtube: [{ id: 'SivkGd6LQoU', title: 'Distributed Data Parallel Training in PyTorch' }],
  },
  {
    id: 13,
    slug: 'ml-interview-mistakes',
    title: '10 ML Interview Mistakes Even Senior Engineers Make',
    category: 'Interview Prep',
    catColor: { bg: 'rgba(240,165,0,0.08)', text: 'var(--violet)', border: 'rgba(240,165,0,0.18)' },
    readMin: 8,
    featured: false,
    excerpt: 'These aren\'t mistakes made by junior candidates who don\'t know the material. These are the subtle, frustrating errors that sink engineers who absolutely know what they\'re talking about — but don\'t know how to show it in 45 minutes.',
    body: `**1. Starting architecture before framing the problem.**

The single most common mistake at Staff level. An interviewer says "design a recommendation system for Spotify." The candidate immediately starts drawing boxes: two-tower model, HNSW index, Redis feature store. The interviewer asks: "what latency constraint are you designing for?" Silence.

Fix: spend the first 8 minutes on problem framing. Users and their goals. Latency. Scale. Constraints. The architecture flows from the constraints.

**2. Treating AUC as the only metric.**

Recommending AUC when asked "how would you evaluate this model" signals shallow evaluation knowledge. Real answer: what does success mean for the business? CTR? Session length? Revenue? Then: what offline proxy best predicts online success? Then: how do you validate that the offline metric actually predicts the online metric?

**3. Not knowing what P99 latency means for your system.**

If you can't give a rough latency budget for your design (e.g., "10ms feature fetch + 45ms retrieval + 8ms ranking = 63ms total, P99 should be under 100ms"), you don't have a production ML system — you have a notebook experiment.

**4. Saying "I'd use a transformer" without justification.**

Transformers are powerful. They're also slow, expensive, and overkill for tabular data, sparse feature models, and many production ranking systems. "I'd use a transformer" without latency/scale analysis signals that you're applying learned patterns, not reasoning.

**5. Confusing offline and online evaluation.**

"Our model has AUC 0.96" — offline metric. "Our CTR increased 3%" — online metric. The gap between them is where production ML fails. Interviewers at senior levels will probe: how do you know your offline metrics predict online improvement? What have you seen break this correlation?

**6. Ignoring data quality and label noise.**

Strong candidates mention: what are the label sources? What biases do they have? Position bias, selection bias, label delay. "Implicit feedback (clicks) is biased toward popular items" demonstrates practical knowledge. Ignoring it signals academic exposure only.

**7. Not knowing when NOT to use ML.**

A question like "how would you personalise the home feed for a platform with 100 users?" should be answered with "I wouldn't use ML yet — build good heuristics, instrument them, collect data, then train a model once you have 10,000+ users and a defined success metric." Applying ML to every problem signals poor engineering judgment.

**8. Describing monitoring as an afterthought.**

Saying "and then we'd monitor it" at minute 42 of a 45-minute interview. Strong candidates allocate time for monitoring because they've been paged at 2am. What specific metrics would you alert on? What's the threshold? What do you do when an alert fires?

**9. Not discussing failure modes.**

"What happens if the model is down? What happens if the feature store returns stale data? What happens if a new item has no embedding?" These aren't trick questions — they're the most important questions. Production ML engineers have been burned by these.

**10. Not asking clarifying questions when uncertain.**

Spending 20 minutes designing a batch inference system when the interviewer had real-time in mind. Or vice versa. Clarifying questions aren't a sign of weakness — they're a sign you understand that requirements matter. Ask once, confirm your understanding, then proceed.`,
    tags: ['Interview Prep', 'MLE', 'Senior Engineer', 'Career', 'System Design'],
    domain: 'interview',
    youtube: [{ id: 'v6bzNvEi-k8', title: 'How to Crack Senior-level ML Interviews: Insider Tips' }],
  },
  {
    id: 14,
    slug: 'ml-engineer-salary-map-2025',
    title: 'The ML Engineer Salary Map 2025: Where the Money Is, and Why It\'s There',
    category: 'ML Careers',
    catColor: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
    readMin: 14,
    featured: true,
    excerpt: 'In 2025, a Staff ML Engineer at a Bay Area hyperscaler earns more in total compensation than a mid-stage startup\'s entire monthly burn rate. A senior MLE in London earns roughly 60% of that. Bangalore, 25%. The gap isn\'t random — it traces the precise contour of where ML creates economic value, who controls compute, and which cities built the institutional density that attracts ML talent. This is the map.',
    body: `The most expensive zip code in tech is not a zip code. It's a job title. "Staff Machine Learning Engineer, FAANG" currently commands $400,000–$700,000 in total annual compensation in the San Francisco Bay Area. The base salary component — roughly $200–250k — is almost a footnote. The rest is equity appreciation on stock that compounds alongside a company whose growth is structurally linked to ML capability.

To understand why, you have to understand what ML actually does for a hyperscaler. A 0.5% improvement in Google's ad click-through rate is worth, conservatively, $1 billion annually. A 1% improvement in Netflix's recommendation engagement avoids roughly 3 million subscriber cancellations. The economic leverage on a single well-calibrated model is extraordinary. Engineers who can build, deploy and maintain those systems are correspondingly expensive.

**The numbers, by level and geography:**

At US Big Tech (FAANG + near-FAANG: OpenAI, Anthropic, Databricks, Snowflake, Stripe):

L3 / New grad / 0–2 years: Base $150–180k. Total compensation including RSUs and bonus: $190–240k. You are expected to own specific features and ship with guidance.

L4 / Mid / 2–4 years: Base $175–220k. TC: $250–350k. You are expected to own modules end-to-end and identify problems before being asked.

L5 / Senior / 4–8 years: Base $210–270k. TC: $320–500k. This is where compensation variance explodes. Strong L5s at top-tier companies with equity appreciation can exceed $600k in good market years.

L6 / Staff / 8–15 years: Base $250–320k. TC: $450–800k. You are often setting technical direction for teams of 8–20 engineers. Equity packages at this level are frequently refreshed annually.

L7 / Principal / 15+ years: TC $700k–$1.5M+. There are fewer than 2,000 people at this level across the industry worldwide.

**The UK: good money, different maths.**

London is the dominant ML hub in Europe, and its salaries reflect that — without reflecting American total compensation packages. UK equity culture is materially weaker. Base salaries are higher than continental Europe; tax rates are higher than the US.

Junior MLE: £50–70k base ($63–88k). Senior MLE: £120–160k ($150–200k). Staff: £180–250k, often without the equity kicker that makes US packages extraordinary. The TC gap with San Francisco is real and it's roughly 2–3× at senior levels when equity is included.

What you get in return: a functional work-life balance culture, 28+ days of holiday, excellent healthcare without fighting with insurance, and cities that are genuinely pleasant to live in. The financial delta is a lifestyle trade.

**Germany: engineering culture, not finance culture.**

Berlin's ML scene is authentic but its compensation is not Silicon Valley. Senior MLE in Berlin: €100–140k. Staff: €150–180k. The tax burden is significant (42%+ effective rate at senior levels). Net take-home at €150k gross in Germany is roughly equivalent to net take-home at £100k in the UK.

Where Germany punches above its weight: research, automotive ML (BMW, Mercedes, Volkswagen have large ML teams), and European AI regulation expertise, which is becoming a specialised and well-compensated skillset.

**Canada: the talent magnet, under pressure.**

Toronto and Vancouver absorbed enormous ML talent during peak US immigration bottlenecks. The trade-off: Canadian tech salaries are in CAD (roughly 0.73× USD), tax rates are high, and the strongest companies are US firms with Canadian outposts.

Senior MLE at a US company's Toronto office: CAD $150–200k ($110–145k USD). The calculus is often: Canadian salaries for Canadian cost of living, which works, but doesn't build the wealth that a US equity package compounds over a decade.

**India: compressed ranges, explosive growth.**

Bangalore and Hyderabad have emerged as genuine ML engineering cities — not just service centres. The top 10% of Indian MLE salaries now look like this: Senior at tier-1 company (Google/Meta/Amazon India): ₹60–100 lakh ($72–120k USD). Startup unicorns: ₹40–80 lakh with equity. Mid-tier: ₹20–40 lakh.

The key insight is that Indian ML compensation has compressed dramatically at the top end as global companies compete for genuinely world-class engineers. The Bangalore-to-Bay-Area delta is still large, but the Bangalore-to-London delta at senior levels is narrowing.

**The non-obvious salary signals:**

Company stage matters more than company prestige. A Series B startup that just closed a $100M round at a $1B valuation, hiring their founding MLE team, will grant equity worth $500k–$2M at exit — if the exit happens. A Google L5 role is more certain; the upside ceiling is lower.

Specialisation has become a salary lever. LLM infrastructure engineers, ML compilers, RLHF specialists, and ML security engineers currently command 20–40% premiums over generalist MLEs at equivalent levels because supply is extremely thin.

The real hidden variable: refresh grants. At senior levels, companies compete by refreshing equity annually. An L6 at a top-tier company might receive $150–200k in new RSU grants each year on top of their original package. Over five years, this compounds into a retirement number.

**What this means for your decisions:**

If you're early career: chase scope, not salary. The L3 who owns a production ML system at a $50B company will outcompete the L3 debugging scripts at a $500B company three years later, because their skills will be worth far more when they interview again.

If you're mid-career: optimize for equity velocity. The question isn't "what does this job pay today?" It's "what does this company's stock price do over the next four years, and what fraction of that upside am I capturing?"

If you're senior: location flexibility is compensation. Working remotely for a San Francisco company while living in Lisbon, Porto, or Berlin is not a salary cut — it's a purchasing-power raise of 40–60%.

The map is not the territory. These are medians and ranges. The engineer who deploys the model that increases Amazon's recommendation CTR by 0.3% earns considerably more than the median. Compensation in ML is power-law distributed in the same way ML system impact is. The leverage is real, in both directions.`,
    tags: ['Salary', 'Career', 'ML Jobs', 'Total Compensation', 'Global', 'FAANG'],
    domain: 'career',
    youtube: [{ id: 'PFbXCIMlfc8', title: 'What I Actually Do as a Machine Learning Engineer' }],
  },
  {
    id: 15,
    slug: 'how-netflix-became-an-ml-company',
    title: 'How Netflix Became an ML Company (and What Every Engineer Can Learn From It)',
    category: 'ML Careers',
    catColor: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
    readMin: 16,
    featured: false,
    excerpt: 'In 2006, Netflix offered $1 million to anyone who could improve its recommendation algorithm by 10%. Three years and 40,000 teams later, they awarded the prize — and never deployed the winning algorithm. The model was technically superior. It was also incompatible with the infrastructure Netflix had built while waiting. The story of how Netflix became one of the most sophisticated ML companies on earth begins not with brilliant engineering but with that particular failure, and what they learned from it.',
    body: `The Netflix Prize is the most cited example in recommendation systems literature. It is also, depending on how you read it, either a spectacular success or a cautionary tale. Netflix got what it actually wanted — a decade of academic attention on collaborative filtering — but not what it nominally offered: a deployable recommendation system.

The winner, BellKor's Pragmatic Chaos, achieved a 10.06% improvement on the Prize dataset by ensembling over a hundred different algorithms. It worked beautifully on the DVD rental dataset the competition used. It did not work on Netflix's actual streaming product, which had fundamentally different user behaviour, different item catalogs, and a different implicit feedback signal (plays, not ratings). The infrastructure to serve a 100-model ensemble in real-time didn't exist and wasn't worth building.

This is the first lesson from Netflix: the metric you optimise for during development is not always the metric that matters in production.

**The streaming transition changes everything.**

When Netflix made the transition from DVDs to streaming in 2007–2010, it faced a recommendation problem that was qualitatively different from the Prize problem. The DVD model relied on explicit ratings — stars out of five. Streaming generated implicit feedback: play, pause, rewatch, scroll-past, abandon-at-minute-12. These signals are noisier, more ambiguous, and richer simultaneously. A user who watched 80% of a documentary and never rated it has given you more information than a user who gave it four stars.

Netflix's engineering teams spent years building the infrastructure to turn those implicit signals into features. What fraction of the runtime did the user watch? Did they rewatch the cold open? Did they start an episode at 11pm on a Tuesday and abandon it after 8 minutes? These are all features. Building the systems to compute them reliably — at scale, with point-in-time correctness, with < 1 hour latency — was a larger engineering project than the recommendation model itself.

This is the second lesson: feature infrastructure is the foundation. The model is the roof. Everyone builds the roof first.

**The personalisation architecture that actually shipped:**

By 2013, Netflix had moved from a single global recommendation system to a multi-layered personalisation stack. The top layer is a candidate generator: a retrieval model that narrows 200 million titles (not all available in every region, but you understand the scale) to a few hundred relevant candidates. The second layer is a ranking model that scores those candidates for a specific user, in a specific context (device, time of day, recent viewing history). The third layer handles diversity and business constraints: don't show the same genre three times in a row; always surface a title that's trending nationally; don't surface content the rights to which expire in 72 hours.

The ranking model — which Netflix has discussed publicly in several engineering blog posts and academic papers — is a two-stage ensemble. The first stage uses matrix factorisation over the full viewing history to produce a user embedding. The second stage uses those embeddings plus contextual features (session length, device, hour of day, day of week) in a gradient boosted tree that predicts a single probability: will this user click play on this title and watch at least 70% of it?

That single probability, estimated billions of times per day per user, is what determines what you see on your home screen.

**The rows are the product.**

The insight that unlocked Netflix's current personalisation depth is deceptively simple: the row is the interface. The Netflix home screen is a sequence of rows: "Because you watched Breaking Bad," "Critically Acclaimed Dramas," "New Releases," "Continue Watching." The model doesn't just decide what to show — it decides which rows to show, in which order, and what to title them.

This means Netflix runs hundreds of ML models simultaneously to construct a single home screen. Each row is a separate retrieval problem. The row order is a ranking problem. The row title is a natural language generation problem (in some cases). The thumbnail you see for each title is an A/B-tested personalised image — ML-generated variants are tested at the individual user level to find which visual style predicts a click.

Netflix has published research showing that the right thumbnail can improve play rates for a title by 20–30%. This is not a trivial engineering problem: generating, hosting, serving and testing 20+ thumbnail variants per title per market is a significant infrastructure investment. It's also a pure ML problem: which visual attributes (facial expressions, colour palette, scene type) predict engagement for which user segment?

**The infrastructure that makes it possible:**

Netflix's ML infrastructure is not public, but significant portions of it have been described in engineering blog posts and conference talks. Key components:

Meson (workflow orchestration): Netflix built its own workflow engine for ML pipelines because the available open-source tools in 2015–2018 were inadequate for their scale. The system manages hundreds of training pipelines running on daily or hourly cadences.

Metaflow (open-sourced in 2019): a Python library for managing ML workflow lifecycles. Netflix open-sourced it after building it internally, which is unusual for core infrastructure.

Hollow (data propagation): Netflix's framework for broadcasting read-only data to all nodes in a distributed system. Used to propagate model weights, feature dictionaries, and catalog metadata to serving infrastructure globally.

Feature stores: Netflix has described a multi-tier feature store architecture similar to what we covered in the Feature Store architecture post — offline Hive tables for training, real-time Redis/EVCache for serving, and batch materialisation pipelines connecting them.

**What other companies learned from Netflix:**

The Netflix Prize's long-term impact was not the algorithms it produced — most of them were superseded within years. Its impact was cultural and structural. It established "recommendation system improvement" as a quantifiable, competitive engineering problem. It attracted a generation of researchers and engineers who went on to build the recommendation systems at Spotify, YouTube, TikTok, Amazon, and LinkedIn.

The more durable lessons are systems lessons: personalisation is infrastructure before it's algorithms; implicit signals outperform explicit ones at scale; the evaluation metric you choose determines what your system optimises for, and that choice has more impact than model architecture; and the gap between offline experiment and production deployment is where most ML value is lost.

**The number that runs Netflix:**

If you work at Netflix in any product capacity, you eventually learn about one metric more than any other: the predicted probability that a user will play the next recommended title within 60 seconds of landing on the home screen. Teams across the company — content acquisition, original production, thumbnail design, notification timing, UI layout — are all ultimately optimising toward or away from that moment.

The entire Netflix ML enterprise, which now employs several hundred ML and data scientists, exists in service of improving that one number by fractions of a percent. A 1% improvement in that probability is estimated to retain millions of subscribers who would otherwise churn. At $15–20 per month per subscriber, the math on a single basis point of recommendation quality is extraordinary.

This is the third and most important lesson from Netflix: find the one number, instrument it perfectly, and align everything — engineering, product, content, design — around moving it. The ML follows naturally.`,
    tags: ['Netflix', 'Case Study', 'Recommendation Systems', 'ML Industry', 'Feature Stores'],
    domain: 'design',
    youtube: [{ id: 'IByC2keY3vo', title: 'Trends in Recommendation & Personalization at Netflix — Justin Basilico' }],
  },
  {
    id: 16,
    slug: 'real-ml-stack-seed-to-scale',
    title: 'The Real ML Stack: From Jupyter Notebook to $10B Infrastructure',
    category: 'ML Careers',
    catColor: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
    readMin: 13,
    featured: false,
    excerpt: 'Stage 0 of the ML stack is a Jupyter notebook, a CSV, and a model.pkl. Don\'t laugh. Twitter\'s early recommendation system was basically this. The graveyard of failed ML projects is full of teams who tried to deploy Kubernetes-orchestrated, feature-store-backed, model-registry-managed systems before they\'d shipped a single prediction to a single user. This is the honest guide to what the stack looks like at every stage — and when to graduate from each one.',
    body: `There is a pattern that kills ML projects at startups so reliably you could set your watch to it. The founding ML engineer joins, sets up a sophisticated infrastructure, spends three months configuring MLflow, Kubeflow, and a feature store. Six months later, they haven't shipped a prediction to a user. They resign, citing "organizational dysfunction." The dysfunction was real but it was downstream of a bad decision: optimising for the stack that Google uses rather than the stack that solves today's actual problem.

The right ML stack is not the most sophisticated one. It's the one that matches your engineering maturity, your data volume, your team size, and the stage of your ML product lifecycle.

**Stage 0: Proof of concept (seed stage, 1–3 ML practitioners)**

Stack: Python, Jupyter, pandas, scikit-learn. Database: Postgres or even CSV. Serving: a Flask API or FastAPI endpoint reading from a pickle file. Experiment tracking: a spreadsheet. Feature store: a function that transforms a database query into a dict.

This is not embarrassing. This is correct. At Stage 0, the question you're answering is: does ML add value to this product? That question does not require Kubernetes. It requires a model that outperforms a heuristic and a deployment mechanism that puts predictions in front of users.

The failure mode here is premature abstraction: building generic feature pipelines before you know which features matter, building a retraining scheduler before you know how fast your data drifts, building a model registry before you have more than one model.

Ship something. Measure it. Then decide what infrastructure the problem actually requires.

**Stage 1: From notebook to production (Series A, 2–6 ML engineers)**

The inflection point is when you have 2+ models in production, your data volume exceeds what pandas handles comfortably, and you're manually retraining models because you don't have a pipeline.

Stack additions: MLflow or Weights & Biases for experiment tracking (you're now running more than 10 experiments per week and need to compare them). Docker for reproducibility. Airflow or Prefect for pipeline orchestration. A proper feature computation layer (even if it's just functions in a shared library — not a full feature store yet). Cloud training: SageMaker, Vertex AI, or spot instances.

The critical discipline at this stage: don't skip reproducibility. "Works on my laptop" is expensive at this stage because you now have 3–5 engineers reproducing each other's environments. Containerise early.

Also critical: build a shadow evaluation system. Every model you promote to production should run in shadow mode alongside the incumbent for at least 1–2 weeks. The number of production incidents that shadow mode prevents is enormous. The number of teams that skip it, confident in their offline metrics, is also enormous.

**Stage 2: Platform thinking (Series B, 5–15 ML engineers)**

You now have enough models, enough engineers, and enough training runs that the overhead of managing them manually exceeds the cost of building infrastructure. This is when platform investment pays off.

Stack: Feature store (Feast, Tecton, or Hopsworks — or a homegrown equivalent). Model registry (MLflow Model Registry or custom). CI/CD for models (training pipelines that trigger on data updates, with automated evaluation gates). Monitoring infrastructure (drift detection, prediction distribution tracking). A/B testing framework integrated with your serving layer.

The common mistake here is building too much custom infrastructure. Every hour your ML engineers spend maintaining a custom feature store is an hour not spent on model quality. Evaluate managed services aggressively. SageMaker Feature Store, Vertex Feature Store, and Databricks Feature Store are not perfect but they're maintained by someone else.

The meta-principle: your ML platform should be opinionated enough to enforce reproducibility and safe deployment, but not so opinionated that it slows down experimentation. The best ML platforms feel like they enable rather than constrain.

**Stage 3: Scale infrastructure (Series C to IPO, 15–50+ ML engineers)**

At this stage, the abstractions that worked at Stage 2 start breaking. MLflow's tracking server becomes a bottleneck. Your feature store's compute layer can't handle the volume. You start having ML-specific reliability incidents (the retraining pipeline fails silently; a feature value distribution shifts and no one notices for two weeks; the model serving layer has a memory leak that only manifests under sustained load).

Stack investments: Dedicated ML platform team (separate from ML practitioners). Custom training infrastructure on bare metal or reserved instances (spot instances have too much variance for latency-sensitive training jobs). Multi-region serving with failover. Online/offline feature consistency testing (automated regression tests that verify serving features match training features on known inputs). Full lineage tracking (which model version made which prediction for which user — required for debugging and regulatory compliance).

The companies that do this well (Airbnb, Uber, Lyft, Spotify) all reached the same conclusion: the generic tools weren't good enough for their specific constraints, and they built custom solutions. Uber's Michelangelo, Airbnb's Bighead, Lyft's Flyte, LinkedIn's Pro-ML — all of these exist because the off-the-shelf tools had gaps that became expensive at scale.

**Stage 4: The hyperscaler stack (FAANG, 100+ ML engineers)**

At Google, Meta, Amazon, and Microsoft, ML infrastructure is itself a product. Google's TFX (TensorFlow Extended) pipeline framework is used externally but was built internally. Meta's FBLearner Flow handles thousands of model training runs per day. Amazon SageMaker is a productisation of what Amazon's internal ML teams needed.

The key characteristic of hyperscaler ML stacks is that they optimise for different things than earlier stages: reproducibility at the billion-parameter scale, incremental training on streaming data, hardware utilisation (TPU/GPU allocation is itself a complex scheduling problem), and ML regulatory compliance (model cards, audit trails, explainability tooling).

Most engineers will never work at this stage. That's fine. The engineering challenges are fascinating but the job is more infrastructure than ML. The people building TFX write very little Python and a lot of C++.

**The question you should always ask:**

Before adding any tool to your ML stack, ask: what specific failure mode does this tool prevent? If you can't name the failure mode, you don't need the tool yet. Feature stores prevent training-serving skew — but only if you've observed training-serving skew causing a problem. Model registries prevent "which version of the model is in production?" — but only if you have enough models that this is actually confusing.

Stack complexity is technical debt that compounds. Build for the problems you have today, with one quarter of headroom for where you'll be in six months. That's it.`,
    tags: ['ML Stack', 'MLOps', 'Career', 'Startup', 'Infrastructure', 'SageMaker', 'MLflow'],
    domain: 'career',
    youtube: [{ id: 'BPYOsDCZbno', title: 'Lecture 02: Dev Infrastructure & Tooling — FSDL 2022' }],
  },
  {
    id: 17,
    slug: 'alexnet-to-agents-ml-decade',
    title: 'AlexNet to Agents: The Twelve Years That Rewrote Everything',
    category: 'ML Careers',
    catColor: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
    readMin: 18,
    featured: false,
    excerpt: 'On September 30, 2012, Geoffrey Hinton\'s students submitted a paper to NIPS. The model was called AlexNet. The top-5 error rate on ImageNet was 15.3%, against the second-place team\'s 26.2%. The gap wasn\'t close. It wasn\'t incremental improvement. It was a discontinuity — the moment deep learning stopped being an academic curiosity and started being an industrial force. What followed in the next twelve years rewrote every assumption about what machines could do.',
    body: `Before AlexNet, the dominant view in AI research was that deep neural networks were theoretically interesting but practically limited. They required too much data, too much compute, and too much tuning to be reliable. The field had spent a decade on support vector machines, kernel methods, and handcrafted feature engineering. ImageNet's 1,000-class classification benchmark had been beaten, barely, year after year by teams with deep domain expertise and painstakingly designed feature extractors.

Then Hinton's team — Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton — trained a convolutional neural network on two GTX 580 GPUs for several days and submitted it to the NIPS 2012 competition. The gap in performance wasn't a matter of tuning. It was a different category of result. The second-place team achieved 26.2% top-5 error. AlexNet achieved 15.3%.

The paper was accepted. The field pivoted.

**2012–2015: The GPU era begins.**

The three years following AlexNet were a period of rapid replication and extension. VGGNet in 2014 demonstrated that deeper networks with smaller filters outperformed AlexNet. GoogLeNet (Inception) in 2014 introduced inception modules that made networks more parameter-efficient. ResNet in 2015 introduced skip connections that allowed networks of 152+ layers — solving the vanishing gradient problem that had previously capped depth.

During this period, two things happened simultaneously: ImageNet error rates fell from human-level to below-human, and the compute required to train state-of-the-art models doubled roughly every 18 months. Both trends would accelerate dramatically in the following years.

Also in 2014: Ian Goodfellow invented GANs — Generative Adversarial Networks — while arguing with a friend at a bar in Montreal. The paper, written in a single weekend, introduced the idea of two networks competing: a generator producing synthetic data, a discriminator trying to distinguish real from synthetic. GANs would go on to produce photorealistic faces (StyleGAN), generate realistic audio and video, and become the architecture underlying the first wave of AI art tools.

**2015–2017: The platforms arrive.**

Google open-sourced TensorFlow in November 2015. Six months later, it had more GitHub stars than any other ML framework. The democratisation of deep learning — which had previously required significant expertise to implement from scratch — accelerated immediately. Courses, tutorials, and projects proliferated.

Facebook released Caffe2. A year later, it released PyTorch, which took an imperative programming approach that researchers found significantly more intuitive. The PyTorch vs TensorFlow debate consumed enormous amounts of engineering energy from 2017 to 2019, until TensorFlow 2.0 adopted PyTorch's eager execution model and the distinction narrowed.

In 2016: AlphaGo beat Lee Sedol 4–1. This was not significant because of Go — Go had seemed AI-intractable for decades and many researchers thought solving it wouldn't generalise. It was significant because of the reinforcement learning architecture: Monte Carlo Tree Search guided by deep neural networks, trained through self-play. The technique would later underpin AlphaFold, which solved protein structure prediction, and would contribute to the RLHF technique used to align large language models.

**2017: The paper that changed everything.**

"Attention Is All You Need" was submitted to arXiv in June 2017 by eight researchers at Google Brain and Google Research. It introduced the Transformer architecture — a network built entirely on self-attention mechanisms, dispensing with the recurrence that had dominated sequential modelling since the early 2000s.

The immediate application was machine translation, where the Transformer set a new state of the art. The implications were not immediately obvious. In retrospect, the architecture had several properties that made it uniquely suited for scaling: it parallelised completely during training (no sequential computation constraints), it handled variable-length inputs naturally, and its parameter count scaled gracefully with available compute.

GPT-1 (Generative Pre-trained Transformer) appeared in 2018, from a small research team at OpenAI. The idea was straightforward in retrospect: pre-train a large Transformer on a large text corpus using next-token prediction, then fine-tune on downstream tasks with a small labelled dataset. The pre-trained representations transferred remarkably well. BERT, published by Google two months later, applied bidirectional pre-training and achieved state of the art on 11 NLP benchmarks simultaneously.

The pre-training + fine-tuning paradigm replaced nearly every previous approach to NLP within 18 months.

**2020: The scaling hypothesis becomes the scaling law.**

In January 2020, OpenAI published "Scaling Laws for Neural Language Models" — a paper that analysed how language model performance scales with compute, data, and parameters. The finding was clean: loss decreases as a smooth power law as you scale any of the three. There's no diminishing returns regime in the range they studied.

This was the empirical foundation of the "just scale it" approach that dominated the following years. GPT-3, released in May 2020 with 175 billion parameters, was 100× larger than GPT-2. It demonstrated few-shot learning — the ability to perform new tasks from a handful of examples in the prompt — that had not been explicitly trained for. The capabilities appeared emergent: not present at smaller scales, suddenly present at GPT-3's scale.

GitHub Copilot, powered by a fine-tuned Codex model, launched in limited beta in 2021. By 2022, it had been used to write hundreds of millions of lines of code. The productivity improvement for software engineers was measurable and significant. This was the first mass-market ML product that changed how a professional skill was practiced.

**2022: The threshold moment.**

ChatGPT launched on November 30, 2022. It reached one million users in five days. One hundred million users in two months. No consumer internet product had ever grown that fast. The fact that it was genuinely useful — that it could write code, draft emails, explain concepts, generate stories — was not what surprised most observers. What surprised them was that it worked well enough, consistently enough, to be usable without a machine learning background.

The key enabling technology was RLHF — Reinforcement Learning from Human Feedback — the technique developed at OpenAI to align language models to human preferences. The training process involved human raters ranking model outputs, with those rankings used to train a reward model, which was then used to fine-tune the base language model via PPO. The result was a model that was better at following instructions, less likely to produce harmful outputs, and significantly more useful for practical tasks than base GPT models.

Also in 2022: Stable Diffusion, DALL-E 2, and Midjourney demonstrated that text-to-image generation had crossed a quality threshold. The cultural impact was immediate and contested.

**2023–2025: The inference era.**

The period from 2023 to the present is characterised by a shift from "can we build capable models?" to "can we deploy them cheaply enough to be economically viable?" Training costs are enormous but one-time; inference costs are per-request and accumulate at scale.

This pressure produced several significant developments: quantisation (reducing model precision from 32-bit to 8-bit or 4-bit with minimal quality degradation), speculative decoding (using a small draft model to predict tokens, verified in parallel by the large model), mixture-of-experts architectures (routing each token to a small fraction of model parameters, reducing active compute), and the emergence of smaller, instruction-tuned models (Llama 2/3, Mistral, Phi) that achieved GPT-3.5 quality at a fraction of the cost.

The reasoning models that emerged in 2024 — OpenAI's o1, Google's Gemini Thinking, Anthropic's extended thinking, DeepSeek-R1 — represented a qualitative shift: rather than producing outputs directly, these models spent compute generating intermediate reasoning steps before answering. The technique, sometimes called "thinking at inference time," traded compute for accuracy on complex problems.

Agents — systems that use LLMs to orchestrate multi-step tasks, call external tools, and maintain state across interactions — emerged as the dominant application paradigm of 2024–2025.

**What it means to be an ML engineer in 2025:**

The twelve years from AlexNet to agents expanded the domain of ML practice enormously. In 2012, ML engineering was primarily about feature engineering, model selection, and offline evaluation. The GPU was a training accelerator. The deployment was a batch job.

In 2025, ML engineering encompasses distributed training systems managing thousands of GPUs, real-time serving infrastructure handling millions of requests per second, prompt engineering and fine-tuning for language models, multi-modal systems processing text, image, audio, and video simultaneously, agent orchestration frameworks managing complex multi-step workflows, and ML safety and alignment as an engineering discipline.

The field that was a niche within data science in 2012 is now a primary driver of engineering investment at every company above a certain scale. The skills that matter have changed four times in twelve years. They will change again.`,
    tags: ['ML History', 'AlexNet', 'Transformer', 'GPT', 'Deep Learning', 'Timeline'],
    domain: 'dl',
    youtube: [{ id: 'kCc8FmEb1nY', title: "Let's build GPT from scratch — Andrej Karpathy" }],
  },
  {
    id: 18,
    slug: 'where-in-the-world-to-be-mle',
    title: 'Where in the World to Be an ML Engineer in 2025',
    category: 'ML Careers',
    catColor: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
    readMin: 12,
    featured: false,
    excerpt: 'British ML engineers earn about 60% of what their San Francisco counterparts make. Berlin is 50%. Bangalore is 20%. But salary is only one variable. Tax rates, cost of living, work culture, visa pathways, research ecosystems, startup density, and the quality of the ML community around you all shape what a city actually offers an ML career. Here is the honest, un-romanticised picture of every major ML hub in 2025.',
    body: `Let's begin with the uncomfortable arithmetic. A Senior ML Engineer in San Francisco earns, in total compensation, approximately $400,000 per year. The same engineer in London earns £140,000 — about $175,000. Berlin: €130,000, about $140,000. Toronto: CAD $180,000, about $130,000. Bangalore: ₹80 lakh, about $96,000.

These gaps are large. They are also, in important ways, misleading.

**San Francisco and the Bay Area: the gravity well.**

The Bay Area is not where ML engineering is best paid. It's where the intersection of compensation, ML institutional density, and career trajectory is most favourable. The distinction matters.

Within a 30-mile radius of downtown San Francisco, you have: OpenAI, Anthropic, Google DeepMind, Meta AI, Apple ML, NVIDIA, Waymo, Scale AI, Cohere, Databricks, and hundreds of ML-first startups. The concentration of talent means the ML community is real — conferences, meetups, informal networks of engineers who have worked at three of the same companies. Peer learning compounds.

What it costs: median rent for a one-bedroom apartment in San Francisco in 2025 is approximately $3,200/month. A senior MLE earning $350k TC takes home roughly $210–230k after federal, state (California: 13.3% top bracket), and payroll taxes. That's a comfortable life, not a lavish one. The financial proposition depends almost entirely on equity appreciation.

The hidden variable: visa. If you're not a US citizen or permanent resident, the H-1B pathway is a lottery. The EB-1/EB-2 pathway requires either extraordinary ability or an employer willing to sponsor a multi-year process. Many non-US ML engineers find the visa uncertainty prohibitive.

**London: the sensible option.**

London is the most mature ML hub outside the Bay Area. DeepMind (now Google DeepMind) is here. Stability AI was here. The UK has a strong academic pipeline from Oxford, Cambridge, Edinburgh, UCL, and Imperial. The Government has invested in the Alan Turing Institute as a national ML research body.

The compensation differential with San Francisco is real (roughly 2–2.5× at senior levels when equity is included) but the lifestyle delta is significant in London's favour. Offices actually close at 6pm. Annual leave is 28+ days. Healthcare requires no insurance navigation. The city is genuinely cosmopolitan in a way that non-American ML engineers find easier to navigate.

The UK's Global Talent Visa is one of the more functional high-skill immigration pathways globally. Endorsement by the Royal Society, Royal Academy of Engineering, or Tech Nation (before it closed) was achievable for strong ML candidates. The post-study visa for international students at UK universities is 2 years.

Concern: post-Brexit talent movement friction has slowed the flow of EU talent into London's ML ecosystem. The community is still strong but growth has slowed compared to 2015–2020.

**Berlin: the research city.**

Berlin has a specific ML identity: it's a research city, not a product city. The ML ecosystem here is anchored by academic and government-funded institutions — Helmholtz AI, BIFOLD, the DFKI — and European operations of US AI labs. Meta AI's European research team is here. Zalando, Delivery Hero, and N26 have significant ML engineering operations.

The compensation is lower and the tax is higher. An ML engineer earning €150k gross in Berlin takes home approximately €80k after income tax and social contributions. The cost of living is meaningfully lower than London (rent for a one-bedroom: €1,400–2,000 in central Berlin), but the gap has narrowed sharply since 2020.

What Berlin offers uniquely: ML regulatory expertise. As the EU AI Act enters enforcement, engineers who understand both the technical and regulatory dimensions of ML deployment are becoming genuinely scarce and well-compensated. Berlin's proximity to EU policymaking institutions (Brussels is 2.5 hours by train) is an advantage that will compound.

**Amsterdam and Paris: the underrated pair.**

Amsterdam has become an unexpected ML hub, anchored by Booking.com's 500-person ML team, TomTom's AI division, and a cluster of ML startups. The Netherlands' 30% ruling for skilled foreign workers (a tax break for high-income expats) makes net compensation more competitive than headline salaries suggest. English proficiency is near-universal, which matters for non-Dutch ML engineers.

Paris has invested heavily in AI leadership, with a stated policy goal of becoming Europe's AI capital. INRIA, the French national computer science institute, has world-class ML research. Criteo, BlaBlaCar, and Deezer have real ML engineering. The language barrier is less significant than perceived — English is standard in tech companies — and the quality of life is genuinely exceptional.

**Toronto, Montreal, and the Canadian corridor.**

Canada's ML scene was built on a single decision: in 2017, the Canadian government launched the Pan-Canadian AI Strategy and funded CIFAR AI Chairs at the Vector Institute (Toronto), Mila (Montreal), and AMII (Edmonton). The researchers who built the academic foundations of deep learning — Hinton, Bengio, LeCun — are here or have ties here.

The result is a genuine academic ML ecosystem that has attracted industry investment. Google, Meta, Microsoft, NVIDIA, and Uber all have ML labs in Toronto or Montreal. The talent pipeline is strong; the salaries are in CAD (which matters); the winters are severe.

The specific Canadian value proposition: you can be close to world-class ML research communities with significantly less visa friction than the US, at a cost of living that's high but manageable. For ML engineers who want to maintain research connections while working in industry, Montreal is arguably the best city in the world.

**Singapore and the Asia-Pacific corridor.**

Singapore has positioned itself as the APAC ML hub, and the positioning is mostly accurate. Grab's ML team is substantial. Sea Limited, ByteDance APAC, Google APAC, and Meta APAC all have ML engineering presence. The government's AI Singapore initiative has invested SGD 500M+ in AI capability.

What Singapore offers: a hub between India and China's talent pools, a low-tax environment (top marginal income tax: 22%), English as an official language, and genuinely world-class infrastructure. The trade: equity culture is weak compared to US, and salaries — while good in local terms — don't match Bay Area numbers.

**Bangalore: the conversation has changed.**

The narrative around Indian ML talent has shifted materially in the last five years. Bangalore is no longer simply a cost-optimisation play. The density of ML engineering talent here — trained at IITs, IITs, and increasingly at international institutions — is genuine. Swiggy, Flipkart, Zomato, PhonePe, and Meesho have sophisticated ML teams. Google, Amazon, and Microsoft have large ML research and engineering offices here.

The compensation has increased rapidly at the top end. A Senior MLE at a tier-1 company in Bangalore earns ₹60–100 lakh ($72–120k), which in purchasing power terms is competitive with many Western cities when adjusted for cost of living. Bangalore rent is 5–8× lower than London. A coffee is 40× cheaper.

The gap is still material at the absolute number level. It shrinks considerably when you run it through PPP adjustment and consider the quality-of-life variables that a Bangalore salary buys locally.

**The remote variable:**

The geography of ML jobs changed in 2020 and did not fully revert. Many ML engineering roles — especially at US companies — are available fully remote or in a hybrid model that tolerates employees in non-US geographies. An ML engineer in Lisbon working for a San Francisco company can earn US-proximate compensation at Lisbon cost of living. This is not universally available, and it requires strong self-management skills, timezone discipline, and usually several years of in-person work history. But it's real, and it's a rational career strategy.

**The honest framework:**

Choose where you want to live first. Then optimise your career for that location. The ML engineer who moves to San Francisco purely for the money, dislikes the city, and burns out in 18 months loses more than the ML engineer in Berlin who stays for 10 years and builds expertise in AI regulation that becomes valuable post-AI-Act.

Geography is not destiny. But it is the context in which everything else happens, and context shapes outcomes more than most people want to admit.`,
    tags: ['Global', 'ML Jobs', 'Salary', 'London', 'Berlin', 'Bangalore', 'San Francisco', 'Career'],
    domain: 'career',
    youtube: [{ id: 'v45cTIDbj9E', title: 'Advice From a Top 1% Machine Learning Engineer' }],
  },
  {
    id: 19,
    slug: 'mle-career-ladder-l3-to-l7',
    title: 'The MLE Career Ladder: What L3 to L7 Actually Means in Practice',
    category: 'ML Careers',
    catColor: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
    readMin: 15,
    featured: false,
    excerpt: 'The job title says "Senior Machine Learning Engineer." The levelling document says "demonstrates technical leadership and influences cross-functional teams." What does any of this mean in practice — on a Tuesday afternoon when there\'s a production incident, a model retraining decision to make, and a junior engineer asking for a design review? Here is what each level actually looks like from the inside, and what it takes to move between them.',
    body: `Career ladders at tech companies are written to be simultaneously specific enough to give employees something to aim for and vague enough to give managers flexibility in promotion decisions. The levelling documents say things like "demonstrates exceptional judgment" and "operates with organisational impact." These sentences are not useless, but they are not sufficient. What does exceptional judgment look like in the specific context of ML engineering? How is organisational impact defined for someone whose primary output is a model in production?

This is the version that fills in those gaps.

**L3 / Junior MLE: Proving you can ship.**

The central challenge at L3 is not capability — you have the skills, you passed the interviews. The challenge is context. You don't know the codebase, the data, the production system, the team's historical decisions, or the implicit preferences of the engineers you work with. Every task takes longer than it would for a senior engineer because you're building context simultaneously with building the thing.

What you're expected to do: own well-defined tasks with clear scope. Implement models and pipelines from existing designs. Write code that others can review efficiently. Ask good questions. Not block your team.

What L3 engineers underestimate: the cost of bringing a good idea to production. It's not just the model. It's the feature pipeline, the serving infrastructure, the evaluation suite, the A/B test setup, the monitoring. Senior engineers have mental models for all of this. You're building those mental models from scratch.

The move to L4 is fundamentally about demonstrating that you can work with less guidance. At some point, a task should come to you and you should be able to take it from requirement to production with minimal check-ins. That's the bar.

**L4 / Mid MLE: Owning problems, not tasks.**

The qualitative shift at L4 is from "here's what to build" to "here's a problem to solve." You're given a business metric that's underperforming and asked to improve it. The solution — which features to engineer, which model family to use, how to evaluate — is yours to determine.

L4 engineers are expected to: scope ambiguous problems into concrete plans, propose and justify technical approaches, catch their own bugs and quality issues before review, and work with product, data, and infrastructure engineers without constant senior MLE mediation.

The failure mode at L4 is solving the wrong problem correctly. An L4 engineer given "improve recommendation CTR" who builds an excellent model optimised for click rate without noticing that the clicks don't convert — that's an L3 mindset in an L4 role. At L4, you're responsible for defining success, not just implementing it.

The move to L5: you need to start expanding beyond your immediate scope. Not just "I shipped this model" but "I identified this problem, proposed this solution, and shipped it in a way that three other teams can build on." The impact radius starts to expand.

**L5 / Senior MLE: Owning systems, mentoring people.**

At L5, the scope of your ownership expands from a feature or a model to a system. You might own the entire recommendation pipeline for a product line: candidate generation, ranking, filtering, evaluation, monitoring, and the retraining schedule. When something breaks at 2am, the on-call engineer pages you not because you wrote the code but because you understand the system.

The mentorship component is real, not optional. L5 engineers are expected to improve the people around them. This doesn't mean you run structured training sessions. It means: during code reviews, you explain the why, not just the what. When a junior engineer is stuck, you help them get unstuck in a way that builds their mental model rather than just fixing their bug. When you make a technical decision, you articulate the trade-offs clearly enough that your team understands the decision and could make a similar one.

The technical expectation: you can design a new ML system from scratch for a well-defined problem. "We need a fraud detection model for this payment product" — you can scope it, design the architecture, identify the key risks, define the evaluation framework, and produce a plan that your team can execute on. Not a perfect plan, but a defensible one.

The promotion friction point between L5 and L6 is the most discussed in the industry. Many engineers plateau at L5 for 2–5 years because the bar for L6 requires something genuinely different: cross-team influence, architectural decisions that shape multiple systems, and a track record of technical bets that paid off.

**L6 / Staff MLE: Setting direction.**

The Staff level is where the job description changes most dramatically. You are no longer primarily an individual contributor who also does some mentoring. You are someone whose technical judgment shapes what large numbers of engineers build. The leverage point shifts from "how well does my code work" to "how well does my technical vision propagate."

What Staff MLEs actually spend their time on: technical strategy (which ML bets should the organisation make over the next 12–18 months?), architecture reviews (is this new model serving system sound? Will it scale? Does it introduce technical debt we'll regret?), hiring (calibrating interview standards, writing levelling documentation, identifying gaps in the team's skillset), and escalation handling (when a production ML incident has no clear owner, the Staff MLE often becomes the incident commander by default).

The deep technical work is still there — most Staff MLEs write code — but it's more targeted. You work on the hardest problems, the ones where your specific combination of breadth and depth is irreplaceable. You also work on the things that would block other engineers if left unresolved: a missing abstraction in the platform, a evaluation methodology that the team has been applying incorrectly, a production system that no one fully understands.

What differentiates a strong L6 from a weak L6: the ability to be wrong loudly. Strong Staff engineers propose clear technical positions, accept challenge, update their views with new evidence, and maintain credibility through the quality of their reasoning rather than the defensiveness of their ego. This sounds obvious. It is rare.

**L7 / Principal MLE and above: Shaping the field.**

There are fewer than 2,000 Principal and Distinguished engineers at this level across the global ML industry. The job varies enormously by company but shares certain characteristics: the scope is typically multiple product areas or an entire technical domain, the time horizon is years rather than quarters, and the influence is as much external (publications, conference talks, open-source contributions, standards work) as internal.

At this level, individual technical output is almost secondary to your impact on how the field develops. A Principal MLE at Google who publishes a paper that changes how a generation of engineers approaches model calibration has done more for Google's long-term competitive position than a hundred individual model improvements.

The path to L7 is not a ladder. It's a trajectory. The engineers who reach this level are usually not the ones who optimised for promotion. They're the ones who worked on genuinely hard problems, published or spoke about their findings, built a reputation for sound judgment, and stayed long enough in one place to have created impact that compounds.

**What doesn't get you promoted:**

Working long hours. This is the most common confusion, and it's worth addressing directly. At every level, what promotes you is impact, not hours. The L4 engineer who works 50 hours per week and ships two medium-impact projects promotes more slowly than the L4 engineer who works 40 hours, ships one high-impact project, and mentors a junior engineer into a promotion.

Being technically brilliant in isolation. Every ML career ladder has a "collaboration and communication" section that most engineers read and ignore. It's not decorative. An ML engineer who builds exceptional models but can't explain their evaluation methodology, can't write clear design documents, and can't give useful code reviews is levelled below their technical capability.

Waiting to be asked. The move from L5 to L6, in particular, requires a shift from "I do what I'm asked, very well" to "I identify what needs to be done and do it." The second mode is not optional at Staff level. It cannot be learned after promotion; it must be demonstrated before it.`,
    tags: ['Career Ladder', 'Levelling', 'Staff Engineer', 'MLE', 'Promotions', 'Senior Engineer'],
    domain: 'career',
    youtube: [{ id: 'yJSavCOuub8', title: 'The Software Engineering Career Ladder Explained' }],
  },
  {
    id: 20,
    slug: 'validation-set-leakage',
    title: 'The Validation Set Is Lying to You: Four Leakage Patterns Nobody Warns You About',
    category: 'Model Evaluation',
    catColor: { bg: 'rgba(16,185,129,0.1)', text: 'var(--mint)', border: 'rgba(16,185,129,0.2)' },
    readMin: 9,
    featured: false,
    excerpt: 'Your model hits 0.94 AUC on validation. You deploy. Two weeks later, production AUC is 0.71. The model didn\'t degrade — your validation set was infected from the start. Leakage is the most reliably career-damaging mistake in applied ML, and it hides in places most practitioners never check.',
    body: `Leakage means your model has access to information during training that it won\'t have at prediction time. The validation set is supposed to catch this. It doesn\'t — because in most pipelines, the validation set is infected by the same leakage that corrupts the training set.

**Type 1: Target leakage (the classic)**

A feature is computed from or correlated with the target after the fact. Example: a credit default model includes "number of late payment notices sent" as a feature. Late notices are sent after the default is already detected — the feature is a consequence of the label, not a cause. In training data, this feature perfectly predicts the label. In production, it doesn't exist at prediction time.

The diagnostic: plot feature values for positive vs negative labels. A feature with AUC > 0.95 on its own should be investigated immediately. Either it\'s extremely good (rare) or it leaks from the label.

**Type 2: Temporal leakage**

Future data is used to compute features for past events. The most common version: you compute a 30-day rolling average user activity as a feature for a purchase event. But you forgot to anchor the window to the event timestamp — it uses data from after the purchase. In batch training pipelines, this is easy to introduce and hard to detect without explicit timestamp audits.

The fix: point-in-time correct joins. For every event at time T, features must be computed using only data available at T - epsilon. This requires either a time-travel-capable feature store or explicit timestamp filtering in every feature computation.

**Type 3: Preprocessing leakage**

Your scaler, imputer, or encoder is fitted on the full dataset (including validation) before the train/val split. This means the validation set has already "touched" the training distribution through the preprocessing step.

The correct order:
1. Split first (train, val, test)
2. Fit scaler/encoder on train only
3. Transform val and test using train-fitted parameters

Using sklearn Pipeline ensures this order is preserved. Fitting on the full dataset before splitting is the mistake. It's subtle: your scaler.mean_ incorporates validation set statistics, giving your model slight information about validation examples during training.

**Type 4: Group leakage**

Your dataset has natural groups (users, patients, products) and multiple examples per group. A random 80/20 split puts some examples from user_id=12345 in training and others in validation. Any user-level features (historical engagement, spending patterns, demographics) are now shared between train and validation via the group. Your model learns user-specific patterns that generalize perfectly to the other rows from the same user in validation — but not to new users in production.

The fix: group-aware splits. All rows from a given entity (user, patient, product) must be in the same split. sklearn provides GroupShuffleSplit. If you have time-ordered data, use a chronological split where validation contains only events that happen after all training events.

**The meta-lesson:**

Leakage usually isn\'t visible in code. It\'s visible in unrealistically good validation metrics. If your validation AUC is > 0.95 for a hard problem, or your RMSE is suspiciously low, investigate before celebrating. Strong validation performance is a diagnostic signal, not just a success metric.

The question to ask for every feature: "At prediction time in production, is this value available, and is it computed the same way as at training time?" If the answer is "I\'m not sure," audit the feature.`,
    tags: ['Leakage', 'Cross-validation', 'Evaluation', 'Preprocessing', 'Production ML'],
    domain: 'eval',
    youtube: [{ id: 'fE_25esn-5U', title: 'Data Leakage — StatQuest with Josh Starmer' }],
  },
  {
    id: 21,
    slug: 'feature-store-time-travel-bug',
    title: 'The Feature Store Time-Travel Bug That Quietly Corrupts Your Models',
    category: 'Feature Engineering',
    catColor: { bg: 'rgba(34,211,238,0.1)', text: 'var(--sky)', border: 'rgba(34,211,238,0.2)' },
    readMin: 10,
    featured: false,
    excerpt: 'You have a feature store. Your training pipeline reads features from it. You believe your training data is point-in-time correct. It isn\'t. The time-travel bug is the most insidious failure mode in ML data infrastructure, and it exists in almost every feature store deployment that hasn\'t explicitly tested for it.',
    body: `Point-in-time correctness means: when you build a training example for an event at timestamp T, every feature value reflects the state of the world at time T — not T+1, not T+24h, not "whenever the batch job ran."

Almost every feature store tutorial demonstrates point-in-time joins. Very few explain how they silently break in production.

**How the bug appears**

Your feature store materialises features via a daily batch job that runs at 02:00 UTC. It reads all events from the previous calendar day and computes feature values. The features are stored with a timestamp of "2024-01-15" — the calendar date of the source events.

Your training pipeline does a point-in-time join: for each training event at timestamp T, fetch the most recent feature row where feature_timestamp <= T.

Looks correct. The bug: your feature computation job runs at 02:00 UTC on 2024-01-16 to process 2024-01-15 data. The feature row is available in your store starting at 02:00 UTC on 2024-01-16. But the feature_timestamp stored is "2024-01-15 00:00:00 UTC."

For any training event that occurred on 2024-01-15 after 00:00 UTC but before 02:00 UTC on 2024-01-16, your point-in-time join correctly finds the 2024-01-15 feature row. But those features were computed including data from the full day of 2024-01-15 — including data after the event. If a user made a purchase at 08:00 UTC on 2024-01-15, their "purchases yesterday" feature will include that very purchase. Leakage.

**The four variants**

**1. Calendar-day vs event-time mismatch.** Features stamped at midnight of the source date but containing full-day data. Training events from early in the day see future-contaminated features.

**2. Processing lag hiding behind event timestamp.** The feature row is available at T+N hours due to pipeline latency, but stamped at T. Any event between T and T+N uses a feature row that "didn\'t exist yet."

**3. Late-arriving data correction.** Your pipeline reprocesses yesterday\'s data today to incorporate late-arriving events. The corrected feature row overwrites the original but keeps the original timestamp. Historical training data is retrospectively altered.

**4. Wall-clock time vs event time aggregation.** A "sessions in the last 7 days" feature computed at 2024-01-15 23:55 UTC will include session data that arrived between the training event at 2024-01-15 10:00 UTC and the time the feature was computed.

**How to detect it**

For any feature that should reflect "state at time T," compute it independently from raw events for a sample of training rows. Compare against what your feature store served. Systematic overestimation of features for events early in the day = temporal leakage.

Also: if a model degrades faster after deployment than expected, but shows no feature distribution shift in PSI monitoring, temporal leakage is a prime suspect. The model learned from future-contaminated data and production data is uncontaminated.

**The correct fix**

Store features with their availability_timestamp — the time the row was actually written to the store — not the event timestamp. Your point-in-time join must use availability_timestamp <= event_timestamp, not feature_date <= event_date.

This requires materialising feature rows with accurate write timestamps, which means changing how your pipeline records metadata. Feast 0.28+ supports this with the ttl parameter and feature_view materialisation logs. Without this, you\'re doing "point-in-time" joins that are not actually point-in-time.

**The test you should run**

For 100 training events at time T, fetch the features your training pipeline used. Then independently compute those features using only events with timestamp < T. If they differ systematically, you have the bug.`,
    tags: ['Feature Store', 'Point-in-Time', 'Data Leakage', 'Training Data', 'Data Engineering'],
    domain: 'features',
    youtube: [{ id: 'PAzEyeWItH4', title: 'Time Travel and Provenance for ML Pipelines — OpML 2020' }],
  },
  {
    id: 22,
    slug: 'reading-spark-execution-dag',
    title: 'Reading the Spark Execution DAG: The Diagnostic Skill Nobody Teaches',
    category: 'PySpark',
    catColor: { bg: 'rgba(245,158,11,0.1)', text: 'var(--ember)', border: 'rgba(245,158,11,0.2)' },
    readMin: 11,
    featured: false,
    excerpt: 'Every Spark performance problem is visible in the UI — if you know what to look for. Most engineers glance at the job page and see "completed." Senior engineers open the stages tab, find the task duration histogram, and know within 60 seconds whether the problem is skew, shuffle, or serialization. Here\'s the complete reading guide.',
    body: `The Spark UI at port 4040 (or the History Server) tells you everything you need to debug a slow job. Most people only check if it completed. Here\'s how to actually read it.

**The Jobs tab: your entry point**

Each action (collect, write, count) triggers a job. Jobs are composed of stages, and stages are composed of tasks. The jobs tab shows you duration and whether any stages were skipped (cached). Start here — find the job that took longest.

**The Stages tab: where the real diagnostic begins**

Click into the slow job. You see its stages, each corresponding to a shuffle boundary (any wide transformation: groupBy, join, repartition, distinct). The stage table shows:

- **Duration**: wall-clock time for the stage
- **Input/Output/Shuffle Read/Shuffle Write**: data volume at each phase
- **Tasks**: how many tasks ran, how many failed

The ratio that matters most: if Shuffle Read is 10x the Input size, you have a skewed join or explosion in cardinality. If Shuffle Write is large but Shuffle Read is small in the next stage, data is being generated and discarded — look for unnecessary explode() calls.

**The Task Duration Histogram: skew detector**

Click into a stage and scroll to the task metrics. The task duration histogram is the single most useful chart in Spark debugging. It shows the distribution of time spent across all tasks.

A healthy histogram: roughly normal or uniform distribution. All tasks finish within 2x of each other.

A skew signature: most tasks finish in 0.2s, one task takes 120s. The job\'s total duration is dominated by that single slow task. This is data skew — one partition has far more data than the others. The fix: salting the join key or using skew hints (\`spark.sql.autoBroadcastJoinThreshold\`, \`skewJoin\` hint in Spark 3.x).

A stragglers signature: a long right tail with 3–5 tasks taking 3x the median. This is usually resource contention (noisy neighbour on the executor) or GC pressure. Look at the GC time column — if GC time > 10% of task duration, you have memory pressure.

**The SQL tab: for DataFrame and SQL queries**

The SQL tab shows the physical plan for each query. Here you can see:

- **BroadcastHashJoin vs SortMergeJoin**: broadcast joins are fast (table fits in memory and is copied to each executor). SortMergeJoin requires shuffle on both sides — much more expensive. If you see SortMergeJoin on a small table, force a broadcast with \`broadcast()\` hint.
- **Exchange (shuffle)**: every Exchange node in the plan is a shuffle. Count them. Three joins between large tables = potentially 6 shuffles. Can any of them be avoided by co-partitioning? By denormalization?
- **Filter pushdown**: good plans show filters pushed below joins. If your filter appears above the join in the plan, Spark is shuffling unneeded rows before filtering them.

**The Storage tab: cache debugging**

If you call .cache() or .persist(), the stored RDD/DataFrame appears here with memory and disk usage. Key checks: is the cached dataset fully materialized (fraction cached = 100%)? If it\'s 40% cached, the rest spills to disk — and your "cached" job is doing partial re-computation on every access.

**The Environment tab: configuration audit**

Check spark.executor.memory, spark.executor.cores, spark.sql.shuffle.partitions (default 200 — almost always wrong), spark.default.parallelism. If shuffle.partitions = 200 and your dataset has 10TB, each partition is 50GB and you\'ll OOM. Rule of thumb: target 100–200MB per partition, set shuffle.partitions accordingly.

**The two-minute diagnostic**

1. Jobs tab → find the slow job
2. Stages tab → find the stage with the highest duration, check Shuffle Read/Write ratio
3. Stage detail → task duration histogram → skewed? stragglers? uniform?
4. SQL tab → count Exchange nodes, check join types, verify filter pushdown
5. Storage tab → are your caches fully materialised?

After running this five times, you\'ll start catching Spark performance bugs in code review before they ever hit production.`,
    tags: ['Spark', 'PySpark', 'Performance', 'Debugging', 'Data Engineering', 'Skew'],
    domain: 'spark',
    youtube: [{ id: 'YgQgJceojJY', title: 'Understanding Query Plans and Spark UIs — Databricks' }],
  },
  {
    id: 23,
    slug: 'three-drift-signals-model-failure',
    title: 'Three Drift Signals That Predict Model Failure Before It Happens',
    category: 'Monitoring',
    catColor: { bg: 'rgba(244,63,94,0.1)', text: 'var(--rose)', border: 'rgba(244,63,94,0.2)' },
    readMin: 9,
    featured: false,
    excerpt: 'By the time a model failure shows up in your business metrics, it\'s been degrading for weeks. The signals were there earlier — in your input distributions, your prediction distributions, and your residuals — but nobody was watching. Here\'s what to monitor, what thresholds matter, and what each signal actually tells you.',
    body: `Model failures don\'t announce themselves. They compound quietly across days or weeks until a stakeholder notices conversion is down 18% and you spend a week reverse-engineering what happened. The information was available the whole time — just not in the right place, with the right alert.

There are three layers of drift to monitor. They detect different failure modes at different points in the degradation timeline.

**Layer 1: Input drift — the earliest signal**

Input drift means your features are moving away from the training distribution. This doesn\'t guarantee model performance has degraded yet, but it\'s a leading indicator — the model is now operating in territory it didn\'t train on.

The standard metric is PSI (Population Stability Index). For each feature:

- PSI < 0.1: stable, no action needed
- PSI 0.1–0.2: moderate drift, flag for review
- PSI > 0.2: significant drift, investigate

PSI is computed by binning the reference distribution (training) and current distribution, then summing: \`Σ (Actual% - Expected%) × ln(Actual% / Expected%)\`.

For categorical features, track each category\'s share separately. The most common trigger: a new categorical value appears in production that was never seen during training. Your model\'s embedding for that value is random or zero — it will mispredict for every row with that category.

Monitor input drift daily for high-cardinality features, weekly for stable ones. Alert on PSI > 0.15 for the top 10 features by importance.

**Layer 2: Prediction drift — the performance proxy**

You can\'t always get ground truth labels in real time (it takes 30 days to know if a loan defaulted). But you can watch how the model\'s predictions are distributed.

Prediction drift compares the distribution of P(Y=1) today vs at the time of deployment. Use the KS (Kolmogorov-Smirnov) statistic: the maximum absolute difference between the two CDFs.

A healthy model: KS < 0.05. Its predictions today look like its predictions at launch.

A drifting model: the mean prediction drops from 0.23 to 0.18 over two weeks, and the KS grows to 0.14. The model is becoming more conservative — possibly due to feature drift, or due to a real shift in the population.

Critical distinction: prediction drift can be a false alarm. If the underlying base rate genuinely changed (fewer people are actually likely to default this month), you want the predictions to shift. The signal is "investigate," not "rollback." Compare prediction drift against any known base rate changes.

**Layer 3: Residual drift — the ground truth signal**

When labels are available (even with delay), compute model residuals for a rolling cohort: residual = y_true - y_pred (for regression) or look at calibration curves (for classification).

Systematic residual drift — where the model consistently over- or under-predicts a specific segment — indicates concept drift: the relationship between features and labels has changed. This is the hardest drift to catch early but the most actionable.

For binary classification: run calibration checks by cohort. If your model predicts 0.3 probability but the actual rate for that score bucket is now 0.45, the model is miscalibrated and needs either a calibration update or a full retrain.

**The monitoring architecture that works**

You don\'t need an expensive MLOps platform for this. You need:

1. Log serving features alongside predictions (not just predictions alone)
2. Compute PSI daily vs training baseline — a 30-line SQL query
3. Compute prediction KS weekly vs launch week distribution
4. When labels arrive: compute residuals by score decile, alert if calibration error > 0.05

The teams that catch model failures early aren\'t the ones with the most sophisticated tooling. They\'re the ones who consistently run these three checks and act on the alerts rather than explaining them away.`,
    tags: ['Monitoring', 'Drift Detection', 'PSI', 'KS Test', 'Production ML', 'Calibration'],
    domain: 'monitor',
    youtube: [{ id: '_xjtxnFJakY', title: 'The Day After Deployment: Model Monitoring — Emeli Dral' }],
  },
  {
    id: 24,
    slug: 'ml-system-design-6-step-framework',
    title: 'The 6-Step Framework That Answers Any ML System Design Question',
    category: 'Interview Prep',
    catColor: { bg: 'rgba(251,191,36,0.1)', text: 'var(--gold)', border: 'rgba(251,191,36,0.2)' },
    readMin: 12,
    featured: false,
    excerpt: 'Most ML system design interviews fail at step zero: the candidate jumps to model architecture before clarifying what success looks like, what latency the system can tolerate, or whether it\'s even an ML problem worth solving. The 6-step framework exists to prevent exactly this. Here\'s how it works, with a full worked example.',
    body: `An ML system design interview tests whether you think like a senior engineer — someone who understands that model selection is step 5, not step 1. The framework below is a checklist that forces the right order of reasoning.

**Step 1: Clarify the objective**

Before anything else: what is the system trying to optimise for? And is that the same as the business metric?

The classic trap: "optimise click-through rate." CTR is easy to maximise — show clickbait. The real objective is something like "increase long-term user satisfaction and retention." These require different models, different labels, different evaluation metrics. State this explicitly.

Questions to ask: What is the north star metric? What does failure look like? What is the traffic volume? What is the acceptable latency? What is the cost of a false positive vs a false negative?

**Step 2: Define the ML task**

Given the objective, what type of ML problem is this? This sounds obvious but gets surprisingly complex:

- Recommendation: retrieval (ANN search over candidates) + ranking (point-wise vs pair-wise vs list-wise scoring)
- Fraud detection: binary classification, but with extreme class imbalance and adversarial dynamics
- Search ranking: learning-to-rank with query-document pairs
- ETA prediction: regression with right-skewed distribution and temporal features
- Content moderation: multi-class classification with a "human review" third class

State the task type, the output type, and whether you need a single model or a pipeline of models.

**Step 3: Define labels**

How do you know what "correct" looks like? This is where most designs fail.

For recommendation: explicit (5-star rating) vs implicit (click, dwell time, share). Implicit labels are noisier but available at scale. Define your positive/negative events carefully — a 2-second dwell is not a positive signal.

For fraud: the label is available (fraud confirmed / not), but delayed (chargebacks arrive 30 days after the transaction). Your training data is 30 days stale by definition. State this.

For content moderation: you need human annotators. What is your labelling agreement threshold? How do you handle ambiguous cases? What is your label latency (time from content publication to label availability)?

**Step 4: Feature design**

Now you can talk about features. By this point you know the task, the labels, and the constraints — so feature design is guided by actual requirements, not intuition.

Structure your feature discussion around: user features (demographics, historical behaviour, preferences), item features (content embeddings, metadata, popularity signals), context features (time of day, device, session context), and interaction features (user-item affinity, historical clicks on similar items).

For each feature, state: availability at serving time? Point-in-time correct? Any leakage risk? This is where many candidates reveal whether they\'ve actually worked with ML data pipelines.

**Step 5: Model choice**

Only now do you choose a model. Given everything above: the task type, the latency requirement, the label quality, the feature space, and the training data volume.

Common mapping:
- Low latency + tabular features: GBM (LightGBM, XGBoost) — fast inference, interpretable
- Retrieval stage: two-tower neural network — handles dense embedding spaces
- Ranking stage: transformer over user-item sequence — captures sequential patterns
- Small data + interpretability needed: logistic regression with handcrafted features
- Large-scale NLP: fine-tuned BERT or task-specific instruction-tuned LLM

State your training infrastructure assumptions: how often does the model retrain? Online learning or batch? What is the training compute requirement?

**Step 6: Evaluation and serving**

Offline evaluation: what is your test set? Is it a time-ordered hold-out? What metric? Why that metric and not the alternatives?

Online evaluation: shadow mode first, then canary (5–10% traffic), then champion-challenger framework for promotion. What are your rollback triggers?

Serving: latency budget, caching strategy (can you pre-compute scores for a subset of users?), failover behaviour (what does the system serve if the model is unavailable?), monitoring.

**Worked example: news feed ranking**

Step 1: Objective — maximise long-term user engagement, not pure CTR. North star: weekly active days.
Step 2: Task — list-wise ranking over candidate posts for a user. Retrieval (ANN) + ranking (transformer).
Step 3: Labels — implicit: 10s+ dwell = positive, scroll past = weak negative, share = strong positive. Labels available in realtime.
Step 4: Features — user embedding (historical engagement), post embedding (BERT on text), user-post affinity, recency decay, source reliability signal.
Step 5: Model — two-tower for retrieval, 6-layer transformer ranker for top-100 candidates. Retrain daily.
Step 6: Evaluation — NDCG@10 offline; A/B on weekly active days online with 2-week exposure minimum.

The interview test: can you do this in 45 minutes, and does your answer reveal that you\'ve thought about what happens when the model is wrong?`,
    tags: ['Interview', 'System Design', 'ML Interview', 'Framework', 'Recommendation', 'Evaluation'],
    domain: 'interview',
    youtube: [{ id: 'ZjNoipQAqRM', title: 'ML System Design Mock Interview: Tweet Toxicity — Exponent' }],
  },
  {
    id: 25,
    slug: 'why-forecasts-fail',
    title: 'Why Your Forecast Was Wrong Before It Ran: The 8 Silent Killers',
    category: 'Model Evaluation',
    catColor: { bg: 'rgba(16,185,129,0.1)', text: 'var(--mint)', border: 'rgba(16,185,129,0.2)' },
    readMin: 10,
    featured: false,
    excerpt: 'A time series model that looks excellent in backtesting routinely fails in production. The backtest metric was real — the error was introduced before the model ever ran. Most forecast failures are data and evaluation failures, not model failures. Here are the 8 patterns that kill forecasts before deployment.',
    body: `Forecasting failures are mostly diagnosed wrong. When a forecast misses badly, the instinct is to try a different model: ARIMA instead of Prophet, LSTM instead of ARIMA. Usually that\'s the wrong fix. The model wasn\'t the problem.

Here are the 8 patterns that corrupt forecasting pipelines before the model gets involved.

**1. Target leakage in temporal features**

You\'re predicting sales tomorrow. One of your features is "average sales over the past 7 days" — computed using the 7 days before the prediction date. In training, you compute this lazily using the full history. In production, the pipeline that materialises this feature runs at 06:00 UTC, including transactions that came in at 23:55 the previous night.

Result: training features are computed with a slightly different time boundary than production features. The model learns patterns that don\'t exist in the production data. Your MAPE looks fine in backtest; it degrades 15% in production.

**2. Non-stationarity ignored at training time**

Most classical forecasting methods assume stationarity: the statistical properties of the series (mean, variance, autocorrelation) don\'t change over time. Most real-world series aren\'t stationary. Retail sales trend upward. Energy consumption has decade-long cycles. Advertising spend has quarterly budget patterns.

If you fit an ARIMA to a non-stationary series without differencing, the model is fitting to the trend rather than the patterns. It will forecast the trend to continue — and mean-revert when it doesn\'t.

Always test stationarity with ADF or KPSS before model selection. Always apply the differencing order that makes the series stationary before passing it to a classical model.

**3. Structural breaks treated as noise**

A structural break is a permanent shift in the level or trend of a series — a new market entrant, a product line change, a regulation, a macro event. Models trained before the break will forecast as if the old regime continues. Models trained after the break may not have enough data to characterise the new regime.

Prophet has built-in changepoint detection. For other models: detect breaks with the Chow test or Bai-Perron algorithm. Segment your training data at the break point — data before the break is either excluded or given lower weight.

**4. Evaluation metric mismatch**

RMSE penalises large errors heavily. MAPE breaks when the actual is near zero. MAE treats all errors equally regardless of scale. Symmetric MAPE (SMAPE) has its own pathologies.

The right metric depends on your use case: if an underforecast and overforecast have equal cost, MAE. If large errors are catastrophically costly (safety-critical applications), RMSE. If you care about percentage errors and your series never goes to zero, MAPE.

The mistake: optimising RMSE in training when operations cares about MAPE, or reporting MAPE on a series with near-zero values where the denominator explodes.

**5. Look-ahead bias in the evaluation window**

Your backtest generates forecasts for each week using a model fit on all prior data. But did you re-fit the model at each step of the walk-forward validation, or did you fit it once on the full history and generate "forecasts" with the model that already saw the future?

A model fit once on full history then evaluated over historical windows has already seen the "future" of those windows during training. Your backtest numbers are not honest. Always use expanding window or rolling window cross-validation where the model is genuinely blind to future data.

**6. Cold start on sparse series**

Your inventory model works well for your top-100 SKUs. It fails for the 4,000 long-tail SKUs with 2–3 transactions per month. Classical time series models need at least 2–3 seasonal cycles of history to characterise seasonality. For sparse series, fitting a model per series is both computationally wasteful and statistically unsound.

Solutions: hierarchical forecasting (borrow statistical strength from similar series), global models (one neural network trained on all series simultaneously), or default-to-category-average for series below a sparsity threshold.

**7. Feature pipeline drift after deployment**

Your forecast model uses 6 external features (weather, economic indicators, competitor prices). These features are fetched from third-party APIs. One API changes its response schema in month 3. Your feature pipeline silently fills that feature with NULL, which gets imputed to the mean. The model continues running and producing numbers — slightly wrong ones, for the next 8 months, until a quarterly review catches it.

Validation: apply schema checks and null-rate monitoring to every external feature, not just the model\'s predictions. Alert if null rate for any feature exceeds 2x its training baseline.

**8. Not accounting for intermittency**

A series that is zero 70% of the time (a product that doesn\'t sell most days) should not be forecast with a model designed for continuous data. Standard RMSE will be dominated by the zero periods. Standard models will forecast small positive values for the zero periods (systematic positive bias).

Correct approach: Croston\'s method (separate demand interval and demand size models), or zero-inflated distributions, or — for very sparse series — just forecast the probability of a non-zero period and the expected size conditional on non-zero.

**The meta-pattern**

Six of these eight failures are detectable before you train any model: by auditing the feature computation logic, checking stationarity, verifying your evaluation methodology, and profiling your series for sparsity and structural breaks. Spend 30% of your forecasting project on this audit before touching model selection. You\'ll find problems that no model architecture can fix.`,
    tags: ['Time Series', 'Forecasting', 'Evaluation', 'Leakage', 'Stationarity', 'Production ML'],
    domain: 'eval',
    youtube: [{ id: '6pP9meuusNw', title: 'Temporal Leakage in ML: Train-Test Contamination Explained' }],
  },
]

const CATEGORIES = ['All', 'Feature Engineering', 'PySpark', 'Model Evaluation', 'ML System Design', 'Monitoring', 'Models & Math', 'Interview Prep', 'ML Careers']

const GRADIENT_DOMAINS = [
  { id: 'all',       label: 'All Posts' },
  { id: 'features',  label: 'Feature Eng',   color: 'var(--violet)' },
  { id: 'spark',     label: 'Spark / DE',    color: 'var(--ember)' },
  { id: 'eval',      label: 'Evaluation',    color: 'var(--mint)' },
  { id: 'design',    label: 'System Design', color: 'var(--sky)' },
  { id: 'monitor',   label: 'Monitoring',    color: 'var(--rose)' },
  { id: 'math',      label: 'Math & DS',     color: 'var(--sky)' },
  { id: 'dl',        label: 'Deep Learning', color: 'var(--violet)' },
  { id: 'interview', label: 'Interview',     color: 'var(--gold)' },
  { id: 'career',    label: 'Career',        color: 'var(--gold)' },
]

const DOMAIN_COLOR = {
  features: 'var(--violet)', spark: 'var(--ember)', eval: 'var(--mint)',
  design: 'var(--sky)', monitor: 'var(--rose)', math: 'var(--sky)',
  dl: 'var(--violet)', interview: 'var(--gold)', career: 'var(--gold)',
}

function YouTubeEmbed({ videoId, title }) {
  return (
    <div style={{ margin: '28px 0' }}>
      <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Watch</div>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '10px', border: '1px solid var(--rim)' }}>
        <iframe
          src={'https://www.youtube-nocookie.com/embed/' + videoId}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: '10px' }}
        />
      </div>
      {title && <div style={{ fontSize: '12px', color: 'var(--ink-low)', marginTop: '6px', fontStyle: 'italic' }}>{title}</div>}
    </div>
  )
}

// ─── Production Failure Case Library ─────────────────────────────────────────
const CASES = [
  {
    id: 'c1', sector: 'Recommendations', severity: 'P1', duration: '4 days undetected',
    title: 'Stale Item Embeddings',
    what: 'A two-tower recommendation system silently degraded — CTR fell 18% over four days with no alert firing.',
    rootCause: 'The item embedding refresh pipeline failed on day 1 due to a missing S3 path. Serving fell back to cached embeddings silently. By day 4, 27% of the item catalogue had no embedding and was falling back to a popularity-based heuristic for all users.',
    timeline: 'Day 1: pipeline fails silently. Day 2–3: CTR begins falling. Day 4: on-call pages at 2am for first time. Day 5: root cause identified, backfill run.',
    fix: 'Configured pipeline failure alerts. Added a feature freshness SLA monitor (alert if item embeddings > 26h stale). Added a serving-side health check comparing embedding coverage against catalogue size.',
    lesson: 'Silent fallbacks are silent failures. A serving layer that degrades gracefully without alerting is worse than one that crashes loudly — you lose days of recovery time.',
    tags: ['Feature Freshness', 'Monitoring', 'Embeddings', 'Silent Failure'],
  },
  {
    id: 'c2', sector: 'Fraud Detection', severity: 'P0', duration: '6 hours in production',
    title: 'Label Leakage from Dispute Outcomes',
    what: 'A retrained fraud model had offline AUC 0.97, precision 0.91. In production, precision collapsed to 0.43 within hours.',
    rootCause: 'A refactor removed a timestamp guard from the dispute outcome join. Features like `is_disputed_resolved` and `chargeback_filed_within_7d` — only observable after fraud is confirmed — were being used as training features. The model learned to predict fraud from its consequences, not its causes.',
    timeline: 'Morning: model promoted. Noon: fraud ops overwhelmed with false positives. 14:00: rollback to previous champion. 16:00: label leakage confirmed via feature importance audit.',
    fix: 'Rolled back immediately. Re-added timestamp filtering to all dispute joins. Added an automated leakage check: any feature with > 0.3 correlation with the label in a causality-excluded window blocks training.',
    lesson: 'Suspiciously good offline metrics are a red flag, not a green light. If your top features include dispute outcomes, returns, or resolutions, run a temporal validity check before training.',
    tags: ['Label Leakage', 'Point-in-Time', 'Fraud', 'Post-Event Features'],
  },
  {
    id: 'c3', sector: 'Search Ranking', severity: 'P1', duration: '12 hours after deployment',
    title: 'Padding-Induced Latency Cliff at P99',
    what: 'P99 latency hit 8 seconds after deploying BERT-large as a reranker. P50 was unaffected at 120ms.',
    rootCause: 'BERT-large with max_len=512 and dynamic batching padded all sequences to max length — including one-word queries. A query with 1 token processed the same 51,200 tokens as a 50-word query (100 candidates × 512). Long queries created massive tensors that saturated the GPU and queued all subsequent requests.',
    timeline: 'Deployment at 14:00. P99 climbs through the evening as long-query traffic increases. Alert fires at 02:00 when user-facing timeout rate crosses 1%.',
    fix: 'Rolled back to BERT-base. Implemented sequence-length bucketing: batch queries of similar length, pad only to the longest in the bucket. Added per-query latency budget with a reranker bypass.',
    lesson: 'P99 issues are distribution problems, not mean problems. Always segment latency by input characteristics — query length, candidate count, user tier — before deploying a model with quadratic compute.',
    tags: ['Serving Latency', 'BERT', 'Batching', 'P99', 'Quadratic Compute'],
  },
  {
    id: 'c4', sector: 'Pricing', severity: 'P2', duration: 'Several weeks before detection',
    title: 'Training-Serving Scaler Divergence',
    what: 'A pricing model\'s production scores drifted systematically over three weeks — high-value users were being underpriced and low-value users overpriced.',
    rootCause: 'The serving code re-fit the StandardScaler on each individual prediction request (`scaler.fit_transform([single_row])`). A single row has mean = its own value and std ≈ 0. Every scaled feature was being zeroed out. The model was effectively receiving all-zero inputs for scaled features.',
    timeline: 'Model deployed. Business metrics slightly off but attributed to seasonality. PSI monitoring not configured on serving features. Three weeks later, an engineer notices serving features logged in production have all scaled features at ~0.',
    fix: 'Serialised and versioned the trained scaler artifact alongside the model. Added a serving-feature distribution check that runs hourly against training baseline.',
    lesson: 'Never fit preprocessing at serving time. Fit once during training, serialise the artifact, load at serving. The sklearn Pipeline pattern enforces this correctly.',
    tags: ['Training-Serving Skew', 'Preprocessing', 'Scaler', 'Feature Store'],
  },
  {
    id: 'c5', sector: 'Recommendations', severity: 'P2', duration: '6 weeks undetected',
    title: 'Feedback Loop in Feed Ranking',
    what: 'A feed ranking model\'s click diversity decreased by 40% over six weeks. Users complained of a "filter bubble." Business metrics looked neutral.',
    rootCause: 'The ranking model recommended content. Users clicked recommended content. Clicks became training labels. The next model reinforced what the previous model had already recommended. A self-reinforcing loop progressively narrowed recommendation diversity without any single change triggering an alert.',
    timeline: 'No single incident. Gradual decline detected by a data scientist during a quarterly review of content diversity metrics.',
    fix: 'Implemented a permanent 5% long-term holdout group that received a diversity-boosted ranker. Used holdout group performance as the feedback loop detection signal. Added content diversity as a monitoring metric alongside CTR.',
    lesson: 'Feedback loops are invisible to standard offline evaluation and A/B tests of short duration. Long-term holdout groups — not held out from traffic, but held out from model influence — are the only reliable detection mechanism.',
    tags: ['Feedback Loop', 'Recommendations', 'Diversity', 'Self-Reinforcing'],
  },
  {
    id: 'c6', sector: 'Experimentation', severity: 'P2', duration: '14-day experiment invalidated',
    title: 'SRM from Automated Bot Traffic',
    what: 'A two-week A/B test showed +2.1% CTR with p=0.002. The PM wanted to ship. The SRM check showed 52:48 assignment instead of 50:50.',
    rootCause: 'Automated bot traffic from a third-party monitoring service was not being filtered from experiment assignment. Bots were disproportionately assigned to the control group (they were first observed on control URLs). The asymmetric bot presence inflated control group session counts and created the assignment imbalance.',
    timeline: 'Experiment runs 14 days. SRM noticed during post-analysis. Investigation takes 3 days. Experiment rerun with bot filtering: lift reduces to +0.4%, p=0.21.',
    fix: 'Added bot detection to experiment assignment gate. Required SRM check as a mandatory pass/fail gate before any experiment results are readable in the dashboard.',
    lesson: 'An SRM p-value < 0.01 means the experiment is invalid regardless of primary metric significance. The +2.1% CTR lift was noise from a biased sample — rerunning found no real effect.',
    tags: ['SRM', 'A/B Testing', 'Bots', 'Experimentation Validity'],
  },
  {
    id: 'c7', sector: 'Content Ranking', severity: 'P1', duration: 'Months of slow degradation',
    title: 'Concept Drift After Macro Event',
    what: 'An engagement ranking model\'s performance degraded slowly but persistently over three months following a major global event. By the time it was flagged, engagement metrics were down 22% from the model\'s launch performance.',
    rootCause: 'User behaviour shifted substantially after a major news event — users sought news and information content, while the model was trained on a pre-event engagement distribution that over-weighted entertainment and social content. The model\'s P(y|X) mapping became stale: the same features now predicted different engagement levels.',
    timeline: 'Event occurs. Gradual performance decline begins. PSI monitors don\'t fire (features shift slowly). 3 months later, an engineer runs a slice analysis and finds the model performs poorly on news/information queries.',
    fix: 'Immediate retrain on post-event data. Added concept drift monitoring using a holdout set with daily label resolution. Implemented a trigger: if rolling model performance on holdout set drops > 5% vs peak, initiate retraining review.',
    lesson: 'PSI monitors data distribution (covariate shift). They don\'t detect concept drift — when P(y|X) changes without X changing. You need performance monitoring with labeled holdout data to catch concept drift.',
    tags: ['Concept Drift', 'Retraining', 'Monitoring', 'Covariate Shift'],
  },
  {
    id: 'c8', sector: 'Feature Engineering', severity: 'P2', duration: 'Present from model launch',
    title: 'Timezone Mismatch in Window Aggregation',
    what: 'A churn prediction model had a persistent 3–4% precision gap between offline validation and production that engineering could never fully explain.',
    rootCause: 'Training computed a "last 7 days activity" window using calendar days in UTC. Serving computed a rolling 168-hour window based on wall-clock time. At 11pm UTC, serving could include the next calendar day\'s data. For users in UTC+5, the training window included their previous day\'s activity; serving did not. The disagreement was small per user but consistent.',
    timeline: 'Model ships. Offline-online gap noticed but dismissed as "normal generalisation loss." Present from launch. Discovered two years later during a feature store migration that standardised window definitions.',
    fix: 'Standardised all time window definitions to use the same epoch-based rolling approach in both training and serving. Added a training-serving parity test that runs on a held-out set comparing training feature values to simulated serving feature values.',
    lesson: 'Small, systematic training-serving divergences are the hardest to find because they don\'t cause catastrophic failure — just persistent underperformance that\'s easy to rationalise away.',
    tags: ['Training-Serving Skew', 'Feature Engineering', 'Timezones', 'Silent Bug'],
  },
  {
    id: 'c9', sector: 'Classification', severity: 'P2', duration: '3 weeks after retrain',
    title: 'Threshold Not Recalibrated After Retrain',
    what: 'After a model retrain, precision dropped from 0.78 to 0.51 in production. The model itself was better — it was the operating threshold that was wrong.',
    rootCause: 'The retrained model had a different score distribution than the previous model (better calibrated, scores more spread). The old threshold of 0.45 was carried over without recalibration. At 0.45, the new model was flagging far more borderline cases because its scores were better separated.',
    timeline: 'Retrain completes with better AUC and offline precision. Promoted to production with old threshold. Precision drops immediately. Three weeks of investigation before an engineer checks the score distribution and notices the shift.',
    fix: 'Added threshold recalibration as a mandatory step in the promotion checklist. Threshold is computed on a validation set using the business FP/FN cost ratio — not carried over from the previous model version.',
    lesson: 'A model\'s optimal threshold is specific to its score distribution. Every retrain produces a new distribution. Threshold must be recalibrated on the new model\'s outputs, not inherited.',
    tags: ['Threshold', 'Calibration', 'Model Promotion', 'Precision'],
  },
  {
    id: 'c10', sector: 'Classification', severity: 'P2', duration: 'Present from model training',
    title: 'Data Grain Error: Order vs. Item Level',
    what: 'A product recommendation model had unexpectedly high recall but very low precision. Items were being recommended without meaningful personalisation.',
    rootCause: 'Training data was supposed to be at item level (one row per user-item interaction). Due to a join error, the training set was at order level (one row per order), and items within the same order were implicitly treated as interchangeable. The model learned that "if a user bought item A, they\'ll buy everything in the same order" — which is tautologically true but not predictive.',
    timeline: 'Model trains with good offline AUC. Ships. Recommendation diversity is low. Business team notices users are being recommended clearly irrelevant items. Investigation takes 2 weeks to trace to the grain error.',
    fix: 'Rewrote the training data generation query with an explicit grain assertion: deduplicate to one row per (user, item, session_start_ts) before joining. Added a grain validation check to the training pipeline.',
    lesson: 'The grain is the contract. An accidental fan-out join is one of the easiest silent errors in SQL-based training pipelines. Always assert the expected grain before and after every join.',
    tags: ['Data Grain', 'Join Error', 'Training Data', 'SQL'],
  },
  {
    id: 'c11', sector: 'NLP', severity: 'P2', duration: '2 weeks before detection',
    title: 'Null Handling Divergence (NaN → 0 vs NaN → mean)',
    what: 'A text classification model had a 12% precision drop for new users in production compared to the validation set.',
    rootCause: 'Training imputed missing `account_age_days` with the column mean (127 days). The serving code, written by a different team, defaulted to 0. For new users with no account age, the model was receiving 0 at serving time (new/unknown user) but had been trained to associate a mean value (established user pattern) with missing account age.',
    timeline: 'Model launches. New user precision is off. Initially attributed to cold-start. Slice analysis confirms it\'s specifically users where `account_age_days` is null. Serving code reviewed, divergence found.',
    fix: 'Serialised the imputation value (127) alongside the model artifact. Added a serving-feature audit that compares null handling logic for every feature between training and serving.',
    lesson: 'Imputation strategies must be explicitly serialised and versioned with the model. "Mean" is not a constant — it\'s a value computed from your training data that must be reused at serving time.',
    tags: ['Training-Serving Skew', 'Null Handling', 'Imputation', 'New Users'],
  },
  {
    id: 'c12', sector: 'Delivery Logistics', severity: 'P2', duration: '6 months after expansion',
    title: 'Geographic Distribution Shift After Market Expansion',
    what: 'A delivery time prediction model was trained on dense urban markets. After expanding to suburban markets, its RMSE increased from 4.2 to 11.8 minutes.',
    rootCause: 'Training data was 90% urban market. Features like `restaurant_density_1km`, `traffic_index`, and `driver_availability` had completely different value ranges in suburban markets. The model had never seen the suburban distribution — it was extrapolating far outside its training domain.',
    timeline: 'Expansion launches. Delivery time estimates are widely off in new markets. Customer complaints spike. Root cause identified immediately — but model had no mechanism to detect or flag out-of-distribution inputs.',
    fix: 'Collected 8 weeks of suburban data before retraining. Added an OOD detection layer: if a prediction request has > 2 features outside the training distribution range, apply a confidence penalty to the output. Implemented geo-stratified training.',
    lesson: 'A model trained on one geographic distribution will fail silently on another. When expanding to new markets, collect labelled data first — even 4–6 weeks — before deploying the existing model without modification.',
    tags: ['Distribution Shift', 'Geographic Bias', 'OOD Detection', 'Expansion'],
  },
  {
    id: 'c13', sector: 'Fraud Detection', severity: 'P1', duration: '90 minutes to rollback',
    title: 'Point-in-Time Join Bug in Retrain',
    what: 'A fraud model retrain produced AUC 0.96 offline. Online: precision dropped from 0.84 to 0.29 in 2 hours.',
    rootCause: 'A refactored training pipeline switched from a Feast get_historical_features() call (which enforces point-in-time correctness) to a raw SQL join on user_id. This silently joined features at their current values rather than their values at the time of the transaction. Every user\'s feature row reflected their current state — not their state at the time of fraud.',
    timeline: 'Retrain completes. Offline metrics look excellent. Promoted to production. Within 2 hours, fraud ops flags precision collapse. Champion model still in shadow — rollback in 90 minutes.',
    fix: 'Re-implemented all training joins using Feast. Added a mandatory point-in-time correctness test: for 1000 historical events, compare features from the raw join vs the asof join. Any feature with > 0.05 mean difference blocks training.',
    lesson: 'Point-in-time correctness is not a nice-to-have — it is the difference between a model that predicts fraud and one that predicts whether a user was later identified as a fraudster. These are different targets.',
    tags: ['Label Leakage', 'Point-in-Time', 'Feature Store', 'Fraud'],
  },
  {
    id: 'c14', sector: 'Ranking', severity: 'P2', duration: 'Experiment ran to completion incorrectly',
    title: 'Peeking and Early Stopping',
    what: 'A ranking experiment was called at day 8 of a planned 14-day run when the primary metric hit p=0.04. The effect did not hold — a rerun found no significant effect.',
    rootCause: 'An engineer checked the experiment dashboard daily and stopped the test when the p-value crossed 0.05. This is the "peeking problem": under repeated testing, the probability of seeing p < 0.05 at some point in a 14-day run is ~30% even with no real effect. The experiment was stopped at a local fluctuation.',
    timeline: 'Experiment starts. Engineer peeks daily. Day 8: p=0.04, experiment stopped and declared positive. Feature ships. 6 weeks later: rerun of the same experiment finds p=0.67.',
    fix: 'Implemented sequential testing (mSPRT) for experiments that may need early stopping. All other experiments: dashboard is locked for interim results. P-value visible only after the pre-registered duration.',
    lesson: 'A p-value is only valid if you commit to checking it once. Every additional peek is a new test — and family-wise error accumulates. If you need to stop early, use sequential testing from the start.',
    tags: ['Peeking', 'A/B Testing', 'Sequential Testing', 'Experimentation'],
  },
  {
    id: 'c15', sector: 'Model Operations', severity: 'P1', duration: '4 hours to restore',
    title: 'Delayed Rollback Due to Missing Runbook',
    what: 'A production model with a clear degradation signal took 4 hours to roll back because the rollback procedure was undocumented and the on-call engineer had never done it.',
    rootCause: 'No rollback runbook existed. The model artifact was stored in a custom registry. The serving infrastructure required a specific deployment flag format. The on-call rotation had recently changed and the new on-call engineer had no institutional knowledge. Four hours were spent escalating to find someone who knew the procedure.',
    timeline: '02:00: Alert fires. 02:15: Engineer identifies model as root cause. 02:15–06:00: Engineer attempts rollback, escalates twice, waits for senior engineer. 06:00: Rollback complete. SLA breach: 4 hours of degraded service.',
    fix: 'Wrote a rollback runbook (< 5 steps) and added it to the on-call handbook. Required every on-call rotation to verify they could execute a rollback before going live. Defined a rollback SLA: intent within 15 minutes, execution within 30 minutes.',
    lesson: 'A rollback procedure that exists but is undocumented does not exist for practical purposes. Runbooks must be written, tested, and accessible before an incident — not during one.',
    tags: ['Rollback', 'Incident Response', 'On-Call', 'MLOps', 'Runbook'],
  },
]

// ─── Case Library component ───────────────────────────────────────────────────
const CASE_SECTORS = ['All', 'Recommendations', 'Fraud Detection', 'Search Ranking', 'Pricing', 'Content Ranking', 'Feature Engineering', 'Classification', 'NLP', 'Delivery Logistics', 'Ranking', 'Model Operations', 'Experimentation']
const SEVERITY_COLORS = { P0: '#ff3b3b', P1: 'var(--rose)', P2: 'var(--ember)' }

function CaseDetail({ c, onBack }) {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0' }}>
      <button onClick={onBack} className="btn-ghost" style={{ alignSelf: 'flex-start', marginBottom: '28px', fontSize: '13px' }}>← Back to Case Library</button>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: SEVERITY_COLORS[c.severity], color: 'var(--white)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{c.severity}</span>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{c.sector}</span>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>·</span>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{c.duration}</span>
      </div>

      <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', marginBottom: '32px', lineHeight: 1.2 }}>{c.title}</h1>

      {[
        { label: 'What happened',  color: 'var(--rose)',  content: c.what },
        { label: 'Root cause',     color: 'var(--ember)', content: c.rootCause },
        { label: 'Timeline',       color: 'var(--sky)',   content: c.timeline },
        { label: 'Fix applied',    color: 'var(--mint)',  content: c.fix },
        { label: 'Key lesson',     color: 'var(--prime)', content: c.lesson },
      ].map(section => (
        <div key={section.label} style={{ marginBottom: '28px', paddingLeft: '16px', borderLeft: `3px solid ${section.color}40` }}>
          <div style={{ fontSize: '11px', color: section.color, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '8px', fontWeight: 700 }}>{section.label}</div>
          <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{section.content}</p>
        </div>
      ))}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', paddingTop: '20px', borderTop: '1px solid var(--rim)' }}>
        {c.tags.map(tag => (
          <span key={tag} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', color: 'var(--ink-low)', borderRadius: '5px', padding: '2px 8px' }}>{tag}</span>
        ))}
      </div>
    </div>
  )
}

function CaseLibrary() {
  const [activeSector, setActiveSector] = useState('All')
  const [openCase,     setOpenCase]     = useState(null)

  const filtered = activeSector === 'All' ? CASES : CASES.filter(c => c.sector === activeSector)

  if (openCase) return <CaseDetail c={openCase} onBack={() => setOpenCase(null)} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.6, maxWidth: '540px' }}>
        {CASES.length} real production failure post-mortems. Root cause, timeline, fix, and the lesson that prevents the next one.
      </p>

      {/* Sector filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {['All', 'Recommendations', 'Fraud Detection', 'Search Ranking', 'Experimentation', 'Feature Engineering', 'Model Operations'].map(s => (
          <button key={s} onClick={() => setActiveSector(s)}
            className={`sub-tab ${activeSector === s ? 'active' : 'inactive'}`} style={{ fontSize: '12px' }}>{s}</button>
        ))}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{filtered.length} case{filtered.length !== 1 ? 's' : ''}</div>

      {/* Case grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
        {filtered.map(c => (
          <button key={c.id} onClick={() => setOpenCase(c)}
            className="card" style={{ textAlign: 'left', cursor: 'pointer', padding: '18px 20px', transition: 'transform 0.12s, box-shadow 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: SEVERITY_COLORS[c.severity], color: 'var(--white)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{c.severity}</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace' "}}>{c.sector}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '8px', lineHeight: 1.3 }}>{c.title}</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0, marginBottom: '12px' }}>{c.what.slice(0, 110)}…</p>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {c.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', color: 'var(--ink-low)', borderRadius: '4px', padding: '1px 6px' }}>{tag}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Post → practice tab map ─────────────────────────────────────────────────
const POST_PRACTICE = {
  1:  { tab: 'features',     label: 'Feature Engineering — Skew Simulator' },
  2:  { tab: 'spark',        label: 'Spark Lab — Shuffle Hell' },
  3:  { tab: 'eval',         label: 'Model Evaluation — Metric Selector' },
  4:  { tab: 'design',       label: 'System Design — Two-Tower Explorer' },
  5:  { tab: 'monitor',      label: 'Monitoring — Drift Dashboard' },
  6:  { tab: 'models',       label: 'Math Foundations — PCA Explorer' },
  7:  { tab: 'features',     label: 'Feature Engineering — Feature Store Designer' },
  8:  { tab: 'interview',    label: 'Interview Prep — System Design Questions' },
  9:  { tab: 'dl',           label: 'Training Lab — Backprop Debugging' },
  10: { tab: 'eval',         label: 'Model Evaluation — Metric Selector' },
  11: { tab: 'design',       label: 'System Design — Design Canvas' },
  12: { tab: 'dl',           label: 'Training Lab — Training Failure Diagnosis' },
  13: { tab: 'interview',    label: 'Interview Prep — System Design Questions' },
}

// ─── Post reader ─────────────────────────────────────────────────────────────
function PostReader({ post, onBack, onNavigate, isRead, onMarkRead }) {
  const [scrollPct, setScrollPct] = useState(0)

  function handleScroll(e) {
    const el = e.currentTarget
    const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
    setScrollPct(Math.min(100, pct))
  }

  // Block-based renderer — supports code blocks, callouts, lists, inline bold
  function renderInline(text) {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, j) => j % 2 === 1
      ? <strong key={j} style={{ color: 'var(--ink-hi)', fontWeight: 600 }}>{part}</strong>
      : part)
  }

  function renderBody(text) {
    const lines = text.split('\n')
    const blocks = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // Code block
      if (line.trimStart().startsWith('```')) {
        const lang = line.trimStart().slice(3).trim()
        const codeLines = []
        i++
        while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
          codeLines.push(lines[i]); i++
        }
        blocks.push({ type: 'code', lang, content: codeLines.join('\n') })
        i++; continue
      }

      // Callout: > TIP / > WARNING / > LESSON
      if (line.startsWith('> ')) {
        const calloutLines = []
        while (i < lines.length && lines[i].startsWith('> ')) {
          calloutLines.push(lines[i].slice(2)); i++
        }
        const raw = calloutLines.join(' ')
        const upper = raw.toUpperCase()
        const calloutType = upper.startsWith('WARNING') ? 'warning' : upper.startsWith('LESSON') ? 'lesson' : 'tip'
        blocks.push({ type: 'callout', calloutType, content: raw })
        continue
      }

      // List
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const items = []
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
          items.push(lines[i].slice(2)); i++
        }
        blocks.push({ type: 'list', items }); continue
      }

      // Empty line
      if (line.trim() === '') { i++; continue }

      // Paragraph (accumulate until empty line or special)
      const paraLines = []
      while (i < lines.length && lines[i].trim() !== '' &&
             !lines[i].trimStart().startsWith('```') &&
             !lines[i].startsWith('> ') &&
             !lines[i].startsWith('- ') &&
             !lines[i].startsWith('* ')) {
        paraLines.push(lines[i]); i++
      }
      if (paraLines.length) blocks.push({ type: 'para', content: paraLines.join(' ') })
    }

    const CALLOUT_STYLES = {
      tip:     { bg: 'rgba(240,165,0,0.07)',  border: 'rgba(240,165,0,0.25)',  text: 'var(--prime)', label: 'TIP' },
      warning: { bg: 'rgba(244,63,94,0.07)',  border: 'rgba(244,63,94,0.25)', text: 'var(--rose)',  label: 'WARNING' },
      lesson:  { bg: 'rgba(34,211,238,0.07)', border: 'rgba(34,211,238,0.25)',text: 'var(--sky)',   label: 'LESSON' },
    }

    return blocks.map((block, idx) => {
      if (block.type === 'code') return (
        <pre key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--ink-mid)', lineHeight: 1.8, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--rim)', borderRadius: '10px', padding: '16px 20px', margin: '20px 0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {block.lang && <div style={{ fontSize: '10px', color: 'var(--sky)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{block.lang}</div>}
          <code>{block.content}</code>
        </pre>
      )
      if (block.type === 'callout') {
        const c = CALLOUT_STYLES[block.calloutType]
        return (
          <div key={idx} style={{ padding: '14px 18px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', margin: '20px 0' }}>
            <div style={{ fontSize: '10px', color: c.text, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', fontWeight: 700 }}>{c.label}</div>
            <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{renderInline(block.content)}</p>
          </div>
        )
      }
      if (block.type === 'list') return (
        <ul key={idx} style={{ margin: '0 0 18px', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {block.items.map((item, j) => (
            <li key={j} style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.75 }}>{renderInline(item)}</li>
          ))}
        </ul>
      )
      // Paragraph or heading
      const content = block.content.trim()
      if (/^\*\*[^*]+\*\*$/.test(content)) {
        return <h3 key={idx} style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 700, color: 'var(--ink-hi)', marginTop: '32px', marginBottom: '10px', letterSpacing: '-0.02em' }}>{content.slice(2,-2)}</h3>
      }
      return (
        <p key={idx} style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.85, marginBottom: '18px' }}>
          {renderInline(content)}
        </p>
      )
    })
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Reading progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '2px', background: 'var(--rim)', zIndex: 100 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#22d3ee)', width: `${scrollPct}%`, transition: 'width 0.1s', borderRadius: '1px' }} />
      </div>

      {/* Back + mark read */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={onBack} className="btn-ghost" style={{ fontSize: '13px' }}>
          ← Back to Gradient
        </button>
        <button onClick={onMarkRead} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '7px', border: `1px solid ${isRead ? 'rgba(52,211,153,0.4)' : 'var(--rim)'}`, background: isRead ? 'rgba(52,211,153,0.08)' : 'transparent', color: isRead ? 'var(--mint)' : 'var(--ink-low)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>
          {isRead ? '✓ Read' : 'Mark as read'}
        </button>
      </div>

      <article onScroll={handleScroll} style={{ outline: 'none' }}>
        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: post.catColor.bg, color: post.catColor.text, border: `1px solid ${post.catColor.border}`, fontFamily: 'var(--font-sans)' }}>{post.category}</span>
          {post.domain && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--rim)', color: DOMAIN_COLOR[post.domain] ?? 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{post.domain}</span>}
          <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{post.readMin} min read</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 700, color: 'var(--ink-hi)', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '20px' }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        <p style={{ fontSize: '16px', color: 'var(--ink-mid)', lineHeight: 1.7, marginBottom: '36px', borderLeft: `3px solid ${post.catColor.text}`, paddingLeft: '16px', fontStyle: 'italic' }}>
          {post.excerpt}
        </p>

        <div style={{ height: '1px', background: 'var(--rim)', marginBottom: '36px' }} />

        {/* YouTube embeds */}
        {post.youtube && post.youtube.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            {post.youtube.map(v => <YouTubeEmbed key={v.id} videoId={v.id} title={v.title} />)}
          </div>
        )}

        {/* Body */}
        <div>{renderBody(post.body)}</div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--rim)' }}>
          {post.tags.map(t => (
            <span key={t} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--rim)', color: 'var(--ink-low)', borderRadius: '5px', padding: '3px 10px' }}>{t}</span>
          ))}
        </div>

        {/* Practice CTA */}
        {POST_PRACTICE[post.id] && onNavigate && (
          <div style={{ marginTop: '32px', padding: '20px 24px', background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--sky)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Apply what you just read</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-mid)' }}>{POST_PRACTICE[post.id].label}</div>
            </div>
            <button onClick={() => onNavigate(POST_PRACTICE[post.id].tab)} className="btn-primary" style={{ fontSize: '12px', padding: '8px 16px', whiteSpace: 'nowrap' }}>
              Practice this →
            </button>
          </div>
        )}
      </article>
    </div>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, featured, onClick, isRead }) {
  if (featured) {
    return (
      <button onClick={onClick} className="card" style={{ textAlign: 'left', cursor: 'pointer', gridColumn: '1 / -1', padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center', border: `1px solid ${post.catColor.border}`, background: `linear-gradient(135deg, var(--depth) 0%, ${post.catColor.bg} 100%)`, transition: 'transform 0.15s', }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
            <span className="badge badge-indigo" style={{ fontSize: '10px' }}>Featured</span>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: post.catColor.bg, color: post.catColor.text, border: `1px solid ${post.catColor.border}`, fontFamily: 'var(--font-sans)' }}>{post.category}</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, color: 'var(--ink-hi)', lineHeight: 1.25, marginBottom: '14px', letterSpacing: '-0.01em' }}>{post.title}</h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, marginBottom: '16px' }}>{post.excerpt.slice(0, 180)}…</p>
          <span style={{ fontSize: '13px', color: post.catColor.text, fontWeight: 600 }}>Read {post.readMin} min →</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {post.tags.slice(0, 4).map(t => (
            <div key={t} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', padding: '6px 12px' }}>{t}</div>
          ))}
        </div>
      </button>
    )
  }

  return (
    <button onClick={onClick} className="card" style={{ textAlign: 'left', cursor: 'pointer', padding: '20px 22px', transition: 'transform 0.15s, border-color 0.15s', }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = post.catColor.border }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--rim)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: post.catColor.bg, color: post.catColor.text, border: `1px solid ${post.catColor.border}`, fontFamily: 'var(--font-sans)' }}>{post.category}</span>
        {post.domain && <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '999px', border: '1px solid var(--rim)', color: DOMAIN_COLOR[post.domain] ?? 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{post.domain}</span>}
        {post.youtube && post.youtube.length > 0 && <span style={{ fontSize: '9px', color: 'var(--rose)', fontFamily: 'var(--font-mono)' }}>▶ video</span>}
        {isRead && <span style={{ fontSize: '9px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}>✓ read</span>}
        <span style={{ fontSize: '11px', color: 'var(--ink-ghost)' }}>{post.readMin} min</span>
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 700, color: 'var(--ink-hi)', lineHeight: 1.3, marginBottom: '10px' }}>{post.title}</h2>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.65 }}>{post.excerpt.slice(0, 130)}…</p>
    </button>
  )
}

// ─── Main tab ────────────────────────────────────────────────────────────────
export default function GradientTab({ onNavigate }) {
  const [activeDomain, setActiveDomain] = useState('all')
  const [reading,      setReading]      = useState(null)
  const [mode,         setMode]         = useState('posts')  // 'posts' | 'cases'
  const [read, setRead] = useState(() => new Set(JSON.parse(localStorage.getItem('msl_read') || '[]')))

  function markRead(id) {
    const next = new Set(read)
    next.add(id)
    setRead(next)
    localStorage.setItem('msl_read', JSON.stringify([...next]))
  }

  const filtered = POSTS.filter(p => activeDomain === 'all' || p.domain === activeDomain)
  const featured = filtered.filter(p => p.featured)
  const rest      = filtered.filter(p => !p.featured)

  if (reading) {
    const post = POSTS.find(p => p.id === reading)
    if (post) return <PostReader post={post} onBack={() => setReading(null)} onNavigate={onNavigate} isRead={read.has(post.id)} onMarkRead={() => markRead(post.id)} />
  }

  if (mode === 'cases') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0, marginBottom: '4px' }}>Case Library</h1>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', margin: 0 }}>Production failure post-mortems from ML systems.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[{ k: 'posts', l: '∇ Posts' }, { k: 'cases', l: 'Cases' }].map(m => (
            <button key={m.k} onClick={() => setMode(m.k)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, background: mode === m.k ? 'var(--prime)' : 'rgba(0,0,0,0.3)', color: mode === m.k ? '#000' : 'var(--ink-mid)', transition: 'all 0.15s' }}>
              {m.l}
            </button>
          ))}
        </div>
      </div>
      <CaseLibrary />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '8px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Gradient
            </h1>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--ink-low)' }}>∇ long-form ML writing</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '560px' }}>
            Start here. Read a post, understand the concept, then hit Practice to apply it in the interactive modules. Each post links directly to its practice module.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {[{ k: 'posts', l: '∇ Posts' }, { k: 'cases', l: 'Cases' }].map(m => (
            <button key={m.k} onClick={() => setMode(m.k)}
              style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, background: mode === m.k ? 'var(--prime)' : 'rgba(0,0,0,0.3)', color: mode === m.k ? '#000' : 'var(--ink-mid)', transition: 'all 0.15s' }}>
              {m.l}
            </button>
          ))}
        </div>
      </div>

      {/* Domain filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {GRADIENT_DOMAINS.map(d => (
          <button key={d.id} onClick={() => setActiveDomain(d.id)}
            style={{
              padding: '5px 12px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', border: 'none',
              fontFamily: 'var(--font-sans)', fontWeight: 500, transition: 'all 0.12s',
              background: activeDomain === d.id ? (d.color ? `${d.color}20` : 'rgba(255,255,255,0.08)') : 'rgba(0,0,0,0.25)',
              color: activeDomain === d.id ? (d.color ?? 'var(--ink-hi)') : 'var(--ink-low)',
              border: activeDomain === d.id ? `1px solid ${d.color ?? 'var(--rim)'}40` : '1px solid var(--rim)',
            }}>
            {d.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {featured.map(p => <PostCard key={p.id} post={p} featured isRead={read.has(p.id)} onClick={() => setReading(p.id)} />)}
        {rest.map(p => <PostCard key={p.id} post={p} isRead={read.has(p.id)} onClick={() => setReading(p.id)} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-low)', fontSize: '14px' }}>
          No posts in this category yet.
        </div>
      )}
    </div>
  )
}
