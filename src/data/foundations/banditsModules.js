export const BANDITS_MODULES = [
  {
    id: 'mab_problem',
    title: 'Multi-Armed Bandit Problem',
    subtitle: 'Exploration-exploitation tradeoff, regret formulation, stochastic vs adversarial MAB',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['bandit', 'exploration', 'regret', 'exploration-exploitation', 'stochastic'],
    summary: `A/B testing commits samples to both arms for the full experiment duration, even if one arm is clearly losing early. In online settings — recommending ads, articles, treatments — every suboptimal recommendation has a real cost. Multi-armed bandits formalise the exploration-exploitation tradeoff: you must try options to learn their value (explore), but you want to choose the best option as often as possible (exploit). Doing both simultaneously is the core challenge.

[FIGURE: regret]

Regret — the accumulated cost of not always choosing the best arm — is the right metric for this problem, not reward prediction accuracy: a reward model that is accurate wherever it has enough data can still incur linear regret under a greedy policy, because its early, noisy estimates on rarely-tried arms can underestimate the best arm, and greedy selection never explores enough to correct that and discover the better arm. The Lai-Robbins lower bound (Ω(log T)) is the key theoretical anchor: any consistent algorithm must pull suboptimal arms at a rate proportional to log T divided by the KL divergence between arm distributions. You cannot beat log T; you can only match it.`,
    keyPoints: [
      `**Regret is the right metric, not reward accuracy.** Pseudo-regret

$R_T = T·μ* − Σ_t μ_{a_t} measures the cumulative gap betwe$

en the optimal arm's expected reward and your policy's expected rewards. A model whose reward estimates are accurate wherever it has enough data, but that selects greedily, has zero exploration. If its early, noisy estimates on a rarely-tried arm happen to underestimate that arm's true value, it never corrects and incurs linear regret O(T) — accuracy on well-sampled arms says nothing about decision quality, which is permanently compromised for arms the policy stopped trying.`,
      `**Pseudo-regret decomposes as

$R_T = Σ_{a≠a*} Δ_a · E[N_a(T)] where Δ_a = μ* − μ_a is the suboptimality gap for arm a an$

d N_a(T) is the number of times you pull it.** Minimising regret means minimising pulls on suboptimal arms — but identifying which arms are suboptimal requires the exploration you are trying to limit. This is the circular dependency that makes the problem hard. Pseudo-regret compares to the best arm's true mean μ* using its expected reward, so it averages only over the algorithm's action-selection randomness and the noise in individual reward draws cancels out; the raw (unaveraged) regret instead compares against the realized reward sequence itself, so as a random variable it also carries that reward noise — but once you take its expectation, E[regret] equals pseudo-regret exactly, since E[X_t] = μ_{a_t}. Pseudo-regret is the lower-variance, more tractable quantity to analyze, and it's what nearly all bandit regret bounds — including the Lai-Robbins bound below — actually establish.`,
      `**Lai-Robbins lower bound (1985): for any consistent algorithm (sub-polynomial regret on every instance), expected regret satisfies E[R_T] ≥ Σ_{a: Δ_a > 0} Δ_a / KL(μ_a, μ*) · ln T.** This is Ω(log T) and cannot be beaten asymptotically. Algorithms achieving O(log T) regret are optimal. The KL term tells you why near-optimal arms are expensive: if two arms are very similar (small KL), you need many pulls to distinguish them, and each suboptimal pull costs Δ_a.`,
      `**Instance regret vs minimax regret are different goals.** UCB-type algorithms achieve O(log T) on specific instances but O(√(KT log T)) in the worst case — the matching √(KT) lower-bound rate (no log factor) is only attained by specially-tuned variants like MOSS, not generic UCB. EXP3 achieves O(√(KT ln K)) in the fully adversarial setting without any distributional assumptions. An algorithm optimal for T = 10^6 may underperform at T = 1000 — asymptotic optimality says nothing about finite-horizon performance where prior warm-starting and instance-specific constants dominate.`,
      `**Stochastic MAB assumes rewards are i.i.d. from fixed but unknown distributions.** The optimal arm is fixed. Most recommendation and ad-serving problems are approximately stochastic over short windows. UCB and Thompson Sampling are designed for this setting and achieve O(log T) regret.`,
      `**Adversarial MAB removes all distributional assumptions — the environment can choose reward sequences after seeing your algorithm (but not your random coin flips).** Relevant for strategic actors, financial markets, and settings where the reward distribution shifts in response to your policy. EXP3 is the algorithm for this setting.`,
      `**Production applications: online ad serving (each ad is an arm, reward is click/conversion, up to tens of millions of arms), recommendation ranking (which item at position 1, with delayed feedback), clinical trials (adaptive randomisation toward better treatments — regulated trials require pre-registered stopping rules, statistically corrected inference after adaptive sampling, careful handling of delayed outcomes, and checking SUTVA — the assumption that one patient's treatment assignment doesn't affect another's outcome, which contagion or shared-resource effects can violate), and hyperparameter tuning (Hyperband allocates compute budget across configurations).**`,
      `**Finite horizon matters.** Most theory is asymptotic (T → ∞) and instance-dependent factors (Δ values, K) dominate at realistic horizons. In production, content has short lifecycles — an article is relevant for hours. At T = 1000 and K = 20, priors and warm-start heuristics matter more than matching the Lai-Robbins asymptotic constant.`,
    ],
    checkQuestions: [
      {
        q: `Select the two true statements about why regret is a better objective than classification accuracy for a 500-article bandit recommender.`,
        options: [
          `A) Regret measures cumulative opportunity cost — a greedy high-accuracy model that never explores can permanently miss the best article and rack up linear regret`,
          `B) Click prediction accuracy directly measures ad revenue per impression, making it strictly superior to regret for quarterly business reviews`,
          `C) Accuracy says nothing about exploration: a model can score 95% accuracy while never trying the truly best article, so accuracy and low regret can diverge sharply`,
          `D) Regret is preferred purely because it is cheaper to compute than a confusion matrix over 500 candidate articles`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `What is the difference between (raw) regret and pseudo-regret? Which is typically analyzed in theory?`,
        options: [
          `A) Regret carries realized reward-draw noise; pseudo-regret uses arm means and excludes it. Their expectations are equal, but pseudo-regret's lower variance is why theory analyzes it`,
          `B) They are equivalent terms in every paper — theory picks whichever one happens to be notationally convenient for that particular derivation`,
          `C) Regret is the stronger, tighter bound since it folds in reward noise; pseudo-regret discards noise and is a looser quantity overall`,
          `D) Pseudo-regret is defined only for adversarial bandit settings; regret is the term reserved specifically for stochastic bandit analysis`,
        ],
        answer: `A`,
      },
      {
        q: `In a clinical trial with 4 treatments and 200 patients total, should you use a bandit algorithm? What ethical constraints interact with regret minimization?`,
        options: [
          `A) No — bandit algorithms are categorically inappropriate for any clinical trial because they inherently violate informed-consent requirements`,
          `B) Yes, but only if the trial is fully non-randomized and every outcome is recorded as binary success or failure`,
          `C) Yes for internal rapid-iteration decisions, but regulated clinical trials need pre-registered stopping rules, corrected inference, and careful handling of delayed outcomes and SUTVA violations`,
          `D) Bandit algorithms are always preferred in clinical trials because minimizing statistical regret directly and automatically minimizes patient harm`,
        ],
        answer: `C`,
      },
      {
        q: `The Lai-Robbins lower bound is Ω(log T). Does this mean no algorithm can do better than O(log T) regret? What assumptions does the bound depend on?`,
        options: [
          `A) Yes, no algorithm can ever achieve sub-logarithmic regret on any bandit instance whatsoever, under any assumptions at all, full stop`,
          `B) The bound only applies to adversarial settings; stochastic MAB algorithms routinely achieve O(1) constant regret in real practice`,
          `C) No consistent algorithm beats O(log T) on every instance; it needs i.i.d. rewards and is instance-dependent via KL divergence`,
          `D) The bound applies only once K exceeds log T; with few arms, sub-logarithmic regret becomes achievable for any consistent algorithm here`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Regret — not reward prediction accuracy — is the right objective for bandit problems, because a model whose reward estimates are accurate wherever it has enough data can still incur linear regret under a greedy policy, since early, noisy estimates on rarely-tried arms can underestimate the best arm and greedy selection never explores enough to correct it. The Lai-Robbins lower bound (Ω(log T)) means no consistent algorithm can do better than O(log T) regret on all instances, and the KL term in the bound tells you why: near-optimal arms require many pulls to eliminate, because small distributional differences are hard to detect.`,
    recap: [
      `**Explore vs exploit:** try arms to learn value, pick the best as often as possible — do both at once.`,
      `**Regret, not reward accuracy:** greedy on a perfect reward model still incurs linear O(T) regret if it never explores.`,
      `**Pseudo-regret decomposes:** $R_T = Σ_{a≠a*} Δ_a · E[N_a(T)]$ — minimise pulls on suboptimal arms.`,
      `**Lai-Robbins lower bound Ω(log T):** any consistent algorithm pulls suboptimal arms ∝ ln T / KL(μ_a, μ*).`,
      `**KL term = cost of near-optimal arms:** small gap → many pulls to distinguish.`,
      `**Stochastic vs adversarial:** i.i.d. fixed distributions (UCB/TS, O(log T)) vs no assumptions (EXP3, O(√(KT ln K))).`,
      `**Finite horizon matters:** theory is asymptotic; at T=1000, K=20, priors and warm-starts dominate the constant.`,
    ],
    figures: {
      regret: `<svg viewBox="0 0 360 170" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="40" y1="140" x2="345" y2="140" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="40" y1="18" x2="40" y2="140" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="192" y="162" text-anchor="middle" fill="var(--ink-low)" font-size="8">rounds T &#8594;</text>
  <text x="14" y="80" text-anchor="middle" fill="var(--ink-low)" font-size="8" transform="rotate(-90 14 80)">cumulative regret</text>
  <line x1="40" y1="140" x2="345" y2="28" stroke="#ef4444" stroke-width="2"/>
  <text x="300" y="40" fill="#ef4444" font-size="8.5" font-weight="700">greedy: linear O(T)</text>
  <path d="M40,140 C120,66 220,52 345,44" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <text x="196" y="70" fill="var(--prime)" font-size="8.5" font-weight="700">UCB / TS: O(log T)</text>
  <path d="M40,140 C130,118 240,110 345,106" fill="none" stroke="var(--ink-low)" stroke-width="1.3" stroke-dasharray="3 3"/>
  <text x="250" y="122" fill="var(--ink-low)" font-size="7.5">Lai-Robbins &#937;(log T) floor</text>
  <text x="42" y="14" fill="var(--ink-low)" font-size="7.5">Fixed &#949; never bends &#8212; regret grows without bound; log-T is the best any consistent algorithm can do.</text>
</svg>`,
    },
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

The second flaw is deeper. With ε=0.1, every round has a 10% chance of random arm selection. In every such exploration round, the expected regret is Δ̄ — the average gap to the best arm — since exploration picks uniformly among all K arms; since a round is an exploration round with probability ε, the expected per-round regret averaged over all rounds is ε·Δ̄. Over T rounds, total exploration regret ≥ ε·T·Δ̄ — linear in T. No matter how small ε is, as long as it is fixed and positive, regret grows without bound. Annealing ε to zero is not optional — it is mathematically necessary for sub-linear regret.

[FIGURE: epsdecay]

**NOT this.** "Smaller ε is always better after initial exploration." If the arm rewards are non-stationary — headline CTR changes as the news cycle evolves — a decaying ε that goes to 0 stops adapting. The algorithm freezes on whatever was best when exploration stopped, even as the world changes. For non-stationary settings, maintain a minimum ε floor or switch to a method that tracks changing rewards explicitly.`,
    keyPoints: [
      `**Fixed ε causes linear regret: exploration cost ε·T·Δ̄ grows without bound.**\n\nIn every exploration round, the expected regret is Δ̄, the average suboptimality gap — exploration picks uniformly among arms. Since a round is an exploration round with probability ε, the expected per-round regret averaged over all rounds is ε·Δ̄; over T rounds this totals ε·T·Δ̄ — linear regardless of how small ε is. Annealing ε_t = c/t reduces the total exploration cost to c·Δ̄·Σ_t 1/t = O(log T). The annealing is not a nice-to-have: fixed ε is guaranteed to produce linear regret in stationary settings.`,
      `**Uniform exploration is the core inefficiency: ε/K exploration budget goes to every arm regardless of how obviously inferior it is.**\n\nWith K=5 headlines and ε=0.1, headline D (CTR 2.1% vs headline C's 4.2%) receives the same 2% exploration share as headline B (CTR 2.8%, genuinely uncertain). UCB and Thompson Sampling avoid this by allocating exploration proportional to uncertainty — clearly inferior arms receive negligible exploration as their estimates converge.`,
      `**Cold start and stale means are the two production failure modes.**\n\nCold start: a new headline with K=50 and ε=0.1 gets 0.2% of traffic — at 10,000 daily impressions that is 20 impressions per day, far too few for rapid evaluation. Stale means: if CTR drops 30% due to creative fatigue, an arm with 90 days of data has 1 day's new signal barely moving its mean. Both require patches — forced exploration budgets for new arms, sliding window or discounted means for staleness — that UCB and Thompson Sampling handle more naturally.`,
    ],
    interactivePrompt: `Before you touch the controls: with ε=0.1 and 5 headlines, headline C has the highest estimated CTR. What fraction of traffic goes to exploration overall, and does exploration focus more on uncertain headlines or spread equally?`,
    checkQuestions: [
      {
        q: `You deploy ε=0.1 greedy for ad serving with K=50 ads. After 3 months, CTR on most ads has dropped 30% due to creative fatigue, but a new batch of ads was just added. Select the two problems actually occurring.`,
        options: [
          `A) Stale empirical means serve degraded ads whose historical CTR no longer reflects post-fatigue performance, since old samples dominate the average`,
          `B) New ads get only ε/K ≈ 0.2% traffic each, far too little for rapid evaluation given their small share of the fixed exploration budget`,
          `C) ε-greedy already handles this cleanly — the 10% exploration traffic continuously and evenly samples every ad, including the new batch, without patches`,
          `D) Creative fatigue never affects ε-greedy at all, since the exploit step auto-adjusts to newer CTR levels the instant they change each round`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Prove informally that ε-greedy with fixed ε has linear regret (O(T)) even with optimal ε.`,
        options: [
          `A) Fixed ε causes linear regret because the algorithm never converges numerically — it keeps oscillating between arms forever, regardless of T`,
          `B) Linear regret follows because exploration rounds make the empirical mean oscillate wildly and it never settles on the truly best arm at all`,
          `C) Fixed ε causes linear regret because exploration rounds make the reward-estimate variance grow steadily and unboundedly with T itself`,
          `D) Each round's exploration contributes expected regret ε·Δ̄, so total regret ≥ ε·T·Δ̄ — linear in T unless ε_t → 0 over time`,
        ],
        answer: `D`,
      },
      {
        q: `In a production system you compare two ε-greedy schedules over T=10,000 rounds with K=10 arms: (a) fixed ε=0.05, (b) annealed ε_t = c/t. Which achieves lower regret as T grows, and why?`,
        options: [
          `A) Annealed ε_t = c/t drops exploration cost to O(log T), while fixed ε=0.05 keeps paying exploration cost ε·T·Δ̄ that grows without bound — annealing wins as T grows`,
          `B) Fixed ε=0.05 always achieves strictly lower regret than any annealed schedule, because decaying schedules are inherently numerically unstable`,
          `C) The two achieve identical regret in every practical setting; the theoretical gap only becomes visible once T exceeds roughly 10 billion rounds`,
          `D) Annealed ε_t only achieves lower regret once K exceeds 20 arms; for K=10 the fixed schedule is provably superior in this exact regime`,
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
    figures: {
      epsdecay: `<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="34" y1="128" x2="345" y2="128" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="34" y1="18" x2="34" y2="128" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="190" y="150" text-anchor="middle" fill="var(--ink-low)" font-size="8">round t &#8594;</text>
  <text x="12" y="74" text-anchor="middle" fill="var(--ink-low)" font-size="8" transform="rotate(-90 12 74)">&#949;(t)</text>
  <line x1="34" y1="52" x2="345" y2="52" stroke="#ef4444" stroke-width="2"/>
  <text x="150" y="46" fill="#ef4444" font-size="8.5" font-weight="700">fixed &#949;=0.1 &#8594; regret &#949;&#183;T (linear)</text>
  <path d="M34,20 C90,96 200,122 345,126" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <text x="150" y="112" fill="var(--prime)" font-size="8.5" font-weight="700">&#949;&#7511;=c/t &#8594; regret O(log T)</text>
  <line x1="34" y1="118" x2="345" y2="118" stroke="var(--ink-low)" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="250" y="115" fill="var(--ink-low)" font-size="7.5">&#949; floor (non-stationary)</text>
  <text x="36" y="14" fill="var(--ink-low)" font-size="7.5">Anneal &#949; to 0 for O(log T); keep a floor if rewards drift, or exploration freezes on a stale winner.</text>
</svg>`,
    },
  },
  {
    id: 'ucb_algorithms',
    title: 'Upper Confidence Bound Algorithms',
    subtitle: 'UCB1, Lai-Robbins optimality, UCB variants, confidence bound construction',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['UCB', 'UCB1', 'confidence bound', 'optimism', 'KL-UCB', 'MOSS'],
    summary: `Epsilon-greedy's fundamental problem is that it allocates exploration uniformly — it has no mechanism for deciding which arms deserve more exploration. UCB solves this with a principled principle: always pull the arm whose true mean could plausibly be highest given what has been observed. The UCB index is μ̂_a + confidence_bonus, where the bonus shrinks as an arm accumulates data and grows as t increases.

[FIGURE: ucbpick]

An arm that is either genuinely high-reward or under-explored will win the argmax — and if it wins because it was over-estimated, the next observation corrects that, shrinking its UCB. Over-optimism is self-correcting. UCB1 achieves O(log T) regret matching the Lai-Robbins lower bound's order — though not its exact constant; only KL-UCB (below) matches the constant too. In production, UCB's determinism (fully reproducible, no random coin flips) makes it auditable — but naive UCB scales poorly to millions of arms because maintaining per-arm confidence intervals becomes expensive.`,
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
        q: `You have K=5 arms with true means [0.9, 0.8, 0.5, 0.3, 0.1]. After t=100 rounds with UCB1, arm 1 has been pulled N_1=30 times and arm 5 has been pulled N_5=5 times. For this exercise, assume each arm's empirical mean μ̂_a has already converged exactly to its true mean, so you can substitute the true means directly for μ̂_a. Compute the UCB scores and explain what the algorithm will do.`,
        options: [
          `A) UCB_1 ≈ 1.454, UCB_5 ≈ 1.457; the algorithm pulls arm 1 next because it still has the noticeably higher empirical mean estimate`,
          `B) UCB_1 ≈ 1.454, UCB_5 ≈ 1.457; the algorithm pulls arm 5 because both scores are close but arm 5's reward variance happens to be higher`,
          `C) UCB_1 ≈ 1.454, UCB_5 ≈ 1.457; arm 5's wide exploration bonus (N_5=5) dominates despite its lower mean, so it is the one pulled next`,
          `D) UCB_1 ≈ 0.9, UCB_5 ≈ 0.1; the algorithm always pulls whichever arm currently has the single highest raw empirical mean estimate`,
        ],
        answer: `C`,
      },
      {
        q: `Why does UCB1's regret bound have a 1/Δ_a factor? Select the two true implications for arms that are very close in quality.`,
        options: [
          `A) Near-optimal arms need O(ln T / Δ_a²) pulls before the confidence interval shrinks below width Δ_a, so they take longest to rule out`,
          `B) When arms are nearly tied, both confidence bounds overlap heavily, forcing any correct algorithm to explore those arms heavily to separate them`,
          `C) The 1/Δ_a factor is purely a proof artifact from the union bound and carries no consequence for real deployed systems`,
          `D) The 1/Δ_a factor appears only because UCB systematically overestimates its own confidence bound by exactly a factor of Δ_a`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You're designing an ad serving system with 10 million ads. Describe a practical UCB architecture that is computationally feasible.`,
        options: [
          `A) Two-stage selection: ANN retrieval to top-100, then UCB over 100, with pre-computed Redis scores and hierarchical UCB per category`,
          `B) Run full UCB over all 10 million ads on every single request using distributed compute — modern hardware handles this at reasonable QPS`,
          `C) Reduce the entire problem to a standard fixed-allocation A/B test over just 10 representative ads, discarding the rest of the catalog`,
          `D) Pre-sort every ad by weekly CTR and serve the static top 100 greedily, without running any UCB computation at request time at all`,
        ],
        answer: `A`,
      },
      {
        q: `What is the difference between instance-optimal regret (UCB1) and minimax-optimal regret (MOSS)? When does each matter?`,
        options: [
          `A) They are functionally equivalent — both provably achieve O(log T) regret in every stochastic and adversarial setting alike`,
          `B) UCB1 is always superior in practice simply because being instance-optimal means it adapts to any specific bandit problem`,
          `C) UCB1 minimizes regret per arm-gap, best when gaps are large; MOSS minimizes worst-case regret, better when gaps are small or unknown`,
          `D) MOSS is always preferred over UCB1 in every case, because minimax guarantees are strictly and universally stronger than instance-optimal ones`,
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
    figures: {
      ucbpick: `<svg viewBox="0 0 360 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="20" y1="150" x2="345" y2="150" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="182" y="170" text-anchor="middle" fill="var(--ink-low)" font-size="8">UCB = &#956;&#770; + &#8730;(2 ln t / N) &#8212; pick the tallest bar</text>
  <line x1="55" y1="90" x2="55" y2="150" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="2 2"/>
  <rect x="43" y="60" width="24" height="30" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="43" y="88" width="24" height="4" fill="var(--ink-hi)"/>
  <text x="55" y="163" text-anchor="middle" fill="var(--ink-mid)" font-size="8">A</text>
  <text x="55" y="52" text-anchor="middle" fill="var(--ink-low)" font-size="7">N=800</text>
  <rect x="123" y="34" width="24" height="76" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="123" y="105" width="24" height="4" fill="var(--ink-hi)"/>
  <text x="135" y="163" text-anchor="middle" fill="var(--ink-mid)" font-size="8">B</text>
  <text x="135" y="26" text-anchor="middle" fill="var(--ink-low)" font-size="7">N=12</text>
  <rect x="203" y="118" width="24" height="24" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <rect x="203" y="135" width="24" height="4" fill="var(--ink-hi)"/>
  <text x="215" y="163" text-anchor="middle" fill="var(--ink-mid)" font-size="8">C</text>
  <text x="215" y="110" text-anchor="middle" fill="var(--ink-low)" font-size="7">N=900</text>
  <rect x="283" y="24" width="24" height="118" fill="var(--prime)" stroke="var(--prime)" stroke-dasharray="3 2" opacity="0.85"/>
  <text x="295" y="163" text-anchor="middle" fill="var(--ink-mid)" font-size="8" font-weight="700">D &#9733;</text>
  <text x="295" y="18" text-anchor="middle" fill="var(--prime)" font-size="7" font-weight="700">N=0 &#8734; (wins)</text>
  <text x="20" y="16" fill="var(--ink-low)" font-size="7.5">Solid = &#956;&#770; estimate; open box = confidence bonus. Never-pulled D has an infinite bonus by</text>
  <text x="20" y="26" fill="var(--ink-low)" font-size="7.5">convention and wins the argmax. Among pulled arms, under-explored B still beats certain A/C.</text>
</svg>`,
    },
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

[FIGURE: posterior]

The mechanism is elegant. Headline E's Beta(1,1) posterior is wide — it samples uniformly across 0 to 1. Its sampled value frequently exceeds the 10% concentrations of A through D. So TS explores headline E aggressively — not because it randomly picks an arm with probability ε, but because uncertainty genuinely warrants it. After 50 more impressions of E, its posterior narrows around whatever its true CTR turns out to be. If E is bad (true CTR 2%), its posterior concentrates near 0.02 and almost never samples above the other headlines. Exploration of E drops to near zero automatically. This is exploration proportional to P(arm is optimal) — not uniform, not confidence-bound-based, but posterior-sampling.

The update rule is trivially simple. On each impression: if click, α += 1; if no click, β += 1. The mean of Beta(α, β) is α/(α+β), which converges to the true CTR as data accumulates. The variance is α·β / [(α+β)²·(α+β+1)], which shrinks as α+β grows. Exploration happens automatically where it is most informative.

**NOT this.** "Thompson Sampling always requires conjugate priors — Beta for Bernoulli rewards." Beta-Binomial is the most common case, but TS generalizes to any likelihood with an appropriate prior. For Gaussian rewards (continuous feedback like watch time), use Normal-Normal conjugate. For non-conjugate settings, sample from an approximate posterior using Laplace approximation or neural last-layer variance. The conjugate prior is a computational convenience, not a theoretical requirement.`,
    keyPoints: [
      `**Beta-Binomial TS update: on reward r ∈ {0,1} from arm a, α_a += r, β_a += (1−r). Select arm with highest sampled θ_a ~ Beta(α_a, β_a).**\n\nArms with few observations have wide posteriors that sample high frequently — exploration happens automatically. Arms with many observations have concentrated posteriors near their true CTR — exploitation dominates. Start with Beta(1,1) for uninformative priors. In production, an informative prior Beta(10, 990) for 1% CTR dramatically reduces early over-exploration of low-CTR arms. Prior misspecification is the main failure mode: Beta(1,1) on an arm with true CTR 0.001 puts 50% probability mass above 0.5 and wastes enormous early exploration budget.`,
      `**TS exploration is proportional to P(arm a is optimal): arm a is pulled with probability P(θ_a > θ_j for all j≠a | observations).**\n\nAs arm a accumulates observations and its posterior concentrates near a low value, this probability collapses toward zero. UCB in contrast applies a fixed confidence bonus √(2 ln t / N_a) regardless of how implausible it is that the arm is optimal — TS gives up on clearly inferior arms faster. This is why TS empirically outperforms UCB at finite horizons: the posterior shape adapts to the data in a way that a worst-case Hoeffding-bound formula cannot.`,
      `**Applying frequentist stopping rules to TS experiments inflates Type-I error.**\n\nClassical A/B testing uses fixed random allocation, then applies a p-value test at a predetermined sample size. TS continuously reallocates traffic toward better variants. The allocation is no longer random — it is outcome-dependent. A p-value at a fixed sample size applied to TS data will reject the null too often because you are peeking at adaptive data. Use Bayesian stopping criteria (P(variant B is best) > 0.95, or expected loss < threshold) or always-valid sequential p-values that account for the adaptive allocation.`,
    ],
    interactivePrompt: `Before you touch the controls: you have 3 headlines with posteriors Beta(50, 450) and Beta(5, 45) — both with an empirical mean near 10% — and Beta(1, 1), the flat uninformative prior (uniform over [0,1], mean 0.5, no data yet). Which headline will Thompson Sampling explore most aggressively, and why?`,
    checkQuestions: [
      {
        q: `Walk through one step of Beta-Binomial Thompson Sampling for 3 ads with posteriors Beta(10,90), Beta(5,45), Beta(1,1). What are the likely samples and which arm gets pulled?`,
        options: [
          `A) All three arms share the same empirical mean of 0.10, so on this round they are effectively pulled with equal probability`,
          `B) Arm 1 is pulled most often on this round because it has the most observations and therefore the most reliable point estimate`,
          `C) Arm 2 is pulled most often here because its intermediate observation count nicely balances remaining uncertainty against accuracy`,
          `D) Arm 3's wide Beta(1,1) posterior often samples above arms 1 and 2's tight posteriors, so TS explores it until it narrows`,
        ],
        answer: `D`,
      },
      {
        q: `Your team is running an A/B/C test (3 variants) using Thompson Sampling. After 1000 rounds, the posterior probability that variant B is best is 92%. Select the two questions worth asking before agreeing to stop.`,
        options: [
          `A) Was the 92% stopping threshold pre-specified before the experiment began, or was it chosen after peeking at these particular results?`,
          `B) Is the expected loss from wrongly picking B, not just P(B is best), small enough to be practically acceptable given the business stakes?`,
          `C) P(B best) = 92% is on its own a fully sufficient, self-contained Bayesian stopping rule, so no further questions are needed at all`,
          `D) The only relevant question is whether 1000 rounds clears the sample size required by a standard frequentist significance test`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Explain why Thompson Sampling exploration is proportional to P(arm a is optimal) and why this is more efficient than UCB's exploration.`,
        options: [
          `A) TS is not actually more efficient than UCB at all — both provably achieve the identical Lai-Robbins bound, so their real efficiency is identical`,
          `B) TS is more efficient mainly because it draws random samples instead of using deterministic formulas, which cuts down computation per round`,
          `C) TS and UCB explore in an essentially identical fashion at large T; the practical difference only ever appears once T drops below 100`,
          `D) TS's pull probability collapses toward zero as an arm's posterior concentrates low, while UCB's fixed bonus abandons inferior arms more slowly`,
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
    figures: {
      posterior: `<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="20" y1="128" x2="345" y2="128" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="182" y="148" text-anchor="middle" fill="var(--ink-low)" font-size="8">&#952; (estimated CTR) &#8594;</text>
  <path d="M40,128 C90,128 100,34 118,34 C136,34 146,128 196,128" fill="var(--prime-faint)" stroke="var(--prime)" stroke-width="1.5"/>
  <text x="118" y="26" text-anchor="middle" fill="var(--prime)" font-size="7.5" font-weight="700">A: Beta(10,90) tight</text>
  <path d="M20,128 C120,128 120,104 182,104 C244,104 244,128 344,128" fill="none" stroke="var(--ink-mid)" stroke-width="1.5" stroke-dasharray="3 2"/>
  <text x="300" y="100" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5" font-weight="700">E: Beta(1,1) wide</text>
  <line x1="122" y1="34" x2="122" y2="128" stroke="var(--prime)" stroke-width="1"/>
  <circle cx="122" cy="34" r="3" fill="var(--prime)"/>
  <text x="126" y="46" fill="var(--prime)" font-size="7">sample A &#8776; 0.10</text>
  <line x1="300" y1="60" x2="300" y2="128" stroke="#ef4444" stroke-width="1.4"/>
  <circle cx="300" cy="60" r="3.5" fill="#ef4444"/>
  <text x="230" y="58" fill="#ef4444" font-size="7.5" font-weight="700">sample E = 0.42 &#8594; E wins this round</text>
  <text x="20" y="14" fill="var(--ink-low)" font-size="7.5">Each round: draw one &#952; per arm, show the max. Wide (uncertain) posteriors sample high often &#8212;</text>
  <text x="20" y="152" text-anchor="middle" fill="var(--ink-low)" font-size="0"></text>
  <text x="20" y="24" fill="var(--ink-low)" font-size="7.5">exploration &#8733; P(arm optimal). As E's posterior narrows, its pull rate collapses automatically.</text>
</svg>`,
    },
  },
  {
    id: 'contextual_bandits',
    title: 'Contextual Bandits',
    subtitle: 'Context-dependent rewards, LinUCB, LinTS, offline evaluation, NeuralTS',
    difficulty: 'intermediate',
    estimatedMin: 55,
    tags: ['contextual bandit', 'LinUCB', 'LinTS', 'exploration', 'function approximation'],
    summary: `Standard A/B testing treats all users identically — it asks "which variant is better on average?" But users are different, and the best variant for one user segment may be the worst for another. Contextual bandits extend MAB by observing a feature vector at each round and learning which arm is best as a function of that context, not on average. This is the difference between finding the best treatment on average and finding the best treatment for each patient.

[FIGURE: context]

The naive alternative — train a supervised reward model and select greedily — fails because arms underrepresented in the logging policy have poorly calibrated reward estimates and are either permanently avoided or over-trusted. LinUCB's uncertainty bonus √(x^T A^{-1} x) is the key mechanism: it is largest exactly when the current context is far from previously observed data, targeting exploration where knowledge is genuinely lacking.`,
    keyPoints: [
      `**Contextual bandit formulation: at round t, observe context x_t ∈ R^d, choose arm a_t ∈ {1,...,K}, observe reward r_t = f(x_t, a_t) + noise.** Goal: minimise Σ_t [f(x_t, a*_t) − f(x_t, a_t)] where a*_t = argmax_a f(x_t, a). Every round is potentially different because the context changes — the same arm may be optimal for one user and suboptimal for another.`,
      `**Contextual bandits subsume classical A/B testing.** A standard A/B test has context (user features) but ignores it during allocation — both variants are shown randomly regardless of user. A contextual bandit learns which variant is better for which user, discovering heterogeneous treatment effects while running the experiment. The allocation becomes personalised and the learnt policy is more valuable.`,
      `**LinUCB (disjoint model): assumes r_t = θ_a^T x_t + ε_t, a separate θ_a per arm.** Estimates θ_a via ridge regression over (context, reward) pairs. UCB for arm a at context x = θ̂_a^T x + α√(x^T A_a^{-1} x) where A_a = X_a^T X_a + λI. The exploration bonus x^T A_a^{-1} x measures how far the current context is from previously observed contexts — large for novel contexts, small for familiar ones. This is the right signal: explore when the context is unfamiliar, exploit when it is not. This per-arm model is the *disjoint* variant; a *hybrid* variant shares a parameter vector across arms for common context features when arms have similar response patterns (see LinUCB In Depth).`,
      `**LinTS: Gaussian posterior over θ_a with mean θ̂_a and covariance σ²A_a^{-1}.** At each round sample θ̃_a ~ N(θ̂_a, σ²A_a^{-1}) and select argmax_a θ̃_a^T x_t. Same regret bounds as LinUCB but empirically better, especially with informative priors. Prior misspecification matters here: a flat prior is the wrong choice when historical data is available to initialise θ̂_a.`,
      `**Offline policy evaluation (OPE): logged (context, arm, reward) data from a behaviour policy can evaluate new policies without online deployment.** OPE is essential because online deployment is expensive and risky. Key estimators: Direct Method (DM) trains a reward model and evaluates offline — low variance but biased when the reward model is wrong for contexts the behaviour policy did not cover. Importance Sampling (IS) reweights logged rewards by π_e/π_b — unbiased but high variance when policies diverge. Doubly Robust (DR) combines both — consistent if either the reward model or propensities are correct.`,
      `**Greedy supervised learning is the wrong baseline.** Train a reward model on logs and select the highest-predicted-reward arm each round. This fails because arms underrepresented in the logging policy have reward estimates with high uncertainty — and the greedy policy either perpetually avoids them (if their logged reward is low) or over-trusts them (if they happened to have high reward on the few occasions they were logged). No uncertainty bonus means no correction for this.`,
      `**Neural models improve reward estimation but break exact uncertainty quantification.** NeuralTS uses last-layer Thompson Sampling: train a neural feature extractor to embed (context, arm) pairs, fix it periodically, run LinTS on the linear head over the embeddings. The neural network provides expressive reward modelling; LinTS provides principled uncertainty quantification on the last layer.`,
      `**Regret bounds: LinUCB achieves O(√(dT) ln K) regret where d is the context dimension.** Context adds a √d factor over pure MAB O(√(KT)) — learning a linear reward function in d dimensions requires more exploration than learning K scalar arm means. Higher-dimensional or more complex reward functions require proportionally more data before the algorithm can exploit reliably.`,
    ],
    checkQuestions: [
      {
        q: `How does a contextual bandit differ from a supervised learning model + greedy selection? Select the two true statements about what goes wrong with the greedy approach and what a contextual bandit does differently to fix it.`,
        options: [
          `A) Greedy supervised learning has no exploration mechanism at all, so arms undersampled by the logging policy stay poorly calibrated forever`,
          `B) A contextual bandit's exploration bonus specifically targets under-explored context regions, which is what gives it a real O(d√T) regret guarantee`,
          `C) The two approaches are essentially equivalent — any supervised model with high enough accuracy already behaves exactly like a contextual bandit`,
          `D) Greedy supervised learning is actually superior in general, since it converges faster by never wasting any traffic on deliberate exploration`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You are building a contextual bandit for mobile push notification personalization. Context = 50-dim user features. K=20 notification types. How do you choose between LinUCB (disjoint), LinUCB (hybrid), and NeuralTS?`,
        options: [
          `A) Always default straight to NeuralTS, since neural networks have the highest raw capacity and will therefore outperform any linear model`,
          `B) Use disjoint LinUCB when arms differ a lot with enough per-arm data; hybrid when arms share structure; NeuralTS only if non-linear`,
          `C) Start every project with NeuralTS by default and only fall back to plain LinUCB later if its training turns out to be too slow`,
          `D) Disjoint LinUCB is always the correct starting point in every case, regardless of how much data you have or how the features are structured`,
        ],
        answer: `B`,
      },
      {
        q: `Describe a contextual bandit deployment pipeline for news article recommendation. What are the main engineering challenges?`,
        options: [
          `A) The main challenge is purely picking the right reward function — once that single choice is made, deployment itself is entirely straightforward`,
          `B) Pipeline: context → candidates → UCB scoring → serving → feedback → updates. Challenges: delayed feedback, covariate shift, cold start, OPE`,
          `C) The only genuinely significant engineering challenge here is raw serving latency — every other aspect is handled by standard ML infrastructure`,
          `D) Contextual bandits simply cannot be deployed for news recommendation, since articles expire far too quickly for any model to learn from them`,
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
      `**Regret O(√(dT) ln K):** context adds √d over pure MAB — richer reward functions need more exploration.`,
    ],
    figures: {
      context: `<svg viewBox="0 0 360 170" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="10" y="14" fill="var(--ink-low)" font-size="8">Best arm depends on context x &#8212; not one winner on average:</text>
  <rect x="14" y="24" width="150" height="60" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="89" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">context A (young)</text>
  <text x="89" y="56" text-anchor="middle" fill="var(--prime)" font-size="8">arm 1 best (CTR 6%)</text>
  <text x="89" y="70" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">arm 2 worst (2%)</text>
  <rect x="196" y="24" width="150" height="60" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="271" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">context B (senior)</text>
  <text x="271" y="56" text-anchor="middle" fill="var(--prime)" font-size="8">arm 2 best (7%)</text>
  <text x="271" y="70" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">arm 1 worst (1%)</text>
  <text x="10" y="106" fill="var(--ink-low)" font-size="8">LinUCB bonus &#8730;(x&#7488; A&#8315;&#185; x) targets exploration where x is novel:</text>
  <line x1="30" y1="150" x2="230" y2="150" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="30" y1="120" x2="30" y2="150" stroke="var(--ink-low)" stroke-width="1"/>
  <circle cx="60" cy="144" r="2.5" fill="var(--prime)"/><circle cx="75" cy="140" r="2.5" fill="var(--prime)"/>
  <circle cx="70" cy="146" r="2.5" fill="var(--prime)"/><circle cx="88" cy="142" r="2.5" fill="var(--prime)"/>
  <text x="72" y="164" text-anchor="middle" fill="var(--ink-low)" font-size="7">observed x (small bonus)</text>
  <circle cx="205" cy="128" r="4" fill="none" stroke="#ef4444" stroke-width="1.4"/>
  <text x="205" y="122" text-anchor="middle" fill="#ef4444" font-size="7" font-weight="700">novel x</text>
  <text x="255" y="134" fill="#ef4444" font-size="7.5" font-weight="700">&#8593; large bonus</text>
  <text x="255" y="146" fill="var(--ink-low)" font-size="7">&#8594; explore here</text>
