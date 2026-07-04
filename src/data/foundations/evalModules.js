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

So the real first step is not choosing a metric — it is writing down what each mistake costs. In fraud, a missed fraud (FN) usually dwarfs a false alarm (FP), so you lean toward recall. In spam filtering it flips: a real email lost to the spam folder (FP) destroys trust, so you lean toward precision. In cancer screening, a missed tumor (FN) is catastrophic, so recall rules. Translate TP, FP, FN, TN into money or risk first. Every metric choice follows from that.

---

**The rest of the confusion-matrix vocabulary.**

Precision and recall look at the *positive* column, but interviewers expect the full set. **Recall** is also called **sensitivity** or the **true-positive rate (TPR)**. Its mirror on the negative side is **specificity**, or the **true-negative rate (TNR)** = TN / (TN + FP) — of all the truly-legit transactions, how many did you correctly clear? One minus specificity is the **false-positive rate (FPR)**, sometimes called **fallout** — the share of legit transactions you wrongly flagged. And **false-negative rate (FNR)** = FN / (TP + FN) = 1 − recall. Two rules of thumb: recall/TPR and FPR are the axes of the ROC curve, and specificity is the metric to quote when *correctly clearing negatives* is what matters (e.g. a screening test you don't want firing on healthy people).

---

**More than two classes: macro, micro, weighted.**

With several classes you compute precision/recall/F1 per class, then average them — and *how* you average changes the story. **Macro** averages the per-class scores equally, so a tiny class counts as much as a huge one — use it when rare classes matter. **Micro** pools all the TP/FP/FN across classes first and then computes one score, so it's dominated by the frequent classes and equals overall accuracy for single-label problems — use it when every *instance* matters equally. **Weighted** averages the per-class scores weighted by class size, a middle ground. A big macro-vs-micro gap is a signal: macro high, micro low means the model nails small classes but stumbles on the big one (or vice versa).

---

**Single numbers that survive imbalance.**

F1 ignores true negatives entirely, which is why two better summaries exist for skewed data. **Balanced accuracy** is the average of recall across classes (equivalently, the mean of sensitivity and specificity) — it doesn't reward always-predict-majority. **Matthews correlation coefficient (MCC)** uses all four boxes of the confusion matrix in one correlation-style score from −1 to +1, and is widely regarded as the most honest single number under imbalance because a model can't fake it by ignoring a class. When you need one number and the classes are skewed, prefer balanced accuracy or MCC over raw accuracy or F1.

---

**When you can only act on the top K.**

Often the real constraint is capacity, not a threshold: a fraud team reviews the top 500 alerts, a search page shows 10 results. Then the metric is **precision@K** (of the top K ranked by score, how many are truly positive) and **recall@K** (of all positives, how many landed in the top K). The model only has to get the worst cases to the *top of the list* — a global threshold is the wrong framing when the action budget is fixed.

---

**Curves beat single thresholds: ROC-AUC vs PR-AUC.**

Precision and recall are measured *at one threshold*; to summarise a model across all thresholds you use an area-under-curve. **ROC-AUC** plots TPR against FPR — but on rare-positive problems it can look flatteringly high, because a huge TN count keeps FPR tiny even when the model floods you with false positives relative to the few real positives. **PR-AUC** (precision vs recall) ignores true negatives and so exposes that failure. Rough heuristic: when positives are scarce, PR-AUC is usually the more honest summary — though it's a heuristic, not a law (PR-AUC has its own quirks under shifting prevalence).

---

**Pick the threshold on validation, freeze it, then report on test.**

One discipline ties it together. The decision threshold is a *parameter you tune*, so tune it on the **validation** set — sweep thresholds, pick the one matching your cost/precision/recall target — then **freeze** it and report final performance on the **test** set *once*. Tuning the threshold on the test set is the same sin as tuning weights on it: the reported number becomes optimistic and won't hold in production.`,
    keyPoints: [
      `**When to use it: always define your cost matrix before picking a metric.**\n\nIn fraud detection: a missed fraud (FN) costs the full transaction amount plus investigation time. A false alarm (FP) costs a customer service call and customer inconvenience. If FN costs 10x more than FP, optimize for recall ($F_\\beta$ with $\\beta = 2$ or higher). In spam filtering, FP (blocking a real email) is the catastrophic failure — optimize for precision ($\\beta < 1$). Accuracy is appropriate only when classes are roughly balanced and all errors cost the same, which is rarely true in production.`,
      `**The most common production trap: reporting F1 without asking whether FP and FN cost the same.**\n\nF1 weights precision and recall equally. On a fraud model where missing fraud costs 50x more than a false alarm, optimizing F1 will under-weight recall and leave real money on the table. Before training, write down: what does a FP cost? What does a FN cost? If those numbers differ by more than 2x, F1 is the wrong metric. $F_\\beta$ (with $\\beta$ larger when recall matters more) tilts the balance, but treat it as a rough proxy — the cleaner tool when you have real costs is to minimise expected cost directly by choosing the threshold that minimises $FP \\cdot cost_{FP} + FN \\cdot cost_{FN}$, rather than encoding the ratio into a single $\\beta$.`,
      `**The diagnostic: when your model looks suspiciously good, check whether it is predicting the majority class.**\n\nThe tell: high accuracy, recall near 0. Compute recall separately. If recall ≈ 0 on a 1% fraud dataset, the model learned to predict "not fraud" for everything and achieved 99% accuracy by doing nothing. Also check: if F1 is decent but all FPs come from the same subgroup, you have a slice-level failure the aggregate metric is hiding. Disaggregate by segment before declaring the model ready.`,
      `**Know the full vocabulary and the right single number under imbalance.**\n\nRecall = sensitivity = TPR; specificity = TNR = TN/(TN+FP); FPR (fallout) = 1 − specificity; FNR = 1 − recall — TPR and FPR are the ROC axes. For multiclass, macro averages classes equally (rare classes count), micro pools instances first (frequent classes dominate, equals accuracy for single-label), weighted sits between. And since F1 ignores true negatives, prefer balanced accuracy (mean of per-class recall) or MCC (uses all four cells, −1 to +1) as the honest single summary on skewed data.`,
      `**Match the summary to how you'll act, and tune the threshold on validation only.**\n\nWhen action is capacity-limited (review top 500, show top 10), optimise precision@K / recall@K — the model just needs the worst cases at the top. To compare models across thresholds use an AUC, and prefer PR-AUC to ROC-AUC when positives are rare (ROC-AUC's huge TN count hides false-positive floods) — a heuristic, not a law. Critically, the decision threshold is a tuned parameter: sweep it on the validation set, freeze it, then report on test once. Tuning the threshold on test inflates the number exactly like tuning weights on test.`,
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
      {
        q: `On a 2%-positive dataset, two summary metrics disagree: ROC-AUC is 0.94 (looks great) but PR-AUC is 0.31 (looks poor). Which do you trust and why?`,
        options: [
          `A) Trust ROC-AUC — it is the standard metric and 0.94 means the model ranks positives above negatives well, so PR-AUC must be miscomputed.`,
          `B) Trust PR-AUC here. With only 2% positives, the enormous true-negative count keeps FPR tiny, so ROC-AUC stays high even while the model produces many false positives per true positive. PR-AUC ignores true negatives and exposes that, making it the more honest summary for rare positives.`,
          `C) Average the two into a single 0.63 score, since neither is reliable alone on imbalanced data and the mean cancels their biases.`,
          `D) Neither — on imbalanced data only raw accuracy is trustworthy, so discard both AUC metrics and report accuracy instead.`,
        ],
        answer: `B`
      },
      {
        q: `You sweep the decision threshold, find the value that maximises F1 on your test set, and report that F1 as the model's performance. What is wrong?`,
        options: [
          `A) Nothing — the threshold is a hyperparameter, and choosing it to maximise F1 on the test set is exactly how you should report best-case performance.`,
          `B) You should have maximised accuracy instead of F1; the threshold choice is fine but the metric is wrong.`,
          `C) The threshold is a tuned parameter, so choosing it on the test set makes the reported F1 optimistic — it won't hold in production. Tune the threshold on a validation set, freeze it, then report on the untouched test set once. It's the same leakage as tuning weights on test.`,
          `D) F1 can't be used with a swept threshold at all; only fixed-threshold metrics like accuracy are valid after threshold selection.`,
        ],
        answer: `C`
      },
    ],
    takeaway: `Before picking any classification metric, write down the cost of a FP and the cost of a FN — every metric choice follows from that ratio, and skipping that step is how teams end up optimizing the wrong number for months.`,
    recap: [
      `**Accuracy lies on imbalanced data:** a model that predicts "not fraud" for every transaction scores 99% accuracy on a 1%-fraud dataset while catching zero frauds (recall 0). Accuracy blends four different outcomes into one number the majority class dominates — to understand a classifier you must pull those four apart.`,
      `**The confusion matrix is TP / FP / FN / TN, and the four don't cost the same:** TP = caught fraud, FP = false alarm (a customer's card blocked for nothing), FN = missed fraud (the bank eats the loss), TN = correctly cleared. A false alarm annoys; a missed fraud loses real money — accuracy pretends they're interchangeable.`,
      `**Precision and recall each measure a different way to fail:** precision = TP/(TP+FP) = when the model shouts "fraud," how often is it right (low → drowning in false alarms); recall = TP/(TP+FN) = of all real frauds, how many you caught (low → fraud slipping past). They trade off via the threshold — raise it and precision climbs while recall falls.`,
      `**F1 blends them but assumes they matter equally:** F1 = 2PR/(P+R), the *harmonic* mean, which punishes lopsided scores (P=0.9, R=0.1 → F1=0.18, not 0.5). **F-beta** tilts by cost — $F_\\beta = (1+\\beta^2)PR/(\\beta^2 P + R)$, where β>1 favours recall, β<1 favours precision.`,
      `**Write the cost matrix first — every metric choice follows from it:** translate TP/FP/FN/TN into money or risk before picking a metric. Fraud: a missed fraud dwarfs a false alarm → lean recall. Spam: a lost real email destroys trust → lean precision. Skipping this step is how teams optimize the wrong number for months.`,
      `**Know the full vocabulary:** recall = sensitivity = TPR; specificity = TNR = TN/(TN+FP); FPR (fallout) = 1 − specificity; FNR = 1 − recall. TPR and FPR are the ROC axes; quote specificity when correctly clearing negatives is what matters (a screening test you don't want firing on healthy people).`,
      `**Under imbalance prefer balanced accuracy or MCC over F1** (F1 ignores true negatives; MCC uses all four cells, −1 to +1, and can't be faked by ignoring a class). Use **precision@K / recall@K** when action is capacity-limited (review top 500, show top 10). And **tune the threshold on validation, freeze it, then report on test once** — tuning it on test inflates the number exactly like tuning weights on test.`,
    ],
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

One last thing to hold onto: AUC of either kind is a *threshold-independent* summary, so it tells you nothing about the specific cutoff you will actually run. AUC is for *choosing the model*; setting the threshold is a separate business decision driven by your cost matrix. Pick the model with AUC; pick the operating point with costs.

---

**Partial AUC: sometimes only one corner matters.**

Full AUC averages ranking quality over *every* threshold — including regions you'd never operate in. In fraud or medical screening you only ever run at very low FPR (you cannot flag 40% of legit traffic), so ranking performance in the high-FPR region is irrelevant, yet full AUC rewards it. **Partial AUC** restricts the area to the FPR range you actually care about (say FPR < 0.05), giving a score that reflects the operating region instead of a whole-curve average. When two models tie on full AUC, partial AUC in your real operating band often separates them.

---

**AUC says nothing about calibration.**

A crucial blind spot: AUC is a *pure ranking* score, so a model can have a superb AUC and badly wrong probabilities. Multiply every predicted probability by 0.5 and the ranking — and therefore the AUC — is unchanged, but every probability is now a lie. So if you use the probability itself (pricing, expected value, a downstream model), AUC is not enough; check calibration separately with a reliability diagram and the Brier score. High AUC, good calibration is what "trustworthy probabilities" requires.

---

**When ROC curves cross, one AUC hides two stories.**

AUC collapses a whole curve to one number, so two models with the *same* AUC can have **crossing** ROC curves — model A better in the low-FPR region, model B better in the high-recall region. The single AUC averages that away. If your operating point is low-FPR, you want model A even if its total AUC is slightly lower. Always look at the curves in your operating band, not just the scalar.

---

**Average precision is not exactly trapezoidal PR-AUC.**

A subtle library gotcha: sklearn's \`average_precision_score\` and \`auc(recall, precision)\` are *not* the same number. **Average precision (AP)** is a weighted mean of precision values, weighted by the increase in recall at each threshold — a step-wise summary that avoids the optimistic interpolation that trapezoidal area under the PR curve can introduce. When someone reports "PR-AUC," check whether they mean AP (usually what sklearn gives) or trapezoidal area; the two can differ meaningfully on small data.

---

**Precision moves with prevalence — the formula.**

This is why the same model can look fine offline and terrible in production. Precision is tied to the base rate: with prevalence π, TPR, and FPR,

$\\text{precision} = \\dfrac{\\pi \\cdot TPR}{\\pi \\cdot TPR + (1-\\pi)\\cdot FPR}$

The ROC curve (TPR vs FPR) doesn't change when prevalence shifts — but precision does, dropping as positives get rarer. So a model validated at 5% fraud can post far worse precision when live fraud falls to 1%, with identical ROC-AUC. Always recompute expected precision at the *production* base rate.

---

**Multiclass AUC.**

AUC is binary by construction, so for K classes you extend it. **One-vs-rest (OvR)** computes each class's AUC against all others and averages (macro or weighted). **One-vs-one (OvO)** averages AUC over every pair of classes and is more robust to imbalance. sklearn's \`roc_auc_score\` supports both via \`multi_class='ovr'/'ovo'\`; name which one you used, since the averaging choice changes the number.`,
    keyPoints: [
      `**ROC-AUC or PR-AUC? It comes down to whether the negatives are rare or common.**\n\nUse ROC-AUC when the classes are roughly balanced, or when getting the negatives right genuinely matters (like credit scoring, where correctly approving good applicants counts, not just catching defaulters). Use PR-AUC when negatives massively outnumber positives — fraud, disease screening, anomaly detection — because there the ocean of true negatives inflates the FPR denominator and makes ROC-AUC look better than it really is. Rule of thumb: if your positive class is under about 10% of the data, reach for PR-AUC.`,
      `**The trap: shipping a model with a great AUC on rare-positive data, then watching the alert queue overflow.**\n\nAUC = 0.91 on a 1%-fraud dataset can sit right next to precision = 0.17 at the threshold you actually deploy — the ROC curve looked fine only because true negatives flooded the FPR denominator. Always check precision at your intended recall before calling a model ready. If you need 80% recall and precision there is 15%, the model is not production-ready no matter what AUC says.`,
      `**The habit: AUC picks the model, the cost matrix picks the threshold.**\n\nAfter comparing models by AUC or PR-AUC, choose your deployment threshold by plotting the precision-recall trade-off and finding the point your costs demand. A concrete check: at 80% recall, how many alerts per day does that produce? If your team can handle 200 and the model would fire 2,000, the threshold has to move regardless of AUC. AUC told you which model; the costs tell you where to run it.`,
      `**AUC is a ranking score — blind to calibration, blind to your operating region, and blind to prevalence shift.**\n\nScaling every probability by 0.5 leaves AUC unchanged but makes the probabilities lies, so check calibration (reliability diagram, Brier) separately when you use the probability itself. Full AUC averages over thresholds you'd never run — use partial AUC in your real FPR band, and inspect the curves directly since two models with equal AUC can have crossing ROC curves (one wins at low FPR, the other at high recall). And precision = π·TPR / (π·TPR + (1−π)·FPR): the ROC doesn't move with prevalence but precision does, so recompute expected precision at the production base rate.`,
      `**Mind the library and multiclass details.**\n\nsklearn's average precision (a recall-weighted mean of precision) is not identical to trapezoidal PR-AUC and avoids its optimistic interpolation — so confirm which "PR-AUC" someone means. For K classes, AUC extends via one-vs-rest (each class vs the rest, averaged) or one-vs-one (every pair, more robust to imbalance); state which averaging you used because it changes the number. Treat the "positives < 10% → use PR-AUC" rule as a helpful heuristic, not a law — PR-AUC has its own quirks under shifting prevalence and isn't universally superior.`,
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
      {
        q: `Your model validated at 5% fraud prevalence with ROC-AUC 0.95 and precision 0.60 at the deployed threshold. In production, live fraud has fallen to 1%. What happens to ROC-AUC and precision, and why?`,
        options: [
          `A) Both drop proportionally, because every metric scales with the base rate of the positive class.`,
          `B) ROC-AUC stays about the same (TPR and FPR don't depend on prevalence), but precision falls — from precision = π·TPR/(π·TPR + (1−π)·FPR), a smaller π shrinks the numerator while the false positives from the large negative pool grow, so the same model produces a worse precision at 1% than at 5%. Recompute expected precision at the production base rate.`,
          `C) ROC-AUC rises because rarer positives are easier to rank, and precision rises too since there are fewer positives to get wrong.`,
          `D) Neither changes — ROC-AUC and precision are both threshold- and prevalence-independent summaries of the model.`,
        ],
        answer: `B`
      },
      {
        q: `You're building a fraud screen that can only ever operate at FPR below 5% (you can't block more legit traffic than that). Two models tie on full ROC-AUC. What's the sharper way to compare them?`,
        options: [
          `A) Compare full ROC-AUC again with more decimal places — the tie will resolve at higher precision.`,
          `B) Compare partial AUC restricted to the FPR < 0.05 region (or precision at your target low-FPR operating point). Full AUC averages over high-FPR thresholds you'll never use, so it can hide that one model is clearly better in the band you actually run — inspect the curves there, since equal-AUC models can cross.`,
          `C) Pick whichever model has the higher accuracy at threshold 0.5, since that's the standard operating point.`,
          `D) They're genuinely equivalent — identical full AUC means identical ranking everywhere, so choose either.`,
        ],
        answer: `B`
      },
    ],
    takeaway: `ROC-AUC denominates FPR with true negatives, so on imbalanced datasets it is structurally optimistic — switch to PR-AUC when your positive class is rare, and always set a concrete operating threshold from your cost matrix before shipping.`,
    recap: [
      `**The ROC curve tries every threshold at once:** plot TPR (recall — fraction of frauds caught) up the side against FPR (fraction of legit wrongly flagged) along the bottom, sweeping all thresholds. Random guessing gives the diagonal (AUC 0.5); a perfect model hugs the top-left (AUC 1.0).`,
      `**AUC is a pure ranking score with a clean probabilistic meaning:** AUC = P(model scores a random real positive above a random real negative). AUC 0.91 means it ranks a random fraud above a random legit transaction 91% of the time — which is why it ignores your threshold entirely. It equals the normalized Mann-Whitney U statistic.`,
      `**Rare positives quietly fool ROC-AUC:** FPR = FP/(FP+TN), and on imbalanced data that TN is enormous (9,900 legit per 100 fraud), so even 500 false alarms give FPR ≈ 0.05 — the curve sits in the top-left, AUC 0.91 — while precision is only 100/(100+500) = 0.17. Six of every seven alerts are wrong.`,
      `**When positives are under ~10%, use PR-AUC:** precision-recall curve plots precision vs recall and never touches TN, so it exposes the false-alarm floods ROC-AUC hides. It's a heuristic, not a law — PR-AUC has its own quirks under shifting prevalence.`,
      `**AUC picks the model; the cost matrix picks the threshold:** AUC is threshold-independent, so it says nothing about the specific cutoff you'll run. Choose the model by AUC, then set the operating point by plotting the precision-recall trade-off against your costs — at 80% recall, how many alerts/day does that make?`,
      `**AUC is blind to calibration:** it's pure ranking, so multiply every predicted probability by 0.5 and the AUC is unchanged while every probability is now a lie. If you use the probability itself (pricing, expected value, a downstream model), check calibration separately (reliability diagram, Brier score).`,
      `**Precision moves with prevalence — the formula:** precision = $\\pi\\cdot TPR / (\\pi\\cdot TPR + (1-\\pi)\\cdot FPR)$. The ROC (TPR vs FPR) doesn't move when prevalence shifts, but precision drops as positives get rarer — a model validated at 5% fraud posts worse precision when live fraud falls to 1%, at identical ROC-AUC. Use partial AUC in your operating FPR band, and state OvR vs OvO for multiclass since the averaging changes the number.`,
    ],
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

There is no single best ranking metric — the right one mirrors real behavior. If users scan a vertical list and stop at the first hit, use **MRR**. If they expect to find all the relevant results and would be annoyed to see any buried, use **MAP**. If you have graded labels and care about exact ordering, use **NDCG**. And if every shown slot is equally prominent regardless of order — a grid of products, a row of ad slots — plain **Precision@K** is fine. Pick by what the interface makes people do, not by which formula looks most impressive.

---

**Retrieval's own metrics: recall@K and hit-rate@K.**

Big systems rank in two stages — a cheap **candidate generator** pulls a few hundred items from millions, then an expensive **ranker** orders them. These stages need different metrics. For retrieval the question isn't "is the order perfect?" but "did we even *retrieve* the relevant items into the candidate set?" That's **recall@K** (of all relevant items, how many made it into the top K) and **hit-rate@K** (did at least one relevant item land in the top K). A ranker can't fix what retrieval never surfaced, so you measure recall@K on the generator and NDCG/MAP on the ranker — diagnosing the wrong stage is a classic mistake.

---

**Relevance isn't the only goal.**

Pure relevance metrics miss things a real recommender must balance. **Coverage** — what fraction of the catalog ever gets shown (a system that only recommends the top 100 items starves the long tail). **Diversity** — are the top results varied, or ten near-duplicates? **Novelty / serendipity** — does it surface things the user wouldn't have found alone, not just the obvious? **Freshness** — new content shown before it goes stale. **Creator fairness** — is exposure spread across creators or concentrated? A model that maxes NDCG by always showing the same popular items can quietly wreck coverage and diversity, and the business notices even though the relevance metric looks great.

---

**The elephant: position bias in click labels.**

If your relevance labels come from *clicks*, they're contaminated. The item at position 1 gets more clicks **because it was shown first**, not because it's more relevant — so training or evaluating on raw clicks teaches the model to reproduce the old ranking's position effects rather than true relevance, a self-reinforcing loop. The fixes are their own field: **inverse-propensity weighting** to down-weight clicks that only happened due to position, **interleaving** (blend two rankers' results and see which gets clicked, which cancels position bias), and **counterfactual evaluation**. Never treat click data as clean relevance.

