export const MONITORING_MODULES = [
  {
    id: 'monitoring_taxonomy',
    title: 'Monitoring Taxonomy',
    subtitle: 'Data drift, concept drift, model decay, infrastructure drift',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['monitoring', 'drift', 'model decay', 'MLOps'],
    summary: `A deployed model has no built-in mechanism to signal when it's failing. The first symptom is usually a business metric moving — conversion down, churn up, fraud losses spiking — at which point the model has been silently wrong for days or weeks. The reason engineers apply the wrong fix is that they treat all degradation as the same thing. Recalibrating a threshold when the real problem is a broken upstream schema wastes a week and leaves the model still broken. Four distinct failure modes exist: data drift (input distribution changed), concept drift (the true relationship between inputs and outcomes changed), model decay (performance degraded for any reason), and infrastructure drift (the serving environment changed). Each has different detection signatures, different timelines, and different remedies. Conflating them is the most common mistake in production ML operations.`,
    keyPoints: [
      `**Data drift: P(X) changes — input features shift away from the training distribution.** Seasonality, new user segments, product launches, or upstream pipeline changes can all cause it. Data drift does not always cause performance degradation — if the model generalizes across the new distribution, drift is benign. The risk is that data drift is a leading indicator of eventual performance problems, even when the immediate impact is small.`,
      `**Concept drift: P(Y|X) changes — the relationship between features and the target shifts.** Fraud patterns change as fraudsters adapt their techniques. Churn drivers change when a competitor launches. Even if input distributions look identical to training, the correct output has changed. Concept drift always causes model performance degradation and cannot be fixed by recalibration alone — it requires retraining on data that reflects the new relationship.`,
      `**Prior probability drift: P(Y) changes — the label distribution shifts without any change in features or the feature-target relationship.** Base fraud rate increases, positive conversion rate drops as market conditions change. This affects calibration and threshold selection even when the model's discriminative ability is intact. A well-calibrated model in January can be systematically overconfident by March if the prior has shifted.`,
      `**Model decay is the umbrella term for performance degradation over time regardless of cause.** Any combination of the above drift types can cause it, as can business rule changes, user behavior shifts, or real-world events that change the ground truth. Identifying which type of drift is driving decay is required before the right remedy can be applied.`,
      `**Infrastructure drift: the serving environment changes — library version updates, hardware changes, schema changes in upstream data — cause prediction changes that have nothing to do with data or concept drift.** A float-to-int cast that worked in one library version fails silently in another. Canary deployments and shadow mode catch infrastructure drift before it fully rolls out. This category of failure is underappreciated and causes production incidents that look like model problems but are actually deployment problems.`,
      `**Detection priority order: (1) Infrastructure health first — latency spikes, error rate increases, and throughput drops are fastest to detect and usually have the clearest remediation. (2) Data quality next — null rate increases, schema changes, and distribution shifts in raw inputs catch upstream pipeline failures. (3) Prediction distribution monitoring — detectable without labels, provides a proxy for model drift in real time. (4) Label-based performance metrics — most accurate measure of actual model quality, but delayed by however long labels take to arrive.**`,
      `**Monitoring cadence: infrastructure metrics must be real-time with sub-minute alerting — a serving outage is a P1 incident.** Feature distributions should be computed hourly or daily. Prediction distribution hourly. Label-based performance metrics daily or weekly, depending on label delay. Setting all metrics to the same cadence wastes compute and either produces too many spurious alerts (real-time on slow-moving signals) or too much lag (daily on fast-moving infrastructure signals).`,
    ],
    checkQuestions: [
      {
        q: `Your fraud model is flagging more transactions as fraudulent over time, but actual fraud labels (available after investigation) show no increase in fraud rate. What type of drift is this?`,
        options: [
          `A) Concept drift — P(Y|X) has changed, so the model now incorrectly maps the same features to higher fraud probability`,
          `B) Prior probability drift or data drift causing prediction distribution shift — P(Y) is stable but input feature changes are pushing scores higher`,
          `C) Infrastructure drift — a library update changed how scores are computed, inflating raw model outputs`,
          `D) Model decay from overfitting — the model has memorized training noise and now generalizes poorly to new transactions`,
        ],
        answer: `B`,
      },
    ],
  },
  {
    id: 'data_drift_detection',
    title: 'Data Drift Detection',
    subtitle: 'PSI, KS test, chi-squared, Jensen-Shannon divergence, choosing thresholds',
    difficulty: 'intermediate',
    estimatedMin: 20,
    tags: ['data drift', 'PSI', 'KS test', 'distribution monitoring'],
    interactivePrompt: `Before you touch the controls: a loan model has been running since January with no errors, but it's now July — what signal would tell you the model is silently wrong before any labels arrive?`,
    summary: `A loan approval model deployed in January. By March, a new population of applicants has appeared — recent graduates entering the workforce, a new geographic market that opened up. Their median income has shifted from $55K to $70K. The model still runs without errors. It produces predictions at the same latency. No alert has fired. But it is making systematically worse decisions because it was calibrated to a population that no longer exists at the same frequency. By the time a business stakeholder notices the approval rate or default rate has drifted, it is July. The root cause is six months old. This is silent model decay — and it is the default outcome when monitoring is absent.

Data drift detection is the early-warning system. Instead of waiting for labels to arrive and confirm that performance has degraded, you compare the current distribution of each input feature against the training distribution and quantify the divergence. The question becomes: how much has the income distribution changed, and is that change large enough to matter?

The loan industry developed Population Stability Index (PSI) specifically for this problem. $PSI = \\sum (p_{train} - p_{new}) \ln(p_{train}/p_{new})$ summed across bins of the feature distribution. PSI < 0.1 means the population is stable. Between 0.1 and 0.2 means mild drift worth investigating. Above 0.2 means significant drift requiring action. For the income feature with a median shift from $55K to $70K, PSI will likely exceed 0.2 — an actionable signal months before any performance label confirms the damage.

For continuous features, the Kolmogorov-Smirnov test measures the maximum difference between two CDFs: $D = \max|F_{train}(x) - F_{new}(x)|$. It is distribution-free and sensitive to shifts in any part of the distribution, not just the mean. The critical failure mode: with 1M daily requests, D = 0.015 will be statistically significant (p < 0.001) but operationally meaningless. Always pair the KS statistic with a practical threshold — D > 0.05 is a reasonable bar — rather than acting on p-values alone. For categorical features, chi-squared tests whether observed category frequencies match training frequencies. For any continuous feature where you want a single bounded number that works across features with very different natural variability, Jensen-Shannon divergence is symmetric, bounded in [0, 1], and easier to threshold uniformly than KS.

**NOT this.** Drift detection is not just statistical testing on feature distributions — and a drift alert does not mean retrain immediately. Statistical significance does not equal business significance. A drift alert should trigger investigation: does this drift actually affect model performance? Sometimes features drift substantially but the model remains accurate in the new regime — the learned relationship still holds even if the inputs have shifted. Other times, a subtle drift in one high-importance feature destroys accuracy while 49 other features show no change. You need both drift detection (early warning that something changed) AND performance monitoring with delayed labels (confirmation that the change matters). The alert says "look here." The labels tell you if it is a real problem.`,
    keyPoints: [
      `**Use PSI for binned continuous and ordinal features as your default drift metric.** Build 10 equal-frequency bins from the training distribution — not equal-width, because skewed distributions put all the signal in a few dense center buckets with equal-width binning. Add boundary bins for values falling outside the training range. Apply the rule: PSI < 0.1 is stable, 0.1–0.2 is investigate, > 0.2 is act. The loan income example with a median shift from $55K to $70K will produce PSI well above 0.2. These thresholds are stable enough to apply without per-feature recalibration, which is why the financial industry standardized on them.`,
      `**The most common production trap is acting on statistical significance rather than practical significance.** With 1M daily serving requests, the KS test will flag D = 0.015 as p < 0.001. That is a shift of 1.5 percentage points in the CDF — real, but almost certainly not affecting model performance. Engineers who fire a retraining pipeline on every statistically significant drift alert spend all their time on retraining overhead and still miss the actual incidents, because the threshold is too sensitive. Set D > 0.05 as your practical floor. For PSI, trust the 0.1/0.2 boundaries — they were empirically calibrated over decades of financial model deployment, not derived from theory.`,
      `**The diagnostic: monitor prediction score distribution first, then feature distributions.** The prediction score distribution changes before any feature drift alerts fire and before any labels arrive. A loan model\`s score distribution shifting from mean 0.35 to mean 0.28 over two months is the earliest signal — the model is scoring the new population differently. Once you see score drift, run PSI on each feature ordered by training-time importance. The first high-PSI, high-importance feature is your root cause. This narrows a 50-feature investigation to a 1-feature investigation within minutes.`,
    ],
    takeaway: `Drift detection provides the early warning that silent model decay is accumulating. PSI above 0.2 on a high-importance feature is actionable even before labels arrive. But a drift alert triggers investigation, not automatic retraining — the question that matters is whether the drift actually degrades performance, which only labels can confirm.`,
    checkQuestions: [
      {
        q: `You have 1M daily serving requests and are monitoring feature drift. The KS test shows p<0.001 for "age" feature with KS statistic D=0.015. Should you alert?`,
        options: [
          `A) Yes — p<0.001 is highly significant, meaning the age distribution has definitively shifted and the model is likely degraded`,
          `B) Yes — any statistically significant drift in a top feature warrants an immediate page to the on-call engineer`,
          `C) No — the KS test is the wrong tool for continuous features; rerun with PSI before making any decision`,
          `D) No — with 1M samples, D=0.015 is statistically significant but not practically significant; use a practical threshold like D > 0.05 or PSI > 0.1 instead`,
        ],
        answer: `D`,
      },
    ],
  },
  {
    id: 'concept_drift',
    title: 'Concept Drift Detection',
    subtitle: 'DDM, EDDM, ADWIN, sudden/gradual/recurring drift in batch vs streaming',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['concept drift', 'ADWIN', 'DDM', 'online learning'],
    summary: `Concept drift is the most destructive type of model failure because it makes predictions wrong even when input features are in-distribution. Fraudsters adapt to detection patterns. User behavior changes when a competitor launches. Spam techniques evolve.

The model that was 94% accurate on last quarter's data produces 71% accuracy today — not because the inputs changed, but because the correct outputs for those inputs have changed. Detecting this requires labels — you must observe actual outcomes to measure how much the model's predictions diverge from reality. That creates an inherent detection lag: the longer label feedback takes to arrive, the longer concept drift accumulates undetected. For domains with long label delays (credit default, churn), concept drift can run for months before any statistical test catches it.`,
    keyPoints: [
      `**Drift types: sudden drift is an abrupt change (a regulation takes effect, a major competitor launches) — visible in error metrics within days.** Gradual drift is a slow shift over months — each day's change is too small to trigger any alert, but the compounding effect over a quarter is significant. Incremental drift moves in small consistent steps. Recurring drift follows seasonal patterns (fraud peaks in Q4, user behavior shifts on weekends) — the model should not be retrained on recurring patterns, it should be designed to handle them.`,
      `**DDM (Drift Detection Method): monitors a running mean and standard deviation of prediction errors.** Issues a warning when the current error rate exceeds μ + 2σ from the reference period. Signals confirmed drift when it exceeds μ + 3σ. Simple and computationally cheap, but requires enough error samples per window to estimate mean and std reliably — insufficient samples produce noisy signals on low-traffic streams.`,
      `**EDDM (Early DDM): instead of tracking raw error rate, tracks the distance between consecutive errors.** When errors occur further apart (the model is mostly right), the distribution of inter-error gaps is wide. When drift occurs, errors cluster together and inter-error gaps shrink. EDDM is more sensitive to gradual drift than DDM but generates more false positives on inherently noisy error streams.`,
      `**ADWIN (ADaptive WINdowing): maintains a variable-size window of the error stream.** Continuously compares the left and right halves of the window for distributional difference. When a significant difference is detected, ADWIN shrinks the window to discard pre-drift data. Update time is O(log W) with theoretically optimal false positive rate. The adaptive window means ADWIN automatically adjusts to the drift speed — a fast-drifting stream gets a short window, a slow-drifting stream keeps a long one.`,
      `**Batch concept drift detection: compare error rate in a recent window (e.g., last 30 days) against a reference window (first 30 days after deployment).** Mann-Whitney U test or t-test measure whether the error distributions are significantly different. Labels are required, so detection lag equals label delay. A model with 14-day label delay means 14 days of concept drift accumulate before any batch detector can trigger. Plan retraining cadence with this lag in mind.`,
      `**Unlabelled drift detection as a proxy: use prediction distribution shift as an early warning for concept drift before labels arrive.** If the score distribution shifts significantly (PSI > 0.2 on model output), concept drift may have occurred. Combining this with feature drift metrics provides earlier warning than waiting for label-based metrics. The tradeoff: unlabelled signals have more false positives because they cannot distinguish data drift from concept drift.`,
      `**Adaptation strategies: retrain on a sliding window of recent data to give more weight to current patterns (appropriate for gradual drift).** Online learning updates model weights on each new labelled sample (appropriate for fast-moving streams where labels arrive quickly). Time-weighted ensembles combine old and new models with recency weights. For recurring drift (seasonal patterns), time-based models that condition on time features are often better than continuous retraining.`,
    ],
    checkQuestions: [
      {
        q: `Your spam classifier was deployed 6 months ago. Spam recall has dropped from 92% to 71%. What type of drift is this and what is your response?`,
        options: [
          `A) Concept drift — spammers adapted techniques so P(spam=1|features) changed; lower threshold immediately, retrain on a recent 3-month window, then establish continuous retraining and weekly monitoring`,
          `B) Data drift — new email clients changed the feature distribution; recalibrate with Platt scaling on recent data to restore the 92% recall without full retraining`,
          `C) Prior probability drift — overall spam volume increased, shifting P(spam=1) and miscalibrating the threshold; adjust the decision threshold to match the new base rate`,
          `D) Infrastructure drift — a library or preprocessing change altered how email features are extracted; roll back the pipeline change and recall will recover automatically`,
        ],
        answer: `A`,
      },
    ],
  },
  {
    id: 'prediction_monitoring',
    title: 'Prediction Distribution Monitoring',
    subtitle: 'Output distribution shift, score distribution, confidence calibration drift',
    difficulty: 'intermediate',
    estimatedMin: 35,
    tags: ['prediction monitoring', 'score distribution', 'output drift'],
    summary: `Labels arrive days or weeks after predictions. Infrastructure metrics show nothing wrong.

But the model is silently failing because its inputs have shifted in ways that change its behavior, and no one can see it yet. Prediction distribution monitoring is the only early-warning signal available in the gap between when a prediction is made and when the label arrives. Shifts in the prediction score distribution reveal model behavior changes without needing ground truth — they're detectable in real time, within hours of the change. A bimodal score distribution (confident in both directions) shifting to unimodal (uncertain about everything) is a signal something has changed. A mean score drifting down for a fraud model is a signal worth investigating immediately, not in seven days when labels arrive.`,
    keyPoints: [
      `**Score distribution monitoring: for binary classifiers, track the histogram of P(y=1|x) over a rolling daily window.** A well-functioning model tends to produce a bimodal distribution — predictions clustered near 0 and near 1, indicating confidence. When the distribution collapses to unimodal near 0.5, the model is uncertain about everything it's seeing. That pattern is a leading indicator of input drift or concept drift, detectable days before any label-based metric moves.`,
      `**Prediction entropy: H(ŷ) = -ŷ log ŷ - (1-ŷ) log(1-ŷ) for binary classifiers.** Higher mean entropy means more uncertain predictions. Track mean prediction entropy daily — sustained increases correlate with model performance degradation and provide a single scalar metric that's easier to threshold than the full score distribution histogram.`,
      `**Positive rate drift: track the fraction of predictions classified as positive at the operating threshold over time.** A sudden spike means the model is flagging more instances than before — either real-world positives increased (benign) or the score distribution shifted upward (the model is miscalibrated for new inputs). A sudden drop means the model is missing positives — especially dangerous for fraud and safety-critical applications where false negatives accumulate silently.`,
      `**Class distribution of predictions for multi-class models: track per-class prediction frequency.** If fraud_type_A was 5% of predictions and drops to 0.5%, either that fraud type decreased (verify with business intelligence) or the model is failing to detect it (concept drift). Both explanations matter, but they have different remedies — one requires no action, the other requires retraining. Unlabelled prediction monitoring can flag the signal; investigation determines the cause.`,
      `**Confidence calibration drift: the prediction distribution can look stable while the model's confidence becomes miscalibrated.** A model that was 90% accurate when it predicted 0.9 last month may now be only 70% accurate on those same predictions. Track the reliability diagram on a rolling basis using any available labels — even a 5-day lag provides enough signal to detect calibration drift before it becomes a business problem.`,
      `**PSI on prediction scores: compute PSI on the model's output score distribution daily.** PSI above 0.2 on model output is a strong signal of performance degradation even before any labels arrive. It's actionable: it tells you the model's behavior has changed significantly, even if you don't yet know whether that change is driven by input drift or concept drift.`,
      `**Leading vs lagging indicators: prediction distribution monitoring is a leading indicator — it detects that something changed within hours, even if it can't explain what.** Label-based metrics (accuracy, AUC, recall) are lagging — they require labels and provide the definitive answer but only after the lag period. Use leading indicators to trigger investigation; use lagging indicators to confirm the diagnosis and measure severity.`,
    ],
    checkQuestions: [
      {
        q: `Your fraud model's average prediction score has drifted from mean=0.12 to mean=0.08 over 2 weeks. Labels are delayed 7 days. What do you do now?`,
        options: [
          `A) Wait 7 days for labels to arrive before taking any action — acting on unlabelled signals risks unnecessary retraining that could hurt performance`,
          `B) Immediately retrain the model on the most recent 30 days of data and redeploy — score drift of this magnitude always indicates concept drift requiring full retraining`,
          `C) Check feature distributions and full score distribution now, query business intelligence for fraud rate changes, then act on the diagnosis when 7-day labels confirm precision/recall impact`,
          `D) Raise the classification threshold to compensate for the lower scores — if mean dropped from 0.12 to 0.08, lowering the threshold by 0.04 will restore the original positive rate`,
        ],
        answer: `C`,
      },
    ],
  },
  {
    id: 'feature_importance_drift',
    title: 'Feature Importance Drift',
    subtitle: 'SHAP drift, permutation importance over time, what it reveals',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['feature importance', 'SHAP drift', 'model interpretation', 'monitoring'],
    summary: `Knowing that model performance degraded tells you something broke. Knowing which feature drove the degradation tells you what to fix. Feature importance drift solves the debugging efficiency problem: instead of checking all 50 features when performance drops, SHAP drift shows you which features the model has started relying on differently. A feature that ranked top-3 at training but now ranks 15th has likely become less predictive or less reliable — either its distribution has shifted into territory the model wasn't trained on, or the feature pipeline broke. The alternative — manually investigating each feature one at a time — takes days. SHAP drift narrows that to hours.`,
    keyPoints: [
      `**SHAP drift: compute mean absolute SHAP value per feature on a rolling window of production predictions, then compare against training-time SHAP importances.** A feature that ranked top-3 at training but now ranks 15+ has lost influence in the model's decisions — either because its values have shifted to a range where the model learned a flat response, or because it's being masked by correlated features that have also shifted. SHAP drift is the diagnostic that connects distribution monitoring to model behavior.`,
      `**Permutation importance drift: periodically compute permutation importance on held-out recent data with available labels, then compare feature rankings over time.** Permutation importance measures how much model performance drops when a feature's values are randomly shuffled — a direct measure of predictive contribution. Requires labels, so it runs on a delay, but it's more trustworthy than SHAP drift for confirming that a feature has become genuinely less predictive rather than just less used by the model.`,
      `**When a high-importance feature drifts significantly, it is the most likely root cause of model performance degradation.** SHAP drift narrows the investigation space from "check everything" to "start here." In practice, most model performance incidents trace back to one or two features — a data pipeline change, a schema shift, or a behavioral change in what that feature measures. SHAP drift surfaces these within hours of the change, not after a full performance audit.`,
      `**Correlation breakdown: models exploit correlations between features.** If features A and B were strongly correlated at training time (correlation 0.8) and the model used B as a proxy for A, but their correlation drops to 0.2 in production, the model's use of B as a proxy becomes unreliable. Monitor inter-feature correlations over time — correlation breakdown is a failure mode that neither per-feature drift monitoring nor performance monitoring catches reliably on its own.`,
      `**Feature importance inversion: a feature that was positively correlated with the target at training time (higher value → more likely positive) becomes negatively correlated in production (higher value → less likely positive).** SHAP values for that feature flip sign. Monitor mean SHAP value (not just absolute mean SHAP) to detect directional inversions — absolute importance looks the same whether the feature is helping or hurting.`,
      `**Actionable signals from SHAP drift: three combinations matter.** High SHAP drift plus high historical importance — investigate immediately, this feature is the likely cause of any performance drop. High SHAP drift plus low historical importance — monitor but low priority, the feature's influence was small so its drift has limited impact. No SHAP drift but performance dropped — the feature distributions are stable but the relationship between features and target has changed (concept drift), not feature pipeline drift.`,
      `**Operational cost of SHAP computation: computing full SHAP values for 1M daily predictions is expensive, especially for neural models.** Use TreeSHAP for tree-based models (exact SHAP in O(T×L×d) time, extremely fast). For neural models, compute SHAP on a stratified 1-5% sample rather than all predictions. Approximations are sufficient for monitoring purposes — the goal is detecting large shifts, not precise attribution for individual predictions.`,
    ],
    checkQuestions: [
      {
        q: `SHAP drift analysis shows that "device_type" has gone from importance rank 2 to rank 19 over the past month. What does this mean and what do you investigate?`,
        options: [
          `A) The model has overfit to device_type during training; the rank drop means production data is restoring the correct lower importance — no investigation needed`,
          `B) device_type became much less influential; investigate data drift (new device types dominating traffic), concept drift (device_type-target relationship weakened), or a feature pipeline issue returning null/unknown for many users`,
          `C) SHAP rank changes are unreliable noise; only permutation importance on labelled data can confirm a real change — wait for weekly permutation importance results before acting`,
          `D) The rank drop confirms concept drift affecting all features equally; the correct response is immediate full retraining on the last 30 days of data`,
        ],
        answer: `B`,
      },
    ],
  },
  {
    id: 'calibration_monitoring',
    title: 'Calibration Monitoring in Production',
    subtitle: 'Reliability diagrams from logged predictions, ECE over time, recalibration triggers',
    difficulty: 'intermediate',
    estimatedMin: 35,
    tags: ['calibration', 'ECE', 'reliability', 'production monitoring'],
    summary: `A model that outputs a score of 0.8 is implicitly claiming "80% probability of the positive class." If that claim is wrong — if predictions of 0.8 are actually correct only 60% of the time — then every system built on top of that score is making decisions based on a miscalibrated number. Threshold-based decisions (flag for review if score > 0.7) systematically miss cases they should catch. Cost-sensitive classifiers that weight decisions by predicted probability take the wrong action. Downstream stacking models are fed wrong inputs. Calibration is good at training time and then degrades invisibly in production as distribution shift and concept drift accumulate. The first sign is usually a business metric — too many false positives, or a fraud rate higher than the model's scores suggest. By then, calibration has been off for months.`,
    keyPoints: [
      `**Online calibration tracking: group predictions into buckets (0-0.1, 0.1-0.2, ..., 0.9-1.0) and track the actual positive rate within each bucket using a rolling window of arriving labels.** Plot as a reliability diagram — a well-calibrated model produces a diagonal line where predicted probability equals actual positive rate. Divergence from the diagonal in any bucket is actionable: overconfidence (predicted 0.9, actual 0.6) or underconfidence (predicted 0.5, actual 0.75).`,
      `**ECE over time: Expected Calibration Error is the weighted average absolute difference between predicted probability and actual positive rate across all buckets.** Alert when ECE exceeds the deployment baseline by a meaningful margin — for a model deployed with ECE 0.02, an alert at ECE 0.05 is a reasonable trigger. An ECE tripling over four months (0.03 → 0.09) is significant degradation that warrants immediate action, not a footnote in the monthly model review.`,
      `**Overconfidence drift is the most common post-deployment calibration failure.** After concept drift, the model continues to assign high-confidence predictions to patterns that no longer reliably indicate the positive class — predictions cluster at 0.9+ but actual positive rate in that bucket drops to 0.6. The reliability diagram shows the high-confidence bins dramatically above the diagonal. This pattern is dangerous because systems built on high-confidence thresholds suddenly start acting on unreliable scores.`,
      `**Underconfidence drift is less common but occurs when new data is systematically out-of-distribution across many features simultaneously.** The model assigns conservative scores near 0.5 to inputs it's uncertain about. The result is that precision is low (too many false positives at standard thresholds) and recall is low (high-confidence positives are rare). The reliability diagram shows the middle bins dramatically below the diagonal.`,
      `**Recalibration without retraining: when calibration has drifted but the model's discriminative ability (AUC) remains intact, recalibration is far cheaper than retraining.** Platt scaling fits a logistic regression on top of the model's raw scores using recent labelled data — a few hours of work versus a full retraining pipeline. Temperature scaling divides the raw logit by a learned scalar. Both require only 1000+ recent labelled samples. Trigger recalibration when ECE exceeds the threshold for 3+ consecutive days.`,
      `**Label delay impact on calibration monitoring: calibration can only be measured when labels arrive.** For a model with a 7-day label delay, calibration monitoring has a 7-day lag. Design the monitoring window to account for this: compute calibration on a 14-day rolling window of labelled predictions, not on the most recent 24 hours where most labels haven't arrived yet. Ignoring this produces a calibration curve that looks fine for the past 7 days because the data for that period hasn't been evaluated.`,
      `**Segment-level calibration: aggregate calibration metrics can look fine while specific user segments are severely miscalibrated.** A loan default model well-calibrated on average may be systematically overconfident for one demographic and underconfident for another. Per-segment reliability diagrams catch this pattern. Segment-level miscalibration is both a fairness concern and an accuracy concern — decisions made on miscalibrated segment scores are systematically wrong for that population.`,
    ],
    checkQuestions: [
      {
        q: `A loan default model's ECE has increased from 0.03 (at deployment) to 0.09 (current) over 4 months. Reliability diagram shows the model is now overconfident for predictions > 0.7. What is your response?`,
        options: [
          `A) No action needed yet — ECE of 0.09 is still below the commonly cited 0.1 threshold; schedule a review next quarter when data volume is larger`,
          `B) Retrain the full model immediately — calibration degradation always indicates concept drift, and recalibration without retraining only masks the underlying problem`,
          `C) Run a chi-squared test on the prediction distribution to confirm the calibration shift is statistically significant before committing to any remediation`,
          `D) ECE tripling (0.03→0.09) is significant; lower the decision threshold as a temporary fix, recalibrate with Platt or temperature scaling on recent labelled data, then investigate whether concept drift requires full retraining`,
        ],
        answer: `D`,
      },
    ],
  },
  {
    id: 'silent_model_staleness',
    title: 'Silent Model Staleness',
    subtitle: 'When models decay without alerts, leading indicators, staleness signals',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['model staleness', 'silent failure', 'monitoring', 'model decay'],
    summary: `Alert-based monitoring catches sudden failures. It does not catch gradual ones.

A model degrading at 0.3% per day will go 90 days before losing 25% of its performance — each individual day's change is statistically indistinguishable from noise, so no alert fires. Meanwhile, business metrics accumulate losses quietly. Dashboards show green. Engineers are working on other things. The first signal is a business stakeholder asking why the metric has been declining for three months. Silent model staleness is not a gap in alerting sensitivity — it's a fundamental failure mode of threshold-based monitoring. The remedy is a combination of leading indicators that accumulate weak signals before any single one crosses a threshold, time-based retraining SLAs independent of alert state, and shadow training to provide a direct comparison against a fresh model.`,
    keyPoints: [
      `**Gradual concept drift is invisible to threshold-based monitoring.** Each day's error rate change is 0.1%, far below any reasonable alert threshold of 1-2%. Over 90 days, 0.1%/day compounds to 8-9% degradation — significant, but never visible in daily comparisons. This is why "alert on threshold breach" is insufficient as a complete monitoring strategy for slowly-evolving domains like fraud, credit scoring, and churn prediction.`,
      `**Alert threshold miscalibration: thresholds set conservatively to reduce false positives may never fire even during significant real degradation.** A PSI threshold of 0.25 set to avoid daily noise may only trigger when drift is so severe that the model is already substantially degraded. Calibrate thresholds against historical degradation events — look at past incidents where performance dropped 10%+ and check what the drift metrics showed at the time. Set thresholds that would have caught those events one week earlier.`,
      `**Leading indicators that accumulate weak signals: prediction entropy increasing slowly over weeks.** Feature importance drift accumulating across multiple features. Prediction-label correlation decreasing on rolling windows of arriving labels. Feature distribution shift building across multiple low-priority features simultaneously. No single signal crosses an alert threshold, but all of them moving in the same direction is a staleness signature.`,
      `**Staleness index: aggregate multiple weak signals into a single composite score.** Combine feature PSI scores (weighted by feature importance), prediction distribution shift, ECE drift, and label correlation into a single staleness index. Alert when the composite index exceeds a calibrated threshold — this catches the "everything moving a little" pattern that individual metric thresholds miss. The index must be calibrated against historical data to avoid becoming another noisy alert.`,
      `**Time-based retraining SLAs: the most robust defense against silent staleness is retraining on a schedule, regardless of alert state.** Monthly retraining for slow-drifting domains. Weekly for fast-moving ones like fraud. This eliminates reliance on any monitoring system catching gradual drift before it matters. The tradeoff is training cost — but for models where staleness has real business impact, the cost of retraining monthly is almost always less than the cost of 90 days of silent degradation.`,
      `**Shadow retraining: continuously train a challenger model on recent data in the background.** Compare champion vs challenger on held-out recent data weekly. If the challenger significantly outperforms the champion on recent data, that gap is a staleness signal — the champion would perform better if retrained. Shadow retraining provides this signal without requiring any ground-truth performance metrics to degrade visibly, and it produces a ready-to-deploy replacement when the signal is actionable.`,
      `**Model age as a leading signal: track time since last retraining on internal dashboards and correlate with downstream business metrics over historical data.** Build an empirical age-vs-degradation curve: at this model's historical drift rate, how much performance is lost per month of staleness? Use that curve to set a retraining SLA — "this model loses 2% AUC per month, so we retrain if it's been more than 6 weeks." Empirical curves are domain-specific and more actionable than generic rules.`,
    ],
    checkQuestions: [
      {
        q: `How would you design a staleness detection system for a recommendation model where engagement labels are available daily but the model is retrained monthly?`,
        options: [
          `A) Multi-layer detection: real-time PSI on output scores (alert if PSI > 0.15); daily CTR on top-10 vs rolling 30-day baseline (alert if CTR drops >5% for 3+ days); weekly NDCG@10 vs post-deployment reference; monthly shadow-train challenger and promote if challenger wins NDCG by >1%`,
          `B) Single-layer detection is sufficient: compute NDCG@10 weekly on a held-out sample and alert if it drops more than 3% below the post-deployment baseline — adding more layers increases complexity without improving detection speed`,
          `C) Rely on the monthly retraining schedule alone — for a model retrained monthly, staleness cannot meaningfully accumulate within that window, so additional detection layers add operational overhead without benefit`,
          `D) Monitor only prediction entropy daily — if entropy stays stable, the model is not stale; if entropy rises, trigger an immediate retrain regardless of how long since the last training run`,
        ],
        answer: `A`,
      },
    ],
  },
  {
    id: 'alerting_runbooks',
    title: 'Alerting & Runbooks',
    subtitle: 'Alert thresholds, alert fatigue, P1/P2/P3 classification, runbook structure',
    difficulty: 'intermediate',
    estimatedMin: 35,
    tags: ['alerting', 'runbooks', 'incident response', 'on-call'],
    summary: `An on-call engineer who receives 50 alerts per day and finds that 80% of them require no action will stop treating alerts as urgent within two weeks. Alert fatigue is not a personality problem — it's a calibration problem. When false positive rate is high, the rational response is to deprioritize alerts. The first alert that gets ignored during a genuine incident because the engineer assumed it was another false positive is where alert fatigue causes direct business damage. Every alert that fires should require an action. Every alert should have a runbook — a documented response procedure that allows any on-call engineer to diagnose and remediate the issue without expertise in the specific model. Without runbooks, alerts are noise even when they're accurate.`,
    keyPoints: [
      `**P1 (Critical): the model is producing no value or actively causing harm.** Examples: prediction endpoint returning errors for more than 5% of requests, AUC dropping below the minimum acceptable business threshold, fraud model recall dropping below 50% (half of fraud is going undetected). Requires an immediate page with 15-minute response SLA. Every minute of P1 has a quantifiable business cost — know what that cost is so escalation decisions are grounded in business impact, not intuition.`,
      `**P2 (High): significant degradation with a time-sensitive response window.** Examples: ECE above 0.1 for 24 consecutive hours, PSI above 0.25 for the top-5 most important features, prediction latency P99 above 500ms, prediction endpoint error rate above 1%. Response required within 2 hours. P2 incidents are usually approaching P1 territory — acting within 2 hours prevents escalation.`,
      `**P3 (Medium): gradual degradation that needs a planned remediation, not an emergency response.** Examples: PSI above 0.15 for secondary features, challenger model outperforming champion in shadow evaluation, model age exceeding the retraining SLA, ECE increasing for 3+ consecutive days without crossing the P2 threshold. Response within 1 business day — create a ticket, assign it, schedule the fix. P3 items that go unaddressed accumulate into P1 incidents.`,
      `**Alert fatigue fix: audit every alert that fired in the last 30 days and classify each as true positive (action was taken), false positive (no action required), or ambiguous (unclear whether action was needed).** For high false-positive alerts: raise thresholds, add duration requirements (must persist for at least 1 hour before paging), or demote from paging to informational. Target: the average on-call engineer should receive fewer than 5 actionable alerts per day. Any alert with zero true positives in 3 months should be removed or converted to a dashboard-only metric.`,
      `**Alert conditions — sustained breach vs instantaneous: a single-second spike in PSI is noise.** PSI above 0.2 for 3 consecutive hours is signal. Use sustained threshold breaches rather than instantaneous ones to eliminate transient noise. Add hysteresis: alert when the metric crosses the threshold upward, clear only when it drops back below the threshold minus a buffer. This prevents rapid on/off cycling that generates spurious pages.`,
      `**Runbook structure: a runbook that says "investigate the model" is not a runbook.** Each runbook needs: (1) Plain English description of what triggered the alert and why it matters. (2) Business impact if unaddressed — what breaks, and how fast? (3) Exact diagnosis steps with links to dashboards and specific queries to run. (4) Remediation options ranked by effort and impact, with expected outcomes. (5) Escalation path if initial steps fail — who to wake up and when. (6) Post-incident section — what long-term change prevents this recurrence.`,
      `**Runbook maintenance: a runbook written at deployment becomes stale within months.** The serving environment changes. New upstream systems are added. Feature pipelines are refactored. After every incident, review the runbook: was it accurate? Did it lead to the correct diagnosis? Did it miss a step that the engineer had to figure out manually? Update it immediately after the incident while the context is fresh. Assign quarterly review ownership — runbooks without owners become documentation debt that makes incidents worse instead of better.`,
    ],
    checkQuestions: [
      {
        q: `Your on-call engineer receives 50 alerts per day, most of which turn out to be false positives. How do you fix this?`,
        options: [
          `A) Increase the on-call rotation size so each engineer handles fewer alerts per shift — the volume is manageable if distributed across more people`,
          `B) Disable all non-P1 alerts immediately and rebuild the alerting system from scratch with stricter thresholds across the board`,
          `C) Audit alerts over 30 days (classify true/false positive), tighten thresholds and add duration requirements for high-FP alerts, remove alerts with zero true positives in 3 months, target <5 actionable alerts/day, and run retrospectives after any missed incidents`,
          `D) Convert all alerts to informational (non-paging) and require engineers to check dashboards proactively each morning — this eliminates false positive pages without losing signal coverage`,
        ],
        answer: `C`,
      },
    ],
  },
]
