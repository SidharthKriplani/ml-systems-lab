export const RL_MODULES = [
  {
    id: 'mdp_framework',
    interactiveId: 'discount_horizon_viz',
    title: 'Markov Decision Processes',
    subtitle: 'States, actions, rewards, transitions, discount factor — the formal RL framework',
    difficulty: 'foundational',
    estimatedMin: 40,
    tags: ['mdp', 'markov', 'bellman', 'discount', 'pomdp'],
    summary: `Imagine a robot navigating a grid to reach a goal. At each step it sees its current position, chooses a direction to move, and receives a reward: +1 for reaching the goal, -0.01 for each step taken, -1 for falling into a hole. After moving it ends up in a new position, and the decision problem repeats until the robot reaches a terminal state. That sequence of state-action-reward-state is an episode, and RL's entire job is to find the sequence of actions — the policy — that maximizes total reward across that episode.

[FIGURE: loop]

The MDP (Markov Decision Process) is the formal language for this. It has five components. The state space S is all possible positions the robot can be in. The action space A is all directions it can move. The transition function T(s, a, s') = P(s' | s, a) is the probability of landing in s' after moving in direction a from state s. The reward function R(s, a, s') is the immediate reward received on that transition. The discount factor γ ∈ [0, 1) controls how much future rewards are worth relative to immediate ones: γ = 0 means the robot cares only about the next step, γ = 0.99 means a reward 100 steps away has decayed to about 37% of its value (0.99^100 ≈ 0.37) — still meaningfully non-negligible, giving an effective planning horizon of roughly 1/(1-γ) ≈ 100 steps, versus a 1-step horizon at γ = 0.

The return G_t = R_{t+1} + γR_{t+2} + γ²R_{t+3} + ... is the discounted sum of all future rewards from time t. The policy π(a | s) is the probability of taking action a in state s. The agent's goal is to find π* — the optimal policy — that maximizes expected return E[G_t] from every starting state.

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
          `A) Finite-horizon MDPs redefine the reward function R_t(s,a) at every remaining timestep via an explicit decay schedule, while infinite-horizon MDPs hold a single constant reward function fixed for the entire trajectory, so only the finite case ever needs re-optimizing`,
          `B) Finite-horizon MDPs are forced into stochastic softmax policies near the terminal step because bounded time makes the agent provably risk-averse, whereas infinite-horizon MDPs are guaranteed a deterministic policy by the policy improvement theorem regardless of γ`,
          `C) V_t(s) changes with remaining time t via backward induction, so the greedy policy differs at each t; the infinite-horizon Bellman equation has a unique fixed point, so the same greedy policy is optimal at every step`,
          `D) Infinite-horizon MDPs are defined to always use γ close to 1 so the agent becomes indifferent to timing, while finite-horizon MDPs are mathematically restricted to exactly γ=1, and this restriction is what forces their policy to depend on time`,
        ],
        answer: `C`
      },
      {
        q: `Your robot RL agent receives only a camera image as observation. It keeps walking into the same wall repeatedly. What Markov property violation is happening and how do you fix it?`,
        options: [
          `A) The observation is not Markov because one frame lacks motion and exploration history; fix with frame stacking, an LSTM over past observations, or a belief-filter state estimator`,
          `B) The Markov property is fully satisfied because a single high-resolution camera frame captures the complete physical state, including velocity and any previously collected keys; the real issue is a reward function that under-penalises wall collisions`,
          `C) The violation occurs because the transition function P(s'|s,a) is inherently stochastic from sensor noise; the fix is to train entirely in a deterministic, noise-free simulator before ever deploying to the real robot's camera`,
          `D) The observation space is simply too high-dimensional, causing numerical instability and exploding gradients inside the policy network's convolutional layers; the fix is to progressively reduce image resolution until the property empirically holds`,
        ],
        answer: `A`
      },
      {
        q: `Why is γ = 0.99 harder to train with than γ = 0.95, even if both converge to a valid solution?`,
        options: [
          `A) γ=0.99 discounts step-to-step reward far more aggressively than γ=0.95 does, which paradoxically makes the agent ignore long-term consequences entirely and collapse to a myopic greedy policy that is strictly harder to improve via gradient methods`,
          `B) γ=0.99 forces the agent to take more environment interactions before training can begin at all, because every reward signal must first be discounted to exactly zero across the entire buffer before a single gradient update is computed`,
          `C) γ=0.99 is harder to train specifically because it mathematically requires a denser, hand-engineered reward function at every timestep, which is fundamentally more costly to design than the naturally sparse rewards paired with γ=0.95`,
          `D) γ=0.99 extends the effective horizon to ~100 steps vs ~20 for γ=0.95, raising Monte Carlo variance and slowing TD propagation — more samples are needed to stabilise value estimates`,
        ],
        answer: `D`
      },
      {
        q: `A product team asks you to deploy an RL agent for content recommendation. Which two of the following are essential MDP design considerations for this system?`,
        options: [
          `A) State must preserve the Markov property — include enough user history (not just the current click) so the next recommendation doesn't require information already lost from the state`,
          `B) Reward should avoid Goodhart-prone proxies — an engagement metric like raw clicks is easy to instrument but risks reward hacking toward clickbait rather than true user value`,
          `C) The action space can be left unconstrained since gradient descent automatically adapts to any number of candidate items without any retrieval or ranking pre-filtering step`,
          `D) Off-policy distribution shift from historical logged data is not a real concern here, because pretraining the policy with supervised learning on click logs eliminates it by construction`,
        ],
        answer: ['A', 'B']
      },
    ],
    takeaway: `The MDP is just a formal way of saying: at every step the agent sees a state, picks an action, gets a reward, and ends up somewhere new — and the goal is to find the policy that makes those rewards add up to as much as possible.`,
    recap: [
      "**MDP = 5 components:** state space $S$, actions $A$, transitions $T(s,a,s')$, reward $R$, discount $\\gamma \\in [0,1)$.",
      "**Return** $G_t = R_{t+1} + \\gamma R_{t+2} + \\gamma^2 R_{t+3} + \\dots$ — goal is a policy $\\pi^*$ maximizing $E[G_t]$.",
      "**Markov property:** next state depends only on current state+action, not history. Break it, augment the state.",
      "**\\gamma tunes horizon:** 0 = myopic, 0.99 = ~100 steps of future still matter.",
      "**Write all 5 components explicitly before coding** — reward ambiguity is the #1 failure.",
      "**Easy-to-measure reward misaligned with the true objective** is the classic production trap (clicks -> clickbait).",
      "**MDP is the language, not just games:** ad bidding, recsys, drug dosing all fit.",
    ],
    figures: {
      loop: `<svg viewBox="0 0 360 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="40" y="20" width="110" height="34" rx="7" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="95" y="41" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Agent  &#960;(a|s)</text>
  <rect x="210" y="20" width="110" height="34" rx="7" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="265" y="41" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Environment</text>
  <path d="M150,30 C185,20 190,20 210,30" fill="none" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#ah)"/>
  <text x="180" y="15" text-anchor="middle" fill="var(--ink-mid)" font-size="8">action a</text>
  <path d="M210,46 C190,58 185,58 150,46" fill="none" stroke="var(--amber)" stroke-width="1.5" marker-end="url(#ah2)"/>
  <text x="180" y="72" text-anchor="middle" fill="var(--amber)" font-size="8">reward R, next state s'</text>
  <text x="40" y="100" fill="var(--ink-low)" font-size="8">s &#8594; a &#8594; R &#8594; s' &#8594; a' &#8594; ...  one episode, over and over</text>
  <text x="40" y="118" fill="var(--ink-low)" font-size="8">Markov: s' depends only on (s, a), never on the history.</text>
  <text x="40" y="136" fill="var(--ink-low)" font-size="8">Goal: find &#960; maximizing G&#8348; = R&#8348;&#8330;&#8321; + &#947;R&#8348;&#8330;&#8322; + &#947;&#178;R&#8348;&#8330;&#8323; + ...</text>
  <defs>
    <marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker>
    <marker id="ah2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--amber)"/></marker>
  </defs>
</svg>`,
    },
  },
  {
    id: 'bellman_equations',
    title: 'Bellman Equations',
    subtitle: 'V(s), Q(s,a), optimality equations, contraction mapping, curse of dimensionality',
    difficulty: 'foundational',
    estimatedMin: 45,
    tags: ['bellman', 'value function', 'dynamic programming', 'contraction', 'tabular'],
    summary: `Consider a 4×4 grid world with γ = 0.9. You want to know: what is the expected total reward — the value — of being at position (2,3) if you follow the optimal policy? To answer this, you need to know the value of neighboring positions, because your value here depends on where you can move next. But those values depend on their neighbors too. The circular dependency seems impossible to resolve — yet this is exactly what the Bellman equations do: they express the value of a state as a function of the values of its successors, turning a circular problem into a recursive one with a guaranteed fixed point.

[FIGURE: backup]

The state value function under a policy π is V^π(s) = E_π[R_{t+1} + γ V^π(S_{t+1}) | S_t = s]. The value of a state equals immediate expected reward plus discounted expected value of the next state. This is the Bellman expectation equation — self-consistent, recursive, and for a fixed policy, linear enough to solve directly.

The optimal value function is V*(s) = max_a [R(s,a) + γ Σ_{s'} P(s'|s,a) V*(s')]. The value of the best possible policy equals the action that maximizes immediate reward plus discounted future value. The action-value function Q*(s, a) = R(s,a) + γ Σ_{s'} P(s'|s,a) max_{a'} Q*(s', a') is more practically useful: it tells you the value of taking action a in state s and then acting optimally, which means you can select actions directly via argmax_a Q*(s, a) without needing to model transitions.

Value iteration starts with an arbitrary value estimate and repeatedly applies the Bellman operator until convergence. Contraction mapping theory guarantees this converges to V* for finite MDPs. Policy iteration alternates between evaluating the current policy exactly and then improving it greedily. Both are guaranteed to find the optimal policy — but only in the tabular case.

NOT this: you need to know the transition model T(s, a, s') to use Bellman equations. Model-based RL uses the equations directly with a known or learned T. Model-free RL — Q-learning, TD learning — uses samples to estimate the Bellman updates without ever modeling T explicitly. The Bellman structure guides both approaches by telling you what quantity to estimate.`,
    keyPoints: [
      `**Learn the Q-function Q*(s, a), not V*(s), for most RL applications.**\n\nQ*(s, a) tells you which action to take directly — argmax_a Q*(s, a) — without needing transition probabilities. V*(s) tells you how good a state is but not what to do, so unless you have a model of transitions, V alone cannot produce a policy.`,
      `**Tabular Q-learning is infeasible for large or continuous state spaces — this is not a performance issue, it is a physical impossibility.**\n\nA robot with 6 joint angles discretized at 100 positions per joint has 10^12 states. Storing a Q-table for this requires ~8 TB even at 8 bytes/entry — technically storable today, but wildly impractical to fill from experience (you would need to visit and revisit trillions of state-action pairs), and it only gets worse as joints or precision increase. The moment the state space is too large to enumerate, you need function approximation — neural networks — which breaks the convergence guarantee.`,
      `**If Q-values grow without bound during training, the Bellman backup is diverging due to a feedback loop between the prediction and the target.**\n\nThe target y = R + γ max Q_θ(s') depends on the same θ being updated, so each gradient step shifts both the prediction and the target. Fix this with a target network: freeze θ^- for K steps so the target is stationary, then copy θ into θ^-.`,
    ],
    interactivePrompt: `Before you touch the controls: in the 4×4 grid, position (0,0) is the goal and (3,3) is the start. With γ = 0.9 and a reward of +1 only at the goal, roughly what value would you assign to a state 3 steps away from the goal?`,
    checkQuestions: [
      {
        q: `Write the Bellman optimality equation for Q*(s,a) and explain what makes it "nonlinear," unlike the Bellman expectation equation.`,
        options: [
          `A) Q*(s,a) = R(s,a) + γ Σ_{s'} P(s'|s,a) max_{a'} Q*(s',a') is nonlinear purely because P(s'|s,a) is itself a nonlinear stochastic function of the underlying state and action, independent of any max or expectation operator appearing anywhere in the equation`,
          `B) The Bellman optimality equation is nonlinear because Q*(s,a) appears on both the left and right sides simultaneously, creating a circular self-referential dependency that ordinary matrix algebra and Gaussian elimination cannot resolve without iterative approximation`,
          `C) The max_{a'} operator makes it nonlinear; the Bellman expectation equation instead uses Σ_{a'} π(a'|s') Q^π(s',a') — a linear weighted sum solvable directly as V^π = (I-γP^π)^{-1}R^π`,
          `D) The Bellman optimality equation is nonlinear because the discount factor γ multiplies Q* by itself recursively across every future timestep, producing an infinite geometric series whose closed form requires specialised nonlinear numerical solvers`,
        ],
        answer: `C`
      },
      {
        q: `In policy iteration, why is policy improvement guaranteed to produce a policy at least as good as the current one? What is the formal argument?`,
        options: [
          `A) Policy improvement is guaranteed because at each iteration the algorithm exhaustively enumerates every possible deterministic policy over the full state space and selects whichever attains the highest expected return, so a worse policy can mathematically never be selected`,
          `B) Because π'(s) = argmax_a Q^π(s,a) gives V^π(s) ≤ Q^π(s,π'(s)), inducting this bound through all future steps shows V^{π'}(s) ≥ V^π(s) everywhere`,
          `C) Policy improvement is guaranteed to be non-decreasing because the greedy policy directly minimises the mean-squared Bellman error across all states, and the contraction mapping theorem guarantees that minimising this error implies the resulting policy's true value is at least as high`,
          `D) The guarantee follows purely from the fact that Q^π(s,a) is always greater than or equal to V^π(s) for every action a in every state, so any policy derived by taking the argmax of the Q-function is mathematically guaranteed to have a value at least as high as the current policy`,
        ],
        answer: `B`
      },
      {
        q: `You are implementing Q-learning with a neural network and notice Q-values growing unboundedly during training. Which two fixes directly address the bootstrapping instability that causes this?`,
        options: [
          `A) Freeze a target network θ^- for K steps so the TD target y = R + γ max_{a'} Q_{θ^-}(s',a') stays stationary while θ is updated, breaking the positive feedback loop`,
          `B) Clip gradients and rewards and lower the learning rate, so each individual update shifts θ (and therefore the target) by a much smaller amount`,
          `C) Increase the network's parameter count so the function approximator can represent Q* exactly, which removes all bootstrapping error by construction`,
          `D) Widen the reward scale to be unbounded so the max_{a'} operator saturates numerically and stops the values from growing further`,
        ],
        answer: ['A', 'B']
      },
      {
        q: `How many states does a simplified Atari game environment like Pong have, and why does this make tabular DP completely impractical?`,
        options: [
          `A) Pong has approximately 10^6 states after discretising pixel values into coarse bins, which is borderline tractable computationally but far too slow for real-time online training without dedicated specialised tensor-processing hardware clusters`,
          `B) Pong has roughly 10^20 states once the full preprocessing pipeline is applied, which is an enormous number but could in principle still be handled by a sufficiently large distributed computing cluster spanning an entire data centre`,
          `C) Pong has exactly 84×84×3 = 21,168 states after standard DQN preprocessing, which makes tabular dynamic programming tractable in theory but impractically slow in practice purely because of the size of the discrete action space`,
          `D) Pong at 84×84 with binary (on/off) pixels already has 2^{7056} states — vastly more than atoms in the observable universe (~2^{266}); storing V*(s) for every one is impossible, so DQN compresses the value function into ~1.7M parameters instead (the standard Nature-2015 conv+fc architecture)`,
        ],
        answer: `D`
      },
    ],
    takeaway: `The Bellman equation turns the circular problem of value estimation into a recursive fixed point: the value of a state equals immediate reward plus discounted value of the best next state — and iterating this update is guaranteed to find the answer.`,
    recap: [
      "**Bellman turns circular value estimation into a recursive fixed point.**",
      "**Expectation eq:** $V^\\pi(s) = E_\\pi[R_{t+1} + \\gamma V^\\pi(S_{t+1})]$ — linear for a fixed policy.",
      "**Optimality eq is nonlinear** because of the `max` operator: $V^*(s) = \\max_a[R + \\gamma \\sum P(s'|s,a)V^*(s')]$.",
      "**Learn $Q^*(s,a)$, not $V^*$:** `argmax_a Q` gives the action with no transition model needed.",
      "**Value/policy iteration converge** via contraction mapping — but only in the tabular case.",
      "**Tabular is a physical impossibility at scale:** 6 joints × 100 positions = $10^{12}$ states. Need function approximation.",
      "**Unbounded $Q$ during training = diverging Bellman backup.** Fix with a frozen target network.",
    ],
    figures: {
      backup: `<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <circle cx="180" cy="24" r="15" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="180" y="28" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">s</text>
  <text x="205" y="20" fill="var(--ink-low)" font-size="7.5">V*(s) = max over a</text>
  ${[80, 180, 280].map((x, i) => `
  <line x1="180" y1="39" x2="${x}" y2="66" stroke="var(--ink-low)" stroke-width="1.2"/>
  <rect x="${x - 14}" y="66" width="28" height="18" rx="4" fill="none" stroke="var(--amber)"/>
  <text x="${x}" y="79" text-anchor="middle" fill="var(--amber)" font-size="8">a${i + 1}</text>`).join('')}
  ${[[55, 105], [180, 105], [305, 105]].map((p, i) => `
  <line x1="${[80, 180, 280][i]}" y1="84" x2="${p[0]}" y2="118" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="2 2"/>
  <circle cx="${p[0]}" cy="128" r="12" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="${p[0]}" y="131" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">s'</text>`).join('')}
  <text x="10" y="152" fill="var(--ink-low)" font-size="7.5">backup: V*(s) = max&#8323; [ R(s,a) + &#947; &#931;&#8347;&#8242; P(s'|s,a) V*(s') ]  &#8212; the max makes it nonlinear</text>
</svg>`,
    },
  },
  {
    id: 'temporal_difference',
    title: 'Temporal Difference Learning',
    subtitle: 'TD(0), TD(λ), SARSA vs Q-learning, deadly triad, divergence with FA',
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['td learning', 'sarsa', 'q-learning', 'eligibility traces', 'deadly triad', 'off-policy'],
    summary: `Consider a stock trading system. After each trade you receive a reward — profit or loss. But the final profit of a multi-leg strategy is not known until all positions close, potentially hours later. You cannot wait for the episode to end before updating your value estimates. You need to learn from partial information, updating as you go. Temporal difference learning does exactly this: update V(s_t) based on the observed reward R_{t+1} and the current estimate V(s_{t+1}), without waiting for the final return.

[FIGURE: tdmc]

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
        q: `SARSA and Q-learning have identical updates except for one term. Which two of the following statements about that difference are correct?`,
        options: [
          `A) SARSA is on-policy: it bootstraps off Q(s_{t+1}, A_{t+1}) with A_{t+1} ~ π, so it converges to Q^π, the value of the policy actually being followed (including its exploration)`,
          `B) Q-learning is off-policy: it bootstraps off max_{a'} Q(s_{t+1}, a'), converging to Q*, but this max-based target is more prone to the deadly triad when paired with function approximation`,
          `C) SARSA converges to the globally optimal Q* under any behavior policy, including a purely random one, identically to how Q-learning converges regardless of exploration strategy`,
          `D) Q-learning requires explicit importance-sampling correction on every single-step TD update in order to remain unbiased, exactly as SARSA does`,
        ],
        answer: ['A', 'B']
      },
      {
        q: `Explain Baird's counterexample intuitively. Why does Q-learning with linear function approximation diverge even in a simple MDP?`,
        options: [
          `A) The projected Bellman operator TΠ is a γ-contraction only under on-policy state weighting; off-policy weighting makes TΠ a non-contraction, so repeated application diverges; fix with importance sampling or gradient-TD methods (GTD, GTD2)`,
          `B) Baird's counterexample shows divergence purely because Q-learning with linear function approximation always uses a learning rate that is too high for that specific seven-state MDP structure, and the only documented fix is a much smaller, hand-tuned constant step size`,
          `C) Divergence in Baird's counterexample occurs because the reward signal is exactly zero everywhere in the seven-state chain, causing the Q-function to receive no gradient signal at all and drift randomly under floating-point numerical noise accumulated over iterations`,
          `D) The counterexample demonstrates that linear function approximation cannot represent the optimal Q-function accurately in this MDP, so approximation error compounds multiplicatively over successive Bellman backups until the values diverge to infinity`,
        ],
        answer: `A`
      },
      {
        q: `You are training a Q-learning agent on a game environment and observe that the Q-values grow from ~10 to ~10^6 over 500k steps, with training reward staying flat. Diagnose and fix.`,
        options: [
          `A) Q-values growing while reward stays flat means the agent is actually learning successfully but the reward function simply has a numerical scaling bug; multiply every observed reward by a fixed constant factor to bring the Q-values back into a visually reasonable range`,
          `B) This is a deadly-triad symptom: off-policy replay + bootstrapping + FA creates a feedback loop where max Q overestimates → inflates the target → inflates Q further; fix in order: target network, Huber/gradient clipping, lower learning rate, then Double DQN`,
          `C) The divergence is caused entirely by having too large a replay buffer; old transitions collected under a much weaker earlier policy corrupt the current training signal by overestimation, so reduce the buffer size to keep only the most recent 10k transitions`,
          `D) Flat reward with growing Q-values indicates the exploration rate ε is set too high, causing the agent to take mostly random actions that generate artificially high Q-estimates for states it has barely visited; reduce ε toward zero immediately to fix this`,
        ],
        answer: `B`
      },
    ],
    takeaway: `TD learning updates value estimates after every step using a bootstrapped target — trading some bias for dramatically lower variance than Monte Carlo, enabling online learning in long-horizon tasks where waiting for full episode returns is impractical.`,
    recap: [
      "**TD updates every step, no full episode needed:** $V(s_t) \\leftarrow V(s_t) + \\alpha[R_{t+1} + \\gamma V(s_{t+1}) - V(s_t)]$.",
      "**Bracket = TD error $\\delta_t$;** $V(s_{t+1})$ is a bootstrapped estimate (one estimate updating another).",
      "**Bias-variance tradeoff:** MC unbiased/high variance, TD biased/low variance. Long horizons -> TD is the only option.",
      "**TD(λ) interpolates:** λ=0 one-step TD, λ=1 Monte Carlo; use 0.7–0.9.",
      "**SARSA (on-policy, uses $A_{t+1}\\sim\\pi$) vs Q-learning (off-policy, uses $\\max_{a'}$).**",
      "**Learning rate too large = divergence:** check $\\alpha$ first; needs Robbins-Monro ($\\sum\\alpha=\\infty, \\sum\\alpha^2<\\infty$).",
      "**Deadly triad = off-policy + bootstrapping + FA** (Baird's counterexample); plot TD error as your diagnostic.",
    ],
    figures: {
      tdmc: `<svg viewBox="0 0 360 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="14" fill="var(--ink-low)" font-size="8" font-weight="700">TD(0): bootstrap after ONE step</text>
  ${[0, 1, 2, 3, 4].map(i => `<circle cx="${30 + i * 46}" cy="38" r="9" fill="${i < 2 ? 'var(--prime-faint)' : 'var(--depth)'}" stroke="${i < 2 ? 'var(--prime)' : 'var(--rim)'}"/><text x="${30 + i * 46}" y="41" text-anchor="middle" fill="var(--ink-mid)" font-size="7">s${i}</text>`).join('')}
  <path d="M39,38 l28,0" stroke="var(--prime)" stroke-width="1.5" marker-end="url(#t1)"/>
  <text x="30" y="60" fill="var(--prime)" font-size="7">target = R&#8321; + &#947;V(s&#8321;)  &#8592; uses an estimate: low variance, biased</text>
  <text x="4" y="88" fill="var(--ink-low)" font-size="8" font-weight="700">Monte Carlo: wait for the FULL return</text>
  ${[0, 1, 2, 3, 4].map(i => `<circle cx="${30 + i * 46}" cy="108" r="9" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="${30 + i * 46}" y="111" text-anchor="middle" fill="var(--ink-mid)" font-size="7">s${i}</text>`).join('')}
  <path d="M39,108 C120,132 150,132 214,108" fill="none" stroke="var(--amber)" stroke-width="1.5" marker-end="url(#t2)"/>
  <text x="30" y="132" fill="var(--amber)" font-size="7">target = G&#8320; = R&#8321;+&#947;R&#8322;+...+&#947;&#8319;R&#8345;  &#8592; real rewards: unbiased, high variance</text>
  <defs>
    <marker id="t1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--prime)"/></marker>
    <marker id="t2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--amber)"/></marker>
  </defs>
</svg>`,
    },
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
        q: `Vanilla DQN adds two specific mechanisms on top of neural-network Q-learning to make training stable. Which two are they?`,
        options: [
          `A) Experience replay — sample random mini-batches from a large buffer of past transitions so gradient estimates are decorrelated and match the full training distribution instead of the recent trajectory's local statistics`,
          `B) A frozen target network θ^-, copied from θ only every K steps, so the TD bootstrap target stays stationary between updates and the moving-target feedback loop is broken`,
          `C) A recurrent policy architecture that conditions on the full episode history, which is what actually removes the correlation between consecutive gradient updates`,
          `D) Second-order natural-gradient updates computed via Fisher information matrix-vector products, which is what stops the network from catastrophically forgetting older regions of state space`,
        ],
        answer: ['A', 'B']
      },
      {
        q: `What is the difference between Dueling DQN and standard DQN architecturally, and in what types of states does Dueling provide the largest benefit?`,
        options: [
          `A) Dueling DQN uses two entirely separate Q-networks — one trained only on even-numbered timesteps and one only on odd-numbered timesteps — specifically to reduce gradient correlation between consecutive updates; it benefits most in environments with sparse terminal rewards`,
          `B) Dueling DQN adds an auxiliary loss term on state-visitation counts to explicitly encourage exploration into rarely-seen states; it benefits most in environments where many distinct states happen to share identical Q-values, forcing exploration to become effectively uniform`,
          `C) Dueling DQN splits V(s) and A(s,a), merged as Q = V(s) + A(s,a) - mean_a A(s,a); it helps most in states where action choice barely matters — V updates from any transition there, faster than a single-head network`,
          `D) Dueling DQN replaces the standard scalar Q-function output layer with a full distributional layer that instead outputs quantiles of the entire return distribution rather than a point estimate; it benefits most in states exhibiting unusually high reward variance`,
        ],
        answer: `C`
      },
      {
        q: `You are applying DQN to a robotic manipulation task where the reward is 1 only when the robot successfully places an object and 0 otherwise, with episodes of 200 steps. After 10M steps, the policy never achieves reward > 0. What is happening and what are your next steps?`,
        options: [
          `A) The issue is that DQN is architecturally incapable of learning any manipulation task at all; switching to a policy-gradient algorithm like PPO will automatically resolve the sparse-reward problem because PPO's on-policy data is always perfectly relevant to the current policy`,
          `B) The network has overfit to the constant 0-reward signal seen in every episode; the fix is to regularise the Q-network more heavily with dropout and weight decay so it generalises correctly to the rare success state it has essentially never observed during training`,
          `C) 10M steps is simply insufficient for a robotic manipulation task of this difficulty; continuing training for 100M steps will let random exploration accidentally stumble onto the success state often enough for ordinary Q-learning to slowly propagate the reward signal backward`,
          `D) The buffer holds only 0-reward transitions, giving no gradient signal; next steps in order: curriculum learning (start near the target), Hindsight Experience Replay (relabel failures as their achieved goal), dense reward shaping, and demo-augmented RL`,
        ],
        answer: `D`
      },
    ],
    takeaway: `DQN makes Q-learning stable for neural networks with two fixes: experience replay breaks the temporal correlation that causes gradient overfitting, and a target network freezes the bootstrap target to prevent the moving-target feedback loop that amplifies Q-values into divergence.`,
    recap: [
      "**DQN replaces the Q-table with a network $Q(s,a;\\theta)$** — tabular is impossible for pixel states.",
      "**Naive Q-learning on a net is unstable:** consecutive frames are correlated, violating SGD's IID assumption.",
      "**Fix 1 — experience replay:** buffer up to 1M transitions, sample random minibatches to decorrelate.",
      "**Fix 2 — target network:** frozen $\\theta^-$ copied every 10K steps stops the moving-target feedback loop.",
      "**Use both together** — removing either diverges; they solve independent problems.",
      "**Double DQN** decouples action selection ($\\theta$) from evaluation ($\\theta^-$) to kill max-operator overestimation; **Dueling** splits $Q = V + A$.",
      "**Buffer < 100K memorizes recent play;** DQN is discrete-action only — use actor-critic for continuous control.",
    ],
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

