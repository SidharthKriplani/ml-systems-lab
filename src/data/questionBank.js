// questionBank.js — single source of truth for technical MCQs (Audit #033 R1, 2026-06-24).
// TRAINER_QUESTIONS: the Trainer drill bank (canonical). EXAM_ONLY_MCQ: Combinator-only MCQs
// (its copies of Trainer questions were removed — Combinator now references TRAINER_QUESTIONS).
// Behavioural Q&A (InterviewPrepTab) and Gradient Quiz (quizData.js) are separate surfaces.

export const TRAINER_QUESTIONS = [
  {
    "id": 1,
    "domain": "Feature Engineering",
    "q": "Which of the following best prevents target leakage in a feature pipeline?",
    "options": [
      "Normalizing features after train/test split",
      "Computing rolling statistics using only past data relative to the label timestamp",
      "One-hot encoding categorical variables",
      "Removing features with >50% null rate"
    ],
    "correct": 1,
    "explanation": "Target leakage occurs when features incorporate information from the future. Using only past data for rolling statistics ensures no future signal contaminates training. Production tell: offline AUC is suspiciously high (0.94 where 0.80 was the prior ceiling); model craters in live serving where the future signal is unavailable.",
    "whatsTested": "Whether you know rolling statistics must use only data prior to the label timestamp to avoid temporal leakage.",
    "antiPattern": "Option A (normalising after split) addresses scaling not temporal leakage — a different problem entirely.",
    "staffFraming": "Point-in-time correctness: compute features as of the label date. Any feature that peeks at the future is a production lie."
  },
  {
    "id": 2,
    "domain": "Feature Engineering",
    "q": "A categorical feature has 10,000 unique values. Which encoding strategy is most appropriate for a gradient boosted tree?",
    "options": [
      "One-hot encoding",
      "Target encoding with cross-validation",
      "Target encoding applied to the full dataset before any train/test split",
      "Feature hashing to a fixed-size vector — same memory benefit as target encoding without any leakage risk"
    ],
    "correct": 1,
    "explanation": "Target encoding maps categories to their mean target value. Cross-validation folding prevents leakage. OHE creates 10k sparse dimensions; GBTs handle target encoding well. Feature hashing eliminates vocabulary overhead and leakage risk but introduces hash collisions that conflate unrelated categories — at 10k categories with a 2^13 hash space, collision rate is ~55%, substantially degrading the signal. In production this breaks as: model ships with full-dataset target-encoded means; rare categories (cold-start items) get mean imputed to the global average and rank randomly, spiking p0 latency errors in the ranker.",
    "whatsTested": "Whether you know target encoding with cross-validation is the correct strategy for high-cardinality features in GBTs.",
    "antiPattern": "One-hot at 10K categories creates 10K sparse columns in a tree model — the most common wrong answer.",
    "staffFraming": "High-cardinality + GBT = target encoding with k-fold. Without k-fold you leak the label. Classic production bug."
  },
  {
    "id": 3,
    "domain": "Feature Engineering",
    "q": "You have a feature with distribution shift between train and production. PSI = 0.35. What action do you take?",
    "options": [
      "Ignore — PSI below 0.5 is acceptable",
      "Retrain the model immediately",
      "Investigate root cause, consider feature removal or recalibration",
      "Apply Platt scaling to recalibrate the model's output probabilities to the new distribution"
    ],
    "correct": 2,
    "explanation": "PSI >0.25 indicates significant shift. Investigate: data pipeline changes, upstream schema drift. Options: remove feature, apply transformation, retrain. Platt scaling recalibrates predicted probabilities, but if the input feature itself has shifted, you are fitting a calibration layer on top of structurally wrong predictions — treating the symptom not the cause. Monitoring alone and immediate retraining without root cause investigation are both incomplete responses. Production tell: PSI alert fires at 3am, on-call finds null rate spiked from 0.2% to 34% on a key feature — upstream team changed a column name and null-imputation masked it for two weeks.",
    "whatsTested": "Whether you know PSI > 0.25 indicates major distribution shift requiring root cause investigation, not just retraining.",
    "antiPattern": "PSI < 0.1 is green. PSI 0.1-0.25 is yellow (monitor). PSI > 0.25 is red — significant shift, investigate cause first.",
    "staffFraming": "PSI = 0.35 means significant distribution shift. Do not just retrain — first understand WHY the feature shifted."
  },
  {
    "id": 4,
    "domain": "Model Evaluation",
    "q": "AUC-ROC is 0.95 on test set but precision at top 1% is only 0.12. What does this suggest?",
    "options": [
      "The model is excellent across all thresholds",
      "Class imbalance makes AUC misleading; precision-recall metrics are more informative",
      "AUC-PR would likely agree with AUC-ROC here since both are threshold-independent metrics",
      "The model has high recall but low specificity"
    ],
    "correct": 1,
    "explanation": "With severe class imbalance, AUC-ROC can be inflated by easy negatives. AUC-PR would NOT agree — it is explicitly sensitive to imbalance because it focuses on the positive class, and low precision@top 1% directly predicts a low AUC-PR. Precision-recall metrics and precision@K are more relevant for top-K prediction tasks. Production tell: AUROC looks great at 0.97 but Precision@100 is 2% — model is ranking fraudulent transactions below thousands of easy negatives it correctly ignores.",
    "whatsTested": "Whether you know high AUC with low precision@1% means the model ranks well globally but fails at the top of the list.",
    "antiPattern": "High AUC feels like the model is working well — it is, in aggregate. The precision@1% tells you it fails where decisions are made.",
    "staffFraming": "AUC measures global ranking quality. Precision@K measures performance at your operating threshold. High AUC + low P@K = miscalibrated threshold."
  },
  {
    "id": 5,
    "domain": "Model Evaluation",
    "q": "You're tuning a fraud model. A false negative costs $500, a false positive costs $5. How do you set the classification threshold?",
    "options": [
      "Maximize F1 score",
      "Use the default 0.5 threshold",
      "Lower the threshold to increase recall, weighted by cost ratio",
      "Maximize precision@K where K is fixed to the capacity of your fraud review team"
    ],
    "correct": 2,
    "explanation": "Cost-sensitive threshold: set threshold where expected cost is minimized. FN cost 100x FP means we should recall aggressively. Lower threshold = higher recall = fewer costly FN. Precision@K is a valid capacity-constrained approach but it optimizes for a fixed review volume — it doesn't account for the actual cost asymmetry, which can change the optimal operating point. Maximizing F1 treats FP and FN costs equally (both cost 1), which is wrong when costs are 100:1. Production tell: default 0.5 threshold ships; oncall receives escalation that high-severity fraud cases are being missed at 60% rate because nobody set the threshold for the actual cost ratio.",
    "whatsTested": "Whether you know to optimize threshold by expected cost, not F1, when false negative and false positive costs are asymmetric.",
    "antiPattern": "Maximizing F1 treats FP and FN as equally costly — wrong when FN costs 100× more than FP.",
    "staffFraming": "Threshold = point where expected cost is minimized. FN 100× more expensive means recall aggressively. F1 is only right when costs are symmetric."
  },
  {
    "id": 6,
    "domain": "Model Evaluation",
    "q": "What is the primary risk of using accuracy as the sole metric for a dataset with 99% negative class?",
    "options": [
      "It over-penalizes false positives",
      "A model predicting all negatives achieves 99% accuracy with zero predictive value",
      "It penalizes all misclassifications equally, regardless of asymmetric class costs",
      "Accuracy degrades as a metric when classes are imbalanced because the denominator includes too many easy negatives, making even AUC-ROC unreliable in this regime"
    ],
    "correct": 1,
    "explanation": "With 99% negative class, a trivial classifier gets 99% accuracy. Use precision, recall, F1, or AUC-PR which are explicitly sensitive to the positive class. AUC-ROC is actually more robust to class imbalance than accuracy — it measures ranking quality across all thresholds and is not fooled by an all-negative classifier (which would score AUC-ROC = 0.5). Option C is also true but secondary — accuracy's deeper flaw is that it conflates easy-to-predict negatives with actual model quality. Production tell: model accuracy dashboard shows 99.1% and stakeholders celebrate; fraud team reports zero detections in two weeks — model is predicting all-negative.",
    "whatsTested": "Whether you know accuracy is meaningless for imbalanced datasets — a trivial always-negative model achieves 99%.",
    "antiPattern": "AUC is better than accuracy but is still influenced by true negative count at extreme imbalance.",
    "staffFraming": "At 99% negative rate: 99% accuracy means nothing. Use PR-AUC or F1 at your operating threshold."
  },
  {
    "id": 7,
    "domain": "ML Systems",
    "q": "A model trained monthly shows degraded performance in week 3. Which monitoring signal would detect this earliest?",
    "options": [
      "SHAP value distribution shift between the training window and current serving period",
      "Input feature distribution shift (PSI)",
      "Prediction score distribution shift",
      "Label drift — tracking the fraction of ground-truth positives arriving in the feedback loop"
    ],
    "correct": 2,
    "explanation": "Prediction score distribution shifts before business metrics degrade, with no label delay. SHAP drift detection is expensive (requires running the explainer on live traffic), delayed (needs batch post-processing), and measures attribution rather than model output quality directly. Feature PSI catches input drift but not model behavior change. Label drift monitoring is a valid technique but requires waiting for labels — in week 3 of a monthly training cycle, labels lag by days. Production tell: score histogram compresses toward 0.5 for 3 days before CTR drops — a feature pipeline bug was flattening variance upstream, invisible to business dashboards.",
    "whatsTested": "Whether you know feature drift (PSI) is the earliest upstream signal — it alerts days before prediction drift or business metrics.",
    "antiPattern": "Retraining on fresh data addresses the symptom without diagnosing root cause. First understand what drifted and why.",
    "staffFraming": "Monitoring chain: feature PSI (earliest) → prediction distribution → business KPIs (latest, slowest)."
  },
  {
    "id": 8,
    "domain": "ML Systems",
    "q": "What is the primary advantage of a two-phase serving architecture (retrieval + ranking)?",
    "options": [
      "Reduces model training time",
      "Allows end-to-end gradient flow",
      "Enables candidate pruning from millions to hundreds before expensive ranking",
      "Eliminates the need for feature stores"
    ],
    "correct": 2,
    "explanation": "Retrieval (ANN/heuristics) narrows from O(millions) to O(hundreds) at low cost. Ranker then applies expensive features only to candidates. This is the standard RecSys architecture. In production this breaks as: retrieval stage has a bug silently filtering out an entire item category — ranker never sees those items, precision@K drops, and the root cause takes days to trace back past the ranker.",
    "whatsTested": "Whether you know two-phase serving exists to make sub-100ms inference feasible — not to improve accuracy per query.",
    "antiPattern": "Higher accuracy per query sounds like the goal but the real driver is latency — cross-encoder on 1M items per request is impossible.",
    "staffFraming": "Retrieval: fast bi-encoder narrows 1M to 100 in <20ms. Ranking: expensive cross-encoder scores 100 in <80ms."
  },
  {
    "id": 9,
    "domain": "ML Systems",
    "q": "Your batch prediction pipeline must complete within 2 hours for 100M users. Spark job takes 6 hours. What is your first optimization?",
    "options": [
      "Switch to a larger instance type",
      "Increase the number of output partitions to reduce task size and improve parallelism",
      "Investigate data skew — hot keys cause stragglers",
      "Cache the model weights in broadcast variable"
    ],
    "correct": 2,
    "explanation": "In distributed systems, 80% of slowdowns come from skew. A few hot keys (e.g., superusers) overwhelm specific partitions. Salt the join key or repartition by user cohort. Increasing output partitions helps only if all tasks take similar time — with skew, one partition still processes the hot key and takes the same time. Broadcasting model weights is useful but secondary — if the model is already in memory, re-broadcasting it won't help the straggler. Production tell: Spark job hangs at 99% for 4 hours; one executor is processing the top-10 users who each have 50M events while 199 executors sit idle.",
    "whatsTested": "Whether you know data skew (hot keys) is the most common cause of Spark job stragglers, not raw parallelism.",
    "antiPattern": "Adding more partitions or a larger instance helps symmetric slowness — with skew, the hot partition still processes the same hot key regardless.",
    "staffFraming": "Spark hangs at 99% for hours = data skew. Profile partition sizes first, then salt the join key or repartition by cohort."
  },
  {
    "id": 10,
    "domain": "Statistics & Probability",
    "q": "You run 20 A/B tests simultaneously. How many would you expect to show p<0.05 by chance?",
    "options": [
      "0",
      "1",
      "5",
      "10"
    ],
    "correct": 1,
    "explanation": "With α=0.05 and 20 independent tests, expected false positives = 0.05 × 20 = 1. Apply Bonferroni correction (α/20 = 0.0025) or Benjamini-Hochberg FDR control. In production this breaks as: team runs 20 metric slices on a single A/B test, finds one p=0.03 slice, ships the feature, and the lift evaporates in follow-up experiment — it was the expected false positive.",
    "whatsTested": "Whether you know running 20 tests at alpha=0.05 expects 1 false positive by chance — multiple comparisons inflate Type I error.",
    "antiPattern": "The answer (1) follows from 20 × 0.05 = 1. This is the core multiple comparisons problem.",
    "staffFraming": "With 20 tests at alpha=0.05 expect 1 false positive. Bonferroni: use alpha/20 = 0.0025 per test."
  },
  {
    "id": 11,
    "domain": "Statistics & Probability",
    "q": "Which distribution best models the time between user events in a recommendation system?",
    "options": [
      "Normal",
      "Weibull — it generalizes exponential and models hazard rate changes over time",
      "Exponential",
      "Uniform"
    ],
    "correct": 2,
    "explanation": "Inter-arrival times for Poisson processes follow an exponential distribution — it assumes a constant hazard rate (memoryless property). The Weibull distribution is a common wrong answer here: it is more flexible (models increasing or decreasing hazard rates) and used in survival analysis, but for a simple Poisson process model the exponential is both correct and sufficient. Production tell: time-to-purchase model fitted with Gaussian residuals shows systematic underestimation for high-value users whose inter-event times have heavy right tails.",
    "whatsTested": "Whether you know the exponential distribution models memoryless inter-event times — constant hazard rate.",
    "antiPattern": "Normal distribution seems intuitive for time-based data but inter-event times are non-negative and right-skewed.",
    "staffFraming": "Exponential: memoryless property. P(T>s+t|T>s) = P(T>t). Constant hazard rate — good for session inter-arrivals."
  },
  {
    "id": 12,
    "domain": "Statistics & Probability",
    "q": "A bootstrap confidence interval for mean session duration is [4.2, 4.8] minutes. What does this mean?",
    "options": [
      "95% of sessions are between 4.2 and 4.8 minutes",
      "The true mean is definitely in [4.2, 4.8]",
      "If we repeated this sampling procedure many times, 95% of resulting CIs would contain the true mean",
      "There is a 5% chance the mean is exactly 4.5 minutes"
    ],
    "correct": 2,
    "explanation": "Frequentist confidence intervals: the procedure produces intervals that contain the true parameter 95% of the time across repeated samples. This specific interval may or may not contain the truth. In production this breaks as: analyst tells stakeholder the CI means there is 95% chance the true lift is inside the interval; ship decision is made on a misinterpretation — the realized effect is outside the CI.",
    "whatsTested": "Whether you know a bootstrap CI means 95% of such intervals from repeated sampling would contain the true parameter.",
    "antiPattern": "The true mean lies in this interval with 95% probability is the classic frequentist CI misinterpretation.",
    "staffFraming": "Bootstrap CI: the interval is fixed; the parameter is fixed. The 95% refers to the long-run frequency of the procedure."
  },
  {
    "id": 13,
    "domain": "Deep Learning",
    "q": "Gradient vanishing in a deep network is most effectively addressed by:",
    "options": [
      "Increasing learning rate",
      "Using sigmoid activations throughout",
      "Residual connections (skip connections)",
      "Applying gradient clipping — capping gradient norms prevents them from vanishing to near-zero in early layers"
    ],
    "correct": 2,
    "explanation": "Residual connections (ResNet-style) allow gradients to flow directly through skip paths, bypassing saturating nonlinearities. Batch normalization also helps by normalizing pre-activations, reducing saturation. Sigmoid worsens vanishing due to saturation in its tails. Gradient clipping addresses the opposite problem — exploding gradients — and actively makes vanishing worse by limiting the magnitude of already-small signals. Production tell: training loss plateaus after epoch 2 on a 20-layer network; gradient norms logged per layer show near-zero norms in the first 5 layers — no skip connections, sigmoid activations throughout.",
    "whatsTested": "Whether you know residual connections (skip connections) are the primary solution to vanishing gradients in deep networks.",
    "antiPattern": "Dropout reduces overfitting but does not address vanishing gradients — it actually makes gradient flow harder.",
    "staffFraming": "ResNets: skip connections provide gradient highways. The gradient flows directly to early layers without multiplicative attenuation."
  },
  {
    "id": 14,
    "domain": "Deep Learning",
    "q": "Why is layer normalization preferred over batch normalization in transformer architectures?",
    "options": [
      "LayerNorm is computationally cheaper",
      "BatchNorm requires large batch sizes and is unstable with variable sequence lengths",
      "LayerNorm uses fewer parameters",
      "BatchNorm doesn't work with attention"
    ],
    "correct": 1,
    "explanation": "BatchNorm normalizes across the batch dimension — problematic for variable-length sequences and small batches (e.g., in autoregressive decoding). LayerNorm normalizes across feature dim, independent of batch. In production this breaks as: model trained with batch_size=256 performs well offline but degrades at serving with batch_size=1; BatchNorm running stats diverge from single-sample inference statistics.",
    "whatsTested": "Whether you know LayerNorm is batch-size independent — critical for transformers with variable-length sequences.",
    "antiPattern": "BatchNorm stores running statistics that depend on batch size and can be unreliable at inference with batch_size=1.",
    "staffFraming": "LayerNorm: normalise over features per position independently. BatchNorm: normalise over the batch. Transformers use LayerNorm."
  },
  {
    "id": 15,
    "domain": "Deep Learning",
    "q": "What is the purpose of the temperature parameter in softmax for knowledge distillation?",
    "options": [
      "Prevent overfitting to hard labels",
      "Soften probability distributions to expose more information in non-top class probabilities",
      "Speed up convergence during training",
      "Reduce memory usage during inference"
    ],
    "correct": 1,
    "explanation": "High temperature T flattens the teacher's output distribution, revealing relative similarities between classes (dark knowledge). Student learns richer structure than from one-hot hard labels. Production tell: student distilled at T=1 (hard labels) matches teacher on head classes but degrades 18% on tail classes where the teacher's soft probabilities carried the most information.",
    "whatsTested": "Whether you know temperature > 1 softens the distribution, making soft targets more informative for the student.",
    "antiPattern": "High temperature making learning harder reverses the mechanism — high T softens the distribution and enriches the supervision signal.",
    "staffFraming": "Temperature T: soft targets = softmax(logits/T). High T → softer distribution → more information in non-target classes."
  },
  {
    "id": 16,
    "domain": "MLOps",
    "q": "Which deployment strategy allows you to gradually shift traffic to a new model while monitoring metrics?",
    "options": [
      "Blue-green deployment",
      "Shadow deployment",
      "Canary deployment",
      "Feature flag rollout — enable the new model only for users where the feature flag is true, expanding the flag gradually"
    ],
    "correct": 2,
    "explanation": "Canary: route X% of traffic to new model, monitor metrics, gradually increase %. Blue-green: instant switch (less gradual). Shadow: new model runs but responses aren't served (no user impact). Feature flag rollout is a valid user-targeting mechanism but it is not traffic splitting at the infrastructure level — it is user-segment filtering, which can introduce selection bias when the segment expands. In production this breaks as: team does blue-green switch on a model with a latency regression; p99 latency triples for all users simultaneously with no gradual signal — canary would have caught it at 1% traffic.",
    "whatsTested": "Whether you know canary deployment gradually shifts traffic while monitoring, enabling rollback before full exposure.",
    "antiPattern": "Blue-green deployment is an all-or-nothing switch with no gradual traffic shift or monitoring window.",
    "staffFraming": "Canary: 1% → 5% → 20% → 100% with monitoring gates at each stage. Blue-green: switch everything at once."
  },
  {
    "id": 17,
    "domain": "MLOps",
    "q": "Your CI/CD pipeline for ML models should include which validation step before production promotion?",
    "options": [
      "Unit tests for feature transformations only",
      "Manual review by a senior engineer",
      "Offline evaluation against a holdout set + statistical comparison to current production model",
      "Load testing only"
    ],
    "correct": 2,
    "explanation": "Champion-challenger comparison: new model must beat production on held-out data with statistical significance. Plus: data validation, integration tests, latency benchmarks. In production this breaks as: model passes offline eval but fails latency benchmark — feature store call added 80ms to p99; goes to production anyway because latency check was not in the gate, causing SLA breach.",
    "whatsTested": "Whether you know model evaluation against the current champion on held-out data is mandatory before production promotion.",
    "antiPattern": "Code coverage testing catches software bugs but does not validate that the model actually performs better.",
    "staffFraming": "CI gate: challenger must beat champion by a statistically significant margin on held-out test. Anything less is a regression."
  },
  {
    "id": 18,
    "domain": "MLOps",
    "q": "What is concept drift in production ML?",
    "options": [
      "Input feature distributions shift — P(X) changes while P(Y|X) stays stable",
      "The relationship between input features and target variable changes over time",
      "Prior probability shift — P(Y) changes over time while the conditional P(Y|X) stays stable",
      "API endpoints change breaking client calls"
    ],
    "correct": 1,
    "explanation": "Concept drift: P(Y|X) changes — the mapping from features to labels shifts. E.g., user behavior patterns shift post-COVID. Covariate drift (P(X) changes) is option A. Prior probability shift (P(Y) changes) — option C — is a real, distinct phenomenon (e.g., base fraud rate increases) but the conditional relationship P(Y|X) stays intact; recalibration can address it without full retraining. Production tell: feature distributions look stable (PSI < 0.1) but model precision drops 12 points over 6 weeks — user intent has shifted while the input signals remain the same.",
    "whatsTested": "Whether you know concept drift is the feature-to-target relationship changing — not just feature distribution.",
    "antiPattern": "Data drift (covariate shift) is the feature distribution changing. Concept drift is specifically P(Y|X) changing.",
    "staffFraming": "Concept drift: P(Y|X) changes. Data drift: P(X) changes. Both cause degradation but require different responses."
  },
  {
    "id": 19,
    "domain": "Ranking & Retrieval",
    "q": "NDCG@10 measures:",
    "options": [
      "The number of relevant documents in top 10",
      "Discounted cumulative gain normalized by ideal ordering, capturing position-weighted relevance",
      "Precision at rank 10",
      "The ratio of relevant to irrelevant items"
    ],
    "correct": 1,
    "explanation": "NDCG@K = DCG@K / IDCG@K. DCG discounts relevance by log2(rank+1), rewarding top-ranked relevant items. Normalized by ideal DCG enables comparison across queries. Production tell: offline NDCG@10 improves 2% but online CTR is flat — the model is improving rank 6-10 positions where discount factors make NDCG sensitive but users rarely scroll.",
    "whatsTested": "Whether you know NDCG@K applies log-discounting to reward high positions more — rank 1 is worth far more than rank 10.",
    "antiPattern": "Mean average precision is a related metric but uses equal position weighting within K, not log-discounting.",
    "staffFraming": "NDCG@K = DCG@K / IDCG@K. DCG = sum rel_i / log2(i+1). Rank 1 contributes 1.0, rank 10 contributes 0.29."
  },
  {
    "id": 20,
    "domain": "Ranking & Retrieval",
    "q": "Approximate Nearest Neighbor (ANN) search trades off:",
    "options": [
      "Model quality vs. training speed",
      "Recall vs. query latency/memory",
      "Precision vs. NDCG",
      "Batch size vs. embedding dimension"
    ],
    "correct": 1,
    "explanation": "ANN algorithms (HNSW, IVF-PQ) reduce exact search cost by trading recall. HNSW: high recall, high memory. IVF-PQ: lower memory via quantization, slightly lower recall. Tune ef_search for recall/latency tradeoff. In production this breaks as: HNSW index built on 100M items exhausts instance memory at serving; recall@100 drops 15% after switching to IVF-PQ without retuning ef_search for the new index type.",
    "whatsTested": "Whether you know ANN trades recall for speed — accepting a small number of missed true neighbours for large throughput gains.",
    "antiPattern": "ANN does not trade accuracy for storage. It trades recall for query speed. Storage is often larger than flat indexes.",
    "staffFraming": "Exact KNN: O(n) per query. ANN (HNSW, IVF): O(log n) per query. Recall@10: typically 95-99% with 10-100x speedup."
  },
  {
    "id": 21,
    "domain": "Ranking & Retrieval",
    "q": "In learning-to-rank, listwise approaches differ from pointwise approaches in that:",
    "options": [
      "Listwise uses more training data",
      "Listwise optimizes a list-level metric (e.g., NDCG) directly rather than individual document scores",
      "Listwise is faster to train",
      "Listwise requires no negative examples"
    ],
    "correct": 1,
    "explanation": "Pointwise: regress/classify each item independently. Pairwise: compare item pairs. Listwise: optimize the whole list ordering (e.g., LambdaMART optimizes NDCG directly). Listwise best aligns with ranking metrics. Production tell: pointwise model trained on CTR shows high recall but poor NDCG — it ranks all high-CTR items equally without differentiating their relative order within a slate.",
    "whatsTested": "Whether you know listwise loss optimises the ranking metric over the full document list, not just pairs or individual items.",
    "antiPattern": "Pointwise approaches treat ranking as binary classification and miss relative ordering between documents.",
    "staffFraming": "Listwise (LambdaRank): gradient weighted by NDCG change from swapping i and j. Directly optimises the end metric."
  },
  {
    "id": 22,
    "domain": "Experiment Design",
    "q": "CUPED (Controlled-experiment Using Pre-Experiment Data) primarily reduces:",
    "options": [
      "Bias in treatment effect estimates",
      "Variance in the outcome metric, enabling smaller sample sizes",
      "The probability of Type I errors",
      "Experiment duration"
    ],
    "correct": 1,
    "explanation": "CUPED uses pre-experiment covariate (e.g., pre-period metric) to reduce residual variance: Y_cuped = Y - θ·X_pre. Same expected value, lower variance → smaller MDE → shorter experiments. In production this breaks as: CUPED applied but pre-period covariate is correlated with treatment assignment (novelty effect users had higher pre-period activity); variance reduction is real but θ is biased, inflating estimated lift.",
    "whatsTested": "Whether you know CUPED uses pre-experiment covariates to reduce variance, giving more power without more users.",
    "antiPattern": "Increasing sample size also reduces variance but costs more. CUPED achieves the same effect from existing data.",
    "staffFraming": "CUPED: regress out the pre-experiment metric. Reduces variance by 20-50%. More power, same sample size, no extra cost."
  },
  {
    "id": 23,
    "domain": "Experiment Design",
    "q": "An experiment shows significant lift on engagement but a drop in revenue. How do you decide?",
    "options": [
      "Ship — engagement outweighs revenue",
      "Kill — revenue is more important",
      "Analyze the tradeoff using a composite metric or OEC (Overall Evaluation Criterion)",
      "Run the experiment longer"
    ],
    "correct": 2,
    "explanation": "Conflicting metrics require pre-defined OEC or guardrail thresholds. Define: engagement is a primary metric, revenue is a guardrail. If guardrail is violated, do not ship regardless of primary metric lift. In production this breaks as: team ships because engagement is up 4%; revenue guardrail was never defined pre-experiment; post-ship analysis shows revenue down 2%, but guardrail threshold debate happens after the fact.",
    "whatsTested": "Whether you know a guardrail metric breach overrides the success metric — you do not ship even if engagement is up.",
    "antiPattern": "Picking the metric that matters more misframes the situation — guardrail metrics are hard stops, not choices to weigh.",
    "staffFraming": "Guardrails are non-negotiable. Engagement up but revenue down = investigate before shipping anything."
  },
  {
    "id": 24,
    "domain": "Experiment Design",
    "q": "What is a switchback experiment and when is it appropriate?",
    "options": [
      "An experiment where users switch between A and B repeatedly",
      "A time-series experiment where treatment alternates across time periods, appropriate when geographic/user randomization is infeasible",
      "An experiment with automatic winner selection",
      "A multi-armed bandit with switching costs"
    ],
    "correct": 1,
    "explanation": "Switchback: used in marketplace settings (e.g., Uber surge pricing) where all users in a market must receive the same treatment. Alternate treatment/control by time window, account for carryover effects. In production this breaks as: switchback windows set to 1 hour; driver positioning decisions from treatment window carry over into control windows for 2+ hours, contaminating the control measurement with treatment effects.",
    "whatsTested": "Whether you know switchback experiments alternate treatment and control across time periods for units that cannot be randomised independently.",
    "antiPattern": "User-level randomisation assumes SUTVA — switchback is for when SUTVA is violated by shared supply or network effects.",
    "staffFraming": "Switchback: treat all users in period A, control in period B, alternate. Correct for marketplace supply-side experiments."
  },
  {
    "id": 25,
    "domain": "SQL & Data",
    "q": "Which window function calculates a running total?",
    "options": [
      "GROUP BY with SUM",
      "SUM() OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)",
      "CUMSUM() aggregation",
      "PARTITION BY date"
    ],
    "correct": 1,
    "explanation": "Window functions with ROWS UNBOUNDED PRECEDING compute cumulative aggregates without collapsing rows. PARTITION BY resets the running total per group. In production this breaks as: missing PARTITION BY on a revenue cumsum query produces a single running total across all users; the query returns one row per transaction with a global cumsum, silently wrong — no error thrown.",
    "whatsTested": "Whether you know SUM() OVER (ORDER BY ...) computes a running total as a window function.",
    "antiPattern": "GROUP BY with SUM collapses rows into groups instead of computing a running total per row.",
    "staffFraming": "Running total: SUM(amount) OVER (PARTITION BY user_id ORDER BY ts ROWS UNBOUNDED PRECEDING). Returns value per row."
  },
  {
    "id": 26,
    "domain": "SQL & Data",
    "q": "You need to find users who made a purchase within 7 days of their first visit. Most efficient approach?",
    "options": [
      "Self-join on user_id with date difference filter",
      "Correlated subquery for each user",
      "Full table scan with WHERE clause",
      "Unnested lateral join over all visit/purchase event pairs, filtered to the earliest visit date"
    ],
    "correct": 0,
    "explanation": "Self-join: JOIN first_visit_table ON user_id AND purchase_date BETWEEN first_visit_date AND first_visit_date+7. Use indexed columns. Correlated subquery is O(N²). In production this breaks as: correlated subquery version runs overnight on 50M users before timing out; self-join on unindexed purchase_date still takes 4 hours — adding a composite index on (user_id, purchase_date) drops it to 8 minutes.",
    "whatsTested": "Whether you know self-joining on the first_visit CTE and filtering purchases within a 7-day window is the efficient approach.",
    "antiPattern": "A correlated subquery with DATEDIFF works but is extremely slow at scale — the CTE + join approach is far more efficient.",
    "staffFraming": "Pattern: WITH first_visit AS (SELECT user_id, MIN(ts)...) JOIN purchases ON ... AND DATEDIFF <= 7."
  },
  {
    "id": 27,
    "domain": "SQL & Data",
    "q": "A query with SELECT DISTINCT on 100M rows is slow. Best optimization strategy?",
    "options": [
      "Partition the table by user_id and run DISTINCT within each partition to parallelize deduplication",
      "Use GROUP BY instead (often better optimized by query planners)",
      "Increase memory allocation",
      "Switch to a subquery"
    ],
    "correct": 1,
    "explanation": "GROUP BY can be better optimized than DISTINCT in many query planners (e.g., hash aggregation vs. sort-based dedup). Also consider: is DISTINCT truly needed? Can you filter earlier? Production tell: DISTINCT query spills to disk on a 1B-row table; rewriting as GROUP BY with early WHERE filter reduces shuffled data by 70% and eliminates the spill.",
    "whatsTested": "Whether you know DISTINCT on high-cardinality data requires full scan + sort or hash — indexes barely help.",
    "antiPattern": "Adding an index on the DISTINCT column helps marginally but does not fix the fundamental O(n log n) scan.",
    "staffFraming": "SELECT DISTINCT on 100M rows = full scan + sort or hash. Partition pruning + pre-aggregation is the production fix."
  },
  {
    "id": 28,
    "domain": "Optimization",
    "q": "Adam optimizer vs. SGD with momentum: when is SGD preferred?",
    "options": [
      "When batch sizes are very small, since Adam's variance estimates become unreliable at low sample counts",
      "When training very large transformers where Adam's per-parameter state doubles memory cost",
      "When generalization is critical — SGD often finds flatter minima that generalize better",
      "When training speed is the priority"
    ],
    "correct": 2,
    "explanation": "Adam converges faster but often to sharper minima (higher test loss). SGD+momentum with learning rate warmup and cosine decay finds flatter minima. Many production vision models use SGD for final training. Memory cost is a real reason to avoid Adam on very large models, but it doesn't predict the shape of the minimum found — it motivates Adafactor or Lion rather than SGD. Production tell: Adam-trained model has 0.5% lower val loss than SGD but 1.8% higher test loss on held-out distribution — the sharp minimum does not generalize.",
    "whatsTested": "Whether you know SGD with momentum often generalises better than Adam on vision tasks despite slower convergence.",
    "antiPattern": "Adam converges faster but finds sharper minima — SGD with momentum often beats Adam on held-out CV performance.",
    "staffFraming": "Adam: fast convergence, sharp minima. SGD+momentum: flatter minima, often better CV generalisation. NLP/recommendation: Adam wins."
  },
  {
    "id": 29,
    "domain": "Optimization",
    "q": "What is gradient clipping and why is it used in RNN/transformer training?",
    "options": [
      "Removing gradients below a threshold to speed up training",
      "Capping gradient norms to prevent exploding gradients from destabilizing training",
      "Zeroing gradients for specific layers during fine-tuning",
      "Scaling gradients by the inverse of their variance to normalize step sizes across parameter groups — equivalent to per-layer learning rate adaptation"
    ],
    "correct": 1,
    "explanation": "Exploding gradients (common in RNNs, transformers on long sequences) cause parameter updates to diverge. Clip by global norm: scale all gradients uniformly when ||g|| > threshold. Per-layer learning rate adaptation is what adaptive optimizers like Adam and RMSProp do — it is unrelated to clipping, which is a one-shot magnitude bound not a per-parameter normalization. Production tell: training loss spikes to NaN at step 1200 of a 10k-step run; gradient norm logs show ||g|| hitting 1e6 two steps before the NaN — clip threshold was missing from the optimizer config.",
    "whatsTested": "Whether you know gradient clipping prevents exploding gradients by capping the norm before the update step.",
    "antiPattern": "Weight decay prevents overfitting but does not address training instability from exploding gradients.",
    "staffFraming": "Gradient clipping: if ||g|| > max_norm, g = g × (max_norm/||g||). Essential for RNNs and transformers."
  },
  {
    "id": 30,
    "domain": "Optimization",
    "q": "Learning rate warmup in transformer training serves what purpose?",
    "options": [
      "Prevents the model from memorizing early training examples",
      "Stabilizes training in early steps when weight initialization produces high-variance gradients",
      "Reduces the total number of training steps needed",
      "Acts as implicit curriculum learning — low LR in early steps biases the model toward easy examples that appear first in the shuffled dataset"
    ],
    "correct": 1,
    "explanation": "At initialization, weights are random and gradients are noisy. High LR early → large unstable updates. Warmup starts with tiny LR, increases linearly. Prevents early divergence, especially with Adam which has cold momentum estimates in early steps. Warmup has nothing to do with example ordering or curriculum effects — it is purely about taming the optimizer's behavior during the cold-start phase. Production tell: fine-tuning a pretrained model with full LR from step 0 causes catastrophic forgetting in the first 100 steps; loss recovers but pretrained features are destroyed, final accuracy 6% below baseline.",
    "whatsTested": "Whether you know LR warmup prevents instability in early training when weights are random and gradients are unreliable.",
    "antiPattern": "Warmup has nothing to do with preventing overfitting — it addresses early training instability from random initialisation.",
    "staffFraming": "Warmup: start with tiny LR, increase linearly to target LR over first N steps. Then decay. Standard for transformers."
  },
  {
    "id": 31,
    "domain": "Feature Engineering",
    "q": "During feature selection, recursive feature elimination (RFE) is applied before cross-validation. What is the critical flaw?",
    "options": [
      "RFE is too slow for large datasets",
      "Feature importance scores from the full dataset leak into all folds, causing optimistic evaluation",
      "RFE cannot handle categorical features",
      "RFE requires a linear model as estimator"
    ],
    "correct": 1,
    "explanation": "Performing RFE on the full dataset before CV means the feature selector has seen the validation folds labels, a form of selection leakage. Always nest RFE inside the CV loop. Production tell: nested CV AUC is 0.76; outer-only RFE CV reports 0.84 — the 8-point gap is pure selection leakage that vanishes when the model hits unseen production data.",
    "whatsTested": "Whether you know that feature selection on the full dataset before CV leaks validation fold labels into the selection step.",
    "antiPattern": "RFE before CV is taught as standard practice — the selection bias silently inflates apparent performance by up to 8 AUC points.",
    "staffFraming": "Nest feature selection inside the CV loop. The gap between nested and non-nested CV is exactly the magnitude of the selection leak."
  },
  {
    "id": 32,
    "domain": "Feature Engineering",
    "q": "A log-transformed feature has skewness of 0.1 post-transform but the raw feature had skewness of 4.2. For a linear model, why does this matter?",
    "options": [
      "Log transform only matters for tree-based models",
      "High skewness violates linearity assumptions and makes gradient descent unstable due to scale differences",
      "Tree-based models are equally sensitive to feature skewness and require the same log-transform treatment",
      "Linear models require all features to be log-normal"
    ],
    "correct": 1,
    "explanation": "Linear models assume roughly Gaussian residuals and are sensitive to outliers; heavy right-skew creates extreme values that disproportionately influence gradient updates and coefficient estimation. In production this breaks as: insurance claim model trained on raw claim amounts; a single $10M outlier claim dominates the loss, pulling coefficients so far that median predictions are off by 40%.",
    "whatsTested": "Whether you know linear models are distorted by heavy-tailed distributions because outliers dominate gradient updates and coefficient estimation.",
    "antiPattern": "Thinking tree-based models need the same log-transform treatment — trees split at thresholds and are inherently invariant to monotone feature transforms.",
    "staffFraming": "A single $10M outlier dominates gradients without transform. Log-transform compresses the scale while preserving ordinality — linear models need this, trees do not."
  },
  {
    "id": 33,
    "domain": "Feature Engineering",
    "q": "You engineer a \"days since last purchase\" feature. In production, new users have NULL for this field. What is the correct strategy?",
    "options": [
      "Impute with mean days since last purchase from the training set",
      "Impute with a sentinel value (e.g., 9999) and add a binary \"is_new_user\" indicator feature",
      "Impute with training mean and apply the is_new_user flag only during training, not at serving time",
      "Fill with zero — new users have zero days since last purchase"
    ],
    "correct": 1,
    "explanation": "NULL here is structurally meaningful (user has no purchase history), not missing at random. A sentinel + indicator lets the model learn a separate effect for new users vs. lapsed users with large gaps. Applying the is_new_user flag only during training but not serving is training-serving skew — the model sees that feature at train time but receives no signal at inference, causing silent mispredictions for exactly the new users that matter most. In production this breaks as: NULLs imputed with mean days_since_purchase (e.g., 45 days); new users look identical to average-lapsed users, suppressing a strong new-user conversion signal the model could have learned.",
    "whatsTested": "Whether you know structurally missing values (MNAR) require sentinel + indicator, not mean imputation which destroys the signal.",
    "antiPattern": "Mean imputation makes new users look like average-lapsed users — the model loses the ability to distinguish the highest-value cohort.",
    "staffFraming": "NULL here means no history exists — that is structurally different from a 45-day lapsed user. Sentinel + indicator lets the model learn both effects separately."
  },
  {
    "id": 34,
    "domain": "Model Evaluation",
    "q": "Expected Calibration Error (ECE) measures:",
    "options": [
      "The gap between AUC-ROC and AUC-PR",
      "How closely predicted probabilities match empirical outcome frequencies in binned predictions",
      "The variance of prediction scores across bootstrap samples",
      "The model's sensitivity to threshold selection"
    ],
    "correct": 1,
    "explanation": "ECE bins predictions by confidence, then computes a weighted average of |accuracy - confidence| per bin. A perfectly calibrated model at 0.7 probability means 70% of those predictions are correct. In production this breaks as: fraud model outputs 0.9 scores; ops team assumes 90% precision and deprioritizes manual review — actual precision is 60% due to class imbalance and no calibration step.",
    "whatsTested": "Whether you know ECE measures calibration — the gap between predicted probabilities and actual event frequencies.",
    "antiPattern": "AUC is the classic wrong answer — it measures discrimination (ranking quality), not calibration (probability accuracy).",
    "staffFraming": "ECE: bin predictions into 10 buckets, compare predicted rate vs actual rate. Perfect calibration lies on the diagonal."
  },
  {
    "id": 35,
    "domain": "Model Evaluation",
    "q": "Platt scaling and isotonic regression are both post-hoc calibration methods. When should you prefer isotonic regression?",
    "options": [
      "Always — isotonic regression is strictly better",
      "When training data is small (< 1000 samples)",
      "When the calibration curve is strongly non-monotonic and you have sufficient held-out data",
      "When the model is a logistic regression"
    ],
    "correct": 2,
    "explanation": "Platt scaling fits a parametric sigmoid — fast but assumes a monotone miscalibration pattern. Isotonic regression is non-parametric and flexible, but prone to overfitting on small calibration sets. In production this breaks as: isotonic regression fitted on 500 calibration samples produces a non-monotone mapping; scores in [0.6, 0.7] get mapped lower than scores in [0.5, 0.6], reversing rank order for a score band.",
    "whatsTested": "Whether you know Platt scaling is better for small datasets and isotonic regression is better for large ones.",
    "antiPattern": "Platt scaling is always safer is wrong — it assumes a sigmoid shape that may not fit complex score distributions.",
    "staffFraming": "Platt: logistic on scores, limited by sigmoid assumption. Isotonic: stepwise monotone, more flexible but needs more data."
  },
  {
    "id": 36,
    "domain": "Model Evaluation",
    "q": "Your model achieves 0.82 AUC-ROC in offline evaluation. After deployment, business CTR only improves 0.3% vs. expected 2%. The most likely explanation is:",
    "options": [
      "AUC-ROC is a poor metric for ranking models",
      "Offline evaluation uses logged data that doesn't reflect counterfactual user responses to new rankings",
      "The model was trained on too little data",
      "CTR is a lagging indicator that takes months to stabilize"
    ],
    "correct": 1,
    "explanation": "Offline metrics on logged data suffer from position bias and selection bias — users only interact with what was shown. Online gains depend on actual user response to new orderings, which offline data cannot capture. In production this breaks as: new ranker improves offline NDCG 3% but online A/B shows -1% CTR; model learned to exploit position bias in logged data, surfacing items that were clicked because they were rank-1, not because they were relevant.",
    "whatsTested": "Whether you know offline metrics on logged data cannot capture counterfactual user responses to new rankings — selection and position bias make them poor predictors of online gains.",
    "antiPattern": "Blaming AUC-ROC as a poor metric misses the root cause — the issue is evaluation data contaminated by position bias, not the metric choice.",
    "staffFraming": "Offline NDCG on logged data measures how well you reproduce the current policy, not how users would respond to a new ordering. Online A/B is the only truth."
  },
  {
    "id": 37,
    "domain": "ML Systems",
    "q": "A Kafka-backed feature pipeline must handle schema evolution when a new field is added upstream. The safest approach is:",
    "options": [
      "Deploy new consumer code before the producer adds the field",
      "Use schema registry with forward-compatible schema evolution and update consumers before producers",
      "Drop and recreate the Kafka topic with the new schema",
      "Use JSON without a schema — flexibility is built-in"
    ],
    "correct": 1,
    "explanation": "Schema registries (e.g., Confluent) enforce compatibility rules. Forward compatibility means new writers, old readers — deploy consumers first, then producers, to avoid deserialization failures. In production this breaks as: producer deployed first with a new required field; old consumer throws deserialization exception on every message; feature pipeline goes dark for 40 minutes until rollback completes.",
    "whatsTested": "Whether you know Kafka schema evolution requires a schema registry with backward/forward compatibility contracts.",
    "antiPattern": "Ignoring new fields on the consumer works until the schema becomes incompatible — not a durable solution.",
    "staffFraming": "Avro + schema registry: backward compatibility allows old consumers to read new data. Forward allows new consumers to read old data."
  },
  {
    "id": 38,
    "domain": "ML Systems",
    "q": "A feature store serves online predictions at p99 < 10ms. Which architecture decision most directly enables this?",
    "options": [
      "Storing all features in a data warehouse like BigQuery",
      "Precomputing and materializing features into a low-latency key-value store (e.g., Redis, DynamoDB)",
      "Computing features on-the-fly in the serving container",
      "Caching the model's last prediction per user"
    ],
    "correct": 1,
    "explanation": "Online feature stores precompute batch features into key-value stores optimized for microsecond point lookups. On-the-fly computation cannot meet single-digit millisecond SLAs for complex features. In production this breaks as: feature computed on-the-fly by joining 3 tables at serving time; p99 latency is 220ms vs. 8ms SLA — feature store lookup would be 0.5ms, but the batch pipeline was never built.",
    "whatsTested": "Whether you know serving p99 latency is dominated by sequential feature store lookups, not model inference.",
    "antiPattern": "GPU inference sounds like the bottleneck but model inference is typically 1-5ms. Network round-trips dominate.",
    "staffFraming": "Profile first. At p99 < 10ms: ~1ms model inference, ~5ms feature store lookups. Batch the lookups to stay within budget."
  },
  {
    "id": 39,
    "domain": "ML Systems",
    "q": "ONNX export of a PyTorch model fails at a custom attention layer. The root cause is most likely:",
    "options": [
      "ONNX does not support attention mechanisms",
      "The layer uses a Python control flow (if/for) that ONNX's static graph cannot trace dynamically",
      "ONNX requires TensorFlow models only",
      "The batch size was not fixed during export"
    ],
    "correct": 1,
    "explanation": "ONNX tracing captures operations on a specific input; dynamic Python control flow (data-dependent branching, variable-length loops) is not captured. Use torch.jit.script or rewrite with torch.where for static graphs. In production this breaks as: model traced with a short input silently takes the short-sequence branch for all inputs; long sequences trigger wrong computation path, producing nonsense scores with no exception thrown.",
    "whatsTested": "Whether you know ONNX export fails when a custom layer has non-standard control flow or operators not in the ONNX spec.",
    "antiPattern": "Missing CUDA support is a hardware issue — ONNX export is a graph serialisation problem independent of GPU availability.",
    "staffFraming": "ONNX export traces the computational graph. Dynamic control flow on tensor shapes cannot be statically traced."
  },
  {
    "id": 40,
    "domain": "Statistics & Probability",
    "q": "Bootstrap confidence intervals are preferred over t-test intervals when:",
    "options": [
      "Sample size is above 10,000",
      "The test statistic's sampling distribution is unknown or non-normal (e.g., median, complex ratios)",
      "The variance is known from population data",
      "You need exact intervals rather than approximate ones"
    ],
    "correct": 1,
    "explanation": "The t-test assumes normality of the sampling distribution of the mean (CLT helps for means). For non-standard statistics like median, Gini coefficient, or AUC, bootstrapping empirically estimates the sampling distribution without parametric assumptions. In production this breaks as: t-test applied to revenue-per-user (heavy right tail, Gini target); p-value is 0.04 but bootstrapped CI crosses zero — the parametric assumption inflated significance, and the result does not replicate.",
    "whatsTested": "Whether you know bootstrap CIs are preferred for small samples or heavy-tailed distributions where CLT assumptions break.",
    "antiPattern": "Bootstrap is computationally expensive but correctness matters more than compute cost here.",
    "staffFraming": "Bootstrap makes no distributional assumptions. For revenue (heavy-tailed), bootstrap CIs are typically wider and more accurate."
  },
  {
    "id": 41,
    "domain": "Statistics & Probability",
    "q": "A p-value of 0.03 means:",
    "options": [
      "There is a 3% chance the null hypothesis is true",
      "The probability of observing data at least as extreme as seen, assuming the null hypothesis is true, is 3%",
      "The effect size is practically significant",
      "There is a 97% chance the alternative hypothesis is true"
    ],
    "correct": 1,
    "explanation": "P-values are not posterior probabilities of hypotheses. They measure how surprising the data is under H0. Small p-value → data is unlikely under H0 → reject H0. This says nothing about practical significance. In production this breaks as: A/B test on 50M users yields p=0.001 for a 0.003% revenue lift — statistically significant, shipped, but engineering cost to maintain the feature exceeds the revenue impact by 10x.",
    "whatsTested": "Whether you know the p-value is the probability of data this extreme IF the null is true — not the probability the null is true.",
    "antiPattern": "p=0.03 meaning 3% chance the null is true is the most common p-value misinterpretation in industry.",
    "staffFraming": "Correct: if H0 is true, we would see a result this extreme only 3% of the time. The null is either true or false."
  },
  {
    "id": 42,
    "domain": "Statistics & Probability",
    "q": "In a Bayesian A/B test, you observe P(B > A) = 0.96. Why might you still not ship variant B?",
    "options": [
      "Bayesian tests require p < 0.05 to be valid",
      "The expected loss from choosing B (when A is actually better) may exceed the acceptable risk threshold",
      "A higher posterior probability always means ship",
      "You need to run a frequentist test to confirm"
    ],
    "correct": 1,
    "explanation": "Bayesian decision theory uses expected loss, not just posterior probability. If B is 4% likely to be worse but the downside is catastrophic (e.g., revenue loss), expected loss may exceed your risk tolerance even at 96% confidence. Production tell: team ships at 95% probability of improvement; the 5% downside scenario materializes — revenue drops 8% for a week because expected loss was never computed against downside magnitude.",
    "whatsTested": "Whether you know P(B > A) = 0.96 does not account for expected loss if B is actually worse.",
    "antiPattern": "Shipping at P(B>A) >= 0.95 misses the magnitude — how much worse if B is actually inferior?",
    "staffFraming": "Bayesian decision: consider both P(B>A) and expected loss if wrong. High confidence does not mean zero risk."
  },
  {
    "id": 43,
    "domain": "Deep Learning",
    "q": "The KV cache in transformer inference reduces compute by:",
    "options": [
      "Pruning attention heads at runtime",
      "Caching key and value projections for all previous tokens so only the new token's query is computed at each decoding step",
      "Storing intermediate activations to skip recomputation during backpropagation",
      "Quantizing weights to int8 for faster matrix multiplication"
    ],
    "correct": 1,
    "explanation": "Autoregressive decoding recomputes K,V for all past tokens each step without a cache — O(n²) total. KV cache stores these projections, making each new token O(n) attention instead of O(n²) recomputation. In production this breaks as: serving system disabled KV cache to save GPU memory; 512-token generation goes from 80ms to 6 seconds p99 — KV cache memory cost is linear but the compute saving is quadratic.",
    "whatsTested": "Whether you know KV cache avoids recomputing key/value projections for all previous tokens at each generation step.",
    "antiPattern": "Reducing training compute is unrelated — KV cache is an inference-time optimisation for autoregressive generation.",
    "staffFraming": "KV cache: store K,V for all past tokens. Each new token computes only its own Q, then attends to cached K,V."
  },
  {
    "id": 44,
    "domain": "Deep Learning",
    "q": "Gradient checkpointing trades off:",
    "options": [
      "Training speed for better generalization",
      "Memory for compute — activations are recomputed during the backward pass rather than stored",
      "Precision for training stability",
      "Batch size for gradient accuracy"
    ],
    "correct": 1,
    "explanation": "Standard backprop stores all forward activations for gradient computation, consuming O(layers) memory. Checkpointing stores only checkpoint activations and recomputes intermediate values during backward, reducing memory at the cost of ~33% extra compute. In production this breaks as: training a 7B model on A100-80GB OOMs at batch_size=4 without checkpointing; enabling it allows batch_size=16 with only 28% training throughput reduction, well worth the tradeoff.",
    "whatsTested": "Whether you know gradient checkpointing trades extra compute for reduced activation memory during training.",
    "antiPattern": "Gradient checkpointing reduces memory not compute — it actually increases compute by approximately 33%.",
    "staffFraming": "Checkpoint: store only certain activations, recompute others during backward. Memory: O(sqrt(n)). Compute: +33%."
  },
  {
    "id": 45,
    "domain": "Deep Learning",
    "q": "Multi-head attention with d_model=512, 8 heads, sequence length L has self-attention complexity of:",
    "options": [
      "O(L × d_model)",
      "O(L² × d_model)",
      "O(L × d_model²)",
      "O(L² + d_model²)"
    ],
    "correct": 1,
    "explanation": "Each attention head computes QKᵀ which is (L × d_k) × (d_k × L) = O(L² × d_k). Across all heads: O(L² × d_model). This quadratic scaling in L is why long-context transformers need sparse/linear attention variants. In production this breaks as: context length doubled from 2K to 4K tokens; attention memory quadruples, batch size must halve, throughput drops 60% — linear attention or sliding-window attention needed for cost-effective scaling.",
    "whatsTested": "Whether you know self-attention complexity is O(L^2) in both time and memory — the scaling bottleneck at long context.",
    "antiPattern": "O(n log n) is a common guess — attention is actually O(L^2 × d) where d is the head dimension.",
    "staffFraming": "Attention: Q(L×d) × K(L×d)T = L×L matrix. Memory: O(L^2). At L=8K with 32 layers: 4GB just for attention."
  },
  {
    "id": 46,
    "domain": "MLOps",
    "q": "Sample Ratio Mismatch (SRM) in an A/B experiment means:",
    "options": [
      "The treatment effect is too small to detect",
      "The observed traffic split deviates significantly from the intended split, indicating a data collection or assignment bug",
      "The control group has a higher variance than the treatment group",
      "The experiment ran for too short a period"
    ],
    "correct": 1,
    "explanation": "SRM (detected via chi-square test on group sizes) invalidates the experiment randomization. Common causes: bots, cache hits, logging bugs, or inconsistent assignment logic. Always check SRM before analyzing results. In production this breaks as: treatment group is 8% smaller than control (p<0.001 chi-square); root cause is a CDN cache serving control content to some treatment users — lift estimate is biased by the non-random group difference.",
    "whatsTested": "Whether you know SRM means your randomisation is broken and the experiment result is invalid — not just approximate.",
    "antiPattern": "SRM is usually minor and can be adjusted for is the dangerous wrong answer — any SRM invalidates causal inference.",
    "staffFraming": "SRM: intended 50/50, observed 48/52. Results are invalid. Investigate: bot traffic, redirect bugs, SDK issues."
  },
  {
    "id": 47,
    "domain": "MLOps",
    "q": "In an ML model registry, what is the purpose of tagging a model version as \"Staging\" before \"Production\"?",
    "options": [
      "To prevent other engineers from accessing the model",
      "To run integration tests, shadow evaluation, and performance benchmarks in a production-like environment before live traffic",
      "To reduce storage costs by archiving older versions",
      "To signal that model training is still in progress"
    ],
    "correct": 1,
    "explanation": "The Staging stage gates models through champion-challenger evaluation, integration validation, and latency checks before serving live traffic. This mirrors software release pipelines and enables rollback. In production this breaks as: model promoted directly from training to production skipping staging; a subtle preprocessing mismatch (train used median imputation, serving uses mean) causes 15% accuracy drop, only discovered after 6 hours of degraded predictions.",
    "whatsTested": "Whether you know a Staging tag triggers manual review and validation before Production promotion.",
    "antiPattern": "Staging as just an intermediate storage layer misframes it — it is a governance gate, not just a label.",
    "staffFraming": "Model registry lifecycle: Staging = under evaluation. Production = serving live traffic. Transition requires explicit approval."
  },
  {
    "id": 48,
    "domain": "MLOps",
    "q": "A model serving endpoint shows increasing p99 latency over 48 hours without code changes. What is the most likely cause?",
    "options": [
      "The model weights have corrupted",
      "Memory leak or cache saturation from growing request volume, or feature store key space growth slowing lookups",
      "Upstream feature store TTL expired, causing all lookups to bypass local cache and hit cold storage",
      "The model is retraining in the background"
    ],
    "correct": 1,
    "explanation": "Gradual latency increase without code changes typically indicates resource exhaustion: memory leaks, growing in-process caches, or degrading external dependencies (feature store, DB). Profile memory/GC and downstream service latencies. Production tell: p99 latency grows from 40ms to 180ms over 72 hours on a stable-traffic service; heap profiler shows unbounded growth in a prediction cache that has no TTL eviction policy.",
    "whatsTested": "Whether you know increasing p99 latency without code changes signals a resource leak or memory pressure, not a traffic spike.",
    "antiPattern": "Traffic increase is the first instinct but it is ruled out by the absence of code changes and expected traffic patterns.",
    "staffFraming": "Memory leak: p99 climbs steadily over days. Check heap dumps, connection pool exhaustion, growing caches."
  },
  {
    "id": 49,
    "domain": "Ranking & Retrieval",
    "q": "Position bias in implicit feedback (click) data means:",
    "options": [
      "Items ranked lower have fewer impressions and thus fewer clicks regardless of relevance",
      "The ranking model assigns too much weight to the first result",
      "Users click on items alphabetically first",
      "The embedding model positions similar items closer in vector space"
    ],
    "correct": 0,
    "explanation": "Users are less likely to examine lower positions — clicks at rank 10 are sparse not because the item is irrelevant, but because it was not seen. Inverse propensity scoring (IPS) or regression-EM debiasing is needed for unbiased learning from clicks. In production this breaks as: model trained on raw clicks learns to always rank popular high-position items first; tail items with high relevance at rank 8-10 are never surfaced, creating a feedback loop that worsens diversity.",
    "whatsTested": "Whether you know position bias means clicks reflect rank position not item relevance — higher-ranked items get clicked more regardless.",
    "antiPattern": "Position bias causing the model to learn user preferences is the opposite — it teaches position preferences not item preferences.",
    "staffFraming": "Items at position 1 get clicked because they are at position 1. Fix: inverse propensity weighting in training."
  },
  {
    "id": 50,
    "domain": "Ranking & Retrieval",
    "q": "Maximum Inner Product Search (MIPS) differs from nearest neighbor search (NNS) in that:",
    "options": [
      "MIPS uses cosine similarity while NNS uses L2 distance",
      "MIPS finds the vector maximizing the dot product, which is not equivalent to L2 nearest neighbor when norms vary",
      "MIPS is always faster than NNS",
      "MIPS requires normalized embeddings"
    ],
    "correct": 1,
    "explanation": "For normalized vectors, MIPS ≡ NNS (cosine = dot product). For unnormalized embeddings, high dot product can come from large norms rather than directional alignment, requiring MIPS-specific algorithms (e.g., ScaNN, FAISS with inner product index). In production this breaks as: cosine similarity index used with unnormalized embeddings; a few high-norm item embeddings (viral items with many interactions) dominate top-K results for every user regardless of actual user preference.",
    "whatsTested": "Whether you know MIPS finds maximum dot product — not nearest Euclidean neighbour unless vectors are normalised.",
    "antiPattern": "Nearest neighbour and maximum inner product are equivalent only when all vectors lie on the unit sphere.",
    "staffFraming": "MIPS != NNS in general. Recommendations use MIPS (dot product = relevance). Semantic search uses NNS (cosine = direction)."
  },
  {
    "id": 51,
    "domain": "Ranking & Retrieval",
    "q": "In a two-tower retrieval model, why are the user and item towers kept separate during inference?",
    "options": [
      "To reduce GPU memory usage during training",
      "Item embeddings can be pre-computed offline; only the user embedding requires online computation at query time",
      "Cross-tower attention would violate the ranking objective",
      "The two towers use different activation functions that are incompatible"
    ],
    "correct": 1,
    "explanation": "The separation enables ANN search: precompute and index all item embeddings offline. At serving time, compute only the user embedding online, then retrieve top-K items via ANN — O(log N) vs. O(N) cross-encoder scoring. In production this breaks as: item embeddings refreshed only weekly while user embeddings update hourly; new items are invisible to retrieval for up to 7 days — a full week of missed exposure for new catalog additions.",
    "whatsTested": "Whether you know separate towers enable offline precomputation of item embeddings — critical for sub-10ms retrieval.",
    "antiPattern": "Separate towers reduce accuracy is true but misses the point — it is a deliberate tradeoff for serving feasibility.",
    "staffFraming": "If user and item are in one tower you cannot precompute item embeddings. Separate towers: precompute all items offline."
  },
  {
    "id": 52,
    "domain": "Experiment Design",
    "q": "Network effects in a marketplace A/B test (e.g., Uber, Airbnb) make standard user randomization problematic because:",
    "options": [
      "Network effects reduce statistical power",
      "Treatment users interact with control users, violating the Stable Unit Treatment Value Assumption (SUTVA) and biasing effect estimates",
      "Marketplace experiments require continuous metrics only",
      "User-level randomization is too computationally expensive at scale"
    ],
    "correct": 1,
    "explanation": "SUTVA requires that one unit treatment does not affect another outcome. In marketplaces, treating drivers differently affects riders in the same market — a SUTVA violation. Use cluster/geo randomization or switchback designs. In production this breaks as: individual rider A/B test on pricing; treatment riders get lower prices and book more trips, starving control riders of available drivers — control group conversion drops, making treatment look more impactful than it is.",
    "whatsTested": "Whether you know standard user randomisation fails in marketplaces because treatment affects control through shared supply.",
    "antiPattern": "Stratified randomisation handles imbalanced covariates — it does not fix interference between units.",
    "staffFraming": "Marketplace interference: treating a driver affects control riders. Use geo-level or time-based (switchback) randomisation."
  },
  {
    "id": 53,
    "domain": "Experiment Design",
    "q": "Metric decomposition in experiment analysis (e.g., decomposing revenue = orders × AOV) helps by:",
    "options": [
      "Reducing the number of metrics you need to monitor",
      "Isolating which component of a composite metric is driving the treatment effect, enabling better product decisions",
      "Guaranteeing statistical independence between sub-metrics",
      "Automatically correcting for multiple testing"
    ],
    "correct": 1,
    "explanation": "Revenue lift could come from more orders (volume) or higher AOV (quality). Decomposition tells you mechanism — e.g., if AOV drops while orders rise, you are acquiring lower-value customers, which changes the ship decision. Production tell: +3% revenue looks like a win until decomposition shows orders +12%, AOV -8% — the feature is attracting discount seekers, long-term LTV impact is negative.",
    "whatsTested": "Whether you know metric decomposition reveals which component actually drove the revenue change, not just the direction.",
    "antiPattern": "Decomposition confirms the revenue increase but its purpose is to diagnose the mechanism.",
    "staffFraming": "Revenue up 5%: is it orders up 5% or AOV up 5%? Different mechanisms imply different product actions."
  },
  {
    "id": 54,
    "domain": "Experiment Design",
    "q": "An experiment has 80% statistical power at MDE of 2%. If you halve the MDE to 1%, required sample size:",
    "options": [
      "Doubles",
      "Increases by 4x",
      "Stays the same — power is fixed",
      "Increases by 1.41x (square root of 2)"
    ],
    "correct": 1,
    "explanation": "Sample size for a given power scales as 1/MDE². Halving MDE (detecting a smaller effect) requires 4x more samples to maintain the same power, because smaller signals require tighter estimation intervals. In production this breaks as: experiment designed for MDE=5% but true effect is 1%; experiment ends underpowered after 2 weeks — result is inconclusive and the team re-runs for 8 more weeks at a cost of delayed roadmap decisions.",
    "whatsTested": "Whether you know halving the MDE quadruples the required sample size — a quadratic not linear relationship.",
    "antiPattern": "Doubling sample size is the most common wrong intuition — the quadratic relationship follows directly from the formula.",
    "staffFraming": "n is proportional to sigma^2/MDE^2. Half the MDE → n increases 4x. Detecting smaller effects is exponentially expensive."
  },
  {
    "id": 55,
    "domain": "SQL & Data",
    "q": "A query uses a non-selective index (e.g., a boolean column) and the planner ignores it. Why?",
    "options": [
      "Boolean columns cannot be indexed in SQL",
      "When a column has very few distinct values, a full table scan with parallel execution is cheaper than random I/O via the index",
      "The planner ignores any index whose cardinality ratio falls below the auto_analyze threshold — updating table statistics via ANALYZE would make the planner use it",
      "Non-selective indexes only work with composite keys"
    ],
    "correct": 1,
    "explanation": "Index selectivity = distinct values / total rows. For a boolean column (2 distinct values on 100M rows), each lookup fetches ~50% of the table via scattered I/O — worse than a sequential scan even with current statistics. Running ANALYZE updates the planner's cardinality estimates, but if the index is genuinely non-selective, accurate statistics will confirm the sequential scan is correct — ANALYZE fixes stale estimates, not the selectivity problem. Production tell: adding an index on is_active does not speed up the query; EXPLAIN shows sequential scan chosen by planner — a composite index on (is_active, created_at) with a date filter would have the selectivity needed.",
    "whatsTested": "Whether you know a non-selective boolean index is ignored by the planner because full scan is cheaper than random access.",
    "antiPattern": "Creating a composite index sounds like the right fix but the planner already made the right choice.",
    "staffFraming": "Index selectivity: a boolean column with 50/50 split is worthless. Indexes are effective only when filtering to < ~5% of rows."
  },
  {
    "id": 56,
    "domain": "SQL & Data",
    "q": "LAG() and LEAD() window functions are evaluated before or after WHERE filtering?",
    "options": [
      "After WHERE — only visible rows are used for lag/lead computation",
      "Before WHERE — the window sees all rows, then WHERE filters the output",
      "It depends on the database vendor",
      "Simultaneously with WHERE in a single pass"
    ],
    "correct": 0,
    "explanation": "SQL logical order: FROM → WHERE → window functions → SELECT. WHERE runs first, so LAG/LEAD only see rows that pass the WHERE clause. To lag over unfiltered data, use a subquery or CTE to apply the window before filtering. In production this breaks as: session gap analysis uses LAG after a WHERE status=active filter; gaps are computed only across active events, silently skipping churned sessions and producing a 40% underestimate of median session gap.",
    "whatsTested": "Whether you know window functions execute in the SELECT phase after WHERE filtering — they see only filtered rows.",
    "antiPattern": "Window functions processing all rows first is the reversal confusion — WHERE runs before SELECT and windows.",
    "staffFraming": "SQL order: FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT (windows) → ORDER BY → LIMIT."
  },
  {
    "id": 57,
    "domain": "SQL & Data",
    "q": "A FULL OUTER JOIN between a 10M row table and a 100M row table produces 200M rows. The most likely explanation is:",
    "options": [
      "FULL OUTER JOIN always produces rows = sum of both tables",
      "There are duplicate join keys — a many-to-many join producing a cross-product on matched keys",
      "The tables have no matching keys at all",
      "The query planner is using a nested loop join"
    ],
    "correct": 1,
    "explanation": "If many rows in table A match many rows in table B on the join key, the result set is multiplicative. 10M × 100M = 1B worst case. Deduplicate keys before joining or use aggregation first (early aggregation pattern). In production this breaks as: joining events to user-attributes without deduplicating user_id first; one user with 500K events × 3 attribute rows produces 1.5M rows per user — total result is 300x larger than expected and OOMs the Spark job.",
    "whatsTested": "Whether you know a FULL OUTER JOIN producing 200M rows from 10M and 100M tables signals a wrong join condition.",
    "antiPattern": "The Cartesian product would be 1 trillion rows — 200M rows means a join condition exists but may be semantically wrong.",
    "staffFraming": "Full outer join producing n×m rows = accidental cross join or incorrect key. Investigate the join condition."
  },
  {
    "id": 58,
    "domain": "Optimization",
    "q": "Cosine learning rate schedule with warm restarts (SGDR) is useful because:",
    "options": [
      "It eliminates the need for momentum",
      "Periodic restarts help the optimizer escape sharp local minima, and cosine decay allows fine-grained convergence within each cycle",
      "It guarantees convergence to the global minimum",
      "It reduces gradient variance across batches"
    ],
    "correct": 1,
    "explanation": "SGDR (Loshchilov & Hutter 2017): LR follows cosine decay then resets. Restarts act as perturbations that escape sharp minima; snapshots at each restart end can be ensembled. Especially effective for models with many local optima. Production tell: loss plateau after 20k steps despite dropping LR manually; adding cosine restarts every 5k steps drops val loss an additional 0.8% by escaping the plateau region.",
    "whatsTested": "Whether you know warm restarts in cosine LR help escape local minima by periodically resetting the LR.",
    "antiPattern": "Learning rate warmup is a different technique — SGDR uses the restart mechanism to escape local minima.",
    "staffFraming": "SGDR: cosine decay from LR_max to LR_min then restart at LR_max. Each cycle finds different local minima."
  },
  {
    "id": 59,
    "domain": "Optimization",
    "q": "Mixed precision training (FP16 + FP32) requires a \"loss scaling\" step because:",
    "options": [
      "FP16 has a smaller exponent range and small gradients underflow to zero before weight updates",
      "FP32 is too slow for backward passes on modern GPUs",
      "Loss scaling prevents the model from memorizing training data",
      "FP16 accumulation introduces systematic bias in the gradient direction"
    ],
    "correct": 0,
    "explanation": "FP16 minimum positive value is ~6e-8; many gradients are smaller and flush to zero. Loss scaling multiplies the loss by a large constant (e.g., 2^15) before backward, shifting gradient magnitudes into representable FP16 range, then unscaled before the optimizer step. In production this breaks as: mixed-precision training without loss scaling; gradients in early layers flush to zero after 500 steps, model stops learning — loss plateaus at a high value and the team mistakenly attributes it to a learning rate bug.",
    "whatsTested": "Whether you know FP16 underflows for small gradients, requiring loss scaling to shift them into the representable range.",
    "antiPattern": "FP16 overflow for large values is a real problem but loss scaling specifically addresses underflow not overflow.",
    "staffFraming": "FP16 minimum: ~6e-5. Typical gradients: 1e-6 to 1e-4. Without scaling many gradients underflow to 0."
  },
  {
    "id": 60,
    "domain": "Optimization",
    "q": "AdaGrad's learning rate diminishes to near-zero over time in long training runs. AdaDelta and RMSProp solve this by:",
    "options": [
      "Resetting the accumulated gradient sum every epoch",
      "Using an exponential moving average of squared gradients instead of cumulative sum, preventing the denominator from growing unboundedly",
      "Adding a momentum term to the gradient accumulator",
      "Applying gradient clipping before the parameter update"
    ],
    "correct": 1,
    "explanation": "AdaGrad accumulates all squared gradients from the start — denominator grows monotonically → effective LR → 0. RMSProp/AdaDelta use an EMA (controlled by decay ρ), so only recent gradient history influences the adaptive rate. In production this breaks as: AdaGrad used for a continuously retrained model; after 30 retraining cycles on streaming data, the accumulated denominator is so large that the effective learning rate is near zero — model stops adapting to distribution shift.",
    "whatsTested": "Whether you know AdaDelta eliminates the need for a global learning rate by using a ratio of two running averages.",
    "antiPattern": "Adam also addresses AdaGrad's diminishing LR problem but AdaDelta specifically removes the need for a global LR.",
    "staffFraming": "AdaGrad: LR / sqrt(accumulated gradients^2) → LR → 0 over time. AdaDelta: ratio of running averages. No manual LR needed."
  }
];

