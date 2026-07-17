// designStudioFlaws.js — Design Studio flaw-diagnosis, MSL (MLE track). SKELETONS ONLY (2026-07-17).
// CORRECTED MECHANIC (supersedes the A-D MCQ of silentDataBugs for the DESIGN surface): the user
// reads a broken artifact and WRITES a diagnosis — which flaw(s), which is ROOT, the order they must
// be fixed, and the fix — then self-critiques against the flaw graph + a rubric. NO LLM.
// (The old A-D MCQ silentDataBugs can remain as a lighter, separate 'spot-check' tier — this is the
//  produce-a-diagnosis tier.) F3 = dependent chain: a downstream flaw is MASKED until the root is found.
// Consider rendering F3 through the LiveIncident graph engine (stateful reveal). See DESIGN-STUDIO-SPEC.md.
//
// Schema: id, roleTrack, domain, modality:'flaw-diagnosis', flawMode('F2'|'F3'),
//   flawGraph:[{flawId,root,dependsOn,symptom}], difficulty, companies, tags, prompt, context,
//   produce:{artifact,format:'written-diagnosis',workspace:'in-app-text'}, reference:{type:'flaw-graph'},
//   rubric:[{dim,anchor,cost}], code(the buggy artifact, DEFERRED), status:'skeleton'.

const PRODUCE = { artifact: "written diagnosis: the flaw(s), which is the ROOT, the order they must be fixed, and the fix — with a one-line reason each", format: "written-diagnosis", workspace: "in-app-text" };
const F3_RUBRIC = [
  { dim: "found-root-first", anchor: "did you name the ROOT flaw before the masked ones?", cost: "you fix a symptom, see no change, and wrongly conclude it wasn't the problem" },
  { dim: "dependency-order", anchor: "is your fix order f1 -> f2 -> f3?", cost: "symptom-chasing wastes the whole session" },
  { dim: "causal-reasoning", anchor: "did you explain WHY the root masks the dependents?", cost: "pattern-matched, not understood — fails the follow-up" },
  { dim: "correct-fix", anchor: "is each fix actually correct (not just 'there's a bug here')?", cost: "diagnosis without a working fix" },
];

