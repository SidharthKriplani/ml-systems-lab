import { useState } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const FLASHCARDS = [
  // Core ML
  { group: 'Core ML', q: 'What is the bias-variance tradeoff?', a: 'High bias = underfitting (model too simple). High variance = overfitting (model memorises train data). Regularisation, more data, or simpler model fixes variance; more complexity or better features fixes bias.' },
  { group: 'Core ML', q: 'What does SHAP give you that feature importance doesn\'t?', a: 'Per-prediction marginal contributions, not a global aggregate. SHAP satisfies efficiency, symmetry, and dummy axioms. TreeSHAP is exact for GBMs in O(TLD). Feature importance (gain/cover) violates these axioms and can be misleading for correlated features.' },
  { group: 'Core ML', q: 'What is calibration and how do you measure it?', a: 'A model is calibrated if predicted probability p means p% of that group is positive. Measure with ECE (Expected Calibration Error) or reliability diagram. Fix with temperature scaling (single param T: logit/T) or Platt scaling (logistic regression on scores).' },
  { group: 'Core ML', q: 'XGBoost vs Random Forest — when do you pick each?', a: 'XGBoost: lower bias, sequential boosting, needs tuning (max_depth, LR, regularisation). RF: parallel bagging, robust out of the box, better for small data or noisy labels. XGBoost wins on accuracy; RF wins on stability and speed to first result.' },
  { group: 'Core ML', q: 'What is the kernel trick?', a: 'Replace inner products x_i·x_j in SVM dual with k(x_i, x_j) = φ(x_i)·φ(x_j). Never compute φ explicitly — just evaluate the kernel. RBF kernel = exp(-‖x-z‖²/2σ²) maps to infinite-dimensional space in O(d) time.' },
  { group: 'Core ML', q: 'What is PSI and what thresholds matter?', a: 'Population Stability Index = Σ(actual% − expected%) × ln(actual%/expected%). PSI < 0.1: stable. 0.1–0.25: moderate shift, investigate. > 0.25: major shift, likely model degradation. Compute weekly against a 30-day reference window.' },
  { group: 'Core ML', q: 'High bias vs high variance — diagnosis?', a: 'High bias: train and val error both high and close together. High variance: train error low, val error much higher. Plot learning curves: high bias shows parallel high-error curves; high variance shows large gap that narrows as training data grows.' },
  { group: 'Core ML', q: 'What is k-fold vs time-series cross-validation?', a: 'k-fold randomly splits data — valid only for IID data. Time-series CV uses expanding or rolling windows, always training on past and evaluating on future. Random split on temporal data leaks future features into training (optimistic eval).' },
  { group: 'Core ML', q: 'What is DBSCAN and when does it beat k-means?', a: 'Density-based: core points have ≥ min_samples in ε-radius. No k needed, finds arbitrary shapes, labels outliers explicitly. Use when clusters are non-spherical, when you want built-in outlier detection, or when k is unknown.' },
  { group: 'Core ML', q: 'What does PCA actually compute?', a: 'Eigenvectors of the covariance matrix X\'X/n, sorted by eigenvalue. Each eigenvector is a direction of maximum variance (principal component). Project data onto top-k PCs = best rank-k reconstruction by Frobenius norm. Always standardise first.' },

  // Deep Learning
  { group: 'Deep Learning', q: 'Why did ReLU fix vanishing gradients?', a: 'Sigmoid local gradient ≤ 0.25 → product of 10 layers ≤ 10⁻⁶. ReLU local gradient is 1 for positive inputs → gradient passes unchanged through active neurons. Residual connections add another highway: gradient flows through identity shortcut even if layers saturate.' },
  { group: 'Deep Learning', q: 'What does attention complexity mean in practice?', a: 'Self-attention is O(n²) in sequence length n. For n=4096, this is 16M entries per layer. FlashAttention computes exact attention without materialising the full matrix — uses tiling to stay in SRAM. Practical limit without tricks: ~2K tokens per GPU with BERT-base.' },
  { group: 'Deep Learning', q: 'Batch norm vs Layer norm — when do you use each?', a: 'Batch norm normalises across the batch dimension — unstable with small batch sizes, doesn\'t work for variable-length sequences. Layer norm normalises across the feature dimension per sample — works for any batch size, standard in Transformers and LLMs.' },
  { group: 'Deep Learning', q: 'What is LoRA and why does it matter?', a: 'Freeze pretrained weights, inject trainable low-rank matrices A (d×r) and B (r×d) into attention layers. ∆W = BA. Only r is trained per layer. For r=8, d=4096 → 500x fewer params. Can merge BA into frozen weights at inference with zero latency cost.' },
  { group: 'Deep Learning', q: 'BERT vs GPT — core architectural difference?', a: 'BERT: bidirectional attention (each token sees all others) → better for understanding tasks (classification, NER). GPT: causal/unidirectional attention (each token sees only past) → necessary for generation. Bidirectional cannot generate autoregressively.' },
  { group: 'Deep Learning', q: 'What is reward hacking in RLHF and how do you prevent it?', a: 'Policy exploits reward model blind spots (length, agreeable phrasing, confident-sounding claims). KL penalty = −β × KL(π_RL ‖ π_SFT) constrains how far the policy drifts from SFT baseline. Too high β → no improvement; too low → hacking dominates.' },
  { group: 'Deep Learning', q: 'What is temperature in LLM sampling?', a: 'Divides logits before softmax. T < 1: peaky distribution → deterministic, repetitive. T > 1: flat distribution → diverse, creative, potentially incoherent. T=0 = greedy decoding. Top-p (nucleus) sampling picks smallest set of tokens whose cumulative probability ≥ p.' },
  { group: 'Deep Learning', q: 'What is the difference between DPO and RLHF?', a: 'RLHF trains a reward model then runs PPO. DPO shows the optimal RLHF policy has a closed form — trains directly on preference pairs with a binary cross-entropy loss, no RM or PPO needed. Simpler, stabler, cheaper. Trade-off: DPO is offline; PPO can explore online.' },

  // RecSys & Ranking
  { group: 'RecSys & Ranking', q: 'Why two-tower over cross-encoder for retrieval?', a: 'Cross-encoder requires a forward pass per (query, item) pair — infeasible for 10M items. Two-tower precomputes all item embeddings offline; at query time only the query encoder runs + ANN lookup. Trade-off: no fine-grained interaction. Fix: two-tower for recall, cross-encoder for re-ranking.' },
  { group: 'RecSys & Ranking', q: 'What is NDCG and why over MAP?', a: 'NDCG uses graded relevance and logarithmic position discount: DCG = Σ (2^rel−1)/log2(i+1), normalised by ideal. MAP uses binary relevance, treats all relevant items equally regardless of quality. NDCG preferred when relevance is graded or when position near the top matters most.' },
  { group: 'RecSys & Ranking', q: 'What is position bias and how do you correct for it?', a: 'Items at position 1 get more clicks regardless of quality. Naive training treats all clicks as equal relevance signal → model learns position as quality proxy → self-reinforcing loop. Fix: inverse propensity scoring (weight by 1/P(shown at position)), or dual learning algorithm (joint examination + relevance model).' },
  { group: 'RecSys & Ranking', q: 'What is the explore-exploit tradeoff in recommendations?', a: 'Exploitation: serve highest estimated-CTR item. Exploration: serve uncertain items to learn preferences and avoid filter bubble. Approaches: ε-greedy (random ε% of slots), Thompson Sampling (sample from Beta posterior), UCB, or dedicated exploration slots. Long-term retention usually favours more exploration.' },
  { group: 'RecSys & Ranking', q: 'How do you handle cold start in a RecSys?', a: 'New user: use contextual features (device, time, location, source), popular items as fallback, fast-adapt after 3-5 interactions. New item: content-based embedding from metadata (title, image, category), warm-up exposure slots for forced impressions, Bayesian prior from category averages.' },
  { group: 'RecSys & Ranking', q: 'What is pointwise vs pairwise vs listwise LTR?', a: 'Pointwise: predict relevance score per item independently (regression/classification). Pairwise: predict which of two items is more relevant (RankNet). Listwise: optimise list-level metric directly (LambdaMART optimises NDCG proxy). LambdaMART dominates production; listwise most principled.' },
  { group: 'RecSys & Ranking', q: 'How does LambdaRank handle non-differentiable NDCG?', a: 'Defines pseudo-gradients: gradient for pair (i,j) = |∆NDCG| × σ(−score_diff). Items whose swap most improves NDCG receive the largest gradient. Never defines an explicit loss — defines the gradient of an implicit loss correlated with NDCG. LambdaMART applies this to GBDT.' },
  { group: 'RecSys & Ranking', q: 'How do you measure RecSys quality beyond CTR?', a: 'CTR can be gamed by clickbait. Better: dwell time, purchase/save rate (stronger intent), repeat visit rate (long-term engagement), discovery rate (serendipity), regret rate (immediate back-click). Calibration: if user likes 20% action movies, that fraction should appear in recommendations.' },

  // Fraud & Anomaly
  { group: 'Fraud & Anomaly', q: 'How do you handle 1:200 class imbalance in fraud?', a: 'Don\'t oversample first — understand the data. Options: class-weighted loss (cost-sensitive learning), SMOTE for synthetic minority oversampling, threshold tuning (optimise F1 or precision@K not accuracy), focal loss, or anomaly detection framing (train only on negatives). Evaluate with PR-AUC not ROC-AUC (less optimistic under imbalance).' },
  { group: 'Fraud & Anomaly', q: 'What are velocity features in fraud detection?', a: 'Aggregations of past behaviour in short time windows: transactions in last 1/5/60 minutes, distinct merchants in last hour, total spend in last 24h. Require a real-time feature store (Redis + stream processor). Key signal: deviation from baseline velocity is the fraud tell, not absolute values.' },
  { group: 'Fraud & Anomaly', q: 'What are the three types of anomalies?', a: 'Point: single value anomalous in absolute terms ($50K txn). Contextual: anomalous given context (30°C in January). Collective: sequence of normal values forming anomalous pattern (port scan). Different methods: z-score/IF for point; STL residuals for contextual; LSTM autoencoder for collective.' },
  { group: 'Fraud & Anomaly', q: 'What is Isolation Forest and why is it good for high dimensions?', a: 'Builds random trees splitting on random features and random split values. Anomalies are rare and different → isolated in fewer splits → shorter average path length → higher anomaly score. Linear in n and d, no distributional assumption, no distance metric needed. Weakness: struggles with locally dense anomaly clusters.' },
  { group: 'Fraud & Anomaly', q: 'How do you set an anomaly threshold in production?', a: 'Business-driven: set threshold at top-X% matching operational alert capacity. F1-maximising if labels exist. Elbow on score distribution (anomaly scores are often bimodal). Always monitor precision (alert quality) and MTTD (speed). Start with high threshold to avoid alert fatigue; lower as team scales.' },
  { group: 'Fraud & Anomaly', q: 'How do you evaluate a fraud model at deployment time?', a: 'Offline: PR-AUC, precision@K (K = reviewable alerts per day), AUROC. Online: false positive rate (legitimate transactions declined), recall (% fraud caught), dollar-weighted recall (catch high-value fraud first). Track model score distribution drift weekly. Labels arrive with delay — use approximate labels from dispute resolution.' },

  // Experimentation
  { group: 'Experimentation', q: 'What is CUPED?', a: 'Controlled-experiment Using Pre-Experiment Data. Subtract the covariate-predicted component: Y_cuped = Y − θ(X − E[X]), where X is a pre-experiment covariate correlated with Y (e.g. prior week metric). Reduces variance of the treatment effect estimate → shorter experiment duration for same power. Equivalent to OLS covariate adjustment.' },
  { group: 'Experimentation', q: 'What is the multiple testing problem and how does BH differ from Bonferroni?', a: 'Testing 20 metrics at α=0.05 gives 64% chance of a false positive. Bonferroni controls FWER (any false positive) at α/n — very conservative. Benjamini-Hochberg controls FDR (proportion of false discoveries) — less conservative. Use Bonferroni for safety-critical tests; BH for exploratory analysis with many metrics.' },
  { group: 'Experimentation', q: 'What is the novelty effect and how do you detect it?', a: 'New feature gets inflated engagement because it\'s different, not better — users explore. Effect decays to baseline over 2-4 weeks. Detection: plot metric time series — novelty shows as spike-then-decay. Run experiments ≥ 2 weeks. Compare new-user cohort (no reference point) vs returning users to separate novelty from utility.' },
  { group: 'Experimentation', q: 'What is SUTVA and when does it fail?', a: 'Stable Unit Treatment Value Assumption: no interference between units. Fails in social networks (treatment user tells control user), marketplaces (shared supply), and cumulative effects. Fix: cluster randomisation (assign network communities), switchback testing (time-based assignment), or geo-holdout experiments.' },
  { group: 'Experimentation', q: 'When do you prefer Bayesian A/B over frequentist?', a: 'Bayesian: allows early stopping (posterior probability > threshold), gives intuitive output ("94% chance B is better"), handles multiple looks naturally. Frequentist: controls false positive rate exactly, required for regulatory/audit contexts, easier to communicate p < 0.05. Use Bayesian when speed matters; frequentist when strict error control is required.' },
  { group: 'Experimentation', q: 'What is switchback testing and when do you use it?', a: 'Alternate the entire market between treatment and control in short time windows (15-min/1-hour blocks). Used when individual randomisation is impossible due to interference — ride-sharing (shared driver supply), ad auctions (bidding dynamics), marketplace pricing. Challenge: temporal autocorrelation requires careful block design and detrending.' },
  { group: 'Experimentation', q: 'How do you design an A/B test for a ranking model change?', a: 'Define: primary metric (NDCG@10, revenue per search), guardrail metrics (latency, crash rate, CTR on paid positions). Randomisation unit: user (not session — avoids within-user variance). Sample size: power analysis at α=0.05, 80% power, minimum detectable effect = 0.5% relative NDCG. Duration: ≥2 weeks (novelty effect). Holdout: 10% of traffic as control is sufficient for most rank changes.' },
  { group: 'Experimentation', q: 'What is p-hacking and how do you prevent it in an experimentation platform?', a: 'Peeking and stopping early when p < 0.05, testing many metrics and reporting only significant ones, sub-group mining. Prevention: pre-register hypothesis and primary metric before launch, use sequential testing (mSPRT) for valid early stopping, lock metric dashboard until pre-determined end date, show all pre-registered metrics not just significant ones.' },

  // Causal Inference
  { group: 'Causal Inference', q: 'What is the parallel trends assumption in DiD?', a: 'Without treatment, the treatment and control groups would have followed the same trend over time. Cannot be proven — falsify it by checking pre-treatment trends. Event study: plot DiD estimates for each pre-period; they should be near zero. If pre-period coefficients are nonzero, parallel trends is violated and DiD is biased.' },
  { group: 'Causal Inference', q: 'What is endogeneity in price elasticity estimation?', a: 'Price is not randomly assigned — it correlates with unobserved demand shocks (lower price during promotions). OLS sees this and estimates biased elasticity. Fix: instrumental variables — find a supply-side cost shock (fuel prices, commodity costs) that affects price but not demand directly. 2SLS: regress price on instrument, then quantity on predicted price.' },
  { group: 'Causal Inference', q: 'What is an uplift model and when does it differ from a propensity model?', a: 'Propensity: P(outcome | features) — who will convert regardless. Uplift: P(outcome|treated) − P(outcome|control) — who converts because of the treatment. A high-propensity customer wastes a discount (they\'d buy anyway). Uplift targets persuadables. Requires randomised experiment data. Evaluate with Qini curve / AUUC.' },
  { group: 'Causal Inference', q: 'What is regression discontinuity and when does it apply?', a: 'Units just above a threshold get treatment; units just below don\'t. Compare outcomes in a narrow bandwidth around the cutoff. Identifies LATE (Local Average Treatment Effect) at the cutoff. Requires: a clear threshold rule (credit score cutoff, test score for a program), no sorting (units can\'t precisely manipulate the running variable), and smooth potential outcomes.' },
  { group: 'Causal Inference', q: 'What are the four segments in the uplift / Rubin causal model?', a: 'Always-buyers (buy regardless, waste of discount). Persuadables (buy if treated, not otherwise — target). Never-buyers (don\'t buy regardless — waste of treatment). Do-not-disturbers (buy if untreated, don\'t if treated — harm if treated). You can only identify these statistically from experiment data.' },
  { group: 'Causal Inference', q: 'What is synthetic control and when is DiD not enough?', a: 'When you have one treated unit (one city, one country) and no good comparison group. Synthetic control constructs a weighted average of control units that matches the treated unit\'s pre-treatment trend. Weights are chosen to minimise pre-treatment outcome discrepancy. More credible than DiD when the single treated unit is sui generis.' },

  // Production & Systems
  { group: 'Production & Systems', q: 'What is training-serving skew and how do you prevent it?', a: 'Features computed differently in training (batch pipeline) vs serving (real-time request). Causes: different code paths, timezone handling, null imputation, aggregation windows. Prevention: single feature definition served from a feature store, integration tests that compare train and serve outputs on the same input, offline-online metric correlation monitoring.' },
  { group: 'Production & Systems', q: 'What is point-in-time correctness in a feature store?', a: 'When generating training data, only use feature values available at the time of the event — not current values. Without it, you use future feature states to predict past outcomes (leakage). Enforced via as_of timestamps in offline retrieval. Common failure: joining on user credit score that includes post-application payment history.' },
  { group: 'Production & Systems', q: 'When do you retrain vs rebuild a model?', a: 'Retrain: gradual drift, same feature set still captures signal, new data improves performance. Rebuild: concept drift exceeds what retraining fixes, new features needed, fresh model consistently outperforms retrained model on the same recent window, or the problem definition changed. Automate retraining; rebuild requires a human decision.' },
  { group: 'Production & Systems', q: 'What is concept drift vs data drift?', a: 'Data drift (covariate shift): P(X) changes but P(Y|X) stays the same. Mitigate with importance reweighting. Concept drift: P(Y|X) changes — same features now predict different outcomes. Requires retraining. Monitor feature distributions for data drift and residuals/performance for concept drift. You can have either without the other.' },
]

