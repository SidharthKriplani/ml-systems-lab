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

**NOT this.** Most people think $P(A|B) = P(B|A)$. They do not. A test that correctly identifies 99% of sick patients — $P(positive|disease) = 0.99$ — does not mean a positive result means you are 99% likely to have the disease. Suppose the disease affects only 1 in 1000 people ($P(disease) = 0.001$) and the test also has a 1% false-positive rate ($P(positive|no\\ disease) = 0.01$, i.e. 99% specificity). Then $P(positive) = 0.99 \\times 0.001 + 0.01 \\times 0.999 \\approx 0.0110$, so $P(disease|positive) = 0.00099 / 0.0110 \\approx 9\\%$. The false positive rate, applied to the large healthy population, swamps the true positives. Dropping the prior — treating $P(positive|disease)$ as $P(disease|positive)$ — is the error. The formal rules: conditional probability $P(A|B) = P(A \\cap B)/P(B)$. Independence: $P(A \\cap B) = P(A)P(B)$. Chain rule: $P(A,B,C) = P(A)P(B|A)P(C|A,B)$.`,
    interactivePrompt: `Before you touch the controls: if a test is 99% accurate and the disease has 1% prevalence, what do you think the probability of actually having the disease is after a positive result — 99%, 50%, or something surprisingly low?`,
    keyPoints: [
      `**Use it when you know the likelihood but want the posterior.** Any time your model gives you $P(data|hypothesis)$ but you need $P(hypothesis|data)$, Bayes' theorem is the exact conversion. In spam filtering: your trained model gives you $P(word|spam)$; Bayes gives you $P(spam|word)$. Without the prior, you cannot make this conversion.`,
      `**The production trap: ignoring the base rate.** A fraud detection model that catches 99% of actual fraud (99% recall) sounds great. But if only 0.1% of transactions are fraudulent and the model also has a 1% false-positive rate, then out of 10,000 transactions: about 10 are truly fraudulent (0.1% of 10,000), of which the model catches roughly 9.9 (99% recall). But that same 1% false-positive rate applied to the ~9,990 legitimate transactions flags about 100 of them too. So of the ~110 total flagged alerts, only ~9.9 are real fraud — realized precision is about 9%, not 99%. The prior probability of fraud determines whether a high-recall model is operationally useful. Always report precision *at the operating base rate*, not just recall on a balanced test set.`,
      `**The diagnostic: check whether your prior and likelihood are on the same scale.** If $P(spam) = 0.3$ but your spam filter was trained on a 50/50 balanced dataset, the likelihood ratios are calibrated for a different prior. Recalibrate with Platt scaling or isotonic regression before multiplying priors by likelihoods. Symptoms of miscalibration: model confidence of 90% but actual accuracy of 60% on live traffic.`,
    ],
    checkQuestions: [
      {
        q: `You roll two fair dice. Event A = 'first die shows 6', Event B = 'sum equals 7'. Are A and B independent? Compute P(A), P(B), P(A∩B) and verify your answer.`,
        options: [
          `A) P(A)=1/6, P(B)=1/6, P(A∩B)=1/36. Check: P(A)·P(B)=1/36=P(A∩B), so A and B ARE independent. This is non-obvious: given first die=6, the only way sum=7 is second die=1, probability 1/6 = P(B), confirming independence via the multiplication rule for two disjoint dice events.`,
          `B) P(A) = 1/6. P(B) = 6/36 = 1/6 (pairs summing to 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1)). P(A∩B) = P(first=6, second=1) = 1/36. Check: P(A)·P(B) = 1/36 = P(A∩B). Therefore A and B ARE independent — the second die's uniformity exactly offsets the sum constraint.`,
          `C) P(A)=1/6, P(B)=5/36, P(A∩B)=1/36. Check: P(A)·P(B)=5/216 ≠ 1/36, so A and B are NOT independent. The sum constraint means knowing the first die restricts which second-die outcomes count toward sum=7 — dependence via a shared conditioning variable.`,
          `D) P(A)=1/6, P(B)=1/6, P(A∩B)=1/36, so P(A)·P(B)=1/36=P(A∩B). However A and B are NOT independent because the events share a structural constraint on the same two dice — any linking constraint like this must create dependence regardless of the numerical check.`,
        ],
        answer: `B`,
      },
      {
        q: `You have a biased coin: P(H)=0.7. You flip it 3 times. What is the probability of getting exactly 2 heads, and why does the binomial formula give the right answer?`,
        options: [
          `A) P(exactly 2H) = C(3,2) × 0.7² × 0.3¹ = 3 × 0.49 × 0.3 = 0.441. The formula works because each flip is independent and identically distributed (P(H)=0.7 always). C(3,2)=3 counts the orderings HHT, HTH, THH, each with probability 0.7²×0.3=0.147; summing the three mutually exclusive orderings gives 3×0.147=0.441.`,
          `B) P(exactly 2H) = 0.7² × 0.3¹ = 0.147. The binomial formula is not needed here — since each flip is independent, you multiply the probabilities of each outcome directly, treating HHT as the only relevant sequence. The C(3,2) factor would overcount by including indistinguishable orderings of the flips, double-counting probability mass.`,
          `C) P(exactly 2H) = C(3,2) × 0.7² × 0.3¹ = 0.441. However, the binomial formula only gives the right answer when P(H)=0.5. For a biased coin with P(H)=0.7, the correct approach is to sum probabilities over all sequences with exactly 2 heads, weighting each differently based on the order.`,
          `D) P(exactly 2H) = C(3,2) × 0.7³ × 0.3¹ = 3 × 0.343 × 0.3 = 0.309. The binomial formula works here because independence and identical distribution both hold across all three flips. We use 0.7³ because there are 3 flips total and, by symmetry with C(3,2), each contributes a full factor of P(H) to the product.`,
        ],
        answer: `A`,
      },
      {
        q: `In a medical test, P(Disease)=0.01, P(+|Disease)=0.95, P(+|No Disease)=0.05. You test positive. Which TWO of the following options correctly compute P(Disease|+) AND correctly interpret what the result implies?`,
        options: [
          `A) P(+) = 0.95×0.01 + 0.05×0.99 = 0.059. P(D|+) = 0.0095/0.059 ≈ 16.1%. The 95% sensitivity dominates the calculation — a positive result is mostly reliable because sensitivity is high, and once specificity exceeds 90% the false-positive contribution becomes negligible relative to true positives in any prevalence regime.`,
          `B) P(D|+) ≈ 95% because the test has 95% sensitivity, which by definition equals the positive predictive value under Bayes' rule. A positive result directly reflects the sensitivity of the test — if the test is correct 95% of the time, then 95% of positives are true positives. Base rate only matters when sensitivity drops below 50%.`,
          `C) P(+) = 0.95×0.01 + 0.05×0.99 = 0.059. P(D|+) = 0.0095/0.059 ≈ 16.1%. The 5% false-positive rate applied to 99% of healthy people produces far more false positives than true positives, so even an excellent test yields mostly false positives for a rare disease — sequential testing and clinical judgment are needed.`,
          `D) P(+) = P(+|D)P(D) + P(+|no D)P(no D) = 0.95×0.01 + 0.05×0.99 = 0.059. P(D|+) = 0.0095/0.059 ≈ 16.1%. This is base rate neglect: because P(Disease)=0.01 is low, the 5% false-positive rate applied to the large healthy population overwhelms the 95%-sensitive test's true positives. Confirmatory testing is needed.`,
        ],
        answer: ['C', 'D'],
      },
    ],
    takeaway: `Posterior = likelihood × prior / evidence. The prior is not optional — it determines whether a model output is meaningful or misleading.`,
    recap: [
      "**Bayes = the update rule:** $P(spam|FREE) = P(FREE|spam)\\,P(spam)/P(FREE)$. Prior × likelihood ÷ evidence.",
      "**Posterior ≠ likelihood:** $P(A|B) \\neq P(B|A)$. Confusing them is the base rate fallacy.",
      "**Rare disease trap:** 99% sensitive test, 0.1% prevalence → $P(disease|+) \\approx 9\\%$. False positives swamp true ones.",
      "**Evidence = law of total probability:** $P(FREE) = P(FREE|spam)P(spam) + P(FREE|ham)P(ham)$ normalises to 1.",
      "**Report precision at the real base rate**, not on a balanced test set — 99% recall + 1% false-positive rate + 0.1% fraud prevalence → realized precision ≈ 9%, not 99%.",
      "**Recalibrate before multiplying:** a 50/50-trained model's likelihoods don't match a 30% prior. Platt/isotonic first.",
    ],
    interactiveId: 'bayes_calculator',
  },
  {
    id: 'random_variables',
    title: 'Random Variables & Distributions',
    subtitle: 'PMF, PDF, expectation, variance, common distributions',
    difficulty: 'foundational',
    estimatedMin: 32,
    tags: ['distributions', 'expectation', 'variance'],
    summary: `You are predicting whether a transaction is fraud. The outcome is 0 or 1 — but the transaction amounts are continuous. Two completely different mathematical objects. Without the right vocabulary, you will confuse notation and make probability statements that are incoherent — like asking P(X = 3.14159) for a continuous variable, which is always exactly 0.

Random variables are the bridge between raw data and probability theory. A random variable is a function that assigns a real number to each outcome in a sample space. The type — discrete or continuous — determines which mathematical machinery applies, and mixing them up silently produces wrong answers.

Discrete random variables: P(X = k) is a valid statement. The PMF (probability mass function) sums to 1 over all k. Bernoulli(p) is your fraud indicator — 1 with probability p, 0 otherwise. Binomial(n, p) counts frauds in n transactions. Poisson(λ) counts events in a fixed time window. Geometric(p) counts trials until the first fraud — P(X=k) = (1-p)^{k-1}p for k=1,2,3,.... Any PMF built from a constant ratio r, like Geometric's (1-p) or a (1/2)^k pattern, needs two series identities to solve for its normalizing constant and its mean: Σ_{k=1}^∞ r^k = r/(1-r), and Σ_{k=1}^∞ k·r^k = r/(1-r)² — both valid for |r| < 1.

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
          `A) C=1/2, E[X]=4. Find C: Σ_{k=1}^∞ C·(1/2)^k = C·2 = 1, so C=1/2 — this treats the geometric series Σ(1/2)^k as summing to 2 instead of 1, an off-by-factor error common when the index starts at k=1. E[X] = Σ k·(1/2)^{k+1} = 4, carrying the extra (1/2) factor through the shifted-index derivative identity.`,
          `B) C=1, E[X]=4. Find C: Σ_{k=1}^∞ C·(1/2)^k from k=1 equals C·1=1, giving C=1 by the standard geometric series identity a/(1−r). E[X]=Σ k·(1/2)^k. Using Σ k·r^k = r/(1-r)² at r=1/2: E[X]=(1/2)/(1/4)=2. But since the sum starts at k=1, not k=0, we add 1 to shift the index: E[X]=2+1=4.`,
          `C) Find C: Σ_{k=1}^∞ C·(1/2)^k = C·(1/2)/(1−1/2) = C = 1, so C=1. E[X] = Σ_{k=1}^∞ k·(1/2)^k. Using Σ k·r^k = r/(1−r)² at r=1/2: E[X] = (1/2)/(1/4) = 2. Sanity check: P(X=1)=1/2, P(X=2)=1/4 — weight concentrates near small k, so E[X]=2 sits just above the mode.`,
          `D) C=2, E[X]=2. Find C: Σ_{k=1}^∞ C·(1/2)^k = 1 requires C=2, since Σ(1/2)^k=1/2 — mistakenly treating the infinite geometric sum as equal to just its first term (1/2)¹, instead of applying the full formula a/(1−r) with a=r=(1/2), which correctly gives 1. E[X] = Σ k·(1/2)^k, dropping C since a normalizing constant cancels in the mean, giving (1/2)/(1/4) = 2 — matching the value expected for a rapidly decaying PMF.`,
        ],
        answer: `C`,
      },
      {
        q: `X ~ N(0,1) and Y = X². Which TWO of the following statements about Y are true?`,
        options: [
          `A) Y = X² follows a chi-squared distribution with 1 degree of freedom, Y ~ χ²(1), because χ²(1) is defined exactly as the square of a single standard normal random variable — the base case of the general χ²(k) = sum of k independent squared standard normals.`,
          `B) E[Y] = E[X²] = 1, since E[X²] = Var(X) + (E[X])² = 1 + 0 = 1 for X ~ N(0,1); this matches the χ²(1) distribution's mean, which always equals its degrees of freedom k=1 by the standard chi-squared moment formula relating mean directly to k.`,
          `C) Y = X² follows a half-normal distribution, since squaring removes the sign of X and the half-normal is defined as the distribution of |X| for X ~ N(0,1); squaring a half-normal variable is mathematically equivalent to squaring the original normal.`,
          `D) E[Y] = E[X²] = 2, because the second moment of N(0,1) equals the sum of variance and squared mean, σ² + μ² = 1 + 1 = 2, following the general second-moment identity applied to a distribution with unit variance and unit mean.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why is E[f(X)] ≠ f(E[X]) in general? When does equality hold?`,
        options: [
          `A) E[f(X)] ≠ f(E[X]) because the expectation operator distributes over sums but not over arbitrary functions. Equality holds when f is monotone (strictly increasing or decreasing) since monotone functions preserve the ordering of outcomes. For non-monotone f like f(x)=x², the inequality direction depends on the sign of x.`,
          `B) E[f(X)] ≠ f(E[X]) whenever f is nonlinear, because the average of f(X) over the distribution of X is taken before applying f, whereas f(E[X]) applies f to the mean first. Equality holds only when X is symmetric — symmetric distributions ensure the Jensen gap cancels. For asymmetric X, E[f(X)] > f(E[X]) always.`,
          `C) E[f(X)] ≠ f(E[X]) in general because of sampling variability in a finite dataset. Equality only holds in the limit n→∞, when the law of large numbers ensures the sample mean converges to E[X] and the continuous mapping theorem then guarantees f(X̄) converges to f(μ) as well.`,
          `D) Jensen's inequality: E[f(X)] ≥ f(E[X]) for convex f, ≤ for concave f. Equality holds iff f is linear (affine) or X is constant. Example: E[X²] ≥ (E[X])², equality only when Var(X)=0. In ML: expected loss of averaging predictions differs from loss at the average prediction — mean is optimal only under squared loss.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Discrete and continuous random variables require completely different probability machinery. Misidentifying the type produces probability statements that are not just inaccurate but meaningless — P(X = x) for a continuous variable is always exactly 0, no matter how precisely you specify x.`,
    recap: [
      "**Discrete vs continuous is a type, not a detail:** $P(X=x)$ is valid for discrete, always 0 for continuous.",
      "**Discrete = PMF sums to 1; continuous = PDF integrates to 1.** A PDF value can exceed 1 (it's a density).",
      "**Expectation = probability-weighted average:** $E[X]=\\sum x\\,P(X{=}x)$ or $\\int x f(x)dx$.",
      "**Variance = $E[X^2]-(E[X])^2$**, always ≥ 0, zero only when X is constant. σ shares X's units.",
      "**Jensen:** for convex f, $E[f(X)] \\geq f(E[X])$ — expected loss ≠ loss at the mean parameter.",
      "**Probability reasons forward (model→data); statistics reasons backward (data→model).** Don't mix directions.",
      "**Sanity check:** a probability >1 or <0 means you mixed PMF and PDF formulas or misread the type.",
    ],
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

Covariance: Cov(X, Y) = E[(X - μ_X)(Y - μ_Y)] = E[XY] - E[X]E[Y]. Positive covariance means the variables tend to move together. Negative means they move oppositely. Zero means no linear relationship — NOT the same as independence. Correlation: ρ = Cov(X, Y) / (σ_X · σ_Y). Bounded in [-1, 1]. For jointly Gaussian variables, zero correlation implies independence — for any other distribution, it doesn't, as the next paragraph shows.

**NOT this.** Correlation = 0 does not mean the variables are independent. This is only true for jointly Gaussian random variables. For any other distribution, zero linear correlation is compatible with strong nonlinear dependence. Let X ~ Uniform(-1, 1) and Y = X². Then Cov(X, Y) = 0 by symmetry, but Y is completely determined by X — perfect deterministic dependence. Mutual information captures any dependence; correlation captures only linear dependence.

[FIGURE:joint]`,
    keyPoints: [
      `**Always compute the joint distribution (or its sample estimate) before assuming independence.** A quick scatter plot or correlation matrix is a fast first check, but it only catches linear relationships — nonlinear dependence needs mutual information or a rank-based test. Ignoring dependence leads to probability estimates that are systematically wrong — the Naive Bayes independence violation is not a theoretical concern, it produces miscalibrated probabilities that cannot be used for risk-sensitive decisions.`,
      `**Trap: treating conditional probabilities as symmetric.** P(fraud | transaction > \$10K) ≠ P(transaction > \$10K | fraud). Getting the conditioning direction wrong produces confident wrong answers. The base rate of each event determines which direction of conditioning gives useful information. Draw the causal structure first, then condition.`,
      `**Diagnostic: if a model's predicted probabilities are miscalibrated — predicted 0.8 but true frequency is 0.4 — check whether correlated features are creating double-counting of information.** This is the Naive Bayes independence violation made explicit. When two features carry the same signal (high correlation), treating them as independent doubles the effective evidence, pushing predictions toward the extremes.`,
    ],
    checkQuestions: [
      {
        q: `X and Y have joint PDF f(x,y) = 6x for 0 ≤ x ≤ y ≤ 1. Find the marginal PDFs and check if X and Y are independent.`,
        options: [
          `A) Marginal of X: f_X(x) = ∫_0^x 6x dy = 6x² for 0≤x≤1. Marginal of Y: f_Y(y) = ∫_0^1 6x dx = 3 for 0≤y≤1. Check: f_X(x)·f_Y(y) = 18x² ≠ 6x, so X and Y are NOT independent — note the marginal of X was integrated over [0,x] instead of [x,1], even though the support requires x ≤ y.`,
          `B) Marginal of X: f_X(x) = ∫_x^1 6x dy = 6x(1−x) for 0≤x≤1. Marginal of Y: f_Y(y) = ∫_0^y 6x dx = 3y² for 0≤y≤1. Check: f_X(x)·f_Y(y) = 18xy²(1−x) ≠ 6x = f(x,y), so X and Y are NOT independent — the constraint x ≤ y means knowing Y=y restricts X to [0,y], changing X's conditional distribution.`,
          `C) Marginal of X: f_X(x) = ∫_x^1 6x dy = 6x(1−x). Marginal of Y: f_Y(y) = ∫_0^1 6x dx = 3 for 0≤y≤1. Since f_X(x)·f_Y(y) = 18x(1−x) ≠ 6x = f(x,y), X and Y are NOT independent. The constraint x ≤ y in the joint support alone guarantees this dependence, regardless of the specific density values.`,
          `D) Marginal of X: f_X(x) = 6x(1−x). Marginal of Y: f_Y(y) = 3y². Product f_X(x)·f_Y(y) = 18xy²(1−x). Since this equals 6x only on the measure-zero set (1−x)·3y²=1, X and Y are independent almost everywhere — the divergence occurs on a null set that shouldn't count against independence for practical modeling purposes.`,
        ],
        answer: `B`,
      },
      {
        q: `Cov(X,Y) = 0 implies X and Y are independent: true or false? Which TWO of the following options give a correct verdict with a valid counterexample?`,
        options: [
          `A) False. Zero covariance does not imply independence — only linear decorrelation. Counterexample: X ~ Uniform(−1,1), Y = X². Cov(X,Y) = E[X³] − 0 = 0 since X is symmetric (odd moments vanish). But Y is fully determined by X — perfect nonlinear dependence with zero covariance. Independence ⟹ zero covariance, not the reverse in general.`,
          `B) True. Zero covariance is the standard definition of independence for continuous random variables. The only exception is discrete distributions with finite support, where the covariance can be zero while some higher-order dependence remains. For continuous distributions, Cov(X,Y) = 0 ⟺ independence.`,
          `C) False. Counterexample: X ~ N(0,1) and Y = |X|. Cov(X,Y) = E[X|X|] = 0 by symmetry, since x|x| is an odd function integrated against a symmetric density. But Y is not independent of X, since Y = |X| is a deterministic function of X. Zero covariance is only guaranteed to imply independence when X and Y are jointly Gaussian.`,
          `D) True for jointly Gaussian variables, but also true whenever X has finite support — with finitely many values to check, zero covariance is claimed to be enough to rule out dependence. Example: X ~ Bernoulli(0.5) taking values ±1, Y = X². Cov(X,Y) = E[X³] − E[X]E[X²] = 0 − 0 = 0, so by this (flawed) reasoning X and Y must be independent.`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `You compute P(missed_payments ≥ 2 | age > 30) = P(age > 30, missed_payments ≥ 2) / P(age > 30) = 0.15 from the joint distribution. A colleague claims this number also tells you P(age > 30 | missed_payments ≥ 2). Is the colleague right?`,
        options: [
          `A) Yes — conditional probabilities are symmetric. Since both are computed from the same joint probability P(age > 30, missed_payments ≥ 2), dividing by either marginal gives numbers that mean the same thing.`,
          `B) No. P(age > 30 | missed_payments ≥ 2) = P(age > 30, missed_payments ≥ 2) / P(missed_payments ≥ 2) — the same joint-probability numerator, but divided by a different marginal (the marginal of missed_payments ≥ 2, not of age > 30). Without that second marginal, the two conditionals cannot be assumed equal.`,
          `C) No, because P(age > 30 | missed_payments ≥ 2) only exists if age and missed_payments are independent, and this dataset shows they are dependent, so the conditional probability is undefined here.`,
          `D) Yes, because dividing the same joint probability by any marginal produces equivalent conditional probabilities up to a constant scaling factor that cancels out when comparing the two directions.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Zero correlation rules out linear dependence only. Two variables can have ρ = 0 while one is a deterministic function of the other. If you need to test actual independence — not just linear independence — use mutual information or a rank-based test.`,
    figures: {
      joint: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="90" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Y = X² : rho = 0</text>
  <text x="270" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">linear : rho = 0.85</text>
  <line x1="20" y1="100" x2="160" y2="100" stroke="var(--rim)"/><line x1="20" y1="20" x2="20" y2="100" stroke="var(--rim)"/>
  <path d="M20,30 Q90,120 160,30" fill="none" stroke="var(--prime)" stroke-width="1" stroke-dasharray="2 2"/>
  <circle cx="30" cy="88" r="2" fill="var(--prime)"/><circle cx="50" cy="62" r="2" fill="var(--prime)"/><circle cx="70" cy="44" r="2" fill="var(--prime)"/><circle cx="90" cy="36" r="2" fill="var(--prime)"/><circle cx="110" cy="44" r="2" fill="var(--prime)"/><circle cx="130" cy="62" r="2" fill="var(--prime)"/><circle cx="150" cy="88" r="2" fill="var(--prime)"/>
  <line x1="200" y1="100" x2="340" y2="100" stroke="var(--rim)"/><line x1="200" y1="20" x2="200" y2="100" stroke="var(--rim)"/>
  <line x1="205" y1="92" x2="335" y2="30" stroke="var(--amber)" stroke-width="1" stroke-dasharray="2 2"/>
  <circle cx="215" cy="90" r="2" fill="var(--amber)"/><circle cx="240" cy="80" r="2" fill="var(--amber)"/><circle cx="255" cy="70" r="2" fill="var(--amber)"/><circle cx="280" cy="62" r="2" fill="var(--amber)"/><circle cx="300" cy="48" r="2" fill="var(--amber)"/><circle cx="325" cy="38" r="2" fill="var(--amber)"/>
  <text x="180" y="115" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">left: perfect dependence, zero covariance — rho misses nonlinear structure</text>
</svg>`,
    },
    recap: [
      "**Joint P(X,Y) is required when features are dependent** — can't multiply P(X)×P(Y) unless independent.",
      "**Marginal = sum/integrate out the other variable;** conditional $P(Y|X)=P(X,Y)/P(X)$ is the Bayes denominator.",
      "**Independence ⟺ P(X,Y)=P(X)P(Y) for all values.** Naive Bayes assumes this — usually false.",
      "**Cov(X,Y)=E[XY]−E[X]E[Y];** ρ = Cov/(σ_X σ_Y) ∈ [−1,1]. Captures linear relationship only.",
      "**Zero correlation ≠ independence:** X~Uniform(−1,1), Y=X² has Cov=0 but Y fully determined by X.",
      "**Correlated features double-count evidence** in Naive Bayes → miscalibrated, over-confident probabilities.",
      "**For real independence use mutual information or a rank test**, not Pearson correlation.",
    ],
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

**NOT this.** Most people think cross-entropy is just a loss function that happens to work well. Cross-entropy is an information-theoretic quantity measuring encoding efficiency. When the model is perfectly calibrated, cross-entropy equals entropy — no wasted bits. The loss function framing hides why cross-entropy is the *right* choice, not merely a convenient one. It also hides the direction of KL: forward KL ($KL(p \| q)$, used in training) forces the model to cover all modes of the true distribution. Reverse KL ($KL(q \| p)$, used in the $q(z|x)$-to-prior term of a VAE's ELBO) is mode-seeking — it lets the approximate posterior concentrate on a subset of the true posterior's modes rather than spreading across all of them. In VAEs this shows up as *posterior collapse* (an uninformative latent code and blurry, averaged reconstructions), not literally a single repeated output — that failure mode is GAN-style mode collapse instead. These produce qualitatively different learned distributions — mode-covering versus mode-seeking.`,
    interactivePrompt: `Before you touch the controls: if a fair coin has entropy of 1 bit, what do you think the entropy of a coin that lands heads 99% of the time would be — close to 1 bit, close to 0 bits, or somewhere in between?`,
    keyPoints: [
      `**Use cross-entropy loss for classification, not MSE.** Cross-entropy penalises confident wrong predictions exponentially: predicting 0.99 probability for the wrong class means the correct class gets only 0.01, so cross-entropy charges $-\\log(0.01) \\approx 6.6$ bits of punishment. MSE on that same 0.01 is $(1 - 0.01)^2 = 0.9801$ — also large, so a small loss *value* is not why MSE loses here. The real reason is the gradient: MSE's gradient through a saturated sigmoid/softmax vanishes as the prediction nears 0 or 1, so a confidently wrong prediction barely gets corrected. Cross-entropy's gradient stays large exactly when the prediction is confidently wrong, so training keeps pushing. Any classifier trained with MSE on softmax outputs will be underpenalised for overconfident errors.`,
      `**The production trap: KL direction determines whether your model covers all modes or seeks just one.** Maximum likelihood training minimises forward KL — the model must assign non-zero probability everywhere the data has density (mode-covering). The $q(z|x)$-to-prior term in a VAE's ELBO minimises a reverse KL, which is mode-seeking — the approximate posterior can concentrate on a subset of the true posterior's modes and ignore the rest. In practice this shows up in VAEs as *posterior collapse*, not GAN-style output mode collapse: the latent code goes uninformative and the decoder falls back to blurry, averaged reconstructions rather than literally one repeated output. If your VAE produces near-identical, averaged-looking outputs regardless of the latent code, posterior collapse — not "reverse KL mode collapse" — is the diagnosis to reach for.`,
      `**The diagnostic: use mutual information $I(X;Y) = H(X) - H(X|Y)$ for feature selection, not Pearson correlation.** Correlation only detects linear relationships. A feature where $Y = X^2$ has zero correlation with $X$ but high mutual information — the feature is perfectly predictive but nonlinearly so. Any feature with $I(X;Y) = 0$ is truly independent of the label, but the reverse direction is not free: zero covariance does not generally imply zero mutual information — that guarantee only holds when X and Y are jointly Gaussian. For a general (non-Gaussian) joint distribution, Cov(X,Y) = 0 can still coexist with I(X;Y) > 0, exactly as in the $Y=X^2$ example above. Estimators like MINE make this tractable even for high-dimensional continuous features.`,
      `**Functions of a random variable can only lose information, never gain it — the data processing inequality.** If $Y = f(X)$ for any function $f$, then $H(Y) \\le H(X)$: coarsening, discretising, or summarising a variable can hold or destroy information but never create it. This is why grouping a six-sided die roll into 'even or odd' has lower entropy than the die itself — the coarsened variable is a function of the original, so it cannot carry more uncertainty than its input.`,
    ],
    checkQuestions: [
      {
        q: `Compute H(X) for a fair six-sided die. Then compute H(Y) where Y = 'even or odd' (2 outcomes). Why is H(Y) < H(X)?`,
        options: [
          `A) H(X) = log₂(6) ≈ 2.585 bits. H(Y) = log₂(2) = 1 bit. H(Y) < H(X) because Y has fewer outcomes. More outcomes always means higher entropy, since the uniform distribution maximises entropy and a 6-outcome uniform has strictly more uncertainty than a 2-outcome one.`,
          `B) H(X) = −6·(1/6)·log₂(1/6) = log₂(6) ≈ 2.585 bits. H(Y) = −2·(1/2)·log₂(1/2) = 1 bit. H(Y) < H(X) because Y has higher probability on each outcome (1/2 vs. 1/6) — higher probability means less surprise per event, so less information is needed.`,
          `C) H(X) = 6 bits (one bit per face). H(Y) = 2 bits (one bit per outcome). H(Y) < H(X) because knowing Y = 'even' still requires 3 bits to specify which even face, so H(X|Y) = log₂(3) ≈ 1.585. The conditional entropy accounts for the remaining uncertainty.`,
          `D) H(X) = −Σ P(xᵢ)log₂P(xᵢ) = log₂(6) ≈ 2.585 bits. H(Y) = 1 bit. H(Y) < H(X) because Y is a coarsening of X — functions of a random variable cannot increase entropy (data processing inequality). More equally-likely outcomes means more uncertainty.`,
        ],
        answer: `D`,
      },
      {
        q: `What is KL divergence D_KL(P||Q), and why is it asymmetric? Give an ML example where direction matters.`,
        options: [
          `A) D_KL(P||Q) = Σ P(x)·log(P(x)/Q(x)) = E_P[log(P(x)/Q(x))]. Asymmetric: D_KL(P||Q) ≠ D_KL(Q||P) in general, equal only when P=Q. In ML: minimising forward KL (P_data||Q_model), used in MLE, forces Q to cover all modes where P_data is nonzero (mode-covering). Minimising reverse KL (Q_model||P_data), used in the KL term of a VAE's ELBO, is mode-seeking — Q concentrates on a subset of P's modes rather than covering all of them (in VAEs this shows up as posterior collapse, not GAN-style output mode collapse).`,
          `B) D_KL(P||Q) = Σ Q(x)·log(Q(x)/P(x)) — the expected log-ratio under Q. Asymmetry arises because Q is the reference distribution in the expectation. In ML: forward KL is used in MLE (fitting model Q to data P), and reverse KL is used when sampling from Q to approximate P. The practical difference is negligible for unimodal distributions but large for multimodal ones.`,
          `C) D_KL(P||Q) = Σ P(x)·log(P(x)/Q(x)). KL is symmetric only when both P and Q are from the same exponential family with matched natural parameters. Asymmetry otherwise arises whenever the distributions have different supports. In ML: the direction matters only for variational inference, not for MLE, because MLE minimises the forward KL, which equals cross-entropy up to a constant.`,
          `D) D_KL(P||Q) = Σ P(x)·log(P(x)/Q(x)). KL divergence is asymmetric because the weight assigned to each term differs: forward KL weights by P, reverse KL weights by Q. In ML: both directions give identical solutions when the model is correctly specified. The direction only matters under model misspecification, where forward KL favors spreading mass and reverse KL favors concentrating it.`,
        ],
        answer: `A`,
      },
      {
        q: `Mutual information I(X;Y) = 0. Which TWO of the following statements about this condition, and how it relates to Cov(X,Y) = 0, are true?`,
        options: [
          `A) I(X;Y) = H(X) − H(X|Y) = 0 means knowing Y provides zero information about X: H(X|Y) = H(X). This implies X and Y are statistically independent — P(X,Y) = P(X)P(Y) for all values, since MI detects any statistical dependence, not just linear.`,
          `B) Zero MI is strictly stronger than zero covariance: I(X;Y) = 0 ⟹ Cov(X,Y) = 0 always, but Cov(X,Y) = 0 does not imply I(X;Y) = 0 in general — only for jointly Gaussian distributions does zero covariance also guarantee zero mutual information.`,
          `C) I(X;Y) = 0 means the entropy of X equals the entropy of Y — both variables carry the same amount of information, regardless of any dependence structure between them. This is a statement about individual uncertainty, not about their joint relationship.`,
          `D) I(X;Y) = 0 means H(X|Y) = 0 — that is, X is completely determined by Y. This is the strongest form of dependence, where knowing Y eliminates all uncertainty about X, making zero MI equivalent to perfect predictability rather than independence.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `Minimising cross-entropy is minimising KL divergence from your model to the true distribution. Cross-entropy is not an arbitrary loss — it is the exact measure of encoding waste, and that framing tells you why the KL direction matters.`,
    recap: [
      "**Bits to encode probability $p$ = $-\\log_2(p)$;** entropy $H=-\\sum p(x)\\log p(x)$ = average bits / uncertainty.",
      "**Cross-entropy $H(p,q)=-\\sum p\\log q$** = bits spent when you encode true $p$ with wrong $q$.",
      "**KL = the waste:** $KL(p\\|q)=H(p,q)-H(p)$. Minimising cross-entropy = minimising KL to the true distribution.",
      "**Cross-entropy loss $=-\\log(\\hat{y}_{correct})$** — an encoding-efficiency measure, not an arbitrary loss.",
      "**Use cross-entropy, not MSE, for classification:** confident wrong 0.99 → $-\\log(0.01)\\approx 6.6$ bits; MSE gives $0.9801$, also large — the real reason CE wins is that MSE's gradient vanishes under sigmoid/softmax saturation, while CE's does not.",
      "**KL direction matters:** forward KL (MLE) is mode-covering; reverse KL (VAE's q(z|x)-to-prior term) is mode-seeking — in VAEs this shows up as posterior collapse (uninformative latents, blurry output), not GAN-style mode collapse.",
      "**Mutual information $I(X;Y)=H(X)-H(X|Y)$** detects nonlinear dependence correlation misses; $I=0$ ⟹ truly independent. Cov=0 ⟹ $I=0$ only for jointly Gaussian variables.",
      "**Data processing inequality:** $Y=f(X)$ ⟹ $H(Y) \\le H(X)$ — a function/coarsening of a variable can only lose information, never gain it.",
    ],
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

A norm ‖v‖ measures a vector's length; different norms make different tradeoffs. The L2 (Euclidean) norm ‖v‖₂ = √(∑ᵢ vᵢ²) is the one used in the dot product formula above — for v = [3, 4], ‖v‖₂ = √(9+16) = 5. The L1 norm ‖v‖₁ = ∑ᵢ|vᵢ| sums absolute values (for the same v, 3+4 = 7); minimizing it (Lasso) drives some coefficients to exactly zero, because its penalty grows at a constant rate per coordinate instead of shrinking smoothly toward zero. The L∞ norm ‖v‖∞ = maxᵢ|vᵢ| just takes the largest coordinate. Which norm a loss function penalizes changes what solutions look like: L2 regularization (Ridge, below) shrinks every coefficient a little; L1 regularization (Lasso) zeroes some out entirely.

**NOT this.** Linear algebra is not just matrix arithmetic for solving linear systems. Every gradient descent step in a neural network is a matrix-vector multiplication. Every embedding lookup is a dot product. PCA is eigenvector decomposition of the covariance matrix. Attention is softmax(QK^T / √d)V — two matrix products (QK^T, then the softmax output times V). The Gram matrix X^T X appears in every regularized linear model. Linear algebra is the operational language of every ML computation, and understanding it geometrically — as transformations of space — is what lets you reason about what information your model is processing.

[FIGURE:rank]`,
    keyPoints: [
      `**When a matrix operation fails or gives unexpected results, check dimensions first.** Almost all linear algebra bugs are shape mismatches. Write out the expected shape of every tensor before the operation and verify them in code. In numpy, \`.shape\` before every new operation is not paranoia — it is the cheapest debugging step you have.`,
      `**Trap: computing the matrix inverse to solve Ax = b.** The inverse A⁻¹ is numerically unstable for ill-conditioned matrices and costs O(n³) to compute. Use scipy.linalg.solve(A, b) instead — it uses LU decomposition, is faster, and is more numerically stable. The only reason to compute A⁻¹ explicitly is if you need to multiply by the same inverse many times.`,
      `**Diagnostic: if X^T X is near-singular (condition number — the ratio of its largest to smallest singular value — greater than 1e10), you have multicollinear features or rank-deficient data.** Add L2 regularization to form X^T X + λI, which is always invertible for λ > 0. This is exactly what Ridge regression does — but for any fixed λ > 0, Ridge's solution (X^T X + λI)⁻¹X^T y is a biased, shrunk estimator, not the minimum-norm solution to the original normal equations. The true minimum-norm solution (via the Moore–Penrose pseudoinverse) is only the λ→0⁺ limit of the ridge family — it is not what Ridge computes at any regularization strength actually used in practice.`,
    ],
    interactivePrompt: `Before you touch the controls: if two columns of a matrix are identical, what do you think happens to the rank — and what does that mean for the ability to invert a matrix formed from that data?`,
    checkQuestions: [
      {
        q: `A system Ax=b where A is 3×5 (3 equations, 5 unknowns). What can you say about the solution set? When does a solution exist?`,
        options: [
          `A) A is 3×5 with rank r ≤ min(3,5) = 3. If rank(A) = 3 (full row rank): Ax=b is consistent for every b, since col(A) spans ℝ³. The solution is not unique — there are 5−3 = 2 free variables, so the solution set is a 2-dimensional affine subspace of ℝ⁵. If rank(A) < 3, some b outside col(A) has no solution.`,
          `B) A is 3×5 so the system has more equations than unknowns — it is overdetermined and generically has no exact solution. We use least squares: x̂ = (AᵀA)⁻¹Aᵀb. AᵀA is 5×5 and full rank when A has rank 5, so the system is uniquely solvable via the normal equations, with residual r = b − Ax̂ orthogonal to every column of A by construction.`,
          `C) A is 3×5 with 3 equations and 5 unknowns, giving 5−3=2 degrees of freedom. A solution always exists because the system is underdetermined — there are always more unknowns than equations, so b is always reachable regardless of rank. The unique minimum-norm solution is x̂ = Aᵀ(AAᵀ)⁻¹b, found by inverting the 3×3 Gram matrix AAᵀ directly.`,
          `D) A is 3×5, so the column space of A has dimension at most 5, since a matrix's column space dimension equals its number of columns. Ax=b has a unique solution whenever rank(A)=3 and b is in the column space, and infinitely many solutions when rank(A)<3. There are always exactly 5−3=2 free variables in either case, independent of b.`,
        ],
        answer: `A`,
      },
      {
        q: `You compute the dot product of two vectors: u·v = ‖u‖‖v‖cos(θ) = 0. What does this mean geometrically, and what does it mean in ML for feature representations?`,
        options: [
          `A) u·v = 0 means either u = 0 or v = 0 — at least one vector is the zero vector, since the zero vector has undefined direction and magnitude 0. In ML, if a feature representation u = 0, that data point has no learned embedding and receives uniform attention weights from every query, making it effectively invisible to the model.`,
          `B) u·v = 0 means the vectors have equal magnitude (‖u‖ = ‖v‖). Geometrically, equal-length vectors that differ only in direction have zero dot product when aligned symmetrically around the origin. In ML, this means the two representations encode the same amount of information but in completely different directions.`,
          `C) u·v = 0 means u and v are linearly dependent — one is a scalar multiple of the other, i.e. v = ku for some real k. Geometrically, they point in exactly the same or exactly opposite directions. In ML, linearly dependent feature vectors indicate that two data points have proportional feature activations — they lie on the same ray through the origin, differing only by a scale factor.`,
          `D) u·v = 0 means θ = 90° — the vectors are orthogonal, geometrically perpendicular in ℝⁿ. In ML, if u and v are feature representations of two points, this means the features share no common activation pattern. For embeddings, u·v = 0 means the two entities have no learned similarity; after normalising, cos(θ)=u·v/(‖u‖‖v‖) is the cosine similarity, 0 at orthogonality.`,
        ],
        answer: `D`,
      },
      {
        q: `The matrix A = [[2, 1], [4, 2]] is singular. Which TWO of the following statements about it are true?`,
        options: [
          `A) det(A) = 2×2 − 1×4 = 0, so A is singular; equivalently, row 2 = 2×row 1, so the rows are linearly dependent. The null space of A is spanned by v = [1, −2]ᵀ (since Av = 0) — this is exactly the direction that collapses to zero, so any two inputs differing by a multiple of v produce the same output Ax.`,
          `B) det(A) = 2×2 − 1×4 = 0 → A is singular, with rank 1 — the column space is a one-dimensional line through the origin in ℝ². For Ax=b: if b lies on that line there are infinitely many solutions (a 1D affine subspace); if b does not lie on that line, no solution exists at all, since b is unreachable.`,
          `C) Row 2 = 2 × row 1, so the rows are linearly dependent and det(A) = 0. For Ax=b: the system always has infinitely many solutions because the null space is non-trivial — the extra degree of freedom means we can always shift any particular solution by a null space vector, so the system is never inconsistent for any b.`,
          `D) det(A) = 4 − 4 = 0 and trace(A) = 2+2 = 4. Since A is singular with equal diagonal entries, both eigenvalues equal 2 — the characteristic polynomial factors as (λ−2)² = 0. For Ax=b: the matrix is rank-deficient, so we need the pseudoinverse A⁺ = VΣ⁺Uᵀ to get the minimum-norm least-squares solution.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `Every ML forward pass is matrix multiplication and nonlinearities. Rank tells you where information is irreversibly lost. Norms tell you what geometry an algorithm assumes. Both predict failure modes before you run a single experiment.`,
    figures: {
      rank: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="55" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">full rank (r=2)</text>
  <rect x="20" y="24" width="70" height="50" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="55" y="52" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">invertible · fills plane</text>
  <path d="M100,49 l24,0" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#m1)"/>
  <text x="200" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">rank-deficient (r=1)</text>
  <rect x="150" y="24" width="70" height="50" rx="3" fill="var(--prime-faint)" stroke="var(--prime)" stroke-dasharray="3 2"/>
  <line x1="150" y1="70" x2="220" y2="30" stroke="var(--amber)" stroke-width="2.5"/>
  <text x="185" y="52" text-anchor="middle" fill="var(--ink-mid)" font-size="7">collapses to a line</text>
  <path d="M230,49 l24,0" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#m1)"/>
  <text x="305" y="45" text-anchor="middle" fill="var(--ink-hi)" font-size="8">det = 0</text>
  <text x="305" y="58" text-anchor="middle" fill="var(--ink-mid)" font-size="7">not invertible</text>
  <text x="180" y="90" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">rank = output dimensions the matrix can reach; a drop in rank is information lost forever</text>
  <defs><marker id="m1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
    recap: [
      "**Every ML op is a matrix op:** normalise, covariance, regression, PCA, forward pass — all linear algebra.",
      "**Dot product $a\\cdot b=\\|a\\|\\|b\\|\\cos\\theta$** measures alignment; 0 = orthogonal. Basis of cosine similarity.",
      "**Matrix product = row·column; not commutative** (AB ≠ BA); shapes must match (m×k)(k×n)→(m×n).",
      "**Rank = number of independent directions.** Rank-deficient X → XᵀX singular → normal equations have no unique solution.",
      "**Normal equations:** $\\theta=(X^TX)^{-1}X^Ty$ — the Gram matrix XᵀX appears in every linear model.",
      "**Debug shapes first** — most linear algebra bugs are shape mismatches. Don't invert to solve Ax=b; use `solve`.",
      "**Near-singular XᵀX (κ, the ratio of largest to smallest singular value, > 1e10) = multicollinearity;** Ridge adds λI to make it invertible — but Ridge is a biased, shrunk estimator, not the min-norm fix (the true min-norm solution is only the λ→0⁺ limit).",
    ],
  },
  {
    id: 'eigendecomposition',
    interactiveId: 'eigen_geometry_viz',
    title: 'Eigenvalues & Eigenvectors',
    subtitle: 'Geometric intuition, spectral theorem, power iteration',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['eigenvalues', 'eigenvectors', 'spectral theorem'],
    summary: `You have customer behavioral data with 50 features. Three of them — features 3, 7, and 22 — are all variations of "how much did the user spend." They carry similar information while consuming three times the parameter weight in regularization and three times the compute in every matrix operation. If you could find the single direction that captures the spending signal, you would reduce noise, compute, and overfitting simultaneously. That direction is a principal component — an eigenvector.

A square matrix A has eigenvalue λ and eigenvector v if Av = λv. The matrix A acts on v by pure scaling — the direction does not change, only the magnitude. For a symmetric positive semidefinite matrix like a covariance matrix, all eigenvalues are ≥ 0 and all eigenvectors are orthogonal. This is what makes PCA geometrically clean: the principal components are mutually perpendicular directions.

The covariance matrix C = X^T X / (n-1). Its eigenvectors are the principal directions of variance in the data. Its eigenvalues tell you how much variance lies along each direction. The first eigenvector, with the largest eigenvalue, is the direction of maximum variance — this is PC1. The second eigenvector, orthogonal to PC1, is PC2. The eigenvalue ratio λ₁ / Σλᵢ tells you the fraction of total variance captured by PC1.

Spectral theorem: any real symmetric matrix A decomposes as A = Q Λ Q^T where Q is orthogonal (columns are eigenvectors) and Λ is diagonal (eigenvalues on diagonal). This decomposition separates the rotating part (Q) from the scaling part (Λ). For PCA, Q gives you the rotation into principal component space, and Λ tells you how much each direction matters. This "orthogonal matrix's columns are eigenvectors" fact is special to symmetric A, though — it is not a general property of orthogonal matrices. A generic orthogonal matrix (a rotation, say) is not diagonalized by its own columns, and can have no real eigenvectors at all: the rotation R = [[0,−1],[1,0]] (a 90° turn) solves det(R−λI) = λ²+1 = 0, giving λ = ±i — no real eigenvalue, because no real vector keeps its direction under a genuine rotation; every real vector just gets turned 90°. The general 2D rotation R(θ) = [[cos θ,−sin θ],[sin θ,cos θ]] has eigenvalues λ = cos θ ± i·sin θ = e^{±iθ}, real only at θ=0 (λ=1, R=I) or θ=180° (λ=−1, R=−I). Symmetric matrices are guaranteed real eigenvalues and orthogonal eigenvectors; non-symmetric matrices are not.

Multiplying Q Λ Q^T out column by column turns the matrix form into a sum of rank-1 matrices: A = Σᵢ λᵢ vᵢ vᵢ^T, where each vᵢvᵢ^T is a rank-1 projector — project onto the line spanned by vᵢ, then scale by λᵢ. Worked example: A = [[4,1],[1,4]] has eigenvalues λ₁=5 with eigenvector v₁=[1,1]/√2, and λ₂=3 with eigenvector v₂=[1,−1]/√2. Check the sum directly: 5·v₁v₁^T = 5·[[0.5,0.5],[0.5,0.5]] = [[2.5,2.5],[2.5,2.5]], and 3·v₂v₂^T = 3·[[0.5,−0.5],[−0.5,0.5]] = [[1.5,−1.5],[−1.5,1.5]]; adding them gives [[4,1],[1,4]] = A. So A is nothing more than "project onto v₁ and stretch by 5" plus "project onto v₂ and stretch by 3" — the sum-of-rank-1-projectors view and the QΛQ^T matrix view are the same object, just written two different ways.

**NOT this.** Eigenvalues are not a mathematical abstraction with limited practical use. The eigenvalues of a neural network's Hessian determine optimization dynamics: a flat loss landscape has many near-zero eigenvalues sitting alongside a few large ones, so the condition number κ = λ_max/λ_min is huge. Vanilla SGD uses one global step size, capped by the steepest direction (λ_max) so it doesn't diverge there — which forces that same tiny step size onto the near-zero-eigenvalue flat directions too, so progress along those directions crawls. Adam instead rescales each parameter's step by a running estimate of that parameter's own gradient magnitude, which approximates dividing by the local curvature per direction — so in the same update it can take a large step along a flat (near-zero-eigenvalue) direction and a small step along a steep (large-eigenvalue) direction. That per-direction rescaling — not the mere presence of near-zero eigenvalues — is why Adam with good initialization typically converges faster than vanilla SGD on the same ill-conditioned, overparameterized loss surface. The eigenvalues of the attention matrix determine how information diffuses through a transformer layer. The eigenvalue spectrum of X^T X tells you the effective dimensionality of your data before you fit any model. Eigenvalues are the fingerprint of every matrix that matters in ML.

[FIGURE:eigen]`,
    keyPoints: [
      `**When features are correlated, eigendecompose the covariance matrix before modeling.** The eigenvalue spectrum tells you how many truly independent directions of variation exist in your data. If 5 of 50 eigenvalues contain 90% of the variance, you can reduce to 5 components with negligible information loss — the remaining 45 components are dominated by noise and correlations, not signal.`,
      `**Trap: forgetting to center data before computing the covariance matrix.** If the mean is nonzero, the first eigenvector points toward the mean rather than toward the direction of maximum variance. Always subtract the column means from X before computing X^T X / (n-1). sklearn's PCA does this by default. If you compute the covariance matrix manually, centering is mandatory.`,
      `**Diagnostic: plot the explained variance ratio (eigenvalue_i / sum of all eigenvalues) as a cumulative curve.** The elbow in the curve tells you how many components to keep. Where the curve flattens, adding more components yields diminishing returns — each additional component explains only noise. A sharp elbow at k components means the data lies approximately on a k-dimensional subspace.`,
      `**Power iteration finds the dominant eigenvector without ever forming the full eigendecomposition:** starting from any v₀, repeatedly apply v ← Av/‖Av‖. Expand v₀ in the eigenbasis, v₀ = Σᵢ cᵢvᵢ; then Aᵏv₀ = Σᵢ cᵢλᵢᵏvᵢ = λ₁ᵏ(c₁v₁ + Σᵢ>1 cᵢ(λᵢ/λ₁)ᵏvᵢ). Since |λᵢ/λ₁| < 1 for every i>1, those terms shrink geometrically with k and only the c₁v₁ term survives — the ‖Av‖ normalisation at each step just prevents overflow/underflow, it doesn't change which direction wins. The convergence rate is |λ₂/λ₁|ᵏ: a large spectral gap (λ₁ ≫ λ₂) converges in a handful of iterations, a near-tie (λ₁≈λ₂) converges slowly. This is the algorithm behind PageRank: the dominant eigenvector of the web's link-transition matrix is the PageRank vector, found by repeated multiplication rather than by eigendecomposing a matrix with billions of rows.`,
    ],
    interactivePrompt: `Before you touch the controls: if a covariance matrix has one very large eigenvalue and many near-zero eigenvalues, what do you think the data looks like geometrically — and what does that imply about how many dimensions you actually need to describe it?`,
    checkQuestions: [
      {
        q: `What are the eigenvalues and eigenvectors of a rotation matrix R(θ) = [[cos θ, −sin θ], [sin θ, cos θ]]?`,
        options: [
          `A) The eigenvalues are cos θ ± sin θ (real values). The eigenvectors are [cos θ, sin θ]ᵀ and [−sin θ, cos θ]ᵀ — the columns of the rotation matrix itself. This holds because the columns of any orthogonal matrix are its eigenvectors, and rotation matrices are orthogonal, giving R = QΛQᵀ with Λ = diag(cosθ+sinθ, cosθ−sinθ).`,
          `B) The eigenvalues are always λ₁=1, λ₂=1 because rotation preserves lengths: ‖Rv‖=‖v‖ for all v, so the scaling factor is always 1. The eigenvectors are the axes of rotation. For 2D rotations with θ≠0, the only axis is the origin, so applying the characteristic equation gives (1−λ)²=0, a double root regardless of θ.`,
          `C) det(R − λI) = (cosθ − λ)² + sin²θ = 0 → λ² − 2λcosθ + 1 = 0 → λ = cosθ ± i·sinθ = e^{±iθ}. For θ ≠ 0, π, the eigenvalues are complex — there are no real eigenvalues, since no real vector keeps its direction under a genuine rotation. At θ=0, R=I (both eigenvalues 1); at θ=π, R=−I (both eigenvalues −1).`,
          `D) The eigenvalues are real only when θ = kπ for integer k (0°, 180°, etc.). For general θ, R has no eigenvalues because eigenvalue equations require real solutions. The characteristic polynomial's real part gives a single real eigenvalue λ=cosθ with multiplicity 2, and the imaginary part sinθ is discarded as a numerical artifact.`,
        ],
        answer: `C`,
      },
      {
        q: `A symmetric matrix A has eigenvalues λ₁=5, λ₂=3, λ₃=1 and orthonormal eigenvectors v₁, v₂, v₃. Write A as a sum of rank-1 matrices, and explain what this means geometrically.`,
        options: [
          `A) By the spectral theorem (A symmetric ⟹ A = QΛQᵀ, Q=[v₁,v₂,v₃], Λ=diag(5,3,1)): A = Σᵢ λᵢvᵢvᵢᵀ = 5v₁v₁ᵀ + 3v₂v₂ᵀ + 1v₃v₃ᵀ. Each vᵢvᵢᵀ is a rank-1 projector onto vᵢ. Geometrically: A stretches space by 5× along v₁, 3× along v₂, 1× along v₃ — a unit sphere maps to an ellipsoid with semiaxes 5, 3, 1 along the eigenvectors.`,
          `B) A = v₁v₁ᵀ + v₂v₂ᵀ + v₃v₃ᵀ since the eigenvectors are orthonormal and span ℝ³. The eigenvalues λ₁=5, λ₂=3, λ₃=1 scale the matrix as a whole rather than the individual rank-1 components. Geometrically: each rank-1 term projects onto one axis of the eigenbasis; A is the sum of all three projections, equal to the identity matrix in the eigenbasis.`,
          `C) A = 5·(v₁+v₂+v₃)(v₁+v₂+v₃)ᵀ/‖v₁+v₂+v₃‖² using only the dominant eigenvalue. The other eigenvalues contribute smaller corrections: A ≈ 5v₁v₁ᵀ with error ‖A−5v₁v₁ᵀ‖_F = √(9+1) = √10. Geometrically: A is approximately a rank-1 matrix pointing along v₁, with small perturbations along v₂ and v₃.`,
          `D) A = (5+3+1)·v_avg v_avgᵀ where v_avg = (v₁+v₂+v₃)/‖v₁+v₂+v₃‖. The spectral theorem decomposes A into a single rank-1 matrix scaled by the sum of eigenvalues. Geometrically: A uniformly stretches all vectors by 9× in the average eigenvector direction, matching tr(A)=9 since trace equals the eigenvalue sum.`,
        ],
        answer: `A`,
      },
      {
        q: `The power iteration algorithm computes the dominant eigenvector of A by repeatedly multiplying v ← Av/‖Av‖. Which TWO of the following statements correctly explain why this converges to the eigenvector for the largest eigenvalue?`,
        options: [
          `A) Power iteration works because matrix multiplication is associative: Aᵏv = A(A(...(Av)...)). At each step, the component of v along the dominant eigenvector grows relative to the others (by a factor of λ₁/λᵢ each iteration), so after k steps that direction dominates. This requires a unique dominant eigenvalue (|λ₁|>|λ₂|) and c₁≠0, i.e. v₀ not orthogonal to v₁.`,
          `B) Expand v₀ in the eigenbasis: v₀ = Σᵢ cᵢvᵢ. Applying A k times: Aᵏv₀ = Σᵢ cᵢλᵢᵏvᵢ = λ₁ᵏ(c₁v₁ + Σᵢ>1 cᵢ(λᵢ/λ₁)ᵏvᵢ). Since |λᵢ/λ₁|<1 for i>1, those terms vanish as k→∞, leaving just c₁v₁. Convergence rate is |λ₂/λ₁|ᵏ, fast when the spectral gap is large; PageRank uses exactly this on the web graph's transition matrix.`,
          `C) Power iteration converges because the gradient of ‖Av‖₂ with respect to v points toward the dominant eigenvector. Each normalised multiplication step performs a projected gradient ascent on the Rayleigh quotient vᵀAv/vᵀv, which is maximised at the dominant eigenvector. The convergence rate equals the learning rate times the spectral gap, roughly α·(λ₁−λ₂).`,
          `D) Power iteration converges because symmetric matrices have orthogonal eigenvectors. Starting from any v₀, each multiplication by A rotates v toward the dominant eigenvector direction. After k rotations, the angle between v and v₁ decreases geometrically at rate cos(θ/k). Non-symmetric matrices may not converge because their eigenvectors are not orthogonal.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `The eigenvalue spectrum of your covariance matrix is a complete picture of your data's intrinsic dimensionality. Check it before choosing a model — it tells you whether you have 50 independent features or 5 directions of variation dressed up as 50.`,
    figures: {
      eigen: `<svg viewBox="0 0 360 108" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Av = λv — direction preserved, length scaled</text>
  <ellipse cx="180" cy="62" rx="120" ry="34" fill="var(--prime-faint)" stroke="var(--prime)" transform="rotate(-20 180 62)"/>
  <line x1="70" y1="102" x2="290" y2="22" stroke="var(--rim)" stroke-dasharray="2 2"/>
  <line x1="180" y1="62" x2="255" y2="35" stroke="var(--prime)" stroke-width="2.5" marker-end="url(#e1)"/>
  <text x="262" y="30" fill="var(--prime)" font-size="8" font-weight="700">λ₁ v₁</text>
  <line x1="180" y1="62" x2="205" y2="90" stroke="var(--amber)" stroke-width="2.5" marker-end="url(#e2)"/>
  <text x="208" y="100" fill="var(--amber)" font-size="8" font-weight="700">λ₂ v₂</text>
  <circle cx="180" cy="62" r="2.5" fill="var(--ink-hi)"/>
  <text x="10" y="104" fill="var(--ink-low)" font-size="7.5">covariance ellipse: axes = eigenvectors, spread = √λ. Large λ₁ ≫ λ₂ ⟹ ~1D data</text>
  <defs>
    <marker id="e1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--prime)"/></marker>
    <marker id="e2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--amber)"/></marker>
  </defs>
</svg>`,
    },
    recap: [
      "**Av = λv:** the matrix scales v without rotating it. Eigenvectors are the invariant directions.",
      "**Covariance C = XᵀX/(n−1):** its eigenvectors are principal directions, eigenvalues the variance along each.",
      "**PC1 = eigenvector with largest eigenvalue** = direction of max variance; λ₁/Σλᵢ = fraction of variance captured.",
      "**Symmetric PSD (covariance) ⟹ eigenvalues ≥ 0, eigenvectors orthogonal** — this is what makes PCA clean.",
      "**Spectral theorem:** A = QΛQᵀ separates rotation (Q) from scaling (Λ).",
      "**Center data first** — otherwise the first eigenvector points at the mean, not the max-variance direction.",
      "**Scree/explained-variance elbow tells you how many components to keep;** the flat tail is noise, not signal.",
    ],
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

Two SVD variants matter here, and the quiz below tests the difference. The full SVD of an m×n matrix keeps every dimension: U is m×m orthogonal, Σ is m×n (padded with zero rows or columns beyond the rank), V is n×n orthogonal — U and V are square because their extra columns span the null spaces of M and Mᵀ, not just the row/column space. The compact SVD drops that padding: for a rank-r matrix, U shrinks to m×r, Σ to r×r diagonal holding only the r nonzero singular values, V to n×r — this still reconstructs M exactly, since rank(M)=r, it just discards the null-space columns that contributed nothing. The truncated (rank-k) SVD used above for the ratings matrix goes further: keep only the top k<r singular vectors — U becomes m×k, Σ becomes k×k, V becomes n×k — which is lossy by design, since only the k dominant latent factors matter for prediction.

The Eckart-Young theorem proves that keeping only the top-$k$ singular vectors gives the best possible rank-$k$ approximation: $M_k = \sum_{i=1}^k \sigma_i u_i v_i^T$. No other rank-$k$ matrix is closer to $M$ in either Frobenius or spectral norm. This is the mathematical guarantee behind every truncated SVD application — compression, denoising, dimensionality reduction.

Rank itself is a hard quantity to optimise directly: minimising rank(M) subject to matching a set of observed entries is NP-hard, because rank counts how many singular values are nonzero — the same L0-style combinatorial difficulty as minimising the number of nonzero entries in a vector. The standard fix mirrors the vector case: just as the L1 norm (sum of absolute values) is the convex relaxation used to encourage a sparse vector, the nuclear norm ‖M‖* = Σσᵢ (the sum of the singular values) is the convex relaxation used to encourage a low-rank matrix. Minimising the nuclear norm instead of rank is a tractable convex problem, and because it penalises the sum of singular values rather than merely their count, it pushes small singular values toward zero — the matrix version of L1 shrinking small coefficients to zero. This is the trick behind matrix completion algorithms (recovering a full matrix from a few observed entries, e.g. filling in the rest of that ratings matrix).

**NOT this.** Most people treat SVD and PCA as synonyms. They are not. SVD is a matrix factorization — a numerical decomposition that works on any matrix. PCA is a statistical method for finding directions of maximum variance in a dataset. PCA uses SVD as its computational engine: on mean-centered data, the right singular vectors of the data matrix equal the eigenvectors of the covariance matrix, and the two methods produce the same result. But SVD is more general (works on rectangular matrices, handles non-statistical applications like pseudo-inverses), and numerically more stable than computing the covariance matrix $X^T X$ explicitly, which squares the condition number (condition number κ = σ_max/σ_min, the ratio of the largest to smallest singular value — the higher it is, the more small numerical errors get amplified when you invert or solve with that matrix).`,
    interactivePrompt: `Before you touch the controls: if you truncate a matrix to rank 10 and it still captures 95% of the variance, what do you think happens to reconstruction quality if you increase to rank 50 — dramatic improvement, modest improvement, or nearly no change?`,
    keyPoints: [
      `**Use SVD when you need a low-rank approximation, a pseudo-inverse, or intrinsic dimensionality.** Call \`np.linalg.svd(X, full_matrices=False)\` and inspect the singular value spectrum. A sharp elbow in the scree plot tells you the effective rank of your data. Singular values below the elbow are noise — including them adds variance without signal to any downstream model.`,
      `**The production trap: computing PCA via eigendecomposition of the covariance matrix $X^T X$.** This squares the condition number: if $κ(X) = 100$, then $κ(X^T X) = 10,000$. Numerical errors get amplified by $κ^2$. Always compute PCA via SVD of the data matrix directly. sklearn\`s \`PCA\` does this by default. If you wrote your own PCA from scratch using \`np.linalg.eig\` on $X^T X$, replace it.`,
      `**The diagnostic: plot the singular value spectrum and check the condition number $κ = \sigma_{max}/\sigma_{min}$.** A condition number above $10^6$ means the matrix is nearly singular and any computation involving its inverse (least squares, linear regression) will be numerically unstable. The pseudoinverse $A^+ = V \Sigma^+ U^T$ handles this by zeroing near-zero singular values rather than inverting them — sklearn\`s LinearRegression uses this by default.`,
    ],
    checkQuestions: [
      {
        q: `A matrix M has SVD M = UΣVᵀ. Which TWO of the following correctly describe U, Σ, V and their dimensions for an m×n matrix with rank r?`,
        options: [
          `A) U is m×r (left singular vectors), Σ is r×r diagonal (nonzero singular values only), Vᵀ is r×n (right singular vectors) — this is the compact SVD. The full SVD pads U to m×m and V to n×n with extra columns spanning the null spaces. Mᵣ = UΣVᵀ at these dimensions reconstructs M exactly, since rank(M)=r.`,
          `B) U is n×n (input space), Σ is n×m (scaling), V is m×m (output space). The action of M = UΣVᵀ: U rotates in input space, Σ scales each dimension, Vᵀ is not a rotation because it maps between spaces of different dimensions. The singular values on the diagonal of Σ are the square roots of eigenvalues of MMᵀ.`,
          `C) U is m×r, Σ is r×r diagonal, V is n×r. Singular values σ₁ ≥ ... ≥ σᵣ > 0. The action of M=UΣVᵀ: U projects the r-dimensional input subspace, Σ scales, V maps to the output — the roles of U and V are swapped from the standard convention, so the pseudoinverse becomes M⁺ = UΣ⁻¹Vᵀ instead of VΣ⁻¹Uᵀ.`,
          `D) For M: m×n with rank r: U is m×m orthogonal (eigenvectors of MMᵀ); Σ is m×n diagonal (singular values σ₁≥...≥σᵣ>0, zeros elsewhere); V is n×n orthogonal (eigenvectors of MᵀM). The action: V rotates the input, Σ scales, U rotates the output. Best rank-k approx: Mₖ = Σᵢ₌₁ᵏ σᵢuᵢvᵢᵀ — the Eckart-Young theorem.`,
        ],
        answer: ['A', 'D'],
      },
      {
        q: `In a recommender system, you have a 10,000-user × 5,000-movie rating matrix M. You compute a truncated SVD with k=50. Explain what the k=50 components represent and how you would predict a missing rating.`,
        options: [
          `A) Truncated SVD Mₖ = UₖΣₖVₖᵀ: Uₖ is 10,000×50 (each user's latent preference vector); Σₖ is 50×50 diagonal (importance of each factor); Vₖᵀ is 50×5000 (each movie's latent attribute vector). The 50 components are latent factors, uninterpretable but capturing co-rating patterns. To predict M_{ij}: compute uᵢᵀΣₖvⱼ, the dot product of user i's and movie j's latent vectors.`,
          `B) The k=50 components are the 50 most popular movies — the singular values rank movies by total rating activity. Uₖ is a 10,000×50 matrix where each row gives a user's ratings for the top-50 movies. To predict M_{ij}: find the nearest user in the top-50 movie subspace and copy their rating for movie j. The truncated SVD provides both dimensionality reduction and a nearest-neighbor lookup structure.`,
          `C) The k=50 SVD components represent 50 user clusters. Uₖ contains cluster assignments (soft), Σₖ contains cluster sizes, Vₖᵀ contains cluster-to-movie affinity scores. To predict M_{ij}: identify user i's cluster membership from row i of Uₖ, then use the cluster's movie preferences from Vₖᵀ. Missing ratings are predicted by the weighted average of cluster preferences, weighted by cluster membership probability and normalized per user.`,
          `D) The k=50 components represent the 50 highest-variance rating patterns across users and movies. Uₖ contains the top-50 left singular vectors describing user variance, Vₖᵀ contains the top-50 right singular vectors describing movie variance. To predict M_{ij}: interpolate between observed ratings using the low-rank structure — M_{ij} ≈ mean_rating + uᵢᵀvⱼ where the dot product captures user-movie affinity after mean-centering.`,
        ],
        answer: `A`,
      },
      {
        q: `The nuclear norm of a matrix is the sum of its singular values. Why is it used as a convex relaxation for minimising rank?`,
        options: [
          `A) The nuclear norm is a convex relaxation of rank because it is the dual norm of the spectral norm (largest singular value). Any norm can serve as a regulariser; the nuclear norm specifically penalises the sum of singular values, which encourages the matrix to have a small spectral radius rather than low rank, since spectral radius bounds the nuclear norm from below.`,
          `B) The nuclear norm ‖M‖_* = Σσᵢ equals rank(M) when all singular values are exactly 1 (orthogonal matrices), and is larger otherwise. Minimising the nuclear norm subject to constraints therefore minimises how far the singular values deviate from 1, which indirectly minimises rank by shrinking small singular values toward zero before large ones.`,
          `C) Rank minimisation is NP-hard: minimise rank(M) subject to constraints. The nuclear norm ‖M‖_* = Σσᵢ is the tightest convex relaxation of rank — the analogy to L1/L0: L0-norm is NP-hard to minimise, L1 is its relaxation and gives sparsity. rank(M) counts nonzero singular values; nuclear norm sums them, promoting small singular values just as L1 promotes small absolute values.`,
          `D) The nuclear norm is convex because it is a sum of convex functions (each σᵢ is convex in the matrix entries). It relaxes rank minimisation because rank(M) = lim_{p→0} ‖σ‖_p^p (the L0 norm of singular values), and the nuclear norm is the nearest convex function above this limit. The nuclear norm ball {M : ‖M‖_* ≤ 1} is the convex hull of rank-1 matrices with unit spectral norm, used in matrix completion bounds.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `SVD reveals intrinsic dimensionality (the singular value spectrum) and numerical stability (the condition number) in a single call — read both before trusting any computation on that matrix.`,
    recap: [
      "**SVD $M \\approx U\\Sigma V^T$ factors any matrix** — rectangular OK, unlike eigendecomposition (square only).",
      "**Latent factors:** U = user vectors, V = item vectors, Σ = factor importance; predict via $u_i^T\\Sigma v_j$ (Netflix Prize).",
      "**Singular values $\\sigma_i=\\sqrt{\\lambda_i(M^TM)}$;** U eigenvectors of MMᵀ, V of MᵀM.",
      "**Eckart-Young:** top-k singular vectors give the best rank-k approximation — the guarantee behind truncated SVD.",
      "**SVD ≠ PCA:** SVD is a matrix factorisation; PCA is variance-finding that *uses* SVD as its engine.",
      "**Compute PCA via SVD of X, not eig of XᵀX** — forming XᵀX squares the condition number ($\\kappa^2$).",
      "**Condition number $\\kappa=\\sigma_{max}/\\sigma_{min}$;** κ > 1e6 → nearly singular, inverse-based computations unstable.",
    ],
  },
  {
    id: 'pca_theory',
    interactiveId: 'pca_viz',
    title: 'PCA from First Principles',
    subtitle: 'Covariance matrix, explained variance, when PCA fails',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['PCA', 'dimensionality reduction', 'covariance'],
    summary: `You are building a face recognition system. Each image is 100×100 pixels — 10,000 numbers per image. Training a model on raw 10,000-dimensional inputs is slow and prone to overfitting. But most of those dimensions carry redundant information: neighboring pixels are highly correlated, and faces share common structure — eyes roughly here, nose here, mouth here.

The naive fix is to drop some features. But which ones? Dropping pixel 4,512 and keeping pixel 4,513 is arbitrary — both carry similar information. What you want is to find the *directions* where faces actually vary, and represent each face as its coordinates along those directions.

PCA does exactly this. Centre the data (subtract the mean face). Compute the covariance matrix $\Sigma = X^T X / (n-1)$ — a 10,000 × 10,000 matrix encoding how every pixel correlates with every other pixel. Find the eigenvectors of this matrix. The eigenvector with the largest eigenvalue is the direction along which face images vary most. Project every image onto the top $k$ eigenvectors. You have compressed 10,000 dimensions down to $k$ — say 50 — while retaining whatever fraction of variance those 50 directions explain. A scree plot of eigenvalues sorted in descending order shows the "elbow" where additional components stop explaining much variance.

Two things make PCA fail. First, scale: a feature measured in cents has 10,000× the variance of the same feature measured in dollars — converting dollars to cents multiplies every number by 100, and variance scales with the square of that factor (100² = 10,000×). PCA will identify "cents direction" as the first principal component — not because it contains more signal, but because its numbers are larger. Always standardise (z-score) before running PCA unless features share a natural common scale.

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
          `A) PCA solves the linear system Σw = 0 to find directions of zero variance — these are the null space vectors of Σ. Principal components are the directions orthogonal to the null space, i.e., the column space of Σ. The explained variance for component k is tr(Σ) − λₖ, measuring how much variance remains after removing that direction from the total spread, which is always non-negative for PSD Σ.`,
          `B) PCA finds orthonormal directions w₁,...,wₖ in order of maximum variance: w₁ = argmax_{‖w‖=1} wᵀΣw. This is the eigenvector problem Σw=λw — w₁ is the eigenvector of Σ with the largest eigenvalue λ₁; w₂ is the eigenvector with second-largest eigenvalue, subject to w₂⊥w₁. Geometrically, Σ's eigenvectors are the principal axes of the covariance ellipsoid.`,
          `C) PCA computes the gradient ∇_w wᵀΣw = 2Σw and follows it to convergence. This is the power iteration algorithm: starting from random w, repeatedly compute Σw and normalise. The algorithm converges to the largest eigenvector. Subsequent components are found by deflation: subtract the rank-1 contribution of the found component and repeat.`,
          `D) PCA minimises the reconstruction error ‖X − XWWᵀ‖²_F over orthonormal W. Setting the gradient to zero gives ΣW = WΛ where Λ is diagonal. This is equivalent to finding the eigenvectors of Σ but via an optimisation perspective rather than the spectral perspective. The principal components are the columns of W that minimise reconstruction error.`,
        ],
        answer: ['B', 'D'],
      },
      {
        q: `PCA on a dataset with 1000 features gives first two PCs explaining 95% of variance. A colleague uses these 2 PCs as features for a random forest. Which TWO of the following correctly describe what might go wrong?`,
        options: [
          `A) The random forest will be slower than on the original 1000 features because PCA produces dense features (every original feature contributes to each PC), making tree splits computationally expensive to evaluate. Sparse original features allow faster tree construction via efficient split-point search algorithms that skip zero entries.`,
          `B) A forest built on just 2 PCs has far less room to find nonlinear interactions than one with access to all 1000 original features: even if those 2 components capture 95% of variance, every tree can only split on 2 axes, so any decision boundary that genuinely needs a 3rd discriminative direction becomes impossible for the forest to represent.`,
          `C) PCA produces correlated features when only 2 PCs are used, because the first 2 PCs both contain information from the same underlying features. Random forests are sensitive to feature correlation — the variable importance scores become unreliable, and correlated PCs cause the forest to double-count certain directions during split selection.`,
          `D) The 95% variance explained is for reconstruction, not prediction. The remaining 5% may be disproportionately predictive: if the label correlates with a low-variance direction, PCA discards exactly that direction, even though it is critical for the classifier — variance and label-relevance are different axes. Supervised reduction (LDA, PLS) preserves label-correlated dimensions instead.`,
        ],
        answer: ['B', 'D'],
      },
      {
        q: `Why must you subtract the mean before applying PCA? What goes wrong if you do not?`,
        options: [
          `A) PCA finds directions of maximum variance, measured relative to the mean: Var(X)=E[(X−μ)(X−μ)ᵀ]. Without centering, Σ_wrong=E[XXᵀ] is the second moment matrix — its first principal component is dominated by the mean direction, not the true spread. If the mean is large, the first PC is essentially just the mean direction, regardless of the actual variance structure.`,
          `B) Mean subtraction has no effect on the eigenvectors of the covariance matrix — it only shifts the eigenvalues by a constant. Without centering, the eigenvalues of E[XXᵀ] are equal to those of E[(X−μ)(X−μ)ᵀ] plus ‖μ‖², so the PCs are identical but the explained variances are inflated. Centering is optional and is only necessary when you want accurate explained variance percentages.`,
          `C) Without mean subtraction, PCA on E[XXᵀ] finds the correct covariance structure as long as the data is standardised (zero mean forced by normalisation). The mean-subtraction requirement is specific to sklearn's implementation choice; mathematically, you only need E[XXᵀ] to be positive definite, which holds when the data spans all dimensions.`,
          `D) Mean subtraction converts PCA from an unsupervised to a supervised method: centering by the class-conditional mean, as in Fisher's LDA, introduces label information into the computation. Without centering by the global mean, PCA remains purely unsupervised. Subtracting the mean biases the first PC toward the decision boundary between classes rather than toward the true direction of maximum marginal variance in the feature space.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `PCA keeps high-variance directions and discards low-variance ones. Always verify that the discarded variance does not contain the label signal — the information your classifier needs most may live exactly in the directions PCA throws away.`,
    recap: [
      "**PCA finds directions of max variance, not a subset of features** — each PC mixes all original features.",
      "**Recipe:** center data → covariance Σ = XᵀX/(n−1) → eigenvectors → project onto top-k.",
      "**PCs are uncorrelated by construction;** eigenvalue ratio = fraction of variance explained per direction.",
      "**Scale sensitivity is the trap:** switching a feature from dollars to cents inflates its variance 10,000× (numbers ×100, variance ×100²); always z-score first.",
      "**PCA is not feature selection** — you can't say a PC \"is pixel 4,512\", so it loses original-space interpretability.",
      "**95% variance ≠ 95% accuracy:** the label signal may live in the low-variance directions PCA discards.",
      "**If PCA hurts the downstream task, use a supervised reduction (LDA/PLS)** that maximises between-class variance.",
    ],
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

**NOT this.** Calculus in ML is not just gradient descent. Calculus is why certain loss and activation combinations work together and others do not. Using MSE loss with a sigmoid output produces gradient saturation — in the saturated region where σ(z) ≈ 0 or 1, the derivative σ(z)(1-σ(z)) ≈ 0, and the gradient of the MSE loss through this near-zero value nearly vanishes. The network cannot learn from these examples. Cross-entropy with sigmoid was chosen specifically because the saturating term cancels algebraically, leaving a non-saturating gradient. Every loss-activation combination is a calculus decision.

[FIGURE:chain]`,
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
          `B) ∇_x f = 2A(Ax−b). Derive: f(x) = (Ax−b)ᵀ(Ax−b). Let r = Ax−b, so f = rᵀr. ∂f/∂x = 2r·(∂r/∂x) = 2(Ax−b)·A = 2A(Ax−b), treating the Jacobian ∂r/∂x as A itself rather than requiring the transpose Aᵀ. Setting to zero gives AAx = Ab — a distinct linear system from the true normal equations, valid only when A happens to be symmetric and invertible.`,
          `C) f(x) = (Ax−b)ᵀ(Ax−b) = xᵀAᵀAx − 2bᵀAx + bᵀb. Taking the gradient term by term: ∇_x(xᵀAᵀAx) = 2AᵀAx (using ∇_x(xᵀMx) = (M+Mᵀ)x with M=AᵀA symmetric), ∇_x(−2bᵀAx) = −2Aᵀb, ∇_x(bᵀb) = 0. Total: ∇_x f = 2AᵀAx − 2Aᵀb = 2Aᵀ(Ax−b). Setting to zero gives the normal equations AᵀAx = Aᵀb — the update direction is Aᵀ times the residual.`,
          `D) ∇_x f = (Ax−b). Derive: f(x) = ‖r‖² where r = Ax−b. The gradient of ‖r‖² with respect to r is 2r, and by the chain rule ∂r/∂x = I, treating Ax−b as depending directly on x with a unit Jacobian rather than through the linear map A. So ∇_x f = 2(Ax−b) = 2Ax − 2b, skipping the transpose correction that the true chain rule through A actually requires.`,
        ],
        answer: `C`,
      },
      {
        q: `The chain rule for ∂L/∂W at layer l requires the upstream gradient ∂L/∂z_{l+1}. Which two of the following correctly explain why backpropagation computes gradients with a backward pass rather than a forward pass?`,
        options: [
          `A) Gradients propagate backward because the loss is computed at the output layer (forward end), not the input layer. The gradient information must physically travel from where the loss is measured back to where the parameters are. Forward propagation moves data forward; backward propagation moves gradient information the other way, and both directions take exactly the same total compute time regardless of network depth.`,
          `B) Backward propagation is required by the chain rule: ∂L/∂Wₗ = (∂L/∂zₗ)·(∂zₗ/∂Wₗ), and ∂L/∂zₗ can only be computed after ∂L/∂zₙ is known. Forward accumulation would compute ∂zₙ/∂Wₗ, but this requires a separate forward pass per parameter and does not benefit from the scalar loss structure. Backprop processes all layers simultaneously in one backward pass due to dynamic programming — it reuses intermediate activations stored during the forward pass.`,
          `C) The chain rule for f(g(x)): df/dx=(df/dg)(dg/dx). For L=L(z_n(...z_1(x))), ∂L/∂W_l is a product of Jacobians, computable right-to-left or left-to-right. Forward accumulation needs one pass per input dimension; backward accumulation (from ∂L/∂z_n) needs one pass per output. Since L is scalar, backward mode gets every parameter's gradient in one pass — forward mode needs one pass per parameter, often millions.`,
          `D) Gradients flow backward because neurons are connected by directed edges from input to output, and gradient flow must respect edge directionality. In the computational graph, edges point forward (input→output), so gradient information naturally flows in the reverse direction along the same edges — if the network had bidirectional connections, gradients could instead flow both ways simultaneously.`,
        ],
        answer: ['B', 'C'],
      },
      {
        q: `You want to find the minimum of f(x₁,x₂) = (x₁−3)² + 2(x₂+1)². What are ∂f/∂x₁ and ∂f/∂x₂, and what is the minimum?`,
        options: [
          `A) ∂f/∂x₁ = 2(x₁−3). ∂f/∂x₂ = 4(x₂+1). Setting both to zero: x₁=3, x₂=−1. Minimum value f(3,−1) = 0. The Hessian H = [[2,0],[0,4]] is positive definite, confirming a global minimum. Gradient descent must use learning rate < 1/4 (half the inverse of the largest eigenvalue). The x₂ dimension converges faster because it has higher curvature (4 vs. 2), reaching the optimum in fewer steps.`,
          `B) ∂f/∂x₁ = 2(x₁−3). ∂f/∂x₂ = 4(x₂+1). Setting both to zero: x₁=3, x₂=−1. The Hessian H = [[2,0],[0,4]] is positive definite (eigenvalues 2, 4), confirming a strict local minimum that is also global since f is convex. Minimum value f(3,−1) = 0. Gradient descent needs learning rate < 1/4; x₂ (curvature 4) takes smaller effective steps than x₁ (curvature 2) — condition number 2.`,
          `C) ∂f/∂x₁ = (x₁−3). ∂f/∂x₂ = 2(x₂+1). Setting both to zero: x₁=3, x₂=−1. Minimum value f(3,−1) = 0. The Hessian H = [[1,0],[0,2]] — positive definite, having dropped the constant multipliers 2 and 4 from the true second derivatives. The condition number is 2/1 = 2, so gradient descent converges with at most 2× more steps in the x₁ direction than the x₂ direction under this curvature estimate.`,
          `D) ∂f/∂x₁ = 2x₁−6. ∂f/∂x₂ = 4x₂+4. Setting to zero: x₁=3, x₂=−1. Minimum f(3,−1) = 9+2 = 11, since expanding (x₁−3)² = x₁²−6x₁+9 and 2(x₂+1)² = 2x₂²+4x₂+2 gives f(3,−1) = 0+0+9+2 = 11 by summing only the expanded constant terms, ignoring that the linear and quadratic terms in x₁ and x₂ also vanish exactly at this same stationary point.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The choice of loss function and activation is a calculus decision, not an aesthetic one. The clean gradient (ŷ - y)x that makes logistic regression easy to train exists because cross-entropy and sigmoid were chosen together precisely to cancel the saturation term.`,
    figures: {
      chain: `<svg viewBox="0 0 360 92" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">chain rule = multiply derivatives along the graph</text>
  <circle cx="35" cy="42" r="16" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="35" y="46" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">W</text><circle cx="130" cy="42" r="16" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="130" y="46" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">z</text><circle cx="225" cy="42" r="16" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="225" y="46" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">ŷ</text><circle cx="320" cy="42" r="16" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="320" y="46" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">L</text>
  <path d="M53,42 l24,0" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#c1)"/><text x="65" y="34" text-anchor="middle" fill="var(--ink-mid)" font-size="7">∂z/∂W</text>
  <path d="M148,42 l24,0" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#c1)"/><text x="160" y="34" text-anchor="middle" fill="var(--ink-mid)" font-size="7">∂ŷ/∂z</text>
  <path d="M243,42 l24,0" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#c1)"/><text x="255" y="34" text-anchor="middle" fill="var(--ink-mid)" font-size="7">∂L/∂ŷ</text>
  <text x="180" y="82" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">∂L/∂W = (∂L/∂ŷ)(∂ŷ/∂z)(∂z/∂W) — one factor per arrow</text>
  <defs><marker id="c1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
    recap: [
      "**Gradient ∇L = direction of steepest ascent;** gradient descent steps the opposite way.",
      "**Chain rule makes deep nets tractable:** ∂L/∂W = (∂L/∂ŷ)(∂ŷ/∂z)(∂z/∂W) — one derivative per graph edge.",
      "**Sigmoid derivative σ'(z)=σ(z)(1−σ(z))**, peaks at 0.25, → 0 for large |z| (saturation).",
      "**Clean gradients are chosen, not accidental:** cross-entropy + sigmoid gives (ŷ−y)x by cancelling the saturation term.",
      "**MSE + sigmoid saturates** — near σ≈0 or 1 the gradient vanishes and the net stops learning. ReLU's gradient is 1, never saturates.",
      "**Taylor:** GD uses the 1st-order (linear) approximation; Newton uses the Hessian but costs O(n²) memory.",
      "**Vanishing gradient near 0 in a layer → check the activation;** if sigmoid/tanh, inputs are saturated (|z|>4).",
    ],
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

**NOT this.** You do not need matrix calculus if you use autograd — this is false. Autograd computes gradients correctly, but you need matrix calculus to debug shape errors in custom operations, to verify that backpropagation through a novel layer is correct, and to understand why certain operations are expensive to differentiate. Every custom PyTorch layer that implements a backward() method is matrix calculus. If you cannot derive the gradient manually, you cannot verify that your custom backward pass is correct.

[FIGURE:outer]`,
    keyPoints: [
      `**Memorize the identity ∇_w (Aw)^T B(Aw) = 2A^T BA w for symmetric B.** This is the gradient of a quadratic form and appears in every regularized linear model, least-squares problem, and Kalman filter update. Setting it to zero gives the normal equations. Deriving it from scratch each time is error-prone and slow.`,
      `**Trap: layout convention inconsistency.** Numerator layout and denominator layout conventions differ between textbooks — the Matrix Cookbook (Petersen & Pedersen) uses denominator layout; most ML papers use numerator layout. Mixing conventions within a derivation produces a Jacobian that is transposed relative to what you need, giving a gradient update applied in the wrong direction. Pick one convention and never mix.`,
      `**Diagnostic: if your manually implemented backward pass does not match autograd's gradient, try transposing the Jacobian.** Layout convention errors are the most common cause of manual backward pass bugs — the gradient has the right values but the wrong shape. The fix is to check whether you need J or J^T in the chain rule expression, which depends on your chosen layout convention.`,
      `**The trace trick: for a scalar built from tr(·), write its differential, use tr(M^T)=tr(M) and cyclic invariance tr(ABC)=tr(BCA) to collect every term into the form tr(G^T dX), then the gradient is ∂f/∂X = G.** For f(X) = tr(X^T B X): df = tr((dX)^T BX) + tr(X^T B dX) = tr((BX)^T dX) + tr(X^T B dX) = tr((BX + B^T X)^T dX), so ∂f/∂X = (B+B^T)X — the matrix generalization of the vector identity ∂(x^T A x)/∂x = (A+A^T)x above, and the technique checkQuestion 2 below asks you to apply.`,
    ],
    interactivePrompt: `Before you touch the controls: in the normal equations X^T X w = X^T y, why do you think X^T appears on both sides — what is X^T doing geometrically to the residual vector (Xw - y)?`,
    checkQuestions: [
      {
        q: `The Jacobian of a function f: ℝⁿ → ℝᵐ at point x can be written in numerator layout or denominator layout. Which two of the following give a self-consistent, correct description of J under one of these conventions?`,
        options: [
          `A) J is m×n. Element J_{ij} = ∂fᵢ/∂xⱼ — the partial derivative of the i-th output wrt the j-th input. J is the best linear approximation to f near x: f(x+δ) ≈ f(x) + J·δ. For a scalar function (m=1), J reduces to the gradient ∇f, a 1×n row vector. In backpropagation: ∂L/∂x = Jᵀ·(∂L/∂f) — the vector-Jacobian product reverse-mode autodiff computes, which is what loss.backward() returns.`,
          `B) J is n×m. Element J_{ij} = ∂xᵢ/∂fⱼ — how much the j-th output changes the i-th input, measuring the inverse sensitivity, since input-output roles are swapped relative to the standard convention. For a scalar loss (m=1), J is a column vector ∈ ℝⁿ. The backpropagation update uses J directly, without transposing, because the gradient is assumed to flow in the same direction as the Jacobian's column structure.`,
          `C) J is n×m, the transpose of the numerator-layout Jacobian: J_{ij} = ∂fⱼ/∂xᵢ. This is the denominator layout convention — rows are inputs, columns are outputs. For a scalar function (m=1), J is an n×1 column vector identical to ∇f. Under this convention, ∂L/∂x = J·(∂L/∂f) multiplies J directly by the upstream gradient without transposing, since the transpose is already absorbed into J's definition.`,
          `D) J is m×m — a square matrix regardless of input/output dimensions, since it represents covariance between outputs rather than a mapping from inputs. Element J_{ij} = ∂fᵢ/∂fⱼ measures how outputs co-vary. The diagonal elements J_{ii} = 1 always (each output is perfectly correlated with itself). Off-diagonal elements capture how changing one output requires changing another, which determines gradient flow between neurons.`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `Compute ∂/∂W(tr(WᵀAW)) where A is symmetric n×n and W is n×k.`,
        options: [
          `A) ∂/∂W tr(WᵀAW) = AW (not 2AW). This follows from the product rule: d(WᵀAW) = (dW)ᵀAW + WᵀA(dW), so tr(d(WᵀAW)) = tr((dW)ᵀAW) + tr(WᵀA dW) — but treating tr((dW)ᵀAW) as already identical to tr(WᵀA dW) rather than transposing it first (tr((dW)ᵀAW) = tr((AW)ᵀdW) = tr(WᵀAᵀdW)) silently drops one of the two terms as a duplicate, undercounting the gradient by a factor of 2.`,
          `B) ∂/∂W tr(WᵀAW) = WᵀA + AW. Using the identity ∂tr(XᵀBX)/∂X = (B+Bᵀ)X: here X=W, B=A (symmetric), so gradient = 2AW. But the denominator layout convention instead gives Wᵀ·A on the left: (WᵀA)ᵀ = AW, so both layout conventions happen to agree on 2AW in this symmetric case.`,
          `C) Let f(W) = tr(WᵀAW). Then df = tr((dW)ᵀAW) + tr(WᵀA dW). Since tr((dW)ᵀAW) = tr(WᵀAᵀdW) = tr(WᵀAdW) using A=Aᵀ, df = tr(2WᵀA dW) = tr((2AW)ᵀdW), giving ∂f/∂W = 2AW. This appears in PCA: max_W tr(WᵀΣW) s.t. WᵀW=I gives gradient 2ΣW, leading via Lagrange multipliers to the eigenvector equation ΣW=WΛ.`,
          `D) ∂/∂W tr(WᵀAW) = tr(A)·W. The trace of a product tr(WᵀAW) = tr(A)·tr(WᵀW) when A and WᵀW are both symmetric matrices that happen to share the same eigenbasis, so the gradient is tr(A)·∂tr(WᵀW)/∂W = tr(A)·2W, treating the trace of a matrix product as always factoring into the product of the individual traces.`,
        ],
        answer: `C`,
      },
      {
        q: `What is the gradient of the softmax cross-entropy loss with respect to the pre-softmax logits z? Derive the clean form.`,
        options: [
          `A) ∂L/∂z_k = p_k·(1−p_k) for k=y (true class) and −p_k·p_y for k≠y. This follows from the softmax Jacobian: ∂pᵢ/∂zⱼ = pᵢ(δᵢⱼ−pⱼ). Applying chain rule with ∂L/∂pᵢ = −1/p_y·δᵢy gives the above. The gradient is bounded by the product of probabilities, explaining why softmax prevents gradient saturation for the cross-entropy loss, unlike the unbounded gradients that pure MSE would produce through the same softmax layer.`,
          `B) ∂L/∂z = −e_y/p_y where e_y is a one-hot vector. The gradient of cross-entropy L = −log(p_y) with respect to z is: ∂L/∂z_k = ∂/∂z_k(−log p_y) = −(1/p_y)·∂p_y/∂z_k. For k=y: ∂p_y/∂z_y = p_y(1−p_y), so ∂L/∂z_y = −(1−p_y). For k≠y: ∂p_y/∂z_k = −p_y·p_k, so ∂L/∂z_k = p_k. In vector form: ∂L/∂z = p − e_y, which contradicts the −e_y/p_y form stated at the start of this derivation.`,
          `C) ∂L/∂z_k = p_k for all k, including the true class k=y. The softmax cross-entropy gradient simply equals the predicted probability vector p because the derivative of log(softmax(z)) with respect to z is (I − 11ᵀ/n)·p in the numerator layout convention. Setting the gradient to zero means all probabilities must be equal — the uniform distribution 1/n at every coordinate is the unique critical point of this loss surface.`,
          `D) Let p = softmax(z), pᵢ = e^{zᵢ}/Σⱼe^{zⱼ}. Cross-entropy: L = −log(p_y) = −z_y + log(Σⱼe^{zⱼ}). For k=y: ∂L/∂z_y = −1 + p_y = p_y−1. For k≠y: ∂L/∂z_k = p_k. Combined: ∂L/∂z = p − e_y, the probability vector minus the one-hot label. This clean form arises because the cross-entropy's 1/p derivative cancels the softmax's p(1−p) Jacobian term, eliminating saturation.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `The gradient of a scalar loss with respect to any weight matrix is the outer product of the upstream gradient and the input activation. That one pattern covers every fully-connected layer. Layout convention errors are the most common silent bug in custom backpropagation.`,
    figures: {
      outer: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">∂L/∂W = δ · xᵀ  (outer product)</text>
  <text x="30" y="55" fill="var(--prime)" font-size="8" font-weight="700">δ (upstream)</text>
  <rect x="30" y="60" width="16" height="16" fill="var(--prime-faint)" stroke="var(--prime)"/><rect x="30" y="76" width="16" height="16" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="60" y="80" fill="var(--ink-mid)" font-size="10">⊗</text>
  <text x="78" y="55" fill="var(--amber)" font-size="8" font-weight="700">xᵀ (input)</text>
  <rect x="78" y="60" width="16" height="16" fill="var(--amber)" opacity="0.25" stroke="var(--amber)"/><rect x="94" y="60" width="16" height="16" fill="var(--amber)" opacity="0.25" stroke="var(--amber)"/><rect x="110" y="60" width="16" height="16" fill="var(--amber)" opacity="0.25" stroke="var(--amber)"/>
  <text x="140" y="80" fill="var(--ink-mid)" font-size="10">=</text>
  <text x="200" y="30" fill="var(--ink-hi)" font-size="8" font-weight="700">∂L/∂W  (2×3)</text>
  <rect x="200" y="40" width="20" height="20" fill="var(--prime-faint)" stroke="var(--rim)"/><rect x="222" y="40" width="20" height="20" fill="var(--prime-faint)" stroke="var(--rim)"/><rect x="244" y="40" width="20" height="20" fill="var(--prime-faint)" stroke="var(--rim)"/><rect x="200" y="62" width="20" height="20" fill="var(--prime-faint)" stroke="var(--rim)"/><rect x="222" y="62" width="20" height="20" fill="var(--prime-faint)" stroke="var(--rim)"/><rect x="244" y="62" width="20" height="20" fill="var(--prime-faint)" stroke="var(--rim)"/>
  <text x="8" y="94" fill="var(--ink-low)" font-size="7.5">shape of gradient always matches shape of W — the layout check that catches silent bugs</text>
</svg>`,
    },
    recap: [
      "**Normal equations from matrix calculus:** ∇_w‖Xw−y‖² = 2XᵀXw − 2Xᵀy = 0 ⟹ XᵀXw = Xᵀy.",
      "**Key identities:** ∂(xᵀa)/∂x = a; ∂(xᵀAx)/∂x = (A+Aᵀ)x; for symmetric A, 2Ax.",
      "**Jacobian J ∈ ℝ^{m×n}, J_{ij}=∂f_i/∂x_j;** softmax Jacobian = diag(s) − ssᵀ.",
      "**Linear-layer gradient = outer product:** ∂L/∂W = (∂L/∂z)·xᵀ — covers every fully-connected layer.",
      "**Autograd doesn't remove the need** — you need matrix calculus to write and debug any custom backward().",
      "**Layout convention is the silent bug:** numerator vs denominator layout differ; mixing gives a transposed Jacobian.",
      "**Backward-pass mismatch with autograd? Try transposing the Jacobian** — layout errors (right values, wrong shape) are the most common cause.",
    ],
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

What convexity buys: every local minimum is also the global minimum — no need to worry about getting trapped in a worse optimum (note: this does not mean the global minimum is unique; only strict convexity gives that) — gradient descent convergence guaranteed with appropriate step size, and theoretical convergence rates: O(1/t) for gradient descent, O(1/t²) for Nesterov acceleration. If the function is strongly convex (its curvature is bounded below by some m > 0 everywhere, not merely ≥ 0), gradient descent does better still, converging geometrically — the error shrinks by a constant factor each step — rather than the slower O(1/t) that plain convexity alone guarantees. Convexity of the objective and constraints also makes strong duality plausible — the dual problem's optimal value matching the primal's — but that additionally requires a constraint qualification such as Slater's condition; convexity alone does not guarantee it.

Where that dual problem comes from: for a constrained problem min f(x) subject to g(x)=0, form the Lagrangian L(x,λ) = f(x) + λg(x). The constrained optimum satisfies stationarity, ∇ₓL = ∇f(x) + λ∇g(x) = 0, together with primal feasibility, g(x) = 0 — two conditions that pin down both x* and λ* at once. Geometrically this says ∇f is parallel to ∇g at the optimum: if it weren't, you could still move along the constraint surface g=0 and decrease f further. λ* also has a sensitivity interpretation — relax the constraint from g(x)=0 to g(x)=ε and the optimal value of f shifts by approximately −λ*ε, so λ* measures how hard the constraint is binding.

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
        q: `A function f is convex. You find a local minimum. Which two of the following are valid proofs that it is also a global minimum?`,
        options: [
          `A) By contradiction: if x* is a local minimum but not global, there exists y with f(y) < f(x*). For small enough λ ∈ (0,1), z = λy+(1−λ)x* lies arbitrarily close to x*. By convexity: f(z) ≤ λf(y)+(1−λ)f(x*) < f(x*). But z is inside the local minimum ball around x* (for small λ), contradicting x* being a local minimum. Therefore no such y exists: x* is global, since the same argument would apply to any candidate non-global local minimum.`,
          `B) Suppose x* is a local minimum of convex f but not global — there exists y with f(y) < f(x*). Since x* is a local minimum, f(x*) ≤ f(z) for all z in a ball around x*. By convexity, for any λ ∈ (0,1): f(λy+(1−λ)x*) ≤ λf(y)+(1−λ)f(x*) < f(x*). As λ→0 this point lies inside the local-minimum ball — yet its value is strictly less than f(x*), contradicting local minimality. So no such y exists: x* is global.`,
          `C) A local minimum of a convex function is global because convex functions have only one minimum by definition. A function is convex if and only if it has a unique minimiser — the existence of a local minimum proves both that the minimiser exists and that it is unique. The proof follows directly from the strict convexity of the sublevel sets, which forces every level set to be a single connected point at the minimum.`,
          `D) Convexity implies the function has no local minima at all except at the global minimum, because any local minimum immediately satisfies the first-order condition ∇f(x*)=0, and for convex functions ∇f(x*)=0 is both necessary and sufficient for global minimality. Therefore finding any point where the gradient vanishes is equivalent to finding the global minimum, regardless of the function's higher-order behavior.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Gradient descent is given function f(x) = x⁴. The gradient is ∇f = 4x³. Starting from x₀=2.0 with learning rate α=0.1, what is x₁? Does gradient descent converge for this non-strongly-convex function?`,
        options: [
          `A) x₁ = x₀ − α·∇f(x₀) = 2.0 − 0.1·(4·8) = 2.0 − 3.2 = −1.2. Gradient descent converges for f(x)=x⁴, but slowly. f is convex (f''=12x²≥0) but not strongly convex (f''(0)=0). Strongly convex functions converge geometrically; without strong convexity the rate drops to O(1/t). Note x₁=−1.2 overshoots the minimum at x=0 and goes negative — the algorithm still converges, with initial oscillation, provided α is small enough.`,
          `B) x₁ = x₀ − α·∇f(x₀) = 2.0 − 0.1·(4·4) = 2.0 − 1.6 = 0.4. Gradient descent does not converge for f(x)=x⁴ because the function is not strongly convex (the Hessian f''=12x² is zero at x=0). Without strong convexity, gradient descent oscillates around the minimum indefinitely with a fixed learning rate, regardless of how small α is chosen. A decaying learning rate α_t = α/√t is required for any convergence guarantee to hold.`,
          `C) x₁ = 2.0 − 0.1·(2·2³) = 2.0 − 1.6 = 0.4. Gradient descent converges for any convex function with a bounded Hessian, regardless of strong convexity. Since f''(x) = 12x² ≤ 48 for x ∈ [0,2], the smoothness constant L=48 and learning rate 0.1 < 1/L=0.021 is too large — but the step still reduces f from 16 to 0.026, showing rapid convergence despite violating the standard step-size bound.`,
          `D) x₁ = 2.0 − 0.1·(4·2³) = 2.0 − 3.2 = −1.2. Gradient descent diverges for f(x)=x⁴ because x⁴ is not strongly convex. The step overshoots to negative x, then the next gradient 4·(−1.2)³ = −6.9 pushes to x₂ = −1.2 − 0.1·(−6.9) = −0.51, then x₃ diverges further from the origin. Non-strongly-convex functions always cause gradient descent to diverge unless momentum is added to stabilize the trajectory.`,
        ],
        answer: `A`,
      },
      {
        q: `Which two of the following correctly describe how a Lagrange multiplier λ solves the constrained optimisation problem: min f(x) subject to g(x)=0?`,
        options: [
          `A) A Lagrange multiplier λ is introduced to convert the constrained problem into the unconstrained Lagrangian L(x,λ) = f(x) + λ·g(x). At the constrained optimum, the stationarity condition ∇_x L = ∇f(x) + λ∇g(x) = 0 must hold together with primal feasibility g(x) = 0 — together these two equations pin down both x* and λ* simultaneously, without needing manual tuning.`,
          `B) The Lagrange multiplier method converts the constrained problem to unconstrained via: find saddle points of L(x,λ) = f(x) + λ·g(x). Saddle points satisfy ∂L/∂x = 0 and ∂L/∂λ = 0. The second condition ∂L/∂λ = g(x) = 0 automatically enforces the constraint. This method works only when g is linear in x; for nonlinear constraints, KKT conditions with inequality constraints are required instead.`,
          `C) The Lagrange multiplier λ has a sensitivity interpretation: if the constraint is relaxed from g(x)=0 to g(x)=ε, the optimal value of f changes by approximately −λε. Geometrically, at the optimum the gradient of f must be parallel to the gradient of g — otherwise moving along the constraint surface g=0 could still decrease f, contradicting optimality. λ is exactly the scaling factor that makes ∇f cancel −λ∇g at that point.`,
          `D) A Lagrange multiplier replaces the constraint g(x)=0 with a barrier function B(x) = −μ·log(−g(x)), yielding an unconstrained problem min f(x) + B(x) that stays strictly feasible throughout the optimization. As μ→0, the barrier enforces the constraint in the limit. Lagrange multipliers are defined as the limiting values of μ at the optimum and measure the constraint's binding force on the objective.`,
        ],
        answer: ['A', 'C'],
      },
    ],
    takeaway: `Convexity guarantees that every local minimum is global — but it does not guarantee fast convergence. The condition number of the loss landscape determines convergence speed, and a highly convex but ill-conditioned problem can be slower to optimize than a well-conditioned non-convex one.`,
    recap: [
      "**Convex function lies below its chords;** first-order: f(y) ≥ f(x) + ∇f(x)ᵀ(y−x) — tangent is a global lower bound.",
      "**Convexity buys every local min being global (not necessarily unique) and guaranteed GD convergence, with provable rates; strong duality also needs a constraint qualification like Slater's, not convexity alone.**",
      "**Strongly convex → gradient descent converges geometrically; merely convex → only O(1/t).**",
      "**Lagrangian L(x,λ)=f(x)+λg(x): stationarity ∇f+λ∇g=0 plus feasibility g(x)=0 pin the optimum; λ measures sensitivity (Δf*≈−λε).**",
      "**Rates:** O(1/t) for gradient descent, O(1/t²) for Nesterov acceleration.",
      "**SVM / logistic / lasso / ridge are convex; neural nets are not** — but overparam nets rarely hit bad local minima.",
      "**Non-convex isn't hopeless:** most critical points are saddles, and most local minima ≈ global in loss.",
      "**Ill-conditioning, not non-convexity, is the real slowdown:** GD zigzags at rate (κ−1)/(κ+1); standardise features.",
      "**Slow on a convex problem? Compute the Hessian condition number** — κ > 1000 means rescale or use Adam/L-BFGS.",
    ],
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

The question you need to answer: if the button had no effect whatsoever — if both groups were drawn from the same underlying population — how often would random sampling produce a gap of at least 0.2 percentage points just by chance? That probability is the p-value. Work it out for this test: pooled conversion rate ≈3.1%, standard error of the gap ≈0.245 percentage points, so the observed 0.2-point gap is under one standard error from zero — the p-value comes out to about **0.41**. A p-value of 0.41 means: if the null hypothesis were true, you would see a difference this large or larger about 41% of the time by chance alone — nowhere near rare enough to reject the null. This particular gap is comfortably explained by noise, not a real effect.

If p falls below your threshold α (commonly 0.05), you reject the null. Type I error (false positive): you rejected when the null was true — happens with probability α. Type II error (false negative): you failed to reject when there was a real effect. The probability of *detecting* a real effect is power $= 1 - β$. Power is not determined by p-values — it is determined before the experiment by choosing your sample size.

Now suppose your product manager runs 20 A/B tests simultaneously, each at α = 0.05. Under the null, each test has a 5% chance of a false positive. With 20 tests, you expect $20 \\times 0.05 = 1$ false positive. Finding three "significant" results is entirely consistent with all null hypotheses being true. The Bonferroni correction divides α by the number of tests: test each at $α/20 = 0.0025$. The Benjamini-Hochberg procedure controls the false discovery rate — the fraction of significant results that are false — and is less conservative.

**NOT this.** Most people read p < 0.05 as "there is a 95% probability the effect is real." Wrong. The p-value is a property of the *data* under the null hypothesis, not a probability about the hypothesis. It says nothing about P(null is true). To compute that, you need a prior — Bayesian territory. A p-value of 0.001 on a 10-million-user-per-arm dataset can come from a conversion lift as small as ≈0.025 percentage points — about a 1% relative lift on a 3% baseline — small enough that many teams would consider it commercially marginal. Statistical significance is not practical significance. Always pair p-values with effect sizes and confidence intervals.`,
    interactivePrompt: `Before you touch the controls: if you run 20 A/B tests and 1 comes back significant at p = 0.05, how confident are you that the winning variant actually works — very confident, moderately confident, or do you think there is a good chance it is a false positive?`,
    keyPoints: [
      `**Use hypothesis testing when you need to decide whether an observed difference exceeds what chance alone can explain.** Pre-commit to your α and the minimum detectable effect size before collecting data. The sample size formula $n = 2(z_{α/2} + z_β)^2 σ^2 / δ^2$ requires specifying $δ$ (the smallest effect you care about) and $β$ (acceptable miss rate) before a single observation. Post-hoc power calculations — done after seeing the results — are not valid.`,
      `**The production trap: peeking.** Checking p-values as data accumulates and stopping when p < 0.05 inflates Type I error far above α. If you check after every 100 users, the effective false positive rate can reach 20–30% even at a nominal α = 0.05. Use sequential testing methods (always-valid p-values or alpha-spending functions) if you need continuous monitoring, or commit to a fixed sample size and look once.`,
      `**The diagnostic: separate statistical significance from practical significance.** With n = 10,000,000 per arm, a lift of only ≈0.025 percentage points (about 1% relative, on a 3% baseline) achieves p < 0.001 — statistically significant, but easy to overstate as a business win. Report Cohen's d, percent lift, or absolute conversion change alongside every p-value. If the effect size is smaller than the minimum you pre-specified as meaningful, the result does not justify a ship decision regardless of the p-value.`,
    ],
    checkQuestions: [
      {
        q: `You run a t-test comparing two groups and get p=0.048. Your colleague says 'we have 95.2% confidence that the effect is real.' Which two of the following identify genuine, correct problems with this statement?`,
        options: [
          `A) The statement is almost correct but uses the wrong confidence level. p=0.048 means 1−p = 95.2% is the confidence that the effect is real. The technically precise statement would be '95% confidence' (using the standard threshold), not '95.2% confidence' — the colleague is incorrectly using the exact complement of the p-value rather than rounding to the nearest standard confidence level.`,
          `B) The colleague's statement is correct for a one-sided test but wrong for the two-sided t-test that was run, since two-sided tests split the rejection region across both tails. For a two-sided test, p=0.048 means 97.6% confidence on each side, giving 95.2% total under this (mistaken) framing. The colleague should have instead said '97.6% confidence that the effect is in the observed direction,' though even that framing is not statistically rigorous.`,
          `C) Separately, the word 'confidence' here borrows language from confidence intervals and misapplies it to a p-value: a 95% confidence interval's 'confidence' describes the long-run coverage rate of the interval-construction procedure across repeated samples, not a probability statement about this one result. Computing '95.2%' as 1−p and calling it 'confidence' conflates two distinct statistical objects — a p-value and a confidence level — that happen to share a number here but not a meaning. A cleaner statement would simply be 'we reject the null at α=0.05,' with no confidence language attached at all.`,
          `D) The p-value is NOT the probability that the null is false, nor 1−P(null is true). p=0.048 means: IF the null were true, there is a 4.8% chance of a test statistic this extreme or more, purely by chance. It says nothing about P(H₀ is false) — that needs a prior (Bayesian framework). Interpretation: 'if truly no effect, data this extreme occurs ~4.8% of the time' — confusing frequentist and Bayesian probability is the real error here.`,
        ],
        answer: ['C', 'D'],
      },
      {
        q: `A clinical trial detects p=0.001 with a treatment effect of 0.2 points on a 100-point quality-of-life scale. N=50,000. Is this finding clinically meaningful? Explain statistical vs practical significance.`,
        options: [
          `A) Statistical significance (p=0.001) and clinical significance are different. With N=50,000 the standard error is tiny, so even trivial effects produce very small p-values. A 0.2-point improvement on a 100-point scale is 0.2% — far below any clinical threshold (typically 5-10 points). The p-value answers 'is the effect nonzero?' — yes. Clinical significance asks 'is it large enough to matter?' — no. Report effect size and confidence intervals alongside every p-value, not the p-value alone.`,
          `B) Yes, p=0.001 is clinically meaningful because it passes the stringent 0.001 threshold, far below the typical 0.05 cutoff used in most fields. A result significant at p=0.001 survived a much higher evidentiary bar than p=0.05, providing roughly three times more statistical evidence of a real, nonzero effect. The 0.2-point effect size should still be reported but does not undermine the significance.`,
          `C) The finding has borderline clinical significance. A 0.2-point improvement is small but not negligible — over N=50,000 patients, the aggregate benefit across the whole population is 0.2 × 50,000 = 10,000 patient-points of improvement, which sounds substantial. Population-level impact metrics like this one should supplement individual per-patient effect sizes when evaluating clinical trials of this scale.`,
          `D) The finding is not statistically significant. p=0.001 means there is only a 0.1% chance the result is real — not strong enough for clinical applications, which require p < 0.0001 to account for multiple comparison corrections across the many endpoints typically measured in a single trial. The 0.2-point effect size is itself consistent with a trial that is slightly underpowered for this scale.`,
        ],
        answer: `A`,
      },
      {
        q: `You run 20 A/B tests simultaneously. 3 tests show p < 0.05. How many would you expect by chance, and what correction do you apply?`,
        options: [
          `A) Under the null (all 20 effects zero), each test has P(p<0.05)=0.05, so expected false positives = 20×0.05=1 — finding 3 'significant' tests is plausible even if all nulls are true. Bonferroni: threshold α/m=0.05/20=0.0025 per test (conservative FWER control). Benjamini-Hochberg: ranks p-values, rejects H_k if p_k≤k·α/m — controls the expected false-positive proportion, the standard choice in A/B testing.`,
          `B) Expected false positives = 20 × 0.05 = 1 under the null. Finding 3 significant tests suggests all 3 are likely real — the expected count under the null is 1, and the Poisson probability of observing 3 or more by chance when λ=1 is P(X≥3) ≈ 0.08, small enough to conclude at least some tests are detecting genuinely real effects. No multiple-comparisons correction is needed when fewer than 5% of the tests come back significant.`,
          `C) Expected false positives = 20 × 0.05² = 0.05. Under the null, the probability of any false positive across all 20 tests is 1−(1−0.05)²⁰ ≈ 0.64, meaning there is a 64% chance at least one false positive occurs somewhere in the batch. Finding 3 significant results is far more than the 0.05 expected, suggesting all 3 are likely true positives. Bonferroni is only needed once more than 10% of tests are significant.`,
          `D) Expected false positives = 3 × 0.05 = 0.15 — only the 3 significant tests contribute to the false-positive expectation, since the other 17 non-significant tests cannot themselves produce false positives. Bonferroni correction divides the significance threshold by the number of significant tests: 0.05/3 ≈ 0.017. All 3 tests show p < 0.05 but not p < 0.017, so after applying this correction none remain significant.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `A p-value measures how often chance produces this result, not how probable the hypothesis is. Effect size tells you whether the result matters. You need both before making a decision.`,
    recap: [
      "**p-value = P(data this extreme | null true)**, a property of the data — NOT P(hypothesis is true).",
      "**Type I (α) = false positive when null true; Type II (β) = miss.** Power = 1−β, fixed by sample size beforehand.",
      "**Multiple comparisons:** 20 tests at α=0.05 → expect 1 false positive; finding 3 \"significant\" is consistent with all nulls.",
      "**Corrections:** Bonferroni tests each at α/m (conservative, FWER); Benjamini-Hochberg controls FDR (less conservative).",
      "**Statistical ≠ practical significance:** at n=10M/arm, a ≈0.025-point (≈1% relative) lift is p<0.001 but easy to overstate as a business win.",
      "**Peeking inflates Type I error to 20–30%** — use sequential/always-valid methods or fix n and look once.",
      "**Always pair the p-value with effect size (Cohen's d, % lift) and a confidence interval** before deciding.",
    ],
  },
  {
    id: 'mle_map',
    interactiveId: 'mle_map_viz',
    title: 'MLE vs MAP Estimation',
    subtitle: 'Likelihood, log-likelihood, MAP as regularised MLE',
    difficulty: 'intermediate',
    estimatedMin: 26,
    tags: ['MLE', 'MAP', 'regularisation', 'Bayesian'],
    summary: `You flip a coin 10 times and get 7 heads. What is your best estimate for the probability of heads? The most obvious approach: count. $\\hat{p} = 7/10 = 0.7$. This is maximum likelihood estimation — find the parameter $θ$ that makes the observed data most probable. Formally: $\\hat{θ}_{MLE} = \\arg\max_θ P(data|θ) = \\arg\max_θ θ^7(1-θ)^3$. Take the log, differentiate, set to zero: $\\hat{θ}_{MLE} = 0.7$.

Now flip the same coin only 3 times and get 3 heads. MLE gives $\\hat{p} = 3/3 = 1.0$ — the coin always lands heads. Obviously wrong. MLE with tiny data is overconfident. The problem is that MLE has no memory of what coins are usually like. It treats every dataset as if the parameters could be anything.

MAP (Maximum A Posteriori) fixes this by adding a prior. Put a $\\text{Beta}(2, 2)$ prior over $θ$ — this encodes "probably close to 0.5, but I am not certain." The posterior is $P(θ | data) \\propto P(data|θ) \\cdot P(θ)$. MAP finds the mode of this posterior. With 3 heads out of 3 flips, MAP gives $\\hat{θ}_{MAP} \\approx 0.8$ rather than 1.0. The prior pulled the estimate toward sanity.

The prior is not just a Bayesian abstraction. Adding $\\log P(θ)$ to the log-likelihood is identical to adding a regularisation term to your loss function. A Gaussian prior $θ \sim N(0, τ^2 I)$, combined with a Gaussian-noise likelihood of variance $σ^2$, produces L2 regularisation (Ridge) with $λ = σ^2/τ^2$. A Laplace prior produces L1 regularisation (Lasso). Every time you tuned a regularisation coefficient, you were implicitly choosing a prior distribution over weights.

**NOT this.** Most people think "MLE is just fitting the data." MLE assumes a specific probabilistic model — a particular likelihood function — and finds the parameters that make the observed data most probable under that model. If your model is wrong (fitting a Gaussian to bimodal data), MLE finds the "best" wrong answer with complete confidence. The model is always right in MLE\`s eyes; MLE has no mechanism to doubt the model family. MAP at least has a prior that can pull estimates back from absurdity when data is scarce.

As $n → ∞$, the likelihood dominates and MAP converges to MLE — the data eventually overwhelms any reasonable prior. This means regularisation should shrink as your dataset grows.

[FIGURE:map]`,
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
          `A) MLE: maximise log-likelihood ℓ(μ) = −n/2·log(2πσ²) − (1/2σ²)Σ(xᵢ−μ)². Setting ∂ℓ/∂μ = 0 gives Σ(xᵢ−μ) = 0, so μ_MLE = Σxᵢ — forgetting to divide by n, leaving the raw sum instead of the sample mean. Because the sum grows with n while the true optimum does not, this "estimate" diverges as more data is collected, the opposite of what a consistent estimator should do.`,
          `B) Maximise L(μ) = Π (1/√(2πσ²))exp(−(xᵢ−μ)²/(2σ²)). Taking log: ℓ(μ) = const − (1/2σ²)Σ(xᵢ−μ)². Setting ∂ℓ/∂μ = 0: −(1/2σ²)·(−2)Σ(xᵢ−μ) = 0, so Σxᵢ − nμ = 0, giving μ_MLE = (1/n)Σxᵢ = x̄. But this is a biased estimator: E[μ_MLE] = μ−σ²/n due to Jensen's inequality applied to the log. The unbiased estimator requires a Bessel correction: μ_unbiased = x̄·n/(n−1).`,
          `C) L(μ) = Π (1/√(2πσ²))exp(−(xᵢ−μ)²/(2σ²)). Log-likelihood: ℓ(μ) = −n/2·log(2πσ²) − (1/2σ²)Σ(xᵢ−μ)². Maximise: ∂ℓ/∂μ = (1/σ²)Σ(xᵢ−μ) = 0, giving μ_MLE = (1/n)Σxᵢ = x̄ — the sample mean. Maximising log-likelihood here is equivalent to minimising Σ(xᵢ−μ)², so MLE = least squares = sample mean, which is why MSE is the natural loss under a Gaussian noise assumption.`,
          `D) MLE for Gaussian mean requires maximising L(μ) = Π exp(−(xᵢ−μ)²/(2σ²)). The log-likelihood is ℓ(μ) = −Σ(xᵢ−μ)²/(2σ²), a concave quadratic in μ. Setting ∂ℓ/∂μ = Σ(xᵢ−μ)/σ² = 0 gives μ_MLE = median({xᵢ}), since the sum of absolute deviations from the median is minimised, not the sum of squared deviations. The sample mean would instead be the MLE under a Laplace (L1) likelihood, not a Gaussian one.`,
        ],
        answer: `C`,
      },
      {
        q: `MLE for a Bernoulli distribution gives P̂(X=1) = (number of 1s)/(total samples). Now add a Beta(α,β) prior. Which two of the following are correct?`,
        options: [
          `A) Likelihood: L(p) = Π pˣⁱ(1−p)^{1−xᵢ} = p^s(1−p)^{n−s} where s=Σxᵢ. Prior: Beta(α,β): π(p) ∝ p^{α−1}(1−p)^{β−1}. Posterior ∝ p^{s+α−1}(1−p)^{n−s+β−1} ~ Beta(s+α, n−s+β). MAP maximises the log-posterior (s+α−1)log p + (n−s+β−1)log(1−p): p_MAP = (s+α−1)/(n+α+β−2). The Beta prior adds α−1 pseudo-observations of class 1 and β−1 of class 0; for α=β=1 this reduces to MLE=s/n.`,
          `B) The Beta posterior has mean (s+α)/(n+α+β), so MAP = mean = (s+α)/(n+α+β). The MAP of a Beta distribution equals its mean because Beta is symmetric around its mean in every case. For α=β=1 (uniform prior), MAP = s/n = MLE. The denominator n+α+β adds α+β pseudo-observations rather than α+β−2, because the normalising constant of the Beta prior itself contributes exactly 1 pseudo-observation per parameter.`,
          `C) The Beta(α,β) posterior is Beta(s+α, n−s+β). The MAP is the mode: (s+α−1)/(n+α+β−2). This equals MLE plus a Bayesian correction term: s/n + (α−β)/(n(n+α+β−2)). For large n, the correction term vanishes entirely and MAP converges to the raw count s/n. For α=β, MAP equals MLE exactly at every n — a perfectly symmetric prior never biases the estimate away from the raw count.`,
          `D) The Beta(α,β) posterior also has mean (s+α)/(n+α+β), distinct from the MAP mode (s+α−1)/(n+α+β−2); the two coincide only in special cases such as when the posterior itself is symmetric (s+α = n−s+β) or in the n→∞ limit. Reporting the posterior mean instead of the mode gives a different but equally valid Bayesian point estimate — choosing between MAP and posterior mean is a modeling decision, not something MAP itself requires.`,
        ],
        answer: ['A', 'D'],
      },
      {
        q: `A linear regression model's MSE loss is equivalent to maximum likelihood under what distributional assumption? What assumption does L1 loss correspond to?`,
        options: [
          `A) MSE corresponds to a Uniform likelihood: P(yᵢ|xᵢ,θ) = Uniform(ŷᵢ−ε, ŷᵢ+ε) for some fixed ε. Minimising MSE finds the θ that keeps all residuals within ±ε, treating every in-range residual as equally likely. L1 loss corresponds instead to a Gaussian likelihood with heavier tails — specifically, a Student-t distribution with 1 degree of freedom, i.e. a Cauchy distribution.`,
          `B) MSE loss Σ(yᵢ−ŷᵢ)² ∝ −log L(θ) under a Gaussian likelihood P(yᵢ|xᵢ,θ) = N(ŷᵢ,σ²) — minimising MSE = maximising Gaussian log-likelihood. L1 loss Σ|yᵢ−ŷᵢ| corresponds to a Laplace likelihood P(yᵢ|xᵢ,θ) = (1/2b)exp(−|yᵢ−ŷᵢ|/b). Laplace has heavier tails, so L1 penalises outliers less than L2. L1 gives median regression; L2 gives mean regression.`,
          `C) MSE corresponds to Gaussian noise with variance proportional to ŷᵢ (heteroskedastic): P(yᵢ|xᵢ,θ) = N(ŷᵢ, |ŷᵢ|·σ²). This is why MSE is claimed to be unstable for regression near zero — the likelihood is undefined when ŷᵢ=0. L1 loss instead corresponds to constant-variance Gaussian noise P(yᵢ|xᵢ,θ) = N(ŷᵢ, σ²), supposedly more robust since it does not assume variance scaling with the prediction.`,
          `D) MSE corresponds to Gaussian noise P(yᵢ|xᵢ,θ) = N(ŷᵢ, σ²) only when the noise is additive and independent across all samples. L1 loss corresponds instead to a Poisson likelihood: P(yᵢ|xᵢ,θ) = exp(−ŷᵢ)ŷᵢ^{yᵢ}/yᵢ!, appropriate for count data. L1 is claimed to be more robust than MSE because Poisson has lighter tails than Gaussian, assigning less probability mass to large residuals.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Every regularised model is a MAP estimate. Choosing L2 or L1 is not a numerical trick — it is a statement about what you believe the solution looks like before seeing any data.`,
    figures: {
      map: `<svg viewBox="0 0 360 104" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">MAP = prior × likelihood → shrinks the estimate</text>
  <line x1="20" y1="82" x2="340" y2="82" stroke="var(--rim)"/>
  <path d="M20,80 C120,80 130,30 180,30 C230,30 240,80 340,80" fill="none" stroke="var(--rim)" stroke-width="1.2"/>
  <text x="150" y="26" fill="var(--ink-mid)" font-size="7">prior (peak 0.5)</text>
  <path d="M20,82 C200,82 250,20 300,20 C320,20 330,60 340,72" fill="none" stroke="var(--amber)" stroke-width="1.4"/>
  <text x="300" y="16" text-anchor="middle" fill="var(--amber)" font-size="7">likelihood (MLE 0.7)</text>
  <path d="M20,82 C160,82 200,34 245,34 C285,34 300,74 340,80" fill="none" stroke="var(--prime)" stroke-width="1.8"/>
  <text x="245" y="30" text-anchor="middle" fill="var(--prime)" font-size="7" font-weight="700">posterior (MAP 0.67)</text>
  <line x1="300" y1="20" x2="300" y2="82" stroke="var(--amber)" stroke-dasharray="2 2"/><line x1="245" y1="34" x2="245" y2="82" stroke="var(--prime)" stroke-dasharray="2 2"/>
  <text x="10" y="100" fill="var(--ink-low)" font-size="7.5">10 flips, 7 heads: prior pulls MLE 0.7 toward 0.5 → MAP 0.67 — exactly L2 regularisation.</text>
</svg>`,
    },
    recap: [
      "**MLE = params that make observed data most likely:** $\\hat{\\theta}_{MLE}=\\arg\\max_\\theta P(data|\\theta)$; coin 7/10 → 0.7.",
      "**MLE is overconfident on tiny data:** 3/3 heads → $\\hat{p}=1.0$, obviously wrong — it has no memory of priors.",
      "**MAP adds a prior:** posterior ∝ likelihood × prior; Beta(2,2) pulls 3/3 heads to ≈ 0.8, not 1.0.",
      "**Adding $\\log P(\\theta)$ = adding regularisation:** Gaussian prior → L2/Ridge (λ=σ²/τ²); Laplace prior → L1/Lasso.",
      "**Every regularised model is a MAP estimate** — the reg coefficient is an implicit prior over weights.",
      "**As n→∞ MAP → MLE:** data overwhelms the prior, so regularisation should shrink as the dataset grows.",
      "**Reg strength rising with more data is a red flag** — usually a model-family mismatch, not real sparsity.",
    ],
  },
  {
    id: 'bayesian_inference_mathstats',
    interactiveId: 'bayesian_updating_viz',
    interactivePrompt: 'Bayesian inference = prior updated by data into a posterior. Press play to fold in observations one at a time and watch the posterior tighten toward the evidence.',
    title: 'Bayesian Inference',
    subtitle: 'Prior, likelihood, posterior, conjugate priors, MCMC',
    difficulty: 'advanced',
    estimatedMin: 34,
    tags: ['Bayesian', 'posterior', 'MCMC', 'conjugate priors'],
    summary: `MLE and MAP give you a single best-guess set of parameters. But a single point estimate throws away everything you know about parameter uncertainty — and uncertainty is precisely what matters when data is scarce, when you need calibrated predictions, or when you are making sequential decisions. Bayesian inference maintains a full probability distribution over parameters: the posterior P(θ|data) ∝ P(data|θ)P(θ). This distribution captures what you know and what you do not know. The problem is the denominator: P(data) = ∫ P(data|θ)P(θ)dθ. This integral marginalises over all possible parameters — and in high dimensions it is almost never tractable. Conjugate priors are special cases where the posterior is in the same family as the prior, giving closed-form updates without any integration. When conjugacy fails, you have two options: MCMC samples from the posterior without computing the denominator by exploiting the fact that acceptance ratios cancel it out; variational inference approximates the posterior with a tractable family by minimising KL divergence. Both approaches trade exactness for tractability in different ways.

[FIGURE:posterior]`,
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
          `A) The product of N(θ;2,1) and N(θ;4,1) gives N(θ; 3, 2) — averaging the means and summing the variances. Multiplying two Gaussians is treated like adding independent noise sources: variances add, σ*² = σ₁²+σ₂² = 1+1 = 2, and the mean is the arithmetic average, μ* = (μ₁+μ₂)/2 = (2+4)/2 = 3. The posterior is N(θ; 3, 2), with the pooled variance reflecting both sources of uncertainty.`,
          `B) The product is N(θ; 6, 0.5) — means multiply and variances halve. When combining two evidence sources, the posterior has mean μ₁·μ₂/(μ₁+μ₂) and variance σ₁²σ₂²/(σ₁²+σ₂²) = (1·1)/(1+1) = 0.5. Because the likelihood and prior both push the estimate toward larger values, the posterior mean 6 reflects the combined, reinforcing evidence rather than an average of the two means.`,
          `C) The product of two Gaussians N(μ₁,σ₁²) and N(μ₂,σ₂²) is N(μ*, σ*²) where σ*² = σ₁²+σ₂² = 2 and μ* = μ₁+μ₂ = 6. The posterior is N(θ; 6, 2). Multiplying probability densities is like multiplying their sufficient statistics directly: means add and variances add, mirroring how natural parameters of the Gaussian exponential family combine under a product of densities.`,
          `D) Multiplying two Gaussians: P(θ|data) ∝ N(θ;2,1)·N(θ;4,1) ∝ exp(−[(θ−2)²+(θ−4)²]/2) = exp(−(θ−3)²/1) = N(θ; 3, 1/2). In general, N(μ₁,σ₁²)·N(μ₂,σ₂²) ∝ N(μ*, σ*²) where 1/σ*² = 1/σ₁²+1/σ₂² and μ* = σ*²(μ₁/σ₁²+μ₂/σ₂²). The posterior mean is a precision-weighted average, and it is precision (1/variance) that sums across Gaussians, not variance itself.`,
        ],
        answer: `D`,
      },
      {
        q: `Which two of the following statements about approximate Bayesian inference methods are correct?`,
        options: [
          `A) MCMC constructs a Markov chain whose stationary distribution equals the posterior P(θ|data); the Metropolis-Hastings acceptance ratio min(1, P(θ'|data)/P(θ|data)) cancels the intractable normalising constant P(data), so the chain converges to the true posterior without ever computing that integral directly.`,
          `B) Variational inference approximates the posterior with a tractable family q_φ(θ) by minimising the reverse KL divergence D_KL(q‖P(θ|data)), which is equivalent to maximising the ELBO; this scales to large models like VAEs but is biased and tends to collapse onto a single mode of a multimodal posterior.`,
          `C) Both MCMC and variational inference require first computing the normalising constant P(data) = ∫P(data|θ)P(θ)dθ exactly before any sample can be drawn or any bound optimised — this shared prerequisite is exactly why both methods scale poorly past a few hundred parameters.`,
          `D) Exact inference is intractable only when using non-conjugate priors — with any conjugate prior (Beta-Binomial, Normal-Normal, Gamma-Poisson), neither MCMC nor variational inference is ever necessary, because the posterior is always available in closed form regardless of model size.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `What is a conjugate prior? Give one example and explain why conjugacy is computationally useful.`,
        options: [
          `A) A conjugate prior is a distribution from the same exponential family as the likelihood. Formally: if likelihood P(data|θ) is in the exponential family and prior P(θ) has the same base measure, the posterior is in the same exponential family. Example: Gaussian prior + Gaussian likelihood → Gaussian posterior. Computational usefulness: (1) Closed-form posterior via natural parameter updates. (2) Sequential updating: each observation updates the natural parameter vector additively. (3) The marginal likelihood is always the ratio of normalising constants — computable analytically, avoiding any numerical integration step.`,
          `B) A conjugate prior is a distribution where the posterior has the same functional form as the prior: if prior P(θ) is in family F and posterior P(θ|data) ∝ P(data|θ)P(θ) is also in F, then F is conjugate to that likelihood. Example: Beta prior + Bernoulli likelihood → Beta posterior; Beta(α,β) updated with s successes in n trials gives Beta(s+α, n−s+β) — still a Beta distribution. Computational usefulness: (1) closed-form posterior, no numerical integration; (2) sequential updating — each observation just increments α or β; (3) analytic mean α/(α+β) and mode, no sampling or variational inference required.`,
          `C) A conjugate prior is a prior that is invariant under the likelihood — P(θ|data) = P(θ) when data provides no information. The term 'conjugate' refers to the dual relationship between the prior and likelihood: the prior is conjugate if multiplying by the likelihood leaves the distribution in the same family. Example: any distribution is conjugate to a uniform likelihood — since the posterior equals the prior when the likelihood is flat. True conjugacy, where the posterior gets genuinely updated hyperparameters, occurs only for the Gaussian-Gaussian pair among common families.`,
          `D) A conjugate prior requires the posterior to be a scaled version of the prior — P(θ|data) = c·P(θ) for some normalising constant c that depends only on data. This means conjugate priors are always proper (integrable) distributions because c is finite for any dataset. Example: Gamma prior + Poisson likelihood → Gamma posterior with updated rate and shape parameters. Computational usefulness: the update rule is c = P(data), the marginal likelihood, which provides a free estimate of model evidence at no extra computational cost.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Bayesian inference gives you a distribution over parameters, not a point. That distribution is the right answer when calibrated uncertainty matters — for small data, sequential updating, or uncertainty-aware decisions. The cost is that the posterior is almost never tractable in closed form, which is the entire reason MCMC and variational inference exist.`,
    figures: {
      posterior: `<svg viewBox="0 0 360 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="90" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">MLE / MAP: a point</text>
  <text x="270" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Bayes: a distribution</text>
  <line x1="20" y1="78" x2="160" y2="78" stroke="var(--rim)"/>
  <line x1="90" y1="78" x2="90" y2="30" stroke="var(--prime)" stroke-width="2.5"/><circle cx="90" cy="30" r="3" fill="var(--prime)"/>
  <text x="90" y="94" text-anchor="middle" fill="var(--ink-low)" font-size="7">θ̂ only — no spread</text>
  <line x1="200" y1="78" x2="340" y2="78" stroke="var(--rim)"/>
  <path d="M200,78 C250,78 255,30 270,30 C285,30 290,78 340,78" fill="var(--prime-faint)" stroke="var(--prime)" stroke-width="1.6"/>
  <line x1="240" y1="78" x2="240" y2="58" stroke="var(--amber)" stroke-dasharray="2 2"/><line x1="300" y1="78" x2="300" y2="58" stroke="var(--amber)" stroke-dasharray="2 2"/>
  <text x="270" y="94" text-anchor="middle" fill="var(--ink-low)" font-size="7">P(θ|data) — credible interval</text>
  <text x="180" y="26" text-anchor="middle" fill="var(--ink-mid)" font-size="7">P(data)=∫P(data|θ)P(θ)dθ intractable → MCMC / VI</text>
</svg>`,
    },
    recap: [
      "**Posterior ∝ likelihood × prior;** it's a full distribution over params, not a point — captures uncertainty.",
      "**The denominator P(data)=∫P(data|θ)P(θ)dθ is the intractable part** — this is why MCMC and VI exist.",
      "**Conjugate priors give closed-form updates:** Beta(α,β)+k/n → Beta(α+k, β+n−k); α,β act as pseudo-counts.",
      "**MCMC (Metropolis-Hastings) samples the posterior** — the acceptance ratio cancels the intractable P(data).",
      "**MCMC diagnostics:** R-hat ≈ 1, large ESS, trace plots like fuzzy caterpillars.",
      "**Variational inference approximates the posterior by minimising KL(q‖P)** = maximising the ELBO — fast but mode-seeking.",
      "**Posterior predictive $P(x_{new}|X)=\\int P(x_{new}|\\theta)P(\\theta|X)d\\theta$** averages over the posterior — wider, honest uncertainty.",
    ],
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

**NOT this.** EM is not an algorithm for mixture models. EM is a general framework for maximum likelihood estimation when data has missing or latent variables. The pattern is always: treat the missing data as if it were observed but uncertain (E-step fills in the expected complete data), then maximize the resulting expected complete-data log-likelihood (M-step). K-means, Baum-Welch for HMMs, and probabilistic PCA are all instances of this pattern.

[FIGURE:em]`,
    keyPoints: [
      `**Use EM whenever you have latent variables and the complete-data log-likelihood has a closed-form maximizer.** This is the pattern in GMMs, HMMs, probabilistic PCA, and factor models. When the M-step does not have a closed-form solution, replace it with gradient ascent on the expected complete-data log-likelihood — this is called Generalized EM and still monotonically increases the marginal likelihood.`,
      `**Trap: EM converges to local optima.** Run EM with multiple random initializations — typically 5 to 10 — and take the solution with the highest final log-likelihood. K-means++ initialization (choosing initial centroids with probability proportional to their squared distance from already-chosen centroids) gives better starting points and reduces the number of restarts needed for reliable convergence.`,
      `**Diagnostic: plot log-likelihood per iteration.** It should monotonically increase. If it ever decreases, there is a bug in the M-step — the expected complete-data log-likelihood is not being maximized correctly. A non-monotone EM log-likelihood is not a convergence issue, it is a correctness issue. The monotonicity guarantee is a theorem, not an approximation.`,
    ],
    interactivePrompt: `Before you touch the controls: if you have unlabeled data and want to fit a mixture model, what would happen if you started with random cluster assignments and just computed cluster statistics — why would that naive approach fail, and what does EM do differently?`,
    checkQuestions: [
      {
        q: `Which two of the following statements correctly describe the E-step and M-step of EM for Gaussian Mixture Models (GMMs)?`,
        options: [
          `A) The E-step computes the responsibility of each point xᵢ to cluster k as r_{ik} = P(z=k|xᵢ,θ) = πₖN(xᵢ;μₖ,Σₖ)/ΣⱼπⱼN(xᵢ;μⱼ,Σⱼ) — a soft posterior probability, so each point is 'partly' in every cluster rather than hard-assigned to just one.`,
          `B) Given the responsibilities r_{ik}, the M-step updates each cluster in closed form as a responsibility-weighted statistic: πₖ = Σᵢr_{ik}/n, μₖ = Σᵢr_{ik}xᵢ/Σᵢr_{ik}, and Σₖ = Σᵢr_{ik}(xᵢ−μₖ)(xᵢ−μₖ)ᵀ/Σᵢr_{ik} — no gradient step is taken.`,
          `C) The E-step assigns each point to its single nearest centroid by Euclidean distance and the M-step recomputes each mean as the unweighted centroid of its assigned points — EM for GMMs is mathematically identical to k-means for any covariance structure.`,
          `D) The E-step directly maximises the marginal log-likelihood by computing exact analytic gradients with respect to μₖ, Σₖ, and πₖ, which makes EM just a special case of gradient ascent that happens to use a closed-form, optimally-chosen step size.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `EM guarantees that the log-likelihood is non-decreasing at each step. Prove this using Jensen's inequality.`,
        options: [
          `A) The log-likelihood is non-decreasing because the M-step maximises the complete-data log-likelihood so that Q(θ,θ_old) ≥ Q(θ_old,θ_old), and by the data processing inequality, maximising Q can never decrease the marginal log-likelihood log P(X|θ) at the next step. Jensen's inequality separately ensures that log E[P(X,Z|θ)] ≥ E[log P(X,Z|θ)], which bounds the improvement from below at every iteration.`,
          `B) The M-step finds θ_new = argmax_θ Q(θ,θ_old), so Q(θ_new,θ_old) ≥ Q(θ_old,θ_old). Since log P(X|θ) = Q(θ,θ_old) + H(θ,θ_old) where H is always constant and independent of θ by definition of the E-step, it follows directly that log P(X|θ_new) ≥ log P(X|θ_old). The proof does not use Jensen's inequality at all — it only requires the M-step to locate a non-decreasing point of Q.`,
          `C) The non-decreasing property follows from the concavity of log: log P(X|θ) = log Σ_Z P(X,Z|θ). By Jensen's inequality applied to the concave log function: log Σ_Z P(X,Z|θ) ≥ Σ_Z log P(X,Z|θ) · P(Z|X,θ_old) = Q(θ,θ_old). This lower bound is tight only when P(Z|X,θ) = P(Z|X,θ_old) exactly, achieved at θ=θ_old. The M-step increases Q, which raises the lower bound, but this alone does not prove log P(X|θ_new) ≥ log P(X|θ_old) without separately accounting for how the bound's tightness changes at θ_new versus θ_old.`,
          `D) Define Q(θ,θ_old) = E_{z|x,θ_old}[log P(x,z|θ)], the expected complete-data log-likelihood. Decompose: log P(x|θ) = Q(θ,θ_old) − H(θ,θ_old), where H(θ,θ_old) is a KL divergence and is always ≥ 0. By Jensen (log is concave): log P(x|θ) ≥ Σ_z q(z)log(P(x,z|θ)/q(z)) — the ELBO. The E-step sets q(z) = P(z|x,θ_old), making this bound tight at θ_old. The M-step sets θ_new = argmax_θ Q(θ,θ_old), so Q(θ_new,θ_old) ≥ Q(θ_old,θ_old) = log P(x|θ_old), hence log P(x|θ_new) ≥ log P(x|θ_old).`,
        ],
        answer: `D`,
      },
      {
        q: `EM converges, but the solution is often a local optimum. What strategies help escape poor local optima in practice?`,
        options: [
          `A) EM converges to a local maximum of the log-likelihood, or sometimes a saddle point — not the global optimum; GMM landscapes have many local optima from different cluster assignments. Strategies: (1) multiple random restarts, keeping the highest final log-likelihood; (2) k-means++ initialisation, seeding centroids spread out by distance; (3) annealing — start with broad, overlapping covariances and shrink them gradually.`,
          `B) EM only converges to local optima when the number of mixture components k is misspecified relative to the true generative process. The correct strategy is to first determine the true k using BIC or AIC computed across a range of candidate values, then run EM exactly once with that optimal k. With the correctly specified k, EM always converges to the unique global optimum, because the log-likelihood surface of a correctly-specified Gaussian mixture is provably log-concave in θ.`,
          `C) The primary strategy is gradient-based correction: after EM converges, run a few additional steps of full gradient ascent directly on the marginal log-likelihood log P(X|θ) to escape the local optimum EM settled into. EM is fundamentally a lower-bound maximiser and can therefore stop at non-stationary points of the true objective; gradient ascent detects these by checking whether the gradient norm ‖∇log P(X|θ)‖ exceeds a small threshold ε, and continues climbing directly on the likelihood if so.`,
          `D) Local optima in EM are unavoidable and not especially problematic in practice, because all local optima of the GMM log-likelihood correspond to valid, interpretable cluster solutions of roughly comparable quality. The global optimum is only preferable from a strict statistical standpoint — in applied settings, several different local solutions actually provide useful ensemble diversity by capturing different plausible clusterings of the same data.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `EM converts one intractable optimization — maximizing the marginal likelihood when variables are hidden — into a sequence of tractable steps by alternating between filling in hidden variable distributions and maximizing the resulting expected log-likelihood. Any model with latent variables and a tractable complete-data likelihood is a candidate for EM.`,
    figures: {
      em: `<svg viewBox="0 0 360 108" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="90" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">E ⇄ M loop</text>
  <rect x="20" y="24" width="60" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="50" y="41" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">E: soft labels</text>
  <rect x="20" y="66" width="60" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="50" y="83" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">M: update θ</text>
  <path d="M80,37 C120,37 120,79 84,79" fill="none" stroke="var(--ink-low)" stroke-width="1.4" marker-end="url(#em1)"/>
  <path d="M50,66 L50,50" stroke="var(--ink-low)" stroke-width="1.4" marker-end="url(#em1)"/>
  <text x="270" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">log-likelihood never decreases</text>
  <line x1="170" y1="98" x2="350" y2="98" stroke="var(--rim)"/><line x1="170" y1="24" x2="170" y2="98" stroke="var(--rim)"/>
  <path d="M170,92 L200,72 L230,54 L260,44 L290,40 L340,38" fill="none" stroke="var(--amber)" stroke-width="1.8"/>
  <circle cx="170" cy="92" r="2.2" fill="var(--amber)"/><circle cx="200" cy="72" r="2.2" fill="var(--amber)"/><circle cx="230" cy="54" r="2.2" fill="var(--amber)"/><circle cx="260" cy="44" r="2.2" fill="var(--amber)"/><circle cx="290" cy="40" r="2.2" fill="var(--amber)"/><circle cx="340" cy="38" r="2.2" fill="var(--amber)"/>
  <text x="255" y="106" text-anchor="middle" fill="var(--ink-low)" font-size="7">iterations → converges to a local max</text>
  <defs><marker id="em1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
    recap: [
      "**EM breaks the chicken-and-egg** of latent variables: need labels for params, need params for labels.",
      "**E-step:** given θ, compute soft responsibilities P(segment k | point i), summing to 1 per point.",
      "**M-step:** given responsibilities, update params with weighted statistics (weighted means/covariances).",
      "**Monotonic guarantee:** each iteration increases the marginal log-likelihood (Jensen on the log-sum), converging to a local max.",
      "**K-means = hard-assignment EM;** HMM Baum-Welch, probabilistic PCA are all EM instances.",
      "**Use EM when complete-data likelihood is tractable but the marginal (over hidden vars) is not.**",
      "**Local optima trap:** run 5–10 random inits (or k-means++) and keep the highest final log-likelihood; a decreasing log-likelihood = M-step bug.",
    ],
  },
  {
    id: 'concentration_inequalities',
    title: 'Concentration Inequalities',
    subtitle: 'Markov, Chebyshev, Hoeffding — generalisation bounds',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['concentration', 'generalisation', 'PAC learning', 'bounds'],
    summary: `You need to estimate the mean click-through rate from 100 samples. Your estimate is 0.043. How confident should you be that the true mean is within 0.01 of this estimate? This is a concentration question: how tightly does a sample statistic concentrate around its true value as the sample size grows? Without formal bounds, you are reporting confidence based on intuition rather than proof.

Markov's inequality: P(X ≥ a) ≤ E[X]/a for non-negative X. Weak but requires only a finite mean — it applies even when variance is infinite. Chebyshev's inequality: P(|X - μ| ≥ kσ) ≤ 1/k². Requires both mean and variance to be finite. Better than Markov but still loose — the bound decays only polynomially in k. Hoeffding's inequality: for bounded independent random variables X_i ∈ [a_i, b_i], the sample mean X̄ satisfies P(|X̄ - E[X̄]| ≥ t) ≤ 2 exp(-2n²t² / Σ(b_i - a_i)²). Exponentially tighter than Chebyshev for bounded variables — the bound shrinks exponentially in t² as t increases.

Union bound (Bonferroni): P(A₁ ∪ A₂ ∪ ... ∪ A_k) ≤ Σ P(A_i). This is used in ML theory to get uniform convergence bounds — proving that the model holds simultaneously over all test examples, not just on average. Combined with Hoeffding, it gives bounds on the generalization gap of a model class.

VC dimension and generalization: the generalization error is bounded by O(√(d_VC log(n/d_VC) / n)) where d_VC is the VC dimension of the hypothesis class and n is training size. More data always helps. More complex models need more data to generalize. For modern overparameterized networks with VC dimension far exceeding training size, these classical bounds are vacuous — the implicit regularization from gradient descent produces tighter practical guarantees.

**NOT this.** Concentration inequalities are not only relevant in theory. These bounds are exactly why you can trust a sample size calculation. Hoeffding's inequality tells you that for click-through rates bounded in [0,1], you need n ≥ log(2/δ) / (2ε²) samples to guarantee P(|X̄ - μ| ≥ ε) ≤ δ with no distributional assumption. Every power calculation in data science is a concentration inequality with a distributional assumption substituted in. The normal approximation underlying t-tests and z-tests is just a special case with a Gaussian assumption; Hoeffding works without any distributional assumption at all.

[FIGURE:conc]`,
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
          `A) Apply Chebyshev to the raw variable X rather than the sample mean: P(|X−5| ≥ 0.5) ≤ Var(X)/0.5² = 4/0.25 = 16, which exceeds 1 and is therefore trivially satisfied and uninformative. The sample mean X̄ is not the right quantity to bound here — Chebyshev applies only to single observations, not to averages, so n=1000 provides no benefit unless the exact distribution family is also known in advance.`,
          `B) Chebyshev applied to X̄: P(|X̄ − μ| ≥ ε) ≤ Var(X̄)/ε² = (σ²/n)/ε². With σ²=4, n=1000, ε=0.5: Var(X̄) = 4/1000 = 0.004, giving a raw bound of 0.004/0.25 = 0.016. But Chebyshev additionally requires the underlying distribution to be symmetric around its mean, so for general asymmetric distributions the correct bound must be doubled: P(|X̄ − 5| ≥ 0.5) ≤ 0.032 = 3.2%.`,
          `C) X̄ is the sample mean of n=1000 i.i.d. samples, so E[X̄] = μ = 5 and Var(X̄) = σ²/n = 4/1000 = 0.004. Chebyshev applied to X̄: P(|X̄ − μ| ≥ ε) ≤ Var(X̄)/ε² = 0.004/0.25 = 0.016, so P(|X̄ − 5| ≥ 0.5) ≤ 1.6%. Chebyshev needs no distributional assumption beyond finite variance — a distribution-free bound. Averaging reduces variance by 1/n, so the bound scales as σ²/(n·ε²): to halve it, quadruple n or halve ε.`,
          `D) P(|X̄ − 5| ≥ 0.5) ≤ 2·exp(−2nε²/range²) is the relevant bound here. We first need the range of X, which is not given. Without knowing the range, we cannot apply Chebyshev to this problem at all — only Hoeffding's inequality, which specifically requires bounded support. Chebyshev only ever applies to individual observations X, never to sample means X̄; for sample means, Hoeffding's inequality is the correct and only valid tool.`,
        ],
        answer: `C`,
      },
      {
        q: `Hoeffding's inequality gives a tighter bound than Chebyshev for bounded random variables. Why? What is the bound on P(|X̄ − E[X̄]| ≥ ε) for n i.i.d. Xᵢ ∈ [0,1]?`,
        options: [
          `A) Hoeffding's bound for n i.i.d. Xᵢ ∈ [0,1]: P(|X̄ − E[X̄]| ≥ ε) ≤ 2exp(−2nε²). Chebyshev gives P ≤ Var(X̄)/ε² = σ²/(nε²) ≤ 1/(4nε²) for bounded [0,1] variables — Hoeffding is exponential in n while Chebyshev is only polynomial. For n=1000, ε=0.1: Hoeffding ≤ 2exp(−20)≈4×10⁻⁹ versus Chebyshev's 2.5×10⁻² — the exponential dominates for large n. Hoeffding is tighter because it uses the boundedness condition directly via the MGF, which is more constrained than variance alone.`,
          `B) Hoeffding's bound for Xᵢ ∈ [0,1]: P(|X̄ − E[X̄]| ≥ ε) ≤ exp(−nε²/2). Chebyshev's bound is 1/(4nε²). For n=1000, ε=0.1: Hoeffding ≤ exp(−5) ≈ 0.0067 while Chebyshev ≤ 0.0025 — Chebyshev is actually tighter in this regime, because it directly uses variance information (σ² ≤ 1/4 exactly), whereas Hoeffding uses only the coarser range information (width = 1). Hoeffding's advantage only appears for very large n or very small ε, not universally.`,
          `C) Hoeffding's bound: P(|X̄ − E[X̄]| ≥ ε) ≤ 2exp(−nε²). This is tighter than Chebyshev's P ≤ σ²/(nε²) ≤ 1/(4nε²) for all n. At n=50, ε=0.1: Hoeffding ≤ 2exp(−0.5)≈1.21, which exceeds 1 and is vacuous, while Chebyshev ≤ 0.5 is actually tighter here. Hoeffding only beats Chebyshev once 2exp(−nε²) < 1/(4nε²), roughly n > 100 for ε=0.1 — the missing factor of 2 in the exponent is the key difference from the correct formula.`,
          `D) Hoeffding's bound equals Chebyshev's bound for variables in [0,1]: both simply give P ≤ 1/(4nε²). The only real difference is that Hoeffding's bound happens to be exact — an equality rather than an inequality — while Chebyshev's remains a loose upper bound throughout. Hoeffding is 'tighter' only in the sense of being achievable by Bernoulli(0.5) variables, while Chebyshev's bound can never actually be achieved — the Paley-Zygmund inequality supplies the true achievable lower bound on P.`,
        ],
        answer: `A`,
      },
      {
        q: `Which two of the following statements about the VC dimension of linear classifiers in ℝ² (which is 3) are correct?`,
        options: [
          `A) There exist 3 non-collinear points in ℝ² that can be shattered — labeled in all 2³=8 possible ways by some linear classifier — but no set of 4 points can ever be shattered, since some 4-point labelings require an XOR-style boundary that no linear classifier can implement.`,
          `B) The VC generalisation bound states that, with probability ≥1−δ over the training sample, test error ≤ train error + √(d·log(2n/d) + log(4/δ))/√n, where d is the VC dimension — so a larger, more expressive hypothesis class needs proportionally more training data n to keep the generalisation gap small.`,
          `C) VC dimension 3 means linear classifiers require at least 3 training examples to be fully specified as a decision boundary; with exactly 3 non-collinear points the linear boundary becomes uniquely determined up to an overall scale factor on the weight vector, and generalisation follows automatically once the boundary is fixed.`,
          `D) VC dimension 3 means the growth function m_H(n) is bounded by O(n³) for every n including n ≤ 3, and this same polynomial bound is what directly produces the O(1/√n) generalisation rate — VC dimension is therefore just another name for the polynomial order of the model.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `Concentration inequalities are the mathematical foundation of every sample size calculation and every generalization bound. Hoeffding's inequality gives distribution-free guarantees for bounded variables — understanding it is what separates a rigorous sample size justification from an intuitive one.`,
    figures: {
      conc: `<svg viewBox="0 0 360 104" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">tighter bounds need stronger assumptions</text>
  <line x1="30" y1="84" x2="340" y2="84" stroke="var(--rim)"/><line x1="180" y1="22" x2="180" y2="84" stroke="var(--rim)" stroke-dasharray="2 2"/>
  <path d="M30,84 C120,84 150,30 180,30 C210,30 240,84 330,84" fill="none" stroke="var(--ink-mid)" stroke-width="1.4"/>
  <text x="180" y="94" text-anchor="middle" fill="var(--ink-low)" font-size="7">true sampling distribution of X̄</text>
  <line x1="245" y1="84" x2="245" y2="30" stroke="var(--amber)" stroke-dasharray="3 2"/><text x="248" y="28" fill="var(--amber)" font-size="7">t</text>
  <rect x="245" y="60" width="85" height="24" fill="var(--prime)" opacity="0.10"/>
  <text x="40" y="40" fill="var(--ink-mid)" font-size="7">Markov: 1/a  (loosest)</text>
  <text x="40" y="52" fill="var(--ink-mid)" font-size="7">Chebyshev: σ²/k²  (poly)</text>
  <text x="40" y="64" fill="var(--prime)" font-size="7" font-weight="700">Hoeffding: 2e^(−2nt²)  (exp)</text>
  <text x="180" y="102" text-anchor="middle" fill="var(--ink-low)" font-size="7">shaded tail P(|X̄−μ|≥t) — bound shrinks exponentially in n for bounded X</text>
</svg>`,
    },
    recap: [
      "**Concentration = how tightly a sample statistic hugs its true value** as n grows — turns intuition into proof.",
      "**Markov:** P(X ≥ a) ≤ E[X]/a — weakest, needs only a finite mean.",
      "**Chebyshev:** P(|X−μ| ≥ kσ) ≤ 1/k² — needs finite variance, decays only polynomially.",
      "**Hoeffding (bounded vars):** P(|X̄−E[X̄]| ≥ t) ≤ 2exp(−2n²t²/Σ(bᵢ−aᵢ)²) — exponentially tighter, distribution-free.",
      "**Sample size from Hoeffding:** n ≥ log(2/δ)/(2ε²); for ε=0.01, δ=0.05 → n ≈ 18,444.",
      "**Union bound** P(∪Aᵢ) ≤ ΣP(Aᵢ) + Hoeffding → uniform convergence / generalisation-gap bounds.",
      "**VC bound:** gen error ≤ O(√(d_VC log(n/d_VC)/n)); classical bounds go vacuous for overparam nets.",
    ],
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
          `A) Algorithm: (1) sample xᵢ ~ Uniform(0,1) for i=1,...,1000; (2) estimate Î = (1/1000)Σᵢ√xᵢ. True value: ∫₀¹√x dx = 2/3 ≈ 0.667. Error: SE = σ/√n, where σ² = Var(√U) = E[U] − (E[√U])² = 1/2 − 4/9 = 1/18, so SE ≈ 0.236/√1000 ≈ 0.0075. However, this specific estimator is only the standard Monte Carlo approach; the alternative hit-or-miss estimator, which samples uniformly in [0,1]×[0,1] and checks whether y ≤ √x, is strictly less efficient and gives a noticeably larger SE ≈ 0.015 for the same sample budget.`,
          `B) Algorithm: (1) draw n=1000 points (xᵢ,yᵢ) ~ Uniform([0,1]²); (2) count hits where yᵢ ≤ √xᵢ; (3) estimate Î = hits/n. True value = 2/3. This hit-or-miss approach targets the same integral as the direct expectation estimator but is statistically less efficient, requiring more samples to reach the same accuracy. SE ≈ √(p(1−p)/n) ≈ √(0.667·0.333/1000) ≈ 0.015, roughly twice the error of the direct expectation estimator for an identical sample budget.`,
          `C) Algorithm: (1) evaluate √xᵢ at n=1000 equally spaced points xᵢ = i/1000; (2) estimate Î = (1/1000)Σᵢ√(i/1000). This is a deterministic Riemann sum, not Monte Carlo at all — there is no randomness in the sample locations. Error here is O(1/n) rather than O(1/√n), so deterministic quadrature is strictly more accurate than Monte Carlo in a single dimension. Monte Carlo's real advantage, dimension-independence, only actually emerges once the dimensionality grows to d ≥ 3 or so.`,
          `D) Draw Uᵢ ~ Uniform(0,1) for i=1,...,1000 and compute Î = (1/1000)Σᵢ√Uᵢ. This works because ∫₀¹√x dx = E[√U] for U~Uniform(0,1), and by LLN, Î → E[√U] as n→∞. True value: 2/3 ≈ 0.667. Expected error: SE ≈ σ/√n where σ² = Var(√U) = E[U] − (E[√U])² = 1/2 − 4/9 = 1/18, so σ ≈ 0.236 and SE ≈ 0.0075 — the estimate lands within ±0.015 (2 SE) with 95% probability. This O(1/√n) error is dimension-independent, unlike quadrature's O(n^{-k/d}).`,
        ],
        answer: `D`,
      },
      {
        q: `What is importance sampling, and when is standard Monte Carlo estimation inefficient?`,
        options: [
          `A) Importance sampling is a variance reduction technique that evaluates f(x) at strategically chosen points rather than genuinely random points. Instead of sampling xᵢ ~ p, you deliberately choose evaluation points at the quantiles of p, which turns the estimator into a deterministic quadrature rule achieving O(1/n) convergence instead of Monte Carlo's usual O(1/√n). The so-called 'importance' weights w(x) = 1/p(x) simply correct for the uneven spacing between the chosen quantile points.`,
          `B) Standard MC estimates E_p[f(x)] = (1/n)Σf(xᵢ) where xᵢ~p; this is inefficient when f(x) is nonzero only in a region p rarely samples (e.g., P(catastrophic failure)). Importance sampling introduces an easy-to-sample proposal q: E_p[f(x)] = E_q[f(x)·p(x)/q(x)], estimated as Î = (1/n)Σᵢf(xᵢ)p(xᵢ)/q(xᵢ) with xᵢ~q. The optimal q*(x) ∝ |f(x)|p(x) concentrates samples where the integrand is large, but IS can blow up to infinite variance if q has lighter tails than p·f.`,
          `C) Importance sampling is essentially equivalent to stratified sampling: partition the sample space into strata and sample from each stratum with probability proportional to that stratum's importance weight. Standard Monte Carlo becomes inefficient specifically when the integrand is multimodal, since each mode then requires its own dedicated sample stratum to be represented well. The importance weights w(x) = p(x)/q(x) must sum exactly to n across all drawn samples for the resulting estimator to remain unbiased.`,
          `D) Standard Monte Carlo is always statistically efficient once n is large enough, regardless of the shape of f or p. Importance sampling is instead a bias-correction technique for cases where the sampler itself introduces systematic bias — for example, when running MCMC with a non-stationary proposal distribution, or when sampling from a truncated version of the target distribution. The weights p(x)/q(x) correct for this bias by reweighting the biased samples from q to match the true target distribution p.`,
        ],
        answer: `B`,
      },
      {
        q: `Which two of the following statements about MCMC convergence and burn-in are correct?`,
        options: [
          `A) Convergence formally means the total variation distance between the chain's marginal distribution at step t and the target posterior goes to zero as t→∞: ||P(θ_t∈·) − P(·|data)||_TV → 0, guaranteed under ergodicity — irreducibility and aperiodicity — of the transition kernel K(θ'|θ).`,
          `B) Burn-in samples are discarded because they are still influenced by the arbitrary initial state θ₀ and are not yet genuine draws from the target distribution; R̂ (Gelman-Rubin), computed across multiple chains started from different points, is the standard diagnostic for how long burn-in should run.`,
          `C) Convergence means the Metropolis-Hastings acceptance rate settles at exactly 23–44%; once the acceptance rate hits that window, all subsequent samples are guaranteed i.i.d. draws from the posterior regardless of how the chain was initialised or how correlated consecutive samples are.`,
          `D) Convergence is achieved once the log-probability trace plot visibly plateaus, at which point the Markov chain behaves exactly like an i.i.d. sampler, so no thinning or further correlation correction between consecutive samples is ever needed.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `Monte Carlo error scales as O(1/√n) regardless of dimension. That dimension-independence is the entire reason Monte Carlo dominates variational inference, policy gradients, and any high-dimensional expectation. Variance of the integrand — not dimension — determines how many samples you need.`,
    recap: [
      "**Monte Carlo = replace an intractable integral with a sample average:** sample Xᵢ, average f(Xᵢ) → E[f(X)].",
      "**Error = σ/√n, O(1/√n) and dimension-independent** — halve error → quadruple samples. Why it beats grid integration (Nᵈ).",
      "**MCMC (Metropolis-Hastings):** accept x→x' with min(1, p(x')/p(x)); the ratio cancels the normalising constant.",
      "**Importance sampling reweights by p(x)/q(x)** — unbiased, but light-tailed q → a few huge weights dominate.",
      "**Diagnose IS with ESS = (Σwᵢ)²/Σwᵢ²;** ESS/n < 0.1 means the proposal is misspecified.",
      "**MCMC mixing:** trace plots like white noise, R-hat < 1.1 across chains from different starts.",
      "**MC is everywhere:** Bayesian posteriors, dropout uncertainty, bootstrap CIs, RL policy gradients — any expectation you can't solve.",
    ],
  },
  {
    id: 'sampling_distributions',
    title: 'Sampling Distributions & CLT',
    subtitle: 'CLT, standard error, confidence intervals, bootstrap',
    difficulty: 'foundational',
    estimatedMin: 24,
    tags: ['CLT', 'confidence intervals', 'bootstrap', 'standard error'],
    summary: `You run an A/B test. Treatment group (n=500) has CTR 4.3%. Control (n=500) has CTR 3.8%. The difference is 0.5 percentage points. Is this a real effect or just sampling noise? To answer, you need to know: if the true CTRs were equal, how variable would a 0.5% difference be purely from random sampling? The sampling distribution — the distribution of a statistic's value across many hypothetical repeats of the same sampling process — of (CTR_treatment - CTR_control) under the null hypothesis answers this exactly.

The sample mean X̄ of n i.i.d. draws from a population with mean μ and variance σ² has: E[X̄] = μ and Var[X̄] = σ²/n. Standard error = σ/√n. By the Central Limit Theorem, for large n, X̄ ≈ N(μ, σ²/n) regardless of the shape of the original distribution. This is why t-tests and z-tests work asymptotically for any distribution — they operate on means, and means become approximately normal.

The t-distribution: when σ is unknown and estimated from data as the sample standard deviation s, the statistic (X̄ - μ)/(s/√n) follows a t-distribution with n-1 degrees of freedom. The t-distribution has heavier tails than N(0,1) for small n, reflecting the extra uncertainty introduced by estimating σ. At n=30 or more, t(n-1) is nearly indistinguishable from N(0,1) — a separate convergence fact from (but numerically close to) the informal n≥30 rule of thumb often cited for the CLT itself; the two thresholds are not the same claim and neither derives the other.

Bootstrap sampling distribution: the empirical alternative to analytical formulas. Draw n samples with replacement from your data, compute the statistic, repeat 10,000 times. The distribution of the statistic across bootstrap samples is the sampling distribution. Works for any statistic — AUC, precision@K, NDCG — with no formula required.

**NOT this.** The CLT applies to any distribution for large n is not unconditionally true. The CLT requires finite mean and finite variance. For heavy-tailed distributions — Pareto with tail index less than 2, some financial return distributions — the variance does not exist and the CLT does not apply. The sample mean does not converge to a Gaussian; it converges to a stable distribution with heavier tails. For web latency, transaction sizes, and other power-law distributed data, checking whether the CLT applies before running a t-test is not paranoia — it is necessary.

Back to the A/B test: pooled CTR under the null is (0.043·500 + 0.038·500)/1000 = 0.0405, so SE of the difference = √(0.0405·0.9595·(1/500+1/500)) ≈ 0.0125, or 1.25 percentage points. The observed 0.5-point gap is about 0.4 standard errors from zero (z ≈ 0.40, two-sided p ≈ 0.69) — nowhere near the ~2 SE needed for significance, so this particular 0.5pp gap is comfortably explained by sampling noise alone, not a real effect.

[FIGURE:clt]`,
    keyPoints: [
      `**Always report the standard error (σ/√n) alongside any point estimate.** An estimate without its standard error is not a scientific claim — it is a number without an indication of how much it would vary across repeated samples. For differences between groups, the standard error of the difference is √(σ₁²/n₁ + σ₂²/n₂), assuming independence between groups.`,
      `**Trap: using a z-test when n < 30 and the distribution is non-normal.** The z-test uses critical value 1.96, which comes from N(0,1). For small n with unknown σ, the correct critical value comes from the t-distribution: t_{0.025, n-1}. For n=10, that critical value is 2.262 instead of 1.96 — using z inflates Type I error because the interval is too narrow.`,
      `**Diagnostic: if your A/B test p-value looks suspiciously small (< 0.001) or large (> 0.5), recheck the standard error computation.** Common errors: not accounting for within-user correlation across multiple observations (inflates effective sample size), using population σ instead of sample s, or forgetting that the standard error of a difference requires variance from both groups, not just one.`,
    ],
    interactivePrompt: `Before you touch the controls: if you double your sample size in an A/B test, by how much do you expect the standard error to shrink — half, one quarter, or something else — and what does that imply for how expensive it is to get precise estimates?`,
    checkQuestions: [
      {
        q: `X₁,...,Xₙ ~ N(μ,σ²). Which two of the following statements about the sampling distribution of S² are correct?`,
        options: [
          `A) (n−1)S²/σ² follows a χ²(n−1) distribution rather than χ²(n) — one degree of freedom is lost because the deviations are computed from the sample mean X̄, not the true mean μ, and the deviations (Xᵢ−X̄) must sum to zero, confining them to an (n−1)-dimensional subspace.`,
          `B) Dividing by n−1 rather than n is what makes S² an unbiased estimator of σ²: with the n−1 correction E[S²] = σ², whereas dividing by n instead would give the biased E[S²] = σ²(n−1)/n.`,
          `C) (n−1)S²/σ² is claimed to follow N(0,1) by the CLT, on the reasoning that S² is a sample average of squared deviations and averages of i.i.d. quantities become approximately normal for large n, regardless of the actual distributional family involved.`,
          `D) (n−1)S²/σ² is claimed to follow an F(n−1,n) distribution, on the reasoning that it is a ratio of two chi-squared variables — χ²(n−1) in the numerator divided by an implicit χ²(n) coming from the denominator σ² itself.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `If X̄ ~ N(μ, σ²/n), what does the Central Limit Theorem say about non-Gaussian X, and when does it break down?`,
        options: [
          `A) CLT states that X̄ ~ N(μ, σ²/n) exactly for all distributions with finite variance, regardless of how large or small n is. The distribution of X̄ is claimed to be always exactly Gaussian whenever X has finite variance — supposedly following from the characteristic function of a sum of i.i.d. variables being the product of individual characteristic functions, which is then claimed to equal the Gaussian characteristic function by the additive property of cumulants.`,
          `B) CLT: if X₁,...,Xₙ are i.i.d. with mean μ and finite variance σ², then √n(X̄ − μ)/σ →_d N(0,1) as n→∞. Practical rule of thumb: CLT works well for n≥30 for most distributions; for highly skewed or heavy-tailed distributions, it may need n≥100 or more. The CLT is claimed to never break down as long as the sample size is large enough — for any distribution with finite variance, there is supposedly always some n beyond which the normal approximation holds, with the required n depending only on the skewness and kurtosis of X.`,
          `C) CLT: √n(X̄ − μ)/σ →_d N(0,1) as n→∞, regardless of the shape of P(X) — the standardised sample mean approaches a standard normal no matter the shape of the original distribution. Rule of thumb: n≥30 works for most distributions, heavy-tailed ones may need n≥100. Breakdown conditions: (1) infinite-variance distributions (Cauchy, Pareto with tail index α<2) — the sample mean itself has infinite variance, so Generalized CLT (stable distributions) applies instead; (2) non-i.i.d. autocorrelated data needs a Functional CLT; (3) extreme imbalance (binary data with p near 0) needs n·p·(1−p) large enough.`,
          `D) CLT: X̄ converges to a Student-t distribution with n−1 degrees of freedom for non-Gaussian X. As n→∞, this t-distribution converges to N(0,1). For non-Gaussian X, the sample mean is claimed to have heavier tails than predicted by the normal approximation, which the t-distribution is said to correctly capture. Breakdown: for n>1000, the t and normal distributions become essentially identical, and the CLT approximation is claimed valid for any distribution with finite variance.`,
        ],
        answer: `C`,
      },
      {
        q: `The t-distribution has heavier tails than the normal. Why does this matter when computing confidence intervals with small samples?`,
        options: [
          `A) With known σ: X̄ ± 1.96σ/√n. With unknown σ: X̄ ± tσ/√n. The t-distribution correction multiplies the CI width by the ratio t_{0.025,n−1}/1.96. For n=5, that correction factor is 2.776/1.96 ≈ 1.42 — about 42% wider than the naive normal-based interval. For n=30, the correction factor shrinks to roughly 1.04, nearly negligible. The practical consequence is that small-sample confidence intervals require using proper t-tables rather than the fixed z=1.96, otherwise the stated 95% coverage ends up being noticeably lower than advertised.`,
          `B) With known σ: (X̄ − μ)/(σ/√n) ~ N(0,1), so the 95% CI is X̄ ± 1.96σ/√n. With unknown σ, we substitute S (sample std dev): (X̄ − μ)/(S/√n) ~ t(n−1). The t-distribution has heavier tails because S is only an estimate of σ, adding extra uncertainty; the critical value t_{0.025,n−1} > 1.96 for all finite n — e.g. 2.776 at n=5, 2.262 at n=10, 2.042 at n=30, converging to 1.96 as n→∞. Using z=1.96 with small samples gives an interval that is too narrow, with true coverage below 95%.`,
          `C) The t-distribution has heavier tails because small samples produce more variable estimates — not, in this account, due to estimating σ at all, but because the sampling distribution of X̄ itself is claimed to have heavier tails whenever n is small. This is presented as an exact property of normal populations: for any n, the ratio (X̄−μ)/(σ/√n) is exactly N(0,1), while (X̄−μ)/(S/√n) is exactly t(n−1). The difference is said to disappear only once n>30, because S is claimed to converge to σ and the two ratios become identical.`,
          `D) The t-distribution correction is claimed to be necessary only for σ² estimation, not for μ estimation at all. When computing a confidence interval for σ² (the variance itself), you use chi-squared critical values rather than t-values. Under this view, the t-distribution only ever applies when you are estimating both μ and σ² simultaneously — for μ alone with a known σ, you should always use z=1.96 regardless of how small the sample size n happens to be.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The sampling distribution tells you how much a statistic varies across repeated samples. The CLT makes sample means approximately normal for large n — but large depends on tail behavior. Always verify the CLT assumption holds before running t-tests or z-tests on data with heavy tails.`,
    figures: {
      clt: `<svg viewBox="0 0 360 104" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="85" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">population (skewed)</text>
  <text x="275" y="12" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">dist. of X̄ (normal)</text>
  <line x1="20" y1="82" x2="160" y2="82" stroke="var(--rim)"/>
  <path d="M20,82 C40,82 45,26 60,26 C85,26 110,80 160,82" fill="var(--amber)" opacity="0.18" stroke="var(--amber)" stroke-width="1.4"/>
  <path d="M175,42 l24,0" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#cl1)"/><text x="187" y="36" text-anchor="middle" fill="var(--ink-mid)" font-size="7">average n draws</text>
  <line x1="210" y1="82" x2="350" y2="82" stroke="var(--rim)"/>
  <path d="M210,82 C255,82 262,28 280,28 C298,28 305,82 350,82" fill="var(--prime-faint)" stroke="var(--prime)" stroke-width="1.6"/>
  <line x1="280" y1="82" x2="280" y2="28" stroke="var(--prime)" stroke-dasharray="2 2"/><text x="280" y="94" text-anchor="middle" fill="var(--ink-low)" font-size="7">μ</text>
  <line x1="262" y1="82" x2="298" y2="82" stroke="var(--prime)" stroke-width="2.5"/><text x="322" y="70" fill="var(--prime)" font-size="7" font-weight="700">SE=σ/√n</text>
  <text x="180" y="104" text-anchor="middle" fill="var(--ink-low)" font-size="7">any shape → X̄ becomes normal as n grows; spread narrows as 1/√n</text>
  <defs><marker id="cl1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
    recap: [
      "**Sampling distribution answers \"is this real or noise?\"** — how a statistic varies across repeated samples.",
      "**Sample mean:** E[X̄]=μ, Var[X̄]=σ²/n, standard error = σ/√n.",
      "**CLT:** for large n, X̄ ≈ N(μ, σ²/n) regardless of the original shape — why t/z-tests work on means.",
      "**t-distribution** (σ estimated by s) has heavier tails for small n; at n ≥ 30 it's ≈ N(0,1).",
      "**Bootstrap = resample with replacement, recompute, repeat 10k×** — sampling distribution for any statistic, no formula.",
      "**CLT needs finite mean AND variance** — fails for heavy tails (Pareto tail index < 2); check before a t-test.",
      "**SE ∝ 1/√n:** doubling n only shrinks it by √2 — precision is expensive; for a difference use √(σ₁²/n₁ + σ₂²/n₂).",
    ],
  },
]
