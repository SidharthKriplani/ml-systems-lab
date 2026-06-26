export const MATH_STATS_MODULES = [
  {
    id: 'probability_basics',
    title: 'Probability Fundamentals',
    subtitle: `Sample spaces, Bayes' theorem, conditional probability`,
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['probability', 'bayes', 'foundations'],
    summary: `Every ML model is ultimately a probabilistic claim about the world. The sample space Ω is the set of all possible outcomes; events are subsets of Ω; a probability measure P assigns values in [0,1] satisfying the three Kolmogorov axioms — non-negativity, normalisation, and countable additivity. Conditional probability P(A|B) = P(A∩B)/P(B) formalises how new information updates beliefs, and it is undefined when P(B) = 0. Bayes' theorem P(A|B) = P(B|A)P(A)/P(B) inverts the conditioning direction — it is how we travel from a likelihood P(data|hypothesis) to a posterior P(hypothesis|data). The law of total probability P(B) = Σ P(B|Aᵢ)P(Aᵢ) over a partition is the denominator in Bayes' theorem and the mechanism for marginalising over latent variables. Independence A ⊥ B means P(A∩B) = P(A)P(B) — knowing B tells you nothing about A. Conditional independence A ⊥ B | C is a strictly different statement that does not imply marginal independence. When the prior P(A) is very small, even a highly accurate likelihood function produces a surprisingly weak posterior — the base-rate neglect trap that breaks intuition in medical testing and fraud detection.`,
    keyPoints: [
      `Bayes' theorem inverts the direction of conditioning: you know P(data|hypothesis) — how likely is this data if my hypothesis is true — but you want P(hypothesis|data) — given the data, how likely is my hypothesis? The posterior depends on both the likelihood AND your prior. Most people forget the prior. That is how you end up trusting a 99%-accurate test that is actually wrong 91% of the time when prevalence is 0.1%.`,
      `The law of total probability P(B) = Σ P(B|Aᵢ)P(Aᵢ) is the mechanism for marginalising latent variables. It sits in the denominator of Bayes' theorem. When the latent space is continuous, that integral is usually intractable — which is why computing exact posteriors is hard.`,
      `Conditional independence A ⊥ B | C does NOT imply marginal independence A ⊥ B. Two symptoms can be correlated in the general population but independent once you know the diagnosis. This is precisely why naïve Bayes works despite violated marginal independence.`,
      `Confusing P(A|B) with P(B|A) is the prosecutor's fallacy. P(evidence|innocent) is not P(innocent|evidence). A very unlikely piece of evidence under innocence does NOT make guilt highly probable — not unless the prior itself favours guilt.`,
      `Inclusion-exclusion: P(A∪B) = P(A) + P(B) − P(A∩B). The failure mode is forgetting the subtraction and double-counting. Naïve union bounds in ML theory are loose by exactly this overlap term.`,
      `Mutually exclusive events with positive probability are ALWAYS dependent — exclusivity and independence are opposites: P(A∩B)=0 ≠ P(A)P(B)>0. The two concepts are commonly confused, but one implies the other's negation.`,
      `Laplace smoothing in Naive Bayes adds a small pseudo-count to every probability estimate. It acts as a Dirichlet prior and prevents any single unseen word from zeroing out the entire class posterior.`,
      `The base-rate neglect failure mode: even a 99%-sensitive, 99%-specific test gives only ~9% posterior probability of disease when prevalence is 0.1%. Your prior distribution over the problem matters as much as your model's accuracy.`,
      `Chain rule of probability: P(A,B,C) = P(A|B,C)P(B|C)P(C). Any joint distribution factors into conditionals. Graphical models and autoregressive language models are both direct applications of this one identity.`,
    ],
    checkQuestions: [
      {
        q: `A test for a disease has 99% sensitivity and 99% specificity. Disease prevalence is 0.1%. What is P(disease | positive test), and what does this reveal about model accuracy vs. base rate?`,
        a: `Using Bayes: P(D|+) = P(+|D)P(D) / [P(+|D)P(D) + P(+|¬D)P(¬D)] = (0.99 × 0.001) / (0.99×0.001 + 0.01×0.999) ≈ 0.00099/0.01098 ≈ 9%. Despite a highly accurate test, the posterior is only 9% because the prior probability of disease is 0.1% — the denominator is dominated by the false positive rate applied to the vast majority of healthy people. This illustrates that model accuracy and posterior probability are decoupled when the prior is extreme.`
      },
      {
        q: `What is the difference between mutual exclusivity and independence? Give a concrete example where two events are mutually exclusive but highly dependent.`,
        a: `Mutually exclusive events cannot both occur: P(A∩B)=0. Independent events satisfy P(A∩B)=P(A)P(B). If A and B are mutually exclusive with P(A)>0 and P(B)>0, then P(A∩B)=0 ≠ P(A)P(B) > 0, so they are dependent — knowing A occurred tells you B definitely did not. Example: rolling a 1 and rolling a 6 on a single die are mutually exclusive; they are maximally dependent (one rules out the other entirely).`
      },
      {
        q: `Explain why A ⊥ B | C does not imply A ⊥ B, using a concrete ML example.`,
        a: `Conditional independence A ⊥ B | C means knowing C renders A and B unrelated, but marginally (without knowing C) they may still be correlated. ML example: "cough" and "fever" are correlated in the general population (marginal dependence), but are conditionally independent given the diagnosis "flu" — knowing the disease explains both symptoms. Naïve Bayes assumes conditional independence given the class label, which can hold even when the features are marginally correlated. The direction also fails: A ⊥ B does not imply A ⊥ B | C (Berkson's paradox — two independent causes become dependent once you condition on their common effect).`
      },
      {
        q: `In a Bayesian spam filter, a new word appears in neither spam nor ham training emails. What happens without smoothing, and how does Laplace smoothing fix it?`,
        a: `Without smoothing, P(new_word | spam) = 0 and P(new_word | ham) = 0. The Naïve Bayes posterior for any class becomes 0 × (other terms) = 0, making the posterior undefined (0/0 after normalisation). Laplace smoothing adds α=1 to every word count: P(word | class) = (count + 1)/(N_class + |V|). This gives every unseen word a small non-zero probability equal to 1/(N_class + |V|), preserving the contribution of all other words and acting as a uniform Dirichlet prior over the vocabulary.`
      },
    ],
    takeaway: `Posterior probability is likelihood times prior. A 99%-accurate test can still be wrong 91% of the time — if you forget to multiply by the base rate. Always ask what the prior is before trusting a model output as a probability.`,
    interactiveId: 'bayes_calculator',
  },
  {
    id: 'random_variables',
    title: 'Random Variables & Distributions',
    subtitle: 'PMF, PDF, CDF, expectation, variance, common distributions',
    difficulty: 'foundational',
    estimatedMin: 32,
    tags: ['distributions', 'expectation', 'variance'],
    summary: `A random variable X assigns a number to each possible outcome — it is the bridge from abstract probability to numbers you can compute with. Discrete RVs are characterised by a PMF p(x) = P(X=x); continuous RVs by a PDF f(x) where probabilities are areas under the curve, not point values. The CDF F(x) = P(X≤x) unifies both types and is always right-continuous and non-decreasing from 0 to 1. Expectation E[X] is the probability-weighted average outcome and the fundamental summary of central tendency. Variance Var(X) = E[(X−μ)²] = E[X²] − (E[X])² measures spread and determines how unreliable an estimator is. Linearity of expectation holds regardless of dependence: E[aX+bY] = aE[X]+bE[Y] always. But Var(X+Y) = Var(X)+Var(Y) only when X and Y are uncorrelated. The Normal distribution arises naturally from the Central Limit Theorem and is the maximum entropy distribution given a fixed mean and variance. The Poisson and Exponential distributions form a natural pair — Poisson counts events in a fixed window; Exponential measures waiting time between events, with the same rate parameter λ governing both.`,
    keyPoints: [
      `E[X] for discrete: Σ x·p(x); for continuous: ∫ x·f(x)dx. Linearity holds always: E[aX+bY] = aE[X]+bE[Y] regardless of dependence. You can compute expectations of sums without knowing the joint distribution at all.`,
      `Var(X) = E[X²] − (E[X])². This gap is exactly the variance — a direct consequence of Jensen's inequality on the convex function g(x)=x². E[X²] ≥ (E[X])² always holds, with equality only when X is constant.`,
      `Bernoulli(p): mean=p, Var=p(1−p). Variance is maximised at p=0.5. Class-balanced binary problems have maximum label uncertainty and therefore require the most data to learn from.`,
      `Poisson(λ): mean=variance=λ. If your data's sample variance greatly exceeds the sample mean, the Poisson assumption is violated — that is overdispersion. Use a Negative Binomial model instead.`,
      `Normal N(μ,σ²): the Central Limit Theorem makes it ubiquitous. Sums of iid finite-variance RVs converge to Normal regardless of the underlying distribution, so many estimators — sample means, regression coefficients — are asymptotically Gaussian.`,
      `Exponential(λ) is the only continuous memoryless distribution — P(X>s+t|X>s)=P(X>t). The expected remaining wait time is always 1/λ regardless of how long you have already waited. That is why it models hardware failure times and server request arrivals.`,
      `Log-Normal: if log(X) ~ N(μ,σ²) then X is log-normal — always positive with a long right tail. It naturally models revenue, file sizes, and latency distributions where the median is much smaller than the mean.`,
      `The 68-95-99.7 rule for Normal distributions (1/2/3 standard deviations) is a practitioner's sanity check. A predicted value more than 3σ from the mean under a Gaussian model is a strong signal of model misspecification or an outlier.`,
      `Beta(α,β) ∈ [0,1]: models probabilities with mean = α/(α+β). It is the natural prior for click-through rates and the posterior in Beta-Binomial conjugate Bayesian updating.`,
    ],
    checkQuestions: [
      {
        q: `If X ~ Poisson(3) and Y ~ Poisson(5) are independent, what is the distribution of X+Y? Why does this property matter in practice?`,
        a: `X+Y ~ Poisson(8). The sum of independent Poisson RVs with parameters λ₁ and λ₂ is Poisson(λ₁+λ₂) — the reproductive property. This matters because if server requests from two services each follow Poisson processes, the combined traffic is also Poisson. It also underpins why Poisson regression can aggregate counts across time windows: doubling the observation window doubles λ, not the distribution family.`
      },
      {
        q: `Why is E[X²] ≥ (E[X])² always true, and what does the gap tell you?`,
        a: `E[X²] − (E[X])² = Var(X) ≥ 0, because variance is an expectation of a squared quantity. This follows from Jensen's inequality: f(x)=x² is convex, so E[f(X)] ≥ f(E[X]). The gap is exactly the variance — a measure of spread. Equality holds iff Var(X)=0, meaning X is a constant. This identity is the computational formula for variance: instead of computing E[(X−μ)²] directly, compute E[X²] and subtract μ².`
      },
      {
        q: `Your model predicts latency, and you notice the mean is much higher than the median. What distribution should you consider and why?`,
        a: `A heavy-right-tailed distribution — most likely Log-Normal or Pareto. When mean >> median, the distribution is right-skewed: a few extreme values pull the mean up while most observations cluster below it. Log-Normal is natural for latency because latency is always positive and multiplicative effects (each network hop multiplies the delay) produce log-normal distributions by the log-normal CLT. Fitting a Gaussian to such data will badly underestimate tail probabilities, causing SLA violations to appear rarer than they are.`
      },
      {
        q: `A Bernoulli model estimates P(click)=0.01 from 100 observations (1 click). Compute the variance of this estimate and explain what it means for reliability.`,
        a: `The MLE is p̂ = 1/100 = 0.01. The variance of p̂ (as a sample proportion) is p(1−p)/n = 0.01×0.99/100 ≈ 0.0001, giving standard error SE ≈ 0.01. A 95% CI is approximately 0.01 ± 1.96×0.01 = [−0.0096, 0.0296] — the lower bound is negative, which is nonsensical for a probability. This illustrates that with sparse counts the Normal approximation breaks down; use a Beta posterior or exact binomial CI instead. The estimate is essentially noise at n=100.`
      },
    ],
    takeaway: `Mean and variance together tell you how reliably you can estimate anything from finite data. Never report an estimate without its standard error — that number is what separates a finding from a guess.`,
    interactiveId: 'distribution_viz',
  },
  {
    id: 'joint_distributions',
    title: 'Joint Distributions & Independence',
    subtitle: 'Joint PDF/PMF, marginals, conditional distributions, covariance',
    difficulty: 'foundational',
    estimatedMin: 26,
    tags: ['joint distributions', 'covariance', 'correlation'],
    summary: `The joint distribution of (X,Y) fully characterises their statistical relationship — it contains strictly more information than the two marginals separately whenever X and Y are dependent. Marginals are recovered by integrating or summing out the other variable, which discards dependence structure. Conditional distributions P(X|Y=y) formalise how knowledge of Y updates beliefs about X and are the building blocks of generative models and Bayesian networks. Covariance Cov(X,Y) = E[XY] − E[X]E[Y] measures the direction and strength of linear co-variation. Correlation ρ = Cov(X,Y)/(σ_X σ_Y) ∈ [−1,1] is the scale-invariant version. Critically, zero covariance means no linear relationship but does NOT imply independence — non-linear dependence can exist with ρ=0. The covariance matrix Σ of a random vector encodes all pairwise linear relationships and is always symmetric positive semi-definite. Its eigenvalues are the variances in the principal component directions, connecting directly to PCA.`,
    keyPoints: [
      `Joint PDF f(x,y); marginal f_X(x) = ∫ f(x,y)dy; conditional f(x|y) = f(x,y)/f_Y(y). The chain rule f(x,y) = f(x|y)f(y) says any joint distribution factors as a product of conditionals — this is the basis of autoregressive models.`,
      `Independence X⊥Y holds iff f(x,y) = f_X(x)f_Y(y) for ALL (x,y). Equivalently, f(x|y) = f_X(x): Y provides zero information about X and the joint is exactly the product of marginals.`,
      `Zero covariance does NOT imply independence. The classic counterexample: X~N(0,1), Y=X². Cov(X,Y)=0 yet Y is a deterministic function of X. Correlation only detects linear relationships and can completely miss quadratic or other non-linear dependence.`,
      `Spearman rank correlation captures monotone (not just linear) relationships and is robust to outliers. Use it when your features or labels are heavy-tailed or ordinal.`,
      `Covariance matrix Σ is always symmetric PSD: Σᵢⱼ = Cov(Xᵢ, Xⱼ), with variances on the diagonal. Any algorithm requiring a valid covariance matrix — Gaussian models, Mahalanobis distance — will break if you pass a non-PSD matrix.`,
      `Multivariate Normal is entirely characterised by (μ, Σ). The conditional of any subset given another subset is also Gaussian with a closed-form mean and covariance. Conditioning never leaves the Gaussian family, which is why Gaussian Processes and Kalman filters are tractable.`,
      `Correlation ρ=±1 implies an EXACT linear relationship. Any deviation from ±1 means the linear model leaves unexplained variance. In simple linear regression, R²=ρ².`,
      `The Mahalanobis distance d(x,μ) = √((x−μ)ᵀΣ⁻¹(x−μ)) accounts for feature covariance when measuring outliers. It is the right distance metric when features are correlated; Euclidean distance treats all directions equally and will mislead you.`,
    ],
    checkQuestions: [
      {
        q: `X and Y have Pearson correlation 0. Does this mean they are independent? Construct a specific counterexample.`,
        a: `No. Zero correlation means no linear relationship, but non-linear dependence can still exist. Counterexample: X~Uniform(−1,1), Y=X². E[XY]=E[X³]=0 (odd function of symmetric distribution), E[X]=0, so Cov(X,Y)=0 and ρ=0. Yet Y is entirely determined by X — knowing X tells you Y exactly. To detect this dependence, use mutual information (which captures non-linear relationships) or Spearman rank correlation.`
      },
      {
        q: `Why is a covariance matrix always positive semi-definite, and what goes wrong in practice when it fails to be?`,
        a: `Σ = E[(X−μ)(X−μ)ᵀ]. For any vector v: vᵀΣv = E[(vᵀ(X−μ))²] ≥ 0 (expectation of a squared quantity). So all eigenvalues are non-negative — PSD by construction. In practice, Σ can fail to be PSD when: (1) you have more features than samples (rank-deficient sample covariance), (2) floating point errors in computation, or (3) you manually construct Σ with inconsistent correlations. A non-PSD covariance matrix causes Cholesky decomposition to fail, negative variances in conditional distributions, and invalid Mahalanobis distances.`
      },
      {
        q: `Two ML features have a correlation of 0.95. What problems does this cause in linear regression, and what is the fix?`,
        a: `High correlation (multicollinearity) makes XᵀX near-singular: the normal equation (XᵀX)⁻¹Xᵀy is numerically unstable, and small changes in the training data produce large swings in estimated coefficients. The coefficients lose interpretability — you cannot say "feature A has effect b₁" because A and B are almost exchangeable. The fix is Ridge regression (L2 regularisation), which adds λI to XᵀX before inversion: (XᵀX + λI)⁻¹ is always well-conditioned. Alternatively, remove one of the correlated features or use PCA to decorrelate first.`
      },
    ],
    takeaway: `Zero correlation rules out linear dependence — nothing more. Two variables can have ρ=0 while one is a deterministic function of the other. Use mutual information or rank-based tests when you actually need to check independence.`,
  },
  {
    id: 'information_theory',
    title: 'Information Theory for ML',
    subtitle: 'Entropy, cross-entropy, KL divergence, mutual information',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['entropy', 'KL divergence', 'cross-entropy', 'mutual information'],
    summary: `Information theory, developed by Shannon in 1948, quantifies uncertainty and the information content of messages. Entropy H(X) = −Σ p(x) log p(x) measures average surprise — it is the minimum average number of bits needed to encode samples from X, maximised by the uniform distribution and zero for a deterministic outcome. Cross-entropy H(p,q) = −Σ p(x) log q(x) is the average surprise when you use model q to encode samples from the true distribution p. Minimising it over training data is exactly maximum likelihood estimation. KL divergence KL(p||q) = Σ p(x) log(p(x)/q(x)) measures the excess surprise from using q instead of p and decomposes as H(p,q) − H(p). It is always non-negative and zero only when p=q everywhere. The asymmetry of KL has profound practical consequences: forward KL is inclusive and mode-covering; reverse KL is exclusive and mode-seeking. They produce qualitatively different learned distributions. Mutual information I(X;Y) = H(X) − H(X|Y) measures shared information between variables and is zero iff X and Y are independent.`,
    keyPoints: [
      `Shannon entropy H(X) = −Σ p log p is maximised for uniform distributions and zero for deterministic outcomes. It quantifies irreducible uncertainty — a model cannot achieve lower expected log-loss than H(p) on data drawn from distribution p.`,
      `Cross-entropy H(p,q) = H(p) + KL(p||q). Minimising cross-entropy loss is equivalent to minimising KL divergence from the model to the true distribution. Standard neural network training is implicitly doing approximate KL minimisation.`,
      `KL divergence is asymmetric: KL(p||q) ≠ KL(q||p). Confusing the direction leads to either mode-covering or mode-seeking behaviour — which is why VAE encoders trained with reverse KL produce blurry reconstructions while forward-KL methods cover all modes.`,
      `Forward KL minimisation makes q spread to cover all of p's support. If p has two modes and q is unimodal, the result averages between them. Forward KL is dangerous for multimodal targets.`,
      `Reverse KL minimisation makes q collapse to one mode of p. q assigns zero mass where p is tiny, so the learned distribution is sharp but may completely miss parts of the true distribution.`,
      `Mutual information I(X;Y) = KL(p(x,y) || p(x)p(y)) = H(X) − H(X|Y). It is symmetric and zero iff independent. That makes it the theoretically grounded score for ranking features against a label, regardless of the shape of the relationship.`,
      `Binary cross-entropy gradient: ∂L/∂z = ŷ − y where z is the logit and ŷ = σ(z). The gradient is simply prediction error — the elegant form that makes logistic regression and neural network output layers so tractable.`,
      `Entropy is additive for independent variables: H(X,Y) = H(X) + H(Y) when X⊥Y, and H(X,Y) = H(X) + H(Y|X) in general. The chain rule of entropy is the information-theoretic version of the chain rule of probability.`,
    ],
    checkQuestions: [
      {
        q: `Why do we minimise cross-entropy H(p,q) rather than KL(p||q) directly when training classifiers? Are they equivalent?`,
        a: `H(p,q) = H(p) + KL(p||q). Since H(p) (entropy of the true labels) is constant with respect to model parameters θ, minimising H(p,q) over θ is equivalent to minimising KL(p||q). Cross-entropy is preferred because (1) it does not require computing H(p), which is constant and unknown in practice, and (2) it is numerically simpler. The equivalence holds exactly — cross-entropy minimisation IS maximum likelihood estimation IS KL minimisation from model to data distribution.`
      },
      {
        q: `A VAE encoder is trained to minimise reverse KL: KL(q(z|x) || p(z)). What shape of posterior does this encourage, and what are the practical consequences?`,
        a: `Reverse KL minimisation makes q(z|x) mode-seeking: q will collapse onto a single mode of p(z) (the prior, typically N(0,I)) and assign near-zero mass elsewhere. Practical consequence: the encoder learns tight, well-separated posteriors for each datapoint, but the aggregate posterior ∫ q(z|x)p(x)dx may not match p(z) well (posterior collapse problem). This is why VAE reconstructions are often blurry — the decoder learns to average over uncertain latent codes. It also explains the "hole" problem in VAE latent spaces: regions between modes have low density under the aggregate posterior but p(z) assigns them mass.`
      },
      {
        q: `What does it mean when mutual information I(X;Y) = H(X)? Give an ML example.`,
        a: `I(X;Y) = H(X) − H(X|Y). If I(X;Y) = H(X), then H(X|Y) = 0, meaning Y completely determines X — knowing Y removes all uncertainty about X. ML example: in a deterministic decision tree with a single perfectly discriminative feature, I(feature; label) = H(label). This is the ideal case for feature selection: the feature alone predicts the label with certainty. In practice, finding I(X;Y) ≈ H(Y) for a feature means that feature alone could replace the entire model.`
      },
      {
        q: `Two models have cross-entropy losses of 0.3 and 0.5 on the same test set. The true label entropy H(p) = 0.2. What is the KL divergence of each model from the true distribution?`,
        a: `KL(p||q) = H(p,q) − H(p). Model 1: KL = 0.3 − 0.2 = 0.1 nats. Model 2: KL = 0.5 − 0.2 = 0.3 nats. Model 1 is 3× closer to the true distribution in KL terms. The minimum achievable cross-entropy is H(p) = 0.2 — this is the Bayes error rate in terms of cross-entropy. A cross-entropy of 0.2 would mean the model has perfectly learned the true distribution. This framing makes clear that reducing cross-entropy below H(p) is impossible without overfitting to noise.`
      },
    ],
    takeaway: `Minimising cross-entropy is identical to minimising KL divergence from your model to the true data distribution. Every classification network you train is doing approximate KL minimisation — the loss function is not a design choice, it follows from the probabilistic model you assumed.`,
    interactiveId: 'information_theory_viz',
  },
  {
    id: 'linear_algebra_basics',
    title: 'Vectors & Matrices',
    subtitle: 'Dot product, matrix operations, rank, norms',
    difficulty: 'foundational',
    estimatedMin: 26,
    tags: ['linear algebra', 'matrices', 'norms'],
    summary: `Every forward pass in a neural network is a sequence of matrix multiplications and element-wise non-linearities. Vectors are elements of ℝⁿ representing data points, weights, or embeddings. Matrices represent linear transformations between vector spaces. The dot product xᵀy = Σ xᵢyᵢ measures the projection of x onto y and is the basis of attention mechanisms, kernel methods, and the neural net linear layer. Matrix multiplication AB represents composition of linear maps: first apply B, then A. Rank measures how many independent directions a matrix spans — a rank-deficient matrix collapses some information irreversibly. Norms measure size: L2 norm is Euclidean distance and appears in regularisation; L1 norm sums absolute values and induces sparsity; L∞ is the maximum. Understanding which norm your algorithm uses tells you exactly what geometry and regularisation behaviour it assumes.`,
    keyPoints: [
      `Dot product xᵀy = ‖x‖‖y‖cos(θ). It is zero when x and y are orthogonal (θ=90°) and maximised when parallel. Attention scores — queries dot keys — directly measure directional alignment between token representations.`,
      `Matrix multiply AB: (AB)ᵢⱼ = Σₖ Aᵢₖ Bₖⱼ. Inner dimensions must match, and AB ≠ BA in general. The order of linear transformations matters; reversing a pipeline is not the same as inverting it.`,
      `Rank of A = dimension of column space = number of linearly independent columns. Watch the full-rank assumption: if XᵀX is rank-deficient (more features than samples, or multicollinearity), the normal equation has no unique solution.`,
      `Orthogonal matrix Q: QᵀQ=I — all columns are orthonormal unit vectors. Q preserves norms (‖Qx‖=‖x‖) and is distance-preserving. That is why orthogonal weight initialisation and QR decomposition are numerically stable.`,
      `L1 norm ‖x‖₁ = Σ|xᵢ|, used in Lasso regularisation. Its subdifferential at zero creates sparsity. L1-regularised models drive many weights to exactly zero, unlike L2 which only shrinks them.`,
      `L2 norm ‖x‖₂ = √(Σxᵢ²) is Euclidean distance. It appears in Ridge regression, weight decay, and gradient clipping. Most distance computations in ML are implicitly assuming spherical geometry.`,
      `Trace tr(A) = Σ Aᵢᵢ = sum of eigenvalues, and tr(AB) = tr(BA) even when AB ≠ BA — the cyclic property. You can rearrange matrix products inside a trace to simplify gradient derivations in matrix calculus.`,
      `Determinant det(A) ≠ 0 iff A is invertible. |det(A)| is the volume scaling factor of the linear map. A near-zero determinant signals a near-singular transformation and numerical instability in solving linear systems.`,
    ],
    checkQuestions: [
      {
        q: `What does it mean geometrically when xᵀy = 0, and why does this matter for neural networks?`,
        a: `x and y are orthogonal — perpendicular in the vector space, with no component of x in the direction of y. In neural networks, orthogonal weight matrices preserve norms: ‖Wx‖=‖x‖, which prevents both vanishing and exploding gradients during initialisation. In attention mechanisms, if a query q is orthogonal to all keys kᵢ, all attention weights are equal (softmax of equal values), meaning the token attends uniformly — it has learned nothing about the sequence yet. Orthogonality is also why PCA components are uncorrelated: projections onto orthogonal axes have zero covariance.`
      },
      {
        q: `A data matrix X has shape (100, 500) — 100 samples, 500 features. What is the rank of XᵀX, and what does this imply for fitting linear regression?`,
        a: `Rank(XᵀX) ≤ rank(X) ≤ min(100, 500) = 100. So XᵀX (a 500×500 matrix) has rank at most 100 — it is rank-deficient and not invertible. The normal equation θ̂ = (XᵀX)⁻¹Xᵀy has infinitely many solutions (the system is underdetermined). Ridge regression (XᵀX + λI)⁻¹Xᵀy adds λI to make the matrix full-rank and uniquely determines a solution, picking the minimum-norm one.`
      },
      {
        q: `Why does using QR decomposition to solve least squares give better numerical results than forming and inverting XᵀX directly?`,
        a: `Forming XᵀX squares the condition number: if κ(X)=κ, then κ(XᵀX)=κ². For κ=10⁶ (not unusual), κ(XᵀX)=10¹² — beyond double precision's ~10¹⁶ range, meaning 4 significant digits are lost. QR decomposition X=QR gives θ̂=R⁻¹Qᵀy, working with condition number κ(X) directly. sklearn's LinearRegression uses SVD-based pseudoinverse (even more stable) by default, which is why it never fails due to exact multicollinearity — it computes the minimum-norm solution automatically.`
      },
    ],
    takeaway: `Every ML forward pass is a sequence of matrix multiplications and nonlinearities. Norms tell you the geometry those operations assume; rank tells you where information is irreversibly lost. Both predict failure modes before you ever run an experiment.`,
  },
  {
    id: 'eigendecomposition',
    title: 'Eigenvalues & Eigenvectors',
    subtitle: 'Geometric intuition, spectral theorem, power iteration',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['eigenvalues', 'eigenvectors', 'spectral theorem'],
    summary: `An eigenvector v of matrix A satisfies Av = λv — it is a direction that A scales without rotating, and λ is the scaling factor. Most directions in a matrix's action get both scaled and rotated; eigenvectors are the special directions where only scaling happens. For symmetric matrices, the spectral theorem guarantees A = QΛQᵀ — a clean decomposition into orthogonal stretching directions. The eigenvalue spectrum of a matrix is its fingerprint: the condition number κ = λ_max/λ_min determines gradient descent convergence speed, the Hessian's eigenvalues determine whether a critical point is a minimum or saddle, and covariance matrix eigenvalues are exactly the variances of the principal components in PCA. Power iteration — repeatedly multiply by A and renormalise — is how large-scale systems find the top eigenvector without diagonalising the whole matrix, underlying PageRank and truncated SVD.`,
    keyPoints: [
      `Av = λv: eigenvector v is invariant in direction under A's linear map — A only scales it by λ. In PCA, the top eigenvector of the covariance matrix is the direction of maximum variance in the data.`,
      `Spectral theorem: any real symmetric A = QΛQᵀ where Q is orthogonal and Λ diagonal. Covariance matrices are symmetric PSD so this always applies. PCA is always well-defined and the components are guaranteed orthogonal.`,
      `Positive definite (PD): all eigenvalues > 0; PSD: all ≥ 0. A PD Hessian at a critical point confirms a local minimum. Gradient descent is guaranteed to converge locally when started near this point.`,
      `Condition number κ = λ_max/λ_min controls gradient descent convergence speed: rate ≈ ((κ−1)/(κ+1))^t. Large κ means slow convergence and numerical instability. Features with very different scales create poor conditioning — always standardise.`,
      `Power iteration: start with random v, repeatedly compute v ← Av/‖Av‖. Converges to the top eigenvector at rate |λ₂/λ₁|. It is fast when there is a large spectral gap but slow when the top two eigenvalues are nearly equal.`,
      `The Hessian's eigenvalue spectrum in deep learning: a large maximum eigenvalue means a sharp minimum that is sensitive to perturbation. Models at sharp minima generalise worse — this is the basis for flat-minimum theories of generalisation and the SAM optimiser.`,
      `Non-zero eigenvalues of AB and BA are identical even when AB ≠ BA. This means the n×n Gram matrix K=XXᵀ has the same non-zero eigenvalues as the d×d covariance XᵀX — so you can always work in the smaller dimension for efficiency.`,
      `Deflation: after finding the top eigenvector v₁, subtract A ← A − λ₁v₁v₁ᵀ, then apply power iteration again for v₂. This is how top-k eigenvectors are computed sequentially, making truncated PCA efficient even for very large matrices.`,
    ],
    checkQuestions: [
      {
        q: `Why do covariance matrices always have non-negative eigenvalues? What would a negative eigenvalue imply?`,
        a: `Covariance matrix Σ = E[(X−μ)(X−μ)ᵀ] is symmetric PSD. For any vector v: vᵀΣv = E[(vᵀ(X−μ))²] ≥ 0 since it is an expectation of a squared quantity. Therefore λ = vᵀΣv/‖v‖² ≥ 0 for all eigenvectors v. A negative eigenvalue would mean projecting data onto that direction gives negative variance — physically impossible. In practice, numerical errors in computing a sample covariance can produce tiny negative eigenvalues (e.g., −1e-15); these indicate floating-point error, not real negative variance, and should be clipped to zero.`
      },
      {
        q: `A gradient descent run converges extremely slowly on a quadratic loss. The Hessian at the minimum has eigenvalues [1000, 0.001]. Explain why, and what you would do.`,
        a: `Condition number κ = 1000/0.001 = 10⁶. Gradient descent convergence rate is ((κ−1)/(κ+1))^t ≈ (1 − 2/κ)^t — with κ=10⁶, this decays extremely slowly. The loss landscape is a narrow elongated valley: the gradient is dominated by the steep direction (eigenvalue 1000) and makes tiny progress along the flat direction (eigenvalue 0.001). Fix: preconditioning (multiply gradient by Hessian inverse) — Newton's method converges in one step for quadratics. Practically: use Adam (adaptive learning rates approximate preconditioning), or standardise features to equalise the Hessian eigenvalues.`
      },
      {
        q: `How does the condition number of a data matrix X relate to the numerical stability of linear regression, and how does Ridge fix it?`,
        a: `The normal equation requires inverting XᵀX. If κ(X) is large, κ(XᵀX) = κ(X)² is enormous — small perturbations in data cause large swings in θ̂. Ridge regression solves (XᵀX + λI)θ̂ = Xᵀy. Adding λI shifts all eigenvalues up by λ: the smallest eigenvalue becomes σ_min² + λ, so κ_ridge = (σ_max² + λ)/(σ_min² + λ). With large enough λ, κ_ridge ≈ σ_max²/λ — much smaller than without Ridge. The cost is bias: the solution is pulled toward zero. This is the Ridge bias-variance tradeoff in eigenvalue form.`
      },
    ],
    takeaway: `A matrix's eigenvalues fingerprint its geometry and directly determine how fast any gradient-based method converges on it. Check the condition number before fitting any linear model — a ratio of 10^6 means 10^6-fold slower convergence in the worst direction.`,
  },
  {
    id: 'svd',
    title: 'Singular Value Decomposition',
    subtitle: 'SVD definition, low-rank approximation, connection to PCA',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['SVD', 'low-rank', 'matrix factorisation'],
    summary: `SVD decomposes any matrix A ∈ ℝ^{m×n} as A = UΣVᵀ where U ∈ ℝ^{m×m} and V ∈ ℝ^{n×n} are orthogonal matrices and Σ is diagonal with singular values σ₁ ≥ σ₂ ≥ ... ≥ 0. Unlike eigendecomposition, SVD works for any matrix regardless of shape or symmetry. The singular values measure how much each direction contributes to the matrix — small singular values correspond to directions that can be discarded with minimal error. The Eckart-Young theorem proves that the rank-k approximation formed by the top k singular values and vectors is the best rank-k approximation in both Frobenius and spectral norm — no other rank-k matrix is closer. PCA is SVD applied to the centred data matrix. The pseudoinverse A⁺ = VΣ⁺Uᵀ provides the numerically stable solution to least-squares problems without squaring the condition number.`,
    keyPoints: [
      `A = UΣVᵀ: columns of U are left singular vectors (output directions), columns of V are right singular vectors (input directions), and σᵢ are the scaling factors. Any linear map decomposes as a rotation, axis-aligned scaling, then another rotation.`,
      `Singular values σᵢ = √(eigenvalues of AᵀA) — always real and non-negative even for non-square or non-symmetric A. SVD works where eigendecomposition does not apply.`,
      `Eckart-Young theorem: A_k = Σᵢ₌₁ᵏ σᵢ uᵢvᵢᵀ is the best rank-k approximation in Frobenius and spectral norm. You can optimally compress any matrix by keeping only the top-k components — the mathematical foundation of dimensionality reduction.`,
      `Stable pseudoinverse A⁺ = VΣ⁺Uᵀ inverts non-zero singular values and zeros the rest. It never forms XᵀX explicitly, so condition number is κ(X) not κ(X)². sklearn's LinearRegression uses SVD by default and never fails due to multicollinearity.`,
      `Relationship to PCA: if X is the centred data matrix (n×d), right singular vectors of X = eigenvectors of XᵀX (covariance matrix), and σₖ²/(n−1) = explained variance of PC k. PCA and SVD are the same algorithm viewed at different levels of abstraction.`,
      `Effective rank and intrinsic dimensionality: if most singular values are near zero, the data lives on a low-dimensional manifold. Plotting the singular value spectrum is a diagnostic for how many components a PCA or matrix factorisation actually needs.`,
      `Randomised SVD for large matrices: instead of computing full SVD, sample random projections and compute SVD on a small sketch — O(mnk) for rank-k approximation. sklearn's TruncatedSVD and NMF use this for large sparse matrices in NLP and recommendation systems.`,
      `In NLP and recommendations: latent semantic analysis applies SVD to a TF-IDF term-document matrix. Documents and terms are embedded in the same latent space, so cosine similarity in that space captures semantic relatedness beyond exact word overlap.`,
    ],
    checkQuestions: [
      {
        q: `How is PCA related to SVD of the data matrix X (centred, shape n×d)? Why is SVD more numerically stable than eigendecomposing XᵀX?`,
        a: `PCA principal components are the right singular vectors V of X. The projected scores are XV = UΣ. Explained variance for PC k is σₖ²/(n−1). Computing PCA via SVD of X is more numerically stable than eigendecomposing XᵀX/(n−1) because: if κ(X)=κ, then κ(XᵀX)=κ². For κ=10⁴, eigendecomposing XᵀX works at condition 10⁸; SVD of X works at condition 10⁴. Double precision has ~16 significant digits — squaring the condition number wastes 4-8 digits of precision.`
      },
      {
        q: `A recommendation system has a 10,000×50,000 user-item matrix. Most entries are missing. How would you apply SVD-based matrix factorisation, and what does the rank-k approximation represent?`,
        a: `Directly applying SVD to the sparse matrix (with missing entries as zeros) is incorrect — it treats missing as a zero rating. Instead: use weighted alternating least squares (ALS) or stochastic gradient descent to find low-rank factors U (n×k) and V (d×k) minimising ‖M − UVᵀ‖² only over observed entries. The rank-k approximation represents k latent factors: rows of U are user embeddings, rows of V are item embeddings. The dot product uᵢᵀvⱼ predicts the rating. Choosing k is the bias-variance tradeoff: small k = strong regularisation (underfits), large k = can overfit to observed entries.`
      },
      {
        q: `The singular value spectrum of your data matrix has values [100, 50, 10, 0.1, 0.01, ...]. How many principal components should you keep, and what does the sharp drop tell you?`,
        a: `The sharp drop from 10 to 0.1 (100× decrease) suggests the data has 3 meaningful dimensions of variation and the rest is likely noise. Keep components 1-3: explained variance ∝ σ² → [10000, 2500, 100, 0.01, ...] → cumulative [10000, 12500, 12600, ...] — components 1-3 capture 12500/12600 ≈ 99.2% of variance. The spectral gap (ratio of consecutive singular values) is the signal-to-noise indicator. Values after the gap are numerical noise — keeping them adds variance to downstream models without signal.`
      },
    ],
    takeaway: `Any matrix decomposes into input directions, scaling factors, and output directions. Read the singular value spectrum and you get two things at once: the intrinsic dimensionality of your data and a direct measure of how numerically stable any computation involving that matrix will be.`,
  },
  {
    id: 'pca_theory',
    title: 'PCA from First Principles',
    subtitle: 'Covariance matrix, explained variance, when PCA fails',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['PCA', 'dimensionality reduction', 'covariance'],
    summary: `PCA finds the orthogonal directions of maximum variance in data and provides the best linear dimensionality reduction in terms of reconstruction error. The algorithm: centre the data, compute the covariance matrix C = XᵀX/(n−1), eigendecompose C = QΛQᵀ, and project onto the top-k eigenvectors. Crucially, PCA maximises projected variance, which is equivalent to minimising reconstruction error — the two objectives are identical for linear projections. PCA is sensitive to scale: a feature measured in kilometres will dominate one measured in metres. Always standardise first unless features are already on the same scale. PCA is also sensitive to outliers — a single extreme point can dramatically shift the top principal component toward it. The fundamental limitation is linearity: PCA cannot discover non-linear manifolds like Swiss rolls or the intrinsic structure of image manifolds. t-SNE, UMAP, and autoencoders address this.`,
    keyPoints: [
      `PCA maximises projected variance: the first PC is argmax_{‖w‖=1} Var(Xw) = top eigenvector of C. PCA finds the directions where data spreads most — compressing in low-variance directions (potentially noise) while preserving high-variance directions (potentially signal).`,
      `Equivalently, PCA minimises reconstruction error ‖X − X_proj‖²_F. The two objectives — maximise variance and minimise reconstruction error — are mathematically identical for orthogonal linear projections. PCA is the optimal linear autoencoder.`,
      `Explained variance ratio for PC k: λₖ / Σλᵢ. Choose k via scree plot elbow or cumulative 90-95% threshold. The number of components is a hyperparameter reflecting the signal-to-noise ratio in your data, not a fixed constant.`,
      `PCA is scale-sensitive: a feature with range [0,1000] has variance ~10⁵× higher than one with range [0,1], dominating the first PC. Always standardise (z-score) first unless features share a natural common scale.`,
      `Whitening divides PCA scores by √λₖ to get unit variance in every component. This is required before algorithms that assume spherical data — k-means, GMM with tied covariance, ICA. Applying k-means to raw PCA scores is incorrect if eigenvalues differ by orders of magnitude.`,
      `Kernel PCA replaces dot products xᵢᵀxⱼ with k(xᵢ,xⱼ), performing PCA in a high-dimensional feature space implicitly. It captures non-linear structure without computing the explicit feature map. The cost is O(n²) memory for the kernel matrix.`,
      `When PCA hurts: if discriminative information is in low-variance directions — e.g., two classes differ only in a small-variance feature — PCA discards exactly the useful information. Use supervised dimensionality reduction (LDA, supervised autoencoders) when classes have similar overall variance.`,
      `PCA for noise reduction: if true signal is low-rank plus noise, projecting to the top-k components removes the noise. PCA is used in preprocessing for spectroscopy, fMRI, and collaborative filtering to improve downstream model quality.`,
    ],
    checkQuestions: [
      {
        q: `You run PCA on income (range $0–$1M) and age (range 0–100) without standardising. What does the first PC look like, and what should you do?`,
        a: `The first PC will almost entirely reflect income because its variance (~(500,000)²) dominates age (~(50)²) by a factor of ~10⁸. Age contributes essentially nothing. The resulting dimensionality reduction is just income with a tiny age perturbation — it discards the age signal entirely. Fix: z-score standardise both features before PCA, giving each unit variance. After standardisation, both features contribute equally to the covariance structure, and the PCs reflect genuine multi-dimensional variation.`
      },
      {
        q: `You are using PCA to pre-process features before k-means clustering. After getting the PC scores, should you use them directly or whiten them first? Why?`,
        a: `Whiten them first. K-means uses Euclidean distance and implicitly assumes spherical, equal-variance clusters. PCA scores have variance λ₁ ≥ λ₂ ≥ ... — the first PC has much higher variance than later ones, so k-means will cluster primarily along the first PC and largely ignore later ones. Whitening divides each PC score by √λₖ, giving unit variance in every direction. This is equivalent to using Mahalanobis distance in the original space. In sklearn, PCA with whiten=True does this automatically.`
      },
      {
        q: `PCA applied to 1000-dimensional word vectors reduces them to 50 dimensions retaining 85% of variance. A downstream classifier performs worse than on the full 1000 dimensions. What might be wrong?`,
        a: `Two likely causes: (1) The discriminative information for the classification task is in the 15% of low-variance directions that PCA discarded. For word vectors, rare but semantically important distinctions (e.g., negation words) may have low corpus-level variance but high task-relevance. (2) PCA maximises reconstruction variance, not class separability — it is unsupervised. Fix: try supervised dimensionality reduction (LDA, which maximises class separability), use task-specific fine-tuning, or determine the minimum number of PCs that preserve classification performance via cross-validation rather than a variance threshold.`
      },
    ],
    takeaway: `PCA keeps high-variance directions and throws away low-variance ones. Before using it as a preprocessing step, verify that the discarded directions do not contain task-relevant signal — the discriminative information your classifier needs may live exactly in the low-variance subspace PCA eliminates.`,
  },
  {
    id: 'calculus_ml',
    title: 'Calculus for ML',
    subtitle: 'Gradients, chain rule, Hessian, convexity',
    difficulty: 'foundational',
    estimatedMin: 26,
    tags: ['calculus', 'gradients', 'chain rule', 'convexity'],
    summary: `ML training is fundamentally an optimisation problem: minimise a loss L(θ) over parameters θ by iteratively following the negative gradient. The gradient ∇_θL ∈ ℝ^{|θ|} points in the direction of steepest ascent — its negative is the direction to move to reduce loss fastest. For functions of many variables, partial derivatives ∂L/∂θᵢ measure sensitivity to each parameter independently. The chain rule is the mechanical core of backpropagation: for nested functions f(g(x)), the gradient of the composition is the product of the individual gradients along the computational path. The Hessian H = ∇²L encodes the curvature of the loss landscape — its eigenvalues determine whether critical points are minima, maxima, or saddle points, and its condition number determines gradient descent convergence speed. Convexity is the gold standard for optimisation: a convex loss has no local minima that are not global, and gradient descent is guaranteed to converge to the global minimum with an appropriate step size.`,
    keyPoints: [
      `Gradient ∇f = [∂f/∂x₁, ..., ∂f/∂xₙ]ᵀ points in the direction of steepest ascent — its magnitude is the steepness. Gradient descent step size should be smaller when the gradient is large (steep) to avoid overshooting.`,
      `Chain rule: if z = f(g(x)), then dz/dx = (∂f/∂g)(∂g/∂x). It generalises to vectors as Jacobian products. Backpropagation is just the chain rule applied to the computational graph, computed from output to input (reverse mode).`,
      `Convex function: any local minimum is a global minimum. The Hessian H is PSD everywhere iff f is convex. Linear regression, logistic regression, and SVMs are all convex problems with guaranteed global convergence.`,
      `Critical points: ∇f = 0. Second-order test: H PD → local min; H ND → local max; H indefinite → saddle. In high-dimensional deep networks, most critical points are saddles — some negative eigenvalues — not local minima.`,
      `Saddle points dominate deep learning landscapes: a saddle has some negative curvature directions and some positive. SGD with noise escapes saddles via the negative curvature directions — adding noise is not just a computational shortcut but a necessary escaping mechanism.`,
      `Directional derivative in direction u: ∇f · u = ‖∇f‖cos(θ). The gradient direction θ=0 maximises this. Gradient descent is the greedy locally optimal direction but is not always globally fastest — Newton's method uses curvature too.`,
      `Subgradient: for non-differentiable functions (ReLU at 0, L1 at 0), any element of the subdifferential works in gradient updates. SGD with subgradients converges for L1-regularised problems — non-smooth penalties are still tractable.`,
      `L-smoothness: ‖∇f(x) − ∇f(y)‖ ≤ L‖x−y‖ guarantees the gradient does not change too fast. A step size η ≤ 1/L is safe and gives a provable sufficient decrease per step.`,
    ],
    checkQuestions: [
      {
        q: `Why is convexity important for ML optimisation? Is training a deep neural network a convex problem?`,
        a: `For convex problems, any local minimum is global, and gradient descent with step size ≤ 1/L is guaranteed to converge. This gives both theoretical guarantees and practical reliability — you do not need to worry about getting stuck. Deep neural networks are highly non-convex: the loss landscape has saddle points, local minima with different loss values, and flat regions. However, in overparameterised networks, all local minima tend to have similar loss values, and SGD noise helps escape saddles via negative curvature directions. Convex theory does not apply, but empirically deep networks still train reliably.`
      },
      {
        q: `The loss of a neural network is 10.0 and after one gradient step with η=0.01 it becomes 10.5. What went wrong and how do you diagnose it?`,
        a: `The loss increased — gradient descent diverged. Most likely cause: the learning rate η=0.01 exceeds 1/L where L is the smoothness constant. Overshoot: the step was so large it jumped past the valley floor to a higher point. Diagnosis: compute the gradient norm ‖∇L‖; if it is large, the step η‖∇L‖ is geometrically too big. Fix: reduce η (e.g., try 0.001 or 0.0001), add gradient clipping (cap ‖∇L‖ ≤ threshold), or use a line search. In neural networks, this often happens in the first few steps when the network is far from any good solution and gradients are large.`
      },
      {
        q: `Explain what the Hessian's condition number tells you about gradient descent convergence on a quadratic loss, using a concrete geometric description.`,
        a: `A quadratic loss L(θ) = ½θᵀHθ has level curves that are ellipses. If H has eigenvalues λ_min and λ_max, the ellipse is elongated: width ratio √(λ_max/λ_min) = √κ. Gradient descent on an elongated ellipse zigzags: it takes a big step perpendicular to the valley (steep direction) but makes tiny progress along the valley (flat direction). Convergence rate per step is ((κ−1)/(κ+1))² ≈ 1 − 4/κ for large κ — meaning you need O(κ) steps. With κ=1000, you need ~1000 steps for the same progress that one Newton step would achieve. This is why standardising features (equalising the scale of H's eigenvalues) dramatically accelerates gradient descent.`
      },
    ],
    takeaway: `The gradient tells you direction; the Hessian tells you curvature. Poorly conditioned loss landscapes — caused by unscaled features or mismatched learning rates — are the most common reason training diverges or crawls, and both are fixable before any architecture change.`,
  },
  {
    id: 'matrix_calculus',
    title: 'Matrix Calculus',
    subtitle: 'Gradient of loss wrt weights, numerator/denominator layout',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['matrix calculus', 'gradients', 'backpropagation'],
    summary: `Matrix calculus extends scalar calculus to vectors and matrices. The gradient of a scalar loss L with respect to a weight matrix W is another matrix of the same shape — ∂L/∂Wᵢⱼ is the (i,j)th entry. Layout conventions (numerator vs denominator layout) are a persistent source of confusion because textbooks and software differ; the safest approach is to always state your convention explicitly. The Jacobian of a vector-to-vector function f: ℝⁿ→ℝᵐ is the m×n matrix of partial derivatives. Backpropagation in deep learning computes vector-Jacobian products (VJPs) in reverse mode, not full Jacobians — this is why backprop scales with the number of outputs (1 for scalar loss) rather than inputs (millions of parameters). Mastering matrix derivatives is essential for deriving backpropagation rules from scratch and for implementing custom layers correctly.`,
    keyPoints: [
      `Gradient of scalar f wrt vector x ∈ ℝⁿ: ∂f/∂x ∈ ℝⁿ (same shape as x, numerator layout convention). The gradient always lives in the same space as the parameter it differentiates with respect to.`,
      `Jacobian of vector f: ℝⁿ→ℝᵐ: J ∈ ℝ^{m×n} where Jᵢⱼ = ∂fᵢ/∂xⱼ. Backprop computes vector-Jacobian products (VJPs) v^T J, not full Jacobians. The cost is O(m·n) per layer, not O(m²·n).`,
      `Key identity: ∂(xᵀAx)/∂x = (A+Aᵀ)x = 2Ax if A is symmetric. The gradient of the OLS loss ‖y−Xθ‖² with respect to θ is −2Xᵀ(y−Xθ), which directly gives the normal equation when set to zero.`,
      `Linear layer: z = Wx + b. ∂L/∂W = (∂L/∂z) · xᵀ (outer product). ∂L/∂x = Wᵀ · (∂L/∂z). ∂L/∂b = ∂L/∂z. The gradient with respect to weights is always the outer product of upstream gradient and input activation.`,
      `Chain rule in matrix form: for L = f(g(x)), ∂L/∂x = Jᵍᵀ · ∂L/∂g. This is the VJP used in reverse-mode autodiff. PyTorch's backward() pass is just this identity applied recursively from output to input.`,
      `Trace trick: tr(AᵀB) = vec(A)ᵀvec(B). Matrix gradient derivations can often be reduced to recognising trace patterns — useful for deriving gradients of matrix expressions in closed form.`,
      `Numerator layout (default in ML): ∂y/∂x has shape of y stacked — denominator layout transposes. Pick one convention and stay consistent within a derivation. Mixing conventions is the most common source of sign and shape errors in custom backprop implementations.`,
    ],
    checkQuestions: [
      {
        q: `Derive ∂L/∂W for a single linear layer z = Wx, loss L = ‖z − y‖²/2.`,
        a: `∂L/∂z = z − y (gradient of MSE). Each output zᵢ = Σⱼ Wᵢⱼxⱼ, so ∂zᵢ/∂Wᵢⱼ = xⱼ and ∂zₖ/∂Wᵢⱼ = 0 for k≠i. By chain rule: ∂L/∂Wᵢⱼ = (∂L/∂zᵢ)(∂zᵢ/∂Wᵢⱼ) = (zᵢ − yᵢ)xⱼ. In matrix form: ∂L/∂W = (z−y)xᵀ — the outer product of the upstream gradient and the input activation. This pattern (upstream gradient outer product input) holds for every linear layer in every neural network.`
      },
      {
        q: `What is reverse-mode autodiff (backpropagation), and why is it more efficient than forward-mode for training neural networks?`,
        a: `Forward-mode: propagate a perturbation dx forward through the computation graph, computing df/dx for one input at a time — cost O(parameters) per output. Reverse-mode: propagate a gradient dL backward from the scalar loss, computing dL/dθ for all parameters simultaneously — cost O(outputs) = O(1) for a scalar loss. Since ML loss is scalar and we have millions of parameters, reverse-mode costs ~2-3× a single forward pass regardless of parameter count. Forward-mode would cost millions of forward passes. This is why backpropagation — reverse-mode autodiff on a computational graph — is the only feasible training method for deep networks.`
      },
      {
        q: `You implement a custom layer in PyTorch with a manual backward pass. The gradients pass a finite-difference check on a small input but the training loss does not decrease. What might be wrong?`,
        a: `Several possibilities: (1) Layout convention error — the gradient shape is right but transposed, causing the update to go in the wrong direction. (2) Missing the gradient for b (bias) if the layer has bias. (3) Sign error — returning the gradient instead of its negative (though the optimiser handles the sign, a sign error in a custom layer compounds). (4) The finite-difference check used a small input where the layer is well-behaved, but the actual training data activates a different code path (e.g., a conditional or a non-differentiable point). Always check gradient norms during training to verify they are neither zero (vanished) nor exploding.`
      },
    ],
    takeaway: `The gradient of a scalar loss with respect to any weight matrix is the outer product of the upstream gradient and the input activation. Memorize that one pattern and you can derive backpropagation for any linear layer from scratch.`,
  },
  {
    id: 'convex_optimization',
    title: 'Convex Optimization & Gradient Descent',
    subtitle: 'Convergence guarantees, learning rate, momentum, Adam',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['optimisation', 'gradient descent', 'Adam', 'convergence'],
    summary: `Gradient descent updates θ ← θ − η∇L(θ). For convex L-smooth functions, GD converges at O(1/t) rate with error shrinking proportionally; for μ-strongly convex functions, convergence is exponential at rate ρᵗ where ρ = (κ−1)/(κ+1) < 1. The optimal learning rate is η = 1/L where L is the Lipschitz constant of the gradient — too large and GD diverges, too small and it converges slowly. Mini-batch SGD introduces gradient noise that can escape saddle points but prevents exact convergence without learning rate decay. Momentum methods (Nesterov) accelerate convergence by dampening oscillations perpendicular to the optimum. Adaptive methods (Adam) maintain per-parameter learning rates using exponential moving averages of gradients and squared gradients, making them robust to ill-conditioning and often converging faster in the early training phase.`,
    keyPoints: [
      `L-smoothness: ‖∇f(x) − ∇f(y)‖ ≤ L‖x−y‖ guarantees sufficient decrease per step with η=1/L. The maximum safe learning rate is 1/L — exceed it and GD diverges.`,
      `Strong convexity with parameter μ: f(y) ≥ f(x) + ∇f(x)ᵀ(y−x) + (μ/2)‖y−x‖². This implies a unique global minimum and linear convergence of GD — the gap to the optimum shrinks by a constant factor each step.`,
      `Condition number κ = L/μ: convergence rate ρ = (κ−1)/(κ+1). Large κ means slow convergence. Preconditioning — reducing the effective κ — is equivalent to making the loss landscape more spherical.`,
      `SGD noise prevents exact convergence with a fixed learning rate. The iterates bounce in a noise ball of radius O(η·σ) around the optimum. Learning rate decay (e.g., η_t ∝ 1/√t) is required to converge to the exact solution.`,
      `Momentum: accumulates velocity v ← βv − η∇f, θ ← θ + v. It reduces oscillation perpendicular to the valley and accelerates progress along it. Convergence rate improves from O(κ) to O(√κ) steps.`,
      `Nesterov momentum evaluates the gradient at the "look-ahead" position θ + βv rather than θ. It has better theoretical guarantees than standard momentum and converges in O(√κ) steps with a smaller constant.`,
      `Adam: keeps exponential moving averages of gradient (m̂) and squared gradient (v̂); effective lr ≈ η·m̂/√v̂ with bias correction. Default β₁=0.9, β₂=0.999, ε=1e-8. Each parameter effectively has its own adaptive learning rate proportional to the inverse RMS of recent gradients.`,
      `Adam pitfall: can converge to suboptimal solutions in non-convex settings. SGD with momentum often generalises better for final fine-tuning because it finds flatter minima. Many practitioners use Adam early then switch to SGD.`,
    ],
    checkQuestions: [
      {
        q: `Why does learning rate scheduling matter in SGD but not in full-batch GD (for convex problems)?`,
        a: `Full-batch GD on a convex problem converges with any fixed step size ≤ 1/L. SGD introduces gradient noise from mini-batches — with a fixed learning rate η, SGD converges to a noise ball around the optimum of radius O(η·σ/μ) rather than the exact optimum. Decaying the learning rate (e.g., η_t = η₀/√t) makes the noise shrink over time, allowing eventual convergence. Without decay, the model keeps bouncing near the optimum but never converges — useful for escaping sharp minima but not for fine-tuning.`
      },
      {
        q: `Adam is converging faster than SGD early in training but the final test loss is higher. Explain why and what you would do.`,
        a: `Adam finds solutions faster because it adapts learning rates per parameter — effectively preconditioning. But fast convergence often means convergence to sharp minima: regions of the loss landscape where the Hessian has large eigenvalues. Sharp minima generalise worse because small perturbations to the weights (from distribution shift or finite sample variation) cause large loss increases. SGD with momentum, by virtue of its isotropic noise, tends to find flatter minima that generalise better. Common fix: use Adam for the first 90% of training to get to the basin quickly, then switch to SGD with small LR to settle into a flat minimum.`
      },
      {
        q: `You are training on a loss with L-smoothness constant L=100 and strong convexity μ=0.1. What learning rate should you use, what is the convergence rate, and how many steps to reduce the error by 100×?`,
        a: `Optimal learning rate: η = 1/L = 0.01. Condition number: κ = L/μ = 100/0.1 = 1000. Convergence rate: ρ = (κ−1)/(κ+1) = 999/1001 ≈ 0.998. Each step reduces the gap by factor 0.998. To reduce error by 100×: 0.998^t = 0.01 → t = log(0.01)/log(0.998) ≈ (−4.6)/(−0.002) ≈ 2300 steps. The high condition number explains why preconditioning (or standardising features) is so important — it could reduce κ by orders of magnitude, cutting required steps proportionally.`
      },
    ],
    takeaway: `The condition number of the loss landscape — not the learning rate alone — determines how fast you converge. Standardising features and using adaptive optimisers are two different ways to attack the same problem: reducing the effective condition number seen by gradient descent.`,
  },
  {
    id: 'hypothesis_testing',
    title: 'Hypothesis Testing',
    subtitle: 'p-values, Type I/II errors, t-test, chi-squared, multiple comparisons',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['statistics', 'hypothesis testing', 'p-values', 'A/B testing'],
    summary: `Hypothesis testing provides a formal framework for making decisions from data under uncertainty. The null hypothesis H₀ (e.g., no treatment effect) is the default assumption; evidence strong enough against it causes rejection in favour of H₁. The p-value is the probability of observing results at least as extreme as the data under H₀ — it is not the probability that H₀ is true, which is perhaps the most consequential statistical misunderstanding in applied science. Type I error (false positive, rate α) occurs when H₀ is true but rejected. Type II error (false negative, rate β) occurs when H₁ is true but H₀ is not rejected. Power = 1−β is the probability of correctly detecting a real effect. With large sample sizes, even trivially small effects yield p < 0.05 — effect size must always accompany p-values. Multiple comparisons inflate the family-wise error rate: running k independent tests each at α=0.05 gives an expected α·k false positives.`,
    keyPoints: [
      `p-value: P(T(data) ≥ t_obs | H₀) — reject H₀ if p < α (typically 0.05). This is NOT the probability H₀ is true. The failure mode is treating p=0.03 as "97% confident H₁ is true."`,
      `Type I error (α): reject H₀ when H₀ is true — a false positive. Type II error (β): fail to reject H₀ when H₁ is true — a false negative. Power = 1−β = probability of correctly detecting a real effect.`,
      `Effect size matters more than p-value. With n=1,000,000, a 0.001% conversion difference achieves p<0.001 — statistically significant but practically meaningless. Always report Cohen's d, odds ratio, or % lift alongside p-values.`,
      `t-test: compares means — one-sample (μ=μ₀?), two-sample (μ₁=μ₂?), paired (before-after). Assumes normality of means (CLT covers large n). The t-test is robust to non-normal data when n > 30.`,
      `Chi-squared test: tests independence of categorical variables. χ² = Σ (O−E)²/E; df = (rows−1)(cols−1). The failure mode is using it when expected cell counts are below 5 — Fisher's exact test is the correct alternative.`,
      `Multiple comparisons: running k tests at α=0.05 gives expected 0.05k false positives. Bonferroni correction uses α/k (conservative, controls FWER). Benjamini-Hochberg controls FDR and is less conservative — Bonferroni is overly strict for exploratory feature selection.`,
      `A/B test power analysis: n = 2·(z_{α/2} + z_β)²·σ²/δ² per group. Fixing α=0.05, power=0.8, and minimum detectable effect δ determines required sample size. You must decide MDE before running the test, not after seeing results.`,
      `Peeking bias: stopping an A/B test as soon as p < 0.05 inflates Type I error. Sequential testing methods — always-valid p-values, spending functions — are the correct fix. Most naive A/B testing implementations are anti-conservative.`,
    ],
    checkQuestions: [
      {
        q: `An A/B test shows p=0.03 with δ=0.1% conversion lift. Should you ship the variant?`,
        a: `Not necessarily. Statistical significance (p<0.05) does not imply practical significance. A 0.1% conversion lift may be below the threshold of business relevance. Evaluate: (1) Is the lift meaningful for the business given implementation cost? (2) Is the result reproducible across segments (novelty effect)? (3) What are secondary and guardrail metric impacts? (4) Was the test correctly powered with pre-specified MDE, or was it stopped early (peeking bias)? Statistical significance = "we are confident this effect is not zero"; it says nothing about whether the effect is worth acting on.`
      },
      {
        q: `You run 100 A/B tests for feature ideas at α=0.05. How many false positives do you expect, and how should you correct for this?`,
        a: `Expected false positives = 100 × 0.05 = 5 tests will show p<0.05 by chance alone even if all null hypotheses are true. Correction options: (1) Bonferroni: use α = 0.05/100 = 0.0005 per test — very conservative, high Type II error. (2) Benjamini-Hochberg (BH): sort p-values, find largest k where p_(k) ≤ k·α/m, reject that set — controls false discovery rate at α, less conservative than Bonferroni, preferred for exploratory testing. (3) Pre-registration: specify which tests you will run and their order before collecting data.`
      },
      {
        q: `Explain the difference between statistical power and significance. If you double the sample size of an A/B test, how does each change?`,
        a: `Significance level α = P(Type I error) = P(reject H₀ | H₀ true) — typically fixed at 0.05 before the test. Power = 1 − β = P(reject H₀ | H₁ true) — the probability of detecting a real effect. Significance is a design choice (not changed by n); power increases with n because the standard error shrinks as 1/√n, making the test statistic larger for the same effect size. Doubling n halves the standard error, increases the non-centrality parameter by √2, and increases power (e.g., from 80% to ~95% for typical effect sizes). This is why power analysis specifies n — it is the lever for controlling Type II error while holding Type I fixed.`
      },
      {
        q: `A chi-squared test of independence between product category and purchase decision gives p=0.15. What can you conclude, and what are the limitations?`,
        a: `At α=0.05, p=0.15 means we fail to reject H₀ (independence). This does NOT mean the variables are independent — it means we do not have sufficient evidence to conclude dependence. Power may be low (small sample → can't detect small associations). Limitations: (1) Chi-squared requires expected cell counts ≥ 5 — if violated, results are unreliable. (2) The test is non-directional — it detects any pattern of dependence but says nothing about direction or magnitude. (3) Correlation vs. causation — even significant association does not imply one causes the other.`
      },
    ],
    takeaway: `A p-value measures evidence against the null hypothesis — it is not the probability that any hypothesis is true. Never ship or kill a feature on a p-value alone. You need effect size, power, and business context too.`,
    interactiveId: 'hypothesis_testing_viz',
  },
  {
    id: 'mle_map',
    title: 'MLE vs MAP Estimation',
    subtitle: 'Likelihood, log-likelihood, MAP as regularised MLE',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['MLE', 'MAP', 'regularisation', 'Bayesian'],
    summary: `Maximum Likelihood Estimation (MLE) finds the parameters θ that make the observed data most probable: θ̂_MLE = argmax P(data|θ). It treats data as random and parameters as fixed unknowns. Maximum A Posteriori (MAP) estimation finds the parameters most probable given the data: θ̂_MAP = argmax P(θ|data) ∝ P(data|θ)P(θ), incorporating a prior belief P(θ) about parameters. MAP is equivalent to regularised MLE — the log prior term acts as a penalty on the log-likelihood. A Gaussian prior on θ yields L2 (Ridge) regularisation; a Laplace prior yields L1 (Lasso) regularisation. This equivalence reveals that regularisation is not an ad hoc trick but a principled way of encoding prior knowledge. As n→∞, the prior is overwhelmed by the likelihood and MAP converges to MLE — Bayesian and frequentist approaches agree in the large-data limit.`,
    keyPoints: [
      `MLE: θ̂_MLE = argmax_θ Σᵢ log p(xᵢ|θ). The log-likelihood avoids underflow and converts products to sums. For iid data, MLE is just summing per-sample log probabilities.`,
      `MLE for Gaussian: θ̂_μ = x̄ (unbiased), θ̂_σ² = (1/n)Σ(xᵢ−x̄)² — biased; dividing by n−1 gives the unbiased estimator. MLE is not always unbiased and you should know which estimators are.`,
      `MAP: θ̂_MAP = argmax_θ [log p(data|θ) + log p(θ)] — the log prior acts as a regulariser. Every regularised ML algorithm has a Bayesian MAP interpretation.`,
      `Gaussian prior N(0,τ²I) on weights → L2 regularisation: adds λ‖θ‖² to loss where λ = 1/(2τ²). The regularisation strength λ encodes confidence in the prior — small λ means diffuse prior, large λ means strong prior towards zero.`,
      `Laplace prior on weights → L1 regularisation: adds λ‖θ‖₁ to loss. The Laplace prior has a sharp peak at zero and heavy tails that encourage sparsity. L1 regularisation is MAP estimation with the assumption that most weights should be exactly zero.`,
      `As n→∞, the likelihood term dominates: MAP → MLE. In large-data regimes the prior becomes irrelevant and regularisation should be reduced — shrinking λ as n grows is theoretically correct.`,
      `Cross-entropy minimisation for logistic regression = MLE for Bernoulli distribution. The loss function is not arbitrary — it follows directly from the probabilistic model assumed.`,
      `Empirical Bayes: estimate the prior from the data itself (e.g., estimate λ by maximising marginal likelihood P(data)). It bridges MLE and MAP, adapting regularisation strength to the data rather than requiring manual tuning.`,
    ],
    checkQuestions: [
      {
        q: `Show that L2 regularisation (Ridge) is equivalent to MAP estimation with a Gaussian prior on weights.`,
        a: `MAP: θ̂ = argmax [Σ log p(yᵢ|xᵢ,θ) + log p(θ)]. With p(θ) = N(0, σ²_θ I): log p(θ) = −(1/2σ²_θ)‖θ‖² + const. So θ̂_MAP = argmin [−Σ log p(yᵢ|xᵢ,θ) + (1/2σ²_θ)‖θ‖²] = argmin [NLL + λ‖θ‖²] where λ = 1/(2σ²_θ). This is exactly Ridge regression / L2-regularised logistic regression. The tighter the prior (smaller σ²_θ), the larger λ and stronger the regularisation.`
      },
      {
        q: `A colleague argues that L1 regularisation is just a mathematical trick to get sparsity. How would you explain it as a principled statistical choice?`,
        a: `L1 regularisation is MAP estimation with a Laplace prior: p(θ) = (λ/2)exp(−λ|θ|). The Laplace distribution has a sharp peak at 0 (encouraging most weights to be exactly zero) and heavier tails than Gaussian (allowing a few weights to be large). This encodes the belief that the true model is sparse — most features are irrelevant and a few matter strongly. It is appropriate when the ground truth is genuinely sparse (e.g., genomics where few genes affect a trait). It is not a trick; it is a statement about your prior beliefs about the model structure.`
      },
      {
        q: `You have 10 training samples and fit logistic regression. You try both MLE and MAP with a Gaussian prior. Which performs better on a test set, and what changes as you get more data?`,
        a: `With n=10, MAP (Ridge-regularised logistic regression) almost certainly outperforms MLE. With so few samples, MLE overfits: the likelihood is nearly flat in many parameter directions and the weights grow large. The Gaussian prior pulls weights toward zero, acting as a strong regulariser. With n=10, the bias from the prior is a small cost compared to the large variance reduction. As n grows into the thousands, the likelihood term dominates the prior, MAP → MLE, and the difference shrinks to near zero. This is why regularisation should be reduced (λ → 0) as training set size grows — tuning λ via CV on a large dataset naturally selects smaller values.`
      },
    ],
    takeaway: `Every regularised ML model is a MAP estimate with an implicit prior. L2 says weights are probably small and Gaussian. L1 says most weights are probably exactly zero. The regularisation you pick is a statement about what you believe the model should look like before seeing data.`,
  },
  {
    id: 'bayesian_inference',
    title: 'Bayesian Inference',
    subtitle: 'Prior, likelihood, posterior, conjugate priors, MCMC',
    difficulty: 'advanced',
    estimatedMin: 34,
    tags: ['Bayesian', 'posterior', 'MCMC', 'conjugate priors'],
    summary: `Bayesian inference maintains a full probability distribution over parameters rather than a point estimate, capturing uncertainty that point estimates discard. After observing data, the posterior P(θ|data) = P(data|θ)P(θ)/P(data) represents all remaining uncertainty about the parameters. The denominator P(data) = ∫ P(data|θ)P(θ)dθ is the marginal likelihood — typically intractable because the integral is over a high-dimensional parameter space. Conjugate priors are special priors where the posterior is in the same distribution family, yielding closed-form updates. They are rare but extremely useful when they exist. When conjugacy is unavailable, MCMC draws samples from the posterior without computing the normalising constant. Variational inference approximates the posterior with a tractable family by minimising KL divergence. In production ML, Bayesian approaches shine when uncertainty quantification, small data, or sequential updating are central requirements.`,
    keyPoints: [
      `Posterior ∝ likelihood × prior: P(θ|X) ∝ P(X|θ)P(θ). The normalising constant P(X) = ∫ P(X|θ)P(θ)dθ is the marginal likelihood. Computing it exactly requires integrating over all possible parameters — tractable only for conjugate models.`,
      `Conjugate prior: if the posterior is in the same family as the prior after observing data, they are conjugate — Beta-Binomial, Dirichlet-Multinomial, Normal-Normal, Gamma-Poisson. Conjugate priors give closed-form sequential updates without MCMC.`,
      `Beta-Binomial: prior Beta(α,β), likelihood Binomial(n,p), posterior Beta(α+successes, β+failures). α and β act as pseudo-counts — Beta(1,1) is the uniform prior (no pseudo-counts) and Beta(10,10) is a prior that has already "seen" 20 balanced coin flips.`,
      `Posterior predictive: P(x_new|X) = ∫ P(x_new|θ)P(θ|X)dθ averages predictions over the posterior. It gives calibrated uncertainty (wider than a point estimate prediction) and is what a well-calibrated Bayesian model reports.`,
      `MCMC draws samples from P(θ|X) without computing the normalising constant. Metropolis-Hastings accepts proposals with probability min(1, P(θ'|X)/P(θ|X)), and the ratio of unnormalised posteriors cancels the intractable denominator.`,
      `Variational inference: approximate P(θ|X) with tractable q(θ) by minimising KL(q||P(θ|X)) = minimising the negative ELBO. It is faster than MCMC but introduces bias — the approximate family may not contain the true posterior. VAEs use VI where exact inference is impossible.`,
      `When Bayesian outperforms frequentist: small data (prior regularises), sequential updating (streaming data — posterior becomes new prior), uncertainty-aware decisions (medical diagnosis), Thompson sampling for multi-armed bandits. These are practical advantages, not just philosophy.`,
      `Posterior collapse in VAEs: if the prior is too strong relative to the data likelihood, the encoder ignores the input and outputs the prior — q(z|x) ≈ p(z). The latent variable carries no information and the model degenerates to an unconditional generator.`,
    ],
    checkQuestions: [
      {
        q: `In a Bayesian A/B test for CTR, variant A shows 50 clicks from 200 impressions, variant B shows 70 clicks from 200 impressions. Using Beta(1,1) prior for both, compare the posteriors and compute P(CTR_B > CTR_A | data).`,
        a: `Beta(1,1) is uniform. Posterior A: Beta(1+50, 1+150) = Beta(51,151). Posterior B: Beta(1+70, 1+130) = Beta(71,131). Posterior mean A = 51/202 ≈ 0.252; posterior mean B = 71/202 ≈ 0.352. P(CTR_B > CTR_A | data) requires integrating the joint posterior — computed numerically (scipy.stats.beta) or via Monte Carlo: sample from both posteriors and compute fraction where B > A. This gives a direct probability statement ("B is better with 97% probability") unlike frequentist hypothesis testing which only says "the difference is unlikely under H₀."`,
      },
      {
        q: `MCMC converges to the correct posterior asymptotically. What does "converging" mean, how do you diagnose it, and what can go wrong?`,
        a: `Convergence means the Markov chain's stationary distribution has been reached — samples look like draws from P(θ|X) rather than reflecting the starting point. Diagnosis: R-hat statistic (potential scale reduction factor) — values near 1.0 indicate all chains have mixed; trace plots should look like "fuzzy caterpillars" with no trend; effective sample size (ESS) should be large relative to chain length. What goes wrong: (1) Multimodal posteriors — chains get trapped in one mode. (2) High-dimensional posteriors — Metropolis-Hastings has vanishing acceptance rates; HMC (Hamiltonian Monte Carlo) is much better. (3) Correlated parameters — very slow mixing. These are why MCMC is expensive and variational inference is preferred in production.`
      },
      {
        q: `Explain the ELBO in variational inference. What does maximising it do, and what does it fail to capture?`,
        a: `ELBO (Evidence Lower BOund): log P(X) = ELBO(q) + KL(q(θ)||P(θ|X)) where ELBO = E_q[log P(X,θ)] − E_q[log q(θ)]. Since KL ≥ 0, ELBO ≤ log P(X) — it is a lower bound on the log marginal likelihood. Maximising ELBO is equivalent to minimising KL(q||P(θ|X)): it makes q as close as possible to the true posterior. What it fails to capture: (1) Reverse KL causes mode-seeking — if P(θ|X) is multimodal, q collapses to one mode. (2) The variational family may not contain the true posterior (e.g., mean-field VI assumes independence between parameters, which underestimates posterior correlations). These approximation errors make VI biased — unlike MCMC which is asymptotically exact.`
      },
    ],
    takeaway: `Bayesian inference gives you a distribution over parameters, not a point. That distribution is the right answer when calibrated uncertainty matters — for small data, sequential updating, or uncertainty-aware decisions. The cost is that the posterior is almost never tractable, which is why MCMC and variational inference exist.`,
  },
  {
    id: 'em_algorithm',
    title: 'EM Algorithm',
    subtitle: 'Latent variables, E-step/M-step, GMM, convergence',
    difficulty: 'advanced',
    estimatedMin: 28,
    tags: ['EM', 'GMM', 'latent variables', 'expectation maximisation'],
    summary: `The Expectation-Maximisation (EM) algorithm maximises the likelihood when data has latent (unobserved) variables. Direct maximisation of P(X|θ) = Σ_Z P(X,Z|θ) is intractable because the log of a sum cannot be decomposed. EM circumvents this by introducing an auxiliary distribution over Z and iterating two tractable steps: the E-step computes the expected complete-data log-likelihood under the current parameters; the M-step maximises it. EM is guaranteed to monotonically increase the marginal likelihood at every iteration — it cannot decrease the likelihood — but converges to a local maximum, not necessarily the global one. Gaussian Mixture Models are the canonical EM application: latent variables are cluster assignments, and EM alternates between soft assignment of points to clusters and recomputing cluster parameters. EM is also used in HMMs, probabilistic PCA, and missing data imputation.`,
    keyPoints: [
      `Setup: observed X, latent Z, parameters θ. Direct maximisation of log P(X|θ) = log Σ_Z P(X,Z|θ) is intractable — the log of a sum cannot be simplified. EM introduces a lower bound (ELBO) and maximises that instead.`,
      `E-step: compute Q(θ|θ_old) = E_{Z|X,θ_old}[log P(X,Z|θ)] — the expected complete-data log-likelihood given current parameter estimates. The unknown Z is replaced with its posterior distribution under the current model.`,
      `M-step: θ_new = argmax_θ Q(θ|θ_old). For exponential family models this has a closed form — just computing sufficient statistics weighted by the posterior over Z.`,
      `Convergence: EM monotonically increases log P(X|θ) at every iteration — proven via Jensen's inequality on the ELBO lower bound. EM is safe (never degrades) but only guarantees a local optimum.`,
      `EM for GMM: E-step computes soft cluster assignments (responsibilities) rᵢₖ = P(zᵢ=k|xᵢ,θ) — "how much does cluster k explain point i?"; M-step updates μₖ, Σₖ, πₖ as responsibility-weighted means and covariances. EM-GMM is soft k-means.`,
      `EM converges to local optima — different initialisations yield different solutions. Running EM 10× with random restarts and keeping the best log-likelihood is standard practice.`,
      `Singularity problem in GMM: a cluster can collapse to a single point with Σₖ → 0, giving infinite likelihood. This is not convergence but degeneracy. Add a minimum variance floor or use a Bayesian GMM with an Inverse-Wishart prior to prevent it.`,
      `Generalisation: variational EM replaces the exact E-step with variational inference when P(Z|X,θ) is intractable. VAEs use variational EM with a neural network encoder as the approximate E-step — VAE training is gradient-based EM.`,
    ],
    checkQuestions: [
      {
        q: `Why can we not just take the gradient of log P(X|θ) = log Σ_Z P(X,Z|θ) directly and set it to zero?`,
        a: `The log-sum is generally intractable: the sum Σ_Z involves summing over an exponential number of latent configurations (discrete case) or an intractable integral (continuous case). Even if we could differentiate it, the resulting equation would depend on P(Z|X,θ) which itself depends on θ in a complex way — there is no closed-form solution. EM avoids this by working with the complete-data log-likelihood log P(X,Z|θ), which factorises nicely and has tractable sufficient statistics. The E-step replaces the unknown Z with its conditional expectation given current parameters, making the M-step a simple weighted optimisation.`
      },
      {
        q: `You run EM to fit a GMM with k=3 components. After convergence, one component has near-zero weight. What happened, and what does it mean?`,
        a: `Near-zero weight means the EM found a solution where one component is essentially unused — its responsibility for all data points approached zero and consequently its weight πₖ → 0. This happens when (1) the data genuinely has fewer than k clusters and one component is redundant, or (2) EM got trapped at a degenerate local maximum where a component "gave up" early in training. Diagnosis: try different k values (2 and 4) and compare BIC/AIC; a model with k=2 may achieve similar BIC with more interpretable components. Also try 10+ random restarts — the k=3 solution may just be a bad local optimum.`
      },
      {
        q: `Explain the connection between EM and the ELBO in variational inference. When is the E-step exact, and when is it approximate?`,
        a: `The ELBO lower bound on log P(X|θ) is: ELBO = E_{q(Z)}[log P(X,Z|θ)] − E_{q(Z)}[log q(Z)] = log P(X|θ) − KL(q(Z) || P(Z|X,θ)). The E-step maximises ELBO over q(Z) with θ fixed: the maximum is achieved by setting q(Z) = P(Z|X,θ) (the true posterior), making KL=0 and ELBO = log P(X|θ) exactly. This is exact when P(Z|X,θ) is tractable (e.g., GMM, HMM with forward-backward). When P(Z|X,θ) is intractable (e.g., deep latent variable models), q(Z) is restricted to a tractable family and KL>0 — this is variational EM (VAEs). The M-step maximises ELBO over θ with q fixed — for neural networks, this is a gradient step rather than a closed-form update.`
      },
    ],
    takeaway: `EM converts one intractable optimisation — the marginal likelihood over hidden variables — into a sequence of tractable ones by alternating between filling in the hidden variable distribution and maximising the resulting expected log-likelihood. The moment you have latent variables and a tractable complete-data likelihood, EM is the natural algorithm.`,
  },
  {
    id: 'concentration_inequalities',
    title: 'Concentration Inequalities',
    subtitle: 'Markov, Chebyshev, Hoeffding — generalisation bounds',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['concentration', 'generalisation', 'PAC learning', 'bounds'],
    summary: `Concentration inequalities bound the probability that a random variable deviates far from its expectation. They are the theoretical foundation of PAC (Probably Approximately Correct) learning theory, providing formal guarantees that a model trained on n samples will perform well on unseen data. The inequalities form a hierarchy: Markov requires only finite mean; Chebyshev requires finite variance; Hoeffding requires bounded support — each stronger assumption buys a tighter bound. Combining Hoeffding with the union bound over a hypothesis class gives the fundamental PAC learning bound: the generalisation gap shrinks as O(1/√n). The VC dimension extends this to infinite hypothesis classes by replacing log|H| with a measure of effective model complexity. Modern overparameterised models violate classical bounds but still generalise — the theory is actively being revised with new notions like PAC-Bayes and implicit regularisation.`,
    keyPoints: [
      `Markov inequality: P(X ≥ t) ≤ E[X]/t for non-negative X. It requires only finite mean, so it is very loose (Chebyshev is often 10× tighter) — but it works for any non-negative RV including heavy-tailed ones.`,
      `Chebyshev: P(|X−μ| ≥ t) ≤ Var(X)/t² requires finite variance. No more than 1/k² of data lies more than k std devs from the mean. This is the mechanism behind the weak law of large numbers.`,
      `Hoeffding's inequality: for bounded iid Xᵢ ∈ [aᵢ,bᵢ], P(|X̄−μ| ≥ ε) ≤ 2exp(−2n²ε²/Σ(bᵢ−aᵢ)²). The bound is exponentially tight — the probability of large deviations of the sample mean shrinks exponentially fast with n.`,
      `Union bound: P(A₁∪...∪Aₖ) ≤ Σ P(Aᵢ). Combined with Hoeffding: P(sup_h |R̂(h) − R(h)| ≥ ε) ≤ 2|H|exp(−2nε²). For a finite hypothesis class |H|, the worst-case generalisation gap is controlled.`,
      `Generalisation bound: with probability 1−δ, R(h) ≤ R̂(h) + √(log(|H|/δ)/(2n)). The gap shrinks as O(1/√n) and O(√log|H|). Doubling data improves the bound by factor √2; squaring the hypothesis class only adds a constant.`,
      `VC dimension: maximum points any labelling of which the class can shatter. Linear classifiers in ℝᵈ have VC-dim=d+1. VC-dim is the right notion of effective model complexity for generalisation bounds on infinite hypothesis classes.`,
      `Double descent: modern overparameterised models generalise despite zero training error. Classical bounds are loose by orders of magnitude — the true implicit regularisation of gradient descent is not captured by hypothesis complexity alone.`,
      `PAC-Bayes bounds: instead of bounding supH generalisation gap, bound the expected gap over a posterior on hypotheses. Often tighter for neural networks, explaining why ensembles and Bayesian NNs can have better-than-expected generalisation.`,
    ],
    checkQuestions: [
      {
        q: `How many training samples n are needed so that, with probability 0.95, the generalisation error of any hypothesis in a class of size |H|=100 is within ε=0.05 of its training error?`,
        a: `Using union bound + Hoeffding: P(bad event) ≤ 2|H|exp(−2nε²) ≤ δ where δ=0.05. Solve: n ≥ log(2|H|/δ)/(2ε²) = log(2×100/0.05)/(2×0.0025) = log(4000)/0.005. log(4000) ≈ 8.29. So n ≥ 8.29/0.005 ≈ 1658 samples. This is the sample complexity for uniform convergence over |H|=100 hypotheses.`
      },
      {
        q: `A neural network with 10 million parameters achieves zero training error and 95% test accuracy on a 50,000 sample dataset. Classical VC theory predicts it should generalise poorly. Why does it?`,
        a: `Classical VC bounds give: generalisation gap ≤ √(VC-dim × log(n) / n). For VC-dim ≈ 10M and n=50K, this bound is vacuous (> 1). The network generalises because: (1) Gradient descent finds the minimum-norm interpolating solution among infinitely many zero-training-error solutions — this implicit bias toward low-norm weights is a form of regularisation not captured by VC-dim. (2) The true data is low-dimensional — the effective complexity needed to fit it is far below 10M parameters. (3) Modern bounds (PAC-Bayes, NTK theory) that account for the specific algorithm (gradient descent) and data structure give much tighter results.`
      },
      {
        q: `Why is the Hoeffding bound exponentially tighter than Chebyshev, and when would you prefer Chebyshev?`,
        a: `Chebyshev: P(|X̄−μ| ≥ ε) ≤ Var(X̄)/ε² = σ²/(nε²) — polynomial decay in n. Hoeffding: P(|X̄−μ| ≥ ε) ≤ 2exp(−2nε²/range²) — exponential decay in n. Hoeffding is exponentially tighter because it uses the stronger assumption that X is bounded. Chebyshev only requires finite variance. Prefer Chebyshev when: (1) the RV is unbounded (e.g., normal data — Hoeffding doesn't apply), (2) you only know the variance, not the range. Hoeffding requires [a,b] to be known and finite — for example, it applies to loss functions bounded in [0,1] (binary classification) but not to unbounded regression losses.`
      },
    ],
    takeaway: `Generalisation gap shrinks as O(√(log(model_complexity)/n)). Doubling your data shrinks the gap by √2. Halving your model class only shaves off a constant from the log term. More data beats smaller models in almost every practical regime.`,
  },
  {
    id: 'monte_carlo',
    title: 'Monte Carlo Methods',
    subtitle: 'Sampling, importance sampling, MCMC, variance reduction',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['Monte Carlo', 'sampling', 'MCMC', 'importance sampling'],
    summary: `Monte Carlo methods approximate intractable integrals by averaging over random samples: E_p[f(X)] ≈ (1/N)Σ f(xᵢ) where xᵢ ~ p(X). The key property is that the error decreases as O(1/√N) regardless of dimension — unlike numerical quadrature, which requires Nᵈ points in d dimensions. This makes Monte Carlo the only tractable integration method in high dimensions and explains its ubiquity in variational inference, particle filters, and policy gradient reinforcement learning. Importance sampling corrects for cases when sampling directly from p is difficult, by drawing from a proposal distribution q and reweighting. MCMC constructs a Markov chain whose stationary distribution is the target posterior, enabling sampling from distributions known only up to a normalising constant.`,
    keyPoints: [
      `The Law of Large Numbers guarantees (1/N)Σ f(xᵢ) → E[f(X)] as N→∞. The CLT gives error σ/√N where σ² = Var(f(X)). Convergence rate is determined by the variance of the integrand, not the dimension.`,
      `Importance sampling: E_p[f(X)] = E_q[f(X)·p(X)/q(X)]. Draw xᵢ ~ q, compute weighted average with weights w(x) = p(x)/q(x). You can estimate expectations under p without ever sampling from p directly.`,
      `IS weight explosion: if q has lighter tails than p, weights w(x) = p(x)/q(x) can be enormous in the tails — producing an unbiased but high-variance estimator. Self-normalised IS with effective sample size (ESS = (Σwᵢ)²/Σwᵢ²) is essential for diagnosing this.`,
      `MCMC: Metropolis-Hastings accepts proposed θ' with probability min(1, P(θ'|X)q(θ|θ')/[P(θ|X)q(θ'|θ)]). The ratio cancels the intractable normalising constant — MCMC only requires evaluating the unnormalised posterior.`,
      `Variance reduction techniques: antithetic variates (sample x and 1-F(x)); control variates (subtract a correlated quantity with known expectation); stratified sampling. All reduce Var(f(X)) without adding bias, dramatically cutting the N needed for a target error.`,
      `Quasi-MC replaces random samples with low-discrepancy sequences (Sobol, Halton), converging as O(1/N) rather than O(1/√N) for smooth integrands. It can be orders of magnitude more efficient than random MC for smooth functions.`,
      `Policy gradient in RL: ∇E[R(τ)] = E[R(τ)∇log π(τ)] (log-derivative trick). REINFORCE estimates this with Monte Carlo rollouts — unbiased but high variance. Baselines b(s) reduce variance without introducing bias.`,
      `Particle filters (Sequential Monte Carlo) maintain a weighted set of particles approximating the posterior over hidden states at each time step. Resampling prevents weight degeneracy. They extend MCMC to online sequential inference in state-space models.`,
    ],
    checkQuestions: [
      {
        q: `Why does Monte Carlo error scale as O(1/√N) regardless of dimension, while numerical quadrature degrades exponentially with dimension?`,
        a: `Numerical quadrature (e.g., Simpson's rule) requires a grid: for d dimensions with m points per axis, Nᵈ = mᵈ total points are needed to maintain fixed accuracy — exponential in d. MC error is σ/√N where σ = std dev of f(X); this depends only on N, not d. The dimension affects σ (higher d means f may be more variable) but not the 1/√N convergence rate. So MC needs the same N for a given accuracy regardless of d, while quadrature's N grows as ε^{-d} — which is why MC is the only tractable integration method in high dimensions.`
      },
      {
        q: `In importance sampling for evaluating a rare event (P(X > 10) where X~N(0,1) ≈ 7.6×10⁻²⁴), what makes a good proposal distribution q?`,
        a: `Directly sampling from N(0,1) would require ~10²⁴ samples to see even one event. A good proposal q should: (1) have support covering the rare event region (x > 10), (2) be proportional to |f(x)|·p(x) = p(x) in the region x > 10 — meaning q should be a truncated Normal or shifted Gaussian concentrated near x=10+. Specifically, q = N(10, 1) shifted to the rare region would work well. The weights w(x) = p(x)/q(x) = N(0,1)/N(10,1) would be well-behaved. The failure mode (light-tailed q) doesn't apply here since the rare region is clearly delineated.`
      },
      {
        q: `REINFORCE policy gradient has very high variance in practice. Explain why and describe two variance reduction techniques.`,
        a: `REINFORCE: ∇J(π) ≈ (1/N)Σ R(τᵢ)∇log π(τᵢ). Variance is high because: (1) The return R(τ) for a full episode has high variance due to stochasticity in transitions and policy. (2) The gradient is estimated from a single trajectory, which may be noisy. Variance reduction: (1) Baseline subtraction: ∇J ≈ Σ (R(τ) − b)∇log π(τ) — subtract baseline b (e.g., value function V(s)) from the return. This is unbiased (E[b·∇log π] = b·E[∇log π] = b·0 = 0) but reduces variance. (2) Temporal decomposition: instead of using total return R(τ), use reward-to-go Σ_{t'≥t} r_{t'} — future rewards don't depend on past actions, so using them is unbiased and reduces variance.`
      },
    ],
    takeaway: `Monte Carlo error scales as O(1/√N) regardless of dimension — numerical quadrature degrades exponentially with dimension. That dimension-independence is the entire reason Monte Carlo dominates variational inference, policy gradients, and any other high-dimensional expectation you need to estimate.`,
  },
  {
    id: 'sampling_distributions',
    title: 'Sampling Distributions & CLT',
    subtitle: 'CLT, standard error, confidence intervals, bootstrap',
    difficulty: 'foundational',
    estimatedMin: 24,
    tags: ['CLT', 'confidence intervals', 'bootstrap', 'standard error'],
    summary: `The Central Limit Theorem (CLT) states that the sample mean X̄ of n iid samples with finite variance converges in distribution to N(μ, σ²/n) as n→∞, regardless of the underlying distribution. This is the single most important result in classical statistics because it justifies Normal-theory inference on any reasonably large dataset without knowing the true data distribution. The standard error SE = σ/√n quantifies the uncertainty in the sample mean as an estimate of μ. Confidence intervals convey not the probability that μ is in a specific interval but the long-run coverage rate of the procedure. The bootstrap resamples from the empirical distribution to estimate any statistic's sampling distribution non-parametrically — it is distribution-free and works for statistics with no closed-form sampling theory (median, AUC, correlation).`,
    keyPoints: [
      `CLT: √n(X̄−μ)/σ →_d N(0,1) as n→∞. This works for n ≥ 30 in practice for most distributions, but heavy-tailed distributions may need far more — the normal approximation for a Pareto-distributed statistic may need n > 1000.`,
      `Standard error of the mean: SE = σ/√n. Halving SE requires quadrupling sample size. The 1/√n convergence rate means collecting 4× the data only halves your estimation uncertainty.`,
      `95% CI for mean: X̄ ± 1.96·SE. Correct interpretation: 95% of intervals constructed this way (over repeated experiments) contain μ. NOT "95% probability μ is in this interval" — the true parameter is fixed; the interval is what is random.`,
      `Bootstrap: resample n points with replacement B times (B=1000 typical), compute statistic θ̂* each time, CI via percentile method [θ̂*_{0.025}, θ̂*_{0.975}]. Works for any statistic (AUC, median, SHAP value) — the universal fallback when no analytical SE formula exists.`,
      `Bootstrap advantage: distribution-free, works for any statistic, captures complex dependence structures. Disadvantage: computationally expensive (B model fits or evaluations), and fails for statistics that depend on the extremes (max, min). Heavy-tailed bootstraps can be unreliable.`,
      `Delta method: if √n(θ̂−θ)→N(0,σ²), then for smooth g: √n(g(θ̂)−g(θ))→N(0, [g'(θ)]²σ²). Used for CIs on log(odds), hazard ratios, and other nonlinear transformations. You can derive standard errors for any smooth function of an estimator.`,
      `Jackknife: leave-one-out resampling that estimates bias and variance. Consistent for smooth statistics but fails for non-smooth ones (median, quantiles — use bootstrap instead). It is the fast analytical alternative to bootstrap for variance estimation.`,
    ],
    checkQuestions: [
      {
        q: `You compute a 95% CI of [0.42, 0.58] for a conversion rate. Can you say "there is a 95% probability the true conversion rate is between 0.42 and 0.58"?`,
        a: `No — in frequentist statistics, the true parameter is fixed (not random), so it either is or is not in [0.42, 0.58]. The correct interpretation: if you repeated this experiment many times and constructed a 95% CI each time, 95% of those intervals would contain the true parameter. The observed interval [0.42, 0.58] is one realisation of this procedure. For a probability statement about the parameter, use a Bayesian credible interval: given a Beta(1,1) prior, the 95% HPD credible interval gives P(p ∈ interval | data) = 0.95.`
      },
      {
        q: `Your model's AUC is 0.85 on a test set of 1000 samples. A colleague asks for a confidence interval. How would you compute it?`,
        a: `AUC has no simple closed-form standard error. Use bootstrap: (1) resample 1000 test examples with replacement B=2000 times; (2) compute AUC on each resample; (3) take the 2.5th and 97.5th percentiles as the 95% CI. Alternatively, use the DeLong method which has an analytical SE formula for AUC. The bootstrap CI might give [0.82, 0.88] — this quantifies how much the AUC estimate would vary if you had a different test set. This is essential before claiming model A (AUC=0.85) is better than model B (AUC=0.84) — overlapping CIs suggest the difference may not be meaningful.`
      },
      {
        q: `The CLT guarantees the sample mean is approximately Normal for large n. Your data follows a Pareto distribution (power-law). Does the CLT still apply, and if so, how large does n need to be?`,
        a: `The standard CLT requires finite variance. For Pareto with tail index α > 2, the variance is finite and the CLT applies — but convergence is slow because the distribution is heavy-tailed. You may need n > 10,000 for the normal approximation to be accurate, rather than the n > 30 rule of thumb for light-tailed distributions. For Pareto with α ≤ 2, the variance is infinite and the standard CLT does not apply — the generalised CLT applies with stable distributions instead. In practice: always check kurtosis and tail behaviour before trusting CLT-based inference on financial or web data.`
      },
    ],
    takeaway: `The CLT makes sample means Normal regardless of the underlying distribution — that is the entire foundation of classical inference. But "reasonably sized" depends on tail behavior: n=30 works fine for near-Gaussian data, but power-law distributions may need n > 10,000 before the Normal approximation holds.`,
  },
]
