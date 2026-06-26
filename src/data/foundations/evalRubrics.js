export const FOUNDATION_RUBRICS = {
  math_stats: {
    label: 'Math & Stats',
    tabId: 'math_stats_foundation',
    totalModules: 18,
    masteryDescription:
      'A master of this domain can derive the mathematical foundations behind ML algorithms from first principles, identify when standard assumptions break, and translate statistical reasoning directly into model design and debugging decisions.',
    levels: {
      novice:
        'Can state definitions (e.g., Bayes\' theorem, variance). Cannot derive results or identify when formulas apply.',
      building:
        'Can apply formulas correctly in textbook settings. Struggles when the setting deviates slightly or when asked "why."',
      competent:
        'Can explain the reasoning behind methods, identify common failure modes, and apply concepts to non-standard problems without hand-holding.',
      strong:
        'Can derive results from scratch, connect mathematical ideas across domains (e.g., regularization ↔ priors), and reason about edge cases quantitatively.',
      interviewReady:
        'Can answer cold questions like "why does SGD generalize better than full-batch GD?" with theoretical grounding, connect math to production decisions, and reason about approximations under compute or data constraints.',
    },
    interviewSignals: [
      {
        topic: 'MAP estimation and regularization',
        failSignal:
          'Says MAP adds a penalty term but cannot say what prior it corresponds to or why.',
        passSignal:
          'States that L2 regularization = Gaussian prior on weights, L1 = Laplace prior in MAP framework.',
        strongSignal:
          'Derives the equivalence: -log p(w|D) = -log p(D|w) - log p(w) + const; explains how prior variance controls regularization strength; notes that MAP collapses to MLE as N → ∞; connects to ridge regression closed form.',
        sampleQuestion:
          'Derive the connection between L2 regularization and MAP estimation with a Gaussian prior. What does the regularization coefficient correspond to in terms of the prior?',
      },
      {
        topic: 'Bias-variance tradeoff',
        failSignal:
          'Says "high bias = underfitting, high variance = overfitting" without being able to decompose MSE or explain what changes each term.',
        passSignal:
          'Decomposes MSE = Bias² + Variance + Irreducible noise; explains that model complexity moves bias and variance in opposite directions.',
        strongSignal:
          'Notes the decomposition is for squared loss specifically; discusses how bagging reduces variance without changing bias; explains why the double-descent phenomenon challenges the classical U-curve narrative in overparameterized models.',
        sampleQuestion:
          'Bagging reduces variance but not bias. Boosting reduces bias. Why? Walk me through the math for bagging and explain why averaging independent estimators halves variance only if they\'re uncorrelated.',
      },
      {
        topic: 'SVD and PCA',
        failSignal:
          'Describes PCA as "finding directions of maximum variance" but cannot connect it to SVD or explain what the singular values represent.',
        passSignal:
          'States X = UΣVᵀ; explains PC directions are rows of Vᵀ; says singular values capture variance in each direction.',
        strongSignal:
          'Explains that PCA of X is SVD of X (centered); notes eigenvalues of XᵀX = σᵢ²; discusses truncated SVD as low-rank approximation (Eckart–Young theorem); connects to matrix completion and collaborative filtering; flags when PCA fails (non-linear manifolds, different feature scales).',
        sampleQuestion:
          'You have a 1M×500 embedding matrix. You want the top-50 principal components. Walk me through the compute and numerical considerations — why not just form XᵀX and eigendecompose?',
      },
      {
        topic: 'Information theory basics',
        failSignal:
          'Defines entropy as "measure of uncertainty" but cannot say what cross-entropy loss is actually minimizing or connect KL divergence to MLE.',
        passSignal:
          'States H(p) = -Σ p log p; notes cross-entropy H(p,q) = H(p) + KL(p‖q); says minimizing cross-entropy w.r.t. q minimizes KL divergence.',
        strongSignal:
          'Notes MLE = minimizing KL(p_data ‖ p_model); explains mutual information I(X;Y) = H(X) - H(X|Y) and its use in feature selection; discusses why KL divergence is asymmetric and when each direction matters (VAE: KL(q‖p) vs forward KL); connects to variational inference.',
        sampleQuestion:
          'KL divergence is asymmetric. In variational inference, we minimize KL(q‖p). In some methods, it\'s KL(p‖q). What is the practical difference in the solutions you get from each?',
      },
      {
        topic: 'Central Limit Theorem and confidence intervals',
        failSignal:
          'Repeats "sample means are normally distributed for large n" without being able to say what "large n" depends on or construct a CI from scratch.',
        passSignal:
          'States CLT; constructs CI as x̄ ± z*(σ/√n); interprets CI as a procedure with 95% coverage rate, not a probability statement about the true mean.',
        strongSignal:
          'Distinguishes frequentist CI from Bayesian credible interval; explains coverage guarantees degrade when CLT doesn\'t hold (heavy tails, small n, clustered data); discusses bootstrap as alternative; notes CI width scales as 1/√n so 4x more data for 2x tighter interval.',
        sampleQuestion:
          'You\'re running an A/B test and your metric is 90th-percentile latency. Can you use a normal approximation-based CI here? What would you do instead?',
      },
      {
        topic: 'Eigenvalues and positive definiteness',
        failSignal:
          'Can state the eigenvalue definition but cannot say why positive definiteness matters for optimization or covariance matrices.',
        passSignal:
          'States a PSD matrix has all non-negative eigenvalues; says Hessians being PSD means the function is convex; notes covariance matrices are always PSD.',
        strongSignal:
          'Explains that PSD Hessian = convex loss = unique global minimum for gradient descent; connects condition number (λ_max/λ_min) to convergence rate of gradient descent; notes poorly conditioned problems benefit from preconditioning (Adam, natural gradient); explains why empirical covariance is only PSD when n > d.',
        sampleQuestion:
          'Why does a high condition number of the Hessian make gradient descent slow? What does Adam do about this, and what does it not do?',
      },
      {
        topic: 'MLE and its failure modes',
        failSignal:
          'Says MLE is "maximizing likelihood of the data" without discussing when it fails or what assumptions it requires.',
        passSignal:
          'States MLE: θ̂ = argmax Σ log p(xᵢ|θ); notes it\'s unbiased asymptotically; mentions it can overfit with small n.',
        strongSignal:
          'Explains MLE is equivalent to minimizing KL(p_data‖p_model); discusses why MLE is inconsistent under model misspecification; flags that MLE can be undefined (e.g., Gaussian with one data point — variance estimate collapses); notes MLE maximizes likelihood at the cost of predictive uncertainty quantification; contrasts with Bayesian posterior.',
        sampleQuestion:
          'You fit a Gaussian mixture model with MLE. One component collapses onto a single data point and its variance goes to zero. What happened and how do you fix it?',
      },
      {
        topic: 'Gradient and Jacobian in deep networks',
        failSignal:
          'Understands that gradients flow backward but cannot explain the chain rule in matrix form or what a Jacobian is.',
        passSignal:
          'States ∂L/∂x = (∂y/∂x)ᵀ ∂L/∂y; understands Jacobian as matrix of partial derivatives; can trace gradient through an elementwise operation.',
        strongSignal:
          'Explains that Jacobians multiply and their spectral norms determine whether gradients vanish or explode through depth; derives vanishing gradient in sigmoid networks vs. ReLU; connects batch norm\'s effect to conditioning the Jacobian; discusses why gradient clipping works for RNNs.',
        sampleQuestion:
          'Why does the gradient vanish in deep sigmoid networks but not in ReLU networks? Be precise about what happens to the Jacobian product as you go deeper.',
      },
    ],
  },

  classical_ml: {
    label: 'Classical ML',
    tabId: 'classical_ml_foundation',
    totalModules: 14,
    masteryDescription:
      'A master of classical ML can select the right model family for a problem from first principles, diagnose why a model is failing, and reason about generalization — not just in theory but in terms of what will happen when the model hits production data.',
    levels: {
      novice:
        'Can name algorithms and describe them at a surface level. Cannot explain why one would outperform another or what assumptions each makes.',
      building:
        'Can implement and apply standard algorithms correctly. Begins to understand hyperparameter effects but reasons by trial-and-error rather than principles.',
      competent:
        'Understands why algorithms work, can predict failure modes before running experiments, and can diagnose underfit/overfit from learning curves.',
      strong:
        'Can derive algorithms from optimization objectives, quantify generalization via VC dimension or Rademacher complexity, and design problem-specific model variants.',
      interviewReady:
        'Can reason from data properties to model choice to expected failure mode in one pass, connect classical algorithms to their deep learning descendants, and discuss what changes at scale.',
    },
    interviewSignals: [
      {
        topic: 'Logistic regression vs. decision boundaries',
        failSignal:
          'Says logistic regression "outputs probabilities" but cannot explain what the sigmoid does mathematically or why the decision boundary is linear.',
        passSignal:
          'Explains log-odds = wᵀx + b; decision boundary is where p = 0.5, i.e., wᵀx + b = 0, which is a hyperplane.',
        strongSignal:
          'Notes logistic regression is a GLM with logit link; discusses calibration (outputs are probabilities if data is separable? No — explains overconfidence in separable case and connection to cross-entropy loss; discusses why L2 regularization helps calibration in separable settings); contrasts with discriminative vs. generative classifiers (naive Bayes = generative, logistic = discriminative).',
        sampleQuestion:
          'Your logistic regression is trained on linearly separable data with no regularization. What happens to the weights and to the predicted probabilities as training converges?',
      },
      {
        topic: 'Ensemble methods: bagging vs. boosting',
        failSignal:
          'Says bagging = random forest, boosting = gradient boosting, but cannot explain the variance/bias mechanics or when each is preferred.',
        passSignal:
          'States bagging averages decorrelated trees to reduce variance; boosting fits residuals sequentially to reduce bias; boosting is more prone to overfitting on noisy data.',
        strongSignal:
          'Explains that bagging works because Var(X̄) = σ²/n only when trees are uncorrelated — subsampling features (random forest) achieves this; for boosting, each learner is a weak learner (high bias), and the ensemble reduces bias multiplicatively; discusses shrinkage in gradient boosting as implicit regularization; notes XGBoost adds second-order Taylor expansion of loss.',
        sampleQuestion:
          'Gradient boosted trees are usually trained with shallow trees (depth 3-6). Why? What goes wrong if you use depth-20 trees in gradient boosting?',
      },
      {
        topic: 'SVMs and the kernel trick',
        failSignal:
          'Says SVMs "find the maximum margin hyperplane" but cannot explain what the dual is or why the kernel trick works.',
        passSignal:
          'States the SVM optimizes margin = 2/‖w‖; support vectors define the margin; kernel trick replaces dot products with K(xᵢ,xⱼ) without explicit feature map.',
        strongSignal:
          'Derives the dual from the primal using Lagrangians; explains why kernels only need K(xᵢ,xⱼ) = φ(xᵢ)·φ(xⱼ) — never compute φ explicitly; notes that SVMs are memory-inefficient at inference (store support vectors); discusses why RBF kernel degrades when d >> n (high-dim dot products concentrate); contrasts with deep networks which learn the feature map.',
        sampleQuestion:
          'You have 1M training examples. Can you use a kernel SVM? Why not, and what would you do instead to get a non-linear decision boundary at that scale?',
      },
      {
        topic: 'Regularization mechanisms',
        failSignal:
          'Describes L1 and L2 as "prevents overfitting" without explaining the geometric difference or when sparsity occurs.',
        passSignal:
          'States L2 shrinks weights uniformly; L1 produces sparsity because the L1 ball has corners at axis-aligned positions where gradients can satisfy KKT conditions with zero weights.',
        strongSignal:
          'Derives the closed form of ridge regression (w = (XᵀX + λI)⁻¹Xᵀy); explains why adding λI fixes ill-conditioning; notes elastic net interpolates L1 sparsity with L2 grouping behavior; connects dropout to model averaging; discusses implicit regularization of SGD with small batch size.',
        sampleQuestion:
          'Why does ridge regression have a closed-form solution but lasso doesn\'t? What does this tell you about their optimization landscapes?',
      },
      {
        topic: 'Decision trees: splits and pruning',
        failSignal:
          'Says decision trees split on "the best feature" without specifying what "best" means or how the tree avoids overfitting.',
        passSignal:
          'States splits minimize impurity (Gini or information gain); deeper trees overfit; pruning or depth limits control complexity.',
        strongSignal:
          'Explains information gain = parent entropy - weighted child entropy; Gini ≈ linearized entropy (fast to compute, similar splits); discusses why depth-unlimited trees memorize training data (zero training error); explains cost-complexity pruning (add α × number-of-leaves penalty to error); notes trees have high variance — small data change → different splits, motivating ensembles.',
        sampleQuestion:
          'You have a categorical feature with 1000 unique values. How does a decision tree handle this, and what are the computational and statistical problems?',
      },
      {
        topic: 'Generalization bounds',
        failSignal:
          'Cannot connect VC dimension to generalization or says "more data = better" without quantifying how much better.',
        passSignal:
          'States PAC learning; generalization error bounded by O(√(d/n)) where d is VC dimension; knows more capacity = looser bound.',
        strongSignal:
          'Explains VC dimension measures expressivity by shattering; Rademacher complexity tightens bounds by considering actual data distribution; discusses why these bounds are vacuous for deep networks (VC dim >> n yet they generalize); introduces double descent as empirical evidence that the classical bound is too pessimistic; mentions compression-based bounds (MDL) as alternatives.',
        sampleQuestion:
          'Generalization bounds from VC theory are often vacuous for neural networks. If the theory doesn\'t explain why they generalize, what does? What\'s the current best understanding?',
      },
      {
        topic: 'Linear regression assumptions and diagnostics',
        failSignal:
          'States OLS assumptions exist but cannot name them or explain what breaks when they are violated.',
        passSignal:
          'Lists: linearity, homoscedasticity, independence, normality of errors; says heteroscedasticity inflates standard errors; multicollinearity makes coefficients unstable.',
        strongSignal:
          'Explains that OLS is BLUE (Gauss-Markov) only under homoscedasticity and independence; with heteroscedasticity, WLS or robust standard errors restore valid inference; multicollinearity → large VIF → inflated variance of β̂ but does NOT bias prediction; ridge regression is the practical fix; discusses Cook\'s distance for influential points; notes that with n < p you need regularization to get a unique solution.',
        sampleQuestion:
          'You run OLS and the residuals fan out as predicted values increase (heteroscedasticity). Walk me through three ways to handle this and when you\'d use each.',
      },
    ],
  },

  probabilistic_ml: {
    label: 'Probabilistic ML',
    tabId: 'probabilistic_ml_foundation',
    totalModules: 9,
    masteryDescription:
      'A master of probabilistic ML reasons natively about uncertainty — not just point estimates — and can design systems that quantify what the model doesn\'t know, which is critical for high-stakes predictions and sequential decision making.',
    levels: {
      novice:
        'Knows Bayesian inference exists. Cannot write down a posterior or distinguish prior, likelihood, and posterior in a real model.',
      building:
        'Can perform exact Bayesian inference in conjugate settings and understands the mechanics of variational inference at a high level.',
      competent:
        'Can design approximate inference strategies, select appropriate priors, and diagnose when inference is failing (mode collapse, posterior approximation quality).',
      strong:
        'Can derive ELBO, implement MCMC diagnostics, reason about posterior geometry, and design probabilistic models for specific production use cases.',
      interviewReady:
        'Can discuss when Bayesian approaches justify their added complexity over deep ensembles or conformal prediction, and can reason about calibration, epistemic vs. aleatoric uncertainty, and the cost of uncertainty estimation at inference time.',
    },
    interviewSignals: [
      {
        topic: 'Bayesian inference and conjugate priors',
        failSignal:
          'Says "prior × likelihood = posterior" but cannot perform a concrete update or explain what conjugacy buys you.',
        passSignal:
          'Demonstrates Beta-Binomial conjugacy: Beta(α,β) prior × Binomial likelihood → Beta(α+successes, β+failures) posterior; explains conjugacy gives closed-form posteriors.',
        strongSignal:
          'Discusses why conjugacy is rare in non-trivial models; explains that the posterior predictive integrates out the parameter (critical for actual uncertainty propagation); notes conjugate priors are often misspecified for real problems; connects to exponential family — conjugate priors always exist for exponential family likelihoods; discusses computational cost O(n) for Gaussian process posterior vs. O(n³).',
        sampleQuestion:
          'You have a Beta prior on click-through rate and observe 3 clicks in 100 impressions. Walk me through the posterior, compute the posterior predictive for the next impression, and explain what "prior strength" means here.',
      },
      {
        topic: 'Variational inference and ELBO',
        failSignal:
          'Knows VI approximates the posterior but cannot write down the ELBO or explain why KL(q‖p) not KL(p‖q).',
        passSignal:
          'Derives ELBO = E_q[log p(x,z)] - E_q[log q(z)]; states we maximize ELBO because minimizing KL(q‖p) = maximizing ELBO + const.',
        strongSignal:
          'Explains mean-field VI factorizes q(z) = Πᵢ q(zᵢ) — ignores posterior correlations; discusses mode-seeking behavior of KL(q‖p): q concentrates on one mode of multimodal posteriors, causing underestimation of uncertainty; contrasts with KL(p‖q) (moment-matching, overdispersed); discusses black-box VI (BBVI) and reparameterization trick for gradient estimation; notes IWAE tightens ELBO with importance-weighted samples.',
        sampleQuestion:
          'Mean-field VI underestimates uncertainty in multimodal posteriors. Explain precisely why this happens from the KL divergence direction, and what alternatives exist.',
      },
      {
        topic: 'Gaussian Processes',
        failSignal:
          'Describes GPs as "infinite-dimensional Bayesian regression" without being able to specify a kernel or explain what the posterior gives you.',
        passSignal:
          'States a GP is defined by mean and covariance function; posterior GP is also Gaussian given data; kernel encodes similarity structure (RBF = smooth, Matérn = less smooth).',
        strongSignal:
          'Derives GP posterior: μ* = K*ᵀ(K+σ²I)⁻¹y; notes O(n³) cost from Cholesky; discusses sparse GP approximations (inducing points, SVGP); explains length-scale as the range of correlation; flags the limitation that GPs don\'t scale to n > 10K without approximations; discusses deep kernel learning as hybrid with neural nets.',
        sampleQuestion:
          'You want to use a GP for Bayesian optimization with 500 function evaluations in a 20-dimensional space. Walk me through the computational bottlenecks and how you\'d address them.',
      },
      {
        topic: 'Calibration',
        failSignal:
          'Says a model is calibrated if "its probabilities are accurate" but cannot define calibration formally or name a calibration method.',
        passSignal:
          'States calibration: P(Y=1 | p̂ = p) = p for all p; uses reliability diagrams to diagnose; mentions Platt scaling and isotonic regression.',
        strongSignal:
          'Distinguishes calibration from accuracy (a model can be well-calibrated and inaccurate); explains Platt scaling fits a sigmoid on top of model logits; isotonic regression is non-parametric but needs enough data per bin; discusses ECE (Expected Calibration Error) as scalar metric; notes temperature scaling is a single-parameter recalibration; explains why deep networks are overconfident (cross-entropy training penalizes wrong confident predictions less than soft-label training would).',
        sampleQuestion:
          'A fraud detection model has 95% accuracy but is poorly calibrated. Why does calibration matter here, and what practical decision gets hurt when predicted probabilities are systematically wrong?',
      },
      {
        topic: 'MCMC and convergence diagnostics',
        failSignal:
          'Knows MCMC samples from posteriors but cannot explain why the chain gives valid samples or how to diagnose non-convergence.',
        passSignal:
          'States Metropolis-Hastings acceptance criterion ensures detailed balance; burn-in discards early samples; R̂ statistic measures across-chain convergence.',
        strongSignal:
          'Explains detailed balance implies stationarity; HMC uses gradient information to propose better moves, avoiding random walk behavior; ESS (effective sample size) measures autocorrelation — low ESS means the chain is exploring slowly; R̂ > 1.01 flags non-convergence; discusses why MCMC is impractical at scale and where VI or deep ensembles replace it in production.',
        sampleQuestion:
          'Your MCMC chain has R̂ = 1.0 (convergence) but ESS = 50 out of 10,000 samples. What does this tell you, and how do you fix it?',
      },
      {
        topic: 'VAEs and the reparameterization trick',
        failSignal:
          'Says VAEs are autoencoders with a prior on the latent space but cannot explain why the reparameterization trick is needed or what the ELBO looks like.',
        passSignal:
          'States ELBO = E_q[log p(x|z)] - KL(q(z|x)‖p(z)); reparameterization: z = μ + εσ, ε~N(0,1) allows gradient to flow through z.',
        strongSignal:
          'Explains that without reparameterization, sampling z is non-differentiable so backprop cannot flow; the REINFORCE estimator is an alternative but high-variance; discusses posterior collapse (decoder ignores z when capacity is high — KL term → 0); β-VAE increases KL weight to force disentanglement at cost of reconstruction quality; contrasts VAE with diffusion models on generation quality.',
        sampleQuestion:
          'What is posterior collapse in a VAE? Why does it happen, and what are three techniques to prevent it?',
      },
      {
        topic: 'Epistemic vs. aleatoric uncertainty',
        failSignal:
          'Uses "uncertainty" without distinguishing sources or cannot say which type a given intervention would reduce.',
        passSignal:
          'States epistemic = model uncertainty (reducible with more data), aleatoric = noise in the data (irreducible); deep ensembles capture epistemic uncertainty.',
        strongSignal:
          'Explains that aleatoric uncertainty is output-space noise (heteroscedastic if it depends on input), while epistemic is weight-space uncertainty; notes that aleatoric can be modeled by predicting a distribution over outputs; epistemic requires distribution over models (ensembles, MC dropout, BNNs); discusses that in OOD detection, epistemic uncertainty should spike but aleatoric stays the same; notes that conformal prediction provides distribution-free coverage guarantees without modelling the source of uncertainty.',
        sampleQuestion:
          'You\'re deploying a model that predicts patient treatment outcomes. Design an uncertainty estimation approach that distinguishes "this patient is in a part of the space we\'ve never seen" from "treatment outcomes are genuinely noisy here."',
      },
    ],
  },

  evaluation: {
    label: 'Evaluation',
    tabId: 'evaluation_foundation',
    totalModules: 10,
    masteryDescription:
      'A master of evaluation designs experiments that give trustworthy answers, not just numbers — they know which metrics can be gamed, when offline results won\'t transfer online, and how to detect when an A/B test is being misread.',
    levels: {
      novice:
        'Can name standard metrics (accuracy, F1, AUC). Cannot explain what they measure, when they\'re wrong, or how to design an evaluation.',
      building:
        'Can select appropriate metrics for a task and run a basic A/B test. Doesn\'t yet reason about validity threats or metric gaming.',
      competent:
        'Understands metric tradeoffs, can set up a statistically valid A/B test, and flags common evaluation traps like data leakage and label bias.',
      strong:
        'Designs evaluation frameworks end-to-end: offline metrics, online experiments, holdout strategy, calibration checks, and power analysis.',
      interviewReady:
        'Can immediately identify why a given evaluation setup would produce misleading results and propose a corrected design — including surrogate metric risk, p-hacking, and online-offline gaps.',
    },
    interviewSignals: [
      {
        topic: 'AUC-ROC interpretation and failure modes',
        failSignal:
          'Says AUC is "area under the curve, higher is better" without explaining what it measures probabilistically or when it\'s misleading.',
        passSignal:
          'States AUC = P(score(positive) > score(negative)); threshold-agnostic; better than accuracy for imbalanced classes.',
        strongSignal:
          'Notes AUC treats all thresholds equally, which is wrong if operating point is fixed; PR-AUC is more informative under heavy class imbalance because it weights precision more heavily in the rare-positive regime; AUC can be high even when model is uncalibrated; partial AUC useful for specific FPR ranges (e.g., medical screening where FPR must be < 0.01); two models can have same AUC with very different rank orderings in high-confidence ranges.',
        sampleQuestion:
          'Two fraud detection models have identical AUC-ROC of 0.92. You can only review 1% of transactions manually. Which model do you deploy and how do you decide?',
      },
      {
        topic: 'A/B testing: validity and statistical power',
        failSignal:
          'Describes A/B testing as "split traffic, compare means, check p < 0.05" without discussing power, peeking, or what the p-value means.',
        passSignal:
          'Computes required sample size from effect size, α, and power; states p-value is P(data | H₀), not P(H₀ | data); avoids stopping early.',
        strongSignal:
          'Discusses sequential testing (alpha spending) as the correct way to peek without inflating Type I error; CUPED variance reduction using pre-experiment covariates; explains network effects violate SUTVA (a user in treatment affects control users in social platforms); discusses novelty effect (short-run gains that don\'t persist); notes Bonferroni correction needed for multiple metrics; flags that long-run holdouts are needed to detect learning-system interactions.',
        sampleQuestion:
          'You run an A/B test on a social feed ranking model. Users in control and treatment can see each other\'s posts. Why is your p-value wrong, and how do you fix the experiment design?',
      },
      {
        topic: 'Offline-online metric gap',
        failSignal:
          'Assumes offline improvements will transfer online or treats offline evaluation as sufficient for deployment decisions.',
        passSignal:
          'States offline metrics can fail to predict online impact; mentions training-serving skew, distribution shift, and feedback loops as causes.',
        strongSignal:
          'Explains position bias in logged data makes offline evaluation optimistic for items shown in lower ranks; counterfactual evaluation (IPS) reweights offline data but has high variance when behavior policies differ; discusses surrogate metric proxies (e.g., click-through rate vs. long-term engagement) and metric gaming; notes that cached model outputs in offline eval don\'t capture real-time context; describes shadow mode deployment as a mitigation.',
        sampleQuestion:
          'Your recsys model improves NDCG by 3% offline but clicks drop 2% in the A/B test. Walk me through the five most likely explanations and how you\'d diagnose which one.',
      },
      {
        topic: 'Label quality and evaluation validity',
        failSignal:
          'Treats labels as ground truth without questioning where they came from or how errors propagate to metric estimates.',
        passSignal:
          'Notes biased or noisy labels degrade model and evaluation; mentions inter-annotator agreement (kappa) as a label quality check.',
        strongSignal:
          'Explains that label noise in test set biases accuracy downward but affects all models equally (systematic error cancels in comparison); label bias (e.g., historical hiring decisions as ground truth for resume screening) means the metric measures conformance to past bias, not true quality; discusses Dawid-Skene model for aggregating noisy annotations; notes that human-rated evaluation sets have their own inter-rater reliability issue even for final benchmarks.',
        sampleQuestion:
          'You\'re training a content moderation model. Your labels come from contractors who saw the content in a specific context. How does this affect both your model and your evaluation — and how would you audit for it?',
      },
      {
        topic: 'Calibration evaluation',
        failSignal:
          'Cannot distinguish a calibrated model from an accurate model, or says calibration is only relevant for probability outputs.',
        passSignal:
          'Uses reliability diagrams and ECE to measure calibration; notes that accuracy and calibration are orthogonal dimensions of model quality.',
        strongSignal:
          'Explains ECE = Σ (|Bₘ|/n) |acc(Bₘ) - conf(Bₘ)|; discusses that ECE depends on bin width choice; Maximum Calibration Error (MCE) focuses on worst bin; temperature scaling is post-hoc and preserves accuracy; for imbalanced classes, classwise-ECE matters; notes deep models are overconfident out-of-the-box due to ReLU saturation and batch norm interactions; discusses reliability in production: a miscalibrated fraud model misprioritizes alerts.',
        sampleQuestion:
          'Your model predicts 90% confidence on cases where it\'s right only 70% of the time. Propose a pipeline to detect, quantify, and correct this before deployment.',
      },
      {
        topic: 'Precision, recall, and the operating point',
        failSignal:
          'Says "high recall means fewer false negatives" but cannot say what happens to precision as you raise recall, or how to choose a threshold.',
        passSignal:
          'States precision-recall tradeoff; threshold controls operating point on PR curve; F1 is harmonic mean that balances both; selects threshold based on cost of FP vs. FN.',
        strongSignal:
          'Derives that F-beta explicitly weights recall beta times more than precision; discusses asymmetric costs (missing a cancer = 50x more costly than false alarm); argues that the right threshold is determined by decision theory: flag when P(positive) > cost_FP/(cost_FP + cost_FN); notes that at very high class imbalance, precision is the binding constraint and recall curves lose meaning; discusses how downstream system architecture affects the right operating point (manual review capacity limits recall).',
        sampleQuestion:
          'A medical screening model has P(cancer | positive test) = 0.04. A doctor wants to maximize recall. Walk me through whether that\'s the right objective and what threshold you\'d set.',
      },
    ],
  },

  unsupervised: {
    label: 'Unsupervised Learning',
    tabId: 'unsupervised_foundation',
    totalModules: 8,
    masteryDescription:
      'A master of unsupervised learning can match a clustering or dimensionality reduction algorithm to the structure of a dataset, identify when the algorithm is finding noise rather than signal, and interpret outputs in terms of downstream utility.',
    levels: {
      novice:
        'Knows k-means and PCA exist. Cannot explain what objective they optimize or when they fail.',
      building:
        'Can run and tune k-means, PCA, and t-SNE. Understands k-means objective is minimizing within-cluster variance but cannot discuss when it\'s inappropriate.',
      competent:
        'Selects algorithms based on data geometry, validates cluster quality with appropriate metrics, and understands what dimensionality reduction preserves and discards.',
      strong:
        'Can reason about algorithm failure modes from data geometry first principles, design evaluation frameworks for clustering, and apply unsupervised methods in production pipelines.',
      interviewReady:
        'Can walk through which algorithm to use for any given unsupervised task, explain what the loss function encodes, and identify the specific production failure that would occur if the wrong method is chosen.',
    },
    interviewSignals: [
      {
        topic: 'k-means: assumptions and failure modes',
        failSignal:
          'Describes k-means as "assigns each point to the nearest centroid" without discussing what objective it minimizes or when it produces wrong clusters.',
        passSignal:
          'States k-means minimizes within-cluster sum of squared distances; Voronoi partitions are convex; fails on non-convex clusters and different cluster sizes.',
        strongSignal:
          'Notes k-means assumes isotropic Gaussian clusters — it\'s really EM on Gaussian mixture with equal spherical covariance; explains that the objective is non-convex (NP-hard to solve exactly), so k-means++ initialization matters; discusses that elbow method for k is unreliable — silhouette score or BIC on GMM is better; flags that Euclidean distance is sensitive to scale (always standardize) and fails in high dimensions (curse of dimensionality).',
        sampleQuestion:
          'You cluster user behavior embeddings (256-dim) with k-means and get k=50 clusters. Two clusters look visually identical in t-SNE. What are three possible explanations, and which would you investigate first?',
      },
      {
        topic: 't-SNE and UMAP: what they preserve',
        failSignal:
          'Uses t-SNE output to make quantitative claims about cluster distances or inter-cluster separation.',
        passSignal:
          'States t-SNE preserves local neighborhood structure but distorts global distances; UMAP is faster and preserves more global structure; neither should be used for downstream ML directly.',
        strongSignal:
          'Explains t-SNE uses Student-t distribution in low-dim to address crowding problem; perplexity controls effective neighborhood size; different runs with same perplexity can give different topologies (random initialization, local optima); UMAP uses fuzzy simplicial sets (topological structure) and is faster via nearest-neighbor graph; cluster sizes in t-SNE are meaningless; distances between clusters are not comparable; both methods are for visualization, not for feeding into other models.',
        sampleQuestion:
          'You run t-SNE on customer embeddings and see 8 distinct clusters. You run it again with different random seed and see 5 clusters. Which is correct, and how do you actually validate the cluster structure?',
      },
      {
        topic: 'DBSCAN and density-based clustering',
        failSignal:
          'Cannot explain what epsilon and min_samples control or why DBSCAN can detect noise points.',
        passSignal:
          'States DBSCAN groups core points with epsilon-neighborhood of at least min_samples points; noise = no core point within epsilon; finds arbitrary-shaped clusters.',
        strongSignal:
          'Explains DBSCAN doesn\'t require k (but does require epsilon, min_samples); automatic noise detection is useful for outlier detection; fails when clusters have varying density (HDBSCAN solves this by varying epsilon); runtime O(n log n) with spatial index vs. O(n²) brute force; discusses that epsilon selection requires understanding the data scale (k-distance plot); contrasts with k-means: no cluster centroid, no size assumption.',
        sampleQuestion:
          'You\'re detecting anomalous network connections. Why is DBSCAN more appropriate than k-means here, and how would you set epsilon in practice?',
      },
      {
        topic: 'PCA: variance, reconstruction, and limitations',
        failSignal:
          'Can run PCA but says it "removes correlated features" rather than explaining it finds a rotation that maximizes variance.',
        passSignal:
          'States PCA finds orthogonal directions of maximum variance; PCs are eigenvectors of the covariance matrix; explained variance ratio guides component selection.',
        strongSignal:
          'Distinguishes PCA (linear, unsupervised) from LDA (linear, supervised — maximizes class separation); notes PCA assumes Gaussian-distributed data and linear structure; discusses that features must be standardized unless same units; reconstruction error = variance not captured; notes PCA for dense embeddings compresses well, but for sparse data (word counts) NMF or SVD on TF-IDF is better; explains why PCA is not appropriate as preprocessing before tree models.',
        sampleQuestion:
          'You apply PCA to reduce 10,000 gene expression features to 50 components before training a classifier. What assumptions does this pipeline make, and when does it hurt you?',
      },
      {
        topic: 'Anomaly detection methods',
        failSignal:
          'Lists methods (Isolation Forest, LOF) without explaining what anomaly definition each uses or when each is appropriate.',
        passSignal:
          'States Isolation Forest isolates anomalies with random splits (anomalies are isolated faster); LOF compares local density to neighbors; both are unsupervised and threshold-dependent.',
        strongSignal:
          'Explains Isolation Forest works on high-dim data and handles clusters well; LOF fails in high dimensions (density estimation degrades); reconstruction-error from autoencoder is strong for structured data but requires architecture decisions; discusses that anomaly detection has no ground truth by definition — evaluation requires domain knowledge or labeled anomaly holdouts; flags that in production, anomaly detectors drift as normal behavior changes — need periodic retraining; discusses the high false-positive problem at low anomaly base rates.',
        sampleQuestion:
          'You deploy an autoencoder for anomaly detection in manufacturing sensor data. Six months in, the reconstruction threshold is generating 5x more alerts than before. What are the three most likely causes and how do you diagnose them?',
      },
      {
        topic: 'Autoencoders: representation learning',
        failSignal:
          'Describes autoencoders as "neural networks that compress data" without explaining what the bottleneck does or how to validate the representation.',
        passSignal:
          'States encoder maps to latent z, decoder reconstructs x; bottleneck forces learning of compressed representation; trained on reconstruction loss.',
        strongSignal:
          'Explains that vanilla autoencoders can memorize (no constraint on latent space); VAE adds distributional constraint (KL term) forcing meaningful interpolation; denoising autoencoder corrupts input, forcing learning of robust features; contrasts with supervised representation learning — unsupervised may not learn task-relevant features; discusses that reconstruction loss doesn\'t measure downstream usefulness — always probe the representation with a linear classifier; notes contrastive methods (SSL) outperform reconstruction-based methods for downstream tasks.',
        sampleQuestion:
          'Your autoencoder achieves 98% reconstruction accuracy on training data but the latent representations cluster poorly in t-SNE. What\'s happening and what would you change?',
      },
    ],
  },

  causal: {
    label: 'Causal Inference',
    tabId: 'causal_foundation',
    totalModules: 8,
    masteryDescription:
      'A master of causal inference can design and analyze studies that give credible answers to "what would happen if we did X" — distinguishing correlation from causation in a way that holds up under scrutiny and supports business decisions.',
    levels: {
      novice:
        'Knows correlation is not causation. Cannot formalize the distinction or design a study that establishes causality.',
      building:
        'Understands RCT as the gold standard and can describe DiD or IV at a high level. Cannot assess when assumptions hold or are violated.',
      competent:
        'Can apply DiD, IV, and RDD correctly, check key assumptions, and explain what each identifies (ATE, ATT, LATE).',
      strong:
        'Designs identification strategies for real business questions, checks assumptions rigorously (parallel trends, exclusion restriction), and handles violations with sensitivity analysis.',
      interviewReady:
        'Can, given a messy observational dataset and a business question, propose a credible identification strategy, list threats to validity, and quantify how sensitive the conclusion is to unmeasured confounding.',
    },
    interviewSignals: [
      {
        topic: 'Potential outcomes framework',
        failSignal:
          'Cannot write Y(1) and Y(0) notation or explain why the fundamental problem of causal inference exists.',
        passSignal:
          'States Y(1) = outcome if treated, Y(0) = outcome if untreated; ATE = E[Y(1) - Y(0)]; fundamental problem: we observe only one potential outcome per unit.',
        strongSignal:
          'Explains SUTVA: no interference between units (treatment of one doesn\'t affect others — violated in social networks) and no hidden treatment versions; discusses ITT vs. ATT vs. LATE — LATE is identified by IV but only for compliers, not the full population; notes that in observational data, selection bias makes E[Y|T=1] - E[Y|T=0] ≠ ATE unless conditional ignorability holds.',
        sampleQuestion:
          'You want the ATE of a new feed ranking algorithm. You can run an A/B test but users interact with each other — SUTVA is violated. How would you estimate the causal effect?',
      },
      {
        topic: 'Difference-in-Differences',
        failSignal:
          'Says DiD "compares treatment and control before and after" but cannot state the parallel trends assumption or explain when it fails.',
        passSignal:
          'States DiD = (treated post - treated pre) - (control post - control pre); identifies ATT under parallel trends assumption.',
        strongSignal:
          'Explains parallel trends = control counterfactual trend = treated trend absent treatment (untestable in post-period, testable in pre-period via placebo); discusses that DiD with TWFE (two-way fixed effects) is invalid under staggered adoption (different units treated at different times) — Callaway-Sant\'Anna or Sun-Abraham estimators handle this; notes that anticipation effects (behavior changes before treatment) violate the pre-trend test; discusses triple difference as robustness check.',
        sampleQuestion:
          'You roll out a new pricing feature to users in California first, then other states over 6 months. You use a TWFE DiD estimator with state and time fixed effects. What\'s wrong with this, and what estimator should you use?',
      },
      {
        topic: 'Instrumental Variables',
        failSignal:
          'Says IV "uses an instrument to estimate causal effect" but cannot state the three IV assumptions or explain what LATE means.',
        passSignal:
          'States three assumptions: relevance (instrument affects treatment), exclusion (instrument affects outcome only through treatment), independence (instrument is as-good-as-random); LATE = ATE for compliers only.',
        strongSignal:
          'Explains weak instruments (low first-stage F-statistic) inflate IV estimates and standard errors; 2SLS is the standard estimator; discusses that exclusion restriction is untestable — requires economic argument; notes that in fuzzy RDD, the discontinuity serves as the instrument; discusses Mendelian randomization as IV using genetic variants; flags that IV identifies local effect only (compliers) which may not generalize to never-takers.',
        sampleQuestion:
          'You want to estimate the effect of education on earnings. You use distance to college as an IV. List all the ways this instrument could violate the exclusion restriction.',
      },
      {
        topic: 'Regression Discontinuity Design',
        failSignal:
          'Cannot explain what the discontinuity identifies or why observations near the cutoff are the relevant comparison group.',
        passSignal:
          'States RDD uses arbitrary cutoff to create quasi-experiment; units just above and below cutoff are similar except for treatment assignment; estimates local ATE at the cutoff.',
        strongSignal:
          'Distinguishes sharp RDD (deterministic assignment at cutoff) from fuzzy RDD (probability jump, requires IV); discusses bandwidth selection (IK bandwidth is data-driven); density test (McCrary test) checks for manipulation at cutoff (people bunching just above to get treatment); notes estimate is local — extrapolating away from cutoff requires strong assumptions; discusses polynomial order selection (lower polynomial + local linear is often more robust than high-degree polynomial).',
        sampleQuestion:
          'You want to estimate the effect of a scholarship program that awards at exactly 600 on a test score. Students score 599-601 look similar. How do you validate that no one is manipulating their score, and what would that manipulation do to your estimate?',
      },
      {
        topic: 'DAGs and confounding',
        failSignal:
          'Cannot draw a DAG for a simple causal story or explain what a confounder is in DAG terms.',
        passSignal:
          'States confounder = common cause of treatment and outcome; conditioning on confounder blocks the back-door path; collider conditioning opens spurious path.',
        strongSignal:
          'Applies do-calculus and back-door criterion to identify adjustment sets; explains that conditioning on a collider (a variable caused by both treatment and outcome) induces spurious correlation — common mistake in ML feature engineering; discusses M-bias; notes that adding more controls to a regression can increase bias if controls are colliders; connects to ML: regularization-based feature selection can include colliders silently.',
        sampleQuestion:
          'You\'re estimating the effect of an ad exposure on purchase. You control for "visited website" in your regression. Draw the DAG and explain whether this is a confounder or a collider, and what you\'ve just done to your estimate.',
      },
      {
        topic: 'Uplift modeling',
        failSignal:
          'Describes uplift modeling as "predicting who responds to treatment" without being able to define the estimand or say how it differs from a standard classifier.',
        passSignal:
          'States uplift = CATE: τ(x) = E[Y(1)-Y(0)|X=x]; models individual-level treatment effect heterogeneity; used for targeting (only treat persuadables).',
        strongSignal:
          'Explains four customer types: persuadables (treat), sure things (don\'t need treatment), lost causes (treatment doesn\'t help), sleeping dogs (treatment hurts); discusses S-learner vs. T-learner vs. X-learner (X-learner handles imbalanced treatment/control); meta-learners vs. direct CATE estimators (causal forests); notes that uplift cannot be directly evaluated (counterfactual problem) — use Qini curve or uplift by decile on holdout; discusses that training a classifier on "who responded" is wrong (always targets sure things).',
        sampleQuestion:
          'You\'re deciding who to send a promotional coupon to. You train a classifier that predicts P(purchase | received coupon). Why is this the wrong model, and what would you train instead?',
      },
      {
        topic: 'Synthetic control',
        failSignal:
          'Confuses synthetic control with DiD or cannot say what the synthetic control unit is or when it\'s preferred.',
        passSignal:
          'States synthetic control creates a weighted combination of control units that matches the treated unit pre-treatment; estimates counterfactual post-treatment trend.',
        strongSignal:
          'Explains synthetic control is preferred when there is a single treated unit (n=1 in treatment group, making DiD impractical); weights are constrained to be non-negative and sum to 1 (convex combination); inference via permutation/placebo tests (apply the method to each control unit and compare effect size to actual); discusses interpolation vs. extrapolation: SC fails when pre-treatment match is poor; notes that SDID (synthetic DiD) combines both methods\' advantages.',
        sampleQuestion:
          'A country adopts a new tax policy. There is no control country with a randomized design. Walk me through how you\'d use synthetic control to estimate the policy effect and how you\'d compute a p-value.',
      },
    ],
  },

  deep_learning: {
    label: 'Deep Learning',
    tabId: 'deep_learning_foundation',
    totalModules: 12,
    masteryDescription:
      'A master of deep learning can design and debug neural architectures from first principles, reason about training dynamics and optimization, and make informed tradeoffs between architecture, compute, and data at scale.',
    levels: {
      novice:
        'Knows neural networks have layers and use backprop. Cannot derive the gradient update or explain why training fails.',
      building:
        'Can implement standard architectures and debug basic training issues. Understands SGD, dropout, and batch norm at a surface level.',
      competent:
        'Understands training dynamics (loss landscape, learning rate sensitivity, gradient flow), can design appropriate architectures for a given modality, and debugs training instability.',
      strong:
        'Reasons about scaling laws, attention mechanisms, and optimization from mathematical foundations. Can design custom loss functions and training regimes for novel problems.',
      interviewReady:
        'Can justify every architectural choice in terms of inductive biases, discuss what changes at 10x or 100x scale, and reason about inference efficiency tradeoffs.',
    },
    interviewSignals: [
      {
        topic: 'Backpropagation and gradient flow',
        failSignal:
          'Says "backprop computes gradients using chain rule" without being able to trace gradient through a specific layer or explain vanishing gradients.',
        passSignal:
          'Traces gradient through a linear + sigmoid layer; identifies sigmoid saturation causes vanishing gradients; states ReLU mitigates this.',
        strongSignal:
          'Explains gradient = product of Jacobians through layers; in deep sigmoid networks Jacobian spectral norm < 1 → exponential decay; ReLU has gradient = 1 for positive activations (identity Jacobian there); discusses residual connections add identity shortcut so gradient has direct path (ResNet) — gradient = 1 + F\'(x) ≥ 1; notes gradient clipping prevents explosion for RNNs; batch norm reduces internal covariate shift but also changes gradient magnitudes.',
        sampleQuestion:
          'A 50-layer network with tanh activations won\'t train. Walk me through exactly what\'s happening in the gradient computation and list three changes you\'d make, explaining the mechanism for each.',
      },
      {
        topic: 'Attention mechanism and transformers',
        failSignal:
          'Says attention "weighs which tokens are important" without explaining the Q, K, V computation or why scaling by √d is needed.',
        passSignal:
          'States Attention(Q,K,V) = softmax(QKᵀ/√d)V; scaling prevents softmax from entering saturation region in high dimensions; multi-head attention runs multiple attention heads in parallel.',
        strongSignal:
          'Explains that without √d scaling, dot products grow as O(d) → softmax becomes nearly one-hot → gradients vanish; multi-head attention allows the model to attend to different aspects of the input simultaneously (different representation subspaces); discusses that self-attention is O(n²) in sequence length — motivated Flash Attention (compute in tiles to avoid materializing full attention matrix); notes cross-attention in encoder-decoder vs. self-attention; explains why transformers outperform RNNs (parallelism, longer effective context, no gradient bottleneck).',
        sampleQuestion:
          'Why is the attention matrix O(n²) a problem at long context, and what does Flash Attention do about it? Explain at the memory and compute level.',
      },
      {
        topic: 'Batch normalization: mechanics and failure modes',
        failSignal:
          'Says batch norm "normalizes activations" but cannot explain the learnable parameters or when batch norm hurts.',
        passSignal:
          'States BN normalizes to zero mean/unit variance per feature per batch; γ and β are learnable scale and shift; reduces internal covariate shift, allows higher learning rates.',
        strongSignal:
          'Explains that batch statistics at training ≠ population statistics at inference (uses running mean/variance at inference); this causes train-test discrepancy when batch size is small (→ noisy estimates); batch size dependence is a problem for distributed training with very small per-device batches — Group Norm or Layer Norm are alternatives; notes batch norm is inappropriate for autoregressive generation (future tokens would contaminate batch statistics); discusses BN interaction with residual connections and why pre-norm (LN before residual) is preferred in transformers.',
        sampleQuestion:
          'You train a ResNet with batch size 256, then deploy with batch size 1 for real-time inference. What does batch norm do differently at inference, and what failure mode could arise if the deployment setup is wrong?',
      },
      {
        topic: 'Optimizers: SGD vs. Adam and their tradeoffs',
        failSignal:
          'Says Adam is always better than SGD or cannot explain what Adam does differently beyond "adaptive learning rates."',
        passSignal:
          'States Adam maintains per-parameter first and second moment estimates; adapts learning rate to gradient history; converges faster than SGD in early training.',
        strongSignal:
          'Explains Adam uses bias-corrected moment estimates (early steps have small moments, bias correction compensates); Adam can fail to generalize as well as SGD + momentum for image models (flatter minima with SGD → better generalization, empirically); AdamW decouples weight decay from gradient scaling (Adam\'s weight decay is wrong — Adam implicitly scales the L2 penalty by the inverse of the second moment); discusses learning rate warmup (large LR early destabilizes adaptive moments) and cosine annealing; notes Adam is typically preferred for transformers, SGD+momentum for CNNs.',
        sampleQuestion:
          'Adam uses a much higher learning rate than SGD. Why does the same learning rate that diverges SGD work fine for Adam? And why might SGD still generalize better on some benchmarks?',
      },
      {
        topic: 'Fine-tuning and transfer learning',
        failSignal:
          'Says fine-tuning is "training on new data" without discussing what layers to freeze, learning rates, or catastrophic forgetting.',
        passSignal:
          'Freezes early layers (low-level features), fine-tunes later layers; uses lower learning rate to avoid destroying pretrained features; can use full fine-tune or head-only.',
        strongSignal:
          'Explains that lower layers capture domain-general features (edges, syntax) while upper layers are task-specific; freezing lower layers reduces overfitting on small datasets; learning rate should be smaller for pretrained layers (discriminative fine-tuning); discusses catastrophic forgetting — LLMs use LoRA (low-rank adapters) to avoid modifying base weights; RLHF fine-tuning uses a reference model KL penalty to prevent reward hacking via forgetting; discusses prompt tuning / prefix tuning as even lighter alternatives.',
        sampleQuestion:
          'You\'re fine-tuning a 7B-parameter LLM on a 5,000-example domain-specific dataset. Full fine-tuning is too expensive. Walk me through LoRA: what it does mathematically, why it works, and what rank to choose.',
      },
      {
        topic: 'Scaling laws',
        failSignal:
          'Knows bigger models are better but cannot articulate what scaling laws predict or what the Chinchilla result changed.',
        passSignal:
          'States loss scales as power law with N (parameters) and D (tokens); Chinchilla showed GPT-3 was over-parameterized relative to its training data — should scale N and D proportionally.',
        strongSignal:
          'Explains Kaplan et al. power law: L ∝ N^(-α) and L ∝ D^(-β); optimal compute allocation: N ∝ C^0.5, D ∝ C^0.5 (Chinchilla); this means larger models should be trained on more tokens, not just more parameters; discusses that scaling laws are for pretraining loss, not downstream task performance — tasks may show emergent capability thresholds; notes that inference cost grows with N while training cost grows with N×D — deployment considerations shift the optimal point toward smaller models trained longer (Llama philosophy).',
        sampleQuestion:
          'You have a fixed compute budget of 10²³ FLOPs. How do you decide the model size and training tokens? Walk through the Chinchilla reasoning and any caveats for your use case.',
      },
      {
        topic: 'Inference efficiency: KV cache, quantization, distillation',
        failSignal:
          'Cannot explain why transformer inference is memory-bound or what KV cache trades off.',
        passSignal:
          'States KV cache stores past key/value pairs to avoid recomputation; quantization reduces weight precision (FP16→INT8→INT4) to reduce memory and increase throughput.',
        strongSignal:
          'Explains that autoregressive generation is memory-bandwidth bound (read weights for each token → compute is cheap, bandwidth is the bottleneck); KV cache trades memory for compute (memory grows as O(n × layers × d)); discusses speculative decoding: small draft model generates tokens, large model verifies in parallel — 2-4x speedup with no quality loss; quantization: post-training quantization (PTQ) is fast but loses accuracy at low bit-width, QAT (quantization-aware training) recovers it; knowledge distillation trains a small student to match large teacher\'s soft logits, not just labels.',
        sampleQuestion:
          'You need to serve a 70B-parameter model at 100 requests/second with p99 latency < 500ms. Walk me through the deployment options and the tradeoffs: which ones reduce latency, which ones reduce cost, and what quality you give up.',
      },
    ],
  },

  self_supervised: {
    label: 'Self-supervised Learning',
    tabId: 'self_supervised_foundation',
    totalModules: 9,
    masteryDescription:
      'A master of SSL understands how contrastive, predictive, and generative objectives shape representation quality, can select and adapt pretraining strategies for their modality and downstream task, and knows why SSL representations outperform supervised ones in low-label regimes.',
    levels: {
      novice:
        'Knows SSL "learns without labels." Cannot explain the pretext task or what makes a good representation.',
      building:
        'Can describe SimCLR and MAE at a high level. Understands contrastive loss pushes positives together and negatives apart.',
      competent:
        'Understands the mechanics of augmentation design, collapse prevention, and downstream adaptation; can compare contrastive vs. generative objectives.',
      strong:
        'Reasons about representation geometry, understands why BYOL works without negatives, designs augmentation strategies for new modalities.',
      interviewReady:
        'Can select the right SSL approach for any modality and task, explain what the pretraining objective biases the representation toward, and discuss when SSL helps vs. hurts over supervised pretraining.',
    },
    interviewSignals: [
      {
        topic: 'SimCLR and contrastive learning',
        failSignal:
          'Says SimCLR "makes similar images similar" but cannot state the NT-Xent loss or explain why large batch size is required.',
        passSignal:
          'States NT-Xent loss treats two augmented views of same image as positive, all others in batch as negatives; temperature τ controls concentration; larger batch → more negatives → better representations.',
        strongSignal:
          'Explains that NT-Xent is a softmax cross-entropy over 2(N-1) negatives per anchor; small τ makes loss concentrate on hard negatives; projection head g(·) maps to contrastive space — representations are extracted before projection head for downstream tasks (Chen et al. found this critical); discusses that SimCLR requires 4096+ batch size for enough negatives, motivating MoCo\'s momentum queue as memory bank alternative; augmentation design is critical: crop+color jitter forces learning of semantic features rather than color statistics.',
        sampleQuestion:
          'Why does SimCLR require a large batch size, and what does MoCo do to solve this? What are the tradeoffs between them at 64-GPU scale?',
      },
      {
        topic: 'BYOL: learning without negatives',
        failSignal:
          'Says BYOL works like SimCLR but without negatives, and cannot explain why it doesn\'t collapse to a constant representation.',
        passSignal:
          'States BYOL uses online and target networks; target network uses momentum update (slow copy); no negative pairs needed; online network learns to predict target representations.',
        strongSignal:
          'Explains the collapse mystery: naively, without negatives, both networks collapse to the same constant; BYOL avoids this because of the asymmetry: only online network has a predictor MLP on top; stop-gradient on target prevents target from adapting to online, breaking the symmetry that leads to collapse; batch norm in the predictor is also crucial — without it, BYOL collapses; discusses that this was discovered empirically (Tian et al. showed BN is load-bearing); connects to DirectCLR and understanding that implicit negatives come from cross-batch statistics.',
        sampleQuestion:
          'BYOL has no negative pairs. Theoretically, what prevents the online and target networks from both collapsing to output a constant vector? Be precise about the mechanism.',
      },
      {
        topic: 'Masked Autoencoders (MAE)',
        failSignal:
          'Describes MAE as "masking tokens and predicting them" without distinguishing it from BERT masking or explaining what the masking ratio means.',
        passSignal:
          'States MAE masks 75% of image patches and trains encoder-decoder to reconstruct pixels; high masking ratio forces learning of semantic features rather than interpolation.',
        strongSignal:
          'Explains that MAE is an asymmetric autoencoder: encoder only sees unmasked patches (efficiency), decoder is lightweight and applied to full sequence; 75% masking is much higher than BERT\'s 15% — image patches are highly redundant, so low masking is trivially solved by interpolation; reconstruction in pixel space forces understanding of image semantics; contrasts with BEiT (discrete token prediction, more like BERT); discusses that MAE representations are strong for recognition tasks but not for generation (decoder is intentionally weak).',
        sampleQuestion:
          'Why does MAE use 75% masking while BERT uses only 15%? What would happen if you used 15% masking for image patches?',
      },
      {
        topic: 'CLIP and multimodal SSL',
        failSignal:
          'Describes CLIP as "connecting images and text" without explaining the training objective or why the image and text encoders are separate.',
        passSignal:
          'States CLIP trains image and text encoders to maximize cosine similarity of matched image-text pairs and minimize it for unmatched pairs; uses InfoNCE loss over a batch.',
        strongSignal:
          'Explains that CLIP\'s contrastive loss over a batch of N pairs forms an N×N similarity matrix — diagonal entries are positives; the scale of N (400M image-text pairs) is what makes zero-shot transfer work; discusses zero-shot classification via prompt engineering ("a photo of a {class}"); notes CLIP\'s zero-shot is strong for common visual concepts but fails for specialized domains (pathology, satellite imagery) without fine-tuning; discusses LiT (locked image tuning) as a more efficient alternative — freeze CLIP image encoder, fine-tune text encoder; connects to ALIGN, Florence, and OpenCLIP.',
        sampleQuestion:
          'You want to use CLIP for medical image classification. Zero-shot performance is poor. Walk me through three adaptation strategies in increasing order of compute cost and explain the tradeoffs.',
      },
      {
        topic: 'Downstream adaptation strategies',
        failSignal:
          'Says fine-tuning a pretrained model means "training it on your dataset" without distinguishing linear probing, fine-tuning, and prompt tuning.',
        passSignal:
          'Distinguishes linear probing (freeze encoder, train linear head), full fine-tuning (update all weights), and few-shot prompting; notes linear probing is a diagnostic of representation quality.',
        strongSignal:
          'Explains that linear probe accuracy measures how linearly separable the representation is — a strong SSL model should have high linear probe performance; full fine-tuning can improve further but risks losing SSL features with too high LR or small dataset; LP-FT (linear probing then fine-tuning) is a better initialization for fine-tuning; discusses LoRA for large models; notes that the gap between linear probe and fine-tuning accuracy indicates how task-specific fine-tuning needs to be; connects to VTAB benchmark structure (natural, specialized, structured).',
        sampleQuestion:
          'You have a pretrained ViT-L and 500 labeled examples for a medical image classification task. Rank linear probing, full fine-tuning, and LoRA in terms of expected performance and explain the risk of each.',
      },
    ],
  },

  rl: {
    label: 'Reinforcement Learning',
    tabId: 'rl_foundation',
    totalModules: 10,
    masteryDescription:
      'A master of RL can design reward functions, choose appropriate algorithms for an environment\'s properties (continuous/discrete, on/off-policy, sparse/dense reward), debug training instability, and reason about the gap between simulated and real-world performance.',
    levels: {
      novice:
        'Knows RL is about reward maximization via trial-and-error. Cannot formalize an MDP or explain the Bellman equation.',
      building:
        'Can implement Q-learning and policy gradients on simple environments. Understands exploration vs. exploitation at a high level.',
      competent:
        'Understands why DQN tricks (experience replay, target network) are needed, can select algorithms based on action/observation space, and diagnoses training instability.',
      strong:
        'Can derive policy gradient theorem, understand why PPO\'s clipping works, design reward functions for real tasks, and reason about sample efficiency.',
      interviewReady:
        'Can map a production RL problem (recsys, content ranking, RLHF) to algorithm choice and identify the specific failure modes that will arise from reward hacking, distribution shift, and off-policy evaluation error.',
    },
    interviewSignals: [
      {
        topic: 'Bellman equations and value functions',
        failSignal:
          'Says Q-value is "how good an action is" without writing the Bellman equation or explaining the recursive structure.',
        passSignal:
          'States Q*(s,a) = r(s,a) + γ max_a\' Q*(s\',a\'); Bellman optimality equation; V*(s) = max_a Q*(s,a); policy extraction via greedy action selection.',
        strongSignal:
          'Explains Bellman equation is a contraction mapping under max-norm when γ < 1 — guarantees convergence of value iteration; in stochastic environments, Q*(s,a) = E[r + γ max_a\' Q*(s\',a\')]; discusses that tabular Q-learning converges but requires visiting all (s,a) pairs — impractical for large spaces; DQN approximates Q* with a neural network, which introduces bias and breaks convergence guarantees; discusses deadly triad (function approximation + off-policy + bootstrapping → divergence).',
        sampleQuestion:
          'Q-learning converges to the optimal policy in tabular settings but can diverge with neural function approximation. Explain why, and what DQN\'s target network and experience replay do to address this.',
      },
      {
        topic: 'Policy gradient theorem',
        failSignal:
          'Cannot derive the policy gradient or explain why REINFORCE has high variance.',
        passSignal:
          'States ∇J(θ) = E[∇ log π(a|s,θ) · Q(s,a)]; REINFORCE uses Monte Carlo returns; baseline (value function) reduces variance without introducing bias.',
        strongSignal:
          'Derives policy gradient theorem from ∇J = ∇ Σ d(s) Σ π(a|s) Q(s,a); explains log-derivative trick; REINFORCE has high variance because G_t is a single sample of the return; baseline b(s) reduces variance: E[∇ log π(a|s) b(s)] = 0 (b independent of a); actor-critic replaces Monte Carlo return with bootstrapped Q̂ (reduces variance at cost of bias); discusses that variance grows with episode length, motivating GAE (Generalized Advantage Estimation) which interpolates between TD and Monte Carlo.',
        sampleQuestion:
          'REINFORCE has high variance. Walk me through the policy gradient with a baseline, prove the baseline doesn\'t introduce bias, and then explain why actor-critic trades bias for variance.',
      },
      {
        topic: 'PPO and trust region methods',
        failSignal:
          'Knows PPO is widely used but cannot explain the clipping objective or why TRPO\'s KL constraint was replaced with clipping.',
        passSignal:
          'States PPO clips the importance weight ratio r_t(θ) = π_θ/π_θ_old to [1-ε, 1+ε]; prevents large policy updates; TRPO uses KL constraint but requires expensive conjugate gradient.',
        strongSignal:
          'Explains TRPO constrains update to stay within KL ball: max E[r_t(θ)A_t] s.t. KL(π_θ‖π_θ_old) ≤ δ; requires second-order optimization (natural gradient via conjugate gradient); PPO approximates TRPO with clipping — cheaper, similar empirical performance; discusses that PPO clipping is min(r_t A_t, clip(r_t, 1-ε, 1+ε) A_t) — when A > 0, allows modest increase; when A < 0, prevents ratio from getting too small (prevents degrading good actions); PPO with multiple epochs of minibatch updates on collected data is the practical trick.',
        sampleQuestion:
          'Explain the PPO clipping objective. Draw the loss as a function of r_t for positive and negative advantage. What does each regime prevent?',
      },
      {
        topic: 'RLHF: reward models and alignment',
        failSignal:
          'Describes RLHF as "training with human feedback" without explaining the reward model, the PPO step, or the KL penalty.',
        passSignal:
          'States RLHF: (1) supervised fine-tuning, (2) train reward model from human preferences, (3) optimize LM against reward model with PPO; KL penalty prevents reward hacking.',
        strongSignal:
          'Explains that reward model is trained on pairwise comparisons (Bradley-Terry model); reward hacking = model finds inputs that exploit reward model errors without being actually helpful; KL penalty: R(x,y) = r_θ(x,y) - β KL(π_φ‖π_ref) keeps model close to SFT baseline; discusses that PPO in RLHF is notoriously unstable (reward model OOD, generation diversity collapse); DPO (Direct Preference Optimization) bypasses RL by directly optimizing preference objective — equivalent to RLHF under strong assumptions but simpler; notes that reward models also have alignment tax (good reward ≠ good outcome).',
        sampleQuestion:
          'DPO claims to be equivalent to RLHF without the RL. What assumptions does this equivalence require, and in what practical scenarios does DPO fail where PPO-based RLHF would not?',
      },
      {
        topic: 'Exploration strategies',
        failSignal:
          'Says "epsilon-greedy is exploration" without discussing when it fails or what alternatives exist.',
        passSignal:
          'States ε-greedy explores randomly; UCB balances exploration/exploitation with confidence bounds; Thompson sampling samples from posterior over action value.',
        strongSignal:
          'Explains ε-greedy does dumb exploration (uniform random, ignores state); UCB upper confidence bound = Q̂(a) + c√(ln t/N(a)) — optimistic initialization as alternative; curiosity-driven exploration uses prediction error of a world model as intrinsic reward — effective in sparse-reward settings; RND (Random Network Distillation) is a scalable curiosity approach; discusses that in LLM RLHF, exploration = generation diversity — KL penalty to reference model implicitly controls exploration; count-based methods don\'t scale to continuous spaces → neural density models.',
        sampleQuestion:
          'You\'re training an RL agent in a sparse-reward 3D navigation task. The reward is given only on reaching the goal. ε-greedy never reaches the goal. Design an exploration approach.',
      },
      {
        topic: 'Off-policy evaluation',
        failSignal:
          'Cannot define on-policy vs. off-policy or explain why evaluating a policy from logged data is hard.',
        passSignal:
          'States off-policy = learning from data collected under a different behavior policy; importance sampling reweights to correct for distribution mismatch.',
        strongSignal:
          'Explains direct method (DM) fits a reward model, high bias if model wrong; importance sampling (IS) reweights but high variance when behavior and eval policies differ much; doubly robust estimator combines both — consistent if either model or IS weights correct; variance of IS grows exponentially with horizon length (product of importance weights); discusses that in recsys, logged data is heavily biased toward popular items — inverse propensity scoring (IPS) corrects for it; notes POEM, SNIPS (self-normalized IS) as variance reduction techniques.',
        sampleQuestion:
          'You want to evaluate a new recommendation policy using 6 months of logged interaction data. The logging policy was ε-greedy. What are the failure modes of direct importance sampling, and how would you use a doubly robust estimator?',
      },
    ],
  },

  production: {
    label: 'Production / Feature Eng',
    tabId: 'production_foundation',
    totalModules: 10,
    masteryDescription:
      'A master of production ML builds systems where the model in serving makes predictions on the same distribution it was trained on, features are computed correctly and efficiently, and failures are detected before they cause business harm.',
    levels: {
      novice:
        'Knows models need features. Cannot explain training-serving skew or why point-in-time correctness matters.',
      building:
        'Can build feature pipelines that work in offline settings. Starts to think about latency and throughput but hasn\'t been burned by skew yet.',
      competent:
        'Designs feature pipelines with point-in-time correctness, understands the causes of training-serving skew, and can spec a feature store.',
      strong:
        'Designs end-to-end ML systems with explicit contracts between training and serving, handles online vs. batch feature tradeoffs, and reasons about latency SLAs.',
      interviewReady:
        'Can walk through a production ML system design, identify every place where training and serving can diverge, and propose guardrails for each.',
    },
    interviewSignals: [
      {
        topic: 'Training-serving skew',
        failSignal:
          'Says skew is when train and prod distributions differ, but cannot name specific causes or how to detect them.',
        passSignal:
          'Lists causes: different feature engineering code, data preprocessing mismatches, leakage in training that doesn\'t exist at serving, different null handling; suggests feature logging and distribution comparison.',
        strongSignal:
          'Explains the specific failure modes: (1) feature transformation in training uses fitted statistics (e.g., StandardScaler fitted on train data) but serving scaler isn\'t updated → silent drift; (2) training uses future information (leakage) that isn\'t available at serving → 100% offline accuracy, random online; (3) feature engineering code duplication between Python (training) and Java (serving) → bugs; proposes using a shared feature store or transforming at log time to create parity; discusses shadow mode to compare training-time vs. serving-time feature distributions before launch.',
        sampleQuestion:
          'You train a churn model with a 90-day rolling average feature. Offline AUC is 0.89. Online it\'s 0.62. What are your top three hypotheses and what do you log to diagnose them?',
      },
      {
        topic: 'Point-in-time correctness',
        failSignal:
          'Cannot explain what point-in-time join means or why using future data in a feature causes leakage.',
        passSignal:
          'States point-in-time correctness: when creating training data, each example\'s features should reflect values available at the time of the label event — not future values.',
        strongSignal:
          'Explains that without point-in-time correctness, a label from day T might be joined to features computed with data from day T+30 (future leakage) — gives artificially high offline metrics but fails at serving (serving uses features available now, not from the future); gives concrete example: customer account balance at time of transaction (not current balance); discusses that feature stores like Feast, Tecton, or Hopsworks implement point-in-time joins; notes that time-based train/validation splits are necessary — random splits leak future into validation.',
        sampleQuestion:
          'Walk me through a concrete feature engineering pipeline for a fraud detection model. At which exact step does point-in-time correctness become critical, and what goes wrong without it?',
      },
      {
        topic: 'Feature stores: purpose and design',
        failSignal:
          'Cannot explain what problem a feature store solves or why you can\'t just compute features in the model serving layer.',
        passSignal:
          'States feature stores provide a central repository of features; solve training-serving consistency; enable feature reuse across teams; have offline (batch) and online (low-latency) access paths.',
        strongSignal:
          'Explains the dual-store architecture: offline store (e.g., S3 + Hive for training data creation, point-in-time joins), online store (e.g., Redis/DynamoDB for low-latency serving); feature registry maintains metadata and versioning; discusses the consistency challenge: offline store has correct historical values, online store has current values — materialization latency can cause staleness; explains that feature freshness SLA depends on feature type (user demographics: days, clickstream: minutes, real-time signals: seconds); discusses backfill as the process of computing historical feature values correctly for model training.',
        sampleQuestion:
          'Design a feature store for a recommendation system. Your features include user historical embeddings (updated daily), session clickstream (last 30 minutes), and item metadata (updated hourly). How do you architect the offline and online stores to satisfy both training consistency and p99 < 10ms serving latency?',
      },
      {
        topic: 'Data pipelines and orchestration',
        failSignal:
          'Treats data pipeline as a script that runs. Cannot discuss failure modes, idempotency, or orchestration concerns.',
        passSignal:
          'Knows Airflow/Spark for orchestration; discusses scheduling, retries on failure, dependency management between tasks.',
        strongSignal:
          'Explains idempotency: re-running a pipeline step should produce the same result (write to a partition keyed by date, not append); discusses exactly-once vs. at-least-once semantics — at-least-once is easier but requires downstream deduplication; explains that Spark lazy evaluation means transformations aren\'t executed until an action — critical for debugging; discusses incremental vs. full recompute tradeoffs; notes that Airflow doesn\'t guarantee correct execution, just scheduling — monitoring and alerting on SLA misses is the actual reliability mechanism; explains data lineage for debugging feature values.',
        sampleQuestion:
          'Your training pipeline runs daily at 2am. At 3am, you detect that today\'s model has much lower precision than yesterday\'s. How do you design the pipeline so you can quickly identify which upstream data table caused the regression?',
      },
      {
        topic: 'Model serving and latency tradeoffs',
        failSignal:
          'Says "deploy the model as an API" without thinking about latency, throughput, model size, or batching.',
        passSignal:
          'Discusses online vs. batch prediction; notes that neural models are compute-heavy; mentions model quantization and caching predictions for popular inputs.',
        strongSignal:
          'Explains the latency stack: feature retrieval (Redis lookup, ~1ms), model inference (GPU/CPU, 5-50ms), post-processing (ranking, business rules); discusses that GPU inference is faster but requires batching — batching reduces throughput latency but increases p99 latency for individual requests; model caching only works for low-cardinality inputs; discusses model distillation to reduce inference size; notes that two-stage architectures (cheap retrieval + expensive ranking) are the standard at scale; discusses ONNX and TensorRT for inference optimization.',
        sampleQuestion:
          'You need to serve a transformer-based ranking model at p99 < 50ms for 10,000 requests/second. Walk me through the system design decisions: hardware, batching, model optimization, and fallback strategy.',
      },
      {
        topic: 'Label collection and feedback loops',
        failSignal:
          'Treats labels as exogenous data that arrives cleanly. Cannot discuss how model predictions affect future labels.',
        passSignal:
          'States that in production, model predictions influence user behavior, which affects future training labels — feedback loop; gives click-through rate as an example.',
        strongSignal:
          'Explains position bias: items shown higher get more clicks regardless of quality — logged click data reflects exposure policy, not item quality; proposes inverse propensity scoring or randomization (epsilon-explore) to collect less biased labels; discusses that label collection lag creates temporal mismatch (model trained on 30-day lag labels, but deployed immediately); notes that for implicit feedback (clicks, watches), positive labels are noisy (accidental clicks) and negative labels are missing not zero; discusses bandit feedback: only label for shown items, not full slate.',
        sampleQuestion:
          'You train a content ranking model on historical click data. The model is deployed and starts serving. After 3 months, you retrain on new data. How has the feedback loop affected what you\'re training on, and how do you mitigate this?',
      },
    ],
  },

  monitoring: {
    label: 'Monitoring & Drift',
    tabId: 'monitoring_foundation',
    totalModules: 8,
    masteryDescription:
      'A master of monitoring builds systems that detect model degradation before users notice, distinguish root causes (data drift vs. concept drift vs. infrastructure failure), and respond with the right remediation — not just retraining.',
    levels: {
      novice:
        'Knows models can degrade over time. Cannot distinguish types of drift or describe how to detect them.',
      building:
        'Can set up basic monitoring (prediction distribution, feature statistics) and knows to trigger retraining when metrics drop.',
      competent:
        'Distinguishes data drift from concept drift, selects appropriate statistical tests, and designs monitoring dashboards with actionable alerts.',
      strong:
        'Designs monitoring systems that catch subtle drift early, perform root cause analysis across the feature-prediction-outcome pipeline, and balance alert sensitivity with false alarm rate.',
      interviewReady:
        'Can specify a complete monitoring architecture for a production ML system, reason about what to monitor when labels are delayed or unavailable, and design an automated response system.',
    },
    interviewSignals: [
      {
        topic: 'Data drift vs. concept drift',
        failSignal:
          'Uses "drift" without distinguishing data drift (input distribution changes) from concept drift (relationship between inputs and labels changes).',
        passSignal:
          'States data drift: P(X) changes; concept drift: P(Y|X) changes; both can cause model degradation; only concept drift directly changes the optimal model.',
        strongSignal:
          'Explains that data drift can degrade performance even if P(Y|X) is unchanged — model was trained on different input distribution; gives concrete example: ad CTR model trained in normal economy, deployed during recession — user behavior (X distribution) shifts but also click-per-impression relationship (P(Y|X)) may shift; discusses virtual drift (new data looks different but decision boundary unchanged) vs. real drift (boundary changes); notes that data drift is detectable without labels but concept drift detection requires labels (or proxy labels); proposes monitoring both feature distributions and prediction distributions as early warning signals.',
        sampleQuestion:
          'A fraud detection model\'s alert rate triples overnight. Walk me through how you distinguish between data drift, concept drift, a bug in feature computation, and a bug in the model serving code.',
      },
      {
        topic: 'PSI and KS test for drift detection',
        failSignal:
          'Cannot describe how PSI or KS test work or what they are sensitive to.',
        passSignal:
          'States PSI = Σ (A_i - E_i) × ln(A_i/E_i) over bins; PSI < 0.1 = no change, 0.1-0.25 = minor, >0.25 = major; KS test measures max difference between empirical CDFs.',
        strongSignal:
          'Notes PSI is symmetric and aggregated (misses distributional shape changes within bins), KS test is more sensitive to local CDF shifts; PSI requires binning choices that affect sensitivity; KS test is distribution-free and has known null distribution (power grows with n); discusses that both are univariate — multivariate drift requires either marginal monitoring (misses joint distribution changes) or dimension reduction; proposes Maximum Mean Discrepancy (MMD) for embedding-level drift detection; discusses that statistical significance ≠ practical significance — set thresholds based on downstream metric sensitivity.',
        sampleQuestion:
          'You monitor 200 input features with PSI. After Bonferroni correction, you still get 12 flagged features weekly — too many to investigate. How do you design a monitoring system that reduces false alert rate while still catching real drift?',
      },
      {
        topic: 'Monitoring without labels',
        failSignal:
          'Assumes monitoring requires labels — cannot describe proxy signals or leading indicators of model degradation.',
        passSignal:
          'Proposes monitoring prediction distribution shift, feature distribution shift, and null/missing rate as proxy signals for degradation.',
        strongSignal:
          'Explains that prediction distribution drift is the most direct proxy for model quality change without labels; discusses monitoring the full prediction distribution (not just mean) — shifts in tail behavior matter most for high-stakes decisions; proposes using a small labeled set with high-confidence labeling (random sample, 100 cases/week) for delayed ground truth estimation; discusses proxy labels: in recsys, engagement metrics arrive quickly; in fraud, chargebacks arrive with 30-day delay — monitor transaction patterns as proxy; proposes behavioral consistency checks (model shouldn\'t suddenly change prediction for semantically equivalent inputs).',
        sampleQuestion:
          'You deploy a loan default prediction model. Labels (actual default) arrive 12 months later. How do you monitor model health during those 12 months?',
      },
      {
        topic: 'Model retraining strategy',
        failSignal:
          'Says "retrain when metrics drop" without specifying trigger conditions, retraining frequency, or validation before deployment.',
        passSignal:
          'Distinguishes scheduled retraining (fixed frequency), triggered retraining (drift threshold), and online learning (continuous updates); notes retraining doesn\'t help with concept drift without new labels.',
        strongSignal:
          'Explains three triggers: schedule (weekly/monthly regardless), drift-based (PSI/KS threshold crossed), performance-based (online metric drop); discusses that retraining requires fresh labeled data — if labels are delayed, you\'re always training on stale labels; proposes progressive validation: always test new model on recent holdout before deployment; discusses catastrophic forgetting in online learning — mixing old and new data with appropriate weights; notes that the retraining pipeline itself must be monitored (did the retrain succeed? Did it improve offline metrics? Is shadow mode comparison passing?).',
        sampleQuestion:
          'Your fraud model degrades 2 months after each retraining. Describe the retraining and validation pipeline that would catch degradation early and automatically trigger safe retraining.',
      },
      {
        topic: 'Incident response for ML failures',
        failSignal:
          'Cannot describe an ML-specific incident response process or distinguish model failure from data pipeline failure.',
        passSignal:
          'Describes incident triage: first determine if it\'s model, data, or infrastructure; then fallback to previous model or rule-based system; then root cause analysis and fix.',
        strongSignal:
          'Explains that model failure symptoms overlap with data pipeline failures — must instrument both feature values at serving and model predictions independently; discusses canary deployment (send 1% of traffic to new model) as standard pre-deployment guard; proposes shadow mode (run new model in parallel, log outputs without serving them) for risk-free comparison; discusses that emergency rollback must be faster than model retraining — requires versioned model artifacts and one-click rollback capability; notes that post-incident review should determine whether the failure would have been caught by existing monitoring or requires new signals.',
        sampleQuestion:
          'At 9pm, your recsys model starts recommending almost no new content — users see the same 50 items repeatedly. Walk me through the incident response process: how you triage, what you check, and how you decide between rollback and hotfix.',
      },
    ],
  },

  system_design: {
    label: 'ML System Design',
    tabId: 'system_design_foundation',
    totalModules: 8,
    masteryDescription:
      'A master of ML system design can walk from a product requirement to a complete system specification — choosing appropriate models, defining the training and serving data flows, identifying failure modes, and making explicit tradeoffs — in a structured, communicable way.',
    levels: {
      novice:
        'Describes systems as "a model that does X." Cannot discuss data flow, system components, or production concerns.',
      building:
        'Can name relevant components (feature store, model server, A/B test) but cannot structure a coherent end-to-end design or justify choices.',
      competent:
        'Applies a structured framework (problem → data → model → evaluation → deployment → monitoring), makes reasonable tradeoffs, and covers most critical design decisions.',
      strong:
        'Designs scalable ML systems with explicit SLAs, discusses failure modes and fallback strategies, and compares architectural options with tradeoff analysis.',
      interviewReady:
        'Can communicate a complete, production-grade ML system design in 45 minutes that a senior engineer could implement — clarifying requirements, scoping appropriately, and proactively addressing the constraints the interviewer will raise.',
    },
    interviewSignals: [
      {
        topic: 'Two-tower retrieval architecture',
        failSignal:
          'Proposes applying a complex model to every (user, item) pair at query time without considering the computational impossibility at scale.',
        passSignal:
          'States two-tower: separate user and item encoders; embed offline (items) or in real-time (users); ANN search retrieves top-K; followed by ranking stage.',
        strongSignal:
          'Explains that dot product similarity in embedding space enables FAISS/ScaNN for sub-linear ANN search; item embeddings can be pre-computed and cached (items update infrequently); user tower runs online per request; discusses that dot product has a retrieval bias toward popular items — add soft-negatives or in-batch negatives carefully; explains that two towers can\'t model user-item interactions within retrieval — that\'s what the ranking stage is for; discusses cold-start: new items have no embedding — use content features or warm up with a separate path.',
        sampleQuestion:
          'Design a retrieval system for a video recommendation platform with 500M videos and 200M daily active users. Walk through the two-tower design, ANN serving setup, and what metadata index you\'d maintain for hard filtering.',
      },
      {
        topic: 'RecSys end-to-end: retrieval → ranking → reranking',
        failSignal:
          'Describes a single model that scores all items — doesn\'t understand the funnel or why multiple stages are necessary.',
        passSignal:
          'Describes the funnel: candidate generation (retrieval, ~1000 candidates), ranking (more expensive model on top-K), reranking (business rules, diversity, freshness).',
        strongSignal:
          'Explains each stage\'s latency and accuracy tradeoff: retrieval must be < 10ms for ANN search, ranking can be 50-100ms for a deep model on 1000 candidates; reranking layer handles non-ML constraints (regulatory, author diversity, anti-echo-chamber); discusses multi-objective optimization at ranking stage (clicks + watch time + shares — can\'t just add, use Pareto or scalarize with learned weights); notes that cascade training causes exposure bias (ranking model only sees what retrieval passes); discusses listwise vs. pointwise vs. pairwise ranking loss.',
        sampleQuestion:
          'Your ranking model is a 4-layer transformer with 1000 candidates. P99 latency is 120ms, SLA is 100ms. What are your options, and what does each give up?',
      },
      {
        topic: '6-step ML design framework',
        failSignal:
          'Dives directly into model architecture without clarifying requirements, defining the problem as ML, or discussing data.',
        passSignal:
          'Covers problem formulation, data requirements, modeling, evaluation, deployment, and monitoring in some structured way.',
        strongSignal:
          'Uses a consistent framework: (1) clarify requirements + success metrics + constraints; (2) frame as ML problem (supervised/unsupervised/RL, what is X and Y); (3) data — sources, volume, freshness, labeling; (4) features — what signals, how computed, online vs. offline; (5) modeling — architecture, training objective, baseline first then iteration; (6) evaluation — offline metrics, A/B test design, rollout plan; (7) deployment — latency SLA, fallback, canary; (8) monitoring — what to track, alert thresholds; explicitly calls out the tradeoff between model complexity and latency; asks clarifying questions before committing to choices.',
        sampleQuestion:
          'Design a spam detection system for a messaging platform with 50M messages/day. The latency requirement is < 20ms per message. Start by clarifying requirements before proposing anything.',
      },
      {
        topic: 'ML platform and infrastructure design',
        failSignal:
          'Cannot describe what components constitute an ML platform or why you\'d build one rather than using ad-hoc scripts.',
        passSignal:
          'Names key components: feature store, model registry, training orchestration, serving infrastructure, monitoring; explains value is standardization and reuse.',
        strongSignal:
          'Explains the ML platform as a set of abstractions that let teams iterate quickly: (1) data layer (feature store, data catalog, label store); (2) training layer (experiment tracking, distributed training, hyperparameter search); (3) model management (registry, versioning, lineage); (4) serving layer (online inference, batch scoring, shadow mode); (5) monitoring layer (feature stats, prediction stats, ground truth comparison); discusses the build vs. buy decision — MLflow/SageMaker vs. custom; notes that the platform is only as good as its developer experience (slow pipeline = teams work around it); discusses the single vs. multi-model serving tradeoff (model server vs. dedicated container per model).',
        sampleQuestion:
          'Your ML team has 50 engineers and 200+ models in production. Models are served as ad-hoc containers with no standardization. Design the ML platform migration — what do you build first and why?',
      },
    ],
  },

  time_series: {
    label: 'Time Series',
    tabId: 'time_series_foundation',
    totalModules: 9,
    masteryDescription:
      'A master of time series can assess stationarity and autocorrelation structure, match a forecasting method to the data\'s characteristics, and design evaluation frameworks that respect temporal ordering — avoiding the leakage pitfalls that make time series uniquely tricky.',
    levels: {
      novice:
        'Knows time series data is ordered by time. Cannot explain stationarity or why you can\'t use random train/test splits.',
      building:
        'Can apply ARIMA and Prophet with default settings. Understands seasonality and trend at a descriptive level.',
      competent:
        'Diagnoses stationarity issues, selects forecasting models based on data characteristics, and designs temporally valid evaluation schemes.',
      strong:
        'Derives ARIMA from first principles, connects forecasting model choice to autocorrelation structure, and handles real-world complications (missing data, multiple seasonalities, irregular time series).',
      interviewReady:
        'Can walk from raw time series data to a production forecast system, explain every assumption being made, and identify exactly where the model will fail and why.',
    },
    interviewSignals: [
      {
        topic: 'Stationarity and unit root tests',
        failSignal:
          'Cannot define stationarity precisely or explain what differencing does to a non-stationary series.',
        passSignal:
          'States weak stationarity: constant mean, variance, and autocovariance over time; ADF test tests H₀: unit root (non-stationary); first differencing often achieves stationarity.',
        strongSignal:
          'Explains that ARIMA assumes stationarity — fitting on non-stationary series gives spurious correlations; ADF test: rejecting H₀ means stationary; KPSS tests H₀: stationary (opposite direction — use both); discusses integrated processes I(d): differencing d times gives stationary series; cointegration: two non-stationary series with a stationary linear combination — must use VECM, not separate ARIMAs; notes that structural breaks (trend changes) look like non-stationarity but aren\'t — use Chow test.',
        sampleQuestion:
          'Your revenue time series has an upward trend. You run ADF and fail to reject the unit root. You first-difference and pass. You then fit an ARIMA(1,1,1). What does the "1" in the middle signify, and what assumption are you now making about the trend?',
      },
      {
        topic: 'ARIMA and ACF/PACF diagnostics',
        failSignal:
          'Uses auto_arima without understanding what p, d, q mean or how to read ACF/PACF plots to select them.',
        passSignal:
          'States AR(p): current value depends on p lags; MA(q): depends on q lagged errors; ACF cuts off at q for MA, PACF cuts off at p for AR; I(d) for differencing order.',
        strongSignal:
          'Reads ACF/PACF: MA(q) → ACF cuts off sharply at lag q, PACF tails off; AR(p) → PACF cuts off sharply at lag p, ACF tails off; seasonal ARIMA (SARIMA) adds seasonal P, D, Q, S parameters; discusses information criteria (AIC, BIC) for model selection — BIC penalizes complexity more; notes ARIMA assumes linear relationships, Gaussian errors — residual diagnostics (Ljung-Box test for serial correlation) are mandatory after fitting.',
        sampleQuestion:
          'Your ACF shows a spike at lag 1 and decays, while PACF has spikes at lags 1 and 2 then cuts off. What order ARIMA do you try first, and how do you validate your choice?',
      },
      {
        topic: 'Temporal validation and leakage',
        failSignal:
          'Uses random 80/20 split on time series data and is surprised when the model performs poorly in deployment.',
        passSignal:
          'States time series requires temporal train/test split — cannot shuffle; validation set must come after training set in time.',
        strongSignal:
          'Explains expanding window (add more data as time passes, retrain) vs. rolling window (fixed training window, slide forward) validation; discusses that random splits leak future information through lag features — a lag-7 feature on day T uses day T+7\'s data if train/test isn\'t properly split; proposes walk-forward validation to simulate production conditions; notes that for multi-step forecasting, the evaluation horizon must match the deployment horizon (h-step-ahead RMSE vs. 1-step-ahead is very different); discusses backtesting strategy for multiple splits.',
        sampleQuestion:
          'You\'re building a 30-day ahead sales forecast. Design the train/validation/test split strategy and the specific metrics you\'d report, justifying each choice.',
      },
      {
        topic: 'Neural forecasting and global models',
        failSignal:
          'Treats time series as always requiring one model per series, not considering global models or their tradeoffs.',
        passSignal:
          'States global models train one model across all series, share parameters; NBEATS, DeepAR, TFT are examples; benefit from data pooling and handle cold-start better.',
        strongSignal:
          'Explains local model (ARIMA, ETS) vs. global (DeepAR, NBEATS, Temporal Fusion Transformer): local models overfit on short series but are interpretable; global models pool statistical strength across hundreds of related series; DeepAR models output distribution (probabilistic forecasting via negative log-likelihood); TFT uses multi-head attention + LSTM + gating for variable selection; discusses N-HiTS as efficient alternative to N-BEATS for long horizons; notes that global models require series to be on similar scales or normalized per-series; discusses zero-shot forecasting (TimeGPT, Lag-Llama) as pretrained foundation models.',
        sampleQuestion:
          'You have 10,000 retail product demand series, most with only 6 months of history. Compare local ARIMA per series vs. a global DeepAR model. When does each win, and what does the global model require to outperform?',
      },
      {
        topic: 'Anomaly detection in time series',
        failSignal:
          'Proposes applying Isolation Forest to each time point independently, ignoring temporal structure.',
        passSignal:
          'States time series anomalies must be detected with temporal context; proposes threshold on residuals from a fitted model (ARIMA residuals > 3σ); notes point anomalies vs. contextual anomalies.',
        strongSignal:
          'Explains that a value that\'s normal at 2pm might be anomalous at 2am — contextual anomaly requires temporal context window; proposes STL decomposition (trend + seasonal + residual) with anomaly detection on residuals as clean baseline; discusses LSTM autoencoder for sequential anomaly detection; notes that online anomaly detection requires streaming inference with low latency — CUSUM is a sequential test for mean shift; discusses the alert fatigue problem: too sensitive → too many alerts → ignored; defines anomaly budget per day and sets thresholds accordingly.',
        sampleQuestion:
          'You\'re monitoring server CPU metrics with strong daily and weekly seasonality. Design an anomaly detection system that has fewer than 3 false alerts per week while catching 90% of real incidents.',
      },
    ],
  },

  graph_ml: {
    label: 'Graph ML',
    tabId: 'graph_ml_foundation',
    totalModules: 9,
    masteryDescription:
      'A master of graph ML can design GNN architectures matched to a task\'s graph topology and label regime, reason about the expressiveness and scalability limits of message passing, and apply graph learning to production-scale problems like fraud detection, recsys, and knowledge graphs.',
    levels: {
      novice:
        'Knows graphs have nodes and edges. Cannot explain what message passing does or why graph structure helps.',
      building:
        'Can describe GCN and GraphSAGE at a high level. Understands that aggregating neighbor features encodes local structure.',
      competent:
        'Understands the message-passing framework, can compare GCN/GAT/GraphSAGE tradeoffs, and selects the right architecture for a given task.',
      strong:
        'Reasons about expressiveness (1-WL test), over-smoothing, scalability via mini-batching and sampling, and designs graph learning pipelines for large-scale production systems.',
      interviewReady:
        'Can design a complete graph ML system for a production use case (fraud, recsys, KG), justify architecture choices, explain failure modes, and discuss what changes at graph scale (billion nodes).',
    },
    interviewSignals: [
      {
        topic: 'Message passing and GCN vs. GraphSAGE',
        failSignal:
          'Describes GNNs as "combining node features from neighbors" without explaining the aggregation function or why normalization matters.',
        passSignal:
          'States GCN aggregates normalized sum of neighbor features; GraphSAGE samples a fixed number of neighbors and uses various aggregators (mean, max, LSTM); GCN requires full graph for each forward pass.',
        strongSignal:
          'Explains GCN: H^(l+1) = σ(D^(-1/2) Ã D^(-1/2) H^(l) W) where Ã = A + I (self-loop), D = degree matrix; normalization prevents high-degree nodes from dominating; GraphSAGE samples fixed neighborhood → mini-batch training on large graphs; discusses over-smoothing: deep GCNs (many layers) produce indistinguishable node representations as neighborhood aggregation homogenizes features — limit to 2-4 layers in practice; notes that GCN is transductive (requires full graph), GraphSAGE is inductive (can generalize to new nodes).',
        sampleQuestion:
          'GCNs with more than 4 layers often perform worse on node classification. Explain precisely why, and describe two architectural approaches to mitigate it.',
      },
      {
        topic: 'Graph Attention Networks (GAT)',
        failSignal:
          'Says GAT is GCN with "learned weights on edges" but cannot explain the attention mechanism or what it learns to weight.',
        passSignal:
          'States GAT computes attention weights e_ij = a([Wh_i ‖ Wh_j]) for each edge; softmax over neighbors; multi-head attention for stability.',
        strongSignal:
          'Explains that GCN uses structural neighborhood weights (degree-based), GAT learns content-based weights — which neighbor is most relevant given current node features; attention score e_ij = LeakyReLU(aᵀ[Wh_i ‖ Wh_j]); multi-head concatenates or averages K attention heads; discusses that GAT is more expressive but doesn\'t always outperform GCN — attention may not help when structural features dominate; notes that GAT is O(E) per layer (edges) — same complexity as GCN; explains GATv2 as improvement: original GAT has static attention (computes query from h_i alone) while GATv2 uses a dynamic attention mechanism.',
        sampleQuestion:
          'You\'re building a fraud detection GNN on a transaction graph. Why might GAT outperform GCN here, and what would you look at in the learned attention weights to validate the model is doing something sensible?',
      },
      {
        topic: 'Link prediction',
        failSignal:
          'Says link prediction is "predicting if an edge exists" but cannot describe how to train for it or avoid data leakage.',
        passSignal:
          'States link prediction: score node pairs (u,v) using their embeddings — dot product or MLP; train with positive edges and negative sampling; test on held-out edges.',
        strongSignal:
          'Explains that negative sampling is critical and hard: random negatives (any non-edge) are easy — model needs hard negatives (close in embedding space but not connected); train/val/test split must remove test edges from the message-passing graph (otherwise you leak edge existence information into node embeddings); discusses heuristic baselines (common neighbors, Adamic-Adar, Jaccard) that are strong and often competitive with GNNs; notes that 1-WL expressiveness limits GNNs\' ability to count triangles (required for predicting closure patterns); SEAL (subgraph extraction) addresses this.',
        sampleQuestion:
          'You\'re training a GNN for knowledge graph completion. Why must you be careful about how you split edges for train/val/test, and how would you implement this correctly?',
      },
      {
        topic: 'Scalability: neighbor sampling and mini-batching',
        failSignal:
          'Proposes running full-graph GNN on a graph with 1 billion nodes without considering memory and compute feasibility.',
        passSignal:
          'States that full-graph GCN doesn\'t scale; GraphSAGE samples k neighbors per node per layer; mini-batches expand to a subgraph via neighborhood sampling.',
        strongSignal:
          'Explains that k-hop neighborhood grows exponentially (fan-out problem): 2-layer GCN with k=10 neighbors expands to 100 nodes per target node but in reality neighbors overlap so actual expansion is less; GraphSAGE fixes this with fixed-size sampling; Cluster-GCN partitions the graph into clusters (METIS) and trains on subgraphs — preserves local structure; GraphSAINT samples random walks or random nodes and builds subgraphs; discusses that neighbor sampling introduces stochastic variance — larger sample = lower variance, higher cost; R-GCN (relational GCN) for heterogeneous graphs is particularly expensive due to per-relation weight matrices.',
        sampleQuestion:
          'Your social network has 2 billion nodes and 50 billion edges. You want to train a 3-layer GNN for friend recommendation. Full-graph training is impossible. Design the training architecture.',
      },
      {
        topic: 'Expressiveness and the WL isomorphism test',
        failSignal:
          'Cannot explain what limits GNN expressiveness or what the WL test has to do with GNNs.',
        passSignal:
          'States Weisfeiler-Lehman (WL) test is a graph isomorphism heuristic; message-passing GNNs are at most as expressive as 1-WL — cannot distinguish graphs that 1-WL cannot distinguish.',
        strongSignal:
          'Explains 1-WL assigns color labels by aggregating sorted neighbor colors iteratively — two graphs with same WL color histogram are potentially isomorphic; GINs (Graph Isomorphism Networks) are as powerful as 1-WL — uses sum aggregation (not mean/max, which lose multiplicity information) and MLP (not linear); to go beyond 1-WL, need higher-order methods: k-WL exponentially expensive; practical alternatives: distance encoding, random features, subgraph GNNs; discusses that for many tasks (like counting cycles), 1-WL-level GNNs fundamentally cannot distinguish the relevant structure — this is a theoretical ceiling, not a training issue.',
        sampleQuestion:
          'Two graphs are 1-WL equivalent but have different numbers of triangles. Can a standard message-passing GNN distinguish them? Why not, and what would you need to add to the architecture to count triangles?',
      },
    ],
  },

  bandits: {
    label: 'Bandits & Exploration',
    tabId: 'bandits_foundation',
    totalModules: 9,
    masteryDescription:
      'A master of bandits and exploration can design, analyze, and implement exploration strategies for recommendation systems, A/B tests, and sequential decision problems — balancing the exploration-exploitation tradeoff with formal guarantees and practical constraints.',
    levels: {
      novice:
        'Knows the exploration-exploitation tradeoff exists. Cannot formalize it as a bandit problem or derive a regret bound.',
      building:
        'Understands epsilon-greedy and UCB at a high level. Can implement a basic multi-armed bandit but doesn\'t reason about regret theoretically.',
      competent:
        'Can derive UCB and Thompson sampling, compute regret bounds, and extend to contextual settings (LinUCB); understands the gap between MAB and real recsys.',
      strong:
        'Reasons about off-policy evaluation, designs exploration strategies for production constraints (cold-start, latency, budget), and connects bandits to causal inference.',
      interviewReady:
        'Can design a complete bandit-based recommendation or experimentation system, justify the exploration strategy, and evaluate it credibly offline — addressing the observational bias in logged data.',
    },
    interviewSignals: [
      {
        topic: 'UCB algorithm and regret bounds',
        failSignal:
          'Says UCB "picks the arm with highest upper confidence bound" but cannot write the bound or explain what the logarithmic regret guarantee means.',
        passSignal:
          'States UCB1: select arm a* = argmax [μ̂_a + √(2 ln t / N_a(t))]; O(log T) regret guarantee; confidence bonus decreases as arm is pulled more.',
        strongSignal:
          'Derives UCB1 regret bound O(Σ_a (ln T / Δ_a)) where Δ_a = μ* - μ_a; explains the optimism principle: upper confidence bound ensures underexplored arms get tried; discusses that UCB is O(log T) expected regret (problem-dependent) and O(√(KT log T)) problem-independent; contrasts with Thompson sampling which has same asymptotic regret but lower constant in practice; notes that UCB assumes stationary reward distributions — non-stationary settings need a sliding window UCB or discounted UCB; discusses KL-UCB for Bernoulli rewards as tighter bound.',
        sampleQuestion:
          'Derive the UCB1 regret bound informally. Why does the confidence bonus have a √(ln t / N_a) form specifically, and what does the Δ_a term in the regret bound tell you about how difficulty scales with the problem?',
      },
      {
        topic: 'Thompson sampling',
        failSignal:
          'Describes Thompson sampling as "random exploration" without connecting it to posterior sampling or Bayesian reasoning.',
        passSignal:
          'States Thompson sampling samples θ_a ~ P(θ_a | data) for each arm, selects arm with highest sampled value; for Bernoulli rewards with Beta prior: Beta(α_a + successes, β_a + failures).',
        strongSignal:
          'Explains Thompson sampling as probability matching: P(selecting arm a) = P(arm a is best) — matches exploration to uncertainty; achieves same logarithmic regret as UCB with better empirical performance (lower constant); discusses Gaussian Thompson sampling for continuous rewards; notes that Thompson sampling is trivially parallelizable (sample multiple times for different request streams simultaneously); explains that Thompson sampling naturally handles the cold-start problem through prior — before any observations, pulls are uniform; discusses approximations needed for non-conjugate reward models (Laplace approximation, neural Thompson sampling with Bayesian last layer).',
        sampleQuestion:
          'You\'re testing 20 email subject line variants simultaneously. Compare UCB and Thompson sampling for this problem. What practical consideration makes Thompson sampling preferred here, and how do you handle the case where variants are added and removed dynamically?',
      },
      {
        topic: 'Contextual bandits and LinUCB',
        failSignal:
          'Cannot explain how contextual bandits differ from MAB or what LinUCB assumes about the reward function.',
        passSignal:
          'States contextual bandit uses context x_t per round to select action; LinUCB assumes reward = θ_a · x + noise; confidence ellipsoid over θ_a gives the UCB.',
        strongSignal:
          'Derives LinUCB: θ̂_a = (Aᵀ A + I)⁻¹ Aᵀ b; UCB_a = θ̂_aᵀ x + α √(xᵀ(AᵀA+I)⁻¹x); the second term is exploration bonus based on uncertainty in prediction direction x; discusses that LinUCB is O(d³) per arm for covariance update — scales poorly with context dimension d; disjoint vs. hybrid LinUCB (shared parameters across arms); notes that neural contextual bandits (NeuralUCB) replace linear model with neural network but UCB computation requires Jacobian of neural network w.r.t. parameters — expensive; epsilon-greedy on a neural network is a practical alternative.',
        sampleQuestion:
          'You\'re serving personalized content using LinUCB with 50-dimensional user context vectors and 1000 content items. Walk me through the computational cost per request and identify the bottleneck. How would you scale this to 50,000 content items?',
      },
      {
        topic: 'Off-policy evaluation for bandits',
        failSignal:
          'Cannot explain why evaluating a bandit policy on historical data is hard or what the logging policy\'s role is.',
        passSignal:
          'States OPE needs to account for the logging policy — IPS reweights outcomes by π_eval(a|x)/π_log(a|x); high variance when policies differ substantially.',
        strongSignal:
          'Explains IPS estimator: V̂_IPS(π) = (1/T) Σ [r_t · π(a_t|x_t) / π_0(a_t|x_t)]; unbiased but high variance when π differs from π_0; clipped IS reduces variance at cost of bias; Doubly Robust (DR) estimator adds a direct model term for variance reduction and is consistent if either the model or IS weights are correct; discusses that in recsys, logging policy is often deterministic (no randomness → IPS denominator = 0 or 1) — must add explicit randomization; POEM optimizes policy directly against OPE objective; discusses Counterfactual Risk Minimization for safe policy improvement.',
        sampleQuestion:
          'You want to evaluate a new content recommendation policy using 6 months of logged data where the logging policy was epsilon-greedy with epsilon=0.05. What fraction of actions were exploratory, and why is this a problem for IPS? How would you fix it?',
      },
      {
        topic: 'Exploration in recommendation systems',
        failSignal:
          'Does not recognize that recsys has a bandit structure or that only showing popular items creates a feedback loop problem.',
        passSignal:
          'States recsys exploration is needed to avoid popularity bias; epsilon-greedy randomly shows non-top items; exploration reveals item quality and avoids filter bubble.',
        strongSignal:
          'Explains that without exploration, the popularity feedback loop amplifies early random advantages — popular items get more impressions → more data → better model → more impressions (self-reinforcing); discusses that exploration in recsys has a cost (showing non-optimal items) but is necessary for long-term value; Thompson sampling for recsys: sample from posterior over item quality, show highest sampled item — exploration is concentrated on uncertain items; discusses the explore-exploit tradeoff in user lifetime: new users need exploration, loyal users can be exploited; proposes exploration budget (E% of impressions) that varies by user tenure and session context; notes that multi-armed bandits assume arm independence — in recsys, items compete and showing one affects value of others (slate problem).',
        sampleQuestion:
          'You\'re PM of a news recommendation system. Your data shows a 15% click-rate but editors believe users are getting filter-bubbled. Design a bandit-based exploration system that measurably improves topic diversity without hurting CTR by more than 2%.',
      },
    ],
  },
};
