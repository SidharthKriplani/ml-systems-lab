export const MONITORING_MODULES = [
  {
    id: 'monitoring_taxonomy',
    title: 'Monitoring Taxonomy',
    subtitle: 'Data drift, concept drift, model decay, infrastructure drift',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['monitoring', 'drift', 'model decay', 'MLOps'],
    summary: `Your production fraud model is suddenly catching 30% fewer frauds. Something changed. You have four possible causes sitting in front of you: the \`income\` feature distribution shifted and the model is seeing a different population than it was trained on; fraud patterns changed so that the same transaction profile now has a different fraud probability; the overall fraud rate in the population increased but the model's per-transaction accuracy is unchanged; or the feature pipeline is broken and sending null values downstream. Each of these requires a completely different response. Without a taxonomy you are debugging blind.

The four types map onto four distinct questions. Data drift asks: has P(X) changed? The input feature distributions have shifted — your population of transactions now has a different income distribution than your training set. Detection uses statistical tests (PSI, KS, chi-squared) on feature distributions. Response: investigate the root cause; data drift may or may not affect model performance depending on whether P(Y|X) also changed. Concept drift asks: has P(Y|X) changed? The relationship between features and outcome changed. The same transaction profile that was 3% fraud probability is now 15% fraud probability because fraud tactics evolved. Detection requires labels — you measure performance degradation over time. Response: retraining on recent data is necessary. Prior shift asks: has P(Y) changed while P(X|Y) stayed stable? Overall fraud rate increased from 1% to 3% — more frauds exist, not different frauds. Response: threshold adjustment may be sufficient; sometimes retraining. Infrastructure drift asks: is the pipeline itself broken? Schema changed, pipeline latency increased, a dependency service degraded. Response: engineering fix, not a model fix.

The diagnostic power of this taxonomy is that it shortcircuits the response. A broken feature pipeline and a genuine concept drift can produce identical drops in recall. But fixing concept drift with an engineering patch does nothing, and fixing a broken pipeline by retraining wastes a week and leaves you exactly where you started. The taxonomy is not academic — it is the difference between a 30-minute fix and a week of wasted retraining work.

**NOT this.** "Monitor the model's output score distribution and you're covered." Output monitoring tells you the model's behavior changed — not why. Input monitoring on feature distributions tells you what changed in the data. Infrastructure monitoring tells you if the cause is not in the data at all. You need all four layers to distinguish a concept drift that requires retraining from a feature pipeline bug that requires a 30-minute engineering fix. Collapsing all degradation into "model problem" is the most expensive mistake in production ML operations.`,
    keyPoints: [
      `**Build four monitoring layers in order: infrastructure → data → predictions → performance.** Infrastructure (latency, error rate) and prediction monitoring give you real-time signals. Data drift and performance monitoring give you explanatory power. The order matters — a 5% endpoint error rate is infrastructure, not drift. Mixing up the layer diagnosis means applying the wrong remedy.`,
      `**Trap: conflating data drift with model performance degradation.** A feature can drift significantly without affecting model performance (if the model is robust to that variation) or affect it minimally (if that feature's importance is low). Always measure whether performance actually degraded before triggering retraining. Reflexive retraining on every drift alert wastes pipeline compute and can introduce regressions on stable segments of the population.`,
      `**Diagnostic: when performance drops, check the four layers simultaneously and look for which combination fires.** Infrastructure clean + data drifting + performance degrading = concept or data drift requiring investigation. Infrastructure clean + data clean + performance degrading = concept drift in a dimension not covered by your feature monitoring. Infrastructure errors + data clean = pipeline bug requiring an engineering fix. The combination is the diagnosis.`,
    ],
    interactivePrompt: `Before you touch the controls: your fraud model is flagging 30% fewer transactions as fraud today with no code changes deployed — which of the four drift types do you investigate first, and why does the order matter?`,
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
    takeaway: `A drop in model performance has four possible causes — data drift, concept drift, prior shift, and infrastructure drift — and applying the wrong remedy to any of them wastes time while the problem compounds.`,
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
    summary: `A credit scoring model trained in 2019 and deployed through 2020. The global pandemic hits in March 2020. Employment patterns, spending behavior, and default rates shift overnight. The model's features — employment status, recent spending, credit utilization — were trained on pre-pandemic relationships. Post-pandemic, the same feature values predict default probability completely differently. Someone who is employed with stable recent spending is a much worse risk than the pre-pandemic data would suggest, because the macro environment changed everything. The model's PSI on individual features is 0.35 — severe. But even before PSI fires, the model's error rate on the post-March cohort is already compounding. This is sudden concept drift — the worst kind, because it doesn't announce itself gradually.

Concept drift has three temporal patterns that require different detection approaches. Sudden drift is an abrupt regime change triggered by a specific event: COVID, a regulatory change, a major competitor launch. It happens at a specific point in time. Detection uses Page-Hinkley test — a cumulative sum of errors exceeds a threshold — or ADWIN (Adaptive WINdowing), which compares a recent window against a historical window and shrinks the window size when drift is detected. With sudden drift, the ADWIN window collapse is visible within days. Gradual drift is a slow behavioral shift: user base aging, seasonal trends evolving, category preferences shifting over months. Each day's change is imperceptible. Detection uses exponential moving average of error rate, alerting when it exceeds a control limit over a sustained window. No single day looks alarming; the trend over 90 days does. Recurrent drift follows a pattern that comes back: holiday shopping fraud patterns, annual economic cycles, weekend vs. weekday user behavior. Detection uses time-series decomposition of error rate. The response to recurrent drift is not retraining — it is maintaining seasonal models and switching between them on schedule.

The detection lag is the central constraint. Concept drift is fundamentally defined against labels — you can only confirm it by observing actual outcomes. For a credit model with 30-day label delay, drift can run undetected for a month. For a fraud model with 7-day chargeback delay, the lag is a week. PSI on features and prediction score distribution provide earlier proxy signals, but these fire based on distribution shift, not confirmed outcome shift. Use them as leading indicators that trigger investigation, not as confirmations of drift.

**NOT this.** "Concept drift always requires full model retraining." Sudden drift almost always requires retraining on recent data — the pre-drift patterns are no longer valid. Gradual drift can sometimes be corrected with online weight updates or recalibration. Recurrent drift is best handled by maintaining seasonal models and switching between them. Retraining from scratch is the most expensive option. Exhaust cheaper recalibration and threshold adjustment first, then retrain only when cheaper interventions fail to close the performance gap.`,
    keyPoints: [
      `**Set up an automated concept drift detection pipeline that monitors prediction accuracy on delayed labels — this is the ground truth signal.** PSI and KS on features are early warning indicators that something may have changed. Model performance on actual labels is the definitive measure of whether that change matters. Run both: features give you the 7-day early warning, labels give you the confirmation that warrants retraining.`,
      `**Trap: retraining on only the most recent data after sudden drift.** If pre-drift patterns still apply to a large portion of your user base — customers who were not affected by the regime change — a model trained only on post-drift data will regress on those users. Use a sliding window that includes enough pre-drift history to maintain performance across the full distribution. Validate on both pre-drift and post-drift held-out data before deploying.`,
      `**Diagnostic: after detecting drift, split validation data by time period — before and after the suspected drift date.** If pre-drift accuracy is high and post-drift accuracy is low, you have confirmed the drift date. Retrain on post-drift data and verify that the performance gap closes. If it does not close after retraining, the features themselves may be insufficient to represent the new target relationship — feature engineering is required, not just data recency.`,
    ],
    interactivePrompt: `Before you touch the controls: your credit model's error rate has been climbing 0.2% per week for the past 8 weeks — what detection algorithm would catch this, and why wouldn't a simple threshold alert have fired?`,
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
    takeaway: `Concept drift means the world changed and the model didn't — detect it with label-based accuracy on delayed ground truth, distinguish sudden from gradual from recurrent to pick the right response, and exhaust recalibration before committing to full retraining.`,
  },
  {
    id: 'prediction_monitoring',
    title: 'Prediction Distribution Monitoring',
    subtitle: 'Output distribution shift, score distribution, confidence calibration drift',
    difficulty: 'intermediate',
    estimatedMin: 35,
    tags: ['prediction monitoring', 'score distribution', 'output drift'],
    summary: `Fraud model deployed. No labels for 7 days — chargebacks take 7 days to confirm. Infrastructure metrics show normal latency and 0% error rate. You have no way to measure accuracy until next week. But you can see predictions right now, and three signals are already telling you something changed.

The mean predicted fraud probability was 3.1% last month. This month it is 2.7%. A 0.4 percentage point drop in mean score is the model scoring this week's transactions as less risky than last month's. Whether that is correct or not, it is a signal worth investigating. The fraction of predictions above 0.8 confidence dropped from 12% to 4%. The model is becoming uncertain about cases it used to decide confidently. Last month's score histogram was bimodal — clear fraud at the high end, clear non-fraud at the low end, with a trough in the middle. This month it is unimodal near 0.5. The model has lost its discriminative ability.

Each of these signals has a specific interpretation. Score distribution drops indicate either that fewer high-risk events are occurring (possible ground truth) or that a feature shifted negative (pipeline issue). High-confidence rate dropping indicates that the input distribution moved out of the model's training distribution — the model is seeing data it has not been trained on at the current scale. Histogram flattening indicates that a key discriminative feature is missing or corrupted — without it, the model cannot separate the two classes.

Statistical tests for prediction monitoring use the same machinery as feature drift monitoring. PSI on the score distribution gives the same 0.1/0.2 thresholds. Jensen-Shannon divergence between current and reference score histogram is bounded in [0, 1] and easy to threshold. Z-test on mean score shift catches systematic upward or downward movement.

**NOT this.** "Prediction monitoring tells you if the model is wrong." Prediction monitoring tells you if the model's behavior changed. You do not know if the change is correct — perhaps genuine fraud rates decreased and the lower scores are accurate — or wrong, because a feature pipeline broke. Prediction monitoring is your earliest warning system. It fires days before delayed labels arrive. When it fires, the correct response is to investigate inputs, not to assume the model is broken and retrain immediately.`,
    keyPoints: [
      `**Set reference baselines for score distribution, high-confidence rate, and histogram shape from the first 4 weeks of deployment — these are your "healthy" benchmarks.** Alert when current statistics deviate more than 2σ from baseline. The 4-week window captures natural weekly variation so that normal Monday-vs-Friday patterns do not generate spurious alerts.`,
      `**Trap: setting alert thresholds too tight.** If your score distribution naturally varies ±15% week-over-week due to business seasonality, a 2σ threshold generates constant alerts. Calibrate thresholds based on observed natural variation from the first month of production traffic, not on theoretical distributions. A threshold that produces more than one alert per week during normal operation needs to be widened.`,
      `**Diagnostic: when prediction distribution shifts, check the feature distributions of high-confidence positive predictions specifically.** If a key feature — for example, \`transaction_velocity\` — has suddenly shifted for high-confidence predictions, the feature pipeline is the root cause. If feature distributions are clean for high-confidence predictions but the score distribution has still shifted, the change is in the data itself, not the pipeline — possible concept drift or genuine fraud rate change.`,
    ],
    interactivePrompt: `Before you touch the controls: the fraud model's mean prediction score dropped from 3.1% to 2.7% this week with no code changes — name two different root causes that would produce identical score distribution shifts.`,
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
    takeaway: `Prediction distribution monitoring is your earliest warning — it fires days before delayed labels arrive — but a changed score distribution tells you behavior changed, not whether the change is correct or wrong.`,
  },
  {
    id: 'feature_importance_drift',
    title: 'Feature Importance Drift',
    subtitle: 'SHAP drift, permutation importance over time, what it reveals',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['feature importance', 'SHAP drift', 'model interpretation', 'monitoring'],
    summary: `Fraud detection model deployed six months ago. Feature importances at deployment: \`transaction_velocity\` (0.32), \`device_age\` (0.21), \`ip_reputation\` (0.18). Six months later, the importances have inverted: \`ip_reputation\` (0.38), \`transaction_velocity\` (0.12), \`device_age\` (0.09). \`ip_reputation\` has taken over as the dominant signal.

The investigation reveals why. The fraud team had been aggressively blocking high-risk IPs over the past six months. As a result, the fraud transactions that survived the IP block now come from IP addresses that had never been flagged — IP reputation in the residual fraud population is concentrated in the low-risk range. The model learned that low-reputation IPs are now the reliable signal, because that is what the surviving fraud looks like. The model is now dramatically more vulnerable to IP spoofing attacks, because it is relying on a signal that its own upstream actions have made gameable.

This is the fundamental reason feature importance drift is worth monitoring. It is not just a measure of what the model is doing — it is a diagnostic for how the world has changed relative to the model's assumptions. Four mechanisms drive importance drift. A feature's distribution shifts, reducing its variance and therefore its discriminative power. The target population shifts due to the model's own actions or external factors, changing which examples remain in the distribution. Feature quality degrades due to pipeline issues, making a feature noisy or partially null. New correlations emerge — a feature uncorrelated with the target becomes correlated due to behavioral changes.

Monitoring approach: compute SHAP values or permutation importance on a rolling sample of 1,000 production predictions per week. Track top-K feature importances over time. Alert when a feature's importance rank changes by more than 3 positions or its absolute importance changes by more than 20%.

**NOT this.** "Feature importance is a fixed property of the model." Feature importance is a joint property of the model AND the input distribution. The same model weights produce different importances when the input distribution shifts. If you want to know whether your feature pipeline is degrading, monitoring importance drift is more sensitive than monitoring accuracy — it changes before accuracy drops. A feature pipeline bug that corrupts one feature shows up in importance drift within days, before it has accumulated enough label evidence to move the accuracy metric.`,
    keyPoints: [
      `**Monitor SHAP-based feature importance weekly on a rolling production sample — it catches feature pipeline degradation and concept drift earlier than any accuracy-based metric.** A feature that drops from rank 2 to rank 15 in one week has either lost its signal (distribution collapsed) or its pipeline broke. Either way, you know where to look before accuracy confirms the damage.`,
      `**Trap: using training-time feature importance as the production reference.** Training importance reflects the training distribution. Compute production importance from actual production traffic and compare to your deployment-day baseline, not training-day baseline. The deployment-day baseline is your "healthy production" reference — it captures the live feature distribution, not the historical training distribution.`,
      `**Diagnostic: if importance shifts without a corresponding drift in that feature's own distribution, the target-feature relationship has changed — this is concept drift.** If importance shifts alongside distribution drift for that feature, the feature pipeline is the likely cause. The distinction determines whether you retrain (concept drift) or fix the pipeline (infrastructure drift). Running both feature distribution monitoring and importance monitoring in parallel gives you this diagnosis within one week.`,
    ],
    interactivePrompt: `Before you touch the controls: \`ip_reputation\` importance jumped from rank 3 to rank 1 over 3 months while its distribution stayed stable — does this indicate concept drift or a pipeline issue, and what is your next diagnostic step?`,
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
    takeaway: `Feature importance drift reveals how the world changed relative to the model's assumptions — a rank drop before accuracy moves means you have a week to fix a pipeline bug instead of a week after the damage is done.`,
  },
  {
    id: 'calibration_monitoring',
    title: 'Calibration Monitoring in Production',
    subtitle: 'Reliability diagrams from logged predictions, ECE over time, recalibration triggers',
    difficulty: 'intermediate',
    estimatedMin: 35,
    tags: ['calibration', 'ECE', 'reliability', 'production monitoring'],
    summary: `Insurance pricing model outputs a claim probability. At deployment, a prediction of 0.15 corresponds to a 15% actual claim rate — well-calibrated, exactly on the reliability diagram diagonal. Three months later, predictions of 0.15 correspond to a 22% actual claim rate. The model is now underestimating risk by 7 percentage points for this bucket. The pricing team is using the model's output directly for premium calculation. The mispricing has been accumulating for 3 months, silently undercharging high-risk customers. No alert fired. AUC is stable at 0.82.

This is calibration drift, and AUC will not catch it. AUC measures ranking quality — does the model score high-risk customers above low-risk ones? Calibration measures probability accuracy — does a score of 0.15 mean 15% probability? A model can have perfect AUC and terrible calibration simultaneously. It correctly ranks every customer by risk while being wrong about every customer's absolute risk level. For any application where the model's output is used as a probability — pricing, risk scoring, expected value calculations — both must be monitored independently.

The drift mechanism: as the input distribution shifts, the model's probability estimates no longer match the actual conditional probabilities in the new distribution. This happens even when discrimination stays stable. The model still knows who is riskier than whom; it just does not know by how much. Expected Calibration Error (ECE) = Σ (n_bin/n) × |mean_confidence_in_bin − accuracy_in_bin|, summed across prediction buckets. An ECE tripling from 0.03 at deployment to 0.09 after three months is actionable — it is not a monitoring footnote, it is mispricing at scale.

Recalibration does not require retraining the base model. Platt scaling fits a logistic regression on top of model outputs using recent labelled data — a few hours of work using 1,000 recent examples. Temperature scaling uses a single scalar T: new_prob = σ(logit / T). Both are fast and leave the base model unchanged. Trigger recalibration when ECE exceeds the deployment baseline by 0.03 for three consecutive days.

**NOT this.** "If AUC stays stable, calibration is fine." AUC and calibration measure orthogonal properties. A model can have AUC of 0.90 and ECE of 0.15 — it ranks everyone correctly but its probability estimates are off by 15 percentage points. For a fraud model making threshold decisions, miscalibration means your chosen threshold no longer corresponds to the precision-recall tradeoff you designed for. For an insurance pricing model, it means systematic mispricing. Monitor both, independently, on every batch of arriving labels.`,
    keyPoints: [
      `**Monitor ECE on every batch of ground truth labels that arrives — calibration drift is silent and systematic, exactly the kind of error that causes financial mispricing or risk misallocation to compound undetected.** Plot the reliability diagram alongside the ECE scalar: ECE tells you the magnitude, the diagram tells you which buckets are miscalibrated and in which direction.`,
      `**Trap: applying temperature scaling fit on stale data.** If you recalibrate using labels from 6 months ago, you are correcting for past calibration drift, not current. Fit recalibration only on recent labels from the last 30–60 days. A recalibration model trained on stale data can shift the current calibration in the wrong direction, making ECE worse instead of better.`,
      `**Diagnostic: if ECE is increasing but AUC is stable, apply temperature scaling as the first-line fix — it corrects the overall miscalibration in one parameter without retraining.** If ECE improvement from temperature scaling is greater than 0.03, the recalibration was justified. If improvement is less than 0.01, the problem is per-bucket conditional miscalibration rather than a uniform scaling issue, and isotonic regression is required instead.`,
    ],
    interactivePrompt: `Before you touch the controls: the insurance model's AUC held steady at 0.82 while ECE climbed from 0.03 to 0.09 — why doesn't stable AUC mean calibration is fine, and what business harm is already occurring?`,
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
    takeaway: `Calibration drift is invisible to AUC — monitor ECE on every label batch, recalibrate with Platt or temperature scaling on recent data when ECE crosses threshold, and never wait for a business stakeholder to notice the mispricing.`,
  },
  {
    id: 'silent_model_staleness',
    title: 'Silent Model Staleness',
    subtitle: 'When models decay without alerts, leading indicators, staleness signals',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['model staleness', 'silent failure', 'monitoring', 'model decay'],
    summary: `You took a 2-week vacation. No alerts fired. No pages. The model is "running fine." You come back and check the business metric the model drives. It has drifted 8% in the wrong direction over the last 10 days. No monitoring caught it because: feature drift was below the alert threshold on every individual feature, prediction distribution shifted slowly enough that no z-test alert fired, and the model is still responding with low latency and 0% error rate. The model is technically functioning and empirically wrong. This is silent model staleness.

Silent staleness is the default state of any production model without active monitoring. It does not require a failure event. It does not announce itself. It accumulates as the world changes while the model does not. User behavior, fraud patterns, economic conditions, and product features change constantly. The model keeps applying the patterns it learned 6 months ago to a distribution that no longer matches. The gap between what the model learned and what the world looks like now is the staleness — and it grows every day.

Detection requires multiple overlapping signals because no single signal is sufficient. Feature drift: PSI greater than 0.2 on any tier-1 feature. Prediction distribution drift: score mean or variance outside 3σ of deployment baseline. Business metric divergence: the KPI the model influences trends in the wrong direction for more than 5 consecutive days. Delayed label accuracy: when labels arrive, rolling accuracy on last 30 days is below deployment accuracy by more than 3 percentage points. Each of these can fail silently on its own — a 0.19 PSI that never crosses 0.2, a business metric decline that stays within noise. But when two or three fire simultaneously in the same direction, the combination is the staleness signal.

The most robust defense is time-based retraining SLAs independent of alert state. A model retrained monthly cannot go more than 4 weeks stale regardless of what monitoring missed. Shadow retraining — continuously training a challenger on recent data and comparing to the champion weekly — provides a staleness signal without requiring ground truth metrics to visibly degrade.

**NOT this.** "If the model is running, it's working." A model can process every request at normal latency with zero infrastructure errors and be empirically wrong on every prediction. Operational health and prediction quality are orthogonal. Correctness must be actively maintained and verified — it does not self-certify through uptime. Silent staleness is not a rare edge case. It is the expected outcome of any deployed model that is not actively monitored with overlapping leading indicators.`,
    keyPoints: [
      `**Deploy a composite health score for every production model — a single number that aggregates feature drift, prediction drift, and delayed accuracy into one signal.** Alert when it crosses a threshold. This creates a single pane of glass instead of 15 separate alerts that each stay below their individual threshold while collectively signaling degradation.`,
      `**Trap: relying only on label-based monitoring.** Labels can take days or weeks to arrive. By the time label-based accuracy confirms degradation, the model has been wrong for the entire label delay period. You need leading indicators — prediction distribution, feature drift — that fire days before labels confirm the diagnosis.`,
      `**Diagnostic: compare model performance in the first week after deployment to the most recent week.** If the gap is greater than 5 percentage points and no known change explains it, the model has gone stale. This 5-minute check should be part of every weekly team review — it catches gradual drift that no alert threshold was calibrated to catch.`,
    ],
    interactivePrompt: `Before you touch the controls: every individual monitoring metric is below its alert threshold, but the business KPI has drifted 6% in the wrong direction over 10 days — what does this pattern tell you, and what combination of signals would you check next?`,
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
    takeaway: `Silent staleness is the default state of any unmonitored model — detect it with overlapping leading indicators, build a composite health score to surface the "everything drifting a little" pattern, and set time-based retraining SLAs so no model ages past its empirically calibrated staleness limit.`,
  },
  {
    id: 'alerting_runbooks',
    title: 'Alerting & Runbooks',
    subtitle: 'Alert thresholds, alert fatigue, P1/P2/P3 classification, runbook structure',
    difficulty: 'intermediate',
    estimatedMin: 35,
    tags: ['alerting', 'runbooks', 'incident response', 'on-call'],
    summary: `The monitoring system fires 47 alerts in a week. The team acknowledges all of them. Fixes zero. The alerts have become background noise. Everyone has learned to ignore them. Two months later, a critical model failure goes undetected for 3 days because the alert fired — and no one acted on it. Alert fatigue has turned the monitoring system into a false sense of security.

Alert fatigue is not a personnel problem. It is a calibration problem. When false positive rate is high, the rational response is to deprioritize alerts. Engineers are not lazy; they are doing expected value calculations. An alert with a 20% action rate trains engineers to assume it is a false positive 4 times out of 5. The first genuine P1 that gets ignored during that calculation is where alert fatigue causes direct business damage.

A runbook is a documented procedure attached to an alert type: what triggered it (exact condition), what it means (business interpretation), severity (P0/P1/P2 classification), immediate action (page on-call? auto-rollback?), investigation steps (ordered list of what to check), and resolution options with a decision tree (if X then Y, if not then Z). Without a runbook, each alert requires the on-call engineer to re-derive the investigation procedure from first principles at 3am. The runbook converts expertise into a repeatable process that any engineer on the rotation can execute.

Alert design has four rules that reduce false positive rate. First, alerts must be actionable — if there is no clear action to take when it fires, it is a metric to monitor, not an alert to page on. Second, alerts must have a low false positive rate — above 20% and engineers start ignoring them. Third, severity routing separates P0 (model down, financial risk: page immediately) from P1 (significant drift, degrading: ticket for next business day) from P2 (early warning: weekly review queue). Fourth, alert deduplication groups related alerts and surfaces one with a root cause hypothesis instead of 15 cascading alerts from a single upstream failure.

**NOT this.** "More alerts = better monitoring." More alerts equals more noise equals ignored alerts equals worse monitoring than having fewer alerts. The goal is zero false positives, every alert actionable, every alert with a runbook. Start with 5 high-signal alerts and expand only when each new alert has a written runbook and a measured false positive rate below 20%. Never enable an alert you have not written a runbook for.`,
    keyPoints: [
      `**Write the runbook before enabling the alert — if you cannot write the runbook, you do not understand the alert well enough to act on it.** A runbook takes 30 minutes to write and saves hours per incident. The writing process itself forces you to answer the question: if this fires at 3am, what exactly does the on-call engineer do? If you cannot answer that, the alert is not ready to ship.`,
      `**Trap: setting uniform alert thresholds across all models and features.** A PSI threshold of 0.2 appropriate for a stable user behavior feature will fire constantly for a feature that naturally varies with seasonality. Calibrate thresholds per feature based on observed historical variation from the first 30 days of production traffic. A threshold calibrated to the feature's natural variation generates one-tenth the false positive rate of a uniform threshold.`,
      `**Diagnostic: track alert-to-action conversion rate monthly.** If more than 40% of alerts result in "no action taken," those alerts are generating noise. Tighten thresholds, add context to help engineers triage faster, add duration requirements (must persist for 1 hour before paging), or deprecate the alert entirely. An alert with zero true positives in 3 months is not a safety net — it is alert debt that degrades the team's response to real incidents.`,
    ],
    interactivePrompt: `Before you touch the controls: 47 alerts fired this week and the team fixed zero of them — what is the first metric you would compute to diagnose the alert system, and what threshold would trigger a redesign?`,
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
    takeaway: `Alert fatigue is a calibration problem, not a personnel problem — write the runbook before enabling the alert, calibrate thresholds per feature from observed production variation, and track alert-to-action conversion rate monthly to catch alert debt before it degrades incident response.`,
  },
]
