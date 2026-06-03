import { useState, useEffect, useRef, useCallback } from 'react'
import { trackModuleComplete } from '../analytics'
import FidelityBadge from '../components/FidelityBadge.jsx'

// ─── Question Bank ──────────────────────────────────────────────────────────

const MCQ_QUESTIONS = [
  // Feature Engineering
  { id: 'C1', domain: 'Feature Engineering', type: 'mcq',
    q: 'Which technique handles high-cardinality categoricals in tree-based models without memory explosion?',
    options: ['One-hot encoding', 'Ordinal encoding by frequency', 'Target encoding with k-fold', 'Binary encoding'],
    correct: 2,
    explanation: "Target encoding with k-fold prevents leakage while keeping dimensionality at 1. Tree models exploit this efficiently. In production this breaks as: target encoding computed on the full dataset inflates feature importance; model AUC drops 5-10 points when tested on data collected after the training cutoff.", whatsTested: 'Whether you know target encoding with k-fold is the right high-cardinality strategy for tree models.', antiPattern: 'One-hot encoding at 10K categories is the most common wrong answer — catastrophic for memory.', staffFraming: 'Trees + high cardinality = target encoding with k-fold. Non-k-fold target encoding is a classic production leakage bug.' },
  { id: 'C2', domain: 'Feature Engineering', type: 'mcq',
    q: 'Feature normalization is critical for which algorithm?',
    options: ['Random Forest', 'Gradient Boosting', 'Support Vector Machine', 'Decision Tree'],
    correct: 2,
    explanation: "SVMs use distance metrics (kernel), making them sensitive to feature scale. Tree-based methods are invariant to monotonic transformations. In production this breaks as: SVM trained on unscaled features has near-random predictions in serving; the tell is train AUC 0.85, serving AUC 0.52 with no obvious data issue.", whatsTested: 'Whether you know which algorithms require feature scaling vs which are scale-invariant.', antiPattern: 'Gradient Boosting and Random Forest look plausible but both are scale-invariant — trees split by threshold not distance.', staffFraming: 'Scale-sensitive: SVM, KNN, PCA, logistic. Scale-invariant: all tree-based methods. Memorise this split once.' },
  { id: 'C3', domain: 'Feature Engineering', type: 'mcq',
    q: 'What is the correct way to impute missing values to avoid data leakage?',
    options: ['Impute with column mean computed on full dataset', 'Impute with median computed on training set only, then apply same to test', 'Impute with the global median recomputed fresh on each evaluation fold to keep statistics current', 'Fit imputer on train + validation combined to reduce imputation variance'],
    correct: 1,
    explanation: "Fit imputer on train only, then transform test with the same statistics. Leakage occurs whenever the imputer sees any data outside the training fold — including validation folds or the combined train+val set. Recomputing on each fold (option C) sounds principled but still leaks: the fold's validation labels inform which rows are in that fold's 'fresh' statistics. Production tell: validation AUC is suspiciously close to train AUC; model degrades sharply on truly held-out data collected after the training cutoff.", whatsTested: 'Whether you know imputation statistics must be fit on training data only — never the full dataset.', antiPattern: 'Option A (mean of full dataset) leaks test information into training. Recomputing per fold also leaks validation fold labels.', staffFraming: 'Fit imputers on train, transform everything else with those statistics. Same rule for scalers, encoders, all transforms.' },
  { id: 'C4', domain: 'Feature Engineering', type: 'mcq',
    q: 'Log transformation of a right-skewed feature primarily helps:',
    options: ['Reduce feature correlation', 'Make tree models converge faster', 'Satisfy normality assumptions in linear models', 'Remove outliers'],
    correct: 2,
    explanation: "Log transform reduces right skew, approximating normality. This improves linear/logistic regression and distance-based methods. In production this breaks as: serving pipeline applies raw feature but training used log-transformed; residuals explode on high-value inputs and RMSE spikes 3-5x at deployment.", whatsTested: 'Whether you know log transform reduces right skew and improves linear and distance-based models specifically.', antiPattern: 'Option D (removes outliers) is a common confusion — log transform compresses them, it does not remove them.', staffFraming: 'Log transform helps linear/logistic regression and distance-based models. Trees are invariant to monotonic transformations.' },
  // Model Evaluation
  { id: 'C5', domain: 'Model Evaluation', type: 'mcq',
    q: 'Stratified K-fold cross-validation is essential when:',
    options: ['Dataset has more than 10,000 samples', 'Target class distribution is imbalanced', 'Features have different scales', 'Cross-validation is nested inside hyperparameter search'],
    correct: 1,
    explanation: "Stratified k-fold preserves class proportions in each fold, preventing folds from having no positive examples in rare-class scenarios. Nested CV for hyperparameter search is unrelated to stratification — it addresses a different problem (selection bias). Feature scaling affects distance-based models but is not a reason for stratification. In production this breaks as: standard k-fold on 1% positive-rate data produces folds with 0 positives; log loss returns NaN and the training job silently produces a useless model.", whatsTested: 'Whether you know stratified k-fold preserves class proportions per fold, preventing folds with zero positive examples.', antiPattern: 'Option D (nested CV for hyperparameter search) solves selection bias, not fold imbalance — it is a different problem.', staffFraming: 'Stratified k-fold is mandatory when positive rate < 10%. Without it folds can have zero positives and training fails silently.' },
  { id: 'C6', domain: 'Model Evaluation', type: 'mcq',
    q: 'Which metric is most appropriate for ranking model evaluation when top-position relevance matters most?',
    options: ['MAP@K (Mean Average Precision at K)', 'Macro-averaged AUC across item categories', 'NDCG@K', 'AUC-ROC'],
    correct: 2,
    explanation: "NDCG@K captures position-weighted relevance via log-discounting: relevant item at rank 1 is worth far more than at rank 10. MAP@K also averages precision at each relevant rank but weights all positions within K equally — it misses the concentration of value at the very top of the list. Macro-AUC measures discriminative ability per class, not list ordering quality, and AUC-ROC collapses the ranking problem to a binary classification view. Production tell: AUC looks flat but user engagement drops; NDCG@5 reveals the model is burying relevant items below rank 5 where users rarely scroll.", whatsTested: 'Whether you know NDCG@K rewards position-weighted relevance — relevant items at rank 1 are worth far more than rank 10.', antiPattern: 'MAP@K is the most common wrong answer — it also averages precision at relevant ranks but weights all positions within K equally.', staffFraming: 'NDCG@K uses log-discounting. MAP@K weights positions equally within K. When top-rank errors are most costly, use NDCG.' },
  { id: 'C7', domain: 'Model Evaluation', type: 'mcq',
    q: 'Log loss penalizes:',
    options: ['Only incorrect predictions', 'Confident wrong predictions most severely', 'Low-confidence correct predictions more harshly than high-confidence wrong ones', 'Predictions far from 0.5 only'],
    correct: 1,
    explanation: "Log loss = -log(p) for true class. If model predicts p=0.01 for true class, loss = -log(0.01) ≈ 4.6. High confidence wrong predictions = very high loss. In production this breaks as: a single confident wrong prediction on a rare fraud case inflates average log loss and masks poor calibration on the long tail.", whatsTested: 'Whether you know log loss penalises confident wrong predictions exponentially, not just incorrect ones.', antiPattern: 'Option A (only incorrect predictions) misses that log loss also penalises low-confidence correct predictions.', staffFraming: 'Log loss = -log(p). Predicting 0.01 for the true class costs ~4.6. Miscalibrated confidence is the real production failure mode.' },
  { id: 'C8', domain: 'Model Evaluation', type: 'mcq',
    q: 'Pearson correlation between predicted and actual values measures:',
    options: ['Calibration quality', 'Linear association strength only — misses nonlinear patterns', 'Both precision and recall', 'Rank correlation quality of predicted probabilities'],
    correct: 1,
    explanation: "Pearson measures linear association specifically — not rank quality. Spearman (rank) correlation measures monotone association, which is what you'd want for ranking quality. A model can have high Pearson but poor calibration (all predictions scaled wrong). Production tell: downstream system uses predicted probabilities as scores for a threshold rule; miscalibration causes 40% of positives to be missed despite high AUC.", whatsTested: 'Whether you know Pearson measures linear association only and misses nonlinear patterns.', antiPattern: 'Option D (rank correlation quality) is Spearman, not Pearson — a common confusion.', staffFraming: 'Pearson for linear association. Spearman for monotone rank quality. High Pearson can coexist with terrible calibration.' },
  // ML Systems
  { id: 'C9', domain: 'ML Systems', type: 'mcq',
    q: "A feature pipeline's SLA is 5 minutes but upstream data arrives with variable delay. Best approach?",
    options: ['Fail the pipeline if data is late', 'Use a watermark-based approach with late data handling', 'Buffer all events for 10× the maximum observed delay before aggregating', 'Skip late records'],
    correct: 1,
    explanation: "Streaming systems (Flink/Spark SS) use watermarks to bound lateness adaptively. Buffering for a fixed 10× max delay breaks the 5-min SLA and is non-adaptive — a single outlier delay pollutes future windows. Events within watermark window are processed; beyond it trigger late-data handling (side output or drop). In production this breaks as: watermark set too tight drops 15% of mobile events from flaky connections; aggregates are systematically undercounted and fraud model misses spikes.", whatsTested: 'Whether you know watermarks adaptively bound lateness — fixed time buffers are non-adaptive and will break SLAs on single outliers.', antiPattern: 'Buffering 10× the max observed delay is non-adaptive — one extreme outlier extends that buffer and breaks the 5-min SLA indefinitely.', staffFraming: 'Watermark sets the late-data boundary adaptively. Late events hit a side output or are dropped. Fixed buffers fail on outliers by design.' },
  { id: 'C10', domain: 'ML Systems', type: 'mcq',
    q: 'The primary bottleneck in online feature serving at <10ms SLO is typically:',
    options: ['Model inference', 'Network round-trips to feature store', 'Feature transformation CPU cost', 'JSON serialization'],
    correct: 1,
    explanation: "Network latency to Redis/Cassandra is typically 1-5ms per call. Multiple lookups add up. Solutions: batch feature requests, co-locate feature store and model server, cache hot user features. Production tell: p99 serving latency is 200ms but model compute is only 20ms; a flame graph shows 80% of time spent in sequential Redis calls.", whatsTested: 'Whether you know network latency to the feature store dominates serving latency at <10ms SLO, not model inference.', antiPattern: 'Model inference feels like the bottleneck — the ML work — but it is typically only 1-3ms.', staffFraming: 'Profile before optimising. Feature store round-trips are usually 80% of p99 latency in practice. Batch the lookups.' },
  { id: 'C11', domain: 'ML Systems', type: 'mcq',
    q: 'Shadow deployment differs from canary deployment in that:',
    options: ['Shadow deployment is equivalent to a canary at 0% traffic — both serve the new model to a small subset', 'Shadow serves real users', 'Shadow runs new model but discards responses — zero user impact', 'Shadow uses a separate holdout dataset rather than live traffic'],
    correct: 2,
    explanation: "Shadow: mirror production traffic to new model, compare outputs, no user impact. Canary: new model serves real users (small %). Shadow is pure offline validation on live traffic — not a canary at 0%, which would serve nobody and provide no signal. Choose shadow when serving degraded results to even 1% of users is unacceptable — high-stakes, low-reversibility decisions. Choose canary when you need real user behavior signal.", whatsTested: 'Whether you know shadow mode serves all production traffic but discards responses — zero user impact.', antiPattern: 'Option A (shadow = canary at 0%) is a common confusion — canary at 0% serves nobody and gives no signal.', staffFraming: 'Shadow: real traffic, discarded responses, zero user impact. Canary: real traffic, real responses, small user subset.' },
  { id: 'C12', domain: 'ML Systems', type: 'mcq',
    q: 'What is the most important property of a training-serving skew check?',
    options: ['Comparing model weights between training and serving', 'Verifying feature transformations are identical between training and serving', 'Checking that serving latency is <100ms', 'Ensuring model version is current'],
    correct: 1,
    explanation: "Training-serving skew: different feature computation in training vs. serving is the #1 source of silent production failures. Test: run same input through both paths, assert output equality. Production tell: offline evaluation looks strong but online A/B shows no lift; diffing a single request through both pipelines reveals a normalization mismatch.", whatsTested: 'Whether you know training-serving skew detection requires running identical input through both pipelines and comparing outputs.', antiPattern: 'Monitoring business metrics catches skew late — skew shows up before business metrics move.', staffFraming: 'The definitive test: same input through training pipeline and serving pipeline. Any output difference is skew.' },
  // Statistics & Probability
  { id: 'C13', domain: 'Statistics & Probability', type: 'mcq',
    q: 'Type II error in hypothesis testing is:',
    options: ['Rejecting a true null hypothesis', 'Failing to reject a false null hypothesis', 'Accepting the alternative when it\'s false', 'Running multiple tests without correction'],
    correct: 1,
    explanation: "Type I (α): false positive — reject true H0. Type II (β): false negative — fail to reject false H0. Power = 1-β. Increase power by: larger N, larger effect size, higher α. In production this breaks as: underpowered experiment ships a null result as a win; feature launches but long-run holdback shows no revenue improvement.", whatsTested: 'Whether you know Type II error is a false negative — failing to detect a real effect.', antiPattern: 'Type I and Type II are frequently swapped. Type I = alpha (false positive). Type II = beta (false negative, missed effect).', staffFraming: 'Power = 1 - beta. Underpowered experiments ship null results as wins because Type II errors are invisible.' },
  { id: 'C14', domain: 'Statistics & Probability', type: 'mcq',
    q: 'The central limit theorem states that:',
    options: ['All distributions converge to normal with enough data', 'Sample means of any distribution converge to normal as n increases', 'Large samples have smaller variance', 'Population mean equals sample mean'],
    correct: 1,
    explanation: "CLT: distribution of sample means approaches N(μ, σ²/n) regardless of population distribution, as n→∞. Enables parametric tests even on non-normal populations. Requires independence. Production tell: t-test on revenue fails because a handful of whale users dominate variance; log-transform or bootstrap brings the distribution into CLT range.", whatsTested: 'Whether you know CLT describes the distribution of sample means, not requiring the population to be normal.', antiPattern: 'Requiring normal population distribution is the classic CLT misconception — CLT says the means converge, not the data.', staffFraming: 'CLT: sample means approach N(mu, sigma2/n) regardless of population shape. Requires independence. Enables parametric tests.' },
  { id: 'C15', domain: 'Statistics & Probability', type: 'mcq',
    q: 'Bayesian A/B testing compared to frequentist primarily enables:',
    options: ['Faster computation', 'Larger sample sizes', 'Continuous monitoring without inflating Type I error', 'Incorporating domain priors about expected effect sizes to reduce required sample size'],
    correct: 2,
    explanation: "Bayesian A/B testing's primary advantage is valid continuous monitoring — P(B>A | data) can be computed at any point without inflating the false-positive rate. Incorporating priors is a secondary Bayesian feature, and using strongly biased priors can mislead decisions. Bayesian methods still require a control group. In production this breaks as: analyst checks p-value daily and stops at first p<0.05; actual false positive rate is closer to 30%, not 5%.", whatsTested: 'Whether you know Bayesian A/B testing enables valid continuous monitoring without inflating the false positive rate.', antiPattern: 'Incorporating priors is a Bayesian feature but not the primary advantage over frequentist methods.', staffFraming: 'Bayesian: compute P(B>A|data) at any time. Frequentist fixed-horizon: peeking early inflates Type I error to ~30%.' },
  { id: 'C16', domain: 'Statistics & Probability', type: 'mcq',
    q: 'Maximum Likelihood Estimation (MLE) finds parameters that:',
    options: ['Maximize the joint probability P(θ, data) by finding the most likely parameter-data pairing', 'Maximize the posterior probability', 'Maximize the probability of observed data given parameters', 'Minimize variance of the estimator'],
    correct: 2,
    explanation: "MLE: θ̂ = argmax P(data | θ). No prior. Contrast with MAP which adds a prior. MLE is equivalent to MAP with uniform prior. In production this breaks as: MLE on sparse categorical data assigns near-zero probability to unseen classes; MAP with a weak Dirichlet prior prevents zero-probability predictions in production logs.", whatsTested: 'Whether you know MLE finds parameters maximising the probability of observing the data — no prior.', antiPattern: 'Minimising prediction error sounds equivalent but MLE specifically maximises the likelihood function.', staffFraming: 'MLE = argmax P(data|theta). No prior. MAP adds a prior. Sparse data makes MLE assign zero probability to unseen classes.' },
  // Deep Learning
  { id: 'C17', domain: 'Deep Learning', type: 'mcq',
    q: 'Dropout during training acts as:',
    options: ['A learning rate scheduler', 'An ensemble of exponentially many sub-networks', 'An implicit L2 regularizer — equivalent to weight decay on the dropped units', 'Feature selection'],
    correct: 1,
    explanation: "Dropout randomly zeros units. Equivalent to training 2^N networks sharing weights, then averaging at test time (approximate). Prevents co-adaptation, acts as ensemble. Dropout and L2/weight decay are related but distinct: weight decay penalizes magnitude of all weights continuously, while dropout creates sparsity stochastically. In production this breaks as: dropout left enabled at serving time (model.train() instead of model.eval()); predictions are stochastic and non-reproducible, causing inconsistent user-facing results.", whatsTested: 'Whether you know dropout functions as an ensemble of subnetworks and must be disabled at inference.', antiPattern: 'Preventing overfitting by adding noise is partially right but misses the ensemble interpretation.', staffFraming: 'Dropout left on at inference (model.train() not model.eval()) makes predictions non-deterministic. Classic production bug.' },
  { id: 'C18', domain: 'Deep Learning', type: 'mcq',
    q: 'When fine-tuning a pretrained language model, which layers should be unfrozen first?',
    options: ['Embedding layers — they are closest to the raw input and need the most domain adaptation', 'First (earliest) transformer layers', 'Last (top) layers closest to the output', 'All layers with layer-specific learning rates (largest LR for top layers)'],
    correct: 2,
    explanation: "Lower layers encode general features (syntax, basic semantics) that transfer well. Upper layers encode task-specific features that need the most adaptation. Fine-tune top layers first, optionally unfreeze lower layers with smaller LR. Embedding layers encode vocabulary and should almost never be fine-tuned first — they encode distributional priors that are expensive to relearn. Layer-specific learning rates (LLRD) are a valid technique for full fine-tuning but don't substitute for starting with only the top layers unfrozen. In production this breaks as: fine-tuning all layers with a single high LR catastrophically forgets general representations; validation loss explodes after epoch 1 on a small domain dataset.", whatsTested: 'Whether you know top layers encode task-specific features and should be unfrozen first in fine-tuning.', antiPattern: 'Unfreezing embedding layers first is wrong — they encode distributional priors that are expensive to relearn.', staffFraming: 'Bottom layers = general features (transfer well). Top layers = task-specific (unfreeze first). Embedding layer = last or never.' },
  { id: 'C19', domain: 'Deep Learning', type: 'mcq',
    q: 'Batch size in deep learning training: doubling batch size with fixed epochs typically:',
    options: ['Requires proportionally decreasing the learning rate to maintain convergence', 'Improves generalization', 'Degrades generalization — larger batches find sharper minima', 'Always requires halving learning rate'],
    correct: 2,
    explanation: "Large batches → sharper minima → worse generalization (Keskar et al.). Linear scaling rule: when doubling batch size, INCREASE LR proportionally (double it) and add warmup — decreasing it would slow convergence and compound the generalization harm. Production tell: migrating from 8-GPU to 64-GPU training with naive batch scaling; validation accuracy drops 2-3 points even though training loss converges similarly.", whatsTested: 'Whether you know doubling batch size requires increasing LR proportionally, not decreasing it.', antiPattern: 'Decreasing LR with larger batch is the most common wrong intuition — larger batch gives more stable gradient and needs higher LR.', staffFraming: 'Large batch + proportional LR + warmup: maintains generalisation. Without LR scaling: sharp minima, worse generalisation.' },
  { id: 'C20', domain: 'Deep Learning', type: 'mcq',
    q: "The attention mechanism's computational complexity per sequence is:",
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
    correct: 2,
    explanation: "Scaled dot-product attention computes n×n attention matrix. O(n²) in time and space. Sparse attention (Longformer), linear attention, and flash attention are optimizations. In production this breaks as: OOM errors when context length doubles from 512 to 1024 tokens; memory grows quadratically and a single long document crashes the inference pod.", whatsTested: 'Whether you know attention is O(n²) in time and memory because it computes a full n×n matrix of pairwise similarities.', antiPattern: 'O(n log n) feels plausible because it sits between linear and quadratic, but attention has no divide-and-conquer step — every pair is computed.', staffFraming: 'Attention matrix is n×n. Doubling context length quadruples memory. Flash attention / sparse attention are the production-scale fixes.' },
  // MLOps
  { id: 'C21', domain: 'MLOps', type: 'mcq',
    q: 'Data versioning in ML pipelines is most critical for:',
    options: ['Reducing storage costs', 'Enabling reproducible model training and debugging production issues', 'Enforcing schema validation at the point of data ingestion', 'Preventing data leakage'],
    correct: 1,
    explanation: "If a model misbehaves in production, you need to identify the exact training data. DVC, Delta Lake time-travel, or dataset snapshots enable: rollback, reproduce training, audit lineage. Schema validation is a separate concern — it catches malformed records at write time but does not preserve a snapshot of what data a specific model was trained on. Production tell: model starts misbehaving after a data pipeline update; without lineage you cannot determine whether the bug is in code or training data.", whatsTested: 'Whether you know data versioning is critical for model reproducibility — knowing what data trained a specific model.', antiPattern: 'Schema validation validates format at write time but does not preserve training data lineage for model reproduction.', staffFraming: 'Without data versioning: model misbehaves, you cannot reproduce training or audit what changed. DVC or Delta time-travel fix this.' },
  { id: 'C22', domain: 'MLOps', type: 'mcq',
    q: 'Feature stores provide value primarily by:',
    options: ['Replacing model serving infrastructure', 'Eliminating training-serving skew and enabling feature reuse across teams', 'Automatically engineering features', 'Reducing model training time'],
    correct: 1,
    explanation: "Feature stores: (1) single source of truth for features, (2) same computation in training (batch) and serving (online), (3) cross-team feature sharing and discovery. In production this breaks as: two teams compute 'user_30d_spend' differently; model trained on Team A's definition silently receives Team B's version at serving, causing a 15% revenue prediction bias.", whatsTested: 'Whether you know the primary feature store value is consistency — same computation for training and serving.', antiPattern: 'Reducing compute cost and enabling real-time features are secondary benefits, not the primary value.', staffFraming: 'Feature store = single source of truth. Two teams computing user_30d_spend differently = training-serving skew by design.' },
  { id: 'C23', domain: 'MLOps', type: 'mcq',
    q: 'Model monitoring differs from application monitoring in that:',
    options: ['Application monitoring is more important', 'Model monitoring requires tracking statistical properties of data and predictions, not just system health', 'Model monitoring catches issues earlier by tracking business metrics (CTR, revenue) directly', 'Model monitoring can be fully replaced by logging all predictions to a data warehouse and running weekly accuracy queries'],
    correct: 1,
    explanation: "App monitoring: latency, error rate, uptime. Model monitoring additionally requires: feature drift (PSI), prediction drift, label feedback quality, and calibration. Business metrics (CTR, revenue) are lagging indicators — model monitoring catches statistical drift days before business metrics move, not by tracking business metrics directly. Weekly accuracy queries are too coarse and too slow — PSI and prediction distribution monitoring detect problems in near-real-time. Production tell: infra dashboards all green but CTR drops 20%; model monitoring on prediction score distribution would have caught the drift three days earlier.", whatsTested: 'Whether you know model monitoring tracks statistical properties (drift, calibration), not just system health.', antiPattern: 'Application monitoring (latency, error rate) catches infrastructure issues but not model degradation.', staffFraming: 'PSI and prediction distribution monitoring catch model drift days before business metrics move.' },
  { id: 'C24', domain: 'MLOps', type: 'mcq',
    q: 'A/B testing in MLOps — the holdback group (never-treat) serves what purpose?',
    options: ['Increases statistical power', 'Measures long-term impact beyond initial experiment window', 'Reduces infrastructure cost', 'Prevents network effects'],
    correct: 1,
    explanation: "Holdback: permanently keep ~5% of users off a feature. Measure long-run impact after novelty wears off. Essential for features with delayed effects. In production this breaks as: 2-week A/B shows +8% engagement from novelty; a 90-day holdback reveals +1% steady-state, changing the business case for the feature.", whatsTested: 'Whether you know holdback experiments measure long-run steady-state impact after novelty effects decay.', antiPattern: 'Measuring treatment vs control is A/B testing — holdback specifically measures long-run impact A/B cannot capture.', staffFraming: 'A/B shows 2-week novelty lift. 90-day holdback shows steady-state. Often steady-state is 4-5x smaller.' },
  // Ranking & Retrieval
  { id: 'C25', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Inverse Document Frequency (IDF) in TF-IDF penalizes terms that:',
    options: ['Appear in few documents', 'Are long or complex', 'Appear in many documents (low discriminative power)', 'Have high term frequency'],
    correct: 2,
    explanation: "IDF = log(N/df). Terms in many documents (stopwords like 'the') get low IDF. Rare discriminative terms get high IDF. TF-IDF = TF × IDF rewards specific, relevant terms. In production this breaks as: IDF computed on a small index is re-used after corpus grows 10x; common terms retain artificially high IDF and dominate relevance scores.", whatsTested: 'Whether you know IDF penalises common terms to reward rare discriminative ones.', antiPattern: 'Penalising rare terms is the opposite — rare terms get HIGH IDF, common terms get LOW IDF.', staffFraming: 'IDF = log(N/df). Term in every document: IDF near 0. Term in 1 document: IDF = log(N). TF-IDF rewards specific terms.' },
  { id: 'C26', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Mean Reciprocal Rank (MRR) is most appropriate when:',
    options: ['Multiple relevant items exist per query', 'Only the rank of the first relevant item matters', 'All ranks are equally important', 'Evaluating precision at fixed cutoff'],
    correct: 1,
    explanation: "MRR = mean of 1/rank_first_relevant. Best for tasks like question answering where there's one correct answer and you care about where it appears. In production this breaks as: MRR looks stable but users report frustration; the metric masks that for 30% of queries the first relevant result moved from rank 2 to rank 6.", whatsTested: 'Whether you know MRR is appropriate when only the first relevant result matters, like question answering.', antiPattern: 'MAP@K is the common confusion — it averages precision at multiple relevant positions, for when you need multiple good results.', staffFraming: 'MRR: you care only about rank of the first relevant result. MAP@K: you care about multiple relevant results at different positions.' },
  { id: 'C27', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Product quantization in ANN search reduces:',
    options: ['Search recall', 'Index build time', 'Memory footprint by compressing embedding vectors', 'Embedding dimensionality during training'],
    correct: 2,
    explanation: "PQ splits vector into M sub-vectors, quantizes each to one of k centroids. 128-dim float32 (512 bytes) → PQ code (16 bytes). 32x compression with modest recall loss. In production this breaks as: increasing M for better recall exhausts RAM at scale; benchmark on 1M vectors passes but 100M vector index causes OOM on the retrieval node.", whatsTested: 'Whether you know product quantization reduces memory by encoding vectors as compact codebook indices.', antiPattern: 'Reducing query time is a secondary effect — PQ primarily reduces memory, speed improvement follows.', staffFraming: 'PQ: encode each vector as M sub-quantizer codes. Memory: 32-bit floats to 8-bit codes. Recall drops slightly, tunable via nprobe.' },
  { id: 'C28', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Re-ranking after ANN retrieval typically uses:',
    options: ['Faster, simpler models', 'The same retrieval model', 'Heavier models with more features that are too expensive for full corpus scoring', 'Rule-based filters only'],
    correct: 2,
    explanation: "Two-stage: (1) Retrieve top-K via fast ANN. (2) Re-rank K candidates with expensive model. Cost is O(K) not O(N). In production this breaks as: re-ranker improves quality but K is set too small (K=20); relevant items not in the first-stage shortlist can never appear in final results, capping recall at the first-stage ceiling.", whatsTested: 'Whether you know re-ranking uses an expensive cross-encoder that sees query and document together for better quality.', antiPattern: 'A simpler scoring function defeats the purpose of re-ranking — the whole point is higher-quality but slower scoring.', staffFraming: 'Two-stage: bi-encoder retrieves cheaply, cross-encoder re-ranks accurately. Never use cross-encoder at retrieval scale.' },
  // Experiment Design
  { id: 'C29', domain: 'Experiment Design', type: 'mcq',
    q: 'Network effects in A/B experiments violate the assumption of:',
    options: ['Normal distribution of outcomes', 'SUTVA (Stable Unit Treatment Value Assumption)', 'Equal group sizes', 'Random assignment'],
    correct: 1,
    explanation: "SUTVA: treatment of unit i doesn't affect unit j. In social networks, control users interacting with treated users receive indirect treatment. Solutions: cluster randomization, ego-network isolation. In production this breaks as: user-level randomization on a messaging feature shows +5% engagement; cluster randomization reveals true lift is only +1% after accounting for spillover.", whatsTested: 'Whether you know network effects violate SUTVA — a unit\'s outcome depends on other units\' treatment assignment.', antiPattern: 'Homogeneity of variance is a t-test assumption, not the SUTVA violation caused by network effects.', staffFraming: 'Network effects violate SUTVA: control users are affected by treated users\' behaviour. Fix: cluster randomisation.' },
  { id: 'C30', domain: 'Experiment Design', type: 'mcq',
    q: 'The minimum detectable effect (MDE) in experiment design depends on:',
    options: ['Model complexity', 'Sample size, significance level, power, and baseline metric variance', 'Number of experiments running simultaneously', 'Treatment implementation cost'],
    correct: 1,
    explanation: "MDE = z_{α/2+β} × σ / √n. Smaller MDE requires larger n. MDE determines if an experiment is powered to detect the business-relevant effect size. Production tell: experiment runs 2 weeks and concludes no effect; post-hoc power analysis shows MDE was 8% but the business only needed to detect a 2% lift — the test was never powered to answer the real question.", whatsTested: 'Whether you know MDE depends on both the metric\'s baseline variance and the sample size together.', antiPattern: 'Effect size alone is the common intuition but you also need variance and sample size to calculate MDE.', staffFraming: 'MDE = (z_alpha/2 + z_beta) x sigma / sqrt(n/2). Commit to MDE before running — it is a pre-registration commitment.' },
  { id: 'C31', domain: 'Experiment Design', type: 'mcq',
    q: 'Sequential testing (e.g., mSPRT) compared to fixed-horizon testing primarily:',
    options: ['Requires larger sample sizes', 'Enables valid continuous monitoring and early stopping without inflating Type I error', 'Is less statistically rigorous', 'Cannot be used for business metrics'],
    correct: 1,
    explanation: "Fixed-horizon: p-values invalid if you peek. Sequential tests (mSPRT, always-valid p-values): control Type I error at any stopping time. Enable stopping early for large effects or futility. In production this breaks as: team peeks at fixed-horizon test on day 3 of a 14-day run and ships at p=0.04; actual false positive rate is ~20% due to optional stopping.", whatsTested: 'Whether you know sequential testing allows valid continuous monitoring without inflating the false positive rate.', antiPattern: 'Fixed-horizon testing is the comparison — sequential testing specifically solves the peeking problem that fixed-horizon cannot.', staffFraming: 'Sequential testing with mSPRT or alpha-spending: peek anytime, Type I error stays controlled. Fixed-horizon: looking early inflates it.' },
  { id: 'C32', domain: 'Experiment Design', type: 'mcq',
    q: 'Novelty effect in A/B tests leads to:',
    options: ['Underestimating treatment effect', 'Overestimating treatment effect in early experiment windows', 'Increased variance in outcomes', 'Selection bias in assignment'],
    correct: 1,
    explanation: "Users engage more with new features due to novelty. Early treatment effect appears large; decays over time. Counter: holdback groups, longer experiment windows, analyze by user tenure. Production tell: D7 experiment shows +12% engagement; 90-day holdback settles at +2%, revealing the original decision was driven by novelty, not durable value.", whatsTested: 'Whether you know novelty effect causes inflated early metrics that decay to a lower steady-state.', antiPattern: 'Regression to the mean is a different concept — novelty effect is about behavioural change when something is new.', staffFraming: 'Novelty: users engage more with anything new. A/B shows +8%, 90-day holdback shows +1%. Always run for 2+ weeks.' },
  // SQL & Data
  { id: 'C33', domain: 'SQL & Data', type: 'mcq',
    q: 'For a slowly changing dimension (SCD Type 2), the correct approach is:',
    options: ['Overwrite the existing row', 'Add a version column and update in place', 'Insert a new row with effective_date and expiry_date, mark old row expired', 'Delete and recreate the row'],
    correct: 2,
    explanation: "SCD Type 2 preserves history. Each change creates a new row with date range. Enables point-in-time queries. In production this breaks as: training pipeline joins on current dimension record instead of point-in-time; model learns from future attribute values (e.g., tier assigned after the event) causing label leakage and inflated offline metrics.", whatsTested: 'Whether you know SCD Type 2 creates new rows with validity dates rather than overwriting history.', antiPattern: 'Overwriting old values (SCD Type 1) is the most common wrong answer — it loses all historical data.', staffFraming: 'SCD Type 2: insert new row with start_date, set end_date on old row. Preserves full history for point-in-time feature joins.' },
  { id: 'C34', domain: 'SQL & Data', type: 'mcq',
    q: 'EXPLAIN ANALYZE in PostgreSQL shows:',
    options: ['Table schema and indexes', 'Actual execution plan with row counts and timing at each step', 'Query syntax errors', 'Lock contention information'],
    correct: 1,
    explanation: "EXPLAIN ANALYZE executes the query and shows actual vs. estimated row counts, execution time per node. Critical for identifying sequential scans, bad estimates, and hash join spills. Production tell: a query degrades from 2s to 45s after a table grows 10x; EXPLAIN ANALYZE reveals the planner switched from index scan to sequential scan due to stale statistics.", whatsTested: 'Whether you know EXPLAIN ANALYZE runs the query and shows the actual execution plan with real timing.', antiPattern: 'EXPLAIN without ANALYZE only shows the estimated plan — it does not actually execute the query.', staffFraming: 'EXPLAIN ANALYZE is the diagnostic tool: it shows where the optimizer\'s row count estimates diverged from reality.' },
  { id: 'C35', domain: 'SQL & Data', type: 'mcq',
    q: 'Partitioning a large table by date primarily improves:',
    options: ['Write performance', 'Query performance for date-range filters via partition pruning', 'Storage compression', 'JOIN performance'],
    correct: 1,
    explanation: "Partition pruning: queries with WHERE date BETWEEN x AND y only scan relevant partitions. For a 5-year table queried by month, pruning reduces scan by 60x. In production this breaks as: analyst wraps the date column in a function (DATE_TRUNC('month', ts) = '2024-01-01'); the planner cannot prune partitions and scans the full 5-year table.", whatsTested: 'Whether you know date partitioning improves performance through partition pruning — scanning only relevant partitions.', antiPattern: 'Index performance is different — partitioning eliminates entire partition scans, not just individual row lookups.', staffFraming: 'Partition pruning: a WHERE date > yesterday query scans 1 partition not 3 years. Dramatic improvement for time-range queries.' },
  { id: 'C36', domain: 'SQL & Data', type: 'mcq',
    q: 'Window function LEAD() is used to:',
    options: ['Access the previous row\'s value', 'Access a subsequent row\'s value within the window', 'Rank rows within a partition', 'Compute cumulative aggregates'],
    correct: 1,
    explanation: "LEAD(col, n) returns value n rows ahead. LAG(col, n) returns n rows behind. Useful for: time-to-next-event, day-over-day change, next purchase date. In production this breaks as: LAG applied after a WHERE filter skips rows; the 'previous' value is actually 3 days ago rather than 1, silently corrupting day-over-day feature calculations.", whatsTested: 'Whether you know LEAD() accesses the value in a subsequent row within the same partition.', antiPattern: 'LAG() is the common confusion — it accesses the PREVIOUS row. LEAD goes forward, LAG goes back.', staffFraming: 'LEAD(col, 1) = next row value. LAG(col, 1) = previous row value. Common use: time-between-events calculations.' },
  // Optimization
  { id: 'C37', domain: 'Optimization', type: 'mcq',
    q: 'Weight decay in neural network training is equivalent to:',
    options: ['Dropout regularization', 'L2 regularization on model parameters', 'Gradient clipping', 'Learning rate decay'],
    correct: 1,
    explanation: "Weight decay: subtract λ·w from weights each step. Equivalent to L2 penalty λ‖w‖² in the loss. Penalizes large weights, encourages simpler models. In production this breaks as: decoupled weight decay (AdamW) omits decay from adaptive scaling; using Adam+L2 instead applies decay inconsistently and leads to over-regularization on sparse embedding parameters.", whatsTested: 'Whether you know weight decay is mathematically equivalent to L2 regularisation on the weights.', antiPattern: 'Learning rate decay sounds similar but is a completely different mechanism — one regularises weights, the other adjusts step size.', staffFraming: 'Weight decay = L2 regularisation. Adds lambda * norm(w)^2 to the loss, shrinking weights toward zero each update.' },
  { id: 'C38', domain: 'Optimization', type: 'mcq',
    q: 'Cosine learning rate schedule with warmup is preferred for transformer training because:',
    options: ['It converges in fewer steps', 'It prevents learning rate from going to zero too quickly', 'Warmup stabilizes early training, cosine provides smooth decay matching transformer optimization dynamics', 'It automatically adapts to gradient magnitude'],
    correct: 2,
    explanation: "Transformers: random init → noisy gradients → high LR causes divergence. Warmup: linear increase for ~4% of steps. Cosine decay: smooth reduction to near-zero, better than step decay. In production this breaks as: fine-tuning a pretrained model without warmup causes loss spike in the first 100 steps and the run diverges, wasting GPU hours.", whatsTested: 'Whether you know cosine LR with warmup prevents instability when transformer weights are randomly initialised.', antiPattern: 'Warm restarts sound beneficial but the primary reason is warmup — random initial weights need slow stable early updates.', staffFraming: 'Warmup: tiny LR increasing to target over first N steps. Cosine decay: smooth LR reduction. Together they prevent early divergence.' },
  { id: 'C39', domain: 'Optimization', type: 'mcq',
    q: 'Which optimizer is most commonly used in production-scale recommendation system training?',
    options: ['Vanilla SGD', 'AdaGrad for sparse features, Adam for dense parameters (mixed)', 'Adam uniformly across all parameter types, including sparse embeddings', 'RMSProp only'],
    correct: 1,
    explanation: "Rec systems have sparse embeddings: AdaGrad/Adafactor adapts per-coordinate LR (rarely-updated embeddings get larger updates). Dense layers use Adam. This split is standard (Google, Meta). In production this breaks as: applying Adam uniformly to sparse embeddings causes popular items to dominate updates; rare-item embeddings never converge and cold-start recall drops 30%.", whatsTested: 'Whether you know Adagrad and Adam dominate large-scale recommendation due to sparse gradient handling from embedding tables.', antiPattern: 'SGD with momentum is right for CV but wrong here — it does not handle sparse gradients from embedding tables well.', staffFraming: 'Recommendation: sparse embedding updates. Adagrad/Adam handle per-parameter statistics for sparsity. SGD updates all params uniformly.' },
  { id: 'C40', domain: 'Optimization', type: 'mcq',
    q: "What does the loss landscape's sharpness predict about a trained model?",
    options: ['Training speed', 'Memory usage', 'Generalization — flatter minima generalize better', 'Inference latency'],
    correct: 2,
    explanation: "Sharp minima: high curvature, small perturbations cause large loss increase → poor generalization. Flat minima: robust to weight perturbation → generalizes better. SAM explicitly seeks flat minima. Production tell: train loss and val loss converge closely in training but model underperforms by 3-4 points on a new domain — a sign of a sharp minimum that does not generalize.", whatsTested: 'Whether you know RFE applied before cross-validation leaks validation labels into the feature selector.', antiPattern: 'Applying RFE inside the CV loop sounds complex but is the only correct way — selector must not see validation fold data.', staffFraming: 'RFE selection leakage: selector sees which features predict the validation target. Always nest feature selection inside the CV loop.' },
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
    explanation: "Performing RFE on the full dataset before CV means the feature selector has seen the validation folds' labels, a form of selection leakage. Always nest RFE inside the CV loop. Production tell: nested CV AUC is 4-6 points lower than the leaky estimate; the model ships with features that only appeared important due to overfitting.",
  },
  {
    id: 32, domain: 'Feature Engineering',
    q: 'A log-transformed feature has skewness of 0.1 post-transform but the raw feature had skewness of 4.2. For a linear model, why does this matter?',
    options: [
      'Log transform only matters for tree-based models',
      'High skewness violates linearity assumptions and makes gradient descent unstable due to scale differences',
      'Tree-based models are equally sensitive to feature skewness and require the same log-transform treatment',
      'Linear models require all features to be log-normal',
    ],
    correct: 1,
    explanation: "Linear models assume roughly Gaussian residuals and are sensitive to outliers; heavy right-skew creates extreme values that disproportionately influence gradient updates and coefficient estimation. Production tell: a single whale transaction with revenue 1000x median drives the regression coefficient; removing one user changes the model prediction for all users by 20%.",
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
    explanation: "NULL here is structurally meaningful (user has no purchase history), not missing at random. A sentinel + indicator lets the model learn a separate effect for new users vs. lapsed users with large gaps. In production this breaks as: mean imputation collapses new users and 365-day-lapsed users into the same bucket; churn model assigns wrong risk scores to both groups.",
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
    explanation: "ECE bins predictions by confidence, then computes a weighted average of |accuracy - confidence| per bin. A perfectly calibrated model's 0.7 probability means 70% of those predictions are correct. In production this breaks as: model outputs 0.9 confidence on fraud decisions triggering automatic block; actual precision is 0.6 due to miscalibration, generating 50% more false fraud blocks.",
  },
  {
    id: 35, domain: 'Model Evaluation',
    q: 'Platt scaling and isotonic regression are both post-hoc calibration methods. When should you prefer isotonic regression?',
    options: [
      'Always — isotonic regression is strictly better',
      'When the model is already well-calibrated and you want a lightweight fine-tuning step',
      'When the calibration curve is strongly non-monotonic and you have sufficient held-out data',
      'When the model is a logistic regression',
    ],
    correct: 2,
    explanation: "Platt scaling fits a parametric sigmoid — fast but assumes a monotone miscalibration pattern. Isotonic regression is non-parametric and flexible, but prone to overfitting on small calibration sets. If the model is already well-calibrated, neither method adds value and isotonic regression would actively overfit calibration-set noise. Production tell: isotonic regression ECE is 0.01 on the calibration set but 0.08 on new data — the calibration set was too small and isotonic overfit to its noise.",
  },
  {
    id: 36, domain: 'Model Evaluation',
    q: 'Your model achieves 0.82 AUC-ROC in offline evaluation. After deployment, business CTR only improves 0.3% vs. expected 2%. The most likely explanation is:',
    options: [
      'AUC-ROC is a poor metric for ranking models',
      'Offline evaluation uses logged data that doesn\'t reflect counterfactual user responses to new rankings',
      'The AUC threshold was not tuned to the operating point matching the production decision boundary',
      'CTR is a lagging indicator that takes months to stabilize',
    ],
    correct: 1,
    explanation: "Offline metrics on logged data suffer from position bias and selection bias — users only interact with what was shown. Online gains depend on actual user response to new orderings, which offline data can't capture. Threshold tuning matters for precision/recall but not for the AUC-vs-CTR gap — threshold selection would shift the operating point on the ROC curve but would not explain a discrepancy between offline ranking quality and online user response. Production tell: new ranker shows +8% offline NDCG but 0% online CTR lift — the offline gain was measuring re-ranking of items users had already been shown under the old policy.",
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
    explanation: "Schema registries (e.g., Confluent) enforce compatibility rules. Forward compatibility means new writers, old readers — deploy consumers first, then producers, to avoid deserialization failures. In production this breaks as: producer deployed before consumer during a schema migration; downstream Flink job throws deserialization exceptions and the feature pipeline stalls for 2 hours.",
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
    explanation: "Online feature stores precompute batch features into key-value stores optimized for microsecond point lookups. On-the-fly computation cannot meet single-digit millisecond SLAs for complex features. In production this breaks as: team computes user_90d_spend at serving time via a SQL query; p99 latency jumps from 8ms to 340ms under traffic and the SLA is breached.",
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
    explanation: "ONNX tracing captures operations on a specific input; dynamic Python control flow (data-dependent branching, variable-length loops) is not captured. Use torch.jit.script or rewrite with torch.where for static graphs. Production tell: ONNX model produces correct results on the trace input but wrong results on inputs that trigger a different code branch — silent correctness failure.",
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
    explanation: "The t-test assumes normality of the sampling distribution of the mean. For non-standard statistics like median, Gini, or AUC, bootstrapping empirically estimates the sampling distribution without parametric assumptions. Production tell: t-test on median session duration returns p=0.12 (not significant); bootstrap CI excludes 0, correctly detecting the effect that a parametric test missed.",
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
    explanation: "P-values are not posterior probabilities of hypotheses. They measure how surprising the data is under H0. Small p-value → data is unlikely under H0 → reject H0. This says nothing about practical significance. Production tell: p=0.03 is declared a win and the feature ships; the observed effect size is 0.1% revenue — below the cost of the engineering work required to maintain it.",
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
    explanation: "Bayesian decision theory uses expected loss, not just posterior probability. If B is 4% likely to be worse but the downside is catastrophic (e.g., revenue loss), expected loss may exceed your risk tolerance even at 96% confidence. Production tell: team ships a pricing algorithm with 95% P(lift) but no expected loss analysis; the 5% downside scenario materializes and causes a $2M revenue event.",
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
    explanation: "Autoregressive decoding recomputes K,V for all past tokens each step without a cache — O(n²) total. KV cache stores these projections, making each new token O(n) attention instead of O(n²) recomputation. In production this breaks as: serving a 70B model without KV cache makes 1000-token generation 100x slower than necessary; with KV cache, each decode step is constant-time in the attention layer.",
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
    explanation: "Standard backprop stores all forward activations for gradient computation, consuming O(layers) memory. Checkpointing stores only checkpoint activations and recomputes intermediate values during backward, reducing memory at the cost of ~33% extra compute. Production tell: 32-layer model training OOMs at batch size 16; enabling activation checkpointing fits batch size 48 with the same GPU, improving throughput despite extra compute.",
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
    explanation: "Each attention head computes QKᵀ which is (L × d_k) × (d_k × L) = O(L² × d_k). Across all heads: O(L² × d_model). This quadratic scaling in L is why long-context transformers need sparse/linear attention variants. In production this breaks as: doubling context length from 4k to 8k quadruples attention memory; a model that fit in 40GB GPU at 4k context OOMs at 8k without sparse attention.",
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
    explanation: "SRM (detected via chi-square test on group sizes) invalidates the experiment's randomization. Common causes: bots, cache hits, logging bugs, or inconsistent assignment logic. Always check SRM before analyzing results. Production tell: treatment group is 52% of traffic instead of 50%; investigation reveals a CDN cache was serving control responses to treatment users, completely invalidating the experiment.",
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
    explanation: "The Staging stage gates models through champion-challenger evaluation, integration validation, and latency checks before serving live traffic. This mirrors software release pipelines and enables rollback. In production this breaks as: model passes offline champion-challenger test but fails integration validation due to a feature schema version mismatch — caught in staging before any user impact.",
  },
  {
    id: 48, domain: 'MLOps',
    q: 'A model serving endpoint shows increasing p99 latency over 48 hours without code changes. What is the most likely cause?',
    options: [
      'The model weights have corrupted',
      'Memory leak or cache saturation from growing request volume, or feature store key space growth slowing lookups',
      'Upstream feature store TTL expired, causing all lookups to bypass local cache and hit cold storage',
      'The model is retraining in the background',
    ],
    correct: 1,
    explanation: "Gradual latency increase without code changes typically indicates resource exhaustion: memory leaks, growing in-process caches, or degrading external dependencies (feature store, DB). Profile memory/GC and downstream service latencies. Production tell: serving p99 creeps from 80ms to 300ms over 48 hours; heap profiling reveals unbounded in-process LRU cache growth as new user IDs are encountered.",
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
    explanation: "Users are less likely to examine lower positions — clicks at rank 10 are sparse not because the item is irrelevant, but because it wasn't seen. IPS or regression-EM debiasing is needed for unbiased learning from clicks. Production tell: model trained on raw click logs perpetually depresses rank-10+ items; A/B with IPS-corrected training shows +12% engagement on previously buried relevant content.",
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
    explanation: "For normalized vectors, MIPS ≡ NNS (cosine = dot product). For unnormalized embeddings, high dot product can come from large norms rather than directional alignment, requiring MIPS-specific algorithms (e.g., ScaNN, FAISS with inner product index). Production tell: retrieval system using cosine ANN on unnormalized embeddings returns popular high-norm items for every query regardless of semantic relevance — norms dominate direction.",
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
    explanation: "The separation enables ANN search: precompute and index all item embeddings offline. At serving time, compute only the user embedding online, then retrieve top-K items via ANN — O(log N) vs. O(N) cross-encoder scoring. In production this breaks as: item embeddings are refreshed daily but user embedding uses real-time signals; stale item embeddings miss newly trending content and recommendation quality degrades by end-of-day.",
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
    explanation: "SUTVA requires that one unit's treatment doesn't affect another's outcome. In marketplaces, treating drivers differently affects riders in the same market. Use cluster/geo randomization or switchback designs. In production this breaks as: driver-level randomization on a surge pricing test shows +12% revenue; geo-level randomization reveals true lift is +3% after eliminating supply-side spillover.",
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
    explanation: "Revenue lift could come from more orders (volume) or higher AOV (quality). Decomposition tells you mechanism — e.g., if AOV drops while orders rise, you're acquiring lower-value customers, which changes the ship decision. Production tell: experiment shows +5% revenue but decomposition shows -15% AOV and +20% orders; shipping this feature changes the customer mix in ways that harm LTV.",
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
    explanation: "Sample size for a given power scales as 1/MDE². Halving MDE (detecting a smaller effect) requires 4x more samples to maintain the same power. In production this breaks as: team requests an experiment to detect 0.1% revenue lift on a metric with high variance; the required sample size is 6 months of traffic — the experiment is not feasible and should be redesigned.",
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
    explanation: "Index selectivity = distinct values / total rows. For a boolean column (2 distinct values on 100M rows), each lookup still fetches ~50% of the table via scattered I/O — worse than a sequential scan. Production tell: DBA adds index on is_active column hoping to speed up queries; query time actually increases 3x because random I/O on 50M rows is slower than one sequential scan.",
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
    explanation: "SQL logical order: FROM → WHERE → window functions → SELECT. WHERE runs first, so LAG/LEAD only see rows that pass the WHERE clause. To lag over unfiltered data, use a subquery or CTE to apply the window before filtering. Production tell: day-over-day feature has unexpected NULLs in the training data; the WHERE on event_type filtered out intermediate rows that were the 'previous' events.",
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
    explanation: "If many rows in table A match many rows in table B on the join key, the result set is multiplicative. 10M × 100M = 1B worst case. Deduplicate keys before joining or use aggregation first. Production tell: a pipeline that ran in 10 minutes starts running for 6 hours after a schema change introduced duplicate user_ids in a dimension table.",
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
    explanation: "SGDR (Loshchilov & Hutter 2017): LR follows cosine decay then resets. Restarts act as perturbations that escape sharp minima; snapshots at each restart's end can be ensembled. Production tell: standard cosine decay stalls at val loss 0.42 after epoch 20; adding warm restarts allows escape to a flatter basin, improving val loss to 0.38 without any other change.",
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
    explanation: "FP16 minimum positive value is ~6e-8; many gradients are smaller and flush to zero. Loss scaling multiplies the loss by a large constant (e.g., 2^15) before backward, shifting gradient magnitudes into FP16 range, then unscaled before the optimizer step. Production tell: mixed precision training with no loss scaling causes loss to plateau early; enabling dynamic loss scaling resumes convergence and reduces training time 40%.",
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
    explanation: "AdaGrad accumulates all squared gradients from the start — denominator grows monotonically → effective LR → 0. RMSProp/AdaDelta use an EMA so only recent gradient history influences the adaptive rate. In production this breaks as: AdaGrad used for a long fine-tuning run; LR decays to near-zero by step 5000 and the model stops learning despite more data being available.",
  },
  { id: 'C41', domain: 'Feature Engineering', type: 'mcq',
    q: 'You detect that embedding vectors for a categorical feature are drifting over time in production. What is the most principled first diagnostic step?',
    options: ['Retrain the model immediately', 'Compute cosine similarity between rolling weekly centroids of each category\'s embedding and flag categories whose centroid drift exceeds a threshold', 'Increase embedding dimension to capture more distributional complexity', 'Apply Platt scaling to recalibrate the downstream model\'s outputs to recent data'],
    correct: 1,
    explanation: "Embedding drift can be caught by tracking per-category centroid movement via cosine similarity over time windows. Sudden drops signal distributional shift or data pipeline issues before model performance degrades. Increasing embedding dimension does not address drift — it increases capacity but does not diagnose or fix the root cause. Platt scaling recalibrates prediction probabilities, not embedding representations, and does not address the underlying input drift. Production tell: cosine similarity of item embedding centroids drops from 0.95 to 0.60 overnight; investigation reveals a data pipeline bug that zeroed out a batch of item features.", whatsTested: 'Whether you know embedding drift signals the categorical feature\'s semantics have changed in production.', antiPattern: 'Recomputing embeddings from scratch sounds thorough but misses the diagnosis step — first understand WHY they drifted.', staffFraming: 'Embedding drift = the feature meaning shifted. Investigate upstream data changes before retraining. The drift is the signal.' },
  { id: 'C42', domain: 'Feature Engineering', type: 'mcq',
    q: 'Feature hashing maps high-cardinality categoricals to a fixed-size vector. The primary tradeoff vs. learned embeddings is:',
    options: ['Hashing is slower at inference', 'Hashing eliminates the need for a vocabulary but introduces collision-based noise that conflates unrelated categories', 'Hashing always outperforms embeddings on cold-start', 'Hashing requires more memory'],
    correct: 1,
    explanation: "Feature hashing is O(1) lookup with no vocabulary — ideal for streaming and cold-start features. The cost is hash collisions: distinct categories map to the same bucket, injecting noise that hurts precision. In production this breaks as: hash space set to 2^10=1024 for 50k categories; collision rate is ~95%, effectively destroying the feature signal and degrading model AUC by 8 points.", whatsTested: 'Whether you know feature hashing\'s primary tradeoff is hash collisions — unrelated categories mapping to the same bucket.', antiPattern: 'Memory reduction is the benefit not the tradeoff. The question asks for tradeoff — that is always collisions.', staffFraming: 'At 10K categories with 2^13 hash buckets: ~55% collision rate. "cat" and "car" may hash identically, corrupting the signal.' },
  { id: 'C43', domain: 'Feature Engineering', type: 'mcq',
    q: 'Which strategy best mitigates training-serving skew when a feature is computed differently in batch training vs. real-time serving?',
    options: ['Use separate feature pipelines and reconcile offline', 'Store precomputed training features in a feature store and reuse the same feature logic for online serving via a shared feature computation layer', 'Normalize all features to [0,1] in both environments', 'Drop the feature from the serving pipeline'],
    correct: 1,
    explanation: "A feature store with unified feature definitions ensures the same transformation code runs offline and online, eliminating logic divergence. Separate pipelines almost always diverge over time. Production tell: offline pipeline normalizes by global mean but online pipeline normalizes by a 7-day rolling mean; the skew is invisible until serving predictions drop 10 points on new users.", whatsTested: 'Whether you know a unified feature computation function for both training and serving is the only real fix for skew.', antiPattern: 'Separate documentation and code reviews are process fixes — two codepaths will inevitably diverge over time.', staffFraming: 'One function, two contexts: same Python transform in Spark (offline) and Flink/serving (online). Two codepaths = skew by default.' },
  { id: 'C44', domain: 'Feature Engineering', type: 'mcq',
    q: 'Monotonic encoding of an ordinal variable (e.g., education level: none=0, high school=1, college=2, graduate=3) is preferable to one-hot encoding when:',
    options: ['The variable has more than 10 levels', 'The model is a tree ensemble that can exploit ordinal structure with fewer splits', 'The variable is the target', 'The data has missing values'],
    correct: 1,
    explanation: "Tree models find monotonic ordinal splits naturally with a single numeric feature; one-hot forces the tree to learn the ordering implicitly using multiple binary features, wasting splits and increasing variance. Production tell: ordinal feature one-hot encoded to 10 binary columns; feature importance shows all 10 columns near-zero, hiding the fact that the underlying ordinal signal is predictive.", whatsTested: 'Whether you know ordinal encoding preserves the meaningful ordering that one-hot encoding destroys.', antiPattern: 'One-hot encoding is the instinctive answer for categorical variables but destroys the ordinal relationship entirely.', staffFraming: 'Ordinal: education level has a natural order. Encoding as 0,1,2,3 preserves it. One-hot loses ordering and adds unnecessary dimensions.' },
  { id: 'C45', domain: 'Feature Engineering', type: 'mcq',
    q: 'A time-series window feature computed as "average spend over last 30 days" leaks if:',
    options: ['The window is too short', 'The window is computed using the label timestamp instead of the event timestamp, including future data', 'The currency is not normalized', 'The feature has high variance'],
    correct: 1,
    explanation: "Point-in-time correctness requires the window boundary to be anchored to the event timestamp, not the label timestamp. Using the label timestamp includes future observations, creating look-ahead leakage. Production tell: offline AUC 0.91 but online AUC 0.73; investigation shows the 30-day aggregation window included events that happened after the prediction would have been made.", whatsTested: 'Whether you know a rolling window leaks if it includes data from after the label timestamp.', antiPattern: 'Rolling windows using all available data feel more accurate but include future information relative to the prediction time.', staffFraming: 'Point-in-time correctness: the 30-day window must be computed as of the label date, not the training date. Off-by-one bugs are common.' },
  { id: 'C46', domain: 'Feature Engineering', type: 'mcq',
    q: 'When should you prefer quantile binning over equal-width binning for a continuous feature?',
    options: ['When the feature is normally distributed', 'When the feature has heavy tails or outliers, since quantile bins produce equal-density buckets robust to skew', 'When the model is a neural network', 'When the feature is already standardized'],
    correct: 1,
    explanation: "Equal-width bins concentrate most data in a few buckets under skewed distributions. Quantile binning guarantees each bin has the same proportion of samples, preserving information across the full distribution. In production this breaks as: equal-width bins on income data put 90% of users into bucket 1; the model essentially ignores income as a feature because all variation collapses into one bin.", whatsTested: 'Whether you know quantile binning is preferred for skewed distributions where equal-width bins would be mostly empty.', antiPattern: 'Equal-width binning is the default intuition but creates mostly empty bins for skewed distributions.', staffFraming: 'Quantile binning: each bin has equal count. Equal-width: each bin has equal range. Skewed data → quantile. Uniform data → either.' },
  { id: 'C47', domain: 'Model Evaluation', type: 'mcq',
    q: 'Expected Calibration Error (ECE) measures:',
    options: ['The AUC of the precision-recall curve', 'The average absolute difference between predicted confidence and actual accuracy within probability bins', 'The variance of predicted probabilities', 'The Brier score decomposition'],
    correct: 1,
    explanation: "ECE partitions predictions into M bins by confidence, computes |accuracy - confidence| per bin weighted by bin size, and averages. A perfectly calibrated model has ECE = 0. Production tell: model reports ECE = 0.02 on validation but ECE = 0.18 on production traffic; the validation set lacked the tail distributions that appear in production queries.", whatsTested: 'Whether you know ECE measures calibration — the gap between predicted probability and actual positive rate.', antiPattern: 'AUC measures discrimination (ranking quality), not calibration. ECE measures a completely different model property.', staffFraming: 'ECE: bin predictions by confidence, compare predicted vs actual rate per bin. Well-calibrated model bins lie on the diagonal.' },
  { id: 'C48', domain: 'Model Evaluation', type: 'mcq',
    q: 'You tune a classification threshold to maximize F1 on a held-out validation set. What is the correct methodology to report final performance?',
    options: ['Report F1 on the same validation set used for tuning', 'Report F1 on a separate test set never seen during threshold selection', 'Report F1 averaged across all thresholds', 'Re-tune the threshold on the test set and report that F1 — since test data is larger than validation, the estimate is more stable'],
    correct: 1,
    explanation: "Threshold tuning on validation data is a form of optimization that can overfit to that split. The true generalization estimate requires a held-out test set where no decision was made. Re-tuning on the test set is the same error compounded — you have now used test data for optimization and the reported F1 is as optimistic as if you had never split the data at all. Production tell: precision/recall at chosen threshold degrades by 15 points on the first week of live traffic — the threshold was tuned to validation noise rather than signal.", whatsTested: 'Whether you know threshold tuning on validation creates optimistic estimates — the threshold overfits to the validation distribution.', antiPattern: 'Using the same threshold at deployment feels consistent but ignores that the tuned threshold overfit to validation.', staffFraming: 'Threshold is a hyperparameter. Tune on validation, evaluate calibration on a separate held-out test set, deploy with test-set confirmation.' },
  { id: 'C49', domain: 'Model Evaluation', type: 'mcq',
    q: 'The disagreement between macro-F1 and micro-F1 on a multi-class problem most likely indicates:',
    options: ['The model is overfitting to the training distribution', 'Significant class imbalance — micro-F1 is dominated by frequent classes, macro-F1 weights all classes equally', 'Weighted-F1 should be used instead to give a definitive single number', 'The threshold was not tuned per-class'],
    correct: 1,
    explanation: "Micro-F1 aggregates TP/FP/FN globally before computing F1, so large classes dominate. Macro-F1 computes per-class F1 and averages. A large gap reveals the model performs differently across class sizes — it is not resolved by switching to weighted-F1 (which just weights by support, similar to micro-F1) or per-class thresholding (which changes precision/recall tradeoffs but not the structural imbalance). Production tell: micro-F1 = 0.92 looks great; macro-F1 = 0.61 reveals the model ignores 3 minority classes entirely, which are exactly the edge cases the business cares most about.", whatsTested: 'Whether you know macro-F1 vs micro-F1 discrepancy signals class imbalance or rare classes with poor performance.', antiPattern: 'Calibration is a different model property — it measures probability accuracy, not the macro/micro F1 gap.', staffFraming: 'Micro-F1: dominated by common classes. Macro-F1: each class contributes equally. Large gap = model fails on rare classes.' },
  { id: 'C50', domain: 'Model Evaluation', type: 'mcq',
    q: 'Offline NDCG is high but online CTR drops after deployment. The most likely explanation is:',
    options: ['The model overfit to training data', 'Offline labels (clicks from historical logs) reflect selection bias from the prior ranker, not true user relevance', 'NDCG is the wrong metric for ranking', 'The serving infrastructure is slow'],
    correct: 1,
    explanation: "Logs collected under a prior ranker are not IID samples — items that were never ranked high were never clicked. The offline metric is optimistic because it only evaluates relevance on items the old ranker selected. In production this breaks as: new ranker with +6% offline NDCG shows 0% online lift; the offline gain came from re-scoring items that were already being shown, not from surfacing better items.", whatsTested: 'Whether you know offline-online discrepancy often signals position bias in the click data used for offline eval.', antiPattern: 'Model underfitting sounds plausible but if offline NDCG is high the model fits the training signal well.', staffFraming: 'Click data reflects what the old ranker showed. Offline NDCG measures performance on biased samples. Online measures real user preference.' },
  { id: 'C51', domain: 'Model Evaluation', type: 'mcq',
    q: 'Platt scaling calibrates a classifier\'s scores by:',
    options: ['Retraining the last layer with a smaller learning rate on the calibration set', 'Fitting a logistic regression on the model\'s raw scores using a held-out calibration set', 'Applying temperature scaling to logits', 'Normalizing scores to sum to 1'],
    correct: 1,
    explanation: "Platt scaling learns two parameters (A, B) by fitting sigmoid(A·score + B) to calibration labels. It is cheap, post-hoc, and effective for SVMs and GBTs whose raw outputs are not well-calibrated probabilities. Retraining the last layer is a valid fine-tuning technique but is not calibration — it changes the model's predictions, not just their probability mapping. Temperature scaling (dividing logits by T) is a different one-parameter calibration method used primarily for neural network softmax outputs. Production tell: GBT model outputs raw leaf scores used directly as fraud probabilities; downstream threshold at 0.5 catches only 20% of fraud — Platt scaling would have mapped scores to true probabilities.", whatsTested: 'Whether you know Platt scaling fits a logistic regression on raw model scores to produce calibrated probabilities.', antiPattern: 'Isotonic regression is the alternative — non-parametric and more flexible but requires more data to avoid overfitting.', staffFraming: 'Platt scaling: logistic on scores. Isotonic: stepwise monotone function. Platt for small datasets, isotonic for large.' },
  { id: 'C52', domain: 'ML Systems', type: 'mcq',
    q: 'Schema-on-read vs. schema-on-write in a feature serving context: which is safer for production ML?',
    options: ['Schema-on-read, because it is more flexible', 'Schema-on-write, because feature types and shapes are validated at write time, catching pipeline errors before they corrupt serving', 'They are equivalent in production', 'Schema-on-read is safer because it defers validation'],
    correct: 1,
    explanation: "Schema-on-write enforces types, nullability, and ranges when features are written to the store, failing fast at pipeline time. Schema-on-read defers validation until serving, letting corrupt data reach inference silently. In production this breaks as: an upstream table adds a NULL to a previously non-null column; schema-on-read allows it through and the model receives NaN at serving, producing garbage predictions for 6 hours before detection.", whatsTested: 'Whether you know schema-on-write catches errors at ingest time, preventing serving failures at runtime.', antiPattern: 'Schema-on-read sounds more flexible but in feature serving, discovering schema errors at inference time causes failures.', staffFraming: 'Schema-on-write: validate at write. Schema-on-read: validate at query. For serving, write-time validation prevents runtime failures.' },
  { id: 'C53', domain: 'ML Systems', type: 'mcq',
    q: 'Two-tower retrieval models are preferred over cross-encoder models for candidate retrieval because:',
    options: ['Two-tower models have higher MRR', 'Two-tower models precompute item embeddings offline enabling sub-millisecond ANN search; cross-encoders require full item-query interaction at query time making them too slow at scale', 'Two-tower models are easier to train', 'Cross-encoders cannot handle cold start'],
    correct: 1,
    explanation: "Cross-encoders jointly encode query+item (full attention), producing accurate scores but requiring inference per candidate — infeasible for millions of items. Two-tower separates encoders, precomputes item side, and uses ANN for retrieval. Production tell: cross-encoder p99 latency is 8 seconds on a 10k candidate set; two-tower + ANN retrieves top-100 in 12ms, making real-time serving feasible.", whatsTested: 'Whether you know bi-encoders are used for retrieval because they precompute item embeddings offline — cross-encoders cannot.', antiPattern: 'Cross-encoders give better quality but require computing query+document jointly at serving time — impossible at retrieval scale.', staffFraming: 'Bi-encoder: precompute item embeddings offline. Cross-encoder: query+item together, better quality, cannot precompute. Two-stage = both.' },
  { id: 'C54', domain: 'ML Systems', type: 'mcq',
    q: 'A streaming feature pipeline using Kafka + Flink must guarantee exactly-once semantics. The key mechanism is:',
    options: ['At-least-once delivery with deduplication downstream', 'Flink checkpointing with Kafka transactional producer: checkpoint state to durable storage, commit Kafka offsets atomically inside the checkpoint', 'Idempotent consumers only', 'Increasing Kafka replication factor'],
    correct: 1,
    explanation: "Exactly-once in Flink requires (1) periodic checkpoints persisting operator state and Kafka offsets atomically, and (2) Kafka transactional producer so output is committed only when the checkpoint succeeds. In production this breaks as: checkpointing enabled but Kafka producer is not transactional; a job restart replays the last checkpoint interval and duplicates feature aggregations, corrupting downstream counts.", whatsTested: 'Whether you know exactly-once in Kafka+Flink requires idempotent writes and transactional producers.', antiPattern: 'At-least-once with deduplication is a common alternative but does not guarantee exactly-once if dedup logic has gaps.', staffFraming: 'Exactly-once: transactional producer + offset commits in the same transaction. Complex but necessary for financial or fraud features.' },
  { id: 'C55', domain: 'ML Systems', type: 'mcq',
    q: 'In a low-latency feature store, what is the typical reason to maintain both an online store (Redis) and an offline store (Parquet/Hive)?',
    options: ['Cost — Redis is expensive for all data', 'Online store serves fresh features at <10ms for inference; offline store provides historical point-in-time correct features for training at scale', 'They store different features', 'Redundancy for disaster recovery'],
    correct: 1,
    explanation: "Redis is optimized for single-key lookups at millisecond latency but is not suited for full dataset scans during training. The offline store enables efficient bulk reads for training while the online store handles serving. Production tell: training job issues 50M Redis GET calls sequentially; it takes 14 hours and hammers the Redis cluster, causing latency spikes for the real-time serving path.", whatsTested: 'Whether you know the dual store exists because batch features cannot meet sub-millisecond serving latency requirements.', antiPattern: 'Cost reduction is secondary — the primary reason is that different features have fundamentally different freshness requirements.', staffFraming: 'Online store: sub-ms lookup of pre-computed features. Offline store: training data generation. Dual store = different freshness SLAs.' },
  { id: 'C56', domain: 'ML Systems', type: 'mcq',
    q: 'Model versioning in a prediction service should include which artifact to enable full reproducibility?',
    options: ['Only the model weights file', 'Model weights, preprocessing pipeline, feature schema, training data version reference, and hyperparameters', 'Model weights and hyperparameters only', 'Only the Docker image'],
    correct: 1,
    explanation: "Reproducibility requires the full artifact graph: weights define the function, preprocessing defines input transformation, feature schema defines expected inputs, and data version reference pins what the model learned from. In production this breaks as: weights are versioned but the preprocessing scaler is not; a rollback restores old weights but uses the new scaler, causing systematic prediction errors that take days to diagnose.", whatsTested: 'Whether you know model versioning must include the training dataset reference to enable full reproducibility.', antiPattern: 'Model weights alone are insufficient — without knowing what data trained the model you cannot reproduce or audit it.', staffFraming: 'Registry artifact: weights + training data reference + feature schema + eval metrics. Without data reference, reproducibility is impossible.' },
  { id: 'C57', domain: 'Statistics & Probability', type: 'mcq',
    q: 'Bootstrapping is preferred over the Central Limit Theorem for confidence interval estimation when:',
    options: ['Sample size is large (n > 1000)', 'The statistic is not a mean (e.g., median, correlation, AUC) or the distribution is heavy-tailed and the CLT approximation is unreliable', 'The data is normally distributed', 'Computing mean differences between two groups'],
    correct: 1,
    explanation: "CLT guarantees normality of sample means as n grows, but non-mean statistics (median, quantiles, AUC) have complex sampling distributions. Bootstrap resampling empirically estimates those distributions without parametric assumptions. Production tell: t-test on median order value shows p=0.08 and the experiment is called null; bootstrap CI reveals the true effect excludes zero — a real improvement was missed.", whatsTested: 'Whether you know bootstrapping is preferred for small samples or non-normal distributions where CLT assumptions do not hold.', antiPattern: 'CLT-based t-test is fine for large samples — bootstrapping is specifically for when CLT assumptions break down.', staffFraming: 'Bootstrap: resample with replacement, compute statistic on each sample. Makes no distributional assumptions. Preferred when n < 30 or heavy tails.' },
  { id: 'C58', domain: 'Statistics & Probability', type: 'mcq',
    q: 'Multiple hypothesis testing in ML feature selection: what does Bonferroni correction do and what is its limitation?',
    options: ['Increases statistical power by pooling tests', 'Divides α by the number of tests to control family-wise error rate; limitation is extreme conservatism — high false negative rate when tests are correlated', 'Adjusts p-values using the BH procedure', 'Corrects for sample size differences'],
    correct: 1,
    explanation: "Bonferroni controls FWER at α by requiring each test to meet α/m significance. It is valid but over-conservative when tests are correlated, inflating Type II error and discarding real signals. Production tell: team runs 20 metric tests with Bonferroni at α=0.0025; a real 3% revenue lift has p=0.004 and is called not significant — a genuine win is shelved.", whatsTested: 'Whether you know Bonferroni correction reduces the per-test significance threshold to control family-wise error rate.', antiPattern: 'Bonferroni sounds like it increases the threshold but it actually makes significance harder to achieve — more conservative.', staffFraming: 'Bonferroni: alpha/m per test where m is number of tests. 20 features at alpha=0.05 → each test needs p < 0.0025.' },
  { id: 'C59', domain: 'Statistics & Probability', type: 'mcq',
    q: 'In a two-sample t-test for an A/B experiment, the p-value represents:',
    options: ['The probability the alternative hypothesis is true', 'The probability of observing a test statistic at least as extreme as the one observed, assuming the null hypothesis is true', 'The false positive rate of the experiment', 'The effect size'],
    correct: 1,
    explanation: "p-value is P(|T| ≥ |t_obs| | H₀). It is NOT the probability H₀ is true. Misinterpreting p-values as posterior probabilities is one of the most common errors in applied ML experimentation. Production tell: team reports 'there is a 96% chance our feature works' from p=0.04; this framing inflates confidence and leads to premature full rollout of a marginal feature.", whatsTested: 'Whether you know the p-value is the probability of seeing data this extreme IF the null is true — not the probability the null is true.', antiPattern: 'Probability that the null hypothesis is true is the most common p-value misinterpretation in industry.', staffFraming: 'Correct: p=0.03 means if H0 is true we would see a result this extreme only 3% of the time. The null is either true or false.' },
  { id: 'C60', domain: 'Statistics & Probability', type: 'mcq',
    q: 'You observe a skewed metric (revenue per user) in an A/B test. Which transformation reduces variance and makes t-test more appropriate?',
    options: ['Square root transform only', 'Log(1 + x) transform, which compresses the heavy tail and reduces variance while preserving zero values', 'Z-score normalization', 'Rank transform'],
    correct: 1,
    explanation: "Revenue distributions are typically log-normal. log(1+x) handles zeros and compresses the right tail, reducing variance substantially. This makes the CLT approximation valid at smaller sample sizes. Production tell: t-test on raw revenue requires 4 weeks to reach significance due to whale user variance; log-transforming revenue reduces required runtime to 10 days for the same power.", whatsTested: 'Whether you know log-transforming revenue or using the delta method are the appropriate fixes for skewed A/B metrics.', antiPattern: 'Dropping outliers is tempting but removes real signal — whale users are legitimate customers.', staffFraming: 'Revenue is right-skewed and heavy-tailed. Log-transform before t-test, or use the delta method for ratio metrics.' },
  { id: 'C61', domain: 'Statistics & Probability', type: 'mcq',
    q: 'The delta method approximates the variance of a ratio metric (e.g., revenue/sessions) from component variances. It is needed because:',
    options: ['Ratios are always normally distributed', 'Ratios of random variables have complex distributions; delta method linearizes via Taylor expansion to produce an analytically tractable variance estimate', 'It reduces experiment runtime', 'It corrects for multiple comparisons'],
    correct: 1,
    explanation: "A ratio f(X,Y) = X/Y has no simple closed-form variance. Delta method approximates Var(f) using the gradient of f at the mean, enabling standard error computation for metrics like CTR = clicks/impressions. In production this breaks as: CTR confidence intervals computed naively (treating clicks and impressions as independent) are 40% too narrow; the experiment is called significant a week too early.", whatsTested: 'Whether you know the delta method approximates variance of ratio metrics using a first-order Taylor expansion.', antiPattern: 'Using the ratio mean and assuming independence gives wrong variance estimates for correlated numerator/denominator.', staffFraming: 'CVR = conversions/visitors is a ratio. Naive variance is wrong. Delta method propagates uncertainty from both components.' },
  { id: 'C62', domain: 'Statistics & Probability', type: 'mcq',
    q: 'What distinguishes a Type S (sign) error from a Type M (magnitude) error in effect size estimation?',
    options: ['Type S: wrong p-value; Type M: wrong sample size', 'Type S: estimated effect has the opposite sign from the true effect; Type M: estimated magnitude is far from the true effect (over/under-estimation)', 'They are both forms of Type I error', 'Type S and Type M errors only occur in Bayesian analysis'],
    correct: 1,
    explanation: "Gelman & Carlin (2014): underpowered studies often produce estimates with the wrong sign (Type S) or wildly inflated magnitude (Type M). These are more decision-relevant than the binary Type I/II framing. Production tell: underpowered experiment shows +15% revenue lift (significant); post-launch measurement shows +1.5% — a 10x Type M exaggeration that inflated the business case.", whatsTested: 'Whether you know Type S error is getting the direction wrong, Type M is getting the magnitude wrong.', antiPattern: 'Type I/II errors are the classic taxonomy — Type S/M are a refinement describing estimation quality from underpowered experiments.', staffFraming: 'Type S: positive effect but actually negative. Type M: 5x too large. Both cause wrong decisions from underpowered experiments.' },
  { id: 'C63', domain: 'Deep Learning', type: 'mcq',
    q: 'Grouped Query Attention (GQA) reduces inference memory bandwidth compared to Multi-Head Attention (MHA) by:',
    options: ['Reducing the number of attention heads entirely', 'Sharing a smaller number of K/V heads across multiple Q heads, reducing KV cache size proportionally to the grouping factor', 'Using sparse attention patterns', 'Quantizing attention weights'],
    correct: 1,
    explanation: "GQA (Ainslie et al., 2023) groups G query heads to share one K and V head. KV cache shrinks by factor G relative to MHA, reducing memory bandwidth at inference — critical for long-context LLM serving. Production tell: MHA model at 128k context hits GPU memory limit; switching to GQA with G=8 reduces KV cache 8x, enabling the same context length on half the GPUs.", whatsTested: 'Whether you know GQA reduces memory bandwidth by sharing key-value heads across query head groups.', antiPattern: 'Multi-query attention (MQA) is the extreme version with one KV head. GQA is the balanced middle ground.', staffFraming: 'MHA: n_kv = n_q. MQA: n_kv = 1. GQA: n_kv = n_q/G. At 70B scale, KV cache is the primary serving memory bottleneck.' },
  { id: 'C64', domain: 'Deep Learning', type: 'mcq',
    q: 'KV cache quantization to INT8 in a transformer serving stack primarily reduces:',
    options: ['Compute FLOPs during attention', 'Memory bandwidth pressure from loading K/V tensors per decode step, since decode is memory-bound not compute-bound', 'Training convergence time', 'Embedding table size'],
    correct: 1,
    explanation: "Autoregressive decode is memory-bandwidth-bound: each step loads all cached K/V tensors. INT8 quantization halves bandwidth vs FP16, roughly doubling throughput with minimal perplexity degradation. Production tell: LLM decode throughput is 12 tokens/s at FP16; applying INT8 KV cache quantization raises it to 22 tokens/s with <0.3 perplexity point loss — a free latency win.", whatsTested: 'Whether you know KV cache quantization primarily reduces memory bandwidth during autoregressive decoding.', antiPattern: 'Compute reduction is secondary — at serving, KV cache memory bandwidth is the bottleneck not FLOPS.', staffFraming: 'KV cache at 70B with long context fills GPU memory fast. INT8 KV cache halves it. The bottleneck is bandwidth not compute.' },
  { id: 'C65', domain: 'Deep Learning', type: 'mcq',
    q: 'Gradient checkpointing trades compute for memory by:',
    options: ['Clipping gradients to reduce memory', 'Discarding intermediate activations during forward pass and recomputing them during backward pass, reducing memory from O(N layers) to O(√N)', 'Storing only the final layer activations', 'Using mixed precision to halve activation memory'],
    correct: 1,
    explanation: "Gradient checkpointing (Chen et al., 2016) selects checkpoints every √N layers, storing only those activations and recomputing segments during backward pass. Memory drops from O(N) to O(√N) at ~33% extra compute cost. Production tell: training a 24-layer model on 80GB GPU fails with OOM at batch size 8; enabling gradient checkpointing allows batch size 32 at 33% longer step time — net throughput improves.", whatsTested: 'Whether you know gradient checkpointing saves memory by recomputing activations during backward instead of storing them.', antiPattern: 'Gradient compression is for distributed training communication — not memory reduction during backprop.', staffFraming: 'Checkpointing: store only checkpoint activations, recompute others during backward. Trade: +33% compute for ~60% less memory.' },
  { id: 'C66', domain: 'Deep Learning', type: 'mcq',
    q: 'In LoRA fine-tuning, a lower rank r means:',
    options: ['More parameters are updated', 'Fewer trainable parameters and a lower-rank update subspace; appropriate when the target task is close to pretraining distribution', 'Higher risk of overfitting', 'Slower convergence'],
    correct: 1,
    explanation: "LoRA decomposes weight updates as ΔW = BA where B ∈ ℝ^{d×r}, A ∈ ℝ^{r×k}. Small r (1-8) limits expressiveness but drastically reduces parameters, sufficient for tasks similar to pretraining. Production tell: full fine-tune of a 7B model requires 56GB GPU memory; LoRA with r=8 fits on a 24GB GPU and reaches within 1 point of full fine-tune accuracy on the target task.", whatsTested: 'Whether you know lower LoRA rank means fewer trainable parameters — faster but potentially less expressive.', antiPattern: 'Higher rank is not automatically better — it overfits on small datasets and negates LoRA\'s parameter efficiency.', staffFraming: 'LoRA rank r: updates ΔW = A×B where A is d×r, B is r×d. Lower r = fewer parameters = faster training = less expressiveness.' },
  { id: 'C67', domain: 'Deep Learning', type: 'mcq',
    q: 'FlashAttention achieves memory efficiency primarily through:',
    options: ['Approximating attention with sparse patterns', 'Tiled computation that fuses Q·K^T softmax and ·V into a single CUDA kernel, keeping intermediate attention matrices in SRAM and never materializing the full N×N matrix in HBM', 'Using FP8 precision for attention', 'Reducing the embedding dimension'],
    correct: 1,
    explanation: "FlashAttention (Dao et al., 2022) tiles Q, K, V to fit in SRAM, computes attention in blocks, and accumulates results without writing the N×N matrix to HBM, reducing memory I/O from O(N²) to O(N). Production tell: standard attention OOMs at 8k sequence length on 40GB GPU; FlashAttention enables 32k sequences on the same hardware with 3x faster training step time.", whatsTested: 'Whether you know FlashAttention achieves memory efficiency by tiling computation to avoid materialising the full attention matrix.', antiPattern: 'Sparse attention is a different approach — it skips some computations. FlashAttention computes all attention but in a memory-efficient way.', staffFraming: 'FlashAttention: tile-based SRAM computation, never write O(n^2) matrix to HBM. Same result as standard attention, far less memory.' },
  { id: 'C68', domain: 'Deep Learning', type: 'mcq',
    q: 'Speculative decoding in LLM serving uses a draft model to:',
    options: ['Replace the main model entirely for low-complexity tokens', 'Generate k candidate tokens with a small fast model, then verify them with the large model in one forward pass, accepting a token prefix — increasing throughput without changing output distribution', 'Prune the vocabulary during decoding', 'Cache frequent output sequences'],
    correct: 1,
    explanation: "Speculative decoding (Leviathan et al., 2022) parallelizes draft generation and verification. The large model verifies k tokens in one pass (same cost as generating 1 token), yielding 2-3x throughput gains with identical outputs. Production tell: 70B model generates 8 tokens/s; adding a 1B draft model with speculative decoding (k=4) raises throughput to 22 tokens/s with zero quality change.", whatsTested: 'Whether you know speculative decoding uses a fast draft model to propose tokens that the large model verifies in parallel.', antiPattern: 'Draft model independently generating the final output misses the key point — the large model still validates every token.', staffFraming: 'Draft model proposes k tokens cheaply. Target model verifies all k in one forward pass. Net speedup: 2-3x with no quality loss.' },
  { id: 'C69', domain: 'MLOps', type: 'mcq',
    q: 'Progressive rollout gates in a model deployment pipeline serve to:',
    options: ['Speed up deployment by skipping staging', 'Limit blast radius by exposing the new model to increasing traffic percentages (1% → 5% → 20% → 100%), with automated rollback if key metrics degrade beyond thresholds', 'Reduce model serving costs', 'Enable A/B testing of hyperparameters'],
    correct: 1,
    explanation: "Progressive (canary) rollout catches regressions before they affect all users. Each gate compares the canary's error rate, latency, and business KPIs against the baseline; a breach triggers automated rollback. Production tell: new model looks fine in shadow mode but canary at 1% traffic triggers automated rollback within 10 minutes due to 3x latency increase on a specific input pattern missed during offline eval.", whatsTested: 'Whether you know rollout gates detect degraded metrics before full traffic exposure, enabling safe rollback.', antiPattern: 'Deployment automation is a goal but the primary purpose of gates is safety — preventing bad models reaching full traffic.', staffFraming: 'Gate: if latency P99 or error rate crosses threshold, halt rollout. Define rollback criteria before starting.' },
  { id: 'C70', domain: 'MLOps', type: 'mcq',
    q: 'Model monitoring should alert on data drift separately from prediction drift because:',
    options: ['They are the same thing', 'Data drift (P(X) shift) can precede prediction drift: feature distributions shift before the model\'s output distribution changes, enabling earlier intervention', 'Prediction drift is harder to measure', 'Data drift alerts are cheaper to compute'],
    correct: 1,
    explanation: "Data drift is a leading indicator. Alerting on input feature distributions (via PSI or KL divergence) gives teams a warning signal before the model starts producing systematically wrong predictions. Production tell: PSI on user_age feature spikes to 0.35 (threshold 0.2) on Monday; investigation reveals a data pipeline joined on the wrong key, sending random ages to the model for 3 days before anyone noticed.", whatsTested: 'Whether you know data drift can cause model degradation before prediction drift is visible — it is an earlier signal.', antiPattern: 'Redundancy is not the reason — data drift and prediction drift provide different signal types at different times.', staffFraming: 'Signal chain: feature PSI (earliest) → prediction distribution → label accuracy (latest). Monitor all three layers.' },
  { id: 'C71', domain: 'MLOps', type: 'mcq',
    q: 'In ML pipelines, what is the purpose of a model registry distinct from artifact storage?',
    options: ['To store training data', 'To provide lifecycle management: versioning, stage transitions (Staging → Production → Archived), lineage, and a query API so serving systems can programmatically fetch the current production model', 'To run model inference', 'To schedule retraining jobs'],
    correct: 1,
    explanation: "Artifact stores (S3/GCS) hold binary files. A model registry adds metadata: who promoted this model, what its metrics are, which experiment produced it, and what stage it is in — enabling governance and automated promotion gates. In production this breaks as: without a registry, an engineer manually copies last week's model to production after a deployment script points to the wrong S3 path — no audit trail, no rollback reference.", whatsTested: 'Whether you know a model registry adds governance — stage tracking, approval workflows, deployment lineage — beyond artifact storage.', antiPattern: 'Artifact storage just stores files — a registry adds metadata, lifecycle management, and production audit trails.', staffFraming: 'Registry = artifact storage + governance. Stage: Staging → Production requires sign-off. Lineage: what training data + code produced this.' },
  { id: 'C72', domain: 'MLOps', type: 'mcq',
    q: 'Shadow mode deployment (dark launching) differs from A/B testing in that:',
    options: ['Shadow mode uses a different dataset', 'Shadow mode routes production traffic to both models but only serves responses from the champion; the challenger\'s predictions are logged and compared offline without affecting users', 'A/B testing is only for UX changes', 'Shadow mode requires more infrastructure'],
    correct: 1,
    explanation: "Shadow mode validates the challenger's prediction quality and latency under real traffic with zero user impact. A/B testing requires splitting real users and affects experience, whereas shadow mode is purely observational. Production tell: shadow mode reveals the new model produces null predictions for 0.3% of requests due to a missing feature handler — caught before any user was affected.", whatsTested: 'Whether you know shadow mode discards all responses — users never see the new model\'s output.', antiPattern: 'A/B testing serves the new model to real users — that is the key difference shadow mode is designed to avoid.', staffFraming: 'Shadow: real traffic, discarded responses, zero user impact. A/B: real traffic, real responses. Shadow when bad results are unacceptable.' },
  { id: 'C73', domain: 'MLOps', type: 'mcq',
    q: 'The Lion optimizer (Chen et al., 2023) differs from Adam primarily in that it:',
    options: ['Uses second-moment estimates like Adam', 'Uses only the sign of the momentum update (sign descent), applying uniform step size — more memory-efficient than Adam since it stores no second moment', 'Is a variant of AdaGrad', 'Requires learning rate warmup exclusively'],
    correct: 1,
    explanation: "Lion tracks only first-moment momentum and applies sign(momentum) as the update direction with a fixed LR. This removes the second-moment buffer, saving 33% memory vs Adam, while matching or exceeding Adam's performance. Production tell: switching a ViT training run from Adam to Lion reduces GPU memory 33% and allows a 30% larger batch size, improving training throughput with no accuracy regression.", whatsTested: 'Whether you know Lion uses only the sign of the gradient for updates, making it memory-efficient.', antiPattern: 'Adam with lower memory is the common guess but Lion is architecturally different — it uses sign(gradient) not magnitude.', staffFraming: 'Lion: update = sign(beta1*m + (1-beta1)*g). No second moment needed. 33% less memory than Adam.' },
  { id: 'C74', domain: 'MLOps', type: 'mcq',
    q: 'CI/CD for ML models should include which automated check beyond unit tests?',
    options: ['Only linting and formatting checks', 'Training smoke test on a data slice, model performance regression test against a baseline metric, and schema validation of model inputs/outputs', 'Only integration tests for the API', 'Only Docker build verification'],
    correct: 1,
    explanation: "ML CI/CD must validate that code changes don't degrade model behavior: a smoke train catches pipeline breakage, a regression test catches performance drops, and schema validation catches silent input contract changes. In production this breaks as: a PR renames a feature column but CI only runs unit tests; the renamed column is silently filled with NaN at serving, degrading model accuracy for 48 hours post-deploy.", whatsTested: 'Whether you know ML CI/CD must include automated evaluation against the current champion on a held-out test set.', antiPattern: 'Unit tests for the data pipeline catch software bugs but do not validate actual model performance.', staffFraming: 'CI gate: challenger must beat champion by a statistically significant margin on held-out data before promotion.' },
  { id: 'C75', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Product Quantization (PQ) in ANN indexing reduces memory by:',
    options: ['Pruning low-magnitude vectors', 'Decomposing each vector into M sub-vectors and quantizing each sub-vector to one of k centroids, storing only centroid IDs instead of full float vectors', 'Using INT8 quantization on the full vector', 'Reducing vector dimensionality with PCA first'],
    correct: 1,
    explanation: "PQ splits a d-dimensional vector into M d/M-dimensional sub-vectors, each quantized to k centroids. Storage drops from d·32 bits to M·log₂(k) bits — typically 32× compression with controllable recall degradation. Production tell: 100M item vectors at float32 require 51GB RAM; PQ compression reduces to 1.6GB, enabling the index to fit in memory on a single node and cutting retrieval latency 10x.", whatsTested: 'Whether you know product quantization reduces memory by encoding full vectors as compact codebook indices.', antiPattern: 'Reducing dimensionality is a different approach (PCA/LSH). PQ preserves full dimensionality but compresses the representation.', staffFraming: 'PQ: split vector into M sub-vectors, encode each with its nearest centroid index. Memory: d×32-bit floats → M×8-bit codes.' },
  { id: 'C76', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Hierarchical Navigable Small World (HNSW) graphs have better query-time complexity than flat ANN because:',
    options: ['They use exact search at the bottom layer', 'They build a multi-layer graph where upper layers are sparse long-range connections enabling O(log N) coarse-to-fine navigation before exhaustive search in the dense bottom layer', 'They quantize vectors at query time', 'They partition the index into shards'],
    correct: 1,
    explanation: "HNSW's top layers act like a skip list: each layer is a random subset of nodes with longer edges. Greedy search descends from coarse to fine, arriving near the query's neighborhood with O(log N) hops before brute-force search in the base layer. Production tell: HNSW recall drops from 0.99 to 0.82 after adding 20M new items without rebuilding; HNSW requires full index rebuild (or incremental insert with ef_construction tuning) to maintain recall as the corpus grows.", whatsTested: 'Whether you know HNSW achieves better query-time complexity via multi-layer graph navigation not exhaustive search.', antiPattern: 'Flat indexing (brute force) is the baseline — HNSW improves on it with O(log n) amortised query time.', staffFraming: 'HNSW: O(log n) query via hierarchical layers. Flat: O(n). Tradeoff: HNSW needs more memory but is far faster at scale.' },
  { id: 'C77', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'In a learning-to-rank setup, listwise loss (e.g., LambdaRank) is preferred over pointwise loss because:',
    options: ['Listwise loss is faster to compute', 'Listwise loss directly optimizes the ranked list quality (NDCG) by weighting gradients by the NDCG gain of swapping pairs, while pointwise loss treats each item independently ignoring inter-item relevance', 'Pointwise loss requires more labels', 'Listwise loss handles imbalanced data better'],
    correct: 1,
    explanation: "LambdaRank (Burges et al.) weights the pairwise gradient by |ΔNDCG| — the change in NDCG from swapping item positions. This connects the loss to the evaluation metric without requiring a differentiable NDCG proxy. Production tell: pointwise cross-entropy ranker has high AUC but poor NDCG@5; switching to LambdaRank directly optimizes the position-weighted metric and improves NDCG@5 by 4 points with the same feature set.", whatsTested: 'Whether you know listwise loss directly optimises the ranking metric over the full list, not individual pairs.', antiPattern: 'Pointwise loss treats ranking as independent classification — it misses inter-item ordering relationships.', staffFraming: 'Listwise (LambdaRank): gradient weighted by NDCG change from swapping pairs. Directly optimises the end metric.' },
  { id: 'C78', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Position bias in click data collected from a ranker corrupts learning-to-rank training because:',
    options: ['Higher-ranked items get more clicks independent of relevance, causing the model to learn position as a proxy for relevance', 'Lower-ranked items are never clicked', 'Click data has too low coverage', 'Position bias only affects retrieval, not ranking'],
    correct: 0,
    explanation: "Users click higher-ranked items more often regardless of quality (position bias). Training on raw clicks encodes rank position into the model's relevance signal. IPS or unbiased LTR methods debias click labels. In production this breaks as: model trained on raw clicks learns to predict position, not relevance; top results perpetually favor incumbent items and new content never gets exposure to accumulate clicks.", whatsTested: 'Whether you know position bias means lower-ranked items get fewer clicks regardless of relevance, corrupting LTR training.', antiPattern: 'Items at position 1 always get more clicks — but the question is about what this does to learning-to-rank training quality.', staffFraming: 'Items the old ranker buried never get clicks. New model learns position 5 is bad when those items were just unseen.' },
  { id: 'C79', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'MMR (Maximal Marginal Relevance) in retrieval reranking optimizes for:',
    options: ['Maximum relevance to the query', 'A linear combination of relevance to the query and diversity (negative similarity to already-selected items), iteratively selecting items to balance both objectives', 'Minimum retrieval latency', 'Maximum precision@K'],
    correct: 1,
    explanation: "MMR selects items by arg max λ·sim(item, query) − (1−λ)·max_{s∈Selected} sim(item, s). Parameter λ trades off relevance vs. diversity, avoiding redundant results. Production tell: search results for 'python tutorial' show 10 nearly identical articles; adding MMR with λ=0.7 diversifies results and increases session depth by 18% without hurting relevance ratings.", whatsTested: 'Whether you know MMR balances relevance and diversity by iteratively selecting the item with maximum marginal relevance.', antiPattern: 'Pure relevance maximisation is what most retrieval does — MMR adds the diversity penalty for already-selected items.', staffFraming: 'MMR: next item = argmax lambda*sim(q,doc) - (1-lambda)*max_sim(doc, selected). Lambda controls relevance/diversity tradeoff.' },
  { id: 'C80', domain: 'Ranking & Retrieval', type: 'mcq',
    q: 'Late interaction models (e.g., ColBERT) differ from bi-encoders by:',
    options: ['Using a single encoder for both query and document', 'Encoding query and document independently but computing relevance via a MaxSim operator over all token pairs, giving richer interaction than a single vector dot product at manageable cost', 'Requiring full cross-attention between query and document tokens', 'Storing precomputed dot products'],
    correct: 1,
    explanation: "ColBERT produces per-token embeddings for query and document. Relevance = Σ_{q_i} max_{d_j} q_i·d_j (MaxSim). This is richer than bi-encoder single-vector dot product and cheaper than full cross-encoder attention at query time. Production tell: bi-encoder recall@10 is 0.72 on multi-facet queries; ColBERT's late interaction raises recall@10 to 0.84 at 2x storage cost — acceptable for high-value enterprise search.", whatsTested: 'Whether you know late interaction models compute token-level interactions at query time, not just embedding similarity.', antiPattern: 'Bi-encoders precompute item embeddings. ColBERT delays interaction to query time for better quality at higher cost.', staffFraming: 'ColBERT: encode separately, compute MaxSim over token embeddings at query time. Better than bi-encoder, cheaper than cross-encoder.' },
  { id: 'C81', domain: 'Experiment Design', type: 'mcq',
    q: 'CUPED (Controlled-experiment Using Pre-Experiment Data) reduces variance in A/B tests by:',
    options: ['Increasing sample size', 'Regressing out pre-experiment behavior correlated with the outcome metric, reducing residual variance and enabling tighter confidence intervals with the same sample size', 'Stratifying randomization by user segment', 'Applying Bonferroni correction'],
    correct: 1,
    explanation: "CUPED computes Y_cuped = Y − θ·(X_pre − E[X_pre]) where X_pre is a pre-experiment covariate correlated with Y. This covariate adjustment removes variance explained by baseline behavior, often reducing variance by 50-70%. Production tell: experiment needs 6 weeks to reach 80% power on raw revenue; adding CUPED with pre-experiment revenue as covariate reduces required runtime to 3 weeks — same statistical validity, half the time.", whatsTested: 'Whether you know CUPED reduces variance by regressing out pre-experiment covariates without changing the experiment design.', antiPattern: 'Increasing sample size also reduces variance but costs more — CUPED achieves the same effect from existing pre-experiment data.', staffFraming: 'CUPED: Y_cuped = Y - theta*(X - E[X]). Reduces metric variance by 20-50% using pre-experiment behaviour as covariate.' },
  { id: 'C82', domain: 'Experiment Design', type: 'mcq',
    q: 'Interaction effects between concurrent A/B tests running in the same user population are a concern when:',
    options: ['Tests run for different durations', 'The treatments modify the same user behavior or metric, causing the effect of one treatment to depend on which variant of the other test a user is assigned to', 'Tests have different sample sizes', 'Tests measure different metrics'],
    correct: 1,
    explanation: "If Test A changes the recommendation algorithm and Test B changes the UI, users assigned to A1+B1 may show non-additive effects. Mutual exclusion or factorial design (all combinations) are the standard mitigations. Production tell: two simultaneous tests both show +3% CTR; after launch both effects disappear because the combined treatment had a negative interaction that neither individual test could detect.", whatsTested: 'Whether you know concurrent experiments contaminate results when users are in multiple tests simultaneously.', antiPattern: 'Multiple testing correction addresses family-wise error rate — not experiment-to-experiment contamination.', staffFraming: 'Interaction effects: Treatment A changes how users respond to Treatment B. Use holdout layers or mutual exclusion to isolate experiments.' },
  { id: 'C83', domain: 'Experiment Design', type: 'mcq',
    q: 'Network effects (social influence between users) violate the SUTVA assumption in A/B testing. The standard mitigation is:',
    options: ['Increase experiment duration', 'Cluster-based randomization: assign entire social/geographic clusters to a single variant so within-cluster spillover is contained and between-cluster comparisons remain valid', 'Use a holdout group', 'Apply propensity score matching'],
    correct: 1,
    explanation: "SUTVA requires no interference between units. Social platforms violate this because treated users affect controls. Cluster randomization (by friend graph, city, or device) isolates spillover within clusters. In production this breaks as: user-level A/B on a viral sharing feature shows +10% DAU; cluster-level experiment shows +2% because control users also received viral content from treated friends.", whatsTested: 'Whether you know network effects violate SUTVA — control users are affected by treated users\' behaviour.', antiPattern: 'Balance between groups is a randomisation goal, not the specific SUTVA violation that network effects cause.', staffFraming: 'SUTVA: each unit\'s outcome is independent of others\' treatment. Network effects break this. Fix: cluster randomisation.' },
  { id: 'C84', domain: 'Experiment Design', type: 'mcq',
    q: 'A novelty effect in an A/B test refers to:',
    options: ['A bug in the random assignment', 'An initial spike in user engagement with the treatment variant driven by curiosity, which decays over time — inflating short-term metrics and making the experiment misleading', 'Users in the control group discovering the treatment', 'Seasonality in traffic patterns'],
    correct: 1,
    explanation: "Users engage more with any novel change initially. If the experiment is too short, the inflated novelty effect will be measured instead of the steady-state effect. Production tell: 1-week experiment shows +9% CTR; 4-week rerun shows +1.5% — the 1-week window captured the novelty bump and the feature would have been shipped on a false premise.", whatsTested: 'Whether you know novelty effect is the initial engagement spike for anything new, regardless of actual quality.', antiPattern: 'Selection bias is about who ended up in which group — novelty effect is about temporal behaviour change over time.', staffFraming: 'Novelty: users engage with new things. Decays over weeks. Always run experiments 2+ full weekly cycles to see past novelty.' },
  { id: 'C85', domain: 'Experiment Design', type: 'mcq',
    q: 'Sequential testing with alpha spending functions (e.g., O\'Brien-Fleming) allows:',
    options: ['Stopping an experiment only at the end', 'Peeking at results at pre-specified interim analyses while controlling overall Type I error by allocating the α budget across looks, enabling early stopping for efficacy or futility', 'Running experiments without a sample size calculation', 'Replacing classical p-values with Bayesian posteriors'],
    correct: 1,
    explanation: "Fixed-horizon tests are invalidated by peeking. Alpha spending functions distribute the significance budget (e.g., 0.005, 0.01, 0.025, 0.05 across 4 looks) so the total false positive rate stays at α = 0.05 across all analyses. In production this breaks as: team peeks weekly for 4 weeks without alpha spending; effective Type I error is ~18%, meaning nearly 1 in 5 shipped features has no real effect.", whatsTested: 'Whether you know alpha spending allows interim looks while controlling overall Type I error via a spending function.', antiPattern: 'Fixed-horizon testing does not allow peeking — alpha spending specifically enables valid continuous monitoring.', staffFraming: 'O\'Brien-Fleming: conservative early, generous late. Pocock: equal alpha at each look. Both maintain FWER across planned looks.' },
  { id: 'C86', domain: 'Experiment Design', type: 'mcq',
    q: 'Holdback experiments (permanent holdout groups) in production ML serve to:',
    options: ['Reduce infrastructure costs', 'Measure the cumulative long-term effect of all shipped features relative to a baseline, since individual A/B tests only measure incremental effects of single features', 'Replace canary deployments', 'Test new data pipelines'],
    correct: 1,
    explanation: "A holdback group withheld from all new features accumulates the baseline. Comparing production vs. holdback after 6-12 months gives an unbiased estimate of total product improvement. Production tell: 12 months of experiments show cumulative +35% engagement; holdback comparison reveals actual improvement is +8% — the individual experiment estimates were systematically biased upward.", whatsTested: 'Whether you know holdback experiments measure long-run steady-state impact after novelty effects have fully decayed.', antiPattern: 'A/B testing is the short-term comparison — holdback specifically measures long-run impact that A/B cannot capture.', staffFraming: 'Holdback: 5% of users never get a feature. After 90 days compare holdback vs everyone else. Measures true steady-state lift.' },
  { id: 'C87', domain: 'SQL & Data', type: 'mcq',
    q: 'A query using a window function (e.g., ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY ts)) with a large PARTITION BY cardinality is slow. The most effective optimization is:',
    options: ['Adding a covering index on (user_id, ts) so the engine can stream rows in partition order without a sort', 'Increasing parallelism', 'Rewriting as a self-join', 'Materializing the entire table first'],
    correct: 0,
    explanation: "Window functions require rows sorted by PARTITION BY + ORDER BY. A covering index on (user_id, ts) eliminates the sort step and allows the engine to stream rows in required order, converting O(N log N) sort to O(N) scan. Production tell: a session-window query runs in 4s on 10M rows; after adding the covering index it runs in 0.3s — the query plan shifts from Sort+Window to IndexScan+Window.", whatsTested: 'Whether you know window functions execute in the SELECT phase after WHERE filtering — they see only filtered rows.', antiPattern: 'Window functions applied before WHERE is the reversal confusion — the query optimizer applies WHERE first.', staffFraming: 'SQL order: FROM → WHERE → GROUP BY → HAVING → SELECT (windows here) → ORDER BY. Windows see the filtered dataset.' },
  { id: 'C88', domain: 'SQL & Data', type: 'mcq',
    q: 'CTEs (WITH clauses) vs. temporary tables in analytical SQL: when does a temp table outperform a CTE?',
    options: ['Always — temp tables are always faster', 'When the CTE is referenced multiple times in the query and the optimizer inlines it (re-executing it per reference), while a temp table materializes once and is scanned multiple times', 'When the dataset fits in memory', 'When the query has no joins'],
    correct: 1,
    explanation: "Most SQL engines (BigQuery, Postgres) do not automatically memoize CTEs referenced multiple times — they re-execute the CTE per reference. A temp table forces materialization, saving repeated computation at the cost of I/O. Production tell: a self-joining CTE that aggregates 500M rows runs for 20 minutes; materializing it as a temp table and joining the temp table twice reduces runtime to 4 minutes.", whatsTested: 'Whether you know temp tables outperform CTEs when the intermediate result is referenced multiple times.', antiPattern: 'CTEs are not always faster — in some query planners they are re-evaluated on each reference.', staffFraming: 'CTE: may be re-evaluated per reference. Temp table: materialised once, reused cheaply. Multi-reference → temp table wins.' },
  { id: 'C89', domain: 'SQL & Data', type: 'mcq',
    q: 'Bloom filter indexes in columnar stores (e.g., Parquet, DeltaLake) accelerate queries by:',
    options: ['Compressing column data', 'Allowing the engine to skip row groups that provably do not contain a queried value by checking a compact probabilistic set membership structure — reducing I/O without scanning', 'Sorting columns for binary search', 'Precomputing join keys'],
    correct: 1,
    explanation: "A Bloom filter for a column's row group encodes which values are present. A query predicate checks the filter — false means skip the row group entirely. False positives cause unnecessary reads but no incorrect results. Production tell: point-lookup on a 10TB Parquet table scans all row groups in 90s; adding Bloom filters on the id column reduces scan to relevant row groups and completes in 2s.", whatsTested: 'Whether you know bloom filters accelerate equality queries by quickly ruling out partitions that cannot contain the value.', antiPattern: 'Range queries are a different access pattern — bloom filters are specifically for equality predicates on high-cardinality columns.', staffFraming: 'Bloom filter: probabilistic check before reading partition. False positives possible, false negatives impossible.' },
  { id: 'C90', domain: 'SQL & Data', type: 'mcq',
    q: 'In a slowly changing dimension (SCD Type 2) implementation, what columns are required to support point-in-time historical queries?',
    options: ['Only a primary key and value columns', 'A surrogate key, the natural key, effective_start_date, effective_end_date (or NULL for current), and an is_current flag', 'A version number column only', 'A timestamp of last update only'],
    correct: 1,
    explanation: "SCD Type 2 preserves history by inserting new rows on change. effective_start_date and effective_end_date allow point-in-time queries: WHERE event_date BETWEEN effective_start_date AND COALESCE(effective_end_date, '9999-01-01'). Production tell: training data joins on current customer tier instead of point-in-time tier; model learns from the tier the customer is now, not the tier they had when the event occurred — introducing label leakage.", whatsTested: 'Whether you know SCD Type 2 requires effective_date and expiry_date columns to support point-in-time queries.', antiPattern: 'A single updated_at timestamp only shows when the record changed, not what the value was at any earlier point.', staffFraming: 'SCD Type 2 columns: surrogate_key, natural_key, attributes, effective_date, expiry_date, is_current. Required for time-travel joins.' },
  { id: 'C91', domain: 'SQL & Data', type: 'mcq',
    q: 'Z-ordering (multi-dimensional clustering) in Delta Lake improves query performance on multiple filter columns by:',
    options: ['Sorting the table on a single column', 'Co-locating rows with similar values across multiple columns in the same data files, reducing files scanned when filtering on any subset of the Z-ordered columns', 'Compressing data files', 'Creating a secondary index'],
    correct: 1,
    explanation: "Z-ordering maps multi-dimensional column values to a 1D Z-curve, placing rows with similar combinations of (col_A, col_B) values in the same files. Queries filtering on either column benefit from file skipping via Delta's min/max statistics. Production tell: a Delta table partitioned by date is queried frequently by (date, user_id); Z-ordering on user_id within date partitions reduces files scanned from 800 to 12 for a typical user lookup.", whatsTested: 'Whether you know Z-ordering clusters data on multiple columns simultaneously for efficient multi-predicate queries.', antiPattern: 'Single-column partitioning only helps queries filtering on the partition key — multi-column queries still scan broadly.', staffFraming: 'Z-ordering: interleave bits of multiple column values to co-locate related data. Dramatically reduces files scanned on multi-column WHERE.' },
  { id: 'C92', domain: 'SQL & Data', type: 'mcq',
    q: 'Hash joins vs. sort-merge joins in a query planner: the optimizer prefers a hash join when:',
    options: ['Both tables are large and sorted', 'One table is small enough to fit in memory as a hash table, enabling O(N+M) join cost vs. O((N+M) log(N+M)) for sort-merge when data is unsorted', 'The join key has low cardinality', 'The query has an ORDER BY clause'],
    correct: 1,
    explanation: "Hash join builds a hash table on the smaller (build) side and probes it with the larger (probe) side — O(N+M). Sort-merge requires both sides sorted — O(N log N + M log M) if unsorted. Production tell: hash join on a 50GB build table spills to disk and runs for 3 hours; pre-sorting both tables on the join key and using sort-merge completes in 20 minutes on the same hardware.", whatsTested: 'Whether you know the optimizer prefers hash join when one table fits in memory — no sorting required.', antiPattern: 'Sort-merge join is preferred for very large tables or when data is already sorted on the join key.', staffFraming: 'Hash join: O(n+m). Sort-merge: O(n log n + m log m). Hash wins when smaller relation fits in memory.' },
  { id: 'C93', domain: 'ML Systems', type: 'mcq',
    q: 'Heterogeneous model serving (CPU inference for simple requests, GPU for complex ones) requires a routing layer that decides based on:',
    options: ['Request timestamp', 'Predicted complexity proxies such as input sequence length, estimated FLOP count, or a lightweight classifier — routing simple requests to CPU to save GPU budget', 'User ID hash', 'Random assignment'],
    correct: 1,
    explanation: "Cost-aware routing reserves GPU capacity for high-complexity inputs where latency matters most. A lightweight complexity estimator (e.g., input length threshold) can reduce GPU spend 40-60% with negligible latency impact for simple requests. Production tell: 70% of API requests are short single-sentence queries; routing them to a 7B model instead of 70B cuts GPU cost 60% with a 2% quality regression that users cannot detect.", whatsTested: 'Whether you know heterogeneous serving requires a routing classifier that determines request complexity before dispatching.', antiPattern: 'Load balancing assumes homogeneous backends — heterogeneous serving needs a classifier to route by complexity.', staffFraming: 'Route: simple → CPU. Complex → GPU. The routing classifier must be lightweight and never the bottleneck itself.' },
  { id: 'C94', domain: 'Optimization', type: 'mcq',
    q: 'In distributed data-parallel training, gradient accumulation is used to:',
    options: ['Reduce model size', 'Simulate a larger effective batch size by accumulating gradients over multiple micro-batches before performing a single optimizer step, without increasing per-GPU memory usage', 'Improve gradient compression', 'Enable model parallelism'],
    correct: 1,
    explanation: "Gradient accumulation sums gradients over k micro-batches before calling optimizer.step(), achieving effective batch size k × micro_batch_size. This allows large-batch training on memory-constrained GPUs. In production this breaks as: batch norm statistics are computed per micro-batch, not the accumulated effective batch; with accumulation steps=8, batch norm sees 1/8 the intended batch size and statistics are noisy.", whatsTested: 'Whether you know gradient accumulation simulates larger batch sizes by accumulating gradients over multiple micro-batches.', antiPattern: 'Reducing memory is a secondary effect — the primary purpose is simulating large batches when GPU memory constrains batch size.', staffFraming: 'Gradient accumulation: accumulate for N steps, then update. Effective batch = N × micro-batch. Used when desired batch exceeds GPU memory.' },
  { id: 'C95', domain: 'Optimization', type: 'mcq',
    q: 'Curriculum learning improves training efficiency by:',
    options: ['Annealing the learning rate', 'Ordering training examples from easy to hard, allowing the model to learn stable representations on simple examples before encountering noisy/hard examples that could destabilize early training', 'Using a larger batch size for hard examples', 'Applying data augmentation only to easy examples'],
    correct: 1,
    explanation: "Inspired by human learning, curriculum learning (Bengio et al., 2009) improves convergence speed and generalization by presenting easy examples first. In NLP, this can mean shorter sequences or high-frequency tokens before complex ones. Production tell: training on shuffled data stalls at val loss 1.8 after 10k steps; curriculum ordering (easy-to-hard by perplexity) converges to val loss 1.6 in the same number of steps.", whatsTested: 'Whether you know curriculum learning trains on easy examples first, gradually increasing difficulty for faster convergence.', antiPattern: 'Data augmentation creates synthetic variants of existing data — curriculum learning is about difficulty ordering, not data creation.', staffFraming: 'Curriculum: easy → hard. Model learns stable general patterns before encountering confusing hard examples.' },
  { id: 'C96', domain: 'Optimization', type: 'mcq',
    q: 'Stochastic Weight Averaging (SWA) improves generalization by:',
    options: ['Averaging gradients across training steps', 'Averaging model weights from multiple points along the SGD trajectory, landing in a flatter region of the loss landscape than any individual checkpoint — similar to free ensembling', 'Reducing the learning rate to near zero', 'Applying dropout during inference'],
    correct: 1,
    explanation: "SWA (Izmailov et al., 2018) periodically snapshots weights and maintains a running average. The averaged weights occupy a wider, flatter basin than individual SGD solutions, improving generalization without training extra models. Production tell: final SGD checkpoint val accuracy is 83.2%; SWA over the last 20 epochs raises it to 84.6% with zero extra training cost — a free improvement from weight averaging.", whatsTested: 'Whether you know SWA averages weights across the training trajectory to find flatter minima with better generalisation.', antiPattern: 'Ensembling averages predictions — SWA averages the weights themselves, resulting in a single model.', staffFraming: 'SWA: running average of weights from last few epochs. Flatter loss basin → better generalisation. Same compute, better result.' },
  { id: 'C97', domain: 'Optimization', type: 'mcq',
    q: 'Gradient clipping by global norm prevents training instability by:',
    options: ['Setting all gradients below a threshold to zero', 'Scaling the entire gradient vector when its L2 norm exceeds a threshold, preserving direction but bounding magnitude — preventing catastrophic weight updates from gradient spikes', 'Clipping each parameter\'s gradient independently', 'Increasing batch size when gradients are large'],
    correct: 1,
    explanation: "Global norm clipping: if ‖g‖₂ > clip_value, g ← g · (clip_value / ‖g‖₂). This preserves gradient direction (unlike per-parameter clipping which distorts it) while bounding step size, critical for RNN and transformer training stability. Production tell: transformer fine-tuning without gradient clipping shows loss NaN on step 847; enabling clip_value=1.0 stabilizes training — the NaN was caused by an outlier batch triggering an exploding gradient.", whatsTested: 'Whether you know gradient clipping by global norm prevents exploding gradients while preserving gradient direction.', antiPattern: 'Per-parameter clipping distorts the gradient direction — global norm clipping scales the whole vector uniformly.', staffFraming: 'Global norm clip: if ||g|| > threshold, g = g × (threshold/||g||). Preserves direction. Per-param clip distorts it.' },
  { id: 'C98', domain: 'Optimization', type: 'mcq',
    q: 'Mixed-precision training (FP16 compute + FP32 master weights) requires a loss scaling strategy because:',
    options: ['FP16 has lower compute throughput', 'Small gradient values underflow to zero in FP16 (values below ~6×10⁻⁸); scaling the loss magnifies gradients before the backward pass to keep them in FP16\'s representable range, then unscaling before the optimizer step', 'FP32 weights cannot be updated with FP16 gradients', 'Loss scaling reduces memory usage'],
    correct: 1,
    explanation: "FP16 dynamic range is 5.96×10⁻⁸ to 65504. Small gradients underflow to 0, causing training to stall. Loss scaling multiplies loss by S before backward, gradients become S× larger, then unscaled before optimizer. Production tell: mixed-precision training loss flatlines at step 200 with no NaN; enabling dynamic loss scaling shows gradient norms were underflowing — loss resumes decreasing immediately after scaling is added.", whatsTested: 'Whether you know loss scaling is required because FP16 underflows for small gradient values.', antiPattern: 'FP16 overflow for large gradients is a different problem — loss scaling specifically addresses underflow.', staffFraming: 'FP16 minimum: ~6e-5. Typical gradients: 1e-6 to 1e-4. Without scaling many gradients underflow to 0. Loss × 1000 shifts them into FP16 range.' },
  { id: 'C99', domain: 'Optimization', type: 'mcq',
    q: 'ZeRO (Zero Redundancy Optimizer) Stage 3 in distributed training partitions:',
    options: ['Only optimizer states across GPUs', 'Optimizer states, gradients, AND model parameters across GPUs — each GPU holds only 1/N of each, enabling models with parameters > single GPU memory by all-gathering parameters on demand', 'Only model parameters', 'Only gradients'],
    correct: 1,
    explanation: "ZeRO Stage 1 shards optimizer states, Stage 2 adds gradient sharding, Stage 3 adds parameter sharding. Stage 3 reduces per-GPU memory to O(total_params/N) at the cost of all-gather communication during forward/backward passes. Production tell: 13B model OOMs on 8×80GB GPUs with ZeRO Stage 2; switching to Stage 3 fits training but step time increases 40% due to all-gather overhead — acceptable at this scale.", whatsTested: 'Whether you know ZeRO Stage 3 partitions model parameters (weights) across GPUs in addition to gradients and optimizer states.', antiPattern: 'Stage 1 partitions optimizer states, Stage 2 adds gradients — Stage 3 goes further and partitions the weights themselves.', staffFraming: 'ZeRO Stage 1: optimizer states. Stage 2: + gradients. Stage 3: + parameters. Stage 3 enables models that do not fit on one GPU.' },
  { id: 'C100', domain: 'Model Evaluation', type: 'mcq',
    q: 'The McNemar test is preferred over comparing accuracy directly when evaluating two classifiers on the same test set because:',
    options: ['McNemar is faster to compute', 'McNemar tests whether the two classifiers disagree on the same examples, accounting for the paired nature of the data — unlike a z-test which ignores per-example correlation', 'Accuracy is not a valid metric', 'McNemar works only for binary classifiers'],
    correct: 1,
    explanation: "McNemar's test uses the 2×2 contingency table of (correct/wrong) pairs across classifiers. It tests H₀: both models have the same error rate using only the discordant pairs, giving a more powerful paired test than treating predictions as independent samples. Production tell: two classifiers show identical accuracy (87.3%) on aggregate; McNemar's test on discordant pairs shows p=0.003, revealing Model B is significantly better on the examples that matter.", whatsTested: 'Whether you know McNemar test compares classifiers on the same test set by testing disagreement patterns, not just accuracy.', antiPattern: 'Comparing accuracy directly ignores correlation — both models see the same examples so errors are not independent.', staffFraming: 'McNemar: test disagreements (A right/B wrong vs A wrong/B right). Accounts for paired structure. Accuracy comparison assumes independence.' },
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

