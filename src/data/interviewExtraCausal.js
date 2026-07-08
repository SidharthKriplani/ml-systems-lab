/**
 * Extra Causal Inference Interview Bank
 *
 * Senior/Staff-level causal-inference interview questions with model answers, for the
 * cat/q/answer/whatsTested/antiPattern/staffFraming ("EXTRA_QUESTIONS") surface.
 * Grounded in src/data/foundations/causalModules.js's `pot_outcomes` and `rct_design`
 * modules (potential outcomes framework, ATE/ITE/ATT/CATE, SUTVA, randomization's
 * balancing property, unit of randomization, power/MDE, ITT vs CACE, the Wald
 * estimator, AA tests, peeking). Both source modules went through a writer pass and
 * an independent Pass-2 adversarial audit before this bank was written — see
 * docs/BACKLOG.md for that audit's findings. All 10 of these are original, written
 * for this bank.
 *
 * Shape (must match the interview-prep filters):
 *   { id, cat, company, level, q, answer, whatsTested, antiPattern, staffFraming }
 *   cat     = 'Causal Inference'
 *   company ∈ 'Meta' | 'Amazon' | 'Netflix' | 'Uber' | 'Any' | etc.
 *   level   ∈ 'Mid' | 'Senior' | 'Staff'
 */

