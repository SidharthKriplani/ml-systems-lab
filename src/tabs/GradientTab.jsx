import { useState } from 'react'

const POSTS = [
  {
    id: 1,
    slug: 'training-serving-skew',
    title: 'Why Training-Serving Skew Silently Kills Production Models',
    category: 'Feature Engineering',
    catColor: { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee', border: 'rgba(34,211,238,0.2)' },
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
  },
  {
    id: 2,
    slug: 'spark-shuffle-mental-model',
    title: 'PySpark Shuffle: The Complete Mental Model',
    category: 'PySpark',
    catColor: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
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
  },
  {
    id: 3,
    slug: 'auc-is-not-your-friend',
    title: 'AUC Is Not Your Friend: A Guide to ML Metric Selection',
    category: 'Model Evaluation',
    catColor: { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.2)' },
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
  },
  {
    id: 4,
    slug: 'rec-system-design-framework',
    title: 'How to Design a Recommendation System (The MLE Interview Framework)',
    category: 'ML System Design',
    catColor: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.2)' },
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
  },
  {
    id: 5,
    slug: 'concept-drift-detection',
    title: 'Concept Drift: How to Detect It Before It Destroys Your Model',
    category: 'Monitoring',
    catColor: { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e', border: 'rgba(244,63,94,0.2)' },
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
  },
  {
    id: 7,
    slug: 'feature-store-architecture',
    title: 'Feature Store Architecture: What the Tutorials Skip',
    category: 'Feature Engineering',
    catColor: { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee', border: 'rgba(34,211,238,0.2)' },
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
  },
  {
    id: 8,
    slug: 'mle-interview-system-design-prep',
    title: 'The MLE Interview Framework: What Top Companies Actually Ask',
    category: 'Interview Prep',
    catColor: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.2)' },
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
  },
  {
    id: 10,
    slug: 'shap-feature-importance',
    title: 'SHAP Values: Feature Importance That Actually Makes Sense',
    category: 'Model Evaluation',
    catColor: { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.2)' },
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
  },
  {
    id: 11,
    slug: 'cold-start-problem',
    title: 'The Cold Start Problem: Beyond Popularity Heuristics',
    category: 'ML System Design',
    catColor: { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e', border: 'rgba(244,63,94,0.2)' },
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
  },
  {
    id: 13,
    slug: 'ml-interview-mistakes',
    title: '10 ML Interview Mistakes Even Senior Engineers Make',
    category: 'Interview Prep',
    catColor: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.2)' },
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
  },
]

const CATEGORIES = ['All', 'Feature Engineering', 'PySpark', 'Model Evaluation', 'ML System Design', 'Monitoring', 'Models & Math', 'Interview Prep']

// ─── Post reader ─────────────────────────────────────────────────────────────
function PostReader({ post, onBack }) {
  const [scrollPct, setScrollPct] = useState(0)

  function handleScroll(e) {
    const el = e.currentTarget
    const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
    setScrollPct(Math.min(100, pct))
  }

  // Simple markdown-ish renderer
  function renderBody(text) {
    return text.split('\n\n').map((para, i) => {
      if (para.startsWith('**') && para.endsWith('**') && para.split('**').length === 3) {
        return <h3 key={i} style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '17px', fontWeight: 700, color: '#eaecff', marginTop: '32px', marginBottom: '10px', letterSpacing: '-0.02em' }}>{para.slice(2, -2)}</h3>
      }
      // Inline bold
      const parts = para.split(/\*\*(.*?)\*\*/g)
      return (
        <p key={i} style={{ fontSize: '15px', color: '#8891b8', lineHeight: 1.85, marginBottom: '18px' }}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#eaecff', fontWeight: 600 }}>{part}</strong> : part)}
        </p>
      )
    })
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Reading progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '2px', background: '#1c2040', zIndex: 100 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#22d3ee)', width: `${scrollPct}%`, transition: 'width 0.1s', borderRadius: '1px' }} />
      </div>

      {/* Back */}
      <button onClick={onBack} className="btn-ghost" style={{ alignSelf: 'flex-start', marginBottom: '32px', fontSize: '13px' }}>
        ← Back to Gradient
      </button>

      <article onScroll={handleScroll} style={{ outline: 'none' }}>
        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: post.catColor.bg, color: post.catColor.text, border: `1px solid ${post.catColor.border}`, fontFamily: "'Space Grotesk',sans-serif" }}>{post.category}</span>
          <span style={{ fontSize: '12px', color: '#525a82' }}>{post.readMin} min read</span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 700, color: '#eaecff', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '20px' }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        <p style={{ fontSize: '16px', color: '#8891b8', lineHeight: 1.7, marginBottom: '36px', borderLeft: `3px solid ${post.catColor.text}`, paddingLeft: '16px', fontStyle: 'italic' }}>
          {post.excerpt}
        </p>

        <div style={{ height: '1px', background: '#1c2040', marginBottom: '36px' }} />

        {/* Body */}
        <div>{renderBody(post.body)}</div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #1c2040' }}>
          {post.tags.map(t => (
            <span key={t} style={{ fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", background: 'rgba(255,255,255,0.04)', border: '1px solid #1c2040', color: '#525a82', borderRadius: '5px', padding: '3px 10px' }}>{t}</span>
          ))}
        </div>
      </article>
    </div>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────
function PostCard({ post, featured, onClick }) {
  if (featured) {
    return (
      <button onClick={onClick} className="card" style={{ textAlign: 'left', cursor: 'pointer', gridColumn: '1 / -1', padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center', border: `1px solid ${post.catColor.border}`, background: `linear-gradient(135deg, #0b0d1a 0%, ${post.catColor.bg} 100%)`, transition: 'transform 0.15s', }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
            <span className="badge badge-indigo" style={{ fontSize: '10px' }}>Featured</span>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: post.catColor.bg, color: post.catColor.text, border: `1px solid ${post.catColor.border}`, fontFamily: "'Space Grotesk',sans-serif" }}>{post.category}</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: 700, color: '#eaecff', lineHeight: 1.25, marginBottom: '14px', letterSpacing: '-0.01em' }}>{post.title}</h2>
          <p style={{ fontSize: '14px', color: '#525a82', lineHeight: 1.7, marginBottom: '16px' }}>{post.excerpt.slice(0, 180)}…</p>
          <span style={{ fontSize: '13px', color: post.catColor.text, fontWeight: 600 }}>Read {post.readMin} min →</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {post.tags.slice(0, 4).map(t => (
            <div key={t} style={{ fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", color: '#525a82', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', padding: '6px 12px' }}>{t}</div>
          ))}
        </div>
      </button>
    )
  }

  return (
    <button onClick={onClick} className="card" style={{ textAlign: 'left', cursor: 'pointer', padding: '20px 22px', transition: 'transform 0.15s, border-color 0.15s', }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = post.catColor.border }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#1c2040' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: post.catColor.bg, color: post.catColor.text, border: `1px solid ${post.catColor.border}`, fontFamily: "'Space Grotesk',sans-serif" }}>{post.category}</span>
        <span style={{ fontSize: '11px', color: '#2d3260' }}>{post.readMin} min</span>
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: 700, color: '#eaecff', lineHeight: 1.3, marginBottom: '10px' }}>{post.title}</h2>
      <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.65 }}>{post.excerpt.slice(0, 130)}…</p>
    </button>
  )
}

