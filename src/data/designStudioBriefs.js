// designStudioBriefs.js — Design Studio, MSL (MLE track). SKELETONS ONLY (2026-07-17).
// CORRECTED MECHANIC (no MCQ, no tick-lists): the user PRODUCES the artifact, then
// self-critiques it against a REFERENCE + anchored RUBRIC. NO LLM anywhere (MSL simulates
// the real no-LLM interview condition). See DESIGN-STUDIO-SPEC.md.
//
// Schema = same as GSL designStudioBriefs, plus:
//   modality: 'system-design' (in-app text/diagram, no execution)
//           | 'notebook-build' (BRING YOUR OWN env — Colab/local — + a self-check harness; no in-app IDE)
//   selfCheck: for notebook-build, what the downloadable harness asserts (prose deferred)
// Scoped-not-vague: identity/dials/brief/produce/rubric-anchors PINNED; reference + harness prose DEFERRED (_flesh).

export const DESIGN_STUDIO_MSL = [
  { id: "mlsd-recsys-feed", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"], flawMode: null, difficulty: "senior", companies: ["Any"],
    tags: ["recsys", "two-stage", "ranking", "position-bias"],
    prompt: "Design a two-stage recommender for a personalized feed over tens of millions of items.",
    context: "GIVEN: catalog scale, implicit interaction logs, latency budget, freshness need. [S2: derive the candidate-gen->rank->serve->feedback flow + requirements — position bias, exposure, cold start, offline/online eval.] MSL proof cell.",
    produce: { artifact: "the derived two-stage architecture + candidate/rank design + eval plan (offline metric that predicts online) + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "requirement" }, selfCheck: null,
    rubric: [
      { dim: "framing-before-modeling", anchor: "did you derive the two-stage flow the brief withheld before picking models?", cost: "jumped to a model without the system" },
      { dim: "position-bias", anchor: "does training account for click position bias (IPS/randomization)?", cost: "a self-reinforcing rich-get-richer loop" },
      { dim: "offline-predicts-online", anchor: "is your offline metric one that actually tracks the online goal?", cost: "you optimize a number that doesn't move the business" },
      { dim: "cold-start", anchor: "handled new users/items explicitly?", cost: "the system fails exactly where growth comes from" },
      { dim: "tradeoffs", anchor: "stated latency vs quality?", cost: "hand-wave" },
    ],
    _flesh: "Reference (requirement) = the withheld flow + requirements; workedSolutionPlanned.",
    status: "skeleton" },

  { id: "mlsd-recsys-coldstart", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S3", withheld: ["reference-cases", "end-to-end-flow", "design-requirements", "inputs", "tools"], flawMode: null, difficulty: "staff", companies: ["Any"],
    tags: ["recsys", "cold-start", "content", "coverage"],
    prompt: "Make recommendations work for brand-new users and brand-new items.",
    context: "GIVEN ONLY: that + 'the system already works for warm users.' [S3: derive what cold-start actually costs (coverage/personalization, not just recall), the content/popularity fallback lanes, and how you'd measure it.] Ladder rung above mlsd-recsys-feed (S2).",
    produce: { artifact: "framed cost + the fallback-lane design + a measurement plan + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "requirement" }, selfCheck: null,
    rubric: [
      { dim: "reframe-the-cost", anchor: "did you reframe cold-start as coverage/personalization collapse, not just a recall drop?", cost: "you measure the wrong thing and 'solve' the wrong problem" },
      { dim: "structural-reach", anchor: "a content/semantic lane that STRUCTURALLY reaches unseen items?", cost: "new items are unreachable forever" },
      { dim: "honest-measurement", anchor: "measured what the fallback actually costs (not hidden)?", cost: "ships a non-personalized fallback silently" },
      { dim: "framing-under-ambiguity", anchor: "surfaced these unprompted (S3)?", cost: "only handled what was handed to you" },
    ],
    _flesh: "Reference (requirement). Expand anchors.",
    status: "skeleton" },

  { id: "mlsd-search-ranking", roleTrack: "MLE", domain: "search", modality: "system-design",
    specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"], flawMode: null, difficulty: "senior", companies: ["Any"],
    tags: ["search", "ranking", "ltr", "position-bias"],
    prompt: "Design a learning-to-rank system for a large search index trained on click logs.",
    context: "GIVEN: query+click logs, an index, latency budget. [S2: derive the retrieve->rank->serve flow + requirements — position bias/IPS, label validity, freshness, offline/online eval.]",
    produce: { artifact: "the derived flow + LTR design + label-debiasing plan + eval + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "requirement" }, selfCheck: null,
    rubric: [
      { dim: "label-validity", anchor: "named position bias as the primary click-label threat + IPS/randomization as the fix?", cost: "more biased data makes it worse, not better" },
      { dim: "ambiguity-resolution", anchor: "derived the withheld retrieve->rank flow?", cost: "executed only what was given" },
      { dim: "offline-predicts-online", anchor: "offline ranking metric that tracks online?", cost: "optimizes a decoupled number" },
      { dim: "freshness", anchor: "feature freshness handled?", cost: "stale features degrade silently" },
      { dim: "tradeoffs", anchor: "latency vs quality stated?", cost: "hand-wave" },
    ],
    _flesh: "Reference (requirement). Expand anchors.",
    status: "skeleton" },

  { id: "mlsd-dynamic-pricing", roleTrack: "MLE", domain: "pricing", modality: "system-design",
    specLevel: "S3", withheld: ["reference-cases", "end-to-end-flow", "design-requirements", "inputs", "tools"], flawMode: null, difficulty: "staff", companies: ["Any"],
    tags: ["pricing", "elasticity", "bandit", "guardrails", "causal"],
    prompt: "Design a system that sets prices to optimize revenue without runaway or unfair pricing.",
    context: "GIVEN ONLY: that + 'prices must respect guardrails and be explainable.' [S3: derive elasticity estimation, the explore/exploit mechanism, guardrails, the counterfactual eval, inputs, tools.]",
    produce: { artifact: "framed requirements + the pricing design (elasticity + explore/exploit + guardrails) + counterfactual eval plan + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "requirement" }, selfCheck: null,
    rubric: [
      { dim: "elasticity-is-causal", anchor: "did you treat elasticity as a causal quantity (not a correlation)?", cost: "prices chase confounded demand and lose money" },
      { dim: "counterfactual-eval", anchor: "an off-policy/counterfactual way to evaluate (can't A/B every price)?", cost: "no way to validate before shipping prices" },
      { dim: "guardrails", anchor: "explicit price guardrails + fairness?", cost: "runaway or discriminatory pricing" },
      { dim: "framing-under-ambiguity", anchor: "surfaced these unprompted (S3)?", cost: "only the easy half" },
    ],
    _flesh: "Reference (requirement). Expand anchors.",
    status: "skeleton" },

  { id: "mlsd-drift-retrain", roleTrack: "MLE", domain: "mlops", modality: "system-design",
    specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"], flawMode: null, difficulty: "senior", companies: ["Any"],
    tags: ["mlops", "drift", "monitoring", "champion-challenger"],
    prompt: "Design monitoring + retraining for a deployed model so silent degradation is caught and fixes ship safely.",
    context: "GIVEN: a live model, delayed labels, nightly pipelines. [S2: derive the monitor->trigger->retrain->validate->promote flow + requirements — drift taxonomy, label delay, champion/challenger, rollback.]",
    produce: { artifact: "the derived retraining loop + drift design + safe-promotion plan + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "requirement" }, selfCheck: null,
    rubric: [
      { dim: "drift-taxonomy", anchor: "distinguished data vs concept vs label drift?", cost: "you monitor the wrong signal and miss the real shift" },
      { dim: "delayed-labels", anchor: "handled label delay in the trigger?", cost: "retrain on the wrong signal or too late" },
      { dim: "safe-promotion", anchor: "champion/challenger + validate-before-promote + rollback?", cost: "a bad retrain silently ships" },
      { dim: "eval-first", anchor: "validation gate defined before promotion?", cost: "unprovable improvement" },
    ],
    _flesh: "Reference (requirement). Expand anchors.",
    status: "skeleton" },

  { id: "mlsd-feature-store", roleTrack: "MLE", domain: "mlops", modality: "system-design",
    specLevel: "S3", withheld: ["reference-cases", "end-to-end-flow", "design-requirements", "inputs", "tools"], flawMode: null, difficulty: "staff", companies: ["Any"],
    tags: ["mlops", "feature-store", "training-serving-skew", "point-in-time"],
    prompt: "Design the feature layer so training and serving never disagree.",
    context: "GIVEN ONLY the one-liner. [S3: derive the offline/online feature paths, point-in-time correctness (no future leakage in training), freshness, skew detection.] Ladder rung above mlsd-drift-retrain (S2).",
    produce: { artifact: "framed requirements + the feature-layer design + point-in-time correctness plan + skew detection + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "requirement" }, selfCheck: null,
    rubric: [
      { dim: "point-in-time", anchor: "does training compute features as-of the label time (no future leakage)?", cost: "offline metrics inflate, prod collapses" },
      { dim: "single-definition", anchor: "one feature definition serving BOTH training and serving?", cost: "training-serving skew" },
      { dim: "skew-detection", anchor: "a mechanism to detect when the two paths diverge?", cost: "silent skew degrades the model" },
      { dim: "framing-under-ambiguity", anchor: "surfaced these unprompted (S3)?", cost: "only the easy half" },
    ],
    _flesh: "Reference (requirement). Expand anchors.",
    status: "skeleton" },

  { id: "mlsd-experiment-trust", roleTrack: "MLE", domain: "causal", modality: "system-design",
    specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"], flawMode: null, difficulty: "senior", companies: ["Any"],
    tags: ["causal", "experimentation", "srm", "power", "guardrails"],
    prompt: "Design the layer that decides whether an already-run A/B result is trustworthy enough to ship.",
    context: "GIVEN: batch experiment outputs (arms, metrics, allocation). [S2: derive the validity->decision flow + requirements — SRM vs design allocation, power/MDE, guardrail-first, multiple testing.]",
    produce: { artifact: "the derived gate order + validity checks + a decision policy + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "requirement" }, selfCheck: null,
    rubric: [
      { dim: "validity-before-significance", anchor: "do validity checks (SRM, power) gate BEFORE reading significance?", cost: "you ship a broken or underpowered 'win'" },
      { dim: "design-vs-corruption-srm", anchor: "SRM tested against the design allocation, not assumed 50/50?", cost: "false-flags a legitimate non-50/50 design" },
      { dim: "guardrail-first", anchor: "guardrail regressions block regardless of the primary?", cost: "harmful ships because the primary looked good" },
      { dim: "eval-first", anchor: "an A/A calibration to prove the gate itself works?", cost: "uncalibrated Type-I error" },
    ],
    _flesh: "Reference (requirement). workedSolutionPlanned.",
    status: "skeleton" },

  { id: "mlsd-anomaly-detection", roleTrack: "MLE", domain: "timeseries", modality: "system-design",
    specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"], flawMode: null, difficulty: "senior", companies: ["Any"],
    tags: ["timeseries", "anomaly", "unsupervised", "alerting"],
    prompt: "Design a system that flags anomalies in a high-volume metrics stream with few labels.",
    context: "GIVEN: streaming metrics, rare+unlabeled anomalies, an on-call that hates false pages. [S2: derive the detect->score->alert flow + requirements — seasonality, thresholding, feedback labels, false-positive control.]",
    produce: { artifact: "the derived flow + detection design + alerting policy + a label-scarce eval + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "requirement" }, selfCheck: null,
    rubric: [
      { dim: "alert-precision", anchor: "does the design control false pages (precision), not just recall?", cost: "page fatigue -> the whole system gets ignored" },
      { dim: "seasonality", anchor: "seasonality-aware baseline?", cost: "flags every Monday morning as an anomaly" },
      { dim: "label-scarce-eval", anchor: "an eval that works with almost no labels?", cost: "no way to know if it's any good" },
      { dim: "feedback-loop", anchor: "operator feedback improves it over time?", cost: "stuck at day-1 quality" },
    ],
    _flesh: "Reference (requirement). Expand anchors.",
    status: "skeleton" },

  { id: "mlsd-demand-forecast-notebook", roleTrack: "MLE", domain: "timeseries", modality: "notebook-build",
    specLevel: "S2", withheld: ["solution-approach"], flawMode: null, difficulty: "senior", companies: ["Any"],
    tags: ["timeseries", "forecasting", "backtesting", "leakage"],
    prompt: "Given a sales-history CSV + Python, build a demand forecaster and defend your backtest.",
    context: "GIVEN: dataset + 'enough solution' expectation. NO LLM, bring your own env (Colab/local). [S2: derive the approach and, critically, a leakage-safe rolling backtest.]",
    produce: { artifact: "a notebook (in your own env) with a baseline, a model, and a defended backtest", format: "notebook", workspace: "bring-your-own-env" },
    reference: { type: "solution" },
    selfCheck: "harness asserts: (1) scaler/features fit on train only (no whole-series leak), (2) rolling-origin/expanding backtest with an embargo gap, (3) target horizon strictly after the feature window, (4) a naive baseline is reported",
    rubric: [
      { dim: "leakage-safe-split", anchor: "did you fit transforms on train only and split by TIME?", cost: "backtest is fantasy; forward performance collapses" },
      { dim: "rolling-backtest", anchor: "rolling-origin (not a single random holdout)?", cost: "no exposure to regime change" },
      { dim: "baseline-first", anchor: "beat a naive baseline?", cost: "a fancy model that loses to last-value" },
      { dim: "honest-error", anchor: "reported error under regime shift, not just the easy window?", cost: "overstated accuracy" },
    ],
    _flesh: "Reference = a worked notebook + the self-check harness script. Ship the harness so the user can self-verify without an LLM.",
    status: "skeleton" },

  { id: "mlsd-fraud-notebook", roleTrack: "MLE", domain: "risk", modality: "notebook-build",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"],
    tags: ["risk", "fraud", "imbalance", "calibration"],
    prompt: "Given a labeled transactions CSV + Python, build a fraud model, calibrate it, and pick an operating threshold from the cost of errors.",
    context: "GIVEN (S1, full brief): dataset, ~1% base rate, asymmetric cost (missed fraud vs false block), the ask. NO LLM, bring your own env.",
    produce: { artifact: "a notebook with a leakage-safe model, calibration, and a cost-based threshold", format: "notebook", workspace: "bring-your-own-env" },
    reference: { type: "solution" },
    selfCheck: "harness asserts: (1) accuracy is NOT the headline metric, (2) PR-AUC/recall-at-precision reported, (3) probabilities calibrated (reliability check), (4) threshold derived from the stated cost ratio, (5) split doesn't leak",
    rubric: [
      { dim: "no-accuracy", anchor: "did you refuse accuracy and report PR-AUC/recall@precision?", cost: "a 'never-fraud' model scores ~99% and catches nothing" },
      { dim: "calibration", anchor: "are the probabilities calibrated (PD means what it says)?", cost: "thresholds and costs become meaningless" },
      { dim: "cost-threshold", anchor: "threshold chosen from the cost ratio, not 0.5?", cost: "wrong precision/recall balance" },
      { dim: "leakage-safe", anchor: "no leaked/future features, clean split?", cost: "inflated offline, collapse online" },
    ],
    _flesh: "Reference = worked notebook + harness. workedSolutionPlanned.",
    status: "skeleton" },

  { id: "mlsd-ab-uplift-notebook", roleTrack: "MLE", domain: "causal", modality: "notebook-build",
    specLevel: "S2", withheld: ["solution-approach"], flawMode: null, difficulty: "senior", companies: ["Any"],
    tags: ["causal", "uplift", "heterogeneous-effects"],
    prompt: "Given a randomized-experiment CSV + Python, model who to TREAT (uplift), not who will convert.",
    context: "GIVEN: treatment/control + outcome + covariates. NO LLM, bring your own env. [S2: derive the approach — the trap is modeling P(convert) instead of the treatment EFFECT, and evaluating uplift with no ground-truth per-unit effect.]",
    produce: { artifact: "a notebook modeling uplift + a valid uplift evaluation", format: "notebook", workspace: "bring-your-own-env" },
    reference: { type: "solution" },
    selfCheck: "harness asserts: (1) target is effect, not raw conversion, (2) treatment not leaked into features, (3) evaluation uses Qini/uplift curve (not AUC on conversion)",
    rubric: [
      { dim: "uplift-vs-response", anchor: "did you model the treatment effect, not P(convert)?", cost: "you target people who'd convert anyway — zero incremental value" },
      { dim: "valid-uplift-eval", anchor: "Qini/uplift curve (you never observe per-unit effect)?", cost: "you can't actually tell if the uplift model is good" },
      { dim: "no-treatment-leak", anchor: "treatment kept out of features?", cost: "trivially 'perfect' and useless" },
    ],
    _flesh: "Reference = worked notebook + harness.",
    status: "skeleton" },
  // ── Authored ROOT + variations: Ranking / Recommendation (2026-07-21). First fully-authored
  //    MSL root: sharp anchored checklist + worked reference; scaffold fades S1 -> S2 -> S3 -> S4.
  { id: "mlsd-recsys-ranking-root", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["recsys", "ranking", "two-stage", "position-bias", "eval", "root"],
    prompt: "Design a large-scale ranking / recommendation system for a personalized feed — tens of millions of items, hundreds of millions of interactions a day — that optimizes engagement without eating its own tail.",
    context: "Implicit feedback only (clicks/watches, no explicit ratings). Ranking latency budget ~100ms. New items arrive hourly. Logs carry position bias. New users and new items have no history. The business metric is long-run engagement, not offline AUC.",
    produce: { artifact: "two-stage architecture (candidate generation -> ranking -> re-rank/policy) + feature & label design (point-in-time, no leakage) + an eval plan whose offline metric predicts online + bias/feedback-loop handling + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer is a two-stage funnel with the eval and the feedback loop designed in from the start — not a single model.

1. Two stages, not a monolith. You cannot score 10M+ items in 100ms. Candidate generation (two-tower retrieval / ANN) narrows millions -> hundreds; a heavier ranker (GBDT or DLRM) scores only the shortlist. Recall lives in stage 1, precision in stage 2.

2. Labels and leakage. Implicit feedback is biased and delayed. Use point-in-time feature joins (never features computed with future information), define the label window deliberately, and run the SAME feature code offline and online — train-serve skew is the classic silent killer (great offline, broken in prod).

3. Position / exposure bias. Clicks are confounded by where an item was shown. Train naively and you get a rich-get-richer loop: the model recommends what it already showed. Correct with inverse-propensity weighting, randomization in logging, or a position feature that is present in training and dropped at serving.

4. Offline must predict online. Offline NDCG/AUC frequently does NOT move the business metric. Validate the offline-online correlation, use counterfactual / replay evaluation, and gate every launch on an A/B test, not on offline gain.

5. Cold start and exploration. New users/items have no interactions — fall back to content features, popularity priors, and explicit exploration (bandits) so the system works exactly where growth comes from, and so discovery does not starve.

6. Feedback loop and drift. The model shapes the data it is next trained on. Monitor for degenerate concentration (diversity collapse), keep exploration alive, and trigger retraining on drift.

Tradeoffs to state: candidate-gen recall vs ranking latency; exploration vs short-term engagement; DLRM expressiveness vs GBDT maintainability and cost.` },
    rubric: [
      { dim: "two-stage-not-monolith", anchor: "point to candidate generation as a separate stage — do you retrieve hundreds from millions BEFORE ranking, not score the whole catalog?", cost: "cannot meet latency; ranking 10M items in 100ms is impossible" },
      { dim: "leakage-and-skew", anchor: "are features point-in-time (no future info) AND computed by the same code offline and online?", cost: "train-serve skew / leakage: strong offline, broken in production" },
      { dim: "position-bias", anchor: "how do you stop click position bias from creating a rich-get-richer loop (IPS / randomization / a train-only position feature)?", cost: "self-reinforcing feedback loop; the model recommends only what it already showed" },
      { dim: "offline-predicts-online", anchor: "is your offline metric validated to track the online goal, and do you gate launch on an A/B test, not offline gain?", cost: "you optimize NDCG while the business metric does not move" },
      { dim: "cold-start-exploration", anchor: "how do brand-new users and items get served, and where is exploration in the loop?", cost: "the system fails where growth comes from; no exploration starves discovery" },
      { dim: "tradeoff", anchor: "state one place you traded candidate recall vs ranking latency (or exploration vs engagement) and why", cost: "reads as no real engineering decision" },
    ],
    status: "authored" },

  { id: "mlsd-recsys-var-scale-latency", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: null, difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-recsys-ranking-root",
    tags: ["recsys", "scale", "latency", "freshness", "variation"],
    prompt: "Variation of the ranking root: 300M DAU, p99 ranking < 80ms, catalog of 50M items, new items every few minutes. Design it.",
    context: "Scaffold (S2 — candidate generation is given as a two-tower ANN retriever): you design the ranking stage, near-real-time freshness for minutes-old items, and the serving path that holds p99 < 80ms.",
    produce: { artifact: "ranking-stage design + freshness path for minutes-old items + a serving/latency budget that holds p99 < 80ms + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "latency-budget-math", anchor: "show the per-request budget (retrieve + feature fetch + score + rerank) landing under 80ms at p99", cost: "hand-waved latency; the p99 SLA is unmet and unprovable" },
      { dim: "freshness-path", anchor: "how does a minutes-old item get candidate-eligible and scored without a full reindex/retrain?", cost: "new items are invisible for hours; freshness SLA broken" },
      { dim: "two-stage-not-monolith", anchor: "is ranking still over a shortlist, not the 50M catalog?", cost: "impossible latency" },
      { dim: "feature-freshness-skew", anchor: "are near-real-time features consistent between training and serving?", cost: "train-serve skew reappears under streaming features" },
    ],
    status: "authored" },

  { id: "mlsd-recsys-var-feedback-loop", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-recsys-ranking-root",
    tags: ["recsys", "feedback-loop", "diversity", "exploration", "variation"],
    prompt: "Variation of the ranking root: engagement rose then plateaued; recommendations are collapsing to a narrow set — popular items dominate, diversity dropped, new items never surface. Diagnose and fix. (Minimal scaffold.)",
    context: "The ranker trains on its own click logs each day. No exploration in the loop. Position of an item strongly predicts its click in the training data.",
    produce: { artifact: "the root cause (why a well-performing ranker degenerates over time) + the fix + the metric that would have caught it early + what you would NOT do", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "loop-diagnosis", anchor: "do you name the feedback loop + position bias (the model trains on data it shaped) as the cause, not 'the model got worse'?", cost: "misdiagnosis -> you retrain harder and it degenerates faster" },
      { dim: "bias-correction", anchor: "point to IPS / randomization / a train-only position feature to break the loop", cost: "the rich-get-richer collapse continues" },
      { dim: "exploration", anchor: "where do you add exploration (bandit / epsilon) so new items get impressions?", cost: "discovery starves; new items never surface" },
      { dim: "diversity-metric", anchor: "what metric detects concentration/diversity collapse before engagement plateaus?", cost: "the collapse is invisible until growth stalls" },
    ],
    status: "authored" },

  { id: "mlsd-recsys-var-offline-online-gap", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-recsys-ranking-root",
    tags: ["recsys", "offline-online-gap", "counterfactual-eval", "variation"],
    prompt: "Variation of the ranking root (own it — no scaffold): your new ranker beats the incumbent by +4% NDCG offline but LOSES the online A/B test. Explain why, and design the fix.",
    context: "You get the result only. Bring your own explanation, evaluation redesign, and tradeoffs.",
    produce: { artifact: "why offline gain did not transfer + how you would evaluate so offline predicts online + the launch-gate policy + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "gap-root-cause", anchor: "do you attribute the gap to biased offline eval (position/exposure bias in logged data, distribution shift), not 'noise' or 'bad luck'?", cost: "you re-launch the same losing model expecting a different result" },
      { dim: "counterfactual-eval", anchor: "point to counterfactual / IPS / replay evaluation on unbiased or reweighted logs instead of naive NDCG on biased logs", cost: "offline keeps lying; you never trust it" },
      { dim: "metric-alignment", anchor: "is the offline metric re-chosen to correlate with the online business goal, and validated against past A/B tests?", cost: "you optimize a number decoupled from the business" },
      { dim: "launch-gate", anchor: "what is the launch policy — A/B as the gate, with offline as a filter not the decision?", cost: "offline-only launches keep shipping regressions" },
    ],
    status: "authored" },

  // ── Authored ROOT + variations: Fraud / anomaly detection (2026-07-21).
  { id: "mlsd-fraud-root", roleTrack: "MLE", domain: "fraud", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["fraud", "imbalance", "leakage", "drift", "eval", "root"],
    prompt: "Design a production fraud / anomaly detection system under extreme class imbalance, delayed and partial labels, and an adversary who adapts — deciding in real time at authorization.",
    context: "Positive rate <0.5%. Labels (chargebacks) arrive days later and you never see labels for transactions you BLOCKED. Asymmetric cost: a missed fraud vs a blocked good customer. The adversary adapts to your rules. Decision budget <100ms at auth.",
    produce: { artifact: "architecture + the metric & threshold policy + label/leakage handling + adversary/drift response + the tiered action policy + eval plan + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer designs for the metric, the labels, and the adversary first — the model is the easy part.

1. Imbalance and metric. Accuracy is useless at <0.5% positives. Optimize a cost-weighted objective: PR-AUC / recall at a fixed precision, calibrate probabilities, and pick the threshold from the cost matrix, not 0.5. Resampling / class weights help training but do not change which metric is the truth.

2. Labels are delayed AND partial. Chargebacks arrive late, and blocked transactions never get labeled — a selection-bias feedback loop. Use delayed-label-aware training, handle the blocked/reject cases (counterfactual or review-queue labels), and define the label window deliberately.

3. The adversary adapts. Static rules/features decay; fraud evolves. Monitor for drift, retrain on fresh fraud, and pair a fast rules/GBDT layer with velocity and graph features (fraud rings) — trees remain the production baseline.

4. Leakage and train-serve skew. Features must be point-in-time (never 'was later charged back'), computed by the SAME code offline and online, and cheap enough to fetch inside the auth budget. This is the classic fraud leak: spectacular offline, useless live.

5. Asymmetric action, not a single auto-block. Tier it: high-confidence block, mid-confidence step-up/manual review, low pass — because a wrong block is expensive too, and the review queue also generates labels.

Tradeoffs: recall vs customer friction; model complexity vs the <100ms budget; rules interpretability vs ML coverage.` },
    rubric: [
      { dim: "cost-aware-metric", anchor: "do you optimize a cost-weighted / PR metric at a threshold from the cost matrix, not accuracy at 0.5?", cost: "a 99.5%-accurate model that catches no fraud, or one that blocks good customers" },
      { dim: "delayed-partial-labels", anchor: "do you handle late chargeback labels AND that blocked transactions never get labeled (selection bias)?", cost: "you train on a censored, biased sample and overfit to yesterday's fraud" },
      { dim: "leakage-point-in-time", anchor: "are features point-in-time (no 'was later charged back') and skew-free offline/online?", cost: "spectacular offline, useless live — the classic fraud leak" },
      { dim: "adversary-drift", anchor: "how do you detect adaptation, retrain, and combine velocity/graph (rings) with a fast model?", cost: "the model decays as fraud adapts; rings slip past single-transaction features" },
      { dim: "asymmetric-action", anchor: "is the action tiered (block / step-up / pass) rather than a single auto-block?", cost: "you auto-block good customers or wave fraud through" },
      { dim: "latency", anchor: "does the auth-time decision + feature fetch fit under 100ms?", cost: "misses the auth SLA; unusable at the point of decision" },
    ],
    status: "authored" },

  { id: "mlsd-fraud-var-imbalance", roleTrack: "MLE", domain: "fraud", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-fraud-root",
    tags: ["fraud", "imbalance", "metric", "threshold", "variation"],
    prompt: "Variation of the fraud root: 0.3% positive rate, your model reports 99.7% accuracy and catches almost no fraud. Fix the framing. (Scaffold: the metric layer is given for you to redesign.)",
    context: "The team is celebrating accuracy. Threshold is 0.5. No cost matrix in the pipeline.",
    produce: { artifact: "why accuracy misleads + the metric & threshold you optimize instead + how you set the operating point from cost + what you would NOT do", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "metric-diagnosis", anchor: "do you name accuracy-under-imbalance as the problem and move to PR-AUC / recall-at-precision?", cost: "you keep shipping a model that catches no fraud" },
      { dim: "threshold-from-cost", anchor: "is the operating threshold derived from the cost matrix, not 0.5?", cost: "the decision point is arbitrary and misaligned with money" },
      { dim: "calibration", anchor: "are probabilities calibrated so the threshold means what you think?", cost: "miscalibrated scores make the threshold meaningless" },
      { dim: "anti-pattern", anchor: "do you note that resampling alone does not fix the metric truth?", cost: "you rebalance and still report the wrong number" },
    ],
    status: "authored" },

  { id: "mlsd-fraud-var-leakage", roleTrack: "MLE", domain: "fraud", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-fraud-root",
    tags: ["fraud", "leakage", "selection-bias", "skew", "variation"],
    prompt: "Variation of the fraud root: offline AUC is 0.98, but live catch-rate collapses. Diagnose and fix. (Minimal scaffold.)",
    context: "The training set was built by joining transactions to their eventual chargeback outcome. Blocked transactions were dropped from training. Feature code differs between the training notebook and the serving path.",
    produce: { artifact: "the root cause(s) + the fix (point-in-time features, selection-bias handling, unified feature code) + how you prove the fix", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "leakage-named", anchor: "do you identify post-hoc / future-information leakage (joining to the eventual outcome) as a cause?", cost: "the 0.98 is a mirage; live keeps collapsing" },
      { dim: "selection-bias", anchor: "do you address that dropping blocked transactions censors the training distribution?", cost: "the model never learns the fraud it already blocks; biased sample" },
      { dim: "train-serve-skew", anchor: "do you unify feature code across training and serving?", cost: "different features offline vs online; silent live failure" },
      { dim: "proof", anchor: "how do you prove the fix (temporal backtest, live shadow) rather than trust offline AUC again?", cost: "you re-ship the same leak" },
    ],
    status: "authored" },

  { id: "mlsd-fraud-var-rings", roleTrack: "MLE", domain: "fraud", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-fraud-root",
    tags: ["fraud", "graph", "rings", "velocity", "variation"],
    prompt: "Variation of the fraud root (own it — no scaffold): single-transaction features miss coordinated fraud RINGS (many accounts/cards acting together). Design detection for the ring, not just the transaction.",
    context: "You get the problem only. Bring your own features, model, and serving tradeoffs.",
    produce: { artifact: "how you represent and detect rings (graph / velocity / entity linkage) + how it serves within the latency budget + tradeoffs vs the per-transaction model", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "ring-representation", anchor: "do you model relationships (shared device/card/IP, velocity, graph/entity linkage), not just per-transaction features?", cost: "coordinated rings stay invisible to a transaction-level model" },
      { dim: "graph-or-velocity", anchor: "point to the concrete signal (graph embeddings, connected components, velocity aggregates) that surfaces the ring", cost: "no mechanism actually catches coordination" },
      { dim: "serving-latency", anchor: "how does ring detection fit the real-time budget (precompute graph features vs inline)?", cost: "graph compute blows the auth SLA" },
      { dim: "tradeoff", anchor: "combine ring signals with the fast per-transaction model — stated with the cost?", cost: "either miss rings or miss the latency budget" },
    ],
    status: "authored" },

  // ── Authored ROOT + variations: Drift / monitoring (2026-07-21).
  { id: "mlsd-drift-root", roleTrack: "MLE", domain: "monitoring", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["monitoring", "drift", "delayed-labels", "retraining", "root"],
    prompt: "Design monitoring for a deployed ML model that catches silent degradation — data drift, concept drift, and delayed-label performance loss — before the business notices.",
    context: "Model in production. Labels arrive with delay (or rarely). Inputs shift over time. A silent 10% AUC drop can cost money for weeks before anyone sees it.",
    produce: { artifact: "the monitoring design (label-free + label-based) + the drift taxonomy + alerting + retrain triggers + validation-before-promote + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer monitors BEFORE labels arrive and distinguishes the failure modes.

1. Three different failures, three different detectors. Data drift (input distribution P(x) shifts), concept drift (P(y|x) changes — the world changed), and train-serve skew (offline != online). Each needs a different detector and a different fix; 'monitor drift' generically fixes the wrong thing.

2. Monitor without labels. Because labels are delayed, watch PSI/KL on features, prediction-distribution shift, and proxy metrics day-to-day — these move before the delayed truth arrives.

3. Delayed labels. When outcomes (chargebacks, conversions) land late, backfill the true performance metric and alert on the lag-adjusted metric, not just the proxies.

4. Alerts that get acted on. Use alert bands tied to business impact, not point thresholds — too tight causes fatigue, too loose misses the drop.

5. Retraining triggers + a promote gate. Drift and performance decay trigger retraining, but validate the challenger against the champion before promoting — retraining on drifted/biased data can make it worse.

Tradeoffs: detector sensitivity vs false alarms; retrain frequency vs cost and stability.` },
    rubric: [
      { dim: "drift-taxonomy", anchor: "do you distinguish data drift vs concept drift vs train-serve skew (different detectors/fixes)?", cost: "you 'monitor drift' generically and fix the wrong thing" },
      { dim: "label-free-monitoring", anchor: "what catches degradation WITHOUT labels (PSI/KL, prediction-shift, proxies)?", cost: "you are blind until delayed labels arrive weeks later" },
      { dim: "delayed-label-metric", anchor: "how do you compute true performance once late labels land (backfill, lag-adjusted)?", cost: "you trust proxies and miss a real accuracy collapse" },
      { dim: "alert-design", anchor: "alert bands tied to business impact, not point thresholds that cause fatigue?", cost: "alerts ignored (fatigue) or missed (too loose)" },
      { dim: "retrain-trigger", anchor: "what triggers retrain, and how is the challenger validated before promote?", cost: "you retrain into a worse model, or never retrain at all" },
      { dim: "tradeoff", anchor: "sensitivity vs false alarms (or retrain frequency vs cost) stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-drift-var-nolabels", roleTrack: "MLE", domain: "monitoring", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: null, difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-drift-root",
    tags: ["monitoring", "no-labels", "proxy-metrics", "variation"],
    prompt: "Variation of the drift root: labels arrive 30 days late. How do you know TODAY whether the model degraded? (Scaffold: feature-drift monitoring is given.)",
    context: "You cannot wait a month to find out the model broke.",
    produce: { artifact: "the label-free early-warning design (prediction shift, proxies, calibration) + when you escalate + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "prediction-shift", anchor: "do you monitor the prediction/score distribution shift, not just inputs?", cost: "input drift alone misses concept drift the model already reflects" },
      { dim: "proxies", anchor: "what business/behavioral proxy correlates with performance before labels arrive?", cost: "no early signal; you wait 30 days to learn it broke" },
      { dim: "calibration", anchor: "do you watch calibration drift as a label-light signal?", cost: "miscalibration slips through score-only monitoring" },
      { dim: "escalation", anchor: "what threshold moves you from watch to action pre-labels?", cost: "you see the signal but have no trigger to act" },
    ],
    status: "authored" },

  { id: "mlsd-drift-var-silent", roleTrack: "MLE", domain: "monitoring", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-drift-root",
    tags: ["monitoring", "silent-degradation", "variation"],
    prompt: "Variation of the drift root: AUC quietly dropped 12% three weeks ago and nobody noticed. Design the monitor that would have caught it the same day. (Minimal scaffold.)",
    context: "Only a monthly offline report existed. No live monitors. The drop coincided with an upstream data-schema change.",
    produce: { artifact: "the root cause path + the same-day monitor (feature + prediction + proxy) + the alert + who gets paged", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "upstream-data-check", anchor: "do you catch the upstream schema/data change (null spikes, range shifts) that caused it?", cost: "silent data breakage flows straight into predictions" },
      { dim: "same-day-signal", anchor: "what live signal fires the SAME day, not a monthly report?", cost: "weeks of degraded decisions before the report" },
      { dim: "actionable-alert", anchor: "does the alert page a specific owner with context, not a dashboard nobody watches?", cost: "the signal exists but no one acts" },
      { dim: "anti-pattern", anchor: "do you reject 'a monthly offline eval' as sufficient?", cost: "monthly cadence guarantees weeks of blindness" },
    ],
    status: "authored" },

  { id: "mlsd-drift-var-retrain-loop", roleTrack: "MLE", domain: "monitoring", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-drift-root",
    tags: ["monitoring", "retraining", "champion-challenger", "variation"],
    prompt: "Variation of the drift root (own it — no scaffold): your automatic retraining made the model WORSE — it retrained on drifted, biased data. Fix the retrain loop.",
    context: "You get the incident only. Bring your own validation and promotion design.",
    produce: { artifact: "why auto-retrain degraded + the validation/promote gate (champion-challenger, holdout) + the data-quality guard + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "promote-gate", anchor: "do you require a challenger to beat the champion on a trusted holdout BEFORE promotion?", cost: "auto-promotion ships a worse model" },
      { dim: "data-quality-guard", anchor: "how do you stop retraining on drifted/poisoned/biased data?", cost: "the model learns the drift and degrades further" },
      { dim: "shadow-eval", anchor: "shadow/canary the challenger on live traffic before full promote?", cost: "you find out it is worse only after it ships" },
      { dim: "tradeoff", anchor: "retrain freshness vs stability/validation cost stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  // ── Authored ROOT + variations: Feature pipeline & train-serve skew (2026-07-21).
  { id: "mlsd-feature-root", roleTrack: "MLE", domain: "production", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["feature-pipeline", "train-serve-skew", "point-in-time", "leakage", "root"],
    prompt: "Design the feature pipeline for a real-time ML model so features are correct, point-in-time, and identical offline and online.",
    context: "Batch training + real-time serving. Features come from streams and batch tables. The classic failure: strong offline, broken live.",
    produce: { artifact: "the feature architecture (offline + online store) + point-in-time correctness + skew prevention + versioning/backfill + monitoring + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer makes offline and online features provably identical and point-in-time.

1. Point-in-time correctness. Training features must reflect ONLY what was known at prediction time. A naive join to current tables leaks the future and inflates offline metrics.

2. No train-serve skew — the number-one killer. The same feature definition and code compute features offline (training) and online (serving), via a feature store or a shared library — never two separate implementations that quietly diverge.

3. Online + offline store. A low-latency online store for serving and an offline store for training, with a consistency guarantee between them and an explicit freshness SLA per feature.

4. Versioning and backfill. Features are versioned; changing one is a versioned migration; backfills are point-in-time so history is not silently rewritten.

5. Monitoring. Watch feature drift, null rates, and the training-vs-serving distribution gap so skew surfaces as an alert, not a mystery.

Tradeoffs: freshness vs cost; precompute vs on-demand; store complexity vs consistency guarantees.` },
    rubric: [
      { dim: "point-in-time", anchor: "are training features point-in-time (only what was known at prediction time), with no future leakage in the join?", cost: "leakage: brilliant offline, useless live" },
      { dim: "no-skew", anchor: "same feature definition/code offline and online (store or shared lib), not two implementations?", cost: "train-serve skew — the classic silent live failure" },
      { dim: "online-offline-store", anchor: "an online (low-latency) + offline (training) store with a consistency guarantee and freshness SLA?", cost: "serving features stale or inconsistent with training" },
      { dim: "versioning-backfill", anchor: "are features versioned and backfills point-in-time?", cost: "a feature change silently corrupts historical training data" },
      { dim: "skew-monitoring", anchor: "do you monitor the training-vs-serving feature distribution and null rates?", cost: "skew appears silently and you never see it" },
      { dim: "tradeoff", anchor: "freshness vs cost (or precompute vs on-demand) stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-feature-var-skew", roleTrack: "MLE", domain: "production", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-feature-root",
    tags: ["feature-pipeline", "skew", "variation"],
    prompt: "Variation of the feature root: the model scores 0.92 offline but 0.71 live. The feature code differs between the training notebook and the serving service. Fix it. (Scaffold: skew is diagnosed for you; design the fix.)",
    context: "Two feature implementations drifted apart over months.",
    produce: { artifact: "the unified-feature design (store or shared lib) + how you migrate off the two-implementation setup + how you prove parity", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "single-definition", anchor: "do you collapse to ONE feature definition used by both paths?", cost: "the two implementations keep diverging" },
      { dim: "parity-test", anchor: "how do you prove offline == online for the same input (parity test)?", cost: "you assume parity and skew silently returns" },
      { dim: "migration", anchor: "a safe migration off the dual-implementation setup?", cost: "a big-bang swap breaks serving" },
      { dim: "monitoring", anchor: "ongoing skew monitoring so it cannot silently recur?", cost: "skew creeps back unnoticed" },
    ],
    status: "authored" },

  { id: "mlsd-feature-var-leakage", roleTrack: "MLE", domain: "production", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-feature-root",
    tags: ["feature-pipeline", "leakage", "point-in-time", "variation"],
    prompt: "Variation of the feature root: a feature secretly encodes the label (e.g., 'account_closed' for a churn model). Offline is near-perfect. Find and fix the leak. (Minimal scaffold.)",
    context: "The feature is populated only after the outcome is known.",
    produce: { artifact: "how you detect the leak + the point-in-time fix + how you audit the rest of the feature set for the same problem", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "leak-detected", anchor: "do you identify that the feature is set only AFTER the label event (future info)?", cost: "the 0.99 offline is a mirage; live collapses" },
      { dim: "point-in-time-fix", anchor: "the fix — compute the feature as of prediction time, or drop it?", cost: "the leak persists under a new name" },
      { dim: "audit", anchor: "how do you audit ALL features for the same as-of-outcome leakage?", cost: "you fix one leak and miss three others" },
      { dim: "proof", anchor: "a temporal backtest proving live-like performance?", cost: "you re-trust the leaked offline number" },
    ],
    status: "authored" },

  { id: "mlsd-feature-var-realtime", roleTrack: "MLE", domain: "production", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-feature-root",
    tags: ["feature-pipeline", "streaming", "real-time", "variation"],
    prompt: "Variation of the feature root (own it — no scaffold): design a point-in-time-correct feature pipeline mixing streaming and batch features for a model that must respond in under 50ms.",
    context: "You get the requirement only. Bring your own architecture and tradeoffs.",
    produce: { artifact: "the streaming+batch feature architecture + point-in-time correctness under streaming + the <50ms serving path + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "streaming-pit", anchor: "how do streaming features stay point-in-time correct (event-time, no future leakage)?", cost: "streaming introduces subtle future leakage" },
      { dim: "latency", anchor: "does the online feature fetch + score fit under 50ms (precompute vs on-demand)?", cost: "feature fetch blows the latency budget" },
      { dim: "consistency", anchor: "how are streaming + batch features made consistent at training and serving?", cost: "mixed sources reintroduce skew" },
      { dim: "tradeoff", anchor: "freshness vs latency vs cost stated with the deciding factor?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  // ── Authored ROOT + variations: Experiment / causal inference (2026-07-21).
  { id: "mlsd-causal-root", roleTrack: "MLE", domain: "causal", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["causal", "ab-test", "experimentation", "confounding", "root"],
    prompt: "Design the experimentation and causal-inference approach to prove a change actually CAUSED an outcome — A/B design, the validity threats, and what to do when you cannot randomize.",
    context: "A product change. You must establish causal impact, not correlation. There are network effects, SRM risk, novelty effects, and cases where a clean randomized test is not possible.",
    produce: { artifact: "the A/B design (unit, power, metrics) + the validity checks + the quasi-experiment fallback + how you separate causation from correlation + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer randomizes properly, checks validity, and has a principled fallback when it cannot randomize.

1. Randomize when you can. A/B with the right randomization unit, a power analysis for sample size / minimum detectable effect BEFORE running, one pre-registered primary metric, and guardrails.

2. Guard the validity threats. Sample Ratio Mismatch (a 51/49 split when you expected 50/50 means the experiment is broken — stop and debug). Novelty/primacy effects. Interference / network effects (randomize by cluster, not user). Peeking / multiple testing.

3. Metric design. One primary + guardrails; watch Simpson's paradox and segment heterogeneity; use CUPED to cut variance and reach power faster.

4. When you cannot randomize. Quasi-experiments: difference-in-differences (state the parallel-trends assumption), regression discontinuity, synthetic control, instrumental variables — always name the identifying assumption.

5. Causation != correlation. Name the confounders; a raw before/after or an observational correlation is not a causal claim.

Tradeoffs: experiment duration/power vs decision speed; randomization granularity vs interference; quasi-experiment assumptions vs feasibility.` },
    rubric: [
      { dim: "randomization-and-power", anchor: "proper randomization unit + a power analysis (sample size / MDE) BEFORE running?", cost: "underpowered or mis-randomized: the result is noise you over-interpret" },
      { dim: "validity-threats", anchor: "do you check SRM, novelty, and interference/network effects?", cost: "SRM alone silently invalidates the entire test" },
      { dim: "metric-heterogeneity", anchor: "one primary + guardrails, and do you watch Simpson's paradox / segment effects?", cost: "an aggregate 'win' that is a loss in every segment (or vice versa)" },
      { dim: "cant-randomize", anchor: "when randomization is impossible, do you use a quasi-experiment (DiD/RDD/synthetic control) with its identifying assumption stated?", cost: "you fall back to naive before/after and call correlation causation" },
      { dim: "confounding-named", anchor: "do you name the confounders that make raw correlation non-causal?", cost: "you ship a 'causal' claim that is actually confounded" },
      { dim: "tradeoff", anchor: "duration/power vs speed, or randomization granularity vs interference, stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-causal-var-srm", roleTrack: "MLE", domain: "causal", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-causal-root",
    tags: ["causal", "srm", "ab-test", "variation"],
    prompt: "Variation of the causal root: your A/B shows a big lift, but the traffic split is 51/49 when you configured 50/50. What is wrong, and what do you do? (Scaffold: SRM is the concept in play.)",
    context: "The lift looks great. The assignment counts are 51/49 with a tiny p-value on the ratio.",
    produce: { artifact: "why the 51/49 invalidates the result + how you debug the cause + why you should NOT trust the lift yet", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "srm-invalidates", anchor: "do you state SRM means the randomization is broken, so the lift is untrustworthy — not a real win?", cost: "you ship a 'win' from a broken experiment" },
      { dim: "debug-cause", anchor: "do you hunt the cause (logging bug, bot filtering, redirect, assignment leak)?", cost: "the same bias recurs on the next test" },
      { dim: "stop-not-ship", anchor: "do you stop and fix rather than interpret the biased result?", cost: "biased assignment makes any effect estimate meaningless" },
      { dim: "anti-pattern", anchor: "do you reject 'the split is close enough'?", cost: "a significant SRM is never 'close enough'" },
    ],
    status: "authored" },

  { id: "mlsd-causal-var-cant-randomize", roleTrack: "MLE", domain: "causal", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: null, difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-causal-root",
    tags: ["causal", "quasi-experiment", "diff-in-diff", "variation"],
    prompt: "Variation of the causal root: you cannot randomize — the change is org-wide / has strong network effects. Prove causal impact anyway. (Minimal scaffold.)",
    context: "No control group is possible via user-level randomization.",
    produce: { artifact: "the quasi-experimental design (DiD / synthetic control / RDD) + the identifying assumption + how you test that assumption + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "method-choice", anchor: "do you pick an appropriate quasi-experiment (DiD, synthetic control, RDD) for the situation?", cost: "you default to naive before/after = correlation, not causation" },
      { dim: "identifying-assumption", anchor: "do you state the identifying assumption (e.g., parallel trends) explicitly?", cost: "an unstated assumption makes the causal claim unfalsifiable" },
      { dim: "assumption-test", anchor: "how do you check the assumption (pre-period trends, placebo tests)?", cost: "you assume rather than verify; the estimate may be biased" },
      { dim: "interference", anchor: "do you address the network effect (cluster-level analysis)?", cost: "spillover contaminates any user-level comparison" },
    ],
    status: "authored" },

  { id: "mlsd-causal-var-simpson", roleTrack: "MLE", domain: "causal", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-causal-root",
    tags: ["causal", "simpsons-paradox", "heterogeneity", "variation"],
    prompt: "Variation of the causal root (own it — no scaffold): the feature wins OVERALL but loses in every individual user segment. Explain how that is possible and decide whether to ship.",
    context: "You get the paradox only. Bring your own analysis and decision.",
    produce: { artifact: "the explanation (Simpson's paradox / mix shift) + how you'd determine the true effect + the ship/no-ship decision and why", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "simpson-named", anchor: "do you identify Simpson's paradox / segment-mix shift as the cause?", cost: "you trust the aggregate and ship a per-segment loss" },
      { dim: "mix-mechanism", anchor: "do you explain HOW the mix of segments flips the aggregate sign?", cost: "you cannot tell if the overall number is real or an artifact" },
      { dim: "true-effect", anchor: "how do you estimate the real effect (stratified / covariate-adjusted)?", cost: "you decide on a misleading aggregate" },
      { dim: "decision", anchor: "do you make a defensible ship/no-ship call given the heterogeneity?", cost: "you ship on the headline and hurt every segment" },
    ],
    status: "authored" },

  // ── Authored ROOT + variations: Search / relevance ranking (2026-07-21).
  { id: "mlsd-search-root", roleTrack: "MLE", domain: "search", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["search", "relevance", "learning-to-rank", "hybrid-retrieval", "root"],
    prompt: "Design a search / relevance ranking system — query understanding, retrieval, and learning-to-rank — that returns relevant results fast across head and tail queries.",
    context: "Large catalog. Free-text queries with typos, synonyms, and intent. Head queries are frequent; the long tail is huge. Relevance is judged mostly by clicks (position-biased). Tight latency budget.",
    produce: { artifact: "the search architecture (query understanding -> retrieval -> LTR) + how you handle click bias + the eval + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer treats search as understand -> retrieve -> rank, with click bias handled from the start.

1. Query understanding. Normalize, spell-correct, expand synonyms/intent, recognize entities. Head and tail queries need different handling — the tail has no behavioral signal, so it leans on content.

2. Hybrid retrieval. Lexical (BM25) for exact matches and rare tokens (SKUs, codes) PLUS semantic (dense) for intent — neither alone covers both. Retrieve a candidate set, then rank it.

3. Learning-to-rank. A LTR stage (pointwise/pairwise/listwise) over features: relevance, popularity, freshness, personalization. This is where behavioral signal is learned.

4. Click / position bias. Clicks are confounded by rank — train naively and the model learns position, not relevance (rich-get-richer). Correct with inverse-propensity weighting or randomization, and validate offline NDCG against online outcomes.

5. Eval. Human-judged or click-model relevance, plus latency, zero-result rate, and tail-query coverage — because aggregate NDCG hides the tail.

Tradeoffs: lexical vs semantic recall; personalization vs privacy/latency; rerank depth vs latency.` },
    rubric: [
      { dim: "query-understanding", anchor: "do you handle query understanding (spell/synonym/intent) and treat head vs tail differently?", cost: "typo/intent queries return nothing; the long tail fails" },
      { dim: "hybrid-retrieval", anchor: "lexical (BM25) + semantic (dense) hybrid, not one alone?", cost: "pure-dense misses exact/SKU matches; pure-lexical misses intent" },
      { dim: "learning-to-rank", anchor: "a LTR stage over retrieval with the right features (relevance/popularity/freshness)?", cost: "static ranking that never learns from behavior" },
      { dim: "click-bias", anchor: "do you correct position/click bias in the training signal (IPS/randomization)?", cost: "rich-get-richer; the ranker learns position, not relevance" },
      { dim: "eval", anchor: "relevance validated online + zero-result / tail coverage tracked, not just aggregate NDCG?", cost: "you optimize offline NDCG while users get bad tail results" },
      { dim: "tradeoff", anchor: "lexical vs semantic recall, or rerank depth vs latency, stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-search-var-tail", roleTrack: "MLE", domain: "search", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: null, difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-search-root",
    tags: ["search", "tail-queries", "query-understanding", "variation"],
    prompt: "Variation of the search root: head queries are great, but tail / rare queries return junk or nothing. Fix tail relevance. (Scaffold: hybrid retrieval is given; design query understanding + tail handling.)",
    context: "The tail has little to no click history to learn from.",
    produce: { artifact: "the tail strategy (query understanding, content features, semantic fallback) + how you measure tail quality + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "no-behavioral-signal", anchor: "do you recognize the tail lacks click signal and must lean on content/semantic features?", cost: "you apply head-query methods and the tail stays broken" },
      { dim: "query-understanding", anchor: "spell-correction / synonym / intent expansion for rare queries?", cost: "small variations return zero results" },
      { dim: "semantic-fallback", anchor: "a semantic retrieval fallback when lexical returns nothing?", cost: "zero-result rate stays high on the tail" },
      { dim: "tail-metric", anchor: "do you measure tail quality separately (not hidden in aggregate NDCG)?", cost: "the tail failure is invisible in the headline metric" },
    ],
    status: "authored" },

  { id: "mlsd-search-var-clickbias", roleTrack: "MLE", domain: "search", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-search-root",
    tags: ["search", "click-bias", "position-bias", "variation"],
    prompt: "Variation of the search root: your LTR model learned to rank by position, not relevance — a rich-get-richer loop. Diagnose and fix. (Minimal scaffold.)",
    context: "Training labels are raw clicks. Top-ranked items get more clicks purely because they're on top.",
    produce: { artifact: "why the model learned position + the debiasing fix (IPS / randomization / position feature) + how you prove relevance improved", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "bias-diagnosis", anchor: "do you name position/click bias (clicks confounded by rank) as the cause?", cost: "you retrain on the same biased clicks and reinforce the loop" },
      { dim: "debias-method", anchor: "IPS / randomization / a train-only position feature to break the confound?", cost: "the rich-get-richer loop continues" },
      { dim: "proof", anchor: "how do you prove relevance (not position) improved (interleaving / human judgment)?", cost: "you can't tell if the fix worked" },
      { dim: "anti-pattern", anchor: "do you reject 'just add more click data'?", cost: "more biased data deepens the bias" },
    ],
    status: "authored" },

  { id: "mlsd-search-var-semantic-exact", roleTrack: "MLE", domain: "search", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-search-root",
    tags: ["search", "hybrid", "exact-match", "variation"],
    prompt: "Variation of the search root (own it — no scaffold): semantic search returns 'relevant' results but misses exact product-code / SKU matches users type verbatim. Fix it without losing semantic recall.",
    context: "You get the failure only. Bring your own hybrid/fusion design and tradeoffs.",
    produce: { artifact: "the hybrid design that guarantees exact matches surface AND semantic intent works + the fusion/ranking + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "exact-guaranteed", anchor: "do you guarantee lexical/exact-match retrieval for codes/SKUs alongside dense?", cost: "verbatim searches fail — the most frustrating miss" },
      { dim: "fusion", anchor: "how do you fuse lexical + semantic candidates (e.g. reciprocal rank fusion) without one drowning the other?", cost: "one channel dominates and you lose the other's strength" },
      { dim: "intent-preserved", anchor: "does semantic intent still work for natural-language queries?", cost: "over-indexing on exact match breaks intent search" },
      { dim: "tradeoff", anchor: "lexical vs semantic weighting stated with the deciding factor?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-forecast-root", roleTrack: "MLE", domain: "timeseries", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["forecasting", "time-series", "backtesting", "seasonality", "root"],
    prompt: "Design a demand-forecasting system — many series, seasonality, promotions/holidays, and an honest backtest — that a business can actually plan on.",
    context: "Thousands of item/location series. Strong seasonality + holidays + promo spikes. Some series are short/new (cold start). The forecast drives inventory/staffing, so errors cost money asymmetrically.",
    produce: { artifact: "the forecasting design (features, model choice, hierarchy) + the honest backtest (walk-forward) + intervals + cold start + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer backtests honestly, respects seasonality/hierarchy, and forecasts uncertainty — not just a point.

1. Honest evaluation = walk-forward. Never use random k-fold on time series (it leaks the future). Backtest with rolling-origin / walk-forward splits that mimic how you'll actually forecast.

2. Features and calendar. Encode seasonality, holidays, and promotions explicitly; many 'model' failures are missing calendar/promo features. Classical (ARIMA/ETS) vs tree/GBDT vs neural (N-BEATS/TFT) — pick by data volume and structure; GBDT with lag features is a strong, cheap baseline.

3. Hierarchy and reconciliation. Item/store/region forecasts must reconcile (sum-consistent); forecast at the right level and reconcile across the hierarchy.

4. Forecast intervals, not just points. Inventory/staffing decisions need uncertainty; produce prediction intervals and use the asymmetric cost (a stockout vs overstock) to set the operating quantile.

5. Cold start. New/short series fall back to hierarchy/pooling or similar-item priors.

Tradeoffs: model complexity vs interpretability/cost; point accuracy vs calibrated intervals; global (pooled) vs per-series models.` },
    rubric: [
      { dim: "walk-forward", anchor: "do you backtest with walk-forward / rolling-origin, never random k-fold on time?", cost: "random CV leaks the future; your backtest lies and prod underperforms" },
      { dim: "calendar-promo", anchor: "are seasonality, holidays, and promotions explicit features?", cost: "the model misses the biggest, most predictable spikes" },
      { dim: "hierarchy", anchor: "do forecasts reconcile across the item/store hierarchy (sum-consistent)?", cost: "levels disagree; the plan is internally inconsistent" },
      { dim: "intervals", anchor: "do you produce prediction intervals and set the quantile from the asymmetric cost?", cost: "a point forecast ignores that stockout != overstock cost" },
      { dim: "cold-start", anchor: "how do new/short series forecast (pooling / hierarchy / priors)?", cost: "new items get garbage forecasts" },
      { dim: "tradeoff", anchor: "model complexity vs interpretability/cost stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-forecast-var-leaky-cv", roleTrack: "MLE", domain: "timeseries", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-forecast-root",
    tags: ["forecasting", "backtesting", "leakage", "variation"],
    prompt: "Variation of the forecast root: your model looks great in cross-validation but fails in production. The CV used random k-fold. Fix the evaluation. (Scaffold: the data is time-indexed.)",
    context: "Random splits let the model see future points when predicting past ones.",
    produce: { artifact: "why random CV leaks + the walk-forward backtest + how you re-estimate honest accuracy", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "leakage-named", anchor: "do you identify random k-fold as leaking future into past?", cost: "the rosy CV number is fiction" },
      { dim: "walk-forward-fix", anchor: "rolling-origin / walk-forward that mimics real forecasting?", cost: "any non-temporal split keeps lying" },
      { dim: "gap", anchor: "a purge/gap where features and target windows would overlap?", cost: "subtle leakage through overlapping windows" },
      { dim: "honest-metric", anchor: "do you re-report accuracy on the honest backtest?", cost: "you keep trusting the leaked number" },
    ],
    status: "authored" },

  { id: "mlsd-forecast-var-intervals", roleTrack: "MLE", domain: "timeseries", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: null, difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-forecast-root",
    tags: ["forecasting", "uncertainty", "intervals", "variation"],
    prompt: "Variation of the forecast root: you ship point forecasts, but inventory decisions need uncertainty and the cost of over- vs under-stock is very different. Add calibrated intervals and the right operating point. (Minimal scaffold.)",
    context: "A stockout costs 5x an overstock. Only a point forecast exists.",
    produce: { artifact: "the interval/quantile design + how the asymmetric cost sets the operating quantile + how you check calibration", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "intervals", anchor: "do you produce prediction intervals / quantiles, not just a point?", cost: "decisions ignore uncertainty" },
      { dim: "asymmetric-quantile", anchor: "is the operating quantile set from the 5:1 cost, not the median?", cost: "you optimize the mean and eat stockouts" },
      { dim: "calibration", anchor: "how do you verify the intervals are calibrated (coverage)?", cost: "miscalibrated intervals mislead planning" },
      { dim: "anti-pattern", anchor: "do you reject 'just forecast the mean'?", cost: "the mean is the wrong target under asymmetric cost" },
    ],
    status: "authored" },

  { id: "mlsd-forecast-var-hierarchy", roleTrack: "MLE", domain: "timeseries", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-forecast-root",
    tags: ["forecasting", "hierarchical", "reconciliation", "variation"],
    prompt: "Variation of the forecast root (own it — no scaffold): item-level, store-level, and region-level forecasts don't add up, and planners don't trust the numbers. Design hierarchical forecasting that reconciles.",
    context: "You get the inconsistency only. Bring your own reconciliation approach and tradeoffs.",
    produce: { artifact: "the hierarchical forecasting + reconciliation design + which level you forecast at and why + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "reconciliation", anchor: "do you reconcile so levels are sum-consistent (top-down / bottom-up / optimal)?", cost: "levels disagree; nobody trusts the plan" },
      { dim: "forecast-level", anchor: "do you justify which level(s) you forecast at (signal vs noise)?", cost: "forecasting only at a noisy level wastes signal" },
      { dim: "coherence", anchor: "is coherence guaranteed after reconciliation?", cost: "incoherent forecasts drive contradictory decisions" },
      { dim: "tradeoff", anchor: "reconciliation method complexity vs accuracy stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-churn-root", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["churn", "propensity", "uplift", "imbalance", "root"],
    prompt: "Design a churn / propensity system that not only predicts who will leave, but drives action that actually reduces churn — and is measured honestly.",
    context: "Subscription product. Churn is rare-ish and delayed. The goal isn't a churn score, it's retained customers. A naive 'predict churn, message the top-K' often wastes budget on people who'd stay anyway.",
    produce: { artifact: "the design (label/horizon, features, model) + why UPLIFT not raw propensity + honest measurement + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer optimizes the ACTION (uplift), not just a churn score, and measures with a holdout.

1. Define the label and horizon carefully. What is 'churn' (voluntary vs involuntary) and over what window? A fuzzy label makes everything downstream noise.

2. Propensity is not the goal — uplift is. Targeting the highest-churn users wastes spend on the 'lost causes' and 'sure things'. Model UPLIFT (treatment effect): who is persuadable by the intervention. This is a causal, not a predictive, target.

3. Leakage and point-in-time. Churn features love to leak (e.g. 'cancellation_page_visited'); features must be as-of the prediction time, not post-outcome.

4. Imbalance and calibration. Optimize a cost/recall metric, calibrate probabilities, and set the intervention threshold from the economics (offer cost vs retained value), not 0.5.

5. Measure with a holdout. Prove the program reduces churn via a randomized control (treated vs untreated), not a before/after — otherwise you can't tell if the model or seasonality drove the change.

Tradeoffs: propensity simplicity vs uplift correctness; intervention cost vs retained value; recall vs wasted spend.` },
    rubric: [
      { dim: "uplift-not-propensity", anchor: "do you target UPLIFT/persuadable users, not just highest churn propensity?", cost: "you spend retention budget on lost-causes and sure-things; no net effect" },
      { dim: "label-horizon", anchor: "is churn defined (voluntary vs involuntary) over a clear horizon?", cost: "a fuzzy label makes the whole model noise" },
      { dim: "leakage-pit", anchor: "are features point-in-time (no post-outcome leak like 'visited cancel page')?", cost: "leakage: perfect offline, useless for early intervention" },
      { dim: "calibration-threshold", anchor: "calibrated probabilities + an intervention threshold from offer-cost vs retained-value?", cost: "you message the wrong people at 0.5 and burn budget" },
      { dim: "holdout-measure", anchor: "do you prove churn reduction with a randomized holdout, not before/after?", cost: "you can't tell if the program or seasonality moved churn" },
      { dim: "tradeoff", anchor: "intervention cost vs retained value stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-churn-var-uplift", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-churn-root",
    tags: ["churn", "uplift", "targeting", "variation"],
    prompt: "Variation of the churn root: you message the top-K highest-churn users with a retention offer and it barely moves churn. Explain and fix the targeting. (Scaffold: you have a propensity model.)",
    context: "Many high-churn users were leaving no matter what; some were never going to leave.",
    produce: { artifact: "why propensity-targeting fails + the uplift/persuadable-targeting fix + how you measure incremental impact", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "propensity-vs-uplift", anchor: "do you explain propensity targets churners, uplift targets the PERSUADABLE?", cost: "you keep spending on lost-causes/sure-things" },
      { dim: "uplift-model", anchor: "an uplift/treatment-effect model (T-learner / meta-learner) rather than raw churn?", cost: "no way to find who the offer actually moves" },
      { dim: "incremental-measure", anchor: "do you measure INCREMENTAL churn reduction vs a control?", cost: "you can't tell if the offer did anything" },
      { dim: "budget", anchor: "do you allocate budget by uplift, not propensity rank?", cost: "budget wasted on the unpersuadable" },
    ],
    status: "authored" },

  { id: "mlsd-churn-var-leakage", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-churn-root",
    tags: ["churn", "leakage", "point-in-time", "variation"],
    prompt: "Variation of the churn root: your churn model is 0.97 AUC offline but useless for early intervention. A feature encodes the outcome. Find and fix. (Minimal scaffold.)",
    context: "A feature like 'days_since_cancellation_request' is populated only for churners.",
    produce: { artifact: "how you detect the leak + the point-in-time fix + how early the model can honestly predict", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "leak-detected", anchor: "do you find the post-outcome feature (set only after churn intent)?", cost: "0.97 is a mirage; useless for early action" },
      { dim: "horizon-honest", anchor: "do you fix features to be as-of an early prediction time?", cost: "you can only 'predict' churn once it's too late to act" },
      { dim: "audit", anchor: "do you audit all features for as-of-outcome leakage?", cost: "one leak fixed, others remain" },
      { dim: "usefulness", anchor: "can the fixed model predict early enough to intervene?", cost: "a leak-free but too-late model is worthless" },
    ],
    status: "authored" },

  { id: "mlsd-churn-var-measure", roleTrack: "MLE", domain: "recsys", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-churn-root",
    tags: ["churn", "causal-measurement", "holdout", "variation"],
    prompt: "Variation of the churn root (own it — no scaffold): leadership says churn dropped after you launched the model, but you can't prove the model caused it. Design the measurement that would.",
    context: "You get the claim only. Bring your own experiment/measurement design.",
    produce: { artifact: "the randomized-holdout / measurement design that isolates the program's causal effect + guardrails + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "randomized-holdout", anchor: "do you hold out a randomized control (untreated) to isolate causal effect?", cost: "before/after confounds the model with seasonality/other changes" },
      { dim: "confounders", anchor: "do you name the confounders a before/after would miss?", cost: "you credit the model for a seasonal dip" },
      { dim: "incrementality", anchor: "is the metric incremental retained customers, not raw churn rate?", cost: "you measure the wrong thing" },
      { dim: "tradeoff", anchor: "holdout cost (untreated churners) vs measurement rigor stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-pricing-root", roleTrack: "MLE", domain: "pricing", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["pricing", "elasticity", "causal", "experimentation", "root"],
    prompt: "Design a dynamic-pricing system that sets prices to a business objective (revenue/margin) using price elasticity — measured causally, not from correlational history.",
    context: "Marketplace/retail. You control price; you want to optimize revenue or margin. The trap: historical price-vs-demand is confounded (you already priced high when demand was high). Also cold-start items and fairness/guardrail constraints.",
    produce: { artifact: "the pricing design (elasticity estimation, optimization, guardrails) + why history is confounded + how you estimate elasticity causally + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer estimates elasticity CAUSALLY and optimizes within guardrails — it never trusts raw historical price-demand.

1. History is confounded. Observed price-vs-demand reflects your past pricing decisions (you raised price when demand was high). Fitting demand on historical price learns the confound, not elasticity, and will price exactly wrong.

2. Estimate elasticity causally. Use price experiments (randomized/geo tests), or quasi-experiments / instrumental variables when you can't randomize; that's the only way to get the true demand response to price.

3. Optimize to the objective. Given elasticity, optimize revenue or margin (not units), respecting inventory/competition and business constraints.

4. Guardrails and fairness. Min/max price bounds, no discriminatory pricing, and stability limits so prices don't oscillate wildly or exploit customers.

5. Cold start and exploration. New items have no elasticity estimate; use category priors and controlled exploration to learn without tanking revenue.

Tradeoffs: exploration (learning elasticity) vs short-term revenue; model complexity vs interpretability; personalization vs fairness/regulation.` },
    rubric: [
      { dim: "confounded-history", anchor: "do you recognize historical price-demand is confounded by your own past pricing (not causal elasticity)?", cost: "you fit the confound and price exactly wrong" },
      { dim: "causal-elasticity", anchor: "do you estimate elasticity causally (price experiments / geo tests / IV)?", cost: "correlational elasticity gives backwards price moves" },
      { dim: "optimize-objective", anchor: "do you optimize revenue/margin (the objective), not units, within constraints?", cost: "you maximize the wrong quantity" },
      { dim: "guardrails-fairness", anchor: "price bounds, stability, and no discriminatory pricing?", cost: "wild oscillation, customer exploitation, or regulatory/fairness breach" },
      { dim: "cold-start-explore", anchor: "priors + controlled exploration for items with no elasticity estimate?", cost: "new items priced blind; or exploration tanks revenue" },
      { dim: "tradeoff", anchor: "exploration vs short-term revenue stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-pricing-var-confounded", roleTrack: "MLE", domain: "pricing", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-pricing-root",
    tags: ["pricing", "confounding", "elasticity", "variation"],
    prompt: "Variation of the pricing root: your model learned from historical sales that higher price => higher demand (because you priced up in peak season). It's about to raise prices and kill demand. Fix the elasticity estimation. (Scaffold: you have historical logs.)",
    context: "Price and demand are both driven by season; the naive fit is backwards.",
    produce: { artifact: "why the naive fit is backwards + the causal elasticity fix + how you validate it before trusting", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "confounder-named", anchor: "do you name season (or demand) as the confounder driving both price and sales?", cost: "you deploy a backwards price rule" },
      { dim: "causal-fix", anchor: "price experiment / geo test / IV to get true elasticity?", cost: "correlation stays backwards" },
      { dim: "validate", anchor: "how do you validate the elasticity before letting it set prices?", cost: "an untested elasticity risks real revenue" },
      { dim: "anti-pattern", anchor: "do you reject 'fit demand on historical price'?", cost: "that's exactly what learns the confound" },
    ],
    status: "authored" },

  { id: "mlsd-pricing-var-guardrails", roleTrack: "MLE", domain: "pricing", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: null, difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-pricing-root",
    tags: ["pricing", "guardrails", "fairness", "variation"],
    prompt: "Variation of the pricing root: your optimizer set an absurd price (or oscillates) and PR/legal are worried about exploitation. Add guardrails. (Minimal scaffold.)",
    context: "The optimizer maximizes revenue with no bounds or fairness constraints.",
    produce: { artifact: "the guardrail design (bounds, stability, fairness/no-discrimination) + how you keep optimization useful within them", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "bounds", anchor: "min/max price bounds and rate-of-change limits?", cost: "absurd prices / wild oscillation" },
      { dim: "fairness", anchor: "no discriminatory/exploitative pricing (protected attributes, vulnerable moments)?", cost: "reputational and legal exposure" },
      { dim: "stability", anchor: "stability so prices don't thrash?", cost: "customers see erratic prices and lose trust" },
      { dim: "still-useful", anchor: "does optimization still work within the guardrails?", cost: "guardrails that neuter the system entirely" },
    ],
    status: "authored" },

  { id: "mlsd-pricing-var-coldstart", roleTrack: "MLE", domain: "pricing", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-pricing-root",
    tags: ["pricing", "cold-start", "exploration", "variation"],
    prompt: "Variation of the pricing root (own it — no scaffold): brand-new products have no price-elasticity data. Design how you price and learn without tanking revenue.",
    context: "You get the situation only. Bring your own priors + exploration design.",
    produce: { artifact: "the cold-start pricing (category priors, controlled exploration/bandit) + how you learn elasticity safely + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "priors", anchor: "do you start from category/similar-item elasticity priors?", cost: "new items priced blind" },
      { dim: "controlled-exploration", anchor: "controlled exploration / bandit to learn elasticity without big revenue risk?", cost: "either you never learn, or exploration tanks revenue" },
      { dim: "safe-learning", anchor: "bounds on how much you explore per item?", cost: "unbounded exploration burns money" },
      { dim: "tradeoff", anchor: "learning speed vs revenue risk stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-classical-root", roleTrack: "MLE", domain: "classical", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["classical-ml", "gbdt", "model-selection", "tabular", "root"],
    prompt: "Given a tabular production problem, choose the model — and defend why gradient-boosted trees (XGBoost/LightGBM) are often the right answer over deep learning, or when they are not.",
    context: "A tabular prediction task (ranking/fraud/risk/conversion) at a company where a team wants to use deep learning because it's modern. Data is mostly structured/tabular, moderate scale, with a real latency/maintenance budget.",
    produce: { artifact: "the model-selection decision + why GBDT vs DL for THIS problem + when DL wins + how you'd validate + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer defaults to GBDT for tabular and justifies deep learning only when the data structure demands it.

1. On tabular data, GBDT usually wins. XGBoost/LightGBM handle heterogeneous features, missing values, and non-linear interactions with little preprocessing, train fast, and are cheap to serve — still the production baseline across Uber/Stripe/DoorDash-style stacks.

2. When DL actually wins. High-cardinality embeddings, sequences/text/images, or where you need representation learning / transfer — or when you're fusing tabular with unstructured signals. Not 'because it's modern'.

3. Baseline first. Always establish the GBDT baseline before a DL project; most DL-on-tabular efforts don't beat a well-tuned GBDT and cost far more to build and maintain.

4. Features still dominate. On tabular, feature engineering + a GBDT beats a fancy architecture on raw columns. Spend effort there.

5. Validate honestly. Proper CV (temporal if time-based), the same metric as production, and a cost/latency comparison — the 'better' model must beat the baseline on the metric AND the budget.

Tradeoffs: GBDT simplicity/serving-cost/interpretability vs DL representation power; build+maintenance cost; interpretability needs (regulated domains favor trees + SHAP).` },
    rubric: [
      { dim: "gbdt-default-tabular", anchor: "do you default to GBDT for tabular and justify it (heterogeneous features, speed, serving cost)?", cost: "you burn months on DL that a tuned GBDT beats" },
      { dim: "when-dl-wins", anchor: "do you name where DL genuinely wins (embeddings, sequences/text/images, fusion), not 'it's modern'?", cost: "wrong tool either way — DL where trees win, or trees where DL is needed" },
      { dim: "baseline-first", anchor: "do you establish the GBDT baseline before any DL project?", cost: "no baseline; you can't prove DL was worth it" },
      { dim: "features-dominate", anchor: "do you prioritize feature engineering over architecture on tabular?", cost: "you tune architecture while features are the real lever" },
      { dim: "honest-validation", anchor: "proper (temporal) CV + same metric + a cost/latency comparison?", cost: "you pick the 'better' model that's worse on the budget" },
      { dim: "interpretability", anchor: "do you weigh interpretability (trees + SHAP) where the domain is regulated?", cost: "an unexplainable model fails a regulated use case" },
    ],
    status: "authored" },

  { id: "mlsd-classical-var-dl-reflex", roleTrack: "MLE", domain: "classical", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: null, difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-classical-root",
    tags: ["classical-ml", "gbdt-vs-dl", "variation"],
    prompt: "Variation of the classical root: a team wants a deep net for a tabular fraud/conversion problem because it's 'more advanced.' Make the call. (Scaffold: the data is mostly tabular.)",
    context: "Moderate tabular data, tight latency and maintenance budget, some interpretability need.",
    produce: { artifact: "the recommendation + why GBDT fits here + when you'd revisit DL + how you'd prove it", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "gbdt-case", anchor: "do you make the concrete case for GBDT on this tabular problem?", cost: "you green-light an expensive DL project that likely underperforms" },
      { dim: "when-revisit-dl", anchor: "do you state the conditions that would justify DL later?", cost: "a dogmatic 'never DL' answer, equally wrong" },
      { dim: "baseline-proof", anchor: "do you require the GBDT baseline as the bar DL must beat?", cost: "no baseline; the debate is vibes" },
      { dim: "budget", anchor: "do you weigh latency/maintenance/interpretability, not just accuracy?", cost: "you pick on accuracy and lose on the budget that matters" },
    ],
    status: "authored" },

  { id: "mlsd-classical-var-dl-needed", roleTrack: "MLE", domain: "classical", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: null, difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-classical-root",
    tags: ["classical-ml", "when-dl", "embeddings", "variation"],
    prompt: "Variation of the classical root: your GBDT plateaued and the signal is in high-cardinality IDs and text you're not using. Decide what to change. (Minimal scaffold.)",
    context: "Millions of sparse IDs + free-text fields; GBDT can't represent them well.",
    produce: { artifact: "why GBDT plateaus here + what DL/embeddings buy + a hybrid path (embeddings + GBDT, or DLRM) + how you validate the gain", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "diagnose-limit", anchor: "do you identify high-cardinality/text as where GBDT struggles (representation)?", cost: "you keep tuning GBDT past its ceiling" },
      { dim: "embeddings", anchor: "embeddings / DL for the sparse/text signal (possibly fused with GBDT)?", cost: "the real signal stays unused" },
      { dim: "hybrid", anchor: "do you consider a hybrid (embeddings as features into GBDT, or DLRM)?", cost: "an all-or-nothing swap ignores GBDT's remaining value" },
      { dim: "prove-gain", anchor: "do you validate the DL/embedding gain beats the GBDT baseline on metric AND cost?", cost: "you adopt DL without proving it earns its cost" },
    ],
    status: "authored" },

  { id: "mlsd-classical-var-interpretability", roleTrack: "MLE", domain: "classical", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-classical-root",
    tags: ["classical-ml", "interpretability", "regulated", "variation"],
    prompt: "Variation of the classical root (own it — no scaffold): the use case is credit/lending (regulated) — you must explain every decision. Choose and justify the model and the explanation approach.",
    context: "You get the constraint only. Bring your own model + interpretability design.",
    produce: { artifact: "the model choice for a regulated decision + the explanation approach (SHAP/reason codes/monotonic constraints) + how you satisfy the regulator + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "explainable-choice", anchor: "do you choose a model you can explain per-decision (GBDT+SHAP / monotonic / GLM), not a black box?", cost: "an unexplainable model fails compliance (ECOA/reason codes)" },
      { dim: "reason-codes", anchor: "can you produce adverse-action reason codes per decision?", cost: "you can't legally deny credit without them" },
      { dim: "monotonic", anchor: "do you use monotonic constraints where the direction is required (e.g. more debt -> higher risk)?", cost: "counter-intuitive, indefensible decisions" },
      { dim: "tradeoff", anchor: "accuracy vs interpretability stated for the regulated context?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-imbalance-root", roleTrack: "MLE", domain: "eval", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["imbalance", "calibration", "threshold", "metrics", "root"],
    prompt: "Design the modeling + evaluation approach for a rare-positive classification problem so the model is useful, calibrated, and set at the right operating point.",
    context: "A binary problem with ~1% positives (rare event: fault, default, rare disease, abuse). The action taken depends on a threshold, and false positives and false negatives have very different costs.",
    produce: { artifact: "the approach (handling imbalance, metric, calibration, threshold) + why accuracy is wrong + how you set the operating point + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer chooses a cost-aware metric, calibrates, and sets the threshold from economics — not 0.5, not accuracy.

1. Accuracy is meaningless at 1% positives. A model predicting 'never' scores 99%. Use PR-AUC or recall-at-fixed-precision; ROC-AUC can look great while precision is unusable at the operating point.

2. Handle imbalance in TRAINING, not the metric. Class weights / focal loss / resampling help the model learn the minority — but they change the score distribution, so you must recalibrate afterward. They do not change which metric is the truth.

3. Calibrate. If you threshold or price on the probability, it must mean what it says (Platt/isotonic). Resampling in particular breaks calibration.

4. Set the threshold from cost. The operating point comes from the FP vs FN cost matrix, not 0.5. Often you pick recall at a precision the business can tolerate.

5. Watch the tail and drift. Rare-event models degrade quietly; monitor precision at the operating point and recalibrate as base rates shift.

Tradeoffs: precision vs recall at the operating point; resampling (recall) vs calibration; threshold strictness vs review capacity.` },
    rubric: [
      { dim: "not-accuracy", anchor: "do you reject accuracy and use PR-AUC / recall-at-precision for the 1% positive rate?", cost: "a 99%-accurate model that catches nothing looks great and is useless" },
      { dim: "imbalance-in-training", anchor: "class weights / focal / resampling to learn the minority — while knowing it doesn't change the metric truth?", cost: "the model ignores the rare class, or you fool yourself with a rebalanced metric" },
      { dim: "calibration", anchor: "do you calibrate probabilities (esp. after resampling) if you threshold/price on them?", cost: "the threshold means nothing; decisions are miscalibrated" },
      { dim: "threshold-from-cost", anchor: "is the operating threshold set from the FP/FN cost matrix, not 0.5?", cost: "an arbitrary cutoff misaligned with the real costs" },
      { dim: "monitor-tail", anchor: "do you monitor precision at the operating point as base rates drift?", cost: "the rare-event model degrades silently" },
      { dim: "tradeoff", anchor: "precision vs recall at the operating point stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-imbalance-var-accuracy-trap", roleTrack: "MLE", domain: "eval", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-imbalance-root",
    tags: ["imbalance", "metric", "variation"],
    prompt: "Variation of the imbalance root: your rare-disease classifier reports 99% accuracy and management is thrilled — but it catches almost no positives. Explain and fix. (Scaffold: the metric layer is yours to redesign.)",
    context: "1% prevalence, threshold 0.5, accuracy reported.",
    produce: { artifact: "why accuracy misleads + the metric/threshold you use instead + how you set the operating point", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "accuracy-trap", anchor: "do you explain 'predict negative' scores 99% under 1% prevalence?", cost: "you celebrate a useless model" },
      { dim: "right-metric", anchor: "PR-AUC / recall-at-precision instead?", cost: "you keep optimizing the wrong number" },
      { dim: "threshold", anchor: "operating threshold from cost, not 0.5?", cost: "arbitrary cutoff" },
      { dim: "anti-pattern", anchor: "do you reject 'accuracy is high, ship it'?", cost: "the model never catches the thing it's for" },
    ],
    status: "authored" },

  { id: "mlsd-imbalance-var-calibration", roleTrack: "MLE", domain: "eval", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-imbalance-root",
    tags: ["imbalance", "calibration", "resampling", "variation"],
    prompt: "Variation of the imbalance root: you oversampled to fix imbalance, and now the model's predicted probabilities are way off (it says 40% when the true rate is 4%). Fix calibration. (Minimal scaffold.)",
    context: "Downstream decisions threshold and price on the probability, so miscalibration is costly.",
    produce: { artifact: "why resampling broke calibration + the recalibration fix (Platt/isotonic, prior-correction) + how you verify calibration", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "resampling-breaks-cal", anchor: "do you explain oversampling shifts the base rate and miscalibrates outputs?", cost: "probabilities are inflated; every threshold/price is wrong" },
      { dim: "recalibrate", anchor: "Platt/isotonic or prior-correction back to the true base rate?", cost: "outputs stay uncalibrated" },
      { dim: "verify", anchor: "do you check calibration (reliability curve / ECE)?", cost: "you assume it's fixed" },
      { dim: "when-not-resample", anchor: "do you consider class weights (which preserve calibration better) as an alternative?", cost: "you reach for resampling reflexively" },
    ],
    status: "authored" },

  { id: "mlsd-imbalance-var-threshold", roleTrack: "MLE", domain: "eval", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-imbalance-root",
    tags: ["imbalance", "threshold", "cost-matrix", "variation"],
    prompt: "Variation of the imbalance root (own it — no scaffold): a false negative costs 20x a false positive, and you have limited human review capacity. Set the operating point and design the workflow.",
    context: "You get the costs + capacity only. Bring your own threshold + workflow design.",
    produce: { artifact: "the operating-point choice from the 20:1 cost + capacity + the tiered workflow (auto/review/pass) + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "cost-driven-threshold", anchor: "is the threshold derived from the 20:1 FN:FP cost, not a default?", cost: "you optimize the wrong balance and eat expensive false negatives" },
      { dim: "capacity-aware", anchor: "does the operating point respect the finite review capacity?", cost: "you flag more than humans can review; the queue collapses" },
      { dim: "tiered-workflow", anchor: "a tiered auto/review/pass workflow rather than a single hard cutoff?", cost: "binary decisions waste the cost asymmetry and capacity" },
      { dim: "tradeoff", anchor: "recall (catch FNs) vs review load stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-moderation-root", roleTrack: "MLE", domain: "risk", modality: "system-design",
    specLevel: "S1", withheld: [], flawMode: null, difficulty: "senior", companies: ["Any"], isRoot: true,
    tags: ["content-moderation", "abuse", "adversarial", "scale", "root"],
    prompt: "Design a content-moderation system at scale — detect abusive/harmful content across millions of items, adversarial evasion, ambiguous policy, and a human-review loop.",
    context: "A UGC platform. Millions of posts/day. Harmful categories (spam, hate, CSAM-adjacent, fraud). Adversaries actively evade. Policy is nuanced and context-dependent. Both false negatives (harm reaches users) and false positives (wrongful removal) are costly, asymmetrically by category.",
    produce: { artifact: "the moderation design (tiered detection, human review, adversarial robustness, appeals) + per-category cost handling + eval + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution", worked: `A strong answer tiers automation by risk, plans for adversaries, and closes the human + appeals loop.

1. Tier by risk and confidence. High-confidence severe content -> auto-action; ambiguous/mid-confidence -> human review; low -> allow. The cost asymmetry differs by category (CSAM-adjacent errs toward removal; satire errs toward review), so thresholds are per-category.

2. Adversaries adapt. Evasion (leetspeak, image-in-image, coded language) means static rules/keywords decay. Combine ML with signals adversaries can't easily fake (account/behavioral/graph), monitor for evasion, and retrain on fresh adversarial examples.

3. Context matters. The same words can be hate or a quote reporting hate. Use context (thread, user, intent) — pure keyword matching over-removes and under-catches.

4. Human-in-the-loop + appeals. A review queue for ambiguity generates labels; an appeals path corrects false positives and feeds training. Wrongful removal is a real harm.

5. Eval per category with the right metric. Recall on severe harm, precision on high-false-positive-cost categories, plus reviewer agreement and prevalence tracking.

Tradeoffs: automation speed vs review accuracy; recall (catch harm) vs precision (wrongful removal); latency of review vs harm exposure time.` },
    rubric: [
      { dim: "tiered-by-risk", anchor: "do you tier auto-action / review / allow by confidence AND per-category cost, not one global threshold?", cost: "you over-remove satire or under-catch severe harm" },
      { dim: "adversarial", anchor: "do you plan for evasion (hard-to-fake signals, retraining on fresh adversarial examples)?", cost: "keyword/static rules decay; adversaries route around you" },
      { dim: "context", anchor: "do you use context (thread/user/intent), not pure keyword matching?", cost: "quotes/satire wrongly removed; coded harm missed" },
      { dim: "human-appeals", anchor: "a review queue + appeals path that also generates labels and corrects false positives?", cost: "wrongful removals stand; no label flywheel" },
      { dim: "per-category-eval", anchor: "recall on severe harm, precision where wrongful-removal cost is high, + reviewer agreement?", cost: "one aggregate metric hides category-specific failures" },
      { dim: "tradeoff", anchor: "automation speed vs review accuracy (or recall vs precision) stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

  { id: "mlsd-moderation-var-adversarial", roleTrack: "MLE", domain: "risk", modality: "system-design",
    specLevel: "S2", withheld: ["reference-prose"], flawMode: "silent", difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-moderation-root",
    tags: ["content-moderation", "adversarial", "evasion", "variation"],
    prompt: "Variation of the moderation root: your keyword/classifier setup worked, then abusers started using leetspeak, images, and coded language to evade it. Make it robust. (Scaffold: you have a text classifier.)",
    context: "Detection rate dropped as evasion spread; the classifier only sees literal text.",
    produce: { artifact: "why static detection decays + the robustness fix (multimodal, behavioral/graph signals, adversarial retraining) + how you monitor evasion", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "evasion-diagnosis", anchor: "do you name adversarial evasion of literal-text detection as the cause?", cost: "you keep patching keywords and lose the race" },
      { dim: "hard-to-fake-signals", anchor: "behavioral/account/graph signals adversaries can't easily fake?", cost: "content-only signals are trivially evaded" },
      { dim: "multimodal", anchor: "do you cover image/coded content, not just text?", cost: "harm moves to the modality you don't inspect" },
      { dim: "retrain-loop", anchor: "retraining on fresh evasion examples + evasion monitoring?", cost: "the model decays as tactics evolve" },
    ],
    status: "authored" },

  { id: "mlsd-moderation-var-false-positive", roleTrack: "MLE", domain: "risk", modality: "system-design",
    specLevel: "S3", withheld: ["reference-prose", "stage-skeleton"], flawMode: null, difficulty: "senior", companies: ["Any"], parentRoot: "mlsd-moderation-root",
    tags: ["content-moderation", "false-positive", "context", "variation"],
    prompt: "Variation of the moderation root: the system wrongly removes legitimate posts (quotes, satire, reclaimed language) and users are angry. Cut false positives without letting harm through. (Minimal scaffold.)",
    context: "Pure keyword/classifier matching ignores context and intent.",
    produce: { artifact: "why context-blind matching over-removes + the fix (context features, review for ambiguity, appeals) + how you balance the two error types", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "context-cause", anchor: "do you identify context-blindness (same words, different intent) as the cause?", cost: "quotes/satire keep getting removed" },
      { dim: "context-features", anchor: "context/intent signals (thread, speaker, quoting) added?", cost: "over-removal persists" },
      { dim: "review-ambiguous", anchor: "route ambiguous cases to human review instead of auto-removing?", cost: "borderline cases wrongly actioned at scale" },
      { dim: "balance", anchor: "do you hold severe-harm recall while cutting false positives (not just loosen everything)?", cost: "you fix false positives and let real harm through" },
    ],
    status: "authored" },

  { id: "mlsd-moderation-var-severity", roleTrack: "MLE", domain: "risk", modality: "system-design",
    specLevel: "S4", withheld: ["reference-prose", "stage-skeleton", "hints"], flawMode: null, difficulty: "staff", companies: ["Any"], parentRoot: "mlsd-moderation-root",
    tags: ["content-moderation", "severity", "policy", "variation"],
    prompt: "Variation of the moderation root (own it — no scaffold): different harm categories have wildly different costs — a wrong call on severe harm vs a wrong call on mild spam. Design the per-category severity and action policy.",
    context: "You get the categories only. Bring your own severity model + action/threshold policy.",
    produce: { artifact: "the per-category severity + action policy (auto/review/allow thresholds by category) + how you tune each + tradeoffs", format: "design-doc", workspace: "in-app-text" },
    reference: { type: "solution" }, selfCheck: null,
    rubric: [
      { dim: "per-category-cost", anchor: "do you set thresholds/actions per category from its specific error costs?", cost: "a single policy over- or under-actions every category" },
      { dim: "severe-recall", anchor: "does severe harm err toward recall/removal (high FN cost)?", cost: "severe harm slips through on a balanced threshold" },
      { dim: "mild-precision", anchor: "does low-severity err toward precision/allow (avoid over-removal)?", cost: "you over-remove trivial content and anger users" },
      { dim: "tradeoff", anchor: "per-category recall vs precision, tied to harm cost, stated?", cost: "reads as no real decision" },
    ],
    status: "authored" },

];
