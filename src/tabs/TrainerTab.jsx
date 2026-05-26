import { useState, useRef } from 'react'
import { trackModuleComplete } from '../analytics'

// ─── MCQ Bank ────────────────────────────────────────────────────────────────

const ALL_QUESTIONS = [
  // Feature Engineering
  {
    id: 1, domain: 'Feature Engineering',
    q: 'Which of the following best prevents target leakage in a feature pipeline?',
    options: [
      'Normalizing features after train/test split',
      'Computing rolling statistics using only past data relative to the label timestamp',
      'One-hot encoding categorical variables',
      'Removing features with >50% null rate',
    ],
    correct: 1,
    explanation: 'Target leakage occurs when features incorporate information from the future. Using only past data for rolling statistics ensures no future signal contaminates training.',
  },
  {
    id: 2, domain: 'Feature Engineering',
    q: 'A categorical feature has 10,000 unique values. Which encoding strategy is most appropriate for a gradient boosted tree?',
    options: [
      'One-hot encoding',
      'Target encoding with cross-validation',
      'Label encoding with random assignment',
      'Dropping the feature',
    ],
    correct: 1,
    explanation: 'Target encoding maps categories to their mean target value. Cross-validation folding prevents leakage. OHE creates 10k sparse dimensions; GBTs handle target encoding well.',
  },
  {
    id: 3, domain: 'Feature Engineering',
    q: 'You have a feature with distribution shift between train and production. PSI = 0.35. What action do you take?',
    options: [
      'Ignore — PSI below 0.5 is acceptable',
      'Retrain the model immediately',
      'Investigate root cause, consider feature removal or recalibration',
      'Add the feature to the monitoring dashboard only',
    ],
    correct: 2,
    explanation: 'PSI >0.25 indicates significant shift. Investigate: data pipeline changes, upstream schema drift. Options: remove feature, apply transformation, retrain. Monitoring alone is insufficient.',
  },
  // Model Evaluation
  {
    id: 4, domain: 'Model Evaluation',
    q: 'AUC-ROC is 0.95 on test set but precision at top 1% is only 0.12. What does this suggest?',
    options: [
      'The model is excellent across all thresholds',
      'Class imbalance makes AUC misleading; precision-recall metrics are more informative',
      'The test set is too small',
      'The model has high recall but low specificity',
    ],
    correct: 1,
    explanation: 'With severe class imbalance, AUC can be inflated by easy negatives. Precision-recall AUC and precision@K are more relevant for top-K prediction tasks.',
  },
  {
    id: 5, domain: 'Model Evaluation',
    q: "You're tuning a fraud model. A false negative costs $500, a false positive costs $5. How do you set the classification threshold?",
    options: [
      'Maximize F1 score',
      'Use the default 0.5 threshold',
      'Lower the threshold to increase recall, weighted by cost ratio',
      'Maximize AUC-ROC',
    ],
    correct: 2,
    explanation: 'Cost-sensitive threshold: set threshold where expected cost is minimized. FN cost 100x FP means we should recall aggressively. Lower threshold = higher recall = fewer costly FN.',
  },
  {
    id: 6, domain: 'Model Evaluation',
    q: 'What is the primary risk of using accuracy as the sole metric for a dataset with 99% negative class?',
    options: [
      'It over-penalizes false positives',
      'A model predicting all negatives achieves 99% accuracy with zero predictive value',
      'It ignores the AUC score',
      'It makes cross-validation unreliable',
    ],
    correct: 1,
    explanation: 'With 99% negative class, a trivial classifier gets 99% accuracy. Use precision, recall, F1, or AUC-PR which are insensitive to class imbalance.',
  },
  // ML Systems
  {
    id: 7, domain: 'ML Systems',
    q: 'A model trained monthly shows degraded performance in week 3. Which monitoring signal would detect this earliest?',
    options: [
      'Model accuracy on a holdout set',
      'Input feature distribution shift (PSI)',
      'Prediction score distribution shift',
      'Business metric (CTR) drop',
    ],
    correct: 2,
    explanation: "Prediction score distribution shifts before business metrics degrade, with no label delay. Feature PSI is also early but doesn't capture model behavior directly.",
  },
  {
    id: 8, domain: 'ML Systems',
    q: 'What is the primary advantage of a two-phase serving architecture (retrieval + ranking)?',
    options: [
      'Reduces model training time',
      'Allows end-to-end gradient flow',
      'Enables candidate pruning from millions to hundreds before expensive ranking',
      'Eliminates the need for feature stores',
    ],
    correct: 2,
    explanation: 'Retrieval (ANN/heuristics) narrows from O(millions) to O(hundreds) at low cost. Ranker then applies expensive features only to candidates. This is the standard RecSys architecture.',
  },
  {
    id: 9, domain: 'ML Systems',
    q: 'Your batch prediction pipeline must complete within 2 hours for 100M users. Spark job takes 6 hours. What is your first optimization?',
    options: [
      'Switch to a larger instance type',
      'Increase the number of output partitions',
      'Investigate data skew — hot keys cause stragglers',
      'Cache the model weights in broadcast variable',
    ],
    correct: 2,
    explanation: 'In distributed systems, 80% of slowdowns come from skew. A few hot keys (e.g., superusers) overwhelm specific partitions. Salt the join key or repartition by user cohort.',
  },
  // Statistics & Probability
  {
    id: 10, domain: 'Statistics & Probability',
    q: 'You run 20 A/B tests simultaneously. How many would you expect to show p<0.05 by chance?',
    options: ['0', '1', '5', '10'],
    correct: 1,
    explanation: 'With α=0.05 and 20 independent tests, expected false positives = 0.05 × 20 = 1. Apply Bonferroni correction (α/20 = 0.0025) or Benjamini-Hochberg FDR control.',
  },
  {
    id: 11, domain: 'Statistics & Probability',
    q: 'Which distribution best models the time between user events in a recommendation system?',
    options: ['Normal', 'Binomial', 'Exponential', 'Uniform'],
    correct: 2,
    explanation: 'Inter-arrival times for Poisson processes follow an exponential distribution. User events (clicks, purchases) are often modeled as Poisson processes, making exponential the natural choice.',
  },
  {
    id: 12, domain: 'Statistics & Probability',
    q: 'A bootstrap confidence interval for mean session duration is [4.2, 4.8] minutes. What does this mean?',
    options: [
      '95% of sessions are between 4.2 and 4.8 minutes',
      'The true mean is definitely in [4.2, 4.8]',
      'If we repeated this sampling procedure many times, 95% of resulting CIs would contain the true mean',
      'There is a 5% chance the mean is exactly 4.5 minutes',
    ],
    correct: 2,
    explanation: 'Frequentist confidence intervals: the procedure produces intervals that contain the true parameter 95% of the time across repeated samples. This specific interval may or may not contain the truth.',
  },
  // Deep Learning
  {
    id: 13, domain: 'Deep Learning',
    q: 'Gradient vanishing in a deep network is most effectively addressed by:',
    options: [
      'Increasing learning rate',
      'Using sigmoid activations throughout',
      'Residual connections (skip connections)',
      'Reducing batch size',
    ],
    correct: 2,
    explanation: 'Residual connections (ResNet-style) allow gradients to flow directly through skip paths, bypassing saturating nonlinearities. Batch normalization also helps. Sigmoid worsens vanishing.',
  },
  {
    id: 14, domain: 'Deep Learning',
    q: 'Why is layer normalization preferred over batch normalization in transformer architectures?',
    options: [
      'LayerNorm is computationally cheaper',
      'BatchNorm requires large batch sizes and is unstable with variable sequence lengths',
      'LayerNorm uses fewer parameters',
      "BatchNorm doesn't work with attention",
    ],
    correct: 1,
    explanation: 'BatchNorm normalizes across the batch dimension — problematic for variable-length sequences and small batches (e.g., in autoregressive decoding). LayerNorm normalizes across feature dim, independent of batch.',
  },
  {
    id: 15, domain: 'Deep Learning',
    q: 'What is the purpose of the temperature parameter in softmax for knowledge distillation?',
    options: [
      'Prevent overfitting to hard labels',
      'Soften probability distributions to expose more information in non-top class probabilities',
      'Speed up convergence during training',
      'Reduce memory usage during inference',
    ],
    correct: 1,
    explanation: "High temperature T flattens the teacher's output distribution, revealing relative similarities between classes (dark knowledge). Student learns richer structure than from one-hot hard labels.",
  },
  // MLOps
  {
    id: 16, domain: 'MLOps',
    q: 'Which deployment strategy allows you to gradually shift traffic to a new model while monitoring metrics?',
    options: [
      'Blue-green deployment',
      'Shadow deployment',
      'Canary deployment',
      'Rolling restart',
    ],
    correct: 2,
    explanation: "Canary: route X% of traffic to new model, monitor metrics, gradually increase %. Blue-green: instant switch (less gradual). Shadow: new model runs but responses aren't served (no user impact).",
  },
  {
    id: 17, domain: 'MLOps',
    q: 'Your CI/CD pipeline for ML models should include which validation step before production promotion?',
    options: [
      'Unit tests for feature transformations only',
      'Manual review by a senior engineer',
      'Offline evaluation against a holdout set + statistical comparison to current production model',
      'Load testing only',
    ],
    correct: 2,
    explanation: 'Champion-challenger comparison: new model must beat production on held-out data with statistical significance. Plus: data validation, integration tests, latency benchmarks.',
  },
  {
    id: 18, domain: 'MLOps',
    q: 'What is concept drift in production ML?',
    options: [
      "The model's weights drift due to floating point errors",
      'The relationship between input features and target variable changes over time',
      'Training data becomes unavailable',
      'API endpoints change breaking client calls',
    ],
    correct: 1,
    explanation: 'Concept drift: P(Y|X) changes. E.g., user behavior patterns shift post-COVID. Distinct from covariate drift (P(X) changes). Requires model retraining, not just recalibration.',
  },
  // Ranking & Retrieval
  {
    id: 19, domain: 'Ranking & Retrieval',
    q: 'NDCG@10 measures:',
    options: [
      'The number of relevant documents in top 10',
      'Discounted cumulative gain normalized by ideal ordering, capturing position-weighted relevance',
      'Precision at rank 10',
      'The ratio of relevant to irrelevant items',
    ],
    correct: 1,
    explanation: 'NDCG@K = DCG@K / IDCG@K. DCG discounts relevance by log2(rank+1), rewarding top-ranked relevant items. Normalized by ideal DCG enables comparison across queries.',
  },
  {
    id: 20, domain: 'Ranking & Retrieval',
    q: 'Approximate Nearest Neighbor (ANN) search trades off:',
    options: [
      'Model quality vs. training speed',
      'Recall vs. query latency/memory',
      'Precision vs. NDCG',
      'Batch size vs. embedding dimension',
    ],
    correct: 1,
    explanation: 'ANN algorithms (HNSW, IVF-PQ) reduce exact search cost by trading recall. HNSW: high recall, high memory. IVF-PQ: lower memory via quantization, slightly lower recall. Tune ef_search for recall/latency tradeoff.',
  },
  {
    id: 21, domain: 'Ranking & Retrieval',
    q: 'In learning-to-rank, listwise approaches differ from pointwise approaches in that:',
    options: [
      'Listwise uses more training data',
      'Listwise optimizes a list-level metric (e.g., NDCG) directly rather than individual document scores',
      'Listwise is faster to train',
      'Listwise requires no negative examples',
    ],
    correct: 1,
    explanation: 'Pointwise: regress/classify each item independently. Pairwise: compare item pairs. Listwise: optimize the whole list ordering (e.g., LambdaMART optimizes NDCG directly). Listwise best aligns with ranking metrics.',
  },
  // Experiment Design
  {
    id: 22, domain: 'Experiment Design',
    q: 'CUPED (Controlled-experiment Using Pre-Experiment Data) primarily reduces:',
    options: [
      'Bias in treatment effect estimates',
      'Variance in the outcome metric, enabling smaller sample sizes',
      'The probability of Type I errors',
      'Experiment duration',
    ],
    correct: 1,
    explanation: 'CUPED uses pre-experiment covariate (e.g., pre-period metric) to reduce residual variance: Y_cuped = Y - θ·X_pre. Same expected value, lower variance → smaller MDE → shorter experiments.',
  },
  {
    id: 23, domain: 'Experiment Design',
    q: 'An experiment shows significant lift on engagement but a drop in revenue. How do you decide?',
    options: [
      'Ship — engagement outweighs revenue',
      'Kill — revenue is more important',
      'Analyze the tradeoff using a composite metric or OEC (Overall Evaluation Criterion)',
      'Run the experiment longer',
    ],
    correct: 2,
    explanation: 'Conflicting metrics require pre-defined OEC or guardrail thresholds. Define: engagement is a primary metric, revenue is a guardrail. If guardrail is violated, do not ship regardless of primary metric lift.',
  },
  {
    id: 24, domain: 'Experiment Design',
    q: 'What is a switchback experiment and when is it appropriate?',
    options: [
      'An experiment where users switch between A and B repeatedly',
      'A time-series experiment where treatment alternates across time periods, appropriate when geographic/user randomization is infeasible',
      'An experiment with automatic winner selection',
      'A multi-armed bandit with switching costs',
    ],
    correct: 1,
    explanation: 'Switchback: used in marketplace settings (e.g., Uber surge pricing) where all users in a market must receive the same treatment. Alternate treatment/control by time window, account for carryover effects.',
  },
  // SQL & Data
  {
    id: 25, domain: 'SQL & Data',
    q: 'Which window function calculates a running total?',
    options: [
      'GROUP BY with SUM',
      'SUM() OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)',
      'CUMSUM() aggregation',
      'PARTITION BY date',
    ],
    correct: 1,
    explanation: 'Window functions with ROWS UNBOUNDED PRECEDING compute cumulative aggregates without collapsing rows. PARTITION BY resets the running total per group.',
  },
  {
    id: 26, domain: 'SQL & Data',
    q: 'You need to find users who made a purchase within 7 days of their first visit. Most efficient approach?',
    options: [
      'Self-join on user_id with date difference filter',
      'Correlated subquery for each user',
      'Full table scan with WHERE clause',
      'CROSS JOIN all visits and purchases',
    ],
    correct: 0,
    explanation: 'Self-join: JOIN first_visit_table ON user_id AND purchase_date BETWEEN first_visit_date AND first_visit_date+7. Use indexed columns. Correlated subquery is O(N²).',
  },
  {
    id: 27, domain: 'SQL & Data',
    q: 'A query with SELECT DISTINCT on 100M rows is slow. Best optimization strategy?',
    options: [
      'Add more ORDER BY clauses',
      'Use GROUP BY instead (often better optimized by query planners)',
      'Increase memory allocation',
      'Switch to a subquery',
    ],
    correct: 1,
    explanation: 'GROUP BY can be better optimized than DISTINCT in many query planners (e.g., hash aggregation vs. sort-based dedup). Also consider: is DISTINCT truly needed? Can you filter earlier?',
  },
  // Optimization
  {
    id: 28, domain: 'Optimization',
    q: 'Adam optimizer vs. SGD with momentum: when is SGD preferred?',
    options: [
      'Always — Adam is obsolete',
      'When training very large transformers',
      'When generalization is critical — SGD often finds flatter minima that generalize better',
      'When training speed is the priority',
    ],
    correct: 2,
    explanation: 'Adam converges faster but often to sharper minima (higher test loss). SGD+momentum with learning rate warmup and cosine decay finds flatter minima. Many production models use SGD for final training after Adam warmup.',
  },
  {
    id: 29, domain: 'Optimization',
    q: 'What is gradient clipping and why is it used in RNN/transformer training?',
    options: [
      'Removing gradients below a threshold to speed up training',
      'Capping gradient norms to prevent exploding gradients from destabilizing training',
      'Zeroing gradients for specific layers during fine-tuning',
      'A regularization technique to prevent overfitting',
    ],
    correct: 1,
    explanation: 'Exploding gradients (common in RNNs, transformers on long sequences) cause parameter updates to diverge. Clip by global norm: scale all gradients uniformly when ||g|| > threshold.',
  },
  {
    id: 30, domain: 'Optimization',
    q: 'Learning rate warmup in transformer training serves what purpose?',
    options: [
      'Prevents the model from memorizing early training examples',
      'Stabilizes training in early steps when weight initialization produces high-variance gradients',
      'Reduces the total number of training steps needed',
      'Prevents catastrophic forgetting',
    ],
    correct: 1,
    explanation: 'At initialization, weights are random and gradients are noisy. High LR early → large unstable updates. Warmup starts with tiny LR, increases linearly. Prevents early divergence, especially with Adam.',
  },
  // Feature Engineering — questions 31-33
  {
    id: 31, domain: 'Feature Engineering',
    q: 'During feature selection, recursive feature elimination (RFE) is applied before cross-validation. What is the critical flaw?',
    options: [
      'RFE is too slow for large datasets',
      'Feature importance scores from the full dataset leak into all folds, causing optimistic evaluation',
      'RFE cannot handle categorical features',
      'RFE requires a linear model as estimator',
    ],
    correct: 1,
    explanation: 'Performing RFE on the full dataset before CV means the feature selector has seen the validation folds\' labels, a form of selection leakage. Always nest RFE inside the CV loop.',
  },
  {
    id: 32, domain: 'Feature Engineering',
    q: 'A log-transformed feature has skewness of 0.1 post-transform but the raw feature had skewness of 4.2. For a linear model, why does this matter?',
    options: [
      'Log transform only matters for tree-based models',
      'High skewness violates linearity assumptions and makes gradient descent unstable due to scale differences',
      'Skewness above 3 disables one-hot encoding compatibility',
      'Linear models require all features to be log-normal',
    ],
    correct: 1,
    explanation: 'Linear models assume roughly Gaussian residuals and are sensitive to outliers; heavy right-skew creates extreme values that disproportionately influence gradient updates and coefficient estimation.',
  },
  {
    id: 33, domain: 'Feature Engineering',
    q: 'You engineer a "days since last purchase" feature. In production, new users have NULL for this field. What is the correct strategy?',
    options: [
      'Impute with mean days since last purchase from the training set',
      'Impute with a sentinel value (e.g., 9999) and add a binary "is_new_user" indicator feature',
      'Drop rows with NULL in production',
      'Fill with zero — new users have zero days since last purchase',
    ],
    correct: 1,
    explanation: 'NULL here is structurally meaningful (user has no purchase history), not missing at random. A sentinel + indicator lets the model learn a separate effect for new users vs. lapsed users with large gaps.',
  },
  // Model Evaluation — questions 34-36
  {
    id: 34, domain: 'Model Evaluation',
    q: 'Expected Calibration Error (ECE) measures:',
    options: [
      'The gap between AUC-ROC and AUC-PR',
      'How closely predicted probabilities match empirical outcome frequencies in binned predictions',
      'The variance of prediction scores across bootstrap samples',
      'The model\'s sensitivity to threshold selection',
    ],
    correct: 1,
    explanation: 'ECE bins predictions by confidence, then computes a weighted average of |accuracy - confidence| per bin. A perfectly calibrated model\'s 0.7 probability means 70% of those predictions are correct.',
  },
  {
    id: 35, domain: 'Model Evaluation',
    q: 'Platt scaling and isotonic regression are both post-hoc calibration methods. When should you prefer isotonic regression?',
    options: [
      'Always — isotonic regression is strictly better',
      'When training data is small (< 1000 samples)',
      'When the calibration curve is strongly non-monotonic and you have sufficient held-out data',
      'When the model is a logistic regression',
    ],
    correct: 2,
    explanation: 'Platt scaling fits a parametric sigmoid — fast but assumes a monotone miscalibration pattern. Isotonic regression is non-parametric and flexible, but prone to overfitting on small calibration sets.',
  },
  {
    id: 36, domain: 'Model Evaluation',
    q: 'Your model achieves 0.82 AUC-ROC in offline evaluation. After deployment, business CTR only improves 0.3% vs. expected 2%. The most likely explanation is:',
    options: [
      'AUC-ROC is a poor metric for ranking models',
      'Offline evaluation uses logged data that doesn\'t reflect counterfactual user responses to new rankings',
      'The model was trained on too little data',
      'CTR is a lagging indicator that takes months to stabilize',
    ],
    correct: 1,
    explanation: 'Offline metrics on logged data suffer from position bias and selection bias — users only interact with what was shown. Online gains depend on actual user response to new orderings, which offline data can\'t capture.',
  },
  // ML Systems — questions 37-39
  {
    id: 37, domain: 'ML Systems',
    q: 'A Kafka-backed feature pipeline must handle schema evolution when a new field is added upstream. The safest approach is:',
    options: [
      'Deploy new consumer code before the producer adds the field',
      'Use schema registry with forward-compatible schema evolution and update consumers before producers',
      'Drop and recreate the Kafka topic with the new schema',
      'Use JSON without a schema — flexibility is built-in',
    ],
    correct: 1,
    explanation: 'Schema registries (e.g., Confluent) enforce compatibility rules. Forward compatibility means new writers, old readers — deploy consumers first, then producers, to avoid deserialization failures.',
  },
  {
    id: 38, domain: 'ML Systems',
    q: 'A feature store serves online predictions at p99 < 10ms. Which architecture decision most directly enables this?',
    options: [
      'Storing all features in a data warehouse like BigQuery',
      'Precomputing and materializing features into a low-latency key-value store (e.g., Redis, DynamoDB)',
      'Computing features on-the-fly in the serving container',
      'Caching the model\'s last prediction per user',
    ],
    correct: 1,
    explanation: 'Online feature stores precompute batch features into key-value stores optimized for microsecond point lookups. On-the-fly computation cannot meet single-digit millisecond SLAs for complex features.',
  },
  {
    id: 39, domain: 'ML Systems',
    q: 'ONNX export of a PyTorch model fails at a custom attention layer. The root cause is most likely:',
    options: [
      'ONNX does not support attention mechanisms',
      'The layer uses a Python control flow (if/for) that ONNX\'s static graph cannot trace dynamically',
      'ONNX requires TensorFlow models only',
      'The batch size was not fixed during export',
    ],
    correct: 1,
    explanation: 'ONNX tracing captures operations on a specific input; dynamic Python control flow (data-dependent branching, variable-length loops) is not captured. Use torch.jit.script or rewrite with torch.where for static graphs.',
  },
  // Statistics & Probability — questions 40-42
  {
    id: 40, domain: 'Statistics & Probability',
    q: 'Bootstrap confidence intervals are preferred over t-test intervals when:',
    options: [
      'Sample size is above 10,000',
      'The test statistic\'s sampling distribution is unknown or non-normal (e.g., median, complex ratios)',
      'The variance is known from population data',
      'You need exact intervals rather than approximate ones',
    ],
    correct: 1,
    explanation: 'The t-test assumes normality of the sampling distribution of the mean (CLT helps for means). For non-standard statistics like median, Gini coefficient, or AUC, bootstrapping empirically estimates the sampling distribution without parametric assumptions.',
  },
  {
    id: 41, domain: 'Statistics & Probability',
    q: 'A p-value of 0.03 means:',
    options: [
      'There is a 3% chance the null hypothesis is true',
      'The probability of observing data at least as extreme as seen, assuming the null hypothesis is true, is 3%',
      'The effect size is practically significant',
      'There is a 97% chance the alternative hypothesis is true',
    ],
    correct: 1,
    explanation: 'P-values are not posterior probabilities of hypotheses. They measure how surprising the data is under H0. Small p-value → data is unlikely under H0 → reject H0. This says nothing about practical significance.',
  },
  {
    id: 42, domain: 'Statistics & Probability',
    q: 'In a Bayesian A/B test, you observe P(B > A) = 0.96. Why might you still not ship variant B?',
    options: [
      'Bayesian tests require p < 0.05 to be valid',
      'The expected loss from choosing B (when A is actually better) may exceed the acceptable risk threshold',
      'A higher posterior probability always means ship',
      'You need to run a frequentist test to confirm',
    ],
    correct: 1,
    explanation: 'Bayesian decision theory uses expected loss, not just posterior probability. If B is 4% likely to be worse but the downside is catastrophic (e.g., revenue loss), expected loss may exceed your risk tolerance even at 96% confidence.',
  },
  // Deep Learning — questions 43-45
  {
    id: 43, domain: 'Deep Learning',
    q: 'The KV cache in transformer inference reduces compute by:',
    options: [
      'Pruning attention heads at runtime',
      'Caching key and value projections for all previous tokens so only the new token\'s query is computed at each decoding step',
      'Storing intermediate activations to skip recomputation during backpropagation',
      'Quantizing weights to int8 for faster matrix multiplication',
    ],
    correct: 1,
    explanation: 'Autoregressive decoding recomputes K,V for all past tokens each step without a cache — O(n²) total. KV cache stores these projections, making each new token O(n) attention instead of O(n²) recomputation.',
  },
  {
    id: 44, domain: 'Deep Learning',
    q: 'Gradient checkpointing trades off:',
    options: [
      'Training speed for better generalization',
      'Memory for compute — activations are recomputed during the backward pass rather than stored',
      'Precision for training stability',
      'Batch size for gradient accuracy',
    ],
    correct: 1,
    explanation: 'Standard backprop stores all forward activations for gradient computation, consuming O(layers) memory. Checkpointing stores only checkpoint activations and recomputes intermediate values during backward, reducing memory at the cost of ~33% extra compute.',
  },
  {
    id: 45, domain: 'Deep Learning',
    q: 'Multi-head attention with d_model=512, 8 heads, sequence length L has self-attention complexity of:',
    options: [
      'O(L × d_model)',
      'O(L² × d_model)',
      'O(L × d_model²)',
      'O(L² + d_model²)',
    ],
    correct: 1,
    explanation: 'Each attention head computes QKᵀ which is (L × d_k) × (d_k × L) = O(L² × d_k). Across all heads: O(L² × d_model). This quadratic scaling in L is why long-context transformers need sparse/linear attention variants.',
  },
  // MLOps — questions 46-48
  {
    id: 46, domain: 'MLOps',
    q: 'Sample Ratio Mismatch (SRM) in an A/B experiment means:',
    options: [
      'The treatment effect is too small to detect',
      'The observed traffic split deviates significantly from the intended split, indicating a data collection or assignment bug',
      'The control group has a higher variance than the treatment group',
      'The experiment ran for too short a period',
    ],
    correct: 1,
    explanation: 'SRM (detected via chi-square test on group sizes) invalidates the experiment\'s randomization. Common causes: bots, cache hits, logging bugs, or inconsistent assignment logic. Always check SRM before analyzing results.',
  },
  {
    id: 47, domain: 'MLOps',
    q: 'In an ML model registry, what is the purpose of tagging a model version as "Staging" before "Production"?',
    options: [
      'To prevent other engineers from accessing the model',
      'To run integration tests, shadow evaluation, and performance benchmarks in a production-like environment before live traffic',
      'To reduce storage costs by archiving older versions',
      'To signal that model training is still in progress',
    ],
    correct: 1,
    explanation: 'The Staging stage gates models through champion-challenger evaluation, integration validation, and latency checks before serving live traffic. This mirrors software release pipelines and enables rollback.',
  },
  {
    id: 48, domain: 'MLOps',
    q: 'A model serving endpoint shows increasing p99 latency over 48 hours without code changes. What is the most likely cause?',
    options: [
      'The model weights have corrupted',
      'Memory leak or cache saturation from growing request volume, or feature store key space growth slowing lookups',
      'Gradient accumulation is running in production',
      'The model is retraining in the background',
    ],
    correct: 1,
    explanation: 'Gradual latency increase without code changes typically indicates resource exhaustion: memory leaks, growing in-process caches, or degrading external dependencies (feature store, DB). Profile memory/GC and downstream service latencies.',
  },
  // Ranking & Retrieval — questions 49-51
  {
    id: 49, domain: 'Ranking & Retrieval',
    q: 'Position bias in implicit feedback (click) data means:',
    options: [
      'Items ranked lower have fewer impressions and thus fewer clicks regardless of relevance',
      'The ranking model assigns too much weight to the first result',
      'Users click on items alphabetically first',
      'The embedding model positions similar items closer in vector space',
    ],
    correct: 0,
    explanation: 'Users are less likely to examine lower positions — clicks at rank 10 are sparse not because the item is irrelevant, but because it wasn\'t seen. Inverse propensity scoring (IPS) or regression-EM debiasing is needed for unbiased learning from clicks.',
  },
  {
    id: 50, domain: 'Ranking & Retrieval',
    q: 'Maximum Inner Product Search (MIPS) differs from nearest neighbor search (NNS) in that:',
    options: [
      'MIPS uses cosine similarity while NNS uses L2 distance',
      'MIPS finds the vector maximizing the dot product, which is not equivalent to L2 nearest neighbor when norms vary',
      'MIPS is always faster than NNS',
      'MIPS requires normalized embeddings',
    ],
    correct: 1,
    explanation: 'For normalized vectors, MIPS ≡ NNS (cosine = dot product). For unnormalized embeddings, high dot product can come from large norms rather than directional alignment, requiring MIPS-specific algorithms (e.g., ScaNN, FAISS with inner product index).',
  },
  {
    id: 51, domain: 'Ranking & Retrieval',
    q: 'In a two-tower retrieval model, why are the user and item towers kept separate during inference?',
    options: [
      'To reduce GPU memory usage during training',
      'Item embeddings can be pre-computed offline; only the user embedding requires online computation at query time',
      'Cross-tower attention would violate the ranking objective',
      'The two towers use different activation functions that are incompatible',
    ],
    correct: 1,
    explanation: 'The separation enables ANN search: precompute and index all item embeddings offline. At serving time, compute only the user embedding online, then retrieve top-K items via ANN — O(log N) vs. O(N) cross-encoder scoring.',
  },
  // Experiment Design — questions 52-54
  {
    id: 52, domain: 'Experiment Design',
    q: 'Network effects in a marketplace A/B test (e.g., Uber, Airbnb) make standard user randomization problematic because:',
    options: [
      'Network effects reduce statistical power',
      'Treatment users interact with control users, violating the Stable Unit Treatment Value Assumption (SUTVA) and biasing effect estimates',
      'Marketplace experiments require continuous metrics only',
      'User-level randomization is too computationally expensive at scale',
    ],
    correct: 1,
    explanation: 'SUTVA requires that one unit\'s treatment doesn\'t affect another\'s outcome. In marketplaces, treating drivers differently affects riders in the same market — a SUTVA violation. Use cluster/geo randomization or switchback designs.',
  },
  {
    id: 53, domain: 'Experiment Design',
    q: 'Metric decomposition in experiment analysis (e.g., decomposing revenue = orders × AOV) helps by:',
    options: [
      'Reducing the number of metrics you need to monitor',
      'Isolating which component of a composite metric is driving the treatment effect, enabling better product decisions',
      'Guaranteeing statistical independence between sub-metrics',
      'Automatically correcting for multiple testing',
    ],
    correct: 1,
    explanation: 'Revenue lift could come from more orders (volume) or higher AOV (quality). Decomposition tells you mechanism — e.g., if AOV drops while orders rise, you\'re acquiring lower-value customers, which changes the ship decision.',
  },
  {
    id: 54, domain: 'Experiment Design',
    q: 'An experiment has 80% statistical power at MDE of 2%. If you halve the MDE to 1%, required sample size:',
    options: [
      'Doubles',
      'Increases by 4x',
      'Stays the same — power is fixed',
      'Increases by 1.41x (square root of 2)',
    ],
    correct: 1,
    explanation: 'Sample size for a given power scales as 1/MDE². Halving MDE (detecting a smaller effect) requires 4x more samples to maintain the same power, because smaller signals require tighter estimation intervals.',
  },
  // SQL & Data — questions 55-57
  {
    id: 55, domain: 'SQL & Data',
    q: 'A query uses a non-selective index (e.g., a boolean column) and the planner ignores it. Why?',
    options: [
      'Boolean columns cannot be indexed in SQL',
      'When a column has very few distinct values, a full table scan with parallel execution is cheaper than random I/O via the index',
      'The index is corrupted and needs rebuilding',
      'Non-selective indexes only work with composite keys',
    ],
    correct: 1,
    explanation: 'Index selectivity = distinct values / total rows. For a boolean column (2 distinct values on 100M rows), each lookup still fetches ~50% of the table via scattered I/O — worse than a sequential scan. Planners correctly skip these indexes.',
  },
  {
    id: 56, domain: 'SQL & Data',
    q: 'LAG() and LEAD() window functions are evaluated before or after WHERE filtering?',
    options: [
      'After WHERE — only visible rows are used for lag/lead computation',
      'Before WHERE — the window sees all rows, then WHERE filters the output',
      'It depends on the database vendor',
      'Simultaneously with WHERE in a single pass',
    ],
    correct: 0,
    explanation: 'SQL logical order: FROM → WHERE → window functions → SELECT. WHERE runs first, so LAG/LEAD only see rows that pass the WHERE clause. To lag over unfiltered data, use a subquery or CTE to apply the window before filtering.',
  },
  {
    id: 57, domain: 'SQL & Data',
    q: 'A FULL OUTER JOIN between a 10M row table and a 100M row table produces 200M rows. The most likely explanation is:',
    options: [
      'FULL OUTER JOIN always produces rows = sum of both tables',
      'There are duplicate join keys — a many-to-many join producing a cross-product on matched keys',
      'The tables have no matching keys at all',
      'The query planner is using a nested loop join',
    ],
    correct: 1,
    explanation: 'If many rows in table A match many rows in table B on the join key, the result set is multiplicative. 10M × 100M = 1B worst case. Deduplicate keys before joining or use aggregation first (early aggregation pattern).',
  },
  // Optimization — questions 58-60
  {
    id: 58, domain: 'Optimization',
    q: 'Cosine learning rate schedule with warm restarts (SGDR) is useful because:',
    options: [
      'It eliminates the need for momentum',
      'Periodic restarts help the optimizer escape sharp local minima, and cosine decay allows fine-grained convergence within each cycle',
      'It guarantees convergence to the global minimum',
      'It reduces gradient variance across batches',
    ],
    correct: 1,
    explanation: 'SGDR (Loshchilov & Hutter 2017): LR follows cosine decay then resets. Restarts act as perturbations that escape sharp minima; snapshots at each restart\'s end can be ensembled. Especially effective for models with many local optima.',
  },
  {
    id: 59, domain: 'Optimization',
    q: 'Mixed precision training (FP16 + FP32) requires a "loss scaling" step because:',
    options: [
      'FP16 has a smaller exponent range and small gradients underflow to zero before weight updates',
      'FP32 is too slow for backward passes on modern GPUs',
      'Loss scaling prevents the model from memorizing training data',
      'FP16 accumulation introduces systematic bias in the gradient direction',
    ],
    correct: 0,
    explanation: 'FP16 minimum positive value is ~6e-8; many gradients are smaller and flush to zero. Loss scaling multiplies the loss by a large constant (e.g., 2^15) before backward, shifting gradient magnitudes into representable FP16 range, then unscaled before the optimizer step.',
  },
  {
    id: 60, domain: 'Optimization',
    q: 'AdaGrad\'s learning rate diminishes to near-zero over time in long training runs. AdaDelta and RMSProp solve this by:',
    options: [
      'Resetting the accumulated gradient sum every epoch',
      'Using an exponential moving average of squared gradients instead of cumulative sum, preventing the denominator from growing unboundedly',
      'Adding a momentum term to the gradient accumulator',
      'Applying gradient clipping before the parameter update',
    ],
    correct: 1,
    explanation: 'AdaGrad accumulates all squared gradients from the start — denominator grows monotonically → effective LR → 0. RMSProp/AdaDelta use an EMA (controlled by decay ρ), so only recent gradient history influences the adaptive rate.',
  },
]

