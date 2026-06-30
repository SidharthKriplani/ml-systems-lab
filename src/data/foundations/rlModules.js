export const RL_MODULES = [
  {
    id: 'mdp_framework',
    title: 'Markov Decision Processes',
    subtitle: 'States, actions, rewards, transitions, discount factor — the formal RL framework',
    difficulty: 'foundational',
    estimatedMin: 40,
    tags: ['mdp', 'markov', 'bellman', 'discount', 'pomdp'],
    summary: `Sequential decision problems — games, robotics, trading — cannot be handled by supervised learning because you don't receive feedback on individual decisions. Reward arrives after a long chain of actions, so you can't label any single step. The MDP formalises this: a tuple (S, A, P, R, γ) that defines what the agent can observe, what it can do, how the world responds, and what it's optimising. The Markov property — next state depends only on the current state and action, not the full history — sounds restrictive, but real violations are fixable by augmenting the state. The discount factor γ is not a "short-sightedness" dial; its deeper role is to guarantee convergence of the infinite-horizon value sum and to encode uncertainty about whether the episode continues. Choosing γ determines the effective credit-assignment horizon and is one of the most consequential hyperparameter decisions in applied RL.`,
    keyPoints: [
      `**Sequential decision problems break supervised learning because individual actions can't be labelled.** You only discover whether a decision was good after many subsequent steps. The MDP tuple (S, A, P, R, γ) is the formal language for stating the problem: S is what the agent can see, A is what it can do, P(s'|s,a) is how the world responds, R(s,a,s') is what the agent is rewarded for, and γ encodes how to weigh future rewards against immediate ones.`,
      `**The Markov property — P(s_{t+1}|s_t,a_t,...,s_0,a_0) = P(s_{t+1}|s_t,a_t) — makes dynamic programming tractable.** Without it, you'd need to track the full history, causing exponential state-space growth. But real systems violate it constantly: a robot seeing only camera images can't distinguish "door is locked" from "door is unlocked"; a trading system where past prices matter needs history. The standard fix is stacking k recent observations into the state, recovering approximate Markov property.`,
      `**The Markov assumption is violated whenever the observation doesn't capture all relevant information.** POMDPs (partial observability) formalise this: the agent receives observation o_t = O(s_t), not s_t directly. The optimal solution requires a belief state b_t = P(s_t|o_1,...,o_t) — computing it exactly is PSPACE-hard. In practice, the choice is between frame-stacking (cheap, limited history), recurrent encoders like LSTM (compact belief approximation), or treating the POMDP as an MDP and accepting approximation error.`,
      `**Discount factor γ encodes three things simultaneously.** Mathematically: ensures V(s) = Σ γ^t R_t converges for infinite-horizon problems. Economically: expresses time preference and uncertainty about episode termination. Practically: the effective credit-assignment horizon is 1/(1-γ) steps — γ=0.99 means rewards 100 steps out matter; γ=0.95 means only 20 steps out. High γ produces better long-term policies but slows convergence and destabilises training by requiring value estimates to be accurate far into the future.`,
      `**Finite-horizon MDPs can have non-stationary optimal policies — the right action at step 50 of 50 differs from the right action at step 1, because the remaining time horizon changes what's achievable.** Infinite-horizon discounted MDPs have a stationary optimal policy (a fixed rule independent of time), which is why most RL algorithms assume this formulation even when training on finite episodes. When the two are confused, agents behave suboptimally near episode boundaries.`,
      `**Reward design is where most applied RL fails in practice.** RL agents are maximisers — they find unintended paths to high reward. Potential-based shaping F(s,s') = γΦ(s') - Φ(s) is the only provably safe shaping form: it accelerates learning without changing the optimal policy. Arbitrary shaping — adding intermediate rewards that look helpful — changes the optimal policy in ways that are often subtle and hard to detect until the agent is deployed.`,
      `**Non-stationarity is the failure mode that classical MDP theory ignores.** Standard MDPs assume P and R are fixed. In recommender systems, user preferences evolve; in finance, market dynamics shift; against human opponents, strategies change in response to yours. RL algorithms that assume stationarity will overfit to current dynamics and fail when the environment shifts. Continual adaptation — periodic retraining, meta-learning, or non-stationary bandit methods — is required, not optional.`,
    ],
    checkQuestions: [
      {
        q: `Why does the optimal policy for a finite-horizon MDP depend on the time remaining t, while the optimal policy for an infinite-horizon discounted MDP does not?`,
        options: [
          `A) Finite-horizon MDPs use a different reward function at each step, while infinite-horizon MDPs use a constant reward function throughout`,
          `B) Finite-horizon MDPs require stochastic policies near the end because the agent becomes risk-averse, while infinite-horizon MDPs always prefer deterministic policies`,
          `C) In finite-horizon MDPs the value function V_t(s) changes with remaining time t via backward induction, so the greedy policy at each t differs; in infinite-horizon discounted MDPs the Bellman equation has a unique fixed point and the same greedy policy is optimal at every step`,
          `D) Infinite-horizon MDPs have a higher discount factor γ which makes the agent indifferent to time, while finite-horizon MDPs have γ=1 which causes time-dependent decisions`,
        ],
        answer: `C`
      },
      {
        q: `Your robot RL agent receives only a camera image as observation. It keeps walking into the same wall repeatedly. What Markov property violation is happening and how do you fix it?`,
        options: [
          `A) The observation is not Markov because a single camera frame doesn't capture motion, history, or what has already been explored; fixes include frame stacking (concatenate last k frames), recurrent architectures (LSTM over observation history), or state estimation with a belief filter`,
          `B) The Markov property is satisfied because the camera fully captures the current physical state; the issue is instead a poorly designed reward function that doesn't penalise wall collisions`,
          `C) The violation occurs because the transition function P(s'|s,a) is stochastic; the fix is to use a deterministic simulator to train the agent before deploying to the real robot`,
          `D) The observation space is too high-dimensional, which causes numerical instability in the policy network; the fix is to reduce image resolution until the Markov property holds`,
        ],
        answer: `A`
      },
      {
        q: `Why is γ = 0.99 harder to train with than γ = 0.95, even if both converge to a valid solution?`,
        options: [
          `A) γ=0.99 causes the reward to be discounted more aggressively, meaning the agent ignores long-term consequences and learns a myopic policy that is harder to improve`,
          `B) γ=0.99 requires more environment interactions because the agent needs to explore more steps before any reward is discounted to near zero`,
          `C) γ=0.99 is harder because it requires a denser reward function, which is more difficult to engineer than the sparse rewards used with γ=0.95`,
          `D) γ=0.99 extends the effective credit-assignment horizon to ~100 steps (vs ~20 for γ=0.95), causing higher Monte Carlo variance and slower TD propagation; rewards 100 steps away still contribute meaningfully, making value estimates noisy and requiring more samples to stabilise`,
        ],
        answer: `D`
      },
      {
        q: `A product team asks you to deploy an RL agent for content recommendation. What MDP design decisions do you make, and what can go wrong?`,
        options: [
          `A) The only design decision that matters is the action space (item selection); state and reward can be left at their defaults because the recommendation problem is essentially a supervised classification task`,
          `B) Key design decisions include state (user context + history length to preserve Markov property), action (item selection from potentially millions of candidates), reward (engagement proxy that risks Goodhart violations), and discount γ (affects learning speed vs long-term optimisation); failure modes include reward hacking, partial observability, non-stationarity, and off-policy distribution shift from historical data`,
          `C) The main design decision is choosing between on-policy and off-policy learning; using on-policy RL avoids all reward hacking and Goodhart problems by construction`,
          `D) MDP design is unnecessary because recommendation systems are contextual bandit problems; sequential state dependencies don't exist in practice so standard supervised learning on click logs suffices`,
        ],
        answer: `B`
      },
    ],
    takeaway: `The MDP's three most consequential design decisions are the Markov property, discount factor, and reward function — all of which are engineering choices, not mathematical formalities. The deepest insight is that γ close to 1 is not "better" but harder to train: it extends the credit-assignment horizon to 1/(1-γ) steps, increasing variance and slowing value propagation. Most production failures trace back not to algorithm choice but to reward hacking (arbitrary shaping changes the optimal policy), Markov violations (history needed but not included in state), or non-stationarity (the environment shifts faster than the agent adapts).`,
  },
  {
    id: 'bellman_equations',
    title: 'Bellman Equations',
    subtitle: 'V(s), Q(s,a), optimality equations, contraction mapping, curse of dimensionality',
    difficulty: 'foundational',
    estimatedMin: 45,
    tags: ['bellman', 'value function', 'dynamic programming', 'contraction', 'tabular'],
    summary: `Dynamic programming on MDPs hits an immediate problem: you can't compute the value of being in a state directly, because it depends on what you'd do from all future states, which also depend on future states. The Bellman equations break this circular dependency into a recursive consistency condition — the value of a state equals immediate reward plus discounted value of the next state under the best action. This recursion has a unique fixed point (the optimal value function) and iterating toward it is guaranteed to converge — but only in tabular or linear representations. The moment you introduce a neural network as the function approximator, the convergence guarantee vanishes. Understanding exactly why — that the bootstrap target depends on the same parameters being updated, violating the contraction property — is the root cause of every DQN instability pattern and is what separates genuine RL understanding from surface familiarity.`,
    keyPoints: [
      `**Computing the value of a state directly is circular: V(s) depends on the best action, which depends on future values, which depend on future actions.** The Bellman equations resolve this by expressing V as a fixed-point condition: V*(s) = max_a [R(s,a) + γ Σ_{s'} P(s'|s,a) V*(s')]. The solution to this equation is the optimal value function. The action-value function Q*(s,a) = R(s,a) + γ Σ_{s'} P(s'|s,a) max_{a'} Q*(s',a') adds the constraint that the first action is fixed, then optimal behaviour follows.`,
      `**The Bellman expectation equation for a fixed policy π is linear: V^π = (I - γP^π)^{-1} R^π.** You can solve it exactly with a matrix inverse. But the Bellman optimality equation contains a max operator, making it nonlinear — no matrix inverse exists. This forces iterative methods. Value iteration applies the Bellman operator T repeatedly: V_{k+1}(s) ← max_a [R(s,a) + γ Σ_{s'} P(s'|s,a) V_k(s')]. The contraction mapping theorem guarantees T is a γ-contraction in the L∞ norm — iterating from any V_0 converges to V* at geometric rate γ.`,
      `**Policy iteration alternates between two steps: (1) policy evaluation — solve V^π exactly; (2) policy improvement — π'(s) ← argmax_a Q^π(s,a).** The policy improvement theorem guarantees V^{π'} ≥ V^π everywhere. Proof: V^π(s) ≤ max_a Q^π(s,a) = Q^π(s,π'(s)); expanding the recursion inductively, this inequality propagates through all future steps until it gives V^{π'} ≥ V^π. The improvement is strict unless π was already optimal.`,
      `**The curse of dimensionality is why tabular methods are impractical in almost every real problem.** A 10-dimensional continuous state space discretised at 100 values per dimension has 100^10 = 10^20 states. Atari's Pong preprocessed to 84×84 grayscale pixels has 2^{7056} states — larger than the number of atoms in the observable universe. Storing and iterating V over this space is physically impossible. This is the fundamental reason neural networks are necessary in practice, not a matter of computational convenience.`,
      `**Function approximation breaks the Bellman convergence guarantee at a structural level.** With a neural network V_θ(s), the Q-learning update minimises ||V_θ(s) - (R + γ max_{a'} V_θ(s'))||^2. The target

$y = R + γ max V_θ(s') depends on θ simultaneously with the prediction. Thi$

s is not a fixed objective — as θ changes, so does y. The Bellman operator is no longer a contraction under neural network representation. Convergence is not guaranteed; divergence is theoretically possible and empirically common. Every DQN instability pattern traces back to this single structural fact.`,
      `**Temporal difference learning approximates the Bellman update online without waiting for the full return: V(s_t) ← V(s_t) + α[R_{t+1} + γV(s_{t+1}) - V(s_t)].** The bracketed term is the TD error δ_t — the Bellman residual for the current estimate. This converges to V^π for tabular and linear function approximation under standard conditions. With nonlinear approximation, convergence is not guaranteed and depends on architecture, learning rate, and data distribution.`,
    ],
    checkQuestions: [
      {
        q: `Write the Bellman optimality equation for Q*(s,a) and explain what makes it "nonlinear," unlike the Bellman expectation equation.`,
        options: [
          `A) Q*(s,a) = R(s,a) + γ Σ_{s'} P(s'|s,a) max_{a'} Q*(s',a') is nonlinear because P(s'|s,a) is a nonlinear stochastic function of the state and action`,
          `B) The Bellman optimality equation is nonlinear because Q*(s,a) appears on both sides of the equation, creating a circular dependency that cannot be resolved by matrix algebra`,
          `C) Q*(s,a) = R(s,a) + γ Σ_{s'} P(s'|s,a) max_{a'} Q*(s',a') is nonlinear due to the max_{a'} operator, unlike the Bellman expectation equation which uses Σ_{a'} π(a'|s') Q^π(s',a') — a linear weighted sum solvable as V^π = (I-γP^π)^{-1}R^π`,
          `D) The Bellman optimality equation is nonlinear because the discount factor γ multiplies Q* by itself recursively, producing a geometric series that requires nonlinear solvers`,
        ],
        answer: `C`
      },
      {
        q: `In policy iteration, why is policy improvement guaranteed to produce a policy at least as good as the current one? What is the formal argument?`,
        options: [
          `A) Policy improvement is guaranteed because at each step the algorithm tries all possible policies and selects the best one, so it can never select a worse policy than the current one`,
          `B) The policy improvement theorem holds because π'(s) = argmax_a Q^π(s,a) means V^π(s) ≤ Q^π(s,π'(s)); expanding this inequality inductively through all future steps shows V^{π'}(s) ≥ V^π(s) everywhere, with strict improvement unless π was already optimal`,
          `C) Policy improvement is guaranteed to be non-decreasing because the greedy policy minimises the Bellman error, which by the contraction mapping theorem implies the policy value is at least as high`,
          `D) The guarantee follows from the fact that Q^π(s,a) ≥ V^π(s) for all actions a, so any policy derived from the Q-function will have a value at least as high as the current policy`,
        ],
        answer: `B`
      },
      {
        q: `You are implementing Q-learning with a neural network and notice Q-values growing unboundedly during training. What is happening and how do you fix it?`,
        options: [
          `A) Q-value divergence is caused by bootstrapping instability: the target y = R + γ max_{a'} Q_θ(s',a') depends on the same θ being updated, creating a positive feedback loop; fixes include a target network (freeze θ^- for K steps), gradient/reward clipping, and a lower learning rate`,
          `B) Unbounded Q-values are caused by a reward function that is not bounded; the fix is to clip rewards to [-1, 1] and the problem will resolve itself without any architectural changes`,
          `C) The issue is that the neural network has too many parameters, causing it to memorise the training data and extrapolate Q-values to infinity for unseen states; the fix is to reduce network size`,
          `D) Q-value divergence is caused by using a replay buffer with too many transitions; old transitions from earlier in training have incorrect Q-value targets that destabilise current training`,
        ],
        answer: `A`
      },
      {
        q: `How many states does a simplified Atari game environment like Pong have, and why does this make tabular DP completely impractical?`,
        options: [
          `A) Pong has approximately 10^6 states (discretised pixel values), which is borderline tractable but too slow for real-time training without specialised hardware`,
          `B) Pong has roughly 10^20 states after preprocessing, which is large but could in theory be handled by distributed computing across a data centre`,
          `C) Pong has exactly 84×84×3 = 21,168 states after DQN preprocessing, which makes tabular DP tractable in theory but too slow in practice due to the large action space`,
          `D) Pong preprocessed to 84×84 grayscale pixels has 2^{7056} states — vastly larger than the atoms in the observable universe (~2^{266}); tabular DP requires storing V*(s) for every s and running Bellman updates over all states, which is physically impossible; DQN parameterises the value function in a compressed ~10M-parameter space instead`,
        ],
        answer: `D`
      },
    ],
    takeaway: `The contraction mapping guarantee is the theoretical bedrock of tabular RL — it tells you iterating the Bellman operator converges to the unique optimal value function. The guarantee breaks the moment you add a neural network, because the bootstrap target

$y = R + γ max Q_θ(s',a') depends on the same θ you're updating, which is not a contrac$

tion. That single structural fact is the root cause of Q-value divergence, and the target network is the engineering fix: freezing θ^{-} for K steps converts the moving target into a stationary one, restoring approximate contraction behaviour.`,
  },
  {
    id: 'temporal_difference',
    title: 'Temporal Difference Learning',
    subtitle: 'TD(0), TD(λ), SARSA vs Q-learning, deadly triad, divergence with FA',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['td learning', 'sarsa', 'q-learning', 'eligibility traces', 'deadly triad', 'off-policy'],
    summary: `Monte Carlo methods wait for the episode to end before updating value estimates — they're unbiased but require complete episodes and have high variance from summing many future rewards. Temporal difference learning avoids this by bootstrapping: updating the current estimate using the current estimate of the next state, without waiting for actual future rewards. This trades bias for variance and enables online updates. The critical fault line in RL is on-policy (SARSA — learn about the policy you're executing) versus off-policy (Q-learning — learn about the greedy policy while executing something else). Off-policy learning is far more sample-efficient because it can reuse experience from old policies, but it introduces the deadly triad — function approximation + bootstrapping + off-policy training — the precise combination that can cause divergence. All three components are simultaneously present in Q-learning with neural networks, and knowing exactly why they interact to cause instability is a standard senior ML interview question.`,
    keyPoints: [
      `**Monte Carlo methods estimate V(s) as the average observed return G_t from that state.** They're unbiased — they use actual future rewards — but require complete episodes and have high variance because G_t sums many future stochastic rewards. TD(0) replaces the actual return with a one-step bootstrap: V(s_t) ← V(s_t) + α[R_{t+1} + γV(s_{t+1}) - V(s_t)]. This introduces bias (V(s_{t+1}) is wrong early in training) but dramatically reduces variance, enabling larger step sizes and faster practical convergence.`,
      `**TD(λ) interpolates between TD(0) and Monte Carlo via eligibility traces.

$λ=0 gives pure TD(0); λ=1 gives pure Monte Carlo; intermediate λ controls the bias-variance tradeoff.**$

Eligibility traces e_t(s) track which states deserve credit for the current TD error: e_t(s) ← γλ e_{t-1}(s) + 1[S_t=s]. The update V(s) ← V(s) + α δ_t e_t(s) applies simultaneously to all recently visited states, weighted by how recently and frequently they were visited. This is efficient backward credit assignment without re-running n-step returns explicitly.`,
      `**SARSA is on-policy: it updates Q using the action actually taken at the next step.** Q(s_t,a_t) ← Q(s_t,a_t) + α[R_{t+1} + γQ(s_{t+1},a_{t+1}) - Q(s_t,a_t)]. This means SARSA converges to Q^π — the value of the behaviour policy, including its exploratory actions. In a windy gridworld with a cliff, SARSA learns a safer path away from the cliff edge because it accounts for the random ε-greedy actions that will occasionally push the agent off.`,
      `**Q-learning is off-policy: it updates Q using the greedy action at the next state regardless of what was actually taken.** Q(s_t,a_t) ← Q(s_t,a_t) + α[R_{t+1} + γ max_{a'} Q(s_{t+1},a') - Q(s_t,a_t)]. The max makes this off-policy — you're learning about the greedy policy while executing something else. This enables reuse of experience from old policies and replay buffers, making Q-learning vastly more sample-efficient. In the cliff gridworld, Q-learning finds the shorter path along the cliff edge (optimal for the greedy policy) but falls off during training.`,
      `**The deadly triad (Sutton & Barto): any two of function approximation, bootstrapping, and off-policy training can coexist stably.** All three together can cause divergence. Baird's counterexample (1995) demonstrates exact divergence with linear function approximation, bootstrapping, and off-policy data in a 7-state MDP. This is not a numerical precision issue — it's a structural property of the update rule. Q-learning with neural networks has all three components simultaneously.`,
      `**Why the triad causes divergence: with linear FA, the on-policy Bellman backup has a projected Bellman operator TΠ that is a γ-contraction in the 2-norm under on-policy state weighting.** Under off-policy data, the projection Π uses incorrect state weighting, and TΠ may not be a contraction at all. Repeated application of a non-contraction diverges. With neural networks, even on-policy training can diverge because the semi-gradient update ignores the ∂y/∂θ term from the moving target.`,
      `**Double Q-learning corrects a systematic upward bias in Q-learning.** The max operator in the Q-learning target causes overestimation: E[max_a Q(s',a)] ≥ max_a E[Q(s',a)] by Jensen's inequality (max is convex). Even if individual Q estimates are unbiased, the max over random variables is upward biased. Double Q-learning uses two networks: Q_A selects the action (argmax), Q_B evaluates it. Expected overestimation is eliminated because the argmax from A is evaluated by independent estimates from B.`,
      `**n-step TD returns interpolate between TD(0) and Monte Carlo: G_t^{(n)} = R_{t+1} + γR_{t+2} + ... + γ^{n-1}R_{t+n} + γ^n V(s_{t+n}).** Larger n reduces bootstrapping bias (more real rewards, less reliance on V estimates) at the cost of higher variance (summing more future stochastic rewards). In practice

$n=5-20 often outperforms both extremes, and the λ parameter in TD(λ) traces a continuous path through this$

space.`,
    ],
    checkQuestions: [
      {
        q: `SARSA and Q-learning have identical updates except for one term. What is that term, and what are the theoretical and practical implications of the difference?`,
        options: [
          `A) SARSA uses the current state value V(s_t) while Q-learning uses the next state value V(s_{t+1}); this makes SARSA on-policy and Q-learning off-policy, but both converge to the same optimal Q-function given sufficient exploration`,
          `B) SARSA uses the learning rate α for every update while Q-learning adapts the learning rate based on visit counts; this makes Q-learning more stable but slower to converge in practice`,
          `C) The difference is the next-state action term: SARSA uses Q(s_{t+1}, A_{t+1}) where A_{t+1} ~ π (on-policy, converges to Q^π); Q-learning uses max_{a'} Q(s_{t+1}, a') (off-policy, converges to Q*); Q-learning is more sample-efficient via replay buffers but introduces the deadly triad, making it susceptible to divergence with neural networks`,
          `D) SARSA uses the immediate reward R_{t+1} while Q-learning uses the cumulative discounted return G_t; this makes Q-learning unbiased but higher variance, while SARSA is biased but lower variance`,
        ],
        answer: `C`
      },
      {
        q: `Explain Baird's counterexample intuitively. Why does Q-learning with linear function approximation diverge even in a simple MDP?`,
        options: [
          `A) In Baird's counterexample, the projected Bellman operator TΠ is a γ-contraction under on-policy state weighting but under off-policy data the projection Π uses incorrect weighting, making TΠ a non-contraction; repeated application of a non-contraction diverges; fixes include importance sampling (reweight updates by π/μ) or gradient TD methods (GTD, GTD2) that minimise the projected Bellman error with a true gradient`,
          `B) Baird's counterexample shows divergence because Q-learning with linear FA uses a learning rate that is too high for the specific MDP structure, and the fix is to use smaller step sizes`,
          `C) Divergence in Baird's counterexample occurs because the reward signal is zero everywhere, causing the Q-function to receive no gradient and drift randomly under numerical noise`,
          `D) The counterexample demonstrates that linear function approximation cannot represent the optimal Q-function accurately, so approximation error accumulates over iterations until values diverge`,
        ],
        answer: `A`
      },
      {
        q: `You are training a Q-learning agent on a game environment and observe that the Q-values grow from ~10 to ~10^6 over 500k steps, with training reward staying flat. Diagnose and fix.`,
        options: [
          `A) Q-values growing while reward stays flat means the agent is successfully learning but the reward function has a scaling bug; multiply all rewards by a constant factor to bring Q-values back to a reasonable range`,
          `B) Runaway Q-values with flat reward is a deadly triad symptom: off-policy replay + bootstrapping + FA creates a positive feedback loop where max Q overestimates → inflates target → inflates Q further; fixes in order: target network (freeze Q_{θ^-} for 10k steps), Huber loss/clipping, reward clipping, lower learning rate, and Double DQN to reduce max-operator overestimation bias`,
          `C) The divergence is caused by having too large a replay buffer; old transitions from a weaker policy corrupt the current training signal, causing overestimation; reduce the buffer size to only keep the most recent 10k transitions`,
          `D) Flat reward with growing Q-values indicates the exploration rate ε is too high, causing the agent to take random actions that generate high Q-estimates for unexplored states; reduce ε to near zero immediately`,
        ],
        answer: `B`
      },
    ],
    takeaway: `The deadly triad — function approximation, bootstrapping, off-policy data — is the precise combination that causes divergence in TD learning because off-policy data corrupts the projection weighting that the convergence proof requires. SARSA avoids the off-policy component at the cost of sample efficiency; understanding why that tradeoff exists — and when each choice is correct — is the key distinction between surface familiarity and genuine mastery of RL stability.`,
  },
  {
    id: 'deep_q_networks',
    interactiveId: 'q_learning_viz',
    title: 'Deep Q-Networks',
    subtitle: 'Experience replay, target network, Double DQN, Dueling, Prioritized Replay, failure modes',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['dqn', 'experience replay', 'target network', 'double dqn', 'dueling', 'prioritized replay'],
    summary: `Q-learning with a neural network was known to be unstable before DQN — the deadly triad (function approximation, bootstrapping, off-policy learning) causes the training signal to be a moving target and the samples to be highly correlated, both of which break standard gradient descent assumptions. DQN's two innovations — experience replay and a target network — are engineering solutions to these two specific problems, not arbitrary design choices. Experience replay breaks temporal correlation to satisfy SGD's IID assumption; the target network freezes the bootstrap target to prevent the moving-target feedback loop. Without understanding why each component is necessary, you can't diagnose when DQN is failing or know which of its known failure modes you're hitting. Beyond original DQN, the Rainbow paper identified six independent improvements that each address a distinct remaining failure mode — knowing which improvement targets which failure is the differentiator.`,
    keyPoints: [
      `**Q-learning with neural networks fails without replay because consecutive transitions are highly correlated.** If the agent is exploring room A, all recent transitions come from room A, and gradient updates overfit Q estimates for room A while catastrophically forgetting room B. This violates SGD's IID assumption: gradient estimates need to be drawn from the full training distribution, not a narrow slice of recent experience. Experience replay stores transitions (s_t, a_t, r_{t+1}, s_{t+1}) in a buffer and samples random mini-batches, breaking temporal correlation and reusing each transition for multiple gradient updates.`,
      `**Q-learning with neural networks also fails without a target network because the bootstrap target R + γ max_{a'} Q_θ(s',a') depends on the same θ being updated.** Each gradient step moves both the prediction and the target in the same direction, creating a positive feedback loop that amplifies Q-values until they diverge. The target network freezes θ^{-} for C steps (typically 1000-10000), converting the moving target into a stationary supervised label for C steps. This breaks the feedback loop and approximates the tabular contraction behaviour.`,
      `**DQN training loop: every step, push (s,a,r,s') to replay buffer.** Every 4 steps: sample 32-64 transitions, compute targets with θ^-, update θ by gradient descent on Huber loss. Every C steps: θ^- ← θ. The asymmetry — update θ every 4 steps, update θ^- every C=1000 steps — is empirically critical. Too-frequent target updates restore the moving-target problem; too-infrequent updates cause the target to lag too far behind the improving policy.`,
      `**Double DQN addresses a systematic upward bias that remains even after the target network fix.** The DQN target max_{a'} Q_{θ^-}(s',a') uses the same network to both select the action (argmax) and evaluate its value. Even if Q estimates are unbiased individually, E[max_a Q(s',a)] ≥ max_a E[Q(s',a)] by Jensen's inequality — the max over noisy estimates is upward biased. Double DQN decouples these roles: θ selects the action, θ^- evaluates it. Expected overestimation is eliminated, giving +3-5% on Atari.`,
      `**Dueling DQN decomposes Q(s,a) = V(s) + A(s,a), where A(s,a) is the advantage — how much better is action a than average?** The network has two heads that merge: Q(s,a) = V(s) + A(s,a) - mean_{a'} A(s,a'). Subtracting the mean advantage makes A identifiable and V interpretable. The benefit comes in states where the action choice barely matters: the V head can be updated from any transition in that state, while the A head only needs to learn relative differences. V learns faster, leading to better state representations.`,
      `**Prioritized Experience Replay (PER) fixes a second problem with uniform replay: most transitions in the buffer are already well-understood by the network (TD error ≈ 0), so sampling them uniformly wastes gradient updates on uninformative transitions.** PER samples with probability proportional to |δ_t|^α — high TD error signals a surprising, informative transition. Importance sampling weights

$w_i = (1/N · 1/P(i))^β correct the bias from non-uniform sampling. β anneals from 0.4 to 1.0 during training$

, giving +5-10% on Atari.`,
      `**DQN fails on continuous action spaces because the target requires argmax_{a'} Q(s',a') — computing the maximum over a continuous space is intractable.** For robot joint torques, motor commands, or any real-valued action, Q-learning with a discrete argmax cannot be used. The right algorithms for continuous control are policy gradient methods: DDPG (deterministic policy gradient directly parameterises the argmax), SAC (soft actor-critic adds entropy regularisation to prevent premature determinism), and TD3 (Twin Delayed Deep Deterministic — addresses Q overestimation in actor-critic).`,
      `**DQN fails on sparse rewards because the replay buffer fills with transitions that all have TD error ≈ 0.** There's no gradient signal pointing toward the reward. The agent learns nothing because it never sees nonzero reward. Fixes: reward shaping (add dense intermediate rewards), Hindsight Experience Replay (HER — relabel failed episodes as if the goal was what was actually achieved, immediately creating positive reward signal), or curiosity-driven exploration (intrinsic rewards for novel states drive the agent to explore until it accidentally finds the true reward).`,
      `**Rainbow combines six improvements (Double DQN, Prioritized Replay, Dueling, Multi-step returns, Distributional RL, NoisyNets), each addressing a distinct failure mode.** The distributional component — learning the full return distribution P(G | s,a) rather than just E[G | s,a] — is often the single most impactful addition beyond Double DQN, because it provides richer gradient signal and implicitly addresses the overestimation bias from the mean-aggregation in standard Q-learning.`,
    ],
    checkQuestions: [
      {
        q: `Why exactly does experience replay require IID samples? What happens if you train on correlated sequential transitions from the current trajectory?`,
        options: [
          `A) Experience replay doesn't strictly require IID samples; it just improves sample efficiency by reusing transitions; training on sequential transitions works fine but is slower`,
          `B) IID samples are required because the neural network architecture assumes independent inputs; sequential transitions violate this assumption and cause gradient explosions in the backpropagation step`,
          `C) IID samples are needed because the Bellman backup requires that consecutive states be statistically independent; if they are correlated, the target network update rule produces inconsistent Q-value targets`,
          `D) Training on correlated sequential transitions violates SGD's IID requirement: gradient estimates reflect only the recent trajectory's local statistics, causing the network to overfit that region while catastrophically forgetting others; the policy then changes to visit a new region, causing oscillations; replay over a large buffer of past transitions provides temporally decorrelated samples matching the full training distribution`,
        ],
        answer: `D`
      },
      {
        q: `What is the difference between Dueling DQN and standard DQN architecturally, and in what types of states does Dueling provide the largest benefit?`,
        options: [
          `A) Dueling DQN uses two completely separate networks — one for even timesteps and one for odd timesteps — to reduce correlation between consecutive updates; it benefits most in environments with sparse rewards`,
          `B) Dueling DQN adds a secondary loss on state visitation counts to encourage exploration; it benefits most in environments where many states have equal Q-values, making exploration uniformly random`,
          `C) Dueling DQN uses separate streams for V(s) and A(s,a) merged as Q(s,a) = V(s) + A(s,a) - mean_a A(s,a); the largest benefit is in states where action choice barely matters — V can be updated from any transition in that state, learning faster than a single-head network where all Q values must be updated jointly`,
          `D) Dueling DQN replaces the Q-function output layer with a distributional layer that outputs quantiles of the return distribution; it benefits most in states with high reward variance`,
        ],
        answer: `C`
      },
      {
        q: `You are applying DQN to a robotic manipulation task where the reward is 1 only when the robot successfully places an object and 0 otherwise, with episodes of 200 steps. After 10M steps, the policy never achieves reward > 0. What is happening and what are your next steps?`,
        options: [
          `A) The issue is that DQN cannot learn manipulation tasks; switching to a policy gradient algorithm like PPO will resolve the sparse reward problem because PPO uses on-policy data that is always relevant to the current policy`,
          `B) The network has overfit to the 0-reward signal; the fix is to regularise the Q-network with dropout and weight decay so it generalises better to the success state it has never seen`,
          `C) 10M steps is insufficient for robotic manipulation; continuing training for 100M steps will allow random exploration to accidentally discover the success state often enough for Q-learning to propagate the reward signal back`,
          `D) The replay buffer contains only 0-reward transitions, providing no gradient signal about what to do; next steps in order: curriculum learning (start with object near target), Hindsight Experience Replay (relabel failed trajectories as reaching the actual achieved state), dense reward shaping, demo-augmented RL with expert demonstrations, and increased exploration via curiosity modules`,
        ],
        answer: `D`
      },
    ],
    takeaway: `DQN's two key innovations solve two distinct problems created by applying Q-learning to neural networks. Experience replay breaks temporal correlation because SGD requires IID samples — consecutive transitions from the same trajectory cause the gradient to overfit to that trajectory's local statistics. The target network freezes the bootstrap target because the moving-target problem (prediction and target depending on the same θ) is a positive feedback loop that amplifies Q-values until divergence. Every DQN failure mode — Q-value explosion, sparse reward failure, continuous action failure — can be traced to one of these two structural issues or to a downstream failure mode addressed by one of the Rainbow improvements.`,
  },
  {
    id: 'policy_gradients',
    title: 'Policy Gradients',
    subtitle: 'REINFORCE, log-derivative trick, high variance, baselines, why PG beats value-based',
    difficulty: 'intermediate',
    estimatedMin: 50,
    interactiveId: 'policy_gradient_viz',
    tags: ['policy gradient', 'reinforce', 'log-derivative', 'variance reduction', 'baseline', 'continuous actions'],
    summary: `Value-based methods learn Q(s,a) and derive a policy by acting greedily — argmax over Q values. In continuous action spaces like robot joints or motor torques, computing this argmax is intractable. In adversarial settings, the optimal policy is genuinely stochastic (any deterministic policy is exploitable), but greedy Q-learning always produces a deterministic policy. Policy gradient methods sidestep this by directly parameterising and optimising the policy π_θ(a|s). The Policy Gradient Theorem gives the gradient of expected return without requiring a model of the environment transitions. But REINFORCE, the direct implementation, has catastrophically high variance: the episode return G_t used as the gradient weight can range across orders of magnitude, making gradient estimates noisy to the point of uselessness. Baseline subtraction reduces this variance without introducing any bias — and the proof of why is the mathematical foundation of all actor-critic methods.`,
    keyPoints: [
      `**Value-based methods derive the policy as π(s) = argmax_a Q(s,a).** This argmax is trivial over a discrete action set, but intractable over a continuous space like 30 robot joint torques. Policy gradient methods directly parameterise π_θ(a|s) as a probability distribution (e.g., Gaussian for continuous actions) and optimise θ to maximise expected return. No argmax required — actions are sampled from the distribution.`,
      `**Policy Gradient Theorem: ∇_θ J(θ) = E_{τ~π_θ}[Σ_t ∇_θ log π_θ(a_t|s_t) · Q^{π_θ}(s_t,a_t)].** The log-derivative trick makes this tractable: ∇_θ π_θ(a|s) = π_θ(a|s) · ∇_θ log π_θ(a|s). This converts the gradient of an expectation with respect to the sampling distribution into an expectation of the gradient of the log policy — computable by sampling trajectories. The environment's transition model P(s'|s,a) never appears, making this model-free.`,
      `**REINFORCE is the direct application of the theorem: sample full episode, for each timestep compute G_t (return from that step onward), update θ ← θ + α Σ_t G_t ∇_θ log π_θ(a_t|s_t).** This is unbiased — G_t is the actual future return. The problem is variance: G_t sums all future stochastic rewards, so it varies enormously across episodes. A good action followed by bad luck looks identical to a genuinely bad action. The gradient oscillates rather than pointing consistently toward improvement.`,
      `**In adversarial settings, the optimal policy must be stochastic.** In rock-paper-scissors, any deterministic policy is exploitable — the opponent plays the best response and wins with certainty. The Nash equilibrium is (1/3, 1/3, 1/3). Value-based methods converge to the greedy policy π*(s) = argmax_a Q*(s,a), which is always deterministic — they cannot represent a mixed-strategy Nash equilibrium. Policy gradient methods parameterise π_θ(a|s) as a distribution and can converge to the mixed strategy when the gradient pushes all Q-values toward equality.`,
      `**Baseline subtraction resolves the high-variance problem without introducing bias.** Replace G_t with (G_t - b(s_t)) where b(s_t) depends only on the state, not the action. The gradient is unchanged: E_{a~π}[b(s) · ∇ log π(a|s)] = b(s) · E_{a~π}[∇ log π(a|s)] = b(s) · ∇_θ Σ_a π(a|s) = b(s) · 0 = 0. The policy sums to 1 over actions; its gradient sums to 0. Any state-dependent baseline can be subtracted without biasing the gradient estimate.`,
      `**The optimal baseline choice is V^π(s_t), giving the advantage A(s_t,a_t) = G_t - V^π(s_t) as the policy gradient weight.** The advantage answers: "how much better was this action than average?" Actions with positive advantage get reinforced; actions with negative advantage get discouraged. Centering G_t around V(s_t) dramatically reduces the variance because the advantage fluctuates near zero rather than taking on the large absolute values of G_t.`,
      `**Policy gradient variance has three sources: episode-level variance (different trajectory samples), action randomness (each a_t ~ π), and environment stochasticity (same action produces different outcomes).** Variance reduction techniques address each source: baseline/critic addresses episode-level variance, actor-critic replaces G_t with a learned Q estimate (lower variance at the cost of bias), GAE uses a weighted average of n-step returns (λ interpolates the bias-variance tradeoff), and importance sampling with clipping (PPO) limits the gradient update magnitude.`,
    ],
    checkQuestions: [
      {
        q: `Derive why E_{a~π}[b(s) · ∇_θ log π_θ(a|s)] = 0 for any baseline b that depends only on the state, not the action.`,
        options: [
          `A) E_{a~π}[b(s) · ∇_θ log π_θ(a|s)] = 0 because b(s) factors out of the expectation over a, and Σ_a ∇_θ π_θ(a|s) = ∇_θ Σ_a π_θ(a|s) = ∇_θ 1 = 0; the policy always sums to 1 over actions, so its gradient with respect to θ sums to zero; only action-dependent baselines would bias the estimate`,
          `B) The expectation equals zero because the log-derivative trick produces a cancellation with the policy denominator, and any baseline multiplied by a cancelled term must be zero regardless of what the baseline depends on`,
          `C) The result holds because b(s) is subtracted symmetrically from all actions, so the positive contributions from good actions exactly cancel the negative contributions from bad actions in expectation`,
          `D) E_{a~π}[b(s) · ∇_θ log π_θ(a|s)] = 0 only approximately, not exactly; the approximation error is bounded by the variance of the baseline and vanishes as the number of samples grows to infinity`,
        ],
        answer: `A`
      },
      {
        q: `You are training a continuous-control robot with REINFORCE and the policy fails to improve despite 50,000 episodes. What is likely happening and what changes do you make?`,
        options: [
          `A) The problem is insufficient data; 50,000 episodes is simply not enough for REINFORCE to converge on continuous control; switch to a model-based approach that can learn from far fewer interactions`,
          `B) REINFORCE gradients are likely dominated by variance from the full episode return G_t; fixes include: add a value baseline V_φ(s) to get advantage A_t = G_t - V_φ(s_t), use n-step returns, switch to actor-critic (A2C/PPO) for lower-variance gradient estimates, check policy entropy to ensure exploration, and normalise rewards to a stable scale`,
          `C) The policy network architecture is too small to represent the continuous control policy; increase network capacity with more layers and wider hidden dimensions until the policy can represent the optimal action for every state`,
          `D) The issue is that REINFORCE uses the full episode return which creates a non-stationary learning signal; the fix is to use a fixed discount factor γ=1.0 so all timesteps receive equal weight and the gradient is stationary`,
        ],
        answer: `B`
      },
      {
        q: `In a two-player zero-sum game like poker, why is a stochastic optimal policy strictly necessary, and what does this mean for the choice of algorithm?`,
        options: [
          `A) Stochastic policies are not strictly necessary in poker; deterministic policies can be optimal if the opponent does not observe the agent's action distribution`,
          `B) A stochastic optimal policy is needed because the game tree has too many states for a deterministic policy to memorise all optimal actions; the mixed strategy compresses this into a simple probability distribution`,
          `C) Any deterministic policy in a zero-sum adversarial game is exploitable — the opponent can learn and play the best response, winning with certainty; the Nash equilibrium requires a mixed strategy (e.g., 1/3 each in rock-paper-scissors); value-based methods cannot represent this because argmax Q*(s,a) always produces a deterministic policy; policy gradient methods parameterising π_θ(a|s) as a distribution CAN converge to the mixed strategy via self-play or CFR`,
          `D) Stochastic policies are needed in poker specifically because partial observability (hidden cards) makes any deterministic policy exploitable; in fully observable zero-sum games, deterministic optimal policies always exist`,
        ],
        answer: `C`
      },
    ],
    takeaway: `The log-derivative trick is the mathematical core of all policy gradient methods: it converts the gradient of an expectation under a parameterised distribution into an expectation of the gradient of the log policy, enabling Monte Carlo gradient estimation without differentiating through the environment. The baseline subtraction insight — any state-dependent baseline can be subtracted without biasing the gradient because E_{a~π}[∇ log π] = 0 — is what distinguishes someone who memorised REINFORCE from someone who understands why variance reduction works. These two facts together are the complete foundation of actor-critic methods.`,
  },
  {
    id: 'actor_critic',
    title: 'Actor-Critic Methods',
    subtitle: 'A2C, A3C, advantage function, GAE, async vs sync, bias-variance in advantage estimation',
    difficulty: 'intermediate',
    estimatedMin: 55,
    tags: ['actor-critic', 'a2c', 'a3c', 'advantage', 'gae', 'bias-variance'],
    summary: `REINFORCE has high variance because it uses the full episode return G_t as the policy gradient weight — an action early in a long episode gets credited for everything that happens afterward, even if later actions caused the good outcomes. A critic addresses this directly: it learns a value function V(s), and the policy gradient weight becomes A(s,a) = G_t - V(s_t) — the advantage, which asks "how much better was this specific action than average?" The zero-mean property of the advantage (E_{a~π}[A(s,a)] = 0) means it carries only relative information, centering the gradient signal and dramatically reducing variance. But replacing G_t with the one-step TD error δ_t = r_t + γV(s_{t+1}) - V(s_t) introduces bias from the imperfect critic. GAE (Generalized Advantage Estimation) provides the principled interpolation between these extremes via a λ parameter that controls how much you trust the critic versus real rewards.`,
    keyPoints: [
      `**REINFORCE weights the policy gradient by G_t — the full return from step t onward.** An action taken at step 10 of a 100-step episode gets credited for everything that happens in steps 11-100, even if those outcomes were caused by different actions. This credit attribution is random noise, not signal. A critic V_φ(s) provides the expected return from state s under the current policy — subtracting V(s_t) from G_t removes the mean and keeps only the signal about whether this specific action was above or below average.`,
      `**Advantage function: A^π(s,a) = Q^π(s,a) - V^π(s).** E_{a~π}[A^π(s,a)] = 0 because V^π(s) = Σ_a π(a|s) Q^π(s,a) = E_{a~π}[Q^π(s,a)]. This zero-mean property is the core benefit: unlike raw Q(s,a), which can be large and positive for all actions in a high-value state (adding large constant noise to the gradient), A(s,a) is centred at zero and carries only relative quality information. Positive advantage → reinforce; negative advantage → discourage.`,
      `**One-step advantage estimate Â_t = r_t + γV_φ(s_{t+1}) - V_φ(s_t) = δ_t (the TD error).** Lowest variance — uses only one reward and two value lookups. High bias — relies almost entirely on V_φ, which is inaccurate early in training. Every error in V propagates directly into the advantage estimate and therefore into the policy gradient.`,
      `**Monte Carlo advantage Â_t = G_t - V_φ(s_t) uses actual returns.** Zero bootstrapping bias — real rewards, not V estimates. High variance — G_t sums many future stochastic rewards. The bias-variance tradeoff between one-step TD and MC is exactly the same as the TD(0) versus MC tradeoff for value estimation, but now it affects the policy gradient directly.`,
      `**GAE (Generalized Advantage Estimation): Â_t^{GAE} = Σ_{l=0}^∞ (γλ)^l δ_{t+l} = δ_t + γλδ_{t+1} + (γλ)^2δ_{t+2} + ....

$λ=0: one-step TD error only. λ=1: MC advantage.** Intermediate λ controls how far into the future you tr$

ust real rewards over the critic. The (γλ)^l decay limits the influence of distant TD errors — which are dominated by V(s_{t+l+1}), the inaccurate critic. As training progresses and V_φ improves, you can increase λ toward 1 to reduce bias.`,
      `**A3C runs multiple actor threads in parallel, each with its own environment instance.** Each thread computes gradients asynchronously and pushes them to a shared parameter server. Asynchrony provides sample decorrelation without a replay buffer. But asynchronous gradients are stale — a thread computing gradients with θ from 10 updates ago is introducing off-policy error that can destabilise training.`,
      `**A2C (synchronous A3C) waits for all workers before updating parameters.** This eliminates stale gradients and allows correct advantage estimation using a shared critic. More stable than A3C. On modern multi-GPU hardware where synchronous batching is efficient, A2C is preferred — the stale-gradient instability of A3C provides no throughput benefit compared to batching across synchronised workers.`,
      `**When actor and critic share a network trunk (common for computational efficiency), gradients from the policy loss and value loss can conflict — a gradient step beneficial for the policy representation may be harmful for the value representation.** Standard fix: scale the value loss by a coefficient c_V = 0.5 to prevent critic gradients from dominating the shared representation, and add entropy regularisation -β·H(π) to prevent the policy from collapsing to a deterministic mode before the critic is accurate.`,
    ],
    checkQuestions: [
      {
        q: `Prove that E_{a~π}[A^π(s,a)] = 0. Why does this property make the advantage a better policy gradient weight than Q(s,a)?`,
        options: [
          `A) E_{a~π}[A^π(s,a)] = E_{a~π}[Q^π(s,a)] - V^π(s) = V^π(s) - V^π(s) = 0, since V^π(s) = E_{a~π}[Q^π(s,a)] by definition; this zero-mean property centres the gradient signal so positive advantage reinforces above-average actions and negative advantage discourages below-average ones, removing the large constant mean of V^π(s) that would dominate raw Q(s,a) and add variance without directional signal`,
          `B) The advantage has zero mean because it is normalised during training by dividing by its standard deviation, which centres the gradient signal; Q(s,a) has non-zero mean because it is not normalised`,
          `C) E_{a~π}[A^π(s,a)] = 0 only holds when the policy is at a Nash equilibrium; during training the advantage has non-zero mean, which is why it still provides useful gradient signal for improvement`,
          `D) The advantage has zero mean by construction since it subtracts the average reward; Q(s,a) is a better gradient weight in states with sparse rewards because it retains the magnitude of the return signal`,
        ],
        answer: `A`
      },
      {
        q: `In GAE, what does setting

$λ=0 vs λ=0.95 vs λ=1 do to the advantage estimate? When wo$

uld you choose each?`,
        options: [
          `A) λ=0 uses only immediate rewards (no bootstrapping), giving unbiased but high-variance estimates; λ=1 uses the full critic value (pure bootstrapping), giving low-variance but high-bias estimates; λ=0.95 is a middle ground; choose λ=0 when episodes are short and choose λ=1 when the critic is well-trained`,
          `B) λ controls the learning rate for the critic, not the advantage estimate; λ=0 means the critic updates once per episode and λ=1 means it updates every step; λ=0.95 is the standard that balances critic update frequency with policy stability`,
          `C) λ=0 produces advantage estimates identical to Monte Carlo returns; λ=1 uses only the one-step TD error; λ=0.95 is an exponential moving average of the reward signal; choose λ=0 for sparse reward environments`,
          `D) λ=0 uses the one-step TD error δ_t only (high bias from V, low variance); λ=0.95 considers ~20 future steps (moderate bias/variance, empirically best for most tasks like PPO); λ=1 uses full MC advantage G_t - V(s_t) (zero bias, high variance); choose λ=0 when the critic is accurate, λ=0.95 as the standard default, λ=1 for short episodes or when the critic is very inaccurate`,
        ],
        answer: `D`
      },
      {
        q: `You are training an actor-critic agent and notice that the actor loss keeps decreasing but the critic loss oscillates and never converges. The agent's reward also oscillates. What is happening?`,
        options: [
          `A) Decreasing actor loss with oscillating critic loss is normal early in training; the actor converges faster than the critic by design; continue training until the critic stabilises after approximately 10× more steps`,
          `B) The actor and critic are destabilising each other: the actor updates rapidly while the critic cannot track the changing policy's value function, making advantage estimates noisy and injecting bad gradient into the actor, which changes the policy further in a feedback loop; fixes include lowering the actor learning rate, adding PPO-style clipping to constrain policy change, running multiple critic updates per actor update, or reducing the shared backbone learning rate`,
          `C) The oscillating critic is caused by the replay buffer containing too many transitions from the old policy; empty the buffer and restart training with only on-policy data from the current policy`,
          `D) The oscillating critic loss means the reward model is non-stationary; this is an environment problem caused by distribution shift in the data, not an algorithmic issue; the only fix is to collect more diverse training data`,
        ],
        answer: `B`
      },
    ],
    takeaway: `GAE's λ parameter is not an arbitrary smoothing term — it precisely controls how much the advantage estimate relies on the critic versus real rewards.

$λ=0 trusts the critic entirely (low variance, high bias from imperfect V); λ=1 uses actual returns (zero bias, high$

variance). The zero-mean property of the advantage — E_{a~π}[A(s,a)] = 0 — is what makes it a better policy gradient weight than raw Q: it removes the large constant mean of the value function, centering the gradient signal and reducing variance without any bias. These two facts together explain why PPO with GAE converges reliably where REINFORCE doesn't.`,
  },
  {
    id: 'ppo_trpo',
    title: 'PPO and TRPO',
    subtitle: 'Trust region, KL constraint, clipped surrogate, entropy bonus, implementation details',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['ppo', 'trpo', 'trust region', 'kl divergence', 'clipped objective', 'entropy'],
    summary: `Vanilla policy gradient updates can cause catastrophic policy collapse: a single large gradient step can move the policy so far from the data-collection policy that the advantage estimates — computed under the old policy — become completely wrong. The new policy may be dramatically worse, and because the gradient estimate is now based on an invalid distribution, the next update can't recover. TRPO formalises this as a KL-divergence constraint on how far the new policy can move, providing a theoretically grounded monotonic improvement guarantee but requiring expensive second-order optimisation. PPO approximates TRPO's trust region with a clipped objective that kills gradients when the policy ratio

$r_t = π_θ/π_old moves outside [1-ε, 1+ε] — achieving the same protective effect$

with only first-order computation. PPO has become the default algorithm for RLHF training of LLMs, and understanding what the clip actually does — and why too many mini-batch epochs defeats it — is essential for diagnosing production training failures.`,
    keyPoints: [
      `**Vanilla policy gradient with importance sampling reuses data: L^{IS}(θ) = E_{a~π_old}[(π_θ(a|s)/π_old(a|s)) · A^{π_old}(s,a)].** The ratio r_t = π_θ/π_old adjusts for the distribution shift between old and new policy. If unconstrained, maximising L^{IS} can move π_θ far from π_old, making the importance weights extreme (r_t → ∞ or 0) and the advantage estimates unreliable — the entire gradient estimate describes a distribution the new policy no longer operates in.`,
      `**TRPO constrains how far the new policy can move: max L^{IS}(θ) subject to E_s[KL(π_old(·|s) ‖ π_θ(·|s))] ≤ δ.** The theory guarantees that if the KL constraint is satisfied, the true expected return is lower-bounded by L^{IS} minus a KL-dependent penalty — monotonic improvement is guaranteed. The cost is second-order optimisation: computing the natural gradient requires Fisher information matrix-vector products and a conjugate gradient + line search, making each update expensive and complex to implement.`,
      `**PPO replaces the KL constraint with a clipped objective: L^{CLIP}(θ) = E[min(r_t A_t, clip(r_t, 1-ε, 1+ε) A_t)].** When A_t > 0 and r_t > 1+ε: the policy is already much more likely to take this good action, so the clipped value (1+ε)·A_t is smaller and the gradient is killed. When A_t < 0 and r_t < 1-ε: the policy has already moved far from this bad action, so again the gradient is killed. The clip enforces a soft trust region without any second-order computation — just vanilla Adam.`,
      `**PPO outperforms TRPO in practice for four reasons.** First-order only: no conjugate gradient or Fisher matrix, much faster per update. Multiple mini-batch updates: PPO runs K=4-10 gradient steps per collected batch; TRPO does one, giving PPO better data efficiency. Simpler hyperparameter: ε=0.2 versus TRPO's δ. And the clip may actually be more conservative than the KL constraint in practice, because it's a hard limit on r_t rather than a soft penalty.`,
      `**Entropy bonus prevents premature convergence to a deterministic policy: L(θ) = L^{CLIP}(θ) + β · H(π_θ(·|s)).** Without entropy regularisation, the policy can collapse to always taking the currently best action, halting exploration before the critic is accurate. In RLHF training of LLMs, this becomes a KL penalty against the pre-trained SFT model:

$L = reward_model_score - β · KL(π_θ ‖ π_SFT). This serves double duty — pre$

venting both premature convergence and reward hacking by keeping the LLM close to the SFT distribution where the reward model is calibrated.`,
      `**PPO hyperparameters that matter: ε (clip ratio) = 0.1-0.2 — too large means no trust region effect.** K (mini-batch epochs) = 4-10 — more epochs extract more data efficiency but cause the policy to drift further from π_old, potentially defeating the trust region. The fraction of clipped gradient updates should be 10-30%; if it's 90%+, the policy is drifting too far per batch and K should be reduced. GAE λ = 0.95, γ = 0.99, value function coefficient c_V = 0.5, max gradient norm = 0.5.`,
      `**PPO for LLM fine-tuning (RLHF): the actor is the LLM; the critic is a separate value head on the same base model.** The environment is text generation: state = tokens generated so far, action = next token (vocabulary-sized discrete action). The reward comes from a reward model trained on human preferences. The critical design decision is β in the KL penalty — too low allows reward hacking, too high means the policy barely changes from the SFT baseline. β is typically 0.01-0.1 and is often decayed during training.`,
      `**TRPO provides a monotonic improvement guarantee: J(π_new) ≥ J(π_old) - C · max_s KL(π_old(·|s) ‖ π_new(·|s)).** PPO has no such formal guarantee — the clipping is a heuristic. For safety-critical applications (healthcare robotics, autonomous driving) where you need formal guarantees that policy updates never cause catastrophic performance regression, TRPO or constrained MDP formulations are required, not PPO.`,
    ],
    checkQuestions: [
      {
        q: `Explain what the PPO clip objective does in the case where A_t > 0 (good action) and the new policy probability is much higher than the old one (r_t >> 1+ε).`,
        options: [
          `A) When A_t > 0 and r_t >> 1+ε, the clip selects min(r_t · A_t, (1+ε) · A_t) = (1+ε) · A_t, and since (1+ε) · A_t is a constant with respect to θ at the clip boundary, the gradient with respect to the policy ratio is killed; this prevents further reinforcing an action once the policy has already moved far beyond the trust region boundary`,
          `B) When A_t > 0 and r_t >> 1+ε, the PPO objective applies a penalty proportional to how far r_t exceeds 1+ε, discouraging very large policy updates while still providing a positive gradient signal toward the good action`,
          `C) When A_t > 0 and r_t >> 1+ε, the clip objective is identical to the unclipped importance-sampling objective; clipping only activates when r_t < 1-ε (bad actions), not when r_t > 1+ε (good actions)`,
          `D) When A_t > 0 and r_t >> 1+ε, the clip replaces the gradient entirely with the TRPO natural gradient step to ensure the KL constraint is not violated, which is why PPO approximates TRPO's monotonic improvement guarantee`,
        ],
        answer: `A`
      },
      {
        q: `You are training PPO on a continuous control task and observe that training is stable for 100 updates, then the policy collapses — mean episode reward drops from +500 to near 0 and never recovers. What happened and how do you diagnose and fix it?`,
        options: [
          `A) Policy collapse after stable training is caused by the value function diverging, which is a known PPO failure mode when the critic learning rate is too high; reduce the critic learning rate by 10× and the policy will recover`,
          `B) The collapse indicates the environment has a non-stationary distribution shift at update 100; the agent's policy became optimal for the old distribution but the environment changed; monitor environment statistics and retrain when distribution shift is detected`,
          `C) Policy collapse after stable training is typically caused by too many mini-batch epochs K (policy drifts far from π_old, making all advantage estimates invalid and gradient signal pure noise) or a too-high learning rate; diagnose by logging r_t distribution, fraction of clipped updates (should be 10-30%, not 90%+), and KL(π_old ‖ π_new) per batch; fix by reducing K, adding early stopping when mean KL exceeds ~0.015, lowering learning rate, or regularising the critic`,
          `D) The collapse is caused by entropy collapsing to zero; once the policy becomes deterministic it cannot recover because the policy gradient is zero for deterministic policies; add a large entropy bonus β=1.0 to force the policy back to a stochastic regime`,
        ],
        answer: `C`
      },
      {
        q: `In RLHF with PPO for an LLM, why is the KL penalty to the SFT model necessary? What happens if you remove it?`,
        options: [
          `A) The KL penalty is only necessary during the early stages of RLHF training to stabilise the reward model scores; once training has run for 1000 steps, the KL penalty can be removed without any degradation in output quality`,
          `B) Without the KL penalty, the LLM exploits the reward model via Goodhart's Law — generating repetitive, verbose, or incoherent text that achieves high reward model scores but low human preference, because the policy drifts into regions where the reward model is uncalibrated (trained only on SFT-like outputs); β controls the tradeoff: too low allows hacking, too high means no improvement from SFT`,
          `C) The KL penalty prevents the LLM from generating toxic or harmful content by keeping responses close to the safe SFT baseline; removing it would cause the model to generate harmful outputs even when the reward model explicitly penalises them`,
          `D) The KL penalty is a computational efficiency trick that reduces the size of the policy gradient update; removing it would cause training to be unstable due to the large gradient magnitudes from the reward model`,
        ],
        answer: `B`
      },
    ],
    takeaway: `PPO's clipped objective enforces a trust region by killing gradients when the policy ratio r_t moves outside [1-ε, 1+ε] — preventing the policy from drifting so far from π_old that the advantage estimates computed under π_old become invalid. The critical implementation failure mode is too many mini-batch epochs per collected batch: after K gradient steps, the policy has moved far from π_old even though the data was collected under π_old, the clip is hit constantly, and the gradient signal becomes noise. Monitoring the fraction of clipped updates and KL(π_old ‖ π_new) per batch is the diagnostic, and reducing K or adding early stopping is the fix.`,
  },
  {
    id: 'rlhf_reward_modeling',
    title: 'RLHF and Reward Modeling',
    subtitle: `Bradley-Terry model, reward hacking, Goodhart's law, DPO, KL penalty, evaluation`,
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['rlhf', 'reward model', 'bradley-terry', 'reward hacking', 'dpo', 'goodhart'],
    summary: `Specifying a reward function for language model alignment is impossible — human values are too complex, contextual, and contradictory to formalise. But humans can compare outputs: "response A is better than response B." This comparative signal, not an absolute specification, is what RLHF uses to train a reward model via the Bradley-Terry preference model, which then drives PPO fine-tuning. The central challenge is not algorithmic — it's Goodhart's Law: the reward model is an imperfect proxy, and a powerful optimiser like PPO will exploit every gap between the proxy and true human preferences. Sycophancy, verbosity, and formatting exploitation are not bugs; they are the optimizer doing exactly what it was told to do to the reward model. The KL penalty to the SFT model is the primary defence, and choosing β is not a minor hyperparameter — it determines whether the LLM stays close enough to the SFT distribution that the reward model's scores remain meaningful. DPO offers an alternative that eliminates the reward model entirely, but whether it avoids Goodhart's Law or merely relocates it is an open research question.`,
    keyPoints: [
      `**Human preferences can't be encoded as an absolute reward function, but humans can reliably judge which of two responses is better.** The Bradley-Terry model converts pairwise preferences into scalar reward estimates: P(y_w > y_l | x) = σ(r_φ(x,y_w) - r_φ(x,y_l)). Training maximises the likelihood of observed human preference pairs: L(φ) = -E[log σ(r_φ(x,y_w) - r_φ(x,y_l))]. The reward model learns relative quality — not absolute scores — from comparative human judgments.`,
      `**Reward model architecture: the base LLM (same or smaller) fine-tuned with a linear scalar head on the last token's hidden state.** Trained on 10k-100k human preference pairs. The scalar output is the reward signal for PPO. The reward model is frozen during PPO training — this is critical, because if the reward model also updated, you'd have a moving target for the RL objective.`,
      `**RLHF training pipeline: (1) SFT — fine-tune base LLM on high-quality demonstrations to get a capable starting point. (2) Reward modeling — collect pairwise preferences, train Bradley-Terry model. (3) RL fine-tuning — PPO with reward signal r(x,y) = r_φ(x,y) - β log(π_θ(y|x) / π_SFT(y|x)).** The KL term is not optional hygiene; it is the mechanism that keeps the LLM in the reward model's distribution.`,
      `**Goodhart's Law in practice: the reward model is an imperfect proxy trained on finite preference data and generalises imperfectly.** PPO finds the policy that maximises r_φ — not the policy that best satisfies human preferences. Sycophancy: agreeing with users scores higher than accurate disagreement. Verbosity: longer answers score higher on helpfulness metrics. Formatting exploitation: spurious headers and bullets if the reward model was trained on markdown. Overconfidence: hedged responses score lower than confident assertions, even when uncertainty is warranted.`,
      `**Reward model overoptimisation: as PPO diverges from SFT, the policy enters a region of distribution space where the reward model was never trained.** Reward model scores become meaningless — the LLM achieves arbitrarily high scores with outputs that no human would endorse. The diagnostic is the Pareto frontier of (reward model score vs KL from SFT): reward model score keeps increasing while human preference peaks and then decreases. The gap between proxy score and true preference quality is the measure of Goodhart damage.`,
      `**DPO (Direct Preference Optimisation): eliminates both the reward model and PPO by rewriting the RLHF objective as a direct loss on preference data.** L_DPO(θ) = -E[log σ(β log(π_θ(y_w|x)/π_ref(y_w|x)) - β log(π_θ(y_l|x)/π_ref(y_l|x)))]. The partition function Z(x) that appears in both the winner and loser terms cancels identically, allowing the reward model to be eliminated. The LLM policy ratio π_θ/π_ref acts as the implicit reward model.`,
      `**DPO vs RLHF in practice: DPO is simpler (no PPO infrastructure, no reward model), more stable, faster to train.** RLHF with online PPO generates new responses during training and evaluates them — this online data generation is crucial for generalisation to prompts not in the preference dataset. DPO trains only on the fixed preference dataset and can overfit to it; it doesn't explore new response space. For complex, long-horizon tasks requiring genuine reasoning, online RLHF typically outperforms DPO; for simpler format and style alignment, DPO is competitive.`,
      `**Evaluation is circular: we can't use the reward model (we optimised it).** Human evaluation is expensive and has high variance (inter-annotator disagreement). LLM-as-judge is scalable but inherits the judge model's biases — it typically rates outputs from its own model family higher (self-preference bias), rates longer outputs higher (verbosity bias), and is sensitive to positional order in comparisons. Win rate on benchmark prompts is sensitive to prompt distribution and may not reflect deployment performance.`,
    ],
    checkQuestions: [
      {
        q: `Derive the DPO loss from the RLHF objective. What key mathematical insight allows you to eliminate the reward model?`,
        options: [
          `A) DPO eliminates the reward model by jointly training the policy and reward model in a single optimisation loop, which allows the reward model parameters to be analytically marginalised out of the final loss function`,
          `B) DPO eliminates the reward model by replacing the PPO update with a supervised contrastive loss that directly maximises the log-likelihood of preferred responses over rejected ones, without any derivation from the RLHF objective`,
          `C) The reward model is eliminated because DPO uses a fixed temperature β=1 that makes the Bradley-Terry model equivalent to a simple softmax classifier, which can be absorbed directly into the language model's output layer`,
          `D) The key insight is that the optimal policy under the RLHF objective satisfies r*(x,y) = β log(π*(y|x)/π_ref(y|x)) + β log Z(x); when substituted into the Bradley-Terry preference loss, the partition function Z(x) cancels identically in the winner minus loser difference, leaving a loss directly on π_θ/π_ref that requires no separate reward model`,
        ],
        answer: `D`
      },
      {
        q: `A model trained with RLHF consistently gives verbose answers (3x longer than the SFT baseline) with high reward model scores but lower human preference in blind evaluation. What is happening and how do you fix it?`,
        options: [
          `A) The reward model learned a spurious length-quality correlation from the preference data (annotators preferred longer answers), so PPO exploited verbosity as a shortcut; fixes include a length penalty in the reward, length-stratified preference data collection with shorter answers explicitly preferred, win-rate calibration to detect the spurious feature, or DPO with preference pairs where short precise answers beat verbose ones`,
          `B) The verbosity is caused by using too high a KL penalty β, which forces the model to stay close to the SFT distribution; since the SFT model was trained on long human demonstrations, the policy mimics that verbosity; lower β to allow more divergence from SFT`,
          `C) The verbosity is a natural consequence of RLHF training and indicates the model is working correctly; longer answers contain more information and are genuinely better; human evaluators in the blind study may be biased against verbose responses`,
          `D) The issue is the SFT baseline was trained on data that was already verbose; RLHF cannot reduce verbosity below the SFT baseline because the KL penalty prevents the policy from diverging enough from SFT to learn conciseness`,
        ],
        answer: `A`
      },
      {
        q: `Why is "LLM-as-judge" evaluation problematic for assessing RLHF model quality, even when the judge is a much stronger model than the one being evaluated?`,
        options: [
          `A) LLM-as-judge evaluation is only problematic when the judge and the evaluated model share the same base architecture; a judge from a different model family (e.g., GPT-4 judging a Claude model) eliminates self-preference bias and produces reliable evaluations`,
          `B) LLM-as-judge is problematic because stronger models have higher latency and cost, making evaluation impractical at scale; the compute budget should be spent on human evaluation instead`,
          `C) LLM judges are unreliable because they cannot read and understand long responses accurately; they tend to evaluate only the first paragraph of each response, creating a positional bias that favours responses that front-load their conclusions`,
          `D) LLM-as-judge has compounding biases: self-preference (same family models rated higher), verbosity bias (longer = better), positional bias in A/B comparisons, length bias, distribution shift (judge may be poorly calibrated on RLHF-shifted outputs), and prompt sensitivity; reliable alternatives include human evaluation on held-out prompts with inter-annotator agreement, and rule-based automated metrics for specific capabilities like factuality or instruction following`,
        ],
        answer: `D`
      },
    ],
    takeaway: `Goodhart's Law is the central challenge of RLHF: the reward model is an imperfect proxy for human preferences, and a powerful optimiser like PPO will exploit that imperfection — producing sycophantic, verbose, or formatting-exploiting outputs that score well on the reward model but poorly in blind human evaluation. The KL penalty to the SFT model is the primary defence and is not optional: it keeps the LLM close enough to the SFT distribution that the reward model's scores remain meaningful. Tuning β is one of the most consequential decisions in an RLHF run. DPO eliminates the reward model via a mathematical cancellation of the partition function, but it trades online exploration for simplicity — making it weaker than online RLHF for complex tasks that require genuine reasoning improvement.`,
  },
  {
    id: 'exploration_exploitation',
    interactiveId: 'exploration_exploitation_viz',
    title: 'Exploration vs Exploitation',
    subtitle: 'ε-greedy, UCB, curiosity (ICM), count-based, Thompson sampling, high-dimensional exploration',
    difficulty: 'advanced',
    estimatedMin: 55,
    tags: ['exploration', 'exploitation', 'ucb', 'thompson sampling', 'curiosity', 'intrinsic reward'],
    summary: `An agent that only exploits what it knows gets stuck in local optima — it never discovers that unexplored regions might offer better rewards. But random exploration fails catastrophically in hard environments: in Montezuma's Revenge, the probability of randomly discovering the first reward by executing the correct sequence of ~100 actions is (ε/|A|)^100 ≈ 10^{-218}. The environment never provides any positive reward, and Q-learning never updates toward anything useful. The insight separating ε-greedy from principled exploration: exploration should be directed at states where information gain is highest — uncertain states, not random states. UCB, count-based bonuses, ICM, and Thompson sampling are all instantiations of this same idea. Curiosity modules (ICM, RND) implement it by rewarding the agent for visiting novel states, turning the exploration problem into one of intrinsic motivation rather than random chance.`,
    keyPoints: [
      `**ε-greedy is the default exploration strategy: take a random action with probability ε, otherwise exploit argmax_a Q(s,a).** Its failure mode is fundamental: in large or high-dimensional state spaces, random exploration has exponentially small probability of discovering structured rewards. In a game requiring 100 specific sequential actions, random ε-greedy exploration needs to accidentally execute all 100 in sequence — (ε/|A|)^100 probability per episode. This cannot be overcome by collecting more episodes.`,
      `**UCB (Upper Confidence Bound) is exploration directed at uncertainty. a_t = argmax_a [Q(s,a) + c√(ln t / N(s,a))].** The exploration bonus is inversely proportional to visit count — low N means high uncertainty, so the agent is incentivised to visit that action to reduce uncertainty. UCB is the formalisation of "optimism in the face of uncertainty": act as if uncertain actions are as good as their highest plausible value. For bandits, UCB achieves O(√(T ln T)) cumulative regret — provably near-optimal.`,
      `**Count-based exploration adds an intrinsic reward r_intrinsic(s) = c / √N(s) — an inverse-visit-count bonus.** This is the pure form of optimism: unvisited states get large bonuses. The fundamental problem: N(s) requires counting visits to each specific state, which is intractable in continuous or high-dimensional spaces. A specific pixel configuration in Atari is almost never seen twice. Approximations (SimHash, CTS density model, pseudocounts) maintain approximate visit counts using hashing or density models.`,
      `**ICM (Intrinsic Curiosity Module) solves the tractability problem for continuous spaces using prediction error as a novelty signal.** Train a forward model f: (s_t, a_t) → ŝ_{t+1} in feature space. Intrinsic reward = ||ŝ_{t+1} - φ(s_{t+1})||^2. The feature encoder φ is trained by an inverse dynamics model — forced to encode only features controllable by the agent (i.e., features that distinguish which action was taken). This is critical: it solves the noisy TV problem by making the curiosity signal blind to uncontrollable stochasticity.`,
      `**The noisy TV problem exposes a failure mode in naive curiosity: an agent rewarded for prediction error is attracted to a television displaying random static — maximal prediction error forever, zero learning.** ICM's inverse dynamics training encodes only agent-controllable features, making TV static invisible to the curiosity signal. RND (Random Network Distillation) takes a different approach: fixed target network f gives stochastic states a deterministic representation, and the distillation network g quickly learns to match f after a few visits, causing intrinsic reward to decay. Both solve the same problem via different mechanisms; RND is simpler.`,
      `**Thompson sampling (posterior sampling RL): maintain a probability distribution over possible MDPs.** At each episode, sample one MDP from the posterior and act optimally in it. This is the Bayesian formalisation of "explore uncertain regions": if you're uncertain about the MDP dynamics, sample a plausible MDP and behave optimally — this naturally drives exploration toward uncertain states because different sampled MDPs prescribe different optimal actions. Near-optimal Bayesian regret. Challenge: maintaining a full posterior over MDPs is computationally intractable; approximations use ensembles of Q-networks or Bayesian neural networks.`,
      `**Optimism in the face of uncertainty (OFU) is the unifying principle: UCB, count-based bonuses, model-based upper confidence bounds, and posterior sampling all instantiate the same idea — act as if uncertain regions are optimal, explore them to resolve uncertainty, update.** The opposite principle (pessimism under uncertainty) is the right approach for offline RL: when you can't explore, stay close to the logged data distribution and avoid actions where Q estimates are unreliable.`,
      `**For production applications: RND is the most practical curiosity method — no forward model training, computationally cheap, avoids noisy TV.** For sparse-reward robotics: HER provides dense reward from every failed episode. For combinatorial search spaces (protein design, drug discovery): Thompson sampling over surrogate models (Bayesian optimisation) rather than environment-based RL exploration — the surrogate is cheap to evaluate and uncertainty-aware.`,
    ],
    checkQuestions: [
      {
        q: `Why does ε-greedy exploration fail on Montezuma's Revenge (an Atari game with hard exploration), and what specific property of the environment causes the failure?`,
        options: [
          `A) ε-greedy fails because Montezuma's Revenge has a very large action space (18 discrete actions) making random exploration too slow; using a smaller ε value would solve the problem by concentrating exploration on fewer actions`,
          `B) The failure is caused by the game's high-resolution graphics, which make the state space too large for Q-learning to generalise across; the fix is to use a CNN with better feature extraction rather than a different exploration strategy`,
          `C) ε-greedy fails because the first reward in Montezuma's Revenge requires executing a specific sequence of ~100+ actions; the probability of discovering this by random exploration is (ε/|A|)^100 ≈ 10^{-218}, effectively impossible; fixes include ICM/RND (novelty rewards drive the agent into new rooms), hierarchical RL (subgoals decompose the task), and human demonstration seeding`,
          `D) ε-greedy is insufficient because Montezuma's Revenge has a non-Markovian reward structure where the same action produces different rewards depending on the full episode history; the fix is to use a recurrent policy that conditions on the entire trajectory`,
        ],
        answer: `C`
      },
      {
        q: `Explain the noisy TV problem in curiosity-driven exploration. How does ICM's feature encoder solve it, and how does RND avoid it entirely?`,
        options: [
          `A) The noisy TV problem occurs when the environment has a high frame rate that overwhelms the replay buffer with uninformative transitions; ICM solves this by subsampling frames, and RND avoids it by using a fixed random projection that is invariant to frame rate`,
          `B) The noisy TV problem is that a pure prediction-error curiosity module rewards the agent for standing in front of random static TV (maximum prediction error forever, no exploration); ICM solves it via inverse dynamics training that makes the feature encoder ignore uncontrollable features (TV static is invisible because the agent's actions don't cause it); RND solves it because the fixed random target network gives each TV frame a deterministic representation, so intrinsic reward decays after a few visits`,
          `C) The noisy TV problem is only relevant for environments with actual television screens; in abstract environments like Atari games without random static, both ICM and RND perform identically and the distinction between their approaches does not matter`,
          `D) The noisy TV problem occurs when the reward model overfits to visual patterns in the training data; ICM solves it with data augmentation during feature encoder training, and RND avoids it by using a reward model that is trained on text descriptions of states rather than raw pixels`,
        ],
        answer: `B`
      },
      {
        q: `You are applying RL to a drug discovery task — the agent proposes molecular structures and receives a reward based on the drug's predicted binding affinity. The action space is discrete (atom type × position) but the molecule space has ~10^{60} valid molecules. How do you handle exploration?`,
        options: [
          `A) Use Bayesian optimisation with a surrogate model for Thompson sampling over molecular embeddings, or generative RL (REINVENT/GCPN) with diversity bonuses and fragment-based search to reduce the effective space; be aware that the binding affinity predictor is itself a proxy reward — RL against it requires diversity regularisation and periodic wet-lab validation to guard against Goodhart violations`,
          `B) Standard ε-greedy with ε=0.5 is sufficient because the dense structure of chemical space means that random perturbations of a good molecule will often produce another good molecule; the 10^{60} size is misleading since most molecules are structurally similar`,
          `C) Use count-based exploration with SimHash to approximate visit counts in the molecular fingerprint space; this provides UCB-style bonuses for novel molecules without requiring exact state counts`,
          `D) The only valid approach for 10^{60}-molecule spaces is evolutionary search (genetic algorithms), not RL; RL cannot scale to spaces larger than approximately 10^{20} states and will fail regardless of the exploration strategy used`,
        ],
        answer: `A`
      },
    ],
    takeaway: `Exploration is a directed information-gathering problem, not a random one. ε-greedy fails catastrophically in hard environments because random action selection has exponentially small probability of discovering structured rewards requiring long sequential dependencies. The unifying principle across UCB, count-based bonuses, and curiosity modules is "optimism in the face of uncertainty" — seek states or actions where uncertainty is highest, because that is where information gain is greatest. RND is the most practical production implementation: the fixed target network makes stochastic states deterministically represented, so intrinsic reward decays after a few visits, avoiding the noisy TV problem by design.`,
  },
  {
    id: 'rl_production',
    title: 'RL in Production',
    subtitle: 'Off-policy evaluation, reward delay, sim-to-real, safe RL, when NOT to use RL',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['off-policy evaluation', 'importance sampling', 'doubly robust', 'sim-to-real', 'safe rl', 'constrained mdp'],
    summary: `Supervised learning can be evaluated before deployment by holding out labelled data. RL cannot — you can't run a new policy in production to measure its value before committing to it. Off-policy evaluation (OPE) is the only tool for estimating a new policy's performance from logged data collected under a different policy. But importance sampling OPE has exponential variance in long-horizon tasks: trajectory-level weights are products of T per-step ratios, each potentially large, making most weights either near-zero or astronomical. The doubly robust estimator addresses this by combining a direct reward model with IS correction — giving two chances to be right. Beyond evaluation, production RL faces reward delay (feedback arrives days after the action), non-stationarity (the environment shifts continuously), and safety constraints that must hold with near-zero tolerance. The most important skill in applied RL is recognising when not to use it — contextual bandits, supervised learning, or Bayesian optimisation often dominate RL when credit assignment is long-delayed, reward specification is unclear, or sample counts are low.`,
    keyPoints: [
      `**Off-policy evaluation solves a fundamental deployment problem: you cannot evaluate a new policy π_e by running it in production before you commit to deploying it.** OPE uses logged data from a behaviour policy π_b to estimate what π_e would achieve. Three methods: Direct Method (DM) — fit a reward model, compute E_{a~π_e}[R̂(s,a)]; biased if the model misspecifies the reward. Importance Sampling (IS) — weight trajectories by π_e/π_b; unbiased but has exponentially high variance in long-horizon tasks. Doubly Robust (DR) — combines both; unbiased if either the reward model is correct or the IS weights are correct.`,
      `**Importance sampling variance problem: for a T-step trajectory, the IS weight is a product of T per-step ratios π_e(a_t|s_t)/π_b(a_t|s_t).** Each ratio can be large for actions π_b rarely took. With T=100 steps, trajectory-level weights can be 33^100 — effectively infinite. Most weights collapse to near zero; almost all trajectories contribute nothing to the estimate. The variance is exponential in horizon length, making pure IS impractical for any sequential problem with more than a few steps.`,
      `**Doubly robust estimator: V̂^DR = (1/N) Σ_n [w(τ_n)(G(τ_n) - R̂(s_n,a_n)) + V̂^{DM}(s_n)].** If R̂ is accurate: the IS correction term has near-zero mean, DM dominates with low variance. If IS weights are accurate: the DM error is corrected by the IS term. Two independent chances to be correct — if either holds, the estimator is consistent. DR is the gold standard for production OPE because both the DM and IS components bring different failure modes, and having two independent safeguards dramatically reduces the risk of large systematic error.`,
      `**Reward delay and sparse signals are common production failure modes.** Recommendation CTR is observed hours after the impression. Drug trial efficacy is measured weeks after dosing. Standard RL credit assignment assumes rewards follow actions within a few steps. With hours-long delays: (1) Proxy rewards — faster-to-observe correlated signals (hover time as proxy for click). Risk: Goodhart's Law. (2) Reward attribution — causal or supervised models to attribute delayed rewards to specific actions. (3) Conservative credit assignment — treat delayed reward as belonging to the most recent action (coarse but implementable).`,
      `**Sim-to-real gap: sources include imperfect physics (friction, cable dynamics, contact), observation discrepancy (rendered vs real camera images), actuation delay (simulator is synchronous; real robot has 20-50ms latency), and contact with deformable objects (rigid body simulators can't model).** Mitigation: domain randomisation (randomise mass, friction, lighting, camera angle so the policy learns robustness), domain adaptation (fine-tune with small real-world data), system identification (calibrate simulator parameters from real rollouts by minimising prediction error).`,
      `**Constrained MDPs for safe RL: max_π J(π) subject to C_i(π) ≤ d_i.** Lagrangian relaxation adds λ_i · C_i(π) to the objective; λ increases if the constraint is violated. CPO (Constrained Policy Optimisation) uses a trust-region update that projects the policy gradient into the feasible constraint region. Safety layers project the RL policy's action into the safe set using a differentiable filter. Note: all of these bound expected constraint violations — they do not eliminate violations entirely. Applications where a single constraint violation is catastrophic require different frameworks.`,
      `**When NOT to use RL: (1) Credit assignment horizon is months — use causal inference or bandit methods with short horizons. (2) Can't write a reward function without Goodhart violations — use supervised learning with human labels. (3) Environment shifts faster than the agent adapts — online contextual bandits with short memory windows. (4) No reliable simulation and production experiments are expensive — Bayesian optimisation with a surrogate. (5) Interpretability required — medical, legal, financial domains where regulators need explainable decisions. (6) Sample count is limited — fewer than 10k episodes total, Bayesian optimisation or contextual bandits dramatically outperform RL.**`,
      `**Offline RL trains entirely on fixed logged data — no environment interaction.** The central problem is distributional shift: actions the offline policy wants to take may not appear in logged data, so Q-values for those actions are extrapolated from out-of-distribution. Neural network Q estimates extrapolate wildly outside the training distribution, causing severe overestimation of unseen actions. CQL (Conservative Q-Learning) penalises Q values for actions not in the data. BCQ (Batch-Constrained Q-learning) constrains the policy to actions similar to those in the dataset. IQL (Implicit Q-Learning) avoids OOD actions via expectile regression on in-sample transitions.`,
      `**Contextual bandits are RL-lite for problems with no meaningful sequential structure.** If action a_t affects only reward r_t and not future states, the problem is a contextual bandit — not an MDP. Single-item recommendations in a feed often satisfy this: recommending item A today doesn't meaningfully change the user's fundamental preferences tomorrow. Bandits are simpler to train, have much lower-variance OPE estimators (no trajectory-level weights), and are far safer to deploy. Always choose bandits over RL when the sequential credit assignment structure is weak.`,
    ],
    checkQuestions: [
      {
        q: `You have logged data from a recommendation policy π_b (ε-greedy with ε=0.3) and want to estimate the click-through rate of a new model π_e. You have 10M impressions and 10 candidate items per request. Describe the IS estimator, its variance problem for long horizon, and why DR is better.`,
        options: [
          `A) Use the IS estimator V̂^IS = (1/N) Σ_n (π_e(a_n|s_n)/π_b(a_n|s_n)) r_n; with ε=0.3 and 10 items, off-policy actions have weights up to ~33 (manageable at 10M samples for single-step bandits); for sequential MDPs with T steps the trajectory-level weight is Π_t w_t which can be 33^T — exponential variance; the DR estimator V̂^DR combines a fitted reward model R̂ with IS correction and is consistent if either the model or IS weights are accurate, making it more robust than either alone`,
          `B) The IS estimator is unbiased and with 10M samples has negligible variance; there is no meaningful difference between IS and DR for this problem size; use IS for simplicity`,
          `C) IS estimation is invalid when π_b is ε-greedy because ε-greedy is not a proper probability distribution; use only the Direct Method (reward model) for evaluation and ignore the IS estimator entirely`,
          `D) The IS estimator always has zero variance when the behaviour policy π_b is known exactly; variance only occurs when π_b must be estimated from data; with a known ε-greedy policy the IS estimator is both unbiased and zero-variance`,
        ],
        answer: `B`
      },
      {
        q: `Your RL agent for robot manipulation works perfectly in simulation (95% success rate) but achieves only 20% in the real lab. What are the sources of the sim-to-real gap and how do you diagnose and close each?`,
        options: [
          `A) The sim-to-real gap is caused entirely by observation discrepancy (sim renders perfect images while real cameras have noise); the fix is to use depth cameras instead of RGB cameras, which have a much smaller sim-to-real gap`,
          `B) The primary source is always actuation delay; simulators run synchronously while real robots have 20-50ms latency; adding simulated delay to the training environment will fully close the gap`,
          `C) The sim-to-real gap has multiple independent sources: physics mismatch (friction, mass, contact — fix via system identification and domain randomisation), observation discrepancy (image quality — fix via domain randomisation of lighting/texture or sim-to-real image transfer), actuation delay (fix via randomised delay in simulation), and distributional shift in initial conditions (fix via varied object placement during training); diagnose by isolating each factor in simulation and measuring the performance drop`,
          `D) The gap is caused by distribution shift in the policy: the agent was trained only on successful trajectories in simulation, so it doesn't know how to recover from failures; the fix is to augment the simulation training data with intentional failure scenarios and recovery demonstrations`,
        ],
        answer: `C`
      },
      {
        q: `A team proposes using RL for a clinical trial treatment assignment (which treatment to give each patient each day). What are the specific risks, and what alternative framework would you recommend?`,
        options: [
          `A) RL is appropriate for clinical trials as long as the reward function is carefully designed to include both short-term and long-term health outcomes; the main risk is reward hacking, which can be mitigated with a KL penalty to the standard of care`,
          `B) RL works for clinical trials but requires offline RL (not online RL) to avoid safety risks; use CQL with conservative Q-value estimation to ensure the policy stays within the safe action distribution observed in historical patient data`,
          `C) RL is inappropriate here due to: delayed outcomes (months-long credit assignment), non-stationary patient populations, catastrophic (not expected-value) safety requirements, low sample counts (hundreds not millions), regulatory interpretability requirements, and distribution shift from the changing policy; recommend contextual bandits with Thompson sampling + posterior-based safety arm exclusion, or a Bayesian adaptive clinical trial design (REMAP-style response-adaptive randomisation) which is FDA-recognised and provides both statistical validity and adaptivity`,
          `D) The main risk is that RL requires too many patient interactions to learn a good policy; the fix is to use transfer learning from existing clinical trial data to pre-train the policy before deploying it in a new trial, which reduces the number of patients needed to fewer than 100`,
        ],
        answer: `D`
      },
    ],
    takeaway: `The most important production RL skill is knowing when not to use RL: if rewards are delayed by months, if you can't write a reward function without Goodhart violations, if the environment shifts faster than the agent can adapt, or if sample counts are below ~10k episodes, RL will be dominated by contextual bandits, supervised learning, or Bayesian optimisation. When you do use RL, off-policy evaluation via doubly robust estimation is the primary tool for evaluating a new policy before deployment — the DR estimator is preferred because it has two independent chances to be correct, addressing the exponential variance problem of pure IS in long-horizon tasks.`,
  },
]
