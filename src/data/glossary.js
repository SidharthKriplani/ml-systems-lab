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
//
// 2026-07-08 addition: 15 terms harvested from the finalized (writer + Pass-2
// adversarial audit both complete) `pot_outcomes` and `rct_design` modules in
// causalModules.js (sourceTabId 'causal_foundation'). Each def is trimmed from
// the real sentence that introduces the term in that module's `summary` (or,
// for `minimum detectable effect` and `design effect`, the sentence in
// `keyPoints`/`checkQuestions` where `summary` only used the bare acronym).
// Deliberately excluded from the candidate list: "Consistency" and
// "Positivity" (the other two identification assumptions taught alongside
// SUTVA) and bare "Compliance" — all are common-enough words used with
// unrelated meanings elsewhere in this app's foundation prose (e.g.
// "consistency" appears 50+ times across other families, "compliance" means
// regulatory compliance in monitoringModules.js) and would mis-link if keyed
// globally. "Stratified Randomization" was not literally taught — the module
// teaches "block randomization" (the exact phrase in-prose) after stratifying
// on covariates, so that's the key used instead.
//
// 2026-07-09 addition: 12 terms from the finalized (writer + Pass-2
// adversarial audit both complete) `linear_regression`, `logistic_regression`,
// and `regularization` modules in classicalMLModules.js (sourceTabId
// 'classical_ml_foundation'). 11 are net-new (logit, odds, sigmoid, log loss,
// odds ratio, perfect separation, L1, L2, shrinkage, closed form, minimum-norm
// solution); 1 ("influence") backfills a gap from the earlier linear_regression
// harvest — the module demonstrates-then-names it right next to "leverage"
// (which was captured then) but it was missed. Deliberately excluded:
// "overfitting" (used 50+ times across other families with the same meaning,
// same over-generic risk as "consistency"/"compliance" above) and
// "bias-variance tradeoff" (the concept is taught in `regularization`, but the
// exact phrase never appears contiguously in its prose — "trades a little
// bias... for... variance" — so a key for it would never actually highlight
// anything, per this file's matching mechanism). "sparsity" was considered
// (it's in the module's own `subtitle`) but the word itself never appears in
// the `summary`/`keyPoints` body text, only the zeroing-out behavior it names —
// same reasoning, skipped to keep every def a trim of real body prose rather
// than metadata.
//
// 2026-07-09 addition (batch 2): 8 terms from the finalized (writer + Pass-2
// adversarial audit both complete, fixes applied) `trees`, `random_forest`,
// and `class_imbalance` modules in classicalMLModules.js (sourceTabId
// 'classical_ml_foundation'). All 8 are net-new. Deliberately excluded:
// "precision"/"recall"/"F1"/"threshold"/"class weight" (generic terms reused
// with the same meaning across many other module families in this app —
// same over-generic risk as "overfitting" above); "PR-AUC" (already keyed
// from the eval_foundation `auc_roc` module with an equivalent definition —
// dedup, not a fresh term); "entropy" (bare word risks mis-linking into
// unrelated cross-entropy-loss prose elsewhere in the app; "information
// gain," the compound term this module actually needs, is keyed instead).

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
  'potential outcomes': {
    term: 'Potential Outcomes',
    def: "Rubin's framework that gives the causal-inference gap symbols: Y_i(1) is a unit's outcome if treated, Y_i(0) if untreated — whichever branch was actually assigned is the one you observe, the other is the missing counterfactual.",
    sourceModuleId: 'pot_outcomes',
    sourceModuleTitle: 'Potential Outcomes Framework',
    sourceTabId: 'causal_foundation',
  },
  'counterfactual': {
    term: 'Counterfactual',
    def: "The outcome a unit would have had under the treatment it didn't receive — missing for every unit, always, because you only ever observe the branch that actually happened.",
    sourceModuleId: 'pot_outcomes',
    sourceModuleTitle: 'Potential Outcomes Framework',
    sourceTabId: 'causal_foundation',
  },
  'fundamental problem of causal inference': {
    term: 'Fundamental Problem of Causal Inference',
    def: 'You observe exactly one of two potential outcomes per unit, never both — the counterfactual is missing for every unit, always, which is why causal inference is at heart a missing-data problem.',
    sourceModuleId: 'pot_outcomes',
    sourceModuleTitle: 'Potential Outcomes Framework',
    sourceTabId: 'causal_foundation',
  },
  'individual treatment effect': {
    term: 'Individual Treatment Effect (ITE)',
    def: "ITE_i = Y_i(1) − Y_i(0) — needs both potential outcomes for one person, exactly what the Fundamental Problem rules out. No dataset, however large, ever gives you one person's ITE.",
    sourceModuleId: 'pot_outcomes',
    sourceModuleTitle: 'Potential Outcomes Framework',
    sourceTabId: 'causal_foundation',
  },
  'average treatment effect': {
    term: 'Average Treatment Effect (ATE)',
    def: "ATE = E[Y_i(1) − Y_i(0)] — the average of the individual treatment effects across units. Unlike the ITE, it's estimable: a design that makes the missing outcome recoverable in expectation (randomization) lets you estimate the average across units even though no single unit's effect is ever observed.",
    sourceModuleId: 'pot_outcomes',
    sourceModuleTitle: 'Potential Outcomes Framework',
    sourceTabId: 'causal_foundation',
  },
  'sutva': {
    term: 'SUTVA',
    def: "Stable Unit Treatment Value Assumption — treating one unit doesn't change another unit's outcome. Break it (e.g. one user's treatment spills over to another) and the 'untreated' outcome is no longer a clean baseline, it's contaminated.",
    sourceModuleId: 'pot_outcomes',
    sourceModuleTitle: 'Potential Outcomes Framework',
    sourceTabId: 'causal_foundation',
  },
  'att': {
    term: 'ATT',
    def: 'The Average Treatment Effect on the Treated — averages only over units that actually got the treatment, not the full population ATE averages over.',
    sourceModuleId: 'pot_outcomes',
    sourceModuleTitle: 'Potential Outcomes Framework',
    sourceTabId: 'causal_foundation',
  },
  'cate': {
    term: 'CATE',
    def: 'The Conditional Average Treatment Effect — the effect for the slice of units sharing feature X = x, rather than the whole population.',
    sourceModuleId: 'pot_outcomes',
    sourceModuleTitle: 'Potential Outcomes Framework',
    sourceTabId: 'causal_foundation',
  },
  'intent-to-treat': {
    term: 'Intent-to-Treat (ITT)',
    def: "Comparing units by the group they were assigned to, not what they actually experienced — it's what you actually observe, since compliance can't be forced, and it understates the effect on people who actually used the treatment.",
    sourceModuleId: 'rct_design',
    sourceModuleTitle: 'RCT Design',
    sourceTabId: 'causal_foundation',
  },
  'non-compliance': {
    term: 'Non-Compliance',
    def: "Users assigned to one arm not receiving the treatment they were assigned (or crossing into the other arm's) — can run in either direction, and it's what dilutes the Intent-to-Treat estimate away from the effect on people who actually used the treatment.",
    sourceModuleId: 'rct_design',
    sourceModuleTitle: 'RCT Design',
    sourceTabId: 'causal_foundation',
  },
  'complier average causal effect': {
    term: 'Complier Average Causal Effect (CACE)',
    def: 'The effect among compliers only — under one-sided non-compliance, CACE = ITT divided by the compliance rate. The CACE figure is what the treatment itself is worth; the ITT figure is what shipping it to everyone, non-compliers included, will actually move.',
    sourceModuleId: 'rct_design',
    sourceModuleTitle: 'RCT Design',
    sourceTabId: 'causal_foundation',
  },
  'wald estimator': {
    term: 'Wald Estimator',
    def: 'Generalizes CACE to two-sided non-compliance (crossover in both arms): divide ITT by the difference in take-up between arms, instead of by one arm’s raw compliance rate.',
    sourceModuleId: 'rct_design',
    sourceModuleTitle: 'RCT Design',
    sourceTabId: 'causal_foundation',
  },
  'minimum detectable effect': {
    term: 'Minimum Detectable Effect (MDE)',
    def: 'The smallest true lift a test is powered to reliably detect at a given power and significance level. Required sample size scales roughly as 1/MDE² — halving the detectable effect roughly quadruples the users needed.',
    sourceModuleId: 'rct_design',
    sourceModuleTitle: 'RCT Design',
    sourceTabId: 'causal_foundation',
  },
  'design effect': {
    term: 'Design Effect (DEFF)',
    def: 'DEFF ≈ 1 + (m−1) × ICC — how much cluster-level randomization inflates the required sample size versus individual-level randomization (e.g. ICC=0.1, cluster size m=100 → DEFF≈10.9); unavoidable whenever SUTVA forces clustering (social, marketplace, or city-level features with few large clusters).',
    sourceModuleId: 'rct_design',
    sourceModuleTitle: 'RCT Design',
    sourceTabId: 'causal_foundation',
  },
  'block randomization': {
    term: 'Block Randomization',
    def: "Randomizing within each stratum (e.g. device, geography) so arm counts stay even inside every stratum — fixes the imbalance chance alone might leave in a small sample when you're stratifying on known covariates.",
    sourceModuleId: 'rct_design',
    sourceModuleTitle: 'RCT Design',
    sourceTabId: 'causal_foundation',
  },
  'influence': {
    term: 'Influence',
    def: 'When a data point actually does swing the fitted line — high leverage combined with a target value that fights the trend, unlike leverage alone, which is only the potential to swing it.',
    sourceModuleId: 'linear_regression',
    sourceModuleTitle: 'Linear Regression from First Principles',
    sourceTabId: 'classical_ml_foundation',
  },
  'logit': {
    term: 'Logit (Log-Odds)',
    def: 'The log of the odds — exactly the quantity a linear equation predicts before the sigmoid turns it into a probability; wrapping odds in a log fixes their lopsidedness, turning mirror-image probabilities into clean mirror images around zero.',
    sourceModuleId: 'logistic_regression',
    sourceModuleTitle: 'Logistic Regression',
    sourceTabId: 'classical_ml_foundation',
  },
  'odds ratio': {
    term: 'Odds Ratio',
    def: "e^w — how much a one-unit rise in a feature multiplies the odds of the outcome; how logistic regression coefficients get reported in medicine and credit, e.g. 'smokers have 2.3× the odds.'",
    sourceModuleId: 'logistic_regression',
    sourceModuleTitle: 'Logistic Regression',
    sourceTabId: 'classical_ml_foundation',
  },
  'odds': {
    term: 'Odds',
    def: 'A way of comparing two outcomes: the chance of the event divided by the chance of no event. Lopsided by nature — a probability of 0.99 gives odds of 99, while its mirror image, 0.01, gives odds of just 0.01.',
    sourceModuleId: 'logistic_regression',
    sourceModuleTitle: 'Logistic Regression',
    sourceTabId: 'classical_ml_foundation',
  },
  'sigmoid': {
    term: 'Sigmoid',
    def: 'The function σ(z) = 1/(1+e⁻ᶻ) that takes any real number and squashes it into (0, 1) — the S-shaped curve that bends a linear equation\'s wide-open output down into a valid probability.',
    sourceModuleId: 'logistic_regression',
    sourceModuleTitle: 'Logistic Regression',
    sourceTabId: 'classical_ml_foundation',
  },
  'log loss': {
    term: 'Log Loss (Cross-Entropy)',
    def: 'L = −[y·log(ŷ) + (1−y)·log(1−ŷ)] — the classification loss that makes the cost blow up as a confident prediction turns out wrong, with no ceiling, unlike MSE, which caps out near 1 no matter how wrong the prediction gets.',
    sourceModuleId: 'logistic_regression',
    sourceModuleTitle: 'Logistic Regression',
    sourceTabId: 'classical_ml_foundation',
  },
  'perfect separation': {
    term: 'Perfect Separation',
    def: 'When some feature splits the two classes cleanly in the training data, so the model keeps growing its weights to push every prediction toward a hard 0 or 1 and training never settles — watch for exploding weights or a loss that turns to NaN; a small L2 penalty is the fix.',
    sourceModuleId: 'logistic_regression',
    sourceModuleTitle: 'Logistic Regression',
    sourceTabId: 'classical_ml_foundation',
  },
  'l1': {
    term: 'L1 (Lasso)',
    def: 'The penalty that adds up the plain sizes of the weights (ignoring sign), also called Lasso. Its pull on a weight is a constant force regardless of size, so it can walk a weight all the way to exactly zero and stop — driving feature selection.',
    sourceModuleId: 'regularization',
    sourceModuleTitle: 'Regularisation Geometry',
    sourceTabId: 'classical_ml_foundation',
  },
  'l2': {
    term: 'L2 (Ridge)',
    def: 'The penalty that squares each weight and adds them up, also called Ridge. Its pull weakens as the weight shrinks, so it stalls just short of zero — shrinking weights smoothly but never landing on exactly zero for any finite penalty.',
    sourceModuleId: 'regularization',
    sourceModuleTitle: 'Regularisation Geometry',
    sourceTabId: 'classical_ml_foundation',
  },
  'shrinkage': {
    term: 'Shrinkage',
    def: 'The pull a weight-size penalty exerts on trained weights, pulling them toward zero — on noisy, high-dimensional data, shrinkage is what keeps a fitted weight from swinging wildly between training runs.',
    sourceModuleId: 'regularization',
    sourceModuleTitle: 'Regularisation Geometry',
    sourceTabId: 'classical_ml_foundation',
  },
  'closed form': {
    term: 'Closed-Form Solution',
    def: 'A formula that computes the exact best answer directly in one step, without any iterative search — OLS\'s normal equation and Ridge\'s (XᵀX + λI)⁻¹Xᵀy are both closed forms.',
    sourceModuleId: 'regularization',
    sourceModuleTitle: 'Regularisation Geometry',
    sourceTabId: 'classical_ml_foundation',
  },
  'minimum-norm solution': {
    term: 'Minimum-Norm Solution',
    def: 'Among many equally-good tied solutions to an underdetermined fit (like two identical feature columns), the one that additionally minimises the sum of squared weights — Ridge deterministically lands here as its penalty shrinks toward zero.',
    sourceModuleId: 'regularization',
    sourceModuleTitle: 'Regularisation Geometry',
    sourceTabId: 'classical_ml_foundation',
  },
  'gini impurity': {
    term: 'Gini Impurity',
    def: '1 − Σpₖ², where pₖ is each class\'s share of a group — a plain reading of "if you guessed a group member\'s class from the group\'s own mix, how often would you be wrong": 0 for a perfectly pure group, 0.5 for a 50/50 split.',
    sourceModuleId: 'trees',
    sourceModuleTitle: 'Decision Trees',
    sourceTabId: 'classical_ml_foundation',
  },
  'information gain': {
    term: 'Information Gain',
    def: 'The drop in entropy from a parent node to its children after a split — literally how many bits of uncertainty a question removed; a perfectly pure split removes every bit at once.',
    sourceModuleId: 'trees',
    sourceModuleTitle: 'Decision Trees',
    sourceTabId: 'classical_ml_foundation',
  },
  'cost-complexity pruning': {
    term: 'Cost-Complexity Pruning',
    def: 'The CART post-pruning method: grow the full tree, then minimise (impurity + ccp_alpha × number of leaves), a penalty on tree size exactly analogous to regularisation — a bigger ccp_alpha means a smaller tree, chosen by cross-validation.',
    sourceModuleId: 'trees',
    sourceModuleTitle: 'Decision Trees',
    sourceTabId: 'classical_ml_foundation',
  },
  'bagging': {
    term: 'Bagging',
    def: 'Short for bootstrap aggregating — give each tree a random resample of the training rows, drawn with replacement, so some rows repeat and others are left out, instead of handing every tree the same full dataset.',
    sourceModuleId: 'random_forest',
    sourceModuleTitle: 'Random Forests',
    sourceTabId: 'classical_ml_foundation',
  },
  'out-of-bag': {
    term: 'Out-of-Bag (OOB) Error',
    def: 'A free estimate of test performance: for each row, ask only the trees whose bootstrap resample happened to leave that row out (about 36.8% of rows per tree) to predict it, then check against the truth — no separate validation set required.',
    sourceModuleId: 'random_forest',
    sourceModuleTitle: 'Random Forests',
    sourceTabId: 'classical_ml_foundation',
  },
  'cost matrix': {
    term: 'Cost Matrix',
    def: 'A dollar (or other real) cost assigned to each cell of the confusion matrix, drawn from the actual business consequence of each mistake — turns "missing a positive is worse than a false alarm" into a number you can optimise a threshold against.',
    sourceModuleId: 'class_imbalance',
    sourceModuleTitle: 'Class Imbalance',
    sourceTabId: 'classical_ml_foundation',
  },
  'precision@k': {
    term: 'Precision@K',
    def: 'Precision measured only on the top K cases by predicted score — the right metric when action is capacity-limited (a team can only review K alerts) rather than governed by a global threshold.',
    sourceModuleId: 'class_imbalance',
    sourceModuleTitle: 'Class Imbalance',
    sourceTabId: 'classical_ml_foundation',
  },
  'smote': {
    term: 'SMOTE',
    def: 'A minority-class oversampling technique that creates synthetic examples in between real minority points, rather than duplicating them outright — must be applied only inside cross-validation folds, after the split, or it leaks.',
    sourceModuleId: 'class_imbalance',
    sourceModuleTitle: 'Class Imbalance',
    sourceTabId: 'classical_ml_foundation',
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
