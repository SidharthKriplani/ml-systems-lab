// foundationsPath.js — The MLE Path
// A complete senior-MLE preparation curriculum: ~57 posts across 11 tiers,
// from observation discipline through pure math, classical ML, evaluation,
// production engineering, MLOps, system design, and interview prep.
//
// `postId` references Gradient post ids in src/tabs/GradientTab.jsx POSTS array.
// `status: 'ready'`    = post exists and is fully written
// `status: 'pending'`  = post needs to be written (active sprint target)
// `status: 'deferred'` = post intentionally not on roadmap

export const PAL_URL = 'https://product-analytics-lab.vercel.app'

// User-visible name for the path. Kept as a single source of truth so any rename ripples.
export const PATH_NAME = 'The MLE Path'
export const PATH_TAGLINE = 'The complete senior-MLE preparation curriculum.'

export const FOUNDATIONS_TIERS = [
  {
    id: 't0',
    label: 'Tier 0 — Observation Discipline & Pure Math',
    outcome: 'You read diagnostics before naming concepts; you can read ML notation in any paper without flinching.',
    prereq: 'High-school math.',
    forward: { tabId: 'models', label: 'Practice → Math Foundations (ModelsMath)' },
    posts: [
      { n: 1, postId: 128, title: 'Observation Discipline: How to Read Diagnostics Before Naming Concepts', status: 'ready' },
      { n: 2, postId: 101, title: 'Probability for ML', status: 'ready' },
      { n: 3, postId: 102, title: 'Linear Algebra for ML', status: 'ready' },
      { n: 4, postId: 103, title: 'Calculus for ML', status: 'ready' },
      { n: 5, postId: 120, title: 'Matrix Calculus', status: 'ready' },
      { n: 6, postId: 104, title: 'Information Theory', status: 'ready' },
      { n: 7, postId: 115, title: 'Convex Optimisation', status: 'ready' },
    ],
  },
  {
    id: 't1',
    label: 'Tier 1 — Statistics & Estimation',
    outcome: 'You understand what every model is mathematically trying to do.',
    prereq: 'Tier 0.',
    forward: { tabId: 'causal', label: 'Practice → Causal & Statistical Inference' },
    palCross: { url: PAL_URL, note: 'PAL covers experimentation depth (CUPED, sequential testing, variance reduction) beyond what MSL teaches in Tier 1.' },
    posts: [
      { n: 8, postId: 113, title: 'Hypothesis Testing', status: 'ready' },
      { n: 9, postId: 105, title: 'MLE and MAP', status: 'ready' },
      { n: 10, postId: 106, title: 'The EM Algorithm', status: 'ready' },
      { n: 11, postId: 75, title: 'Bayesian Inference', status: 'ready' },
    ],
  },
  {
    id: 't2',
    label: 'Tier 2 — Linear Models',
    outcome: 'You can derive how the simplest models fit data and explain regularisation geometrically.',
    prereq: 'Tier 1.',
    forward: { tabId: 'classical', label: 'Practice → Classical ML · Decision Boundary Lab' },
    posts: [
      { n: 12, postId: 111, title: 'OLS and Linear Regression', status: 'ready' },
      { n: 13, postId: 107, title: 'Logistic Regression From Scratch', status: 'ready' },
      { n: 14, postId: 112, title: 'Regularisation Geometry', status: 'ready' },
      { n: 15, postId: 119, title: 'Generalisation Theory', status: 'ready' },
    ],
  },
  {
    id: 't3',
    label: 'Tier 3 — Classical Algorithms',
    outcome: 'You can pick the right classical algorithm for any tabular problem and know its breaking points.',
    prereq: 'Tier 2.',
    forward: { tabId: 'classical', label: 'Practice → Classical ML · Tree & Ensemble modules' },
    posts: [
      { n: 16, postId: null, title: 'K-Nearest Neighbors: Lazy Algorithm, Curse of Dimensionality, and When KNN Wins', status: 'deferred' },
      { n: 17, postId: null, title: 'Naive Bayes: The Independence Assumption, When It Lies, and Why It Still Works', status: 'deferred' },
      { n: 18, postId: 108, title: 'Decision Trees and Random Forests', status: 'ready' },
      { n: 19, postId: 73,  title: 'Gradient Boosted Trees (XGBoost)', status: 'ready' },
      { n: 20, postId: 127, title: 'Ensemble Methods: Bagging, Boosting, Stacking — Mechanics and When Each Wins', status: 'ready' },
      { n: 21, postId: 97,  title: 'SVMs: The Kernel Trick and Maximum Margin', status: 'ready' },
      { n: 22, postId: 74,  title: 'The Bias-Variance Tradeoff', status: 'ready' },
      { n: 23, postId: 76,  title: 'Model Calibration', status: 'ready' },
      { n: 24, postId: 129, title: 'Class Imbalance: Base Rate, Threshold Moving, Cost-Sensitive Learning', status: 'ready' },
    ],
  },
  {
    id: 't4',
    label: 'Tier 4 — Unsupervised & Dimensionality Reduction',
    outcome: 'You can reduce dimensions and find structure without labels.',
    prereq: 'Tier 1 (Tier 3 helpful).',
    forward: { tabId: 'classical', label: 'Practice → Classical ML · PCA module' },
    posts: [
      { n: 25, postId: 86,  title: 'PCA from Scratch', status: 'ready' },
      { n: 26, postId: 87,  title: 'Clustering: k-Means and DBSCAN', status: 'ready' },
      { n: 27, postId: null, title: 'Manifold Learning: t-SNE, UMAP, and Why They Distort Distances', status: 'deferred' },
    ],
  },
  {
    id: 't5',
    label: 'Tier 5 — Evaluation & Diagnostics',
    outcome: 'You pick the right metric, detect leakage in all its forms, and run real error analysis on failed predictions.',
    prereq: 'Tier 2.',
    forward: { tabId: 'eval', label: 'Practice → Model Evaluation' },
    palCross: { url: PAL_URL, note: 'PAL goes deeper on online metric design, guardrails, and north-star alignment.' },
    posts: [
      { n: 28, postId: 114, title: 'Evaluation Metrics from First Principles', status: 'ready' },
      { n: 29, postId: 3,   title: 'AUC Is Not Your Friend', status: 'ready' },
      { n: 30, postId: 42,  title: 'Offline Evaluation ≠ Online Performance', status: 'ready' },
      { n: 31, postId: 20,  title: 'The Validation Set Is Lying to You', status: 'ready' },
      { n: 32, postId: 130, title: 'Data Leakage: The Eleven Types and How to Detect Each', status: 'ready' },
      { n: 33, postId: 131, title: 'Error Analysis: Segment Metrics, Cohort Slicing, Calibration by Group', status: 'ready' },
      { n: 34, postId: 132, title: 'Model Explainability: SHAP, Permutation Importance, Local vs Global', status: 'ready' },
    ],
  },
  {
    id: 't6',
    label: 'Tier 6 — Sequence & Specialised',
    outcome: 'You can handle time-ordered data, rare events, and explore-exploit problems.',
    prereq: 'Tier 1 + Tier 2.',
    forward: { tabId: 'ts', label: 'Practice → Time Series · Causal Inference' },
    posts: [
      { n: 35, postId: 88,  title: 'Time Series Forecasting', status: 'ready' },
      { n: 36, postId: 118, title: 'Survival Analysis', status: 'ready' },
      { n: 37, postId: 95,  title: 'Anomaly Detection', status: 'ready' },
      { n: 38, postId: 96,  title: 'Multi-Armed Bandits', status: 'ready' },
      { n: 39, postId: 117, title: 'Data Preprocessing & Missingness', status: 'ready' },
    ],
  },
  {
    id: 't7',
    label: 'Tier 7 — Production Engineering',
    outcome: 'You understand how models actually serve in production: feature stores, training-serving consistency, point-in-time correctness.',
    prereq: 'Tier 5.',
    forward: { tabId: 'features', label: 'Practice → Feature Engineering' },
    posts: [
      { n: 40, postId: 1,  title: 'Training-Serving Skew: Why It Silently Kills Production Models', status: 'ready' },
      { n: 41, postId: 7,  title: 'Feature Store Architecture: What the Tutorials Skip', status: 'ready' },
      { n: 42, postId: 38, title: 'Training-Serving Skew: The Complete Taxonomy and Detection Framework', status: 'ready' },
      { n: 43, postId: 41, title: 'The Feature Store API Trap: How Calling the Wrong Function Corrupts Fintech Models', status: 'ready' },
      { n: 44, postId: 43, title: 'Late-Arriving Data and the Retroactive Feature Trap', status: 'ready' },
    ],
  },
  {
    id: 't8',
    label: 'Tier 8 — Monitoring & MLOps',
    outcome: 'You know how production models actually degrade, how to detect degradation early, and how to roll out fixes safely.',
    prereq: 'Tier 7.',
    forward: { tabId: 'monitor', label: 'Practice → Monitoring' },
    posts: [
      { n: 45, postId: 5,  title: 'Concept Drift: How to Detect It Before It Destroys Your Model', status: 'ready' },
      { n: 46, postId: 23, title: 'Three Drift Signals That Predict Model Failure Before It Happens', status: 'ready' },
      { n: 47, postId: 39, title: 'Feature Importance Drift: When Your Top Features Become Noise', status: 'ready' },
      { n: 48, postId: 40, title: 'Calibration Loss in Production: When 95% AUC Predicts 60% Precision', status: 'ready' },
      { n: 49, postId: 46, title: 'Silent Model Staleness: When Your Model Has Stopped Learning from Reality', status: 'ready' },
    ],
  },
  {
    id: 't9',
    label: 'Tier 9 — System Design',
    outcome: 'You can whiteboard a production-grade ML system end-to-end: retrieval, ranking, re-ranking, latency, scale.',
    prereq: 'Tier 7.',
    forward: { tabId: 'design', label: 'Practice → System Design' },
    posts: [
      { n: 50, postId: 24, title: 'The 6-Step Framework That Answers Any ML System Design Question', status: 'ready' },
      { n: 51, postId: 4,  title: 'How to Design a Recommendation System (The MLE Interview Framework)', status: 'ready' },
      { n: 52, postId: 72, title: 'The Recommendation System Stack: Retrieval → Ranking → Re-Ranking', status: 'ready' },
      { n: 53, postId: 71, title: 'Two-Tower Models: How YouTube and Spotify Do Candidate Retrieval', status: 'ready' },
      { n: 54, postId: 80, title: 'Semantic Search: The Full Architecture from Query to Results', status: 'ready' },
    ],
  },
  {
    id: 't10',
    label: 'Tier 10 — Interview Bridge',
    outcome: 'You walk into a senior MLE loop knowing the framework, the common mistakes, and the career arc you are signing up for.',
    prereq: 'Tier 5 (Tier 9 strongly recommended).',
    forward: { tabId: 'interview', label: 'Practice → Interview Tools' },
    posts: [
      { n: 55, postId: 8,  title: 'The MLE Interview Framework: What Top Companies Actually Ask', status: 'ready' },
      { n: 56, postId: 13, title: '10 ML Interview Mistakes Even Senior Engineers Make', status: 'ready' },
      { n: 57, postId: 18, title: 'The MLE Career Ladder: What L3 to L7 Actually Means in Practice', status: 'ready' },
    ],
  },
]

