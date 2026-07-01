export const CLASSICAL_ML_MODULES = [
  {
    id: 'linear_regression',
    interactiveId: 'linear_regression_viz',
    title: 'Linear Regression from First Principles',
    subtitle: 'OLS, normal equation, geometric interpretation, assumptions',
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['regression', 'OLS', 'linear models'],
    summary: `You have three features — square footage, number of bedrooms, and neighborhood score — and you need to predict house prices. Someone hands you last month\`s sales. What do you do?

The instinct is to draw a line through the data and measure how far off each prediction is. Squaring those errors penalises big misses more than small ones and keeps everything differentiable, so you can find the best line by calculus rather than trial and error. Set the gradient of the squared error to zero and you get a single formula for the best possible weights: $θ̂ = (XᵀX)⁻¹Xᵀy$. That formula is the entire engine of ordinary least squares.

Now add a wrinkle: square footage and number of bedrooms move together. When one goes up, the other usually does too. The matrix $XᵀX$ starts to lose rank — one direction in the data nearly duplicates another — and its inverse becomes unstable. A tiny change in one sale\`s price can flip the sign of both coefficients simultaneously, even though the predictions themselves barely change. This is collinearity, and it is the most misunderstood failure mode in regression. The coefficients become meaningless; the predictions survive.

Ridge fixes this with a single move: add $λI$ to the diagonal before inverting. This pushes all eigenvalues above $λ$, stabilising the inversion regardless of how correlated the features are. The price is a small amount of bias — the weights are pulled slightly toward zero — but for any $λ > 0$ you get a finite, stable solution.

**NOT this.** Most people think "high R² means the model is good." Here is a counterexample you can run right now: fit a linear regression on data that follows a U-shape. You can get R² = 0.95 while your residual plot shows a clear curve — low in the middle, high at the extremes. R² measures how much variance is explained. It says nothing about whether the functional form is right. A systematic residual pattern with R² = 0.95 means the model is badly misspecified and every standard error is wrong.

The formal statement: OLS is the Best Linear Unbiased Estimator (BLUE) when errors have zero mean, constant variance, and are uncorrelated. That last part — constant variance — is what the residual-vs-fitted plot checks. Violate it and OLS coefficients stay unbiased but all your confidence intervals are garbage. R² will not tell you. Only the residuals will.

Plot them before you trust anything.`,
    keyPoints: [
      `**Use it when the relationship is plausibly linear and you need interpretable coefficients or fast inference.**\n\nLinear regression is the right first model for continuous targets with moderate feature counts. Use it when domain knowledge suggests additive effects (e.g., each extra bedroom adds a roughly fixed price increment). Red flags for switching: clear non-linearity in residual plots, interaction terms that matter, or a target with a natural floor/ceiling. At d > 10,000 features, switch from the normal equation to gradient descent or a ridge solver — direct inversion of XᵀX costs O(d³) and breaks numerically before that.`,
      `**The production trap: correlated features make individual coefficients unstable while predictions stay accurate — and you will not notice unless you check.**\n\nIf square footage and total rooms have correlation 0.95, OLS splits their shared predictive power arbitrarily. A different training sample gives completely different splits. The coefficients lose meaning, but the sum $w_1 \\cdot sqft + w_2 \\cdot rooms$ stays roughly constant — predictions look fine. This is why removing a feature with a "near-zero" OLS coefficient can destroy your model when that feature is correlated with another. Fix: add Ridge ($λ > 0$) before trusting any coefficient ranking.`,
      `**The diagnostic: plot residuals vs. fitted values before reporting anything.**\n\nA horizontal band of roughly equal scatter = model is correctly specified. A U-shape or funnel = misspecification or heteroscedasticity. A systematic curve with R² = 0.95 is worse than a noisy scatter with R² = 0.60 — it means you are confidently wrong about the functional form. Secondary check: QQ-plot of residuals for the Gaussian assumption. If heavy tails appear, switch to a robust loss (Huber or LAD) or acknowledge that your confidence intervals are invalid.`,
    ],
    interactivePrompt: `Before you touch the controls: if you add a feature that is perfectly correlated with an existing one, do you expect the model\`s predictions to get worse, stay the same, or get better?`,
    checkQuestions: [
      {
        q: `Why is it problematic to invert XᵀX numerically, and what is the preferred computational approach?`,
        options: [
          `\`A) XᵀX is always rank-deficient when features outnumber samples, so inversion is undefined; the fix is to add a Ridge penalty λI before inverting, which is what sklearn does by default.\``,
          `\`B) XᵀX requires O(n³) memory to form, making it infeasible for large n; gradient descent avoids forming it entirely and scales to arbitrary dataset sizes.\``,
          `\`C) Forming XᵀX squares the condition number: if cond(X)=κ, then cond(XᵀX)=κ². For κ=10⁶ (not unusual in real data), cond(XᵀX)=10¹² — near the limit of double precision (~10¹⁶), meaning 4 significant digits are lost. The preferred approach: QR decomposition X=QR gives θ̂=R⁻¹Qᵀy, working with κ(X) directly. For very large systems: SVD-based pseudoinverse (sklearn default) or iterative solvers (conjugate gradient). sklearn's LinearRegression uses SVD and never fails due to exact multicollinearity — it computes the minimum-norm solution automatically.\``,
          `\`D) Inverting XᵀX requires it to be symmetric positive definite; when features are correlated, symmetry is broken and the inverse does not exist. QR decomposition restores symmetry before inversion.\``,
        ],
        answer: `C`,
      },
      {
        q: `Your linear regression model has R²=0.95 but the residuals show a clear U-shape when plotted against fitted values. What does this mean?`,
        options: [
          `\`A) A U-shaped residual pattern signals systematic non-linearity — the model is consistently underpredicting at low and high fitted values, and overpredicting in the middle. This violates the linearity assumption, meaning the model is misspecified. High R² does not validate the model — R² measures how much variance is explained but not whether the functional form is correct. Remedies: (1) Add polynomial terms (x², x³) or spline basis. (2) Apply a non-linear transformation to the response (log(y) for count/skewed data). (3) Use a non-parametric model (GAM, tree-based). Recheck residuals after each modification.\``,
          `\`B) A U-shaped residual pattern indicates heteroscedasticity — the error variance increases then decreases with fitted value. The model is correctly specified but the Gauss-Markov homoscedasticity assumption is violated; use White's robust standard errors and refit.\``,
          `\`C) The U-shape confirms the model is well-specified: residuals should oscillate around zero across the fitted range. The pattern is within expected sampling variation given R²=0.95, and no action is needed.\``,
          `\`D) A U-shaped residual pattern means there are outliers at the extremes of the fitted range inflating the apparent error. Winsorise the response variable and refit — R² and residual shape will both improve.\``,
        ],
        answer: `A`,
      },
      {
        q: `You have two features with correlation 0.99. What happens to the linear regression coefficients, and how do Ridge and Lasso behave differently on this input?`,
        options: [
          `\`A) With correlation 0.99, OLS cannot compute a solution at all — XᵀX is singular and the normal equations have no solution. Ridge adds λI to make the matrix invertible; Lasso uses coordinate descent which also handles singularity, and both methods give identical coefficient estimates for highly correlated features.\``,
          `\`B) OLS coefficients are slightly inflated but otherwise reliable; the 0.99 correlation only matters when correlation reaches exactly 1.0. Ridge and Lasso both shrink the inflated coefficients, but Lasso shrinks them more aggressively because its L1 penalty is stronger than L2 for large coefficients.\``,
          `\`C) With correlation 0.99, both OLS and Ridge will zero out one of the two correlated features to avoid redundancy. The difference is that Ridge zeros based on lower t-statistic while Lasso zeros based on lower raw coefficient magnitude after shrinkage.\``,
          `\`D) With correlation 0.99, XᵀX is near-singular. OLS coefficients are extremely unstable — a small change in any training point causes large swings in both coefficients. Ridge regression (XᵀX + λI)⁻¹Xᵀy: adds λ to all eigenvalues, stabilising the inversion; Ridge splits the coefficient weight roughly equally between the two correlated features — both get non-zero, similar-magnitude coefficients. Lasso: arbitrarily picks one of the two correlated features (whichever has slightly larger correlation with the residual) and drives the other to exactly zero — the selected feature can change dramatically across different training sets. Ridge is safer when both correlated features genuinely matter.\``,
        ],
        answer: `D`,
      },
      {
        q: `Gauss-Markov says OLS is BLUE. What exactly does "Best Linear Unbiased" mean, and what does it NOT guarantee?`,
        options: [
          `\`A) "Unbiased" means zero training error. "Linear" means the model is a linear function of features. "Best" means highest R² among all linear models. What GM does NOT guarantee: that OLS generalises well to new data — overfitting can occur when d is large relative to n.\``,
          `\`B) "Unbiased" means E[θ̂] = θ (correct on average across all possible datasets). "Linear" means the estimator is a linear function of y: θ̂ = Cy for some matrix C. "Best" means minimum variance among all linear unbiased estimators. What GM does NOT guarantee: (1) OLS is not best among non-linear or biased estimators — Ridge (biased) can have lower MSE = Bias² + Variance. (2) OLS does not give minimum prediction error on new data — overfitting can make test MSE much higher. (3) BLUE requires the GM assumptions (no endogeneity, homoscedasticity) — violating them makes OLS non-optimal.\``,
          `\`C) "Unbiased" means the model has no systematic error on the training set. "Linear" means coefficients are estimated by a linear algorithm. "Best" means lowest mean squared error on test data. What GM does NOT guarantee: that OLS is computationally efficient — it requires O(d³) time regardless of dataset size.\``,
          `\`D) "Unbiased" means the model predictions are unbiased for any input x. "Linear" means the decision boundary is linear. "Best" means the model has the smallest number of parameters among all unbiased models. What GM does NOT guarantee: that OLS will outperform regularised models in high-dimensional settings.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `OLS finds the minimum squared-error line; collinearity makes individual coefficients meaningless while leaving predictions intact; R² cannot detect misspecification — only the residual plot can.`,
    interactiveId: 'linear_regression_viz',
  },
  {
    id: 'logistic_regression',
    interactiveId: 'logistic_regression_viz',
    title: 'Logistic Regression',
    subtitle: 'Sigmoid, cross-entropy loss, decision boundary, calibration',
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['classification', 'logistic regression', 'calibration'],
    summary: `A bank wants to predict whether a loan applicant will default. The target is binary — default or not — and the model needs to output a probability, not just a label. You try the obvious move: fit a linear regression and threshold the output at 0.5. Within a week, the model is producing predicted probabilities of 1.4 and -0.3. The outputs are meaningless as probabilities, and you have no natural way to fix them.

The real fix is not to clamp the output — it is to model the right quantity. Instead of predicting the probability directly, model the log-odds: $\\log[P(\\text{default})/P(\\text{no default})] = w^Tx + b$. The log-odds can be any real number, which linear models handle fine. Invert through the sigmoid $σ(z) = 1/(1+e^{-z})$ and you get a probability strictly between 0 and 1 for any input. This is logistic regression.

Now you need a loss function. The obvious choice is MSE — you are predicting a probability, it is a number, squared error should work. It does not. When the model is confidently wrong, the sigmoid saturates near 0 or 1, and MSE\`s gradient picks up a factor of $σ'(z) = σ(z)(1-σ(z))$, which shrinks toward zero. The model is most wrong at exactly the moment the gradient is smallest — learning stalls. Cross-entropy loss fixes this by design: its gradient with respect to the raw logit $z$ is exactly $\\hat{y} - y$. The $σ'(z)$ term that was killing learning gets algebraically cancelled by the $1/σ(z)$ in the log-likelihood gradient. You always get a clean prediction-error gradient.

One new failure mode emerges when you train on a dataset where the two classes are perfectly separated. For any correctly-separating hyperplane, scaling $\|w\|$ larger always increases the log-likelihood — the sigmoid pushes toward 0 and 1, making cross-entropy smaller and smaller. There is no finite maximum-likelihood solution; gradient descent diverges. L2 regularisation adds $λ\|w\|^2$ to the loss, which creates a finite optimal $\|w\|^*$ for any $λ > 0$.

**NOT this.** Most people think logistic regression just "adds a sigmoid to linear regression" — the sigmoid is the essential change, and the loss function is just squared error applied to a bounded output. This is wrong. The sigmoid is a detail; the loss function choice is the essential change. Replace cross-entropy with MSE on a sigmoid output and your model stops learning whenever it is most confidently wrong. The sigmoid and cross-entropy were designed together. The sigmoid alone is not enough.

Formally, logistic regression is maximum likelihood estimation of a Bernoulli likelihood with a linear logit. The sigmoid is how you recover probabilities; cross-entropy is how you maximise the likelihood. Neither works without the other.`,
    keyPoints: [
      `**Use it when you need calibrated probabilities for a binary outcome, especially when interpretability matters.**\n\nLogistic regression is the right first model for binary classification with tabular data. Coefficients are log-odds ratios — directly interpretable. If a weight is 0.8, each unit increase in that feature multiplies the odds of default by $e^{0.8} \\approx 2.2$. Use it as a baseline before any ensemble. Prefer it over trees when class boundaries are roughly linear and the number of training samples is small relative to features.`,
      `**The production trap: using MSE loss with a sigmoid output, or forgetting that perfect separation causes divergence.**\n\nMSE + sigmoid produces vanishing gradients for confident wrong predictions — the model freezes before it corrects its worst errors. Always use cross-entropy. On real loan datasets, a feature like "number of previous defaults" can perfectly separate the classes in the training set, causing weights to diverge toward infinity during training. Watch for exploding weights or NaN loss after a few epochs — this is the perfect separation failure. Fix: L2 regularization (sklearn\`s default, controlled by C). Set C < 1 to increase the regularisation strength.`,
      `**The diagnostic: check the reliability diagram — does P̂ = 0.7 actually correspond to a 70% default rate in that bin?**\n\nLogistic regression is theoretically well-calibrated on the training distribution, but regularization shrinks logits and pushes probabilities away from the extremes. In production, check calibration with a reliability diagram on a held-out set. If the curve bows below the diagonal (outputs 0.8 where the true rate is 0.55), apply Platt scaling or isotonic regression on a separate calibration set. Never calibrate on the training set.`,
    ],
    interactivePrompt: `Before you touch the controls: if you replaced cross-entropy loss with MSE while keeping the sigmoid output, what do you expect happens to training when the model makes a very confident wrong prediction?`,
    checkQuestions: [
      {
        q: `Why does logistic regression fail when classes are perfectly linearly separable, and how does L2 regularisation fix it?`,
        options: [
          `\`A) When data is linearly separable, there exists a hyperplane wᵀx + b = 0 that correctly classifies all training points. The MLE maximises Σ log σ(yᵢ(wᵀxᵢ+b)). For correctly classified points, yᵢ(wᵀxᵢ+b) > 0 and σ → 1 as the product grows. The log-likelihood increases indefinitely as ‖w‖→∞ — there is no maximum, just a supremum at infinity. Gradient descent will diverge. L2 regularisation adds λ‖w‖² to the loss, creating a finite optimal ‖w‖*: the benefit of further increasing ‖w‖ is outweighed by the L2 penalty. The solution exists and is unique for any λ > 0.\``,
          `\`B) When data is linearly separable, gradient descent oscillates because there are infinitely many separating hyperplanes with the same training loss. L2 regularisation breaks the tie by selecting the minimum-norm solution among all perfect separators, which is why it prevents divergence.\``,
          `\`C) Logistic regression fails on linearly separable data because the sigmoid saturates at exactly 0.5 for all points on the decision boundary, making the gradient zero everywhere and stopping learning. L2 regularisation shifts the boundary away from the support vectors so the sigmoid operates in its non-saturated region.\``,
          `\`D) When classes are separable, the cross-entropy loss reaches its minimum of 0 exactly, but this minimum is a saddle point not a local minimum, causing gradient descent to diverge. L2 regularisation converts the saddle point to a strict local minimum by making the Hessian positive definite.\``,
        ],
        answer: `A`,
      },
      {
        q: `Your logistic regression model predicts P(y=1) = 0.8 for a sample. A reliability diagram shows that samples with predicted probability 0.8 are actually positive only 55% of the time. What is wrong and how do you fix it?`,
        options: [
          `\`A) The model has a threshold miscalibration: the default 0.5 decision threshold is too low given the class imbalance. Raise the classification threshold to 0.8 to ensure predictions of P(y=1)=0.8 are only flagged as positive when warranted by the actual base rate.\``,
          `\`B) The model is underfitting — low regularisation is causing it to ignore informative features, making it predict moderate values near 0.8 for most samples. Reduce C (increase regularisation) to force the model to commit to higher- or lower-confidence predictions.\``,
          `\`C) The model is overconfident — it outputs 0.8 but the empirical frequency is only 0.55. This can happen when the model is regularised too strongly (logits are shrunk below their optimal values), when the training data is imbalanced, or when the model is misspecified. Fix: apply Platt scaling — fit a logistic regression on a separate calibration set: P(y=1|f) = σ(af+b) where f is the original model's logit output. Or use isotonic regression for more flexible non-parametric recalibration. Both require a separate calibration set — never the training set. Validate on a held-out test set using ECE after calibration.\``,
          `\`D) The model is correctly calibrated — a reliability diagram showing predicted 0.8 against empirical 0.55 is within acceptable deviation because calibration bins always have high variance. Report ECE and only recalibrate if ECE > 0.10.\``,
        ],
        answer: `C`,
      },
      {
        q: `How does the gradient of binary cross-entropy with sigmoid differ from MSE with linear output? What is the significance of this difference?`,
        options: [
          `\`A) MSE + linear produces larger gradients than cross-entropy + sigmoid everywhere, which is why cross-entropy training converges faster. The significance: the steeper gradient of MSE would cause gradient explosion in deep networks, while cross-entropy's bounded gradient provides stable training.\``,
          `\`B) MSE + linear: ∂L/∂z = (ŷ−y) where ŷ = z (no saturation). Cross-entropy + sigmoid: ∂L/∂z = σ(z)−y = ŷ−y (same form). The significance: if we used MSE with sigmoid, we would get ∂L/∂z = (σ(z)−y)·σ(z)(1−σ(z)) — the σ(z)(1−σ(z)) term nearly vanishes when the model is confidently wrong (e.g., σ(z)≈0 when y=1), causing vanishing gradients. Cross-entropy eliminates this: the σ'(z) in the chain rule cancels with the 1/σ(z) in the log-likelihood gradient, giving the clean prediction-error gradient. This is why cross-entropy, not MSE, is the correct loss for classification with sigmoid/softmax outputs.\``,
          `\`C) The gradients are identical in form — both equal (ŷ−y) — because sigmoid and softmax are designed so their derivatives exactly match the MSE derivative. The only practical difference is that cross-entropy penalises confident wrong predictions more heavily due to the log, making it more numerically stable.\``,
          `\`D) MSE + sigmoid has gradient ŷ(1−ŷ)(ŷ−y) while cross-entropy + sigmoid has gradient ŷ−y. The significance is computational speed: cross-entropy avoids the ŷ(1−ŷ) multiplication, making each gradient step slightly faster in practice.\``,
        ],
        answer: `B`,
      },
      {
        q: `You train logistic regression with C=1 (sklearn default, where C=1/λ). Your model underfits. What does C control and what value would you try next?`,
        options: [
          `\`A) C controls the learning rate in sklearn's logistic regression solver. C=1 uses a moderate step size; underfitting means the solver has not converged. Try C=0.01 (smaller steps for more careful convergence) and increase max_iter to ensure the solver runs long enough to find the optimum.\``,
          `\`B) C controls the number of cross-validation folds used internally. C=1 is equivalent to leave-one-out CV, which is too noisy with small datasets. Try C=5 or C=10 to use standard k-fold CV, which gives a more stable model.\``,
          `\`C) C controls the minimum confidence threshold for classification. Underfitting with C=1 means the model is refusing to classify borderline examples; try C=0.5 to lower the threshold and allow more positive predictions.\``,
          `\`D) In sklearn, C = 1/λ is the inverse of regularisation strength. C=1 means λ=1 — moderate regularisation. Underfitting (high training error, high test error) means the model is too regularised: the L2 penalty is too strong and is pulling weights toward zero, preventing the model from fitting the training data. To reduce regularisation: increase C (e.g., try C=10, C=100). This allows larger weight magnitudes and a more complex decision boundary. Also check: are the features well-scaled? Logistic regression with L2 is scale-sensitive — standardise features first. Is the problem actually non-linear? If so, add polynomial features or switch to a non-linear model.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Cross-entropy and sigmoid were designed together: the log in cross-entropy cancels sigmoid\`s vanishing derivative, giving a clean gradient $\\hat{y} - y$ even when the model is confidently wrong — the exact situation MSE loss would stall.`,
    interactiveId: 'logistic_regression_viz',
  },
  {
    id: 'regularization',
    interactiveId: 'regularization_viz',
    title: 'Regularisation Geometry',
    subtitle: 'L1 vs L2 geometry, Lasso sparsity, Ridge shrinkage, elastic net',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['regularisation', 'L1', 'L2', 'Lasso', 'Ridge'],
    summary: `You are predicting house prices and someone gives you 100 features — square footage, number of rooms, lot size, distance to school, neighborhood income, and 95 others. Many are correlated. You fit OLS and the training R² is 0.98. The test R² is 0.51. The model memorised the training data.

The core problem: OLS minimises training error with no regard for how large the weights get. Give it 100 features for 200 houses and it will find weights that fit the training data perfectly, including all the noise. The fix is to make large weights expensive: add a penalty on weight magnitude to the loss, and the optimiser now balances fitting the data against keeping weights small.

The first question is what kind of penalty. Penalise the squared magnitude of each weight — that is Ridge (L2). The optimiser shrinks all weights smoothly toward zero, but no weight ever reaches exactly zero. Now visualise this geometrically: in the constrained form, the L2 constraint is a sphere. The loss function\`s level curves are ellipses centered at the OLS solution. Expand those ellipses outward until they touch the sphere. A sphere is smooth — the contact point almost never falls on a coordinate axis, so Ridge almost never zeroes a weight.

Now swap the sphere for a diamond — the L1 constraint. The L1 ball in two dimensions is a diamond with four corners, one on each axis. Expand the loss ellipses outward from the OLS solution. They hit the diamond\`s corner first, almost always. At a corner, one weight is exactly zero. That is Lasso, and that geometric corner is why it performs feature selection while Ridge cannot.

[FIGURE: l1_l2_geometry]

**NOT this.** Most people think "regularisation just reduces overfitting by making the model simpler." This is imprecise enough to be misleading. Lasso zeros weights not because "simpler is better" — it zeros them because the L1 ball\`s geometry has corners on the coordinate axes and the loss ellipses hit those corners. L2\`s sphere has no corners, so it never zeros anything. The sparsity is a consequence of geometry, not philosophy. You can choose L1 vs L2 based on the geometry of your problem: sparse true signal → L1; dense or correlated signal → L2; want both → elastic net.

The formal statement: Ridge solves $\\hat{θ}_{ridge} = (X^TX + λ I)^{-1}X^Ty$. Adding $λ I$ pushes all eigenvalues of $X^TX$ above $λ$, making the inversion numerically stable even for perfectly correlated features. Lasso has no closed form — L1 is not differentiable at zero — so it uses coordinate descent with a soft-thresholding operator that creates a dead zone at the origin, setting weights to exactly zero when the gradient is too small to overcome the penalty.

For the house price problem with 100 correlated features: if you believe only a handful of features truly matter, use Lasso. If you think many features each contribute a small real effect, use Ridge. If correlated features should survive together while irrelevant ones are dropped, use elastic net.`,
    keyPoints: [
      `**Use L1 (Lasso) when you believe the true signal is sparse — a few features matter, most do not. Use L2 (Ridge) when many features contribute small effects or when correlated features should survive together.**\n\nA practical rule: if you have 100 features and expect ~10 to be predictive, start with Lasso. If domain knowledge says all 100 contribute (e.g., genomics with many small-effect SNPs), use Ridge. If features are correlated and you want sparsity without instability in which feature gets selected, use elastic net. In sklearn: Ridge (alpha=λ), Lasso (alpha=λ), ElasticNet (alpha=λ, l1_ratio=mixing).`,
      `**The production trap: Lasso\`s feature selection is unstable when features are correlated.**\n\nOn the 100-feature house price dataset, if square footage and total floor area have correlation 0.95, Lasso will pick one and zero the other — but which one it picks can flip entirely across different training samples. Re-run with a different random seed for the train/test split and the selected feature changes. This is not a bug; it is the expected behavior of L1 on a near-degenerate problem. Elastic net adds L2 to stabilise the selection: correlated features get similar non-zero coefficients rather than one being arbitrarily killed. If Lasso\`s selected features change across cross-validation folds, switch to elastic net.`,
      `**The diagnostic: plot the regularization path — watch how each coefficient evolves as λ increases from 0 to large.**\n\nThe features that survive longest as λ grows are the most robustly predictive. Features that die first are either noise or redundant. For Lasso, sklearn\`s LassoCV traces this path efficiently. For Ridge, the path is smooth and monotone. A feature that enters the model early (at large λ) and stays is the one you should trust. One that only appears at very small λ is probably capturing noise. This diagnostic reveals which features are genuinely load-bearing before you commit to a final λ.`,
    ],
    interactivePrompt: `Before you touch the controls: with two features that are perfectly correlated, do you expect Lasso to zero out one of them, both of them, or neither — and does Ridge behave the same way?`,
    checkQuestions: [
      {
        q: `You have 200 samples and 500 features. Many features are likely irrelevant. Which regulariser do you choose and why?`,
        options: [
          `\`A) Ridge (L2) is preferred: with n=200 << p=500 the system is underdetermined, and Ridge's closed-form solution (XᵀX + λI)⁻¹Xᵀy is numerically stable for any λ > 0. It avoids the instability of Lasso's coordinate descent in highly underdetermined settings.\``,
          `\`B) L1 (Lasso) is preferred: it performs automatic feature selection by driving irrelevant feature weights to exactly zero, giving a sparse interpretable model. With n=200 << p=500, the problem is underdetermined (infinitely many OLS solutions). Sparsity is a reasonable assumption and helps generalisation. If features are highly correlated, elastic net is better than pure Lasso — Lasso arbitrarily picks among correlated features, while elastic net applies the grouping effect. Start with Lasso (sklearn's LogisticRegression with penalty='l1'), then try elastic net if Lasso's selected features are unstable across cross-validation folds.\``,
          `\`C) No regularisation is needed: with 200 samples and 500 features, cross-validation will automatically prevent overfitting by selecting the model complexity that minimises validation error. Regularisation would introduce unnecessary bias.\``,
          `\`D) Principal component regression is the correct approach: first reduce the 500 features to ~20 principal components explaining 95% of variance, then apply OLS on the reduced features. This is strictly better than L1 or L2 because it uses the actual data structure rather than an arbitrary penalty.\``,
        ],
        answer: `B`,
      },
      {
        q: `Explain geometrically why Lasso produces sparse solutions but Ridge does not, using the constrained optimisation formulation.`,
        options: [
          `\`A) Constrained form: minimise loss(w) subject to ‖w‖_p ≤ r. The loss L(w) has elliptical level curves centred at θ̂_OLS. We want the point on the constraint boundary closest to θ̂_OLS. L1 constraint: ‖w‖₁ ≤ r is a diamond (in 2D) with corners at (r,0), (0,r), (−r,0), (0,−r). As we expand the ellipse from θ̂_OLS outward, it first hits a corner of the diamond where one coordinate is exactly zero. L2 constraint: ‖w‖₂ ≤ r is a circle (sphere in high-D) with no corners — the ellipse hits the sphere at a smooth point, almost never on an axis, so almost no coefficient is exactly zero.\``,
          `\`B) In the penalised form, the L1 subgradient at zero equals the sign of the coefficient while the L2 gradient equals 2λw. The subgradient being a constant at zero means the Lasso update always overshoots zero, landing at exactly zero before bouncing back; the L2 gradient being proportional to w means Ridge always undershoots zero slightly and never reaches it.\``,
          `\`C) Lasso uses an L1 ball as constraint, and in high dimensions the volume of the L1 ball concentrates on the coordinate axes — most of the ball's surface area is near a corner. Ridge uses an L2 ball whose surface area is uniformly distributed. Consequently, random projection of the OLS solution onto the Lasso ball lands on a corner axis with high probability but never on a Ridge axis.\``,
          `\`D) The L1 penalty ‖w‖₁ is discontinuous at w=0 which creates an attraction point: the gradient pushes weights below a threshold to exactly zero. The L2 penalty ‖w‖₂² is differentiable everywhere including at zero, meaning its gradient points away from zero and never creates the same hard attraction point.\``,
        ],
        answer: `A`,
      },
      {
        q: `A Lasso model selects 10 features, but when you rerun with a different random seed (for data splitting), it selects a completely different 10 features. What does this mean and what should you do?`,
        options: [
          `\`A) The Lasso implementation has a bug — coordinate descent with different random seeds should converge to the same global minimum because the Lasso objective is convex. Try fixing the random seed and increasing max_iter; the selection should stabilise once the solver converges.\``,
          `\`B) The λ value is too large, causing the Lasso to select near-zero features by chance. Different train/test splits expose different noise patterns, each giving a different set of near-zero features above the threshold. Decrease λ (increase C in sklearn) to select features that are more robustly predictive.\``,
          `\`C) This instability signals that many non-selected features are nearly equally predictive and correlated with the 10 selected ones. Lasso's feature selection is unstable when multiple features share similar predictive power — it arbitrarily picks one from each correlated group. Remedies: (1) Switch to elastic net (grouping effect stabilises correlated feature selection). (2) Use stability selection: run Lasso on many bootstrap subsamples, keep only features selected in > 80% of runs — these are the truly stable predictors. (3) Use permutation importance or SHAP on a Random Forest to identify the genuinely important features without assuming sparsity.\``,
          `\`D) The dataset is too small — with n=200 the train/test splits differ enough that the 10 best features genuinely change across splits. The instability reflects real uncertainty in the data, not a model problem; report all features that appear in at least one split and let domain knowledge decide.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Ridge shrinks all weights smoothly; Lasso zeroes some exactly — the difference is geometry: L2\`s sphere has no corners, L1\`s diamond does, and loss ellipses hit corners first.`,
    interactiveId: 'regularization_viz',
    figures: {
      l1_l2_geometry: `<svg viewBox="0 0 480 240" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;font-family:var(--font-sans,sans-serif)">
  <!-- L1 panel -->
  <g transform="translate(20,20)">
    <text x="100" y="14" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">L1 (lasso)</text>
    <!-- axes -->
    <line x1="100" y1="195" x2="100" y2="25" stroke="var(--ink-low)" stroke-width="1"/>
    <line x1="10" y1="110" x2="190" y2="110" stroke="var(--ink-low)" stroke-width="1"/>
    <text x="194" y="114" fill="var(--ink-low)" font-size="10">w₁</text>
    <text x="103" y="22" fill="var(--ink-low)" font-size="10">w₂</text>
    <!-- L1 diamond -->
    <polygon points="100,45 165,110 100,175 35,110" fill="none" stroke="var(--prime)" stroke-width="2"/>
    <!-- loss ellipses -->
    <ellipse cx="150" cy="70" rx="70" ry="45" fill="none" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.5"/>
    <ellipse cx="150" cy="70" rx="95" ry="65" fill="none" stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.75"/>
    <!-- OLS solution star -->
    <circle cx="150" cy="70" r="4" fill="var(--amber)" opacity="0.9"/>
    <text x="155" y="67" fill="var(--amber)" font-size="9">θ̂ols</text>
    <!-- contact point at corner -->
    <circle cx="165" cy="110" r="5" fill="var(--prime)" stroke="var(--ink-hi)" stroke-width="1.5"/>
    <text x="168" y="108" fill="var(--prime)" font-size="9" font-weight="700">sparse!</text>
    <!-- zero label -->
    <text x="97" y="182" fill="var(--ink-low)" font-size="9" text-anchor="middle">w₂=0</text>
  </g>
  <!-- divider -->
  <line x1="240" y1="10" x2="240" y2="230" stroke="var(--rim)" stroke-width="1"/>
  <!-- L2 panel -->
  <g transform="translate(250,20)">
    <text x="100" y="14" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">L2 (ridge)</text>
    <!-- axes -->
    <line x1="100" y1="195" x2="100" y2="25" stroke="var(--ink-low)" stroke-width="1"/>
    <line x1="10" y1="110" x2="190" y2="110" stroke="var(--ink-low)" stroke-width="1"/>
    <text x="194" y="114" fill="var(--ink-low)" font-size="10">w₁</text>
    <text x="103" y="22" fill="var(--ink-low)" font-size="10">w₂</text>
    <!-- L2 circle -->
    <circle cx="100" cy="110" r="65" fill="none" stroke="var(--prime)" stroke-width="2"/>
    <!-- loss ellipses -->
    <ellipse cx="150" cy="70" rx="70" ry="45" fill="none" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.5"/>
    <ellipse cx="150" cy="70" rx="100" ry="68" fill="none" stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.75"/>
    <!-- OLS solution star -->
    <circle cx="150" cy="70" r="4" fill="var(--amber)" opacity="0.9"/>
    <text x="155" y="67" fill="var(--amber)" font-size="9">θ̂ols</text>
    <!-- contact point on smooth curve -->
    <circle cx="155" cy="58" r="5" fill="var(--prime)" stroke="var(--ink-hi)" stroke-width="1.5"/>
    <text x="159" y="56" fill="var(--prime)" font-size="9" font-weight="700">w₁≠0, w₂≠0</text>
  </g>
</svg>`,
    },
  },
  {
    id: 'generalization',
    interactiveId: 'bias_variance_viz',
    title: 'Generalisation Theory',
    subtitle: 'Bias-variance, VC dimension, PAC learning, double descent',
    difficulty: 'advanced',
    estimatedMin: 32,
    tags: ['bias-variance', 'VC dimension', 'overfitting', 'double descent'],
    summary: `You train a model on house prices. Training error: 2%. Test error: 20%. The model is useless in production, but nothing in the training loop warned you — it was doing its job perfectly. The gap is the real problem, and understanding it requires asking a harder question than "did it overfit?" You need to know why.

The bias-variance decomposition splits the test error into three pieces. The first is irreducible noise — measurement error, random fluctuations in house prices that no model could ever capture. This is a floor. The second is bias: the model\`s systematic tendency to miss in the same direction, because its assumptions are wrong. The third is variance: how much the model\`s predictions swing when you retrain it on a different sample of houses. A high-capacity model — say, a deep tree — will fit the training data beautifully and have near-zero bias, but swap out ten training houses and the fitted tree looks completely different. High variance. A linear model with strong regularisation will be stable across resampling but will consistently miss the non-linear parts of the true price curve. High bias.

The cure for one makes the other worse. Add regularisation to reduce variance and you introduce bias. Add model capacity to reduce bias and you raise variance. This is the tradeoff, and every architectural choice you make is a position on this curve.

Classical theory says test error follows a U-shape as model complexity grows. That is real. But it is also incomplete. Extremely overparameterised models — far past the point where they can memorise the training data — often do better than models right at the interpolation threshold. The classical U-curve rises again at the threshold, then descends a second time in the massively overparameterised regime. This is double descent. Gradient descent in overparameterised models tends to find the minimum-norm solution among infinitely many that fit the training data, and the minimum-norm solution tends to be smoother — which generalises better.

**NOT this.** Most people think "more data always reduces test error." If the model is correctly specified — if its assumptions match the true process — then yes, more data reduces variance and test error improves. But if the model is misspecified — if it assumes a linear relationship and the truth is a curve — then more data just confirms the wrong assumption more confidently. Bias does not shrink with data. A linear model fit to 100 house prices and a linear model fit to 100,000 house prices will both miss a U-shaped price-size relationship by roughly the same amount. More data fixed variance, not bias. You need to fix the model, not gather more samples.

The formal statement: $E[(y - \\hat{y})^2] = σ^2 + \\text{Bias}^2(\\hat{y}) + \\text{Var}(\\hat{y})$. The irreducible noise $σ^2$ cannot be removed. Bias and variance both contribute to test error, and regularisation is a dial that trades one for the other.`,
    keyPoints: [
      `**Use the bias-variance lens to diagnose a gap: large train error → high bias (wrong model family or too much regularisation); small train error and large test error → high variance (model memorised noise).**\n\nIn the house price setting: training error 2%, test error 20% = high variance. The model fit the training set noise rather than the true price function. Start by reducing complexity or increasing regularisation. If training error is also high (say 15%, test 18%) that is high bias — the model cannot even fit the training data, so adding data or reducing regularisation is the fix. Both diagnoses require measuring training error explicitly, not just test error.`,
      `**The production trap: mistaking "more data" as a universal fix for poor test performance.**\n\nMore data reduces variance — it is the most reliable fix for the high-variance / low-bias case. But if your model is misspecified (linear on non-linear data, missing key features), more data will reduce confidence intervals but not prediction error. Before scaling data collection, fit a flexible model (gradient boosting) on the same training data. If the flexible model\`s test error is also high, you have a data problem. If it is much lower, your original model is misspecified — fix the model, not the data.`,
      `**The diagnostic: learning curves — plot training and validation error as a function of training set size.**\n\nHigh bias: both training and validation error are high and converge close together. Adding data barely moves either curve. Fix: more capacity. High variance: training error is low, validation error is much higher, and they have not converged — the gap persists even with many training samples. Fix: regularisation, simpler model, or more data if you have it. If the two curves converge but at a high error level: you have hit irreducible noise or genuine misspecification.`,
    ],
    interactivePrompt: `Before you touch the controls: if you doubled the size of the training set without changing the model, do you expect the training error to go up, down, or stay the same?`,
    checkQuestions: [
      {
        q: `A model achieves 99% training accuracy and 75% test accuracy. What does this tell you about bias and variance, and what would you do?`,
        options: [
          `\`A) High training accuracy + much lower test accuracy = high bias (the model makes strong incorrect assumptions) + high variance. The model is underfitting AND overfitting simultaneously, which means the architecture is fundamentally misspecified. Completely change the model family rather than tuning hyperparameters.\``,
          `\`B) High training accuracy + much lower test accuracy = low bias + high variance. The model is overfitting. The 24% gap suggests the test set comes from a different distribution than training — check for distribution shift before any architecture changes.\``,
          `\`C) This is expected behaviour for a well-trained model: some gap between training and test accuracy is healthy. The 75% test accuracy is acceptable; attempting to close the gap further would introduce regularisation bias and reduce the model's expressiveness.\``,
          `\`D) High training accuracy + much lower test accuracy = low bias (the model fits training data well) + high variance (does not generalise — sensitive to the specific training set). The model is overfitting. Remedies in priority order: (1) More training data — reduces variance most directly. (2) Stronger regularisation (L2, dropout, weight decay). (3) Simpler architecture (fewer parameters, shallower network). (4) Ensemble methods (bagging averages out variance). Increasing model capacity would worsen the problem. The 24% gap is large — start with data augmentation or getting more labels before architectural changes.\``,
        ],
        answer: `D`,
      },
      {
        q: `Explain the double descent phenomenon. A neural network's test error is worse at 1000 parameters than at 100 parameters, but better at 1,000,000 parameters than at 100. How is this possible?`,
        options: [
          `\`A) The 1000-parameter model is near the interpolation threshold — it has just enough capacity to memorise the training data, but the solution it finds has high variance (sensitive to the specific training set). The 100-parameter model is underparameterised and underfits — higher bias. The 1,000,000-parameter model is highly overparameterised: gradient descent finds the minimum-norm interpolating solution among infinitely many zero-training-error solutions. Minimum-norm solutions correspond to smoother, more generalising functions. The "implicit regularisation" of gradient descent prefers these smooth solutions. Classical bias-variance theory predicts the U-curve (100 → 1000); double descent adds the second descent (1000 → 1,000,000). Early stopping at 100 would have been a worse choice than using the massively overparameterised model.\``,
          `\`B) The 1000-parameter model is overfitting because it has too many parameters for the training set size. The 100-parameter model underfits. The 1,000,000-parameter model works better simply because more parameters always improve performance when trained with sufficiently small learning rate and early stopping — this is the standard bias-variance tradeoff extended to large models.\``,
          `\`C) The improvement at 1,000,000 parameters is due to the lottery ticket hypothesis: among 1,000,000 parameters, random initialisation finds a sparse subnetwork that is already close to the optimal solution. This subnetwork is effectively a small model, which is why the 1,000,000-parameter model generalises like the 100-parameter model.\``,
          `\`D) The 1,000,000-parameter model implicitly performs ensemble learning — different subnetworks specialise on different subsets of training examples and their predictions are averaged through the shared output layer. This averaging reduces variance in the same way bagging does, which is why test error falls back below the 100-parameter baseline.\``,
        ],
        answer: `A`,
      },
      {
        q: `You increase a linear classifier's feature count from d=100 to d=500 (adding new features). Training accuracy improves but test accuracy degrades. Explain in terms of VC dimension and what you should do.`,
        options: [
          `\`A) VC dimension measures model complexity only for non-linear classifiers. For a linear classifier, adding features from d=100 to d=500 does not change VC dimension — only the number of training points matters. The test accuracy degradation is a numerical issue: more features means a larger XᵀX matrix that is harder to invert stably. Regularise with Ridge to stabilise the inversion.\``,
          `\`B) Linear classifiers in ℝᵈ have VC-dim = d+1. Increasing d from 100 to 500 increases VC-dim from 101 to 501 — the hypothesis class can now shatter more points, meaning it can fit more arbitrary patterns including noise in the training set. The generalisation bound increases: test error ≤ train error + √(500·log(n)/n) > √(100·log(n)/n). With the same n, the model now needs 5× more data to maintain the same generalisation gap. Fixes: (1) Regularise more strongly (larger λ for Ridge/Lasso to reduce effective complexity). (2) Apply feature selection — keep only features with genuine predictive value. (3) Collect more data proportional to the increased VC dimension.\``,
          `\`C) VC dimension applies to binary classifiers in the worst case. For practical data, training accuracy improving while test accuracy degrades at d=500 is simply a sign that the new 400 features are noisy. Remove features with low correlation to the target label — mutual information filtering will restore test accuracy without any regularisation.\``,
          `\`D) The degradation is a threshold effect specific to linear models: linear classifiers have VC-dim = d only when d is a power of 2. At d=500 (non-power-of-2), the effective VC dimension is d²=250,000, massively inflating the generalisation gap. Use a non-linear model at d=500 which has a more predictable VC-dim growth rate.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Test error = irreducible noise + bias² + variance; bias is wrong assumptions (more data won\`t fix it), variance is sensitivity to the training sample (more data will); and every regularisation decision is a move along the bias-variance curve.`,
    interactiveId: 'bias_variance_viz',
  },
  {
    id: 'trees',
    interactiveId: 'decision_tree_viz',
    title: 'Decision Trees',
    subtitle: 'Information gain, Gini, pruning, depth-accuracy tradeoff',
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['decision trees', 'Gini', 'information gain'],
    summary: `You are building a model to predict loan default from three features: annual income, debt-to-income ratio, and age. The true pattern is non-linear — low-income applicants with high debt default at high rates, but middle-income applicants with moderate debt have a complex interaction pattern that no weighted sum of the features can capture. Logistic regression misses it. You need a model that partitions the feature space into regions.

A decision tree does exactly this. At the root, it looks at every feature and every possible threshold — income < $40k, income < $45k, debt ratio < 0.3, age < 35, and so on — and picks the single split that most reduces class impurity in the two resulting groups. Then it repeats at each child. The impurity measures (Gini: $1 - \\sum p_k^2$, entropy: $-\\sum p_k \\log p_k$) both measure how mixed the class labels are in a node. A pure leaf — everyone in it defaults, or no one does — has zero impurity.

The algorithm is greedy: at each node it picks the locally best split. This is not the globally optimal tree. The globally optimal tree is NP-hard to find — you would have to evaluate every possible combination of splits at every level simultaneously. The tree cannot backtrack. A locally suboptimal split at the root might have enabled much better splits downstream, but the greedy algorithm never knows. This means the tree you get is always an approximation of the best possible tree, and the quality of that approximation depends heavily on whether your training data is representative.

This leads to the defining weakness: instability. Change ten training examples and the root split might change. A different root split means different data reaches every downstream node, which means the entire tree structure changes. The model is highly sensitive to the specific training sample — high variance. This is not a parameter to tune away; it is structural.

**NOT this.** Most people say "decision trees find the optimal partition of the feature space." This is false. They find the locally greedy partition. The globally optimal partition — the one that truly minimises impurity across all possible recursive splits — is NP-hard to compute, and no practical implementation attempts it. What a tree does is find a locally good solution quickly. The result is often very good, but "optimal" is not the right word.

The formal statement: the splitting criterion at each node is $\\arg\min_{j, t} \\left[ \\frac{n_L}{n} G(L) + \\frac{n_R}{n} G(R) \\right]$ where $j$ is the feature, $t$ is the threshold, and $G$ is Gini impurity. The algorithm accepts the first locally optimal split and never revisits it. A fully grown tree (max_depth=None) reaches zero training error: every leaf has one sample, perfectly pure, perfectly memorised. This is zero bias and maximum variance. Pruning trades that variance for bias.`,
    keyPoints: [
      `**Use decision trees when you need interpretability, have mixed feature types, or want to discover non-linear interactions without feature engineering.**\n\nTrees handle continuous and categorical features natively, require no scaling, and capture interactions automatically (splitting on income then debt is equivalent to learning the income × debt interaction). They are the right first model when you need to explain every prediction to a stakeholder. Do not use a single tree in production for high-stakes predictions — the instability makes it fragile. Use ensembles for production; use single trees for explanation and EDA.`,
      `**The production trap: deploying a single tree and not realising that minor data changes can produce a completely different model.**\n\nIn the loan default setting: remove 5% of training examples at random and retrain. The root split may change from "income < $42k" to "debt ratio > 0.38". Every node below changes accordingly. The two trees might predict opposite outcomes for the same applicant. This is not a bug — it is expected behavior from a high-variance model. If you observe inconsistency between model versions, instability is the likely cause. Fix: use ensembles (random forest, boosting), or if you need a single tree, use cost-complexity pruning with cross-validated alpha to get a stable, interpretable model.`,
      `**The diagnostic: compare training accuracy vs test accuracy as you vary max_depth. The gap reveals variance; the training accuracy floor reveals bias.**\n\nAt max_depth=1: high training error, high test error (high bias — the model can only split once). At max_depth=None: zero training error, high test error (high variance — memorised noise). The optimal depth is where the test error curve has its minimum. Find it with cross-validation, not by feel. sklearn\`s cost_complexity_pruning_path() traces the full path of alpha values — cross-validate over those instead of over depth directly, as pruning is more principled than a fixed depth cap.`,
    ],
    interactivePrompt: `Before you touch the controls: if a decision tree perfectly memorises every training example (100% training accuracy), what do you expect its test accuracy to be relative to a shallower tree?`,
    checkQuestions: [
      {
        q: `Why do decision trees have high variance, and how does this motivate random forests?`,
        options: [
          `\`A) Decision trees have high variance because they use greedy splitting — the globally optimal tree would have lower variance, but greedy search produces a locally optimal but globally unstable tree. Random forests fix this by running global optimisation with a genetic algorithm across T trees.\``,
          `\`B) Trees have high variance because they are sensitive to the choice of impurity criterion — Gini vs entropy can produce completely different splits. Random forests solve this by averaging trees built with different impurity criteria.\``,
          `\`C) Trees are unstable: small changes in training data (even swapping a few samples) can produce very different top splits, which propagate down to completely different tree structures. This is high variance. A single tree can perfectly fit training data but fails on test data because it memorised noise. Random forests reduce variance by: (1) bagging — training each tree on a bootstrap sample (different data reduces correlation between trees), (2) random feature subsampling — considering only m features at each split (further decorrelates trees). The ensemble average has much lower variance while preserving low bias. Ensemble variance = ρσ² + (1−ρ)σ²/T where ρ is pairwise tree correlation — decorrelation (reducing ρ) is as important as having many trees.\``,
          `\`D) Trees have high variance because they compute a deterministic output — the same tree always returns the same prediction for a given input. Random forests introduce randomness at inference time by sampling a subset of trees per prediction, which smooths the decision boundary and reduces variance.\``,
        ],
        answer: `C`,
      },
      {
        q: `Gini impurity and entropy give almost identical splits in practice. When would you choose one over the other, and is there any principled reason?`,
        options: [
          `\`A) Information gain (entropy reduction) has a principled derivation from information theory: it maximises the mutual information between the split and the class label. Gini impurity has a different interpretation: it is the probability of misclassifying a randomly drawn sample if classified according to the class distribution. In practice: (1) Gini is faster to compute (no logarithm). (2) Entropy tends to produce more balanced splits (log penalises extreme imbalance more). (3) For highly imbalanced classes, entropy is sometimes slightly better. In most benchmarks, the difference in final model quality is < 0.1%. Choose entropy when you care about the information-theoretic interpretation; choose Gini for speed on large datasets.\``,
          `\`B) Gini impurity is theoretically preferable because it minimises Bayes error rate — the probability of misclassification — directly. Entropy measures information content, which is a different objective. For classification tasks you should always use Gini unless the tree depth is constrained to 1 (decision stump), where entropy provably finds the better split.\``,
          `\`C) Entropy always produces better trees than Gini when the number of classes K > 2. For binary classification the two criteria are mathematically equivalent and the choice does not matter. For multiclass problems, the log term in entropy correctly penalises splits that create many small leaf classes, which Gini ignores.\``,
          `\`D) The choice of Gini vs entropy matters only at the leaf level, not at internal splits. Gini assigns leaf probabilities proportional to class frequency; entropy assigns probabilities proportional to the log of class frequency. For probability calibration, entropy leaves are better calibrated and should be preferred whenever the model's output probabilities are used downstream.\``,
        ],
        answer: `A`,
      },
      {
        q: `A decision tree with max_depth=None achieves 100% training accuracy and 62% test accuracy. You reduce max_depth to 5 and get 85% training and 80% test accuracy. Explain this in terms of bias-variance, and how would you find the optimal depth?`,
        options: [
          `\`A) max_depth=None overfits because an unlimited tree has high bias — it makes too many assumptions about the data by splitting until each leaf is pure. max_depth=5 reduces bias by allowing leaves to be impure. Optimal depth is found by grid searching max_depth values and picking the one with the highest training accuracy while keeping the train-test gap below 10%.\``,
          `\`B) Both trees have low bias and differ only in variance. max_depth=None has variance equal to the dataset size n; max_depth=5 has variance proportional to 2⁵=32 (the number of leaves). To find optimal depth: set max_depth to ⌈log₂(n)⌉ — this ensures at most one sample per leaf class, balancing capacity with dataset size.\``,
          `\`C) max_depth=None overfits because deep trees are sensitive to mislabelled training points — they create extra leaves to accommodate every noisy example. Reduce overfitting by applying label smoothing to the training set instead of restricting depth — this is a more principled solution than an arbitrary depth limit.\``,
          `\`D) max_depth=None: zero bias (perfectly fits training), enormous variance (memorises noise). Huge generalisation gap (100% → 62%). max_depth=5: increased bias (cannot fit every training pattern), much lower variance (simpler structure). Better generalisation gap (85% → 80%). The optimal depth is found via cross-validation: for depth in [1, 2, 3, ..., 20], compute CV test accuracy; pick the depth where CV accuracy is highest. sklearn's cost_complexity_pruning_path() returns a range of ccp_alpha values — sweep these with CV; this is more principled than limiting depth because it prunes in a data-adaptive way.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Decision trees find a locally greedy partition — not the globally optimal one — which is why they are fast, expressive, and unstable; the instability is the property that makes them ideal ensemble components.`,
    interactiveId: 'decision_tree_viz',
  },
  {
    id: 'random_forest',
    interactiveId: 'random_forest_viz',
    title: 'Random Forests',
    subtitle: 'Bagging, OOB error, feature importance, hyperparameter sensitivity',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['random forest', 'bagging', 'ensemble'],
    summary: `A single decision tree has a structural problem: change ten training examples and the root split may change, cascading a completely different tree structure at every level. The model is fragile. But notice what the fragility means — different training samples produce different trees. If you could train many trees, each on a slightly different sample, and average their predictions, the errors would partially cancel. The correct predictions would reinforce. That is the key insight behind random forests.

Here is how it works. Each of the T trees is trained on a bootstrap sample — draw n examples with replacement from the original dataset. On average, each bootstrap sample contains about 63% unique examples from the original. The remaining ~37% — the out-of-bag (OOB) examples — were never seen by that tree during training. Already, each tree is working from a different perspective on the data.

But bootstrap sampling alone is not enough. If one feature, say income, is a strong predictor of loan default, every tree will use it at or near the root. All trees make the same root split, and their predictions stay highly correlated. Averaging correlated predictions helps much less than averaging uncorrelated ones. The formula is exact: ensemble variance $= ρσ^2 + \\frac{(1-ρ)σ^2}{T}$. As T grows, the $(1-ρ)σ^2/T$ term shrinks to zero — the variance floor is $ρσ^2$, set entirely by correlation between trees, not by the number of trees.

The fix is random feature subsampling. At each split — not just each tree, but each individual split decision — consider only a random subset of $\\sqrt{p}$ features (for classification) or $p/3$ (for regression) rather than all $p$. Now even if income dominates, some trees will never see it at the root split because it was not in the randomly selected subset for that node. Different trees are forced to discover different structure. Correlation $ρ$ drops. The variance floor drops.

**NOT this.** Most people think "more trees always help." Past roughly 100–500 trees, the variance reduction from adding another tree is negligible — the $(1-ρ)σ^2/T$ term is already near zero. Adding more trees spends compute without moving accuracy. The parameter that actually moves the variance floor is max_features. Halving max_features reduces $ρ$ and continues to help even when you have 1000 trees. The most important hyperparameter is the one that controls diversity, not quantity.

The OOB error is a useful side effect of bootstrap sampling. For each training example, average only the predictions of trees that did not include it in their bootstrap sample. These trees have truly never seen this example — the OOB error is a genuine out-of-sample estimate at no extra computational cost. Enable it with oob_score=True in sklearn.`,
    keyPoints: [
      `**Use random forests when you need a strong tabular baseline with minimal tuning, especially when interactions matter and you cannot specify them in advance.**\n\nRandom forests are the right first ensemble for classification and regression on tabular data. They handle mixed feature types, require no scaling, are robust to irrelevant features, and provide free OOB validation. Default hyperparameters (max_features=\`sqrt\`, n_estimators=100) are competitive on many datasets without any tuning. Prefer gradient boosting when you need the last 1–2% of accuracy and are willing to tune; prefer random forests when you need a reliable baseline fast.`,
      `**The production trap: using Gini importance for feature ranking and making decisions based on it.**\n\nGini importance accumulates total impurity reduction across all splits that use a feature. High-cardinality features — continuous income values vs. binary loan purpose — get more candidate thresholds and more split opportunities per tree, inflating their apparent importance regardless of actual predictive value. In the loan default model, a feature with 10,000 unique values will appear more important than a binary feature even if the binary feature is more predictive. Fix: use permutation importance (shuffle the feature, measure accuracy drop) or SHAP values. Both are unbiased with respect to cardinality.`,
      `**The diagnostic: compare OOB error to held-out test error. A large gap signals distribution shift or data leakage.**\n\nOOB error is a reliable estimate of performance on data drawn from the same distribution as training. If OOB error is 10% and test error is 25%, the test set comes from a different distribution — or there was leakage that made training too easy. Run a feature distribution check (KS-test or histogram comparison) between train and test. If distributions differ, the model was not trained on the right data for the deployment context.`,
    ],
    interactivePrompt: `Before you touch the controls: if you increase the number of trees from 100 to 1000 while keeping max_features fixed, how much do you expect the test accuracy to change?`,
    checkQuestions: [
      {
        q: `A random forest with 500 trees takes too long to train. What do you tune first, and what accuracy tradeoff do you expect?`,
        options: [
          `\`A) Reduce max_depth first — shallower trees train faster and the accuracy loss is minimal because deep trees in a random forest overfit anyway. Set max_depth=10 as a starting point and tune downward until training time is acceptable.\``,
          `\`B) First: check n_jobs=-1 (parallelise across cores) — this is free and often gives 4-16× speedup with no accuracy loss. Second: reduce n_estimators to 100 — the OOB error curve is typically flat past ~100-200 trees; accuracy loss is usually <0.5%. Third: reduce max_features (fewer features evaluated per split — faster splits). Fourth: increase min_samples_leaf (stops growing leaves with few samples — shallower trees, faster). For very large datasets (n > 1M): set max_samples < 1.0 to subsample without replacement per tree. Always verify with the OOB error that the reduced model is within 1% of the full model.\``,
          `\`C) Switch to a gradient boosted model (XGBoost or LightGBM) — they achieve the same or better accuracy as a random forest with far fewer trees (typically 100-300) because each tree corrects the previous one rather than being independent. Training time drops proportionally.\``,
          `\`D) Reduce max_features to 1 — this gives maximum tree diversity and fastest split selection, and since random forests benefit from diverse trees, reducing max_features always improves both speed and accuracy simultaneously.\``,
        ],
        answer: `B`,
      },
      {
        q: `Your random forest's OOB error is 10% but test error is 25%. What does this mean?`,
        options: [
          `\`A) Large OOB-test gap indicates distribution shift or data leakage. OOB error estimates performance on training distribution (same X distribution as training data). A 15% gap means the test data comes from a different distribution than training data — or there was data leakage that made OOB unrealistically optimistic. Investigate: (1) Compare feature distributions between train and test (histogram, KS-test). (2) Check for temporal leakage: if test data is future data and training data includes features computed from the future. (3) Check for target leakage: features that encode the label. OOB error is a reliable estimate only when train and test are iid draws from the same distribution.\``,
          `\`B) The 15% gap is within expected variance for random forests — OOB samples are a biased subsample (only ~37% of training data per tree), which systematically underestimates true test error. A gap up to 20% is normal and does not indicate a problem; report test error and ignore OOB for final evaluation.\``,
          `\`C) The OOB error of 10% means the model is slightly underfitting (train error too high) while the 25% test error means it is simultaneously overfitting. This contradictory result indicates the random forest's n_estimators is at a transition point; add more trees until OOB and test errors converge.\``,
          `\`D) The gap means the number of trees is insufficient — with 500 trees OOB samples are still noisy; the 15% gap shrinks as n_estimators grows. Increase n_estimators to 2000 and the OOB estimate will approach the true test error.\``,
        ],
        answer: `A`,
      },
      {
        q: `Two features both have high Gini importance in a random forest, but when you remove either one individually, model performance barely changes. Explain and fix.`,
        options: [
          `\`A) High Gini importance with minimal impact on removal means the features are important for early splits but redundant for final leaf predictions. The tree's top-level structure depends on them but the leaves can recover accuracy without them. Use partial dependence plots to confirm that both features have flat marginal effects.\``,
          `\`B) The features are important but their effect is non-linear — Gini importance correctly identifies them as important, but your performance metric (e.g., accuracy) is insensitive to their contribution. Measure feature impact using AUC or F1 rather than accuracy, and you will see the expected performance drop.\``,
          `\`C) The result confirms both features are genuinely important and the model is robust — a good random forest should be resilient to removing any single feature because it distributes predictive weight across many features. High individual importance combined with removal resilience is expected for well-trained ensembles.\``,
          `\`D) The two features are highly correlated — they carry the same information. When both are present, the random forest splits on each when the other is unavailable (due to max_features subsampling), giving both high total impurity reduction. But each feature alone is sufficient. Gini importance double-counts correlated features. Fix: (1) Use permutation importance — shuffle each feature while keeping the other, measure accuracy drop. A redundant feature's permutation importance will be near zero when its correlated partner is present. (2) Use SHAP values, which correctly attribute importance in the presence of correlated features. (3) Remove one of the pair: measure OOB error with and without each; keep the one whose removal hurts more.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Random forest variance floor is $ρσ^2$ — set by inter-tree correlation, not tree count; more trees past ~200 barely helps, but reducing max_features reduces $ρ$ and actually lowers the floor.`,
    interactiveId: 'random_forest_viz',
  },
  {
    id: 'gradient_boosting',
    interactiveId: 'gradient_boosting_viz',
    title: 'Gradient Boosting & XGBoost',
    subtitle: 'Residual fitting, shrinkage, XGBoost regularisation, early stopping',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['gradient boosting', 'XGBoost', 'LightGBM', 'ensemble'],
    summary: `A random forest built on loan default data reaches 88% accuracy and stops improving. You add more trees. Nothing changes. The forest has plateaued because each tree is independently trying to predict default from scratch — they share the same systematic errors and averaging cannot remove them. You need a different strategy: instead of training trees independently, train them sequentially, where each new tree explicitly targets what the current ensemble gets wrong.

Start with a weak model — the best constant prediction, say the mean default rate. Compute the residuals: how much is each prediction off? Train a shallow tree to predict those residuals. Add it (scaled by a learning rate $η$) to the ensemble. Compute new residuals. Repeat. Each tree is a corrector — it looks at where the ensemble currently fails and fixes that.

This is not a heuristic. It is gradient descent in function space. The residuals are exactly the negative gradient of the loss function evaluated at the current predictions. For MSE loss, $-\\partial L / \\partial F(x_i) = y_i - F(x_i)$ — the actual residuals. For cross-entropy loss, $-\\partial L / \\partial F(x_i) = y_i - σ(F(x_i))$ — the same prediction-error form. Any differentiable loss produces well-defined pseudo-residuals. The algorithm does not change; only the gradient does. This is why gradient boosting works for custom business losses, quantile regression, and ranking — write down a differentiable loss and the algorithm handles the rest.

The learning rate $η$ scales each tree\`s contribution. Large $η$: fewer trees, faster training, worse generalisation — each tree takes a big jump and overshoots the minimum. Small $η$: more trees, slower training, better generalisation — smaller steps but a better final solution. The right stopping point is not set by $n\_estimators$ in advance. Use early stopping: monitor validation loss after each tree and stop when it stops improving.

XGBoost improves on vanilla gradient boosting in a key way: it uses a second-order Taylor expansion of the loss to derive the optimal leaf weight analytically, $w_j^* = -G_j / (H_j + λ)$, where $G_j$ is the sum of first-order gradients and $H_j$ is the sum of second-order gradients in leaf $j$. The Hessian provides curvature — it tells you how fast the loss is changing, so the update is scaled appropriately. XGBoost also adds explicit regularisation to the split criterion, penalising extra leaves ($γ$) and large leaf weights ($λ$), rejecting splits that do not pass the gain threshold.

**NOT this.** Most people describe gradient boosting as "adding trees to fix mistakes." That is true but it misses the why. The residuals are the gradients of the loss function. Boosting is gradient descent where the step direction is approximated by a shallow tree and the step size is $η$. The framing matters because it tells you how to tune: $η$ is step size, $n\_estimators$ is number of steps, early stopping is the convergence criterion, and tree depth controls the quality of the gradient approximation. Without this framing, you tune blindly.`,
    keyPoints: [
      `**Use gradient boosting when you need maximum accuracy on tabular data and are willing to tune. It is the standard winning algorithm on structured prediction competitions.**\n\nGradient boosting outperforms random forests on most tabular tasks when tuned, because it reduces both bias and variance — random forests only reduce variance. Use XGBoost or LightGBM rather than sklearn\`s GradientBoostingClassifier for real datasets: both are faster, regularised, and support early stopping natively. LightGBM is preferred for n > 100K (leaf-wise growth is faster); XGBoost for smaller datasets where overfitting risk is higher.`,
      `**The production trap: setting n_estimators without early stopping and getting either an underfit or overfit model.**\n\nWith learning_rate=0.1 and n_estimators=1000, the validation loss typically peaks around 200–400 trees and then starts rising as the model begins to memorise training noise. Without early stopping you get the worst of both worlds — you are past the optimal and the model is overfit. Fix: always use early_stopping_rounds (50 is a sensible default). XGBoost and LightGBM will find the optimal tree count automatically. Then, if you want to improve further, lower learning_rate and re-run with early stopping — smaller steps often find a better minimum.`,
      `**The diagnostic: plot training loss and validation loss vs. number of trees. The gap between them and the shape of the validation curve tells you everything.**\n\nValidation loss still falling = underfitting, add more trees (or lower learning rate). Validation loss flat and equal to training loss = well-fitted. Validation loss rising while training loss falls = overfitting — add early stopping, reduce max_depth, increase subsample. If validation loss never comes down at all: check that the learning rate is not too large (start with 0.05–0.1), and that the target variable is correctly scaled for the loss function.`,
    ],
    interactivePrompt: `Before you touch the controls: if you halve the learning rate, do you expect the optimal number of trees to increase, decrease, or stay the same?`,
    checkQuestions: [
      {
        q: `XGBoost is overfitting the training set. List 5 hyperparameters you would tune and the direction of each change.`,
        options: [
          `\`A) (1) Increase learning_rate (0.1→0.3): faster convergence means fewer trees are needed, reducing total model capacity. (2) Increase max_depth (3→8): deeper trees explain variance not captured in shallow leaves. (3) Decrease min_child_weight (10→1): allows splits on smaller groups, fitting residuals more precisely. (4) Set subsample=1.0: using all samples per tree gives more stable gradient estimates and reduces noise. (5) Increase n_estimators: with early stopping, more trees cannot overfit further.\``,
          `\`B) (1) Lower learning_rate (0.3→0.05): more regularisation, slower learning — increase n_estimators to compensate and use early stopping. (2) Reduce max_depth (6→3): shallower trees have less capacity to overfit residuals. (3) Increase min_child_weight (1→10): prevents splits on small groups — the minimum sum of instance weight (Hessian) in a leaf. (4) Add subsample < 1.0 (0.8): stochastic gradient boosting — each tree uses only 80% of training samples, adding noise that regularises. (5) Add colsample_bytree < 1.0 (0.8): feature subsampling like random forests, decorrelates trees. Also: increase lambda (L2 on leaf weights) and gamma (minimum gain for a split).\``,
          `\`C) (1) Lower learning_rate (0.3→0.05): reduces overfitting directly. (2) Reduce max_depth (6→3): reduces capacity. (3) Decrease n_estimators (1000→100): fewer trees means less total capacity. (4) Remove subsample (set to 1.0): stochastic sampling adds variance that amplifies overfitting rather than regularising it. (5) Remove colsample_bytree (set to 1.0): feature subsampling causes information loss that increases both bias and variance.\``,
          `\`D) Switch from XGBoost to a linear model for the residuals at each step — linear weak learners have much lower capacity and cannot overfit residuals the way trees can. Keep all other XGBoost parameters the same; only the base learner type needs to change.\``,
        ],
        answer: `B`,
      },
      {
        q: `Explain why gradient boosting is "gradient descent in function space." What is the function being optimised, and what does each tree compute?`,
        options: [
          `\`A) In parameter-space gradient descent, we update θ in the direction −∇_θ L(θ). In function-space boosting, the "parameter" is the prediction function F, and we update F in the direction that reduces loss most: F_t = F_{t-1} − η·∇_F L(F). The negative gradient ∂L/∂F(xᵢ) at each training point is the pseudo-residual — it tells us how much to change the prediction at xᵢ to reduce loss. Each tree hₜ approximates this gradient function by fitting a shallow tree to the pseudo-residuals. Adding η·hₜ to F is a gradient step in function space. This view explains why boosting works for any differentiable loss: the gradient is always a well-defined direction of improvement, regardless of whether the loss is MSE, log-loss, quantile, or custom.\``,
          `\`B) Gradient boosting is called "gradient descent in function space" because each tree is literally a gradient of the loss function — its leaf weights are the partial derivatives ∂L/∂F for each training point. Summing trees is the same as summing gradients, which is exactly Newton's method applied to the loss function.\``,
          `\`C) The "function space" framing means that gradient boosting optimises over the space of all possible functions, not just trees. Each tree is a basis function; the ensemble is a linear combination of basis functions; gradient descent finds the optimal coefficients. This is identical to a kernel method where the kernels are trees.\``,
          `\`D) Gradient descent in function space means each tree is trained to directly minimise the loss L(F(x), y) over all x simultaneously. The "function" being optimised is the loss landscape itself, and each tree corresponds to one step of a coordinate descent over all training inputs.\``,
        ],
        answer: `A`,
      },
      {
        q: `You train XGBoost with 1000 trees and learning_rate=0.1. The validation loss flattens at tree 200 and then starts increasing. What does this tell you and what should you do?`,
        options: [
          `\`A) The validation loss increase after tree 200 means the learning rate is too high — large steps are overshooting the minimum and the loss oscillates. Lower learning_rate to 0.01 and retrain from scratch with all 1000 trees; the loss will now monotonically decrease past tree 200.\``,
          `\`B) The model is overfitting after tree 200. The optimal n_estimators is ~200, not 1000. The additional 800 trees are memorising training noise. Action: (1) Set early_stopping_rounds=50 and retrain — XGBoost will stop automatically when validation loss does not improve for 50 consecutive rounds, giving the optimal tree count. (2) The optimal model has ~200 trees at learning_rate=0.1. To potentially improve further: lower learning_rate to 0.01 and increase n_estimators to 2000 (with early stopping), as lower LR often finds a better final solution. (3) Also check if overfitting starts earlier with different max_depth or subsample settings.\``,
          `\`C) The validation loss plateau at tree 200 means the model has converged — the loss cannot decrease further regardless of how many trees are added. The subsequent increase is numerical noise in the validation estimate. Keep all 1000 trees since they are needed for stable predictions; removing trees would hurt performance on unseen data.\``,
          `\`D) The validation loss increasing after tree 200 indicates the validation set is too small — with fewer than ~1000 validation examples, validation loss estimates are noisy enough to appear to increase even when the model is improving. Use k-fold CV instead of a held-out validation set to get a reliable stopping criterion.\``,
        ],
        answer: `B`,
      },
      {
        q: `For a regression problem, gradient boosting with MSE loss fits actual residuals at each step. For binary classification with log-loss, what does it fit, and why is the pseudo-residual form the same?`,
        options: [
          `\`A) For log-loss, gradient boosting fits the class probability directly — each tree predicts P(y=1|x) and the ensemble updates P̂ by adding the new tree's probability. The pseudo-residual is P̂(y=1|x) because that is what needs to be corrected toward 1 for positive examples.\``,
          `\`B) For log-loss, gradient boosting fits the log-odds at each step. The pseudo-residual is the log of the current odds ratio log(P̂/(1−P̂)), not a prediction error. This differs fundamentally from the MSE case where residuals are on the response scale — log-loss residuals are on the log-odds scale and require sigmoid transformation before interpretation.\``,
          `\`C) For log-loss, the pseudo-residuals are the same as MSE: actual residuals (y−ŷ). The two losses are equivalent for binary classification because both measure squared deviation from the target, just in different spaces. This equivalence is why cross-entropy and MSE both work for binary classification.\``,
          `\`D) For log-loss: L = −[y log ŷ + (1−y) log(1−ŷ)] where ŷ = σ(F(x)). The pseudo-residual is −∂L/∂F = y − σ(F(x)) = y − ŷ. This is identical in form to the MSE case (y − ŷ) and to the logistic regression gradient. The reason: gradient boosting with log-loss fits the negative gradient of the log-likelihood at the current predictions — which is exactly the residual in the probability scale (y − P̂(y=1|x)). The form (y − ŷ) is universal because all losses from the exponential family have gradients in this form. Gradient boosting with log-loss is equivalent to running many weak logistic-regression-gradient steps, each implemented as a shallow tree.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Gradient boosting is gradient descent in function space: each tree approximates the loss gradient, $η$ is the step size, and early stopping is the convergence criterion — the framing explains every tuning decision.`,
  },
  {
    id: 'ensembles',
    interactiveId: 'ensemble_viz',
    title: 'Ensemble Methods',
    subtitle: 'Bagging vs boosting vs stacking, diversity principle',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['ensembles', 'stacking', 'bagging', 'boosting'],
    summary: `A bank wants to predict loan default. They train a decision tree: 76% accuracy. They try logistic regression: 78%. They try a random forest: 84%. Good, but not good enough. Then they combine all three — majority vote on the binary prediction. The ensemble reaches 86%. The best single model was 84%. Why does combining weaker models beat the best single model?

The answer is that model A is wrong on examples where models B and C happen to be right. When you average their predictions, the errors partially cancel. The correct predictions reinforce. This only works if the errors are not fully correlated — if A fails on exactly the same examples as B and C, averaging does nothing. The diversity principle makes this precise: ensemble error ≈ ε(1 + (T−1)ρ) / T, where ε is individual model error and ρ is pairwise error correlation. With T = 10 models at 20% error: if ρ = 0.9, ensemble error ≈ 18.2%. If ρ = 0.1, ensemble error ≈ 3.8%. The same models, radically different results. Diversity is the only lever that actually moves the floor.

Bagging, boosting, and stacking are three strategies for building diverse ensembles on the loan default problem. Bagging trains T models on T bootstrap samples of the training data and averages predictions — each model sees a different slice of the data, which decorrelates their errors and reduces variance. Random forest is bagging applied to decision trees with an additional feature-subsampling trick at each split. Boosting trains models sequentially: each new model focuses on the examples the current ensemble gets wrong. This targets bias rather than variance, and is why gradient boosting often beats random forest on hard tabular tasks. Stacking is the most general approach: train diverse base models (a tree, a logistic regression, a neural net), use their out-of-fold predictions as features, and train a meta-learner to combine them. The meta-learner learns which base model to trust in which region of the input space.

The stacking trap is subtle. If you train base models on the full training set, then feed their training-set predictions to the meta-learner, the meta-learner sees information-leaked inputs — each base model perfectly predicts its own training examples, and those near-perfect outputs train the meta-learner to trust a signal that will not exist at test time. The fix is out-of-fold predictions: train each base model on k−1 folds, predict on fold k. These held-out predictions represent genuine generalization, not memorization.

**NOT this.** More models always improve an ensemble. Diversity, not quantity. Adding a model that is perfectly correlated with an existing one contributes nothing — the marginal value of adding model M to ensemble E is proportional to (1 − correlation between M's errors and E's errors). Two models with 80% accuracy but uncorrelated errors can ensemble to 96%. Two models with 80% accuracy and fully correlated errors ensemble to 80%. This is why running five random forests with different random seeds gives almost no gain, but adding a logistic regression to one random forest can give a meaningful lift.

The formal statement for the ensemble variance floor: Var(ensemble) = ρσ² + (1 − ρ)σ²/T. As T grows, the second term shrinks to zero and the floor is ρσ². Adding more trees past ~200 does not reduce ρ — only adding qualitatively different model families does.`,
    keyPoints: [
      `**Build a stacking ensemble when you have multiple model families (trees, linear, neural nets) and a large enough dataset for out-of-fold predictions — it almost always beats any individual model by 1–3 points at the cost of training time.**\n\nIn the loan default setting: combine random forest (AUC 0.83), gradient boosting (AUC 0.85), and logistic regression (AUC 0.79) with a ridge-regularized meta-learner on OOF predictions. The meta-learner discovers that gradient boosting dominates on high-income applicants while logistic regression is more reliable on thin-file applicants — their complementary strengths produce a stacked AUC of 0.88.`,
      `**Trap: evaluating base models on training data before training the meta-learner creates leakage — the meta-learner memorizes which model was overfit on which examples.**\n\nIn the loan default stack: if the decision tree's training-set predictions are used as meta-features, the tree achieves near-perfect accuracy on its training examples (it memorized them). The meta-learner learns to trust the tree's very-high-confidence outputs, which only exist because of memorization. At test time, those outputs are calibrated to the training distribution, not the test distribution. The meta-learner has been trained on a lie. Always use out-of-fold predictions. sklearn's cross_val_predict with method='predict_proba' generates them in one call.`,
      `**Diagnostic: measure the per-model error correlation matrix on validation set errors. If all ensemble members have error correlation > 0.9, you are not gaining diversity — add a qualitatively different model family or apply feature subsampling.**\n\nFor the loan default ensemble: compute the binary error vector (1 = wrong, 0 = correct) for each model on a held-out validation set. Compute pairwise Pearson correlation. If the decision tree and the random forest have error correlation 0.95, they are essentially the same model for ensemble purposes. Adding a 50th random forest to the ensemble would raise correlation further and help nothing. The solution is to add a model trained on a fundamentally different feature representation — for example, adding interaction features that the tree family never sees.`,
    ],
    interactivePrompt: `Before you touch the controls: if you replace one model in the ensemble with an identical copy of an existing model (same algorithm, same hyperparameters, same training data), do you expect the ensemble accuracy to go up, stay the same, or go down?`,
    checkQuestions: [
      {
        q: `Your stacking ensemble overfits: high training accuracy but low CV accuracy on the meta-learner. What is the likely cause and fix?`,
        options: [
          `\`A) The meta-learner is too complex — a deep neural network or high-capacity model as meta-learner will memorise the base model output patterns from training data. Replace the meta-learner with a simple linear model (logistic regression with no regularisation) to prevent it from overfitting the base model outputs.\``,
          `\`B) The base models are too similar — if multiple random forests are in the stack, they produce correlated outputs that confuse the meta-learner into finding spurious patterns. Remove all but one random forest and replace with a qualitatively different model class to increase diversity.\``,
          `\`C) Data leakage in meta-features. If base models were trained on the full training set and their training-set predictions were used as meta-features, the meta-learner sees optimistically good predictions — base models have memorised the training labels, so their training-set outputs are near-perfect even for hard examples. The meta-learner learns to trust these over-optimistic signals and fails on validation data. Fix: generate meta-features using out-of-fold (OOF) predictions — each base model is trained on k-1 folds and predicts on the held-out fold k. These OOF predictions represent what the base models can genuinely generalise to, not what they memorised.\``,
          `\`D) The training set is too large relative to the meta-learner's capacity. With many training examples, the meta-learner finds complex patterns in the base model outputs that do not generalise. Subsample the training set to roughly 10× the number of base models before fitting the meta-learner.\``,
        ],
        answer: `C`,
      },
      {
        q: `You have three diverse models: a random forest (AUC=0.82), gradient boosting (AUC=0.85), and logistic regression (AUC=0.78). How would you build an ensemble, and what AUC would you expect?`,
        options: [
          `\`A) Start with simple averaging of probability outputs: ensemble_score = (0.33×RF_prob + 0.33×GBM_prob + 0.33×LR_prob). Evaluate on a held-out set — simple averaging often achieves AUC 0.86-0.87, slightly above the best single model. Next try weighted averaging: weights proportional to individual AUCs, optimised on a validation set (e.g., 0.25×RF + 0.50×GBM + 0.25×LR). If that helps, try stacking with OOF predictions as meta-features and a ridge-regularised logistic regression as meta-learner. The gain comes from diversity: RF and GBM make different errors (RF uses random feature subsets, GBM does sequential residual fitting), so their errors partially cancel.\``,
          `\`B) Drop logistic regression (AUC=0.78) — it is the weakest model and including it will drag down the ensemble below GBM's 0.85 AUC. Build the ensemble with RF and GBM only using a weighted average with weights proportional to AUC² (0.40×RF + 0.60×GBM). Expected AUC: 0.87-0.88.\``,
          `\`C) Build a boosting ensemble where the residuals of GBM (the best single model) are passed as the target for RF and logistic regression sequentially. This extends the boosting principle from trees to different model classes and should achieve AUC ~0.91 by targeting the specific examples GBM gets wrong.\``,
          `\`D) Use majority voting: the prediction is the class that at least 2 of the 3 models agree on. This is more robust than probability averaging because it is not affected by probability miscalibration. Expected AUC: equal to the median model (0.82), since majority voting cannot exceed the middle-ranking model's performance.\``,
        ],
        answer: `A`,
      },
      {
        q: `Two models make identical errors on the test set: wherever model A is wrong, model B is wrong on the same examples. What is the ensemble's test accuracy, and what does this illustrate about diversity?`,
        options: [
          `\`A) Ensemble accuracy = average of the two models' accuracies. Since both models make errors on the same examples but may disagree on the correct label, the ensemble averages their probabilities — this always improves over the weaker model and matches the stronger model at best.\``,
          `\`B) Ensemble accuracy = individual model accuracy — no improvement at all. The diversity principle: if models make identical errors (correlation ρ=1), averaging does nothing because the errors do not cancel. The ensemble error formula: ε_ensemble ≈ ε(1+(T-1)ρ)/T. With ρ=1 and T=2: ε_ensemble ≈ ε(1+1)/2 = ε. This is why using the same algorithm with different random seeds gives minimal gain (high ρ), while combining a neural network and a gradient boosted tree gives more gain (different inductive biases lead to different error patterns, lower ρ).\``,
          `\`C) Ensemble accuracy = higher of the two models' individual accuracies. Identical errors mean both models agree on mistakes, but the confidence of the correct model is higher on examples it gets right — probability averaging amplifies the signal from correct predictions and the ensemble attains max(acc_A, acc_B).\``,
          `\`D) The ensemble has undefined accuracy — if both models make identical errors they both agree on wrong labels, meaning the ensemble's probability output is confidently wrong on those examples. This creates a systematic bias that can only be corrected by adding a third model with independent errors.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Ensemble gains come from error diversity, not model count — the variance floor is ρσ², set entirely by inter-model error correlation, so adding more copies of the same algorithm does almost nothing while adding a qualitatively different model family can drop error by several points.`,
    interactiveId: 'ensemble_viz',
  },
  {
    id: 'svm',
    interactiveId: 'svm_viz',
    title: 'Support Vector Machines',
    subtitle: 'Maximum-margin hyperplane, kernel trick, soft margin',
    difficulty: 'advanced',
    estimatedMin: 30,
    tags: ['SVM', 'kernel', 'margin', 'dual'],
    summary: `You are classifying loan applicants as default or no-default. You have a linearly separable training set — there exists some line that perfectly separates the two classes. Logistic regression will find one such line, whichever one minimises cross-entropy loss. But there are infinitely many separating lines. Which one do you want?

SVMs say: the one that is furthest from all training points. If you draw the two parallel boundary lines that touch the nearest points from each class, the space between them is the margin. A wider margin means more room for error — new test points that fall near the boundary are more likely to land on the correct side. Maximize the margin and you minimize the worst-case generalization error. This is the structural risk minimization principle.

[FIGURE: svm_margin]

Only a subset of training points define the boundary. The points that sit exactly on the margin edges — the closest points to the boundary — are the support vectors. Move any other training point and the boundary does not change at all. This sparsity is a structural property of the solution: the entire decision boundary is determined by a small minority of training examples.

Real data is not linearly separable. The soft-margin extension introduces slack variables $ξ_i \\geq 0$: allow some points to violate the margin, but penalise each violation with cost $C$. Large $C$: tight margin, few violations, the model tries to classify everything correctly, prone to overfitting. Small $C$: wide margin, allows more violations, smoother boundary, better generalisation. C is the bias-variance dial.

The kernel trick makes non-linear boundaries possible without changing the algorithm. The dual form of the SVM only needs dot products $x_i^T x_j$ between training points — it never needs the feature vectors explicitly. Replace each dot product with a kernel function $k(x_i, x_j) = φ(x_i)^Tφ(x_j)$ for some mapping $φ$. The RBF kernel $k(x, x') = \\exp(-γ \|x - x'\|^2)$ corresponds to an infinite-dimensional feature space. You never compute $φ(x)$ — you only compute $k(x_i, x_j)$, which is cheap. The SVM finds a linear separator in the infinite-dimensional space, which appears non-linear back in the original space.

**NOT this.** Most people think "SVMs are about the kernel." The kernel is how you apply maximum margin to non-linear boundaries — but maximum margin is the core idea, and the kernel is just a tool. Many practitioners can explain RBF kernels but cannot explain why maximum margin generalises well (structural risk minimization — the margin controls the VC dimension of the classifier). Without the why, you cannot diagnose when SVMs fail or explain their behavior to a stakeholder.

The hard limit: SVMs stall at $n > 50\\text{K}$. The kernel matrix $K$ where $K_{ij} = k(x_i, x_j)$ requires $O(n^2)$ memory — 80GB for $n = 100\\text{K}$ in float64. Training time is $O(n^2)$ to $O(n^3)$. For large datasets, use gradient boosting or linear models with SGD.`,
    keyPoints: [
      `**Use kernel SVMs when n < 50K, the feature space is moderate-dimensional, and you have reason to believe the data is separable with a wide margin (e.g., clean binary classification with low noise).**\n\nSVMs excel on small, clean datasets with well-defined boundaries — classic use cases include bioinformatics, text classification with TF-IDF features (linear SVM), and image patches. For n > 50K, switch to sklearn\`s LinearSVC (liblinear solver, O(nd) time) or SGDClassifier with hinge loss. Always StandardScaler before any SVM — the RBF kernel uses Euclidean distance and an unscaled feature with range [0, 1000] will dominate a feature with range [0, 1] regardless of predictive value.`,
      `**The production trap: tuning C and γ separately instead of jointly, and forgetting to scale features.**\n\nC and γ interact: C=10, γ=0.01 produces a very different boundary than C=10, γ=10. A coarse grid search that sweeps C with fixed γ will miss the optimum. Always use a 2D grid on log scale: C ∈ {0.01, 0.1, 1, 10, 100}, γ ∈ {0.001, 0.01, 0.1, 1, 10}. The interaction means you need 25 combinations minimum, not 5 + 5. Missing feature scaling is the single most common reason for SVM underperformance — a single unscaled feature can make the kernel compute pure noise.`,
      `**The diagnostic: count the support vectors. Too many (> 50% of training data) means C is too large or γ is too small — the boundary is effectively ignoring the margin constraint. Too few may mean underfitting.**\n\nA well-calibrated SVM typically has 5–30% of training examples as support vectors. Run svm.n_support_ after fitting. If it is near n, reduce C or increase γ to enforce a wider margin. Check test accuracy on a held-out set and compare to a logistic regression baseline — if they are within 1–2%, the kernel is not buying you anything and logistic regression is the simpler, faster choice.`,
    ],
    interactivePrompt: `Before you touch the controls: if you move a training point that is far from the decision boundary to a completely different location, do you expect the boundary to change?`,
    checkQuestions: [
      {
        q: `Your SVM with RBF kernel underfits the training data. What do you adjust, and what is the risk of each change?`,
        options: [
          `\`A) Underfitting means the model is too simple. Switch from RBF kernel to a polynomial kernel with degree=5 — higher-degree polynomial kernels have more capacity and will fit the training data better. Risk: polynomial kernels are numerically unstable at high degrees.\``,
          `\`B) Underfitting with RBF SVM means C is too high — the model is penalising slack variables too heavily, forcing the boundary to accommodate all training points even when they are noisy. Reduce C (e.g., C=0.01) to allow more margin violations and let the boundary smooth out.\``,
          `\`C) Underfitting means the feature space is too low-dimensional. Add polynomial features (degree 2 or 3) to the raw input before training the RBF SVM — this expands the effective feature dimension and gives the kernel more signal to work with.\``,
          `\`D) Underfitting means the margin is too wide and the decision boundary is too smooth. Adjustments: (1) Increase C (allow fewer margin violations — tighter fit to training data). Risk: overfitting — the boundary becomes wiggly and does not generalise. (2) Increase γ (tighter, more localised RBF kernel — each support vector influences a smaller region). Risk: overfitting — at high γ, the model memorises training data with tiny "bubbles" around each point. Grid search over (C, γ) on log scale: C ∈ {0.01, 0.1, 1, 10, 100}, γ ∈ {0.001, 0.01, 0.1, 1, 10}. In practice: try the default C=1, gamma='scale' first — often competitive with tuned values.\``,
        ],
        answer: `D`,
      },
      {
        q: `Explain the kernel trick. Why does it work, and what mathematical condition must a function k(x,x') satisfy to be a valid kernel?`,
        options: [
          `\`A) The kernel trick replaces each training point xᵢ with its feature map φ(xᵢ) before computing the SVM. Since φ maps to a higher-dimensional space, the SVM finds a linear separator there that appears non-linear in the original space. The condition: φ must be a bijection (one-to-one), guaranteeing that the original and mapped problems have equivalent solutions.\``,
          `\`B) The kernel trick works because the SVM dual objective only requires pairwise dot products xᵢᵀxⱼ — it never explicitly uses the feature vectors. By Mercer's theorem, any function k(x,x') = φ(x)ᵀφ(x') for some (possibly infinite-dimensional) φ can be substituted for these dot products. The condition: k must be a symmetric positive semi-definite function (the Gram matrix K where Kᵢⱼ = k(xᵢ,xⱼ) must be PSD for all datasets). This guarantees k corresponds to a valid dot product in some feature space. The magic: we get the computational benefit of working in a high-dimensional space (rich features) without the computational cost of computing φ(x) (which may be infinite-dimensional). The kernel matrix K is n×n regardless of the dimensionality of φ.\``,
          `\`C) The kernel trick works by approximating the inner product in feature space using a Taylor expansion of k(x,x'). The condition for validity is that the Taylor series converges uniformly on the training data — functions like RBF satisfy this because they are entire functions (analytic everywhere), while polynomial kernels are valid only up to a bounded degree.\``,
          `\`D) The kernel trick avoids explicit feature maps by computing similarity scores k(xᵢ,xⱼ) directly from raw inputs. The condition: k must be a monotone decreasing function of distance ‖xᵢ−xⱼ‖ — this ensures that closer points are more similar and the SVM boundary is locally consistent. The RBF kernel satisfies this; the polynomial kernel does not, which is why RBF is preferred.\``,
        ],
        answer: `B`,
      },
      {
        q: `SVMs and logistic regression both find a linear separator. In what situations would you prefer one over the other?`,
        options: [
          `\`A) Prefer SVM when: (1) The dataset is small (n < 10K) and high-dimensional — SVMs have better theoretical guarantees (margin maximisation) in this regime. (2) The classes are well-separated — hard-margin or small-slack SVM exploits this. (3) You need a kernel for non-linear boundaries and cannot engineer features. Prefer logistic regression when: (1) You need calibrated probability outputs — SVM outputs distances, not probabilities (Platt scaling fixes this but adds complexity). (2) Large datasets (n > 100K) — LR scales linearly in n, SVM does not. (3) Interpretability matters — LR coefficients are log-odds ratios; SVM weights have less direct interpretation. (4) You want a fast baseline — LR trains in seconds.\``,
          `\`B) Always prefer logistic regression over SVM for linear separation: logistic regression is strictly more general — it learns the same weight vector as a linear SVM when the data is separable, and additionally provides calibrated probability outputs. SVM's maximum-margin criterion is a special case of logistic regression with a specific choice of regularisation.\``,
          `\`C) Prefer SVM whenever class imbalance is present: the maximum-margin criterion is independent of class frequencies, whereas logistic regression's cross-entropy loss gives more gradient updates to the majority class, biasing the boundary. SVM's support vector selection ignores class proportions and finds the optimal geometric separator.\``,
          `\`D) Prefer logistic regression for all practical applications: SVMs were developed before logistic regression became computationally tractable at scale, and every advantage of SVM (kernel, margin) can be replicated in logistic regression with appropriate feature engineering and regularisation. SVMs are only used for academic benchmarks now.\``,
        ],
        answer: `A`,
      },
    ],
    takeaway: `SVMs maximise the margin — the gap between classes — and only the points on the margin edge (support vectors) determine the boundary; the kernel trick substitutes dot products with kernel evaluations to get non-linear boundaries without computing the feature map.`,
    interactiveId: 'svm_viz',
    figures: {
      svm_margin: `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:400px;font-family:var(--font-sans,sans-serif)">
  <!-- decision boundary -->
  <line x1="60" y1="220" x2="340" y2="40" stroke="var(--ink-hi)" stroke-width="2"/>
  <!-- margin lines -->
  <line x1="30" y1="210" x2="310" y2="30" stroke="var(--ink-mid)" stroke-width="1.2" stroke-dasharray="6,4"/>
  <line x1="90" y1="230" x2="370" y2="50" stroke="var(--ink-mid)" stroke-width="1.2" stroke-dasharray="6,4"/>
  <!-- margin label -->
  <text x="50" y="135" fill="var(--ink-low)" font-size="10" transform="rotate(-38,50,135)">margin = 2/‖w‖</text>
  <!-- class + circles (upper right) -->
  <circle cx="280" cy="60" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="310" cy="90" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="340" cy="70" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="300" cy="110" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="260" cy="80" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <!-- class - crosses (lower left) -->
  <g stroke="var(--amber)" stroke-width="2">
    <line x1="70" y1="165" x2="84" y2="179"/><line x1="84" y1="165" x2="70" y2="179"/>
    <line x1="100" y1="190" x2="114" y2="204"/><line x1="114" y1="190" x2="100" y2="204"/>
    <line x1="50" y1="195" x2="64" y2="209"/><line x1="64" y1="195" x2="50" y2="209"/>
    <line x1="120" y1="175" x2="134" y2="189"/><line x1="134" y1="175" x2="120" y2="189"/>
    <line x1="80" y1="210" x2="94" y2="224"/><line x1="94" y1="210" x2="80" y2="224"/>
  </g>
  <!-- support vectors with rings -->
  <circle cx="260" cy="80" r="12" fill="none" stroke="var(--prime)" stroke-width="1.5" opacity="0.6"/>
  <circle cx="70" cy="172" r="12" fill="none" stroke="var(--amber)" stroke-width="1.5" opacity="0.6"/>
  <circle cx="120" cy="182" r="12" fill="none" stroke="var(--amber)" stroke-width="1.5" opacity="0.6"/>
  <!-- labels -->
  <text x="330" y="55" fill="var(--prime)" font-size="10" font-weight="700">+1</text>
  <text x="55" y="240" fill="var(--amber)" font-size="10" font-weight="700">−1</text>
  <text x="175" y="25" fill="var(--ink-hi)" font-size="10" text-anchor="middle">decision boundary</text>
  <line x1="175" y1="28" x2="195" y2="45" stroke="var(--ink-low)" stroke-width="0.8"/>
</svg>`,
    },
  },
  {
    id: 'knn',
    interactiveId: 'knn_viz',
    title: 'K-Nearest Neighbours',
    subtitle: 'Distance metrics, curse of dimensionality, ANN indexes',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['KNN', 'distance metrics', 'ANN'],
    summary: `A handwritten digit arrives as a 28×28 pixel image. You need to classify it. A decision tree would learn a set of pixel-threshold rules at training time. Logistic regression would learn a weight for every pixel. kNN does neither: it stores all 60,000 training images and at prediction time finds the 3 most similar training images by Euclidean distance across all 784 pixels, then takes a majority vote. Zero training time. A new "7" finds three sevens in the training set, votes 3-0, classification done.

The price arrives at query time. Each prediction requires computing the distance from the test image to all 60,000 training images across 784 dimensions: 60,000 × 784 = 47 million multiplications per query. At 1,000 queries per second, that is 47 billion multiplications per second — feasible on fast hardware for MNIST, but already impractical for 1 million images. kNN does not generalize through learned parameters; it memorizes. The entire training set is the model.

Feature scaling is not optional. Age ranges from 0 to 100. Income ranges from 0 to 500,000. Without standardization, a $1 difference in income contributes 5,000× more to Euclidean distance than a 1-year age difference. The nearest neighbors are found entirely in the income dimension. A 50-year-old on $50K looks identical to a 1-year-old on $50K. StandardScaler before kNN is non-negotiable.

The deeper failure mode is dimensionality. kNN works because nearby points in feature space share labels — local homogeneity. In high dimensions, that assumption breaks. As the number of dimensions grows, the ratio of the distance to the nearest neighbor versus the farthest neighbor converges toward 1. Every point becomes approximately equidistant from every other. The neighborhood concept collapses: there is no meaningful local structure, only a global average. With d = 100, k = 10 nearest neighbors are barely more similar to the query than randomly drawn points.

The production resurrection of kNN is approximate nearest neighbor search. FAISS, HNSW, and ScaNN build indexes that find approximate nearest neighbors in O(log n) instead of O(n). HNSW at 95% recall@10 queries 10 million vectors in under 1 millisecond. Every embedding-based recommendation system, every vector database (Pinecone, Weaviate, Chroma), and every dense retrieval system in a RAG pipeline is kNN with an approximate index. The algorithm is from the 1960s; the implementation is state of the art.

**NOT this.** kNN is a toy algorithm that does not scale. Nearest-neighbor search is the production architecture for modern retrieval. When a language model generates a query embedding and retrieves relevant documents, it is running kNN against an index of millions of passage embeddings. When a recommendation system finds the top-50 similar users to target for a new item, it is running kNN against a user embedding matrix. The algorithm is ancient. The feature spaces it operates on — dense embeddings from transformers — are not.

The formal statement: exact kNN is O(nd) per query where n is the number of indexed vectors and d is the dimensionality. ANN indexes reduce this to O(d log n) or better, with recall controlled by a search parameter. For the digit classifier: n = 60,000, d = 784, brute force takes ~47M ops. For a production recommendation system: n = 10M, d = 256, brute force takes ~2.56B ops per query — ANN takes ~600K ops at 95% recall.`,
    keyPoints: [
      `**Always use ANN (FAISS, HNSW) when n > 100K — exact kNN is O(n) per query and completely infeasible at scale. HNSW gives sub-millisecond search over 100M vectors at 95%+ recall.**\n\nFor the digit classifier at 60K training images, brute-force kNN runs in ~1ms per query on modern hardware — acceptable. Scale to 10M items and exact kNN takes ~160ms per query, which kills any real-time system. HNSW reduces this to under 1ms at 95% recall@10. The transition point: once n exceeds ~100K, reach for FAISS or HNSW before any other optimization. The recall-speed tradeoff is controllable via the ef (search width) parameter — set it higher for better recall, lower for lower latency.`,
      `**Trap: forgetting to scale features. If feature ranges differ by 1000×, kNN sees only the largest-range feature. StandardScaler or L2-normalize embeddings before indexing — this mistake silently destroys retrieval quality with no obvious error.**\n\nFor the digit classifier: pixel values range from 0 to 255, so scaling is uniform and kNN works correctly. For a user-feature matrix with age (0–100) and annual income (0–500,000), raw Euclidean distance finds "nearest neighbors" by income alone. A 20-year-old earning $80K is identified as nearest to a 65-year-old earning $80,001, ignoring the 45-year age gap. StandardScaler brings both features to unit variance. For embedding vectors from transformers: L2-normalize before indexing so that cosine similarity equals the dot product — the default in FAISS's IndexFlatIP.`,
      `**Diagnostic: if kNN performance is unexpectedly poor, check the intra-cluster distance distribution — if all distances are similar (high-dimensional degenerate case), reduce dimensionality with PCA or switch from Euclidean to cosine similarity.**\n\nFor the digit classifier: compute the distribution of distances from each test point to its 10 nearest neighbors. If the min and max distances are nearly identical (e.g., min 18.2, max 19.1 across 60,000 candidates), the curse of dimensionality is active — the 784-dimensional space has too many uninformative pixel dimensions. Fix: apply PCA to retain the top 50 components explaining ~85% of variance, then run kNN in 50 dimensions. Alternatively, switch from raw pixels to learned embeddings from a CNN — the 128-dimensional embedding space concentrates all discriminative information, and kNN in that space is highly effective.`,
    ],
    interactivePrompt: `Before you touch the controls: if you add 500 random noise dimensions to the digit feature vectors alongside the original 784 pixel dimensions, do you expect kNN accuracy to go up, stay roughly the same, or drop significantly?`,
    checkQuestions: [
      {
        q: `Why does KNN fail in 1000 dimensions even with millions of training points?`,
        options: [
          `\`A) In high dimensions, the training data becomes increasingly sparse — millions of points spread across a 1000-dimensional space leave most of the volume empty. KNN fails because there are genuinely no neighbours within any meaningful radius; adding more training data fills the space and restores KNN performance.\``,
          `\`B) KNN's O(nd) inference time becomes prohibitive at d=1000 — querying a single point against millions of training points takes seconds. The failure is purely computational, not geometric; approximate nearest-neighbour indexes restore KNN performance at d=1000 with sub-millisecond queries.\``,
          `\`C) Curse of dimensionality: in d=1000 dimensions, the distance from a query point to its nearest neighbour converges to nearly the same value as the distance to its farthest neighbour. The distribution of pairwise distances becomes concentrated — the coefficient of variation of distances shrinks to 0 as d grows. The k nearest neighbours are no longer geometrically "local" to the query point — they are nearly as far as random points. The local averaging that makes KNN work (nearby points have similar labels) breaks down when "nearby" means "within 1000 dimensions of noise." Fix: dimensionality reduction (PCA, UMAP) or learned metric/embedding before applying KNN.\``,
          `\`D) At d=1000, Euclidean distance violates the triangle inequality — distances between random points are no longer consistent, so the concept of "nearest neighbour" is undefined. Switching to cosine similarity restores the metric property and allows KNN to work correctly in high dimensions without dimensionality reduction.\``,
        ],
        answer: `C`,
      },
      {
        q: `A production recommendation system uses KNN with n=50M items and d=256-dimensional embeddings. Brute-force KNN is too slow. What is your architecture?`,
        options: [
          `\`A) Use an ANN index. Process: (1) Offline: build an HNSW index or FAISS IVF index on the 50M item embeddings. HNSW is preferred for high-recall requirements; FAISS IVF is preferred for memory-constrained systems. (2) Online: for each user query embedding, query the index for the top-k approximate nearest neighbours (e.g., top-100 candidates). (3) Re-rank: apply a more expensive scoring function (dot product, learned ranker) to the top-100 candidates. This is the retrieve-and-rerank pattern. Performance: HNSW achieves >95% recall@10 with queries in ~1ms for 50M items — vs. ~10s for brute force. Tradeoff: index takes O(n·d) memory plus graph structure overhead.\``,
          `\`B) Reduce the embeddings from d=256 to d=16 using PCA before building the index. At d=16, brute-force KNN over 50M items takes ~0.1ms per query — fast enough for production. The recall loss from PCA compression is typically 2-5% for recommendation tasks, which is acceptable.\``,
          `\`C) Shard the 50M items across 100 machines, each holding 500K items. Run brute-force KNN in parallel across all shards and aggregate the top-k from each shard. This horizontal scaling approach achieves sub-100ms latency with no accuracy loss and avoids the complexity of approximate index data structures.\``,
          `\`D) Pre-compute all pairwise similarities offline and store the top-1000 neighbours per item in a lookup table. At query time, retrieve the pre-computed neighbours in O(1). The offline storage cost is 50M × 1000 × 8 bytes ≈ 400GB, which is manageable with modern object storage.\``,
        ],
        answer: `A`,
      },
      {
        q: `When would you choose KNN over a trained classifier like logistic regression or a decision tree?`,
        options: [
          `\`A) Choose KNN when the dataset is very large (n > 1M) — KNN requires no training time, while logistic regression and trees scale with O(n) or O(n log n). For massive datasets, KNN's zero training cost outweighs its higher inference cost, especially when batch predictions are needed.\``,
          `\`B) Choose KNN when the features are all categorical — distance-based metrics like Hamming distance work better than logistic regression's log-odds coefficients for categorical inputs. KNN with Hamming distance consistently outperforms tree models on purely categorical tabular data.\``,
          `\`C) Choose KNN whenever the class prior P(y=1) is below 10% — rare class detection is where KNN excels because it uses local density estimation near the rare class and is unaffected by the global class imbalance that biases logistic regression and tree splits.\``,
          `\`D) Choose KNN when: (1) The decision boundary is highly non-linear and irregular — KNN adapts to any boundary shape without feature engineering. (2) The training set is very small and the feature space is low-dimensional (d < 20) — KNN with k=5 often outperforms logistic regression that has too few samples to estimate coefficients reliably. (3) You need online learning — adding a new training point to KNN requires no retraining, just appending to the index. (4) Instance-based explanations matter — "your prediction is X because your nearest neighbours are A, B, C" is intuitive. Prefer logistic regression or trees when: large n (KNN inference is O(nd)); high d; need probability outputs; training time is not a constraint.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `kNN makes one bet — nearby points share labels — so the distance metric and the feature space are the model, k is just a smoothing parameter, and in high dimensions that bet fails because all distances converge; the production answer is ANN indexing over learned embeddings where the space is built to make proximity meaningful.`,
    interactiveId: 'knn_viz',
  },
  {
    id: 'naive_bayes',
    interactiveId: 'bayes_calculator',
    title: 'Naïve Bayes',
    subtitle: 'Independence assumption, Gaussian NB, Laplace smoothing',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['Naive Bayes', 'independence', 'text classification'],
    summary: `An email arrives: "Claim your FREE prize NOW." You need to classify it as spam or ham in milliseconds. You have word frequency statistics from training: P(FREE|spam) = 0.45, P(FREE|ham) = 0.01, P(prize|spam) = 0.32, P(prize|ham) = 0.002, P(Claim|spam) = 0.18, P(Claim|ham) = 0.04. Bayes' theorem gives the posterior: P(spam|words) ∝ P(spam) × P(FREE|spam) × P(prize|spam) × P(Claim|spam) × .... You multiply across all words in the email. Whichever class — spam or ham — gives the larger product wins.

The "naive" assumption is that words are conditionally independent given the class. This is obviously false. "Stock" and "market" co-occur constantly. "Credit" and "card" cluster together. The joint P(stock, market|spam) is nothing like P(stock|spam) × P(market|spam). The model is provably wrong about the joint distribution. Yet it works. The reason: you do not need the correct probability, only the correct ranking. Is P(spam|words) > P(ham|words)? Naive Bayes gets the ordering right even when the individual probabilities are wrong, because the errors in the independence assumption tend to be symmetric — both classes' probabilities are over-estimated by roughly the same factor.

One failure mode is deterministic. A word not seen in any training spam email has P(word|spam) = 0. One unseen word → the entire product P(x|spam) = 0 → P(spam|x) = 0 → the model can never classify any email containing that word as spam, regardless of all other evidence. A single "zarflax" in the email makes it immune to spam classification. Laplace smoothing fixes this: add 1 to all word counts before computing probabilities, making P(new_word|spam) = 1/(n_spam + vocab_size). Never exactly zero.

The three variants handle different data types. Multinomial NB uses word counts, treating each email as a bag of word draws from a class-conditional multinomial — the right choice for text. Bernoulli NB uses word presence or absence, ignoring count information — faster but less informative. Gaussian NB models continuous features as Gaussian distributions per class, fitting one mean and one variance per feature per class. For the spam filter, Multinomial NB is correct. For a dataset with continuous medical measurements, Gaussian NB is correct. Applying Gaussian NB to text, or Multinomial NB to continuous features, produces silently wrong models.

**NOT this.** Naive Bayes is too simple for real use. For high-dimensional sparse features — text, categorical bags — Naive Bayes is competitive with SVMs and logistic regression while training in milliseconds on a single pass through the data. With 10,000 vocabulary items and 100 training documents, logistic regression has 10,000 parameters to estimate and overfits severely even with strong regularization. Naive Bayes has 10,000 simple count estimates that are stable at any sample size. It is still deployed in production spam filters and intent classifiers where training speed, interpretability, and stability with small data matter more than 1–2 percentage points of accuracy against a tuned neural classifier.

The formal statement: ŷ = argmax_k [log P(y=k) + Σⱼ log P(xⱼ|y=k)]. Always compute in log-space. Multiplying thousands of probabilities like 0.001 causes floating-point underflow to exactly zero before the product completes. Log-space turns the product into a sum, eliminating underflow entirely.`,
    keyPoints: [
      `**Use Gaussian NB for continuous features as a fast, interpretable baseline — it trains in O(nd) and gives a probability estimate. If it performs well, there may not be complex feature interactions worth modeling.**\n\nFor a medical dataset with 20 continuous features and 500 patients, Gaussian NB trains in one pass — compute the mean and variance of each feature for each class. Prediction: for a new patient, compute the Gaussian log-likelihood of each feature value under each class's distribution, sum the logs, add the log prior, take the argmax. No gradient descent, no hyperparameter tuning. If Gaussian NB achieves AUC 0.78 and a tuned gradient boosted tree achieves 0.82, the marginal value of the complex model is 4 points — often not worth the engineering cost and opacity.`,
      `**Trap: forgetting Laplace smoothing. A single unseen word in a test document zeroes out the entire posterior. Always use α > 0 (sklearn default α = 1).**\n\nFor the spam filter: training vocabulary is 50,000 words. A new test email contains the word "cryptocurrency" which appeared in no training spam examples. Without smoothing: P(cryptocurrency|spam) = 0. The entire P(x|spam) product becomes 0. P(spam|x) = 0. No matter how many other spam-indicating words appear — FREE, prize, Claim, urgent — the email will never be classified as spam. With Laplace smoothing: P(cryptocurrency|spam) = 1 / (n_spam_tokens + 50,000) ≈ 0.00002. Small but nonzero. The other spam signals dominate. The email is correctly classified as spam.`,
      `**Diagnostic: if Naive Bayes predicts near 0.0 or 1.0 with very high confidence on most examples, the independence assumption is badly violated and the probabilities are not calibrated — use the predictions for ranking only, not as probabilities.**\n\nFor the spam filter: if 90% of test emails get P(spam) > 0.999 or P(spam) < 0.001, the model is over-counting correlated evidence. "FREE" and "prize" and "WIN" all appear together in spam — each one multiplies the spam probability by a large factor, but those factors are not independent signals. The product over-saturates. In the reliability diagram, predictions near 1.0 correspond to actual spam rates of only 0.75. Apply Platt scaling: fit a logistic regression on the NB log-odds using a held-out calibration set. The ranking stays correct; the probabilities become honest.`,
    ],
    interactivePrompt: `Before you touch the controls: if "FREE" appears three times in an email, does Multinomial Naive Bayes count that as three times the evidence compared to it appearing once, and do you think that is the right behavior?`,
    checkQuestions: [
      {
        q: `In Multinomial NB for spam detection, a test email contains the word "win" which appears in 0% of spam emails in training. Without Laplace smoothing, what happens?`,
        options: [
          `\`A) P("win"|spam) = 0 for that word, so the NB model skips it — zero-probability features are excluded from the product, and the remaining words determine the classification. The email may still be classified as spam if the other words are sufficiently spammy.\``,
          `\`B) P("win"|spam) = 0. Since NB multiplies all feature probabilities, the entire product P(x|spam) = 0, regardless of all other words in the email. The spam posterior P(spam|x) = 0. The email will never be classified as spam, even if every other word strongly indicates spam. This is the zero-frequency problem. Laplace smoothing adds α=1 to all word counts: P("win"|spam) = (0+1)/(N_spam + |V|) where |V| is vocabulary size — small but non-zero, preserving the contribution of all other features and allowing the model to classify correctly based on the other words.\``,
          `\`C) P("win"|spam) = 0 causes the log-probability log P(x|spam) = −∞. In log-space, the entire spam log-posterior is −∞, but log P(ham|x) is finite, so the model classifies as ham by default. Laplace smoothing prevents this by ensuring all log-probabilities are finite.\``,
          `\`D) P("win"|spam) = 0 means the word is treated as evidence against spam — it contributes a zero to the product but the model uses this as a signal that the email is not spam. This is the correct Bayesian interpretation: an event never seen in training has posterior probability 0 given that class.\``,
        ],
        answer: `B`,
      },
      {
        q: `Why does Naïve Bayes often outperform logistic regression on text classification when training data is small?`,
        options: [
          `\`A) Naïve Bayes benefits from the independence assumption in low-data regimes: when features are actually independent (as words often approximately are), NB is the optimal Bayesian classifier. Logistic regression, which models dependencies, has higher variance when those dependencies cannot be reliably estimated from small data.\``,
          `\`B) Logistic regression uses gradient descent which converges slowly on text data due to sparse feature vectors — many gradient steps are zero. Naïve Bayes uses a closed-form update (counting) that reaches the optimal solution in one pass. The performance gap disappears with sufficient gradient steps, not with more data.\``,
          `\`C) NB has better inductive bias for text: it assumes words contribute independently to the class, which is a strong regularisation that prevents the model from memorising co-occurrence patterns specific to the training set. Logistic regression has no inductive bias about word independence and overfits those patterns.\``,
          `\`D) NB estimates P(x|y) from per-class word frequencies — a generative model with very few parameters (one mean per word per class). This estimation is stable even with small n because it is just counting. Logistic regression estimates P(y|x) discriminatively — it needs to learn a weight for every word, requiring much more data to avoid overfitting in a high-dimensional space. With n=100 training documents and |V|=10,000 vocabulary, LR has 10,000 parameters and will overfit without strong regularisation, while NB has well-estimated word probabilities from the counts. As n grows, LR catches up and eventually surpasses NB because its discriminative objective is more directly aligned with the classification goal.\``,
        ],
        answer: `D`,
      },
      {
        q: `Your Naïve Bayes classifier outputs P(spam)=0.99 for an email. How confident should you be, and what would you do if calibrated probabilities are required?`,
        options: [
          `\`A) P(spam)=0.99 from NB is reliable for ranking — it correctly indicates this email is more likely spam than an email with P(spam)=0.7. Use the raw NB probabilities directly as confidence scores and set the classification threshold based on the acceptable false-positive rate.\``,
          `\`B) NB probabilities are well-calibrated for binary classification with balanced classes: the independence assumption biases posteriors toward 0 and 1 only for multiclass problems. With binary spam detection, P(spam)=0.99 means approximately 99% of similarly-scored emails are actually spam.\``,
          `\`C) Very cautious: NB posteriors are poorly calibrated — the independence assumption makes P(y|x) converge toward 0 and 1 faster than the true probabilities. A NB output of 0.99 does not mean 99% of similarly-scored emails are spam. To get calibrated probabilities: (1) Apply Platt scaling — fit a logistic regression a·f+b on the NB log-odds f = log(P(spam)/P(ham)) using a held-out calibration set. (2) Apply isotonic regression if you have enough calibration data (>1000 samples) and suspect non-monotone miscalibration. After calibration, validate on a separate test set using a reliability diagram and ECE.\``,
          `\`D) P(spam)=0.99 is overconfident due to double-counting: words that appear multiple times in the email are counted multiple times in the NB product, inflating the posterior. Fix by counting each unique word only once (binary bag-of-words rather than count bag-of-words) — this eliminates the double-counting bias without requiring post-hoc calibration.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Naive Bayes only needs to rank P(spam|words) above P(ham|words) correctly — not to get the individual probabilities right — and the independence assumption fails symmetrically enough that the ranking holds even when the probabilities saturate toward 0 and 1.`,
  },
  {
    id: 'calibration',
    interactiveId: 'calibration_curve_viz',
    title: 'Model Calibration',
    subtitle: 'Reliability diagrams, ECE, Platt scaling, isotonic regression',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['calibration', 'ECE', 'Platt scaling', 'reliability'],
    summary: `A model with high AUC ranks examples correctly — it scores true positives above false positives. But a ranking and a probability are different things.

A model that outputs 0.9 for a group of patients where the true disease rate is 0.6 is confidently wrong: the ranking may be correct (the 0.9 patients are higher risk than the 0.5 patients) but the probability is useless for any downstream decision that asks "how likely is this specific patient to have the disease?" Miscalibration is the rule, not the exception: random forests push predictions toward 0 and 1 because averaging many trees concentrates the vote; SVMs output distances, not probabilities; naive Bayes over-counts correlated evidence and saturates. Calibration matters whenever the probability itself is used — risk scoring, insurance pricing, medical decisions, or as input to a meta-learner in stacking.

The fix is post-hoc: hold out a calibration set, fit a mapping from raw model scores to empirical probabilities, and validate the fix on the test set.`,
    keyPoints: [
      `**A reliability diagram reveals miscalibration: bin predictions into M buckets, and for each bin plot the mean predicted probability against the actual fraction of positives.** Perfect calibration is the diagonal y=x. A curve below the diagonal means the model is overconfident — it predicts 0.8 for events that occur 0.6 of the time. A curve above the diagonal means underconfidence. The shape (S-curve, monotone shift) determines which calibration method to apply.`,
      `**ECE (Expected Calibration Error) quantifies miscalibration as the weighted average of |confidence_b − accuracy_b| across bins, weighted by bin size.** It collapses a reliability diagram to a single number — lower is better, 0 is perfect calibration. MCE (Maximum Calibration Error) measures the worst-bin deviation and matters when a single miscalibrated region has high stakes. Use ECE for overall summary and MCE when tail miscalibration is critical.`,
      `**Tree-based models are systematically overconfident because the prediction at each leaf is the training fraction in that leaf.** With small leaves, those fractions are near 0 or 1 regardless of the true class probability. Random forests average many leaves, but the average of many near-extreme values is still extreme. This is not a bug — it is a consequence of how trees split. Platt scaling or isotonic regression are the standard post-hoc fixes.`,
      `**Platt scaling fits logistic regression σ(af+b) on a held-out calibration set, where f is the model's raw score or logit.** Two parameters, fast to fit, appropriate when miscalibration is monotone — the reliability curve is sigmoid-shaped relative to the diagonal. It is the first calibration method to try. The risk is that logistic calibration cannot fix non-monotone miscalibration, where the model is overconfident in some score ranges and underconfident in others.`,
      `**Isotonic regression fits a non-decreasing step function mapping raw scores to calibrated probabilities, with no parametric form assumed.** It can correct any shape of miscalibration, including non-monotone patterns. The cost is that it requires at least 1000 calibration samples to avoid overfitting — with fewer samples, isotonic regression just memorises the calibration set. Use Platt when data is scarce; isotonic when you have sufficient calibration data and the miscalibration is clearly non-monotone.`,
      `**Temperature scaling for neural networks divides all logits by a scalar T before the softmax: P(y=k|x) = softmax(z/T).** T > 1 flattens the output distribution — reducing overconfidence without changing the ranking (AUC is preserved). T < 1 sharpens it. Only one parameter is fit on the validation set, making overfitting impossible even with a small calibration set. Temperature scaling is remarkably effective because neural network miscalibration is predominantly a uniform scaling issue, not a non-monotone one.`,
      `**Calibration and discrimination are orthogonal.** A model can have excellent AUC (perfect ranking) but terrible calibration (the probabilities are wrong), or be perfectly calibrated (each probability is empirically correct) but poor AUC (the probabilities barely separate classes). A credit model might correctly rank 10,000 applicants by default risk while systematically underestimating the absolute probability — great for ranking decisions, useless for setting loan loss reserves. You need both metrics to fully evaluate a probabilistic model.`,
      `**The calibration set must be separate from both training and test sets.** Using the training set to calibrate produces a degenerate calibrator that memorises training outputs — the calibrated model appears perfect on training data and fails on test data. Using the test set to calibrate contaminates your generalisation estimate — you are fitting to test data, and the resulting ECE on the test set is optimistically biased. The correct setup: split data into train / calibration / test, calibrate on the calibration set, evaluate calibration quality on the test set.`,
    ],
    checkQuestions: [
      {
        q: `A Random Forest predicts P(y=1) = 0.9 for many samples, but only 60% of those samples are actually positive. What calibration technique would you apply and how?`,
        options: [
          `\`A) The model is overconfident — predictions near 0.9 correspond to actual frequency of 0.6. Apply isotonic regression or Platt scaling on a held-out calibration set (not the training set). Isotonic regression is preferred here if the calibration set has > 1000 samples, because the miscalibration may be non-monotone across the full probability range. Steps: (1) Hold out a calibration set during training. (2) Obtain raw model scores on the calibration set. (3) Fit isotonic regression mapping scores to labels. (4) At test time, pass raw scores through the isotonic regressor to get calibrated probabilities. Validate on a separate test set — never on the calibration set used to fit the calibrator.\``,
          `\`B) The model is overconfident. Retrain with stronger regularisation (increase min_samples_leaf in the random forest) — this prevents leaves from reaching near-pure class probabilities during training, which is the root cause of overconfident predictions at 0.9. No post-hoc calibration is needed.\``,
          `\`C) The model is underconfident: if 60% of samples at P=0.9 are positive, the model is actually correct that most are positive — the reliability diagram shows the model is slightly overconfident but within the expected range. Only calibrate if ECE > 0.15 on the full validation set.\``,
          `\`D) Apply temperature scaling: divide all random forest probability outputs by a temperature T > 1 before making predictions. T=1.5 typically corrects overconfidence in tree-based models. Temperature scaling is preferred over isotonic regression because it has only one parameter and cannot overfit the calibration set.\``,
        ],
        answer: `A`,
      },
      {
        q: `Your neural network is overconfident (ECE = 0.15). You apply temperature scaling and get ECE = 0.03. The temperature T chosen is 2.5. What does T=2.5 mean mechanically?`,
        options: [
          `\`A) T=2.5 means the softmax output is averaged over 2.5 training epochs at the end of training — temperature annealing smooths the final probability distribution by mixing predictions from recent and earlier checkpoints, reducing overconfidence without changing the model weights.\``,
          `\`B) T=2.5 is a multiplicative penalty applied to the cross-entropy loss during training: L_scaled = L / T. Dividing the loss by 2.5 reduces the gradient magnitude, slowing learning and preventing the network from converging to overconfident predictions. Temperature scaling modifies training, not inference.\``,
          `\`C) Temperature scaling divides the logit vector z by T before softmax: P(y=k|x) = softmax(z/T)_k. T=2.5 > 1 means the logit vector is scaled down by a factor of 2.5 — the differences between classes are reduced, making the softmax distribution flatter (less confident). Before scaling: if the top logit is 5.0 and second is 2.0 (difference 3.0), the network is very confident. After scaling by 2.5: the logits become 2.0 and 0.8 (difference 1.2), softmax gives a less extreme distribution. Mechanically, T scales the confidence of every prediction uniformly — it is a single parameter that can correct systematic overconfidence without changing the model's ranking (AUC is preserved).\``,
          `\`D) T=2.5 means 2.5 calibration parameters were fitted — temperature scaling is a generalisation of Platt scaling that fits T independent scalar parameters, one per output class. For a 2-class problem T is a scalar; for K classes T is a K-dimensional vector. T=2.5 for K=2 indicates the positive and negative class logits are scaled by 2.5 and 1.0 respectively.\``,
        ],
        answer: `C`,
      },
      {
        q: `You have a stacking ensemble where a miscalibrated base model is one of the inputs to the meta-learner. Why is calibration critical here, and what happens if you do not calibrate?`,
        options: [
          `\`A) Calibration is not critical for stacking — the meta-learner's job is precisely to learn the relationship between base model outputs and the true label. A miscalibrated base model just means its outputs are on a different scale, and the meta-learner learns to compensate by adjusting its weights. Calibration before stacking is redundant work.\``,
          `\`B) The meta-learner uses base model probability outputs as features. If a base model is overconfident (outputs 0.95 when the true probability is 0.65), the meta-learner receives a feature value of 0.95 for what is actually a moderate-confidence example. The meta-learner tries to learn the relationship between these features and the true label — but miscalibrated features have a different scale than calibrated ones, making the meta-learner's job harder. In the worst case: the meta-learner trusts the overconfident model too much (the feature 0.95 looks like a strong signal) and under-weights the other base models. After calibration, all base models' outputs are on the same probability scale, and the meta-learner can correctly learn their relative reliability.\``,
          `\`C) Miscalibration in a base model causes the meta-learner to overfit — the meta-learner tries to correct the miscalibration by learning a complex mapping from the distorted outputs to the true labels, using up its capacity that should be spent on combining base model predictions. Calibration is critical for preventing meta-learner overfitting.\``,
          `\`D) A miscalibrated base model has lower AUC than a calibrated one, so the meta-learner assigns it less weight. Calibration is critical because it directly improves each base model's AUC, and the meta-learner's weighted average will be better overall when all base models have higher individual AUC.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `AUC measures ranking; calibration measures whether the probabilities themselves are right. A model with AUC=0.95 and ECE=0.20 ranks examples correctly but its probability outputs are wrong — it is confidently wrong, not confidently right. Any time the downstream decision uses the probability — not just the rank — plot the reliability diagram before trusting the model.`,
  },
  {
    id: 'class_imbalance',
    interactiveId: 'class_imbalance_viz',
    title: 'Class Imbalance',
    subtitle: 'SMOTE, threshold tuning, class weights, precision@K',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['imbalance', 'SMOTE', 'precision@K', 'threshold'],
    summary: `A classifier on a 99:1 dataset can achieve 99% accuracy by predicting the majority class for every single example. It never makes a prediction about the rare class and it is completely useless — yet standard training procedures optimise exactly this metric. The root problem is that accuracy assumes false positives and false negatives cost the same; in fraud detection, cancer screening, and equipment failure prediction, they do not. The imbalance is not the problem: unequal class costs are the problem, and the imbalance is just what exposes them. Fix it at the right level. Class weights reweight the loss function so that misclassifying a minority example costs more, using the same gradient descent that was ignoring the minority class to now focus on it — no data changes, no new samples, just a different loss. Threshold tuning at deployment is always necessary regardless of training procedure, because the cost ratio of false positives to false negatives is problem-specific and the default 0.5 threshold almost never matches it.`,
    keyPoints: [
      `**Accuracy is the wrong metric for imbalanced problems.** On a 99:1 dataset, a model predicting majority class always achieves 99% accuracy while capturing 0% of the minority class. Precision, recall, F1, PR-AUC, and business cost metrics expose what accuracy hides. The choice of evaluation metric is not less important than the choice of model — a bad metric will lead you to select the wrong model every time.`,
      `**Class weights reweight the loss so minority class errors are penalised more heavily: wₖ = n/(K·nₖ), which sklearn computes automatically with class_weight="balanced".** Each minority example contributes more to the gradient update than a majority example. This shifts the decision boundary toward better minority class recall without modifying the training data or generating synthetic points. It is the cheapest first intervention and should always be tried before any data-level method.`,
      `**SMOTE generates synthetic minority samples by interpolating between a minority point and one of its k nearest minority neighbours — creating new points in the minority class region rather than duplicating existing ones.** The failure mode is placing synthetic points in regions where the minority and majority classes overlap, creating confusing training examples. SMOTE works best when the minority class has a compact, well-separated region; it hurts when minority and majority regions interleave.`,
      `**Undersampling removes majority class samples to restore balance.** Random undersampling is fast but discards information. Tomek links removal is smarter: it removes majority samples that are the nearest neighbour of a minority sample — cleaning the class boundary without random information loss. Combining SMOTE (oversample minority) with Tomek link removal (clean boundary) is often better than either alone because you add minority-class signal and simultaneously remove boundary ambiguity.`,
      `**Threshold tuning is always required at deployment because the default 0.5 threshold assumes equal costs for false positives and false negatives.** In fraud detection, missing a fraud (false negative) costs far more than flagging a legitimate transaction (false positive). The optimal threshold minimises expected business cost: cost = FP_count × cost_FP + FN_count × cost_FN. Plot the PR curve, identify the threshold achieving the required precision or recall, and validate on a held-out set.`,
      `**Precision@K is the right metric when you act on a fixed budget: among the top-K highest-confidence positive predictions, what fraction are true positives?** If your fraud team reviews K=50 alerts per day, Precision@50 directly measures how many reviews produce actual fraud cases. AUC-ROC measures the model across all thresholds; Precision@K measures the model at the specific operating point you actually use. They often diverge dramatically for very imbalanced problems.`,
      `**PR-AUC is more informative than ROC-AUC for severely imbalanced data.** ROC-AUC inflates because the true negative rate (specificity) is easy to maintain when negatives dominate — even a bad classifier gets credit for correctly classifying the 99% majority. PR-AUC focuses on precision and recall — both of which are sensitive to the minority class performance. On a 0.1% positive rate, ROC-AUC of 0.99 can coexist with Precision@1000 of 5% — the ROC number hides the practical failure.`,
      `**SMOTE with tree-based models frequently hurts performance.** Trees use class weights directly in their impurity calculations — the split criterion already down-weights majority class errors. SMOTE adds synthetic minority samples in regions the tree would have already learned to split correctly, introducing noise without adding signal. Class weights are the correct intervention for trees; SMOTE is primarily useful for distance-based models (KNN, SVM) and neural networks where the data distribution directly shapes the learned representation.`,
    ],
    checkQuestions: [
      {
        q: `You build a fraud detector with 0.1% fraud rate. Your model achieves 99.5% AUC-ROC but the ops team says too many false positives. What do you change?`,
        options: [
          `\`A) Retrain the model with SMOTE: the high false-positive rate is caused by class imbalance — the model defaults to predicting majority class (non-fraud) too often, generating false positives when it guesses fraud. SMOTE will balance the training set and reduce false positives.\``,
          `\`B) Report AUC-PR instead of AUC-ROC to the ops team — AUC-ROC is the wrong metric for imbalanced fraud detection and will always appear misleadingly high. Once ops sees the true AUC-PR, they will understand the model is performing at a lower level than reported and set realistic expectations.\``,
          `\`C) Retrain with a higher regularisation penalty (reduce C in logistic regression) — the model's false positives are caused by overfitting, where the decision boundary is too sensitive to training examples near the boundary. Stronger regularisation will smooth the boundary and reduce false positive rate.\``,
          `\`D) High AUC-ROC but too many false positives = threshold is too low for the cost structure. The model's ranking is good (AUC 0.99+) but the default threshold of 0.5 is not calibrated to the 1000:1 cost ratio. Actions: (1) Compute PR curve — find threshold achieving the precision the ops team needs (e.g., 50% precision means 1 in 2 alerts is real fraud). (2) Frame as Precision@K — if ops reviews K=100 alerts/day, tune threshold to maximise precision of top-100 predictions. (3) Check PR-AUC — if it is also high, your model is genuinely good and you just need threshold calibration. If PR-AUC is low, the model needs improvement in the high-precision region.\``,
        ],
        answer: `D`,
      },
      {
        q: `Your dataset has 1000 positive and 100,000 negative samples. You apply SMOTE to balance it to 50,000:100,000 and train a logistic regression. The test PR-AUC is lower than with class weights. Why?`,
        options: [
          `\`A) SMOTE generated 49,000 synthetic minority samples — far more than the original 1,000. With 49× more synthetic than real minority examples, the model fits synthetic patterns rather than real ones, causing performance degradation. Use moderate SMOTE ratios (e.g., 5,000:100,000) to avoid drowning out real minority patterns.\``,
          `\`B) SMOTE with logistic regression often hurts for several reasons: (1) SMOTE generates synthetic minority samples by interpolating between existing minority samples in feature space. For logistic regression (a linear model), the minority region may not be linearly separable from the majority — synthetic points in this region reinforce an incorrect linear boundary. (2) Class weights achieve the same reweighting effect as SMOTE for logistic regression but without adding noise. (3) SMOTE's interpolation can place synthetic points in the majority region, creating noisy examples that confuse the model. Class weights are the correct intervention for logistic regression on imbalanced data.\``,
          `\`C) The PR-AUC degradation is caused by the evaluation metric, not the training method. SMOTE changes the data distribution so that the test set (which preserves the original 1000:100,000 ratio) no longer matches the training distribution. PR-AUC should be computed on a SMOTE-balanced test set to get a fair comparison.\``,
          `\`D) SMOTE interpolates between minority examples, which are themselves rare and noisy. The synthetic examples inherit the noise from their nearest neighbours, amplifying label noise 50× during training. Class weights avoid this by not creating new examples — they work directly on the real minority examples.\``,
        ],
        answer: `B`,
      },
      {
        q: `You have a binary classifier for cancer screening. False negatives (missing cancer) are 10× more costly than false positives (unnecessary follow-up). How do you incorporate this into training and evaluation?`,
        options: [
          `\`A) Training: set class_weight = {0: 1, 1: 10} — the loss for misclassifying a positive (cancer) sample is 10× the loss for misclassifying a negative. This shifts the decision boundary toward higher recall. Threshold: at deployment, tune the threshold on a calibration set to achieve the cost-optimal tradeoff: expected cost = FP_rate × 1 + FN_rate × 10. Find threshold minimising this. Evaluation: use F_β with β=√10 ≈ 3.16 (F_β weighs recall β times more than precision); also report Precision, Recall, and the cost metric directly. Never report only accuracy — it hides the critical false-negative rate.\``,
          `\`B) Lower the classification threshold from 0.5 to 0.1 — this is the only change needed. A lower threshold increases recall without any training changes. Evaluation: report sensitivity (recall) as the primary metric; specificity is secondary since false positives are acceptable. No changes to the loss function or class weights are required.\``,
          `\`C) Incorporate cost asymmetry only at evaluation time: train with balanced classes and default threshold (0.5) to get the most accurate model, then compute expected cost = FP × 1 + FN × 10 on the test set. Report this cost metric to stakeholders. Changing the training objective introduces bias that reduces overall model accuracy.\``,
          `\`D) Use SMOTE to oversample the cancer-positive class by 10× before training — this is equivalent to class_weight={0:1, 1:10} and is more principled because it explicitly creates the data distribution that matches the cost structure. Evaluation: use AUC-ROC, which is threshold-independent and correctly captures the 10× cost asymmetry.\``,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Class imbalance is a cost asymmetry problem masquerading as a data problem. The real issue is that standard training treats false positives and false negatives as equally bad, and they never are in high-stakes applications. Class weights fix the training in seconds. The threshold at deployment fixes the operating point. What you cannot skip is measuring with the right metric — accuracy on an imbalanced problem is not a metric, it is a way to miss the whole problem.`,
    interactiveId: 'class_imbalance_viz',
  },
  {
    id: 'feature_selection',
    title: 'Feature Selection & Dimensionality',
    subtitle: 'Filter/wrapper/embedded, mutual information, RFE, SHAP',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['feature selection', 'mutual information', 'SHAP', 'RFE'],
    summary: `Adding more features seems like it should always help — more information about the target means better predictions.

In practice, irrelevant and redundant features add noise, inflate the effective dimensionality the model must search, increase training time, and make the model harder to interpret. The question is not "should I include this feature" but "does this feature reduce test error, or does it only reduce training error?" Selecting features based on test set performance is not an answer — it inflates apparent accuracy because the selected features were chosen to match the test labels. Feature selection must happen inside cross-validation. Among selection methods, filter methods evaluate features independently and miss interactions; wrapper methods search subsets using the model directly and are too slow for large feature sets; embedded methods like L1 regularisation and SHAP importance do selection as part of training and account for interactions.

In practice, the most reliable pipeline is: train one gradient boosted model on all features, rank by SHAP importance, select the top-k — one training run, interactions accounted for, selection bias avoided.`,
    keyPoints: [
      `**Filter methods score each feature independently of the model and of other features.** Mutual information I(X;y) captures non-linear dependencies and is the most general criterion. ANOVA F-test handles linear continuous-target relationships. Chi-squared handles categorical features and targets. Filter methods are fast — O(nd) — but they miss multivariate interactions: two features that are each individually uncorrelated with the target can jointly be perfectly predictive, and filter methods will eliminate both.`,
      `**Variance thresholding removes features with near-zero variance — they carry no information regardless of any model.** A constant feature (var=0) contributes nothing to any split criterion or gradient. This is the cheapest possible first pass and should always run before any other selection method. In real datasets, near-constant features often appear from dummy variables for rare categories, features that were computed but never triggered, or data pipeline errors.`,
      `**Mutual information estimation from finite samples is noisy — binning-based estimators introduce bias that depends on bin width.** Sklearn's mutual_info_classif uses a k-nearest-neighbour estimator that avoids this bias and gives more accurate MI estimates with fewer samples. The tradeoff is that MI captures each feature's individual relationship with the target — two features with high MI might be redundant (they carry the same information), and MI does not reveal this.`,
      `**RFE (Recursive Feature Elimination) trains the model, removes the lowest-importance feature, and repeats.** It captures interactions because the model sees all remaining features at each step — the importance of feature A changes when feature B is removed if they were correlated. The cost is O(d) model fits, making it practical for small feature sets (d < 100) and prohibitive for large ones (d = 10,000 would require 10,000 training runs).`,
      `**Embedded methods do selection as part of training.** L1 regularisation drives irrelevant feature weights to exactly zero during gradient descent — the same optimiser that was causing overfitting now simultaneously selects features. Tree Gini importance and SHAP values rank features post-hoc from a trained model that already saw all features together, so interactions are reflected in the scores. Embedded methods are both faster than wrapper methods and more accurate than filter methods for correlated feature spaces.`,
      `**Feature selection bias is a common source of inflated published results: compute feature importance on the full dataset (including test examples), select the top-k features, then evaluate on the test set.** The test set labels were used to select features, making the selected features appear more predictive than they really are. Correct procedure: feature selection must be nested inside cross-validation — compute importance on training folds only, evaluate on the held-out fold. This adds complexity but is the only way to get an unbiased estimate.`,
      `**SHAP-based selection trains one gradient boosted model on all features and computes mean |SHAP value| per feature.** SHAP values decompose each prediction into per-feature contributions that correctly account for feature interactions — unlike Gini importance, which treats each split independently. A feature with high SHAP importance genuinely moves predictions, not just impurity. Train once, get reliable interaction-aware importance, select top-k: this is the most reliable selection pipeline for tabular data.`,
      `**Correlated features inflate apparent feature count without adding independent information.** If two features have |corr| > 0.95, they are nearly redundant — a model that uses both is not learning twice as much signal, it is learning the same signal with noise. Keep the one with higher mutual information with the target and remove the other. This also stabilises model fitting: correlated features compete for coefficient estimates in linear models and split credit in tree models, causing importance estimates to be unreliable for either feature individually.`,
    ],
    checkQuestions: [
      {
        q: `You have 500 features and want to reduce to ~50 before tuning a Random Forest. What is your step-by-step approach?`,
        options: [
          `\`A) Run 5-fold cross-validation with the full 500 features, compute each feature's average coefficient magnitude across folds, and keep the top-50. This is the most reliable approach because it uses the model's own learning signal to identify important features while accounting for cross-validation noise.\``,
          `\`B) Apply mutual information filtering: compute MI between each feature and the target, rank all 500 features, keep the top-50 with highest MI. This is both fast (O(nd)) and directly targets features with high predictive value. No preliminary steps are needed since MI handles correlated and irrelevant features automatically.\``,
          `\`C) Step 1: remove constant and near-zero variance features (VarianceThreshold in sklearn — fast, no label needed). Step 2: remove highly correlated pairs (|corr|>0.95) — keep the one with higher MI with target. Step 3: train an initial Random Forest with all remaining features, compute permutation importance (or SHAP) on a validation fold. Select top-50 by importance. Step 4: verify that the 50-feature model achieves similar OOB or CV performance to the full-feature model (within 0.5%). Step 5: if performance drops, iterate with top-75 or top-100. Avoid pure filter methods (they miss interactions); embedded methods (permutation importance, SHAP) are preferred for RF because they account for feature interactions.\``,
          `\`D) Use RFE (Recursive Feature Elimination) with the Random Forest as the estimator: train on all 500 features, remove the 50 features with lowest Gini importance, retrain, repeat until 50 remain. RFE accounts for interactions at each step and is the most principled selection method for tree-based models.\``,
        ],
        answer: `C`,
      },
      {
        q: `A colleague selects the top-20 features using mutual information with the target label, then performs 5-fold CV to evaluate the model. What is wrong with this procedure?`,
        options: [
          `\`A) Feature selection bias: mutual information was computed on the full dataset (including what becomes the test fold). The selected features were chosen because they happen to correlate with the label in all 5 folds — including the test fold. This inflates apparent performance because the features were selected using test-set label information. Correct procedure: feature selection must be nested inside the CV loop. For each fold: (1) train MI on the k-1 training folds only; (2) select top-20 features using that MI; (3) train model on training folds with those 20 features; (4) evaluate on the held-out test fold. This gives an unbiased estimate of both the selection procedure and the model.\``,
          `\`B) Mutual information is a filter method that ignores feature interactions — selecting top-20 by individual MI will miss features that are only predictive in combination. The correct approach is to run 5-fold CV first and use Gini importance from the full-feature model to select features, because Gini captures interactions.\``,
          `\`C) The procedure is correct — mutual information computed on the full dataset is an estimate of the population-level MI, not specific to any fold. Using it as a preprocessing step before CV is equivalent to standardising features before CV, which is standard practice.\``,
          `\`D) 5-fold CV is insufficient for evaluating a model that uses only 20 features — with 20 features, each fold's test set sees at most 20/d of the feature variance. Use leave-one-out CV (LOOCV) to get an unbiased estimate of generalisation for small feature counts.\``,
        ],
        answer: `A`,
      },
      {
        q: `You select 20 features with Gini importance from a Random Forest and find that removing any single selected feature barely changes test performance. What does this suggest?`,
        options: [
          `\`A) The 20 features are all equally important and the model is well-distributed: no single feature dominates, which is a sign of a robust and generalising model. Removing any one feature only costs 1/20 of the total information, so the impact per feature is correctly small. No action needed.\``,
          `\`B) The model has memorised the training data — when a model truly overfits, removing any feature has no effect on test performance because test performance is already at chance. Retrain with stronger regularisation (deeper min_samples_leaf) and re-evaluate feature importance.\``,
          `\`C) The 20 features all have near-zero Gini importance that was mistakenly ranked as high due to a bug in the importance calculation. Verify that oob_score=True is set and that importances were computed on the OOB set, not the training set — training-set Gini importance is always artificially inflated.\``,
          `\`D) Two likely explanations: (1) Many of the 20 features are correlated — the information they collectively provide is redundant, and any individual feature can be replaced by a correlated substitute. Gini importance distributes credit among correlated features, making each look moderately important. True importance only appears when all correlated partners are removed simultaneously. (2) The model is robust to feature removal and individual features contribute marginally. Fix: (1) Use permutation importance or SHAP instead of Gini. (2) Try sequential ablation: remove subsets of correlated features together and measure the group's collective importance. (3) Check feature correlations among the 20 selected features — groups with |corr|>0.8 are likely providing redundant information.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Feature selection on the full dataset before splitting is data leakage — the selected features were chosen partly because they happened to correlate with the test labels, and the apparent performance gain is artefactual. Selection must be nested inside cross-validation. In practice: train one gradient boosting model, rank by SHAP, take the top-k. One run, no leakage, interactions accounted for. That is the reliable pipeline.`,
  },
]