---

**Metric@K: K is a product decision.**

NDCG@1, @3, @10, @50 answer *different* questions, and K should match how the interface is actually used. NDCG@1 is for "I feel lucky" single-answer surfaces; NDCG@10 for a first page of ten; NDCG@50 for a scroll-heavy feed or a candidate pool feeding a downstream reranker. Set K to the viewport and session behaviour, not to a default — reporting NDCG@10 for a mobile screen that shows three results is measuring the wrong thing.

---

**Ties and unjudged documents.**

Two practical hazards. **Ties** (items with equal score) make the metric depend on arbitrary tiebreak order — resolve them deterministically or you'll see phantom metric swings. And **unjudged ≠ irrelevant**: with millions of documents, only a pooled subset gets human labels, so a genuinely relevant document nobody judged is scored 0 by default, penalising a new system that surfaces it. This **pooling bias** is why a better retriever can look worse offline; judge the novel results before trusting the comparison.

---

**You can't optimise these metrics directly.**

A final subtlety interviewers probe: NDCG, MAP, and MRR are based on *sorting*, which is not differentiable, so you can't gradient-descend on them directly. Ranking models therefore optimise a **surrogate loss** — pairwise (learn "A should rank above B," as in RankNet/LambdaRank) or listwise (score the whole list, as in ListNet) — that correlates with the target metric while being differentiable. LambdaMART's trick is to weight those pairwise gradients by their NDCG impact, getting a ranking-aware signal without needing NDCG to be differentiable.`,
    keyPoints: [
      `**Match the metric to the user's behavior, not to mathematical elegance.**\n\nGraded labels and position matters (commercial search)? Use NDCG. User wants one answer and stops at the first hit (question-answering, lookups)? Use MRR. Every shown slot equally prominent regardless of order (a product grid, an ad row)? Use Precision@K. Choose the wrong one and you optimise a proxy that does not track the real experience — NDCG@10 can even climb while MRR falls, if the model improves positions 4–10 while making position 1 worse.`,
      `**The trap: judging against an incomplete set of relevance labels.**\n\nRaters can only score a small pool of documents out of millions. If that pool was built from the old system's top results, a new system that surfaces genuinely relevant documents nobody ever judged will see them scored as "not relevant" by default — so it looks worse on NDCG even though it found better results. When a change is big (a new retrieval or ranking model), judge the new system's novel results before comparing scores.`,
      `**The diagnostic: look at NDCG@1 versus NDCG@10 separately.**\n\nIf NDCG@10 is healthy but NDCG@1 is much lower, the relevant results are in the top ten but the best one is not landing first — your re-ranking is the bottleneck, not retrieval. If NDCG@1 and NDCG@10 are both low and roughly equal, the relevant documents are not even in the candidate set — retrieval is the bottleneck. The split tells you which stage to go fix.`,
      `**Measure the right stage with the right metric, and don't trust raw click labels.**\n\nCandidate generation is judged by recall@K / hit-rate@K (did the relevant items make it into the pool?), the ranker by NDCG/MAP — diagnosing the wrong stage wastes weeks. Set K to the actual viewport (NDCG@1/@3/@10/@50 answer different product questions). And clicks are position-biased: the top slot gets clicks because it was shown first, so debias with inverse-propensity weighting, interleaving, or counterfactual evaluation before treating clicks as relevance.`,
      `**Relevance isn't the whole story, and you can't optimise these metrics directly.**\n\nBalance NDCG against coverage, diversity, novelty/serendipity, freshness, and creator fairness — a model that maxes relevance by always showing the same popular items wrecks the catalog and long tail. Handle ties deterministically and remember unjudged ≠ irrelevant (pooling bias makes a better retriever look worse offline). Since NDCG/MAP/MRR rely on non-differentiable sorting, ranking models train on pairwise (RankNet/LambdaRank) or listwise (ListNet) surrogate losses — LambdaMART weights pairwise gradients by NDCG impact to stay ranking-aware.`,
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
      {
        q: `A new retrieval model surfaces documents the old system never showed, and offline NDCG comes out lower than the old model. What is the likely explanation before you conclude the new model is worse?`,
        options: [
          `A) The new model is simply worse — a lower NDCG on the same labeled test set is definitive, so revert to the old model.`,
          `B) Pooling bias: the relevance labels were pooled from the old system's results, so the new model's genuinely relevant but never-judged documents default to "not relevant" and are scored 0. That drags NDCG down unfairly. Judge the new system's novel results before comparing — unjudged is not the same as irrelevant.`,
          `C) The new model has a bug in its tie-breaking, which is the only thing that can lower NDCG when better documents are retrieved.`,
          `D) NDCG can't be compared across models at all, so the lower number is meaningless and you should use accuracy instead.`,
        ],
        answer: `B`
      },
      {
        q: `An interviewer asks: "Why can't you train a ranking model by directly minimising 1 − NDCG with gradient descent?"`,
        options: [
          `A) You can — NDCG is smooth and differentiable, so 1 − NDCG is a perfectly standard loss and most rankers use it directly.`,
          `B) Because NDCG is bounded in [0, 1], and gradient descent only works on unbounded losses; you'd have to rescale it first.`,
          `C) NDCG depends on the sorted order of items, and sorting is a step function — a tiny change in scores either doesn't change the ranking (zero gradient) or flips two items (a discontinuous jump), so NDCG has no useful gradient. Rankers optimise a differentiable surrogate instead: pairwise losses (RankNet/LambdaRank) or listwise losses (ListNet), with LambdaMART weighting pairwise gradients by NDCG impact.`,
          `D) NDCG can only be computed with human graded labels, which aren't available during training, so there's simply nothing to differentiate.`,
        ],
        answer: `C`
      },
    ],
    takeaway: `All ranking metrics embed a model of user attention — MRR says users stop after the first hit, MAP says they care about every relevant item equally, NDCG says attention decays with position and highly relevant results matter more — so choosing the metric is choosing which user behaviour you believe, not which formula is standard.`,
    recap: [
      `**Any metric that ignores position is useless for search/recsys:** relevant results at positions 1, 3, 7 score the same "3 of 10" as results buried at 8, 9, 10 — but nobody reads past the first couple. The whole family is built on one idea: a relevant result near the top is worth far more than the same result near the bottom.`,
      `**MRR = 1/rank of the *first* relevant result:** position 1 → 1.0, position 3 → 0.33, averaged across queries. It fits when the user has one need and stops at the first good answer (fact lookup, FAQ, "just take me to X") — wrong the moment users want several relevant results.`,
      `**MAP rewards finding them all, and early:** walk down the list, note precision-so-far at each relevant hit, average those, divide by total relevant. For relevant at 1, 3, 7 (three total): (1/3)(1/1 + 2/3 + 3/7) ≈ 0.70. Needs only binary yes/no labels, so it's cheap to collect.`,
      `**NDCG is the industry standard because it adds *graded* relevance:** each result contributes $(2^{grade}-1)$ gain (a perfect hit counts far more than a so-so one) discounted by $\\log_2(pos+1)$, divided by the ideal ordering's score for a 0–1 number comparable across queries. Use it when you have graded human judgments and exact ordering matters.`,
      `**Match the metric to user behaviour, not to which formula looks impressive:** scan-and-stop → MRR; expect to find all relevant items → MAP; graded labels + care about order → NDCG; every shown slot equally prominent (a product grid, an ad row) → plain **Precision@K**.`,
      `**Two stages need two different metrics:** a cheap candidate generator is judged by recall@K / hit-rate@K (did the relevant items even reach the candidate set?), the expensive ranker by NDCG/MAP — a ranker can't fix what retrieval never surfaced, so diagnosing the wrong stage wastes weeks.`,
      `**Watch three traps:** click labels are position-biased (top slot gets clicks because it was shown first — debias with IPW, interleaving, or counterfactual eval); pure relevance ignores coverage/diversity/novelty/freshness/creator-fairness (maxing NDCG by always showing popular items wrecks the catalog); and NDCG/MAP/MRR rely on non-differentiable sorting, so rankers train on pairwise (RankNet/LambdaRank) or listwise (ListNet) surrogates — LambdaMART weights pairwise gradients by NDCG impact.`,
    ],
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

