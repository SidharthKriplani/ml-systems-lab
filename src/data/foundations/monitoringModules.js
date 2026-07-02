export const MONITORING_MODULES = [
  {
    id: 'monitoring_taxonomy',
    title: 'Monitoring Taxonomy',
    subtitle: 'Data drift, concept drift, model decay, infrastructure drift',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['monitoring', 'drift', 'model decay', 'MLOps'],
    summary: `Your fraud model is suddenly catching 30% fewer frauds. Something changed — but what? Four very different causes could produce this exact drop. The \`income\` feature distribution shifted, so the model is seeing a different population than it trained on. Or fraud tactics evolved, so the same transaction profile now carries a different fraud probability. Or the overall fraud rate went up while the model's per-transaction accuracy is unchanged. Or the feature pipeline broke and is quietly sending nulls downstream. Each demands a completely different fix. Without a way to tell them apart, you are debugging blind.

[FIGURE: taxonomy]

---

**Four causes, four precise questions.**

*Data drift* asks: has **P(X)** changed? The inputs shifted — your transactions now have a different income distribution than training. You detect it with statistical tests (PSI, KS, chi-squared) on feature distributions. It may or may not hurt performance, depending on whether the input-output relationship also moved.

*Concept drift* asks: has **P(Y|X)** changed? The relationship itself moved — a profile that was 3% fraud is now 15% because tactics evolved. You can only confirm it with labels, by watching performance degrade. This one genuinely needs retraining on recent data.

*Prior shift* asks: has **P(Y)** changed while P(X|Y) held? The base rate went from 1% to 3% — more fraud, not different fraud. Often a threshold adjustment is enough.

*Infrastructure drift* asks: is the pipeline broken? Schema changed, latency spiked, a dependency degraded. That's an engineering fix, not a model fix.

---

**Why the taxonomy earns its keep.**

A broken pipeline and real concept drift can produce the *identical* drop in recall. But patch concept drift with an engineering fix and nothing improves; "fix" a broken pipeline by retraining and you burn a week to land exactly where you started. This is the difference between a 30-minute fix and a wasted week.

And that's why "just watch the output score distribution" isn't enough. Output monitoring tells you behavior changed, not *why.* Feature monitoring tells you what moved in the data. Infrastructure monitoring tells you if the cause isn't in the data at all. You need all four layers to separate a drift that needs retraining from a pipeline bug that needs a half-hour patch — and collapsing everything into "model problem" is the single most expensive habit in production ML.`,
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
      {
        q: `Recall dropped 30% overnight. Feature PSI is clean, prediction score distribution is unchanged, but the endpoint error rate jumped to 6%. Which layer is the cause?`,
        options: [
          `A) Concept drift — the input-output relationship P(Y|X) shifted and only labels will confirm the true magnitude of the change`,
          `B) Data drift — P(X) moved enough that the model is now scoring an unfamiliar population it never trained on`,
          `C) Infrastructure drift — clean features plus a 6% error rate points to a broken pipeline, an engineering fix not a model fix`,
          `D) Prior shift — the base rate P(Y) rose, so the fixed threshold now sits in the wrong place for the new class balance`,
        ],
        answer: `C`,
      },
      {
        q: `Why is reflexively retraining on every drift alert the "single most expensive habit" the taxonomy warns against?`,
        options: [
          `A) Retraining is computationally cheap, so the real cost is the delay before the new model reaches production and starts serving traffic`,
          `B) A feature can drift with no performance impact, so retraining burns compute and risks regressions on stable segments for a problem that may not exist`,
          `C) Drift alerts are almost always caused by infrastructure, so retraining is the correct fix but should wait for the on-call engineer`,
          `D) Retraining always improves accuracy, so the only downside is the pipeline cost, which is negligible relative to a missed fraud`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `A drop in model performance has four possible causes — data drift, concept drift, prior shift, and infrastructure drift — and applying the wrong remedy to any of them wastes time while the problem compounds.`,
    recap: [
      "**Four causes, one symptom:** a recall drop can be data drift, concept drift, prior shift, or infrastructure drift.",
      "**Data drift = P(X) moved.** Inputs shifted; detect with PSI/KS/chi-squared. May or may not hurt.",
      "**Concept drift = P(Y|X) moved.** Same profile, different fraud rate; only labels confirm it; needs retraining.",
      "**Prior shift = P(Y) moved.** More fraud, not different fraud; often just a threshold adjustment.",
      "**Infra drift = pipeline broke.** Schema/latency/nulls; an engineering fix, not a model fix.",
      "**Four layers in order:** infrastructure → data → predictions → performance. The combination that fires is the diagnosis.",
      "**Wrong remedy = wasted week.** Retraining a broken pipeline lands you exactly where you started.",
    ],
    figures: {
      taxonomy: `<svg viewBox="0 0 360 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="12" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">What moved? Each cell = a different fix</text>
  <rect x="8" y="20" width="168" height="54" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="16" y="34" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Data drift</text>
  <text x="16" y="46" fill="var(--ink-mid)" font-size="7.5">P(X) moved</text>
  <text x="16" y="58" fill="var(--ink-low)" font-size="7">detect: PSI / KS / chi-sq</text>
  <text x="16" y="69" fill="var(--ink-low)" font-size="7">may not hurt — investigate</text>
  <rect x="184" y="20" width="168" height="54" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="192" y="34" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Concept drift</text>
  <text x="192" y="46" fill="var(--ink-mid)" font-size="7.5">P(Y|X) moved</text>
  <text x="192" y="58" fill="var(--ink-low)" font-size="7">detect: label accuracy</text>
  <text x="192" y="69" fill="var(--ink-low)" font-size="7">needs retraining</text>
  <rect x="8" y="80" width="168" height="54" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="16" y="94" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Prior shift</text>
  <text x="16" y="106" fill="var(--ink-mid)" font-size="7.5">P(Y) moved</text>
  <text x="16" y="118" fill="var(--ink-low)" font-size="7">more fraud, not different</text>
  <text x="16" y="129" fill="var(--ink-low)" font-size="7">fix: threshold adjust</text>
  <rect x="184" y="80" width="168" height="54" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="192" y="94" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Infra drift</text>
  <text x="192" y="106" fill="var(--ink-mid)" font-size="7.5">pipeline broke</text>
  <text x="192" y="118" fill="var(--ink-low)" font-size="7">schema / latency / nulls</text>
  <text x="192" y="129" fill="var(--ink-low)" font-size="7">fix: engineering, not model</text>
  <text x="180" y="146" text-anchor="middle" fill="var(--ink-low)" font-size="7">Same recall drop, four remedies — the layer that fires is the diagnosis</text>
</svg>`,
    },
  },
  {
    id: 'data_drift_detection',
    interactiveId: 'psi_calculator_viz',
    title: 'Data Drift Detection',
    subtitle: 'PSI, KS test, chi-squared, Jensen-Shannon divergence, choosing thresholds',
    difficulty: 'intermediate',
    estimatedMin: 20,
    tags: ['data drift', 'PSI', 'KS test', 'distribution monitoring'],
    interactivePrompt: `Before you touch the controls: a loan model has been running since January with no errors, but it's now July — what signal would tell you the model is silently wrong before any labels arrive?`,
    summary: `A loan model goes live in January. By March a new kind of applicant is showing up — recent graduates, a newly opened geographic market — and their median income has moved from about 55K to 70K dollars. The model still runs, still returns predictions at the same speed, still fires no alerts. But it is quietly making worse decisions, because it was tuned for a population that no longer shows up at the same rate. By the time a stakeholder notices the approval or default rate has drifted, it's July — and the root cause is six months old. This is silent model decay, and it is the *default* outcome when nobody is monitoring.

---

**The idea: watch the inputs, don't wait for the labels.**

Instead of waiting for outcomes to confirm the damage, you compare each input feature's *current* distribution against its *training* distribution and measure how far apart they've moved. The question becomes concrete: how much has the income distribution shifted, and is that shift big enough to matter?

---

**PSI: the metric the lending world built for exactly this.**

Population Stability Index sums, across bins of a feature, how much probability mass moved:

$PSI = \\sum (p_{train} - p_{new}) \ln(p_{train}/p_{new})$

Below 0.1 the population is stable; 0.1–0.2 is mild drift worth a look; above 0.2 is real drift that needs action. For income moving from 55K to 70K, PSI will likely clear 0.2 — an actionable signal *months* before any label confirms the harm.

[FIGURE: psibands]

---

**Other tests for other shapes of data.**

For continuous features, the Kolmogorov-Smirnov test takes the largest gap between two cumulative distributions:

$D = \max|F_{train}(x) - F_{new}(x)|$

It's distribution-free and notices shifts anywhere, not just in the mean. The trap: with a million daily requests, D = 0.015 will be "statistically significant" (p < 0.001) yet operationally meaningless — so pair it with a *practical* floor like D > 0.05. For categorical features, chi-squared checks whether category frequencies still match training. And when you want one bounded, uniformly-thresholdable number across very different features, Jensen-Shannon divergence sits neatly in [0, 1].

---

**One caution on what an alert means.** Statistical significance is not business significance. A drift alert means *investigate,* not *retrain.* Sometimes a feature moves a lot and the model stays accurate because the learned relationship still holds; other times a subtle shift in one important feature wrecks accuracy while 49 others look fine. So you run both: drift detection as the early warning that *something* changed, and performance monitoring on delayed labels as the confirmation that it *matters.* The alert says "look here." The labels tell you if it's a real problem.`,
    keyPoints: [
      `**Use PSI for binned continuous and ordinal features as your default drift metric.** Build 10 equal-frequency bins from the training distribution — not equal-width, because skewed distributions put all the signal in a few dense center buckets with equal-width binning. Add boundary bins for values falling outside the training range. Apply the rule: PSI < 0.1 is stable, 0.1–0.2 is investigate, > 0.2 is act. The loan income example with a median shift from 55K to 70K dollars will produce PSI well above 0.2. These thresholds are stable enough to apply without per-feature recalibration, which is why the financial industry standardized on them.`,
      `**The most common production trap is acting on statistical significance rather than practical significance.** With 1M daily serving requests, the KS test will flag D = 0.015 as p < 0.001. That is a shift of 1.5 percentage points in the CDF — real, but almost certainly not affecting model performance. Engineers who fire a retraining pipeline on every statistically significant drift alert spend all their time on retraining overhead and still miss the actual incidents, because the threshold is too sensitive. Set D > 0.05 as your practical floor. For PSI, trust the 0.1/0.2 boundaries — they were empirically calibrated over decades of financial model deployment, not derived from theory.`,
      `**The diagnostic: monitor prediction score distribution first, then feature distributions.** The prediction score distribution changes before any feature drift alerts fire and before any labels arrive. A loan model's score distribution shifting from mean 0.35 to mean 0.28 over two months is the earliest signal — the model is scoring the new population differently. Once you see score drift, run PSI on each feature ordered by training-time importance. The first high-PSI, high-importance feature is your root cause. This narrows a 50-feature investigation to a 1-feature investigation within minutes.`,
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
      {
        q: `Why does PSI use 10 equal-frequency bins from the training distribution rather than equal-width bins?`,
        options: [
          `A) Equal-width bins are slower to compute, so equal-frequency binning is chosen purely to reduce monitoring latency at scale`,
          `B) Equal-frequency bins guarantee the PSI score falls in [0, 1], which equal-width bins cannot promise for skewed features`,
          `C) On a skewed feature, equal-width bins pile most of the mass into a few dense center buckets, hiding the shift; equal-frequency spreads resolution where the data actually is`,
          `D) Regulators mandate equal-frequency binning for lending models, so it is a compliance requirement rather than a statistical one`,
        ],
        answer: `C`,
      },
      {
        q: `A loan model's prediction score distribution shifts from mean 0.35 to mean 0.28 over two months. What is the fastest path to the root-cause feature?`,
        options: [
          `A) Run PSI on all 50 features and page whichever one has the single highest raw PSI value regardless of that feature's importance`,
          `B) Run PSI on each feature ordered by training-time importance; the first high-PSI, high-importance feature is the likely root cause`,
          `C) Wait for delayed labels to arrive, then retrain on the most recent window since score drift alone cannot localize a cause`,
          `D) Increase the number of PSI bins to 50 for finer resolution, then re-scan every feature to find the smallest detectable shift`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      psibands: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="7.5">PSI action bands — same axis, three verdicts</text>
  <rect x="8" y="20" width="110" height="40" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="122" y="20" width="90" height="40" rx="4" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="216" y="20" width="136" height="40" rx="4" fill="#ef444422" stroke="#ef4444"/>
  <text x="63" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">&lt; 0.1</text>
  <text x="63" y="52" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">stable</text>
  <text x="167" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">0.1 – 0.2</text>
  <text x="167" y="52" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">investigate</text>
  <text x="284" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">&gt; 0.2</text>
  <text x="284" y="52" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">act</text>
  <line x1="8" y1="108" x2="352" y2="108" stroke="var(--rim)" stroke-width="1"/>
  <path d="M40,108 C90,108 100,76 140,76 C180,76 190,108 240,108" fill="none" stroke="var(--prime)" stroke-width="1.5"/>
  <path d="M150,108 C200,108 210,76 250,76 C290,76 300,108 350,108" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 2"/>
  <text x="140" y="72" text-anchor="middle" fill="var(--prime)" font-size="7">train (55K)</text>
  <text x="250" y="72" text-anchor="middle" fill="#ef4444" font-size="7">new (70K)</text>
  <text x="180" y="117" text-anchor="middle" fill="var(--ink-low)" font-size="7">income distribution shifts right → PSI &gt; 0.2</text>
</svg>`,
    },
    recap: [
      "**Watch inputs, don't wait for labels:** silent decay is the default when nobody monitors.",
      "**PSI = default drift metric:** $PSI = \\sum (p_{train} - p_{new}) \\ln(p_{train}/p_{new})$; <0.1 stable, 0.1–0.2 investigate, >0.2 act.",
      "**Use 10 equal-frequency bins**, not equal-width — skew hides signal in dense center buckets.",
      "**KS for continuous:** $D = \\max|F_{train}(x) - F_{new}(x)|$; distribution-free but pair with a practical floor $D > 0.05$.",
      "**Significance ≠ business significance:** 1M requests make $D=0.015$ \"significant\" yet meaningless.",
      "**Score distribution shifts first**, before feature alerts or labels — then run PSI ordered by feature importance.",
      "**A drift alert means investigate, not retrain** — only labels confirm the drift actually matters.",
    ],
  },
  {
    id: 'concept_drift',
    interactiveId: 'drift_lag_viz',
    title: 'Concept Drift Detection',
    subtitle: 'DDM, EDDM, ADWIN, sudden/gradual/recurring drift in batch vs streaming',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['concept drift', 'ADWIN', 'DDM', 'online learning'],
    summary: `A credit model trained in 2019 is running through 2020 when the pandemic hits in March. Overnight, employment, spending, and default rates all shift. The model's features — employment status, recent spending, credit utilization — encode *pre-pandemic* relationships. After March, the same feature values mean something completely different: someone employed with steady spending is now a far worse risk than the old data would suggest, because the whole macro backdrop changed. Feature PSI reads 0.35 — severe. But even before PSI trips, the model's error rate on the post-March cohort is already compounding. This is **sudden concept drift** — the nastiest kind, because it doesn't build up gently enough to notice.

---

**Three shapes of concept drift, three ways to catch them.**

[FIGURE: shapes]

*Sudden* drift is an abrupt regime change from a specific event — COVID, a new regulation, a competitor launch. It happens at a point in time. Catch it with the Page-Hinkley test (a running sum of errors crossing a threshold) or ADWIN, which compares a recent window to a historical one and collapses the window when they diverge — visible within days.

*Gradual* drift is a slow slide: an aging user base, evolving seasons, shifting preferences over months. No single day looks wrong. Catch it with an exponential moving average of the error rate that alerts when it stays above a control limit — the 90-day trend is alarming even though no day is.

*Recurrent* drift is a pattern that returns: holiday fraud, annual cycles, weekday-vs-weekend behavior. Catch it with time-series decomposition of the error rate. The right response isn't retraining — it's keeping seasonal models and switching between them on schedule.

---

**The hard constraint: detection lag.**

Concept drift is defined against *labels* — you can only truly confirm it once real outcomes arrive. A credit model with a 30-day label delay can drift undetected for a month; a fraud model with 7-day chargebacks, for a week. Feature PSI and score-distribution shifts are useful *leading* signals, but they fire on distribution change, not confirmed outcome change — treat them as prompts to investigate, not proof of drift.

---

**And don't reflexively retrain from scratch.** Sudden drift usually does need retraining on recent data — the old patterns are dead. But gradual drift can sometimes be handled with online updates or recalibration, and recurrent drift with seasonal model-switching. Full retraining is the most expensive lever, so exhaust cheaper recalibration and threshold adjustment first, and pull it only when they fail to close the gap.`,
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
      {
        q: `A credit model has a 30-day label delay. Feature PSI reads 0.35 today, but no label-based accuracy drop has been confirmed yet. What is the correct reading of this signal?`,
        options: [
          `A) The 0.35 PSI confirms concept drift, so retrain immediately on post-shift data before the label delay lets the damage compound further`,
          `B) PSI is a leading signal on distribution change, not confirmed outcome change — treat it as a prompt to investigate, since only labels prove the drift matters`,
          `C) PSI at 0.35 is within normal range for a credit feature, so no action is warranted until the 30-day labels arrive and confirm degradation`,
          `D) Feature PSI cannot detect concept drift at all because concept drift is defined on P(Y|X), so this alert is a false positive to be suppressed`,
        ],
        answer: `B`,
      },
      {
        q: `You retrain a post-COVID credit model on only the most recent 30 days and accuracy on the newest cohort recovers — but overall accuracy falls. Why?`,
        options: [
          `A) Thirty days is too little data volume, so the new model overfit; the fix is simply to widen the window to 90 days of the same recent period`,
          `B) Recalibration should have been tried first; retraining on recent data always regresses because it discards the original learned weights entirely`,
          `C) Customers unaffected by the regime change still follow pre-drift patterns; a model trained only on post-drift data regresses on them — use a sliding window that keeps pre-drift history`,
          `D) The label delay corrupted the training set with stale outcomes, so the recent-30-day labels were themselves wrong at training time`,
        ],
        answer: `C`,
      },
    ],
    figures: {
      shapes: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="7.5">Error rate over time — three shapes, three detectors</text>
  <text x="8" y="26" fill="var(--ink-hi)" font-size="8" font-weight="700">Sudden</text>
  <path d="M8,60 L52,60 L52,34 L112,34" fill="none" stroke="#ef4444" stroke-width="1.5"/>
  <text x="8" y="72" fill="var(--ink-low)" font-size="6.5">Page-Hinkley / ADWIN · days</text>
  <text x="128" y="26" fill="var(--ink-hi)" font-size="8" font-weight="700">Gradual</text>
  <path d="M128,60 Q170,58 200,46 T248,34" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
  <text x="128" y="72" fill="var(--ink-low)" font-size="6.5">EMA vs control limit · months</text>
  <text x="256" y="26" fill="var(--ink-hi)" font-size="8" font-weight="700">Recurrent</text>
  <path d="M256,50 Q272,34 288,50 T320,50 T352,50" fill="none" stroke="var(--prime)" stroke-width="1.5"/>
  <text x="256" y="72" fill="var(--ink-low)" font-size="6.5">TS decomposition · switch models</text>
  <line x1="8" y1="86" x2="352" y2="86" stroke="var(--rim)"/>
  <text x="8" y="100" fill="var(--ink-mid)" font-size="7.5">Detection lag = label delay: 30-day credit, 7-day chargebacks.</text>
  <text x="8" y="112" fill="var(--ink-low)" font-size="7">PSI &amp; score shift lead; labels confirm. Retrain is the last, costliest lever.</text>
</svg>`,
    },
    takeaway: `Concept drift means the world changed and the model didn't — detect it with label-based accuracy on delayed ground truth, distinguish sudden from gradual from recurrent to pick the right response, and exhaust recalibration before committing to full retraining.`,
    recap: [
      "**Concept drift = world changed, model didn't:** same features now mean something different.",
      "**Sudden:** abrupt regime change (COVID, regulation); catch with Page-Hinkley or ADWIN — visible in days.",
      "**Gradual:** slow slide over months; catch with an EMA of error rate crossing a control limit.",
      "**Recurrent:** returning pattern (holidays, seasons); catch via time-series decomposition — switch seasonal models, don't retrain.",
      "**Detection lag is the hard constraint:** confirmed only against labels (30-day credit, 7-day chargebacks).",
      "**Don't retrain on only recent data:** unaffected users regress; use a sliding window with pre-drift history.",
      "**Exhaust recalibration first** — full retraining is the most expensive lever, pulled only when cheaper fixes fail.",
    ],
  },
  {
    id: 'prediction_monitoring',
    title: 'Prediction Distribution Monitoring',
    subtitle: 'Output distribution shift, score distribution, confidence calibration drift',
    difficulty: 'intermediate',
    estimatedMin: 35,
    tags: ['prediction monitoring', 'score distribution', 'output drift'],
    summary: `Your fraud model is live. Labels won't arrive for 7 days — chargebacks take that long to confirm. Infrastructure looks perfect: normal latency, 0% errors. So you cannot measure accuracy until next week. And yet you can see the *predictions* right now, and three of them are already whispering that something moved.

---

**Three signals you have before any label.**

[FIGURE: signals]

*The mean score fell.* Last month the average predicted fraud probability was 3.1%; this month, 2.7%. The model is scoring this week's transactions as less risky. Right or wrong, that's worth a look.

*Confidence collapsed.* The share of predictions above 0.8 confidence dropped from 12% to 4%. The model is now hesitant about cases it used to call decisively.

*The histogram flattened.* Last month's scores were bimodal — clear fraud piled high, clear non-fraud piled low, a trough between. This month it's a single lump near 0.5. The model has lost its ability to separate the two classes.

---

**What each one tends to mean.**

A falling score distribution means either fewer genuinely risky events (could be real) or a feature that shifted the wrong way (pipeline). A dropping high-confidence rate means the inputs have moved outside the model's training range — it's seeing unfamiliar data. A flattening histogram means a key discriminative feature is missing or corrupted, leaving the model unable to tell the classes apart.

You measure all of this with the same tools as feature drift: PSI on the score distribution (same 0.1/0.2 bands), Jensen-Shannon divergence between current and reference histograms (bounded in [0, 1]), and a z-test on the mean-score shift.

---

**What prediction monitoring is — and isn't.** It tells you the model's *behavior* changed, not that the model is *wrong.* Maybe fraud genuinely dropped and the lower scores are correct; maybe a feature pipeline broke. That's exactly why it's your earliest warning system — it fires days ahead of the delayed labels — and exactly why the right first move when it fires is to *investigate the inputs,* not to assume the model is broken and retrain on reflex.`,
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
      {
        q: `The share of predictions above 0.8 confidence dropped from 12% to 4% while the mean score barely moved. What does the collapsing high-confidence rate most directly signal?`,
        options: [
          `A) The base rate P(Y) rose, so more borderline cases are genuinely appearing and the model is correctly hesitating on them`,
          `B) The inputs have moved outside the model's training range — it is now seeing unfamiliar data it cannot score decisively`,
          `C) A discriminative feature is fully corrupted, which is why the histogram collapsed into a single lump near 0.5`,
          `D) The decision threshold was raised upstream, mechanically pushing predictions out of the high-confidence band`,
        ],
        answer: `B`,
      },
      {
        q: `Prediction monitoring fires, so you want to separate a pipeline bug from a genuine data change. What is the sharpest diagnostic?`,
        options: [
          `A) Retrain on the last 30 days and see whether the score distribution snaps back to its reference shape after redeploy`,
          `B) Wait for the 7-day labels and compute precision/recall, since only confirmed accuracy can distinguish a bug from real change`,
          `C) Check feature distributions of the high-confidence positive predictions: a shifted key feature there points to the pipeline; clean features with shifted scores point to the data`,
          `D) Compare P99 latency and endpoint error rate before and after the shift, because a pipeline bug always co-occurs with an infrastructure alert`,
        ],
        answer: `C`,
      },
    ],
    figures: {
      signals: `<svg viewBox="0 0 360 108" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="7.5">Three signals visible before any label arrives</text>
  <text x="8" y="26" fill="var(--ink-hi)" font-size="8" font-weight="700">Mean fell</text>
  <line x1="8" y1="72" x2="112" y2="72" stroke="var(--rim)"/>
  <path d="M14,66 q22,-18 44,0 q22,18 44,0" fill="none" stroke="var(--prime)" stroke-width="1.4"/>
  <path d="M8,68 q22,-14 44,0 q22,14 44,0" fill="none" stroke="#ef4444" stroke-width="1.4" stroke-dasharray="3 2"/>
  <text x="8" y="86" fill="var(--ink-low)" font-size="6.5">3.1% → 2.7%</text>
  <text x="128" y="26" fill="var(--ink-hi)" font-size="8" font-weight="700">Confidence↓</text>
  <line x1="128" y1="72" x2="232" y2="72" stroke="var(--rim)"/>
  <rect x="196" y="52" width="12" height="20" fill="var(--prime)"/>
  <rect x="196" y="62" width="12" height="10" fill="#ef4444"/>
  <text x="128" y="86" fill="var(--ink-low)" font-size="6.5">&gt;0.8: 12% → 4%</text>
  <text x="248" y="26" fill="var(--ink-hi)" font-size="8" font-weight="700">Histogram flat</text>
  <line x1="248" y1="72" x2="352" y2="72" stroke="var(--rim)"/>
  <path d="M252,72 q14,-24 28,0 q14,24 28,0 q14,-24 28,0" fill="none" stroke="var(--prime)" stroke-width="1.3"/>
  <path d="M252,70 q50,-8 100,0" fill="none" stroke="#ef4444" stroke-width="1.3" stroke-dasharray="3 2"/>
  <text x="248" y="86" fill="var(--ink-low)" font-size="6.5">bimodal → one lump</text>
  <text x="8" y="102" fill="var(--ink-mid)" font-size="7.5">Same toolkit as feature drift: PSI on scores, JS divergence, z-test on the mean.</text>
</svg>`,
    },
    takeaway: `Prediction distribution monitoring is your earliest warning — it fires days before delayed labels arrive — but a changed score distribution tells you behavior changed, not whether the change is correct or wrong.`,
    recap: [
      "**See predictions now, labels in 7 days:** three signals fire before any label.",
      "**Falling mean score:** fewer risky events (real) or a feature shifted the wrong way (pipeline).",
      "**Collapsing high-confidence rate:** inputs moved outside the training range — unfamiliar data.",
      "**Flattening histogram:** a key discriminative feature is missing or corrupted — classes no longer separate.",
      "**Same tools as feature drift:** PSI on scores (0.1/0.2), Jensen-Shannon in [0,1], z-test on mean shift.",
      "**Set baselines from first 4 weeks; alert at 2σ** — captures Monday-vs-Friday variation.",
      "**Behavior changed ≠ model wrong:** earliest warning, so investigate the inputs before retraining on reflex.",
    ],
  },
  {
    id: 'feature_importance_drift',
    title: 'Feature Importance Drift',
    subtitle: 'SHAP drift, permutation importance over time, what it reveals',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['feature importance', 'SHAP drift', 'model interpretation', 'monitoring'],
    summary: `A fraud model went live six months ago. On day one its top features were \`transaction_velocity\` (0.32), \`device_age\` (0.21), \`ip_reputation\` (0.18). Six months later the order has flipped: \`ip_reputation\` (0.38), \`transaction_velocity\` (0.12), \`device_age\` (0.09). IP reputation has quietly become the model's dominant signal. Why?

[FIGURE: rankflip]

---

**The cause is the model's own side of the world.**

The fraud team spent those six months aggressively blocking high-risk IPs. So the fraud that *survived* now comes from addresses that were never flagged — the leftover fraud has low-risk IP reputation. The model dutifully learned that "low-reputation IP" is now the reliable tell, because that's what surviving fraud looks like. The catch: it's now leaning on a signal that its own upstream actions made gameable, which makes it far more exposed to IP spoofing. The model adapted to a world that its own team reshaped.

---

**Why this is worth monitoring at all.**

Feature importance drift isn't just "what the model is doing" — it's a read on *how the world moved relative to the model's assumptions.* Four things drive it: a feature's distribution narrows, shrinking its discriminative power; the target population shifts (from the model's own actions or outside forces), changing which examples remain; a feature's quality degrades from a pipeline bug, going noisy or partly null; or a brand-new correlation appears as behavior changes.

To watch it, compute SHAP or permutation importance on a rolling sample of ~1,000 production predictions per week, track the top-K over time, and alert when a feature's rank moves more than 3 places or its importance changes by more than 20%.

---

**The mental correction:** importance is *not* a fixed property of the model. It's a joint property of the model **and** the input distribution — the same weights yield different importances when the inputs shift. That's what makes it such a sensitive probe: a pipeline bug that corrupts one feature shows up in importance drift within days, well before it has piled up enough label evidence to move the accuracy metric.`,
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
      {
        q: `\`ip_reputation\` climbs from rank 3 to rank 1 over three months while its own input distribution stays stable. What does the stable distribution most directly imply?`,
        options: [
          `A) The target-feature relationship changed — importance shifted without distribution drift, which points to concept drift rather than a pipeline issue`,
          `B) The feature pipeline for \`ip_reputation\` broke, since importance only ever moves when a feature's distribution drifts underneath it`,
          `C) Nothing actionable — a stable distribution means the rank change is SHAP sampling noise that will revert next week`,
          `D) The base rate P(Y) rose, mechanically inflating every feature's importance equally, so the rank order is unchanged in reality`,
        ],
        answer: `A`,
      },
      {
        q: `Why must production feature importance be baselined against the deployment-day reference rather than training-time importance?`,
        options: [
          `A) Training importance is computed with a different algorithm than SHAP, so the two numbers are on incomparable scales entirely`,
          `B) Training importance reflects the training distribution; the deployment-day baseline captures the live feature distribution, which is the correct "healthy production" reference`,
          `C) Deployment-day importance is cheaper to compute, so it is preferred purely to reduce the weekly monitoring cost on a rolling sample`,
          `D) Training importance is unavailable after deployment because the training set is discarded once the model ships to production`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      rankflip: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="7.5">SHAP importance: day 1 vs month 6 — the order flipped</text>
  <text x="70" y="26" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5" font-weight="700">Day 1</text>
  <text x="290" y="26" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5" font-weight="700">Month 6</text>
  ${[['transaction_velocity',0.32,0.12],['ip_reputation',0.18,0.38],['device_age',0.21,0.09]].map((r,i)=>`
  <text x="8" y="${44+i*24}" fill="var(--ink-mid)" font-size="7">${r[1].toFixed(2)}</text>
  <rect x="32" y="${37+i*24}" width="${r[1]*220}" height="10" rx="2" fill="var(--prime)" opacity="0.75"/>
  <text x="180" y="${45+i*24}" text-anchor="middle" fill="var(--ink-hi)" font-size="6.5">${r[0]}</text>
  <rect x="${328-r[2]*220}" y="${37+i*24}" width="${r[2]*220}" height="10" rx="2" fill="${i===1?'#ef4444':'var(--prime)'}" opacity="0.75"/>
  <text x="332" y="${44+i*24}" fill="var(--ink-mid)" font-size="7">${r[2].toFixed(2)}</text>`).join('')}
  <text x="8" y="112" fill="var(--ink-low)" font-size="7">Blocking bad IPs left only low-reputation fraud → the model leaned on ip_reputation.</text>
</svg>`,
    },
    takeaway: `Feature importance drift reveals how the world changed relative to the model's assumptions — a rank drop before accuracy moves means you have a week to fix a pipeline bug instead of a week after the damage is done.`,
    recap: [
      "**Importance is joint, not fixed:** a property of model AND input distribution, so it shifts when inputs shift.",
      "**Rank flips reveal how the world moved:** `ip_reputation` rose to #1 because blocking left only low-reputation fraud.",
      "**Four drivers:** narrowing distribution, population shift, pipeline degradation, or a new correlation.",
      "**Compute SHAP/permutation on ~1,000 rolling predictions/week; alert on rank move >3 or importance change >20%.**",
      "**Baseline against deployment-day, not training-day** — training importance reflects the wrong distribution.",
      "**Shift without distribution drift = concept drift; shift with it = pipeline** — run both to get the diagnosis.",
      "**Catches pipeline bugs in days**, before enough label evidence moves accuracy.",
    ],
  },
  {
    id: 'calibration_monitoring',
    title: 'Calibration Monitoring in Production',
    subtitle: 'Reliability diagrams from logged predictions, ECE over time, recalibration triggers',
    difficulty: 'intermediate',
    estimatedMin: 35,
    tags: ['calibration', 'ECE', 'reliability', 'production monitoring'],
    summary: `An insurance pricing model outputs a claim probability. On launch day it's beautifully calibrated: a prediction of 0.15 really does mean a 15% claim rate — dead on the reliability diagram's diagonal. Three months later, the same 0.15 predictions are actually claiming at 22%. The model is now *underestimating* risk by 7 points in that bucket. And the pricing team feeds its output straight into premiums, so for three months it has been silently undercharging exactly the high-risk customers. No alert fired. AUC is a steady 0.82.

---

[FIGURE: reliability]

**AUC will never catch this, because AUC measures a different thing.**

AUC measures *ranking* — does the model put riskier customers above safer ones? Calibration measures *probability accuracy* — does 0.15 actually mean 15%? These are independent. A model can rank every customer perfectly (great AUC) while being wrong about every customer's *absolute* risk (terrible calibration). Anywhere the output is used as a real probability — pricing, risk scoring, expected-value math — you must monitor both, separately.

---

**Why calibration drifts even when ranking holds.**

As the input distribution shifts, the model's probability estimates stop matching the true rates in the new population — even though it still knows *who* is riskier than whom. It just no longer knows *by how much.* You quantify this with Expected Calibration Error:

$ECE = \\sum_{bins} (n_{bin}/n)\\,|\\,\\text{confidence}_{bin} - \\text{accuracy}_{bin}\\,|$

An ECE tripling from 0.03 at launch to 0.09 in three months isn't a footnote — it's mispricing at scale.

---

**Fixing it rarely means retraining.**

*Platt scaling* fits a small logistic regression on top of the model's outputs using recent labeled data — a few hours with ~1,000 examples. *Temperature scaling* uses a single scalar T: new_prob = σ(logit / T). Both are fast and leave the base model untouched. Trigger recalibration when ECE runs 0.03 above baseline for three days straight.

And kill the assumption that "stable AUC means calibration is fine." A model can post AUC 0.90 with ECE 0.15 — ranking everyone right while its probabilities are off by 15 points. For a fraud model, that means your chosen threshold no longer buys the precision-recall tradeoff you designed. For pricing, it means systematic mispricing. Monitor both, independently, on every batch of labels that arrives.`,
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
      {
        q: `A pricing model holds AUC steady at 0.90 for three months, yet its 0.15 predictions now claim at 22%. Why can ranking be perfect while probabilities are wrong?`,
        options: [
          `A) AUC and calibration measure independent things — AUC scores whether risky customers rank above safe ones, calibration scores whether 0.15 truly means 15%`,
          `B) AUC of 0.90 is not high enough to guarantee calibration; only an AUC above 0.95 makes probability estimates reliable in production`,
          `C) The AUC computation lags the calibration computation by one label batch, so the steady AUC is simply stale and will drop next month`,
          `D) Calibration drift always drags AUC down with it, so a steady AUC means the reliability diagram was actually mismeasured`,
        ],
        answer: `A`,
      },
      {
        q: `You apply temperature scaling and ECE improves by only 0.008. What does this small improvement tell you?`,
        options: [
          `A) The recalibration was applied to stale labels, so refit temperature scaling on the last 30–60 days and the ECE will drop as expected`,
          `B) Temperature scaling is never sufficient alone, so full retraining on recent data is the only remaining option for this model`,
          `C) A uniform single-parameter rescale barely helped, so the miscalibration is per-bucket conditional and isotonic regression is needed instead`,
          `D) An improvement under 0.01 confirms the model was already well calibrated, so no further recalibration is warranted at all`,
        ],
        answer: `C`,
      },
    ],
    figures: {
      reliability: `<svg viewBox="0 0 360 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="7.5">Reliability diagram — predicted vs actual claim rate</text>
  <line x1="40" y1="20" x2="40" y2="108" stroke="var(--rim)"/>
  <line x1="40" y1="108" x2="340" y2="108" stroke="var(--rim)"/>
  <line x1="40" y1="108" x2="340" y2="20" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="3 2"/>
  <text x="150" y="34" fill="var(--ink-low)" font-size="6.5">perfect calibration</text>
  <path d="M40,108 L100,96 L160,78 L220,70 L280,66 L340,60" fill="none" stroke="#ef4444" stroke-width="1.6"/>
  <circle cx="220" cy="70" r="2.5" fill="#ef4444"/>
  <line x1="220" y1="70" x2="220" y2="43" stroke="#ef4444" stroke-width="0.8" stroke-dasharray="2 2"/>
  <text x="200" y="88" fill="#ef4444" font-size="6.5">0.15 → 22% actual</text>
  <text x="6" y="24" fill="var(--ink-low)" font-size="6.5">actual</text>
  <text x="312" y="120" fill="var(--ink-low)" font-size="6.5">predicted</text>
  <text x="8" y="124" fill="var(--ink-mid)" font-size="7">ECE 0.03 → 0.09 = mispricing at scale; AUC stayed 0.82 and never flinched.</text>
</svg>`,
    },
    takeaway: `Calibration drift is invisible to AUC — monitor ECE on every label batch, recalibrate with Platt or temperature scaling on recent data when ECE crosses threshold, and never wait for a business stakeholder to notice the mispricing.`,
    recap: [
      "**AUC ≠ calibration:** ranking (who is riskier) is independent of probability accuracy (does 0.15 mean 15%).",
      "**Calibration drifts when inputs shift:** model still knows who is riskier, not by how much.",
      "**ECE:** $ECE = \\sum_{bins} (n_{bin}/n)\\,|\\text{confidence}_{bin} - \\text{accuracy}_{bin}|$; tripling 0.03→0.09 is mispricing at scale.",
      "**Fix without retraining:** Platt scaling (small logistic) or temperature scaling ($\\sigma(\\text{logit}/T)$) on recent labels.",
      "**Fit only on recent labels (30–60 days):** stale recalibration can push ECE the wrong way.",
      "**Trigger at ECE 0.03 above baseline for 3 straight days.**",
      "**Temperature scaling first**; if improvement <0.01 it's per-bucket miscalibration — use isotonic regression.",
    ],
  },
  {
    id: 'silent_model_staleness',
    title: 'Silent Model Staleness',
    subtitle: 'When models decay without alerts, leading indicators, staleness signals',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['model staleness', 'silent failure', 'monitoring', 'model decay'],
    summary: `You take a two-week vacation. No alerts, no pages — the model is "running fine." You come back, check the business metric the model drives, and it has slid 8% in the wrong direction over the last ten days. Nothing caught it, because each individual signal stayed under its threshold: no single feature's drift crossed the line, the prediction distribution moved too slowly to trip a z-test, and the model kept answering at low latency with zero errors. Technically functioning, empirically wrong. This is **silent model staleness.**

---

**It's not a rare failure — it's the default.**

Staleness needs no failure event and makes no announcement. It just accumulates as the world moves and the model doesn't. User behavior, fraud tactics, the economy, your own product — all changing constantly, while the model keeps applying patterns it learned six months ago. The growing gap between what it learned and what the world now looks like *is* the staleness, and it widens every single day.

---

**No one signal catches it — you need several, overlapping.**

[FIGURE: cofiring]

*Feature drift:* PSI over 0.2 on any tier-1 feature. *Prediction drift:* score mean or variance outside 3σ of the launch baseline. *Business divergence:* the KPI the model influences trending the wrong way for 5+ straight days. *Delayed accuracy:* once labels land, rolling 30-day accuracy more than 3 points below launch. Any one of these can stay silent on its own — a 0.19 PSI that never quite hits 0.2, a KPI dip that hides in the noise. The staleness signal is when *two or three fire together, in the same direction.*

---

**The strongest defense doesn't depend on alerts at all.**

Set a time-based retraining SLA: a model retrained monthly simply cannot go more than four weeks stale, no matter what monitoring missed. Pair it with shadow retraining — continuously train a challenger on recent data and compare it to the champion weekly — which surfaces staleness before the live metrics visibly sag.

And retire the belief that "if it's running, it's working." A model can serve every request at normal latency with zero infrastructure errors and be wrong on every prediction. Operational health and prediction quality are unrelated; correctness has to be actively maintained and verified — uptime does not certify it.`,
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
      {
        q: `Every individual metric sits just below its threshold — PSI at 0.19, prediction drift inside 3σ — yet the business KPI has slid 6% over 10 days. What is the staleness signal here?`,
        options: [
          `A) A single sub-threshold PSI of 0.19 is the real alarm; nudge the PSI threshold down to 0.15 and the incident would have paged`,
          `B) The KPI slide alone is decisive, so business divergence should be the only monitored signal and the drift metrics can be retired`,
          `C) The signal is co-firing: several indicators moving the same direction together, each individually silent, is the pattern a composite health score is built to surface`,
          `D) Nothing is wrong yet — until at least one metric crosses its threshold the model is healthy, and the KPI move is unrelated noise`,
        ],
        answer: `C`,
      },
      {
        q: `Why is a time-based retraining SLA described as the strongest defense against silent staleness rather than better alert thresholds?`,
        options: [
          `A) Alert thresholds are expensive to compute, whereas a retraining SLA runs offline and therefore costs the serving path nothing`,
          `B) A monthly retrain caps how stale the model can get regardless of what monitoring missed, so it does not depend on any threshold firing correctly`,
          `C) Time-based SLAs are mandated by MLOps compliance frameworks, so they take precedence over threshold-based detection by policy`,
          `D) Retraining monthly eliminates concept drift permanently, removing the need for any leading-indicator monitoring going forward`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      cofiring: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="7.5">Each signal stays under its line — together they spell staleness</text>
  ${[['Feature PSI','0.19 / 0.20',0.95],['Prediction drift','2.7σ / 3σ',0.90],['Business KPI','−6% / −(5d)',0.82],['30-day accuracy','−2.6 / −3 pts',0.87]].map((r,i)=>`
  <text x="8" y="${30+i*20}" fill="var(--ink-mid)" font-size="7">${r[0]}</text>
  <rect x="120" y="${22+i*20}" width="200" height="9" rx="2" fill="var(--depth)" stroke="var(--rim)"/>
  <rect x="120" y="${22+i*20}" width="${r[2]*200}" height="9" rx="2" fill="#f59e0b" opacity="0.8"/>
  <line x1="320" y1="${20+i*20}" x2="320" y2="${33+i*20}" stroke="#ef4444" stroke-width="1"/>
  <text x="324" y="${30+i*20}" fill="var(--ink-low)" font-size="6.5">${r[1]}</text>`).join('')}
  <text x="8" y="114" fill="var(--ink-mid)" font-size="7.5">The composite health score aggregates all four into one pane of glass.</text>
</svg>`,
    },
    takeaway: `Silent staleness is the default state of any unmonitored model — detect it with overlapping leading indicators, build a composite health score to surface the "everything drifting a little" pattern, and set time-based retraining SLAs so no model ages past its empirically calibrated staleness limit.`,
    recap: [
      "**Silent staleness is the default**, not a rare failure — no event, no announcement, widening every day.",
      "**Running ≠ working:** normal latency, zero errors, and wrong on every prediction can coexist.",
      "**No single signal catches it:** each stays under its threshold (a 0.19 PSI, a KPI dip in the noise).",
      "**The signal is co-firing:** two or three indicators moving the same direction together.",
      "**Overlapping indicators:** feature drift PSI>0.2, prediction drift outside 3σ, KPI wrong-way 5+ days, 30-day accuracy 3pts below launch.",
      "**Composite health score** aggregates them into one pane of glass instead of 15 sub-threshold alerts.",
      "**Time-based retraining SLA is the strongest defense:** monthly retrain caps staleness regardless of what monitoring missed; pair with shadow retraining.",
    ],
  },
  {
    id: 'alerting_runbooks',
    interactiveId: 'alert_threshold_viz',
    title: 'Alerting & Runbooks',
    subtitle: 'Alert thresholds, alert fatigue, P1/P2/P3 classification, runbook structure',
    difficulty: 'intermediate',
    estimatedMin: 35,
    tags: ['alerting', 'runbooks', 'incident response', 'on-call'],
    summary: `The monitoring system fires 47 alerts in a week. The team acknowledges every one and fixes none. The alerts have become wallpaper — everyone has learned to tune them out. Two months later a real model failure runs undetected for three days, because the alert *did* fire and nobody acted. Alert fatigue has quietly converted the whole monitoring system into a false sense of safety.

---

**Fatigue is a calibration problem, not a people problem.**

When the false-positive rate is high, ignoring alerts is the *rational* response — engineers are running expected-value math, not being lazy. An alert that's actionable only 20% of the time trains everyone to assume it's noise 4 times out of 5. The first genuine P1 that gets waved off during that mental shortcut is where fatigue turns into real business damage.

---

**The fix starts with runbooks.**

A runbook is the procedure stapled to an alert type: what triggered it (the exact condition), what it means (the business interpretation), its severity, the immediate action (page? auto-rollback?), the ordered investigation steps, and the resolution decision tree (if X then Y, else Z). Without one, every alert forces the on-call engineer to re-derive the whole investigation from scratch at 3am. A runbook turns one person's expertise into a process anyone on the rotation can run.

---

**Four rules that keep false positives down.**

[FIGURE: routing]

*Actionable* — if there's no clear action when it fires, it's a metric to watch, not an alert to page on. *Low false-positive rate* — past ~20%, people start ignoring it. *Severity routing* — P0 (model down / financial risk: page now), P1 (significant drift: ticket for tomorrow), P2 (early warning: weekly queue). *Deduplication* — collapse 15 cascading alerts from one upstream failure into a single alert with a root-cause hypothesis.

And the myth to bury: "more alerts = better monitoring." More alerts means more noise means ignored alerts means *worse* monitoring than having fewer. The target is zero false positives, every alert actionable, every alert backed by a runbook. Start with five high-signal alerts and add another only when it has a written runbook and a measured false-positive rate under 20%. Never enable an alert you haven't written the runbook for.`,
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
      {
        q: `Why does the module insist you write the runbook before you enable the alert?`,
        options: [
          `A) The runbook is a compliance artifact auditors require, so it must exist on file before any alert can legally page an on-call engineer`,
          `B) If you cannot write down what the on-call engineer does when it fires, you do not understand the alert well enough to act on it — the alert is not ready`,
          `C) Writing the runbook first lets you disable the alert faster later, since the deprecation steps are already documented in advance`,
          `D) Runbooks take longer to write than alerts to configure, so front-loading them balances the on-call team's workload across the sprint`,
        ],
        answer: `B`,
      },
      {
        q: `A single upstream feature-store outage triggers 15 cascading alerts at once. Which of the four rules addresses this directly?`,
        options: [
          `A) Actionability — since none of the 15 alerts has a clear action, they should all be downgraded to dashboard metrics rather than pages`,
          `B) Severity routing — route all 15 to the P0 lane so the on-call engineer sees the outage immediately and can begin triage`,
          `C) Deduplication — collapse the 15 cascading alerts into one alert carrying the root-cause hypothesis instead of paging 15 times`,
          `D) The false-positive rule — because cascading alerts are false positives by definition, raise every threshold until only one survives`,
        ],
        answer: `C`,
      },
    ],
    figures: {
      routing: `<svg viewBox="0 0 360 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="7.5">Alert decision flow — actionable? then route by severity</text>
  <rect x="120" y="18" width="120" height="22" rx="4" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="180" y="32" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">Clear action on fire?</text>
  <path d="M180,40 L180,50" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="150" y="49" fill="var(--ink-low)" font-size="6.5">no →</text>
  <text x="196" y="49" fill="var(--ink-low)" font-size="6.5">dashboard metric, not a page</text>
  <path d="M180,52 L180,60" stroke="var(--ink-low)" stroke-width="1"/>
  <rect x="8" y="62" width="108" height="34" rx="4" fill="#ef444422" stroke="#ef4444"/>
  <text x="62" y="76" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">P0</text>
  <text x="62" y="88" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">model down / $ risk · page now</text>
  <rect x="126" y="62" width="108" height="34" rx="4" fill="#f59e0b22" stroke="#f59e0b"/>
  <text x="180" y="76" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">P1</text>
  <text x="180" y="88" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">significant drift · ticket tmrw</text>
  <rect x="244" y="62" width="108" height="34" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="298" y="76" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">P2</text>
  <text x="298" y="88" text-anchor="middle" fill="var(--ink-mid)" font-size="6.5">early warning · weekly queue</text>
  <text x="8" y="112" fill="var(--ink-mid)" font-size="7.5">Dedup 15 cascading alerts into 1 root-cause alert. Keep FP rate under 20%.</text>
  <text x="8" y="124" fill="var(--ink-low)" font-size="7">Never enable an alert you have not written the runbook for.</text>
</svg>`,
    },
    takeaway: `Alert fatigue is a calibration problem, not a personnel problem — write the runbook before enabling the alert, calibrate thresholds per feature from observed production variation, and track alert-to-action conversion rate monthly to catch alert debt before it degrades incident response.`,
    recap: [
      "**Alert fatigue is calibration, not people:** ignoring noisy alerts is rational expected-value math.",
      "**High false-positive rate trains dismissal:** 20%-actionable alerts get waved off 4 in 5 times.",
      "**Write the runbook before enabling the alert** — if you can't, you don't understand it well enough to act.",
      "**Runbook = trigger + meaning + severity + immediate action + investigation steps + resolution tree.**",
      "**Four rules:** actionable, false-positive rate <20%, severity routing (P0 page / P1 ticket / P2 weekly), deduplication.",
      "**Calibrate thresholds per feature** from 30 days of production variation — uniform PSI 0.2 spams seasonal features.",
      "**Track alert-to-action conversion:** >40% \"no action\" is noise; start with 5 high-signal alerts, target zero false positives.",
    ],
  },
]
