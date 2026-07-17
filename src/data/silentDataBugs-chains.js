// silentDataBugs-chains.js — Bug Hunt: F2/F3 chained batch (MSL). SKELETONS ONLY (2026-07-17).
// Extends silentDataBugs.js (SILENT_DATA_BUGS): same base shape
// { id, domain, title, description, code, options, correct, impact, fix }
// PLUS the flaw-diagnosis dial:
//   level: 'F2' (one subtle bug a trained eye finds) | 'F3' (dependent chain).
//   flawGraph: [{ flawId, root, dependsOn:[flawId...], symptom }]
//     F3 = a downstream flaw is MASKED until the root flaw is found+fixed first;
//     graded on causal ordering — the trained+disciplined eye finds the ROOT before
//     the symptom, and knows fixing the symptom alone leaves the model broken.
// Flesh per DESIGN-STUDIO-SPEC.md §4: flawGraph is PINNED (named flaws + edges + root);
// `code`, `options`, `correct`, `impact`, `fix`, and the per-flaw reveal are DEFERRED —
// write them per each `_flesh` note. Every fleshed bug must ship with a runnable
// buggy-vs-fixed proof (numbers diverge) BEFORE ship, same discipline as silentDataBugs.
// Consider rendering F3 through the LiveIncident graph engine (stateful reveal) if a
// static MCQ can't express "root gates dependents".

