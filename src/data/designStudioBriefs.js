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

];