const FORMULAS = [
  { name: 'NDCG@K', formula: 'DCG@K = Σᵢ₌₁ᴷ (2^relᵢ − 1) / log₂(i+1)  ·  NDCG@K = DCG@K / IDCG@K', note: 'IDCG = DCG of ideal ranking. Normalised to [0,1]. Standard metric for ranked retrieval.' },
  { name: 'BM25', formula: 'score(d,q) = Σ IDF(t) · [tf(t,d)·(k₁+1)] / [tf(t,d) + k₁·(1 − b + b·dl/avgdl)]', note: 'k₁ ∈ [1.2,2.0] controls TF saturation. b=0.75 controls length norm. IDF = log[(N−df+0.5)/(df+0.5)].' },
  { name: 'UCB score', formula: 'score_i = μ̂ᵢ + √(2 ln t / nᵢ)', note: 'μ̂ᵢ: empirical mean of arm i. t: total pulls. nᵢ: pulls on arm i. Rare arms have high uncertainty bonus → automatic exploration.' },
  { name: 'InfoNCE / Temperature', formula: 'L = −log [ exp(sim(a,p)/τ) / Σⱼ exp(sim(a,nⱼ)/τ) ]', note: 'τ (temperature): low = hard negatives dominate; high = uniform. CLIP uses learned τ, initialised at 0.07.' },
  { name: 'Price Elasticity', formula: 'ε = (ΔQ/Q) / (ΔP/P)  =  d(log Q)/d(log P)', note: '|ε|>1: elastic (revenue falls with price rise). |ε|<1: inelastic (revenue rises). Estimate with IV, not OLS (endogeneity).' },
  { name: 'PSI', formula: 'PSI = Σ (actual% − expected%) × ln(actual% / expected%)', note: '<0.1: stable. 0.1–0.25: monitor. >0.25: significant drift. Compute per feature and on output score distribution.' },
  { name: 'Thompson Sampling (Beta-Bernoulli)', formula: 'Prior: Beta(α,β). Update: α += clicks, β += non-clicks. Sample θᵢ ~ Beta(αᵢ,βᵢ), pick argmax θ', note: 'Conjugate prior → O(1) update. Posterior narrows as data grows → less exploration over time.' },
  { name: 'CUPED adjustment', formula: 'Ỹ = Y − θ̂ (X − X̄),  θ̂ = Cov(Y,X) / Var(X)', note: 'X is pre-experiment covariate (e.g. prior week metric). Reduces Var(Ỹ) by factor (1 − ρ²) where ρ = corr(X,Y).' },
  { name: 'Bias-Variance decomposition', formula: 'E[(ŷ−y)²] = Bias² + Variance + Irreducible noise', note: 'Bias²: (E[ŷ] − f(x))². Variance: E[(ŷ − E[ŷ])²]. Irreducible: σ²_ε. Only bias and variance are controllable.' },
  { name: 'KL Divergence', formula: 'KL(P‖Q) = Σ P(x) log[P(x)/Q(x)]', note: 'Asymmetric. KL(P‖Q) ≠ KL(Q‖P). RLHF penalty: −β·KL(π_RL‖π_SFT). Cross-entropy H(P,Q) = H(P) + KL(P‖Q).' },
  { name: 'Precision@K / Recall@K', formula: 'P@K = |relevant ∩ top-K| / K  ·  R@K = |relevant ∩ top-K| / |relevant|', note: 'P@K: quality of the top-K list. R@K: coverage of all relevant items. F1@K = harmonic mean. MRR = mean(1/rank of first relevant).' },
  { name: 'Adstock (geometric decay)', formula: 'adstock_t = spend_t + λ · adstock_{t-1}', note: 'λ ∈ [0,1]: decay rate. Low λ (~0.3): quick-decay direct response. High λ (~0.8): durable brand effect. Estimated in Bayesian MMM.' },
]

