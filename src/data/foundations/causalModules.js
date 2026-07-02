export const CAUSAL_MODULES = [
  {
    id: 'pot_outcomes',
    title: 'Potential Outcomes Framework',
    subtitle: 'Rubin causal model, ATE/ATT, fundamental problem of causal inference',
    difficulty: 'foundational',
    estimatedMin: 29,
    tags: ['causal inference', 'potential outcomes', 'ATE', 'Rubin'],
    summary: `You want to know if sending a discount email causes users to make a purchase. User 47 receives the email and purchases. Would they have purchased anyway without the email? You can never know — you can only observe one reality for User 47. The "would have purchased anyway" outcome is the counterfactual — the potential outcome under the treatment not received. This is the fundamental problem of causal inference: for each individual, you observe exactly one of two potential outcomes, and the other is permanently missing.

[FIGURE: potoutcomes]

Rubin's potential outcomes framework names this gap precisely. For each unit i, define Y_i(1) — the outcome if treated — and Y_i(0) — the outcome if untreated. The individual treatment effect (ITE) is Y_i(1) − Y_i(0). You observe either Y_i(1) or Y_i(0), never both. The Average Treatment Effect (ATE) = E[Y_i(1) − Y_i(0)] is the average causal effect across all units. ATE is estimable even though ITE is not — with appropriate experimental design that makes the missing potential outcome recoverable in expectation.

Three identification assumptions make this possible. SUTVA (Stable Unit Treatment Value Assumption): your treatment does not affect others' outcomes — no spillover. Violated by network effects: treating one user can change connected users' behavior, contaminating the "untreated" group. Consistency: the observed outcome for a treated unit equals Y_i(1). Positivity/overlap: every unit has some probability of being in either treatment or control. If high-income users are never assigned to the discount condition, you have no evidence about the treatment effect for that group.

The estimand choice is a first decision, not an afterthought. ATE = average effect across all units. ATT = average treatment effect on the treated — the effect for people who actually received the treatment. CATE = conditional average treatment effect, the effect for units with features X = x. Using ATT to justify a universal rollout is an estimand error: the users who self-selected into treatment may benefit far more than the average user who would receive the rollout.

What this framework is not: a statement that causal inference is impossible. It is a statement that causal inference requires explicit assumptions, and those assumptions are claims about the world that cannot be verified from the same data used to estimate the effect. The assumptions must be argued from domain knowledge, embedded in study design (randomization), or subjected to sensitivity analysis — not assumed away.`,
    keyPoints: [
      `**Always specify the estimand before choosing an estimation method.** ATE = average effect across all units. ATT = average treatment effect on the treated. ATC = average treatment effect on the control. CATE = conditional average treatment effect for units with features X = x. These are different quantities with different identification assumptions and different policy implications. Confusing ATT for ATE when recommending a universal rollout produces the wrong answer for the wrong population.`,
      `**Trap: SUTVA violations from network effects.** In a social network, treating 10% of users and comparing to untreated users underestimates the true treatment effect — untreated users are indirectly affected by their treated connections. Their Y_i(0) is not the baseline outcome; it is the spillover-contaminated outcome. Test for SUTVA violations by comparing outcomes in clusters with high treated-neighbor density versus low treated-neighbor density.`,
      `**Diagnostic: if your estimated ATE changes substantially when you reweight to match population demographics, either treatment effects are heterogeneous across subgroups or you have a positivity violation for some subgroup.** A region of covariate space with only treated units means any estimate there is pure extrapolation. Report the estimand precisely — including which subpopulation the estimate applies to — before interpreting the result.`,
    ],
    interactivePrompt: `Before you touch the controls: if User 47 receives the discount email and purchases, what two things would you need to observe to know whether the email caused the purchase — and why can you never observe both?`,
    checkQuestions: [
      {
        q: `Observed data shows users who saw an ad (T=1) had 20% higher conversion than users who did not (T=0). Can you conclude the ad caused 20% lift? What would you need to make a causal claim?`,
        options: [
          `A) Yes — if the sample is large enough, the 20% difference is a valid causal estimate because the law of large numbers eliminates selection bias`,
          `B) No — the 20% includes selection bias: E[Y|T=1] − E[Y|T=0] = ATE + selection bias term. Users who saw ad may differ in intent/demographics/prior engagement. Need either: (1) RCT (random assignment), or (2) observational strategy with ignorability — measure all variables that predict ad exposure AND conversion. Critical question: any unmeasured variable predicting both exposure and conversion?`,
          `C) Yes — controlling for age and gender in a regression is sufficient to remove selection bias and recover the causal effect`,
          `D) No — the only valid approach is an RCT; observational strategies can never support causal claims about ad effectiveness`,
        ],
        answer: `B`,
      },
      {
        q: `A clinical trial shows ATE = +5 points on health scale. A policymaker wants to mandate the drug for everyone. Is ATE the right estimand? What if trial enrolled only volunteers?`,
        options: [
          `A) ATE is always the right estimand for policy decisions because it represents the average across all units; volunteer enrollment does not affect its validity`,
          `B) ATE is only valid when the trial population perfectly matches the policy target population, otherwise ATT should be used regardless of volunteer enrollment`,
          `C) The trial ATE is valid for mandating because randomization within the trial guarantees the estimate applies to all subpopulations, including non-volunteers`,
          `D) Mandating for everyone → target is ATE over full population including non-volunteers. If trial enrolled volunteers, estimated ATE may reflect ATT (effect among self-selected), not full population ATE. Volunteers may be more compliant or health-conscious. Right response: check covariate distributions of trial participants vs target population, consider external validity, weight estimate toward target population using covariate reweighting.`,
        ],
        answer: `D`,
      },
      {
        q: `You run an A/B test for a new social sharing feature. Control group engagement unexpectedly increased. What is happening?`,
        options: [
          `A) SUTVA violation — interference between units. Treated users share posts that appear in feeds of control users, changing control behavior even without treatment. Contamination means control group's Y_i(0) is spillover-inflated, not true baseline. Naive estimate underestimates true effect. Remedy: cluster-based randomization (assign friend groups or geographic regions) to isolate treatment and control groups from spillover.`,
          `B) Novelty effect — treated users are generating more content initially due to excitement about the feature, which temporarily lifts overall platform engagement`,
          `C) Regression to the mean — the control group's prior engagement was unusually low before the experiment started, and the increase reflects natural reversion`,
          `D) A/B test implementation error — the treatment feature was accidentally deployed to some control users, causing the unexpected engagement increase`,
        ],
        answer: `A`,
      },
      {
        q: `Why can the ignorability assumption never be tested from data? What is the best you can do to support it?`,
        options: [
          `A) Ignorability can be partially tested using balance tests on observed covariates — if all measured variables are balanced, ignorability is confirmed for both measured and unmeasured confounders`,
          `B) Ignorability cannot be tested because the propensity score model is always under-specified, but adding more covariates to the model eventually guarantees the assumption holds`,
          `C) To test ignorability you'd need to observe both Y(0) and Y(1) for the same unit — exactly what the Fundamental Problem prevents (you can't observe the counterfactual). Best you can do: (1) check balance on observed covariates (necessary but not sufficient), (2) run placebo tests on outcomes T can't causally affect, (3) argue from data-generating process that all common causes of T and Y are in X, (4) sensitivity analysis to quantify how large unmeasured confounder would need to be to overturn conclusion.`,
          `D) Ignorability cannot be tested because observational data is inherently biased; the only valid approach is to abandon observational inference and always run RCTs`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Causal inference is a missing data problem: for every unit you observe one potential outcome and must assume something about the other — and those assumptions are unverifiable from the same data you used to estimate the effect.`,
    recap: [
      `**Fundamental problem:** observe one of Y_i(1), Y_i(0) per unit — the counterfactual is permanently missing.`,
      `**ATE = E[Y_i(1) − Y_i(0)]** is estimable even though ITE is not — recover the missing outcome in expectation via design.`,
      `**Three assumptions:** SUTVA (no spillover), consistency, positivity/overlap (every unit could be in either arm).`,
      `**Pick the estimand first:** ATE vs ATT vs CATE — different quantities, different identification, different policy.`,
      `**Estimand error:** using ATT (self-selected treated) to justify a universal rollout.`,
      `**SUTVA breaks on network effects:** treated neighbours contaminate controls' Y_i(0) → underestimates the effect.`,
      `**Ignorability is unverifiable** from the same data — argue from domain knowledge, design, or sensitivity analysis.`,
    ],
    figures: {
      potoutcomes: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">You observe ONE cell per unit — the diagonal is forever missing</text>
  <text x="132" y="30" text-anchor="middle" fill="var(--ink-mid)" font-size="8" font-weight="700">Y(1) if treated</text>
  <text x="256" y="30" text-anchor="middle" fill="var(--ink-mid)" font-size="8" font-weight="700">Y(0) if control</text>
  <text x="8" y="58" fill="var(--ink-mid)" font-size="8" font-weight="700">Treated</text>
  <rect x="70" y="40" width="124" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="132" y="57" text-anchor="middle" fill="var(--ink-hi)" font-size="8">observed ✓</text>
  <rect x="200" y="40" width="112" height="26" rx="5" fill="none" stroke="var(--rim)" stroke-dasharray="3 3"/>
  <text x="256" y="57" text-anchor="middle" fill="var(--ink-low)" font-size="8">counterfactual</text>
  <text x="8" y="90" fill="var(--ink-mid)" font-size="8" font-weight="700">Control</text>
  <rect x="70" y="72" width="124" height="26" rx="5" fill="none" stroke="var(--rim)" stroke-dasharray="3 3"/>
  <text x="132" y="89" text-anchor="middle" fill="var(--ink-low)" font-size="8">counterfactual</text>
  <rect x="200" y="72" width="112" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="256" y="89" text-anchor="middle" fill="var(--ink-hi)" font-size="8">observed ✓</text>
  <text x="4" y="113" fill="var(--ink-low)" font-size="7.5">ITE = Y(1)−Y(0) needs both cells → never per-unit. ATE recovers it in expectation.</text>
</svg>`,
    },
  },
  {
    id: 'dag_confounding',
    interactiveId: 'confounding_bias_viz',
    title: 'DAGs and Confounding',
    subtitle: 'Directed acyclic graphs, backdoor criterion, collider bias, d-separation',
    difficulty: 'intermediate',
    estimatedMin: 32,
    tags: ['DAG', 'confounding', 'collider bias', 'd-separation'],
    summary: `You observe that coffee drinkers have higher lung cancer rates. Should coffee drinkers stop? Probably not — because smoking confounds the relationship. Smokers both drink more coffee and have higher cancer rates. The Coffee → Cancer association is a spurious path through the confounder Smoking. Without a way to represent this structure, you would add "coffee drinker" as a control variable in a cancer regression and be satisfied. But whether that controls for the right thing, blocks the wrong thing, or introduces new bias depends entirely on the causal structure — and the regression output will not tell you which case you are in.

[FIGURE: confounddag]

Directed Acyclic Graphs (DAGs) make that structure explicit. Nodes are variables. Directed arrows are direct causal claims. Three path types determine which variables to condition on. A confounding path runs Smoking → Coffee AND Smoking → Cancer: the backdoor path Treatment ← Confounder → Outcome. It must be blocked — condition on the confounder. A mediation path runs Treatment → Mediator → Outcome: the indirect causal channel. Conditioning on the mediator blocks the path you want to measure and underestimates the total effect. A collider is caused by both Treatment and Outcome: A → Collider ← B. Conditioning on the collider opens a spurious path between A and B that was never causally present. Classic collider bias: conditioning on hospitalization (collider of disease severity and treatment choice) creates spurious correlation between diseases and treatments within the hospitalized sample.

The backdoor criterion formalizes this. If you can find a set Z that blocks all backdoor paths (confounding paths from Treatment to Outcome) without blocking any frontdoor paths and without containing any descendant of Treatment, you can identify the causal effect by conditioning on Z.

What this is not: "control for everything." Controlling for a collider creates bias where none existed before. Controlling for a mediator blocks the path you want to measure. Controlling for a post-treatment variable that is a descendant of Treatment can do both. You need the DAG to know which variables to condition on and which to leave out. A "control for everything" strategy without a DAG is a systematic way to introduce collider bias while believing you removed confounding.`,
    keyPoints: [
      `**Draw the DAG before selecting control variables in any regression.** Identify the backdoor paths (confounding) and frontdoor paths (mediation). Control for variables that block backdoor paths. Do not control for mediators or colliders. A 10-minute DAG review prevents hours of debugging spurious results — the regression will run and return a coefficient regardless of whether the conditioning set was correct.`,
      `**Trap: conditioning on a descendant of treatment (post-treatment variable).** A variable caused by the treatment is either a mediator or a collider of treatment and a confounder. Including it as a control blocks the causal path you want (mediator) or opens a spurious path you do not want (collider). Always verify whether each control variable was determined before or after treatment assignment, and trace its arrows in the DAG before including it.`,
      `**Diagnostic: if adding a control variable changes your effect estimate by more than 50%, either you have added a strong confounder (expected, good) or introduced collider bias (bad).** Draw the DAG and determine which case applies. If the variable has arrows coming in from both Treatment and Outcome, it is a collider — removing it from the control set is the correct response, not refining the model further.`,
    ],
    interactivePrompt: `Before you touch the controls: in the coffee-smoking-cancer example, draw the three nodes and their arrows in your head — then identify which path type each arrow relationship creates and what you should do about it.`,
    checkQuestions: [
      {
        q: `You want to estimate the effect of exercise (T) on heart disease (Y). You have data on body weight (W). Draw two plausible DAGs and explain what you should do in each case.`,
        options: [
          `A) In both DAGs W should be controlled for — as either a confounder or mediator, conditioning on W always reduces bias in the exercise-heart disease estimate`,
          `B) DAG 1 — W is confounder (Diet→W, Diet→Y, Diet→T): must control for W to block backdoor path. DAG 2 — W is mediator (T→W→Y): controlling for W blocks indirect effect and gives only direct effect; if want total effect, do NOT control for W. Most realistic: W is both mediator AND has confounders (Diet→W and T→W→Y) — controlling for W in this case blocks mediated path and introduces bias; need mediation analysis or frontdoor criterion.`,
          `C) W should never be controlled for because body weight is always a collider between exercise and heart disease, and conditioning on it opens a spurious backdoor path`,
          `D) The correct approach is to control for W only when its coefficient in the regression is statistically significant, otherwise omit it from the model`,
        ],
        answer: `B`,
      },
      {
        q: `A researcher conditions on 'hospitalisation status' when studying the effect of a drug on mortality. Why might this create collider bias?`,
        options: [
          `A) Conditioning on hospitalisation is always valid because it ensures comparability — patients in the same hospital are comparable on unmeasured severity confounders`,
          `B) Hospitalisation is a confounder rather than a collider: it causes both drug use and mortality, so failing to condition on it (not conditioning on it) creates bias`,
          `C) Hospitalisation status introduces measurement error because patients who are not hospitalised have missing mortality data, biasing the drug effect estimate downward`,
          `D) Hospitalisation is caused by both illness severity (→mortality) and drug decision (sicker patients more likely to be treated) → hospitalisation is a collider. Conditioning on it opens a spurious path between drug and illness severity. Within hospitalised patients, being on drug is negatively correlated with illness severity (some hospitalised due to drug, not illness). Drug appears more harmful/less beneficial than actually is — exactly the bias in COVID observational studies restricted to hospitalised patients.`,
        ],
        answer: `D`,
      },
      {
        q: `What is the difference between the backdoor criterion and the frontdoor criterion, and when would you use the frontdoor criterion?`,
        options: [
          `A) Backdoor: adjust for common causes of T and Y (requires measuring confounders). Frontdoor: used when can't measure confounders but there's a mediator M such that (1) all causal paths from T to Y go through M, (2) no unblocked backdoor paths T to M, (3) all backdoor paths M to Y blocked by T. When these hold, can identify causal effect even with unmeasured T-Y confounding. Classic example: smoking (T) → tar in lungs (M) → cancer (Y). Rarely applicable but powerful when it is.`,
          `B) The backdoor criterion applies only in DAGs with one confounder; the frontdoor criterion is a generalization for multiple confounders and should always be preferred over the backdoor criterion`,
          `C) The frontdoor criterion is used when there are too many confounders to measure, and it works by conditioning on the outcome to isolate the direct treatment effect`,
          `D) Both criteria are equivalent — the frontdoor criterion is simply a computational shortcut for applying the backdoor criterion when the adjustment set is large`,
        ],
        answer: `A`,
      },
      {
        q: `You run a regression of salary on years of experience and performance rating. You find a negative coefficient on performance rating. Should you be alarmed?`,
        options: [
          `A) No — a negative coefficient on performance is expected because high performers are often newer employees with fewer years of experience, and the coefficient reflects this compositional effect`,
          `B) No — the negative coefficient indicates multicollinearity between experience and performance, which inflates standard errors but does not bias the individual coefficients`,
          `C) Yes — sign of collider bias. Plausible DAG: experience → salary, performance → salary (both cause salary which is a collider). Conditioning on salary (or job level proxy) opens spurious negative path between experience and performance within fixed salary band. Alternatively employment is a collider of performance and tenure. Negative coefficient on performance is an artifact of conditioning on a collider, not evidence high performers earn less.`,
          `D) Yes — the negative coefficient signals severe omitted variable bias from an unmeasured confounder; the fix is to add more control variables until the coefficient becomes positive`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Which variables you control for is a causal decision, not a statistical one — the regression cannot tell you whether your conditioning set was right, only what coefficient it produces given that set.`,
    recap: [
      `**DAGs = explicit structure:** nodes are variables, arrows are direct causal claims.`,
      `**Confounder** (Smoking → Coffee, Smoking → Cancer): backdoor path — must block by conditioning.`,
      `**Mediator** (T → M → Y): conditioning blocks the path you want → underestimates total effect.`,
      `**Collider** (A → C ← B): conditioning OPENS a spurious path that was never there (e.g. hospitalisation).`,
      `**Backdoor criterion:** find Z blocking all backdoor paths, no frontdoor paths, no descendants of T.`,
      `**"Control for everything" is wrong** — it systematically introduces collider bias while claiming to remove confounding.`,
      `**Diagnostic:** a control that shifts the estimate >50% is either a real confounder (good) or a collider (bad) — draw the DAG.`,
    ],
    figures: {
      confounddag: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <defs><marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">CONFOUNDER: block it (condition on Z)</text>
  <circle cx="90" cy="30" r="13" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="90" y="34" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Z</text>
  <circle cx="40" cy="72" r="13" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="40" y="76" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">T</text>
  <circle cx="140" cy="72" r="13" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="140" y="76" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Y</text>
  <path d="M80,40 L50,60" stroke="var(--ink-low)" stroke-width="1.4" marker-end="url(#ah)"/>
  <path d="M100,40 L130,60" stroke="var(--ink-low)" stroke-width="1.4" marker-end="url(#ah)"/>
  <path d="M54,72 L125,72" stroke="var(--ink-ghost)" stroke-width="1.4" stroke-dasharray="4 3" marker-end="url(#ah)"/>
  <text x="90" y="68" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">effect of interest</text>
  <line x1="188" y1="20" x2="188" y2="110" stroke="var(--rim)"/>
  <text x="205" y="12" fill="var(--ink-low)" font-size="7.5">COLLIDER: do NOT condition (opens spurious A—B)</text>
  <circle cx="235" cy="34" r="13" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="235" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">A</text>
  <circle cx="335" cy="34" r="13" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="335" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">B</text>
  <circle cx="285" cy="90" r="14" fill="none" stroke="#ef4444"/>
  <text x="285" y="94" text-anchor="middle" fill="#ef4444" font-size="8.5" font-weight="700">C</text>
  <path d="M245,45 L275,78" stroke="var(--ink-low)" stroke-width="1.4" marker-end="url(#ah)"/>
  <path d="M325,45 L295,78" stroke="var(--ink-low)" stroke-width="1.4" marker-end="url(#ah)"/>
  <path d="M250,30 L320,30" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="3 3"/>
  <text x="285" y="24" text-anchor="middle" fill="#ef4444" font-size="6.5">spurious if you condition on C</text>
</svg>`,
    },
  },
  {
    id: 'rct_design',
    title: 'RCT Design',
    subtitle: 'Randomisation, SUTVA, Intent-to-Treat, treatment effect heterogeneity',
    difficulty: 'intermediate',
    estimatedMin: 32,
    tags: ['RCT', 'randomised controlled trial', 'A/B test', 'ITT'],
    summary: `An e-commerce company wants to test a new checkout flow. They split users 50/50: treatment sees the new flow, control sees the old one. After 2 weeks, conversion rate in treatment: 4.8%, control: 4.3%. The 0.5% lift is statistically significant (p = 0.02). Do they ship it?

The RCT is the gold standard because randomization creates balance on all confounders — observed and unobserved. If assignment is truly random, treatment and control groups are identical in expectation across every dimension: age, income, device type, time of day, past behavior. The only systematic difference is the treatment. Any observed outcome difference is attributable to the treatment. This is what separates an RCT from every observational method — it does not require measuring the right confounders because the randomization makes confounders irrelevant by construction.

Design choices matter before you randomize. Unit of randomization: user-level gives each user a consistent experience and prevents within-user contamination; session-level gives more power but the same user can see both variants; page-level has the most power and highest contamination risk. Stratification by key covariates (device, geography) ensures balance in smaller samples and improves statistical power. Block randomization within strata ensures equal assignment counts. Sample size: run a power analysis before starting. Power = P(reject null | true effect exists). At 80% power and α = 0.05, calculate the minimum sample size to detect the smallest effect that matters to the business.

Interference still threatens the estimate even after correct randomization. If users share carts, a friend who sees the new checkout might describe it to another — the control group is indirectly treated. Randomization at the user level does not help if the treatment propagates through the social graph.

What "statistical significance" does not mean: the experiment succeeded. The test succeeded if randomization was valid (no selection bias, no contamination), the primary metric was pre-specified, the run duration matched the planned duration, and the result is practically significant. A p = 0.001 result with a 0.01% effect size that costs $500K to implement is not a success. Significance tells you the estimate is reliably nonzero; it says nothing about whether it is worth acting on.`,
    keyPoints: [
      `**Run a power analysis before starting — calculate the minimum detectable effect at 80% power and α = 0.05.** This tells you the required sample size and experiment duration. Running an underpowered experiment and concluding "no effect" is a false negative that can kill good product ideas. The confidence interval of an underpowered experiment is wide enough to contain the true effect; the null result is not evidence of zero, it is evidence of insufficient sensitivity.`,
      `**Trap: peeking at results and extending the experiment when it looks close.** Deciding to run longer after seeing "almost significant" inflates Type I error from 5% to well above 30% depending on how many times you peek. Use sequential testing (SPRT or always-valid inference) if you need to monitor results during the experiment. Committing to the analysis plan before looking at the data is the only protection against this form of p-hacking.`,
      `**Diagnostic: after the experiment ends, run an AA test — randomly split the control group into two halves and test for a significant difference on your primary metric.** The AA test should show no significant difference. If it does, your randomization has a systematic bias: some feature of the assignment mechanism is creating groups that were not exchangeable before treatment began. Fix the randomization before trusting any AB result from the same infrastructure.`,
    ],
    interactivePrompt: `Before you touch the controls: the company ran the checkout experiment for 2 weeks and found p = 0.02. Name two things that could make this result unreliable despite the significant p-value.`,
    checkQuestions: [
      {
        q: `In your A/B test for a new email feature, 20% of users assigned to treatment never opened the email. You report ITT. What are you estimating, and how would you estimate the effect on those who actually used the feature?`,
        options: [
          `A) ITT estimates the effect on compliers only; to get the population ATE you should exclude non-openers and compare openers to the full control group`,
          `B) ITT estimates effect of being assigned to treatment — includes non-openers (attenuated toward zero). To estimate effect on those who would actually use the feature (CACE/LATE): CACE = ITT / compliance_rate = ITT / 0.80. Uses assignment as instrument for actual feature usage. Monotonicity required: no one in control would use feature if assigned to treatment (trivially true here).`,
          `C) ITT overestimates the true effect because non-openers inflate the treatment group size; divide ITT by the non-compliance rate (0.20) to recover the true ATE`,
          `D) ITT and CACE are equivalent when non-compliance is below 30%; at 20% non-compliance, no adjustment is needed and ITT is the correct estimate of feature effectiveness`,
        ],
        answer: `B`,
      },
      {
        q: `You run a marketplace experiment: treated cities see new pricing tool; control cities do not. No effect on GMV after two weeks. Colleague says 'underpowered'; another says 'SUTVA violation.' How do you diagnose?`,
        options: [
          `A) Run Hausman test: if it rejects exogeneity of city assignment, SUTVA is violated; if it fails to reject, the experiment is underpowered`,
          `B) Check the pre-experiment balance between treated and control cities — large baseline GMV differences indicate SUTVA violation; similar baselines indicate underpowering`,
          `C) Extend the experiment to four weeks: if an effect emerges, the original test was underpowered; if GMV in control cities rises relative to baseline, that confirms SUTVA violation`,
          `D) For underpowering: check pre-specified MDE vs observed confidence interval. If CI is wide and MDE not within it, extend test. For SUTVA: look for evidence control cities behaved differently post-experiment vs baseline — if control-city GMV increased during test (spillover), that's contamination. Additional diagnostic: compare cities geographically closer vs farther from treated cities — stronger contamination for close cities confirms spillover.`,
        ],
        answer: `D`,
      },
      {
        q: `Your A/B test shows statistically significant positive effect on 7-day retention (p=0.02) but you also ran 15 secondary metrics and found significance on 3. How do you interpret this?`,
        options: [
          `A) With 15 metrics at α=0.05, expect 0.75 false positives under null — finding 3 significant is consistent with multiple testing inflation. Key: was 7-day retention pre-registered as primary metric? If yes, p=0.02 is valid; secondaries are exploratory. If no pre-specification, apply Bonferroni correction: α_corrected = 0.05/15 = 0.0033, check if any survive. Always pre-register one primary metric before running test.`,
          `B) Finding 3 out of 15 significant metrics at p=0.05 suggests a real effect because the expected false positive rate is 0.75, and observing 3 is significantly more than the null expectation`,
          `C) The primary metric p=0.02 is valid regardless of secondary metrics because the primary metric was analyzed first; secondary metrics are irrelevant to the primary metric's interpretation`,
          `D) All 4 significant results (1 primary + 3 secondary) are valid because multiple testing corrections only apply when you have no a priori hypotheses, and retention was clearly a hypothesis`,
        ],
        answer: `A`,
      },
      {
        q: `Why does cluster-level randomisation reduce statistical power, and when is it unavoidable?`,
        options: [
          `A) Cluster randomisation reduces power because it requires larger clusters, and the administrative overhead of managing clusters introduces measurement error that inflates variance`,
          `B) Cluster randomisation reduces power because between-cluster variance is higher than within-cluster variance, making it impossible to detect small effects even with many clusters`,
          `C) Cluster randomisation reduces power due to intra-cluster correlation (ICC): DEFF ≈ 1 + (m-1)×ICC. If ICC=0.1 and clusters have 100 users, DEFF≈10.9 → need ~11x more users. Unavoidable when SUTVA requires it: social features (treating one affects friends), marketplace features (supply-demand interact within region), or city-level policies. With few large clusters (e.g., 5 cities), power ≈ zero regardless of user count.`,
          `D) Cluster randomisation does not reduce power if cluster sizes are equal; power reduction only occurs with highly unequal cluster sizes where small clusters dominate the variance`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Randomization eliminates confounding by construction, but SUTVA violations, non-compliance, the wrong unit of randomization, and underpowered designs can each silently invalidate the estimate even when the coin flip was executed correctly.`,
    recap: [
      `**RCT is gold standard:** randomisation balances all confounders — observed AND unobserved — in expectation.`,
      `**Unit of randomisation trade-off:** user (consistent, low contamination) → session → page (most power, most contamination).`,
      `**Power analysis first:** at 80% power, α = 0.05, find sample size for the smallest effect that matters.`,
      `**Interference still bites:** treatment propagating through the social graph re-treats "control".`,
      `**Peeking inflates Type I** from 5% to >30% — use sequential/always-valid testing to monitor.`,
      `**AA test to validate randomisation:** split control in two — a significant difference means the infra is biased.`,
      `**Significance ≠ success:** p = 0.001 with a 0.01% effect costing $500K is not worth shipping.`,
    ],
  },
  {
    id: 'observational_ci',
    title: 'Observational Causal Inference',
    subtitle: 'Propensity score matching, IPW, doubly robust estimators, covariate balance',
    difficulty: 'intermediate',
    estimatedMin: 32,
    tags: ['matching', 'propensity score', 'IPW', 'doubly robust', 'observational studies'],
    summary: `You want to know if a job training program increases earnings. You cannot randomize — people self-select into the program. People who join are more motivated, have higher baseline earnings, and are younger. A simple comparison of treated versus untreated overstates the program's effect because the treated group would have earned more anyway. Observational causal inference tries to recover the treatment effect without randomization, by making treated and control groups comparable using measured covariates.

Matching finds treated units and control units with identical or similar covariate profiles. Match on observed confounders — age, education, income, location — and the matched comparison removes their confounding. Propensity score matching compresses this into one dimension: the propensity score e(X) = P(T=1 | X=x) is a balancing score. Matching on e(X) balances all observed covariates simultaneously (Rosenbaum-Rubin theorem). Estimate e(X) with logistic regression, then match on the estimated scores and verify balance.

Weighting is the continuous analog. Inverse Probability Weighting (IPW) weights each treated unit by 1/e(X) and each control unit by 1/(1−e(X)), creating a pseudo-population where treatment is uncorrelated with covariates. Doubly robust estimators (AIPW) combine regression adjustment with IPW and are consistent if either the outcome model or propensity model is correctly specified — not necessarily both. One wrong model is survivable; both wrong is not.

Common support is the region where both treated and control units exist with nonzero probability. Outside common support, inference requires extrapolation. Trim the sample to the region of common support before analysis and report what was trimmed.

What observational methods cannot do: remove confounding from unmeasured covariates. PSM, IPW, and AIPW are unbiased only if ignorability holds — only if all common causes of treatment and outcome are in X. An unmeasured confounder like motivation biases the estimate regardless of how sophisticated the estimator. No amount of covariate adjustment compensates for a variable you did not measure. The best observational studies acknowledge this explicitly and conduct sensitivity analysis for the residual unmeasured confounding.`,
    keyPoints: [
      `**After propensity score matching, check covariate balance with standardized mean differences (SMD) — SMD < 0.1 for each covariate indicates good balance.** Never report matching results without a balance table. If balance is poor for any covariate, re-specify the propensity score model — add polynomial terms, interactions, or switch to entropy balancing which directly optimizes balance rather than going through a propensity score. Skipping the balance check and assuming matching worked produces a biased estimate with no error message.`,
      `**Trap: matching on post-treatment variables.** If the variable you are matching on was determined after treatment assignment, it can introduce collider bias or block the causal path you want to measure. Match only on pre-treatment covariates. Always verify whether each covariate was determined before or after treatment began before including it in the propensity model.`,
      `**Diagnostic: if common support is very limited — less than 30% overlap between treated and control propensity score distributions — you can only estimate the treatment effect for a narrow subpopulation.** Report this limitation explicitly. The estimate is not ATE for the full population; it is ATE for the overlap population, which may be quite different from the policy target. Extrapolating beyond common support is pure model assumption, not empirical comparison.`,
    ],
    interactivePrompt: `Before you touch the controls: after matching on the propensity score, what is the one check you must run before reporting any results — and what does it tell you if it fails?`,
    checkQuestions: [
      {
        q: `After PSM, you check covariate balance and find SMD=0.35 for age. What does this mean and what do you do?`,
        options: [
          `A) SMD=0.35 is within acceptable range for continuous variables like age — the 0.1 threshold applies only to binary covariates; no action needed`,
          `B) SMD=0.35 >> 0.1 threshold — matching failed to create comparable groups on age. Age is likely a confounder, so remaining imbalance introduces residual confounding bias. Remedies: (1) re-specify propensity model with age², age³ or interactions, (2) use caliper matching with tight caliper (0.01 on propensity scale), (3) add exact matching on age quintiles as hard constraint, (4) switch to entropy balancing or CBPS which directly optimize balance rather than going through propensity score.`,
          `C) SMD=0.35 indicates the propensity model is overfit — reduce the number of covariates in the logistic regression to improve matching quality`,
          `D) SMD=0.35 is a concern but can be addressed by controlling for age in the outcome regression after matching, which will remove residual age imbalance`,
        ],
        answer: `B`,
      },
      {
        q: `You estimate ATE using IPW. 5 control observations have weights above 500 while all others are below 20. What is the problem and fix?`,
        options: [
          `A) The extreme weights indicate data entry errors in the propensity model covariates; the 5 observations should be excluded as outliers before re-estimating the propensity score`,
          `B) Extreme weights arise from propensity model overfitting — retrain the propensity model with fewer features or stronger regularization to bring all weights below 100`,
          `C) The extreme weights suggest the 5 control observations are perfect matches for treated units and should be upweighted; no fix needed as this improves balance`,
          `D) Extreme weights arise when some control units have very small 1-e(X), meaning e(X)≈1 — propensity model predicts these near-certain to be treated. Near-violation of overlap. These few observations dominate the weighted estimate causing high variance. Fixes: (1) stabilized weights (multiply by P(T=0)/(1-e(X))), (2) weight trimming at 99th percentile (small bias, much lower variance), (3) common support trimming (exclude e(X)>0.97 entirely, changes estimand to overlap population), (4) use AIPW where outcome model absorbs burden from extreme propensity scores.`,
        ],
        answer: `D`,
      },
      {
        q: `What does 'doubly robust' mean in the AIPW estimator? If both models are misspecified, is the estimate still valid?`,
        options: [
          `A) AIPW is consistent if EITHER the propensity model OR the outcome model is correctly specified — need only one to be right. The outcome model predictions are the first terms; IPW correction terms subtract out outcome model errors. If outcome model correct → correction terms ≈ zero. If propensity model correct → outcome model errors cancel in expectation. If BOTH wrong → neither protection activates and estimate is biased. Double robustness is safety net for ONE misspecification, not both.`,
          `B) Doubly robust means AIPW requires both models to be correctly specified simultaneously — if either is misspecified, the estimate is biased; the name refers to having two chances to specify models correctly`,
          `C) AIPW is valid even when both models are misspecified because the augmentation term uses non-parametric estimates that do not rely on correct model specification`,
          `D) Doubly robust means AIPW is consistent under any model misspecification as long as the sample size is large enough for the cross-fitting procedure to average out specification errors`,
        ],
        answer: `A`,
      },
      {
        q: `You are studying the effect of a job training program on earnings. Treated individuals self-selected. You find positive earnings effect. A critic says 'there is likely an unmeasured motivation confounder.' How do you respond?`,
        options: [
          `A) The critic's concern is unfounded because PSM controls for all observed confounders including prior earnings, which serves as a proxy for motivation — no sensitivity analysis needed`,
          `B) The critic's concern can be addressed by adding more covariates to the propensity model; motivation is always partially captured by observable characteristics like education and work history`,
          `C) Critic is right to raise this — self-selected participants likely more motivated, and motivation affects earnings independently. Two-part response: (1) argue strength of measured confounders (prior earnings partly reflects motivation, education controls for observable proxies — if well-balanced, residual motivation confounder may be small); (2) conduct sensitivity analysis: compute E-value — minimum association motivation would need with treatment selection AND earnings to fully explain observed effect. If E-value is 3.0 but domain knowledge suggests motivation-earnings ≈ 1.5, estimate is robust. Report E-value alongside main result.`,
          `D) The critic is wrong — self-selection bias only affects estimates when the selection mechanism is unknown; since we know participants self-selected on motivation, we can model this directly in the propensity score`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Observational methods buy you exactly one thing: removal of bias from confounders you measured — no estimator, however sophisticated, removes bias from a variable you did not measure.`,
    recap: [
      `**Goal:** make treated and control comparable using measured covariates — no randomisation available.`,
      `**Propensity score e(X) = P(T=1|X)** is a balancing score — matching on it balances all observed covariates (Rosenbaum-Rubin).`,
      `**IPW:** weight treated by 1/e(X), control by 1/(1−e(X)) → pseudo-population where T ⊥ covariates.`,
      `**Doubly robust (AIPW):** consistent if EITHER the outcome OR the propensity model is right — one wrong is survivable, both is not.`,
      `**Check balance:** SMD < 0.1 per covariate; never report matching without a balance table.`,
      `**Common support:** trim to the overlap region — outside it, inference is pure extrapolation.`,
      `**Hard ceiling:** none of this removes bias from an unmeasured confounder (e.g. motivation) — do sensitivity analysis.`,
    ],
  },
  {
    id: 'iv',
    title: 'Instrumental Variables',
    subtitle: 'Exclusion restriction, weak instruments, 2SLS, LATE',
    difficulty: 'advanced',
    estimatedMin: 30,
    tags: ['IV', 'instrumental variables', '2SLS', 'LATE', 'exclusion restriction'],
    summary: `Does education increase earnings? The confound is ability. Smart people get more education and earn more regardless of education level — so any observed correlation between education and earnings contains both the causal effect of education and a spurious component from ability. You need variation in education that is unrelated to ability. A valid instrument: distance from college. Students born close to a college are more likely to attend (the instrument predicts treatment). But distance from college affects earnings only through education — it does not directly affect a person's earnings potential except by influencing whether they went to college (exclusion restriction). This isolates variation in education driven only by geography, not ability.