// Prerequisite + successor relations for the knowledge graph wiring.
// Each entry: { prereqs: [postId, ...], successors: [postId, ...] }
// Only ready postIds are listed. Deferred posts (KNN, Naive Bayes, Manifold) are omitted.
export const PATH_RELATIONS = {
  // Tier 0 — Observation Discipline & Pure Math
  128: { prereqs: [],          successors: [20, 130, 131] },                       // Observation Discipline
  101: { prereqs: [],          successors: [104, 105, 113] },                      // Probability
  102: { prereqs: [],          successors: [120, 111, 86] },                       // Linear Algebra
  103: { prereqs: [],          successors: [120, 115, 107] },                      // Calculus
  120: { prereqs: [102, 103],  successors: [111, 116] },                           // Matrix Calculus
  104: { prereqs: [101],       successors: [105, 114] },                           // Information Theory
  115: { prereqs: [103],       successors: [116, 107, 111] },                      // Convex Optimisation
  // Tier 1 — Statistics & Estimation
  113: { prereqs: [101],       successors: [114, 119, 130] },                      // Hypothesis Testing
  105: { prereqs: [101, 104],  successors: [106, 107, 111, 75] },                  // MLE / MAP
  106: { prereqs: [105],       successors: [87] },                                 // EM Algorithm
  75:  { prereqs: [101, 105],  successors: [76, 96] },                             // Bayesian Inference
  // Tier 2 — Linear Models
  111: { prereqs: [102, 103, 120],   successors: [107, 112, 119] },                // OLS
  107: { prereqs: [105, 111, 115],   successors: [108, 76, 114, 129] },            // Logistic Regression
  112: { prereqs: [111],             successors: [107, 119, 73] },                 // Regularisation
  119: { prereqs: [113, 111],        successors: [73, 127, 114] },                 // Generalisation Theory
  // Tier 3 — Classical Algorithms
  108: { prereqs: [104, 107],        successors: [73, 127, 74, 132] },             // Decision Trees / RF
  73:  { prereqs: [108, 112, 119],   successors: [127, 74, 76, 132] },             // XGBoost
  127: { prereqs: [108, 73, 74],     successors: [76, 132] },                      // Ensemble Methods
  97:  { prereqs: [107, 115],        successors: [127] },                          // SVM
  74:  { prereqs: [119, 112],        successors: [127, 76, 131] },                 // Bias-Variance
  76:  { prereqs: [74, 75, 107],     successors: [114, 96, 129, 48] },             // Calibration
  129: { prereqs: [107, 114, 76],    successors: [131, 1] },                       // Class Imbalance (NEW)
  // Tier 4 — Unsupervised & Dim Reduction
  86:  { prereqs: [102],             successors: [87, 117] },                      // PCA
  87:  { prereqs: [86, 106],         successors: [95] },                           // Clustering
  // Tier 5 — Evaluation & Diagnostics
  114: { prereqs: [113, 76, 119],    successors: [3, 42, 20, 130] },               // Eval Metrics
  3:   { prereqs: [114],             successors: [42, 130] },                      // AUC Critique
  42:  { prereqs: [114, 20],         successors: [1, 23] },                        // Offline != Online
  20:  { prereqs: [114, 128],        successors: [42, 130] },                      // Validation Set Lying
  130: { prereqs: [20, 113, 128],    successors: [131, 1, 41] },                   // Data Leakage Taxonomy (NEW)
  131: { prereqs: [74, 114, 130],    successors: [132, 23, 5] },                   // Error Analysis (NEW)
  132: { prereqs: [73, 108, 127],    successors: [39] },                           // Model Explainability (NEW)
  // Tier 6 — Sequence & Specialised
  88:  { prereqs: [111, 113],        successors: [95] },                           // Time Series
  118: { prereqs: [113, 75],         successors: [] },                             // Survival Analysis
  95:  { prereqs: [87, 88, 131],     successors: [5, 23] },                        // Anomaly Detection
  96:  { prereqs: [75, 113],         successors: [] },                             // Bandits
  117: { prereqs: [86],              successors: [73, 108, 1, 7] },                // Data Preprocessing
  // Tier 7 — Production Engineering
  1:   { prereqs: [117, 130, 129],   successors: [7, 38, 5] },                     // Training-Serving Skew
  7:   { prereqs: [1, 117],          successors: [38, 41, 43] },                   // Feature Store Architecture
  38:  { prereqs: [1, 7],            successors: [41, 43, 23] },                   // Training-Serving Skew Taxonomy
  41:  { prereqs: [7, 38, 130],      successors: [43] },                           // Feature Store API Trap
  43:  { prereqs: [7, 38, 130],      successors: [5, 46] },                        // Late-Arriving Data
  // Tier 8 — Monitoring & MLOps
  5:   { prereqs: [114, 1, 42],      successors: [23, 39, 40, 46] },               // Concept Drift Detection
  23:  { prereqs: [5, 131],          successors: [39, 40, 46] },                   // Three Drift Signals
  39:  { prereqs: [132, 5, 23],      successors: [46] },                           // Feature Importance Drift
  40:  { prereqs: [76, 5, 42],       successors: [46] },                           // Calibration Loss in Production
  46:  { prereqs: [5, 23, 40],       successors: [24, 4] },                        // Silent Model Staleness
  // Tier 9 — System Design
  24:  { prereqs: [46, 1, 7],        successors: [4, 72, 71, 80, 8] },             // 6-Step System Design Framework
  4:   { prereqs: [24, 72],          successors: [71, 8] },                        // How to Design Recsys
  72:  { prereqs: [24, 71],          successors: [4, 80] },                        // Recsys Stack
  71:  { prereqs: [24, 102, 107],    successors: [72, 4, 80] },                    // Two-Tower
  80:  { prereqs: [24, 71, 104],     successors: [4] },                            // Semantic Search
  // Tier 10 — Interview Bridge
  8:   { prereqs: [24, 4, 130],      successors: [13, 18] },                       // MLE Interview Framework
  13:  { prereqs: [128, 8],          successors: [18] },                           // 10 Interview Mistakes
  18:  { prereqs: [8],               successors: [] },                             // MLE Career Ladder
}