const TRAPS = [
  { trap: 'Using test statistics for normalisation', fix: 'Fit scaler/imputer on train only. Apply to val/test. Fitting on full data leaks distributional info.' },
  { trap: 'Random shuffle on time-series data for CV', fix: 'Use expanding or rolling window CV. Random shuffle leaks future into training → optimistic offline metrics that fail in production.' },
  { trap: 'Ignoring position bias in click data', fix: 'Clicks at position 1 are biased by exposure, not just quality. Apply IPS or DLA before using click data as training labels.' },
  { trap: 'Target encoding without holdout', fix: 'Encoding target mean per category on the full training set leaks label info. Use leave-one-out or k-fold encoding within training folds only.' },
  { trap: 'Peeking at A/B results and stopping early', fix: 'Use sequential testing (mSPRT) if you need early stopping. Fixed-horizon tests require you to commit to the sample size upfront.' },
  { trap: 'Accuracy as metric for imbalanced data', fix: '99% accuracy on 1:99 class split is trivial (always predict majority). Use PR-AUC, F1@threshold, or precision@K matching alert capacity.' },
  { trap: 'Treating correlation as causation in price elasticity', fix: 'OLS elasticity estimate is biased (endogeneity). Use IV regression or a randomised price experiment.' },
  { trap: 'Ignoring novelty effect in A/B tests', fix: 'Run experiments ≥ 2 weeks. Plot daily metric — novelty shows as spike-then-decay. New users are less affected (no prior baseline).' },
  { trap: 'Assuming SUTVA in marketplace experiments', fix: 'Treatment and control share supply/budget. Use cluster randomisation, geo holdouts, or switchback testing instead.' },
  { trap: 'Calibration ≠ accuracy', fix: 'A model can have high AUC and poor calibration. An overconfident model misrepresents risk — critical in fraud, ads, and pricing systems.' },
  { trap: 'Not correcting for multiple testing', fix: '20 metrics at α=0.05 → 64% FWER. Use Bonferroni for safety-critical metrics, Benjamini-Hochberg for exploratory packs.' },
  { trap: 'Confusing data drift with concept drift', fix: 'Data drift: P(X) changes → reweight. Concept drift: P(Y|X) changes → retrain. Different diagnosis, different fix. Monitor both separately.' },
]