[FIGURE: signal_fade]

---

**The habit that keeps you honest.**

A strong offline result is a *hypothesis*, not a verdict. Models can overfit the evaluation set itself — lifting offline NDCG while making the real experience worse — for instance by memorising which items were in the historical judgment pool. So treat every offline win as "promising, let's test it," never as "done." Two guardrails make offline numbers trustworthy: split your data by *time* (train on the past, test on the most recent window, never a random shuffle across all dates), and shadow-deploy the new model on live traffic before the A/B test to catch distribution shift before it costs you anything.

---

**The deepest reason they diverge: causal vs observational.**

Here's the framing that ties it together. An **A/B test randomises** users to treatment or control, so the difference in outcomes is a clean **causal** estimate of the model's effect — randomisation cancels out confounders. **Offline logs are observational**: they were generated by the *old* model's policy, so they're **policy-biased** — you only ever observed outcomes for the items the old system chose to show. Evaluating a new policy on data collected under a different policy is comparing apples to a biased sample of oranges. That's why offline evaluation of a policy that behaves differently from the logging policy is fundamentally hard, and why the A/B test is the gold standard: it's the only step that actually manipulates the variable and measures the effect.

---

**Primary metric versus guardrails.**

Never judge an experiment on one number. Define a **primary metric** (the thing you're trying to move, e.g. CTR) plus a set of **guardrail metrics** you refuse to harm — retention, complaint rate, latency, diversity, revenue quality, unsubscribes. The classic failure: CTR goes up 3% (ship it!) while 90-day retention quietly drops and revenue-per-session falls because the model learned to bait clicks. A win on the primary metric that breaks a guardrail is not a win. List the guardrails *before* the test so you can't rationalise afterward.

---

**Experiment design: power, MDE, duration, peeking.**

A test can mislead by being badly designed. **Statistical power** and **minimum detectable effect (MDE)** set how big a sample you need — underpowered tests exaggerate the effect size of the "wins" that happen to reach significance (winner's curse). **Duration** must cover full weekly cycles (weekday/weekend differ) and outlast **novelty effects** (users click a new thing just because it's new, then stop) and **seasonality**. **Peeking** — checking the p-value repeatedly and stopping when it crosses 0.05 — inflates false positives massively; use a fixed horizon or sequential-testing corrections. And running many metrics or many variants is **multiple testing**: correct for it or you'll "find" significance by chance.

---

**Fixing offline logs: IPS and its sharp edges.**

You can partly de-bias offline log evaluation with **inverse propensity scoring** — weight each logged outcome by 1/P(the old policy showed this item), which corrects the exposure bias. But IPS is fragile: it has **high variance** (a tiny propensity makes 1/p explode), needs accurate **propensity estimates** (often unknown and hard to model), and requires **overlap/support** (the new policy can only be evaluated where the old policy had some chance of showing the same items). Variants like **self-normalised IPS (SNIPS)** and **doubly-robust** estimators reduce the variance, but none fully rescue you when propensities are extreme — which is exactly when you fall back to an actual A/B test.

---

**Interleaving and bandits: where each fits.**

**Interleaving** blends two rankers' results into one list and sees which side gets the clicks — it cancels between-user variance and needs far fewer users, but it measures *relative ranking preference*, not absolute business impact, and gets tricky with personalisation, ads, hard constraints, or session-level outcomes. **Bandits** adaptively route more traffic to the better arm, minimising regret — but that adaptivity makes the allocation **endogenous**, so you can't read off a clean causal effect the way a fixed-split A/B test gives you, and delayed feedback further complicates them. Use interleaving for cheap ranking comparisons, bandits when minimising regret matters more than a clean estimate, and A/B tests when you need the rigorous causal number.`,
    keyPoints: [
      `**Shadow-deploy before A/B test — run the new model in parallel, log its predictions, evaluate on fresh offline data with matching timestamps. This catches distribution shift before it costs traffic.**\n\nFor the recommendation model: in shadow mode, the new model receives the same production requests as the live model and generates predictions, but only the live model's predictions are served. Log the new model's recommendations and the live outcomes. Evaluate the new model's offline NDCG on data from the past 2 weeks — not data from 6 months ago. If shadow-mode NDCG is lower than training-set NDCG, the model has distribution shift. Investigate before running any A/B test. Shadow mode also validates serving infrastructure under real load before any user is exposed to the new model.`,
      `**Trap: using past user interactions as ground truth for future predictions without temporal splitting. Users who clicked item X in January might have completely different preferences in April. Time-stamp your train/test split.**\n\nFor the recommendation model: train on months 1–9, evaluate on month 10. Evaluate on month 10 data only, using only items and users present in month 10. The alternative — a random 80/20 split across all months — lets the model train on August data to predict March clicks. August preferences contaminate the March predictions. Temporal splitting is non-negotiable for any system where item relevance changes over time, which is most recommendation and search systems.`,
      `**Diagnostic: measure the Spearman rank correlation between offline metric deltas and online metric deltas across your last 10 model launches. If the correlation is < 0.5, your offline metric is a poor proxy — redesign the offline evaluation before investing in further model development.**\n\nFor the recommendation team: collect the log of all model launches from the past year. For each launch, record the offline NDCG delta (new vs previous model) and the realized A/B CTR delta. Compute Spearman ρ. If ρ < 0.5, offline NDCG is not reliably predictive of CTR. Consider redesigning the offline evaluation: use more recent evaluation data, add temporal evaluation windows, add session-level signals beyond clicks, or use debiased click labels via Inverse Propensity Scoring.`,
      `**An A/B test is causal; offline logs are observational and policy-biased — and one primary metric is never enough.**\n\nRandomisation makes the A/B difference a clean causal effect; offline logs only recorded outcomes for what the old policy chose to show, so evaluating a different policy on them is biased. Always pair a primary metric with guardrails (retention, complaints, latency, diversity, revenue quality) defined before the test — CTR up while retention drops is not a win. IPS can partly de-bias offline logs but has high variance under small propensities, needs accurate propensities and overlap, and even SNIPS/doubly-robust don't fully rescue extreme cases.`,
      `**Design the experiment properly and pick the right online tool.**\n\nSet sample size from power and MDE (underpowered tests exaggerate winners), run across full weekly cycles past novelty and seasonality, and don't peek — repeated significance checks inflate false positives, so fix the horizon or use sequential corrections, and adjust for multiple metrics/variants. Interleaving is a cheap, low-variance ranking comparison but measures relative preference, not absolute impact; bandits minimise regret but their adaptive, endogenous allocation blocks a clean causal estimate. Use A/B tests when you need the rigorous causal number.`,
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
      {
        q: `You want to evaluate a new ranking policy offline using logged data from the current production model, applying inverse propensity scoring (IPS). What is the main risk and a partial fix?`,
        options: [
          `A) There is no real risk — IPS gives an unbiased estimate of the new policy from logged data, so it fully replaces the need for an A/B test.`,
          `B) IPS has high variance: when the logging policy showed some item with very low probability, the 1/p weight explodes and a single record dominates the estimate. It also needs accurate propensities and overlap (the new policy can only be evaluated where the old one had some chance of showing the same items). Self-normalised IPS or doubly-robust estimators reduce the variance, but extreme propensities still force a real A/B test.`,
          `C) The main risk is that IPS is too slow to compute on large logs; the fix is to subsample the data before applying it.`,
          `D) IPS only works for classification, not ranking, so the fix is to convert the ranking problem into a binary click-prediction task first.`,
        ],
        answer: `B`
      },
      {
        q: `A PM checks the A/B dashboard every morning and wants to call the test the moment CTR crosses p < 0.05. Why is this a problem, and what else should be in place?`,
        options: [
          `A) It's fine — stopping as soon as p < 0.05 is the fastest way to ship wins and wastes no traffic.`,
          `B) Repeatedly checking and stopping at the first p < 0.05 is peeking: each look is another chance for noise to cross the line, so the false-positive rate is far above 5%. Fix the sample size in advance from a power/MDE calculation (or use a sequential-testing method), run across full weekly cycles to survive novelty and seasonality, and check guardrail metrics — not just the primary — before declaring a win.`,
          `C) The only problem is the time of day; checking in the afternoon instead of the morning removes the bias.`,
          `D) Peeking is harmless for CTR because click metrics have low variance; it only matters for revenue metrics.`,
        ],
        answer: `B`
      },
    ],
    takeaway: `Offline metrics measure how well a model predicts past behavior under a past policy — so the offline-online gap is systematic, not random, and the right response is to measure the offline-online correlation empirically on your own system before trusting any offline improvement as evidence that the model improved.`,
    recap: [
      `**Offline measures how well a model predicts the *past*; online measures how real users respond *now*:** a holdout built from six-month-old logs measures the wrong world, which is why offline NDCG can jump 0.79→0.82 while the shipped model's CTR drops 3%.`,
      `**Three structural gaps drive them apart:** distribution shift (preferences, catalog, context drift), proxy labels (a click on clickbait that bounced isn't satisfaction, but NDCG counts it a win), and feedback loops (once live, the model shapes the very data it's next trained on).`,
      `**The offline→online correlation is weak — usually ρ ≈ 0.3–0.7 — and the signal fades at every hop** (5% NDCG → maybe 2% CTR → maybe 1% revenue). Measure it on *your own* system across the last ten A/B tests; if it's below ~0.5, redesigning evaluation beats tuning the model again.`,
      `**An A/B test is causal; offline logs are observational and policy-biased:** randomisation cancels confounders, so the A/B difference is a clean causal effect. Offline logs only recorded outcomes for what the *old* policy chose to show, so evaluating a different policy on them compares apples to a biased sample of oranges — the A/B is the gold standard.`,
      `**Pair a primary metric with guardrails defined *before* the test:** CTR up 3% while 90-day retention drops and revenue-per-session falls is not a win. List the guardrails (retention, latency, complaints, diversity, revenue quality) up front so you can't rationalise afterward.`,
      `**Design the experiment properly:** size it from power and MDE (underpowered tests exaggerate the wins that reach significance — winner's curse), run across full weekly cycles past novelty and seasonality, don't peek (repeated significance checks inflate false positives — fix the horizon or use sequential corrections), and correct for multiple metrics/variants.`,
      `**Know the online-eval tools:** IPS de-biases offline logs (weight by 1/P(old policy showed it)) but has high variance under tiny propensities and needs overlap — SNIPS/doubly-robust help but don't rescue extreme cases; interleaving is a cheap, low-variance *relative* ranking comparison (not absolute impact); bandits minimise regret but their adaptive allocation is endogenous, blocking a clean causal estimate.`,
    ],
    figures: {
      signal_fade: `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">The signal fades at every hop</text>
  <rect x="20" y="40" width="150" height="46" rx="4" fill="var(--prime)" opacity="0.22" stroke="var(--prime)" stroke-width="1.2"/>
  <text x="95" y="60" text-anchor="middle" fill="var(--ink-hi)" font-size="13" font-weight="700">+5%</text>
  <text x="95" y="77" text-anchor="middle" fill="var(--ink-low)" font-size="8.5">offline NDCG (a hypothesis)</text>
  <rect x="105" y="102" width="150" height="42" rx="4" fill="var(--teal)" opacity="0.22" stroke="var(--teal)" stroke-width="1.2"/>
  <text x="180" y="121" text-anchor="middle" fill="var(--ink-hi)" font-size="12" font-weight="700">+2%</text>
  <text x="180" y="137" text-anchor="middle" fill="var(--ink-low)" font-size="8.5">online CTR (A/B, causal)</text>
  <rect x="190" y="160" width="150" height="34" rx="4" fill="var(--amber)" opacity="0.22" stroke="var(--amber)" stroke-width="1.2"/>
  <text x="265" y="176" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">+1%</text>
  <text x="265" y="189" text-anchor="middle" fill="var(--ink-low)" font-size="8.5">revenue</text>
  <path d="M100 86 L165 100" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#sfarrow)"/>
  <path d="M185 144 L250 158" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#sfarrow)"/>
  <text x="308" y="120" fill="var(--ink-low)" font-size="8.5">rho ~ 0.3-0.7</text>
  <defs><marker id="sfarrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
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

For every feature, ask: *would this exact value exist at the moment of prediction in production, knowing nothing about future events?* If the answer is no, it is leakage — full stop. And a few red flags should trigger an immediate audit: validation AUC above 0.97 on a problem where even human experts disagree; one feature towering over all the others in importance; train and validation accuracy nearly identical with no gap; or a mediocre model suddenly looking brilliant right after you added one new feature group.

[FIGURE: leakage_timeline]

---

**Preprocessing leaks too — fit everything on the training fold only.**

Leakage isn't just about features you engineer; it hides in *preprocessing*. Any step that *learns something from the data* — a StandardScaler's mean and variance, an imputer's fill values, a PCA's components, feature selection, SMOTE oversampling, target encoding — must be **fit on the training fold only**, then *applied* to validation/test. Fit your scaler on the whole dataset before splitting and the training rows already "know" the test set's statistics. The clean fix is a scikit-learn **Pipeline** that bundles every transform with the model, so cross-validation re-fits the whole chain inside each fold and leakage becomes structurally impossible.

---

**The fuller leakage taxonomy.**

Beyond temporal, group, and label leakage, name the rest: **train-test contamination** (a preprocessing step or a duplicate bleeds test info into train); **duplicate / near-duplicate leakage** (the same row, or an augmented copy, in both splits); **proxy leakage** (a feature that's an innocent-looking stand-in for the label, like a customer-ID range that encodes signup cohort); **post-outcome features** (computed after the event you're predicting); **aggregation-window leakage** (a rolling average whose window reaches past the prediction time); and **survivorship bias** (training only on entities that survived — e.g. still-active accounts — so the model never sees the ones that churned/failed).

---

**Three timestamps, not one.**

"When is this feature available?" is really three questions. The **event timestamp** (when the thing happened), the **feature-computation timestamp** (when your pipeline calculated it), and the **data-availability timestamp** (when the value was actually queryable in production). A value can *exist* historically but not have been *available* at decision time — a label confirmed a week later, a nightly-batch feature not ready until 2am. Point-in-time correctness means joining features as of their **availability** timestamp, not their event timestamp. Feature stores exist largely to get this join right.

---

**Real systems need group and time splits together.**

The splits aren't mutually exclusive. A fraud or churn system usually needs **both**: hold out *future* data (temporal) *and* make sure a held-out user's rows never appear in training (group). A pure temporal split can still leak a user's identity across the cutoff; a pure group split can still let the model peek at the future. The split you choose should mirror the production question — new users, new sessions, new transactions, or future events — and often that's a combined group-plus-time holdout.

---

**Negative controls: sanity tests that catch leaks.**

A few cheap experiments smoke out leakage. **Shuffle the labels** and retrain — a properly-built model should collapse to chance; if it still scores well, a feature is leaking the label. **Compare a random split against a temporal split** — a big gap means temporal leakage. **Drop the top suspicious feature** — if AUC craters from 0.97 to 0.75, that feature was carrying the leak. **Train on future-only features** as a deliberate check of what's genuinely available. These controls turn "I have a bad feeling" into evidence.

---

**How leakage shows up in production.**

Leakage often isn't caught offline at all — it surfaces after deploy. The signatures: an **offline-online collapse** (0.97 validation, 0.64 live), a **null-rate spike** on a feature that turns out to be unavailable at serving time, **feature-freshness** violations (a value that was instant offline takes hours to compute live), or a top feature that simply *can't be computed* in the real-time path. Monitoring these in production is your last line of defence when the offline audit misses a leak.`,
    keyPoints: [
      `**When to audit for leakage: any time validation looks too good to be true.**\n\nRed flags: AUC above 0.95 on a problem where domain experts only manage 70–80%; a single feature with far higher importance than all the others (can it even be known at prediction time?); train and validation accuracy within a point or two of each other with no regularisation (the test set is probably contaminated); or AUC jumping ten-plus points right after you add one new feature group (check that group's causal link to the label).`,
      `**The most common trap: target encoding computed on the full dataset before the split.**\n\nTarget encoding replaces a category with the average outcome for that category. Compute those averages over the whole dataset (test rows included) and each test row's feature now carries information from its own label — a direct leak. Fix: compute the encodings out-of-fold (each row encoded using only the other folds), or wrap it in a scikit-learn Pipeline inside cross-validation. It is easy to miss because the code looks completely innocent.`,
      `**The diagnostic: for every feature, ask whether its value would exist at the exact moment of prediction.**\n\nFor each feature, write down what data it uses, when that data becomes available, and whether that is before or after the prediction time. Any feature whose data only arrives after the prediction moment is leakage. You can do this whole audit in a spreadsheet. Inheriting a model? Check its top five features by importance and confirm each one passes the timestamp test.`,
      `**Preprocessing leaks too, and the taxonomy is bigger than three types.**\n\nAnything that learns from data — scaler, imputer, PCA, feature selection, SMOTE, target encoding — must be fit on the training fold only; wrap it in a scikit-learn Pipeline so CV re-fits it inside each fold. Beyond temporal/group/label, watch for duplicate/near-duplicate leakage, proxy features (an ID range encoding cohort), post-outcome features, aggregation-window leakage (a rolling window reaching past prediction time), and survivorship bias. And distinguish three timestamps — event, feature-computation, and data-availability — joining features as of *availability* (what point-in-time feature-store joins enforce).`,
      `**Mirror production in the split, prove it with negative controls, and monitor after deploy.**\n\nReal systems often need a combined group-plus-time holdout (future data AND unseen users), matched to the production question (new user/session/transaction/event). Catch leaks with negative controls: shuffle labels (a clean model drops to chance), compare random vs temporal split (a gap = temporal leak), and drop the top suspicious feature (a crater = it carried the leak). Leakage frequently surfaces only in production — an offline-online collapse, a feature null-rate spike, a freshness violation, or a top feature that can't be computed in the serving path — so monitor these as the last line of defence.`,
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
      {
        q: `You fit StandardScaler and SelectKBest on the full dataset, then run 5-fold cross-validation on the transformed data and get a great score. Why is the score optimistic, and what's the fix?`,
        options: [
          `A) It's not optimistic — scaling and feature selection are deterministic transforms, so fitting them before CV has no effect on the score.`,
          `B) Both the scaler (mean/variance) and SelectKBest (which features to keep) learned from the entire dataset, including the rows that later act as validation folds — so every fold's "held-out" data already influenced the preprocessing. Wrap the scaler, selector, and model in a scikit-learn Pipeline and pass that to cross_val_score, so all transforms are re-fit on each fold's training portion only.`,
          `C) The problem is only SelectKBest; scaling is safe to fit on the full dataset because it doesn't use the labels.`,
          `D) The fix is to use 10 folds instead of 5, which dilutes the leakage enough to make the score trustworthy.`,
        ],
        answer: `B`
      },
      {
        q: `You suspect a churn model with AUC 0.96 has a leak but can't spot the feature. Which negative control most directly confirms leakage?`,
        options: [
          `A) Retrain with a larger max_depth — if AUC rises further, there's no leak.`,
          `B) Shuffle the labels randomly and retrain: a correctly-built model should collapse to ~0.5 AUC because there's no real signal left. If it still scores well above chance, a feature is carrying label information — a leak. Pair this with a random-vs-temporal split comparison and dropping the top feature to localise it.`,
          `C) Add more training data — if AUC stays at 0.96, the model is fine and there's no leak.`,
          `D) Switch from AUC to accuracy — if accuracy is also high, the 0.96 is validated and no leak exists.`,
        ],
        answer: `B`
      },
    ],
    takeaway: `Data leakage is a data engineering error, not a modeling error — the fix is upstream in feature computation, and the single question that catches most leakage is whether each feature value would exist at the exact moment of prediction in production with no knowledge of future events.`,
    recap: [
      `**Leakage = future or outcome information sneaking into features** — a feature like "average return over the next 7 days" reads the answer straight off, giving 95% validation and 2% production. A normal train/test split doesn't catch it because both halves are contaminated the same way.`,
      `**Temporal leakage — peeking at the future:** a random split of time-ordered data lets some training rows come from *after* the test rows' prediction time. Fix with a strict time cutoff — every feature built only from data that existed before that row's prediction moment; train on the past, test on the future.`,
      `**Group leakage — the same subject on both sides:** patient/user 142's January visit trains the model and their June visit tests it, so it memorises habits that won't exist for brand-new subjects at deployment. Fix by splitting by group — all of one subject's rows go entirely to one side.`,
      `**Label leakage — right time, wrong causal direction:** the feature has a valid timestamp but is a *consequence* of the outcome, not a cause ("days in ICU" only exists because the patient was hospitalised). The audit isn't "when was it computed?" but "does it come before or after the outcome in the causal chain?"`,
      `**The one question that catches almost everything:** would this exact value exist at the moment of prediction in production, knowing nothing about future events? If no, it's leakage. Red flags: AUC > 0.97 where experts disagree, one feature towering over all others, no train/val gap, or a mediocre model suddenly brilliant after one new feature group.`,
      `**Preprocessing leaks too — fit on the training fold only:** anything that *learns* from data (StandardScaler's mean/variance, imputer fills, PCA components, feature selection, SMOTE, target encoding) must be fit on train and applied to val/test. Wrap it all in a scikit-learn Pipeline so CV re-fits the whole chain inside each fold and leakage becomes structurally impossible.`,
      `**Real systems need group + time together, proven with negative controls, monitored in prod:** hold out future data AND unseen users, matched to the production question. Confirm with negative controls (shuffle labels → a clean model collapses to chance; compare random vs temporal split → a gap means temporal leak; drop the top feature → a crater means it carried the leak). Leakage often surfaces only after deploy — an offline-online collapse, a feature null-rate spike, a freshness violation — so monitor these as the last line of defence.`,
    ],
    figures: {
      leakage_timeline: `<svg viewBox="0 0 360 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">One question: does the value exist before prediction time?</text>
  <line x1="20" y1="150" x2="340" y2="150" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="30" y="168" fill="var(--ink-low)" font-size="9">past</text>
  <text x="315" y="168" fill="var(--ink-low)" font-size="9">future</text>
  <line x1="200" y1="34" x2="200" y2="162" stroke="var(--amber)" stroke-width="1.6" stroke-dasharray="4,3"/>
  <text x="200" y="30" text-anchor="middle" fill="var(--amber)" font-size="9" font-weight="700">prediction time</text>
  <rect x="40" y="46" width="140" height="20" rx="4" fill="var(--teal)" opacity="0.55"/>
  <text x="110" y="60" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5">valid feature (built from past)</text>
  <rect x="40" y="74" width="250" height="20" rx="4" fill="#ef4444" opacity="0.4"/>
  <text x="110" y="88" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5">"return over next 7 days"</text>
  <text x="248" y="88" text-anchor="middle" fill="#ef4444" font-size="8.5" font-weight="700">reaches into future = LEAK</text>
  <rect x="40" y="102" width="130" height="20" rx="4" fill="#ef4444" opacity="0.4"/>
  <text x="105" y="116" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5">"days in ICU" (after outcome)</text>
  <text x="180" y="196" text-anchor="middle" fill="var(--ink-low)" font-size="9">valid = fully left of the line · any bar crossing right = leakage</text>
</svg>`,
    },
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

Cross-validation estimates performance on *new data from the same distribution, drawn the same way.* It does not save you if the world shifts before deployment, and it cannot undo leakage baked in before the split. And if you tune hyperparameters on the very folds you then report, you have quietly cheated: trying 200 configurations and reporting the best fold score is biased upward by the search itself. The clean fix is **nested CV** — an outer loop estimates quality on data the tuning never touched, while the inner loop does the full hyperparameter search. Slower, but it is the only setup that honestly scores your whole pipeline.

---

**When the folds themselves are noisy: repeated k-fold.**

On small datasets a single 5-fold split is still one arbitrary partition — shuffle the rows differently and the estimate moves. **Repeated k-fold** runs the whole k-fold procedure several times with different random shuffles and averages, shrinking the variance of the estimate. It costs more compute but gives a steadier number when data is scarce or fold scores are unstable (like the [0.83, 0.84, 0.92, 0.85, 0.83] case where one fold is an outlier).

---

**When you need both balance and isolation: stratified group k-fold.**

Stratified k-fold keeps the class ratio; group k-fold keeps entities together — but real problems often need *both*. Imbalanced medical data with multiple visits per patient wants every fold to hold the same rare-disease rate **and** never split a patient across folds. **Stratified group k-fold** does both at once. It's an approximation (you can't always satisfy both perfectly), but it's the right tool when you have imbalance and repeated subjects together — a very common combination.