export const EXTRA_CAUSAL = [
  {
    id: 6001,
    cat: 'Causal Inference',
    company: 'Any',
    level: 'Mid',
    q: 'A user got a discount email and spent $100 over the next month. How would you determine whether the email caused that spend, and why can you never fully answer that question for this one user?',
    answer: "For User 47 you'd need two numbers: Y_47(1), what they spent having gotten the email (observed: $100), and Y_47(0), what they would have spent had they NOT gotten it (the counterfactual). The individual treatment effect is ITE_47 = Y_47(1) − Y_47(0), and you only ever see one of those two branches — whichever the actual random draw assigned. The other branch, the counterfactual, doesn't exist anywhere to be measured; it's not a data-collection gap, it's the Fundamental Problem of Causal Inference: you observe exactly one of two potential outcomes per unit, always, no matter how much instrumentation or data volume you throw at it. What IS estimable, given a good design, is the average across many users (the ATE) — because a randomized assignment mechanism makes the missing half recoverable in expectation across the population, even though it stays permanently missing for any one person.",
    whatsTested: 'Whether you can state the Fundamental Problem of Causal Inference precisely (one of two potential outcomes observed, per unit, always) rather than describing it as a measurement or data-quality limitation that better instrumentation could fix.',
    antiPattern: 'Answering "we\'d need better tracking" or "a bigger sample" — no amount of tracking or scale recovers a counterfactual for one specific person. This is a structural fact about what can be observed, not a data engineering gap.',
    staffFraming: 'A staff-level answer pivots immediately from "we can\'t know this person\'s effect" to "here\'s what we CAN estimate and under what assumptions" — the ATE, given a valid design — rather than leaving the interviewer with only the impossibility result.',
  },
  {
    id: 6002,
    cat: 'Causal Inference',
    company: 'Any',
    level: 'Senior',
    q: 'A clinical trial enrolling only volunteers reports ATE = +5 points on a health scale. A policymaker wants to mandate the treatment for the entire population based on that number. What is wrong with that logic, even assuming the trial itself was perfectly randomized?',
    answer: "The trial's internal randomization guarantees the +5 is a valid estimate for the population that was ELIGIBLE to be randomized — the volunteers — but says nothing about whether that population matches the mandate's target, everyone. This is an estimand mismatch: the policymaker is treating a volunteer-sample ATT (average effect on the treated, where 'treated' here really means 'the self-selected group who chose to enroll') as if it were the population-wide ATE. Volunteers are very plausibly systematically different from people who'd be compelled to take the treatment — more health-conscious, different baseline severity, different comorbidities — so the +5 point estimate may not transfer. The fix isn't re-running the trial with better randomization; it's checking covariate overlap between the volunteer sample and the mandate's target population, and being explicit that the estimate applies to the enrolled subpopulation until that overlap is verified.",
    whatsTested: 'Whether you distinguish the internal validity of a randomized design (which the trial has) from the external validity / estimand question of whether the sample represents the policy target (which is separate and can fail even in a perfectly randomized trial).',
    antiPattern: 'Treating "the trial was randomized" as sufficient justification for a universal policy. Randomization fixes confounding WITHIN the sample; it does not make the sample representative of people who were never eligible to be in it.',
    staffFraming: 'A staff-level answer names the specific estimand being conflated (ATT of volunteers vs. ATE of the full population) rather than gesturing vaguely at "selection bias," and proposes the concrete next step: covariate-overlap comparison before extrapolating.',
  },
  {
    id: 6003,
    cat: 'Causal Inference',
    company: 'Meta',
    level: 'Staff',
    q: "You treat 10% of users in a social network with a new feature and compare their engagement to the untreated 90%. Engagement in the treated group rises only modestly. A colleague says 'the effect is small.' What would you check before agreeing?",
    answer: "I'd check for a SUTVA violation via interference first, because in a social network it's the default risk, not an edge case: if treated users' behavior (sharing, posting, inviting) reaches untreated-but-connected users, then the 'untreated' 90% isn't actually a clean baseline — it's an indirectly-treated group whose outcome, Y_i(0), is contaminated by spillover from their treated connections. That contamination pushes the untreated group's average UP toward the treated group's, which shrinks the measured gap and makes the true effect look smaller than it is — this specific failure mode underestimates, it doesn't inflate. The diagnostic is to compare outcomes across clusters with high versus low treated-neighbor density: if users with more treated friends show higher 'control' engagement even though they themselves weren't treated, that's the signature of interference. If confirmed, the fix for the NEXT experiment is cluster-based (e.g., geographic or friend-group) randomization so spillover stays within a cluster rather than crossing between treatment and control.",
    whatsTested: 'Whether you can name SUTVA/interference as the first hypothesis to rule out in a social-network experiment specifically, and reason correctly about the DIRECTION of the resulting bias (underestimate, not overestimate).',
    antiPattern: "Agreeing the effect is simply small, or attributing it to noise/underpowering, without first asking whether the control group's own baseline was contaminated by exposure to the treatment through the network.",
    staffFraming: "A staff-level answer treats this as a standing risk for ANY social-network experiment, not a one-off diagnosis — proposing cluster randomization as the default design for this class of feature going forward, not just a post-hoc explanation for this one result.",
  },
  {
    id: 6004,
    cat: 'Causal Inference',
    company: 'Any',
    level: 'Senior',
    q: "Your team has a DAG for an observational analysis and a well-specified adjustment set. A colleague argues that's just as good as running a randomized experiment, since you've accounted for the known confounders. How do you respond?",
    answer: "A DAG-derived adjustment set only protects you against confounders you thought to draw and were able to measure — it's conditional on the analyst's foresight and the data's coverage. If there's a confounder nobody thought of, or one that exists but wasn't recorded, the adjustment set simply doesn't block that backdoor path, and the estimate stays biased with no error message telling you so. Randomization is a fundamentally different guarantee: a fair coin flip makes treatment assignment statistically independent of EVERY unit characteristic, known or not, so in expectation the arms are balanced on confounders nobody ever thought to draw. That's not a matter of degree — it's the entire reason randomized designs are called the gold standard. The DAG-based estimate can still be useful when randomization is genuinely infeasible, but it's not 'just as good' — it's a weaker guarantee that rests on an assumption (no unmeasured confounding) that can never be verified from the same data used to estimate the effect.",
    whatsTested: "Whether you can articulate the specific difference between randomization's unconditional guarantee and an adjustment set's guarantee conditional on the analyst having identified every confounder.",
    antiPattern: 'Agreeing that a sufficiently thorough DAG is equivalent to randomization. However thorough, a DAG-based approach never protects against a confounder that wasn\'t drawn — and there is no way to confirm from the data alone that none exists.',
    staffFraming: 'A staff-level answer acknowledges when observational methods are the only option available (randomization is sometimes infeasible or unethical) while still being precise that this is a fallback with a real, unverifiable assumption attached, not a substitute of equal strength.',
  },
  {
    id: 6005,
    cat: 'Causal Inference',
    company: 'Amazon',
    level: 'Mid',
    q: 'You are designing an A/B test for a full checkout-flow redesign. Should you randomize at the user level, the session level, or the page level? Walk through the tradeoff.',
    answer: "This is a real design decision, not a detail to default on. Page-level randomization gains the most statistical power (most randomization events per user) but carries the highest contamination risk — the same user could see the old flow on one page and the new flow on the next within a single checkout attempt, which is exactly the kind of within-journey mixing a full redesign can't tolerate; you'd be measuring a Frankenstein experience, not either design. Session-level is a middle ground: more power than user-level, but a returning user can still land in different arms across sessions, muddying any user-level before/after comparison. User-level randomization gives each user one consistent experience for the whole redesign, at the cost of some statistical power relative to the finer-grained options. For a full checkout-flow redesign specifically, I'd choose user-level: the redesign changes the entire journey, so a user experiencing pieces of both versions in the same checkout attempt would make the comparison uninterpretable, and that risk outweighs the extra power page-level would buy.",
    whatsTested: 'Whether you can state the actual power-vs-contamination tradeoff across units of randomization and apply it correctly to a full-flow redesign specifically, rather than defaulting to one unit reflexively.',
    antiPattern: "Picking whichever unit maximizes sample size without asking whether within-unit contamination would invalidate the very comparison the test needs to make. More randomization events is not free if it breaks the thing you're trying to measure.",
    staffFraming: 'A staff-level answer picks the unit of randomization as the FIRST design decision, before touching sample size or duration, because it determines whether a clean comparison is even possible for this specific kind of change.',
  },
  {
    id: 6006,
    cat: 'Causal Inference',
    company: 'Any',
    level: 'Senior',
    q: "Your team wants to detect a lift of 0.1 percentage points instead of the 0.5 points you're used to testing for. Roughly how much longer will the experiment need to run, and why does this matter for prioritizing which ideas get tested?",
    answer: "Required sample size to hit a target power scales roughly as 1/MDE², so halving the minimum detectable effect roughly QUADRUPLES the sample needed, not doubles it — going from a 0.5-point MDE down to 0.1 points is a 5x tighter target, which means roughly 25x the sample size (or duration, at fixed traffic) to reach the same power. This is why hunting a small lift takes months while a large one resolves in days — it's a quadratic wall, not a linear one. For prioritization, this means the cost of testing an idea isn't just 'do we believe it works,' it's 'how big an effect do we expect, and can we actually afford the sample size that MDE requires' — an idea that might plausibly move a metric by only 0.1 points needs either a much longer test, a much higher-traffic surface, or a variance-reduction technique (like using pre-period covariates) to be testable at all in a reasonable timeframe. Teams that don't account for this quadratic relationship routinely under-power tests for small expected effects and then wrongly conclude 'no effect' when the real issue is insufficient sensitivity.",
    whatsTested: 'Whether you know the 1/MDE² scaling relationship precisely (quadratic, not linear) and can connect it to a practical prioritization consequence, not just recite the formula in the abstract.',
    antiPattern: "Saying the required sample size 'roughly doubles' for a halved MDE, or treating MDE purely as a statistics detail disconnected from which product ideas are even feasible to test within a reasonable timeframe.",
    staffFraming: "A staff-level answer treats MDE as a PORTFOLIO decision, not a per-experiment stats question: knowing the quadratic cost of small effects should shape which ideas the team even attempts to A/B test versus ships on judgment, since some effects are real but structurally too small to ever prove within available traffic.",
  },
  {
    id: 6007,
    cat: 'Causal Inference',
    company: 'Any',
    level: 'Mid',
    q: 'In your feature rollout A/B test, 20% of users assigned to treatment never actually load the feature (stale cache, ad blocker, bounce before render). You report an Intent-to-Treat (ITT) effect of $6.40 per user. Is that the number that tells you whether the feature itself works?',
    answer: "Not directly — ITT compares users by the GROUP they were assigned to, not by what they actually experienced, so the $6.40 is diluted by the 20% who were assigned to treatment but never actually used it. Under one-sided non-compliance (nobody in control ever crosses into treatment — the monotonicity assumption), the effect on people who actually used the feature, the Complier Average Causal Effect, is CACE = ITT / compliance rate = $6.40 / 0.80 = $8.00. The $8.00 is the number that answers 'does the feature itself work' — it's the effect among people who were actually exposed to it. The $6.40 (ITT) answers a different, also-important question: 'what will actually happen if we ship this to everyone,' since in the real rollout some fraction will always fail to load it for the same reasons (cache, ad blockers, bounces) that showed up in the test. Both numbers are correct; they answer different questions, and conflating them either overstates what shipping will achieve or understates what the feature itself is worth.",
    whatsTested: 'Whether you can correctly compute and interpret CACE from ITT under one-sided non-compliance, and articulate that ITT and CACE answer genuinely different questions rather than one being a "more correct" version of the other.',
    antiPattern: "Treating ITT as simply an underestimate to be corrected, then reporting only the CACE figure going forward. ITT is the right number for predicting rollout impact; CACE is the right number for judging the feature's intrinsic value. Neither replaces the other.",
    staffFraming: 'A staff-level answer states the monotonicity assumption CACE relies on explicitly (no control-side crossover) and flags that if control also has crossover, the correct generalization is the Wald estimator — dividing by the DIFFERENCE in take-up between arms, not the raw 0.80.',
  },
  {
    id: 6008,
    cat: 'Causal Inference',
    company: 'Any',
    level: 'Senior',
    q: 'After your A/B test concludes with a surprising, strong result, how would you sanity-check that the randomization itself was sound before presenting the finding?',
    answer: "I'd run an AA test: take the control group, split it into two random halves, and test for a significant difference on the primary metric between those two halves. Since both halves are 'control,' any true effect between them is exactly zero, so this is a direct diagnostic on the assignment/logging infrastructure itself, not on the treatment. A significant difference between two supposedly identical control halves means something in the randomization or assignment pipeline is systematically creating groups that weren't actually exchangeable before treatment ever began — which calls the ENTIRE original AB result into question, not just this one metric, because whatever broke the AA split was equally present when treatment and control were originally assigned. I'd run this before presenting a surprising result specifically, since a genuinely large or unexpected effect is exactly the situation where it pays to rule out 'the assignment mechanism itself is broken' before 'the treatment genuinely works this well.'",
    whatsTested: "Whether you know the AA test's actual diagnostic purpose (validating the randomization/assignment infrastructure, not routine noise-checking) and would apply it specifically as a check on a surprising result before trusting it.",
    antiPattern: "Treating a passed AA test as a formality, or skipping it because 'we already know the randomization code works.' A significant AA result invalidates every AB result the same infrastructure has produced, which is exactly why it's worth checking before broadcasting a striking finding.",
    staffFraming: "A staff-level answer treats this as standing infrastructure hygiene, not a one-off check: any time the experimentation platform is new, recently changed, or producing an unusually large effect, the AA test is the cheapest available check against a broken assignment pipeline, run before the result goes anywhere.",
  },
  {
    id: 6009,
    cat: 'Causal Inference',
    company: 'Any',
    level: 'Staff',
    q: "A PM keeps refreshing the experiment dashboard daily and wants to call the test the moment p crosses 0.05, arguing that's just 'being efficient' about the team's time. What's the actual risk, and what would you propose instead?",
    answer: "Each additional look at the data is another independent chance for pure noise to cross the significance threshold, so repeatedly checking and stopping the instant p<0.05 inflates the TRUE false-positive rate well above the nominal 5% — with enough daily peeks over a multi-week test, the effective Type I error rate can climb past 30%, meaning a large fraction of 'wins' called this way aren't real effects at all, they're noise that happened to cross the line on the day someone looked. This isn't a minor technicality; it directly undermines the guarantee that makes a p-value meaningful in the first place, since that guarantee assumes ONE look at a pre-committed sample size, not many. The fix is either committing to a fixed horizon and looking exactly once (accepting we won't peek, however tempting), or explicitly adopting a sequential testing framework (SPRT, always-valid p-values, alpha-spending) that's mathematically designed to preserve the false-positive guarantee under continuous monitoring. If the team genuinely needs to watch a dashboard daily for business reasons, the second option is the only one that's actually valid to act on mid-test.",
    whatsTested: 'Whether you can quantify why peeking inflates Type I error (not just assert that it does) and propose a concrete, valid alternative (fixed horizon or sequential/always-valid testing) rather than just flagging the problem.',
    antiPattern: 'Treating "we\'ll just be careful about it" or "only stop early if the effect looks really big" as an adequate mitigation. Neither changes the underlying math — any repeated-looks-then-stop policy on ordinary fixed-horizon significance inflates the false-positive rate, regardless of how disciplined the team feels about it.',
    staffFraming: 'A staff-level answer treats this as a policy decision for the whole experimentation platform, not a one-off conversation with one PM — proposing a standing analysis-plan sign-off (metric, horizon, and stopping rule fixed before data collection starts) as the actual fix, since the same pressure to peek will recur on every future test.',
  },
  {
    id: 6010,
    cat: 'Causal Inference',
    company: 'Uber',
    level: 'Staff',
    q: "A city-level pricing feature can only be tested by randomizing whole cities, since a within-city split would leak (SUTVA forces cluster-level assignment). With an intraclass correlation of 0.1 and roughly 100 users contributing data per city cluster, why can't you just use the same per-user sample size formula you'd use for a standard user-level A/B test?",
    answer: "The standard per-user sample size formula assumes each additional user contributes independent information, but within a city, users' outcomes are correlated with each other (shared local pricing dynamics, shared marketing exposure, shared economic conditions), so adding another user from an ALREADY-INCLUDED city buys much less new information than adding a user from a new city would. The Design Effect quantifies this penalty: DEFF ≈ 1 + (m−1) × ICC, where m is the cluster size and ICC is the intraclass correlation. With ICC = 0.1 and m = 100, DEFF ≈ 1 + 99 × 0.1 ≈ 10.9 — meaning you need roughly 11 times the naive per-user sample size to reach the same statistical power you'd get from that many independent individual-level observations. This penalty is unavoidable whenever SUTVA forces cluster-level randomization — it's not a modeling choice you can opt out of, it's the real statistical cost of the fact that users within a city aren't independent replicates of each other. Skipping this adjustment and using the naive per-user formula would badly underestimate how long the test needs to run, and the team would likely call the test 'inconclusive' when it was actually just underpowered by an order of magnitude.",
    whatsTested: 'Whether you can apply the DEFF formula correctly to a concrete ICC and cluster-size scenario and explain WHY correlated within-cluster observations require it, not just recognize the term.',
    antiPattern: "Using the standard per-user power calculation for a cluster-randomized design without adjustment, or treating the design effect as a minor correction rather than the roughly order-of-magnitude sample-size penalty it actually is at realistic ICC and cluster-size values.",
    staffFraming: 'A staff-level answer builds the DEFF penalty into the power analysis and timeline BEFORE the test launches — discovering an 11x sample-size gap partway through a cluster-randomized test is an expensive, avoidable surprise that a five-minute calculation up front would have caught.',
  },
];
