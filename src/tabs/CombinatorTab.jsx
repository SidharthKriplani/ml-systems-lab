import { useState, useEffect, useRef, useCallback } from 'react'
import { trackModuleComplete } from '../analytics'

// ─── Question Bank ──────────────────────────────────────────────────────────

const MCQ_QUESTIONS = [
  // Feature Engineering
  { id: 'C1', domain: 'Feature Engineering', type: 'mcq',
    q: 'Which technique handles high-cardinality categoricals in tree-based models without memory explosion?',
    options: ['One-hot encoding', 'Ordinal encoding by frequency', 'Target encoding with k-fold', 'Binary encoding'],
    correct: 2,
    explanation: 'Target encoding with k-fold prevents leakage while keeping dimensionality at 1. Tree models exploit this efficiently.' },
  { id: 'C2', domain: 'Feature Engineering', type: 'mcq',
    q: 'Feature normalization is critical for which algorithm?',
    options: ['Random Forest', 'Gradient Boosting', 'Support Vector Machine', 'Decision Tree'],
    correct: 2,
    explanation: 'SVMs use distance metrics (kernel), making them sensitive to feature scale. Tree-based methods are invariant to monotonic transformations.' },
  { id: 'C3', domain: 'Feature Engineering', type: 'mcq',
    q: 'What is the correct way to impute missing values to avoid data leakage?',
    options: ['Impute with column mean computed on full dataset', 'Impute with median computed on training set only, then apply same to test', 'Drop rows with missing values', 'Replace with zero always'],
    correct: 1,
    explanation: 'Fit imputer on train, transform both train and test. Using full dataset leaks test statistics into training.' },
  { id: 'C4', domain: 'Feature Engineering', type: 'mcq',
    q: 'Log transformation of a right-skewed feature primarily helps:',
    options: ['Reduce feature correlation', 'Make tree models converge faster', 'Satisfy normality assumptions in linear models', 'Remove outliers'],
    correct: 2,
    explanation: 'Log transform reduces right skew, approximating normality. This improves linear/logistic regression (assumes normally distributed errors) and distance-based methods.' },
  // Model Evaluation
  { id: 'C5', domain: 'Model Evaluation', type: 'mcq',
    q: 'Stratified K-fold cross-validation is essential when:',
    options: ['Dataset has more than 10,000 samples', 'Target class distribution is imbalanced', 'Features have different scales', 'Model has many hyperparameters'],
    correct: 1,
    explanation: 'Stratified k-fold preserves class proportions in each fold, preventing folds from having no positive examples in rare-class scenarios.' },
  { id: 'C6', domain: 'Model Evaluation', type: 'mcq',
    q: 'Which metric is most appropriate for ranking model evaluation?',
    options: ['Accuracy', 'F1 Score', 'NDCG@K', 'AUC-ROC'],
    correct: 2,
    explanation: 'NDCG@K captures position-weighted relevance. For ranking, position matters — relevant item at rank 1 is more valuable than at rank 10.' },
  { id: 'C7', domain: 'Model Evaluation', type: 'mcq',
    q: 'Log loss penalizes:',
    options: ['Only incorrect predictions', 'Confident wrong predictions most severely', 'All predictions equally', 'Predictions far from 0.5 only'],
    correct: 1,
    explanation: 'Log loss = -log(p) for true class. If model predicts p=0.01 for true class, loss = -log(0.01) ≈ 4.6. High confidence wrong predictions = very high loss.' },
  { id: 'C8', domain: 'Model Evaluation', type: 'mcq',
    q: 'Pearson correlation between predicted and actual values measures:',
    options: ['Calibration quality', 'Linear association strength only — misses nonlinear patterns', 'Both precision and recall', 'Model accuracy'],
    correct: 1,
    explanation: 'Pearson measures linear correlation. A model can have high Pearson but poor calibration (all predictions scaled wrong). Use Spearman for monotone, check calibration curves separately.' },
  // ML Systems
  { id: 'C9', domain: 'ML Systems', type: 'mcq',
    q: "A feature pipeline's SLA is 5 minutes but upstream data arrives with variable delay. Best approach?",
    options: ['Fail the pipeline if data is late', 'Use a watermark-based approach with late data handling', 'Always wait for all data', 'Skip late records'],
    correct: 1,
    explanation: 'Streaming systems (Flink/Spark SS) use watermarks to bound lateness. Events within watermark window are processed; beyond it trigger late-data handling (side output or drop).' },
  { id: 'C10', domain: 'ML Systems', type: 'mcq',
    q: 'The primary bottleneck in online feature serving at <10ms SLO is typically:',
    options: ['Model inference', 'Network round-trips to feature store', 'Feature transformation CPU cost', 'JSON serialization'],
    correct: 1,
    explanation: 'Network latency to Redis/Cassandra is typically 1-5ms per call. Multiple lookups add up. Solutions: batch feature requests, co-locate feature store and model server, cache hot user features.' },
  { id: 'C11', domain: 'ML Systems', type: 'mcq',
    q: 'Shadow deployment differs from canary deployment in that:',
    options: ['Shadow is more gradual', 'Shadow serves real users', 'Shadow runs new model but discards responses — zero user impact', 'Shadow uses a different dataset'],
    correct: 2,
    explanation: 'Shadow: mirror production traffic to new model, compare outputs, no user impact. Canary: new model serves real users (small %). Shadow is pure offline validation on live traffic.' },
  { id: 'C12', domain: 'ML Systems', type: 'mcq',
    q: 'What is the most important property of a training-serving skew check?',
    options: ['Comparing model weights between training and serving', 'Verifying feature transformations are identical between training and serving', 'Checking that serving latency is <100ms', 'Ensuring model version is current'],
    correct: 1,
    explanation: 'Training-serving skew: different feature computation in training vs. serving is the #1 source of silent production failures. Test: run same input through both paths, assert output equality.' },
  // Statistics & Probability
  { id: 'C13', domain: 'Statistics & Probability', type: 'mcq',
    q: 'Type II error in hypothesis testing is:',
    options: ['Rejecting a true null hypothesis', 'Failing to reject a false null hypothesis', 'Accepting the alternative when it\'s false', 'Running multiple tests without correction'],
    correct: 1,
    explanation: 'Type I (α): false positive — reject true H0. Type II (β): false negative — fail to reject false H0. Power = 1-β. Increase power by: larger N, larger effect size, higher α.' },
  { id: 'C14', domain: 'Statistics & Probability', type: 'mcq',
    q: 'The central limit theorem states that:',
    options: ['All distributions converge to normal with enough data', 'Sample means of any distribution converge to normal as n increases', 'Large samples have smaller variance', 'Population mean equals sample mean'],
    correct: 1,
    explanation: 'CLT: distribution of sample means approaches N(μ, σ²/n) regardless of population distribution, as n→∞. Enables parametric tests even on non-normal populations. Requires independence.' },
  { id: 'C15', domain: 'Statistics & Probability', type: 'mcq',
    q: 'Bayesian A/B testing compared to frequentist primarily enables:',
    options: ['Faster computation', 'Larger sample sizes', 'Continuous monitoring without inflating Type I error', 'Removing the need for a control group'],
    correct: 2,
    explanation: 'Bayesian: compute P(B>A | data) continuously. No multiple comparisons problem for peeking. Frequentist p-values are invalid if you peek and stop early — optional stopping inflates α.' },
  { id: 'C16', domain: 'Statistics & Probability', type: 'mcq',
    q: 'Maximum Likelihood Estimation (MLE) finds parameters that:',
    options: ['Maximize the prior probability', 'Maximize the posterior probability', 'Maximize the probability of observed data given parameters', 'Minimize variance of the estimator'],
    correct: 2,
    explanation: 'MLE: θ̂ = argmax P(data | θ). No prior. Contrast with MAP (maximum a posteriori) which adds a prior. MLE is equivalent to MAP with uniform prior.' },
  // Deep Learning
  { id: 'C17', domain: 'Deep Learning', type: 'mcq',
    q: 'Dropout during training acts as:',
    options: ['A learning rate scheduler', 'An ensemble of exponentially many sub-networks', 'Gradient clipping', 'Feature selection'],
    correct: 1,
    explanation: 'Dropout randomly zeros units. Equivalent to training 2^N networks sharing weights, then averaging at test time (approximate). Prevents co-adaptation, acts as ensemble.' },
  { id: 'C18', domain: 'Deep Learning', type: 'mcq',
    q: 'When fine-tuning a pretrained language model, which layers should be unfrozen first?',
    options: ['Embedding layers', 'First (earliest) transformer layers', 'Last (top) layers closest to the output', 'All layers simultaneously'],
    correct: 2,
    explanation: 'Lower layers encode general features (syntax, basic semantics). Upper layers encode task-specific features. Fine-tune top layers first (less general), optionally unfreeze lower layers with smaller LR.' },
  { id: 'C19', domain: 'Deep Learning', type: 'mcq',
    q: 'Batch size in deep learning training: doubling batch size with fixed epochs typically:',
    options: ['Has no effect on performance', 'Improves generalization', 'Degrades generalization — larger batches find sharper minima', 'Always requires halving learning rate'],
    correct: 2,
    explanation: 'Large batches → sharper minima → worse generalization (Keskar et al.). Linear scaling rule: when doubling batch size, double LR and use warmup to partially compensate.' },
  { id: 'C20', domain: 'Deep Learning', type: 'mcq',
    q: "The attention mechanism's computational complexity per sequence is:",
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    correct: 2,
    explanation: 'Scaled dot-product attention computes n×n attention matrix. O(n²) in time and space. Sparse attention (Longformer), linear attention, and flash attention are optimizations.' },
  // MLOps
  { id: 'C21', domain: 'MLOps', type: 'mcq',
    q: 'Data versioning in ML pipelines is most critical for:',
    options: ['Reducing storage costs', 'Enabling reproducible model training and debugging production issues', 'Speeding up data ingestion', 'Preventing data leakage'],
    correct: 1,
    explanation: 'If a model misbehaves in production, you need to identify the exact training data. DVC, Delta Lake time-travel, or dataset snapshots enable: rollback, reproduce training, audit lineage.' },
  { id: 'C22', domain: 'MLOps', type: 'mcq',
    q: 'Feature stores provide value primarily by:',
    options: ['Replacing model serving infrastructure', 'Eliminating training-serving skew and enabling feature reuse across teams', 'Automatically engineering features', 'Reducing model training time'],
    correct: 1,
    explanation: 'Feature stores: (1) single source of truth for features, (2) same computation in training (batch) and serving (online), (3) cross-team feature sharing and discovery.' },
  { id: 'C23', domain: 'MLOps', type: 'mcq',
    q: 'Model monitoring differs from application monitoring in that:',
    options: ['Application monitoring is more important', 'Model monitoring requires tracking statistical properties of data and predictions, not just system health', 'Model monitoring only checks latency', 'They are identical in practice'],
    correct: 1,
    explanation: 'App monitoring: latency, error rate, uptime. Model monitoring additionally requires: feature drift (PSI), prediction drift, label feedback quality, calibration, and business metric correlation.' },
  { id: 'C24', domain: 'MLOps', type: 'mcq',
    q: 'A/B testing in MLOps — the holdback group (never-treat) serves what purpose?',
    options: ['Increases statistical power', 'Measures long-term impact beyond initial experiment window', 'Reduces infrastructure cost', 'Prevents network effects'],
    correct: 1,
    explanation: 'Holdback: permanently keep ~5% of users off a feature. Measure long-run impact after novelty wears off. Essential for features with delayed effects (recommendation changes, pricing).' },
  // Ranking & Retrieval
  { id: 'C25', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Inverse Document Frequency (IDF) in TF-IDF penalizes terms that:',
    options: ['Appear in few documents', 'Are long or complex', 'Appear in many documents (low discriminative power)', 'Have high term frequency'],
    correct: 2,
    explanation: 'IDF = log(N/df). Terms in many documents (stopwords like "the") get low IDF. Rare discriminative terms get high IDF. TF-IDF = TF × IDF rewards specific, relevant terms.' },
  { id: 'C26', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Mean Reciprocal Rank (MRR) is most appropriate when:',
    options: ['Multiple relevant items exist per query', 'Only the rank of the first relevant item matters', 'All ranks are equally important', 'Evaluating precision at fixed cutoff'],
    correct: 1,
    explanation: 'MRR = mean of 1/rank_first_relevant. Best for tasks like question answering where there\'s one correct answer and you care about where it appears (higher = better).' },
  { id: 'C27', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Product quantization in ANN search reduces:',
    options: ['Search recall', 'Index build time', 'Memory footprint by compressing embedding vectors', 'Embedding dimensionality during training'],
    correct: 2,
    explanation: 'PQ splits vector into M sub-vectors, quantizes each to one of k centroids. 128-dim float32 (512 bytes) → PQ code (16 bytes). 32x compression with modest recall loss.' },
  { id: 'C28', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Re-ranking after ANN retrieval typically uses:',
    options: ['Faster, simpler models', 'The same retrieval model', 'Heavier models with more features that are too expensive for full corpus scoring', 'Rule-based filters only'],
    correct: 2,
    explanation: 'Two-stage: (1) Retrieve top-K via fast ANN. (2) Re-rank K candidates with expensive model (user-item interaction features, cross-encoders). Cost is O(K) not O(N).' },
  // Experiment Design
  { id: 'C29', domain: 'Experiment Design', type: 'mcq',
    q: 'Network effects in A/B experiments violate the assumption of:',
    options: ['Normal distribution of outcomes', 'SUTVA (Stable Unit Treatment Value Assumption)', 'Equal group sizes', 'Random assignment'],
    correct: 1,
    explanation: 'SUTVA: treatment of unit i doesn\'t affect unit j. In social networks, control users interacting with treated users receive indirect treatment. Solutions: cluster randomization, ego-network isolation.' },
  { id: 'C30', domain: 'Experiment Design', type: 'mcq',
    q: 'The minimum detectable effect (MDE) in experiment design depends on:',
    options: ['Model complexity', 'Sample size, significance level, power, and baseline metric variance', 'Number of experiments running simultaneously', 'Treatment implementation cost'],
    correct: 1,
    explanation: 'MDE = z_{α/2+β} × σ / √n. Smaller MDE requires larger n. MDE determines if an experiment is powered to detect the business-relevant effect size. Under-powered experiments waste resources.' },
  { id: 'C31', domain: 'Experiment Design', type: 'mcq',
    q: 'Sequential testing (e.g., mSPRT) compared to fixed-horizon testing primarily:',
    options: ['Requires larger sample sizes', 'Enables valid continuous monitoring and early stopping without inflating Type I error', 'Is less statistically rigorous', 'Cannot be used for business metrics'],
    correct: 1,
    explanation: 'Fixed-horizon: p-values invalid if you peek. Sequential tests (mSPRT, always-valid p-values): control Type I error at any stopping time. Enable stopping early for large effects or futility.' },
  { id: 'C32', domain: 'Experiment Design', type: 'mcq',
    q: 'Novelty effect in A/B tests leads to:',
    options: ['Underestimating treatment effect', 'Overestimating treatment effect in early experiment windows', 'Increased variance in outcomes', 'Selection bias in assignment'],
    correct: 1,
    explanation: 'Users engage more with new features due to novelty. Early treatment effect appears large; decays over time. Counter: holdback groups, longer experiment windows, analyze by user tenure.' },
  // SQL & Data
  { id: 'C33', domain: 'SQL & Data', type: 'mcq',
    q: 'For a slowly changing dimension (SCD Type 2), the correct approach is:',
    options: ['Overwrite the existing row', 'Add a version column and update in place', 'Insert a new row with effective_date and expiry_date, mark old row expired', 'Delete and recreate the row'],
    correct: 2,
    explanation: 'SCD Type 2 preserves history. Each change creates a new row with date range. Enables point-in-time queries: SELECT * WHERE event_date BETWEEN effective_date AND expiry_date.' },
  { id: 'C34', domain: 'SQL & Data', type: 'mcq',
    q: 'EXPLAIN ANALYZE in PostgreSQL shows:',
    options: ['Table schema and indexes', 'Actual execution plan with row counts and timing at each step', 'Query syntax errors', 'Lock contention information'],
    correct: 1,
    explanation: 'EXPLAIN ANALYZE executes the query and shows actual vs. estimated row counts, execution time per node. Critical for identifying sequential scans, bad estimates, and hash join spills.' },
  { id: 'C35', domain: 'SQL & Data', type: 'mcq',
    q: 'Partitioning a large table by date primarily improves:',
    options: ['Write performance', 'Query performance for date-range filters via partition pruning', 'Storage compression', 'JOIN performance'],
    correct: 1,
    explanation: 'Partition pruning: queries with WHERE date BETWEEN x AND y only scan relevant partitions. For a 5-year table queried by month, pruning reduces scan by 60x.' },
  { id: 'C36', domain: 'SQL & Data', type: 'mcq',
    q: 'Window function LEAD() is used to:',
    options: ['Access the previous row\'s value', 'Access a subsequent row\'s value within the window', 'Rank rows within a partition', 'Compute cumulative aggregates'],
    correct: 1,
    explanation: 'LEAD(col, n) returns value n rows ahead. LAG(col, n) returns n rows behind. Useful for: time-to-next-event, day-over-day change, next purchase date.' },
  // Optimization
  { id: 'C37', domain: 'Optimization', type: 'mcq',
    q: 'Weight decay in neural network training is equivalent to:',
    options: ['Dropout regularization', 'L2 regularization on model parameters', 'Gradient clipping', 'Learning rate decay'],
    correct: 1,
    explanation: 'Weight decay: subtract λ·w from weights each step. Equivalent to L2 penalty λ‖w‖² in the loss. Penalizes large weights, encourages simpler models. Different from L1 (sparse).' },
  { id: 'C38', domain: 'Optimization', type: 'mcq',
    q: 'Cosine learning rate schedule with warmup is preferred for transformer training because:',
    options: ['It converges in fewer steps', 'It prevents learning rate from going to zero too quickly', 'Warmup stabilizes early training, cosine provides smooth decay matching transformer optimization dynamics', 'It automatically adapts to gradient magnitude'],
    correct: 2,
    explanation: 'Transformers: random init → noisy gradients → high LR causes divergence. Warmup: linear increase for ~4% of steps. Cosine decay: smooth reduction to near-zero, better than step decay.' },
  { id: 'C39', domain: 'Optimization', type: 'mcq',
    q: 'Which optimizer is most commonly used in production-scale recommendation system training?',
    options: ['Vanilla SGD', 'AdaGrad for sparse features, Adam for dense parameters (mixed)', 'LBFGS', 'RMSProp only'],
    correct: 1,
    explanation: 'Rec systems have sparse embeddings (users/items): AdaGrad/Adafactor adapts per-coordinate LR (rarely-updated embeddings get larger updates). Dense layers use Adam. This split is standard (Google, Meta).' },
  { id: 'C40', domain: 'Optimization', type: 'mcq',
    q: "What does the loss landscape's sharpness predict about a trained model?",
    options: ['Training speed', 'Memory usage', 'Generalization — flatter minima generalize better', 'Inference latency'],
    correct: 2,
    explanation: 'Sharp minima: high curvature, small perturbations cause large loss increase → poor generalization. Flat minima: robust to weight perturbation → generalizes better. SAM (Sharpness-Aware Minimization) explicitly seeks flat minima.' },
]

