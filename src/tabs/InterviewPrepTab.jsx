import { useState, useMemo, useEffect, useRef } from 'react'

const QUESTIONS = [
  // ─── ML System Design ────────────────────────────────────────────────────
  { id: 1,  cat: 'System Design', company: 'Meta',    level: 'Senior',   q: 'Design a feed ranking system for a social network with 1B users.', framework: ['Problem framing: relevance? engagement? diversity?', 'Data: user events, item metadata, social graph', 'Features: user–item interaction, freshness, social signals', 'Model: two-stage (retrieval → ranking), GBDT or neural ranker', 'Serving: <100ms P99, feature store for online features', 'Monitoring: CTR, dwell time, diversity metrics, position bias'] },
  { id: 2,  cat: 'System Design', company: 'Spotify', level: 'Senior',   q: 'Design a music recommendation system that personalises the home screen.', framework: ['Candidate generation: collaborative filtering + content-based', 'Two-tower model: user embedding + track embedding', 'Negative sampling: in-batch vs hard negatives', 'Freshness: re-rank for new releases, mood signals', 'A/B testing: metric choice (stream rate vs skip rate)', 'Cold start: popularity + genre for new users'] },
  { id: 3,  cat: 'System Design', company: 'Airbnb', level: 'Senior',   q: 'Design a search ranking system for property listings.', framework: ['Query understanding: location, dates, guests, price range', 'Candidate retrieval: ANN on listing embeddings', 'Ranking: LTR model (ListNet/LambdaMART)', 'Features: listing quality, host response rate, price competitiveness, user history', 'Exploration vs exploitation: ε-greedy or UCB', 'Business constraints: host fairness, availability filtering'] },
  { id: 4,  cat: 'System Design', company: 'Uber',    level: 'Mid',      q: 'Design a fraud detection system for payment transactions.', framework: ['Real-time constraints: <50ms decision latency', 'Features: transaction amount, velocity, device fingerprint, geo-velocity', 'Model: GBDT for tabular, threshold tuning for precision vs recall', 'Class imbalance: SMOTE? Cost-sensitive learning? Both are wrong. Threshold tuning.', 'Feedback loop: confirmed fraud labels, dispute resolution lag', 'Monitoring: fraud rate, false positive rate, chargeback rate'] },
  { id: 5,  cat: 'System Design', company: 'Google', level: 'Staff',    q: 'Design an ML platform for a company with 500 ML engineers.', framework: ['Feature store: offline (Hive/BQ) + online (Redis/Bigtable)', 'Training: managed jobs, experiment tracking (MLflow), hyperparameter tuning', 'Model registry: versioning, lineage, A/B routing', 'Serving: low-latency inference service, batch scoring pipeline', 'Monitoring: data quality, model performance, drift detection', 'Governance: feature sharing, model cards, access control'] },
  { id: 6,  cat: 'System Design', company: 'Netflix', level: 'Senior',   q: 'Design an A/B testing platform for ML model evaluation.', framework: ['Randomisation unit: user? session? item? (pick wrong → bias)', 'Metric selection: guardrail metrics vs success metrics', 'Sample size calculation: power, MDE, significance level', 'Novelty effect: burn-in period before measuring', 'Interaction effects: overlapping experiments', 'Analysis: t-test, delta method for ratio metrics, CUPED for variance reduction'] },

  // ─── Feature Engineering ─────────────────────────────────────────────────
  { id: 7,  cat: 'Features', company: 'Any',     level: 'Mid',      q: 'What is training-serving skew and how do you detect it?', answer: 'Training-serving skew is when features computed at training time have different distributions than at serving time. Causes: different code paths, different null handling, timestamp bugs, data leakage. Detection: log serving features → compare PSI/KS against training distribution. Fix: use a feature store with a single computation path for both.' },
  { id: 8,  cat: 'Features', company: 'Any',     level: 'Mid',      q: 'Explain the difference between online and offline features. When would you use each?', answer: 'Offline features (batch): computed over historical data, updated periodically (hours/days). E.g., user lifetime value, 30-day purchase count. Low latency to compute, stale by design. Online features (real-time): computed on-the-fly at serving time. E.g., current session page views, cart contents. Fresh but expensive. Hybrid: pre-compute aggregates offline, serve from feature store, update streaming.' },
  { id: 9,  cat: 'Features', company: 'Meta',    level: 'Senior',   q: 'How would you handle a feature with 40% missing values in production?', answer: 'Depends on the missing mechanism. MCAR: mean/median imputation fine. MAR: impute with conditional mean or model. MNAR (most dangerous): encode missingness as a feature itself (binary indicator), model the missing pattern. Never drop rows in production. Always store the imputation strategy computed at training time (in a feature store or artefact) and apply the same logic at serving. Monitor % missing over time as its own drift signal.' },
  { id: 10, cat: 'Features', company: 'Airbnb',  level: 'Senior',   q: 'Design a feature store for a real-time recommendation system serving 10K QPS.', answer: 'Two layers: (1) Offline store (Hive/BigQuery): historical features, training data generation, batch transforms. (2) Online store (Redis/DynamoDB): pre-computed features for sub-millisecond lookup at serving. Key design: materialise offline → online with a streaming pipeline (Flink/Spark Streaming). TTL per feature type. Single feature computation code used in both layers (Python UDFs or dbt). Monitor feature freshness and null rates in both layers.' },
  { id: 11, cat: 'Features', company: 'Any',     level: 'Mid',      q: 'What is target encoding and what are its risks?', answer: 'Target encoding replaces a categorical feature with the mean target value for that category. Risk: data leakage if computed on the full dataset before splitting (test labels influence training features). Fix: compute on training fold only (k-fold cross-validation style). Also: apply additive smoothing for low-frequency categories (blend with global mean). Never use in streaming/online settings without careful stale-value management.' },
  { id: 12, cat: 'Features', company: 'Any',     level: 'Mid',      q: 'How do you handle high-cardinality categorical features?', answer: 'Options by cardinality level: Low (< 20): one-hot. Medium (20–1000): target encoding (with smoothing), embedding layer. High (>1000): hashing trick (FeatureHasher), learned embeddings, frequency-based truncation. For entity IDs (user_id, product_id): always use embeddings in neural models. In tree models: target encoding or frequency encoding. Watch for: cardinality explosion across feature crosses.' },

  // ─── Model Evaluation ────────────────────────────────────────────────────
  { id: 13, cat: 'Evaluation', company: 'Any',     level: 'Mid',      q: 'When would you use PR-AUC over ROC-AUC?', answer: 'Use PR-AUC when positive class is rare (< 10–15% of data). ROC-AUC can be misleadingly high with class imbalance because it accounts for true negatives, which are abundant and easy to classify. PR-AUC focuses only on the positive class precision-recall tradeoff — better for fraud detection, medical diagnosis, spam filtering. Rule of thumb: if you care about the minority class, use PR-AUC.' },
  { id: 14, cat: 'Evaluation', company: 'Uber',    level: 'Senior',   q: 'How do you evaluate a model in shadow mode before promoting to production?', answer: 'Log challenger predictions alongside champion predictions (no user impact). Compare: (1) offline metrics on traffic sample, (2) prediction distribution similarity (KL divergence), (3) latency P50/P99, (4) error rate. Define promotion criteria upfront: e.g., PR-AUC ≥ champion + 2pp, latency ≤ 1.2× champion. Run for sufficient duration (2+ weeks) to cover weekly patterns. Watch for novelty effect if testing on clicked items.' },
  { id: 15, cat: 'Evaluation', company: 'Any',     level: 'Mid',      q: 'Explain calibration. When does a model need to be calibrated?', answer: 'A model is calibrated if P(y=1 | score=0.7) ≈ 0.7 in reality. Calibration matters when: (1) scores are used as probabilities for downstream decisions, (2) comparing scores across models, (3) setting business thresholds. Neural networks and boosted trees are often miscalibrated (overconfident). Methods: Platt scaling (logistic regression on scores), isotonic regression (non-parametric). Assess with reliability diagrams and expected calibration error (ECE).' },
  { id: 16, cat: 'Evaluation', company: 'Meta',    level: 'Senior',   q: 'How do you measure the impact of a ranking model change in production?', answer: 'Online A/B test with proper randomisation (user-level to avoid interference). Success metrics: business KPI (revenue, engagement). Guardrail metrics: latency, error rate, diversity. Watch: (1) novelty effect — users click more on novel items initially, (2) position bias — lower positions get fewer clicks regardless of quality (correct with IPW or cascade model), (3) delayed conversions — some outcomes take days/weeks to materialise (use holdout + long experiment window).' },

  // ─── PySpark & Data Engineering ──────────────────────────────────────────
  { id: 17, cat: 'Spark', company: 'Any',     level: 'Mid',      q: 'What causes a shuffle in Spark and why is it expensive?', answer: 'Wide transformations cause shuffles: groupBy, join (sort-merge), repartition, distinct, orderBy. Expensive because: data is serialised, written to disk, sent over the network, and read/deserialised on the other side. Each shuffle = disk write + network transfer + disk read. Minimise shuffles: broadcast joins for small tables, use partitioning hints, cache before multiple shuffles, enable AQE (spark.sql.adaptive.enabled=true).' },
  { id: 18, cat: 'Spark', company: 'Meta',    level: 'Senior',   q: 'How do you diagnose and fix data skew in a PySpark job?', answer: 'Diagnose: check Spark UI for tasks with >> median duration in a stage (stragglers). Print key distribution: df.groupBy("key").count().orderBy(desc("count")).show(20). Fixes: (1) Salting: add random suffix to hot key, duplicate join table with all salt values. (2) AQE skew join: spark.sql.adaptive.skewJoin.enabled=true. (3) Broadcast join if the other table is small. (4) repartition("less_skewed_key") before aggregation. Root cause: natural hot keys (e.g., "guest", country="US").' },
  { id: 19, cat: 'Spark', company: 'Any',     level: 'Mid',      q: 'What is the Catalyst optimizer and what does it do?', answer: 'Catalyst is Spark\'s query optimisation framework. Logical plan → Analysis → Logical optimisation (predicate pushdown, constant folding, projection pruning) → Physical planning (choose sort-merge vs broadcast join) → Code generation (Tungsten: JVM bytecode generation). Key optimisations: pushdown filters before shuffle, eliminate unused columns early, rewrite subqueries. You can inspect: df.explain(True) shows all four plan stages. AQE extends this with runtime statistics.' },
  { id: 20, cat: 'Spark', company: 'Uber',    level: 'Senior',   q: 'When would you use a broadcast join vs sort-merge join?', answer: 'Broadcast join: one table fits in executor memory (< autoBroadcastJoinThreshold, default 10MB). No shuffle — broadcaster sends full table to every executor. Set: spark.sql.autoBroadcastJoinThreshold = 500MB for medium tables. Sort-merge join: both tables large → sort both by join key, merge. Full shuffle. Explicit: df1.join(broadcast(df2), "key"). Anti-patterns: broadcasting a table that grows over time (silent failures when it exceeds threshold, falls back to sort-merge).' },
  { id: 21, cat: 'Spark', company: 'Any',     level: 'Mid',      q: 'What is the difference between repartition and coalesce?', answer: 'repartition(n): full shuffle, creates exactly n partitions. Use when increasing partitions or when current partitioning is skewed. coalesce(n): no shuffle, combines existing partitions (can only decrease). Use for reducing partitions before write (avoid many small files). Rule of thumb: 128–256 MB per partition for most workloads. After a filter that removes 80% of data: coalesce to avoid writing 5× too many small files.' },
  { id: 22, cat: 'Spark', company: 'Meta',    level: 'Senior',   q: 'How do you optimise a Spark job that reads 10TB of Parquet and runs out of memory?', answer: 'Checklist: (1) Increase shuffle partitions: spark.sql.shuffle.partitions=2000. (2) Enable AQE: adaptive partition coalescing. (3) Push predicates to Parquet reader (partition pruning, column pruning). (4) Increase spark.executor.memory, or add executors. (5) Spill config: spark.sql.shuffle.spill=true with adequate disk. (6) Check for skew: straggler tasks = data skew. (7) Use Delta Lake / partitioned tables to avoid full scan. (8) Increase cores per executor to share JVM overhead.' },

  // ─── Coding / ML Implementation ─────────────────────────────────────────
  { id: 23, cat: 'Coding', company: 'Any',     level: 'Mid',      q: 'Implement gradient descent for linear regression from scratch (numpy).', answer: 'W = np.zeros(X.shape[1]); b = 0\nfor _ in range(epochs):\n    y_hat = X @ W + b\n    loss = np.mean((y_hat - y)**2)\n    dW = (2/n) * X.T @ (y_hat - y)\n    db = (2/n) * np.sum(y_hat - y)\n    W -= lr * dW; b -= lr * db\nKey: vectorise with numpy, don\'t loop over samples. For mini-batch: sample indices before each step.' },
  { id: 24, cat: 'Coding', company: 'Any',     level: 'Mid',      q: 'Write a function to compute top-k precision and recall for a recommendation model.', answer: 'def precision_at_k(actual, predicted, k):\n    pred_k = predicted[:k]\n    hits = len(set(actual) & set(pred_k))\n    return hits / k\n\ndef recall_at_k(actual, predicted, k):\n    pred_k = predicted[:k]\n    hits = len(set(actual) & set(pred_k))\n    return hits / len(actual) if actual else 0\n\nNote: Average across users. For NDCG also weight by position.' },
  { id: 25, cat: 'Coding', company: 'Any',     level: 'Mid',      q: 'How would you implement feature normalisation that avoids data leakage?', answer: 'Always use sklearn Pipeline:\npipe = Pipeline([\n    ("scaler", StandardScaler()),\n    ("clf", LogisticRegression())\n])\npipe.fit(X_train, y_train)  # scaler fitted only on train\npipe.predict(X_test)        # transform uses train statistics\n\nFor cross-validation: use cross_val_score(pipe, X, y) — Pipeline handles fit/transform correctly within each fold.' },

  // ─── Behavioural / Architecture ──────────────────────────────────────────
  { id: 26, cat: 'Architecture', company: 'Any',     level: 'Senior',   q: 'Walk me through how you would debug a model that worked in staging but degrades in production.', answer: '1. Check feature parity: are all features available in prod? Any serving-training skew? 2. Check data volume: are edge cases underrepresented in staging? 3. Check label definition: same labelling logic in both? 4. Feature drift: run PSI on all features. 5. Model confidence distribution: are score distributions matching? 6. Slice analysis: is degradation in a specific segment (device, geo, user cohort)? 7. Check for data pipeline issues: late data, null spikes, schema changes.' },
  { id: 27, cat: 'Architecture', company: 'Google',  level: 'Staff',    q: 'How do you design an ML system that needs to serve 1M QPS with < 50ms P99 latency?', answer: 'Pre-compute wherever possible: run inference batch offline, cache results. For real-time: model compression (quantisation, distillation), ONNX runtime, GPU batching. Tiered serving: fast retrieval (ANN) → lightweight ranking → complex re-ranking only for top-N. Feature serving: dedicated low-latency feature store (Redis clusters). Model caching: cache predictions for frequent input patterns. Autoscaling: K8s HPA on GPU utilisation. Latency budget: feature lookup 5ms + model inference 20ms + overhead 25ms.' },
  { id: 28, cat: 'Architecture', company: 'Spotify', level: 'Senior',   q: 'How do you handle the cold start problem for new users and new items?', answer: 'New users: (1) Ask onboarding questions (genre preferences, artists). (2) Use demographic features if available. (3) Popularity-based recommendations with diversity constraints. (4) UCB/Thompson sampling to explore quickly. New items: (1) Content-based features (audio embeddings, metadata). (2) Publisher/artist popularity as proxy. (3) Promote in exploration buckets. (4) Hybrid model: collaborative for warm items, content-based for cold. Track when items "warm up" and transition strategies.' },

  // ─── More System Design ──────────────────────────────────────────────────
  { id: 29, cat: 'System Design', company: 'Uber',    level: 'Senior',   q: 'Design a real-time ETA prediction system for a ride-sharing platform.', framework: ['Input features: origin/dest, time of day, day of week, traffic speed (real-time), historical travel times, surge zone', 'Model: gradient boosted trees → can add neural net for complex spatial patterns', 'Latency: < 100ms — pre-compute common route segments, cache traffic embeddings', 'Accuracy metric: MAE in minutes; business metric: user-facing ETA deviation', 'Calibration: ETAs must be slightly pessimistic (underestimate = cancellations)', 'Monitoring: ETA error per city/hour/route type; alert on systematic bias'] },
  { id: 30, cat: 'System Design', company: 'Any',     level: 'Mid',      q: 'How would you design a content moderation ML system at scale?', framework: ['Multi-stage: fast binary classifier (< 5ms) → detailed multimodal model for borderline cases', 'Labels: mixture of human review queue, policy violation reports, proactive sampling', 'Precision vs recall: false negatives (missed violations) hurt trust; false positives hurt creators', 'Appeal workflow: human review for appealed decisions, feedback loop to retrain', 'Adversarial robustness: users evade classifiers — monitor evasion patterns', 'Explainability: decisions must be explainable for appeals process'] },
  { id: 31, cat: 'System Design', company: 'Netflix', level: 'Senior',   q: 'Design a personalised notification system (push, email) that maximises engagement without fatiguing users.', framework: ['Two objectives: predict click-through on notification AND predict unsubscribe risk', 'Features: user engagement history, content freshness, time-since-last-notif, day/hour, platform', 'Multi-armed bandit per user for frequency optimisation', 'Budget constraints: cap max notifications per user per day/week', 'A/B test: open rate, click rate, unsubscribe rate, opt-out rate', 'Fatigue signal: decreasing open rate over consecutive notifications for a user'] },
  { id: 32, cat: 'System Design', company: 'Amazon',  level: 'Senior',   q: 'Design a product search ranking system for an e-commerce platform.', framework: ['Query understanding: spell correction, synonym expansion, intent classification', 'Retrieval: BM25 + dense retrieval (bi-encoder), combine with RRF fusion', 'Ranking: LambdaMART or pointwise neural ranker on retrieved candidates', 'Features: textual relevance, price competitiveness, seller quality, conversion history', 'Personalisation: user purchase/browse history, category affinity embeddings', 'Business rules: promoted listings, inventory status, sponsored products (separate model)'] },
  { id: 33, cat: 'System Design', company: 'Google',  level: 'Staff',    q: 'Design a ML system to detect anomalies in time-series metrics at Google scale (millions of time series).', framework: ['Scale: can\'t train individual models per series — learned representations + meta-learning', 'Approach: N-BEATS or Temporal Fusion Transformer for multi-variate forecasting', 'Anomaly = deviation from forecast beyond learned threshold', 'Seasonality: explicit decomposition (daily, weekly, yearly), or let model learn', 'Alert suppression: correlate anomalies across related metrics before alerting', 'Feedback: operator acknowledge/dismiss feeds label to retrain anomaly threshold'] },

  // ─── More Features ───────────────────────────────────────────────────────
  { id: 34, cat: 'Features', company: 'Any',     level: 'Senior',   q: 'How would you compute features for a streaming pipeline with exactly-once semantics?', answer: 'Use Kafka + Flink with checkpointing. Flink guarantees exactly-once with two-phase commit to state backend (RocksDB). Key design: idempotent aggregations (sum, count with watermark deduplication). Late events: watermark delay (allow up to 2 min late). State cleanup: set TTL on state (e.g., session windows close after 30 min inactivity). Output: sink to Redis with conditional write (only update if event timestamp > stored timestamp). Monitor: checkpoint lag, late event rate, watermark progress.' },
  { id: 35, cat: 'Features', company: 'Airbnb',  level: 'Senior',   q: 'Explain point-in-time correct feature joins and why they matter.', answer: 'Point-in-time correct: when generating training data for an event at time T, use feature values as they existed at time T — not their current values. Why it matters: if you train on "host response rate" computed today, you\'re using information unavailable at prediction time → label leakage. Implementation in SQL: asof join — for each event (entity, event_ts), join to feature table on max(feature_ts) where feature_ts <= event_ts. In Feast/Tecton: built-in via get_historical_features() API with entity_df containing event_timestamps.' },
  { id: 36, cat: 'Features', company: 'Any',     level: 'Mid',      q: 'How do you encode cyclical features like hour of day, day of week?', answer: 'Never use raw integers (0–23 for hours) — the model sees 23 and 0 as far apart but they\'re adjacent. Two approaches: (1) Sin/cos encoding: hour_sin = sin(2π × hour / 24), hour_cos = cos(2π × hour / 24). Preserves cyclical distance in 2D space. Simple, always works. (2) Learned embeddings: embed hour as a lookup table. More flexible, captures asymmetric patterns (rush hour is different from midnight). For tree models: sin/cos is better (no embedding layer). For neural models: either works, embedding often better.' },
  { id: 37, cat: 'Features', company: 'Meta',    level: 'Senior',   q: 'How do you handle label delay in a real-time fraud detection system?', answer: 'Label delay: a transaction\'s fraud label (chargeback) arrives days/weeks after the event. Problems: (1) Training on recent data has mostly unlabelled examples. (2) Using only "aged" data = stale model on new fraud patterns. Solutions: (1) Delayed labelling window: only train on transactions > 30 days old (labels are complete). Accept staleness. (2) Early labels: use merchant dispute flags (arrive < 24h) as noisy proxy labels. (3) Semi-supervised: use unlabelled recent data with pseudo-labels. (4) Two models: real-time risk score (features only) + delayed fraud model (with labels) for threshold calibration.' },

  // ─── More Evaluation ─────────────────────────────────────────────────────
  { id: 38, cat: 'Evaluation', company: 'Any',     level: 'Senior',   q: 'Explain the difference between MRR, NDCG, and MAP for ranking evaluation.', answer: 'MRR (Mean Reciprocal Rank): 1/rank of first relevant item. Good for queries with one relevant answer (navigation). Ignores items beyond first hit. MAP (Mean Average Precision): average precision at each rank where a relevant item appears, averaged over queries. Weights precision by recall. Treats all relevant items equally. NDCG (Normalized Discounted Cumulative Gain): allows graded relevance (1–5 stars, not just relevant/not). Discounts by log2(rank+1). Best for multi-level relevance. Use NDCG for search/rec with graded relevance; MAP for binary relevance with multiple relevant items; MRR for single-answer tasks.' },
  { id: 39, cat: 'Evaluation', company: 'Netflix', level: 'Senior',   q: 'How do you handle selection bias when evaluating recommendation systems offline?', answer: 'Selection bias: you only observe outcomes (clicks, plays) for items that were actually shown. Items not shown have no labels — you can\'t know if they\'d have been good. Methods: (1) Inverse Propensity Scoring (IPS): weight observed outcomes by 1/probability of being shown. Requires logging the display probability for every item. (2) Doubly-robust estimation: combine IPS with a reward model. More stable than pure IPS. (3) Interleaving: in production, mix challenger and champion items, infer relative quality from user clicks (no logging requirement). (4) Counterfactual evaluation via causal models. Pure offline evaluation without propensity correction will systematically favour items that are already popular.' },
  { id: 40, cat: 'Evaluation', company: 'Any',     level: 'Mid',      q: 'What is CUPED and when would you use it in an A/B test?', answer: 'CUPED (Controlled-experiment Using Pre-Experiment Data): reduces variance in A/B test metrics by using pre-experiment behaviour as a covariate. Mechanism: Y_adj = Y - θ × (X - E[X]), where X is pre-experiment metric, θ estimated to minimise variance. Effect: same statistical power with 30–50% fewer users, or same users with more power. When to use: metric is noisy (session count, revenue), pre-experiment data is available, metric is stable over time. Don\'t use: short experiment windows (no pre-data), metric is fundamentally new (no baseline). Implemented in LinkedIn\'s TEP, Booking.com\'s experimentation platform, Netflix\'s Experimentation Platform.' },

  // ─── More Spark ──────────────────────────────────────────────────────────
  { id: 41, cat: 'Spark', company: 'Any',     level: 'Senior',   q: 'Explain Spark\'s memory model and how to tune it to avoid OOM errors.', answer: 'Spark executor memory: Reserved memory (300MB) + User memory (25% for UDFs etc) + Spark memory (75% split between execution and storage). Execution memory (shuffles, joins, sorts) and storage memory (RDD cache) share a pool. Tuning: spark.executor.memory (total), spark.memory.fraction (default 0.6), spark.memory.storageFraction (default 0.5). OOM fixes: increase executor memory, reduce partition size (more shuffle.partitions), avoid caching large DataFrames, use persist(StorageLevel.DISK_ONLY) instead of cache(), check for data skew (single task holding too much data), reduce broadcast threshold.' },
  { id: 42, cat: 'Spark', company: 'Any',     level: 'Mid',      q: 'What is Adaptive Query Execution (AQE) and what does it fix?', answer: 'AQE (spark.sql.adaptive.enabled=true, default in Spark 3.2+) re-optimises query plans at runtime using actual statistics from completed shuffle stages. Three key optimisations: (1) Dynamic partition coalescing: merges small shuffle partitions post-shuffle (fixes too many small partitions). (2) Skew join handling: splits skewed partitions and replicates the join side. (3) Dynamic join strategy: switches sort-merge to broadcast join if one side turns out small after filtering. Enable: default ON in Spark 3.2+. Tune: spark.sql.adaptive.skewJoin.enabled, spark.sql.adaptive.coalescePartitions.minPartitionSize.' },
  { id: 43, cat: 'Spark', company: 'Meta',    level: 'Senior',   q: 'How would you write an efficient window function over a 500GB dataset with complex partition keys?', answer: 'Window functions require a shuffle over the partition key — unavoidable. Optimise: (1) Use partitionBy on a high-cardinality, non-skewed key. If using user_id, check for power users (skew). (2) Add an orderBy only when required — ordering within a window is expensive. (3) rowsBetween vs rangeBetween: rowsBetween is faster for most cases. (4) Pre-filter data before windowing — reduce size first. (5) If window results don\'t change often, pre-compute and store. (6) Consider Delta Lake Z-ordering on the partition key to minimise shuffle read. (7) Enable AQE skew handling.' },

  // ─── More Architecture ────────────────────────────────────────────────────
  { id: 44, cat: 'Architecture', company: 'Any',     level: 'Senior',   q: 'How do you implement a safe model rollout strategy?', answer: 'Progressive rollout: shadow mode (0% traffic, log predictions) → 1% canary → 5% → 20% → 50% → 100%. At each stage: monitor latency P50/P99, error rate, business metrics, prediction distribution. Automated rollback: define health thresholds, trigger automatic rollback if breached. Feature flags: decouple deployment (code in prod) from rollout (traffic controlled by flag). Rollback strategy: model registry with previous version tagged, rollback deploys previous artifact. Experiment tracking: log which model version served which request for debugging. Do not skip stages for non-trivial changes.' },
  { id: 45, cat: 'Architecture', company: 'Any',     level: 'Mid',      q: 'What is the difference between model drift and data drift? How do you monitor each?', answer: 'Data drift (covariate shift): input feature distributions change. Monitor: PSI, KS test on feature distributions vs training baseline. Alert threshold: PSI > 0.1. Data drift causes model degradation without model changing. Concept drift (label shift): relationship between features and target changes. Harder to detect (labels arrive slowly). Monitor: proxy metrics (prediction distribution), downstream business metrics. Model drift: catch-all term sometimes used for both. Monitoring cadence: data drift daily (fast to compute), concept drift weekly (requires labels). Always monitor both.' },
  { id: 46, cat: 'Architecture', company: 'Amazon',  level: 'Staff',    q: 'Design a multi-objective ranking system that balances relevance, diversity, and business metrics.', framework: ['Define objectives: relevance (user utility), diversity (avoid homogeneous results), revenue (sponsored items)', 'Scalarisation: weighted sum of objectives — simple but requires careful weight tuning', 'Post-processing re-ranking: MMR (Maximal Marginal Relevance) for diversity after relevance ranking', 'Constrained optimisation: relevance as primary objective, diversity and revenue as constraints', 'Metrics: NDCG for relevance, ILS (Intra-List Similarity) for diversity, revenue per session', 'A/B test design: multi-metric experiment, watch for trade-offs between objectives'] },

  // ─── LLM / GenAI ─────────────────────────────────────────────────────────
  { id: 47, cat: 'Architecture', company: 'Any',     level: 'Senior',   q: 'How would you evaluate an LLM-powered product feature in production?', answer: 'LLM evaluation is harder than classification because outputs are open-ended. Multi-layer approach: (1) Offline eval: hold-out set with human-labelled golden answers, use LLM-as-judge (GPT-4 or claude-3 rating responses 1–5). (2) Online eval: implicit signals (thumbs up/down, follow-up questions, session abandonment, downstream task completion). (3) Regression tests: automated suite of known-good prompt–response pairs, fail build if responses degrade. (4) Red-teaming: adversarial probing for safety, accuracy, and policy violations. Key metrics: response quality, factual accuracy, latency, cost per query, refusal rate.' },
  { id: 48, cat: 'Architecture', company: 'Any',     level: 'Senior',   q: 'Explain RAG (Retrieval-Augmented Generation) and when to use it vs fine-tuning.', answer: 'RAG: at inference time, retrieve relevant documents from a vector store, inject into prompt context, generate response grounded in retrieved content. Fixes: hallucination (grounded in facts), knowledge cutoff (retrieves up-to-date documents), explainability (can cite sources). Fine-tuning: updates model weights on task-specific data. Fixes: style/tone alignment, domain-specific knowledge that doesn\'t fit in context, consistent behaviour patterns. Use RAG when: knowledge base changes frequently, need citations, limited compute. Use fine-tuning when: consistent output format, specific domain jargon, RAG latency is prohibitive. Often both: fine-tune + RAG outperforms either alone.' },
  { id: 49, cat: 'Evaluation', company: 'Any',     level: 'Senior',   q: 'How do you measure and reduce hallucinations in an LLM deployed in production?', answer: 'Measure: (1) Human annotation on sample outputs (gold standard but expensive). (2) Automated: NLI-based fact-checking (claim extraction + entailment model). (3) Self-consistency: sample multiple outputs, measure agreement. Reduce: (1) RAG: ground answers in retrieved facts. (2) System prompt engineering: "answer only with information in the provided documents." (3) Calibrated refusal: model should say "I don\'t know" when uncertain — train/prompt for this. (4) Output confidence: if model gives probability estimates, filter low-confidence claims. (5) Post-processing: fact-checking pipeline before serving response.' },
  { id: 50, cat: 'Coding', company: 'Any',     level: 'Mid',      q: 'Implement a simple cosine similarity search for a vector store (Python, numpy).', answer: 'def cosine_similarity(q, corpus):\n    # q: (d,), corpus: (n, d)\n    q_norm = q / np.linalg.norm(q)\n    corpus_norm = corpus / np.linalg.norm(corpus, axis=1, keepdims=True)\n    return corpus_norm @ q_norm  # (n,)\n\ndef top_k(q, corpus, k=5):\n    scores = cosine_similarity(q, corpus)\n    return np.argsort(scores)[::-1][:k]\n\nFor scale: use FAISS (IndexFlatIP after L2-normalising) for million-scale. Exact search is O(n×d) — fine up to ~100k vectors. Beyond: use HNSW (approximate) for sub-linear query time.' },
  { id: 51, cat: 'System Design', company: 'Any',  level: 'Mid',      q: 'Design a real-time feature pipeline that computes user session features (< 1 min latency).', framework: ['Ingest: Kafka topic per event type (page_view, add_to_cart, purchase)', 'Stream processor: Flink with tumbling/sliding windows (session last 30 min)', 'State: RocksDB (Flink state backend) for per-user session state', 'Output: Redis for serving layer (sub-ms lookup); Kafka for downstream consumers', 'Exactly-once: Flink checkpointing + idempotent Redis writes', 'Monitoring: consumer lag, watermark delay, Redis memory, feature null rate'] },
  { id: 52, cat: 'Architecture', company: 'Any',  level: 'Staff',    q: 'What are the key differences between ML systems at a 50-person startup vs a 5,000-person company? How does your approach change?', answer: 'Startup: speed > robustness. Ship the simplest model that proves value. Off-the-shelf tools (sklearn, FastAPI, SageMaker managed). One engineer owns end-to-end. Monitoring: manual checks + basic alerting. Tech debt is acceptable if acknowledged. Large company: robustness > speed. Models serve millions, failures cost millions. Custom platform (feature store, model registry, CI/CD). Specialised teams (ML engineers, MLOps, platform). Monitoring: automated, paged, with rollback. Governance: model cards, audit trails, fairness testing. As an engineer: at startup, own everything and move fast; at large company, invest in abstractions and enable other teams. Don\'t bring large-company process to a startup, or startup speed culture to production systems serving 100M users.' },
]

