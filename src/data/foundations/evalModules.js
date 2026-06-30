export const EVAL_MODULES = [
  {
    id: 'metrics_first_principles',
    title: 'Eval Metrics from First Principles',
    subtitle: 'Confusion matrix, precision, recall, F1, why accuracy fails',
    difficulty: 'foundational',
    estimatedMin: 32,
    tags: ['metrics', 'precision', 'recall', 'F1', 'confusion matrix'],
    summary: `Accuracy on imbalanced data is misleading — a fraud model that never fires achieves 99.9% accuracy on a 0.1% fraud rate dataset and catches nothing. The problem is that collapsing all four confusion matrix cells (TP, FP, TN, FN) into one number destroys the information you actually need. Precision tells you whether your positives are trustworthy (TP/(TP+FP)); recall tells you whether you're finding all the real positives (TP/(TP+FN)). These two metrics trade off against each other through the decision threshold, and that tradeoff is a business decision: in cancer screening, a missed positive is a missed cancer so you lower the threshold and accept more false alarms; in spam filtering, a blocked legitimate email is a UX failure so you raise the threshold and accept more spam. F1 uses the harmonic mean specifically because it refuses to let one number compensate for a catastrophically bad other — F1(P=0.9, R=0.1) = 0.18, not 0.5. F-beta formalizes the cost ratio of FP vs FN so you can encode it once and optimize consistently.`,
    keyPoints: [
      `**Accuracy on imbalanced data is a trap.** With 1% positive class, predicting all-negative gives 99% accuracy and 0% recall. The model is useless — it has learned nothing — and the metric is rewarding that. Never use accuracy as your primary metric for fraud, medical diagnosis, or any rare-event task. The right question is not "how often is the model right overall?" but "of all the positives, how many does it catch, and of all its predicted positives, how many are real?"`,
      `**Precision and recall answer different questions about different failure modes.** Precision: when you raise an alarm, how often are you right? Recall: of all the real alarms, how many did you catch? Raising your decision threshold makes you more selective (higher precision, fewer FPs) but causes you to miss more real cases (lower recall, more FNs). The failure mode of optimising only one: a high-precision/low-recall system misses most real positives; a high-recall/low-precision system floods downstream workflows with false alarms.`,
      `**F1 is harmonic, not arithmetic.** F1(P=0.9, R=0.1) = 0.18, not 0.5. That is intentional — a model with dismal recall cannot hide behind excellent precision. F1 also equals 0.18 for the reverse case P=0.1, R=0.9. The harmonic mean punishes imbalance between precision and recall; the arithmetic mean would not. Use F1 when you care roughly equally about FPs and FNs.`,
      `**F-beta is a business-driven parameter, not a tuning knob. beta > 1 means recall matters more (beta=2: recall twice as important as precision). beta < 1 weights precision more.** Cancer screening uses beta=2 or higher because a missed positive is a missed cancer. Spam filtering might use beta=0.5 because a wrongly blocked legitimate email is a significant UX failure. Choosing beta is a conversation with stakeholders before training, not a grid search after.`,
      `**Macro-average treats every class equally — the rare class gets the same weight as the common one.** Micro-average is dominated by the majority class. Weighted average follows class frequency. The choice tells whether you care about per-class performance uniformly or care about aggregate production impact — don't report macro vs micro without explaining the tradeoff, because the two can give very different numbers on the same model.`,
      `**MCC (Matthews Correlation Coefficient) uses all four confusion matrix cells symmetrically.** Range -1 to 1; random gets 0. It does not reward models that just predict the majority class, because all four cells (TP, TN, FP, FN) must be simultaneously large for MCC to be high. This is why computational biology uses it as the standard — extreme class imbalance is the norm there and F1 can be gamed by class imbalance in ways MCC cannot.`,
      `**PR-AUC and ROC-AUC tell you very different things on imbalanced data.** ROC-AUC denominates FPR with TN — when you have millions of negatives, even 10,000 FPs look like a small FPR. PR-AUC ignores TN entirely, so it exposes poor precision directly. For rare-event problems, PR-AUC is the honest metric; ROC-AUC will flatter you into believing the model performs better than it does at the operating point that matters.`,
      `**The threshold is not part of the model — it is a business decision.** The model outputs a score; you pick where to draw the line based on cost(FP) vs cost(FN). This conversation has to happen before you pick a metric, not after you train the model. A model evaluated at the wrong threshold looks wrong even if the underlying ranking quality is excellent.`,
      `**When your offline metrics are suspiciously low on a well-designed model, look at label quality before blaming the algorithm.** Mislabelled positives become FNs; mislabelled negatives become FPs. Both drag precision and recall down. Label noise is asymmetric and its effect accumulates across metrics — a 5% mislabelling rate can tank F1 by more than a poorly tuned model.`,
    ],
    checkQuestions: [
      {
        q: `A cancer screening model has precision=0.95 and recall=0.40. Is this a good model?`,
        options: [
          `A) Yes — precision=0.95 means nearly all positive predictions are correct, which minimizes unnecessary follow-up tests`,
          `B) It depends — F1=0.57 is moderate and acceptable for screening if the patient population is low-risk`,
          `C) Yes — high precision is always more important than recall in medical settings to avoid false alarms`,
          `D) No — recall=0.40 means 60% of actual cancer cases are missed; for screening you need recall > 0.90 and should lower the threshold accepting more FPs`,
        ],
        answer: `D`
      },
      {
        q: `Two models: Model A has precision=0.80, recall=0.80 (F1=0.80). Model B has precision=0.99, recall=0.67 (F1=0.80). Same F1. How do you choose?`,
        options: [
          `A) Always choose Model B — higher precision means fewer false positives which is universally better`,
          `B) The choice depends on cost(FP) vs cost(FN): Model B is better when FPs are costly, Model A is safer when FNs are costly — identical F1 can correspond to very different operating points on the precision-recall curve`,
          `C) Always choose Model A — balanced precision and recall is always preferable to an extreme operating point`,
          `D) The models are equivalent — identical F1 means identical performance and either can be deployed`,
        ],
        answer: `B`
      },
      {
        q: `You compute macro-F1=0.91 and micro-F1=0.78 on a 5-class classifier. What does this tell you?`,
        options: [
          `A) The gap means small classes perform well (pulling macro up) while the majority class has significant errors (pulling micro down) — for production where majority-class errors are most frequent, micro-F1=0.78 is the number that matters`,
          `B) Macro-F1 is always higher than micro-F1 on imbalanced data, so the gap is expected and uninformative`,
          `C) The model is overfitting — high macro-F1 with low micro-F1 is a sign of variance, not bias`,
          `D) Micro-F1=0.78 means the model is poor and macro-F1=0.91 is misleading due to class weighting errors`,
        ],
        answer: `A`
      },
      {
        q: `A model predicts fraud with AUC=0.97 but the operations team says too many legitimate transactions are being blocked. What metric should you change and why?`,
        options: [
          `A) Switch from AUC to F1 — F1 balances precision and recall and will directly capture the blocking problem`,
          `B) Switch to accuracy — AUC ignores the absolute number of errors which is what the operations team cares about`,
          `C) Switch to monitoring precision at a fixed recall target — AUC measures ranking quality across all thresholds and says nothing about where you operate; the operations team is experiencing a precision problem at the deployed threshold`,
          `D) Keep AUC but raise the threshold until FPs drop — the metric is fine, only the operating point needs adjustment`,
        ],
        answer: `C`
      },
    ],
    takeaway: `Precision and recall measure fundamentally opposite failure modes — the only correct way to choose a classification metric is to first quantify the business cost of FP vs FN, because everything else follows from that ratio.`,
    interactiveId: 'confusion_matrix_viz',
  },
  {
    id: 'auc_roc',
    title: 'ROC Curve & AUC',
    subtitle: 'FPR/TPR, what area means, PR-AUC for imbalanced classes',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['ROC', 'AUC', 'PR-AUC', 'ranking'],
    summary: `Accuracy on imbalanced data is misleading — a model predicting all negatives on a 99:1 dataset gets 99% accuracy. AUC-ROC evaluates the classifier across all possible decision thresholds, not just the default 0.5. At each threshold you compute TPR (sensitivity) and FPR (1-specificity) and plot them — a random classifier scores 0.5, perfect scores 1.0. The clean probabilistic reading — P(model ranks a random positive above a random negative) — makes it an excellent offline ranking metric. But ROC-AUC denominates FPR with TN: with 10,000 negatives in the pool, even 500 FPs produce FPR of ~0.05, so the curve stays far upper-left and the model looks excellent while precision = 100/600 = 0.17 is quietly catastrophic. PR-AUC fixes this by ignoring TN entirely — it only cares about whether you are ranking positives correctly relative to your actual positive class, not relative to an enormous sea of negatives. Knowing when to use each is the litmus test for whether someone has actually shipped a model on real imbalanced data.`,
    keyPoints: [
      `**AUC has a clean probabilistic interpretation: P(score(positive) > score(negative)) for a randomly drawn pair.** AUC=0.85 means the model ranks a random positive above a random negative 85% of the time. It is a pure ranking quality metric, entirely threshold-independent — which means it tells you nothing about performance at the specific threshold you will deploy.`,
      `**A curve below the diagonal (AUC < 0.5) is not a bad model — it is a backwards-scored model.** Flip the decision and you get a model with AUC > 0.5. AUC < 0.5 always signals an implementation error in the scoring direction, not a fundamental capability problem.`,
      `**The FPR denominator is why ROC-AUC flatters you on imbalanced data.** With 10,000 negatives and 100 positives: 500 FPs give FPR = 500/10500 ≈ 0.05 — looks fine on the ROC curve. But precision = 100/600 = 0.17. PR-AUC would expose this instantly because it removes TN from the picture completely. This is not a subtle difference — it is the difference between a model that looks production-ready and one that is not.`,
      `**PR-AUC is the right metric whenever your TN count is large relative to your positive class.** Fraud detection, medical diagnosis, anomaly detection — in all of these, the business does not care about the TN sea. The failure mode of insisting on ROC-AUC here is shipping models that look great in eval and perform terribly in the alert queue.`,
      `**Average Precision (AP) is the area under the PR curve, weighted by recall change at each threshold.** Mean Average Precision (MAP) averages AP over queries — the standard in search and information retrieval. The weighting gives extra credit for achieving high precision while also achieving high recall, which is why it is a more informative single number than the area under an unweighted PR curve.`,
      `**When to use which: ROC-AUC for roughly balanced classes or when you genuinely care about ranking quality across the full negative set (credit scoring of all applicants).** PR-AUC for imbalanced problems where TN performance is irrelevant to the business. Picking ROC-AUC for an imbalanced problem is a standard mistake that leads to overconfident model selection and underperforming production systems.`,
      `**Calibration and discrimination are independent properties.** A model with AUC=0.95 but poor calibration ranks positives correctly but produces overconfident or underconfident probabilities. If you are using the probability output to set a threshold or compute a risk score, calibration matters as much as AUC — always check both, because a well-ranked but miscalibrated model gives you incorrect probability estimates at the operating threshold.`,
      `**Partial AUC lets you restrict evaluation to a specific FPR range (e.g., FPR < 0.1).** This makes sense when you will never operate at high FPR in production — evaluating the full curve includes operating points you will never use, which dilutes the signal about performance where it actually matters. Medical screening systems routinely use partial AUC at low FPR for this reason.`,
    ],
    checkQuestions: [
      {
        q: `Two models have the same AUC-ROC (0.85) on a 1% positive rate dataset. How would you further differentiate them?`,
        options: [
          `A) Run longer training with more epochs — same AUC means one model hasn't converged yet`,
          `B) Compare their decision boundaries visually — AUC is a rough metric and visual inspection is more reliable`,
          `C) Check F1 score at threshold=0.5 — this is the standard operating threshold that reveals differences`,
          `D) Compare PR-AUC, precision at specific recall targets, calibration via Brier score, and lift curves — same AUC-ROC can mask very different PR curves especially in the high-recall regime where one model may be much more precise`,
        ],
        answer: `D`
      },
      {
        q: `Your fraud model has AUC=0.96. The business team says the alert queue has too many false alarms. What happened and how do you fix it?`,
        options: [
          `A) AUC=0.96 measures ranking quality, not operational precision at the deployed threshold — raise the score threshold to reduce FPs, or recalibrate with Platt scaling if precision is poor even at high thresholds`,
          `B) AUC=0.96 is too high and indicates overfitting — retrain with more regularization to reduce false alarms`,
          `C) The model needs more training data — high AUC with high false alarms means insufficient examples of legitimate transactions`,
          `D) Switch to a different model architecture — AUC=0.96 means the current model type is not suited to fraud detection`,
        ],
        answer: `A`
      },
      {
        q: `AUC-ROC for a model is 0.72. A colleague argues that "since 0.72 > 0.5, the model is useful." Is that a sufficient argument?`,
        options: [
          `A) Yes — any AUC above 0.5 means the model ranks positives above negatives better than chance, which is sufficient for production use`,
          `B) No — AUC > 0.5 only means better-than-chance ranking; it says nothing about whether the degree of improvement is meaningful at the specific operating threshold needed, or whether performance is uniform across subgroups`,
          `C) Yes — 0.72 is above the industry standard threshold of 0.70, making the model production-ready`,
          `D) No — 0.72 is too low to be useful; only models with AUC > 0.85 should be considered for production`,
        ],
        answer: `B`
      },
      {
        q: `What is the relationship between AUC-ROC and the Mann-Whitney U statistic?`,
        options: [
          `A) They are inversely related — high AUC corresponds to a low Mann-Whitney U, making them complementary tests`,
          `B) Mann-Whitney U tests for statistical significance while AUC measures effect size — they are related but measure different things`,
          `C) AUC-ROC equals the normalized Mann-Whitney U statistic: both compute P(score(positive) > score(negative)) over all (positive, negative) pairs — so AUC can be computed by counting concordant pairs without drawing the ROC curve`,
          `D) They are unrelated — AUC is a geometric property of the ROC curve while Mann-Whitney U is a rank-based statistical test`,
        ],
        answer: `C`
      },
    ],
    takeaway: `AUC-ROC measures ranking quality across all thresholds and denominates FPR with TN, which means it systematically overstates model quality when negatives vastly outnumber positives — in those cases you must use PR-AUC and evaluate precision at your actual operating recall.`,
    interactiveId: 'roc_curve_viz',
  },
  {
    id: 'ranking_metrics',
    interactiveId: 'ndcg_viz',
    title: 'Ranking Metrics',
    subtitle: 'NDCG, MAP, MRR — search and recommendation quality',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['NDCG', 'MAP', 'MRR', 'ranking', 'RecSys'],
    summary: `In search and recommendation, the model does not predict a binary outcome — it ranks a list, and accuracy is meaningless here. But ranking metrics are not neutral choices: each one encodes a theory of user attention. MRR says users read until they find the first relevant result and stop. MAP says they care equally about finding every relevant result early. NDCG says attention decays logarithmically with rank — position 1 is twice as valuable as position 3, roughly — and rewards highly relevant items more than marginally relevant ones. If your actual users behave differently from what the metric assumes, your metric is wrong even if the math is right. The other thing that kills offline ranking metrics in production: click-based labels have position bias baked in. Results ranked first get clicked more because they are first, not because they are relevant. Measuring NDCG against those labels means you are partly measuring your existing ranker, not ground truth relevance.`,
    keyPoints: [
      `**MRR = (1/|Q|) sum 1/rank_first_relevant.** Only the rank of the first relevant result matters. This is the right metric for navigational queries and FAQ systems where one answer is what users need. The failure mode: two rankers with identical MRR can have completely different result quality at positions 2-10, and MRR will not notice. If your product shows users multiple results and they engage with several, MRR is the wrong metric.`,
      `**MAP's Average Precision for a single query sums P@k × rel(k) over all ranks where a relevant item appears, then divides by the total number of relevant items.** It rewards finding relevant items early AND finding all of them. The catch: MAP weights each query equally regardless of difficulty or number of relevant items. A query with 1 relevant item and a query with 100 relevant items look the same to MAP, which can skew aggregate scores toward easy queries.`,
      `**NDCG = DCG/IDCG where DCG = sum (2^rel(i) − 1)/log_2(i+1).** The 2^rel formula matters — it makes a highly relevant item (rel=3) worth 7 units while a marginally relevant one (rel=1) is worth 1 unit. The normalization by IDCG makes scores comparable across queries with different numbers of relevant items. This is why NDCG is the commercial search and recommendation standard — it handles graded relevance and accounts for position simultaneously.`,
      `**The log_2(i+1) discount is a model of attention decay, not an arbitrary formula: position 1 counts fully, position 2 at 63%, position 10 at 29%, position 100 at 15%.** If your users have different scan patterns — a horizontal carousel, infinite scroll, audio results — you need a different discount function that matches observed behavior. Using the default logarithmic discount for a product with non-standard interaction patterns is measuring the wrong thing.`,
      `**NDCG@K ignores everything after rank K.** For web search K=10 (one page). For recommendations K=5 or K=20. The truncation is both realistic and a risk: if two systems are identical in the top K but differ below it, NDCG@K will not help you choose. Make sure K matches the actual depth users engage with in your product, not a conventional default.`,
      `**Position bias is the silent killer of click-based ranking metrics.** Users click position 1 more than position 5 not just because position 1 is more relevant, but because it is at position 1. Raw click labels carry this bias. If you train and evaluate on click-based NDCG, you are partly optimizing to reproduce whatever your current ranker already ranks first. Inverse Propensity Scoring (IPS) — weighting clicks by 1/P(click at position k) — removes this but requires a click propensity model.`,
      `**MAP and MRR require binary relevance (relevant/not).** NDCG supports graded relevance (0-3 or 0-4), which is more expressive. If you have human raters using a 4-point scale, throwing that away to binarize for MAP loses information. Use NDCG when you have graded labels; use MAP/MRR for simpler binary-relevant retrieval tasks.`,
      `**Offline NDCG, MAP, and MRR are all computed on historical labels that do not capture user satisfaction directly.** A ranker can improve NDCG by 5% while decreasing long-session engagement. Online interleaving tests — where two rankers' results are merged and user clicks determine the winner — are 100x more sensitive than standard A/B tests and can detect ranking differences that offline metrics miss entirely.`,
    ],
    checkQuestions: [
      {
        q: `A search engine retrieves 3 relevant documents at ranks 1, 3, 5 out of 5 total relevant documents. Compute AP.`,
        options: [
          `A) AP = 0.60 — computed as (1/3)(1.0 + 2/3 + 3/5) averaging over the 3 retrieved relevant documents`,
          `B) AP = 0.453 — computed as (1/5)(P@1 + P@3 + P@5) = (1/5)(1.0 + 2/3 + 3/5); AP divides by total relevant documents (5) not retrieved ones`,
          `C) AP = 0.333 — computed as the mean of P@1, P@3, P@5 without dividing by total relevant documents`,
          `D) AP = 0.500 — since 3 of 5 relevant documents were retrieved, AP equals the recall of 0.60 averaged with precision`,
        ],
        answer: `D`
      },
      {
        q: `Your recommendation system shows NDCG@10 = 0.85 in offline evaluation. But users complain results feel irrelevant. What might explain this?`,
        options: [
          `A) NDCG@10 = 0.85 is too low — results only feel relevant when NDCG exceeds 0.95`,
          `B) NDCG@10 was computed on click-based relevance labels with position bias baked in, or the offline test set has temporal shift, or NDCG@10 averages over queries masking poor performance on tail queries, or relevance is captured per-item but not at the session level`,
          `C) The model is overfitting to the test set — NDCG@10 = 0.85 on a held-out set with user complaints indicates the test set is not representative`,
          `D) NDCG@10 only measures the top 10 results but users are scrolling further — the problem is below position 10`,
        ],
        answer: `B`
      },
      {
        q: `MRR is 0.60 for a search system. A manager wants to improve it to 0.75. What does this mean concretely and what would you change?`,
        options: [
          `A) Improving MRR from 0.60 to 0.75 requires a 25% relative improvement — focus on overall ranking quality improvements that lift all positions equally`,
          `B) MRR = 0.60 means average first-relevant-rank ≈ 1.67; MRR = 0.75 means average ≈ 1.33 — focus on query categories where first relevant result is at rank 3+, improve query understanding, and improve retrieval recall so the re-ranker has the right document available to rank first`,
          `C) MRR focuses on all result positions, so improving it requires re-ranking the entire result set for every query`,
          `D) MRR = 0.60 to 0.75 means improving the number of queries where any relevant result appears — focus on recall-oriented retrieval improvements`,
        ],
        answer: `C`
      },
      {
        q: `You have graded relevance labels (0-3) and want to compare two rankers. Should you use MAP or NDCG?`,
        options: [
          `A) Use NDCG — MAP requires binary relevance and cannot use graded scores; NDCG with 2^rel amplifies differences between highly relevant (rel=3, contribution 7) and somewhat relevant (rel=1, contribution 1) items, making it strictly more informative for graded labels`,
          `B) Use MAP — it is more interpretable than NDCG and can handle graded labels by treating each grade as a separate binary threshold`,
          `C) Use MRR — graded relevance labels are best handled by finding the first highly-relevant (rel=3) result, which MRR measures directly`,
          `D) Either is fine — MAP and NDCG are mathematically equivalent when applied to graded relevance labels`,
        ],
        answer: `A`
      },
    ],
    takeaway: `All ranking metrics embed a model of user attention — MRR says users stop after the first hit, MAP says they care equally about each relevant item, NDCG says attention decays logarithmically — so choosing the metric means choosing which user behavior model you believe, not just which formula is standard.`,
  },
  {
    id: 'offline_vs_online',
    title: 'Offline vs Online Evaluation',
    subtitle: 'Proxy metrics, A/B gap, how to close the offline-online divide',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['evaluation', 'A/B testing', 'online metrics', 'proxy metrics'],
    summary: `The most expensive ML mistake is shipping a model that beats its offline benchmark and makes the product worse. The offline-online gap is not a fluke — it is structural. Offline labels are proxies (clicks are not satisfaction), the test set is static (it does not reflect live traffic distribution), and once you deploy, the model changes what data gets collected (feedback loops). Every one of these biases pushes in the same direction: offline metrics are optimistic. Closing the gap requires two things: validating historically that your offline metric correlates with online outcomes (proxy metric calibration), and treating A/B tests as the final arbiter of value. Guardrail metrics — secondary online metrics you must not harm — protect against Goodharting.

A model that raises CTR by promoting sensationalist content while destroying session length is worse than no model, and guardrails are what catch it before you ship.`,
    keyPoints: [
      `**The offline-online gap has four root causes: distribution shift (production traffic differs from historical test data), feedback loops (the model influences what data future models train on), proxy label problem (clicks measure something correlated with satisfaction, not satisfaction), and the counterfactual problem (offline evaluation can only score items that the old policy actually served).**`,
      `**Counterfactual offline evaluation: you cannot just score a new policy on logged data from an old policy because you only have reward signals for items the old policy served.** Inverse Propensity Scoring (IPS) reweights observations by 1/propensity_score to correct for the old policy's selection bias. Used at Yahoo and Netflix. Requires knowing or estimating the logging policy's action probabilities.`,
      `**Guardrail metrics are online metrics you must not harm even if the primary metric improves — for example, improve CTR but do not let session duration fall below the control level.** Three to five guardrails that must all pass is standard practice at large platform companies. Without guardrails, models learn to Goodhart the primary metric at the expense of the overall system, and this failure mode is not visible until the damage is done.`,
      `**Interleaving is 10-100x more statistically sensitive than standard A/B testing for ranking experiments.** Each user sees results from both rankers merged into one list; clicks determine the winner. Individual user variance is eliminated because both systems are evaluated on the same user simultaneously. This is why you can run ranking experiments with hundreds of users instead of hundreds of thousands.`,
      `**Proxy metric calibration: track offline metric changes alongside realized online metric changes over historical model deployments.** Build a calibration map — offline NDCG +0.5% historically predicts online CTR +0.3%. This tells you the minimum offline improvement worth the cost of an A/B test. The calibration needs to be updated whenever the system architecture changes significantly, because the relationship between offline and online metrics is not stable across architectural changes.`,
      `**Novelty and primacy effects contaminate early A/B test results.** Users engage more with new features simply because they are new (novelty) or cling to familiar ones even when the new version is better (primacy). Both effects distort results in the first few days. Standard practice: run tests for at least two full weeks and check that the treatment effect estimate is stable over time before calling it.`,
      `**CTR and clicks are leading indicators — fast to measure, weakly correlated with long-term value.** Retention and LTV are lagging indicators — slow to observe, strongly correlated with what the business actually cares about. Optimise for leading indicators in the short term, but validate that they translate to lagging indicators on the time horizon that matters, because leading and lagging indicators decouple in exactly the cases that hurt most.`,
      `**A/B tests can only measure the models you actually test.** The selection of what to test is a human judgment that no experiment can optimise. Offline metrics exist to kill bad candidates cheaply so you run A/B tests on only the handful worth testing — not to prove models are good, and not to replace experiments.`,
    ],
    checkQuestions: [
      {
        q: `Your RecSys shows +3% NDCG@10 offline. You run an A/B test and see -1% on session length. What do you do?`,
        options: [
          `A) Ship the model — NDCG@10 is the primary metric and a -1% session length change is within normal variance`,
          `B) Run the A/B test for longer — 3 days is insufficient and the session length dip is likely a novelty effect`,
          `C) Investigate whether NDCG improved on click-based labels with position bias, or if the model optimised for initial clicks but not session engagement — do NOT ship if session length is a confirmed guardrail metric`,
          `D) Split the difference: ship a 50% rollout and monitor session length with automated rollback if it drops further`,
        ],
        answer: `D`
      },
      {
        q: `What is the difference between running an A/B test and running an interleaving experiment? When would you choose each?`,
        options: [
          `A) A/B tests route each user to one version and measure absolute business metrics; interleaving merges both rankers' results per user and measures relative preference — eliminating between-user variance to require 100x fewer users for the same statistical power; choose A/B for absolute business impact, interleaving for cheap ranking comparison`,
          `B) Interleaving is only valid for ranking systems while A/B tests work for any model type — choose based on whether you are testing a ranker or a classifier`,
          `C) A/B tests are more statistically powerful because they eliminate within-user variance; interleaving is used only when sample sizes are very small`,
          `D) They are equivalent in statistical power but A/B tests are easier to implement, so interleaving is only used at very large companies with dedicated experimentation infrastructure`,
        ],
        answer: `A`
      },
      {
        q: `Your team calibrated that +1% NDCG gain historically predicts +0.4% CTR online. You see a model with +5% NDCG. Should you trust the calibration and skip the A/B test?`,
        options: [
          `A) Yes — a +5% NDCG gain is so large that the expected CTR gain of +2% is well above any noise threshold and the A/B test is unnecessary`,
          `B) Yes — proxy metric calibration exists precisely to avoid expensive A/B tests for large, clearly significant offline gains`,
          `C) No — calibration is based on historical changes that may not represent this specific change; large offline gains often signal distribution mismatch or data leakage; use calibration to triage but never to skip the A/B test entirely`,
          `D) No — a +5% NDCG gain invalidates the calibration because it is outside the historical range the calibration was built on`,
        ],
        answer: `C`
      },
      {
        q: `A competitor product uses pure online bandit for model selection instead of A/B tests. What are the trade-offs?`,
        options: [
          `A) Bandits are strictly better — they minimize regret by routing traffic to better arms and can be used as a direct replacement for A/B tests in all scenarios`,
          `B) Bandits minimize regret and adapt quickly; but they cannot isolate clean causal estimates (allocation is endogenous), struggle with delayed feedback signals, and can produce biased estimates — A/B tests with fixed duration are preferable for rigorous causal evaluation of model quality`,
          `C) Bandits are only appropriate for ad creative selection; for ML model evaluation A/B tests are always required by regulatory standards`,
          `D) The trade-off is purely computational — bandits require more infrastructure investment but produce identical statistical results to A/B tests once converged`,
        ],
        answer: `B`
      },
    ],
    takeaway: `Offline metrics measure how well a model scores historical data collected under a different policy — so the offline-online gap is not random noise but systematic bias, and closing it requires either correcting for the logging policy (IPS) or running A/B tests as the true ground truth.`,
  },
  {
    id: 'validation_traps',
    title: 'Validation Set Traps & Data Leakage',
    subtitle: 'Leakage taxonomy: temporal, group, label leakage, how to audit',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['data leakage', 'validation', 'temporal split', 'label leakage'],
    summary: `Suspiciously high offline AUC — 0.97 on a hard problem — followed by catastrophic production performance is the signature pattern of data leakage. The pattern is always the same: the model appears to generalize beautifully during validation, ships, and then fails at the rate of a random classifier on live traffic. Leakage takes four main forms: temporal (future information in training features), group (same entity in both train and test), label (a feature derived from or collected after the outcome), and preprocessing (normalization fit on the full dataset before splitting). The diagnostic question is simple and must be applied to every feature: "Would this value exist at the exact moment of prediction in production?" If no, it is leakage. Suspicious AUC above 0.97, a single feature dominating importance, or training and validation error nearly identical — any of these should trigger a leakage audit before you do anything else.`,
    keyPoints: [
      `**Temporal leakage is the most common form in time-series ML.** A churn model trained with a random row-level split will contain future purchase data in training features for a user whose churn label was determined earlier — the model learns to use the answer from the future to predict the past. The fix is always the same: split by time, not by row, and verify that every feature is computed using only data available before the prediction timestamp.`,
      `**Group leakage: the same user, patient, or entity in both train and test.** The model memorizes entity-specific patterns — user browsing style, patient baseline — that do not generalize to new entities. The fix is group k-fold or a user-level holdout. Group leakage is especially nasty in user engagement models because individual user patterns are very strong predictors, so the model appears to generalize when it is just memorizing.`,
      `**Label leakage is different from temporal leakage: the feature may have the right timestamp but the wrong causal direction — it is a consequence of the label, not a predictor. "Number of days in ICU" to predict "was the patient hospitalised?" is the textbook case.** The audit question is not "when was this feature computed?" but "is this feature causally upstream of the outcome, or downstream?"`,
      `**Preprocessing leakage: fitting a StandardScaler or mean imputer on the full dataset (including test) before splitting.** The test set's statistics leak into the training pipeline. Fix: fit all transformers on training only. Use sklearn Pipeline to enforce this automatically. Target encoding is particularly severe — computing target mean per category on the full dataset directly leaks the label into the feature for every test sample.`,
      `**Four detection signals: (1) Validation AUC above 0.97 on a problem where experts disagree — almost always leakage. (2) One feature has dramatically higher importance than all others — check if that feature can be known at prediction time. (3) High Pearson correlation between a feature and the label (above 0.7) — suspect label leakage. (4) Train and validation accuracy nearly identical with no generalization gap — the test set has likely been contaminated.**`,
      `**Point-in-time correct feature stores: in production, features should be computed at the exact prediction timestamp and logged.** Training datasets are reconstructed by joining each historical event with the feature values that existed at that timestamp. Systems that join on latest feature values instead of historical values produce temporal leakage at scale — this is the operational case for feature stores with time-travel capability (Feast, Tecton, Hopsworks).`,
      `**The leakage audit procedure: for each feature, document (1) how it is computed, (2) what data sources it uses, (3) when it would be available in production scoring.** Cross-reference against label creation time. Any feature where computation time is after label time is a leakage candidate. Automate this check in your feature engineering pipeline — manual audits miss things and cannot scale as features grow.`,
      `**NLP leakage: if you build a vocabulary or fit a TF-IDF vectorizer on the full dataset before splitting, the test set's token distribution leaks into the tokenizer.** Similarly, splitting documents from the same author or article series means the model exploits stylistic patterns rather than learning general language understanding.`,
    ],
    checkQuestions: [
      {
        q: `You build a churn prediction model with AUC=0.97. In production, AUC drops to 0.64. What went wrong and how do you debug?`,
        options: [
          `A) The model overfit — AUC=0.97 on validation with 0.64 in production means training data was insufficient; collect more data and retrain`,
          `B) Production data has shifted — the drop indicates concept drift and the model needs continuous retraining`,
          `C) The model is correct — 0.97 offline and 0.64 online is a normal offline-online gap for churn models; no action needed`,
          `D) This is a strong signal of data leakage — check if the train/test split was random on time-series data, audit top-5 features for post-churn values (e.g., "account closed=1"), check preprocessing fit on full dataset, and check for group leakage; the 0.97 was an illusion and 0.64 is the true performance`,
        ],
        answer: `D`
      },
      {
        q: `A colleague uses a random 80/20 split on a dataset of 500,000 website visits by 50,000 unique users. What is the problem and how do you fix it?`,
        options: [
          `A) The 80/20 split ratio is too aggressive — use 70/30 to give the test set more samples for reliable evaluation`,
          `B) Random row-level split puts the same user in both train and test — the model memorizes user-level patterns that do not generalize to new users; fix by splitting at the user level so all visits from a user go to exactly one split`,
          `C) 500,000 rows is too large for random splitting — use stratified sampling to ensure class balance`,
          `D) The problem is insufficient feature engineering — the split method does not matter as long as features are well-constructed`,
        ],
        answer: `C`
      },
      {
        q: `What is target encoding leakage and how does k-fold target encoding fix it?`,
        options: [
          `A) Target encoding leakage occurs when category names are semantically related to the label; k-fold fixes it by using anonymized category IDs instead of names`,
          `B) Target encoding leakage occurs when computing category means on the full dataset incorporates test samples' own labels into their features; k-fold target encoding fixes this by computing each fold's encoding using only out-of-fold data so no sample's label contributes to its own encoding`,
          `C) Target encoding leakage is the same as group leakage — k-fold fixes it by ensuring each category appears in only one fold`,
          `D) Target encoding leakage happens when rare categories have noisy mean estimates; k-fold fixes it by averaging estimates across multiple folds for stability`,
        ],
        answer: `A`
      },
      {
        q: `You join a company and are handed a model achieving AUC=0.94 on historical data. How do you quickly audit for leakage before trusting this number?`,
        options: [
          `A) Re-train the model from scratch on a clean dataset — inherited models always have unknown leakage that cannot be audited without retraining`,
          `B) Check the train/test split method (random rows on time-series data is wrong), inspect top feature importances for any single dominating feature that may not be available at prediction time, and compare train vs test AUC for absence of generalization gap`,
          `C) Run a shadow deployment and compare production AUC — the only reliable leakage audit is live traffic comparison`,
          `D) Check if AUC=0.94 is above published benchmarks for similar problems — if so, leakage is confirmed`,
        ],
        answer: `B`
      },
    ],
    takeaway: `Data leakage is a data engineering error, not a modeling error — the fix is almost always upstream in the feature computation pipeline, and the single question that catches most leakage is "would this feature value exist at the exact moment of prediction in production?"`,
  },
  {
    id: 'cross_validation',
    interactiveId: 'cross_validation_viz',
    title: 'Cross-Validation Strategies',
    subtitle: 'k-fold, stratified, group k-fold, time-series CV, nested CV',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['cross-validation', 'k-fold', 'time series', 'nested CV'],
    summary: `A single train/val split has high variance — you might get lucky or unlucky with a particular partition. K-fold CV reduces this by running k different partitions and averaging the results. But k-fold is only valid when your observations are iid, and the moment you have temporal structure, entity groups, or hierarchical clusters, naive k-fold produces an overoptimistic estimate because information leaks across folds. The core mental model: every CV strategy embeds an assumption about how the model will be deployed. Group k-fold embeds "the model will be applied to entities it has never seen." Time-series walk-forward embeds "future data is unavailable at training time." Pick the wrong strategy and you are evaluating a fantasy deployment scenario, not your real one. Nested CV is the thing most people skip — if you are tuning hyperparameters and reporting metrics on the same validation set, selection bias is inflating your numbers by an amount that grows with the number of configurations you tried.`,
    keyPoints: [
      `**Standard k-fold: k=5 or k=10 is standard. k=5 uses 80% of data per fold (lower variance estimate, less training data per fold). k=10 uses 90% (lower bias, higher variance of the estimate, slower).** LOO (k=n) is unbiased but has high estimate variance and is very slow. Never use standard k-fold on time-series data — you will be training on future observations to predict the past, which is the definition of temporal leakage.`,
      `**Stratified k-fold preserves class proportions across folds.** With 5% positive class and 5 folds, each fold has approximately 5% positives. Without stratification, a fold might have zero positives by chance — giving a meaningless evaluation. sklearn's StratifiedKFold is the default for classification; use it unless you have a specific reason not to.`,
      `**Group k-fold: all samples from the same entity — user, patient, document — go to the same fold.** In production, the model scores entities it has never seen during training. Without this, group-level patterns cause massive apparent generalization that disappears in production. The test: in production, will this model be applied to groups it saw during training? If no, use group k-fold.`,
      `**Time-series walk-forward CV: train on [0, t1], validate on [t1, t2].** Then train on [0, t2], validate on [t2, t3]. Expanding window is standard — keep all historical data. Rolling window — fixed-size training — makes sense when old data is less relevant due to concept drift. The failure mode is any k-fold that lets a model train on month 3-12 to predict month 1 — predicting the past from the future.`,
      `**Purged and embargoed CV for autocorrelated features: rolling averages and lag features computed on the tail of the training period can bleed into the head of the validation period.** Purging removes training samples too close to the validation start; embargoing removes validation samples too close to the training end. Critical in financial ML where feature windows can span months and ordinary walk-forward CV will appear to work but is leaking.`,
      `**Nested CV is the fix for selection bias in hyperparameter tuning.** Outer loop evaluates model quality; inner loop selects hyperparameters. Without nesting: if you tune on the validation set and report metrics on the same set, you have implicitly optimised for that specific held-out partition. The result is upward-biased — the degree of inflation grows with the number of hyperparameter configurations you tried. Nested CV is slower but gives a conservative unbiased estimate of the entire model-selection pipeline.`,
      `**Large dataset CV: with millions of samples, k-fold is slow and the variance from a single temporal split is already low.** A single 90/10 temporal split is often sufficient. Save k-fold for limited data (below ~10,000 samples) or cases where partition variance would be high. Time-series data always needs temporal splitting regardless of size — the temporal requirement is about correctness, not variance reduction.`,
      `**Repeated CV: run the full k-fold r times with different random splits, giving k×r evaluations.** Reduces variance of the estimate. Standard in medical ML with small samples where a single 5-fold result would have high uncertainty. Report mean ± std across repeats, not just the mean, because the standard deviation is information about how stable the model's performance is.`,
    ],
    checkQuestions: [
      {
        q: `You have 5 years of daily transaction data and want to build a fraud model. How do you set up CV?`,
        options: [
          `A) Use standard 5-fold CV with stratification on the fraud label — stratification ensures each fold has balanced fraud cases and prevents misleading evaluation`,
          `B) Use a single 80/20 random split — with 5 years of data the sample size is large enough that variance is low and k-fold adds unnecessary computation`,
          `C) Use group k-fold by user_id — the main concern is that the same user appears in both train and test, which group k-fold prevents`,
          `D) Use time-series walk-forward CV: train on year 1 validate on Q1 of year 2, then expand forward — add a 7-day purge gap for rolling features, use expanding window unless strong concept drift is present; never use standard k-fold which would train on 2024 data to predict 2022 events`,
        ],
        answer: `D`
      },
      {
        q: `You run 5-fold CV and get AUC scores [0.83, 0.84, 0.92, 0.85, 0.83]. The mean is 0.854. Should you report this as your model's performance?`,
        options: [
          `A) No — report mean ± std = 0.854 ± 0.035 and investigate why fold 3 is an outlier (AUC=0.92 vs others at 0.83-0.85); high variance itself is information about instability`,
          `B) Yes — the mean is the correct summary statistic and a sample size of 5 folds is sufficient to report reliably`,
          `C) No — discard the outlier fold (AUC=0.92) and report the mean of the remaining four folds as it is more representative`,
          `D) Yes — 0.854 is a conservative estimate because some folds may have been unlucky; the true performance is closer to 0.92`,
        ],
        answer: `B`
      },
      {
        q: `A colleague argues that since you are doing hyperparameter search with Optuna and reporting the best trial's validation score, you have a proper unbiased evaluation. Explain why this is wrong.`,
        options: [
          `A) Optuna's best trial is unbiased because Bayesian optimization does not overfit to the validation set — only grid search causes selection bias`,
          `B) This is the nested CV problem — running 200 Optuna trials and reporting the best trial's validation AUC is upward-biased by selection; unbiased evaluation requires either nested CV (hyperparameter search in inner fold only) or a completely separate test set never touched during optimization`,
          `C) The evaluation is correct if the validation set is large enough — selection bias from Optuna only matters with small datasets below 10,000 samples`,
          `D) Optuna handles this automatically through its pruning mechanism — trials that overfit to the validation set are pruned before they can inflate the reported score`,
        ],
        answer: `A`
      },
    ],
    takeaway: `Every CV strategy embeds an assumption about how the model will be deployed — temporal splitting embeds "future data is unavailable," group splitting embeds "new entities appear in production" — and using the wrong strategy produces an evaluation that tests a different deployment scenario than the real one.`,
    interactiveId: 'cross_validation_viz',
  },
  {
    id: 'error_analysis',
    title: 'Error Analysis',
    subtitle: 'Confusion matrix drill-down, error slicing, systematic failures',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['error analysis', 'failure modes', 'slicing', 'debugging'],
    summary: `A model with F1=0.85 might be failing catastrophically on the subgroup that matters most — but aggregate metrics hide this completely. Error analysis is how you find out what is actually broken and what to do about it. Without it, decisions about whether to collect more data, engineer new features, or change architecture are guesswork.

The key output of good error analysis is a prioritized intervention list: "fix X and you recover Y% of errors." Manual inspection of 50-100 errors — actually categorizing them — is more informative than running 10 more experiments on the full dataset. The most important finding that changes what you do: systematic errors (all from one segment, one feature range, one pattern) require targeted intervention and respond to targeted data collection. Random errors that correlate with nothing are irreducible and more data at the global level will not help.`,
    keyPoints: [
      `**Start with the confusion matrix: which class pairs are being confused? "Cat" confused with "small dog" is a fundamentally different failure from "cat" confused with "car." In multi-class problems, the off-diagonal cells tell you the error structure; the aggregate metric tells you nothing about it.** The confusion matrix is the entry point — the aggregate metric only tells you that a problem exists.`,
      `**Error slicing is the most actionable step: compute error rate per value of each feature — by time of day, user country, product category, input length.** A model with average F1=0.85 may have F1=0.40 for users in one country. Those segments point directly to where data or features need to improve. Broad questions like "why is the model wrong?" are much harder to act on than "error rate in this segment is 3x the average."`,
      `**Overconfident wrong predictions are the most dangerous in production.** Plot error rate vs predicted probability. An overconfident model has high error rate at predicted probability 0.9 — those are systematic misclassifications the model is certain about. Consider using uncertainty estimates (MC dropout, ensemble variance) to flag high-uncertainty predictions for human review rather than acting on them directly.`,
      `**Manual inspection protocol: sample 50-100 FPs and FNs separately.** Assign each to one of: (a) labelling error — true label is wrong; (b) insufficient features — model lacks info a human would have; (c) rare pattern — not enough training examples; (d) genuine ambiguity — humans disagree. The distribution across buckets is directly actionable: bucket (a) means relabel, bucket (b) means feature engineering, bucket (c) means data collection, bucket (d) means accept as irreducible error floor.`,
      `**Systematic vs random errors is the most important output of error analysis.** If errors cluster by feature value, subgroup, or pattern, you need targeted intervention — more data from that subgroup, a separate model for it, or a specific feature. If errors look uniformly random across all slices, more data helps only marginally and you are likely near the irreducible error floor for the current feature set.`,
      `**Error correlation is the basis for ensemble design.** Two models with similar accuracy that fail on the same examples ensemble into neither model — you get no improvement. Two models that fail on different examples cancel each other's errors — you get real improvement. Error analysis informs whether ensembling is worth it: you want maximum error complementarity, not error overlap.`,
      `**Production error monitoring means applying error analysis continuously, not just once.** Log each prediction, confidence, and features. Feed true labels back when available through delayed feedback. Slice error rate by feature buckets in real time. Alert when any slice exceeds a threshold — "error rate in country X exceeded 30% over the last hour" is a much better signal than a global accuracy metric degrading slowly over weeks.`,
      `**The error decomposition hierarchy: (1) Overall metric — is there a problem? (2) Slice by output class — which classes are failing? (3) Slice by input features — which segments? (4) Inspect individual errors — what kind? (5) Form hypotheses and test.** Skipping from "F1=0.75" to "we need a transformer" skips the diagnosis that might reveal the problem is a labelling error in one category that takes an afternoon to fix.`,
    ],
    checkQuestions: [
      {
        q: `Your NLP classifier has 88% overall accuracy but stakeholders are unhappy. How do you diagnose what is wrong?`,
        options: [
          `A) Retrain with a larger model — 88% accuracy on NLP tasks indicates the model is underfitting and needs more capacity`,
          `B) Collect more labelled data — accuracy below 95% on NLP tasks is always a data insufficiency problem`,
          `C) Compute per-class precision and recall, slice accuracy by text length/domain/source/date, sample 100 errors and categorize them, check the confusion matrix for concentrated error pairs, and check confidence distribution on errors to distinguish systematic from irreducible failures`,
          `D) Report F1 instead of accuracy — stakeholder dissatisfaction with 88% accuracy always stems from the wrong metric being reported`,
        ],
        answer: `C`
      },
      {
        q: `You sample 100 FPs from a fraud detection model and find that 60% involve transactions from a new merchant category launched 2 months ago. What do you do?`,
        options: [
          `A) Remove the merchant category feature — if a new category causes 60% of FPs, the feature is introducing noise and should be dropped`,
          `B) Flag this as random variance — 60% of FPs from one category is within normal statistical fluctuation for fraud models`,
          `C) Retrain with higher regularization — FP clustering by merchant category indicates the model is overfitting to merchant-specific patterns`,
          `D) This is systematic failure from distribution shift — collect labelled examples from this new category, add a "merchant category is new" uncertainty feature, consider a temporary rule for this category, check other new categories for elevated FP rates, and add it as a monitored production slice`,
        ],
        answer: `D`
      },
      {
        q: `You have two models both with F1=0.82. How do you choose which to deploy using error analysis?`,
        options: [
          `A) Choose the simpler model — identical F1 means equivalent performance and simpler models are always preferable`,
          `B) Compare confusion matrices to see which class each model fails on, compare error slices for the most critical business segment, compare error confidence and calibration, and compare error correlation to assess ensembling potential — identical F1 with different error structures means the models are solving the problem differently`,
          `C) Run both in shadow mode and choose whichever has higher precision on the first day of live traffic`,
          `D) Flip a coin — identical F1 means the models are statistically indistinguishable and any choice is equally valid`,
        ],
        answer: `B`
      },
      {
        q: `What is the difference between error slicing and subgroup fairness analysis? When does one become the other?`,
        options: [
          `A) They are the same analysis — error slicing always constitutes fairness analysis whenever slices are defined by user characteristics`,
          `B) Error slicing is only valid on numerical features while fairness analysis applies to categorical protected attributes — the distinction is purely technical`,
          `C) Error slicing uses statistical tests while fairness analysis uses business rules — error slicing becomes fairness analysis when the statistical test reveals significant disparities`,
          `D) Error slicing is a debugging technique asking "where is the model wrong so I can fix it?"; fairness analysis is a normative assessment asking "is the model wrong more for certain protected groups in a way that causes harm?" — they become the same when your error slices are by protected attributes and significantly different error rates raise legal and ethical implications beyond just "collect more data"`,
        ],
        answer: `D`
      },
    ],
    takeaway: `Aggregate metrics tell you whether you have a problem — error slicing tells you which specific subpopulation has the problem — and in practice a model with good average metrics often has catastrophic failures concentrated in a small slice that the average hides completely.`,
  },
  {
    id: 'calibration',
    title: 'Calibration & Brier Score',
    subtitle: 'Reliability diagrams, Platt scaling, isotonic regression, Brier decomposition',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['calibration', 'Brier score', 'Platt scaling', 'reliability diagram'],
    summary: `AUC tells you whether a model ranks correctly.

But the moment a probability output drives an actual decision — a doctor reading a 90% mortality risk, a pricing engine setting rates, a fraud alert setting thresholds — you need the probability to be honest, not just the ranking to be right. These are completely independent properties.

A model can have AUC=1.0 (perfect ranking) while being systematically 30 percentage points overconfident. Modern neural networks are almost always overconfident out of the box because they are trained with log loss, which rewards confident predictions even on noisy labels. The standard fix is temperature scaling: one parameter, tuned on a held-out calibration set, that compresses the output probabilities without changing the ranking. It is the first thing you should try before reaching for anything more complex — it is free to implement and almost always helps.`,
    keyPoints: [
      `**A calibrated model satisfies P(Y=1 | predicted_prob=p) = p for all p.** It is a marginal property — you do not need to be right on any individual prediction, only that p% of predictions at probability p are correct. Good calibration does not imply good discrimination. A model that always predicts the base rate is perfectly calibrated but completely useless for any decision.`,
      `**Reliability diagrams are the standard visual check: bin predictions into 10 buckets.** For each bucket, plot mean predicted probability (x-axis) vs fraction of actual positives (y-axis). Perfectly calibrated models lie on the diagonal. Points below the diagonal mean the model is overconfident (predicts higher than actual). Neural networks almost always show points below the diagonal — systematic overconfidence that gets worse at high probability values.`,
      `**ECE (Expected Calibration Error) = sum_b (n_b/n) |acc_b - conf_b| — the weighted average absolute deviation from perfect calibration.** Low ECE is necessary but not sufficient. A model can have low ECE if all buckets cluster near the mean even with significant miscalibration in specific probability ranges. Always look at the reliability diagram, not just the scalar ECE.`,
      `**Brier score = (1/n) sum (predicted_i - y_i)^2 — mean squared error of probability predictions.** It decomposes into resolution (discrimination), reliability (calibration error), and uncertainty (irreducible from base rate). A model with good AUC but poor calibration shows high reliability component in the Brier decomposition. Use Brier skill score = 1 - BS/BS_ref for a relative measure against a baseline.`,
      `**Platt scaling: train a logistic regression on top of model scores on held-out data.** Two parameters (slope and intercept) rescale the raw output. Works well for sigmoid-shaped miscalibration, which is common in SVMs and boosting. Do not calibrate on training data — you need a separate calibration set, because fitting on training data will overfit the calibration to the training distribution.`,
      `**Isotonic regression for calibration fits a non-decreasing step function mapping raw scores to calibrated probabilities.** More flexible than Platt — can correct non-monotonic miscalibration. Needs more calibration data; risks overfitting on small sets. Rule of thumb: Platt for small calibration sets, isotonic for large ones.`,
      `**Temperature scaling for neural networks: divide logits by T before softmax.** T > 1 softens probabilities (reduces overconfidence). T < 1 sharpens them. Find optimal T by minimizing NLL on a validation set. Temperature scaling does not change predictions (argmax is preserved) — only the probabilities. This is the standard first-pass recalibration for any neural network, and its simplicity is why it is the right first thing to try.`,
      `**Calibration matters most when: the probability itself is the model output used in decisions (medical risk, fraud scoring, pricing), downstream models take the probability as an input feature, or decision thresholds have different costs.** It matters less when you only care about ranking — for top-k recommendation, AUC is sufficient and calibration is irrelevant to the output quality.`,
    ],
    checkQuestions: [
      {
        q: `A model has AUC = 0.91 and ECE = 0.15. What does this mean and what do you do?`,
        options: [
          `A) AUC=0.91 means excellent discrimination; ECE=0.15 means probabilities are off by 15 percentage points on average — for any use case where probability drives a decision, apply Platt scaling or isotonic regression on a held-out calibration set; the high AUC tells you the ranking is strong and recalibration preserves it`,
          `B) The model is well-calibrated — ECE=0.15 is below the standard threshold of 0.20 and no action is needed`,
          `C) AUC=0.91 and ECE=0.15 cannot coexist — high AUC always implies low ECE because good discrimination requires good calibration`,
          `D) ECE=0.15 means the model is underconfident; apply temperature scaling with T < 1 to sharpen the probabilities`,
        ],
        answer: `A`
      },
      {
        q: `Your reliability diagram shows the model is overconfident at high probabilities (0.8-1.0 bucket shows actual positive rate of 0.55). What could cause this and how do you fix it?`,
        options: [
          `A) The model has insufficient training data at high-probability predictions; the fix is to oversample examples where the model assigns high confidence`,
          `B) Overconfidence in the 0.8-1.0 bucket is expected for all classifiers — probabilities above 0.8 are always miscalibrated without explicit isotonic regression`,
          `C) The reliability diagram is measuring the wrong thing — overconfidence at high probabilities is a sign that the binarization threshold of 0.5 should be raised`,
          `D) Log loss training rewards confident predictions even on noisy labels, and neural networks are systematically overconfident without calibration; fix with temperature scaling (T > 1) to compress high probabilities, or label smoothing during training`,
        ],
        answer: `D`
      },
      {
        q: `Two models: Brier score for Model A = 0.08, for Model B = 0.12 on the same dataset. Model B has higher AUC. How do you interpret this?`,
        options: [
          `A) Model B is strictly better — AUC is the primary evaluation metric and Brier score differences are secondary`,
          `B) Model A is strictly better — lower Brier score always dominates higher AUC because Brier score measures both calibration and discrimination jointly`,
          `C) Model A has better overall probability quality (lower Brier score) despite lower AUC — it is significantly better calibrated, which matters for decisions based on the probability output; decompose both Brier scores into resolution and reliability to see if recalibrating Model B would close the gap`,
          `D) The models are equivalent — AUC and Brier score measure the same underlying property from different angles`,
        ],
        answer: `A`
      },
    ],
    takeaway: `AUC measures whether a model ranks correctly and calibration measures whether its probability estimates are honest — these are independent, so for any application where the probability output drives a real-world decision, calibration must be evaluated and fixed separately from discrimination.`,
    interactiveId: 'calibration_curve_viz',
  },
  {
    id: 'ablation',
    title: 'Ablation Studies & Baselines',
    subtitle: 'Designing ablations, good baselines, isolating contributions',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['ablation', 'baselines', 'experiment design'],
    summary: `Complex ML pipelines accumulate dead weight — components added because they seemed plausible, never removed because nobody measured their contribution. Ablation studies answer the question every honest engineer should be asking: how much of this actually matters? Without ablations, you do not know whether your model works because of its sophisticated architecture or despite it. The counterpart is baseline selection: the baseline sets the bar a complex model has to clear to justify its complexity. Picking a weak baseline inflates your apparent gain. The most common malpractice in ML research is comparing against an undertuned or outdated competitor — if a well-tuned gradient boosted tree matches your deep model's performance, the deep model is not earning its inference cost, and you should know that before you deploy it.`,
    keyPoints: [
      `**Ablation design: start from the full system, remove exactly one component per experiment.** The performance gap between full and ablated system is that component's contribution. Remove two components simultaneously and you cannot attribute what caused the change — this is scientific control applied to ML systems. One variable at a time is not pedantry, it is the only way to learn something actionable.`,
      `**The most common ablation error: changing architecture and hyperparameters at the same time.** Remove a layer and also retune learning rate — you cannot interpret the result. Run all ablations with the same hyperparameters. Ablated models may be suboptimal for their specific configuration; that is fine. You are measuring the component's value to the full system, not optimizing each variant independently.`,
      `**Baselines hierarchy: random → majority class → simple rule-based → linear model → single tree → gradient boosting → your model.** In research, also include the best published result on the same benchmark and a reimplemented strong baseline. If your method only beats a weak baseline, the contribution may not exist against a properly tuned competitor. A result that beats a 2019 baseline but not a 2022 one is not a contribution.`,
      `**Feature ablation is different from permutation importance.** Permutation importance estimates marginal contribution assuming other features are present. Feature ablation captures contribution including all interaction effects with the removed features. Use ablation to decide which feature groups to invest in and which to sunset — it gives the full picture, not just the marginal one.`,
      `**Learning curves (data ablation): train with 10%, 25%, 50%, 75%, 100% of data and plot performance vs dataset size.** Curve still steep at 100%? More data will help — data collection is the bottleneck. Curve flattened? Model capacity or features are the bottleneck. This is the most informative single analysis for deciding where to invest next, and it takes less time than the architecture search most people do instead.`,
      `**Negative ablation results are scientifically valuable.** If removing a component does not hurt performance (or improves it), that component is dead weight. Remove it. Simpler models train faster, serve faster, cost less to maintain, and often generalize better. The willingness to publish or act on negative ablations distinguishes rigorous ML practice from cargo-culting.`,
      `**Seed variance: run each ablation with 3-5 different random seeds and report mean ± std.** A result that does not survive seed variance is not real. A claimed +2% improvement with std=3% is noise. In deep learning, single-run ablations are unreliable — especially on small datasets where random initialization can dominate the effect you are trying to measure.`,
    ],
    checkQuestions: [
      {
        q: `Your paper claims that adding a cross-attention layer improves NDCG by 2%. A reviewer asks for an ablation. What do you run?`,
        options: [
          `A) Full model with cross-attention vs full model without cross-attention — two conditions are sufficient to demonstrate contribution`,
          `B) Full model with cross-attention vs full model without cross-attention vs self-attention of equal parameter count vs feedforward layer of equal parameters — all with same hyperparameters, same splits, mean ± std over 3 seeds; if condition 1 beats 3 and 4 significantly, cross-attention specifically contributes; otherwise the gain is capacity not architecture`,
          `C) Full model vs stripped-down model with cross-attention removed and learning rate retuned — retuning is essential to measure each variant at its optimal configuration`,
          `D) Run the ablation with and without the cross-attention layer across 10 different datasets — single-dataset ablations are not generalizable enough for publication`,
        ],
        answer: `C`
      },
      {
        q: `You run a feature ablation and find removing "user age" drops F1 from 0.85 to 0.78 (a large drop). But age is a protected attribute. How do you reason about this?`,
        options: [
          `A) Remove the age feature — any protected attribute that is predictive must be excluded regardless of its contribution`,
          `B) Keep the age feature — F1 drop of 0.07 is a significant accuracy cost and business need overrides fairness concerns`,
          `C) Ask three separate questions: is using age legally permitted; is age the true causal driver or a proxy for non-protected features like credit history; and what are the fairness implications — explore whether adding those correlated non-protected features reduces age's marginal contribution; if the contribution persists after controlling for proxies, you face a genuine fairness-accuracy trade-off requiring policy input`,
          `D) The feature ablation result is not relevant to fairness analysis — those are separate considerations that should never be combined`,
        ],
        answer: `B`
      },
      {
        q: `You remove component X from your system and AUC goes up from 0.82 to 0.84. What do you conclude and what do you do next?`,
        options: [
          `A) Component X is essential and the ablation result is invalid — AUC improving after removal means the ablation introduced a bug that should be fixed`,
          `B) Component X was definitely contributing noise — immediately remove it from production without further investigation`,
          `C) Component X is redundant or harmful in terms of AUC — but verify the improvement is consistent across 5 seeds, check if X was designed for a non-AUC objective (e.g., diversity), and confirm no other metrics are harmed; if consistent, remove X and report it as a negative ablation`,
          `D) Run more ablations removing other components simultaneously with X to confirm the interaction effect causing the AUC improvement`,
        ],
        answer: `D`
      },
    ],
    takeaway: `Ablation studies are the only way to know what is actually contributing to your model's performance versus what is cargo-culted complexity — skipping ablations is how teams end up maintaining components that have been hurting performance for months.`,
  },
  {
    id: 'evaluation_in_prod',
    title: 'Evaluation in Production',
    subtitle: 'Shadow mode, champion-challenger, guardrail metrics, significance at scale',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['production evaluation', 'shadow mode', 'A/B testing', 'champion-challenger'],
    summary: `Every ship/no-ship decision should ultimately be backed by a controlled experiment — that is the guiding principle for production evaluation. Shadow mode is the right first step for any high-stakes deployment: run the new model on live traffic, log its predictions, but serve only the champion's results. You are validating infrastructure and catching distribution surprises before anyone sees the model's outputs. Champion-challenger A/B tests are the actual measurement. At the scale of millions of users, statistical significance is trivially achieved on tiny effects — a 0.01% CTR lift will be p < 0.0001 with one day of data. That is a scale problem, not a reason to ship. Practical significance (effect size, business value) is what matters. The ramp strategy (1% → 10% → 50% → 100%) is your circuit breaker: catch catastrophic failures before they affect everyone, and automated ramp-back triggers are what keep a bad deploy from becoming a production incident.`,
    keyPoints: [
      `**Shadow mode: the new model receives the same production requests as the champion and generates predictions, but only the champion's predictions are served.** Use it to (1) validate serving infrastructure under real load, (2) detect unexpected failures or output distributions, (3) compare prediction distributions between models — large disagreements on the same inputs warrant investigation before any A/B test. Shadow mode catches infrastructure bugs that offline testing always misses.`,
      `**Champion-challenger A/B test: traffic split is typically 90/10 or 95/5.** Require Bonferroni correction if testing multiple metrics simultaneously — 10 metrics at p < 0.05 each gives ~40% probability of at least one false positive without correction. Set the primary metric, secondary metrics, and guardrails before the test starts, not after looking at the results — post-hoc metric selection is p-hacking.`,
      `**Statistical significance vs practical significance at scale: with 10M daily users, a 0.01% CTR lift is statistically significant with one day of data.** That is 1,000 extra clicks. Ask whether deploying and maintaining a new model is worth 1,000 extra clicks per day. "Is this effect real?" and "Is this effect worth acting on?" are different questions with different answers, and at large scale the first question is almost always yes.`,
      `**Sample Ratio Mismatch (SRM): if you intend a 50/50 split but observe 55/45 in the data, the randomization has failed.** SRM invalidates the A/B test — some systematic factor affected assignment. Always run a chi-squared test on observed vs expected traffic split as the first check before interpreting any metric results. An A/B test with SRM is not a weaker A/B test — it is not an A/B test at all.`,
      `**Sequential testing with mSPRT allows valid inference at any stopping point.** Standard A/B tests assume fixed sample size determined upfront. Peeking at results during the test and stopping early when p < 0.05 inflates Type I error dramatically — this is one of the most common sources of false positive results in production experiments. Sequential testing frameworks (used at Spotify, Microsoft, Booking.com) let you stop early when results are clearly positive or negative without corrupting the Type I error rate.`,
      `**Ramp strategy: start at 1% of traffic, then 5%, 10%, 50%, 100%.** At each step, run guardrail checks. A catastrophic failure at 1% affects 1% of users. Automated ramp-back triggers — if error rate exceeds threshold in any 15-minute window, reduce to 0% — are standard at high-traffic systems. The ramp is your insurance policy, and the automated rollback is what makes it work at 3am when nobody is watching.`,
      `**Novelty and primacy effects require at least two full business cycles to resolve.** Novelty: users engage more with new things simply because they are new. Primacy: users initially prefer familiar features even when the new one is better. Both distort early results. Plan for at least 14 days minimum, 28 for products with strong weekly patterns. Check whether the treatment effect estimate is stable over time before calling it.`,
      `**Holdout groups: maintain 1-5% of users permanently on the old system.** This lets you measure cumulative impact of a series of improvements against a never-updated baseline. Short A/B tests only measure marginal gains. A holdout measures total accumulated value over months. Netflix and LinkedIn use long-term holdouts because a series of small A/B wins can have near-zero or negative cumulative impact when combined.`,
    ],
    checkQuestions: [
      {
        q: `Your A/B test on a recommendation system shows +2% CTR (p=0.001) after 3 days. Should you ship?`,
        options: [
          `A) Yes — p=0.001 means the result is highly significant and the test has converged; ship immediately`,
          `B) Not yet — check guardrail metrics (session length, revenue per session), run for at least 14 days to eliminate novelty effects, verify SRM, confirm practical significance (+2% CTR translates to X revenue), and check that lift is uniform across segments before shipping`,
          `C) Ship to 10% of users — a 3-day test is sufficient for a partial rollout and monitoring will catch any issues`,
          `D) No — p=0.001 after only 3 days indicates the test was contaminated by novelty effect and the result will revert; wait 30 days`,
        ],
        answer: `B`
      },
      {
        q: `A/B test results show +1% revenue lift (p=0.0001) after 30 days. A colleague says "p < 0.05 means we should ship." What is missing from this reasoning?`,
        options: [
          `A) p < 0.05 is the correct standard — at 30 days with p=0.0001 there are no additional checks needed before shipping`,
          `B) p < 0.0001 confirms the effect is real but does not confirm it is large enough to matter — missing: practical significance (is +1% revenue worth the deployment cost), guardrail metric checks, confidence interval, multiple testing correction, and whether the +1% is uniform across segments or driven by a small subgroup`,
          `C) The confidence interval is missing — p-value alone does not specify the direction of the effect`,
          `D) The test should have run for 60 days — 30 days is insufficient to eliminate primacy effects regardless of p-value`,
        ],
        answer: `A`
      },
      {
        q: `You are running 5 simultaneous A/B tests on your platform. A product manager notices that tests 2 and 4 seem to interact. How do you handle this?`,
        options: [
          `A) Stop all 5 tests and restart with mutual exclusion — any simultaneous tests that could touch the same user must be restarted`,
          `B) Ignore the interaction — A/B test randomization ensures independence between simultaneous tests`,
          `C) Diagnose interaction by comparing users in both tests vs users in only one test; if interaction is genuine those cells are contaminated; going forward enforce mutual exclusion for tests affecting similar product areas, use factorial design only when statistical independence is confirmed, and document which tests ran simultaneously`,
          `D) Run a meta-analysis combining results from all 5 tests — simultaneous test interactions are best resolved by statistical aggregation`,
        ],
        answer: `C`
      },
      {
        q: `What is a holdout group and why is it more valuable than a series of A/B tests for measuring long-term model value?`,
        options: [
          `A) A holdout group is a control group within an A/B test — it is equivalent to the control arm and provides the same information`,
          `B) A holdout group is used for hyperparameter tuning — it is more valuable than A/B tests because it prevents overfitting to the test set`,
          `C) A holdout group measures the same incremental gains as A/B tests but with lower variance — it is more valuable because the statistical power is higher`,
          `D) A holdout group is a permanently withheld user fraction that receives no model updates — it measures cumulative causal impact of all ML improvements over months vs A/B tests that only measure marginal gains; this catches cases where 12 individual +1% A/B wins sum to much less than +12% due to cannibalisation or seasonal confounding`,
        ],
        answer: `D`
      },
    ],
    takeaway: `Production evaluation is the only source of ground truth for model impact — the entire offline evaluation pipeline exists only to filter candidates cheaply enough that you run A/B tests on the handful worth testing, and every ship/no-ship decision should ultimately be backed by a controlled experiment.`,
  },
]