const FRAMEWORKS = [
  {
    title: 'Which offline ranking metric to use?',
    rules: [
      'Graded relevance (0-4 rating) → NDCG@10',
      'Binary relevance, care about any hit → MRR',
      'Binary relevance, fixed budget → MAP or precision@K',
      'Retrieval stage, care about coverage → Recall@100',
    ],
  },
  {
    title: 'Two-tower vs cross-encoder?',
    rules: [
      'Retrieval over millions of items → two-tower (precompute item embeddings)',
      'Re-ranking top 20-50 candidates → cross-encoder (sees query+item jointly)',
      'Latency < 50ms at scale → always two-tower for stage 1',
      'Best accuracy on small candidate set → cross-encoder wins',
    ],
  },
  {
    title: 'Retrain vs rebuild a model?',
    rules: [
      'Gradual drift, same features still relevant → retrain on recent window',
      'Fresh model consistently beats retrained → rebuild',
      'New user/item types that old features can\'t represent → rebuild',
      'Performance drop after a specific event (policy change, product redesign) → investigate before deciding',
    ],
  },
  {
    title: 'High bias vs high variance — what to do?',
    rules: [
      'High bias (both train/val error high) → more complex model, better features, less regularisation',
      'High variance (train low, val high) → more data, regularisation, simpler model, early stopping',
      'Both high → usually a data quality or framing problem',
      'Check learning curves first before changing model architecture',
    ],
  },
  {
    title: 'Which A/B testing approach?',
    rules: [
      'Need strict false positive control, regulatory audit → frequentist + fixed horizon',
      'Want early stopping rights, speed → sequential testing (mSPRT) or Bayesian',
      'Networked product (social, marketplace) → cluster randomisation or switchback',
      'One treated market/region → synthetic control, not DiD',
    ],
  },
  {
    title: 'Handling class imbalance in fraud?',
    rules: [
      'Model calibration is critical → use class-weighted loss, not oversampling',
      'Need more minority examples → SMOTE (only on train fold)',
      'Very low recall is the problem → lower decision threshold, not resample',
      'Evaluate with PR-AUC and precision@K matching alert capacity, not ROC-AUC',
    ],
  },
  {
    title: 'When to use causal inference vs just ML?',
    rules: [
      'Want to understand what causes what (not just predict) → causal inference',
      'Have randomised experiment data → use it; observational inference is second-best',
      'No experiment, want attribution → DiD (policy rollout), RDD (threshold), IV (cost shock)',
      'Want to target interventions efficiently → uplift model over propensity model',
    ],
  },
  {
    title: 'Batch norm vs layer norm?',
    rules: [
      'CNNs, large batch sizes → batch norm',
      'Transformers, LLMs, NLP → layer norm',
      'Variable-length sequences → layer norm (batch norm breaks)',
      'Small batch sizes (< 16) → layer norm or group norm',
    ],
  },
]