const SA_QUESTIONS = [
  { id: 'SA1', domain: 'Feature Engineering', type: 'sa',
    q: 'Explain the difference between covariate shift and concept drift. Give a production example of each.',
    modelAnswer: 'Covariate shift: P(X) changes but P(Y|X) stays the same. Example: new user cohort from a marketing campaign has different age distribution but same purchase intent given demographics. Concept drift: P(Y|X) changes. Example: CTR model trained pre-COVID predicts irrelevant items post-COVID because user interest patterns fundamentally changed. Covariate shift: recalibrate or retrain on new distribution. Concept drift: must retrain — model\'s learned relationship is stale.' },
  { id: 'SA2', domain: 'ML Systems', type: 'sa',
    q: 'Describe how you would implement a real-time fraud scoring system. What are the key latency bottlenecks?',
    modelAnswer: 'Architecture: client → API gateway → feature retrieval (Redis for user history, device fingerprint) → GBT model inference → rules engine → decision. Latency breakdown: network to Redis ~2ms, feature assembly ~1ms, GBT inference ~5ms, total ~10ms. Bottlenecks: (1) Redis round-trips — batch all feature lookups in one pipeline call. (2) Cold cache — warm user features proactively. (3) Model size — use quantized GBT, benchmark with hardware profiling. (4) Rules engine — implement as lookup table not sequential if-else.' },
  { id: 'SA3', domain: 'Statistics', type: 'sa',
    q: 'When would you use a non-parametric test instead of a t-test? Give two examples.',
    modelAnswer: 'Use non-parametric when: (1) Normality assumption violated (heavy-tailed distributions, ordinal data). (2) Small sample where CLT hasn\'t kicked in. (3) Outliers that would distort means. Examples: (1) Mann-Whitney U test for comparing session duration (right-skewed) between A and B groups — uses rank ordering, robust to outliers. (2) Wilcoxon signed-rank for paired pre/post measurements (e.g., satisfaction scores 1-5 before/after feature change) — ordinal scale doesn\'t support t-test.' },
  { id: 'SA4', domain: 'Deep Learning', type: 'sa',
    q: 'What is catastrophic forgetting in neural networks? How do you mitigate it?',
    modelAnswer: 'Catastrophic forgetting: when a neural network trained on task B forgets task A because gradient updates overwrite the weights important for A. Critical in continual/lifelong learning. Mitigations: (1) Elastic Weight Consolidation (EWC) — penalize changes to weights important for previous tasks (Fisher information diagonal as penalty). (2) Replay/experience replay — maintain a buffer of previous task examples, mix into new training. (3) Progressive Neural Networks — freeze old task columns, add new lateral columns. (4) In RecSys: retrain periodically with a mix of recent + historical data to prevent forgetting long-term patterns.' },
  { id: 'SA5', domain: 'MLOps', type: 'sa',
    q: 'Explain the concept of a model card. What should it contain?',
    modelAnswer: 'Model card: standardized documentation artifact for a trained ML model (Mitchell et al., Google 2019). Contents: (1) Model details: architecture, training date, version, authors. (2) Intended use: primary use cases, out-of-scope uses. (3) Training data: data sources, preprocessing, date range. (4) Evaluation results: metrics on overall and demographic subgroups. (5) Ethical considerations: potential biases, fairness analysis. (6) Caveats and limitations: known failure modes, performance on edge cases. (7) Quantitative analysis: disaggregated evaluation across factors (gender, age, geography). Purpose: transparency, responsible AI documentation, regulatory compliance.' },
  { id: 'SA6', domain: 'Ranking', type: 'sa',
    q: 'What is position bias in click data and how do you correct for it in training?',
    modelAnswer: 'Position bias: items shown at top of results get more clicks regardless of relevance (users rarely scroll). Naive training on clicks yields a model that just re-ranks by position. Correction methods: (1) Inverse Propensity Scoring (IPS): weight each click by 1/propensity(position) where propensity is empirically estimated click rate at position k on neutral items. (2) Randomization: inject random ranking on small traffic slice to observe true propensities. (3) Examination hypothesis: clicks ~ Examination(position) × Relevance(item). Estimate both via EM algorithm (Joachims et al.). (4) Unbiased LambdaMART: directly incorporates propensity weights in listwise objective.' },
  { id: 'SA7', domain: 'Experiment Design', type: 'sa',
    q: 'Your experiment has 95% power and p=0.06. Your manager asks to extend the experiment to get p<0.05. What do you tell them?',
    modelAnswer: 'This is p-hacking / optional stopping. Concerns: (1) The critical value α=0.05 was set before the experiment. Changing the stopping rule post-hoc inflates the true Type I error far above 5%. (2) With 95% power, if the true effect were real, p=0.06 suggests the effect is near or below the pre-specified MDE — possibly not practically significant. Alternatives: (1) Pre-register a Bayesian update with a new experiment using updated priors from this result. (2) Use sequential testing (mSPRT) prospectively in future experiments to allow valid peeking. (3) Report the result honestly: p=0.06, 95% CI [a, b], effect size X%. Let stakeholders decide on practical significance vs. rerunning.' },
  { id: 'SA8', domain: 'SQL', type: 'sa',
    q: 'Write a SQL query to find the top 3 users by revenue in each country for the last 30 days.',
    modelAnswer: 'WITH ranked AS (\n  SELECT\n    u.country,\n    u.user_id,\n    SUM(o.revenue) AS total_revenue,\n    ROW_NUMBER() OVER (\n      PARTITION BY u.country\n      ORDER BY SUM(o.revenue) DESC\n    ) AS rn\n  FROM orders o\n  JOIN users u ON o.user_id = u.user_id\n  WHERE o.created_at >= CURRENT_DATE - INTERVAL \'30 days\'\n  GROUP BY u.country, u.user_id\n)\nSELECT country, user_id, total_revenue\nFROM ranked\nWHERE rn <= 3\nORDER BY country, rn;\n\nKey points: CTE with window function ROW_NUMBER PARTITION BY country, ORDER BY revenue DESC. Filter before aggregation for performance.' },
  { id: 'SA9', domain: 'Systems', type: 'sa',
    q: 'Describe the CAP theorem and its implications for a distributed feature store.',
    modelAnswer: 'CAP theorem: a distributed system can guarantee at most 2 of: Consistency (all nodes see same data), Availability (every request gets a response), Partition tolerance (system works despite network splits). Partition tolerance is non-negotiable in distributed systems. So: CP (consistent but may be unavailable during partition) vs. AP (available but may return stale data). Feature store implications: (1) Online serving (Redis): typically AP — prefer availability and tolerate stale features over serving errors. A slightly stale user embedding is better than a 500 error. (2) Offline training (Delta/Hive): typically CP — consistency matters for reproducible training. (3) Feature updates: eventual consistency with bounded staleness (e.g., max 60s stale) — configurable per feature SLA.' },
  { id: 'SA10', domain: 'Optimization', type: 'sa',
    q: 'Explain mixed-precision training. What are the risks and how are they mitigated?',
    modelAnswer: 'Mixed precision: store weights/activations in FP16 (half precision) for speed and memory, but maintain master copy in FP32 for numerical stability. Speedup: 2-8x on modern GPUs with Tensor Cores. Memory: ~2x reduction. Risks: (1) Underflow — FP16 range is [6e-5, 65504]; very small gradients underflow to zero. Mitigation: loss scaling (multiply loss by scale factor before backward, unscale before optimizer step). (2) Gradient explosion — FP16 has limited range; large gradients overflow. Mitigation: dynamic loss scaling (automatically adjust scale factor). (3) Accumulation errors in batch norm, softmax — keep these in FP32. Implementation: PyTorch torch.cuda.amp.autocast() with GradScaler.' },
]