[FIGURE: ivdag]

An instrumental variable Z requires three conditions. Relevance: Z is correlated with the treatment T. Distance predicts college attendance — testable with the first-stage F-statistic. Exclusion restriction: Z affects the outcome Y only through T, not through any other path. Distance does not directly affect earnings except by influencing education — this is argued on subject-matter grounds, not verified statistically. Independence: Z is uncorrelated with T-Y confounders. Where you were born was not chosen based on your cognitive ability.

Two-Stage Least Squares (2SLS) operationalizes this. Stage 1: regress T on Z and controls, get fitted values T̂ — the variation in T predicted only by the instrument. Stage 2: regress Y on T̂ instead of T. The first stage extracts only the exogenous variation in T; the second stage estimates the causal effect of that variation on Y.

IV estimates the Local Average Treatment Effect (LATE): the causal effect for compliers — units whose treatment status changes in response to the instrument. Non-compliers (always-takers, never-takers) are excluded. The LATE is not the ATE — it is the treatment effect for a specific subpopulation defined by the instrument.

What this is not: any variable correlated with treatment is a valid instrument. The exclusion restriction is almost never testable. A weak instrument (first-stage F < 10) produces estimates with enormous variance and finite-sample bias toward OLS that defeats the purpose of the IV approach entirely. A good instrument is extremely hard to find — this is why natural experiments are so valuable in applied causal inference.`,
    keyPoints: [
      `**Always report the first-stage F-statistic — F < 10 indicates a weak instrument that biases IV estimates toward OLS.** The Stock-Yogo weak instrument test gives formal critical values. Weak instruments are the most common failure mode in applied IV. An F of 4 means the IV confidence interval is so wide the estimate conveys no actionable information; the bias toward OLS compounds this by making the interval centered in the wrong place.`,
      `**Trap: the exclusion restriction is untestable and can be violated in subtle ways.** For distance-as-instrument: distance might directly affect earnings through local labor market access, independent of education. Always think through every possible path from Z to Y and argue why each either does not exist or is controlled for. Stating the exclusion restriction holds "by assumption" is not a defense — it is a request for the reader to accept an unverified claim.`,
      `**Diagnostic: estimate the effect using IV and compare to OLS.** If IV > OLS, the OLS confounder was downward-biasing the estimate (e.g., ability bias in the education example). If IV < OLS, OLS was upward-biasing. If the estimates have opposite signs, there is a strong confound or a violated exclusion restriction — investigate before publishing. The direction of the OLS-IV gap tells you about the direction of the unmeasured confounding.`,
    ],
    interactivePrompt: `Before you touch the controls: in the distance-to-college example, what makes distance a valid instrument rather than just another control variable — and what would have to be true about distance for the exclusion restriction to fail?`,
    checkQuestions: [
      {
        q: `You want to estimate the causal effect of price increases on demand. Propose a valid instrument and explain how you would test its validity.`,
        options: [
          `A) Use lagged price as the instrument — it is correlated with current price (relevance) and cannot be caused by current demand (temporal precedence ensures exclusion restriction)`,
          `B) Valid instrument: input cost shocks (e.g., oil prices for airline/trucking) — affects prices (relevance) but consumers don't directly change demand in response to oil prices, only to the ticket price they observe. Testing: relevance via first-stage F > 10; exclusion via mechanism argument (does oil price affect demand through channel other than firm's own prices?); over-identification test if multiple instruments; placebo test (regress instrument on lagged demand before any price change — if predicts lagged demand, correlated with demand-side confounder).`,
          `C) Use competitor prices as the instrument — competitor prices are correlated with own prices (relevance) and don't directly affect own-firm demand because consumers only respond to the firm's own posted prices`,
          `D) Use random price variation from A/B pricing experiments as the instrument — experimental assignment is by construction independent of demand, guaranteeing exclusion restriction without any additional testing`,
        ],
        answer: `B`,
      },
      {
        q: `Your IV estimate of effect of education on earnings is 15% per year of schooling, but OLS estimate is 8%. Hausman test rejects exogeneity. Why might IV be higher than OLS?`,
        options: [
          `A) IV is higher because the instrument (college proximity) violates the exclusion restriction — it has a direct positive effect on earnings through local labor market access, inflating the IV estimate`,
          `B) IV is higher because of weak instrument bias — low first-stage F causes 2SLS to overestimate the causal effect; the Hausman rejection confirms this upward bias`,
          `C) IV and OLS should converge with large samples; the 15% vs 8% gap indicates the instrument is invalid and the IV estimate should be discarded in favor of OLS`,
          `D) IV estimates LATE for compliers — people who changed education level in response to the instrument (e.g., attended college because nearby, wouldn't have otherwise). These marginal students — medium-ability people for whom college has high return — may have higher returns than average. High-ability students always attend (never-takers of no-college state); low-ability never attend (always-takers of college state). So compliers are the marginal group with potentially highest returns. IV > OLS suggests returns to education are higher at the margin than the average.`,
        ],
        answer: `D`,
      },
      {
        q: `An economist uses distance to nearest abortion clinic as instrument for abortion rates, studying effect on child outcomes. What are the threats to the exclusion restriction?`,
        options: [
          `A) Exclusion requires distance affects child outcomes ONLY through abortion rates. Violations: (1) geographic sorting — families far from clinics differ in income/religion/healthcare access generally, these affect child outcomes directly; (2) healthcare access generally — distance to abortion clinic correlates with distance to all rural healthcare; (3) urbanicity — distance correlates with rural/urban which predicts outcomes through schools/labor markets/peers. Testing: check if distance predicts other outcomes it shouldn't affect under exclusion (healthcare utilisation unrelated to reproductive health, adult earnings for cohorts before clinics opened).`,
          `B) The main threat is weak instrument bias — distance to clinic may only weakly predict abortion rates, causing the first-stage F to fall below 10 and biasing the IV estimate toward OLS`,
          `C) The exclusion restriction is satisfied as long as distance is measured at the time of pregnancy rather than childhood; time-specific distance measurement eliminates all direct effects on child outcomes`,
          `D) The only exclusion restriction threat is reverse causality — families with children may move closer to clinics after birth, creating a spurious correlation between distance and child outcomes`,
        ],
        answer: `A`,
      },
      {
        q: `What is the difference between LATE and ATE, and why does it matter for policy?`,
        options: [
          `A) LATE and ATE are equivalent when the instrument is strong (F > 10); the distinction only matters with weak instruments where LATE estimates are biased toward the null`,
          `B) LATE estimates the effect for compliers who voluntarily selected into treatment; ATE includes never-takers and always-takers. For policy, LATE is always preferred because it captures the effect for those most likely to respond to the policy intervention`,
          `C) ATE = effect for full population: E[Y(1)-Y(0)]. LATE = effect for compliers only — subset who change treatment status in response to instrument. LATE ≠ ATE unless treatment effect homogeneous. Policy relevance: if job training program evaluated via lottery instrument, LATE estimates effect for lottery-induced participants (marginal enrollers), not always-takers (attend regardless) or never-takers (wouldn't attend even if required). Citing LATE to justify universal mandate is an error — effect on never-takers may be zero or negative if training ineffective for unmotivated participants.`,
          `D) ATE = effect averaged over the full population; LATE = effect only for treated units (ATT). The difference matters for policy when the treatment group is a non-representative subsample of the full population`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `IV trades the ignorability assumption for the exclusion restriction — both untestable — and estimates LATE for compliers only; a weak instrument adds enormous variance and biases the estimate toward OLS, defeating the purpose of the approach.`,
    recap: [
      `**IV isolates variation in T unrelated to the confounder** (education↔ability, instrumented by distance-to-college).`,
      `**Three conditions:** relevance (Z→T, testable via first-stage F), exclusion (Z→Y only through T), independence (Z ⊥ confounders).`,
      `**2SLS:** stage 1 regress T on Z → T̂; stage 2 regress Y on T̂ — uses only exogenous variation in T.`,
      `**IV estimates LATE, not ATE** — effect for compliers whose treatment flips with the instrument.`,
      `**Weak instrument (F < 10):** enormous variance + finite-sample bias toward OLS — defeats the method.`,
      `**Exclusion restriction is almost never testable** — argue every path Z→Y away on subject-matter grounds.`,
      `**Diagnostic:** IV vs OLS gap reveals the direction of the unmeasured confounding.`,
    ],
    figures: {
      ivdag: `<svg viewBox="0 0 360 110" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <defs><marker id="ivh" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">Z affects Y ONLY through T (exclusion), and Z ⊥ U (independence)</text>
  <circle cx="40" cy="62" r="14" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="40" y="66" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Z</text>
  <text x="40" y="88" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">distance</text>
  <circle cx="160" cy="62" r="14" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="160" y="66" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">T</text>
  <text x="160" y="88" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">education</text>
  <circle cx="290" cy="62" r="14" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="290" y="66" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Y</text>
  <text x="290" y="88" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">earnings</text>
  <circle cx="225" cy="24" r="13" fill="none" stroke="#f59e0b"/>
  <text x="225" y="28" text-anchor="middle" fill="#f59e0b" font-size="8.5" font-weight="700">U</text>
  <text x="225" y="10" text-anchor="middle" fill="#f59e0b" font-size="6.5">ability (unobs.)</text>
  <path d="M55,62 L143,62" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#ivh)"/>
  <path d="M175,62 L273,62" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#ivh)"/>
  <path d="M212,33 L170,52" stroke="#f59e0b" stroke-width="1.3" marker-end="url(#ivh)"/>
  <path d="M238,33 L282,50" stroke="#f59e0b" stroke-width="1.3" marker-end="url(#ivh)"/>
  <text x="100" y="55" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">relevance</text>
  <text x="4" y="106" fill="var(--ink-low)" font-size="7.5">2SLS uses only the Z-driven variation in T — the part U cannot touch. Estimates LATE.</text>
</svg>`,
    },
  },
  {
    id: 'did',
    interactiveId: 'parallel_trends_viz',
    title: 'Difference-in-Differences',
    subtitle: 'Parallel trends, event studies, staggered DiD, DiD failures',
    difficulty: 'advanced',
    estimatedMin: 30,
    tags: ['DiD', 'difference-in-differences', 'parallel trends', 'event study', 'staggered DiD'],
    summary: `A city passes a minimum wage law in 2020. You want to know if it reduced employment. Treated group: businesses in the city. Control group: businesses in a neighboring city without the law. Pre-period: 2018–2019. Post-period: 2020–2021. Simple before-after comparison for the treated city would confound the policy effect with COVID-related employment drops that hit both cities. [FIGURE: paralleltrends]

DiD subtracts the control city's change from the treated city's change: (treated post − treated pre) − (control post − control pre). This removes the common time trend, leaving only the differential change that appeared when treatment was administered.

The parallel trends assumption is the key identifying assumption. In the absence of treatment, the treated group's outcomes would have followed the same trend as the control group. This is untestable in the post-period — the treated city's counterfactual employment trend under no policy is never observed. It can be tested in pre-periods: if treated and control trends were parallel in 2017 and 2018, they were likely to remain parallel in 2020 absent the intervention. Non-zero pre-period effects in an event study are evidence against parallel trends.

Two-way fixed effects (TWFE) regression formalizes this: Y_it = α_i + λ_t + β D_it + ε_it. Unit fixed effects absorb permanent group differences; time fixed effects absorb common trends; β is the DiD estimate. This handles multiple periods and multiple treatment groups simultaneously.

Staggered treatment timing: when different units receive treatment at different times, TWFE produces biased estimates if treatment effects are heterogeneous across groups or time. Early-treated units act as implicit controls for later-treated units during periods when both are treated — but the early-treated units' outcomes already include treatment effects. The Callaway-Sant'Anna and Sun-Abraham estimators restrict the control group to not-yet-treated or never-treated units for each treatment cohort, producing unbiased estimates in staggered designs.

What parallel trends is not: a weak assumption that is always satisfied. Parallel trends fails when treatment was assigned based on pre-period trends (units selected for treatment because their outcomes were deteriorating), when confounding trends affect treated and control groups differently, or when the groups are fundamentally different in character. Always plot pre-period trends and test formally with an event study before reporting a DiD estimate.`,
    keyPoints: [
      `**Always plot an event study before reporting the DiD estimate — treatment effect estimated separately for each time period relative to treatment.** The pre-period estimates should be near zero. This is the parallel trends diagnostic. Systematic non-zero pre-period estimates mean the treated and control groups were already diverging before the treatment, and the DiD estimate is confounded by that pre-existing divergence.`,
      `**Trap: using TWFE with staggered treatment timing when treatment effects vary over time or across cohorts.** TWFE produces a weighted average of treatment effects that can be negative even when all individual effects are positive (Goodman-Bacon decomposition). Use Callaway-Sant'Anna for staggered designs — it constructs clean 2×2 DiDs for each treatment cohort using only not-yet-treated or never-treated units as controls.`,
      `**Diagnostic: if your DiD estimate changes substantially when you change the control group or the comparison period, the parallel trends assumption is fragile.** Run placebo tests using outcome variables that should not be affected by the treatment. If there is a significant "effect" on placebo outcomes, something correlated with treatment is also driving the outcome — the DiD is picking up a confounded association, not the policy's causal effect.`,
    ],
    interactivePrompt: `Before you touch the controls: in the minimum wage example, what would have to be true about the two cities for the parallel trends assumption to hold — and what is one reason it might fail?`,
    checkQuestions: [
      {
        q: `Your DiD estimate shows minimum wage increase reduced employment by 3%. A critic says the two groups had different pre-trends. How do you respond?`,
        options: [
          `A) Acknowledge the critic's concern and report sensitivity to parallel trends by varying the control group definition; if the -3% estimate is consistent across control group choices, parallel trends is confirmed`,
          `B) Run formal pre-trend test: in TWFE regression, add interactions of treated indicator with each pre-treatment time period. These should be near zero and jointly insignificant under parallel trends. Visualize in event study plot — if pre-treatment coefficients are systematically trending, parallel trends violated and DiD is confounded. If pre-trends diverge: (a) control for county-specific linear time trends (unit × time interactions), (b) use synthetic control to match treated counties' pre-treatment trajectory, (c) triple difference if third dimension available. Report pre-trend test alongside main estimate.`,
          `C) Re-run the DiD with a shorter pre-period window; pre-trend tests based on many pre-periods are overpowered and will always reject parallel trends even when the assumption approximately holds`,
          `D) The -3% estimate is valid if treatment assignment was as-good-as-random conditional on county and time fixed effects; pre-trends are irrelevant once fixed effects are included in the TWFE regression`,
        ],
        answer: `B`,
      },
      {
        q: `You are evaluating a product feature rolled out to user cohorts in January, March, and May. You plan TWFE DiD with January as treatment group and March/May as controls. Why is this problematic?`,
        options: [
          `A) TWFE requires a never-treated control group; since March and May cohorts are eventually treated, the design violates TWFE assumptions and no valid DiD estimate exists for staggered rollouts`,
          `B) The January cohort is too small to serve as the treatment group; DiD requires balanced treatment and control group sizes for the TWFE estimator to produce unbiased estimates`,
          `C) Using January as treatment requires a pre-period before January; without pre-treatment data, the parallel trends assumption cannot be tested and the DiD estimate is unreliable`,
          `D) Staggered DiD contamination. March/May cohorts will eventually be treated — using them as controls for January is invalid when they receive treatment. TWFE uses early-treated units as implicit controls for later-treated and vice versa. With heterogeneous treatment effects, this can produce estimates with wrong sign. Fix: use staggered-DiD-robust estimator — Callaway-Sant'Anna (clean 2x2 DiD for each cohort using only not-yet-treated/never-treated controls, then aggregate), or Sun-Abraham within TWFE framework using interactions.`,
        ],
        answer: `D`,
      },
      {
        q: `A policy raising fuel efficiency standards was adopted by California in 2005 and no other state. You want to estimate the effect on vehicle emissions using DiD with other US states as controls. What are the threats to parallel trends?`,
        options: [
          `A) Threats: (1) California is fundamentally different (unique geography, demographics, political environment — other states had systematically different emissions trends unrelated to the policy); (2) anticipation (auto manufacturers and consumers in California started adjusting before 2005 if policy anticipated); (3) simultaneous confounders (California had other environmental regulations around same time). Strengthening: synthetic control matching California pre-2005 on emissions/income/urbanisation; pre-trend check across many years before 2005; placebo test using outcomes policy shouldn't affect (water pollution); restrict controls to geographically similar states.`,
          `B) The main threat is reverse causality — California's worsening emissions problem may have caused the policy adoption, meaning the policy is endogenous to pre-existing emissions trends`,
          `C) There are no threats to parallel trends because the policy was exogenous to other states; California's adoption decision was driven by political factors unrelated to national emissions trajectories`,
          `D) The only threat to parallel trends is the small number of control units (49 states); increasing the number of treated states would eliminate parallel trends concerns by improving statistical power`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `DiD requires parallel trends — untestable post-treatment — and in staggered designs TWFE is biased even when parallel trends holds for every cohort, because early-treated units contaminate the control group for later-treated units.`,
    recap: [
      `**DiD = (treated post − treated pre) − (control post − control pre)** — subtracts out the common time trend.`,
      `**Parallel trends** is the key assumption: absent treatment, treated would track control — untestable post-period.`,
      `**Test it in pre-periods:** event study — pre-treatment coefficients near zero; non-zero = evidence against.`,
      `**TWFE:** Y_it = α_i + λ_t + β D_it — unit FE absorb group differences, time FE absorb common trends, β is the estimate.`,
      `**Staggered timing breaks TWFE** with heterogeneous effects — early-treated act as contaminated controls (Goodman-Bacon).`,
      `**Fix:** Callaway-Sant'Anna / Sun-Abraham — clean 2×2 DiDs using only not-yet-treated or never-treated controls.`,
      `**Placebo test:** a "significant" effect on an unaffected outcome signals confounding, not causation.`,
    ],
    figures: {
      paralleltrends: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">Counterfactual = control's change applied to treated. Gap = DiD estimate.</text>
  <line x1="40" y1="100" x2="340" y2="100" stroke="var(--rim)"/>
  <line x1="40" y1="24" x2="40" y2="100" stroke="var(--rim)"/>
  <line x1="190" y1="24" x2="190" y2="100" stroke="var(--rim)" stroke-dasharray="3 3"/>
  <text x="190" y="20" text-anchor="middle" fill="var(--ink-low)" font-size="7">policy →</text>
  <text x="115" y="114" text-anchor="middle" fill="var(--ink-low)" font-size="7">pre</text>
  <text x="265" y="114" text-anchor="middle" fill="var(--ink-low)" font-size="7">post</text>
  <polyline points="70,72 190,60 310,84" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <text x="316" y="86" fill="var(--prime)" font-size="7" font-weight="700">treated</text>
  <polyline points="70,52 190,40 310,40" fill="none" stroke="var(--ink-mid)" stroke-width="2"/>
  <text x="316" y="42" fill="var(--ink-mid)" font-size="7">control</text>
  <polyline points="190,60 310,48" fill="none" stroke="var(--prime)" stroke-width="1.4" stroke-dasharray="4 3"/>
  <text x="300" y="60" text-anchor="end" fill="var(--ink-low)" font-size="6.5">counterfactual</text>
  <line x1="310" y1="48" x2="310" y2="84" stroke="#ef4444" stroke-width="2"/>
  <text x="4" y="116" fill="#ef4444" font-size="7.5">If pre-period slopes differ, parallel trends fails — the estimate is confounded.</text>
</svg>`,
    },
  },
  {
    id: 'rdd',
    title: 'Regression Discontinuity Design',
    subtitle: 'Sharp and fuzzy RDD, bandwidth selection, manipulation test, local randomisation',
    difficulty: 'advanced',
    estimatedMin: 30,
    tags: ['RDD', 'regression discontinuity', 'bandwidth', 'local randomisation', 'sharp RDD'],
    summary: `A scholarship is awarded to students who score ≥ 70 on an entrance exam. You want to know if the scholarship improves graduation rates. You cannot randomize scholarship receipt — it is rule-based. But students just above and just below 70 are essentially identical in every way except scholarship receipt. A student scoring 69 and one scoring 71 have the same underlying ability, preparation, and motivation — they differ only in their eligibility. Comparing outcomes for students just above and just below the threshold identifies the causal effect of the scholarship without measuring any confounders, because near the cutoff the assignment is locally as-good-as-random.

[FIGURE: rddjump]

RDD exploits a threshold rule in treatment assignment. The running variable (exam score) determines treatment. The key identifying assumption: no other variable changes discontinuously at the cutoff. Any discontinuity in the outcome at the cutoff is caused by the treatment, because nothing else jumped there.

Sharp RDD: exactly at the cutoff, treatment probability jumps from 0 to 1. Local linear regression fits separately on each side of the cutoff within a bandwidth h. The treatment effect equals the difference in the regression line values at the cutoff — the discontinuity. Fuzzy RDD: at the cutoff, treatment probability jumps from p to p′ but not all the way. Use the threshold indicator as an instrument (IV), estimating LATE for compliers at the cutoff.

Bandwidth selection is the central technical tradeoff. Too narrow: too few observations, high variance. Too wide: units far from the cutoff are not locally comparable, high bias. The Calonico-Cattaneo-Titiunik (CCT) data-driven selector minimizes MSE. Report estimates at multiple bandwidths — a result that changes dramatically with bandwidth choice is not robust.

What RDD requires that must always be checked: units cannot precisely manipulate which side of the cutoff they land on. If students can adjust their score to land just above 70, the units just above are not comparable to units just below — they are systematically different in their ability or motivation to game the system. Always test for bunching in the running variable distribution using the McCrary density test. Significant bunching at or just above the cutoff means the local randomization assumption is violated.`,
    keyPoints: [
      `**Always run the McCrary density test before reporting RDD results.** If the density of the running variable has a discontinuity at the cutoff, there is strategic manipulation — units just above the cutoff are not comparable to units just below. This takes two lines of code and catches the most common RDD validity threat. A visible spike in the histogram before the formal test is already a red flag.`,
      `**Trap: using global polynomial regression on the full sample instead of local linear regression near the cutoff.** Higher-order polynomials fit poorly near the boundaries and are sensitive to outliers far from the cutoff. Local linear regression with MSE-optimal bandwidth (rdrobust package) is the standard. The polynomial degree should be chosen by cross-validation, not by visual appeal of the fit.`,
      `**Diagnostic: run the RDD on placebo outcomes — pre-treatment outcomes, or outcomes that should not be affected by the treatment.** If there is a discontinuity in these outcomes at the cutoff, something else is causing a jump at the threshold. Your continuity assumption is violated. Significant covariate jumps at the cutoff (from pre-treatment variables) are the same signal: something other than the treatment is discontinuous there.`,
    ],
    interactivePrompt: `Before you touch the controls: what is the one condition that must hold for the scholarship RDD to be valid — and what would it look like in the data if that condition were violated?`,
    checkQuestions: [
      {
        q: `A university gives scholarships to students who score above 70 on entrance exam. You want to estimate the effect on graduation rates using RDD. What are your main validity checks?`,
        options: [
          `A) Check balance on post-treatment covariates (GPA after enrollment, attendance rate) on both sides of the cutoff — if these are balanced, the RDD estimate is valid`,
          `B) Estimate the RDD with multiple functional forms (linear, quadratic, cubic) and verify that the treatment effect estimate is consistent across all specifications`,
          `C) Four checks: (1) McCrary density test — plot density of scores around 70; spike just above = manipulation, formal test via rddensity package; (2) covariate balance test — regress pre-determined covariates on running variable and test for jump at 70; (3) bandwidth sensitivity — re-estimate at multiple bandwidths (±5, ±10, ±15), check stability; (4) placebo cutoffs — run RDD at false cutoffs (60, 80) where no policy discontinuity; significant effects at placebo cutoffs signal confounding.`,
          `D) Verify that the scholarship amount is large enough to plausibly affect graduation rates, and check that students scoring just below 70 applied for alternative financial aid — if they did, the RDD estimate is the net effect of the scholarship`,
        ],
        answer: `C`,
      },
      {
        q: `You run sharp RDD and get significant effect with bandwidth ±10. With ±5 the effect is larger; with ±15 it shrinks to near zero. What does this pattern tell you?`,
        options: [
          `A) The pattern is expected — narrower bandwidths always produce larger RDD estimates because they use only the most comparable units; the ±15 estimate is less credible because it includes units too far from the cutoff`,
          `B) Non-monotonic sensitivity is a warning sign. Well-identified RDD should be relatively stable across bandwidths. Two explanations: (1) nonlinearity in running variable-outcome relationship (linear extrapolation overestimates with narrow bandwidth — use local quadratic); (2) localised manipulation (units in ±5 successfully manipulated score, including wider band dilutes their influence — check McCrary density in ±5 range). Correct response: plot RDD with CIs at multiple bandwidths, use CCT optimal bandwidth as primary, report and explain sensitivity, investigate ±5 region for manipulation.`,
          `C) The shrinking effect at ±15 confirms the RDD is valid — the treatment effect is local to the cutoff and appropriately weakens as you include units farther away where local randomization is less plausible`,
          `D) The larger effect at ±5 indicates the RDD estimate is being driven by regression to the mean — students who score just above 70 had unusually high scores relative to their true ability, and the scholarship has no real effect`,
        ],
        answer: `B`,
      },
      {
        q: `A government policy provides business subsidies to firms with revenue below £500k. McCrary test shows significant bunching just below £500k. Can you still use RDD?`,
        options: [
          `A) Yes — bunching below £500k confirms firms are aware of the threshold, which means the treatment (subsidy) is salient and its effects are well-identified; the RDD estimate is actually more credible with bunching`,
          `B) Yes — apply a density-weighting correction that downweights observations near the bunching region; this adjusts for the manipulation and recovers an unbiased RDD estimate`,
          `C) Yes — restrict the sample to firms that did not change their revenue year-over-year; firms with stable revenues are not manipulating and provide a valid comparison group for RDD`,
          `D) Bunching just below £500k indicates deliberate manipulation — firms keeping revenue below threshold to retain eligibility. This violates continuity assumption: firms just below are NOT comparable to just above, they made an active choice. Standard RDD invalid near cutoff. Partial remedies: (1) Donut RDD — exclude bunching region (£475k-£500k), estimate using firms in donut (£450k-£475k vs £500k-£525k); (2) Model manipulation explicitly with bunching estimator modeling counterfactual distribution; (3) Acknowledge RDD provides only lower bound if manipulation is asymmetric.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `RDD achieves high local credibility without measuring confounders — but only near the cutoff, only when units did not manipulate their running variable, and only if nothing else changes discontinuously at the same threshold.`,
    recap: [
      `**RDD exploits a threshold rule:** units just above vs just below the cutoff are locally as-good-as-random.`,
      `**Key assumption:** nothing else changes discontinuously at the cutoff — any jump in Y is caused by treatment.`,
      `**Sharp RDD:** treatment probability jumps 0→1 — effect = discontinuity in the local linear fit at the cutoff.`,
      `**Fuzzy RDD:** probability jumps p→p′ — use the threshold indicator as an instrument (LATE at cutoff).`,
      `**Bandwidth trade-off:** narrow = high variance, wide = high bias — CCT selector minimises MSE; report multiple.`,
      `**Manipulation test:** McCrary density — bunching at/just above the cutoff violates local randomisation.`,
      `**Placebo checks:** RDD on pre-treatment outcomes/covariates should show no jump at the cutoff.`,
    ],
    figures: {
      rddjump: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">Effect = vertical jump in the fit AT the cutoff (score = 70)</text>
  <line x1="30" y1="102" x2="345" y2="102" stroke="var(--rim)"/>
  <line x1="30" y1="24" x2="30" y2="102" stroke="var(--rim)"/>
  <line x1="188" y1="24" x2="188" y2="102" stroke="var(--ink-low)" stroke-dasharray="3 3"/>
  <text x="188" y="118" text-anchor="middle" fill="var(--ink-mid)" font-size="7" font-weight="700">cutoff 70</text>
  <text x="100" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="7">below (control)</text>
  <text x="270" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="7">above (treated)</text>
  <text x="18" y="60" text-anchor="middle" fill="var(--ink-low)" font-size="7" transform="rotate(-90 18 60)">grad. rate</text>
  <circle cx="55" cy="90" r="2" fill="var(--ink-low)"/><circle cx="80" cy="85" r="2" fill="var(--ink-low)"/><circle cx="110" cy="82" r="2" fill="var(--ink-low)"/><circle cx="140" cy="78" r="2" fill="var(--ink-low)"/><circle cx="170" cy="74" r="2" fill="var(--ink-low)"/>
  <line x1="50" y1="92" x2="188" y2="70" stroke="var(--ink-mid)" stroke-width="2"/>
  <circle cx="210" cy="52" r="2" fill="var(--prime)"/><circle cx="240" cy="49" r="2" fill="var(--prime)"/><circle cx="270" cy="46" r="2" fill="var(--prime)"/><circle cx="300" cy="43" r="2" fill="var(--prime)"/><circle cx="330" cy="40" r="2" fill="var(--prime)"/>
  <line x1="188" y1="52" x2="335" y2="38" stroke="var(--prime)" stroke-width="2"/>
  <line x1="188" y1="70" x2="188" y2="52" stroke="#22c55e" stroke-width="3"/>
  <text x="196" y="64" fill="#22c55e" font-size="7.5" font-weight="700">τ (effect)</text>
</svg>`,
    },
  },
  {
    id: 'uplift_modeling',
    interactiveId: 'uplift_targeting_viz',
    title: 'Uplift Modeling',
    subtitle: 'S-learner, T-learner, X-learner, R-learner — heterogeneous treatment effects and targeting',
    difficulty: 'advanced',
    estimatedMin: 35,
    tags: ['uplift', 'CATE', 'causal ML', 'treatment effect', 'meta-learner'],
    summary: `A marketing team has a $1M budget for promotional emails. They can send to 1M users, but only 200K will benefit from the discount — people who would not have purchased without it. Sending to users who would purchase anyway wastes the discount cost. Sending to users who actively dislike being contacted is counterproductive. A simple propensity-to-purchase model predicts who will buy — but that is not uplift. Uplift is: who changes their behavior because of the treatment?

[FIGURE: upliftquad]

Four user types define the targeting problem. Persuadables will buy with treatment and not without — your target. Sure Things will buy regardless — wasting budget on them yields zero incremental revenue. Lost Causes will not buy regardless. Sleeping Dogs will buy without treatment but not with it — negative uplift, worse than doing nothing. A model maximizing purchase propensity concentrates budget on Sure Things. An uplift model maximizes incremental effect.

Uplift estimation targets τ(x) = E[Y(1) − Y(0) | X = x] — the Conditional Average Treatment Effect (CATE). You cannot observe τ(x) directly because you never observe both Y(1) and Y(0) for the same person. Meta-learners estimate it from RCT data. Two-model (T-learner): fit Y ~ X separately for treated and control, subtract predictions. S-learner: include T as a feature, fit one model. X-learner: imputes individual treatment effects and then builds a CATE model by borrowing strength across groups — better for imbalanced treatment/control splits. Causal forests: non-parametric CATE estimator with valid confidence intervals.

Evaluation: Qini curves rank users by predicted uplift descending. At each percentile of targeted users, compute cumulative incremental outcome versus random targeting. The area under the Qini curve is the AUUC. A holdout A/B test with a no-contact group is required to calibrate Qini offline against actual incremental effect.

What a response model is not: an uplift model. A response model predicts P(purchase) — dominated by Sure Things. An uplift model predicts P(purchase | treatment) − P(purchase | no treatment) — targets Persuadables. These are orthogonal quantities. Deploying a response model as an uplift model wastes marketing budget and misses the actual causal effect of the treatment.`,
    keyPoints: [
      `**Always evaluate uplift models with a holdout A/B test with a no-contact group.** Offline Qini curves measure ranking quality — they do not verify that high-τ̂ users actually have higher treatment effects. Without a holdout, you cannot distinguish Persuadables from Sure Things in the evaluation. The holdout is the only way to confirm the model is targeting causal heterogeneity rather than baseline propensity.`,
      `**Trap: using the T-learner on highly imbalanced treatment/control designs (95% treated, 5% control).** The control model has very little data and its predictions are noisy. Errors from both models compound in the subtraction — variance of τ̂(x) is dominated by noise in the smaller group. Use X-learner or causal forests, which are specifically designed for imbalanced designs and borrow strength across groups.`,
      `**Diagnostic: if your model assigns high uplift to users with high baseline purchase rates — high overlap between uplift deciles and response deciles — the uplift model is collapsing to a response model.** Check the correlation between CATE estimates and baseline propensity. If it exceeds 0.7, the model is not capturing incremental effects. Segment users by baseline propensity quintile and verify that τ̂(x) varies within each quintile before trusting the targeting.`,
    ],
    interactivePrompt: `Before you touch the controls: the marketing team wants to target the top decile of users by predicted purchase probability. Name the two user types that will be disproportionately in that group — and why neither is the right target for a discount campaign.`,
    checkQuestions: [
      {
        q: `Your response model targets customers with highest predicted purchase probability. Why might this be suboptimal?`,
        options: [
          `A) Response model identifies likely purchasers — but "likely to purchase" ≠ "likely to purchase because of treatment." High-baseline customers are often Sure Things (buy regardless of discount — wasted margin). Some may be Do-Not-Disturbs (loyal customers annoyed by discount emails, eventually unsubscribe — treatment backfires). Uplift models estimate τ̂(x) = E[Y(1)-Y(0)|X=x] and target users where incremental purchase probability is highest. Persuadables often mid-propensity users genuinely swayed by offer. At any budget, targeting by τ̂ achieves 2-5x more incremental purchases vs targeting by ŷ.`,
          `B) Response models are suboptimal only when the discount is large (>30%) — for small discounts, predicted purchase probability is a valid proxy for uplift because discount-induced incremental purchases dominate`,
          `C) Response models are suboptimal because they use logistic regression, which is miscalibrated for targeting; switching to a gradient boosting model for the response prediction solves the targeting problem`,
          `D) Response models perform similarly to uplift models in practice; the theoretical distinction between likely purchasers and incremental purchasers rarely translates to meaningful revenue differences in real campaigns`,
        ],
        answer: `A`,
      },
      {
        q: `You have RCT dataset with 100,000 control users and 10,000 treated users. You want to estimate CATE. Which meta-learner and why?`,
        options: [
          `A) S-learner: it uses all 110,000 observations in a single model, minimizing variance from the treatment-control imbalance by pooling data efficiently`,
          `B) T-learner: training separate models for treatment and control ensures treatment effects are not regularized away, which is the primary failure mode with severe imbalance`,
          `C) X-learner for 10:1 imbalance. T-learner problematic: μ̂₁ trained on only 10,000 treated obs → high variance, errors compound in subtraction. X-learner's imputation step (D̃ = Ŷ(1)-Y_observed for control units) borrows from 100,000 control obs to stabilize estimates. Propensity-weighted combination further down-weights noisy treated-side estimate (e(x)≈0.1 everywhere). Watch for: check μ̂₁ fit quality via cross-validated RMSE; verify τ̂₁ sub-model not entirely ignored; validate with Qini on held-out RCT test set.`,
          `D) R-learner: it orthogonalizes against the propensity score (e(x)≈0.1 everywhere), which eliminates the variance problem from imbalance without discarding the 10,000 treated observations`,
        ],
        answer: `C`,
      },
      {
        q: `After training X-learner for marketing targeting, how would you evaluate whether CATE estimates are actually measuring causal heterogeneity vs spurious correlation?`,
        options: [
          `A) Compute feature importance and verify that the top features driving τ̂(x) are the same as those driving the baseline outcome model — consistency between τ̂ and ŷ feature importance confirms causal heterogeneity`,
          `B) Four-part: (1) Qini/AUUC on held-out RCT — train X-learner on train, rank test set by τ̂(x), plot uplift curve (should rise steeply in high-τ̂ group, flatten/negative in low-τ̂ group); (2) Subgroup lift verification — for top/bottom decile by τ̂, estimate actual ITEs within each decile using holdout RCT; (3) Plausibility check — features driving τ̂ should make domain sense; (4) Post-deployment holdout — deploy to 90%, keep 10% random holdout, compare targeted-by-uplift vs random groups in holdout.`,
          `C) Cross-validate the X-learner using standard k-fold CV and report RMSE on held-out folds — low RMSE confirms the model is capturing real causal heterogeneity rather than noise`,
          `D) Compare X-learner CATE estimates to T-learner CATE estimates — if both models agree on which users have high vs low uplift, the estimates reflect true causal heterogeneity rather than model-specific artifacts`,
        ],
        answer: `B`,
      },
      {
        q: `What is the R-learner and why does 'orthogonalisation' matter for CATE estimation?`,
        options: [
          `A) R-learner is a regularized version of T-learner that adds L2 penalties to prevent overfitting; orthogonalisation refers to the penalty ensuring the treatment and control models are orthogonal to each other`,
          `B) R-learner uses random forests for both nuisance and CATE estimation; orthogonalisation refers to the decorrelation of tree splits across the ensemble, which reduces variance in CATE estimates`,
          `C) R-learner trains CATE models on residualized outcomes controlling for propensity score; orthogonalisation refers to projecting the outcome onto the treatment indicator before fitting CATE`,
          `D) R-learner based on Y - m(X) = τ(X)(T - e(X)) + ε. Minimizes loss: Σ[(Yᵢ - m̂(Xᵢ)) - τ(Xᵢ)(Tᵢ - ê(Xᵢ))]². Orthogonalisation matters because of Neyman orthogonality: gradient of loss w.r.t. τ is zero when m and e at true values → first-order errors in estimating m and e do NOT bias CATE estimate. Key failure mode of non-orthogonal approaches: propensity estimation errors propagate into τ̂ via confounding. With cross-fitting (estimating m and e on separate fold), provides semiparametrically efficient, essentially unbiased CATE estimates.`,
        ],
        answer: `D`,
      },
      {
        q: `You estimate CATE using X-learner on observational data (no RCT). A colleague argues the estimates cannot be trusted. Who is right?`,
        options: [
          `A) Colleague is mostly right. CATE from observational data inherits all ATE identification problems plus more: ignorability must hold WITHIN every subgroup defined by X (not just on average); overlap must hold throughout X-space (thin regions with near-zero overlap = pure extrapolation). Defence: (1) argue ignorability from domain knowledge (measured all confounders?); (2) check overlap throughout X-space; (3) sensitivity analysis; (4) validate by running small RCT on subset and comparing observational CATE to RCT CATE within tested subgroups.`,
          `B) The colleague is wrong — X-learner uses propensity weighting which fully adjusts for confounding in observational data; the estimates are as credible as any IPW-based ATE estimate`,
          `C) Both are equally right — observational CATE estimates are neither trustworthy nor untrustworthy; they should always be reported alongside a disclaimer that results may not be causal`,
          `D) The colleague is right only if the observational data lacks overlap; with sufficient overlap (all propensity scores in [0.1, 0.9]), observational CATE estimates from X-learner are unbiased and can be trusted without additional validation`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `A response model finds likely converters; an uplift model finds people who convert because of the treatment — these are orthogonal, and targeting the first group wastes budget on Sure Things and backfires on Sleeping Dogs.`,
    recap: [
      `**Uplift ≠ propensity:** who *changes behaviour because of* the treatment, not who will convert.`,
      `**Four types:** Persuadables (target), Sure Things (waste), Lost Causes (waste), Sleeping Dogs (negative — backfire).`,
      `**Target τ(x) = E[Y(1) − Y(0) | X=x]** (CATE) — never observed directly, estimated from RCT data.`,
      `**Meta-learners:** S-learner (T as feature), T-learner (two models), X-learner (imputes, borrows strength), causal forests (CIs).`,
      `**X-learner for imbalanced splits** (e.g. 95/5) — T-learner's small-group model is noisy and compounds in the subtraction.`,
      `**Evaluate with Qini/AUUC** ranked by predicted uplift — but a no-contact holdout is required to confirm causal targeting.`,
      `**Collapse warning:** corr(τ̂, baseline propensity) > 0.7 means the uplift model has degenerated into a response model.`,
    ],
    figures: {
      upliftquad: `<svg viewBox="0 0 360 122" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">Only Persuadables have positive uplift. Sleeping Dogs are negative.</text>
  <text x="108" y="26" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5" font-weight="700">buys if treated</text>
  <text x="256" y="26" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5" font-weight="700">no buy if treated</text>
  <text x="34" y="55" text-anchor="middle" fill="var(--ink-mid)" font-size="7" transform="rotate(-90 34 55)">no buy if ctrl</text>
  <text x="34" y="100" text-anchor="middle" fill="var(--ink-mid)" font-size="7" transform="rotate(-90 34 100)">buys if ctrl</text>
  <rect x="44" y="32" width="128" height="42" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="108" y="50" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Persuadables</text>
  <text x="108" y="63" text-anchor="middle" fill="#22c55e" font-size="7">TARGET · uplift +</text>
  <rect x="184" y="32" width="128" height="42" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="248" y="50" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Lost Causes</text>
  <text x="248" y="63" text-anchor="middle" fill="var(--ink-low)" font-size="7">waste · uplift 0</text>
  <rect x="44" y="78" width="128" height="42" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="108" y="96" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Sure Things</text>
  <text x="108" y="109" text-anchor="middle" fill="var(--ink-low)" font-size="7">waste · uplift 0</text>
  <rect x="184" y="78" width="128" height="42" rx="5" fill="none" stroke="#ef4444"/>
  <text x="248" y="96" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Sleeping Dogs</text>
  <text x="248" y="109" text-anchor="middle" fill="#ef4444" font-size="7">backfire · uplift −</text>
</svg>`,
    },
  },
  {
    id: 'mediation',
    title: 'Mediation Analysis',
    subtitle: 'Direct vs indirect effects, NDE/NIE decomposition, sequential ignorability',
    difficulty: 'advanced',
    estimatedMin: 30,
    tags: ['mediation', 'indirect effects', 'NDE', 'NIE', 'causal path analysis'],
    summary: `Job training increases earnings. How much of the effect is direct — training improves skills and directly raises wages — versus indirect — training leads to employment, which raises earnings? This is a mediation question: decomposing the total causal effect into the portion that flows through a mediator (employment) versus the direct path. The distinction matters for policy. If employment mediates the effect, job placement services might be as effective as skills training at lower cost. If the effect is direct, the content of the training matters and placement alone is insufficient.

[FIGURE: mediationdag]

Definitions. Total Effect (TE) = Direct Effect (DE) + Indirect Effect (IE). Natural Direct Effect (NDE) = Y(t, M(t′)) − Y(t′, M(t′)): the effect of treatment holding the mediator at the value it would take under control. Natural Indirect Effect (NIE) = Y(t, M(t)) − Y(t, M(t′)): the effect of the mediator shifting from its control-level to its treatment-level value while holding treatment fixed.

Baron-Kenny (classical approach): (1) regress outcome on treatment; (2) regress mediator on treatment; (3) regress outcome on both treatment and mediator. The indirect effect equals the coefficient of treatment on mediator multiplied by the coefficient of mediator on outcome. Widely used and intuitive — but requires no unmeasured confounding of the mediator-outcome relationship, a strong assumption that an RCT does not guarantee. The RCT randomizes treatment, not the mediator.

Counterfactual approach (Imai, Keele, Tingley): Average Causal Mediation Effect (ACME) uses sensitivity analysis to assess robustness to unmeasured mediator-outcome confounding. More rigorous than Baron-Kenny.

What mediation analysis is not: controlling for the mediator in a regression. Controlling for M in a regression estimates the controlled direct effect, not the natural direct effect — and introduces collider bias if the mediator and outcome share an unmeasured common cause. M is a post-treatment variable. Any unmeasured variable that affects both M and Y creates a backdoor path through M that conditioning on M opens rather than closes. Mediation requires a structural model, not just adding an extra covariate to the regression.`,
    keyPoints: [
      `**Draw the full DAG with treatment, mediator, outcome, and all confounders before choosing an identification strategy.** Mediation analysis is only valid if you can block the backdoor paths into the mediator-outcome relationship — which requires specific covariates and assumptions about what was measured. A mediation result without a DAG is a regression coefficient with a mechanistic label, not a causal decomposition.`,
      `**Trap: interpreting mediation results without checking the no-unmeasured-mediator-outcome-confounding assumption.** If there is any unmeasured variable that affects both the mediator and the outcome, Baron-Kenny gives biased direct and indirect effects. Run the Imai-Keele-Tingley sensitivity analysis — it tells you how strong the hidden confounding would need to be to overturn your conclusion. Without it, you are presenting a mechanism decomposition that cannot be defended.`,
      `**Diagnostic: if the sum of your direct and indirect effects does not equal the total effect from a simple treatment-on-outcome regression, check for specification error.** This accounting identity — TE = NDE + NIE — is a basic consistency check on your mediation model. A violation means either the outcome model, the mediator model, or both are misspecified in a way that breaks the decomposition.`,
    ],
    interactivePrompt: `Before you touch the controls: in the job training example, why does an RCT that randomizes training assignment not guarantee valid mediation analysis — what additional assumption does the mediation decomposition require?`,
    checkQuestions: [
      {
        q: `A new recommendation algorithm (T) increases 7-day retention (Y) by 5 percentage points. You suspect mechanism is session length (M). Describe a valid mediation analysis.`,
        options: [
          `A) Run three separate regressions: (1) Y on T, (2) M on T, (3) Y on T and M. If coefficient on T drops in regression 3, session length mediates. Report proportion mediated = (coefficient drop / total effect). No additional assumptions required since the experiment was randomized.`,
          `B) Mediation is not identifiable in this setting because session length and retention are measured simultaneously — reverse causation between M and Y prevents any valid mediation decomposition without additional instrumental variable assumptions`,
          `C) Steps: (1) confirm total effect (5pp given); (2) estimate T→M: compare session length between treatment and control; (3) estimate NDE and NIE using mediation package with bootstrap CIs. Assumptions: (1) RCT guarantees T ignorability; (2) Sequential ignorability for M: no variable affects both session length AND retention independently of T (mediator-outcome confounder is still possible even in RCT). Failure modes: (1) session length could be a collider (check DAG); (2) non-linear mediation (use non-parametric VanderWeele approach); (3) reverse causation (does retention affect session length?).`,
          `D) Use the frontdoor criterion: since session length is on the causal path from algorithm to retention, adjust for session length to isolate the indirect effect without requiring sequential ignorability`,
        ],
        answer: `C`,
      },
      {
        q: `You control for a variable M in a regression of Y on T, and the coefficient on T drops from 0.4 to 0.1. Your colleague concludes '80% of the effect of T on Y is mediated by M.' What questions would you ask?`,
        options: [
          `A) Ask whether the sample size is sufficient — the 0.3 drop in coefficient is meaningless without a confidence interval; if the standard error on the indirect effect is large, the mediation conclusion is unreliable`,
          `B) Four questions: (1) Is M actually a mediator (T→M→Y) or a confounder (M→T and M→Y)? If confounder, the coefficient drop reflects confounding removal, not mediation; (2) Does M satisfy sequential ignorability? Unmeasured variables affecting both M and Y? If yes, NDE/NIE estimates have residual bias; (3) Is M a collider or descendant of T and a confounder of M-Y? If collider, conditioning opens spurious path; (4) Is linear model appropriate? Baron-Kenny assumes linear additive effects — if T×M interaction exists, use VanderWeele interaction decomposition.`,
          `C) Ask only whether M was measured before or after T — if M was measured post-treatment, mediation is plausible; if pre-treatment, M is a confounder and the mediation interpretation is wrong`,
          `D) Ask whether T causes M — if T has a statistically significant effect on M in a separate regression, the mediation interpretation is valid and no further questions about M's causal role are needed`,
        ],
        answer: `B`,
      },
      {
        q: `Your treatment T was assigned by a clean randomized experiment. Why can the mediation decomposition (NDE/NIE) through mediator M still be biased?`,
        options: [
          `A) Randomization guarantees ignorability of T but not of M — an unmeasured mediator-outcome confounder survives randomization and biases the NDE and NIE.`,
          `B) It cannot be biased: randomizing T automatically makes the NDE and NIE unbiased, so no further assumption about M is required.`,
          `C) The mediator is measured post-treatment, so reverse causation between M and Y always breaks the decomposition regardless of the design used.`,
          `D) RCTs recover only average effects, and mediation needs individual-level counterfactuals that are fundamentally unidentifiable in any study.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Mediation requires a stronger assumption than total effect estimation — an RCT guarantees T-ignorability but not M-ignorability, and every mediation result needs sensitivity analysis for unmeasured mediator-outcome confounding.`,
    recap: [
      `**Mediation decomposes TE = DE + IE:** how much flows through a mediator (employment) vs directly.`,
      `**NDE = Y(t, M(t′)) − Y(t′, M(t′))** — treatment effect holding the mediator at its control value.`,
      `**NIE = Y(t, M(t)) − Y(t, M(t′))** — effect of shifting the mediator from control to treatment level.`,
      `**Baron-Kenny (3 regressions):** intuitive but assumes no unmeasured mediator-outcome confounding — an RCT does NOT guarantee this.`,
      `**RCT randomises T, not M:** a mediator-outcome confounder survives randomisation.`,
      `**Controlling for M ≠ mediation** — gives the controlled direct effect and opens collider bias if M and Y share a hidden cause.`,
      `**Always run Imai-Keele-Tingley sensitivity analysis** (ACME) for unmeasured M-Y confounding.`,
    ],
    figures: {
      mediationdag: `<svg viewBox="0 0 360 108" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <defs><marker id="mh" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">Total = Direct (T→Y) + Indirect (T→M→Y)</text>
  <circle cx="180" cy="30" r="14" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="180" y="34" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">M</text>
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">employment</text>
  <circle cx="55" cy="78" r="14" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="55" y="82" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">T</text>
  <text x="55" y="102" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">training</text>
  <circle cx="305" cy="78" r="14" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="305" y="82" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Y</text>
  <text x="305" y="102" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">earnings</text>
  <path d="M68,68 L167,40" stroke="var(--prime)" stroke-width="1.5" marker-end="url(#mh)"/>
  <path d="M193,40 L292,68" stroke="var(--prime)" stroke-width="1.5" marker-end="url(#mh)"/>
  <path d="M69,80 L290,80" stroke="var(--ink-mid)" stroke-width="1.5" marker-end="url(#mh)"/>
  <text x="180" y="93" text-anchor="middle" fill="var(--ink-mid)" font-size="7">NDE (direct)</text>
  <text x="112" y="50" text-anchor="middle" fill="var(--prime)" font-size="7">NIE (indirect)</text>
  <circle cx="240" cy="50" r="11" fill="none" stroke="#f59e0b" stroke-dasharray="2 2"/>
  <text x="240" y="53" text-anchor="middle" fill="#f59e0b" font-size="7" font-weight="700">U</text>
  <path d="M232,42 L200,36" stroke="#f59e0b" stroke-width="1.1" marker-end="url(#mh)"/>
  <path d="M247,58 L296,68" stroke="#f59e0b" stroke-width="1.1" marker-end="url(#mh)"/>
  <text x="4" y="105" fill="#f59e0b" font-size="7">RCT randomises T, not M — a hidden M–Y confounder U survives.</text>
</svg>`,
    },
  },
  {
    id: 'sensitivity_analysis',
    title: 'Sensitivity Analysis for Causal Claims',
    subtitle: 'E-values, Rosenbaum bounds, placebo tests, falsification design',
    difficulty: 'advanced',
    estimatedMin: 30,
    tags: ['sensitivity analysis', 'E-value', 'Rosenbaum bounds', 'placebo test', 'robustness'],
    summary: `You have estimated that a job training program increases earnings by $3,000/year using a matching estimator. Your result assumes no unmeasured confounders — the unconfoundedness assumption. But what if motivation is unobserved and it causes both training program enrollment and higher earnings? How strong would this unmeasured confounder need to be to reduce your estimated effect to zero? If the answer is "only a moderate confounder," your result is fragile. If the answer is "a confounder stronger than any observed covariate," your result is robust. Sensitivity analysis quantifies this threshold.

Rosenbaum sensitivity analysis is designed for matching studies. It reports the Γ (Gamma) parameter: the maximum ratio by which the odds of treatment can differ between two matched units due to unobserved variables, while still rejecting the null hypothesis. Γ = 1.5 means: even if an unobserved confounder could cause 50% more treatment odds, you would still find a significant effect. Γ = 1.0 means any unobserved confounding overturns the result. Sensitive at Γ = 1.2 is fragile; robust to Γ = 3.0 is credible.

The E-value (VanderWeele and Ding) is more general. It is the minimum strength of association that an unmeasured confounder would need with both treatment and outcome to fully explain away the observed effect. E = RR + √(RR(RR − 1)) where RR is the observed risk ratio. Compare the E-value to the associations of observed covariates — if the E-value is smaller than your strongest observed confounder's association, an unmeasured confounder of that strength could explain your result away.

Placebo tests provide indirect evidence from a different angle. A placebo outcome is one the treatment logically cannot affect — if the analysis shows a significant "effect" on the placebo, something correlated with treatment is also correlated with the outcome, signaling confounding in the main estimate. An event study pre-period check in DiD is a placebo treatment test: pre-treatment coefficients should cluster near zero.

What sensitivity analysis does not do: prove the causal estimate is correct. It tells you how fragile or robust the estimate is to violations of the identifying assumption. A high Γ says the conclusion survives substantial hidden bias — this is reassuring but not proof of causal validity. It is a communication tool that makes the credibility of the claim explicit, not a proof.`,
    keyPoints: [
      `**Always report an E-value or Rosenbaum Γ alongside any observational causal estimate.** Without it, readers have no way to assess the credibility of the causal claim. This is becoming a standard requirement in top journals and should be standard in internal data science reports. Compare the E-value against the observed associations of covariates you already control for — if it is smaller than any of those, the residual confounding threat is concrete, not hypothetical.`,
      `**Trap: running multiple sensitivity analyses and reporting only the one with the highest Γ.** Pre-specify your sensitivity analysis approach before seeing results. Sensitivity analysis p-hacking is less common than outcome p-hacking but follows the same logic — choosing the most favorable framing after seeing results. Use the same estimator and assumptions throughout, and report the full range of sensitivity estimates across specification choices.`,
      `**Diagnostic: if your E-value is smaller than the association of any variable in your observed covariate set — for example, E-value = 1.8, but industry sector has RR = 2.5 with outcome — the unmeasured confounder needed to explain away your result is weaker than covariates you are already controlling for.** This is a warning sign of residual confounding. Report it honestly rather than treating the E-value as evidence of robustness when the comparison to observed covariates undermines it.`,
    ],
    interactivePrompt: `Before you touch the controls: if the E-value for your job training result is 2.1, and the strongest observed covariate (prior earnings) has an association of RR = 1.8 with program enrollment and RR = 2.4 with earnings — what does this tell you about the robustness of your causal claim?`,
    checkQuestions: [
      {
        q: `Your matching analysis shows treatment increases survival rates by 30% (RR=1.3). You compute an E-value of 1.9. What does this mean and how do you use it?`,
        options: [
          `A) E-value = 1.9 means the study has 90% power to detect confounders with RR ≥ 1.9; any confounder below this threshold is too weak to explain the observed effect`,
          `B) E-value = 1.9 means the observed RR=1.3 is statistically significant at p<0.05; the E-value is a transformation of the p-value that accounts for multiple testing`,
          `C) E-value = 1.9 means 1.9 additional covariates would need to be added to the matching model before the effect disappears; the E-value counts the number of unmeasured confounders rather than their strength`,
          `D) E-value = 1.9 means for unmeasured confounder to fully explain away RR=1.3, it would need RR ≥ 1.9 with BOTH treatment receipt AND survival simultaneously. To contextualize: compare against known confounders. If most plausible unmeasured (e.g., SES) has known RR≈1.4 with both treatment access and survival, then 1.4 < 1.9 → SES alone can't fully explain result (though can attenuate it). If smoking has RR=2.5 with survival and likely associated with treatment, 2.5 > 1.9 → smoking alone could explain entire effect. E-value converts "might there be confounders?" into answerable question: how strong would a confounder need to be?`,
        ],
        answer: `D`,
      },
      {
        q: `Your DiD estimate shows minimum wage increase reduced employment by 3%. A critic says treated and control counties had different pre-trends. How do you test and respond?`,
        options: [
          `A) Formal pre-trend test: in TWFE regression, add interactions T_i × 1(t = pre-period) for each pre-treatment period. Should be near zero and jointly insignificant. Plot in event study diagram — systematic divergence pre-treatment means parallel trends violated. If pre-trends diverge: (1) add county-specific linear time trends (unit-specific trend extrapolation); (2) synthetic control to match treated counties' exact pre-treatment trajectory; (3) report pre-trend test result honestly. Systematic pre-period decline in treated counties means -3% estimate is biased upward (counties would have declined even without policy).`,
          `B) Respond that parallel trends is untestable by definition — pre-trend tests are a logical fallacy because pre-treatment trend similarity does not imply post-treatment trend similarity; the critic's concern cannot be addressed empirically`,
          `C) Run the DiD with a shorter pre-post window (one quarter instead of one year) — if the effect is consistent across windows, pre-trends do not affect the estimate and the -3% is valid`,
          `D) The critic's concern is invalid if the TWFE regression includes county and time fixed effects — these absorb all permanent group differences and common time trends, making pre-trend testing unnecessary`,
        ],
        answer: `A`,
      },
      {
        q: `You want to test whether IV analysis for effect of college education on earnings (using proximity as instrument) is confounded. Describe two falsification tests.`,
        options: [
          `A) Test 1 — Hausman test: compare OLS and IV estimates; if they differ significantly, proximity is endogenous and the IV estimate is confounded. Test 2 — First-stage F test: if F < 10, proximity is a weak instrument and the IV estimate is biased toward OLS`,
          `B) Test 1 — Overidentification test: add a second instrument (state-level college subsidies) and run Sargan-Hansen test; rejection indicates exclusion violation. Test 2 — Reduced-form placebo: regress earnings directly on proximity without controlling for education; a significant coefficient confirms the exclusion restriction holds`,
          `C) Test 1 — Pre-instrument outcome placebo: run same IV analysis on cohort too old to benefit from nearby colleges at time of schooling decisions. A significant "effect" for older cohorts (couldn't have been affected by proximity) signals proximity is correlated with local labor market conditions affecting earnings directly — exclusion restriction violation. Test 2 — Pre-determined covariate test: regress pre-determined covariates (parents' education, family income before schooling decision) on the instrument. If proximity predicts pre-determined family characteristics, it's not exogenous — correlated with geographic family sorting, creating direct path from proximity to earnings via family human capital.`,
          `D) Test 1 — Geographic heterogeneity test: compare IV estimates in rural vs urban counties; if they differ significantly, proximity is measuring urbanicity rather than college access. Test 2 — Time series placebo: run the IV using college proximity 20 years prior as the instrument; a null result confirms current proximity is the relevant variation`,
        ],
        answer: `C`,
      },
      {
        q: `After reporting a positive causal effect of a product feature on revenue using DiD, a sceptical executive asks: 'How fragile is this result?' How do you answer rigorously?`,
        options: [
          `A) Report the p-value and confidence interval — a p-value below 0.01 and a confidence interval that excludes zero is sufficient evidence that the result is not fragile`,
          `B) Specification robustness / multiverse analysis: (1) bandwidth/window — vary pre-post window (3/6/12 months), report estimates for each; (2) control group definition — different constructions (same geography, similar-sized markets, synthetic control); (3) outcome metric — related but distinct outcomes (revenue per user, transaction count, gross margin) — real effect should appear in mechanistically related outcomes; (4) regression specification — with/without covariates, unit-specific trends, different clustering levels; (5) placebo test summary — distribution of placebo estimates using pre-treatment pseudo-dates, show where main estimate sits (97th percentile → unlikely statistical artefact).`,
          `C) Run a power analysis retrospectively — if the test was adequately powered (>80%), the result is not fragile; underpowered tests produce fragile results, but well-powered tests are robust by construction`,
          `D) Report that the result is not fragile because DiD with two-way fixed effects is robust to all forms of time-invariant confounding by construction; sensitivity analysis is only needed for cross-sectional studies without fixed effects`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Sensitivity analysis does not prove a causal estimate — it reports how much hidden confounding it would take to overturn it, making the fragility or robustness of the claim explicit rather than hidden.`,
    recap: [
      `**Question:** how strong would an unmeasured confounder need to be to overturn the result?`,
      `**Rosenbaum Γ (for matching):** max treatment-odds ratio from hidden variables while still rejecting the null.`,
      `**Γ read:** fragile at Γ = 1.2, credible if robust to Γ = 3.0; Γ = 1.0 means any confounding overturns it.`,
      `**E-value = RR + √(RR(RR−1))** — min association a confounder needs with BOTH T and Y to explain the effect away.`,
      `**Contextualise E-value vs observed covariates** — if smaller than your strongest measured confounder, the threat is concrete.`,
      `**Placebo tests:** a "significant" effect on an outcome the treatment can't affect signals confounding.`,
      `**It does not prove causality** — it makes the fragility/robustness of the claim explicit, not verified.`,
    ],
  },
]
