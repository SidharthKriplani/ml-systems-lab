# LinkedIn Batch 01 — Deep-Link Campaign

Drafted 2026-06-18. Audience: Indian ML practitioners — Swiggy / Flipkart / Meesho / PhonePe / Razorpay hiring context. Senior/staff MLE tone. No teasers, real answer in the post.

URL base: `https://ml-systems-lab-v9xe.vercel.app`

---

## Post 1 — Training-Serving Skew

**Slug:** `training-serving-skew`

Your model degrades silently in production. The cause is almost always the same thing.

0.92 AUC in the notebook. Two weeks after launch, conversion is half what it was at the start. Nobody's alarmed because the metrics move slowly. Then someone checks the actual business number and the model is already at baseline.

The cause is rarely the model. It's the feature pipeline. Training runs offline — your "days since last order" feature is computed against `order_completed_at`. Serving runs real-time — the same feature is computed against `now()`. Same code path, different anchor. The model learned a distribution the serving layer never reproduces. Or your training join was a left join with imputed nulls and the serving call does a fresh lookup that returns the real value. Or the categorical encoder at training saw 500 cities and the serving encoder hits a new one every hour and maps it to a default bucket the model never trained on.

More monitoring won't fix this — it'll just tell you faster that you have a problem you can't diagnose. The fix is structural. Log served features to the same feature store you train on. Compute training labels from the served snapshot, not from the source table. If your training pipeline and serving pipeline don't share the exact feature computation function (or aren't materialised from the same store), you have skew. You just haven't noticed yet.

Full pattern catalogue + detection playbook: https://ml-systems-lab-v9xe.vercel.app/?post=training-serving-skew#gradient

#MachineLearning #MLOps #DataEngineering

---

## Post 2 — AUC Is Not Your Friend

**Slug:** `auc-is-not-your-friend`

AUC 0.95 means nothing if your positive rate is 1%.

AUC measures rank ordering — given a random positive and a random negative, the probability your model scores the positive higher. It's median-friendly. It's also divorced from what most production ML systems actually do. Fraud at PhonePe runs at ~0.1%. Default at a lender sits around 2%. Click-through on Flipkart ads is below 5%. You don't act on 50% of the ranking. You act on the top 0.5%. AUC tells you nothing about that region.

What you actually need depends on the action. Precision@K for action-budget systems where reviewers can only check N cases a day — fraud queues, content moderation. Recall@precision for screening problems with a fixed downstream cost — underwriting where every false positive costs ₹X in reviewer time. Calibration error if your score gets multiplied downstream — a 0.95 AUC model with 0.3 calibration error will systematically over-rank or under-rank, and your bidder loses money or your loan-limit calculator approves the wrong ticket sizes.

The interview tell is which metric a candidate reaches for first. Senior MLEs map the metric to the cost function of the action — if reviewers check 100 cases, optimise precision@100; if a missed fraud is 50× a wasted review, choose recall at a precision threshold that respects that ratio. AUC is what you report to academic reviewers. It's not what you ship on.

When AUC lies + the metrics that don't: https://ml-systems-lab-v9xe.vercel.app/?post=auc-is-not-your-friend#gradient

#MachineLearning #DataScience #MLE

---

## Post 3 — A/B Test Failure Modes

**Slug:** `ab-test-failure-modes`

Your A/B test showed a 12% lift. It was wrong. Here's how that happens.

Two failure modes account for most invalid experiments and almost nobody catches them in dashboards: peeking and SRM. Peeking — checking the result before the planned sample size, calling a winner the moment p < 0.05. The textbook false positive rate is 5%. If you check daily for two weeks, the real rate is closer to 25%. Every look is another shot at crossing the line. A "12% lift, p = 0.03" reached on day 8 of a 14-day test is not a winner. It's a coin flip that happened to land up.

SRM — Sample Ratio Mismatch. You set a 50/50 split. Your assignment service has a bug, a caching layer, or differential opt-outs across variants. The actual split lands at 52/48. A chi-square on the assignment counts will fire. If you ignore it, every downstream metric is biased — not because of the treatment, but because the two populations being compared are different. SRM at Meesho, Swiggy or any high-volume product is the single most common cause of an A/B result that fails to replicate.

The fixes are procedural, not statistical. Lock the sample size and end date upfront — peeking is forbidden, or you switch to a sequential test (mSPRT, always-valid confidence intervals). Run an SRM check as the first gate on every readout — if it fires, you debug assignment before you look at the metric. Treat experimentation as a workflow with checkpoints, not a number to celebrate.

Detection patterns + the sequential-test alternative: https://ml-systems-lab-v9xe.vercel.app/?post=ab-test-failure-modes#gradient

#DataScience #ABTesting #Experimentation

---

## Post 4 — Concept Drift Detection

**Slug:** `concept-drift-detection`

PSI > 0.2 fired at 3am. What you do next decides if you should trust the alert.

PSI > 0.2 is the textbook drift threshold and a terrible default. PSI measures distribution shift on a single feature. It doesn't know if the shift matters for your prediction, doesn't account for seasonality, and is highly sensitive to bin choice. A Flipkart recommender will fire PSI alerts every Diwali on category mix, every payday on basket size, every Friday on session length. None of those are model decay. They're business reality.

Separate the two kinds of drift before you act. Feature drift (covariate shift) — the input distribution moves but the input-to-label relationship might still hold. Concept drift — the relationship itself has changed (an item that used to predict churn no longer does). Only the second one degrades your model. The test is whether prediction quality holds when you backtest the current model on a recent labelled window. If precision and calibration are intact, the PSI alert was noise. If they're not, you have a real problem and PSI is finally being useful as a canary.

Build the monitoring stack accordingly. Tier it: PSI fires → run a label-quality check on a recent slice → if precision or calibration dropped, alert; if not, log and snooze for 24h. Set thresholds against your historical seasonal envelope, not a generic 0.2. The goal isn't to detect drift. It's to detect drift that costs you money.

Drift framework + threshold-setting playbook: https://ml-systems-lab-v9xe.vercel.app/?post=concept-drift-detection#gradient

#MLOps #MachineLearning #Monitoring

---

## Post 5 — L1 vs L2 (Cheatsheet)

**Deep link:** `?tier=1&section=comparisons#cheatsheet`

L1 vs L2 — every interviewer asks. Most candidates miss the geometric reason.

Both penalise large weights. The difference is the shape they push the solution toward. L2 adds the sum of squared weights — the constraint surface is a sphere, smooth and differentiable everywhere. The optimum lands on the surface but rarely on an axis. You get small weights, none of them exactly zero. L1 adds the sum of absolute weights — the constraint surface is a diamond with sharp corners on the axes. The optimum is far more likely to land on a corner, meaning some weights collapse to exactly zero. That's why L1 selects features and L2 doesn't. The geometry is the answer, not the memorised line.

When to use which, in practice. L1 when you suspect most features don't matter (genomics, text, sparse user signals) and you want an interpretable shortlist — the surviving features are your candidate set. L2 when features are correlated and you want stable, low-variance estimates — credit scoring, dense engineered features, tabular at Razorpay or InMobi. Elastic Net when you have both: correlated groups where you still want sparsity. The production default is usually L2 because correlated features are the norm and L1 will arbitrarily pick one feature in a correlated group and zero the rest — which destabilises model behaviour across retrainings.

The interview tell: candidates who explain diamond-vs-sphere are senior. Candidates who only recite "L1 does feature selection, L2 doesn't" are reciting. Probe one level deeper and ask why a sparse solution lands on a corner — that's where the staff-level signal lives.

L1/L2 + 23 other trade-offs senior interviews probe: https://ml-systems-lab-v9xe.vercel.app/?tier=1&section=comparisons#cheatsheet

#MachineLearning #InterviewPrep #MLE

---

## Posting notes

- **Slug duplicate:** `ab-test-failure-modes` exists twice in GradientTab.jsx (lines 1801 and 2321). The link opens the first match. Dedupe in a future cleanup pass.
- **Cadence suggestion:** 1 post / 2–3 days. Post 1 (training-serving skew) is the strongest hook for cold-start reach — lead with it.
- **Tracking:** all 5 URLs are unique, so PostHog autocapture (when enabled) will let you attribute reach per post.
