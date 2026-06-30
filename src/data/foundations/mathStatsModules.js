export const MATH_STATS_MODULES = [
  {
    id: 'probability_basics',
    title: 'Probability Fundamentals',
    subtitle: `Sample spaces, Bayes' theorem, conditional probability`,
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['probability', 'bayes', 'foundations'],
    summary: `Every model you build makes claims about the world under uncertainty — so you need a principled language for uncertainty. Probability gives you that: a sample space Ω of all possible outcomes, events as subsets of Ω, and a measure P that assigns numbers in [0,1] satisfying three axioms. The naive approach to updating beliefs when new evidence arrives is to just count frequencies in the data — but this throws away everything you knew before the data arrived and breaks completely when data is scarce. Conditional probability P(A|B) = P(A∩B)/P(B) formalises belief update from a single piece of evidence. Bayes' theorem P(A|B) = P(B|A)P(A)/P(B) solves the direction-reversal problem: you know P(data|hypothesis) from your model, but you want P(hypothesis|data). The prior P(A) is what makes this different from simply looking at frequencies — and ignoring it is the single most common probabilistic error in applied ML. A 99%-accurate test on a rare disease (prevalence 0.1%) still has only a 9% posterior probability of true positive, because the prior is overwhelmingly against disease.`,
    keyPoints: [
      `You almost never have P(hypothesis|data) directly. You have P(data|hypothesis) from your model. Bayes' theorem is the exact rule for reversing that: posterior = likelihood × prior / evidence. The prior is not optional noise — it is half the calculation. Drop it and you get the prosecutor's fallacy: treating P(evidence|innocent) as P(innocent|evidence).`,
      `The law of total probability P(B) = Σ P(B|Aᵢ)P(Aᵢ) is how you compute the denominator in Bayes — it marginalises out the unknown hypothesis. When the hypothesis space is continuous, this integral is usually intractable, which is the core computational problem of Bayesian inference.`,
      `Conditional independence A ⊥ B | C is a fundamentally different statement from marginal independence A ⊥ B. Cough and fever are correlated in the general population — but given the diagnosis "flu," they are conditionally independent: the disease explains both symptoms, so knowing one gives no extra signal about the other. Naïve Bayes exploits this: it assumes conditional independence given the class label, which can hold even when features are marginally correlated.`,
      `Mutually exclusive events are always dependent when both have positive probability: P(A∩B) = 0, but P(A)P(B) > 0. Knowing A occurred means B definitely did not. Exclusivity and independence are opposites — not related concepts.`,
      `Laplace smoothing prevents any unseen word from zeroing out the entire posterior in a Naïve Bayes classifier. Without it, P(new_word|class) = 0, and the product over all words collapses to zero regardless of other evidence. Smoothing adds a pseudo-count to every word — it is MAP estimation with a Dirichlet prior.`,
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
    takeaway: `Posterior probability is likelihood times prior divided by evidence. A 99%-accurate test can still be wrong 91% of the time when the base rate is 0.1%. The prior is not a philosophical add-on — it is the number that determines whether a model output is actually meaningful.`,
    interactiveId: 'bayes_calculator',
  },
  {
    id: 'random_variables',
    title: 'Random Variables & Distributions',
    subtitle: 'PMF, PDF, CDF, expectation, variance, common distributions',
    difficulty: 'foundational',
    estimatedMin: 32,
    tags: ['distributions', 'expectation', 'variance'],
    summary: `Probability theory talks about events. But ML needs numbers — loss values, predicted probabilities, feature measurements. A random variable is the bridge: a function that assigns a real number to each outcome in the sample space. Once you have numbers, you need to summarise their behaviour. The naive approach is to just look at the mean, but the mean alone is catastrophically misleading: a model that predicts 0 for 999 requests and 1000 for one request has the same mean as a model that predicts 1 for all — but wildly different behaviour. Variance is the correction: it measures how far outcomes typically deviate from the mean, which determines how unreliable any single prediction or estimate is. The common distributions are not arbitrary — each one arises from a specific data-generating mechanism. Poisson counts rare events in a fixed window. Exponential measures the waiting time between those events. Normal arises from summing many small independent effects. Log-Normal arises from multiplying many small independent effects, which is why latency and revenue are log-normal but not Gaussian.`,
    keyPoints: [
      `Expectation E[X] is the probability-weighted average — the long-run mean if you drew forever. Linearity holds always: E[aX + bY] = aE[X] + bE[Y] regardless of whether X and Y are dependent. You can compute expectations of sums without knowing the joint distribution at all. This is why expected loss decomposes additively across samples.`,
      `Variance Var(X) = E[X²] − (E[X])² measures how spread out outcomes are around the mean. The gap E[X²] − (E[X])² is always non-negative by Jensen's inequality, and zero only when X is constant. Never report a model's mean prediction without its variance — the variance is what tells you whether that mean is trustworthy.`,
      `Bernoulli(p) has variance p(1−p), maximised at p = 0.5. A perfectly balanced binary classification problem has maximum label uncertainty and requires the most data to learn from — variance tells you how much information each label carries.`,
      `Poisson(λ) has mean = variance = λ. If your data's sample variance greatly exceeds the sample mean, the Poisson model is wrong — that is overdispersion, caused by unmodeled heterogeneity or clustering. Use Negative Binomial instead.`,
      `Exponential(λ) is the only continuous memoryless distribution: P(X > s+t | X > s) = P(X > t). The expected remaining wait time is always 1/λ regardless of how long you have already waited. This is why it models hardware failures and server inter-arrival times, but not human lifespan (mortality risk increases with age).`,
      `Log-Normal: if log(X) is Normal, then X is always positive with a heavy right tail. It arises when a quantity is the product of many independent random factors — each multiplicative step adds to the log, and the CLT makes the log Normal. Revenue, file sizes, and web latency are log-normal; fitting a Gaussian to them badly underestimates tail probabilities.`,
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
    takeaway: `Mean tells you where outcomes center; variance tells you how much you can trust that center. A point prediction without a variance estimate is a guess with a false precision attached. Always ask: what is the spread of this estimate, and how does that change what I should do?`,
    interactiveId: 'distribution_viz',
  },
  {
    id: 'joint_distributions',
    title: 'Joint Distributions & Independence',
    subtitle: 'Joint PDF/PMF, marginals, conditional distributions, covariance',
    difficulty: 'foundational',
    estimatedMin: 26,
    tags: ['joint distributions', 'covariance', 'correlation'],
    summary: `ML models almost always work with multiple variables simultaneously — features, labels, latent states. Looking at each variable in isolation (its marginal distribution) throws away all information about how variables relate to each other. The joint distribution of (X, Y) carries strictly more information than the two marginals whenever X and Y are dependent. Covariance Cov(X, Y) measures how X and Y move together — but it has a critical blind spot: it only detects linear relationships. Two variables can have zero covariance while one is a deterministic function of the other. Correlation ρ standardises covariance to [−1, 1] and tells you the strength of the linear relationship, but ρ = 0 rules out linear dependence only — not all dependence. The covariance matrix of a random vector encodes all pairwise linear relationships and is always symmetric positive semi-definite, which makes it the input to PCA, Gaussian models, and Mahalanobis distance. Any algorithm that passes a non-PSD matrix to these methods will produce nonsensical results.`,
    keyPoints: [
      `Joint PDF f(x, y); marginal f_X(x) = ∫ f(x,y) dy; conditional f(x|y) = f(x,y)/f_Y(y). The chain rule f(x,y) = f(x|y)f(y) says any joint distribution factors into conditionals — autoregressive language models are a direct application of this identity, decomposing P(sentence) into a product of P(next token | all previous tokens).`,
      `Zero covariance does not imply independence. If X ~ N(0,1) and Y = X², then Cov(X, Y) = 0 because X³ has zero expected value by symmetry — yet Y is entirely determined by X. Pearson correlation detects only linear relationships. Use mutual information or rank-based correlation (Spearman) when you actually need to check for general dependence.`,
      `Covariance matrix Σ is always symmetric PSD: Σᵢⱼ = Cov(Xᵢ, Xⱼ), with variances on the diagonal. Any algorithm that requires a valid covariance matrix — Gaussian models, Mahalanobis distance, PCA — will break if you pass a non-PSD matrix. Non-PSD matrices arise from more features than samples, floating point errors, or manually constructed correlation matrices with inconsistent entries.`,
      `High correlation between two features (ρ = 0.95) makes XᵀX near-singular in linear regression, causing coefficients to become numerically unstable — small changes in training data produce large swings in estimated weights. Ridge regression adds λI to make the matrix invertible. The correlation is not the problem; the near-singularity of XᵀX is.`,
      `Multivariate Normal is entirely characterised by (μ, Σ). Conditioning any subset on another subset stays Gaussian with closed-form mean and covariance — which is why Gaussian Processes and Kalman filters are tractable. No other multivariate family has this property.`,
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
    takeaway: `Zero correlation rules out linear dependence only. Two variables can have ρ = 0 while one is a deterministic function of the other. If you need to check actual independence — not just linear independence — use mutual information or a rank-based test.`,
  },
  {
    id: 'information_theory',
    title: 'Information Theory for ML',
    subtitle: 'Entropy, cross-entropy, KL divergence, mutual information',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['entropy', 'KL divergence', 'cross-entropy', 'mutual information'],
    summary: `Training a classifier requires a loss function — a number that says how wrong the model is. The naive choice is squared error, but squared error treats all wrong predictions equally regardless of the model's stated confidence. What you actually want is a loss that penalises confident wrong answers far more than uncertain ones. Cross-entropy H(p, q) = −Σ p(x) log q(x) does exactly this: it measures the average surprise your model q assigns to samples drawn from the true distribution p. A model that predicts 0.99 probability for the wrong class gets catastrophically punished. Minimising cross-entropy over training data is identical to maximum likelihood estimation — the loss function is not an arbitrary design choice, it follows from the probabilistic model you assumed. KL divergence KL(p‖q) measures the excess surprise from using q instead of p: it is always non-negative and zero only when p = q exactly. The direction of KL matters profoundly: forward KL (used in maximum likelihood) forces q to cover all modes of p; reverse KL (used in VAEs) causes q to collapse to one mode. These produce qualitatively different learned distributions — blurry vs. sharp, inclusive vs. exclusive.`,
    keyPoints: [
      `Entropy H(X) = −Σ p log p is the minimum average bits needed to encode samples from X. It is maximised by the uniform distribution (maximum uncertainty) and zero for a deterministic outcome. A classifier cannot achieve expected log-loss below H(p) on data from distribution p — entropy is the Bayes error rate in bits.`,
      `Cross-entropy H(p, q) = H(p) + KL(p‖q). Since H(p) is constant with respect to model parameters, minimising cross-entropy is exactly minimising KL divergence from the model to the true distribution. Every classification network you train is doing approximate KL minimisation whether you think of it that way or not.`,
      `KL divergence is asymmetric: KL(p‖q) ≠ KL(q‖p). Forward KL (KL(p‖q)) forces q to be non-zero wherever p is non-zero — q spreads to cover all modes, producing blurry samples when the target is multimodal. Reverse KL (KL(q‖p)) lets q ignore regions where p is small — q collapses to a single sharp mode. VAE encoders use reverse KL, which is why they tend to produce blurry reconstructions.`,
      `Mutual information I(X; Y) = H(X) − H(X|Y) = KL(p(x,y) ‖ p(x)p(y)). It is the right score for feature selection: it measures how much knowing Y reduces uncertainty about X, regardless of whether the relationship is linear, quadratic, or any other shape. Pearson correlation misses nonlinear relationships; mutual information does not.`,
      `Binary cross-entropy gradient: ∂L/∂z = ŷ − y where z is the pre-sigmoid logit. The gradient is simply prediction error — this elegant form is why logistic regression and neural network output layers are so tractable to train and why sigmoid + cross-entropy is the canonical output layer, not sigmoid + MSE.`,
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
    takeaway: `Minimising cross-entropy is minimising KL divergence from your model to the true data distribution. The direction of KL matters: forward KL produces mode-covering distributions, reverse KL produces mode-collapsing ones. The choice of which direction to minimise is a design decision with large qualitative consequences for the learned model.`,
    interactiveId: 'information_theory_viz',
  },
  {
    id: 'linear_algebra_basics',
    title: 'Vectors & Matrices',
    subtitle: 'Dot product, matrix operations, rank, norms',
    difficulty: 'foundational',
    estimatedMin: 26,
    tags: ['linear algebra', 'matrices', 'norms'],
    summary: `Every forward pass in a neural network is a sequence of matrix multiplications and nonlinearities. To understand why networks work, fail, or train slowly, you need to know what those matrix operations are doing geometrically. A matrix represents a linear transformation between vector spaces — it stretches, rotates, and projects. The dot product xᵀy = ‖x‖‖y‖cos(θ) measures directional alignment: it is large when two vectors point in similar directions and zero when they are perpendicular. This is not a numerical coincidence — attention mechanisms use dot products precisely because they measure how similar a query is to each key. Rank measures how many independent directions a matrix spans. A rank-deficient matrix collapses some information irreversibly: if XᵀX is rank-deficient, the normal equation has infinitely many solutions and you cannot uniquely fit a linear model. Norms measure size and encode geometry: L2 norm assumes spherical geometry; L1 norm induces sparsity. The norm your algorithm uses is the geometry it assumes, which determines its regularisation behaviour.`,
    keyPoints: [
      `Dot product xᵀy = 0 when x and y are orthogonal. Orthogonal weight matrices preserve norms (‖Wx‖ = ‖x‖), preventing vanishing and exploding gradients at initialisation. In attention, a query orthogonal to all keys produces uniform attention weights — the head has learned nothing about the sequence yet.`,
      `Matrix rank = number of linearly independent columns = dimensionality of the column space. If a data matrix X has shape (100, 500), then XᵀX has rank at most 100 despite being 500×500. The normal equation (XᵀX)⁻¹Xᵀy has no unique solution — Ridge regression adds λI to make the matrix invertible, picking the minimum-norm solution.`,
      `L1 norm ‖x‖₁ = Σ|xᵢ| creates sparsity. Its subdifferential at zero allows the subgradient to pull weights exactly to zero, unlike L2 which only shrinks them. Lasso regularisation is L1-penalised MLE — it encodes the prior belief that most features are irrelevant.`,
      `L2 norm ‖x‖₂ = √(Σxᵢ²) is Euclidean distance. Ridge regression, weight decay, and gradient clipping all use L2. Every algorithm that uses L2 distance implicitly assumes spherical geometry where all directions are equally important — a dangerous assumption for unscaled features.`,
      `Determinant det(A) is the volume scaling factor of the linear map. det(A) = 0 means the transformation collapses the space: information is destroyed. A near-zero determinant signals near-singularity and numerical instability in solving Ax = b.`,
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
    takeaway: `Every ML forward pass is a sequence of matrix multiplications and nonlinearities. Rank tells you where information is irreversibly lost. Norms tell you what geometry and regularisation an algorithm assumes. Both predict failure modes before you run a single experiment.`,
  },
  {
    id: 'eigendecomposition',
    title: 'Eigenvalues & Eigenvectors',
    subtitle: 'Geometric intuition, spectral theorem, power iteration',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['eigenvalues', 'eigenvectors', 'spectral theorem'],
    summary: `A matrix transformation generally both rotates and stretches every vector it acts on. But some special directions are only stretched, not rotated — the matrix acts on them as pure scaling. Those are the eigenvectors: Av = λv, where λ is the scaling factor. This matters for ML because the eigenvectors of the covariance matrix are the directions of maximum variance in the data, and their eigenvalues tell you exactly how much variance each direction accounts for. PCA is just finding these directions. The condition number κ = λ_max/λ_min of the Hessian determines how fast gradient descent converges: a high condition number means the loss landscape is a narrow elongated valley, and gradient descent zigzags slowly down it. A condition number of 10⁶ means convergence is 10⁶-fold slower in the worst direction. The Hessian's eigenvalues also determine whether a critical point is a minimum (all positive), maximum (all negative), or saddle (mixed) — and in deep networks, almost all critical points are saddles, not local minima.`,
    keyPoints: [
      `Av = λv: eigenvector v is the direction that A only scales, not rotates. The top eigenvector of the covariance matrix is the direction of maximum variance in the data — that is the first principal component. The eigenvalue λ₁ tells you exactly how much variance that direction accounts for.`,
      `Spectral theorem: any real symmetric A = QΛQᵀ where Q is orthogonal and Λ diagonal. Covariance matrices are always symmetric PSD, so this applies. It guarantees PCA components are orthogonal, eigenvalues are real and non-negative, and the decomposition always exists.`,
      `Condition number κ = λ_max/λ_min controls gradient descent convergence speed: rate ≈ ((κ−1)/(κ+1))^t. With κ = 1000, you need ~1000 steps to converge where 1 Newton step suffices. Features with different scales create poor conditioning — standardising before fitting is not a stylistic choice, it directly fixes the condition number.`,
      `Hessian eigenvalues classify critical points: all positive → local minimum, all negative → local maximum, mixed signs → saddle point. In high-dimensional deep networks, most critical points are saddles. SGD noise helps escape saddles by moving along negative-curvature directions — the noise is not just a computational artifact, it is a necessary escaping mechanism.`,
      `Power iteration: repeatedly multiply by A and renormalise. Converges to the top eigenvector at rate |λ₂/λ₁|. Google's PageRank is power iteration on the web link matrix. Truncated SVD and large-scale PCA both use randomised variants of power iteration rather than diagonalising the full matrix.`,
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
    takeaway: `A matrix's eigenvalues are its fingerprint: they directly determine gradient descent convergence speed, whether critical points are minima or saddles, and how much variance each direction accounts for. Check the condition number before fitting any linear model — a ratio of 10⁶ means 10⁶-fold slower convergence in the worst direction.`,
  },
  {
    id: 'svd',
    interactiveId: 'svd_viz',
    title: 'Singular Value Decomposition',
    subtitle: 'SVD definition, low-rank approximation, connection to PCA',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['SVD', 'low-rank', 'matrix factorisation'],
    summary: `High-dimensional data is almost never truly high-dimensional — it lives on a low-dimensional structure embedded in a high-dimensional space. The problem is: how do you find that structure efficiently? Eigendecomposition finds it for square symmetric matrices, but data matrices are rarely square or symmetric. SVD extends this to any matrix: A = UΣVᵀ, where the columns of V are the input directions of maximum variance (right singular vectors), the columns of U are the corresponding output directions, and the diagonal values σ₁ ≥ σ₂ ≥ ... are how much each direction contributes. Crucially, the Eckart-Young theorem proves that keeping only the top-k singular vectors gives the best possible rank-k approximation — no other rank-k matrix is closer in either Frobenius or spectral norm. This is the mathematical foundation of dimensionality reduction, recommendation systems, and latent semantic analysis. PCA is SVD on the centred data matrix — they are the same algorithm at different levels of abstraction. The pseudoinverse A⁺ = VΣ⁺Uᵀ solves least-squares without ever forming XᵀX, keeping the condition number at κ(X) rather than κ(X)².`,
    keyPoints: [
      `A = UΣVᵀ: any linear map decomposes into three operations — rotate by Vᵀ, scale by Σ, rotate by U. The right singular vectors V are the directions in input space that the matrix stretches along. The singular values σᵢ tell you how much. SVD reveals what a linear transformation actually does geometrically.`,
      `Eckart-Young theorem: A_k = Σᵢ₌₁ᵏ σᵢ uᵢvᵢᵀ is the best rank-k approximation in Frobenius and spectral norm. This is provably optimal — no other rank-k matrix is closer to A. It is the mathematical guarantee that justifies truncated SVD as a compression and denoising tool.`,
      `PCA is SVD on the centred data matrix. The right singular vectors of X equal the eigenvectors of XᵀX (the covariance matrix). The k-th explained variance is σₖ²/(n−1). Computing PCA via SVD of X avoids forming XᵀX and therefore avoids squaring the condition number — it is always numerically superior.`,
      `Pseudoinverse A⁺ = VΣ⁺Uᵀ solves least squares without forming XᵀX. When singular values are near zero, it zeros them rather than inverting them — automatically handling multicollinearity. sklearn's LinearRegression uses this by default, which is why it never crashes on near-singular data.`,
      `Plotting the singular value spectrum is a diagnostic for intrinsic dimensionality. A sharp drop from large to near-zero singular values indicates the data lives on a low-dimensional manifold. Values below the gap are noise — keeping them adds variance without signal to any downstream model.`,
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
    takeaway: `SVD reveals both the intrinsic dimensionality of your data (read the singular value spectrum for the gap between signal and noise) and the numerical stability of any computation on that matrix (the condition number is σ_max/σ_min). Both are free diagnostics that come with every SVD call.`,
  },
  {
    id: 'pca_theory',
    title: 'PCA from First Principles',
    subtitle: 'Covariance matrix, explained variance, when PCA fails',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['PCA', 'dimensionality reduction', 'covariance'],
    summary: `High-dimensional data slows down downstream models, causes overfitting, and makes visualisation impossible. The obvious fix is to drop features — but which ones? Dropping features by hand throws away information arbitrarily. PCA finds a principled answer: project the data onto the directions where it varies most. Maximum variance is the proxy for maximum information. Compressing in low-variance directions loses little — those directions may be noise. The algorithm: centre the data, compute the covariance matrix, find its top eigenvectors. Crucially, maximising projected variance is mathematically equivalent to minimising reconstruction error — the two objectives produce the same answer. But PCA has two critical failure modes that must be understood before applying it. First, it is scale-sensitive: a feature measured in dollars will dominate one measured in cents, making the "directions of maximum variance" reflect measurement units rather than signal. Always standardise first. Second, PCA is unsupervised: it keeps directions of maximum variance, not directions useful for the downstream task. The discriminative signal for a classifier may live precisely in the low-variance subspace PCA discards.`,
    keyPoints: [
      `PCA maximises projected variance: the first PC is the direction w (‖w‖ = 1) that maximises Var(Xw). This is the top eigenvector of the covariance matrix C = XᵀX/(n−1). Compressing in low-variance directions loses the least information — but only if low variance means noise, not signal.`,
      `PCA is scale-sensitive: a feature with range [0, 1000] has variance ~10⁶× higher than one with range [0, 1]. It will dominate every principal component. Standardise (z-score) before PCA unless features share a natural common scale. The alternative — whitening — divides PCA scores by √λₖ to give unit variance in every direction.`,
      `Whitening is required before algorithms that assume spherical data: k-means, Gaussian Mixture Models with tied covariance, ICA. Applying k-means to raw PCA scores is incorrect when eigenvalues differ by orders of magnitude — the algorithm will cluster almost entirely along the first PC.`,
      `PCA fails when discriminative information is in low-variance directions. If two classes differ only in a feature with small variance, PCA discards exactly the useful signal. This is the fundamental mismatch: PCA maximises reconstruction quality for the data distribution, not classification performance for the task. Use LDA or supervised autoencoders when label information should guide the reduction.`,
      `Kernel PCA replaces the dot products xᵢᵀxⱼ with k(xᵢ, xⱼ), performing PCA implicitly in a high-dimensional feature space. It discovers non-linear manifold structure that linear PCA cannot. The cost is O(n²) memory for the kernel matrix, making it impractical for large n.`,
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
    takeaway: `PCA keeps high-variance directions and discards low-variance ones. Before using it as a preprocessing step, verify that the discarded directions do not contain task-relevant signal — the information your model needs most may live exactly in the low-variance subspace PCA eliminates.`,
  },
  {
    id: 'calculus_ml',
    title: 'Calculus for ML',
    subtitle: 'Gradients, chain rule, Hessian, convexity',
    difficulty: 'foundational',
    estimatedMin: 26,
    tags: ['calculus', 'gradients', 'chain rule', 'convexity'],
    summary: `ML training is an optimisation problem: given a loss function L(θ) measuring how wrong the model is, find the θ that minimises it. If you could afford to evaluate L everywhere, you would just try all values. You cannot, so you need a direction to move. The gradient ∇_θL tells you exactly that: for each parameter, how much does the loss increase if you nudge that parameter up? The negative gradient is the direction of steepest descent. Following it iteratively is gradient descent. The chain rule makes this tractable for deep networks: when the loss is a composition of many functions, the gradient of the whole is a product of gradients of each piece along the computational path. That product, computed from output back to input, is backpropagation. The Hessian ∇²L adds second-order information: curvature. It tells you whether a critical point where ∇L = 0 is a minimum (all positive curvature), maximum (all negative), or saddle (mixed). The condition number of the Hessian — ratio of maximum to minimum curvature — directly determines how fast gradient descent converges. A poorly conditioned Hessian is the most common reason training crawls, and it is fixable by standardising features before any architectural change.`,
    keyPoints: [
      `Gradient ∇f = [∂f/∂x₁, ..., ∂f/∂xₙ]ᵀ points in the direction of steepest ascent. Its magnitude is the rate of increase. The negative gradient is the direction that reduces the function fastest from the current point — but only locally. A large gradient means a steep region where large steps overshoot.`,
      `Chain rule: if z = f(g(x)), then dz/dx = (∂f/∂g)(∂g/∂x). For vector-valued functions, this is a product of Jacobians. Backpropagation is the chain rule applied to the computational graph in reverse, computing ∂L/∂θ for all parameters simultaneously in one backward pass at the cost of a single forward pass.`,
      `Convex function: any local minimum is global. Hessian H is PSD everywhere iff f is convex. Linear regression, logistic regression, and SVMs are convex — gradient descent on them is guaranteed to find the global optimum. Deep networks are non-convex — but in overparameterised regimes, most local minima have similar loss values, and saddle points dominate over local minima.`,
      `Saddle points have mixed Hessian curvature: some directions curve up (positive eigenvalues) and some curve down (negative eigenvalues). Gradient descent noise from mini-batches causes random perturbations that push the iterate down the negative-curvature directions, escaping the saddle. This is not a side effect of mini-batch training — it is why mini-batch training works better than full-batch in non-convex landscapes.`,
      `L-smoothness ‖∇f(x) − ∇f(y)‖ ≤ L‖x−y‖ bounds how fast the gradient changes. The maximum safe learning rate is η = 1/L — exceeding it means the quadratic approximation underlying gradient descent breaks down and the step overshoots. A loss that diverges on the first step means η > 1/L.`,
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
    takeaway: `The gradient tells you direction; the Hessian tells you curvature; the condition number tells you how fast you will get there. A poorly conditioned loss landscape — caused by unscaled features — is the most common reason training crawls, and it is fixable before any architecture change.`,
  },
  {
    id: 'matrix_calculus',
    title: 'Matrix Calculus',
    subtitle: 'Gradient of loss wrt weights, numerator/denominator layout',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['matrix calculus', 'gradients', 'backpropagation'],
    summary: `Neural networks have millions of parameters arranged as matrices. To train them you need the gradient of a scalar loss with respect to each weight matrix — ∂L/∂W — which is itself a matrix of the same shape as W. The naive way to compute this is to perturb each weight one at a time and measure the change in loss: finite differences. This is correct but costs one forward pass per parameter — completely infeasible for millions of weights. Matrix calculus gives you the analytical shortcut: derive a closed-form expression for ∂L/∂W that can be evaluated in one pass. The key identity for every linear layer is that ∂L/∂W is the outer product of the upstream gradient and the input activation. This one pattern covers every fully-connected layer in every neural network ever trained. Backpropagation is just this identity applied recursively from output to input via the chain rule. A persistent source of bugs is layout convention: numerator layout vs. denominator layout transpose the Jacobian. Mixing conventions silently produces gradients with the wrong shape, causing training to fail with no obvious error message.`,
    keyPoints: [
      `Gradient of scalar f with respect to vector x ∈ ℝⁿ is a vector of the same shape: ∂f/∂x ∈ ℝⁿ. The gradient always lives in the same space as the parameter. This is what makes weight updates well-defined: θ ← θ − η·∂L/∂θ requires both to have the same shape.`,
      `Jacobian of vector f: ℝⁿ→ℝᵐ is J ∈ ℝ^{m×n} where Jᵢⱼ = ∂fᵢ/∂xⱼ. Computing the full Jacobian costs O(m·n). Backpropagation never computes the full Jacobian — it computes vector-Jacobian products vᵀJ (upstream gradient times Jacobian), which costs O(n) per layer regardless of m. This is why backprop scales to millions of parameters.`,
      `Linear layer z = Wx + b: ∂L/∂W = (∂L/∂z) · xᵀ — the outer product of the upstream gradient and the input activation. ∂L/∂x = Wᵀ · (∂L/∂z) — the transpose of W times the upstream gradient. These two identities are all you need to implement backprop for any fully-connected layer from scratch.`,
      `Key identity ∂(xᵀAx)/∂x = (A + Aᵀ)x = 2Ax when A is symmetric. Setting this to zero gives the normal equation for least squares: ∂‖y − Xθ‖²/∂θ = −2Xᵀ(y − Xθ) = 0, which yields θ̂ = (XᵀX)⁻¹Xᵀy.`,
      `Layout convention errors are silent bugs. Numerator layout (standard in ML): ∂y/∂x has shape of y. Denominator layout transposes. Mixing conventions within a derivation produces a gradient with the right values but the wrong shape — the update step applies it in the wrong direction. Finite-difference checks catch magnitude errors but not transposition errors if you check only the norm.`,
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
    takeaway: `The gradient of a scalar loss with respect to any weight matrix is the outer product of the upstream gradient and the input activation. That one pattern covers every fully-connected layer. Layout convention errors are the most common silent bug in custom backprop — they pass shape checks but produce gradients in the wrong direction.`,
  },
  {
    id: 'convex_optimization',
    interactiveId: 'convex_optimization_viz',
    title: 'Convex Optimization & Gradient Descent',
    subtitle: 'Convergence guarantees, learning rate, momentum, Adam',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['optimisation', 'gradient descent', 'Adam', 'convergence'],
    summary: `Knowing the gradient direction is necessary but not sufficient to train a model efficiently. You also need to know how large a step to take. Take too large a step and you overshoot the minimum; take too small a step and you converge in geological time. The maximum safe learning rate is determined by the loss landscape's smoothness: η ≤ 1/L where L is the Lipschitz constant of the gradient. A loss that diverges on the first step means you exceeded this bound. For convex smooth losses, gradient descent converges at O(1/t); for strongly convex losses it converges exponentially at rate ρ = (κ−1)/(κ+1) where κ is the condition number. Mini-batch SGD introduces gradient noise that prevents exact convergence with a fixed learning rate but also escapes saddle points and sharp minima. Momentum damps the oscillation perpendicular to the valley that makes vanilla gradient descent zigzag. Adam maintains per-parameter adaptive learning rates, effectively approximating preconditioning, which is why it converges fast on ill-conditioned problems — but its speed comes at the cost of converging to sharper minima that generalise less well.`,
    keyPoints: [
      `Maximum safe learning rate is η = 1/L where L is the smoothness constant (Lipschitz constant of the gradient). Exceeding 1/L means each gradient step overshoots. The loss can then increase monotonically with each step. Reducing η by 10× and retrying is always the first diagnostic for a diverging loss.`,
      `Condition number κ = L/μ for strongly convex losses: convergence rate ρ = (κ−1)/(κ+1). Every step reduces the gap to the optimum by this factor. κ = 1000 means ρ ≈ 0.998 — you need ~2000 steps to reduce the error by 100×. Preconditioning (reducing κ by standardising features or using adaptive optimisers) is the right fix, not just reducing learning rate.`,
      `SGD noise prevents exact convergence with a fixed learning rate. Iterates bounce in a noise ball of radius O(η·σ/μ) around the optimum. Learning rate decay (η_t ∝ 1/√t) shrinks this ball over time and allows eventual convergence. Without decay, SGD never settles — useful for escaping sharp minima, bad for final fine-tuning.`,
      `Momentum accumulates velocity v ← βv − η∇f, θ ← θ + v. It reduces oscillation perpendicular to the loss valley and accelerates progress along it. Convergence rate improves from O(κ) steps to O(√κ) steps. Nesterov momentum evaluates the gradient at the look-ahead position θ + βv — same O(√κ) rate with a smaller constant.`,
      `Adam pitfall: Adam converges faster than SGD early in training because adaptive learning rates approximate preconditioning — but it tends to converge to sharper minima. Sharp minima generalise worse because small perturbations to weights cause large loss increases. Common production pattern: use Adam to reach a good basin quickly, then switch to SGD with small learning rate to settle into a flatter minimum.`,
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
    takeaway: `The condition number of the loss landscape — not the learning rate — determines how fast you converge. Standardising features and using adaptive optimisers attack the same underlying problem: reducing the effective condition number. The learning rate is a secondary tuning dial once the landscape is reasonably well-conditioned.`,
  },
  {
    id: 'hypothesis_testing',
    title: 'Hypothesis Testing',
    subtitle: 'p-values, Type I/II errors, t-test, chi-squared, multiple comparisons',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['statistics', 'hypothesis testing', 'p-values', 'A/B testing'],
    summary: `A business needs to grow, so it tests new features. The status quo is always the null hypothesis — you do not change what is working without evidence. A new feature might perform better by pure chance. You need to quantify: is this result explainable by luck alone? The p-value answers exactly this: it is the probability of observing a result at least as extreme as the one measured, if the null hypothesis were true. A small p-value means the data is hard to explain by luck alone — grounds to reject the null. It does not prove the alternative is true, and it is not the probability that the null hypothesis is true. Confusing p-value with posterior probability of a hypothesis is the most consequential statistical misunderstanding in applied science. Type I error (false positive) is rejecting the null when it is true; Type II error (false negative) is failing to reject the null when it is false. With large samples, even a 0.001% difference achieves p < 0.001 — statistically significant but practically worthless. Effect size must always accompany p-values. Running 100 tests at α = 0.05 gives 5 expected false positives — multiple comparisons inflate the false discovery rate and require correction.`,
    keyPoints: [
      `A p-value is not the probability that the null hypothesis is true. It is P(observing data this extreme | null is true). The failure mode — treating p = 0.03 as "97% confident the alternative is true" — is the prosecutor's fallacy applied to statistics. The correct statement is: "if the null were true, results this extreme would occur 3% of the time."`,
      `Effect size matters more than statistical significance at large n. With n = 1,000,000, a 0.001% conversion difference achieves p < 0.001 — statistically significant but practically irrelevant. Always report Cohen's d, odds ratio, or percent lift alongside p-values. Statistical significance answers "is this effect non-zero?"; effect size answers "is this effect worth caring about?"`,
      `Power = 1 − β = probability of correctly detecting a real effect. Power is determined before running the test by choosing sample size. Low power means you will miss real effects and incorrectly conclude no effect exists. The sample size formula n = 2(z_{α/2} + z_β)²σ²/δ² requires specifying the minimum detectable effect δ before collecting data — not after seeing results.`,
      `Multiple comparisons: running k tests each at α = 0.05 gives expected 0.05k false positives. Bonferroni corrects by using α/k per test — conservative, controls family-wise error rate. Benjamini-Hochberg controls false discovery rate at α and is less conservative, preferred for exploratory feature selection where some false positives are acceptable.`,
      `Peeking bias: stopping an A/B test as soon as p < 0.05 inflates Type I error far above the nominal α. The p-value is only valid at the pre-specified stopping time. Sequential testing methods — always-valid p-values, spending functions — allow continuous monitoring without inflating the false positive rate.`,
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
    takeaway: `A p-value measures how surprising the data would be if the null were true — not the probability that any hypothesis is true. Never ship or kill a feature on a p-value alone. You need effect size to know if the difference matters, power to know if a null result means anything, and correction for multiplicity if you ran more than one test.`,
    interactiveId: 'hypothesis_testing_viz',
  },
  {
    id: 'mle_map',
    title: 'MLE vs MAP Estimation',
    subtitle: 'Likelihood, log-likelihood, MAP as regularised MLE',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['MLE', 'MAP', 'regularisation', 'Bayesian'],
    summary: `You have data and you need to fit a model. The naive approach is to find the parameters that best explain the data — maximum likelihood estimation (MLE). But with limited data, MLE overfits: it finds parameters that explain the training data perfectly while making wild predictions on new data. The fix is regularisation: penalise the loss for parameter values that seem implausible. But where do the regularisation terms come from, and how should you choose them? Maximum A Posteriori (MAP) estimation gives a principled answer. MAP finds the parameters most probable given the data: θ̂_MAP = argmax P(θ|data) ∝ P(data|θ) × P(θ). The prior P(θ) encodes your belief about parameters before seeing data. Adding the log prior to the log-likelihood is identical to adding a regularisation term. A Gaussian prior on θ gives L2 regularisation (Ridge); a Laplace prior gives L1 regularisation (Lasso). This reveals that regularisation is not an ad hoc trick — it is a statement about what you believe the model should look like before seeing data. As n → ∞, the data overwhelms the prior and MAP converges to MLE — regularisation should be reduced as sample size grows.`,
    keyPoints: [
      `MLE: θ̂_MLE = argmax_θ Σᵢ log p(xᵢ|θ). Log-likelihood converts products to sums and avoids underflow. For Gaussian data, MLE gives the sample mean (unbiased) and divides by n rather than n−1 for variance (biased). MLE is not always unbiased — it is consistent (converges to the truth as n → ∞) but can be biased in finite samples.`,
      `MAP = MLE + log prior. Every regularised ML algorithm has a Bayesian MAP interpretation. You were already encoding prior beliefs through your regularisation choices — MAP just makes those beliefs explicit. The prior is not a Bayesian add-on; it is the thing you were doing all along, unnamed.`,
      `Gaussian prior N(0, τ²I) on weights produces L2 regularisation: the log prior is −(1/2τ²)‖θ‖², which adds λ‖θ‖² to the loss with λ = 1/(2τ²). The regularisation strength encodes confidence in the prior — large λ means you are confident weights should be near zero, small λ means a diffuse prior.`,
      `Laplace prior on weights produces L1 regularisation: the Laplace distribution has a sharp peak at zero and heavier tails than Gaussian. It encodes the belief that most weights should be exactly zero with a few allowed to be large — the right prior for genuinely sparse problems like genomics or text feature selection.`,
      `As n → ∞, the likelihood dominates and MAP → MLE. This means regularisation should shrink as training data grows — tuning λ via cross-validation on a large dataset naturally selects smaller values. A fixed large λ applied to a large dataset underfits unnecessarily.`,
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
    takeaway: `Every regularised ML model is a MAP estimate with an implicit prior. L2 says weights are probably small and Gaussian. L1 says most weights are probably exactly zero. Choosing your regulariser is not a numerical trick — it is a statement about what you believe the model should look like before seeing any data.`,
  },
  {
    id: 'bayesian_inference',
    title: 'Bayesian Inference',
    subtitle: 'Prior, likelihood, posterior, conjugate priors, MCMC',
    difficulty: 'advanced',
    estimatedMin: 34,
    tags: ['Bayesian', 'posterior', 'MCMC', 'conjugate priors'],
    summary: `MLE and MAP give you a single best-guess set of parameters. But a single point estimate throws away everything you know about parameter uncertainty — and uncertainty is precisely what matters when data is scarce, when you need calibrated predictions, or when you are making sequential decisions. Bayesian inference maintains a full probability distribution over parameters: the posterior P(θ|data) ∝ P(data|θ)P(θ). This distribution captures what you know and what you do not know. The problem is the denominator: P(data) = ∫ P(data|θ)P(θ)dθ. This integral marginalises over all possible parameters — and in high dimensions it is almost never tractable. Conjugate priors are special cases where the posterior is in the same family as the prior, giving closed-form updates without any integration. When conjugacy fails, you have two options: MCMC samples from the posterior without computing the denominator by exploiting the fact that acceptance ratios cancel it out; variational inference approximates the posterior with a tractable family by minimising KL divergence. Both approaches trade exactness for tractability in different ways.`,
    keyPoints: [
      `Posterior ∝ likelihood × prior. The normalising constant P(data) = ∫ P(data|θ)P(θ)dθ is the marginal likelihood — rarely tractable because the integral is over all possible parameter values. MCMC exploits the fact that acceptance ratios in Metropolis-Hastings cancel this constant, making exact posterior sampling possible without computing it.`,
      `Conjugate prior: Beta-Binomial, Dirichlet-Multinomial, Normal-Normal, Gamma-Poisson. Conjugacy gives closed-form sequential updates: observe data, update the hyperparameters algebraically. Beta(α, β) updated with k successes from n trials gives Beta(α+k, β+n−k). α and β act as pseudo-counts. Conjugate updates are the only Bayesian inference that scales to real-time streaming.`,
      `Posterior predictive P(x_new|X) = ∫ P(x_new|θ)P(θ|X)dθ averages predictions over the full posterior rather than using a point estimate. It gives wider, more honest uncertainty than a MAP prediction. The posterior predictive is what a calibrated Bayesian model actually reports — not the mode of the posterior.`,
      `MCMC: Metropolis-Hastings proposes θ' from a proposal q(θ'|θ) and accepts with probability min(1, P(θ'|X)q(θ|θ')/[P(θ|X)q(θ'|θ)]). The ratio of posteriors cancels the intractable denominator P(X). Diagnosis: R-hat ≈ 1 across multiple chains, effective sample size (ESS) large relative to chain length, trace plots that look like fuzzy caterpillars.`,
      `Variational inference approximates the posterior P(θ|X) with a tractable distribution q(θ) by minimising KL(q‖P(θ|X)) = maximising the ELBO. It is faster than MCMC but biased: reverse KL causes q to collapse to a single mode of the true posterior, missing multimodality. VAEs use variational inference where the encoder is the approximate E-step.`,
    ],
    checkQuestions: [
      {
        q: `In a Bayesian A/B test for CTR, variant A shows 50 clicks from 200 impressions, variant B shows 70 clicks from 200 impressions. Using Beta(1,1) prior for both, compare the posteriors and compute P(CTR_B > CTR_A | data).`,
        a: `Beta(1,1) is uniform. Posterior A: Beta(1+50, 1+150) = Beta(51,151). Posterior B: Beta(1+70, 1+130) = Beta(71,131). Posterior mean A = 51/202 ≈ 0.252; posterior mean B = 71/202 ≈ 0.352. P(CTR_B > CTR_A | data) requires integrating the joint posterior — computed numerically (scipy.stats.beta) or via Monte Carlo: sample from both posteriors and compute fraction where B > A. This gives a direct probability statement ("B is better with 97% probability") unlike frequentist hypothesis testing which only says "the difference is unlikely under H₀."`
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
    takeaway: `Bayesian inference gives you a distribution over parameters, not a point. That distribution is the right answer when calibrated uncertainty matters — for small data, sequential updating, or uncertainty-aware decisions. The cost is that the posterior is almost never tractable in closed form, which is the entire reason MCMC and variational inference exist.`,
  },
  {
    id: 'em_algorithm',
    title: 'EM Algorithm',
    subtitle: 'Latent variables, E-step/M-step, GMM, convergence',
    difficulty: 'advanced',
    estimatedMin: 28,
    tags: ['EM', 'GMM', 'latent variables', 'expectation maximisation'],
    summary: `Some data-generating processes have hidden structure — which cluster a point belongs to, which topic a document is about, which hidden state a sequence is in. You want to learn a model of the observed data, but the hidden variables make direct maximum likelihood intractable: log P(X|θ) = log Σ_Z P(X,Z|θ) is a log of a sum, which cannot be simplified into a sum of logs. Direct gradient ascent would require computing P(Z|X,θ) at every step, which itself depends on θ — a circular dependency with no closed-form solution. EM breaks this circle by alternating between two tractable steps. The E-step treats the hidden variables as if they were observed: it computes the expected complete-data log-likelihood using the current best guess of θ, filling in the hidden variables with their posterior distribution. The M-step maximises this expected log-likelihood over θ as if the hidden variables were known. EM is guaranteed to monotonically increase the marginal likelihood at every iteration — it cannot degrade — but it converges to a local optimum, not necessarily global. Gaussian Mixture Models are the canonical example: E-step assigns soft cluster responsibilities, M-step updates cluster parameters. EM generalises immediately to any exponential family model with latent variables.`,
    keyPoints: [
      `Why direct maximisation fails: log Σ_Z P(X,Z|θ) cannot be decomposed because the log is outside the sum. Taking the gradient gives an expression involving P(Z|X,θ), which depends on θ in a complex way — no closed-form solution exists for most models. EM avoids this by working with the complete-data log-likelihood log P(X,Z|θ), which does factorise cleanly.`,
      `E-step: compute Q(θ|θ_old) = E_{Z|X,θ_old}[log P(X,Z|θ)]. Replace the unknown Z with its posterior distribution under the current θ — this is the "expectation" in Expectation-Maximisation. For exponential family models, the E-step reduces to computing sufficient statistics weighted by the posterior over Z.`,
      `M-step: θ_new = argmax_θ Q(θ|θ_old). With Z treated as known (but uncertain), the complete-data log-likelihood factorises and maximisation has a closed form for exponential family models. The M-step is just weighted maximum likelihood.`,
      `EM for GMM: E-step computes soft responsibilities rᵢₖ = P(zᵢ = k | xᵢ, θ) — how much does cluster k explain point i? M-step updates μₖ, Σₖ, πₖ as responsibility-weighted means and covariances. This is soft k-means: points are not hard-assigned to clusters but distributed across them according to proximity.`,
      `EM converges to local optima. Different initialisations yield different solutions. Standard practice: run EM 10+ times with random restarts, keep the solution with the highest marginal log-likelihood. Singularity problem in GMM: a cluster can collapse to a single data point with Σₖ → 0, giving infinite likelihood — add a minimum variance floor or use a Bayesian GMM with an Inverse-Wishart prior.`,
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
    takeaway: `EM converts one intractable optimisation — maximising the marginal likelihood when variables are hidden — into a sequence of tractable steps by alternating between filling in the hidden variable distribution and maximising the resulting expected log-likelihood. The moment you have latent variables and a factorising complete-data likelihood, EM is the natural algorithm.`,
  },
  {
    id: 'concentration_inequalities',
    title: 'Concentration Inequalities',
    subtitle: 'Markov, Chebyshev, Hoeffding — generalisation bounds',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['concentration', 'generalisation', 'PAC learning', 'bounds'],
    summary: `A trained model performs well on the training set. The fundamental question of ML theory is: when can you trust that it also performs well on unseen data? You need to bound the generalisation gap — the difference between training error and true error. The naive concern is that a sufficiently complex model can fit any training set by memorisation, with no guarantee on new data. Concentration inequalities formalise how quickly sample averages converge to their expectations as a function of n. Markov's inequality requires only a finite mean; Chebyshev requires finite variance; Hoeffding requires bounded support but gives exponentially tight bounds — each stronger assumption buys a tighter guarantee. Combining Hoeffding with the union bound over a hypothesis class gives the PAC learning bound: with high probability, every hypothesis in a finite class has generalisation gap at most O(√(log|H|/n)). The VC dimension extends this to infinite hypothesis classes by replacing log|H| with a measure of effective capacity. Modern overparameterised networks have VC dimension far exceeding their training set size yet still generalise — the classical bounds are vacuous for them, and the theory is being rebuilt around implicit regularisation and PAC-Bayes.`,
    keyPoints: [
      `Markov inequality: P(X ≥ t) ≤ E[X]/t for non-negative X. It requires only a finite mean — so it works for heavy-tailed distributions where Chebyshev fails. The cost is looseness: Chebyshev is typically 10× tighter when variance is finite. Markov is the fallback of last resort.`,
      `Chebyshev: P(|X − μ| ≥ t) ≤ Var(X)/t². Requires finite variance, gives polynomial decay in t. This is the mechanism behind the weak law of large numbers: sample variance Var(X)/n → 0 as n → ∞, concentrating the sample mean around μ.`,
      `Hoeffding's inequality: for bounded iid Xᵢ ∈ [aᵢ, bᵢ], P(|X̄ − μ| ≥ ε) ≤ 2 exp(−2n²ε²/Σ(bᵢ−aᵢ)²). Exponential decay — the probability of a large deviation shrinks exponentially fast with n. Requires bounded support; does not apply to unbounded losses (regression with Gaussian noise). For binary classification losses in [0,1], it applies directly.`,
      `Union bound + Hoeffding gives the PAC generalisation bound: P(sup_h |R̂(h) − R(h)| ≥ ε) ≤ 2|H|exp(−2nε²). With probability 1−δ, all hypotheses have generalisation gap ≤ √(log(2|H|/δ)/(2n)). The gap shrinks as O(1/√n) — doubling data improves the bound by √2; squaring the hypothesis class adds only a constant to the log.`,
      `Double descent: modern overparameterised networks have VC dimension far exceeding n yet generalise in practice. Classical bounds are vacuous (gap > 1). The true regularisation comes from gradient descent implicitly finding the minimum-norm interpolating solution — a bias not captured by VC dimension. PAC-Bayes bounds over posteriors on hypotheses give tighter results for networks trained with SGD.`,
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
    takeaway: `Generalisation gap shrinks as O(√(log(model complexity)/n)). Doubling data shrinks the bound by √2. Halving model class size only subtracts a constant from the log term. More data beats smaller models in almost every practical regime — but for modern overparameterised networks, the classical bounds are vacuous and the real regularisation comes from the implicit bias of gradient descent.`,
  },
  {
    id: 'monte_carlo',
    interactiveId: 'monte_carlo_viz',
    title: 'Monte Carlo Methods',
    subtitle: 'Sampling, importance sampling, MCMC, variance reduction',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['Monte Carlo', 'sampling', 'MCMC', 'importance sampling'],
    summary: `Many quantities in ML require computing integrals: posterior expectations, normalising constants, policy gradients. Numerical quadrature (grids of evaluation points) is exact in low dimensions but requires Nᵈ points in d dimensions — for d = 100, this is astronomically infeasible. Monte Carlo avoids the curse of dimensionality by approximating E_p[f(X)] ≈ (1/N)Σ f(xᵢ) where xᵢ ~ p. The error is σ/√N regardless of dimension — only the variance of f under p matters, not the number of dimensions. This is the fundamental reason Monte Carlo dominates in high-dimensional integration: it trades exponential cost in dimension for 1/√N convergence in sample size. Importance sampling extends this to cases where sampling from p is hard: draw from a proposal q and reweight by p(x)/q(x). The danger is weight explosion — if q has lighter tails than p, some weights become enormous and the estimator becomes high-variance. MCMC constructs a Markov chain whose stationary distribution is the target, enabling sampling from posteriors known only up to a normalising constant by exploiting the cancellation of that constant in acceptance ratios.`,
    keyPoints: [
      `Monte Carlo error σ/√N is independent of dimension. Numerical quadrature in d dimensions needs Nᵈ points for the same accuracy — exponential in d. Monte Carlo needs the same N regardless of d. This dimension-independence is the entire justification for using Monte Carlo in variational inference, policy gradients, and any high-dimensional expectation.`,
      `Importance sampling: E_p[f(X)] = E_q[f(X) · p(X)/q(X)]. Draw xᵢ ~ q, compute weighted average with weights w(x) = p(x)/q(x). This allows estimating expectations under p without ever sampling from p. The requirement: q must have support covering wherever f(x)p(x) is large.`,
      `IS weight explosion: if q has lighter tails than p, weights p(x)/q(x) become enormous in the tails — producing an unbiased but astronomically high-variance estimator. Effective sample size ESS = (Σwᵢ)²/Σwᵢ² diagnoses this: ESS much smaller than N means a few samples dominate the estimate. The fix: use a heavier-tailed proposal, or use self-normalised IS.`,
      `MCMC: Metropolis-Hastings proposes θ' from q(θ'|θ), accepts with min(1, p(θ')q(θ|θ')/[p(θ)q(θ'|θ)]). The ratio p(θ')/p(θ) cancels the normalising constant — you only need to evaluate the unnormalised posterior. This is why MCMC works for Bayesian inference where the posterior is only known up to the intractable marginal likelihood.`,
      `Policy gradient in RL uses the log-derivative trick: ∇E[R(τ)] = E[R(τ) ∇log π(τ)]. This converts a gradient through an expectation into an expectation of a gradient — computable by Monte Carlo rollouts. Variance is high because trajectory returns vary enormously. Baseline subtraction E[(R(τ) − b) ∇log π(τ)] is unbiased (E[b ∇log π] = 0) but drastically reduces variance.`,
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
    takeaway: `Monte Carlo error scales as O(1/√N) regardless of dimension. That dimension-independence is the entire reason Monte Carlo dominates variational inference, policy gradients, and any high-dimensional expectation. Variance of the integrand, not dimension, determines how many samples you need.`,
  },
  {
    id: 'sampling_distributions',
    title: 'Sampling Distributions & CLT',
    subtitle: 'CLT, standard error, confidence intervals, bootstrap',
    difficulty: 'foundational',
    estimatedMin: 24,
    tags: ['CLT', 'confidence intervals', 'bootstrap', 'standard error'],
    summary: `You collect a sample and compute a statistic — a mean, a proportion, an AUC. That statistic is itself random: a different sample would give a different value. To make valid inferences you need to know how much that statistic varies across samples — its sampling distribution. Without this, you cannot distinguish a real finding from sampling noise. For the sample mean, the Central Limit Theorem (CLT) solves this completely: regardless of the underlying distribution, the sample mean is approximately Normal with mean μ and variance σ²/n, as long as n is large enough and the population variance is finite. This is why Normal-theory inference works on almost any dataset — you are usually operating on means, not raw samples, and means are Normal by the CLT. The standard error SE = σ/√n quantifies estimation uncertainty: halving SE requires quadrupling sample size, which is why going from "rough estimate" to "precise estimate" is expensive. The bootstrap replaces analytical CLT calculations with resampling: it works for any statistic with no closed-form sampling theory, and it is the universal fallback when you cannot derive a standard error formula.`,
    keyPoints: [
      `CLT: √n(X̄ − μ)/σ →_d N(0,1) as n → ∞. The result does not depend on the underlying distribution — only that it has finite variance. This is why t-tests and z-tests work broadly: they operate on sample means, not raw data, and sample means are Normal regardless of the raw distribution.`,
      `Standard error SE = σ/√n. Halving SE requires 4× the data. This 1/√n convergence rate is slow — going from SE = 0.1 to SE = 0.01 requires 100× more data. It is the fundamental cost of precision in statistics and determines why clinical trials and large-scale A/B tests are expensive.`,
      `Confidence interval interpretation: a 95% CI does not mean "95% probability the parameter is in this interval." The parameter is fixed; the interval is random. The correct statement: if you repeated the experiment many times and built a 95% CI each time, 95% of those intervals would contain the true parameter. For a probability statement about the parameter, you need a Bayesian credible interval.`,
      `Bootstrap: resample n points with replacement B times (B = 1000 is typical), compute the statistic on each resample, take the 2.5th and 97.5th percentiles as the 95% CI. Works for any statistic — AUC, median, Spearman correlation, SHAP values — anything without a closed-form SE formula. It fails for statistics sensitive to extremes (max, min) and can be unreliable for heavy-tailed distributions.`,
      `CLT convergence speed depends on tail behaviour. For near-Gaussian data, n ≥ 30 is usually sufficient. For heavy-tailed distributions (Pareto, log-normal), n may need to be 10,000+ before the Normal approximation holds. Always check kurtosis before using CLT-based inference on financial or web data.`,
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
    takeaway: `The CLT makes sample means approximately Normal regardless of the underlying distribution — that is the entire foundation of classical inference. But the required sample size depends on tail behaviour: n = 30 works for near-Gaussian data, but power-law distributions may need n > 10,000. Always check whether the CLT approximation is valid before trusting the standard error.`,
  },
]