</svg>`,
    },
  },
  {
    id: 'linucb',
    title: 'LinUCB In Depth',
    subtitle: 'Ridge regression reward model, confidence ellipsoid, disjoint vs hybrid, Sherman-Morrison',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['LinUCB', 'ridge regression', 'confidence ellipsoid', 'Sherman-Morrison', 'disjoint', 'hybrid'],
    summary: `LinUCB is contextual bandit theory turned into a deployable algorithm. The core insight is geometric: to know how uncertain you are about the reward at a given context x, you need to know how far x is from the contexts you have actually observed. If x is in a direction where you have abundant observations (span of historical contexts), your estimate is confident. If x is in an under-observed direction, your estimate is uncertain and you should explore. The term x^T A^{-1} x captures exactly this: A = X^T X + λI accumulates the information you have observed, and x^T A^{-1} x is large for contexts in the null space of observed data.

[FIGURE: ellipsoid]

This gives exact O(d√T) regret guarantees with efficient O(d²) online updates via Sherman-Morrison. The Yahoo! news paper found the theory-suggested α was 25× too large — always tune α empirically, never use the theoretical constant.`,
    keyPoints: [
      `**Ridge regression for reward: θ̂_a = A_a^{-1} b_a where A_a = Σ x_i x_i^T + λI and b_a = Σ r_i x_i.** The λI regularisation ensures A_a is invertible even with few observations (no data collapse) and acts as an isotropic Gaussian prior θ ~ N(0, I/λ). Without it, early rounds with few observations per arm produce degenerate, numerically unstable solutions.`,
      `**Confidence ellipsoid: under the linear model r_t = θ_a^T x_t + ε_t with subgaussian noise, the true θ_a lies in the ellipsoid {θ : (θ − θ̂_a)^T A_a (θ − θ̂_a) ≤ β} with high probability.** The UCB for context x is the maximum of θ^T x over this ellipsoid: θ̂_a^T x + α√(x^T A_a^{-1} x). The term x^T A_a^{-1} x is the width of the ellipsoid projected onto direction x — how much the estimated reward could plausibly differ from the predicted value.`,
      `**Geometric intuition for x^T A^{-1} x: A_a = X_a^T X_a + λI accumulates the information from all observed contexts.** Directions in R^d well-covered by historical observations have large eigenvalues in A_a, which correspond to small eigenvalues in A_a^{-1} — the UCB bonus is small there. Directions under-observed have small A_a eigenvalues and large A_a^{-1} eigenvalues — the UCB bonus is large. Exploration is targeted at the directions in context space where you lack data.`,
      `**Confidence parameter α: theory gives α = O(σ√(d ln T)) ≈ 5 for Yahoo! news parameters.** The empirically optimal α was 0.2 — 25× smaller. Theory is conservative: it guarantees coverage for all possible θ and all reward realisations, including adversarial worst cases. Actual estimation error is much smaller. Always tune α on held-out OPE data in the range [0.1, 1.0] rather than using the theoretical value.`,
      `**Disjoint model: separate (A_a, b_a, θ̂_a) per arm, no information sharing across arms.** The exploration bonus is arm-specific — an arm with few observations has high uncertainty for all contexts. Works best when arms have genuinely different response patterns to the same features. Storage: K × d² floats for A_a^{-1}; with K=100, d=50, that's 250K floats — feasible.`,
      `**Hybrid model: reward = β^T z_t + θ_a^T x_t where z_t are shared features (e.g., user features) and x_t are arm-specific features (e.g., ad content features). β is shared across all arms, enabling information sharing.** More sample-efficient when arms share response patterns to shared features. Harder to implement — requires joint statistics and more complex updates.`,
      `**Sherman-Morrison online update: after one new observation (x, r), A_a_new = A_a + x x^T.** Naive recomputation of A_a^{-1} costs O(d³). Sherman-Morrison: (A + xx^T)^{-1} = A^{-1} − (A^{-1} x x^T A^{-1}) / (1 + x^T A^{-1} x). Cost: O(d²) — two matrix-vector products. At d=100 and 10,000 QPS, this is 10^8 FLOPs/second — feasible on one core. This enables real-time updates without full matrix inversion.`,
      `**Reward model misspecification: if the true reward is nonlinear (f(x) = sin(x^T θ)) but LinUCB uses a linear model, the confidence ellipsoid no longer contains the true parameter.** The algorithm may be systematically over-confident in directions where the linear approximation is wrong. Detection: monitor reward model residuals on held-out data. Large systematic residuals (not random noise) indicate misspecification — switch to NeuralTS or add polynomial/interaction features.`,
      `**Covariate shift breaks the calibration: A_a was built on historical contexts.** If the current context distribution differs from historical (new user demographics, seasonal shifts), x^T A_a^{-1} x may be small — the new context looks "in-distribution" for old data but is genuinely novel. The UCB is under-calibrated. Fix: periodic reset of A_a with a forgetting factor, or use only recent observations to compute A_a.`,
    ],
    checkQuestions: [
      {
        q: `Derive the LinUCB index from first principles. Why is √(x^T A^{-1} x) the right uncertainty measure?`,
        options: [
          `A) It is the posterior standard deviation of θ^T x under θ|data ~ N(θ̂, σ²A^{-1}); large A^{-1} eigenvalues mean high uncertainty there`,
          `B) √(x^T A^{-1} x) is just the norm of x scaled by an inverse covariance matrix; it carries no geometric interpretation tied to uncertainty at all`,
          `C) The LinUCB index is derived purely from minimax regret theory rather than any Bayesian posterior — the square-root term is only a worst-case bound`,
          `D) √(x^T A^{-1} x) measures the raw Euclidean distance from x to the single nearest observed context, not any posterior variance`,
        ],
        answer: `A`,
      },
      {
        q: `You're implementing LinUCB with d=100 feature dimensions and K=50 arms. The system receives 10,000 requests/second. Describe the computational challenges and how you address them.`,
        options: [
          `A) The main challenge is pure storage — d×d matrices per arm supposedly require multiple terabytes of memory at this particular scale`,
          `B) The system is fundamentally computationally infeasible at 10,000 QPS once d=100; you are forced to reduce dimensionality down to d=10`,
          `C) Per-request O(d²) per arm across K arms is a few GFLOPS, feasible on one core; Sherman-Morrison updates are similarly feasible, with locking for concurrent writes`,
          `D) The per-request cost is unavoidably O(d³) due to full matrix inversion every time, making this infeasible to serve without dedicated GPU acceleration`,
        ],
        answer: `C`,
      },
      {
        q: `In the Yahoo! news experiment, α=0.2 was optimal, far below the theoretically motivated α=O(√(d ln T)). What does this imply about the theory-practice gap in LinUCB?`,
        options: [
          `A) The underlying theory is simply wrong here — LinUCB does not actually achieve its claimed O(d√T) regret bound in practice at all`,
          `B) The gap means LinUCB should never be used in production settings, since the theory is far too conservative to ever be practically useful`,
          `C) Theoretical α covers worst-case noise and every possible θ, so real error is smaller — tune α empirically on held-out data`,
          `D) The gap occurs only because this particular Yahoo! news experiment happened to use an unusually small number of candidate arms`,
        ],
        answer: `C`,
      },
      {
        q: `How does LinUCB handle the cold-start problem for a completely new arm that has never been shown to any user? Select the two true mechanisms.`,
        options: [
          `A) A zero-observation arm's UCB reduces to α/√λ · ||x||, which is automatically higher than established arms unless those have very high means`,
          `B) The cold-start bonus can be sharpened further by seeding (A_a, b_a) with a prior drawn from content features or a global θ̂_global before serving`,
          `C) LinUCB fundamentally cannot handle cold start on its own — new arms must first be pre-warmed with at least d observations offline before entering the pool`,
          `D) New arms simply receive UCB = 0 outright, since both θ̂_a and the exploration bonus term are exactly zero with no prior observations logged`,
        ],
        answer: ['A', 'B'],
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
    figures: {
      ellipsoid: `<svg viewBox="0 0 360 175" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="10" y="14" fill="var(--ink-low)" font-size="8">Confidence ellipsoid around &#952;&#770;: narrow in well-observed directions, wide in under-observed ones.</text>
  <line x1="30" y1="150" x2="330" y2="150" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="180" y1="30" x2="180" y2="150" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="326" y="146" fill="var(--ink-low)" font-size="7">&#952;&#8321;</text>
  <text x="184" y="36" fill="var(--ink-low)" font-size="7">&#952;&#8322;</text>
  <ellipse cx="180" cy="92" rx="110" ry="34" fill="var(--prime-faint)" stroke="var(--prime)" stroke-width="1.4" transform="rotate(-24 180 92)"/>
  <circle cx="180" cy="92" r="3.5" fill="var(--prime)"/>
  <text x="186" y="88" fill="var(--prime)" font-size="8" font-weight="700">&#952;&#770;</text>
  <line x1="180" y1="92" x2="290" y2="66" stroke="var(--ink-hi)" stroke-width="1.2" marker-end="url(#ar)"/>
  <text x="250" y="60" fill="var(--ink-hi)" font-size="7.5" font-weight="700">wide dir &#8594; big bonus</text>
  <line x1="180" y1="92" x2="212" y2="128" stroke="var(--ink-mid)" stroke-width="1.2" marker-end="url(#ar)"/>
  <text x="214" y="140" fill="var(--ink-mid)" font-size="7.5" font-weight="700">narrow dir &#8594; small bonus</text>
  <text x="10" y="170" fill="var(--ink-low)" font-size="7.5">UCB(x) = &#952;&#770;&#7488;x + &#945;&#8730;(x&#7488; A&#8315;&#185; x): the &#8730;-term is the ellipsoid half-width projected onto direction x.</text>
  <defs><marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-mid)"/></marker></defs>
</svg>`,
    },
  },
  {
    id: 'off_policy_evaluation',
    interactiveId: 'ope_estimator_viz',
    title: 'Off-Policy Evaluation for Bandits',
    subtitle: 'Importance sampling, doubly robust estimator, SNIPS, variance control, distribution shift',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['OPE', 'importance sampling', 'doubly robust', 'SNIPS', 'IPW', 'policy evaluation'],
    summary: `Online A/B testing every candidate policy is expensive and risky — you need weeks of traffic and accept all the costs of deploying a suboptimal policy. Off-Policy Evaluation (OPE) addresses this: given logged data from a behaviour policy, estimate how well a new policy would perform without deploying it. The fundamental problem is that logged data reflects the behaviour policy's choices — the new policy may want to take very different actions in contexts the behaviour policy rarely encountered. Importance weighting corrects for this mismatch but variance explodes when the policies diverge significantly: a small propensity denominator drives importance weights arbitrarily large, and a few high-weight observations dominate the estimate. The doubly robust estimator is the production standard because it is consistent if either the reward model or the propensity model is correctly specified — two independent chances to be right.

[FIGURE: opebv]`,
    interactivePrompt: `Before you touch the controls: as the evaluation policy diverges from the logging policy, importance weights blow up. Which estimator's error explodes first — the Direct Method, plain IS, or Doubly Robust — and which stays usable longest?`,
    keyPoints: [
      `**Direct method (DM): train a reward model r̂(x, a) on logged data, evaluate as V̂_DM(π_e) = (1/T) Σ_t Σ_a π_e(a|x_t) · r̂(x_t, a).** Low variance — the reward model is smooth and the estimate is deterministic. Biased whenever r̂ is wrong in contexts where π_e takes actions the behaviour policy rarely took — and those are exactly the interesting contexts where a better policy diverges from the baseline.`,
      `**Importance Sampling (IS): V̂_IS(π_e) = (1/T) Σ_t w_t · r_t where w_t = π_e(a_t | x_t) / π_b(a_t | x_t).** Unbiased — in expectation it equals V(π_e). Variance can be enormous when π_e concentrates on actions π_b rarely took: if π_b assigned probability 0.01 to action a but π_e assigns 0.9, the weight is 90. That single observation contributes reward × 90 to the estimate.`,
      `**SNIPS (Self-Normalized IS):

$V̂_SNIPS = Σ_t w_t r_t / Σ_t w_t.** Normalising by the sum of weig$

hts substantially reduces variance at the cost of a small bias. Consistent but biased in finite samples. Practically the default when propensities vary significantly across rounds — the effective sample size N_eff = (Σ w_t)² / Σ w_t² is much higher than for raw IS.`,
      `**Doubly Robust (DR): V̂_DR = (1/T) Σ_t [Σ_a π_e(a|x_t)·r̂(x_t,a) + w_t (r_t − r̂(x_t, a_t))].** Consistent if either r̂ is correct (then the IS correction w_t(r_t − r̂) averages to zero and DR reduces to DM) or propensities w_t are correct (then DR reduces to IS). Two chances to be right — that is what "doubly robust" means. The production standard.`,
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
          `A) IS weights are w_t = 10 exactly when a_t = arm3, and 0 otherwise, since the deterministic and uniform propensities differ by that factor`,
          `B) IS weights are w_t = 1 for all rounds, because the deterministic policy and the uniform logging policy share equal propensity on arm 3`,
          `C) IS weights are fundamentally undefined here, since you cannot ever evaluate a deterministic policy using a purely uniform logging policy`,
          `D) IS weights are w_t = K = 10 applied uniformly to every round regardless of arm, giving variance that grows proportionally with K squared`,
        ],
        answer: `A`,
      },
      {
        q: `Why is the doubly robust estimator called "doubly robust"? Construct a simple example where one model is wrong but DR is still consistent.`,
        options: [
          `A) DR earns the name because it draws on two entirely separate datasets — one purely for the reward model, one purely for propensity estimation`,
          `B) DR is doubly robust simply because it reduces estimator variance by roughly a factor of two when compared against plain importance sampling`,
          `C) DR is consistent if either r̂ or the propensity model is correct — two independent chances to be right, canceling either error term`,
          `D) DR earns the name because it applies importance sampling twice over — once to correct for context shift and once again for action shift`,
        ],
        answer: `C`,
      },
      {
        q: `Spotify wants to evaluate 50 new playlist ranking policies before A/B testing. Select the two true failure modes you must monitor in the OPE pipeline.`,
        options: [
          `A) Propensity degeneracy — effective sample size N_eff dropping below roughly 5% of T means a handful of rows dominate every V̂_DR estimate`,
          `B) Support violations — π_e assigning real probability mass to (context, arm) pairs that the logging policy π_b never actually covered in logs`,
          `C) OPE is only ever valid for policies extremely similar to the logging policy — all 50 candidates must sit within a fixed KL threshold of π_b`,
          `D) Running a single shared reward model with plain DM is entirely sufficient here, since Spotify's playlist reward model is inherently well calibrated`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `The doubly robust estimator is the production standard because it is consistent if either the reward model or the propensities are correct — two independent chances to be right. Log propensities at serve time, not reconstructed later: reconstruction errors from a changed policy break all IS-based estimators. Monitor

$N_eff = (Σw)²/(Σw²) continuously — if it falls below 5-10%$

of sample size, a handful of high-weight observations dominate the estimate and the OPE is unreliable regardless of how much data you have.`,
    recap: [
      `**OPE goal:** estimate a new policy's value from logged behaviour-policy data, without deploying it.`,
      `**Direct method (DM):** train r̂(x,a); low variance, biased where π_e diverges from π_b — exactly the interesting contexts.`,
      `**Importance sampling (IS):** reweight by w_t = π_e/π_b; unbiased but variance explodes when policies diverge.`,
      `**Doubly robust (DR):** $V̂_DR = (1/T) Σ_t [Σ_a π_e(a|x_t)·r̂(x_t,a) + w_t(r_t − r̂)]$; consistent if either r̂ or propensities are right — the production standard.`,
      `**Monitor N_eff = (Σw)²/Σw²:** below 5-10% of T → a few high-weight rows dominate, OPE unreliable; clip weights to trade bias for variance.`,
      `**Log propensities at serve time:** reconstructing later breaks every IS estimator.`,
      `**Partial feedback:** you only see the reward of the action taken — counterfactual estimation is what makes OPE hard.`,
    ],
    figures: {
      opebv: `<svg viewBox="0 0 360 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="10" y="14" fill="var(--ink-low)" font-size="8">Three OPE estimators &#8212; each trades bias against variance:</text>
  <line x1="180" y1="118" x2="180" y2="30" stroke="var(--ink-low)" stroke-width="0.8" stroke-dasharray="3 3"/>
  <text x="180" y="128" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5">true V(&#960;&#7497;)</text>
  <circle cx="112" cy="46" r="4" fill="var(--ink-mid)"/>
  <line x1="96" y1="46" x2="128" y2="46" stroke="var(--ink-mid)" stroke-width="1.4"/>
  <text x="196" y="49" fill="var(--ink-mid)" font-size="8" font-weight="700">DM &#8212; biased, tight (low var)</text>
  <text x="60" y="49" text-anchor="end" fill="var(--ink-low)" font-size="7">off &#8595;</text>
  <circle cx="180" cy="76" r="4" fill="#ef4444"/>
  <line x1="70" y1="76" x2="290" y2="76" stroke="#ef4444" stroke-width="1.4"/>
  <text x="196" y="70" fill="#ef4444" font-size="8" font-weight="700">IS &#8212; unbiased, huge variance</text>
  <circle cx="176" cy="106" r="4" fill="var(--prime)"/>
  <line x1="150" y1="106" x2="206" y2="106" stroke="var(--prime)" stroke-width="1.6"/>
  <text x="214" y="109" fill="var(--prime)" font-size="8" font-weight="700">DR &#8212; centered + tight &#9733;</text>
  <text x="10" y="144" fill="var(--ink-low)" font-size="7.5">DR = DM + IS correction: consistent if either the reward model or propensities is right. Watch N&#8331;.</text>
</svg>`,
    },
  },
  {
    id: 'bandits_in_recsys',
    title: 'Bandits in Recommendation Systems',
    subtitle: 'Cold start, exploration bonus in ranking, batched bandits, delayed feedback, cascaded exploration',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['recommendation', 'cold start', 'exploration', 'delayed feedback', 'batched bandits', 'ranking'],
    summary: `Pure exploitation recommendation systems have a fundamental self-fulfilling problem: items that were never shown cannot accumulate the impressions needed to estimate their quality, so they are never shown. Popular items stay popular not because they are always the best choice but because they received the most data. New items, niche items, and items that would suit specific user segments never get discovered. This is the filter bubble — not a philosophical concern but a measurable system failure: catalog coverage collapses, long-tail content atrophies, and users see an increasingly narrow slice of what is available.

[FIGURE: filterbubble] Bandit exploration in recommendation systems must confront engineering realities that pure bandit theory ignores: batched updates (not per-interaction), delayed feedback (clicks arrive seconds to days after impressions), and cascade position bias (users scan top-to-bottom, so items at higher positions get more examination regardless of quality). The practical answer is to dedicate a fixed exploration budget and use content-based priors to warm-start new items rather than starting from scratch.`,
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
        q: `A Netflix-scale system has 50M movies. 10,000 new movies are added each month. Select the two elements a sound cold-start exploration strategy needs.`,
        options: [
          `A) Content-feature CTR priors from similar established movies, plus a tiered guaranteed impression budget targeted at genre-affinity users`,
          `B) A forced impression budget (e.g., 1000 impressions) per new item, with a UCB-style uncertainty bonus that decays toward zero as impressions accumulate`,
          `C) Show every new movie to fully random users until each hits 1000 impressions, then rank purely by that raw empirical CTR with no priors`,
          `D) Dedicate a flat 50% of all traffic to new movies for exactly one week, then abruptly drop that share straight down to 5% afterward`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Your recommendation system updates model parameters once per day (batched bandit). You observe that UCB scores computed at midnight are stale by end of day because popular items have shifted. How do you handle this?`,
        options: [
          `A) Switch entirely to a purely greedy policy, since UCB scores are simply too expensive to ever recompute more than once per day intra-day`,
          `B) Increase the batch size further, on the theory that a larger batch will somehow reduce staleness rather than make it noticeably worse`,
          `C) Accept staleness as fundamentally unavoidable in any batched system, since regret only ever degrades by a modest O(√batch_size) factor`,
          `D) Shrink the batch interval (e.g., daily to hourly) so the UCB or TS posterior is recomputed at each batch start on the latest statistics, reducing how stale the fixed policy gets before its next update`,
        ],
        answer: `D`,
      },
      {
        q: `Explain cascade bandits. How does position bias complicate exploration in recommendation ranking?`,
        options: [
          `A) Position bias is simply not a real problem for bandits at all, since standard UCB scores already fully account for position effects natively`,
          `B) Users scan top-to-bottom and stop at the first click, so raw CTR conflates quality with position — this needs position-debiased rewards`,
          `C) Cascade bandits automatically and fully solve position bias on their own, simply by distributing exploration evenly across every position`,
          `D) The cascade model implies items sitting at low ranking positions never need any exploration at all, since users rarely scroll down that far`,
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
    figures: {
      filterbubble: `<svg viewBox="0 0 360 155" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="90" y="14" text-anchor="middle" fill="var(--ink-low)" font-size="8" font-weight="700">Pure exploitation</text>
  <text x="270" y="14" text-anchor="middle" fill="var(--ink-low)" font-size="8" font-weight="700">+ 5% exploration budget</text>
  <line x1="20" y1="120" x2="170" y2="120" stroke="var(--ink-low)" stroke-width="1"/>
  <rect x="28" y="40" width="16" height="80" fill="var(--prime)"/>
  <rect x="50" y="70" width="16" height="50" fill="var(--prime)" opacity="0.7"/>
  <rect x="72" y="104" width="16" height="16" fill="var(--ink-low)"/>
  <rect x="94" y="112" width="16" height="8" fill="var(--ink-low)"/>
  <rect x="116" y="116" width="16" height="4" fill="var(--ink-low)"/>
  <rect x="138" y="118" width="16" height="2" fill="var(--ink-low)"/>
  <text x="95" y="136" text-anchor="middle" fill="#ef4444" font-size="7.5" font-weight="700">long tail starves &#8594; coverage collapses</text>
  <line x1="200" y1="120" x2="350" y2="120" stroke="var(--ink-low)" stroke-width="1"/>
  <rect x="208" y="52" width="16" height="68" fill="var(--prime)"/>
  <rect x="230" y="74" width="16" height="46" fill="var(--prime)" opacity="0.7"/>
  <rect x="252" y="88" width="16" height="32" fill="var(--prime)" opacity="0.6"/>
  <rect x="274" y="96" width="16" height="24" fill="var(--prime)" opacity="0.5"/>
  <rect x="296" y="102" width="16" height="18" fill="var(--prime)" opacity="0.45"/>
  <rect x="318" y="106" width="16" height="14" fill="var(--prime)" opacity="0.4"/>
  <text x="275" y="136" text-anchor="middle" fill="var(--prime)" font-size="7.5" font-weight="700">tail keeps getting signal</text>
  <text x="20" y="150" fill="var(--ink-low)" font-size="7.5">A forced budget + content priors warm-start new items so they escape the never-shown &#8594; no-data trap.</text>
