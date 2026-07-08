// src/data/glossary.js — MSL foundation-module hover/tap glossary.
// Added 2026-07-08 (Task 1 of a 3-lab glossary rollout — see docs/BACKLOG.md).
//
// Seeded from 3 S-tier foundation modules (per this lab's own docs/BACKLOG.md
// S-tier callouts): `linear_regression` (classicalMLModules.js), `auc_roc` and
// `cross_validation` (both evalModules.js). Definitions are lightly trimmed
// from the sentence that first introduces each term in that module's prose.
//
// Consumed by src/utils/renderMd.jsx (`renderInline`), which does a second
// regex pass over the plain-text pieces left after the existing **bold** /
// `code` / $math$ split, wraps the FIRST occurrence of each matched term (per
// renderMd call = per rendered module body) in <GlossaryTerm>, and leaves
// every later occurrence as plain text.
//
// Key = lowercase match string. Sort order (GLOSSARY_KEYS_SORTED, longest
// first) makes multi-word phrases win over any shorter key that happens to be
// a substring of one (e.g. "pr-auc" must be tried before "auc" so "PR-AUC" in
// the prose isn't matched as bare "AUC" + literal "PR-").
//
// Matching only works cleanly for terms whose first and last characters are
// plain word characters (letters/digits) — internal punctuation like the
// apostrophe in "Cook's distance" or the hyphens in "walk-forward validation"
// is fine, but symbol-only forms like "R²" are deliberately NOT keyed here
// (word-boundary regex can't reliably bound a match ending in a non-word
// unicode symbol) — see renderMd.jsx for the matching mechanism.

