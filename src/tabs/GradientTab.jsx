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