</svg>`,
    },
  },
  {
    id: 'non_stationary_bandits',
    interactiveId: 'non_stationary_window_viz',
    title: 'Non-Stationary Bandits',
    subtitle: 'Sliding window UCB, discounted UCB, change-point detection, EXP3, REXP3',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['non-stationary', 'sliding window', 'discounted UCB', 'EXP3', 'adversarial', 'change point'],
    summary: `Standard UCB and Thompson Sampling are built for stationary reward distributions. They accumulate observations indefinitely — N_a(t) grows monotonically. An arm with millions of accumulated observations has a confidence interval so tight it never loses the argmax, even after its reward has collapsed.

[FIGURE: changepoint]

The algorithm stays frozen on a historically dominant arm long after its true mean has dropped. The failure mode is slow: it takes O(N_a) new observations to substantially move the empirical mean — that is months of data for a heavily exploited arm. The right production strategy combines two mechanisms: CUSUM-based change detection for abrupt shifts (triggers an immediate statistics reset when a change is detected) and sliding window or discounted UCB for gradual drift (continuously forgets stale observations so the mean tracks recent reality). Predictable seasonality is not non-stationarity — weekly cycles belong in contextual features, not in a forgetting mechanism.`,
    interactivePrompt: `Before you touch the controls: an arm collapses at the change point. A tiny window W tracks the drop fast but is noisy; a huge W is stable but stays frozen for a long time. Which window minimises total regret — the smallest, the largest, or something in between — and why?`,
    keyPoints: [
      `**Standard UCB/TS failure after a change point: UCB1 and standard TS accumulate all historical observations monotonically.** For a previously dominant arm whose reward drops, N_a is large (tight confidence interval), the UCB stays high (empirical mean barely moves), and the algorithm continues exploiting it. The empirical mean only shifts substantially after O(N_a) new observations — for an arm with 50,000 observations, it takes thousands of post-change pulls to notice. Regret grows linearly after the change.`,
      `**Sliding window UCB (SW-UCB): maintain only the last W observations per arm.** UCB

