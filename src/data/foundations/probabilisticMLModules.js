export const PROBABILISTIC_ML_MODULES = [
  {
    id: 'bayesian_inference',
    title: 'Bayesian Inference',
    subtitle: 'Likelihood, prior, posterior, conjugate priors, predictive distribution, sequential updating',
    difficulty: 'foundational',
    estimatedMin: 50,
    tags: ['bayes', 'posterior', 'prior', 'likelihood', 'conjugate priors', 'credible interval'],
    summary: `Point estimates are only half useful.

A model that tells you "conversion rate = 3.2%" with no indication of how confident it should be gives you no way to distinguish a well-measured result from a guess — and that distinction matters every time data is scarce, you're updating beliefs as evidence arrives, or the cost of being confidently wrong is high. Bayesian inference solves this by tracking a full distribution over the parameter rather than collapsing to a single value. The update rule is: posterior ∝ likelihood × prior. Your prior encodes what you believed before seeing data; the likelihood scores how well each parameter value explains the observations; multiply and normalise and you have the posterior. The catch is that normalisation — integrating the likelihood over the entire parameter space — is analytically intractable for most real models, which is what forces all the approximation machinery (MCMC, VI, conjugate shortcuts) into existence.`,
    keyPoints: [
      `**Bayes' theorem: p(θ|X) = p(X|θ)p(θ) / p(X).** The normaliser p(X) = ∫ p(X|θ)p(θ)dθ requires integrating the likelihood over the entire parameter space, which has no closed form for most real models. This is why posterior ∝ likelihood × prior is the workable form — the intractable constant drops out. It also why every approximate inference method (MCMC, VI, conjugate priors) exists: each is a different strategy for avoiding or approximating that integral.`,
      `**Likelihood p(X|θ) is a function of θ given fixed data — it scores how well θ explains what you observed.** It is not a probability distribution over θ and does not integrate to 1 over θ. Conflating likelihood with probability over parameters leads to a specific error: treating the parameter value that maximises the likelihood as the most probable one, ignoring the prior. MLE is valid; calling the MLE the "most probable" parameter is Bayesian reasoning without the prior.`,
      `**Conjugate priors are a computational shortcut: choose a prior from a family where the posterior stays in the same family after multiplying by the likelihood, giving closed-form updates with no integration.** Beta(α,β) + Binomial data → Beta(α + successes, β + failures). Gaussian prior on μ + Gaussian likelihood → Gaussian posterior. Dirichlet + categorical → Dirichlet. This convenience comes at a cost: the conjugate family constrains what shapes your prior can take, which may not match your actual beliefs — the mathematical convenience is real but the resulting prior may not be.`,
      `**The correct Bayesian predictive distribution integrates over the full posterior: p(x*|X) = ∫ p(x*|θ)p(θ|X)dθ.** Plugging in the MAP estimate instead — the common shortcut — treats a point estimate as if it were certain, systematically underestimating predictive uncertainty. In low-data regimes, this underestimate is large enough to make wrong decisions. The correct predictive distribution is wider, especially where the posterior is spread out.`,
      `**Bayesian A/B testing with Beta-Binomial: after observing conversions, p_A and p_B have Beta posteriors.** P(A beats B) = ∫∫ 1[p_A > p_B] p(p_A|data) p(p_B|data) dp_A dp_B — computable analytically or by Monte Carlo. This is a direct probability statement about which variant is better, not a p-value. You stop when P(A > B) clears your decision threshold (e.g., 95%). No null hypothesis needed — the question is framed exactly as "how likely is it that A is better?"`,
      `**Credible intervals and confidence intervals answer different questions.** A 95% Bayesian credible interval [L, U] means P(θ ∈ [L,U] | data) = 0.95 — a direct probability statement about where the parameter is. A 95% frequentist confidence interval means that if you repeated the experiment many times, 95% of the resulting intervals would contain the true θ. For any single computed interval, the true θ either is or isn't in it. Credible intervals are what stakeholders intuitively mean when they ask "how likely is it that the true value is in this range?" — confidence intervals don't answer that question.`,
      `**Sequential Bayesian updating is the natural model for streaming systems: the posterior from today becomes the prior for tomorrow.** With Beta-Binomial, after day 1 you have Beta(α₁, β₁); feed it new data on day 2 and you get Beta(α₁ + new_successes, β₁ + new_failures). No reprocessing of historical data. The prior from yesterday is a sufficient summary of everything observed so far — this is what makes it computationally attractive for systems that must update continuously.`,
      `**Prior sensitivity is the thing practitioners skip and then regret.** In low-data regimes, the prior dominates — your conclusions are largely determined by what you assumed before seeing any data. In high-data regimes, the likelihood takes over and the prior washes out. Always sanity-check: re-run with a more diffuse prior. If the posterior shifts substantially, you do not yet have enough data to draw firm conclusions — the result is prior-driven, not data-driven.`,
      `**MAP (Maximum A Posteriori) estimate:

$θ_MAP = argmax_θ [log p(X|θ) + log p(θ)].** This is regularised MLE — L2 regul$

arisation corresponds to a Gaussian prior, L1 to a Laplace prior. MAP is often the right production choice (fast, no integration), but it collapses the posterior to a point and discards all information about posterior shape. Using a MAP estimate for predictions is the same as ignoring posterior uncertainty.`,
      `**Priors that look uninformative often aren't.** A uniform prior over θ ∈ [0,1] looks neutral but assigns equal probability to CTR = 0.01 and CTR = 0.99 — which may be a strong prior in a context where rates above 20% are implausible. A uniform prior over log(θ) implies a very different belief. Always ask what your prior implies about the quantities you actually care about, not just the parameterisation you happened to write down.`,
    ],
    checkQuestions: [
      {
        q: `You run a Bayesian A/B test. After 500 conversions each, the posterior P(p_A > p_B | data) = 0.94. Your decision threshold is 0.95. Your boss says "just call it — it's clearly A". What do you do and why?`,
        options: [
          `A) Do not call it yet — examine expected loss first. P(A>B)=0.94 is below threshold; the 6% chance B is better is non-negligible. Compute expected revenue loss if A is rolled out but B is actually better before deciding.`,
          `B) Call it for A immediately, since 0.94 is practically indistinguishable from 0.95 and further data collection is wasteful when the result is this clear.`,
          `C) Reject A and collect more data indefinitely until P(A>B) reaches exactly 1.0, since Bayesian thresholds must be met precisely.`,
          `D) Switch to a frequentist p-value test, since Bayesian thresholds are inherently subjective and cannot support a business decision.`,
        ],
        answer: `A`,
      },
      {
        q: `What is the marginal likelihood p(X) in Bayes' theorem and why is it hard to compute?`,
        options: [
          `A) p(X) is the maximum likelihood estimate of the data and is hard to compute because gradient ascent is slow in high dimensions.`,
          `B) p(X) is the prior probability of the parameters and is hard to compute because priors are often improper.`,
          `C) p(X) = ∫ p(X|θ)p(θ)dθ is the normalising constant requiring integration over all parameters. It is intractable for continuous high-dimensional θ, which is why MCMC, VI, and conjugate shortcuts exist.`,
          `D) p(X) is the posterior mode and is hard to compute because the likelihood surface has multiple local optima.`,
        ],
        answer: `C`,
      },
      {
        q: `You have Beta(2,2) prior on a coin's bias θ. You flip it 3 times and observe HHH. What is the posterior and MAP estimate? How does this differ from the MLE?`,
        options: [
          `A) Posterior is Beta(3,2), MAP = 0.5, MLE = 1.0. The prior has no effect on MAP since the Beta family is not conjugate to the Binomial.`,
          `B) Posterior is Beta(5,2), MAP = 4/5 = 0.8, MLE = 3/3 = 1.0. The prior pulls the estimate away from the degenerate MLE of 1.0; the posterior mean E[θ|data] = 5/7 ≈ 0.71 is even more conservative.`,
          `C) Posterior is Beta(5,2), MAP = 1.0, MLE = 0.8. With only 3 observations the prior dominates, so MAP equals MLE.`,
          `D) Posterior is Beta(2,5), MAP = 2/7 ≈ 0.29, MLE = 0.0. The symmetric prior pulls the estimate toward zero as a regularisation effect.`,
        ],
        answer: `B`,
      },
      {
        q: `When would you NOT use Bayesian inference in production and use frequentist methods instead?`,
        options: [
          `A) When you have very large datasets, since Bayesian inference is only valid for small samples and the prior always dominates in large-data regimes.`,
          `B) When the model has a closed-form posterior, since frequentist methods are required whenever the posterior is available analytically.`,
          `C) When you want to report p-values, since Bayesian methods can always compute equivalent p-values but frequentist methods are more accurate.`,
          `D) When computational cost is prohibitive, when the prior is hard to specify and small data makes it matter, when regulatory compliance mandates frequentist framing, or when the model is too large for practical Bayesian inference over all weights.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `The practical cost of collapsing to a point estimate (MAP) shows up in the predictive distribution: MAP plugged into p(x*|θ̂) underestimates uncertainty because it pretends the parameter is known exactly. The correct predictive distribution integrates over the posterior and is wider, especially in low-data regimes. The credible interval vs confidence interval distinction is the sharpest interview signal: credible intervals are direct probability statements about where the parameter is; confidence intervals are long-run coverage guarantees that say nothing about any single computed interval.`,
  },
  {
    id: 'gaussian_processes',
    interactiveId: 'gaussian_process_viz',
    title: 'Gaussian Processes',
    subtitle: 'Distribution over functions, kernel selection, GP regression, sparse GPs, Bayesian optimisation',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['GP', 'gaussian process', 'kernel', 'Bayesian optimisation', 'inducing points', 'SVGP'],
    summary: `Regression gives you a point prediction. But how confident should you be?

A model that says "house price = $450,000" with no indication of uncertainty is only half useful — you can't act rationally on a prediction without knowing whether the model could just as plausibly have said $350,000 or $550,000. Gaussian Processes solve this by treating the unknown function itself as a random variable: instead of fitting parameters, you maintain a probability distribution over entire functions. The prior encodes smoothness assumptions via the kernel; observed data updates this into a posterior. The output is a mean prediction and a confidence interval at every point — including points far from the training data, where the interval correctly widens.

The cost is O(n³) compute and O(n²) memory for the matrix inversion at the core of the posterior update, which hits a hard wall around n = 10,000. Everything in the sparse GP literature exists to get around that wall.`,
    keyPoints: [
      `**A GP is fully specified by a mean function m(x) and a kernel k(x, x').** Any finite collection f(x₁), ..., f(xₙ) follows a multivariate Gaussian: f ~ N(m, K) where Kᵢⱼ = k(xᵢ, xⱼ). The kernel encodes structural beliefs about the function — its smoothness, length-scale, and periodicity. This is the prior over functions. A bad kernel is a bad prior: it doesn't just affect fit, it determines what shapes of function the GP can even consider.`,
      `**GP regression posterior: given noisy observations

$y = f(X) + ε, ε ~ N(0, σ²I), the posterior at new points X* is Gaussian with mean μ* = m(X*) + K(X*,X)[K(X,X)+σ²I]⁻¹(y-m(X)$

) and variance Σ* = K(X*,X*) - K(X*,X)[K(X,X)+σ²I]⁻¹K(X,X*).** The variance term is what other regression methods don't give you: it collapses near observed data (the model knows what it knows) and balloons in unexplored regions (the model knows what it doesn't know).`,
      `**Defaulting to RBF is the most common GP mistake.** RBF (squared exponential) is infinitely differentiable — it assumes the function is smoother than almost any real-world process. Sensor readings, financial returns, and experimental measurements are not infinitely differentiable. Matérn kernels control differentiability via ν: Matérn 3/2 (once differentiable) and 5/2 (twice differentiable) are almost always better defaults. The kernel is the most consequential modelling decision you make with a GP — it encodes what kinds of functions can explain the data.`,
      `**Hyperparameters (length-scale ℓ, signal variance σ², noise σ²_n) are learned by maximising the log marginal likelihood: log p(y|X,θ) = -½yᵀ(K+σ²I)⁻¹y - ½log|K+σ²I| - n/2 log(2π).** The first term rewards fit; the log-determinant penalises complexity — an overly flexible kernel can explain any data but pays a large penalty in the log-determinant term. This is automatic Occam's razor: the simplest kernel consistent with the data wins.`,
      `**O(n³) is the central engineering constraint.** Inverting the n×n kernel matrix costs O(n³) compute and O(n²) memory. For n > 10,000, this is simply infeasible on standard hardware. This single fact drives the entire sparse GP literature — every method there is a different strategy for approximating or avoiding that matrix inversion.`,
      `**Sparse GPs introduce m << n inducing points Z that summarise the training data.** SVGP (Stochastic Variational GP) places a variational distribution q(u) over inducing outputs u=f(Z) and optimises the ELBO with minibatch SGD — O(m³) per step regardless of n. With m=500 and minibatches, you can train on millions of points. The tradeoff: the inducing point approximation introduces bias — the posterior is not the true GP posterior, and predictive uncertainty may be underestimated between inducing points.`,
      `**Bayesian optimisation is where GPs earn their production keep.** Use a GP as a surrogate for an expensive black-box function (hyperparameter tuning, drug discovery, materials science). The GP posterior gives you a mean prediction and uncertainty at any candidate point. Acquisition functions use both to decide where to query next: Expected Improvement (EI) = E[max(0, f(x) - f(x+))]; UCB = μ(x) + κσ(x) where κ tunes the explore-exploit tradeoff. BO with a GP is orders of magnitude more sample-efficient than grid or random search for expensive evaluations.`,
      `**GPs belong in your toolkit for: small datasets (n < 10,000) where calibrated uncertainty is the core deliverable; Bayesian optimisation (the standard surrogate in tools like BoTorch and Ax); scientific regression where domain knowledge belongs in the kernel.** They don't belong in: high-dimensional unstructured inputs (images, raw text) where no meaningful kernel exists, or n > 100,000 without significant approximation infrastructure and the engineering budget to support it.`,
      `**Always normalise outputs to zero mean and unit variance before fitting a GP.** GPs are sensitive to output scale in ways that quietly break the model if you skip this: the noise variance and signal variance hyperparameters are optimised assuming a certain output scale, and wrong assumptions propagate through to miscalibrated uncertainty estimates.`,
    ],
    checkQuestions: [
      {
        q: `You have 50,000 training points and want to use a GP. What are your options and what do you trade away with each?`,
        options: [
          `A) SVGP with m inducing points trained via minibatch SGD at O(m³) per step, SKI for low-dimensional grid-structured inputs, or deep kernel networks for expressive feature learning — each trades away exact posterior accuracy for tractability.`,
          `B) Use an exact GP with float16 precision to halve memory usage, reducing the effective cost to O(n²) without any approximation error.`,
          `C) Switch to a random forest, since GPs are only defined for n < 1,000 and cannot be extended to larger datasets under any circumstances.`,
          `D) Use RBF kernel with automatic hyperparameter tuning; the O(n³) cost is manageable with modern GPUs for n = 50,000 in under an hour.`,
        ],
        answer: `A`,
      },
      {
        q: `Your GP Bayesian optimisation run converges prematurely — the acquisition function keeps suggesting the same region. What went wrong and how do you fix it?`,
        options: [
          `A) The kernel length-scale is too short, causing the GP to treat every new point as uncorrelated. Fix by increasing the length-scale via marginal likelihood optimisation.`,
          `B) Insufficient exploration: UCB κ is too small (over-exploiting), noise model is wrong causing posterior variance to not decrease, or length-scale is too large. Fix by increasing κ, checking learned hyperparameters, or using Thompson Sampling for diversity.`,
          `C) The ELBO has collapsed because the inducing points are too sparse. Add more inducing points and retrain from scratch.`,
          `D) Premature convergence is expected in GP BO and signals that the global optimum has been found; the correct response is to stop the run and report the best result found so far.`,
        ],
        answer: `B`,
      },
      {
        q: `How does the GP marginal likelihood objective perform automatic model selection, and what is its failure mode?`,
        options: [
          `A) It performs cross-validation by holding out 20% of data; failure mode is overfitting when the validation set is not representative.`,
          `B) It maximises the posterior over kernels using a Dirichlet prior; failure mode is when the prior over kernels is misspecified.`,
          `C) It maximises predictive accuracy on a held-out test set; failure mode is data leakage when test points are too close to training points.`,
          `D) The log marginal likelihood balances data fit against a log-determinant complexity penalty (automatic Occam's razor). Failure mode: multiple local optima in low-data regimes requiring random restarts, and hyperparameter estimates that may not reflect true function structure when n < 20.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `The O(n³) wall is the central engineering fact about GPs, and SVGP with inducing points is the standard workaround — but the tradeoff is that the variational approximation underestimates predictive uncertainty between inducing points. Kernel choice encodes the prior over functions: RBF assumes infinite differentiability (wrong for most real processes), Matérn 5/2 assumes twice-differentiability (usually correct), and a periodic kernel is required for any recurring pattern — the GP is only as good as the prior you encode in its kernel.`,
  },
  {
    id: 'variational_inference',
    interactiveId: 'variational_inference_viz',
    title: 'Variational Inference',
    subtitle: 'ELBO, KL divergence, mean field VI, CAVI, stochastic VI — when to use over MCMC',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['variational inference', 'ELBO', 'KL divergence', 'mean field', 'CAVI', 'stochastic VI'],
    summary: `Bayesian inference requires computing the posterior — the distribution over parameters given data. The denominator (marginal likelihood) requires integrating over all possible parameters, which is analytically intractable for anything beyond conjugate models. MCMC samples from the true posterior but is slow — you wait for chains to converge, which can take hours for complex models. Variational inference reframes inference as optimisation: find the distribution q(θ) from a tractable family that minimises KL divergence to the true posterior. This converts an integration problem into an optimisation problem you can solve with gradient descent and scale to millions of datapoints via minibatches.

The cost is that you only find the best approximation within your chosen family, so the true posterior shape may not be recoverable — and because VI minimises a mode-seeking KL, it systematically concentrates on one posterior mode and ignores the rest.`,
    keyPoints: [
      `**The ELBO (Evidence Lower Bound): log p(x) = ELBO(q) + KL[q(z) ‖ p(z|x)].** Since KL ≥ 0, ELBO ≤ log p(x) always. Maximising the ELBO is equivalent to minimising KL[q(z) ‖ p(z|x)]. Written out: ELBO = E_q[log p(x|z)] + E_q[log p(z)] - E_q[log q(z)] — reconstruction quality plus how close q is to the prior. This is why VAEs maximise a lower bound rather than the true likelihood: the true likelihood requires integrating over z, which is the integral we're trying to avoid.`,
      `**Mean field VI assumes q(z) = ∏ᵢ qᵢ(zᵢ) — each latent variable is independent in the approximate posterior.** Real posteriors almost always have correlations between latent variables. Mean field ignores all of them. The result: each marginal qᵢ can look correct individually while the joint approximation is completely wrong — a diagnostic you only catch by inspecting the joint samples, not the marginals.`,
      `**CAVI (Coordinate Ascent Variational Inference) updates each qᵢ(zᵢ) one at a time, holding all others fixed.** The optimal update is qᵢ*(zᵢ) ∝ exp(E_{-i}[log p(z,x)]). With conjugate priors, these updates have closed forms that look like EM. Without conjugacy, you need gradient-based VI via the reparameterisation trick — which is what makes VAEs trainable.`,
      `**Why VI underestimates uncertainty: VI minimises KL[q ‖ p] = E_q[log q - log p].** This penalises q for putting mass where p is small, but never penalises q for failing to cover regions where p is large. The result: q concentrates on one mode of a multimodal posterior and ignores the rest. The reverse KL[p ‖ q] is mass-covering — it would spread q across all modes — but it's computationally harder. The choice of forward KL is what makes VI tractable and also what makes it systematically overconfident.`,
      `**Stochastic VI scales CAVI to large datasets.** Standard CAVI sweeps all n points per update — O(n) per iteration. Stochastic VI uses minibatch ELBO gradient estimates with SGD/Adam, reducing cost to O(batch_size) per update. This is how VI runs on millions of examples — used in LDA at scale, SVGP, and the encoder-decoder training loop of VAEs. The price is noisier gradient estimates, but the variance is usually manageable with standard variance reduction.`,
      `**VI vs MCMC: MCMC is asymptotically exact — given infinite time, it converges to the true posterior.** VI is biased — it converges to the best approximation within the chosen family, not the true posterior. Use VI when n is large and approximate uncertainty is acceptable. Use MCMC when exact uncertainty is the actual deliverable — scientific inference, clinical decision support — and you can afford the runtime. The choice is not about which is "better" but about whether you need exact uncertainty or approximate uncertainty quickly.`,
      `**Amortised VI trains an inference network to predict q(z|x) directly from x, rather than running iterative CAVI per datapoint.** VAEs use this: the encoder outputs μ(x), σ(x) defining q(z|x) = N(μ(x), σ(x)²). Inference at test time is one forward pass. The cost is that the encoder is a single learned function shared across all datapoints — it trades per-datapoint accuracy for inference speed.`,
      `**The most common VI failure: the ELBO converges but posteriors are too narrow and predictions are overconfident, because Q is too restrictive for the true posterior.** A diagonal Gaussian mean field cannot represent correlated latent variables. If the ELBO at convergence is much lower than the log evidence from a short MCMC run, the variational gap is large — you need a richer family such as normalising flows or hierarchical VI.`,
    ],
    checkQuestions: [
      {
        q: `Explain why the ELBO is a lower bound on log p(x) and why maximising it is equivalent to minimising KL[q ‖ p(z|x)].`,
        options: [
          `A) The ELBO is a lower bound because log p(x) ≥ 0 by definition; maximising it tightens the bound from below until it reaches the true log-likelihood.`,
          `B) The ELBO lower-bounds log p(x) via the Cauchy-Schwarz inequality; maximising ELBO is equivalent to minimising the reverse KL[p(z|x) ‖ q], which spreads q across all posterior modes.`,
          `C) By Jensen's inequality (log is concave), log E_q[p(x,z)/q(z)] ≥ E_q[log p(x,z)/q(z)] = ELBO. The gap equals KL[q ‖ p(z|x)] ≥ 0, so maximising ELBO over q exactly minimises KL[q ‖ p(z|x)].`,
          `D) The ELBO lower-bounds log p(x) because it omits the reconstruction term; maximising it is equivalent to maximising the prior entropy of q.`,
        ],
        answer: `C`,
      },
      {
        q: `Your mean field VI model gives very tight posteriors (narrow q distributions) but makes poor predictions. What is likely happening and how do you diagnose it?`,
        options: [
          `A) VI has converged to a single posterior mode due to the mode-seeking forward KL. Diagnose by comparing ELBOs across random initialisations, running short MCMC chains for comparison, and checking posterior predictive sample diversity.`,
          `B) The learning rate is too high, causing the ELBO to oscillate rather than converge; reduce the learning rate and rerun.`,
          `C) The model is underfitting because the variational family is too expressive; switch to a simpler mean-field family with fewer parameters.`,
          `D) Tight posteriors always indicate correct convergence; poor predictions mean the likelihood function is misspecified and unrelated to VI.`,
        ],
        answer: `A`,
      },
      {
        q: `What is the difference between CAVI and black-box variational inference (BBVI), and when does each apply?`,
        options: [
          `A) CAVI uses stochastic gradients while BBVI uses exact gradients; CAVI is faster but requires GPU hardware while BBVI runs on CPU.`,
          `B) CAVI requires conjugate prior-likelihood pairs for closed-form coordinate updates; BBVI estimates ELBO gradients via Monte Carlo and applies to any differentiable model, using reparameterisation to reduce gradient variance.`,
          `C) CAVI and BBVI are equivalent algorithms with different names; the choice is purely stylistic.`,
          `D) BBVI requires conjugate priors while CAVI works for any model; CAVI is used in VAEs and BBVI in LDA.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `VI is biased by construction: it minimises KL[q ‖ p], which is mode-seeking, so it concentrates on one posterior mode and systematically underestimates uncertainty. Tight VI posteriors do not mean the true posterior is tight — they may mean VI found one mode and ignored the rest. The practical choice is: VI when scalability matters and approximate uncertainty is acceptable; MCMC when exact uncertainty is the deliverable and you can afford the runtime.`,
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

The result is a continuous, densely populated latent space where interpolation makes sense and unseen points decode coherently. The reparameterisation trick — writing

$z = μ + σ·ε where ε ~ N(0,I) — is what makes gradients flow$

through the sampling step. The central failure mode is posterior collapse: an expressive decoder learns to model p(x) without using z at all, the encoder degenerates to the prior, KL drops to zero, and you have trained a very expensive unconditional generator.`,
    keyPoints: [
      `**The generative model: p_θ(x,z) = p_θ(x|z)p(z) where p(z) = N(0,I).** The decoder p_θ(x|z) maps a latent code to a distribution over x. The problem is fitting this model: to learn θ via maximum likelihood you need p_θ(x) = ∫ p_θ(x|z)p(z)dz, which requires marginalising over all possible latent codes — intractable. VAEs avoid this by optimising a lower bound (the ELBO) instead.`,
      `**The encoder q_φ(z|x) = N(μ_φ(x), diag(σ_φ(x)²)) is a neural network mapping input x to the parameters of an approximate posterior over z.** This is amortised VI: rather than running a separate optimisation per input to find q(z|x), one encoder network handles all inputs at once. The cost is that the encoder is an approximation — it learns the best single function from inputs to posteriors, not the exact posterior for each input.`,
      `**VAE ELBO: L(θ,φ;x) = E_{q_φ(z|x)}[log p_θ(x|z)] - KL[q_φ(z|x) ‖ p(z)].** The reconstruction term rewards the decoder for explaining the data given latent codes sampled from the encoder. The KL term penalises the encoder for drifting from the prior N(0,I). For diagonal Gaussian q, the KL is closed form: -½ Σⱼ(1 + log σⱼ² - μⱼ² - σⱼ²) — so the only stochastic step that requires a gradient estimator is the expectation over q in the reconstruction term.`,
      `**The reparameterisation trick: you cannot backpropagate through z ~ N(μ, σ²) because the sampling step is stochastic and has no gradient.** Fix: write

$z = μ_φ(x) + σ_φ(x)⊙ε where ε ~ N(0,I). Now z is a deterministic func$

tion of the encoder parameters and a fixed noise draw. Gradients flow through μ and σ back to φ. Without this trick, VAE training requires high-variance REINFORCE-style gradient estimates — end-to-end training becomes impractical. The trick breaks down precisely when z is discrete (Bernoulli, categorical), where no differentiable reparameterisation exists.`,
      `**Posterior collapse is the central VAE failure mode.** When the decoder is sufficiently expressive (PixelCNN, autoregressive Transformer), it can model p(x) without using z at all. The encoder then learns q(z|x) ≈ N(0,I) — identical to the prior regardless of x. The KL term drops to near zero, reconstruction loss stays low, and training happily converges to a model where the latent space carries no information. Symptom: KL ≈ 0 after training. Cause: decoder power exceeds the bottleneck created by the KL penalty.`,
      `**Fixes for posterior collapse: KL annealing — start with β=0 (pure reconstruction), linearly ramp β to 1 over the first 30% of training.** This forces the decoder to first learn to use z before the KL regularisation becomes active. Free bits — floor the KL per latent dimension at δ bits, so the optimiser cannot collapse dimensions to zero without incurring a penalty. Both interventions make the decoder see informative z before it has a chance to learn to ignore z.`,
      `**β-VAE multiplies the KL term by β:

$L = E[log p(x|z)] - β·KL[q(z|x) ‖ p(z)]. β > 1 over-penalises KL, forcing the enco$

der to compress information into fewer, more independent latent dimensions — each dimension learns to control one factor of variation. β < 1 relaxes regularisation to combat posterior collapse.** The tradeoff is explicit: higher β gives better disentanglement and worse reconstruction quality. β = 1 is the standard VAE.`,
      `**Standard autoencoders have irregular latent spaces — interpolating between two encoded points often passes through low-density regions that decode into garbage.** VAE latent spaces avoid this because the KL regularisation forces encoder outputs to stay close to N(0,I), which is dense everywhere. Spherical interpolation between two VAE codes z₁ and z₂ produces semantically coherent intermediate samples because the path stays in the high-density region of the prior.`,
      `**Production uses for VAEs: anomaly detection (low ELBO = poor reconstruction or high KL → flag as out-of-distribution), data imputation (infer z from observed dimensions, decode to fill missing values), molecule generation (VAE latent spaces over molecular graphs enable gradient-based optimisation of chemical properties).** VAE outputs are blurrier than GAN or diffusion outputs — this is a direct mathematical consequence of optimising expected MSE under an approximate posterior, which averages over plausible reconstructions rather than sampling one.`,
    ],
    checkQuestions: [
      {
        q: `Explain why the reparameterisation trick is necessary, and describe a case where it cannot be applied.`,
        options: [
          `A) The trick is needed because autodiff frameworks cannot handle matrix operations inside expectations; it cannot be applied when the encoder outputs more than 512 dimensions.`,
          `B) The trick converts stochastic sampling into a deterministic function of fixed noise ε ~ p(ε), allowing gradients to flow through μ and σ to φ with low variance. It cannot be applied when z is discrete (Bernoulli, categorical) — Gumbel-Softmax is the workaround.`,
          `C) The trick avoids computing the KL divergence exactly; it cannot be applied when the prior p(z) is not a standard Gaussian.`,
          `D) The trick eliminates the reconstruction term from the ELBO for faster training; it cannot be applied in convolutional architectures.`,
        ],
        answer: `C`,
      },
      {
        q: `Your VAE's KL loss is near zero after 10 epochs. What is happening and how do you fix it?`,
        options: [
          `A) Near-zero KL is the intended behaviour in a well-trained VAE — it means the posterior is perfectly aligned with the prior, indicating successful training.`,
          `B) The encoder learning rate is too high, causing the KL term to diverge and then collapse. Reduce the encoder learning rate by a factor of 10.`,
          `C) The reconstruction loss weight is too large relative to KL. Set both to equal weight and retrain.`,
          `D) Posterior collapse: the decoder reconstructs x without using z, so the encoder outputs the prior regardless of input. Fix with KL annealing (start β=0, ramp to 1) or free bits (floor KL per dimension at λ ≈ 0.5).`,
        ],
        answer: `D`,
      },
      {
        q: `Why do VAE-generated images look blurry compared to GAN outputs, and is this fixable within the VAE framework?`,
        options: [
          `A) VAEs optimise expected MSE averaged over the posterior of z, which averages over plausible reconstructions and produces blurry outputs. Within the VAE framework, perceptual losses, VQ-VAE, or GAN discriminator terms reduce blurriness but the Gaussian decoder blurriness is not fully fixable without changing the loss.`,
          `B) VAEs use smaller network architectures than GANs, so blurriness is purely a capacity issue fixable by using deeper encoders and decoders.`,
          `C) GAN outputs appear sharper only because they memorise training images; VAE outputs are actually more realistic on unseen distributions.`,
          `D) VAE blurriness is caused by the KL regularisation term destroying high-frequency information; setting β = 0 removes blurriness completely.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Posterior collapse — KL → 0, encoder mapping every input to the prior, decoder ignoring z — is caused by expressive decoders that can model p(x) without information from z; KL annealing is the standard fix, because it forces the decoder to commit to using z before the KL penalty activates. VAE blurriness is a mathematical consequence: optimising expected MSE over the posterior averages over all plausible reconstructions, whereas GANs and diffusion models sample individual reconstructions. The reparameterisation trick is what makes VAE training tractable, and it breaks exactly when z is discrete — no differentiable reparameterisation exists for Bernoulli or categorical latents.`,
  },
  {
    id: 'approximate_inference',
    title: 'Approximate Inference Methods',
    subtitle: 'Laplace approximation, importance sampling, MCMC, HMC, diagnostics — when to use which',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['MCMC', 'HMC', 'Metropolis-Hastings', 'Laplace approximation', 'importance sampling', 'R-hat', 'ESS'],
    summary: `Outside of conjugate models, the posterior p(θ|X) is intractable — you cannot compute it, only approximate it. The question is how much approximation you can tolerate and at what computational cost. MAP (maximum a posteriori) is the fastest: find the mode and stop, discarding all information about posterior shape. Laplace adds one matrix inversion to recover a Gaussian approximation around the MAP — fast but wrong if the posterior is multimodal or heavy-tailed. MCMC is the gold standard: given enough time, it converges to the true posterior, but "enough time" is often hours or days for complex models. Most production ML systems use MAP with frequentist standard errors and reserve MCMC for settings where exact uncertainty is the product — clinical decision support, scientific inference, hierarchical models. Knowing when each method is appropriate, and critically how to diagnose whether MCMC has actually converged, is what separates theoretical understanding from practical competence.`,
    keyPoints: [
      `**Laplace approximation: find the MAP, compute the Hessian

$H = -∇²log p(θ|X) at that point, approximate the posterior as N(θ_MAP, H⁻¹).** No sampling — just one optimisation$

and one Hessian computation. When the posterior is genuinely unimodal and approximately Gaussian (which the Bernstein-von Mises theorem guarantees asymptotically), this is excellent. It fails badly for multimodal posteriors because the Hessian only captures local curvature at one mode — if the posterior has mass elsewhere, the Laplace approximation misses it entirely.`,
      `**Importance sampling estimates E_p[f(θ)] using a proposal q: E_p[f(θ)] ≈ Σᵢ wᵢ f(θᵢ) where wᵢ ∝ p(θᵢ|X)/q(θᵢ).** The effective sample size

$ESS ≈ (Σwᵢ)²/Σwᵢ² tells you how many i.i.d. samples the w$

eighted set is worth. In high dimensions, IS collapses catastrophically: the typical sets of p and q have negligible overlap, almost all weights are near zero, and a few lucky samples dominate the estimate. ESS < 5% of N means the IS estimate is unreliable regardless of sample count.`,
      `**Metropolis-Hastings: propose θ* ~ q(θ*|θ_current), accept with probability α = min(1, p(θ*|X)q(θ_current|θ*) / p(θ_current|X)q(θ*|θ_current)).** The intractable normaliser p(X) cancels in the ratio p(θ*|X)/p(θ_current|X) = p(X|θ*)p(θ*) / p(X|θ)p(θ) — this is the key insight that makes MCMC work at all for unnormalised posteriors. You never need to compute p(X); you only need ratios.`,
      `**HMC augments the state with momentum and uses gradient information to make large, correlated proposals that are accepted at high rates.** Random-walk MH explores via small random steps — inefficient in high dimensions because it takes many steps to traverse the posterior. HMC uses the gradient of log p(θ|X) to simulate Hamiltonian dynamics, enabling large steps that respect the posterior geometry. NUTS (No-U-Turn Sampler) adapts step size and trajectory length automatically and is the default in Stan and PyMC.`,
      `**MCMC diagnostics are non-negotiable.** R-hat (Gelman-Rubin): run K independent chains from different starting points. R-hat = √(total variance / within-chain variance). R-hat < 1.01 → chains have converged to the same distribution. R-hat > 1.1 → chains are exploring different regions; you do not yet have samples from the posterior. ESS accounts for within-chain autocorrelation: ESS < 100 per parameter means high Monte Carlo error. Trace plots should look like a "hairy caterpillar" — no trends, no sticking, all chains overlapping.`,
      `**HMC divergences are a hard stop, not a warning.** A divergence means the leapfrog integrator encountered extreme posterior curvature and went numerically unstable. Any divergences mean the posterior geometry is pathological and posterior estimates are biased. Non-centred reparameterisation fixes the most common cause. Never report results from a sampler with divergences.`,
      `**Non-centred parameterisation is the most important practical HMC fix for hierarchical models.** Centred: μ_i ~ N(μ, σ²) directly — when σ is small, the posterior forms a funnel: narrow at the tip (small μ_i variations) and wide at the top. HMC's step size must be tiny to navigate the narrow funnel tip, causing slow mixing everywhere else. Non-centred: write μ_i = μ + σ·z_i where z_i ~ N(0,1), sample z_i instead. The funnel geometry disappears. If you see divergences in a hierarchical model, this is the first thing to try.`,
      `**Method selection guide: MAP + frequentist CIs for production systems that need speed and scale.** Laplace for post-MAP uncertainty estimates where full MCMC is too slow (last-layer BNNs). NUTS/HMC in Stan or PyMC for serious scientific Bayesian analysis with < ~1M parameters. VI (CAVI, BBVI) for large-scale latent variable models where sampling is too slow. Deep ensembles + conformal prediction for large neural networks where full Bayes is infeasible. The choice is about what you need from uncertainty: a fast approximation or an exact distribution.`,
    ],
    checkQuestions: [
      {
        q: `You run 4 MCMC chains with NUTS. After 2000 samples per chain, R-hat = 1.35 for a key parameter. What do you do?`,
        options: [
          `A) Accept the result — R-hat = 1.35 is within the commonly cited threshold of R-hat < 2.0, and 2000 samples per chain is generally sufficient for most models.`,
          `B) Discard all samples and rerun with a different likelihood family, since R-hat > 1.2 always indicates model misspecification.`,
          `C) Thin the chains to reduce autocorrelation — keeping every 10th sample will bring R-hat below 1.01.`,
          `D) Chains have not converged (R-hat >> 1.01). Examine trace plots for systematic differences, check for HMC divergences indicating funnel geometry, run chains much longer (10,000+ samples), and verify model identifiability. Never report results with R-hat > 1.01.`,
        ],
        answer: `D`,
      },
      {
        q: `Why does importance sampling fail in high dimensions, and what is the effective sample size telling you?`,
        options: [
          `A) IS fails in high dimensions because the proposal distribution q must be specified analytically, which becomes impossible when the parameter space exceeds 20 dimensions.`,
          `B) In high dimensions the typical sets of p and q have exponentially shrinking overlap, so almost all weights are near zero. ESS = (Σwᵢ)²/Σwᵢ² tells you how many i.i.d. samples the weighted set is worth — ESS = 10 out of 10,000 means only 10 samples drive the estimate.`,
          `C) IS fails because the acceptance rate drops below 1% in high dimensions, making it equivalent to rejection sampling which is known to be inefficient.`,
          `D) IS fails because the normalising constant p(X) cannot be computed exactly in more than 10 dimensions, making the weights undefined.`,
        ],
        answer: `B`,
      },
      {
        q: `What is the Bernstein-von Mises theorem and when does it break down?`,
        options: [
          `A) BvM states that with sufficient data the posterior converges to a Gaussian centred at the MLE with covariance equal to the inverse Fisher information. It breaks down for non-regular models, high-dimensional settings where d/n → c > 0, misspecified models, and nonparametric posteriors.`,
          `B) BvM states that MAP always equals MLE in large samples; it breaks down when the prior is informative.`,
          `C) BvM states that the posterior predictive converges to the empirical distribution; it breaks down when the model is parametric rather than nonparametric.`,
          `D) BvM states that all Bayesian credible intervals are asymptotically equivalent to bootstrap intervals; it breaks down when bootstrapping is computationally infeasible.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `R-hat > 1.01 means the chains are not sampling from the same distribution — the samples are not from the posterior. This is not a warning to note; it means you do not have valid posterior samples. Non-centred reparameterisation for hierarchical models eliminates the funnel geometry that causes divergences by changing μ_i ~ N(μ, σ²) to μ_i = μ + σ·z_i, z_i ~ N(0,1). The Metropolis-Hastings ratio cancels p(X) — this is the key insight that makes MCMC possible for unnormalised posteriors, because you only ever need the ratio of densities, not the densities themselves.`,
  },
  {
    id: 'bayesian_neural_networks',
    title: 'Bayesian Neural Networks & Uncertainty Quantification',
    subtitle: 'Weight distributions, aleatoric vs epistemic uncertainty, dropout VI, last-layer Laplace, deep ensembles, conformal prediction',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['BNN', 'uncertainty', 'epistemic', 'aleatoric', 'deep ensembles', 'conformal prediction', 'dropout VI'],
    summary: `Standard neural networks output a prediction with no honest signal about confidence. A network that outputs 95% probability on every prediction — whether it has seen thousands of similar examples or none at all — is not expressing uncertainty, it is suppressing it. Bayesian Neural Networks address this by placing distributions over weights rather than point estimates, splitting predictive uncertainty into two types: irreducible noise in the data (aleatoric) and uncertainty from insufficient data coverage (epistemic).

In practice, full BNNs are infeasible at any useful scale. The empirical punchline is that deep ensembles — train several models from different random seeds — consistently beat most principled Bayesian approximations on calibration benchmarks. The reason is not Bayesian coverage; ensembles explore different loss basins and get function-space diversity that MC Dropout and most VI methods miss. Conformal prediction takes a completely different route: rigorous coverage guarantees with no Bayesian machinery at all.`,
    keyPoints: [
      `**Aleatoric uncertainty is irreducible noise in the data itself.** Infinite training data will not remove it. A blurry medical image has inherent label ambiguity regardless of training set size — the image does not contain enough information to determine the label with certainty. Model it explicitly: predict σ_θ(x) alongside μ_θ(x) so p(y|x,θ) = N(μ_θ(x), σ_θ(x)²). The network outputs the prediction and the noise level. Regions with consistently high σ_θ(x) after training signal inherent data ambiguity.`,
      `**Epistemic uncertainty comes from not having enough data in a region — it is reducible by collecting more data of that type.** A well-calibrated model should be uncertain on out-of-distribution inputs and confident on in-distribution inputs. In a BNN, epistemic uncertainty = variance of E[y|x,θ] over the posterior p(θ|data). The operational use: high epistemic uncertainty in a specific region tells you exactly what data to collect next to reduce model uncertainty there.`,
      `**MC Dropout leaves dropout active at test time, runs T forward passes with different random dropout masks, and uses their variance as uncertainty.** Zero architecture changes are required — this is why it is the most widely deployed BNN approximation. Formally it is equivalent to approximate VI in a specific deep GP model, but the formal correspondence requires dropout rates that practitioners rarely use. It works well enough as a heuristic despite the theoretical mismatch.`,
      `**Last-layer Laplace approximation: train to MAP, then fit a Gaussian posterior only on the last-layer weights W_last ~ N(W̃, H_last⁻¹).** The Hessian is only d_last × d_last — feasible even for large networks where the full Hessian is prohibitive. Everything else stays as a point estimate. Strong practical baseline: reuses pretrained weights, no training changes, adds only a post-hoc Hessian computation. Calibrates well for classification. Fails for models where the feature extractor (not the last layer) is the source of uncertainty.`,
      `**Deep ensembles: train M independent networks from different random seeds.** Predictive distribution = mixture of their M softmax outputs. Uncertainty = disagreement among ensemble members. Empirically dominates MC Dropout, last-layer Laplace, and most VI methods on calibration benchmarks. The cost is honest: M × training time and M × inference cost. There is no free lunch — ensembles are better because they are more expensive.`,
      `**Why ensembles outperform most Bayesian approximations: deep network loss landscapes are highly multimodal.** Different random seeds converge to different loss basins, each corresponding to a functionally different solution. MC Dropout and VI both approximate a distribution localised around one basin. Ensembles explicitly sample different basins and get genuine function-space diversity. Their empirical advantage is loss-basin diversity, not Bayesian posterior coverage.`,
      `**Temperature scaling: after training, find scalar T on a held-out validation set by minimising NLL with scaled logits σ(f(x)/T).** T > 1 softens predictions, T < 1 sharpens them. Accuracy is unchanged — argmax is invariant to positive scaling. One parameter, zero retraining, dramatically reduces ECE for the systematic overconfidence that cross-entropy training induces. This is mandatory before deploying any neural network classifier for probabilistic use.`,
      `**Conformal prediction provides a formal coverage guarantee with no distributional assumptions on the model.** Compute nonconformity scores on a calibration set. Prediction set for a new x*: C(x*) = {y : score(x*,y) ≤ quantile_{1-α}(calibration scores)}. Guarantee: P(y* ∈ C(x*)) ≥ 1-α under exchangeability. The prediction set widens when the model is uncertain and shrinks when confident. It is the only uncertainty method with a formal coverage guarantee — all other methods are heuristic.`,
      `**OOD detection separates good uncertainty methods from bad ones.** Neural networks are notoriously overconfident on OOD inputs — high softmax probability for inputs that look nothing like the training distribution. Deep ensembles produce better OOD uncertainty than single-model methods because disagreement among ensemble members is high for novel inputs. Conformal prediction is the only method with a formal guarantee: if the test input comes from the same distribution as the calibration set, coverage is guaranteed.`,
    ],
    checkQuestions: [
      {
        q: `A model predicts 90% probability that a tumour is benign. Is this aleatoric or epistemic uncertainty, and how would you tell the difference?`,
        options: [
          `A) Aleatoric if the uncertainty persists with more similar training data; epistemic if more data reduces it. Use BNN/ensemble disagreement to separate the two: epistemic shows as high weight-posterior variance, aleatoric as high likelihood variance p(y|x,θ) for any given θ.`,
          `B) It is always aleatoric because medical imaging uncertainty is inherent in the imaging modality and cannot be reduced by collecting more training data.`,
          `C) It is always epistemic because neural network outputs reflect only training data coverage, not intrinsic label ambiguity.`,
          `D) The distinction is irrelevant in practice; both types are handled identically by temperature scaling before deployment.`,
        ],
        answer: `A`,
      },
      {
        q: `You need uncertainty estimates for a 100M-parameter production model. MC Dropout adds 100ms per call (20 forward passes). What alternatives exist?`,
        options: [
          `A) Increase dropout rate to 0.9 — higher dropout reduces the number of passes needed from 20 to 2, cutting latency to 10ms with the same uncertainty quality.`,
          `B) There are no practical alternatives; MC Dropout is the only method that works for models above 10M parameters.`,
          `C) Last-layer Laplace (one forward pass + small matrix-vector product), single-pass deterministic methods (SNGP, DUQ), conformal prediction with zero inference overhead, ensemble distillation, or asynchronous uncertainty computation for monitoring use-cases.`,
          `D) Switch to a smaller 10M-parameter model — uncertainty quality is proportional to model size, so a smaller model gives better-calibrated uncertainty faster.`,
        ],
        answer: `C`,
      },
      {
        q: `What guarantee does conformal prediction provide, and what assumption can violate it?`,
        options: [
          `A) Conformal prediction guarantees the prediction set always contains exactly one correct label, assuming the model achieves > 80% accuracy on calibration data.`,
          `B) Conformal prediction guarantees P(y* ∈ C(x*)) ≥ 1-α under exchangeability. This guarantee fails under distribution shift (test distribution differs from calibration), temporal non-stationarity, or selective prediction that breaks exchangeability.`,
          `C) Conformal prediction guarantees conditional coverage P(y* ∈ C(x*)|x*) ≥ 1-α for every specific x*; the assumption violated is model calibration.`,
          `D) Conformal prediction guarantees the prediction set has minimal size; the assumption violated is that the model must be a neural network.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Deep ensembles consistently outperform MC Dropout and most VI-based BNN approximations on calibration benchmarks, and their advantage is function-space diversity from different loss basins — not Bayesian posterior coverage. The aleatoric/epistemic distinction has a concrete operational meaning: aleatoric uncertainty cannot be reduced by collecting more data, while epistemic uncertainty is a direct signal of where more data will improve the model. Conformal prediction is the only method with a formal marginal coverage guarantee under exchangeability — everything else is heuristic.`,
  },
  {
    id: 'calibration',
    title: 'Probabilistic Calibration',
    subtitle: 'Reliability diagrams, ECE, overconfidence in NNs, temperature scaling, Platt scaling, isotonic regression',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['calibration', 'ECE', 'temperature scaling', 'Platt scaling', 'reliability diagram', 'overconfidence'],
    summary: `A model with 92% accuracy can be making systematically wrong decisions. When your fraud model outputs 0.8 and the threshold is 0.7, you block the transaction — but if that 0.8 actually corresponds to only 60% true fraud risk, your block rate is calibrated to the wrong threshold and you are blocking more than you should. Calibration is the question: when your model says 70%, does it actually get it right 70% of the time? Modern neural networks are documented to be systematically overconfident (Guo et al., 2017) — cross-entropy training pushes logits toward one-hot distributions, and larger models are worse, not better. Raw softmax outputs should never be used as probabilities in production without calibration. The good news: temperature scaling fixes most of it in five lines of code, does not change accuracy at all, and requires only one parameter fit on a held-out set.`,
    keyPoints: [
      `**Calibration: p(Y=1 | f(X)=p) = p for all p ∈ [0,1].** Among all predictions where the model outputs probability p, exactly fraction p of the true labels should be 1. A model that says 80% for every example and is correct 80% of the time is perfectly calibrated — but useless for ranking. Calibration measures whether confidences are accurate statements of accuracy, not whether the model ranks correctly.`,
      `**The reliability diagram is the first calibration diagnostic.** Bin predictions into 10 equal-width intervals. For each bin, plot mean predicted confidence vs. observed accuracy. Perfect calibration is the diagonal y=x. Overconfident models fall below the diagonal — they claim higher confidence than accuracy warrants. The shape tells you whether to use temperature scaling (uniform global shift) or something more flexible (asymmetric or bin-specific miscalibration).`,
      `**Neural networks are systematically overconfident because cross-entropy loss is minimised as logits grow large — the optimiser has no incentive to stop pushing logits toward infinity once the training labels are correctly ranked.** Larger and deeper models are more overconfident, not less. Guo et al. (2017) documented this across ResNets and DenseNets. ECE for uncalibrated networks typically sits at 5-15%. Assume overconfidence by default.`,
      `**ECE = Σₘ |Bₘ|/n · |acc(Bₘ) - conf(Bₘ)|: weighted average of |accuracy - confidence| across bins.** Well-tuned temperature-scaled networks hit ECE ≈ 1-3%. Adaptive bins (equal samples per bin) are more reliable than equal-width bins, which can be dominated by nearly empty extreme bins. Always report MCE (Maximum Calibration Error) alongside ECE to capture worst-case gaps at specific confidence levels.`,
      `**Temperature scaling: fit scalar T on a held-out validation set by minimising NLL of softmax(f(x)/T).** T > 1 softens predictions, T < 1 sharpens. Accuracy is unchanged — argmax of softmax(f/T) = argmax of f. One parameter, zero retraining risk. This is the default post-training step before deploying any neural network classifier for probabilistic use. Apply it before checking if more complex methods are needed.`,
      `**Platt scaling: fit sigmoid(af(x) + b) on a held-out calibration set.** Two parameters can fix asymmetric miscalibration that temperature scaling cannot — when over/underconfidence differs across the probability range. Originally developed for SVMs. Use Platt scaling when temperature scaling leaves a residual pattern in the reliability diagram. Risk of overfitting on small calibration sets.`,
      `**Isotonic regression: fit a non-parametric monotone function from predicted probabilities to observed frequencies.** Most flexible calibration method — can correct any shape of systematic miscalibration. Overfits aggressively on small calibration sets. Reserve for when you have > 10,000 calibration samples and temperature scaling is insufficient.`,
      `**Why miscalibration matters in production: a fraud score of 0.8 that corresponds to 60% true risk leads to systematic under-blocking at a threshold of 0.7.** A sepsis model saying 90% when the true rate is 60% changes treatment decisions. If the output probability feeds downstream as a feature, miscalibration propagates through the pipeline. Threshold-based decisions require accurate probabilities at that threshold — ECE averaged across bins will not tell you whether you are miscalibrated at your specific decision boundary.`,
      `**Calibration and discrimination are orthogonal.** A model that always predicts the base rate is perfectly calibrated but useless. Calibration is necessary but not sufficient. The Brier

$score = (1/n)Σ(pᵢ - yᵢ)² decomposes into calibration + refinemen$

t, jointly penalising both. Use AUC/AP for discrimination, ECE for calibration, and Brier score as a joint summary.`,
    ],
    checkQuestions: [
      {
        q: `Your model has 92% accuracy but ECE = 12%. What does this mean, and what would you do?`,
        options: [
          `A) ECE = 12% means the model has 12% label noise in the training set; retrain with a cleaner dataset.`,
          `B) High accuracy with high ECE means the model ranks correctly but predicted probabilities are inaccurate — likely overconfident by ~12 percentage points per bin. Apply temperature scaling, inspect the reliability diagram, and verify post-calibration ECE on the test set.`,
          `C) ECE = 12% is acceptable for a model with 92% accuracy since calibration degrades proportionally with accuracy gains.`,
          `D) High ECE with high accuracy means the model is underconfident; apply Platt scaling with a < 1 to sharpen predictions.`,
        ],
        answer: `D`,
      },
      {
        q: `You need to compare two models for a medical triage application. Model A has AUC=0.88, ECE=0.03. Model B has AUC=0.91, ECE=0.11. Which do you deploy?`,
        options: [
          `A) For triage using probability thresholds, calibration is critical. Try to recalibrate Model B first — if temperature scaling brings its ECE to ~0.03 without losing AUC, deploy B. Otherwise, prefer Model A whose stated probabilities are reliable at the decision boundary.`,
          `B) Always deploy the higher-AUC model (B) in medical settings — ranking quality is the only metric that matters for triage prioritisation.`,
          `C) Neither model is deployable; medical applications require ECE < 0.01 and AUC > 0.95 by regulatory standards.`,
          `D) Deploy Model A only — ECE is always more important than AUC in any medical application regardless of how the model output is used.`,
        ],
        answer: `A`,
      },
      {
        q: `Why does standard cross-entropy training produce overconfident neural networks, and does label smoothing fix it?`,
        options: [
          `A) Cross-entropy is minimised as softmax outputs approach one-hot, pushing logits to large values. Label smoothing (soft targets) penalises overconfident outputs and improves calibration, but it also distorts penultimate-layer representations; temperature scaling post-training is still recommended.`,
          `B) Cross-entropy training is not the cause of overconfidence — the real cause is batch normalisation, which should be replaced with layer normalisation.`,
          `C) Label smoothing fully fixes overconfidence and eliminates the need for any post-hoc calibration method.`,
          `D) Cross-entropy training produces underconfidence, not overconfidence; label smoothing corrects this by sharpening the logits.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Temperature scaling cannot hurt accuracy (argmax is unchanged) and fixes most of the systematic overconfidence that cross-entropy training induces — it is the mandatory post-training step before using a neural classifier for probabilistic decisions. The AUC vs ECE tradeoff is the calibration insight that matters most: AUC measures ranking quality, ECE measures whether probabilities are accurate at the threshold you actually use for decisions. A model with high AUC but poor calibration is systematically mispricing risk at every decision boundary.`,
  },
  {
    id: 'information_geometry',
    title: 'Information Geometry & Natural Gradient',
    subtitle: 'Fisher information matrix, statistical manifold, natural gradient descent, K-FAC, connection to Adam',
    difficulty: 'advanced',
    estimatedMin: 75,
    tags: ['Fisher information', 'natural gradient', 'information geometry', 'K-FAC', 'Riemannian metric', 'Adam'],
    summary: `Standard gradient descent treats all parameter directions as equally meaningful. But two parameters that differ by the same Euclidean distance in parameter space may correspond to distributions that are almost identical or drastically different — the Euclidean metric ignores how sensitive the model's outputs are to perturbations in each direction. This produces the ravine problem: gradient descent zigzags across high-curvature directions while inching along low-curvature directions, wasting steps. Information geometry gives the right metric: the space of probability distributions is a Riemannian manifold where distances are measured by the Fisher information matrix (FIM), which quantifies how much the output distribution changes per unit perturbation of parameters. Natural gradient descent premultiplies the gradient by the inverse FIM, taking steps that are equal-sized in distribution space.