// ─── Main tab ────────────────────────────────────────────────────────────────
export default function GradientTab() {
  const [activeCat, setActiveCat] = useState('All')
  const [reading,   setReading]   = useState(null)

  const filtered = POSTS.filter(p => activeCat === 'All' || p.category === activeCat)
  const featured = filtered.filter(p => p.featured)
  const rest      = filtered.filter(p => !p.featured)

  if (reading) {
    const post = POSTS.find(p => p.id === reading)
    if (post) return <PostReader post={post} onBack={() => setReading(null)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '8px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#eaecff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Gradient
          </h1>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: '#525a82' }}>∇ long-form ML writing</span>
        </div>
        <p style={{ fontSize: '14px', color: '#525a82', lineHeight: 1.6, maxWidth: '560px' }}>
          Feature engineering, PySpark optimisation, ML system design, model evaluation, and paper breakdowns.
          Written for engineers who ship — not engineers who read papers.
        </p>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setActiveCat(c)}
            className={`sub-tab ${activeCat === c ? 'active' : 'inactive'}`}
            style={{ fontSize: '12px' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {featured.map(p => <PostCard key={p.id} post={p} featured onClick={() => setReading(p.id)} />)}
        {rest.map(p => <PostCard key={p.id} post={p} onClick={() => setReading(p.id)} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#525a82', fontSize: '14px' }}>
          No posts in this category yet.
        </div>
      )}
    </div>
  )
}