export const SILENT_DATA_BUG_CHAINS = [
  // 6) F2 — complex single bug (no obvious tell).
  {
    id: "SDC01",
    level: "F2",
    domain: "SilentData",
    title: "The target encoder that quietly memorized the label",
    description: "A high-cardinality categorical is target-encoded, CV looks strong, prod underperforms. No leak is obvious — the encoding 'looks' standard.",
    flawGraph: [
      { flawId: "f1", root: true, dependsOn: [], symptom: "target encoding fit on the full dataset (incl. validation folds) before CV — each category's encoded value already contains its own rows' labels" },
    ],
    code: "", options: null, correct: null, impact: "", fix: "",
    _flesh: "write a realistic snippet where category_means = df.groupby(cat)['y'].mean() is computed once, up front, then CV runs on the encoded frame. options A-D with C/correct = full-data target-encode leaks label into the fold. impact = optimistic CV, prod gap; fix = fit the encoder inside the CV loop (or K-fold target encoding with out-of-fold means). Ship with buggy-vs-fixed AUC proof. F2: no obvious tell — the leak is one line and looks like normal preprocessing.",
    status: "skeleton",
  },

  // 7) F3 — dependent chain (recsys offline eval). 1 root + 2 masked.
  {
    id: "SDC02",
    level: "F3",
    domain: "SilentData",
    title: "The recommender that A/B-loses despite a great offline number",
    description: "Offline ranking metric is excellent; the online A/B is flat-to-negative. Three things are wrong, and two of them are invisible until the first is fixed.",
    flawGraph: [
      { flawId: "f1", root: true, dependsOn: [], symptom: "popularity feature computed over the FULL period (incl. the eval window) -> leaks future interactions; inflates offline metric so much it hides everything downstream" },
      { flawId: "f2", root: false, dependsOn: ["f1"], symptom: "negatives sampled uniformly (not from served/impressed items) -> position/exposure bias; only VISIBLE once the leak (f1) stops inflating the metric" },
      { flawId: "f3", root: false, dependsOn: ["f1", "f2"], symptom: "offline metric is full-slate Recall@K but online reward is single-gold top-1 -> metric/target mismatch; only matters once f1+f2 no longer dominate" },
    ],
    code: "", options: null, correct: null, impact: "", fix: "",
    _flesh: "F3 reveal order = f1 -> f2 -> f3. Write the codebase containing all three; the teaching point is CAUSAL ORDERING: a candidate who 'fixes' the negative sampling (f2) first sees NO metric change because the leak (f1) still dominates, and wrongly concludes f2 wasn't the problem. Grade on finding the root first. Ship buggy-vs-fixed proof at each stage of the chain. Consider LiveIncident graph rendering.",
    status: "skeleton",
  },

  // 8) F3 — dependent chain (time-series backtest). 1 root + 2 masked.
  {
    id: "SDC03",
    level: "F3",
    domain: "SilentData",
    title: "The forecast that backtests perfectly and fails forward",
    description: "A demand forecaster's backtest MAPE is excellent; live it drifts badly. Three coupled flaws; the root masks the others.",
    flawGraph: [
      { flawId: "f1", root: true, dependsOn: [], symptom: "features scaled/normalized over the whole series before the temporal split -> test-period statistics leak into training; backtest error is unrealistically low and hides the rest" },
      { flawId: "f2", root: false, dependsOn: ["f1"], symptom: "backtest uses a single random holdout, not rolling-origin -> no exposure to regime change; only surfaces once f1's leak is removed and error stops looking flat" },
      { flawId: "f3", root: false, dependsOn: ["f1", "f2"], symptom: "target is a lag that overlaps the feature window (horizon leakage) -> label partially inside features; invisible while f1+f2 inflate confidence" },
    ],
    code: "", options: null, correct: null, impact: "", fix: "",
    _flesh: "F3 reveal order f1 -> f2 -> f3. Same causal-ordering lesson as SDC02 in the forecasting domain. Fix chain: split-then-scale (fit scaler on train only) -> rolling-origin/expanding-window backtest with an embargo -> align target horizon strictly after the feature window. Ship buggy-vs-fixed MAPE proof per stage.",
    status: "skeleton",
  },

  // ---- expansion batch (2026-07-17, frozen schema) ----

  { id: "SDC04", level: "F2", domain: "SilentData",
    title: "The model that aced CV because the same customer was in every fold",
    description: "A per-transaction model on grouped data (many rows per customer). Random-fold CV is strong; prod on brand-new customers is weak. No error.",
    flawGraph: [{ flawId: "f1", root: true, dependsOn: [], symptom: "random KFold splits ROWS, not customers — the same customer's rows land in train AND validation, so the model memorizes customer identity; GroupKFold on customer_id is required" }],
    code: "", options: null, correct: null, impact: "", fix: "",
    _flesh: "F2 complex: cross_val on transaction rows keyed by many-per-customer; correct = group leakage; fix = GroupKFold/GroupShuffleSplit on the entity id. Ship buggy-vs-fixed proof (random-fold AUC vs grouped-fold AUC).",
    status: "skeleton" },

  { id: "SDC05", level: "F3", domain: "SilentData",
    title: "The fraud model that looks great until the labels catch up",
    description: "A fraud classifier with excellent offline metrics; live it is far worse. Three coupled flaws; the root hides the others.",
    flawGraph: [
      { flawId: "f1", root: true, dependsOn: [], symptom: "label defined using data that only exists AFTER fraud is confirmed (e.g. chargeback flag) which at scoring time is not yet available -> label leakage inflates everything and hides the rest" },
      { flawId: "f2", root: false, dependsOn: ["f1"], symptom: "decision threshold tuned on the test set -> optimistic operating point; only matters once f1's inflation is removed" },
      { flawId: "f3", root: false, dependsOn: ["f1", "f2"], symptom: "class weights set to make accuracy look good rather than to the cost ratio -> wrong precision/recall balance; invisible while f1+f2 dominate" },
    ],
    code: "", options: null, correct: null, impact: "", fix: "",
    _flesh: "F3 reveal f1 -> f2 -> f3. Root = label leakage (post-hoc label field). Fixing the threshold (f2) first shows no gain while the leaked label (f1) still dominates. Ship buggy-vs-fixed proof per stage.",
    status: "skeleton" },

  { id: "SDC06", level: "F3", domain: "SilentData",
    title: "The text classifier that memorized the test set three ways",
    description: "A text classifier whose macro-F1 climbs every sprint but never helps in prod. Three coupled flaws.",
    flawGraph: [
      { flawId: "f1", root: true, dependsOn: [], symptom: "TF-IDF/vectorizer fit on the FULL corpus before the split -> vocabulary+IDF leak test docs into train features; inflates everything" },
      { flawId: "f2", root: false, dependsOn: ["f1"], symptom: "near-duplicate documents span train/test (no dedup) -> memorization rewarded; only visible once f1's leak is closed" },
      { flawId: "f3", root: false, dependsOn: ["f1", "f2"], symptom: "reports accuracy on an imbalanced label instead of macro-F1/per-class -> hides minority-class failure; matters only after f1+f2" },
    ],
    code: "", options: null, correct: null, impact: "", fix: "",
    _flesh: "F3 reveal f1 -> f2 -> f3. Root = vectorizer-fit-on-full-corpus. Fix chain: fit vectorizer train-only inside CV -> dedup across split by source id -> per-class metrics. Ship buggy-vs-fixed proof per stage.",
    status: "skeleton" },

  { id: "SDC07", level: "F2", domain: "SilentData",
    title: "The ranker whose offline NDCG was inflated by tie order",
    description: "An offline ranking eval shows a big NDCG lift; online it is flat. The scores have many ties. No error.",
    flawGraph: [{ flawId: "f1", root: true, dependsOn: [], symptom: "tied scores are broken by the original row order, which happens to be sorted by label/relevance -> NDCG credits ordering the eval harness itself injected, not the model" }],
    code: "", options: null, correct: null, impact: "", fix: "",
    _flesh: "F2 complex: subtle eval bug — sort stability + input pre-sorted by relevance leaks order into tied predictions. Fix = shuffle before sort / random tie-break / tie-aware metric. Ship buggy-vs-fixed NDCG proof.",
    status: "skeleton" },
];