export function prereqsFor(postId) {
  return (PATH_RELATIONS[postId] && PATH_RELATIONS[postId].prereqs) || []
}

export function successorsFor(postId) {
  return (PATH_RELATIONS[postId] && PATH_RELATIONS[postId].successors) || []
}

export function titleForPostId(postId) {
  for (const t of FOUNDATIONS_TIERS) {
    for (const p of t.posts) {
      if (p.postId === postId) return p.title
    }
  }
  return null
}

// Flat list of every post in path order, for prev/next navigation inside PostReader.
export const PATH_SEQUENCE = FOUNDATIONS_TIERS.flatMap(t =>
  t.posts.map(p => ({ ...p, tierId: t.id, tierLabel: t.label }))
)

export const TOTAL_POSTS = PATH_SEQUENCE.length

export function tierForPostId(postId) {
  for (const t of FOUNDATIONS_TIERS) {
    if (t.posts.some(p => p.postId === postId)) return t
  }
  return null
}

export function sequenceIndexForPostId(postId) {
  return PATH_SEQUENCE.findIndex(p => p.postId === postId)
}

export function prevPostInPath(postId) {
  const idx = sequenceIndexForPostId(postId)
  if (idx <= 0) return null
  for (let i = idx - 1; i >= 0; i--) {
    if (PATH_SEQUENCE[i].postId) return PATH_SEQUENCE[i]
  }
  return null
}