const DOMAINS = [
  {
    name: 'RecSys & Ranking',
    mustKnow: ['Two-tower retrieval + ANN index', 'LambdaMART / LTR (pointwise / pairwise / listwise)', 'Position bias correction (IPS, DLA)', 'Cold start — user and item', 'Thompson Sampling for exploration', 'NDCG, MRR, P@K metrics'],
    probes: [
      'Our recommendation CTR dropped 12% after a model update. Walk me through your diagnosis.',
      'Design a two-tower retrieval system for a 50M SKU catalogue. What does the indexing pipeline look like?',
      'How do you handle a user who has no interaction history in a production RecSys?',
    ],
    posts: [70, 71, 72, 96],
  },
  {
    name: 'Search & IR',
    mustKnow: ['BM25 — TF saturation, length norm, k₁ and b parameters', 'Dense retrieval — bi-encoder + ANN', 'Hybrid retrieval — BM25 + dense + RRF fusion', 'Cross-encoder re-ranking', 'NDCG@10, zero-result rate, recall@100', 'Query latency stack (retrieval → re-rank → serve)'],
    probes: [
      'Relevance dropped 8% after we pushed a new ranking model. What are your first 3 diagnostic steps?',
      'Design a semantic search system for a 10M product catalogue serving 5K QPS.',
      'A user searches "running shoes under 3000" and gets irrelevant results. What could be wrong?',
    ],
    posts: [79, 80, 90],
  },
  {
    name: 'Fraud & Risk',
    mustKnow: ['Imbalanced classification — class weights, SMOTE, threshold tuning', 'Velocity features and real-time feature stores', 'Anomaly detection — Isolation Forest, DBSCAN, autoencoder', 'Graph ML for transaction networks (GNNs)', 'PR-AUC vs ROC-AUC for imbalanced data', 'Alert capacity → threshold → precision@K'],
    probes: [
      'Our fraud FPR spiked 3x overnight without any model change. What happened and what do you check first?',
      'Design a real-time fraud scoring system for a payment gateway with < 100ms latency.',
      'The data science team wants to add graph features. How would you represent transaction networks and what GNN architecture would you use?',
    ],
    posts: [94, 95],
  },
  {
    name: 'Pricing & Revenue',
    mustKnow: ['Price elasticity — definition and IV estimation (endogeneity)', 'Adstock and MMM', 'Uplift modeling — T-learner, X-learner, Causal Forest', 'Dynamic pricing — multi-objective (revenue vs. coverage)', 'Attribution — MTA vs MMM', 'A/B testing for pricing (shared supply problem)'],
    probes: [
      'How would you estimate the price elasticity of demand for our food delivery platform?',
      'Design an uplift model to identify which users should receive a discount coupon.',
      'Our pricing model increased revenue by 5% but customer complaints rose 20%. How do you think about this?',
    ],
    posts: [81, 83, 84, 85, 92],
  },
  {
    name: 'Forecasting & Time Series',
    mustKnow: ['Stationarity and differencing', 'ARIMA / SARIMA / Prophet — when to use each', 'LightGBM for time series — temporal features, lag features', 'Look-ahead bias / data leakage in feature engineering', 'Backtest methodology — expanding vs rolling window', 'Hierarchical forecasting for multi-level aggregations'],
    probes: [
      'Our demand forecast for dark stores has 30% MAPE on weekends. What do you investigate?',
      'How do you forecast daily orders for a new city with no history?',
      'What is the difference between ARIMA and Prophet and when would you choose each for restaurant-level order forecasting?',
    ],
    posts: [88],
  },
  {
    name: 'Experimentation & Causal',
    mustKnow: ['CUPED — variance reduction using pre-experiment covariate', 'Multiple testing — Bonferroni vs Benjamini-Hochberg', 'SUTVA and when it fails (networks, marketplaces)', 'Switchback testing for marketplace experiments', 'DiD — parallel trends, event study, pre-trend test', 'RDD — bandwidth choice, continuity assumption'],
    probes: [
      'We want to test a new ranking model on a marketplace where sellers and buyers are interdependent. How do you design the experiment?',
      'The A/B test shows p=0.03 for our primary metric. What questions do you ask before calling it a win?',
      'How would you use DiD to measure the impact of a new feature rollout that went to 20 cities but not others?',
    ],
    posts: [85, 91, 92, 93],
  },
  {
    name: 'Deep Learning & LLMs',
    mustKnow: ['Attention complexity O(n²) and mitigations (FlashAttention, linear attention)', 'LoRA — rank decomposition, when to use vs full fine-tuning', 'RLHF vs DPO — trade-offs, when to use each', 'RAG — chunking, hybrid retrieval, evaluation (RAGAS)', 'Quantisation (INT8, GPTQ, AWQ) — quality vs speed trade-off', 'LLM serving — vLLM (PagedAttention, continuous batching), KV cache'],
    probes: [
      'Our RAG system is hallucinating 15% of the time even when the answer is in the retrieved context. What do you investigate?',
      'You need to deploy a 7B LLM at < 200ms p99 latency for 500 RPS. Walk me through the architecture.',
      'When would you use DPO over RLHF for aligning a model on your domain?',
    ],
    posts: [51, 54, 55, 67, 90, 99],
  },
  {
    name: 'ML Systems & MLOps',
    mustKnow: ['Training-serving skew — causes, detection, prevention', 'Feature stores — point-in-time correctness, online vs offline', 'PSI for distribution monitoring', 'Concept drift vs data drift — diagnosis and response', 'Two-stage ML serving (retrieval + ranking funnel)', 'Model cards and documentation'],
    probes: [
      'Your model has 0.82 AUC offline but 0.71 AUC online. What is the most likely cause and how do you diagnose it?',
      'Design the feature engineering and serving pipeline for a real-time pricing model at 10K RPS.',
      'How do you know when to retrain vs rebuild a model that has been degrading in production?',
    ],
    posts: [77, 94],
  },
]

