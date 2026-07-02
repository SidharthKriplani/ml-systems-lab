export const BANDITS_MODULES = [
  {
    id: 'mab_problem',
    title: 'Multi-Armed Bandit Problem',
    subtitle: 'Exploration-exploitation tradeoff, regret formulation, stochastic vs adversarial MAB',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['bandit', 'exploration', 'regret', 'exploration-exploitation', 'stochastic'],
    summary: `A/B testing commits samples to both arms for the full experiment duration, even if one arm is clearly losing early. In online settings — recommending ads, articles, treatments — every suboptimal recommendation has a real cost. Multi-armed bandits formalise the exploration-exploitation tradeoff: you must try options to learn their value (explore), but you want to choose the best option as often as possible (exploit). Doing both simultaneously is the core challenge. Regret — the accumulated cost of not always choosing the best arm — is the right metric for this problem, not reward prediction accuracy: a perfect reward model with a greedy policy still incurs linear regret if it never explores and fails to discover a better arm. The Lai-Robbins lower bound (Ω(log T)) is the key theoretical anchor: any consistent algorithm must pull suboptimal arms at a rate proportional to log T divided by the KL divergence between arm distributions. You cannot beat log T; you can only match it.`,
    keyPoints: [
      `**Regret is the right metric, not reward accuracy.** Pseudo-regret

$R_T = T·μ* − Σ_t μ_{a_t} measures the cumulative gap betwe$

en the optimal arm's expected reward and your policy's expected rewards. A model that predicts rewards perfectly but selects greedily has zero exploration. If it happened to underestimate the best arm early, it never corrects and incurs linear regret O(T) — the prediction accuracy is high but the decision quality is permanently compromised.`,
      `**Expected regret decomposes as

$R_T = Σ_{a≠a*} Δ_a · E[N_a(T)] where Δ_a = μ* − μ_a is the suboptimality gap for arm a an$

d N_a(T) is the number of times you pull it.** Minimising regret means minimising pulls on suboptimal arms — but identifying which arms are suboptimal requires the exploration you are trying to limit. This is the circular dependency that makes the problem hard.`,
      `**Lai-Robbins lower bound (1985): for any consistent algorithm (sub-polynomial regret on every instance), expected regret satisfies E[R_T] ≥ Σ_{a: Δ_a > 0} Δ_a / KL(μ_a, μ*) · ln T.** This is Ω(log T) and cannot be beaten asymptotically. Algorithms achieving O(log T) regret are optimal. The KL term tells you why near-optimal arms are expensive: if two arms are very similar (small KL), you need many pulls to distinguish them, and each suboptimal pull costs Δ_a.`,
      `**Instance regret vs minimax regret are different goals.** UCB-type algorithms achieve O(log T) on specific instances but O(√(KT)) in the worst case. EXP3 achieves O(√(KT ln K)) in the fully adversarial setting without any distributional assumptions. An algorithm optimal for T = 10^6 may underperform at T = 1000 — asymptotic optimality says nothing about finite-horizon performance where prior warm-starting and instance-specific constants dominate.`,
      `**Stochastic MAB assumes rewards are i.i.d. from fixed but unknown distributions.** The optimal arm is fixed. Most recommendation and ad-serving problems are approximately stochastic over short windows. UCB and Thompson Sampling are designed for this setting and achieve O(log T) regret.`,
      `**Adversarial MAB removes all distributional assumptions — the environment can choose reward sequences after seeing your algorithm (but not your random coin flips).** Relevant for strategic actors, financial markets, and settings where the reward distribution shifts in response to your policy. EXP3 is the algorithm for this setting.`,
      `**Production applications: online ad serving (each ad is an arm, reward is click/conversion, up to tens of millions of arms), recommendation ranking (which item at position 1, with delayed feedback), clinical trials (adaptive randomisation toward better treatments — with major statistical and regulatory complications), and hyperparameter tuning (Hyperband allocates compute budget across configurations).**`,
      `**Finite horizon matters.** Most theory is asymptotic (T → ∞) and instance-dependent factors (Δ values, K) dominate at realistic horizons. In production, content has short lifecycles — an article is relevant for hours. At T = 1000 and K = 20, priors and warm-start heuristics matter more than matching the Lai-Robbins asymptotic constant.`,
    ],
    checkQuestions: [
      {
        q: `You have a news article recommendation system with 500 candidate articles. Each user visit is a bandit round. Why is regret a better objective than classification accuracy of click prediction?`,
        options: [
          `A) Click prediction accuracy directly measures revenue, making it superior to regret for business optimization`,
          `B) Regret measures the cumulative opportunity cost of the policy — a greedy high-accuracy model that never explores may permanently miss the best article, incurring linear regret even with perfect per-round predictions`,
          `C) Regret is easier to compute than classification accuracy in online settings`,
          `D) Classification accuracy ignores the reward signal, so it is always a worse metric regardless of the policy used`,
        ],
        answer: `B`,
      },
      {
        q: `What is the difference between pseudo-regret and expected regret? Which is typically analyzed in theory?`,
        options: [
          `A) Pseudo-regret is the expectation over algorithm randomness of the gap using true arm means; expected regret further averages over reward noise. Theory typically analyzes pseudo-regret because reward noise cancels in expectation, focusing analysis on arm selection sub-optimality`,
          `B) They are equivalent terms — theory uses whichever is notationally convenient`,
          `C) Expected regret is the stronger bound because it includes reward noise; pseudo-regret ignores noise and is therefore easier but less meaningful for practice`,
          `D) Pseudo-regret is only defined for adversarial settings; expected regret applies to stochastic bandits`,
        ],
        answer: `A`,
      },
      {
        q: `In a clinical trial with 4 treatments and 200 patients total, should you use a bandit algorithm? What ethical constraints interact with regret minimization?`,
        options: [
          `A) No — bandit algorithms are inappropriate for clinical trials because they violate patient consent requirements`,
          `B) Yes, but only if the trial is non-randomized and outcomes are binary`,
          `C) Yes, but only for internal rapid-iteration decisions; bandit algorithms are generally not appropriate for regulated clinical trials without pre-registered stopping rules, corrected inference, and careful handling of delayed outcomes and SUTVA violations`,
          `D) Bandit algorithms are always preferred in clinical trials because minimizing regret directly minimizes patient harm`,
        ],
        answer: `D`,
      },
      {
        q: `The Lai-Robbins lower bound is Ω(log T). Does this mean no algorithm can do better than O(log T) regret? What assumptions does the bound depend on?`,
        options: [
          `A) Yes, no algorithm can ever achieve sub-logarithmic regret under any assumptions`,
          `B) The bound only applies to adversarial settings; stochastic MAB algorithms routinely achieve O(1) regret`,
          `C) No consistent algorithm can uniformly beat O(log T) across all stochastic instances; the bound requires i.i.d. rewards from a parametric family, algorithm consistency, and is instance-dependent via KL divergence. In the adversarial setting the minimax lower bound is Ω(√(KT)) instead`,
          `D) The bound applies only when K > log T; with few arms sub-logarithmic regret is achievable`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Regret — not reward prediction accuracy — is the right objective for bandit problems, because a model that predicts rewards correctly but selects greedily incurs linear regret whenever it initially underestimates the best arm. The Lai-Robbins lower bound (Ω(log T)) means no consistent algorithm can do better than O(log T) regret on all instances, and the KL term in the bound tells you why: near-optimal arms require many pulls to eliminate, because small distributional differences are hard to detect.`,
    recap: [
      `**Explore vs exploit:** try arms to learn value, pick the best as often as possible — do both at once.`,
      `**Regret, not reward accuracy:** greedy on a perfect reward model still incurs linear O(T) regret if it never explores.`,
      `**Regret decomposes:** $R_T = Σ_{a≠a*} Δ_a · E[N_a(T)]$ — minimise pulls on suboptimal arms.`,
      `**Lai-Robbins lower bound Ω(log T):** any consistent algorithm pulls suboptimal arms ∝ ln T / KL(μ_a, μ*).`,
      `**KL term = cost of near-optimal arms:** small gap → many pulls to distinguish.`,
      `**Stochastic vs adversarial:** i.i.d. fixed distributions (UCB/TS, O(log T)) vs no assumptions (EXP3, O(√(KT ln K))).`,
      `**Finite horizon matters:** theory is asymptotic; at T=1000, K=20, priors and warm-starts dominate the constant.`,
    ],
  },
  {
    id: 'epsilon_greedy',
    interactiveId: 'exploration_exploitation_viz',
    title: 'Epsilon-Greedy Exploration',
    subtitle: 'Simplest exploration strategy, annealing schedules, failure modes, non-stationary rewards',
    difficulty: 'foundational',
    estimatedMin: 30,
    tags: ['epsilon-greedy', 'exploration', 'annealing', 'non-stationary'],
    summary: `You have 5 headlines for the same news article and no idea which gets the highest CTR. The traditional approach commits equal traffic to all 5 until you have 10K samples per variant, then picks the winner. While you're collecting that data, 80% of readers see a non-optimal headline — every one of those impressions is a missed opportunity. Epsilon-greedy attacks this directly: with probability ε, pick a random headline; otherwise show whichever has the highest estimated CTR so far. After 1,000 impressions you already have a leading candidate, and the exploit step sends most traffic there. Exploration keeps running in the background to correct initial estimates and catch changes.

The mechanism is straightforward but hides a critical flaw: it explores uniformly. Headline A with estimated CTR 3.1%, headline C with 4.2%, and headline D with 2.1% all get the same ε/K share of exploration traffic. Headline D is clearly worse — spending exploration budget there wastes capacity that could go toward distinguishing A from C. There is no mechanism to focus exploration where it matters.

The second flaw is deeper. With ε=0.1, every round has a 10% chance of random arm selection. In every such round, the expected per-step regret is ε·Δ̄ where Δ̄ is the average gap to the best arm. Over T rounds, total exploration regret ≥ ε·T·Δ̄ — linear in T. No matter how small ε is, as long as it is fixed and positive, regret grows without bound. Annealing ε to zero is not optional — it is mathematically necessary for sub-linear regret.

**NOT this.** "Smaller ε is always better after initial exploration." If the arm rewards are non-stationary — headline CTR changes as the news cycle evolves — a decaying ε that goes to 0 stops adapting. The algorithm freezes on whatever was best when exploration stopped, even as the world changes. For non-stationary settings, maintain a minimum ε floor or switch to a method that tracks changing rewards explicitly.`,
    keyPoints: [
      `**Fixed ε causes linear regret: exploration cost ε·T·Δ̄ grows without bound.**\n\nIn every exploration round, the expected per-step regret is ε times the average suboptimality gap Δ̄. Over T rounds this is ε·T·Δ̄ — linear regardless of how small ε is. Annealing ε_t = c/t reduces the total exploration cost to c·Δ̄·Σ_t 1/t = O(log T). The annealing is not a nice-to-have: fixed ε is guaranteed to produce linear regret in stationary settings.`,
      `**Uniform exploration is the core inefficiency: ε/K exploration budget goes to every arm regardless of how obviously inferior it is.**\n\nWith K=5 headlines and ε=0.1, headline D (CTR 2.1% vs headline C's 4.2%) receives the same 2% exploration share as headline B (CTR 2.8%, genuinely uncertain). UCB and Thompson Sampling avoid this by allocating exploration proportional to uncertainty — clearly inferior arms receive negligible exploration as their estimates converge.`,
      `**Cold start and stale means are the two production failure modes.**\n\nCold start: a new headline with K=50 and ε=0.1 gets 0.2% of traffic — at 10,000 daily impressions that is 20 impressions per day, far too few for rapid evaluation. Stale means: if CTR drops 30% due to creative fatigue, an arm with 90 days of data has 1 day's new signal barely moving its mean. Both require patches — forced exploration budgets for new arms, sliding window or discounted means for staleness — that UCB and Thompson Sampling handle more naturally.`,
    ],
    interactivePrompt: `Before you touch the controls: with ε=0.1 and 5 headlines, headline C has the highest estimated CTR. What fraction of traffic goes to exploration overall, and does exploration focus more on uncertain headlines or spread equally?`,
    checkQuestions: [
      {
        q: `You deploy ε=0.1 greedy for ad serving with K=50 ads. After 3 months, CTR on most ads has dropped 30% due to creative fatigue, but a new batch of ads was just added. What happens and how do you fix it?`,
        options: [
          `A) Only the cold start problem matters here — creative fatigue does not affect ε-greedy because the exploit step automatically adjusts to new CTR levels`,
          `B) Two problems occur: (1) stale empirical means cause the exploit step to serve degraded ads whose historical CTR no longer reflects current performance; (2) new ads get only ε/K = 0.2% of traffic each, far too little for rapid evaluation. Fix with discounted means, forced exploration budgets for new ads, and/or switching to Thompson Sampling`,
          `C) ε-greedy handles this well because the 10% exploration traffic continuously samples all ads including new ones`,
          `D) The fix is simply to increase ε to 0.5 temporarily, which gives new ads more traffic without changing the algorithm`,
        ],
        answer: `B`,
      },
      {
        q: `Prove informally that ε-greedy with fixed ε has linear regret (O(T)) even with optimal ε.`,
        options: [
          `A) Fixed ε causes linear regret because the algorithm never converges — it keeps switching between arms forever`,
          `B) Linear regret follows because exploration rounds cause the empirical mean to oscillate, never settling on the best arm`,
          `C) Fixed ε causes linear regret because exploration rounds cause variance in the estimate to grow with T`,
          `D) In every round, exploration contributes expected per-step regret ε·Δ̄ (average suboptimality gap), so total exploration regret ≥ ε·T·Δ̄ — linear in T regardless of how small ε is. Sub-linear regret requires ε_t → 0; with ε_t = c/t, total regret = O(log T)`,
        ],
        answer: `D`,
      },
      {
        q: `In a production system you A/B test two versions of ε-greedy: (a) ε=0.05, (b) adaptive ε_t = 1/√t. After T=10,000 rounds with K=10 arms, which achieves lower regret and why might (a) still be preferred in engineering practice?`,
        options: [
          `A) Adaptive ε_t achieves lower asymptotic regret (O(K log T) vs O(T)) because exploration cost decreases over time. Fixed ε=0.05 may still be preferred in practice for stationarity robustness, operational interpretability, and insensitivity to t=0 resets — especially when effective horizon T per cohort is short`,
          `B) Fixed ε=0.05 always achieves lower regret because adaptive schedules are unstable`,
          `C) They achieve identical regret in practice; the theoretical difference only manifests at T > 10^9`,
          `D) Adaptive ε_t achieves lower regret only when K > 20; for K=10 fixed ε is superior`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Fixed ε causes linear regret because the exploration cost ε·T grows without bound — annealing ε_t → 0 is mathematically required, not optional. Uniform exploration is the core inefficiency: ε/K budget goes to every arm equally, wasting capacity on clearly inferior arms that UCB and Thompson Sampling would deprioritize automatically. The two critical production failure modes are cold start and stale means, both of which require patches that principled algorithms handle natively.`,
    recap: [
      `**Mechanism:** with prob ε pick random arm, else exploit highest estimated CTR.`,
      `**Fixed ε → linear regret:** exploration cost ε·T·Δ̄ grows without bound, however small ε is.`,
      `**Annealing is mandatory:** ε_t = c/t drops exploration cost to O(log T).`,
      `**Uniform exploration = core flaw:** ε/K goes to every arm, wasting budget on clearly inferior arms.`,
      `**Cold start:** new arm with K=50, ε=0.1 gets 0.2% traffic — far too little.`,
      `**Stale means:** old data barely moves the mean after a 30% CTR drop from creative fatigue.`,
      `**NOT this:** decaying ε→0 freezes under non-stationarity — keep an ε floor or track changing rewards.`,
    ],
  },
  {
    id: 'ucb_algorithms',
    interactiveId: 'thompson_sampling_viz',
    title: 'Upper Confidence Bound Algorithms',
    subtitle: 'UCB1, Lai-Robbins optimality, UCB variants, confidence bound construction',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['UCB', 'UCB1', 'confidence bound', 'optimism', 'KL-UCB', 'MOSS'],
    summary: `Epsilon-greedy's fundamental problem is that it allocates exploration uniformly — it has no mechanism for deciding which arms deserve more exploration. UCB solves this with a principled principle: always pull the arm whose true mean could plausibly be highest given what has been observed. The UCB index is μ̂_a + confidence_bonus, where the bonus shrinks as an arm accumulates data and grows as t increases. An arm that is either genuinely high-reward or under-explored will win the argmax — and if it wins because it was over-estimated, the next observation corrects that, shrinking its UCB. Over-optimism is self-correcting. UCB1 achieves O(log T) regret matching the Lai-Robbins lower bound. In production, UCB's determinism (fully reproducible, no random coin flips) makes it auditable — but naive UCB scales poorly to millions of arms because maintaining per-arm confidence intervals becomes expensive.`,
    keyPoints: [
      `**UCB1:

$a_t = argmax_a [μ̂_a + √(2 ln t / N_a(t))].** The confidence bonus √(2 ln t / N_a) has two properties: it de$

cays as N_a grows (arm is better understood, exploration less urgent) and grows as t increases (global pressure to revisit under-pulled arms). An arm never pulled at all has infinite UCB by convention and gets pulled first — this is the natural cold-start solution.`,
      `**UCB1 regret bound: E[R_T] ≤ Σ_{a: Δ_a > 0} [8 ln T / Δ_a + (1 + π²/3)·Δ_a].** The 8/Δ_a factor means near-optimal arms (small Δ_a) get pulled more — which is correct, because they take many observations to identify as suboptimal. Arms with large gaps are eliminated quickly; arms close to optimal require persistent exploration until the confidence intervals separate.`,
      `**Optimism principle: UCB acts as if each arm's mean is at its most optimistic plausible value.** If the true mean really is that high, pulling the arm is correct. If the true mean is lower, the next observation shrinks the confidence interval and the arm's UCB falls. Over-optimism generates the exploration needed to correct itself — this is why UCB never ignores an uncertain arm forever.`,
      `**UCB1-tuned replaces the fixed 1/4 variance bound with empirical variance: UCB = μ̂_a + √(min(1/4, V_a(t)) · ln t / N_a) where V_a accounts for both estimated variance and the uncertainty in that estimate.** Arms with low variance get tighter confidence intervals, focusing exploration budget on arms where variance is genuinely high. Empirically outperforms UCB1 when reward variance differs substantially across arms.`,
      `**KL-UCB uses the KL divergence between empirical and true mean as the confidence bound:

$UCB_a = max{q : N_a · KL(μ̂_a, q) ≤ ln t + c ln ln t}.** This is t$

ighter than Hoeffding-based bounds (which UCB1 uses) and achieves the Lai-Robbins lower bound with matching constant. More computationally expensive — requires solving a one-dimensional optimisation per arm — but asymptotically optimal in a way UCB1 is not.`,
      `**MOSS (Minimax Optimal Strategy in Stochastic case): UCB

$index = μ̂_a + √(max(0, ln(T/(K·N_a))) / N_a).** Achieves minimax-optimal O(√(KT)) over worst-case instances. UCB1 is$

instance-optimal (low regret when gaps are large) but not minimax-optimal. Use UCB1 when you have reason to believe gaps are large; use MOSS when you need worst-case robustness.`,
      `**For continuous arm spaces, naive discretisation into K = T^{1/3} bins achieves O(T^{2/3}) regret.** Kernel UCB or GP-UCB handle smooth reward functions by using a GP posterior as the confidence bound — O(T^{(d+1)/(d+2)}) regret in d dimensions. The GP's posterior variance is the uncertainty measure, and the acquisition function is the UCB index.`,
      `**At web scale with K=10M arms, naive argmax is O(K) per step — infeasible at thousands of QPS.** Practical approaches: two-stage retrieval (ANN on embeddings to get top-100 candidates, then UCB over 100); pre-compute UCB scores in batch and store in Redis; hierarchical UCB (tree over arm categories, UCB at each level to select which subtree to descend).`,
      `**Heavy-tailed rewards (Cauchy, Pareto) break Hoeffding-based UCB confidence bounds, causing under-covering and insufficient exploration.** The empirical mean itself has high variance for heavy-tailed distributions. Use robust mean estimators (trimmed mean, median of means) with correspondingly modified confidence intervals when reward distributions have heavy tails.`,
    ],
    checkQuestions: [
      {
        q: `You have K=5 arms with true means [0.9, 0.8, 0.5, 0.3, 0.1]. After t=100 rounds with UCB1, arm 1 has been pulled N_1=30 times and arm 5 has been pulled N_5=5 times. Compute the UCB scores and explain what the algorithm will do.`,
        options: [
          `A) UCB_1 ≈ 1.454, UCB_5 ≈ 1.457; the algorithm pulls arm 1 because it has the higher empirical mean`,
          `B) UCB_1 ≈ 1.454, UCB_5 ≈ 1.457; the algorithm pulls arm 5 because both arms have similar UCB scores but arm 5 has higher variance`,
          `C) UCB_1 ≈ 1.454, UCB_5 ≈ 1.457; the algorithm pulls arm 5 because its exploration bonus (N_5=5) dominates — demonstrating how UCB naturally gives under-explored arms the benefit of the doubt despite low empirical means`,
          `D) UCB_1 ≈ 0.9, UCB_5 ≈ 0.1; the algorithm always pulls the arm with the highest empirical mean`,
        ],
        answer: `C`,
      },
      {
        q: `Why does UCB1's regret bound have a 1/Δ_a factor? What does this imply about performance when arms are very close in quality?`,
        options: [
          `A) The 1/Δ_a factor is a mathematical artifact; it does not affect practical performance`,
          `B) Near-optimal arms (small Δ_a) require O(ln T / Δ_a²) pulls to confidently identify as suboptimal — the confidence interval must shrink to width < Δ_a. Per-pull regret Δ_a times number of pulls gives O(ln T / Δ_a) per arm. When arms are nearly equal, both lower and upper bounds diverge: any algorithm must explore heavily to distinguish them`,
          `C) The 1/Δ_a factor means UCB performs better when arms are close in quality because it allocates more exploration to resolve near-ties`,
          `D) The 1/Δ_a factor appears because UCB overestimates the confidence bound by a factor of Δ_a`,
        ],
        answer: `B`,
      },
      {
        q: `You're designing an ad serving system with 10 million ads. Describe a practical UCB architecture that is computationally feasible.`,
        options: [
          `A) Two-stage selection (ANN retrieval to top-100 candidates, then UCB over 100), combined with pre-computed UCB scores in Redis updated in batches, hierarchical UCB over ad categories, and tiered exploration only for ads with < 1000 impressions — amortizing O(K) compute across batches and O(log K) per request`,
          `B) Run UCB over all 10M ads per request using distributed computing — modern hardware can handle this at reasonable QPS`,
          `C) Reduce the problem to a standard A/B test over 10 representative ads, ignoring the full 10M ad catalog`,
          `D) Pre-sort ads by CTR weekly and serve the top 100 greedily without any UCB computation`,
        ],
        answer: `A`,
      },
      {
        q: `What is the difference between instance-optimal regret (UCB1) and minimax-optimal regret (MOSS)? When does each matter?`,
        options: [
          `A) They are equivalent — both achieve O(log T) in all settings`,
          `B) UCB1 is always superior because instance-optimal means it adapts to each specific bandit problem`,
          `C) Instance-optimal (UCB1, KL-UCB) minimizes regret per specific arm-gap configuration achieving O(Σ log T / Δ_a) — good when gaps are large. Minimax-optimal (MOSS) minimizes worst-case regret achieving O(√(KT)) — preferable when gaps are unknown or small. In practice Thompson Sampling often outperforms both by adapting implicitly to instance difficulty`,
          `D) MOSS is always preferred over UCB1 because minimax guarantees are strictly stronger than instance-optimal ones`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `UCB's self-correcting optimism is the key mechanism: if an arm wins the argmax because it was over-estimated, the next observation corrects that estimate and shrinks its UCB — over-optimism generates exactly the exploration needed to correct itself. The 1/Δ_a regret factor matters: near-optimal arms (small gap) require O(log T / Δ_a) pulls to identify as suboptimal, because small distributional differences need many observations to resolve. Arms with large gaps are eliminated quickly; arms close to the best take persistent exploration.`,
    recap: [
      `**UCB1 index:** $a_t = argmax_a [μ̂_a + √(2 ln t / N_a(t))]$ — bonus decays with N_a, grows with t.`,
      `**Optimism principle:** act as if each arm's mean is its most optimistic plausible value; over-optimism self-corrects on the next pull.`,
      `**Never-pulled arm has infinite UCB:** natural cold-start solution.`,
      `**O(log T) regret with 8/Δ_a factor:** near-optimal arms get pulled more — they take longest to eliminate.`,
      `**Variants:** UCB1-tuned (empirical variance), KL-UCB (tighter, matches Lai-Robbins constant), MOSS (minimax O(√(KT))).`,
      `**Web scale K=10M:** naive argmax O(K) infeasible — use two-stage ANN retrieval, batched Redis scores, or hierarchical UCB.`,
      `**Heavy tails break Hoeffding bounds:** use robust mean estimators (trimmed mean, median of means).`,
    ],
  },
  {
    id: 'thompson_sampling',
    interactiveId: 'thompson_sampling_viz',
    title: 'Thompson Sampling',
    subtitle: 'Bayesian posterior sampling, conjugate models, empirical performance, top-2 TS',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['Thompson Sampling', 'Bayesian', 'posterior', 'Beta-Binomial', 'conjugate'],
    summary: `You have 5 news headlines, each with a Beta prior over its true CTR. Headline A has Beta(10, 90) — 100 impressions, about 10% estimated CTR. Headline E has Beta(1, 1) — never shown, prior is Uniform[0,1]. Thompson Sampling asks a simple question each round: given what you know, which headline is most likely to be the best? Sample one θ from each arm's posterior. Show the headline with the highest sampled θ.

The mechanism is elegant. Headline E's Beta(1,1) posterior is wide — it samples uniformly across 0 to 1. Its sampled value frequently exceeds the 10% concentrations of A through D. So TS explores headline E aggressively — not because it randomly picks an arm with probability ε, but because uncertainty genuinely warrants it. After 50 more impressions of E, its posterior narrows around whatever its true CTR turns out to be. If E is bad (true CTR 2%), its posterior concentrates near 0.02 and almost never samples above the other headlines. Exploration of E drops to near zero automatically. This is exploration proportional to P(arm is optimal) — not uniform, not confidence-bound-based, but posterior-sampling.

The update rule is trivially simple. On each impression: if click, α += 1; if no click, β += 1. The mean of Beta(α, β) is α/(α+β), which converges to the true CTR as data accumulates. The variance is α·β / (α+β)²·(α+β+1), which shrinks as α+β grows. Exploration happens automatically where it is most informative.

**NOT this.** "Thompson Sampling always requires conjugate priors — Beta for Bernoulli rewards." Beta-Binomial is the most common case, but TS generalizes to any likelihood with an appropriate prior. For Gaussian rewards (continuous feedback like watch time), use Normal-Normal conjugate. For non-conjugate settings, sample from an approximate posterior using Laplace approximation or neural last-layer variance. The conjugate prior is a computational convenience, not a theoretical requirement.`,
    keyPoints: [
      `**Beta-Binomial TS update: on reward r ∈ {0,1} from arm a, α_a += r, β_a += (1−r). Select arm with highest sampled θ_a ~ Beta(α_a, β_a).**\n\nArms with few observations have wide posteriors that sample high frequently — exploration happens automatically. Arms with many observations have concentrated posteriors near their true CTR — exploitation dominates. Start with Beta(1,1) for uninformative priors. In production, an informative prior Beta(10, 990) for 1% CTR dramatically reduces early over-exploration of low-CTR arms. Prior misspecification is the main failure mode: Beta(1,1) on an arm with true CTR 0.001 puts 50% probability mass above 0.5 and wastes enormous early exploration budget.`,
      `**TS exploration is proportional to P(arm a is optimal): arm a is pulled with probability P(θ_a > θ_j for all j≠a | observations).**\n\nAs arm a accumulates observations and its posterior concentrates near a low value, this probability collapses toward zero. UCB in contrast applies a fixed confidence bonus √(2 ln t / N_a) regardless of how implausible it is that the arm is optimal — TS gives up on clearly inferior arms faster. This is why TS empirically outperforms UCB at finite horizons: the posterior shape adapts to the data in a way that a worst-case Hoeffding-bound formula cannot.`,
      `**Applying frequentist stopping rules to TS experiments inflates Type-I error.**\n\nClassical A/B testing uses fixed random allocation, then applies a p-value test at a predetermined sample size. TS continuously reallocates traffic toward better variants. The allocation is no longer random — it is outcome-dependent. A p-value at a fixed sample size applied to TS data will reject the null too often because you are peeking at adaptive data. Use Bayesian stopping criteria (P(variant B is best) > 0.95, or expected loss < threshold) or always-valid sequential p-values that account for the adaptive allocation.`,
    ],
    interactivePrompt: `Before you touch the controls: you have 3 headlines with posteriors Beta(50, 450), Beta(5, 45), and Beta(1, 1). All three have roughly the same empirical mean near 10%. Which headline will Thompson Sampling explore most aggressively, and why?`,
    checkQuestions: [
      {
        q: `Walk through one step of Beta-Binomial Thompson Sampling for 3 ads with posteriors Beta(10,90), Beta(5,45), Beta(1,1). What are the likely samples and which arm gets pulled?`,
        options: [
          `A) All three arms have the same empirical mean (0.10), so they are pulled with equal probability`,
          `B) Arm 1 is pulled most often because it has the most observations and therefore the most reliable estimate`,
          `C) Arm 2 is pulled because it has an intermediate number of observations, balancing uncertainty and accuracy`,
          `D) Arm 3 (Beta(1,1) ≈ Uniform[0,1]) is pulled roughly 50% of the time because its wide posterior frequently samples above the concentrated posteriors of arms 1 and 2 (both near 0.10). This is correct — arm 3 is highly uncertain and TS aggressively explores it until its posterior concentrates`,
        ],
        answer: `D`,
      },
      {
        q: `Your team is running an A/B/C test (3 variants) using Thompson Sampling. After 1000 rounds, the posterior probability that variant B is best is 92%. A PM wants to stop and declare B the winner. What questions do you ask before agreeing?`,
        options: [
          `A) No questions needed — P(B best) = 92% is a valid Bayesian stopping criterion and you should stop immediately`,
          `B) Ask whether the stopping criterion was pre-specified, whether practical significance (expected loss from choosing B) is acceptable, whether rewards are stationary, and whether 1000 rounds is representative traffic — all must be satisfied before stopping`,
          `C) Ask only whether sample size is sufficient — Bayesian methods do not require pre-specified stopping criteria`,
          `D) The only question is whether the experiment has been running long enough to achieve statistical significance under a frequentist test`,
        ],
        answer: `B`,
      },
      {
        q: `Explain why Thompson Sampling exploration is proportional to P(arm a is optimal) and why this is more efficient than UCB's exploration.`,
        options: [
          `A) TS is not more efficient than UCB — both achieve the same Lai-Robbins bound, so efficiency is identical`,
          `B) TS is more efficient because it uses random sampling rather than deterministic formulas, reducing computation per round`,
          `C) TS and UCB explore identically at large T; the difference only appears at T < 100`,
          `D) TS pulls arm a with probability P(θ_a = max_j θ_j | observations), naturally collapsing to near-zero for arms whose posterior concentrates around low values. UCB applies a fixed bonus √(2 ln t / N_a) regardless of P(arm optimal), giving up on inferior arms more slowly. This is why TS empirically outperforms UCB at finite horizons`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Thompson Sampling exploration is proportional to P(arm a is optimal) — as posteriors concentrate around low values for inferior arms, their pull probability collapses toward zero automatically, without any fixed formula. UCB applies a confidence bonus regardless of how implausible it is that the arm is optimal, so it gives up on inferior arms more slowly. The critical production failure mode is prior misspecification: Beta(1,1) on an arm with true CTR 0.001 puts 50% probability above 0.5 and wastes enormous early exploration budget — use informative priors in production.`,
    recap: [
      `**Mechanism:** sample θ from each arm's posterior, show the arm with the highest sample.`,
      `**Beta-Binomial update:** on reward r∈{0,1}, α += r, β += (1−r) — trivially simple.`,
      `**Exploration ∝ P(arm optimal):** wide posteriors sample high often; inferior arms collapse to near-zero pulls automatically.`,
      `**Beats UCB at finite horizons:** posterior shape adapts to data; UCB's fixed Hoeffding bonus gives up on losers more slowly.`,
      `**Prior misspecification = main failure:** Beta(1,1) on true CTR 0.001 puts 50% mass above 0.5 — use informative priors.`,
      `**Adaptive allocation breaks frequentist stopping:** peeking inflates Type-I error — use Bayesian stopping (P(best)>0.95) or always-valid p-values.`,
      `**NOT this:** conjugate priors are a computational convenience, not required — Normal-Normal for Gaussian, Laplace/neural for non-conjugate.`,
    ],
  },
  {
    id: 'contextual_bandits',
    title: 'Contextual Bandits',
    subtitle: 'Context-dependent rewards, LinUCB, LinTS, offline evaluation, NeuralUCB',
    difficulty: 'intermediate',
    estimatedMin: 55,
    tags: ['contextual bandit', 'LinUCB', 'LinTS', 'exploration', 'function approximation'],
    summary: `Standard A/B testing treats all users identically — it asks "which variant is better on average?" But users are different, and the best variant for one user segment may be the worst for another. Contextual bandits extend MAB by observing a feature vector at each round and learning which arm is best as a function of that context, not on average. This is the difference between finding the best treatment on average and finding the best treatment for each patient. The naive alternative — train a supervised reward model and select greedily — fails because arms underrepresented in the logging policy have poorly calibrated reward estimates and are either permanently avoided or over-trusted. LinUCB's uncertainty bonus √(x^T A^{-1} x) is the key mechanism: it is largest exactly when the current context is far from previously observed data, targeting exploration where knowledge is genuinely lacking.`,
    keyPoints: [
      `**Contextual bandit formulation: at round t, observe context x_t ∈ R^d, choose arm a_t ∈ {1,...,K}, observe reward r_t = f(x_t, a_t) + noise.** Goal: minimise Σ_t [f(x_t, a*_t) − f(x_t, a_t)] where a*_t = argmax_a f(x_t, a). Every round is potentially different because the context changes — the same arm may be optimal for one user and suboptimal for another.`,
      `**Contextual bandits subsume classical A/B testing.** A standard A/B test has context (user features) but ignores it during allocation — both variants are shown randomly regardless of user. A contextual bandit learns which variant is better for which user, discovering heterogeneous treatment effects while running the experiment. The allocation becomes personalised and the learnt policy is more valuable.`,
      `**LinUCB: assumes

$r_t = θ_a^T x_t + ε_t.** Estimates θ_a via ridge regression over (context, r$

eward) pairs. UCB for arm a at context x = θ̂_a^T x + α√(x^T A_a^{-1} x) where A_a = X_a^T X_a + λI. The exploration bonus x^T A_a^{-1} x measures how far the current context is from previously observed contexts — large for novel contexts, small for familiar ones. This is the right signal: explore when the context is unfamiliar, exploit when it is not.`,
      `**LinTS: Gaussian posterior over θ_a with mean θ̂_a and covariance σ²A_a^{-1}.** At each round sample θ̃_a ~ N(θ̂_a, σ²A_a^{-1}) and select argmax_a θ̃_a^T x_t. Same regret bounds as LinUCB but empirically better, especially with informative priors. Prior misspecification matters here: a flat prior is the wrong choice when historical data is available to initialise θ̂_a.`,
      `**Offline policy evaluation (OPE): logged (context, arm, reward) data from a behaviour policy can evaluate new policies without online deployment.** OPE is essential because online deployment is expensive and risky. Key estimators: Direct Method (DM) trains a reward model and evaluates offline — low variance but biased when the reward model is wrong for contexts the behaviour policy did not cover. Importance Sampling (IS) reweights logged rewards by π_e/π_b — unbiased but high variance when policies diverge. Doubly Robust (DR) combines both — consistent if either the reward model or propensities are correct.`,
      `**Greedy supervised learning is the wrong baseline.** Train a reward model on logs and select the highest-predicted-reward arm each round. This fails because arms underrepresented in the logging policy have reward estimates with high uncertainty — and the greedy policy either perpetually avoids them (if their logged reward is low) or over-trusts them (if they happened to have high reward on the few occasions they were logged). No uncertainty bonus means no correction for this.`,
      `**Neural models improve reward estimation but break exact uncertainty quantification.** NeuralTS uses last-layer Thompson Sampling: train a neural feature extractor to embed (context, arm) pairs, fix it periodically, run LinTS on the linear head over the embeddings. The neural network provides expressive reward modelling; LinTS provides principled uncertainty quantification on the last layer.`,
      `**Regret bounds: LinUCB achieves O(d√T ln K) regret where d is the context dimension.** Context adds a √d factor over pure MAB O(√(KT)) — learning a linear reward function in d dimensions requires more exploration than learning K scalar arm means. Higher-dimensional or more complex reward functions require proportionally more data before the algorithm can exploit reliably.`,
    ],
    checkQuestions: [
      {
        q: `How does a contextual bandit differ from a supervised learning model + greedy selection? What goes wrong with the greedy approach?`,
        options: [
          `A) Contextual bandits add uncertainty-based exploration: the exploration bonus ensures the model improves on under-explored regions, providing O(d√T) regret guarantees. Greedy supervised learning has no exploration, leaves arms undersampled by the logging policy permanently poorly calibrated, and has no regret guarantee`,
          `B) They are equivalent — a well-trained supervised model with high accuracy behaves like a contextual bandit`,
          `C) The greedy approach is superior because supervised learning converges faster and does not waste traffic on exploration`,
          `D) Contextual bandits differ only in using online updates; the greedy approach performs identically if the supervised model is retrained daily`,
        ],
        answer: `A`,
      },
      {
        q: `You are building a contextual bandit for mobile push notification personalization. Context = 50-dim user features. K=20 notification types. How do you choose between LinUCB (disjoint), LinUCB (hybrid), and NeuralTS?`,
        options: [
          `A) Always choose NeuralTS because neural networks have the highest capacity and will outperform linear models`,
          `B) Choose LinUCB disjoint when arms have very different response patterns and you have sufficient per-arm data; LinUCB hybrid when arms share feature response structure and sample efficiency matters; NeuralTS only when you have >>K·d total observations and cross-validation confirms non-linear interactions that linear models cannot capture`,
          `C) Start with NeuralTS and fall back to LinUCB only if training is too slow`,
          `D) LinUCB disjoint is always the best starting point regardless of data volume or feature structure`,
        ],
        answer: `C`,
      },
      {
        q: `Describe a contextual bandit deployment pipeline for news article recommendation. What are the main engineering challenges?`,
        options: [
          `A) The main challenge is choosing the right reward function — once that is done, deployment is straightforward`,
          `B) The pipeline is: context construction → candidate generation → UCB scoring → serving → async feedback logging → online parameter updates. Main challenges: delayed feedback (click arrives after impression), covariate shift (user distribution changes), O(d²) matrix updates (Sherman-Morrison), cold start for new articles, and OPE-based evaluation before each policy change`,
          `C) The only significant engineering challenge is latency — all other aspects are handled by standard ML infrastructure`,
          `D) Contextual bandits cannot be deployed for news recommendation because articles expire too quickly for the model to learn`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Contextual bandits learn which arm is best for which user, not just which arm is best on average — this is the gap between standard A/B testing and personalised allocation. The critical failure mode of greedy supervised learning is exploration bias: arms underrepresented in the logging policy remain poorly estimated forever and are either permanently avoided or over-trusted. LinUCB's uncertainty bonus √(x^T A^{-1} x) is largest for contexts far from previously observed data — it targets exploration exactly where knowledge is lacking.`,
    recap: [
      `**Formulation:** observe context x_t, pick arm a_t, learn which arm is best as a function of context — not on average.`,
      `**Subsumes A/B testing:** a standard A/B test has context but ignores it; contextual bandits learn heterogeneous treatment effects while running.`,
      `**LinUCB:** $r_t = θ_a^T x_t + ε_t$; index = θ̂_a^T x + α√(x^T A_a^{-1} x); bonus large for novel contexts.`,
      `**LinTS:** sample θ̃_a ~ N(θ̂_a, σ²A_a^{-1}); same bounds as LinUCB, empirically better with informative priors.`,
      `**Greedy supervised = wrong baseline:** no uncertainty bonus → under-logged arms permanently avoided or over-trusted.`,
      `**OPE estimators:** DM (low variance, biased), IS (unbiased, high variance), DR (consistent if either model is right).`,
      `**Regret O(d√T ln K):** context adds √d over pure MAB — richer reward functions need more exploration.`,
    ],
  },
  {
    id: 'linucb',
    title: 'LinUCB In Depth',
    subtitle: 'Ridge regression reward model, confidence ellipsoid, disjoint vs hybrid, Sherman-Morrison',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['LinUCB', 'ridge regression', 'confidence ellipsoid', 'Sherman-Morrison', 'disjoint', 'hybrid'],
    summary: `LinUCB is contextual bandit theory turned into a deployable algorithm. The core insight is geometric: to know how uncertain you are about the reward at a given context x, you need to know how far x is from the contexts you have actually observed. If x is in a direction where you have abundant observations (span of historical contexts), your estimate is confident. If x is in an under-observed direction, your estimate is uncertain and you should explore. The term x^T A^{-1} x captures exactly this: A = X^T X + λI accumulates the information you have observed, and x^T A^{-1} x is large for contexts in the null space of observed data.

This gives exact O(d√T) regret guarantees with efficient O(d²) online updates via Sherman-Morrison. The Yahoo! news paper found the theory-suggested α was 25× too large — always tune α empirically, never use the theoretical constant.`,
    keyPoints: [
      `**Ridge regression for reward:

$θ̂_a = A_a^{-1} b_a where A_a = Σ x_i x_i^T + λI and b_a = Σ r_i x_i.** The λI regularisation ensures A_a is invertib$

le even with few observations (no data collapse) and acts as an isotropic Gaussian prior θ ~ N(0, I/λ). Without it, early rounds with few observations per arm produce degenerate, numerically unstable solutions.`,
      `**Confidence ellipsoid: under the linear model

$r_t = θ_a^T x_t + ε_t with subgaussian noise, the true θ_a lies in the ellipsoid {θ : (θ − θ̂_a)^T A_a (θ − θ̂_a) ≤ β} with$

high probability.** The UCB for context x is the maximum of θ^T x over this ellipsoid: θ̂_a^T x + α√(x^T A_a^{-1} x). The term x^T A_a^{-1} x is the width of the ellipsoid projected onto direction x — how much the estimated reward could plausibly differ from the predicted value.`,
      `**Geometric intuition for x^T A^{-1} x: A_a = X_a^T X_a + λI accumulates the information from all observed contexts.** Directions in R^d well-covered by historical observations have large eigenvalues in A_a, which correspond to small eigenvalues in A_a^{-1} — the UCB bonus is small there. Directions under-observed have small A_a eigenvalues and large A_a^{-1} eigenvalues — the UCB bonus is large. Exploration is targeted at the directions in context space where you lack data.`,
      `**Confidence parameter α: theory gives α = O(σ√(d ln T)) ≈ 5 for Yahoo! news parameters.** The empirically optimal α was 0.2 — 25× smaller. Theory is conservative: it guarantees coverage for all possible θ and all reward realisations, including adversarial worst cases. Actual estimation error is much smaller. Always tune α on held-out OPE data in the range [0.1, 1.0] rather than using the theoretical value.`,
      `**Disjoint model: separate (A_a, b_a, θ̂_a) per arm, no information sharing across arms.** The exploration bonus is arm-specific — an arm with few observations has high uncertainty for all contexts. Works best when arms have genuinely different response patterns to the same features. Storage: K × d² floats for A_a^{-1}; with K=100, d=50, that's 25M floats — feasible.`,
      `**Hybrid model:

$reward = β^T z_t + θ_a^T x_t where z_t are shared features ($

e.g., user features) and x_t are arm-specific features (e.g., ad content features). β is shared across all arms, enabling information sharing.** More sample-efficient when arms share response patterns to shared features. Harder to implement — requires joint statistics and more complex updates.`,
      `**Sherman-Morrison online update: after one new observation (x, r), A_a_new = A_a + x x^T.** Naive recomputation of A_a^{-1} costs O(d³). Sherman-Morrison: (A + xx^T)^{-1} = A^{-1} − (A^{-1} x x^T A^{-1}) / (1 + x^T A^{-1} x). Cost: O(d²) — two matrix-vector products. At d=100 and 10,000 QPS, this is 10^8 FLOPs/second — feasible on one core. This enables real-time updates without full matrix inversion.`,
      `**Reward model misspecification: if the true reward is nonlinear (f(x) = sin(x^T θ)) but LinUCB uses a linear model, the confidence ellipsoid no longer contains the true parameter.** The algorithm may be systematically over-confident in directions where the linear approximation is wrong. Detection: monitor reward model residuals on held-out data. Large systematic residuals (not random noise) indicate misspecification — switch to NeuralTS or add polynomial/interaction features.`,
      `**Covariate shift breaks the calibration: A_a was built on historical contexts.** If the current context distribution differs from historical (new user demographics, seasonal shifts), x^T A_a^{-1} x may be small — the new context looks "in-distribution" for old data but is genuinely novel. The UCB is under-calibrated. Fix: periodic reset of A_a with a forgetting factor, or use only recent observations to compute A_a.`,
    ],
    checkQuestions: [
      {
        q: `Derive the LinUCB index from first principles. Why is √(x^T A^{-1} x) the right uncertainty measure?`,
        options: [
          `A) √(x^T A^{-1} x) is the posterior standard deviation of predicted reward θ^T x under the ridge regression posterior θ | data ~ N(θ̂, σ² A^{-1}). A = X^T X + λI measures observed context information; large A^{-1} eigenvalues in under-observed directions mean high uncertainty there. The UCB = θ̂^T x + α σ √(x^T A^{-1} x) is the upper confidence bound for reward at x, targeting exploration where the current context is novel relative to historical data`,
          `B) √(x^T A^{-1} x) is just the norm of x scaled by the inverse covariance; it has no geometric interpretation related to uncertainty`,
          `C) The LinUCB index is derived from minimax regret theory, not from a Bayesian posterior — √(x^T A^{-1} x) is a worst-case bound`,
          `D) √(x^T A^{-1} x) measures the distance from x to the nearest observed context, not the posterior variance`,
        ],
        answer: `A`,
      },
      {
        q: `You're implementing LinUCB with d=100 feature dimensions and K=50 arms. The system receives 10,000 requests/second. Describe the computational challenges and how you address them.`,
        options: [
          `A) The main challenge is storage — d×d matrices per arm require terabytes of memory at this scale`,
          `B) The system is computationally infeasible at 10,000 QPS with d=100; you must reduce to d=10`,
          `C) Per-request: O(d²) per arm × K arms ≈ 505K FLOPs at 10K QPS = ~5 GFLOPS (feasible on one core). Per-update: O(d²) Sherman-Morrison at 10K QPS = 10^8 ops/sec (feasible). Practical issues: concurrent writes need locking or Hogwild-style updates, delayed feedback requires buffering (context, arm) pairs, and periodic Cholesky recomputation prevents floating-point drift in A^{-1}`,
          `D) The per-request cost is O(d³) due to matrix inversion, making this infeasible without GPUs`,
        ],
        answer: `D`,
      },
      {
        q: `In the Yahoo! news experiment, α=0.2 was optimal, far below the theoretically motivated α=O(√(d ln T)). What does this imply about the theory-practice gap in LinUCB?`,
        options: [
          `A) The theory is wrong — LinUCB does not actually achieve O(d√T) regret in practice`,
          `B) The gap means LinUCB should not be used in production — the theory is too conservative to be useful`,
          `C) The theoretical α guarantees coverage over all possible θ and worst-case noise sequences — actual estimation error is far smaller (real noise σ may be lower, effective dimensionality may be less than d, and finite-T behavior differs from asymptotic bounds). The gap implies: always tune α on held-out OPE data; theory gives the right functional form (mean + α√(x^T A^{-1} x)) but not the right constant`,
          `D) The gap occurs only because the Yahoo! news experiment had an unusually small number of arms`,
        ],
        answer: `C`,
      },
      {
        q: `How does LinUCB handle the cold-start problem for a completely new arm that has never been shown to any user?`,
        options: [
          `A) A new arm with zero observations gets UCB = α/√λ · ||x|| (from A_a = λI, θ̂_a = 0), which is automatically higher than established arms unless they have very high empirical means — a natural cold-start bonus. The bonus can be improved by seeding (A_a, b_a) with a prior from content features, similar-arm parameters, or a global θ̂_global`,
          `B) LinUCB cannot handle cold start — new arms must be pre-warmed with at least d observations before entering the UCB pool`,
          `C) New arms receive UCB = 0 because θ̂_a = 0 and the exploration bonus is also 0 with no observations`,
          `D) LinUCB assigns new arms the same UCB as the current best arm to ensure they receive exploration traffic`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `x^T A^{-1} x is the central LinUCB quantity: it measures how far the current context is from the span of previously observed data, so the exploration bonus is automatically largest in under-observed directions of context space. The Yahoo! news result — optimal α was 25× smaller than theory predicts — is a reliable reminder that worst-case theoretical constants are not production constants. Always tune α empirically and use Sherman-Morrison O(d²) updates rather than O(d³) full matrix inversions for real-time updates.`,
    recap: [
      `**Ridge regression reward:** $θ̂_a = A_a^{-1} b_a$, A_a = Σ x_i x_i^T + λI; λI keeps A_a invertible (Gaussian prior).`,
      `**Confidence ellipsoid → index:** θ̂_a^T x + α√(x^T A_a^{-1} x); the bonus is the ellipsoid width projected onto x.`,
      `**x^T A^{-1} x = geometric uncertainty:** large in under-observed directions of context space, small where data is abundant.`,
      `**Tune α empirically:** Yahoo! news optimal α=0.2 was 25× below the theoretical ≈5 — worst-case constants aren't production constants.`,
      `**Disjoint vs hybrid:** per-arm (A_a, b_a) with no sharing vs shared β^T z + θ_a^T x for sample efficiency.`,
      `**Sherman-Morrison:** O(d²) online update instead of O(d³) inversion — feasible at 10K QPS on one core.`,
      `**Watch failures:** nonlinear reward breaks the ellipsoid (monitor residuals); covariate shift under-calibrates the bonus (forgetting factor).`,
    ],
  },
  {
    id: 'off_policy_evaluation',
    title: 'Off-Policy Evaluation for Bandits',
    subtitle: 'Importance sampling, doubly robust estimator, SNIPS, variance control, distribution shift',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['OPE', 'importance sampling', 'doubly robust', 'SNIPS', 'IPW', 'policy evaluation'],
    summary: `Online A/B testing every candidate policy is expensive and risky — you need weeks of traffic and accept all the costs of deploying a suboptimal policy. Off-Policy Evaluation (OPE) addresses this: given logged data from a behaviour policy, estimate how well a new policy would perform without deploying it. The fundamental problem is that logged data reflects the behaviour policy's choices — the new policy may want to take very different actions in contexts the behaviour policy rarely encountered. Importance weighting corrects for this mismatch but variance explodes when the policies diverge significantly: a small propensity denominator drives importance weights arbitrarily large, and a few high-weight observations dominate the estimate. The doubly robust estimator is the production standard because it is consistent if either the reward model or the propensity model is correctly specified — two independent chances to be right.`,
    keyPoints: [
      `**Direct method (DM): train a reward model r̂(x, a) on logged data, evaluate as V̂_DM(π_e) = Σ_t Σ_a π_e(a|x_t) · r̂(x_t, a).** Low variance — the reward model is smooth and the estimate is deterministic. Biased whenever r̂ is wrong in contexts where π_e takes actions the behaviour policy rarely took — and those are exactly the interesting contexts where a better policy diverges from the baseline.`,
      `**Importance Sampling (IS): V̂_IS(π_e) = (1/T) Σ_t w_t · r_t where w_t = π_e(a_t | x_t) / π_b(a_t | x_t).** Unbiased — in expectation it equals V(π_e). Variance can be enormous when π_e concentrates on actions π_b rarely took: if π_b assigned probability 0.01 to action a but π_e assigns 0.9, the weight is 90. That single observation contributes reward × 90 to the estimate.`,
      `**SNIPS (Self-Normalized IS):

$V̂_SNIPS = Σ_t w_t r_t / Σ_t w_t.** Normalising by the sum of weig$

hts substantially reduces variance at the cost of a small bias. Consistent but biased in finite samples. Practically the default when propensities vary significantly across rounds — the effective sample size N_eff = (Σ w_t)² / Σ w_t² is much higher than for raw IS.`,
      `**Doubly Robust (DR): V̂_DR = (1/T) Σ_t [r̂(x_t, a_t) + w_t (r_t − r̂(x_t, a_t))].** Consistent if either r̂ is correct (then the IS correction w_t(r_t − r̂) averages to zero and DR reduces to DM) or propensities w_t are correct (then DR reduces to IS). Two chances to be right — that is what "doubly robust" means. The production standard.`,
      `**Variance explosion from small propensities: monitor the effective sample size

$N_eff = (Σ w_t)² / Σ w_t².** N_eff tells you how many i.i.d. samp$

les the weighted dataset is worth. If N_eff falls below 5-10% of T, a handful of high-weight observations are dominating the estimate and the OPE is unreliable regardless of sample volume. Propensity clipping (cap weights at W_max = 20) reduces variance at the cost of bias — the right tradeoff when N_eff is dangerously low.`,
      `**Partial feedback is the fundamental constraint: you only observe r(a_t) — the reward for the action actually taken.** You do not observe what would have happened under any other action. Supervised learning has full feedback — labels exist for all classes. OPE must estimate counterfactual rewards from this inherently incomplete information — this is why it is harder than standard evaluation.`,
      `**Propensity logging must happen at serve time.** If you reconstruct propensities later from a logged policy approximation, reconstruction errors propagate through every IS-based estimator. A neural policy that changed between the serve time and the reconstruction will produce wrong propensity estimates. Log the exact probability π_b(a_t | x_t) at the moment of serving — this is an engineering requirement, not an afterthought.`,
      `**Sequential dependencies: if π_b was itself a bandit that adapted over time, the log data is not i.i.d.** The context distribution at time t depends on actions taken at times 1,...,t-1. Standard OPE estimators assume i.i.d. rounds and will produce biased estimates. Marginalised importance sampling (MIS) or temporal holdout strategies are required.`,
      `**Production pipeline: (1) collect logs from π_b with propensity logging at serve time, (2) train reward model r̂ on logs, (3) compute V̂_DR for each candidate π_e with N_eff monitoring, (4) promote top candidates to online A/B test.** OPE enables evaluating 100 policies in the time it takes to run one A/B test — the value is in the rapid filtering.`,
    ],
    checkQuestions: [
      {
        q: `You have 1M logged impressions from a random policy (uniform over K=10 arms) and want to evaluate a new deterministic policy that always chooses arm 3. Compute the importance weights and analyze the variance.`,
        options: [
          `A) IS weights are w_t = 10 when a_t = arm3 and 0 otherwise; effective sample size N_eff = T/10 = 100,000; variance is manageable because max weight is only 10 and all arms were logged with uniform 1/K propensity`,
          `B) IS weights are w_t = 1 for all rounds because the deterministic policy and uniform policy have equal propensity on arm 3`,
          `C) IS weights are undefined because you cannot evaluate a deterministic policy with a uniform logging policy`,
          `D) IS weights are w_t = K = 10 for all rounds, giving variance that grows proportionally with K²`,
        ],
        answer: `B`,
      },
      {
        q: `Why is the doubly robust estimator called "doubly robust"? Construct a simple example where one model is wrong but DR is still consistent.`,
        options: [
          `A) DR is doubly robust because it uses two separate datasets — one for the reward model and one for propensity estimation`,
          `B) DR is doubly robust because it reduces variance by a factor of two compared to pure IS`,
          `C) DR is consistent if either the reward model r̂ or the propensity model is correctly specified — two independent chances to be right. If r̂ is wrong but propensities are correct, the IS correction w_t(r_t − r̂) has non-zero expectation that cancels r̂'s bias; if r̂ is correct, residuals are mean-zero and the IS correction vanishes regardless of propensity errors`,
          `D) DR is doubly robust because it applies importance sampling twice — once for context shift and once for action shift`,
        ],
        answer: `C`,
      },
      {
        q: `Spotify wants to evaluate 50 new playlist ranking policies before A/B testing. Describe the full OPE pipeline and the key failure modes you need to monitor.`,
        options: [
          `A) Run all 50 policies in parallel A/B tests — OPE is too inaccurate for music recommendation`,
          `B) Train a single reward model and apply DM to all 50 policies — the Direct Method is sufficient when the reward model is accurate`,
          `C) OPE is only valid for evaluating policies similar to the logging policy; all 50 candidates must be within KL divergence < 0.1 of the logging policy`,
          `D) Pipeline: log (context, arm, propensity, reward) from π_b → train reward model r̂ → compute V̂_DR for each of 50 policies with bootstrap CIs → rank and promote top 3-5 to A/B test. Monitor: propensity degeneracy (N_eff < 5% of T), reward model calibration (RMSE on held-out), support violations (π_e assigns probability to (x,a) pairs π_b never covered), temporal correlation in logged data, and OPE-to-online rank correlation across past experiments`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `The doubly robust estimator is the production standard because it is consistent if either the reward model or the propensities are correct — two independent chances to be right. Log propensities at serve time, not reconstructed later: reconstruction errors from a changed policy break all IS-based estimators. Monitor

$N_eff = (Σw)²/(Σw²) continuously — if it falls below 5-10%$

of sample size, a handful of high-weight observations dominate the estimate and the OPE is unreliable regardless of how much data you have.`,
    recap: [
      `**OPE goal:** estimate a new policy's value from logged behaviour-policy data, without deploying it.`,
      `**Direct method (DM):** train r̂(x,a); low variance, biased where π_e diverges from π_b — exactly the interesting contexts.`,
      `**Importance sampling (IS):** reweight by w_t = π_e/π_b; unbiased but variance explodes when policies diverge.`,
      `**Doubly robust (DR):** $V̂_DR = (1/T) Σ_t [r̂ + w_t(r_t − r̂)]$; consistent if either r̂ or propensities are right — the production standard.`,
      `**Monitor N_eff = (Σw)²/Σw²:** below 5-10% of T → a few high-weight rows dominate, OPE unreliable; clip weights to trade bias for variance.`,
      `**Log propensities at serve time:** reconstructing later breaks every IS estimator.`,
      `**Partial feedback:** you only see the reward of the action taken — counterfactual estimation is what makes OPE hard.`,
    ],
  },
  {
    id: 'bandits_in_recsys',
    title: 'Bandits in Recommendation Systems',
    subtitle: 'Cold start, exploration bonus in ranking, batched bandits, delayed feedback, cascaded exploration',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['recommendation', 'cold start', 'exploration', 'delayed feedback', 'batched bandits', 'ranking'],
    summary: `Pure exploitation recommendation systems have a fundamental self-fulfilling problem: items that were never shown cannot accumulate the impressions needed to estimate their quality, so they are never shown. Popular items stay popular not because they are always the best choice but because they received the most data. New items, niche items, and items that would suit specific user segments never get discovered. This is the filter bubble — not a philosophical concern but a measurable system failure: catalog coverage collapses, long-tail content atrophies, and users see an increasingly narrow slice of what is available. Bandit exploration in recommendation systems must confront engineering realities that pure bandit theory ignores: batched updates (not per-interaction), delayed feedback (clicks arrive seconds to days after impressions), and cascade position bias (users scan top-to-bottom, so items at higher positions get more examination regardless of quality). The practical answer is to dedicate a fixed exploration budget and use content-based priors to warm-start new items rather than starting from scratch.`,
    keyPoints: [
      `**Cold start is a bandit exploration problem.** New items score near zero in collaborative filtering because they have no interaction history — so they are not shown — so they accumulate no history. This circular dependency is broken by assigning new items a forced exploration budget (e.g., 1000 impressions) with a UCB-style uncertainty bonus that decays as impressions accumulate. Without this, new items never escape the cold start.`,
      `**Exploration bonus in ranking: score(item) = predicted_reward(item) + α · uncertainty(item).** Uncertainty can be content-based (new item → high uncertainty regardless of user), user-item (item rarely shown to this user type → high uncertainty for this user), or model-based (variance of ensemble predictions). α is tuned to balance short-term CTR against long-term catalog coverage and user satisfaction.`,
      `**Exploration operates at multiple levels simultaneously: item level (which item to recommend), user level (new users need diverse items to reveal preferences, not just the global popular items), and context level (new device types, new usage patterns, and new demographics require exploration of whether preference patterns differ).**`,
      `**Delayed feedback breaks the assumption of immediate reward.** Clicks arrive seconds to hours after the recommendation event; purchase or subscription conversion may arrive days later. The bandit cannot update until reward arrives. Solutions: optimistic reward imputation (assign unobserved rewards an optimistic value, correct when reward arrives), delayed update (buffer (context, arm) pairs and update when reward arrives), or reward shaping (use fast proxy rewards like scroll time as surrogates for slow rewards like purchase).`,
      `**Batched bandits: production systems update model parameters in batches (hourly, daily), not per-interaction.** All rounds in a batch use the same policy parameters. Regret degrades by O(√batch_size) versus online updates — acceptable for large T. The practical approach: compute UCB or TS posterior at batch start using all previous statistics; let the entire batch run on that fixed policy; update at batch end.`,
      `**Cascade position bias: users scan a ranked list top-to-bottom and click the first satisfying item.** Items at position 1 receive far more examination probability than items at position 5. A raw CTR of 2% at position 5 may be better item quality than 5% at position 1. Exploration of lower-ranked items is masked by cascade stopping — items below the first click are never examined. Solution: occasionally promote uncertain items to high positions (exploration slots) and use position-debiased reward models to attribute CTR to item quality rather than position.`,
      `**Blending bandits with neural rankers: retrieval (ANN top-K candidates) → neural ranker (P(click|user, item, context)) → bandit exploration layer (adjust neural scores with exploration bonus).** Key tension: if the bandit layer causes distribution shift, the next neural ranker retraining sees biased data — popular items get more training signal, unexplored items get less. Fix: train the neural ranker with importance weighting (DR estimator) on the logged data so that exploration traffic does not bias the feature representation.`,
      `**Measuring exploration quality separately from exploitation quality: online CTR measures exploitation.** Item discovery rate (fraction of catalog items receiving ≥ N impressions per day) and impression distribution entropy measure exploration. Short-term CTR is not the right optimisation target — a 0.1% CTR reduction from exploration may be acceptable if it improves long-term retention and prevents catalog collapse.`,
      `**Exploration budget: dedicate X% of traffic (e.g., 5%) to exploration, run pure exploitation on the rest.** This makes exploration operationally transparent and auditable. Vary the budget by user segment (new users get more, since their preferences are unknown), item segment (new items get more, since their quality is unknown), and time of day (low-traffic periods can absorb more exploration risk).`,
    ],
    checkQuestions: [
      {
        q: `A Netflix-scale system has 50M movies. 10,000 new movies are added each month. Describe a cold-start exploration strategy that doesn't crater CTR.`,
        options: [
          `A) Initialize new movies with content-feature-based CTR priors (from similar established movies), allocate a tiered guaranteed impression budget (e.g., 100K impressions over 30 days) targeted at users with genre affinity, cap exploration at 3% of recommendations per session, and graduate items to the standard pool only after exceeding a CTR threshold — monitoring time-to-first-1000-plays as a health metric`,
          `B) Show all new movies to random users until they accumulate 1000 impressions, then use their empirical CTR for ranking`,
          `C) Use a pure UCB algorithm with Beta(1,1) priors for all new movies to ensure unbiased exploration`,
          `D) Dedicate 50% of traffic to new movies for the first week, then reduce to 5%`,
        ],
        answer: `A`,
      },
      {
        q: `Your recommendation system updates model parameters once per day (batched bandit). You observe that UCB scores computed at midnight are stale by end of day because popular items have shifted. How do you handle this?`,
        options: [
          `A) Switch to a purely greedy policy — UCB scores are too expensive to recompute intra-day`,
          `B) Increase batch size to reduce staleness`,
          `C) Accept staleness as unavoidable in batched systems — regret degrades only by O(√batch_size)`,
          `D) Increase update frequency to hourly using Sherman-Morrison incremental updates; apply a staleness penalty to pre-computed UCB scores at serve time; use time-window ensembles (1hr/4hr/24hr) to capture temporal uncertainty; and maintain a fast-update cache for trending items separate from the batched bandit — switching to hourly batches is the primary fix`,
        ],
        answer: `D`,
      },
      {
        q: `Explain cascade bandits. How does position bias complicate exploration in recommendation ranking?`,
        options: [
          `A) Position bias is not a problem for bandits because UCB scores already account for position effects`,
          `B) In the cascade model, users scan top-to-bottom and stop after the first click — items below the click are unobserved (truncated feedback). Position 1 receives far more examination than position 5, so raw CTR conflates item quality with position. Exploration by promoting uncertain items to high positions conflates item quality with position boost; requires position-debiased rewards (examination propensity correction) and controlled position-swap experiments`,
          `C) Cascade bandits solve position bias automatically by distributing exploration across all positions equally`,
          `D) The cascade model implies items at low positions never need exploration since users rarely reach them`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Pure exploitation creates a filter bubble: items that receive no impressions cannot accumulate data, so they never escape the cold start, so catalog coverage collapses. The operational answer is: dedicate a fixed exploration budget (e.g., 5% of traffic), use content-based priors to warm-start new item posteriors, and use position-debiased reward estimates to avoid conflating cascade position effects with item quality — otherwise exploration slots at high positions look like item quality improvements.`,
    recap: [
      `**Filter bubble:** items never shown accumulate no data, so they're never shown — catalog coverage collapses.`,
      `**Cold start = exploration problem:** give new items a forced impression budget with a decaying uncertainty bonus and content-based priors.`,
      `**Exploration bonus in ranking:** score = predicted_reward + α·uncertainty, at item / user / context levels.`,
      `**Delayed feedback:** clicks arrive seconds to days later — buffer (context, arm), impute optimistically, or use fast proxy rewards.`,
      `**Batched bandits:** update hourly/daily on fixed policy; regret degrades only O(√batch_size).`,
      `**Cascade position bias:** users scan top-down; raw CTR conflates quality with position — use position-debiased rewards.`,
      `**Measure exploration separately:** catalog discovery rate and impression entropy, not just short-term CTR.`,
    ],
  },
  {
    id: 'non_stationary_bandits',
    title: 'Non-Stationary Bandits',
    subtitle: 'Sliding window UCB, discounted UCB, change-point detection, EXP3, REXP3',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['non-stationary', 'sliding window', 'discounted UCB', 'EXP3', 'adversarial', 'change point'],
    summary: `Standard UCB and Thompson Sampling are built for stationary reward distributions. They accumulate observations indefinitely — N_a(t) grows monotonically. An arm with millions of accumulated observations has a confidence interval so tight it never loses the argmax, even after its reward has collapsed.

The algorithm stays frozen on a historically dominant arm long after its true mean has dropped. The failure mode is slow: it takes O(N_a) new observations to substantially move the empirical mean — that is months of data for a heavily exploited arm. The right production strategy combines two mechanisms: CUSUM-based change detection for abrupt shifts (triggers an immediate statistics reset when a change is detected) and sliding window or discounted UCB for gradual drift (continuously forgets stale observations so the mean tracks recent reality). Predictable seasonality is not non-stationarity — weekly cycles belong in contextual features, not in a forgetting mechanism.`,
    keyPoints: [
      `**Standard UCB/TS failure after a change point: UCB1 and standard TS accumulate all historical observations monotonically.** For a previously dominant arm whose reward drops, N_a is large (tight confidence interval), the UCB stays high (empirical mean barely moves), and the algorithm continues exploiting it. The empirical mean only shifts substantially after O(N_a) new observations — for an arm with 50,000 observations, it takes thousands of post-change pulls to notice. Regret grows linearly after the change.`,
      `**Sliding window UCB (SW-UCB): maintain only the last W observations per arm.** UCB

$index = μ̂_a(W) + B√(ln t / min(N_a, W)). Old observations e$

xpire automatically — after a change, the window fills with new observations in W rounds. Optimal window W ≈ √(T/K) for infrequent abrupt changes; regret = O(√(KT)). The tradeoff: a small W adapts quickly but has high variance; a large W is stable but slow to adapt.`,
      `**Discounted UCB (D-UCB): weight observations exponentially:

$μ̂_a = Σ γ^(t−s) r_s / Σ γ^(t−s) where γ ∈ (0,1).** Effective me$

mory length ≈ 1/(1−γ) rounds. Smoother than SW-UCB — old observations don't vanish abruptly but fade gradually. Behaves like an exponential moving average of rewards. γ = 0.99 gives effective memory of 100 rounds; γ = 0.999 gives 1000 rounds.`,
      `**Change-point detection + reset: run CUSUM or Page-Hinkley on each arm's reward stream.** CUSUM maintains a cumulative sum statistic and signals a change when it exceeds a threshold. On detection, reset that arm's statistics (N_a = 0, μ̂_a = flat prior). More principled than windowing — only forgets when change is actually detected, not continuously. Requires tuning the detection threshold: low threshold → fast detection but frequent false alarms; high threshold → fewer false alarms but slow detection.`,
      `**EXP3 (Exponential-weight algorithm for Exploration and Exploitation): the adversarial bandit algorithm.** Maintains weights w_a per arm. Selects arm with probability proportional to w_a plus uniform exploration floor γ/K. Importance-weights the observed reward: x̂_{a,t} = r_t / p_{a_t,t}. Updates: w_{a_t} ← w_{a_t} × exp(γ x̂_{a_t,t} / K). Achieves E[R_T] ≤ O(√(KT ln K)) against any adversarial sequence with no distributional assumptions.`,
      `**EXP3 importance-weighted reward: x̂_{a,t} = r_t / p_{a,t} × 1(a_t = a).** Unbiased: E[x̂_{a,t}] = p_{a,t} × μ_a / p_{a,t} = μ_a. The importance weighting compensates for selection probability — rare arms have their observed rewards scaled up to correct for how rarely they are pulled. Variance is O(K/γ) per arm per round — high, especially with small γ. This is the cost of the adversarial guarantee: no distributional structure means you must pay for all information gathering.`,
      `**REXP3 (Restarting EXP3): for non-stationary adversarial settings with Υ change points, run EXP3 in epochs of length T/Υ, restarting at each epoch.** If Υ is unknown, use a doubling schedule: epochs of length 1, 2, 4,... The cost of not knowing Υ is logarithmic — the doubling trick adds at most a constant factor to regret.`,
      `**Seasonality is not non-stationarity.** Weekly cycles and hour-of-day patterns are predictable and recurring. Sliding window and discounted UCB handle the weekend-weekday difference by forgetting weekday observations on weekends — discarding useful data. The correct treatment: include day_of_week and hour_of_day as context features in a contextual bandit. The model learns that preferences differ predictably by time. Non-stationary algorithms are for genuine concept drift and external shocks — not for predictable patterns.`,
      `**EXP3 vs UCB for moderately non-stationary settings: EXP3 achieves O(√(KT ln K)) against adversarial sequences but O(√(KT ln K)) is worse than UCB's O(log T) for stationary settings.** In practice, most production problems have stochastic structure with occasional abrupt changes — neither purely stationary nor fully adversarial. Sliding window or discounted UCB typically outperforms EXP3 because they exploit stochastic structure when present. EXP3 is the right choice when the adversary is strategic or the reward distribution is fundamentally unpredictable.`,
    ],
    checkQuestions: [
      {
        q: `You're running UCB on an ad creative rotation with K=5 creatives. Creative A dominated for 3 months, but a competitor launched a similar ad and A's CTR dropped from 8% to 2% overnight. How does UCB fail and what algorithm do you switch to?`,
        options: [
          `A) UCB adapts within 10 rounds because the confidence interval always shrinks to include the new true mean`,
          `B) UCB fails because it does not support more than 3 arms`,
          `C) UCB fails because N_A ≈ 50,000 observations makes the confidence interval so tight that the empirical mean barely moves — needs O(N_A) post-change pulls to substantially detect the drop. Fix: sliding window UCB (W = 7 days) or discounted UCB (γ = 0.99) for gradual drift, combined with CUSUM monitoring that resets A's statistics on abrupt change detection`,
          `D) UCB never fails in practice because the confidence bonus grows after a change point`,
        ],
        answer: `C`,
      },
      {
        q: `Explain the EXP3 importance-weighted reward estimate x̂_{a,t} = r_t / p_{a,t}. Why is it unbiased and what is the variance?`,
        options: [
          `A) x̂_{a,t} = r_t / p_{a,t} × 1(a_t = a) is unbiased because E[x̂_{a,t}] = p_{a,t} × μ_a / p_{a,t} = μ_a — the propensity weighting corrects for selection frequency. Variance ≤ r_max² / p_{a,t} ≤ K · r_max² / γ (using the minimum exploration floor γ/K), which is the inherent cost of the adversarial guarantee`,
          `B) The estimate is biased because dividing by p_{a,t} amplifies noise in low-probability arms`,
          `C) The estimate is unbiased only when all arms are selected with equal probability`,
          `D) The variance is O(1) regardless of p_{a,t} because the importance weighting exactly cancels the variance`,
        ],
        answer: `A`,
      },
      {
        q: `In a content recommendation system with weekly seasonality (weekend vs weekday user preferences differ strongly), is non-stationary bandit the right framing? What would you do differently?`,
        options: [
          `A) Yes — weekly seasonality is a form of non-stationarity and sliding window UCB is the correct algorithm`,
          `B) Weekly seasonality is predictable and recurring, not genuine concept drift — non-stationary algorithms would discard useful weekday data on weekends. The correct approach is a contextual bandit with day_of_week and hour_of_day as context features, letting the model learn stable seasonal patterns without forgetting. Reserve non-stationary algorithms for genuine concept drift and external shocks`,
          `C) The recommendation system should be retrained daily to handle weekly seasonality, without any bandit algorithm`,
          `D) Non-stationary bandits with γ = 0.99 discounting are the right choice because weekly cycles fall within the effective memory window`,
        ],
        answer: `B`,
      },
      {
        q: `REXP3 achieves O(Υ^{1/3} K^{1/3} T^{2/3}) regret with Υ change points. How does this compare to the lower bound, and what is the cost of not knowing Υ?`,
        options: [
          `A) REXP3 matches the lower bound exactly — there is no gap between REXP3 and the minimax optimal rate`,
          `B) REXP3 has worse than O(T) regret when Υ is large, making it unusable in practice`,
          `C) The lower bound is O(1) for non-stationary bandits because change points are observable`,
          `D) The minimax lower bound is Ω(√(ΥKT)); REXP3's O(Υ^{1/3} K^{1/3} T^{2/3}) does not match it — EXP3-R with change detection achieves the near-optimal O(√(ΥKT ln K)). Not knowing Υ costs only a logarithmic factor via the doubling trick (epochs of length 1, 2, 4,...) — the added regret is O(log T), making uncertainty about Υ practically free`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Standard UCB/TS freezes on a historically dominant arm after a change point because N_a is too large for the empirical mean to move quickly — it takes O(N_a) post-change observations to detect the drop. The right production strategy combines CUSUM-based change detection for abrupt shifts (immediate statistics reset) and sliding window or discounted UCB for gradual drift (continuous forgetting). Predictable seasonality is not non-stationarity — recurring patterns belong in contextual features where the model learns them, not in a forgetting mechanism that discards them.`,
    recap: [
      `**Failure mode:** standard UCB/TS freezes on a once-dominant arm — large N_a means the mean barely moves after a change.`,
      `**Detection is slow:** O(N_a) post-change pulls needed — thousands of pulls for an arm with 50K observations.`,
      `**Sliding window UCB:** keep last W observations; window fills with fresh data in W rounds; W ≈ √(T/K).`,
      `**Discounted UCB:** $μ̂_a = Σ γ^(t−s) r_s / Σ γ^(t−s)$; effective memory ≈ 1/(1−γ); smoother than SW-UCB.`,
      `**CUSUM change detection + reset:** forgets only when a change is actually detected, not continuously.`,
      `**EXP3 / REXP3:** adversarial O(√(KT ln K)) via importance-weighted rewards; restart in epochs for Υ change points.`,
      `**NOT this:** predictable seasonality isn't drift — put day_of_week / hour_of_day in context features, don't forget the data.`,
    ],
  },
]
