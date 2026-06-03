import { useState, useRef } from 'react'
import { trackModuleComplete } from '../analytics'
import FidelityBadge from '../components/FidelityBadge.jsx'

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
    explanation: "Target leakage occurs when features incorporate information from the future. Using only past data for rolling statistics ensures no future signal contaminates training. Production tell: offline AUC is suspiciously high (0.94 where 0.80 was the prior ceiling); model craters in live serving where the future signal is unavailable.", whatsTested: 'Whether you know rolling statistics must use only data prior to the label timestamp to avoid temporal leakage.', antiPattern: 'Option A (normalising after split) addresses scaling not temporal leakage — a different problem entirely.', staffFraming: 'Point-in-time correctness: compute features as of the label date. Any feature that peeks at the future is a production lie.' },
  {
    id: 2, domain: 'Feature Engineering',
    q: 'A categorical feature has 10,000 unique values. Which encoding strategy is most appropriate for a gradient boosted tree?',
    options: [
      'One-hot encoding',
      'Target encoding with cross-validation',
      'Target encoding applied to the full dataset before any train/test split',
      'Feature hashing to a fixed-size vector — same memory benefit as target encoding without any leakage risk',
    ],
    correct: 1,
    explanation: "Target encoding maps categories to their mean target value. Cross-validation folding prevents leakage. OHE creates 10k sparse dimensions; GBTs handle target encoding well. Feature hashing eliminates vocabulary overhead and leakage risk but introduces hash collisions that conflate unrelated categories — at 10k categories with a 2^13 hash space, collision rate is ~55%, substantially degrading the signal. In production this breaks as: model ships with full-dataset target-encoded means; rare categories (cold-start items) get mean imputed to the global average and rank randomly, spiking p0 latency errors in the ranker.", whatsTested: 'Whether you know target encoding with cross-validation is the correct strategy for high-cardinality features in GBTs.', antiPattern: 'One-hot at 10K categories creates 10K sparse columns in a tree model — the most common wrong answer.', staffFraming: 'High-cardinality + GBT = target encoding with k-fold. Without k-fold you leak the label. Classic production bug.' },
  {
    id: 3, domain: 'Feature Engineering',
    q: 'You have a feature with distribution shift between train and production. PSI = 0.35. What action do you take?',
    options: [
      'Ignore — PSI below 0.5 is acceptable',
      'Retrain the model immediately',
      'Investigate root cause, consider feature removal or recalibration',
      'Apply Platt scaling to recalibrate the model\'s output probabilities to the new distribution',
    ],
    correct: 2,
    explanation: "PSI >0.25 indicates significant shift. Investigate: data pipeline changes, upstream schema drift. Options: remove feature, apply transformation, retrain. Platt scaling recalibrates predicted probabilities, but if the input feature itself has shifted, you are fitting a calibration layer on top of structurally wrong predictions — treating the symptom not the cause. Monitoring alone and immediate retraining without root cause investigation are both incomplete responses. Production tell: PSI alert fires at 3am, on-call finds null rate spiked from 0.2% to 34% on a key feature — upstream team changed a column name and null-imputation masked it for two weeks.", whatsTested: 'Whether you know PSI > 0.25 indicates major distribution shift requiring root cause investigation, not just retraining.', antiPattern: 'PSI < 0.1 is green. PSI 0.1-0.25 is yellow (monitor). PSI > 0.25 is red — significant shift, investigate cause first.', staffFraming: 'PSI = 0.35 means significant distribution shift. Do not just retrain — first understand WHY the feature shifted.' },
  // Model Evaluation
  {
    id: 4, domain: 'Model Evaluation',
    q: 'AUC-ROC is 0.95 on test set but precision at top 1% is only 0.12. What does this suggest?',
    options: [
      'The model is excellent across all thresholds',
      'Class imbalance makes AUC misleading; precision-recall metrics are more informative',
      'AUC-PR would likely agree with AUC-ROC here since both are threshold-independent metrics',
      'The model has high recall but low specificity',
    ],
    correct: 1,
    explanation: "With severe class imbalance, AUC-ROC can be inflated by easy negatives. AUC-PR would NOT agree — it is explicitly sensitive to imbalance because it focuses on the positive class, and low precision@top 1% directly predicts a low AUC-PR. Precision-recall metrics and precision@K are more relevant for top-K prediction tasks. Production tell: AUROC looks great at 0.97 but Precision@100 is 2% — model is ranking fraudulent transactions below thousands of easy negatives it correctly ignores.", whatsTested: 'Whether you know high AUC with low precision@1% means the model ranks well globally but fails at the top of the list.', antiPattern: 'High AUC feels like the model is working well — it is, in aggregate. The precision@1% tells you it fails where decisions are made.', staffFraming: 'AUC measures global ranking quality. Precision@K measures performance at your operating threshold. High AUC + low P@K = miscalibrated threshold.' },
  {
    id: 5, domain: 'Model Evaluation',
    q: "You're tuning a fraud model. A false negative costs $500, a false positive costs $5. How do you set the classification threshold?",
    options: [
      'Maximize F1 score',
      'Use the default 0.5 threshold',
      'Lower the threshold to increase recall, weighted by cost ratio',
      'Maximize precision@K where K is fixed to the capacity of your fraud review team',
    ],
    correct: 2,
    explanation: "Cost-sensitive threshold: set threshold where expected cost is minimized. FN cost 100x FP means we should recall aggressively. Lower threshold = higher recall = fewer costly FN. Precision@K is a valid capacity-constrained approach but it optimizes for a fixed review volume — it doesn't account for the actual cost asymmetry, which can change the optimal operating point. Maximizing F1 treats FP and FN costs equally (both cost 1), which is wrong when costs are 100:1. Production tell: default 0.5 threshold ships; oncall receives escalation that high-severity fraud cases are being missed at 60% rate because nobody set the threshold for the actual cost ratio.", whatsTested: 'Whether you know to optimize threshold by expected cost, not F1, when false negative and false positive costs are asymmetric.', antiPattern: 'Maximizing F1 treats FP and FN as equally costly — wrong when FN costs 100× more than FP.', staffFraming: 'Threshold = point where expected cost is minimized. FN 100× more expensive means recall aggressively. F1 is only right when costs are symmetric.',
  },
  {
    id: 6, domain: 'Model Evaluation',
    q: 'What is the primary risk of using accuracy as the sole metric for a dataset with 99% negative class?',
    options: [
      'It over-penalizes false positives',
      'A model predicting all negatives achieves 99% accuracy with zero predictive value',
      'It penalizes all misclassifications equally, regardless of asymmetric class costs',
      'Accuracy degrades as a metric when classes are imbalanced because the denominator includes too many easy negatives, making even AUC-ROC unreliable in this regime',
    ],
    correct: 1,
    explanation: "With 99% negative class, a trivial classifier gets 99% accuracy. Use precision, recall, F1, or AUC-PR which are explicitly sensitive to the positive class. AUC-ROC is actually more robust to class imbalance than accuracy — it measures ranking quality across all thresholds and is not fooled by an all-negative classifier (which would score AUC-ROC = 0.5). Option C is also true but secondary — accuracy's deeper flaw is that it conflates easy-to-predict negatives with actual model quality. Production tell: model accuracy dashboard shows 99.1% and stakeholders celebrate; fraud team reports zero detections in two weeks — model is predicting all-negative.", whatsTested: 'Whether you know accuracy is meaningless for imbalanced datasets — a trivial always-negative model achieves 99%.', antiPattern: 'AUC is better than accuracy but is still influenced by true negative count at extreme imbalance.', staffFraming: 'At 99% negative rate: 99% accuracy means nothing. Use PR-AUC or F1 at your operating threshold.' },
  // ML Systems
  {
    id: 7, domain: 'ML Systems',
    q: 'A model trained monthly shows degraded performance in week 3. Which monitoring signal would detect this earliest?',
    options: [
      'SHAP value distribution shift between the training window and current serving period',
      'Input feature distribution shift (PSI)',
      'Prediction score distribution shift',
      'Label drift — tracking the fraction of ground-truth positives arriving in the feedback loop',
    ],
    correct: 2,
    explanation: "Prediction score distribution shifts before business metrics degrade, with no label delay. SHAP drift detection is expensive (requires running the explainer on live traffic), delayed (needs batch post-processing), and measures attribution rather than model output quality directly. Feature PSI catches input drift but not model behavior change. Label drift monitoring is a valid technique but requires waiting for labels — in week 3 of a monthly training cycle, labels lag by days. Production tell: score histogram compresses toward 0.5 for 3 days before CTR drops — a feature pipeline bug was flattening variance upstream, invisible to business dashboards.", whatsTested: 'Whether you know feature drift (PSI) is the earliest upstream signal — it alerts days before prediction drift or business metrics.', antiPattern: 'Retraining on fresh data addresses the symptom without diagnosing root cause. First understand what drifted and why.', staffFraming: 'Monitoring chain: feature PSI (earliest) → prediction distribution → business KPIs (latest, slowest).' },
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
    explanation: "Retrieval (ANN/heuristics) narrows from O(millions) to O(hundreds) at low cost. Ranker then applies expensive features only to candidates. This is the standard RecSys architecture. In production this breaks as: retrieval stage has a bug silently filtering out an entire item category — ranker never sees those items, precision@K drops, and the root cause takes days to trace back past the ranker.", whatsTested: 'Whether you know two-phase serving exists to make sub-100ms inference feasible — not to improve accuracy per query.', antiPattern: 'Higher accuracy per query sounds like the goal but the real driver is latency — cross-encoder on 1M items per request is impossible.', staffFraming: 'Retrieval: fast bi-encoder narrows 1M to 100 in <20ms. Ranking: expensive cross-encoder scores 100 in <80ms.' },
  {
    id: 9, domain: 'ML Systems',
    q: 'Your batch prediction pipeline must complete within 2 hours for 100M users. Spark job takes 6 hours. What is your first optimization?',
    options: [
      'Switch to a larger instance type',
      'Increase the number of output partitions to reduce task size and improve parallelism',
      'Investigate data skew — hot keys cause stragglers',
      'Cache the model weights in broadcast variable',
    ],
    correct: 2,
    explanation: "In distributed systems, 80% of slowdowns come from skew. A few hot keys (e.g., superusers) overwhelm specific partitions. Salt the join key or repartition by user cohort. Increasing output partitions helps only if all tasks take similar time — with skew, one partition still processes the hot key and takes the same time. Broadcasting model weights is useful but secondary — if the model is already in memory, re-broadcasting it won't help the straggler. Production tell: Spark job hangs at 99% for 4 hours; one executor is processing the top-10 users who each have 50M events while 199 executors sit idle.", whatsTested: 'Whether you know data skew (hot keys) is the most common cause of Spark job stragglers, not raw parallelism.', antiPattern: 'Adding more partitions or a larger instance helps symmetric slowness — with skew, the hot partition still processes the same hot key regardless.', staffFraming: 'Spark hangs at 99% for hours = data skew. Profile partition sizes first, then salt the join key or repartition by cohort.',
  },
  // Statistics & Probability
  {
    id: 10, domain: 'Statistics & Probability',
    q: 'You run 20 A/B tests simultaneously. How many would you expect to show p<0.05 by chance?',
    options: ['0', '1', '5', '10'],
    correct: 1,
    explanation: "With α=0.05 and 20 independent tests, expected false positives = 0.05 × 20 = 1. Apply Bonferroni correction (α/20 = 0.0025) or Benjamini-Hochberg FDR control. In production this breaks as: team runs 20 metric slices on a single A/B test, finds one p=0.03 slice, ships the feature, and the lift evaporates in follow-up experiment — it was the expected false positive.", whatsTested: 'Whether you know running 20 tests at alpha=0.05 expects 1 false positive by chance — multiple comparisons inflate Type I error.', antiPattern: 'The answer (1) follows from 20 × 0.05 = 1. This is the core multiple comparisons problem.', staffFraming: 'With 20 tests at alpha=0.05 expect 1 false positive. Bonferroni: use alpha/20 = 0.0025 per test.' },
  {
    id: 11, domain: 'Statistics & Probability',
    q: 'Which distribution best models the time between user events in a recommendation system?',
    options: ['Normal', 'Weibull — it generalizes exponential and models hazard rate changes over time', 'Exponential', 'Uniform'],
    correct: 2,
    explanation: "Inter-arrival times for Poisson processes follow an exponential distribution — it assumes a constant hazard rate (memoryless property). The Weibull distribution is a common wrong answer here: it is more flexible (models increasing or decreasing hazard rates) and used in survival analysis, but for a simple Poisson process model the exponential is both correct and sufficient. Production tell: time-to-purchase model fitted with Gaussian residuals shows systematic underestimation for high-value users whose inter-event times have heavy right tails.", whatsTested: 'Whether you know the exponential distribution models memoryless inter-event times — constant hazard rate.', antiPattern: 'Normal distribution seems intuitive for time-based data but inter-event times are non-negative and right-skewed.', staffFraming: 'Exponential: memoryless property. P(T>s+t|T>s) = P(T>t). Constant hazard rate — good for session inter-arrivals.' },
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
    explanation: "Frequentist confidence intervals: the procedure produces intervals that contain the true parameter 95% of the time across repeated samples. This specific interval may or may not contain the truth. In production this breaks as: analyst tells stakeholder the CI means there is 95% chance the true lift is inside the interval; ship decision is made on a misinterpretation — the realized effect is outside the CI.", whatsTested: 'Whether you know a bootstrap CI means 95% of such intervals from repeated sampling would contain the true parameter.', antiPattern: 'The true mean lies in this interval with 95% probability is the classic frequentist CI misinterpretation.', staffFraming: 'Bootstrap CI: the interval is fixed; the parameter is fixed. The 95% refers to the long-run frequency of the procedure.' },
  // Deep Learning
  {
    id: 13, domain: 'Deep Learning',
    q: 'Gradient vanishing in a deep network is most effectively addressed by:',
    options: [
      'Increasing learning rate',
      'Using sigmoid activations throughout',
      'Residual connections (skip connections)',
      'Applying gradient clipping — capping gradient norms prevents them from vanishing to near-zero in early layers',
    ],
    correct: 2,
    explanation: "Residual connections (ResNet-style) allow gradients to flow directly through skip paths, bypassing saturating nonlinearities. Batch normalization also helps by normalizing pre-activations, reducing saturation. Sigmoid worsens vanishing due to saturation in its tails. Gradient clipping addresses the opposite problem — exploding gradients — and actively makes vanishing worse by limiting the magnitude of already-small signals. Production tell: training loss plateaus after epoch 2 on a 20-layer network; gradient norms logged per layer show near-zero norms in the first 5 layers — no skip connections, sigmoid activations throughout.", whatsTested: 'Whether you know residual connections (skip connections) are the primary solution to vanishing gradients in deep networks.', antiPattern: 'Dropout reduces overfitting but does not address vanishing gradients — it actually makes gradient flow harder.', staffFraming: 'ResNets: skip connections provide gradient highways. The gradient flows directly to early layers without multiplicative attenuation.' },
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
    explanation: "BatchNorm normalizes across the batch dimension — problematic for variable-length sequences and small batches (e.g., in autoregressive decoding). LayerNorm normalizes across feature dim, independent of batch. In production this breaks as: model trained with batch_size=256 performs well offline but degrades at serving with batch_size=1; BatchNorm running stats diverge from single-sample inference statistics.", whatsTested: 'Whether you know LayerNorm is batch-size independent — critical for transformers with variable-length sequences.', antiPattern: 'BatchNorm stores running statistics that depend on batch size and can be unreliable at inference with batch_size=1.', staffFraming: 'LayerNorm: normalise over features per position independently. BatchNorm: normalise over the batch. Transformers use LayerNorm.' },
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
    explanation: "High temperature T flattens the teacher's output distribution, revealing relative similarities between classes (dark knowledge). Student learns richer structure than from one-hot hard labels. Production tell: student distilled at T=1 (hard labels) matches teacher on head classes but degrades 18% on tail classes where the teacher's soft probabilities carried the most information.", whatsTested: 'Whether you know temperature > 1 softens the distribution, making soft targets more informative for the student.', antiPattern: 'High temperature making learning harder reverses the mechanism — high T softens the distribution and enriches the supervision signal.', staffFraming: 'Temperature T: soft targets = softmax(logits/T). High T → softer distribution → more information in non-target classes.' },
  // MLOps
  {
    id: 16, domain: 'MLOps',
    q: 'Which deployment strategy allows you to gradually shift traffic to a new model while monitoring metrics?',
    options: [
      'Blue-green deployment',
      'Shadow deployment',
      'Canary deployment',
      'Feature flag rollout — enable the new model only for users where the feature flag is true, expanding the flag gradually',
    ],
    correct: 2,
    explanation: "Canary: route X% of traffic to new model, monitor metrics, gradually increase %. Blue-green: instant switch (less gradual). Shadow: new model runs but responses aren't served (no user impact). Feature flag rollout is a valid user-targeting mechanism but it is not traffic splitting at the infrastructure level — it is user-segment filtering, which can introduce selection bias when the segment expands. In production this breaks as: team does blue-green switch on a model with a latency regression; p99 latency triples for all users simultaneously with no gradual signal — canary would have caught it at 1% traffic.", whatsTested: 'Whether you know canary deployment gradually shifts traffic while monitoring, enabling rollback before full exposure.', antiPattern: 'Blue-green deployment is an all-or-nothing switch with no gradual traffic shift or monitoring window.', staffFraming: 'Canary: 1% → 5% → 20% → 100% with monitoring gates at each stage. Blue-green: switch everything at once.' },
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
    explanation: "Champion-challenger comparison: new model must beat production on held-out data with statistical significance. Plus: data validation, integration tests, latency benchmarks. In production this breaks as: model passes offline eval but fails latency benchmark — feature store call added 80ms to p99; goes to production anyway because latency check was not in the gate, causing SLA breach.", whatsTested: 'Whether you know model evaluation against the current champion on held-out data is mandatory before production promotion.', antiPattern: 'Code coverage testing catches software bugs but does not validate that the model actually performs better.', staffFraming: 'CI gate: challenger must beat champion by a statistically significant margin on held-out test. Anything less is a regression.' },
  {
    id: 18, domain: 'MLOps',
    q: 'What is concept drift in production ML?',
    options: [
      "Input feature distributions shift — P(X) changes while P(Y|X) stays stable",
      'The relationship between input features and target variable changes over time',
      'Prior probability shift — P(Y) changes over time while the conditional P(Y|X) stays stable',
      'API endpoints change breaking client calls',
    ],
    correct: 1,
    explanation: "Concept drift: P(Y|X) changes — the mapping from features to labels shifts. E.g., user behavior patterns shift post-COVID. Covariate drift (P(X) changes) is option A. Prior probability shift (P(Y) changes) — option C — is a real, distinct phenomenon (e.g., base fraud rate increases) but the conditional relationship P(Y|X) stays intact; recalibration can address it without full retraining. Production tell: feature distributions look stable (PSI < 0.1) but model precision drops 12 points over 6 weeks — user intent has shifted while the input signals remain the same.", whatsTested: 'Whether you know concept drift is the feature-to-target relationship changing — not just feature distribution.', antiPattern: 'Data drift (covariate shift) is the feature distribution changing. Concept drift is specifically P(Y|X) changing.', staffFraming: 'Concept drift: P(Y|X) changes. Data drift: P(X) changes. Both cause degradation but require different responses.' },
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
    explanation: "NDCG@K = DCG@K / IDCG@K. DCG discounts relevance by log2(rank+1), rewarding top-ranked relevant items. Normalized by ideal DCG enables comparison across queries. Production tell: offline NDCG@10 improves 2% but online CTR is flat — the model is improving rank 6-10 positions where discount factors make NDCG sensitive but users rarely scroll.", whatsTested: 'Whether you know NDCG@K applies log-discounting to reward high positions more — rank 1 is worth far more than rank 10.', antiPattern: 'Mean average precision is a related metric but uses equal position weighting within K, not log-discounting.', staffFraming: 'NDCG@K = DCG@K / IDCG@K. DCG = sum rel_i / log2(i+1). Rank 1 contributes 1.0, rank 10 contributes 0.29.' },
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
    explanation: "ANN algorithms (HNSW, IVF-PQ) reduce exact search cost by trading recall. HNSW: high recall, high memory. IVF-PQ: lower memory via quantization, slightly lower recall. Tune ef_search for recall/latency tradeoff. In production this breaks as: HNSW index built on 100M items exhausts instance memory at serving; recall@100 drops 15% after switching to IVF-PQ without retuning ef_search for the new index type.", whatsTested: 'Whether you know ANN trades recall for speed — accepting a small number of missed true neighbours for large throughput gains.', antiPattern: 'ANN does not trade accuracy for storage. It trades recall for query speed. Storage is often larger than flat indexes.', staffFraming: 'Exact KNN: O(n) per query. ANN (HNSW, IVF): O(log n) per query. Recall@10: typically 95-99% with 10-100x speedup.' },
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
    explanation: "Pointwise: regress/classify each item independently. Pairwise: compare item pairs. Listwise: optimize the whole list ordering (e.g., LambdaMART optimizes NDCG directly). Listwise best aligns with ranking metrics. Production tell: pointwise model trained on CTR shows high recall but poor NDCG — it ranks all high-CTR items equally without differentiating their relative order within a slate.", whatsTested: 'Whether you know listwise loss optimises the ranking metric over the full document list, not just pairs or individual items.', antiPattern: 'Pointwise approaches treat ranking as binary classification and miss relative ordering between documents.', staffFraming: 'Listwise (LambdaRank): gradient weighted by NDCG change from swapping i and j. Directly optimises the end metric.' },
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
    explanation: "CUPED uses pre-experiment covariate (e.g., pre-period metric) to reduce residual variance: Y_cuped = Y - θ·X_pre. Same expected value, lower variance → smaller MDE → shorter experiments. In production this breaks as: CUPED applied but pre-period covariate is correlated with treatment assignment (novelty effect users had higher pre-period activity); variance reduction is real but θ is biased, inflating estimated lift.", whatsTested: 'Whether you know CUPED uses pre-experiment covariates to reduce variance, giving more power without more users.', antiPattern: 'Increasing sample size also reduces variance but costs more. CUPED achieves the same effect from existing data.', staffFraming: 'CUPED: regress out the pre-experiment metric. Reduces variance by 20-50%. More power, same sample size, no extra cost.' },
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
    explanation: "Conflicting metrics require pre-defined OEC or guardrail thresholds. Define: engagement is a primary metric, revenue is a guardrail. If guardrail is violated, do not ship regardless of primary metric lift. In production this breaks as: team ships because engagement is up 4%; revenue guardrail was never defined pre-experiment; post-ship analysis shows revenue down 2%, but guardrail threshold debate happens after the fact.", whatsTested: 'Whether you know a guardrail metric breach overrides the success metric — you do not ship even if engagement is up.', antiPattern: 'Picking the metric that matters more misframes the situation — guardrail metrics are hard stops, not choices to weigh.', staffFraming: 'Guardrails are non-negotiable. Engagement up but revenue down = investigate before shipping anything.' },
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
    explanation: "Switchback: used in marketplace settings (e.g., Uber surge pricing) where all users in a market must receive the same treatment. Alternate treatment/control by time window, account for carryover effects. In production this breaks as: switchback windows set to 1 hour; driver positioning decisions from treatment window carry over into control windows for 2+ hours, contaminating the control measurement with treatment effects.", whatsTested: 'Whether you know switchback experiments alternate treatment and control across time periods for units that cannot be randomised independently.', antiPattern: 'User-level randomisation assumes SUTVA — switchback is for when SUTVA is violated by shared supply or network effects.', staffFraming: 'Switchback: treat all users in period A, control in period B, alternate. Correct for marketplace supply-side experiments.' },
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
    explanation: "Window functions with ROWS UNBOUNDED PRECEDING compute cumulative aggregates without collapsing rows. PARTITION BY resets the running total per group. In production this breaks as: missing PARTITION BY on a revenue cumsum query produces a single running total across all users; the query returns one row per transaction with a global cumsum, silently wrong — no error thrown.", whatsTested: 'Whether you know SUM() OVER (ORDER BY ...) computes a running total as a window function.', antiPattern: 'GROUP BY with SUM collapses rows into groups instead of computing a running total per row.', staffFraming: 'Running total: SUM(amount) OVER (PARTITION BY user_id ORDER BY ts ROWS UNBOUNDED PRECEDING). Returns value per row.' },
  {
    id: 26, domain: 'SQL & Data',
    q: 'You need to find users who made a purchase within 7 days of their first visit. Most efficient approach?',
    options: [
      'Self-join on user_id with date difference filter',
      'Correlated subquery for each user',
      'Full table scan with WHERE clause',
      'Unnested lateral join over all visit/purchase event pairs, filtered to the earliest visit date',
    ],
    correct: 0,
    explanation: "Self-join: JOIN first_visit_table ON user_id AND purchase_date BETWEEN first_visit_date AND first_visit_date+7. Use indexed columns. Correlated subquery is O(N²). In production this breaks as: correlated subquery version runs overnight on 50M users before timing out; self-join on unindexed purchase_date still takes 4 hours — adding a composite index on (user_id, purchase_date) drops it to 8 minutes.", whatsTested: 'Whether you know self-joining on the first_visit CTE and filtering purchases within a 7-day window is the efficient approach.', antiPattern: 'A correlated subquery with DATEDIFF works but is extremely slow at scale — the CTE + join approach is far more efficient.', staffFraming: 'Pattern: WITH first_visit AS (SELECT user_id, MIN(ts)...) JOIN purchases ON ... AND DATEDIFF <= 7.' },
  {
    id: 27, domain: 'SQL & Data',
    q: 'A query with SELECT DISTINCT on 100M rows is slow. Best optimization strategy?',
    options: [
      'Partition the table by user_id and run DISTINCT within each partition to parallelize deduplication',
      'Use GROUP BY instead (often better optimized by query planners)',
      'Increase memory allocation',
      'Switch to a subquery',
    ],
    correct: 1,
    explanation: "GROUP BY can be better optimized than DISTINCT in many query planners (e.g., hash aggregation vs. sort-based dedup). Also consider: is DISTINCT truly needed? Can you filter earlier? Production tell: DISTINCT query spills to disk on a 1B-row table; rewriting as GROUP BY with early WHERE filter reduces shuffled data by 70% and eliminates the spill.", whatsTested: 'Whether you know DISTINCT on high-cardinality data requires full scan + sort or hash — indexes barely help.', antiPattern: 'Adding an index on the DISTINCT column helps marginally but does not fix the fundamental O(n log n) scan.', staffFraming: 'SELECT DISTINCT on 100M rows = full scan + sort or hash. Partition pruning + pre-aggregation is the production fix.' },
  // Optimization
  {
    id: 28, domain: 'Optimization',
    q: 'Adam optimizer vs. SGD with momentum: when is SGD preferred?',
    options: [
      'When batch sizes are very small, since Adam\'s variance estimates become unreliable at low sample counts',
      'When training very large transformers where Adam\'s per-parameter state doubles memory cost',
      'When generalization is critical — SGD often finds flatter minima that generalize better',
      'When training speed is the priority',
    ],
    correct: 2,
    explanation: "Adam converges faster but often to sharper minima (higher test loss). SGD+momentum with learning rate warmup and cosine decay finds flatter minima. Many production vision models use SGD for final training. Memory cost is a real reason to avoid Adam on very large models, but it doesn't predict the shape of the minimum found — it motivates Adafactor or Lion rather than SGD. Production tell: Adam-trained model has 0.5% lower val loss than SGD but 1.8% higher test loss on held-out distribution — the sharp minimum does not generalize.", whatsTested: 'Whether you know SGD with momentum often generalises better than Adam on vision tasks despite slower convergence.', antiPattern: 'Adam converges faster but finds sharper minima — SGD with momentum often beats Adam on held-out CV performance.', staffFraming: 'Adam: fast convergence, sharp minima. SGD+momentum: flatter minima, often better CV generalisation. NLP/recommendation: Adam wins.' },
  {
    id: 29, domain: 'Optimization',
    q: 'What is gradient clipping and why is it used in RNN/transformer training?',
    options: [
      'Removing gradients below a threshold to speed up training',
      'Capping gradient norms to prevent exploding gradients from destabilizing training',
      'Zeroing gradients for specific layers during fine-tuning',
      'Scaling gradients by the inverse of their variance to normalize step sizes across parameter groups — equivalent to per-layer learning rate adaptation',
    ],
    correct: 1,
    explanation: "Exploding gradients (common in RNNs, transformers on long sequences) cause parameter updates to diverge. Clip by global norm: scale all gradients uniformly when ||g|| > threshold. Per-layer learning rate adaptation is what adaptive optimizers like Adam and RMSProp do — it is unrelated to clipping, which is a one-shot magnitude bound not a per-parameter normalization. Production tell: training loss spikes to NaN at step 1200 of a 10k-step run; gradient norm logs show ||g|| hitting 1e6 two steps before the NaN — clip threshold was missing from the optimizer config.", whatsTested: 'Whether you know gradient clipping prevents exploding gradients by capping the norm before the update step.', antiPattern: 'Weight decay prevents overfitting but does not address training instability from exploding gradients.', staffFraming: 'Gradient clipping: if ||g|| > max_norm, g = g × (max_norm/||g||). Essential for RNNs and transformers.' },
  {
    id: 30, domain: 'Optimization',
    q: 'Learning rate warmup in transformer training serves what purpose?',
    options: [
      'Prevents the model from memorizing early training examples',
      'Stabilizes training in early steps when weight initialization produces high-variance gradients',
      'Reduces the total number of training steps needed',
      'Acts as implicit curriculum learning — low LR in early steps biases the model toward easy examples that appear first in the shuffled dataset',
    ],
    correct: 1,
    explanation: "At initialization, weights are random and gradients are noisy. High LR early → large unstable updates. Warmup starts with tiny LR, increases linearly. Prevents early divergence, especially with Adam which has cold momentum estimates in early steps. Warmup has nothing to do with example ordering or curriculum effects — it is purely about taming the optimizer's behavior during the cold-start phase. Production tell: fine-tuning a pretrained model with full LR from step 0 causes catastrophic forgetting in the first 100 steps; loss recovers but pretrained features are destroyed, final accuracy 6% below baseline.", whatsTested: 'Whether you know LR warmup prevents instability in early training when weights are random and gradients are unreliable.', antiPattern: 'Warmup has nothing to do with preventing overfitting — it addresses early training instability from random initialisation.', staffFraming: 'Warmup: start with tiny LR, increase linearly to target LR over first N steps. Then decay. Standard for transformers.' },
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
    explanation: "Performing RFE on the full dataset before CV means the feature selector has seen the validation folds labels, a form of selection leakage. Always nest RFE inside the CV loop. Production tell: nested CV AUC is 0.76; outer-only RFE CV reports 0.84 — the 8-point gap is pure selection leakage that vanishes when the model hits unseen production data.", whatsTested: 'Whether you know that feature selection on the full dataset before CV leaks validation fold labels into the selection step.', antiPattern: 'RFE before CV is taught as standard practice — the selection bias silently inflates apparent performance by up to 8 AUC points.', staffFraming: 'Nest feature selection inside the CV loop. The gap between nested and non-nested CV is exactly the magnitude of the selection leak.',
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
    explanation: "Linear models assume roughly Gaussian residuals and are sensitive to outliers; heavy right-skew creates extreme values that disproportionately influence gradient updates and coefficient estimation. In production this breaks as: insurance claim model trained on raw claim amounts; a single $10M outlier claim dominates the loss, pulling coefficients so far that median predictions are off by 40%.", whatsTested: 'Whether you know linear models are distorted by heavy-tailed distributions because outliers dominate gradient updates and coefficient estimation.', antiPattern: 'Thinking tree-based models need the same log-transform treatment — trees split at thresholds and are inherently invariant to monotone feature transforms.', staffFraming: 'A single $10M outlier dominates gradients without transform. Log-transform compresses the scale while preserving ordinality — linear models need this, trees do not.',
  },
  {
    id: 33, domain: 'Feature Engineering',
    q: 'You engineer a "days since last purchase" feature. In production, new users have NULL for this field. What is the correct strategy?',
    options: [
      'Impute with mean days since last purchase from the training set',
      'Impute with a sentinel value (e.g., 9999) and add a binary "is_new_user" indicator feature',
      'Impute with training mean and apply the is_new_user flag only during training, not at serving time',
      'Fill with zero — new users have zero days since last purchase',
    ],
    correct: 1,
    explanation: "NULL here is structurally meaningful (user has no purchase history), not missing at random. A sentinel + indicator lets the model learn a separate effect for new users vs. lapsed users with large gaps. Applying the is_new_user flag only during training but not serving is training-serving skew — the model sees that feature at train time but receives no signal at inference, causing silent mispredictions for exactly the new users that matter most. In production this breaks as: NULLs imputed with mean days_since_purchase (e.g., 45 days); new users look identical to average-lapsed users, suppressing a strong new-user conversion signal the model could have learned.", whatsTested: 'Whether you know structurally missing values (MNAR) require sentinel + indicator, not mean imputation which destroys the signal.', antiPattern: 'Mean imputation makes new users look like average-lapsed users — the model loses the ability to distinguish the highest-value cohort.', staffFraming: 'NULL here means no history exists — that is structurally different from a 45-day lapsed user. Sentinel + indicator lets the model learn both effects separately.',
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
    explanation: "ECE bins predictions by confidence, then computes a weighted average of |accuracy - confidence| per bin. A perfectly calibrated model at 0.7 probability means 70% of those predictions are correct. In production this breaks as: fraud model outputs 0.9 scores; ops team assumes 90% precision and deprioritizes manual review — actual precision is 60% due to class imbalance and no calibration step.", whatsTested: 'Whether you know ECE measures calibration — the gap between predicted probabilities and actual event frequencies.', antiPattern: 'AUC is the classic wrong answer — it measures discrimination (ranking quality), not calibration (probability accuracy).', staffFraming: 'ECE: bin predictions into 10 buckets, compare predicted rate vs actual rate. Perfect calibration lies on the diagonal.' },
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
    explanation: "Platt scaling fits a parametric sigmoid — fast but assumes a monotone miscalibration pattern. Isotonic regression is non-parametric and flexible, but prone to overfitting on small calibration sets. In production this breaks as: isotonic regression fitted on 500 calibration samples produces a non-monotone mapping; scores in [0.6, 0.7] get mapped lower than scores in [0.5, 0.6], reversing rank order for a score band.", whatsTested: 'Whether you know Platt scaling is better for small datasets and isotonic regression is better for large ones.', antiPattern: 'Platt scaling is always safer is wrong — it assumes a sigmoid shape that may not fit complex score distributions.', staffFraming: 'Platt: logistic on scores, limited by sigmoid assumption. Isotonic: stepwise monotone, more flexible but needs more data.' },
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
    explanation: "Offline metrics on logged data suffer from position bias and selection bias — users only interact with what was shown. Online gains depend on actual user response to new orderings, which offline data cannot capture. In production this breaks as: new ranker improves offline NDCG 3% but online A/B shows -1% CTR; model learned to exploit position bias in logged data, surfacing items that were clicked because they were rank-1, not because they were relevant.", whatsTested: 'Whether you know offline metrics on logged data cannot capture counterfactual user responses to new rankings — selection and position bias make them poor predictors of online gains.', antiPattern: 'Blaming AUC-ROC as a poor metric misses the root cause — the issue is evaluation data contaminated by position bias, not the metric choice.', staffFraming: 'Offline NDCG on logged data measures how well you reproduce the current policy, not how users would respond to a new ordering. Online A/B is the only truth.',
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
    explanation: "Schema registries (e.g., Confluent) enforce compatibility rules. Forward compatibility means new writers, old readers — deploy consumers first, then producers, to avoid deserialization failures. In production this breaks as: producer deployed first with a new required field; old consumer throws deserialization exception on every message; feature pipeline goes dark for 40 minutes until rollback completes.", whatsTested: 'Whether you know Kafka schema evolution requires a schema registry with backward/forward compatibility contracts.', antiPattern: 'Ignoring new fields on the consumer works until the schema becomes incompatible — not a durable solution.', staffFraming: 'Avro + schema registry: backward compatibility allows old consumers to read new data. Forward allows new consumers to read old data.' },
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
    explanation: "Online feature stores precompute batch features into key-value stores optimized for microsecond point lookups. On-the-fly computation cannot meet single-digit millisecond SLAs for complex features. In production this breaks as: feature computed on-the-fly by joining 3 tables at serving time; p99 latency is 220ms vs. 8ms SLA — feature store lookup would be 0.5ms, but the batch pipeline was never built.", whatsTested: 'Whether you know serving p99 latency is dominated by sequential feature store lookups, not model inference.', antiPattern: 'GPU inference sounds like the bottleneck but model inference is typically 1-5ms. Network round-trips dominate.', staffFraming: 'Profile first. At p99 < 10ms: ~1ms model inference, ~5ms feature store lookups. Batch the lookups to stay within budget.' },
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
    explanation: "ONNX tracing captures operations on a specific input; dynamic Python control flow (data-dependent branching, variable-length loops) is not captured. Use torch.jit.script or rewrite with torch.where for static graphs. In production this breaks as: model traced with a short input silently takes the short-sequence branch for all inputs; long sequences trigger wrong computation path, producing nonsense scores with no exception thrown.", whatsTested: 'Whether you know ONNX export fails when a custom layer has non-standard control flow or operators not in the ONNX spec.', antiPattern: 'Missing CUDA support is a hardware issue — ONNX export is a graph serialisation problem independent of GPU availability.', staffFraming: 'ONNX export traces the computational graph. Dynamic control flow on tensor shapes cannot be statically traced.' },
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
    explanation: "The t-test assumes normality of the sampling distribution of the mean (CLT helps for means). For non-standard statistics like median, Gini coefficient, or AUC, bootstrapping empirically estimates the sampling distribution without parametric assumptions. In production this breaks as: t-test applied to revenue-per-user (heavy right tail, Gini target); p-value is 0.04 but bootstrapped CI crosses zero — the parametric assumption inflated significance, and the result does not replicate.", whatsTested: 'Whether you know bootstrap CIs are preferred for small samples or heavy-tailed distributions where CLT assumptions break.', antiPattern: 'Bootstrap is computationally expensive but correctness matters more than compute cost here.', staffFraming: 'Bootstrap makes no distributional assumptions. For revenue (heavy-tailed), bootstrap CIs are typically wider and more accurate.' },
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
    explanation: "P-values are not posterior probabilities of hypotheses. They measure how surprising the data is under H0. Small p-value → data is unlikely under H0 → reject H0. This says nothing about practical significance. In production this breaks as: A/B test on 50M users yields p=0.001 for a 0.003% revenue lift — statistically significant, shipped, but engineering cost to maintain the feature exceeds the revenue impact by 10x.", whatsTested: 'Whether you know the p-value is the probability of data this extreme IF the null is true — not the probability the null is true.', antiPattern: 'p=0.03 meaning 3% chance the null is true is the most common p-value misinterpretation in industry.', staffFraming: 'Correct: if H0 is true, we would see a result this extreme only 3% of the time. The null is either true or false.' },
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
    explanation: "Bayesian decision theory uses expected loss, not just posterior probability. If B is 4% likely to be worse but the downside is catastrophic (e.g., revenue loss), expected loss may exceed your risk tolerance even at 96% confidence. Production tell: team ships at 95% probability of improvement; the 5% downside scenario materializes — revenue drops 8% for a week because expected loss was never computed against downside magnitude.", whatsTested: 'Whether you know P(B > A) = 0.96 does not account for expected loss if B is actually worse.', antiPattern: 'Shipping at P(B>A) >= 0.95 misses the magnitude — how much worse if B is actually inferior?', staffFraming: 'Bayesian decision: consider both P(B>A) and expected loss if wrong. High confidence does not mean zero risk.' },
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
    explanation: "Autoregressive decoding recomputes K,V for all past tokens each step without a cache — O(n²) total. KV cache stores these projections, making each new token O(n) attention instead of O(n²) recomputation. In production this breaks as: serving system disabled KV cache to save GPU memory; 512-token generation goes from 80ms to 6 seconds p99 — KV cache memory cost is linear but the compute saving is quadratic.", whatsTested: 'Whether you know KV cache avoids recomputing key/value projections for all previous tokens at each generation step.', antiPattern: 'Reducing training compute is unrelated — KV cache is an inference-time optimisation for autoregressive generation.', staffFraming: 'KV cache: store K,V for all past tokens. Each new token computes only its own Q, then attends to cached K,V.' },
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
    explanation: "Standard backprop stores all forward activations for gradient computation, consuming O(layers) memory. Checkpointing stores only checkpoint activations and recomputes intermediate values during backward, reducing memory at the cost of ~33% extra compute. In production this breaks as: training a 7B model on A100-80GB OOMs at batch_size=4 without checkpointing; enabling it allows batch_size=16 with only 28% training throughput reduction, well worth the tradeoff.", whatsTested: 'Whether you know gradient checkpointing trades extra compute for reduced activation memory during training.', antiPattern: 'Gradient checkpointing reduces memory not compute — it actually increases compute by approximately 33%.', staffFraming: 'Checkpoint: store only certain activations, recompute others during backward. Memory: O(sqrt(n)). Compute: +33%.' },
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
    explanation: "Each attention head computes QKᵀ which is (L × d_k) × (d_k × L) = O(L² × d_k). Across all heads: O(L² × d_model). This quadratic scaling in L is why long-context transformers need sparse/linear attention variants. In production this breaks as: context length doubled from 2K to 4K tokens; attention memory quadruples, batch size must halve, throughput drops 60% — linear attention or sliding-window attention needed for cost-effective scaling.", whatsTested: 'Whether you know self-attention complexity is O(L^2) in both time and memory — the scaling bottleneck at long context.', antiPattern: 'O(n log n) is a common guess — attention is actually O(L^2 × d) where d is the head dimension.', staffFraming: 'Attention: Q(L×d) × K(L×d)T = L×L matrix. Memory: O(L^2). At L=8K with 32 layers: 4GB just for attention.' },
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
    explanation: "SRM (detected via chi-square test on group sizes) invalidates the experiment randomization. Common causes: bots, cache hits, logging bugs, or inconsistent assignment logic. Always check SRM before analyzing results. In production this breaks as: treatment group is 8% smaller than control (p<0.001 chi-square); root cause is a CDN cache serving control content to some treatment users — lift estimate is biased by the non-random group difference.", whatsTested: 'Whether you know SRM means your randomisation is broken and the experiment result is invalid — not just approximate.', antiPattern: 'SRM is usually minor and can be adjusted for is the dangerous wrong answer — any SRM invalidates causal inference.', staffFraming: 'SRM: intended 50/50, observed 48/52. Results are invalid. Investigate: bot traffic, redirect bugs, SDK issues.' },
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
    explanation: "The Staging stage gates models through champion-challenger evaluation, integration validation, and latency checks before serving live traffic. This mirrors software release pipelines and enables rollback. In production this breaks as: model promoted directly from training to production skipping staging; a subtle preprocessing mismatch (train used median imputation, serving uses mean) causes 15% accuracy drop, only discovered after 6 hours of degraded predictions.", whatsTested: 'Whether you know a Staging tag triggers manual review and validation before Production promotion.', antiPattern: 'Staging as just an intermediate storage layer misframes it — it is a governance gate, not just a label.', staffFraming: 'Model registry lifecycle: Staging = under evaluation. Production = serving live traffic. Transition requires explicit approval.' },
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
    explanation: "Gradual latency increase without code changes typically indicates resource exhaustion: memory leaks, growing in-process caches, or degrading external dependencies (feature store, DB). Profile memory/GC and downstream service latencies. Production tell: p99 latency grows from 40ms to 180ms over 72 hours on a stable-traffic service; heap profiler shows unbounded growth in a prediction cache that has no TTL eviction policy.", whatsTested: 'Whether you know increasing p99 latency without code changes signals a resource leak or memory pressure, not a traffic spike.', antiPattern: 'Traffic increase is the first instinct but it is ruled out by the absence of code changes and expected traffic patterns.', staffFraming: 'Memory leak: p99 climbs steadily over days. Check heap dumps, connection pool exhaustion, growing caches.' },
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
    explanation: "Users are less likely to examine lower positions — clicks at rank 10 are sparse not because the item is irrelevant, but because it was not seen. Inverse propensity scoring (IPS) or regression-EM debiasing is needed for unbiased learning from clicks. In production this breaks as: model trained on raw clicks learns to always rank popular high-position items first; tail items with high relevance at rank 8-10 are never surfaced, creating a feedback loop that worsens diversity.", whatsTested: 'Whether you know position bias means clicks reflect rank position not item relevance — higher-ranked items get clicked more regardless.', antiPattern: 'Position bias causing the model to learn user preferences is the opposite — it teaches position preferences not item preferences.', staffFraming: 'Items at position 1 get clicked because they are at position 1. Fix: inverse propensity weighting in training.' },
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
    explanation: "For normalized vectors, MIPS ≡ NNS (cosine = dot product). For unnormalized embeddings, high dot product can come from large norms rather than directional alignment, requiring MIPS-specific algorithms (e.g., ScaNN, FAISS with inner product index). In production this breaks as: cosine similarity index used with unnormalized embeddings; a few high-norm item embeddings (viral items with many interactions) dominate top-K results for every user regardless of actual user preference.", whatsTested: 'Whether you know MIPS finds maximum dot product — not nearest Euclidean neighbour unless vectors are normalised.', antiPattern: 'Nearest neighbour and maximum inner product are equivalent only when all vectors lie on the unit sphere.', staffFraming: 'MIPS != NNS in general. Recommendations use MIPS (dot product = relevance). Semantic search uses NNS (cosine = direction).' },
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
    explanation: "The separation enables ANN search: precompute and index all item embeddings offline. At serving time, compute only the user embedding online, then retrieve top-K items via ANN — O(log N) vs. O(N) cross-encoder scoring. In production this breaks as: item embeddings refreshed only weekly while user embeddings update hourly; new items are invisible to retrieval for up to 7 days — a full week of missed exposure for new catalog additions.", whatsTested: 'Whether you know separate towers enable offline precomputation of item embeddings — critical for sub-10ms retrieval.', antiPattern: 'Separate towers reduce accuracy is true but misses the point — it is a deliberate tradeoff for serving feasibility.', staffFraming: 'If user and item are in one tower you cannot precompute item embeddings. Separate towers: precompute all items offline.' },
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
    explanation: "SUTVA requires that one unit treatment does not affect another outcome. In marketplaces, treating drivers differently affects riders in the same market — a SUTVA violation. Use cluster/geo randomization or switchback designs. In production this breaks as: individual rider A/B test on pricing; treatment riders get lower prices and book more trips, starving control riders of available drivers — control group conversion drops, making treatment look more impactful than it is.", whatsTested: 'Whether you know standard user randomisation fails in marketplaces because treatment affects control through shared supply.', antiPattern: 'Stratified randomisation handles imbalanced covariates — it does not fix interference between units.', staffFraming: 'Marketplace interference: treating a driver affects control riders. Use geo-level or time-based (switchback) randomisation.' },
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
    explanation: "Revenue lift could come from more orders (volume) or higher AOV (quality). Decomposition tells you mechanism — e.g., if AOV drops while orders rise, you are acquiring lower-value customers, which changes the ship decision. Production tell: +3% revenue looks like a win until decomposition shows orders +12%, AOV -8% — the feature is attracting discount seekers, long-term LTV impact is negative.", whatsTested: 'Whether you know metric decomposition reveals which component actually drove the revenue change, not just the direction.', antiPattern: 'Decomposition confirms the revenue increase but its purpose is to diagnose the mechanism.', staffFraming: 'Revenue up 5%: is it orders up 5% or AOV up 5%? Different mechanisms imply different product actions.' },
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
    explanation: "Sample size for a given power scales as 1/MDE². Halving MDE (detecting a smaller effect) requires 4x more samples to maintain the same power, because smaller signals require tighter estimation intervals. In production this breaks as: experiment designed for MDE=5% but true effect is 1%; experiment ends underpowered after 2 weeks — result is inconclusive and the team re-runs for 8 more weeks at a cost of delayed roadmap decisions.", whatsTested: 'Whether you know halving the MDE quadruples the required sample size — a quadratic not linear relationship.', antiPattern: 'Doubling sample size is the most common wrong intuition — the quadratic relationship follows directly from the formula.', staffFraming: 'n is proportional to sigma^2/MDE^2. Half the MDE → n increases 4x. Detecting smaller effects is exponentially expensive.' },
  // SQL & Data — questions 55-57
  {
    id: 55, domain: 'SQL & Data',
    q: 'A query uses a non-selective index (e.g., a boolean column) and the planner ignores it. Why?',
    options: [
      'Boolean columns cannot be indexed in SQL',
      'When a column has very few distinct values, a full table scan with parallel execution is cheaper than random I/O via the index',
      'The planner ignores any index whose cardinality ratio falls below the auto_analyze threshold — updating table statistics via ANALYZE would make the planner use it',
      'Non-selective indexes only work with composite keys',
    ],
    correct: 1,
    explanation: "Index selectivity = distinct values / total rows. For a boolean column (2 distinct values on 100M rows), each lookup fetches ~50% of the table via scattered I/O — worse than a sequential scan even with current statistics. Running ANALYZE updates the planner's cardinality estimates, but if the index is genuinely non-selective, accurate statistics will confirm the sequential scan is correct — ANALYZE fixes stale estimates, not the selectivity problem. Production tell: adding an index on is_active does not speed up the query; EXPLAIN shows sequential scan chosen by planner — a composite index on (is_active, created_at) with a date filter would have the selectivity needed.", whatsTested: 'Whether you know a non-selective boolean index is ignored by the planner because full scan is cheaper than random access.', antiPattern: 'Creating a composite index sounds like the right fix but the planner already made the right choice.', staffFraming: 'Index selectivity: a boolean column with 50/50 split is worthless. Indexes are effective only when filtering to < ~5% of rows.' },
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
    explanation: "SQL logical order: FROM → WHERE → window functions → SELECT. WHERE runs first, so LAG/LEAD only see rows that pass the WHERE clause. To lag over unfiltered data, use a subquery or CTE to apply the window before filtering. In production this breaks as: session gap analysis uses LAG after a WHERE status=active filter; gaps are computed only across active events, silently skipping churned sessions and producing a 40% underestimate of median session gap.", whatsTested: 'Whether you know window functions execute in the SELECT phase after WHERE filtering — they see only filtered rows.', antiPattern: 'Window functions processing all rows first is the reversal confusion — WHERE runs before SELECT and windows.', staffFraming: 'SQL order: FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT (windows) → ORDER BY → LIMIT.' },
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
    explanation: "If many rows in table A match many rows in table B on the join key, the result set is multiplicative. 10M × 100M = 1B worst case. Deduplicate keys before joining or use aggregation first (early aggregation pattern). In production this breaks as: joining events to user-attributes without deduplicating user_id first; one user with 500K events × 3 attribute rows produces 1.5M rows per user — total result is 300x larger than expected and OOMs the Spark job.", whatsTested: 'Whether you know a FULL OUTER JOIN producing 200M rows from 10M and 100M tables signals a wrong join condition.', antiPattern: 'The Cartesian product would be 1 trillion rows — 200M rows means a join condition exists but may be semantically wrong.', staffFraming: 'Full outer join producing n×m rows = accidental cross join or incorrect key. Investigate the join condition.' },
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
    explanation: "SGDR (Loshchilov & Hutter 2017): LR follows cosine decay then resets. Restarts act as perturbations that escape sharp minima; snapshots at each restart end can be ensembled. Especially effective for models with many local optima. Production tell: loss plateau after 20k steps despite dropping LR manually; adding cosine restarts every 5k steps drops val loss an additional 0.8% by escaping the plateau region.", whatsTested: 'Whether you know warm restarts in cosine LR help escape local minima by periodically resetting the LR.', antiPattern: 'Learning rate warmup is a different technique — SGDR uses the restart mechanism to escape local minima.', staffFraming: 'SGDR: cosine decay from LR_max to LR_min then restart at LR_max. Each cycle finds different local minima.' },
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
    explanation: "FP16 minimum positive value is ~6e-8; many gradients are smaller and flush to zero. Loss scaling multiplies the loss by a large constant (e.g., 2^15) before backward, shifting gradient magnitudes into representable FP16 range, then unscaled before the optimizer step. In production this breaks as: mixed-precision training without loss scaling; gradients in early layers flush to zero after 500 steps, model stops learning — loss plateaus at a high value and the team mistakenly attributes it to a learning rate bug.", whatsTested: 'Whether you know FP16 underflows for small gradients, requiring loss scaling to shift them into the representable range.', antiPattern: 'FP16 overflow for large values is a real problem but loss scaling specifically addresses underflow not overflow.', staffFraming: 'FP16 minimum: ~6e-5. Typical gradients: 1e-6 to 1e-4. Without scaling many gradients underflow to 0.' },
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
    explanation: "AdaGrad accumulates all squared gradients from the start — denominator grows monotonically → effective LR → 0. RMSProp/AdaDelta use an EMA (controlled by decay ρ), so only recent gradient history influences the adaptive rate. In production this breaks as: AdaGrad used for a continuously retrained model; after 30 retraining cycles on streaming data, the accumulated denominator is so large that the effective learning rate is near zero — model stops adapting to distribution shift.", whatsTested: 'Whether you know AdaDelta eliminates the need for a global learning rate by using a ratio of two running averages.', antiPattern: 'Adam also addresses AdaGrad\'s diminishing LR problem but AdaDelta specifically removes the need for a global LR.', staffFraming: 'AdaGrad: LR / sqrt(accumulated gradients^2) → LR → 0 over time. AdaDelta: ratio of running averages. No manual LR needed.' },
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