const WEEK_PLAN = [
  {
    day: 'Day 1 — Foundations',
    focus: 'Mathematics and first-principles ML',
    tasks: ['Read Ground Up posts: Probability (101), Linear Algebra (102), Calculus (103), MLE/MAP (105)', 'Read: Logistic Regression (107), Decision Trees/RF (108)', 'Complete Colab challenge for at least 2 posts'],
    tip: 'Do not skip the derivations. Senior interviews at Flipkart, Walmart, and Amazon will ask you to derive the normal equations or the gradient of cross-entropy from scratch.',
  },
  {
    day: 'Day 2 — Core ML depth',
    focus: 'XGBoost, calibration, Bayesian, bias-variance',
    tasks: ['Read: XGBoost (73), Bias-Variance (74), Bayesian Inference (75), Calibration (76)', 'Read: Feature Stores (77)', 'Do all ClassicalML tab scenarios'],
    tip: 'SHAP is asked at almost every Tier 1 company. Be able to explain TreeSHAP and draw a force plot from memory.',
  },
  {
    day: 'Day 3 — RecSys + Search',
    focus: 'Retrieval, ranking, IR systems',
    tasks: ['Read: Two-Tower (70), LTR (71), RecSys Stack (72)', 'Read: BM25/TF-IDF (79), Semantic Search (80), RAG (90)', 'Do all FeatureEng tab scenarios (RecSys domain)', 'Do 5 Incident Room scenarios'],
    tip: 'For Flipkart Search and Meesho/Walmart RecSys loops — the system design round is the hardest. Practice drawing the full two-stage funnel with latency budgets per component.',
  },
  {
    day: 'Day 4 — Fraud + Anomaly + Forecasting',
    focus: 'Fintech niche depth',
    tasks: ['Read: Anomaly Detection (95), Concept Drift (94)', 'Read: Time Series (88), PCA (86), Clustering (87)', 'Do FraudDetection project lab (phases 1-3)', 'Practice 3 Incident Room scenarios'],
    tip: 'PhonePe, Razorpay, Juspay, and CRED all give a take-home dataset before the interview. The catch: they care about your thinking process more than your AUC. Write up your assumptions explicitly.',
  },
  {
    day: 'Day 5 — Pricing + Causal + Experimentation',
    focus: 'DS niche depth (Swiggy, Zomato, Ola)',
    tasks: ['Read: Price Elasticity (81), LTV/Churn (82), Attribution (83), Uplift (84), Multiple Testing (85)', 'Read: Network Effects/SUTVA (91), DiD/RDD (92), Metrics (93)', 'Do CausalInference tab scenarios'],
    tip: 'CUPED is not in MSL yet — read the Booking.com and Uber engineering blog posts on variance reduction. This separates good candidates from great ones in experimentation-heavy roles.',
  },
  {
    day: 'Day 6 — Systems + Production',
    focus: 'ML system design and production judgment',
    tasks: ['Do ALL 12 Incident Room scenarios', 'Do all System Design tab scenarios', 'Read: Distillation (78), Contrastive/CLIP (69)', 'Read: DL posts — Backprop (51), Transformer (55), Optimisation (56)'],
    tip: 'In senior system design rounds, the interviewer will keep narrowing scope until you\'re uncomfortable. Practice saying "given the constraint of X, I would choose Y because Z" — not just describing what exists.',
  },
  {
    day: 'Day 7 — Mock + Behavioral',
    focus: 'Interview simulation',
    tasks: ['Run 2 full mock interviews using the Trainer tab', 'Prepare 5 STAR stories: metrics conflict, model failure in production, cross-functional disagreement, technical trade-off decision, failed project learning', 'Review all interview Q&As in the Gradient posts you read', 'Sleep'],
    tip: 'For Lead roles, 1-2 rounds are entirely behavioral. "Tell me about a time the model you shipped caused harm" is a real question at Swiggy and Flipkart for senior+ roles. Have a specific answer.',
  },
]

