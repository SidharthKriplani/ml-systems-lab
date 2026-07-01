export const EVAL_MODULES = [
  {
    id: 'metrics_first_principles',
    title: 'Eval Metrics from First Principles',
    subtitle: 'Confusion matrix, precision, recall, F1, why accuracy fails',
    difficulty: 'foundational',
    estimatedMin: 32,
    tags: ['metrics', 'precision', 'recall', 'F1', 'confusion matrix'],
    summary: `Imagine you build a fraud detection model. Your dataset has 10,000 transactions. 100 are fraudulent — that is 1%. You train a model and it scores 99% accuracy. Everyone on the team is excited. Then you look closer: the model predicted "not fraud" for every single transaction. It caught zero frauds. The accuracy number was lying to you the entire time.

This is the core problem with accuracy on imbalanced data. It collapses all four outcomes — correctly caught fraud, wrongly flagged legitimate transactions, missed fraud, correctly cleared transactions — into one number that is dominated by the majority class. To work with imbalanced data, you need to disaggregate those four outcomes.

Start with the confusion matrix. Label each cell: TP means correctly flagged fraud. FP means falsely flagging a legitimate transaction — a false alarm, a customer who gets their card blocked for no reason. FN means missing a fraud — the transaction goes through, the bank eats the loss. TN means correctly clearing a legitimate transaction. None of these cells cost the same. That asymmetry is the point.

From these four cells, two ratios emerge that measure different failure modes. Precision = TP/(TP+FP): when you raise a fraud alert, how often is it real? If precision is low, you are flooding the operations team with false alarms and annoying customers. Recall = TP/(TP+FN): of all the actual frauds, what fraction did you catch? If recall is low, fraud is slipping through and the bank is taking losses.

Notice these two ratios pull in opposite directions. Make your model more conservative — raise the decision threshold — and precision goes up (fewer false alarms) but recall drops (more missed fraud). Lower the threshold and recall goes up but precision falls. This tension is not a flaw in the metrics. It is a real business tension, and the right resolution depends on your cost matrix.

**NOT this.** Most people hear "imbalanced dataset" and immediately reach for F1. F1 is the harmonic mean of precision and recall: $F1 = 2 \\cdot P \\cdot R / (P + R)$. The harmonic mean is used specifically because it penalizes extreme imbalances — F1(P=0.9, R=0.1) = 0.18, not 0.5. But F1 weights precision and recall equally. If missed fraud (FN) costs 10x more than a false alarm (FP), you should be weighting recall more. F_beta with $β > 1$ does this: $F_β = (1 + β^2) \\cdot P \\cdot R / (β^2 \\cdot P + R)$. The right metric requires knowing the cost matrix for your specific problem.

In fraud detection, FN — missed fraud — is typically far more expensive than FP — a false alarm. So you optimize for recall. In spam filtering, the calculus flips: a legitimate email landing in spam (FP) destroys user trust, so you optimize for precision. In medical screening, missed cancer (FN) is catastrophic, so recall dominates. Before picking a metric, translate TP, FP, FN, TN into business costs. Everything else follows from that.`,
    keyPoints: [
      `**When to use it: always define your cost matrix before picking a metric.**\n\nIn fraud detection: a missed fraud (FN) costs the full transaction amount plus investigation time. A false alarm (FP) costs a customer service call and customer inconvenience. If FN costs 10x more than FP, optimize for recall ($F_\\beta$ with $\\beta = 2$ or higher). In spam filtering, FP (blocking a real email) is the catastrophic failure — optimize for precision ($\\beta < 1$). Accuracy is appropriate only when classes are roughly balanced and all errors cost the same, which is rarely true in production.`,
      `**The most common production trap: reporting F1 without asking whether FP and FN cost the same.**\n\nF1 weights precision and recall equally. On a fraud model where missing fraud costs 50x more than a false alarm, optimizing F1 will under-weight recall and leave real money on the table. Before training, write down: what does a FP cost? What does a FN cost? If those numbers differ by more than 2x, F1 is the wrong metric. Use $F_\\beta$ with $\\beta$ set to the square root of the FN-to-FP cost ratio.`,
      `**The diagnostic: when your model looks suspiciously good, check whether it is predicting the majority class.**\n\nThe tell: high accuracy, recall near 0. Compute recall separately. If recall ≈ 0 on a 1% fraud dataset, the model learned to predict "not fraud" for everything and achieved 99% accuracy by doing nothing. Also check: if F1 is decent but all FPs come from the same subgroup, you have a slice-level failure the aggregate metric is hiding. Disaggregate by segment before declaring the model ready.`,
    ],
    interactivePrompt: `Before you touch the controls: if a model predicts "not fraud" for every single transaction in a 1%-fraud dataset, what is its accuracy, and what is its recall?`,
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
    takeaway: `Before picking any classification metric, write down the cost of a FP and the cost of a FN — every metric choice follows from that ratio, and skipping that step is how teams end up optimizing the wrong number for months.`,
    interactiveId: 'confusion_matrix_viz',
  },
  {
    id: 'auc_roc',
    interactiveId: 'roc_curve_viz',
    title: 'ROC Curve & AUC',
    subtitle: 'FPR/TPR, what area means, PR-AUC for imbalanced classes',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['ROC', 'AUC', 'PR-AUC', 'ranking'],
    summary: `Here is the problem: a single threshold tells you nothing about a model. Take that same fraud detection model. At threshold 0.5: precision 80%, recall 60%. Lower the threshold to 0.3: precision drops to 65%, recall rises to 80%. Raise it to 0.7: precision 90%, recall 40%. The model\`s quality is not a single number — it depends entirely on where you draw the line. So how do you compare two models without first committing to an operating threshold?

The ROC curve is the answer to this problem. For every possible threshold from 0 to 1, compute two things: TPR (true positive rate, also called recall — the fraction of actual frauds you catch) and FPR (false positive rate — the fraction of legitimate transactions you wrongly flag). Plot TPR on the y-axis and FPR on the x-axis. As you lower the threshold, you catch more frauds (TPR rises) but also flag more legitimate transactions (FPR rises). The curve traces that tradeoff across all possible thresholds.

A model that randomly guesses produces a diagonal line — TPR equals FPR at every threshold, so AUC = 0.5. A perfect model hugs the upper-left corner — TPR = 1 at FPR = 0, so AUC = 1.0. For fraud detection, AUC = 0.85 is reasonable. Now you have a clean probabilistic reading: AUC is the probability that the model scores a randomly drawn positive higher than a randomly drawn negative.

[FIGURE: roc_curve]

This sounds ideal. But here is where it goes wrong on imbalanced data. FPR is calculated as FP / (FP + TN). In fraud detection, TN is enormous — you have 9,900 legitimate transactions for every 100 fraudulent ones. Even if you make 500 false alarms, FPR = 500 / 10,400 ≈ 0.05. That looks fine on the ROC curve. The curve sits comfortably in the upper-left. AUC = 0.91. Everyone is happy. But your precision is 100 / (100 + 500) = 0.17. Your fraud team is drowning in false alarms. Six out of seven alerts are wrong.

**NOT this.** "AUC above 0.7 is good." AUC is problem-dependent. More dangerously: on imbalanced datasets, ROC-AUC is structurally optimistic because the denominator of FPR is swollen with true negatives. The PR curve removes TN entirely — it plots precision against recall directly. When your positive class is rare, the PR curve is the honest one. If you have 1% fraud and vastly more legitimate transactions, use PR-AUC, not ROC-AUC. The difference is not cosmetic — it is the difference between a model that looks production-ready and one that will flood your operations team from day one.

One more thing: AUC is a threshold-independent summary, which means it tells you nothing about performance at the specific threshold you will actually deploy. After you pick a model using AUC or PR-AUC, you still need to set a concrete threshold based on your cost matrix. AUC is for model selection. The threshold is a business decision.`,
    keyPoints: [
      `**When to use ROC-AUC vs PR-AUC: it depends on whether true negatives are informative.**\n\nUse ROC-AUC when classes are roughly balanced, or when TN performance genuinely matters to the business (e.g., credit scoring where you care about accurately approving applicants, not just catching defaulters). Use PR-AUC when negatives vastly outnumber positives — fraud detection, disease screening, anomaly detection. In those cases, the TN sea inflates FPR\`s denominator and makes ROC-AUC structurally optimistic. The threshold: if your positive class is under 10% of the dataset, PR-AUC is the safer default.`,
      `**The most common production trap: shipping a model with high AUC on an imbalanced dataset and discovering the alert queue is overwhelmed.**\n\nAUC = 0.91 on a 1% fraud dataset can coexist with precision = 0.17 at the operating threshold. The ROC curve looked great because TN flooded the FPR denominator. Fix: always check precision at your intended operating recall before declaring a model ready. If you need 80% recall and precision at that point is 15%, the model is not production-ready regardless of AUC.`,
      `**The diagnostic: AUC is for model selection, not deployment — always set a specific operating threshold.**\n\nAfter comparing models by AUC or PR-AUC, pick your deployment threshold by plotting the precision-recall tradeoff and finding the point that satisfies your cost matrix. A concrete check: at recall = 0.80, what is the alert volume? If your fraud team can handle 200 alerts per day and the model would generate 2,000, the threshold needs to move regardless of what AUC says. AUC told you which model to choose. The cost matrix tells you where to operate it.`,
    ],
    interactivePrompt: `Before you touch the controls: if a fraud model has AUC = 0.91 but generates 500 false alarms for every 100 real frauds it catches, is the model production-ready — and what does AUC not tell you about this?`,
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
    takeaway: `ROC-AUC denominates FPR with true negatives, so on imbalanced datasets it is structurally optimistic — switch to PR-AUC when your positive class is rare, and always set a concrete operating threshold from your cost matrix before shipping.`,
    interactiveId: 'roc_curve_viz',
    figures: {
      roc_curve: `<svg viewBox="0 0 320 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:320px;font-family:var(--font-sans,sans-serif)">
  <!-- axes -->
  <line x1="50" y1="240" x2="290" y2="240" stroke="var(--ink-low)" stroke-width="1.5"/>
  <line x1="50" y1="240" x2="50" y2="20" stroke="var(--ink-low)" stroke-width="1.5"/>
  <!-- axis labels -->
  <text x="170" y="265" text-anchor="middle" fill="var(--ink-low)" font-size="11">FPR</text>
  <text x="14" y="135" text-anchor="middle" fill="var(--ink-low)" font-size="11" transform="rotate(-90,14,135)">TPR</text>
  <!-- tick marks -->
  <text x="50" y="252" text-anchor="middle" fill="var(--ink-low)" font-size="9">0</text>
  <text x="170" y="252" text-anchor="middle" fill="var(--ink-low)" font-size="9">0.5</text>
  <text x="290" y="252" text-anchor="middle" fill="var(--ink-low)" font-size="9">1</text>
  <text x="40" y="244" text-anchor="end" fill="var(--ink-low)" font-size="9">0</text>
  <text x="40" y="134" text-anchor="end" fill="var(--ink-low)" font-size="9">0.5</text>
  <text x="40" y="24" text-anchor="end" fill="var(--ink-low)" font-size="9">1</text>
  <!-- random classifier diagonal -->
  <line x1="50" y1="240" x2="290" y2="20" stroke="var(--ink-low)" stroke-width="1.5" stroke-dasharray="6,4"/>
  <text x="175" y="148" fill="var(--ink-low)" font-size="9" transform="rotate(-40,175,148)">Random</text>
  <!-- shade under good model -->
  <path d="M50,240 Q80,180 110,130 Q140,90 170,65 Q200,45 230,32 Q260,24 290,22 L290,240 Z" fill="var(--prime)" opacity="0.08"/>
  <!-- good model curve -->
  <path d="M50,240 Q80,180 110,130 Q140,90 170,65 Q200,45 230,32 Q260,24 290,22" fill="none" stroke="var(--prime)" stroke-width="2.5"/>
  <text x="120" y="105" fill="var(--prime)" font-size="9" font-weight="700">Good model</text>
  <text x="120" y="116" fill="var(--prime)" font-size="9">AUC ≈ 0.87</text>
  <!-- perfect classifier -->
  <path d="M50,240 L50,22 L290,22" fill="none" stroke="var(--amber)" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="55" y="35" fill="var(--amber)" font-size="9" font-weight="700">Perfect</text>
  <text x="55" y="46" fill="var(--amber)" font-size="9">AUC = 1.0</text>
</svg>`,
    },
  },
  {
    id: 'ranking_metrics',
    interactiveId: 'ndcg_viz',
    title: 'Ranking Metrics',
    subtitle: 'NDCG, MAP, MRR — search and recommendation quality',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['NDCG', 'MAP', 'MRR', 'ranking', 'RecSys'],
    summary: `A user types "Python tutorial for beginners." The search system returns 10 results. Ground truth says results at positions 1, 3, and 7 are relevant. A metric that treats all positions equally scores this as 3/10 = 0.30 regardless of whether the relevant results were first or last. That misses everything about how people actually use search. No one reads past result 3 if result 1 already answered their question. Metrics that ignore position tell you almost nothing about user experience.

Position-weighted metrics fix this by discounting results further down the list. MRR is the simplest: it cares only about the position of the first relevant result. For the query above, the first relevant result is at position 1, so MRR = 1/1 = 1.0. MRR is appropriate when a user has a single information need and will stop reading once they find one answer — navigational queries, FAQ systems, entity lookups. It ignores everything after position 1, so it is the wrong metric when users engage with multiple results.

MAP (Mean Average Precision) rewards finding relevant results both early and comprehensively. For a single query, Average Precision = (1/R) × Σ_k [P@k × rel(k)], where R is the total number of relevant results and rel(k) = 1 if result at position k is relevant. For the example query: AP = (1/3) × [1/1 + 2/3 + 3/7] = (1/3) × [1.0 + 0.667 + 0.429] = 0.699. MAP then averages AP across all queries. MAP requires only binary relevance labels — relevant or not — making it cheap to collect and easy to compute.

NDCG (Normalized Discounted Cumulative Gain) adds graded relevance. DCG = Σᵢ (2^relᵢ − 1) / log₂(i+1). The 2^rel term amplifies the difference between a highly relevant result (rel = 3, contribution = 7) and a marginally relevant one (rel = 1, contribution = 1). The log₂(i+1) denominator discounts lower positions — position 1 counts fully, position 3 at 50%, position 10 at 29%. Normalize by the ideal DCG (the perfect ranking) to get NDCG ∈ [0, 1], comparable across queries with different numbers of relevant results. NDCG is the industry standard for commercial search and recommendation because it handles the full richness of graded relevance judgments collected by professional raters.

**NOT this.** NDCG is the right metric for all ranking tasks. NDCG requires graded relevance labels on a 0–3 or 0–4 scale — expensive to collect at scale. MRR requires only binary relevance and is strictly better when the user wants any single relevant result. Precision@K is better when each of the K shown results is equally important regardless of position — product feeds, ad slots, horizontally-displayed carousels. Choose the metric based on what users actually do, not on what has the most impressive mathematical formulation. If your users scan a vertical list and stop at the first hit, MRR. If they expect to find all relevant results and care that none are buried, MAP. If you have graded labels and care about position, NDCG.

The formal statement: NDCG@K = DCG@K / IDCG@K where DCG@K = Σᵢ₌₁ᴷ (2^relᵢ − 1) / log₂(i+1) and IDCG@K is the DCG of the ideal ranking truncated at K. The log₂(i+1) denominator is a model of attention decay — not an empirically measured function, but a reasonable approximation that performs well enough in practice across most search interfaces.`,
    keyPoints: [
      `**Use NDCG when result position matters and you have graded relevance labels — it is the industry standard for search. Use MRR for QA systems where the first correct answer is all that matters.**\n\nFor the "Python tutorial" query: if you have human raters who scored each result on a 0–3 scale (0 = not relevant, 3 = perfectly relevant), compute NDCG@10. If you are building a question-answering system where the user asks "what is the capital of France" and will stop reading at the first correct answer, compute MRR. If you are building a product feed where all 10 shown items are equally prominent regardless of order, compute Precision@10. The wrong metric choice means you optimize for a proxy that does not correspond to the real user experience — NDCG@10 improvements can coexist with MRR degradation if the model is improving positions 4–10 while making position 1 worse.`,
      `**Trap: evaluating against an incomplete relevance set. If judgments cover only 20% of possible relevant documents, your NDCG is systematically underestimated for new results that were not in the judgment pool.**\n\nFor a retrieval system with a 10 million document corpus: human raters can only assess a small pool of documents. If the pool was built from the previous system's top results, and the new system retrieves novel relevant documents not in the pool, those documents receive rel = 0 by default — they were never judged. The new system looks worse in NDCG even though it found better results. This is the pooling bias problem from TREC-style evaluation. Fix: when a system change is large (new retrieval component, new ranking model), explicitly judge the new system's novel results before comparing NDCG.`,
      `**Diagnostic: plot NDCG@1 vs NDCG@10 separately. If NDCG@1 is much lower than NDCG@10, the system is finding relevant results but not surfacing them first — reranking is the bottleneck, not retrieval.**\n\nFor the "Python tutorial" system: NDCG@10 = 0.71 but NDCG@1 = 0.28 means the relevant results exist in the top 10 but position 1 is often occupied by a less relevant result. The retrieval stage (finding candidates) is working; the reranking stage (ordering candidates) is broken. Fix: improve the reranker's ability to identify the single best result rather than adding more retrieval candidates. Conversely, if NDCG@10 is low and NDCG@1 roughly equals NDCG@10, retrieval is the bottleneck — the relevant documents are not even in the candidate set.`,
    ],
    interactivePrompt: `Before you touch the controls: if the only relevant result in a 10-result list moves from position 5 to position 1, which metric improves more — MRR or NDCG@10 — and why?`,
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
    takeaway: `All ranking metrics embed a model of user attention — MRR says users stop after the first hit, MAP says they care about every relevant item equally, NDCG says attention decays logarithmically and highly relevant results matter more — so choosing the metric is choosing which user behavior you believe, not which formula is standard.`,
  },
  {
    id: 'offline_vs_online',
    title: 'Offline vs Online Evaluation',
    subtitle: 'Proxy metrics, A/B gap, how to close the offline-online divide',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['evaluation', 'A/B testing', 'online metrics', 'proxy metrics'],
    summary: `A recommendation team retrains their model. Offline holdout NDCG: 0.82, up from 0.79. They ship it via A/B test. CTR drops 3%. The offline metric went up. The online metric went down. What happened?

The holdout set was built from interaction logs collected six months earlier. The model was optimized to predict which items from a six-month-old catalog users would have clicked in a six-month-old interface. Deployed in production, it recommends slightly stale content, ignores trending items, and optimizes for engagement patterns that have since shifted. The test set represented a past distribution, not the current one. The offline metric was measuring the wrong thing.

Offline metrics measure how well a model predicts past behavior. Online metrics measure real-time user response. The gap between them is determined by three structural problems. First, distribution shift: the historical test set does not represent live traffic — user preferences, item catalog, and session context all change. Second, proxy labels: clicks are not satisfaction. A user clicking a sensationalist headline did not benefit from the recommendation. Offline NDCG measured their historical click probability, not the value of the experience. Third, feedback loops: once deployed, the model shapes what data gets collected. Users who see recommendation A interact with it; those interactions become future training data. The model changed the distribution of future data by being deployed.

The correlation between offline metric improvement and online metric improvement is not 1.0. For recommendation and search systems, it is typically 0.3–0.7. A 5% offline NDCG improvement might predict a 2% CTR lift, which might predict a 1% revenue lift — the signal degrades at each step. The right response is to measure this correlation empirically on your own system. Run ten A/B tests. For each, record the offline NDCG delta and the realized CTR delta. Plot them. If the Spearman correlation is below 0.5, your offline metric is a poor proxy and redesigning the evaluation matters more than more model tuning.

**NOT this.** If offline metrics improve, the model improved. Offline metrics measure how well the model fits the evaluation artifact — the specific holdout set with its specific labels. Models can overfit to the evaluation artifact, improving offline NDCG while degrading user experience. A model that memorizes which items appeared in the historical judgment pool will score well offline and fail on items outside the pool. Treat a strong offline result as a hypothesis to test in production, not a conclusion about model quality.

The formal statement: offline evaluation measures E[metric(π_new) | data ~ π_old], the expected metric of the new policy π_new evaluated on data generated by the old policy π_old. Online evaluation measures E[metric(π_new) | data ~ π_new]. These are the same only if the two distributions are identical — which is precisely what distribution shift, feedback loops, and proxy labels violate.`,
    keyPoints: [
      `**Shadow-deploy before A/B test — run the new model in parallel, log its predictions, evaluate on fresh offline data with matching timestamps. This catches distribution shift before it costs traffic.**\n\nFor the recommendation model: in shadow mode, the new model receives the same production requests as the live model and generates predictions, but only the live model's predictions are served. Log the new model's recommendations and the live outcomes. Evaluate the new model's offline NDCG on data from the past 2 weeks — not data from 6 months ago. If shadow-mode NDCG is lower than training-set NDCG, the model has distribution shift. Investigate before running any A/B test. Shadow mode also validates serving infrastructure under real load before any user is exposed to the new model.`,
      `**Trap: using past user interactions as ground truth for future predictions without temporal splitting. Users who clicked item X in January might have completely different preferences in April. Time-stamp your train/test split.**\n\nFor the recommendation model: train on months 1–9, evaluate on month 10. Evaluate on month 10 data only, using only items and users present in month 10. The alternative — a random 80/20 split across all months — lets the model train on August data to predict March clicks. August preferences contaminate the March predictions. Temporal splitting is non-negotiable for any system where item relevance changes over time, which is most recommendation and search systems.`,
      `**Diagnostic: measure the Spearman rank correlation between offline metric deltas and online metric deltas across your last 10 model launches. If the correlation is < 0.5, your offline metric is a poor proxy — redesign the offline evaluation before investing in further model development.**\n\nFor the recommendation team: collect the log of all model launches from the past year. For each launch, record the offline NDCG delta (new vs previous model) and the realized A/B CTR delta. Compute Spearman ρ. If ρ < 0.5, offline NDCG is not reliably predictive of CTR. Consider redesigning the offline evaluation: use more recent evaluation data, add temporal evaluation windows, add session-level signals beyond clicks, or use debiased click labels via Inverse Propensity Scoring.`,
    ],
    interactivePrompt: `Before you touch the controls: if a recommendation model was trained and evaluated on data from January, and deployed in July when item catalog and user preferences have shifted, do you expect offline NDCG to overestimate or underestimate the true production performance?`,
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
    takeaway: `Offline metrics measure how well a model predicts past behavior under a past policy — so the offline-online gap is systematic, not random, and the right response is to measure the offline-online correlation empirically on your own system before trusting any offline improvement as evidence that the model improved.`,
  },
  {
    id: 'validation_traps',
    title: 'Validation Set Traps & Data Leakage',
    subtitle: 'Leakage taxonomy: temporal, group, label leakage, how to audit',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['data leakage', 'validation', 'temporal split', 'label leakage'],
    summary: `You are building a model to predict next-week stock returns. You compute a feature called "average return over the next 7 days" for each row. You train your model, run validation, and get 95% accuracy. You have never seen numbers this good. You ship it. At deployment, accuracy is 2%. What happened?

The feature used future information. "Average return over the next 7 days" is computed from the exact data you are trying to predict. The model did not learn anything — it memorized the answer. During validation, the answer was right there in the features. In production, that information does not exist yet. The model is useless.

This is data leakage: information from the future, or from the outcome itself, contaminating the training features. Leakage comes in three main forms, and each requires a different fix.

Temporal leakage is the most common. You have time-series data. You do a random row-level train/test split. Now some training rows contain data from after the test rows\` prediction timestamps. The model can peek at the future. Fix: strict temporal cutoff. Every feature for a row must be computed using only data available before that row\`s prediction timestamp.

Group leakage happens when the same user, patient, hospital, or store appears in both train and test. Your fraud model is trained on transactions from users A, B, C and tested on different transactions from the same users A, B, C. The model memorizes per-user spending patterns — patterns that will not exist for new users at deployment. Fix: split at the group level, not the row level. All rows from a given user go to exactly one split.

Label leakage is subtler. The feature has the right timestamp but the wrong causal direction. It is a consequence of the outcome, not a predictor. A classic case: predicting whether a patient was hospitalized, with "number of days in ICU" as a feature. That feature only exists because the patient was hospitalized. The audit question is not "when was this computed?" but "is this feature causally upstream of the outcome, or downstream?"

**NOT this.** "I used train/test split so I am safe from leakage." A proper train/test split prevents you from evaluating on data you trained on. It does not prevent feature leakage. If your feature was computed using future data before you did the split, both train and test are contaminated. The test set looks clean but it is not. The single question that catches most leakage: would this exact feature value exist at the moment of prediction in production, with no knowledge of future events? If the answer is no, it is leakage.

Four signals that should trigger an immediate leakage audit: validation AUC above 0.97 on a hard problem where human experts disagree. One feature with dramatically higher importance than all others. Train and validation accuracy nearly identical with no generalization gap. A model that seemed mediocre suddenly looking excellent after you added one new feature group.`,
    keyPoints: [
      `**When to audit for leakage: any time validation performance looks too good to be true.**\n\nSpecific triggers: AUC above 0.95 on a problem where domain experts achieve 70-80%. A single feature with 10x higher importance than all others — check whether that feature can be known at prediction time. Train accuracy and validation accuracy within 1-2% of each other with no regularization — the test set is likely contaminated. New feature group added and AUC jumps 10+ points — check the feature\`s causal relationship to the label.`,
      `**The most common production trap: target encoding computed on the full dataset before splitting.**\n\nTarget encoding replaces a categorical value with the mean outcome for that category. If you compute those means using the full dataset (including test rows), you have leaked the label directly into each test row\`s feature — the feature for a given row now contains information from that row\`s own label. Fix: use sklearn Pipeline with cross_val_score, or use k-fold target encoding (compute means on out-of-fold rows only). This is the preprocessing version of leakage and it is easy to miss because the code looks innocuous.`,
      `**The diagnostic: for every feature, ask "would this value exist at the exact moment of prediction in production?"**\n\nFor each feature in your model, write down: (1) what data sources it uses, (2) the timestamp at which those sources become available, (3) whether that timestamp is before or after the prediction timestamp. Any feature where the data source\`s availability timestamp is after the prediction timestamp is leakage. This audit can be done in a spreadsheet. For inherited models: check the top-5 features by importance, look up their computation logic, and confirm each one passes the timestamp check.`,
    ],
    interactivePrompt: `Before you touch the controls: if a model achieves 95% validation accuracy on a stock return prediction task and the training features include "return over the next 7 days" — what exactly is the model learning, and what will happen at deployment?`,
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
    takeaway: `Data leakage is a data engineering error, not a modeling error — the fix is upstream in feature computation, and the single question that catches most leakage is whether each feature value would exist at the exact moment of prediction in production with no knowledge of future events.`,
  },
  {
    id: 'cross_validation',
    interactiveId: 'cross_validation_viz',
    title: 'Cross-Validation Strategies',
    subtitle: 'k-fold, stratified, group k-fold, time-series CV, nested CV',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['cross-validation', 'k-fold', 'time series', 'nested CV'],
    summary: `You are training a random forest on 5,000 examples. You tune max_depth using a single 80/20 train/test split. The test set happened to contain mostly "easy" examples — the ones the model finds straightforward regardless of how it is configured. Your reported accuracy is 87%. You tune max_depth to 12, the number that scores best on this particular split, and call it done. Then you deploy. Performance is 79%. What went wrong?

A single split is a single sample of the possible ways to divide your data. You got lucky — or unlucky. The evaluation had high variance, and you built your whole tuning decision on it.

K-fold CV runs k different splits and averages the results. With k=5 and 5,000 examples: split into 5 groups of 1,000. Train on 4,000, evaluate on 1,000. Rotate — use a different group as the held-out set each time. Average the 5 scores. You now have a much more stable estimate of generalization performance, because each example appears in the held-out set exactly once. Standard practice: k=5 or k=10. k=5 uses 80% of data per fold. k=10 uses 90% but is slower. Leave-one-out (k=n) is theoretically appealing but expensive and has high variance.

[FIGURE: cv_folds]

But here is the part most people skip: standard k-fold is only valid when your observations are independent and identically distributed. The moment you have temporal structure, entity groups, or autocorrelated features, naive k-fold produces an overoptimistic estimate because information leaks across folds in ways that will not exist at deployment.

On time-series data, standard k-fold is wrong — not a rough approximation, actually wrong. It lets the model train on month 10 data to predict month 3 events. That is the definition of cheating. The correct approach is walk-forward validation: train on $[t_0, t_1]$, validate on $[t_1, t_2]$. Then expand: train on $[t_0, t_2]$, validate on $[t_2, t_3]$. Each validation window sees only data from the future relative to its training window. The temporal order is preserved.

**NOT this.** "Cross-validation gives the true test error." CV gives an estimate of expected performance on new data from the same distribution drawn the same way. It does not protect you if the distribution shifts between training time and deployment (train/serve skew). It cannot prevent leakage if your features were computed using future information before the split. And if you tune hyperparameters on the same validation set you evaluate on, selection bias inflates your reported numbers by an amount that grows with how many configurations you tried. That last one is nested CV: outer loop estimates generalization quality, inner loop tunes hyperparameters. It is slower but it is the only approach that gives an unbiased estimate of the full model-selection pipeline.`,
    keyPoints: [
      `**When to use each CV strategy: match the strategy to your deployment assumption.**\n\nStandard k-fold (k=5 or k=10): use when observations are iid — no time structure, no entity groups. Stratified k-fold: use for any classification task with class imbalance; with 5% positive class and 5 folds, each fold should have approximately 5% positives. Group k-fold: use when the model will score entities (users, patients, stores) it has never seen — all rows from the same entity go to the same fold. Walk-forward CV: use for any time-series data, always. These are not style choices — using the wrong strategy gives you an evaluation that tests a deployment scenario that does not exist.`,
      `**The most common production trap: standard k-fold on time-series data.**\n\nThis is extremely common and produces validation scores that look reasonable but are meaningless. The tell: your validation AUC is 0.85 in CV, then drops sharply when you run a proper temporal holdout. Fix: always split by time for time-series data. Use expanding-window walk-forward validation as the default. Add a purge gap (e.g., 7 days) between training and validation windows to prevent rolling-window features from bleeding across the split boundary.`,
      `**The diagnostic: if you tuned hyperparameters and reported the best validation score, your number is biased upward.**\n\nRunning 100 Optuna trials and reporting the best trial\`s validation AUC is selection bias — you implicitly optimized for that held-out partition. The more configurations you tried, the worse the inflation. Fix: use nested CV (hyperparameter search in the inner fold only) or hold out a completely separate test set never touched during tuning. A quick sanity check: train the final model with the chosen hyperparameters and evaluate on data it has never influenced — if performance drops significantly, selection bias was real.`,
    ],
    interactivePrompt: `Before you touch the controls: if you use standard 5-fold CV on 3 years of daily transaction data, what specific problem does this introduce — and would your reported AUC be too high or too low as a result?`,
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
    takeaway: `Every CV strategy embeds an assumption about deployment — pick the wrong one and you are evaluating a scenario that does not exist, which is why walk-forward is mandatory for time-series and group k-fold is mandatory whenever new entities appear at inference time.`,
    interactiveId: 'cross_validation_viz',
    figures: {
      cv_folds: `<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:400px;font-family:var(--font-sans,sans-serif)">
  <!-- title -->
  <text x="200" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">5-Fold Cross-Validation</text>
  <!-- grid: 5 folds x 5 chunks, each cell 56x28 -->
  <!-- fold labels on left -->
  <text x="38" y="52" text-anchor="end" fill="var(--ink-mid)" font-size="10">Fold 1</text>
  <text x="38" y="80" text-anchor="end" fill="var(--ink-mid)" font-size="10">Fold 2</text>
  <text x="38" y="108" text-anchor="end" fill="var(--ink-mid)" font-size="10">Fold 3</text>
  <text x="38" y="136" text-anchor="end" fill="var(--ink-mid)" font-size="10">Fold 4</text>
  <text x="38" y="164" text-anchor="end" fill="var(--ink-mid)" font-size="10">Fold 5</text>
  <!-- fold 1: chunk1=val, chunks2-5=train -->
  <rect x="42" y="30" width="56" height="28" fill="var(--amber)" opacity="0.7" rx="2"/>
  <rect x="98" y="30" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="154" y="30" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="210" y="30" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="266" y="30" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <!-- fold 2 -->
  <rect x="42" y="58" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="98" y="58" width="56" height="28" fill="var(--amber)" opacity="0.7" rx="2"/>
  <rect x="154" y="58" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="210" y="58" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="266" y="58" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <!-- fold 3 -->
  <rect x="42" y="86" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="98" y="86" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="154" y="86" width="56" height="28" fill="var(--amber)" opacity="0.7" rx="2"/>
  <rect x="210" y="86" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="266" y="86" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <!-- fold 4 -->
  <rect x="42" y="114" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="98" y="114" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="154" y="114" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="210" y="114" width="56" height="28" fill="var(--amber)" opacity="0.7" rx="2"/>
  <rect x="266" y="114" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <!-- fold 5 -->
  <rect x="42" y="142" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="98" y="142" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="154" y="142" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="210" y="142" width="56" height="28" fill="var(--prime)" opacity="0.5" rx="2"/>
  <rect x="266" y="142" width="56" height="28" fill="var(--amber)" opacity="0.7" rx="2"/>
  <!-- cell text labels (just for fold 1) -->
  <text x="70" y="49" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Val</text>
  <text x="126" y="49" text-anchor="middle" fill="var(--ink-hi)" font-size="9">Train</text>
  <text x="182" y="49" text-anchor="middle" fill="var(--ink-hi)" font-size="9">Train</text>
  <text x="238" y="49" text-anchor="middle" fill="var(--ink-hi)" font-size="9">Train</text>
  <text x="294" y="49" text-anchor="middle" fill="var(--ink-hi)" font-size="9">Train</text>
  <!-- legend -->
  <rect x="42" y="185" width="16" height="12" fill="var(--amber)" opacity="0.7" rx="2"/>
  <text x="62" y="196" fill="var(--ink-mid)" font-size="10">Validation</text>
  <rect x="130" y="185" width="16" height="12" fill="var(--prime)" opacity="0.5" rx="2"/>
  <text x="150" y="196" fill="var(--ink-mid)" font-size="10">Training</text>
</svg>`,
    },
  },
  {
    id: 'error_analysis',
    title: 'Error Analysis',
    subtitle: 'Confusion matrix drill-down, error slicing, systematic failures',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['error analysis', 'failure modes', 'slicing', 'debugging'],
    summary: `An NLP intent classifier has 94% accuracy. The product team wants to ship it. Before signing off, you sample 200 errors to understand what the model is getting wrong. The breakdown: 67% are 3-word utterances ("turn on light"), 18% are code-switching instances (Spanish phrases embedded in English queries), 12% are negation patterns ("don't turn on"). The model looks strong on paper but fails catastrophically on the exact inputs your core user base sends. Aggregate accuracy hid everything.

Error analysis is the process of turning "the model has 6% error" into "the model fails on 3-word utterances and here is why." The aggregate metric tells you that a problem exists. Error analysis tells you which specific subpopulation has the problem, what kind of problem it is, and what intervention will fix it.

The process has five steps. First, sample errors — stratify by confidence rather than sampling uniformly. High-confidence wrong predictions (model says 0.95 positive, true label is negative) indicate systematic bias, not random noise. These are the failures the model is most certain about and most likely to produce repeatedly. Second, tag errors by category — manually assign each error to a bucket: labeling error in the training data, insufficient features for this input type, rare pattern with few training examples, or genuine ambiguity that humans also disagree on. Third, compute per-category error rate and volume. Fourth, prioritize by impact times feasibility — a category with 30% of all errors and a known fix beats a category with 5% of errors and unknown root cause. Fifth, trace to root cause: is it a data gap (no training examples of this type), a feature gap (the model cannot represent this pattern), or a distribution mismatch?

For the intent classifier: 67% of errors come from 3-word utterances. The model has too few short-utterance training examples — its vocabulary learned from longer queries does not transfer. The fix is targeted: collect 200 labeled 3-word utterances, retrain, and measure the category error rate. This single data collection effort addresses two-thirds of errors. No architectural change required.

**NOT this.** High overall accuracy means no serious errors. Aggregate metrics obscure subgroup failures. A model with 96% accuracy that fails on 100% of a minority demographic is not acceptable — the aggregate hides it. A spam filter with 98% accuracy that misclassifies all emails in a non-English language is not acceptable. Always break down errors by demographic slice, confidence level, input length, recency, and any business-critical subgroup. The aggregate metric is the last thing you report, not the first.

The formal distinction that matters most: systematic errors cluster by feature value, subgroup, or pattern and require targeted intervention — collecting more data from the failing subgroup, engineering a missing feature, or adding a specialized sub-model. Random errors that correlate with nothing are irreducible noise; collecting more global data will not help.`,
    keyPoints: [
      `**Always stratify errors by confidence level first — high-confidence wrong predictions (model says 0.95 positive, it is negative) indicate systematic bias, not random noise. These are your priority.**\n\nFor the intent classifier: sample 100 errors. Group them into confidence buckets: errors where model confidence was 0.5–0.7, 0.7–0.9, and 0.9–1.0. High-confidence errors in the 0.9–1.0 bucket are the model doubling down on a wrong pattern — a systematic feature or data problem. Low-confidence errors near 0.5 are boundary cases where the model is appropriately uncertain. Fix the high-confidence bucket first. In sklearn: sort errors by abs(predicted_prob - 0.5) descending, inspect the top 30. They will cluster by a specific pattern almost every time.`,
      `**Trap: sampling errors uniformly and concluding that common categories matter most. A rare error category that happens to affect high-value users or safety-critical decisions matters more than a common category that does not. Weight by business impact, not frequency.**\n\nFor the intent classifier: 12% of errors are negation patterns ("don't turn on"). This seems small. But those are the errors where the assistant does the opposite of what was asked — a user explicitly said not to do something and the system did it anyway. The business impact of acting on a negation error is catastrophically higher than misclassifying a benign 3-word utterance. Prioritize by cost(error type) × frequency(error type), not frequency alone. The cost matrix is a business decision, not a modeling decision.`,
      `**Diagnostic: if error categories do not have obvious fixes, you have a data gap — collect 200 examples from the hardest category and retrain. This typically moves more metric than any architectural change.**\n\nFor the intent classifier: code-switching errors (Spanish phrases in English queries) represent 18% of all errors. The model has almost no Spanish-English mixed examples in training. The fix is not a larger model or a better architecture — it is 200 labeled code-switching examples added to the training set. Retrain. Measure the category error rate on a held-out slice of code-switching examples. If it drops from 60% to 20%, the data gap was the problem. If it stays high, there is a feature representation problem. Data collection is cheaper than architecture search and should come first.`,
    ],
    interactivePrompt: `Before you touch the controls: if a model achieves 94% accuracy overall but all errors cluster in one specific subgroup, is that model better or worse than a model with 91% accuracy whose errors are uniformly distributed?`,
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
    takeaway: `Aggregate metrics tell you that a problem exists — error slicing by confidence, subgroup, and input type tells you which specific subpopulation has the problem — and targeting 200 examples of the hardest error category almost always moves more metric than any architectural change.`,
  },
  {
    id: 'calibration',
    interactiveId: 'calibration_curve_viz',
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
    summary: `A fraud detection system has five input features, three model components (feature interactions, temporal aggregations, graph embeddings), and two preprocessing steps (standard scaling, outlier clipping). The full system achieves AUC 0.91. The team wants to improve it. Where should they invest?

The answer requires ablation. Remove each component one at a time, hold everything else fixed, measure the AUC drop. Without graph embeddings: AUC 0.83 (−0.08). Without temporal aggregations: AUC 0.89 (−0.02). Without feature interactions: AUC 0.91 (−0.00). Without scaling: AUC 0.90 (−0.01). Without outlier clipping: AUC 0.91 (−0.00).

The diagnosis is immediate. Graph embeddings carry almost all of the signal — an 8-point drop when removed. Temporal aggregations contribute meaningfully. Feature interactions and outlier clipping are vestigial. The next engineering investment should go toward improving graph embeddings, not toward the components that ablation shows are dead weight. Two hours of running ablations replaced a month of speculative architecture search.

Ablation is the empirical partial derivative of the system — it measures the marginal contribution of each component holding all others fixed. There are two designs. Leave-one-out ablation starts from the full system and removes one component at a time. Add-one-in ablation starts from the simplest baseline and adds components one at a time. Both are valid. They can give different answers when components interact — component A may contribute little on its own but be essential when combined with B. Leave-one-out ablation misses this; you need interaction ablation to catch it.

The interaction trap: the feature interactions component showed zero marginal contribution in the leave-one-out ablation (AUC remained 0.91 when removed). But interactions might synergize with temporal aggregations — try removing both together. Without feature interactions and temporal aggregations: AUC 0.86. The pair contributes more than their individual marginal effects. Neither is truly vestigial; each depends on the other being present. Confirm before removing anything: re-add the component and verify that AUC returns to its prior level.

**NOT this.** A component that does not hurt when removed was useless. Interactions. Feature A might have near-zero marginal contribution alone but be essential when combined with feature B. Ablation in isolation misses synergies. Always confirm by re-adding components you are considering removing and verifying the result is reversible. If removing A and then re-adding A does not restore the original AUC, you have an interaction effect that requires pairwise ablation to diagnose.

The formal statement: ablation is leave-one-out estimation of component importance. Marginal contribution of component C = AUC(full) − AUC(full \ {C}). For interactions, estimate pairwise contribution of {C, D} = AUC(full) − AUC(full \ {C, D}) and compare to the sum of individual contributions.`,
    keyPoints: [
      `**Run ablation before any architectural investment — it takes a few training runs and tells you which components actually matter. Engineers routinely build elaborate features that ablation would have shown are vestigial in 2 hours.**\n\nFor the fraud detection system: the team spent two weeks building a 50-feature interaction matrix before running any ablation. The ablation showed that none of the interaction features contributed beyond what graph embeddings already captured. Two hours of ablation would have saved two weeks of engineering. The protocol: immediately after reaching a working baseline, run one ablation pass over all major components. Report AUC with and without each component. Only invest further engineering time in components that show a positive marginal contribution.`,
      `**Trap: ablating on the training set or a small dev set. Component importance is estimated from held-out performance. Ablation on training data reflects memorization, not generalization — run on the same evaluation set you use for model selection.**\n\nFor the fraud detection system: if the ablation was run on the training set, the feature interactions component would show a large positive contribution — trees always find spurious interactions that fit training data but do not generalize. On the held-out validation set, that same component shows zero contribution. The rule: every ablation result must come from held-out performance on the same evaluation set used for model selection. Never trust a component's training-set importance as evidence that it generalizes.`,
      `**Diagnostic: if multiple ablations show near-zero contribution, your system is likely dominated by a single component. This is a fragility signal — the system will break when that one component degrades.**\n\nFor the fraud detection system: if removing graph embeddings drops AUC from 0.91 to 0.83, and removing everything else barely moves AUC, the system is entirely dependent on graph embeddings. If the graph data pipeline goes down, the system degrades from AUC 0.91 to 0.83 instantly. Operational resilience requires backup components. If graph embeddings are unavailable, can temporal aggregations carry enough signal to maintain acceptable performance? Ablation answers this: the AUC without graph embeddings is 0.83. Is that acceptable? That is a business decision — but ablation gives you the number you need to make it.`,
    ],
    interactivePrompt: `Before you touch the controls: if removing component A from the full system drops AUC from 0.91 to 0.83, and removing component B drops it from 0.91 to 0.90, can you conclude that component A is always more important than B, or can you think of a scenario where that ranking would reverse?`,
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
    takeaway: `Ablation is the empirical partial derivative of your system — remove one component, measure the drop, repeat — and two hours of ablation before committing to any architecture investment will consistently outperform two weeks of speculative engineering.`,
  },
  {
    id: 'evaluation_in_prod',
    title: 'Evaluation in Production',
    subtitle: 'Shadow mode, champion-challenger, guardrail metrics, significance at scale',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['production evaluation', 'shadow mode', 'A/B testing', 'champion-challenger'],
    summary: `An A/B test runs for 2 days. Treatment shows +18% CTR. The team ships it. Two weeks later, revenue is down 4%. What happened?

Novelty effect. Users click new things regardless of quality. After the novelty fades, engagement drops below baseline. The 2-day A/B test ran entirely during the novelty window — it measured novelty, not the model. The team optimized for a signal that did not persist.

Production evaluation is the discipline of measuring model impact in ways that survive this and similar traps. The guiding principle: every ship/no-ship decision should ultimately be backed by a controlled experiment. Everything else — offline metrics, shadow mode, proxy metric calibration — exists to filter candidates cheaply so you run A/B tests only on the handful worth testing.

Shadow mode comes first for any high-stakes deployment. The new model receives the same live traffic as the champion and generates predictions, but only the champion's predictions are served to users. Shadow mode validates serving infrastructure under real load, catches unexpected output distributions, and reveals large prediction disagreements between the two models before any user exposure. It is the step that catches infrastructure bugs offline testing never catches.

A/B tests have three requirements that are routinely violated. First, run for at least two full business cycles — minimum 2 weeks, 4 for products with strong seasonal patterns. A 2-day test that shows a positive result has almost certainly not survived novelty. Second, pre-register your primary metric and required sample size before starting. Looking at results midway through and stopping when p < 0.05 inflates Type I error dramatically — with daily peeking at α = 0.05, the true false positive rate is approximately 30% by day 20. Use sequential testing methods (mSPRT, always-valid inference) if you need to peek. Third, define guardrail metrics before the test starts: secondary online metrics that must not degrade even if the primary metric improves. A recommendation model that raises CTR by promoting sensationalist content while destroying session length is worse than no model — guardrails catch this before ship.

**NOT this.** Statistical significance means the result is real. p < 0.05 means the result is unlikely under the null hypothesis — it says nothing about whether the effect will persist, whether the magnitude is practically meaningful, or whether the experiment was conducted validly. At 10 million daily users, a 0.01% CTR lift achieves p < 0.0001 with one day of data. That is 1,000 extra clicks. Ask whether retraining, deploying, and maintaining a new model is worth 1,000 extra clicks per day. "Is this effect real?" and "Is this effect worth acting on?" are different questions, and at large scale the first question is almost always yes.

The formal statement: a valid A/B test requires randomized assignment (same user always in the same arm), sufficient duration (2+ business cycles), pre-registered primary metric, pre-specified sample size calculation (power analysis), and guardrail metrics monitored throughout. Violating any one of these produces a result that cannot be trusted.`,
    keyPoints: [
      `**Always run A/B tests for at least 2 full business cycles before making a decision — novelty effects typically last 3–7 days and can fully reverse a 15% positive signal.**\n\nFor the recommendation test: the +18% CTR was measured on days 1–2. On days 3–14, CTR in the treatment arm declines steadily as novelty fades. By day 14, CTR in treatment is 2% below control. If the test had run for 2 weeks, the team would have seen the reversal before shipping. The diagnostic: plot daily CTR for treatment vs control separately. If treatment CTR is declining toward control CTR over the first 7 days, novelty is explaining the effect. If treatment CTR is stable and above control at day 14, the effect is real.`,
      `**Trap: peeking at results before the planned end date inflates Type I error. Running a sequential test that checks significance daily at α = 0.05 gives a true false positive rate of ~30% by day 20. Use sequential testing methods (mSPRT, always-valid inference) if you need to peek.**\n\nFor the recommendation test: the team checks results every morning. On day 3, p = 0.03. They stop the test and ship. The problem: every day of peeking at α = 0.05 is an independent opportunity to cross the significance threshold by noise alone. With 20 days of peeking, the probability of at least one false positive reaches ~30%. The fix: use an always-valid sequential test framework (Spotify's SPRT, Microsoft's ExP). These frameworks compute valid p-values at any stopping point by construction, letting you stop early when the result is clear without inflating false positive rate.`,
      `**Diagnostic: if your positive A/B test result reverses after shipping, check novelty curves — plot daily CTR separately for users in their first 7 days of exposure vs later. If day-1 CTR is much higher than day-7, you measured novelty.**\n\nFor the recommendation model: after shipping and observing revenue decline, segment users by days since first exposure to the new model. New-to-model users (day 1–3): CTR 22% above baseline. Users 4–7 days in: CTR 8% above baseline. Users 8+ days in: CTR 3% below baseline. The novelty curve is unmistakable. The model was not better — it was new. The operational fix: run all future tests for at least 14 days and require that the treatment effect is stable (non-declining) in the last 7 days before shipping.`,
    ],
    interactivePrompt: `Before you touch the controls: if you run an A/B test for 2 days and see +18% CTR with p = 0.001, is that sufficient evidence to ship — and what would you want to see before making the decision?`,
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
    takeaway: `Statistical significance confirms the effect is unlikely to be noise — it says nothing about whether it will persist, whether it is practically meaningful, or whether the experiment was valid; a 2-day test during a novelty window with daily peeking can produce p = 0.001 on an effect that reverses completely in two weeks.`,
  },
]