// ── Coming Soon ───────────────────────────────────────────────────────────────
const COMING_SOON = []

// ── Domain weakness helpers ───────────────────────────────────────────────────
function computeDomainAccuracy(history) {
  const domainAccuracy = {}
  history.forEach(session => {
    if (session.domainBreakdown) {
      session.domainBreakdown.forEach(({ domain, correct, total }) => {
        if (!domainAccuracy[domain]) domainAccuracy[domain] = { correct: 0, total: 0 }
        domainAccuracy[domain].correct += correct
        domainAccuracy[domain].total += total
      })
    }
  })
  return domainAccuracy
}

function SetupScreen({ onStart }) {
  const [selectedDomains, setSelectedDomains] = useState(new Set(ALL_DOMAINS))
  const [count, setCount] = useState('10')

  // Read session history for adaptive panels
  const history = (() => {
    try { return JSON.parse(localStorage.getItem('msl_trainer_history') || '[]') } catch (_) { return [] }
  })()

  const domainAccuracy = computeDomainAccuracy(history)
  const sortedDomains = Object.entries(domainAccuracy)
    .filter(([, v]) => v.total >= 3)
    .map(([d, v]) => ({ domain: d, pct: Math.round((v.correct / v.total) * 100) }))
    .sort((a, b) => a.pct - b.pct)
  const weakestDomain = sortedDomains[0]?.domain || null
  const hasHistory = history.length > 0

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
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 55%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          ML Trainer
        </h1>
        <p style={{ color: 'var(--ink-mid)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
          Sharpen your ML interview skills with targeted MCQ drills.
        </p>
        <p style={{ color: 'var(--ink-low)', marginTop: '0.3rem', fontSize: '0.8rem', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>Select your domains and question count, work through each question one at a time, then review your accuracy per domain in the debrief.</p>
        <div style={{ marginTop: '8px' }}><FidelityBadge tier="conceptual" /></div>
      </div>

      {/* ── Weak Domain Drill ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.1rem 1.35rem', marginBottom: '1.25rem',
        borderLeft: hasHistory && weakestDomain ? '3px solid var(--prime)' : '1px solid var(--rim)',
      }}>
        <p className="section-eyebrow" style={{ marginBottom: '0.75rem', color: hasHistory && weakestDomain ? 'var(--prime)' : 'var(--ink-ghost)' }}>
          Your Weak Spots
        </p>
        {!hasHistory || sortedDomains.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-ghost)', margin: 0 }}>
            Complete a session to see your weak domains here.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.9rem' }}>
              {sortedDomains.slice(0, 4).map(({ domain, pct }) => (
                <div key={domain}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-mid)' }}>{domain}</span>
                    <span style={{
                      fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                      color: 'var(--prime)',
                      fontWeight: 600,
                    }}>{pct}%</span>
                  </div>
                  <div style={{ background: 'var(--rim)', borderRadius: 99, height: 5 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 99,
                      background: 'var(--prime)',
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
            {weakestDomain && (
              <button
                onClick={() => {
                  setSelectedDomains(new Set([weakestDomain]))
                  setCount('10')
                  const pool = ALL_QUESTIONS.filter(q => q.domain === weakestDomain)
                  const final = [...pool].sort(() => Math.random() - 0.5).slice(0, 10)
                  if (final.length > 0) onStart(final)
                }}
                style={{
                  background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)',
                  borderRadius: 8, padding: '0.5rem 1.1rem',
                  fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer',
                  color: 'var(--prime)', fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
              >
                Drill Weakest: {weakestDomain}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Review Queue (Spaced Repetition) ─────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.1rem 1.35rem', marginBottom: '1.5rem',
      }}>
        <p className="section-eyebrow" style={{ marginBottom: '0.65rem' }}>
          Review Queue
        </p>
        {!hasHistory ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-ghost)', margin: 0 }}>
            No sessions yet — complete a session to build your review queue.
          </p>
        ) : (
          (() => {
            const recent = history.slice(-5)
            const recentDomainAcc = computeDomainAccuracy(recent)
            const weakRecent = Object.entries(recentDomainAcc)
              .filter(([, v]) => v.total > 0)
              .map(([d, v]) => ({ domain: d, pct: Math.round((v.correct / v.total) * 100) }))
              .sort((a, b) => a.pct - b.pct)
              .slice(0, 2)

            if (weakRecent.length === 0) {
              return <p style={{ fontSize: '0.82rem', color: 'var(--ink-ghost)', margin: 0 }}>No domain data in recent sessions.</p>
            }

            return (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-mid)', margin: '0 0 0.65rem', lineHeight: 1.5 }}>
                  Based on your last {Math.min(5, recent.length)} session{recent.length > 1 ? 's' : ''}, these domains need work:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  {weakRecent.map(({ domain, pct }) => (
                    <span key={domain} style={{
                      padding: '0.25rem 0.65rem', borderRadius: 99,
                      background: 'var(--prime-bg-light)',
                      border: '1px solid rgba(240,165,0,0.25)',
                      fontSize: '0.78rem', color: 'var(--prime)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {domain} · {pct}%
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const reviewDomains = new Set(weakRecent.map(w => w.domain))
                    const pool = ALL_QUESTIONS.filter(q => reviewDomains.has(q.domain))
                    const final = [...pool].sort(() => Math.random() - 0.5).slice(0, 10)
                    if (final.length > 0) onStart(final)
                  }}
                  style={{
                    background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)',
                    borderRadius: 8, padding: '0.5rem 1.1rem',
                    fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer',
                    color: 'var(--prime)', fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                >
                  Start Review Session
                </button>
              </>
            )
          })()
        )}
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
              style={{ background: 'none', border: 'none', color: 'var(--prime)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
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
  'Feature Engineering': 'var(--prime)',
  'Model Evaluation': 'var(--prime)',
  'ML Systems': 'var(--prime)',
  'Statistics & Probability': 'var(--prime)',
  'Deep Learning': 'var(--prime)',
  'MLOps': 'var(--prime)',
  'Ranking & Retrieval': 'var(--prime)',
  'Experiment Design': 'var(--prime)',
  'SQL & Data': 'var(--prime)',
  'Optimization': 'var(--prime)',
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
          color: 'var(--prime)', fontWeight: 600,
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

        {q.whatsTested && (
          <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderLeft: '3px solid var(--prime)', borderRadius: 8, padding: '0.5rem 0.85rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)' }}>Testing: </span>
            <span style={{ fontSize: '11px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{q.whatsTested}</span>
          </div>
        )}
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
            background: isCorrect ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)',
            border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`,
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1rem' }}>{isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}</span>
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
            {q.antiPattern && <div style={{ marginTop: '0.65rem', padding: '0.45rem 0.75rem', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.18)', borderLeft: '3px solid var(--rose)', borderRadius: 8 }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--rose)' }}>Trap: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{q.antiPattern}</span></div>}
            {q.staffFraming && <div style={{ marginTop: '0.4rem', padding: '0.45rem 0.75rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderLeft: '3px solid rgba(139,92,246,0.6)', borderRadius: 8 }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(139,92,246,0.9)' }}>Senior frame: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{q.staffFraming}</span></div>}
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
  const [copied, setCopied] = useState(false)

  const scoreColor = 'var(--prime)'

  // All domains that appeared
  const domains = Object.keys(domainStats)

  const weakest = [...Object.keys(domainStats)].sort((a, b) => {
    const accA = domainStats[a].total > 0 ? domainStats[a].correct / domainStats[a].total : 0
    const accB = domainStats[b].total > 0 ? domainStats[b].correct / domainStats[b].total : 0
    return accA - accB
  })[0] || ''

  function handleShare() {
    const text = `ML Systems Lab Trainer: ${score}/${total} · ${pct}% · Weak: ${weakest} → ml-systems-lab-v9xe.vercel.app`
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }

  // Sort by accuracy ascending (weakest first)
  const sortedDomains = [...domains].sort((a, b) => {
    const accA = domainStats[a].total > 0 ? domainStats[a].correct / domainStats[a].total : 0
    const accB = domainStats[b].total > 0 ? domainStats[b].correct / domainStats[b].total : 0
    return accA - accB
  })

  function domainBarColor(acc) {
    return 'var(--prime)'
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
        <button
          onClick={handleShare}
          style={{
            background: 'none', border: '1px solid var(--rim)',
            borderRadius: 10, padding: '0.8rem 1.75rem',
            fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', color: copied ? 'var(--prime)' : 'var(--ink-mid)',
            transition: 'color 0.2s',
          }}
        >
          {copied ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg> Copied!' : '⎘ Share Score'}
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

      {onNavigate && screen === 'setup' && (
        <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>AUC Is Not Your Friend: A Guide to ML Metric Selection</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}
    </div>
  )
}