const ALL_DOMAINS = [
  'Feature Engineering', 'Model Evaluation', 'ML Systems',
  'Statistics & Probability', 'Deep Learning', 'MLOps',
  'Ranking & Retrieval', 'Experiment Design', 'SQL & Data', 'Optimization',
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Setup Screen ────────────────────────────────────────────────────────────

function SetupScreen({ onStart }) {
  const [selectedDomains, setSelectedDomains] = useState(new Set(ALL_DOMAINS))
  const [count, setCount] = useState('10')

  function toggleDomain(d) {
    setSelectedDomains(prev => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  function handleStart() {
    const pool = shuffle(ALL_QUESTIONS.filter(q => selectedDomains.has(q.domain)))
    const final = count === 'All' ? pool : pool.slice(0, parseInt(count))
    if (final.length === 0) return
    onStart(final)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--prime)', margin: 0 }}>
          ML Trainer
        </h1>
        <p style={{ color: 'var(--ink-mid)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
          Sharpen your ML interview skills with targeted MCQ drills.
        </p>
      </div>

      {/* Domain selector */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--ink-hi)', fontSize: '0.95rem' }}>Domains</span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setSelectedDomains(new Set(ALL_DOMAINS))}
              style={{ background: 'none', border: 'none', color: 'var(--sky)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
            >Select all</button>
            <button
              onClick={() => setSelectedDomains(new Set())}
              style={{ background: 'none', border: 'none', color: 'var(--ink-low)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
            >Clear</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
          {ALL_DOMAINS.map(d => {
            const checked = selectedDomains.has(d)
            return (
              <label key={d} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                background: checked ? 'rgba(240,165,0,0.1)' : 'var(--depth)',
                border: `1px solid ${checked ? 'var(--prime)' : 'var(--rim)'}`,
                transition: 'all 0.15s',
              }}>
                <input
                  type="checkbox" checked={checked}
                  onChange={() => toggleDomain(d)}
                  style={{ accentColor: 'var(--prime)', width: 15, height: 15 }}
                />
                <span style={{ fontSize: '0.85rem', color: checked ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{d}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Count selector */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '2rem',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--ink-hi)', fontSize: '0.95rem', display: 'block', marginBottom: '0.75rem' }}>
          Question Count
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['10', '20', 'All'].map(opt => {
            const active = count === opt
            return (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1.25rem', borderRadius: 8, cursor: 'pointer',
                background: active ? 'rgba(240,165,0,0.15)' : 'var(--depth)',
                border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="count" value={opt} checked={active}
                  onChange={() => setCount(opt)}
                  style={{ accentColor: 'var(--prime)' }}
                />
                <span style={{ fontSize: '0.9rem', color: active ? 'var(--prime)' : 'var(--ink-mid)', fontWeight: active ? 600 : 400 }}>{opt}</span>
              </label>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={selectedDomains.size === 0}
        style={{
          background: selectedDomains.size === 0 ? 'var(--rim)' : 'var(--prime)',
          color: selectedDomains.size === 0 ? 'var(--ink-ghost)' : 'var(--void)',
          border: 'none', borderRadius: 10, padding: '0.85rem 2.5rem',
          fontSize: '1rem', fontWeight: 700, cursor: selectedDomains.size === 0 ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'all 0.15s',
        }}
      >
        Start Drill
      </button>
    </div>
  )
}

// ─── Drill Screen ────────────────────────────────────────────────────────────

const DOMAIN_COLORS = {
  'Feature Engineering': 'var(--sky)',
  'Model Evaluation': 'var(--mint)',
  'ML Systems': 'var(--violet)',
  'Statistics & Probability': 'var(--prime)',
  'Deep Learning': 'var(--ember)',
  'MLOps': 'var(--rose)',
  'Ranking & Retrieval': 'var(--sky)',
  'Experiment Design': 'var(--mint)',
  'SQL & Data': 'var(--prime)',
  'Optimization': 'var(--violet)',
}

function DrillScreen({ questions, onFinish, onAbort }) {
  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState(null) // index of chosen option or null
  const [score, setScore] = useState(0)
  // domainStats: { domain: { correct, total } }
  const [domainStats, setDomainStats] = useState({})
  // Refs to always hold latest values for the finish handler
  const scoreRef = useRef(0)
  const domainStatsRef = useRef({})

  const q = questions[idx]
  const total = questions.length
  const isCorrect = answered !== null && answered === q.correct
  const domainColor = DOMAIN_COLORS[q.domain] || 'var(--prime)'

  function handleAnswer(optIdx) {
    if (answered !== null) return
    setAnswered(optIdx)
    const correct = optIdx === q.correct
    const newScore = score + (correct ? 1 : 0)
    if (correct) setScore(newScore)
    scoreRef.current = newScore
    const newDomainStats = {
      ...domainStatsRef.current,
      [q.domain]: {
        correct: (domainStatsRef.current[q.domain]?.correct || 0) + (correct ? 1 : 0),
        total: (domainStatsRef.current[q.domain]?.total || 0) + 1,
      },
    }
    domainStatsRef.current = newDomainStats
    setDomainStats(newDomainStats)
  }

  function handleNextFixed() {
    if (idx + 1 >= total) {
      onFinish(scoreRef.current, domainStatsRef.current, questions)
      return
    }
    setIdx(i => i + 1)
    setAnswered(null)
  }

  function optionStyle(optIdx) {
    const base = {
      width: '100%', textAlign: 'left', padding: '0.85rem 1.1rem',
      borderRadius: 10, fontSize: '0.95rem', cursor: answered !== null ? 'default' : 'pointer',
      fontFamily: 'var(--font-sans)',
      border: '1px solid var(--rim)',
      background: 'var(--depth)',
      color: 'var(--ink-hi)',
      transition: 'all 0.2s',
    }
    if (answered === null) return { ...base, cursor: 'pointer' }
    if (optIdx === q.correct) return { ...base, background: 'rgba(52,211,153,0.15)', borderColor: 'var(--mint)', color: 'var(--mint)' }
    if (optIdx === answered && answered !== q.correct) return { ...base, background: 'rgba(244,63,94,0.15)', borderColor: 'var(--rose)', color: 'var(--rose)' }
    return { ...base, opacity: 0.45 }
  }

  const progressPct = ((idx) / total) * 100

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button
          onClick={onAbort}
          style={{
            background: 'none', border: '1px solid var(--rim)', borderRadius: 8,
            color: 'var(--ink-low)', cursor: 'pointer', fontSize: '0.8rem',
            padding: '0.35rem 0.85rem', fontFamily: 'var(--font-sans)',
          }}
        >
          Abort
        </button>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
          color: 'var(--mint)', fontWeight: 600,
        }}>
          {score} / {idx + (answered !== null ? 1 : 0)} correct
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--rim)', borderRadius: 99, height: 6, marginBottom: '0.5rem' }}>
        <div style={{
          width: `${progressPct}%`, height: '100%', borderRadius: 99,
          background: 'var(--prime)', transition: 'width 0.3s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          Question {idx + 1} of {total}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          {Math.round(progressPct)}%
        </span>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 14, padding: '1.75rem',
      }}>
        {/* Domain badge */}
        <span style={{
          display: 'inline-block', padding: '0.3rem 0.8rem',
          borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
          background: `${domainColor}20`, color: domainColor,
          border: `1px solid ${domainColor}50`,
          marginBottom: '1.1rem',
        }}>
          {q.domain}
        </span>

        {/* Question */}
        <p style={{
          fontSize: '1.08rem', fontWeight: 700, color: 'var(--ink-hi)',
          lineHeight: 1.55, marginBottom: '1.5rem', marginTop: 0,
        }}>
          {q.q}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {q.options.map((opt, i) => (
            <button key={i} style={optionStyle(i)} onClick={() => handleAnswer(i)}>
              <span style={{
                display: 'inline-block', width: 22, height: 22, lineHeight: '22px',
                textAlign: 'center', borderRadius: '50%', marginRight: '0.75rem',
                background: 'var(--rim)', fontSize: '0.78rem', fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {answered !== null && (
          <div style={{
            marginTop: '1.25rem', padding: '1rem 1.1rem',
            background: isCorrect ? 'rgba(52,211,153,0.08)' : 'rgba(244,63,94,0.08)',
            border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`,
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1rem' }}>{isCorrect ? '✓' : '✗'}</span>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700,
                color: isCorrect ? 'var(--mint)' : 'var(--rose)',
              }}>
                {isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.6 }}>
              {q.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Next button */}
      {answered !== null && (
        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button
            onClick={handleNextFixed}
            style={{
              background: 'var(--prime)', color: 'var(--void)',
              border: 'none', borderRadius: 10, padding: '0.75rem 2rem',
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {idx + 1 >= total ? 'See Results' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Results Screen ──────────────────────────────────────────────────────────

function ResultsScreen({ score, total, domainStats, onDrillAgain, onNewSession }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  const scoreColor = pct >= 80 ? 'var(--mint)' : pct >= 60 ? 'var(--prime)' : 'var(--rose)'

  // All domains that appeared
  const domains = Object.keys(domainStats)

  // Sort by accuracy ascending (weakest first)
  const sortedDomains = [...domains].sort((a, b) => {
    const accA = domainStats[a].total > 0 ? domainStats[a].correct / domainStats[a].total : 0
    const accB = domainStats[b].total > 0 ? domainStats[b].correct / domainStats[b].total : 0
    return accA - accB
  })

  function domainBarColor(acc) {
    if (acc >= 0.8) return 'var(--mint)'
    if (acc >= 0.5) return 'var(--prime)'
    return 'var(--rose)'
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink-hi)', margin: 0, marginBottom: '0.35rem' }}>
          Session Complete
        </h2>
        <p style={{ color: 'var(--ink-mid)', fontSize: '0.9rem', margin: 0 }}>
          Here is how you did
        </p>
      </div>

      {/* Big score */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 16, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
          {score} / {total}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 600, color: scoreColor, marginTop: '0.5rem' }}>
          {pct}%
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--ink-low)', marginTop: '0.35rem' }}>
          {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort — keep drilling the weak spots.' : 'Keep practicing — review the explanations.'}
        </div>
      </div>

      {/* Focus Areas (weakness heatmap) */}
      {sortedDomains.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--rim)',
          borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Focus Areas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sortedDomains.map(d => {
              const { correct, total: dtotal } = domainStats[d]
              const acc = dtotal > 0 ? correct / dtotal : 0
              const barColor = domainBarColor(acc)
              const domainColor = DOMAIN_COLORS[d] || 'var(--prime)'
              return (
                <div key={d}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-mid)' }}>{d}</span>
                    <span style={{
                      fontSize: '0.8rem', fontFamily: 'var(--font-mono)',
                      color: barColor, fontWeight: 600,
                    }}>
                      {correct}/{dtotal} ({Math.round(acc * 100)}%)
                    </span>
                  </div>
                  <div style={{ background: 'var(--rim)', borderRadius: 99, height: 7 }}>
                    <div style={{
                      width: `${acc * 100}%`, height: '100%', borderRadius: 99,
                      background: barColor, transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-domain breakdown (all domains sorted by name) */}
      {domains.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--rim)',
          borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '2rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Domain Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
            {[...domains].sort().map(d => {
              const { correct, total: dtotal } = domainStats[d]
              const acc = dtotal > 0 ? correct / dtotal : 0
              const barColor = domainBarColor(acc)
              return (
                <div key={d} style={{
                  background: 'var(--depth)', border: '1px solid var(--rim)',
                  borderRadius: 10, padding: '0.75rem',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-low)', marginBottom: '0.35rem' }}>{d}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: barColor, fontFamily: 'var(--font-mono)' }}>
                    {correct}/{dtotal}
                  </div>
                  <div style={{ background: 'var(--rim)', borderRadius: 99, height: 4, marginTop: '0.4rem' }}>
                    <div style={{ width: `${acc * 100}%`, height: '100%', borderRadius: 99, background: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={onDrillAgain}
          style={{
            background: 'var(--prime)', color: 'var(--void)',
            border: 'none', borderRadius: 10, padding: '0.8rem 1.75rem',
            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Drill Again
        </button>
        <button
          onClick={onNewSession}
          style={{
            background: 'none', color: 'var(--ink-mid)',
            border: '1px solid var(--rim)', borderRadius: 10, padding: '0.8rem 1.75rem',
            fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          New Session
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TrainerTab({ onNavigate }) {
  const [screen, setScreen] = useState('setup') // 'setup' | 'drill' | 'results'
  const [questions, setQuestions] = useState([])
  const [results, setResults] = useState(null) // { score, total, domainStats }
  const [lastQuestions, setLastQuestions] = useState([])

  function handleStart(qs) {
    setQuestions(qs)
    setLastQuestions(qs)
    setResults(null)
    setScreen('drill')
  }

  function handleFinish(score, domainStats, qs) {
    const total = qs.length
    trackModuleComplete('trainer_session', 'trainer', Math.round((score / total) * 100))

    // Build domain breakdown for storage
    const domainBreakdown = Object.entries(domainStats).map(([domain, s]) => ({
      domain, correct: s.correct, total: s.total,
    }))

    // Save to localStorage
    try {
      const history = JSON.parse(localStorage.getItem('msl_trainer_history') || '[]')
      history.push({
        date: new Date().toISOString(),
        score,
        total,
        domainBreakdown,
      })
      localStorage.setItem('msl_trainer_history', JSON.stringify(history))
    } catch (_) {}

    setResults({ score, total, domainStats })
    setScreen('results')
  }

  function handleDrillAgain() {
    // Re-shuffle the same config
    setQuestions(shuffle(lastQuestions))
    setResults(null)
    setScreen('drill')
  }

  function handleNewSession() {
    setScreen('setup')
    setResults(null)
  }

  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--void)',
      color: 'var(--ink-hi)',
      fontFamily: 'var(--font-sans)',
    }}>
      {screen === 'setup' && (
        <SetupScreen onStart={handleStart} />
      )}
      {screen === 'drill' && (
        <DrillScreen
          questions={questions}
          onFinish={handleFinish}
          onAbort={() => setScreen('setup')}
        />
      )}
      {screen === 'results' && results && (
        <ResultsScreen
          score={results.score}
          total={results.total}
          domainStats={results.domainStats}
          onDrillAgain={handleDrillAgain}
          onNewSession={handleNewSession}
        />
      )}
    </div>
  )
}