// ── Company Tracks ────────────────────────────────────────────────────────────
const COMPANY_TRACKS = [
  {
    id: 'google_mle',
    label: 'Google MLE',
    desc: 'System Design + Spark + MLOps heavy. Production scale, latency constraints.',
    domains: ['ML Systems', 'MLOps', 'Optimization', 'Model Evaluation'],
    icon: 'G',
    domain: 'google.com',
  },
  {
    id: 'meta_mle',
    label: 'Meta MLE',
    desc: 'Feature Engineering + Model Eval + ranking systems + A/B at scale.',
    domains: ['Feature Engineering', 'Model Evaluation', 'Ranking & Retrieval', 'Experiment Design'],
    icon: 'M',
    domain: 'meta.com',
  },
  {
    id: 'stripe_ds',
    label: 'Stripe DS',
    desc: 'Causal inference, A/B testing, fraud modeling, business metrics.',
    domains: ['Statistics & Probability', 'Model Evaluation', 'MLOps', 'Experiment Design'],
    icon: 'S',
    domain: 'stripe.com',
  },
  {
    id: 'startup_ml',
    label: 'Startup/Growth',
    desc: 'Full-stack ML: features → model → deploy → monitor. Breadth over depth.',
    domains: ['Feature Engineering', 'MLOps', 'Model Evaluation', 'ML Systems'],
    icon: 'L',
    domain: null,
  },
]