---

**Rolling versus expanding windows.**

Walk-forward comes in two flavours, and the choice is about drift. An **expanding window** always trains on *all* history up to time t — more data, better when the relationship is stable. A **rolling (sliding) window** trains only on the most *recent* fixed span, deliberately forgetting old data — better under strong concept drift, where ancient patterns actively mislead. Rule of thumb: expanding by default, rolling when the world changes fast enough that stale data hurts more than it helps.

---

**Nested CV estimates the pipeline, not the final model.**

A subtlety people miss: nested CV gives you an unbiased estimate of your *model-selection procedure's* quality — but the model you actually ship is usually **retrained on all available training data** using the hyperparameters that procedure chose. Nested CV answers "how good is my process," not "here's the exact model." So report the nested-CV score as your honest performance estimate, then retrain on everything for deployment. Don't confuse the two.

---

**Fold scores aren't independent — mean ± std isn't a confidence interval.**

Reporting mean ± std across folds is useful, but treat it carefully: the folds **overlap in training data** (each pair of 5-fold training sets shares most of their rows), so the fold scores are correlated, not independent draws. That means the naive standard error understates the true uncertainty, and the std across folds is *not* a valid 95% confidence interval. Use it as a rough spread and an instability flag, not as a rigorous statistical bound.

---

**Stratifying regression and multi-label targets.**

