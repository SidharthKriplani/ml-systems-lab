export const CLASSICAL_ML_MODULES = [
  {
    id: 'linear_regression',
    title: 'Linear Regression from First Principles',
    subtitle: 'OLS, normal equation, geometric interpretation, assumptions',
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['regression', 'OLS', 'linear models'],
    summary: `Linear regression models the expected output as a linear function of inputs: ŷ = Xθ. The Ordinary Least Squares (OLS) estimator minimises the sum of squared residuals ‖y−Xθ‖², and the closed-form solution θ̂ = (XᵀX)⁻¹Xᵀy is the normal equation — derived by setting the gradient to zero. Geometrically, ŷ = Xθ̂ is the orthogonal projection of y onto the column space of X, with residuals perpendicular to that column space. The Gauss-Markov theorem guarantees OLS is BLUE (Best Linear Unbiased Estimator) under modest assumptions — not normality, just zero-mean uncorrelated errors with constant variance. Multicollinearity makes XᵀX near-singular, causing coefficient estimates to explode; Ridge regression is the fix. R² measures the fraction of variance explained, but adding any feature increases R² — use adjusted R² or holdout validation instead. Violating homoscedasticity (constant error variance) does not bias the coefficients but makes standard errors wrong.`,
    keyPoints: [
      `Normal equation θ̂ = (XᵀX)⁻¹Xᵀy: derived by setting ∂‖y−Xθ‖²/∂θ = −2Xᵀ(y−Xθ) = 0. The computation is O(nd² + d³), so it becomes infeasible when d is large (d > 10,000). For large d, iterative methods like gradient descent or conjugate gradient are the practical path.`,
      `Geometric interpretation: ŷ = Xθ̂ is the orthogonal projection of y onto col(X). The residuals satisfy Xᵀe = 0, meaning they are perpendicular to every column of X. This is a structural property of the solution, not an assumption.`,
      `Gauss-Markov theorem: OLS is BLUE among all linear unbiased estimators when errors are zero-mean, uncorrelated, and homoscedastic. Normality is NOT required. Confidence intervals via CLT hold for large n regardless of the error distribution.`,
      `Multicollinearity: nearly linearly dependent features make XᵀX near-singular. Small data changes cause huge coefficient swings — high variance. The model's predictions may be fine, but the individual coefficients become meaningless and unstable.`,
      `R² = 1 − SS_res/SS_tot ∈ [0,1]: adding any feature (even noise) increases R². Use adjusted R² (which penalises extra features) or cross-validation to guard against spurious feature inclusion.`,
      `Heteroscedasticity: non-constant error variance leaves OLS unbiased but no longer BLUE. Standard errors are wrong, making t-tests and CIs invalid. The fix is White's heteroscedasticity-robust standard errors or WLS.`,
      `OLS is the MLE for Gaussian errors: minimising ‖y−Xθ‖² is equivalent to maximising N(y; Xθ, σ²I). The choice of squared loss implicitly assumes Gaussian noise. If errors are better modelled as Laplace, use L1 (median regression) instead.`,
      `Residual analysis: plot residuals vs. fitted values to check linearity and homoscedasticity; use a QQ-plot for normality; plot residuals vs. each feature to detect omitted non-linearities. These diagnostics come before trusting any OLS inference.`,
    ],
    checkQuestions: [
      {
        q: `Why is it problematic to invert XᵀX numerically, and what is the preferred computational approach?`,
        a: `Forming XᵀX squares the condition number: if cond(X)=κ, then cond(XᵀX)=κ². For κ=10⁶ (not unusual in real data), cond(XᵀX)=10¹² — near the limit of double precision (~10¹⁶), meaning 4 significant digits are lost. The preferred approach: QR decomposition X=QR gives θ̂=R⁻¹Qᵀy, working with κ(X) directly. For very large systems: SVD-based pseudoinverse (sklearn default) or iterative solvers (conjugate gradient). sklearn's LinearRegression uses SVD and never fails due to exact multicollinearity — it computes the minimum-norm solution automatically.`
      },
      {
        q: `Your linear regression model has R²=0.95 but the residuals show a clear U-shape when plotted against fitted values. What does this mean?`,
        a: `A U-shaped residual pattern signals systematic non-linearity — the model is consistently underpredicting at low and high fitted values, and overpredicting in the middle. This violates the linearity assumption, meaning the model is misspecified. High R² does not validate the model — R² measures how much variance is explained but not whether the functional form is correct. Remedies: (1) Add polynomial terms (x², x³) or spline basis. (2) Apply a non-linear transformation to the response (log(y) for count/skewed data). (3) Use a non-parametric model (GAM, tree-based). Recheck residuals after each modification.`
      },
      {
        q: `You have two features with correlation 0.99. What happens to the linear regression coefficients, and how do Ridge and Lasso behave differently on this input?`,
        a: `With correlation 0.99, XᵀX is near-singular. OLS coefficients are extremely unstable — a small change in any training point causes large swings in both coefficients. Ridge regression (XᵀX + λI)⁻¹Xᵀy: adds λ to all eigenvalues, stabilising the inversion; Ridge splits the coefficient weight roughly equally between the two correlated features — both get non-zero, similar-magnitude coefficients. Lasso: arbitrarily picks one of the two correlated features (whichever has slightly larger correlation with the residual) and drives the other to exactly zero — the selected feature can change dramatically across different training sets. Ridge is safer when both correlated features genuinely matter.`
      },
      {
        q: `Gauss-Markov says OLS is BLUE. What exactly does "Best Linear Unbiased" mean, and what does it NOT guarantee?`,
        a: `"Unbiased" means E[θ̂] = θ (correct on average across all possible datasets). "Linear" means the estimator is a linear function of y: θ̂ = Cy for some matrix C. "Best" means minimum variance among all linear unbiased estimators. What GM does NOT guarantee: (1) OLS is not best among non-linear or biased estimators — Ridge (biased) can have lower MSE = Bias² + Variance. (2) OLS does not give minimum prediction error on new data — overfitting can make test MSE much higher. (3) BLUE requires the GM assumptions (no endogeneity, homoscedasticity) — violating them makes OLS non-optimal.`
      },
    ],
    takeaway: `The key insight is that OLS minimises squared residuals which implicitly assumes Gaussian noise, which means in practice checking the residual distribution and heteroscedasticity is not optional — it tells you whether your standard errors and p-values are trustworthy.`,
    interactiveId: 'linear_regression_viz',
  },
  {
    id: 'logistic_regression',
    title: 'Logistic Regression',
    subtitle: 'Sigmoid, cross-entropy loss, decision boundary, calibration',
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['classification', 'logistic regression', 'calibration'],
    summary: `Logistic regression models P(y=1|x) = σ(wᵀx + b) where σ(z) = 1/(1+e^{-z}). Despite the name, it is a classification model — the "regression" refers to modelling the log-odds as a linear function. The log-odds (logit) is linear in x: log[P(y=1)/P(y=0)] = wᵀx + b, producing a hyperplane decision boundary in feature space. Training minimises cross-entropy loss, equivalent to MLE under the Bernoulli likelihood. The gradient has the clean form (ŷ − y), identical in structure to the linear regression gradient. Logistic regression is well-calibrated by construction: when the model is correctly specified, the sigmoid maps logits to probabilities that match empirical frequencies. When classes are perfectly linearly separable, the MLE does not exist and weights diverge to infinity — L2 regularisation is the fix.`,
    keyPoints: [
      `Sigmoid σ(z) = 1/(1+e^{-z}) ∈ (0,1); σ'(z) = σ(z)(1−σ(z)). The smooth derivative enables gradient descent, but the gradient ∂L/∂z vanishes when the model is very confident (correct or wrong), making learning slow near the extremes.`,
      `Log-odds interpretation: wᵀx + b = log[P(y=1)/P(y=0)]. Each weight wⱼ is the log-odds ratio associated with a unit increase in xⱼ. Coefficient interpretation lives on the log-odds scale, not the probability scale.`,
      `Cross-entropy gradient wrt logit z: ∂L/∂z = ŷ − y. This is just the prediction error, same form as in linear regression. Combining sigmoid with cross-entropy avoids the vanishing gradient that sigmoid alone would create.`,
      `Decision boundary: P(y=1|x) = 0.5 ⟺ wᵀx + b = 0 — a hyperplane. Logistic regression is a linear classifier and cannot learn non-linear boundaries without feature engineering or basis expansion.`,
      `Calibration: logistic regression probability outputs are well-calibrated when the model is correctly specified — P(y=1|ŷ=p) ≈ p empirically. A predicted probability of 0.7 means roughly 70% of those samples are positive. Tree models and SVMs do not guarantee this.`,
      `Separability failure: when data is linearly separable, MLE drives ‖w‖→∞ and the optimisation diverges. L2 regularisation ensures a finite solution — always include it.`,
      `Softmax (multinomial LR): P(y=k|x) = exp(wₖᵀx)/Σⱼ exp(wⱼᵀx) — generalises binary logistic regression to K classes with cross-entropy loss summed over classes. Binary logistic regression is just the K=2 special case.`,
      `L2 regularisation prevents overfitting when p >> n (features exceed samples) — equivalent to MAP with Gaussian prior. The regularisation strength λ should be tuned via CV and scales inversely with training set size.`,
    ],
    checkQuestions: [
      {
        q: `Why does logistic regression fail when classes are perfectly linearly separable, and how does L2 regularisation fix it?`,
        a: `When data is linearly separable, there exists a hyperplane wᵀx + b = 0 that correctly classifies all training points. The MLE maximises Σ log σ(yᵢ(wᵀxᵢ+b)). For correctly classified points, yᵢ(wᵀxᵢ+b) > 0 and σ → 1 as the product grows. The log-likelihood increases indefinitely as ‖w‖→∞ — there is no maximum, just a supremum at infinity. Gradient descent will diverge. L2 regularisation adds λ‖w‖² to the loss, creating a finite optimal ‖w‖*: the benefit of further increasing ‖w‖ is outweighed by the L2 penalty. The solution exists and is unique for any λ > 0.`
      },
      {
        q: `Your logistic regression model predicts P(y=1) = 0.8 for a sample. A reliability diagram shows that samples with predicted probability 0.8 are actually positive only 55% of the time. What is wrong and how do you fix it?`,
        a: `The model is overconfident — it outputs 0.8 but the empirical frequency is only 0.55. This can happen when the model is regularised too strongly (logits are shrunk below their optimal values), when the training data is imbalanced, or when the model is misspecified. Fix: apply Platt scaling — fit a logistic regression on a separate calibration set: P(y=1|f) = σ(af+b) where f is the original model's logit output. Or use isotonic regression for more flexible non-parametric recalibration. Both require a separate calibration set — never the training set. Validate on a held-out test set using ECE after calibration.`
      },
      {
        q: `How does the gradient of binary cross-entropy with sigmoid differ from MSE with linear output? What is the significance of this difference?`,
        a: `MSE + linear: ∂L/∂z = (ŷ−y) where ŷ = z (no saturation). Cross-entropy + sigmoid: ∂L/∂z = σ(z)−y = ŷ−y (same form). The significance: if we used MSE with sigmoid, we would get ∂L/∂z = (σ(z)−y)·σ(z)(1−σ(z)) — the σ(z)(1−σ(z)) term nearly vanishes when the model is confidently wrong (e.g., σ(z)≈0 when y=1), causing vanishing gradients. Cross-entropy eliminates this: the σ'(z) in the chain rule cancels with the 1/σ(z) in the log-likelihood gradient, giving the clean prediction-error gradient. This is why cross-entropy, not MSE, is the correct loss for classification with sigmoid/softmax outputs.`
      },
      {
        q: `You train logistic regression with C=1 (sklearn default, where C=1/λ). Your model underfits. What does C control and what value would you try next?`,
        a: `In sklearn, C = 1/λ is the inverse of regularisation strength. C=1 means λ=1 — moderate regularisation. Underfitting (high training error, high test error) means the model is too regularised: the L2 penalty is too strong and is pulling weights toward zero, preventing the model from fitting the training data. To reduce regularisation: increase C (e.g., try C=10, C=100). This allows larger weight magnitudes and a more complex decision boundary. Also check: are the features well-scaled? Logistic regression with L2 is scale-sensitive — standardise features first. Is the problem actually non-linear? If so, add polynomial features or switch to a non-linear model.`
      },
    ],
    takeaway: `The key insight is that combining sigmoid activation with cross-entropy loss produces a gradient that is simply the prediction error (ŷ−y), which means in practice logistic regression is as easy to optimise as linear regression and is always the first classifier to try.`,
  },
  {
    id: 'regularization',
    title: 'Regularisation Geometry',
    subtitle: 'L1 vs L2 geometry, Lasso sparsity, Ridge shrinkage, elastic net',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['regularisation', 'L1', 'L2', 'Lasso', 'Ridge'],
    summary: `Regularisation adds a penalty term to the loss to control model complexity and prevent overfitting. L2 (Ridge) adds λ‖w‖² — it shrinks all weights toward zero proportionally and always has a closed-form solution. L1 (Lasso) adds λ‖w‖₁ — it induces exact sparsity by pushing some weights to exactly zero, performing automatic feature selection. The geometric insight is powerful: constrained optimisation (minimise loss subject to ‖w‖_p ≤ r) has a diamond-shaped (L1) or sphere-shaped (L2) constraint boundary; the diamond's corners lie on the coordinate axes, and the loss contours (ellipses centred at the OLS solution) tend to touch these corners first, making the optimal solution sparse. Elastic net combines both penalties, getting sparsity from L1 and stability for correlated features from L2. From a Bayesian perspective, L2 is MAP with Gaussian prior; L1 is MAP with Laplace prior.`,
    keyPoints: [
      `Ridge (L2): θ̂_ridge = (XᵀX + λI)⁻¹Xᵀy — always invertible for any λ>0, even with perfect multicollinearity. Ridge is the go-to fix for ill-conditioned XᵀX while simultaneously regularising.`,
      `Ridge shrinkage: in the eigenbasis of XᵀX, Ridge scales the coefficient for component k by σₖ²/(σₖ²+λ). Small singular values (weak signal directions) are shrunk most — Ridge implicitly performs a soft rank truncation, filtering noise in low-variance directions.`,
      `Lasso (L1): no closed form — requires coordinate descent or LARS. At the L1 ball's corners (on coordinate axes), exactly k coefficients are non-zero. Lasso drives irrelevant feature weights to exactly zero, performing automatic feature selection.`,
      `Geometric intuition: minimise loss s.t. ‖w‖_p ≤ r — loss contours are ellipses centred at the OLS solution. The L1 diamond's corners sit on the axes, so the expanding ellipse hits a corner first (sparse solution). The L2 sphere has no corners, so the solution is almost never exactly sparse.`,
      `When L1 wins: the true model is sparse (few features matter); high-dimensional data (p >> n); you need an interpretable, parsimonious model. The failure mode is that L1 arbitrarily picks one of several correlated features.`,
      `When L2 wins: many features contribute small effects (dense signal); correlated features should be retained together; a closed-form solution is needed. L2 never exactly zeros any weight, so manual thresholding is needed for feature selection.`,
      `Elastic net: αλ‖w‖₁ + (1−α)λ‖w‖₂² — sparsity from L1 plus stability for correlated features from L2. The grouping effect means correlated features tend to get similar non-zero coefficients. Elastic net is the preferred choice for genomics and NLP bag-of-words settings.`,
      `Regularisation path: as λ increases from 0 to ∞, coefficients shrink from the OLS solution to zero. The Lasso path is piecewise linear (LARS algorithm); the Ridge path is smooth. Plotting the path reveals feature entry order and helps choose λ.`,
    ],
    checkQuestions: [
      {
        q: `You have 200 samples and 500 features. Many features are likely irrelevant. Which regulariser do you choose and why?`,
        a: `L1 (Lasso) is preferred: it performs automatic feature selection by driving irrelevant feature weights to exactly zero, giving a sparse interpretable model. With n=200 << p=500, the problem is underdetermined (infinitely many OLS solutions). Sparsity is a reasonable assumption and helps generalisation. If features are highly correlated, elastic net is better than pure Lasso — Lasso arbitrarily picks among correlated features, while elastic net applies the grouping effect. Start with Lasso (sklearn's LogisticRegression with penalty='l1'), then try elastic net if Lasso's selected features are unstable across cross-validation folds.`
      },
      {
        q: `Explain geometrically why Lasso produces sparse solutions but Ridge does not, using the constrained optimisation formulation.`,
        a: `Constrained form: minimise loss(w) subject to ‖w‖_p ≤ r. The loss L(w) has elliptical level curves centred at θ̂_OLS. We want the point on the constraint boundary closest to θ̂_OLS. L1 constraint: ‖w‖₁ ≤ r is a diamond (in 2D) with corners at (r,0), (0,r), (−r,0), (0,−r). As we expand the ellipse from θ̂_OLS outward, it first hits a corner of the diamond where one coordinate is exactly zero. L2 constraint: ‖w‖₂ ≤ r is a circle (sphere in high-D) with no corners — the ellipse hits the sphere at a smooth point, almost never on an axis, so almost no coefficient is exactly zero.`
      },
      {
        q: `A Lasso model selects 10 features, but when you rerun with a different random seed (for data splitting), it selects a completely different 10 features. What does this mean and what should you do?`,
        a: `This instability signals that many non-selected features are nearly equally predictive and correlated with the 10 selected ones. Lasso's feature selection is unstable when multiple features share similar predictive power — it arbitrarily picks one from each correlated group. Remedies: (1) Switch to elastic net (grouping effect stabilises correlated feature selection). (2) Use stability selection: run Lasso on many bootstrap subsamples, keep only features selected in > 80% of runs — these are the truly stable predictors. (3) Use permutation importance or SHAP on a Random Forest to identify the genuinely important features without assuming sparsity.`
      },
    ],
    takeaway: `The key insight is that L1 regularisation produces sparse solutions because the diamond-shaped L1 constraint ball has corners on coordinate axes, which means in practice you should choose L1 (or elastic net) when you expect few features to matter and need automatic selection.`,
  },
  {
    id: 'generalization',
    title: 'Generalisation Theory',
    subtitle: 'Bias-variance, VC dimension, PAC learning, double descent',
    difficulty: 'advanced',
    estimatedMin: 32,
    tags: ['bias-variance', 'VC dimension', 'overfitting', 'double descent'],
    summary: `Generalisation measures how well a model performs on unseen data from the same distribution as training data. The bias-variance decomposition splits expected test MSE into three terms: irreducible noise σ², bias² (systematic error from underfitting), and variance (sensitivity to the specific training set). This decomposition reveals a fundamental tension: reducing bias typically increases variance and vice versa. Simpler models have high bias but low variance; complex models have low bias but high variance. The classical U-shaped test error curve versus model complexity is real but incomplete — overparameterised models (more parameters than data points) exhibit "double descent" where test error improves again past the interpolation threshold. This challenges classical theory and is explained by the implicit regularisation of gradient descent, which finds minimum-norm interpolating solutions that generalise well.`,
    keyPoints: [
      `Bias-variance decomposition: E[(y−ŷ)²] = σ² + Bias²(ŷ) + Var(ŷ). Bias = E[ŷ]−f(x) (systematic error); Variance = E[(ŷ−E[ŷ])²] (sensitivity to training data). High variance means the model memorises training data; high bias means it misses the signal.`,
      `Regularisation controls the bias-variance tradeoff: increasing λ increases bias and decreases variance. Cross-validation over λ is finding the bias-variance optimum for your specific dataset size.`,
      `VC dimension: the maximum number of points that a hypothesis class can shatter (label arbitrarily). Linear classifiers in ℝᵈ have VC-dim = d+1. Every additional feature increases the hypothesis class's complexity and the risk of overfitting.`,
      `PAC learning bound: with probability 1−δ, test error ≤ train error + √(VC-dim·log(n) + log(1/δ))/n. A more expressive model needs more data to generalise — the required sample size grows roughly linearly with VC dimension.`,
      `Inductive bias: assumptions baked into the model architecture that guide generalisation. CNNs assume translation invariance; Transformers assume permutation equivariance; RNNs assume temporal locality. Matching inductive bias to the data structure matters more than just minimising training loss.`,
      `Double descent: test error decreases, then rises (classical overfitting), then decreases AGAIN for very overparameterised models. The interpolation threshold is where the model first achieves zero training error. The classical U-curve is just the left half of a more complex picture.`,
      `Implicit regularisation of SGD: among all zero-training-error solutions, gradient descent finds the minimum-norm one — a form of implicit L2 regularisation. Overparameterised models trained with SGD generalise better than classical theory predicts.`,
      `Generalisation in practice: train/val/test split hygiene — the test set must never be used for model selection. Any decision (architecture, hyperparameters, features) based on test set performance turns the test set into a validation set. You no longer have an unbiased estimate.`,
    ],
    checkQuestions: [
      {
        q: `A model achieves 99% training accuracy and 75% test accuracy. What does this tell you about bias and variance, and what would you do?`,
        a: `High training accuracy + much lower test accuracy = low bias (the model fits training data well) + high variance (does not generalise — sensitive to the specific training set). The model is overfitting. Remedies in priority order: (1) More training data — reduces variance most directly. (2) Stronger regularisation (L2, dropout, weight decay). (3) Simpler architecture (fewer parameters, shallower network). (4) Ensemble methods (bagging averages out variance). Increasing model capacity would worsen the problem. The 24% gap is large — start with data augmentation or getting more labels before architectural changes.`
      },
      {
        q: `Explain the double descent phenomenon. A neural network's test error is worse at 1000 parameters than at 100 parameters, but better at 1,000,000 parameters than at 100. How is this possible?`,
        a: `The 1000-parameter model is near the interpolation threshold — it has just enough capacity to memorise the training data, but the solution it finds has high variance (sensitive to the specific training set). The 100-parameter model is underparameterised and underfits — higher bias. The 1,000,000-parameter model is highly overparameterised: gradient descent finds the minimum-norm interpolating solution among infinitely many zero-training-error solutions. Minimum-norm solutions correspond to smoother, more generalising functions. The "implicit regularisation" of gradient descent prefers these smooth solutions. Classical bias-variance theory predicts the U-curve (100 → 1000); double descent adds the second descent (1000 → 1,000,000). Early stopping at 100 would have been a worse choice than using the massively overparameterised model.`
      },
      {
        q: `You increase a linear classifier's feature count from d=100 to d=500 (adding new features). Training accuracy improves but test accuracy degrades. Explain in terms of VC dimension and what you should do.`,
        a: `Linear classifiers in ℝᵈ have VC-dim = d+1. Increasing d from 100 to 500 increases VC-dim from 101 to 501 — the hypothesis class can now shatter more points, meaning it can fit more arbitrary patterns including noise in the training set. The generalisation bound increases: test error ≤ train error + √(500·log(n)/n) > √(100·log(n)/n). With the same n, the model now needs 5× more data to maintain the same generalisation gap. Fixes: (1) Regularise more strongly (larger λ for Ridge/Lasso to reduce effective complexity). (2) Apply feature selection — keep only features with genuine predictive value. (3) Collect more data proportional to the increased VC dimension.`
      },
    ],
    takeaway: `The key insight is that bias and variance trade off as you change model complexity, which means in practice the best model is not the most accurate on training data but the one whose complexity is calibrated to the amount of training data available.`,
  },
  {
    id: 'trees',
    title: 'Decision Trees',
    subtitle: 'Information gain, Gini, pruning, depth-accuracy tradeoff',
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['decision trees', 'Gini', 'information gain'],
    summary: `Decision trees recursively partition the feature space with axis-aligned splits, selecting at each node the feature and threshold that maximally reduce impurity. Impurity is measured by Gini index G = 1 − Σ pₖ² or information gain (entropy reduction). The greedy splitting algorithm is locally optimal at each node but not globally optimal — finding the optimal tree is NP-hard. Trees are interpretable, handle mixed types and missing values naturally, require no feature scaling, and automatically model feature interactions. However, they are high-variance estimators: small changes in training data can produce completely different tree structures. Without pruning or depth limits, a tree will grow a leaf per training sample, perfectly memorising the training set. This instability motivates ensemble methods (random forests, gradient boosting) that average over many trees to reduce variance.`,
    keyPoints: [
      `Splitting criterion: find feature j and threshold t minimising weighted child impurity — Gini: G = 1−Σpₖ²; Entropy: H = −Σpₖlog pₖ. Both give very similar splits in practice. Gini is faster to compute (no logarithm); the choice rarely affects model quality but can affect speed on large datasets.`,
      `Greedy algorithm: splits are locally optimal but not globally. The globally optimal tree is NP-hard to find, so all practical tree implementations are greedy and suboptimal by construction.`,
      `A fully grown tree memorises training data: one leaf per training sample gives 100% training accuracy. This is extreme overfitting — zero bias but enormous variance. Depth must be limited or the tree must be pruned.`,
      `Cost-complexity pruning (sklearn default): adds penalty α × (number of leaves) to total error, grows the full tree, then prunes back leaves that increase the penalised criterion. α is selected via CV, trading bias for variance reduction in a principled way.`,
      `Feature importance from trees: Gini importance is total impurity decrease weighted by node sample count — biased toward high-cardinality continuous features. Permutation importance (shuffle the feature, measure accuracy drop) is more reliable and less biased.`,
      `Instability (high variance): a different random seed for data splitting often gives a completely different top split, which cascades through the entire tree. This is exactly why random forests work: averaging over many unstable trees produces a stable ensemble.`,
      `Trees handle non-linearity and interactions automatically: splitting on feature A then B encodes the interaction A×B. No feature engineering needed for tabular data with unknown interaction structure.`,
      `Trees do not extrapolate: a tree predicts by returning the mean of the leaf it falls into. For a test point outside the training feature range, it returns the nearest leaf value — constant prediction. Tree-based models fail when the test distribution has different support than training.`,
    ],
    checkQuestions: [
      {
        q: `Why do decision trees have high variance, and how does this motivate random forests?`,
        a: `Trees are unstable: small changes in training data (even swapping a few samples) can produce very different top splits, which propagate down to completely different tree structures. This is high variance. A single tree can perfectly fit training data but fails on test data because it memorised noise. Random forests reduce variance by: (1) bagging — training each tree on a bootstrap sample (different data reduces correlation between trees), (2) random feature subsampling — considering only m features at each split (further decorrelates trees). The ensemble average has much lower variance while preserving low bias. Ensemble variance = ρσ² + (1−ρ)σ²/T where ρ is pairwise tree correlation — decorrelation (reducing ρ) is as important as having many trees.`
      },
      {
        q: `Gini impurity and entropy give almost identical splits in practice. When would you choose one over the other, and is there any principled reason?`,
        a: `Information gain (entropy reduction) has a principled derivation from information theory: it maximises the mutual information between the split and the class label. Gini impurity has a different interpretation: it is the probability of misclassifying a randomly drawn sample if classified according to the class distribution. In practice: (1) Gini is faster to compute (no logarithm). (2) Entropy tends to produce more balanced splits (log penalises extreme imbalance more). (3) For highly imbalanced classes, entropy is sometimes slightly better. In most benchmarks, the difference in final model quality is < 0.1%. Choose entropy when you care about the information-theoretic interpretation; choose Gini for speed on large datasets.`
      },
      {
        q: `A decision tree with max_depth=None achieves 100% training accuracy and 62% test accuracy. You reduce max_depth to 5 and get 85% training and 80% test accuracy. Explain this in terms of bias-variance, and how would you find the optimal depth?`,
        a: `max_depth=None: zero bias (perfectly fits training), enormous variance (memorises noise). Huge generalisation gap (100% → 62%). max_depth=5: increased bias (cannot fit every training pattern), much lower variance (simpler structure). Better generalisation gap (85% → 80%). The optimal depth is found via cross-validation: for depth in [1, 2, 3, ..., 20], compute CV test accuracy; pick the depth where CV accuracy is highest. sklearn's cost_complexity_pruning_path() returns a range of ccp_alpha values — sweep these with CV; this is more principled than limiting depth because it prunes in a data-adaptive way.`
      },
    ],
    takeaway: `The key insight is that a decision tree's high variance comes from the instability of greedy splits, which means in practice you never use a single tree for prediction — you use it as the building block for random forests or gradient boosting.`,
  },
  {
    id: 'random_forest',
    title: 'Random Forests',
    subtitle: 'Bagging, OOB error, feature importance, hyperparameter sensitivity',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['random forest', 'bagging', 'ensemble'],
    summary: `Random forests train an ensemble of decorrelated decision trees using two sources of randomness: bagging (bootstrap aggregating — each tree sees a different random sample) and random feature subsampling (at each split, only m of d features are considered). The final prediction averages all trees for regression or takes majority vote for classification. Decorrelation is the key mechanism: averaging T trees each with variance σ² reduces ensemble variance to ρσ² + (1−ρ)σ²/T where ρ is pairwise tree correlation. As T→∞, ensemble variance → ρσ² — the irreducible floor is set by tree correlation, not tree count. Feature subsampling reduces ρ, which is why max_features is the most impactful hyperparameter. OOB (out-of-bag) samples — the ~36.8% of data not used in each tree's bootstrap — provide a free cross-validation estimate without additional computation.`,
    keyPoints: [
      `Bagging: each tree is trained on n samples drawn with replacement — each bootstrap uses ~63.2% unique samples; remaining ~36.8% are OOB and serve as a free validation set for that tree.`,
      `Feature subsampling: at each split, consider only m random features — m = √d for classification, d/3 for regression (sklearn defaults). This decorrelates trees beyond what bagging alone achieves. max_features is the hyperparameter with the most impact on the bias-variance tradeoff.`,
      `Variance reduction formula: ensemble variance = ρσ² + (1−ρ)σ²/T. As T→∞ this approaches ρσ², so the floor is determined by inter-tree correlation ρ, not tree count. Adding more trees past ~200 has diminishing returns, but reducing ρ (via smaller max_features) continues to help.`,
      `OOB error: for each sample, average predictions from trees that did NOT use it in training — approximates test error without a separate validation set. It is a free diagnostic and should always be checked (oob_score=True in sklearn).`,
      `Permutation importance: for each feature, shuffle its values in the OOB set and measure the drop in accuracy — unbiased and detects non-linear effects. More reliable than Gini importance for correlated features.`,
      `Gini importance is biased toward high-cardinality features: a feature with many unique values gets more split opportunities and thus accumulates more impurity-reduction credit. Never use Gini importance for feature selection; use permutation importance or SHAP.`,
      `Hyperparameter sensitivity: n_estimators (more is better, diminishing returns past ~200); max_features (tune — most impactful); min_samples_leaf (increase to prevent tiny leaves, reduces variance); max_depth (usually None — let trees grow fully; min_samples_leaf controls depth indirectly).`,
      `Random forests are embarrassingly parallel: each tree is independent. Set n_jobs=-1 in sklearn to use all cores with linear speedup — always do this on multi-core machines.`,
    ],
    checkQuestions: [
      {
        q: `A random forest with 500 trees takes too long to train. What do you tune first, and what accuracy tradeoff do you expect?`,
        a: `First: check n_jobs=-1 (parallelise across cores) — this is free and often gives 4-16× speedup with no accuracy loss. Second: reduce n_estimators to 100 — the OOB error curve is typically flat past ~100-200 trees; accuracy loss is usually <0.5%. Third: reduce max_features (fewer features evaluated per split — faster splits). Fourth: increase min_samples_leaf (stops growing leaves with few samples — shallower trees, faster). For very large datasets (n > 1M): set max_samples < 1.0 to subsample without replacement per tree. Always verify with the OOB error that the reduced model is within 1% of the full model.`
      },
      {
        q: `Your random forest's OOB error is 10% but test error is 25%. What does this mean?`,
        a: `Large OOB-test gap indicates distribution shift or data leakage. OOB error estimates performance on training distribution (same X distribution as training data). A 15% gap means the test data comes from a different distribution than training data — or there was data leakage that made OOB unrealistically optimistic. Investigate: (1) Compare feature distributions between train and test (histogram, KS-test). (2) Check for temporal leakage: if test data is future data and training data includes features computed from the future. (3) Check for target leakage: features that encode the label. OOB error is a reliable estimate only when train and test are iid draws from the same distribution.`
      },
      {
        q: `Two features both have high Gini importance in a random forest, but when you remove either one individually, model performance barely changes. Explain and fix.`,
        a: `The two features are highly correlated — they carry the same information. When both are present, the random forest splits on each when the other is unavailable (due to max_features subsampling), giving both high total impurity reduction. But each feature alone is sufficient. Gini importance double-counts correlated features. Fix: (1) Use permutation importance — shuffle each feature while keeping the other, measure accuracy drop. A redundant feature's permutation importance will be near zero when its correlated partner is present. (2) Use SHAP values, which correctly attribute importance in the presence of correlated features. (3) Remove one of the pair: measure OOB error with and without each; keep the one whose removal hurts more.`
      },
    ],
    takeaway: `The key insight is that random forests reduce variance by averaging many decorrelated trees, which means in practice max_features (controlling tree correlation) matters more than n_estimators (controlling how many trees you average).`,
  },
  {
    id: 'gradient_boosting',
    title: 'Gradient Boosting & XGBoost',
    subtitle: 'Residual fitting, shrinkage, XGBoost regularisation, early stopping',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['gradient boosting', 'XGBoost', 'LightGBM', 'ensemble'],
    summary: `Gradient boosting builds an additive model F(x) = Σₜ αₜhₜ(x) where each tree hₜ fits the negative gradient (pseudo-residuals) of the current ensemble's loss. Unlike random forests which reduce variance by averaging independent trees, boosting reduces bias by sequentially correcting the previous ensemble's errors. The learning rate η scales each tree's contribution, acting as a regulariser — smaller η with more trees gives better generalisation. XGBoost extends gradient boosting with second-order Taylor expansion of the loss, explicit regularisation on leaf weights and tree structure, and efficient approximate split-finding — making it the dominant algorithm for tabular ML competitions and production systems. Key failure mode: gradient boosting is prone to overfitting and requires careful tuning of learning rate, depth, and tree count.`,
    keyPoints: [
      `Algorithm: initialise F₀ = argmin_γ Σ L(yᵢ,γ); for t=1..T: compute pseudo-residuals rᵢ = −∂L/∂F(xᵢ)|_{F=F_{t-1}}; fit tree hₜ to {rᵢ}; update F_t = F_{t-1} + η·hₜ. Each tree is a gradient step in function space — gradient boosting is gradient descent on the prediction function itself.`,
      `For MSE loss: pseudo-residuals are actual residuals (yᵢ − F_{t-1}(xᵢ)) — each tree corrects what the previous ensemble got wrong. For log-loss: pseudo-residuals are (yᵢ − ŷᵢ) — same form as the logistic regression gradient. Gradient boosting generalises to any differentiable loss function.`,
      `Shrinkage (learning rate η < 1): scales each tree's contribution. Smaller η requires more trees but achieves better generalisation by preventing any single tree from dominating. η and n_estimators always trade off: halving η requires roughly doubling n_estimators.`,
      `Boosting trees should be shallow (depth 3-8): each tree fits residuals, not the full signal. Deep trees overfit the residuals. Boosting uses shallow "stumps" as weak learners while random forests grow full-depth trees.`,
      `XGBoost objective: Σ L(yᵢ,ŷᵢ) + Σₜ Ω(hₜ) where Ω(h) = γT + (λ/2)Σⱼ wⱼ² — penalises both number of leaves (γ) and leaf weight magnitude (λ). These regularisation terms directly control model complexity beyond depth and n_estimators.`,
      `XGBoost split finding: uses second-order Taylor expansion L(y,ŷ+f) ≈ L(y,ŷ) + g·f + (h/2)·f². The optimal leaf weight wⱼ* = −Gⱼ/(Hⱼ+λ) is available in closed form. The split gain formula prunes splits that do not improve the regularised objective by at least γ — XGBoost's regularisation is baked into the split criterion itself.`,
      `Early stopping: monitor validation loss; stop after k rounds with no improvement (early_stopping_rounds=50 typical). This is the most important technique for finding optimal n_estimators — use it rather than grid-searching n_estimators.`,
      `LightGBM vs XGBoost: LightGBM grows trees leaf-wise (deepest leaf first) rather than level-wise — faster for large datasets, sometimes better accuracy, but more prone to overfitting on small data. LightGBM is the default choice for datasets with n > 100K; XGBoost for smaller datasets.`,
    ],
    checkQuestions: [
      {
        q: `XGBoost is overfitting the training set. List 5 hyperparameters you would tune and the direction of each change.`,
        a: `(1) Lower learning_rate (0.3→0.05): more regularisation, slower learning — increase n_estimators to compensate and use early stopping. (2) Reduce max_depth (6→3): shallower trees have less capacity to overfit residuals. (3) Increase min_child_weight (1→10): prevents splits on small groups — the minimum sum of instance weight (Hessian) in a leaf. (4) Add subsample < 1.0 (0.8): stochastic gradient boosting — each tree uses only 80% of training samples, adding noise that regularises. (5) Add colsample_bytree < 1.0 (0.8): feature subsampling like random forests, decorrelates trees. Also: increase lambda (L2 on leaf weights) and gamma (minimum gain for a split).`
      },
      {
        q: `Explain why gradient boosting is "gradient descent in function space." What is the function being optimised, and what does each tree compute?`,
        a: `In parameter-space gradient descent, we update θ in the direction −∇_θ L(θ). In function-space boosting, the "parameter" is the prediction function F, and we update F in the direction that reduces loss most: F_t = F_{t-1} − η·∇_F L(F). The negative gradient ∂L/∂F(xᵢ) at each training point is the pseudo-residual — it tells us how much to change the prediction at xᵢ to reduce loss. Each tree hₜ approximates this gradient function by fitting a shallow tree to the pseudo-residuals. Adding η·hₜ to F is a gradient step in function space. This view explains why boosting works for any differentiable loss: the gradient is always a well-defined direction of improvement, regardless of whether the loss is MSE, log-loss, quantile, or custom.`
      },
      {
        q: `You train XGBoost with 1000 trees and learning_rate=0.1. The validation loss flattens at tree 200 and then starts increasing. What does this tell you and what should you do?`,
        a: `The model is overfitting after tree 200. The optimal n_estimators is ~200, not 1000. The additional 800 trees are memorising training noise. Action: (1) Set early_stopping_rounds=50 and retrain — XGBoost will stop automatically when validation loss does not improve for 50 consecutive rounds, giving the optimal tree count. (2) The optimal model has ~200 trees at learning_rate=0.1. To potentially improve further: lower learning_rate to 0.01 and increase n_estimators to 2000 (with early stopping), as lower LR often finds a better final solution. (3) Also check if overfitting starts earlier with different max_depth or subsample settings.`
      },
      {
        q: `For a regression problem, gradient boosting with MSE loss fits actual residuals at each step. For binary classification with log-loss, what does it fit, and why is the pseudo-residual form the same?`,
        a: `For log-loss: L = −[y log ŷ + (1−y) log(1−ŷ)] where ŷ = σ(F(x)). The pseudo-residual is −∂L/∂F = y − σ(F(x)) = y − ŷ. This is identical in form to the MSE case (y − ŷ) and to the logistic regression gradient. The reason: gradient boosting with log-loss fits the negative gradient of the log-likelihood at the current predictions — which is exactly the residual in the probability scale (y − P̂(y=1|x)). The form (y − ŷ) is universal because all losses from the exponential family have gradients in this form. Gradient boosting with log-loss is equivalent to running many weak logistic-regression-gradient steps, each implemented as a shallow tree.`
      },
    ],
    takeaway: `The key insight is that gradient boosting is gradient descent in function space where each tree is a gradient step, which means in practice tuning the learning rate and using early stopping are equivalent to setting the step size and stopping criterion in standard gradient descent.`,
  },
  {
    id: 'ensembles',
    title: 'Ensemble Methods',
    subtitle: 'Bagging vs boosting vs stacking, diversity principle',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['ensembles', 'stacking', 'bagging', 'boosting'],
    summary: `Ensemble methods combine multiple models to reduce overall prediction error beyond what any single model achieves. Bagging reduces variance by averaging high-variance, low-bias models trained on bootstrap samples. Boosting reduces bias by sequentially building models that focus on previous errors. Stacking (stacked generalisation) learns how to combine diverse base models using a meta-learner trained on out-of-fold predictions. The diversity principle is the core insight: ensemble gains are largest when constituent models make different errors — averaging models that make identical errors gives no improvement. In practice, ensembles provide 0.5-2% accuracy gains in competitions but come with significant maintenance costs in production (N models to serve, N×latency, complex versioning).`,
    keyPoints: [
      `Bagging: train T models on T bootstrap samples, aggregate by averaging (regression) or voting (classification) — reduces variance without increasing bias. Works best with high-variance base learners like deep trees; averaging low-variance models like linear regression gives minimal gain.`,
      `Boosting: sequential, weighted-residual fitting — reduces bias at the cost of increased variance risk. Each tree is a weak learner (high bias, low variance) that corrects the previous ensemble. The key risk is overfitting as more trees are added.`,
      `Stacking: train diverse base models on k-fold cross-validation, use those OOF predictions as features for a meta-learner. The meta-learner learns which base models to trust for which input regions. The OOF step is what prevents leakage from base model training data into the meta-learner.`,
      `Diversity principle: for an ensemble of T models each with error ε and pairwise error correlation ρ, ensemble error ≈ ε(1+(T-1)ρ)/T. The ensemble is best when ρ is minimised. Using different algorithms, different features, and different random seeds all reduce ρ.`,
      `OOF (out-of-fold) predictions for stacking: base models are trained on k-1 folds and predict on fold k. Meta-features are generated from held-out data. This is the critical step that prevents leakage from base models that have already seen the training labels.`,
      `Simple averaging vs. learned stacking: averaging base model predictions is often within 0.1% of full stacking and has zero risk of meta-learner overfitting. Always benchmark against simple averaging before investing in a meta-learner.`,
      `Production cost of ensembles: N models to maintain, deploy, monitor, and version — latency is N× a single model at inference time. Ensembles are almost always justified in competitions but require careful cost-benefit analysis before production deployment.`,
      `Snapshot ensembles for deep learning: save model checkpoints at different learning rate cycles, ensemble them at inference — free diversity (checkpoints are cheap), substantial accuracy gains. Cyclical learning rate schedules provide ensemble diversity at no extra training cost.`,
    ],
    checkQuestions: [
      {
        q: `Your stacking ensemble overfits: high training accuracy but low CV accuracy on the meta-learner. What is the likely cause and fix?`,
        a: `Data leakage in meta-features. If base models were trained on the full training set and their training-set predictions were used as meta-features, the meta-learner sees optimistically good predictions — base models have memorised the training labels, so their training-set outputs are near-perfect even for hard examples. The meta-learner learns to trust these over-optimistic signals and fails on validation data. Fix: generate meta-features using out-of-fold (OOF) predictions — each base model is trained on k-1 folds and predicts on the held-out fold k. These OOF predictions represent what the base models can genuinely generalise to, not what they memorised.`
      },
      {
        q: `You have three diverse models: a random forest (AUC=0.82), gradient boosting (AUC=0.85), and logistic regression (AUC=0.78). How would you build an ensemble, and what AUC would you expect?`,
        a: `Start with simple averaging of probability outputs: ensemble_score = (0.33×RF_prob + 0.33×GBM_prob + 0.33×LR_prob). Evaluate on a held-out set — simple averaging often achieves AUC 0.86-0.87, slightly above the best single model. Next try weighted averaging: weights proportional to individual AUCs, optimised on a validation set (e.g., 0.25×RF + 0.50×GBM + 0.25×LR). If that helps, try stacking with OOF predictions as meta-features and a ridge-regularised logistic regression as meta-learner. The gain comes from diversity: RF and GBM make different errors (RF uses random feature subsets, GBM does sequential residual fitting), so their errors partially cancel.`
      },
      {
        q: `Two models make identical errors on the test set: wherever model A is wrong, model B is wrong on the same examples. What is the ensemble's test accuracy, and what does this illustrate about diversity?`,
        a: `Ensemble accuracy = individual model accuracy — no improvement at all. The diversity principle: if models make identical errors (correlation ρ=1), averaging does nothing because the errors do not cancel. The ensemble error formula: ε_ensemble ≈ ε(1+(T-1)ρ)/T. With ρ=1 and T=2: ε_ensemble ≈ ε(1+1)/2 = ε. This is why using the same algorithm with different random seeds gives minimal gain (high ρ), while combining a neural network and a gradient boosted tree gives more gain (different inductive biases lead to different error patterns, lower ρ).`
      },
    ],
    takeaway: `The key insight is that ensemble gains come from diversity (models making different errors), not from the number of models, which means in practice you should combine models with genuinely different architectures or feature views rather than averaging many copies of the same model.`,
  },
  {
    id: 'svm',
    title: 'Support Vector Machines',
    subtitle: 'Maximum-margin hyperplane, kernel trick, soft margin',
    difficulty: 'advanced',
    estimatedMin: 30,
    tags: ['SVM', 'kernel', 'margin', 'dual'],
    summary: `SVMs look for the widest possible gap between classes — the maximum-margin hyperplane. The margin is 2/‖w‖, so maximising it is equivalent to minimising ‖w‖² subject to yᵢ(wᵀxᵢ+b) ≥ 1. Only the training points sitting right on the margin edges (the support vectors) determine where the boundary goes. Move any other training point and the decision boundary does not budge — the solution is sparse and robust to non-boundary examples. The kernel trick is the key generalisation: the dual formulation of SVM only requires dot products xᵢᵀxⱼ, which can be replaced by kernel function k(xᵢ,xⱼ) = φ(xᵢ)ᵀφ(xⱼ), enabling non-linear decision boundaries without computing the (potentially infinite-dimensional) feature mapping φ explicitly. SVMs have strong theoretical foundations and work well in high-dimensional spaces, but do not scale to large datasets and have been largely supplanted by gradient boosting and deep learning in practice.`,
    keyPoints: [
      `Hard-margin SVM: min ½‖w‖² s.t. yᵢ(wᵀxᵢ+b) ≥ 1 — only feasible when data is linearly separable. The dual involves dot products αᵢαⱼyᵢyⱼxᵢᵀxⱼ, and the kernel trick only works through this dual formulation.`,
      `Soft-margin SVM: introduces slack ξᵢ ≥ 0; min ½‖w‖² + C·Σξᵢ. Large C means penalise violations heavily (smaller margin, may overfit); small C means allow many violations (larger margin, more robust). C controls the bias-variance tradeoff analogously to 1/λ in Ridge regression.`,
      `Support vectors: training points with αᵢ > 0 (on or violating the margin) — the decision function depends only on these. SVMs are sparse in training data; only a fraction of points matter, unlike neural networks that use all data.`,
      `Kernel trick: replace xᵢᵀxⱼ with k(xᵢ,xⱼ) in the dual. RBF k(x,x') = exp(−γ‖x−x'‖²) corresponds to an infinite-dimensional feature space (universal approximator). With the right kernel, SVM can learn any decision boundary.`,
      `RBF kernel γ parameter: high γ means the kernel function drops off quickly with distance — tight, localised decision boundary that overfits. Low γ means wider influence and a smoother boundary that may underfit. γ and C are jointly tuned on a log scale.`,
      `Hinge loss: max(0, 1−yᵢf(xᵢ)) — the SVM objective with soft margin is hinge loss plus L2 regularisation. SVM and regularised logistic regression minimise different but related losses and often give similar accuracy in practice.`,
      `Practical scaling: SVMs do not scale to large datasets — O(n²) memory for the kernel matrix, O(n²-n³) training time. For n > 100K use linear SVM (liblinear) or SGD with hinge loss (sklearn's SGDClassifier) instead of kernel SVM.`,
      `SVM requires feature scaling: RBF kernel uses Euclidean distances, so unscaled features with different ranges make the kernel meaningless. Always StandardScaler before SVM — more critical here than for most other algorithms.`,
    ],
    checkQuestions: [
      {
        q: `Your SVM with RBF kernel underfits the training data. What do you adjust, and what is the risk of each change?`,
        a: `Underfitting means the margin is too wide and the decision boundary is too smooth. Adjustments: (1) Increase C (allow fewer margin violations — tighter fit to training data). Risk: overfitting — the boundary becomes wiggly and does not generalise. (2) Increase γ (tighter, more localised RBF kernel — each support vector influences a smaller region). Risk: overfitting — at high γ, the model memorises training data with tiny "bubbles" around each point. Grid search over (C, γ) on log scale: C ∈ {0.01, 0.1, 1, 10, 100}, γ ∈ {0.001, 0.01, 0.1, 1, 10}. In practice: try the default C=1, gamma='scale' first — often competitive with tuned values.`
      },
      {
        q: `Explain the kernel trick. Why does it work, and what mathematical condition must a function k(x,x') satisfy to be a valid kernel?`,
        a: `The kernel trick works because the SVM dual objective only requires pairwise dot products xᵢᵀxⱼ — it never explicitly uses the feature vectors. By Mercer's theorem, any function k(x,x') = φ(x)ᵀφ(x') for some (possibly infinite-dimensional) φ can be substituted for these dot products. The condition: k must be a symmetric positive semi-definite function (the Gram matrix K where Kᵢⱼ = k(xᵢ,xⱼ) must be PSD for all datasets). This guarantees k corresponds to a valid dot product in some feature space. The magic: we get the computational benefit of working in a high-dimensional space (rich features) without the computational cost of computing φ(x) (which may be infinite-dimensional). The kernel matrix K is n×n regardless of the dimensionality of φ.`
      },
      {
        q: `SVMs and logistic regression both find a linear separator. In what situations would you prefer one over the other?`,
        a: `Prefer SVM when: (1) The dataset is small (n < 10K) and high-dimensional — SVMs have better theoretical guarantees (margin maximisation) in this regime. (2) The classes are well-separated — hard-margin or small-slack SVM exploits this. (3) You need a kernel for non-linear boundaries and cannot engineer features. Prefer logistic regression when: (1) You need calibrated probability outputs — SVM outputs distances, not probabilities (Platt scaling fixes this but adds complexity). (2) Large datasets (n > 100K) — LR scales linearly in n, SVM does not. (3) Interpretability matters — LR coefficients are log-odds ratios; SVM weights have less direct interpretation. (4) You want a fast baseline — LR trains in seconds.`
      },
    ],
    takeaway: `The key insight is that SVMs find the maximum-margin separator using only the support vectors, which means in practice the kernel trick lets you learn non-linear boundaries without ever computing high-dimensional features — but SVMs do not scale to large datasets and gradient boosting is usually preferred.`,
  },
  {
    id: 'knn',
    title: 'K-Nearest Neighbours',
    subtitle: 'Distance metrics, curse of dimensionality, ANN indexes',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['KNN', 'distance metrics', 'ANN'],
    summary: `KNN classifies a new point by majority vote among its k nearest training points using a distance metric. KNN is a non-parametric, lazy learner — it stores all training data and does no computation during training; all computation happens at inference time. Decision time is O(nd) per query for brute force. KNN makes no assumptions about the data distribution (non-parametric) and naturally adapts to complex decision boundaries. However, KNN performance degrades severely in high dimensions due to the curse of dimensionality: as d grows, all distances converge to the same value and the nearest neighbour is nearly as far as the farthest. For large-scale nearest-neighbour search, approximate nearest neighbour (ANN) indexes (FAISS, HNSW) trade small accuracy loss for orders-of-magnitude speedup.`,
    keyPoints: [
      `Distance metrics: Euclidean ‖x−x'‖₂ (isotropic, scale-sensitive); Manhattan ‖x−x'‖₁ (robust to outliers, preferred for high-d); Cosine similarity (scale-invariant, preferred for text/embeddings). The choice of metric is a prior about which differences matter.`,
      `Bias-variance tradeoff in k: k=1 gives zero training error (every point is its own nearest neighbour) but maximum variance. Large k gives smoother, higher-bias boundaries. k is the regularisation hyperparameter for KNN and should be tuned via CV.`,
      `Curse of dimensionality: in d dimensions, the ratio (distance to nearest neighbour)/(distance to farthest neighbour) → 1 as d→∞. All points become approximately equidistant and the "neighbourhood" concept loses meaning. KNN degrades gracefully up to ~d=20, then rapidly.`,
      `Curse intuition: the fraction of volume within distance ε of a point in d dimensions shrinks as εᵈ. To maintain the same fraction of data in the neighbourhood, ε must grow exponentially with d. With fixed n, KNN neighbourhoods span the entire space in high dimensions.`,
      `Weighted KNN: weight votes by 1/distance so closer neighbours matter more. This reduces sensitivity to the choice of k and is almost always preferable to uniform voting — make it the default.`,
      `ANN indexes: FAISS (GPU-accelerated, used in production search systems), HNSW (graph-based, excellent recall-speed tradeoff), ScaNN (Google) — reduce query time from O(nd) to O(log n) or sublinear at the cost of <1% recall loss. ANN is the only viable approach for n > 1M.`,
      `KNN on learned embeddings: raw features often mislead distance. KNN on embeddings from contrastive learning or fine-tuned transformers is powerful for few-shot classification, semantic search, and recommendation. The feature space matters more than k.`,
      `KNN for imputation: replace missing value with weighted average of k nearest complete neighbours — simple and often competitive with more complex imputation. It is the fastest non-trivial imputation strategy to implement.`,
    ],
    checkQuestions: [
      {
        q: `Why does KNN fail in 1000 dimensions even with millions of training points?`,
        a: `Curse of dimensionality: in d=1000 dimensions, the distance from a query point to its nearest neighbour converges to nearly the same value as the distance to its farthest neighbour. The distribution of pairwise distances becomes concentrated — the coefficient of variation of distances shrinks to 0 as d grows. The k nearest neighbours are no longer geometrically "local" to the query point — they are nearly as far as random points. The local averaging that makes KNN work (nearby points have similar labels) breaks down when "nearby" means "within 1000 dimensions of noise." Fix: dimensionality reduction (PCA, UMAP) or learned metric/embedding before applying KNN.`
      },
      {
        q: `A production recommendation system uses KNN with n=50M items and d=256-dimensional embeddings. Brute-force KNN is too slow. What is your architecture?`,
        a: `Use an ANN index. Process: (1) Offline: build an HNSW index or FAISS IVF index on the 50M item embeddings. HNSW is preferred for high-recall requirements; FAISS IVF is preferred for memory-constrained systems. (2) Online: for each user query embedding, query the index for the top-k approximate nearest neighbours (e.g., top-100 candidates). (3) Re-rank: apply a more expensive scoring function (dot product, learned ranker) to the top-100 candidates. This is the retrieve-and-rerank pattern. Performance: HNSW achieves >95% recall@10 with queries in ~1ms for 50M items — vs. ~10s for brute force. Tradeoff: index takes O(n·d) memory plus graph structure overhead.`
      },
      {
        q: `When would you choose KNN over a trained classifier like logistic regression or a decision tree?`,
        a: `Choose KNN when: (1) The decision boundary is highly non-linear and irregular — KNN adapts to any boundary shape without feature engineering. (2) The training set is very small and the feature space is low-dimensional (d < 20) — KNN with k=5 often outperforms logistic regression that has too few samples to estimate coefficients reliably. (3) You need online learning — adding a new training point to KNN requires no retraining, just appending to the index. (4) Instance-based explanations matter — "your prediction is X because your nearest neighbours are A, B, C" is intuitive. Prefer logistic regression or trees when: large n (KNN inference is O(nd)); high d; need probability outputs; training time is not a constraint.`
      },
    ],
    takeaway: `The key insight is that KNN assumes that nearby points in feature space have similar labels, which means in practice the quality of the distance metric (or embedding space) matters far more than the choice of k.`,
  },
  {
    id: 'naive_bayes',
    title: 'Naïve Bayes',
    subtitle: 'Independence assumption, Gaussian NB, Laplace smoothing',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['Naive Bayes', 'independence', 'text classification'],
    summary: `Naïve Bayes classifiers apply Bayes' theorem with the "naïve" assumption that all features are conditionally independent given the class: P(x|y) = Π P(xⱼ|y). This assumption is almost always false in practice — word occurrences in text are correlated, sensor readings are correlated — but the classifier is surprisingly robust to it because classification only requires the correct ranking of P(y|x), not accurate probability estimates. The classifier is extremely fast (O(nd) training, O(d) prediction), works well with small data, handles high-dimensional inputs naturally, and is particularly effective for text classification where features (words) are numerous and sparse. The zero-frequency problem (unseen features zeroing out the posterior) requires Laplace smoothing. Despite its "naïve" name, it outperforms logistic regression on many text classification benchmarks when training data is scarce.`,
    keyPoints: [
      `Prediction: ŷ = argmax_k P(y=k) Π_j P(xⱼ|y=k). Always use log-probabilities: argmax_k [log P(y=k) + Σⱼ log P(xⱼ|y=k)]. Multiplying tiny probabilities directly causes numerical underflow.`,
      `Gaussian NB: P(xⱼ|y=k) = N(μⱼₖ, σⱼₖ²) — fits per-class mean and variance for continuous features. Training is just computing class-conditional means and variances, completing in a single pass over the data.`,
      `Multinomial NB: P(xⱼ|y=k) ∝ count of feature j in class k — the correct variant for text classification where features are word counts or frequencies. Gaussian NB is for continuous data, not documents.`,
      `Laplace smoothing: add α=1 to all counts — P(word|class) = (count+1)/(N_class+|V|). This prevents zero probabilities from zeroing out the entire product. It acts as a Dirichlet prior and is essential for any vocabulary with unseen words at test time.`,
      `Why naïve NB works despite violated independence: classification requires only that P(y=k|x) is ranked correctly, not that the absolute probabilities are accurate. Even when the joint distribution is badly modelled, the relative ordering of class posteriors is often correct.`,
      `Posterior miscalibration: NB probability outputs are poorly calibrated, often pushed toward 0 and 1. An output of ŷ = 0.99 from NB should not be interpreted as "99% confidence" — use Platt scaling to recalibrate if calibrated probabilities are needed.`,
      `NB advantages: O(nd) training, O(d) prediction, handles missing features by omitting the corresponding term, works with very little data, and is highly interpretable (inspect P(word|class) to understand classification rules).`,
      `Complement NB: for text, model P(x|y≠k) and predict the class with minimum complement score — corrects for class imbalance and often outperforms standard Multinomial NB on imbalanced text datasets.`,
    ],
    checkQuestions: [
      {
        q: `In Multinomial NB for spam detection, a test email contains the word "win" which appears in 0% of spam emails in training. Without Laplace smoothing, what happens?`,
        a: `P("win"|spam) = 0. Since NB multiplies all feature probabilities, the entire product P(x|spam) = 0, regardless of all other words in the email. The spam posterior P(spam|x) = 0. The email will never be classified as spam, even if every other word strongly indicates spam. This is the zero-frequency problem. Laplace smoothing adds α=1 to all word counts: P("win"|spam) = (0+1)/(N_spam + |V|) where |V| is vocabulary size — small but non-zero, preserving the contribution of all other features and allowing the model to classify correctly based on the other words.`
      },
      {
        q: `Why does Naïve Bayes often outperform logistic regression on text classification when training data is small?`,
        a: `NB estimates P(x|y) from per-class word frequencies — a generative model with very few parameters (one mean per word per class). This estimation is stable even with small n because it is just counting. Logistic regression estimates P(y|x) discriminatively — it needs to learn a weight for every word, requiring much more data to avoid overfitting in a high-dimensional space. With n=100 training documents and |V|=10,000 vocabulary, LR has 10,000 parameters and will overfit without strong regularisation, while NB has well-estimated word probabilities from the counts. As n grows, LR catches up and eventually surpasses NB because its discriminative objective is more directly aligned with the classification goal.`
      },
      {
        q: `Your Naïve Bayes classifier outputs P(spam)=0.99 for an email. How confident should you be, and what would you do if calibrated probabilities are required?`,
        a: `Very cautious: NB posteriors are poorly calibrated — the independence assumption makes P(y|x) converge toward 0 and 1 faster than the true probabilities. A NB output of 0.99 does not mean 99% of similarly-scored emails are spam. To get calibrated probabilities: (1) Apply Platt scaling — fit a logistic regression a·f+b on the NB log-odds f = log(P(spam)/P(ham)) using a held-out calibration set. (2) Apply isotonic regression if you have enough calibration data (>1000 samples) and suspect non-monotone miscalibration. After calibration, validate on a separate test set using a reliability diagram and ECE.`
      },
    ],
    takeaway: `The key insight is that Naïve Bayes works despite violated conditional independence because classification only requires the correct ranking of class posteriors, not accurate probability values, which means in practice it is the fastest and most interpretable classifier to use as a baseline for text and high-dimensional sparse data.`,
  },
  {
    id: 'calibration',
    title: 'Model Calibration',
    subtitle: 'Reliability diagrams, ECE, Platt scaling, isotonic regression',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['calibration', 'ECE', 'Platt scaling', 'reliability'],
    summary: `A model is well-calibrated if its predicted probability p̂ matches the empirical frequency of the positive class: among all samples where the model predicts probability p̂ = 0.7, approximately 70% should actually be positive. Miscalibration is the rule, not the exception: tree-based models tend to be overconfident (probabilities cluster near 0 and 1), while SVMs and Naive Bayes also produce miscalibrated outputs. Calibration matters whenever model outputs are used as actual probabilities — risk scoring, stacking (miscalibrated base models mislead the meta-learner), decision threshold tuning, and medical applications. Platt scaling and isotonic regression are the two standard post-hoc calibration methods; temperature scaling is the deep learning variant. All require a separate calibration set distinct from both training and test sets.`,
    keyPoints: [
      `Reliability diagram (calibration curve): bin predictions into M buckets; for each bin, plot mean predicted probability vs. fraction of positive samples. Perfect calibration is the diagonal line y=x. Systematic deviations (S-shape, J-shape) reveal the miscalibration pattern.`,
      `ECE (Expected Calibration Error): weighted average of |accuracy_b − confidence_b| across bins, weights = bin size — scalar summary, lower is better. MCE (Maximum Calibration Error) measures worst-bin deviation. ECE is the standard metric; MCE matters when worst-case reliability is critical.`,
      `Overconfidence: tree-based models and unconstrained neural networks push probabilities toward 0 and 1 — the histogram of predicted probabilities is bimodal. Random forests typically need calibration before use in probability-sensitive applications.`,
      `Platt scaling: fit logistic regression σ(af+b) on validation set where f is the model's raw output — simple (2 parameters), fast, appropriate when miscalibration is monotone (sigmoid-shaped calibration curve). It is the first thing to try.`,
      `Isotonic regression: fits a non-decreasing step function to (score, label) pairs on the calibration set — more flexible than Platt, appropriate for non-monotone miscalibration, but needs more data (minimum ~1000 calibration samples to avoid overfitting). Use Platt when data is scarce.`,
      `Temperature scaling for neural networks: divide logits by scalar T before softmax — T>1 softens the distribution (reduces overconfidence). Only one parameter is fitted on the validation set, and it is remarkably effective. This is the standard calibration method for neural networks post-training.`,
      `Calibration vs. discrimination: a model can be well-calibrated but have poor AUC, or have excellent AUC but poor calibration — they measure different things. You need both a discrimination metric (AUC) and a calibration metric (ECE) to fully evaluate a probabilistic model.`,
      `Calibration set must be separate from training AND test sets: fitting a calibrator on the test set overestimates calibration quality; using the training set leads to a degenerate calibrator that just memorises training outputs.`,
    ],
    checkQuestions: [
      {
        q: `A Random Forest predicts P(y=1) = 0.9 for many samples, but only 60% of those samples are actually positive. What calibration technique would you apply and how?`,
        a: `The model is overconfident — predictions near 0.9 correspond to actual frequency of 0.6. Apply isotonic regression or Platt scaling on a held-out calibration set (not the training set). Isotonic regression is preferred here if the calibration set has > 1000 samples, because the miscalibration may be non-monotone across the full probability range. Steps: (1) Hold out a calibration set during training. (2) Obtain raw model scores on the calibration set. (3) Fit isotonic regression mapping scores to labels. (4) At test time, pass raw scores through the isotonic regressor to get calibrated probabilities. Validate on a separate test set — never on the calibration set used to fit the calibrator.`
      },
      {
        q: `Your neural network is overconfident (ECE = 0.15). You apply temperature scaling and get ECE = 0.03. The temperature T chosen is 2.5. What does T=2.5 mean mechanically?`,
        a: `Temperature scaling divides the logit vector z by T before softmax: P(y=k|x) = softmax(z/T)_k. T=2.5 > 1 means the logit vector is scaled down by a factor of 2.5 — the differences between classes are reduced, making the softmax distribution flatter (less confident). Before scaling: if the top logit is 5.0 and second is 2.0 (difference 3.0), the network is very confident. After scaling by 2.5: the logits become 2.0 and 0.8 (difference 1.2), softmax gives a less extreme distribution. Mechanically, T scales the confidence of every prediction uniformly — it is a single parameter that can correct systematic overconfidence without changing the model's ranking (AUC is preserved).`
      },
      {
        q: `You have a stacking ensemble where a miscalibrated base model is one of the inputs to the meta-learner. Why is calibration critical here, and what happens if you do not calibrate?`,
        a: `The meta-learner uses base model probability outputs as features. If a base model is overconfident (outputs 0.95 when the true probability is 0.65), the meta-learner receives a feature value of 0.95 for what is actually a moderate-confidence example. The meta-learner tries to learn the relationship between these features and the true label — but miscalibrated features have a different scale than calibrated ones, making the meta-learner's job harder. In the worst case: the meta-learner trusts the overconfident model too much (the feature 0.95 looks like a strong signal) and under-weights the other base models. After calibration, all base models' outputs are on the same probability scale, and the meta-learner can correctly learn their relative reliability.`
      },
    ],
    takeaway: `The key insight is that a model's AUC and its calibration are independent properties, which means in practice any time you use predicted probabilities to make decisions (not just rankings) you must verify calibration with a reliability diagram and apply Platt scaling or temperature scaling if needed.`,
  },
  {
    id: 'class_imbalance',
    title: 'Class Imbalance',
    subtitle: 'SMOTE, threshold tuning, class weights, precision@K',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['imbalance', 'SMOTE', 'precision@K', 'threshold'],
    summary: `Class imbalance occurs when one class is far more frequent than others — for example, 99:1 fraud vs. non-fraud. A classifier trained to minimise accuracy on a 99:1 dataset achieves 99% accuracy by always predicting the majority class, which is useless. The root problem is not the imbalance itself but that standard training procedures and evaluation metrics assume equal class costs. Solutions fall into three categories: algorithmic (class weights, cost-sensitive learning), data-level (SMOTE oversampling, random undersampling), and post-processing (threshold tuning, Precision@K). In practice, class weights are the most effective and least disruptive first intervention; SMOTE often helps for simpler models but can hurt tree-based models; threshold tuning is always necessary at deployment regardless of training procedure.`,
    keyPoints: [
      `Never use accuracy for imbalanced problems — a 99% accurate model on 1% positive rate predicts negative always. Use precision, recall, F1, AUC-ROC, PR-AUC, or business-specific cost metrics. The evaluation metric choice is as important as the model choice.`,
      `Class weights: set class_weight ∝ 1/frequency — sklearn's class_weight="balanced" computes wₖ = n/(K·nₖ). This reweights the loss function without modifying the data. It is the cheapest and least risky intervention to try first.`,
      `SMOTE: for each minority sample, generate synthetic samples along line segments to k nearest minority neighbours — avoids pure duplication. The failure mode is creating synthetic samples in regions overlapping with the majority class.`,
      `Undersampling: randomly remove majority class samples — faster training, preserves class boundary information. Tomek links removes majority samples that are the nearest neighbour of minority samples (cleaning the boundary). Combining SMOTE with Tomek link removal (SMOTEENN) is often better than either alone.`,
      `Threshold tuning: the default threshold 0.5 assumes equal costs. Lower threshold increases recall at the cost of precision; set threshold to optimise the business metric (e.g., F_β with β>1 for recall-heavy problems). Threshold tuning is always required at deployment because the cost ratio of false positives to false negatives is problem-specific.`,
      `Precision@K: among the top-K highest-confidence positive predictions, what fraction are correct — relevant when you act on a fixed budget (K fraud alerts per day, K highest-risk patients). Often the most business-aligned metric for imbalanced problems.`,
      `PR-AUC vs ROC-AUC: for very imbalanced data, PR-AUC is more informative. ROC-AUC can be high (0.99) even when Precision@K is terrible, because ROC-AUC is dominated by the many true negatives. Always check PR-AUC alongside ROC-AUC for imbalanced problems.`,
      `SMOTE with tree-based models: trees handle imbalance natively with class weights (the split criterion directly weights class frequencies). SMOTE sometimes hurts trees by adding noise in regions where the tree would otherwise split cleanly. Use class weights for trees and SMOTE primarily for neural networks and SVMs.`,
    ],
    checkQuestions: [
      {
        q: `You build a fraud detector with 0.1% fraud rate. Your model achieves 99.5% AUC-ROC but the ops team says too many false positives. What do you change?`,
        a: `High AUC-ROC but too many false positives = threshold is too low for the cost structure. The model's ranking is good (AUC 0.99+) but the default threshold of 0.5 is not calibrated to the 1000:1 cost ratio. Actions: (1) Compute PR curve — find threshold achieving the precision the ops team needs (e.g., 50% precision means 1 in 2 alerts is real fraud). (2) Frame as Precision@K — if ops reviews K=100 alerts/day, tune threshold to maximise precision of top-100 predictions. (3) Check PR-AUC — if it is also high, your model is genuinely good and you just need threshold calibration. If PR-AUC is low, the model needs improvement in the high-precision region.`
      },
      {
        q: `Your dataset has 1000 positive and 100,000 negative samples. You apply SMOTE to balance it to 50,000:100,000 and train a logistic regression. The test PR-AUC is lower than with class weights. Why?`,
        a: `SMOTE with logistic regression often hurts for several reasons: (1) SMOTE generates synthetic minority samples by interpolating between existing minority samples in feature space. For logistic regression (a linear model), the minority region may not be linearly separable from the majority — synthetic points in this region reinforce an incorrect linear boundary. (2) Class weights achieve the same reweighting effect as SMOTE for logistic regression but without adding noise. (3) SMOTE's interpolation can place synthetic points in the majority region, creating noisy examples that confuse the model. Class weights are the correct intervention for logistic regression on imbalanced data.`
      },
      {
        q: `You have a binary classifier for cancer screening. False negatives (missing cancer) are 10× more costly than false positives (unnecessary follow-up). How do you incorporate this into training and evaluation?`,
        a: `Training: set class_weight = {0: 1, 1: 10} — the loss for misclassifying a positive (cancer) sample is 10× the loss for misclassifying a negative. This shifts the decision boundary toward higher recall. Threshold: at deployment, tune the threshold on a calibration set to achieve the cost-optimal tradeoff: expected cost = FP_rate × 1 + FN_rate × 10. Find threshold minimising this. Evaluation: use F_β with β=√10 ≈ 3.16 (F_β weighs recall β times more than precision); also report Precision, Recall, and the cost metric directly. Never report only accuracy — it hides the critical false-negative rate.`
      },
    ],
    takeaway: `The key insight is that class imbalance is a cost asymmetry problem, not a data quantity problem, which means in practice the most important intervention is threshold tuning at deployment to match the actual cost ratio of false positives to false negatives for your specific use case.`,
  },
  {
    id: 'feature_selection',
    title: 'Feature Selection & Dimensionality',
    subtitle: 'Filter/wrapper/embedded, mutual information, RFE, SHAP',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['feature selection', 'mutual information', 'SHAP', 'RFE'],
    summary: `Feature selection reduces dimensionality by removing irrelevant or redundant features, improving generalisation, reducing training time, and aiding interpretability. Methods fall into three families: filter (rank features independently of the model using statistical tests — fast but misses interactions), wrapper (search feature subsets using model performance as the objective — captures interactions but is expensive), and embedded (selection happens as part of model training — L1 regularisation, tree importance). The failure mode of feature selection is selection bias: using label information from the test set during selection inflates apparent performance. The modern approach for production systems is SHAP-based selection from an initial gradient boosting model: train once, get reliable importance scores that account for feature interactions, then select the top-k.`,
    keyPoints: [
      `Filter methods: evaluate features independently of the model. Mutual information I(X;y) is most general (captures non-linear dependencies); ANOVA F-test handles linear relationships with continuous targets; chi-squared handles categorical targets and features. Filter methods are fast but miss multivariate interactions.`,
      `Variance threshold: remove features with near-zero variance — they cannot be predictive regardless of the model. Constant features (var=0) are always removed first. This is the cheapest first pass and should always precede any other selection method.`,
      `Mutual information I(X;y) is the theoretically correct filter criterion for non-linear dependencies, but its estimation from finite samples is noisy — use k-NN estimators (sklearn's mutual_info_classif) rather than binning for accurate estimation.`,
      `Wrapper methods: RFE (Recursive Feature Elimination) trains model, removes lowest-importance feature, repeats — captures feature interactions at the cost of O(d) model fits. RFE is practical for small d (<100) but infeasible for d=10,000.`,
      `Embedded methods: L1 regularisation drives irrelevant feature weights to zero during training; tree Gini importance; SHAP feature importance post-hoc — these account for feature interactions and are the most reliable methods for modern gradient boosting and neural networks.`,
      `Feature selection bias: if you use the full dataset (including test labels) to select features, the selected features appear predictive but this is artefactual. Feature selection must happen inside cross-validation folds, not before splitting.`,
      `SHAP-based selection: train one gradient boosting model on all features, compute mean |SHAP value| per feature, select top-k. SHAP values account for interactions correctly (unlike Gini importance). This is the most reliable selection approach for tabular data.`,
      `Collinearity removal: if two features have |corr| > 0.95, they are nearly redundant. Keep the one with higher mutual information with the target and remove the other. Correlated feature pairs inflate apparent feature count without adding predictive power.`,
    ],
    checkQuestions: [
      {
        q: `You have 500 features and want to reduce to ~50 before tuning a Random Forest. What is your step-by-step approach?`,
        a: `Step 1: remove constant and near-zero variance features (VarianceThreshold in sklearn — fast, no label needed). Step 2: remove highly correlated pairs (|corr|>0.95) — keep the one with higher MI with target. Step 3: train an initial Random Forest with all remaining features, compute permutation importance (or SHAP) on a validation fold. Select top-50 by importance. Step 4: verify that the 50-feature model achieves similar OOB or CV performance to the full-feature model (within 0.5%). Step 5: if performance drops, iterate with top-75 or top-100. Avoid pure filter methods (they miss interactions); embedded methods (permutation importance, SHAP) are preferred for RF because they account for feature interactions.`
      },
      {
        q: `A colleague selects the top-20 features using mutual information with the target label, then performs 5-fold CV to evaluate the model. What is wrong with this procedure?`,
        a: `Feature selection bias: mutual information was computed on the full dataset (including what becomes the test fold). The selected features were chosen because they happen to correlate with the label in all 5 folds — including the test fold. This inflates apparent performance because the features were selected using test-set label information. Correct procedure: feature selection must be nested inside the CV loop. For each fold: (1) train MI on the k-1 training folds only; (2) select top-20 features using that MI; (3) train model on training folds with those 20 features; (4) evaluate on the held-out test fold. This gives an unbiased estimate of both the selection procedure and the model.`
      },
      {
        q: `You select 20 features with Gini importance from a Random Forest and find that removing any single selected feature barely changes test performance. What does this suggest?`,
        a: `Two likely explanations: (1) Many of the 20 features are correlated — the information they collectively provide is redundant, and any individual feature can be replaced by a correlated substitute. Gini importance distributes credit among correlated features, making each look moderately important. True importance only appears when all correlated partners are removed simultaneously. (2) The model is robust to feature removal and individual features contribute marginally. Fix: (1) Use permutation importance or SHAP instead of Gini. (2) Try sequential ablation: remove subsets of correlated features together and measure the group's collective importance. (3) Check feature correlations among the 20 selected features — groups with |corr|>0.8 are likely providing redundant information.`
      },
    ],
    takeaway: `The key insight is that feature selection must happen inside the cross-validation loop to avoid selection bias, which means in practice the simplest reliable approach is to train one gradient boosting model on all features and use SHAP or permutation importance to identify the top-k.`,
  },
]
