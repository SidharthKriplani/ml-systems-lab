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

];
