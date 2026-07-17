// mlSystemDesignBriefs.js — Design Studio, MSL (MLE track). SKELETONS ONLY (2026-07-17).
// NEW surface for MSL (it had no open-ended design/notebook brief bank — its
// interviewExtra* are Q&A, moduleTiers are foundations). Mirrors the proven GSL
// SD_SCENARIOS schema for cross-lab behavioral uniformity (LAB-STANDARDS), PLUS:
//   modality: 'system-design' (no build, live design; DESIGN_ARC)
//           | 'notebook-build' (build-it-yourself on given data, NO LLM; NOTEBOOK_ARC)
//   specLevel: S1-S4 + withheld[]  (Dial A — see DESIGN-STUDIO-SPEC.md §1).
// Flesh per §4: stage `ask` PINNED; considerations/strong/traps/probes DEFERRED
// (write per `_flesh`). Build TODO: an MSL SystemDesignTrainer twin (or reuse GSL's
// component in MSL amber theme). Voice: same as GSL SD (first-principles, concrete
// numbers, real tradeoffs, English only, no emojis).

const DESIGN_ARC = ["requirements", "architecture", "deep-dive", "evaluation", "tradeoffs"];
const NOTEBOOK_ARC = ["framing", "data-and-leakage", "model", "eval-protocol", "calibration-and-tradeoffs"];

