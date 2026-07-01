export const MATH_STATS_MODULES = [
  {
    id: 'probability_basics',
    title: 'Probability Fundamentals',
    subtitle: `Sample spaces, Bayes' theorem, conditional probability`,
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['probability', 'bayes', 'foundations'],
    summary: `An email arrives. Is it spam? You know before opening it that 30% of all email is spam — that is your prior. You open it and find the word "FREE" five times. Words like "FREE" appear five times more often in spam than in legitimate email. How do you combine what you already knew with this new evidence?

The naive move is to just count: look at all emails containing "FREE" in your dataset and compute the fraction that were spam. This ignores the prior and breaks when your dataset is small or skewed. What you actually want is a principled update: start from P(spam) = 0.3, observe the word "FREE," and revise. The mechanism for this is conditional probability. P(spam|FREE) asks: among emails that contain "FREE," what fraction are spam? This is not the same as P(FREE|spam), which asks: among spam emails, what fraction contain "FREE?" Those two quantities are different, and confusing them is the base rate fallacy.

To go from the latter to the former, you need Bayes' theorem: $P(spam|FREE) = P(FREE|spam) \\cdot P(spam) / P(FREE)$. The numerator multiplies the likelihood — how often "FREE" appears in spam — by the prior probability of spam. The denominator, $P(FREE)$, normalises so everything sums to 1. It equals $P(FREE|spam) \\cdot P(spam) + P(FREE|ham) \\cdot P(ham)$: the law of total probability.

This is the mechanism behind every probabilistic ML system. The prior $P(spam) = 0.3$ encodes what you knew before. The likelihood $P(FREE|spam)$ is what your model learns from data. The posterior $P(spam|FREE)$ is what you actually want — your updated belief after seeing evidence.

**NOT this.** Most people think $P(A|B) = P(B|A)$. They do not. A test that correctly identifies 99% of sick patients — $P(positive|disease) = 0.99$ — does not mean a positive result means you are 99% likely to have the disease. If the disease affects only 1 in 1000 people, then $P(disease|positive) \\approx 9\%$. The false positive rate, applied to the large healthy population, swamps the true positives. Dropping the prior — treating $P(positive|disease)$ as $P(disease|positive)$ — is the error. The formal rules: conditional probability $P(A|B) = P(A \\cap B)/P(B)$. Independence: $P(A \\cap B) = P(A)P(B)$. Chain rule: $P(A,B,C) = P(A)P(B|A)P(C|A,B)$.`,
    interactivePrompt: `Before you touch the controls: if a test is 99% accurate and the disease has 1% prevalence, what do you think the probability of actually having the disease is after a positive result — 99%, 50%, or something surprisingly low?`,
    keyPoints: [
      `**Use it when you know the likelihood but want the posterior.** Any time your model gives you $P(data|hypothesis)$ but you need $P(hypothesis|data)$, Bayes' theorem is the exact conversion. In spam filtering: your trained model gives you $P(word|spam)$; Bayes gives you $P(spam|word)$. Without the prior, you cannot make this conversion.`,
      `**The production trap: ignoring the base rate.** A fraud detection model with 99% precision sounds great. But if only 0.1% of transactions are fraudulent, then among 10,000 flagged alerts, roughly 9,900 are false positives. The prior probability of fraud determines whether a high-precision model is operationally useful. Always report precision *at the operating base rate*, not just on a balanced test set.`,
      `**The diagnostic: check whether your prior and likelihood are on the same scale.** If $P(spam) = 0.3$ but your spam filter was trained on a 50/50 balanced dataset, the likelihood ratios are calibrated for a different prior. Recalibrate with Platt scaling or isotonic regression before multiplying priors by likelihoods. Symptoms of miscalibration: model confidence of 90% but actual accuracy of 60% on live traffic.`,
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
    takeaway: `Posterior = likelihood × prior / evidence. The prior is not optional — it determines whether a model output is meaningful or misleading.`,
    interactiveId: 'bayes_calculator',
  },
  {
    id: 'random_variables',
    title: 'Random Variables & Distributions',
    subtitle: 'PMF, PDF, CDF, expectation, variance, common distributions',
    difficulty: 'foundational',
    estimatedMin: 32,
    tags: ['distributions', 'expectation', 'variance'],
    summary: `You are predicting whether a transaction is fraud. The outcome is 0 or 1 — but the transaction amounts are continuous. Two completely different mathematical objects. Without the right vocabulary, you will confuse notation and make probability statements that are incoherent — like asking P(X = 3.14159) for a continuous variable, which is always exactly 0.

Random variables are the bridge between raw data and probability theory. A random variable is a function that assigns a real number to each outcome in a sample space. The type — discrete or continuous — determines which mathematical machinery applies, and mixing them up silently produces wrong answers.

Discrete random variables: P(X = k) is a valid statement. The PMF (probability mass function) sums to 1 over all k. Bernoulli(p) is your fraud indicator — 1 with probability p, 0 otherwise. Binomial(n, p) counts frauds in n transactions. Poisson(λ) counts events in a fixed time window.

Continuous random variables: P(X = 3.14) = 0 exactly — a single point has measure zero in a continuous space. What you can compute is P(a ≤ X ≤ b) = ∫_a^b f(x)dx. The PDF (probability density function) integrates to 1 over the real line. The Gaussian N(μ, σ²) is continuous. The Exponential distribution measures time between events.

Expected value: E[X] = Σ x·P(X=x) for discrete, ∫ x·f(x)dx for continuous. This is the probability-weighted average — the long-run mean if you drew forever. Variance: Var(X) = E[(X - E[X])²] = E[X²] - (E[X])². The standard deviation σ = √Var(X) is in the same units as X — interpretable. The gap E[X²] - (E[X])² is always non-negative, and zero only when X is constant. Never report a model's mean prediction without its variance — the variance is what tells you whether that mean is trustworthy.

**NOT this.** Probability and statistics are not interchangeable terms. Probability reasons forward from a known model to predictions about data. Statistics reasons backward from observed data to inferences about the model. Random variables live in probability. Estimators live in statistics. Confusing the direction leads to conditioning on the wrong thing and drawing the wrong conclusions. Asking P(X = 3.14) for transaction amounts is not a rounding question — it is a category error about the type of the variable.`,
    keyPoints: [
      `**Always verify whether a variable is discrete or continuous before writing a probability statement.** P(X = x) means something for discrete variables and nothing for continuous ones — for continuous X, P(X = x) = 0 for every single x. The mathematical framework (PMF vs PDF) determines what operations are valid. Writing a PMF for a continuous variable is not approximately wrong, it is completely wrong.`,
      `**Trap: confusing E[f(X)] with f(E[X]).** Jensen's inequality: for a convex function, E[f(X)] ≥ f(E[X]). The expected loss of a model is not the loss at the expected parameter. Concretely: E[X²] ≥ (E[X])², with equality only when X is constant. This matters for Bayesian prediction — the mean of a distribution over predictions is not the prediction at the mean of the distribution.`,
      `**Diagnostic: if you compute a probability that exceeds 1.0 or is negative, you have misidentified the variable type or mixed PMF and PDF formulas.** Check whether your probability statement requires summing (discrete) or integrating (continuous). A PDF value f(x) can exceed 1 — it is a density, not a probability. Only the integral of f over an interval is a probability.`,
    ],
    interactivePrompt: `Before you touch the controls: for a continuous random variable like transaction amount, if P(X = any single value) is always 0, what do you think "probability" means for a continuous variable — and how do you think the probability of a range like P(100 < X < 200) can be nonzero?`,
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
    takeaway: `Discrete and continuous random variables require completely different probability machinery. Misidentifying the type produces probability statements that are not just inaccurate but meaningless — P(X = x) for a continuous variable is always exactly 0, no matter how precisely you specify x.`,
    interactiveId: 'distribution_viz',
  },
  {
    id: 'joint_distributions',
    title: 'Joint Distributions & Independence',
    subtitle: 'Joint PDF/PMF, marginals, conditional distributions, covariance',
    difficulty: 'foundational',
    estimatedMin: 26,
    tags: ['joint distributions', 'covariance', 'correlation'],
    summary: `You are building a credit scoring model. Two features: age (continuous) and missed_payments (count, discrete). You want to know P(age > 30, missed_payments ≥ 2). These variables are not independent — older borrowers tend to have longer credit histories and different payment patterns. You cannot multiply P(age > 30) × P(missed_payments ≥ 2) and get the right answer. You need the joint distribution P(age, missed_payments).

Joint distribution P(X, Y): for discrete variables, a 2D table of probabilities summing to 1. For continuous variables, a 2D density f(x, y) integrating to 1. Marginal distribution: integrate or sum out the other variable. P(X = x) = Σ_y P(X = x, Y = y). Conditional distribution: P(Y = y | X = x) = P(X = x, Y = y) / P(X = x). This is the Bayes denominator — the mechanism behind every probabilistic classifier.

Independence: X and Y are independent if and only if P(X, Y) = P(X) × P(Y) for all values. In ML, Naive Bayes assumes all features are conditionally independent given the label. This is almost always false, but the classification decisions can still be correct even when the probability estimates are wrong — independence of errors in different directions can cancel.

Covariance: Cov(X, Y) = E[(X - μ_X)(Y - μ_Y)] = E[XY] - E[X]E[Y]. Positive covariance means the variables tend to move together. Negative means they move oppositely. Zero means no linear relationship — NOT the same as independence. Correlation: ρ = Cov(X, Y) / (σ_X · σ_Y). Bounded in [-1, 1]. For jointly Gaussian variables, zero correlation implies independence. For any other distribution, zero correlation is compatible with strong nonlinear dependence.

**NOT this.** Correlation = 0 does not mean the variables are independent. This is only true for jointly Gaussian random variables. For any other distribution, zero linear correlation is compatible with strong nonlinear dependence. Let X ~ Uniform(-1, 1) and Y = X². Then Cov(X, Y) = 0 by symmetry, but Y is completely determined by X — perfect deterministic dependence. Mutual information captures any dependence; correlation captures only linear dependence.`,
    keyPoints: [
      `**Always compute the joint distribution (or its sample estimate) before assuming independence.** A quick scatter plot or correlation matrix catches 80% of dependent feature pairs. Ignoring dependence leads to probability estimates that are systematically wrong — the Naive Bayes independence violation is not a theoretical concern, it produces miscalibrated probabilities that cannot be used for risk-sensitive decisions.`,
      `**Trap: treating conditional probabilities as symmetric.** P(fraud | transaction > $10K) ≠ P(transaction > $10K | fraud). Getting the conditioning direction wrong produces confident wrong answers. The base rate of each event determines which direction of conditioning gives useful information. Draw the causal structure first, then condition.`,
      `**Diagnostic: if a model's predicted probabilities are miscalibrated — predicted 0.8 but true frequency is 0.4 — check whether correlated features are creating double-counting of information.** This is the Naive Bayes independence violation made explicit. When two features carry the same signal (high correlation), treating them as independent doubles the effective evidence, pushing predictions toward the extremes.`,
    ],
    interactivePrompt: `Before you touch the controls: if two features have correlation ρ = 0, do you think they could still have a strong relationship — and can you think of what kind of relationship would have zero linear correlation but perfect predictability?`,
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
    takeaway: `Zero correlation rules out linear dependence only. Two variables can have ρ = 0 while one is a deterministic function of the other. If you need to test actual independence — not just linear independence — use mutual information or a rank-based test.`,
  },
  {
    id: 'information_theory',
    interactiveId: 'information_theory_viz',
    title: 'Information Theory for ML',
    subtitle: 'Entropy, cross-entropy, KL divergence, mutual information',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['entropy', 'KL divergence', 'cross-entropy', 'mutual information'],
    summary: `You are building a compression system for text messages. The word "the" appears in 7% of positions; the word "zymurgy" appears in 0.0001% of positions. If you give both words the same-length code, you waste bits every time you encode "the." Efficient encoding gives short codes to common words and long codes to rare ones. But how short and how long, exactly?

The answer falls out of a simple observation: the minimum number of bits needed to encode an event with probability $p$ is $-\log_2(p)$. A word appearing with probability 0.07 needs $-\log_2(0.07) \\approx 3.8$ bits. A word at probability 0.000001 needs about 20 bits. If all events were equally probable, the average bits needed would be $\log_2(N)$ where $N$ is the number of possible events. In general, the average bits over the whole distribution is the entropy: $H = -\\sum p(x) \\log p(x)$. Entropy measures how uncertain the distribution is — how many bits you need on average to describe a draw from it.

Now suppose your compression algorithm was designed for the wrong distribution. You built it assuming word frequencies $q$, but the true frequencies are $p$. The average bits you actually spend is $H(p, q) = -\\sum p(x) \\log q(x)$ — cross-entropy. The extra bits you waste compared to an optimal encoder is $KL(p \| q) = H(p, q) - H(p)$. Since $H(p)$ is fixed by the true distribution, minimising cross-entropy is identical to minimising KL divergence — the extra waste from using the wrong distribution.

This is where ML enters. Your model produces a predicted distribution $\\hat{y}$. The true label is a one-hot distribution $y$. Cross-entropy loss $= -\\log(\\hat{y}_{correct})$ measures how many bits your model\`s encoding wastes relative to optimal. Minimising cross-entropy is fitting your model\`s distribution to the true data distribution.

**NOT this.** Most people think cross-entropy is just a loss function that happens to work well. Cross-entropy is an information-theoretic quantity measuring encoding efficiency. When the model is perfectly calibrated, cross-entropy equals entropy — no wasted bits. The loss function framing hides why cross-entropy is the *right* choice, not merely a convenient one. It also hides the direction of KL: forward KL ($KL(p \| q)$, used in training) forces the model to cover all modes of the true distribution. Reverse KL ($KL(q \| p)$, used in VAEs) lets the model collapse to one mode. These produce qualitatively different learned distributions — mode-covering versus mode-seeking.`,
    interactivePrompt: `Before you touch the controls: if a fair coin has entropy of 1 bit, what do you think the entropy of a coin that lands heads 99% of the time would be — close to 1 bit, close to 0 bits, or somewhere in between?`,
    keyPoints: [
      `**Use cross-entropy loss for classification, not MSE.** Cross-entropy penalises confident wrong predictions exponentially: predicting 0.99 probability for the wrong class gets $-\\log(0.01) \\approx 6.6$ bits of punishment. MSE penalises it with $(1 - 0.99)^2 = 0.0001$ — nearly nothing. Any classifier trained with MSE on softmax outputs will be underpenalised for overconfident errors.`,
      `**The production trap: KL direction determines whether your model covers all modes or collapses to one.** Maximum likelihood training minimises forward KL — the model must assign non-zero probability everywhere the data has density. VAE training minimises reverse KL — the model can ignore modes it finds inconvenient, collapsing to a single sharp mode. If your generative model produces only one type of output despite diverse training data, reverse KL mode collapse is the culprit.`,
      `**The diagnostic: use mutual information $I(X;Y) = H(X) - H(X|Y)$ for feature selection, not Pearson correlation.** Correlation only detects linear relationships. A feature where $Y = X^2$ has zero correlation with $X$ but high mutual information — the feature is perfectly predictive but nonlinearly so. Any feature with $I(X;Y) = 0$ is truly independent of the label. Estimators like MINE make this tractable even for high-dimensional continuous features.`,
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
    takeaway: `Minimising cross-entropy is minimising KL divergence from your model to the true distribution. Cross-entropy is not an arbitrary loss — it is the exact measure of encoding waste, and that framing tells you why the KL direction matters.`,
    interactiveId: 'information_theory_viz',
  },
  {
    id: 'linear_algebra_basics',
    title: 'Vectors & Matrices',
    subtitle: 'Dot product, matrix operations, rank, norms',
    difficulty: 'foundational',
    estimatedMin: 26,
    tags: ['linear algebra', 'matrices', 'norms'],
    summary: `You have 10,000 training images, each 64×64 pixels × 3 channels = 12,288 numbers per image. These 10,000 images form a matrix X ∈ ℝ^{10000 × 12288}. Every ML operation on this dataset — normalizing features, computing covariances, running regression, doing PCA, forward passes through a neural network — is a matrix operation. If you do not know what a matrix product computes geometrically, you are manipulating ML pipelines you cannot understand or debug.

Vectors carry direction and magnitude. The dot product a·b = ‖a‖ ‖b‖ cos(θ) measures directional alignment — it is large and positive when two vectors point in similar directions, and zero when they are perpendicular. Orthogonal vectors have dot product zero. This is why cosine similarity works for semantic search: aligned embeddings have high dot products, reflecting similar meaning.

Matrix multiplication AB = C means C[i,j] = row i of A dotted with column j of B. It is not commutative: AB ≠ BA in general. Dimensions must match: A (m×k) times B (k×n) gives C (m×n). A matrix is a linear transformation — it stretches, rotates, and projects vectors. The matrix inverse A⁻¹ satisfies A⁻¹A = I. For linear regression, the normal equations give θ = (X^T X)⁻¹ X^T y — the closed-form solution via the Gram matrix X^T X.

Column space of A: all vectors reachable as Ax for some x. Rank: the dimension of the column space — the number of linearly independent directions A can produce. Rank deficiency means X^T X is singular, meaning the normal equations have no unique solution. You need regularization to fix this.

**NOT this.** Linear algebra is not just matrix arithmetic for solving linear systems. Every gradient descent step in a neural network is a matrix-vector multiplication. Every embedding lookup is a dot product. PCA is eigenvector decomposition of the covariance matrix. Attention is softmax(QK^T / √d)V — three matrix products. The Gram matrix X^T X appears in every regularized linear model. Linear algebra is the operational language of every ML computation, and understanding it geometrically — as transformations of space — is what lets you reason about what information your model is processing.`,
    keyPoints: [
      `**When a matrix operation fails or gives unexpected results, check dimensions first.** Almost all linear algebra bugs are shape mismatches. Write out the expected shape of every tensor before the operation and verify them in code. In numpy, \`.shape\` before every new operation is not paranoia — it is the cheapest debugging step you have.`,
      `**Trap: computing the matrix inverse to solve Ax = b.** The inverse A⁻¹ is numerically unstable for ill-conditioned matrices and costs O(n³) to compute. Use scipy.linalg.solve(A, b) instead — it uses LU decomposition, is faster, and is more numerically stable. The only reason to compute A⁻¹ explicitly is if you need to multiply by the same inverse many times.`,
      `**Diagnostic: if X^T X is near-singular (condition number > 1e10), you have multicollinear features or rank-deficient data.** Add L2 regularization to form X^T X + λI, which is always invertible for λ > 0. This is exactly what Ridge regression does — it is not an arbitrary regularizer, it is the minimum-norm solution to the otherwise ill-posed normal equations.`,
    ],
    interactivePrompt: `Before you touch the controls: if two columns of a matrix are identical, what do you think happens to the rank — and what does that mean for the ability to invert a matrix formed from that data?`,
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
    takeaway: `Every ML forward pass is matrix multiplication and nonlinearities. Rank tells you where information is irreversibly lost. Norms tell you what geometry an algorithm assumes. Both predict failure modes before you run a single experiment.`,
  },
  {
    id: 'eigendecomposition',
    title: 'Eigenvalues & Eigenvectors',
    subtitle: 'Geometric intuition, spectral theorem, power iteration',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['eigenvalues', 'eigenvectors', 'spectral theorem'],
    summary: `You have customer behavioral data with 50 features. Three of them — features 3, 7, and 22 — are all variations of "how much did the user spend." They carry similar information while consuming three times the parameter weight in regularization and three times the compute in every matrix operation. If you could find the single direction that captures the spending signal, you would reduce noise, compute, and overfitting simultaneously. That direction is a principal component — an eigenvector.

A square matrix A has eigenvalue λ and eigenvector v if Av = λv. The matrix A acts on v by pure scaling — the direction does not change, only the magnitude. For a symmetric positive semidefinite matrix like a covariance matrix, all eigenvalues are ≥ 0 and all eigenvectors are orthogonal. This is what makes PCA geometrically clean: the principal components are mutually perpendicular directions.

The covariance matrix C = X^T X / (n-1). Its eigenvectors are the principal directions of variance in the data. Its eigenvalues tell you how much variance lies along each direction. The first eigenvector, with the largest eigenvalue, is the direction of maximum variance — this is PC1. The second eigenvector, orthogonal to PC1, is PC2. The eigenvalue ratio λ₁ / Σλᵢ tells you the fraction of total variance captured by PC1.

Spectral theorem: any real symmetric matrix A decomposes as A = Q Λ Q^T where Q is orthogonal (columns are eigenvectors) and Λ is diagonal (eigenvalues on diagonal). This decomposition separates the rotating part (Q) from the scaling part (Λ). For PCA, Q gives you the rotation into principal component space, and Λ tells you how much each direction matters.

**NOT this.** Eigenvalues are not a mathematical abstraction with limited practical use. The eigenvalues of a neural network's Hessian determine optimization dynamics — a flat loss landscape has many near-zero eigenvalues, which is why overparameterized networks trained with Adam and good initialization converge faster than vanilla SGD. The eigenvalues of the attention matrix determine how information diffuses through a transformer layer. The eigenvalue spectrum of X^T X tells you the effective dimensionality of your data before you fit any model. Eigenvalues are the fingerprint of every matrix that matters in ML.`,
    keyPoints: [
      `**When features are correlated, eigendecompose the covariance matrix before modeling.** The eigenvalue spectrum tells you how many truly independent directions of variation exist in your data. If 5 of 50 eigenvalues contain 90% of the variance, you can reduce to 5 components with negligible information loss — the remaining 45 components are dominated by noise and correlations, not signal.`,
      `**Trap: forgetting to center data before computing the covariance matrix.** If the mean is nonzero, the first eigenvector points toward the mean rather than toward the direction of maximum variance. Always subtract the column means from X before computing X^T X / (n-1). sklearn's PCA does this by default. If you compute the covariance matrix manually, centering is mandatory.`,
      `**Diagnostic: plot the explained variance ratio (eigenvalue_i / sum of all eigenvalues) as a cumulative curve.** The elbow in the curve tells you how many components to keep. Where the curve flattens, adding more components yields diminishing returns — each additional component explains only noise. A sharp elbow at k components means the data lies approximately on a k-dimensional subspace.`,
    ],
    interactivePrompt: `Before you touch the controls: if a covariance matrix has one very large eigenvalue and many near-zero eigenvalues, what do you think the data looks like geometrically — and what does that imply about how many dimensions you actually need to describe it?`,
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
    takeaway: `The eigenvalue spectrum of your covariance matrix is a complete picture of your data's intrinsic dimensionality. Check it before choosing a model — it tells you whether you have 50 independent features or 5 directions of variation dressed up as 50.`,
  },
  {
    id: 'svd',
    interactiveId: 'svd_viz',
    title: 'Singular Value Decomposition',
    subtitle: 'SVD definition, low-rank approximation, connection to PCA',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['SVD', 'low-rank', 'matrix factorisation'],
    summary: `You work at a streaming service. Your rating matrix is 1 million users by 10,000 movies. Most entries are missing — users have rated a tiny fraction of the catalog. Your job is to predict the missing entries so you can recommend movies users have not seen yet.

The naive approach: fill in missing entries with the average rating. This ignores everything you know about which users are similar and which movies are similar. What you want is to find latent structure — users who like action movies, comedies, prestige dramas — and represent both users and movies in that latent space.

SVD gives you this. Factor the matrix $M \\approx U \Sigma V^T$. $U$ is a 1M × k matrix — each user represented as a $k$-dimensional latent preference vector. $V$ is a 10,000 × k matrix — each movie as a $k$-dimensional latent attribute vector. $\Sigma$ is $k \\times k$ diagonal — the importance of each latent factor. To predict user $i$\`s rating of movie $j$: compute $u_i^T \Sigma v_j$. The dot product measures how well user $i$\`s preferences align with movie $j$\`s attributes across all $k$ latent dimensions. This was the foundation of most Netflix Prize solutions.

Why not eigendecomposition instead? Eigendecomposition requires a square symmetric matrix. Your rating matrix is 1M × 10,000 — rectangular. SVD works on any matrix. The singular values $\sigma_i = \\sqrt{\lambda_i(M^T M)}$ — they are the square roots of the eigenvalues of $M^T M$. Left singular vectors $U$ are eigenvectors of $MM^T$; right singular vectors $V$ are eigenvectors of $M^T M$. SVD is strictly more general.

The Eckart-Young theorem proves that keeping only the top-$k$ singular vectors gives the best possible rank-$k$ approximation: $M_k = \sum_{i=1}^k \sigma_i u_i v_i^T$. No other rank-$k$ matrix is closer to $M$ in either Frobenius or spectral norm. This is the mathematical guarantee behind every truncated SVD application — compression, denoising, dimensionality reduction.

**NOT this.** Most people treat SVD and PCA as synonyms. They are not. SVD is a matrix factorization — a numerical decomposition that works on any matrix. PCA is a statistical method for finding directions of maximum variance in a dataset. PCA uses SVD as its computational engine: on mean-centered data, the right singular vectors of the data matrix equal the eigenvectors of the covariance matrix, and the two methods produce the same result. But SVD is more general (works on rectangular matrices, handles non-statistical applications like pseudo-inverses), and numerically more stable than computing the covariance matrix $X^T X$ explicitly, which squares the condition number.`,
    interactivePrompt: `Before you touch the controls: if you truncate a matrix to rank 10 and it still captures 95% of the variance, what do you think happens to reconstruction quality if you increase to rank 50 — dramatic improvement, modest improvement, or nearly no change?`,
    keyPoints: [
      `**Use SVD when you need a low-rank approximation, a pseudo-inverse, or intrinsic dimensionality.** Call \`np.linalg.svd(X, full_matrices=False)\` and inspect the singular value spectrum. A sharp elbow in the scree plot tells you the effective rank of your data. Singular values below the elbow are noise — including them adds variance without signal to any downstream model.`,
      `**The production trap: computing PCA via eigendecomposition of the covariance matrix $X^T X$.** This squares the condition number: if $κ(X) = 100$, then $κ(X^T X) = 10,000$. Numerical errors get amplified by $κ^2$. Always compute PCA via SVD of the data matrix directly. sklearn\`s \`PCA\` does this by default. If you wrote your own PCA from scratch using \`np.linalg.eig\` on $X^T X$, replace it.`,
      `**The diagnostic: plot the singular value spectrum and check the condition number $κ = \sigma_{max}/\sigma_{min}$.** A condition number above $10^6$ means the matrix is nearly singular and any computation involving its inverse (least squares, linear regression) will be numerically unstable. The pseudoinverse $A^+ = V \Sigma^+ U^T$ handles this by zeroing near-zero singular values rather than inverting them — sklearn\`s LinearRegression uses this by default.`,
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
    takeaway: `SVD reveals intrinsic dimensionality (the singular value spectrum) and numerical stability (the condition number) in a single call — read both before trusting any computation on that matrix.`,
  },
  {
    id: 'pca_theory',
    title: 'PCA from First Principles',
    subtitle: 'Covariance matrix, explained variance, when PCA fails',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['PCA', 'dimensionality reduction', 'covariance'],
    summary: `You are building a face recognition system. Each image is 100×100 pixels — 10,000 numbers per image. Training a model on raw 10,000-dimensional inputs is slow and prone to overfitting. But most of those dimensions carry redundant information: neighboring pixels are highly correlated, and faces share common structure — eyes roughly here, nose here, mouth here.

The naive fix is to drop some features. But which ones? Dropping pixel 4,512 and keeping pixel 4,513 is arbitrary — both carry similar information. What you want is to find the *directions* where faces actually vary, and represent each face as its coordinates along those directions.

PCA does exactly this. Centre the data (subtract the mean face). Compute the covariance matrix $\Sigma = X^T X / (n-1)$ — a 10,000 × 10,000 matrix encoding how every pixel correlates with every other pixel. Find the eigenvectors of this matrix. The eigenvector with the largest eigenvalue is the direction along which face images vary most. Project every image onto the top $k$ eigenvectors. You have compressed 10,000 dimensions down to $k$ — say 50 — while retaining whatever fraction of variance those 50 directions explain. A scree plot of eigenvalues sorted in descending order shows the "elbow" where additional components stop explaining much variance.

Two things make PCA fail. First, scale: a feature measured in dollars has 10,000× the variance of one measured in cents. PCA will identify "dollars direction" as the first principal component — not because it contains more signal, but because it has a larger unit. Always standardise (z-score) before running PCA unless features share a natural common scale.

**NOT this.** Most people think "PCA removes correlated features." PCA does not select a subset of original features. It creates entirely new features that are linear combinations of *all* original features. The new features — principal components — are uncorrelated with each other by construction. But each PC mixes every original feature together. You cannot look at a principal component and say "this is pixel 4,512." The confusion matters because PCA cannot be used for feature selection if you need interpretability in the original feature space.`,
    interactivePrompt: `Before you touch the controls: if the first two principal components explain 95% of variance in a face recognition dataset, do you think using only those two components would give good classification accuracy — or is there a reason the remaining 5% might matter more than it sounds?`,
    keyPoints: [
      `**Use PCA to reduce compute and overfitting, not to select features.** When downstream models are slow or overfit on high-dimensional inputs, project to the top $k$ PCs first. Choose $k$ to retain 95% of variance, or use the scree plot elbow. Computing PCA via SVD of the data matrix $X$ is numerically superior to eigendecomposition of $X^T X$ — it avoids squaring the condition number.`,
      `**The production trap: scale sensitivity.** A pixel value in [0, 255] has 65,000× the variance of a binary indicator in [0, 1]. PCA will identify the pixel direction as the first principal component — not because it is more informative, but because it is numerically larger. Always z-score before PCA unless all features share a natural common unit. After PCA, whitening (dividing each PC score by $\\sqrt{\lambda_k}$) gives unit variance in every direction and is required before k-means or GMMs.`,
      `**The diagnostic: compare PCA-compressed model accuracy against label-supervised baselines.** If 95% of variance explains only 70% of classification accuracy, the remaining 5% likely contains the discriminative signal. Try LDA (Linear Discriminant Analysis) — it maximises between-class variance rather than total variance, and will find directions PCA discards when classes differ in low-variance directions. If PCA\`s reconstruction quality is high but downstream task quality is poor, switch to a supervised reduction method.`,
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
    takeaway: `PCA keeps high-variance directions and discards low-variance ones. Always verify that the discarded variance does not contain the label signal — the information your classifier needs most may live exactly in the directions PCA throws away.`,
  },
  {
    id: 'calculus_ml',
    title: 'Calculus for ML',
    subtitle: 'Gradients, chain rule, Hessian, convexity',
    difficulty: 'foundational',
    estimatedMin: 26,
    tags: ['calculus', 'gradients', 'chain rule', 'convexity'],
    summary: `You are training logistic regression with binary cross-entropy loss: L = -[y log(ŷ) + (1-y) log(1-ŷ)] where ŷ = σ(Wx + b). You want to update W to reduce L. How much does L change when you nudge W₁₁ — the weight from feature 1 to the output — by a tiny ε? This is the partial derivative ∂L/∂W₁₁. Computing all such partial derivatives for all weights gives the gradient ∇L — the direction of steepest ascent in loss space. You step in the opposite direction. This is gradient descent.

The chain rule makes gradient computation tractable for deep networks. For the composition L(ŷ(z(W))), the chain rule gives ∂L/∂W = (∂L/∂ŷ) × (∂ŷ/∂z) × (∂z/∂W) where z = Wx + b. Each arrow in the computation graph corresponds to a derivative. The product of derivatives along a path is the derivative of the composed function. For the sigmoid: ∂σ(z)/∂z = σ(z)(1 - σ(z)) — a closed form that depends only on the output value.

Key derivatives in ML: for MSE loss L = (y - Wx)²/2, the gradient is -(y - Wx)x = -residual × feature. For cross-entropy with sigmoid output, the gradient is (ŷ - y)x — the residual times the feature. These clean gradient formulas are not accidents. They are chosen precisely because the derivative of the cross-entropy loss through the sigmoid produces a numerically stable, interpretable update.

Taylor expansion: f(x + ε) ≈ f(x) + f'(x)ε + f''(x)ε²/2. Gradient descent uses the first-order approximation — it assumes the loss surface is locally linear at each step. Second-order methods (Newton's method) use the quadratic term via the Hessian. They take more accurate steps but require O(n²) memory to store the Hessian — infeasible for large models.

**NOT this.** Calculus in ML is not just gradient descent. Calculus is why certain loss and activation combinations work together and others do not. Using MSE loss with a sigmoid output produces gradient saturation — in the saturated region where σ(z) ≈ 0 or 1, the derivative σ(z)(1-σ(z)) ≈ 0, and the gradient of the MSE loss through this near-zero value nearly vanishes. The network cannot learn from these examples. Cross-entropy with sigmoid was chosen specifically because the saturating term cancels algebraically, leaving a non-saturating gradient. Every loss-activation combination is a calculus decision.`,
    keyPoints: [
      `**When designing a new loss function or output layer, compute the gradient analytically first.** If the gradient saturates — approaches 0 — in regions of the output space, the model cannot learn from examples that fall there. This is why ReLU replaced sigmoid in hidden layers: ReLU's gradient is 1 for all positive inputs, never saturates. Sigmoid's gradient σ(z)(1-σ(z)) peaks at 0.25 and goes to 0 for large |z|.`,
      `**Trap: using finite-difference gradient checking as a routine verification step on large models.** Computing (f(x+ε) - f(x-ε)) / 2ε requires 2 forward passes per parameter. For a network with 10 million parameters, that is 20 million forward passes. Use gradient checking only for debugging specific custom layers, not the full network — use automatic differentiation for everything else.`,
      `**Diagnostic: if a layer's gradient magnitude is near 0 during backpropagation, the gradient is vanishing.** Check the activation function in that layer — if it is sigmoid or tanh, the layer inputs may be in the saturated region. Plot the distribution of pre-activation values for that layer. If they are large in magnitude (|z| > 4), replace the activation with ReLU or use batch normalization to keep activations in the non-saturated range.`,
    ],
    interactivePrompt: `Before you touch the controls: if you are at a point on the loss surface and the gradient is very large, does that mean you should take a large step in the negative gradient direction — or could a large gradient be a warning sign?`,
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
    takeaway: `The choice of loss function and activation is a calculus decision, not an aesthetic one. The clean gradient (ŷ - y)x that makes logistic regression easy to train exists because cross-entropy and sigmoid were chosen together precisely to cancel the saturation term.`,
  },
  {
    id: 'matrix_calculus',
    title: 'Matrix Calculus',
    subtitle: 'Gradient of loss wrt weights, numerator/denominator layout',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['matrix calculus', 'gradients', 'backpropagation'],
    summary: `You have linear regression with loss L = ‖Xw - y‖² = (Xw - y)^T(Xw - y). You want ∂L/∂w to take the gradient step. Expanding: L = w^T X^T X w - 2y^T Xw + y^T y. The gradient is ∇_w L = 2X^T Xw - 2X^T y. Setting to zero gives X^T Xw = X^T y — the normal equations. You just derived the closed-form solution to linear regression using matrix calculus. Without it, you would be working element-wise and making sign errors constantly.

Gradient of a scalar by a vector: ∂f/∂x ∈ ℝⁿ, the same shape as x. Key identities: ∂(x^T a)/∂x = a. ∂(x^T A x)/∂x = (A + A^T)x. For symmetric A: 2Ax. These identities cover almost everything in linear models, regularized regression, and Kalman filters.

Jacobian: the derivative of a vector-valued function. If f: ℝⁿ → ℝᵐ, then J = ∂f/∂x ∈ ℝ^{m×n} where J_{ij} = ∂f_i/∂x_j. The Jacobian of the softmax is (diag(s) - ss^T) where s = softmax(x). This is what the backward pass through softmax must compute — a matrix product, not a scalar multiplication.

Chain rule in matrix form: ∂L/∂X = ∂L/∂Y · ∂Y/∂X. The dimensions must work out: if Y = f(X), the Jacobian ∂Y/∂X has shape (dim Y × dim X). For a neural network linear layer z = Wx + b, the gradient with respect to W is ∂L/∂W = (∂L/∂z) · x^T — the outer product of the upstream gradient and the input. This one identity covers every fully-connected layer.

**NOT this.** You do not need matrix calculus if you use autograd — this is false. Autograd computes gradients correctly, but you need matrix calculus to debug shape errors in custom operations, to verify that backpropagation through a novel layer is correct, and to understand why certain operations are expensive to differentiate. Every custom PyTorch layer that implements a backward() method is matrix calculus. If you cannot derive the gradient manually, you cannot verify that your custom backward pass is correct.`,
    keyPoints: [
      `**Memorize the identity ∇_w (Aw)^T B(Aw) = 2A^T BA w for symmetric B.** This is the gradient of a quadratic form and appears in every regularized linear model, least-squares problem, and Kalman filter update. Setting it to zero gives the normal equations. Deriving it from scratch each time is error-prone and slow.`,
      `**Trap: layout convention inconsistency.** Numerator layout and denominator layout conventions differ between textbooks — the Matrix Cookbook (Petersen & Pedersen) uses denominator layout; most ML papers use numerator layout. Mixing conventions within a derivation produces a Jacobian that is transposed relative to what you need, giving a gradient update applied in the wrong direction. Pick one convention and never mix.`,
      `**Diagnostic: if your manually implemented backward pass does not match autograd's gradient, try transposing the Jacobian.** 80% of manual backward pass bugs are layout convention errors — the gradient has the right values but the wrong shape. The fix is to check whether you need J or J^T in the chain rule expression, which depends on your chosen layout convention.`,
    ],
    interactivePrompt: `Before you touch the controls: in the normal equations X^T X w = X^T y, why do you think X^T appears on both sides — what is X^T doing geometrically to the residual vector (Xw - y)?`,
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
    takeaway: `The gradient of a scalar loss with respect to any weight matrix is the outer product of the upstream gradient and the input activation. That one pattern covers every fully-connected layer. Layout convention errors are the most common silent bug in custom backpropagation.`,
  },
  {
    id: 'convex_optimization',
    interactiveId: 'convex_optimization_viz',
    title: 'Convex Optimization & Gradient Descent',
    subtitle: 'Convergence guarantees, learning rate, momentum, Adam',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['optimisation', 'gradient descent', 'Adam', 'convergence'],
    summary: `You are training L2-regularized logistic regression. You are minimizing L(w) = Σ log(1 + exp(-y_i w^T x_i)) + λ‖w‖². This function is convex — every local minimum is the global minimum, gradient descent is guaranteed to converge, and convergence rates are provable. Now train a 5-layer neural network instead. L(w) is non-convex, has countless saddle points and local minima of varying quality, and has no convergence guarantee. The mathematical gulf between these two problems is the difference between a well-posed optimization problem and one that works empirically.

A convex set C: for any x, y in C and t ∈ [0,1], the point tx + (1-t)y is also in C. The line segment between any two points stays inside the set. A convex function satisfies f(tx + (1-t)y) ≤ tf(x) + (1-t)f(y) — the function lies below the chord connecting any two points. First-order condition: f is convex if and only if f(y) ≥ f(x) + ∇f(x)^T(y-x) for all x, y. The tangent plane is a global lower bound on the function. This is why gradient information is sufficient for global optimization of convex problems.

What convexity buys: a unique global minimum with no need to worry about local optima, gradient descent convergence guaranteed with appropriate step size, strong duality holding so the dual problem gives the same solution, and theoretical convergence rates — O(1/t) for gradient descent, O(1/t²) for Nesterov acceleration.

SVMs, logistic regression, lasso, ridge — all convex. Neural networks: not convex. But empirically, modern overparameterized networks rarely get trapped in bad local minima. In overparameterized regimes where the number of parameters exceeds the number of training examples, loss surfaces have many saddle points but almost all local minima are approximately globally optimal.

**NOT this.** Non-convex optimization is not practically hopeless. Modern neural network training is non-convex optimization that works reliably in practice because of a structural property of overparameterized loss surfaces: most critical points are saddle points, not local minima, and most local minima have similar loss values to the global minimum. The theory of why gradient descent on non-convex neural networks generalizes well is still being developed — but empirically, the non-convexity is not the obstacle it appears to be in theory.`,
    keyPoints: [
      `**Verify whether your objective is convex before choosing an optimizer.** For convex problems, SGD with a decaying learning rate is provably convergent to the global minimum. For non-convex problems, convergence is only guaranteed to a stationary point — a point where the gradient is zero, which could be a saddle point. This determines whether you should trust a single run or require multiple restarts.`,
      `**Trap: using gradient descent on an ill-conditioned convex problem without checking convergence.** A function can be convex but have a condition number κ = λ_max/λ_min that is extremely large — meaning the loss surface is a narrow, elongated valley. Gradient descent zigzags across the valley rather than descending efficiently. The convergence rate is (κ-1)/(κ+1) per step. Use Adam or L-BFGS for ill-conditioned convex problems, not vanilla gradient descent.`,
      `**Diagnostic: if optimization is converging slowly on a problem you believe is convex, compute the condition number of the Hessian at your current point.** If κ > 1000, the problem is ill-conditioned — standardize your features or add regularization. For logistic regression, feature scaling directly improves the condition number of the Hessian and can reduce the number of gradient steps needed by an order of magnitude.`,
    ],
    interactivePrompt: `Before you touch the controls: if a function has a unique global minimum and gradient descent is started from a random point, does convexity guarantee you will reach the global minimum — or are there still ways gradient descent can fail on a convex problem?`,
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
    takeaway: `Convexity guarantees that every local minimum is global — but it does not guarantee fast convergence. The condition number of the loss landscape determines convergence speed, and a highly convex but ill-conditioned problem can be slower to optimize than a well-conditioned non-convex one.`,
  },
  {
    id: 'hypothesis_testing',
    interactiveId: 'hypothesis_testing_viz',
    title: 'Hypothesis Testing',
    subtitle: 'p-values, Type I/II errors, t-test, chi-squared, multiple comparisons',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['statistics', 'hypothesis testing', 'p-values', 'A/B testing'],
    summary: `Your team builds a new checkout button — different color, slightly repositioned. You run it for two weeks. 10,000 users see the new version; 10,000 see the old one. Conversion: 3.2% versus 3.0%. The difference is 0.2 percentage points. Is this real, or did you just get lucky?

The question you need to answer: if the button had no effect whatsoever — if both groups were drawn from the same underlying population — how often would random sampling produce a gap of at least 0.2 percentage points just by chance? That probability is the p-value. A p-value of 0.03 means: if the null hypothesis were true, you would see a difference this large or larger about 3% of the time by chance alone.

If p falls below your threshold α (commonly 0.05), you reject the null. Type I error (false positive): you rejected when the null was true — happens with probability α. Type II error (false negative): you failed to reject when there was a real effect. The probability of *detecting* a real effect is power $= 1 - β$. Power is not determined by p-values — it is determined before the experiment by choosing your sample size.

Now suppose your product manager runs 20 A/B tests simultaneously, each at α = 0.05. Under the null, each test has a 5% chance of a false positive. With 20 tests, you expect $20 \\times 0.05 = 1$ false positive. Finding three "significant" results is entirely consistent with all null hypotheses being true. The Bonferroni correction divides α by the number of tests: test each at $α/20 = 0.0025$. The Benjamini-Hochberg procedure controls the false discovery rate — the fraction of significant results that are false — and is less conservative.

**NOT this.** Most people read p < 0.05 as "there is a 95% probability the effect is real." Wrong. The p-value is a property of the *data* under the null hypothesis, not a probability about the hypothesis. It says nothing about P(null is true). To compute that, you need a prior — Bayesian territory. A p-value of 0.001 on a 10-million-user dataset can come from a conversion difference of 0.001%, which is statistically real but commercially irrelevant. Statistical significance is not practical significance. Always pair p-values with effect sizes and confidence intervals.`,
    interactivePrompt: `Before you touch the controls: if you run 20 A/B tests and 1 comes back significant at p = 0.05, how confident are you that the winning variant actually works — very confident, moderately confident, or do you think there is a good chance it is a false positive?`,
    keyPoints: [
      `**Use hypothesis testing when you need to decide whether an observed difference exceeds what chance alone can explain.** Pre-commit to your α and the minimum detectable effect size before collecting data. The sample size formula $n = 2(z_{α/2} + z_β)^2 σ^2 / δ^2$ requires specifying $δ$ (the smallest effect you care about) and $β$ (acceptable miss rate) before a single observation. Post-hoc power calculations — done after seeing the results — are not valid.`,
      `**The production trap: peeking.** Checking p-values as data accumulates and stopping when p < 0.05 inflates Type I error far above α. If you check after every 100 users, the effective false positive rate can reach 20–30% even at a nominal α = 0.05. Use sequential testing methods (always-valid p-values or alpha-spending functions) if you need continuous monitoring, or commit to a fixed sample size and look once.`,
      `**The diagnostic: separate statistical significance from practical significance.** With n = 1,000,000, a 0.001% conversion lift achieves p < 0.001 — statistically significant, practically irrelevant. Report Cohen\`s d, percent lift, or absolute conversion change alongside every p-value. If the effect size is smaller than the minimum you pre-specified as meaningful, the result does not justify a ship decision regardless of the p-value.`,
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
    takeaway: `A p-value measures how often chance produces this result, not how probable the hypothesis is. Effect size tells you whether the result matters. You need both before making a decision.`,
    interactiveId: 'hypothesis_testing_viz',
  },
  {
    id: 'mle_map',
    title: 'MLE vs MAP Estimation',
    subtitle: 'Likelihood, log-likelihood, MAP as regularised MLE',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['MLE', 'MAP', 'regularisation', 'Bayesian'],
    summary: `You flip a coin 10 times and get 7 heads. What is your best estimate for the probability of heads? The most obvious approach: count. $\\hat{p} = 7/10 = 0.7$. This is maximum likelihood estimation — find the parameter $θ$ that makes the observed data most probable. Formally: $\\hat{θ}_{MLE} = \\arg\max_θ P(data|θ) = \\arg\max_θ θ^7(1-θ)^3$. Take the log, differentiate, set to zero: $\\hat{θ}_{MLE} = 0.7$.

Now flip the same coin only 3 times and get 3 heads. MLE gives $\\hat{p} = 3/3 = 1.0$ — the coin always lands heads. Obviously wrong. MLE with tiny data is overconfident. The problem is that MLE has no memory of what coins are usually like. It treats every dataset as if the parameters could be anything.

MAP (Maximum A Posteriori) fixes this by adding a prior. Put a $\\text{Beta}(2, 2)$ prior over $θ$ — this encodes "probably close to 0.5, but I am not certain." The posterior is $P(θ | data) \\propto P(data|θ) \\cdot P(θ)$. MAP finds the mode of this posterior. With 3 heads out of 3 flips, MAP gives $\\hat{θ}_{MAP} \\approx 0.8$ rather than 1.0. The prior pulled the estimate toward sanity.

The prior is not just a Bayesian abstraction. Adding $\\log P(θ)$ to the log-likelihood is identical to adding a regularisation term to your loss function. A Gaussian prior $θ \sim N(0, τ^2 I)$ produces L2 regularisation (Ridge) with $λ = 1/(2τ^2)$. A Laplace prior produces L1 regularisation (Lasso). Every time you tuned a regularisation coefficient, you were implicitly choosing a prior distribution over weights.

**NOT this.** Most people think "MLE is just fitting the data." MLE assumes a specific probabilistic model — a particular likelihood function — and finds the parameters that make the observed data most probable under that model. If your model is wrong (fitting a Gaussian to bimodal data), MLE finds the "best" wrong answer with complete confidence. The model is always right in MLE\`s eyes; MLE has no mechanism to doubt the model family. MAP at least has a prior that can pull estimates back from absurdity when data is scarce.

As $n \to \\infty$, the likelihood dominates and MAP converges to MLE — the data eventually overwhelms any reasonable prior. This means regularisation should shrink as your dataset grows.`,
    interactivePrompt: `Before you touch the controls: if you flip a coin 3 times and get 3 heads, what do you actually believe the true probability of heads is — 1.0, something high like 0.8, or about 0.5?`,
    keyPoints: [
      `**Use MLE when you have enough data that the prior does not matter, and MAP (with regularisation) when data is scarce.** The crossover point depends on the prior strength and the number of parameters. A rule of thumb: if your training set has fewer than ~10 observations per parameter, the prior matters substantially. Cross-validate $λ$ to find the data-implied prior strength.`,
      `**The production trap: treating regularisation strength as a pure hyperparameter with no semantic content.** L2 regularisation says weights are Gaussian around zero. L1 says most weights are exactly zero. If you use L1 on a problem where you do not believe most features are irrelevant, you are encoding a false prior and likely underfitting. Match your regulariser to your belief about the solution structure.`,
      `**The diagnostic: watch regularisation strength versus dataset size.** If cross-validation selects larger $λ$ as you add more data, something is wrong — the data should overwhelm the prior and push $λ$ toward zero as $n$ grows. A regularisation coefficient that stays large on a big dataset often indicates a model family mismatch, not a genuine sparsity signal.`,
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
    takeaway: `Every regularised model is a MAP estimate. Choosing L2 or L1 is not a numerical trick — it is a statement about what you believe the solution looks like before seeing any data.`,
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
    summary: `You have 1000 customer purchase records but no segment labels. You believe there are K=3 segments: high-value, medium-value, and occasional. To fit a Gaussian Mixture Model, you need to know which segment each customer belongs to in order to compute per-segment means and variances. But you cannot know the segments until you have the parameters. Classic chicken-and-egg: you need labels to fit parameters and parameters to assign labels.

EM breaks the deadlock by replacing hard segment assignments with soft ones — probabilities. The E-step (Expectation): given current parameters θ^(t), compute P(segment k | customer i) for every i and k. These are soft memberships — each customer is distributed across all segments with weights summing to 1. The M-step (Maximization): given soft memberships, update parameters θ^(t+1) using weighted statistics. The mean of segment k is the weighted mean of all customers, with weights equal to P(segment k | customer). Repeat. Each iteration is guaranteed to increase the marginal log-likelihood — EM cannot decrease it, though it can converge to a local maximum.

EM generalizes far beyond Gaussian mixture models. K-means is a hard-assignment EM: the E-step assigns each point to its nearest centroid with probability 1, and the M-step updates centroids as unweighted means. Hidden Markov Models use EM under the name Baum-Welch. Probabilistic PCA uses EM. The unifying pattern: any model where the complete-data likelihood is tractable but the marginal likelihood (summing or integrating over hidden variables) is not — EM is the natural algorithm.

The theoretical guarantee: EM increases the marginal log-likelihood L(θ) = log P(X | θ) at every iteration. This follows from Jensen's inequality applied to the log-sum structure of the marginal likelihood. The E-step constructs a lower bound that is tight at the current θ. The M-step maximizes that lower bound. The next iteration starts from a point where the bound and the true objective coincide — so the objective has not decreased.

**NOT this.** EM is not an algorithm for mixture models. EM is a general framework for maximum likelihood estimation when data has missing or latent variables. The pattern is always: treat the missing data as if it were observed but uncertain (E-step fills in the expected complete data), then maximize the resulting expected complete-data log-likelihood (M-step). K-means, Baum-Welch for HMMs, and probabilistic PCA are all instances of this pattern.`,
    keyPoints: [
      `**Use EM whenever you have latent variables and the complete-data log-likelihood has a closed-form maximizer.** This is the pattern in GMMs, HMMs, probabilistic PCA, and factor models. When the M-step does not have a closed-form solution, replace it with gradient ascent on the expected complete-data log-likelihood — this is called Generalized EM and still monotonically increases the marginal likelihood.`,
      `**Trap: EM converges to local optima.** Run EM with multiple random initializations — typically 5 to 10 — and take the solution with the highest final log-likelihood. K-means++ initialization (choosing initial centroids with probability proportional to their squared distance from already-chosen centroids) gives better starting points and reduces the number of restarts needed for reliable convergence.`,
      `**Diagnostic: plot log-likelihood per iteration.** It should monotonically increase. If it ever decreases, there is a bug in the M-step — the expected complete-data log-likelihood is not being maximized correctly. A non-monotone EM log-likelihood is not a convergence issue, it is a correctness issue. The monotonicity guarantee is a theorem, not an approximation.`,
    ],
    interactivePrompt: `Before you touch the controls: if you have unlabeled data and want to fit a mixture model, what would happen if you started with random cluster assignments and just computed cluster statistics — why would that naive approach fail, and what does EM do differently?`,
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
    takeaway: `EM converts one intractable optimization — maximizing the marginal likelihood when variables are hidden — into a sequence of tractable steps by alternating between filling in hidden variable distributions and maximizing the resulting expected log-likelihood. Any model with latent variables and a tractable complete-data likelihood is a candidate for EM.`,
  },
  {
    id: 'concentration_inequalities',
    title: 'Concentration Inequalities',
    subtitle: 'Markov, Chebyshev, Hoeffding — generalisation bounds',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['concentration', 'generalisation', 'PAC learning', 'bounds'],
    summary: `You need to estimate the mean click-through rate from 100 samples. Your estimate is 0.043. How confident should you be that the true mean is within 0.01 of this estimate? This is a concentration question: how tightly does a sample statistic concentrate around its true value as the sample size grows? Without formal bounds, you are reporting confidence based on intuition rather than proof.

Markov's inequality: P(X ≥ a) ≤ E[X]/a for non-negative X. Weak but requires only a finite mean — it applies even when variance is infinite. Chebyshev's inequality: P(|X - μ| ≥ kσ) ≤ 1/k². Requires both mean and variance to be finite. Better than Markov but still loose — the bound decays only polynomially in k. Hoeffding's inequality: for bounded independent random variables X_i ∈ [a_i, b_i], the sample mean X̄ satisfies P(|X̄ - E[X̄]| ≥ t) ≤ 2 exp(-2n²t² / Σ(b_i - a_i)²). Exponentially tighter than Chebyshev for bounded variables — the bound shrinks double-exponentially as t increases.

Union bound (Bonferroni): P(A₁ ∪ A₂ ∪ ... ∪ A_k) ≤ Σ P(A_i). This is used in ML theory to get uniform convergence bounds — proving that the model holds simultaneously over all test examples, not just on average. Combined with Hoeffding, it gives bounds on the generalization gap of a model class.

VC dimension and generalization: the generalization error is bounded by O(√(d_VC log(n/d_VC) / n)) where d_VC is the VC dimension of the hypothesis class and n is training size. More data always helps. More complex models need more data to generalize. For modern overparameterized networks with VC dimension far exceeding training size, these classical bounds are vacuous — the implicit regularization from gradient descent produces tighter practical guarantees.

**NOT this.** Concentration inequalities are not only relevant in theory. These bounds are exactly why you can trust a sample size calculation. Hoeffding's inequality tells you that for click-through rates bounded in [0,1], you need n ≥ log(2/δ) / (2ε²) samples to guarantee P(|X̄ - μ| ≥ ε) ≤ δ with no distributional assumption. Every power calculation in data science is a concentration inequality with a distributional assumption substituted in. The normal approximation underlying t-tests and z-tests is just a special case with a Gaussian assumption; Hoeffding works without any distributional assumption at all.`,
    keyPoints: [
      `**Use Hoeffding's inequality for sample size estimation when your data is bounded.** For click-through rates in [0,1], n ≥ log(2/δ) / (2ε²) samples guarantees P(|X̄ - μ| ≥ ε) ≤ δ. This requires no distributional assumption beyond boundedness — it works whether the true distribution is Bernoulli, Beta, or anything else. For ε = 0.01 and δ = 0.05, that is n ≥ log(40) / 0.0002 ≈ 18,444 samples.`,
      `**Trap: applying CLT-based confidence intervals when n is small or the distribution is heavy-tailed.** The CLT requires finite variance and sufficiently large n. Hoeffding's bound is distribution-free and valid for any n as long as the variable is bounded. For small-sample A/B tests or metrics with extreme outliers, use Hoeffding or bootstrap confidence intervals instead of assuming normality.`,
      `**Diagnostic: if your model selection gives inconsistent results across runs with the same data, compute the generalization bound for your model complexity versus training size.** If the bound is loose (greater than 0.5), you do not have enough data to reliably distinguish between models — differences in validation performance are within the noise band of the bound, not real differences in generalization.`,
    ],
    interactivePrompt: `Before you touch the controls: if Hoeffding's inequality says you need 18,000 samples to estimate a mean within ±0.01 with 95% confidence, what do you think happens to the required sample size if you want ±0.001 instead — does it scale linearly, or much faster?`,
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
    takeaway: `Concentration inequalities are the mathematical foundation of every sample size calculation and every generalization bound. Hoeffding's inequality gives distribution-free guarantees for bounded variables — understanding it is what separates a rigorous sample size justification from an intuitive one.`,
  },
  {
    id: 'monte_carlo',
    interactiveId: 'monte_carlo_viz',
    title: 'Monte Carlo Methods',
    subtitle: 'Sampling, importance sampling, MCMC, variance reduction',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['Monte Carlo', 'sampling', 'MCMC', 'importance sampling'],
    summary: `You need E[f(X)] where X follows some complex distribution and f(X) is the revenue of a pricing model under uncertain market conditions. You cannot compute the integral analytically. But you can do this: sample X₁, X₂, ..., X_n from the distribution, evaluate f(X_i) for each, and average. By the law of large numbers, the average converges to E[f(X)] as n → ∞. This is Monte Carlo integration — replace an intractable integral with a sample average.

Why it works: the law of large numbers guarantees convergence. The CLT tells you the error rate: the standard error of the Monte Carlo estimate is σ/√n where σ² = Var[f(X)]. To halve the error, quadruple the sample size. The convergence rate O(1/√n) is independent of the dimension of X — unlike grid integration, which requires N^d evaluations in d dimensions. This dimension-independence is the entire reason Monte Carlo is the only tractable option for high-dimensional integration.

MCMC (Markov Chain Monte Carlo): when you cannot sample directly from the target distribution but can evaluate the density up to a normalizing constant. Metropolis-Hastings: propose a move from x to x', accept with probability min(1, p(x')/p(x)). The chain's stationary distribution is p(x). The acceptance ratio cancels the intractable normalizing constant — you never need to compute it. MCMC is the standard tool for Bayesian posterior sampling.

Importance sampling: use a proposal distribution q(x) instead of sampling from p. Reweight each sample by p(x)/q(x). The estimator is unbiased. But if q has lighter tails than p, a small number of samples get enormous weights and dominate the estimate — the effective sample size collapses. Always diagnose importance sampling with the effective sample size: ESS = (Σ w_i)² / Σ w_i². If ESS/n < 0.1, the proposal is misspecified.

**NOT this.** Monte Carlo is not only for simulations. Monte Carlo is the default tool for Bayesian posterior inference (MCMC samples from the posterior), for dropout uncertainty estimation (run the model k times with dropout active and average the predictions), for model evaluation confidence intervals (bootstrap resampling is Monte Carlo over the empirical distribution), and for reinforcement learning policy gradient estimation (sample trajectories to estimate E[reward]). Anywhere you see an expectation you cannot compute analytically, Monte Carlo is the practical solution.`,
    keyPoints: [
      `**Use bootstrap resampling — sampling with replacement from your dataset, repeated 1000 times — for confidence intervals on any statistic.** Bootstrap requires no distributional assumption and works for complex statistics like AUC, NDCG, and precision@K where there is no analytical confidence interval formula. It is the universal fallback when you cannot derive a standard error.`,
      `**Trap: importance weights that blow up.** If your proposal q(x) has lighter tails than the target p(x), some samples get enormous weights, the variance of the estimator blows up, and the effective sample size is tiny. Always compute ESS = (Σ w_i)² / Σ w_i² after importance sampling. If ESS/n < 0.1, your proposal is misspecified — use a heavier-tailed proposal or switch to MCMC.`,
      `**Diagnostic: for MCMC, check mixing with trace plots and R-hat statistics.** Trace plots of sampled values over iterations should look like white noise — rapid fluctuations around a stable level. Slow drift or long autocorrelation indicates the chain is not mixing well. R-hat < 1.1 across multiple chains initialized from different starting points indicates convergence to the same stationary distribution.`,
    ],
    interactivePrompt: `Before you touch the controls: Monte Carlo error is σ/√n regardless of dimension. If you are estimating an expectation in 1000 dimensions, do you think you need more samples than for 1 dimension — and what does dimension-independence actually mean for how you choose sample sizes?`,
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
    takeaway: `Monte Carlo error scales as O(1/√n) regardless of dimension. That dimension-independence is the entire reason Monte Carlo dominates variational inference, policy gradients, and any high-dimensional expectation. Variance of the integrand — not dimension — determines how many samples you need.`,
  },
  {
    id: 'sampling_distributions',
    title: 'Sampling Distributions & CLT',
    subtitle: 'CLT, standard error, confidence intervals, bootstrap',
    difficulty: 'foundational',
    estimatedMin: 24,
    tags: ['CLT', 'confidence intervals', 'bootstrap', 'standard error'],
    summary: `You run an A/B test. Treatment group (n=500) has CTR 4.3%. Control (n=500) has CTR 3.8%. The difference is 0.5 percentage points. Is this a real effect or just sampling noise? To answer, you need to know: if the true CTRs were equal, how variable would a 0.5% difference be purely from random sampling? The sampling distribution of (CTR_treatment - CTR_control) under the null hypothesis answers this exactly.

The sample mean X̄ of n i.i.d. draws from a population with mean μ and variance σ² has: E[X̄] = μ and Var[X̄] = σ²/n. Standard error = σ/√n. By the Central Limit Theorem, for large n, X̄ ≈ N(μ, σ²/n) regardless of the shape of the original distribution. This is why t-tests and z-tests work asymptotically for any distribution — they operate on means, and means become approximately normal.

The t-distribution: when σ is unknown and estimated from data as the sample standard deviation s, the statistic (X̄ - μ)/(s/√n) follows a t-distribution with n-1 degrees of freedom. The t-distribution has heavier tails than N(0,1) for small n, reflecting the extra uncertainty introduced by estimating σ. At n=30 or more, t(n-1) is nearly indistinguishable from N(0,1) — this is why 30 is often cited as the CLT approximation threshold.

Bootstrap sampling distribution: the empirical alternative to analytical formulas. Draw n samples with replacement from your data, compute the statistic, repeat 10,000 times. The distribution of the statistic across bootstrap samples is the sampling distribution. Works for any statistic — AUC, precision@K, NDCG — with no formula required.

**NOT this.** The CLT applies to any distribution for large n is not unconditionally true. The CLT requires finite mean and finite variance. For heavy-tailed distributions — Pareto with tail index less than 2, some financial return distributions — the variance does not exist and the CLT does not apply. The sample mean does not converge to a Gaussian; it converges to a stable distribution with heavier tails. For web latency, transaction sizes, and other power-law distributed data, checking whether the CLT applies before running a t-test is not paranoia — it is necessary.`,
    keyPoints: [
      `**Always report the standard error (σ/√n) alongside any point estimate.** An estimate without its standard error is not a scientific claim — it is a number without an indication of how much it would vary across repeated samples. For differences between groups, the standard error of the difference is √(σ₁²/n₁ + σ₂²/n₂), assuming independence between groups.`,
      `**Trap: using a z-test when n < 30 and the distribution is non-normal.** The z-test uses critical value 1.96, which comes from N(0,1). For small n with unknown σ, the correct critical value comes from the t-distribution: t_{0.025, n-1}. For n=10, that critical value is 2.228 instead of 1.96 — using z inflates Type I error because the interval is too narrow.`,
      `**Diagnostic: if your A/B test p-value looks suspiciously small (< 0.001) or large (> 0.5), recheck the standard error computation.** Common errors: not accounting for within-user correlation across multiple observations (inflates effective sample size), using population σ instead of sample s, or forgetting that the standard error of a difference requires variance from both groups, not just one.`,
    ],
    interactivePrompt: `Before you touch the controls: if you double your sample size in an A/B test, by how much do you expect the standard error to shrink — half, one quarter, or something else — and what does that imply for how expensive it is to get precise estimates?`,
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
    takeaway: `The sampling distribution tells you how much a statistic varies across repeated samples. The CLT makes sample means approximately normal for large n — but large depends on tail behavior. Always verify the CLT assumption holds before running t-tests or z-tests on data with heavy tails.`,
  },
]