The result is faster convergence per step. The catch: computing and inverting the full FIM is O(p²) in storage and O(p³) in compute — prohibitive at any useful scale. Adam's per-parameter learning rate scaling is a diagonal FIM approximation, which explains both why Adam works and why it fails when parameters are highly correlated.`,
    keyPoints: [
      `**The Fisher information matrix:

$F = E_{x~p_θ}[∇_θ log p(x|θ) ∇_θ log p(x|θ)ᵀ].** The FIM measures how much the outpu$

t distribution changes when θ is perturbed: KL[p_θ ‖ p_{θ+δ}] ≈ ½ δᵀFδ locally. So the FIM is the curvature of the KL divergence landscape — the metric tensor for distribution space. Flat directions in F (zero eigenvalues) are parameter directions that do not change the output distribution at all — overparameterisation, symmetries, dead neurons.`,
      `**Standard gradient descent is not covariant under reparameterisation: if you apply a bijective transformation φ = h(θ), the gradient direction in φ-space is different from the gradient direction in θ-space (after accounting for the Jacobian).** This means the solution gradient descent finds depends on how you chose to parameterise the model — different implementations of the same model (batch norm vs weight normalisation) converge to different solutions. Natural gradient is covariant: the update corresponds to the same distribution-space step regardless of parameterisation.`,
      `**Natural gradient update: θ_{t+1} = θ_t - η F(θ_t)⁻¹ ∇_θ L.** In a loss landscape with a ravine (high curvature in one direction, low in another), standard SGD zigzags — large steps in the steep direction oscillate, small steps in the shallow direction barely move. Natural gradient rescales: small steps in the steep direction, large steps in the shallow direction. Per distribution-space step, you get more loss reduction than any Euclidean-metric gradient step.`,
      `**FIM = second derivative of KL: KL[p_θ ‖ p_{θ+δ}] ≈ ½δᵀFδ.** This is the operational definition that connects information geometry to practical optimisation. Directions with large Fisher eigenvalues change the model's output distribution a lot per unit parameter change — natural gradient takes small steps there. Directions with small eigenvalues change the distribution very little — natural gradient takes large steps there. Euclidean gradient ignores all of this.`,
      `**K-FAC (Kronecker-Factored Approximate Curvature) makes natural gradient tractable for neural networks.** For a layer with weight matrix W, the FIM admits a Kronecker product approximation

$F ≈ A ⊗ G where A = E[aₜaₜᵀ] (input activation covariance) and G = E[gₜgₜᵀ] (output gradient covariance). Storage$

drops from O(p²) to O(d_in² + d_out²) per layer. Inversion is separable: (A⊗G)⁻¹ = A⁻¹⊗G⁻¹. K-FAC captures within-layer input-output correlations — the structure that Adam's diagonal approximation misses.`,
      `**Adam is a diagonal FIM approximation.** The second moment

$v_t ≈ diag(F) estimates only the diagonal of the Fisher. Dividing the gradient by √v_t + ε approximates rescaling by the di$

agonal Fisher — each parameter gets an independent learning rate based on its gradient variance. This works well when parameters are approximately uncorrelated. When parameters are highly correlated (collinear features, attention across similar tokens), the off-diagonal terms of F matter and Adam's approximation fails.`,
      `**K-FAC vs Adam: Adam is the practical choice for most deep learning because K-FAC's per-step cost is much higher.** K-FAC wins when data is small, per-step compute is affordable, and the correlations between parameters are strong — some supervised learning benchmarks and RL settings. The convergence advantage is real: K-FAC typically converges in fewer steps, but each step costs more than Adam.`,
      `**TRPO and PPO formalise the natural gradient idea in RL.** TRPO explicitly constrains KL[π_old ‖ π_new] ≤ δ at each update — this is a trust region in distribution space, exactly what natural gradient descent respects. Euclidean constraints on weight updates do not prevent large changes in the policy distribution. KL constraints do — and large distribution changes destabilise RL training. PPO approximates the KL constraint with a clipped surrogate, trading theoretical precision for engineering simplicity.`,
      `**The FIM connects to confidence intervals in MLE.** By the Cramér-Rao bound, Var(θ̂) ≥ F(θ)⁻¹ for any unbiased estimator. The MLE achieves this bound asymptotically. The inverse FIM is the asymptotic covariance of the MLE — this is where frequentist confidence intervals for point estimates come from. In continual learning, Elastic Weight Consolidation (EWC) penalises changes to parameters with high Fisher information, preserving knowledge from previous tasks by anchoring the highest-curvature directions.`,
    ],
    checkQuestions: [
      {
        q: `Why is the natural gradient invariant to reparameterisation of the model parameters, and why does this matter?`,
        options: [
          `A) Natural gradient is invariant because the FIM is always the identity matrix under any reparameterisation, making F⁻¹∇L equal to ∇L regardless of parameterisation.`,
          `B) Natural gradient is invariant because it uses second-order information; standard gradient uses only first-order information which changes under reparameterisation.`,
          `C) Natural gradient is invariant because the step size η is adapted per-parameter; different parameterisations just require rescaling η.`,
          `D) The FIM transforms as a covariant tensor (F_φ = J⁻ᵀF_θJ⁻¹), so F_φ⁻¹∇_φL maps to the same distribution-space step regardless of parameterisation. This matters because standard SGD finds different optima depending on model parameterisation (e.g., batch norm vs weight normalisation).`,
        ],
        answer: `D`,
      },
      {
        q: `Adam's second moment estimate v_t ≈ diag(F). What does this mean for Adam's performance on highly correlated parameters?`,
        options: [
          `A) Adam performs better on correlated parameters because the moving average of v_t smooths out the correlations over time, effectively approximating the off-diagonal FIM terms.`,
          `B) Adam performs identically on correlated and uncorrelated parameters because the diagonal FIM approximation is provably tight when the learning rate is small enough.`,
          `C) Adam's diagonal FIM approximation ignores off-diagonal correlations, leading to suboptimal steps in correlated directions. K-FAC captures within-layer input-output correlations and converges in fewer steps on tasks with highly correlated parameters, at higher per-step cost.`,
          `D) Adam applies a full FIM inverse internally via the Adam epsilon term; the diagonal approximation is only used for numerical stability, not for the step direction.`,
        ],
        answer: `C`,
      },
      {
        q: `What is the connection between the Fisher information matrix and confidence intervals in maximum likelihood estimation?`,
        options: [
          `A) By the Cramér-Rao bound, Var(θ̂) ≥ F(θ)⁻¹ for any unbiased estimator; the MLE achieves this asymptotically. The inverse FIM is the asymptotic covariance of the MLE, which is where frequentist confidence intervals and EWC's importance weights come from.`,
          `B) The FIM equals the Hessian of the log-likelihood only at the MLE; elsewhere they are unrelated, so confidence intervals must use the Hessian, not the FIM.`,
          `C) The FIM provides confidence intervals only for exponential family models; for other likelihoods, bootstrap confidence intervals must be used instead.`,
          `D) The connection is purely theoretical; in practice, confidence intervals are computed from the Jacobian of the loss function, not the FIM.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Parameter space is the wrong space to measure gradient steps — what matters is how much the model's output distribution changes per step, which is measured by the FIM. Adam's diagonal FIM approximation works when parameters are uncorrelated but fails when off-diagonal Fisher terms are large. The TRPO/PPO connection is the most concrete production application: constraining updates by KL[π_old ‖ π_new] instead of Euclidean weight change is what stabilises RL training, because Euclidean constraints on weights do not bound how much the policy distribution changes.`,
  },
  {
    id: 'probabilistic_graphical_models',
    title: 'Probabilistic Graphical Models',
    subtitle: 'Bayesian networks, MRFs, d-separation, factor graphs, belief propagation, HMMs',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['PGM', 'Bayesian network', 'MRF', 'd-separation', 'belief propagation', 'HMM', 'factor graph'],
    summary: `High-dimensional joint distributions are intractable to work with directly — storing and computing over p(X₁,...,Xₙ) is exponential in n.

The key observation is that most real-world variables are not all directly dependent on each other. PGMs formalise this: encode which variables are independent of which using a graph structure, then factorise the joint into local potentials over connected subsets. Inference becomes a local message-passing operation over the graph rather than a global computation over the full joint. Bayesian networks use directed edges to encode generative causal stories; Markov Random Fields use undirected edges to encode symmetric correlations. PGMs largely ceded perception tasks to deep learning after 2012, but remain the right tool when conditional independence structure must be explicitly represented, audited, and explained — medical diagnosis networks, causal models, structured prediction with hard output constraints.`,
    keyPoints: [
      `**Bayesian network: a DAG where each node Xᵢ has parents Pa(Xᵢ).** The joint factorises as p(X₁,...,Xₙ) = Πᵢ p(Xᵢ | Pa(Xᵢ)). Every missing edge is a conditional independence assumption. The structure of the DAG is the entire modelling decision — it encodes your beliefs about the causal generating process. A fully connected DAG encodes no independence assumptions and offers no tractability benefit over the full joint.`,
      `**Markov Random Field (MRF): undirected graph, joint factorises over cliques: p(X) = (1/Z) Πc ψc(Xc).** The partition function Z = Σ_X Πc ψc(Xc) sums over all configurations — typically intractable. This is the central computational problem for MRFs: you can write down the unnormalised joint, but normalising it requires the sum you are trying to avoid. MRFs encode symmetric correlations: image segmentation (neighbouring pixels tend to share labels), spatial statistics, Ising models.`,
      `**d-separation is the fundamental tool for reading conditional independence from a Bayesian network.** X and Y are d-separated given Z if Z blocks all paths between them. Chains (X → m → Y) and forks (X ← m → Y) are blocked when m ∈ Z. Colliders (X → m ← Y) are blocked when m ∉ Z and no descendant of m is in Z. The collider rule is the surprising one: conditioning on a collider opens the path, creating a dependence that did not exist marginally. This is Berkson's paradox — the mechanism behind selection bias.`,
      `**Belief propagation (sum-product) on trees: messages pass between variable and factor nodes.** After 2|E| message passes, every node's marginal is exact — you get p(Xᵢ) for every variable by multiplying incoming messages. On loopy graphs, the same algorithm (loopy BP) is an approximation that may not converge, but works well in practice for error-correcting codes and image segmentation. Tree structure is what makes BP exact; loops require approximation.`,
      `**HMM is a chain-structured Bayesian network.** Hidden Markov chain s₁,...,sT with transition p(sₜ|sₜ₋₁). Observations xₜ ~ p(xₜ|sₜ). Forward-backward algorithm (BP on the chain): O(T·K²) to compute all marginals p(sₜ|x₁,...,xT). Viterbi (max-product): most likely state sequence. Baum-Welch (EM for HMMs): parameter learning. These three algorithms form the complete HMM toolkit — and each one is just belief propagation in a different form.`,
      `**Exact inference in general Bayesian networks is #P-hard.** The junction tree algorithm handles tractable cases: moralise the DAG → triangulate → build a junction tree → run BP on the tree. Complexity is O(K^{treewidth+1} × n) where K is the state space size. Treewidth ≤ ~20 is usually feasible; most real-world networks have higher treewidth, making exact inference impossible and forcing approximations (loopy BP, VI, MCMC).`,
      `**Why PGMs lost perception tasks to deep learning after 2012: feature engineering burden (variables and structure had to be hand-specified), inference costs exponential in treewidth, and poor scalability compared to GPU-friendly neural networks.** Why PGMs remain in use: auditable conditional independence structure that can be inspected and explained, structured prediction (CRFs for NER still competitive in low-resource settings), domain knowledge encoding in the graph topology, and causal analysis where the direction of edges has scientific meaning.`,
      `**CRFs (Conditional Random Fields) are the discriminative version of MRFs for structured prediction: p(Y|X) = (1/Z(X)) Πc ψc(Yc,X).** The normaliser Z(X) conditions on input X, making it tractable for linear-chain CRFs via belief propagation. CRFs outperform generative HMMs for sequence labelling when input features are complex and when discriminative training is possible. Largely replaced by BERT fine-tuning for most NLP tasks, but remain relevant when structured output constraints must be hard-enforced.`,
      `**Treewidth determines inference complexity: trees (treewidth 1) allow exact inference in O(K² × n); grids (treewidth ≈ √n) require exponential cost per column.** Real-world networks often have high treewidth because domain experts add edges to capture every dependency they can think of, creating highly connected graphs. The expressiveness-tractability tradeoff is fundamental to PGMs: every edge you add captures a dependency and potentially increases treewidth.`,
    ],
    checkQuestions: [
      {
        q: `In a Bayesian network X → Z ← Y, are X and Y marginally independent? Are they independent given Z?`,
        options: [
          `A) X and Y are marginally dependent because they share the common effect Z; conditioning on Z makes them independent by blocking the v-structure path.`,
          `B) X and Y are marginally independent and also independent given Z, because Z is a collider and colliders always block paths regardless of whether Z is observed.`,
          `C) X and Y are marginally independent (the collider Z blocks the path when unobserved). Conditioning on Z opens the path — X and Y become dependent given Z. This is Berkson's paradox: conditioning on a common effect induces a spurious correlation between its causes.`,
          `D) X and Y are marginally dependent due to the directed edges; conditioning on Z renders them independent because the path is blocked.`,
        ],
        answer: `C`,
      },
      {
        q: `What is the treewidth of a graph and why does it determine inference complexity in PGMs?`,
        options: [
          `A) Treewidth is the maximum node degree in the graph; inference complexity is O(K^{max_degree}) per node, which is tractable for sparse graphs.`,
          `B) Treewidth is the number of cycles in the graph; each cycle adds a factor of K to inference complexity, making loopy graphs exponentially harder.`,
          `C) Treewidth is the minimum number of edges to remove to make the graph a tree; inference complexity is O(K^{removed_edges}) using the junction tree algorithm.`,
          `D) Treewidth measures how close the graph is to a tree; the junction tree algorithm runs exact inference in O(K^{tw+1} × nodes). Trees (tw=1) are tractable at O(K²·n); high-treewidth graphs (social networks, dense medical networks) make exact inference #P-hard, forcing loopy BP, MCMC, or VI approximations.`,
        ],
        answer: `D`,
      },
      {
        q: `You want to use an HMM for anomaly detection in a time series of server metrics. What are the failure modes and how would you address them?`,
        options: [
          `A) The Viterbi algorithm is the only valid inference method for anomaly detection; using forward-backward instead gives incorrect marginals. Use Viterbi and flag states with low emission probability as anomalies.`,
          `B) HMM failure modes include the Markov assumption breaking for long-range dependencies (daily/weekly seasonality), stationarity failing under deployments, Gaussian emission mismatch for heavy-tailed metrics, incorrect K selection, and training data contamination — each requiring targeted fixes like higher-order HMMs, sliding-window EM, Student-t emissions, or BIC-based model selection.`,
          `C) HMMs cannot detect anomalies by definition since they model normal behaviour; use an isolation forest instead for any anomaly detection task involving time series.`,
          `D) The only failure mode is choosing K incorrectly; set K = number of known operational states and all other issues resolve automatically.`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The collider rule is the most interview-critical concept in PGMs: conditioning on a collider Z opens the path between its parents X and Y, creating a dependence that did not exist marginally. This is Berkson's paradox and the mechanism behind selection bias in observational studies. Treewidth determines inference complexity: exact inference is tractable only for low-treewidth graphs, and the exponential cost in treewidth is the primary reason PGMs lost perception tasks to neural networks — but PGMs remain the right tool when conditional independence structure must be explicitly represented, inspected, and explained.`,
  },
]