export const ML_SYSTEM_DESIGN_BRIEFS = [
  // 9) recsys, system-design, S2.
  {
    id: "mlsd-recsys-feed", title: "Personalized feed recommender", roleTrack: "MLE",
    modality: "system-design", specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"],
    workedSolutionPlanned: true, companies: ["Any"], tags: ["recsys", "two-stage", "ranking", "candidate-generation"],
    prompt: "Design a two-stage recommender for a personalized content feed with tens of millions of items.",
    context: "GIVEN: catalog scale, interaction logs (implicit), latency budget, freshness need. [S2: derive the candidate-gen->rank->serve->feedback flow and the design requirements — position bias, exposure, cold start, offline/online eval.] This is the MSL proof cell (flesh + rubric first).",
    rubricDims: ["ambiguity-resolution (derives the withheld flow)", "framing-before-modeling", "eval-first (offline metric that predicts online)", "position/exposure-bias awareness", "cold-start handling", "tradeoff honesty"],
    stages: DESIGN_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [],
      _flesh: "match GSL SD stage depth (6-8 considerations, 6 strong, 4 traps, 3 probes). requirements+architecture must force the candidate to DERIVE the withheld two-stage flow + bias/cold-start reqs. Center eval on 'does the offline metric predict the online result'." })),
    status: "skeleton",
  },
  // 10) pricing, system-design, S3.
  {
    id: "mlsd-dynamic-pricing", title: "Dynamic pricing engine", roleTrack: "MLE",
    modality: "system-design", specLevel: "S3", withheld: ["reference-cases", "end-to-end-flow", "design-requirements", "inputs", "tools"],
    workedSolutionPlanned: false, companies: ["Any"], tags: ["pricing", "elasticity", "bandit", "guardrails", "causal"],
    prompt: "Design a system that sets prices to optimize revenue without runaway or unfair pricing.",
    context: "GIVEN ONLY: the one-liner + 'prices must respect guardrails and be explainable.' [S3: derive elasticity estimation, the explore/exploit mechanism, guardrails, the counterfactual/eval story, inputs, and tools.]",
    rubricDims: ["problem-framing under high ambiguity (S3)", "elasticity vs correlation (causal)", "explore/exploit (bandit/RL) justification", "guardrails+fairness", "counterfactual eval (can't A/B every price)", "tradeoff honesty"],
    stages: DESIGN_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [],
      _flesh: "S3 ambiguity: reward surfacing elasticity-is-causal, off-policy/counterfactual eval, and guardrails WITHOUT being prompted. Write asks + rubric-side derivations." })),
    status: "skeleton",
  },
  // 11) mlops, system-design, S2.
  {
    id: "mlsd-drift-retrain", title: "Drift detection & safe retraining system", roleTrack: "MLE",
    modality: "system-design", specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"],
    workedSolutionPlanned: false, companies: ["Any"], tags: ["mlops", "drift", "monitoring", "champion-challenger", "retraining"],
    prompt: "Design monitoring + retraining for a deployed model so silent degradation is caught and fixes ship safely.",
    context: "GIVEN: a live model, delayed labels, nightly pipelines. [S2: derive the monitor->trigger->retrain->validate->promote flow and the design requirements — drift taxonomy, label delay, champion/challenger, rollback.]",
    rubricDims: ["ambiguity-resolution", "drift taxonomy (data vs concept vs label)", "delayed-label handling", "champion/challenger + safe promotion", "eval-first (validate before promote)", "tradeoff honesty"],
    stages: DESIGN_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [], _flesh: "derive the withheld retraining-loop flow + rollback/guardrail reqs; center on delayed labels + champion/challenger." })),
    status: "skeleton",
  },
  // 12) causal, system-design, S2.
  {
    id: "mlsd-experiment-trust", title: "Experiment trust / A/B validity layer", roleTrack: "MLE",
    modality: "system-design", specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"],
    workedSolutionPlanned: true, companies: ["Any"], tags: ["causal", "experimentation", "srm", "power", "guardrails"],
    prompt: "Design the layer that decides whether an already-run A/B result is trustworthy enough to ship.",
    context: "GIVEN: batch experiment outputs (arms, metrics, allocation). [S2: derive the validity->decision flow and the design requirements — SRM vs design allocation, power/MDE, guardrail-first, multiple testing.]",
    rubricDims: ["ambiguity-resolution", "validity-before-significance (SRM, power)", "guardrail-first decisioning", "multiple-testing discipline", "eval-first (A/A calibration)", "tradeoff honesty"],
    stages: DESIGN_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [], _flesh: "derive the gate order; reward distinguishing design-vs-corruption SRM and significant-but-underpowered -> don't-ship." })),
    status: "skeleton",
  },
  // 13) timeseries, notebook-build, S2 (NOTEBOOK_ARC).
  {
    id: "mlsd-demand-forecast-notebook", title: "Demand forecasting (notebook build)", roleTrack: "MLE",
    modality: "notebook-build", specLevel: "S2", withheld: ["solution-approach"],
    workedSolutionPlanned: false, companies: ["Any"], tags: ["timeseries", "forecasting", "backtesting", "leakage"],
    prompt: "Given a sales history CSV + Python, build a demand forecaster and defend your backtest.",
    context: "GIVEN: dataset + notebook + 'enough solution' expectation (not full production). NO LLM. [S2: half-brief — the data+goal are given; the candidate derives the approach and, critically, a leakage-safe rolling backtest.]",
    rubricDims: ["leakage-safe temporal split (the trap)", "rolling-origin backtest", "baseline-before-fancy", "honest error under regime change", "eval-protocol validity", "tradeoff honesty"],
    stages: NOTEBOOK_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [],
      _flesh: "notebook arc: framing (metric+horizon) -> data-and-leakage (the graded core: split-then-transform, no horizon overlap) -> model (baseline first) -> eval-protocol (rolling-origin+embargo) -> calibration-and-tradeoffs. The withheld piece is the APPROACH; the rubric rewards the leakage-safe protocol above model choice." })),
    status: "skeleton",
  },
  // 14) risk, notebook-build, S1 (full brief; NOTEBOOK_ARC).
  {
    id: "mlsd-fraud-notebook", title: "Fraud/default model (notebook build)", roleTrack: "MLE",
    modality: "notebook-build", specLevel: "S1", withheld: [],
    workedSolutionPlanned: true, companies: ["Any"], tags: ["risk", "fraud", "imbalance", "calibration"],
    prompt: "Given a labeled transactions CSV + Python, build a fraud model, calibrate it, and pick an operating threshold from the cost of errors.",
    context: "GIVEN (S1, full brief): dataset, the ~1% base rate, the asymmetric cost of a missed fraud vs a false block, and the ask (model + calibration + threshold). NO LLM. Execute well.",
    rubricDims: ["imbalance handling (no accuracy)", "PR-AUC/recall-at-precision framing", "calibration (probabilities mean something)", "cost-based threshold", "leakage-safe pipeline", "tradeoff honesty"],
    stages: NOTEBOOK_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [],
      _flesh: "S1 full brief: reward correct execution — banned accuracy, PR-AUC + recall@precision, isotonic/Platt calibration, threshold from the given cost ratio, and a split that doesn't leak. Write the stage asks + bullets to GSL SD depth." })),
    status: "skeleton",
  },

  // ---- expansion batch (2026-07-17, frozen schema) ----

  { id: "mlsd-search-ranking", title: "Learning-to-rank for search", roleTrack: "MLE",
    modality: "system-design", specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"],
    workedSolutionPlanned: false, companies: ["Any"], tags: ["search", "ranking", "ltr", "position-bias"],
    prompt: "Design a learning-to-rank system for a large search index trained on click logs.",
    context: "GIVEN: query+click logs, an index, a latency budget. [S2: derive the retrieve -> rank -> serve flow and design requirements — position bias/IPS, label validity, feature freshness, offline/online eval.]",
    rubricDims: ["ambiguity-resolution", "position-bias/IPS (click labels are biased)", "feature freshness", "eval-first (offline metric that predicts online)", "latency vs quality", "tradeoff honesty"],
    stages: DESIGN_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [], _flesh: "reward naming position bias as the primary label-validity threat and IPS/randomization as the fix; derive the withheld flow." })),
    status: "skeleton" },

  { id: "mlsd-churn-notebook", title: "Churn prediction (notebook build)", roleTrack: "MLE",
    modality: "notebook-build", specLevel: "S1", withheld: [], workedSolutionPlanned: false,
    companies: ["Any"], tags: ["churn", "propensity", "temporal-split", "imbalance"],
    prompt: "Given a customer-months CSV + Python, build a churn model and defend your validation.",
    context: "GIVEN (S1, full brief): panel data (rows = customer-month), the churn label, and the ask (model + honest validation). NO LLM. The trap is temporal — churn drivers drift, so a random split leaks the future.",
    rubricDims: ["temporal split (not random) — the core trap", "no future-leaking features", "imbalance handling", "calibration", "honest forward-looking metric", "tradeoff honesty"],
    stages: NOTEBOOK_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [], _flesh: "S1 full brief: reward split-by-time + no post-period features; ban accuracy on imbalance; calibrate. Same family as silentDataBugs SD10, as a build." })),
    status: "skeleton" },

  { id: "mlsd-anomaly-detection", title: "Anomaly detection for a metrics stream", roleTrack: "MLE",
    modality: "system-design", specLevel: "S2", withheld: ["end-to-end-flow", "design-requirements"],
    workedSolutionPlanned: false, companies: ["Any"], tags: ["timeseries", "anomaly", "unsupervised", "alerting"],
    prompt: "Design a system that flags anomalies in a high-volume metrics/telemetry stream with few labels.",
    context: "GIVEN: streaming metrics, rare+unlabeled anomalies, an on-call that hates false pages. [S2: derive the detect -> score -> alert flow and design requirements — seasonality, thresholding/alerting, feedback labels, false-positive control.]",
    rubricDims: ["ambiguity-resolution", "seasonality/baseline handling", "alert precision (page fatigue is the cost)", "label-scarce eval", "feedback loop", "tradeoff honesty"],
    stages: DESIGN_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [], _flesh: "reward controlling false-positive alerts (page fatigue) + seasonality-aware baselines; derive the withheld flow." })),
    status: "skeleton" },

  { id: "mlsd-ab-uplift-notebook", title: "Uplift modeling from experiment data (notebook build)", roleTrack: "MLE",
    modality: "notebook-build", specLevel: "S2", withheld: ["solution-approach"],
    workedSolutionPlanned: false, companies: ["Any"], tags: ["causal", "uplift", "heterogeneous-effects"],
    prompt: "Given a randomized-experiment CSV + Python, model who to treat (uplift), not who will convert.",
    context: "GIVEN: treatment/control + outcome + covariates. NO LLM. [S2: derive the approach — the trap is modeling P(convert) instead of the treatment EFFECT, and evaluating uplift without a ground-truth per-unit effect.]",
    rubricDims: ["uplift vs response (the core distinction)", "valid uplift eval (Qini/uplift curve, not AUC)", "no treatment leakage into features", "heterogeneity honesty", "eval-protocol validity", "tradeoff honesty"],
    stages: NOTEBOOK_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [], _flesh: "reward T-learner/uplift framing + Qini/uplift-curve eval (per-unit effect is never observed); ban modeling raw conversion. data-and-leakage stage: treatment must not leak into features." })),
    status: "skeleton" },

  { id: "mlsd-recsys-coldstart", title: "Cold-start for a recommender", roleTrack: "MLE",
    modality: "system-design", specLevel: "S3", withheld: ["reference-cases", "end-to-end-flow", "design-requirements", "inputs", "tools"],
    workedSolutionPlanned: false, companies: ["Any"], tags: ["recsys", "cold-start", "content", "coverage"],
    prompt: "Make recommendations work for brand-new users and brand-new items.",
    context: "GIVEN ONLY: the one-liner + 'the system already works for warm users.' [S3: derive what cold-start actually costs (coverage/personalization, not just recall), the content/popularity fallback lanes, and how you would measure it — most of the brief withheld.] Seeds the within-domain S-ladder rung above mlsd-recsys-feed (S2).",
    rubricDims: ["problem-framing under ambiguity (S3)", "cold-start cost = coverage/personalization not recall", "content/semantic fallback lane", "measuring the fallback honestly", "eval-first", "tradeoff honesty"],
    stages: DESIGN_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [], _flesh: "reward reframing cold-start as coverage/personalization collapse + a content lane that structurally reaches unseen items; derive the withheld flow." })),
    status: "skeleton" },

  { id: "mlsd-feature-store", title: "Feature store & training-serving parity", roleTrack: "MLE",
    modality: "system-design", specLevel: "S3", withheld: ["reference-cases", "end-to-end-flow", "design-requirements", "inputs", "tools"],
    workedSolutionPlanned: false, companies: ["Any"], tags: ["mlops", "feature-store", "training-serving-skew", "point-in-time"],
    prompt: "Design the feature layer so training and serving never disagree.",
    context: "GIVEN ONLY: the one-liner. [S3: derive the offline/online feature paths, point-in-time correctness (no future leakage in training), freshness, and how skew is detected — most withheld.] Seeds the mlops S-ladder rung above mlsd-drift-retrain (S2).",
    rubricDims: ["problem-framing under ambiguity (S3)", "training-serving skew as the core failure", "point-in-time correctness (no leakage)", "freshness vs cost", "skew detection", "tradeoff honesty"],
    stages: DESIGN_ARC.map((id) => ({ id, title: id, ask: "", considerations: [], strong: [], traps: [], probes: [], _flesh: "reward point-in-time-correct feature computation (the training-side leakage trap) + a single definition serving both paths; derive the withheld flow." })),
    status: "skeleton" },
];