Baseline subtraction solves this. Replace G_t with (G_t - b(s_t)) where b depends only on the state, not the action. The expected gradient is unchanged — any state-dependent term subtracts to zero because the policy log-gradient sums to zero over actions. But variance drops by centering returns around the state's average value. The standard practical baseline is V^π(s_t) itself, giving the advantage A(s_t, a_t) = G_t - V^π(s_t) — how much better this action was than average. (The true variance-minimizing baseline is technically a score-weighted average of returns, not V^π(s) exactly — but V^π(s) captures almost all the benefit and is far simpler to estimate, which is why it's the one actually used in practice.)

NOT this: policy gradients are unbiased because they use sampled returns. Unbiased in expectation does not mean useful in practice. REINFORCE has extremely high variance for long-horizon tasks, and the gradient estimate from a single trajectory is dominated by random noise. This is why actor-critic methods — which replace G_t with a learned critic estimate — dominate in practice.`,
    keyPoints: [
      `**Always subtract a baseline from returns in policy gradient updates.**\n\nUsing the mean return or a learned value function as baseline reduces variance by 10–100× with zero bias cost — the baseline integrates to zero over the policy distribution. Skipping the baseline is skipping the most important and cheapest variance reduction available.`,
      `**If σ_θ(s) → 0 early in training, the policy has collapsed to deterministic and exploration has stopped — and the gradient does not go quietly: the Gaussian score function (a-μ)/σ² blows up as σ→0, so the collapse shows up as gradient-variance explosion and numerical instability, not a clean zero signal.**\n\nAdd an entropy bonus H[π_θ] to the loss to maintain policy spread throughout training. Without it, the network converges to the first good-looking action it found and stops exploring whether there is something better.`,
      `**If policy gradient training is noisy with high variance in returns across episodes, you need more environment samples per update — not a learning rate change.**\n\nGradient signal-to-noise ratio improves as √(num_samples). Quadrupling the number of parallel environments halves gradient noise. Collect longer rollouts or more parallel workers before tuning any other hyperparameter.`,
      `**In a two-player zero-sum game (poker, adversarial self-play), a deterministic policy is always exploitable — the opponent observes it and plays the exact counter.** The game-theoretic optimum is a Nash equilibrium, which in general requires a mixed (stochastic) strategy over actions — something argmax Q*(s,a) cannot represent at all, but a stochastic policy π_θ(a|s) can. This is a second, independent reason (beyond continuous actions) that policy gradients generalize where value-based methods break down.`,
    ],
    interactivePrompt: `Before you touch the controls: the robotic arm gets +10 for reaching the target in under 20 steps and -0.1 per step. Over 10 episodes, returns range from -2 to +8. Without a baseline, every action in every episode gets weighted by a different G_t. What would happen to the gradient if you used V(s) = 3 as a constant baseline?`,
    checkQuestions: [
      {
        q: `Which two statements correctly explain why subtracting a state-only baseline b(s) from returns in a policy gradient update is both safe and useful?`,
        options: [
          `A) b(s) factors out of the expectation over a, and Σ_a ∇_θ π_θ(a|s) = ∇_θ Σ_a π_θ(a|s) = ∇_θ 1 = 0, so E_{a~π}[b(s)·∇_θ log π_θ(a|s)] = 0 — the estimator's expectation is unchanged`,
          `B) Centering returns around a state-dependent baseline reduces the variance of the sampled gradient estimate without shifting its expected direction`,
          `C) The baseline must itself depend on the action taken in order to cancel the portion of variance contributed specifically by that action`,
          `D) Subtracting any baseline changes the expected gradient direction, and this shift is corrected afterward by a separate importance-sampling correction term`,
        ],
        answer: ['A', 'B']
      },
      {
        q: `You are training a continuous-control robot with REINFORCE and the policy fails to improve despite 50,000 episodes. What is likely happening and what changes do you make?`,
        options: [
          `A) The problem is purely insufficient data; 50,000 episodes is simply never enough for REINFORCE to converge on any continuous-control task regardless of variance, so switch entirely to a model-based approach that learns from far fewer real interactions`,
          `B) REINFORCE gradients are likely dominated by variance from the full-episode return G_t; fixes: add a value baseline V_φ(s) for advantage A_t = G_t - V_φ(s_t), switch to actor-critic (A2C/PPO), check policy entropy, and normalise rewards`,
          `C) The policy network's architecture is too small to represent the continuous-control policy at all; increase network capacity with substantially more layers and much wider hidden dimensions until it can represent the optimal action for every state exactly`,
          `D) The issue is that REINFORCE's use of the full episode return creates a fundamentally non-stationary learning signal over time; the fix is to fix the discount factor at exactly γ=1.0 so every timestep receives equal weight and the gradient becomes stationary`,
        ],
        answer: `B`
      },
      {
        q: `In a two-player zero-sum game like poker, why is a stochastic optimal policy strictly necessary, and what does this mean for the choice of algorithm?`,
        options: [
          `A) Stochastic policies are not strictly necessary in poker at all; a purely deterministic policy can be fully optimal so long as the opponent never directly observes the agent's action-probability distribution across repeated hands`,
          `B) A stochastic optimal policy is needed only because the poker game tree contains far too many states for any deterministic policy to memorise every optimal action; the resulting mixed strategy simply compresses this memorisation problem`,
          `C) Any deterministic policy in a zero-sum game is exploitable — the opponent learns the best response and wins; the Nash equilibrium needs a mixed strategy, which argmax Q*(s,a) cannot represent but policy gradients can via self-play or CFR`,
          `D) Stochastic policies are needed in poker specifically because partial observability of hidden cards makes any deterministic policy exploitable; in fully observable zero-sum games, by contrast, a deterministic optimal policy is always guaranteed to exist`,
        ],
        answer: `D`
      },
    ],
    takeaway: `Policy gradients optimize the policy directly by increasing the log-probability of actions proportionally to how much better than average they were — and subtracting a state-value baseline from the returns is mandatory, not optional, because it reduces gradient variance by 10–100× at zero bias cost.`,
    recap: [
      "**PG parameterizes the policy directly** $\\pi_\\theta(a|s)$ — sidesteps the infeasible argmax over continuous actions.",
      "**Policy Gradient Theorem:** $\\nabla_\\theta J = E_\\pi[\\nabla_\\theta \\log \\pi_\\theta(a|s) \\cdot Q^\\pi(s,a)]$; log-derivative trick makes it sampleable, model-free.",
      "**REINFORCE** uses full-episode $G_t$ — enormous variance because good action + bad luck looks like a bad action.",
      "**Baseline subtraction is mandatory:** $A = G_t - V^\\pi(s_t)$ cuts variance 10–100× at zero bias.",
      "**Any state-only baseline is unbiased** — policy log-gradient sums to zero over actions.",
      "**$\\sigma_\\theta \\to 0$ early = policy collapsed to deterministic;** add an entropy bonus to keep exploring.",
      "**Noisy returns? Add samples, not learning rate** — signal-to-noise scales as $\\sqrt{N}$.",
    ],
  },
  {
    id: 'actor_critic',
    title: 'Actor-Critic Methods',
    subtitle: 'A2C, A3C, advantage function, GAE, async vs sync, bias-variance in advantage estimation',
    difficulty: 'intermediate',
    estimatedMin: 55,
    tags: ['actor-critic', 'a2c', 'a3c', 'advantage', 'gae', 'bias-variance'],
    summary: `Return to the robotic arm. With REINFORCE, you collect a full episode before updating — the arm attempts the reach, you compute G_t at every step, and you update the policy. Two problems. First, you need complete episodes. Second, G_t at step t includes rewards from steps t+1 through the end of the episode — all caused by different actions, not the one at step t. The credit assignment is noisy. Variance is high.

[FIGURE: twoheads]

Actor-critic solves both. Maintain two networks simultaneously. The actor π_θ(a|s) selects actions — the policy. The critic V_φ(s) estimates the state value — how much total reward to expect from here under the current policy. After each step, update the critic using TD: the critic learns V(s_t) ≈ R + γV(s_{t+1}). Then compute the advantage A(s_t, a_t) = R + γV(s_{t+1}) - V(s_t) — how much better than expected was this particular step? Update the actor proportionally. You get updates every step, not every episode.

The advantage has a key property: E_{a~π}[A(s, a)] = 0. It is zero-mean across actions. This means it carries only relative information — this action was above average, that one was below. Unlike raw Q(s, a), which can be large and positive for all actions in a highly valuable state, the advantage removes the state's baseline value and isolates the signal about action quality. This is what makes actor-critic gradient estimates so much lower variance than REINFORCE.

Generalized Advantage Estimation (GAE) extends this. Instead of the one-step advantage R + γV(s') - V(s), GAE accumulates a weighted average of n-step advantages: Â^GAE = δ_t + γλδ_{t+1} + (γλ)²δ_{t+2} + ... where δ_t = R_{t+1} + γV(s_{t+1}) - V(s_t). λ = 0 gives the one-step TD error — low variance, high bias. λ = 1 gives the full Monte Carlo advantage — no bias, high variance. λ = 0.95 is the standard for most tasks. PPO, TRPO, and most modern on-policy actor-critics use GAE.

NOT this: the actor and critic have separate learning problems that can interfere with each other. The two networks are cooperative, not adversarial — the critic provides variance-reducing signal to the actor, and the actor's improving policy makes the critic's targets more stable. The instability risk is that a slow or inaccurate critic injects biased gradient into the actor. Mitigate by setting critic learning rate 3–10× higher than actor learning rate, so the critic leads.`,
    keyPoints: [
      `**Use actor-critic over pure policy gradients for any task with episodes longer than about 50 steps.**\n\nPer-step TD updates in actor-critic dramatically reduce gradient variance compared to full-trajectory REINFORCE. The actor-critic wall-clock speedup is typically 10–100× on continuous control tasks because you do not wait for episode completion.`,
      `**Set critic learning rate 3–10× higher than actor learning rate.**\n\nThe critic must converge to a stable estimate before the actor can use it meaningfully. If critic and actor learn at the same speed, the actor is chasing a moving value target — equivalent to applying noisy baselines that can increase gradient variance rather than reduce it.`,
      `**If actor loss improves but critic loss plateaus at a high value, the reward magnitude is too large for the critic to track.**\n\nNormalize rewards to approximately [-1, 1] or clip them, then recheck critic convergence. A critic that cannot model the value function correctly injects biased advantage estimates into the actor gradient, which explains why actor performance degrades even as actor loss decreases.`,
    ],
    interactivePrompt: `Before you touch the controls: the actor selects torques, the critic estimates V(s). After a step that gets reward +5 when V(s_t) = 3 and V(s_{t+1}) = 4 with γ = 0.9, what is the advantage — and does the actor increase or decrease the probability of this action?`,
    checkQuestions: [
      {
        q: `Which two statements about the advantage function A^π(s,a) = Q^π(s,a) - V^π(s) are correct, and explain why it beats raw Q(s,a) as a policy-gradient weight?`,
        options: [
          `A) E_{a~π}[A^π(s,a)] = E_{a~π}[Q^π(s,a)] - V^π(s) = 0, since V^π(s) = E_{a~π}[Q^π(s,a)] by definition — the advantage is exactly zero-mean over actions`,
          `B) The zero-mean property removes the large state-dependent constant that raw Q(s,a) carries, leaving only a lower-variance directional signal about whether each action was above or below average`,
          `C) E_{a~π}[A^π(s,a)] = 0 only holds once the policy has reached a Nash equilibrium; during ordinary training the advantage has non-zero mean, which is exactly why it still provides useful gradient signal`,
          `D) The advantage has zero mean specifically because it subtracts the average environment reward per episode; Q(s,a) is the better gradient weight in sparse-reward states because it retains the return's raw magnitude`,
        ],
        answer: ['A', 'B']
      },
      {
        q: `In GAE, what does setting λ=0 vs λ=0.95 vs λ=1 do to the advantage estimate? When would you choose each?`,
        options: [
          `A) λ=0 uses only the immediate reward with no bootstrapping at all, giving unbiased but extremely high-variance estimates; λ=1 instead uses the full critic value with pure bootstrapping, giving low-variance but high-bias estimates; λ=0.95 sits at a middle ground; choose λ=0 when episodes are very short and λ=1 only once the critic is well-trained`,
          `B) λ in GAE actually controls the learning-rate schedule for the critic network rather than the advantage estimate itself; λ=0 means the critic updates once per full episode and λ=1 means it updates every step; λ=0.95 is the standard value balancing update frequency against stability`,
          `C) λ=0 produces advantage estimates numerically identical to Monte Carlo returns; λ=1 instead uses only the one-step TD error; λ=0.95 behaves as an exponential moving average applied directly to the raw reward signal; practitioners generally choose λ=0 for sparse-reward environments`,
          `D) λ=0 is the one-step TD error δ_t (high bias, low variance); λ=0.95 blends ~20 future steps (the empirical default, e.g. PPO); λ=1 is the full MC advantage (zero bias, high variance) — pick λ=0 when the critic is accurate, λ=1 for short episodes`,
        ],
        answer: `D`
      },
      {
        q: `You are training an actor-critic agent and notice that the actor loss keeps decreasing but the critic loss oscillates and never converges. The agent's reward also oscillates. What is happening?`,
        options: [
          `A) Decreasing actor loss alongside an oscillating critic loss is entirely normal during the early phase of training; the actor is designed to converge faster than the critic by construction, so simply continue training unmodified until the critic naturally stabilises after roughly ten times as many gradient steps`,
          `B) The actor and critic destabilise each other: the actor updates faster than the critic can track, so noisy advantage estimates inject bad gradient into the actor, shifting the policy further in a feedback loop; fix by lowering the actor LR or adding PPO-style clipping`,
          `C) The oscillating critic is caused specifically by the replay buffer containing far too many transitions collected under an old, stale policy; empty the entire buffer and restart training using only fresh on-policy data generated by the current policy`,
          `D) The oscillating critic loss indicates that the reward model itself is non-stationary; this is purely an environment-side data distribution shift problem rather than an algorithmic one, and the only available fix is collecting a larger and more diverse set of training trajectories`,
        ],
        answer: `B`
      },
    ],
    takeaway: `Actor-critic gives you per-step policy updates by replacing the noisy full-episode return with a TD advantage estimate — the actor learns from how much better each action was than the critic expected, not from the absolute return.`,
    recap: [
      "**Two networks:** actor $\\pi_\\theta(a|s)$ picks actions, critic $V_\\phi(s)$ estimates state value.",
      "**Per-step TD updates** replace REINFORCE's noisy full-episode return.",
      "**Advantage** $A(s_t,a_t) = R + \\gamma V(s_{t+1}) - V(s_t)$ — how much better than expected this step was.",
      "**$E_{a\\sim\\pi}[A]=0$:** zero-mean signal removes the state baseline, isolating action quality — lower variance than raw $Q$.",
      "**GAE** blends n-step advantages: λ=0 one-step (low var/high bias), λ=1 MC, **0.95 is the default.**",
      "**Set critic LR 3–10× the actor LR** so the critic leads and the actor isn't chasing a moving target.",
      "**Actor down, critic plateaus high = reward magnitude too large;** normalize rewards to ~$[-1,1]$.",
    ],
    figures: {
      twoheads: `<svg viewBox="0 0 360 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="130" y="14" width="100" height="24" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="180" y="30" text-anchor="middle" fill="var(--ink-mid)" font-size="8">shared state s</text>
  <line x1="150" y1="38" x2="90" y2="58" stroke="var(--ink-low)" stroke-width="1.2"/>
  <line x1="210" y1="38" x2="270" y2="58" stroke="var(--ink-low)" stroke-width="1.2"/>
  <rect x="30" y="58" width="120" height="30" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="90" y="72" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Actor  &#960;&#952;(a|s)</text>
  <text x="90" y="83" text-anchor="middle" fill="var(--ink-mid)" font-size="7">picks the action</text>
  <rect x="210" y="58" width="120" height="30" rx="6" fill="none" stroke="var(--amber)"/>
  <text x="270" y="72" text-anchor="middle" fill="var(--amber)" font-size="8.5" font-weight="700">Critic  V&#966;(s)</text>
  <text x="270" y="83" text-anchor="middle" fill="var(--ink-mid)" font-size="7">scores the state</text>
  <text x="30" y="112" fill="var(--ink-low)" font-size="8">advantage A = R + &#947;V(s') &#8722; V(s)  &#8212; critic supplies the baseline</text>
  <text x="30" y="130" fill="var(--ink-low)" font-size="8">A &gt; 0 &#8594; push &#960; toward a ;  A &lt; 0 &#8594; push away.  E[A]=0.</text>
</svg>`,
    },
  },
  {
    id: 'ppo_trpo',
    interactiveId: 'ppo_clip_viz',
    title: 'PPO and TRPO',
    subtitle: 'Trust region, KL constraint, clipped surrogate, entropy bonus, implementation details',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['ppo', 'trpo', 'trust region', 'kl divergence', 'clipped objective', 'entropy'],
    summary: `You are training a quadruped robot to walk. With vanilla policy gradient, you take a gradient step and the policy changes. If the step is too large, the robot attempts movements far outside the distribution of the collected data — the advantage estimates, computed under the old policy, are completely wrong for the new one. The robot was walking; after one bad update it is lying on the ground producing no useful gradient signal. Recovery is impossible because the next gradient step is also based on wrong estimates. This catastrophic policy collapse is the problem PPO and TRPO solve.

TRPO formalizes the constraint: maximize the expected advantage subject to KL(π_old || π_new) ≤ δ. The KL constraint defines a trust region — updates inside it are theoretically safe, with a guaranteed lower bound on policy improvement. The cost is second-order optimization: computing the natural gradient requires Fisher information matrix-vector products, conjugate gradient, and a line search. Correct, but expensive and complex.

PPO approximates TRPO with a clipped objective: L_CLIP = E[min(r_t A_t, clip(r_t, 1-ε, 1+ε) A_t)] where r_t = π_new/π_old. When A_t > 0 and r_t > 1+ε — the policy is already much more likely to take this good action — the gradient is killed. When A_t < 0 and r_t < 1-ε — the policy has already moved away from this bad action — the gradient is killed again. The clip enforces a soft trust region using only first-order optimization and vanilla Adam.

[FIGURE: clip]

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
        q: `Which two of the following statements correctly describe when the PPO clip objective kills the gradient?`,
        options: [
          `A) When A_t > 0 (good action) and r_t has already risen past 1+ε, min(r_t·A_t, (1+ε)·A_t) = (1+ε)·A_t, a constant w.r.t. θ at the clip boundary — the gradient is killed so the policy stops reinforcing an already-overshot good action`,
          `B) When A_t < 0 (bad action) and r_t has already fallen past 1-ε, the clipped term likewise becomes constant w.r.t. θ, killing the gradient so the policy stops further penalising an action it has already moved away from`,
          `C) When A_t > 0 and r_t is still below 1-ε — meaning the policy hasn't yet reinforced the good action at all — the clip objective also flattens and kills the gradient at that point`,
          `D) The clip only ever activates once the KL divergence between old and new policy is already exactly zero, since PPO is defined to update solely after a trust-region violation has occurred`,
        ],
        answer: ['A', 'B']
      },
      {
        q: `You are training PPO on a continuous control task and observe that training is stable for 100 updates, then the policy collapses — mean episode reward drops from +500 to near 0 and never recovers. What happened and how do you diagnose and fix it?`,
        options: [
          `A) Policy collapse after a long stretch of stable training is caused by the value function diverging, a well-known PPO failure mode that occurs specifically when the critic's learning rate is set too high relative to the actor's; simply reduce the critic learning rate by a full order of magnitude and the policy will recover on its own`,
          `B) The collapse indicates the environment underwent a sudden non-stationary distribution shift right around update 100; the agent's policy had become optimal for the earlier distribution but the environment changed, so monitor environment statistics continuously and retrain when distribution shift is detected`,
          `C) Policy collapse is typically caused by too many mini-batch epochs K (policy drifts far from π_old, invalidating advantages) or too-high a learning rate; diagnose via r_t distribution and clip fraction (should be 10-30%, not 90%+); fix by reducing K, early-stopping on KL, or lowering the learning rate`,
          `D) The collapse is caused by policy entropy collapsing all the way to zero; once the policy becomes fully deterministic it can never recover because the policy gradient is mathematically zero for a deterministic policy, so the fix is an unusually large entropy bonus β=1.0 to force the policy back into a stochastic regime`,
        ],
        answer: `C`
      },
      {
        q: `In RLHF with PPO for an LLM, why is the KL penalty to the SFT model necessary? What happens if you remove it?`,
        options: [
          `A) The KL penalty is only ever necessary during the very earliest stages of RLHF training to stabilise the raw reward model scores as they are first produced; once training has run for approximately 1000 steps, it can be safely removed entirely without any measurable degradation in output quality`,
          `B) Without the KL penalty the LLM exploits the reward model via Goodhart's Law — generating repetitive or incoherent text that scores high but is low quality, because the policy drifts where the reward model (trained on SFT-like outputs) is uncalibrated; β trades hacking risk against improvement`,
          `C) The KL penalty exists purely to prevent the LLM from generating toxic content by forcibly keeping every response close to the safe SFT baseline distribution; removing it would specifically cause harmful outputs even in cases where the reward model explicitly and heavily penalises them`,
          `D) The KL penalty functions as nothing more than a computational-efficiency trick that reduces the numerical size of each policy gradient update; removing it would cause instability purely because of the resulting large gradient magnitudes coming directly from the reward model's raw output scale`,
        ],
        answer: `B`
      },
    ],
    takeaway: `PPO prevents catastrophic policy collapse by killing gradients when the policy ratio r_t moves outside [1-ε, 1+ε] — ensuring each update stays within a soft trust region where the advantage estimates are still valid.`,
    recap: [
      "**Problem:** too-large a PG step -> policy leaves the data distribution, advantages go wrong, catastrophic collapse.",
      "**TRPO:** maximize advantage s.t. $KL(\\pi_{old}\\|\\pi_{new}) \\le \\delta$ — a trust region, but 2nd-order and expensive.",
      "**PPO clip:** $L = E[\\min(r_t A_t, \\text{clip}(r_t, 1-\\epsilon, 1+\\epsilon)A_t)]$, $r_t = \\pi_{new}/\\pi_{old}$ — 1st-order, soft trust region.",
      "**Clip kills the gradient** once the policy already moved far on a good action ($r_t > 1+\\epsilon$) or away from a bad one.",
      "**$\\epsilon = 0.2$** allows 20% ratio change; target 10–30% clipped updates (< 1% = no benefit, > 90% = trust region broken).",
      "**Too many minibatch epochs $K$ defeats the trust region** — limit to 3–10; PPO is the default over TRPO.",
      "**In RLHF, the KL penalty to SFT is non-optional** — remove it and the LLM reward-hacks.",
    ],
    figures: {
      clip: `<svg viewBox="0 0 360 170" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="8" font-weight="700">Clipped objective vs ratio r&#8348; = &#960;&#8345;&#8331;&#8355;/&#960;&#8331;&#8343;&#8340;  (case A&#8348; &gt; 0)</text>
  <line x1="40" y1="130" x2="340" y2="130" stroke="var(--rim)" stroke-width="1"/>
  <line x1="40" y1="30" x2="40" y2="140" stroke="var(--rim)" stroke-width="1"/>
  <rect x="150" y="30" width="80" height="105" fill="var(--prime-faint)" opacity="0.35"/>
  <line x1="150" y1="30" x2="150" y2="140" stroke="var(--ink-low)" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="230" y1="30" x2="230" y2="140" stroke="var(--ink-low)" stroke-width="0.8" stroke-dasharray="3 3"/>
  <path d="M40,120 L230,44 L340,44" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <text x="150" y="152" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">1&#8722;&#949;</text>
  <text x="190" y="152" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">1</text>
  <text x="230" y="152" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">1+&#949;</text>
  <text x="285" y="40" fill="var(--prime)" font-size="7.5">flat: gradient = 0</text>
  <text x="190" y="24" text-anchor="middle" fill="var(--prime)" font-size="7.5">trust region (no clip)</text>
  <text x="4" y="168" fill="var(--ink-low)" font-size="7.5">once r&#8348; &gt; 1+&#949; on a good action, the objective flattens &#8594; step is capped, no collapse</text>
</svg>`,
    },
  },
  {
    id: 'rlhf_reward_modeling',
    title: 'RLHF and Reward Modeling',
    subtitle: `Bradley-Terry model, reward hacking, Goodhart's law, DPO, KL penalty, evaluation`,
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['rlhf', 'reward model', 'bradley-terry', 'reward hacking', 'dpo', 'goodhart'],
    summary: `GPT-4 trained on internet text predicts next tokens accurately. But next-token prediction accuracy has nothing to do with helpfulness. The model often produces responses that are technically fluent but unhelpful, harmful, or dishonest — because those properties were not measured by the training objective. You want to fine-tune the model to be helpful, but you cannot write a mathematical function that measures helpfulness. You can, however, ask humans to compare two responses and say which is better.

[FIGURE: pipeline]

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
        q: `Which two facts about the DPO derivation correctly explain how it eliminates the need for a separately trained reward model?`,
        options: [
          `A) The optimal policy under the RLHF objective satisfies r*(x,y) = β log(π*(y|x)/π_ref(y|x)) + β log Z(x) — the reward is re-expressed purely in terms of the policy and a reference model`,
          `B) Substituting that expression into the Bradley-Terry preference loss makes the partition function Z(x) cancel identically in the winner-minus-loser difference, leaving a loss directly on π_θ/π_ref`,
          `C) DPO trains the policy and reward model jointly in a single optimisation loop, which allows the reward parameters to be analytically marginalised out of the final loss afterward`,
          `D) DPO fixes the Bradley-Terry temperature at a constant β=1, collapsing the reward model directly into the language model's own softmax output layer`,
        ],
        answer: ['A', 'B']
      },
      {
        q: `A model trained with RLHF consistently gives verbose answers (3x longer than the SFT baseline) with high reward model scores but lower human preference in blind evaluation. What is happening and how do you fix it?`,
        options: [
          `A) The reward model learned a spurious length-quality correlation from the preference data (annotators preferred longer answers), so PPO exploited verbosity as a shortcut; fix with a length penalty in the reward, length-stratified data collection, or DPO pairs where short answers beat verbose ones`,
          `B) The verbosity is caused entirely by using too high a KL penalty coefficient β, which forces the model unusually close to the SFT distribution; since SFT itself was trained on long human demonstrations, the policy simply mimics that verbosity, so lowering β would fix it by allowing more divergence`,
          `C) The verbosity is a completely natural and expected consequence of RLHF training and indicates the model is working exactly as intended; longer answers inherently contain more information and are genuinely better, and the blind-study evaluators are likely simply biased against verbose responses`,
          `D) The issue is that the SFT baseline itself was trained on already-verbose demonstration data; RLHF is mathematically incapable of reducing verbosity below whatever the SFT baseline established, because the KL penalty structurally prevents the policy from ever diverging enough to learn genuine conciseness`,
        ],
        answer: `A`
      },
      {
        q: `Why is "LLM-as-judge" evaluation problematic for assessing RLHF model quality, even when the judge is a much stronger model than the one being evaluated?`,
        options: [
          `A) LLM-as-judge evaluation is only actually problematic when the judge model and the evaluated model happen to share the exact same base architecture; a judge from a different family, such as GPT-4 judging a Claude model, entirely eliminates self-preference bias and produces fully reliable evaluations`,
          `B) LLM-as-judge is problematic primarily because stronger judge models have meaningfully higher inference latency and API cost, which makes large-scale automated evaluation impractical; the saved compute budget should instead be redirected entirely toward human evaluation`,
          `C) LLM judges are fundamentally unreliable because they are architecturally unable to read and comprehend long responses accurately; in practice they evaluate only the first paragraph of each response, creating a strong positional bias favouring answers that front-load their conclusions`,
          `D) LLM-as-judge has compounding biases: self-preference, verbosity bias, positional bias in A/B comparisons, and distribution shift (poor RLHF calibration); reliable alternatives include human evaluation with inter-annotator agreement and rule-based capability metrics`,
        ],
        answer: `D`
      },
    ],
    takeaway: `RLHF trains human preference into a reward model from comparative judgments, then uses PPO to maximize that reward — with a KL penalty to keep the policy close enough to the SFT distribution that the reward model's scores remain meaningful and reward hacking is bounded.`,
    recap: [
      "**Next-token accuracy != helpfulness** — you can't write a helpfulness function, but humans can compare two responses.",
      "**3-stage pipeline:** SFT -> reward model -> PPO fine-tuning.",
      "**Reward model uses Bradley-Terry:** $P(A \\succ B) = \\sigma(R(A) - R(B))$ — learns from comparisons, not absolute scores.",
      "**KL penalty $KL(\\pi\\|\\pi_{SFT})$ keeps the policy where the reward model is calibrated** — not optional hygiene.",
      "**Reward hacking is the central failure:** length inflation, sycophancy, adversarial prompts — the optimizer doing exactly what the reward says.",
      "**DPO eliminates the reward model:** the partition function $Z(x)$ cancels in the winner-minus-loser difference.",
      "**High RM score but humans don't prefer it = over-optimization (Goodhart);** reduce PPO steps or raise KL.",
    ],
    figures: {
      pipeline: `<svg viewBox="0 0 360 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  ${[['1. SFT', 'human demos', 'base &#8594; SFT model'], ['2. Reward model', 'A vs B prefs', 'Bradley-Terry R&#966;'], ['3. PPO', 'maximize R&#966;', '+ KL to SFT']].map((s, i) => `
  <rect x="${8 + i * 118}" y="30" width="104" height="52" rx="7" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="${60 + i * 118}" y="48" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">${s[0]}</text>
  <text x="${60 + i * 118}" y="62" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">${s[1]}</text>
  <text x="${60 + i * 118}" y="74" text-anchor="middle" fill="var(--ink-low)" font-size="7">${s[2]}</text>
  ${i < 2 ? `<path d="M${112 + i * 118},56 l6,0" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#pp)"/>` : ''}`).join('')}
  <text x="8" y="20" fill="var(--ink-low)" font-size="7.5">the reward model turns "which is better?" into a scalar the optimizer can chase</text>
  <text x="8" y="104" fill="var(--amber)" font-size="7.5">KL(&#960; &#8214; &#960;&#8347;&#8355;&#8348;) is the leash &#8212; drift too far and R&#966; is extrapolating &#8594; reward hacking</text>
  <defs><marker id="pp" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
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
          `A) ε-greedy fails because Montezuma's Revenge has a very large discrete action space of 18 possible actions, which makes purely random exploration far too slow to be practical; using a substantially smaller ε value would solve this by concentrating exploration onto fewer candidate actions`,
          `B) The failure is caused entirely by the game's high-resolution graphics, which make the raw pixel state space too large for Q-learning to generalise across effectively; the correct fix is a CNN with better convolutional feature extraction rather than any change to the exploration strategy itself`,
          `C) The first reward requires a specific sequence of ~100+ actions; probability of discovering this by random exploration is (ε/|A|)^100 ≈ 10^{-218}, effectively impossible; fixes include ICM/RND novelty rewards, hierarchical RL subgoals, and human demonstration seeding`,
          `D) ε-greedy is insufficient because Montezuma's Revenge has a fundamentally non-Markovian reward structure where the identical action produces different rewards depending on the full episode history; the fix is a recurrent policy that conditions on the entire trajectory rather than the current frame`,
        ],
        answer: `C`
      },
      {
        q: `Which two statements correctly explain the noisy-TV problem in curiosity-driven exploration and how ICM/RND address it?`,
        options: [
          `A) A pure prediction-error curiosity module rewards the agent for standing in front of random static (maximum prediction error forever, no real exploration); ICM fixes this via inverse-dynamics training so the feature encoder ignores uncontrollable features the agent's actions can't cause`,
          `B) RND avoids the problem because its fixed random target network gives each TV frame a deterministic representation, so intrinsic reward for a static-but-unlearnable state decays to near zero after a few visits`,
          `C) The noisy-TV problem occurs when the environment has a high frame rate that overwhelms the replay buffer; ICM solves this by subsampling frames, and RND avoids it via a projection invariant to frame rate`,
          `D) The noisy-TV problem only applies to environments containing literal television screens; in Atari games without visible static, ICM and RND behave identically and the distinction is irrelevant`,
        ],
        answer: ['A', 'B']
      },
      {
        q: `You are applying RL to a drug discovery task — the agent proposes molecular structures and receives a reward based on the drug's predicted binding affinity. The action space is discrete (atom type × position) but the molecule space has ~10^{60} valid molecules. How do you handle exploration?`,
        options: [
          `A) Use Bayesian optimisation with a surrogate model for Thompson sampling over molecular embeddings, or generative RL (REINVENT/GCPN) with diversity bonuses; the binding-affinity predictor is itself a proxy reward, so guard against Goodhart violations with diversity regularisation and periodic wet-lab validation`,
          `B) Standard ε-greedy with ε=0.5 is entirely sufficient here because the dense local structure of chemical space means that random perturbations applied to an already-good molecule will frequently produce yet another good molecule; the raw figure of 10^{60} is misleading since most molecules turn out to be structurally near-identical`,
          `C) Use count-based exploration with a SimHash-based locality-sensitive hash to approximate visit counts directly in the molecular fingerprint space; this provides UCB-style exploration bonuses for novel molecules without ever requiring exact discrete state counts to be maintained`,
          `D) The only mathematically valid approach for a 10^{60}-molecule space is classical evolutionary search using genetic algorithms rather than any form of RL; RL is fundamentally incapable of scaling to state spaces larger than roughly 10^{20} states regardless of which exploration strategy is chosen`,
        ],
        answer: `A`
      },
    ],
    takeaway: `Exploration should be directed at uncertainty, not randomness — UCB and Thompson Sampling concentrate effort where information gain is highest, while ε-greedy wastes exploration uniformly across actions including the obviously inferior ones.`,
    recap: [
      "**The dilemma:** exploitation costs nothing short-term but goes stale; exploration costs performance but enables improvement.",
      "**ε-greedy is broken at scale:** with 10M items it explores obviously-terrible options uniformly.",
      "**UCB directs exploration at uncertainty:** $\\mu_a + c\\sqrt{\\log t / N_a}$ — optimism in the face of uncertainty.",
      "**Thompson Sampling (Bayesian):** sample from each action's posterior, take the best; exploration decays as posteriors tighten, no rate to tune.",
      "**Regret:** ε-greedy $O(\\epsilon T)$ vs UCB/TS $O(\\log T)$.",
      "**Never use fixed ε in production;** decay it or switch to UCB/TS. Keep a 1–5% exploration floor for non-stationary settings.",
      "**Hard-exploration (Montezuma):** random discovery is ~$10^{-218}$ — need ICM/RND novelty rewards; beware the noisy-TV problem.",
    ],
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
      `**Off-policy evaluation (OPE) estimates a new policy π_e's performance from data already logged under the old policy π_b, without deploying it live.** The importance-sampling (IS) estimator reweights each logged outcome by how much more or less likely π_e was to take that action: V̂^IS = (1/N) Σ_n w_n·r_n where w_n = π_e(a_n|s_n)/π_b(a_n|s_n). For a single-step bandit this is manageable, but for a T-step sequential MDP the trajectory-level weight is a product Π_t w_t — variance grows exponentially in T, and delayed rewards make this worse by stretching T further before a reward lands. The doubly robust (DR) estimator fixes this by combining a fitted reward model R̂(s,a) with an IS correction on the residual; it stays consistent if EITHER the reward model OR the importance weights are accurate — hence "doubly robust" — which is why it dominates plain IS in practice.`,
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
        answer: `A`
      },
      {
        q: `Your RL agent for robot manipulation works perfectly in simulation (95% success rate) but achieves only 20% in the real lab. Which two of the following are independent sources of the sim-to-real gap, each needing a distinct fix?`,
        options: [
          `A) Physics mismatch — friction, mass, and contact dynamics don't match reality; fix via system identification and domain randomisation of physical parameters during training`,
          `B) Observation discrepancy — rendered images differ from real camera output in lighting and texture; fix via domain randomisation of visual appearance or a sim-to-real image transfer model`,
          `C) The choice of optimizer (Adam vs SGD) used during simulated training, which is what actually determines whether the learned policy generalizes to real actuators`,
          `D) The reward function's numerical scale, which must always be normalized to [-1,1] regardless of the task or it will fail to transfer to any real robot`,
        ],
        answer: ['A', 'B']
      },
      {
        q: `A team proposes using RL for a clinical trial treatment assignment (which treatment to give each patient each day). What are the specific risks, and what alternative framework would you recommend?`,
        options: [
          `A) RL is appropriate for clinical trials as long as the reward function is carefully designed to include both short-term and long-term health outcomes; the main risk is reward hacking, which can be mitigated with a KL penalty to the standard of care`,
          `B) RL works for clinical trials but requires offline RL (not online RL) to avoid safety risks; use CQL with conservative Q-value estimation to ensure the policy stays within the safe action distribution observed in historical patient data`,
          `C) RL is inappropriate here due to: delayed outcomes (months-long credit assignment), non-stationary patient populations, catastrophic (not expected-value) safety requirements, low sample counts (hundreds not millions), regulatory interpretability requirements, and distribution shift from the changing policy; recommend contextual bandits with Thompson sampling + posterior-based safety arm exclusion, or a Bayesian adaptive clinical trial design (REMAP-style response-adaptive randomisation) which is FDA-recognised and provides both statistical validity and adaptivity`,
          `D) The main risk is that RL requires too many patient interactions to learn a good policy; the fix is to use transfer learning from existing clinical trial data to pre-train the policy before deploying it in a new trial, which reduces the number of patients needed to fewer than 100`,
        ],
        answer: `C`
      },
    ],
    takeaway: `The most important production RL skill is red-teaming your reward function before training — listing every way an agent could maximize the proxy without satisfying the actual objective, then adding penalties for each exploit before a single training step runs.`,
    recap: [
      "**Sim 95th percentile -> 40% drop in 2 days:** specification, distribution shift, and safety are the real difficulty.",
      "**Four failure modes:** reward hacking, distribution shift, catastrophic forgetting, exploding $Q$-values — each with a fix.",
      "**Red-team the reward before training:** 2 hours listing every exploit, add a penalty per exploit. #1 skill.",
      "**Always keep a hard fallback policy** that activates below a confidence threshold — non-optional.",
      "**Safe/constrained RL:** optimize reward subject to a safety constraint; conservative policies need human approval.",
      "**Offline RL (CQL, IQL, Decision Transformer)** trains on logged data — critical when real interaction is risky.",
      "**RL agents are brittle to distribution shift** in ways supervised models aren't; A/B test on limited traffic first.",
    ],
  },
]
