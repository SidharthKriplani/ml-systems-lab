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
];