const COMPANY_PROFILES = [
  {
    name: 'Flipkart',
    niches: 'Search, RecSys, Pricing, Ads, Experimentation, Supply Chain',
    rounds: '4-6 rounds: ML breadth → ML depth → case study → system design → behavioral',
    focus: 'Extremely strong on system design. Case study round is a real business problem (e.g. improve search relevance for fashion). SQL is tested. Experimentation knowledge expected at all senior levels.',
    gotcha: 'They will ask you to design the offline-online metric correlation pipeline. Know how DCG changes map to revenue changes.',
  },
  {
    name: 'Swiggy / Zomato',
    niches: 'Pricing, Demand Forecasting, RecSys, Fraud, Experimentation',
    rounds: '4-5 rounds: take-home case → case discussion → ML depth → system design → hiring manager',
    focus: 'Take-home case is real (predict restaurant demand, price optimisation). They want business framing + ML rigor. Causal inference for pricing and experimentation with SUTVA violations comes up frequently.',
    gotcha: 'They care deeply about metric definition. "How do you measure the success of this feature?" is often 30 minutes by itself.',
  },
  {
    name: 'PhonePe / Razorpay / Juspay',
    niches: 'Fraud, Risk, Payments ML, Credit',
    rounds: '4-5 rounds: take-home dataset → ML concepts from assignment → advanced ML + reasoning → business case',
    focus: 'Take-home is almost always a fraud/risk dataset (imbalanced, messy). They read your code. Real-time system design (sub-100ms) is standard for senior roles. Threshold calibration and business trade-offs (FPR vs recall) are tested deeply.',
    gotcha: 'They want to see your thought process on the take-home more than the AUC. Document your assumptions. A 0.82 AUC with clear reasoning beats 0.89 AUC with no explanation.',
  },
  {
    name: 'Meesho / Walmart Global Tech',
    niches: 'Search, RecSys, Pricing, Supply Chain',
    rounds: '4-5 rounds: DSA/SQL → ML breadth → ML depth → system design → behavioral',
    focus: 'Walmart is strong on SQL and data engineering. Meesho asks search and ranking questions similar to Flipkart but at slightly less depth. Both care about distributed ML systems at scale.',
    gotcha: 'Walmart asks about Spark and distributed data processing for ML pipelines. If you\'ve never touched PySpark, spend an hour on the basics.',
  },
  {
    name: 'InMobi / Google / Meta (Ads)',
    niches: 'CTR prediction, Bidding, Ads RecSys, Attribution',
    rounds: '5-7 rounds: coding → ML depth × 2 → system design → behavioural × 2',
    focus: 'Most math-intensive. Auction theory, Vickrey second-price, GSP auctions. CTR at scale (billions of auctions/day). Budget pacing under uncertainty. Attribution with MMM vs MTA. Google rounds are longest and deepest.',
    gotcha: 'Position bias in ads is harder than in organic — expected revenue per impression is the objective, not just relevance. Know eCPM = CTR × bid and how it drives the auction.',
  },
  {
    name: 'Dream11 / MPL',
    niches: 'RecSys (team suggestions), Pricing (contest entry fees), Fraud (bot detection)',
    rounds: '4 rounds: ML concepts → case study → system design → behavioral',
    focus: 'Fantasy sports ML is unique — lineup scoring, contest pricing, ownership prediction, bot/fraud detection. If you can frame your skills in their domain context, you stand out significantly.',
    gotcha: 'The "design a contest pricing model" system design question is Dream11\'s signature. It\'s a multi-armed bandit + demand estimation + game theory problem. Think through all three layers.',
  },
  {
    name: 'GenAI Startups (Sarvam, Krutrim, etc.)',
    niches: 'LLM fine-tuning, RAG, Evaluation, LLM Serving',
    rounds: '3-4 rounds: take-home (fine-tune or eval something) → technical deep dive → system design',
    focus: 'Move fast. They expect you to have hands-on LLM experience. Know: LoRA/QLoRA, RLHF/DPO, vLLM serving, RAGAS evaluation, quantisation trade-offs. Indic language ML is a bonus for Indian startups.',
    gotcha: 'They will give you a real task (fine-tune a 7B model on their domain, build a RAG pipeline). The take-home quality is weighted very heavily. Side projects matter here more than anywhere else.',
  },
]

// ─── Components ──────────────────────────────────────────────────────────────

