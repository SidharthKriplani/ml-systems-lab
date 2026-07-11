# Interview QnA — Logistic Regression

Module: `logistic_regression` (MSL) · Spec: `QNA-INTERVIEW-STANDARD.md` · Status: all questions `answered` — adversarial Pass-2 audit PASSED 2026-07-11 (round 1 FAIL: 2 must-fix, both fixed; round 2 confirm: PASS, incl. 2 advisory rewordings applied). IDs frozen.

**Beats (extracted from the module's own conceptual chain, in module order):**
1. Why a straight line can't hand you a probability
2. The sigmoid/logit bridge
3. Logit = log-odds, and one weight read three ways
4. MSE fails → log loss
5. The gradient story
6. Perfect separation and regularisation
7. Calibration — can you trust the number?
8. The threshold is a business decision; when one class is rare
9. The practical knobs, multiclass, and bending the boundary

Running example throughout (the module's own): a heart-attack risk model with one standardized cholesterol feature x, weight w = 1.4, bias b = −0.2. Patient 1: x = 0.5 → σ(0.5) ≈ 0.622. Patient 2: x = −1.0 → σ(−1.6) ≈ 0.168. Patient 3: x = 2.0 → σ(2.6) ≈ 0.931. Patient 4: x = −2.0 → σ(−3.0) ≈ 0.047.

---

## Beat 1 — Why a straight line can't hand you a probability

#### [qna-classification-probability-01] (L0) What problem does logistic regression solve, and what does it actually output?

**Answer.** Logistic regression solves binary classification — will this patient have a heart attack or not — by outputting a probability between 0 and 1, not a bare yes/no label. A linear equation w·x + b predicts the log-odds, and a sigmoid squashes that into a probability. In the heart-attack model (w = 1.4, b = −0.2), a patient with standardized cholesterol x = 0.5 gets z = 1.4×0.5 − 0.2 = 0.5, and σ(0.5) ≈ 0.622 — a 62.2% predicted risk. It sits as the first model for any yes/no question where the probability itself is the product: fraud, churn, default, medical risk.

**Follow-up.** → [qna-raw-linear-output-01]

#### [qna-raw-linear-output-01] (L1) Why can't we use the raw output of w·x + b directly as a probability?

**Answer.** Because a linear equation's output lives on the whole number line, and a probability must live in (0, 1). Feed in a patient's numbers and the raw output could be 1.4, or −0.3, or 3000 — all nonsense as probabilities. The fix is not to abandon the linear equation but to relocate its target: instead of forcing it to predict the probability directly, we let it predict the logit — the log-odds — which, like the linear output, ranges over the entire number line, and then run that through the sigmoid to land inside (0, 1). In the heart-attack model (w = 1.4, b = −0.2), Patient 1 with x = 0.5 gets logit z = 1.4×0.5 − 0.2 = 0.5, and σ(0.5) = 1/(1 + e^−0.5) = 1/1.6065 ≈ 0.622; Patient 2 with x = −1.0 gets z = −1.6 and σ(−1.6) = 1/(1 + 4.953) ≈ 0.168. The linear part does what it is naturally good at; the sigmoid handles the bending. The boundary to remember: the sigmoid guarantees the *shape* of a probability, not its trustworthiness — whether 0.622 really means 62% is a calibration question, verified separately.

**Trap.** "Linear models can't do classification, so we need a fundamentally different model." Actually wrong: the linear equation stays as the engine of logistic regression — only its target changes, from the probability itself to the log-odds. What breaks in the naive version is the output *range*, not linearity.

**Follow-up.** → [qna-sigmoid-logit-bridge-01]

---

## Beat 2 — The sigmoid/logit bridge

#### [qna-sigmoid-01] (L0) What is the sigmoid function and what does it do?

**Answer.** The sigmoid, σ(z) = 1/(1 + e^−z), takes any real number and squashes it into (0, 1) — a probability-shaped output. Large positive z lands near 1, large negative z near 0, and z = 0 gives exactly 0.5; the curve is the same S-shape Verhulst drew for population growth, which is where the name "logistic" comes from. Concretely: σ(0.5) = 1/(1 + 0.6065) ≈ 0.622, and σ(−1.6) = 1/(1 + 4.953) ≈ 0.168. It sits as the last step of the pipeline: linear equation → logit → sigmoid → probability.

**Follow-up.** → [qna-sigmoid-logit-bridge-01]

#### [qna-sigmoid-logit-bridge-01] (L1) How does logistic regression connect a linear equation to a probability?

**Answer.** Through a pair of functions that undo each other: the linear equation predicts the logit — the log of the odds — and the sigmoid, the logit's inverse, bends that logit into a probability. The pattern is the same as e^x and the natural log: e^x maps any number to a positive one, and the log runs it backwards. Here, the sigmoid maps the whole number line into (0, 1), and the logit stretches (0, 1) back across the whole line — 0.622 → 0.5, and 0.168 → −1.6. The move that makes it all click: a linear equation naturally outputs whole-line numbers, and a logit *is* a whole-line number, so we let the linear part predict the logit and leave the bending to the sigmoid. In the heart-attack model (w = 1.4, b = −0.2), Patient 1 at x = 0.5 gets z = 0.5 and σ(0.5) ≈ 0.622 — a 62.2% risk; Patient 2 at x = −1.0 gets z = −1.6 and σ(−1.6) ≈ 0.168 — 16.8%. Same weights, very different outputs, purely because the logit moved. The boundary: the bridge gives you a valid probability shape, and it is what makes the weights readable — each unit of x adds w to the log-odds.

**Trap.** "The sigmoid is just a convenient squashing function; any S-curve would do and the choice carries no meaning." Actually wrong within this model: the sigmoid is exactly the inverse of the log-odds, which is what makes the linear part's output a *named, meaningful quantity* and lets a coefficient be read as an odds multiplier (e^w). Call the squash arbitrary and you lose the entire interpretation of the weights.

**Follow-up.** → [qna-logit-logodds-01]

---

## Beat 3 — Logit = log-odds, and one weight read three ways

#### [qna-odds-01] (L0) What are odds, and how do they relate to probability?

**Answer.** Odds compare the two outcomes directly: the probability of the event divided by the probability of no event. Patient 1 in the heart-attack model has predicted probability 0.622, so his odds are 0.622/(1 − 0.622) = 0.622/0.378 ≈ 1.65 — "about 1.65 to 1." Odds are lopsided as a scale: probability 0.99 gives odds of 99, while its mirror image 0.01 gives odds of 0.01 — same distance from the middle, wildly different numbers. Odds sit as the halfway house between probability and logit: take the log of the odds and you have exactly the quantity the linear equation predicts.

**Follow-up.** → [qna-logit-logodds-01]

#### [qna-logit-logodds-01] (L1) What is a logit, really — and why take the log of the odds?

**Answer.** A logit is the log of the odds, and it is exactly the quantity logistic regression's linear equation predicts. The log is there to fix the lopsidedness of raw odds: a probability of 0.99 gives odds of 99, while its mirror image 0.01 gives odds of 0.01 — the same distance from the middle, yet one number is huge and the other a sliver, so you cannot line them up on a fair scale. Wrap them in a log and they become clean mirror images: log(99) ≈ +4.6 and log(0.01) ≈ −4.6, symmetric around zero and spread across the whole number line — exactly the kind of output a linear equation naturally produces. Check it on the heart-attack model (w = 1.4, b = −0.2): Patient 1 at x = 0.5 has z = 1.4×0.5 − 0.2 = 0.5, probability σ(0.5) ≈ 0.622, odds 0.622/0.378 ≈ 1.65, and log(1.65) ≈ 0.5 — the same number the linear equation produced, because that is what "logit" means. So the full pipeline is: linear equation → logit (log-odds) → sigmoid → probability.

**Trap.** Treating the logit as "just some internal score the model happens to produce." Actually wrong: it is a named, meaningful quantity — the log-odds — and that meaning is precisely what lets a weight be read as an odds multiplier and reported as an odds ratio.

**Follow-up.** → [qna-weight-three-readings-01]

#### [qna-weight-three-readings-01] (L1) In a trained logistic regression, what does a single weight w actually mean?

**Answer.** One weight reads three ways: a one-unit increase in its feature adds w to the log-odds, multiplies the odds by e^w, and moves the probability by a curved, context-dependent amount. Watch all three at once in the heart-attack model, w = 1.4: push Patient 1's x from 0.5 to 1.5, everything else fixed. The logit takes a clean linear step from 0.5 to 1.9 — exactly +1.4. The odds get multiplied by e^1.4 ≈ 4.055: at the new logit, σ(1.9) = 1/(1 + 0.1496) ≈ 0.870, so the new odds are 0.870/0.130 ≈ 6.69, versus 1.65 before — and 6.69/1.65 ≈ 4.05, matching e^1.4 up to rounding. The probability itself moved from 0.622 to 0.870, a jump of 0.248 — but the same one-unit step taken near a probability of 0.99 or 0.01 would barely move it. The boundary: only the logit reading is uniform everywhere; the odds reading is a uniform *multiplier*; the probability reading depends entirely on where you start on the S-curve.

**Trap.** "The probability rises by w (or by e^w) per unit of the feature." Actually wrong: here the probability moved by +0.248, not 1.4, and that move shrinks toward zero near the extremes. Only the log-odds gets the fixed +1.4.

**Follow-up.** → [qna-odds-ratio-01]

#### [qna-odds-ratio-01] (L2) How should logistic regression coefficients be reported and interpreted for stakeholders?

**Answer.** The decision rule: report each coefficient as an odds ratio, e^w, with a confidence interval and a p-value — and when you need that inference layer, fit an unpenalised model with statsmodels' Logit, because scikit-learn hands you coefficients but no standard errors, intervals, or p-values. The odds ratio is how logistic coefficients are actually reported in medicine and credit — "smokers have 2.3× the odds" — because a one-unit bump in the feature multiplies the odds by exactly e^w. The heart-attack model reports it too: w = 1.4 gives e^1.4 ≈ 4.055, so the plain-English readout is "one standard deviation of cholesterol multiplies the odds of a heart attack by about 4×." The same inference machinery built for linear regression's slope carries over: each coefficient has a standard error, which gives a 95% interval around the odds ratio and a p-value on whether it differs from 1 — an odds ratio of 1 means "no effect," so an interval containing 1 means the effect is not distinguishable from none. Two boundaries. First, an odds ratio is not a probability multiplier: Patient 1's one-unit step multiplied his odds by ~4.05 but moved his probability only from 0.622 to 0.870 — probability at 0.622 obviously cannot quadruple. Second, run the inference on an *unpenalised* fit; a regularisation penalty distorts the coefficients the standard errors are built around.

**Trap.** Reading "4× the odds" as "4× the probability." Actually wrong: the ×4.05 applies to odds (1.65 → 6.69); the probability went 0.622 → 0.870, and near the extremes the same odds multiplier moves probability barely at all.

---

## Beat 4 — MSE fails → log loss

#### [qna-logloss-01] (L0) What is log loss (cross-entropy)?

**Answer.** Log loss charges each prediction −log(the probability it gave to what actually happened): L = −[y·log(ŷ) + (1−y)·log(1−ŷ)], and since y is 0 or 1, only one of the two terms is ever active. Patient 3 (y = 1) gave the truth 0.931, so his cost is −log(0.931) ≈ 0.07 — gentle. Patient 4 gave the truth only 0.047: −log(0.047) ≈ 3.05. And there is no ceiling — a prediction of 0.0001 would cost −log(0.0001) ≈ 9.21. It sits as *the* training loss for logistic regression, in place of MSE.

**Follow-up.** → [qna-mse-ceiling-01]

#### [qna-mse-ceiling-01] (L1) Why does MSE fail as a training loss for a probability-outputting classifier?

**Answer.** Because MSE caps the cost of confident wrongness at about 1, so the model gets almost no extra signal for its worst mistakes. A loss is the cost we attach to being wrong — it is how we tell the model how badly it messed up — and MSE's message goes flat exactly where it matters. Take the heart-attack model's Patient 4: x = −2.0, so z = 1.4×(−2) − 0.2 = −3.0 and σ(−3.0) ≈ 0.047 — the model insisted this patient was low-risk, yet he truly had a heart attack (y = 1). The squared error is (0.047 − 1)² ≈ 0.908. Push the prediction catastrophically further wrong, to 0.0001, and MSE barely moves: (0.0001 − 1)² ≈ 0.9998. Log loss, by contrast, keeps climbing: −log(0.047) ≈ 3.05, and −log(0.0001) ≈ 9.21. The scaling is the point: Patient 4's raw miss was only about 14× Patient 3's (0.953 versus 0.069), but log loss charges him over 40× more (3.05 versus 0.07) — confident wrongness is punished without ceiling, which is exactly the message the model needs. The boundary: MSE remains the right loss for regression on genuine numbers; this failure is specific to probabilities against 0/1 labels.

**Trap.** "The square in MSE means big misses are punished extra hard." Actually wrong here: a probability error can never exceed 1, and 1² = 1, so on this problem squaring *caps* the penalty rather than amplifying it.

**Follow-up.** → [qna-logit-gradient-02]

#### [qna-logloss-vs-mse-01] (L2) MSE vs cross-entropy — how do you choose, and what exactly goes wrong with the wrong choice?

**Answer.** The decision rule: train with cross-entropy whenever the model outputs a probability for a class label; use MSE when predicting a genuine number, and never pair MSE with a sigmoid classifier. MSE fails the classification job twice over. First, bounded cost: on the heart-attack model's Patient 4 (predicted 0.047, true label 1), the squared error is (0.047 − 1)² ≈ 0.908, and even a near-maximally wrong 0.0001 only reaches ≈ 0.9998 — a hard ceiling near 1, so a confident disaster costs about the same as any bad miss. Cross-entropy on the same two predictions charges 3.05 and 9.21 — unbounded, still climbing. Second, dead gradient: MSE through a sigmoid carries a σ(z)(1−σ(z)) damping factor that crushes the learning signal precisely on confident mistakes — for Patient 4 the damping factor is 0.047 × 0.953 ≈ 0.045, so the full MSE gradient is 2 × (−0.953) × 0.045 ≈ −0.086 — roughly 9% of cross-entropy's plain-error gradient of ŷ − y = −0.953, arriving precisely when the model is most confidently wrong. The boundary: this is a choice about the *training* loss only. It does not settle how you evaluate the model (accuracy, PR-AUC), where you set the decision threshold, or whether the probabilities are calibrated — those are separate layers on top of a properly trained model.

**Trap.** "MSE still ranks the mistakes in the right order, so training with it merely learns slower, not wrong." Actually wrong: the ranking survives, but the *spacing* collapses — a 0.047 miss costs 0.908 and a roughly 470×-worse 0.0001 miss costs 0.9998, a gap of only 0.09 — and the gradient on those worst mistakes is damped by σ(z)(1−σ(z)) ≈ 0.045 down to ≈ −0.086. The learning signal on confident disasters doesn't arrive slowly; it structurally dies.

**Follow-up.** → [qna-logit-gradient-02]

---

## Beat 5 — The gradient story

#### [qna-logit-gradient-01] (L0) What is the gradient of log loss with respect to the logit?

**Answer.** For log loss through a sigmoid, the gradient with respect to the logit z is simply ŷ − y — the plain prediction error. When you work out the derivative, the messy sigmoid-slope term cancels perfectly, leaving nothing but the error itself. Check it on the heart-attack model's Patient 4 (ŷ ≈ 0.047, y = 1): ∂L/∂z = 0.047 − 1 = −0.953 — nearly the maximum possible magnitude, arriving exactly when the model most needs correcting. This result sits as the deeper "why" behind training with cross-entropy: the correction signal stays full-strength no matter how wrong the model is.

**Follow-up.** → [qna-logit-gradient-02]

#### [qna-logit-gradient-02] (L1) Why does log loss keep learning where MSE stalls? Tell the gradient story.

**Answer.** Log loss keeps a full-strength learning signal because its gradient with respect to the logit is the plain error, ∂L/∂z = ŷ − y, while MSE through a sigmoid drags along a σ(z)(1−σ(z)) damping factor that crushes the gradient exactly on confident mistakes. Differentiate log loss through the sigmoid and the sigmoid-slope term cancels perfectly, leaving just the error. Differentiate MSE and the slope term survives: the full gradient is 2(ŷ − y)·σ(z)(1−σ(z)) — and σ(z)(1−σ(z)) is tiny whenever the model is confident, i.e., whenever ŷ sits near 0 or 1. Run the numbers on the heart-attack model's Patient 4 (z = −3.0, ŷ ≈ 0.047, y = 1): log loss's gradient is 0.047 − 1 = −0.953, nearly maximal. MSE's damping factor is 0.047 × 0.953 ≈ 0.045, so its full gradient is 2 × (−0.953) × 0.045 ≈ −0.086 — about 9% of log loss's, precisely when the model is most confident and most wrong, so under MSE it barely learns from its worst mistakes. The boundary: this clean cancellation is specific to the log-loss-with-sigmoid pairing; it is a reason the two are used together.

**Trap.** "The sigmoid's flat tails kill the gradient no matter what loss you use, so confidently-wrong examples always learn slowly." Actually wrong: under cross-entropy the tail slope cancels out of the gradient entirely — Patient 4's −0.953 is nearly the largest gradient possible.

---

## Beat 6 — Perfect separation and regularisation

#### [qna-perfect-separation-01] (L0) What is perfect separation?

**Answer.** Perfect separation is when some feature splits the two classes cleanly in the training data — say, every heart-attack patient above some cholesterol value and every healthy patient below it. The model can then keep cutting loss forever by growing its weights, pushing every prediction toward a hard 0 or 1, so the weights run off toward infinity and training never settles. The symptoms: exploding weights, or — in hand-rolled implementations — a loss that turns into NaN when ŷ saturates to exactly 1.0 and 0×log(0) appears. It sits as a training-time failure mode, fixed by regularisation.

**Follow-up.** → [qna-perfect-separation-02]

#### [qna-perfect-separation-02] (L1) Why does perfect separation make the weights diverge, and what is the fix?

**Answer.** The weights diverge because, with cleanly separated classes, making the weights bigger *always* lowers the loss — there is no finite optimum to settle on. Scaling the weights up pushes every prediction closer to the correct hard 0 or 1, and log loss keeps rewarding each step; since a sigmoid only reaches 0 or 1 in the limit, gradient descent chases an optimum that sits at infinity. In the heart-attack setting: if standardized cholesterol perfectly split the sick from the healthy in the training sample, w would grow without bound, driving predictions like Patient 3's 0.931 ever closer to 1.0 — and in a hand-rolled loop, once ŷ saturates to exactly 1.0 in floating point, 0×log(0) appears and the loss turns NaN. The fix is a small L2 penalty: an extra cost on the loss for large weights, so growing them forever stops being free — the weights get capped and a finite answer comes back. In scikit-learn that means *lowering* C, since C = 1/λ and smaller C is stronger regularisation. The boundary: separation is a fact about the training sample, not a certified property of the world — the fix caps the weights and restores a finite, usable answer; it does not license trusting the hard 0/1 predictions the runaway weights were chasing.

**Trap.** "A NaN loss means dirty data — missing labels or corrupt values." Actually wrong here: the data is fine; the NaN is the model succeeding *too* hard, saturating ŷ to exactly 1.0 so that 0×log(0) appears. And lowering the learning rate does not fix it either — the optimum itself sits at infinity, so slower steps just diverge more slowly.

**Follow-up.** → [qna-sklearn-c-01]

---

## Beat 7 — Calibration: can you trust the number?

#### [qna-calibration-01] (L0) What does it mean for a model to be well-calibrated?

**Answer.** A model is well-calibrated when its probabilities mean what they claim: among all patients it scores near 0.62, about 62% actually go on to have the event. In the heart-attack model, Patient 1's neighborhood (predictions around 0.622) should contain roughly 62% real events, and Patient 2's neighborhood (around 0.168) roughly 17%. It matters because the probability is the product — thresholds, review queues, and clinical decisions consume the number itself, not just the ranking. Calibration sits as a post-training check, done by counting on held-out data with a reliability diagram.

**Follow-up.** → [qna-reliability-diagram-01]

#### [qna-reliability-diagram-01] (L1) How do you actually check whether a model's probabilities are trustworthy?

**Answer.** By counting on a held-out set the model never trained on: bucket the predictions (0–0.1, 0.1–0.2, and so on), and for each bucket plot the average predicted probability against the actual positive rate — that plot is a reliability diagram, and a trustworthy model hugs its diagonal. The logic is direct: calibration is a claim about frequencies, so you verify it by comparing claimed frequencies against observed ones. In the heart-attack model, gather every held-out patient scored near 0.62 — Patient 1's neighborhood — and about 62% of them should actually have had the event; around 0.17 — Patient 2's neighborhood — about 17% should. If instead the model says 0.8 where the truth is 0.55, it is overconfident. The fix for a drifted model is a small corrective map fit on a *separate* calibration set — never the training set: Platt scaling (a tiny logistic model on the scores) or isotonic regression (a flexible monotonic re-mapping). The boundary: how those fixes work inside, and when to prefer which, lives in the calibration module — what belongs here is the habit: the probability is the product, so test it like one.

**Trap.** "Check calibration on the training data — that's where you have the most examples." Actually wrong: the training set is exactly what the model was optimised to fit, so agreement there proves nothing about the claim you care about; the check only counts on data the model never saw.

**Follow-up.** → [qna-calibration-tendency-01]

#### [qna-calibration-tendency-01] (L2) Should you trust logistic regression's probabilities more than scores from trees, SVMs, or boosting?

**Answer.** The decision rule: treat logistic regression's probabilities as trustworthy-by-tendency but verify-always, and treat raw scores from trees, SVMs, and boosting as uncalibrated by default. The mechanism behind the tendency: logistic regression is trained to give high probability to what actually happened — that is literally what log loss optimises — so when the model is correctly specified, a predicted 0.7 often really does mean about 70% in reality. Trees, SVMs, and boosting are not optimising that objective and do not give it to you for free. Concretely, the heart-attack model's 0.622 for Patient 1 is a checkable frequency claim: on held-out data, about 62% of similarly-scored patients should have the event, and a reliability diagram tells you whether that holds. The boundary is the whole point of the decision rule: well-calibrated is a *tendency, not a guarantee*. Heavy regularisation shrinks the logits and pulls the probabilities toward the middle; class imbalance can distort them; a mis-specified model or a shift between training and serving data can break them entirely. So the practice is the same in every case — verify with a reliability diagram on held-out data, and if the model has drifted off the diagonal, fit Platt scaling or isotonic regression on a separate calibration set rather than assuming the tendency held.

**Trap.** "Logistic regression is guaranteed calibrated — that's its selling point, so skip the check." Actually wrong: the guarantee-shaped claim is only a tendency conditional on correct specification, and regularisation, imbalance, and drift all break it in practice.

---

## Beat 8 — The threshold is a business decision; when one class is rare

#### [qna-threshold-01] (L0) What is a decision threshold?

**Answer.** The threshold is the cutoff that turns the model's probability into an action — flag the transaction, approve the loan, refer the patient. It is not part of the model: the real output is the probability, and the threshold is a separate decision layer chosen from the cost of each mistake — 0.5 is almost never right. The heart-attack model's Patient 4 shows why: predicted probability 0.047, yet he truly had a heart attack — at a 0.5 threshold he is called "low risk" and sent home, a costly false negative. The threshold sits downstream of the model, upstream of the action.

**Follow-up.** → [qna-threshold-business-01]

#### [qna-threshold-business-01] (L2) How do you choose the decision threshold?

**Answer.** The decision rule: set the threshold from the cost of each mistake, never from habit. Fixed review capacity → choose the threshold that fills the queue with the highest-risk cases and maximise precision@K; catastrophic missed positives → drop the threshold to buy recall; costs in literal dollars → weigh the dollars. The clean separation is the mechanism: the model estimates probability, and *you* choose the action cutoff — two different jobs. Lowering the threshold catches more of the true cases (recall — the fraction of true cases you actually catch) at the price of more false alarms; raising it buys precision (the fraction of flagged cases that are truly positive). Grounding in the module's own cases: in fraud, if the team can review 500 alerts a day, set the threshold to fill exactly that queue with the 500 highest-risk transactions — a precision@K problem. In cardiac screening, a miss like Patient 4's — predicted 0.047, real heart attack, sent home at a 0.5 cutoff — costs far more than a false alarm, so you deliberately flag anyone above, say, 0.03 instead of 0.5, accepting extra false alarms among the genuinely low-risk. The boundary: threshold-setting assumes the probability itself is trustworthy, so calibration is checked first; and under heavy class imbalance the threshold move is one of three fixes that work together, alongside class weighting and PR-based evaluation.

**Trap.** "0.5 is the natural, neutral default — above half, call it positive." Actually wrong: 0.5 silently encodes the assumption that both error types cost the same, which is false in screening, fraud, and lending — the exact domains logistic regression serves.

#### [qna-imbalance-accuracy-01] (L1) Why is accuracy the wrong metric when one class is rare, and what do you do instead?

**Answer.** Accuracy is the wrong metric because predicting the majority class every single time already scores near-perfectly: if only 1% of transactions are fraud, a model that says "not fraud" always is 99% accurate and completely useless. The mechanism: accuracy weighs every example equally, so the rare class — the one you actually care about — contributes almost nothing to the number, and a high score can coexist with catching zero fraud. Three fixes work together, not as alternatives. Weight the rare class more heavily in the loss (`class_weight='balanced'` in scikit-learn), so each rare example counts for more during training. Move the decision threshold deliberately instead of using 0.5, since the output is a probability and the action cutoff is a business choice. And judge the model with the right curve: sweep the threshold, plot precision against recall at every cutoff, and use the area under that curve — PR-AUC — which under scarce positives is far more informative than either accuracy or ROC-AUC. The boundary: none of these change what the model fundamentally is; they change what it is optimised and judged on, which under imbalance is where the real failure lives.

**Trap.** "99% accuracy means the model is working." Actually wrong under 1% positives: the do-nothing baseline scores the same 99%, so the number carries no information about fraud-catching ability at all.

**Follow-up.** → [qna-pr-vs-roc-01]

#### [qna-pr-vs-roc-01] (L2) PR-AUC vs ROC-AUC — which do you use, and why does ROC-AUC mislead under imbalance?

**Answer.** The decision rule: when positives are scarce, judge with PR-AUC; ROC-AUC can look flattering while the model buries the team in false positives. The mechanism is in the denominators. ROC-AUC tracks the true-positive rate against the false-positive rate, and the false-positive rate's denominator is *all negatives* — with 99% of transactions legitimate, that denominator is enormous, so even a flood of false alarms barely dents it and the curve stays handsome. Precision's denominator is the *flagged cases*, so every false alarm hits it directly — which is exactly what the people consuming the alerts experience. Grounding in the module's fraud case: a model can post 0.95 ROC-AUC on 1%-fraud data while the alert queue the fraud team actually reviews is mostly junk; the PR curve — precision against recall at every threshold cutoff — is the view that matches their reality, and PR-AUC summarises it. The boundary: PR-AUC is still a threshold-sweep summary, not a deployment decision. Once the model looks good on the PR curve, you still choose one operating threshold from business costs — fill the 500-alert queue, or buy recall for screening — and you still verify calibration if anyone downstream consumes the probability itself rather than the ranking.

**Trap.** "0.95 ROC-AUC proves the model is production-ready." Actually wrong under scarce positives: the huge negative denominator means ROC-AUC can stay high while precision in the real alert queue collapses — the module's fraud team calls exactly this model useless.

---

## Beat 9 — The practical knobs, multiclass, and bending the boundary

#### [qna-sklearn-c-01] (L0) What is `C` in scikit-learn's LogisticRegression?

**Answer.** `C` is the *inverse* of the regularisation strength: C = 1/λ, so smaller C means *stronger* regularisation. That inversion is the detail that trips people up — to regularise more, you decrease C. It sits as the main knob for controlling overfitting and for taming perfect separation: when a feature splits the classes cleanly and the weights start running off toward infinity, lowering C adds the penalty that caps them and brings back a finite answer.

**Follow-up.** → [qna-penalty-solver-01]

#### [qna-penalty-solver-01] (L2) How do you choose the penalty type and solver for logistic regression in scikit-learn?

**Answer.** The decision rule: default to L2 when you want weights shrunk; choose L1 when you want some weights driven exactly to zero for feature selection; Elastic Net when you want a blend — and match the penalty to the solver, because the default `lbfgs` only does L2, while L1 and Elastic Net need a solver like `saga`. The interview-ready summary from the module: C = 1/λ, penalties are L1/L2/Elastic Net, and saga is the one solver that does them all. The mechanism behind the knob: the penalty is an extra cost added to the loss for large weights, which is how you control overfitting and how you tame perfect separation — with growth no longer free, the weights stay finite. Remember the inversion when tuning: strengthening the penalty means *decreasing* C, since C = 1/λ. Two boundaries. First, standardise your features before fitting: the penalty judges weights by size, so a feature measured in the millions gets penalised on a completely different scale from one measured in single digits. Second, regularisation trades against calibration — heavy penalties shrink the logits and pull the probabilities toward the middle, so if the probability is the product, verify calibration after tuning C rather than assuming the well-calibrated tendency survived.

**Trap.** "To strengthen the penalty, increase C — bigger number, more regularisation." Actually wrong, and it silently inverts every tuning decision: C = 1/λ, so bigger C is *weaker* regularisation. Similarly wrong: assuming any solver takes any penalty — ask `lbfgs` for L1 and it simply doesn't support it.

#### [qna-multiclass-ovr-multinomial-01] (L2) One-vs-rest or multinomial — how does logistic regression go past two classes, and which do you pick?

**Answer.** The decision rule: use multinomial (softmax) logistic regression when you need coherent probabilities across classes — one joint model whose class probabilities sum to 1, usually better calibrated across classes; use one-vs-rest when you want simple, independently interpretable per-class models. The mechanism: one-vs-rest trains one binary logistic model per class — "this class or not" — and picks the highest scorer; each model is trained independently, so nothing forces their scores to cohere into a single distribution. Multinomial trains a single model over all classes at once, with probabilities that sum to 1 by construction. To ground it, extend the module's heart-attack setting to three outcomes — heart attack, stroke, or neither: one-vs-rest fits three separate yes/no models and compares their scores, each readable on its own in odds terms; multinomial fits one model that says, for a given patient, how the total probability of 1 splits across the three outcomes. In scikit-learn both are supported, and multinomial is the default for most solvers. The boundary is the trade itself: one-vs-rest keeps each class's model independently interpretable, at the cost of scores that are not a coherent distribution; multinomial gives up per-model independence to buy cross-class coherence and typically better calibration — so the choice follows from whether anyone downstream consumes the probabilities jointly.

**Trap.** "One-vs-rest probabilities sum to 1 as well, so the two approaches are interchangeable." Actually wrong: each one-vs-rest model is trained independently and knows nothing of the others, so nothing constrains their outputs to form a distribution — coherent, sum-to-1 probabilities are specifically what multinomial buys you.

#### [qna-linear-boundary-01] (L1) Logistic regression draws a straight decision boundary. How do you get it to separate classes split by a curve?

**Answer.** You engineer the features, not the model: the boundary is linear only in whatever feature space you hand the model — a line, a plane, a hyperplane — so enriching that space lets the same model draw a boundary that curves in the original space. The mechanism: the model is linear in its inputs, full stop; but "its inputs" is your choice. Add interaction terms (age × blood_pressure) to let features combine, polynomial or spline terms to let a feature's effect curve, and binning to let it jump in steps — the boundary stays a hyperplane in the engineered space while bending in the raw one. In the heart-attack setting, a raw model can only say risk rises steadily with cholesterol; add a squared term or bins and it can express risk that stays flat and then climbs sharply. The boundary of the technique: done well, this keeps the two things logistic regression is prized for — interpretability and calibration — while fitting relationships a raw straight line never could; the module's guidance is that you reach for a heavier model only after these run out, when the boundary is clearly non-linear in ways feature engineering can't capture.

**Trap.** "A curved class split fundamentally rules out logistic regression — abandon it for a neural network or kernel SVM." Actually wrong as a first move: the linearity is relative to the feature space, and engineered features routinely buy the needed curvature while keeping interpretability and calibration.

---

## L3 cases

#### [qna-case-separation-nan-01] (L3) You are training a hand-rolled logistic regression on patient data. The loss falls steadily for a while, then the weights keep growing every epoch and the loss suddenly becomes NaN. Walk me through your diagnosis.

**Answer.** First I would clarify what the run actually looks like before touching anything: the weight-norm trajectory epoch by epoch, whether the loss was falling smoothly or oscillating before the NaN, and what the training data looks like per feature. That framing separates the three live hypotheses: a learning rate too high, a data bug, or perfect separation. The discriminating signatures differ cleanly. An overshooting learning rate produces an oscillating or erratically climbing loss — it does not produce a *steadily falling* loss with *monotonically growing* weights, which is what was described. A data bug — corrupt values, wrong labels — would not have allowed the period of healthy-looking training the run showed. Perfect separation fits the described shape exactly: if some feature splits the sick patients from the healthy ones cleanly in the training set, then making the weights bigger always cuts the loss a little more, pushing every prediction toward a hard 0 or 1, so gradient descent chases an optimum that sits at infinity — weights grow monotonically, loss keeps creeping down, and training never settles. The test that discriminates: check each feature directly for a threshold that separates the classes perfectly in the training sample, and confirm the weights grow without bound rather than oscillating. The NaN itself is the fingerprint of the hand-rolled loop: once ŷ saturates to exactly 1.0 in floating point, the loss computation hits 0×log(0) and turns NaN. Having confirmed separation, the decision is a small L2 penalty — an extra cost on weight size, so growing them forever stops being free — which caps the weights and brings back a finite answer; in scikit-learn terms, a lower C, since C = 1/λ. One boundary worth stating to the interviewer: what the training sample shows is separation *in that sample*, not a certified property of the world — so the right move is to cap the weights and get back a finite model, not to celebrate the feature and trust the hard 0/1 predictions the runaway weights were chasing.

**Trap.** "Just lower the learning rate — the run is diverging." Actually wrong here: with separated classes the loss's optimum is at infinite weights, so a smaller learning rate only makes the weights diverge more slowly; no step size fixes an optimum that does not exist at any finite point.

#### [qna-case-fraud-metrics-01] (L3) Your fraud model reports 99% accuracy and 0.95 ROC-AUC, but the fraud team says it is useless. Walk me through your diagnosis.

**Answer.** The first thing I would clarify is the base rate and what the team actually experiences: what fraction of transactions are fraud — say it is 1% — what threshold generates their alerts, and what fraction of the alerts they review turn out to be real fraud. That last number, the precision of their queue, is their lived reality, and none of the reported metrics measure it. Two hypotheses then: either the model is genuinely bad, or the metrics are a mirage under class imbalance and the model may even be salvageable. The mirage mechanism is worth spelling out. At 1% fraud, a model that predicts "not fraud" every single time is 99% accurate — so the 99% figure carries literally no information about fraud-catching. And ROC-AUC tracks the true-positive rate against the false-positive rate, whose denominator is all negatives: with 99% of transactions legitimate, that denominator is enormous, so even a flood of false alarms barely dents it, and 0.95 can coexist with an alert queue that is mostly junk. The discriminating test: compute precision at the team's actual review capacity — if they can review 500 alerts a day, measure precision@500 — and plot the full precision-recall curve. If PR-AUC is poor while ROC-AUC is high, the mirage is confirmed; if PR-AUC is also strong, the problem is elsewhere, likely the threshold placement. The decision, assuming the mirage: three fixes that work together, not alternatives. Weight the rare class in training with `class_weight='balanced'` so each fraud example counts for more; set the threshold deliberately to fill the 500-slot queue with the highest-risk cases rather than using 0.5; and judge the model by PR-AUC going forward. The boundary: even after all three, the specific operating threshold remains a business decision driven by review capacity and the dollar cost of misses, not a statistic the model hands you.

**Trap.** "0.95 ROC-AUC already proves the model is fine — the team is misreading their dashboard." Actually wrong: under 1% positives, ROC-AUC's enormous negative denominator lets it flatter a model whose real alert queue is junk; the team's experience is the more informative measurement.

#### [qna-case-overconfident-calibration-01] (L3) In production, your heart-attack model's predictions near 0.8 correspond to only about 55% actual events. Walk me through it.

**Answer.** First, clarify whether the measurement itself is trustworthy before indicting the model: was this reliability diagram built on data the model never trained on, and are there enough patients in the 0.8 bucket for 55% to be a real rate rather than small-sample noise? Assuming the measurement holds, the model is overconfident — it says 0.8 where reality delivers 0.55 — and there are three hypotheses worth separating: the model was always miscalibrated and nobody checked; the world shifted between training and serving; or the miscalibration comes from the modeling setup itself — class imbalance or a mis-specified model distorting the probabilities. The discriminating test is a comparison of two reliability diagrams: rebuild one on the original held-out set from training time, and one on recent production data. If the training-era diagram hugs the diagonal but the production one sits off it, the model drifted — the training-to-serving shift is the culprit, and comparing the two eras' base rates is a direct way to check for it. If both diagrams sit off the diagonal, the model was never calibrated and the check was simply missing from the pipeline. One hypothesis I can rule out from the direction of the error: heavy regularisation shrinks the logits and pulls probabilities toward the middle — that produces *under*confidence at the top end, not a 0.8-versus-0.55 overshoot — so tuning C is not the first lever here. The decision either way: fit a small corrective map on a *separate* calibration set — never the training set — using Platt scaling, a tiny logistic model on the scores, or isotonic regression, a flexible monotonic re-mapping, and then re-verify with a fresh reliability diagram on data neither the model nor the corrective map has seen. The boundary: recalibration repairs the mapping from scores to probabilities; if drift is severe enough to have degraded the ranking itself, no re-mapping recovers that, and retraining is the honest fix.

**Trap.** "Refit the calibration on the training set — it's the biggest sample available." Actually wrong: the training set is what the model was optimised on, so a corrective map fit there inherits exactly the optimism you are trying to remove; the module's rule is a separate calibration set, never the training set.

#### [qna-case-screening-threshold-01] (L3) A cardiac screening tool built on your model is deployed with a 0.5 cutoff. Clinicians report that patients marked "low risk" are having heart attacks. Walk me through it.

**Answer.** The first thing to clarify is which of two very different diseases this is: are the probabilities themselves wrong (a calibration failure), or are the probabilities right and the cutoff wrong (a threshold failure)? The reported symptom fits both. The module's Patient 4 is the archetype: predicted probability 0.047, and yet a real heart attack — at a 0.5 threshold he is labeled "low risk" and sent home, a false negative. The discriminating test is a reliability diagram on held-out data: bucket the predictions and compare each bucket's average predicted probability against its actual event rate. If the low buckets are honest — the patients scored near 0.05 really do have about a 5% event rate — then the model is telling the truth, and the failure is the threshold: a calibrated 5% is not zero, and a 0.5 cutoff silently converts every one of those genuine 5% risks into "send home." If instead the low buckets are dishonest — patients scored 0.05 are having events at, say, 20% — the model is miscalibrated, and that gets fixed first with Platt scaling or isotonic regression on a separate calibration set before any threshold talk. Assuming the diagram comes back clean, the decision is the module's own: in cardiac screening a missed case costs far more than a false alarm, so deliberately drop the flag line — flag anyone above roughly 0.03 instead of 0.5 — buying recall, the fraction of true cases actually caught, at the acknowledged price of many more false alarms among genuinely low-risk patients. The boundary to state explicitly: the model estimates probability and the threshold is a clinical-cost decision that belongs to the deployment, not the model — and a calibrated model will *always* have some events among its low scores; roughly 5 in 100 Patient-4-alikes having attacks is the model being right, not a bug to retrain away.

**Trap.** "Patients the model called low-risk had heart attacks, so retrain the model." Actually wrong when the model is calibrated: 0.047 means about a 5% event rate, and 5% of those patients having events is the prediction *holding*; the fixable error was deploying a 0.5 cutoff in a domain where a miss is catastrophic.

#### [qna-case-mse-stall-01] (L3) A teammate hand-rolled a classifier with a sigmoid output trained on MSE. The loss plateaus early, and the most badly-wrong predictions never improve. Walk me through it.

**Answer.** First, clarify the setup and the symptom precisely: confirm the loss really is mean squared error applied to sigmoid outputs against 0/1 labels, and look at the per-example gradients — specifically, whether the examples with the *highest* loss are receiving the *smallest* updates. That inversion is the tell. The hypotheses: the model has genuinely converged; the learning rate is too small; or MSE's gradient is structurally damped exactly on confident mistakes. The discriminating test is one computation on a confidently-wrong example, and the module's Patient 4 gives the template: predicted probability 0.047 against a true label of 1. Under MSE with a sigmoid, the gradient with respect to the logit is 2(ŷ − y)·σ(z)(1−σ(z)); the damping factor is 0.047 × 0.953 ≈ 0.045, so the full gradient is 2 × (−0.953) × 0.045 ≈ −0.086. Under cross-entropy the sigmoid-slope term cancels and the gradient is just ŷ − y = −0.953 — MSE is delivering about 9% of the correction signal, on the example that most needs correcting. If the worst examples show exactly this pattern — large loss, tiny gradient — the plateau is not convergence, and no learning-rate fiddling fixes it, because σ(z)(1−σ(z)) shrinks as the model grows confident: the damping is structural, tied to the very examples that matter. The decision: switch the loss to cross-entropy. The gradient becomes the plain error at full strength, and the cost becomes unbounded — −log(0.047) ≈ 3.05 where MSE charged only (0.047 − 1)² ≈ 0.908 near its ceiling of 1, and −log(0.0001) ≈ 9.21 versus MSE's essentially unchanged 0.9998 — so confident disasters finally dominate training the way they should. The boundary: MSE remains exactly right for regression on genuine numbers; the pathology here is specific to pairing a squared error with a sigmoid output and 0/1 labels, which is why cross-entropy and the sigmoid travel together.

**Trap.** "The loss plateaued, so the model has converged — stop training." Actually wrong here: convergence and damping look identical in the loss curve, but the per-example check separates them — high-loss examples with near-zero gradients (−0.086 against a possible −0.953) mean the signal died, not that the work is done.

---

## Beyond this module

Adjacent questions whose answers live in other MSL modules. Listed as question text → owning module id. (Per spec, these render as links to the owning module's QnA at the exact question ID once those grids exist; until then, module-level links with a "QnA coming" marker.)

1. How do Platt scaling and isotonic regression actually work inside, and when do you prefer one over the other? → `calibration`
2. Why do models drift off the reliability diagonal in the first place — what are the failure mechanisms behind miscalibration? → `calibration`
3. Why does an L1 penalty drive weights to exactly zero while L2 only shrinks them — what is the geometry? → `regularization`
4. How is a ROC curve constructed point by point, and what does ROC-AUC mean probabilistically? → `class_imbalance`
5. Beyond class weights and thresholds, how do resampling approaches to rare classes work, and when are they worth it? → `class_imbalance`
6. How does a decision tree carve a non-linear boundary without any feature engineering — and what does it give up versus logistic regression? → `trees`
7. How does an SVM's maximum-margin boundary and hinge loss differ from logistic regression's probabilistic boundary? → `svm`
8. Where do a coefficient's standard error, t-statistic, and confidence interval actually come from — the mechanics of the inference layer? → `linear_regression`
9. How does gradient descent turn a gradient like ∂L/∂z = ŷ − y into concrete updates of w and b across a whole dataset? → `linear_regression`
