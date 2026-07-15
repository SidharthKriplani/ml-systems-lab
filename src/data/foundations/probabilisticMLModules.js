export const PROBABILISTIC_ML_MODULES = [
  {
    id: 'bayesian_inference',
    interactiveId: 'bayesian_updating_viz',
    title: 'Bayesian Inference',
    subtitle: 'Likelihood, prior, posterior, conjugate priors, predictive distribution, sequential updating',
    difficulty: 'foundational',
    estimatedMin: 50,
    tags: ['bayes', 'posterior', 'prior', 'likelihood', 'conjugate priors', 'credible interval'],
    interactivePrompt: `Before you touch the controls: you flip a coin 3 times and get H, H, H. What is your best estimate of P(heads) — and how confident should you be in that estimate?`,
    summary: `You flip a coin 3 times and get H, H, H. The frequentist MLE gives P(H) = 3/3 = 1.0 — the model is certain the coin always lands heads. But you only have 3 flips. The model has fit the data perfectly and is telling you something obviously wrong. This is what happens when you collapse inference to a single point estimate without tracking uncertainty.

Bayesian inference solves this by maintaining a full distribution over the unknown parameter rather than collapsing to one value. The update rule is: posterior ∝ likelihood \xd7 prior. With a uniform prior Beta(1, 1) — encoding no prior knowledge about the coin — and likelihood P(data | θ) = θ\xb3, the posterior is Beta(4, 1).

[FIGURE: posterior]
 The posterior mean is 4/5 = 0.8, not 1.0. The prior has pulled the estimate away from the degenerate MLE, encoding the reasonable belief that most coins are somewhere near fair.

The key mechanism: the prior's influence is inversely proportional to the amount of data. With 3 flips, the posterior is 0.8 — meaningfully different from MLE. With 300 flips and 300 heads, the posterior mean is 301/302 ≈ 0.99 — nearly identical to MLE. The likelihood dominates and the prior washes out. This is the correct behavior: priors matter when data is scarce and become irrelevant when data is abundant.

The practical cost of this framework is the denominator in Bayes' theorem: p(θ | X) = p(X | θ) p(θ) / p(X), where p(X) = ∫ p(X | θ) p(θ) dθ requires integrating the likelihood over the entire parameter space. For conjugate models, this integral is analytic. For everything else — which is most real models — it has no closed form, and the entire ecosystem of approximate inference methods (MCMC, variational inference, Laplace approximation) exists to avoid or approximate this integral.

**NOT this.** "Bayesian methods are computationally intractable." For conjugate prior-likelihood pairs, the posterior is analytic — no integration required. Beta + Binomial, Gaussian + Gaussian, Dirichlet + Categorical all yield closed-form posteriors. For non-conjugate problems, variational inference reframes the posterior computation as an optimization problem, and MCMC constructs a Markov chain whose stationary distribution is the posterior. Bayesian deep learning with MC Dropout adds a single forward pass with dropout active at test time. The intractability is real but narrower than it appears: it applies only to the exact normalizing constant, and every major approximate inference method has a principled strategy for working around it.`,
    keyPoints: [
      `**Bayes' theorem: p(θ|X) = p(X|θ)p(θ) / p(X).** The normaliser p(X) = ∫ p(X|θ)p(θ)dθ requires integrating the likelihood over the entire parameter space, which has no closed form for most real models. This is why posterior ∝ likelihood \xd7 prior is the workable form — the intractable constant drops out. It also why every approximate inference method (MCMC, VI, conjugate priors) exists: each is a different strategy for avoiding or approximating that integral.`,
      `**Likelihood p(X|θ) is a function of θ given fixed data — it scores how well θ explains what you observed.** It is not a probability distribution over θ and does not integrate to 1 over θ. Conflating likelihood with probability over parameters leads to a specific error: treating the parameter value that maximises the likelihood as the most probable one, ignoring the prior. MLE is valid; calling the MLE the "most probable" parameter is Bayesian reasoning without the prior.`,
      `**Conjugate priors are a computational shortcut: choose a prior from a family where the posterior stays in the same family after multiplying by the likelihood, giving closed-form updates with no integration.** Beta(α,β) + Binomial data → Beta(α + successes, β + failures). Gaussian prior on μ + Gaussian likelihood → Gaussian posterior. Dirichlet + categorical → Dirichlet. This convenience comes at a cost: the conjugate family constrains what shapes your prior can take, which may not match your actual beliefs — the mathematical convenience is real but the resulting prior may not be.`,
      `**The correct Bayesian predictive distribution integrates over the full posterior: p(x*|X) = ∫ p(x*|θ)p(θ|X)dθ.** Plugging in the MAP estimate instead — the common shortcut — treats a point estimate as if it were certain, systematically underestimating predictive uncertainty. In low-data regimes, this underestimate is large enough to make wrong decisions. The correct predictive distribution is wider, especially where the posterior is spread out.`,
      `**Bayesian A/B testing with Beta-Binomial: after observing conversions, p_A and p_B have Beta posteriors.** P(A beats B) = ∫∫ 1[p_A > p_B] p(p_A|data) p(p_B|data) dp_A dp_B — computable analytically or by Monte Carlo. This is a direct probability statement about which variant is better, not a p-value. You stop when P(A > B) clears your decision threshold (e.g., 95%). No null hypothesis needed — the question is framed exactly as "how likely is it that A is better?"`,
      `**Credible intervals and confidence intervals answer different questions.** A 95% Bayesian credible interval [L, U] means P(θ ∈ [L,U] | data) = 0.95 — a direct probability statement about where the parameter is. A 95% frequentist confidence interval means that if you repeated the experiment many times, 95% of the resulting intervals would contain the true θ. For any single computed interval, the true θ either is or isn't in it. Credible intervals are what stakeholders intuitively mean when they ask "how likely is it that the true value is in this range?" — confidence intervals don't answer that question.`,
      `**Sequential Bayesian updating is the natural model for streaming systems: the posterior from today becomes the prior for tomorrow.** With Beta-Binomial, after day 1 you have Beta(α₁, β₁); feed it new data on day 2 and you get Beta(α₁ + new_successes, β₁ + new_failures). No reprocessing of historical data. The prior from yesterday is a sufficient summary of everything observed so far — this is what makes it computationally attractive for systems that must update continuously.`,
      `**Prior sensitivity is the thing practitioners skip and then regret.** In low-data regimes, the prior dominates — your conclusions are largely determined by what you assumed before seeing any data. In high-data regimes, the likelihood takes over and the prior washes out. Always sanity-check: re-run with a more diffuse prior. If the posterior shifts substantially, you do not yet have enough data to draw firm conclusions — the result is prior-driven, not data-driven.`,
      `**MAP (Maximum A Posteriori) estimate: θ_MAP = argmax_θ [log p(X|θ) + log p(θ)].** This is regularised MLE — L2 regularisation corresponds to a Gaussian prior, L1 to a Laplace prior. MAP is often the right production choice (fast, no integration), but it collapses the posterior to a point and discards all information about posterior shape. Using a MAP estimate for predictions is the same as ignoring posterior uncertainty.`,
      `**Priors that look uninformative often aren't.** A uniform prior over θ ∈ [0,1] looks neutral but assigns equal probability to CTR = 0.01 and CTR = 0.99 — which may be a strong prior in a context where rates above 20% are implausible. A uniform prior over log(θ) implies a very different belief. Always ask what your prior implies about the quantities you actually care about, not just the parameterisation you happened to write down.`,
    ],
    checkQuestions: [
      {
        q: `You run a Bayesian A/B test. After 500 conversions each, the posterior P(p_A > p_B | data) = 0.94. Your decision threshold is 0.95. Your boss says "just call it — it's clearly A". Select the two correct responses.`,
        options: [
          `A) Do not call it yet, since 0.94 sits below the 0.95 threshold and the 6% chance B is actually better is not negligible.`,
          `B) Compute the expected revenue loss if A ships but B is truly better, before making the final call.`,
          `C) Call it for A immediately, since 0.94 is close enough to 0.95 that further data collection wastes resources.`,
          `D) Reject A and keep collecting data forever until P(A>B) reaches exactly 1.0.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `What is the marginal likelihood p(X) in Bayes' theorem and why is it hard to compute?`,
        options: [
          `A) p(X) is the maximum likelihood estimate of the data, hard to compute because gradient ascent converges slowly in high-dimensional models.`,
          `B) p(X) is the prior probability of the parameters, hard to compute whenever the chosen prior distribution happens to be analytically improper or unnormalizable.`,
          `C) p(X) = ∫p(X|θ)p(θ)dθ is the normalising constant; it requires integrating over all parameters, intractable for continuous high-dimensional θ.`,
          `D) p(X) is the posterior mode, hard to compute because the likelihood surface typically has many separate local optima.`,
        ],
        answer: `C`,
      },
      {
        q: `You have Beta(2,2) prior on a coin's bias θ. You flip it 3 times and observe HHH. What is the posterior and MAP estimate? How does this differ from the MLE?`,
        options: [
          `A) Posterior is Beta(3,2), MAP = 0.5, MLE = 1.0 — the Beta family is not conjugate to the Binomial, so the prior has no effect on MAP.`,
          `B) Posterior is Beta(5,2), MAP = 4/5 = 0.8, MLE = 1.0 — the prior pulls the estimate away from the degenerate MLE.`,
          `C) Posterior is Beta(5,2), MAP = 1.0, MLE = 0.8 — with only 3 observations the prior fully dominates the likelihood term.`,
          `D) Posterior is Beta(2,5), MAP ≈ 0.29, MLE = 0.0 — the symmetric prior pulls the estimate toward zero as regularisation.`,
        ],
        answer: `B`,
      },
      {
        q: `When would you NOT use Bayesian inference in production and use frequentist methods instead?`,
        options: [
          `A) When you have very large datasets, since Bayesian inference is only valid for small samples and priors always dominate at scale.`,
          `B) When the model has a closed-form posterior, since frequentist methods are required whenever the posterior is analytically available.`,
          `C) When you want to report p-values, since Bayesian methods can always compute mathematically equivalent p-values that are strictly more accurate than frequentist significance tests.`,
          `D) When compute is prohibitive, the prior is hard to specify with little data, regulation mandates frequentist framing, or the model is too large for full Bayesian inference.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `The practical cost of collapsing to a point estimate (MAP) shows up in the predictive distribution: MAP plugged into p(x*|θ̂) underestimates uncertainty because it pretends the parameter is known exactly. The correct predictive distribution integrates over the posterior and is wider, especially in low-data regimes. The credible interval vs confidence interval distinction is the sharpest interview signal: credible intervals are direct probability statements about where the parameter is; confidence intervals are long-run coverage guarantees that say nothing about any single computed interval.`,
    recap: [
      `**Posterior ∝ likelihood × prior.** 3 flips HHH: MLE = 1.0 (degenerate); Beta(1,1) prior → Beta(4,1), posterior mean 0.8.`,
      `**Prior's pull is inversely proportional to data:** dominates when scarce, washes out when abundant (300/300 → 0.99 ≈ MLE).`,
      `**The hard part is the normaliser $p(X)=\int p(X|θ)p(θ)dθ$** — analytic only for conjugate pairs; MCMC/VI/Laplace exist to dodge it.`,
      `**Conjugate priors = closed-form updates:** Beta+Binomial, Gaussian+Gaussian, Dirichlet+Categorical — convenient but constrains prior shape.`,
      `**MAP = regularised MLE** (L2 ↔ Gaussian prior, L1 ↔ Laplace); collapses posterior to a point, discards uncertainty.`,
      `**Predictive distribution integrates over the posterior** — plugging in MAP underestimates uncertainty, badly in low-data.`,
      `**Credible ≠ confidence:** credible = direct $P(θ∈[L,U]|data)$; confidence = long-run coverage, silent on any single interval.`,
    ],
    figures: {
      posterior: `<svg viewBox="0 0 360 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="34" y1="112" x2="340" y2="112" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="34" y1="112" x2="34" y2="16" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="34" y="126" fill="var(--ink-low)" font-size="7.5">0</text>
  <text x="183" y="126" fill="var(--ink-low)" font-size="7.5">θ = P(heads)</text>
  <text x="332" y="126" fill="var(--ink-low)" font-size="7.5">1</text>
  <path d="M34,58 L340,58" fill="none" stroke="var(--ink-low)" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="40" y="54" fill="var(--ink-mid)" font-size="7.5">prior Beta(1,1): flat — no belief</text>
  <path d="M34,112 C 140,112 240,96 340,16" fill="none" stroke="var(--prime)" stroke-width="2.5"/>
  <text x="150" y="90" fill="var(--prime)" font-size="8" font-weight="700">posterior Beta(4,1)</text>
  <line x1="278" y1="112" x2="278" y2="40" stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="3 2"/>
  <text x="200" y="36" fill="var(--amber)" font-size="7.5">mean 0.8 (not MLE 1.0)</text>
  <circle cx="340" cy="112" r="3" fill="#ef4444"/>
  <text x="286" y="120" fill="#ef4444" font-size="7.5">MLE = 1.0 (degenerate)</text>
  <text x="34" y="12" fill="var(--ink-low)" font-size="7">density · 3 flips HHH: prior × likelihood θ³ pulls the estimate off the wall</text>
</svg>`,
    },
  },
  {
    id: 'gaussian_processes',
    interactiveId: 'gaussian_process_viz',
    title: 'Gaussian Processes',
    subtitle: 'Distribution over functions, kernel selection, GP regression, sparse GPs, Bayesian optimisation',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['GP', 'gaussian process', 'kernel', 'Bayesian optimisation', 'inducing points', 'SVGP'],
    interactivePrompt: `Before you touch the controls: you have 5 noisy measurements of a physical process at time points {1, 2, 5, 7, 10}. At time 3 — between your first two measurements — what would you predict, and how uncertain should you be? What should happen to that uncertainty at time 20, far beyond your data?`,
    summary: `You have 5 noisy measurements of a physical process at time points {1, 2, 5, 7, 10}. You want to predict the value at time 3. A standard regression model gives you a point prediction — but how confident should you be? The measurements are noisy, and time 3 sits between two observations. A model that says "value = 4.2" with no indication of uncertainty is only half useful.

[FIGURE: gp]

A Gaussian Process solves this by treating the unknown function itself as a random variable. A GP defines a distribution over functions: any finite collection of points {f(x₁), ..., f(xₙ)} follows a jointly Gaussian distribution. The kernel function k(x, x') defines the covariance between any two points — points close in time covary strongly, points far apart covary weakly. You specify the prior over functions by choosing the kernel. The posterior at time 3 conditions the joint Gaussian on your 5 observations, yielding a Gaussian predictive distribution: a mean (best estimate) and a variance (uncertainty). Near the data, the variance collapses — the GP knows what it knows. Far from the data, the variance expands — the GP correctly reports ignorance.

The mechanism that produces this behavior is the posterior update: μ* = K(X*, X)[K(X, X) + σ\xb2I]⁻¹ y, and Σ* = K(X*, X*) - K(X*, X)[K(X, X) + σ\xb2I]⁻¹ K(X, X*). The variance term Σ* shrinks at observed points and expands away from them — this is what no other regression method gives you automatically. At time 20, far beyond your training data, the posterior variance will be large: the GP correctly says it doesn't know.

The cost of this principled uncertainty is computational: the matrix inversion [K(X, X) + σ\xb2I]⁻¹ costs O(n\xb3) and storing K costs O(n\xb2). At n = 10,000, this hits a hard wall on standard hardware. Everything in the sparse GP literature exists to circumvent this wall.

**NOT this.** "GPs are too slow for real data." Exact GPs are O(n\xb3) and impractical for n > 10,000. But inducing point approximations (sparse GPs) reduce this to O(nm\xb2) where m << n. For hyperparameter tuning via Bayesian optimization — where n is the number of function evaluations, typically under 200 — exact GPs are standard, fast, and the default choice in tools like BoTorch. The O(n\xb3) wall is real, but it is the wall for exact GPs at large n. Sparse GPs, SKI, and deep kernel learning each offer a different strategy for breaking through it.`,
    keyPoints: [
      `**A GP is fully specified by a mean function m(x) and a kernel k(x, x').** Any finite collection f(x₁), ..., f(xₙ) follows a multivariate Gaussian: f ~ N(m, K) where Kᵢⱼ = k(xᵢ, xⱼ). The kernel encodes structural beliefs about the function — its smoothness, length-scale, and periodicity. This is the prior over functions. A bad kernel is a bad prior: it doesn't just affect fit, it determines what shapes of function the GP can even consider.`,
      `**GP regression posterior: given noisy observations y = f(X) + ε, ε ~ N(0, σ\xb2I), the posterior at new points X* is Gaussian with mean μ* = m(X*) + K(X*,X)[K(X,X)+σ\xb2I]⁻¹(y-m(X)) and variance Σ* = K(X*,X*) - K(X*,X)[K(X,X)+σ\xb2I]⁻¹K(X,X*).** The variance term is what other regression methods don't give you: it collapses near observed data (the model knows what it knows) and balloons in unexplored regions (the model knows what it doesn't know).`,
      `**Defaulting to RBF is the most common GP mistake.** RBF (squared exponential) is infinitely differentiable — it assumes the function is smoother than almost any real-world process. Sensor readings, financial returns, and experimental measurements are not infinitely differentiable. Mat\xe9rn kernels control differentiability via ν: Mat\xe9rn 3/2 (once differentiable) and 5/2 (twice differentiable) are almost always better defaults. The kernel is the most consequential modelling decision you make with a GP — it encodes what kinds of functions can explain the data.`,
      `**Hyperparameters (length-scale ℓ, signal variance σ\xb2, noise σ\xb2_n) are learned by maximising the log marginal likelihood: log p(y|X,θ) = -\xbdyᵀ(K+σ\xb2I)⁻¹y - \xbd log|K+σ\xb2I| - n/2 log(2π).** The first term rewards fit; the log-determinant penalises complexity — an overly flexible kernel can explain any data but pays a large penalty in the log-determinant term. This is automatic Occam's razor: the simplest kernel consistent with the data wins.`,
      `**O(n\xb3) is the central engineering constraint.** Inverting the n\xd7n kernel matrix costs O(n\xb3) compute and O(n\xb2) memory. For n > 10,000, this is simply infeasible on standard hardware. This single fact drives the entire sparse GP literature — every method there is a different strategy for approximating or avoiding that matrix inversion.`,
      `**Sparse GPs introduce m << n inducing points Z that summarise the training data.** SVGP (Stochastic Variational GP) places a variational distribution q(u) over inducing outputs u=f(Z) and optimises the ELBO with minibatch SGD — O(m\xb3) per step regardless of n. With m=500 and minibatches, you can train on millions of points. The tradeoff: the inducing point approximation introduces bias — the posterior is not the true GP posterior, and predictive uncertainty may be underestimated between inducing points.`,
      `**Bayesian optimisation is where GPs earn their production keep.** Use a GP as a surrogate for an expensive black-box function (hyperparameter tuning, drug discovery, materials science). The GP posterior gives you a mean prediction and uncertainty at any candidate point. Acquisition functions use both to decide where to query next: Expected Improvement (EI) = E[max(0, f(x) - f(x+))]; UCB = μ(x) + κσ(x) where κ tunes the explore-exploit tradeoff. BO with a GP is orders of magnitude more sample-efficient than grid or random search for expensive evaluations.`,
      `**GPs belong in your toolkit for: small datasets (n < 10,000) where calibrated uncertainty is the core deliverable; Bayesian optimisation (the standard surrogate in tools like BoTorch and Ax); scientific regression where domain knowledge belongs in the kernel.** They don't belong in: high-dimensional unstructured inputs (images, raw text) where no meaningful kernel exists, or n > 100,000 without significant approximation infrastructure and the engineering budget to support it.`,
      `**Always normalise outputs to zero mean and unit variance before fitting a GP.** GPs are sensitive to output scale in ways that quietly break the model if you skip this: the noise variance and signal variance hyperparameters are optimised assuming a certain output scale, and wrong assumptions propagate through to miscalibrated uncertainty estimates.`,
    ],
    checkQuestions: [
      {
        q: `You have 50,000 training points and want to use a GP. Select the two valid approaches and what each trades away.`,
        options: [
          `A) SVGP with inducing points via minibatch SGD, trading exact posterior accuracy for tractable O(m³) per-step cost.`,
          `B) Deep kernel networks or SKI for grid-structured inputs, trading a fully nonparametric kernel for expressive but approximate feature learning.`,
          `C) Use an exact GP with float16 precision to halve memory usage, reducing the effective cost to O(n²) without introducing any approximation error at all.`,
          `D) Switch to a random forest entirely, since GPs are mathematically defined only for datasets with fewer than 1,000 points.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Your GP Bayesian optimisation run converges prematurely — the acquisition function keeps suggesting the same region. What went wrong and how do you fix it?`,
        options: [
          `A) The kernel length-scale is too short, causing the GP to treat every new point as uncorrelated with all its neighbors during search.`,
          `B) Insufficient exploration: UCB's κ is too small or the length-scale too large. Fix by increasing κ, checking hyperparameters, or using Thompson sampling.`,
          `C) The ELBO has collapsed because the inducing points are too sparse. Add more inducing points and retrain the entire model completely from scratch, discarding all prior runs.`,
          `D) Premature convergence is expected in GP BO and signals the global optimum has been found; the correct response is to stop the run entirely.`,
        ],
        answer: `B`,
      },
      {
        q: `How does the GP marginal likelihood objective perform automatic model selection, and what is its failure mode?`,
        options: [
          `A) It performs cross-validation by holding out 20% of data; failure mode is overfitting when the validation set is not representative of production traffic.`,
          `B) It maximises the posterior over kernels using a Dirichlet prior; failure mode occurs whenever the chosen prior over kernels is badly misspecified.`,
          `C) It maximises predictive accuracy on a held-out test set; failure mode is data leakage when test points sit too close to training points.`,
          `D) The log marginal likelihood balances fit against a log-determinant complexity penalty; failure mode is local optima in low-data regimes.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `The O(n\xb3) wall is the central engineering fact about GPs, and SVGP with inducing points is the standard workaround — but the tradeoff is that the variational approximation underestimates predictive uncertainty between inducing points. Kernel choice encodes the prior over functions: RBF assumes infinite differentiability (wrong for most real processes), Mat\xe9rn 5/2 assumes twice-differentiability (usually correct), and a periodic kernel is required for any recurring pattern — the GP is only as good as the prior you encode in its kernel.`,
    recap: [
      `**GP = distribution over functions:** any finite set $f(x_1)...f(x_n) \sim N(m, K)$; kernel $k(x,x')$ IS the prior.`,
      `**Posterior variance collapses at data, expands away from it** — the one thing other regression gives you for free.`,
      `**$O(n^3)$ compute, $O(n^2)$ memory** from inverting $[K+σ^2I]$ — hard wall at n > 10,000. The central engineering fact.`,
      `**Kernel = prior over functions:** RBF assumes infinite smoothness (usually wrong); Matérn 5/2 (twice-diff) is the better default.`,
      `**Hyperparameters learned by maximising log marginal likelihood** — fit term vs log-det complexity penalty = automatic Occam's razor.`,
      `**Sparse GPs (SVGP): m ≪ n inducing points, $O(m^3)$/step**; tradeoff = underestimated uncertainty between inducing points.`,
      `**Bayesian optimisation is where GPs earn their keep:** GP surrogate + EI/UCB acquisition, far more sample-efficient than grid/random.`,
    ],
    figures: {
      gp: `<svg viewBox="0 0 360 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="30" y1="120" x2="344" y2="120" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="30" y1="120" x2="30" y2="14" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="30" y="134" fill="var(--ink-low)" font-size="7.5">time →</text>
  <path d="M30,70 C 55,48 70,50 78,58 C 100,80 130,86 168,68 C 200,54 230,74 264,66 C 300,58 330,40 344,24 L344,120 C 330,110 300,96 264,96 C 230,96 200,84 168,90 C 130,98 100,104 78,92 C 62,84 50,82 30,96 Z" fill="var(--prime-faint)" opacity="0.55"/>
  <path d="M30,83 C 55,66 70,66 78,72 C 100,86 130,90 168,80 C 200,72 230,80 264,78 C 300,76 330,66 344,58" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="78" cy="72" r="3" fill="var(--ink-hi)"/>
  <circle cx="98" cy="85" r="3" fill="var(--ink-hi)"/>
  <circle cx="168" cy="80" r="3" fill="var(--ink-hi)"/>
  <circle cx="220" cy="78" r="3" fill="var(--ink-hi)"/>
  <circle cx="264" cy="78" r="3" fill="var(--ink-hi)"/>
  <text x="60" y="14" fill="var(--ink-low)" font-size="7">● = 5 noisy observations · band = ±2σ posterior</text>
  <line x1="128" y1="120" x2="128" y2="83" stroke="var(--amber)" stroke-width="1" stroke-dasharray="2 2"/>
  <text x="102" y="132" fill="var(--amber)" font-size="7">t=3: interpolate, band narrow</text>
  <text x="288" y="20" fill="#ef4444" font-size="7.5" font-weight="700">band widens</text>
  <text x="272" y="112" fill="#ef4444" font-size="7">far from data → GP admits ignorance</text>
</svg>`,
    },
  },
  {
    id: 'variational_inference',
    interactiveId: 'variational_inference_viz',
    title: 'Variational Inference',
    subtitle: 'ELBO, KL divergence, mean field VI, CAVI, stochastic VI — when to use over MCMC',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['variational inference', 'ELBO', 'KL divergence', 'mean field', 'CAVI', 'stochastic VI'],
    interactivePrompt: `Before you touch the controls: you want to find a simple Gaussian that approximates a complex, multimodal distribution with two peaks of unequal height. If you had to pick one Gaussian, what would happen to it — and which peak would it choose?`,
    summary: `You want to fit a topic model (LDA) to 100,000 documents. The exact posterior P(topics | documents) requires summing over all possible topic assignments for every word in every document — exponential in the number of words. You cannot compute it. MCMC could sample from it, but running chains long enough to converge on 100,000 documents takes hours to days. You need a tractable alternative that scales with the data. This is the problem variational inference solves.

Variational inference reframes posterior computation as optimization. Instead of computing the true posterior p(z|x), you pick a simpler family of distributions q(z; φ) — typically factorized Gaussians or Dirichlet distributions — and find the member of that family closest to the true posterior. "Closest" is measured by KL divergence. You minimize KL(q ‖ p) by maximizing the ELBO (Evidence Lower Bound): ELBO = E_q[log p(x, z)] - E_q[log q(z)]. The ELBO is a lower bound on log p(x). Maximizing it pushes q as close to p as possible while keeping q tractable.

[FIGURE: elbo]

The mechanism: ELBO = log p(x) - KL[q(z) ‖ p(z|x)]. Since KL ≥ 0, ELBO ≤ log p(x) always. Maximizing ELBO is exactly equivalent to minimizing KL[q ‖ p(z|x)] — they are the same objective. Once you can compute and differentiate the ELBO, the posterior approximation reduces to gradient descent. Stochastic VI uses minibatch gradient estimates, reducing cost to O(batch_size) per update. This is how VI scales to millions of examples — making LDA at scale, SVGP, and VAE training all tractable.

**NOT this.** "Variational inference always gives accurate posteriors." The approximation quality depends entirely on the variational family. Mean-field VI — the fully factorized assumption q(z) = ∏ᵢ qᵢ(zᵢ) — assumes all latent variables are independent. Real posteriors almost always have correlations. Mean-field ignores all of them. The result: predictions are overconfident because the approximate posterior is too narrow. The forward KL[q ‖ p] is mode-seeking — it concentrates on one posterior mode and ignores others, systematically underestimating posterior variance. When posterior accuracy matters more than speed (clinical decision making, scientific inference), use richer variational families (normalizing flows) or MCMC. Mean-field VI is not a universal approximate Bayesian method; it is a fast approximation with known failure modes.`,
    keyPoints: [
      `**The ELBO (Evidence Lower Bound): log p(x) = ELBO(q) + KL[q(z) ‖ p(z|x)].** Since KL ≥ 0, ELBO ≤ log p(x) always. Maximising the ELBO is equivalent to minimising KL[q(z) ‖ p(z|x)]. Written out: ELBO = E_q[log p(x|z)] + E_q[log p(z)] - E_q[log q(z)] — reconstruction quality plus how close q is to the prior. This is why VAEs maximise a lower bound rather than the true likelihood: the true likelihood requires integrating over z, which is the integral we're trying to avoid.`,
      `**Mean field VI assumes q(z) = ∏ᵢ qᵢ(zᵢ) — each latent variable is independent in the approximate posterior.** Real posteriors almost always have correlations between latent variables. Mean field ignores all of them. The result: each marginal qᵢ can look correct individually while the joint approximation is completely wrong — a diagnostic you only catch by inspecting the joint samples, not the marginals.`,
      `**CAVI (Coordinate Ascent Variational Inference) updates each qᵢ(zᵢ) one at a time, holding all others fixed.** The optimal update is qᵢ*(zᵢ) ∝ exp(E_{−i}[log p(z,x)]). With conjugate priors, these updates have closed forms that look like EM. Without conjugacy, you need gradient-based VI via the reparameterisation trick — which is what makes VAEs trainable.`,
      `**Why VI underestimates uncertainty: VI minimises KL[q ‖ p] = E_q[log q - log p].** This penalises q for putting mass where p is small, but never penalises q for failing to cover regions where p is large. The result: q concentrates on one mode of a multimodal posterior and ignores the rest. The reverse KL[p ‖ q] is mass-covering — it would spread q across all modes — but it's computationally harder. The choice of forward KL is what makes VI tractable and also what makes it systematically overconfident.`,
      `**Stochastic VI scales CAVI to large datasets.** Standard CAVI sweeps all n points per update — O(n) per iteration. Stochastic VI uses minibatch ELBO gradient estimates with SGD/Adam, reducing cost to O(batch_size) per update. This is how VI runs on millions of examples — used in LDA at scale, SVGP, and the encoder-decoder training loop of VAEs. The price is noisier gradient estimates, but the variance is usually manageable with standard variance reduction.`,
      `**VI vs MCMC: MCMC is asymptotically exact — given infinite time, it converges to the true posterior.** VI is biased — it converges to the best approximation within the chosen family, not the true posterior. Use VI when n is large and approximate uncertainty is acceptable. Use MCMC when exact uncertainty is the actual deliverable — scientific inference, clinical decision support — and you can afford the runtime. The choice is not about which is "better" but about whether you need exact uncertainty or approximate uncertainty quickly.`,
      `**Amortised VI trains an inference network to predict q(z|x) directly from x, rather than running iterative CAVI per datapoint.** VAEs use this: the encoder outputs μ(x), σ(x) defining q(z|x) = N(μ(x), σ(x)\xb2). Inference at test time is one forward pass. The cost is that the encoder is a single learned function shared across all datapoints — it trades per-datapoint accuracy for inference speed.`,
      `**The most common VI failure: the ELBO converges but posteriors are too narrow and predictions are overconfident, because Q is too restrictive for the true posterior.** A diagonal Gaussian mean field cannot represent correlated latent variables. If the ELBO at convergence is much lower than the log evidence from a short MCMC run, the variational gap is large — you need a richer family such as normalising flows or hierarchical VI.`,
    ],
    checkQuestions: [
      {
        q: `Explain why the ELBO is a lower bound on log p(x) and why maximising it is equivalent to minimising KL[q ‖ p(z|x)].`,
        options: [
          `A) The ELBO is a lower bound because log p(x) ≥ 0 by definition; maximising it tightens the bound from below until it reaches the true log-likelihood value.`,
          `B) The ELBO lower-bounds log p(x) via the Cauchy-Schwarz inequality; maximising ELBO minimises the reverse KL, spreading mass across all posterior modes.`,
          `C) By Jensen's inequality, log p(x) ≥ ELBO; the gap equals KL[q ‖ p(z|x)] ≥ 0, so maximising ELBO exactly minimises that KL term.`,
          `D) The ELBO lower-bounds log p(x) because it omits the reconstruction term entirely; maximising it is equivalent to maximising the prior entropy of q.`,
        ],
        answer: `C`,
      },
      {
        q: `Your mean field VI model gives very tight posteriors (narrow q distributions) but makes poor predictions. What is likely happening and how do you diagnose it?`,
        options: [
          `A) VI converged to a single mode due to mode-seeking forward KL. Diagnose via ELBO comparisons across initialisations and short MCMC runs.`,
          `B) The learning rate is too high, causing the ELBO to oscillate rather than converge smoothly; reduce the learning rate substantially and rerun training.`,
          `C) The model is underfitting because the variational family is too expressive; switch to a simpler mean-field family with even fewer free parameters.`,
          `D) Tight posteriors always indicate correct convergence; poor predictions mean the likelihood function itself is misspecified and unrelated to VI.`,
        ],
        answer: `A`,
      },
      {
        q: `Select the two correct statements about CAVI vs black-box variational inference (BBVI).`,
        options: [
          `A) CAVI requires conjugate prior-likelihood pairs to get closed-form coordinate updates at each step.`,
          `B) BBVI estimates ELBO gradients via Monte Carlo and applies to any differentiable model, using reparameterisation to cut gradient variance.`,
          `C) CAVI and BBVI are functionally equivalent algorithms under different names; the choice is purely a matter of implementation style.`,
          `D) BBVI requires conjugate priors while CAVI works for any differentiable model, with CAVI typically used inside VAEs.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `VI is biased by construction: it minimises KL[q ‖ p], which is mode-seeking, so it concentrates on one posterior mode and systematically underestimates uncertainty. Tight VI posteriors do not mean the true posterior is tight — they may mean VI found one mode and ignored the rest. The practical choice is: VI when scalability matters and approximate uncertainty is acceptable; MCMC when exact uncertainty is the deliverable and you can afford the runtime.`,
    recap: [
      `**VI reframes inference as optimisation:** pick tractable $q(z;φ)$, minimise $KL[q \| p]$ by maximising the ELBO.`,
      `**ELBO = log p(x) − KL[q ‖ p(z|x)]** — a lower bound (KL ≥ 0); maximising ELBO ≡ minimising KL to the true posterior.`,
      `**Mean-field $q(z)=\prod_i q_i(z_i)$ assumes independence** — real posteriors are correlated; marginals can look right while the joint is wrong.`,
      `**Forward $KL[q \| p]$ is mode-seeking** — concentrates on one mode, systematically underestimates uncertainty (overconfident).`,
      `**Stochastic VI scales it:** minibatch ELBO gradients, $O(\text{batch})$/step → runs on millions (LDA, SVGP, VAEs).`,
      `**Amortised VI:** an inference network predicts $q(z|x)$ in one forward pass (the VAE encoder) — trades per-datapoint accuracy for speed.`,
      `**VI biased, MCMC asymptotically exact:** VI when scale matters and approx uncertainty is fine; MCMC when exact uncertainty is the deliverable.`,
    ],
    figures: {
      elbo: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="150" y1="16" x2="150" y2="104" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="150" y1="24" x2="330" y2="24" stroke="var(--ink-hi)" stroke-width="1.5"/>
  <text x="150" y="12" fill="var(--ink-hi)" font-size="8" font-weight="700">log p(x)  — the true evidence (fixed)</text>
  <rect x="150" y="30" width="180" height="34" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="240" y="51" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">ELBO (maximise this)</text>
  <rect x="150" y="66" width="180" height="24" rx="3" fill="var(--amber)" opacity="0.28" stroke="var(--amber)"/>
  <text x="240" y="82" text-anchor="middle" fill="var(--amber)" font-size="8" font-weight="700">gap = KL[q ‖ p(z|x)] ≥ 0</text>
  <path d="M136,24 L136,90" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M132,24 l4,0 M132,90 l4,0" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="14" y="50" fill="var(--ink-mid)" font-size="7.5">log p(x) =</text>
  <text x="14" y="62" fill="var(--ink-mid)" font-size="7.5">ELBO + KL</text>
  <text x="14" y="86" fill="var(--ink-low)" font-size="7">push ELBO up →</text>
  <text x="14" y="96" fill="var(--ink-low)" font-size="7">KL gap shrinks →</text>
  <text x="14" y="106" fill="var(--ink-low)" font-size="7">q → p(z|x)</text>
</svg>`,
    },
  },
  {
    id: 'vae_foundations',
    interactiveId: 'vae_viz',
    title: 'Variational Autoencoders',
    subtitle: 'Generative model, ELBO, reparameterisation trick, posterior collapse, β-VAE, representation learning',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['VAE', 'ELBO', 'reparameterisation', 'posterior collapse', 'beta-VAE', 'latent space'],
    summary: `Standard autoencoders compress data into a latent code and reconstruct it — but the latent space is irregular. Interpolating between two codes often passes through empty regions that decode into nonsense, because there is no constraint on what the latent space looks like globally. VAEs solve this by placing a probabilistic structure on the latent space: instead of mapping each input to a single point, the encoder maps it to a distribution q(z|x), and the KL regularisation term forces these distributions to stay close to a standard Gaussian prior.

[FIGURE: vae]

The result is a continuous, densely populated latent space where interpolation makes sense and unseen points decode coherently. The reparameterisation trick — writing z = μ + σ\xb7ε where ε ~ N(0,I) — is what makes gradients flow through the sampling step. The central failure mode is posterior collapse: an expressive decoder learns to model p(x) without using z at all, the encoder degenerates to the prior, KL drops to zero, and you have trained a very expensive unconditional generator.`,
    keyPoints: [
      `**The generative model: p_θ(x,z) = p_θ(x|z)p(z) where p(z) = N(0,I).** The decoder p_θ(x|z) maps a latent code to a distribution over x. The problem is fitting this model: to learn θ via maximum likelihood you need p_θ(x) = ∫ p_θ(x|z)p(z)dz, which requires marginalising over all possible latent codes — intractable. VAEs avoid this by optimising a lower bound (the ELBO) instead.`,
      `**The encoder q_φ(z|x) = N(μ_φ(x), diag(σ_φ(x)\xb2)) is a neural network mapping input x to the parameters of an approximate posterior over z.** This is amortised VI: rather than running a separate optimisation per input to find q(z|x), one encoder network handles all inputs at once. The cost is that the encoder is an approximation — it learns the best single function from inputs to posteriors, not the exact posterior for each input.`,
      `**VAE ELBO: L(θ,φ;x) = E_{q_φ(z|x)}[log p_θ(x|z)] - KL[q_φ(z|x) ‖ p(z)].** The reconstruction term rewards the decoder for explaining the data given latent codes sampled from the encoder. The KL term penalises the encoder for drifting from the prior N(0,I). For diagonal Gaussian q, the KL is closed form: -\xbd Σⱼ(1 + log σⱼ\xb2 - μⱼ\xb2 - σⱼ\xb2) — so the only stochastic step that requires a gradient estimator is the expectation over q in the reconstruction term.`,
      `**The reparameterisation trick: you cannot backpropagate through z ~ N(μ, σ\xb2) because the sampling step is stochastic and has no gradient.** Fix: write z = μ_φ(x) + σ_φ(x)⊙ε where ε ~ N(0,I). Now z is a deterministic function of the encoder parameters and a fixed noise draw. Gradients flow through μ and σ back to φ. Without this trick, VAE training requires high-variance REINFORCE-style gradient estimates — end-to-end training becomes impractical. The trick breaks down precisely when z is discrete (Bernoulli, categorical), where no differentiable reparameterisation exists.`,
      `**Posterior collapse is the central VAE failure mode.** When the decoder is sufficiently expressive (PixelCNN, autoregressive Transformer), it can model p(x) without using z at all. The encoder then learns q(z|x) ≈ N(0,I) — identical to the prior regardless of x. The KL term drops to near zero, reconstruction loss stays low, and training happily converges to a model where the latent space carries no information. Symptom: KL ≈ 0 after training. Cause: decoder power exceeds the bottleneck created by the KL penalty.`,
      `**Fixes for posterior collapse: KL annealing — start with β=0 (pure reconstruction), linearly ramp β to 1 over the first 30% of training.** This forces the decoder to first learn to use z before the KL regularisation becomes active. Free bits — floor the KL per latent dimension at δ bits, so the optimiser cannot collapse dimensions to zero without incurring a penalty. Both interventions make the decoder see informative z before it has a chance to learn to ignore z.`,
      `**β-VAE multiplies the KL term by β: L = E[log p(x|z)] - β\xb7KL[q(z|x) ‖ p(z)]. β > 1 over-penalises KL, forcing the encoder to compress information into fewer, more independent latent dimensions — each dimension learns to control one factor of variation. β < 1 relaxes regularisation to combat posterior collapse.** The tradeoff is explicit: higher β gives better disentanglement and worse reconstruction quality. β = 1 is the standard VAE.`,
      `**Standard autoencoders have irregular latent spaces — interpolating between two encoded points often passes through low-density regions that decode into garbage.** VAE latent spaces avoid this because the KL regularisation forces encoder outputs to stay close to N(0,I), which is dense everywhere. Spherical interpolation between two VAE codes z₁ and z₂ produces semantically coherent intermediate samples because the path stays in the high-density region of the prior.`,
      `**Production uses for VAEs: anomaly detection (low ELBO = poor reconstruction or high KL → flag as out-of-distribution), data imputation (infer z from observed dimensions, decode to fill missing values), molecule generation (VAE latent spaces over molecular graphs enable gradient-based optimisation of chemical properties).** VAE outputs are blurrier than GAN or diffusion outputs — this is a direct mathematical consequence of optimising expected MSE under an approximate posterior, which averages over plausible reconstructions rather than sampling one.`,
    ],
    checkQuestions: [
      {
        q: `Explain why the reparameterisation trick is necessary, and describe a case where it cannot be applied.`,
        options: [
          `A) The trick is needed because autodiff frameworks cannot handle matrix operations inside expectation computations; it cannot be applied when the encoder outputs more than 512 latent dimensions.`,
          `B) The trick converts stochastic sampling into a deterministic function of fixed noise ε, letting gradients flow to φ. It fails for discrete z — use Gumbel-Softmax instead.`,
          `C) The trick avoids computing the KL divergence term exactly; it cannot be applied when the prior p(z) is not a standard Gaussian distribution.`,
          `D) The trick eliminates the reconstruction term from the ELBO entirely for faster training; it cannot be applied in convolutional encoder architectures.`,
        ],
        answer: `B`,
      },
      {
        q: `Your VAE's KL loss is near zero after 10 epochs. Select the two correct statements about what is happening and how to fix it.`,
        options: [
          `A) Posterior collapse: an expressive decoder reconstructs x without using z, so the encoder degenerates to the prior.`,
          `B) KL annealing (ramp β from 0 to 1) or free bits (floor the per-dimension KL) both force the decoder to use z first.`,
          `C) Near-zero KL is the intended, healthy behaviour in a well-trained VAE, since it means the posterior matches the prior exactly.`,
          `D) The encoder learning rate is too high, causing the KL term to diverge and then collapse suddenly; reduce it by 10x.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why do VAE-generated images look blurry compared to GAN outputs, and is this fixable within the VAE framework?`,
        options: [
          `A) VAEs optimise expected MSE averaged over the posterior, which blurs plausible reconstructions together. Perceptual losses or VQ-VAE reduce but don't fully fix it.`,
          `B) VAEs use smaller network architectures than GANs, so blurriness is purely a capacity issue fixable by using deeper encoder and decoder networks.`,
          `C) GAN outputs appear sharper only because they memorise training images directly; VAE outputs are actually more realistic on unseen distributions.`,
          `D) VAE blurriness is caused entirely by the KL regularisation term destroying high-frequency information; setting β = 0 removes blurriness completely regardless of decoder architecture.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Posterior collapse — KL → 0, encoder mapping every input to the prior, decoder ignoring z — is caused by expressive decoders that can model p(x) without information from z; KL annealing is the standard fix, because it forces the decoder to commit to using z before the KL penalty activates. VAE blurriness is a mathematical consequence: optimising expected MSE over the posterior averages over all plausible reconstructions, whereas GANs and diffusion models sample individual reconstructions. The reparameterisation trick is what makes VAE training tractable, and it breaks exactly when z is discrete — no differentiable reparameterisation exists for Bernoulli or categorical latents.`,
    recap: [
      `**VAE = probabilistic latent space:** encoder maps x to $q(z|x)$; KL to $N(0,I)$ keeps it dense so interpolation stays coherent.`,
      `**ELBO = reconstruction − KL[q(z|x) ‖ p(z)]** — maximise a lower bound because the true likelihood needs the intractable $\int p(x|z)p(z)dz$.`,
      `**Reparameterisation trick: $z = μ + σ⊙ε$, $ε \sim N(0,I)$** — makes sampling differentiable so gradients flow to φ.`,
      `**Trick breaks for discrete z** (Bernoulli, categorical) — no differentiable reparameterisation; use Gumbel-Softmax.`,
      `**Posterior collapse (KL → 0):** expressive decoder models p(x) ignoring z; encoder degenerates to the prior.`,
      `**Fixes: KL annealing** (β: 0 → 1) and **free bits** — force the decoder to use z before the KL penalty bites.`,
      `**β-VAE:** β > 1 → disentanglement + worse reconstruction; VAE blurriness is intrinsic (expected MSE averages plausible reconstructions).`,
    ],
    figures: {
      vae: `<svg viewBox="0 0 360 116" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="6" y="40" width="40" height="36" rx="4" fill="var(--depth)" stroke="var(--ink-low)"/>
  <text x="26" y="62" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">x</text>
  <path d="M52,42 L92,52 L92,64 L52,74 Z" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="72" y="61" text-anchor="middle" fill="var(--prime)" font-size="7" font-weight="700">encoder</text>
  <rect x="100" y="34" width="58" height="48" rx="4" fill="none" stroke="var(--ink-low)" stroke-dasharray="3 2"/>
  <text x="129" y="30" text-anchor="middle" fill="var(--ink-mid)" font-size="7">q(z|x)=N(μ,σ²)</text>
  <text x="129" y="52" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">μ, σ</text>
  <text x="129" y="70" text-anchor="middle" fill="var(--amber)" font-size="7">z=μ+σ⊙ε</text>
  <circle cx="190" cy="58" r="16" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="190" y="55" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">z</text>
  <text x="190" y="66" text-anchor="middle" fill="var(--ink-low)" font-size="6">latent</text>
  <text x="190" y="30" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">ε~N(0,I)</text>
  <line x1="190" y1="34" x2="190" y2="42" stroke="var(--amber)" stroke-width="1" stroke-dasharray="2 2"/>
  <path d="M212,52 L252,42 L252,74 L212,64 Z" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="232" y="61" text-anchor="middle" fill="var(--prime)" font-size="7" font-weight="700">decoder</text>
  <rect x="260" y="40" width="40" height="36" rx="4" fill="var(--depth)" stroke="var(--ink-low)"/>
  <text x="280" y="62" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">x̂</text>
  <text x="6" y="100" fill="var(--ink-mid)" font-size="7">ELBO = reconstruction(x, x̂)  −  KL[q(z|x) ‖ N(0,I)]</text>
  <text x="6" y="112" fill="#ef4444" font-size="7">posterior collapse: KL → 0, decoder ignores z, encoder = prior</text>
</svg>`,
    },
  },
  {
    id: 'approximate_inference',
    title: 'Approximate Inference Methods',
    subtitle: 'Laplace approximation, importance sampling, MCMC, HMC, diagnostics — when to use which',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['MCMC', 'HMC', 'Metropolis-Hastings', 'Laplace approximation', 'importance sampling', 'R-hat', 'ESS'],
    summary: `Outside of conjugate models, the posterior p(θ|X) is intractable — you cannot compute it, only approximate it. The question is how much approximation you can tolerate and at what computational cost.

[FIGURE: ladder]
 MAP (maximum a posteriori) is the fastest: find the mode and stop, discarding all information about posterior shape. Laplace adds one matrix inversion to recover a Gaussian approximation around the MAP — fast but wrong if the posterior is multimodal or heavy-tailed. MCMC is the gold standard: given enough time, it converges to the true posterior, but "enough time" is often hours or days for complex models. Most production ML systems use MAP with frequentist standard errors and reserve MCMC for settings where exact uncertainty is the product — clinical decision support, scientific inference, hierarchical models. Knowing when each method is appropriate, and critically how to diagnose whether MCMC has actually converged, is what separates theoretical understanding from practical competence.`,
    keyPoints: [
      `**Laplace approximation: find the MAP, compute the Hessian H = -∇\xb2 log p(θ|X) at that point, approximate the posterior as N(θ_MAP, H⁻¹).** No sampling — just one optimisation and one Hessian computation. When the posterior is genuinely unimodal and approximately Gaussian (which the Bernstein-von Mises theorem guarantees asymptotically), this is excellent. It fails badly for multimodal posteriors because the Hessian only captures local curvature at one mode — if the posterior has mass elsewhere, the Laplace approximation misses it entirely.`,
      `**Importance sampling estimates E_p[f(θ)] using a proposal q: E_p[f(θ)] ≈ Σᵢ wᵢ f(θᵢ) where wᵢ ∝ p(θᵢ|X)/q(θᵢ).** The effective sample size ESS ≈ (Σwᵢ)\xb2/Σwᵢ\xb2 tells you how many i.i.d. samples the weighted set is worth. In high dimensions, IS collapses catastrophically: the typical sets of p and q have negligible overlap, almost all weights are near zero, and a few lucky samples dominate the estimate. ESS < 5% of N means the IS estimate is unreliable regardless of sample count.`,
      `**Metropolis-Hastings: propose θ* ~ q(θ*|θ_current), accept with probability α = min(1, p(θ*|X)q(θ_current|θ*) / p(θ_current|X)q(θ*|θ_current)).** The intractable normaliser p(X) cancels in the ratio p(θ*|X)/p(θ_current|X) = p(X|θ*)p(θ*) / p(X|θ)p(θ) — this is the key insight that makes MCMC work at all for unnormalised posteriors. You never need to compute p(X); you only need ratios.`,
      `**HMC augments the state with momentum and uses gradient information to make large, correlated proposals that are accepted at high rates.** Random-walk MH explores via small random steps — inefficient in high dimensions because it takes many steps to traverse the posterior. HMC uses the gradient of log p(θ|X) to simulate Hamiltonian dynamics, enabling large steps that respect the posterior geometry. NUTS (No-U-Turn Sampler) adapts step size and trajectory length automatically and is the default in Stan and PyMC.`,
      `**MCMC diagnostics are non-negotiable.** R-hat (Gelman-Rubin): run K independent chains from different starting points. R-hat = √(total variance / within-chain variance). R-hat < 1.01 → chains have converged to the same distribution. R-hat > 1.1 → chains are exploring different regions; you do not yet have samples from the posterior. ESS accounts for within-chain autocorrelation: ESS < 100 per parameter means high Monte Carlo error. Trace plots should look like a "hairy caterpillar" — no trends, no sticking, all chains overlapping.`,
      `**HMC divergences are a hard stop, not a warning.** A divergence means the leapfrog integrator encountered extreme posterior curvature and went numerically unstable. Any divergences mean the posterior geometry is pathological and posterior estimates are biased. Non-centred reparameterisation fixes the most common cause. Never report results from a sampler with divergences.`,
      `**Non-centred parameterisation is the most important practical HMC fix for hierarchical models.** Centred: μ_i ~ N(μ, σ\xb2) directly — when σ is small, the posterior forms a funnel: narrow at the tip (small μ_i variations) and wide at the top. HMC's step size must be tiny to navigate the narrow funnel tip, causing slow mixing everywhere else. Non-centred: write μ_i = μ + σ\xb7z_i where z_i ~ N(0,1), sample z_i instead. The funnel geometry disappears. If you see divergences in a hierarchical model, this is the first thing to try.`,
      `**Method selection guide: MAP + frequentist CIs for production systems that need speed and scale.** Laplace for post-MAP uncertainty estimates where full MCMC is too slow (last-layer BNNs). NUTS/HMC in Stan or PyMC for serious scientific Bayesian analysis with < ~1M parameters. VI (CAVI, BBVI) for large-scale latent variable models where sampling is too slow. Deep ensembles + conformal prediction for large neural networks where full Bayes is infeasible. The choice is about what you need from uncertainty: a fast approximation or an exact distribution.`,
    ],
    checkQuestions: [
      {
        q: `You run 4 MCMC chains with NUTS. After 2000 samples per chain, R-hat = 1.35 for a key parameter. Select the two correct actions.`,
        options: [
          `A) Recognize the chains have not converged, since R-hat = 1.35 is far above the 1.01 threshold for a trustworthy posterior.`,
          `B) Check trace plots and HMC divergences, then run the chains substantially longer before drawing any conclusions.`,
          `C) Accept the result, since 1.35 is within the commonly cited threshold of R-hat < 2.0 for practical purposes.`,
          `D) Thin the chains by keeping only every 10th sample, which will reliably bring R-hat below 1.01.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why does importance sampling fail in high dimensions, and what is the effective sample size telling you?`,
        options: [
          `A) IS fails in high dimensions because the proposal distribution q must be specified analytically, which becomes impossible past 20 dimensions.`,
          `B) In high dimensions the typical sets of p and q barely overlap, so almost all weights are near zero. ESS tells you how many i.i.d. samples the weighted set is really worth.`,
          `C) IS fails because the acceptance rate drops below 1% in high dimensions, making it equivalent to standard rejection sampling.`,
          `D) IS fails because the normalising constant p(X) cannot be computed exactly in more than 10 dimensions, making the importance weights entirely undefined and unusable.`,
        ],
        answer: `B`,
      },
      {
        q: `What is the Bernstein-von Mises theorem and when does it break down?`,
        options: [
          `A) BvM says the posterior converges to a Gaussian at the MLE; it breaks for non-regular or high-dimensional models.`,
          `B) BvM states that MAP always equals MLE in large samples regardless of prior choice; it breaks down whenever the prior happens to be informative.`,
          `C) BvM states that the posterior predictive converges to the empirical distribution; it breaks down when the model is parametric rather than nonparametric.`,
          `D) BvM states that all Bayesian credible intervals are asymptotically equivalent to bootstrap confidence intervals; it breaks down when bootstrapping is infeasible.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `R-hat > 1.01 means the chains are not sampling from the same distribution — the samples are not from the posterior. This is not a warning to note; it means you do not have valid posterior samples. Non-centred reparameterisation for hierarchical models eliminates the funnel geometry that causes divergences by changing μ_i ~ N(μ, σ\xb2) to μ_i = μ + σ\xb7z_i, z_i ~ N(0,1). The Metropolis-Hastings ratio cancels p(X) — this is the key insight that makes MCMC possible for unnormalised posteriors, because you only ever need the ratio of densities, not the densities themselves.`,
    recap: [
      `**Cost/accuracy ladder:** MAP (mode only) → Laplace (Gaussian at MAP) → MCMC (exact, but hours-to-days).`,
      `**Laplace = $N(θ_{MAP}, H^{-1})$** — one Hessian; fails for multimodal/heavy-tailed posteriors (only local curvature).`,
      `**Importance sampling collapses in high-D:** typical sets of p and q barely overlap; ESS < 5% of N → unreliable.`,
      `**Metropolis-Hastings ratio cancels $p(X)$** — the key that makes MCMC work on unnormalised posteriors (only ratios needed).`,
      `**HMC/NUTS use gradients** for large, high-acceptance proposals; NUTS auto-tunes and is the Stan/PyMC default.`,
      `**R-hat > 1.01 = not converged** — the samples are not from the posterior. HMC divergences are a hard stop, not a warning.`,
      `**Non-centred reparameterisation** ($μ_i = μ + σ·z_i$) removes the funnel geometry that causes hierarchical-model divergences.`,
    ],
    figures: {
      ladder: `<svg viewBox="0 0 360 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="14" fill="var(--ink-low)" font-size="7.5">accuracy ↑ · cost ↑  →  the approximation ladder</text>
  <rect x="8" y="94" width="104" height="26" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="60" y="106" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">MAP</text>
  <text x="60" y="116" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">mode only · fastest</text>
  <rect x="126" y="60" width="104" height="26" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="178" y="72" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">Laplace</text>
  <text x="178" y="82" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">N(θ_MAP, H⁻¹)</text>
  <rect x="244" y="24" width="108" height="26" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="298" y="36" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">MCMC / HMC</text>
  <text x="298" y="46" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">exact · hours–days</text>
  <path d="M112,100 L126,76" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#la)"/>
  <path d="M230,66 L244,44" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#la)"/>
  <defs><marker id="la" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
  <text x="8" y="128" fill="var(--amber)" font-size="7">diagnostics gate MCMC: R̂ &gt; 1.01 or any HMC divergence = not the posterior yet</text>
</svg>`,
    },
  },
  {
    id: 'bayesian_neural_networks',
    title: 'Bayesian Neural Networks & Uncertainty Quantification',
    subtitle: 'Weight distributions, aleatoric vs epistemic uncertainty, dropout VI, last-layer Laplace, deep ensembles, conformal prediction',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['BNN', 'uncertainty', 'epistemic', 'aleatoric', 'deep ensembles', 'conformal prediction', 'dropout VI'],
    summary: `Standard neural networks output a prediction with no honest signal about confidence. A network that outputs 95% probability on every prediction — whether it has seen thousands of similar examples or none at all — is not expressing uncertainty, it is suppressing it. Bayesian Neural Networks address this by placing distributions over weights rather than point estimates, splitting predictive uncertainty into two types: irreducible noise in the data (aleatoric) and uncertainty from insufficient data coverage (epistemic).

[FIGURE: uncertainty]


In practice, full BNNs are infeasible at any useful scale. The empirical punchline is that deep ensembles — train several models from different random seeds — consistently beat most principled Bayesian approximations on calibration benchmarks. The reason is not Bayesian coverage; ensembles explore different loss basins and get function-space diversity that MC Dropout and most VI methods miss. Conformal prediction takes a completely different route: rigorous coverage guarantees with no Bayesian machinery at all.`,
    keyPoints: [
      `**Aleatoric uncertainty is irreducible noise in the data itself.** Infinite training data will not remove it. A blurry medical image has inherent label ambiguity regardless of training set size — the image does not contain enough information to determine the label with certainty. Model it explicitly: predict σ_θ(x) alongside μ_θ(x) so p(y|x,θ) = N(μ_θ(x), σ_θ(x)\xb2). The network outputs the prediction and the noise level. Regions with consistently high σ_θ(x) after training signal inherent data ambiguity.`,
      `**Epistemic uncertainty comes from not having enough data in a region — it is reducible by collecting more data of that type.** A well-calibrated model should be uncertain on out-of-distribution inputs and confident on in-distribution inputs. In a BNN, epistemic uncertainty = variance of E[y|x,θ] over the posterior p(θ|data). The operational use: high epistemic uncertainty in a specific region tells you exactly what data to collect next to reduce model uncertainty there.`,
      `**MC Dropout leaves dropout active at test time, runs T forward passes with different random dropout masks, and uses their variance as uncertainty.** Zero architecture changes are required — this is why it is the most widely deployed BNN approximation. Formally it is equivalent to approximate VI in a specific deep GP model, but the formal correspondence requires dropout rates that practitioners rarely use. It works well enough as a heuristic despite the theoretical mismatch.`,
      `**Last-layer Laplace approximation: train to MAP, then fit a Gaussian posterior only on the last-layer weights W_last ~ N(W̃, H_last⁻¹).** The Hessian is only d_last \xd7 d_last — feasible even for large networks where the full Hessian is prohibitive. Everything else stays as a point estimate. Strong practical baseline: reuses pretrained weights, no training changes, adds only a post-hoc Hessian computation. Calibrates well for classification. Fails for models where the feature extractor (not the last layer) is the source of uncertainty.`,
      `**Deep ensembles: train M independent networks from different random seeds.** Predictive distribution = mixture of their M softmax outputs. Uncertainty = disagreement among ensemble members. Empirically dominates MC Dropout, last-layer Laplace, and most VI methods on calibration benchmarks. The cost is honest: M \xd7 training time and M \xd7 inference cost. There is no free lunch — ensembles are better because they are more expensive.`,
      `**Why ensembles outperform most Bayesian approximations: deep network loss landscapes are highly multimodal.** Different random seeds converge to different loss basins, each corresponding to a functionally different solution. MC Dropout and VI both approximate a distribution localised around one basin. Ensembles explicitly sample different basins and get genuine function-space diversity. Their empirical advantage is loss-basin diversity, not Bayesian posterior coverage.`,
      `**Temperature scaling: after training, find scalar T on a held-out validation set by minimising NLL with scaled logits σ(f(x)/T).** T > 1 softens predictions, T < 1 sharpens them. Accuracy is unchanged — argmax is invariant to positive scaling. One parameter, zero retraining, dramatically reduces ECE for the systematic overconfidence that cross-entropy training induces. This is mandatory before deploying any neural network classifier for probabilistic use.`,
      `**Conformal prediction provides a formal coverage guarantee with no distributional assumptions on the model.** Compute nonconformity scores on a calibration set. Prediction set for a new x*: C(x*) = {y : score(x*,y) ≤ quantile_{1-α}(calibration scores)}. Guarantee: P(y* ∈ C(x*)) ≥ 1-α under exchangeability. The prediction set widens when the model is uncertain and shrinks when confident. It is the only uncertainty method with a formal coverage guarantee — all other methods are heuristic.`,
      `**OOD detection separates good uncertainty methods from bad ones.** Neural networks are notoriously overconfident on OOD inputs — high softmax probability for inputs that look nothing like the training distribution. Deep ensembles produce better OOD uncertainty than single-model methods because disagreement among ensemble members is high for novel inputs. Conformal prediction is the only method with a formal guarantee: if the test input comes from the same distribution as the calibration set, coverage is guaranteed.`,
    ],
    checkQuestions: [
      {
        q: `A model predicts 90% probability that a tumour is benign. Select the two correct statements about distinguishing aleatoric from epistemic uncertainty here.`,
        options: [
          `A) Aleatoric uncertainty persists even with more training data of the same kind, since it reflects irreducible noise in the imaging.`,
          `B) Epistemic uncertainty shrinks as more relevant training data is collected, since it reflects a gap in data coverage rather than noise.`,
          `C) Both types are always eliminated identically by applying temperature scaling to the model's output before deployment.`,
          `D) Epistemic uncertainty is intrinsic to the imaging sensor and cannot be reduced by collecting any additional data.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You need uncertainty estimates for a 100M-parameter production model. MC Dropout adds 100ms per call (20 forward passes). What alternatives exist?`,
        options: [
          `A) Increase dropout rate to 0.9 — higher dropout reduces the passes needed from 20 down to 2, cutting latency while preserving uncertainty quality.`,
          `B) There are no practical alternatives whatsoever; MC Dropout remains the only method that functions for models above 10M parameters at any scale.`,
          `C) Last-layer Laplace, single-pass deterministic methods (SNGP, DUQ), conformal prediction, or ensemble distillation — each with lower overhead.`,
          `D) Switch to a smaller 10M-parameter model entirely, since uncertainty quality scales proportionally with model size in production systems.`,
        ],
        answer: `C`,
      },
      {
        q: `What guarantee does conformal prediction provide, and what assumption can violate it?`,
        options: [
          `A) Conformal prediction guarantees the prediction set always contains exactly one correct label, assuming the model achieves above 80% calibration accuracy.`,
          `B) Guarantees P(y*∈C(x*)) ≥ 1-α under exchangeability. Fails under distribution shift, temporal non-stationarity, or selective prediction.`,
          `C) Conformal prediction guarantees conditional coverage for every specific input individually; the assumption violated is perfect model calibration.`,
          `D) Conformal prediction guarantees the prediction set has minimal possible size; the assumption violated is that the model must be a neural network.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Deep ensembles consistently outperform MC Dropout and most VI-based BNN approximations on calibration benchmarks, and their advantage is function-space diversity from different loss basins — not Bayesian posterior coverage. The aleatoric/epistemic distinction has a concrete operational meaning: aleatoric uncertainty cannot be reduced by collecting more data, while epistemic uncertainty is a direct signal of where more data will improve the model. Conformal prediction is the only method with a formal marginal coverage guarantee under exchangeability — everything else is heuristic.`,
    recap: [
      `**BNNs put distributions over weights** to split uncertainty into aleatoric (irreducible noise) vs epistemic (data coverage).`,
      `**Aleatoric = irreducible** (more data won't help); **epistemic = reducible** — high epistemic tells you exactly where to collect data.`,
      `**MC Dropout:** dropout on at test time, T passes, variance = uncertainty — zero architecture change, most-deployed heuristic.`,
      `**Last-layer Laplace:** Gaussian posterior on final weights only ($d_{last} × d_{last}$ Hessian) — strong post-hoc baseline.`,
      `**Deep ensembles beat MC Dropout / VI** on calibration — advantage is function-space diversity across loss basins, not Bayesian coverage.`,
      `**Temperature scaling** (scalar T on logits) — accuracy unchanged, cuts overconfidence; mandatory before probabilistic deployment.`,
      `**Conformal prediction:** only method with a formal coverage guarantee $P(y^* ∈ C(x^*)) ≥ 1-α$ under exchangeability.`,
    ],
    figures: {
      uncertainty: `<svg viewBox="0 0 360 132" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="30" y1="98" x2="344" y2="98" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="30" y1="98" x2="30" y2="14" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="30" y="112" fill="var(--ink-low)" font-size="7.5">input x →   (● = training data)</text>
  <rect x="70" y="54" width="120" height="44" fill="var(--prime-faint)" opacity="0.5"/>
  <path d="M30,74 C 70,66 110,66 190,72 C 250,76 300,72 344,70" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="86" cy="70" r="2.5" fill="var(--ink-hi)"/>
  <circle cx="110" cy="76" r="2.5" fill="var(--ink-hi)"/>
  <circle cx="134" cy="72" r="2.5" fill="var(--ink-hi)"/>
  <circle cx="160" cy="78" r="2.5" fill="var(--ink-hi)"/>
  <circle cx="182" cy="74" r="2.5" fill="var(--ink-hi)"/>
  <path d="M228,44 C 260,36 300,30 344,26 M228,96 C 260,104 300,110 344,116" fill="none" stroke="#ef4444" stroke-width="1.3" stroke-dasharray="3 2"/>
  <text x="72" y="48" fill="var(--prime)" font-size="7.5" font-weight="700">aleatoric: thin band</text>
  <text x="72" y="130" fill="var(--ink-mid)" font-size="7">irreducible noise — more data won't shrink it</text>
  <text x="238" y="20" fill="#ef4444" font-size="7.5" font-weight="700">epistemic: band flares</text>
  <text x="212" y="130" fill="#ef4444" font-size="7">no data here → reducible; tells you what to collect</text>
</svg>`,
    },
  },
  {
    id: 'calibration_probabilistic',
    interactiveId: 'temperature_scaling_viz',
    title: 'Probabilistic Calibration',
    subtitle: 'Reliability diagrams, ECE, overconfidence in NNs, temperature scaling, Platt scaling, isotonic regression',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['calibration', 'ECE', 'temperature scaling', 'Platt scaling', 'reliability diagram', 'overconfidence'],
    interactivePrompt: `Before you touch the controls: your random forest predicts 80% probability of loan default — when you look at all historical loans where the model said "80%", what fraction do you expect actually defaulted?`,
    summary: `Your risk team is using a random forest to score loan applications. When the model outputs 0.8, they treat it as an 80% probability of default. They set loss reserves, calculate expected portfolio losses, and make approval decisions based on these numbers. Then you run an audit. Among all loans where the model predicted "80% default probability," only 55% actually defaulted. The model is overconfident by 25 percentage points. Every risk calculation built on those numbers is wrong. This is a calibration failure, and it is costing real money.

[FIGURE: reliability]

Calibration asks a simple question: when a model says 70%, does 70% of the time the positive outcome actually occur? A calibration curve — also called a reliability diagram — makes this visible. Bin all predictions into intervals (0–10%, 10–20%, and so on). For each bin, plot the mean predicted probability against the fraction of actual positives. A perfectly calibrated model produces a diagonal line. An overconfident model produces a curve that sags below the diagonal — predictions of 80% correspond to actual rates of 55%.

Different model families have characteristic calibration behavior. Logistic regression is well-calibrated by design: it optimizes a proper scoring rule that directly rewards accurate probability estimates. Random forests are routinely overconfident — the trees output class proportions in their leaves, and these leaf proportions cluster near 0 and 1 because fully grown trees tend to be pure. The result: probabilities pile up at the extremes and are miscalibrated relative to observed rates. Gradient boosting has the same problem. SVMs produce scores that are not probabilities at all by default and need Platt scaling before any probability interpretation is valid. Neural networks are documented to be systematically overconfident after cross-entropy training (Guo et al., 2017) — the optimizer pushes logits toward infinity with no incentive to stop once labels are correctly ranked, and larger models are worse, not better. Label smoothing during training softens the one-hot targets and dampens this effect somewhat, but does not eliminate it — temperature scaling after training is still the standard fix.

Three methods fix this. Platt scaling fits a logistic regression on top of model outputs using a held-out calibration set — two parameters, handles asymmetric miscalibration, needs at least a few hundred calibration examples. Isotonic regression fits a non-parametric monotone function from predicted probabilities to observed frequencies — maximally flexible, but overfits aggressively below about 1,000 examples per class. Temperature scaling divides all logits by a single scalar T before the softmax — one parameter, zero retraining, accuracy unchanged, and it works remarkably well for neural networks.

**NOT this.** A high AUC does not mean a model is well-calibrated. AUC measures discrimination: can the model rank positives above negatives? Calibration measures accuracy of probability estimates: are the numbers themselves trustworthy? A model can have AUC = 0.95 and predict 80% for everything that ends up at 55%. These are orthogonal properties. AUC tells you the model can rank correctly. Calibration tells you the numbers mean what they say. For risk modeling, insurance pricing, and medical decisions, you need both — ranking without calibration means you can order applicants but cannot price the risk correctly. The Brier score = (1/n)Σ(pᵢ - yᵢ)\xb2 penalizes both failures jointly and is the single number that captures the full picture. ECE (Expected Calibration Error) isolates the calibration component.`,
    keyPoints: [
      `**Use calibration checks on any model whose output score drives a threshold decision, a dollar amount, or a downstream probability input.** Random forests and gradient boosting trees need it by default — their leaf-proportion scores are structurally overconfident. Neural networks need temperature scaling before any production deployment for probabilistic use. Logistic regression is the one exception: it is calibrated by design. The practical test: take all predictions in the 0.7–0.8 bucket and compute what fraction of outcomes were actually positive. If it is not approximately 75%, the model is miscalibrated at your decision boundary.`,
      `**The most common production trap is confusing AUC with calibration.** A model with AUC = 0.92 and ECE = 0.14 will rank correctly — put it in an A/B test comparing models and it wins on every ranking metric. But every downstream system using the probabilities is making decisions on numbers that are wrong by 14 percentage points on average. The fraud team sets their block threshold at 0.7 thinking they are blocking 70%+ risk loans, but are actually blocking 56% risk loans. Risk reserves are systematically too low. The failure is invisible in standard model evaluation because AUC reports are the default, and ECE reports are the exception.`,
      `**The diagnostic is the reliability diagram, and the fix is temperature scaling first.** Build the reliability diagram: bin predictions into 10 equal-frequency bins, plot mean predicted probability vs. actual positive rate per bin. If it sags below the diagonal uniformly (overconfidence), apply temperature scaling — fit scalar T on a held-out set by minimizing NLL of softmax(logits/T). Accuracy is unchanged. ECE typically drops from 10–15% to 1–3%. If the curve has a non-uniform shape (overconfident at high probabilities, underconfident at low), use Platt scaling. If neither is sufficient and you have more than 1,000 calibration examples per class, isotonic regression can correct any monotone miscalibration pattern.`,
    ],
    takeaway: `Temperature scaling cannot hurt accuracy (argmax is unchanged) and fixes most of the systematic overconfidence that cross-entropy training induces — it is the mandatory post-training step before using a neural classifier for probabilistic decisions. The AUC vs ECE tradeoff is the calibration insight that matters most: AUC measures ranking quality, ECE measures whether probabilities are accurate at the threshold you actually use for decisions. A model with high AUC but poor calibration is systematically mispricing risk at every decision boundary.`,
    recap: [
      `**Calibration: when the model says 70%, does the positive outcome happen 70% of the time?** "0.8 predicted, 55% actual" = overconfident.`,
      `**Reliability diagram:** bin predictions, plot mean predicted vs actual positive rate; perfect = diagonal, overconfident sags below.`,
      `**Family behaviour:** logistic regression calibrated by design; random forests / GBMs overconfident (leaf proportions near 0/1); NNs overconfident post-CE.`,
      `**Temperature scaling: divide logits by scalar T** — one param, no retrain, accuracy unchanged; ECE 10–15% → 1–3%. Do it first.`,
      `**Platt scaling** for non-uniform miscalibration; **isotonic regression** for any monotone pattern but needs > 1,000 examples/class.`,
      `**AUC ⊥ calibration:** AUC measures ranking, ECE measures probability accuracy at the threshold — a model can rank well and misprice risk.`,
      `**Brier score $=\frac1n\sum(p_i-y_i)^2$ penalises both** discrimination and calibration jointly; ECE isolates the calibration part.`,
    ],
    checkQuestions: [
      {
        q: `Your model has AUC = 0.92 but ECE = 12%. Select the two correct statements about what this means and what to do.`,
        options: [
          `A) The model ranks correctly (high AUC) but its predicted probabilities are miscalibrated, roughly 12 points off on average.`,
          `B) Applying temperature scaling and re-checking the reliability diagram on held-out data is the appropriate next step.`,
          `C) ECE = 12% means the training set has 12% label noise, requiring a full re-annotation pass before retraining.`,
          `D) A 12% ECE is expected and acceptable at AUC = 0.92, since calibration error naturally scales with AUC gains.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You need to compare two models for a medical triage application. Model A has AUC=0.88, ECE=0.03. Model B has AUC=0.91, ECE=0.11. Which do you deploy?`,
        options: [
          `A) For threshold-driven triage, calibration matters. Try recalibrating Model B first; deploy it only if that fixes ECE without hurting AUC.`,
          `B) Always deploy the higher-AUC model in medical settings, since ranking quality alone determines triage prioritisation correctness under audit.`,
          `C) Neither model is deployable; medical applications strictly require ECE below 0.01 and AUC above 0.95 under regulatory standards.`,
          `D) Deploy Model A only — ECE is always more important than AUC in every medical application regardless of how the output is used.`,
        ],
        answer: `A`,
      },
      {
        q: `Why does standard cross-entropy training produce overconfident neural networks, and does label smoothing fix it?`,
        options: [
          `A) Cross-entropy pushes softmax toward one-hot, inflating logits; label smoothing helps but temperature scaling is still recommended.`,
          `B) Cross-entropy training is not actually the cause of overconfidence; the real cause is batch normalisation, which should be replaced entirely with layer norm.`,
          `C) Label smoothing fully and permanently fixes overconfidence, eliminating any need for post-hoc calibration methods of any kind.`,
          `D) Cross-entropy training produces underconfidence rather than overconfidence; label smoothing corrects this by sharpening the output logits.`,
        ],
        answer: `A`,
      },
    ],
    figures: {
      reliability: `<svg viewBox="0 0 360 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="40" y1="118" x2="40" y2="14" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="40" y1="118" x2="160" y2="118" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="40" y1="118" x2="160" y2="18" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M40,118 C 80,110 104,94 160,52" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <line x1="128" y1="118" x2="128" y2="64" stroke="var(--amber)" stroke-width="1" stroke-dasharray="2 2"/>
  <line x1="40" y1="64" x2="128" y2="64" stroke="var(--amber)" stroke-width="0.8" stroke-dasharray="2 2"/>
  <text x="16" y="16" fill="var(--ink-low)" font-size="7">actual</text>
  <text x="42" y="14" fill="var(--ink-low)" font-size="7">ideal y=x</text>
  <text x="40" y="130" fill="var(--ink-low)" font-size="7.5">predicted probability →</text>
  <text x="66" y="106" fill="var(--prime)" font-size="7.5" font-weight="700">model curve</text>
  <text x="118" y="132" fill="var(--amber)" font-size="7">say 0.8</text>
  <text x="6" y="61" fill="var(--amber)" font-size="7">→ 0.55</text>
  <text x="184" y="30" fill="var(--ink-hi)" font-size="8" font-weight="700">sags below diagonal</text>
  <text x="184" y="46" fill="var(--ink-mid)" font-size="7.5">= overconfident; gap = ECE</text>
  <text x="184" y="66" fill="var(--ink-mid)" font-size="7.5">RF / GBM / NN default here;</text>
  <text x="184" y="78" fill="var(--ink-mid)" font-size="7.5">logistic reg is on the line.</text>
  <text x="184" y="98" fill="var(--prime)" font-size="7.5" font-weight="700">fix: temperature scaling</text>
  <text x="184" y="110" fill="var(--ink-mid)" font-size="7.5">divide logits by T → curve</text>
  <text x="184" y="122" fill="var(--ink-mid)" font-size="7.5">straightens, accuracy unchanged</text>
</svg>`,
    },
  },
  {
    id: 'information_geometry',
    title: 'Information Geometry & Natural Gradient',
    subtitle: 'Fisher information matrix, statistical manifold, natural gradient descent, K-FAC, connection to Adam',
    difficulty: 'advanced',
    estimatedMin: 75,
    tags: ['Fisher information', 'natural gradient', 'information geometry', 'K-FAC', 'Riemannian metric', 'Adam'],
    summary: `Standard gradient descent treats all parameter directions as equally meaningful. But two parameters that differ by the same Euclidean distance in parameter space may correspond to distributions that are almost identical or drastically different — the Euclidean metric ignores how sensitive the model's outputs are to perturbations in each direction. This produces the ravine problem: gradient descent zigzags across high-curvature directions while inching along low-curvature directions, wasting steps.

[FIGURE: ravine]

Information geometry gives the right metric: the space of probability distributions is a Riemannian manifold where distances are measured by the Fisher information matrix (FIM), which quantifies how much the output distribution changes per unit perturbation of parameters. Natural gradient descent premultiplies the gradient by the inverse FIM, taking steps that are equal-sized in distribution space.

The result is faster convergence per step. The catch: computing and inverting the full FIM is O(p\xb2) in storage and O(p\xb3) in compute — prohibitive at any useful scale. Adam's per-parameter learning rate scaling is a diagonal FIM approximation, which explains both why Adam works and why it fails when parameters are highly correlated.`,
    keyPoints: [
      `**The Fisher information matrix: F = E_{x~p_θ}[∇_θ log p(x|θ) ∇_θ log p(x|θ)ᵀ].** The FIM measures how much the output distribution changes when θ is perturbed: KL[p_θ ‖ p_{θ+δ}] ≈ \xbd δᵀFδ locally. So the FIM is the curvature of the KL divergence landscape — the metric tensor for distribution space. Flat directions in F (zero eigenvalues) are parameter directions that do not change the output distribution at all — overparameterisation, symmetries, dead neurons.`,
      `**Standard gradient descent is not covariant under reparameterisation: if you apply a bijective transformation φ = h(θ), the gradient direction in φ-space is different from the gradient direction in θ-space (after accounting for the Jacobian).** This means the solution gradient descent finds depends on how you chose to parameterise the model — different implementations of the same model (batch norm vs weight normalisation) converge to different solutions. Natural gradient is covariant: the update corresponds to the same distribution-space step regardless of parameterisation.`,
      `**Natural gradient update: θ_{t+1} = θ_t - η F(θ_t)⁻¹ ∇_θ L.** In a loss landscape with a ravine (high curvature in one direction, low in another), standard SGD zigzags — large steps in the steep direction oscillate, small steps in the shallow direction barely move. Natural gradient rescales: small steps in the steep direction, large steps in the shallow direction. Per distribution-space step, you get more loss reduction than any Euclidean-metric gradient step.`,
      `**FIM = second derivative of KL: KL[p_θ ‖ p_{θ+δ}] ≈ \xbdδᵀFδ.** This is the operational definition that connects information geometry to practical optimisation. Directions with large Fisher eigenvalues change the model's output distribution a lot per unit parameter change — natural gradient takes small steps there. Directions with small eigenvalues change the distribution very little — natural gradient takes large steps there. Euclidean gradient ignores all of this.`,
      `**K-FAC (Kronecker-Factored Approximate Curvature) makes natural gradient tractable for neural networks.** For a layer with weight matrix W, the FIM admits a Kronecker product approximation F ≈ A ⊗ G where A = E[a_ta_tᵀ] (input activation covariance) and G = E[g_tg_tᵀ] (output gradient covariance). Storage drops from O(p\xb2) to O(d_in\xb2 + d_out\xb2) per layer. Inversion is separable: (A⊗G)⁻¹ = A⁻¹⊗G⁻¹. K-FAC captures within-layer input-output correlations — the structure that Adam's diagonal approximation misses.`,
      `**Adam is a diagonal FIM approximation.** The second moment v_t ≈ diag(F) estimates only the diagonal of the Fisher. Dividing the gradient by √v_t + ε approximates rescaling by the diagonal Fisher — each parameter gets an independent learning rate based on its gradient variance. This works well when parameters are approximately uncorrelated. When parameters are highly correlated (collinear features, attention across similar tokens), the off-diagonal terms of F matter and Adam's approximation fails.`,
      `**K-FAC vs Adam: Adam is the practical choice for most deep learning because K-FAC's per-step cost is much higher.** K-FAC wins when data is small, per-step compute is affordable, and the correlations between parameters are strong — some supervised learning benchmarks and RL settings. The convergence advantage is real: K-FAC typically converges in fewer steps, but each step costs more than Adam.`,
      `**TRPO and PPO formalise the natural gradient idea in RL.** TRPO explicitly constrains KL[π_old ‖ π_new] ≤ δ at each update — this is a trust region in distribution space, exactly what natural gradient descent respects. Euclidean constraints on weight updates do not prevent large changes in the policy distribution. KL constraints do — and large distribution changes destabilise RL training. PPO approximates the KL constraint with a clipped surrogate, trading theoretical precision for engineering simplicity.`,
      `**The FIM connects to confidence intervals in MLE.** By the Cram\xe9r-Rao bound, Var(θ̂) ≥ F(θ)⁻¹ for any unbiased estimator. The MLE achieves this bound asymptotically. The inverse FIM is the asymptotic covariance of the MLE — this is where frequentist confidence intervals for point estimates come from. In continual learning, Elastic Weight Consolidation (EWC) penalises changes to parameters with high Fisher information, preserving knowledge from previous tasks by anchoring the highest-curvature directions.`,
    ],
    checkQuestions: [
      {
        q: `Why is the natural gradient invariant to reparameterisation of the model parameters, and why does this matter?`,
        options: [
          `A) Natural gradient is invariant because the FIM is always exactly the identity matrix under any possible reparameterisation of the model.`,
          `B) Natural gradient is invariant because it uses second-order curvature information; standard gradient uses only first-order information that shifts.`,
          `C) Natural gradient is invariant because the step size η is automatically adapted per-parameter; different parameterisations just require rescaling η.`,
          `D) The FIM transforms as a covariant tensor, so F⁻¹∇L maps to the same step regardless of parameterisation; plain SGD finds different optima.`,
        ],
        answer: `D`,
      },
      {
        q: `Adam's second moment estimate v_t ≈ diag(F). Select the two correct statements about what this means for highly correlated parameters.`,
        options: [
          `A) Adam's diagonal approximation ignores off-diagonal correlations between parameters, leading to suboptimal step directions.`,
          `B) K-FAC captures within-layer input-output correlations and converges in fewer steps, at a higher per-step compute cost.`,
          `C) Adam performs identically regardless of correlation, since the diagonal approximation is provably tight for any learning rate.`,
          `D) Adam internally applies the full FIM inverse via its epsilon term, making the diagonal approximation purely cosmetic.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `What is the connection between the Fisher information matrix and confidence intervals in maximum likelihood estimation?`,
        options: [
          `A) By the Cram\xe9r-Rao bound, Var(θ̂) ≥ F(θ)⁻¹; the MLE achieves this asymptotically, giving frequentist confidence intervals.`,
          `B) The FIM equals the Hessian of the log-likelihood only exactly at the MLE point; elsewhere the two quantities are entirely unrelated to each other.`,
          `C) The FIM provides confidence intervals only for exponential family models; for all other likelihoods, bootstrap intervals must be used instead.`,
          `D) The connection is purely theoretical; in practice, confidence intervals are always computed from the loss function's Jacobian, not the FIM.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Parameter space is the wrong space to measure gradient steps — what matters is how much the model's output distribution changes per step, which is measured by the FIM. Adam's diagonal FIM approximation works when parameters are uncorrelated but fails when off-diagonal Fisher terms are large. The TRPO/PPO connection is the most concrete production application: constraining updates by KL[π_old ‖ π_new] instead of Euclidean weight change is what stabilises RL training, because Euclidean constraints on weights do not bound how much the policy distribution changes.`,
    recap: [
      `**Parameter space is the wrong metric** — what matters is how much the output distribution moves per step, measured by the FIM.`,
      `**FIM = curvature of KL:** $KL[p_θ ‖ p_{θ+δ}] ≈ \tfrac12 δ^T F δ$ — the metric tensor for distribution space.`,
      `**Natural gradient: $θ_{t+1} = θ_t - η F^{-1}∇L$** — small steps in steep (high-Fisher) directions, large in flat ones; fixes ravine zigzag.`,
      `**Natural gradient is covariant** to reparameterisation; plain SGD finds different optima depending on parameterisation (batch vs weight norm).`,
      `**Full FIM is $O(p^2)$ store / $O(p^3)$ invert** — infeasible; K-FAC uses Kronecker factoring $F ≈ A ⊗ G$ per layer.`,
      `**Adam is a diagonal FIM approximation** ($v_t ≈ \text{diag}(F)$) — works when parameters are uncorrelated, fails when off-diagonals matter.`,
      `**TRPO/PPO = natural gradient in RL:** constrain $KL[π_{old} ‖ π_{new}]$, not Euclidean weight change — Euclidean constraints don't bound policy shift.`,
    ],
    figures: {
      ravine: `<svg viewBox="0 0 360 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <ellipse cx="180" cy="66" rx="150" ry="30" fill="none" stroke="var(--ink-low)" stroke-width="0.8"/>
  <ellipse cx="180" cy="66" rx="108" ry="21" fill="none" stroke="var(--ink-low)" stroke-width="0.8"/>
  <ellipse cx="180" cy="66" rx="64" ry="12" fill="none" stroke="var(--ink-low)" stroke-width="0.8"/>
  <circle cx="180" cy="66" r="3" fill="var(--ink-hi)"/>
  <text x="150" y="18" fill="var(--ink-low)" font-size="7">loss ravine (elongated contours)</text>
  <path d="M44,50 L70,82 L96,54 L120,78 L142,58 L162,72 L180,66" fill="none" stroke="#ef4444" stroke-width="1.6"/>
  <text x="40" y="44" fill="#ef4444" font-size="7.5" font-weight="700">SGD: zigzags (Euclidean metric)</text>
  <path d="M44,88 C 100,84 150,72 180,66" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <text x="40" y="104" fill="var(--prime)" font-size="7.5" font-weight="700">natural grad: θ ← θ − ηF⁻¹∇L</text>
  <text x="40" y="116" fill="var(--ink-mid)" font-size="7">F rescales to equal steps in distribution space → straight to the min</text>
</svg>`,
    },
  },
  {
    id: 'probabilistic_graphical_models',
    title: 'Probabilistic Graphical Models',
    subtitle: 'Bayesian networks, MRFs, d-separation, factor graphs, belief propagation, HMMs',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['PGM', 'Bayesian network', 'MRF', 'd-separation', 'belief propagation', 'HMM', 'factor graph'],
    summary: `High-dimensional joint distributions are intractable to work with directly — storing and computing over p(X₁,...,Xₙ) is exponential in n.

[FIGURE: collider]

The key observation is that most real-world variables are not all directly dependent on each other. PGMs formalise this: encode which variables are independent of which using a graph structure, then factorise the joint into local potentials over connected subsets. Inference becomes a local message-passing operation over the graph rather than a global computation over the full joint. Bayesian networks use directed edges to encode generative causal stories; Markov Random Fields use undirected edges to encode symmetric correlations. PGMs largely ceded perception tasks to deep learning after 2012, but remain the right tool when conditional independence structure must be explicitly represented, audited, and explained — medical diagnosis networks, causal models, structured prediction with hard output constraints.`,
    keyPoints: [
      `**Bayesian network: a DAG where each node Xᵢ has parents Pa(Xᵢ).** The joint factorises as p(X₁,...,Xₙ) = Πᵢ p(Xᵢ | Pa(Xᵢ)). Every missing edge is a conditional independence assumption. The structure of the DAG is the entire modelling decision — it encodes your beliefs about the causal generating process. A fully connected DAG encodes no independence assumptions and offers no tractability benefit over the full joint.`,
      `**Markov Random Field (MRF): undirected graph, joint factorises over cliques: p(X) = (1/Z) Πc ψc(Xc).** The partition function Z = Σ_X Πc ψc(Xc) sums over all configurations — typically intractable. This is the central computational problem for MRFs: you can write down the unnormalised joint, but normalising it requires the sum you are trying to avoid. MRFs encode symmetric correlations: image segmentation (neighbouring pixels tend to share labels), spatial statistics, Ising models.`,
      `**d-separation is the fundamental tool for reading conditional independence from a Bayesian network.** X and Y are d-separated given Z if Z blocks all paths between them. Chains (X → m → Y) and forks (X ← m → Y) are blocked when m ∈ Z. Colliders (X → m ← Y) are blocked when m ∉ Z and no descendant of m is in Z. The collider rule is the surprising one: conditioning on a collider opens the path, creating a dependence that did not exist marginally. This is Berkson's paradox — the mechanism behind selection bias.`,
      `**Belief propagation (sum-product) on trees: messages pass between variable and factor nodes.** After 2|E| message passes, every node's marginal is exact — you get p(Xᵢ) for every variable by multiplying incoming messages. On loopy graphs, the same algorithm (loopy BP) is an approximation that may not converge, but works well in practice for error-correcting codes and image segmentation. Tree structure is what makes BP exact; loops require approximation.`,
      `**HMM is a chain-structured Bayesian network.** Hidden Markov chain s₁,...,s_T with transition p(s_t|s_{t-1}). Observations x_t ~ p(x_t|s_t). Forward-backward algorithm (BP on the chain): O(T\xb7K\xb2) to compute all marginals p(s_t|x₁,...,x_T). Viterbi (max-product): most likely state sequence. Baum-Welch (EM for HMMs): parameter learning. These three algorithms form the complete HMM toolkit — and each one is just belief propagation in a different form.`,
      `**Exact inference in general Bayesian networks is #P-hard.** The junction tree algorithm handles tractable cases: moralise the DAG → triangulate → build a junction tree → run BP on the tree. Complexity is O(K^{treewidth+1} \xd7 n) where K is the state space size. Treewidth ≤ ~20 is usually feasible; most real-world networks have higher treewidth, making exact inference impossible and forcing approximations (loopy BP, VI, MCMC).`,
      `**Why PGMs lost perception tasks to deep learning after 2012: feature engineering burden (variables and structure had to be hand-specified), inference costs exponential in treewidth, and poor scalability compared to GPU-friendly neural networks.** Why PGMs remain in use: auditable conditional independence structure that can be inspected and explained, structured prediction (CRFs for NER still competitive in low-resource settings), domain knowledge encoding in the graph topology, and causal analysis where the direction of edges has scientific meaning.`,
      `**CRFs (Conditional Random Fields) are the discriminative version of MRFs for structured prediction: p(Y|X) = (1/Z(X)) Πc ψc(Yc,X).** The normaliser Z(X) conditions on input X, making it tractable for linear-chain CRFs via belief propagation. CRFs outperform generative HMMs for sequence labelling when input features are complex and when discriminative training is possible. Largely replaced by BERT fine-tuning for most NLP tasks, but remain relevant when structured output constraints must be hard-enforced.`,
      `**Treewidth determines inference complexity: trees (treewidth 1) allow exact inference in O(K\xb2 \xd7 n); grids (treewidth ≈ √n) require exponential cost per column.** Real-world networks often have high treewidth because domain experts add edges to capture every dependency they can think of, creating highly connected graphs. The expressiveness-tractability tradeoff is fundamental to PGMs: every edge you add captures a dependency and potentially increases treewidth.`,
    ],
    checkQuestions: [
      {
        q: `In a Bayesian network X → Z ← Y, are X and Y marginally independent? Are they independent given Z?`,
        options: [
          `A) X and Y are marginally dependent because they share the common effect Z; conditioning on Z makes them independent by blocking the v-structure path.`,
          `B) X and Y are marginally independent and also independent given Z, because Z is a collider and colliders always block paths regardless of observation.`,
          `C) X and Y are marginally independent (collider Z blocks the path unobserved). Conditioning on Z opens the path — this is Berkson's paradox.`,
          `D) X and Y are marginally dependent due to the directed edges pointing into Z; conditioning on Z renders them independent since the path is blocked.`,
        ],
        answer: `C`,
      },
      {
        q: `What is the treewidth of a graph and why does it determine inference complexity in PGMs?`,
        options: [
          `A) Treewidth is the maximum node degree in the graph; inference complexity is O(K^max_degree) per node, which stays tractable for sparse graphs even at scale.`,
          `B) Treewidth is the number of cycles present in the graph; each cycle adds a multiplicative factor of K to the total inference complexity.`,
          `C) Treewidth is the minimum number of edges to remove to make the graph a tree; inference complexity is O(K^removed_edges) via junction tree.`,
          `D) Treewidth measures how tree-like the graph is; junction tree runs exact inference in O(K^(tw+1)). High-treewidth graphs force approximations.`,
        ],
        answer: `D`,
      },
      {
        q: `You want to use an HMM for anomaly detection in a time series of server metrics. Select the two correct failure modes and their fixes.`,
        options: [
          `A) The Markov assumption breaks under long-range seasonality (daily/weekly), fixable with higher-order HMMs or added seasonal features.`,
          `B) Gaussian emission mismatch for heavy-tailed server metrics, fixable by switching to Student-t emission distributions instead.`,
          `C) The Viterbi algorithm is the only valid inference method for anomaly detection, since forward-backward gives incorrect marginal probabilities.`,
          `D) HMMs cannot detect anomalies by definition, since they only model normal behaviour rather than deviations from it.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `The collider rule is the most interview-critical concept in PGMs: conditioning on a collider Z opens the path between its parents X and Y, creating a dependence that did not exist marginally. This is Berkson's paradox and the mechanism behind selection bias in observational studies. Treewidth determines inference complexity: exact inference is tractable only for low-treewidth graphs, and the exponential cost in treewidth is the primary reason PGMs lost perception tasks to neural networks — but PGMs remain the right tool when conditional independence structure must be explicitly represented, inspected, and explained.`,
    recap: [
      `**PGMs factorise the joint via a graph** — encode independence, turn global computation into local message passing.`,
      `**Bayes net = DAG:** $p(X)=\prod_i p(X_i|Pa(X_i))$, every missing edge is an independence assumption. **MRF = undirected**, cliques + intractable $Z$.`,
      `**Collider rule (the surprising one):** conditioning on a collider $X→Z←Y$ opens the path — Berkson's paradox, the mechanism of selection bias.`,
      `**Belief propagation exact on trees** ($2|E|$ passes); loopy BP on graphs with cycles is approximate but works in practice.`,
      `**HMM = chain Bayes net:** forward-backward $O(T·K^2)$, Viterbi (best path), Baum-Welch (EM) — all just BP in different forms.`,
      `**Treewidth sets inference cost:** junction tree $O(K^{tw+1})$; exact only for low treewidth, else loopy BP / VI / MCMC.`,
      `**Why PGMs faded then persist:** lost perception to deep nets (feature/treewidth cost), but win when structure must be audited and explained.`,
    ],
    figures: {
      collider: `<svg viewBox="0 0 360 132" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="66" y="14" fill="var(--ink-mid)" font-size="7.5" font-weight="700">Z unobserved</text>
  <circle cx="34" cy="40" r="13" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="34" y="44" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">X</text>
  <circle cx="150" cy="40" r="13" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="150" y="44" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Y</text>
  <circle cx="92" cy="86" r="13" fill="var(--depth)" stroke="var(--ink-low)"/>
  <text x="92" y="90" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Z</text>
  <path d="M45,50 L80,76" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#c1)"/>
  <path d="M139,50 L104,76" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#c1)"/>
  <text x="10" y="112" fill="var(--prime)" font-size="7.5" font-weight="700">X ⟂ Y  (path blocked)</text>
  <line x1="182" y1="20" x2="182" y2="120" stroke="var(--rim)" stroke-width="1"/>
  <text x="248" y="14" fill="var(--amber)" font-size="7.5" font-weight="700">condition on Z</text>
  <circle cx="216" cy="40" r="13" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="216" y="44" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">X</text>
  <circle cx="332" cy="40" r="13" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="332" y="44" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Y</text>
  <circle cx="274" cy="86" r="13" fill="var(--amber)" opacity="0.35" stroke="var(--amber)"/>
  <text x="274" y="90" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Z</text>
  <path d="M227,50 L262,76" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#c1)"/>
  <path d="M321,50 L286,76" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#c1)"/>
  <path d="M229,40 L319,40" stroke="#ef4444" stroke-width="1.4" stroke-dasharray="4 2"/>
  <text x="192" y="112" fill="#ef4444" font-size="7.5" font-weight="700">X ⟂̸ Y  spurious link (Berkson)</text>
  <defs><marker id="c1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
  },
]