Stratification isn't only for single-label classification. For **regression**, stratify on *binned* target values so each fold spans the full range (otherwise one fold can get all the cheap houses). For **multi-label** problems, use iterative/multi-label stratification that balances each label's distribution across folds. Naive random splitting can leave a rare label almost absent from some folds, making those folds unrepresentative.`,
    keyPoints: [
      `**Match the CV strategy to your deployment assumption — it is not a style choice.**\n\nPlain k-fold (k=5 or 10): rows are independent, no time order, no repeated subjects. Stratified k-fold: any imbalanced classification, so every fold keeps the same class mix. Group k-fold: the model will score entities (users, patients, stores) it has never seen, so all rows from one entity stay on one side. Walk-forward: any time-series data, always. Use the wrong one and you are measuring a deployment scenario that does not exist.`,
      `**The most common trap: plain k-fold on time-series data.**\n\nIt produces validation scores that look fine and mean nothing. The tell: CV says AUC 0.85, then it drops sharply the moment you run a proper time-ordered holdout. Always split by time for time-series, default to an expanding walk-forward window, and add a purge gap (say 7 days) between train and validation so rolling-window features cannot bleed across the boundary.`,
      `**The diagnostic: if you tuned hyperparameters and reported the best fold score, that number is inflated.**\n\nTrying 100 configurations and reporting the best one's validation score is selection bias — you implicitly fit to that partition, and the more you tried, the worse the inflation. Fix it with nested CV (search only in the inner fold) or a separate test set never touched during tuning. Quick check: retrain with the chosen settings and score on data the tuning never influenced — if it drops a lot, the bias was real.`,
      `**Reach for the right variant, and read fold spread honestly.**\n\nRepeated k-fold shrinks estimate variance on small/unstable data; stratified group k-fold handles imbalance and repeated subjects together; expanding windows use all history (stable world) while rolling windows keep only recent data (strong drift). Stratify regression on binned targets and multi-label with iterative stratification so no fold misses a rare label. And every learned transform (scaler, imputer, selector, encoder, SMOTE) must be fit inside each fold via a Pipeline — fitting before CV leaks.`,
      `**Know what nested CV estimates and that folds aren't independent.**\n\nNested CV gives an unbiased estimate of your model-selection *procedure*; the shipped model is then retrained on all training data with the chosen hyperparameters, so report the nested score but don't mistake it for the exact deployed model. And because k-fold training sets overlap heavily, fold scores are correlated — mean ± std is a useful spread and instability flag but not a valid confidence interval, so don't treat the std as a rigorous statistical bound.`,
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
      {
        q: `You have 3 years of daily sales data and strong seasonality/drift, and must forecast the next quarter. Between an expanding window and a rolling window for walk-forward CV, how do you choose?`,
        options: [
          `A) Always use an expanding window — more training data is strictly better, so rolling windows are never the right choice.`,
          `B) It depends on drift: an expanding window trains on all history (best when the underlying relationship is stable and more data helps), while a rolling window keeps only the recent span and deliberately forgets old data (best under strong concept drift, where stale patterns actively mislead). With strong drift here, a rolling window is often the better fit — and validate both.`,
          `C) Use whichever gives the higher validation score, since the window type is purely a performance knob with no assumptions attached.`,
          `D) Neither — with seasonality you must use standard k-fold so every season appears in training, and window type is irrelevant.`,
        ],
        answer: `B`
      },
      {
        q: `You run nested CV and get an outer-loop estimate of 0.86 AUC. What model do you actually deploy, and what does the 0.86 represent?`,
        options: [
          `A) Deploy the single best inner-fold model from the outer fold that scored highest, and 0.86 is that model's exact production performance.`,
          `B) The 0.86 is an unbiased estimate of your whole model-selection procedure's quality, not of one specific model. For deployment you retrain on all available training data using the hyperparameters the procedure selects, and report 0.86 as the honest expected performance — the process is what was evaluated, the retrained-on-everything model is what ships.`,
          `C) Deploy nothing — nested CV is only a diagnostic and cannot produce a deployable model.`,
          `D) Average the weights of all outer-fold models into one ensemble and deploy that; 0.86 is that ensemble's guaranteed score.`,
        ],
        answer: `B`
      },
    ],
    takeaway: `Every CV strategy embeds an assumption about deployment — pick the wrong one and you are evaluating a scenario that does not exist, which is why walk-forward is mandatory for time-series and group k-fold is mandatory whenever new entities appear at inference time.`,
    recap: [
      `**A single split has high variance — k-fold averages many:** one 80/20 split can land on easy examples (87%) and mislead your tuning (deploy → 79%). k-fold cuts the data into k groups, trains on k−1 and tests on the held-out one, rotates, and averages — every example tested once, a far steadier estimate. k=5 (test on 80%) or k=10 (90%, slower); leave-one-out is actually noisy (one weird example swings each fold).`,
      `**Stratified — for imbalanced classes:** at a 5% positive rate a careless split can hand you one fold with 1% positives and another with 9% — secretly different problems. Stratified k-fold forces each fold to hold roughly the same class ratio; use it for any classification under ~20% positive.`,
      `**Group — when the same subject repeats and you deploy on new entities:** plain k-fold lets patient 142's January visit train and their June visit test, so the model memorises a patient it already knows. Group k-fold keeps all of one entity's rows on one side, so test folds are always unseen entities — the real deployment situation.`,
      `**Time-series → walk-forward, and mind the gap:** plain k-fold on time-ordered data is *wrong* (trains on month 10 to predict month 3). Train on [start…t], test on [t…t+1], expand, always keeping time in order. Add a **purge gap** — drop rows within one feature-window of the boundary — so a 7-day rolling feature can't share raw data across the split.`,
      `**Expanding vs rolling window is a call about drift:** an expanding window trains on *all* history (more data, better when the relationship is stable); a rolling window keeps only the recent span and deliberately forgets old data (better under strong concept drift, where stale patterns mislead). Expanding by default, rolling when the world changes fast.`,
      `**Tuning on the folds you then report is cheating:** trying 200 configs and reporting the best fold score is biased upward by the search itself. Fix with **nested CV** — an outer loop estimates quality on data the tuning never touched while the inner loop does the full hyperparameter search.`,
      `**Nested CV scores the *procedure*, not the shipped model:** it gives an unbiased estimate of your model-selection process; the deployed model is retrained on *all* training data with the chosen hyperparameters, so report the nested score but don't confuse it for the exact model. And because k-fold training sets overlap heavily, fold scores are correlated — mean ± std is a useful spread and instability flag, not a valid confidence interval.`,
    ],
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

And never let a high headline number end the conversation. A model that is 96% accurate but fails 100% of the time on one demographic, or a 98% spam filter that misses every email in one language, is not acceptable. Break errors down by subgroup, confidence, input length, and any business-critical slice. The aggregate metric is the *last* thing you report, not the first.

---

**Small slices lie — check the support before you react.**

The most common error-analysis mistake is over-reacting to a tiny slice. "Group X has 40% error!" means nothing if group X has 5 examples — that's 2 errors, pure noise. Always report the **slice size** alongside its error rate, put a **confidence interval** on the rate (a 40% error on n=5 might really be anywhere from 5% to 85%), and set a **minimum-support threshold** (say, ignore slices under 30–50 examples) before drawing conclusions. A large slice with a modestly elevated error rate usually matters more than a tiny slice with a scary-looking one.

---

**The sharper root-cause taxonomy.**

"Data / feature / distribution" is a good start, but name the fuller set so you can match a fix to each: **label noise** (the ground truth is wrong), **data scarcity** (too few examples of this pattern), **distribution shift** (production differs from training), **feature blindness** (the inputs can't even represent the distinction), **annotation ambiguity** (humans genuinely disagree, so no model can be "right"), a **preprocessing bug** (a pipeline error corrupts this slice), or a **threshold/calibration issue** (the model ranks fine but the cutoff is wrong for this group). Each points to a different fix — collecting more data won't cure a calibration bug or annotation ambiguity.

---

**Slice false positives and false negatives separately.**

Don't lump all errors together — **FPs and FNs usually have different causes and different costs.** In fraud, the FNs (missed fraud) might cluster in a new merchant category while the FPs (false alarms) cluster in high-velocity legitimate users — two unrelated problems needing two different fixes. And their business costs differ (a missed fraud vs an annoyed customer). Always build the error breakdown twice, once for each error type.

---

**From notebook to monitor.**

Error analysis shouldn't be a one-time notebook exercise you do before launch and forget. The slices you discover — 3-word commands, code-switching, new merchant categories — should become **monitored production slices**, tracked continuously so you catch when a slice's error rate creeps up after deploy. A finding that lives only in a notebook decays; a finding wired into monitoring keeps paying off.

---

**The human side: labels and adjudication.**

When errors trace to *annotation ambiguity*, the fix is a labeling process, not a model change. Measure **inter-annotator agreement** — if two humans disagree on a slice, the model can't be blamed for missing it. Set up an **adjudication** step for disputed cases, **update the labeling guidelines** to resolve the ambiguity, and accept that some errors are "**ambiguous but acceptable**" — genuinely reasonable answers the rigid label just didn't credit. Not every error is a bug.

---

**Prove the fix with a counterfactual check, and prioritise with the real formula.**

Before claiming a fix works, run an **ablation**: remove the suspicious feature, or add the targeted data, or apply the augmentation — then compare the *slice* metric before and after, not just the aggregate. And prioritise slices with more than a raw error count: **impact = slice volume × error rate × cost per error × fix feasibility.** A big, expensive, easily-fixed slice beats a small, cheap, mysterious one — the count of total errors alone will point you at the wrong work.`,
    keyPoints: [
      `**Always stratify errors by confidence level first — high-confidence wrong predictions (model says 0.95 positive, it is negative) indicate systematic bias, not random noise. These are your priority.**\n\nFor the intent classifier: sample 100 errors. Group them into confidence buckets: errors where model confidence was 0.5–0.7, 0.7–0.9, and 0.9–1.0. High-confidence errors in the 0.9–1.0 bucket are the model doubling down on a wrong pattern — a systematic feature or data problem. Low-confidence errors near 0.5 are boundary cases where the model is appropriately uncertain. Fix the high-confidence bucket first. In sklearn: sort errors by abs(predicted_prob - 0.5) descending, inspect the top 30. They will cluster by a specific pattern almost every time.`,
      `**Trap: sampling errors uniformly and concluding that common categories matter most. A rare error category that happens to affect high-value users or safety-critical decisions matters more than a common category that does not. Weight by business impact, not frequency.**\n\nFor the intent classifier: 12% of errors are negation patterns ("don't turn on"). This seems small. But those are the errors where the assistant does the opposite of what was asked — a user explicitly said not to do something and the system did it anyway. The business impact of acting on a negation error is catastrophically higher than misclassifying a benign 3-word utterance. Prioritize by cost(error type) × frequency(error type), not frequency alone. The cost matrix is a business decision, not a modeling decision.`,
      `**Diagnostic: if error categories do not have obvious fixes, you have a data gap — collect 200 examples from the hardest category and retrain. This typically moves more metric than any architectural change.**\n\nFor the intent classifier: code-switching errors (Spanish phrases in English queries) represent 18% of all errors. The model has almost no Spanish-English mixed examples in training. The fix is not a larger model or a better architecture — it is 200 labeled code-switching examples added to the training set. Retrain. Measure the category error rate on a held-out slice of code-switching examples. If it drops from 60% to 20%, the data gap was the problem. If it stays high, there is a feature representation problem. Data collection is cheaper than architecture search and should come first.`,
      `**Check slice support, name the real root cause, and slice FP/FN separately.**\n\nDon't react to a 40%-error slice of 5 examples — report slice size, a confidence interval on the rate, and a minimum-support threshold before concluding. Match the fix to the real cause: label noise, data scarcity, distribution shift, feature blindness, annotation ambiguity, preprocessing bug, or threshold/calibration issue — more data won't cure a calibration bug or genuine ambiguity. And build the breakdown twice, once for false positives and once for false negatives, since they usually have different causes and costs.`,
      `**Wire findings into monitoring, handle the human side, and prove fixes counterfactually.**\n\nTurn discovered slices into continuously-monitored production slices rather than one-off notebook findings. When errors trace to annotation ambiguity, fix the labeling process — measure inter-annotator agreement, adjudicate disputes, update guidelines, accept "ambiguous but acceptable" errors. Before claiming a fix, ablate (remove feature / add data / augment) and compare the slice metric before vs after. Prioritise by impact = slice volume × error rate × cost per error × fix feasibility, not raw error count.`,
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
      {
        q: `In your error slicing, one segment shows a 45% error rate versus 8% overall — but that segment has only 6 examples. What's the right move?`,
        options: [
          `A) Treat it as the top-priority failure immediately — a 45% error rate is nearly 6x the baseline, so it's clearly the biggest problem.`,
          `B) With n=6, a 45% error rate is 2-3 errors and the confidence interval is enormous (roughly 12%–80%) — it may be pure noise. Report the slice size, put a CI on the rate, and apply a minimum-support threshold before acting; gather more examples from that segment before concluding anything. Prioritise larger slices with reliable elevated rates first.`,
          `C) Delete those 6 examples from the dataset, since a segment that small can't be modeled reliably anyway.`,
          `D) Immediately collect 200 examples for that segment and retrain — small-but-high-error slices always indicate a data gap.`,
        ],
        answer: `B`
      },
      {
        q: `You've decided which error slice to fix first. Which prioritisation best reflects real-world impact?`,
        options: [
          `A) Rank slices purely by the raw count of errors in each — the slice with the most total errors is always the one to fix first.`,
          `B) Rank by error rate alone — the slice where the model is most often wrong is the highest priority regardless of anything else.`,
          `C) Prioritise by impact = slice volume × error rate × cost per error × fix feasibility. This weighs how many users hit the slice, how often it fails, how costly each failure is, and how tractable the fix is — so a large, expensive, easily-fixed slice outranks a small, cheap, mysterious one, which raw error count would get wrong.`,
          `D) Always fix whichever slice the loudest stakeholder complains about, since business alignment matters more than any metric.`,
        ],
        answer: `C`
      },
    ],
    takeaway: `Aggregate metrics tell you that a problem exists — error slicing by confidence, subgroup, and input type tells you which specific subpopulation has the problem — and targeting 200 examples of the hardest error category almost always moves more metric than any architectural change.`,
    recap: [
      `**The aggregate metric says a problem *exists*; error analysis says *which* group has it, *what kind*, and *what fixes it*.** A 94%-accurate classifier can fail on exactly the inputs core users send most (3-word commands, code-switching, negations) — the single number hides all of it.`,
      `**Five steps:** (1) sample errors non-uniformly, favouring *high-confidence* mistakes; (2) tag each by cause (bad label, no signal, rare pattern, genuine ambiguity); (3) count each bucket's error rate and share of total; (4) prioritise by impact × feasibility; (5) trace to root cause (data gap, feature gap, or distribution mismatch).`,
      `**High-confidence errors are systematic bias, not noise:** when the model says 0.95 and the truth is the opposite, it's confidently doubling down on a wrong pattern and will keep doing it. Sort errors by |predicted − 0.5| descending, inspect the top ~30 — they cluster by a specific pattern almost every time. Fix these first.`,
      `**Weight by cost, not frequency:** 12% negation errors ("don't turn on" → the assistant does the opposite) can hurt far more than 67% of mangled benign commands. Prioritise by cost(error type) × frequency, and the cost is a business decision, not a modeling one.`,
      `**A data gap usually beats an architecture change:** if two-thirds of errors are short commands the model rarely saw in training, collecting 200 labelled 3-word commands and retraining clears most of the errors — cheaper and higher-impact than a bigger model. (Errors that cluster by nothing are irreducible noise; more data won't help those.)`,
      `**Small slices lie — check support before reacting:** "group X has 40% error!" is meaningless if X has 5 examples (2 errors, a CI from ~5% to 85%). Report slice size, put a confidence interval on the rate, and set a minimum-support threshold (~30–50) before drawing conclusions. A large slice with a modestly elevated rate usually matters more than a tiny scary one.`,
      `**Slice FP and FN separately, wire findings into monitoring, prioritise with the real formula:** FPs and FNs usually have different causes and costs (missed fraud clusters in a new merchant category; false alarms in high-velocity legit users) so build the breakdown twice. Turn discovered slices into monitored production slices, and prioritise by impact = slice volume × error rate × cost per error × fix feasibility — not raw error count.`,
    ],
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