$index = μ̂_a(W) + B√(ln t / min(N_a, W)). Old observations e$

xpire automatically — after a change, the window fills with new observations in W rounds. Optimal window W ≈ √(T/K) for infrequent abrupt changes; regret = O(√(KT)). The tradeoff: a small W adapts quickly but has high variance; a large W is stable but slow to adapt.`,
      `**Discounted UCB (D-UCB): weight observations exponentially:

$μ̂_a = Σ γ^(t−s) r_s / Σ γ^(t−s) where γ ∈ (0,1).** Effective me$

mory length ≈ 1/(1−γ) rounds. Smoother than SW-UCB — old observations don't vanish abruptly but fade gradually. Behaves like an exponential moving average of rewards. γ = 0.99 gives effective memory of 100 rounds; γ = 0.999 gives 1000 rounds.`,
      `**Change-point detection + reset: run CUSUM or Page-Hinkley on each arm's reward stream.** CUSUM maintains a cumulative sum statistic and signals a change when it exceeds a threshold; Page-Hinkley is the same idea applied to a running mean-deviation statistic instead of raw reward. On detection, reset that arm's statistics (N_a = 0, μ̂_a = flat prior). More principled than windowing — only forgets when change is actually detected, not continuously. Requires tuning the detection threshold: low threshold → fast detection but frequent false alarms; high threshold → fewer false alarms but slow detection.`,
      `**EXP3 (Exponential-weight algorithm for Exploration and Exploitation): the adversarial bandit algorithm.** Maintains weights w_a per arm. Selects arm with probability proportional to w_a plus uniform exploration floor γ/K. Importance-weights the observed reward: x̂_{a,t} = r_t / p_{a_t,t}. Updates: w_{a_t} ← w_{a_t} × exp(γ x̂_{a_t,t} / K). Achieves E[R_T] ≤ O(√(KT ln K)) against any adversarial sequence with no distributional assumptions.`,
      `**EXP3 importance-weighted reward: x̂_{a,t} = r_t / p_{a,t} × 1(a_t = a).** Unbiased: E[x̂_{a,t}] = p_{a,t} × μ_a / p_{a,t} = μ_a. The importance weighting compensates for selection probability — rare arms have their observed rewards scaled up to correct for how rarely they are pulled. Variance is O(K/γ) per arm per round — high, especially with small γ. This is the cost of the adversarial guarantee: no distributional structure means you must pay for all information gathering.`,
      `**REXP3 (Restarting EXP3): for non-stationary adversarial settings with Υ change points, run EXP3 in epochs of length T/Υ, restarting at each epoch.** If Υ is unknown, use a doubling schedule: epochs of length 1, 2, 4,... The cost of not knowing Υ is only logarithmic in T — the doubling trick loses at most a log-T factor relative to knowing Υ in advance.`,
      `**Seasonality is not non-stationarity.** Weekly cycles and hour-of-day patterns are predictable and recurring. Sliding window and discounted UCB handle the weekend-weekday difference by forgetting weekday observations on weekends — discarding useful data. The correct treatment: include day_of_week and hour_of_day as context features in a contextual bandit. The model learns that preferences differ predictably by time. Non-stationary algorithms are for genuine concept drift and external shocks — not for predictable patterns.`,
      `**EXP3 vs UCB for moderately non-stationary settings: EXP3 achieves O(√(KT ln K)) against adversarial sequences but O(√(KT ln K)) is worse than UCB's O(log T) for stationary settings.** In practice, most production problems have stochastic structure with occasional abrupt changes — neither purely stationary nor fully adversarial. Sliding window or discounted UCB typically outperforms EXP3 because they exploit stochastic structure when present. EXP3 is the right choice when the adversary is strategic or the reward distribution is fundamentally unpredictable.`,
    ],
    checkQuestions: [
      {
        q: `You're running UCB on an ad creative rotation with K=5 creatives. Creative A dominated for 3 months, but a competitor launched a similar ad and A's CTR dropped from 8% to 2% overnight. Select the two true statements about the failure and fix.`,
        options: [
          `A) With N_A ≈ 50,000 observations the confidence interval is so tight that the empirical mean barely moves, needing O(N_A) post-change pulls to notice`,
          `B) The fix is sliding window UCB or discounted UCB for gradual drift, combined with CUSUM monitoring that resets A's stats on abrupt detection`,
          `C) UCB actually adapts within roughly 10 rounds regardless of history, since its confidence interval always shrinks to include the new true mean fast`,
          `D) UCB fails here purely because it structurally does not support rotating more than 3 creatives at once in a single serving pool`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Explain the EXP3 importance-weighted reward estimate x̂_{a,t} = r_t / p_{a,t}. Why is it unbiased and what is the variance?`,
        options: [
          `A) It is unbiased because E[x̂_{a,t}] = p_{a,t}·μ_a/p_{a,t} = μ_a; variance is bounded by K·r_max²/γ, the cost of robustness`,
          `B) The estimate is actually biased overall, because dividing by p_{a,t} systematically amplifies noise for any arm with low selection probability`,
          `C) The estimate is unbiased only in the special case where every arm happens to be selected with exactly equal probability each round`,
          `D) The variance stays O(1) regardless of p_{a,t}, since the importance weighting term exactly and completely cancels out all added variance`,
        ],
        answer: `A`,
      },
      {
        q: `In a content recommendation system with weekly seasonality (weekend vs weekday user preferences differ strongly), is non-stationary bandit the right framing? What would you do differently?`,
        options: [
          `A) Yes — weekly seasonality is itself a genuine form of non-stationarity, so sliding window UCB is straightforwardly the correct algorithm here`,
          `B) It's predictable, recurring structure, not real drift — use a contextual bandit with day_of_week and hour_of_day as features`,
          `C) The recommendation system should simply be retrained from scratch every single day to handle weekly seasonality, without any bandit algorithm`,
          `D) Non-stationary bandits with γ = 0.99 discounting are the right choice, since weekly cycles happen to fall within that effective memory window`,
        ],
        answer: `B`,
      },
      {
        q: `REXP3 restarts EXP3 every T/Υ rounds. Each restarted run is a fresh EXP3 instance over a horizon of length T/Υ, so it inherits the O(√(K·(T/Υ)·ln K)) bound taught above. Summing this bound across all Υ epochs, what is REXP3's total regret order, and how does it compare to the informal lower bound Ω(√(ΥKT))?`,
        options: [
          `A) Summing Υ epochs of O(√(K(T/Υ) ln K)) each gives Υ·√(K(T/Υ) ln K) = O(√(ΥKT ln K)) — matching the lower bound up to the ln K factor`,
          `B) The per-epoch bounds add linearly to O(ΥKT ln K) — quadratically worse than the lower bound, since regret bounds never combine via square roots`,
          `C) Restarting resets regret to zero at each epoch boundary, so REXP3's total regret is just the single-epoch bound O(√(K(T/Υ) ln K)), independent of Υ`,
          `D) REXP3's regret is unrelated to the per-epoch EXP3 bound; it is a separate O(Υ^{1/3}K^{1/3}T^{2/3}) rate that must be taken on faith`,
        ],
        answer: `A`,
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
    figures: {
      changepoint: `<svg viewBox="0 0 360 165" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="30" y1="130" x2="345" y2="130" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="30" y1="20" x2="30" y2="130" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="188" y="152" text-anchor="middle" fill="var(--ink-low)" font-size="8">rounds &#8594;</text>
  <text x="14" y="75" text-anchor="middle" fill="var(--ink-low)" font-size="8" transform="rotate(-90 14 75)">reward</text>
  <line x1="30" y1="42" x2="180" y2="42" stroke="var(--ink-hi)" stroke-width="1.6"/>
  <line x1="180" y1="98" x2="345" y2="98" stroke="var(--ink-hi)" stroke-width="1.6"/>
  <text x="90" y="36" fill="var(--ink-hi)" font-size="7">true mean (arm collapses)</text>
  <line x1="180" y1="20" x2="180" y2="130" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="184" y="28" fill="#ef4444" font-size="7.5" font-weight="700">change point</text>
  <path d="M30,44 C120,44 170,44 260,50 C320,54 340,55 345,55" fill="none" stroke="var(--ink-mid)" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="270" y="46" fill="var(--ink-mid)" font-size="7.5" font-weight="700">standard UCB: frozen, barely moves</text>
  <path d="M30,44 C120,44 175,44 200,90 C230,98 300,98 345,98" fill="none" stroke="var(--prime)" stroke-width="1.8"/>
  <text x="250" y="114" fill="var(--prime)" font-size="7.5" font-weight="700">sliding-window UCB: tracks in W rounds</text>
  <text x="30" y="14" fill="var(--ink-low)" font-size="7.5">Large N&#7488; makes the mean rigid &#8212; forget stale data (window W or discount &#947;) so it re-tracks reality.</text>
</svg>`,
    },
  },
]
