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
      `**You almost never have P(hypothesis|data) directly.** You have P(data|hypothesis) from your model. Bayes' theorem is the exact rule for reversing that: posterior = likelihood × prior / evidence. The prior is not optional noise — it is half the calculation. Drop it and you get the prosecutor's fallacy: treating P(evidence|innocent) as P(innocent|evidence).`,
      `**The law of total probability P(B) = Σ P(B|Aᵢ)P(Aᵢ) is how you compute the denominator in Bayes — it marginalises out the unknown hypothesis.** When the hypothesis space is continuous, this integral is usually intractable, which is the core computational problem of Bayesian inference.`,
      `**Conditional independence A ⊥ B | C is a fundamentally different statement from marginal independence A ⊥ B.** Cough and fever are correlated in the general population — but given the diagnosis "flu," they are conditionally independent: the disease explains both symptoms, so knowing one gives no extra signal about the other. Naïve Bayes exploits this: it assumes conditional independence given the class label, which can hold even when features are marginally correlated.`,
      `**Mutually exclusive events are always dependent when both have positive probability: P(A∩B) = 0, but P(A)P(B) > 0.** Knowing A occurred means B definitely did not. Exclusivity and independence are opposites — not related concepts.`,
      `**Laplace smoothing prevents any unseen word from zeroing out the entire posterior in a Naïve Bayes classifier.** Without it, P(new_word|class) = 0, and the product over all words collapses to zero regardless of other evidence. Smoothing adds a pseudo-count to every word — it is MAP estimation with a Dirichlet prior.`,
    ],
    checkQuestions: [
      {
        q: `You roll two fair dice. Event A = 'first die shows 6', Event B = 'sum equals 7'. Are A and B independent? Compute P(A), P(B), P(A∩B) and verify your answer.`,
        options: [
          `A) P(A)=1/6, P(B)=1/6, P(A∩B)=1/36. Check: P(A)·P(B)=1/36=P(A∩B), so A and B ARE independent. This is non-obvious: given first die=6, the only way sum=7 is second die=1, probability 1/6 = P(B), confirming independence.`,
          `B) P(A) = 1/6 (only one face of die 1 is 6). P(B) = 6/36 = 1/6 (pairs summing to 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1)). P(A∩B) = P(first=6, second=1) = 1/36. Check: P(A)·P(B) = (1/6)·(1/6) = 1/36 = P(A∩B). Therefore A and B ARE independent. Intuition: given that the first die is 6, the only way to get sum 7 is if the second die is 1 — probability 1/6. This equals P(B) = 1/6, confirming independence. Note: this is a non-obvious result — most people expect the sum constraint to create dependence, but the uniform distribution of the second die exactly compensates.`,
          `C) P(A)=1/6, P(B)=5/36, P(A∩B)=1/36. Check: P(A)·P(B)=5/216 ≠ 1/36, so A and B are NOT independent. The sum constraint means knowing the first die restricts which second-die outcomes count toward sum=7.`,
          `D) P(A)=1/6, P(B)=1/6, P(A∩B)=1/36, so P(A)·P(B)=1/36=P(A∩B). However A and B are NOT independent because the events share a structural constraint — any constraint linking two dice must create dependence regardless of the numerical check.`,
        ],
        answer: `B`,
      },
      {
        q: `You have a biased coin: P(H)=0.7. You flip it 3 times. What is the probability of getting exactly 2 heads, and why does the binomial formula give the right answer?`,
        options: [
          `A) P(exactly 2H) = C(3,2) × 0.7² × 0.3¹ = 3 × 0.49 × 0.3 = 0.441. The binomial formula works because: (1) each flip is independent (knowing one flip result doesn't change P(H) for others), (2) each flip has the same P(H)=0.7 (identical distribution). C(3,2)=3 counts the number of distinct orderings with exactly 2 heads: HHT, HTH, THH — each has probability 0.7²×0.3 = 0.147. Since these orderings are mutually exclusive (they cannot all happen in one sequence of 3 flips), we add them: 3×0.147 = 0.441. If the flips were not independent or not identically distributed, the binomial formula would give the wrong answer.`,
          `B) P(exactly 2H) = 0.7² × 0.3¹ = 0.147. The binomial formula is not needed here — since each flip is independent, you multiply the probabilities of each outcome directly. The C(3,2) factor would overcount by including indistinguishable orderings of the flips.`,
          `C) P(exactly 2H) = C(3,2) × 0.7² × 0.3¹ = 0.441. However, the binomial formula only gives the right answer when P(H)=0.5. For a biased coin with P(H)=0.7, the correct approach is to sum probabilities over all sequences with exactly 2 heads, weighting each differently based on the order.`,
          `D) P(exactly 2H) = C(3,2) × 0.7³ × 0.3¹ = 3 × 0.343 × 0.3 = 0.309. The binomial formula works here because independence and identical distribution both hold. We use 0.7³ because there are 3 flips total and each contributes a factor of P(H).`,
        ],
        answer: `A`,
      },
      {
        q: `In a medical test, P(Disease)=0.01, P(+|Disease)=0.95, P(+|No Disease)=0.05. You test positive. What is P(Disease|+)? What does this imply for interpreting medical test results?`,
        options: [
          `A) P(+) = 0.95×0.01 + 0.05×0.99 = 0.059. P(D|+) = 0.0095/0.059 ≈ 16.1%. The 95% sensitivity dominates — a positive result is mostly reliable because sensitivity is high. The 5% false positive rate is too small to matter when the test is this accurate.`,
          `B) P(D|+) ≈ 95% because the test has 95% sensitivity. A positive result directly reflects the sensitivity of the test — if the test is correct 95% of the time, then 95% of positives are true positives. Base rate only matters when sensitivity is below 50%.`,
          `C) P(+) = 0.95×0.01 + 0.05×0.99 = 0.059. P(D|+) = 0.0095/0.059 ≈ 16.1%. The false positive rate of 5% applied to 99% of healthy people produces 4.95× more false positives than true positives, so even an excellent test yields mostly false positives for a rare disease. Implication: sequential testing and clinical judgment are needed; population screening for rare conditions is problematic.`,
          `D) P(+) = P(+|D)P(D) + P(+|no D)P(no D) = 0.95×0.01 + 0.05×0.99 = 0.0095 + 0.0495 = 0.059. P(D|+) = P(+|D)·P(D)/P(+) = 0.0095/0.059 ≈ 0.161 = 16.1%. Despite a 95% sensitivity test, a positive result only means a 16% chance of disease. This is the base rate neglect problem: because P(Disease)=0.01 is very low, most positive tests come from the large healthy population (99%) with its 5% false positive rate, overwhelming the true positives. Implication: for rare diseases, even excellent tests produce mostly false positives. Confirmatory tests, sequential testing, and clinical judgment are needed. This is why population-wide screening for rare conditions is problematic.`,
        ],
        answer: `D`,
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
      `**Expectation E[X] is the probability-weighted average — the long-run mean if you drew forever.** Linearity holds always: E[aX + bY] = aE[X] + bE[Y] regardless of whether X and Y are dependent. You can compute expectations of sums without knowing the joint distribution at all. This is why expected loss decomposes additively across samples.`,
      `**Variance Var(X) = E[X²] − (E[X])² measures how spread out outcomes are around the mean.** The gap E[X²] − (E[X])² is always non-negative by Jensen's inequality, and zero only when X is constant. Never report a model's mean prediction without its variance — the variance is what tells you whether that mean is trustworthy.`,
      `**Bernoulli(p) has variance p(1−p), maximised at p = 0.5.** A perfectly balanced binary classification problem has maximum label uncertainty and requires the most data to learn from — variance tells you how much information each label carries.`,
      `**Poisson(λ) has mean = variance = λ.** If your data's sample variance greatly exceeds the sample mean, the Poisson model is wrong — that is overdispersion, caused by unmodeled heterogeneity or clustering. Use Negative Binomial instead.`,
      `**Exponential(λ) is the only continuous memoryless distribution: P(X > s+t | X > s) = P(X > t).** The expected remaining wait time is always 1/λ regardless of how long you have already waited. This is why it models hardware failures and server inter-arrival times, but not human lifespan (mortality risk increases with age).`,
      `**Log-Normal: if log(X) is Normal, then X is always positive with a heavy right tail.** It arises when a quantity is the product of many independent random factors — each multiplicative step adds to the log, and the CLT makes the log Normal. Revenue, file sizes, and web latency are log-normal; fitting a Gaussian to them badly underestimates tail probabilities.`,
    ],
    checkQuestions: [
      {
        q: `A discrete random variable X has PMF P(X=k) = C × (1/2)^k for k=1,2,3,... Find C and compute E[X].`,
        options: [
          `A) C=1/2, E[X]=4. Find C: Σ C·(1/2)^k = C·1 = 1, so C=1/2. But since the sum starts at k=1, we use Σ_{k=1}^∞ (1/2)^k = 1, so C=1/2. E[X] = Σ k·(1/2)^{k+1} = 4.`,
          `B) C=1, E[X]=4. Find C: Σ C·(1/2)^k from k=1 equals C·1=1, giving C=1. E[X]=Σ k·(1/2)^k. Using Σ k·r^k = r/(1-r)² at r=1/2: E[X]=(1/2)/(1/4)=2. But this underestimates because the sum starts at k=1, not k=0, so we add 1: E[X]=4.`,
          `C) Find C: Σ_{k=1}^∞ C·(1/2)^k = C·(1/2)/(1−1/2) = C·1 = 1, so C=1. E[X] = Σ_{k=1}^∞ k·(1/2)^k. Using the formula Σ_{k=1}^∞ k·r^k = r/(1−r)² for |r|<1 with r=1/2: E[X] = (1/2)/(1/2)² = (1/2)/(1/4) = 2. Sanity check: the distribution puts most weight near small k (P(X=1)=1/2, P(X=2)=1/4, etc.), so E[X]=2 makes sense — the mean is just one step above the most probable value.`,
          `D) C=2, E[X]=2. Find C: Σ_{k=1}^∞ C·(1/2)^k = 1 requires C=2 since Σ(1/2)^k = 1/2. E[X] = Σ k·2·(1/2)^k = 2·(1/2)/(1/4) = 4.`,
        ],
        answer: `C`,
      },
      {
        q: `X ~ N(0,1) and Y = X². What is the distribution of Y, and what is E[Y]?`,
        options: [
          `A) Y = X² where X ~ N(0,1) follows a chi-squared distribution with 1 degree of freedom: Y ~ χ²(1). This is because the chi-squared distribution is defined as the sum of squares of independent standard normal variables. E[Y] = E[X²] = Var(X) + (E[X])² = 1 + 0 = 1 (using Var(X) = E[X²] − (E[X])²). More directly: E[X²] = ∫_{-∞}^{∞} x²·(1/√(2π))·e^{-x²/2}dx = 1 (this integral equals the variance of N(0,1) since E[X]=0). The χ²(1) distribution has mean k=1 (where k is degrees of freedom), confirming E[Y]=1.`,
          `B) Y = X² where X ~ N(0,1) follows a half-normal distribution, since squaring removes the sign. E[Y] = E[|X|] = √(2/π) ≈ 0.798. The half-normal is the natural distribution for the absolute value of a standard normal, and squaring a half-normal gives a scaled chi-squared.`,
          `C) Y = X² follows a F-distribution with (1,1) degrees of freedom, since it is a ratio of chi-squared variables. E[Y] = 1/(1-2) which is undefined — the F(1,1) distribution has an infinite mean because of its heavy tails.`,
          `D) Y = X² follows a log-normal distribution because taking a nonlinear function of a normal variable produces a log-normal. E[Y] = E[X²] = 2 because the second moment of N(0,1) equals the sum of variance and squared mean: σ² + μ² = 1 + 1 = 2.`,
        ],
        answer: `A`,
      },
      {
        q: `Why is E[f(X)] ≠ f(E[X]) in general? When does equality hold?`,
        options: [
          `A) E[f(X)] ≠ f(E[X]) because the expectation operator distributes over sums but not over arbitrary functions. Equality holds when f is monotone (strictly increasing or decreasing) since monotone functions preserve the ordering of outcomes. For non-monotone f like f(x)=x², the inequality direction depends on the sign of x.`,
          `B) E[f(X)] ≠ f(E[X]) whenever f is nonlinear, because the average of f(X) over the distribution of X is taken before applying f, whereas f(E[X]) applies f to the mean first. Equality holds only when X is symmetric — symmetric distributions ensure the Jensen gap cancels. For asymmetric X, E[f(X)] > f(E[X]) always.`,
          `C) E[f(X)] ≠ f(E[X]) in general because of sampling variability. Equality only holds in the limit n→∞ when the law of large numbers ensures the sample mean converges to E[X], at which point the continuous mapping theorem guarantees convergence of f(X̄) to f(μ).`,
          `D) Jensen's inequality: E[f(X)] ≥ f(E[X]) for convex f, and ≤ for concave f. Equality holds if and only if f is linear (affine: f(x) = ax+b) or X is a constant (no randomness). Example: E[X²] ≥ (E[X])² with equality only when Var(X) = 0. Practical implications: E[1/X] ≠ 1/E[X] (Jensen's, 1/x is convex for x>0); E[√X] ≤ √E[X] (concave); E[log X] ≤ log E[X] (concave). In ML: if you have E[loss(prediction)] ≠ loss(E[prediction]) — the expected loss of averaging predictions differs from the loss at the average prediction. For squared loss: E[(X−c)²] = Var(X) + (E[X]−c)² — minimised at c=E[X], showing that the optimal point estimator for squared loss is the mean.`,
        ],
        answer: `D`,
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
      `**Joint PDF f(x, y); marginal f_X(x) = ∫ f(x,y) dy; conditional f(x|y) = f(x,y)/f_Y(y).** The chain rule f(x,y) = f(x|y)f(y) says any joint distribution factors into conditionals — autoregressive language models are a direct application of this identity, decomposing P(sentence) into a product of P(next token | all previous tokens).`,
      `**Zero covariance does not imply independence.** If X ~ N(0,1) and Y = X², then Cov(X, Y) = 0 because X³ has zero expected value by symmetry — yet Y is entirely determined by X. Pearson correlation detects only linear relationships. Use mutual information or rank-based correlation (Spearman) when you actually need to check for general dependence.`,
      `**Covariance matrix Σ is always symmetric PSD: Σᵢⱼ = Cov(Xᵢ, Xⱼ), with variances on the diagonal.** Any algorithm that requires a valid covariance matrix — Gaussian models, Mahalanobis distance, PCA — will break if you pass a non-PSD matrix. Non-PSD matrices arise from more features than samples, floating point errors, or manually constructed correlation matrices with inconsistent entries.`,
      `**High correlation between two features (ρ = 0.95) makes XᵀX near-singular in linear regression, causing coefficients to become numerically unstable — small changes in training data produce large swings in estimated weights.** Ridge regression adds λI to make the matrix invertible. The correlation is not the problem; the near-singularity of XᵀX is.`,
      `**Multivariate Normal is entirely characterised by (μ, Σ).** Conditioning any subset on another subset stays Gaussian with closed-form mean and covariance — which is why Gaussian Processes and Kalman filters are tractable. No other multivariate family has this property.`,
    ],
    checkQuestions: [
      {
        q: `X and Y have joint PDF f(x,y) = 6x for 0 ≤ x ≤ y ≤ 1. Find the marginal PDFs and check if X and Y are independent.`,
        options: [
          `A) Marginal of X: f_X(x) = ∫_0^x 6x dy = 6x² for 0≤x≤1. Marginal of Y: f_Y(y) = ∫_0^1 6x dx = 3 for 0≤y≤1. Check: f_X(x)·f_Y(y) = 18x² ≠ 6x, so X and Y are NOT independent.`,
          `B) Marginal of X: f_X(x) = ∫_x^1 6x dy = 6x(1−x) for 0≤x≤1. Marginal of Y: f_Y(y) = ∫_0^y 6x dx = 3y² for 0≤y≤1. Check independence: if independent, f(x,y) = f_X(x)·f_Y(y) for all x,y. f_X(x)·f_Y(y) = 6x(1−x)·3y² = 18xy²(1−x). But f(x,y) = 6x. These are not equal (e.g., for x=0.5, y=0.8: f(0.5,0.8)=3 but f_X(0.5)·f_Y(0.8) = 6(0.5)(0.5)·3(0.64) = 1.5·1.92 = 2.88 ≠ 3). Therefore X and Y are NOT independent — makes sense since we need x ≤ y, so knowing Y=y restricts X to [0,y], changing X's conditional distribution.`,
          `C) Marginal of X: f_X(x) = ∫_x^1 6x dy = 6x(1−x). Marginal of Y: f_Y(y) = ∫_0^1 6x dx = 3 for 0≤y≤1. Since f_X(x)·f_Y(y) = 18x(1−x) ≠ 6x = f(x,y), X and Y are NOT independent. The constraint x ≤ y in the support alone guarantees dependence.`,
          `D) Marginal of X: f_X(x) = 6x(1−x). Marginal of Y: f_Y(y) = 3y². Product f_X(x)·f_Y(y) = 18xy²(1−x). Since this equals 6x only when (1−x)·3y²=1, which holds on a set of measure zero, X and Y are independent almost everywhere — effectively independent for practical purposes.`,
        ],
        answer: `B`,
      },
      {
        q: `Cov(X,Y) = 0 implies X and Y are independent: true or false? Give a precise counterexample.`,
        options: [
          `A) False. Zero covariance does not imply independence — it only implies linear decorrelation. Counterexample: Let X ~ Uniform(−1, 1) and Y = X². Cov(X,Y) = E[XY] − E[X]E[Y] = E[X³] − 0·E[X²] = 0 − 0 = 0 (since X has a symmetric distribution, all odd moments are zero). So Cov(X,Y) = 0. But Y is completely determined by X (Y = X²) — knowing X tells you exactly what Y is. They have a perfect nonlinear relationship but zero covariance. For independence, we would need P(X≤x, Y≤y) = P(X≤x)·P(Y≤y) for all (x,y), which clearly fails here. The implication goes only one way: independence ⟹ zero covariance (and for jointly Gaussian variables, zero covariance ⟹ independence).`,
          `B) True. Zero covariance is the standard definition of independence for continuous random variables. The only exception is discrete distributions with finite support, where the covariance can be zero while some higher-order dependence remains. For continuous distributions, Cov(X,Y) = 0 ⟺ independence.`,
          `C) False. Counterexample: X ~ N(0,1) and Y = |X|. Then Cov(X,Y) = E[X|X|] = 0 by symmetry, but Y is not independent of X since Y = |X| is a deterministic function of X. This shows that zero covariance is only sufficient for independence when X and Y are jointly Gaussian.`,
          `D) True for jointly Gaussian variables, false in general. Counterexample: X ~ Bernoulli(0.5) taking values ±1 and Y = X². Cov(X,Y) = E[X·X²] − E[X]E[X²] = E[X³] − 0 = 0. But P(Y=1|X=1)=1 ≠ P(Y=1)=1, so they are dependent. Independence requires Cov=0 AND all higher cumulants to vanish.`,
        ],
        answer: `A`,
      },
      {
        q: `In a multivariate Gaussian N(μ, Σ), what does the covariance matrix Σ control geometrically? How does Σ differ from a diagonal vs dense matrix?`,
        options: [
          `A) Σ determines only the marginal variances of each variable — the spread of each individual component. A diagonal Σ means all variances are equal; a dense Σ means variances differ across components. The shape and orientation of the joint density are determined by μ, not Σ, since μ shifts the entire distribution.`,
          `B) Σ controls the overall scale of the distribution. A diagonal Σ produces a spherical (isotropic) distribution regardless of the values on the diagonal. A dense Σ with large off-diagonal elements produces an elongated distribution, but the elongation direction is always aligned with the axis of the largest diagonal element.`,
          `C) Σ controls the shape and orientation of the probability density contours (ellipses in 2D, ellipsoids in higher dimensions). The contours of equal probability are: {x : (x−μ)ᵀΣ⁻¹(x−μ) = c}, which are ellipsoids with axes determined by the eigenvectors of Σ and radii proportional to the square roots of eigenvalues. Diagonal Σ: all off-diagonal elements are zero (zero covariance). The ellipsoid axes align with the coordinate axes — the variables are uncorrelated (and for Gaussians, also independent). Each variable's spread is σᵢᵢ. Dense Σ: nonzero off-diagonals indicate correlation. The principal axes of the ellipsoid are rotated relative to coordinates, by the eigenvectors. The eigenvectors are the directions of maximum and minimum variance (principal components). A large off-diagonal Σ₁₂ means x₁ and x₂ move together (positive correlation = elongated ellipse along the diagonal).`,
          `D) Σ controls the number of modes of the distribution. A diagonal Σ produces a unimodal spherical distribution, while a dense Σ with negative off-diagonal entries allows the distribution to become bimodal. The trace of Σ gives the total variance and the determinant gives the effective volume of probability mass.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Zero correlation rules out linear dependence only. Two variables can have ρ = 0 while one is a deterministic function of the other. If you need to check actual independence — not just linear independence — use mutual information or a rank-based test.`,
  },
  {
    id: 'information_theory',
    interactiveId: 'information_theory_viz',
    title: 'Information Theory for ML',
    subtitle: 'Entropy, cross-entropy, KL divergence, mutual information',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['entropy', 'KL divergence', 'cross-entropy', 'mutual information'],
    summary: `Training a classifier requires a loss function — a number that says how wrong the model is. The naive choice is squared error, but squared error treats all wrong predictions equally regardless of the model's stated confidence. What you actually want is a loss that penalises confident wrong answers far more than uncertain ones.

Cross-entropy H(p, q) = −Σ p(x) log q(x) does exactly this: it measures the average surprise your model q assigns to samples drawn from the true distribution p.

A model that predicts 0.99 probability for the wrong class gets catastrophically punished.

Minimising cross-entropy over training data is identical to maximum likelihood estimation — the loss function is not an arbitrary design choice, it follows from the probabilistic model you assumed. KL divergence KL(p‖q) measures the excess surprise from using q instead of p: it is always non-negative and zero only when p = q exactly. The direction of KL matters profoundly: forward KL (used in maximum likelihood) forces q to cover all modes of p; reverse KL (used in VAEs) causes q to collapse to one mode. These produce qualitatively different learned distributions — blurry vs. sharp, inclusive vs. exclusive.`,
    keyPoints: [
      `**Entropy H(X) = −Σ p log p is the minimum average bits needed to encode samples from X.** It is maximised by the uniform distribution (maximum uncertainty) and zero for a deterministic outcome. A classifier cannot achieve expected log-loss below H(p) on data from distribution p — entropy is the Bayes error rate in bits.`,
      `**Cross-entropy H(p, q) = H(p) + KL(p‖q).** Since H(p) is constant with respect to model parameters, minimising cross-entropy is exactly minimising KL divergence from the model to the true distribution. Every classification network you train is doing approximate KL minimisation whether you think of it that way or not.`,
      `**KL divergence is asymmetric: KL(p‖q) ≠ KL(q‖p).** Forward KL (KL(p‖q)) forces q to be non-zero wherever p is non-zero — q spreads to cover all modes, producing blurry samples when the target is multimodal. Reverse KL (KL(q‖p)) lets q ignore regions where p is small — q collapses to a single sharp mode. VAE encoders use reverse KL, which is why they tend to produce blurry reconstructions.`,
      `**Mutual information I(X; Y) = H(X) − H(X|Y) = KL(p(x,y) ‖ p(x)p(y)).** It is the right score for feature selection: it measures how much knowing Y reduces uncertainty about X, regardless of whether the relationship is linear, quadratic, or any other shape. Pearson correlation misses nonlinear relationships; mutual information does not.`,
      `**Binary cross-entropy gradient: ∂L/∂z = ŷ − y where z is the pre-sigmoid logit.** The gradient is simply prediction error — this elegant form is why logistic regression and neural network output layers are so tractable to train and why sigmoid + cross-entropy is the canonical output layer, not sigmoid + MSE.`,
    ],
    checkQuestions: [
      {
        q: `Compute H(X) for a fair six-sided die. Then compute H(Y) where Y = 'even or odd' (2 outcomes). Why is H(Y) < H(X)?`,
        options: [
          `A) H(X) = log₂(6) ≈ 2.585 bits. H(Y) = log₂(2) = 1 bit. H(Y) < H(X) because Y has fewer outcomes. More outcomes always means higher entropy since the uniform distribution maximises entropy and a 6-outcome uniform has more uncertainty than a 2-outcome uniform.`,
          `B) H(X) = −6·(1/6)·log₂(1/6) = log₂(6) ≈ 2.585 bits. H(Y) = −2·(1/2)·log₂(1/2) = 1 bit. H(Y) < H(X) because Y has higher probability on each outcome (1/2 vs. 1/6) — higher probability means less surprise per event, so less information is needed.`,
          `C) H(X) = 6 bits (one bit per face). H(Y) = 2 bits (one bit per outcome). H(Y) < H(X) because knowing Y = 'even' still requires 3 bits to specify which even face, so H(X|Y) = log₂(3) ≈ 1.585. The conditional entropy accounts for the remaining uncertainty.`,
          `D) H(X) = −Σ P(xᵢ)log₂P(xᵢ) = −6·(1/6)log₂(1/6) = log₂(6) ≈ 2.585 bits. H(Y): P(even) = P(odd) = 1/2. H(Y) = −2·(1/2)log₂(1/2) = 1 bit. H(Y) < H(X) because Y carries less information: knowing Y=even tells you the outcome is in {2,4,6} but doesn't specify which face. Knowing X tells you the exact face. Information-theoretically: Y is a coarsening of X — a function of X — and functions of a random variable cannot increase entropy (data processing inequality). The maximum entropy for n equally likely outcomes is log₂(n): H(X) achieves log₂(6), H(Y) achieves log₂(2)=1. More outcomes = more uncertainty = more bits needed to communicate the outcome.`,
        ],
        answer: `D`,
      },
      {
        q: `What is KL divergence D_KL(P||Q), and why is it asymmetric? Give an ML example where direction matters.`,
        options: [
          `A) D_KL(P||Q) = Σ P(x)·log(P(x)/Q(x)) = E_P[log(P(x)/Q(x))]. Asymmetry: D_KL(P||Q) ≠ D_KL(Q||P) in general. They are equal only when P=Q. In ML: when we minimise D_KL(P_data || Q_model) (forward KL, used in MLE), the model Q must cover all places where P_data is nonzero — if P(x)>0 but Q(x)=0, the KL diverges. The model spreads to cover all modes of P_data (mode-covering). When minimising D_KL(Q_model || P_data) (reverse KL, used in variational inference), Q must be zero wherever P_data is zero, but can be zero where P_data is nonzero — Q can be mode-seeking (collapse to one mode, ignoring others). In VAEs and variational inference, we minimise reverse KL, which is why learned approximations often underestimate uncertainty and collapse to dominant modes.`,
          `B) D_KL(P||Q) = Σ Q(x)·log(Q(x)/P(x)) — the expected log-ratio under Q. Asymmetry arises because Q is the reference distribution in the expectation. In ML: forward KL is used in MLE (fitting model Q to data P), and reverse KL is used when sampling from Q to approximate P. The practical difference is negligible for unimodal distributions but large for multimodal ones.`,
          `C) D_KL(P||Q) = Σ P(x)·log(P(x)/Q(x)). KL is symmetric when both P and Q are from the same exponential family. Asymmetry arises only when the distributions have different supports. In ML: the direction matters only for variational inference, not for MLE, because MLE minimises the forward KL which equals the cross-entropy up to a constant.`,
          `D) D_KL(P||Q) = Σ P(x)·log(P(x)/Q(x)). KL divergence is asymmetric because the weight assigned to each term differs: forward KL weights by P, reverse KL weights by Q. In ML: both directions give identical solutions when the model is correctly specified (Q can represent P exactly). The direction only matters under model misspecification, where the forward KL favors spreading mass and reverse KL favors concentrating it.`,
        ],
        answer: `A`,
      },
      {
        q: `Mutual information I(X;Y) = 0. What does this mean, and how is it different from Cov(X,Y) = 0?`,
        options: [
          `A) I(X;Y) = 0 means the entropy of X equals the entropy of Y — both variables carry the same amount of information. Cov(X,Y) = 0 means they have no linear relationship. The two conditions are independent: you can have I(X;Y) = 0 with nonzero covariance, or Cov(X,Y) = 0 with nonzero MI, depending on whether the dependence is linear or nonlinear.`,
          `B) I(X;Y) = 0 means the correlation between X and Y is zero in the information-theoretic sense, which is equivalent to Pearson correlation = 0 for continuous distributions. Both conditions are equivalent ways of saying there is no relationship between X and Y, with MI being the more general version that applies to discrete distributions as well.`,
          `C) I(X;Y) = H(X) − H(X|Y) = 0 means that knowing Y provides zero information about X: H(X|Y) = H(X). This implies X and Y are statistically independent — P(X,Y) = P(X)P(Y) for all values. MI detects any statistical dependence: linear, nonlinear, or categorical. By contrast, Cov(X,Y) = 0 only means there is no linear relationship. Zero covariance allows for nonlinear dependence (as in the X, X² example). Zero MI is strictly stronger than zero covariance: I(X;Y) = 0 ⟹ Cov(X,Y) = 0, but not vice versa. Cov(X,Y) = 0 ⟹ I(X;Y) = 0 only for jointly Gaussian distributions. MI is used in feature selection because it detects nonlinear dependence that correlation misses; MINE (mutual information neural estimator) estimates MI for complex distributions.`,
          `D) I(X;Y) = 0 means H(X|Y) = 0 — that is, X is completely determined by Y. This is the strongest form of dependence, where knowing Y eliminates all uncertainty about X. Cov(X,Y) = 0 is weaker: it only says there is no linear predictive relationship. So I(X;Y) = 0 implies Cov(X,Y) = 0, but also implies complete deterministic dependence, not independence.`,
        ],
        answer: `C`,
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
      `**Dot product xᵀy = 0 when x and y are orthogonal.** Orthogonal weight matrices preserve norms (‖Wx‖ = ‖x‖), preventing vanishing and exploding gradients at initialisation. In attention, a query orthogonal to all keys produces uniform attention weights — the head has learned nothing about the sequence yet.`,
      `**Matrix rank = number of linearly independent columns = dimensionality of the column space.** If a data matrix X has shape (100, 500), then XᵀX has rank at most 100 despite being 500×500. The normal equation (XᵀX)⁻¹Xᵀy has no unique solution — Ridge regression adds λI to make the matrix invertible, picking the minimum-norm solution.`,
      `**L1 norm ‖x‖₁ = Σ|xᵢ| creates sparsity.** Its subdifferential at zero allows the subgradient to pull weights exactly to zero, unlike L2 which only shrinks them. Lasso regularisation is L1-penalised MLE — it encodes the prior belief that most features are irrelevant.`,
      `**L2 norm ‖x‖₂ = √(Σxᵢ²) is Euclidean distance.** Ridge regression, weight decay, and gradient clipping all use L2. Every algorithm that uses L2 distance implicitly assumes spherical geometry where all directions are equally important — a dangerous assumption for unscaled features.`,
      `**Determinant det(A) is the volume scaling factor of the linear map. det(A) = 0 means the transformation collapses the space: information is destroyed.** A near-zero determinant signals near-singularity and numerical instability in solving Ax = b.`,
    ],
    checkQuestions: [
      {
        q: `A system Ax=b where A is 3×5 (3 equations, 5 unknowns). What can you say about the solution set? When does a solution exist?`,
        options: [
          `A) A is 3×5 with rank r ≤ min(3,5) = 3. If rank(A) = 3 (full row rank): the system Ax=b is consistent (has a solution) for every b (the column space of A spans ℝ³). The solution is not unique: there are 5−3 = 2 free variables, so the solution set is an affine subspace of dimension 2 (a plane in ℝ⁵). If rank(A) < 3: A is rank-deficient. For some b not in col(A), no solution exists. For b in col(A), the solution set is an affine subspace of dimension 5−rank(A) > 2. The minimum-norm solution (if one exists) is x_min = Aᵀ(AAᵀ)⁻¹b (the Moore-Penrose pseudoinverse applied to b), which lies in the row space of A and is the unique solution with the smallest ‖x‖₂.`,
          `B) A is 3×5 so the system has more equations than unknowns — it is overdetermined and generically has no exact solution. We use least squares: x̂ = (AᵀA)⁻¹Aᵀb. AᵀA is 5×5 and full rank when A has rank 5, so the system is uniquely solvable via the normal equations.`,
          `C) A is 3×5 with 3 equations and 5 unknowns, giving 5−3=2 degrees of freedom. A solution always exists because the system is underdetermined — there are always more unknowns than equations, so b is always reachable. The unique minimum-norm solution is x̂ = Aᵀ(AAᵀ)⁻¹b regardless of rank.`,
          `D) A is 3×5, so the column space of A has dimension at most 5. The system Ax=b has a unique solution when rank(A)=3 and b is in the column space, and infinitely many solutions when rank(A)<3. There are always exactly 5−3=2 free variables in either case.`,
        ],
        answer: `A`,
      },
      {
        q: `You compute the dot product of two vectors: u·v = ‖u‖‖v‖cos(θ) = 0. What does this mean geometrically, and what does it mean in ML for feature representations?`,
        options: [
          `A) u·v = 0 means either u = 0 or v = 0 — at least one vector is the zero vector. Geometrically, the zero vector has no direction. In ML, if a feature representation u = 0, that data point has no learned embedding and will receive uniform attention weights from all queries, making it effectively invisible to the model.`,
          `B) u·v = 0 means the vectors have equal magnitude (‖u‖ = ‖v‖). Geometrically, equal-length vectors that differ only in direction have zero dot product when aligned symmetrically around the origin. In ML, this means the two representations encode the same amount of information but in completely different directions.`,
          `C) u·v = 0 means u and v are linearly dependent — one is a scalar multiple of the other. Geometrically, they point in exactly the same or exactly opposite directions. In ML, linearly dependent feature vectors indicate that two data points have proportional feature activations — they are on the same ray through the origin.`,
          `D) u·v = 0 means the angle θ = 90° — the vectors are orthogonal. They are geometrically perpendicular in ℝⁿ. In ML: if u and v are feature representations of two data points, u·v = 0 means the features share no common activation patterns — they are uncorrelated in the linear projection sense. For embeddings (word2vec, etc.): u·v = 0 means the two entities (words, items) have no learned similarity. After normalisation: cos(θ) = u·v/(‖u‖‖v‖) = cosine similarity. Cosine similarity = 0 means orthogonal (dissimilar), = 1 means identical (most similar), = −1 means maximally opposite. PCA computes orthogonal basis vectors — principal components — which are orthogonal because they capture maximally different directions of variance in the data.`,
        ],
        answer: `D`,
      },
      {
        q: `The matrix A = [[2, 1], [4, 2]] is singular. How can you tell, and what does singularity mean for the linear system Ax=b?`,
        options: [
          `A) det(A) = 2×2 − 1×4 = 0, but this only means the matrix has a repeated eigenvalue, not that it is singular. The system Ax=b has a unique solution for any b because the columns span ℝ² — the singularity only affects the eigenvalue structure, not the solvability of the linear system.`,
          `B) det(A) = 2×2 − 1×4 = 4 − 4 = 0 → A is singular. Also: row 2 = 2 × row 1, so the rows are linearly dependent. The matrix has rank 1 (only one linearly independent row/column). For Ax=b: the column space of A is one-dimensional (a line through the origin in ℝ²). If b lies on that line, there are infinitely many solutions (a 1-dimensional affine subspace). If b does not lie on that line, no solution exists. Geometrically: A maps ℝ² onto a 1D line (the column space), collapsing the entire input to a lower-dimensional output. Any input in the null space (here, vectors parallel to [−1, 2]ᵀ) are mapped to zero, meaning different inputs can produce the same output — A is not invertible.`,
          `C) Row 2 = 2 × row 1, so the rows are linearly dependent and det(A) = 0. For Ax=b: the system always has infinitely many solutions because the null space is non-trivial — the extra degree of freedom means we can always shift any particular solution by a null space vector. The system is never inconsistent.`,
          `D) det(A) = 4 − 4 = 0 and the trace = 2+2 = 4. A singular matrix with equal diagonal elements means both eigenvalues are 2. For Ax=b: the matrix is rank-deficient so we need the pseudoinverse A⁺ = VΣ⁺Uᵀ which gives the minimum-norm least-squares solution for any b.`,
        ],
        answer: `B`,
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
    summary: `A matrix transformation generally both rotates and stretches every vector it acts on. But some special directions are only stretched, not rotated — the matrix acts on them as pure scaling. Those are the eigenvectors:

$Av = λv, where λ is the scaling factor. This matters for$

ML because the eigenvectors of the covariance matrix are the directions of maximum variance in the data, and their eigenvalues tell you exactly how much variance each direction accounts for. PCA is just finding these directions. The condition number κ = λ_max/λ_min of the Hessian determines how fast gradient descent converges: a high condition number means the loss landscape is a narrow elongated valley, and gradient descent zigzags slowly down it. A condition number of 10⁶ means convergence is 10⁶-fold slower in the worst direction. The Hessian's eigenvalues also determine whether a critical point is a minimum (all positive), maximum (all negative), or saddle (mixed) — and in deep networks, almost all critical points are saddles, not local minima.`,
    keyPoints: [
      `**Av = λv: eigenvector v is the direction that A only scales, not rotates.** The top eigenvector of the covariance matrix is the direction of maximum variance in the data — that is the first principal component. The eigenvalue λ₁ tells you exactly how much variance that direction accounts for.`,
      `**Spectral theorem: any real symmetric A = QΛQᵀ where Q is orthogonal and Λ diagonal.** Covariance matrices are always symmetric PSD, so this applies. It guarantees PCA components are orthogonal, eigenvalues are real and non-negative, and the decomposition always exists.`,
      `**Condition number κ = λ_max/λ_min controls gradient descent convergence speed: rate ≈ ((κ−1)/(κ+1))^t.** With κ = 1000, you need ~1000 steps to converge where 1 Newton step suffices. Features with different scales create poor conditioning — standardising before fitting is not a stylistic choice, it directly fixes the condition number.`,
      `**Hessian eigenvalues classify critical points: all positive → local minimum, all negative → local maximum, mixed signs → saddle point.** In high-dimensional deep networks, most critical points are saddles. SGD noise helps escape saddles by moving along negative-curvature directions — the noise is not just a computational artifact, it is a necessary escaping mechanism.`,
      `**Power iteration: repeatedly multiply by A and renormalise.** Converges to the top eigenvector at rate |λ₂/λ₁|. Google's PageRank is power iteration on the web link matrix. Truncated SVD and large-scale PCA both use randomised variants of power iteration rather than diagonalising the full matrix.`,
    ],
    checkQuestions: [
      {
        q: `What are the eigenvalues and eigenvectors of a rotation matrix R(θ) = [[cos θ, −sin θ], [sin θ, cos θ]]?`,
        options: [
          `A) The eigenvalues are cos θ ± sin θ (real values). The eigenvectors are [cos θ, sin θ]ᵀ and [−sin θ, cos θ]ᵀ — the columns of the rotation matrix itself. This makes sense because the columns of any orthogonal matrix are its eigenvectors, and rotation matrices are orthogonal.`,
          `B) The eigenvalues are always λ₁=1, λ₂=1 because rotation preserves lengths: ‖Rv‖=‖v‖ for all v, so the scaling factor is always 1. The eigenvectors are the axes of rotation. For 2D rotations with θ≠0, the only axis is the origin, so there are no non-trivial eigenvectors.`,
          `C) det(R − λI) = (cos θ − λ)² + sin²θ = 0 → λ² − 2λcos θ + 1 = 0 → λ = cos θ ± i·sin θ = e^{±iθ}. For θ ≠ 0, π, the eigenvalues are complex: e^{iθ} and e^{−iθ}. There are no real eigenvalues (no real vectors are preserved by the rotation). The eigenvectors are complex: for λ = e^{iθ}, the eigenvector is [1, −i]ᵀ/√2; for λ = e^{−iθ}, it is [1, i]ᵀ/√2. For θ=0: R=I, both eigenvalues are 1, every vector is an eigenvector. For θ=π: R=−I, both eigenvalues are −1, every vector is an eigenvector. Physical interpretation: rotations in ℝ² do not have real eigenvectors — no real vector points in the same direction after rotation (unless the rotation is 0° or 180°). This generalises: orthogonal matrices can have complex eigenvalues.`,
          `D) The eigenvalues are real only when θ = kπ for integer k (0°, 180°, etc.). For general θ, R has no eigenvalues because eigenvalue equations require real solutions. The correct eigenvalue analysis uses the characteristic polynomial but only the real part: λ = cos θ.`,
        ],
        answer: `C`,
      },
      {
        q: `A symmetric matrix A has eigenvalues λ₁=5, λ₂=3, λ₃=1 and orthonormal eigenvectors v₁, v₂, v₃. Write A as a sum of rank-1 matrices, and explain what this means geometrically.`,
        options: [
          `A) By the spectral theorem (A symmetric ⟹ A = QΛQᵀ where Q=[v₁,v₂,v₃] and Λ=diag(5,3,1)): A = Σᵢ λᵢvᵢvᵢᵀ = 5v₁v₁ᵀ + 3v₂v₂ᵀ + 1v₃v₃ᵀ. Each vᵢvᵢᵀ is a rank-1 matrix that projects any vector onto the direction vᵢ. The eigendecomposition says A acts as: (1) project x onto v₁, scale by 5; (2) project onto v₂, scale by 3; (3) project onto v₃, scale by 1; then add the results. Geometrically: A stretches space by 5× in the v₁ direction, 3× in v₂, and 1× in v₃. The eigenvectors are the principal axes of the transformation; eigenvalues are the stretch factors. A unit sphere maps to an ellipsoid with semiaxes of length 5, 3, 1 along v₁, v₂, v₃.`,
          `B) A = v₁v₁ᵀ + v₂v₂ᵀ + v₃v₃ᵀ since the eigenvectors are orthonormal and span ℝ³. The eigenvalues λ₁=5, λ₂=3, λ₃=1 scale the matrix rather than the individual rank-1 components. Geometrically: each rank-1 term projects onto one axis of the eigenbasis; A is the sum of all three projections, which equals the identity matrix in the eigenbasis.`,
          `C) A = 5·(v₁ + v₂ + v₃)(v₁ + v₂ + v₃)ᵀ/(‖v₁+v₂+v₃‖²) using the dominant eigenvalue. The other eigenvalues contribute smaller corrections: A ≈ 5v₁v₁ᵀ with error ‖A − 5v₁v₁ᵀ‖_F = √(9+1) = √10. Geometrically: A is approximately a rank-1 matrix pointing in the v₁ direction, with small perturbations in v₂ and v₃.`,
          `D) A = (5+3+1)·v_avg v_avg^ᵀ where v_avg = (v₁+v₂+v₃)/‖v₁+v₂+v₃‖. The spectral theorem decomposes A into a single rank-1 matrix scaled by the sum of eigenvalues. Geometrically: A uniformly stretches all vectors by 9× in the average eigenvector direction.`,
        ],
        answer: `A`,
      },
      {
        q: `The power iteration algorithm computes the dominant eigenvector of A by repeatedly multiplying v ← Av/‖Av‖. Why does this converge to the eigenvector for the largest eigenvalue?`,
        options: [
          `A) Power iteration works because matrix multiplication is associative: Aᵏv = A(A(...(Av)...)). At each step, the component of v in the dominant eigenvector direction is multiplied by λ₁, while other components are multiplied by smaller eigenvalues. After k steps, the dominant component has grown by λ₁ᵏ relative to all others. Normalisation at each step prevents overflow and maintains the direction. Convergence is guaranteed for any A, at rate |λ₂/λ₁|ᵏ.`,
          `B) Expand the initial vector v₀ in the eigenbasis: v₀ = Σᵢ cᵢvᵢ where Avᵢ = λᵢvᵢ. Applying A k times: Aᵏv₀ = Σᵢ cᵢλᵢᵏvᵢ. Factor out λ₁ᵏ (the largest eigenvalue): Aᵏv₀ = λ₁ᵏ(c₁v₁ + Σᵢ>1 cᵢ(λᵢ/λ₁)ᵏvᵢ). Since |λᵢ/λ₁| < 1 for all i > 1, (λᵢ/λ₁)ᵏ → 0 as k → ∞. The sum collapses to c₁v₁ — just the dominant eigenvector (assuming c₁ ≠ 0). The convergence rate is |λ₂/λ₁|ᵏ — fast when the spectral gap |λ₁|−|λ₂| is large. For degenerate eigenvalues (|λ₁| = |λ₂|), power iteration fails to converge to a single direction — it cycles between eigenvectors. In ML context: PageRank uses power iteration on the web graph's transition matrix to find the stationary distribution (dominant eigenvector).`,
          `C) Power iteration converges because the gradient of ‖Av‖₂ with respect to v points in the direction of the dominant eigenvector. Each normalised multiplication step performs a projected gradient ascent on the Rayleigh quotient vᵀAv/vᵀv, which is maximised at the dominant eigenvector. The convergence rate equals the learning rate times the spectral gap.`,
          `D) Power iteration converges because symmetric matrices have orthogonal eigenvectors. Starting from any v₀, each multiplication by A rotates v toward the dominant eigenvector direction. After k rotations, the angle between v and v₁ decreases geometrically. Non-symmetric matrices may not converge because their eigenvectors are not orthogonal.`,
        ],
        answer: `B`,
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
      `**A = UΣVᵀ: any linear map decomposes into three operations — rotate by Vᵀ, scale by Σ, rotate by U.** The right singular vectors V are the directions in input space that the matrix stretches along. The singular values σᵢ tell you how much. SVD reveals what a linear transformation actually does geometrically.`,
      `**Eckart-Young theorem:

$A_k = Σᵢ₌₁ᵏ σᵢ uᵢvᵢᵀ is the best rank-k approximation in Fro$

benius and spectral norm.** This is provably optimal — no other rank-k matrix is closer to A. It is the mathematical guarantee that justifies truncated SVD as a compression and denoising tool.`,
      `**PCA is SVD on the centred data matrix.** The right singular vectors of X equal the eigenvectors of XᵀX (the covariance matrix). The k-th explained variance is σₖ²/(n−1). Computing PCA via SVD of X avoids forming XᵀX and therefore avoids squaring the condition number — it is always numerically superior.`,
      `**Pseudoinverse A⁺ = VΣ⁺Uᵀ solves least squares without forming XᵀX.** When singular values are near zero, it zeros them rather than inverting them — automatically handling multicollinearity. sklearn's LinearRegression uses this by default, which is why it never crashes on near-singular data.`,
      `**Plotting the singular value spectrum is a diagnostic for intrinsic dimensionality.** A sharp drop from large to near-zero singular values indicates the data lives on a low-dimensional manifold. Values below the gap are noise — keeping them adds variance without signal to any downstream model.`,
    ],
    checkQuestions: [
      {
        q: `A matrix M has SVD M = UΣVᵀ. What are U, Σ, V, and what are their dimensions for an m×n matrix with rank r?`,
        options: [
          `A) U is m×r (left singular vectors), Σ is r×r diagonal (nonzero singular values only), Vᵀ is r×n (right singular vectors). This is the economy/thin SVD. The full SVD pads U to m×m and V to n×n with additional columns spanning the null spaces. The rank-r approximation: Mᵣ = UΣVᵀ using these dimensions already gives the best rank-r approximation. The Eckart-Young theorem applies to both full and economy SVD.`,
          `B) U is n×n (input space), Σ is n×m (scaling), V is m×m (output space). The action of M = UΣVᵀ: U rotates in input space, Σ scales each dimension, Vᵀ is not a rotation because it maps between spaces of different dimensions. The singular values on the diagonal of Σ are the square roots of eigenvalues of MMᵀ.`,
          `C) U is m×r, Σ is r×r diagonal, V is n×r. Singular values σ₁ ≥ ... ≥ σᵣ > 0. The action: Vᵀ projects r-dimensional input subspace, Σ scales, U maps to output. The SVD reveals that M is a composition of r rank-1 operations. The pseudoinverse M⁺ = VΣ⁻¹Uᵀ gives the minimum-norm least-squares solution to Mx=b.`,
          `D) For M: m×n with rank r: U is m×m orthogonal (left singular vectors — eigenvectors of MMᵀ); Σ is m×n diagonal (singular values σ₁≥σ₂≥...≥σᵣ>0, zeros elsewhere); V is n×n orthogonal (right singular vectors — eigenvectors of MᵀM). The first r columns of U are the non-trivial left singular vectors; first r columns of V are non-trivial right singular vectors. The action of M: V rotates/reflects input, Σ scales each dimension (with some dimensions going to zero), U rotates/reflects output. The rank-r approximation: Mᵣ = Σᵢ₌₁ʳ σᵢuᵢvᵢᵀ. The best rank-k approximation (k ≤ r) in Frobenius norm is Mₖ = Σᵢ₌₁ᵏ σᵢuᵢvᵢᵀ — this is the Eckart-Young theorem, used in PCA and matrix factorization for recommender systems.`,
        ],
        answer: `D`,
      },
      {
        q: `In a recommender system, you have a 10,000-user × 5,000-movie rating matrix M. You compute a truncated SVD with k=50. Explain what the k=50 components represent and how you would predict a missing rating.`,
        options: [
          `A) Truncated SVD Mₖ = UₖΣₖVₖᵀ: Uₖ is 10,000×50 (user-factor matrix — each user's 50-dimensional latent preference vector); Σₖ is 50×50 diagonal (scale/importance of each latent factor); Vₖᵀ is 50×5000 (movie-factor matrix — each movie's 50-dimensional latent attribute vector). The 50 components represent latent factors (e.g., 'action movies', 'romances', 'critically-acclaimed' etc. — uninterpretable but capturing co-rating patterns). To predict missing rating M_{ij}: compute (UₖΣₖVₖᵀ)_{ij} = uᵢᵀΣₖvⱼ where uᵢ is user i's latent vector and vⱼ is movie j's latent vector. The dot product measures alignment between user preferences and movie attributes across all 50 latent dimensions. Full SVD on a partially observed matrix is not directly applicable — in practice, matrix factorization is used to find U, V minimising observed-entry prediction error.`,
          `B) The k=50 components are the 50 most popular movies — the singular values rank movies by total rating activity. Uₖ is a 10,000×50 matrix where each row gives a user's ratings for the top-50 movies. To predict M_{ij}: find the nearest user in the top-50 movie subspace and copy their rating for movie j. The truncated SVD provides both dimensionality reduction and a nearest-neighbor lookup structure.`,
          `C) The k=50 SVD components represent 50 user clusters. Uₖ contains cluster assignments (soft), Σₖ contains cluster sizes, Vₖᵀ contains cluster-to-movie affinity scores. To predict M_{ij}: identify user i's cluster membership from row i of Uₖ, then use the cluster's movie preferences from Vₖᵀ. Missing ratings are predicted by the weighted average of cluster preferences, with weights given by the user's cluster membership probabilities.`,
          `D) The k=50 components represent the 50 highest-variance rating patterns across users and movies. Uₖ contains the top-50 left singular vectors describing user variance, Vₖᵀ contains the top-50 right singular vectors describing movie variance. To predict M_{ij}: interpolate between observed ratings using the low-rank structure — M_{ij} ≈ mean_rating + uᵢᵀvⱼ where the dot product captures user-movie affinity after mean-centering.`,
        ],
        answer: `A`,
      },
      {
        q: `The nuclear norm of a matrix is the sum of its singular values. Why is it used as a convex relaxation for minimising rank?`,
        options: [
          `A) The nuclear norm is a convex relaxation of rank because it is the dual norm of the spectral norm (largest singular value). Any norm can serve as a regulariser; the nuclear norm specifically penalises the sum of singular values, which encourages the matrix to have a small spectral radius rather than low rank.`,
          `B) The nuclear norm ‖M‖_* = Σσᵢ equals rank(M) when all singular values are exactly 1 (orthogonal matrices), and is larger otherwise. Minimising the nuclear norm subject to constraints therefore minimises how far the singular values deviate from 1, which indirectly minimises rank by shrinking small singular values toward zero before large ones.`,
          `C) Rank minimisation is NP-hard in general: minimise rank(M) subject to constraints. The nuclear norm ‖M‖_* = Σσᵢ is the tightest convex relaxation of rank. The analogy to L1/L0: L0-norm (count of nonzero elements) is NP-hard to minimise; L1-norm is its convex relaxation and gives sparse solutions. Similarly, rank(M) counts the number of nonzero singular values; nuclear norm sums them. Minimising nuclear norm subject to linear constraints is a semidefinite program (SDP) — convex and polynomial-time solvable. The nuclear norm promotes small singular values (sparsity in singular value space) just as L1 promotes small absolute values. In matrix completion (Netflix problem), minimising nuclear norm subject to 'observed entries match data' recovers a low-rank matrix under random sampling conditions (Candès & Recht, 2009).`,
          `D) The nuclear norm is convex because it is a sum of convex functions (each σᵢ is convex in the matrix entries). It relaxes rank minimisation because rank(M) = lim_{p→0} ‖σ‖_p^p (the L0 norm of singular values), and the nuclear norm is the nearest convex function above this limit. The nuclear norm ball {M : ‖M‖_* ≤ 1} is the convex hull of rank-1 matrices with unit spectral norm.`,
        ],
        answer: `C`,
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
    summary: `High-dimensional data slows down downstream models, causes overfitting, and makes visualisation impossible. The obvious fix is to drop features — but which ones? Dropping features by hand throws away information arbitrarily. PCA finds a principled answer: project the data onto the directions where it varies most. Maximum variance is the proxy for maximum information. Compressing in low-variance directions loses little — those directions may be noise.

The algorithm: centre the data, compute the covariance matrix, find its top eigenvectors. Crucially, maximising projected variance is mathematically equivalent to minimising reconstruction error — the two objectives produce the same answer. But PCA has two critical failure modes that must be understood before applying it. First, it is scale-sensitive: a feature measured in dollars will dominate one measured in cents, making the "directions of maximum variance" reflect measurement units rather than signal. Always standardise first. Second, PCA is unsupervised: it keeps directions of maximum variance, not directions useful for the downstream task. The discriminative signal for a classifier may live precisely in the low-variance subspace PCA discards.`,
    keyPoints: [
      `**PCA maximises projected variance: the first PC is the direction w (‖w‖ = 1) that maximises Var(Xw).** This is the top eigenvector of the covariance matrix C = XᵀX/(n−1). Compressing in low-variance directions loses the least information — but only if low variance means noise, not signal.`,
      `**PCA is scale-sensitive: a feature with range [0, 1000] has variance ~10⁶× higher than one with range [0, 1].** It will dominate every principal component. Standardise (z-score) before PCA unless features share a natural common scale. The alternative — whitening — divides PCA scores by √λₖ to give unit variance in every direction.`,
      `**Whitening is required before algorithms that assume spherical data: k-means, Gaussian Mixture Models with tied covariance, ICA.** Applying k-means to raw PCA scores is incorrect when eigenvalues differ by orders of magnitude — the algorithm will cluster almost entirely along the first PC.`,
      `**PCA fails when discriminative information is in low-variance directions.** If two classes differ only in a feature with small variance, PCA discards exactly the useful signal. This is the fundamental mismatch: PCA maximises reconstruction quality for the data distribution, not classification performance for the task. Use LDA or supervised autoencoders when label information should guide the reduction.`,
      `**Kernel PCA replaces the dot products xᵢᵀxⱼ with k(xᵢ, xⱼ), performing PCA implicitly in a high-dimensional feature space.** It discovers non-linear manifold structure that linear PCA cannot. The cost is O(n²) memory for the kernel matrix, making it impractical for large n.`,
    ],
    checkQuestions: [
      {
        q: `You have a dataset with covariance matrix Σ. Describe the PCA algorithm as an eigendecomposition problem, and explain what the principal components represent.`,
        options: [
          `A) PCA solves the linear system Σw = 0 to find directions of zero variance — these are the null space vectors of Σ. Principal components are the directions orthogonal to the null space, i.e., the column space of Σ. The explained variance for component k is tr(Σ) − λₖ, measuring how much variance remains after removing that direction.`,
          `B) PCA: find orthonormal directions w₁, w₂, ..., wₖ in order of maximum variance. w₁ = argmax_{‖w‖=1} wᵀΣw. This is the eigenvector problem: Σw = λw. w₁ is the eigenvector of Σ with the largest eigenvalue λ₁ = Var(projection onto w₁). w₂ is the eigenvector with second-largest eigenvalue, subject to w₂ ⊥ w₁. Etc. The principal components are the projections of data onto these eigenvectors. Geometrically: Σ is a positive semidefinite matrix; its eigenvectors are the principal axes of the data's covariance ellipsoid; eigenvalues are the squared semiaxis lengths. PCA rotates the coordinate system so that axes align with directions of maximum variance. The explained variance ratio for component k is λₖ/Σλᵢ — how much total variance is captured by keeping only k components.`,
          `C) PCA computes the gradient ∇_w wᵀΣw = 2Σw and follows it to convergence. This is the power iteration algorithm: starting from random w, repeatedly compute Σw and normalise. The algorithm converges to the largest eigenvector. Subsequent components are found by deflation: subtract the rank-1 contribution of the found component and repeat.`,
          `D) PCA minimises the reconstruction error ‖X − XWWᵀ‖²_F over orthonormal W. Setting the gradient to zero gives ΣW = WΛ where Λ is diagonal. This is equivalent to finding the eigenvectors of Σ but via an optimisation perspective rather than the spectral perspective. The principal components are the columns of W that minimise reconstruction error.`,
        ],
        answer: `B`,
      },
      {
        q: `PCA on a dataset with 1000 features gives first two PCs explaining 95% of variance. A colleague uses these 2 PCs as features for a random forest. What might go wrong?`,
        options: [
          `A) The random forest will be slower than on the original 1000 features because PCA produces dense features (every original feature contributes to each PC), making tree splits computationally expensive. Sparse original features allow faster tree construction via efficient split-point search.`,
          `B) The 2 PCs may not span enough dimensions for the random forest to split meaningfully — a random forest needs at least sqrt(n_features) dimensions per tree, so 2 PCs is far below the recommended sqrt(1000) ≈ 32. The forest will underfit regardless of how much variance the PCs explain.`,
          `C) PCA produces correlated features when only 2 PCs are used, because the first 2 PCs both contain information from the same underlying features. Random forests are sensitive to feature correlation — the variable importance scores become unreliable, and correlated PCs cause the forest to double-count certain directions.`,
          `D) The 95% variance explained is for reconstruction, not for prediction of the target. The remaining 5% variance may be disproportionately predictive: if the label is correlated with directions of small variance in x (e.g., a subtle pattern that does not dominate the feature variance), those dimensions will be discarded by PCA but are critical for the classifier. Example: if features are pixel intensities and label is 'has small tumor in bottom-right corner', the tumor may be a tiny fraction of pixel variance (5%) but entirely label-predictive. Using only the 2 PCs, the tumor signal is discarded. Supervised dimensionality reduction (LDA, PLS) preserves dimensions correlated with the label, not just high-variance dimensions. In practice: compare model performance with and without PCA reduction; always check if the compressed features still allow the target to be predicted accurately on validation data.`,
        ],
        answer: `D`,
      },
      {
        q: `Why must you subtract the mean before applying PCA? What goes wrong if you do not?`,
        options: [
          `A) PCA finds directions of maximum variance in the data. Variance is measured relative to the mean: Var(X) = E[(X−μ)(X−μ)ᵀ]. If we compute the covariance matrix without subtracting the mean: Σ_wrong = E[XXᵀ] (second moment matrix). The first principal component of E[XXᵀ] is the direction of maximum E[(xᵀw)²], which is dominated by the mean: the direction pointing toward the mean of the data. If the data mean is large, the first PC is essentially the mean direction, regardless of the actual structure of variance. After centering: Σ = E[(X−μ)(X−μ)ᵀ], and the first PC genuinely captures the direction of maximum spread/variation. In sklearn, PCA always centers by default. If you want whitening without centering (preprocessing for neural networks), you use ZCA whitening with explicit mean subtraction.`,
          `B) Mean subtraction has no effect on the eigenvectors of the covariance matrix — it only shifts the eigenvalues by a constant. Without centering, the eigenvalues of E[XXᵀ] are equal to those of E[(X−μ)(X−μ)ᵀ] plus ‖μ‖², so the PCs are identical but the explained variances are inflated. Centering is optional and is only necessary when you want accurate explained variance percentages.`,
          `C) Without mean subtraction, PCA on E[XXᵀ] finds the correct covariance structure as long as the data is standardised (zero mean forced by normalisation). The mean-subtraction requirement is specific to sklearn's implementation choice; mathematically, you only need E[XXᵀ] to be positive definite, which holds when the data spans all dimensions.`,
          `D) Mean subtraction converts PCA from an unsupervised to a supervised method: centering by the class-conditional mean (as in Fisher's LDA) introduces label information. Without centering by the global mean, PCA is purely unsupervised. Subtracting the mean biases the first PC toward the decision boundary between classes rather than the direction of maximum marginal variance.`,
        ],
        answer: `A`,
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
    summary: `ML training is an optimisation problem: given a loss function L(θ) measuring how wrong the model is, find the θ that minimises it. If you could afford to evaluate L everywhere, you would just try all values. You cannot, so you need a direction to move.

The gradient ∇_θL tells you exactly that: for each parameter, how much does the loss increase if you nudge that parameter up? The negative gradient is the direction of steepest descent. Following it iteratively is gradient descent. The chain rule makes this tractable for deep networks: when the loss is a composition of many functions, the gradient of the whole is a product of gradients of each piece along the computational path. That product, computed from output back to input, is backpropagation. The Hessian ∇²L adds second-order information: curvature. It tells you whether a critical point where ∇L = 0 is a minimum (all positive curvature), maximum (all negative), or saddle (mixed). The condition number of the Hessian — ratio of maximum to minimum curvature — directly determines how fast gradient descent converges. A poorly conditioned Hessian is the most common reason training crawls, and it is fixable by standardising features before any architectural change.`,
    keyPoints: [
      `**Gradient ∇f = [∂f/∂x₁, ..., ∂f/∂xₙ]ᵀ points in the direction of steepest ascent.** Its magnitude is the rate of increase. The negative gradient is the direction that reduces the function fastest from the current point — but only locally. A large gradient means a steep region where large steps overshoot.`,
      `**Chain rule: if

$z = f(g(x)), then dz/dx = (∂f/∂g)(∂g/∂x).** For vector-valued functions, this$

is a product of Jacobians. Backpropagation is the chain rule applied to the computational graph in reverse, computing ∂L/∂θ for all parameters simultaneously in one backward pass at the cost of a single forward pass.`,
      `**Convex function: any local minimum is global.** Hessian H is PSD everywhere iff f is convex. Linear regression, logistic regression, and SVMs are convex — gradient descent on them is guaranteed to find the global optimum. Deep networks are non-convex — but in overparameterised regimes, most local minima have similar loss values, and saddle points dominate over local minima.`,
      `**Saddle points have mixed Hessian curvature: some directions curve up (positive eigenvalues) and some curve down (negative eigenvalues).** Gradient descent noise from mini-batches causes random perturbations that push the iterate down the negative-curvature directions, escaping the saddle. This is not a side effect of mini-batch training — it is why mini-batch training works better than full-batch in non-convex landscapes.`,
      `**L-smoothness ‖∇f(x) − ∇f(y)‖ ≤ L‖x−y‖ bounds how fast the gradient changes.** The maximum safe learning rate is η = 1/L — exceeding it means the quadratic approximation underlying gradient descent breaks down and the step overshoots. A loss that diverges on the first step means η > 1/L.`,
    ],
    checkQuestions: [
      {
        q: `What is the gradient of f(x) = ‖Ax − b‖₂² with respect to x? Derive it step by step.`,
        options: [
          `A) ∇_x f = 2Ax − 2b. Derive: f(x) = (Ax−b)ᵀ(Ax−b). The chain rule gives ∂f/∂x = 2(Ax−b)·A, but since we differentiate with respect to x (not Ax), the A term does not transpose: ∇_x f = 2A(Ax−b) expanded term-by-term gives 2Ax − 2b. Setting to zero: Ax = b, which is only valid when A is square — the gradient directly gives the solution without the normal equations.`,
          `B) ∇_x f = 2A(Ax−b). Derive: f(x) = (Ax−b)ᵀ(Ax−b). Let r = Ax−b, so f = rᵀr. ∂f/∂x = 2r·(∂r/∂x) = 2(Ax−b)·A = 2A(Ax−b). Setting to zero gives AAx = Ab — a different form of the normal equations that is equivalent when A is square and invertible.`,
          `C) f(x) = (Ax−b)ᵀ(Ax−b). Taking gradient: ∇_x f = 2AᵀAx − 2Aᵀb = 2Aᵀ(Ax−b). Derive it step by step: expand f(x) = xᵀAᵀAx − 2bᵀAx + bᵀb. Taking gradient term by term: ∇_x(xᵀAᵀAx) = 2AᵀAx (quadratic form gradient: ∇_x(xᵀMx) = (M+Mᵀ)x; here M=AᵀA which is symmetric, so 2AᵀAx). ∇_x(−2bᵀAx) = −2Aᵀb (linear form: ∇_x(cᵀAx) = Aᵀc). ∇_x(bᵀb) = 0 (no x). Total: ∇_x f = 2AᵀAx − 2Aᵀb = 2Aᵀ(Ax−b). Setting to zero: AᵀAx = Aᵀb — the normal equations for least squares. This is the gradient of the MSE loss in linear regression: the update direction is proportional to Aᵀ(Ax−b), which is the matrix form of 'Xᵀ times residuals'.`,
          `D) ∇_x f = (Ax−b). Derive: f(x) = ‖r‖² where r = Ax−b. The gradient of ‖r‖² with respect to r is 2r, and by the chain rule ∂r/∂x = I (since Ax−b depends linearly on x through A, but the gradient is taken directly with respect to the residual). So ∇_x f = 2(Ax−b) before applying the transpose correction.`,
        ],
        answer: `C`,
      },
      {
        q: `The chain rule for ∂L/∂W at layer l requires the upstream gradient ∂L/∂z_{l+1}. Why does backpropagation propagate gradients backward rather than forward?`,
        options: [
          `A) Gradients propagate backward because the loss is computed at the output layer (forward end), not the input layer. The gradient information must physically travel from where the loss is measured back to where the parameters are. Forward propagation moves data forward; backward propagation moves gradient information the other way. Both directions take the same compute time.`,
          `B) Backward propagation is required by the chain rule: ∂L/∂Wₗ = (∂L/∂zₗ)·(∂zₗ/∂Wₗ), and ∂L/∂zₗ can only be computed after ∂L/∂zₙ is known. Forward accumulation would compute ∂zₙ/∂Wₗ, but this requires a separate forward pass per parameter and does not benefit from the scalar loss structure. Backprop processes all layers simultaneously in one backward pass due to dynamic programming — it reuses intermediate activations stored during the forward pass.`,
          `C) The chain rule for a composition f(g(x)): df/dx = (df/dg)·(dg/dx). For a network L = L(z_n(z_{n-1}(...z_1(x)...))), ∂L/∂W_l = (∂L/∂z_n)·(∂z_n/∂z_{n-1})·...·(∂z_{l+1}/∂z_l)·(∂z_l/∂W_l). This product of Jacobians can be computed in two orders: (1) Forward accumulation: right to left, computing (∂z_{l+1}/∂z_l)·...·(∂L/∂z_n) — requires one pass per output dimension; (2) Backward accumulation: left to right, starting with ∂L/∂z_n — requires one pass per input dimension. Since L is scalar (one output), backward mode is O(1) passes through the full Jacobian product — you compute the full gradient of L with respect to all parameters in a single backward pass. Forward mode would require d_x passes (one per input dimension, often millions of parameters). This is why backpropagation is the efficient choice for training neural networks with scalar losses.`,
          `D) Gradients flow backward because neurons are connected by directed edges from input to output, and gradient flow must respect edge directionality. In the computational graph, edges point forward (input→output), so gradient information naturally flows in the reverse direction along the same edges. If the network had bidirectional connections, gradients could flow both ways.`,
        ],
        answer: `C`,
      },
      {
        q: `You want to find the minimum of f(x₁,x₂) = (x₁−3)² + 2(x₂+1)². What are ∂f/∂x₁ and ∂f/∂x₂, and what is the minimum?`,
        options: [
          `A) ∂f/∂x₁ = 2(x₁−3). ∂f/∂x₂ = 4(x₂+1). Setting both to zero: x₁=3, x₂=−1. Minimum value f(3,−1) = 0. The Hessian H = [[2,0],[0,4]] is positive definite, confirming global minimum. Gradient descent must use learning rate < 1/4 (half inverse of largest eigenvalue). The x₂ dimension converges faster because it has higher curvature (4 vs. 2).`,
          `B) ∂f/∂x₁ = 2(x₁−3). ∂f/∂x₂ = 4(x₂+1). Setting both to zero: x₁=3, x₂=−1. The Hessian H = [[2,0],[0,4]] is positive definite (all eigenvalues positive: 2 and 4), confirming this is a strict local minimum (which is also the global minimum since f is a convex sum of quadratics). The minimum value is f(3,−1) = 0. Gradient descent behaviour: the learning rate must be < 1/4 (half the inverse of the largest eigenvalue 4) to converge. With the same learning rate, the x₂ dimension (steeper parabola, curvature 4) takes smaller effective steps than x₁ (curvature 2) — this is the condition number effect (4/2=2 here, mild).`,
          `C) ∂f/∂x₁ = (x₁−3). ∂f/∂x₂ = 2(x₂+1). Setting both to zero: x₁=3, x₂=−1. Minimum value f(3,−1) = 0. The Hessian H = [[1,0],[0,2]] — positive definite. The condition number is 2/1 = 2, so gradient descent converges with at most 2× more steps in the x₁ direction than x₂.`,
          `D) ∂f/∂x₁ = 2x₁−6. ∂f/∂x₂ = 4x₂+4. Setting to zero: x₁=3, x₂=−1. Minimum f(3,−1) = 9+2 = 11, since expanding (x₁−3)² = x₁²−6x₁+9 and 2(x₂+1)² = 2x₂²+4x₂+2 gives f(3,−1) = 0+0+9+2 = 11 at the expanded constant terms.`,
        ],
        answer: `B`,
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
    summary: `Neural networks have millions of parameters arranged as matrices. To train them you need the gradient of a scalar loss with respect to each weight matrix — ∂L/∂W — which is itself a matrix of the same shape as W. The naive way to compute this is to perturb each weight one at a time and measure the change in loss: finite differences. This is correct but costs one forward pass per parameter — completely infeasible for millions of weights. Matrix calculus gives you the analytical shortcut: derive a closed-form expression for ∂L/∂W that can be evaluated in one pass.

The key identity for every linear layer is that ∂L/∂W is the outer product of the upstream gradient and the input activation. This one pattern covers every fully-connected layer in every neural network ever trained. Backpropagation is just this identity applied recursively from output to input via the chain rule. A persistent source of bugs is layout convention: numerator layout vs. denominator layout transpose the Jacobian. Mixing conventions silently produces gradients with the wrong shape, causing training to fail with no obvious error message.`,
    keyPoints: [
      `**Gradient of scalar f with respect to vector x ∈ ℝⁿ is a vector of the same shape: ∂f/∂x ∈ ℝⁿ.** The gradient always lives in the same space as the parameter. This is what makes weight updates well-defined: θ ← θ − η·∂L/∂θ requires both to have the same shape.`,
      `**Jacobian of vector f: ℝⁿ→ℝᵐ is J ∈ ℝ^{m×n} where Jᵢⱼ = ∂fᵢ/∂xⱼ.** Computing the full Jacobian costs O(m·n). Backpropagation never computes the full Jacobian — it computes vector-Jacobian products vᵀJ (upstream gradient times Jacobian), which costs O(n) per layer regardless of m. This is why backprop scales to millions of parameters.`,
      `**Linear layer

$z = Wx + b: ∂L/∂W = (∂L/∂z) · xᵀ — the outer product of the upstream gra$

dient and the input activation. ∂L/∂x = Wᵀ · (∂L/∂z) — the transpose of W times the upstream gradient.** These two identities are all you need to implement backprop for any fully-connected layer from scratch.`,
      `**Key identity ∂(xᵀAx)/∂x = (A + Aᵀ)x = 2Ax when A is symmetric.** Setting this to zero gives the normal equation for least squares: ∂‖y − Xθ‖²/∂θ = −2Xᵀ(y − Xθ) = 0, which yields θ̂ = (XᵀX)⁻¹Xᵀy.`,
      `**Layout convention errors are silent bugs.** Numerator layout (standard in ML): ∂y/∂x has shape of y. Denominator layout transposes. Mixing conventions within a derivation produces a gradient with the right values but the wrong shape — the update step applies it in the wrong direction. Finite-difference checks catch magnitude errors but not transposition errors if you check only the norm.`,
    ],
    checkQuestions: [
      {
        q: `The Jacobian of a function f: ℝⁿ → ℝᵐ at point x is a matrix J. What are its dimensions and what does each element J_{ij} represent?`,
        options: [
          `A) J is m×n. Element J_{ij} = ∂fᵢ/∂xⱼ — the partial derivative of the i-th output with respect to the j-th input. The Jacobian is the best linear approximation to f near x: f(x+δ) ≈ f(x) + J·δ for small δ. Rows correspond to outputs, columns to inputs. For a scalar function (m=1), J reduces to the gradient ∇f — a 1×n row vector (same information as the n×1 column gradient, just transposed). In backpropagation: ∂L/∂x = Jᵀ·(∂L/∂f), where Jᵀ is the transposed Jacobian (vector-Jacobian product, VJP). This VJP is what automatic differentiation libraries compute efficiently using reverse mode — the 'gradient' returned by loss.backward() is the VJP ∂L/∂x for each intermediate variable.`,
          `B) J is n×m. Element J_{ij} = ∂xᵢ/∂fⱼ — how much the j-th output changes the i-th input, measuring the inverse sensitivity. For a scalar loss (m=1), J is a column vector ∈ ℝⁿ. The backpropagation update uses J directly (without transposing) because the gradient flows in the same direction as the Jacobian's column structure.`,
          `C) J is n×m. Element J_{ij} = ∂fⱼ/∂xᵢ. The Jacobian rows correspond to inputs and columns to outputs. For a scalar function (m=1), J is an n×1 column vector identical to the gradient ∇f. In backpropagation, the gradient update ∂L/∂x = J·(∂L/∂f) multiplies the Jacobian directly by the upstream gradient without transposing — a layout convention called denominator layout.`,
          `D) J is m×m — a square matrix regardless of input/output dimensions. Element J_{ij} = ∂fᵢ/∂fⱼ measures how outputs co-vary. The diagonal elements J_{ii} = 1 always (each output is perfectly correlated with itself). Off-diagonal elements capture how changing one output requires changing another, which determines gradient flow between neurons.`,
        ],
        answer: `A`,
      },
      {
        q: `Compute ∂/∂W(tr(WᵀAW)) where A is symmetric n×n and W is n×k.`,
        options: [
          `A) ∂/∂W tr(WᵀAW) = AW + AᵀW = 2AW (since A is symmetric). This follows from the product rule: d(WᵀAW) = (dW)ᵀAW + WᵀA(dW), so tr(d(WᵀAW)) = tr(WᵀA dW) + tr(WᵀA dW) = tr(2WᵀA dW), giving gradient 2AW.`,
          `B) ∂/∂W tr(WᵀAW) = WᵀA + AW. Using the identity ∂tr(XᵀBX)/∂X = (B+Bᵀ)X: here X=W, B=A (symmetric), so gradient = 2AW. But the denominator layout convention gives Wᵀ·A on the left: (WᵀA)ᵀ = AW, so both conventions agree on 2AW.`,
          `C) Let f(W) = tr(WᵀAW). Differentiating: df = tr(d(WᵀAW)) = tr((dW)ᵀAW + Wᵀ A dW) = tr((dW)ᵀAW) + tr(WᵀA dW). For the first term: tr((dW)ᵀAW) = tr(((dW)ᵀAW)ᵀ) = tr(WᵀAᵀdW) = tr(WᵀAdW) (using A=Aᵀ). So df = tr(WᵀA dW) + tr(WᵀA dW) = tr(2WᵀA dW) = tr((2AW)ᵀ dW). By the trace inner product definition: ∂f/∂W = 2AW. This result appears in PCA: the objective is max_W tr(WᵀΣW) subject to WᵀW=I; the unconstrained gradient is 2ΣW, leading (via Lagrange multipliers) to the eigenvector equation ΣW = WΛ.`,
          `D) ∂/∂W tr(WᵀAW) = tr(A)·W. The trace of a product tr(WᵀAW) = tr(A)·tr(WᵀW) when A and WᵀW are both symmetric, so the gradient is tr(A)·∂tr(WᵀW)/∂W = tr(A)·2W.`,
        ],
        answer: `C`,
      },
      {
        q: `What is the gradient of the softmax cross-entropy loss with respect to the pre-softmax logits z? Derive the clean form.`,
        options: [
          `A) ∂L/∂z_k = p_k·(1−p_k) for k=y (true class) and −p_k·p_y for k≠y. This follows from the softmax Jacobian: ∂pᵢ/∂zⱼ = pᵢ(δᵢⱼ−pⱼ). Applying chain rule with ∂L/∂pᵢ = −1/p_y·δᵢy gives the above. The gradient is bounded by the product of probabilities, explaining why softmax prevents gradient saturation for the cross-entropy loss.`,
          `B) ∂L/∂z = −e_y/p_y where e_y is a one-hot vector. The gradient of cross-entropy L = −log(p_y) with respect to z is: ∂L/∂z_k = ∂/∂z_k(−log p_y) = −(1/p_y)·∂p_y/∂z_k. For k=y: ∂p_y/∂z_y = p_y(1−p_y), so ∂L/∂z_y = −(1−p_y). For k≠y: ∂p_y/∂z_k = −p_y·p_k, so ∂L/∂z_k = p_k. In vector form: ∂L/∂z = p − e_y, which is not simply −e_y/p_y.`,
          `C) ∂L/∂z_k = p_k for all k, including the true class k=y. The softmax cross-entropy gradient simply equals the predicted probability vector p because the derivative of log(softmax(z)) with respect to z is (I − 11ᵀ/n)·p in the numerator layout. Setting the gradient to zero means all probabilities must be equal — the uniform distribution is the critical point.`,
          `D) Let z be the logit vector, softmax output p = softmax(z) where pᵢ = e^{zᵢ}/Σⱼe^{zⱼ}. Cross-entropy loss: L = −log(p_y) = −z_y + log(Σⱼe^{zⱼ}) where y is the true class. ∂L/∂z_k: for k=y: ∂/∂z_y(−z_y + log Σe^{zⱼ}) = −1 + e^{z_y}/Σe^{zⱼ} = −1 + p_y = p_y − 1. For k≠y: ∂/∂z_k(log Σe^{zⱼ}) = e^{z_k}/Σe^{zⱼ} = p_k. Combined: ∂L/∂z = p − e_y where e_y is a one-hot vector at class y. The gradient is simply the probability vector minus the one-hot label vector. This clean form (as in logistic regression) arises because the cross-entropy's 1/p derivative cancels with the softmax's p(1−p) Jacobian terms, eliminating saturation problems.`,
        ],
        answer: `D`,
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
      `**Maximum safe learning rate is η = 1/L where L is the smoothness constant (Lipschitz constant of the gradient).** Exceeding 1/L means each gradient step overshoots. The loss can then increase monotonically with each step. Reducing η by 10× and retrying is always the first diagnostic for a diverging loss.`,
      `**Condition number κ = L/μ for strongly convex losses: convergence rate ρ = (κ−1)/(κ+1).** Every step reduces the gap to the optimum by this factor. κ = 1000 means ρ ≈ 0.998 — you need ~2000 steps to reduce the error by 100×. Preconditioning (reducing κ by standardising features or using adaptive optimisers) is the right fix, not just reducing learning rate.`,
      `**SGD noise prevents exact convergence with a fixed learning rate.** Iterates bounce in a noise ball of radius O(η·σ/μ) around the optimum. Learning rate decay (η_t ∝ 1/√t) shrinks this ball over time and allows eventual convergence. Without decay, SGD never settles — useful for escaping sharp minima, bad for final fine-tuning.`,
      `**Momentum accumulates velocity v ← βv − η∇f, θ ← θ + v.** It reduces oscillation perpendicular to the loss valley and accelerates progress along it. Convergence rate improves from O(κ) steps to O(√κ) steps. Nesterov momentum evaluates the gradient at the look-ahead position θ + βv — same O(√κ) rate with a smaller constant.`,
      `**Adam pitfall: Adam converges faster than SGD early in training because adaptive learning rates approximate preconditioning — but it tends to converge to sharper minima.** Sharp minima generalise worse because small perturbations to weights cause large loss increases. Common production pattern: use Adam to reach a good basin quickly, then switch to SGD with small learning rate to settle into a flatter minimum.`,
    ],
    checkQuestions: [
      {
        q: `A function f is convex. You find a local minimum. Prove it is a global minimum.`,
        options: [
          `A) By contradiction: if x* is a local minimum but not global, there exists y with f(y) < f(x*). For small enough λ ∈ (0,1), z = λy+(1−λ)x* lies arbitrarily close to x*. By convexity: f(z) ≤ λf(y)+(1−λ)f(x*) < f(x*). But z is inside the local minimum ball around x* (for small λ), contradicting x* being a local minimum. Therefore no such y exists: x* is global.`,
          `B) Suppose x* is a local minimum of convex f, but not global — there exists y with f(y) < f(x*). Since x* is a local minimum, f(x*) ≤ f(z) for all z in a ball around x*. By convexity of f: for any λ ∈ (0,1), f(λy + (1−λ)x*) ≤ λf(y) + (1−λ)f(x*) < λf(x*) + (1−λ)f(x*) = f(x*). For small enough λ, the point λy + (1−λ)x* is inside the local minimum ball around x* (since it is arbitrarily close to x* as λ→0). But we just showed f(λy + (1−λ)x*) < f(x*), contradicting the fact that x* is a local minimum. Therefore no such y exists, and x* is a global minimum. This is the fundamental reason why convex problems are tractable — no gradient-based algorithm can get permanently trapped.`,
          `C) A local minimum of a convex function is global because convex functions have only one minimum by definition. A function is convex if and only if it has a unique minimiser — the existence of a local minimum proves both that the minimiser exists and that it is unique. The proof follows from the strict convexity of the sublevel sets.`,
          `D) Convexity implies the function has no local minima at all except at the global minimum, because any local minimum immediately satisfies the first-order condition ∇f(x*)=0, and for convex functions ∇f(x*)=0 is both necessary and sufficient for global minimality. Therefore finding a point where the gradient is zero is equivalent to finding the global minimum.`,
        ],
        answer: `B`,
      },
      {
        q: `Gradient descent is given function f(x) = x⁴. The gradient is ∇f = 4x³. Starting from x₀=2.0 with learning rate α=0.1, what is x₁? Does gradient descent converge for this non-strongly-convex function?`,
        options: [
          `A) x₁ = x₀ − α·∇f(x₀) = 2.0 − 0.1·(4·8) = 2.0 − 3.2 = −1.2. Gradient descent converges for f(x)=x⁴, but slowly. The function is convex (f''=12x²≥0) but not strongly convex (f''(0)=0 — the curvature at the minimum is zero). For strongly convex functions, gradient descent converges geometrically (exponential rate). For convex but not strongly convex functions, the rate is O(1/t) — much slower. For f(x)=x⁴, near x=0: x_{t+1} = x_t − 4α·x_t³. Convergence rate analysis shows O(t^{-1/2}) for the final approach. Note: x₁=−1.2 overshoots the minimum (x=0) and becomes negative — the algorithm will still converge but oscillates initially, requiring a small enough α.`,
          `B) x₁ = x₀ − α·∇f(x₀) = 2.0 − 0.1·(4·4) = 2.0 − 1.6 = 0.4. Gradient descent does not converge for f(x)=x⁴ because the function is not strongly convex (the Hessian f''=12x² is zero at x=0). Without strong convexity, gradient descent oscillates around the minimum indefinitely with a fixed learning rate. A decaying learning rate α_t = α/√t is required for convergence.`,
          `C) x₁ = 2.0 − 0.1·(2·2³) = 2.0 − 1.6 = 0.4. Gradient descent converges for any convex function with a bounded Hessian. Since f''(x) = 12x² ≤ 48 for x ∈ [0,2], the smoothness constant L=48 and learning rate 0.1 < 1/L=0.021 is too large — but the step still reduces f from 16 to 0.026, showing rapid convergence.`,
          `D) x₁ = 2.0 − 0.1·(4·2³) = 2.0 − 3.2 = −1.2. Gradient descent diverges for f(x)=x⁴ because x⁴ is not strongly convex. The step overshoots to negative x, then the next gradient 4·(−1.2)³ = −6.9 pushes to x₂ = −1.2 − 0.1·(−6.9) = −0.51, then x₃ diverges. Non-strongly-convex functions always cause gradient descent to diverge unless momentum is added.`,
        ],
        answer: `A`,
      },
      {
        q: `What is a Lagrange multiplier, and how is it used to solve the constrained optimisation problem: min f(x) subject to g(x)=0?`,
        options: [
          `A) A Lagrange multiplier λ is added to the objective: min f(x) + λ·g(x). The parameter λ penalises violations of g(x)=0 — larger λ means stronger enforcement of the constraint. Setting ∂(f+λg)/∂x = 0 and solving for x gives the constrained optimum. λ must be tuned manually or via a dual optimisation loop.`,
          `B) The Lagrange multiplier method converts the constrained problem to unconstrained via: find saddle points of L(x,λ) = f(x) + λ·g(x). Saddle points satisfy ∂L/∂x = 0 and ∂L/∂λ = 0. The second condition ∂L/∂λ = g(x) = 0 automatically enforces the constraint. This method works only when g is linear in x; for nonlinear constraints, KKT conditions with inequality constraints are required instead.`,
          `C) The Lagrangian is L(x,λ) = f(x) + λ·g(x). At a constrained optimum, the KKT conditions must hold: ∇_x L = ∇f(x) + λ∇g(x) = 0 (stationarity) and g(x) = 0 (feasibility). The Lagrange multiplier λ is the sensitivity of the optimal value to the constraint: if we relax g(x)=0 to g(x)=ε, the optimal value changes by approximately −λε. Geometrically: at the optimum, the gradient of f must be parallel to the gradient of g (otherwise, we could move along the constraint surface g=0 to decrease f — contradicting optimality). λ scales ∇g to exactly cancel ∇f. Example: max wᵀΣw s.t. ‖w‖²=1 leads to Σw=λw — the eigenvector equation. The Lagrange multiplier λ is the eigenvalue, which equals the variance in direction w — the quantity being maximized.`,
          `D) A Lagrange multiplier replaces the constraint g(x)=0 with a barrier function B(x) = −μ·log(−g(x)), yielding an unconstrained problem min f(x) + B(x). As μ→0, the barrier enforces the constraint in the limit. Lagrange multipliers are the limiting values of μ at the optimum and measure the constraint's binding force.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `The condition number of the loss landscape — not the learning rate — determines how fast you converge. Standardising features and using adaptive optimisers attack the same underlying problem: reducing the effective condition number. The learning rate is a secondary tuning dial once the landscape is reasonably well-conditioned.`,
  },
  {
    id: 'hypothesis_testing',
    interactiveId: 'hypothesis_testing_viz',
    title: 'Hypothesis Testing',
    subtitle: 'p-values, Type I/II errors, t-test, chi-squared, multiple comparisons',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['statistics', 'hypothesis testing', 'p-values', 'A/B testing'],
    summary: `A business needs to grow, so it tests new features. The status quo is always the null hypothesis — you do not change what is working without evidence. A new feature might perform better by pure chance. You need to quantify: is this result explainable by luck alone? The p-value answers exactly this: it is the probability of observing a result at least as extreme as the one measured, if the null hypothesis were true.

A small p-value means the data is hard to explain by luck alone — grounds to reject the null. It does not prove the alternative is true, and it is not the probability that the null hypothesis is true. Confusing p-value with posterior probability of a hypothesis is the most consequential statistical misunderstanding in applied science. Type I error (false positive) is rejecting the null when it is true; Type II error (false negative) is failing to reject the null when it is false. With large samples, even a 0.001% difference achieves p < 0.001 — statistically significant but practically worthless. Effect size must always accompany p-values. Running 100 tests at α = 0.05 gives 5 expected false positives — multiple comparisons inflate the false discovery rate and require correction.`,
    keyPoints: [
      `**A p-value is not the probability that the null hypothesis is true.** It is P(observing data this extreme | null is true). The failure mode — treating p = 0.03 as "97% confident the alternative is true" — is the prosecutor's fallacy applied to statistics. The correct statement is: "if the null were true, results this extreme would occur 3% of the time."`,
      `**Effect size matters more than statistical significance at large n.** With n = 1,000,000, a 0.001% conversion difference achieves p < 0.001 — statistically significant but practically irrelevant. Always report Cohen's d, odds ratio, or percent lift alongside p-values. Statistical significance answers "is this effect non-zero?"; effect size answers "is this effect worth caring about?"`,
      `**Power = 1 − β = probability of correctly detecting a real effect.** Power is determined before running the test by choosing sample size. Low power means you will miss real effects and incorrectly conclude no effect exists. The sample size formula

$n = 2(z_{α/2} + z_β)²σ²/δ² requires specifying the minimum detecta$

ble effect δ before collecting data — not after seeing results.`,
      `**Multiple comparisons: running k tests each at α = 0.05 gives expected 0.05k false positives.** Bonferroni corrects by using α/k per test — conservative, controls family-wise error rate. Benjamini-Hochberg controls false discovery rate at α and is less conservative, preferred for exploratory feature selection where some false positives are acceptable.`,
      `**Peeking bias: stopping an A/B test as soon as p < 0.05 inflates Type I error far above the nominal α.** The p-value is only valid at the pre-specified stopping time. Sequential testing methods — always-valid p-values, spending functions — allow continuous monitoring without inflating the false positive rate.`,
    ],
    checkQuestions: [
      {
        q: `You run a t-test comparing two groups and get p=0.048. Your colleague says 'we have 95.2% confidence that the effect is real.' What is wrong with this interpretation?`,
        options: [
          `A) The statement is almost correct but uses the wrong confidence level. p=0.048 means 1−p = 95.2% is the confidence that the effect is real. The technically precise statement would be '95% confidence' (using the standard threshold), not '95.2% confidence' — the colleague is incorrectly using the exact complement of the p-value rather than rounding to the nearest standard confidence level.`,
          `B) The colleague's statement is correct for a one-sided test but wrong for the two-sided t-test that was run. For a two-sided test, p=0.048 means 97.6% confidence on each side, giving 95.2% total. The colleague should have said '97.6% confidence that the effect is in the observed direction.'`,
          `C) The statement conflates power and significance. p=0.048 describes the Type I error rate at this threshold, while 95.2% confidence would describe 1−β (power). Power cannot be computed from the p-value alone — it requires the true effect size and sample size. The correct statement would be 'we reject the null at α=0.05,' not a confidence statement about the effect being real.`,
          `D) The p-value is NOT the probability that the null hypothesis is false, nor is it 1 − P(null is true). p=0.048 means: IF the null hypothesis were true (zero effect), there is a 4.8% probability of observing a test statistic as extreme as or more extreme than what we observed, purely by chance. The p-value says nothing about P(H₀ is false) — that requires a prior (Bayesian framework). The correct interpretation: 'If there were truly no effect, we would observe data this extreme or more extreme about 4.8% of the time.' Multiple comparison issues: if you ran 100 tests, you expect ~5 to have p < 0.05 by chance, even if all null hypotheses are true. The colleague's statement confuses frequentist and Bayesian probability — a very common error.`,
        ],
        answer: `D`,
      },
      {
        q: `A clinical trial detects p=0.001 with a treatment effect of 0.2 points on a 100-point quality-of-life scale. N=50,000. Is this finding clinically meaningful? Explain statistical vs practical significance.`,
        options: [
          `A) Statistical significance (p=0.001) and clinical significance are different. With N=50,000, the standard error is SE ≈ σ/√N — very small, so tiny effects produce very small p-values. A 0.2-point improvement on a 100-point scale is 0.2% — far below any clinical threshold of meaningful improvement (typically 5-10 points on quality-of-life scales). The p-value answers 'is the effect nonzero?' — yes. Clinical significance answers 'is the effect large enough to matter?' — no. Report the effect size (Cohen's d = 0.2/σ, likely very small), confidence intervals (CI: [0.15, 0.25] with N=50,000), and domain thresholds. In ML: a 0.1% improvement in accuracy with N=1M test samples may be statistically significant but operationally irrelevant. Always report effect sizes alongside p-values.`,
          `B) Yes, p=0.001 is clinically meaningful because it passes the stringent 0.001 threshold, which is far below the typical 0.05 cutoff. A result significant at p=0.001 has survived a much higher bar than p=0.05, providing three times more evidence of a real effect. The 0.2-point effect size should be reported but does not undermine the statistical significance.`,
          `C) The finding has borderline clinical significance. A 0.2-point improvement is small but not negligible — over N=50,000 patients, the aggregate benefit across the population is 0.2 × 50,000 = 10,000 patient-points of improvement, which is substantial. Population-level impact metrics should supplement individual effect sizes when evaluating clinical trials.`,
          `D) The finding is not statistically significant. p=0.001 means there is a 0.1% chance the result is real — not strong enough for clinical applications which require p < 0.0001 to account for multiple comparison corrections across the many endpoints in a typical trial. The 0.2-point effect size is consistent with a trial that is slightly underpowered.`,
        ],
        answer: `B`,
      },
      {
        q: `You run 20 A/B tests simultaneously. 3 tests show p < 0.05. How many would you expect by chance, and what correction do you apply?`,
        options: [
          `A) Under the null hypothesis (all 20 effects are zero), each test has P(p < 0.05) = 0.05. Expected false positives = 20 × 0.05 = 1. So finding 3 'significant' tests is plausible even if all nulls are true. Bonferroni correction: to maintain family-wise error rate (FWER) at α=0.05, use threshold α/m = 0.05/20 = 0.0025 per test — only a test with p < 0.0025 would be considered significant. This is conservative (controls FWER). Benjamini-Hochberg procedure (FDR correction): ranks p-values p₁≤...≤p₂₀, rejects H_k if p_k ≤ k·α/m. Controls the false discovery rate at α — the expected proportion of significant results that are false positives. In ML/industry A/B testing, FDR correction is standard: a 5% false discovery rate is acceptable when running many experiments simultaneously.`,
          `B) Expected false positives = 20 × 0.05 = 1. Finding 3 significant tests suggests all 3 are likely real — the expected count under null is 1, and the Poisson probability of observing 3 or more by chance when λ=1 is P(X≥3) ≈ 0.08, small enough to conclude at least some tests are detecting real effects. No correction is needed when fewer than 5% of tests are significant.`,
          `C) Expected false positives = 20 × 0.05² = 0.05. Under the null, the probability of any false positive across 20 tests is 1−(1−0.05)²⁰ ≈ 0.64, meaning there is a 64% chance at least one false positive occurs. Finding 3 significant results is more than the 0.05 expected, suggesting all 3 are likely true positives. Bonferroni is only needed when more than 10% of tests are significant.`,
          `D) Expected false positives = 3 × 0.05 = 0.15 — only the 3 significant tests contribute to false positive expectations. The other 17 non-significant tests cannot produce false positives. Bonferroni correction divides the significance threshold by the number of significant tests: 0.05/3 ≈ 0.017. All 3 tests show p < 0.05, not p < 0.017, so after correction none are significant.`,
        ],
        answer: `A`,
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
    summary: `You have data and you need to fit a model. The naive approach is to find the parameters that best explain the data — maximum likelihood estimation (MLE). But with limited data, MLE overfits: it finds parameters that explain the training data perfectly while making wild predictions on new data.

The fix is regularisation: penalise the loss for parameter values that seem implausible. But where do the regularisation terms come from, and how should you choose them? Maximum A Posteriori (MAP) estimation gives a principled answer. MAP finds the parameters most probable given the data:

$θ̂_MAP = argmax P(θ|data) ∝ P(data|θ) × P(θ). The prior P(θ) encodes your belief about parameters b$

efore seeing data. Adding the log prior to the log-likelihood is identical to adding a regularisation term. A Gaussian prior on θ gives L2 regularisation (Ridge); a Laplace prior gives L1 regularisation (Lasso). This reveals that regularisation is not an ad hoc trick — it is a statement about what you believe the model should look like before seeing data. As n → ∞, the data overwhelms the prior and MAP converges to MLE — regularisation should be reduced as sample size grows.`,
    keyPoints: [
      `**MLE:

$θ̂_MLE = argmax_θ Σᵢ log p(xᵢ|θ).** Log-likelihood converts products to$

sums and avoids underflow. For Gaussian data, MLE gives the sample mean (unbiased) and divides by n rather than n−1 for variance (biased). MLE is not always unbiased — it is consistent (converges to the truth as n → ∞) but can be biased in finite samples.`,
      `**MAP = MLE + log prior.** Every regularised ML algorithm has a Bayesian MAP interpretation. You were already encoding prior beliefs through your regularisation choices — MAP just makes those beliefs explicit. The prior is not a Bayesian add-on; it is the thing you were doing all along, unnamed.`,
      `**Gaussian prior N(0, τ²I) on weights produces L2 regularisation: the log prior is −(1/2τ²)‖θ‖², which adds λ‖θ‖² to the loss with

$λ = 1/(2τ²).** The regularisation strength encodes confidence in the prior — large λ means you are confident weights should$

be near zero, small λ means a diffuse prior.`,
      `**Laplace prior on weights produces L1 regularisation: the Laplace distribution has a sharp peak at zero and heavier tails than Gaussian.** It encodes the belief that most weights should be exactly zero with a few allowed to be large — the right prior for genuinely sparse problems like genomics or text feature selection.`,
      `**As n → ∞, the likelihood dominates and MAP → MLE.** This means regularisation should shrink as training data grows — tuning λ via cross-validation on a large dataset naturally selects smaller values. A fixed large λ applied to a large dataset underfits unnecessarily.`,
    ],
    checkQuestions: [
      {
        q: `For a Gaussian likelihood with unknown mean μ and fixed variance σ², derive the MLE estimate for μ given data {x₁,...,xₙ}.`,
        options: [
          `A) MLE: maximise log-likelihood ℓ(μ) = −n/2·log(2πσ²) − (1/2σ²)Σ(xᵢ−μ)². Setting ∂ℓ/∂μ = 0 gives Σ(xᵢ−μ) = 0, so μ_MLE = x̄. This equals the sample mean. The result shows MLE for Gaussian mean equals least squares: minimising Σ(xᵢ−μ)² gives the same estimate. This is why MSE loss corresponds to Gaussian noise assumptions.`,
          `B) Maximise L(μ) = Π (1/√(2πσ²))exp(−(xᵢ−μ)²/(2σ²)). Taking log: ℓ(μ) = const − (1/2σ²)Σ(xᵢ−μ)². Setting ∂ℓ/∂μ = 0: −(1/2σ²)·(−2)Σ(xᵢ−μ) = 0, so Σxᵢ − nμ = 0, giving μ_MLE = (1/n)Σxᵢ = x̄. But this is a biased estimator: E[μ_MLE] = μ−σ²/n due to Jensen's inequality applied to the log. The unbiased estimator requires a Bessel correction: μ_unbiased = x̄·n/(n−1).`,
          `C) L(μ) = Π_{i=1}^n P(xᵢ|μ) = Π (1/√(2πσ²))exp(−(xᵢ−μ)²/(2σ²)). Log-likelihood: ℓ(μ) = −n/2·log(2πσ²) − (1/2σ²)Σ(xᵢ−μ)². Maximise ℓ: ∂ℓ/∂μ = (1/σ²)Σ(xᵢ−μ) = 0. Solving: Σxᵢ − nμ = 0 → μ_MLE = (1/n)Σxᵢ = x̄. The sample mean is the MLE for Gaussian mean. Intuition: maximising log-likelihood is equivalent to minimising the sum of squared deviations Σ(xᵢ−μ)² — so MLE for Gaussian mean = least squares estimate = sample mean. This is why MSE loss is the natural loss for regression assuming Gaussian noise: minimising MSE = maximising Gaussian log-likelihood.`,
          `D) MLE for Gaussian mean requires maximising L(μ) = Π exp(−(xᵢ−μ)²/(2σ²)). The log-likelihood is ℓ(μ) = −Σ(xᵢ−μ)²/(2σ²). This is a concave quadratic in μ. Setting ∂ℓ/∂μ = Σ(xᵢ−μ)/σ² = 0 gives μ_MLE = median({xᵢ}), since the sum of deviations from the median is minimised. The sample mean would be the MLE under a Laplace (L1) likelihood, not Gaussian.`,
        ],
        answer: `C`,
      },
      {
        q: `MLE for a Bernoulli distribution gives P̂(X=1) = (number of 1s)/(total samples). Now add a Beta(α,β) prior. What is the MAP estimate?`,
        options: [
          `A) Likelihood: L(p) = Π pˣⁱ(1−p)^{1−xᵢ} = p^s(1−p)^{n−s} where s = Σxᵢ. Prior: Beta(α,β): π(p) ∝ p^{α−1}(1−p)^{β−1}. Posterior (unnormalised): p^{s+α−1}(1−p)^{n−s+β−1} ~ Beta(s+α, n−s+β). MAP: maximise posterior = maximise log-posterior = maximise (s+α−1)log p + (n−s+β−1)log(1−p). Setting derivative to zero: (s+α−1)/p = (n−s+β−1)/(1−p) → p_MAP = (s+α−1)/(n+α+β−2). Interpretation: the Beta prior adds α−1 pseudo-observations of class 1 and β−1 pseudo-observations of class 0. For uniform prior (α=β=1): MAP = MLE = s/n. For α=β=2: MAP = (s+1)/(n+2) — Laplace smoothing. As n→∞, MAP → MLE regardless of prior.`,
          `B) The Beta posterior has mean (s+α)/(n+α+β), so MAP = mean = (s+α)/(n+α+β). The MAP of a Beta distribution equals its mean because Beta is symmetric around its mean. For α=β=1 (uniform prior), MAP = s/n = MLE. The denominator n+α+β adds α+β pseudo-observations rather than α+β−2, because the normalising constant of the Beta prior contributes 1 pseudo-observation per parameter.`,
          `C) The Beta(α,β) posterior is Beta(s+α, n−s+β). The MAP is the mode: (s+α−1)/(n+α+β−2). This equals MLE + Bayesian correction = s/n + (α−β)/(n(n+α+β−2)). For large n, the correction term vanishes. For α=β, MAP equals MLE exactly at all n — a symmetric prior never biases the MAP estimate.`,
          `D) With Beta(α,β) prior, the posterior is Beta(s+α, n−s+β). The MAP maximises the log-posterior: (s+α)log p + (n−s+β)log(1−p). Setting derivative to zero: (s+α)/p = (n−s+β)/(1−p), giving p_MAP = (s+α)/(n+α+β). This is the posterior mean, not the mode — for Beta distributions the mean and mode always coincide.`,
        ],
        answer: `A`,
      },
      {
        q: `A linear regression model's MSE loss is equivalent to maximum likelihood under what distributional assumption? What assumption does L1 loss correspond to?`,
        options: [
          `A) MSE corresponds to a Uniform likelihood: P(yᵢ|xᵢ,θ) = Uniform(ŷᵢ−ε, ŷᵢ+ε) for some fixed ε. Minimising MSE finds the θ that keeps all residuals within ±ε. L1 loss corresponds to a Gaussian likelihood with heavier tails — specifically, a Student-t distribution with 1 degree of freedom (Cauchy distribution).`,
          `B) MSE loss Σ(yᵢ−ŷᵢ)² = −2σ²·log L(θ) for a Gaussian likelihood P(yᵢ|xᵢ,θ) = N(ŷᵢ, σ²). Minimising MSE is equivalent to maximising Gaussian log-likelihood: L1 loss Σ|yᵢ−ŷᵢ| corresponds to a Laplace likelihood: P(yᵢ|xᵢ,θ) = (1/2b)exp(−|yᵢ−ŷᵢ|/b). Minimising L1 = maximising Laplace log-likelihood. This explains the practical difference: Laplace distribution has heavier tails than Gaussian — it assigns more probability to large residuals. Minimising Laplace log-likelihood (L1) is less penalised by large outliers than Gaussian (L2). L1 loss produces median regression (the optimal prediction minimising E[|y−ŷ|] is the median), while L2 produces mean regression (optimal prediction minimising E[(y−ŷ)²] is the mean).`,
          `C) MSE corresponds to Gaussian noise with variance proportional to ŷᵢ (heteroskedastic): P(yᵢ|xᵢ,θ) = N(ŷᵢ, |ŷᵢ|·σ²). This is why MSE is unstable for regression near zero — the likelihood is undefined when ŷᵢ=0. L1 loss corresponds to constant-variance Gaussian noise P(yᵢ|xᵢ,θ) = N(ŷᵢ, σ²), which is more robust because it does not assume variance scaling with the prediction.`,
          `D) MSE corresponds to Gaussian noise P(yᵢ|xᵢ,θ) = N(ŷᵢ, σ²) only when the noise is additive and independent. L1 loss corresponds to a Poisson likelihood: P(yᵢ|xᵢ,θ) = exp(−ŷᵢ)ŷᵢ^{yᵢ}/yᵢ!, which is appropriate for count data. L1 is more robust than MSE because Poisson has lighter tails than Gaussian, assigning less probability to large residuals.`,
        ],
        answer: `B`,
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
      `**Posterior ∝ likelihood × prior.** The normalising constant P(data) = ∫ P(data|θ)P(θ)dθ is the marginal likelihood — rarely tractable because the integral is over all possible parameter values. MCMC exploits the fact that acceptance ratios in Metropolis-Hastings cancel this constant, making exact posterior sampling possible without computing it.`,
      `**Conjugate prior: Beta-Binomial, Dirichlet-Multinomial, Normal-Normal, Gamma-Poisson.** Conjugacy gives closed-form sequential updates: observe data, update the hyperparameters algebraically. Beta(α, β) updated with k successes from n trials gives Beta(α+k, β+n−k). α and β act as pseudo-counts. Conjugate updates are the only Bayesian inference that scales to real-time streaming.`,
      `**Posterior predictive P(x_new|X) = ∫ P(x_new|θ)P(θ|X)dθ averages predictions over the full posterior rather than using a point estimate.** It gives wider, more honest uncertainty than a MAP prediction. The posterior predictive is what a calibrated Bayesian model actually reports — not the mode of the posterior.`,
      `**MCMC: Metropolis-Hastings proposes θ' from a proposal q(θ'|θ) and accepts with probability min(1, P(θ'|X)q(θ|θ')/[P(θ|X)q(θ'|θ)]).** The ratio of posteriors cancels the intractable denominator P(X). Diagnosis: R-hat ≈ 1 across multiple chains, effective sample size (ESS) large relative to chain length, trace plots that look like fuzzy caterpillars.`,
      `**Variational inference approximates the posterior P(θ|X) with a tractable distribution q(θ) by minimising KL(q‖P(θ|X)) = maximising the ELBO.** It is faster than MCMC but biased: reverse KL causes q to collapse to a single mode of the true posterior, missing multimodality. VAEs use variational inference where the encoder is the approximate E-step.`,
    ],
    checkQuestions: [
      {
        q: `You have posterior P(θ|data) ∝ N(θ; 2, 1) × N(θ; 4, 1). What is the posterior distribution?`,
        options: [
          `A) The product of N(θ;2,1) and N(θ;4,1) gives N(θ; 3, 2) — averaging the means and summing the variances. When multiplying two Gaussians, variances add: σ*² = σ₁² + σ₂² = 1+1 = 2, and the mean is the arithmetic average: μ* = (μ₁+μ₂)/2 = (2+4)/2 = 3. The posterior is N(θ; 3, 2).`,
          `B) The product is N(θ; 6, 0.5) — means multiply and variances halve. When combining two evidence sources, the posterior has mean μ₁·μ₂/sum and variance σ₁²·σ₂²/(σ₁²+σ₂²) = 0.5. The posterior mean 6 reflects the combined information from both observations.`,
          `C) The product of two Gaussians N(μ₁,σ₁²) and N(μ₂,σ₂²) is N(μ*, σ*²) where σ*² = σ₁²+σ₂² = 2 and μ* = μ₁+μ₂ = 6. The posterior is N(θ; 6, 2). Multiplying distributions adds their sufficient statistics: means add and variances add for the natural parameterisation of the Gaussian family.`,
          `D) Multiplying two Gaussians: P(θ|data) ∝ N(θ;2,1)·N(θ;4,1) = exp(−(θ−2)²/2)·exp(−(θ−4)²/2) = exp(−[(θ−2)²+(θ−4)²]/2). Expand: (θ−2)²+(θ−4)² = 2θ²−12θ+20 = 2(θ−3)²+2. So P(θ|data) ∝ exp(−(θ−3)²/1) = N(θ; 3, 1/2). The product of N(μ₁,σ₁²) and N(μ₂,σ₂²) is (unnormalised) N(μ*, σ*²) where 1/σ*² = 1/σ₁²+1/σ₂² = 1+1 = 2, so σ*²=1/2; and μ* = σ*²(μ₁/σ₁²+μ₂/σ₂²) = (1/2)(2+4) = 3. The posterior is the precision-weighted average of the two means. This is the Bayesian update rule: the posterior mean is a weighted average of prior and likelihood, with weights proportional to precision (1/variance).`,
        ],
        answer: `D`,
      },
      {
        q: `Why is exact Bayesian inference intractable for most modern ML models, and what are the two main families of approximate inference methods?`,
        options: [
          `A) Exact inference is intractable because modern ML models have discrete latent variables (classes, clusters, tokens) that create a combinatorial explosion in the sum P(data) = Σ P(data|θ)P(θ). Two families: (1) Gibbs sampling: sample each latent variable conditioned on all others — tractable for discrete variables but requires conjugate conditionals. (2) Mean-field approximation: approximate the posterior as a product of independent distributions, which decouples the combinatorial sum into a product of simpler sums.`,
          `B) Exact inference is intractable because neural network likelihoods P(data|θ) are non-differentiable due to ReLU activations. Two families: (1) Smooth approximation methods: replace ReLU with differentiable activations (sigmoid, ELU) to make the posterior tractable. (2) Ensemble methods: approximate the posterior by training multiple networks and averaging their predictions — each network is a sample from an implicit posterior.`,
          `C) Exact inference requires computing the normalising constant P(data) = ∫ P(data|θ)P(θ)dθ — the marginal likelihood (or evidence). For neural networks with millions of parameters, this integral is over a million-dimensional space with a complex, multimodal integrand. Monte Carlo methods could approximate it, but the dimensionality makes naïve Monte Carlo require exponentially many samples. Two approximate inference families: (1) MCMC (Markov Chain Monte Carlo): construct a Markov chain whose stationary distribution is the posterior. Samples θ₁,...,θT from the chain represent the posterior. Asymptotically exact but computationally heavy — impractical for large models. (2) Variational inference (VI): approximate the posterior with a tractable family q_φ(θ) (e.g., factorised Gaussian), minimise D_KL(q||P(·|data)) (reverse KL). Scales to large models (used in VAEs). Fast but introduces approximation error and may miss multimodality.`,
          `D) Exact inference is intractable only for non-conjugate priors. With conjugate priors (Beta-Binomial, Normal-Normal, Dirichlet-Multinomial), the posterior is always tractable. For non-conjugate models, two families exist: (1) Laplace approximation: fit a Gaussian to the posterior mode — second-order Taylor expansion of the log-posterior. (2) Expectation propagation: match moments of the true posterior with a tractable family iteratively.`,
        ],
        answer: `C`,
      },
      {
        q: `What is a conjugate prior? Give one example and explain why conjugacy is computationally useful.`,
        options: [
          `A) A conjugate prior is a distribution from the same exponential family as the likelihood. Formally: if likelihood P(data|θ) is in the exponential family and prior P(θ) has the same base measure, the posterior is in the same exponential family. Example: Gaussian prior + Gaussian likelihood → Gaussian posterior. Computational usefulness: (1) Closed-form posterior via natural parameter updates. (2) Sequential updating: each observation updates the natural parameter vector additively. (3) The marginal likelihood is always the ratio of normalising constants — computable analytically.`,
          `B) A conjugate prior is a distribution where the posterior has the same functional form as the prior. Formally: if prior P(θ) is in family F and likelihood P(data|θ) is some function of θ, and the posterior P(θ|data) ∝ P(data|θ)P(θ) is also in family F, then F is conjugate to that likelihood. Example: Beta prior + Bernoulli likelihood → Beta posterior. Prior: Beta(α,β); likelihood Bernoulli(p)^s(1−p)^{n−s}; posterior: Beta(s+α, n−s+β) — still a Beta distribution. Computational usefulness: (1) Closed-form posterior — no numerical integration needed. (2) Sequential updating: each new observation just updates the Beta parameters (add to α or β count). (3) Analytic MAP/mean: Beta(α,β) has mean α/(α+β) and mode (α−1)/(α+β−2). No sampling or variational inference required. Conjugate priors are rare for complex models but essential in Bayesian filtering (Kalman filter uses Gaussian conjugacy) and topic models (Dirichlet conjugacy with Multinomial).`,
          `C) A conjugate prior is a prior that is invariant under the likelihood — P(θ|data) = P(θ) when data provides no information. The term 'conjugate' refers to the dual relationship between the prior and likelihood: the prior is conjugate if multiplying by the likelihood leaves the distribution in the same family. Example: any distribution is conjugate to a uniform likelihood — since the posterior equals the prior when the likelihood is flat. True conjugacy (where the posterior has updated hyperparameters) occurs only for the Gaussian-Gaussian pair.`,
          `D) A conjugate prior requires the posterior to be a scaled version of the prior — P(θ|data) = c·P(θ) for some normalising constant c that depends only on data. This means conjugate priors are always proper (integrable) distributions because c is finite. Example: Gamma prior + Poisson likelihood → Gamma posterior with updated rate and shape parameters. Computational usefulness: the update rule is c = P(data) — the marginal likelihood — which provides a free estimate of model evidence at no extra cost.`,
        ],
        answer: `B`,
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
      `**Why direct maximisation fails: log Σ_Z P(X,Z|θ) cannot be decomposed because the log is outside the sum.** Taking the gradient gives an expression involving P(Z|X,θ), which depends on θ in a complex way — no closed-form solution exists for most models. EM avoids this by working with the complete-data log-likelihood log P(X,Z|θ), which does factorise cleanly.`,
      `**E-step: compute Q(θ|θ_old) = E_{Z|X,θ_old}[log P(X,Z|θ)].** Replace the unknown Z with its posterior distribution under the current θ — this is the "expectation" in Expectation-Maximisation. For exponential family models, the E-step reduces to computing sufficient statistics weighted by the posterior over Z.`,
      `**M-step:

$θ_new = argmax_θ Q(θ|θ_old).** With Z treated as known (but un$

certain), the complete-data log-likelihood factorises and maximisation has a closed form for exponential family models. The M-step is just weighted maximum likelihood.`,
      `**EM for GMM: E-step computes soft responsibilities rᵢₖ = P(zᵢ = k | xᵢ, θ) — how much does cluster k explain point i?** M-step updates μₖ, Σₖ, πₖ as responsibility-weighted means and covariances. This is soft k-means: points are not hard-assigned to clusters but distributed across them according to proximity.`,
      `**EM converges to local optima.** Different initialisations yield different solutions. Standard practice: run EM 10+ times with random restarts, keep the solution with the highest marginal log-likelihood. Singularity problem in GMM: a cluster can collapse to a single data point with Σₖ → 0, giving infinite likelihood — add a minimum variance floor or use a Bayesian GMM with an Inverse-Wishart prior.`,
    ],
    checkQuestions: [
      {
        q: `In the EM algorithm for Gaussian Mixture Models (GMMs), what are the E-step and M-step doing concretely?`,
        options: [
          `A) E-step: assign each data point to the nearest cluster centroid using Euclidean distance — this is the hard assignment step. M-step: update each cluster's mean to the centroid of its assigned points. The EM algorithm for GMMs reduces to k-means when the covariances are all fixed to the identity and mixing weights are equal. The 'expectation' in EM refers to the expected distance to each centroid.`,
          `B) E-step (Expectation): compute the soft assignment (responsibility) of each data point xᵢ to each cluster k: r_{ik} = P(z=k|xᵢ,θ_current) = πₖN(xᵢ;μₖ,Σₖ) / Σⱼ πⱼN(xᵢ;μⱼ,Σⱼ). The responsibilities are a soft version of cluster assignment — each point is 'partly' in each cluster. M-step (Maximisation): update parameters to maximise the expected log-likelihood given responsibilities: new mixture weight πₖ = (Σᵢr_{ik})/n; new mean μₖ = Σᵢr_{ik}xᵢ / Σᵢr_{ik} (weighted mean); new covariance Σₖ = Σᵢr_{ik}(xᵢ−μₖ)(xᵢ−μₖ)ᵀ / Σᵢr_{ik} (weighted covariance). EM is a coordinate ascent: E-step optimises over latent variable posterior (responsibilities), M-step optimises over parameters — both steps monotonically increase the marginal log-likelihood.`,
          `C) E-step: compute the marginal likelihood P(xᵢ|θ) = Σₖ πₖN(xᵢ;μₖ,Σₖ) for each data point — this is the 'expectation' over the mixture. M-step: maximise the total log-likelihood log Πᵢ P(xᵢ|θ) by taking gradients with respect to μₖ, Σₖ, πₖ and applying gradient ascent. EM is distinct from gradient ascent in that it computes exact updates for each parameter rather than approximate gradient steps.`,
          `D) E-step: initialise responsibilities r_{ik} = 1/k uniformly for all points and clusters — this is the uninformative starting point. M-step: update parameters using the current responsibilities, then return to the E-step. The 'expectation' refers to initialising with equal expectations about cluster membership. After the first M-step, subsequent E-steps compute proper posterior responsibilities.`,
        ],
        answer: `B`,
      },
      {
        q: `EM guarantees that the log-likelihood is non-decreasing at each step. Prove this using Jensen's inequality.`,
        options: [
          `A) The log-likelihood is non-decreasing because the M-step maximises the complete-data log-likelihood Q(θ,θ_old) ≥ Q(θ_old,θ_old), and by the data processing inequality, maximising Q can never decrease the marginal log-likelihood log P(X|θ). Jensen's inequality ensures that log E[P(X,Z|θ)] ≥ E[log P(X,Z|θ)], which bounds the improvement from below.`,
          `B) The M-step finds θ_new = argmax Q(θ,θ_old), so Q(θ_new,θ_old) ≥ Q(θ_old,θ_old). Since log P(X|θ) = Q(θ,θ_old) + H(θ,θ_old) where H is always constant (independent of θ by definition of the E-step), log P(X|θ_new) ≥ log P(X|θ_old). The proof does not use Jensen's inequality — it only requires the M-step to find a non-decreasing point.`,
          `C) The non-decreasing property follows from the concavity of log: log P(X|θ) = log Σ_Z P(X,Z|θ). By Jensen's inequality applied to the concave log function: log Σ_Z P(X,Z|θ) ≥ Σ_Z log P(X,Z|θ) · P(Z|X,θ_old) = Q(θ,θ_old). This lower bound is tight when P(Z|X,θ) = P(Z|X,θ_old) exactly — achieved at θ=θ_old. The M-step increases Q which raises the lower bound, but this alone does not prove log P(X|θ_new) ≥ log P(X|θ_old) without accounting for how the bound changes at θ_new vs θ_old.`,
          `D) At step t with parameters θ_old, define Q(θ,θ_old) = E_{z|x,θ_old}[log P(x,z|θ)] (expected complete-data log-likelihood). E-step computes this expectation; M-step finds θ_new = argmax_θ Q(θ,θ_old). The log-likelihood decomposes: log P(x|θ) = Q(θ,θ_old) − H(θ,θ_old) where H(θ,θ_old) = E_{z|x,θ_old}[log q(z|x,θ_old)/P(z|x,θ)] is a KL divergence. By Jensen (log is concave): log P(x|θ) = log Σ_z P(x,z|θ) ≥ Σ_z q(z)log(P(x,z|θ)/q(z)) (ELBO). The E-step tightens this bound (sets q(z) = P(z|x,θ_old), making it exact). The M-step maximises the lower bound. Since θ_new maximises Q and Q(θ_old,θ_old) = the current ELBO, log P(x|θ_new) ≥ log P(x|θ_old). The likelihood is non-decreasing.`,
        ],
        answer: `D`,
      },
      {
        q: `EM converges, but the solution is often a local optimum. What strategies help escape poor local optima in practice?`,
        options: [
          `A) EM converges to a local maximum of the log-likelihood or a saddle point — not necessarily global. The landscape for GMMs has many local optima corresponding to different cluster assignments. Strategies: (1) Multiple random restarts: run EM from k different random initialisations; keep the solution with highest final log-likelihood. (2) K-means++ initialisation: use the k-means++ seeding procedure (choosing initial centroids proportional to distance from already-chosen centroids) for the initial μₖ — this spreads initial cluster centers and avoids degenerate starting configurations. (3) Annealing: start EM with high covariances (broad clusters) and gradually reduce — allows the algorithm to merge/split clusters before converging to a local structure. (4) Split-and-merge EM: periodically split a cluster with high variance and merge two similar clusters. (5) Increase k and prune: start with more clusters than needed, use BIC/AIC to select the optimal k after convergence.`,
          `B) EM only converges to local optima when the number of components k is misspecified. The correct strategy is: first determine the true k using BIC/AIC on a range of values, then run EM once with the optimal k. With the correct k, EM always converges to the global optimum because the log-likelihood landscape for correctly-specified GMMs is log-concave.`,
          `C) The primary strategy is gradient-based correction: after EM converges, run a few steps of full gradient ascent on log P(X|θ) to escape the local optimum. EM is a lower-bound maximiser that may stop at non-stationary points; gradient ascent detects these by checking if ‖∇log P(X|θ)‖ > ε and continues climbing if so.`,
          `D) Local optima in EM are unavoidable and not problematic in practice because all local optima of GMM log-likelihood correspond to valid, interpretable cluster solutions. The global optimum is only preferable from a statistical standpoint — in applications, multiple local solutions provide useful ensemble predictions by capturing different clusterings of the data.`,
        ],
        answer: `A`,
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
      `**Markov inequality: P(X ≥ t) ≤ E[X]/t for non-negative X.** It requires only a finite mean — so it works for heavy-tailed distributions where Chebyshev fails. The cost is looseness: Chebyshev is typically 10× tighter when variance is finite. Markov is the fallback of last resort.`,
      `**Chebyshev: P(|X − μ| ≥ t) ≤ Var(X)/t².** Requires finite variance, gives polynomial decay in t. This is the mechanism behind the weak law of large numbers: sample variance Var(X)/n → 0 as n → ∞, concentrating the sample mean around μ.`,
      `**Hoeffding's inequality: for bounded iid Xᵢ ∈ [aᵢ, bᵢ], P(|X̄ − μ| ≥ ε) ≤ 2 exp(−2n²ε²/Σ(bᵢ−aᵢ)²).** Exponential decay — the probability of a large deviation shrinks exponentially fast with n. Requires bounded support; does not apply to unbounded losses (regression with Gaussian noise). For binary classification losses in [0,1], it applies directly.`,
      `**Union bound + Hoeffding gives the PAC generalisation bound: P(sup_h |R̂(h) − R(h)| ≥ ε) ≤ 2|H|exp(−2nε²).** With probability 1−δ, all hypotheses have generalisation gap ≤ √(log(2|H|/δ)/(2n)). The gap shrinks as O(1/√n) — doubling data improves the bound by √2; squaring the hypothesis class adds only a constant to the log.`,
      `**Double descent: modern overparameterised networks have VC dimension far exceeding n yet generalise in practice.** Classical bounds are vacuous (gap > 1). The true regularisation comes from gradient descent implicitly finding the minimum-norm interpolating solution — a bias not captured by VC dimension. PAC-Bayes bounds over posteriors on hypotheses give tighter results for networks trained with SGD.`,
    ],
    checkQuestions: [
      {
        q: `You sample 1000 values from a distribution with mean 5 and variance 4. Using Chebyshev's inequality, bound P(|X̄ − 5| ≥ 0.5).`,
        options: [
          `A) Apply Chebyshev to the raw variable X (not the mean): P(|X−5| ≥ 0.5) ≤ Var(X)/0.5² = 4/0.25 = 16. This bound exceeds 1 so it is trivially satisfied. The sample mean X̄ is not the right quantity — Chebyshev applies to single observations, not averages, so n=1000 does not help unless we know the distribution family.`,
          `B) Chebyshev applied to X̄: P(|X̄ − μ| ≥ ε) ≤ Var(X̄)/ε² = (σ²/n)/ε². With σ²=4, n=1000, ε=0.5: Var(X̄) = 4/1000 = 0.004. Bound = 0.004/0.25 = 0.016. But Chebyshev requires the distribution to be symmetric, so for general distributions the correct bound doubles: P(|X̄ − 5| ≥ 0.5) ≤ 0.032 = 3.2%.`,
          `C) X̄ is the sample mean of n=1000 i.i.d. samples. By LLN, E[X̄] = μ = 5. Var(X̄) = σ²/n = 4/1000 = 0.004. Chebyshev applied to X̄: P(|X̄ − μ| ≥ ε) ≤ Var(X̄)/ε² = 0.004/0.25 = 0.016. So P(|X̄ − 5| ≥ 0.5) ≤ 0.016 = 1.6%. The true probability (for normal or near-normal distributions) would be much smaller, but Chebyshev requires no distributional assumptions beyond finite variance — a distribution-free bound. The key insight: averaging reduces variance by 1/n, so concentration around the mean improves as n grows. The bound scales as σ²/(n·ε²) — to halve the error bound, quadruple n or halve ε.`,
          `D) P(|X̄ − 5| ≥ 0.5) ≤ 2·exp(−2nε²/range²). We need the range of X. Without knowing the range, we cannot apply Chebyshev — only Hoeffding, which requires bounded support. Chebyshev only applies to individual observations X, not to sample means X̄. For sample means, Hoeffding's inequality is the correct tool.`,
        ],
        answer: `C`,
      },
      {
        q: `Hoeffding's inequality gives a tighter bound than Chebyshev for bounded random variables. Why? What is the bound on P(|X̄ − E[X̄]| ≥ ε) for n i.i.d. Xᵢ ∈ [0,1]?`,
        options: [
          `A) Hoeffding's bound for n i.i.d. Xᵢ ∈ [0,1]: P(|X̄ − E[X̄]| ≥ ε) ≤ 2exp(−2n·ε²). Chebyshev would give: P ≤ Var(X̄)/ε² = σ²/(n·ε²) where σ² ≤ 1/4 for bounded [0,1] variables, so P ≤ 1/(4n·ε²). Hoeffding's bound is exponential in n, while Chebyshev is polynomial in n. For n=100, ε=0.1: Hoeffding ≤ 2exp(−2)≈0.27; Chebyshev ≤ 1/(4·100·0.01)=0.25 — similar here. For n=1000, ε=0.1: Hoeffding ≤ 2exp(−20)≈4×10⁻⁸; Chebyshev ≤ 2.5×10⁻³. The exponential dominates for large n. Why Hoeffding is tighter: it uses the boundedness condition more strongly than just variance — the MGF of bounded variables is more constrained than what Markov/Chebyshev assume.`,
          `B) Hoeffding's bound for Xᵢ ∈ [0,1]: P(|X̄ − E[X̄]| ≥ ε) ≤ exp(−n·ε²/2). Chebyshev's bound is 1/(4nε²). For n=1000, ε=0.1: Hoeffding ≤ exp(−5) ≈ 0.0067; Chebyshev ≤ 0.0025. Chebyshev is tighter in this regime because it uses variance information (σ² ≤ 1/4 exactly), while Hoeffding uses only range information (width = 1). Hoeffding's advantage appears only for very large n or very small ε.`,
          `C) Hoeffding's bound: P(|X̄ − E[X̄]| ≥ ε) ≤ 2exp(−nε²). This is tighter than Chebyshev P ≤ σ²/(nε²) ≤ 1/(4nε²) for all n. At n=50, ε=0.1: Hoeffding ≤ 2exp(−0.5)≈1.21 > 1 (vacuous). Chebyshev ≤ 0.5 (tighter). Hoeffding is tighter only when 2exp(−nε²) < 1/(4nε²), which requires n > log(8nε²)/ε² — roughly n > 100 for ε=0.1. The 2n factor in Hoeffding is the key difference from the correct formula.`,
          `D) Hoeffding's bound equals Chebyshev's bound for variables in [0,1]: both give P ≤ 1/(4nε²). The difference is that Hoeffding's bound is exact (an equality, not inequality) while Chebyshev's is a loose upper bound. Hoeffding's is 'tighter' in the sense of being achievable by Bernoulli(0.5) variables, while Chebyshev can never be achieved — the Paley-Zygmund inequality gives the achievable lower bound on P.`,
        ],
        answer: `A`,
      },
      {
        q: `The VC dimension of linear classifiers in ℝ² is 3. What does this mean, and how does VC dimension connect to generalisation bounds?`,
        options: [
          `A) VC dimension 3 means linear classifiers in ℝ² can separate at most 3 data points perfectly. With more than 3 points, there exists some configuration that cannot be classified correctly — this is the fundamental limit of linear models. The generalisation bound says: test error ≤ train error + C/√n where C depends on VC dimension.`,
          `B) VC dimension 3 means: (1) there exist 3 points that can be shattered (classified in all 2³=8 possible ways by some linear classifier), and (2) no set of 4 points can be shattered. The 3 points are any three non-collinear points in ℝ²: any labeling ±1 of these three points corresponds to a halfspace that separates them correctly. Four points cannot all be shattered because XOR patterns cannot be implemented by a linear classifier. Generalisation bound (Vapnik-Chervonenkis): with probability ≥1−δ over training sample of size n: test error ≤ train error + √(d·log(2n/d) + log(4/δ))/√n, where d is the VC dimension. The bound says: larger VC dimension (more expressive class) requires more data n for the generalisation gap to be small. This gives the classical statistical learning theory tradeoff: complex models need large n to generalise.`,
          `C) VC dimension 3 means linear classifiers require at least 3 training examples to be fully specified. With fewer than 3 points, the classifier is underdetermined and multiple decision boundaries are consistent with the training data. With exactly 3 non-collinear points, the linear boundary is uniquely determined up to a scale factor. The generalisation bound: with 3 degrees of freedom, you need at least n=3/ε² examples to achieve ε test error.`,
          `D) VC dimension 3 means the growth function m_H(n) = O(n³) — the number of distinct labelings achievable on n points is at most polynomial of degree 3. For n ≤ 3, the growth function equals 2ⁿ (exponential). For n > 3, the polynomial bound kicks in. The Sauer-Shelah lemma: m_H(n) ≤ (en/d)^d where d is VC dimension. The generalisation bound uses log(m_H(n))/n → 0, guaranteeing uniform convergence.`,
        ],
        answer: `B`,
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
      `**Monte Carlo error σ/√N is independent of dimension.** Numerical quadrature in d dimensions needs Nᵈ points for the same accuracy — exponential in d. Monte Carlo needs the same N regardless of d. This dimension-independence is the entire justification for using Monte Carlo in variational inference, policy gradients, and any high-dimensional expectation.`,
      `**Importance sampling: E_p[f(X)] = E_q[f(X) · p(X)/q(X)].** Draw xᵢ ~ q, compute weighted average with weights w(x) = p(x)/q(x). This allows estimating expectations under p without ever sampling from p. The requirement: q must have support covering wherever f(x)p(x) is large.`,
      `**IS weight explosion: if q has lighter tails than p, weights p(x)/q(x) become enormous in the tails — producing an unbiased but astronomically high-variance estimator.** Effective sample size

$ESS = (Σwᵢ)²/Σwᵢ² diagnoses this: ESS much smaller than N$

means a few samples dominate the estimate. The fix: use a heavier-tailed proposal, or use self-normalised IS.`,
      `**MCMC: Metropolis-Hastings proposes θ' from q(θ'|θ), accepts with min(1, p(θ')q(θ|θ')/[p(θ)q(θ'|θ)]).** The ratio p(θ')/p(θ) cancels the normalising constant — you only need to evaluate the unnormalised posterior. This is why MCMC works for Bayesian inference where the posterior is only known up to the intractable marginal likelihood.`,
      `**Policy gradient in RL uses the log-derivative trick: ∇E[R(τ)] = E[R(τ) ∇log π(τ)].** This converts a gradient through an expectation into an expectation of a gradient — computable by Monte Carlo rollouts. Variance is high because trajectory returns vary enormously. Baseline subtraction E[(R(τ) − b) ∇log π(τ)] is unbiased (E[b ∇log π] = 0) but drastically reduces variance.`,
    ],
    checkQuestions: [
      {
        q: `Estimate ∫₀¹ √x dx using Monte Carlo with n=1000 samples. Describe the algorithm and the expected error.`,
        options: [
          `A) Algorithm: (1) Sample xᵢ ~ Uniform(0,1) for i=1,...,1000. (2) Estimate Î = (1/1000)Σᵢ√xᵢ. True value: ∫₀¹ √x dx = 2/3 ≈ 0.667. Error: SE = σ/√n. But σ² = Var(√U) = E[U] − (E[√U])² = 1/2 − 4/9 = 1/18, so SE ≈ 0.236/√1000 ≈ 0.0075. However, this is the standard Monte Carlo estimator; the hit-or-miss estimator (uniform sampling in [0,1]×[0,1] and checking if y ≤ √x) has worse efficiency: SE ≈ 0.015.`,
          `B) Algorithm: (1) Draw n=1000 points (xᵢ,yᵢ) ~ Uniform([0,1]²). (2) Count hits where yᵢ ≤ √xᵢ. (3) Estimate Î = hits/n. True value = 2/3. This hit-or-miss approach is equivalent to the expectation estimator but uses more samples for the same accuracy. SE ≈ √(p(1−p)/n) ≈ √(0.667·0.333/1000) ≈ 0.015 — about twice the error of the direct expectation estimator.`,
          `C) Algorithm: (1) Evaluate √xᵢ at n=1000 equally spaced xᵢ = i/1000. (2) Estimate Î = (1/1000)Σᵢ√(i/1000). This is a Riemann sum, not Monte Carlo. Error is O(1/n) rather than O(1/√n) — deterministic quadrature is more accurate than Monte Carlo in 1D. Monte Carlo's advantage (dimension-independence) only emerges in high dimensions d ≥ 3.`,
          `D) Algorithm: (1) Draw Uᵢ ~ Uniform(0,1) for i=1,...,1000. (2) Compute estimate Î = (1/1000)Σᵢ√Uᵢ. This works because ∫₀¹ √x dx = E[√U] for U~Uniform(0,1), and by LLN, the sample mean Î → E[√U] as n→∞. True value: ∫₀¹ x^{1/2}dx = [2x^{3/2}/3]₀¹ = 2/3 ≈ 0.667. Expected error: standard error ≈ σ/√n where σ² = Var(√U) = E[U] − (E[√U])² = 1/2 − 4/9 = 1/18. So σ ≈ 0.236, and SE ≈ 0.236/√1000 ≈ 0.0075. The estimate will be within ±0.015 (2 SE) with 95% probability. Monte Carlo error scales as O(1/√n) regardless of dimension — this dimension-independence is the key advantage over quadrature methods whose error scales as O(n^{-k/d}) in d dimensions.`,
        ],
        answer: `D`,
      },
      {
        q: `What is importance sampling, and when is standard Monte Carlo estimation inefficient?`,
        options: [
          `A) Importance sampling is a variance reduction technique that evaluates f(x) at strategically chosen points rather than random points. Instead of sampling xᵢ ~ p, you choose evaluation points at the quantiles of p, giving a deterministic quadrature rule that achieves O(1/n) convergence rather than Monte Carlo's O(1/√n). The 'importance' weights w(x) = 1/p(x) correct for the uneven spacing of quantile points.`,
          `B) Standard MC estimates E_p[f(x)] = (1/n)Σf(xᵢ) where xᵢ~p. This is inefficient when: (1) f(x) is nonzero only in a rare region that p rarely samples (e.g., P(catastrophic failure) where p=typical system operation); (2) p is hard to sample from but we can evaluate it. Importance sampling: introduce a proposal q from which we can sample easily. E_p[f(x)] = ∫f(x)p(x)dx = ∫f(x)(p(x)/q(x))q(x)dx = E_q[f(x)·p(x)/q(x)]. Estimate: Î = (1/n)Σᵢf(xᵢ)·p(xᵢ)/q(xᵢ) where xᵢ~q. The weight w(x)=p(x)/q(x) upweights rare-under-q regions. Optimal q: q*(x) ∝ |f(x)|·p(x) — concentrates samples where the integrand is large. IS can dramatically reduce variance if q is well-chosen but can diverge (infinite variance) if q has lighter tails than p·f — a critical failure mode when q underestimates the tails of p.`,
          `C) Importance sampling is equivalent to stratified sampling: partition the sample space into strata, sample from each stratum with probability proportional to the stratum's importance weight. Standard MC is inefficient when the integrand is multimodal — each mode requires a separate sample stratum. The importance weights w(x) = p(x)/q(x) must sum to n for the estimator to be unbiased.`,
          `D) Standard MC is always efficient when n is large enough. Importance sampling is a bias-correction technique for cases where the sampler introduces systematic bias — for example, when using MCMC with a non-stationary proposal or when sampling from a truncated distribution. The weights p(x)/q(x) correct for the bias by reweighting samples from q to match the target p.`,
        ],
        answer: `B`,
      },
      {
        q: `MCMC sampling converges to the target distribution. What does 'convergence' mean technically, and what is the burn-in period?`,
        options: [
          `A) Convergence means the chain's acceptance rate approaches a constant — the Metropolis-Hastings acceptance probability stabilises as the chain explores the target. The burn-in period is the initial phase before the acceptance rate stabilises, during which chain positions are discarded. After burn-in, the acceptance rate and sample distribution are both at their asymptotic values.`,
          `B) Convergence means the chain's acceptance rate stabilises at the target value (typically 23–44% for well-tuned Metropolis-Hastings). Burn-in is the initial phase before the acceptance rate reaches this target, during which the proposal distribution is being automatically tuned (adaptive MCMC). After burn-in, samples are from the target and the proposal is fixed. R̂ measures acceptance rate stability across chains, not posterior convergence.`,
          `C) An MCMC chain constructs a Markov chain θ₁, θ₂, ... with transition kernel K(θ'|θ) designed so that the stationary distribution is P(θ|data). Under ergodicity conditions (irreducibility + aperiodicity), the marginal distribution of θ_t converges to P(θ|data) as t→∞: ||P(θ_t ∈ ·) − P(·|data)||_TV → 0. 'Convergence' means this total variation distance goes to zero. Burn-in is the initial phase where θ_t has not yet converged — the chain is in a transient state influenced by the (arbitrary) initialisation θ_0. Samples during burn-in are not from the target distribution and are discarded. How long to burn in: run multiple chains from different initialisations; monitor R̂ (Gelman-Rubin diagnostic) — values near 1.0 indicate convergence across chains. After burn-in, consecutive samples are correlated (unlike i.i.d. Monte Carlo), so effective sample size < number of samples; thin by taking every k-th sample to reduce correlation.`,
          `D) Convergence means the log-likelihood of chain samples stabilises — the chain is no longer moving to higher-probability regions. The burn-in period ends when the log-probability trace plot plateaus. After burn-in, the Markov chain behaves like an i.i.d. sampler because the stationarity condition ensures all samples are equally likely under P(θ|data).`,
        ],
        answer: `C`,
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
    summary: `You collect a sample and compute a statistic — a mean, a proportion, an AUC. That statistic is itself random: a different sample would give a different value. To make valid inferences you need to know how much that statistic varies across samples — its sampling distribution. Without this, you cannot distinguish a real finding from sampling noise. For the sample mean, the Central Limit Theorem (CLT) solves this completely: regardless of the underlying distribution, the sample mean is approximately Normal with mean μ and variance σ²/n, as long as n is large enough and the population variance is finite.

This is why Normal-theory inference works on almost any dataset — you are usually operating on means, not raw samples, and means are Normal by the CLT. The standard error SE = σ/√n quantifies estimation uncertainty: halving SE requires quadrupling sample size, which is why going from "rough estimate" to "precise estimate" is expensive. The bootstrap replaces analytical CLT calculations with resampling: it works for any statistic with no closed-form sampling theory, and it is the universal fallback when you cannot derive a standard error formula.`,
    keyPoints: [
      `**CLT: √n(X̄ − μ)/σ →_d N(0,1) as n → ∞.** The result does not depend on the underlying distribution — only that it has finite variance. This is why t-tests and z-tests work broadly: they operate on sample means, not raw data, and sample means are Normal regardless of the raw distribution.`,
      `**Standard error

$SE = σ/√n.** Halving SE requires 4× the data. This 1/√n convergence rate is slow — going from$

SE = 0.1 to SE = 0.01 requires 100× more data. It is the fundamental cost of precision in statistics and determines why clinical trials and large-scale A/B tests are expensive.`,
      `**Confidence interval interpretation: a 95% CI does not mean "95% probability the parameter is in this interval." The parameter is fixed; the interval is random.** The correct statement: if you repeated the experiment many times and built a 95% CI each time, 95% of those intervals would contain the true parameter. For a probability statement about the parameter, you need a Bayesian credible interval.`,
      `**Bootstrap: resample n points with replacement B times (B = 1000 is typical), compute the statistic on each resample, take the 2.5th and 97.5th percentiles as the 95% CI.** Works for any statistic — AUC, median, Spearman correlation, SHAP values — anything without a closed-form SE formula. It fails for statistics sensitive to extremes (max, min) and can be unreliable for heavy-tailed distributions.`,
      `**CLT convergence speed depends on tail behaviour.** For near-Gaussian data, n ≥ 30 is usually sufficient. For heavy-tailed distributions (Pareto, log-normal), n may need to be 10,000+ before the Normal approximation holds. Always check kurtosis before using CLT-based inference on financial or web data.`,
    ],
    checkQuestions: [
      {
        q: `X₁,...,Xₙ ~ N(μ,σ²). What is the distribution of (n-1)S²/σ² where S² is the sample variance? Why n-1 not n?`,
        options: [
          `A) (n−1)S²/σ² ~ χ²(n−1) — chi-squared distribution with n-1 degrees of freedom. The n−1 denominator (Bessel's correction) is because S² = (1/(n−1))Σ(Xᵢ−X̄)² uses deviations from the sample mean X̄, not the true mean μ. X̄ is estimated from the data, consuming one degree of freedom: the deviations (Xᵢ−X̄) lie in an (n−1)-dimensional subspace (they must sum to zero), not n-dimensional. With n denominator: E[S²_biased] = σ²(n-1)/n — biased. With n-1: E[S²] = σ² — unbiased. The chi-squared distribution arises because Σ((Xᵢ−μ)/σ)² ~ χ²(n), but replacing μ by X̄ loses one degree of freedom: Σ((Xᵢ−X̄)/σ)² ~ χ²(n-1). The difference between χ²(n) and χ²(n-1) reflects the constraint imposed by estimating μ from the data.`,
          `B) (n−1)S²/σ² ~ N(0,1) by the CLT, since S² is a sample average of squared deviations and averages of i.i.d. quantities are approximately normal. The n−1 denominator corrects for the fact that each deviation (Xᵢ−X̄) is not independent of the others — they sum to zero, reducing the effective sample size from n to n−1.`,
          `C) (n−1)S²/σ² ~ F(n−1, n) — an F-distribution, because it is a ratio of two chi-squared variables: (n−1)S²/σ² = [Σ(Xᵢ−X̄)²/σ²] which is χ²(n−1) divided by χ²(n) from the denominator. The F-distribution arises whenever you compare variances from different samples, so (n−1)S²/σ² follows an F distribution for normal data.`,
          `D) (n−1)S²/σ² ~ χ²(n), not χ²(n−1). The n−1 in the denominator of S² = Σ(Xᵢ−X̄)²/(n−1) is just the normalising constant that makes S² an unbiased estimator of σ², but (n−1)S²/σ² = Σ(Xᵢ−X̄)²/σ² is a sum of n squared standard normals, giving χ²(n). The degrees of freedom is n, not n−1.`,
        ],
        answer: `A`,
      },
      {
        q: `If X̄ ~ N(μ, σ²/n), what does the Central Limit Theorem say about non-Gaussian X, and when does it break down?`,
        options: [
          `A) CLT states that X̄ ~ N(μ, σ²/n) exactly for all distributions with finite variance, regardless of n. The distribution of X̄ is always exactly Gaussian when X has finite variance — this follows from the characteristic function of the sum of i.i.d. variables being the product of individual characteristic functions, which equals the Gaussian characteristic function by the additive property of cumulants.`,
          `B) CLT: if X₁,...,Xₙ are i.i.d. with mean μ and finite variance σ², then √n(X̄ − μ)/σ →_d N(0,1) as n→∞. Practical rule of thumb: CLT works well for n≥30 for most distributions; for highly skewed or heavy-tailed, may need n≥100 or more. The CLT never breaks down as long as the sample size is large enough — for any distribution with finite variance, there exists n beyond which the normal approximation holds. The required n depends only on the skewness and kurtosis of X.`,
          `C) CLT: √n(X̄ − μ)/σ →_d N(0,1) as n→∞, regardless of the shape of P(X). This is a distributional convergence result — the standardised sample mean approaches a standard normal regardless of the shape of the original distribution P(X). Practical rule of thumb: CLT kicks in well for n≥30 for most distributions; for highly skewed or heavy-tailed distributions, may need n≥100 or more. Breakdown conditions: (1) Infinite variance distributions (e.g., Cauchy, Pareto with tail index α<2) — CLT does not apply; sample mean itself has infinite variance; Generalized CLT (stable distributions) applies instead. (2) Non-i.i.d. data: time series with autocorrelation require Functional CLT or corrected SEs. (3) Extreme imbalance (binary data with p close to 0): need n·p·(1−p) to be large enough for normality approximation.`,
          `D) CLT: X̄ converges to a Student-t distribution with n−1 degrees of freedom for non-Gaussian X. As n→∞, the t-distribution converges to N(0,1). For non-Gaussian X, the sample mean has heavier tails than predicted by the normal approximation, which the t-distribution correctly captures. Breakdown: for n>1000, the t and normal distributions are essentially identical, and the CLT approximation is valid for any distribution with finite variance.`,
        ],
        answer: `D`,
      },
      {
        q: `The t-distribution has heavier tails than the normal. Why does this matter when computing confidence intervals with small samples?`,
        options: [
          `A) With known σ: X̄ ± 1.96σ/√n. With unknown σ: X̄ ± tσ/√n. The t-distribution correction multiplies the CI width by t_{0.025,n-1}/1.96. For n=5: correction factor = 2.776/1.96 ≈ 1.42 — 42% wider. For n=30: correction factor ≈ 1.04 — nearly negligible. The practical consequence is that small-sample CIs require using t-tables rather than z=1.96, otherwise the stated 95% coverage is actually lower.`,
          `B) The t-distribution has heavier tails than the normal. Why does this matter when computing confidence intervals with small samples? With known σ: (X̄ − μ)/(σ/√n) ~ N(0,1), so 95% CI is X̄ ± 1.96σ/√n. With unknown σ, we substitute S (sample std dev): (X̄ − μ)/(S/√n) ~ t(n−1). The t-distribution has heavier tails because S is an estimate of σ, adding uncertainty. The t critical value t_{0.025, n-1} > 1.96 for all finite n. For n=5: t_{0.025, 4} = 2.776; for n=10: 2.228; for n=30: 2.042; for n→∞: t→z=1.96. The practical consequence: using z=1.96 with small samples (say n=10) gives an interval that is too narrow — the true coverage is < 95%. The extra uncertainty from estimating σ requires wider intervals for correct coverage. With modern data (large n), t→z and the distinction becomes negligible (n>30 typically).`,
          `C) The t-distribution has heavier tails because small samples have more variable estimates — not due to estimating σ, but because the sampling distribution of X̄ itself has heavier tails when n is small. This is an exact property of normal populations: for any n, the ratio (X̄−μ)/(σ/√n) is exactly N(0,1), but (X̄−μ)/(S/√n) is exactly t(n−1). The difference disappears for n>30 because S converges to σ and the two ratios become identical.`,
          `D) The t-distribution correction is only necessary for σ² estimation, not for μ estimation. When computing a CI for σ² (variance), use chi-squared critical values, not t-values. The t-distribution applies when you estimate both μ and σ² simultaneously — for μ alone with known σ, always use z=1.96 regardless of sample size.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The CLT makes sample means approximately Normal regardless of the underlying distribution — that is the entire foundation of classical inference. But the required sample size depends on tail behaviour: n = 30 works for near-Gaussian data, but power-law distributions may need n > 10,000. Always check whether the CLT approximation is valid before trusting the standard error.`,
  },
]