const CATEGORIES = ['All', 'System Design', 'Features', 'Evaluation', 'Spark', 'Coding', 'Architecture']
const COMPANIES  = ['All', 'Meta', 'Spotify', 'Google', 'Airbnb', 'Uber', 'Netflix', 'Amazon', 'Any']
const LEVELS     = ['All', 'Mid', 'Senior', 'Staff']

const CAT_COLORS = {
  'System Design': { bg: 'rgba(99,102,241,0.1)',  text: 'var(--violet)', border: 'rgba(99,102,241,0.2)' },
  'Features':      { bg: 'rgba(56,189,248,0.1)',  text: 'var(--sky)',    border: 'rgba(56,189,248,0.2)' },
  'Evaluation':    { bg: 'rgba(6,214,160,0.1)',   text: 'var(--mint)',   border: 'rgba(6,214,160,0.2)' },
  'Spark':         { bg: 'rgba(249,115,22,0.1)',  text: 'var(--ember)',  border: 'rgba(249,115,22,0.2)' },
  'Coding':        { bg: 'rgba(168,85,247,0.1)',  text: 'var(--violet)', border: 'rgba(168,85,247,0.2)' },
  'Architecture':  { bg: 'rgba(244,63,94,0.1)',   text: 'var(--rose)',   border: 'rgba(244,63,94,0.2)' },
}

