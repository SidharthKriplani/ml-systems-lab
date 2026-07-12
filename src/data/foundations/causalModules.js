export const CAUSAL_MODULES = [
  {
    id: 'pot_outcomes',
    title: 'Potential Outcomes Framework',
    subtitle: 'Rubin causal model, ATE/ATT, fundamental problem of causal inference',
    difficulty: 'foundational',
    estimatedMin: 29,
    tags: ['causal inference', 'potential outcomes', 'ATE', 'Rubin'],
    summary: `User 47 got the discount email and spent \$100 over the next month. Would they have spent that anyway, without it? You'd need a second version of User 47 who never got the email — and it doesn't exist; you only watch what actually happened. Same gap, reversed, for User 12: no email, spent \$70. You'd need the version of them who did get it, and you don't have that version either. Whichever branch of the world happened for a person is the only branch you ever see.

That missing branch has a name — the counterfactual, the outcome a unit would have had under the treatment it didn't receive. And the fact that it's missing for every unit, always, is the fundamental problem of causal inference: you observe exactly one of two potential outcomes per unit, never both.

Pause here: if the other branch never exists for anyone, how could any experiment ever produce a causal number at all? Hold that question — it resolves once you stop trying to estimate any one person's effect.

[FIGURE: potoutcomes]

Rubin's potential outcomes framework gives this gap symbols: Y_i(1) is unit i's outcome if treated, Y_i(0) if untreated. For User 47, Y_47(1) = \$100 is the branch actually watched — whatever assigned the treatment (here, a random draw into the campaign) decided which branch got realized; Y_47(0) is the missing counterfactual. For User 12 it's reversed: Y_12(0) = \$70 is observed, Y_12(1) is missing. The individual treatment effect, ITE_i = Y_i(1) − Y_i(0), needs both numbers for one person — exactly what the fundamental problem rules out. No dataset, however large, ever gives you one person's ITE.

So estimate the average instead: the Average Treatment Effect, ATE = E[Y_i(1) − Y_i(0)]. Here's why that rescues you. Suppose — a God's-eye view no real dataset gives you, for one paragraph only — you could see both branches for four users: User 47, \$100 treated / \$80 untreated, effect \$20. User 12, \$90 / \$70, effect \$20. User 8, \$60 / \$50, effect \$10. User 90, \$40 / \$30, effect \$10. True ATE = (20+20+10+10)/4 = \$15 — computable only because you were God for a paragraph.

In the real campaign only one column per user survives. Say the actual draw put User 47 and User 8 in treatment, User 12 and User 90 in control. All you can compute is the observed difference in means: mean(\$100, \$60) − mean(\$70, \$30) = \$80 − \$50 = \$30 — double the true \$15. Randomization didn't fail; one draw carries sampling noise like any estimator does. The guarantee is about averaging this estimator over every possible draw: with 4 users split 2-and-2 there are C(4,2) = 6 possible draws, and the same difference-in-means computed under each gives \$55, \$30, \$10, \$20, \$0, and −\$25 — averaging to 90/6 = \$15, exactly the true ATE. One draw is noisy; the estimator is unbiased across draws. That's the entire justification for flipping the coin: not that one experiment nails the number, but that the design makes the noise average out to zero around the truth.

That guarantee needs three assumptions, each of which can break in this campaign. SUTVA (Stable Unit Treatment Value Assumption): treating User 47 doesn't change User 12's outcome. Break it — say User 47 forwards the discount code to User 12 — and User 12's "untreated" \$70 is no longer the baseline, it's contaminated by spillover. Consistency: the outcome observed for a treated unit really is Y_i(1) as defined — a different subject line is a different treatment, not noise around one. Positivity (overlap): every user has some chance of landing in either arm — if users who spent nothing last month are never in the campaign at all, any number reported for them is pure extrapolation, not estimation. A fourth assumption sits underneath those three, under a different name: **ignorability** (also called unconfoundedness, or no unmeasured confounders) — treatment assignment has to be independent of the potential outcomes, at least once you condition on what you've measured. The random draw into the campaign satisfies it by construction, the same way it satisfies positivity; outside a randomized design it means no factor you failed to measure is quietly driving both who got treated and what they would have earned either way. Like the other three, it is a claim about how the world generated the data, not something the same data can certify — testing it would need both Y_i(1) and Y_i(0) for one unit, exactly what the fundamental problem rules out. The best you can do is balance checks, placebo tests, and sensitivity analysis on how strong a hidden confounder would have to be to overturn the result.

Estimand choice is a decision made before the method, not after. ATE averages across all users. ATT — the effect on the treated — averages only over users who actually got the email. CATE is the effect for a slice sharing feature X = x. These are different numbers with different policy implications: using ATT — the effect among users who happened to get the campaign — to justify emailing the entire user base is an estimand error, since the users already reached may respond nothing like the users who never got the chance.

None of this means causal inference is impossible without perfect data. It means every causal number carries assumptions the same data can't verify — SUTVA, consistency, and positivity are claims about how the world generated the data, not properties a p-value certifies. Argue them from domain knowledge, design them away through randomization, or bound them with sensitivity analysis — never assume they hold just because the difference in means came out significant.`,
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
          `A) Yes — the law of large numbers guarantees convergence to the true population mean, so with a large enough sample the observed 20% gap is automatically a consistent, unbiased causal estimate regardless of how exposure was assigned`,
          `B) No — the 20% likely includes a selection bias term: E[Y|T=1] − E[Y|T=0] = ATE + bias. Need an RCT, or an observational strategy satisfying ignorability by measuring what predicts exposure and conversion`,
          `C) Yes — controlling for age and gender in an OLS regression removes all selection bias, since demographic covariates are the only variables known to jointly drive ad exposure and purchase intent in ad-tech pipelines`,
          `D) No — only a randomized controlled trial can ever support a causal claim here; propensity matching, instrumental-variable designs, and even doubly robust estimators are all statistically invalid substitutes no matter how precisely the covariates are measured or how large the sample grows`,
        ],
        answer: `B`,
      },
      {
        q: `A clinical trial shows ATE = +5 points on health scale. A policymaker wants to mandate the drug for everyone. Is ATE the right estimand? What if trial enrolled only volunteers?`,
        options: [
          `A) Yes — ATE is always the correct estimand for population-wide mandates, and volunteer enrollment has no bearing on this because randomization within the trial fixes any selection issue automatically`,
          `B) ATE is only valid when the trial sample perfectly matches the target population in size; otherwise the policymaker should default to using ATC instead of ATE, regardless of who volunteered`,
          `C) Yes — randomization inside the trial guarantees the +5 estimate applies uniformly to every subgroup in the national population, including people who would never have volunteered to enroll`,
          `D) The target for mandating everyone is ATE over the full population, but volunteers may really give ATT — check covariate overlap with the target population and reweight before extrapolating`,
        ],
        answer: `D`,
      },
      {
        q: `You run an A/B test for a new social sharing feature. Control group engagement unexpectedly increased. Select the two statements that correctly explain what is happening and how to fix it.`,
        options: [
          `A) This is a SUTVA violation from interference between units — treated users share posts that surface in control users' feeds, inflating control's Y_i(0) above the true baseline and making the naive estimate understate the real effect`,
          `B) The fix is cluster-based randomization — assign whole friend groups or geographic regions to one arm so spillover from treated to control users is contained within a cluster rather than crossing arms`,
          `C) This is a novelty effect — treated users generate more content out of initial excitement, which mechanically lifts the platform-wide average and has nothing to do with the control group's own measured behavior`,
          `D) This is regression to the mean — the control group happened to start from an unusually low baseline before the test began, and the rise is simply reversion toward its long-run average engagement level`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why can the ignorability assumption never be tested from data? What is the best you can do to support it?`,
        options: [
          `A) Ignorability can be fully confirmed with a balance test on observed covariates — once every measured variable is balanced between arms, that guarantees no unmeasured confounder remains either, regardless of how the assignment mechanism actually worked`,
          `B) Ignorability is untestable because it is never possible to specify a correct propensity model, but adding enough covariates to that model eventually forces the assumption to hold by construction anyway`,
          `C) Testing it needs both Y(0) and Y(1) for the same unit, exactly what the Fundamental Problem rules out. Best support: balance checks, placebo tests, sensitivity analysis on hidden-confounder strength`,
          `D) Ignorability cannot be tested because all observational data is inherently biased, so the only defensible response is to discard observational analysis entirely and require an RCT in every single case`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Causal inference is a missing data problem: for every unit you observe one potential outcome and must assume something about the other — and those assumptions are unverifiable from the same data you used to estimate the effect.`,
    recap: [
      `**The fundamental problem of causal inference:** for each unit you observe only one of Y_i(1) (outcome if treated) and Y_i(0) (if untreated) — the other is the *counterfactual* and permanently missing. Causal inference is at heart a missing-data problem.`,
      `**ATE = E[Y_i(1) − Y_i(0)] is estimable even though the individual effect (ITE) is not:** you never get Y(1)−Y(0) for one person, but a design that makes the missing outcome recoverable *in expectation* (randomization) lets you estimate the average across units.`,
      `**Three identification assumptions make it work:** SUTVA (no spillover — one unit's treatment doesn't change another's outcome), consistency (the observed outcome for a treated unit *is* Y_i(1)), and positivity/overlap (every unit has nonzero probability of being in either arm, or you're extrapolating).`,
      `**Pick the estimand *first*, before choosing a method:** ATE (all units), ATT (the treated), CATE (units with X=x) are different quantities with different identification assumptions and different policy implications — a first decision, not an afterthought.`,
      `**Classic estimand error:** using the ATT — the effect among the users who *happened to receive* the treatment — to justify a *universal* rollout, when that already-reached group may respond nothing like the users who never got the chance.`,
      `**SUTVA breaks on network effects:** treating 10% of a social network and comparing to untreated users *underestimates* the effect, because untreated users are indirectly affected by their treated connections — their Y_i(0) is spillover-contaminated, not the true baseline.`,
      `**Ignorability can never be tested from the same data used to estimate the effect** (that would need both potential outcomes) — argue it from domain knowledge, embed it via randomization, or bound it with sensitivity analysis.`,
    ],
    figures: {
      potoutcomes: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="4" y="12" fill="var(--ink-low)" font-size="7.5">You observe ONE cell per unit — the off-diagonal is forever missing</text>
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
    subtitle: 'Directed acyclic graphs, backdoor criterion, collider bias',
    difficulty: 'intermediate',
    estimatedMin: 32,
    tags: ['DAG', 'confounding', 'collider bias'],
    summary: `You observe that coffee drinkers have higher lung cancer rates. Should coffee drinkers stop? Probably not — because smoking confounds the relationship. Smokers both drink more coffee and have higher cancer rates. The Coffee → Cancer association is a spurious path through the confounder Smoking. Without a way to represent this structure, you would add "coffee drinker" as a control variable in a cancer regression and be satisfied. But whether that controls for the right thing, blocks the wrong thing, or introduces new bias depends entirely on the causal structure — and the regression output will not tell you which case you are in.

[FIGURE: confounddag]

Directed Acyclic Graphs (DAGs) make that structure explicit. Nodes are variables. Directed arrows are direct causal claims. Three path types determine which variables to condition on. A confounding path runs Smoking → Coffee AND Smoking → Cancer: the backdoor path Treatment ← Confounder → Outcome. It must be blocked — condition on the confounder. A mediation path runs Treatment → Mediator → Outcome: the indirect causal channel. Conditioning on the mediator blocks the path you want to measure, isolating only the direct effect. Example: suppose a training program (T) raises quiz scores (Y) partly by increasing study hours (M) — a total effect of +12 points made up of a +9-point direct effect and a +3-point effect that runs through study hours. Control for study hours and the regression recovers only the +9-point direct effect, silently dropping the +3 points that ran through the mediator — a 25% understatement of the true total effect. That understatement only happens when the direct and mediated pieces share the same sign, as they do here; if they have opposite signs (suppression — say the program hurts scores directly but raises study hours enough to help overall), conditioning on the mediator can overestimate the total effect or flip its sign instead, because you have kept the piece that opposes the total rather than the whole picture. Either way, if the total effect is what you are measuring, leave the mediator out. A collider is caused by both Treatment and Outcome: A → Collider ← B. Conditioning on the collider opens a spurious path between A and B that was never causally present. Classic collider bias: conditioning on hospitalization (collider of disease severity and treatment choice) creates spurious correlation between diseases and treatments within the hospitalized sample.

The backdoor criterion formalizes this. If you can find a set Z that blocks all backdoor paths (confounding paths from Treatment to Outcome) without blocking any frontdoor paths and without containing any descendant of Treatment, you can identify the causal effect by conditioning on Z.

Sometimes you cannot block the backdoor path at all because the confounder is unmeasured. The frontdoor criterion handles that narrower case: if every Treatment → Outcome path routes through a single mediator M, and that mediator is itself unreachable from the unmeasured confounder, you can identify the effect by chaining two adjustments through M instead of one adjustment on the confounder. The canonical case is smoking, tar deposits, and lung cancer: an unmeasured genetic confounder might affect both smoking and cancer directly, so you cannot block that backdoor path with observed data — but if smoking's entire effect on cancer runs through tar deposits in the lungs, and the confounder does not reach tar directly, you can still identify the smoking effect by combining P(tar | smoking) with P(cancer | tar). This requires the mediator to carry the whole treatment effect and to sit outside the confounder's reach — a narrower condition than the backdoor criterion's, which is why frontdoor adjustment is rare in practice but valuable exactly when the confounder cannot be measured.

What this is not: "control for everything." Controlling for a collider creates bias where none existed before. Controlling for a mediator blocks the path you want to measure. Controlling for a post-treatment variable that is a descendant of Treatment can do both. You need the DAG to know which variables to condition on and which to leave out. A "control for everything" strategy without a DAG is a systematic way to introduce collider bias while believing you removed confounding.`,
    keyPoints: [
      `**Draw the DAG before selecting control variables in any regression.** Identify the backdoor paths (confounding) and frontdoor paths (mediation). Control for variables that block backdoor paths. Do not control for mediators or colliders. A 10-minute DAG review prevents hours of debugging spurious results — the regression will run and return a coefficient regardless of whether the conditioning set was correct.`,
      `**Trap: conditioning on a descendant of treatment (post-treatment variable).** A variable caused by the treatment is either a mediator or a collider of treatment and a confounder. Including it as a control blocks the causal path you want (mediator) or opens a spurious path you do not want (collider). Always verify whether each control variable was determined before or after treatment assignment, and trace its arrows in the DAG before including it.`,
      `**Diagnostic: if adding a control variable changes your effect estimate by more than 50%, either you have added a strong confounder (expected, good) or introduced collider bias (bad).** Draw the DAG and determine which case applies. If the variable has arrows coming in from both Treatment and Outcome, it is a collider — removing it from the control set is the correct response, not refining the model further. Worked example: a naive coffee-cancer regression gives a coffee coefficient of 0.40 log-odds; adding smoking as a control drops it to 0.09 log-odds, a (0.40 − 0.09) / 0.40 ≈ 78% shift — consistent with smoking being the confounder that was inflating the naive estimate. Contrast that with adding hospitalisation status to a drug-mortality regression: the drug coefficient swinging from −0.05 to +0.35 log-odds after conditioning on a variable caused by both drug use and outcome severity clears the same "more than 50%" bar, but there it is the collider-bias pattern, not a newly found confounder — the DAG, not the size of the shift alone, tells you which case you are in.`,
    ],
    interactivePrompt: `Before you touch the controls: in the coffee-smoking-cancer example, draw the three nodes and their arrows in your head — then identify which path type each arrow relationship creates and what you should do about it.`,
    checkQuestions: [
      {
        q: `You want to estimate the effect of exercise (T) on heart disease (Y). You have data on body weight (W). Select the two true statements about how to handle W.`,
        options: [
          `A) If W is a confounder — say Diet→W, Diet→Y, and Diet→T all hold — you must control for W to block that backdoor path, otherwise the exercise-heart disease estimate stays biased by diet`,
          `B) If W instead sits on the causal path as a mediator, T→W→Y, then controlling for W blocks the indirect channel and yields only the direct effect — omit W if the total effect is what you actually want`,
          `C) W should never be controlled for in either DAG, because body weight always functions as a collider between exercise and heart disease and conditioning on it opens a spurious backdoor path`,
          `D) The correct approach is to control for W only when its regression coefficient clears statistical significance at the 0.05 level, and to drop it from the model whenever it does not`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `A researcher conditions on 'hospitalisation status' when studying the effect of a drug on mortality. Why might this create collider bias?`,
        options: [
          `A) Conditioning on hospitalisation is always valid because it guarantees comparability — patients admitted to the same hospital are assumed to share identical unmeasured severity confounders purely by construction of the admission process`,
          `B) Hospitalisation actually functions as a confounder rather than a collider here: it causes both drug use and mortality directly, so failing to condition on it is what creates the bias in the first place`,
          `C) Hospitalisation status introduces classic measurement error, since non-hospitalised patients have missing mortality records, which biases the estimated drug effect downward toward zero`,
          `D) Hospitalisation is caused by illness severity and drug decision, making it a collider — conditioning on it opens a spurious negative path, making the drug look more harmful than it is, as in COVID studies restricted to hospitalised patients`,
        ],
        answer: `D`,
      },
      {
        q: `What is the difference between the backdoor criterion and the frontdoor criterion, and when would you use the frontdoor criterion?`,
        options: [
          `A) Backdoor adjusts for common causes of T and Y directly. Frontdoor applies when a mediator M exists where all T→Y paths route through M — smoking→tar→cancer is the classic example, rare but powerful`,
          `B) The backdoor criterion applies only to DAGs containing exactly one confounder, and the frontdoor criterion generalizes it to handle multiple confounders at once, so frontdoor should always be the preferred safer default choice`,
          `C) The frontdoor criterion is invoked whenever there are simply too many confounders to feasibly measure in a study, and it works by conditioning directly on the outcome variable itself to isolate the treatment's direct effect`,
          `D) The two criteria are mathematically equivalent to one another — frontdoor is nothing more than a computational shortcut for applying ordinary backdoor adjustment once the required adjustment set becomes too large to estimate reliably`,
        ],
        answer: `A`,
      },
      {
        q: `A researcher wants to know whether years of experience affects performance rating, so they regress performance rating on experience while using salary as a control variable. They find a strong negative coefficient on experience — more experienced employees appear to have systematically lower performance ratings once salary is held fixed. Should they trust this?`,
        options: [
          `A) Yes — the model is well-specified, since including any variable correlated with both the predictor and outcome always tightens the estimate`,
          `B) No — salary is a collider here (Experience → Salary ← Performance, since both experience and performance cause salary), so holding salary fixed as a control while relating experience to performance opens a spurious path between them and can manufacture a negative association even if experience and performance are unrelated or genuinely positively related`,
          `C) No — the regression direction is simply backwards; performance should be predicting experience, not the other way around, so the coefficient's sign is meaningless`,
          `D) Yes — the negative coefficient is expected because senior employees face regression to the mean in performance ratings, a statistical artifact unrelated to the choice of controls`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Which variables you control for is a causal decision, not a statistical one — the regression cannot tell you whether your conditioning set was right, only what coefficient it produces given that set.`,
    recap: [
      `**DAGs make causal structure explicit:** nodes are variables, directed arrows are direct causal claims — and which variables you condition on is a *causal* decision the regression output can never tell you, because it returns a coefficient regardless of whether your conditioning set was right.`,
      `**Confounder** (e.g. Smoking → Coffee and Smoking → Cancer): creates a backdoor path Treatment ← Confounder → Outcome that produces a *spurious* association — you must *block* it by conditioning on the confounder.`,
      `**Mediator** (T → M → Y): sits on the causal path you're trying to measure, so conditioning on it *blocks* that path and isolates only the direct effect — this *underestimates* the total effect when the direct and mediated pieces share a sign (the usual case, e.g. the +9/+3-point study-hours example above), but can *overestimate* it or flip its sign under suppression (opposite signs) — either way, the opposite of what you want if the total effect is your target.`,
      `**Collider** (A → C ← B, caused by both): conditioning on it *opens* a spurious path between A and B that was never causally there — e.g. conditioning on hospitalisation (a collider of disease severity and treatment) manufactures correlations within the hospitalised sample.`,
      `**Backdoor criterion:** you identify the effect by conditioning on a set Z that blocks all backdoor (confounding) paths, blocks no frontdoor (mediating) paths, and contains no descendant of the treatment.`,
      `**Frontdoor criterion (narrower, for when the confounder is unmeasured):** if a mediator M carries the *entire* Treatment → Outcome effect and sits outside the confounder's reach, you can identify the effect by chaining P(M | Treatment) with P(Outcome | M) instead of adjusting for the confounder directly — the smoking → tar → cancer case is the canonical example.`,
      `**"Control for everything" is a mistake, not a safe default:** it systematically opens collider bias and blocks mediators while you believe you're removing confounding — you need the DAG to know which variables to include and which to leave out.`,
      `**Diagnostic:** if adding a control shifts the estimate by more than ~50%, it's either a real confounder (good — expected) or a collider you just opened (bad) — draw the DAG to tell which. Arrows coming *into* it from both T and Y = collider, remove it. (See the worked coffee/hospitalisation example above: a genuine ~78% shift toward a smoking confounder looks very different from a sign-flipping collider swing.)`,
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
    summary: `The DAG module showed you how to find the right adjustment set when you're stuck with data you didn't get to design — draw the graph, block backdoor paths, leave colliders and mediators alone. Recall from Potential Outcomes: there's a design that skips needing an adjustment set at all. Randomization balances every confounder between arms — the ones in your DAG and the ones you never thought to draw — because it doesn't rely on you specifying anything correctly. This module is about building that design well, because "we randomized" is necessary and nowhere near sufficient.

An e-commerce company tests a new checkout flow: half of users see it, half see the old one. After two weeks, conversion is 4.8% in the new flow versus 4.3% in the old — significant at p = 0.02. Do they ship it?

If assignment was truly random — a coin flip, not a business rule dressed up as one — treatment and control are identical in expectation on every dimension: age, income, device, time of day, past behavior, and confounders nobody measured. Pause here: if a fair coin decided each user's arm, what's the chance the groups differ systematically on some variable you didn't think to record? Vanishingly small, and it shrinks as the sample grows — a guarantee no DAG-derived adjustment set can offer, since a DAG only protects against confounders you thought to draw. With randomization, the only systematic difference between arms is the treatment itself.

Getting there takes real decisions before anything is flipped. Unit of randomization: user-level gives one consistent experience with no within-user contamination; session-level gains power but the same user can land in both arms; page-level gains the most power at the highest contamination risk. Sometimes none of those units are isolated enough — when SUTVA forces it (a feature that propagates through a social graph, a marketplace, a city-level rollout), you randomize whole clusters (friend groups, cities) instead of individuals. That buys interference protection at a real, computable power cost: the design effect DEFF≈1+(m−1)×ICC tells you how much, where m is the average cluster size and ICC (intraclass correlation) is how similar outcomes are within the same cluster versus across clusters — at ICC=0.1 and m=100, DEFF≈10.9, meaning you need roughly 11× the individual-level sample size to hold power constant. Stratifying by known covariates (device, geography) before randomizing balances small samples chance alone might leave lopsided; block randomization within each stratum keeps counts even. Sample size isn't a number to guess afterward — run a power analysis first. Power is the probability of detecting a true effect if one exists, at a significance level α — a false-positive tolerance fixed by the experimenter, not something the data hands you. At 80% power and α = 0.05, compute the minimum sample size to detect the smallest lift that matters. That minimum scales roughly as 1/MDE²: halving the detectable effect roughly quadruples the users needed — why hunting a 0.1-point lift takes months and a 5-point lift takes days.

Correct randomization still doesn't protect against interference. If users share carts with friends, a treated user describing the new checkout to an untreated one changes that person's behavior even though they're assigned to control. The coin flip was fair, but propagation through the social graph means "control" is no longer the clean baseline promised — the same SUTVA violation that broke naive estimates in Potential Outcomes, breaking a properly randomized one too.

Randomization guarantees balance on assignment, not on what people do with it. Assign half of users to the new checkout and some never load it — a stale cache, an ad blocker, a bounce before render. Reversed: some assigned to the old checkout hit a cached copy of the new one and see it anyway — non-compliance can run either direction. Either way you're compared by the group you were assigned to, not the page you actually saw — that's the Intent-to-Treat estimate (ITT), and it's what you actually observe, since compliance can't be forced. ITT understates the effect on people who used the new checkout, diluted by the assigned-but-unexposed. The clean case is one-sided: nobody in control ever crosses into the new flow, only some of treatment fails to load it (monotonicity — no defiers). Concretely: if 80% of treatment actually loaded the new flow and ITT comes out to \$6.40 per user, the effect among compliers — the Complier Average Causal Effect (CACE) — is ITT divided by that compliance rate: CACE = \$6.40 / 0.80 = \$8.00. The \$8.00 is what tells you the redesign itself works; the \$6.40 is what tells you what shipping it to everyone, non-compliers included, will actually move. If control also has crossover, the same idea generalizes to the Wald estimator: divide by the *difference* in take-up between arms instead of the raw 0.80.

None of this is what "statistically significant" certifies. p = 0.02 says the gap is unlikely under no effect — nothing more. That reading only holds if randomization was valid, the primary metric was pre-specified, the run lasted as planned, and the result is worth acting on. That last condition gets harder the more metrics you check: with 15 secondary metrics tested at α = 0.05, chance alone predicts roughly 15 × 0.05 = 0.75 false positives, so finding two or three "significant" secondaries isn't surprising on its own — a Bonferroni correction (dividing α by the number of tests) is the standard fix, and whether the metric driving your headline result was pre-registered as primary, versus fished out after the fact, changes how much weight its p-value deserves. A p = 0.001 result on a 0.01% lift costing \$500K to build isn't a success story — significance means reliably nonzero, not worth building.`,
    keyPoints: [
      `**Run a power analysis before starting — calculate the minimum detectable effect at 80% power and α = 0.05.** This tells you the required sample size and experiment duration. Running an underpowered experiment and concluding "no effect" is a false negative that can kill good product ideas. The confidence interval of an underpowered experiment is wide enough to contain the true effect; the null result is not evidence of zero, it is evidence of insufficient sensitivity.`,
      `**Trap: peeking at results and extending the experiment when it looks close.** Deciding to run longer after seeing "almost significant" inflates Type I error from 5% to well above 30% depending on how many times you peek. Use sequential testing (SPRT or always-valid inference) if you need to monitor results during the experiment. Committing to the analysis plan before looking at the data is the only protection against this form of p-hacking.`,
      `**Cluster-level randomisation costs power in a specific, computable way.** When SUTVA forces you to randomize whole clusters instead of individuals — a social feature, a marketplace, a city-level rollout — the design effect DEFF≈1+(m−1)×ICC tells you the sample-size inflation: m is average cluster size, ICC is how correlated outcomes are within a cluster versus across clusters. At ICC=0.1 and m=100, DEFF≈10.9 — you need roughly 11× the individual-level sample to hold power constant, which is why cluster designs are used only when interference leaves no alternative.`,
      `**Checking many secondary metrics inflates false positives the same way peeking does.** At α=0.05, testing 15 secondary metrics yields roughly 15×0.05=0.75 expected false positives from chance alone, so 2-3 "significant" secondaries isn't automatically a real finding. Apply a Bonferroni correction (α divided by the number of tests) to secondaries, and treat the primary metric's p-value as trustworthy only if it was pre-registered before the experiment ran — a metric fished out after seeing the data doesn't get the same interpretation.`,
      `**Diagnostic: after the experiment ends, run an AA test — randomly split the control group into two halves and test for a significant difference on your primary metric.** The AA test should show no significant difference — but treat that single result the way you'd treat any hypothesis test run at α = 0.05: even with a perfectly unbiased randomization mechanism, one AA test comes up "significant" by chance alone about 5% of the time, so a lone hit is a prompt to investigate, not an automatic diagnosis of bias. Run the check a handful of times, or track it across experiments; only a hit rate well above ~5% means some feature of the assignment mechanism is creating groups that were not exchangeable before treatment began. Fix the randomization before trusting any AB result from the same infrastructure.`,
    ],
    interactivePrompt: `Before you touch the controls: the company ran the checkout experiment for 2 weeks and found p = 0.02. Name two things that could make this result unreliable despite the significant p-value.`,
    checkQuestions: [
      {
        q: `In your A/B test for a new email feature, 20% of users assigned to treatment never opened the email. You report ITT. Select the two true statements about ITT and how to estimate the effect on actual users.`,
        options: [
          `A) ITT estimates the effect of being assigned to treatment, including the 20% who never opened it — so the estimate is mechanically attenuated toward zero relative to the effect among people who actually engaged`,
          `B) CACE/LATE recovers the effect on compliers via CACE = ITT / compliance_rate = ITT / 0.80, treating assignment as an instrument for actual usage, and requires monotonicity — no control user would have used the feature if assigned`,
          `C) ITT estimates the effect on compliers only, so to recover the population ATE you should drop the non-openers entirely and compare only the openers to the full control group`,
          `D) ITT systematically overestimates the true effect because non-openers inflate the treatment arm's sample size, so dividing ITT by the 20% non-compliance rate recovers the unbiased population ATE`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You run a marketplace experiment: treated cities see new pricing tool; control cities do not. No effect on GMV after two weeks. Colleague says 'underpowered'; another says 'SUTVA violation.' How do you diagnose?`,
        options: [
          `A) Run a Hausman test on the city-level panel: rejecting exogeneity of city assignment is read as confirming SUTVA violation, while failing to reject is read as confirming the test was simply underpowered from the start`,
          `B) Compare only the pre-experiment GMV baselines between treated and control cities — a large gap is treated as proof of a SUTVA violation, while similar baselines are treated as proof the whole study is underpowered`,
          `C) Simply extend the run to four weeks: any effect that later emerges confirms underpowering, and any relative rise in control-city GMV during the extension confirms SUTVA on its own, with no further check needed`,
          `D) For underpowering, check the pre-specified MDE against the confidence interval; for SUTVA, check whether control-city GMV rose during the test and whether contamination is stronger for cities closer to treated ones`,
        ],
        answer: `D`,
      },
      {
        q: `Your A/B test shows statistically significant positive effect on 7-day retention (p=0.02) but you also ran 15 secondary metrics and found significance on 3. How do you interpret this?`,
        options: [
          `A) With 15 metrics at α=0.05 you'd expect ~0.75 false positives, so 3 is roughly consistent with multiple-testing inflation — valid if retention was pre-registered, otherwise apply a Bonferroni correction to the secondaries`,
          `B) Finding 3 of 15 metrics significant at p=0.05 is itself evidence of a real underlying effect, since 3 clearly exceeds the roughly 0.75 false positives the null hypothesis alone would predict across all 15 tests combined`,
          `C) The primary metric's p=0.02 is automatically valid no matter what, because it happened to be the first metric analyzed chronologically — the 3 significant secondaries carry no bearing on how to interpret it at all`,
          `D) All four significant results, the primary plus the three secondaries, are equally valid findings, because multiple-testing corrections only ever apply to studies run with absolutely no prior hypotheses at all`,
        ],
        answer: `A`,
      },
      {
        q: `Why does cluster-level randomisation reduce statistical power, and when is it unavoidable?`,
        options: [
          `A) It reduces power mainly because larger clusters require more field staff to manage, and that administrative overhead itself introduces measurement error that inflates the variance of the recorded outcome`,
          `B) It reduces power because between-cluster variance always exceeds within-cluster variance by definition, which makes detecting any small effect mathematically impossible no matter how many clusters you add later`,
          `C) The design effect from ICC, DEFF≈1+(m−1)×ICC, inflates sample size sharply (ICC=0.1, m=100 → DEFF≈10.9); unavoidable whenever SUTVA forces it — social, marketplace, or city-level features with few large clusters`,
          `D) Cluster randomisation only loses power when cluster sizes are unequal, since small clusters then dominate the pooled variance — with perfectly equal-sized clusters there is no power penalty at all in practice`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Randomization eliminates confounding by construction, but SUTVA violations, non-compliance, the wrong unit of randomization, and underpowered designs can each silently invalidate the estimate even when the coin flip was executed correctly.`,
    recap: [
      `**The RCT is the gold standard because randomisation balances *all* confounders — observed AND unobserved — in expectation:** the only systematic difference between arms is the treatment, so it needs no measuring of the right confounders, unlike every observational method.`,
      `**Unit of randomisation is a design trade-off:** user-level gives each user a consistent experience and low contamination; session-level gives more power but the same user can see both variants; page-level has the most power and the highest contamination risk. When even page-level can't contain interference (a social feature, a marketplace, a city rollout), randomize whole clusters instead — at a computable power cost, DEFF≈1+(m−1)×ICC (m = cluster size, ICC = intraclass correlation): ICC=0.1 with m=100 gives DEFF≈10.9, roughly 11× the individual-level sample size needed.`,
      `**Run a power analysis first:** at 80% power and α = 0.05, compute the sample size needed to detect the smallest effect that matters to the business — an underpowered "no effect" is a false negative that can kill a good idea, not evidence of zero.`,
      `**Interference still bites even after correct randomisation:** if treatment propagates through the social graph (a treated friend describes the new checkout to a control user), the "control" group is indirectly treated and the estimate is contaminated.`,
      `**Non-compliance dilutes what you observe — ITT vs. CACE:** you're compared by assignment, not exposure (compliance can't be forced), so the Intent-to-Treat estimate understates the effect on people who actually used it. Under one-sided non-compliance, CACE = ITT / compliance rate (e.g. \$6.40 / 0.80 = \$8.00) recovers the complier effect — the ITT figure is what shipping to everyone will actually move, the CACE figure is what the redesign itself is worth.`,
      `**Peeking inflates Type I error** from 5% to well over 30% depending on how often you look — commit to the analysis plan before seeing data, or use sequential / always-valid testing if you must monitor.`,
      `**Run an AA test to validate the randomisation:** split the control group in two and test for a difference on the primary metric — but one significant result happens ~5% of the time by chance alone even with unbiased randomisation (it's a hypothesis test at the same α), so a single hit is a prompt to investigate, not proof of bias; only a hit rate well above ~5% across repeated checks means the assignment infrastructure is broken and no AB result from it can be trusted.`,
      `**Statistical significance ≠ success:** p = 0.001 tells you the estimate is reliably nonzero, not that it's worth acting on — a 0.01% effect costing \$500K to ship is a significant failure. It also doesn't survive unchecked multiple testing: 15 secondary metrics at α=0.05 predict ~0.75 false positives by chance alone, so a few "significant" secondaries need a Bonferroni correction (and the primary metric needs to have been pre-registered) before you trust them.`,
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

Matching finds treated units and control units with identical or similar covariate profiles. Match on observed confounders — age, education, income, location — and the matched comparison removes their confounding. Propensity score matching compresses this into one dimension: the propensity score e(X) = P(T=1 | X=x) is a balancing score. Matching on e(X) balances all observed covariates simultaneously (Rosenbaum-Rubin theorem). Estimate e(X) with logistic regression, then match on the estimated scores and verify balance. Concretely: suppose the fitted model gives a 45-year-old non-participant and a 45-year-old participant with the same education and prior earnings the same estimated e(X) = 0.20 — that shared score is what makes the pair a valid match. Before matching, the treated group's mean age is 29 and the control group's is 34, with a pooled standard deviation of 8, so SMD = (29 − 34) / 8 = −0.63 — badly imbalanced. After matching on e(X), the treated mean age is 30.1 and the matched-control mean is 30.4, so SMD = (30.1 − 30.4) / 8 = −0.04, comfortably under the 0.1 threshold used later in this module.

Weighting is the continuous analog. Inverse Probability Weighting (IPW) weights each treated unit by 1/e(X) and each control unit by 1/(1−e(X)), creating a pseudo-population where treatment is uncorrelated with covariates. Take that same e(X) = 0.20: a control unit's weight is 1/(1 − 0.20) = 1.25, while a treated unit's weight is 1/0.20 = 5 — five times the pull of a typical unit. Push e(X) toward 0 or 1 and this ratio explodes, which is exactly why near-certain propensity scores produce the extreme weights (into the hundreds) that can dominate an IPW estimate. Doubly robust estimators (AIPW) combine regression adjustment with IPW and are consistent if either the outcome model or propensity model is correctly specified — not necessarily both. One wrong model is survivable; both wrong is not.

Common support is the region where both treated and control units exist with nonzero probability. Outside common support, inference requires extrapolation. Trim the sample to the region of common support before analysis and report what was trimmed.

What observational methods cannot do: remove confounding from unmeasured covariates. PSM, IPW, and AIPW are unbiased only if ignorability holds — only if all common causes of treatment and outcome are in X. An unmeasured confounder like motivation biases the estimate regardless of how sophisticated the estimator. No amount of covariate adjustment compensates for a variable you did not measure. The best observational studies acknowledge this explicitly and conduct sensitivity analysis for the residual unmeasured confounding — for example, computing the E-value: the minimum strength (on the risk-ratio scale) an unmeasured confounder like motivation would need, above and beyond the measured covariates, to fully explain away the observed effect. A large E-value means an unmeasured confounder that strong is implausible; a small one means the result could easily be an artifact of exactly the confounder the critic named.`,
    keyPoints: [
      `**After propensity score matching, check covariate balance with standardized mean differences (SMD) — SMD < 0.1 for each covariate indicates good balance.** Never report matching results without a balance table. If balance is poor for any covariate, re-specify the propensity score model — add polynomial terms, interactions, tighten the matching caliper (the maximum allowed propensity-score distance between a matched treated-control pair — tightening it discards poor matches at the cost of sample size), or switch to entropy balancing which directly optimizes balance rather than going through a propensity score. Skipping the balance check and assuming matching worked produces a biased estimate with no error message.`,
      `**Trap: matching on post-treatment variables.** If the variable you are matching on was determined after treatment assignment, it can introduce collider bias — conditioning on a variable that is a common effect of both the treatment and the outcome creates a spurious statistical association between them where none exists causally, biasing the estimate — or it can block the causal path you want to measure. Match only on pre-treatment covariates. Always verify whether each covariate was determined before or after treatment began before including it in the propensity model.`,
      `**Diagnostic: if common support is very limited — less than 30% overlap between treated and control propensity score distributions — you can only estimate the treatment effect for a narrow subpopulation.** Report this limitation explicitly. The estimate is not ATE for the full population; it is ATE for the overlap population, which may be quite different from the policy target. Extrapolating beyond common support is pure model assumption, not empirical comparison.`,
    ],
    interactivePrompt: `Before you touch the controls: after matching on the propensity score, what is the one check you must run before reporting any results — and what does it tell you if it fails?`,
    checkQuestions: [
      {
        q: `After PSM, you check covariate balance and find SMD=0.35 for age. What does this mean and what do you do?`,
        options: [
          `A) SMD=0.35 is within the acceptable range for continuous covariates such as age — the 0.1 threshold only applies to binary indicator covariates like sex or region, so no further action is required here at all`,
          `B) SMD=0.35 is far above 0.1 — age is imbalanced and likely a confounder. Fixes: re-specify with age² or interactions, tighten the caliper, exact-match on quintiles, or switch to entropy balancing`,
          `C) SMD=0.35 signals the propensity model is overfit to the training data — reducing the number of covariates in the logistic regression specification will bring the imbalance back within tolerance`,
          `D) SMD=0.35 is only a mild concern, and it can be fully corrected by simply adding age as a control in the post-matching outcome regression, which removes any residual imbalance left behind by matching`,
        ],
        answer: `B`,
      },
      {
        q: `You estimate ATE using IPW. 5 control observations have weights above 500 while all others are below 20. Select the two true statements about the problem and its fix.`,
        options: [
          `A) These weights blow up because a handful of control units have e(X)≈1 — the propensity model predicts them as near-certain to be treated — so a small number of observations dominate the weighted estimate and inflate its variance`,
          `B) Stabilized weights (multiplying by P(T=0)/(1−e(X))) and trimming extreme weights at a high percentile such as the 99th are both standard remedies, trading a small amount of bias for a much lower-variance estimate`,
          `C) The extreme weights indicate data-entry errors in the covariates feeding the propensity model, so the correct response is to delete those 5 observations outright before refitting the propensity score from scratch`,
          `D) These 5 control observations are best interpreted as near-perfect matches for treated units, so the right response is to upweight them further, which will only improve covariate balance with no downside`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `What does 'doubly robust' mean in the AIPW estimator? If both models are misspecified, is the estimate still valid?`,
        options: [
          `A) AIPW stays consistent if EITHER model is correctly specified — the augmentation term cancels outcome-model errors when the propensity model is right, and vice versa; if BOTH are wrong, the estimate is biased`,
          `B) Doubly robust means AIPW actually requires both the propensity and outcome models to be correctly specified at the same time — the name refers to needing two separate correct specifications, not just one of them`,
          `C) AIPW remains valid even with both models misspecified, because its augmentation term is built from fully non-parametric estimates that never depend on either model's functional form being correctly chosen`,
          `D) Doubly robust means AIPW is consistent under any degree of model misspecification, so long as the sample is large enough for cross-fitting to average the specification errors away asymptotically over time`,
        ],
        answer: `A`,
      },
      {
        q: `You are studying the effect of a job training program on earnings. Treated individuals self-selected. You find positive earnings effect. A critic says 'there is likely an unmeasured motivation confounder.' How do you respond?`,
        options: [
          `A) The critic's concern is unfounded — PSM already controls for every observed confounder including prior earnings as a proxy for motivation, so no further sensitivity analysis is needed to address the point at all`,
          `B) The concern is fully resolved by simply adding more covariates to the propensity model, since motivation is always at least partially captured by observables like education and work history in practice anyway`,
          `C) The critic is right: argue the strength of measured confounders as partial proxies, then run a sensitivity analysis computing the E-value motivation would need to fully explain the effect`,
          `D) The critic is simply wrong — self-selection bias only threatens an estimate when the selection mechanism is entirely unknown, and since we know participants self-selected on motivation we can model that directly`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Observational methods buy you exactly one thing: removal of bias from confounders you measured — no estimator, however sophisticated, removes bias from a variable you did not measure.`,
    recap: [
      `**Goal without randomisation:** make treated and control groups comparable using *measured* covariates, so the remaining outcome difference reflects treatment rather than baseline differences (a naive treated-vs-untrained comparison overstates the effect because the treated would have done better anyway).`,
      `**The propensity score e(X) = P(T=1|X) is a balancing score:** matching or weighting on this single number balances *all* observed covariates simultaneously (Rosenbaum-Rubin) — estimate it (e.g. logistic regression), match on it, then verify balance.`,
      `**IPW is the continuous analog:** weight each treated unit by 1/e(X) and each control by 1/(1−e(X)) to build a pseudo-population where treatment is uncorrelated with the covariates.`,
      `**Doubly robust (AIPW) combines regression adjustment with IPW:** it stays consistent if *either* the outcome model *or* the propensity model is correct — one wrong model is survivable, both wrong is not.`,
      `**Always check balance after matching:** standardized mean difference (SMD) < 0.1 per covariate; never report a matching result without a balance table, or you're presenting a biased estimate with no error message.`,
      `**Common support / overlap:** trim to the region where both treated and control units exist — outside it, any estimate is pure extrapolation, not empirical comparison, and the estimand becomes the overlap population.`,
      `**The hard ceiling:** none of this removes bias from an *unmeasured* confounder (e.g. motivation) — no estimator, however sophisticated, fixes a variable you didn't measure. Report it and do a sensitivity analysis (E-value).`,
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
      `**Always report the first-stage F-statistic — F < 10 indicates a weak instrument that biases IV estimates toward OLS.** The Stock-Yogo weak instrument test gives formal critical values. Weak instruments are the most common failure mode in applied IV. A weak instrument does not just widen the confidence interval — it also biases the point estimate itself back toward OLS, so a low F-stat should be treated as disqualifying, not merely noted and proceeded past.`,
      `**Trap: the exclusion restriction is untestable and can be violated in subtle ways.** For distance-as-instrument: distance might directly affect earnings through local labor market access, independent of education. Always think through every possible path from Z to Y and argue why each either does not exist or is controlled for. Stating the exclusion restriction holds "by assumption" is not a defense — it is a request for the reader to accept an unverified claim. One partial check: a placebo regression — regressing the instrument on an outcome it should have no effect on — flags a suspicious pathway if it comes back significant, though passing it never proves the exclusion restriction, since it only rules out the specific alternate outcomes you thought to test.`,
      `**Diagnostic: estimate the effect using IV and compare to OLS.** If IV < OLS, the OLS confounder was upward-biasing the estimate (e.g., ability bias in the education example — smarter people get more schooling and earn more regardless of schooling, so OLS overstates the causal return). If IV > OLS instead, do not reach for a downward-biasing confounder by default — check complier heterogeneity first: IV estimates the LATE, and compliers induced by the instrument can have above-average returns, which is the standard explanation for IV>OLS in the schooling literature. If the estimates have opposite signs, there is a strong confound or a violated exclusion restriction — investigate before publishing. The direction of the OLS-IV gap is a useful diagnostic, but only pins down confounding direction cleanly when treatment effects are homogeneous.`,
    ],
    interactivePrompt: `Before you touch the controls: in the distance-to-college example, what makes distance a valid instrument rather than just another control variable — and what would have to be true about distance for the exclusion restriction to fail?`,
    checkQuestions: [
      {
        q: `You want to estimate the causal effect of price increases on demand. Propose a valid instrument and explain how you would test its validity.`,
        options: [
          `A) Use lagged price as the instrument — the temporal ordering alone is treated as sufficient to guarantee the exclusion restriction, since a past price cannot literally be caused by current demand, only correlated with it`,
          `B) Use input cost shocks, e.g. oil prices for airlines — they move prices, but consumers respond only to the ticket price. Test relevance via first-stage F>10 and exclusion via a mechanism argument plus a placebo regression`,
          `C) Use competitor prices as the instrument — they move with own prices (relevance) and can't affect own-firm demand directly, since consumers are assumed to respond only to the firm's own posted price, never a rival's`,
          `D) Use random price variation from an A/B pricing experiment as the instrument — experimental assignment is independent of demand by construction, so exclusion is guaranteed and no further testing is ever required`,
        ],
        answer: `B`,
      },
      {
        q: `Your IV estimate of effect of education on earnings is 15% per year of schooling, but OLS estimate is 8%. Hausman test rejects exogeneity. Why might IV be higher than OLS?`,
        options: [
          `A) IV is higher because the instrument, college proximity, actually violates the exclusion restriction by directly raising earnings through better local labor market access, which inflates the 2SLS estimate above the truth`,
          `B) IV is higher purely because of weak-instrument bias — a low first-stage F causes 2SLS to systematically overestimate the effect, and the Hausman rejection is itself read as confirmation of this upward bias`,
          `C) IV and OLS should always converge as the sample grows arbitrarily large, so a persistent 15% vs 8% gap on its own is proof the instrument is invalid and the plain OLS estimate should be trusted instead`,
          `D) IV estimates LATE for compliers — marginal students induced to attend by proximity, who may have higher returns than the always/never-takers OLS averages over, so IV>OLS suggests returns are higher at the margin`,
        ],
        answer: `D`,
      },
      {
        q: `An economist uses distance to nearest abortion clinic as instrument for abortion rates, studying effect on child outcomes. What are the threats to the exclusion restriction?`,
        options: [
          `A) Distance must affect outcomes ONLY through abortion rates. Threats: geographic sorting on income/religion, rural healthcare access, urbanicity predicting outcomes via schools/labor markets — test with outcomes it shouldn't touch`,
          `B) The dominant threat here is simply a weak first stage — distance may only weakly predict abortion rates, pushing the first-stage F below 10 and biasing the resulting IV estimate back toward the plain OLS estimate`,
          `C) The exclusion restriction holds automatically as long as distance is measured at the time of pregnancy rather than during childhood, since that timing choice alone removes any direct channel to child outcomes`,
          `D) The only real threat to the exclusion restriction here is reverse causality — families may relocate closer to a clinic after having children, generating a spurious correlation between distance and the outcome`,
        ],
        answer: `A`,
      },
      {
        q: `What is the difference between LATE and ATE, and why does it matter for policy? Select the two true statements.`,
        options: [
          `A) ATE = E[Y(1)−Y(0)] over the full population, while LATE is the effect only for compliers — the subset whose treatment status actually changes in response to the instrument — so LATE ≠ ATE unless the treatment effect is homogeneous`,
          `B) Citing a lottery-instrument LATE to justify a universal training mandate is an error, since the effect on never-takers (who wouldn't attend even if required) could be zero or negative even when LATE for lottery-induced compliers is positive`,
          `C) LATE and ATE are numerically equivalent whenever the instrument is strong, i.e. first-stage F>10; the distinction between the two estimands only becomes relevant once the instrument is weak`,
          `D) LATE should always be preferred over ATE for policy decisions, because it specifically captures the effect for the people most likely to respond to whatever intervention is ultimately rolled out`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `IV trades the ignorability assumption for the exclusion restriction — both untestable — and estimates LATE for compliers only; a weak instrument adds enormous variance and biases the estimate toward OLS, defeating the purpose of the approach.`,
    recap: [
      `**IV isolates the variation in the treatment that's unrelated to the confounder:** for education↔ability, distance-to-college shifts who attends but (arguably) not their innate ability, so 2SLS uses only the geography-driven variation in education to estimate its effect on earnings.`,
      `**Three conditions a valid instrument Z must meet:** relevance (Z is correlated with T — testable via the first-stage F-statistic), exclusion (Z affects Y *only* through T, no other path), and independence (Z is uncorrelated with the T–Y confounders).`,
      `**2SLS operationalises it in two stages:** stage 1 regress T on Z to get fitted T̂ (the exogenous, instrument-driven part of T); stage 2 regress Y on T̂ instead of T — the effect of that clean variation on the outcome.`,
      `**IV estimates the LATE, not the ATE:** it recovers the effect only for *compliers* — units whose treatment status actually flips in response to the instrument — excluding always-takers and never-takers, so it's a specific subpopulation's effect.`,
      `**A weak instrument (first-stage F < 10) defeats the whole method:** it gives enormous variance *and* finite-sample bias back toward the OLS estimate you were trying to escape — the most common failure mode in applied IV (Stock-Yogo gives formal critical values).`,
      `**The exclusion restriction is almost never testable:** you must reason through *every* path from Z to Y and argue each away on subject-matter grounds (e.g. distance affecting earnings via local labour markets) — "holds by assumption" is not a defence.`,
      `**Diagnostic — compare IV to OLS:** IV < OLS points to an upward-biasing confounder (e.g. ability bias in the education example); IV > OLS is more often complier heterogeneity — IV estimates the LATE, and compliers can have above-average returns, not necessarily a downward-biasing confound; opposite signs ⇒ strong confound or a violated exclusion restriction — investigate before publishing.`,
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

The parallel trends assumption is the key identifying assumption. In the absence of treatment, the treated group's outcomes would have followed the same trend as the control group. This is untestable in the post-period — the treated city's counterfactual employment trend under no policy is never observed. It can be tested in pre-periods: if treated and control trends were parallel in 2017 and 2018, they were likely to remain parallel in 2020 absent the intervention. Non-zero pre-period effects in an event study — a regression that estimates the treatment effect separately for each time period relative to treatment — are evidence against parallel trends.

Two-way fixed effects (TWFE) regression formalizes this: Y_it = α_i + λ_t + β D_it + ε_it. Unit fixed effects absorb permanent group differences; time fixed effects absorb common trends; β is the DiD estimate. This handles multiple periods and multiple treatment groups simultaneously.

Staggered treatment timing: when different units receive treatment at different times, TWFE produces biased estimates if treatment effects are heterogeneous across groups or time. Early-treated units act as implicit controls for later-treated units during periods when both are treated — but the early-treated units' outcomes already include treatment effects. The Callaway-Sant'Anna and Sun-Abraham estimators restrict the control group to not-yet-treated or never-treated units for each treatment cohort, producing unbiased estimates in staggered designs.

What parallel trends is not: a weak assumption that is always satisfied. Parallel trends fails when treatment was assigned based on pre-period trends (units selected for treatment because their outcomes were deteriorating), when confounding trends affect treated and control groups differently, when anticipation effects let units start reacting before the official treatment date (a foreseeable policy can shift behavior early, showing up as a pre-trend break right before adoption), or when the groups are fundamentally different in character. Always plot pre-period trends and test formally with an event study before reporting a DiD estimate — and if the pre-trend test fails, add unit-specific trends to the regression or switch to a synthetic control that reweights untreated units to match the treated group's pre-period path, rather than reporting the naive DiD anyway.`,
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
          `A) Acknowledge the concern and simply vary the control group definition; if the -3% estimate stays roughly the same across a few different control choices, that alone is treated as confirmation parallel trends holds`,
          `B) Add treated×period interactions to the TWFE regression and plot an event study; if pre-periods diverge, add unit-specific trends or synthetic control, and report the pre-trend test alongside the main estimate`,
          `C) Re-run the DiD using a much shorter pre-period window, since pre-trend tests built on many pre-periods are inherently overpowered and will reject parallel trends even when it approximately holds in reality`,
          `D) The -3% estimate is automatically valid as long as treatment assignment is as-good-as-random conditional on county and time fixed effects — pre-trends become entirely irrelevant once those effects are in the model`,
        ],
        answer: `B`,
      },
      {
        q: `You are evaluating a product feature rolled out to user cohorts in January, March, and May. You plan TWFE DiD with January as treatment group and March/May as controls. Why is this problematic?`,
        options: [
          `A) TWFE strictly requires a never-treated control group by definition; because March and May cohorts are eventually treated, no valid DiD estimate can exist at all for any staggered-rollout design of this general kind`,
          `B) The January cohort is simply too small to function as a treatment group, since TWFE requires roughly balanced treatment and control group sizes in order to produce a genuinely unbiased estimate here`,
          `C) Using January as the treated cohort requires pre-period data before January to exist; without it, the parallel trends assumption can never be tested and the whole estimate becomes unreliable by default anyway`,
          `D) TWFE uses already-treated March/May cohorts as implicit controls for January, and with heterogeneous effects this can flip the sign — fix with Callaway-Sant'Anna, using only not-yet-treated units as controls`,
        ],
        answer: `D`,
      },
      {
        q: `A policy raising fuel efficiency standards was adopted by California in 2005 and no other state. Select the two genuine threats to parallel trends when using other US states as DiD controls.`,
        options: [
          `A) California is structurally different in geography, demographics, and political environment from most other states, so its emissions trend may have been diverging from the control states for reasons entirely unrelated to the 2005 policy`,
          `B) Anticipation effects are plausible — automakers and consumers in California may have begun adjusting behavior before 2005 if the policy was foreseeable, which would show up as a pre-trend break right before the official adoption date`,
          `C) The only real threat to parallel trends is that there are just 49 potential control states; simply adding more treated states elsewhere would resolve any parallel trends concern purely by increasing statistical power`,
          `D) There is no genuine threat to parallel trends here at all, since California's adoption decision was clearly driven by state-level political factors that have nothing to do with national emissions trajectories`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `DiD requires parallel trends — untestable post-treatment — and in staggered designs TWFE is biased even when parallel trends holds for every cohort, because early-treated units contaminate the control group for later-treated units.`,
    recap: [
      `**DiD = (treated post − treated pre) − (control post − control pre):** subtracting the control group's change from the treated group's change removes the common time trend (e.g. a COVID drop hitting both cities), leaving only the differential change that appeared with treatment.`,
      `**Parallel trends is the key identifying assumption:** absent treatment, the treated group's outcomes would have followed the same trend as the control's — the treated counterfactual is never observed, so this is untestable in the post-period.`,
      `**But you can test it in the pre-periods with an event study:** estimate the effect for each period relative to treatment; pre-treatment coefficients should cluster near zero, and systematic non-zero ones are evidence the groups were already diverging (the estimate is confounded).`,
      `**TWFE formalises DiD:** Y_it = α_i + λ_t + β D_it — unit fixed effects absorb permanent group differences, time fixed effects absorb common trends, and β is the DiD estimate across many periods and groups at once.`,
      `**Staggered treatment timing breaks TWFE when effects are heterogeneous:** already-treated units act as *implicit controls* for later-treated ones while their own outcomes already include treatment effects, so TWFE can return the wrong sign even when every individual effect is positive (Goodman-Bacon decomposition).`,
      `**The fix — Callaway-Sant'Anna / Sun-Abraham:** build clean 2×2 DiDs for each treatment cohort using *only* not-yet-treated or never-treated units as controls, then aggregate — unbiased in staggered designs.`,
      `**Placebo test:** run the DiD on an outcome the treatment logically can't affect; a "significant" effect there means something correlated with treatment is driving the outcome — you're picking up a confounded association, not the causal effect.`,
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

Sharp RDD: exactly at the cutoff, treatment probability jumps from 0 to 1. Local linear regression fits separately on each side of the cutoff within a bandwidth h. The treatment effect equals the difference in the regression line values at the cutoff — the discontinuity. Fuzzy RDD: at the cutoff, treatment probability jumps from p to p′ but not all the way. Use the threshold indicator as an instrument (IV): the estimate is the ratio of the jump in the outcome regression at the cutoff to the jump in the treatment-probability regression at the cutoff — the same difference-in-fits computation as Sharp RDD, taken twice (once for the outcome, once for treatment probability) and divided. This Wald-style ratio estimates the LATE for compliers at the cutoff.

Bandwidth selection is the central technical tradeoff. Too narrow: too few observations, high variance. Too wide: units far from the cutoff are not locally comparable, high bias. The Calonico-Cattaneo-Titiunik (CCT) data-driven selector minimizes MSE. Report estimates at multiple bandwidths — a result that changes dramatically with bandwidth choice is not robust.

What RDD requires that must always be checked: units cannot precisely manipulate which side of the cutoff they land on. If students can adjust their score to land just above 70, the units just above are not comparable to units just below — they are systematically different in their ability or motivation to game the system. Always test for bunching in the running variable distribution using the McCrary density test. Significant bunching at or just above the cutoff means the local randomization assumption is violated.`,
    keyPoints: [
      `**Always run the McCrary density test before reporting RDD results.** If the density of the running variable has a discontinuity at the cutoff, there is strategic manipulation — units just above the cutoff are not comparable to units just below. This takes two lines of code and catches the most common RDD validity threat. A visible spike in the histogram before the formal test is already a red flag.`,
      `**Trap: using global polynomial regression on the full sample instead of local linear regression near the cutoff.** Higher-order polynomials fit poorly near the boundaries and are sensitive to outliers far from the cutoff. Local linear regression with MSE-optimal bandwidth (rdrobust package) is the standard. The polynomial degree should be chosen by cross-validation, not by visual appeal of the fit. This trap is about fitting a high-order polynomial across the *entire* sample — it is different from a **local quadratic**, a low-order polynomial fit only *within* the local bandwidth window on each side of the cutoff, which is a legitimate bias-correction tool when the outcome is visibly curved near the threshold.`,
      `**Diagnostic: run the RDD on placebo outcomes — pre-treatment outcomes, or outcomes that should not be affected by the treatment.** If there is a discontinuity in these outcomes at the cutoff, something else is causing a jump at the threshold. Your continuity assumption is violated. Significant covariate jumps at the cutoff (from pre-treatment variables) are the same signal: something other than the treatment is discontinuous there. This is why the covariates checked must be pre-treatment: a covariate measured after treatment can itself be changed BY the treatment, so balance on a post-treatment covariate (e.g., GPA measured after the scholarship decision) proves nothing about validity — it is the same post-treatment-bias ("bad control") problem as controlling for a mediator, and it cannot substitute for checking pre-treatment variables.`,
    ],
    checkQuestions: [
      {
        q: `A university gives scholarships to students who score above 70 on entrance exam. You want to estimate the effect on graduation rates using RDD. Select the two genuinely required validity checks.`,
        options: [
          `A) Run a McCrary density test on the running variable around 70 — a spike in density just above the cutoff signals manipulation, and the formal version of this check is implemented in the rddensity package`,
          `B) Run a covariate balance test by regressing pre-determined covariates (prior GPA, family income) on the running variable and testing for a jump at 70, since a jump there would signal something other than treatment is discontinuous`,
          `C) Check balance on post-treatment covariates such as GPA after enrollment and class attendance on both sides of the cutoff — if these look balanced, that alone is sufficient to certify the RDD estimate is valid`,
          `D) Verify the scholarship amount is large enough to plausibly move graduation rates, and confirm students just below 70 applied for other financial aid — if they did, the RDD estimate is read as the scholarship's net effect`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You run sharp RDD and get significant effect with bandwidth ±10. With ±5 the effect is larger; with ±15 it shrinks to near zero. What does this pattern tell you?`,
        options: [
          `A) This is expected and entirely unremarkable — narrower bandwidths mechanically produce larger RDD estimates because they use only the most comparable units, so the ±15 result is simply the least credible of the three`,
          `B) This is a warning sign, not routine noise. Explanations: nonlinearity near the cutoff (use local quadratic), or localized manipulation in ±5 (re-check McCrary density there). Report CIs at several bandwidths`,
          `C) The shrinking effect at ±15 actually confirms the RDD is valid, since the effect is inherently local to the cutoff and should weaken as you widen the window to include units farther from the local-randomization region`,
          `D) The larger effect at ±5 indicates the whole result is driven by regression to the mean — students just above 70 had unusually high scores relative to their true ability, and the scholarship really has no real effect at all`,
        ],
        answer: `B`,
      },
      {
        q: `A government policy provides business subsidies to firms with revenue below £500k. McCrary test shows significant bunching just below £500k. Can you still use RDD?`,
        options: [
          `A) Yes without qualification — bunching below £500k simply confirms firms are aware of the threshold, which makes the subsidy salient and, if anything, makes the RDD estimate more credible than usual to readers`,
          `B) Yes — apply a density-weighting correction that downweights observations near the bunching region, which adjusts for the manipulation and by itself recovers an unbiased RDD estimate with absolutely no further caveats`,
          `C) Bunching signals deliberate manipulation — firms below and above are no longer comparable. Remedies: donut RDD excluding the band, explicit bunching-estimator modeling, or reporting only a lower bound if asymmetric`,
          `D) Yes — simply restrict the sample to firms whose revenue did not change year-over-year, since firms with stable revenue are by definition not manipulating and form a perfectly valid comparison group for the RDD`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `RDD achieves high local credibility without measuring confounders — but only near the cutoff, only when units did not manipulate their running variable, and only if nothing else changes discontinuously at the same threshold.`,
    recap: [
      `**RDD exploits a threshold rule in treatment assignment:** a student scoring 69 vs 71 on a scholarship-at-70 exam has the same underlying ability and motivation, differing only in eligibility — so near the cutoff assignment is locally as-good-as-random and you identify the effect *without measuring any confounders*.`,
      `**The key identifying assumption:** *no other* variable changes discontinuously at the cutoff — so any jump in the outcome at the threshold is caused by the treatment, because nothing else jumped there.`,
      `**Sharp RDD:** exactly at the cutoff, treatment probability jumps 0→1; fit a local linear regression on each side within a bandwidth and the effect is the vertical discontinuity between the two fits at the cutoff.`,
      `**Fuzzy RDD:** treatment probability jumps only from p to p′ (not all the way); the estimate is the ratio of the jump in the outcome regression at the cutoff to the jump in the treatment-probability regression at the cutoff — a Wald/IV ratio, the same difference-in-fits idea as Sharp RDD applied to both regressions and divided — estimating the LATE for compliers at the cutoff.`,
      `**Bandwidth is the central trade-off:** too narrow = too few observations = high variance; too wide = units far from the cutoff aren't comparable = high bias. The CCT data-driven selector minimises MSE — report estimates at several bandwidths, since a result that swings wildly with bandwidth isn't robust.`,
      `**Manipulation test — McCrary density:** units must not be able to precisely control which side of the cutoff they land on. Bunching in the running-variable density at or just above the cutoff means they gamed it, and the local-randomisation assumption is violated.`,
      `**Placebo checks:** run the RDD on pre-treatment outcomes and covariates — a jump at the cutoff in something the treatment can't have affected means the continuity assumption is broken and something else is discontinuous there.`,
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
    summary: `A marketing team has a \$1M budget for promotional emails. They can send to 1M users, but only 200K will benefit from the discount — people who would not have purchased without it. Sending to users who would purchase anyway wastes the discount cost. Sending to users who actively dislike being contacted is counterproductive. A simple propensity-to-purchase model predicts who will buy — but that is not uplift. Uplift is: who changes their behavior because of the treatment?

[FIGURE: upliftquad]

Four user types define the targeting problem. Persuadables will buy with treatment and not without — your target. Sure Things will buy regardless — wasting budget on them yields zero incremental revenue. Lost Causes will not buy regardless. Sleeping Dogs will buy without treatment but not with it — negative uplift, worse than doing nothing. A model maximizing purchase propensity concentrates budget on Sure Things. An uplift model maximizes incremental effect.

Uplift estimation targets τ(x) = E[Y(1) − Y(0) | X = x] — the Conditional Average Treatment Effect (CATE). You cannot observe τ(x) directly because you never observe both Y(1) and Y(0) for the same person. Meta-learners estimate it from RCT data. Two-model (T-learner): fit Y ~ X separately for treated and control, subtract predictions. S-learner: include T as a feature, fit one model. X-learner: imputes individual treatment effects and then builds a CATE model by borrowing strength across groups — better for imbalanced treatment/control splits. R-learner: fit nuisance models m(x) = E[Y|X] and e(x) = P(T=1|X) on one data fold, then solve Y − m(X) = τ(X)(T − e(X)) + ε by regressing the outcome residual on the treatment residual on a held-out fold (cross-fitting). This residual-on-residual step is what makes it orthogonalized: Neyman orthogonality means the loss's gradient with respect to τ vanishes at the true m and e, so small errors in the nuisance models don't bias τ̂ to first order — R-learner is often preferred when nuisance estimation is noisy or hard, such as with imbalanced treatment/control splits. Causal forests: non-parametric CATE estimator with valid confidence intervals.

Worked T-learner example: suppose the RCT gives a high-spend segment a treated purchase rate μ̂₁ = 0.52 and control rate μ̂₀ = 0.48, so τ̂(high-spend) = 0.52 − 0.48 = 0.04. A low-spend segment gives μ̂₁ = 0.31 and μ̂₀ = 0.09, so τ̂(low-spend) = 0.31 − 0.09 = 0.22 — 5.5× the incremental lift of the high-spend segment, even though its raw purchase rate (0.31) is lower than high-spend's (0.52). A response model, which ranks purely on μ̂₁, would rank high-spend above low-spend and get the targeting backwards; the T-learner's subtraction recovers the correct ranking.

Evaluation: Qini curves rank users by predicted uplift descending. At each percentile of targeted users, compute cumulative incremental outcome in the treatment arm versus the control arm of a held-out RCT split — because both arms are real, this is a direct measurement of incremental effect, not merely a ranking-quality proxy. Summing that gap across percentile bins gives the AUUC; when treatment and control groups are equal-sized this equals the plain unnormalized uplift-curve area, but a genuine Qini curve additionally rescales the control arm's cumulative outcome by the treatment/control size ratio, so the two areas diverge once the groups are imbalanced. What one offline Qini curve does NOT catch: tuning a model repeatedly against the same historical RCT split can overfit to that split's noise, and a historical split can miss distribution shift after deployment (new users, new season, a competitor's promo). A fresh, post-deployment no-contact holdout — held out from all tuning — is what catches those two failure modes; it is not required because offline Qini fails to measure real treatment effect, which it does measure when built from a genuine RCT split.

What a response model is not: an uplift model. A response model predicts P(purchase) — dominated by Sure Things. An uplift model predicts P(purchase | treatment) − P(purchase | no treatment) — targets Persuadables. These are orthogonal quantities. Deploying a response model as an uplift model wastes marketing budget and misses the actual causal effect of the treatment.`,
    keyPoints: [
      `**Keep a fresh, post-deployment no-contact holdout that was never used for tuning.** An offline Qini curve built from a real held-out RCT split already measures actual incremental effect — it compares treated vs. control outcomes at each percentile, so it is not merely a ranking-quality proxy. The real risk is that repeatedly tuning against the same historical split can overfit to its noise, and that split can miss distribution shift after deployment. A never-tuned-on post-deployment holdout is what catches both of those failure modes, which is why it's required in addition to (not instead of) offline Qini.`,
      `**Trap: using the T-learner on highly imbalanced treatment/control designs (95% treated, 5% control).** The control model has very little data and its predictions are noisy. Errors from both models compound in the subtraction — variance of τ̂(x) is dominated by noise in the smaller group. Use X-learner or causal forests, which are specifically designed for imbalanced designs and borrow strength across groups.`,
      `**Diagnostic: if your model assigns high uplift to users with high baseline purchase rates — high overlap between uplift deciles and response deciles — the uplift model is collapsing to a response model.** Check the correlation between CATE estimates and baseline propensity. Worked example: five baseline-propensity quintiles of [0.09, 0.20, 0.35, 0.48, 0.61] paired with τ̂ of [0.22, 0.15, 0.09, 0.04, 0.01] give corr(τ̂, propensity) ≈ −0.98 — healthy, since uplift falls as baseline propensity rises (Persuadables cluster at low baseline propensity here). If instead τ̂ tracked propensity directly, e.g. τ̂ = [0.03, 0.07, 0.13, 0.17, 0.22] rising alongside those same quintiles, corr(τ̂, propensity) ≈ +0.99 — over the 0.7 threshold, meaning the model is not capturing incremental effects, it's just re-deriving baseline propensity. Segment users by baseline propensity quintile and verify that τ̂(x) varies within each quintile (not just across quintiles) before trusting the targeting.`,
    ],
    interactivePrompt: `Before you touch the controls: the marketing team wants to target the top decile of users by predicted purchase probability. Name the two user types that will be disproportionately in that group — and why neither is the right target for a discount campaign.`,
    checkQuestions: [
      {
        q: `Your response model targets customers with highest predicted purchase probability. Select the two true statements about why this can be suboptimal.`,
        options: [
          `A) "Likely to purchase" is not the same as "likely to purchase because of treatment" — high-baseline customers are often Sure Things who buy regardless, so targeting them wastes discount margin with zero incremental revenue`,
          `B) Some high-propensity customers may be Sleeping Dogs — people who buy fine on their own but get annoyed by discount emails and become less likely to purchase (or even unsubscribe) once treated — so treating them can actively backfire rather than merely waste budget`,
          `C) Response models are only suboptimal once the discount exceeds roughly 30% of price; below that threshold predicted purchase probability is already a valid stand-in for uplift because incremental purchases dominate`,
          `D) The real issue is that response models typically use logistic regression, which is miscalibrated for ranking tasks; switching to gradient boosting for the same purchase-probability target resolves the targeting problem`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You have RCT dataset with 100,000 control users and 10,000 treated users. You want to estimate CATE. Which meta-learner and why?`,
        options: [
          `A) S-learner — folding all 110,000 observations into one model with T as a feature is claimed to minimize variance from the imbalance simply by pooling every observation into a single shared training set regardless of split`,
          `B) T-learner — fitting fully separate treated and control models is claimed to guarantee treatment effects are never regularized away, which the imbalance would otherwise make the primary failure mode of this design`,
          `C) X-learner suits this 10:1 imbalance — the T-learner's treated model is noisy with only 10,000 rows, whereas X-learner's imputation step borrows strength from the 100,000 controls to stabilize τ̂(x)`,
          `D) R-learner — orthogonalizing against a propensity score near e(x)≈0.1 everywhere is claimed to remove the imbalance-driven variance problem entirely without discarding any of the 10,000 treated observations at all`,
        ],
        answer: `C`,
      },
      {
        q: `After training X-learner for marketing targeting, how would you evaluate whether CATE estimates are actually measuring causal heterogeneity vs spurious correlation?`,
        options: [
          `A) Compute feature importance for τ̂(x) and check it matches the plain baseline outcome model's importance — agreement between the two is read as confirming genuine causal heterogeneity in the estimates`,
          `B) Combine a Qini/AUUC curve on held-out RCT data with a post-deployment holdout: deploy by predicted τ̂(x), keep a random no-contact group, and confirm targeted users beat random within that holdout`,
          `C) Simply cross-validate the X-learner with standard k-fold CV and report RMSE on the held-out folds — a low RMSE alone is treated as sufficient to confirm the model captures real heterogeneity rather than noise`,
          `D) Compare X-learner CATE estimates against T-learner CATE estimates and treat simple ranking agreement between the two models as proof the estimates reflect true heterogeneity rather than a shared artifact`,
        ],
        answer: `B`,
      },
      {
        q: `What is the R-learner and why does 'orthogonalisation' matter for CATE estimation?`,
        options: [
          `A) R-learner is simply a regularized T-learner that adds an L2 penalty to prevent overfitting, and orthogonalisation here just refers to that penalty keeping the treatment and control sub-models from correlating`,
          `B) R-learner uses random forests for both nuisance and CATE stages, and orthogonalisation refers to decorrelating tree splits across the ensemble, which is what actually reduces the variance of the CATE estimates`,
          `C) R-learner simply residualizes the outcome against a fitted propensity score before fitting a CATE model, and orthogonalisation means projecting the outcome onto the treatment indicator ahead of that final fit`,
          `D) R-learner solves Y−m(X)=τ(X)(T−e(X))+ε. Neyman orthogonality means the loss gradient vanishes at the true m and e, so first-order nuisance errors don't bias τ̂ — cross-fitting makes it near-unbiased and efficient`,
        ],
        answer: `D`,
      },
      {
        q: `You estimate CATE using X-learner on observational data (no RCT). A colleague argues the estimates cannot be trusted. Who is right?`,
        options: [
          `A) The colleague is mostly right — CATE from observational data needs ignorability WITHIN every subgroup of X, not just on average, and needs overlap throughout X-space; defend with domain arguments and sensitivity analysis`,
          `B) The colleague is simply wrong — X-learner's propensity weighting step is claimed to fully adjust for confounding in observational data, so its CATE estimates are already as credible as any IPW-based ATE estimate`,
          `C) Both are equally right in a trivial sense — observational CATE estimates are treated as neither trustworthy nor untrustworthy, so they should just always ship with a generic disclaimer that results may not be causal`,
          `D) The colleague is only right if overlap is missing; once every propensity score in the sample falls within [0.1, 0.9], the X-learner's CATE estimates are claimed to become unbiased with no further validation needed`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `A response model finds likely converters; an uplift model finds people who convert because of the treatment — these are orthogonal, and targeting the first group wastes budget on Sure Things and backfires on Sleeping Dogs.`,
    recap: [
      `**Uplift is not propensity:** a response model predicts *who will convert* (dominated by people who'd buy anyway); an uplift model predicts *who converts because of the treatment* — orthogonal quantities, and confusing them wastes budget on people who'd have bought regardless.`,
      `**Four user types define the targeting problem:** Persuadables (buy only if treated — your target), Sure Things (buy regardless — wasted discount), Lost Causes (never buy — wasted), Sleeping Dogs (buy *without* treatment but not with it — negative uplift, actively backfires).`,
      `**Target τ(x) = E[Y(1) − Y(0) | X=x], the CATE:** you can never observe it directly (never both potential outcomes per person), so you estimate it from RCT data with a meta-learner.`,
      `**The meta-learners:** S-learner (include T as a feature, one model), T-learner (fit treated and control separately, subtract), X-learner (impute individual effects and borrow strength across groups), R-learner (residualize outcome and treatment against nuisance models m(x), e(x) via cross-fitting, then regress residual-on-residual — Neyman orthogonality keeps τ̂ robust to small nuisance errors), causal forests (non-parametric, with valid confidence intervals).`,
      `**Use X-learner (or causal forests) for imbalanced splits** (e.g. 95% treated / 5% control): the T-learner's small-group model is noisy and its error compounds in the subtraction, whereas X-learner borrows strength from the larger group to stabilise.`,
      `**Evaluate with a Qini curve / AUUC** — rank users by predicted uplift and measure cumulative incremental outcome in the treatment arm vs. the control arm of a held-out RCT split; because both arms are real, this already measures actual incremental effect, not just ranking quality. The real risk is overfitting the model to that one historical split, or a post-deployment distribution shift it can't see — guard against both with a fresh, never-tuned-on, post-deployment no-contact holdout.`,
      `**Collapse warning:** if corr(τ̂, baseline purchase propensity) exceeds ~0.7, the uplift model has degenerated into a plain response model — it's ranking Sure Things, not Persuadables.`,
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
        q: `A new recommendation algorithm (T) increases 7-day retention (Y) by 5 percentage points. You suspect mechanism is session length (M). Select the two true statements about a valid mediation analysis here.`,
        options: [
          `A) Estimate NDE and NIE (e.g. via the mediation package with bootstrap CIs) rather than three plain regressions, because sequential ignorability for M is a separate assumption from T's ignorability and can still fail even inside a clean RCT`,
          `B) Before trusting the decomposition, check whether session length could be a collider or a descendant confounded with retention through an unmeasured path, and whether the T-M-Y relationship is genuinely linear or needs a VanderWeele-style interaction decomposition`,
          `C) Simply run three regressions — Y on T, M on T, and Y on T and M — and report proportion mediated as the coefficient drop over the total effect; no additional assumptions are needed here since the treatment itself was randomized`,
          `D) Mediation is not identifiable in this setting at all, because session length and retention are measured over the same window, and that simultaneity alone rules out any valid decomposition without extra instrumental-variable assumptions`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You control for a variable M in a regression of Y on T, and the coefficient on T drops from 0.4 to 0.1. Your colleague concludes '80% of the effect of T on Y is mediated by M.' What questions would you ask?`,
        options: [
          `A) Ask only whether the sample size is large enough — a 0.3 point coefficient drop is meaningless without a confidence interval, and a large standard error alone is treated as enough to overturn the mediation claim entirely`,
          `B) Ask whether M is a mediator or a confounder, whether sequential ignorability holds for M, whether M is instead a collider, and whether linear Baron-Kenny is appropriate given a possible T×M interaction`,
          `C) Ask only whether M was measured before or after T — post-treatment timing is treated as sufficient on its own to confirm mediation, while pre-treatment timing is treated as sufficient on its own to rule it out entirely`,
          `D) Ask only whether T causes M — a significant T-on-M coefficient in a separate regression is treated as sufficient by itself to validate the whole mediation interpretation, with no further questions about M's role ever needed`,
        ],
        answer: `B`,
      },
      {
        q: `Your treatment T was assigned by a clean randomized experiment. Why can the mediation decomposition (NDE/NIE) through mediator M still be biased?`,
        options: [
          `A) Randomization guarantees ignorability of T but not of M — an unmeasured mediator-outcome confounder survives randomization entirely intact and can still bias both the NDE and the NIE`,
          `B) It cannot actually be biased in this setup — randomizing T automatically forces the NDE and NIE to be unbiased too, so no separate assumption about M is ever required once T is randomized`,
          `C) The mediator here is measured after treatment, and that post-treatment timing alone guarantees reverse causation between M and Y, which breaks the decomposition regardless of study design or measurement`,
          `D) RCTs only ever recover average effects, and mediation instead requires individual-level counterfactuals, which are fundamentally unidentifiable in literally any experimental or observational study design`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Mediation requires a stronger assumption than total effect estimation — an RCT guarantees T-ignorability but not M-ignorability, and every mediation result needs sensitivity analysis for unmeasured mediator-outcome confounding.`,
    recap: [
      `**Mediation decomposes the Total Effect into Direct + Indirect:** how much of training's effect on earnings flows *through* a mediator (employment) versus *directly* (skills raising wages) — the split matters because it changes the policy (placement services vs training content).`,
      `**NDE = Y(t, M(t′)) − Y(t′, M(t′)):** the natural direct effect — the effect of treatment while holding the mediator fixed at the value it would take under control.`,
      `**NIE = Y(t, M(t)) − Y(t, M(t′)):** the natural indirect effect — the effect of shifting the mediator from its control-level to its treatment-level value while holding treatment fixed.`,
      `**Baron-Kenny (three regressions) is intuitive but leans on a strong assumption:** it requires *no unmeasured confounding of the mediator–outcome relationship*, and an RCT does *not* provide it — indirect effect = (T→M coefficient) × (M→Y coefficient).`,
      `**An RCT randomises T, not M:** so a mediator–outcome confounder survives randomisation — this is exactly why clean treatment randomisation still doesn't buy you a valid mediation decomposition.`,
      `**Controlling for M in a regression is *not* mediation:** it gives the *controlled* direct effect, and because M is post-treatment, conditioning on it opens collider bias if M and Y share any unmeasured common cause. Mediation needs a structural model, not one extra covariate.`,
      `**Always run the Imai-Keele-Tingley sensitivity analysis (ACME):** it reports how strong an unmeasured mediator–outcome confounder would have to be to overturn your NDE/NIE — without it, the decomposition can't be defended.`,
    ],
    figures: {
      mediationdag: `<svg viewBox="0 0 360 122" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <defs><marker id="mh" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker><marker id="mhU" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#f59e0b"/></marker></defs>
  <text x="4" y="12" fill="var(--ink-low)" font-size="8">Total = Direct (T→Y) + Indirect (T→M→Y)</text>
  <circle cx="180" cy="42" r="15" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="180" y="46" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">M</text>
  <text x="180" y="27" text-anchor="middle" fill="var(--ink-low)" font-size="7">employment</text>
  <circle cx="50" cy="88" r="15" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="50" y="92" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">T</text>
  <text x="50" y="112" text-anchor="middle" fill="var(--ink-low)" font-size="7">training</text>
  <circle cx="310" cy="88" r="15" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="310" y="92" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Y</text>
  <text x="310" y="112" text-anchor="middle" fill="var(--ink-low)" font-size="7">earnings</text>
  <path d="M63,78 L166,51" stroke="var(--prime)" stroke-width="1.5" marker-end="url(#mh)"/>
  <path d="M194,51 L297,78" stroke="var(--prime)" stroke-width="1.5" marker-end="url(#mh)"/>
  <path d="M65,90 L293,90" stroke="var(--ink-mid)" stroke-width="1.5" marker-end="url(#mh)"/>
  <text x="180" y="103" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">NDE (direct)</text>
  <text x="105" y="58" text-anchor="middle" fill="var(--prime)" font-size="7.5">NIE (indirect)</text>
  <circle cx="248" cy="40" r="12" fill="none" stroke="#f59e0b" stroke-dasharray="2 2"/>
  <text x="248" y="44" text-anchor="middle" fill="#f59e0b" font-size="8" font-weight="700">U</text>
  <path d="M236,44 L200,50" stroke="#f59e0b" stroke-width="1.1" marker-end="url(#mhU)"/>
  <path d="M256,50 L300,74" stroke="#f59e0b" stroke-width="1.1" marker-end="url(#mhU)"/>
  <text x="180" y="120" text-anchor="middle" fill="#f59e0b" font-size="7">RCT randomises T, not M — a hidden M–Y confounder U survives.</text>
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
    summary: `You have estimated that a job training program increases earnings by \$3,000/year using a matching estimator. Your result assumes no unmeasured confounders — the unconfoundedness assumption. But what if motivation is unobserved and it causes both training program enrollment and higher earnings? How strong would this unmeasured confounder need to be to reduce your estimated effect to zero? If the answer is "only a moderate confounder," your result is fragile. If the answer is "a confounder stronger than any observed covariate," your result is robust. Sensitivity analysis quantifies this threshold.

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
          `A) An E-value of 1.9 means the study has roughly 90% statistical power to detect any confounder with RR ≥ 1.9, and any confounder weaker than that threshold is treated as too weak to explain away the observed effect`,
          `B) An E-value of 1.9 is essentially a p-value transform confirming RR=1.3 is significant at p<0.05, adjusted to account for the multiple comparisons implicit in a typical matching study's many covariates and subgroups`,
          `C) An E-value of 1.9 literally counts how many additional covariates — 1.9 of them — would need to be added to the matching model before the observed effect fully disappears from the estimate entirely`,
          `D) A confounder needs RR≥1.9 with BOTH treatment AND survival to explain away RR=1.3 — compare to known ones like SES (RR≈1.4, too weak) or smoking (RR≈2.5, strong enough) to judge robustness`,
        ],
        answer: `D`,
      },
      {
        q: `Your DiD estimate shows minimum wage increase reduced employment by 3%. A critic says treated and control counties had different pre-trends. How do you test and respond?`,
        options: [
          `A) Add pre-period interactions to the TWFE regression and plot an event study — coefficients should be near zero pre-treatment; if not, add trends or synthetic control and report the test alongside the estimate`,
          `B) Respond that parallel trends is simply untestable by definition, since pre-treatment trend similarity logically says nothing whatsoever about post-treatment similarity, so the critic's concern cannot be addressed empirically at all`,
          `C) Re-run the DiD using a much shorter pre-post window, such as one quarter instead of one year — if the estimate holds up across that narrower window alone, pre-trends are treated as fully irrelevant to the -3% result`,
          `D) Dismiss the concern outright, since including county and time fixed effects in the TWFE regression is treated as sufficient by construction to absorb any pre-existing trend divergence, making pre-trend testing entirely unnecessary`,
        ],
        answer: `A`,
      },
      {
        q: `You want to test whether IV analysis for effect of college education on earnings (using proximity as instrument) is confounded. Select the two genuine falsification tests.`,
        options: [
          `A) Run the same IV analysis on a cohort too old to have benefited from nearby colleges at the time of their schooling decisions — a significant "effect" there signals proximity is correlated with local labor markets directly, not just through education`,
          `B) Regress pre-determined covariates such as parents' education and family income on the instrument — if proximity predicts these, it is capturing geographic family sorting rather than pure exogenous variation`,
          `C) Compare IV estimates across rural and urban counties — a significant difference between the two subsamples is treated as sufficient on its own to prove proximity is only capturing urbanicity rather than genuine college access`,
          `D) Add a second instrument such as state college subsidies and run only a Sargan-Hansen overidentification test — passing this single test is treated as conclusive proof the exclusion restriction holds for both instruments`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `After reporting a positive causal effect of a product feature on revenue using DiD, a sceptical executive asks: 'How fragile is this result?' How do you answer rigorously?`,
        options: [
          `A) Report the p-value and the confidence interval alone — a p-value under 0.01 with a CI that excludes zero is treated as sufficient by itself to establish that the whole result is not fragile in any way`,
          `B) Run a specification check: vary the pre-post window, vary the control group, check related outcomes move together, vary the regression, and place the estimate against placebo pseudo-date estimates`,
          `C) Run a retrospective power analysis — if the original test cleared 80% power, the result is treated as automatically robust, since underpowered tests are assumed to be the only possible source of fragile findings`,
          `D) Declare the result non-fragile outright, since two-way fixed effects DiD is treated as robust to all forms of time-invariant confounding by construction, with sensitivity analysis needed only for purely cross-sectional designs`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Sensitivity analysis does not prove a causal estimate — it reports how much hidden confounding it would take to overturn it, making the fragility or robustness of the claim explicit rather than hidden.`,
    recap: [
      `**The core question:** given a result that assumes no unmeasured confounders, *how strong* would a hidden confounder have to be to reduce your effect to zero? "Only a moderate one" ⇒ fragile; "stronger than any observed covariate" ⇒ robust.`,
      `**Rosenbaum Γ (for matching studies):** the maximum ratio by which two matched units' *odds of treatment* could differ due to unobserved variables while you still reject the null — it quantifies how much hidden bias the conclusion tolerates.`,
      `**Reading Γ:** Γ = 1.0 means *any* unobserved confounding overturns the result; sensitive at Γ = 1.2 is fragile; robust up to Γ = 3.0 is credible.`,
      `**E-value = RR + √(RR(RR−1)):** the *minimum* association strength an unmeasured confounder would need with *both* treatment and outcome to fully explain away the observed effect — more general than Γ, works beyond matching.`,
      `**Contextualise the E-value against your observed covariates:** if it's *smaller* than the association of a confounder you already control for (e.g. E = 1.8 but industry sector has RR = 2.5), the residual-confounding threat is concrete, not hypothetical — report it honestly.`,
      `**Placebo tests give indirect evidence:** run the analysis on an outcome the treatment logically can't affect — a "significant" effect there means something correlated with treatment is driving the outcome, signalling confounding in the main estimate.`,
      `**It does *not* prove causality:** sensitivity analysis makes the fragility or robustness of a claim explicit — a high Γ is reassuring, not verification. It's a communication tool, not a proof.`,
    ],
  },
]