export const EXAM_ONLY_MCQ = [
  {
    "id": "C1",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "Which technique handles high-cardinality categoricals in tree-based models without memory explosion?",
    "options": [
      "One-hot encoding",
      "Ordinal encoding by frequency",
      "Target encoding with k-fold",
      "Binary encoding"
    ],
    "correct": 2,
    "explanation": "Target encoding with k-fold prevents leakage while keeping dimensionality at 1. Tree models exploit this efficiently. In production this breaks as: target encoding computed on the full dataset inflates feature importance; model AUC drops 5-10 points when tested on data collected after the training cutoff.",
    "whatsTested": "Whether you know target encoding with k-fold is the right high-cardinality strategy for tree models.",
    "antiPattern": "One-hot encoding at 10K categories is the most common wrong answer — catastrophic for memory.",
    "staffFraming": "Trees + high cardinality = target encoding with k-fold. Non-k-fold target encoding is a classic production leakage bug."
  },
  {
    "id": "C2",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "Feature normalization is critical for which algorithm?",
    "options": [
      "Random Forest",
      "Gradient Boosting",
      "Support Vector Machine",
      "Decision Tree"
    ],
    "correct": 2,
    "explanation": "SVMs use distance metrics (kernel), making them sensitive to feature scale. Tree-based methods are invariant to monotonic transformations. In production this breaks as: SVM trained on unscaled features has near-random predictions in serving; the tell is train AUC 0.85, serving AUC 0.52 with no obvious data issue.",
    "whatsTested": "Whether you know which algorithms require feature scaling vs which are scale-invariant.",
    "antiPattern": "Gradient Boosting and Random Forest look plausible but both are scale-invariant — trees split by threshold not distance.",
    "staffFraming": "Scale-sensitive: SVM, KNN, PCA, logistic. Scale-invariant: all tree-based methods. Memorise this split once."
  },
  {
    "id": "C3",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "What is the correct way to impute missing values to avoid data leakage?",
    "options": [
      "Impute with column mean computed on full dataset",
      "Impute with median computed on training set only, then apply same to test",
      "Impute with the global median recomputed fresh on each evaluation fold to keep statistics current",
      "Fit imputer on train + validation combined to reduce imputation variance"
    ],
    "correct": 1,
    "explanation": "Fit imputer on train only, then transform test with the same statistics. Leakage occurs whenever the imputer sees any data outside the training fold — including validation folds or the combined train+val set. Recomputing on each fold (option C) sounds principled but still leaks: the fold's validation labels inform which rows are in that fold's 'fresh' statistics. Production tell: validation AUC is suspiciously close to train AUC; model degrades sharply on truly held-out data collected after the training cutoff.",
    "whatsTested": "Whether you know imputation statistics must be fit on training data only — never the full dataset.",
    "antiPattern": "Option A (mean of full dataset) leaks test information into training. Recomputing per fold also leaks validation fold labels.",
    "staffFraming": "Fit imputers on train, transform everything else with those statistics. Same rule for scalers, encoders, all transforms."
  },
  {
    "id": "C4",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "Log transformation of a right-skewed feature primarily helps:",
    "options": [
      "Reduce feature correlation",
      "Make tree models converge faster",
      "Satisfy normality assumptions in linear models",
      "Remove outliers"
    ],
    "correct": 2,
    "explanation": "Log transform reduces right skew, approximating normality. This improves linear/logistic regression and distance-based methods. In production this breaks as: serving pipeline applies raw feature but training used log-transformed; residuals explode on high-value inputs and RMSE spikes 3-5x at deployment.",
    "whatsTested": "Whether you know log transform reduces right skew and improves linear and distance-based models specifically.",
    "antiPattern": "Option D (removes outliers) is a common confusion — log transform compresses them, it does not remove them.",
    "staffFraming": "Log transform helps linear/logistic regression and distance-based models. Trees are invariant to monotonic transformations."
  },
  {
    "id": "C5",
    "domain": "Model Evaluation",
    "type": "mcq",
    "q": "Stratified K-fold cross-validation is essential when:",
    "options": [
      "Dataset has more than 10,000 samples",
      "Target class distribution is imbalanced",
      "Features have different scales",
      "Cross-validation is nested inside hyperparameter search"
    ],
    "correct": 1,
    "explanation": "Stratified k-fold preserves class proportions in each fold, preventing folds from having no positive examples in rare-class scenarios. Nested CV for hyperparameter search is unrelated to stratification — it addresses a different problem (selection bias). Feature scaling affects distance-based models but is not a reason for stratification. In production this breaks as: standard k-fold on 1% positive-rate data produces folds with 0 positives; log loss returns NaN and the training job silently produces a useless model.",
    "whatsTested": "Whether you know stratified k-fold preserves class proportions per fold, preventing folds with zero positive examples.",
    "antiPattern": "Option D (nested CV for hyperparameter search) solves selection bias, not fold imbalance — it is a different problem.",
    "staffFraming": "Stratified k-fold is mandatory when positive rate < 10%. Without it folds can have zero positives and training fails silently."
  },
  {
    "id": "C6",
    "domain": "Model Evaluation",
    "type": "mcq",
    "q": "Which metric is most appropriate for ranking model evaluation when top-position relevance matters most?",
    "options": [
      "MAP@K (Mean Average Precision at K)",
      "Macro-averaged AUC across item categories",
      "NDCG@K",
      "AUC-ROC"
    ],
    "correct": 2,
    "explanation": "NDCG@K captures position-weighted relevance via log-discounting: relevant item at rank 1 is worth far more than at rank 10. MAP@K also averages precision at each relevant rank but weights all positions within K equally — it misses the concentration of value at the very top of the list. Macro-AUC measures discriminative ability per class, not list ordering quality, and AUC-ROC collapses the ranking problem to a binary classification view. Production tell: AUC looks flat but user engagement drops; NDCG@5 reveals the model is burying relevant items below rank 5 where users rarely scroll.",
    "whatsTested": "Whether you know NDCG@K rewards position-weighted relevance — relevant items at rank 1 are worth far more than rank 10.",
    "antiPattern": "MAP@K is the most common wrong answer — it also averages precision at relevant ranks but weights all positions within K equally.",
    "staffFraming": "NDCG@K uses log-discounting. MAP@K weights positions equally within K. When top-rank errors are most costly, use NDCG."
  },
  {
    "id": "C7",
    "domain": "Model Evaluation",
    "type": "mcq",
    "q": "Log loss penalizes:",
    "options": [
      "Only incorrect predictions",
      "Confident wrong predictions most severely",
      "Low-confidence correct predictions more harshly than high-confidence wrong ones",
      "Predictions far from 0.5 only"
    ],
    "correct": 1,
    "explanation": "Log loss = -log(p) for true class. If model predicts p=0.01 for true class, loss = -log(0.01) ≈ 4.6. High confidence wrong predictions = very high loss. In production this breaks as: a single confident wrong prediction on a rare fraud case inflates average log loss and masks poor calibration on the long tail.",
    "whatsTested": "Whether you know log loss penalises confident wrong predictions exponentially, not just incorrect ones.",
    "antiPattern": "Option A (only incorrect predictions) misses that log loss also penalises low-confidence correct predictions.",
    "staffFraming": "Log loss = -log(p). Predicting 0.01 for the true class costs ~4.6. Miscalibrated confidence is the real production failure mode."
  },
  {
    "id": "C8",
    "domain": "Model Evaluation",
    "type": "mcq",
    "q": "Pearson correlation between predicted and actual values measures:",
    "options": [
      "Calibration quality",
      "Linear association strength only — misses nonlinear patterns",
      "Both precision and recall",
      "Rank correlation quality of predicted probabilities"
    ],
    "correct": 1,
    "explanation": "Pearson measures linear association specifically — not rank quality. Spearman (rank) correlation measures monotone association, which is what you'd want for ranking quality. A model can have high Pearson but poor calibration (all predictions scaled wrong). Production tell: downstream system uses predicted probabilities as scores for a threshold rule; miscalibration causes 40% of positives to be missed despite high AUC.",
    "whatsTested": "Whether you know Pearson measures linear association only and misses nonlinear patterns.",
    "antiPattern": "Option D (rank correlation quality) is Spearman, not Pearson — a common confusion.",
    "staffFraming": "Pearson for linear association. Spearman for monotone rank quality. High Pearson can coexist with terrible calibration."
  },
  {
    "id": "C9",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "A feature pipeline's SLA is 5 minutes but upstream data arrives with variable delay. Best approach?",
    "options": [
      "Fail the pipeline if data is late",
      "Use a watermark-based approach with late data handling",
      "Buffer all events for 10× the maximum observed delay before aggregating",
      "Skip late records"
    ],
    "correct": 1,
    "explanation": "Streaming systems (Flink/Spark SS) use watermarks to bound lateness adaptively. Buffering for a fixed 10× max delay breaks the 5-min SLA and is non-adaptive — a single outlier delay pollutes future windows. Events within watermark window are processed; beyond it trigger late-data handling (side output or drop). In production this breaks as: watermark set too tight drops 15% of mobile events from flaky connections; aggregates are systematically undercounted and fraud model misses spikes.",
    "whatsTested": "Whether you know watermarks adaptively bound lateness — fixed time buffers are non-adaptive and will break SLAs on single outliers.",
    "antiPattern": "Buffering 10× the max observed delay is non-adaptive — one extreme outlier extends that buffer and breaks the 5-min SLA indefinitely.",
    "staffFraming": "Watermark sets the late-data boundary adaptively. Late events hit a side output or are dropped. Fixed buffers fail on outliers by design."
  },
  {
    "id": "C10",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "The primary bottleneck in online feature serving at <10ms SLO is typically:",
    "options": [
      "Model inference",
      "Network round-trips to feature store",
      "Feature transformation CPU cost",
      "JSON serialization"
    ],
    "correct": 1,
    "explanation": "Network latency to Redis/Cassandra is typically 1-5ms per call. Multiple lookups add up. Solutions: batch feature requests, co-locate feature store and model server, cache hot user features. Production tell: p99 serving latency is 200ms but model compute is only 20ms; a flame graph shows 80% of time spent in sequential Redis calls.",
    "whatsTested": "Whether you know network latency to the feature store dominates serving latency at <10ms SLO, not model inference.",
    "antiPattern": "Model inference feels like the bottleneck — the ML work — but it is typically only 1-3ms.",
    "staffFraming": "Profile before optimising. Feature store round-trips are usually 80% of p99 latency in practice. Batch the lookups."
  },
  {
    "id": "C11",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "Shadow deployment differs from canary deployment in that:",
    "options": [
      "Shadow deployment is equivalent to a canary at 0% traffic — both serve the new model to a small subset",
      "Shadow serves real users",
      "Shadow runs new model but discards responses — zero user impact",
      "Shadow uses a separate holdout dataset rather than live traffic"
    ],
    "correct": 2,
    "explanation": "Shadow: mirror production traffic to new model, compare outputs, no user impact. Canary: new model serves real users (small %). Shadow is pure offline validation on live traffic — not a canary at 0%, which would serve nobody and provide no signal. Choose shadow when serving degraded results to even 1% of users is unacceptable — high-stakes, low-reversibility decisions. Choose canary when you need real user behavior signal.",
    "whatsTested": "Whether you know shadow mode serves all production traffic but discards responses — zero user impact.",
    "antiPattern": "Option A (shadow = canary at 0%) is a common confusion — canary at 0% serves nobody and gives no signal.",
    "staffFraming": "Shadow: real traffic, discarded responses, zero user impact. Canary: real traffic, real responses, small user subset."
  },
  {
    "id": "C12",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "What is the most important property of a training-serving skew check?",
    "options": [
      "Comparing model weights between training and serving",
      "Verifying feature transformations are identical between training and serving",
      "Checking that serving latency is <100ms",
      "Ensuring model version is current"
    ],
    "correct": 1,
    "explanation": "Training-serving skew: different feature computation in training vs. serving is the #1 source of silent production failures. Test: run same input through both paths, assert output equality. Production tell: offline evaluation looks strong but online A/B shows no lift; diffing a single request through both pipelines reveals a normalization mismatch.",
    "whatsTested": "Whether you know training-serving skew detection requires running identical input through both pipelines and comparing outputs.",
    "antiPattern": "Monitoring business metrics catches skew late — skew shows up before business metrics move.",
    "staffFraming": "The definitive test: same input through training pipeline and serving pipeline. Any output difference is skew."
  },
  {
    "id": "C13",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "Type II error in hypothesis testing is:",
    "options": [
      "Rejecting a true null hypothesis",
      "Failing to reject a false null hypothesis",
      "Accepting the alternative when it's false",
      "Running multiple tests without correction"
    ],
    "correct": 1,
    "explanation": "Type I (α): false positive — reject true H0. Type II (β): false negative — fail to reject false H0. Power = 1-β. Increase power by: larger N, larger effect size, higher α. In production this breaks as: underpowered experiment ships a null result as a win; feature launches but long-run holdback shows no revenue improvement.",
    "whatsTested": "Whether you know Type II error is a false negative — failing to detect a real effect.",
    "antiPattern": "Type I and Type II are frequently swapped. Type I = alpha (false positive). Type II = beta (false negative, missed effect).",
    "staffFraming": "Power = 1 - beta. Underpowered experiments ship null results as wins because Type II errors are invisible."
  },
  {
    "id": "C14",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "The central limit theorem states that:",
    "options": [
      "All distributions converge to normal with enough data",
      "Sample means of any distribution converge to normal as n increases",
      "Large samples have smaller variance",
      "Population mean equals sample mean"
    ],
    "correct": 1,
    "explanation": "CLT: distribution of sample means approaches N(μ, σ²/n) regardless of population distribution, as n→∞. Enables parametric tests even on non-normal populations. Requires independence. Production tell: t-test on revenue fails because a handful of whale users dominate variance; log-transform or bootstrap brings the distribution into CLT range.",
    "whatsTested": "Whether you know CLT describes the distribution of sample means, not requiring the population to be normal.",
    "antiPattern": "Requiring normal population distribution is the classic CLT misconception — CLT says the means converge, not the data.",
    "staffFraming": "CLT: sample means approach N(mu, sigma2/n) regardless of population shape. Requires independence. Enables parametric tests."
  },
  {
    "id": "C15",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "Bayesian A/B testing compared to frequentist primarily enables:",
    "options": [
      "Faster computation",
      "Larger sample sizes",
      "Continuous monitoring without inflating Type I error",
      "Incorporating domain priors about expected effect sizes to reduce required sample size"
    ],
    "correct": 2,
    "explanation": "Bayesian A/B testing's primary advantage is valid continuous monitoring — P(B>A | data) can be computed at any point without inflating the false-positive rate. Incorporating priors is a secondary Bayesian feature, and using strongly biased priors can mislead decisions. Bayesian methods still require a control group. In production this breaks as: analyst checks p-value daily and stops at first p<0.05; actual false positive rate is closer to 30%, not 5%.",
    "whatsTested": "Whether you know Bayesian A/B testing enables valid continuous monitoring without inflating the false positive rate.",
    "antiPattern": "Incorporating priors is a Bayesian feature but not the primary advantage over frequentist methods.",
    "staffFraming": "Bayesian: compute P(B>A|data) at any time. Frequentist fixed-horizon: peeking early inflates Type I error to ~30%."
  },
  {
    "id": "C16",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "Maximum Likelihood Estimation (MLE) finds parameters that:",
    "options": [
      "Maximize the joint probability P(θ, data) by finding the most likely parameter-data pairing",
      "Maximize the posterior probability",
      "Maximize the probability of observed data given parameters",
      "Minimize variance of the estimator"
    ],
    "correct": 2,
    "explanation": "MLE: θ̂ = argmax P(data | θ). No prior. Contrast with MAP which adds a prior. MLE is equivalent to MAP with uniform prior. In production this breaks as: MLE on sparse categorical data assigns near-zero probability to unseen classes; MAP with a weak Dirichlet prior prevents zero-probability predictions in production logs.",
    "whatsTested": "Whether you know MLE finds parameters maximising the probability of observing the data — no prior.",
    "antiPattern": "Minimising prediction error sounds equivalent but MLE specifically maximises the likelihood function.",
    "staffFraming": "MLE = argmax P(data|theta). No prior. MAP adds a prior. Sparse data makes MLE assign zero probability to unseen classes."
  },
  {
    "id": "C17",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "Dropout during training acts as:",
    "options": [
      "A learning rate scheduler",
      "An ensemble of exponentially many sub-networks",
      "An implicit L2 regularizer — equivalent to weight decay on the dropped units",
      "Feature selection"
    ],
    "correct": 1,
    "explanation": "Dropout randomly zeros units. Equivalent to training 2^N networks sharing weights, then averaging at test time (approximate). Prevents co-adaptation, acts as ensemble. Dropout and L2/weight decay are related but distinct: weight decay penalizes magnitude of all weights continuously, while dropout creates sparsity stochastically. In production this breaks as: dropout left enabled at serving time (model.train() instead of model.eval()); predictions are stochastic and non-reproducible, causing inconsistent user-facing results.",
    "whatsTested": "Whether you know dropout functions as an ensemble of subnetworks and must be disabled at inference.",
    "antiPattern": "Preventing overfitting by adding noise is partially right but misses the ensemble interpretation.",
    "staffFraming": "Dropout left on at inference (model.train() not model.eval()) makes predictions non-deterministic. Classic production bug."
  },
  {
    "id": "C18",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "When fine-tuning a pretrained language model, which layers should be unfrozen first?",
    "options": [
      "Embedding layers — they are closest to the raw input and need the most domain adaptation",
      "First (earliest) transformer layers",
      "Last (top) layers closest to the output",
      "All layers with layer-specific learning rates (largest LR for top layers)"
    ],
    "correct": 2,
    "explanation": "Lower layers encode general features (syntax, basic semantics) that transfer well. Upper layers encode task-specific features that need the most adaptation. Fine-tune top layers first, optionally unfreeze lower layers with smaller LR. Embedding layers encode vocabulary and should almost never be fine-tuned first — they encode distributional priors that are expensive to relearn. Layer-specific learning rates (LLRD) are a valid technique for full fine-tuning but don't substitute for starting with only the top layers unfrozen. In production this breaks as: fine-tuning all layers with a single high LR catastrophically forgets general representations; validation loss explodes after epoch 1 on a small domain dataset.",
    "whatsTested": "Whether you know top layers encode task-specific features and should be unfrozen first in fine-tuning.",
    "antiPattern": "Unfreezing embedding layers first is wrong — they encode distributional priors that are expensive to relearn.",
    "staffFraming": "Bottom layers = general features (transfer well). Top layers = task-specific (unfreeze first). Embedding layer = last or never."
  },
  {
    "id": "C19",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "Batch size in deep learning training: doubling batch size with fixed epochs typically:",
    "options": [
      "Requires proportionally decreasing the learning rate to maintain convergence",
      "Improves generalization",
      "Degrades generalization — larger batches find sharper minima",
      "Always requires halving learning rate"
    ],
    "correct": 2,
    "explanation": "Large batches → sharper minima → worse generalization (Keskar et al.). Linear scaling rule: when doubling batch size, INCREASE LR proportionally (double it) and add warmup — decreasing it would slow convergence and compound the generalization harm. Production tell: migrating from 8-GPU to 64-GPU training with naive batch scaling; validation accuracy drops 2-3 points even though training loss converges similarly.",
    "whatsTested": "Whether you know doubling batch size requires increasing LR proportionally, not decreasing it.",
    "antiPattern": "Decreasing LR with larger batch is the most common wrong intuition — larger batch gives more stable gradient and needs higher LR.",
    "staffFraming": "Large batch + proportional LR + warmup: maintains generalisation. Without LR scaling: sharp minima, worse generalisation."
  },
  {
    "id": "C20",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "The attention mechanism's computational complexity per sequence is:",
    "options": [
      "O(n)",
      "O(n log n)",
      "O(n²)",
      "O(n³)"
    ],
    "correct": 2,
    "explanation": "Scaled dot-product attention computes n×n attention matrix. O(n²) in time and space. Sparse attention (Longformer), linear attention, and flash attention are optimizations. In production this breaks as: OOM errors when context length doubles from 512 to 1024 tokens; memory grows quadratically and a single long document crashes the inference pod.",
    "whatsTested": "Whether you know attention is O(n²) in time and memory because it computes a full n×n matrix of pairwise similarities.",
    "antiPattern": "O(n log n) feels plausible because it sits between linear and quadratic, but attention has no divide-and-conquer step — every pair is computed.",
    "staffFraming": "Attention matrix is n×n. Doubling context length quadruples memory. Flash attention / sparse attention are the production-scale fixes."
  },
  {
    "id": "C21",
    "domain": "MLOps",
    "type": "mcq",
    "q": "Data versioning in ML pipelines is most critical for:",
    "options": [
      "Reducing storage costs",
      "Enabling reproducible model training and debugging production issues",
      "Enforcing schema validation at the point of data ingestion",
      "Preventing data leakage"
    ],
    "correct": 1,
    "explanation": "If a model misbehaves in production, you need to identify the exact training data. DVC, Delta Lake time-travel, or dataset snapshots enable: rollback, reproduce training, audit lineage. Schema validation is a separate concern — it catches malformed records at write time but does not preserve a snapshot of what data a specific model was trained on. Production tell: model starts misbehaving after a data pipeline update; without lineage you cannot determine whether the bug is in code or training data.",
    "whatsTested": "Whether you know data versioning is critical for model reproducibility — knowing what data trained a specific model.",
    "antiPattern": "Schema validation validates format at write time but does not preserve training data lineage for model reproduction.",
    "staffFraming": "Without data versioning: model misbehaves, you cannot reproduce training or audit what changed. DVC or Delta time-travel fix this."
  },
  {
    "id": "C22",
    "domain": "MLOps",
    "type": "mcq",
    "q": "Feature stores provide value primarily by:",
    "options": [
      "Replacing model serving infrastructure",
      "Eliminating training-serving skew and enabling feature reuse across teams",
      "Automatically engineering features",
      "Reducing model training time"
    ],
    "correct": 1,
    "explanation": "Feature stores: (1) single source of truth for features, (2) same computation in training (batch) and serving (online), (3) cross-team feature sharing and discovery. In production this breaks as: two teams compute 'user_30d_spend' differently; model trained on Team A's definition silently receives Team B's version at serving, causing a 15% revenue prediction bias.",
    "whatsTested": "Whether you know the primary feature store value is consistency — same computation for training and serving.",
    "antiPattern": "Reducing compute cost and enabling real-time features are secondary benefits, not the primary value.",
    "staffFraming": "Feature store = single source of truth. Two teams computing user_30d_spend differently = training-serving skew by design."
  },
  {
    "id": "C23",
    "domain": "MLOps",
    "type": "mcq",
    "q": "Model monitoring differs from application monitoring in that:",
    "options": [
      "Application monitoring is more important",
      "Model monitoring requires tracking statistical properties of data and predictions, not just system health",
      "Model monitoring catches issues earlier by tracking business metrics (CTR, revenue) directly",
      "Model monitoring can be fully replaced by logging all predictions to a data warehouse and running weekly accuracy queries"
    ],
    "correct": 1,
    "explanation": "App monitoring: latency, error rate, uptime. Model monitoring additionally requires: feature drift (PSI), prediction drift, label feedback quality, and calibration. Business metrics (CTR, revenue) are lagging indicators — model monitoring catches statistical drift days before business metrics move, not by tracking business metrics directly. Weekly accuracy queries are too coarse and too slow — PSI and prediction distribution monitoring detect problems in near-real-time. Production tell: infra dashboards all green but CTR drops 20%; model monitoring on prediction score distribution would have caught the drift three days earlier.",
    "whatsTested": "Whether you know model monitoring tracks statistical properties (drift, calibration), not just system health.",
    "antiPattern": "Application monitoring (latency, error rate) catches infrastructure issues but not model degradation.",
    "staffFraming": "PSI and prediction distribution monitoring catch model drift days before business metrics move."
  },
  {
    "id": "C24",
    "domain": "MLOps",
    "type": "mcq",
    "q": "A/B testing in MLOps — the holdback group (never-treat) serves what purpose?",
    "options": [
      "Increases statistical power",
      "Measures long-term impact beyond initial experiment window",
      "Reduces infrastructure cost",
      "Prevents network effects"
    ],
    "correct": 1,
    "explanation": "Holdback: permanently keep ~5% of users off a feature. Measure long-run impact after novelty wears off. Essential for features with delayed effects. In production this breaks as: 2-week A/B shows +8% engagement from novelty; a 90-day holdback reveals +1% steady-state, changing the business case for the feature.",
    "whatsTested": "Whether you know holdback experiments measure long-run steady-state impact after novelty effects decay.",
    "antiPattern": "Measuring treatment vs control is A/B testing — holdback specifically measures long-run impact A/B cannot capture.",
    "staffFraming": "A/B shows 2-week novelty lift. 90-day holdback shows steady-state. Often steady-state is 4-5x smaller."
  },
  {
    "id": "C25",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "Inverse Document Frequency (IDF) in TF-IDF penalizes terms that:",
    "options": [
      "Appear in few documents",
      "Are long or complex",
      "Appear in many documents (low discriminative power)",
      "Have high term frequency"
    ],
    "correct": 2,
    "explanation": "IDF = log(N/df). Terms in many documents (stopwords like 'the') get low IDF. Rare discriminative terms get high IDF. TF-IDF = TF × IDF rewards specific, relevant terms. In production this breaks as: IDF computed on a small index is re-used after corpus grows 10x; common terms retain artificially high IDF and dominate relevance scores.",
    "whatsTested": "Whether you know IDF penalises common terms to reward rare discriminative ones.",
    "antiPattern": "Penalising rare terms is the opposite — rare terms get HIGH IDF, common terms get LOW IDF.",
    "staffFraming": "IDF = log(N/df). Term in every document: IDF near 0. Term in 1 document: IDF = log(N). TF-IDF rewards specific terms."
  },
  {
    "id": "C26",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "Mean Reciprocal Rank (MRR) is most appropriate when:",
    "options": [
      "Multiple relevant items exist per query",
      "Only the rank of the first relevant item matters",
      "All ranks are equally important",
      "Evaluating precision at fixed cutoff"
    ],
    "correct": 1,
    "explanation": "MRR = mean of 1/rank_first_relevant. Best for tasks like question answering where there's one correct answer and you care about where it appears. In production this breaks as: MRR looks stable but users report frustration; the metric masks that for 30% of queries the first relevant result moved from rank 2 to rank 6.",
    "whatsTested": "Whether you know MRR is appropriate when only the first relevant result matters, like question answering.",
    "antiPattern": "MAP@K is the common confusion — it averages precision at multiple relevant positions, for when you need multiple good results.",
    "staffFraming": "MRR: you care only about rank of the first relevant result. MAP@K: you care about multiple relevant results at different positions."
  },
  {
    "id": "C27",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "Product quantization in ANN search reduces:",
    "options": [
      "Search recall",
      "Index build time",
      "Memory footprint by compressing embedding vectors",
      "Embedding dimensionality during training"
    ],
    "correct": 2,
    "explanation": "PQ splits vector into M sub-vectors, quantizes each to one of k centroids. 128-dim float32 (512 bytes) → PQ code (16 bytes). 32x compression with modest recall loss. In production this breaks as: increasing M for better recall exhausts RAM at scale; benchmark on 1M vectors passes but 100M vector index causes OOM on the retrieval node.",
    "whatsTested": "Whether you know product quantization reduces memory by encoding vectors as compact codebook indices.",
    "antiPattern": "Reducing query time is a secondary effect — PQ primarily reduces memory, speed improvement follows.",
    "staffFraming": "PQ: encode each vector as M sub-quantizer codes. Memory: 32-bit floats to 8-bit codes. Recall drops slightly, tunable via nprobe."
  },
  {
    "id": "C28",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "Re-ranking after ANN retrieval typically uses:",
    "options": [
      "Faster, simpler models",
      "The same retrieval model",
      "Heavier models with more features that are too expensive for full corpus scoring",
      "Rule-based filters only"
    ],
    "correct": 2,
    "explanation": "Two-stage: (1) Retrieve top-K via fast ANN. (2) Re-rank K candidates with expensive model. Cost is O(K) not O(N). In production this breaks as: re-ranker improves quality but K is set too small (K=20); relevant items not in the first-stage shortlist can never appear in final results, capping recall at the first-stage ceiling.",
    "whatsTested": "Whether you know re-ranking uses an expensive cross-encoder that sees query and document together for better quality.",
    "antiPattern": "A simpler scoring function defeats the purpose of re-ranking — the whole point is higher-quality but slower scoring.",
    "staffFraming": "Two-stage: bi-encoder retrieves cheaply, cross-encoder re-ranks accurately. Never use cross-encoder at retrieval scale."
  },
  {
    "id": "C29",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "Network effects in A/B experiments violate the assumption of:",
    "options": [
      "Normal distribution of outcomes",
      "SUTVA (Stable Unit Treatment Value Assumption)",
      "Equal group sizes",
      "Random assignment"
    ],
    "correct": 1,
    "explanation": "SUTVA: treatment of unit i doesn't affect unit j. In social networks, control users interacting with treated users receive indirect treatment. Solutions: cluster randomization, ego-network isolation. In production this breaks as: user-level randomization on a messaging feature shows +5% engagement; cluster randomization reveals true lift is only +1% after accounting for spillover.",
    "whatsTested": "Whether you know network effects violate SUTVA — a unit's outcome depends on other units' treatment assignment.",
    "antiPattern": "Homogeneity of variance is a t-test assumption, not the SUTVA violation caused by network effects.",
    "staffFraming": "Network effects violate SUTVA: control users are affected by treated users' behaviour. Fix: cluster randomisation."
  },
  {
    "id": "C30",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "The minimum detectable effect (MDE) in experiment design depends on:",
    "options": [
      "Model complexity",
      "Sample size, significance level, power, and baseline metric variance",
      "Number of experiments running simultaneously",
      "Treatment implementation cost"
    ],
    "correct": 1,
    "explanation": "MDE = z_{α/2+β} × σ / √n. Smaller MDE requires larger n. MDE determines if an experiment is powered to detect the business-relevant effect size. Production tell: experiment runs 2 weeks and concludes no effect; post-hoc power analysis shows MDE was 8% but the business only needed to detect a 2% lift — the test was never powered to answer the real question.",
    "whatsTested": "Whether you know MDE depends on both the metric's baseline variance and the sample size together.",
    "antiPattern": "Effect size alone is the common intuition but you also need variance and sample size to calculate MDE.",
    "staffFraming": "MDE = (z_alpha/2 + z_beta) x sigma / sqrt(n/2). Commit to MDE before running — it is a pre-registration commitment."
  },
  {
    "id": "C31",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "Sequential testing (e.g., mSPRT) compared to fixed-horizon testing primarily:",
    "options": [
      "Requires larger sample sizes",
      "Enables valid continuous monitoring and early stopping without inflating Type I error",
      "Is less statistically rigorous",
      "Cannot be used for business metrics"
    ],
    "correct": 1,
    "explanation": "Fixed-horizon: p-values invalid if you peek. Sequential tests (mSPRT, always-valid p-values): control Type I error at any stopping time. Enable stopping early for large effects or futility. In production this breaks as: team peeks at fixed-horizon test on day 3 of a 14-day run and ships at p=0.04; actual false positive rate is ~20% due to optional stopping.",
    "whatsTested": "Whether you know sequential testing allows valid continuous monitoring without inflating the false positive rate.",
    "antiPattern": "Fixed-horizon testing is the comparison — sequential testing specifically solves the peeking problem that fixed-horizon cannot.",
    "staffFraming": "Sequential testing with mSPRT or alpha-spending: peek anytime, Type I error stays controlled. Fixed-horizon: looking early inflates it."
  },
  {
    "id": "C32",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "Novelty effect in A/B tests leads to:",
    "options": [
      "Underestimating treatment effect",
      "Overestimating treatment effect in early experiment windows",
      "Increased variance in outcomes",
      "Selection bias in assignment"
    ],
    "correct": 1,
    "explanation": "Users engage more with new features due to novelty. Early treatment effect appears large; decays over time. Counter: holdback groups, longer experiment windows, analyze by user tenure. Production tell: D7 experiment shows +12% engagement; 90-day holdback settles at +2%, revealing the original decision was driven by novelty, not durable value.",
    "whatsTested": "Whether you know novelty effect causes inflated early metrics that decay to a lower steady-state.",
    "antiPattern": "Regression to the mean is a different concept — novelty effect is about behavioural change when something is new.",
    "staffFraming": "Novelty: users engage more with anything new. A/B shows +8%, 90-day holdback shows +1%. Always run for 2+ weeks."
  },
  {
    "id": "C33",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "For a slowly changing dimension (SCD Type 2), the correct approach is:",
    "options": [
      "Overwrite the existing row",
      "Add a version column and update in place",
      "Insert a new row with effective_date and expiry_date, mark old row expired",
      "Delete and recreate the row"
    ],
    "correct": 2,
    "explanation": "SCD Type 2 preserves history. Each change creates a new row with date range. Enables point-in-time queries. In production this breaks as: training pipeline joins on current dimension record instead of point-in-time; model learns from future attribute values (e.g., tier assigned after the event) causing label leakage and inflated offline metrics.",
    "whatsTested": "Whether you know SCD Type 2 creates new rows with validity dates rather than overwriting history.",
    "antiPattern": "Overwriting old values (SCD Type 1) is the most common wrong answer — it loses all historical data.",
    "staffFraming": "SCD Type 2: insert new row with start_date, set end_date on old row. Preserves full history for point-in-time feature joins."
  },
  {
    "id": "C34",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "EXPLAIN ANALYZE in PostgreSQL shows:",
    "options": [
      "Table schema and indexes",
      "Actual execution plan with row counts and timing at each step",
      "Query syntax errors",
      "Lock contention information"
    ],
    "correct": 1,
    "explanation": "EXPLAIN ANALYZE executes the query and shows actual vs. estimated row counts, execution time per node. Critical for identifying sequential scans, bad estimates, and hash join spills. Production tell: a query degrades from 2s to 45s after a table grows 10x; EXPLAIN ANALYZE reveals the planner switched from index scan to sequential scan due to stale statistics.",
    "whatsTested": "Whether you know EXPLAIN ANALYZE runs the query and shows the actual execution plan with real timing.",
    "antiPattern": "EXPLAIN without ANALYZE only shows the estimated plan — it does not actually execute the query.",
    "staffFraming": "EXPLAIN ANALYZE is the diagnostic tool: it shows where the optimizer's row count estimates diverged from reality."
  },
  {
    "id": "C35",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "Partitioning a large table by date primarily improves:",
    "options": [
      "Write performance",
      "Query performance for date-range filters via partition pruning",
      "Storage compression",
      "JOIN performance"
    ],
    "correct": 1,
    "explanation": "Partition pruning: queries with WHERE date BETWEEN x AND y only scan relevant partitions. For a 5-year table queried by month, pruning reduces scan by 60x. In production this breaks as: analyst wraps the date column in a function (DATE_TRUNC('month', ts) = '2024-01-01'); the planner cannot prune partitions and scans the full 5-year table.",
    "whatsTested": "Whether you know date partitioning improves performance through partition pruning — scanning only relevant partitions.",
    "antiPattern": "Index performance is different — partitioning eliminates entire partition scans, not just individual row lookups.",
    "staffFraming": "Partition pruning: a WHERE date > yesterday query scans 1 partition not 3 years. Dramatic improvement for time-range queries."
  },
  {
    "id": "C36",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "Window function LEAD() is used to:",
    "options": [
      "Access the previous row's value",
      "Access a subsequent row's value within the window",
      "Rank rows within a partition",
      "Compute cumulative aggregates"
    ],
    "correct": 1,
    "explanation": "LEAD(col, n) returns value n rows ahead. LAG(col, n) returns n rows behind. Useful for: time-to-next-event, day-over-day change, next purchase date. In production this breaks as: LAG applied after a WHERE filter skips rows; the 'previous' value is actually 3 days ago rather than 1, silently corrupting day-over-day feature calculations.",
    "whatsTested": "Whether you know LEAD() accesses the value in a subsequent row within the same partition.",
    "antiPattern": "LAG() is the common confusion — it accesses the PREVIOUS row. LEAD goes forward, LAG goes back.",
    "staffFraming": "LEAD(col, 1) = next row value. LAG(col, 1) = previous row value. Common use: time-between-events calculations."
  },
  {
    "id": "C37",
    "domain": "Optimization",
    "type": "mcq",
    "q": "Weight decay in neural network training is equivalent to:",
    "options": [
      "Dropout regularization",
      "L2 regularization on model parameters",
      "Gradient clipping",
      "Learning rate decay"
    ],
    "correct": 1,
    "explanation": "Weight decay: subtract λ·w from weights each step. Equivalent to L2 penalty λ‖w‖² in the loss. Penalizes large weights, encourages simpler models. In production this breaks as: decoupled weight decay (AdamW) omits decay from adaptive scaling; using Adam+L2 instead applies decay inconsistently and leads to over-regularization on sparse embedding parameters.",
    "whatsTested": "Whether you know weight decay is mathematically equivalent to L2 regularisation on the weights.",
    "antiPattern": "Learning rate decay sounds similar but is a completely different mechanism — one regularises weights, the other adjusts step size.",
    "staffFraming": "Weight decay = L2 regularisation. Adds lambda * norm(w)^2 to the loss, shrinking weights toward zero each update."
  },
  {
    "id": "C38",
    "domain": "Optimization",
    "type": "mcq",
    "q": "Cosine learning rate schedule with warmup is preferred for transformer training because:",
    "options": [
      "It converges in fewer steps",
      "It prevents learning rate from going to zero too quickly",
      "Warmup stabilizes early training, cosine provides smooth decay matching transformer optimization dynamics",
      "It automatically adapts to gradient magnitude"
    ],
    "correct": 2,
    "explanation": "Transformers: random init → noisy gradients → high LR causes divergence. Warmup: linear increase for ~4% of steps. Cosine decay: smooth reduction to near-zero, better than step decay. In production this breaks as: fine-tuning a pretrained model without warmup causes loss spike in the first 100 steps and the run diverges, wasting GPU hours.",
    "whatsTested": "Whether you know cosine LR with warmup prevents instability when transformer weights are randomly initialised.",
    "antiPattern": "Warm restarts sound beneficial but the primary reason is warmup — random initial weights need slow stable early updates.",
    "staffFraming": "Warmup: tiny LR increasing to target over first N steps. Cosine decay: smooth LR reduction. Together they prevent early divergence."
  },
  {
    "id": "C39",
    "domain": "Optimization",
    "type": "mcq",
    "q": "Which optimizer is most commonly used in production-scale recommendation system training?",
    "options": [
      "Vanilla SGD",
      "AdaGrad for sparse features, Adam for dense parameters (mixed)",
      "Adam uniformly across all parameter types, including sparse embeddings",
      "RMSProp only"
    ],
    "correct": 1,
    "explanation": "Rec systems have sparse embeddings: AdaGrad/Adafactor adapts per-coordinate LR (rarely-updated embeddings get larger updates). Dense layers use Adam. This split is standard (Google, Meta). In production this breaks as: applying Adam uniformly to sparse embeddings causes popular items to dominate updates; rare-item embeddings never converge and cold-start recall drops 30%.",
    "whatsTested": "Whether you know Adagrad and Adam dominate large-scale recommendation due to sparse gradient handling from embedding tables.",
    "antiPattern": "SGD with momentum is right for CV but wrong here — it does not handle sparse gradients from embedding tables well.",
    "staffFraming": "Recommendation: sparse embedding updates. Adagrad/Adam handle per-parameter statistics for sparsity. SGD updates all params uniformly."
  },
  {
    "id": "C40",
    "domain": "Optimization",
    "type": "mcq",
    "q": "What does the loss landscape's sharpness predict about a trained model?",
    "options": [
      "Training speed",
      "Memory usage",
      "Generalization — flatter minima generalize better",
      "Inference latency"
    ],
    "correct": 2,
    "explanation": "Sharp minima: high curvature, small perturbations cause large loss increase → poor generalization. Flat minima: robust to weight perturbation → generalizes better. SAM explicitly seeks flat minima. Production tell: train loss and val loss converge closely in training but model underperforms by 3-4 points on a new domain — a sign of a sharp minimum that does not generalize.",
    "whatsTested": "Whether you know RFE applied before cross-validation leaks validation labels into the feature selector.",
    "antiPattern": "Applying RFE inside the CV loop sounds complex but is the only correct way — selector must not see validation fold data.",
    "staffFraming": "RFE selection leakage: selector sees which features predict the validation target. Always nest feature selection inside the CV loop."
  },
  {
    "id": "C41",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "You detect that embedding vectors for a categorical feature are drifting over time in production. What is the most principled first diagnostic step?",
    "options": [
      "Retrain the model immediately",
      "Compute cosine similarity between rolling weekly centroids of each category's embedding and flag categories whose centroid drift exceeds a threshold",
      "Increase embedding dimension to capture more distributional complexity",
      "Apply Platt scaling to recalibrate the downstream model's outputs to recent data"
    ],
    "correct": 1,
    "explanation": "Embedding drift can be caught by tracking per-category centroid movement via cosine similarity over time windows. Sudden drops signal distributional shift or data pipeline issues before model performance degrades. Increasing embedding dimension does not address drift — it increases capacity but does not diagnose or fix the root cause. Platt scaling recalibrates prediction probabilities, not embedding representations, and does not address the underlying input drift. Production tell: cosine similarity of item embedding centroids drops from 0.95 to 0.60 overnight; investigation reveals a data pipeline bug that zeroed out a batch of item features.",
    "whatsTested": "Whether you know embedding drift signals the categorical feature's semantics have changed in production.",
    "antiPattern": "Recomputing embeddings from scratch sounds thorough but misses the diagnosis step — first understand WHY they drifted.",
    "staffFraming": "Embedding drift = the feature meaning shifted. Investigate upstream data changes before retraining. The drift is the signal."
  },
  {
    "id": "C42",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "Feature hashing maps high-cardinality categoricals to a fixed-size vector. The primary tradeoff vs. learned embeddings is:",
    "options": [
      "Hashing is slower at inference",
      "Hashing eliminates the need for a vocabulary but introduces collision-based noise that conflates unrelated categories",
      "Hashing always outperforms embeddings on cold-start",
      "Hashing requires more memory"
    ],
    "correct": 1,
    "explanation": "Feature hashing is O(1) lookup with no vocabulary — ideal for streaming and cold-start features. The cost is hash collisions: distinct categories map to the same bucket, injecting noise that hurts precision. In production this breaks as: hash space set to 2^10=1024 for 50k categories; collision rate is ~95%, effectively destroying the feature signal and degrading model AUC by 8 points.",
    "whatsTested": "Whether you know feature hashing's primary tradeoff is hash collisions — unrelated categories mapping to the same bucket.",
    "antiPattern": "Memory reduction is the benefit not the tradeoff. The question asks for tradeoff — that is always collisions.",
    "staffFraming": "At 10K categories with 2^13 hash buckets: ~55% collision rate. \"cat\" and \"car\" may hash identically, corrupting the signal."
  },
  {
    "id": "C43",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "Which strategy best mitigates training-serving skew when a feature is computed differently in batch training vs. real-time serving?",
    "options": [
      "Use separate feature pipelines and reconcile offline",
      "Store precomputed training features in a feature store and reuse the same feature logic for online serving via a shared feature computation layer",
      "Normalize all features to [0,1] in both environments",
      "Drop the feature from the serving pipeline"
    ],
    "correct": 1,
    "explanation": "A feature store with unified feature definitions ensures the same transformation code runs offline and online, eliminating logic divergence. Separate pipelines almost always diverge over time. Production tell: offline pipeline normalizes by global mean but online pipeline normalizes by a 7-day rolling mean; the skew is invisible until serving predictions drop 10 points on new users.",
    "whatsTested": "Whether you know a unified feature computation function for both training and serving is the only real fix for skew.",
    "antiPattern": "Separate documentation and code reviews are process fixes — two codepaths will inevitably diverge over time.",
    "staffFraming": "One function, two contexts: same Python transform in Spark (offline) and Flink/serving (online). Two codepaths = skew by default."
  },
  {
    "id": "C44",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "Monotonic encoding of an ordinal variable (e.g., education level: none=0, high school=1, college=2, graduate=3) is preferable to one-hot encoding when:",
    "options": [
      "The variable has more than 10 levels",
      "The model is a tree ensemble that can exploit ordinal structure with fewer splits",
      "The variable is the target",
      "The data has missing values"
    ],
    "correct": 1,
    "explanation": "Tree models find monotonic ordinal splits naturally with a single numeric feature; one-hot forces the tree to learn the ordering implicitly using multiple binary features, wasting splits and increasing variance. Production tell: ordinal feature one-hot encoded to 10 binary columns; feature importance shows all 10 columns near-zero, hiding the fact that the underlying ordinal signal is predictive.",
    "whatsTested": "Whether you know ordinal encoding preserves the meaningful ordering that one-hot encoding destroys.",
    "antiPattern": "One-hot encoding is the instinctive answer for categorical variables but destroys the ordinal relationship entirely.",
    "staffFraming": "Ordinal: education level has a natural order. Encoding as 0,1,2,3 preserves it. One-hot loses ordering and adds unnecessary dimensions."
  },
  {
    "id": "C45",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "A time-series window feature computed as \"average spend over last 30 days\" leaks if:",
    "options": [
      "The window is too short",
      "The window is computed using the label timestamp instead of the event timestamp, including future data",
      "The currency is not normalized",
      "The feature has high variance"
    ],
    "correct": 1,
    "explanation": "Point-in-time correctness requires the window boundary to be anchored to the event timestamp, not the label timestamp. Using the label timestamp includes future observations, creating look-ahead leakage. Production tell: offline AUC 0.91 but online AUC 0.73; investigation shows the 30-day aggregation window included events that happened after the prediction would have been made.",
    "whatsTested": "Whether you know a rolling window leaks if it includes data from after the label timestamp.",
    "antiPattern": "Rolling windows using all available data feel more accurate but include future information relative to the prediction time.",
    "staffFraming": "Point-in-time correctness: the 30-day window must be computed as of the label date, not the training date. Off-by-one bugs are common."
  },
  {
    "id": "C46",
    "domain": "Feature Engineering",
    "type": "mcq",
    "q": "When should you prefer quantile binning over equal-width binning for a continuous feature?",
    "options": [
      "When the feature is normally distributed",
      "When the feature has heavy tails or outliers, since quantile bins produce equal-density buckets robust to skew",
      "When the model is a neural network",
      "When the feature is already standardized"
    ],
    "correct": 1,
    "explanation": "Equal-width bins concentrate most data in a few buckets under skewed distributions. Quantile binning guarantees each bin has the same proportion of samples, preserving information across the full distribution. In production this breaks as: equal-width bins on income data put 90% of users into bucket 1; the model essentially ignores income as a feature because all variation collapses into one bin.",
    "whatsTested": "Whether you know quantile binning is preferred for skewed distributions where equal-width bins would be mostly empty.",
    "antiPattern": "Equal-width binning is the default intuition but creates mostly empty bins for skewed distributions.",
    "staffFraming": "Quantile binning: each bin has equal count. Equal-width: each bin has equal range. Skewed data → quantile. Uniform data → either."
  },
  {
    "id": "C48",
    "domain": "Model Evaluation",
    "type": "mcq",
    "q": "You tune a classification threshold to maximize F1 on a held-out validation set. What is the correct methodology to report final performance?",
    "options": [
      "Report F1 on the same validation set used for tuning",
      "Report F1 on a separate test set never seen during threshold selection",
      "Report F1 averaged across all thresholds",
      "Re-tune the threshold on the test set and report that F1 — since test data is larger than validation, the estimate is more stable"
    ],
    "correct": 1,
    "explanation": "Threshold tuning on validation data is a form of optimization that can overfit to that split. The true generalization estimate requires a held-out test set where no decision was made. Re-tuning on the test set is the same error compounded — you have now used test data for optimization and the reported F1 is as optimistic as if you had never split the data at all. Production tell: precision/recall at chosen threshold degrades by 15 points on the first week of live traffic — the threshold was tuned to validation noise rather than signal.",
    "whatsTested": "Whether you know threshold tuning on validation creates optimistic estimates — the threshold overfits to the validation distribution.",
    "antiPattern": "Using the same threshold at deployment feels consistent but ignores that the tuned threshold overfit to validation.",
    "staffFraming": "Threshold is a hyperparameter. Tune on validation, evaluate calibration on a separate held-out test set, deploy with test-set confirmation."
  },
  {
    "id": "C49",
    "domain": "Model Evaluation",
    "type": "mcq",
    "q": "The disagreement between macro-F1 and micro-F1 on a multi-class problem most likely indicates:",
    "options": [
      "The model is overfitting to the training distribution",
      "Significant class imbalance — micro-F1 is dominated by frequent classes, macro-F1 weights all classes equally",
      "Weighted-F1 should be used instead to give a definitive single number",
      "The threshold was not tuned per-class"
    ],
    "correct": 1,
    "explanation": "Micro-F1 aggregates TP/FP/FN globally before computing F1, so large classes dominate. Macro-F1 computes per-class F1 and averages. A large gap reveals the model performs differently across class sizes — it is not resolved by switching to weighted-F1 (which just weights by support, similar to micro-F1) or per-class thresholding (which changes precision/recall tradeoffs but not the structural imbalance). Production tell: micro-F1 = 0.92 looks great; macro-F1 = 0.61 reveals the model ignores 3 minority classes entirely, which are exactly the edge cases the business cares most about.",
    "whatsTested": "Whether you know macro-F1 vs micro-F1 discrepancy signals class imbalance or rare classes with poor performance.",
    "antiPattern": "Calibration is a different model property — it measures probability accuracy, not the macro/micro F1 gap.",
    "staffFraming": "Micro-F1: dominated by common classes. Macro-F1: each class contributes equally. Large gap = model fails on rare classes."
  },
  {
    "id": "C50",
    "domain": "Model Evaluation",
    "type": "mcq",
    "q": "Offline NDCG is high but online CTR drops after deployment. The most likely explanation is:",
    "options": [
      "The model overfit to training data",
      "Offline labels (clicks from historical logs) reflect selection bias from the prior ranker, not true user relevance",
      "NDCG is the wrong metric for ranking",
      "The serving infrastructure is slow"
    ],
    "correct": 1,
    "explanation": "Logs collected under a prior ranker are not IID samples — items that were never ranked high were never clicked. The offline metric is optimistic because it only evaluates relevance on items the old ranker selected. In production this breaks as: new ranker with +6% offline NDCG shows 0% online lift; the offline gain came from re-scoring items that were already being shown, not from surfacing better items.",
    "whatsTested": "Whether you know offline-online discrepancy often signals position bias in the click data used for offline eval.",
    "antiPattern": "Model underfitting sounds plausible but if offline NDCG is high the model fits the training signal well.",
    "staffFraming": "Click data reflects what the old ranker showed. Offline NDCG measures performance on biased samples. Online measures real user preference."
  },
  {
    "id": "C51",
    "domain": "Model Evaluation",
    "type": "mcq",
    "q": "Platt scaling calibrates a classifier's scores by:",
    "options": [
      "Retraining the last layer with a smaller learning rate on the calibration set",
      "Fitting a logistic regression on the model's raw scores using a held-out calibration set",
      "Applying temperature scaling to logits",
      "Normalizing scores to sum to 1"
    ],
    "correct": 1,
    "explanation": "Platt scaling learns two parameters (A, B) by fitting sigmoid(A·score + B) to calibration labels. It is cheap, post-hoc, and effective for SVMs and GBTs whose raw outputs are not well-calibrated probabilities. Retraining the last layer is a valid fine-tuning technique but is not calibration — it changes the model's predictions, not just their probability mapping. Temperature scaling (dividing logits by T) is a different one-parameter calibration method used primarily for neural network softmax outputs. Production tell: GBT model outputs raw leaf scores used directly as fraud probabilities; downstream threshold at 0.5 catches only 20% of fraud — Platt scaling would have mapped scores to true probabilities.",
    "whatsTested": "Whether you know Platt scaling fits a logistic regression on raw model scores to produce calibrated probabilities.",
    "antiPattern": "Isotonic regression is the alternative — non-parametric and more flexible but requires more data to avoid overfitting.",
    "staffFraming": "Platt scaling: logistic on scores. Isotonic: stepwise monotone function. Platt for small datasets, isotonic for large."
  },
  {
    "id": "C52",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "Schema-on-read vs. schema-on-write in a feature serving context: which is safer for production ML?",
    "options": [
      "Schema-on-read, because it is more flexible",
      "Schema-on-write, because feature types and shapes are validated at write time, catching pipeline errors before they corrupt serving",
      "They are equivalent in production",
      "Schema-on-read is safer because it defers validation"
    ],
    "correct": 1,
    "explanation": "Schema-on-write enforces types, nullability, and ranges when features are written to the store, failing fast at pipeline time. Schema-on-read defers validation until serving, letting corrupt data reach inference silently. In production this breaks as: an upstream table adds a NULL to a previously non-null column; schema-on-read allows it through and the model receives NaN at serving, producing garbage predictions for 6 hours before detection.",
    "whatsTested": "Whether you know schema-on-write catches errors at ingest time, preventing serving failures at runtime.",
    "antiPattern": "Schema-on-read sounds more flexible but in feature serving, discovering schema errors at inference time causes failures.",
    "staffFraming": "Schema-on-write: validate at write. Schema-on-read: validate at query. For serving, write-time validation prevents runtime failures."
  },
  {
    "id": "C53",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "Two-tower retrieval models are preferred over cross-encoder models for candidate retrieval because:",
    "options": [
      "Two-tower models have higher MRR",
      "Two-tower models precompute item embeddings offline enabling sub-millisecond ANN search; cross-encoders require full item-query interaction at query time making them too slow at scale",
      "Two-tower models are easier to train",
      "Cross-encoders cannot handle cold start"
    ],
    "correct": 1,
    "explanation": "Cross-encoders jointly encode query+item (full attention), producing accurate scores but requiring inference per candidate — infeasible for millions of items. Two-tower separates encoders, precomputes item side, and uses ANN for retrieval. Production tell: cross-encoder p99 latency is 8 seconds on a 10k candidate set; two-tower + ANN retrieves top-100 in 12ms, making real-time serving feasible.",
    "whatsTested": "Whether you know bi-encoders are used for retrieval because they precompute item embeddings offline — cross-encoders cannot.",
    "antiPattern": "Cross-encoders give better quality but require computing query+document jointly at serving time — impossible at retrieval scale.",
    "staffFraming": "Bi-encoder: precompute item embeddings offline. Cross-encoder: query+item together, better quality, cannot precompute. Two-stage = both."
  },
  {
    "id": "C54",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "A streaming feature pipeline using Kafka + Flink must guarantee exactly-once semantics. The key mechanism is:",
    "options": [
      "At-least-once delivery with deduplication downstream",
      "Flink checkpointing with Kafka transactional producer: checkpoint state to durable storage, commit Kafka offsets atomically inside the checkpoint",
      "Idempotent consumers only",
      "Increasing Kafka replication factor"
    ],
    "correct": 1,
    "explanation": "Exactly-once in Flink requires (1) periodic checkpoints persisting operator state and Kafka offsets atomically, and (2) Kafka transactional producer so output is committed only when the checkpoint succeeds. In production this breaks as: checkpointing enabled but Kafka producer is not transactional; a job restart replays the last checkpoint interval and duplicates feature aggregations, corrupting downstream counts.",
    "whatsTested": "Whether you know exactly-once in Kafka+Flink requires idempotent writes and transactional producers.",
    "antiPattern": "At-least-once with deduplication is a common alternative but does not guarantee exactly-once if dedup logic has gaps.",
    "staffFraming": "Exactly-once: transactional producer + offset commits in the same transaction. Complex but necessary for financial or fraud features."
  },
  {
    "id": "C55",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "In a low-latency feature store, what is the typical reason to maintain both an online store (Redis) and an offline store (Parquet/Hive)?",
    "options": [
      "Cost — Redis is expensive for all data",
      "Online store serves fresh features at <10ms for inference; offline store provides historical point-in-time correct features for training at scale",
      "They store different features",
      "Redundancy for disaster recovery"
    ],
    "correct": 1,
    "explanation": "Redis is optimized for single-key lookups at millisecond latency but is not suited for full dataset scans during training. The offline store enables efficient bulk reads for training while the online store handles serving. Production tell: training job issues 50M Redis GET calls sequentially; it takes 14 hours and hammers the Redis cluster, causing latency spikes for the real-time serving path.",
    "whatsTested": "Whether you know the dual store exists because batch features cannot meet sub-millisecond serving latency requirements.",
    "antiPattern": "Cost reduction is secondary — the primary reason is that different features have fundamentally different freshness requirements.",
    "staffFraming": "Online store: sub-ms lookup of pre-computed features. Offline store: training data generation. Dual store = different freshness SLAs."
  },
  {
    "id": "C56",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "Model versioning in a prediction service should include which artifact to enable full reproducibility?",
    "options": [
      "Only the model weights file",
      "Model weights, preprocessing pipeline, feature schema, training data version reference, and hyperparameters",
      "Model weights and hyperparameters only",
      "Only the Docker image"
    ],
    "correct": 1,
    "explanation": "Reproducibility requires the full artifact graph: weights define the function, preprocessing defines input transformation, feature schema defines expected inputs, and data version reference pins what the model learned from. In production this breaks as: weights are versioned but the preprocessing scaler is not; a rollback restores old weights but uses the new scaler, causing systematic prediction errors that take days to diagnose.",
    "whatsTested": "Whether you know model versioning must include the training dataset reference to enable full reproducibility.",
    "antiPattern": "Model weights alone are insufficient — without knowing what data trained the model you cannot reproduce or audit it.",
    "staffFraming": "Registry artifact: weights + training data reference + feature schema + eval metrics. Without data reference, reproducibility is impossible."
  },
  {
    "id": "C57",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "Bootstrapping is preferred over the Central Limit Theorem for confidence interval estimation when:",
    "options": [
      "Sample size is large (n > 1000)",
      "The statistic is not a mean (e.g., median, correlation, AUC) or the distribution is heavy-tailed and the CLT approximation is unreliable",
      "The data is normally distributed",
      "Computing mean differences between two groups"
    ],
    "correct": 1,
    "explanation": "CLT guarantees normality of sample means as n grows, but non-mean statistics (median, quantiles, AUC) have complex sampling distributions. Bootstrap resampling empirically estimates those distributions without parametric assumptions. Production tell: t-test on median order value shows p=0.08 and the experiment is called null; bootstrap CI reveals the true effect excludes zero — a real improvement was missed.",
    "whatsTested": "Whether you know bootstrapping is preferred for small samples or non-normal distributions where CLT assumptions do not hold.",
    "antiPattern": "CLT-based t-test is fine for large samples — bootstrapping is specifically for when CLT assumptions break down.",
    "staffFraming": "Bootstrap: resample with replacement, compute statistic on each sample. Makes no distributional assumptions. Preferred when n < 30 or heavy tails."
  },
  {
    "id": "C58",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "Multiple hypothesis testing in ML feature selection: what does Bonferroni correction do and what is its limitation?",
    "options": [
      "Increases statistical power by pooling tests",
      "Divides α by the number of tests to control family-wise error rate; limitation is extreme conservatism — high false negative rate when tests are correlated",
      "Adjusts p-values using the BH procedure",
      "Corrects for sample size differences"
    ],
    "correct": 1,
    "explanation": "Bonferroni controls FWER at α by requiring each test to meet α/m significance. It is valid but over-conservative when tests are correlated, inflating Type II error and discarding real signals. Production tell: team runs 20 metric tests with Bonferroni at α=0.0025; a real 3% revenue lift has p=0.004 and is called not significant — a genuine win is shelved.",
    "whatsTested": "Whether you know Bonferroni correction reduces the per-test significance threshold to control family-wise error rate.",
    "antiPattern": "Bonferroni sounds like it increases the threshold but it actually makes significance harder to achieve — more conservative.",
    "staffFraming": "Bonferroni: alpha/m per test where m is number of tests. 20 features at alpha=0.05 → each test needs p < 0.0025."
  },
  {
    "id": "C59",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "In a two-sample t-test for an A/B experiment, the p-value represents:",
    "options": [
      "The probability the alternative hypothesis is true",
      "The probability of observing a test statistic at least as extreme as the one observed, assuming the null hypothesis is true",
      "The false positive rate of the experiment",
      "The effect size"
    ],
    "correct": 1,
    "explanation": "p-value is P(|T| ≥ |t_obs| | H₀). It is NOT the probability H₀ is true. Misinterpreting p-values as posterior probabilities is one of the most common errors in applied ML experimentation. Production tell: team reports 'there is a 96% chance our feature works' from p=0.04; this framing inflates confidence and leads to premature full rollout of a marginal feature.",
    "whatsTested": "Whether you know the p-value is the probability of seeing data this extreme IF the null is true — not the probability the null is true.",
    "antiPattern": "Probability that the null hypothesis is true is the most common p-value misinterpretation in industry.",
    "staffFraming": "Correct: p=0.03 means if H0 is true we would see a result this extreme only 3% of the time. The null is either true or false."
  },
  {
    "id": "C60",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "You observe a skewed metric (revenue per user) in an A/B test. Which transformation reduces variance and makes t-test more appropriate?",
    "options": [
      "Square root transform only",
      "Log(1 + x) transform, which compresses the heavy tail and reduces variance while preserving zero values",
      "Z-score normalization",
      "Rank transform"
    ],
    "correct": 1,
    "explanation": "Revenue distributions are typically log-normal. log(1+x) handles zeros and compresses the right tail, reducing variance substantially. This makes the CLT approximation valid at smaller sample sizes. Production tell: t-test on raw revenue requires 4 weeks to reach significance due to whale user variance; log-transforming revenue reduces required runtime to 10 days for the same power.",
    "whatsTested": "Whether you know log-transforming revenue or using the delta method are the appropriate fixes for skewed A/B metrics.",
    "antiPattern": "Dropping outliers is tempting but removes real signal — whale users are legitimate customers.",
    "staffFraming": "Revenue is right-skewed and heavy-tailed. Log-transform before t-test, or use the delta method for ratio metrics."
  },
  {
    "id": "C61",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "The delta method approximates the variance of a ratio metric (e.g., revenue/sessions) from component variances. It is needed because:",
    "options": [
      "Ratios are always normally distributed",
      "Ratios of random variables have complex distributions; delta method linearizes via Taylor expansion to produce an analytically tractable variance estimate",
      "It reduces experiment runtime",
      "It corrects for multiple comparisons"
    ],
    "correct": 1,
    "explanation": "A ratio f(X,Y) = X/Y has no simple closed-form variance. Delta method approximates Var(f) using the gradient of f at the mean, enabling standard error computation for metrics like CTR = clicks/impressions. In production this breaks as: CTR confidence intervals computed naively (treating clicks and impressions as independent) are 40% too narrow; the experiment is called significant a week too early.",
    "whatsTested": "Whether you know the delta method approximates variance of ratio metrics using a first-order Taylor expansion.",
    "antiPattern": "Using the ratio mean and assuming independence gives wrong variance estimates for correlated numerator/denominator.",
    "staffFraming": "CVR = conversions/visitors is a ratio. Naive variance is wrong. Delta method propagates uncertainty from both components."
  },
  {
    "id": "C62",
    "domain": "Statistics & Probability",
    "type": "mcq",
    "q": "What distinguishes a Type S (sign) error from a Type M (magnitude) error in effect size estimation?",
    "options": [
      "Type S: wrong p-value; Type M: wrong sample size",
      "Type S: estimated effect has the opposite sign from the true effect; Type M: estimated magnitude is far from the true effect (over/under-estimation)",
      "They are both forms of Type I error",
      "Type S and Type M errors only occur in Bayesian analysis"
    ],
    "correct": 1,
    "explanation": "Gelman & Carlin (2014): underpowered studies often produce estimates with the wrong sign (Type S) or wildly inflated magnitude (Type M). These are more decision-relevant than the binary Type I/II framing. Production tell: underpowered experiment shows +15% revenue lift (significant); post-launch measurement shows +1.5% — a 10x Type M exaggeration that inflated the business case.",
    "whatsTested": "Whether you know Type S error is getting the direction wrong, Type M is getting the magnitude wrong.",
    "antiPattern": "Type I/II errors are the classic taxonomy — Type S/M are a refinement describing estimation quality from underpowered experiments.",
    "staffFraming": "Type S: positive effect but actually negative. Type M: 5x too large. Both cause wrong decisions from underpowered experiments."
  },
  {
    "id": "C63",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "Grouped Query Attention (GQA) reduces inference memory bandwidth compared to Multi-Head Attention (MHA) by:",
    "options": [
      "Reducing the number of attention heads entirely",
      "Sharing a smaller number of K/V heads across multiple Q heads, reducing KV cache size proportionally to the grouping factor",
      "Using sparse attention patterns",
      "Quantizing attention weights"
    ],
    "correct": 1,
    "explanation": "GQA (Ainslie et al., 2023) groups G query heads to share one K and V head. KV cache shrinks by factor G relative to MHA, reducing memory bandwidth at inference — critical for long-context LLM serving. Production tell: MHA model at 128k context hits GPU memory limit; switching to GQA with G=8 reduces KV cache 8x, enabling the same context length on half the GPUs.",
    "whatsTested": "Whether you know GQA reduces memory bandwidth by sharing key-value heads across query head groups.",
    "antiPattern": "Multi-query attention (MQA) is the extreme version with one KV head. GQA is the balanced middle ground.",
    "staffFraming": "MHA: n_kv = n_q. MQA: n_kv = 1. GQA: n_kv = n_q/G. At 70B scale, KV cache is the primary serving memory bottleneck."
  },
  {
    "id": "C64",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "KV cache quantization to INT8 in a transformer serving stack primarily reduces:",
    "options": [
      "Compute FLOPs during attention",
      "Memory bandwidth pressure from loading K/V tensors per decode step, since decode is memory-bound not compute-bound",
      "Training convergence time",
      "Embedding table size"
    ],
    "correct": 1,
    "explanation": "Autoregressive decode is memory-bandwidth-bound: each step loads all cached K/V tensors. INT8 quantization halves bandwidth vs FP16, roughly doubling throughput with minimal perplexity degradation. Production tell: LLM decode throughput is 12 tokens/s at FP16; applying INT8 KV cache quantization raises it to 22 tokens/s with <0.3 perplexity point loss — a free latency win.",
    "whatsTested": "Whether you know KV cache quantization primarily reduces memory bandwidth during autoregressive decoding.",
    "antiPattern": "Compute reduction is secondary — at serving, KV cache memory bandwidth is the bottleneck not FLOPS.",
    "staffFraming": "KV cache at 70B with long context fills GPU memory fast. INT8 KV cache halves it. The bottleneck is bandwidth not compute."
  },
  {
    "id": "C65",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "Gradient checkpointing trades compute for memory by:",
    "options": [
      "Clipping gradients to reduce memory",
      "Discarding intermediate activations during forward pass and recomputing them during backward pass, reducing memory from O(N layers) to O(√N)",
      "Storing only the final layer activations",
      "Using mixed precision to halve activation memory"
    ],
    "correct": 1,
    "explanation": "Gradient checkpointing (Chen et al., 2016) selects checkpoints every √N layers, storing only those activations and recomputing segments during backward pass. Memory drops from O(N) to O(√N) at ~33% extra compute cost. Production tell: training a 24-layer model on 80GB GPU fails with OOM at batch size 8; enabling gradient checkpointing allows batch size 32 at 33% longer step time — net throughput improves.",
    "whatsTested": "Whether you know gradient checkpointing saves memory by recomputing activations during backward instead of storing them.",
    "antiPattern": "Gradient compression is for distributed training communication — not memory reduction during backprop.",
    "staffFraming": "Checkpointing: store only checkpoint activations, recompute others during backward. Trade: +33% compute for ~60% less memory."
  },
  {
    "id": "C66",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "In LoRA fine-tuning, a lower rank r means:",
    "options": [
      "More parameters are updated",
      "Fewer trainable parameters and a lower-rank update subspace; appropriate when the target task is close to pretraining distribution",
      "Higher risk of overfitting",
      "Slower convergence"
    ],
    "correct": 1,
    "explanation": "LoRA decomposes weight updates as ΔW = BA where B ∈ ℝ^{d×r}, A ∈ ℝ^{r×k}. Small r (1-8) limits expressiveness but drastically reduces parameters, sufficient for tasks similar to pretraining. Production tell: full fine-tune of a 7B model requires 56GB GPU memory; LoRA with r=8 fits on a 24GB GPU and reaches within 1 point of full fine-tune accuracy on the target task.",
    "whatsTested": "Whether you know lower LoRA rank means fewer trainable parameters — faster but potentially less expressive.",
    "antiPattern": "Higher rank is not automatically better — it overfits on small datasets and negates LoRA's parameter efficiency.",
    "staffFraming": "LoRA rank r: updates ΔW = A×B where A is d×r, B is r×d. Lower r = fewer parameters = faster training = less expressiveness."
  },
  {
    "id": "C67",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "FlashAttention achieves memory efficiency primarily through:",
    "options": [
      "Approximating attention with sparse patterns",
      "Tiled computation that fuses Q·K^T softmax and ·V into a single CUDA kernel, keeping intermediate attention matrices in SRAM and never materializing the full N×N matrix in HBM",
      "Using FP8 precision for attention",
      "Reducing the embedding dimension"
    ],
    "correct": 1,
    "explanation": "FlashAttention (Dao et al., 2022) tiles Q, K, V to fit in SRAM, computes attention in blocks, and accumulates results without writing the N×N matrix to HBM, reducing memory I/O from O(N²) to O(N). Production tell: standard attention OOMs at 8k sequence length on 40GB GPU; FlashAttention enables 32k sequences on the same hardware with 3x faster training step time.",
    "whatsTested": "Whether you know FlashAttention achieves memory efficiency by tiling computation to avoid materialising the full attention matrix.",
    "antiPattern": "Sparse attention is a different approach — it skips some computations. FlashAttention computes all attention but in a memory-efficient way.",
    "staffFraming": "FlashAttention: tile-based SRAM computation, never write O(n^2) matrix to HBM. Same result as standard attention, far less memory."
  },
  {
    "id": "C68",
    "domain": "Deep Learning",
    "type": "mcq",
    "q": "Speculative decoding in LLM serving uses a draft model to:",
    "options": [
      "Replace the main model entirely for low-complexity tokens",
      "Generate k candidate tokens with a small fast model, then verify them with the large model in one forward pass, accepting a token prefix — increasing throughput without changing output distribution",
      "Prune the vocabulary during decoding",
      "Cache frequent output sequences"
    ],
    "correct": 1,
    "explanation": "Speculative decoding (Leviathan et al., 2022) parallelizes draft generation and verification. The large model verifies k tokens in one pass (same cost as generating 1 token), yielding 2-3x throughput gains with identical outputs. Production tell: 70B model generates 8 tokens/s; adding a 1B draft model with speculative decoding (k=4) raises throughput to 22 tokens/s with zero quality change.",
    "whatsTested": "Whether you know speculative decoding uses a fast draft model to propose tokens that the large model verifies in parallel.",
    "antiPattern": "Draft model independently generating the final output misses the key point — the large model still validates every token.",
    "staffFraming": "Draft model proposes k tokens cheaply. Target model verifies all k in one forward pass. Net speedup: 2-3x with no quality loss."
  },
  {
    "id": "C69",
    "domain": "MLOps",
    "type": "mcq",
    "q": "Progressive rollout gates in a model deployment pipeline serve to:",
    "options": [
      "Speed up deployment by skipping staging",
      "Limit blast radius by exposing the new model to increasing traffic percentages (1% → 5% → 20% → 100%), with automated rollback if key metrics degrade beyond thresholds",
      "Reduce model serving costs",
      "Enable A/B testing of hyperparameters"
    ],
    "correct": 1,
    "explanation": "Progressive (canary) rollout catches regressions before they affect all users. Each gate compares the canary's error rate, latency, and business KPIs against the baseline; a breach triggers automated rollback. Production tell: new model looks fine in shadow mode but canary at 1% traffic triggers automated rollback within 10 minutes due to 3x latency increase on a specific input pattern missed during offline eval.",
    "whatsTested": "Whether you know rollout gates detect degraded metrics before full traffic exposure, enabling safe rollback.",
    "antiPattern": "Deployment automation is a goal but the primary purpose of gates is safety — preventing bad models reaching full traffic.",
    "staffFraming": "Gate: if latency P99 or error rate crosses threshold, halt rollout. Define rollback criteria before starting."
  },
  {
    "id": "C70",
    "domain": "MLOps",
    "type": "mcq",
    "q": "Model monitoring should alert on data drift separately from prediction drift because:",
    "options": [
      "They are the same thing",
      "Data drift (P(X) shift) can precede prediction drift: feature distributions shift before the model's output distribution changes, enabling earlier intervention",
      "Prediction drift is harder to measure",
      "Data drift alerts are cheaper to compute"
    ],
    "correct": 1,
    "explanation": "Data drift is a leading indicator. Alerting on input feature distributions (via PSI or KL divergence) gives teams a warning signal before the model starts producing systematically wrong predictions. Production tell: PSI on user_age feature spikes to 0.35 (threshold 0.2) on Monday; investigation reveals a data pipeline joined on the wrong key, sending random ages to the model for 3 days before anyone noticed.",
    "whatsTested": "Whether you know data drift can cause model degradation before prediction drift is visible — it is an earlier signal.",
    "antiPattern": "Redundancy is not the reason — data drift and prediction drift provide different signal types at different times.",
    "staffFraming": "Signal chain: feature PSI (earliest) → prediction distribution → label accuracy (latest). Monitor all three layers."
  },
  {
    "id": "C71",
    "domain": "MLOps",
    "type": "mcq",
    "q": "In ML pipelines, what is the purpose of a model registry distinct from artifact storage?",
    "options": [
      "To store training data",
      "To provide lifecycle management: versioning, stage transitions (Staging → Production → Archived), lineage, and a query API so serving systems can programmatically fetch the current production model",
      "To run model inference",
      "To schedule retraining jobs"
    ],
    "correct": 1,
    "explanation": "Artifact stores (S3/GCS) hold binary files. A model registry adds metadata: who promoted this model, what its metrics are, which experiment produced it, and what stage it is in — enabling governance and automated promotion gates. In production this breaks as: without a registry, an engineer manually copies last week's model to production after a deployment script points to the wrong S3 path — no audit trail, no rollback reference.",
    "whatsTested": "Whether you know a model registry adds governance — stage tracking, approval workflows, deployment lineage — beyond artifact storage.",
    "antiPattern": "Artifact storage just stores files — a registry adds metadata, lifecycle management, and production audit trails.",
    "staffFraming": "Registry = artifact storage + governance. Stage: Staging → Production requires sign-off. Lineage: what training data + code produced this."
  },
  {
    "id": "C72",
    "domain": "MLOps",
    "type": "mcq",
    "q": "Shadow mode deployment (dark launching) differs from A/B testing in that:",
    "options": [
      "Shadow mode uses a different dataset",
      "Shadow mode routes production traffic to both models but only serves responses from the champion; the challenger's predictions are logged and compared offline without affecting users",
      "A/B testing is only for UX changes",
      "Shadow mode requires more infrastructure"
    ],
    "correct": 1,
    "explanation": "Shadow mode validates the challenger's prediction quality and latency under real traffic with zero user impact. A/B testing requires splitting real users and affects experience, whereas shadow mode is purely observational. Production tell: shadow mode reveals the new model produces null predictions for 0.3% of requests due to a missing feature handler — caught before any user was affected.",
    "whatsTested": "Whether you know shadow mode discards all responses — users never see the new model's output.",
    "antiPattern": "A/B testing serves the new model to real users — that is the key difference shadow mode is designed to avoid.",
    "staffFraming": "Shadow: real traffic, discarded responses, zero user impact. A/B: real traffic, real responses. Shadow when bad results are unacceptable."
  },
  {
    "id": "C73",
    "domain": "MLOps",
    "type": "mcq",
    "q": "The Lion optimizer (Chen et al., 2023) differs from Adam primarily in that it:",
    "options": [
      "Uses second-moment estimates like Adam",
      "Uses only the sign of the momentum update (sign descent), applying uniform step size — more memory-efficient than Adam since it stores no second moment",
      "Is a variant of AdaGrad",
      "Requires learning rate warmup exclusively"
    ],
    "correct": 1,
    "explanation": "Lion tracks only first-moment momentum and applies sign(momentum) as the update direction with a fixed LR. This removes the second-moment buffer, saving 33% memory vs Adam, while matching or exceeding Adam's performance. Production tell: switching a ViT training run from Adam to Lion reduces GPU memory 33% and allows a 30% larger batch size, improving training throughput with no accuracy regression.",
    "whatsTested": "Whether you know Lion uses only the sign of the gradient for updates, making it memory-efficient.",
    "antiPattern": "Adam with lower memory is the common guess but Lion is architecturally different — it uses sign(gradient) not magnitude.",
    "staffFraming": "Lion: update = sign(beta1*m + (1-beta1)*g). No second moment needed. 33% less memory than Adam."
  },
  {
    "id": "C74",
    "domain": "MLOps",
    "type": "mcq",
    "q": "CI/CD for ML models should include which automated check beyond unit tests?",
    "options": [
      "Only linting and formatting checks",
      "Training smoke test on a data slice, model performance regression test against a baseline metric, and schema validation of model inputs/outputs",
      "Only integration tests for the API",
      "Only Docker build verification"
    ],
    "correct": 1,
    "explanation": "ML CI/CD must validate that code changes don't degrade model behavior: a smoke train catches pipeline breakage, a regression test catches performance drops, and schema validation catches silent input contract changes. In production this breaks as: a PR renames a feature column but CI only runs unit tests; the renamed column is silently filled with NaN at serving, degrading model accuracy for 48 hours post-deploy.",
    "whatsTested": "Whether you know ML CI/CD must include automated evaluation against the current champion on a held-out test set.",
    "antiPattern": "Unit tests for the data pipeline catch software bugs but do not validate actual model performance.",
    "staffFraming": "CI gate: challenger must beat champion by a statistically significant margin on held-out data before promotion."
  },
  {
    "id": "C75",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "Product Quantization (PQ) in ANN indexing reduces memory by:",
    "options": [
      "Pruning low-magnitude vectors",
      "Decomposing each vector into M sub-vectors and quantizing each sub-vector to one of k centroids, storing only centroid IDs instead of full float vectors",
      "Using INT8 quantization on the full vector",
      "Reducing vector dimensionality with PCA first"
    ],
    "correct": 1,
    "explanation": "PQ splits a d-dimensional vector into M d/M-dimensional sub-vectors, each quantized to k centroids. Storage drops from d·32 bits to M·log₂(k) bits — typically 32× compression with controllable recall degradation. Production tell: 100M item vectors at float32 require 51GB RAM; PQ compression reduces to 1.6GB, enabling the index to fit in memory on a single node and cutting retrieval latency 10x.",
    "whatsTested": "Whether you know product quantization reduces memory by encoding full vectors as compact codebook indices.",
    "antiPattern": "Reducing dimensionality is a different approach (PCA/LSH). PQ preserves full dimensionality but compresses the representation.",
    "staffFraming": "PQ: split vector into M sub-vectors, encode each with its nearest centroid index. Memory: d×32-bit floats → M×8-bit codes."
  },
  {
    "id": "C76",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "Hierarchical Navigable Small World (HNSW) graphs have better query-time complexity than flat ANN because:",
    "options": [
      "They use exact search at the bottom layer",
      "They build a multi-layer graph where upper layers are sparse long-range connections enabling O(log N) coarse-to-fine navigation before exhaustive search in the dense bottom layer",
      "They quantize vectors at query time",
      "They partition the index into shards"
    ],
    "correct": 1,
    "explanation": "HNSW's top layers act like a skip list: each layer is a random subset of nodes with longer edges. Greedy search descends from coarse to fine, arriving near the query's neighborhood with O(log N) hops before brute-force search in the base layer. Production tell: HNSW recall drops from 0.99 to 0.82 after adding 20M new items without rebuilding; HNSW requires full index rebuild (or incremental insert with ef_construction tuning) to maintain recall as the corpus grows.",
    "whatsTested": "Whether you know HNSW achieves better query-time complexity via multi-layer graph navigation not exhaustive search.",
    "antiPattern": "Flat indexing (brute force) is the baseline — HNSW improves on it with O(log n) amortised query time.",
    "staffFraming": "HNSW: O(log n) query via hierarchical layers. Flat: O(n). Tradeoff: HNSW needs more memory but is far faster at scale."
  },
  {
    "id": "C77",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "In a learning-to-rank setup, listwise loss (e.g., LambdaRank) is preferred over pointwise loss because:",
    "options": [
      "Listwise loss is faster to compute",
      "Listwise loss directly optimizes the ranked list quality (NDCG) by weighting gradients by the NDCG gain of swapping pairs, while pointwise loss treats each item independently ignoring inter-item relevance",
      "Pointwise loss requires more labels",
      "Listwise loss handles imbalanced data better"
    ],
    "correct": 1,
    "explanation": "LambdaRank (Burges et al.) weights the pairwise gradient by |ΔNDCG| — the change in NDCG from swapping item positions. This connects the loss to the evaluation metric without requiring a differentiable NDCG proxy. Production tell: pointwise cross-entropy ranker has high AUC but poor NDCG@5; switching to LambdaRank directly optimizes the position-weighted metric and improves NDCG@5 by 4 points with the same feature set.",
    "whatsTested": "Whether you know listwise loss directly optimises the ranking metric over the full list, not individual pairs.",
    "antiPattern": "Pointwise loss treats ranking as independent classification — it misses inter-item ordering relationships.",
    "staffFraming": "Listwise (LambdaRank): gradient weighted by NDCG change from swapping pairs. Directly optimises the end metric."
  },
  {
    "id": "C78",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "Position bias in click data collected from a ranker corrupts learning-to-rank training because:",
    "options": [
      "Higher-ranked items get more clicks independent of relevance, causing the model to learn position as a proxy for relevance",
      "Lower-ranked items are never clicked",
      "Click data has too low coverage",
      "Position bias only affects retrieval, not ranking"
    ],
    "correct": 0,
    "explanation": "Users click higher-ranked items more often regardless of quality (position bias). Training on raw clicks encodes rank position into the model's relevance signal. IPS or unbiased LTR methods debias click labels. In production this breaks as: model trained on raw clicks learns to predict position, not relevance; top results perpetually favor incumbent items and new content never gets exposure to accumulate clicks.",
    "whatsTested": "Whether you know position bias means lower-ranked items get fewer clicks regardless of relevance, corrupting LTR training.",
    "antiPattern": "Items at position 1 always get more clicks — but the question is about what this does to learning-to-rank training quality.",
    "staffFraming": "Items the old ranker buried never get clicks. New model learns position 5 is bad when those items were just unseen."
  },
  {
    "id": "C79",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "MMR (Maximal Marginal Relevance) in retrieval reranking optimizes for:",
    "options": [
      "Maximum relevance to the query",
      "A linear combination of relevance to the query and diversity (negative similarity to already-selected items), iteratively selecting items to balance both objectives",
      "Minimum retrieval latency",
      "Maximum precision@K"
    ],
    "correct": 1,
    "explanation": "MMR selects items by arg max λ·sim(item, query) − (1−λ)·max_{s∈Selected} sim(item, s). Parameter λ trades off relevance vs. diversity, avoiding redundant results. Production tell: search results for 'python tutorial' show 10 nearly identical articles; adding MMR with λ=0.7 diversifies results and increases session depth by 18% without hurting relevance ratings.",
    "whatsTested": "Whether you know MMR balances relevance and diversity by iteratively selecting the item with maximum marginal relevance.",
    "antiPattern": "Pure relevance maximisation is what most retrieval does — MMR adds the diversity penalty for already-selected items.",
    "staffFraming": "MMR: next item = argmax lambda*sim(q,doc) - (1-lambda)*max_sim(doc, selected). Lambda controls relevance/diversity tradeoff."
  },
  {
    "id": "C80",
    "domain": "Ranking & Retrieval",
    "type": "mcq",
    "q": "Late interaction models (e.g., ColBERT) differ from bi-encoders by:",
    "options": [
      "Using a single encoder for both query and document",
      "Encoding query and document independently but computing relevance via a MaxSim operator over all token pairs, giving richer interaction than a single vector dot product at manageable cost",
      "Requiring full cross-attention between query and document tokens",
      "Storing precomputed dot products"
    ],
    "correct": 1,
    "explanation": "ColBERT produces per-token embeddings for query and document. Relevance = Σ_{q_i} max_{d_j} q_i·d_j (MaxSim). This is richer than bi-encoder single-vector dot product and cheaper than full cross-encoder attention at query time. Production tell: bi-encoder recall@10 is 0.72 on multi-facet queries; ColBERT's late interaction raises recall@10 to 0.84 at 2x storage cost — acceptable for high-value enterprise search.",
    "whatsTested": "Whether you know late interaction models compute token-level interactions at query time, not just embedding similarity.",
    "antiPattern": "Bi-encoders precompute item embeddings. ColBERT delays interaction to query time for better quality at higher cost.",
    "staffFraming": "ColBERT: encode separately, compute MaxSim over token embeddings at query time. Better than bi-encoder, cheaper than cross-encoder."
  },
  {
    "id": "C81",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "CUPED (Controlled-experiment Using Pre-Experiment Data) reduces variance in A/B tests by:",
    "options": [
      "Increasing sample size",
      "Regressing out pre-experiment behavior correlated with the outcome metric, reducing residual variance and enabling tighter confidence intervals with the same sample size",
      "Stratifying randomization by user segment",
      "Applying Bonferroni correction"
    ],
    "correct": 1,
    "explanation": "CUPED computes Y_cuped = Y − θ·(X_pre − E[X_pre]) where X_pre is a pre-experiment covariate correlated with Y. This covariate adjustment removes variance explained by baseline behavior, often reducing variance by 50-70%. Production tell: experiment needs 6 weeks to reach 80% power on raw revenue; adding CUPED with pre-experiment revenue as covariate reduces required runtime to 3 weeks — same statistical validity, half the time.",
    "whatsTested": "Whether you know CUPED reduces variance by regressing out pre-experiment covariates without changing the experiment design.",
    "antiPattern": "Increasing sample size also reduces variance but costs more — CUPED achieves the same effect from existing pre-experiment data.",
    "staffFraming": "CUPED: Y_cuped = Y - theta*(X - E[X]). Reduces metric variance by 20-50% using pre-experiment behaviour as covariate."
  },
  {
    "id": "C82",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "Interaction effects between concurrent A/B tests running in the same user population are a concern when:",
    "options": [
      "Tests run for different durations",
      "The treatments modify the same user behavior or metric, causing the effect of one treatment to depend on which variant of the other test a user is assigned to",
      "Tests have different sample sizes",
      "Tests measure different metrics"
    ],
    "correct": 1,
    "explanation": "If Test A changes the recommendation algorithm and Test B changes the UI, users assigned to A1+B1 may show non-additive effects. Mutual exclusion or factorial design (all combinations) are the standard mitigations. Production tell: two simultaneous tests both show +3% CTR; after launch both effects disappear because the combined treatment had a negative interaction that neither individual test could detect.",
    "whatsTested": "Whether you know concurrent experiments contaminate results when users are in multiple tests simultaneously.",
    "antiPattern": "Multiple testing correction addresses family-wise error rate — not experiment-to-experiment contamination.",
    "staffFraming": "Interaction effects: Treatment A changes how users respond to Treatment B. Use holdout layers or mutual exclusion to isolate experiments."
  },
  {
    "id": "C83",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "Network effects (social influence between users) violate the SUTVA assumption in A/B testing. The standard mitigation is:",
    "options": [
      "Increase experiment duration",
      "Cluster-based randomization: assign entire social/geographic clusters to a single variant so within-cluster spillover is contained and between-cluster comparisons remain valid",
      "Use a holdout group",
      "Apply propensity score matching"
    ],
    "correct": 1,
    "explanation": "SUTVA requires no interference between units. Social platforms violate this because treated users affect controls. Cluster randomization (by friend graph, city, or device) isolates spillover within clusters. In production this breaks as: user-level A/B on a viral sharing feature shows +10% DAU; cluster-level experiment shows +2% because control users also received viral content from treated friends.",
    "whatsTested": "Whether you know network effects violate SUTVA — control users are affected by treated users' behaviour.",
    "antiPattern": "Balance between groups is a randomisation goal, not the specific SUTVA violation that network effects cause.",
    "staffFraming": "SUTVA: each unit's outcome is independent of others' treatment. Network effects break this. Fix: cluster randomisation."
  },
  {
    "id": "C84",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "A novelty effect in an A/B test refers to:",
    "options": [
      "A bug in the random assignment",
      "An initial spike in user engagement with the treatment variant driven by curiosity, which decays over time — inflating short-term metrics and making the experiment misleading",
      "Users in the control group discovering the treatment",
      "Seasonality in traffic patterns"
    ],
    "correct": 1,
    "explanation": "Users engage more with any novel change initially. If the experiment is too short, the inflated novelty effect will be measured instead of the steady-state effect. Production tell: 1-week experiment shows +9% CTR; 4-week rerun shows +1.5% — the 1-week window captured the novelty bump and the feature would have been shipped on a false premise.",
    "whatsTested": "Whether you know novelty effect is the initial engagement spike for anything new, regardless of actual quality.",
    "antiPattern": "Selection bias is about who ended up in which group — novelty effect is about temporal behaviour change over time.",
    "staffFraming": "Novelty: users engage with new things. Decays over weeks. Always run experiments 2+ full weekly cycles to see past novelty."
  },
  {
    "id": "C85",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "Sequential testing with alpha spending functions (e.g., O'Brien-Fleming) allows:",
    "options": [
      "Stopping an experiment only at the end",
      "Peeking at results at pre-specified interim analyses while controlling overall Type I error by allocating the α budget across looks, enabling early stopping for efficacy or futility",
      "Running experiments without a sample size calculation",
      "Replacing classical p-values with Bayesian posteriors"
    ],
    "correct": 1,
    "explanation": "Fixed-horizon tests are invalidated by peeking. Alpha spending functions distribute the significance budget (e.g., 0.005, 0.01, 0.025, 0.05 across 4 looks) so the total false positive rate stays at α = 0.05 across all analyses. In production this breaks as: team peeks weekly for 4 weeks without alpha spending; effective Type I error is ~18%, meaning nearly 1 in 5 shipped features has no real effect.",
    "whatsTested": "Whether you know alpha spending allows interim looks while controlling overall Type I error via a spending function.",
    "antiPattern": "Fixed-horizon testing does not allow peeking — alpha spending specifically enables valid continuous monitoring.",
    "staffFraming": "O'Brien-Fleming: conservative early, generous late. Pocock: equal alpha at each look. Both maintain FWER across planned looks."
  },
  {
    "id": "C86",
    "domain": "Experiment Design",
    "type": "mcq",
    "q": "Holdback experiments (permanent holdout groups) in production ML serve to:",
    "options": [
      "Reduce infrastructure costs",
      "Measure the cumulative long-term effect of all shipped features relative to a baseline, since individual A/B tests only measure incremental effects of single features",
      "Replace canary deployments",
      "Test new data pipelines"
    ],
    "correct": 1,
    "explanation": "A holdback group withheld from all new features accumulates the baseline. Comparing production vs. holdback after 6-12 months gives an unbiased estimate of total product improvement. Production tell: 12 months of experiments show cumulative +35% engagement; holdback comparison reveals actual improvement is +8% — the individual experiment estimates were systematically biased upward.",
    "whatsTested": "Whether you know holdback experiments measure long-run steady-state impact after novelty effects have fully decayed.",
    "antiPattern": "A/B testing is the short-term comparison — holdback specifically measures long-run impact that A/B cannot capture.",
    "staffFraming": "Holdback: 5% of users never get a feature. After 90 days compare holdback vs everyone else. Measures true steady-state lift."
  },
  {
    "id": "C87",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "A query using a window function (e.g., ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY ts)) with a large PARTITION BY cardinality is slow. The most effective optimization is:",
    "options": [
      "Adding a covering index on (user_id, ts) so the engine can stream rows in partition order without a sort",
      "Increasing parallelism",
      "Rewriting as a self-join",
      "Materializing the entire table first"
    ],
    "correct": 0,
    "explanation": "Window functions require rows sorted by PARTITION BY + ORDER BY. A covering index on (user_id, ts) eliminates the sort step and allows the engine to stream rows in required order, converting O(N log N) sort to O(N) scan. Production tell: a session-window query runs in 4s on 10M rows; after adding the covering index it runs in 0.3s — the query plan shifts from Sort+Window to IndexScan+Window.",
    "whatsTested": "Whether you know window functions execute in the SELECT phase after WHERE filtering — they see only filtered rows.",
    "antiPattern": "Window functions applied before WHERE is the reversal confusion — the query optimizer applies WHERE first.",
    "staffFraming": "SQL order: FROM → WHERE → GROUP BY → HAVING → SELECT (windows here) → ORDER BY. Windows see the filtered dataset."
  },
  {
    "id": "C88",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "CTEs (WITH clauses) vs. temporary tables in analytical SQL: when does a temp table outperform a CTE?",
    "options": [
      "Always — temp tables are always faster",
      "When the CTE is referenced multiple times in the query and the optimizer inlines it (re-executing it per reference), while a temp table materializes once and is scanned multiple times",
      "When the dataset fits in memory",
      "When the query has no joins"
    ],
    "correct": 1,
    "explanation": "Most SQL engines (BigQuery, Postgres) do not automatically memoize CTEs referenced multiple times — they re-execute the CTE per reference. A temp table forces materialization, saving repeated computation at the cost of I/O. Production tell: a self-joining CTE that aggregates 500M rows runs for 20 minutes; materializing it as a temp table and joining the temp table twice reduces runtime to 4 minutes.",
    "whatsTested": "Whether you know temp tables outperform CTEs when the intermediate result is referenced multiple times.",
    "antiPattern": "CTEs are not always faster — in some query planners they are re-evaluated on each reference.",
    "staffFraming": "CTE: may be re-evaluated per reference. Temp table: materialised once, reused cheaply. Multi-reference → temp table wins."
  },
  {
    "id": "C89",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "Bloom filter indexes in columnar stores (e.g., Parquet, DeltaLake) accelerate queries by:",
    "options": [
      "Compressing column data",
      "Allowing the engine to skip row groups that provably do not contain a queried value by checking a compact probabilistic set membership structure — reducing I/O without scanning",
      "Sorting columns for binary search",
      "Precomputing join keys"
    ],
    "correct": 1,
    "explanation": "A Bloom filter for a column's row group encodes which values are present. A query predicate checks the filter — false means skip the row group entirely. False positives cause unnecessary reads but no incorrect results. Production tell: point-lookup on a 10TB Parquet table scans all row groups in 90s; adding Bloom filters on the id column reduces scan to relevant row groups and completes in 2s.",
    "whatsTested": "Whether you know bloom filters accelerate equality queries by quickly ruling out partitions that cannot contain the value.",
    "antiPattern": "Range queries are a different access pattern — bloom filters are specifically for equality predicates on high-cardinality columns.",
    "staffFraming": "Bloom filter: probabilistic check before reading partition. False positives possible, false negatives impossible."
  },
  {
    "id": "C90",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "In a slowly changing dimension (SCD Type 2) implementation, what columns are required to support point-in-time historical queries?",
    "options": [
      "Only a primary key and value columns",
      "A surrogate key, the natural key, effective_start_date, effective_end_date (or NULL for current), and an is_current flag",
      "A version number column only",
      "A timestamp of last update only"
    ],
    "correct": 1,
    "explanation": "SCD Type 2 preserves history by inserting new rows on change. effective_start_date and effective_end_date allow point-in-time queries: WHERE event_date BETWEEN effective_start_date AND COALESCE(effective_end_date, '9999-01-01'). Production tell: training data joins on current customer tier instead of point-in-time tier; model learns from the tier the customer is now, not the tier they had when the event occurred — introducing label leakage.",
    "whatsTested": "Whether you know SCD Type 2 requires effective_date and expiry_date columns to support point-in-time queries.",
    "antiPattern": "A single updated_at timestamp only shows when the record changed, not what the value was at any earlier point.",
    "staffFraming": "SCD Type 2 columns: surrogate_key, natural_key, attributes, effective_date, expiry_date, is_current. Required for time-travel joins."
  },
  {
    "id": "C91",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "Z-ordering (multi-dimensional clustering) in Delta Lake improves query performance on multiple filter columns by:",
    "options": [
      "Sorting the table on a single column",
      "Co-locating rows with similar values across multiple columns in the same data files, reducing files scanned when filtering on any subset of the Z-ordered columns",
      "Compressing data files",
      "Creating a secondary index"
    ],
    "correct": 1,
    "explanation": "Z-ordering maps multi-dimensional column values to a 1D Z-curve, placing rows with similar combinations of (col_A, col_B) values in the same files. Queries filtering on either column benefit from file skipping via Delta's min/max statistics. Production tell: a Delta table partitioned by date is queried frequently by (date, user_id); Z-ordering on user_id within date partitions reduces files scanned from 800 to 12 for a typical user lookup.",
    "whatsTested": "Whether you know Z-ordering clusters data on multiple columns simultaneously for efficient multi-predicate queries.",
    "antiPattern": "Single-column partitioning only helps queries filtering on the partition key — multi-column queries still scan broadly.",
    "staffFraming": "Z-ordering: interleave bits of multiple column values to co-locate related data. Dramatically reduces files scanned on multi-column WHERE."
  },
  {
    "id": "C92",
    "domain": "SQL & Data",
    "type": "mcq",
    "q": "Hash joins vs. sort-merge joins in a query planner: the optimizer prefers a hash join when:",
    "options": [
      "Both tables are large and sorted",
      "One table is small enough to fit in memory as a hash table, enabling O(N+M) join cost vs. O((N+M) log(N+M)) for sort-merge when data is unsorted",
      "The join key has low cardinality",
      "The query has an ORDER BY clause"
    ],
    "correct": 1,
    "explanation": "Hash join builds a hash table on the smaller (build) side and probes it with the larger (probe) side — O(N+M). Sort-merge requires both sides sorted — O(N log N + M log M) if unsorted. Production tell: hash join on a 50GB build table spills to disk and runs for 3 hours; pre-sorting both tables on the join key and using sort-merge completes in 20 minutes on the same hardware.",
    "whatsTested": "Whether you know the optimizer prefers hash join when one table fits in memory — no sorting required.",
    "antiPattern": "Sort-merge join is preferred for very large tables or when data is already sorted on the join key.",
    "staffFraming": "Hash join: O(n+m). Sort-merge: O(n log n + m log m). Hash wins when smaller relation fits in memory."
  },
  {
    "id": "C93",
    "domain": "ML Systems",
    "type": "mcq",
    "q": "Heterogeneous model serving (CPU inference for simple requests, GPU for complex ones) requires a routing layer that decides based on:",
    "options": [
      "Request timestamp",
      "Predicted complexity proxies such as input sequence length, estimated FLOP count, or a lightweight classifier — routing simple requests to CPU to save GPU budget",
      "User ID hash",
      "Random assignment"
    ],
    "correct": 1,
    "explanation": "Cost-aware routing reserves GPU capacity for high-complexity inputs where latency matters most. A lightweight complexity estimator (e.g., input length threshold) can reduce GPU spend 40-60% with negligible latency impact for simple requests. Production tell: 70% of API requests are short single-sentence queries; routing them to a 7B model instead of 70B cuts GPU cost 60% with a 2% quality regression that users cannot detect.",
    "whatsTested": "Whether you know heterogeneous serving requires a routing classifier that determines request complexity before dispatching.",
    "antiPattern": "Load balancing assumes homogeneous backends — heterogeneous serving needs a classifier to route by complexity.",
    "staffFraming": "Route: simple → CPU. Complex → GPU. The routing classifier must be lightweight and never the bottleneck itself."
  },
  {
    "id": "C94",
    "domain": "Optimization",
    "type": "mcq",
    "q": "In distributed data-parallel training, gradient accumulation is used to:",
    "options": [
      "Reduce model size",
      "Simulate a larger effective batch size by accumulating gradients over multiple micro-batches before performing a single optimizer step, without increasing per-GPU memory usage",
      "Improve gradient compression",
      "Enable model parallelism"
    ],
    "correct": 1,
    "explanation": "Gradient accumulation sums gradients over k micro-batches before calling optimizer.step(), achieving effective batch size k × micro_batch_size. This allows large-batch training on memory-constrained GPUs. In production this breaks as: batch norm statistics are computed per micro-batch, not the accumulated effective batch; with accumulation steps=8, batch norm sees 1/8 the intended batch size and statistics are noisy.",
    "whatsTested": "Whether you know gradient accumulation simulates larger batch sizes by accumulating gradients over multiple micro-batches.",
    "antiPattern": "Reducing memory is a secondary effect — the primary purpose is simulating large batches when GPU memory constrains batch size.",
    "staffFraming": "Gradient accumulation: accumulate for N steps, then update. Effective batch = N × micro-batch. Used when desired batch exceeds GPU memory."
  },
  {
    "id": "C95",
    "domain": "Optimization",
    "type": "mcq",
    "q": "Curriculum learning improves training efficiency by:",
    "options": [
      "Annealing the learning rate",
      "Ordering training examples from easy to hard, allowing the model to learn stable representations on simple examples before encountering noisy/hard examples that could destabilize early training",
      "Using a larger batch size for hard examples",
      "Applying data augmentation only to easy examples"
    ],
    "correct": 1,
    "explanation": "Inspired by human learning, curriculum learning (Bengio et al., 2009) improves convergence speed and generalization by presenting easy examples first. In NLP, this can mean shorter sequences or high-frequency tokens before complex ones. Production tell: training on shuffled data stalls at val loss 1.8 after 10k steps; curriculum ordering (easy-to-hard by perplexity) converges to val loss 1.6 in the same number of steps.",
    "whatsTested": "Whether you know curriculum learning trains on easy examples first, gradually increasing difficulty for faster convergence.",
    "antiPattern": "Data augmentation creates synthetic variants of existing data — curriculum learning is about difficulty ordering, not data creation.",
    "staffFraming": "Curriculum: easy → hard. Model learns stable general patterns before encountering confusing hard examples."
  },
  {
    "id": "C96",
    "domain": "Optimization",
    "type": "mcq",
    "q": "Stochastic Weight Averaging (SWA) improves generalization by:",
    "options": [
      "Averaging gradients across training steps",
      "Averaging model weights from multiple points along the SGD trajectory, landing in a flatter region of the loss landscape than any individual checkpoint — similar to free ensembling",
      "Reducing the learning rate to near zero",
      "Applying dropout during inference"
    ],
    "correct": 1,
    "explanation": "SWA (Izmailov et al., 2018) periodically snapshots weights and maintains a running average. The averaged weights occupy a wider, flatter basin than individual SGD solutions, improving generalization without training extra models. Production tell: final SGD checkpoint val accuracy is 83.2%; SWA over the last 20 epochs raises it to 84.6% with zero extra training cost — a free improvement from weight averaging.",
    "whatsTested": "Whether you know SWA averages weights across the training trajectory to find flatter minima with better generalisation.",
    "antiPattern": "Ensembling averages predictions — SWA averages the weights themselves, resulting in a single model.",
    "staffFraming": "SWA: running average of weights from last few epochs. Flatter loss basin → better generalisation. Same compute, better result."
  },
  {
    "id": "C97",
    "domain": "Optimization",
    "type": "mcq",
    "q": "Gradient clipping by global norm prevents training instability by:",
    "options": [
      "Setting all gradients below a threshold to zero",
      "Scaling the entire gradient vector when its L2 norm exceeds a threshold, preserving direction but bounding magnitude — preventing catastrophic weight updates from gradient spikes",
      "Clipping each parameter's gradient independently",
      "Increasing batch size when gradients are large"
    ],
    "correct": 1,
    "explanation": "Global norm clipping: if ‖g‖₂ > clip_value, g ← g · (clip_value / ‖g‖₂). This preserves gradient direction (unlike per-parameter clipping which distorts it) while bounding step size, critical for RNN and transformer training stability. Production tell: transformer fine-tuning without gradient clipping shows loss NaN on step 847; enabling clip_value=1.0 stabilizes training — the NaN was caused by an outlier batch triggering an exploding gradient.",
    "whatsTested": "Whether you know gradient clipping by global norm prevents exploding gradients while preserving gradient direction.",
    "antiPattern": "Per-parameter clipping distorts the gradient direction — global norm clipping scales the whole vector uniformly.",
    "staffFraming": "Global norm clip: if ||g|| > threshold, g = g × (threshold/||g||). Preserves direction. Per-param clip distorts it."
  },
  {
    "id": "C98",
    "domain": "Optimization",
    "type": "mcq",
    "q": "Mixed-precision training (FP16 compute + FP32 master weights) requires a loss scaling strategy because:",
    "options": [
      "FP16 has lower compute throughput",
      "Small gradient values underflow to zero in FP16 (values below ~6×10⁻⁸); scaling the loss magnifies gradients before the backward pass to keep them in FP16's representable range, then unscaling before the optimizer step",
      "FP32 weights cannot be updated with FP16 gradients",
      "Loss scaling reduces memory usage"
    ],
    "correct": 1,
    "explanation": "FP16 dynamic range is 5.96×10⁻⁸ to 65504. Small gradients underflow to 0, causing training to stall. Loss scaling multiplies loss by S before backward, gradients become S× larger, then unscaled before optimizer. Production tell: mixed-precision training loss flatlines at step 200 with no NaN; enabling dynamic loss scaling shows gradient norms were underflowing — loss resumes decreasing immediately after scaling is added.",
    "whatsTested": "Whether you know loss scaling is required because FP16 underflows for small gradient values.",
    "antiPattern": "FP16 overflow for large gradients is a different problem — loss scaling specifically addresses underflow.",
    "staffFraming": "FP16 minimum: ~6e-5. Typical gradients: 1e-6 to 1e-4. Without scaling many gradients underflow to 0. Loss × 1000 shifts them into FP16 range."
  },
  {
    "id": "C99",
    "domain": "Optimization",
    "type": "mcq",
    "q": "ZeRO (Zero Redundancy Optimizer) Stage 3 in distributed training partitions:",
    "options": [
      "Only optimizer states across GPUs",
      "Optimizer states, gradients, AND model parameters across GPUs — each GPU holds only 1/N of each, enabling models with parameters > single GPU memory by all-gathering parameters on demand",
      "Only model parameters",
      "Only gradients"
    ],
    "correct": 1,
    "explanation": "ZeRO Stage 1 shards optimizer states, Stage 2 adds gradient sharding, Stage 3 adds parameter sharding. Stage 3 reduces per-GPU memory to O(total_params/N) at the cost of all-gather communication during forward/backward passes. Production tell: 13B model OOMs on 8×80GB GPUs with ZeRO Stage 2; switching to Stage 3 fits training but step time increases 40% due to all-gather overhead — acceptable at this scale.",
    "whatsTested": "Whether you know ZeRO Stage 3 partitions model parameters (weights) across GPUs in addition to gradients and optimizer states.",
    "antiPattern": "Stage 1 partitions optimizer states, Stage 2 adds gradients — Stage 3 goes further and partitions the weights themselves.",
    "staffFraming": "ZeRO Stage 1: optimizer states. Stage 2: + gradients. Stage 3: + parameters. Stage 3 enables models that do not fit on one GPU."
  },
  {
    "id": "C100",
    "domain": "Model Evaluation",
    "type": "mcq",
    "q": "The McNemar test is preferred over comparing accuracy directly when evaluating two classifiers on the same test set because:",
    "options": [
      "McNemar is faster to compute",
      "McNemar tests whether the two classifiers disagree on the same examples, accounting for the paired nature of the data — unlike a z-test which ignores per-example correlation",
      "Accuracy is not a valid metric",
      "McNemar works only for binary classifiers"
    ],
    "correct": 1,
    "explanation": "McNemar's test uses the 2×2 contingency table of (correct/wrong) pairs across classifiers. It tests H₀: both models have the same error rate using only the discordant pairs, giving a more powerful paired test than treating predictions as independent samples. Production tell: two classifiers show identical accuracy (87.3%) on aggregate; McNemar's test on discordant pairs shows p=0.003, revealing Model B is significantly better on the examples that matter.",
    "whatsTested": "Whether you know McNemar test compares classifiers on the same test set by testing disagreement patterns, not just accuracy.",
    "antiPattern": "Comparing accuracy directly ignores correlation — both models see the same examples so errors are not independent.",
    "staffFraming": "McNemar: test disagreements (A right/B wrong vs A wrong/B right). Accounts for paired structure. Accuracy comparison assumes independence."
  }
];