// ─── Timed Practice Mode ─────────────────────────────────────────────────────
function TimedPractice({ questions, onExit }) {
  const DURATION = 45 * 60  // 45 minutes
  const [idx,      setIdx]      = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [elapsed,  setElapsed]  = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const q = questions[idx]
  const cc = CAT_COLORS[q?.cat] || CAT_COLORS['Architecture']
  const remaining = DURATION - elapsed
  const mins = Math.floor(Math.abs(remaining) / 60)
  const secs = Math.abs(remaining) % 60
  const overtime = remaining < 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Timer bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--rim)', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>Question {idx + 1}/{questions.length}</span>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: cc.bg, color: cc.text, border: `1px solid ${cc.border}`, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>{q?.cat}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: 700, color: overtime ? 'var(--rose)' : remaining < 300 ? 'var(--ember)' : 'var(--mint)' }}>
            {overtime ? '+' : ''}{mins}:{String(secs).padStart(2, '0')}
          </span>
          <button onClick={onExit} className="btn-ghost" style={{ fontSize: '12px' }}>✕ Exit</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
        <div style={{ height: '100%', width: `${Math.min(100, (elapsed / DURATION) * 100)}%`, background: overtime ? 'var(--rose)' : 'linear-gradient(90deg, var(--mint), var(--sky))', borderRadius: '2px', transition: 'width 1s linear' }} />
      </div>

      {/* Question */}
      <div style={{ padding: '28px 32px', background: 'var(--depth)', border: `1px solid ${cc.border}`, borderRadius: '12px' }}>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.5, margin: 0 }}>{q?.q}</p>
      </div>

      {/* Reveal */}
      {!revealed ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={() => setRevealed(true)}>Reveal answer</button>
          <button className="btn-secondary" onClick={() => { setIdx(i => Math.min(i+1, questions.length-1)); setRevealed(false) }}>Skip →</button>
        </div>
      ) : (
        <div>
          <div style={{ padding: '20px 24px', background: cc.bg, border: `1px solid ${cc.border}`, borderRadius: '10px', marginBottom: '14px' }}>
            {q?.framework && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: cc.text, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '8px' }}>Framework</div>
                <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {q.framework.map((f, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.65 }}>{f}</li>)}
                </ol>
              </div>
            )}
            {q?.answer && (
              <div>
                <div style={{ fontSize: '11px', color: cc.text, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '8px' }}>Model Answer</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{q.answer}</p>
              </div>
            )}
          </div>
          <button className="btn-primary" onClick={() => { setIdx(i => Math.min(i+1, questions.length-1)); setRevealed(false) }}
            disabled={idx === questions.length - 1}>
            Next question →
          </button>
          {idx === questions.length - 1 && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.25)', borderRadius: '8px', fontSize: '14px', color: 'var(--mint)', fontWeight: 600 }}>
              ✓ Practice complete! Time: {Math.floor(elapsed/60)}m {elapsed%60}s
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main tab ────────────────────────────────────────────────────────────────
export default function InterviewPrepTab() {
  const [cat,       setCat]       = useState('All')
  const [company,   setCompany]   = useState('All')
  const [level,     setLevel]     = useState('All')
  const [open,      setOpen]      = useState(null)
  const [search,    setSearch]    = useState('')
  const [practising,setPractising]= useState(false)

  const filtered = useMemo(() => QUESTIONS.filter(q => {
    if (cat !== 'All' && q.cat !== cat) return false
    if (company !== 'All' && q.company !== company) return false
    if (level !== 'All' && q.level !== level) return false
    if (search && !q.q.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [cat, company, level, search])

  function shuffle(arr) {
    const a = [...arr]; for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a
  }

  if (practising) return <TimedPractice questions={shuffle(filtered.length > 0 ? filtered : QUESTIONS)} onExit={() => setPractising(false)} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>🎯</span>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em' }}>Interview Prep</h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '580px' }}>
            {QUESTIONS.length} MLE interview questions — Meta, Spotify, Google, Airbnb, Uber, Netflix, Amazon.
            System design, features, evaluation, Spark, coding, architecture. Each with a framework or model answer.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setPractising(true)} style={{ whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
          ⏱ Timed Practice
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…"
          style={{ width: '100%', maxWidth: '400px' }} type="search" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {CATEGORIES.map(c => <button key={c} onClick={() => setCat(c)} className={`sub-tab ${cat === c ? 'active' : 'inactive'}`} style={{ fontSize: '12px' }}>{c}</button>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {COMPANIES.map(c => <button key={c} onClick={() => setCompany(c)} className={`sub-tab ${company === c ? 'active' : 'inactive'}`} style={{ fontSize: '12px' }}>{c}</button>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {LEVELS.map(c => <button key={c} onClick={() => setLevel(c)} className={`sub-tab ${level === c ? 'active' : 'inactive'}`} style={{ fontSize: '12px' }}>{c}</button>)}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{filtered.length} question{filtered.length !== 1 ? 's' : ''} · click to expand answer</div>

      {/* Question list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(q => {
          const cc = CAT_COLORS[q.cat] || CAT_COLORS['Architecture']
          const isOpen = open === q.id
          return (
            <div key={q.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', border: isOpen ? `1px solid ${cc.border}` : '1px solid var(--rim)' }}
              onClick={() => setOpen(isOpen ? null : q.id)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 18px' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: "'JetBrains Mono',monospace", paddingTop: '2px', minWidth: '24px' }}>{String(q.id).padStart(2, '0')}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: cc.bg, color: cc.text, border: `1px solid ${cc.border}`, fontFamily: "'Space Grotesk',sans-serif" }}>{q.cat}</span>
                    {q.company !== 'Any' && <span className="badge badge-ghost" style={{ fontSize: '10px' }}>{q.company}</span>}
                    <span className={`badge ${q.level === 'Staff' ? 'badge-rose' : q.level === 'Senior' ? 'badge-ember' : 'badge-ghost'}`} style={{ fontSize: '10px' }}>{q.level}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.55, margin: 0 }}>{q.q}</p>
                </div>
                <span style={{ color: 'var(--ink-low)', fontSize: '13px', paddingTop: '2px', transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</span>
              </div>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${cc.border}`, padding: '16px 18px 18px 56px', background: cc.bg }}>
                  {q.framework && (
                    <div style={{ marginBottom: q.answer ? '16px' : 0 }}>
                      <div style={{ fontSize: '11px', color: cc.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Framework</div>
                      <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {q.framework.map((f, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.65 }}>{f}</li>)}
                      </ol>
                    </div>
                  )}
                  {q.answer && (
                    <div>
                      <div style={{ fontSize: '11px', color: cc.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Model Answer</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{q.answer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