You do not usually retrain; you patch the probabilities afterward, using a held-out **calibration set** (never the training or test data). Three common tools, cheapest first. **Temperature scaling** (for neural nets): divide the logits by a single number T before the softmax — T > 1 softens overconfident outputs, and it never changes which class wins, only the probabilities. One parameter, impossible to overfit, and it fixes the most common kind of neural-net miscalibration, so try it first. **Platt scaling**: fit a small logistic curve on top of the scores — good for the smooth, one-directional miscalibration of SVMs and boosting, and it works with little data. **Isotonic regression**: fit a flexible staircase that can straighten any shape of miscalibration — more powerful, but it needs more data or it just memorises. And the rule you cannot break: fit the correction on a *separate* slice. Calibrate on training data and it is fooled by memorised outputs; calibrate on test data and you have spoiled your only honest score.

---

**The Brier decomposition, by its actual terms.**

We said Brier folds two things together — here they are precisely. The Murphy decomposition splits it into three: **Brier = reliability − resolution + uncertainty**. **Reliability** is the calibration error (how far predictions sit from the true rate in their bucket) — you want it *low*. **Resolution** is how much the predictions vary from the base rate and correctly separate outcomes (discrimination) — you want it *high*, and it's *subtracted*. **Uncertainty** is the irreducible difficulty set by the base rate, which no model controls. The critical consequence: a **lower Brier does not always mean better calibration** — it can drop purely because *resolution* improved (better discrimination) while calibration stayed the same or worsened. So don't read Brier as a pure calibration metric; it mixes calibration, discrimination, and base-rate difficulty. sklearn warns about exactly this.

---

**ECE's fine print.**

ECE is more fragile than its single number suggests. It depends heavily on **bin count** (10 bins vs 20 gives different ECE) and bin placement; **empty or tiny bins** make the estimate noisy; **equal-width bins** waste resolution when predictions cluster (fixable with **adaptive/equal-count binning**). And in multiclass you must choose *what* to measure: **top-label ECE** (is the confidence in the predicted class honest?) versus **classwise ECE** (is every class's probability honest?) — they answer different questions and can disagree. Always pair ECE with the reliability diagram so a small number can't hide localised miscalibration.

---

**Calibrating more than two classes.**

Multiclass calibration is genuinely harder. The one-vs-rest approach fits **one calibrator per class**, but then the per-class probabilities no longer sum to 1 and need **renormalising**. You also decide between calibrating the **top label** only versus **classwise** (every class), and you inspect **classwise reliability diagrams** rather than one curve. Temperature scaling is popular here precisely because scaling all logits by a single T keeps the softmax normalised and sidesteps the renormalisation headache.

---

**Model-specific miscalibration patterns.**

Different models miscalibrate in characteristic directions. **Random forests** are pushed *away* from 0 and 1 by tree-averaging (a truly-positive case rarely gets every tree to vote yes), giving a **sigmoid**-shaped reliability curve — under-confident at the extremes. **Modern neural networks** are commonly **overconfident** (curve sags below the diagonal), though this is a tendency, not a universal law — it depends on architecture, loss, and regularisation. Knowing your model's usual distortion tells you which correction shape to expect.

---

**Calibration decays after deployment — monitor it.**

Calibration measured at launch is not permanent. **Covariate shift** (the input mix moves) and **base-rate shift** (the positive rate changes) both break it even when the original test calibration looked perfect. So calibration is something to **monitor** in production — track ECE/reliability over time and, crucially, *by cohort*: time window, geography, device, and segment, since a model well-calibrated overall can be badly off for a subgroup whose prevalence shifted.

---

**Calibration is not thresholding.**

Keep the two steps separate. **Calibration** makes the probability *truthful* (0.7 means 70%). **Thresholding** picks the *decision cutoff* that turns a probability into an action, chosen from costs and capacity. They're related — an honest probability makes the threshold meaningful and transferable across contexts — but distinct: you calibrate so the number can be trusted, *then* threshold so the decision is optimal. Fixing one does not fix the other.`,
    keyPoints: [
      `**Calibration and ranking are different things — a model can ace one and fail the other.**\n\nRanking (AUC) asks whether riskier cases score higher than safer ones. Calibration asks whether "0.9" actually happens 90% of the time. A model that always predicts the base rate is perfectly calibrated yet useless; a model with AUC 1.0 can be 30 points overconfident. You need both, and which matters more depends on whether a real decision reads the probability itself (medical risk, pricing, fraud thresholds, or feeding another model) or only the order (top-k ranking, where calibration barely matters).`,
      `**See miscalibration with a reliability diagram; summarise it with ECE or Brier.**\n\nBucket the predictions and plot predicted probability against the actual rate — points below the diagonal mean overconfidence. ECE is the average distance from that diagonal (simple, but it can hide trouble in one range, so look at the diagram too). The Brier score — mean squared error of the probabilities — is richer: it folds discrimination and calibration into one number, which is why a model with lower AUC can still post the better (lower) Brier score by being better calibrated.`,
      `**The fix is a post-hoc patch on a separate calibration set — start with the simplest.**\n\nTemperature scaling (divide neural-net logits by one number T) is the first thing to try: it fixes typical overconfidence, cannot overfit, and never changes which class wins. Platt scaling (a small logistic curve on the scores) suits the smooth miscalibration of SVMs and boosting. Isotonic regression can fix any shape but needs more data. Whichever you pick, fit it on a held-out calibration slice — never on training or test.`,
      `**Read Brier and ECE carefully — neither is a pure calibration number.**\n\nBrier = reliability − resolution + uncertainty, so a lower Brier can come entirely from better discrimination (resolution) while calibration is flat or worse — check the reliability term or diagram directly. ECE is binning-sensitive (bin count, empty bins; use adaptive/equal-count bins) and in multiclass you must choose top-label vs classwise ECE, which can disagree. Random forests miscalibrate *away* from 0/1 (sigmoid curve, under-confident at extremes) while neural nets are commonly — not universally — overconfident.`,
      `**Handle multiclass, monitor for drift, and keep calibration separate from thresholding.**\n\nOne-vs-rest multiclass calibration needs renormalising (per-class probabilities won't sum to 1); temperature scaling avoids this by scaling all logits together. Calibration decays under covariate and base-rate shift even when AUC is unchanged, so monitor ECE/reliability over time and by cohort (geography, device, segment) and re-fit on recent data. And calibration (making the probability truthful) is a different step from thresholding (choosing the decision cutoff from costs) — fixing one doesn't fix the other.`,
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
      {
        q: `A colleague says "our Brier score dropped from 0.12 to 0.09 after the last change, so the model is better calibrated now." Why is that conclusion not guaranteed?`,
        options: [
          `A) It's fully guaranteed — Brier score is a pure calibration metric, so any drop means better calibration by definition.`,
          `B) Brier decomposes as reliability − resolution + uncertainty: reliability is the calibration error (want low) and resolution is discrimination (want high, and it's subtracted). A lower Brier can come entirely from improved resolution (better discrimination) while calibration stayed the same or even worsened. To claim better calibration you must look at the reliability term (or the reliability diagram) directly, not the Brier total.`,
          `C) The drop is meaningless because Brier score is not comparable across model versions on the same data.`,
          `D) It's wrong because a lower Brier score always means worse calibration and better discrimination — the two always move in opposite directions.`,
        ],
        answer: `B`
      },
      {
        q: `A binary model was well-calibrated at launch (ECE 0.02). Three months later the base rate of positives has shifted and users complain the probabilities feel off, though ranking is unchanged. What's happening and what should have been in place?`,
        options: [
          `A) Ranking unchanged means nothing is wrong — calibration can't drift if AUC is stable, so the complaints must be a UI issue.`,
          `B) Calibration decays under covariate and base-rate shift even when ranking (AUC) is unchanged, because the mapping from score to true rate depends on the distribution. Calibration should be monitored in production over time and by cohort (geography, device, segment) — not treated as a one-time launch fix — and re-fit on recent data when ECE crosses a threshold.`,
          `C) The model simply needs more training epochs; overconfidence always returns after a few months and retraining longer fixes it permanently.`,
          `D) Nothing can be done — once a model is deployed its calibration is frozen, so the only option is a full model rebuild from scratch.`,
        ],
        answer: `B`
      },
    ],
    takeaway: `AUC measures whether a model ranks correctly and calibration measures whether its probability estimates are honest — these are independent, so for any application where the probability output drives a real-world decision, calibration must be evaluated and fixed separately from discrimination.`,
    recap: [
      `**Ranking and calibration are independent — a model can ace one and fail the other:** an AUC-1.0 model ranks every sicker patient above every healthier one, yet among the patients it stamps "90%," only 60% may actually die. AUC asks whether risky cases score higher; calibration asks whether "0.9" happens 90% of the time. The moment a real decision reads the *number* (treatment, price, threshold), the wrong number costs you.`,
      `**See miscalibration with a reliability diagram:** bucket predictions and plot predicted probability against the *actual* fraction that came true — a perfectly calibrated model sits on the diagonal, and points *below* it mean overconfidence (says 0.8 for things that happen 0.55 of the time). Modern neural nets are almost always overconfident, worse toward the high end.`,
      `**Summarise with ECE and Brier:** ECE = average gap from the diagonal (simple but coarse — a low ECE can hide bad miscalibration in one range). Brier = mean squared error of the probabilities, which folds *both* discrimination and calibration into one number — which is why a model with *lower* AUC can post the *lower* (better) Brier by being better calibrated.`,
      `**Fix with a post-hoc patch on a *separate* calibration set, simplest first:** temperature scaling (divide neural-net logits by one T, T>1 softens overconfidence, never changes which class wins, can't overfit — try first) → Platt scaling (a small logistic curve, good for SVM/boosting) → isotonic regression (any shape, but needs more data). Never fit the correction on training or test data.`,
      `**Brier = reliability − resolution + uncertainty, so a lower Brier isn't proof of better calibration:** reliability is the calibration error (want low), resolution is discrimination (want high, and it's subtracted), uncertainty is irreducible base-rate difficulty. Brier can drop purely from better resolution while calibration stays flat or worsens — check the reliability term or the diagram directly.`,
      `**ECE is binning-sensitive:** bin count and placement change it, empty/tiny bins make it noisy, and equal-width bins waste resolution when predictions cluster (use adaptive/equal-count bins). In multiclass, choose top-label ECE (is the predicted class's confidence honest?) vs classwise ECE (is every class honest?) — they can disagree, so always pair ECE with the diagram.`,
      `**Calibration decays after deployment even when AUC is stable:** covariate shift and base-rate shift both break it because the score→true-rate mapping depends on the distribution. Monitor ECE/reliability over time and *by cohort* (geography, device, segment) and re-fit on recent data. And calibration (making the probability truthful) is a separate step from thresholding (choosing the decision cutoff from costs) — fixing one doesn't fix the other.`,
    ],
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
    interactiveId: 'ablation_viz',
    title: 'Ablation Studies & Baselines',
    subtitle: 'Designing ablations, good baselines, isolating contributions',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['ablation', 'baselines', 'experiment design'],
    summary: `A fraud detection system has five input features, three model components (feature interactions, temporal aggregations, graph embeddings), and two preprocessing steps (standard scaling, outlier clipping). The full system achieves AUC 0.91. The team wants to improve it. Where should they invest?

The answer requires ablation. Remove each component one at a time, hold everything else fixed, measure the AUC drop. Without graph embeddings: AUC 0.83 (−0.08). Without temporal aggregations: AUC 0.89 (−0.02). Without feature interactions: AUC 0.91 (−0.00). Without scaling: AUC 0.90 (−0.01). Without outlier clipping: AUC 0.91 (−0.00).

The diagnosis is immediate. Graph embeddings carry almost all of the signal — an 8-point drop when removed. Temporal aggregations contribute meaningfully. Feature interactions and outlier clipping are vestigial. The next engineering investment should go toward improving graph embeddings, not toward the components that ablation shows are dead weight. Two hours of running ablations replaced a month of speculative architecture search.

[FIGURE: ablation_bars]

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
    recap: [
      `**Ablation is the empirical partial derivative of your system:** remove each component one at a time, hold everything else fixed, measure the metric drop — the marginal contribution of each piece. Running it on a fraud system shows graph embeddings carry almost all the signal (−0.08) while feature interactions and outlier clipping are dead weight (−0.00).`,
      `**Marginal contribution of C = metric(full) − metric(full \\ {C}) — invest only where the drop is real:** the next engineering effort goes toward the component with the biggest drop, not toward the vestigial ones a leave-one-out pass exposes.`,
      `**Two designs, and they disagree when components interact:** leave-one-out starts from the full system and removes one at a time; add-one-in starts from the simplest baseline and adds one at a time. Both valid — but a component contributing little alone yet essential when paired shows up in one and not the other.`,
      `**The interaction trap — zero solo contribution can still be essential:** feature interactions showed −0.00 alone, but removing interactions *and* temporal aggregations together dropped AUC to 0.86 (more than the sum of solos). Neither is truly vestigial; each depends on the other. Use pairwise ablation, and always confirm by re-adding a component and checking the metric returns.`,
      `**Ablate on held-out data, never training:** on the training set, trees find spurious interactions that fit but don't generalise — a component showing large training-set importance can show zero held-out contribution. Every ablation result must come from the same evaluation set used for model selection.`,
      `**Many near-zero ablations = single-component dependence, a fragility signal:** if only graph embeddings matter and everything else barely moves the metric, the system degrades from 0.91 to 0.83 the instant that one data pipeline goes down. Ablation gives you the exact number to decide whether a backup component is needed.`,
      `**Two hours of ablation before committing to any architecture investment beats two weeks of speculative engineering** — run one ablation pass over all major components the moment you reach a working baseline.`,
    ],
    figures: {
      ablation_bars: `<svg viewBox="0 0 360 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">AUC drop when each component is removed</text>
  <text x="180" y="30" text-anchor="middle" fill="var(--ink-low)" font-size="8.5">full system = 0.91 · longer bar = more essential</text>
  <text x="120" y="52" text-anchor="end" fill="var(--ink-mid)" font-size="9">Graph embeddings</text>
  <rect x="126" y="42" width="200" height="14" rx="2" fill="var(--prime)" opacity="0.8"/>
  <text x="332" y="52" fill="var(--ink-hi)" font-size="9" font-weight="700">-0.08</text>
  <text x="120" y="76" text-anchor="end" fill="var(--ink-mid)" font-size="9">Temporal aggregations</text>
  <rect x="126" y="66" width="50" height="14" rx="2" fill="var(--prime)" opacity="0.6"/>
  <text x="182" y="76" fill="var(--ink-hi)" font-size="9" font-weight="700">-0.02</text>
  <text x="120" y="100" text-anchor="end" fill="var(--ink-mid)" font-size="9">Scaling</text>
  <rect x="126" y="90" width="25" height="14" rx="2" fill="var(--prime)" opacity="0.5"/>
  <text x="157" y="100" fill="var(--ink-hi)" font-size="9">-0.01</text>
  <text x="120" y="124" text-anchor="end" fill="var(--ink-mid)" font-size="9">Feature interactions</text>
  <rect x="126" y="114" width="4" height="14" rx="2" fill="var(--ink-low)" opacity="0.5"/>
  <text x="136" y="124" fill="var(--ink-low)" font-size="9">-0.00</text>
  <text x="120" y="148" text-anchor="end" fill="var(--ink-mid)" font-size="9">Outlier clipping</text>
  <rect x="126" y="138" width="4" height="14" rx="2" fill="var(--ink-low)" opacity="0.5"/>
  <text x="136" y="148" fill="var(--ink-low)" font-size="9">-0.00</text>
  <line x1="126" y1="36" x2="126" y2="158" stroke="var(--ink-low)" stroke-width="1"/>
  <rect x="126" y="172" width="200" height="26" rx="4" fill="var(--amber)" opacity="0.16" stroke="var(--amber)" stroke-width="1"/>
  <text x="226" y="182" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">interaction trap</text>
  <text x="226" y="193" text-anchor="middle" fill="var(--ink-low)" font-size="8">remove interactions + temporal together: -0.05 &gt; sum of solos</text>
</svg>`,
    },
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