export const GLOSSARY = {
  'least squares': {
    term: 'Least Squares',
    def: 'The method of picking model weights that make the total squared error between predictions and actual values as small as possible.',
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  'residual': {
    term: 'Residual',
    def: 'The gap between one prediction and the actual value for that data point — a single miss, before any averaging.',
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  'mean squared error': {
    term: 'Mean Squared Error (MSE)',
    def: 'The average of the squared misses across all predictions; squaring punishes large errors more and makes the loss smooth enough to solve for directly.',
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  'collinearity': {
    term: 'Collinearity',
    def: "When two features move together so tightly that a linear model can't tell which one deserves the credit, so their individual weights become unstable even though predictions stay fine.",
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  'heteroscedasticity': {
    term: 'Heteroscedasticity',
    def: 'When the spread of prediction errors changes across the range of the data — weights stay unbiased, but the standard errors and confidence intervals built on them become unreliable.',
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  'leverage': {
    term: 'Leverage',
    def: 'A data point with an extreme feature value, giving it outsized potential to swing the fitted line even before checking whether it actually does.',
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  "cook's distance": {
    term: "Cook's Distance",
    def: "A measure of how much a model's fitted weights would change if one specific data point were removed — flags rows that are quietly steering the whole model.",
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  'gauss-markov theorem': {
    term: 'Gauss-Markov Theorem',
    def: 'The result showing that, when its assumptions hold, ordinary least squares is BLUE — the Best Linear Unbiased Estimator, with the lowest variance of any unbiased linear method.',
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  'ordinary least squares': {
    term: 'Ordinary Least Squares (OLS)',
    def: 'The one-step formula that computes the best-fitting linear regression weights directly, without any search or iteration.',
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  'true positive rate': {
    term: 'True Positive Rate (TPR)',
    def: 'The fraction of real positives the model correctly catches — the same quantity as recall.',
    sourceModuleId: 'auc_roc',
    sourceModuleTitle: 'ROC Curve & AUC',
    sourceTabId: 'eval_foundation',
  },
  'false positive rate': {
    term: 'False Positive Rate (FPR)',
    def: 'The fraction of true negatives the model wrongly flags as positive.',
    sourceModuleId: 'auc_roc',
    sourceModuleTitle: 'ROC Curve & AUC',
    sourceTabId: 'eval_foundation',
  },
  'auc': {
    term: 'AUC',
    def: 'The area under the ROC curve — equivalently, the probability the model scores a random true positive higher than a random true negative. 0.5 is random guessing, 1.0 is perfect ranking.',
    sourceModuleId: 'auc_roc',
    sourceModuleTitle: 'ROC Curve & AUC',
    sourceTabId: 'eval_foundation',
  },
  'pr-auc': {
    term: 'PR-AUC',
    def: 'The area under the precision-recall curve; the honest metric over ROC-AUC when positives are rare, since it never involves the huge true-negative count that flatters ROC-AUC.',
    sourceModuleId: 'auc_roc',
    sourceModuleTitle: 'ROC Curve & AUC',
    sourceTabId: 'eval_foundation',
  },
  'calibration': {
    term: 'Calibration',
    def: "Whether a model's predicted probabilities match real-world frequencies — a model can rank positives above negatives perfectly (high AUC) while its probabilities are still wrong.",
    sourceModuleId: 'auc_roc',
    sourceModuleTitle: 'ROC Curve & AUC',
    sourceTabId: 'eval_foundation',
  },
  'mann-whitney u statistic': {
    term: 'Mann-Whitney U Statistic',
    def: 'The classical statistical test that AUC is mathematically identical to: the probability a randomly drawn positive scores higher than a randomly drawn negative.',
    sourceModuleId: 'auc_roc',
    sourceModuleTitle: 'ROC Curve & AUC',
    sourceTabId: 'eval_foundation',
  },
  'k-fold cross-validation': {
    term: 'K-Fold Cross-Validation',
    def: 'Splitting data into k groups, training on k-1 of them and testing on the held-out group, rotating until every group has been the test set once, then averaging the scores.',
    sourceModuleId: 'cross_validation',
    sourceModuleTitle: 'Cross-Validation Strategies',
    sourceTabId: 'eval_foundation',
  },
  'stratified k-fold': {
    term: 'Stratified K-Fold',
    def: 'K-fold cross-validation that forces every fold to keep roughly the same class ratio — essential once the positive class drops much below 20%.',
    sourceModuleId: 'cross_validation',
    sourceModuleTitle: 'Cross-Validation Strategies',
    sourceTabId: 'eval_foundation',
  },
  'group k-fold': {
    term: 'Group K-Fold',
    def: 'K-fold cross-validation that keeps every row belonging to the same entity (patient, user) on one side of the split, so the test fold is always entities the model has never seen.',
    sourceModuleId: 'cross_validation',
    sourceModuleTitle: 'Cross-Validation Strategies',
    sourceTabId: 'eval_foundation',
  },
  'walk-forward validation': {
    term: 'Walk-Forward Validation',
    def: 'A time-series validation scheme that always trains on an earlier window and tests on the window right after it, keeping time strictly ordered rather than shuffled.',
    sourceModuleId: 'cross_validation',
    sourceModuleTitle: 'Cross-Validation Strategies',
    sourceTabId: 'eval_foundation',
  },
  'purge gap': {
    term: 'Purge Gap',
    def: 'A buffer of dropped rows at a time-series train/test boundary, sized to the longest rolling-window feature, so training and test rows never share the same underlying raw data.',
    sourceModuleId: 'cross_validation',
    sourceModuleTitle: 'Cross-Validation Strategies',
    sourceTabId: 'eval_foundation',
  },
  'nested cross-validation': {
    term: 'Nested Cross-Validation',
    def: 'An outer CV loop that estimates final performance on data the hyperparameter search never touched, while an inner loop does the tuning — the only setup that honestly scores the whole pipeline including the search itself.',
    sourceModuleId: 'cross_validation',
    sourceModuleTitle: 'Cross-Validation Strategies',
    sourceTabId: 'eval_foundation',
  },
  'data leakage': {
    term: 'Data Leakage',
    def: 'When information that would not be available at real prediction time leaks into training or validation, making offline scores look better than true production performance.',
    sourceModuleId: 'cross_validation',
    sourceModuleTitle: 'Cross-Validation Strategies',
    sourceTabId: 'eval_foundation',
  },
}

// Longest-first so multi-word phrases are tried before any shorter key that
// could also match at the same text position (see file header).
export const GLOSSARY_KEYS_SORTED = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length)

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// One alternation pattern, reused by renderMd.jsx to build a `\b(...)\b`
// global/case-insensitive RegExp. Exported as a string (not a compiled
// RegExp) so the consumer controls flags/lifetime.
export const GLOSSARY_PATTERN = GLOSSARY_KEYS_SORTED.map(escapeRegex).join('|')
