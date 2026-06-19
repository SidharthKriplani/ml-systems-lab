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

  // ── Observation, imbalance, leakage, error analysis, explainability (v4.111) ─
  'observation discipline': {
    postId: 128,
    def: 'The skill of describing evidence directly and asking "what changed?" before reaching for memorised concepts like "overfitting" or "drift." Refuses to name the concept before doing the observation work.',
  },
  'smote': {
    postId: 129,
    def: 'Synthetic Minority Oversampling Technique. Creates new minority-class examples by linearly interpolating between existing ones and their neighbours. Works on continuous tabular features; breaks on categorical and multimodal distributions.',
  },
  'threshold moving': {
    postId: 129,
    def: 'Adjusting the decision cutoff at serving time to hit the desired operating point (precision-recall balance) without retraining. The cleanest fix for class imbalance in most production settings.',
    aliases: ['threshold tuning'],
  },
  'cost-sensitive learning': {
    postId: 129,
    def: 'Framing classification with explicit costs for false positives and false negatives. The optimal decision threshold becomes C_fp / (C_fp + C_fn), derived from business cost rather than picked arbitrarily.',
    aliases: ['cost sensitive learning'],
  },
  'class imbalance': {
    postId: 129,
    def: 'When the positive class is rare relative to the negative (fraud at 0.1%, click-through at 2%). Accuracy becomes meaningless; precision, recall, and precision@K become the right metrics.',
    aliases: ['imbalanced classes', 'imbalanced classification'],
  },
  'precision@k': {
    postId: 129,
    def: 'Of the top K predictions ranked by model score, what fraction are actually positive. The right metric for any system with an action-budget constraint (fraud queues, ad slots, content moderation).',
    aliases: ['precision at k'],
  },
  'base rate': {
    postId: 129,
    def: 'The prevalence of the positive class in the population being scored. Precision drops as base rate drops; recall does not. Many "model degraded" alerts in production trace to unstated base-rate shifts.',
  },
  'target leakage': {
    postId: 130,
    def: 'A feature that contains information about the label generated after the label was observed. The classical leakage type. Offline metrics look perfect; production collapses.',
  },
  'temporal leakage': {
    postId: 130,
    def: 'Using random k-fold on time-series data so training folds contain examples from after validation folds. The model has effectively seen the future. Fix: walk-forward cross-validation.',
  },
  'point-in-time correctness': {
    postId: 130,
    def: 'The discipline of computing every feature using only data available before the prediction timestamp. The single most important property of training data assembled from a feature store.',
    aliases: ['point in time correctness', 'point-in-time'],
  },
  'group leakage': {
    postId: 130,
    def: 'The same logical entity (user, customer) appearing in both train and validation, even with no duplicated rows. The model memorises entity-specific patterns. Fix: group-aware CV.',
    aliases: ['entity leakage'],
  },
  'feature store leakage': {
    postId: 130,
    def: 'Querying a feature store with "current value" semantics during training data assembly. Returns feature values that reflect post-event state. Fix: point-in-time queries.',
  },
  'feature store': {
    postId: 7,
    def: 'Infrastructure that stores feature values with timestamps and serves them via both a low-latency online store (for serving) and a historical offline store (for training data assembly). Enforces training-serving consistency.',
  },
  'shap': {
    postId: 132,
    def: 'Shapley Additive exPlanations. Theoretically grounded local explanation method that assigns each feature a value representing its marginal contribution to a specific prediction. Computable exactly for tree models via TreeSHAP.',
    aliases: ['shapley values', 'tree shap', 'treeshap'],
  },
  'permutation importance': {
    postId: 132,
    def: 'A global feature importance metric computed by shuffling each feature\'s values and measuring the resulting drop in performance. Unbiased by cardinality but sensitive to feature correlations.',
  },
  'gain importance': {
    postId: 132,
    def: 'Tree-model feature importance based on how much each feature reduced the loss across all splits where it was used. Fast but biased toward high-cardinality features (user_id, timestamps).',
    aliases: ['feature importance gain'],
  },
  'error analysis': {
    postId: 131,
    def: 'The discipline of slicing aggregate model metrics by segment (user tenure, geography, device, cohort, time) to find where the model is failing. Aggregate metrics hide segment failures.',
  },
  'cohort analysis': {
    postId: 131,
    def: 'Tracking the same group of users (defined by when they entered the system) over time to distinguish true behaviour drift from composition-effect drift in aggregate metrics.',
  },
  'segment calibration': {
    postId: 131,
    def: 'Computing calibration plots separately for each population segment. Aggregate calibration error often hides segments where the model is severely overconfident or underconfident.',
  },

  // ── Tier 7 production engineering terms ───────────────────────────────────
  'feature freshness': {
    postId: 7,
    def: 'How recent the feature values are at serving time. Different features have different freshness requirements; "user activity in last hour" needs minutes-old data, "user lifetime value" can be days old.',
  },
  'late-arriving data': {
    postId: 43,
    def: 'Events that arrive at the data pipeline minutes or hours after they occurred. Causes systematic differences between training-time aggregates (settled) and serving-time aggregates (still in flight).',
    aliases: ['late arriving data'],
  },

  // ── Tier 8 monitoring & MLOps terms ───────────────────────────────────────
  'psi': {
    postId: 5,
    def: 'Population Stability Index. A symmetric KL-divergence variant on binned feature distributions. The most common feature drift detection metric. A canary, not a diagnosis.',
    aliases: ['population stability index'],
  },
  'prediction drift': {
    postId: 23,
    def: 'A shift in the distribution of the model\'s output predictions over time. Downstream of either feature drift or concept drift, but often the only signal you can monitor without labels.',
  },
  'calibration drift': {
    postId: 40,
    def: 'When a model\'s predicted probabilities decouple from observed frequencies over time, even as ranking quality (AUC) stays high. Damaging for any system that uses probabilities in downstream decisions.',
  },
  'model staleness': {
    postId: 46,
    def: 'The gradual degradation of a deployed model relative to a hypothetical model retrained on the most recent data. Often invisible to standard monitoring; requires explicit freshness gap measurement.',
    aliases: ['silent model staleness'],
  },
  'champion-challenger': {
    postId: 46,
    def: 'A deployment pattern where the production "champion" model is continuously compared to a recently-retrained "challenger" model. The challenger is promoted when it consistently beats the champion.',
    aliases: ['champion challenger'],
  },

  // ── Tier 9 system design terms ────────────────────────────────────────────
  'candidate generation': {
    postId: 72,
    def: 'The retrieval stage in a recommendation funnel. Reduces millions of items to thousands of candidates in milliseconds using cheap methods (ANN, collaborative filtering). Optimised for recall, not precision.',
    aliases: ['retrieval stage'],
  },
  're-ranking': {
    postId: 72,
    def: 'The final stage in a recommendation funnel. Takes ranked items and applies business rules, diversity, freshness, and policy filters. Usually rule-based, not learned.',
    aliases: ['reranking', 're-rank'],
  },
  'two-tower': {
    postId: 71,
    def: 'Retrieval architecture with two neural networks producing user and item embeddings independently. Enables serving via precomputed item index plus a user-embedding lookup at query time.',
    aliases: ['two-tower model', 'two tower'],
  },
  'bm25': {
    postId: 80,
    def: 'A lexical retrieval algorithm based on term frequency, inverse document frequency, and document length normalisation. Still the right baseline for any search system; complements semantic retrieval.',
  },
  'hybrid retrieval': {
    postId: 80,
    def: 'Combining lexical (BM25) and semantic (dense embedding) retrieval and merging the results. Captures exact-match queries and meaning-match queries that each method alone misses.',
  },
  'cross-encoder': {
    postId: 80,
    def: 'A ranking model that processes a (query, document) pair jointly through a neural network to produce a relevance score. Much more accurate than bi-encoder retrieval but much slower.',
    aliases: ['cross encoder'],
  },
  'ann search': {
    postId: 71,
    def: 'Approximate Nearest Neighbour search. Finds the most similar vectors in a precomputed index in milliseconds instead of seconds. Implementations: FAISS, ScaNN, HNSW. The serving substrate for two-tower retrieval.',
    aliases: ['approximate nearest neighbour', 'approximate nearest neighbor', 'faiss', 'hnsw'],
  },

  // ── Tier 10 interview terms ───────────────────────────────────────────────
  'mle interview framework': {
    postId: 8,
    def: 'The structured rubric modern MLE interviews assess against. Five components: ML fundamentals, ML system design, ML coding, behavioural, depth interview. Knowing the rubric is half the prep.',
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