export function nextPostInPath(postId) {
  const idx = sequenceIndexForPostId(postId)
  if (idx < 0) return null
  for (let i = idx + 1; i < PATH_SEQUENCE.length; i++) {
    if (PATH_SEQUENCE[i].postId) return PATH_SEQUENCE[i]
  }
  return null
}

// localStorage helpers ----------------------------------------------------------
const READ_KEY = 'msl_foundations_read'
const TIER_KEY = 'msl_foundations_tier'

export function readFoundationsRead() {
  try {
    const raw = localStorage.getItem(READ_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

export function markFoundationsRead(postId) {
  try {
    const set = readFoundationsRead()
    set.add(postId)
    localStorage.setItem(READ_KEY, JSON.stringify([...set]))
    return set
  } catch {
    return new Set()
  }
}

export function unmarkFoundationsRead(postId) {
  try {
    const set = readFoundationsRead()
    set.delete(postId)
    localStorage.setItem(READ_KEY, JSON.stringify([...set]))
    return set
  } catch {
    return new Set()
  }
}

export function readActiveTier() {
  return localStorage.getItem(TIER_KEY) || 't0'
}

export function writeActiveTier(tierId) {
  try { localStorage.setItem(TIER_KEY, tierId) } catch {}
}

export function isFoundationsTouched() {
  return readFoundationsRead().size > 0
}

export function tierCompletion(tier, readSet) {
  const readyPosts = tier.posts.filter(p => p.status === 'ready' && p.postId)
  const readCount = readyPosts.filter(p => readSet.has(p.postId)).length
  return { read: readCount, total: readyPosts.length, pending: tier.posts.length - readyPosts.length }
}

export function overallCompletion(readSet) {
  const allReady = PATH_SEQUENCE.filter(p => p.status === 'ready' && p.postId)
  const readCount = allReady.filter(p => readSet.has(p.postId)).length
  return { read: readCount, total: allReady.length, pending: TOTAL_POSTS - allReady.length }
}