const DURATION_CONFIG = {
  30: { label: '30 min', totalQ: 20 },
  45: { label: '45 min', totalQ: 35 },
  60: { label: '60 min', totalQ: 50 },
}

function buildQuestionSet(totalQ) {
  const mcqCount = Math.round(totalQ * 0.8)
  const saCount = totalQ - mcqCount

  const shuffledMCQ = [...MCQ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, mcqCount)
  const shuffledSA = [...SA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, saCount)
  return [...shuffledMCQ, ...shuffledSA]
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CombinatorTab() {
  const [screen, setScreen] = useState('config')
  const [duration, setDuration] = useState(30)
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [timePerQuestion, setTimePerQuestion] = useState({})
  const [sessionStarted, setSessionStarted] = useState(false)
  const [selfRatings, setSelfRatings] = useState({})
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [totalTimeUsed, setTotalTimeUsed] = useState(0)

  const questionStartRef = useRef(null)
  const timerRef = useRef(null)

  // ── Config → Session ──
  function startSession() {
    const cfg = DURATION_CONFIG[duration]
    const qs = buildQuestionSet(cfg.totalQ)
    setQuestions(qs)
    setCurrentIdx(0)
    setUserAnswers({})
    setTimePerQuestion({})
    setTimeLeft(duration * 60)
    setSessionStarted(true)
    setShowEndConfirm(false)
    questionStartRef.current = Date.now()
    setScreen('session')
  }

  // ── Timer ──
  useEffect(() => {
    if (screen !== 'session') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          endSession(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [screen])

  // ── Track time per question ──
  const recordQuestionTime = useCallback((idx) => {
    if (questionStartRef.current !== null) {
      const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
      setTimePerQuestion(prev => ({
        ...prev,
        [idx]: (prev[idx] || 0) + elapsed,
      }))
    }
    questionStartRef.current = Date.now()
  }, [])

  function navigateTo(idx) {
    recordQuestionTime(currentIdx)
    setCurrentIdx(idx)
  }

  function endSession(auto = false) {
    clearInterval(timerRef.current)
    recordQuestionTime(currentIdx)
    const cfg = DURATION_CONFIG[duration]
    const used = cfg.totalQ * 60 - (auto ? 0 : timeLeft) // fallback
    setTotalTimeUsed(duration * 60 - (auto ? 0 : timeLeft))
    setShowEndConfirm(false)
    saveToHistory()
    const mcqs = questions.filter(q => q.type === 'mcq')
    const correct = mcqs.filter((q) => userAnswers[questions.indexOf(q)] !== undefined && parseInt(userAnswers[questions.indexOf(q)]) === q.correct).length
    trackModuleComplete('combinator_session', 'combinator', mcqs.length > 0 ? Math.round((correct / mcqs.length) * 100) : null)
    setScreen('debrief')
  }

  function saveToHistory() {
    const mcqs = questions.filter(q => q.type === 'mcq')
    const correctCount = mcqs.filter((q, i) => {
      const globalIdx = questions.indexOf(q)
      return userAnswers[globalIdx] !== undefined && parseInt(userAnswers[globalIdx]) === q.correct
    }).length

    const domainBreakdown = {}
    mcqs.forEach(q => {
      const idx = questions.indexOf(q)
      if (!domainBreakdown[q.domain]) domainBreakdown[q.domain] = { correct: 0, total: 0 }
      domainBreakdown[q.domain].total++
      if (userAnswers[idx] !== undefined && parseInt(userAnswers[idx]) === q.correct) {
        domainBreakdown[q.domain].correct++
      }
    })

    const record = {
      date: new Date().toISOString(),
      duration,
      score: correctCount,
      total: mcqs.length,
      domainBreakdown,
    }

    try {
      const existing = JSON.parse(localStorage.getItem('msl_combinator_history') || '[]')
      existing.push(record)
      localStorage.setItem('msl_combinator_history', JSON.stringify(existing.slice(-50)))
    } catch (_) {}
  }

  // ── Timer color ──
  const timerColor = timeLeft < 60 ? 'var(--rose)' : timeLeft < 300 ? 'var(--ember)' : 'var(--prime)'
  const timerPulse = timeLeft < 60

  // ── MCQ score for debrief ──
  const mcqQuestions = questions.filter(q => q.type === 'mcq')
  const correctCount = mcqQuestions.filter(q => {
    const idx = questions.indexOf(q)
    return userAnswers[idx] !== undefined && parseInt(userAnswers[idx]) === q.correct
  }).length
  const answeredCount = Object.keys(userAnswers).length

  // ── Domain breakdown ──
  const domainStats = {}
  mcqQuestions.forEach(q => {
    const idx = questions.indexOf(q)
    if (!domainStats[q.domain]) domainStats[q.domain] = { correct: 0, total: 0 }
    domainStats[q.domain].total++
    if (userAnswers[idx] !== undefined && parseInt(userAnswers[idx]) === q.correct) {
      domainStats[q.domain].correct++
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 1: CONFIG
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'config') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .combinator-pulse { animation: pulse 0.8s ease-in-out infinite; }
        `}</style>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--prime)', margin: 0 }}>Combinator</h1>
          <p style={{ color: 'var(--ink-mid)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Timed mock session — all answers locked until time ends
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--ink-mid)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Session Duration
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {Object.entries(DURATION_CONFIG).map(([mins, cfg]) => (
              <button
                key={mins}
                onClick={() => setDuration(parseInt(mins))}
                style={{
                  flex: 1,
                  padding: '1.25rem 1rem',
                  borderRadius: 10,
                  border: `2px solid ${duration === parseInt(mins) ? 'var(--prime)' : 'var(--rim)'}`,
                  background: duration === parseInt(mins) ? 'rgba(240,165,0,0.08)' : 'var(--surface)',
                  cursor: 'pointer',
                  color: duration === parseInt(mins) ? 'var(--prime)' : 'var(--ink-mid)',
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{cfg.label}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.7 }}>{cfg.totalQ} questions</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          padding: '0.875rem 1rem',
          borderRadius: 8,
          background: 'rgba(249,115,22,0.08)',
          border: '1px solid rgba(249,115,22,0.25)',
          marginBottom: '1.75rem',
          fontSize: '0.875rem',
          color: 'var(--ink-mid)',
          lineHeight: 1.5,
        }}>
          <span style={{ color: 'var(--ember)' }}>⚠</span>{' '}
          All answers are locked until the timer runs out. You must attempt every question.
        </div>

        <button
          onClick={startSession}
          style={{
            width: '100%',
            padding: '0.9rem',
            borderRadius: 8,
            background: 'var(--prime)',
            border: 'none',
            color: 'var(--void)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Start Session
        </button>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 2: SESSION
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'session') {
    const currentQ = questions[currentIdx]
    const isMCQ = currentQ?.type === 'mcq'
    const selectedOption = userAnswers[currentIdx]

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1rem' }}>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .combinator-pulse { animation: pulse 0.8s ease-in-out infinite; }
        `}</style>

        {/* Timer + progress header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--ink-low)', fontSize: '0.85rem' }}>
            Q {currentIdx + 1} of {questions.length}
          </span>
          <div
            className={timerPulse ? 'combinator-pulse' : undefined}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '2rem',
              fontWeight: 700,
              color: timerColor,
              letterSpacing: '0.05em',
              lineHeight: 1,
            }}
          >
            {formatTime(timeLeft)}
          </div>
          <span style={{ color: 'var(--ink-low)', fontSize: '0.85rem' }}>
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        {/* Question navigator */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.25rem',
          scrollbarWidth: 'thin',
        }}>
          {questions.map((_, idx) => {
            const isActive = idx === currentIdx
            const isAnswered = userAnswers[idx] !== undefined && userAnswers[idx] !== ''
            return (
              <button
                key={idx}
                onClick={() => navigateTo(idx)}
                style={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 6,
                  border: isActive ? '2px solid var(--prime)' : '1px solid var(--rim)',
                  background: isActive ? 'rgba(240,165,0,0.12)' : 'var(--surface)',
                  color: isActive ? 'var(--prime)' : isAnswered ? 'var(--mint)' : 'var(--ink-low)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  fontWeight: isActive ? 700 : 400,
                  transition: 'all 0.1s',
                }}
              >
                {idx + 1}
                {isAnswered && !isActive && (
                  <span style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--mint)',
                    display: 'block',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Question card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: 12,
          padding: '1.5rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.6rem',
              borderRadius: 4,
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.2)',
              color: 'var(--violet)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
            }}>
              {currentQ?.domain}
            </span>
            <p style={{ color: 'var(--ink-hi)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
              {currentQ?.q}
            </p>
          </div>

          {isMCQ ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedOption !== undefined && parseInt(selectedOption) === optIdx
                return (
                  <button
                    key={optIdx}
                    onClick={() => setUserAnswers(prev => ({ ...prev, [currentIdx]: String(optIdx) }))}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 8,
                      border: isSelected ? '2px solid var(--rim)' : '1px solid var(--rim)',
                      background: isSelected ? 'rgba(52,46,40,0.6)' : 'var(--depth)',
                      color: isSelected ? 'var(--ink-hi)' : 'var(--ink-mid)',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                      outline: isSelected ? '1px solid rgba(240,165,0,0.15)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--ink-low)', marginRight: '0.5rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}>
                      {['A', 'B', 'C', 'D'][optIdx]}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          ) : (
            <textarea
              value={userAnswers[currentIdx] || ''}
              onChange={e => setUserAnswers(prev => ({ ...prev, [currentIdx]: e.target.value }))}
              placeholder="Type your answer here..."
              style={{
                width: '100%',
                minHeight: 100,
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid var(--rim)',
                background: 'var(--depth)',
                color: 'var(--ink-hi)',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.9rem',
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
                lineHeight: 1.6,
              }}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigateTo(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 7,
              border: '1px solid var(--rim)',
              background: 'var(--surface)',
              color: currentIdx === 0 ? 'var(--ink-ghost)' : 'var(--ink-mid)',
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
            }}
          >
            ← Prev
          </button>

          <button
            onClick={() => setShowEndConfirm(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 7,
              border: '1px solid var(--rose)',
              background: 'transparent',
              color: 'var(--rose)',
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            End Session Early
          </button>

          <button
            onClick={() => navigateTo(Math.min(questions.length - 1, currentIdx + 1))}
            disabled={currentIdx === questions.length - 1}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 7,
              border: '1px solid var(--rim)',
              background: 'var(--surface)',
              color: currentIdx === questions.length - 1 ? 'var(--ink-ghost)' : 'var(--ink-mid)',
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: currentIdx === questions.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Next →
          </button>
        </div>

        {/* Confirm end modal */}
        {showEndConfirm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(12,10,8,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--rim)',
              borderRadius: 12, padding: '1.75rem', maxWidth: 380, width: '90%',
            }}>
              <h3 style={{ color: 'var(--ink-hi)', marginTop: 0 }}>End session early?</h3>
              <p style={{ color: 'var(--ink-mid)', fontSize: '0.9rem' }}>
                You have {formatTime(timeLeft)} remaining. Unanswered questions will be marked incomplete.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  onClick={() => endSession(false)}
                  style={{
                    flex: 1, padding: '0.65rem', borderRadius: 7,
                    background: 'var(--rose)', border: 'none',
                    color: '#fff', fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  End Session
                </button>
                <button
                  onClick={() => setShowEndConfirm(false)}
                  style={{
                    flex: 1, padding: '0.65rem', borderRadius: 7,
                    background: 'var(--depth)', border: '1px solid var(--rim)',
                    color: 'var(--ink-mid)', fontFamily: "'Space Grotesk', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Keep Going
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 3: DEBRIEF
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'debrief') {
    const pct = mcqQuestions.length > 0 ? Math.round((correctCount / mcqQuestions.length) * 100) : 0
    const scoreColor = pct >= 80 ? 'var(--mint)' : pct >= 60 ? 'var(--prime)' : 'var(--rose)'

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        {/* Header */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: 12,
          padding: '1.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: scoreColor, fontFamily: "'JetBrains Mono', monospace" }}>
            {pct}%
          </div>
          <div style={{ color: 'var(--ink-mid)', marginTop: '0.25rem', fontSize: '1rem' }}>
            {correctCount} / {mcqQuestions.length} MCQ correct
          </div>
          <div style={{ color: 'var(--ink-low)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            {questions.length} total questions · {duration} min session
          </div>
        </div>

        {/* Domain breakdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--ink-hi)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Domain Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {Object.entries(domainStats).map(([domain, stats]) => {
              const domPct = Math.round((stats.correct / stats.total) * 100)
              const c = domPct >= 75 ? 'var(--mint)' : domPct >= 50 ? 'var(--prime)' : 'var(--rose)'
              return (
                <div key={domain} style={{
                  background: 'var(--surface)', border: '1px solid var(--rim)',
                  borderRadius: 8, padding: '0.75rem',
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-low)', marginBottom: '0.3rem' }}>{domain}</div>
                  <div style={{ fontWeight: 700, color: c, fontFamily: "'JetBrains Mono', monospace" }}>
                    {stats.correct}/{stats.total}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* MCQ review */}
        <h3 style={{ color: 'var(--ink-hi)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          MCQ Review
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
          {mcqQuestions.map((q) => {
            const idx = questions.indexOf(q)
            const userAns = userAnswers[idx]
            const userIdx = userAns !== undefined ? parseInt(userAns) : null
            const isCorrect = userIdx === q.correct
            const timeSpent = timePerQuestion[idx] || 0

            return (
              <div key={q.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.2)' : userIdx !== null ? 'rgba(244,63,94,0.2)' : 'var(--rim)'}`,
                borderRadius: 10,
                padding: '1rem 1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--violet)', fontWeight: 600 }}>{q.domain}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-ghost)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {timeSpent}s
                  </span>
                </div>
                <p style={{ color: 'var(--ink-hi)', fontSize: '0.9rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{q.q}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {q.options.map((opt, optIdx) => {
                    const isCorrectOpt = optIdx === q.correct
                    const isUserOpt = optIdx === userIdx
                    let bg = 'transparent'
                    let color = 'var(--ink-low)'
                    let border = '1px solid transparent'
                    if (isCorrectOpt) { bg = 'rgba(52,211,153,0.1)'; color = 'var(--mint)'; border = '1px solid rgba(52,211,153,0.3)' }
                    if (isUserOpt && !isCorrectOpt) { bg = 'rgba(244,63,94,0.1)'; color = 'var(--rose)'; border = '1px solid rgba(244,63,94,0.3)' }
                    return (
                      <div key={optIdx} style={{
                        padding: '0.4rem 0.75rem', borderRadius: 6,
                        background: bg, border, color, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                      }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', opacity: 0.7 }}>
                          {['A', 'B', 'C', 'D'][optIdx]}
                        </span>
                        {opt}
                        {isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>✓ correct</span>}
                        {isUserOpt && !isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>✗ your answer</span>}
                      </div>
                    )
                  })}
                </div>

                {userIdx === null && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--ember)', margin: '0 0 0.5rem' }}>Not attempted</p>
                )}

                <div style={{
                  padding: '0.6rem 0.75rem',
                  background: 'var(--depth)',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  color: 'var(--ink-mid)',
                  lineHeight: 1.55,
                }}>
                  <span style={{ color: 'var(--sky)', fontWeight: 600, marginRight: '0.4rem' }}>Explanation:</span>
                  {q.explanation}
                </div>
              </div>
            )
          })}
        </div>

        {/* Short-answer review */}
        {questions.filter(q => q.type === 'sa').length > 0 && (
          <>
            <h3 style={{ color: 'var(--ink-hi)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Short-Answer Review
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
              {questions.filter(q => q.type === 'sa').map((q) => {
                const idx = questions.indexOf(q)
                const userAns = userAnswers[idx] || ''
                const rating = selfRatings[idx] || 0
                const timeSpent = timePerQuestion[idx] || 0

                return (
                  <div key={q.id} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--rim)',
                    borderRadius: 10,
                    padding: '1rem 1.25rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--violet)', fontWeight: 600 }}>{q.domain}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-ghost)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {timeSpent}s
                      </span>
                    </div>
                    <p style={{ color: 'var(--ink-hi)', fontSize: '0.9rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{q.q}</p>

                    {userAns && (
                      <div style={{
                        padding: '0.65rem 0.75rem',
                        background: 'rgba(34,211,238,0.04)',
                        border: '1px solid rgba(34,211,238,0.15)',
                        borderRadius: 6,
                        fontSize: '0.85rem',
                        color: 'var(--ink-mid)',
                        lineHeight: 1.55,
                        marginBottom: '0.75rem',
                        whiteSpace: 'pre-wrap',
                      }}>
                        <span style={{ color: 'var(--sky)', fontWeight: 600, marginRight: '0.4rem' }}>Your answer:</span>
                        {userAns}
                      </div>
                    )}

                    <div style={{
                      padding: '0.65rem 0.75rem',
                      background: 'rgba(52,211,153,0.04)',
                      border: '1px solid rgba(52,211,153,0.15)',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      color: 'var(--ink-mid)',
                      lineHeight: 1.55,
                      marginBottom: '0.75rem',
                      whiteSpace: 'pre-wrap',
                    }}>
                      <span style={{ color: 'var(--mint)', fontWeight: 600, marginRight: '0.4rem' }}>Model answer:</span>
                      {q.modelAnswer}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-low)' }}>Self-rate:</span>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setSelfRatings(prev => ({ ...prev, [idx]: n }))}
                          style={{
                            width: 32, height: 32, borderRadius: 6,
                            border: rating >= n ? '1px solid var(--prime)' : '1px solid var(--rim)',
                            background: rating >= n ? 'rgba(240,165,0,0.15)' : 'var(--depth)',
                            color: rating >= n ? 'var(--prime)' : 'var(--ink-ghost)',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {n}
                        </button>
                      ))}
                      {rating > 0 && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-low)' }}>
                          {['', 'Needs work', 'Getting there', 'Decent', 'Good', 'Nailed it'][rating]}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={startSession}
            style={{
              flex: 1, padding: '0.75rem',
              borderRadius: 8, background: 'var(--prime)',
              border: 'none', color: 'var(--void)',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => setScreen('config')}
            style={{
              flex: 1, padding: '0.75rem',
              borderRadius: 8, background: 'var(--depth)',
              border: '1px solid var(--rim)', color: 'var(--ink-mid)',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            New Config
          </button>
        </div>
      </div>
    )
  }

  return null
}
