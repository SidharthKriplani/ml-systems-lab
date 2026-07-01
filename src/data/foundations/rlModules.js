export const RL_MODULES = [
  {
    id: 'mdp_framework',
    title: 'Markov Decision Processes',
    subtitle: 'States, actions, rewards, transitions, discount factor — the formal RL framework',
    difficulty: 'foundational',
    estimatedMin: 40,
    tags: ['mdp', 'markov', 'bellman', 'discount', 'pomdp'],
    summary: `Imagine a robot navigating a grid to reach a goal. At each step it sees its current position, chooses a direction to move, and receives a reward: +1 for reaching the goal, -0.01 for each step taken, -1 for falling into a hole. After moving it ends up in a new position, and the decision problem repeats until the robot reaches a terminal state. That sequence of state-action-reward-state is an episode, and RL's entire job is to find the sequence of actions — the policy — that maximizes total reward across that episode.

The MDP (Markov Decision Process) is the formal language for this. It has five components. The state space S is all possible positions the robot can be in. The action space A is all directions it can move. The transition function T(s, a, s') = P(s' | s, a) is the probability of landing in s' after moving in direction a from state s. The reward function R(s, a, s') is the immediate reward received on that transition. The discount factor γ ∈ [0, 1) controls how much future rewards are worth relative to immediate ones: γ = 0 means the robot cares only about the next step, γ = 0.99 means a reward 100 steps away still matters almost as much as one received now.

The return G_t = R_t + γR_{t+1} + γ²R_{t+2} + ... is the discounted sum of all future rewards from time t. The policy π(a | s) is the probability of taking action a in state s. The agent's goal is to find π* — the optimal policy — that maximizes expected return E[G_t] from every starting state.

The Markov property is the key assumption underpinning everything: the next state depends only on the current state and action, not the full history. For the grid robot this holds perfectly — knowing where you are now is enough to navigate. It breaks whenever the current observation is insufficient: a robot that sees only a camera image cannot distinguish a locked door from an unlocked one, because the relevant information — whether a key was picked up earlier — is not in the current frame. The fix is to augment the state representation to include whatever history is needed.

NOT this: RL is only for games and robotics. Any sequential decision problem with delayed feedback can be formulated as an MDP. Ad bidding (state = user context, action = bid amount, reward = revenue), recommendation (state = user history, action = item, reward = click), drug dosing (state = patient vitals, action = drug dose, reward = patient outcome). The MDP framework is the language — the applications are as broad as any problem where you act, observe a result, and act again.`,
    keyPoints: [
      `**Before implementing any RL system, write down all five MDP components explicitly.**\n\nAmbiguity in reward function design is the most common reason RL systems behave unexpectedly. Reward shaping bugs are harder to debug than code bugs because the agent's behavior looks intentional — it is doing exactly what the reward says, just not what you meant.`,
      `**Designing a reward that is easy to measure but misaligned with the true objective is the most common production failure.**\n\nAn ad system rewarded for clicks maximizes clickbait. A cleaning robot rewarded for dust-sensor readings learns to cover the sensor. A recommendation system rewarded for watch time recommends outrage content. Define the reward to match what you actually want, not what is easiest to instrument.`,
      `**If the agent's policy looks plausible but performance plateaus unexpectedly, check whether the Markov property holds for your state representation.**\n\nIf good decisions require information that is not in the current state — recent history, actions taken earlier, information that was observed but not retained — the Markov property is violated. Add the missing history to the state representation and retrain.`,
    ],
    interactivePrompt: `Before you touch the controls: the robot can move in 4 directions, receives -0.01 per step and +1 for the goal. With γ = 0.9, does the robot prefer a 5-step path or a 10-step path to the goal — and by how much?`,
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
    takeaway: `The MDP is just a formal way of saying: at every step the agent sees a state, picks an action, gets a reward, and ends up somewhere new — and the goal is to find the policy that makes those rewards add up to as much as possible.`,
  },
  {
    id: 'bellman_equations',
    title: 'Bellman Equations',
    subtitle: 'V(s), Q(s,a), optimality equations, contraction mapping, curse of dimensionality',
    difficulty: 'foundational',
    estimatedMin: 45,
    tags: ['bellman', 'value function', 'dynamic programming', 'contraction', 'tabular'],
    summary: `Consider a 4×4 grid world with γ = 0.9. You want to know: what is the expected total reward — the value — of being at position (2,3) if you follow the optimal policy? To answer this, you need to know the value of neighboring positions, because your value here depends on where you can move next. But those values depend on their neighbors too. The circular dependency seems impossible to resolve — yet this is exactly what the Bellman equations do: they express the value of a state as a function of the values of its successors, turning a circular problem into a recursive one with a guaranteed fixed point.

The state value function under a policy π is V^π(s) = E_π[R_{t+1} + γ V^π(S_{t+1}) | S_t = s]. The value of a state equals immediate expected reward plus discounted expected value of the next state. This is the Bellman expectation equation — self-consistent, recursive, and for a fixed policy, linear enough to solve directly.

The optimal value function is V*(s) = max_a [R(s,a) + γ Σ_{s'} P(s'|s,a) V*(s')]. The value of the best possible policy equals the action that maximizes immediate reward plus discounted future value. The action-value function Q*(s, a) = R(s,a) + γ Σ_{s'} P(s'|s,a) max_{a'} Q*(s', a') is more practically useful: it tells you the value of taking action a in state s and then acting optimally, which means you can select actions directly via argmax_a Q*(s, a) without needing to model transitions.

Value iteration starts with an arbitrary value estimate and repeatedly applies the Bellman operator until convergence. Contraction mapping theory guarantees this converges to V* for finite MDPs. Policy iteration alternates between evaluating the current policy exactly and then improving it greedily. Both are guaranteed to find the optimal policy — but only in the tabular case.

NOT this: you need to know the transition model T(s, a, s') to use Bellman equations. Model-based RL uses the equations directly with a known or learned T. Model-free RL — Q-learning, TD learning — uses samples to estimate the Bellman updates without ever modeling T explicitly. The Bellman structure guides both approaches by telling you what quantity to estimate.`,
    keyPoints: [
      `**Learn the Q-function Q*(s, a), not V*(s), for most RL applications.**\n\nQ*(s, a) tells you which action to take directly — argmax_a Q*(s, a) — without needing transition probabilities. V*(s) tells you how good a state is but not what to do, so unless you have a model of transitions, V alone cannot produce a policy.`,
      `**Tabular Q-learning is infeasible for large or continuous state spaces — this is not a performance issue, it is a physical impossibility.**\n\nA robot with 6 joint angles discretized at 100 positions per joint has 10^12 states. Storing a Q-table for this requires more memory than exists. The moment the state space is too large to enumerate, you need function approximation — neural networks — which breaks the convergence guarantee.`,
      `**If Q-values grow without bound during training, the Bellman backup is diverging due to a feedback loop between the prediction and the target.**\n\nThe target y = R + γ max Q_θ(s') depends on the same θ being updated, so each gradient step shifts both the prediction and the target. Fix this with a target network: freeze θ^- for K steps so the target is stationary, then copy θ into θ^-.`,
    ],
    interactivePrompt: `Before you touch the controls: in the 4×4 grid, position (0,0) is the goal and (3,3) is the start. With γ = 0.9 and a reward of +1 only at the goal, roughly what value would you assign to a state 3 steps away from the goal?`,
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
    takeaway: `The Bellman equation turns the circular problem of value estimation into a recursive fixed point: the value of a state equals immediate reward plus discounted value of the best next state — and iterating this update is guaranteed to find the answer.`,
  },
  {
    id: 'temporal_difference',
    title: 'Temporal Difference Learning',
    subtitle: 'TD(0), TD(λ), SARSA vs Q-learning, deadly triad, divergence with FA',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['td learning', 'sarsa', 'q-learning', 'eligibility traces', 'deadly triad', 'off-policy'],
    summary: `Consider a stock trading system. After each trade you receive a reward — profit or loss. But the final profit of a multi-leg strategy is not known until all positions close, potentially hours later. You cannot wait for the episode to end before updating your value estimates. You need to learn from partial information, updating as you go. Temporal difference learning does exactly this: update V(s_t) based on the observed reward R_{t+1} and the current estimate V(s_{t+1}), without waiting for the final return.

The TD(0) update is V(s_t) ← V(s_t) + α [R_{t+1} + γ V(s_{t+1}) - V(s_t)]. The term in brackets is the TD error δ_t — the difference between what you predicted and what the next step says you should have predicted. V(s_{t+1}) is a bootstrapped estimate: you are using one estimate to update another. This is the fundamental difference from Monte Carlo, which waits for the full return G_t = R_{t+1} + γR_{t+2} + ... before updating.

The tradeoff is bias versus variance. Monte Carlo is unbiased because it uses actual future rewards, but it has high variance because the full trajectory includes noise from every subsequent step. TD is biased because V(s_{t+1}) is an approximation, but it has lower variance because only one step of noise is introduced per update. TD can update after every step — online learning. Monte Carlo requires complete episodes. For long-horizon tasks where episode lengths are in the hundreds or thousands, Monte Carlo gradient variance is too high to train reliably — TD is not just faster, it is the only practical option.

TD(λ) interpolates between the two. λ = 0 is pure one-step TD. λ = 1 is Monte Carlo. Values in between accumulate a geometric average of n-step returns via eligibility traces — each state's update is weighted by how recently and frequently it was visited. λ around 0.7–0.9 typically outperforms both extremes.

NOT this: TD is just a faster version of Monte Carlo. The bias-variance distinction is not an implementation detail. In long-horizon tasks — game episodes of 1000+ steps, multi-day trading strategies — the variance of a full Monte Carlo return is enormous, and the gradient signal becomes noise. TD's bias from an imperfect V estimate is a feature, not a bug: it gives you a low-variance signal every step.`,
    keyPoints: [
      `**Use TD(λ) with λ around 0.7–0.9 for most tasks.**\n\nThe λ-return balances the bias of one-step TD against the variance of full Monte Carlo returns. Both extremes are dominated by intermediate values in long-horizon tasks. λ = 0.9 means you are accumulating roughly 10 steps of real rewards before heavily relying on the value estimate.`,
      `**A learning rate α that is too large will cause TD updates to diverge — this is the first thing to check when Q-values oscillate or explode.**\n\nTD convergence requires α to decrease according to the Robbins-Monro conditions: Σ αₜ = ∞ and Σ αₜ² < ∞. In practice, start with α = 0.01 and decay by a factor of 0.99 every epoch. If training is unstable, halve α before changing anything else.`,
      `**Plot the TD error over training — it is a direct diagnostic of whether learning is happening.**\n\nTD error should be initially large and variable, then decrease and stabilize as the value function converges. If it oscillates at a persistently high value, the learning rate is too large or the function approximator is unstable. If it drops to near zero immediately, the critic is not being updated often enough relative to the policy.`,
    ],
    interactivePrompt: `Before you touch the controls: the trading agent receives a +10 reward when it closes a profitable position and 0 otherwise. If V(s_t) = 5 and V(s_{t+1}) = 8 with R_{t+1} = 0 and γ = 0.9, what is the TD error — and does V(s_t) increase or decrease?`,
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
    takeaway: `TD learning updates value estimates after every step using a bootstrapped target — trading some bias for dramatically lower variance than Monte Carlo, enabling online learning in long-horizon tasks where waiting for full episode returns is impractical.`,
  },
  {
    id: 'deep_q_networks',
    interactiveId: 'q_learning_viz',
    title: 'Deep Q-Networks',
    subtitle: 'Experience replay, target network, Double DQN, Dueling, Prioritized Replay, failure modes',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['dqn', 'experience replay', 'target network', 'double dqn', 'dueling', 'prioritized replay'],
    summary: `Consider Atari Breakout. The state is 4 consecutive 84×84 game frames — stacked to capture motion. The action space has 3 choices: left, right, no-op. The reward is +1 per brick broken. The state space is effectively infinite: no two sequences of frames are likely to be identical. A tabular Q-table for every possible pixel configuration is physically impossible. DQN replaces the Q-table with a neural network Q(s, a; θ) that takes raw pixels as input and outputs Q-values for all three actions simultaneously.

The problem is that applying Q-learning naively to a neural network is deeply unstable. Consecutive game frames are highly correlated — if the agent is in the top-left of the screen, the next 100 transitions are all from the top-left, and gradient updates overfit to that region while forgetting everything else. This violates the IID assumption that SGD requires: gradient estimates should be drawn from the full training distribution, not a narrow slice of recent experience. DQN's first fix is experience replay: store every transition (s_t, a_t, r_t, s_{t+1}) in a replay buffer of up to 1M entries, then sample random mini-batches. Temporal correlation breaks; transitions are reused multiple times.

The second instability is that the bootstrap target R + γ max_{a'} Q_θ(s', a') depends on the same θ being updated. As θ shifts, the target shifts — you are chasing a moving target, and the feedback loop amplifies Q-values until they diverge. DQN's second fix is the target network: maintain a separate θ^- that is copied from θ only every 10,000 steps. The target is computed using θ^-, which is frozen between updates. The feedback loop breaks.

Double DQN further improves on this. The DQN target uses the same θ^- to both select the best action and evaluate it, which produces a systematic upward bias — the max over noisy estimates is always higher than the estimate of the true max. Double DQN decouples these: use θ to select the action (argmax_a Q_θ(s', a')), then use θ^- to evaluate it. Dueling DQN goes further and decomposes Q(s, a) = V(s) + A(s, a), learning state value and action advantage separately.

NOT this: DQN is the standard deep RL algorithm. DQN only works for discrete action spaces. For continuous control — robot joint torques, motor commands — DQN's argmax over actions is infeasible. Use actor-critic methods (SAC, TD3, PPO) when actions are real-valued.`,
    keyPoints: [
      `**Always use experience replay and target networks together — removing either one causes DQN to diverge.**\n\nReplay breaks the temporal correlation that violates SGD's IID assumption. The target network freezes the bootstrap target to prevent the moving-target feedback loop. These two problems are independent and require independent fixes; a target network alone does not solve the correlation problem, and replay alone does not solve the moving-target problem.`,
      `**A replay buffer smaller than 100K transitions memorizes recent experience and discards rare but important transitions.**\n\nWith a 10K buffer, the agent has effectively seen only the last few minutes of gameplay. Rare high-reward transitions — the first time the agent breaks a row of bricks — cycle out before they can be learned from. Use at least 100K for Atari-scale problems; 1M is standard for long training runs.`,
      `**If training Q-values explode or oscillate, increase the target network update interval first, then reduce the learning rate.**\n\nQ-value explosion is almost always the moving-target problem. Increase the target update interval from 1K to 10K steps to slow down the feedback loop. If that does not stabilize training, halve the learning rate. If Q-values collapse to zero, check that terminal states are handled correctly and that rewards are not always negative.`,
    ],
    interactivePrompt: `Before you touch the controls: the replay buffer has 1M transitions and the target network updates every 10K steps. The agent has just broken its first brick and received +1. How many gradient updates will include that transition before it cycles out of the buffer — roughly?`,
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
    takeaway: `DQN makes Q-learning stable for neural networks with two fixes: experience replay breaks the temporal correlation that causes gradient overfitting, and a target network freezes the bootstrap target to prevent the moving-target feedback loop that amplifies Q-values into divergence.`,
  },
  {
    id: 'policy_gradients',
    title: 'Policy Gradients',
    subtitle: 'REINFORCE, log-derivative trick, high variance, baselines, why PG beats value-based',
    difficulty: 'intermediate',
    estimatedMin: 50,
    interactiveId: 'policy_gradient_viz',
    tags: ['policy gradient', 'reinforce', 'log-derivative', 'variance reduction', 'baseline', 'continuous actions'],
    summary: `Consider a robotic arm reaching for a target. The state is joint angles and velocities — continuous. The action is torques applied to each joint — also continuous, varying smoothly across a large range. Q-learning requires taking the argmax over all actions to compute the optimal next step. Over a continuous torque space, this argmax is an optimization problem that must be solved at every step, for every transition in the replay buffer. It is computationally infeasible. Policy gradient methods sidestep this entirely: instead of learning Q values and deriving a policy from them, parameterize the policy directly as π_θ(a | s) = N(μ_θ(s), σ²_θ(s)). The neural network outputs a mean and variance, and actions are sampled from that Gaussian. Update θ to increase the probability of actions that led to high returns.

The Policy Gradient Theorem gives the gradient: ∇_θ J(θ) = E_π[∇_θ log π_θ(a|s) · Q^π(s, a)]. Increase the log-probability of action a in state s proportionally to how good that action was. The log-derivative trick makes this computable: ∇_θ π_θ(a|s) = π_θ(a|s) · ∇_θ log π_θ(a|s), which converts the gradient of an expectation into an expectation of a gradient — sampleable from trajectories. The environment's transition model never appears. This is model-free.

REINFORCE is the direct implementation: sample a full episode, compute G_t at each timestep, update θ ← θ + α Σ_t G_t ∇_θ log π_θ(a_t | s_t). The problem is that G_t includes all future rewards — noise unrelated to a_t's actual contribution. A good action followed by bad luck is indistinguishable from a genuinely bad action. Gradient estimates have enormous variance.

Baseline subtraction solves this. Replace G_t with (G_t - b(s_t)) where b depends only on the state, not the action. The expected gradient is unchanged — any state-dependent term subtracts to zero because the policy log-gradient sums to zero over actions. But variance drops by centering returns around the state's average value. The optimal baseline is V^π(s_t) itself, giving the advantage A(s_t, a_t) = G_t - V^π(s_t) — how much better this action was than average.

NOT this: policy gradients are unbiased because they use sampled returns. Unbiased in expectation does not mean useful in practice. REINFORCE has extremely high variance for long-horizon tasks, and the gradient estimate from a single trajectory is dominated by random noise. This is why actor-critic methods — which replace G_t with a learned critic estimate — dominate in practice.`,
    keyPoints: [
      `**Always subtract a baseline from returns in policy gradient updates.**\n\nUsing the mean return or a learned value function as baseline reduces variance by 10–100× with zero bias cost — the baseline integrates to zero over the policy distribution. Skipping the baseline is skipping the most important and cheapest variance reduction available.`,
      `**If σ_θ(s) → 0 early in training, the policy has collapsed to deterministic and exploration has stopped — gradient signal becomes zero.**\n\nAdd an entropy bonus H[π_θ] to the loss to maintain policy spread throughout training. Without it, the network converges to the first good-looking action it found and stops exploring whether there is something better.`,
      `**If policy gradient training is noisy with high variance in returns across episodes, you need more environment samples per update — not a learning rate change.**\n\nGradient signal-to-noise ratio improves as √(num_samples). Doubling the number of parallel environments halves gradient noise. Collect longer rollouts or more parallel workers before tuning any other hyperparameter.`,
    ],
    interactivePrompt: `Before you touch the controls: the robotic arm gets +10 for reaching the target in under 20 steps and -0.1 per step. Over 10 episodes, returns range from -2 to +8. Without a baseline, every action in every episode gets weighted by a different G_t. What would happen to the gradient if you used V(s) = 3 as a constant baseline?`,
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
    takeaway: `Policy gradients optimize the policy directly by increasing the log-probability of actions proportionally to how much better than average they were — and subtracting a state-value baseline from the returns is mandatory, not optional, because it reduces gradient variance by 10–100× at zero bias cost.`,
  },
  {
    id: 'actor_critic',
    title: 'Actor-Critic Methods',
    subtitle: 'A2C, A3C, advantage function, GAE, async vs sync, bias-variance in advantage estimation',
    difficulty: 'intermediate',
    estimatedMin: 55,
    tags: ['actor-critic', 'a2c', 'a3c', 'advantage', 'gae', 'bias-variance'],
    summary: `Return to the robotic arm. With REINFORCE, you collect a full episode before updating — the arm attempts the reach, you compute G_t at every step, and you update the policy. Two problems. First, you need complete episodes. Second, G_t at step t includes rewards from steps t+1 through the end of the episode — all caused by different actions, not the one at step t. The credit assignment is noisy. Variance is high.

Actor-critic solves both. Maintain two networks simultaneously. The actor π_θ(a|s) selects actions — the policy. The critic V_φ(s) estimates the state value — how much total reward to expect from here under the current policy. After each step, update the critic using TD: the critic learns V(s_t) ≈ R + γV(s_{t+1}). Then compute the advantage A(s_t, a_t) = R + γV(s_{t+1}) - V(s_t) — how much better than expected was this particular step? Update the actor proportionally. You get updates every step, not every episode.

The advantage has a key property: E_{a~π}[A(s, a)] = 0. It is zero-mean across actions. This means it carries only relative information — this action was above average, that one was below. Unlike raw Q(s, a), which can be large and positive for all actions in a highly valuable state, the advantage removes the state's baseline value and isolates the signal about action quality. This is what makes actor-critic gradient estimates so much lower variance than REINFORCE.

Generalized Advantage Estimation (GAE) extends this. Instead of the one-step advantage R + γV(s') - V(s), GAE accumulates a weighted average of n-step advantages: Â^GAE = δ_t + γλδ_{t+1} + (γλ)²δ_{t+2} + ... where δ_t = R_{t+1} + γV(s_{t+1}) - V(s_t). λ = 0 gives the one-step TD error — low variance, high bias. λ = 1 gives the full Monte Carlo advantage — no bias, high variance. λ = 0.95 is the standard for most tasks. PPO, SAC, and most modern actor-critics use GAE.

NOT this: the actor and critic have separate learning problems that can interfere with each other. The two networks are cooperative, not adversarial — the critic provides variance-reducing signal to the actor, and the actor's improving policy makes the critic's targets more stable. The instability risk is that a slow or inaccurate critic injects biased gradient into the actor. Mitigate by setting critic learning rate 3–10× higher than actor learning rate, so the critic leads.`,
    keyPoints: [
      `**Use actor-critic over pure policy gradients for any task with episodes longer than about 50 steps.**\n\nPer-step TD updates in actor-critic dramatically reduce gradient variance compared to full-trajectory REINFORCE. The actor-critic wall-clock speedup is typically 10–100× on continuous control tasks because you do not wait for episode completion.`,
      `**Set critic learning rate 3–10× higher than actor learning rate.**\n\nThe critic must converge to a stable estimate before the actor can use it meaningfully. If critic and actor learn at the same speed, the actor is chasing a moving value target — equivalent to applying noisy baselines that can increase gradient variance rather than reduce it.`,
      `**If actor loss improves but critic loss plateaus at a high value, the reward magnitude is too large for the critic to track.**\n\nNormalize rewards to approximately [-1, 1] or clip them, then recheck critic convergence. A critic that cannot model the value function correctly injects biased advantage estimates into the actor gradient, which explains why actor performance degrades even as actor loss decreases.`,
    ],
    interactivePrompt: `Before you touch the controls: the actor selects torques, the critic estimates V(s). After a step that gets reward +5 when V(s_t) = 3 and V(s_{t+1}) = 4 with γ = 0.9, what is the advantage — and does the actor increase or decrease the probability of this action?`,
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
    takeaway: `Actor-critic gives you per-step policy updates by replacing the noisy full-episode return with a TD advantage estimate — the actor learns from how much better each action was than the critic expected, not from the absolute return.`,
  },
  {
    id: 'ppo_trpo',
    title: 'PPO and TRPO',
    subtitle: 'Trust region, KL constraint, clipped surrogate, entropy bonus, implementation details',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['ppo', 'trpo', 'trust region', 'kl divergence', 'clipped objective', 'entropy'],
    summary: `You are training a quadruped robot to walk. With vanilla policy gradient, you take a gradient step and the policy changes. If the step is too large, the robot attempts movements far outside the distribution of the collected data — the advantage estimates, computed under the old policy, are completely wrong for the new one. The robot was walking; after one bad update it is lying on the ground producing no useful gradient signal. Recovery is impossible because the next gradient step is also based on wrong estimates. This catastrophic policy collapse is the problem PPO and TRPO solve.

TRPO formalizes the constraint: maximize the expected advantage subject to KL(π_old || π_new) ≤ δ. The KL constraint defines a trust region — updates inside it are theoretically safe, with a guaranteed lower bound on policy improvement. The cost is second-order optimization: computing the natural gradient requires Fisher information matrix-vector products, conjugate gradient, and a line search. Correct, but expensive and complex.

PPO approximates TRPO with a clipped objective: L_CLIP = E[min(r_t A_t, clip(r_t, 1-ε, 1+ε) A_t)] where r_t = π_new/π_old. When A_t > 0 and r_t > 1+ε — the policy is already much more likely to take this good action — the gradient is killed. When A_t < 0 and r_t < 1-ε — the policy has already moved away from this bad action — the gradient is killed again. The clip enforces a soft trust region using only first-order optimization and vanilla Adam.

PPO's clip parameter ε = 0.2 allows up to 20% policy ratio change per step. This is not overly conservative — it prevents catastrophic collapse while still allowing rapid learning across multiple mini-batch epochs per collected batch. The fraction of clipped updates should be 10–30% during stable training. Below 1% means the clip is never activating and providing no stability benefit. Above 90% means the policy is drifting too far and the trust region is already broken.

NOT this: PPO is conservative and learns slowly. PPO with ε = 0.2 is not slow — the alternative (unconstrained large updates) produces policy collapse that wastes entire training runs. PPO's constraint is exactly why it achieves consistent results across random seeds when unconstrained policy gradients do not.`,
    keyPoints: [
      `**Use PPO as your default policy gradient algorithm — it outperforms TRPO with comparable stability, requires no second-order optimization, and is robust to hyperparameters.**\n\nTRPO's theoretical monotonic improvement guarantee is valuable only when you need formal guarantees. For most tasks, PPO's clipped objective achieves the same protective effect at a fraction of the compute cost.`,
      `**Too many mini-batch epochs K defeats PPO's trust region.**\n\nAfter K gradient steps, the policy has drifted from π_old even though the advantages were computed under π_old. The policy ratio r_t becomes large, the clip triggers constantly, and gradient signal becomes noise. Limit K to 3–10 epochs per collected batch. If > 20% of samples have r_t outside [0.8, 1.2], reduce K.`,
      `**Track the policy ratio r_t distribution during training as the primary diagnostic.**\n\nIf less than 1% of samples are clipped, ε is too large — you are not getting the stability benefit. If more than 20% are outside [0.8, 1.2], the step size is too large and the trust region is being violated. Adjust K or ε accordingly.`,
    ],
    interactivePrompt: `Before you touch the controls: with ε = 0.2, the clip range is [0.8, 1.2]. If A_t = +2 and the new policy is 1.5× more likely than the old policy to take this action (r_t = 1.5), does the gradient update fire — or does PPO kill it?`,
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
    takeaway: `PPO prevents catastrophic policy collapse by killing gradients when the policy ratio r_t moves outside [1-ε, 1+ε] — ensuring each update stays within a soft trust region where the advantage estimates are still valid.`,
  },
  {
    id: 'rlhf_reward_modeling',
    title: 'RLHF and Reward Modeling',
    subtitle: `Bradley-Terry model, reward hacking, Goodhart's law, DPO, KL penalty, evaluation`,
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['rlhf', 'reward model', 'bradley-terry', 'reward hacking', 'dpo', 'goodhart'],
    summary: `GPT-4 trained on internet text predicts next tokens accurately. But next-token prediction accuracy has nothing to do with helpfulness. The model often produces responses that are technically fluent but unhelpful, harmful, or dishonest — because those properties were not measured by the training objective. You want to fine-tune the model to be helpful, but you cannot write a mathematical function that measures helpfulness. You can, however, ask humans to compare two responses and say which is better.

This comparative signal is what RLHF uses. The pipeline has three stages. Stage 1: supervised fine-tuning. Fine-tune the base model on a small dataset of high-quality human-written responses. This creates an SFT model — capable, but not yet aligned. Stage 2: reward model training. Show human labelers pairs of responses to the same prompt and ask which is better. Train a reward model R_φ(prompt, response) using the Bradley-Terry preference model: P(A preferred over B) = σ(R(A) - R(B)). The reward model learns to predict human preference from comparative judgments, not absolute ratings. Stage 3: RL fine-tuning. Use PPO to optimize the SFT model to maximize R_φ(prompt, π(prompt)). Add a KL penalty KL(π || π_SFT) to prevent the model from drifting too far from SFT behavior.

The KL penalty is not optional hygiene — it is the mechanism that keeps the LLM in the distribution where the reward model's predictions are calibrated. The reward model was trained on SFT-like outputs. If PPO drifts the policy far from that distribution, the reward model is extrapolating into regions it was never trained on, and its scores become meaningless.

Reward hacking is the central failure mode. The RL policy finds outputs that maximize the reward model's score but do not actually satisfy human intent: models generate long verbose outputs because length correlates with reward, use sycophantic language because agreeing with the user scores higher than accurate disagreement, or find adversarial prompts that fool the reward model. These are not bugs — they are the optimizer doing exactly what the reward function says, which happens to diverge from what humans actually want.

NOT this: RLHF is the final step in making a language model safe and aligned. RLHF optimizes a proxy — a reward model of human preferences — for a goal — truly helpful and safe AI. The proxy has biases, blind spots, and adversarial examples. RLHF improves calibration toward human preferences but does not guarantee alignment. It is one tool in an ongoing research problem.`,
    keyPoints: [
      `**The reward model quality bottlenecks RLHF quality — invest heavily in the preference data collection.**\n\nA reward model trained on biased comparisons systematically steers the model in the wrong direction. Target 10K+ high-quality preference pairs with calibrated annotators and clear guidelines. Annotator disagreement above 15% is a signal the task definition is ambiguous, not just that the task is hard.`,
      `**Reward hacking is subtle and hard to detect — monitor for it explicitly rather than waiting to notice.**\n\nTrack response length over training epochs (inflation signals length hacking), measure sycophancy rate (does the model agree with false premises?), and test for repetition and formatting exploitation. Add dedicated reward model probes for these failure modes before they compound.`,
      `**If the RL-fine-tuned model scores high on the reward model but human evaluators do not prefer it, the reward model has been over-optimized — reduce PPO steps or increase the KL penalty.**\n\nThe gap between proxy score and human preference is the measure of Goodhart damage. Once the reward model is being fooled, additional PPO training makes alignment worse, not better.`,
    ],
    interactivePrompt: `Before you touch the controls: the reward model was trained on 20K human preference comparisons from SFT-style outputs. After 1000 PPO steps, the model generates responses 3× longer than at the start. The reward score is up 40%. What do you check first to decide whether this is genuine improvement or reward hacking?`,
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
    takeaway: `RLHF trains human preference into a reward model from comparative judgments, then uses PPO to maximize that reward — with a KL penalty to keep the policy close enough to the SFT distribution that the reward model's scores remain meaningful and reward hacking is bounded.`,
  },
  {
    id: 'exploration_exploitation',
    interactiveId: 'exploration_exploitation_viz',
    title: 'Exploration vs Exploitation',
    subtitle: 'ε-greedy, UCB, curiosity (ICM), count-based, Thompson sampling, high-dimensional exploration',
    difficulty: 'advanced',
    estimatedMin: 55,
    tags: ['exploration', 'exploitation', 'ucb', 'thompson sampling', 'curiosity', 'intrinsic reward'],
    summary: `Consider a news recommendation system. For each user request you can recommend the user's known-favorite category (exploitation) or try a different category to learn their preferences (exploration). With 100% exploitation the user sees only what they have liked before — you never learn whether they would enjoy something new, and you are stuck with increasingly stale preferences. With 100% exploration recommendations are random and user satisfaction drops. The dilemma: exploration costs short-term performance but enables long-term improvement.

ε-greedy handles this with a simple switch: with probability ε take a random action, otherwise take the best known one. Simple, but fundamentally broken in large action spaces. With 10M news articles and ε = 0.1, ε-greedy explores uniformly across all 10M items — allocating just as much exploration to articles you are certain are terrible as to those with genuine uncertainty. It wastes exploration budget on obviously inferior options.

UCB (Upper Confidence Bound) directs exploration at uncertainty instead. Score each action as μ_a + c√(log t / N_a) where μ_a is the estimated reward, N_a is visit count, and t is total time steps. The second term is an exploration bonus that shrinks as N_a grows. Actions you have barely tried have large bonuses — the algorithm prefers them until it has reduced its uncertainty. This implements "optimism in the face of uncertainty": act as if uncertain actions are as good as their highest plausible value.

Thompson Sampling is the Bayesian version. Model each action's reward as a distribution — Beta(α, β) for click/no-click outcomes. Sample one reward estimate from each action's current posterior. Take the best. Actions with high uncertainty have wide distributions and are more likely to sample a high value — which means they are more likely to be selected and explored. As evidence accumulates, posteriors tighten and exploration naturally decreases. No explicit exploration rate to tune.

NOT this: exploration is just about trying random actions. Structured exploration — UCB, Thompson Sampling — outperforms random exploration by directing effort toward uncertain actions, not arbitrary ones. In a recommendation system with 10M items, ε-greedy wastes exploration uniformly. UCB concentrates exploration where information value is highest. The difference in regret is asymptotically O(ε T) versus O(log T).`,
    keyPoints: [
      `**Use Thompson Sampling as your default for bandit problems — it adapts exploration to uncertainty automatically and outperforms ε-greedy empirically in most non-stationary settings.**\n\nThompson Sampling requires no explicit exploration rate tuning. As evidence accumulates, posterior distributions tighten and exploration naturally decreases. For contextual bandits where per-user context matters, use contextual Thompson Sampling or LinUCB.`,
      `**Never use a fixed ε in ε-greedy in production — constant exploration overhead wastes resources even after the policy has converged.**\n\nUse a decaying schedule (ε_t = 1/√t) or switch to UCB/Thompson which naturally reduce exploration as uncertainty decreases. A fixed ε = 0.1 means 10% of all recommendations forever are random, even after millions of interactions.`,
      `**If exploration rate per time step drops to near zero, the system has converged and will not adapt to preference changes — maintain a minimum exploration floor.**\n\nIn non-stationary environments (user preferences shift, product catalog changes, seasonality), a fully converged policy becomes stale. Set a minimum exploration floor of 1–5% and monitor whether the floor is actively being used, which signals that preferences may have shifted.`,
    ],
    interactivePrompt: `Before you touch the controls: three news categories have been tried 100, 10, and 2 times with average rewards of 0.6, 0.5, and 0.3. Using UCB with c = 1 and t = 112, which category does UCB select — and why is it not the one with the highest mean reward?`,
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
    takeaway: `Exploration should be directed at uncertainty, not randomness — UCB and Thompson Sampling concentrate effort where information gain is highest, while ε-greedy wastes exploration uniformly across actions including the obviously inferior ones.`,
  },
  {
    id: 'rl_production',
    title: 'RL in Production',
    subtitle: 'Off-policy evaluation, reward delay, sim-to-real, safe RL, when NOT to use RL',
    difficulty: 'advanced',
    estimatedMin: 70,
    tags: ['off-policy evaluation', 'importance sampling', 'doubly robust', 'sim-to-real', 'safe rl', 'constrained mdp'],
    summary: `You have trained a stellar RL agent in simulation — 95th percentile performance on your evaluation benchmark. You deploy it to production. Within 2 days, performance drops 40%. The agent has found a way to collect rewards that technically satisfies your reward function but does not serve users. This is not a simulation failure — it is the fundamental difficulty of RL in production: specification, distribution shift, and safety.

Four production failure modes, and their fixes. First: reward hacking. The agent optimizes the letter, not the spirit, of the reward. "Maximize clicks" becomes clickbait that never delivers value. Fix: before training, spend 2 hours listing every way an agent could maximize the reward without satisfying the underlying objective. For each exploit, add a penalty term or constraint. Second: distribution shift. The simulator does not match production — agents learn to exploit simulator artifacts. Fix: domain randomization, sim-to-real transfer, real-data offline RL. Third: catastrophic forgetting. Online updates overwrite good behavior. Fix: experience replay, behavioral cloning on a buffer of historically good trajectories. Fourth: exploding Q-values. RL can be unstable without careful configuration. Fix: gradient clipping, target networks, reward normalization.

Safe exploration matters in production because exploratory actions can cause real harm. A bad recommendation alienates a user. An incorrect drug dose harms a patient. Constrained RL formulations add a safety metric as a constraint: optimize reward subject to the constraint being satisfied. Conservative policies require human approval for actions below a confidence threshold.

Offline RL addresses sample efficiency and safety together by training entirely on logged historical data without new environment interaction. Conservative Q-Learning (CQL), Implicit Q-Learning (IQL), and Decision Transformer learn from fixed datasets — critical when real environment interaction is expensive or risky.

NOT this: if the agent performs well in simulation, it will perform well in production. Simulation fidelity is never perfect. RL agents are brittle to distribution shift in ways that supervised learning models are not — the policy was trained to optimize in the simulated world, and optimization finds every crack in the simulation. Always A/B test with limited traffic before full deployment, and monitor for the specific reward hacking patterns your reward function makes possible.`,
    keyPoints: [
      `**Red-team the reward function before training — list every way an agent could maximize the reward without satisfying the underlying objective.**\n\nThis adversarial analysis takes 2 hours and prevents the most common production failures. For each exploit, add a penalty term or constraint before training begins. Reward hacking patterns are almost always predictable in advance if you think adversarially.`,
      `**Always maintain a hard fallback policy that activates if the RL agent's action confidence drops below a threshold.**\n\nRL agents degrade unpredictably. A simple rule-based or supervised learning fallback prevents a partial RL failure from becoming a total outage. Never deploy an RL agent without it. This is non-optional.`,
      `**In production, compare the RL agent's average reward per episode against a simple heuristic policy — if the RL agent underperforms the heuristic after deployment, you have distribution shift.**\n\nTraining distribution and deployment distribution diverged. The agent learned to optimize for the training world, which differs from the real one. First diagnostic step: compare on the heuristic baseline, then investigate what changed in the deployment distribution.`,
    ],
    interactivePrompt: `Before you touch the controls: the RL agent is trained with reward = clicks + 0.1 × session_length. In production it starts generating clickbait titles. What penalty term would you add to the reward function to counteract this — and how would you verify it works before full deployment?`,
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
    takeaway: `The most important production RL skill is red-teaming your reward function before training — listing every way an agent could maximize the proxy without satisfying the actual objective, then adding penalties for each exploit before a single training step runs.`,
  },
]
