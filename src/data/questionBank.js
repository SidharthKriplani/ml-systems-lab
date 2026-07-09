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
  },
  {
    "id": 61,
    "domain": "Feature Engineering",
    "q": "Which technique is most effective for handling a high-cardinality categorical feature with 50,000 unique values in a gradient boosted tree?",
    "options": [
      "One-hot encoding",
      "Target encoding with leave-one-out to prevent leakage",
      "Hashing trick with 256 buckets",
      "Drop the feature — too many categories"
    ],
    "correct": 1,
    "explanation": "Target encoding maps each category to the mean target value, reducing cardinality to a single float. Leave-one-out (or cross-validated) target encoding prevents the target leakage that plain target encoding introduces. GBTs handle this single numeric representation well. One-hot encoding creates 50,000 sparse columns that destroy tree efficiency. Hashing loses semantic meaning and causes collisions.",
    "whatsTested": "High-cardinality encoding strategies for tree models.",
    "antiPattern": "One-hot encoding is intuitive but catastrophic at this cardinality — 50k columns, most near-zero, and the tree\'s split finding becomes prohibitively slow.",
    "staffFraming": "In production high-cardinality categoricals (user IDs, product IDs), we almost always use target encoding or embeddings, never one-hot. The choice depends on model type: embeddings for DNN, target encoding for GBT."
  },
  {
    "id": 62,
    "domain": "Feature Engineering",
    "q": "A rolling 7-day average feature is computed correctly during training. In production, the same feature is sometimes computed from only 3 days of data for new users. What is this an example of?",
    "options": [
      "Data leakage",
      "Training-serving skew",
      "Label noise",
      "Feature drift"
    ],
    "correct": 1,
    "explanation": "Training-serving skew: the feature computation logic differs between training and serving. Training always had 7 full days; serving computes it on whatever history is available. The model learned a distribution of the 7-day average but receives a different distribution (3-day averages are noisier, higher variance). This causes silent performance degradation, not a crash.",
    "whatsTested": "Training-serving skew due to inconsistent feature computation.",
    "antiPattern": "Data leakage would mean test data contaminated training. Here training was clean — the problem is a serving discrepancy.",
    "staffFraming": "The fix: share a single feature computation library between training and serving. If cold-start is unavoidable, use a separate indicator feature `has_full_history` and train the model on both the full and partial history cases."
  },
  {
    "id": 63,
    "domain": "Feature Engineering",
    "q": "You are feature engineering for a fraud model. You want to include `user_lifetime_transaction_count` as a feature. What is the correct approach?",
    "options": [
      "Compute it using all historical transactions up to and including the label date",
      "Compute it using all historical transactions, then join to training data",
      "Compute it as of the transaction timestamp using only past transactions",
      "Exclude it — lifetime aggregates cause leakage"
    ],
    "correct": 2,
    "explanation": "Point-in-time correctness: the feature must reflect what was known at the moment of the transaction being labeled. Joining the full lifetime count includes future transactions (ones that happen after the labeled transaction) — leakage. The correct approach: for each labeled transaction at timestamp T, count only transactions before T. This is time-travel-safe aggregation.",
    "whatsTested": "Point-in-time correctness for temporal aggregation features.",
    "antiPattern": "Option B (join all historical) is the most common production mistake — it looks correct but silently inflates performance by encoding future transaction counts.",
    "staffFraming": "All time-based aggregations in fraud/churn models must be computed as-of the label timestamp. A feature store with point-in-time join semantics (e.g. Feast, Tecton) enforces this at the infrastructure level."
  },
  {
    "id": 64,
    "domain": "Feature Engineering",
    "q": "A feature pipeline computes Z-score normalization using the training set statistics (mean=50, std=10). At serve time, the feature distribution has shifted: mean=65, std=8. What is the practical impact?",
    "options": [
      "No impact — Z-score normalization is scale-invariant",
      "The model receives out-of-distribution input but continues to produce predictions without error",
      "The model crashes at inference time",
      "The pipeline automatically recalibrates to the new distribution"
    ],
    "correct": 1,
    "explanation": "The model receives silent out-of-distribution inputs. A value of 65 (the new mean) gets normalized to Z=(65-50)/10=1.5 instead of Z=0. The model interprets this as a high feature value when it is actually average. No exception is raised — the model silently degrades. This is training-serving skew via stale normalization parameters.",
    "whatsTested": "Impact of stale preprocessing statistics in production.",
    "antiPattern": "The model does not crash — this is the dangerous part. Silent degradation is harder to catch than an error.",
    "staffFraming": "Fix: store the normalization parameters as model artifacts, version them, and monitor the distribution of raw feature values in production. Alert when input distribution drift exceeds a threshold."
  },
  {
    "id": 65,
    "domain": "Feature Engineering",
    "q": "Which of the following is most likely to cause data leakage in a customer churn model?",
    "options": [
      "Including the customer\'s plan type as a feature",
      "Including a support ticket count feature computed after the churn event",
      "Using a 30-day rolling average of logins computed before the churn event",
      "Including demographic features like age and region"
    ],
    "correct": 1,
    "explanation": "Features computed after the churn event encode the outcome: customers who already churned may have higher or lower support ticket counts because they stopped using the product. The label (churned=1) is causing the feature value, not the other way around. This is classic leakage: the feature encodes the outcome it is meant to predict.",
    "whatsTested": "Identifying temporal leakage from features computed after the label event.",
    "antiPattern": "Option C (30-day rolling average before churn) is the correct approach — strictly past data. Option B\'s support tickets after churn creates a spurious correlation.",
    "staffFraming": "Rule of thumb: for any feature, ask \'could this value have been different if the label were different?\' If yes, investigate temporal ordering."
  },
  {
    "id": 66,
    "domain": "Feature Engineering",
    "q": "You discover that `feature_x` has a Pearson correlation of 0.85 with the target in the training set but only 0.12 in a held-out validation set collected one month later. What is the most likely explanation?",
    "options": [
      "Overfitting of the correlation estimate",
      "Feature_x is temporally leaking the target",
      "The validation set is too small",
      "Pearson correlation is the wrong metric"
    ],
    "correct": 1,
    "explanation": "A large correlation in training that collapses in a temporally separated validation set is the signature of temporal leakage: the feature encodes future information that is present during training (because training and the label share a time window) but absent in the future validation window. 0.85 → 0.12 is a near-total collapse, not overfitting noise.",
    "whatsTested": "Recognizing temporal leakage from cross-period correlation collapse.",
    "antiPattern": "Overfitting of a correlation estimate would produce a modest drop (0.85 → 0.65), not a near-zero collapse. A collapse this large almost always indicates leakage or concept drift.",
    "staffFraming": "Always validate correlations on a temporally separated split. Random splits mask temporal leakage. The temporal validation set should simulate the real serve-time lag."
  },
  {
    "id": 67,
    "domain": "Model Evaluation",
    "q": "A model achieves 0.91 AUC-ROC but 0.43 AUC-PR on a dataset with 2% positive rate. Which metric should you trust and why?",
    "options": [
      "AUC-ROC — it is more widely accepted and robust",
      "AUC-PR — it is more informative for imbalanced datasets",
      "They are equivalent — use whichever your team prefers",
      "Neither — use F1 score instead"
    ],
    "correct": 1,
    "explanation": "AUC-PR is the correct metric for imbalanced datasets. AUC-ROC is inflated by the large number of true negatives: a model can achieve 0.91 AUC-ROC while having poor precision. With 2% positive rate, true negatives dominate the ROC curve, making it easy to score well. AUC-PR only considers the positive class (precision and recall), making it far more diagnostic for rare-event prediction.",
    "whatsTested": "Metric selection for class-imbalanced binary classification.",
    "antiPattern": "AUC-ROC of 0.91 sounds impressive but on a 2% positive rate dataset, it may correspond to a model that has very low precision on the actual positives.",
    "staffFraming": "For fraud, disease detection, or any rare-event problem: always report both AUC-ROC and AUC-PR. If they diverge dramatically, report AUC-PR as the headline. The business metric (precision, recall, F-beta at a specific threshold) matters most."
  },
  {
    "id": 68,
    "domain": "Model Evaluation",
    "q": "You train a regression model and report RMSE=12.4 on the test set. A colleague claims the model is not well calibrated. What does model calibration mean in the context of regression?",
    "options": [
      "The model\'s mean prediction matches the test set mean",
      "The model\'s predicted confidence intervals contain the true values at the stated coverage rate",
      "The model has low variance across cross-validation folds",
      "The RMSE is within 10% of the baseline model\'s RMSE"
    ],
    "correct": 1,
    "explanation": "Calibration for regression (or probabilistic forecasting) means that 90% prediction intervals contain the true value 90% of the time, 50% intervals contain 50%, etc. A model can have low RMSE but poorly calibrated uncertainty: it might predict a mean accurately but report overconfident intervals. This matters in production for risk-sensitive decisions (inventory planning, loan pricing) where the uncertainty estimate drives the action.",
    "whatsTested": "What calibration means for regression/probabilistic forecasting, distinct from accuracy.",
    "antiPattern": "Option A (mean prediction matching test mean) is unbiasedness, not calibration. A biased model can be well-calibrated; an unbiased model can be badly calibrated.",
    "staffFraming": "Check calibration with reliability diagrams (regression) or probability calibration curves (classification). In production, interval coverage is a key SLO for forecasting systems."
  },
  {
    "id": 69,
    "domain": "Model Evaluation",
    "q": "A team evaluates their NLP model using accuracy on a held-out test set. A reviewer notes that the test set was assembled by the same annotators who labeled the training data. Why is this a problem?",
    "options": [
      "Annotator agreement is irrelevant to model evaluation",
      "Annotators introduce consistent biases that inflate test accuracy on their own annotations",
      "The test set should be larger, not differently sourced",
      "Held-out accuracy is always a valid metric regardless of annotator overlap"
    ],
    "correct": 1,
    "explanation": "When the same annotators label both train and test, systematic annotator biases are present in both. A model that learns annotator-specific patterns (writing style, bias, edge case handling) will score high on that annotator\'s test data but fail on production data labeled differently or unlabeled. This is annotation leakage: the model fits annotator artifacts, not the underlying task.",
    "whatsTested": "Impact of annotator overlap between train and test on evaluation validity.",
    "antiPattern": "Option C (larger test set) does not fix the annotator overlap problem — a large test set with the same annotator bias is still a biased evaluation.",
    "staffFraming": "For robust NLP evaluation: hold out a cross-annotator set (different annotators, possibly different annotation guidelines), and report inter-annotator agreement separately. Production evaluation should use real user signal."
  },
  {
    "id": 70,
    "domain": "Model Evaluation",
    "q": "Which of the following is NOT a valid reason to use a validation set that is temporally more recent than the training set?",
    "options": [
      "To simulate the temporal deployment gap between training and serving",
      "To detect temporal concept drift that would cause production performance degradation",
      "To ensure the validation set has more samples than the training set for statistical power",
      "To avoid data leakage from future events into training features"
    ],
    "correct": 2,
    "explanation": "The validation set size is determined by statistical power requirements, not by a rule that it must be larger than training. Temporal splits typically result in a smaller validation set (recent data) and larger training set (historical), and that is correct. The other three options are all valid and important reasons for temporal validation splits.",
    "whatsTested": "Reasoning about temporal train/validation splits and what properties they should have.",
    "antiPattern": "Statistical power is a valid concern, but it does not dictate which split is larger. You can achieve statistical power with a smaller, temporally correct validation set.",
    "staffFraming": "In production ML, the temporal gap between your training cutoff and your evaluation period should mirror the expected deployment lag. If you retrain monthly, hold out the last month."
  },
  {
    "id": 71,
    "domain": "Model Evaluation",
    "q": "A recommendation model is evaluated using Precision@10 on a random sample of users. The system has a popularity bias: 80% of recommendations are from the top-100 most popular items. Why might Precision@10 overstate real-world performance?",
    "options": [
      "Precision@10 only measures the first recommendation",
      "Random user sampling does not account for new users without history",
      "Popular items have more interactions in the logs, making them appear more relevant in Precision@10 but not necessarily driving user satisfaction",
      "Precision@10 cannot be computed without knowing recall"
    ],
    "correct": 2,
    "explanation": "Precision@10 labels an item as relevant if it was interacted with. Popular items have high prior interaction rates — users interact with them partly because of prior exposure, not pure relevance. A model surfacing only popular items achieves high Precision@10 because popularity correlates with interaction, but it may fail on the actual business goal: helping users discover relevant long-tail items. This is popularity bias inflating the offline metric.",
    "whatsTested": "Popularity bias in recommendation system offline evaluation.",
    "antiPattern": "The issue is not new users (cold start) — it is that popular items have inflated interaction rates that make Precision@10 an overoptimistic metric for overall recommendation quality.",
    "staffFraming": "Complement Precision@10 with coverage (what fraction of the catalog appears in recommendations), serendipity, and intra-list diversity. Online A/B tests on satisfaction metrics (session time, return rate) catch what offline metrics miss."
  },
  {
    "id": 72,
    "domain": "Model Evaluation",
    "q": "A model\'s confusion matrix shows: TP=80, FP=20, FN=5, TN=895. What is the most misleading single metric to report for this model?",
    "options": [
      "Precision (80%)",
      "Recall (94%)",
      "Accuracy (97.5%)",
      "F1 score (86.5%)"
    ],
    "correct": 2,
    "explanation": "Accuracy of 97.5% sounds excellent but is dominated by the 895 true negatives. On a dataset with 85 positives and 915 negatives (about 9% positive rate), this model has meaningful false positives (20). Accuracy rewards the majority class so heavily that a model predicting all-negative would achieve 91.5% accuracy. For any imbalanced classification task, accuracy is the most misleading headline metric.",
    "whatsTested": "Understanding that accuracy is misleading for imbalanced datasets.",
    "antiPattern": "Recall of 94% is actually the most useful single metric if false negatives are costly. F1 balances precision and recall. Neither is as misleading as accuracy in this imbalanced scenario.",
    "staffFraming": "Default to reporting precision and recall (or F1 at the operating threshold) for any imbalanced problem. If a stakeholder asks \'how accurate is the model?\', redirect to the metric that reflects the business cost of each error type."
  },
  {
    "id": 73,
    "domain": "ML Systems",
    "q": "A feature store serves real-time features for a fraud model. Which component is responsible for ensuring that training features are consistent with serving features?",
    "options": [
      "The model registry",
      "A shared feature transformation library used by both the training pipeline and the serving layer",
      "The data warehouse",
      "The experiment tracking system"
    ],
    "correct": 1,
    "explanation": "Training-serving consistency requires that the same transformation code runs in both pipelines. A shared library (or a feature platform like Feast, Tecton, or an in-house equivalent) ensures the computation is identical. The model registry stores model artifacts, not feature logic. The data warehouse stores historical data but typically runs batch transformations that differ from real-time serving.",
    "whatsTested": "How to prevent training-serving skew in feature computation.",
    "antiPattern": "Storing feature values in a database solves low-latency retrieval but does not solve the consistency problem if the offline computation differs from online computation.",
    "staffFraming": "The gold standard: one feature computation function, called by both the training pipeline (offline) and the serving layer (online). Any divergence in feature code is a training-serving skew bug."
  },
  {
    "id": 74,
    "domain": "ML Systems",
    "q": "Your ML model serving layer receives 50,000 requests per second with a p99 latency SLO of 20ms. Which of the following bottlenecks is hardest to solve without changing model architecture?",
    "options": [
      "Feature retrieval latency from Redis (p99=5ms)",
      "Model inference on CPU (p99=18ms for a large GBT model)",
      "Network overhead between microservices (p99=2ms)",
      "Serialization/deserialization of the request payload (p99=1ms)"
    ],
    "correct": 1,
    "explanation": "CPU inference at 18ms already consumes 90% of the 20ms budget, leaving no headroom for feature retrieval and serialization. Moving to GPU helps for neural networks but GBTs do not parallelize well on GPU. The practical fixes — model distillation, feature reduction, quantization, or moving to a lighter model — all require changing model architecture or training. The other bottlenecks have straightforward infrastructure fixes: Redis connection pooling, service mesh optimization, payload compression.",
    "whatsTested": "Latency bottleneck analysis for ML serving systems.",
    "antiPattern": "Redis at p99=5ms sounds slow but is well within budget and can be optimized via connection pooling or local caching. The inference bottleneck is the hard one.",
    "staffFraming": "Before committing to a model architecture, benchmark inference latency at target QPS. A model that hits your accuracy target but not your latency SLO requires fundamental redesign, not tuning."
  },
  {
    "id": 75,
    "domain": "ML Systems",
    "q": "A model retraining pipeline fails silently: it completes successfully but the newly trained model is identical to last week\'s model. What is the most likely cause?",
    "options": [
      "The training dataset was corrupted",
      "The pipeline read from a stale or cached data source instead of fresh data",
      "The model architecture changed in a breaking way",
      "The learning rate was too low to make progress"
    ],
    "correct": 1,
    "explanation": "Silent identity: the pipeline runs to completion, logs no errors, and produces a model — but if the training data path is stale (a cached snapshot, a pointer to an old partition, a bug in the date parameterization), the new model is trained on old data and converges to the same weights. This is a data pipeline correctness bug that bypasses typical error detection.",
    "whatsTested": "Common failure mode in ML retraining pipelines: stale data sources.",
    "antiPattern": "A low learning rate would cause slow convergence, not an identical model. Model architecture changes cause failures, not silent reproduction of the old model.",
    "staffFraming": "Mitigation: log a hash of the training data alongside every model artifact. Alert if the training data hash matches the previous run. Monitor data freshness as a pipeline health metric."
  },
  {
    "id": 76,
    "domain": "ML Systems",
    "q": "In a two-tower recommendation system, which of the following statements about the retrieval and ranking stages is correct?",
    "options": [
      "The ranking stage operates on the full item catalog",
      "The retrieval stage uses rich cross-features between user and item",
      "The retrieval stage produces a candidate set using approximate nearest neighbor search; ranking re-scores this set with richer features",
      "Both stages share the same model weights"
    ],
    "correct": 2,
    "explanation": "The two-tower pipeline: retrieval generates a small candidate set (e.g. top-1000 from 100M items) using ANN search over learned embeddings, optimizing for recall at the cost of precision. Ranking then applies expensive cross-features (user x item interactions, context) on only the 1000 candidates. This decomposition enables the system to scale: full-catalog scoring with rich features would be computationally infeasible at query time.",
    "whatsTested": "Architecture of retrieval + ranking in industrial recommendation systems.",
    "antiPattern": "The retrieval stage cannot use cross-features (user-item interactions) because these require computing interactions across all items, defeating the purpose of the two-stage design.",
    "staffFraming": "The retrieval recall-ranking precision tradeoff: retrieval must have very high recall (don\'t miss relevant items) and ranking must have high precision (correctly re-rank the candidates). Tune retrieval to maximize recall@K, not precision."
  },
  {
    "id": 77,
    "domain": "ML Systems",
    "q": "A data scientist wants to deploy a model update that reduces AUC by 0.5% but cuts inference latency by 60%. How should this tradeoff be evaluated?",
    "options": [
      "Reject — any AUC reduction is a regression",
      "Run an A/B test measuring user-facing business metrics; latency reduction often increases online conversion more than AUC improvement does",
      "Accept — latency improvements are always worth AUC tradeoffs",
      "Compare RMSE instead of AUC to measure the true tradeoff"
    ],
    "correct": 1,
    "explanation": "Offline AUC and online business metrics are correlated but not equivalent. A 60% latency reduction can increase revenue significantly: page load time directly affects conversion rate (Amazon found 100ms = 1% revenue). A 0.5% AUC drop may be within noise. The correct decision process: run an A/B test that measures the business metric (GMV, conversion, engagement) directly, not just offline proxies.",
    "whatsTested": "Reasoning about offline metric tradeoffs vs. online business metrics.",
    "antiPattern": "Accepting any AUC reduction is not a valid heuristic — it ignores latency\'s compounding effect on user behavior. Rejecting it outright ignores the business value of speed.",
    "staffFraming": "Latency is a model quality dimension, not just an infrastructure concern. For user-facing models, a \'fast and slightly less accurate model\' often wins in A/B tests."
  },
  {
    "id": 78,
    "domain": "ML Systems",
    "q": "What is shadow mode deployment and when is it the appropriate strategy?",
    "options": [
      "Deploying a model to a small percentage of users to measure online performance",
      "Running a new model in parallel with the production model — new model receives real traffic, makes predictions, but those predictions are not served to users; used for validation before go-live",
      "A rollback strategy where the old model is kept on standby",
      "A/B testing where the shadow variant gets 1% of traffic"
    ],
    "correct": 1,
    "explanation": "Shadow mode: the new model runs on real production traffic and makes predictions, but those predictions are discarded (not served). This validates that the model: (1) processes real inputs without errors, (2) produces valid output distributions, and (3) has acceptable latency under production load. It is the appropriate strategy before launching a model with significantly different architecture or for high-stakes deployments where an online A/B test is too risky.",
    "whatsTested": "Shadow mode deployment: definition, purpose, and when to use it.",
    "antiPattern": "Canary deployment (small % of traffic) does serve predictions to a fraction of users. Shadow mode does not serve any predictions — it is purely observational.",
    "staffFraming": "Shadow mode is not optional for high-stakes ML systems (fraud, health, content moderation). Run shadow mode for at least one full business cycle before switching traffic."
  },
  {
    "id": 79,
    "domain": "Statistics & Probability",
    "q": "A p-value of 0.04 is observed in an A/B test with n=500 per group. The same experiment is replicated with n=50,000 per group and the p-value is 0.001. The effect size is identical in both experiments. What does this illustrate?",
    "options": [
      "The larger experiment found a more significant effect",
      "P-values are a function of sample size, not just effect size — a tiny, practically insignificant effect can achieve p<0.001 with sufficient n",
      "The smaller experiment was underpowered and unreliable",
      "The effect grew over time as more users were exposed"
    ],
    "correct": 1,
    "explanation": "Statistical significance is not practical significance. With n=50,000, the standard error is 10x smaller than at n=500. The same true effect size will produce a much smaller p-value. The question \'is this statistically significant?\' becomes nearly always \'yes\' at large n, even for effects that are too small to matter (e.g. 0.01% conversion improvement). The right question is: \'is this effect large enough to be worth acting on?\'",
    "whatsTested": "Understanding that p-values depend on sample size, not just effect size.",
    "antiPattern": "The experiment was not underpowered at n=500 — it correctly detected the effect at p=0.04. The point is that p-values conflate effect size and sample size.",
    "staffFraming": "Always report effect size (Cohen\'s d, relative lift) alongside p-values. Report confidence intervals. At large scale, treat clinical vs. statistical significance as separate questions."
  },
  {
    "id": 80,
    "domain": "Statistics & Probability",
    "q": "Which of the following correctly describes the frequentist confidence interval interpretation?",
    "options": [
      "There is a 95% probability that the true parameter lies within this interval",
      "If we repeat this experiment many times and construct the interval each time, 95% of such intervals will contain the true parameter",
      "The parameter has a 95% chance of being within 2 standard deviations of the mean",
      "The interval contains 95% of the observed data points"
    ],
    "correct": 1,
    "explanation": "The frequentist CI interpretation is procedural, not probabilistic: the 95% refers to the long-run frequency of intervals constructed this way, not to a probability about the parameter. Once an interval is computed, the parameter either is or is not in it — there is no probability. Option A is the Bayesian credible interval interpretation, which is what most people intuitively want from a CI.",
    "whatsTested": "Correct interpretation of frequentist confidence intervals vs. Bayesian credible intervals.",
    "antiPattern": "Option A is the intuitive interpretation but it is a Bayesian statement, not a frequentist one. This is a classic interview trap.",
    "staffFraming": "In practice, most practitioners use CIs as if they were credible intervals (option A), which is often fine as an approximation. But in a senior interview, knowing the technical distinction demonstrates statistical rigor."
  },
  {
    "id": 81,
    "domain": "Statistics & Probability",
    "q": "A Bayesian A/B test concludes with 96% probability that treatment is better than control. What does this mean?",
    "options": [
      "The p-value is 0.04",
      "Given the observed data and prior, the posterior probability that the treatment effect is positive is 96%",
      "There is a 4% chance the experiment was conducted incorrectly",
      "The confidence interval does not include zero"
    ],
    "correct": 1,
    "explanation": "In Bayesian A/B testing, the 96% is a posterior probability — a statement about belief given data and prior: P(treatment > control | observed data, prior). This is directly interpretable as \'we are 96% sure the treatment is better.\' This is what practitioners typically want but cannot get from a frequentist p-value. The p-value is not the probability the null is true or false.",
    "whatsTested": "Interpreting Bayesian A/B test outputs vs. frequentist p-values.",
    "antiPattern": "The p-value would measure P(observed data or more extreme | null hypothesis true) — very different from a posterior probability. They are numerically unrelated.",
    "staffFraming": "Bayesian A/B testing allows early stopping with correct type I error control, direct probability statements about the treatment effect, and incorporation of prior knowledge about typical lift sizes."
  },
  {
    "id": 82,
    "domain": "Statistics & Probability",
    "q": "What is the primary risk of running 20 simultaneous A/B tests on the same user population?",
    "options": [
      "Higher infrastructure cost",
      "Network effects between experiments causing interaction effects that invalidate individual test results",
      "Insufficient sample size per experiment",
      "Tests completing too quickly due to shared traffic"
    ],
    "correct": 1,
    "explanation": "Interaction effects (also called experiment interference): if treatment A and treatment B both affect the same user behavior (e.g. both modify the homepage), the effect of A measured while B is also running reflects a confounded combination, not A alone. If A changes the recommendation algorithm and B changes the layout, the measured lift of A includes the interaction between A and B. This is the core challenge of multi-experiment platforms.",
    "whatsTested": "Interaction effects in concurrent A/B testing.",
    "antiPattern": "Sample size is shared across experiments (each gets a fraction of users) but the primary risk is interaction effects, not sample size — you can always partition users correctly. Infrastructure cost is irrelevant.",
    "staffFraming": "Solutions: (1) user-level bucketing with disjoint treatment groups. (2) Holdout group that receives no experiments. (3) Interaction detection: measure if the joint treatment (A+B) effect differs from the sum of individual effects."
  },
  {
    "id": 83,
    "domain": "Statistics & Probability",
    "q": "The Central Limit Theorem states that the sampling distribution of the mean approaches normality as n increases. Which of the following conditions is necessary for this to hold?",
    "options": [
      "The underlying distribution must be normal",
      "The samples must be independent and identically distributed with finite variance",
      "The sample size must exceed 30",
      "The underlying distribution must be unimodal"
    ],
    "correct": 1,
    "explanation": "The CLT requires: (1) independence — each observation is independent of others; (2) identical distribution — same distribution, same parameters; (3) finite variance — the variance of the underlying distribution must be finite. Heavy-tailed distributions (e.g. Pareto with alpha<2) have infinite variance and the CLT does not apply. The underlying distribution does not need to be normal, and the n>30 rule is a heuristic, not a mathematical requirement.",
    "whatsTested": "Correct conditions for the Central Limit Theorem.",
    "antiPattern": "n>30 is the most common wrong answer — it is a rule of thumb for approximately normal data, not a theorem requirement. For heavy-tailed distributions, n=10,000 may not be enough.",
    "staffFraming": "In practice: check for heavy tails before relying on CLT-based inference. Revenue and session time metrics are often right-skewed; use bootstrap confidence intervals or non-parametric tests for robustness."
  },
  {
    "id": 84,
    "domain": "Statistics & Probability",
    "q": "You run an experiment where each user can generate multiple events (page views). You aggregate to the user level (mean events per user) before running a t-test. Why is this the correct approach rather than using raw events?",
    "options": [
      "User-level aggregation increases statistical power",
      "Page views from the same user are not independent — treating them as independent observations inflates sample size and underestimates variance",
      "Raw events are too noisy for parametric tests",
      "T-tests cannot handle count data"
    ],
    "correct": 1,
    "explanation": "Independence assumption violation: within-user page views are positively correlated (an engaged user generates many views, a passive user generates few). Treating N_events as N independent observations dramatically understates variance and overstates statistical power. The correct observational unit is the user. The effective sample size is the number of users, not the number of events. Failing to aggregate results in artificially narrow confidence intervals and inflated false positive rates.",
    "whatsTested": "Correct unit of analysis for A/B tests with clustered/nested data.",
    "antiPattern": "User-level aggregation typically reduces statistical power (fewer observations) but provides correct inference. The power reduction is the price of correct analysis.",
    "staffFraming": "The unit of randomization must equal the unit of analysis. If you randomize at user level, analyze at user level. If events are the unit, randomize at event level (rare and usually wrong)."
  },
  {
    "id": 85,
    "domain": "Deep Learning",
    "q": "Why does batch normalization behave differently during training vs. inference?",
    "options": [
      "It uses different activation functions during inference",
      "During training, statistics (mean, variance) are computed per mini-batch; during inference, exponential moving average statistics from training are used",
      "Dropout is applied only during training and not inference",
      "The learning rate is set to zero during inference"
    ],
    "correct": 1,
    "explanation": "During training, BN normalizes each mini-batch using its own mean and variance — this is stochastic and depends on which examples appear together. During inference, using the current batch statistics would introduce randomness that depends on what else is in the batch. Instead, BN uses running statistics (exponential moving average of training batch statistics) that were accumulated during training. model.eval() in PyTorch switches to these running statistics.",
    "whatsTested": "Train vs. inference behavior of batch normalization.",
    "antiPattern": "Dropout (option C) is also train vs. inference different, but the question is specifically about BN. Confusing the two is a common mistake.",
    "staffFraming": "Forgetting to call model.eval() before inference is a classic production bug. The model produces inconsistent predictions because it uses batch statistics from whatever batch happens to be evaluated together."
  },
  {
    "id": 86,
    "domain": "Deep Learning",
    "q": "A transformer model with 12 attention heads and d_model=768. What is the dimensionality of each head\'s key, query, and value projections?",
    "options": [
      "768",
      "64",
      "12",
      "256"
    ],
    "correct": 1,
    "explanation": "Each head operates on a subspace of dimension d_model / n_heads = 768 / 12 = 64. The Q, K, V projections for each head are 64-dimensional. Multi-head attention computes attention in these 64-dimensional subspaces in parallel, then concatenates the 12 heads\' outputs back to 768 dimensions. This decomposition allows different heads to learn different attention patterns without increasing the total parameter count.",
    "whatsTested": "Transformer multi-head attention dimensionality calculation.",
    "antiPattern": "768 (full d_model) would mean each head sees the full representation space — that defeats the purpose of multiple heads and increases compute quadratically.",
    "staffFraming": "For the BERT-base interview question: 12 heads x 64 dims = 768 total. Each head\'s Q/K/V projection is a (768, 64) matrix. Total attention parameters per layer: 3 x (768 x 64) x 12 heads + biases."
  },
  {
    "id": 87,
    "domain": "Deep Learning",
    "q": "What is gradient checkpointing and when should you use it?",
    "options": [
      "A technique to clip gradient norms to prevent exploding gradients",
      "A memory optimization that recomputes intermediate activations during backpropagation instead of storing them, trading compute for memory",
      "A method to save gradient updates to disk for distributed training",
      "A debugging tool to verify gradient flow through a network"
    ],
    "correct": 1,
    "explanation": "Gradient checkpointing (also called activation recomputation): during the forward pass, only a subset of activations are saved; the rest are recomputed during backpropagation when needed. This reduces memory from O(n_layers) to O(sqrt(n_layers)) at the cost of approximately 30% more compute. Use it when: (1) fine-tuning large models (LLaMA-70B) on limited GPU memory; (2) training with large batch sizes that don\'t fit; (3) training very deep networks.",
    "whatsTested": "Gradient checkpointing: definition, tradeoff, use cases.",
    "antiPattern": "Gradient clipping (option A) prevents exploding gradients — different problem entirely. Checkpointing is a memory/compute tradeoff, not a stability technique.",
    "staffFraming": "In practice: enable gradient checkpointing when you hit OOM during training of large models. DeepSpeed, PyTorch, and Hugging Face all support it natively. Expect ~30% training slowdown in exchange for 8-10x memory reduction."
  },
  {
    "id": 88,
    "domain": "Deep Learning",
    "q": "A model achieves 98% training accuracy and 72% validation accuracy. Increasing dropout from 0.3 to 0.5 improves validation accuracy to 78% but reduces training accuracy to 89%. What does this indicate?",
    "options": [
      "The model is underfitting",
      "Dropout at 0.5 successfully reduced overfitting by preventing co-adaptation of neurons",
      "The model needs more data, not more dropout",
      "Dropout is making the model worse overall"
    ],
    "correct": 1,
    "explanation": "The original gap (98% train, 72% val = 26% gap) is classic overfitting: the model memorized training data. Increasing dropout disrupts co-adaptation of neurons (neurons learning to rely on specific other neurons), forcing more robust feature learning. The reduced training accuracy (89%) is expected and correct: dropout makes training harder by randomly zeroing activations. Validation improvement (72%→78%) confirms reduced overfitting. The gap narrowed from 26% to 11%.",
    "whatsTested": "Effect of dropout on overfitting and the expected training vs. validation accuracy dynamic.",
    "antiPattern": "Option D is wrong — 78% val accuracy is better than 72%, not worse. The training accuracy drop from 98% to 89% is desirable when it correlates with val improvement.",
    "staffFraming": "Dropout is a regularizer; expect training accuracy to drop when it is applied. The signal that matters is validation accuracy. A 26% train-val gap screams overfitting; anything that narrows it while improving val is working."
  },
  {
    "id": 89,
    "domain": "Deep Learning",
    "q": "What problem does layer normalization solve in transformer training that batch normalization does not handle well?",
    "options": [
      "Layer norm is faster to compute than batch norm",
      "In transformers with variable-length sequences, batch norm computes statistics across the batch dimension, which includes padding tokens and makes statistics unstable; layer norm computes statistics per sample across the feature dimension",
      "Layer norm does not require learnable parameters",
      "Batch norm cannot be used in attention layers"
    ],
    "correct": 1,
    "explanation": "Transformers process variable-length sequences with padding. Batch norm computes mean/variance across all sequence positions and all examples in a batch — padding tokens (which are masked and carry no signal) corrupt these statistics. Layer norm computes statistics per sample across the feature dimension (d_model), making it independent of sequence length and batch composition. This stability makes layer norm the standard for sequential models.",
    "whatsTested": "Why layer norm is used in transformers instead of batch norm.",
    "antiPattern": "Batch norm can technically be used in attention layers, but its statistics are corrupted by padding and inter-sample dependencies. Layer norm\'s per-sample normalization sidesteps both issues.",
    "staffFraming": "Empirically: layer norm in transformers converges faster and more stably, especially with small batch sizes. In practice, you should never see batch norm in a transformer architecture."
  },
  {
    "id": 90,
    "domain": "Deep Learning",
    "q": "During fine-tuning of a large language model, you observe that the model\'s perplexity on the fine-tuning task decreases but its perplexity on the original pretraining task increases significantly. What is this phenomenon called?",
    "options": [
      "Overfitting",
      "Catastrophic forgetting",
      "Gradient exploding",
      "Distribution shift"
    ],
    "correct": 1,
    "explanation": "Catastrophic forgetting: when fine-tuning on a new task, SGD updates overwrite the weights that encoded capabilities from pretraining. The model gains task-specific performance at the cost of general capabilities. This is especially problematic for LLMs where general reasoning is valuable. Mitigations: LoRA/PEFT (freeze most weights, update only small adapter matrices), EWC (penalize changes to important weights), replay (mix pretraining data into fine-tuning).",
    "whatsTested": "Catastrophic forgetting in LLM fine-tuning.",
    "antiPattern": "Overfitting would show training perplexity decreasing and validation (same task) increasing. Catastrophic forgetting shows different-task performance degrading.",
    "staffFraming": "LoRA avoids catastrophic forgetting by design — only 0.1-1% of parameters are updated, leaving the majority of pretrained knowledge intact. Full fine-tuning risks forgetting; instruction tuning of 7B+ models should default to PEFT."
  },
  {
    "id": 91,
    "domain": "MLOps",
    "q": "Which of the following is the correct order for a blue-green deployment of an ML model?",
    "options": [
      "Train new model → deploy to production → monitor → deprecate old model",
      "Train new model → deploy to staging (green) → run shadow/canary traffic → swap traffic to green → deprecate blue",
      "Train new model → deprecate old model → deploy new model → monitor",
      "Train new model → immediately replace production model → rollback if errors"
    ],
    "correct": 1,
    "explanation": "Blue-green: blue = current production. Green = new version in staging. Steps: (1) train and validate new model offline; (2) deploy green alongside blue in staging; (3) run shadow traffic or canary (5-10%) on green to validate online; (4) when green meets SLOs, shift 100% of traffic to green; (5) keep blue available for immediate rollback; (6) deprecate blue after stability window. The key property: zero-downtime cutover with instant rollback capability.",
    "whatsTested": "Blue-green deployment process for ML models.",
    "antiPattern": "Option D (immediate replace + rollback) is a risky in-place update, not blue-green. Option A lacks the staging/validation phase.",
    "staffFraming": "For ML specifically: the canary phase is critical because model quality issues are often not caught by infrastructure health checks. Run canary long enough to observe a full business cycle (e.g. at least 24 hours for diurnal patterns)."
  },
  {
    "id": 92,
    "domain": "MLOps",
    "q": "What is data versioning in MLOps and why is it critical for reproducibility?",
    "options": [
      "Storing multiple copies of your dataset in different formats",
      "Tracking the exact data snapshot used to train each model version, enabling exact reproduction of any past model and auditing of training data for regulatory compliance",
      "Compressing training datasets to reduce storage costs",
      "Automatically augmenting training data"
    ],
    "correct": 1,
    "explanation": "Data versioning: capturing a pointer or snapshot of the exact dataset (with its schema, content, and preprocessing) used for each model training run. Without data versioning, you cannot: (1) reproduce a model trained 6 months ago (data may have been modified or deleted); (2) audit what data a regulated model was trained on; (3) debug a production incident by bisecting which data version introduced a regression. Tools: DVC, Delta Lake time travel, S3 versioning + manifest files.",
    "whatsTested": "Why data versioning is necessary for ML reproducibility and compliance.",
    "antiPattern": "Multiple format copies (option A) is storage duplication, not versioning. Versioning is about point-in-time snapshots and audit trails, not format conversion.",
    "staffFraming": "Minimum viable data versioning: log the training data S3 path + content hash in the model artifact metadata. Full versioning: DVC or Delta Lake with time-travel queries."
  },
  {
    "id": 93,
    "domain": "MLOps",
    "q": "A production ML model\'s online AUC drops from 0.87 to 0.79 over 3 months. Feature drift monitoring shows no significant changes in input distributions. What should you investigate next?",
    "options": [
      "Retrain the model immediately",
      "Investigate label drift — the relationship between features and labels (P(Y|X)) may have changed even if P(X) is stable",
      "Increase the model\'s learning rate",
      "Switch to a more complex model architecture"
    ],
    "correct": 1,
    "explanation": "When input feature distribution (P(X)) is stable but model performance degrades, the culprit is concept drift: P(Y|X) has changed. The features look the same but they now predict a different outcome. Example: a model for loan default trained pre-economic-shock. Macroeconomic conditions changed the relationship between income and default probability, even though the income distribution itself did not shift significantly.",
    "whatsTested": "Diagnosing concept drift vs. data drift when feature distributions are stable.",
    "antiPattern": "Immediate retraining is the right eventual action, but not the right next investigation step. You first need to understand whether this is concept drift, a labeling change, or a pipeline bug.",
    "staffFraming": "Monitoring hierarchy: (1) check for pipeline bugs first (data freshness, schema changes); (2) check feature distribution drift; (3) check label distribution; (4) estimate performance on a labeled holdout with recent labels (if available). Concept drift often requires both retraining and feature engineering updates."
  },
  {
    "id": 94,
    "domain": "MLOps",
    "q": "You are building an ML pipeline that processes 1TB of training data daily. Which approach minimizes end-to-end pipeline latency?",
    "options": [
      "Load all data into memory, process sequentially",
      "Process data in parallel using distributed compute (Spark/Ray) with partitioning aligned to downstream join keys",
      "Use a single-node GPU instance for all preprocessing",
      "Compress data before processing to reduce I/O time"
    ],
    "correct": 1,
    "explanation": "At 1TB/day, single-node sequential processing is I/O and memory bound. Distributed processing (Spark, Ray, Beam) partitions the data across many nodes and processes chunks in parallel. Partitioning by join keys avoids shuffle (the most expensive operation in distributed processing). GPU preprocessing is limited by PCIe bandwidth for data loading and provides minimal benefit for CPU-bound transformations.",
    "whatsTested": "Distributed data processing design for large ML pipelines.",
    "antiPattern": "Compression reduces I/O bandwidth but adds CPU overhead for decompression. On modern cloud storage, bandwidth is often the bottleneck — compression helps here, but it is secondary to parallelism.",
    "staffFraming": "Spark partition strategy: aim for 100-500MB per partition. Use `repartition(n)` on join keys before joins to co-locate matching records. Use `.cache()` if a dataset is used multiple times in the DAG."
  },
  {
    "id": 95,
    "domain": "MLOps",
    "q": "Which metric should trigger an automatic model rollback in production?",
    "options": [
      "A 2% drop in offline AUC compared to the previous model",
      "Online business metric (e.g. conversion rate or revenue per user) dropping more than X standard deviations below baseline within a time window",
      "An increase in model inference latency above 5ms",
      "A feature importance shift between model versions"
    ],
    "correct": 1,
    "explanation": "Automatic rollback should be triggered by business impact, not offline metrics. Offline AUC measured on historical data may not reflect production performance and was already evaluated before deployment. Online business metrics (revenue, conversion, engagement) with predefined threshold alerts are the right trigger: if conversion drops 3+ sigma from baseline within 1 hour of deployment, roll back automatically. Latency SLO violations are infrastructure rollbacks, not model rollbacks.",
    "whatsTested": "What metric should trigger ML model rollback.",
    "antiPattern": "Offline AUC is computed before deployment and is not a real-time production signal. It cannot trigger a rollback because it does not change after deployment.",
    "staffFraming": "Define rollback criteria before deployment: \'If metric X drops more than Y% compared to control in the first Z hours, trigger auto-rollback.\' This must be agreed with stakeholders pre-launch, not decided during an incident."
  },
  {
    "id": 96,
    "domain": "MLOps",
    "q": "What is the purpose of an ML model registry?",
    "options": [
      "To store training datasets",
      "To track, version, and manage trained model artifacts with metadata (performance metrics, training data, parameters) to enable reproducibility, auditing, and staged deployment",
      "To schedule model retraining jobs",
      "To monitor feature distributions in production"
    ],
    "correct": 1,
    "explanation": "A model registry (MLflow Model Registry, SageMaker Model Registry, Vertex AI Model Registry) is the central store for model artifacts and their metadata. Key capabilities: (1) versioning — every trained model gets a version with full lineage; (2) lifecycle management — stage transitions (staging → production → archived); (3) approval gates — require sign-off before promoting to production; (4) metadata — training data version, hyperparameters, evaluation metrics. It enables rollback to any previous version and regulatory compliance.",
    "whatsTested": "Definition and key capabilities of an ML model registry.",
    "antiPattern": "Storing training datasets is the feature store and data lake\'s job. Scheduling retraining is the pipeline orchestrator\'s job. These are separate systems.",
    "staffFraming": "Minimum viable registry: MLflow. Production-grade: integrated with CI/CD so model promotion requires passing automated quality gates and human approval."
  },
  {
    "id": 97,
    "domain": "Ranking & Retrieval",
    "q": "In a learning-to-rank system, what is the difference between pointwise, pairwise, and listwise loss functions?",
    "options": [
      "They differ in how many documents are processed per GPU forward pass",
      "Pointwise treats each document independently; pairwise optimizes relative order of document pairs; listwise directly optimizes list-level metrics like NDCG",
      "They differ only in regularization strength",
      "Pointwise is used for ads, pairwise for search, listwise for recommendations"
    ],
    "correct": 1,
    "explanation": "Pointwise: treat ranking as regression/classification on individual documents (MSE on relevance scores). Simple but ignores document relationships. Pairwise: RankNet, LambdaRank — optimize P(doc_i ranked above doc_j) for pairs. Pairwise better captures ordering than pointwise. Listwise: LambdaMART, ListNet — directly optimize list-level metrics (NDCG, MAP). Listwise is typically strongest but most expensive. LambdaMART is the industry standard for large-scale ranking.",
    "whatsTested": "Learning-to-rank loss function taxonomy.",
    "antiPattern": "The choice is not per-domain (ads/search/rec) — it depends on dataset size, metric, and compute budget. LambdaMART (pairwise-gradient, listwise-approximation) is used across all three domains.",
    "staffFraming": "In practice: LambdaMART with direct NDCG optimization is the go-to for ranking. For neural rankers: pairwise losses (hinge, cross-entropy on pairs) are common. Listwise requires sampling negative lists carefully."
  },
  {
    "id": 98,
    "domain": "Ranking & Retrieval",
    "q": "What is Approximate Nearest Neighbor (ANN) search and why is exact nearest neighbor search not used in production retrieval?",
    "options": [
      "ANN is less accurate but approximate results are acceptable for most use cases",
      "Exact nearest neighbor in high-dimensional embedding spaces is O(n×d) per query, which is too slow for real-time retrieval over millions/billions of items; ANN algorithms like HNSW and Faiss achieve sub-linear query time by building index structures that trade a small accuracy loss for 100-1000x speedup",
      "ANN uses approximate embeddings to reduce storage costs",
      "Exact search is used for small catalogs; ANN only for catalogs above 10M items"
    ],
    "correct": 1,
    "explanation": "Exact k-NN at 100M items with 256-dimensional embeddings: 100M x 256 = 25.6B operations per query. At 50,000 QPS, this is infeasible. ANN algorithms (HNSW, IVF-PQ in Faiss, ScaNN) build graph or partition structures that narrow the search to a candidate set, reducing to sub-millisecond query time. The accuracy tradeoff: recall@10 of 95-99% instead of 100%. In practice, the ranking stage compensates for the 1-5% retrieval misses.",
    "whatsTested": "Why ANN is necessary for production-scale retrieval systems.",
    "antiPattern": "The cutoff for exact vs. approximate is not 10M — it depends on QPS, latency SLO, and dimensionality. At 100k items and low QPS, exact search may be fine. At 1M items and 10k QPS, ANN is necessary.",
    "staffFraming": "HNSW (via Faiss or hnswlib) is the industry standard for low-latency ANN. For billion-scale: ScaNN (Google), Faiss IVF-PQ, or dedicated vector DBs (Pinecone, Weaviate). Tune the `ef_search` parameter to trade recall vs. latency."
  },
  {
    "id": 99,
    "domain": "Ranking & Retrieval",
    "q": "NDCG@10 is 0.72 for model A and 0.68 for model B. Model A is launched. After 2 weeks, engagement metrics are flat despite the offline gap. What is the most likely explanation?",
    "options": [
      "The NDCG difference was statistically insignificant",
      "Position bias in the click data used to compute NDCG inflated model A\'s offline score; in production without position bias, both models perform similarly",
      "The A/B test was run incorrectly",
      "Model B had better latency which offset the ranking quality difference"
    ],
    "correct": 1,
    "explanation": "NDCG is computed from logged click data, which is subject to position bias: items shown at the top get more clicks regardless of relevance. If model A learned to rank items that were historically shown at the top (and thus had more clicks), it will score higher NDCG on the click-labeled data, but this advantage may not reflect true relevance — it reflects exposure. In production with no position bias (a random or fixed position), the offline advantage disappears.",
    "whatsTested": "Position bias corrupting offline ranking metrics.",
    "antiPattern": "Statistical insignificance would require computing the variance of NDCG across queries. A 0.04 gap on a large query set is typically significant. The more likely culprit is position bias.",
    "staffFraming": "Correct offline evaluation for ranking: use inverse propensity scoring (IPS) to debias logged feedback, or use a set-aside randomized traffic for evaluation. NDCG on biased clicks is a biased metric."
  },
  {
    "id": 100,
    "domain": "Ranking & Retrieval",
    "q": "A cold-start new item has no interaction history. Which retrieval strategy is most appropriate?",
    "options": [
      "Exclude new items until they have 10 interactions",
      "Use content-based features (text embeddings, metadata, category) to generate an initial item embedding, gradually blending collaborative signal as interactions accumulate",
      "Assign the new item a random embedding in the retrieval space",
      "Force the item into all top-10 result sets to gather interaction data quickly"
    ],
    "correct": 1,
    "explanation": "Content-based cold start: derive the initial item embedding from its metadata (title, description, category, image). This places the item in a semantically meaningful position in embedding space, enabling relevant retrieval from day one. As interactions accumulate, blend in collaborative signal (interaction-based embeddings). The progressive blending (e.g. content embedding at 0 interactions → 50% blend at 50 interactions → collaborative at 500+) is a standard industry approach.",
    "whatsTested": "Cold start item embedding strategy in retrieval systems.",
    "antiPattern": "Excluding new items (option A) creates a discovery gap — users never see new content, so it never gets interactions, creating a vicious cycle. Forcing new items into all results (option D) destroys relevance.",
    "staffFraming": "In production: maintain two embedding tables (content-based and collaborative). Query both and blend at retrieval time based on interaction count. Popular items transition to collaborative embeddings; longtail items stay content-based."
  },
  {
    "id": 101,
    "domain": "Ranking & Retrieval",
    "q": "What is the primary advantage of Maximum Marginal Relevance (MMR) in search result ranking?",
    "options": [
      "It maximizes total relevance of all retrieved documents",
      "It balances relevance and diversity by penalizing redundant documents — selecting items that are relevant but dissimilar to already-selected items",
      "It is faster than standard ranking algorithms",
      "It directly optimizes for NDCG"
    ],
    "correct": 1,
    "explanation": "MMR (Carbonell & Goldstein, 1998): at each selection step, choose the document that maximizes lambda×similarity(doc, query) - (1-lambda)×max_similarity(doc, already_selected). The second term penalizes redundancy. This produces result sets that are both relevant and diverse. lambda controls the relevance-diversity tradeoff. MMR is widely used in RecSys, search, and summarization where showing 10 nearly-identical results wastes display real estate.",
    "whatsTested": "MMR as a diversity-relevance tradeoff algorithm.",
    "antiPattern": "MMR does not directly optimize NDCG (option D) — it is a greedy algorithm, not a differentiable objective. It may actually reduce NDCG while improving user satisfaction.",
    "staffFraming": "MMR is simple to implement and adds meaningful diversity. The lambda parameter is typically tuned via A/B test. For catalogs with heavy duplication (e.g. same artist\'s songs, same author\'s books), MMR or equivalent diversity constraints are essential."
  },
  {
    "id": 102,
    "domain": "Ranking & Retrieval",
    "q": "In an ads ranking system, the bid ranking formula is: rank_score = bid × pCTR. A team proposes adding a quality score multiplier. What is the business justification?",
    "options": [
      "Quality score makes the formula more complex, deterring low-quality advertisers",
      "Quality score (derived from ad relevance, landing page quality, historical CTR) incentivizes advertisers to create better ads — ads with high quality score can win at lower bids, aligning advertiser incentives with user experience",
      "Quality score is used only for budgeting, not ranking",
      "Quality score replaces pCTR in the formula"
    ],
    "correct": 1,
    "explanation": "Without quality score, the only way to rank higher is to bid more. This creates an auction where the highest bidder wins regardless of relevance, degrading user experience. Quality score (Google AdWords\' approach) creates a compound incentive: a highly relevant ad with a lower bid can beat an irrelevant ad with a higher bid. This aligns the three-way interests: users see relevant ads, publishers maximize eCPM (bid × pCTR × quality), and advertisers with genuinely relevant products pay less.",
    "whatsTested": "Role of quality score in ad ranking systems and advertiser incentive design.",
    "antiPattern": "Quality score does not replace pCTR — it modifies the ranking score alongside pCTR. pCTR is the predicted click probability; quality score captures ad quality beyond what pCTR captures.",
    "staffFraming": "The full ranking formula in production: rank_score = bid × pCTR × quality_score. The CPC charged is second-price: you pay the minimum needed to maintain your rank, not your full bid. This encourages truthful bidding."
  },
  {
    "id": 103,
    "domain": "Experiment Design",
    "q": "What is the minimum detectable effect (MDE) in A/B testing and how does it affect sample size planning?",
    "options": [
      "MDE is the effect size you observe after running the test",
      "MDE is the smallest true effect size you want to reliably detect; smaller MDE requires larger sample size, creating a tradeoff between sensitivity and experiment cost",
      "MDE is fixed at 5% for all experiments",
      "MDE determines how long you must run the experiment before checking results"
    ],
    "correct": 1,
    "explanation": "MDE (Minimum Detectable Effect): the smallest lift (e.g. 1% conversion improvement) you want your test to detect with the stated power (typically 80%). Halving the MDE quadruples the required sample size (sample size ∝ 1/MDE²). This creates a fundamental tension: detecting tiny effects requires enormous samples (weeks of traffic), but teams often overestimate practical significance. MDE should be set to the minimum lift that is worth acting on, not the minimum lift the team hopes to see.",
    "whatsTested": "MDE definition and its relationship to sample size and experiment design.",
    "antiPattern": "MDE is set before the test, not observed from results. Setting MDE too small leads to underpowered experiments that run too long or detect impractically small effects.",
    "staffFraming": "Practical MDE: ask the business \'what is the minimum lift that changes our decision?\' If conversion < 0.5% lift would not move the needle, set MDE = 0.5% and size accordingly. Common mistake: setting MDE based on what you want to detect, not what is worth acting on."
  },
  {
    "id": 104,
    "domain": "Experiment Design",
    "q": "In an A/B test for a new feature, users in the control group interact with users in the treatment group (e.g. social features, marketplace). Why is this a problem?",
    "options": [
      "It increases statistical power",
      "Network effects cause spillover: treatment effects contaminate the control group, making the measured lift an underestimate or overestimate of the true effect",
      "It is not a problem if the groups are large enough",
      "This only affects real-time streaming experiments"
    ],
    "correct": 1,
    "explanation": "SUTVA violation (Stable Unit Treatment Value Assumption): standard A/B testing assumes no interaction between treatment and control. In social/marketplace/two-sided platforms, this fails. If a treated user (seeing the new feature) messages a control user, the control user is effectively partially treated. This contamination biases the measured treatment effect — typically causing underestimation if the feature creates positive network effects (because control benefits too).",
    "whatsTested": "Network effects and SUTVA violation in A/B testing.",
    "antiPattern": "Larger groups do not solve SUTVA violations — the contamination scales with the size of the experiment. The fix requires cluster-level randomization (randomize at geographic, social graph, or marketplace segment level).",
    "staffFraming": "Solutions: (1) graph cluster randomization (randomize at friend-cluster level, not user level). (2) Holdout markets or geographic experiments. (3) Time-based splitting (pre/post, though this confounds time effects). All reduce statistical power, requiring longer experiments."
  },
  {
    "id": 105,
    "domain": "Experiment Design",
    "q": "You run an A/B test for 2 weeks and observe no statistically significant effect (p=0.21). What is the correct conclusion?",
    "options": [
      "The feature has no effect and should be abandoned",
      "Failure to reject the null does not confirm the null — the test may be underpowered; report the confidence interval for the effect size and compare to the MDE",
      "Run the test for 2 more weeks until significance is achieved",
      "Switch to a one-tailed test to find significance"
    ],
    "correct": 1,
    "explanation": "Absence of evidence is not evidence of absence. p=0.21 means the data is consistent with both \'no effect\' and \'a small effect that was not detected.\' The correct analysis: report the 95% CI for the effect size. If the CI is [-0.1%, +0.3%] and MDE was 1%, you can conclude the effect is likely smaller than practical significance. If the CI is [-2%, +4%], you are underpowered and cannot conclude anything. Pre-specify MDE and power before running.",
    "whatsTested": "Correct interpretation of non-significant A/B test results.",
    "antiPattern": "Running longer after seeing p=0.21 is p-hacking / optional stopping. Switching to one-tailed test post-hoc is p-hacking. Both inflate false positive rates.",
    "staffFraming": "Pre-commit to the decision rule before the experiment: \'If p > 0.05 and CI excludes effects larger than MDE, we will not ship.\' This prevents HARKing (Hypothesizing After Results are Known) and p-value fishing."
  },
  {
    "id": 106,
    "domain": "Experiment Design",
    "q": "What is a holdout group and why should it be maintained in a product with continuous experimentation?",
    "options": [
      "A group of users excluded from all experiments, used as a baseline to measure the cumulative long-term effect of all shipped features",
      "A group excluded from the treatment in a single A/B test",
      "A set of reserved test users for QA",
      "A statistical correction for multiple testing"
    ],
    "correct": 0,
    "explanation": "In continuous experimentation, every user is always in some experiment. Without a holdout, there is no baseline: you cannot measure the cumulative effect of all shipped changes combined. A holdout group (typically 1-5% of users) never receives any treatment, providing a clean baseline for measuring long-term cumulative impact and detecting experiment-induced seasonality. Without a holdout, you risk optimizing for local metric improvements while missing long-term degradation.",
    "whatsTested": "Purpose of a holdout group in a continuous experimentation platform.",
    "antiPattern": "Option B describes a control group within a single experiment, not a holdout. A control group is defined per experiment; a holdout is global and permanent.",
    "staffFraming": "Holdout groups reveal: (1) cumulative impact of all shipped features over time; (2) whether A/B test-measured lifts actually materialize in production; (3) seasonality effects that inflate or deflate individual experiment results."
  },
  {
    "id": 107,
    "domain": "Experiment Design",
    "q": "An experiment shows a treatment effect of +3.2% conversion (p=0.02). The same experiment shows a -1.8% revenue per conversion (p=0.09). What should you conclude?",
    "options": [
      "Ship the treatment — conversion improved significantly",
      "The experiment results are conflicting; conversion improved but revenue per conversion dropped; evaluate the joint metric (total revenue per user) before deciding",
      "The revenue drop is not significant so ignore it",
      "Run a longer test to get the revenue result to p<0.05"
    ],
    "correct": 1,
    "explanation": "Multiple metrics in an A/B test must be evaluated jointly. A +3.2% conversion with -1.8% revenue per conversion may net out to a negative or positive effect on total revenue per user. p=0.09 for revenue is not \'confirmed no effect\' — it means the evidence is weaker, not absent. The joint metric (revenue per user = conversion rate × revenue per conversion) is the business-relevant metric. Evaluating them separately and cherry-picking the significant one is p-hacking.",
    "whatsTested": "Multi-metric A/B test analysis and avoiding metric cherry-picking.",
    "antiPattern": "Option C (ignore non-significant revenue drop) is the most common and dangerous mistake. Non-significant does not mean zero effect. It means the evidence is not strong enough to conclude either direction.",
    "staffFraming": "Define a primary metric before the experiment. Secondary metrics inform context but do not override the primary. If you must evaluate tradeoffs, use a composite metric or hold a launch review where stakeholders explicitly accept the tradeoff."
  },
  {
    "id": 108,
    "domain": "Experiment Design",
    "q": "What is a novelty effect in A/B testing and how does it bias results?",
    "options": [
      "New features are inherently more novel to measure",
      "Users engage more with any new feature initially due to curiosity, inflating short-term metrics; after novelty wears off, performance returns toward baseline, causing the measured lift to overstate long-term value",
      "Novelty effects only affect UI tests, not algorithm tests",
      "Novelty effects cannot be detected and must be ignored"
    ],
    "correct": 1,
    "explanation": "Novelty bias: users over-engage with any change simply because it is new. A new UI, a new recommendation algorithm, or a new notification pattern may show 10-15% lift in the first week, then decay to 3% after 4 weeks as novelty wears off. If you measure lift during the novelty peak and ship, you will overstate the long-term impact. Conversely, change aversion (users disliking change) causes initial under-engagement that recovers — the opposite effect.",
    "whatsTested": "Novelty and change aversion effects in A/B testing.",
    "antiPattern": "Novelty effects affect both algorithm and UI tests. Users notice algorithm changes too (different content appearing in their feed).",
    "staffFraming": "Detection: run the experiment long enough to include a novelty decay period (typically 2-4 weeks). Monitor metrics week-over-week within the experiment. If lift declines week-over-week, novelty is present. Report the steady-state lift, not the peak."
  },
  {
    "id": 109,
    "domain": "SQL & Data",
    "q": "A query runs in 45 seconds without an index on a 500M-row table. After adding an index on the filter column, it runs in 0.2 seconds. For which operation type does the index NOT provide this speedup?",
    "options": [
      "Equality filter: WHERE status = \'active\'",
      "Range filter: WHERE created_at > \'2024-01-01\'",
      "Full table aggregation: SELECT COUNT(*) FROM table (no WHERE clause)",
      "Prefix search: WHERE name LIKE \'John%\'"
    ],
    "correct": 2,
    "explanation": "Full table aggregation with no WHERE clause must scan every row regardless of index. An index on status or created_at does not help COUNT(*) with no filter — the database must still read all 500M rows to count them. Indexes accelerate selective reads (point lookups, range scans on a fraction of rows). When selectivity approaches 100% (full scan), the index overhead can make things slightly worse due to extra pointer lookups.",
    "whatsTested": "When database indexes do and do not help — specifically that full table scans bypass index benefits.",
    "antiPattern": "LIKE \'John%\' (option D) can use an index on name because it is a prefix match. LIKE \'%John%\' (contains) cannot use an index. This distinction is commonly confused.",
    "staffFraming": "Index utility is proportional to selectivity. If a query returns >5-10% of rows, the query planner may choose a full scan over an index scan. Use EXPLAIN ANALYZE to verify the plan."
  },
  {
    "id": 110,
    "domain": "SQL & Data",
    "q": "In Spark, what causes a shuffle and why is it the most expensive operation?",
    "options": [
      "Any transformation on a DataFrame",
      "Operations that require data redistribution across partitions (groupBy, join, distinct, orderBy) — they require serializing, sending, and deserializing data across the network between executors",
      "Reading data from S3",
      "Writing data to Parquet"
    ],
    "correct": 1,
    "explanation": "Shuffle: any operation that requires data with the same key to be co-located on the same executor. GroupBy must gather all rows with key=\'US\' onto the same executor. This involves: (1) map stage: each executor writes its portion of each key group to local disk; (2) network transfer: shuffle data is sent across the cluster; (3) reduce stage: receiving executors deserialize and process. At 1TB scale, shuffles can take minutes. Wide transformations (shuffle) vs. narrow transformations (map, filter — no shuffle).",
    "whatsTested": "What causes shuffles in Spark and why they are expensive.",
    "antiPattern": "Reading from S3 is an I/O operation but not a shuffle. Writing Parquet is an I/O operation. The shuffle is the inter-executor communication during computation.",
    "staffFraming": "Shuffle optimization: (1) broadcast joins for small tables (avoid shuffle entirely); (2) partition on join keys before heavy join workloads; (3) tune `spark.sql.shuffle.partitions` (default 200 is often wrong); (4) use Kryo serialization to reduce shuffle data size."
  },
  {
    "id": 111,
    "domain": "SQL & Data",
    "q": "A dbt model is failing with a duplicate key error in a surrogate key generation step. The surrogate key is defined as `dbt_utils.generate_surrogate_key([\'user_id\', \'event_date\'])`. What is the most likely cause?",
    "options": [
      "dbt does not support surrogate keys",
      "There are multiple rows with the same (user_id, event_date) combination in the source data — the grain of the model does not match the expected uniqueness constraint",
      "The surrogate key function is deprecated",
      "NULL values in user_id or event_date are causing hash collisions"
    ],
    "correct": 1,
    "explanation": "Surrogate keys are only unique if the combination of source columns is unique per row. If the upstream source has multiple events per user per day (e.g. user 123 has 5 events on 2024-01-15), generate_surrogate_key produces the same hash for all 5 rows, causing a duplicate key error. The fix: either aggregate to the correct grain before generating the key, or add additional columns to the key (e.g. event_id, event_timestamp).",
    "whatsTested": "dbt surrogate key failures from grain mismatches in source data.",
    "antiPattern": "NULL handling (option D): dbt_utils handles NULLs by coercing to a string representation before hashing, so NULLs alone do not cause collisions. Grain mismatch is the primary cause.",
    "staffFraming": "Best practice: always add a `dbt test unique` and `not_null` test on surrogate keys. The grain of each model should be documented in the model header comment. Grain mismatches are the most common dbt data quality issue."
  },
  {
    "id": 112,
    "domain": "SQL & Data",
    "q": "What is a window function in SQL and when should you use it instead of a subquery or GROUP BY?",
    "options": [
      "A function that filters rows in a time window",
      "A function that computes a value across a set of rows related to the current row without collapsing the result into a single row — enabling ranking, running totals, and lead/lag without losing row-level granularity",
      "A performance optimization for large tables",
      "A function available only in PostgreSQL"
    ],
    "correct": 1,
    "explanation": "Window functions (OVER clause) compute aggregates, rankings, or offsets across a partition of rows while retaining each original row. Example: `SUM(revenue) OVER (PARTITION BY user_id ORDER BY date)` computes a running revenue total per user without collapsing to one row per user. This is impossible with GROUP BY (which collapses rows) and verbose with correlated subqueries. Use cases: running totals, rank within group, lead/lag for time-series calculations.",
    "whatsTested": "Window functions: what they are, why they are superior to correlated subqueries for these use cases.",
    "antiPattern": "A correlated subquery for ranking (SELECT * FROM t1 WHERE N = (SELECT COUNT(*) FROM t1 WHERE ...)) runs once per row — O(n²). A window function runs in O(n log n). At scale, this difference is enormous.",
    "staffFraming": "Rule: any time you need an aggregate but also need to keep individual rows, use a window function. `ROW_NUMBER()`, `RANK()`, `LAG()`/`LEAD()`, `SUM() OVER`, `AVG() OVER` are the most common. Know how `PARTITION BY` and `ORDER BY` interact within OVER."
  },
  {
    "id": 113,
    "domain": "SQL & Data",
    "q": "In a data warehouse, what is the difference between a fact table and a dimension table, and what does the \'star schema\' refer to?",
    "options": [
      "Fact tables contain text; dimension tables contain numbers",
      "Fact tables store measurable events or transactions at the grain level (e.g. each order); dimension tables store descriptive attributes (e.g. customer, product, date). Star schema: one central fact table joined to multiple dimension tables",
      "Star schema means all tables have the same number of columns",
      "Fact tables are updated daily; dimension tables are updated monthly"
    ],
    "correct": 1,
    "explanation": "Star schema: fact table at center, dimension tables as rays. Fact table: each row is an event (order, page view, transaction) with foreign keys and numeric measures (revenue, quantity, duration). Dimension table: slowly-changing attributes (customer name, product category, country). The star schema enables fast aggregation queries (join fact to dimensions for slicing) and is optimized for OLAP read workloads.",
    "whatsTested": "Data warehouse modeling: fact vs. dimension tables and star schema.",
    "antiPattern": "Dimension tables can also have numeric fields (e.g. customer age, product price). The distinction is not text vs. numbers but events/measures vs. descriptive attributes.",
    "staffFraming": "In practice: `fct_orders` (one row per order) joins to `dim_customers`, `dim_products`, `dim_dates`. Grain documentation is critical: always specify \'one row per X\' at the top of each model."
  },
  {
    "id": 114,
    "domain": "SQL & Data",
    "q": "A query uses `SELECT DISTINCT user_id FROM events WHERE event_type = \'purchase\'`. At 10 billion rows, this query is slow. What is the most effective optimization?",
    "options": [
      "Add an index on event_type",
      "Add a composite index on (event_type, user_id) — covering index eliminates the need to fetch the full row and speeds up deduplication",
      "Increase the database connection pool size",
      "Rewrite as a subquery"
    ],
    "correct": 1,
    "explanation": "Covering index: an index that contains all columns needed by the query (event_type for filter, user_id for output). With a covering index on (event_type, user_id), the database reads only the index structure — it never touches the main table rows. At 10B rows, avoiding the row lookup is the dominant optimization. The index on event_type alone (option A) still requires fetching user_id from the main table for each matching row.",
    "whatsTested": "Covering indexes for queries that filter and project a subset of columns.",
    "antiPattern": "A single-column index on event_type accelerates the filter but still requires a heap fetch for user_id. The composite (event_type, user_id) covering index eliminates the heap access entirely.",
    "staffFraming": "Covering index rule: if a query\'s WHERE and SELECT columns can all be served from the index, add all of them to the index. Put the filter column first, then the output column. Check with EXPLAIN ANALYZE that the plan shows \'Index Only Scan\'."
  },
  {
    "id": 115,
    "domain": "Optimization",
    "q": "Why does Adam optimizer typically converge faster than SGD with momentum on modern deep learning tasks?",
    "options": [
      "Adam uses a higher learning rate than SGD",
      "Adam maintains per-parameter adaptive learning rates (scaled by the second moment of gradients), allowing different features/layers to learn at appropriate speeds",
      "Adam uses second-order information (Hessian)",
      "Adam automatically tunes all hyperparameters"
    ],
    "correct": 1,
    "explanation": "Adam computes per-parameter learning rates: parameters with large historical gradients get smaller effective LR; sparse parameters (rare features) get larger effective LR. This adaptivity handles the heterogeneity of gradients across layers (early layers have smaller gradients than later layers) and across features (frequent vs. rare). SGD + momentum uses a global LR for all parameters, which requires careful tuning per model architecture. Adam\'s adaptivity provides a better default, especially for models with embedding layers.",
    "whatsTested": "Why Adam converges faster than SGD: per-parameter adaptive learning rates.",
    "antiPattern": "Adam does not use the Hessian (option C) — that is Newton\'s method and is O(n³) for n parameters. Adam approximates the diagonal of the Hessian using the running second moment of gradients.",
    "staffFraming": "Adam practical note: Adam often generalizes slightly worse than well-tuned SGD on computer vision tasks. For NLP/transformers and embeddings, Adam (or AdamW) is standard. Use AdamW (Adam + decoupled weight decay) over Adam for regularized training."
  },
  {
    "id": 116,
    "domain": "Optimization",
    "q": "What does learning rate warmup do and why is it important for transformer training?",
    "options": [
      "Warmup prevents overfitting by starting with a low LR",
      "Warmup increases LR from near-zero to the target LR over the first N steps. Early in training, model weights are random and gradient estimates are noisy — large LR updates from random initialization can send weights to bad regions. Warmup allows the optimizer to build reliable gradient statistics before taking large steps",
      "Warmup is only necessary for CNNs",
      "Warmup doubles the effective batch size"
    ],
    "correct": 1,
    "explanation": "At the start of training, Adam\'s second moment estimate (v_t) is initialized to zero and takes several steps to stabilize. With bias correction, early steps can have inflated effective LR. Additionally, with random initialization, all layers have unstable, poorly calibrated gradient directions. Warmup (linear or square root) starts with a tiny LR, lets the model develop stable gradient statistics, then ramps to the target LR. Without warmup, loss often spikes or diverges early in training for large models.",
    "whatsTested": "Purpose and mechanism of learning rate warmup.",
    "antiPattern": "Warmup is not primarily about overfitting — it is about optimization stability. It is essential for transformers and was introduced in \'Attention Is All You Need\'.",
    "staffFraming": "Standard transformer training recipe: linear warmup for 4-10% of training steps, then cosine annealing to near-zero. The warmup steps should be proportional to model size — larger models need more warmup."
  },
  {
    "id": 117,
    "domain": "Optimization",
    "q": "A model\'s training loss oscillates wildly but the validation loss is stable and slowly decreasing. What does this indicate?",
    "options": [
      "The model is overfitting",
      "The learning rate is too high for the training data but the validation set is a different distribution",
      "The batch size is too small, causing noisy gradient estimates; the oscillation is sampling noise, not a model quality problem",
      "The model architecture has too many parameters"
    ],
    "correct": 2,
    "explanation": "Wild training loss oscillation with stable (decreasing) validation loss is the signature of a small batch size with a reasonable learning rate. Small batches produce high-variance gradient estimates — each batch is a noisy sample of the true gradient. The oscillation reflects batch-to-batch variance, not a fundamental problem. Validation loss, computed on the full validation set, averages out this noise and shows the true trend. Fixes: increase batch size (smooths gradients), use gradient accumulation, or reduce LR.",
    "whatsTested": "Diagnosing training loss oscillation from small batch size.",
    "antiPattern": "Overfitting (option A) would show training loss continuing to decrease while validation loss starts to increase. Oscillating training loss with decreasing validation loss is the opposite pattern.",
    "staffFraming": "Practical diagnostics: if smoothing training loss (EMA with alpha=0.98) shows a clean downward trend, the oscillation is batch noise. If even the smoothed loss oscillates, the LR may be too high."
  },
  {
    "id": 118,
    "domain": "Optimization",
    "q": "Gradient clipping is applied when the gradient norm exceeds a threshold. Which type of model most commonly requires gradient clipping and why?",
    "options": [
      "CNNs, because pooling layers amplify gradients",
      "RNNs and transformers trained on long sequences, because gradients can explode through time steps or attention layers, causing parameter updates to overshoot",
      "Linear models, because analytical solutions are unavailable",
      "Models with BN, because BN destabilizes gradients"
    ],
    "correct": 1,
    "explanation": "Exploding gradients are most common in RNNs (gradient signals must pass through many time steps via repeated weight matrix multiplication — eigenvalues > 1 cause exponential growth) and in transformers with large attention weights. Gradient clipping rescales the entire gradient vector if its L2 norm exceeds a threshold (typically 1.0), preventing single large updates that destabilize training. CNNs have bounded gradient flow through pooling; BN stabilizes rather than destabilizes.",
    "whatsTested": "Why gradient clipping is needed for RNNs/transformers specifically.",
    "antiPattern": "BN (option D) actually reduces gradient exploding by normalizing activations — BN networks are more stable, not less. Clipping is needed precisely when there is no BN-equivalent stabilization.",
    "staffFraming": "Implementation: `torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)`. Monitor gradient norms during training. If clipping fires frequently (>10% of batches), the LR is likely too high or the model architecture is unstable."
  },
  {
    "id": 119,
    "domain": "Optimization",
    "q": "What is the difference between first-order and second-order optimization methods, and why are second-order methods rarely used for training deep neural networks?",
    "options": [
      "Second-order methods are slower to converge",
      "Second-order methods (Newton\'s method, L-BFGS) use curvature information (Hessian) to take larger, more informed steps, but computing or approximating the Hessian for a model with millions of parameters is prohibitively expensive — O(n²) memory for the full Hessian, O(n) for diagonal approximations",
      "Second-order methods cannot handle stochastic gradients",
      "There is no practical difference for neural networks"
    ],
    "correct": 1,
    "explanation": "Newton\'s method step: delta_theta = -H⁻¹∇L, where H is the n×n Hessian. For a model with n=100M parameters: storing H requires 100M² floats ≈ 40TB. Computing H⁻¹ is O(n³). Practical approximations: L-BFGS stores a low-rank approximation (expensive for neural nets); K-FAC uses a structured Kronecker-product approximation (used in some large-scale settings but not mainstream). First-order methods (SGD, Adam) scale to billions of parameters; second-order methods do not.",
    "whatsTested": "Why second-order optimization is not used for training DNNs — computational complexity.",
    "antiPattern": "Second-order methods DO converge faster (fewer iterations) than SGD — the issue is that each iteration is vastly more expensive. At small scale (few thousand parameters), L-BFGS works well.",
    "staffFraming": "For DNN training: always use Adam/AdamW or SGD+momentum. Second-order methods appear in DNN research (K-FAC, Shampoo) but are not mainstream production practice. For convex optimization (logistic regression, SVM), L-BFGS is excellent."
  },
  {
    "id": 120,
    "domain": "Optimization",
    "q": "A model trained with a large batch size achieves lower training loss but worse generalization than the same model trained with a small batch size and same number of epochs. Why?",
    "options": [
      "Large batches cause gradient explosion",
      "Large batches produce more accurate gradient estimates that converge to sharp minima — regions with high curvature that do not generalize well. Small batches add gradient noise that acts as an implicit regularizer, steering toward flat minima that generalize better",
      "Small batches benefit from the learning rate schedule more than large batches",
      "Large batches overfit because more data is processed per update"
    ],
    "correct": 1,
    "explanation": "Generalization gap from large batches (Keskar et al., 2017): large-batch SGD converges to sharp minima (high curvature) because clean gradients always point downhill steeply. Small-batch SGD\'s noisy gradients cause the optimization to escape sharp minima and settle in flat minima (low curvature), which generalize better — small perturbations to weights in flat regions do not significantly change loss. Mitigation: large-batch training with linear LR scaling rule and warmup helps but may not fully close the gap.",
    "whatsTested": "Generalization gap between large and small batch training: sharp vs. flat minima.",
    "antiPattern": "Large batches do not overfit in the traditional sense (option D) — they achieve lower training loss. The problem is the geometry of the solution found, not the amount of data processed.",
    "staffFraming": "Practical implication: if you must use large batches (for GPU utilization), increase LR proportionally (linear scaling rule: LR *= batch_size / reference_batch_size) and add warmup. Gradient noise from small batches is not always a bug — sometimes it is the regularizer."
  },
  {
    "id": 121,
    "domain": "Recommender Systems",
    "q": "In a deep RecSys ranker with dense features plus high-cardinality categoricals (user_id ~100M, item_id ~10M), where does almost all the parameter count and memory live?",
    "options": [
      "In the MLP hidden layers — deep nets are parameter-heavy",
      "In the embedding tables — a 100M-id feature at d=64 is ~6.4B params (~25GB fp32), dwarfing the MLP",
      "In the attention layers, which scale quadratically with feature count",
      "In the output softmax over items, requiring hierarchical softmax"
    ],
    "correct": 1,
    "explanation": "Each categorical id indexes a learned (num_ids x d) matrix; the tables, not the dense MLP, dominate parameters. A 100M-id feature at d=64 is ~6.4B params (~25GB in fp32). This is why DLRM-scale systems shard embedding tables across many hosts while keeping the small dense compute replicated.",
    "whatsTested": "Whether you understand that embedding tables (not the MLP) are the memory reality of deep RecSys, driving the model-parallel sharding pattern.",
    "antiPattern": "Blaming the MLP layers and reaching for hidden-unit pruning — the MLP is tiny relative to the tables.",
    "staffFraming": "Deep RecSys is a sparse-memory problem, not a dense-compute one: shard the tables (model parallel), replicate the dense net (data parallel)."
  },
  {
    "id": 122,
    "domain": "Recommender Systems",
    "q": "What does DeepFM give you over Wide & Deep?",
    "options": [
      "It adds a wide linear path that Wide & Deep lacks",
      "It replaces Wide & Deep's hand-crafted cross features with a Factorization Machine that learns all 2nd-order feature crosses automatically via shared embeddings",
      "It removes embedding tables, so it needs far less memory",
      "It applies attention over the user's history, which Wide & Deep cannot"
    ],
    "correct": 1,
    "explanation": "Wide & Deep's wide side needs a human to specify which cross-product features matter. DeepFM swaps that manual step for a Factorization Machine that learns every pairwise (2nd-order) interaction automatically through the shared embeddings, keeping a deep MLP for higher-order patterns. It eliminates cross engineering, not embedding tables.",
    "whatsTested": "Whether you can articulate that DeepFM automates the feature-cross engineering that Wide & Deep requires by hand.",
    "antiPattern": "Thinking DeepFM removes embeddings or adds a wide path — it removes the manual cross-engineering step.",
    "staffFraming": "The axis is 'who engineers the crosses': Wide & Deep = the human; DeepFM/DLRM = the model, via FM or explicit dot products."
  },
  {
    "id": 123,
    "domain": "Recommender Systems",
    "q": "A user's history has running shoes, a cookbook, and a phone case. Scoring a sneaker vs a blender, what does DIN's local-activation attention do that a fixed pooled user vector cannot?",
    "options": [
      "It concatenates the full history into the MLP, giving both candidates the same richer input",
      "It attends over the history w.r.t. each candidate — up-weighting running shoes for the sneaker, ignoring it for the blender — making the user representation candidate-dependent",
      "It truncates the history to the most recent item",
      "It applies bidirectional attention, which is what distinguishes DIN from SASRec"
    ],
    "correct": 1,
    "explanation": "DIN's local activation runs attention over the behaviour history relative to the candidate: the same history contributes different signal per item, so the effective user vector changes with the candidate. A single pooled vector is identical for both candidates and cannot express 'relevant to a sneaker but not a blender'.",
    "whatsTested": "Whether you grasp candidate-dependent user representation (local activation) as DIN's core mechanism.",
    "antiPattern": "Confusing DIN's per-candidate attention with recency truncation or with BERT4Rec's bidirectionality.",
    "staffFraming": "The tell for reaching for DIN: the recent-history-vs-candidate interaction is the dominant signal that a pooled two-tower vector destroys."
  },
  {
    "id": 124,
    "domain": "Recommender Systems",
    "q": "You want a sequential recommender you can also run autoregressively to predict the next item from a prefix. SASRec or BERT4Rec, and why?",
    "options": [
      "BERT4Rec — bidirectional attention gives the strongest representations, so it is always preferred",
      "SASRec — unidirectional (causal) self-attention trained to predict the next item is naturally autoregressive; BERT4Rec's masked-cloze objective is not a pure left-to-right generator",
      "Either — the only difference is BERT4Rec trains faster",
      "Neither — sequence models can't do next-item prediction"
    ],
    "correct": 1,
    "explanation": "SASRec uses causal left-to-right self-attention to predict the next item, so it is directly usable autoregressively. BERT4Rec uses bidirectional self-attention with a masked-item (cloze) objective, seeing future context in training for stronger representations, but that objective is not a pure next-item generator.",
    "whatsTested": "Whether you know the unidirectional (SASRec) vs bidirectional-masked (BERT4Rec) distinction and its consequence for autoregressive next-item prediction.",
    "antiPattern": "Assuming 'bidirectional = strictly better', ignoring that it forfeits clean autoregressive generation.",
    "staffFraming": "Match the training objective to the serving need: causal for next-item generation, masked/bidirectional for representation quality."
  },
  {
    "id": 125,
    "domain": "Recommender Systems",
    "q": "In a two-tower retriever trained with sampled softmax / InfoNCE, why is the choice of negatives often more decisive for recall than making the encoder deeper?",
    "options": [
      "Deeper encoders always overfit, so negatives are irrelevant",
      "Positives are fixed by the data, so the entire learning signal is shaped by which negatives sit in the softmax denominator; wrong negatives (too easy, or popularity-biased) cap recall regardless of encoder depth",
      "Encoder depth only affects latency, never accuracy",
      "Negatives only change the ANN index geometry"
    ],
    "correct": 1,
    "explanation": "The contrastive gradient pulls the user toward the positive and pushes it away from each negative. The positives are given by the data, so the negatives in the denominator define what the model is pushed away from. A better encoder refines a signal the negatives define; too-easy or popularity-biased negatives cap recall no matter how deep the tower is.",
    "whatsTested": "Whether you understand that the negative-sampling scheme, not encoder architecture, is the first-order lever on retrieval recall.",
    "antiPattern": "Reaching for a deeper tower to fix recall before auditing the negative distribution.",
    "staffFraming": "Fix the negatives before deepening the encoder — sampling scheme dominates recall."
  },
  {
    "id": 126,
    "domain": "Recommender Systems",
    "q": "Trace the in-batch popularity-collapse failure. Why does naive in-batch training over-suppress popular items?",
    "options": [
      "Popular items have larger embeddings that saturate the softmax",
      "Popular items are positives for many users, so in any batch they appear as negatives for everyone else; the gradient pushes nearly all users away from them, the model learns 'popular = negative', and recall on the most-wanted items collapses",
      "Popular items are sampled less often, so they stay under-trained and random",
      "The ANN index deprioritises high-degree nodes at query time"
    ],
    "correct": 1,
    "explanation": "In-batch negatives are drawn from the interaction distribution, so a popular item shows up as a negative for almost every user whose positive it isn't. The contrastive gradient then pushes almost all users' embeddings away from it, including users who would love it. The model learns 'popular = negative' and head recall craters.",
    "whatsTested": "Whether you can mechanistically trace in-batch popularity collapse rather than just name it.",
    "antiPattern": "Attributing the collapse to embedding magnitude or the ANN index instead of the sampling distribution.",
    "staffFraming": "The bug is causal-in-the-sampler: in-batch sampling correlates 'is a negative' with 'is popular'."
  },
  {
    "id": 127,
    "domain": "Recommender Systems",
    "q": "What does the logQ (sampled-softmax) correction do, and why is it more than a nicety for in-batch training?",
    "options": [
      "It normalises embedding magnitudes into [-1, 1]",
      "It subtracts each item's log sampling probability from its logit (u·v - log Q(j)), undoing in-batch over-representation of popular items as negatives — which is what prevents popularity collapse",
      "It adds L2 regularisation to the embedding tables",
      "It replaces the softmax with a sigmoid for implicit feedback"
    ],
    "correct": 1,
    "explanation": "In-batch sampling over-represents popular items as negatives, systematically over-penalising them. Subtracting log Q(j) from each logit de-biases the objective back toward an unbiased estimate, which is exactly what stops the popularity-collapse feedback loop. It is load-bearing, not a marginal tweak.",
    "whatsTested": "Whether you know the logQ correction's mechanism and that it is the fix for in-batch popularity collapse.",
    "antiPattern": "Treating logQ as an optional regulariser rather than the debiasing step in-batch training needs.",
    "staffFraming": "logQ is what keeps in-batch training from eating itself; expect it probed whenever you mention in-batch negatives."
  },
  {
    "id": 128,
    "domain": "Recommender Systems",
    "q": "Your team runs a solid two-tower retriever plus a GBDT ranker on tabular features. When is switching the ranker to DLRM or DIN actually justified?",
    "options": [
      "Always — deep architectures strictly dominate GBDTs on tabular ranking",
      "When there's a concrete signal a GBDT captures poorly: many high-cardinality categorical crosses you don't want to hand-engineer (DLRM), or a dominant recent-history-vs-candidate interaction (DIN); absent that, the DL model mostly adds serving cost and embedding-table memory",
      "Whenever offline AUC is below 0.9",
      "Only when the catalog exceeds 1M items"
    ],
    "correct": 1,
    "explanation": "GBDTs are a strong tabular default. DLRM earns its cost when un-engineered high-cardinality crosses dominate (explicit pairwise interactions over embeddings); DIN earns it when the history-vs-candidate interaction dominates (local activation). Without such a signal, the heavier architecture buys cost and embedding-table memory, not accuracy.",
    "whatsTested": "Whether you apply when-each-fits judgement rather than cargo-culting deep RecSys over a strong GBDT baseline.",
    "antiPattern": "Assuming DL strictly dominates GBDTs on tabular ranking and switching without a concrete signal.",
    "staffFraming": "Name the specific interaction the GBDT misses before proposing DLRM/DIN — otherwise you're spending latency and memory for nothing."
  },
  {
    "id": 129,
    "domain": "Experimentation",
    "q": "A challenger model shows +3% AUC offline. Your manager wants to ship on that number alone. Best response?",
    "options": [
      "Ship it — a 3% offline AUC lift is a large, reliable launch signal.",
      "Offline AUC is measured on data the old model shaped and ignores product impact; run a live champion/challenger A/B sized for the MDE that matters, and judge on the real product metric plus guardrails.",
      "Ship to 100% with a fast rollback ready — that is equivalent to an A/B test.",
      "Retrain until offline AUC exceeds +5%, then ship without a live test."
    ],
    "correct": 1,
    "explanation": "Offline metrics are computed on logs the incumbent shaped (feedback/exposure bias) and do not measure product impact. Only a live A/B on the product metric, with guardrails, licenses a launch.",
    "whatsTested": "Offline-vs-online gap; why AUC does not launch a model.",
    "antiPattern": "Treating an offline metric lift as a ship decision.",
    "staffFraming": "A staff engineer reframes 'is the model better?' as 'is the product better, measured live, without tripping a guardrail?'"
  },
  {
    "id": 130,
    "domain": "Experimentation",
    "q": "A 50/50 experiment logs 50.1% control and 47.9% treatment across 2M users after a day. What should you conclude?",
    "options": [
      "A 2-point gap is normal randomization noise at this scale; proceed.",
      "This is a sample-ratio mismatch — at 2M users that split is astronomically unlikely by chance, so randomization or logging is broken; every downstream metric is untrustworthy. Chi-square to confirm, then stop and fix the plumbing.",
      "Treatment is simply less popular — log it as a negative engagement finding.",
      "Re-randomize only the treatment arm to rebalance, then continue."
    ],
    "correct": 1,
    "explanation": "SRM is a chi-square goodness-of-fit on the observed split vs intended ratio. A significant deviation means broken assignment/logging (a crashing arm dropping users, failed redirects), making the arms non-comparable — so no metric is trustworthy until fixed.",
    "whatsTested": "SRM as the first plumbing sanity check.",
    "antiPattern": "Reading the treatment effect before validating the assignment split.",
    "staffFraming": "The first thing a senior person checks is the split, not the lift."
  },
  {
    "id": 131,
    "domain": "Experimentation",
    "q": "A new ranker lifts session clicks +2.1% (p<0.01), but p99 latency rose 80→130ms and revenue/session dropped 0.8%. Launch?",
    "options": [
      "Yes — the target metric won decisively; latency and revenue are secondary.",
      "No — latency and revenue are guardrail metrics the launch must not harm; a +2.1% click win that adds 50ms p99 and drops revenue is a guardrail breach, not a ship. Investigate the tradeoff first.",
      "Yes, but only for mobile users, since latency only matters on slow connections.",
      "Re-run without logging latency so the guardrail cannot block a significant win."
    ],
    "correct": 1,
    "explanation": "Guardrails (latency, error rate, revenue, crash/report rates) are non-negotiables. ML-specific failure modes (heavier network → p99 latency, feedback loops) surface in guardrails, not the headline metric. A target win that trips one is not a launch.",
    "whatsTested": "Guardrail metrics gating a launch.",
    "antiPattern": "Shipping on a significant target-metric win while ignoring guardrail regressions.",
    "staffFraming": "Define the guardrails and their thresholds before the test starts, not after a win."
  },
  {
    "id": 132,
    "domain": "Experimentation",
    "q": "A noisy metric needs six weeks of traffic for a 1% MDE and you do not have it. What does CUPED do and why does it help?",
    "options": [
      "It increases the treatment effect so the same effect is easier to detect.",
      "It uses each user pre-experiment behavior as a covariate to subtract predictable baseline variance (Y_adj = Y − θ(X − E[X])); the effect stays unbiased because X is pre-treatment, but variance drops by ~ the squared pre/post correlation — shrinking the MDE or runtime at the same n.",
      "It raises alpha from 0.05 to 0.10, making significance easier without more data.",
      "It replaces the metric with a lower-variance proxy by definition."
    ],
    "correct": 1,
    "explanation": "CUPED regresses out pre-period variance. Since X is pre-treatment it cannot be affected by assignment, so the effect estimate is unbiased; variance falls ~ρ², commonly 30–50%, cutting required n proportionally — free power from a join to historical data.",
    "whatsTested": "CUPED mechanism: reduces variance (noise), not the effect.",
    "antiPattern": "Believing CUPED changes the effect estimate or the alpha level.",
    "staffFraming": "CUPED is the cheapest lever to finish a test sooner — a covariate join, no extra traffic."
  },
  {
    "id": 133,
    "domain": "Experimentation",
    "q": "A PM wants to stop a fixed-horizon A/B test 'the moment it hits p<0.05,' refreshing the dashboard daily. Why is this dangerous and what is the fix?",
    "options": [
      "It is fine — p<0.05 means 95% confidence whenever observed, so early stopping is valid.",
      "Each extra look is another chance for noise to cross alpha, so repeated peeking inflates the true false-positive rate well above 5% (toward 100% with continuous peeking). Use sequential testing / always-valid p-values / group-sequential boundaries that spend the error budget across looks.",
      "The only harm is a smaller sample size; peeking itself does not affect the FPR, so plan a larger n.",
      "Switch to a one-sided test, which halves the p-value and makes early stopping safe."
    ],
    "correct": 1,
    "explanation": "Fixed-horizon significance is only valid at one pre-planned look. Multiple looks multiply the chances of a spurious crossing; ~20 daily peeks push the real FPR from 5% toward ~64%. Always-valid/sequential methods maintain the guarantee under continuous monitoring.",
    "whatsTested": "The peeking problem and sequential/always-valid remedies.",
    "antiPattern": "Stopping a fixed-horizon test early the instant p<0.05.",
    "staffFraming": "If you must watch the dashboard, use a method built to be peeked at."
  },
  {
    "id": 134,
    "domain": "Experimentation",
    "q": "You need to detect a 0.5% lift instead of 1%, holding alpha and power fixed. Roughly how does required sample size change, and cheapest offset?",
    "options": [
      "It roughly doubles (n ∝ 1/MDE); the only fix is to wait twice as long.",
      "It roughly quadruples (n ∝ 1/MDE², halving MDE squares the factor); the cheapest offset is CUPED — cutting variance 30–50% with pre-period data lowers required n without extra traffic or runtime.",
      "It stays the same — MDE affects only power, not sample size.",
      "It roughly halves, because a smaller effect is easier to detect."
    ],
    "correct": 1,
    "explanation": "Required n per arm ∝ variance/MDE², so halving the MDE quadruples n. Reducing the numerator (variance) via CUPED is the cheapest lever when you cannot add traffic.",
    "whatsTested": "The n ∝ 1/MDE² relationship and the variance lever.",
    "antiPattern": "Assuming sample size scales linearly (not quadratically) with the effect you want to detect.",
    "staffFraming": "Power math has a quadratic wall in MDE; the practical escape is variance reduction, not just more users."
  },
  {
    "id": 135,
    "domain": "Causal Inference",
    "q": "Users who received a discount email spent more, on average, than users who didn't. To make this a causal claim rather than just a correlation, what is the single fact about potential outcomes that stands in the way, no matter how much data you collect?",
    "options": [
      "Nothing stands in the way: with enough users the difference in means converges to the causal effect by the law of large numbers, no matter how the email list was built or who chose to open it.",
      "The real obstacle is that the email platform's send logs are usually incomplete, so this is a data-engineering gap, not a fact about potential outcomes or missing counterfactuals at all.",
      "For every user you observe exactly one of Y_i(1) (spent, if emailed) and Y_i(0) (spent, if not) — the other is the counterfactual, missing for every user, always, by construction.",
      "The obstacle is collinearity between a user's income and their email open rate, which a simple difference in means cannot separate without adding a regression adjustment for income."
    ],
    "correct": 2,
    "explanation": "This is the Fundamental Problem of Causal Inference: you observe exactly one of the two potential outcomes per unit, never both, so no volume of data recovers any individual's treatment effect — you can at best estimate the average (ATE) under design assumptions like randomization.",
    "whatsTested": "Whether you can name the Fundamental Problem of Causal Inference precisely, rather than reaching for a data-quality or modeling explanation.",
    "antiPattern": "Treating this as a sample-size or feature-engineering problem. More data narrows a confidence interval; it never fills in a counterfactual that was never observed for anyone.",
    "staffFraming": "A staff-level answer immediately separates 'we need a better estimator' from 'this quantity is structurally unobservable for any one person' — the first is solvable with more data, the second never is."
  },
  {
    "id": 136,
    "domain": "Causal Inference",
    "q": "A drug trial enrolling only motivated volunteers reports ATE = +5 points on a health scale. A policymaker wants to mandate the drug nationwide on the strength of that number. What's the estimand problem?",
    "options": [
      "There is no problem — randomization inside the trial guarantees the +5 estimate generalizes uniformly to every citizen, including people who would never have volunteered to enroll in the first place.",
      "The trial's sample really gives you ATT (effect on self-selected volunteers), not the ATE the mandate needs — check covariate overlap with the target population before extrapolating.",
      "The number is invalid outright, since volunteer-only trials can never support any causal claim regardless of internal randomization, sample size, blinding, or how carefully the outcome was measured.",
      "The fix is simply to rename the estimate CATE instead of ATE, since conditioning implicitly on 'having volunteered' is mathematically identical to conditioning on any observed covariate X."
    ],
    "correct": 1,
    "explanation": "Randomization inside the trial only guarantees internal validity for the enrolled sample; it says nothing about whether that sample represents the mandate's target population. Volunteers plausibly differ systematically (health-consciousness, baseline severity) from people who'd be compelled to take the drug, so the ATT-labeled-as-ATE substitution is the estimand error, not a validity error.",
    "whatsTested": "Whether you distinguish estimands (ATE vs ATT) from internal validity, and recognize that a well-randomized trial can still answer the wrong population-level question.",
    "antiPattern": "Assuming randomization alone certifies generalizability. Randomization balances confounders within the enrolled sample; it does not make that sample representative of anyone who wasn't in it.",
    "staffFraming": "Before recommending a policy off a trial number, a staff engineer asks 'who was actually eligible to be in this experiment' before asking 'was the experiment well run.'"
  },
  {
    "id": 137,
    "domain": "Causal Inference",
    "q": "A social platform treats 10% of users with a new feature and compares their engagement to the untreated 90%. Why does this likely underestimate, not overestimate, the true treatment effect?",
    "options": [
      "It doesn't — comparing treated to untreated users is exactly the correct estimator whenever the treated share is a random 10% of the full user base, by definition of randomization.",
      "Overestimation is actually the risk here, since treated users' novelty-driven engagement spike inflates the apparent effect relative to the untreated group's steady baseline behavior.",
      "The 90% 'untreated' group is really just a smaller, underpowered comparison sample here, so the resulting gap is noisier but not systematically biased toward under- or over-estimating the truth.",
      "Untreated users are indirectly exposed through treated connections (a SUTVA violation), so their baseline is already spillover-contaminated, shrinking the measured gap below the real effect."
    ],
    "correct": 3,
    "explanation": "This is the classic SUTVA failure from network interference: treating some users changes what untreated-but-connected users experience, inflating the 'control' baseline above what it would be with zero treatment anywhere in the network — which shrinks (not grows) the observed treated-vs-untreated gap relative to the true effect.",
    "whatsTested": "Whether you can identify SUTVA violations from network interference specifically, and reason about the direction of the resulting bias, not just its existence.",
    "antiPattern": "Assuming any bias from interference must inflate the effect. Spillover into the control arm typically drags the comparison toward zero, understating rather than overstating the true effect.",
    "staffFraming": "Test for this by comparing outcomes in clusters with high vs. low treated-neighbor density — if the gap shrinks with density, you have interference, and the fix is cluster-level randomization, not more users."
  },
  {
    "id": 138,
    "domain": "Causal Inference",
    "q": "Why does a properly executed coin-flip randomization protect against confounders even ones you never thought to draw in a DAG, while an observational adjustment set never can?",
    "options": [
      "It doesn't fully protect against unmeasured confounders either — randomization only balances the covariates the experimenter explicitly measures and checks for balance after the fact.",
      "A DAG-based adjustment set is supposedly safer, since it forces explicit reasoning about every backdoor path, whereas randomization is often dismissed as a blunt tool offering no comparable guarantee.",
      "A fair coin flip makes assignment independent of every unit trait, measured or not, so the arms are balanced in expectation on confounders nobody thought to record, not just DAG ones.",
      "Randomization works only because sample sizes in RCTs are typically much larger than in observational studies, and larger samples are what actually balances unmeasured confounders."
    ],
    "correct": 2,
    "explanation": "A DAG-derived adjustment set only protects against confounders the analyst thought to draw and could measure. Randomization instead makes assignment statistically independent of every unit characteristic — known or not — so, in expectation, the arms are balanced on everything, which is precisely the guarantee no observational adjustment set can offer.",
    "whatsTested": "Whether you understand randomization's guarantee as unconditional on which confounders you happened to think of, versus adjustment-set methods which are conditional on correct specification.",
    "antiPattern": "Treating 'we adjusted for enough covariates' as equivalent to 'we randomized.' The former is only as good as the analyst's foresight; the latter needs no foresight at all.",
    "staffFraming": "When asked to defend a causal claim, a staff engineer's first question is 'was this randomized,' because it's the only design that doesn't rest on the analyst having thought of everything."
  },
  {
    "id": 139,
    "domain": "Causal Inference",
    "q": "For a checkout-flow A/B test, what is the real tradeoff between randomizing at the user level versus the page level, and which would you pick for a redesign that changes the whole flow?",
    "options": [
      "User-level gives one consistent experience with no within-user contamination; page-level gains more power at the highest contamination risk. Pick user-level, since a mixed redesign would muddy the effect.",
      "Page-level is strictly better in every single case, since more randomization events always produce a larger effective sample size and therefore always yield a more trustworthy result here.",
      "There is no real tradeoff at all — any unit of randomization produces the same expected estimate, so the choice should be made purely on whatever is most convenient to engineer for this test.",
      "User-level should never be used for checkout tests specifically, because logged-out users cannot be tracked consistently, making page-level randomization the only technically feasible option."
    ],
    "correct": 0,
    "explanation": "The unit of randomization is a real design decision: finer units (page, session) buy more power per user but risk a user experiencing both arms within one journey, contaminating exactly the kind of before/after comparison a checkout redesign relies on. For a whole-flow redesign, user-level consistency matters more than the extra power.",
    "whatsTested": "Whether you can name the actual power-vs-contamination tradeoff across units of randomization and apply it to a concrete scenario, rather than treating unit choice as interchangeable.",
    "antiPattern": "Picking the unit that maximizes sample size without considering whether within-unit contamination invalidates the very comparison the test is trying to make.",
    "staffFraming": "Choose the unit of randomization before anything else is designed — it constrains what a clean comparison can even mean for this particular change."
  },
  {
    "id": 140,
    "domain": "Causal Inference",
    "q": "In an A/B test, 80% of users assigned to a new feature actually load it; nobody in control crosses over. ITT comes out to $6.40 per user. What is the effect on users who actually used the feature, and what assumption does that estimate require?",
    "options": [
      "CACE = ITT / compliance rate = $6.40 / 0.80 = $8.00; it requires monotonicity — no control user would have used the feature even if somehow assigned to it.",
      "CACE = ITT × compliance rate = $6.40 × 0.80 = $5.12; it requires that every non-complier would have had exactly zero effect had they actually used the feature.",
      "The $6.40 figure already is the effect on compliers, since ITT by definition only ever averages over users who received and used their assigned condition.",
      "There is no way to recover the complier-only effect from ITT alone; you would need a fully separate observational study with propensity-matched compliers to estimate it."
    ],
    "correct": 0,
    "explanation": "Under one-sided non-compliance (monotonicity: no control-side crossover), ITT = P(complier) × CACE, so CACE = ITT / compliance rate = $6.40 / 0.80 = $8.00. The $8.00 tells you what the feature itself is worth to people who use it; the $6.40 tells you what shipping to everyone, non-compliers included, will actually move.",
    "whatsTested": "Whether you can correctly apply the CACE formula under one-sided non-compliance and state the monotonicity assumption it depends on, not just recite the division.",
    "antiPattern": "Confusing ITT with CACE, or applying the CACE division without the one-sided (no control crossover) assumption it actually requires — under two-sided crossover you need the Wald estimator instead.",
    "staffFraming": "Report both numbers with their different jobs: ITT for 'what happens if we ship to everyone,' CACE for 'is the feature itself worth building.'"
  },
  {
    "id": 141,
    "domain": "Causal Inference",
    "q": "After an A/B test concludes, you split the control group in half and compare the two halves on the primary metric — an AA test. What does a significant difference between the two control halves tell you?",
    "options": [
      "Nothing concerning at all — some variation between any two random halves of a group is fully expected by chance and can simply be ignored when interpreting the original AB test result.",
      "It means the primary metric itself is fundamentally too noisy ever to be used for decision-making, regardless of how the original experiment's randomization was implemented.",
      "It signals the randomization or assignment infrastructure has a systematic bias — some feature of it created groups that weren't exchangeable — so the AB result from that pipeline can't be trusted yet.",
      "It confirms the treatment effect measured in the AB test was real, since a difference between two supposedly identical groups validates that the test had enough statistical power."
    ],
    "correct": 2,
    "explanation": "An AA test is a direct diagnostic on the assignment mechanism itself: since both halves are 'control,' any true effect is zero, so a significant difference implicates the randomization or logging pipeline, not sampling luck alone. Any AB result produced by that same infrastructure is suspect until the AA test comes back clean.",
    "whatsTested": "Whether you know the AA test's actual purpose — validating the randomization infrastructure — rather than treating it as a routine sanity check with no diagnostic weight.",
    "antiPattern": "Shrugging off a failed AA test as ordinary noise. A significant AA result is specifically evidence the two 'identical' groups weren't exchangeable pre-treatment, which undermines every AB result the same pipeline has produced.",
    "staffFraming": "Run the AA test before trusting a surprising AB win, especially on infrastructure that's new or recently changed — it's the cheapest check against a broken experiment platform."
  },
  {
    "id": 142,
    "domain": "Causal Inference",
    "q": "A marketplace feature can only be tested by randomizing whole cities (SUTVA forces this — treated cities' effects leak within-city). With ICC = 0.1 and 100 users per city cluster, roughly how much does the design effect inflate the required sample size versus individual-level randomization?",
    "options": [
      "It doesn't inflate anything meaningful — DEFF only matters when cluster sizes vary a lot, and with equal-sized clusters individual-level and cluster-level randomization need the same sample size.",
      "DEFF is approximately 1 + (m−1) × ICC, approximately 1 + 99 × 0.1, approximately 10.9 — you need roughly 11 times the sample size individual-level randomization would otherwise require.",
      "The inflation is exactly equal to the number of clusters used in the test, regardless of how many users sit inside each individual cluster.",
      "DEFF applies only to binary outcome metrics; for continuous metrics like GMV per user, cluster-level randomization needs no sample size adjustment at all."
    ],
    "correct": 1,
    "explanation": "DEFF is approximately 1 + (m−1) × ICC with m = cluster size and ICC = intraclass correlation. Here 1 + (100−1) × 0.1 is approximately 10.9 — nearly an 11x sample-size penalty versus individual-level randomization, unavoidable whenever SUTVA forces cluster-level assignment (social, marketplace, or city-level features with few large clusters).",
    "whatsTested": "Whether you can apply the DEFF formula correctly and recognize cluster randomization's real statistical cost, not just its qualitative existence.",
    "antiPattern": "Treating cluster randomization as a free substitute for individual-level randomization with no power cost, when in practice it can require an order of magnitude more users to reach the same power.",
    "staffFraming": "When SUTVA forces cluster-level randomization, budget for the DEFF penalty up front in the power analysis — discovering it after the test is already running is a duration surprise nobody wants."
  },
  {
    "id": 143,
    "domain": "Classical ML",
    "q": "A credit model reports odds ratio = 1.8 for 'missed a payment in the last 6 months.' A junior analyst tells the credit committee: 'applicants with that history are 1.8x more likely to default.' What's wrong with that claim?",
    "options": [
      "Nothing is wrong — an odds ratio of 1.8 is by definition the same number as a relative risk of 1.8, so the analyst's plain-English translation is exactly correct here.",
      "The odds ratio multiplies the odds of default by 1.8, not the probability; when default is common, that 1.8x on the odds scale translates to a smaller multiplier on the probability scale.",
      "The real error is a sign flip — an odds ratio of 1.8 actually means the missed-payment group is less likely to default, since odds ratios above 1 point in the opposite direction from what's claimed.",
      "The odds ratio can't be interpreted at all without first standardizing every other feature in the model, so no claim about this coefficient is valid until that's done."
    ],
    "correct": 1,
    "explanation": "An odds ratio (e^w) multiplies the odds P/(1−P), not the probability P. Odds and probability only track each other closely when the event is rare; away from that, an odds ratio of 1.8 moves the actual default probability by less than 1.8x. Report the model's predicted probabilities, not just the odds ratio, when the audience is going to hear it as a risk multiplier.",
    "whatsTested": "Whether you know an odds ratio scales odds, not probability, and that conflating the two overstates the true risk multiplier once the base rate isn't tiny.",
    "antiPattern": "Treating 'odds ratio' and 'relative risk' as interchangeable — they only converge when the outcome is rare; for common outcomes they diverge substantially.",
    "staffFraming": "When a business audience hears 'X times more likely,' that's a probability-ratio claim. An odds ratio needs translating into predicted probabilities before it's stated that way."
  },
  {
    "id": 144,
    "domain": "Classical ML",
    "q": "You're training an L1-penalized (Lasso) logistic regression for fraud detection with 8,000 one-hot merchant-category and merchant-ID features over 3,000 labeled fraud cases (p ≫ n), hoping for a short, stable list of risk drivers. Two teammates flag different concerns — which one is the real structural limit of Lasso here, not just an implementation detail?",
    "options": [
      "None — Lasso has no structural feature-count limit; the only real risk with p ≫ n is slower convergence, fixable by raising max_iter or switching solvers.",
      "Lasso saturates at roughly n (~3,000) selected features, and its picks among correlated merchant features are unstable run to run — elastic net fixes both via an added L2 component.",
      "The real limit is that L1 cannot be combined with logistic regression at all — L1 penalties are only defined for the squared-error loss that OLS uses, not for cross-entropy.",
      "Lasso will simply keep every one of the 8,000 features with a nonzero weight in this regime, since the L1 penalty only activates once the sample size exceeds the number of features."
    ],
    "correct": 1,
    "explanation": "With more features than samples, Lasso saturates at roughly n selected features, and among correlated features (multiple merchants in the same category, near-duplicate merchant IDs) its flat penalty along tied directions makes the specific selection unstable run to run. Elastic net keeps L1's sparsity while its L2 component both allows exceeding the n-feature cap and holds correlated groups together instead of arbitrarily picking one.",
    "whatsTested": "Whether you know Lasso's p > n selection cap and correlated-feature instability, and that elastic net specifically addresses both, not just one.",
    "antiPattern": "Treating a p ≫ n regularization choice as purely a compute/convergence question rather than a structural limit on how many features L1 can even select.",
    "staffFraming": "In a p ≫ n regime with correlated features, default to elastic net over pure Lasso — pure L1's selection is both capped and unstable exactly when you need it to be a reliable feature list."
  },
  {
    "id": 145,
    "domain": "Classical ML",
    "q": "Two engineers each independently add a near-duplicate feature to a deployed OLS pricing model — session_length_sec and session_length_min, which differ only by a fixed /60 scale factor. Retraining on the same data with a different solver produces very different coefficients for these two features, but the model's actual predictions barely change. A teammate is alarmed the model is broken. What's really going on, and what would switching to Ridge change?",
    "options": [
      "The model genuinely is broken — any coefficient instability between retraining runs means the fitted line itself is different and the predictions are unreliable regardless of what the numbers show.",
      "This is ordinary sampling noise from a small training set; the fix is simply gathering more rows, since coefficient instability is always a symptom of insufficient data volume.",
      "This is the duplicate-column/near-collinearity trap: many weight splits fit equally well, so OLS returns an arbitrary one; Ridge instead settles deterministically on the minimum-norm, roughly even split.",
      "The instability means the two features have opposite signs of true effect on price, and Ridge's job is to figure out which one is the real driver and zero out the other."
    ],
    "correct": 2,
    "explanation": "Two columns that are exact rescalings of each other make only their (rescaled) sum affect any prediction, so OLS has a whole tied line of equally-good solutions and an arbitrary solver detail decides which point on that line it returns — predictions stay stable because only the sum matters, but the individual weights wobble. Ridge breaks that tie deterministically by landing on the minimum-norm point on the tied line (roughly the even split), because its penalty specifically minimizes the sum of squared weights among the tied solutions.",
    "whatsTested": "Whether you can diagnose the duplicate/near-collinear-feature coefficient-instability pattern and explain concretely what Ridge's closed form does to fix it, rather than just calling it 'regularization helps.'",
    "antiPattern": "Assuming any coefficient instability across runs means the model's predictions are wrong — collinearity can make weights unstable while leaving predictions essentially untouched.",
    "staffFraming": "Before debugging 'unstable coefficients' as a data or bug problem, check whether two features are near-duplicates — that alone explains wobbling weights with stable predictions, and Ridge (not more data) is the fix."
  },
  {
    "id": 146,
    "domain": "Classical ML",
    "q": "A team L2-regularizes a logistic regression fraud model without standardizing first. transaction_amount ranges $1–$50,000; is_new_account is a 0/1 flag. Both are about equally predictive on their own, but after training, is_new_account's weight is shrunk close to zero while transaction_amount's survives largely intact. What's the most likely cause, and the fix?",
    "options": [
      "is_new_account is genuinely the weaker predictor here — the shrinkage is doing its job correctly, and no data preprocessing change is needed before trusting this result.",
      "The penalty judges weights by size, not usefulness — a dollar-scale feature needs a tiny weight, a 0/1 flag needs a large one, so the same lambda hits them unequally. Standardize both features first.",
      "L2 regularization structurally cannot be applied to binary 0/1 features at all; the fix is to drop is_new_account from the penalty entirely while still regularizing transaction_amount.",
      "The issue is that transaction_amount needs a log transform before fitting, and once that's applied the weight imbalance will resolve on its own without touching the regularization setup."
    ],
    "correct": 1,
    "explanation": "L2 (and L1) penalize weights by their raw magnitude, not by how much they matter. A dollar-scale feature needs a tiny per-unit weight to have a meaningful effect on the logit, so the penalty barely touches it; a 0/1 flag needs a comparatively large weight for the same effect, so the same lambda hammers it. Standardizing every feature onto a common scale before fitting makes the penalty judge features by usefulness rather than units.",
    "whatsTested": "Whether you can trace an asymmetric-shrinkage bug back to missing standardization, rather than to genuine feature importance.",
    "antiPattern": "Reading post-regularization weight size as a proxy for feature importance without first checking whether every feature was standardized onto the same scale.",
    "staffFraming": "Any time regularized coefficients look surprising, check standardization before concluding anything about which features matter."
  },
  {
    "id": 147,
    "domain": "Classical ML",
    "q": "A team sweeps λ for a Ridge model and picks the value that minimizes error measured on the same training set it was fit on. What will they observe, and why is this the wrong way to choose λ?",
    "options": [
      "They'll observe validation error climbing steadily as λ increases from that chosen point, since a Ridge penalty large enough to matter on training data always overcorrects on held-out data too.",
      "They'll observe the sweep always preferring λ = 0, since training error is smallest with no penalty at all — the whole point of the penalty is a cost that training error alone never rewards paying.",
      "They'll observe no consistent pattern, since training error is not a monotonic function of λ and can decrease, increase, or plateau unpredictably as the penalty grows.",
      "They'll observe the sweep landing on a very large λ, since heavy shrinkage minimizes training error by forcing predictions toward the target's mean, which is the smallest error attainable."
    ],
    "correct": 1,
    "explanation": "Training error is smallest exactly where the penalty is weakest, since the penalty exists to trade a little training fit for lower variance on unseen data — a training-error sweep will therefore always prefer λ = 0, defeating the purpose of regularizing at all. Lambda has to be chosen by measuring error on held-out data (cross-validation / a validation curve), not training error, which is why RidgeCV and LassoCV both search over held-out folds.",
    "whatsTested": "Whether you know training error is monotonically minimized at zero penalty, making it structurally the wrong signal for choosing lambda.",
    "antiPattern": "Tuning any regularization hyperparameter against the same metric the loss is already directly minimizing — training error will always vote for the least regularization.",
    "staffFraming": "Any hyperparameter that trades training fit for something else (variance, generalization) needs a held-out signal to tune — training error can't see the thing you're trying to buy."
  },
  {
    "id": 148,
    "domain": "Classical ML",
    "q": "You're predicting delivery time in minutes. Being 30 minutes late on a rare order triggers a costly support escalation; being 2 minutes off on a typical order is essentially free. Should model selection be driven by MAE or RMSE, and why?",
    "options": [
      "MAE, because it is more interpretable in raw minutes and business stakeholders generally find averages easier to communicate than any other error metric in a status update.",
      "RMSE, because squaring the errors before averaging makes a few large, costly misses count for much more than many small, cheap ones — matching how the errors actually cost the business.",
      "Neither — R² is the right choice here since it is unitless and therefore comparable across different delivery routes and time-of-day windows without any further adjustment.",
      "MAE, because RMSE is undefined whenever a small number of predictions are exact hits (residual of zero), which delivery-time data will frequently include."
    ],
    "correct": 1,
    "explanation": "RMSE squares each error before averaging, so a few large, expensive misses (the 30-minute-late orders) pull the metric up far more than many small, cheap misses (2 minutes off) — matching a cost structure where big errors are disproportionately costly. MAE weighs every minute of error equally regardless of size, which is the right choice when errors really do cost proportionally to their magnitude, but not here. R² measures fraction of variance explained, not the cost-weighted usefulness of the model, and doesn't address the actual question. RMSE is well-defined with exact-hit residuals of zero; that's not a real constraint.",
    "whatsTested": "Whether you can match an error metric to a real cost asymmetry, not just recite MAE/RMSE definitions.",
    "antiPattern": "Treating interpretability (MAE reads like plain minutes) as the deciding factor when the actual business cost is disproportionately sensitive to large misses.",
    "staffFraming": "Before picking an error metric, ask how the business actually loses money on a miss — proportional to the miss size (MAE) or disproportionately punished by big misses (RMSE)."
  },
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
