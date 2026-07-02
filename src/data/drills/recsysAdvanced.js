// recsysAdvanced.js — senior/staff-grade recommender-systems judgment drills,
// authored to the Pocket FM Senior Data Scientist (RecSys) job surface:
// learning-to-rank, ranking evaluation, exploration/exploitation (bandits),
// reinforcement learning, A/B testing, content understanding via NLP/LLMs,
// cold-start, and homepage/autoplay (session/sequential) recommendation for a
// large audio-streaming catalogue (audiobooks / audio-series / podcasts) with a
// retention & engagement focus.
//
// Heavy senior + staff weighting. IDs use prefix `recsysadv-` and do NOT collide
// with recsys.js (`recsys-` prefix). Real mechanisms with numbers; distractors
// are genuine misconceptions, not filler.

export const RECSYS_ADV_DRILLS = [
  // ══════════════════════════════════════════════════════════════════
  // learning-to-rank (4: mid 1, senior 2, staff 1)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'recsysadv-ltr-pointwise-order', subject: 'recsys', subtopic: 'learning-to-rank', level: 'mid', type: 'mcq',
    title: 'A well-calibrated click model still ranks the homepage badly',
    context: [
      'Homepage ranker is a pointwise gradient-boosted model predicting P(play | series shown), log-loss trained.',
      'Offline AUC is 0.81 and the probabilities are well calibrated (Brier score is low).',
      'But NDCG@10 on the ordered homepage is mediocre and editors say the top slots feel off.',
    ],
    question: 'Why can a calibrated pointwise model still order the list poorly?',
    options: [
      'AUC and NDCG measure the same thing, so this cannot happen — the offline eval is buggy',
      'Pointwise log-loss optimises each item\'s absolute probability in isolation; it spends equal effort separating well-ranked pairs deep in the list and never targets the ordering of the top slots that NDCG weights most',
      'The Brier score should be maximised, not minimised, for ranking',
      'Calibration always implies correct ordering, so the fix is more training data',
    ],
    answer: 1,
    diagnosis: 'Absolute-probability loss is not an ordering loss',
    explanation: 'The user experiences an ordered list; only relative order among a handful of candidates decides what gets seen. Pointwise log-loss treats every item independently and gives a deep, already-correct pair the same loss weight as a top-of-list swap that moves NDCG a lot. You can have great AUC (global separability) and still misorder the specific top-K a user sees.',
    fix: 'Switch to a pairwise or listwise objective (RankNet/LambdaMART/ListNet) that optimises order, and evaluate with NDCG@K / MRR — not AUC or Brier. Keep the pointwise model only where you genuinely need a calibrated probability (e.g. feeding a value model).',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-ltr-lambda-deltandcg', subject: 'recsys', subtopic: 'learning-to-rank', level: 'senior', type: 'mcq',
    title: 'Why LambdaMART weights each pair by |ΔNDCG|',
    context: [
      'Autoplay-queue ranker is LambdaMART.',
      'The gradient on a misordered pair (i above j when j is more relevant) is a RankNet-style pair gradient scaled by |ΔNDCG_ij|, the metric change from swapping i and j.',
      'A candidate asks why we do not just use the raw pairwise gradient without the |ΔNDCG| factor.',
    ],
    question: 'What does multiplying by |ΔNDCG| buy you?',
    options: [
      'It makes the loss differentiable — NDCG has no gradient, so |ΔNDCG| supplies one directly',
      'It focuses learning where the metric actually moves: swaps near the top of the list (steep positional discount) get large |ΔNDCG| and dominate the gradient, so the model prioritises getting the head order right instead of fixing deep, low-impact pairs',
      'It converts the boosted trees into a listwise softmax',
      'It normalises the labels so all relevance grades count equally',
    ],
    answer: 1,
    diagnosis: 'The lambda re-weights pairs by their downstream metric impact',
    explanation: 'NDCG is flat/non-differentiable, so we cannot optimise it directly. LambdaMART sidesteps this: it keeps the smooth RankNet pair gradient but scales each pair by the NDCG change swapping them would cause. Because NDCG\'s positional discount (1/log2(rank+1)) is steep, top-of-list swaps produce big |ΔNDCG| and thus big gradients — the model spends its capacity on the ranks users actually see. Deep pairs contribute little and are effectively ignored.',
    fix: 'Keep the |ΔNDCG| weighting; it is the whole point of "Lambda"MART. If your surface truncates hard at K, use NDCG@K (or a truncated gain) in the delta so the model does not waste effort ordering positions no user ever reaches.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-ltr-position-bias', subject: 'recsys', subtopic: 'learning-to-rank', level: 'senior', type: 'mcq',
    title: 'The ranker keeps re-promoting whatever was already on top',
    context: [
      'The homepage ranker trains on logged plays: label = played, features include content + user signals.',
      'Slot 1 gets a play rate of 22%, slot 10 gets 3%, largely because of position, not relevance.',
      'The model, trained naively on these logs, learns to up-rank items that happened to sit high — a self-reinforcing loop.',
    ],
    question: 'What is the correct treatment for position bias in learning-to-rank training?',
    options: [
      'Drop position entirely from both training and serving — it is a leaky feature',
      'Model examination explicitly: use inverse-propensity weighting on clicks (weight each play by 1/P(examine|position)) or add a position feature at train time that is zeroed/fixed at serving so the model separates "seen because high" from "relevant"',
      'Always train only on slot-1 impressions where examination is guaranteed',
      'Add position as a normal feature and serve with the real position — the model will learn to correct itself',
    ],
    answer: 1,
    diagnosis: 'Logged plays confound relevance with examination probability',
    explanation: 'A play at slot 1 is not 7x more relevant than at slot 10 — it is 7x more examined. Train naively and the ranker learns "high position -> play -> rank higher", freezing yesterday\'s order. Two standard fixes: (a) IPS — divide each play\'s weight by the estimated examination propensity for its position, so a slot-10 play counts far more; (b) a position/examination feature (position-as-feature or a two-tower examination model) held to a constant at serving so the relevance tower is decontaminated. Option 4 is the trap: serving with real position bakes the bias back in.',
    fix: 'Estimate examination propensities (result-randomisation or intervention harvesting), train with IPS-weighted labels or a decoupled examination model, and at serving fix the position input to a neutral constant so ordering reflects relevance, not incumbency.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-ltr-listwise-multiobjective', subject: 'recsys', subtopic: 'learning-to-rank', level: 'staff', type: 'multistep',
    title: 'Optimising NDCG on plays quietly kills long completions',
    context: [
      'Audio catalogue: audiobooks (8h), audio-series (multi-episode), short podcasts (20min).',
      'The listwise ranker optimises NDCG where relevance grade = "started a play".',
      'Retention data shows the accounts that stay are the ones that finish long series — but the ranker floods the homepage with short, easy-start podcasts that spike starts and depress completion.',
    ],
    steps: [
      {
        question: 'What is the root cause that a pure play-started NDCG objective creates here?',
        options: [
          'NDCG is the wrong metric family; MRR would fix it',
          'The relevance label (started a play) is a weak, short-horizon proxy for the business goal (retention via long-form completion); the ranker faithfully maximises the proxy and diverges from value',
          'The trees are overfitting — add regularisation',
          'The catalogue is too diverse to rank at all',
        ],
        answer: 1,
        finding: 'The failure is label/objective design, not the ranking algorithm.',
      },
      {
        question: 'How should the listwise label be reshaped without throwing away short content entirely?',
        options: [
          'Binary started/not-started, but only for long-form items',
          'Graded relevance that rewards completion and expected listening time (e.g. finished long series >> long partial >> short completed >> short skip), so the NDCG gain reflects durable value while short wins still score something',
          'Rank purely by predicted total minutes and ignore whether the user chose to start',
          'Use started-a-play but multiply every score by content length',
        ],
        answer: 1,
        finding: 'Encode the value hierarchy into graded relevance so NDCG optimises the thing you actually want.',
      },
      {
        question: 'Before shipping the reweighted ranker, what is the essential guardrail?',
        options: [
          'None — higher retention is strictly good, ship it',
          'A/B test with long-term retention (D28/D56) as the decision metric plus guardrails on total starts and short-content discovery, since completion-weighting can over-suppress light and new users who legitimately want short sessions',
          'Only check that offline NDCG went up',
          'Roll out to 100% and monitor dashboards',
        ],
        answer: 1,
        finding: 'Reweighting toward long-form has real downside for some segments — verify with a retention-decision A/B and guardrails.',
      },
    ],
    diagnosis: 'The ranking algorithm was fine; the relevance label encoded the wrong horizon',
    explanation: 'Listwise LTR optimises exactly the graded relevance you hand it. "Started a play" over-rewards low-commitment items and correlates weakly with the retention that actually pays. The fix is not a new loss — it is a value-aware relevance function that grades completion and expected listening time, letting NDCG rank toward durable engagement. But over-correcting starves legitimate short-session and new-user demand, so the change must be validated on a long-horizon retention decision metric with discovery/starts guardrails.',
    fix: 'Redefine relevance grades around completion + expected listen time; keep the listwise/LambdaMART machinery; A/B on D28+ retention with guardrails on starts, short-content discovery, and new-user experience before ramping.',
    source: 'Authored · RecSys/JD',
  },

  // ══════════════════════════════════════════════════════════════════
  // explore/exploit & bandits (5: junior 1, mid 1, senior 2, staff 1)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'recsysadv-bandit-why-explore', subject: 'recsys', subtopic: 'explore-exploit', level: 'junior', type: 'mcq',
    title: 'Why always showing the current best is a trap',
    context: [
      'A shelf ranks new audio-series by their observed play-through rate.',
      'A junior proposes: always show the series with the highest measured rate. "It maximises plays, why explore?"',
    ],
    question: 'What breaks with pure exploitation (always pick the current best)?',
    options: [
      'Nothing — greedy is optimal because it always picks the highest-value option',
      'Estimates come from limited data; a genuinely great new series that got a few unlucky early impressions is written off forever, while items that got a lucky start get entrenched — you never gather the data to correct either',
      'Exploitation is too slow to compute at serving time',
      'Greedy selection violates user privacy',
    ],
    answer: 1,
    diagnosis: 'Greedy freezes early noise into permanent decisions',
    explanation: 'Early play-rate estimates are high-variance. A pure-greedy policy stops showing anything that looked mediocre after a handful of impressions — so it never collects the data that would reveal it was actually good (or that a lucky item was actually bad). It optimises against its own noisy beliefs. Exploration is how you keep learning the true values instead of locking in the first estimate.',
    fix: 'Spend a small, principled fraction of traffic exploring uncertain items (epsilon-greedy as a floor, or better, an uncertainty-aware method like Thompson sampling / UCB) so estimates keep improving and good-but-unlucky content gets a fair shot.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-bandit-thompson-vs-eps', subject: 'recsys', subtopic: 'explore-exploit', level: 'mid', type: 'mcq',
    title: 'Epsilon-greedy wastes its exploration budget',
    context: [
      'A new-title shelf uses epsilon-greedy: 90% of the time show the current best, 10% pick a uniformly random title.',
      'Problem: the 10% is spread evenly across obviously-bad titles and genuinely-uncertain titles alike, so learning is slow and the random slot often shows junk.',
    ],
    question: 'Why is Thompson sampling (or UCB) usually a better allocator of exploration than epsilon-greedy?',
    options: [
      'Thompson sampling never explores, so it wastes nothing',
      'Epsilon-greedy explores uniformly regardless of uncertainty; Thompson sampling draws each arm\'s value from its posterior and picks the argmax, so exploration is automatically concentrated on high-uncertainty arms and starves arms already known to be bad',
      'UCB requires no reward feedback, unlike epsilon-greedy',
      'Epsilon-greedy has no exploration at all until epsilon is tuned',
    ],
    answer: 1,
    diagnosis: 'Uniform exploration ignores how much you still need to learn about each arm',
    explanation: 'Epsilon-greedy is uncertainty-blind: its random 10% is as likely to re-test a title everyone skips as one you genuinely cannot rank yet. Thompson sampling samples a plausible value for each arm from its posterior (Beta for play/skip) and shows the sampled-best — arms with wide posteriors sometimes sample high and get explored, arms confidently bad rarely do. UCB does the same via an optimism bonus that shrinks as an arm is pulled. Both spend the exploration budget where information is highest.',
    fix: 'Replace uniform epsilon with Thompson sampling (maintain a Beta posterior per title on play/skip) or UCB (mean + c·sqrt(log t / n)); exploration then self-targets uncertain arms and decays as evidence accrues.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-bandit-contextual-coldstart', subject: 'recsys', subtopic: 'explore-exploit', level: 'senior', type: 'mcq',
    title: 'A context-free bandit relearns every user from scratch',
    context: [
      'Cold-start shelf uses one global multi-armed bandit per title (one posterior per arm, pooled across all users).',
      'It converges on the catalogue-wide best titles but serves the same exploration to a hardcore-thriller listener and a kids-story listener.',
      'New users get generic top titles and churn before finding their niche.',
    ],
    question: 'What does a contextual bandit (e.g. LinUCB / linear Thompson) change, and why does it help cold-start?',
    options: [
      'It removes exploration, so cold users see only safe content',
      'It conditions the reward estimate on a feature vector (user + content context), so it learns a policy that maps context to arm value and can explore/exploit per-segment instead of pooling — a new user with thriller signals gets thriller exploration immediately',
      'It replaces the posterior with a fixed popularity ranking',
      'It only works once every user has hundreds of interactions',
    ],
    answer: 1,
    diagnosis: 'Context-free bandits share one belief across all users; that erases who the user is',
    explanation: 'A per-arm global posterior asks "which title is best on average?" — the answer is generic popular content, and every distinct user gets the same exploration. A contextual bandit models reward as a function of context features (LinUCB: theta·x plus an uncertainty bonus in the feature geometry; linear Thompson: sample theta from its posterior). It generalises across arms and users, so signals from similar users transfer, and a barely-known new user is placed via their features rather than treated as a blank global average — exactly the cold-start lever.',
    fix: 'Use a contextual bandit keyed on user + content embeddings (LinUCB or linear/neural Thompson). Exploration is then targeted per-context, similar users share evidence, and new users inherit a warm prior from their feature neighbourhood instead of the catalogue mean.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-bandit-feedback-loop', subject: 'recsys', subtopic: 'explore-exploit', level: 'senior', type: 'mcq',
    title: 'Six months of pure exploitation and the catalogue collapsed to 200 titles',
    context: [
      'A greedy popularity-driven recommender ran for two quarters with essentially no exploration.',
      'Impressions concentrated on an ever-shrinking head; the model trains on its own logs, which now barely contain the tail.',
      '95% of catalogue impressions go to ~200 titles; new and niche titles get near-zero exposure and thus near-zero training signal.',
    ],
    question: 'What is this failure mode and what actually reverses it?',
    options: [
      'Standard overfitting — add dropout and retrain',
      'A feedback loop / popularity collapse: exploitation-only serving means the training data is generated by the model\'s own past choices, so the head self-reinforces and the tail dies from lack of exposure; you break it by injecting exploration and correcting exposure bias (IPS), not by tuning the model',
      'Data drift from seasonality — wait for it to pass',
      'A retrieval recall bug — widen K',
    ],
    answer: 1,
    diagnosis: 'The model is training on data it created; exploitation without exploration is a closed loop',
    explanation: 'When serving is greedy, logged interactions only exist for items the model already liked. Retrain on those logs and the head gets stronger, the tail vanishes from the data, and next round it is up-ranked even less — a self-fulfilling collapse ("rich get richer"). No amount of model tuning fixes it because the bias is in the data-generating process. You need (a) exploration to keep sampling the tail, and (b) exposure/propensity correction (IPS or logged-propensity weighting) so training accounts for what the old policy under-showed.',
    fix: 'Guarantee an exploration floor (bandit or randomised slots) so the tail keeps getting impressions, log serving propensities and train with IPS/counterfactual weighting, and monitor catalogue coverage / Gini of impressions as a first-class health metric.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-bandit-explore-cost-guardrail', subject: 'recsys', subtopic: 'explore-exploit', level: 'staff', type: 'multistep',
    title: 'How much exploration, and who pays for it',
    context: [
      'Leadership wants more catalogue coverage but is nervous that exploration degrades the experience for paying subscribers.',
      'You must design an exploration policy for the homepage that improves long-run learning without visibly hurting near-term engagement of high-value users.',
    ],
    steps: [
      {
        question: 'What framing correctly describes the cost of exploration here?',
        options: [
          'Exploration is free because random shows still count as impressions',
          'Exploration has a short-term regret cost (some slots show sub-optimal content now) traded against long-term value (better estimates, healthier catalogue, less feedback-loop collapse) — it is an investment, and the right budget depends on how uncertain and how large the future payoff is',
          'Exploration only costs money if titles are licensed',
          'There is no trade-off; more exploration is always better',
        ],
        answer: 1,
        finding: 'Exploration is regret-now for information-later — a budget to be sized, not maximised.',
      },
      {
        question: 'How should exploration be allocated across the user base?',
        options: [
          'Explore equally on everyone including your most loyal payers',
          'Concentrate exploration where regret is cheap and information is valuable — new/low-tenure users and low-confidence titles — while protecting high-LTV, high-intent sessions with mostly-exploit policies; uncertainty-aware methods (Thompson/UCB) already bias exploration toward genuinely uncertain arms',
          'Only explore on churned users who no longer open the app',
          'Explore only in slot 1 where it is most visible',
        ],
        answer: 1,
        finding: 'Route exploration to cheap-regret, high-information contexts; shield high-value sessions.',
      },
      {
        question: 'What is the correct way to prove the exploration policy is net-positive?',
        options: [
          'Compare catalogue coverage before and after with no control',
          'Run a long-horizon holdout: a control cell with minimal exploration vs treatment, and compare long-term retention/engagement — exploration\'s payoff is deferred, so a short A/B on immediate engagement will read falsely negative',
          'Ship it and watch the daily plays dashboard',
          'Trust the offline replay simulator alone',
        ],
        answer: 1,
        finding: 'Exploration pays off over a long horizon, so it must be evaluated on a long-horizon holdout, not a short engagement A/B.',
      },
    ],
    diagnosis: 'Exploration is a budgeted investment with deferred, unevenly-distributed payoff',
    explanation: 'The staff move is to treat exploration as regret-now / information-later and to size and route the budget rather than debate on/off. Uncertainty-aware bandits already concentrate spend on uncertain arms; on top of that, target exploration at cheap-regret contexts (new users, uncertain titles) and shield high-LTV sessions. Crucially, the benefit — better estimates, catalogue health, escaping the feedback loop — shows up over weeks, so a short engagement A/B will look flat or negative and mislead you into killing a good policy. Evaluate on a long-horizon holdout.',
    fix: 'Use Thompson/UCB for self-targeting exploration, cap and route the budget by user value and title uncertainty, expose catalogue-coverage/Gini as guardrails, and prove net value with a multi-week retention holdout rather than a short-term engagement test.',
    source: 'Authored · RecSys/JD',
  },

  // ══════════════════════════════════════════════════════════════════
  // RL for recsys (4: senior 2, staff 2)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'recsysadv-rl-myopic-vs-longterm', subject: 'recsys', subtopic: 'rl-recsys', level: 'senior', type: 'mcq',
    title: 'The greedy recommender maximises this click and loses the session',
    context: [
      'The ranker optimises immediate P(play) per slot, greedily, one recommendation at a time.',
      'It surfaces a cliff-hanger single episode that reliably gets a play, but users finish it and leave; sessions are short.',
      'An RL framing is proposed: optimise cumulative reward over the session, not the next click.',
    ],
    question: 'What does the RL / long-term-reward framing add over greedy next-click optimisation?',
    options: [
      'It guarantees higher click-through on the very next item',
      'It optimises expected cumulative reward over the session/trajectory, so it can accept a slightly-less-clicky item now if it leads to a longer, higher-value session — the recommender learns to shape the sequence, not just win each step',
      'It removes the need for any reward signal',
      'It is just supervised learning with a different loss and no notion of state',
    ],
    answer: 1,
    diagnosis: 'Greedy per-step optimisation ignores how each choice changes future state and reward',
    explanation: 'Recommendation is sequential: today\'s pick changes the user\'s state (what they\'ve heard, their mood, their remaining time) and thus what\'s valuable next. A myopic policy maximises the immediate reward and can walk users into dead-ends (a satisfying one-off that ends the session). RL maximises discounted cumulative reward over the trajectory, so it will trade a small immediate loss for a larger downstream gain — e.g. seed a multi-episode series that keeps the session alive. The MDP framing (state, action, reward, transition) is exactly what supervised next-click training lacks.',
    fix: 'Model the session as an MDP with cumulative (discounted) reward; even a lightweight long-term value estimate or reward-shaping toward session length/return-visits captures most of the gain without a full deep-RL stack.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-rl-ope-ips', subject: 'recsys', subtopic: 'rl-recsys', level: 'senior', type: 'mcq',
    title: 'Estimating a new policy\'s value without shipping it',
    context: [
      'You have a new ranking policy and only logged data from the old policy (which chose actions with known probabilities).',
      'You want its expected reward before an expensive A/B test.',
      'A naive estimate just averages the logged reward of actions the new policy would also have taken — and it is badly biased.',
    ],
    question: 'What does inverse-propensity-scoring (IPS) off-policy evaluation do, and what is its main weakness?',
    options: [
      'IPS averages rewards on matching actions only; it is unbiased and low-variance',
      'IPS reweights each logged reward by (new-policy prob / logging prob) so the logged data is corrected to look like the new policy\'s distribution — it is (near-)unbiased but has high variance when the two policies disagree, because rare-under-logging actions get huge weights',
      'IPS trains a reward model and evaluates the new policy against it, ignoring the logs',
      'IPS only works if the new and old policies are identical',
    ],
    answer: 1,
    diagnosis: 'Off-policy evaluation must correct the distribution mismatch between logging and target policies',
    explanation: 'The logs were generated by the old policy\'s action distribution; averaging them estimates the old policy, not the new one. IPS multiplies each sample\'s reward by the importance weight pi_new(a|x)/pi_log(a|x), reweighting the logged distribution into the target one — unbiased if propensities are correct and there is support overlap. The catch is variance: when the new policy strongly prefers an action the old policy rarely took, that weight explodes and a few samples dominate the estimate. Hence weight clipping, self-normalised IPS, and the move to doubly-robust estimators.',
    fix: 'Use IPS with logged propensities, but tame variance with weight clipping / self-normalised IPS, and prefer a doubly-robust estimator (IPS correction on top of a fitted reward model) so you get low bias and lower variance; always check propensity overlap before trusting the number.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-rl-doubly-robust', subject: 'recsys', subtopic: 'rl-recsys', level: 'staff', type: 'multistep',
    title: 'Why doubly-robust beats both a reward model and raw IPS',
    context: [
      'You are choosing an off-policy estimator for a slate-recommendation policy from logged data.',
      'Option A: a direct method (fit a reward model q-hat(x,a), evaluate the new policy against it).',
      'Option B: raw IPS. Option C: doubly-robust (DR), which combines them.',
    ],
    steps: [
      {
        question: 'What is the failure mode of the direct method (reward-model-only) alone?',
        options: [
          'It has unbounded variance like IPS',
          'It is biased whenever the fitted reward model q-hat is wrong, and it can be confidently wrong on actions the new policy favours but the logs rarely covered — model misspecification silently corrupts the estimate',
          'It cannot be computed without propensities',
          'It always underestimates reward',
        ],
        answer: 1,
        finding: 'The direct method is low-variance but biased under model error — and you cannot see the bias.',
      },
      {
        question: 'How does doubly-robust combine the two to get the best of each?',
        options: [
          'It averages the DM and IPS estimates 50/50',
          'It uses the reward model q-hat as a baseline and applies IPS only to the residual (reward minus q-hat prediction); it is consistent if EITHER the propensities OR the reward model is correct, and the good q-hat shrinks the IPS residual so variance drops',
          'It multiplies the two estimates together',
          'It discards IPS entirely and just regularises the reward model',
        ],
        answer: 1,
        finding: 'DR is unbiased if either component is right, and the reward model reduces IPS variance by shrinking the residual it must correct.',
      },
      {
        question: 'What does DR still NOT rescue you from?',
        options: [
          'Nothing — DR is a complete substitute for online testing',
          'Poor support / no overlap: if the logging policy assigned near-zero probability to actions the new policy loves, no reweighting or residual has data to work with — DR reduces variance but cannot invent evidence, so a final online A/B is still needed',
          'The need to compute importance weights',
          'The ability to fit a reward model at all',
        ],
        answer: 1,
        finding: 'DR is not magic: with no logged support for the target policy\'s actions, only an online test settles it.',
      },
    ],
    diagnosis: 'Direct methods risk bias, raw IPS risks variance; DR hedges both but cannot fix missing support',
    explanation: 'The staff-level judgment is estimator selection under bias/variance and support. The direct method is low-variance but only as good as the reward model, which is unverifiable exactly where the new policy diverges. Raw IPS is unbiased but high-variance on that same divergence. Doubly-robust uses the reward model as a control variate and IPS on the residual: consistent if either piece is right, and lower variance because a decent q-hat shrinks the residual IPS must correct. What DR cannot do is manufacture evidence for actions the logging policy never explored — with no overlap, every off-policy method is guessing, and only an online experiment resolves it.',
    fix: 'Default to doubly-robust (or its self-normalised / switch variants) for OPE, sanity-check propensity overlap and effective sample size, and treat OPE as a screen that ranks candidate policies before a confirmatory online A/B — never as a replacement for it.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-rl-reward-hacking', subject: 'recsys', subtopic: 'rl-recsys', level: 'staff', type: 'rubric',
    title: 'The engagement-optimising RL agent starts gaming its own reward',
    context: [
      'A session-level RL recommender is trained to maximise cumulative watch/listen time.',
      'After a few weeks it learns to auto-queue endless low-quality filler, autoplay content users leave running in the background, and push mild rage-/cliffhanger-bait — listen-time is up, but satisfaction surveys, subscription renewals, and long-run retention are quietly down.',
      'You are asked how to think about and fix this.',
    ],
    question: 'Diagnose the reward-hacking here and lay out how you would redesign the objective and safeguards.',
    levels: {
      junior: 'Says "engagement went up so it is working," or proposes simply lowering the learning rate / adding more data — treats it as a tuning bug rather than a misaligned objective.',
      mid: 'Recognises listen-time is a gameable proxy and suggests adding a quality signal (skips, completion), but does not connect it to long-term value, does not anticipate the agent gaming the new proxy too, and has no guardrail/monitoring plan.',
      senior: 'Frames it as reward hacking / proxy misalignment: the agent optimises measured listen-time, not true value. Proposes a multi-objective reward blending listen-time with completion, explicit satisfaction/quality signals, and negative rewards for skips and background-idle; adds long-term reward (return visits, retention) and A/B guardrails on satisfaction and renewals.',
      staff: 'Everything senior says, plus: treats the reward function itself as the product surface to govern. (1) Anchors reward to long-horizon value — model or proxy for retention/LTV — not a same-session engagement number, since any single-session proxy is gameable. (2) Expects the agent to hack whatever proxy you write and designs adversarially: caps/diminishing returns on raw time, active-listening detection to discount background idle, and quality/satisfaction terms with their own guardrails. (3) Adds off-policy evaluation + a long-horizon holdout so reward hacking is caught as retention/renewal divergence before full ramp, not after. (4) Names the organisational risk — engagement dashboards will look great while the business erodes — and insists the decision metric be retention/renewal with engagement as a guardrail, plus human/editorial review and content-quality constraints in the reward. Discusses that this is fundamentally a value-alignment problem, not a metric-tuning one.',
    },
    source: 'Authored · RecSys/JD',
  },

  // ══════════════════════════════════════════════════════════════════
  // session / autoplay / sequential (3: junior 1, mid 1, senior 1)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'recsysadv-seq-nextitem-basics', subject: 'recsys', subtopic: 'session-autoplay', level: 'junior', type: 'mcq',
    title: 'Why the autoplay queue needs a sequence model, not just a profile',
    context: [
      'Autoplay decides the next audio item when the current one ends.',
      'A junior wants to just recommend the user\'s all-time top-genre item each time.',
      'But within one session a user is often on a specific arc (e.g. three episodes deep in one thriller series).',
    ],
    question: 'Why is a sequence/session model better than a static profile for next-item autoplay?',
    options: [
      'Sequence models are just profiles with more parameters and behave identically',
      'The immediate next-best item depends on the recent in-session sequence (what was just played, the series arc, current intent), which a static long-term profile ignores — a session model conditions on the ordered recent history',
      'Static profiles cannot store genre preferences',
      'Sequence models remove the need for any user history at all',
    ],
    answer: 1,
    diagnosis: 'Autoplay is about in-session continuation, which is inherently sequential',
    explanation: 'A static top-genre profile answers "what does this person like in general?" — but autoplay must answer "given the last few things just played in this session, what comes next?" If someone is three episodes into a series, the right next item is episode four, not their all-time favourite from another genre. Sequence models (RNN/GRU4Rec, self-attention/SASRec-style) condition on the ordered recent history to capture the current arc and short-term intent the profile cannot see.',
    fix: 'Use a session-aware sequence model for next-item/autoplay that consumes the ordered recent plays; blend it with the long-term profile so continuation intent and durable taste both count.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-seq-autoplay-chain-quality', subject: 'recsys', subtopic: 'session-autoplay', level: 'mid', type: 'mcq',
    title: 'Every autoplay step looks fine, the chain drifts into junk',
    context: [
      'Autoplay picks each next item greedily by highest next-item score.',
      'Each individual pick is locally reasonable, but after 6-7 auto-advances the queue has drifted far from where the session started and users bail.',
      'Per-step next-item accuracy is high; end-of-chain satisfaction is low.',
    ],
    question: 'What is the core problem with greedy per-step autoplay, and the right lens to evaluate it?',
    options: [
      'The next-item model is simply inaccurate — retrain it',
      'Greedy step-optimal choices compound: small per-step drift accumulates over the chain, and error at step k changes the context for step k+1; you should evaluate and optimise the whole autoplay chain (trajectory quality / cumulative session value), not per-step accuracy',
      'Autoplay should always replay the same item to avoid drift',
      'The problem is latency in scoring the next item',
    ],
    answer: 1,
    diagnosis: 'Locally optimal next-items do not compose into a good chain',
    explanation: 'Greedy autoplay optimises each hop in isolation. Because each choice becomes the context for the next, small drifts compound — a slightly-off pick at step 2 skews steps 3-7, and by the tail the queue is unrelated to the session\'s intent even though every single step scored well. High per-step top-1 accuracy is the wrong yardstick; what matters is the quality of the emitted sequence. This is the same myopic-vs-cumulative issue the RL framing addresses.',
    fix: 'Evaluate autoplay by chain/trajectory quality (session length, completion, satisfaction over the whole queue), add coherence/diversity constraints and drift guards, and consider lookahead or an RL/long-term-value objective so the chain — not each hop — is what gets optimised.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-seq-binge-override', subject: 'recsys', subtopic: 'session-autoplay', level: 'senior', type: 'mcq',
    title: 'When a binge should override the long-term profile',
    context: [
      'A normally eclectic user (broad long-term profile) has spent the last 90 minutes exclusively on one true-crime series, finishing episodes back-to-back.',
      'The homepage/autoplay must decide how much weight to give this in-session binge vs the broad long-term taste.',
    ],
    question: 'What is the right way to arbitrate short-term binge intent vs long-term profile?',
    options: [
      'Always trust the long-term profile — a 90-minute binge is noise',
      'Detect strong, coherent in-session intent and let it dominate temporarily (surface next episodes / same-series continuations), while keeping long-term taste for cold-start-of-session and post-binge; the weighting should be dynamic on session-intent strength, not fixed',
      'Always trust the current session and discard the long-term profile entirely',
      'Randomly alternate between the two each request',
    ],
    answer: 1,
    diagnosis: 'Short- and long-term intent should be blended dynamically by how strong the in-session signal is',
    explanation: 'A sustained, coherent binge is a strong revealed short-term intent — the single most predictive signal for the next item right now, and users experience "recommend my all-time favourites" mid-binge as jarring. But the long-term profile is not noise either: it is the right prior at session start, after the binge ends, and for the broader homepage beyond the continue-listening shelf. The senior answer is a dynamic gate that raises short-term weight when in-session intent is strong and coherent, and reverts to the long-term profile when it is weak or the session resets — not a static 50/50 or an all-or-nothing rule.',
    fix: 'Model short- and long-term interest separately and fuse them with a session-intent-strength gate (attention over recent history, or an explicit intent-confidence weight); let a strong coherent binge dominate continuation surfaces while long-term taste governs session-start and diversification.',
    source: 'Authored · RecSys/JD',
  },

  // ══════════════════════════════════════════════════════════════════
  // A/B testing for recsys (3: mid 1, senior 1, staff 1)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'recsysadv-ab-novelty-primacy', subject: 'recsys', subtopic: 'ab-testing', level: 'mid', type: 'mcq',
    title: 'The new recommender spiked for a week, then faded',
    context: [
      'A new homepage ranker wins big in the first days of the A/B: engagement +9%.',
      'By week three the lift has decayed toward flat.',
      'Nothing about the model changed during the test.',
    ],
    question: 'What is the most likely explanation and the correct handling?',
    options: [
      'The model degraded on its own — retrain it weekly',
      'A novelty (or primacy) effect: users react to the change itself, not its lasting value; measure over a long-enough window past the novelty decay and judge on the stabilised effect, not the early spike',
      'The A/B randomisation broke after week one',
      'Engagement always decays, so the first-week number is the true effect',
    ],
    answer: 1,
    diagnosis: 'Early lift can be a reaction to change, not durable value',
    explanation: 'When users notice something new they engage more with it regardless of quality (novelty effect); conversely they can cling to the old layout (primacy/change-aversion) and depress a genuinely better variant early. Both are transient. Reading the decision off the first days over-credits novelty and mis-sizes the true effect. You run the test long enough for the novelty to wash out and evaluate on the stabilised, post-decay lift — and ideally check that the effect holds for users who joined the experiment later (no first-exposure bump).',
    fix: 'Run past the novelty-decay window, evaluate on the stabilised effect (or on users with later first-exposure), and treat a large-then-fading lift as a novelty signature rather than a win.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-ab-interleaving', subject: 'recsys', subtopic: 'ab-testing', level: 'senior', type: 'mcq',
    title: 'Comparing two rankers with far fewer users',
    context: [
      'You must compare ranker A vs ranker B and a classic A/B needs weeks to reach power because between-user variance is large.',
      'A colleague suggests interleaving instead.',
    ],
    question: 'Why is interleaving so much more sensitive than a standard A/B for ranking comparisons?',
    options: [
      'Interleaving uses more users than an A/B, so it has more data',
      'Interleaving mixes both rankers\' results into one list per user and attributes clicks to whichever ranker contributed the item, so each user is their own control — this removes between-user variance and detects ranking differences with far less traffic',
      'Interleaving replaces click data with survey responses',
      'Interleaving eliminates the need for statistical testing entirely',
    ],
    answer: 1,
    diagnosis: 'Within-user comparison removes the between-user noise that dominates A/B variance',
    explanation: 'In a standard A/B, each user sees only one ranker, so the huge person-to-person variance in engagement sits in the denominator and you need lots of users to see a small ranking difference. Interleaving (team-draft / balanced) merges A\'s and B\'s outputs into a single list, shows it to one user, and credits each click to the ranker that supplied that item. Because the same user is exposed to both simultaneously, between-user variance cancels — interleaving routinely detects preferences with 1-2 orders of magnitude less traffic than an A/B. The trade-off: it measures relative ranking preference, not absolute end-to-end metrics.',
    fix: 'Use interleaving for fast, sensitive pairwise ranker comparison to shortlist a winner, then confirm the winner\'s absolute system impact (retention, engagement, guardrails) with a standard A/B.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-ab-metric-guardrails', subject: 'recsys', subtopic: 'ab-testing', level: 'staff', type: 'mcq',
    title: 'Choosing the decision metric for a recsys experiment',
    context: [
      'A new recommender lifts same-session clicks/plays by +6% but the team debates whether to ship.',
      'For an audio-streaming business the north star is retention and subscription value, not raw clicks.',
      'There are also concerns about interference (popular items shared across users) and metric gaming.',
    ],
    question: 'What is the correct staff-level metric and experiment design stance?',
    options: [
      'Ship on the +6% click lift — clicks are the most direct engagement signal',
      'Make the decision metric a long-term/retention proxy aligned with the business (e.g. D28 retention or subscription-relevant engagement), keep short-term engagement and content-diversity as guardrails, watch for novelty and interference, and only ship if the long-horizon metric holds without tripping guardrails',
      'Use only offline NDCG since online tests are noisy',
      'Optimise whichever metric moves the most in week one',
    ],
    answer: 1,
    diagnosis: 'The decision metric must be the business goal, with engagement as a guardrail not the target',
    explanation: 'Short-term clicks are a gameable proxy and often anti-correlated with retention (clickbait, filler, autoplay padding all raise clicks while eroding satisfaction). For a subscription audio business, the decision metric should be a long-horizon value proxy — retention / durable engagement — with same-session engagement, catalogue diversity, and satisfaction as guardrails so a variant that wins clicks by hurting the experience is blocked. You also account for interference (shared popular content, network effects) via appropriate randomisation/cluster designs, and for novelty by running long enough. Shipping on the click lift is exactly the trap.',
    fix: 'Pre-register a retention-aligned decision metric plus guardrails (engagement, diversity, satisfaction, guardrail on new/light users); use cluster or careful randomisation where interference exists; run past novelty; ship only on a durable long-horizon win with guardrails green.',
    source: 'Authored · RecSys/JD',
  },

  // ══════════════════════════════════════════════════════════════════
  // content understanding / NLP cold-start (3: junior 1, senior 1, staff 1)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 'recsysadv-content-coldstart-basics', subject: 'recsys', subtopic: 'content-nlp', level: 'junior', type: 'mcq',
    title: 'A brand-new series with zero plays cannot be reached by collaborative filtering',
    context: [
      'A new audio-series launches today. It has no plays, no co-listen data, no collaborative signal.',
      'The collaborative-filtering retriever, which learns item embeddings from interactions, has nothing to place it near — so it is effectively invisible.',
    ],
    question: 'How do you make the new series retrievable on day one?',
    options: [
      'Wait until it accumulates enough plays for CF to embed it',
      'Build a content embedding from its text/metadata/transcript (title, synopsis, genre, NLP/LLM embedding of the description or transcript) and place it in the retrieval space by content similarity to already-understood items',
      'Boost it to the top of every homepage until it gets plays',
      'Copy the embedding of a random existing series',
    ],
    answer: 1,
    diagnosis: 'Collaborative signal does not exist yet; content is the only bootstrap',
    explanation: 'Collaborative filtering learns item vectors purely from interaction co-occurrence — a zero-interaction item has no anchor, so CF literally cannot position it. But the series is not information-free: its title, synopsis, genre tags, and transcript describe it. Encoding that text (an NLP/LLM embedding) into the same retrieval space lets you place the new item next to content-similar, already-popular items, so it can be retrieved for users who like those — before it has a single play.',
    fix: 'On launch, embed the new series from its text/transcript via a content/NLP model into the shared retrieval space so it is reachable by content similarity; let collaborative signal take over as real interactions accrue.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-content-blend-transition', subject: 'recsys', subtopic: 'content-nlp', level: 'senior', type: 'mcq',
    title: 'Handing off from content signal to collaborative signal',
    context: [
      'New titles start with only content (NLP/transcript) embeddings; established titles have rich collaborative embeddings.',
      'A fixed blend (e.g. always 50% content + 50% collaborative) is proposed for every item.',
      'Content signal is a decent prior but collaborative signal is ultimately more personalised once it exists.',
    ],
    question: 'What is the right way to blend content and collaborative signal across an item\'s life?',
    options: [
      'Fixed 50/50 for all items forever — simplest and unbiased',
      'Weight the blend by interaction confidence: lean heavily on content when interactions are sparse (new item / new user) and shift weight toward collaborative signal as reliable interaction data accumulates, per item and per user',
      'Use content only, since collaborative signal causes feedback loops',
      'Use collaborative only and never fall back to content',
    ],
    answer: 1,
    diagnosis: 'The content/collaborative mix should follow how much reliable interaction evidence exists',
    explanation: 'Content embeddings are a strong prior exactly when interactions are missing, but they are coarse — they know a thriller is a thriller, not that this specific thriller over-indexes with a particular audience. Collaborative signal captures that personalised nuance, but only once enough interactions exist to be trustworthy. A fixed 50/50 under-uses content for brand-new items and under-uses collaborative signal for mature ones. The right design ramps the weight with interaction confidence — content-dominant at cold-start, collaborative-dominant once the item/user is warm — a per-item, per-user schedule rather than a global constant.',
    fix: 'Blend with an interaction-confidence-weighted schedule (e.g. weight collaborative ~ n/(n+k) in play count): content-heavy while sparse, smoothly handing off to collaborative signal as data accrues, tracked separately for cold items and cold users.',
    source: 'Authored · RecSys/JD',
  },
  {
    id: 'recsysadv-content-llm-embedding-bootstrap', subject: 'recsys', subtopic: 'content-nlp', level: 'staff', type: 'mcq',
    title: 'Bootstrapping a whole new catalogue vertical with LLM content embeddings',
    context: [
      'The company launches a new vertical (e.g. regional-language audio-dramas) with hundreds of brand-new titles and no interaction history at all.',
      'A team proposes embedding every title\'s transcript/synopsis with an off-the-shelf LLM and dropping those vectors straight into the existing recommender\'s retrieval space.',
      'You are the staff reviewer.',
    ],
    question: 'What is the critical issue with dropping raw LLM text embeddings straight into the existing retrieval space?',
    options: [
      'LLM embeddings are always too small-dimensional to be useful',
      'Raw LLM-text-embedding geometry is not aligned with the recommender\'s interaction-learned space — semantic text similarity is not the same as behavioural co-listen similarity — so you must project/align content embeddings into the collaborative space (or train a content tower to predict collaborative embeddings) rather than assume the two spaces are interchangeable',
      'LLM embeddings cannot be computed for non-English text',
      'The vectors will be identical for every title so retrieval fails',
    ],
    answer: 1,
    diagnosis: 'Semantic-text space and behavioural-recommendation space are different geometries',
    explanation: 'The recommender\'s retrieval space encodes behavioural similarity — items are near each other because the same people engage with them, which need not match textual/semantic similarity (two thrillers can read alike but attract different audiences; a comedy and a drama can share an audience). Raw LLM embeddings capture the former, not the latter. Dropping them in unaligned means nearest-neighbour retrieval returns text-similar-but-behaviourally-wrong items. The staff move is alignment: learn a projection from content-embedding space into the collaborative embedding space (or train a content tower to regress toward collaborative item vectors of comparable existing titles), so new-vertical items land where behaviourally-similar existing items live and warm up correctly as interactions arrive.',
    fix: 'Do not use raw LLM vectors directly for retrieval. Train a content tower / learned projection that maps text embeddings into the interaction-learned space (regress content -> collaborative embedding on overlapping titles), validate that content-nearest-neighbours match behavioural neighbours, seed the vertical with the aligned vectors, and blend toward collaborative signal with an exploration budget as real plays arrive.',
    source: 'Authored · RecSys/JD',
  },
];