function Flashcards() {
  const [openIdx, setOpenIdx] = useState(null)
  const [filter, setFilter] = useState('All')
  const groups = ['All', ...Array.from(new Set(FLASHCARDS.map(f => f.group)))]
  const cards = filter === 'All' ? FLASHCARDS : FLASHCARDS.filter(f => f.group === filter)

  return (
    <div>
      <p style={{ color: 'var(--ink-mid)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
        50 Q&As you should be able to answer in under 60 seconds. Click any question to see the answer. Filter by topic.
      </p>
      {/* group filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
        {groups.map(g => (
          <button key={g} onClick={() => { setFilter(g); setOpenIdx(null) }}
            style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-mono)', cursor: 'pointer', border: '1px solid', transition: 'all var(--t-fast)',
              background: filter === g ? 'var(--prime)' : 'transparent',
              color: filter === g ? '#000' : 'var(--ink-mid)',
              borderColor: filter === g ? 'var(--prime)' : 'var(--rim)' }}>
            {g}
          </button>
        ))}
      </div>
      {/* cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {cards.map((card, i) => (
          <div key={i} style={{ border: '1px solid var(--rim)', borderRadius: '10px', overflow: 'hidden',
            background: openIdx === i ? 'rgba(240,165,0,0.05)' : 'transparent', transition: 'background var(--t-fast)' }}>
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '10px' }}>{card.group}</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>{card.q}</span>
              </div>
              <span style={{ color: 'var(--prime)', fontSize: '11px', flexShrink: 0, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{openIdx === i ? '▲' : '▼'}</span>
            </button>
            {openIdx === i && (
              <div style={{ padding: '0 18px 16px', fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.75, borderTop: '1px solid var(--rim)', paddingTop: '12px' }}>
                {card.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LastDay() {
  const [section, setSection] = useState('formulas')
  const [openTrap, setOpenTrap] = useState(null)
  const [openFw, setOpenFw] = useState(null)

  return (
    <div>
      <p style={{ color: 'var(--ink-mid)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
        Key formulas, common traps, and decision frameworks. The things that separate senior candidates who know the concept from ones who can apply it.
      </p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {[['formulas','Formulas'], ['traps','Common Traps'], ['frameworks','Frameworks']].map(([k,l]) => (
          <button key={k} onClick={() => setSection(k)}
            style={{ padding: '7px 18px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: '1px solid',
              background: section === k ? 'var(--prime)' : 'transparent',
              color: section === k ? '#000' : 'var(--ink-mid)',
              borderColor: section === k ? 'var(--prime)' : 'var(--rim)' }}>
            {l}
          </button>
        ))}
      </div>

      {section === 'formulas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FORMULAS.map((f, i) => (
            <div key={i} style={{ border: '1px solid var(--rim)', borderRadius: '10px', padding: '18px 20px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{f.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--ink)', background: 'rgba(240,165,0,0.06)', padding: '10px 14px', borderRadius: '6px', marginBottom: '10px', lineHeight: 1.8 }}>{f.formula}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>{f.note}</div>
            </div>
          ))}
        </div>
      )}

      {section === 'traps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {TRAPS.map((t, i) => (
            <div key={i} style={{ border: '1px solid var(--rim)', borderRadius: '10px', overflow: 'hidden',
              background: openTrap === i ? 'rgba(240,165,0,0.05)' : 'transparent' }}>
              <button onClick={() => setOpenTrap(openTrap === i ? null : i)}
                style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 500 }}>⚠ {t.trap}</span>
                <span style={{ color: 'var(--prime)', fontSize: '11px', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{openTrap === i ? '▲' : '▼'}</span>
              </button>
              {openTrap === i && (
                <div style={{ padding: '0 18px 14px', fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.7, borderTop: '1px solid var(--rim)', paddingTop: '12px' }}>
                  <span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontSize: '11px', marginRight: '8px' }}>FIX:</span>{t.fix}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {section === 'frameworks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FRAMEWORKS.map((fw, i) => (
            <div key={i} style={{ border: '1px solid var(--rim)', borderRadius: '10px', overflow: 'hidden',
              background: openFw === i ? 'rgba(240,165,0,0.05)' : 'transparent' }}>
              <button onClick={() => setOpenFw(openFw === i ? null : i)}
                style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 500 }}>{fw.title}</span>
                <span style={{ color: 'var(--prime)', fontSize: '11px', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{openFw === i ? '▲' : '▼'}</span>
              </button>
              {openFw === i && (
                <div style={{ padding: '0 18px 14px', borderTop: '1px solid var(--rim)', paddingTop: '12px' }}>
                  {fw.rules.map((r, j) => (
                    <div key={j} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>→</span>
                      <span style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ThreeDays({ onNavigate }) {
  const [openDomain, setOpenDomain] = useState(0)

  return (
    <div>
      <p style={{ color: 'var(--ink-mid)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
        Domain-by-domain audit. For each domain: what you must know, the probe questions you'll actually get asked, and which Gradient posts to read.
      </p>
      {DOMAINS.map((d, i) => (
        <div key={i} style={{ border: '1px solid var(--rim)', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden',
          background: openDomain === i ? 'rgba(240,165,0,0.04)' : 'transparent' }}>
          <button onClick={() => setOpenDomain(openDomain === i ? null : i)}
            style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>{d.name}</span>
            <span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{openDomain === i ? '▲' : '▼'}</span>
          </button>
          {openDomain === i && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--rim)', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Must Know</div>
              {d.mustKnow.map((m, j) => (
                <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--prime)', flexShrink: 0, fontSize: '12px', marginTop: '2px' }}>✓</span>
                  <span style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{m}</span>
                </div>
              ))}

              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 10px' }}>Probe Questions</div>
              {d.probes.map((p, j) => (
                <div key={j} style={{ background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px',
                  fontSize: '13.5px', color: 'var(--ink)', lineHeight: 1.65 }}>
                  {p}
                </div>
              ))}

              {d.posts.length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 10px' }}>Read in Gradient</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {d.posts.map(pid => (
                      <button key={pid} onClick={() => onNavigate && onNavigate('gradient')}
                        style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                          background: 'transparent', border: '1px solid var(--prime)', color: 'var(--prime)' }}>
                        Post #{pid}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function OneWeek() {
  const [openDay, setOpenDay] = useState(0)
  const [openCo, setOpenCo] = useState(null)

  return (
    <div>
      <p style={{ color: 'var(--ink-mid)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
        A full 7-day preparation plan, followed by company-specific interview profiles for the Bangalore market.
      </p>

      {/* Day plan */}
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>7-Day Plan</div>
      {WEEK_PLAN.map((day, i) => (
        <div key={i} style={{ border: '1px solid var(--rim)', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden',
          background: openDay === i ? 'rgba(240,165,0,0.04)' : 'transparent' }}>
          <button onClick={() => setOpenDay(openDay === i ? null : i)}
            style={{ width: '100%', textAlign: 'left', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{day.day}</span>
              <span style={{ fontSize: '12px', color: 'var(--ink-mid)', marginLeft: '12px' }}>{day.focus}</span>
            </div>
            <span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontSize: '11px', flexShrink: 0 }}>{openDay === i ? '▲' : '▼'}</span>
          </button>
          {openDay === i && (
            <div style={{ padding: '0 20px 18px', borderTop: '1px solid var(--rim)', paddingTop: '14px' }}>
              {day.tasks.map((t, j) => (
                <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--prime)', flexShrink: 0, fontSize: '12px', marginTop: '2px' }}>→</span>
                  <span style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
              <div style={{ marginTop: '14px', background: 'rgba(240,165,0,0.07)', borderLeft: '3px solid var(--prime)', padding: '10px 14px', borderRadius: '0 8px 8px 0',
                fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                💡 {day.tip}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Company profiles */}
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '36px 0 14px' }}>Company Profiles — Bangalore Senior/Lead DS/MLE</div>
      {COMPANY_PROFILES.map((co, i) => (
        <div key={i} style={{ border: '1px solid var(--rim)', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden',
          background: openCo === i ? 'rgba(240,165,0,0.04)' : 'transparent' }}>
          <button onClick={() => setOpenCo(openCo === i ? null : i)}
            style={{ width: '100%', textAlign: 'left', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{co.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-mid)', marginLeft: '12px', fontFamily: 'var(--font-mono)' }}>{co.niches}</span>
            </div>
            <span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontSize: '11px', flexShrink: 0 }}>{openCo === i ? '▲' : '▼'}</span>
          </button>
          {openCo === i && (
            <div style={{ padding: '0 20px 18px', borderTop: '1px solid var(--rim)', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', marginBottom: '10px' }}>{co.rounds}</div>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.7, marginBottom: '12px' }}>{co.focus}</p>
              <div style={{ background: 'rgba(240,165,0,0.07)', borderLeft: '3px solid var(--prime)', padding: '10px 14px', borderRadius: '0 8px 8px 0',
                fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                <strong style={{ color: 'var(--prime)' }}>Watch out: </strong>{co.gotcha}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const TIERS = [
  { id: 0, label: 'Last Few Hours', sub: '50 one-liner Q&As' },
  { id: 1, label: 'Last Day', sub: 'Formulas · Traps · Frameworks' },
  { id: 2, label: '3 Days', sub: 'Domain-by-domain audit' },
  { id: 3, label: '1 Week', sub: 'Full plan + company profiles' },
]

export default function CheatsheetTab({ onNavigate }) {
  const [tier, setTier] = useState(0)

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 0 80px' }}>
      {/* header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
          ⟩ Last-Minute Prep
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 10px' }}>Interview Cheatsheet</h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
          Four preparation tiers mapped to how much time you have left. Pick your tier — the content is dense and senior-focused.
        </p>
      </div>

      {/* tier selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '36px' }}>
        {TIERS.map(t => (
          <button key={t.id} onClick={() => setTier(t.id)}
            style={{ padding: '14px 12px', borderRadius: '12px', cursor: 'pointer', border: '1px solid', textAlign: 'left', transition: 'all var(--t-fast)',
              background: tier === t.id ? 'var(--prime)' : 'var(--surface)',
              borderColor: tier === t.id ? 'var(--prime)' : 'var(--rim)',
              color: tier === t.id ? '#000' : 'var(--ink)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{t.label}</div>
            <div style={{ fontSize: '11px', opacity: tier === t.id ? 0.75 : 0.55, fontFamily: 'var(--font-mono)' }}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* tier content */}
      {tier === 0 && <Flashcards />}
      {tier === 1 && <LastDay />}
      {tier === 2 && <ThreeDays onNavigate={onNavigate} />}
      {tier === 3 && <OneWeek />}
    </div>
  )
}
