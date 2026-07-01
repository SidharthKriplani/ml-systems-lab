export const EVAL_MODULES = [
  {
    id: 'metrics_first_principles',
    title: 'Eval Metrics from First Principles',
    subtitle: 'Confusion matrix, precision, recall, F1, why accuracy fails',
    difficulty: 'foundational',
    estimatedMin: 32,
    tags: ['metrics', 'precision', 'recall', 'F1', 'confusion matrix'],
    summary: `Imagine you build a fraud detector. Your dataset has 10,000 transactions, and 100 of them are fraud — just 1%. You train a model and it scores **99% accuracy**. The team celebrates. Then you look closer: the model predicted "not fraud" for every single transaction. It caught zero frauds. The accuracy number was lying to you the whole time.

That is the trap accuracy sets on imbalanced data. It blends four very different outcomes into one number that the majority class dominates. To actually understand a classifier, you have to pull those four outcomes apart.

---

**The four outcomes: the confusion matrix.**

Every prediction lands in one of four boxes. **TP** (true positive): correctly caught fraud. **FP** (false positive): flagged a legit transaction — a false alarm, a customer's card blocked for nothing. **FN** (false negative): missed a fraud — it goes through, the bank eats the loss. **TN** (true negative): correctly cleared a legit transaction.

[FIGURE: confusion_matrix]

The whole point is that these four do *not* cost the same. A false alarm annoys a customer; a missed fraud loses real money. Accuracy pretends they are interchangeable. They never are.

---

**Two numbers that actually mean something.**

From those four boxes come two ratios, each measuring a different way to fail.

**Precision** = TP / (TP + FP): when the model shouts "fraud!", how often is it right? Low precision means you are drowning your operations team in false alarms.

**Recall** = TP / (TP + FN): of all the real frauds, how many did you actually catch? Low recall means fraud is slipping past you.

And here is the tension that runs through all of classification: these two pull against each other. Make the model more cautious (raise the threshold) and precision climbs while recall falls — fewer false alarms, but more fraud missed. Loosen it and the reverse happens. This is not a flaw in the metrics; it is a real business trade-off, and where you land depends entirely on what each mistake costs you.

---

**Combining them — and doing it honestly.**

People often reach for **F1**, which blends precision and recall into one number: $F1 = 2 \\cdot P \\cdot R / (P + R)$. It uses the *harmonic* mean on purpose, because that punishes lopsided scores — a model with precision 0.9 and recall 0.1 gets an F1 of 0.18, not a flattering 0.5.

But F1 makes a silent assumption: that precision and recall matter equally. If a missed fraud costs ten times more than a false alarm, they do not. **F-beta** lets you tilt the balance: $F_β = (1 + β^2) \\cdot P \\cdot R / (β^2 \\cdot P + R)$, where β > 1 weights recall more and β < 1 weights precision more. The right β comes from your costs, not from habit.

So the real first step is not choosing a metric — it is writing down what each mistake costs. In fraud, a missed fraud (FN) usually dwarfs a false alarm (FP), so you lean toward recall. In spam filtering it flips: a real email lost to the spam folder (FP) destroys trust, so you lean toward precision. In cancer screening, a missed tumor (FN) is catastrophic, so recall rules. Translate TP, FP, FN, TN into money or risk first. Every metric choice follows from that.`,
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
    figures: {
      confusion_matrix: `<svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="160" y="30" text-anchor="middle" fill="var(--ink-low)" font-size="10">predicted fraud</text>
  <text x="260" y="30" text-anchor="middle" fill="var(--ink-low)" font-size="10">predicted legit</text>
  <text x="24" y="90" text-anchor="middle" fill="var(--ink-low)" font-size="10" transform="rotate(-90 24 90)">actual fraud</text>
  <text x="24" y="170" text-anchor="middle" fill="var(--ink-low)" font-size="10" transform="rotate(-90 24 170)">actual legit</text>
  <rect x="110" y="45" width="100" height="80" rx="4" fill="var(--teal)" opacity="0.18" stroke="var(--teal)" stroke-width="1.2"/>
  <text x="160" y="80" text-anchor="middle" fill="var(--ink-hi)" font-size="13" font-weight="700">TP</text>
  <text x="160" y="98" text-anchor="middle" fill="var(--ink-low)" font-size="8">caught fraud</text>
  <rect x="210" y="45" width="100" height="80" rx="4" fill="var(--prime)" opacity="0.18" stroke="var(--prime)" stroke-width="1.2"/>
  <text x="260" y="80" text-anchor="middle" fill="var(--ink-hi)" font-size="13" font-weight="700">FN</text>
  <text x="260" y="98" text-anchor="middle" fill="var(--ink-low)" font-size="8">missed fraud</text>
  <rect x="110" y="125" width="100" height="80" rx="4" fill="var(--prime)" opacity="0.18" stroke="var(--prime)" stroke-width="1.2"/>
  <text x="160" y="160" text-anchor="middle" fill="var(--ink-hi)" font-size="13" font-weight="700">FP</text>
  <text x="160" y="178" text-anchor="middle" fill="var(--ink-low)" font-size="8">false alarm</text>
  <rect x="210" y="125" width="100" height="80" rx="4" fill="var(--teal)" opacity="0.18" stroke="var(--teal)" stroke-width="1.2"/>
  <text x="260" y="160" text-anchor="middle" fill="var(--ink-hi)" font-size="13" font-weight="700">TN</text>
  <text x="260" y="178" text-anchor="middle" fill="var(--ink-low)" font-size="8">cleared legit</text>
  <text x="210" y="228" text-anchor="middle" fill="var(--ink-low)" font-size="9">green = correct · orange = the two mistakes (different costs)</text>
</svg>`,
    },
  },
  {
    id: 'auc_roc',
    interactiveId: 'roc_curve_viz',
    title: 'ROC Curve & AUC',
    subtitle: 'FPR/TPR, what area means, PR-AUC for imbalanced classes',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['ROC', 'AUC', 'PR-AUC', 'ranking'],
    summary: `Here is the problem with reporting one number for a classifier: it hides everything. Take that same fraud detector. At a threshold of 0.5 it gets precision 80%, recall 60%. Drop the threshold to 0.3 and precision falls to 65% while recall climbs to 80%. Raise it to 0.7 and you get precision 90%, recall 40%. The model's quality is not a single number — it depends entirely on where you draw the line. So how do you compare two models *before* committing to a threshold?

---

**The ROC curve: try every threshold at once.**

The ROC curve answers exactly that. For every possible threshold, compute two numbers: the **TPR** (true positive rate, also called recall — the fraction of real frauds you catch) and the **FPR** (false positive rate — the fraction of legit transactions you wrongly flag). Plot TPR up the side and FPR along the bottom. As you lower the threshold you catch more fraud (TPR rises) but also raise more false alarms (FPR rises), and the curve traces that whole trade-off in one picture.

[FIGURE: roc_curve]

A model that guesses randomly gives the diagonal line (TPR always equals FPR), so its area under the curve — **AUC** — is 0.5. A perfect model hugs the top-left corner (catch everything, flag nothing), so its AUC is 1.0. The AUC is a single score for the model across *all* thresholds at once.

---

**What AUC actually means.**

There is a lovely second reading of AUC that needs no curve at all. AUC is exactly the probability that the model scores a random real fraud higher than a random legit transaction. So AUC = 0.91 means: pick any one fraud and any one legit transaction at random, and the model ranks the fraud above the legit one 91% of the time. That is all AUC measures — how well the model *ranks* positives above negatives, averaged over every possible pair. (That is also why it ignores your threshold: it is a pure ranking score. Statisticians know it as the normalized Mann-Whitney U statistic.)

---

**Where it quietly lies: rare positives.**

Now the catch. FPR is FP / (FP + TN), and on imbalanced data that TN is enormous — 9,900 legit transactions for every 100 frauds. So even 500 false alarms give FPR = 500 / 10,400 ≈ 0.05, which looks tiny. The ROC curve sits comfortably in the top-left, AUC = 0.91, everyone is happy. But look at precision: 100 / (100 + 500) = 0.17. Six out of every seven alerts your fraud team chases are wrong.

The fix is the **precision-recall (PR) curve**, which plots precision against recall and never touches TN at all. When positives are rare, it is the honest picture — a model that looks production-ready on ROC-AUC can be exposed as a false-alarm machine on PR-AUC. Rule of thumb: if your positive class is under about 10% of the data, use **PR-AUC**, not ROC-AUC.

---

One last thing to hold onto: AUC of either kind is a *threshold-independent* summary, so it tells you nothing about the specific cutoff you will actually run. AUC is for *choosing the model*; setting the threshold is a separate business decision driven by your cost matrix. Pick the model with AUC; pick the operating point with costs.`,
    keyPoints: [
      `**ROC-AUC or PR-AUC? It comes down to whether the negatives are rare or common.**\n\nUse ROC-AUC when the classes are roughly balanced, or when getting the negatives right genuinely matters (like credit scoring, where correctly approving good applicants counts, not just catching defaulters). Use PR-AUC when negatives massively outnumber positives — fraud, disease screening, anomaly detection — because there the ocean of true negatives inflates the FPR denominator and makes ROC-AUC look better than it really is. Rule of thumb: if your positive class is under about 10% of the data, reach for PR-AUC.`,
      `**The trap: shipping a model with a great AUC on rare-positive data, then watching the alert queue overflow.**\n\nAUC = 0.91 on a 1%-fraud dataset can sit right next to precision = 0.17 at the threshold you actually deploy — the ROC curve looked fine only because true negatives flooded the FPR denominator. Always check precision at your intended recall before calling a model ready. If you need 80% recall and precision there is 15%, the model is not production-ready no matter what AUC says.`,
      `**The habit: AUC picks the model, the cost matrix picks the threshold.**\n\nAfter comparing models by AUC or PR-AUC, choose your deployment threshold by plotting the precision-recall trade-off and finding the point your costs demand. A concrete check: at 80% recall, how many alerts per day does that produce? If your team can handle 200 and the model would fire 2,000, the threshold has to move regardless of AUC. AUC told you which model; the costs tell you where to run it.`,
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
    summary: `You type "Python tutorial for beginners" into a search box and get back ten results. Suppose the truly useful ones sit at positions 1, 3, and 7. A metric that just counts "3 of 10 are relevant" scores this 0.30 — and would give the *same* 0.30 if those three results were buried at positions 8, 9, and 10. But you know that is wrong: nobody reads past the first couple of results once they have their answer. Any metric that ignores *position* is nearly useless for search and recommendation.

So the whole family of ranking metrics is built on one idea: a relevant result near the top is worth far more than the same result near the bottom. They differ in how much detail they capture.

[FIGURE: rank_discount]

---

**MRR — where is the first good one?**

The simplest is **Mean Reciprocal Rank**. It cares about one thing: the position of the *first* relevant result. If it is at position 1 you score 1/1 = 1.0; at position 3, 1/3 = 0.33. Average that across all your queries and you have MRR. It fits perfectly when the user has a single need and stops at the first good answer — a fact lookup, an FAQ, a "just take me to X" query. It is the wrong choice the moment users want *several* relevant results, because it ignores everything after the first hit.

---

**MAP — did you find them all, and early?**

**Mean Average Precision** rewards surfacing relevant results both early *and* completely. For one query, walk down the list, and each time you hit a relevant result note the precision so far; average those, then divide by the total number of relevant results. For our example (relevant at 1, 3, 7, three relevant total): (1/3)(1/1 + 2/3 + 3/7) ≈ 0.70. Average across queries to get MAP. It only needs yes/no relevance labels, which makes it cheap to collect.

---

**NDCG — the industry standard.**

**Normalized Discounted Cumulative Gain** adds the one thing MAP lacks: *grades* of relevance. A result can be perfect (grade 3), okay (grade 1), or useless (grade 0), not just relevant or not. NDCG folds in two moves: each result contributes (2^grade − 1), so a perfect hit counts far more than a so-so one; and each position is discounted by log₂(position + 1), so position 1 counts fully, position 3 about half, position 10 under a third. Divide by the score of the *ideal* ordering and you get a number from 0 to 1 that is comparable across queries. This is what commercial search and recommendation teams actually use, when they have graded human judgments and position matters.

---

**Which one? Match the metric to what users do.**

There is no single best ranking metric — the right one mirrors real behavior. If users scan a vertical list and stop at the first hit, use **MRR**. If they expect to find all the relevant results and would be annoyed to see any buried, use **MAP**. If you have graded labels and care about exact ordering, use **NDCG**. And if every shown slot is equally prominent regardless of order — a grid of products, a row of ad slots — plain **Precision@K** is fine. Pick by what the interface makes people do, not by which formula looks most impressive.`,
    keyPoints: [
      `**Match the metric to the user's behavior, not to mathematical elegance.**\n\nGraded labels and position matters (commercial search)? Use NDCG. User wants one answer and stops at the first hit (question-answering, lookups)? Use MRR. Every shown slot equally prominent regardless of order (a product grid, an ad row)? Use Precision@K. Choose the wrong one and you optimise a proxy that does not track the real experience — NDCG@10 can even climb while MRR falls, if the model improves positions 4–10 while making position 1 worse.`,
      `**The trap: judging against an incomplete set of relevance labels.**\n\nRaters can only score a small pool of documents out of millions. If that pool was built from the old system's top results, a new system that surfaces genuinely relevant documents nobody ever judged will see them scored as "not relevant" by default — so it looks worse on NDCG even though it found better results. When a change is big (a new retrieval or ranking model), judge the new system's novel results before comparing scores.`,
      `**The diagnostic: look at NDCG@1 versus NDCG@10 separately.**\n\nIf NDCG@10 is healthy but NDCG@1 is much lower, the relevant results are in the top ten but the best one is not landing first — your re-ranking is the bottleneck, not retrieval. If NDCG@1 and NDCG@10 are both low and roughly equal, the relevant documents are not even in the candidate set — retrieval is the bottleneck. The split tells you which stage to go fix.`,
    ],
    interactivePrompt: `Before you touch the controls: if the only relevant result in a 10-result list moves from position 5 to position 1, which metric improves more — MRR or NDCG@10 — and why?`,
    checkQuestions: [
      {
        q: `A search engine retrieves 3 relevant documents at ranks 1, 3, 5, out of 5 total relevant documents. Compute Average Precision (AP).`,
        options: [
          `A) AP = 0.60 — the average of P@1, P@3, and P@5 weighted by the 3 relevant documents that were actually retrieved`,
          `B) AP = 0.453 — add the precision at each rank where a relevant doc appears (1.0, 2/3, 3/5) and divide by the total relevant count, 5: (1/5)(1.0 + 0.667 + 0.6) = 0.453`,
          `C) AP = 0.333 — the plain mean of P@1, P@3, and P@5 with no division by the total number of relevant documents`,
          `D) AP = 0.50 — since 3 of the 5 relevant docs were found, AP is just the recall of 0.60 blended together with precision`,
        ],
        answer: `B`
      },
      {
        q: `Your recommendation system shows NDCG@10 = 0.85 offline, but users complain the results feel irrelevant. What could explain the gap?`,
        options: [
          `A) The NDCG was likely computed on click-based labels that bake in position bias, or the offline test set is stale, or the average hides poor performance on tail queries, or relevance was scored per item while the real experience is per session — offline NDCG and felt relevance can diverge for any of these reasons.`,
          `B) NDCG@10 = 0.85 is simply too low — results only start to feel relevant once NDCG climbs above 0.95, so the fix is just to push the model harder.`,
          `C) The model is overfitting the test set; 0.85 on held-out data alongside complaints means the test set is unrepresentative, and nothing else could be going on.`,
          `D) Users are scrolling past position 10, so the entire problem lives below the top ten, somewhere NDCG@10 cannot see it at all.`,
        ],
        answer: `A`
      },
      {
        q: `A search system has MRR = 0.60. A manager wants 0.75. What does that mean concretely, and what would you change?`,
        options: [
          `A) Going from 0.60 to 0.75 is a 25% relative lift, so the move is to improve overall ranking quality evenly, nudging every position up by the same amount.`,
          `B) MRR only ever looks at the first relevant result, so raising it means fully re-ranking the entire result set for every single query from scratch.`,
          `C) MRR = 0.60 means the first relevant result sits at rank ≈ 1.67 on average; 0.75 means ≈ 1.33. So focus on the queries where the first relevant result is at rank 3 or worse — improve query understanding, and improve retrieval recall so the re-ranker actually has the right document to put first.`,
          `D) It means increasing the share of queries that return any relevant result at all, so the effort should go entirely into recall-oriented retrieval improvements.`,
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
    takeaway: `All ranking metrics embed a model of user attention — MRR says users stop after the first hit, MAP says they care about every relevant item equally, NDCG says attention decays with position and highly relevant results matter more — so choosing the metric is choosing which user behaviour you believe, not which formula is standard.`,
    figures: {
      rank_discount: `<svg viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:300px;font-family:var(--font-sans,sans-serif)">
  <text x="150" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">a hit is worth less further down</text>
  <g font-size="10">
    <text x="20" y="46" fill="var(--ink-low)">1</text><rect x="46" y="37" width="200" height="12" rx="2" fill="var(--prime)"/><text x="252" y="46" fill="var(--ink-hi)">1.00</text>
    <text x="20" y="70" fill="var(--ink-low)">2</text><rect x="46" y="61" width="126" height="12" rx="2" fill="var(--prime)" opacity="0.85"/><text x="178" y="70" fill="var(--ink-hi)">0.63</text>
    <text x="20" y="94" fill="var(--ink-low)">3</text><rect x="46" y="85" width="100" height="12" rx="2" fill="var(--prime)" opacity="0.72"/><text x="152" y="94" fill="var(--ink-hi)">0.50</text>
    <text x="20" y="118" fill="var(--ink-low)">4</text><rect x="46" y="109" width="86" height="12" rx="2" fill="var(--prime)" opacity="0.6"/><text x="138" y="118" fill="var(--ink-hi)">0.43</text>
    <text x="20" y="142" fill="var(--ink-low)">5</text><rect x="46" y="133" width="78" height="12" rx="2" fill="var(--prime)" opacity="0.5"/><text x="130" y="142" fill="var(--ink-hi)">0.39</text>
    <text x="20" y="166" fill="var(--ink-low)">6</text><rect x="46" y="157" width="72" height="12" rx="2" fill="var(--prime)" opacity="0.42"/><text x="124" y="166" fill="var(--ink-hi)">0.36</text>
  </g>
  <text x="20" y="196" fill="var(--ink-low)" font-size="9">rank</text>
  <text x="150" y="196" text-anchor="middle" fill="var(--ink-low)" font-size="9">weight = 1 / log₂(rank + 1)</text>
</svg>`,
    },
  },
  {
    id: 'offline_vs_online',
    title: 'Offline vs Online Evaluation',
    subtitle: 'Proxy metrics, A/B gap, how to close the offline-online divide',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['evaluation', 'A/B testing', 'online metrics', 'proxy metrics'],
    summary: `A recommendation team retrains their model. The offline holdout **NDCG jumps from 0.79 to 0.82** — a clear win. They ship it in an A/B test. **CTR drops 3%.** The number that was supposed to predict success went up; the real-world number went down. What happened?

Here is the catch. The holdout set was built from interaction logs collected six months ago. So the model was tuned to predict what users *would have clicked*, in a six-month-old catalog, through a six-month-old interface. Deployed today it recommends slightly stale content, misses what is trending now, and chases engagement patterns that have since moved on. The test set was a snapshot of the past. The offline metric was faithfully measuring the wrong world.

---

**Why offline and online disagree.**

Offline metrics measure how well a model predicts *past* behaviour. Online metrics measure how real users respond *now*. Three structural gaps drive them apart.

**Distribution shift.** The historical test set is not live traffic — preferences, the catalog, and the context all drift over time.

**Proxy labels.** A click is not satisfaction. Someone who clicked a clickbait headline and bounced immediately was not helped, but offline NDCG counts it as a win. You are measuring a stand-in for the thing you actually care about.

**Feedback loops.** Once deployed, the model *shapes* the data it will later be trained on. Show recommendation A, users interact with A, those interactions become tomorrow's training set. The model changes the future distribution just by being live.

---

**How much do they even correlate?**

Nowhere near perfectly. For search and recommendation, the correlation between an offline gain and the matching online gain is usually only about 0.3 to 0.7. A 5% offline NDCG bump might buy a 2% CTR lift, which might buy a 1% revenue lift — the signal fades at every hop. So measure this correlation *on your own system*: over your last ten A/B tests, plot the offline delta against the realised online delta. If they barely track each other (correlation below about 0.5), then redesigning your evaluation matters far more than tuning the model yet again.

---

**The habit that keeps you honest.**

A strong offline result is a *hypothesis*, not a verdict. Models can overfit the evaluation set itself — lifting offline NDCG while making the real experience worse — for instance by memorising which items were in the historical judgment pool. So treat every offline win as "promising, let's test it," never as "done." Two guardrails make offline numbers trustworthy: split your data by *time* (train on the past, test on the most recent window, never a random shuffle across all dates), and shadow-deploy the new model on live traffic before the A/B test to catch distribution shift before it costs you anything.`,
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
          `C) Investigate whether NDCG improved on click-based labels with position bias, or the model optimised for initial clicks but not session engagement — do NOT ship if session length is a confirmed guardrail metric`,
          `D) Split the difference: ship a 50% rollout and monitor session length with automated rollback if it drops further`,
        ],
        answer: `C`
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
    summary: `You are building a model to predict next-week stock returns. Among your features you include one called "average return over the next 7 days." You train, validate, and get **95% accuracy** — numbers you have never seen. You ship it. In production, accuracy is **2%.** What happened?

The feature cheated. "Average return over the next 7 days" is computed from the very thing you are trying to predict. The model did not learn anything — it read the answer straight off that feature. During validation the answer was sitting right there in the inputs; in production that information does not exist yet, so the model is worthless. This is **data leakage**: information from the future, or from the outcome itself, sneaking into the training features.

The dangerous part is that a normal train/test split does *not* catch it — because both halves are contaminated the same way. Leakage comes in three main flavours, each with its own fix.

---

**Temporal leakage — peeking at the future.**

You have time-ordered data and you split it into train/test by picking rows at random. Now some training rows come from *after* the test rows' prediction time, so the model gets to peek ahead. The fix is a strict time cutoff: every feature for a row must be built only from data that existed *before* that row's prediction moment. Train on the past, test on the future — never a random shuffle across dates.

---

**Group leakage — the same subject on both sides.**

The same user (or patient, or store) shows up in both train and test. Your fraud model trains on some transactions from users A, B, C and is tested on *other* transactions from those same users — so it memorises each person's spending habits, patterns that simply will not exist for brand-new users at deployment. The fix is to split by *group*: every row from a given user goes entirely to one side.

---

**Label leakage — the right time, the wrong direction.**

This one is subtle. The feature has a valid timestamp, but it is a *consequence* of the outcome rather than a cause of it. Classic example: predicting whether a patient was hospitalised, using "days in the ICU" as a feature — that number only exists *because* they were hospitalised. The audit question is not "when was this computed?" but "does this feature come *before* the outcome in the causal chain, or *after* it?"

---

**The one question that catches almost everything.**

For every feature, ask: *would this exact value exist at the moment of prediction in production, knowing nothing about future events?* If the answer is no, it is leakage — full stop. And a few red flags should trigger an immediate audit: validation AUC above 0.97 on a problem where even human experts disagree; one feature towering over all the others in importance; train and validation accuracy nearly identical with no gap; or a mediocre model suddenly looking brilliant right after you added one new feature group.`,
    keyPoints: [
      `**When to audit for leakage: any time validation looks too good to be true.**\n\nRed flags: AUC above 0.95 on a problem where domain experts only manage 70–80%; a single feature with far higher importance than all the others (can it even be known at prediction time?); train and validation accuracy within a point or two of each other with no regularisation (the test set is probably contaminated); or AUC jumping ten-plus points right after you add one new feature group (check that group's causal link to the label).`,
      `**The most common trap: target encoding computed on the full dataset before the split.**\n\nTarget encoding replaces a category with the average outcome for that category. Compute those averages over the whole dataset (test rows included) and each test row's feature now carries information from its own label — a direct leak. Fix: compute the encodings out-of-fold (each row encoded using only the other folds), or wrap it in a scikit-learn Pipeline inside cross-validation. It is easy to miss because the code looks completely innocent.`,
      `**The diagnostic: for every feature, ask whether its value would exist at the exact moment of prediction.**\n\nFor each feature, write down what data it uses, when that data becomes available, and whether that is before or after the prediction time. Any feature whose data only arrives after the prediction moment is leakage. You can do this whole audit in a spreadsheet. Inheriting a model? Check its top five features by importance and confirm each one passes the timestamp test.`,
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
          `A) Random row-level split puts the same user in both train and test — the model memorises user-level patterns that will not generalise to new users; fix by splitting at the user level, so all visits from a user go to exactly one side.`,
          `B) The 80/20 ratio is too aggressive — switch to 70/30 to give the test set more samples for a more reliable evaluation.`,
          `C) 500,000 rows is simply too large for random splitting — use stratified sampling instead to make sure the class balance is preserved.`,
          `D) The real problem is insufficient feature engineering — the split method does not matter much as long as the features themselves are well-constructed.`,
        ],
        answer: `A`
      },
      {
        q: `What is target encoding leakage, and how does k-fold target encoding fix it?`,
        options: [
          `A) It happens when the category names are semantically related to the label; k-fold fixes it by swapping the names for anonymised category IDs before encoding.`,
          `B) It is really just group leakage under another name; k-fold fixes it by making sure each category appears in only one fold of the data.`,
          `C) It happens because computing category means on the full dataset folds each test row's own label into its feature; k-fold target encoding fixes this by encoding each row using only out-of-fold data, so no row's label ever contributes to its own encoding.`,
          `D) It happens when rare categories get noisy mean estimates; k-fold fixes it by averaging those estimates across several folds for extra stability.`,
        ],
        answer: `C`
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
    summary: `You are training a random forest on 5,000 examples. You tune max_depth with a single 80/20 split. By luck, the test set landed on mostly *easy* examples — the ones any model gets right. You read **87% accuracy**, pick the max_depth that scores best on this one split, and call it done. You deploy. Performance: **79%.** What went wrong?

A single split is just one of the many ways you *could* have divided the data. You got a lucky draw, your estimate had high variance, and you staked the whole tuning decision on it.

---

**k-fold: don't trust one split, average many.**

k-fold cross-validation runs several splits and averages them. With k=5 on 5,000 examples: cut the data into 5 groups of 1,000; train on 4,000 and test on the held-out 1,000; rotate so each group is the test set exactly once; average the 5 scores. Now every example is tested once, and your estimate is far steadier. Standard choices are k=5 (tests on 80% each time) or k=10 (90%, but slower). Leave-one-out (k = n) sounds ideal but is actually noisy — a single weird test example swings each fold's score.

[FIGURE: cv_folds]

Plain k-fold is right only when your rows are independent draws from the same distribution. Step outside that and you need a different flavour.

---

**Stratified — when the classes are imbalanced.**

With a 5% positive rate, a careless random split can hand you one fold with 1% positives (too easy) and another with 9% (too hard); averaging scores from folds that are secretly different problems is misleading. **Stratified k-fold** forces every fold to hold roughly the same 5% positives. Stratify for any classification task where the positive class is under about 20%.

---

**Group — when the same subject repeats.**

Suppose you have 50,000 hospital visits from 5,000 patients, and you will deploy on *new* patients. With plain k-fold, patient 142's January visit trains the model and their June visit tests it — so the model quietly memorises patient 142 and "predicts" a patient it already knows. **Group k-fold** keeps all of one patient's visits on the same side, so the test fold is always patients the model has never seen — which is the real deployment situation.

---

**Time-series — walk forward, and mind the gap.**

On time-ordered data plain k-fold is not just rough, it is *wrong*: it lets the model train on month 10 to predict month 3. The fix is **walk-forward validation** — train on an early window, test on the next, then expand: train on [start … t], test on [t … t+1], and keep going, always keeping time in order. One subtlety most people miss: if any feature uses a rolling window (a 7-day average, say), a training row from day 89 and a test row from day 91 share raw data, because day 91's feature is built from days 85–91. So add a **purge gap** — drop the rows within one feature-window of the boundary — so the two sides never share ingredients.

---

**One honest caveat.**

Cross-validation estimates performance on *new data from the same distribution, drawn the same way.* It does not save you if the world shifts before deployment, and it cannot undo leakage baked in before the split. And if you tune hyperparameters on the very folds you then report, you have quietly cheated: trying 200 configurations and reporting the best fold score is biased upward by the search itself. The clean fix is **nested CV** — an outer loop estimates quality on data the tuning never touched, while the inner loop does the full hyperparameter search. Slower, but it is the only setup that honestly scores your whole pipeline.`,
    keyPoints: [
      `**Match the CV strategy to your deployment assumption — it is not a style choice.**\n\nPlain k-fold (k=5 or 10): rows are independent, no time order, no repeated subjects. Stratified k-fold: any imbalanced classification, so every fold keeps the same class mix. Group k-fold: the model will score entities (users, patients, stores) it has never seen, so all rows from one entity stay on one side. Walk-forward: any time-series data, always. Use the wrong one and you are measuring a deployment scenario that does not exist.`,
      `**The most common trap: plain k-fold on time-series data.**\n\nIt produces validation scores that look fine and mean nothing. The tell: CV says AUC 0.85, then it drops sharply the moment you run a proper time-ordered holdout. Always split by time for time-series, default to an expanding walk-forward window, and add a purge gap (say 7 days) between train and validation so rolling-window features cannot bleed across the boundary.`,
      `**The diagnostic: if you tuned hyperparameters and reported the best fold score, that number is inflated.**\n\nTrying 100 configurations and reporting the best one's validation score is selection bias — you implicitly fit to that partition, and the more you tried, the worse the inflation. Fix it with nested CV (search only in the inner fold) or a separate test set never touched during tuning. Quick check: retrain with the chosen settings and score on data the tuning never influenced — if it drops a lot, the bias was real.`,
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
        answer: `A`
      },
      {
        q: `A colleague argues that since you are doing hyperparameter search with Optuna and reporting the best trial's validation score, you have a proper unbiased evaluation. Explain why this is wrong.`,
        options: [
          `A) Optuna's best trial is unbiased because Bayesian optimization does not overfit to the validation set — only grid search causes selection bias`,
          `B) This is the nested CV problem — running 200 Optuna trials and reporting the best trial's validation AUC is upward-biased by selection; unbiased evaluation requires either nested CV (hyperparameter search in inner fold only) or a completely separate test set never touched during optimization`,
          `C) The evaluation is correct if the validation set is large enough — selection bias from Optuna only matters with small datasets below 10,000 samples`,
          `D) Optuna handles this automatically through its pruning mechanism — trials that overfit to the validation set are pruned before they can inflate the reported score`,
        ],
        answer: `B`
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
    summary: `An NLP intent classifier scores **94% accuracy**. The product team is ready to ship. Before you sign off, you pull 200 of its mistakes and actually read them. The breakdown is stark: 67% are short 3-word commands ("turn on light"), 18% are code-switching (Spanish phrases mixed into English), 12% are negations ("don't turn on"). The model looks great on paper and fails on exactly the inputs your core users send most. That single accuracy number hid all of it.

That is what **error analysis** is for: turning "the model has 6% error" into "the model fails on 3-word commands, and here is why." The aggregate metric tells you a problem *exists*; error analysis tells you *which* group has it, *what kind* it is, and *what will fix it*.

[FIGURE: error_slices]

---

**The five steps.**

1. **Sample the errors — but not uniformly.** Sort by confidence and look hardest at the *high-confidence* mistakes (the model said 0.95, the truth was the opposite). Those are not noise; they are the model confidently doubling down on a wrong pattern, and it will keep doing it.

2. **Tag each error by cause.** A bad training label? Not enough signal for this input type? A rare pattern with too few examples? Or genuine ambiguity that humans disagree on too? Drop every error into a bucket.

3. **Count each bucket** — both its error rate and how many of the total errors it accounts for.

4. **Prioritise by impact × feasibility.** A bucket that is 30% of your errors with a known fix beats one that is 5% with a mysterious cause. And weight by *cost*, not just frequency: those 12% negation errors, where the assistant does the exact opposite of what a user asked, may hurt far more than a mangled 3-word command.

5. **Trace to root cause.** Is it a *data* gap (no examples of this type), a *feature* gap (the model cannot even represent the pattern), or a *distribution* mismatch (production looks different from training)?

---

**Why it pays off.**

Back to the classifier: two-thirds of the errors are short commands, because the model saw too few of them in training and its vocabulary came from longer queries. The fix is not a bigger model or a new architecture — it is collecting 200 labelled 3-word commands, retraining, and re-measuring that bucket's error rate. One cheap data effort clears the majority of the errors. That is the recurring lesson: systematic errors cluster by group or pattern and have targeted fixes, and collecting data for the worst bucket usually moves the metric more than any architecture change. (Errors that cluster by nothing are just irreducible noise — more data will not help those.)

And never let a high headline number end the conversation. A model that is 96% accurate but fails 100% of the time on one demographic, or a 98% spam filter that misses every email in one language, is not acceptable. Break errors down by subgroup, confidence, input length, and any business-critical slice. The aggregate metric is the *last* thing you report, not the first.`,
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
    figures: {
      error_slices: `<svg viewBox="0 0 360 170" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">94% accurate — but where do the errors live?</text>
  <g font-size="10">
    <text x="8" y="52" fill="var(--ink-low)">3-word commands</text>
    <rect x="130" y="42" width="201" height="14" rx="2" fill="var(--prime)"/><text x="337" y="53" fill="var(--ink-hi)">67%</text>
    <text x="8" y="88" fill="var(--ink-low)">code-switching</text>
    <rect x="130" y="78" width="54" height="14" rx="2" fill="var(--prime)" opacity="0.7"/><text x="190" y="89" fill="var(--ink-hi)">18%</text>
    <text x="8" y="124" fill="var(--ink-low)">negations</text>
    <rect x="130" y="114" width="36" height="14" rx="2" fill="var(--prime)" opacity="0.55"/><text x="172" y="125" fill="var(--ink-hi)">12%</text>
  </g>
  <text x="180" y="156" text-anchor="middle" fill="var(--ink-low)" font-size="9">the aggregate number hid all of this</text>
</svg>`,
    },
  },
  {
    id: 'calibration',
    interactiveId: 'calibration_curve_viz',
    title: 'Calibration & Brier Score',
    subtitle: 'Reliability diagrams, Platt scaling, isotonic regression, Brier decomposition',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['calibration', 'Brier score', 'Platt scaling', 'reliability diagram'],
    summary: `A model can rank perfectly and still lie to you. Picture a mortality-risk model with a flawless **AUC of 1.0** — it always ranks sicker patients above healthier ones. A doctor reads "90% risk" off it and prepares for the worst. But among all the patients this model stamps "90%," only 60% actually die. The *ranking* is perfect; the *number* is badly wrong. And the moment a real decision hangs on that number — a treatment, a price, an alert threshold — the wrong number costs you.

That gap has a name. **Calibration** asks: when the model says 0.9, does the thing happen 90% of the time? It is a completely separate question from *ranking* (which is what AUC measures). A model can nail one and fail the other.

[FIGURE: reliability_curve]

---

**Seeing it: the reliability diagram.**

Bucket the model's predictions (everything near 0.1, near 0.2, and so on) and, for each bucket, plot the predicted probability against the *actual* fraction that came true. A perfectly calibrated model sits on the diagonal where "predicted = actual." Points that fall *below* the diagonal mean overconfidence — the model says 0.8 for things that happen only 0.55 of the time. Modern neural networks are almost always overconfident, and it gets worse toward the high end, because they are trained with a loss that rewards confident predictions even on noisy labels.

---

**Putting a number on it: ECE and Brier.**

Two numbers summarise calibration. **ECE** (expected calibration error) is just the average gap between those buckets and the diagonal — lower is better, zero is perfect. It is handy but coarse: a low ECE can still hide bad miscalibration in one probability range, so always look at the diagram too, not only the single number.

The **Brier score** goes further. It is simply the mean squared error of the probabilities — the average of (predicted − actual)², where actual is 0 or 1. Lower is better. What makes it special is that it rolls *both* things you care about into one number: how well the model *separates* the classes (discrimination) *and* how honest its probabilities are (calibration). So a model with great AUC but poor calibration shows a good discrimination part and a bad calibration part inside its Brier score — which is exactly why a model with *lower* AUC can still have the *lower* (better) Brier score, by paying its way in calibration.

---

**Fixing it — on a separate calibration set.**

You do not usually retrain; you patch the probabilities afterward, using a held-out **calibration set** (never the training or test data). Three common tools, cheapest first. **Temperature scaling** (for neural nets): divide the logits by a single number T before the softmax — T > 1 softens overconfident outputs, and it never changes which class wins, only the probabilities. One parameter, impossible to overfit, and it fixes the most common kind of neural-net miscalibration, so try it first. **Platt scaling**: fit a small logistic curve on top of the scores — good for the smooth, one-directional miscalibration of SVMs and boosting, and it works with little data. **Isotonic regression**: fit a flexible staircase that can straighten any shape of miscalibration — more powerful, but it needs more data or it just memorises. And the rule you cannot break: fit the correction on a *separate* slice. Calibrate on training data and it is fooled by memorised outputs; calibrate on test data and you have spoiled your only honest score.`,
    keyPoints: [
      `**Calibration and ranking are different things — a model can ace one and fail the other.**\n\nRanking (AUC) asks whether riskier cases score higher than safer ones. Calibration asks whether "0.9" actually happens 90% of the time. A model that always predicts the base rate is perfectly calibrated yet useless; a model with AUC 1.0 can be 30 points overconfident. You need both, and which matters more depends on whether a real decision reads the probability itself (medical risk, pricing, fraud thresholds, or feeding another model) or only the order (top-k ranking, where calibration barely matters).`,
      `**See miscalibration with a reliability diagram; summarise it with ECE or Brier.**\n\nBucket the predictions and plot predicted probability against the actual rate — points below the diagonal mean overconfidence. ECE is the average distance from that diagonal (simple, but it can hide trouble in one range, so look at the diagram too). The Brier score — mean squared error of the probabilities — is richer: it folds discrimination and calibration into one number, which is why a model with lower AUC can still post the better (lower) Brier score by being better calibrated.`,
      `**The fix is a post-hoc patch on a separate calibration set — start with the simplest.**\n\nTemperature scaling (divide neural-net logits by one number T) is the first thing to try: it fixes typical overconfidence, cannot overfit, and never changes which class wins. Platt scaling (a small logistic curve on the scores) suits the smooth miscalibration of SVMs and boosting. Isotonic regression can fix any shape but needs more data. Whichever you pick, fit it on a held-out calibration slice — never on training or test.`,
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
        answer: `C`
      },
    ],
    takeaway: `AUC measures whether a model ranks correctly and calibration measures whether its probability estimates are honest — these are independent, so for any application where the probability output drives a real-world decision, calibration must be evaluated and fixed separately from discrimination.`,
    interactiveId: 'calibration_curve_viz',
    figures: {
      reliability_curve: `<svg viewBox="0 0 280 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:280px;font-family:var(--font-sans,sans-serif)">
  <line x1="40" y1="220" x2="240" y2="220" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="40" y1="220" x2="40" y2="20" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="140" y="248" text-anchor="middle" fill="var(--ink-low)" font-size="10">predicted probability</text>
  <text x="14" y="120" text-anchor="middle" fill="var(--ink-low)" font-size="10" transform="rotate(-90 14 120)">actual rate</text>
  <line x1="40" y1="220" x2="240" y2="20" stroke="var(--ink-low)" stroke-width="1.2" stroke-dasharray="5,4"/>
  <text x="196" y="52" fill="var(--ink-low)" font-size="9">perfect</text>
  <polyline points="60,210 100,184 140,154 180,120 220,96" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="60" cy="210" r="3.5" fill="var(--prime)"/><circle cx="100" cy="184" r="3.5" fill="var(--prime)"/><circle cx="140" cy="154" r="3.5" fill="var(--prime)"/><circle cx="180" cy="120" r="3.5" fill="var(--prime)"/><circle cx="220" cy="96" r="3.5" fill="var(--prime)"/>
  <text x="150" y="200" fill="var(--prime)" font-size="9" font-weight="700">overconfident</text>
  <text x="150" y="212" fill="var(--prime)" font-size="8">(below the line)</text>
</svg>`,
    },
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
    summary: `An A/B test runs for **2 days**. The treatment shows **+18% CTR**. The team ships it. Two weeks later, revenue is **down 4%.** What happened?

**Novelty.** People click new things just because they are new. Once the shine wears off, engagement settles back — and here, below baseline. The 2-day test ran entirely inside the novelty window, so it measured novelty, not the model. The team optimised for a signal that was never going to last.

[FIGURE: novelty_curve]

Production evaluation is the craft of measuring a model's real impact in ways that survive traps like this. The guiding rule: every ship / no-ship call should ultimately rest on a *controlled experiment*. Everything else — offline metrics, shadow mode, proxy-metric checks — exists to cheaply filter candidates so you only spend real A/B tests on the few worth it.

---

**Shadow mode first.**

Before any high-stakes launch, run the new model in **shadow mode**: it sees the same live traffic and makes predictions, but only the current champion's predictions actually reach users. This proves the serving path works under real load, catches weird output distributions, and surfaces big disagreements between the two models — all before a single user is affected. It catches the infrastructure bugs that offline testing simply cannot.

---

**Three A/B rules people keep breaking.**

1. **Run for at least two full business cycles** — a minimum of two weeks, four if the product is strongly seasonal. A 2-day win has almost certainly not outlived novelty.

2. **Fix the primary metric and required sample size *before* you start.** Glancing at results midway and stopping the moment p < 0.05 wrecks the statistics — with daily peeking at the 0.05 level, your real false-positive rate climbs to roughly 30% by day 20. If you must peek, use a sequential test built for it.

3. **Set guardrail metrics up front** — secondary numbers that are not allowed to get worse even if the main metric improves. A recommender that lifts CTR by pushing sensational content while tanking session length is worse than nothing; guardrails catch that before it ships.

---

**"Significant" is not the same as "worth it."**

A small p-value only says the effect is unlikely to be pure noise. It does not tell you the effect will *last*, that it is *big enough to matter*, or that the experiment was *run properly*. At ten million daily users, a 0.01% CTR bump hits p < 0.0001 in a single day — and that is about a thousand extra clicks. Is a whole new model to retrain, deploy, and maintain worth a thousand clicks a day? "Is this effect real?" and "Is this effect worth acting on?" are different questions, and at scale the first is almost always yes. So a trustworthy test needs all of it: random assignment (a user always in the same arm), enough time, a pre-registered metric and sample size, and guardrails watched throughout.`,
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
          `A) p < 0.0001 confirms the effect is real but does not confirm it is large enough to matter — missing: practical significance (is +1% revenue worth the deployment cost), guardrail metric checks, the confidence interval, multiple-testing correction, and whether the +1% is uniform across segments or driven by one small subgroup.`,
          `B) p < 0.05 is the correct standard — at 30 days with p = 0.0001 there really are no additional checks needed before shipping the model.`,
          `C) The confidence interval is the only thing missing — a p-value on its own does not even specify the direction of the effect.`,
          `D) The test simply should have run for 60 days — 30 days is not enough to eliminate primacy effects, regardless of how small the p-value is.`,
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
    figures: {
      novelty_curve: `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:320px;font-family:var(--font-sans,sans-serif)">
  <line x1="40" y1="170" x2="300" y2="170" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="40" y1="170" x2="40" y2="25" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="170" y="193" text-anchor="middle" fill="var(--ink-low)" font-size="10">days since launch</text>
  <text x="16" y="100" text-anchor="middle" fill="var(--ink-low)" font-size="10" transform="rotate(-90 16 100)">CTR</text>
  <!-- control: flat -->
  <line x1="40" y1="110" x2="300" y2="110" stroke="var(--ink-low)" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="248" y="104" fill="var(--ink-low)" font-size="9">control</text>
  <!-- treatment: high then decays below control -->
  <polyline points="48,45 95,62 150,88 210,112 295,132" fill="none" stroke="var(--prime)" stroke-width="2.5"/>
  <circle cx="48" cy="45" r="3.5" fill="var(--prime)"/><circle cx="295" cy="132" r="3.5" fill="var(--prime)"/>
  <text x="60" y="40" fill="var(--prime)" font-size="9" font-weight="700">treatment (new model)</text>
  <text x="150" y="160" text-anchor="middle" fill="var(--ink-low)" font-size="9">the 2-day test only saw the top-left spike</text>
</svg>`,
    },
  },
]