A small p-value only says the effect is unlikely to be pure noise. It does not tell you the effect will *last*, that it is *big enough to matter*, or that the experiment was *run properly*. At ten million daily users, a 0.01% CTR bump hits p < 0.0001 in a single day — and that is about a thousand extra clicks. Is a whole new model to retrain, deploy, and maintain worth a thousand clicks a day? "Is this effect real?" and "Is this effect worth acting on?" are different questions, and at scale the first is almost always yes. So a trustworthy test needs all of it: random assignment (a user always in the same arm), enough time, a pre-registered metric and sample size, and guardrails watched throughout.

---

**Check the split before you read any metric: SRM.**

The very first sanity check on an A/B test is **sample ratio mismatch**. You assigned 50/50, so the two arms should have ~equal traffic — if you observe 55/45, something is broken (a bug in assignment, a crash that drops one arm's users, bot traffic hitting one side, a logging gap). And a broken split means every downstream metric is untrustworthy, because the arms are no longer comparable populations. Run a chi-squared test on the observed counts *before* looking at the treatment effect; if SRM fails (roughly, the split deviates more than chance allows), stop and debug the pipeline — do not interpret the result.

---

**Power, MDE, and the winner's curse.**

Size the test *before* running it. **Statistical power** is the chance of detecting a real effect of a given size; the **minimum detectable effect (MDE)** is the smallest lift the test can reliably catch, and it's set by the baseline metric's **variance** and your sample size. An **underpowered** test isn't just "might miss a win" — worse, the wins it *does* report are **exaggerated** (the winner's curse): only unusually large noisy estimates cross the significance line, so significant effects from small samples are biased upward. Compute the required sample size from a target MDE and power (usually 80%) up front, and be skeptical of large effects from small tests.

---

**Faster tests with variance reduction: CUPED.**

You can reach significance sooner without more traffic by *reducing variance*. **CUPED** (controlled experiment using pre-experiment data) subtracts off each user's pre-experiment behaviour — a heavy pre-period spender is expected to spend heavily regardless of treatment, so removing that predictable component shrinks the metric's variance and tightens the confidence interval. Same effect, smaller error bars, shorter test. Any strong pre-experiment covariate works; CUPED is the standard packaging.

---

**Don't jump straight to 50/50: staged ramp-up.**

High-stakes launches roll out in stages, each a safety gate: **shadow** (no user impact) → **1% canary** (catch crashes and catastrophic regressions cheaply) → 5% → 10% → 25% → 50% → full, with **automated rollback** wired to guardrails at every step. The point is to limit blast radius: a bug that would harm 50% of users is caught at 1%. Never take a brand-new model straight to half of traffic.

---

**When one user's treatment leaks to another: interference.**

Standard A/B analysis assumes **SUTVA** — one user's outcome depends only on their *own* assignment. Whole classes of systems violate this. In a **marketplace**, giving treatment sellers a boost takes impressions *away* from control sellers, so the control group is contaminated and the measured lift is inflated. **Social networks** (a treated user posts more, changing their control-group friends' feeds) and **shared-resource** systems (a treated user consumes limited inventory) have the same problem. The fixes are cluster-level randomisation (randomise by market/region/social-cluster instead of by user) or switchback designs — plain user-level A/B tests give biased answers under interference.

---

**Short-term wins, long-term harm: delayed metrics.**

The metric that moves inside the test window is often not the one you care about. CTR responds in minutes; **retention, revenue quality, refunds, churn, and lifetime value** unfold over weeks or months. A model that boosts short-term clicks by pushing clickbait can simultaneously *reduce* long-term retention — and a two-week test may never see it. Guardrails plus a long-lived **holdout group** (a fraction of users permanently excluded from all changes) are how you catch effects that only appear after the experiment ends.

---

**Overlapping experiments: layers and mutual exclusion.**