export const DESIGN_STUDIO_FLAWS = [
  { id: "dsf-target-encode-leak", roleTrack: "MLE", domain: "modeling", modality: "flaw-diagnosis",
    flawMode: "F2", flawGraph: [{ flawId: "f1", root: true, dependsOn: [], symptom: "target encoding fit on the FULL dataset before CV — each category's encoded value already contains its own rows' labels" }],
    difficulty: "senior", companies: ["Any"], tags: ["leakage", "target-encoding", "cv"],
    prompt: "This model target-encodes a high-cardinality categorical, CVs strongly, and underperforms in prod. Diagnose the single subtle flaw and fix it.",
    context: "No obvious leak; the encoding looks like standard preprocessing.", produce: PRODUCE, reference: { type: "flaw-graph" },
    rubric: [
      { dim: "found-the-subtle-bug", anchor: "did you spot the full-data target-encode as label leakage (not scaling/param noise)?", cost: "you ship a model that memorized the label" },
      { dim: "mechanism", anchor: "explained WHY it leaks (encoded value contains the row's own label)?", cost: "can't defend it under questioning" },
      { dim: "correct-fix", anchor: "fit the encoder inside CV / out-of-fold target means?", cost: "the leak persists" },
    ],
    code: "", _flesh: "Write the buggy snippet (groupby-mean encode up front, then CV) + a runnable buggy-vs-fixed AUC proof. Reference = the flaw graph + fix.",
    status: "skeleton" },

  { id: "dsf-group-leak", roleTrack: "MLE", domain: "modeling", modality: "flaw-diagnosis",
    flawMode: "F2", flawGraph: [{ flawId: "f1", root: true, dependsOn: [], symptom: "random KFold splits ROWS not customers — the same customer's rows land in train AND val, so the model memorizes identity; GroupKFold on the entity id is required" }],
    difficulty: "senior", companies: ["Any"], tags: ["leakage", "group-split", "cv"],
    prompt: "A per-transaction model on grouped data CVs strongly but fails on brand-new customers. Diagnose and fix.",
    context: "Many rows per customer; random-fold CV looks great.", produce: PRODUCE, reference: { type: "flaw-graph" },
    rubric: [
      { dim: "found-the-subtle-bug", anchor: "identified group leakage (same entity across folds), not sampling noise?", cost: "the metric measures memorization, not generalization" },
      { dim: "mechanism", anchor: "explained why per-row splits leak with grouped data?", cost: "undefendable" },
      { dim: "correct-fix", anchor: "GroupKFold/GroupShuffleSplit on the entity id?", cost: "leak persists" },
    ],
    code: "", _flesh: "Buggy snippet + buggy-vs-fixed (random-fold vs grouped-fold AUC) proof. Reference = flaw graph + fix.",
    status: "skeleton" },

  { id: "dsf-ndcg-tie", roleTrack: "MLE", domain: "recsys", modality: "flaw-diagnosis",
    flawMode: "F2", flawGraph: [{ flawId: "f1", root: true, dependsOn: [], symptom: "tied scores broken by original row order, which is sorted by relevance -> NDCG credits ordering the eval harness itself injected, not the model" }],
    difficulty: "staff", companies: ["Any"], tags: ["ranking", "eval", "ndcg", "ties"],
    prompt: "An offline ranking eval shows a big NDCG lift; online it's flat. Scores have many ties. Diagnose and fix the eval.",
    context: "The model and pipeline are fine; the eval is lying.", produce: PRODUCE, reference: { type: "flaw-graph" },
    rubric: [
      { dim: "found-the-subtle-bug", anchor: "spotted that tie-breaking by pre-sorted order leaks relevance into the metric?", cost: "you trust an offline lift that doesn't exist" },
      { dim: "mechanism", anchor: "explained the sort-stability + pre-sorted-input interaction?", cost: "undefendable" },
      { dim: "correct-fix", anchor: "shuffle before sort / random tie-break / tie-aware metric?", cost: "the phantom lift persists" },
    ],
    code: "", _flesh: "Buggy snippet + buggy-vs-fixed NDCG proof. Reference = flaw graph + fix.",
    status: "skeleton" },

  { id: "dsf-recsys-eval-chain", roleTrack: "MLE", domain: "recsys", modality: "flaw-diagnosis",
    flawMode: "F3", flawGraph: [
      { flawId: "f1", root: true, dependsOn: [], symptom: "popularity feature computed over the FULL period (incl. eval window) -> leaks future; inflates the offline metric so much it hides everything downstream" },
      { flawId: "f2", root: false, dependsOn: ["f1"], symptom: "negatives sampled uniformly (not from served/impressed items) -> exposure bias; only VISIBLE once the leak (f1) stops inflating the metric" },
      { flawId: "f3", root: false, dependsOn: ["f1", "f2"], symptom: "offline metric is full-slate Recall@K but online reward is single-gold top-1 -> metric/target mismatch; only matters once f1+f2 no longer dominate" },
    ],
    difficulty: "staff", companies: ["Any"], tags: ["recsys", "leakage", "eval", "exposure-bias"],
    prompt: "A recommender A/B-loses despite a great offline number. Three flaws; two are invisible until the first is fixed. Diagnose in order and fix.",
    context: "Offline ranking metric is excellent; online A/B is flat-to-negative.", produce: PRODUCE, reference: { type: "flaw-graph" }, rubric: F3_RUBRIC,
    code: "", _flesh: "Reveal order f1->f2->f3. Write the codebase with all three + a buggy-vs-fixed proof at each stage. Teaching point = causal ordering (fixing f2 first shows no change while f1 dominates).",
    status: "skeleton" },

  { id: "dsf-forecast-backtest-chain", roleTrack: "MLE", domain: "timeseries", modality: "flaw-diagnosis",
    flawMode: "F3", flawGraph: [
      { flawId: "f1", root: true, dependsOn: [], symptom: "features scaled/normalized over the whole series before the temporal split -> test-period stats leak into training; backtest error unrealistically low, hides the rest" },
      { flawId: "f2", root: false, dependsOn: ["f1"], symptom: "single random holdout, not rolling-origin -> no exposure to regime change; surfaces once f1's leak is removed" },
      { flawId: "f3", root: false, dependsOn: ["f1", "f2"], symptom: "target lag overlaps the feature window (horizon leakage) -> label partly inside features; invisible while f1+f2 inflate confidence" },
    ],
    difficulty: "staff", companies: ["Any"], tags: ["timeseries", "leakage", "backtest"],
    prompt: "A demand forecaster backtests perfectly and drifts badly live. Three coupled flaws; the root masks the others. Diagnose in order and fix.",
    context: "Backtest MAPE is excellent; live it fails forward.", produce: PRODUCE, reference: { type: "flaw-graph" }, rubric: F3_RUBRIC,
    code: "", _flesh: "Reveal f1->f2->f3. Fix chain: split-then-scale -> rolling-origin+embargo -> align target strictly after the feature window. Buggy-vs-fixed MAPE proof per stage.",
    status: "skeleton" },

  { id: "dsf-fraud-label-chain", roleTrack: "MLE", domain: "risk", modality: "flaw-diagnosis",
    flawMode: "F3", flawGraph: [
      { flawId: "f1", root: true, dependsOn: [], symptom: "label defined using data that only exists AFTER fraud is confirmed (e.g. chargeback) not available at scoring time -> label leakage inflates everything, hides the rest" },
      { flawId: "f2", root: false, dependsOn: ["f1"], symptom: "decision threshold tuned on the test set -> optimistic operating point; only matters once f1's inflation is removed" },
      { flawId: "f3", root: false, dependsOn: ["f1", "f2"], symptom: "class weights set to flatter accuracy rather than the cost ratio -> wrong precision/recall balance; invisible while f1+f2 dominate" },
    ],
    difficulty: "staff", companies: ["Any"], tags: ["risk", "leakage", "threshold", "imbalance"],
    prompt: "A fraud model looks great offline and is far worse live. Three coupled flaws; the root hides the others. Diagnose in order and fix.",
    context: "Excellent offline metrics; poor production precision.", produce: PRODUCE, reference: { type: "flaw-graph" }, rubric: F3_RUBRIC,
    code: "", _flesh: "Reveal f1->f2->f3. Root = post-hoc label field. Buggy-vs-fixed proof per stage; fixing the threshold (f2) first shows no gain while the leaked label (f1) dominates.",
    status: "skeleton" },

  { id: "dsf-text-classifier-chain", roleTrack: "MLE", domain: "nlp", modality: "flaw-diagnosis",
    flawMode: "F3", flawGraph: [
      { flawId: "f1", root: true, dependsOn: [], symptom: "TF-IDF/vectorizer fit on the FULL corpus before the split -> vocabulary+IDF leak test docs into train features; inflates everything" },
      { flawId: "f2", root: false, dependsOn: ["f1"], symptom: "near-duplicate documents span train/test (no dedup) -> memorization rewarded; only visible once f1's leak is closed" },
      { flawId: "f3", root: false, dependsOn: ["f1", "f2"], symptom: "reports accuracy on an imbalanced label instead of macro-F1/per-class -> hides minority-class failure; matters only after f1+f2" },
    ],
    difficulty: "staff", companies: ["Any"], tags: ["nlp", "leakage", "dedup", "imbalance"],
    prompt: "A text classifier's macro-F1 climbs every sprint but never helps in prod. Three coupled flaws. Diagnose in order and fix.",
    context: "Validation numbers improve; production is flat.", produce: PRODUCE, reference: { type: "flaw-graph" }, rubric: F3_RUBRIC,
    code: "", _flesh: "Reveal f1->f2->f3. Fix chain: fit vectorizer train-only inside CV -> dedup across split by source id -> per-class metrics. Buggy-vs-fixed proof per stage.",
    status: "skeleton" },
];