function CompanyLogo({ domain, fallback, size = 24, radius = 6 }) {
  if (!domain) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: radius, background: 'var(--depth)', border: '1px solid var(--rim)', fontSize: size * 0.45, fontWeight: 700, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>
        {fallback}
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: radius, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--rim)', flexShrink: 0 }}>
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain', display: 'block' }}
        onError={e => {
          e.target.style.display = 'none'
          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
        }}
      />
      <span style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: size * 0.45, fontWeight: 700, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>{fallback}</span>
    </span>
  )
}

// ── Coming Soon ───────────────────────────────────────────────────────────────
const COMING_SOON = []

// ─── ForwardPointer ───────────────────────────────────────────────────────────
function ForwardPointer({ label, tab, onNavigate, accent = 'var(--ink-low)' }) {
  return (
    <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
      <button
        onClick={() => onNavigate(tab)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '12px', color: accent, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '12px', color: accent }}>→</span>
      </button>
    </div>
  )
}

export default function CombinatorTab({ onNavigate }) {
  // ── Restore saved session from localStorage ──
  const _saved = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('msl_combinator_session') || 'null')
      if (!s) return null
      if (s.savedAt) {
        const elapsed = Math.floor((Date.now() - s.savedAt) / 1000)
        s.timeLeft = Math.max(0, (s.timeLeft || 0) - elapsed)
      }
      return s
    } catch(_) { return null }
  })()

  const [screen, setScreen] = useState(_saved?.screen || 'config')
  const [duration, setDuration] = useState(_saved?.duration || 30)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [challengeMode, setChallengeMode] = useState(false)
  const [questions, setQuestions] = useState(() => {
    if (!_saved?.questionIds) return []
    const allQ = [...MCQ_QUESTIONS, ...SA_QUESTIONS]
    return _saved.questionIds.map(id => allQ.find(q => String(q.id) === String(id))).filter(Boolean)
  })
  const [currentIdx, setCurrentIdx] = useState(_saved?.currentIdx || 0)
  const [userAnswers, setUserAnswers] = useState(_saved?.userAnswers || {})
  const [timeLeft, setTimeLeft] = useState(_saved?.timeLeft || 0)
  const [timePerQuestion, setTimePerQuestion] = useState(_saved?.timePerQuestion || {})
  const [sessionStarted, setSessionStarted] = useState(_saved?.screen === 'session')
  const [selfRatings, setSelfRatings] = useState(_saved?.selfRatings || {})
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [totalTimeUsed, setTotalTimeUsed] = useState(0)
  const [copied, setCopied] = useState(false)

  const questionStartRef = useRef(null)
  const timerRef = useRef(null)

  // ── Config → Session ──
  function startSession() {
    const cfg = DURATION_CONFIG[duration]
    let totalQ = cfg.totalQ
    if (challengeMode) totalQ = Math.max(totalQ, 20)

    let qs
    if (challengeMode) {
      // Force all domains, interleave to ensure breadth
      const allMCQ = [...MCQ_QUESTIONS].sort(() => Math.random() - 0.5)
      const mcqCount = Math.round(totalQ * 0.8)
      const saCount = totalQ - mcqCount
      const shuffledSA = [...SA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, saCount)
      qs = [...allMCQ.slice(0, mcqCount), ...shuffledSA]
    } else if (selectedTrack) {
      const trackDomains = new Set(selectedTrack.domains)
      const filteredMCQ = MCQ_QUESTIONS.filter(q => trackDomains.has(q.domain))
      const shuffledMCQ = [...filteredMCQ].sort(() => Math.random() - 0.5)
      const mcqCount = Math.round(totalQ * 0.8)
      const saCount = totalQ - mcqCount
      const shuffledSA = [...SA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, saCount)
      qs = [...shuffledMCQ.slice(0, mcqCount), ...shuffledSA]
    } else {
      qs = buildQuestionSet(totalQ)
    }

    setQuestions(qs)
    setCurrentIdx(0)
    setUserAnswers({})
    setTimePerQuestion({})
    setTimeLeft(duration * 60)
    setSessionStarted(true)
    setShowEndConfirm(false)
    questionStartRef.current = Date.now()
    try { localStorage.removeItem('msl_combinator_session') } catch(_) {}
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

  // ── Persist session to localStorage ──
  useEffect(() => {
    if (screen !== 'session') return
    try {
      localStorage.setItem('msl_combinator_session', JSON.stringify({
        screen, duration,
        questionIds: questions.map(q => q.id),
        currentIdx, userAnswers, timeLeft, timePerQuestion, selfRatings,
        savedAt: Date.now(),
      }))
    } catch(_) {}
  }, [screen, currentIdx, userAnswers, timeLeft, selfRatings])

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
    try { localStorage.removeItem('msl_combinator_session') } catch(_) {}
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
  const timerColor = timeLeft < 60 ? 'var(--prime)' : timeLeft < 300 ? 'var(--prime)' : 'var(--prime)'
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
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 55%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Combinator</h1>
          <p style={{ color: 'var(--ink-mid)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Timed mock session — all answers locked until time ends
          </p>
          <p style={{ color: 'var(--ink-low)', marginTop: '0.5rem', fontSize: '0.825rem', lineHeight: 1.55, fontFamily: 'var(--font-sans)', maxWidth: '520px' }}>
            Choose a duration, then start the session. Questions are served one at a time — you can't change a submitted answer. When time runs out (or you end early), review your domain breakdown in the debrief.
          </p>
          <div style={{ marginTop: '8px' }}><FidelityBadge tier="conceptual" /></div>
        </div>

        {_saved?.screen === 'session' && (
          <div style={{
            padding: '0.875rem 1rem', borderRadius: 8, marginBottom: '1.5rem',
            background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          }}>
            <div>
              <div style={{ color: 'var(--prime)', fontWeight: 700, fontSize: '0.9rem' }}>Session in progress</div>
              <div style={{ color: 'var(--ink-mid)', fontSize: '0.8rem', marginTop: '2px' }}>
                {Math.floor(_saved.timeLeft / 60)}:{String(_saved.timeLeft % 60).padStart(2,'0')} remaining · {Object.keys(_saved.userAnswers || {}).length}/{_saved.questionIds?.length || 0} answered
              </div>
            </div>
            <button onClick={() => {
              setScreen('session')
            }} style={{
              padding: '0.5rem 1rem', borderRadius: 6, background: 'var(--prime)',
              border: 'none', color: 'var(--void)', fontFamily: 'var(--font-sans)',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0,
            }}>Resume →</button>
          </div>
        )}

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
                  background: duration === parseInt(mins) ? 'rgba(240,165,0,0.15)' : 'var(--surface)',
                  cursor: 'pointer',
                  color: duration === parseInt(mins) ? 'var(--prime)' : 'var(--ink-mid)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{cfg.label}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.7 }}>{cfg.totalQ} questions</div>
              </button>
            ))}
          </div>
        </div>

        {/* Company Tracks */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
            Company Track <span style={{ color: 'var(--ink-ghost)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
            {COMPANY_TRACKS.map(track => {
              const active = selectedTrack?.id === track.id
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    if (active) {
                      setSelectedTrack(null)
                    } else {
                      setSelectedTrack(track)
                      if (challengeMode) setChallengeMode(false)
                    }
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '0.85rem 1rem',
                    borderRadius: 10,
                    border: `2px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
                    background: active ? 'rgba(240,165,0,0.1)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <CompanyLogo domain={track.domain} fallback={track.icon} size={26} radius={6} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: active ? 'var(--prime)' : 'var(--ink-hi)' }}>
                      {track.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-low)', margin: '0 0 0.45rem', lineHeight: 1.4 }}>
                    {track.desc}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {track.domains.map(d => (
                      <span key={d} style={{
                        fontSize: '0.68rem', padding: '0.15rem 0.45rem',
                        borderRadius: 4, background: 'var(--depth)',
                        color: active ? 'var(--prime)' : 'var(--ink-ghost)',
                        border: `1px solid ${active ? 'rgba(240,165,0,0.3)' : 'var(--rim)'}`,
                        fontFamily: 'var(--font-mono)',
                      }}>{d}</span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Challenge Mode toggle */}
        <button
          onClick={() => {
            setChallengeMode(prev => {
              const next = !prev
              if (next) setSelectedTrack(null)
              return next
            })
          }}
          style={{
            width: '100%',
            padding: '0.85rem 1rem',
            borderRadius: 10,
            border: `2px solid ${challengeMode ? 'var(--prime)' : 'var(--rim)'}`,
            background: challengeMode ? 'var(--prime-bg-light)' : 'var(--surface)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '1.5rem',
            transition: 'all 0.15s',
          }}
        >
          <span style={{
            fontSize: '1.1rem',
            filter: challengeMode ? 'none' : 'grayscale(1) opacity(0.5)',
          }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: challengeMode ? 'var(--prime)' : 'var(--ink-hi)' }}>
              Challenge Mode — All Domains
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-low)', marginTop: '0.15rem' }}>
              Forces all domains · 20 questions minimum · breadth test
            </div>
          </div>
          <div style={{
            marginLeft: 'auto',
            width: 36, height: 20, borderRadius: 10,
            background: challengeMode ? 'var(--prime)' : 'var(--rim)',
            position: 'relative', flexShrink: 0,
            transition: 'background 0.15s',
          }}>
            <div style={{
              position: 'absolute', top: 3,
              left: challengeMode ? 18 : 3,
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--void)',
              transition: 'left 0.15s',
            }} />
          </div>
        </button>

        <div style={{
          padding: '0.875rem 1rem',
          borderRadius: 8,
          background: 'rgba(249,115,22,0.15)',
          border: '1px solid rgba(249,115,22,0.25)',
          marginBottom: '1.75rem',
          fontSize: '0.875rem',
          color: 'var(--ink-mid)',
          lineHeight: 1.5,
        }}>
          <span style={{ color: 'var(--prime)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>{' '}
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
            fontFamily: 'var(--font-sans)',
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

        {/* Challenge mode badge */}
        {challengeMode && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', borderRadius: 99, marginBottom: '0.75rem',
            background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', color: 'var(--prime)' }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--prime)', letterSpacing: '0.04em' }}>
              Cross-Domain Challenge
            </span>
          </div>
        )}

        {/* Timer + progress header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--ink-low)', fontSize: '0.85rem' }}>
            Q {currentIdx + 1} of {questions.length}
          </span>
          <div
            className={timerPulse ? 'combinator-pulse' : undefined}
            style={{
              fontFamily: 'var(--font-mono)',
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
                  minWidth: 40,
                  height: 40,
                  borderRadius: 8,
                  border: isActive ? '2px solid var(--prime)' : '1px solid var(--rim)',
                  background: isActive ? 'rgba(240,165,0,0.15)' : 'var(--surface)',
                  color: isActive ? 'var(--prime)' : isAnswered ? 'var(--prime)' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  fontWeight: isActive ? 700 : 500,
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
                    background: 'var(--prime)',
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
              background: 'var(--prime-bg-light)',
              border: '1px solid rgba(240,165,0,0.2)',
              color: 'var(--prime)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
            }}>
              {currentQ?.domain}
            </span>
            <p style={{ color: 'var(--ink-hi)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
              {currentQ?.whatsTested && <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderLeft: '3px solid var(--prime)', borderRadius: 7, padding: '0.4rem 0.75rem', marginBottom: '0.65rem' }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)' }}>Testing: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)' }}>{currentQ.whatsTested}</span></div>}
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
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                      outline: isSelected ? '1px solid rgba(240,165,0,0.15)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--ink-low)', marginRight: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
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
                fontFamily: 'var(--font-sans)',
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
              fontFamily: 'var(--font-sans)',
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
              border: '1px solid var(--rim)',
              background: 'transparent',
              color: 'var(--ink-low)',
              fontFamily: 'var(--font-sans)',
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
              fontFamily: 'var(--font-sans)',
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
                    background: 'var(--ink-low)', border: 'none',
                    color: 'var(--white)', fontFamily: 'var(--font-sans)',
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
                    color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)',
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
    const scoreColor = 'var(--prime)'
    const weakestDomain = Object.entries(domainStats)
      .sort((a, b) => (a[1].correct / Math.max(a[1].total,1)) - (b[1].correct / Math.max(b[1].total,1)))[0]?.[0] || ''
    function handleShare() {
      const text = `ML Systems Lab Combinator: ${correctCount}/${mcqQuestions.length} · ${pct}% · Weak: ${weakestDomain} → ml-systems-lab-v9xe.vercel.app`
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
    }

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
          <div style={{ fontSize: '3rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-mono)' }}>
            {pct}%
          </div>
          <div style={{ color: 'var(--ink-mid)', marginTop: '0.25rem', fontSize: '1rem' }}>
            {correctCount} / {mcqQuestions.length} MCQ correct
          </div>
          <div style={{ color: 'var(--ink-low)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            {questions.length} total questions · {duration} min session
          </div>
          {challengeMode && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.25rem 0.65rem', borderRadius: 99, marginTop: '0.5rem',
              background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--prime)', display: 'flex', alignItems: 'center', gap: '3px' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Cross-Domain</span>
            </div>
          )}
          {selectedTrack && !challengeMode && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.25rem 0.65rem', borderRadius: 99, marginTop: '0.5rem',
              background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--prime)' }}>{selectedTrack.icon} {selectedTrack.label} Track</span>
            </div>
          )}
          <button onClick={handleShare} style={{
            marginTop: '1rem', background: 'none', border: '1px solid var(--rim)',
            borderRadius: 8, padding: '0.45rem 1.1rem', fontSize: '0.82rem',
            color: copied ? 'var(--prime)' : 'var(--ink-mid)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', transition: 'color 0.2s',
          }}>
            {copied ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg> Copied!' : '⎘ Share Score'}
          </button>
        </div>

        {/* Domain breakdown */}
        {mcqQuestions.length > 0 && (
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
              Domain Breakdown
            </div>
            {Object.entries(domainStats)
              .map(([domain, stats]) => [domain, stats, stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0])
              .sort((a, b) => a[2] - b[2])
              .map(([domain, stats, pct]) => {
                const barColor = 'var(--prime)'
                return (
                  <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '110px', fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', flexShrink: 0, textAlign: 'right' }}>{domain}</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ width: '48px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: barColor, flexShrink: 0 }}>{stats.correct}/{stats.total}</div>
                  </div>
                )
              })
            }
          </div>
        )}

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
                  <span style={{ fontSize: '0.75rem', color: 'var(--prime)', fontWeight: 600 }}>{q.domain}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>
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
                        padding: '0.4rem 0.75rem', borderRadius: 8,
                        background: bg, border, color, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', opacity: 0.7 }}>
                          {['A', 'B', 'C', 'D'][optIdx]}
                        </span>
                        {opt}
                        {isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>correct</span>}
                        {isUserOpt && !isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>your answer</span>}
                      </div>
                    )
                  })}
                </div>

                {userIdx === null && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-low)', margin: '0 0 0.5rem' }}>Not attempted</p>
                )}

                <div style={{
                  padding: '0.6rem 0.75rem',
                  background: 'var(--depth)',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  color: 'var(--ink-mid)',
                  lineHeight: 1.55,
                }}>
                  <span style={{ color: 'var(--prime)', fontWeight: 600, marginRight: '0.4rem' }}>Explanation:</span>
                  {q.explanation}
                  {q.antiPattern && <div style={{ marginTop: '0.55rem', padding: '0.4rem 0.65rem', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.17)', borderLeft: '3px solid var(--rose)', borderRadius: 7 }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--rose)' }}>Trap: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)' }}>{q.antiPattern}</span></div>}
                  {q.staffFraming && <div style={{ marginTop: '0.35rem', padding: '0.4rem 0.65rem', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.16)', borderLeft: '3px solid rgba(139,92,246,0.55)', borderRadius: 7 }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(139,92,246,0.85)' }}>Senior frame: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)' }}>{q.staffFraming}</span></div>}
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
                      <span style={{ fontSize: '0.75rem', color: 'var(--prime)', fontWeight: 600 }}>{q.domain}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>
                        {timeSpent}s
                      </span>
                    </div>
                    <p style={{ color: 'var(--ink-hi)', fontSize: '0.9rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{q.q}</p>

                    {userAns && (
                      <div style={{
                        padding: '0.65rem 0.75rem',
                        background: 'rgba(240,165,0,0.08)',
                        border: '1px solid rgba(240,165,0,0.15)',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                        color: 'var(--ink-mid)',
                        lineHeight: 1.55,
                        marginBottom: '0.75rem',
                        whiteSpace: 'pre-wrap',
                      }}>
                        <span style={{ color: 'var(--prime)', fontWeight: 600, marginRight: '0.4rem' }}>Your answer:</span>
                        {userAns}
                      </div>
                    )}

                    <div style={{
                      padding: '0.65rem 0.75rem',
                      background: 'rgba(52,211,153,0.10)',
                      border: '1px solid rgba(52,211,153,0.15)',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      color: 'var(--ink-mid)',
                      lineHeight: 1.55,
                      marginBottom: '0.75rem',
                      whiteSpace: 'pre-wrap',
                    }}>
                      <span style={{ color: 'var(--prime)', fontWeight: 600, marginRight: '0.4rem' }}>Model answer:</span>
                      {q.modelAnswer}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-low)' }}>Self-rate:</span>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setSelfRatings(prev => ({ ...prev, [idx]: n }))}
                          style={{
                            width: 32, height: 40, borderRadius: 8,
                            border: rating >= n ? '1px solid var(--prime)' : '1px solid var(--rim)',
                            background: rating >= n ? 'rgba(240,165,0,0.15)' : 'var(--depth)',
                            color: rating >= n ? 'var(--prime)' : 'var(--ink-ghost)',
                            fontFamily: 'var(--font-mono)',
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
              fontFamily: 'var(--font-sans)',
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
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            New Config
          </button>
        </div>

        {onNavigate && <ForwardPointer label="Build your Defense Plan before the mock" tab="defense" onNavigate={onNavigate} accent="var(--prime)" />}
      </div>
    )
  }

  return null
}