At scale dozens of tests run at once, and they can **interact** — test A changes the ranking that test B is also modifying, so the effects aren't additive. Two defenses: **mutual exclusion** (tests touching the same surface can't share users) and **experiment layers** (an orthogonalisation scheme where each user is in one experiment per layer, so tests in different layers are randomised independently). Use **factorial design** deliberately when you *want* to measure an interaction, but only after confirming independence. Document which tests ran simultaneously so surprising results can be traced.`,
    keyPoints: [
      `**Always run A/B tests for at least 2 full business cycles before making a decision — novelty effects typically last 3–7 days and can fully reverse a 15% positive signal.**\n\nFor the recommendation test: the +18% CTR was measured on days 1–2. On days 3–14, CTR in the treatment arm declines steadily as novelty fades. By day 14, CTR in treatment is 2% below control. If the test had run for 2 weeks, the team would have seen the reversal before shipping. The diagnostic: plot daily CTR for treatment vs control separately. If treatment CTR is declining toward control CTR over the first 7 days, novelty is explaining the effect. If treatment CTR is stable and above control at day 14, the effect is real.`,
      `**Trap: peeking at results before the planned end date inflates Type I error. Running a sequential test that checks significance daily at α = 0.05 gives a true false positive rate of ~30% by day 20. Use sequential testing methods (mSPRT, always-valid inference) if you need to peek.**\n\nFor the recommendation test: the team checks results every morning. On day 3, p = 0.03. They stop the test and ship. The problem: every day of peeking at α = 0.05 is an independent opportunity to cross the significance threshold by noise alone. With 20 days of peeking, the probability of at least one false positive reaches ~30%. The fix: use an always-valid sequential test framework (Spotify's SPRT, Microsoft's ExP). These frameworks compute valid p-values at any stopping point by construction, letting you stop early when the result is clear without inflating false positive rate.`,
      `**Diagnostic: if your positive A/B test result reverses after shipping, check novelty curves — plot daily CTR separately for users in their first 7 days of exposure vs later. If day-1 CTR is much higher than day-7, you measured novelty.**\n\nFor the recommendation model: after shipping and observing revenue decline, segment users by days since first exposure to the new model. New-to-model users (day 1–3): CTR 22% above baseline. Users 4–7 days in: CTR 8% above baseline. Users 8+ days in: CTR 3% below baseline. The novelty curve is unmistakable. The model was not better — it was new. The operational fix: run all future tests for at least 14 days and require that the treatment effect is stable (non-declining) in the last 7 days before shipping.`,
      `**Sanity-check the split, size the test up front, and reduce variance to go faster.**\n\nBefore reading any metric, run a sample-ratio-mismatch (SRM) check — a 50/50 design that comes back 55/45 signals a broken pipeline and makes every downstream number untrustworthy. Compute required sample size from a target MDE and 80% power beforehand, since underpowered tests both miss real wins and exaggerate the ones they report (winner's curse). CUPED (subtracting pre-experiment behaviour) cuts metric variance and shortens tests without more traffic. Roll out in stages: shadow → 1% canary → 5/10/25/50% → full, with automated rollback on guardrails.`,
      `**Mind interference, delayed metrics, and overlapping experiments.**\n\nUser-level A/B tests assume SUTVA (one user's outcome depends only on their own arm) — marketplaces, social networks, and shared-inventory systems violate it, so cluster-randomise or use switchbacks or the measured lift is biased. Short-window metrics (CTR) can move opposite to long-run ones (retention, LTV, refunds, churn); catch these with guardrails and a permanent holdout group. When many tests run at once, prevent contamination with mutual exclusion or experiment layers, and use factorial design only when you've confirmed independence and actually want the interaction.`,
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
      {
        q: `You designed a 50/50 experiment, but the logged data shows 52.5% in control and 47.5% in treatment across 2 million users. What should you do before analysing the CTR lift?`,
        options: [
          `A) Nothing — a 52.5/47.5 split is close enough to 50/50 that it won't affect the CTR comparison, so proceed to read the result.`,
          `B) This is a sample ratio mismatch, and at 2M users a 5-point deviation is far beyond chance (a chi-squared test would reject decisively). It signals a broken assignment or logging pipeline — perhaps one arm crashes and drops users, or a redirect fails — which makes the two arms non-comparable populations. Stop, find and fix the root cause, and rerun; do not interpret the CTR lift until the split is clean.`,
          `C) Reweight the treatment arm by 52.5/47.5 to correct the imbalance, then read the CTR lift normally.`,
          `D) Add more users until the split naturally converges to 50/50, then analyse — SRM always resolves itself with more data.`,
        ],
        answer: `B`
      },
      {
        q: `Your company runs a two-sided marketplace and wants to A/B test giving some sellers a ranking boost. Why is a standard user/seller-level A/B test misleading here, and what's the fix?`,
        options: [
          `A) It isn't misleading — as long as sellers are randomised 50/50, the measured lift for boosted sellers is an unbiased estimate of the boost's effect.`,
          `B) It violates SUTVA (interference): boosting treatment sellers takes impressions away from control sellers competing for the same limited buyer attention, so the control group is harmed and the measured treatment-vs-control lift is inflated — you'd overstate the boost. Fix with cluster-level randomisation (randomise by market/region so treatment and control don't compete) or a switchback design; plain per-seller A/B gives a biased answer.`,
          `C) The only issue is sample size — marketplaces need more sellers per arm, but the per-seller randomisation itself is fine.`,
          `D) The fix is to run the test longer, since interference effects average out to zero over enough time.`,
        ],
        answer: `B`
      },
    ],
    takeaway: `Statistical significance confirms the effect is unlikely to be noise — it says nothing about whether it will persist, whether it is practically meaningful, or whether the experiment was valid; a 2-day test during a novelty window with daily peeking can produce p = 0.001 on an effect that reverses completely in two weeks.`,
    recap: [
      `**The novelty trap: a short test measures novelty, not the model:** +18% CTR over 2 days can reverse to −4% revenue in two weeks because people click new things just because they're new, then settle back. The 2-day window sat entirely inside the novelty spike.`,
      `**Every ship / no-ship call ultimately rests on a controlled experiment:** offline metrics, shadow mode, and proxy checks exist only to cheaply filter candidates so you spend real A/B tests on the few worth it.`,
      `**Shadow mode first:** run the new model on the same live traffic while only the champion's predictions reach users — this proves the serving path works under load, catches weird output distributions and big model disagreements, all before a single user is affected. It catches infrastructure bugs offline testing simply can't.`,
      `**Three A/B rules people keep breaking:** run at least two full business cycles (≥2 weeks, 4 if seasonal — a 2-day win hasn't outlived novelty); fix the primary metric and sample size *before* starting (daily peeking at α=0.05 pushes the real false-positive rate to ~30% by day 20 — use a sequential test if you must peek); and set guardrail metrics up front that aren't allowed to regress.`,
      `**"Significant" is not "worth it":** a small p-value only says the effect is unlikely to be noise. At 10M daily users a 0.01% CTR bump hits p<0.0001 in a day — about a thousand extra clicks. "Is it real?" and "is it worth a new model to retrain, deploy, and maintain?" are different questions.`,
      `**SRM check before reading any metric:** a 50/50 design that logs 55/45 signals a broken assignment or logging pipeline (a crashed arm dropping users, bot traffic, a logging gap) — run a chi-squared test on the counts first, and if it fails, stop and debug; the arms are no longer comparable populations.`,
      `**Size and de-risk the test:** compute sample size from a target MDE and 80% power up front (underpowered tests exaggerate their wins — winner's curse); use CUPED (subtract pre-experiment behaviour) to cut variance and finish sooner; ramp in stages (shadow → 1% canary → 5/10/25/50% → full) with automated rollback. Watch for interference (marketplaces/social/shared-inventory violate SUTVA → cluster-randomise or switchback) and delayed metrics (retention, LTV, churn need a permanent holdout group).`,
    ],
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
  {
    id: 'online_experimentation_ml',
    interactiveId: 'experiment_power_viz',
    title: 'Online Experimentation for ML Launches',
    subtitle: 'Power/MDE, SRM, guardrails, CUPED, sequential/peeking — the A/B machinery for shipping a model safely',
    difficulty: 'intermediate',
    estimatedMin: 24,
    tags: ['evaluation', 'A/B testing', 'experimentation', 'MDE', 'CUPED', 'guardrails', 'SRM'],
    summary: `Your challenger model beat the champion by 3% AUC offline. That number does not launch anything. Offline AUC is measured on logged data the *old* model shaped — the same feedback loops, the same exposure bias — and it says nothing about what happens when the new model actually changes what users see. The only way to know a model is better *for the product* is to run it live against the incumbent and measure the metric you actually care about: engagement, revenue, retention. That live comparison is an A/B test (champion vs challenger), and getting it right is a distinct skill from training the model. This module is the launch-safety subset of experimentation — the deeper causal-inference theory lives in PAL; here we cover what a DS/MLE must not get wrong when shipping a model.

[FIGURE: power_curve]

---

**Power and minimum detectable effect: size the test before you run it.** A test's *power* is the probability it detects a real effect of a given size. Power depends on three things: the effect size you want to catch (the minimum detectable effect, MDE), the variance of the metric, and the sample size. They trade off — smaller MDE, or noisier metric, means you need more samples. The killer failure mode is the **underpowered test**: too few users to detect the effect you care about, so a genuine 1% lift comes back "not significant" and you either wrongly kill a good model or, worse, ship on a fluke. An underpowered test is a coin flip dressed up as evidence. Standard practice: fix α (false-positive rate, usually 0.05) and target power (usually 0.80), decide the MDE that matters commercially, then *solve for the sample size and runtime* up front. If the math says you need six weeks of traffic to detect a 0.5% lift and you only have one week, you know that *before* you burn the experiment.

---

**Sample-ratio mismatch: the plumbing sanity check.** You assigned 50/50, but the logs show 50.0% control and 48.3% treatment. That 1.7-point gap sounds tiny — but at scale it is astronomically unlikely by chance, and it means the *randomization itself is broken*: maybe treatment errors out and those users silently drop, maybe a redirect fails, maybe logging is lossy on one arm. When assignment is broken, the two groups are no longer comparable and **every downstream metric is untrustworthy** — including the win you were about to celebrate. The check is a **chi-square goodness-of-fit test** on the observed split against the intended ratio. If SRM fires, you stop and fix the plumbing; you do not interpret the results. It is the first thing a senior person looks at.

[FIGURE: guardrails]

---

**Guardrails: a win on the target metric is not a launch.** Ranking models are notorious for this: the new model lifts click-through by 2% while quietly raising p99 latency by 40ms, or lifting engagement while depressing revenue-per-session, or boosting short-term clicks while increasing report/block rates. **Guardrail metrics** — latency, error rate, revenue, crash rate, unsubscribe rate — are the non-negotiables the launch must not harm. You monitor them alongside the target metric, and a target-metric win that trips a guardrail is *not a ship*. This is where model launches differ most from generic A/B tests: an ML model's failure modes (a latency regression from a heavier network, a fairness regression on a slice, a feedback loop that degrades over weeks) show up in guardrails, not in the headline metric.

---

**CUPED: buy statistical power for free with pre-period data.** Much of a metric's variance is baseline user difference, not treatment effect — a heavy spender spends a lot in both arms. **CUPED** (Controlled-experiment Using Pre-Existing Data) uses each user's *pre-experiment* behavior as a covariate to subtract off that predictable baseline: it forms an adjusted metric \`Y_adj = Y − θ(X − E[X])\`, where X is the pre-period value and θ is chosen to minimize variance. The treatment effect is unchanged (X is pre-treatment, so it can't be affected by the assignment), but the *variance* drops by roughly the squared pre/post correlation. Less variance means a smaller MDE at the same sample size — often a 30–50% variance reduction, which can turn a six-week test into three weeks. It is one of the highest-leverage tricks in the toolkit and costs nothing but a join to historical data.

---

**Sequential testing and the peeking problem.** A classic fixed-horizon test is only valid if you look *once*, at the pre-planned sample size. The temptation is to watch the dashboard and stop the moment p < 0.05. But every additional look is another chance for noise to cross the threshold — repeated peeking at a fixed-α test inflates the true false-positive rate far above the nominal 5% (peek continuously and it approaches 100%). Model launches make this worse because the pressure to ship or roll back *now* is intense. The fix is methods designed for continuous monitoring: **sequential testing** and **always-valid p-values / confidence sequences** (e.g. mixture sequential probability ratio tests, group-sequential boundaries), which spend the error budget across looks so you can stop early — for a win *or* a guardrail breach — without inflating false positives. If you need to peek, use a method built to be peeked at.`,
    interactivePrompt: `Before you touch the controls: set a small MDE (say 1%) and watch the required sample size. Now toggle CUPED on. Why does the same MDE suddenly need fewer users — and what did CUPED actually change, the effect or the noise?`,
    keyPoints: [
      `**Size the test before running it — power depends on MDE, variance, and n.** Fix α (0.05) and power (0.80), pick the commercially meaningful MDE, then solve for sample size and runtime up front. An underpowered test is a coin flip: a real lift returns "not significant" and you kill a good model or ship a fluke. Roughly n ∝ variance / MDE² per arm, so halving the MDE quadruples the users needed.`,
      `**SRM is the first sanity check — a broken split invalidates every downstream number.** A 50/50 assignment landing at 50.0/48.3 is astronomically unlikely by chance and signals broken randomization (treatment erroring out, lossy logging, failed redirects). Run a chi-square goodness-of-fit on the observed split; if it fires, stop and fix the plumbing before interpreting any metric.`,
      `**Guardrails gate the launch — a target-metric win that trips one is not a ship.** Monitor latency, error rate, revenue, crash/report rates alongside the target metric. ML models fail specifically here: a heavier network adds p99 latency, a feedback loop degrades a slice. Guardrails, not the headline metric, catch the launch-specific damage.`,
      `**CUPED reduces variance for free using pre-period data — same effect, less noise, smaller MDE.** Adjust Y with a pre-experiment covariate X: Y_adj = Y − θ(X − E[X]). Because X is pre-treatment the effect estimate is unbiased, but variance drops by ~ the squared pre/post correlation (often 30–50%), shrinking the MDE or runtime at the same n.`,
      `**Peeking at a fixed-horizon test inflates false positives — use sequential methods to stop early.** Every extra look is another chance for noise to cross α; continuous peeking pushes the true FPR toward 100%. Always-valid p-values / confidence sequences / group-sequential boundaries spend the error budget across looks, so you can stop for a win or a guardrail breach without breaking the guarantee.`,
    ],
    takeaway: `Shipping a model safely is an A/B discipline, not a modeling one: pre-compute the sample size from your MDE, α, power, and metric variance so the test isn't a coin flip; check SRM (chi-square on the split) before trusting any result; gate the launch on guardrails (latency/error/revenue), because a target-metric win that trips one is not a ship; use CUPED to cut variance with pre-period data and buy back power for free; and if you must watch the dashboard, use sequential / always-valid methods so peeking doesn't inflate your false-positive rate.`,
    checkQuestions: [
      {
        q: `Your challenger model shows +3% AUC offline. Your manager wants to ship it based on that number. What is the correct response?`,
        options: [
          `A) Ship it — a 3% AUC lift is a large, reliable signal and offline evaluation is exactly what AUC is for.`,
          `B) Offline AUC is measured on data the old model shaped and doesn't measure product impact; run a live champion/challenger A/B test, sized for the MDE that matters, and judge on the real product metric plus guardrails before launching.`,
          `C) Ship to 100% but keep a rollback ready — offline AUC plus a fast rollback is equivalent to an A/B test.`,
          `D) Retrain with more data until offline AUC exceeds +5%, then ship, since a bigger offline gap removes the need for a live test.`,
        ],
        answer: `B`,
      },
      {
        q: `You planned a 50/50 experiment. After a day, exposure logs show 50.1% control and 47.9% treatment across 2 million users. What should you conclude and do?`,
        options: [
          `A) A 2-point gap is within normal randomization noise at this scale; proceed and interpret the metrics as usual.`,
          `B) This is a sample-ratio mismatch — at 2M users that split is astronomically unlikely by chance, so randomization or logging is broken. Every downstream metric is untrustworthy; stop, run a chi-square to confirm, and fix the plumbing before interpreting results.`,
          `C) Treatment is simply less popular with users, which is itself the result — log it as a negative engagement finding.`,
          `D) Re-randomize only the treatment arm to rebalance to 50/50, then continue the same experiment.`,
        ],
        answer: `B`,
      },
      {
        q: `Your new ranking model lifts the target metric (session clicks) by +2.1% with p < 0.01. During the test, p99 serving latency rose from 80ms to 130ms and revenue-per-session dropped 0.8%. Do you launch?`,
        options: [
          `A) Yes — the target metric won decisively at p < 0.01, and latency/revenue are secondary to the primary success metric.`,
          `B) No — latency and revenue are guardrail metrics the launch must not harm. A +2.1% click win that adds 50ms of p99 latency and drops revenue is a guardrail breach, not a ship; investigate the tradeoff before any rollout.`,
          `C) Yes, but only to mobile users, since the latency regression only matters on slow connections.`,
          `D) Re-run the test without logging latency, so the guardrail can't block a statistically significant win.`,
        ],
        answer: `B`,
      },
      {
        q: `Your metric is noisy and the required sample size for a 1% MDE is six weeks of traffic you don't have. A colleague suggests CUPED. What does CUPED do and why does it help here?`,
        options: [
          `A) CUPED increases the treatment effect by adjusting outcomes upward, so the same effect becomes easier to detect.`,
          `B) CUPED uses each user's pre-experiment behavior as a covariate to subtract off predictable baseline variance (Y_adj = Y − θ(X − E[X])). The effect estimate stays unbiased because X is pre-treatment, but variance drops by ~ the squared pre/post correlation — shrinking the MDE or runtime at the same n.`,
          `C) CUPED raises the α threshold from 0.05 to 0.10, making significance easier to reach without more data.`,
          `D) CUPED replaces the noisy metric with a proxy metric that has lower variance by definition.`,
        ],
        answer: `B`,
      },
      {
        q: `A PM keeps refreshing the experiment dashboard and wants to stop the test "the moment it hits p < 0.05." Why is this dangerous on a standard fixed-horizon test, and what is the fix?`,
        options: [
          `A) It's fine — p < 0.05 means 95% confidence whenever you observe it, so stopping early at that threshold is always valid.`,
          `B) Each extra look is another chance for noise to cross α, so repeated peeking inflates the true false-positive rate well above 5% (toward 100% with continuous peeking). Use sequential testing / always-valid p-values / group-sequential boundaries that spend the error budget across looks, so you can stop early without breaking the guarantee.`,
          `C) The danger is only that stopping early reduces sample size; peeking itself doesn't affect the false-positive rate, so a larger planned n solves it.`,
          `D) Switch to a one-sided test, which halves the p-value and makes early stopping safe.`,
        ],
        answer: `B`,
      },
      {
        q: `You need to detect a 0.5% lift instead of a 1% lift, keeping α and power fixed. Roughly how does the required sample size change, and what's the cheapest way to offset it?`,
        options: [
          `A) It roughly doubles (n ∝ 1/MDE), and the only fix is to wait twice as long for traffic.`,
          `B) It roughly quadruples (n ∝ 1/MDE², since halving the MDE squares the factor), and the cheapest offset is CUPED — cutting metric variance 30–50% with pre-period data reduces the required n proportionally without extra traffic or a longer runtime.`,
          `C) It stays the same — MDE only affects power, not sample size — so no offset is needed.`,
          `D) It roughly halves, because a smaller effect is easier to detect, so you can shorten the test.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Offline metrics don't launch models — live A/B does.** Offline AUC is measured on data the old model shaped and ignores product impact. Ship via a champion/challenger test on the real metric (engagement/revenue/retention) plus guardrails.`,
      `**Size before you run: power = f(MDE, variance, n).** Fix α=0.05 and power=0.80, pick the MDE that matters, solve for n and runtime. n ∝ variance/MDE² per arm — halving the MDE quadruples the users. An underpowered test is a coin flip.`,
      `**SRM first: a broken split invalidates everything.** A 50/50 landing at 50/48 at scale is not chance — it's broken randomization/logging. Chi-square on the split; if it fires, stop and fix the plumbing before reading any metric.`,
      `**Guardrails gate the ship.** Latency, error rate, revenue, report/crash rates must not regress. A target-metric win that trips a guardrail (e.g. +2% clicks, +50ms p99) is not a launch — this is where ML-specific failure modes surface.`,
      `**CUPED buys power for free; sequential methods make peeking safe.** CUPED subtracts pre-period variance (Y_adj = Y − θ(X − E[X])) — unbiased effect, ~30–50% less variance, smaller MDE. And repeated peeking inflates false positives, so use always-valid / sequential tests to stop early without breaking α.`,
    ],
    figures: {
      power_curve: `<svg viewBox="0 0 340 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:340px;font-family:var(--font-sans,sans-serif)">
  <line x1="42" y1="160" x2="315" y2="160" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="42" y1="160" x2="42" y2="20" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="178" y="182" text-anchor="middle" fill="var(--ink-low)" font-size="10">sample size per arm (n) →</text>
  <text x="16" y="92" text-anchor="middle" fill="var(--ink-low)" font-size="10" transform="rotate(-90 16 92)">power</text>
  <line x1="42" y1="48" x2="315" y2="48" stroke="var(--amber)" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="46" y="44" fill="var(--amber)" font-size="8.5">target power 0.80</text>
  <path d="M42,158 C110,150 150,120 190,72 C220,54 260,50 315,49" fill="none" stroke="var(--prime)" stroke-width="2.5"/>
  <text x="60" y="118" fill="var(--prime)" font-size="9" font-weight="700">MDE = 1.0%</text>
  <path d="M42,159 C150,156 210,146 260,110 C290,88 305,72 315,66" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-dasharray="5,3"/>
  <text x="150" y="150" fill="#ef4444" font-size="9" font-weight="700">MDE = 0.5% (needs ~4× n)</text>
  <circle cx="190" cy="72" r="3.5" fill="var(--prime)"/>
  <text x="132" y="24" fill="var(--ink-low)" font-size="8">a smaller MDE shifts the whole curve right — same power costs far more n</text>
</svg>`,
      guardrails: `<svg viewBox="0 0 340 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:340px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="14" fill="var(--ink-low)" font-size="8.5">treatment vs control — one win, two guardrail breaches</text>
  <line x1="120" y1="24" x2="120" y2="128" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="120" y="140" text-anchor="middle" fill="var(--ink-low)" font-size="8">0 (control)</text>
  <!-- session clicks: win -->
  <rect x="120" y="30" width="90" height="16" fill="var(--prime)" opacity="0.85" rx="2"/>
  <text x="6" y="42" fill="var(--ink-hi)" font-size="9">session clicks</text>
  <text x="214" y="42" fill="var(--prime)" font-size="9" font-weight="700">+2.1% ✓ target</text>
  <!-- p99 latency: breach -->
  <rect x="120" y="62" width="70" height="16" fill="#ef4444" opacity="0.85" rx="2"/>
  <text x="6" y="74" fill="var(--ink-hi)" font-size="9">p99 latency</text>
  <text x="194" y="74" fill="#ef4444" font-size="9" font-weight="700">+50ms ✗ guardrail</text>
  <!-- revenue: breach -->
  <rect x="82" y="94" width="38" height="16" fill="#ef4444" opacity="0.85" rx="2"/>
  <text x="6" y="106" fill="var(--ink-hi)" font-size="9">revenue/session</text>
  <text x="124" y="106" fill="#ef4444" font-size="9" font-weight="700">−0.8% ✗ guardrail</text>
  <text x="6" y="128" fill="var(--ink-low)" font-size="8.5" font-weight="700">a target-metric win that trips a guardrail is NOT a launch</text>
</svg>`,
    },
  },
]
