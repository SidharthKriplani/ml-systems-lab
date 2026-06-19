// foundationsGlossary.js — Concept inline glossary for the Foundations Path.
// Each entry: { postId, def, aliases? }
//   postId: where this term is defined / belongs in the path
//   def:    1–2 sentence plain-language definition
//   aliases: alternative phrasings that should also trigger this card
//
// Terms are keyed by their canonical lowercase form. Matching is case-insensitive,
// whole-word, longest-match-first so "gradient descent" wins over "gradient".

export const GLOSSARY = {

  // ── Math foundations ──────────────────────────────────────────────────────
  'probability': {
    postId: 101,
    def: 'A measure of how likely an event is, expressed as a number between 0 (impossible) and 1 (certain). In ML, a probability reflects the model\'s belief given the data, not a fact about the world.',
  },
  'distribution': {
    postId: 101,
    def: 'A function that describes the relative likelihood of every possible value a random variable can take. Examples: Gaussian, Bernoulli, multinomial.',
    aliases: ['probability distribution'],
  },
  'gaussian': {
    postId: 101,
    def: 'The bell-shaped probability distribution. Most natural noise looks roughly Gaussian, which is why squared-error loss is so common.',
    aliases: ['normal distribution', 'gaussian distribution'],
  },
  'bayes theorem': {
    postId: 101,
    def: 'The rule for updating a belief when new evidence arrives. Posterior is proportional to prior times likelihood.',
    aliases: ['bayes rule', 'bayes\' theorem'],
  },
  'eigenvalue': {
    postId: 102,
    def: 'A scalar that measures how much a matrix stretches one of its special directions (an eigenvector). Eigenvalues reveal the dominant axes of variation in data.',
    aliases: ['eigenvalues'],
  },
  'eigenvector': {
    postId: 102,
    def: 'A direction that a matrix only stretches (does not rotate). The principal components in PCA are eigenvectors of the data\'s covariance matrix.',
    aliases: ['eigenvectors'],
  },
  'svd': {
    postId: 102,
    def: 'Singular Value Decomposition. Factors any matrix into a rotation, a stretch, and another rotation — the universal decomposition that powers PCA and many compression methods.',
    aliases: ['singular value decomposition'],
  },
  'dot product': {
    postId: 102,
    def: 'A single number computed from two vectors that measures how aligned they are. Positive when they point similar directions, zero when perpendicular, negative when opposite.',
    aliases: ['inner product'],
  },
  'gradient': {
    postId: 103,
    def: 'A vector of partial derivatives — one number per parameter — that points in the direction of steepest increase of a function. Used to find the direction of steepest descent during training.',
  },
  'gradient descent': {
    postId: 103,
    def: 'An optimisation algorithm that finds the minimum of a function by repeatedly taking small steps opposite to the gradient. The training algorithm behind almost every modern ML model.',
  },
  'chain rule': {
    postId: 103,
    def: 'A rule from calculus that lets you compute the derivative of a composition of functions by multiplying the derivatives of each piece. The mathematical foundation of backpropagation.',
  },
  'backpropagation': {
    postId: 103,
    def: 'The algorithm that computes gradients in a neural network by applying the chain rule layer by layer, starting from the loss and working backward.',
    aliases: ['backprop'],
  },
  'jacobian': {
    postId: 120,
    def: 'The matrix of partial derivatives when both the input and output of a function are vectors. Backprop multiplies Jacobians layer by layer.',
  },
  'hessian': {
    postId: 120,
    def: 'The matrix of second derivatives of a function. Captures curvature; used in Newton-type optimisers and inside XGBoost\'s split-finding algorithm.',
  },
  'entropy': {
    postId: 104,
    def: 'A measure of how uncertain you are about a random variable. High for fair coins, low for rigged ones. The mathematical foundation of decision-tree splits and cross-entropy loss.',
  },
  'kl divergence': {
    postId: 104,
    def: 'A measure of how different two probability distributions are. Asymmetric. KL(P from Q) is the extra surprise if you assume Q is true when reality is P.',
    aliases: ['kullback-leibler divergence', 'kl-divergence'],
  },
  'cross-entropy': {
    postId: 104,
    def: 'The standard loss function for classification. Measures the average surprise the model experiences when the true labels arrive. Minimising it makes the model\'s probabilities match reality.',
    aliases: ['cross entropy', 'log loss', 'logarithmic loss'],
  },
  'convex': {
    postId: 115,
    def: 'A function whose graph curves like a bowl — every local minimum is the global minimum. Linear regression, logistic regression, and SVMs all have convex losses.',
    aliases: ['convexity', 'convex function'],
  },
  'optimiser': {
    postId: 115,
    def: 'The algorithm that searches for parameters that minimise the loss. Gradient descent is the simplest; Adam and SGD with momentum are the modern defaults.',
    aliases: ['optimizer'],
  },
  'adam': {
    postId: 115,
    def: 'An adaptive gradient-descent optimiser that maintains a per-parameter learning rate based on recent gradient history. The default for most deep learning.',
  },

  // ── Statistics & estimation ───────────────────────────────────────────────
  'p-value': {
    postId: 113,
    def: 'The probability of seeing data this extreme (or more extreme) if the null hypothesis were true. A small p-value gives reason to reject the null.',
    aliases: ['p value', 'pvalue'],
  },
  'null hypothesis': {
    postId: 113,
    def: 'The default assumption in a hypothesis test — typically that no real effect exists. You reject it only if the data provides strong evidence against it.',
  },
  'confidence interval': {
    postId: 113,
    def: 'A range of values that would contain the true parameter most of the time across repeated experiments. More informative than a point estimate.',
  },
  'statistical power': {
    postId: 113,
    def: 'The probability that a test correctly detects a real effect. Most A/B tests are underpowered for the small lifts that matter in business.',
    aliases: ['power'],
  },
  'a/b test': {
    postId: 113,
    def: 'A controlled experiment that compares two variants by randomly assigning users to each. The gold-standard method for proving causality in product changes.',
    aliases: ['ab test', 'a b test'],
  },
  'mle': {
    postId: 105,
    def: 'Maximum Likelihood Estimation. The parameter setting under which the observed data was most probable. Underlies almost every loss function in classical ML.',
    aliases: ['maximum likelihood estimation', 'maximum likelihood'],
  },
  'map': {
    postId: 105,
    def: 'Maximum A Posteriori estimation. MLE plus a prior. Adding L2 regularisation to a loss is MAP with a Gaussian prior on the weights.',
    aliases: ['maximum a posteriori'],
  },
  'likelihood': {
    postId: 105,
    def: 'A function that says how probable the observed data is for each possible parameter setting. MLE picks the setting that maximises it.',
  },
  'prior': {
    postId: 75,
    def: 'A probability distribution that encodes your belief about a parameter before you see any data. In MAP estimation, the prior becomes a regularisation term.',
  },
  'posterior': {
    postId: 75,
    def: 'A probability distribution over a parameter after combining your prior with the likelihood of the observed data. The output of Bayesian inference.',
  },
  'em algorithm': {
    postId: 106,
    def: 'Expectation-Maximisation. An iterative algorithm for training models with hidden variables. Alternates between guessing the hidden values and re-estimating parameters.',
    aliases: ['expectation-maximization', 'expectation maximisation'],
  },
  'bayesian inference': {
    postId: 75,
    def: 'A framework for updating beliefs about parameters in light of data. Outputs full distributions, not point estimates, so uncertainty is quantified.',
    aliases: ['bayesian'],
  },

  // ── Linear models ─────────────────────────────────────────────────────────
  'linear regression': {
    postId: 111,
    def: 'A model that predicts a continuous outcome as a weighted sum of features. The simplest supervised learning method, still the right baseline for most problems.',
    aliases: ['ols', 'ordinary least squares'],
  },
  'logistic regression': {
    postId: 107,
    def: 'A model that predicts a binary outcome by passing a weighted feature sum through a sigmoid function, producing a probability. The workhorse classifier of industrial ML.',
  },
  'sigmoid': {
    postId: 107,
    def: 'A function that squashes any real number into the range (0, 1). Used to turn raw scores into probabilities in logistic regression.',
    aliases: ['sigmoid function'],
  },
  'regularisation': {
    postId: 112,
    def: 'A penalty added to the loss function that discourages large weights, preventing overfitting. L1 produces sparse models; L2 produces stable ones.',
    aliases: ['regularization'],
  },
  'l1 regularisation': {
    postId: 112,
    def: 'Adds the sum of absolute weights to the loss. The diamond geometry of the constraint pushes some weights exactly to zero — automatic feature selection.',
    aliases: ['l1 regularization', 'lasso'],
  },
  'l2 regularisation': {
    postId: 112,
    def: 'Adds the sum of squared weights to the loss. The spherical geometry shrinks all weights toward zero without setting any exactly to zero. Stable for correlated features.',
    aliases: ['l2 regularization', 'ridge', 'weight decay'],
  },
  'vc dimension': {
    postId: 119,
    def: 'A measure of how flexible a model class is. Higher VC dimension means more capacity to fit patterns — including noise — so more data is needed to generalise.',
  },
  'double descent': {
    postId: 119,
    def: 'A modern phenomenon where test error decreases, increases, then decreases again as model size grows. Explains why heavily overparameterised neural networks generalise so well.',
  },
  'overfitting': {
    postId: 119,
    def: 'When a model fits the training data so closely that it captures noise instead of signal. Training error is low, test error is high.',
  },
  'underfitting': {
    postId: 119,
    def: 'When a model is too simple to capture the real pattern in the data. Both training and test error are high.',
  },

  // ── Classical algorithms ──────────────────────────────────────────────────
  'decision tree': {
    postId: 108,
    def: 'A flowchart of if-then questions about features, ending in leaves that hold predictions. The most interpretable non-linear model.',
    aliases: ['decision trees'],
  },
  'random forest': {
    postId: 108,
    def: 'An ensemble of decision trees trained on bootstrap samples with random feature subsets. Averages many decorrelated trees to reduce variance.',
    aliases: ['random forests'],
  },
  'gini impurity': {
    postId: 108,
    def: 'A measure of how mixed the classes are at a tree node. Lower is purer. Decision trees pick splits that reduce Gini.',
    aliases: ['gini'],
  },
  'information gain': {
    postId: 108,
    def: 'The reduction in entropy from splitting a node. Decision trees pick the split that maximises information gain.',
  },
  'bootstrap': {
    postId: 108,
    def: 'Sampling with replacement from the training set. Each sample has the same size as the original but contains duplicates and misses about 37% of the data.',
    aliases: ['bootstrap sampling'],
  },
  'xgboost': {
    postId: 73,
    def: 'A gradient boosting library that uses second-order Taylor expansion of the loss. Wins nearly every Kaggle tabular competition.',
  },
  'gradient boosting': {
    postId: 73,
    def: 'An ensemble method that builds models sequentially, where each new model fits the residuals (the gradient of the loss) of the current ensemble.',
    aliases: ['gradient boosted trees', 'gradient boosted'],
  },
  'bagging': {
    postId: 127,
    def: 'Bootstrap Aggregating. Train many models on bootstrap samples and average their predictions. Reduces variance without changing bias. Random Forest is bagging applied to trees.',
  },
  'boosting': {
    postId: 127,
    def: 'A family of methods that train models sequentially, each correcting the errors of the previous ones. Reduces bias. XGBoost is the most successful instance.',
  },
  'stacking': {
    postId: 127,
    def: 'An ensemble method where a meta-learner is trained on the predictions of multiple base models. Powerful but easily overfits without out-of-fold predictions.',
  },
  'svm': {
    postId: 97,
    def: 'Support Vector Machine. A classifier that finds the boundary with the maximum margin from the closest points. The kernel trick lets it handle non-linear data.',
    aliases: ['support vector machine', 'support vector machines'],
  },
  'kernel trick': {
    postId: 97,
    def: 'A method to compute inner products in a high-dimensional feature space without explicitly computing the features. Lets linear methods (like SVMs) handle non-linear data.',
    aliases: ['kernel'],
  },
  'bias-variance': {
    postId: 74,
    def: 'The decomposition of prediction error into bias (systematic error from a too-simple model) and variance (sensitivity to training data). The diagnostic framework for model failure.',
    aliases: ['bias-variance tradeoff', 'bias-variance trade-off', 'bias variance'],
  },
  'bias': {
    postId: 74,
    def: 'Systematic error in a model\'s predictions, caused by the model class being too simple to capture the true function. Adding more data does not fix bias.',
  },
  'variance': {
    postId: 74,
    def: 'How much a model\'s predictions change with different training samples. High variance means overfitting; lower it by simplifying the model or adding data.',
  },
  'calibration': {
    postId: 76,
    def: 'When a model\'s predicted probabilities match observed frequencies. A well-calibrated 70% prediction is right 70% of the time across many predictions.',
    aliases: ['calibrated', 'well-calibrated'],
  },
  'platt scaling': {
    postId: 76,
    def: 'A post-hoc calibration method that fits a logistic regression on top of model scores to map them into honest probabilities. Trained on a held-out calibration set.',
  },
  'temperature scaling': {
    postId: 76,
    def: 'A single-parameter calibration method for neural networks. Divides logits by a temperature T before softmax; T > 1 softens overconfident predictions.',
  },
  'ece': {
    postId: 76,
    def: 'Expected Calibration Error. Summarises the gap between predicted probabilities and observed frequencies across confidence bins. Lower is better.',
    aliases: ['expected calibration error'],
  },

  // ── Unsupervised & dim reduction ──────────────────────────────────────────
  'pca': {
    postId: 86,
    def: 'Principal Component Analysis. Finds the directions of maximum variance in your data and projects onto them. The most useful tool for linear dimensionality reduction.',
    aliases: ['principal component analysis'],
  },
  'principal component': {
    postId: 86,
    def: 'One of the directions PCA finds — an eigenvector of the data\'s covariance matrix, sorted by how much variance the data has along it.',
    aliases: ['principal components'],
  },
  'k-means': {
    postId: 87,
    def: 'A clustering algorithm that partitions points into K clusters by repeatedly assigning points to the nearest centroid and re-computing centroids.',
    aliases: ['kmeans', 'k means'],
  },
  'dbscan': {
    postId: 87,
    def: 'A density-based clustering algorithm that groups points connected through dense regions. Handles arbitrary shapes and automatically labels low-density points as noise.',
  },
  'clustering': {
    postId: 87,
    def: 'The unsupervised task of grouping similar items together without labels. Different algorithms make different assumptions about what "similar" means.',
  },

  // ── Evaluation ────────────────────────────────────────────────────────────
  'precision': {
    postId: 114,
    def: 'Of the examples the model predicted positive, what fraction actually are positive. Penalises false positives.',
  },
  'recall': {
    postId: 114,
    def: 'Of the actually-positive examples, what fraction did the model identify. Penalises false negatives.',
    aliases: ['sensitivity'],
  },
  'f1 score': {
    postId: 114,
    def: 'The harmonic mean of precision and recall. A single number that balances both, assuming they are equally important.',
    aliases: ['f1', 'f-score'],
  },
  'auc': {
    postId: 3,
    def: 'Area Under the ROC Curve. The probability that a model ranks a random positive higher than a random negative. Threshold-independent ranking metric.',
    aliases: ['auc-roc', 'roc-auc', 'area under the curve'],
  },
  'pr-auc': {
    postId: 3,
    def: 'Area under the Precision-Recall curve. The right metric when classes are imbalanced and you care about high-precision predictions.',
    aliases: ['precision-recall auc'],
  },
  'cross-validation': {
    postId: 20,
    def: 'A method for estimating how a model will generalise by splitting the data into folds, training on some, evaluating on the held-out one, and rotating.',
    aliases: ['cross validation', 'cv'],
  },
  'k-fold': {
    postId: 20,
    def: 'Cross-validation that splits data into k equal folds. Train on k-1, evaluate on the remaining one, rotate. Common choices: k=5 or k=10.',
    aliases: ['k fold', 'kfold'],
  },
  'data leakage': {
    postId: 20,
    def: 'When information from the validation or test set bleeds into training, making offline metrics look better than production performance. Comes in temporal, group, target, and engineering flavors.',
    aliases: ['leakage'],
  },
  'walk-forward': {
    postId: 88,
    def: 'A time-respecting cross-validation strategy: always train on data before time T and evaluate on data after. The only honest backtest for time-series models.',
    aliases: ['walk forward', 'walk-forward validation'],
  },

  // ── Time series & specialised ─────────────────────────────────────────────
  'arima': {
    postId: 88,
    def: 'AutoRegressive Integrated Moving Average. The classical workhorse for time-series forecasting. Combines autoregressive terms, differencing, and moving-average noise terms.',
  },
  'survival analysis': {
    postId: 118,
    def: 'Modelling time-to-event when some subjects have not experienced the event by the end of the observation window (censored data).',
  },
  'censoring': {
    postId: 118,
    def: 'When a subject\'s event time is partially observed — they have not experienced the event by the end of the data window. Survival analysis handles this; standard regression does not.',
    aliases: ['censored'],
  },
  'isolation forest': {
    postId: 95,
    def: 'An anomaly detection method that scores points by how few random splits it takes to isolate them. Anomalies are isolated quickly; normal points are not.',
  },
  'thompson sampling': {
    postId: 96,
    def: 'A bandit algorithm that maintains a belief distribution over each arm\'s payout and pulls the arm with the highest sampled value. Balances exploration and exploitation automatically.',
  },
  'ucb': {
    postId: 96,
    def: 'Upper Confidence Bound. A bandit algorithm that pulls the arm with the highest estimate plus an exploration bonus that shrinks as the arm is pulled more.',
  },
  'bandit': {
    postId: 96,
    def: 'A framework for sequential decision-making under uncertainty. Choose between arms with unknown payouts to maximise total reward.',
    aliases: ['multi-armed bandit', 'multi armed bandit'],
  },

  // ── Production concepts ──────────────────────────────────────────────────
  'training-serving skew': {
    postId: 117,
    def: 'When features computed at training time differ from features computed at serving time, even for the same input. The number-one production ML bug.',
    aliases: ['train-serve skew', 'training serving skew'],
  },
  'feature drift': {
    postId: 104,
    def: 'When the distribution of model inputs in production diverges from the training distribution. Often measured with PSI or KL divergence. A canary, not always a diagnosis.',
    aliases: ['covariate shift'],
  },
  'concept drift': {
    postId: 96,
    def: 'When the relationship between features and labels changes over time, not just the input distribution. The kind of drift that genuinely degrades model performance.',
  },
  'one-hot encoding': {
    postId: 117,
    def: 'A way to encode a categorical feature by giving each category its own binary column. Lossless but explodes dimensions for high-cardinality features.',
    aliases: ['one hot encoding', 'onehot'],
  },
  'target encoding': {
    postId: 117,
    def: 'Encoding categorical features by replacing each category with the mean target value for that category. Efficient but extremely leak-prone unless computed inside CV folds.',
  },
}

// Build a lookup map keyed by canonical lowercase term AND every alias.
function buildLookup() {
  const lookup = {}
  for (const [key, val] of Object.entries(GLOSSARY)) {
    lookup[key.toLowerCase()] = { canonical: key, ...val }
    if (val.aliases) {
      for (const alias of val.aliases) {
        lookup[alias.toLowerCase()] = { canonical: key, ...val }
      }
    }
  }
  return lookup
}

export const GLOSSARY_LOOKUP = buildLookup()

// Build a single regex matching any term or alias, longest-first.
function buildRegex() {
  const terms = Object.keys(GLOSSARY_LOOKUP).sort((a, b) => b.length - a.length)
  // Escape regex special chars
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp('\\b(' + escaped.join('|') + ')\\b', 'gi')
}

export const GLOSSARY_REGEX = buildRegex()
