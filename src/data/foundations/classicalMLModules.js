export const CLASSICAL_ML_MODULES = [
  {
    id: 'linear_regression',
    interactiveId: 'linear_regression_viz',
    title: 'Linear Regression from First Principles',
    subtitle: 'OLS, normal equation, geometric interpretation, assumptions',
    difficulty: 'foundational',
    estimatedMin: 28,
    tags: ['regression', 'OLS', 'linear models'],
    summary: `Here is a true story from over two hundred years ago. On the very first night of 1801, an astronomer spotted a faint new dot in the sky — a small world we now call Ceres. He watched it for about forty nights, and then it drifted behind the glare of the Sun and vanished. Everyone wanted it back, but to know where to point a telescope, you had to predict its whole orbit from just a handful of shaky, imperfect measurements. Nobody could do it.

Then a 24-year-old named Carl Friedrich Gauss tried something new. He took all those messy measurements and found the single orbit that fit them best — not perfectly, because the measurements had errors in them, but best in a way he could actually prove. He told the astronomers where to look. Ceres was right there.

The idea Gauss leaned on is called **least squares**, and it is the beating heart of what we now call **linear regression**. Before it, drawing the best line through noisy data was guesswork — everyone eyeballed it and got a different answer. Least squares turned "fit a line to the dots" from an art into a solved problem with one right answer. Two hundred years later it is still one of the first tools any data scientist reaches for. Let me show you how it works, brick by brick.

---

**The setup.**

Forget planets for a moment and take something homelier. You sell houses. For every house that sold last month you wrote down a few facts — how big it is, how many bedrooms, how nice the area is — and the price it sold for. Now a new house comes up, and you need to guess its price.

Your instinct is the right one. A bigger house costs more. More bedrooms cost more. A nicer area costs more. So take each fact, give it a weight for how much it matters, and add them up:

price ≈ w₁ × size + w₂ × bedrooms + w₃ × area score

That is the whole model. Pick the three weights and you can price any house. So the entire game comes down to one question: how do we pick good weights?

---

**How wrong are we?**

To find good weights, we first have to measure bad ones. You already know what last month's houses actually sold for, so use your weights to predict those same houses and compare each guess to the truth. How far off you were on one house is called the **residual** — a fancier word for the miss.

[FIGURE: least_squares]

One miss is easy. But we want a single score for how wrong the weights are across *all* the houses. The most natural idea is to average the misses. Careful though — some guesses are too high and some too low, so the misses have opposite signs and cancel out. A terrible model could average to nearly zero just by luck.

The fix is to throw away the signs. Take the size of each miss, ignore whether it was over or under, and average those. That gives you the **mean absolute error**, or **MAE** — plainly, "on average, how many dollars off are we?" It is honest, easy to read, and a couple of wild houses barely move it.

But when it comes to actually *finding* the best weights, we usually reach for MAE's cousin. Instead of taking the size of each miss, we **square** it, then average. That is the **mean squared error**, or **MSE**, and it does two things MAE does not. First, squaring makes one big miss count for far more than several small ones, so the model works hardest to avoid the embarrassing, way-off guesses. Second — and this is the part that matters most — squaring makes the whole thing smooth, which, as you are about to see, is exactly what lets us solve for the best weights in one clean shot.

Either way, this single number — how wrong the weights are, all together — is called the **loss**. And now the whole job fits in one sentence: find the weights that make the loss as small as possible.

---

**The beautiful part: solving it in one step.**

Here is where least squares earns its fame. Picture the loss as a landscape: the weights are your position, and the loss is the height of the ground under you. Because we squared the misses, that landscape is a smooth bowl — one single lowest point, no other dips to fall into. And the bottom of a bowl is exactly the spot where the ground goes flat.

So we do not have to wander around trying weights and checking the loss. We just ask math for the point where the slope is flat, and it hands back one formula that gives the best weights directly:

$θ̂ = (XᵀX)⁻¹Xᵀy$

Do not worry about the symbols yet. The thing to feel is the magic: for a straight-line model, we never search — we solve, in a single step, and get the provably best weights every time. That is the same trick that let Gauss find a lost planet. The one-step solution is called **ordinary least squares**, or **OLS**, and that is the entire engine.

---

**A warning about trusting the weights.**

Now a catch that trips up almost everyone. Suppose two of your facts move together — bigger houses usually have more bedrooms, so size and bedroom count rise and fall as a pair. The model wants to hand out credit for the price, some to size and some to bedrooms. But because the two always move together, it cannot tell which one is really doing the work. It might load most of the weight onto size, or most onto bedrooms, and both choices predict prices about equally well.

So the weights turn shaky. Train on a slightly different batch of houses and those two weights can jump around — one run gives size a positive weight, the next run gives it a negative weight, as if a bigger house should cost *less*. Meanwhile the actual price predictions barely change. This is called **collinearity**. And notice carefully what is and is not moving: the two facts are still exactly as correlated as before — that is a fixed fact about your data and it does not budge. It is the *weights* that have gone unreliable, not the correlation.

Why care? Because people read the weights to decide which fact matters. See a weight near zero and think "this one does nothing, drop it," and you can be badly wrong — the weight may be tiny only because its twin grabbed the credit. The usual fix is a method called **Ridge**, which keeps the weights from growing wild and shaky. How it does that is its own lesson.

---

**How good is the fit, really?**

Say you have trained the model and its total squared error comes out to some big number. Is that good? On its own it means nothing. Fifty million squared-dollars — compared to what?

You need a yardstick, and the fairest one is the dumbest possible model: the one that ignores every fact about the house and just guesses the same number every time — the average price. Call it the lazy model. How wrong is the lazy model? Take each house's price, subtract the average, square it, and add it all up. That total is simply the spread of prices around their average, and that spread has a famous name: the **variance**. (Take its square root and you are back in real dollars — that is the **standard deviation**. And the average you started from is the **mean**. Mean, then variance, then standard deviation, each one built on the one before.)

Now comes the clever comparison. **R²** just asks: of all the error the lazy mean-model was stuck with, how much did your model clear away?

R² = 1 − (your model's squared error ÷ the lazy model's squared error)

Read it straight off. R² = 0 means you are no better than guessing the average — useless. R² = 1 means you nailed every house. R² = 0.8 means you wiped out 80% of the error the lazy model had. Now the number finally means something, because it is measured against a floor.

R² is the first thing to look at when you judge a linear regression — but it hides one trap. Add a new fact to the model, even one that is pure random noise, and R² never goes down. The model can always use junk to shave a sliver off the training error. So plain R² quietly rewards piling on useless features. The fix is **adjusted R²**, which charges a small fee for every fact you add: if a new fact does not earn its keep, adjusted R² falls. So when you are deciding whether a feature belongs, trust adjusted R², not plain R².

---

**One last habit — the most useful one.**

Even a high R² can fool you, and this final trick catches it. Suppose the real relationship actually curves, but you fit a straight line anyway. You can still score an impressive R² of 0.95 and still be wrong about the shape.

To catch it, take your misses and plot them against your predictions. If the straight line is right, the misses should scatter randomly around zero — no pattern at all. But if the truth was a curve, the misses fall into a clear shape — often a U, too low in the middle and too high at the ends. That U is the model quietly telling you the straight line is the wrong shape. R² will never warn you. The plot of the misses always will.

So before you trust any straight-line model: plot the misses and look. Gauss would have.

---

**The fine print: what OLS quietly assumes.**

That residual plot isn't just a nicety — it's how you check the promises OLS silently makes. There are five, and it helps to split them into two piles.

The first pile is what you need just to *predict* well. One: the relationship really is a straight line (linearity). Two: no feature is a near-copy of another (no perfect multicollinearity) — the collinearity trap from earlier. If these hold, your predictions are trustworthy even if nothing else does.

The second pile is what you additionally need to *trust the weights and their uncertainty* — the inference layer we're about to meet. Three: the errors have zero mean *given the features* (exogeneity) — the model isn't systematically wrong in any region. Four: the errors all have the same spread (homoscedasticity). Five: the errors are independent of each other (no autocorrelation). Break these and your *predictions* can still be fine, but every confidence interval and p-value you quote is off. That split — prediction assumptions versus inference assumptions — is the thing most people fumble in an interview.

---

**When the spread isn't even: heteroscedasticity.**

Look again at a residual plot that fans out — tight on the left, wide on the right. That's **heteroscedasticity**: the errors are bigger for pricier houses. Here's the subtle part interviewers love. Your weights are *still unbiased* — on average they're centered on the truth. What breaks is the *uncertainty* around them: the standard errors, confidence intervals, and hypothesis tests all become unreliable, usually too optimistic. So you keep predicting fine but start *believing* things about your weights that aren't warranted. The fixes: robust ("sandwich") standard errors, or a transform like modeling log(price) instead of price.

---

**One weird house can move the whole line: leverage and influence.**

"What if a single data point changes your slope?" is a classic. Two different things are going on. **Leverage** is a point with an extreme *feature* value — a 20-bedroom mansion sitting far out on the size axis. It has the *potential* to swing the line hard, just by being far out. **Influence** is when a point *actually* does swing it — high leverage *and* a price that fights the trend. **Cook's distance** measures exactly this: how much every weight would move if you deleted that one house. A point with big Cook's distance is one row quietly steering your whole model. You find these by looking, not by trusting the summary metrics — R² won't flinch.

---

**Reading the weights like a statistician: the inference layer.**

So far we've used the weights to *predict*. But often the real question is "does size actually matter, or did we imagine it?" That needs the inference layer. Around each weight you compute a **standard error** — how much that weight would jitter across different samples. Divide the weight by its standard error and you get a **t-statistic**; feed that through and you get a **p-value** — the odds of seeing a weight this big if the true effect were zero. Wrap the weight in ±2 standard errors and you get a **confidence interval**. This is what lets you say "one more bedroom adds \\$12k, and we're 95% sure it's between \\$8k and \\$16k" instead of just "\\$12k."

And why is OLS the natural tool for this? The **Gauss-Markov theorem**: when those assumptions hold, OLS is **BLUE** — the Best Linear Unbiased Estimator, meaning among all unbiased straight-line methods, none has smaller variance. That's the deep reason least squares earns its place, not just tradition. (Note: scikit-learn gives you the weights but not p-values or intervals — for those you reach for statsmodels.)

---

**How the computer actually solves it.**

We wrote the one-step answer as $θ̂ = (XᵀX)⁻¹Xᵀy$, but no careful library computes it that literally. Forming XᵀX and inverting it *squares* how sensitive the math is to nearly-collinear features, so it can blow up numerically. Real solvers (scikit-learn included) instead use **QR** or **SVD** decompositions — same answer in exact arithmetic, far more stable when features are correlated or poorly scaled. Worth knowing that the textbook formula and the production code disagree on purpose.

---

**Picking the right yardstick.**

R² tells you how much you beat the lazy mean-model, but for reporting error you'll usually quote one of a few. **MAE** is the plain average dollar miss — easy to read, shrugs off a few wild houses. **RMSE** squares before averaging, so it punishes big misses harder and stays in dollars — use it when large errors are especially costly. **MAPE** reports the miss as a *percentage* of each price, which travels across scales but explodes when true values are near zero and punishes over-prediction unevenly. And **R²** is the unitless "fraction of variance explained" for a quick sense of fit. Match the metric to the question: absolute dollars (MAE/RMSE), relative error (MAPE), or overall fit (R²).`,
    keyPoints: [
      `**In one line: OLS finds the weights that make the total squared miss as small as possible.**\n\nUse linear regression first whenever you are predicting a number and "add up the facts, each with its own weight" is a sensible guess. Its big advantage is that you can read the weights straight off — one more bedroom adds about so many dollars. It is fast, it is simple, and it is the baseline every fancier model has to beat. Move to something else when the residual plot curves (the real shape is not a straight line), when facts clearly work together, or when the answer has to stay inside fixed limits — like a probability between 0 and 1, which a straight line cannot respect.`,
      `**The trap that catches people: when two facts move together, their weights stop being trustworthy — but the predictions still look fine, so nothing warns you.**\n\nIf size and total rooms almost always rise together, OLS splits the credit between them however it likes, and a different batch of houses splits it differently. The two weights wobble, but their combined effect stays steady — so the predictions look healthy. That is why "this weight is near zero, let us drop the fact" is dangerous: the weight may be small only because its twin took the credit. Add Ridge (a small penalty) before you trust any list of which facts matter.`,
      `**The one check to run every time: plot the misses against the predictions.**\n\nIf the misses scatter evenly around zero, the straight line fits. If they form a U or any clear pattern, the shape is wrong — and a curved plot with R² = 0.95 is worse than a messy one with R² = 0.60, because now you are confidently wrong. If the misses fan out wider as predictions grow, the errors get bigger for pricier houses; the predictions can still be fine, but any confidence range you quote is off. R² hides all of this. The plot of the misses shows it.`,
      `**Split the assumptions into two piles — predicting well needs less than trusting the weights.**\n\nTo *predict* you mainly need a genuinely linear relationship and no near-duplicate features. To also *trust the standard errors, p-values, and intervals*, you additionally need errors with zero mean given the features (exogeneity), equal spread (homoscedasticity), and independence (no autocorrelation). Heteroscedasticity is the classic gotcha: it leaves your weights unbiased but makes their uncertainty wrong, so predictions stay fine while every confidence interval quietly lies. Fix with robust standard errors or a log transform.`,
      `**Know the difference between leverage and influence — and that one row can steer the whole model.**\n\nLeverage is a point with an extreme *feature* value (it has the potential to swing the line); influence is when it actually does (extreme feature value *and* a target that fights the trend). Cook's distance measures how much the weights move if you delete that one point — a big value means one row is running your model. And this is what the inference layer buys you: standard errors, t-stats, p-values, and confidence intervals turn "one bedroom adds \\$12k" into "\\$12k, 95% sure it's \\$8k–\\$16k." OLS is the natural tool because Gauss-Markov says it is BLUE — the minimum-variance unbiased linear estimator — when the assumptions hold. (scikit-learn gives weights only; use statsmodels for p-values and intervals.)`,
      `**Match the error metric to the question, and don't compute the normal equation literally.**\n\nMAE = average dollar miss (robust, readable); RMSE = squares first, so it punishes big misses and is the one to quote when large errors are costly; MAPE = percentage error that travels across scales but explodes near zero; R² = unitless fraction of variance explained. On implementation: nobody careful inverts XᵀX directly — squaring the condition number is numerically dangerous — so real solvers (scikit-learn included) use QR or SVD for the same answer with far more stability on correlated or badly scaled features.`,
    ],
    interactivePrompt: `Before you touch the controls: if you add a feature that is almost a perfect copy of one you already have, do you expect the model's predictions to get worse, stay about the same, or get better?`,
    checkQuestions: [
      {
        q: `In OLS, why do we square each miss before adding them up, instead of just adding the raw misses?`,
        options: [
          `\`A) Because raw misses cancel — a too-high guess and a too-low one add to near zero and hide bad weights. Squaring drops the signs so nothing cancels, and it makes big misses count for much more.\``,
          `\`B) Because squaring turns the model non-linear, and that is what lets a straight-line model bend to fit curved data instead of only straight relationships.\``,
          `\`C) Because it is only tradition — adding the absolute values of the misses gives the exact same weights, just with a little more arithmetic to do.\``,
          `\`D) Because squaring puts the error back into the target's real units (dollars, not dollars squared), so the final loss reads as an average price error.\``,
        ],
        answer: `A`,
      },
      {
        q: `Two of your features have correlation 0.99. What happens to the OLS weights, and how do Ridge and Lasso differ here?`,
        options: [
          `\`A) The weights are only slightly inflated but still reliable — correlation causes real trouble only once it hits exactly 1.0. Ridge and Lasso both shrink them, Lasso just harder.\``,
          `\`B) OLS cannot run at all because the math is singular; Ridge and Lasso both repair it and, for correlated features, hand back identical weights.\``,
          `\`C) OLS still runs, but the two weights turn shaky — a small change in the data swings them and can flip their signs, while the predictions barely move. Ridge shrinks them to similar steady values; Lasso keeps one and zeros the other, and which it keeps can change each run.\``,
          `\`D) Both OLS and Ridge quietly drop one of the two features to kill the redundancy; the only difference is the rule each uses to decide which feature to drop.\``,
        ],
        answer: `C`,
      },
      {
        q: `Your model shows R² = 0.95, but the misses make a clear U-shape when plotted against the predictions. What does that tell you?`,
        options: [
          `\`A) It is just random noise — with R² this high the misses are bound to wander a little, and there is nothing you need to do about it.\``,
          `\`B) The straight line is the wrong shape — it comes in too low at the ends and too high in the middle. A high R² does not save you; it only measures variance explained, not shape. Fix by adding curve terms or a model that can bend, then re-check.\``,
          `\`C) It points to a few outliers at the extremes stretching the error; clip the target at the top and bottom and both R² and the miss pattern will settle down.\``,
          `\`D) It means the errors run in time order (autocorrelation), so switch to a time-series model even though the data is not ordered by time.\``,
        ],
        answer: `B`,
      },
      {
        q: `You add a brand-new feature to your model — one that is really just random noise. Your R² ticks up a little. Should you keep the feature, and what number should you have looked at instead?`,
        options: [
          `\`A) Yes — any rise in R², however small, means the feature is adding real predictive value, so it has earned its place in the model.\``,
          `\`B) No — R² almost always creeps up when you add a feature, even a useless one, because the model can fit a little more training noise. Look at adjusted R² instead: it charges a fee per feature, so a noise feature makes it fall. If adjusted R² drops, leave the feature out.\``,
          `\`C) Yes — extra random features act like a mild regulariser, smoothing the model and helping it generalise to houses it has not seen.\``,
          `\`D) No — but the real fix is to standardise the noise feature so its scale matches the others, after which R² will correctly drop and tell you to remove it.\``,
        ],
        answer: `B`,
      },
      {
        q: `Your residual plot fans out — tight errors for cheap houses, wide errors for expensive ones (heteroscedasticity). What is the real consequence?`,
        options: [
          `\`A) The weights themselves become biased and point in the wrong direction, so the predictions are systematically too high or too low and cannot be trusted.\``,
          `\`B) The weights stay unbiased and the predictions are still fine — but the standard errors, confidence intervals, and p-values become unreliable, so any statement about how sure you are of a weight is off. Fix with robust standard errors or a log transform.\``,
          `\`C) Nothing meaningful — fanning residuals are a display artifact of plotting against predictions, and switching the x-axis to a single feature makes them disappear.\``,
          `\`D) It proves the relationship is non-linear, so the only remedy is to add polynomial terms until the fan closes up.\``,
        ],
        answer: `B`,
      },
      {
        q: `An interviewer asks: "One data point has an extreme size value AND a price that fights the overall trend. What is it, and how would you catch it?"`,
        options: [
          `\`A) It is a leverage point but not an influential one, because leverage depends only on the target value, not the feature value.\``,
          `\`B) It is simple label noise; the fix is to average it with its nearest neighbours before fitting so its effect is diluted.\``,
          `\`C) It is an influential point — high leverage (extreme feature value) combined with a target that opposes the trend, so it actually swings the fitted line. Cook's distance flags it by measuring how much the weights move if you delete that single row.\``,
          `\`D) It is a multicollinearity symptom, detected with the variance inflation factor, and removed by dropping one of the correlated features.\``,
        ],
        answer: `C`,
      },
      {
        q: `Why is OLS considered special under its assumptions, and what does the textbook formula θ̂ = (XᵀX)⁻¹Xᵀy hide about real solvers?`,
        options: [
          `\`A) It is special because it minimises absolute error, which is why it resists outliers; real solvers compute the inverse of XᵀX directly because that is the fastest route.\``,
          `\`B) The Gauss-Markov theorem says OLS is BLUE — the Best Linear Unbiased Estimator, minimum variance among unbiased linear methods — when the assumptions hold. Real solvers avoid forming and inverting XᵀX (which squares the numerical sensitivity) and use QR or SVD instead for the same answer with far better stability.\``,
          `\`C) It is special only because it is fast to compute; there is no theoretical optimality result, and the formula is exactly what production code runs.\``,
          `\`D) The theorem guaranteeing OLS optimality is the central limit theorem, and the formula is unstable only when the number of rows exceeds the number of columns.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Least squares picks the weights that make the total squared miss smallest, and for a straight line one formula solves for them in a single step — the same trick Gauss used to find a lost planet. Judge the fit with R² (how much you beat the lazy "always guess the average" model), and switch to adjusted R² once you start adding features. Never trust a single weight when two facts move together, and always plot the misses — because R² cannot see a wrong shape, but the misses can.`,
    recap: [
      "**OLS = weights that minimise total squared miss.** Squaring: signs don't cancel, big misses dominate, loss is a smooth bowl.",
      "**One-step solve:** θ̂ = (XᵀX)⁻¹Xᵀy — no search, provably best weights (Gauss's planet trick).",
      "**Collinearity:** correlated facts → weights wobble and can flip sign, predictions stay fine. Fix: Ridge.",
      "**R²** = fraction of the lazy mean-model's error you cleared; switch to **adjusted R²** once you add features (junk features never lower plain R²).",
      "**Always plot the misses vs predictions.** R² can't see a wrong shape; a U-pattern can.",
      "**Two assumption piles:** predict well (linearity, no near-duplicate features) vs trust the weights (exogeneity, homoscedasticity, independence). Heteroscedasticity → weights unbiased but standard errors lie.",
      "**Real solvers use QR/SVD, not literal (XᵀX)⁻¹** — inverting squares the numerical sensitivity.",
    ],
    interactiveId: 'linear_regression_viz',
    figures: {
      least_squares: `<svg viewBox="0 0 360 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">Least squares: minimise the total squared miss</text>
  <line x1="42" y1="175" x2="330" y2="175" stroke="var(--rim)" stroke-width="1"/>
  <line x1="42" y1="40" x2="42" y2="175" stroke="var(--rim)" stroke-width="1"/>
  <text x="186" y="200" text-anchor="middle" fill="var(--ink-low)" font-size="9">size of house</text>
  <text x="18" y="110" text-anchor="middle" fill="var(--ink-low)" font-size="9" transform="rotate(-90 18 110)">price</text>
  <line x1="52" y1="160" x2="322" y2="58" stroke="var(--prime)" stroke-width="2.5"/>
  <text x="300" y="52" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">best-fit line</text>
  <g stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="3 2">
    <line x1="82" y1="120" x2="82" y2="148"/>
    <line x1="140" y1="118" x2="140" y2="100"/>
    <line x1="200" y1="98" x2="200" y2="126"/>
    <line x1="258" y1="90" x2="258" y2="72"/>
  </g>
  <g fill="var(--ink-hi)">
    <circle cx="82" cy="148" r="4"/><circle cx="140" cy="100" r="4"/><circle cx="200" cy="126" r="4"/><circle cx="258" cy="72" r="4"/>
  </g>
  <text x="200" y="150" text-anchor="middle" fill="var(--amber)" font-size="9" font-weight="700">residual = vertical gap (dot − line)</text>
  <text x="180" y="169" text-anchor="middle" fill="var(--ink-low)" font-size="8.5">loss = sum of these gaps, each squared</text>
</svg>`,
    },
  },
  {
    id: 'logistic_regression',
    interactiveId: 'logistic_regression_viz',
    title: 'Logistic Regression',
    subtitle: 'Sigmoid, cross-entropy loss, decision boundary, calibration',
    difficulty: 'foundational',
    estimatedMin: 24,
    tags: ['classification', 'logistic regression', 'calibration'],
    summary: `Here is a question doctors have asked for a very long time: will this patient have a heart attack in the next ten years? You cannot answer that honestly with a flat yes or no — nobody knows the future. What you *can* give is a **probability**: this patient has a 12% chance. That is the real job. It is a **classification** problem — the outcome is one of two classes, heart attack or not — but we do not want a bare label, we want a number between 0 and 1 we can trust. Logistic regression is the tool that has quietly done this job for medicine, banking, and half the internet for decades. Let me show you how it pulls it off.

There is a nice bit of history hiding in the name. Almost two hundred years ago a mathematician named Verhulst was studying how populations grow — not in a straight line, but slow at first, then fast, then flattening out as food and space run low. He drew that S-shaped curve and called it the **logistic** curve. Decades later people noticed the very same S-curve is perfect for a completely different task: taking any number and gently squashing it into a probability between 0 and 1. That borrowed curve is the engine we are about to build.

---

**The setup.**

Start with what we already know how to build: a plain linear equation, w·x + b. Feed in the patient's numbers — age, blood pressure, cholesterol — and out comes a single number. But here is the snag. That number lives on the whole number line: it could be −4, or 3000. A linear equation will happily hand you 1.4 or −0.3, and those are nonsense as probabilities. So the one question that *defines* logistic regression is this: how do we bend the wide-open output of a linear equation down into the (0, 1) range of a probability?

---

**Building the bridge.**

The trick uses a pair of functions that undo each other. You already know one such pair: eˣ and its inverse, the natural log. eˣ takes any number and gives back a positive one — its output lives in (0, ∞). The natural log runs it backwards: hand it a positive number, it gives back any number at all. From that pair we build a second pair — the **logit** and the **sigmoid** — which also undo each other. The logit takes a probability in (0, 1) and stretches it out across the whole number line. The sigmoid, $σ(z) = 1/(1 + e^{-z})$, does the reverse: it takes any number and squashes it into (0, 1). That squash is exactly the bend we were hunting for — and yes, the sigmoid is the same S-curve Verhulst drew.

Now the move that makes everything click. A linear equation outputs a number on the whole line. A logit is also a number on the whole line. So instead of forcing the linear equation to spit out a probability directly, we let it predict the **logit**, then run that through the sigmoid to land on a clean probability. The linear part does what it is naturally good at; the sigmoid handles the bending.

[FIGURE: sigmoid_squash]

---

**But what is a logit, really?**

Here is the part most courses rush past, and it is the heart of the whole thing. A logit is the **log of the odds**.

Odds are just a way of comparing the two outcomes: the chance of the event divided by the chance of no event. If a heart attack is 75% likely, the odds are 0.75 / 0.25 = 3 — "three to one." Simple enough. But odds have an annoying lopsidedness. A probability of 0.99 gives odds of 99. Its mirror image, a probability of 0.01, gives odds of 0.01. Same distance from the middle, yet one number is 99 and the other a tiny sliver — you cannot line them up on a fair scale.

Wrapping the odds in a log fixes the lopsidedness at once. log(99) ≈ +4.6 and log(0.01) ≈ −4.6 — now they are clean mirror images around zero. That log-of-odds is the **logit**, and it is exactly the quantity our linear equation predicts. So the full pipeline is: linear equation → logit (log-odds) → sigmoid → probability.

And this hands us something lovely: one weight, read three ways. Say feature x₁ goes up by one unit and everything else stays fixed. The logit goes up by exactly w₁ — a clean, straight step. The odds get multiplied by $e^{w_1}$. And the probability itself moves in a curve — a lot in the middle, barely anything near 0 or 1. One weight, three honest stories.

---

**The second half: what loss do we train it with?**

Reach for the obvious loss — mean squared error, the one linear regression uses — and watch it fail. Take one patient who truly had a heart attack (target = 1). If the model predicted 0.9, the squared error is (0.9 − 1)² = 0.01 — tiny, and rightly so; the model was basically right. Now suppose the model predicted 0.0001. It was insisting this person was safe, about someone who was not — confidently, badly wrong. Yet the squared error is (0.0001 − 1)² ≈ 1. Just 1. The penalty barely moved.

That is the whole problem. A loss is the *cost we attach to being wrong* — it is how we tell the model how badly it messed up. MSE tells the model that a confident disaster (0.0001 when the truth is 1) costs about the same as a mild miss. So the model has no reason to fix its worst mistakes: the loss never screams. The signal is too flat to be any use.

**Log loss** (also called cross-entropy) fixes this by making the cost blow up as a confident prediction turns out wrong:

$L = -[\\,y\\log(\\hat{y}) + (1-y)\\log(1-\\hat{y})\\,]$

Because y is 0 or 1, only one of the two terms is ever active. For our patient (y = 1) the loss is just $-\\log(\\hat{y})$: predict 0.9 and the cost is a gentle 0.10; predict 0.0001 and the cost is $-\\log(0.0001) ≈ 9.2$ — nearly a hundred times bigger. Log loss punishes confident wrongness without any ceiling, which is exactly the message the model needs to hear. That is why we train classification with log loss, not MSE.

---

**Under the hood (the deeper why).**

There is a cleaner reason log loss wins, and you can see it in the gradient. Work out how log loss changes as you nudge the logit z, and the messy sigmoid-slope term cancels out perfectly, leaving just $\\partial L/\\partial z = \\hat{y} - y$ — the plain prediction error. MSE-with-a-sigmoid instead leaves behind an extra $σ(z)(1-σ(z))$ factor that shrinks to almost nothing exactly when the model is most confident and most wrong — so it barely learns from its worst mistakes. Log loss keeps a full-strength gradient no matter how wrong the model is.

Two failure modes are worth knowing. First, **perfect separation**: if some feature splits the two classes cleanly in the training data, the model can keep making its weights bigger to push every prediction toward a hard 0 or 1, and the weights run off toward infinity — training never settles (watch for exploding weights or a loss that turns into NaN). A small L2 penalty caps the weights and brings back a finite answer. Second, logistic regression tends to come out **well-calibrated when the model is correctly specified**: because it is trained to give high probability to what actually happened, a predicted 0.7 often really does mean about 70% in reality — something trees, SVMs, and boosting do not give you for free. But "well-calibrated" is a tendency, not a guarantee: heavy regularisation, class imbalance, a mis-specified model, or a shift between training and serving data can all break it, so you still verify calibration rather than assume it.

And it stretches past two classes: swap the sigmoid for the **softmax**, which turns a whole set of logits into probabilities that add up to 1, and train it with the same log-loss idea. The boundary it draws stays straight — a line in 2D, a flat plane in higher dimensions — so to bend it you must add curved or interaction features yourself. One practical habit: because the L2 penalty judges weights by size, standardise your features first, or a feature measured in the millions gets penalised on a completely different scale from one measured in single digits.

---

**Reading the weights the way a statistician does: odds ratios.**

We said a one-unit bump in a feature multiplies the odds by $e^{w}$. That number, $e^{w}$, is the **odds ratio**, and it is how logistic regression coefficients get reported in medicine and credit — "smokers have 2.3× the odds." Just like linear regression, each coefficient carries a **standard error**, so you can put a **confidence interval** around the odds ratio and a **p-value** on whether it differs from 1 (an odds ratio of 1 means "no effect"). This is the inference layer for classification. And the same tooling split applies: scikit-learn hands you the coefficients but not p-values or intervals — for those you use statsmodels' Logit on an unpenalised fit.

---

**The threshold is a business decision, not 0.5.**

Logistic regression's real output is a *probability*. Turning that probability into an action — flag this transaction, approve this loan — needs a **threshold**, and 0.5 is almost never the right one. The right threshold comes from the *cost of each mistake*. In fraud you can only review, say, 500 alerts a day, so you set the threshold to fill that queue with the highest-risk cases (a precision@K problem). In cancer screening a missed case (false negative) is far worse than a false alarm, so you drop the threshold to buy recall. In lending the costs are literally dollars. Separate the two steps cleanly: the model estimates probability, and *you* choose the decision threshold from the business costs.

---

**When one class is rare.**

If only 1% of transactions are fraud, a model that predicts "not fraud" every time is 99% accurate and completely useless — which is why **accuracy is the wrong metric under imbalance.** Three fixes work together. Weight the rare class more heavily in the loss (\`class_weight='balanced'\` in scikit-learn), so each rare example counts for more. Move the threshold, as above. And judge the model with the right curve: **PR-AUC** (precision-recall) is far more informative than **ROC-AUC** when positives are scarce, because ROC-AUC can look flattering while the model still floods you with false positives.

---

**The practical knobs: C, penalties, and solvers.**

Regularisation is not optional trivia here — it is how you control overfitting and tame perfect separation. One confusing detail trips people up: scikit-learn's \`C\` is the **inverse** of the penalty strength, so *smaller C means stronger* regularisation (C = 1/λ). You also choose the penalty type — **L2** (shrink weights), **L1** (drive some to exactly zero for feature selection), or **Elastic Net** (a blend) — and the penalty must match the solver: L1 and Elastic Net need a solver like \`saga\`, while the default \`lbfgs\` only does L2. Interview-ready summary: C = 1/λ, L1/L2/Elastic Net, and saga is the one solver that does them all.

---

**More than two classes.**

Two ways to go past yes/no. **One-vs-rest** trains one binary logistic model per class ("this class or not") and picks the highest scorer — simple, and each model is independently interpretable. **Multinomial** (softmax) logistic regression trains a single model over all classes at once, with probabilities that sum to 1, and is usually better calibrated across classes. scikit-learn supports both; multinomial is the default for most solvers.

---

**Making the straight boundary bend.**

The decision boundary logistic regression draws is *linear* in whatever feature space you give it — a line, a plane, a hyperplane. That is a real limit, but also a lever: you make the model as expressive as you like by *engineering the features*. Add interaction terms (age × blood_pressure) to let features combine, polynomial or spline terms to let a feature curve, and binning to let it jump in steps. Done well, this keeps the interpretability and calibration of logistic regression while letting it fit relationships a raw straight line never could — often you reach for a heavier model only after these run out.`,
    keyPoints: [
      `**What logistic regression really is: a linear equation that predicts the log-odds, and a sigmoid that turns that into a probability.**\n\nUse it as your first model for any yes/no question where you want a probability you can trust, not just a label — fraud, churn, default, click-through. Its coefficients read cleanly: a one-unit bump in a feature adds its weight to the log-odds and multiplies the odds by $e^{weight}$. It is fast, interpretable, and — uniquely among the common classifiers — calibrated out of the box. Reach for something heavier only when the boundary is clearly non-linear or the features interact in ways a straight line cannot capture.`,
      `**The trap that stops the model learning: training with MSE instead of log loss.**\n\nMSE caps the penalty for a confident wrong answer at around 1, so the model shrugs off its worst mistakes — and worse, its gradient shrinks to near zero exactly when the prediction is most confidently wrong, so it barely updates. Log loss (cross-entropy) makes the cost climb toward infinity as a confident prediction turns out wrong, and its gradient stays full-strength. Always train classification with cross-entropy. Watch too for perfect separation: a feature that splits the classes cleanly drives the weights toward infinity — a little L2 (in scikit-learn, a lower C) reins them back in.`,
      `**The diagnostic: read the reliability diagram — when the model says 0.7, is the real rate about 70%?**\n\nLogistic regression starts well-calibrated, but strong regularisation shrinks the logits and pulls probabilities toward the middle, and class imbalance can distort them. On a held-out set, bucket the predictions and compare each bucket's predicted probability against its actual positive rate. If the model says 0.8 where the truth is 0.55, it is overconfident — fix it with Platt scaling or isotonic regression fit on a *separate* calibration set, never the training set. And standardise features before fitting, since L2 is scale-sensitive.`,
      `**The output is a probability; the threshold is a separate business decision — and under imbalance, 0.5 and accuracy both betray you.**\n\nLet the model estimate probability, then choose the action threshold from the cost of each error: fill a fixed review queue (precision@K) for fraud, buy recall for cancer screening, weigh dollars for lending. When the positive class is rare, accuracy is meaningless (predict-the-majority scores 99%), so weight the rare class (\`class_weight='balanced'\`), move the threshold, and judge with PR-AUC rather than ROC-AUC, which flatters models that still spew false positives.`,
      `**Know the practical knobs cold: C is inverse regularisation, and the penalty must match the solver.**\n\nIn scikit-learn smaller \`C\` means *stronger* regularisation (C = 1/λ). Pick the penalty — L2 (shrink), L1 (sparse/select), or Elastic Net (blend) — and remember L1 and Elastic Net need a solver like \`saga\`; the default \`lbfgs\` only does L2. For more than two classes, one-vs-rest trains an independent binary model per class while multinomial (softmax) trains one joint model with probabilities summing to 1 and is usually better calibrated across classes.`,
      `**The boundary is linear in your feature space — so engineer the features to make it bend, and read coefficients as odds ratios.**\n\nLogistic regression can only draw a straight boundary in whatever space you hand it, so add interactions, polynomial, spline, or binned features to fit curved and combined relationships while keeping its interpretability. And report coefficients as odds ratios ($e^{w}$) with confidence intervals and p-values — an odds ratio of 1 means no effect — using statsmodels when you need the inference layer scikit-learn omits.`,
    ],
    interactivePrompt: `Before you touch the controls: if you replaced cross-entropy loss with MSE while keeping the sigmoid output, what do you expect happens to training when the model makes a very confident wrong prediction?`,
    checkQuestions: [
      {
        q: `A linear equation w·x + b can output any real number. Why can't we use that number directly as the probability for a yes/no classification, and what does logistic regression do about it?`,
        options: [
          `\`A) A linear output isn't bounded — it can be 1.4 or −0.3, which make no sense as probabilities. So logistic regression has the linear part predict the log-odds instead (which really can be any number), then feeds that through the sigmoid to squash it into a clean (0, 1) probability.\``,
          `\`B) A linear output is always positive, so it can climb above 1 but never fall below 0; logistic regression just divides by the biggest output seen so far to pull everything down into the (0, 1) range.\``,
          `\`C) A linear equation cannot capture how features interact, so its output is too plain to be a probability; the sigmoid's real job is to add those missing interaction terms between the features.\``,
          `\`D) The only real issue is the sign, since linear outputs can go negative; logistic regression takes the absolute value of the output and then simply caps it at 1.\``,
        ],
        answer: `A`,
      },
      {
        q: `In a trained logistic regression, feature x₁ has weight w₁ = 0.7. If x₁ increases by one unit while everything else is held fixed, what happens?`,
        options: [
          `\`A) The predicted probability goes up by exactly 0.7 — the same fixed jump, no matter what the starting probability happened to be before the change.\``,
          `\`B) The log-odds goes up by 0.7, so the odds get multiplied by e^0.7 ≈ 2.0, and the probability itself moves in a curve — a lot near the middle, very little near 0 or 1.\``,
          `\`C) The odds go up by 0.7 and the probability goes up by e^0.7, and both of them change in a straight line as the feature keeps increasing.\``,
          `\`D) Nothing you can read off — unlike linear regression, logistic regression weights carry no meaning in terms of any single individual feature.\``,
        ],
        answer: `B`,
      },
      {
        q: `For a sample whose true label is 1, the model predicts 0.0001 — confidently wrong. Why is log loss (cross-entropy) a better training signal than MSE in this case?`,
        options: [
          `\`A) MSE and log loss hand out the same penalty here, so the only real reason to prefer log loss is that it happens to be a little faster to compute in practice.\``,
          `\`B) MSE actually gives the bigger penalty in this case, but we still prefer log loss because it produces a smoother, nicer-shaped loss curve to optimise over.\``,
          `\`C) With MSE the squared error is only about 1 even for this disaster, so the penalty barely reflects how wrong the model is — and its gradient nearly vanishes right when the model is most confidently wrong. Log loss instead sends the cost toward infinity (−log(0.0001) ≈ 9.2) and keeps a full-strength gradient.\``,
          `\`D) MSE simply cannot be paired with a sigmoid output at all, since the two are mathematically incompatible, so log loss is the only loss a sigmoid model can ever be trained with.\``,
        ],
        answer: `C`,
      },
      {
        q: `While training on real patient data, the weights keep growing and the loss eventually becomes NaN. It turns out one feature separates the sick patients from the healthy ones perfectly in the training set. What is happening, and what is the fix?`,
        options: [
          `\`A) The features just are not scaled, so gradient descent keeps overshooting; dropping to a smaller learning rate on its own will settle the weights and remove the NaN.\``,
          `\`B) Because the classes are perfectly separable, the model can always cut the loss a little more by making its weights bigger (sharpening the sigmoid toward hard 0/1), so there is no finite best answer and they run off to infinity. A small L2 penalty (lower C in scikit-learn) caps them.\``,
          `\`C) A NaN loss means the label column has missing values on that one separating feature; once you fill in those missing labels, the training run stops diverging entirely.\``,
          `\`D) Perfect separation means the model has basically already solved the task, so the NaN is just a harmless display glitch that you can safely ignore and keep the model.\``,
        ],
        answer: `B`,
      },
      {
        q: `Only 1% of your transactions are fraud. Your logistic model reports 99% accuracy and 0.95 ROC-AUC, but the fraud team says it is useless. What is going on and what do you change?`,
        options: [
          `\`A) The model is genuinely excellent — 99% accuracy and 0.95 ROC-AUC are both strong, so the fraud team is likely misreading the dashboards rather than the model failing.\``,
          `\`B) Under 1% imbalance, accuracy is meaningless (predicting "not fraud" always scores 99%) and ROC-AUC can look high while precision is terrible. Judge with PR-AUC instead, weight the rare class (class_weight='balanced'), and set the decision threshold to fill the review queue with the highest-risk cases rather than leaving it at 0.5.\``,
          `\`C) The problem is purely the loss function — swap cross-entropy for MSE so the rare class is weighted more heavily, and both metrics will start reflecting real fraud-catching ability.\``,
          `\`D) ROC-AUC of 0.95 proves the ranking is fine, so nothing about the model needs to change; the only fix is to collect far more fraud examples before retraining.\``,
        ],
        answer: `B`,
      },
      {
        q: `You want L1-penalised logistic regression in scikit-learn and decide to make the penalty stronger. Which change is correct, and what must you check about the solver?`,
        options: [
          `\`A) Increase C to strengthen the penalty, and any default solver handles L1 since the penalty type is independent of the solver.\``,
          `\`B) Decrease C to strengthen the penalty (C = 1/λ, so smaller C means more regularisation), and use a solver that supports L1 such as saga — the default lbfgs only handles L2.\``,
          `\`C) Increase C to strengthen the penalty, but switch to lbfgs, which is the only solver that supports the L1 penalty and Elastic Net.\``,
          `\`D) The C value has no effect on penalty strength — it only sets the number of iterations — so you strengthen the penalty by raising max_iter and the solver choice is irrelevant.\``,
        ],
        answer: `B`,
      },
      {
        q: `An interviewer says: "Logistic regression only draws a straight decision boundary. How would you get it to separate two classes that are split by a curve?"`,
        options: [
          `\`A) You can't — a curved boundary is fundamentally impossible for logistic regression, so you must abandon it and move straight to a neural network or kernel SVM.\``,
          `\`B) Switch the loss from cross-entropy to hinge loss, which is what actually bends the boundary while leaving the features untouched.\``,
          `\`C) The boundary is linear only in the feature space you provide, so engineer richer features — polynomial and spline terms to let a feature curve, interaction terms to let features combine, binning to let it step — and the same linear model then fits a curved boundary while keeping its interpretability.\``,
          `\`D) Raise the classification threshold above 0.5, which reshapes the boundary from a straight line into a curve that follows the class split.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Logistic regression lets a linear equation predict the log-odds, then a sigmoid turns that into a probability — so one weight reads three ways: it adds to the log-odds, multiplies the odds by e^w, and moves the probability non-linearly. Train it with log loss, not MSE: log loss makes a confident wrong answer cost enormously and keeps the gradient alive, while MSE goes flat exactly when the model most needs to learn.`,
    recap: [
      "**Logistic regression = linear equation predicts the log-odds, sigmoid turns it into a probability** in (0,1).",
      "**One weight, three readings:** adds to the log-odds, multiplies the odds by e^w, moves the probability non-linearly.",
      "**Train with log loss, not MSE.** Log loss punishes confident-wrong enormously and keeps the gradient alive; MSE goes flat right when learning matters.",
      "**Output is a probability; threshold is a separate business call.** Under imbalance, 0.5 and accuracy both betray you.",
      "**Knobs:** C = inverse regularisation (small C = strong penalty); penalty must match the solver.",
      "**Boundary is linear in feature space** — engineer features to bend it; read coefficients as odds ratios.",
    ],
    interactiveId: 'logistic_regression_viz',
    figures: {
      sigmoid_squash: `<svg viewBox="0 0 360 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">The sigmoid squashes the whole line into (0, 1)</text>
  <line x1="30" y1="120" x2="330" y2="120" stroke="var(--rim)" stroke-width="1"/>
  <line x1="180" y1="42" x2="180" y2="185" stroke="var(--rim)" stroke-width="1"/>
  <line x1="30" y1="60" x2="330" y2="60" stroke="var(--rim)" stroke-width="0.75" stroke-dasharray="3 3"/>
  <line x1="30" y1="180" x2="330" y2="180" stroke="var(--rim)" stroke-width="0.75" stroke-dasharray="3 3"/>
  <text x="24" y="63" text-anchor="end" fill="var(--ink-low)" font-size="8.5">1</text>
  <text x="24" y="123" text-anchor="end" fill="var(--ink-low)" font-size="8.5">0.5</text>
  <text x="24" y="183" text-anchor="end" fill="var(--ink-low)" font-size="8.5">0</text>
  <path d="M30 179 C 120 178, 155 172, 180 120 C 205 68, 240 62, 330 61" fill="none" stroke="var(--prime)" stroke-width="2.5"/>
  <circle cx="180" cy="120" r="4" fill="var(--amber)"/>
  <text x="205" y="42" fill="var(--amber)" font-size="8.5" font-weight="700">σ(z)=1/(1+e⁻ᶻ)</text>
  <text x="315" y="200" text-anchor="end" fill="var(--ink-low)" font-size="8.5">z = w·x + b (any real number →)</text>
  <text x="45" y="200" text-anchor="start" fill="var(--ink-low)" font-size="8.5">← large negative z</text>
</svg>`,
    },
  },
  {
    id: 'regularization',
    interactiveId: 'regularization_viz',
    title: 'Regularisation Geometry',
    subtitle: 'L1 vs L2 geometry, Lasso sparsity, Ridge shrinkage, elastic net',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['regularisation', 'L1', 'L2', 'Lasso', 'Ridge'],
    summary: `Picture two students cramming for an exam. One learns the ideas — the reasoning behind each answer. The other memorises the practice answer key word for word. On that practice test the memoriser scores 100% and the thinker 90%. But on the real exam, with new questions, the thinker sails through and the memoriser falls apart — they learned the key, not the subject. That memoriser is a model that has **overfit**, and **regularisation** is how we stop it.

Here is where it bites in real life. You are predicting house prices with 100 features for only 200 houses — size, rooms, lot size, distance to school, and ninety-odd more, many of them overlapping. You fit plain least squares and the training fit looks incredible: R² of 0.98. Then you check houses it has never seen: R² of 0.51. It memorised the training set, noise and all.

---

**Why it overfits, and the one-line fix.**

Least squares has exactly one instruction: make the training error as small as possible, by any means. Nothing tells it to hold back. Give it 100 knobs to fit 200 points and it will use the spare freedom to bend through the noise — a giant positive weight here cancelled by a giant negative one there, contortions that fit these houses and no others.

So we change the instruction. We add a second piece to the loss: a penalty that grows with the size of the weights. The new loss is "training error **plus** lambda times the size of the weights," where lambda is a dial for how much we care.

Now watch the mechanism, because this is the whole thing. The model is trained by gradient descent, which does one job — nudge the weights, step by step, in whatever direction makes the loss smaller. The moment those big weights start adding a big number to the loss, gradient descent sees that cost and does the only thing it knows: it pushes the weights back down to bring the loss down again. Small weights are not a rule we impose from outside. They are what the model settles on by itself, once big weights start costing it. That is regularisation in one sentence: make big weights expensive, and gradient descent keeps them small.

---

**Two ways to measure "size", two different results.**

There are two honest ways to measure how big the weights are, and the choice matters more than you would guess.

Square each weight and add them up — that is **L2**, also called **Ridge**. It shrinks every weight smoothly toward zero, but never all the way; weights get tiny, never exactly zero.

Add up the plain sizes instead (ignoring sign) — that is **L1**, also called **Lasso**. This one does something Ridge cannot: it drives some weights to *exactly* zero, switching those features off completely. Lasso does feature selection for free.

[FIGURE: l1_l2_geometry]

Why the difference? There is a lovely picture for it. Draw the region the penalty allows the weights to live in. For L1 that region is a diamond with sharp corners sitting right on the axes; for L2 it is a smooth circle. The best answer is where the training-error rings first touch that region — and a diamond gets touched at a *corner*, which sits on an axis, where one weight is exactly zero. A circle has no corners, so it gets touched on a smooth edge, off the axes, where no weight is exactly zero. There is an even plainer way to say it: L1 pushes each weight toward zero with the *same* steady force no matter how small it already is, so it can finish the job and land on zero. L2's push *fades* as the weight shrinks, so it slows and stalls just short.

---

**When to use which, and the trap.**

Use **Lasso (L1)** when you believe only a handful of features truly matter and you want the model to pick them out for you. Use **Ridge (L2)** when you think many features each add a little, or when features are correlated and you want to keep them together. (A blend called **elastic net** does a bit of both.)

And one trap falls straight out of "we penalise weight size": a feature measured in dollars needs a tiny weight, while a yes/no feature needs a big one. The same penalty hits them completely unequally — the big-scale feature barely feels it, the small-scale one gets hammered. So **standardise your features first** (put them all on the same scale), or the penalty is quietly punishing features for their units instead of judging how useful they are.

---

**The real tradeoff underneath: bias for variance.**

Why does shrinking weights help at all? Because it trades one kind of error for another. An unconstrained model has *low bias* (it can fit any shape) but *high variance* (it swings wildly from one training sample to the next — that's the overfitting). Adding a penalty deliberately introduces a little **bias** — the weights are pulled away from the perfect training fit — in exchange for a large drop in **variance**. The goal is never "small weights for their own sake"; it's *lower error on unseen data*. You accept some bias because the variance you kill is worth more. That framing — regularisation buys variance reduction at the price of bias — is the one interviewers want to hear.

---

**How you actually pick lambda.**

Lambda isn't guessed; it's *tuned*. Sweep a range of values and, for each, measure error on held-out data with **cross-validation** — a **validation curve** of error versus lambda. Too little penalty and both train and validation error are the overfit gap; too much and the model underfits and both climb. The sweet spot is the lambda that minimises validation error. scikit-learn ships this as \`RidgeCV\` and \`LassoCV\` so the search is built in. Never pick lambda by looking at training error — it always prefers zero penalty.

---

**Ridge has a one-step formula too — and it explains why it helps.**

Just like OLS, Ridge has a closed form: $θ̂ = (XᵀX + λI)⁻¹Xᵀy$. Notice the only change from OLS is the $+λI$ added to the diagonal before inverting. That's not cosmetic — when features are correlated, XᵀX is nearly singular and blows up on inversion (the exact source of those wild, unstable weights). Adding $λI$ lifts the diagonal and makes the matrix cleanly invertible again. So Ridge literally *stabilises the inversion*, which is why it tames collinearity.

---

**The naming mess across libraries.**

This trips people up constantly, so nail it. In scikit-learn, \`Ridge\` and \`Lasso\` take **alpha** as the penalty strength (bigger alpha = more regularisation). But \`LogisticRegression\` and \`LinearSVC\` take **C**, which is the *inverse* (C = 1/λ, so *smaller* C = more regularisation). And \`ElasticNet\` takes **alpha** for overall strength plus **l1_ratio** to mix L1 and L2 (l1_ratio=1 is pure Lasso, 0 is pure Ridge). Same idea, three different dials.

---

**Don't penalise the intercept.**

One subtlety: the intercept (bias term) is usually *not* regularised. Penalising it would drag your predictions toward zero for no good reason — the intercept just anchors the overall level, it isn't a feature whose influence you want to shrink. Libraries handle this for you, but it's why you *center* features (and why standardising matters): with centered features the intercept stays meaningful and the penalty only touches the actual feature weights.

---

**Lasso's sharper limits.**

Beyond the "which correlated feature gets kept is unstable" issue, Lasso has a hard structural limit: in a wide problem with more features than samples (p > n), it can select **at most about n features** before it runs out — a real problem in genomics or text where p is huge. It can also over- or under-select depending on lambda. Elastic net was invented partly to fix exactly these Lasso failures: it keeps L1's sparsity while L2's presence lets it select more than n features and hold correlated groups together.

---

**Not just linear regression.**

Finally, regularisation isn't a linear-regression trick — it's everywhere. It's the \`C\` in logistic regression and SVMs, the margin-softening in SVMs, and **weight decay** in neural networks (L2 on the network's weights). The penalty interacts differently with each loss and solver, but the core move is identical: add a cost on complexity so the optimiser stops chasing the training noise.`,
    keyPoints: [
      `**What regularisation does: it adds a penalty on weight size to the loss, so gradient descent keeps the weights small and the model simple.**\n\nReach for it any time you have many features relative to your data, or you see a big gap between training and test performance — the classic sign of overfitting. Use Ridge (L2) as your default; it shrinks everything gently and handles correlated features well. Use Lasso (L1) when you suspect most features are useless and you want the model to zero them out and hand you a short list. The dial is lambda (in scikit-learn often called alpha, or C = 1/lambda for logistic regression): more penalty means a simpler model.`,
      `**The trap: Lasso's feature picks get shaky when features are correlated.**\n\nIf two features carry nearly the same information, Lasso keeps one and zeros the other — but which one it keeps can flip from one training run to the next. So do not read Lasso's chosen features as gospel. If the selected set changes across cross-validation folds, switch to elastic net, which blends in a little Ridge and tends to keep correlated features together instead of picking one at random.`,
      `**The habit that is not optional: standardise your features before any regularised model.**\n\nBecause the penalty judges weights purely by size, a feature on a huge scale (income in dollars) needs a tiny weight and barely gets penalised, while a 0/1 flag needs a big weight and gets hammered — even if they are equally useful. Put every feature on the same scale first (subtract the mean, divide by the standard deviation). Skip this and the penalty punishes features for their units, not their usefulness, and the whole model tilts toward the large-scale ones.`,
      `**The framing to state out loud: regularisation trades a little bias for a big drop in variance, and lambda is tuned, not guessed.**\n\nAn unconstrained model is low-bias but high-variance (it overfits); the penalty adds bias to kill variance, and the target is lower error on unseen data, not small weights for their own sake. Pick lambda by cross-validation — sweep values and take the one that minimises validation error (\`RidgeCV\`/\`LassoCV\`) — never by training error, which always wants zero penalty. Too little penalty overfits; too much underfits; both raise validation error.`,
      `**Ridge has a closed form that shows why it works, and the library naming is a minefield.**\n\nRidge solves $θ̂ = (XᵀX + λI)⁻¹Xᵀy$: the $+λI$ lifts the diagonal so a near-singular XᵀX (from correlated features) becomes cleanly invertible — that's literally how Ridge stabilises collinearity. On naming: scikit-learn's \`Ridge\`/\`Lasso\` use \`alpha\` (bigger = more penalty), \`LogisticRegression\`/\`LinearSVC\` use \`C\` = 1/λ (smaller = more penalty), and \`ElasticNet\` uses \`alpha\` plus \`l1_ratio\` to blend L1 and L2. Also: don't regularise the intercept — center features so it stays meaningful.`,
      `**Know Lasso's hard limits and that regularisation reaches far beyond linear regression.**\n\nWith more features than samples (p > n), Lasso can select at most about n features and its picks are unstable under correlation — elastic net was designed to fix both by keeping L1 sparsity while L2 lets it exceed n features and hold correlated groups together. And the same idea is everywhere: the \`C\` in logistic regression and SVMs, the soft margin in SVMs, and weight decay (L2) in neural networks — add a cost on complexity so the optimiser stops chasing training noise.`,
    ],
    interactivePrompt: `Before you touch the controls: with two features that are perfectly correlated, do you expect Lasso to zero out one of them, both of them, or neither — and does Ridge behave the same way?`,
    checkQuestions: [
      {
        q: `You add a penalty on the size of the weights to the loss. Why does that actually make the trained weights come out smaller?`,
        options: [
          `\`A) Because the model is trained by gradient descent to shrink the loss, and once big weights start inflating the loss, gradient descent pushes them back down to bring the loss down — small weights are simply what the model settles on once big ones cost it.\``,
          `\`B) Because the penalty term mathematically caps each weight at a fixed maximum value, so no single weight is ever allowed to grow past the hard limit that the lambda setting puts in place.\``,
          `\`C) Because adding the penalty deletes the features that carry the largest weights before training even starts, leaving only naturally small-weight features for the model to fit.\``,
          `\`D) Because the penalty quietly rescales the input features to be smaller, and smaller inputs always produce smaller fitted weights on the other side of the equation.\``,
        ],
        answer: `A`,
      },
      {
        q: `Ridge (L2) and Lasso (L1) both shrink weights, but only Lasso drives some all the way to exactly zero. Why?`,
        options: [
          `\`A) Because L2 is applied before training while L1 is applied afterward, so only L1 gets a final chance to round the smallest surviving weights down to exactly zero once the fitting has finished.\``,
          `\`B) L1 pushes each weight toward zero with the same steady force no matter how small it already is, so it can finish the job and land on zero. L2's push fades as the weight shrinks, so it stalls just short — tiny, but never exactly zero.\``,
          `\`C) Because L2 only ever shrinks the positive weights while L1 shrinks both positive and negative ones, and it is specifically those negative weights that end up driven all the way down to zero.\``,
          `\`D) Because Lasso simply runs with a much larger lambda than Ridge by default, and any penalty that is large enough will force weights to zero regardless of whether it is L1 or L2.\``,
        ],
        answer: `B`,
      },
      {
        q: `You fit a regularised model on features in wildly different units — income in dollars, plus a few 0/1 flags. What must you do first, and why?`,
        options: [
          `\`A) Nothing special — regularised models rescale their inputs internally, so mixed units are handled automatically, and standardising by hand would just undo that and hurt the fit.\``,
          `\`B) Drop the 0/1 flags, since binary features cannot be regularised on the same footing as continuous ones and will otherwise dominate the penalty term entirely.\``,
          `\`C) Standardise every feature to a common scale first. The penalty judges weights only by size, so a dollar feature needs a tiny weight and is barely penalised, while a 0/1 flag needs a big weight and gets hammered — even if they matter equally. Without scaling the penalty punishes units, not usefulness.\``,
          `\`D) Raise lambda until the dollar-scale feature's weight shrinks to match the flags' weights in size, which balances the penalty across the different units without any need to rescale the data.\``,
        ],
        answer: `C`,
      },
      {
        q: `An interviewer asks: "What is regularisation doing in bias-variance terms, and how do you choose the penalty strength?"`,
        options: [
          `\`A) It reduces bias without touching variance, and you choose lambda by picking the value that gives the lowest training error.\``,
          `\`B) It reduces both bias and variance simultaneously, and lambda is a fixed constant (usually 1.0) that rarely needs changing.\``,
          `\`C) It deliberately adds a little bias to buy a large reduction in variance, aiming for lower error on unseen data — not smaller weights for their own sake. You choose lambda by cross-validation (a validation curve of error vs lambda), taking the value that minimises validation error, never training error.\``,
          `\`D) It increases variance to reduce bias, which is why heavily regularised models overfit; lambda is chosen to be as large as possible to maximise that effect.\``,
        ],
        answer: `C`,
      },
      {
        q: `Ridge regression's closed form is θ̂ = (XᵀX + λI)⁻¹Xᵀy. What does the +λI term accomplish beyond shrinking weights?`,
        options: [
          `\`A) It adds a bias column to the feature matrix so the intercept gets regularised along with the other weights, which is the main point of Ridge.\``,
          `\`B) When features are correlated, XᵀX is nearly singular and explodes on inversion; adding λI lifts the diagonal so the matrix becomes cleanly invertible again — that is how Ridge stabilises collinearity, not just shrinks.\``,
          `\`C) It converts the L2 penalty into an L1 penalty, which is what lets Ridge drive some weights to exactly zero for feature selection.\``,
          `\`D) It rescales the features to unit variance inside the formula, removing the need to standardise the data before fitting a Ridge model.\``,
        ],
        answer: `B`,
      },
      {
        q: `You have 5,000 gene features but only 200 patients (p ≫ n) and want a sparse model. Why might plain Lasso disappoint, and what fixes it?`,
        options: [
          `\`A) Lasso cannot run when p > n at all; the only option is to reduce features by hand with PCA before any L1 model will fit.\``,
          `\`B) Lasso overfits because L1 has no effect in high dimensions; switching to a larger training set is the only real remedy.\``,
          `\`C) Lasso can select at most about n (~200) features before it saturates, and with correlated genes its picks are unstable across runs. Elastic net fixes both: L1 keeps sparsity while the added L2 lets it exceed n features and hold correlated groups together.\``,
          `\`D) Lasso works perfectly here — p ≫ n is exactly the regime L1 was designed for — so nothing needs to change beyond raising alpha.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Regularisation adds a penalty on weight size to the loss, so gradient descent — which only ever chases a smaller loss — keeps the weights small and the model simple. L2 (Ridge) shrinks everything smoothly; L1 (Lasso) drives some weights to exactly zero and so selects features. Always standardise first, because the penalty judges weights by size, not by usefulness.`,
    recap: [
      "**Regularisation = penalty on weight size added to the loss.** Gradient descent chases smaller loss → weights stay small, model stays simple.",
      "**L2 (Ridge):** shrinks everything smoothly. **L1 (Lasso):** drives some weights to exactly zero → feature selection.",
      "**Always standardise first** — the penalty judges weights by size, not usefulness.",
      "**Lasso is shaky under correlated features** — it keeps one, zeros the rest, and which it keeps can change.",
      "**Trades a little bias for a big drop in variance;** λ is tuned, not guessed.",
      "**Ridge has a closed form;** library naming (C = 1/λ) is a minefield.",
    ],
    interactiveId: 'regularization_viz',
    figures: {
      l1_l2_geometry: `<svg viewBox="0 0 480 240" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;font-family:var(--font-sans,sans-serif)">
  <!-- L1 panel -->
  <g transform="translate(20,20)">
    <text x="100" y="14" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">L1 (lasso)</text>
    <!-- axes -->
    <line x1="100" y1="195" x2="100" y2="25" stroke="var(--ink-low)" stroke-width="1"/>
    <line x1="10" y1="110" x2="190" y2="110" stroke="var(--ink-low)" stroke-width="1"/>
    <text x="194" y="114" fill="var(--ink-low)" font-size="10">w₁</text>
    <text x="103" y="22" fill="var(--ink-low)" font-size="10">w₂</text>
    <!-- L1 diamond -->
    <polygon points="100,45 165,110 100,175 35,110" fill="none" stroke="var(--prime)" stroke-width="2"/>
    <!-- loss ellipses -->
    <ellipse cx="150" cy="70" rx="70" ry="45" fill="none" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.5"/>
    <ellipse cx="150" cy="70" rx="95" ry="65" fill="none" stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.75"/>
    <!-- OLS solution star -->
    <circle cx="150" cy="70" r="4" fill="var(--amber)" opacity="0.9"/>
    <text x="155" y="67" fill="var(--amber)" font-size="9">θ̂ols</text>
    <!-- contact point at corner -->
    <circle cx="165" cy="110" r="5" fill="var(--prime)" stroke="var(--ink-hi)" stroke-width="1.5"/>
    <text x="168" y="108" fill="var(--prime)" font-size="9" font-weight="700">sparse!</text>
    <!-- zero label -->
    <text x="97" y="182" fill="var(--ink-low)" font-size="9" text-anchor="middle">w₂=0</text>
  </g>
  <!-- divider -->
  <line x1="240" y1="10" x2="240" y2="230" stroke="var(--rim)" stroke-width="1"/>
  <!-- L2 panel -->
  <g transform="translate(250,20)">
    <text x="100" y="14" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">L2 (ridge)</text>
    <!-- axes -->
    <line x1="100" y1="195" x2="100" y2="25" stroke="var(--ink-low)" stroke-width="1"/>
    <line x1="10" y1="110" x2="190" y2="110" stroke="var(--ink-low)" stroke-width="1"/>
    <text x="194" y="114" fill="var(--ink-low)" font-size="10">w₁</text>
    <text x="103" y="22" fill="var(--ink-low)" font-size="10">w₂</text>
    <!-- L2 circle -->
    <circle cx="100" cy="110" r="65" fill="none" stroke="var(--prime)" stroke-width="2"/>
    <!-- loss ellipses -->
    <ellipse cx="150" cy="70" rx="70" ry="45" fill="none" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="4,3" opacity="0.5"/>
    <ellipse cx="150" cy="70" rx="100" ry="68" fill="none" stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.75"/>
    <!-- OLS solution star -->
    <circle cx="150" cy="70" r="4" fill="var(--amber)" opacity="0.9"/>
    <text x="155" y="67" fill="var(--amber)" font-size="9">θ̂ols</text>
    <!-- contact point on smooth curve -->
    <circle cx="155" cy="58" r="5" fill="var(--prime)" stroke="var(--ink-hi)" stroke-width="1.5"/>
    <text x="159" y="56" fill="var(--prime)" font-size="9" font-weight="700">w₁≠0, w₂≠0</text>
  </g>
</svg>`,
    },
  },
  {
    id: 'generalization',
    interactiveId: 'bias_variance_viz',
    title: 'Generalisation Theory',
    subtitle: 'Bias-variance, VC dimension, PAC learning, double descent',
    difficulty: 'advanced',
    estimatedMin: 32,
    tags: ['bias-variance', 'VC dimension', 'overfitting', 'double descent'],
    summary: `Imagine throwing darts at a board, over and over. There are two very different ways to be bad at it. You could throw tightly grouped darts that all land in the same wrong corner — consistent, but consistently off. Or you could throw darts scattered wildly all over — sometimes near the bullseye, sometimes nowhere near, no two alike. The first kind of error is **bias**: a steady, systematic miss in the same direction. The second is **variance**: a wild sensitivity that makes every throw different. Almost every model that fails, fails in one of these two ways — and knowing which one is the difference between fixing it and flailing.

[FIGURE: bias_variance_targets]

Here is the setup that makes it real. You train a model on house prices. Training error: 2%. Test error: 20%. In production it is useless, and nothing in the training loop warned you — it was doing its job perfectly. That 18-point gap is the real problem, and to fix it you have to know *why* it is there.

---

**Splitting the error into three pieces.**

The test error of any model breaks into three parts.

The first is **noise** — the random, unpredictable wobble in house prices that no model could ever capture (a seller in a hurry, a surprise bidding war). This is a floor; you cannot beat it.

The second is **bias** — the model's steady tendency to miss in the same direction, because its assumptions are too simple. A straight line fit to a curvy truth will always cut the same corners. High bias means the model is too rigid to capture the real shape. That is **underfitting**.

The third is **variance** — how much the model's predictions jump around when you retrain it on a slightly different sample of houses. A deep, flexible model can bend to fit the training set exactly, but swap out ten houses and it draws a completely different curve. High variance means the model is chasing noise. That is **overfitting**.

---

**The tug-of-war.**

Here is the catch that makes this hard: the cure for one makes the other worse. Add flexibility to reduce bias (a deeper tree, more features) and you raise variance — the model now has enough freedom to chase noise. Add regularisation to tame variance and you raise bias — the model is now too constrained to fit the real shape. This is the **bias-variance tradeoff**, and every knob you turn — model size, regularisation strength, tree depth — is a position on it. The whole game is finding where the total is smallest.

That is also why the two failures need opposite fixes, and why guessing wrong wastes weeks. Training error high *and* test error high (say 15% and 18%)? That is **high bias** — the model cannot even fit the data it trained on, so give it more power (more features, a more flexible model, less regularisation); more data will not help. Training error low but test error much higher (2% and 20%)? That is **high variance** — the model memorised the training set, so rein it in (more regularisation, a simpler model, or the most reliable fix, more training data).

---

**How much power is too much? (going deeper)**

There is a classical way to measure a model's raw capacity to overfit, called the **VC dimension**. In plain terms it is the largest number of points the model can label *any way you like* and still fit perfectly. A straight line in a plane can do this for any 3 points but not 4 — so its capacity is small. Pile on features and the capacity climbs, and the rule of thumb is stark: the more capacity you add, the more data you need just to keep the same gap between training and test. Double the features and you roughly double the data you need to stay level. That is the formal price of flexibility.

And there is a modern twist that broke the old picture. The classic story says test error follows a U as you add capacity — too little underfits, too much overfits, one sweet spot in the middle. That U is real, but it is not the whole story. Keep pushing capacity *far* past the point where the model can memorise the training data — into the giant, over-parameterised models behind today's deep learning — and test error, surprisingly, often starts falling *again*. This is **double descent**. Roughly: when a model has far more capacity than it needs, gradient descent tends to settle on the *smoothest* fit among the many that work, and smooth fits generalise well.

---

**The one belief to drop.**

"More data always helps." Not true — and knowing when it does not saves you months. More data reliably cuts *variance*: if the model is overfitting, more examples pin it down. But more data does almost nothing for *bias*. A straight line fit to a curve will miss that curve by about the same amount whether you feed it 100 houses or 100,000 — it will just be more confident about the wrong shape. More data fixes a model that is too twitchy. It cannot fix a model that is simply the wrong shape. For that, you fix the model.

---

**Three sets, three jobs: train / validation / test.**

None of this measurement works without disciplined splits. **Training** data fits the weights. **Validation** data tunes the knobs — lambda, tree depth, which model — and you can look at it as often as you like. **Test** data is touched *once*, at the very end, to get an honest final number. The cardinal sin is letting the test set influence any decision; peek at it while tuning and it stops being an honest estimate — you've overfit to it just as surely as to the training set. Watch too for **leakage**: any preprocessing (scaling, imputation, feature selection) must be fit on training folds only, or information about the test set sneaks into training and your numbers turn rosy and false. When data is scarce and a single split is too noisy, use **k-fold cross-validation** — rotate which fold is held out and average — to get a stable estimate.

---

**The decomposition, written down.**

The three-part split has an exact form. For squared-error regression, the expected test error at a point is:

$E[(y - \\hat{f})^2] = \\sigma^2 + \\text{Bias}^2 + \\text{Variance}$

— irreducible **noise** ($\\sigma^2$), the squared **bias** (how far the average model is from the truth), and the **variance** (how much the model wiggles across training samples). You can't touch the noise; every knob you turn trades the other two. That's the tradeoff made precise.

---

**VC dimension, precisely: shattering.**

We said VC dimension is "the most points you can label any way and still fit." The exact word is **shatter**: a model *shatters* a set of points if, for *every* possible labeling of them, it can fit them perfectly. The VC dimension is the size of the largest set it can shatter — a line in 2D shatters any 3 points but no set of 4, so its VC dimension is 3. Two cautions interviewers probe. First, VC dimension is *capacity*, and it is **not** the same as parameter count — some models with few parameters have huge capacity and vice versa. Second, the VC generalization bound (gap ∝ √(VC/n)) is *conceptually* central but *numerically loose* — it's a useful way to think, not a number you'd quote to predict real test error.

---

**PAC learning: what the letters actually mean.**

The module title says PAC, so here's the real content. **PAC** = **Probably Approximately Correct.** "Approximately" is an accuracy tolerance **ε** — the model's error is within ε of the best possible. "Probably" is a confidence **δ** — it hits that accuracy with probability at least 1−δ. Why both, and why probabilistic? Because you learn from a *random* sample: with bad luck you could draw a misleading sample, so you can never promise correctness with certainty — only "approximately correct, probably." PAC theory then gives **sample complexity**: how many examples you need to guarantee (ε, δ) for a given **hypothesis class** (the set of models you're choosing from). Bigger, more expressive hypothesis classes need more samples — the formal echo of "more capacity needs more data."

---

**Capacity isn't just parameter count.**

This is why "count the parameters" is too crude. What matters is *effective* capacity, and regularisation shrinks it without deleting parameters. L2/weight decay, dropout, early stopping, and data augmentation all reduce how much arbitrary structure the model can actually express, even though the parameter count is unchanged. A giant network trained with heavy augmentation and early stopping can have far less effective capacity than its raw size suggests — which is part of why over-parameterised models don't overfit the way naive capacity counting predicts.

---

**Double descent — with the caveats.**

Double descent (test error falling again far past the interpolation point) is real, but it's *not* a license to blindly enlarge models. Whether it shows up depends on the optimiser and its implicit regularisation, the data quality and noise level, and the architecture. In many practical, noisy, well-tuned settings you never see a second descent, or the gains are marginal versus the compute. Treat it as "huge models can generalise better than the classic U-curve warns," not "bigger is always better."

---

**The assumption hiding under all of it: same distribution.**

Every guarantee here — bias-variance, VC bounds, PAC, even the honest test set — quietly assumes train and deployment data come from the *same* distribution. Production breaks that constantly, which is why a model can look great in validation and fail live. **Covariate shift**: the inputs P(X) drift (new user demographics) while the true relationship holds. **Concept drift**: the relationship P(Y|X) itself changes (fraud tactics evolve). **Train-serving skew**: a feature is computed differently in training than in serving. When validation looked good but production didn't, this family — not bias or variance — is usually the culprit.`,
    keyPoints: [
      `**Use the bias-variance lens to read a train/test gap — and measure training error, not just test error.**\n\nBoth training and test error high and close together? That is high bias — the model is too simple, so give it more power (more features, a more flexible model, less regularisation). Training error low but test error much higher? That is high variance — the model memorised noise, so rein it in (more regularisation, a simpler model, or more data). The one move that tells you which you are facing is looking at training error. Diagnose first, because the two fixes are opposite and applying the wrong one makes things worse.`,
      `**The trap: reaching for "more data" as a cure-all.**\n\nMore data is the most reliable fix for high variance — it pins down a model that is overfitting. But it does almost nothing for bias. A model that is simply the wrong shape (a straight line on curved data, or missing a key feature) keeps making the same systematic miss no matter how many examples you feed it — just with more false confidence. Before you spend months collecting data, fit a more flexible model on what you already have; if its test error is also high, you have a feature or data-quality problem, not a sample-size one.`,
      `**The diagnostic: plot a learning curve — training and validation error as the dataset grows.**\n\nIf both curves sit high and hug each other, you are underfitting (high bias), and more data barely moves them — add capacity. If training error is low but validation stays well above it and the gap refuses to close, you are overfitting (high variance) — regularise, simplify, or gather more data, which slowly pulls the curves together. If they meet but at a stubbornly high error, you have hit the noise floor or a genuinely wrong model.`,
      `**Guard the three-way split and know the decomposition it measures.**\n\nTrain fits weights, validation tunes knobs (look freely), test is touched once for an honest final number — peek at test while tuning and it's no longer honest. Fit all preprocessing on training folds only to avoid leakage, and use k-fold CV when data is scarce. What you're estimating has an exact form: $E[(y-\\hat f)^2] = \\sigma^2 + \\text{Bias}^2 + \\text{Variance}$ — irreducible noise plus squared bias plus variance, and every knob trades the last two.`,
      `**State VC and PAC precisely — capacity is not parameter count.**\n\nA model *shatters* points if it can fit every possible labeling of them; VC dimension is the largest set it can shatter (a 2D line: 3). The VC bound (gap ∝ √(VC/n)) is conceptually central but numerically loose. PAC = Probably (confidence 1−δ) Approximately (error within ε) Correct — probabilistic because you learn from a random sample — and its sample complexity says bigger hypothesis classes need more data. Crucially, effective capacity is shrunk by L2, dropout, early stopping, and augmentation without changing the parameter count, which is why over-parameterised models needn't overfit.`,
      `**Double descent has caveats, and every guarantee assumes a fixed distribution.**\n\nTest error falling again past the interpolation point is real but depends on the optimiser's implicit regularisation, noise level, and architecture — it's "huge models can beat the U-curve," not "bigger is always better." And all of this — bias-variance, VC, PAC, the honest test set — assumes train and serving data share a distribution. When validation looked fine but production failed, suspect covariate shift (P(X) moves), concept drift (P(Y|X) moves), or train-serving skew, not bias or variance.`,
    ],
    interactivePrompt: `Before you touch the controls: if you doubled the size of the training set without changing the model, do you expect the training error to go up, down, or stay the same?`,
    checkQuestions: [
      {
        q: `A model gets 99% on the training data but 75% on test. What does that say about bias and variance, and what do you do?`,
        options: [
          `\`A) High bias and high variance at once — the model is underfitting and overfitting together, which means the whole model family is wrong, so throw it out and switch families rather than tuning anything.\``,
          `\`B) Low bias but high variance — it fits training beautifully yet does not generalise, so it memorised noise. Rein it in: more data (the most direct fix), stronger regularisation, or a simpler model. Adding capacity would only make it worse.\``,
          `\`C) This is perfectly healthy — a gap between training and test is normal and expected, and 75% is fine; closing it any further would only add bias and hurt the model on real data.\``,
          `\`D) High bias — the model is too simple, which is exactly why the test accuracy is low, so the fix is to add capacity (a deeper model, more features) until the test number climbs up to match.\``,
        ],
        answer: `B`,
      },
      {
        q: `A neural net does worse at 1,000 parameters than at 100, but better at 1,000,000 than at 100. How can piling on parameters help after it first hurt?`,
        options: [
          `\`A) At 1,000 it has just barely enough capacity to memorise the data, landing on a jagged high-variance fit. At 1,000,000 it has far more than it needs, and gradient descent tends to pick the smoothest fit among the many that work — and smooth fits generalise. That second improvement is double descent, past the classic U-curve.\``,
          `\`B) The 1,000,000-parameter model quietly deletes its unused parameters during training, collapsing back into a small 100-parameter model, which is why it ends up generalising exactly like the small one did.\``,
          `\`C) More parameters always lower test error as long as the learning rate is small enough; the dip at 1,000 was just an unlucky random seed, and re-running the whole thing would smooth it away entirely.\``,
          `\`D) The huge model quietly memorises the test set through its shared weights, so its low test error is really a form of leakage rather than any genuine improvement in how it generalises.\``,
        ],
        answer: `A`,
      },
      {
        q: `You add 400 new features to a linear model. Training accuracy rises but test accuracy drops. What happened, in terms of capacity?`,
        options: [
          `\`A) Extra features never change a linear model's capacity — only the number of training points does — so the drop is a numerical glitch from the bigger matrix; regularise to stabilise it and the test accuracy comes right back.\``,
          `\`B) The 400 new features are simply all noise; delete any feature with low correlation to the target and test accuracy returns on its own, with no regularisation or extra data needed.\``,
          `\`C) More features means more capacity to fit arbitrary patterns, including noise. With the same amount of data, the higher-capacity model overfits and the train/test gap widens. Fixes: regularise harder, cut features down to the ones carrying real signal, or gather more data in proportion to the added capacity.\``,
          `\`D) Adding features shrinks capacity, because each feature now explains a smaller share of the target, so the real problem is too little capacity — add even more features until the test accuracy recovers.\``,
        ],
        answer: `C`,
      },
      {
        q: `Your model looks great in cross-validation but fails in production, and the failure isn't explained by bias or variance. What is the most likely cause?`,
        options: [
          `\`A) The model simply has high variance that cross-validation somehow missed; retraining on the same data with more folds will surface and fix it.\``,
          `\`B) Distribution shift between training and production — covariate shift (the input distribution P(X) moved), concept drift (the relationship P(Y|X) changed), or train-serving skew (a feature computed differently at serving time). Every generalisation guarantee assumes train and serving share a distribution, and production routinely breaks that.\``,
          `\`C) The test set was too small, so the production drop is just sampling noise and will disappear once more production data accumulates.\``,
          `\`D) Cross-validation always overestimates production performance by a fixed margin, so the gap is expected and needs no investigation.\``,
        ],
        answer: `B`,
      },
      {
        q: `An interviewer asks you to define PAC learning and why it is "probably" and "approximately" rather than a hard guarantee.`,
        options: [
          `\`A) PAC means the model is Perfectly And Completely correct once it has seen enough data; the words "probably" and "approximately" refer only to the early phase before convergence.\``,
          `\`B) PAC stands for Probably Approximately Correct: "approximately" is an accuracy tolerance ε (error within ε of the best possible), and "probably" is a confidence 1−δ. It cannot be a hard guarantee because you learn from a random sample — an unlucky draw could mislead any learner — so the best you can promise is approximately correct, with high probability. Sample complexity then says larger hypothesis classes need more data.\``,
          `\`C) PAC learning is a specific algorithm (like SVM or k-NN) that trains models with probabilistic weights, and its accuracy is approximate because those weights are randomised at inference.\``,
          `\`D) PAC guarantees exact correctness with probability 1, and the ε and δ terms are just tuning constants that control the learning rate during training.\``,
        ],
        answer: `B`,
      },
      {
        q: `You reduce a big network's overfitting using dropout and early stopping without removing any parameters. In capacity terms, what changed?`,
        options: [
          `\`A) Nothing changed — capacity is fixed by the parameter count, so dropout and early stopping only speed up training without affecting how much the model can overfit.\``,
          `\`B) The parameter count is unchanged but the model's effective capacity dropped: dropout, early stopping, L2, and data augmentation all shrink how much arbitrary structure the model can actually express, which is why capacity is not the same as parameter count.\``,
          `\`C) Dropout increased capacity by adding randomness, and it only appeared to help because the test set happened to match that noise.\``,
          `\`D) Early stopping physically deletes the parameters that had not yet been trained, so the parameter count really did fall even though the architecture looks the same.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Test error splits into three parts: noise you cannot beat, bias (the model is too simple — underfitting), and variance (the model is too twitchy — overfitting). The two failures need opposite fixes, so measure training error to tell them apart. And remember: more data cures variance, not bias — a wrong-shaped model stays wrong no matter how much you feed it.`,
    recap: [
      "**Test error = noise (irreducible) + bias² + variance.**",
      "**Bias** = model too simple (underfitting); **variance** = model too twitchy (overfitting). Opposite fixes.",
      "**Measure training error to tell them apart** — high train error = bias, low train + high test = variance.",
      "**More data cures variance, not bias.** A wrong-shaped model stays wrong.",
      "**Learning curve** (train + validation error vs dataset size) is the diagnostic.",
      "**Capacity ≠ parameter count** — VC dimension is the real measure; every PAC guarantee assumes a fixed distribution.",
      "**Double descent** breaks the classic U-curve, but with caveats.",
    ],
    interactiveId: 'bias_variance_viz',
    figures: {
      bias_variance_targets: `<svg viewBox="0 0 460 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:460px;font-family:var(--font-sans,sans-serif)">
  <text x="150" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="12" font-weight="700">Low variance</text>
  <text x="330" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="12" font-weight="700">High variance</text>
  <text x="18" y="95" text-anchor="middle" fill="var(--ink-hi)" font-size="12" font-weight="700" transform="rotate(-90 18 95)">Low bias</text>
  <text x="18" y="225" text-anchor="middle" fill="var(--ink-hi)" font-size="12" font-weight="700" transform="rotate(-90 18 225)">High bias</text>
  <!-- TL: low bias, low variance -->
  <g>
    <circle cx="150" cy="95" r="42" fill="none" stroke="var(--rim)" stroke-width="1"/>
    <circle cx="150" cy="95" r="27" fill="none" stroke="var(--rim)" stroke-width="1"/>
    <circle cx="150" cy="95" r="12" fill="none" stroke="var(--prime)" stroke-width="1.4"/>
    <circle cx="148" cy="93" r="3" fill="var(--amber)"/><circle cx="152" cy="96" r="3" fill="var(--amber)"/><circle cx="150" cy="90" r="3" fill="var(--amber)"/><circle cx="146" cy="98" r="3" fill="var(--amber)"/><circle cx="153" cy="92" r="3" fill="var(--amber)"/>
  </g>
  <!-- TR: low bias, high variance -->
  <g>
    <circle cx="330" cy="95" r="42" fill="none" stroke="var(--rim)" stroke-width="1"/>
    <circle cx="330" cy="95" r="27" fill="none" stroke="var(--rim)" stroke-width="1"/>
    <circle cx="330" cy="95" r="12" fill="none" stroke="var(--prime)" stroke-width="1.4"/>
    <circle cx="318" cy="82" r="3" fill="var(--amber)"/><circle cx="345" cy="90" r="3" fill="var(--amber)"/><circle cx="325" cy="112" r="3" fill="var(--amber)"/><circle cx="340" cy="105" r="3" fill="var(--amber)"/><circle cx="332" cy="78" r="3" fill="var(--amber)"/><circle cx="312" cy="102" r="3" fill="var(--amber)"/>
  </g>
  <!-- BL: high bias, low variance -->
  <g>
    <circle cx="150" cy="225" r="42" fill="none" stroke="var(--rim)" stroke-width="1"/>
    <circle cx="150" cy="225" r="27" fill="none" stroke="var(--rim)" stroke-width="1"/>
    <circle cx="150" cy="225" r="12" fill="none" stroke="var(--prime)" stroke-width="1.4"/>
    <circle cx="133" cy="208" r="3" fill="var(--amber)"/><circle cx="137" cy="211" r="3" fill="var(--amber)"/><circle cx="135" cy="204" r="3" fill="var(--amber)"/><circle cx="130" cy="212" r="3" fill="var(--amber)"/><circle cx="139" cy="206" r="3" fill="var(--amber)"/>
  </g>
  <!-- BR: high bias, high variance -->
  <g>
    <circle cx="330" cy="225" r="42" fill="none" stroke="var(--rim)" stroke-width="1"/>
    <circle cx="330" cy="225" r="27" fill="none" stroke="var(--rim)" stroke-width="1"/>
    <circle cx="330" cy="225" r="12" fill="none" stroke="var(--prime)" stroke-width="1.4"/>
    <circle cx="305" cy="200" r="3" fill="var(--amber)"/><circle cx="322" cy="208" r="3" fill="var(--amber)"/><circle cx="310" cy="222" r="3" fill="var(--amber)"/><circle cx="326" cy="198" r="3" fill="var(--amber)"/><circle cx="318" cy="216" r="3" fill="var(--amber)"/><circle cx="300" cy="212" r="3" fill="var(--amber)"/>
  </g>
</svg>`,
    },
  },
  {
    id: 'trees',
    interactiveId: 'decision_tree_viz',
    title: 'Decision Trees',
    subtitle: 'Information gain, Gini, pruning, depth-accuracy tradeoff',
    difficulty: 'foundational',
    estimatedMin: 30,
    tags: ['decision trees', 'Gini', 'information gain'],
    summary: `Think about the game of twenty questions. Someone picks a secret — a person, a place, a thing — and you have to guess it with yes/no questions. A good player never asks at random. Each question is chosen to split what is left roughly in half, so every answer shrinks the field until only one thing remains. That is almost exactly what a **decision tree** does with data, and it is one of the most natural ideas in all of machine learning — it works the way people already think.

Here is a job where it shines and a straight-line model struggles. Say you want to flag loan applicants likely to default, using their income, their debt-to-income ratio, and their age. The real pattern is a set of rules: "if income is low *and* debt is high, risky — but a big income excuses a fair bit of debt." That is not a smooth weighted sum. It is the space of applicants carved into regions, each with its own answer. A linear model draws one line and gives up. A tree carves.

[FIGURE: tree_partition]

---

**One question at a time.**

A decision tree asks a single yes/no question, splitting everyone into two groups, then asks the next question inside each group, and so on. The whole skill is choosing the *right* question at each step. And "right" has a clear meaning: the question that leaves the two groups as **pure** as possible — each side mostly one class.

So we need a way to measure how mixed a group is. The usual one is **Gini impurity**, and it has a plain reading: if you grabbed a random person from the group and guessed their class from the group's mix, how often would you be wrong? A group that is all defaulters is perfectly pure — you would never be wrong — so its Gini is 0. A group split 50/50 is as messy as it gets — you would be wrong half the time — so its Gini is 0.5. The formula is just $1 - \\sum_k p_k^2$, where $p_k$ is the share of class k.

---

**Watching it pick a split.**

Let us do one real step. You have 100 applicants: 40 defaulted, 60 did not. The starting mix has Gini $= 1 - 0.4^2 - 0.6^2 = 0.48$ — quite messy.

Try a first candidate question, "is income below 42k?" It sends 60 people left (50 of them defaulters) and 40 right (mostly safe). Work out the Gini on each side, weight each by how many people landed there, and the mixedness falls from 0.48 to about 0.32. Not bad. Now try a different question, "is debt-to-income above 0.35?" This one sends 45 people into a group that is almost all safe (Gini ≈ 0.09) — a much cleaner cut. Its weighted mixedness drops to about 0.27. The second question purified more, so the tree keeps it. Then it runs the exact same search again inside each of the two new groups, and keeps going.

That is the whole training algorithm: at every node, try every question, keep the one that purifies the most, then recurse.

---

**What a leaf says.**

Eventually a group is pure enough, or too small to split, and becomes a **leaf**. For classification the leaf just votes: 7 defaulters and 3 safe people means "70% chance of default." For predicting a number instead of a class — say a loan amount — the leaf hands back the **average** of the training values that landed in it.

That averaging hides a sharp limit worth remembering: a regression tree **cannot extrapolate**. If the priciest house it ever trained on was 800k, then no matter how big and fancy a new house is, the tree can only ever answer with an average of prices it has already seen — it will never say 1.2M. Its answers are trapped inside the range of its training data.

---

**The catch: trees are twitchy.**

Now the deep part. A tree is **greedy** — at each step it grabs the single best question available right now, with no thought for what that locks in later. It does not find the best tree *overall*; searching for that truly best tree is hopeless, because the number of possible trees is astronomical. Greedy is fast, but it comes at a price.

Because the very first split is chosen by looking at the whole dataset, it is fragile. Change just 8 of those 100 applicants and the root question might flip from "debt above 0.35?" to "income below 42k?" — and since every branch underneath is built on top of the root, the entire tree below reshuffles. Two trees trained on data that is 92% identical can hand out opposite answers for the same person. This is called **high variance**, and it is not a bug you can tune away — it is baked into greedy splitting.

Hold onto that fact, because in the next lessons it flips from weakness into superpower: a crowd of different, twitchy trees, averaged together, cancels out its own wobble. That is the whole idea behind **random forests** and boosting.

---

**Two more things to know.**

Trees cut one feature at a time, so every boundary they draw is a straight, **axis-aligned** line — a horizontal or vertical fence. If the real boundary runs on a diagonal ("income plus debt above some total"), a tree can only approximate it with a staircase of many little fences, while a linear model draws that diagonal in a single stroke. So trees are clumsy exactly where lines are graceful, and graceful (carving boxes) exactly where lines are clumsy.

And left unchecked, a tree keeps splitting until nearly every leaf holds a single training point — 100% right on the training data, and badly overfit. The cure is **pruning**. You either stop early (cap the depth, or refuse splits that would leave too few samples in a leaf) or grow the full tree and then cut back the branches that do not earn their keep. Either way you give up a little training accuracy for a lot of test accuracy, and you choose how hard to prune by trying a few levels and keeping the one that generalises best.

---

**Gini's cousin: entropy and information gain.**

Gini isn't the only way to measure mixedness. **Entropy** measures the same thing from information theory — the number of bits of surprise in the group's class mix — with formula $-\\sum_k p_k \\log_2 p_k$: 0 for a pure group, 1 bit for a 50/50 binary split. When a tree splits using entropy, the drop in entropy from parent to children is called **information gain** — literally "how many bits of uncertainty did this question remove." That's the quantity the classic ID3/C4.5 trees maximise, and it's why this topic is often titled "information gain." In practice Gini and entropy give very similar trees; Gini is slightly cheaper to compute (no logarithm) and is scikit-learn's default. The difference rarely matters — pick either.

---

**How regression trees actually choose splits.**

For classification the tree purifies class mix. For regression there are no classes, so it purifies *spread*: it picks the split that most reduces the **variance** (equivalently, mean squared error) of the target within each child. A split that cleanly separates cheap houses from expensive ones drops the within-group variance a lot, so the tree takes it. If you care about robustness to outliers you can instead split on **MAE** (absolute error), and count-style targets have a **Poisson** criterion — but variance/MSE reduction is the default and the one to name.

---

**The knobs: a hyperparameter map and real pruning.**

A single tree is controlled by a handful of parameters worth knowing by name. \`max_depth\` caps how deep it grows; \`min_samples_split\` and \`min_samples_leaf\` refuse splits that would leave too few examples; \`max_leaf_nodes\` caps total leaves; \`class_weight\` up-weights a rare class. Those are *pre-pruning* (stop early). The principled *post-pruning* is **cost-complexity pruning** (the CART method): grow the full tree, then minimise (impurity + \`ccp_alpha\` × number of leaves) — a penalty on tree size exactly analogous to regularisation. Bigger \`ccp_alpha\` means a smaller tree, and you pick it by cross-validation.

---

**Categoricals and missing values: mind the implementation.**

"Trees handle mixed types" is true in principle but depends on the library. scikit-learn's classic trees actually need **numeric input** — you must encode categories yourself (and one-hot encoding a high-cardinality category can fragment the tree). True native categorical splits and native missing-value handling live in specific implementations (LightGBM, CatBoost, and newer histogram-based trees). So don't claim "trees just take categoricals" in an interview without naming which implementation.

---

**When one class is rare.**

Under imbalance a tree happily chases the majority: it can make pure-looking leaves that are almost all the common class and score high accuracy while never catching the rare one. And its leaf probabilities become unreliable. Fixes are the usual family: \`class_weight='balanced'\` so rare examples count more at each split, threshold moving on the leaf probabilities, stratified CV so folds keep the rare class, and judging with PR-AUC rather than accuracy.

---

**Leaf probabilities lie a little.**

A classification leaf reports the *frequency* of each class among its training points — "7 of 10 defaulted, so 70%." That's a raw estimate, and it's often poorly calibrated, especially for small leaves where 7/10 is really just noise. A single deep tree tends to give overconfident near-0/near-1 probabilities. If you need trustworthy probabilities from a tree, enforce a minimum leaf size and calibrate (Platt or isotonic) on a held-out set rather than trusting the raw leaf fractions.`,
    keyPoints: [
      `**What a decision tree is, and when to reach for it: a flowchart of yes/no questions you can actually read.**\n\nTrees are the model to use when you need to explain every prediction in plain words — "income below 42k and debt above 0.35, so we flagged it." They take mixed feature types (numbers and categories) as they come, need no scaling, and pick up feature interactions on their own, since splitting on income and then on debt is exactly an income-and-debt rule. The catch: a single tree is twitchy and overfits easily. So use one tree when you need a human-readable explanation, and an ensemble (random forest or boosting) when you need the accuracy in production.`,
      `**The trap that fools people: trusting the tree's built-in feature-importance scores.**\n\nA tree's default importance counts how much each feature cut down impurity across all its splits. But a fine-grained number like income has many possible cut points, so it gets far more chances to split than a plain yes/no flag — and it ends up looking more important than it really is, just from having more opportunities. Do not rank features by this. Use permutation importance instead: shuffle one feature's values, measure how much accuracy drops, and repeat. A feature that truly mattered will hurt when scrambled; a useless one will not.`,
      `**The check to run: sweep how hard you prune, and watch train versus test accuracy.**\n\nWith no pruning a tree scores nearly perfectly on training data and poorly on test — pure overfitting. As you prune harder, test accuracy climbs (noise removed), peaks, then falls again (now you are cutting real structure). That peak is the right amount of pruning, and you find it with cross-validation, not by eyeballing a single split. Also watch leaf sizes: a leaf built from only two or three examples gives a probability you should not trust, so require a minimum number of samples per leaf.`,
      `**Know the split criteria and the hyperparameter map by name.**\n\nClassification splits maximise purity via Gini ($1-\\sum p_k^2$) or entropy/information gain ($-\\sum p_k\\log_2 p_k$) — near-identical results, Gini is cheaper and the default. Regression splits minimise variance/MSE within children (MAE or Poisson as alternatives). The knobs: \`max_depth\`, \`min_samples_split\`, \`min_samples_leaf\`, \`max_leaf_nodes\`, \`class_weight\` for pre-pruning, and \`ccp_alpha\` for cost-complexity post-pruning — minimise (impurity + ccp_alpha × #leaves), pick ccp_alpha by CV.`,
      `**Mind implementation limits, imbalance, and leaf-probability calibration.**\n\nscikit-learn's classic trees need numeric-encoded inputs — native categorical and missing-value handling lives in LightGBM/CatBoost/histogram trees, so don't claim "trees just take categoricals" without naming the library. Under imbalance a tree chases the majority and its leaf probabilities get unreliable — use \`class_weight='balanced'\`, threshold moving, stratified CV, and PR-AUC. And a leaf reports raw training frequencies (7/10 = 70%), which are poorly calibrated for small leaves and overconfident overall, so enforce a minimum leaf size and calibrate on held-out data if you need trustworthy probabilities.`,
    ],
    interactivePrompt: `Before you touch the controls: if a decision tree perfectly memorises every training example (100% training accuracy), what do you expect its test accuracy to be relative to a shallower tree?`,
    checkQuestions: [
      {
        q: `Train a decision tree, then retrain it on data that differs by just a handful of rows — and the whole tree can come out looking completely different. Why does that happen, and why does it point toward random forests?`,
        options: [
          `\`A) The very first split is chosen from the whole dataset, so changing a few rows can flip it — and every branch below is built on top of that choice, so the whole tree reshuffles. That is high variance, and averaging many different trees cancels the wobble, which is what a random forest does.\``,
          `\`B) The tree keeps re-sorting the rows alphabetically as the data changes, and even a tiny reordering rebuilds the branches from scratch; a random forest fixes this by sorting the data once up front and then freezing that order.\``,
          `\`C) Trees are sensitive to whether you use Gini or entropy, and swapping a few rows can tip which criterion wins the root; a random forest averages trees built with both criteria at once to cancel that sensitivity out.\``,
          `\`D) The wobble comes from the tree choosing its splits at random on every run, so setting a fixed random seed removes it completely; a random forest is really just one tree with its seed pinned across runs.\``,
        ],
        answer: `A`,
      },
      {
        q: `When a decision tree picks its next yes/no question, what is it actually trying to do?`,
        options: [
          `\`A) Pick the question that splits the group into two halves of equal size, so the tree stays balanced and its overall depth ends up as small as it possibly can.\``,
          `\`B) Pick the question that leaves the two resulting groups as pure as possible — each side mostly one class. It measures purity with something like Gini and keeps whichever split drops impurity the most.\``,
          `\`C) Pick the feature with the highest overall correlation to the target, then split it right at its average value, since that single feature carries the most information on its own.\``,
          `\`D) Pick the question that creates the largest number of leaves at once, because more leaves lets the tree represent more of the patterns hiding in the data.\``,
        ],
        answer: `B`,
      },
      {
        q: `A tree grown with no depth limit hits 100% training accuracy but 62% on test. Capping its depth gives 85% train and 80% test. What happened, and how do you find a good depth?`,
        options: [
          `\`A) The unlimited tree had high bias from splitting too little, and the shallow tree fixed it; find the best depth by picking whichever gives the highest training accuracy while keeping the train-test gap under 10%.\``,
          `\`B) The unlimited tree memorised the training noise — great on train, poor on test, which is high variance. The shallower tree trades a little train accuracy for much better test accuracy. Find a good depth (or pruning level) by cross-validation: try several and keep the one with the best held-out score.\``,
          `\`C) Both trees have the same variance and differ only in bias, which only ever shrinks as depth grows, so the deeper tree is strictly better and the 62% test number must be a fluke you should re-measure.\``,
          `\`D) The deep tree overfit because deep trees are unusually sensitive to mislabelled rows, so the real fix is to smooth the labels rather than limit depth, which is always the more principled choice than pruning.\``,
        ],
        answer: `B`,
      },
      {
        q: `You train a regression tree on house prices that top out at 800k. A genuinely 1.2M house comes in. What does the tree predict, and why?`,
        options: [
          `\`A) About 1.2M — the tree follows the upward trend between size and price that it learned during training and simply extends that trend outward to price the new, larger house.\``,
          `\`B) Exactly 0, because the 1.2M house matches none of the leaves the tree built, so it falls through to the tree's default empty-leaf prediction of zero.\``,
          `\`C) At most 800k. A regression leaf just averages the training prices that landed in it, so its output can never exceed the biggest price the tree ever saw — trees cannot extrapolate past their training range.\``,
          `\`D) Roughly 1.2M, but only if you set extrapolate=True; with the default setting the tree refuses to guess and returns a missing value for the out-of-range house instead.\``,
        ],
        answer: `C`,
      },
      {
        q: `The topic is titled "information gain," but the module measures splits with Gini. How do entropy/information gain and Gini relate?`,
        options: [
          `\`A) They are unrelated: Gini measures class purity while information gain measures how many features a split uses, so a tree needs both to choose a question.\``,
          `\`B) Both measure how mixed a group is; entropy ($-\\sum p_k\\log_2 p_k$) counts bits of uncertainty and the drop in entropy from a split is the information gain, while Gini ($1-\\sum p_k^2$) is a cheaper proxy for the same idea. In practice they yield very similar trees; Gini is scikit-learn's default because it avoids the logarithm.\``,
          `\`C) Information gain is used only for regression trees and Gini only for classification trees, so the title implies this module should really be about predicting numbers.\``,
          `\`D) Gini is an approximation that only matches information gain when every class is equally frequent; with any imbalance the two pick opposite splits, so you must always use entropy under imbalance.\``,
        ],
        answer: `B`,
      },
      {
        q: `You grow a full decision tree and want to prune it back in a principled way rather than just capping depth. What is cost-complexity pruning doing?`,
        options: [
          `\`A) It removes whichever leaves have the fewest training samples until the tree reaches a preset number of nodes, ignoring impurity entirely.\``,
          `\`B) It re-grows the tree from scratch with a smaller max_depth each time and keeps the first one whose training accuracy drops below a threshold.\``,
          `\`C) It minimises (impurity + ccp_alpha × number of leaves) — a penalty on tree size directly analogous to regularisation, so a larger ccp_alpha yields a smaller tree, and you select ccp_alpha by cross-validation.\``,
          `\`D) It converts the tree into a linear model and applies an L1 penalty to the leaf values, zeroing out the least useful leaves the way Lasso zeroes weights.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `A decision tree is a flowchart of yes/no questions, each chosen to split the data into purer groups (measured by Gini). It is easy to read but twitchy — change a few rows and the whole tree can change — and it can only cut straight, axis-aligned lines, so diagonal boundaries need a clumsy staircase. That very instability is what makes trees the perfect building block for random forests and boosting.`,
    recap: [
      "**Decision tree = flowchart of yes/no questions,** each split chosen to make groups purer (Gini).",
      "**Easy to read but twitchy** — change a few rows and the whole tree can change.",
      "**Axis-aligned cuts only** — diagonal boundaries need a clumsy staircase.",
      "**That instability is a feature** — it makes trees the perfect base for random forests and boosting.",
      "**Don't trust built-in feature importances** — they're biased.",
      "**Prune to control depth:** sweep pruning strength and watch train vs test accuracy.",
    ],
    interactiveId: 'decision_tree_viz',
    figures: {
      tree_partition: `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">A tree carves feature space into rectangles</text>
  <line x1="42" y1="170" x2="330" y2="170" stroke="var(--rim)" stroke-width="1"/>
  <line x1="42" y1="38" x2="42" y2="170" stroke="var(--rim)" stroke-width="1"/>
  <text x="186" y="192" text-anchor="middle" fill="var(--ink-low)" font-size="9">income →</text>
  <text x="16" y="104" text-anchor="middle" fill="var(--ink-low)" font-size="9" transform="rotate(-90 16 104)">debt ratio →</text>
  <rect x="42" y="38" width="288" height="132" fill="none"/>
  <line x1="150" y1="38" x2="150" y2="170" stroke="var(--ink-mid)" stroke-width="1.5"/>
  <line x1="42" y1="104" x2="150" y2="104" stroke="var(--ink-mid)" stroke-width="1.5"/>
  <line x1="240" y1="38" x2="240" y2="170" stroke="var(--ink-mid)" stroke-width="1.5"/>
  <rect x="43" y="105" width="106" height="64" fill="var(--prime)" opacity="0.22"/>
  <text x="96" y="142" text-anchor="middle" fill="var(--prime)" font-size="8.5" font-weight="700">RISKY</text>
  <rect x="43" y="39" width="106" height="64" fill="var(--amber)" opacity="0.18"/>
  <rect x="151" y="39" width="88" height="130" fill="var(--amber)" opacity="0.18"/>
  <rect x="241" y="39" width="88" height="130" fill="var(--amber)" opacity="0.18"/>
  <text x="240" y="108" text-anchor="middle" fill="var(--amber)" font-size="8.5" font-weight="700">SAFE</text>
  <text x="180" y="187" text-anchor="middle" fill="var(--ink-low)" font-size="8">each split is one yes/no question → axis-aligned cut</text>
</svg>`,
    },
  },
  {
    id: 'random_forest',
    interactiveId: 'random_forest_viz',
    title: 'Random Forests',
    subtitle: 'Bagging, OOB error, feature importance, hyperparameter sensitivity',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['random forest', 'bagging', 'ensemble'],
    summary: `In 1906 the scientist Francis Galton was at a country fair where a crowd was trying to guess the weight of an ox. Nearly eight hundred people wrote down a number. No single guess was right — some were wildly high, some wildly low. But when Galton averaged them all, the crowd's answer came out at 1197 pounds. The ox weighed 1198. The crowd as a whole beat almost every individual in it, cattle experts included. That is the **wisdom of the crowd**, and a **random forest** is exactly this trick applied to decision trees.

Remember the problem with a single decision tree: it is **twitchy**. Change a few rows of training data and its whole structure can flip, so it overfits and its predictions swing around. But look closer at that flaw. If different slices of data grow different trees that make *different* mistakes, then averaging a whole crowd of them should cancel those mistakes out — the errors point in random directions and wash away, while the real signal they mostly agree on survives. So: grow many trees, let them vote, and the group is far steadier than any single tree.

---

**But a crowd only helps if it disagrees.**

Here is the crucial catch. The ox crowd worked because people guessed *independently* — their errors were unrelated. If everyone had copied their neighbour, the "crowd" would be one guess repeated eight hundred times, and averaging would do nothing. The same holds for trees. If income is the strongest predictor of loan default, then every tree handed the full dataset will split on income first and come out nearly identical — all making the same mistakes. Averaging near-identical trees barely helps. To get the wisdom of the crowd, we have to force the trees to be *different*.

A random forest does this with two tricks.

First, **bagging** (short for bootstrap aggregating): instead of handing every tree the whole dataset, give each one a random resample — draw rows with replacement until you have a fresh training set of the same size, where some rows repeat and others are left out. Every tree now sees a slightly different world and grows differently.

[FIGURE: bagging_forest]

Second, **random feature choices**: at each split, do not let the tree look at all the features — show it only a random handful (a common choice is the square root of the total). Now even the trees that *would* have latched onto income are sometimes forced to find other patterns. This is the key move — it stops every tree from making the same split and pushes them to disagree in useful ways.

Together these two make the trees diverse. Their errors become unrelated, the crowd's vote cancels them, and the forest's predictions come out both accurate and steady — without any single tree having to be good on its own.

---

**A free validation set, for nothing.**

Bagging hands you a bonus. Because each tree trains on a resample, about a third of the rows get left out of any given tree — the "out-of-bag" rows that tree never saw. So for each row you can ask only the trees that did *not* train on it to predict it, and check them against the truth. That gives an honest estimate of test performance — the **out-of-bag (OOB) error** — for free, with no separate validation set set aside. If the OOB error and your real test error disagree badly, that is a red flag for a distribution shift or a data leak.

---

**The one trap to remember.**

A random forest built for regression **cannot predict outside the range it has seen**. Every tree's answer is an average of training values in a leaf, and an average of a forest of averages is still boxed in by the training data. Train on house prices up to 800k and the forest will never output more than 800k, no matter how enormous the house. If your target drifts upward over time — prices rising year over year — the forest will quietly under-predict the future while looking perfectly healthy on past data. When the target trends, reach for a model that can extrapolate.

---

**The hyperparameters worth knowing.**

A forest has more knobs than "how many trees." \`n_estimators\` is the tree count (more never hurts accuracy, just compute — diminishing past a few hundred). \`max_features\` is the diversity dial — how many features each split may consider (√p is a common default; fewer means more diverse trees). \`max_depth\` and \`min_samples_leaf\` control how deep each tree grows. \`bootstrap\` and \`max_samples\` control the resampling (turn bootstrap off and you lose OOB). \`class_weight\` up-weights a rare class, and \`criterion\` picks Gini/entropy or the regression split rule. In an interview, name \`n_estimators\`, \`max_features\`, \`max_depth\`, \`min_samples_leaf\`, and \`class_weight\` as the ones you'd actually tune.

---

**What the forest fixes — and what it doesn't.**

Be precise about the bias-variance story. Averaging many de-correlated trees mainly **reduces variance** — that's the whole wisdom-of-the-crowd effect. It does *not* reduce bias much: if the individual trees are systematically wrong because the signal is weak or a key feature is missing, averaging a thousand of them just gives you a very stable version of the same wrong answer. So a forest of deep trees can still be biased. Variance is what the crowd kills; bias you fix by adding signal, not trees.

---

**OOB is handy but not bulletproof.**

Out-of-bag error is a free estimate, but it assumes rows are independent and identically distributed. It quietly *lies* when they're not. With time-series data, OOB lets a tree "see the future" (rows from later dates train a tree that scores earlier ones), so it's optimistic — you need a time-based split instead. With grouped data (many rows per customer), OOB leaks across the group. And under distribution shift or leakage, OOB reflects the training distribution, not production. So use OOB as a cheap sanity check, not as a replacement for a properly designed validation scheme.

---

**Reading importances, carefully.**

Two importance traps. The built-in (impurity/Gini) importance is biased toward high-cardinality features — same issue as a single tree. Permutation importance is better but has its *own* correlated-feature trap: if two features carry the same information, shuffling one barely hurts accuracy because its twin still supplies the signal, so *both* look unimportant even though the information is vital. Don't read low permutation importance as "useless" when features are correlated. And a forest is far less interpretable than a single tree — for real explanation reach for permutation importance, partial-dependence/ICE plots, and SHAP, all read with the correlation caveat in mind.

---

**When the forest loses to boosting.**

A random forest is a fantastic *baseline*, but on tabular-accuracy leaderboards **gradient boosting usually wins.** The reason ties back to bias-variance: forests reduce variance but leave bias on the table, while boosting attacks bias by building trees sequentially, each correcting the last. The trade: boosting needs more careful tuning and is more sensitive to noise, outliers, and leakage (it will happily fit a leak that a forest partly averages away). So: forest for a fast, robust baseline; boosting when you'll invest tuning effort to squeeze out the last few points.

---

**Under imbalance.** A forest inherits the single tree's problem — it chases the majority class and its vote proportions get unreliable. Use \`class_weight='balanced'\` (or \`balanced_subsample\`), stratified CV so folds keep the rare class, threshold moving on the predicted probabilities, and judge with PR-AUC, balanced accuracy, or recall@K rather than raw accuracy.`,
    keyPoints: [
      `**Use a random forest when you want a strong, low-effort baseline on tabular data.**\n\nIt takes mixed feature types as they come, needs no scaling, shrugs off irrelevant features, and hands you free out-of-bag validation. Its defaults work well with almost no tuning, which makes it the reliable first thing to try on classification or regression. Reach for gradient boosting instead when you need to squeeze out the last couple of accuracy points and are willing to tune carefully — but for a fast, trustworthy baseline, the forest is hard to beat.`,
      `**The trap: thinking more trees is the lever. Past a couple hundred, adding trees barely moves anything.**\n\nThe crowd stops getting wiser once the individual errors have already averaged out — a five-hundredth near-identical tree changes almost nothing. What actually lowers a forest's error is making the trees *more different* from each other, and the dial for that is how many features each split may look at (max_features): show each split fewer features and the trees disagree more, their errors cancel better, and the error floor drops. Tune diversity, not quantity.`,
      `**The check: compare the out-of-bag error to your held-out test error.**\n\nOut-of-bag error is a free, honest estimate of how the forest does on data like its training set. If OOB says 10% but your real test error is 25%, something is off — usually the test data comes from a different distribution than training, or a leak made training look too easy. When the two disagree, compare the feature distributions of train and test before trusting the model in production.`,
      `**Be precise: the forest reduces variance, not bias — and OOB isn't bulletproof.**\n\nAveraging de-correlated trees kills variance (the wisdom-of-the-crowd effect) but barely touches bias, so a forest of weak or wrong trees is just a stable version of the same wrong answer — fix bias with signal, not more trees. And OOB assumes i.i.d. rows: it's optimistic on time-series (a tree sees the future), leaks across grouped data (many rows per customer), and reflects the training distribution under shift. Use OOB as a cheap check, not a substitute for a time- or group-aware validation split. Tune \`max_features\`, \`max_depth\`, \`min_samples_leaf\`, \`class_weight\` — not just \`n_estimators\`.`,
      `**Read importances with the correlation caveat, and know when boosting wins.**\n\nBuilt-in impurity importance is biased toward high-cardinality features; permutation importance is better but has its own trap — with two correlated features, shuffling one barely hurts (the twin still carries the signal), so both look unimportant even when vital. For real interpretation use permutation importance, PDP/ICE, and SHAP, all read cautiously. And a forest is a strong baseline but gradient boosting usually wins on tabular accuracy: boosting attacks the bias a forest leaves behind, at the cost of more tuning and more sensitivity to noise, outliers, and leakage. Under imbalance, use \`class_weight='balanced'\`, stratified CV, threshold moving, and PR-AUC.`,
    ],
    interactivePrompt: `Before you touch the controls: if you increase the number of trees from 100 to 1000 while keeping max_features fixed, how much do you expect the test accuracy to change?`,
    checkQuestions: [
      {
        q: `A random forest gives every tree the full dataset and all the features. It barely beats a single tree. Why, and what is the fix?`,
        options: [
          `\`A) The trees are overfitting because they grow too deep; simply cap their depth and the forest will immediately pull ahead of the single tree with no other change needed.\``,
          `\`B) With the full data and all features, every tree tends to make the same top splits, so they are near-copies that share the same mistakes — and averaging copies barely helps. Force diversity: give each tree a random resample of the rows (bagging) and let each split see only a random subset of features.\``,
          `\`C) A forest can never beat a single tree until it has thousands of trees; push the number of trees up into the thousands and the accuracy gap over the single tree will open on its own.\``,
          `\`D) The trees need different impurity measures — some using Gini, others entropy — because a forest only gains when its trees are optimising different split criteria against one another.\``,
        ],
        answer: `B`,
      },
      {
        q: `Your forest's out-of-bag error is 10%, but its error on a fresh test set is 25%. What does that gap most likely mean?`,
        options: [
          `\`A) The out-of-bag error estimates performance on data like the training set, so a big gap points to the test set coming from a different distribution — or a leak that made training look too easy. Compare the feature distributions of train and test before trusting the model.\``,
          `\`B) The gap is normal for forests, since out-of-bag rows are only about a third of the data and always underestimate the true error by roughly 15 points; just report the test number and move on without worrying.\``,
          `\`C) It means the forest simply has too few trees, so the out-of-bag estimate is still noisy; push the number of trees up to a few thousand and the two numbers will steadily converge to each other.\``,
          `\`D) It means the forest is underfitting on training and overfitting on test at the same time, a contradiction that clears up on its own if you just keep adding trees until both errors meet.\``,
        ],
        answer: `A`,
      },
      {
        q: `You train a regression forest on house prices up to 800k and deploy it as prices keep climbing. What silent failure should you expect?`,
        options: [
          `\`A) None — a forest averages many trees, and that averaging naturally lets it extend the upward price trend to values a little beyond anything it saw in training.\``,
          `\`B) It will start predicting wildly high values, because out-of-range inputs push the trees down into their deepest leaves, which then extrapolate the price trend aggressively.\``,
          `\`C) It will never predict above 800k, because every tree's answer is an average of training prices and the forest averages those — so as real prices climb past its training range it quietly under-predicts while still looking healthy on older data.\``,
          `\`D) It will refuse to predict on any house priced above 800k and return a missing value instead, which at least makes the failure loud and obvious rather than silent.\``,
        ],
        answer: `C`,
      },
      {
        q: `Two of your forest's features are highly correlated. You compute permutation importance and both come out near zero, yet dropping both together tanks accuracy. What is going on?`,
        options: [
          `\`A) The features are genuinely useless; the accuracy drop from removing both is a coincidence of retraining noise, so trust the permutation scores and drop them.\``,
          `\`B) Permutation importance shuffles one feature at a time, so when two features are correlated the shuffled one's information is still supplied by its untouched twin — accuracy barely moves and both look unimportant even though the information is vital. Don't read low permutation importance as "useless" under correlation; test the correlated group jointly.\``,
          `\`C) The near-zero scores mean the forest never split on either feature, so they were dropped internally during training and the accuracy drop must come from a different feature entirely.\``,
          `\`D) Correlated features always get inflated permutation importance, so near-zero scores prove they are truly irrelevant and the joint accuracy drop is a bug in the scoring code.\``,
        ],
        answer: `B`,
      },
      {
        q: `On a tabular problem your random forest baseline is good but a colleague says gradient boosting will likely beat it. In bias-variance terms, why — and what's the catch?`,
        options: [
          `\`A) Boosting wins because it reduces variance even more aggressively than bagging, and it does so with no downsides, so you should always prefer it over a forest.\``,
          `\`B) Boosting wins because it uses deeper trees than a forest, and depth is the only thing that drives tabular accuracy; the catch is simply that it trains more slowly.\``,
          `\`C) A forest mainly reduces variance but leaves bias on the table; boosting builds trees sequentially so each corrects the last, attacking that remaining bias — often winning on tabular accuracy. The catch: boosting needs more careful tuning and is more sensitive to noise, outliers, and leakage, which a forest partly averages away.\``,
          `\`D) There is no real reason — forests and boosting are mathematically equivalent, so the colleague is mistaken and the two will always score identically given the same data.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `A random forest is the wisdom of the crowd applied to decision trees: grow many trees, let them vote, and their errors cancel — but only if the trees are diverse, which bagging (random resamples) and random feature choices at each split make sure of. It throws in free out-of-bag validation, and its one silent trap is that a regression forest can never predict outside the range of values it trained on.`,
    recap: [
      "**Random forest = wisdom of the crowd on trees** — grow many, let them vote, errors cancel.",
      "**Only works if trees are diverse:** bagging (random resamples) + random feature subset at each split.",
      "**Reduces variance, not bias.**",
      "**Free OOB validation** — the ~37% left out of each bootstrap validate that tree.",
      "**More trees isn't the lever** — past a couple hundred, extra trees barely move anything.",
      "**Silent trap:** a regression forest can never predict outside its training range (no extrapolation).",
    ],
    interactiveId: 'random_forest_viz',
    figures: {
      bagging_forest: `<svg viewBox="0 0 480 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;font-family:var(--font-sans,sans-serif)">
  <rect x="14" y="92" width="66" height="46" rx="6" fill="none" stroke="var(--prime)" stroke-width="1.5"/>
  <text x="47" y="112" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">training</text>
  <text x="47" y="126" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">data</text>
  <!-- branches to 3 resamples -->
  <path d="M80 108 C 110 108, 110 55, 150 55" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M80 115 H 150" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M80 122 C 110 122, 110 175, 150 175" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <!-- 3 trees (root + two leaves) -->
  <g stroke="var(--amber)" stroke-width="1.4">
    <line x1="175" y1="45" x2="163" y2="63"/><line x1="175" y1="45" x2="187" y2="63"/>
    <line x1="175" y1="165" x2="163" y2="183"/><line x1="175" y1="165" x2="187" y2="183"/>
    <line x1="175" y1="105" x2="163" y2="123"/><line x1="175" y1="105" x2="187" y2="123"/>
  </g>
  <g fill="var(--amber)">
    <circle cx="175" cy="45" r="4"/><circle cx="163" cy="65" r="4"/><circle cx="187" cy="65" r="4"/>
    <circle cx="175" cy="105" r="4"/><circle cx="163" cy="125" r="4"/><circle cx="187" cy="125" r="4"/>
    <circle cx="175" cy="165" r="4"/><circle cx="163" cy="185" r="4"/><circle cx="187" cy="185" r="4"/>
  </g>
  <text x="205" y="58" fill="var(--ink-low)" font-size="9">tree 1</text>
  <text x="205" y="118" fill="var(--ink-low)" font-size="9">tree 2</text>
  <text x="205" y="178" fill="var(--ink-low)" font-size="9">tree 3</text>
  <!-- converge to vote -->
  <path d="M195 65 C 300 65, 300 115, 360 115" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M200 115 H 360" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M195 185 C 300 185, 300 115, 360 115" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <circle cx="385" cy="115" r="25" fill="none" stroke="var(--prime)" stroke-width="1.5"/>
  <text x="385" y="112" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">vote /</text>
  <text x="385" y="123" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">average</text>
  <path d="M410 115 H 448" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <polygon points="448,111 456,115 448,119" fill="var(--ink-low)"/>
</svg>`,
    },
  },
  {
    id: 'gradient_boosting',
    interactiveId: 'gradient_boosting_viz',
    title: 'Gradient Boosting & XGBoost',
    subtitle: 'Residual fitting, shrinkage, XGBoost regularisation, early stopping',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['gradient boosting', 'XGBoost', 'LightGBM', 'ensemble'],
    summary: `In 1988 two researchers, Kearns and Valiant, asked a question that sounds almost like a riddle: if all you have is a pile of *weak* learners — models barely better than a coin flip — could you somehow combine them into one *strong* learner that is nearly always right? Nobody knew. Two years later Robert Schapire proved the answer is **yes**, and the recipe he found is called **boosting**. It grew into AdaBoost, then into gradient boosting, and finally into **XGBoost** — the single algorithm that has won more competitions on tabular data than anything else ever built. Here is the idea, from the riddle to the champion.

---

**Why a random forest hits a wall.**

Picture a random forest on loan-default data. It reaches 88% accuracy and just... stops. You add more trees — nothing. You tune for two days — still 88%. Here is why. In a forest, every tree is trying to predict default from scratch, on its own, and then they all vote. Because they are all doing the same job in the same way, they tend to make the *same* mistakes. The handful of borrowers the forest gets wrong on tree number 1, it also gets wrong on tree number 500. Averaging a thousand opinions that share the same blind spot cannot remove the blind spot.

So we need a genuinely different idea. Do not train the trees independently and vote. Train them **one after another**, and make each new tree focus entirely on the mistakes the team has made so far.

---

**Watching it fix its own mistakes.**

Let us run it on four houses. Their real prices are 150k, 200k, 400k, and 600k.

Start with the laziest possible guess: predict the average price, 337.5k, for everyone. Now look at how far off that is — the **misses**. The two cheap houses were badly over-guessed (−187.5k and −137.5k); the two expensive ones badly under-guessed (+62.5k and +262.5k).

Now here is the move. Train a tiny tree — not to predict the price, but to predict those *misses*. A tiny tree can manage that much: "small houses, subtract a lot; big houses, add a lot." Add its correction on top of the average guess (and only a fraction of it, to stay safe). Re-check the misses: they have roughly halved. Train a second tiny tree on the new, smaller misses, add it, and they shrink again. And again. Each tree is never predicting the answer — it is chipping away at whatever the current team still gets wrong. That is boosting.

---

**The deep idea: this is gradient descent in disguise.**

Here is the part that turns a neat trick into a general engine. You have met gradient descent before: to train a model, you nudge its numbers a little in the direction that lowers the loss, over and over. Boosting is doing the very same thing — except instead of nudging a set of *numbers*, each step nudges the whole *prediction function*, by bolting on one more small tree.

And the "misses" we have been fitting are not just intuitive — they *are* the gradient. For squared-error loss, the direction that lowers the loss fastest at each house is exactly its miss (its residual). So "fit a tree to the misses" is a gradient step, precisely. Swap in a different loss and only the formula for the "miss" changes: for classification with log loss the miss becomes (actual − predicted probability); for ranking, or for predicting the 90th percentile instead of the average, it is something else again. The recipe itself never changes — always fit a tree to the negative gradient and add it on. That is why gradient boosting can chase almost any goal you can write down as a loss: you hand it the target, and it works out its own correction.

---

**Keeping it under control.**

Two dials keep boosting from wrecking itself. First, the trees are kept deliberately **weak** — usually just depth 3 to 5. This is the opposite of a random forest, where deeper is better. In boosting each tree is a single step, and a big greedy step chases the noise in the current misses and overshoots. Shallow trees take careful steps. Second, the **learning rate** shrinks each tree's contribution before adding it — many small steps generalise better than a few big ones, at the cost of needing more trees. And you never guess the number of trees: you use **early stopping** — keep adding trees, watch the score on a held-out set, and stop the moment it stops improving. The model finds its own best length.

---

**What made XGBoost the champion.**

Plain gradient boosting works, but XGBoost won by being smarter and faster in a few ways. It bakes **regularisation right into how it picks splits**: a split has to clear a minimum-benefit bar or XGBoost refuses to make it, so it does not sprout pointless leaves that only fit noise. It also looks not just at the *slope* of the loss but at its *curvature* — a second-order view that tells it how big a step it can safely take in each region, so it stays cautious in flat, uncertain areas. Add years of engineering (clever handling of missing values, and heavy use of every CPU core) and you get a model that is both more accurate and much faster than the textbook version. Its cousin **LightGBM** pushes speed further by growing trees one leaf at a time and bucketing feature values, which really pays off on very large datasets.

So the map is simple. Reach for a **random forest** when you want a strong, hands-off baseline that shrugs off noise and needs almost no tuning. Reach for **gradient boosting (XGBoost or LightGBM)** when you want the last few points of accuracy and are willing to tune the learning rate, the tree depth, and the stopping carefully — because here each tree is a step, and steps can overshoot.

---

**Where AdaBoost fits in.**

Boosting's first hit was **AdaBoost**, and its mechanism is worth contrasting. AdaBoost doesn't fit residuals — it **reweights rows**: after each weak tree, the examples it got wrong get *heavier*, so the next tree is forced to focus on them, and the trees are combined with weights based on their accuracy. **Gradient boosting** generalises this: instead of reweighting rows, it fits each tree to the *negative gradient* of any differentiable loss. AdaBoost turns out to be (approximately) gradient boosting with a specific exponential loss — so gradient boosting is the strictly more general framework, which is why it took over.

---

**How boosting does classification.**

For regression the "miss" is the plain residual. For **binary classification** it's subtler and a favourite interview probe: the trees don't fit the raw 0/1 labels, they fit the gradient of **log loss in logit (log-odds) space**, which works out to (actual − predicted probability). So boosting accumulates trees that output **margins/logits**, and only at the end are those passed through a sigmoid to become probabilities — exactly like logistic regression's pipeline, but with a sum of trees producing the logit instead of a linear equation.

---

**XGBoost's objective, written down.**

XGBoost's edge is an explicit objective: **training loss + a regularisation term over the trees**, roughly

$\\text{Obj} = \\sum_i L(y_i, \\hat{y}_i) + \\sum_t \\big[\\,\\gamma T_t + \\tfrac{1}{2}\\lambda \\lVert w_t \\rVert^2\\,\\big]$

where $T_t$ is the number of leaves in tree $t$, $w_t$ its leaf values, $\\gamma$ penalises adding leaves, and $\\lambda$ shrinks leaf values (L2). To decide each split it computes a **gain** using the first derivative (gradient, $g$) *and* the second derivative (Hessian, $h$) of the loss, minus $\\gamma$. A split is only made if its gain clears $\\gamma$ — that's the "minimum-benefit bar," made precise. This is why XGBoost resists overfitting where plain gradient boosting sprouts noisy leaves.

---

**The hyperparameters that matter.**

Know these by name: \`learning_rate\` (eta) — step size; \`n_estimators\` — number of trees (let early stopping set it); \`max_depth\` — tree depth (shallow, 3–6); \`min_child_weight\` — minimum Hessian per leaf, a stronger overfitting guard than min-samples; \`gamma\` — the minimum split gain; \`subsample\` and \`colsample_bytree\` — row and column sampling for diversity; \`reg_lambda\` (L2) and \`reg_alpha\` (L1) on leaf weights; \`scale_pos_weight\` for imbalance; and \`eval_metric\` for the early-stopping signal. The high-leverage tuning trio is learning_rate × n_estimators (traded off) plus max_depth.

---

**Boosting is a leakage magnet.**

Because boosting relentlessly hunts the residual, it will happily latch onto a leaky feature and inflate your validation score in a way a forest would partly average away. So validation discipline matters more here than anywhere: use **time-based splits** for temporal data and **group-based splits** when rows cluster (per user), and run **early stopping on a proper validation fold — never on the test set**, or you leak the test set into model selection. A boosting model that looks too good usually has a leak.

---

**Reading importances, and the three flavours.**

XGBoost exposes three different importance types and they disagree: **weight** (how often a feature is split on), **cover** (how many samples its splits touch), and **gain** (how much its splits improved the loss — usually the most meaningful). Don't quote "feature importance" without saying which. And as with forests, all of them get distorted by correlated features, so cross-check with permutation importance or SHAP.

---

**XGBoost vs LightGBM vs CatBoost.**

They're not interchangeable. **XGBoost** is the stable, general-purpose default. **LightGBM** grows trees leaf-wise and buckets feature values, so it's usually much faster on large data (at a slightly higher overfitting risk on small data). **CatBoost** handles categorical features natively with ordered target statistics and often wins on categorical-heavy datasets with less preprocessing. Rough guide: large data → LightGBM, lots of categoricals → CatBoost, safe default → XGBoost.

---

**Under imbalance.** Boosting handles rare classes better than most, but still tune \`scale_pos_weight\` (roughly negatives/positives) to up-weight the minority, move the decision threshold, and judge with PR-AUC or recall@K rather than accuracy. And check calibration — heavy imbalance plus regularisation can leave the predicted probabilities off even when ranking is good.`,
    keyPoints: [
      `**What gradient boosting is, and when to reach for it: trees trained in a line, each one fixing the team's leftover mistakes.**\n\nOnce it is tuned, gradient boosting is usually the most accurate thing you can run on tabular data — it chips away at both bias and variance, where a random forest only fights variance. That accuracy is why it wins most structured-data competitions. Use XGBoost or LightGBM instead of the basic scikit-learn version: both are faster, come with regularisation built in, and support early stopping out of the box. Lean on LightGBM for very large datasets (its leaf-by-leaf growth is quicker) and XGBoost for smaller ones, where the extra caution against overfitting helps.`,
      `**The trap: fixing the number of trees up front instead of letting early stopping choose it.**\n\nWith a learning rate of 0.1 and 1000 trees hard-coded, the held-out loss usually bottoms out somewhere around 200–400 trees and then starts climbing as the extra trees begin memorising noise. Hard-code the count and you sail right past the best point into an overfit model. Instead, always turn on early stopping (stop after about 50 rounds with no improvement) and let the model pick its own tree count. Then, to squeeze out a little more, lower the learning rate and re-run — smaller steps often reach a slightly better place.`,
      `**The check to run: plot the training loss and the held-out loss against the number of trees.**\n\nHeld-out loss still falling means you are underfitting — add trees or lower the learning rate. Held-out loss flat and close to the training loss means you are in good shape. Held-out loss creeping up while training loss keeps dropping means you are overfitting — stop earlier, use shallower trees, or let each tree see only a random subset of the rows. If the held-out loss never comes down at all, your learning rate is probably too high; start it around 0.05 to 0.1.`,
      `**Place it in the family and know the objective: AdaBoost reweights rows, gradient boosting fits the gradient of any loss, and XGBoost regularises explicitly.**\n\nAdaBoost up-weights misclassified rows; gradient boosting generalises that to fitting each tree to the negative gradient of a differentiable loss (AdaBoost ≈ gradient boosting with exponential loss). For binary classification the trees fit the log-loss gradient (actual − predicted probability) in logit space and are squashed to probabilities only at the end. XGBoost's objective is loss + $\\gamma T + \\tfrac12\\lambda\\lVert w\\rVert^2$, and it scores splits with gradients *and* Hessians minus $\\gamma$ — a split must clear $\\gamma$ to be made.`,
      `**Boosting is leakage-sensitive, so tune the right knobs and validate honestly.**\n\nBecause it hunts the residual, boosting will exploit a leaky feature that a forest averages away — so use time-based or group-based splits and run early stopping on a validation fold, never the test set. Key knobs: \`learning_rate\`×\`n_estimators\` (traded off), \`max_depth\`, \`min_child_weight\`, \`gamma\`, \`subsample\`/\`colsample_bytree\`, \`reg_lambda\`/\`reg_alpha\`, and \`scale_pos_weight\` for imbalance. Rough library map: large data → LightGBM (leaf-wise, fast), categorical-heavy → CatBoost (native handling), safe default → XGBoost. And name which importance you mean — weight, cover, or gain (gain is usually most meaningful) — since they disagree and correlated features distort all three.`,
    ],
    interactivePrompt: `Before you touch the controls: if you halve the learning rate, do you expect the optimal number of trees to increase, decrease, or stay the same?`,
    checkQuestions: [
      {
        q: `A random forest on your data plateaus at 88% no matter how many trees you add. Why does boosting have a real shot at doing better?`,
        options: [
          `\`A) Boosting simply uses deeper trees than a forest, and deeper trees always capture more of the pattern, so it breaks past any accuracy ceiling a shallow-tree forest happens to run into.\``,
          `\`B) In a forest every tree predicts from scratch and votes, so they share the same blind spots and averaging cannot remove them. Boosting trains trees in sequence, each one aimed only at the mistakes the team still makes, so it keeps attacking the errors a forest is stuck on.\``,
          `\`C) Boosting can train far more trees than a forest ever could, and past roughly 10,000 trees the sheer number is enough to average away any error the forest happened to be stuck with.\``,
          `\`D) Boosting uses a completely different base model — linear models instead of trees — and linear models simply do not share the blind spots that make a forest of trees plateau in the first place.\``,
        ],
        answer: `B`,
      },
      {
        q: `In gradient boosting for a regression problem, what is each new tree actually trained to predict?`,
        options: [
          `\`A) The true house price directly, exactly like every tree in a random forest — the trees are then averaged together at the end to smooth out their individual errors into one prediction.\``,
          `\`B) A reweighted copy of the original target, where the rows the team got wrong are duplicated many times so the next tree naturally ends up paying them more attention than the rest.\``,
          `\`C) The current misses — how far off the team's running prediction is on each row. It adds a shrunk version of that correction on top, so each tree chips away at the leftover error instead of predicting the price from scratch.\``,
          `\`D) A yes/no flag for whether the current prediction is too high or too low, which the ensemble then uses to nudge every prediction by one fixed amount in the flagged direction.\``,
        ],
        answer: `C`,
      },
      {
        q: `You train XGBoost with 1000 trees at learning rate 0.1. The held-out loss bottoms out around tree 200, then starts rising. What is going on, and what do you do?`,
        options: [
          `\`A) The rise after tree 200 means the learning rate is too high and the steps are overshooting; drop it to 0.01, keep all 1000 trees, and the loss will now fall smoothly all the way to the very end.\``,
          `\`B) The extra trees past 200 are memorising training noise — that is overfitting, and the real best size is about 200 trees, not 1000. Turn on early stopping (stop after ~50 rounds with no improvement) so the model picks that point itself; then optionally lower the learning rate and re-run for a bit more.\``,
          `\`C) The flattening at tree 200 means the model has fully converged, and the later rise is just noise in the held-out estimate; keep all 1000 trees, since removing any of them would hurt real-world predictions.\``,
          `\`D) The rising loss means your held-out set is simply too small to measure reliably; switch to reporting the training loss instead, which keeps decreasing and gives you a stable, trustworthy stopping signal.\``,
        ],
        answer: `B`,
      },
      {
        q: `Why is gradient boosting called "gradient descent in function space," and why does that let it handle classification, ranking, and custom goals with the same algorithm?`,
        options: [
          `\`A) Ordinary gradient descent nudges a set of numbers to lower the loss; boosting instead nudges the whole prediction function, by adding a small tree each step. That tree is fit to the negative gradient of the loss — which for squared error is exactly the misses — so changing the loss only changes the gradient formula, and the same recipe fits any differentiable goal.\``,
          `\`B) Because each tree literally stores the derivative of the loss in its leaves, so summing the trees is the same as summing derivatives — which is exactly Newton's method, and Newton's method already works on any loss you hand it.\``,
          `\`C) Because boosting searches over the space of every possible function at once and picks the single best one, so no matter which loss you choose it can always jump straight to the global optimum in a single pass.\``,
          `\`D) Because the trees are secretly linear models sitting in a transformed feature space, and linear models can be trained under any loss, which is the property that carries over to classification and ranking.\``,
        ],
        answer: `A`,
      },
      {
        q: `How does AdaBoost differ from gradient boosting, and how does gradient boosting do binary classification?`,
        options: [
          `\`A) AdaBoost and gradient boosting are the same algorithm under two names; both fit residuals, and for classification both fit the raw 0/1 labels directly with a squared-error loss.\``,
          `\`B) AdaBoost reweights misclassified rows so the next tree focuses on them; gradient boosting instead fits each tree to the negative gradient of any differentiable loss (AdaBoost ≈ the exponential-loss special case). For binary classification the trees fit the log-loss gradient (actual − predicted probability) in logit space, and a sigmoid converts the accumulated logits to probabilities only at the end.\``,
          `\`C) AdaBoost fits gradients of a general loss while gradient boosting only reweights rows, so gradient boosting is the older and less flexible of the two.\``,
          `\`D) Gradient boosting cannot do classification at all — it is regression-only — which is why AdaBoost, a separate classification-only method, still has to be used for any yes/no task.\``,
        ],
        answer: `B`,
      },
      {
        q: `Your XGBoost model scores a suspiciously high 0.99 AUC on a random 80/20 split of time-ordered transaction data. What is the most likely problem?`,
        options: [
          `\`A) Nothing is wrong — XGBoost is simply that accurate on tabular data, so 0.99 AUC on the random split is a trustworthy estimate of production performance.\``,
          `\`B) The learning rate is too low, which inflates AUC on the validation split; raise it and the 0.99 will settle to a realistic number.\``,
          `\`C) A random split of time-ordered data lets the model train on future rows and predict past ones, and boosting aggressively exploits any resulting leakage — so the 0.99 is optimistic. Use a time-based (and group-based, if rows cluster) split, and run early stopping on a proper validation fold rather than the test set.\``,
          `\`D) The AUC is high because XGBoost has too many trees; cap n_estimators at 50 and the leakage will disappear along with the inflated score.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Gradient boosting trains trees in a line, each one fitting the team's current misses — and those misses are literally the loss gradient, so every tree is one careful step of gradient descent on the prediction function. That is why it handles any goal you can write as a loss, why the trees stay shallow and the steps small, and why early stopping (not a fixed tree count) is how you size it. XGBoost won by baking regularisation and curvature into every split.`,
    recap: [
      "**Gradient boosting = trees trained in a line,** each fitting the team's current misses.",
      "**Those misses are literally the loss gradient** — every tree is one gradient-descent step in function space.",
      "**Handles any goal you can write as a loss;** trees stay shallow, steps (learning rate) stay small.",
      "**Size it with early stopping, not a fixed tree count** — plot train + held-out loss vs number of trees.",
      "**Family:** AdaBoost reweights rows, gradient boosting fits the gradient, XGBoost regularises explicitly + uses curvature.",
      "**Leakage-sensitive** — tune the right knobs and validate honestly.",
    ],
  },
  {
    id: 'ensembles',
    interactiveId: 'ensemble_viz',
    title: 'Ensemble Methods',
    subtitle: 'Bagging vs boosting vs stacking, diversity principle',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['ensembles', 'stacking', 'bagging', 'boosting'],
    summary: `In 2006 Netflix offered a one-million-dollar prize to anyone who could beat their movie-recommendation system by 10%. Teams around the world chased it for three years. And the winning entry, when it finally crossed the line, was not one brilliant model — it was a **blend** of dozens of different models mashed together. That was the lesson the whole field took away: a crowd of different models, combined, beats any single model, even the best one. That is **ensembling**.

Here it is in miniature. A bank wants to predict loan default. A decision tree scores 76%. Logistic regression: 78%. A random forest: 84%. Good, not great. Then they take all three and simply let them vote on each applicant. The combination scores 86% — higher than the best single model in the mix. How do three so-so models add up to something better than the best of them?

---

**Why combining works — and its one condition.**

The trick is that the models are wrong in *different places*. The tree blunders on some applicants; logistic regression happens to get those right; the forest covers a third set. When they vote, each model's mistakes are outvoted by the other two, while their correct answers pile up and agree. The errors cancel; the truth reinforces.

But here is the whole secret: this only works if the models make *different* mistakes. If all three fail on exactly the same applicants, voting changes nothing — you have just repeated one opinion three times. So the single thing that makes an ensemble strong is **diversity**: models whose errors are unrelated. Two mediocre models that fail in different places beat two excellent models that fail in the same places. Diversity, not raw accuracy, is the lever.

---

**Three ways to build a diverse crowd.**

There are three classic recipes, and you have already met two of them.

**Bagging** builds diversity through data: train each model on a different random resample of the rows, then average. That is exactly what a random forest does, and it mainly cuts *variance* (the twitchiness).

**Boosting** builds diversity through sequence: train models one after another, each focused on the mistakes the team has made so far. That is gradient boosting, and it mainly cuts *bias* (the systematic miss).

**Stacking** is the most general and the most powerful. Train several genuinely different models — a tree, a linear model, maybe a neural net — then train one more small model, a **meta-learner**, whose only job is to learn *how much to trust each model in which situation*. It might learn "trust the boosting model for high-income applicants, but lean on logistic regression for people with thin credit files." It learns to combine, rather than just averaging.

[FIGURE: stacking_ensemble]

---

**The one trap that quietly ruins stacking.**

Stacking has a subtle failure mode you have to design around. To train the meta-learner, you feed it the base models' predictions. But if you let each base model predict on the very rows it was trained on, those predictions are dishonestly good — the models have partly *memorised* those rows, so their outputs look far more reliable than they will be on fresh data. The meta-learner then learns to trust a signal that vanishes at test time, and the whole stack falls apart in production.

The fix is **out-of-fold predictions**: split the data into folds, train each base model on some folds, and have it predict only on the folds it did *not* see. Those held-out predictions are honest — they show what the base models can really do on unseen rows — so the meta-learner learns from the truth instead of a memory.

---

**The belief to drop.**

"More models always help." No — *diversity* helps. Bolt a fifth copy of the same random forest onto your ensemble and you gain essentially nothing; it makes the same mistakes as the other four, so the vote does not budge. But add a model built on a *different* idea — a linear model beside your trees — and even if it is individually weaker, it can lift the whole ensemble, because it fails in places the others do not. When an ensemble stops improving, do not add more of the same. Add something different.

---

**Hard votes versus soft votes.**

There are two ways to let classifiers vote. **Hard voting** counts labels — majority wins. **Soft voting** averages the predicted *probabilities* and then thresholds, which usually works better because a model that's 0.9 sure should outweigh one that's barely 0.51. But soft voting has a prerequisite that trips people up: it only makes sense if the base models are **calibrated**. If one model is systematically overconfident, its inflated probabilities dominate the average and drag the ensemble toward its mistakes. So calibrate the base models (or at least check them) before averaging probabilities — otherwise soft voting can underperform plain hard voting.

---

**Blending versus stacking.**

Two ways to make the honest meta-features, and interviewers like the distinction. **Stacking** uses **K-fold out-of-fold** predictions: every row gets a prediction from a base model that didn't train on it, so you use all the data for both levels. **Blending** is the simpler cousin — hold out a single validation set, train base models on the rest, and let them predict once on that holdout to build meta-features. Blending is easier and has zero fold-leakage risk, but it "wastes" the holdout (base models never train on it) and gives the meta-learner less data. Stacking is more data-efficient but must handle folds carefully.

---

**Keep the meta-learner simple.**

The meta-learner's input is just a handful of base-model predictions, so it needs almost no capacity. A **regularised logistic regression** (or plain linear model) is the standard choice, and for good reason: a complex meta-learner (another boosting model on top) easily *overfits* the base predictions, especially since those predictions are highly correlated. Simple meta-learner, honest out-of-fold features — that's the reliable recipe.

---

**Out-of-fold must respect time and groups.**

The OOF trick assumes rows are independent — and it leaks exactly like OOB does when they aren't. For **time-series** data, a random fold lets a base model see the future when generating a "held-out" prediction for the past, so the meta-features are leaked; you need time-ordered folds. For **grouped** data (many rows per user), all of a user's rows must fall in the same fold, or a base model trained on some of a user's rows predicts the rest. Get this wrong and the stack looks brilliant offline and collapses in production — the ensemble version of the same leakage that haunts every model here.

---

**Ensembles aren't free.**

The accuracy comes with real costs worth naming: every base model must run at inference, so **latency and memory multiply**; retraining and deployment get more complex; debugging a wrong prediction across five models is far harder than for one; and interpretability drops sharply. For a point or two of accuracy you may pay 5× the serving cost — sometimes worth it (a fraud model, a Kaggle prize), often not (a latency-bound real-time system). That's why production frequently ships a single boosted model or *distills* the ensemble into one smaller model.

---

**Where diversity actually comes from.**

Diversity isn't only "different algorithms." You can manufacture it from different **feature subsets**, different **training samples** (bagging), different **loss functions**, different **random seeds**, different **hyperparameters**, different **time windows**, and even different **target definitions**. The most robust ensembles combine several of these axes at once — a tree and a linear model, on different feature sets, with different seeds — because the more *independent* the sources of disagreement, the better the errors cancel.`,
    keyPoints: [
      `**Reach for stacking when you already have several different models and enough data to make out-of-fold predictions.**\n\nIt almost always beats any single model by a point or two, because a small meta-learner can work out which base model to trust where — leaning on boosting for one kind of case and a linear model for another. The cost is training time and a bit of plumbing (the out-of-fold step). For a quick win without the plumbing, even a plain average of a few diverse models' probabilities usually edges out the best one on its own.`,
      `**The trap that quietly ruins a stack: feeding the meta-learner predictions the base models made on their own training rows.**\n\nA base model partly memorises the rows it trained on, so its predictions there look far better than they will be on new data. Train the meta-learner on those and it learns to trust a signal that disappears at test time. Always build the meta-features from out-of-fold predictions — each base model predicts only on rows it did not train on. In scikit-learn, cross_val_predict gives you these in a single call.`,
      `**The check: look at whether your models actually make different mistakes.**\n\nFor each model, mark which examples it got wrong on a held-out set, then compare those error patterns across models. If two models are wrong on almost exactly the same examples, they are effectively one model for ensemble purposes and combining them buys nothing. When errors are that correlated, do not add another similar model — add one built on a different idea (a different algorithm, or different features), which is the only thing that will actually move the ensemble.`,
      `**Soft voting beats hard voting only if the base models are calibrated, and blending and stacking make honest meta-features differently.**\n\nHard voting counts labels; soft voting averages probabilities (usually better) but is dominated by an overconfident model unless the bases are calibrated first. Stacking builds meta-features from K-fold out-of-fold predictions (data-efficient); blending uses a single holdout (simpler, no fold-leakage, but wastes data). Keep the meta-learner simple — a regularised logistic/linear model — since a complex one overfits the correlated base predictions.`,
      `**Respect time/group boundaries in OOF, and weigh the real cost of ensembling.**\n\nOut-of-fold prediction leaks exactly like OOB when rows aren't independent: use time-ordered folds for temporal data and keep each group (all of a user's rows) in one fold, or the stack looks great offline and dies in production. And ensembles aren't free — every base model runs at inference, so latency, memory, retraining complexity, debugging difficulty, and opacity all multiply for a point or two of accuracy, which is why production often ships one boosted model or distills the ensemble. Manufacture diversity from many axes: algorithms, feature subsets, samples, losses, seeds, hyperparameters, time windows, target definitions.`,
    ],
    interactivePrompt: `Before you touch the controls: if you replace one model in the ensemble with an identical copy of an existing model (same algorithm, same hyperparameters, same training data), do you expect the ensemble accuracy to go up, stay the same, or go down?`,
    checkQuestions: [
      {
        q: `Your stacking ensemble looks great in training but flops on validation. The base models' predictions on their own training rows were used as the meta-learner's inputs. What went wrong, and what is the fix?`,
        options: [
          `\`A) The meta-learner is too complex and simply memorised the base models' outputs; swap it for a plain linear model with no regularisation and the training-to-validation gap will close on its own.\``,
          `\`B) The base models are too similar, so their outputs are correlated and confuse the meta-learner into chasing spurious patterns; drop all but one of them and the ensemble will stop overfitting.\``,
          `\`C) Leakage. On rows they trained on, the base models partly memorised the labels, so their predictions there look far too good — the meta-learner learns to trust a signal that will not exist on new data. Fix it with out-of-fold predictions: each base model predicts only on rows it did not train on, so the meta-learner learns from honest outputs.\``,
          `\`D) The training set is too big for the meta-learner, which finds patterns in the base outputs that do not generalise; subsample it down to roughly ten times the number of base models before fitting the meta-learner.\``,
        ],
        answer: `C`,
      },
      {
        q: `Three so-so models combine into an ensemble that beats the best of them. What makes that possible?`,
        options: [
          `\`A) The ensemble quietly picks whichever single model is best on each example and copies its answer, so it can never do worse than the strongest member and usually just matches it exactly.\``,
          `\`B) The models are wrong in different places, so when they vote each one's mistakes get outvoted by the others while their correct answers agree and pile up. This works only when their errors differ — combining models that fail on the same examples gains nothing.\``,
          `\`C) Averaging always beats any single model mathematically, regardless of which models are involved, because it reduces error by a fixed factor equal to the number of models in the ensemble.\``,
          `\`D) Each model corrects the previous one's leftover errors in turn, so the mistakes shrink step by step — which is why three weak models chained together beat the strongest single one.\``,
        ],
        answer: `B`,
      },
      {
        q: `Two models are wrong on exactly the same examples. What does combining them get you, and what does that show?`,
        options: [
          `\`A) A big jump — combining two models always multiplies their strengths, so even identical-error models produce an ensemble comfortably above either one on its own.\``,
          `\`B) The higher of the two accuracies, because probability averaging amplifies the more confident model's correct answers and quietly discards the weaker model's mistakes.\``,
          `\`C) An undefined result, because two models agreeing on wrong answers make the ensemble's output mathematically unstable until a third, independent model is added to break the tie.\``,
          `\`D) Nothing — with identical errors there is nothing to cancel, so the ensemble scores the same as either model alone. It shows that diversity, not model count, is what makes ensembles work: unrelated errors cancel, identical ones do not.\``,
        ],
        answer: `D`,
      },
      {
        q: `You switch a voting ensemble from hard voting to soft voting (averaging probabilities) and it gets worse. One base model is badly overconfident. Why did soft voting hurt?`,
        options: [
          `\`A) Soft voting is always worse than hard voting because averaging probabilities discards the majority signal; revert to hard voting as a rule.\``,
          `\`B) Soft voting averages predicted probabilities, so an uncalibrated, overconfident model pushes extreme values (near 0 or 1) that dominate the average and drag the ensemble toward its mistakes. Calibrate the base models first (or check calibration) before averaging probabilities — otherwise hard voting can beat soft voting.\``,
          `\`C) The overconfident model has too few trees, so its probabilities are noisy; adding more trees to just that model fixes soft voting without any calibration step.\``,
          `\`D) Soft voting requires all base models to be the same algorithm; mixing a tree with a linear model is what actually broke it, not calibration.\``,
        ],
        answer: `B`,
      },
      {
        q: `You're stacking models on time-ordered transaction data and generate out-of-fold meta-features with a plain random K-fold split. What's the risk?`,
        options: [
          `\`A) No risk — out-of-fold predictions are leak-proof by construction, so a random split is always safe for stacking regardless of the data type.\``,
          `\`B) The only risk is slower training; random folds are statistically fine for time-series stacking, just less efficient than time-ordered ones.\``,
          `\`C) A random fold lets a base model train on future rows and produce a 'held-out' prediction for a past row, leaking the future into the meta-features. The stack looks excellent offline and collapses in production. Use time-ordered folds (and keep each user/group's rows in one fold) so the OOF predictions stay honest.\``,
          `\`D) The risk is that the meta-learner overfits, which you fix by using a more powerful meta-learner such as a boosting model on top of the base predictions.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `An ensemble combines several models and beats the best single one — but only because they make different mistakes, so voting cancels the errors. Diversity, not the number of models, is the lever: bagging builds it from different data, boosting from fixing mistakes in sequence, and stacking by training a meta-learner to combine genuinely different models — using out-of-fold predictions, or the whole thing leaks.`,
    recap: [
      "**Ensemble = combine several models, beat the best single one** — because they make different mistakes and voting cancels errors.",
      "**Diversity, not count, is the lever.**",
      "**Bagging** builds diversity from different data; **boosting** from fixing mistakes in sequence; **stacking** trains a meta-learner over different models.",
      "**Stacking must use out-of-fold predictions** — feed the meta-learner base predictions on their own training rows and it leaks.",
      "**Soft voting beats hard voting only if base models are calibrated.**",
      "**Respect time/group boundaries in OOF, and weigh the real cost of ensembling.**",
    ],
    interactiveId: 'ensemble_viz',
    figures: {
      stacking_ensemble: `<svg viewBox="0 0 480 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;font-family:var(--font-sans,sans-serif)">
  <text x="70" y="20" text-anchor="middle" fill="var(--ink-low)" font-size="9">base models</text>
  <rect x="20" y="35" width="100" height="34" rx="6" fill="none" stroke="var(--amber)" stroke-width="1.4"/>
  <text x="70" y="56" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">decision tree</text>
  <rect x="20" y="88" width="100" height="34" rx="6" fill="none" stroke="var(--amber)" stroke-width="1.4"/>
  <text x="70" y="109" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">linear model</text>
  <rect x="20" y="141" width="100" height="34" rx="6" fill="none" stroke="var(--amber)" stroke-width="1.4"/>
  <text x="70" y="162" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">boosting</text>
  <!-- arrows to meta-learner -->
  <path d="M120 52 C 190 52, 190 105, 250 105" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M120 105 H 250" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M120 158 C 190 158, 190 105, 250 105" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <!-- meta-learner -->
  <rect x="250" y="82" width="110" height="46" rx="8" fill="none" stroke="var(--prime)" stroke-width="1.6"/>
  <text x="305" y="101" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">meta-learner</text>
  <text x="305" y="116" text-anchor="middle" fill="var(--ink-low)" font-size="9">learns who to trust</text>
  <!-- output -->
  <path d="M360 105 H 405" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <polygon points="405,101 413,105 405,109" fill="var(--ink-low)"/>
  <text x="440" y="102" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">final</text>
  <text x="440" y="115" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">answer</text>
</svg>`,
    },
  },
  {
    id: 'svm',
    interactiveId: 'svm_viz',
    title: 'Support Vector Machines',
    subtitle: 'Maximum-margin hyperplane, kernel trick, soft margin',
    difficulty: 'advanced',
    estimatedMin: 30,
    tags: ['SVM', 'kernel', 'margin', 'dual'],
    summary: `You are classifying loan applicants as default or no-default. You have a linearly separable training set — there exists some line that perfectly separates the two classes. Logistic regression will find one such line, whichever one minimises cross-entropy loss. But there are infinitely many separating lines. Which one do you want?

SVMs say: the one that is furthest from all training points. If you draw the two parallel boundary lines that touch the nearest points from each class, the space between them is the margin. A wider margin means more room for error — new test points that fall near the boundary are more likely to land on the correct side. Maximize the margin and you minimize the worst-case generalization error. This is the structural risk minimization principle.

[FIGURE: svm_margin]

Only a subset of training points define the boundary. The points that sit exactly on the margin edges — the closest points to the boundary — are the support vectors. Move any other training point and the boundary does not change at all. This sparsity is a structural property of the solution: the entire decision boundary is determined by a small minority of training examples.

Real data is not linearly separable. The soft-margin extension introduces slack variables $ξ_i \\geq 0$: allow some points to violate the margin, but penalise each violation with cost $C$. Large $C$: tight margin, few violations, the model tries to classify everything correctly, prone to overfitting. Small $C$: wide margin, allows more violations, smoother boundary, better generalisation. C is the bias-variance dial.

The kernel trick makes non-linear boundaries possible without changing the algorithm. The dual form of the SVM only needs dot products $x_i^T x_j$ between training points — it never needs the feature vectors explicitly. Replace each dot product with a kernel function $k(x_i, x_j) = φ(x_i)^Tφ(x_j)$ for some mapping $φ$. The RBF kernel $k(x, x') = \\exp(-γ \|x - x'\|^2)$ corresponds to an infinite-dimensional feature space. You never compute $φ(x)$ — you only compute $k(x_i, x_j)$, which is cheap. The SVM finds a linear separator in the infinite-dimensional space, which appears non-linear back in the original space.

**NOT this.** Most people think "SVMs are about the kernel." The kernel is how you apply maximum margin to non-linear boundaries — but maximum margin is the core idea, and the kernel is just a tool. Many practitioners can explain RBF kernels but cannot explain why maximum margin generalises well (structural risk minimization — the margin controls the VC dimension of the classifier). Without the why, you cannot diagnose when SVMs fail or explain their behavior to a stakeholder.

The hard limit: SVMs stall at $n > 50\\text{K}$. The kernel matrix $K$ where $K_{ij} = k(x_i, x_j)$ requires $O(n^2)$ memory — 80GB for $n = 100\\text{K}$ in float64. Training time is $O(n^2)$ to $O(n^3)$. For large datasets, use gradient boosting or linear models with SGD.`,
    keyPoints: [
      `**Use kernel SVMs when n < 50K, the feature space is moderate-dimensional, and you have reason to believe the data is separable with a wide margin (e.g., clean binary classification with low noise).**\n\nSVMs excel on small, clean datasets with well-defined boundaries — classic use cases include bioinformatics, text classification with TF-IDF features (linear SVM), and image patches. For n > 50K, switch to sklearn's LinearSVC (liblinear solver, O(nd) time) or SGDClassifier with hinge loss. Always StandardScaler before any SVM — the RBF kernel uses Euclidean distance and an unscaled feature with range [0, 1000] will dominate a feature with range [0, 1] regardless of predictive value.`,
      `**The production trap: tuning C and γ separately instead of jointly, and forgetting to scale features.**\n\nC and γ interact: C=10, γ=0.01 produces a very different boundary than C=10, γ=10. A coarse grid search that sweeps C with fixed γ will miss the optimum. Always use a 2D grid on log scale: C ∈ {0.01, 0.1, 1, 10, 100}, γ ∈ {0.001, 0.01, 0.1, 1, 10}. The interaction means you need 25 combinations minimum, not 5 + 5. Missing feature scaling is the single most common reason for SVM underperformance — a single unscaled feature can make the kernel compute pure noise.`,
      `**The diagnostic: count the support vectors. Too many (> 50% of training data) means C is too large or γ is too small — the boundary is effectively ignoring the margin constraint. Too few may mean underfitting.**\n\nA well-calibrated SVM typically has 5–30% of training examples as support vectors. Run svm.n_support_ after fitting. If it is near n, reduce C or increase γ to enforce a wider margin. Check test accuracy on a held-out set and compare to a logistic regression baseline — if they are within 1–2%, the kernel is not buying you anything and logistic regression is the simpler, faster choice.`,
    ],
    interactivePrompt: `Before you touch the controls: if you move a training point that is far from the decision boundary to a completely different location, do you expect the boundary to change?`,
    checkQuestions: [
      {
        q: `Your SVM with RBF kernel underfits the training data. What do you adjust, and what is the risk of each change?`,
        options: [
          `\`A) Underfitting means the model is too simple. Switch from RBF kernel to a polynomial kernel with degree=5 — higher-degree polynomial kernels have more capacity and will fit the training data better. Risk: polynomial kernels are numerically unstable at high degrees.\``,
          `\`B) Underfitting with RBF SVM means C is too high — the model is penalising slack variables too heavily, forcing the boundary to accommodate all training points even when they are noisy. Reduce C (e.g., C=0.01) to allow more margin violations and let the boundary smooth out.\``,
          `\`C) Underfitting means the feature space is too low-dimensional. Add polynomial features (degree 2 or 3) to the raw input before training the RBF SVM — this expands the effective feature dimension and gives the kernel more signal to work with.\``,
          `\`D) Underfitting means the margin is too wide and the decision boundary is too smooth. Adjustments: (1) Increase C (allow fewer margin violations — tighter fit to training data). Risk: overfitting — the boundary becomes wiggly and does not generalise. (2) Increase γ (tighter, more localised RBF kernel — each support vector influences a smaller region). Risk: overfitting — at high γ, the model memorises training data with tiny "bubbles" around each point. Grid search over (C, γ) on log scale: C ∈ {0.01, 0.1, 1, 10, 100}, γ ∈ {0.001, 0.01, 0.1, 1, 10}. In practice: try the default C=1, gamma='scale' first — often competitive with tuned values.\``,
        ],
        answer: `D`,
      },
      {
        q: `Explain the kernel trick. Why does it work, and what mathematical condition must a function k(x,x') satisfy to be a valid kernel?`,
        options: [
          `\`A) The kernel trick replaces each training point xᵢ with its feature map φ(xᵢ) before computing the SVM. Since φ maps to a higher-dimensional space, the SVM finds a linear separator there that appears non-linear in the original space. The condition: φ must be a bijection (one-to-one), guaranteeing that the original and mapped problems have equivalent solutions.\``,
          `\`B) The kernel trick works because the SVM dual objective only requires pairwise dot products xᵢᵀxⱼ — it never explicitly uses the feature vectors. By Mercer's theorem, any function k(x,x') = φ(x)ᵀφ(x') for some (possibly infinite-dimensional) φ can be substituted for these dot products. The condition: k must be a symmetric positive semi-definite function (the Gram matrix K where Kᵢⱼ = k(xᵢ,xⱼ) must be PSD for all datasets). This guarantees k corresponds to a valid dot product in some feature space. The magic: we get the computational benefit of working in a high-dimensional space (rich features) without the computational cost of computing φ(x) (which may be infinite-dimensional). The kernel matrix K is n×n regardless of the dimensionality of φ.\``,
          `\`C) The kernel trick works by approximating the inner product in feature space using a Taylor expansion of k(x,x'). The condition for validity is that the Taylor series converges uniformly on the training data — functions like RBF satisfy this because they are entire functions (analytic everywhere), while polynomial kernels are valid only up to a bounded degree.\``,
          `\`D) The kernel trick avoids explicit feature maps by computing similarity scores k(xᵢ,xⱼ) directly from raw inputs. The condition: k must be a monotone decreasing function of distance ‖xᵢ−xⱼ‖ — this ensures that closer points are more similar and the SVM boundary is locally consistent. The RBF kernel satisfies this; the polynomial kernel does not, which is why RBF is preferred.\``,
        ],
        answer: `B`,
      },
      {
        q: `SVMs and logistic regression both find a linear separator. In what situations would you prefer one over the other?`,
        options: [
          `\`A) Prefer SVM when: (1) The dataset is small (n < 10K) and high-dimensional — SVMs have better theoretical guarantees (margin maximisation) in this regime. (2) The classes are well-separated — hard-margin or small-slack SVM exploits this. (3) You need a kernel for non-linear boundaries and cannot engineer features. Prefer logistic regression when: (1) You need calibrated probability outputs — SVM outputs distances, not probabilities (Platt scaling fixes this but adds complexity). (2) Large datasets (n > 100K) — LR scales linearly in n, SVM does not. (3) Interpretability matters — LR coefficients are log-odds ratios; SVM weights have less direct interpretation. (4) You want a fast baseline — LR trains in seconds.\``,
          `\`B) Always prefer logistic regression over SVM for linear separation: logistic regression is strictly more general — it learns the same weight vector as a linear SVM when the data is separable, and additionally provides calibrated probability outputs. SVM's maximum-margin criterion is a special case of logistic regression with a specific choice of regularisation.\``,
          `\`C) Prefer SVM whenever class imbalance is present: the maximum-margin criterion is independent of class frequencies, whereas logistic regression's cross-entropy loss gives more gradient updates to the majority class, biasing the boundary. SVM's support vector selection ignores class proportions and finds the optimal geometric separator.\``,
          `\`D) Prefer logistic regression for all practical applications: SVMs were developed before logistic regression became computationally tractable at scale, and every advantage of SVM (kernel, margin) can be replicated in logistic regression with appropriate feature engineering and regularisation. SVMs are only used for academic benchmarks now.\``,
        ],
        answer: `A`,
      },
    ],
    takeaway: `SVMs maximise the margin — the gap between classes — and only the points on the margin edge (support vectors) determine the boundary; the kernel trick substitutes dot products with kernel evaluations to get non-linear boundaries without computing the feature map.`,
    recap: [
      "**SVM = maximise the margin,** the gap between classes.",
      "**Only support vectors (points on the margin edge) determine the boundary.**",
      "**Kernel trick:** swap dot products for kernel evaluations → non-linear boundaries without computing the feature map.",
      "**Soft margin (C) trades margin width for training errors.**",
      "**Reach for kernel SVM when n < 50K,** moderate dimension, clean separable data — and always scale features.",
      "**Tune C and γ jointly;** count support vectors — >50% of data means C too large or γ too small.",
    ],
    interactiveId: 'svm_viz',
    figures: {
      svm_margin: `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:400px;font-family:var(--font-sans,sans-serif)">
  <!-- decision boundary -->
  <line x1="60" y1="220" x2="340" y2="40" stroke="var(--ink-hi)" stroke-width="2"/>
  <!-- margin lines -->
  <line x1="30" y1="210" x2="310" y2="30" stroke="var(--ink-mid)" stroke-width="1.2" stroke-dasharray="6,4"/>
  <line x1="90" y1="230" x2="370" y2="50" stroke="var(--ink-mid)" stroke-width="1.2" stroke-dasharray="6,4"/>
  <!-- margin label -->
  <text x="50" y="135" fill="var(--ink-low)" font-size="10" transform="rotate(-38,50,135)">margin = 2/‖w‖</text>
  <!-- class + circles (upper right) -->
  <circle cx="280" cy="60" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="310" cy="90" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="340" cy="70" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="300" cy="110" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="260" cy="80" r="7" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <!-- class - crosses (lower left) -->
  <g stroke="var(--amber)" stroke-width="2">
    <line x1="70" y1="165" x2="84" y2="179"/><line x1="84" y1="165" x2="70" y2="179"/>
    <line x1="100" y1="190" x2="114" y2="204"/><line x1="114" y1="190" x2="100" y2="204"/>
    <line x1="50" y1="195" x2="64" y2="209"/><line x1="64" y1="195" x2="50" y2="209"/>
    <line x1="120" y1="175" x2="134" y2="189"/><line x1="134" y1="175" x2="120" y2="189"/>
    <line x1="80" y1="210" x2="94" y2="224"/><line x1="94" y1="210" x2="80" y2="224"/>
  </g>
  <!-- support vectors with rings -->
  <circle cx="260" cy="80" r="12" fill="none" stroke="var(--prime)" stroke-width="1.5" opacity="0.6"/>
  <circle cx="70" cy="172" r="12" fill="none" stroke="var(--amber)" stroke-width="1.5" opacity="0.6"/>
  <circle cx="120" cy="182" r="12" fill="none" stroke="var(--amber)" stroke-width="1.5" opacity="0.6"/>
  <!-- labels -->
  <text x="330" y="55" fill="var(--prime)" font-size="10" font-weight="700">+1</text>
  <text x="55" y="240" fill="var(--amber)" font-size="10" font-weight="700">−1</text>
  <text x="175" y="25" fill="var(--ink-hi)" font-size="10" text-anchor="middle">decision boundary</text>
  <line x1="175" y1="28" x2="195" y2="45" stroke="var(--ink-low)" stroke-width="0.8"/>
</svg>`,
    },
  },
  {
    id: 'knn',
    interactiveId: 'knn_viz',
    title: 'K-Nearest Neighbours',
    subtitle: 'Distance metrics, curse of dimensionality, ANN indexes',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['KNN', 'distance metrics', 'ANN'],
    summary: `A handwritten digit arrives as a 28×28 pixel image. You need to classify it. A decision tree would learn a set of pixel-threshold rules at training time. Logistic regression would learn a weight for every pixel. kNN does neither: it stores all 60,000 training images and at prediction time finds the 3 most similar training images by Euclidean distance across all 784 pixels, then takes a majority vote. Zero training time. A new "7" finds three sevens in the training set, votes 3-0, classification done.

The price arrives at query time. Each prediction requires computing the distance from the test image to all 60,000 training images across 784 dimensions: 60,000 × 784 = 47 million multiplications per query. At 1,000 queries per second, that is 47 billion multiplications per second — feasible on fast hardware for MNIST, but already impractical for 1 million images. kNN does not generalize through learned parameters; it memorizes. The entire training set is the model.

Feature scaling is not optional. Age ranges from 0 to 100. Income ranges from 0 to 500,000. Without standardization, a 1-dollar difference in income contributes 5,000× more to Euclidean distance than a 1-year age difference. The nearest neighbors are found entirely in the income dimension. A 50-year-old earning 50K a year looks identical to a 1-year-old earning 50K. StandardScaler before kNN is non-negotiable.

The deeper failure mode is dimensionality. kNN works because nearby points in feature space share labels — local homogeneity. In high dimensions, that assumption breaks. As the number of dimensions grows, the ratio of the distance to the nearest neighbor versus the farthest neighbor converges toward 1. Every point becomes approximately equidistant from every other. The neighborhood concept collapses: there is no meaningful local structure, only a global average. With d = 100, k = 10 nearest neighbors are barely more similar to the query than randomly drawn points.

The production resurrection of kNN is approximate nearest neighbor search. FAISS, HNSW, and ScaNN build indexes that find approximate nearest neighbors in O(log n) instead of O(n). HNSW at 95% recall@10 queries 10 million vectors in under 1 millisecond. Every embedding-based recommendation system, every vector database (Pinecone, Weaviate, Chroma), and every dense retrieval system in a RAG pipeline is kNN with an approximate index. The algorithm is from the 1960s; the implementation is state of the art.

**NOT this.** kNN is a toy algorithm that does not scale. Nearest-neighbor search is the production architecture for modern retrieval. When a language model generates a query embedding and retrieves relevant documents, it is running kNN against an index of millions of passage embeddings. When a recommendation system finds the top-50 similar users to target for a new item, it is running kNN against a user embedding matrix. The algorithm is ancient. The feature spaces it operates on — dense embeddings from transformers — are not.

The formal statement: exact kNN is O(nd) per query where n is the number of indexed vectors and d is the dimensionality. ANN indexes reduce this to O(d log n) or better, with recall controlled by a search parameter. For the digit classifier: n = 60,000, d = 784, brute force takes ~47M ops. For a production recommendation system: n = 10M, d = 256, brute force takes ~2.56B ops per query — ANN takes ~600K ops at 95% recall.`,
    keyPoints: [
      `**Always use ANN (FAISS, HNSW) when n > 100K — exact kNN is O(n) per query and completely infeasible at scale. HNSW gives sub-millisecond search over 100M vectors at 95%+ recall.**\n\nFor the digit classifier at 60K training images, brute-force kNN runs in ~1ms per query on modern hardware — acceptable. Scale to 10M items and exact kNN takes ~160ms per query, which kills any real-time system. HNSW reduces this to under 1ms at 95% recall@10. The transition point: once n exceeds ~100K, reach for FAISS or HNSW before any other optimization. The recall-speed tradeoff is controllable via the ef (search width) parameter — set it higher for better recall, lower for lower latency.`,
      `**Trap: forgetting to scale features. If feature ranges differ by 1000×, kNN sees only the largest-range feature. StandardScaler or L2-normalize embeddings before indexing — this mistake silently destroys retrieval quality with no obvious error.**\n\nFor the digit classifier: pixel values range from 0 to 255, so scaling is uniform and kNN works correctly. For a user-feature matrix with age (0–100) and annual income (0–500,000), raw Euclidean distance finds "nearest neighbors" by income alone. A 20-year-old earning 80K a year is identified as nearest to a 65-year-old earning 80,001, ignoring the 45-year age gap. StandardScaler brings both features to unit variance. For embedding vectors from transformers: L2-normalize before indexing so that cosine similarity equals the dot product — the default in FAISS's IndexFlatIP.`,
      `**Diagnostic: if kNN performance is unexpectedly poor, check the intra-cluster distance distribution — if all distances are similar (high-dimensional degenerate case), reduce dimensionality with PCA or switch from Euclidean to cosine similarity.**\n\nFor the digit classifier: compute the distribution of distances from each test point to its 10 nearest neighbors. If the min and max distances are nearly identical (e.g., min 18.2, max 19.1 across 60,000 candidates), the curse of dimensionality is active — the 784-dimensional space has too many uninformative pixel dimensions. Fix: apply PCA to retain the top 50 components explaining ~85% of variance, then run kNN in 50 dimensions. Alternatively, switch from raw pixels to learned embeddings from a CNN — the 128-dimensional embedding space concentrates all discriminative information, and kNN in that space is highly effective.`,
    ],
    interactivePrompt: `Before you touch the controls: if you add 500 random noise dimensions to the digit feature vectors alongside the original 784 pixel dimensions, do you expect kNN accuracy to go up, stay roughly the same, or drop significantly?`,
    checkQuestions: [
      {
        q: `Why does KNN fail in 1000 dimensions even with millions of training points?`,
        options: [
          `\`A) In high dimensions, the training data becomes increasingly sparse — millions of points spread across a 1000-dimensional space leave most of the volume empty. KNN fails because there are genuinely no neighbours within any meaningful radius; adding more training data fills the space and restores KNN performance.\``,
          `\`B) KNN's O(nd) inference time becomes prohibitive at d=1000 — querying a single point against millions of training points takes seconds. The failure is purely computational, not geometric; approximate nearest-neighbour indexes restore KNN performance at d=1000 with sub-millisecond queries.\``,
          `\`C) Curse of dimensionality: in d=1000 dimensions, the distance from a query point to its nearest neighbour converges to nearly the same value as the distance to its farthest neighbour. The distribution of pairwise distances becomes concentrated — the coefficient of variation of distances shrinks to 0 as d grows. The k nearest neighbours are no longer geometrically "local" to the query point — they are nearly as far as random points. The local averaging that makes KNN work (nearby points have similar labels) breaks down when "nearby" means "within 1000 dimensions of noise." Fix: dimensionality reduction (PCA, UMAP) or learned metric/embedding before applying KNN.\``,
          `\`D) At d=1000, Euclidean distance violates the triangle inequality — distances between random points are no longer consistent, so the concept of "nearest neighbour" is undefined. Switching to cosine similarity restores the metric property and allows KNN to work correctly in high dimensions without dimensionality reduction.\``,
        ],
        answer: `C`,
      },
      {
        q: `A production recommendation system uses KNN with n=50M items and d=256-dimensional embeddings. Brute-force KNN is too slow. What is your architecture?`,
        options: [
          `\`A) Use an ANN index. Process: (1) Offline: build an HNSW index or FAISS IVF index on the 50M item embeddings. HNSW is preferred for high-recall requirements; FAISS IVF is preferred for memory-constrained systems. (2) Online: for each user query embedding, query the index for the top-k approximate nearest neighbours (e.g., top-100 candidates). (3) Re-rank: apply a more expensive scoring function (dot product, learned ranker) to the top-100 candidates. This is the retrieve-and-rerank pattern. Performance: HNSW achieves >95% recall@10 with queries in ~1ms for 50M items — vs. ~10s for brute force. Tradeoff: index takes O(n·d) memory plus graph structure overhead.\``,
          `\`B) Reduce the embeddings from d=256 to d=16 using PCA before building the index. At d=16, brute-force KNN over 50M items takes ~0.1ms per query — fast enough for production. The recall loss from PCA compression is typically 2-5% for recommendation tasks, which is acceptable.\``,
          `\`C) Shard the 50M items across 100 machines, each holding 500K items. Run brute-force KNN in parallel across all shards and aggregate the top-k from each shard. This horizontal scaling approach achieves sub-100ms latency with no accuracy loss and avoids the complexity of approximate index data structures.\``,
          `\`D) Pre-compute all pairwise similarities offline and store the top-1000 neighbours per item in a lookup table. At query time, retrieve the pre-computed neighbours in O(1). The offline storage cost is 50M × 1000 × 8 bytes ≈ 400GB, which is manageable with modern object storage.\``,
        ],
        answer: `A`,
      },
      {
        q: `When would you choose KNN over a trained classifier like logistic regression or a decision tree?`,
        options: [
          `\`A) Choose KNN when the dataset is very large (n > 1M) — KNN requires no training time, while logistic regression and trees scale with O(n) or O(n log n). For massive datasets, KNN's zero training cost outweighs its higher inference cost, especially when batch predictions are needed.\``,
          `\`B) Choose KNN when the features are all categorical — distance-based metrics like Hamming distance work better than logistic regression's log-odds coefficients for categorical inputs. KNN with Hamming distance consistently outperforms tree models on purely categorical tabular data.\``,
          `\`C) Choose KNN whenever the class prior P(y=1) is below 10% — rare class detection is where KNN excels because it uses local density estimation near the rare class and is unaffected by the global class imbalance that biases logistic regression and tree splits.\``,
          `\`D) Choose KNN when: (1) The decision boundary is highly non-linear and irregular — KNN adapts to any boundary shape without feature engineering. (2) The training set is very small and the feature space is low-dimensional (d < 20) — KNN with k=5 often outperforms logistic regression that has too few samples to estimate coefficients reliably. (3) You need online learning — adding a new training point to KNN requires no retraining, just appending to the index. (4) Instance-based explanations matter — "your prediction is X because your nearest neighbours are A, B, C" is intuitive. Prefer logistic regression or trees when: large n (KNN inference is O(nd)); high d; need probability outputs; training time is not a constraint.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `kNN makes one bet — nearby points share labels — so the distance metric and the feature space are the model, k is just a smoothing parameter, and in high dimensions that bet fails because all distances converge; the production answer is ANN indexing over learned embeddings where the space is built to make proximity meaningful.`,
    recap: [
      "**kNN's one bet: nearby points share labels.** Zero training time — it just stores the data.",
      "**The distance metric and feature space ARE the model;** k is just a smoothing parameter.",
      "**High dimensions break it** — all distances converge (curse of dimensionality).",
      "**Always scale features** — a 1000× range difference makes kNN see only the largest feature.",
      "**At scale (n > 100K) use ANN** (FAISS, HNSW) — exact kNN is O(n) per query; HNSW gives sub-ms search over 100M vectors at 95%+ recall.",
      "**Production answer: ANN over learned embeddings** where the space is built to make proximity meaningful.",
    ],
    interactiveId: 'knn_viz',
  },
  {
    id: 'naive_bayes',
    interactiveId: 'bayes_calculator',
    title: 'Naïve Bayes',
    subtitle: 'Independence assumption, Gaussian NB, Laplace smoothing',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['Naive Bayes', 'independence', 'text classification'],
    summary: `An email arrives: "Claim your FREE prize NOW." You need to classify it as spam or ham in milliseconds. You have word frequency statistics from training: P(FREE|spam) = 0.45, P(FREE|ham) = 0.01, P(prize|spam) = 0.32, P(prize|ham) = 0.002, P(Claim|spam) = 0.18, P(Claim|ham) = 0.04. Bayes' theorem gives the posterior: P(spam|words) ∝ P(spam) × P(FREE|spam) × P(prize|spam) × P(Claim|spam) × .... You multiply across all words in the email. Whichever class — spam or ham — gives the larger product wins.

The "naive" assumption is that words are conditionally independent given the class. This is obviously false. "Stock" and "market" co-occur constantly. "Credit" and "card" cluster together. The joint P(stock, market|spam) is nothing like P(stock|spam) × P(market|spam). The model is provably wrong about the joint distribution. Yet it works.

[FIGURE: naive_independence] The reason: you do not need the correct probability, only the correct ranking. Is P(spam|words) > P(ham|words)? Naive Bayes gets the ordering right even when the individual probabilities are wrong, because the errors in the independence assumption tend to be symmetric — both classes' probabilities are over-estimated by roughly the same factor.

One failure mode is deterministic. A word not seen in any training spam email has P(word|spam) = 0. One unseen word → the entire product P(x|spam) = 0 → P(spam|x) = 0 → the model can never classify any email containing that word as spam, regardless of all other evidence. A single "zarflax" in the email makes it immune to spam classification. Laplace smoothing fixes this: add 1 to all word counts before computing probabilities, making P(new_word|spam) = 1/(n_spam + vocab_size). Never exactly zero.

The three variants handle different data types. Multinomial NB uses word counts, treating each email as a bag of word draws from a class-conditional multinomial — the right choice for text. Bernoulli NB uses word presence or absence, ignoring count information — faster but less informative. Gaussian NB models continuous features as Gaussian distributions per class, fitting one mean and one variance per feature per class. For the spam filter, Multinomial NB is correct. For a dataset with continuous medical measurements, Gaussian NB is correct. Applying Gaussian NB to text, or Multinomial NB to continuous features, produces silently wrong models.

**NOT this.** Naive Bayes is too simple for real use. For high-dimensional sparse features — text, categorical bags — Naive Bayes is competitive with SVMs and logistic regression while training in milliseconds on a single pass through the data. With 10,000 vocabulary items and 100 training documents, logistic regression has 10,000 parameters to estimate and overfits severely even with strong regularization. Naive Bayes has 10,000 simple count estimates that are stable at any sample size. It is still deployed in production spam filters and intent classifiers where training speed, interpretability, and stability with small data matter more than 1–2 percentage points of accuracy against a tuned neural classifier.

The formal statement: ŷ = argmax_k [log P(y=k) + Σⱼ log P(xⱼ|y=k)]. Always compute in log-space. Multiplying thousands of probabilities like 0.001 causes floating-point underflow to exactly zero before the product completes. Log-space turns the product into a sum, eliminating underflow entirely.`,
    keyPoints: [
      `**Use Gaussian NB for continuous features as a fast, interpretable baseline — it trains in O(nd) and gives a probability estimate. If it performs well, there may not be complex feature interactions worth modeling.**\n\nFor a medical dataset with 20 continuous features and 500 patients, Gaussian NB trains in one pass — compute the mean and variance of each feature for each class. Prediction: for a new patient, compute the Gaussian log-likelihood of each feature value under each class's distribution, sum the logs, add the log prior, take the argmax. No gradient descent, no hyperparameter tuning. If Gaussian NB achieves AUC 0.78 and a tuned gradient boosted tree achieves 0.82, the marginal value of the complex model is 4 points — often not worth the engineering cost and opacity.`,
      `**Trap: forgetting Laplace smoothing. A single unseen word in a test document zeroes out the entire posterior. Always use α > 0 (sklearn default α = 1).**\n\nFor the spam filter: training vocabulary is 50,000 words. A new test email contains the word "cryptocurrency" which appeared in no training spam examples. Without smoothing: P(cryptocurrency|spam) = 0. The entire P(x|spam) product becomes 0. P(spam|x) = 0. No matter how many other spam-indicating words appear — FREE, prize, Claim, urgent — the email will never be classified as spam. With Laplace smoothing: P(cryptocurrency|spam) = 1 / (n_spam_tokens + 50,000) ≈ 0.00002. Small but nonzero. The other spam signals dominate. The email is correctly classified as spam.`,
      `**Diagnostic: if Naive Bayes predicts near 0.0 or 1.0 with very high confidence on most examples, the independence assumption is badly violated and the probabilities are not calibrated — use the predictions for ranking only, not as probabilities.**\n\nFor the spam filter: if 90% of test emails get P(spam) > 0.999 or P(spam) < 0.001, the model is over-counting correlated evidence. "FREE" and "prize" and "WIN" all appear together in spam — each one multiplies the spam probability by a large factor, but those factors are not independent signals. The product over-saturates. In the reliability diagram, predictions near 1.0 correspond to actual spam rates of only 0.75. Apply Platt scaling: fit a logistic regression on the NB log-odds using a held-out calibration set. The ranking stays correct; the probabilities become honest.`,
    ],
    interactivePrompt: `Before you touch the controls: if "FREE" appears three times in an email, does Multinomial Naive Bayes count that as three times the evidence compared to it appearing once, and do you think that is the right behavior?`,
    checkQuestions: [
      {
        q: `In Multinomial NB for spam detection, a test email contains the word "win" which appears in 0% of spam emails in training. Without Laplace smoothing, what happens?`,
        options: [
          `\`A) P("win"|spam) = 0 for that word, so the NB model skips it — zero-probability features are excluded from the product, and the remaining words determine the classification. The email may still be classified as spam if the other words are sufficiently spammy.\``,
          `\`B) P("win"|spam) = 0. Since NB multiplies all feature probabilities, the entire product P(x|spam) = 0, regardless of all other words in the email. The spam posterior P(spam|x) = 0. The email will never be classified as spam, even if every other word strongly indicates spam. This is the zero-frequency problem. Laplace smoothing adds α=1 to all word counts: P("win"|spam) = (0+1)/(N_spam + |V|) where |V| is vocabulary size — small but non-zero, preserving the contribution of all other features and allowing the model to classify correctly based on the other words.\``,
          `\`C) P("win"|spam) = 0 causes the log-probability log P(x|spam) = −∞. In log-space, the entire spam log-posterior is −∞, but log P(ham|x) is finite, so the model classifies as ham by default. Laplace smoothing prevents this by ensuring all log-probabilities are finite.\``,
          `\`D) P("win"|spam) = 0 means the word is treated as evidence against spam — it contributes a zero to the product but the model uses this as a signal that the email is not spam. This is the correct Bayesian interpretation: an event never seen in training has posterior probability 0 given that class.\``,
        ],
        answer: `B`,
      },
      {
        q: `Why does Naïve Bayes often outperform logistic regression on text classification when training data is small?`,
        options: [
          `\`A) Naïve Bayes benefits from the independence assumption in low-data regimes: when features are actually independent (as words often approximately are), NB is the optimal Bayesian classifier. Logistic regression, which models dependencies, has higher variance when those dependencies cannot be reliably estimated from small data.\``,
          `\`B) Logistic regression uses gradient descent which converges slowly on text data due to sparse feature vectors — many gradient steps are zero. Naïve Bayes uses a closed-form update (counting) that reaches the optimal solution in one pass. The performance gap disappears with sufficient gradient steps, not with more data.\``,
          `\`C) NB has better inductive bias for text: it assumes words contribute independently to the class, which is a strong regularisation that prevents the model from memorising co-occurrence patterns specific to the training set. Logistic regression has no inductive bias about word independence and overfits those patterns.\``,
          `\`D) NB estimates P(x|y) from per-class word frequencies — a generative model with very few parameters (one mean per word per class). This estimation is stable even with small n because it is just counting. Logistic regression estimates P(y|x) discriminatively — it needs to learn a weight for every word, requiring much more data to avoid overfitting in a high-dimensional space. With n=100 training documents and |V|=10,000 vocabulary, LR has 10,000 parameters and will overfit without strong regularisation, while NB has well-estimated word probabilities from the counts. As n grows, LR catches up and eventually surpasses NB because its discriminative objective is more directly aligned with the classification goal.\``,
        ],
        answer: `D`,
      },
      {
        q: `Your Naïve Bayes classifier outputs P(spam)=0.99 for an email. How confident should you be, and what would you do if calibrated probabilities are required?`,
        options: [
          `\`A) P(spam)=0.99 from NB is reliable for ranking — it correctly indicates this email is more likely spam than an email with P(spam)=0.7. Use the raw NB probabilities directly as confidence scores and set the classification threshold based on the acceptable false-positive rate.\``,
          `\`B) NB probabilities are well-calibrated for binary classification with balanced classes: the independence assumption biases posteriors toward 0 and 1 only for multiclass problems. With binary spam detection, P(spam)=0.99 means approximately 99% of similarly-scored emails are actually spam.\``,
          `\`C) Very cautious: NB posteriors are poorly calibrated — the independence assumption makes P(y|x) converge toward 0 and 1 faster than the true probabilities. A NB output of 0.99 does not mean 99% of similarly-scored emails are spam. To get calibrated probabilities: (1) Apply Platt scaling — fit a logistic regression a·f+b on the NB log-odds f = log(P(spam)/P(ham)) using a held-out calibration set. (2) Apply isotonic regression if you have enough calibration data (>1000 samples) and suspect non-monotone miscalibration. After calibration, validate on a separate test set using a reliability diagram and ECE.\``,
          `\`D) P(spam)=0.99 is overconfident due to double-counting: words that appear multiple times in the email are counted multiple times in the NB product, inflating the posterior. Fix by counting each unique word only once (binary bag-of-words rather than count bag-of-words) — this eliminates the double-counting bias without requiring post-hoc calibration.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Naive Bayes only needs to rank P(spam|words) above P(ham|words) correctly — not to get the individual probabilities right — and the independence assumption fails symmetrically enough that the ranking holds even when the probabilities saturate toward 0 and 1.`,
    recap: [
      "**Naive Bayes multiplies P(feature|class) across features** via Bayes' theorem; larger product wins.",
      "**Only needs to rank P(spam|words) > P(ham|words)** — not to get individual probabilities right.",
      "**Independence assumption fails symmetrically enough** that the ranking survives even as probabilities saturate to 0/1.",
      "**Laplace smoothing is mandatory** — one unseen word zeroes the whole posterior; use α > 0 (sklearn default α = 1).",
      "**Gaussian NB for continuous features** — fast O(nd) baseline.",
      "**If it predicts near 0/1 with high confidence,** independence is badly violated — use for ranking only, not as probabilities.",
    ],
    figures: {
      naive_independence: `<svg viewBox="0 0 360 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">The "naive" assumption: the joint factorises</text>
  <rect x="90" y="34" width="180" height="30" rx="5" fill="var(--rim)" opacity="0.4"/>
  <text x="180" y="53" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">P(FREE, prize, Claim | spam)</text>
  <text x="180" y="84" text-anchor="middle" fill="var(--amber)" font-size="10" font-weight="700">assume independence given class ↓</text>
  <line x1="60" y1="98" x2="300" y2="98" stroke="var(--rim)" stroke-width="0.75"/>
  <g>
    <rect x="34" y="112" width="88" height="34" rx="5" fill="var(--prime)" opacity="0.2"/>
    <text x="78" y="133" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">P(FREE|spam)</text>
    <text x="130" y="134" text-anchor="middle" fill="var(--ink-mid)" font-size="14" font-weight="700">×</text>
    <rect x="140" y="112" width="82" height="34" rx="5" fill="var(--prime)" opacity="0.2"/>
    <text x="181" y="133" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">P(prize|spam)</text>
    <text x="230" y="134" text-anchor="middle" fill="var(--ink-mid)" font-size="14" font-weight="700">×</text>
    <rect x="240" y="112" width="86" height="34" rx="5" fill="var(--prime)" opacity="0.2"/>
    <text x="283" y="133" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">P(Claim|spam)</text>
  </g>
  <text x="180" y="172" text-anchor="middle" fill="var(--ink-low)" font-size="8.5">wrong about the joint — but the ranking survives, so it still classifies</text>
</svg>`,
    },
  },
  {
    id: 'calibration',
    interactiveId: 'calibration_curve_viz',
    title: 'Model Calibration',
    subtitle: 'Reliability diagrams, ECE, Platt scaling, isotonic regression',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['calibration', 'ECE', 'Platt scaling', 'reliability'],
    summary: `When a weather forecaster says "70% chance of rain tomorrow," something quietly impressive is going on. Look back over all the days they said 70%, and it really did rain on about 70% of them. Their stated confidence matches reality. That property has a name — **calibration** — and it is exactly what most machine-learning models do *not* have, even good ones.

Here is the gap. A model can be excellent at *ranking* — putting the sick patients above the healthy ones, high-risk loans above low-risk ones — and still be hopeless at *probabilities*. Suppose it stamps "90% chance of disease" on a group of patients, but only 60% of them actually turn out sick. The ranking is fine (those patients really are higher-risk than the ones it scored 50%), but the number 0.9 is a lie. And the moment you *use* that number — to price insurance, to decide a treatment, to feed another model — the lie costs you.

---

**Two different questions.**

It helps to see that ranking and calibration answer different questions. **Ranking** (measured by AUC) asks: does the model put riskier cases above safer ones? **Calibration** asks: when the model says 0.7, does the thing happen 70% of the time? A model can ace one and flunk the other. A credit model might rank ten thousand applicants perfectly by risk yet lowball every probability — great for deciding who to approve, useless for estimating how much money you will lose. If your decision only needs the *order*, calibration may not matter. The instant it needs the actual *number*, it does.

---

**How to see it: the reliability diagram.**

There is a simple picture that reveals miscalibration at a glance. Take all the model's predictions, sort them into buckets (everything it called about 0.1, about 0.2, and so on), and for each bucket plot the predicted probability against the *actual* fraction that turned out positive. If the model is calibrated, every point lands on the diagonal line where "predicted = actual." If the curve sags *below* the diagonal, the model is **overconfident** — it says 0.8 for things that happen only 0.6 of the time. If it rides *above*, the model is **underconfident**.

[FIGURE: reliability_diagram]

Miscalibration is the rule, not the exception — but the *shape* differs by model. Modern neural networks are famously **overconfident**: their reliability curves sag below the diagonal, saying 0.95 for things that happen 0.80 of the time. Random forests bend the *other* way: averaging many trees pushes probabilities *away* from 0 and 1 (a truly-positive case rarely gets every tree to vote yes, so the forest hesitates to say 0.99), giving a characteristic **sigmoid**-shaped curve — under-confident at the extremes, over-confident in the middle. Knowing your model's typical distortion tells you which correction to reach for.

---

**The fix, and the one rule you cannot break.**

You usually do not retrain to fix calibration — you patch it afterward. Hold out a separate slice of data (a **calibration set**), see how the model's scores line up with reality on it, and fit a small correcting function that bends the scores back onto the diagonal. Two common choices: **Platt scaling** fits a simple sigmoid — fast, needs little data, and works when the miscalibration is a smooth one-directional bend. **Isotonic regression** fits a more flexible staircase that can straighten out any shape, but it needs more data (roughly a thousand-plus points) or it just memorises the calibration set.

And the one rule you cannot break: **the calibration set must be separate from both training and test.** Calibrate on the training data and you are correcting against numbers the model already memorised — the fix looks perfect and fails in the wild. Calibrate on the test data and you have spoiled your only honest measure of how good the model really is. Train, calibrate, and test on three different slices. To put a single number on how calibrated you are, people use the **expected calibration error (ECE)** — the average gap between the buckets and the diagonal, where zero is perfect.

---

**ECE's blind spots.**

ECE is convenient but genuinely fragile, and interviewers probe this. It depends heavily on your **binning**: change the number of bins or use equal-width versus equal-count bins and the ECE number moves, sometimes a lot. It's biased by **sample size** (few points per bin makes the estimate noisy). Worst, it can **hide local miscalibration** — a model badly overconfident in one region and underconfident in another can post a small overall ECE because the errors average out. So don't reduce calibration to a single ECE number; always look at the reliability diagram, and consider class-conditional views.

---

**The Brier score, and what it decomposes into.**

A more complete single number is the **Brier score** — just the mean squared error between predicted probabilities and outcomes ($\\frac{1}{N}\\sum(\\hat{p}_i - y_i)^2$). Its value is that it splits into three meaningful parts (the Murphy decomposition): **reliability** (calibration — are the probabilities honest?), **resolution** (discrimination — do the predictions actually separate outcomes?), and **uncertainty** (the irreducible base-rate difficulty). This is why Brier is richer than ECE: a model can be perfectly calibrated (great reliability) but useless (zero resolution, it always predicts the base rate), and Brier catches that where ECE alone would look fine.

---

**Temperature scaling — the neural-network default.**

For neural networks, the standard fix (from Guo et al., 2017) is **temperature scaling**: divide the logits by a single learned scalar T before the softmax. T > 1 softens overconfident probabilities toward the middle; T < 1 sharpens them. It's the simplest possible calibrator — *one* parameter fit on a validation set — and because it only rescales logits it **leaves the ranking (and accuracy) completely unchanged** while fixing the confidence. That single-parameter simplicity is exactly why it rarely overfits and became the go-to for deep models.

---

**Calibrating more than two classes.**

Multiclass calibration is trickier and worth flagging. You can calibrate **one-vs-rest** (one calibrator per class) but then the per-class probabilities no longer sum to 1 and need renormalising. You also have to decide *what* you're calibrating: **top-label** calibration (is the model's confidence in its top prediction honest?) versus **classwise** calibration (is every class's probability honest?). Multiclass ECE has to pick one of these, which is why a single multiclass calibration number is even easier to misread than the binary one. Temperature scaling sidesteps some of this by scaling all logits together.

---

**Calibration is not thresholding.**

Keep these two separate — they're often confused. **Calibration** fixes the *truthfulness* of the probability (0.7 should mean 70%). **Thresholding** picks the *decision cutoff* that turns a probability into an action, chosen from business costs. They're related — a well-calibrated probability makes threshold selection meaningful and transferable across contexts — but they're different steps. You calibrate so the number is honest, *then* threshold so the decision is optimal.

---

**Calibration decays under drift.**

Finally, calibration is not permanent. A model calibrated on last year's data can drift out of calibration as the world changes — **covariate shift** (the input mix moves) or **concept drift** (the relationship changes) both break it, even though your original test-set calibration looked perfect. So calibration is something to *monitor* in production (track ECE or reliability over time), not a one-time fix at training. When a deployed model's probabilities start lying, drift is the usual cause.`,
    keyPoints: [
      `**Calibration is whether the model's probabilities are literally true: when it says 0.7, does the thing happen 70% of the time?**\n\nIt is separate from accuracy and from ranking (AUC) — a model can rank cases perfectly yet report probabilities that are badly off. Calibration only matters when you actually *use* the probability: pricing, risk scores, medical decisions, or feeding another model in a stack. If you only need the ranking (who is riskier than whom), you can often ignore it. The moment a real number matters, check it.`,
      `**The trap: assuming a model's probabilities are trustworthy straight out of the box. Most are not.**\n\nrandom forests are pushed *away* from 0 and 1 by tree-averaging (a sigmoid-shaped curve, under-confident at the extremes); modern neural networks are famously overconfident; SVMs do not really output probabilities at all. So do not read a raw score as a probability without checking. The check is a reliability diagram: bucket the predictions and compare each bucket's predicted probability to the actual rate. If the curve sags below the diagonal, the model is overconfident and needs a fix before its numbers can be trusted.`,
      `**The fix is a post-hoc patch on a separate calibration set — never the training or test set.**\n\nHold out a slice of data, see how the scores line up with reality on it, and fit a small correcting function: Platt scaling (a simple sigmoid, good when data is scarce and the bend is smooth) or isotonic regression (a flexible staircase, needs a thousand-plus points). Fit it on the calibration slice only. Calibrate on training data and the fix is fooled by memorised outputs; calibrate on test data and you have spoiled your honest score. Train, calibrate, and test on three different slices.`,
      `**Don't trust ECE alone — use the reliability diagram and the Brier score.**\n\nECE depends on binning choice and bin count, is noisy with few samples, and can hide local miscalibration (overconfident in one region, underconfident in another, averaging to a small number). The Brier score (mean squared error of probabilities) is richer because it decomposes into reliability (calibration), resolution (discrimination), and uncertainty — so it catches a perfectly-calibrated-but-useless model that always predicts the base rate. Always read the reliability diagram, not just a single scalar.`,
      `**Know temperature scaling, the multiclass subtleties, and that calibration ≠ thresholding — and decays under drift.**\n\nTemperature scaling (Guo et al.) divides logits by one learned scalar T — the neural-network default, since it fixes confidence without changing ranking or accuracy. Multiclass calibration must choose top-label vs classwise and renormalise one-vs-rest outputs. Keep calibration (making the probability truthful) separate from thresholding (choosing the decision cutoff from costs). And calibration isn't permanent — covariate shift and concept drift break it even when the original test calibration looked perfect, so monitor ECE/reliability in production rather than treating it as a one-time fix.`,
    ],
    interactivePrompt: `Before you touch the controls: a model has a great AUC of 0.95 but says "90% sure" for a group where the real rate is 60%. Is its ranking broken, its probabilities broken, or both?`,
    checkQuestions: [
      {
        q: `A neural network stamps 0.9 on a batch of cases, but only 60% of them are actually positive. What is wrong, and how do you fix it?`,
        options: [
          `\`A) It is overconfident — its 0.9 means about 0.6 in reality. Patch it after training: on a separate calibration set, fit a correcting function (Platt or temperature scaling, or isotonic regression if you have enough data) that maps the raw scores back onto the true rates, then apply it at prediction time. Check the result on a different test set.\``,
          `\`B) It is underconfident — since most of the 0.9 cases really are positive, the model is basically right, and you only need to act if the calibration error climbs above 0.15 on the full validation set.\``,
          `\`C) Nothing is wrong with the probabilities; the network simply needs more epochs so the outputs settle closer to 0.6, after which those 0.9 outputs will drift down on their own with no other change.\``,
          `\`D) The labels on those cases are noisy; relabel the batch so its positive rate matches 0.9, and the reported probability becomes correct again without touching the model itself.\``,
        ],
        answer: `A`,
      },
      {
        q: `A credit model has a superb AUC of 0.95 but a bad calibration error. What does that combination actually mean?`,
        options: [
          `\`A) It is a contradiction — a high AUC guarantees good calibration, so one of the two numbers must have been computed incorrectly and the whole evaluation should be run again from scratch.\``,
          `\`B) It ranks cases beautifully — riskier applicants really do score higher than safer ones — but its actual probability numbers are off, so it is confidently wrong about the odds. Fine for deciding who to approve; useless for estimating how much money you will lose.\``,
          `\`C) It means the model is underfitting: a strong ranker with poor probabilities has simply not trained long enough, and running more epochs will pull the calibration error down while leaving the AUC untouched.\``,
          `\`D) It means the test set is too small, since AUC and calibration error always agree on large datasets and only ever diverge when the sample is too tiny to measure either one reliably.\``,
        ],
        answer: `B`,
      },
      {
        q: `You calibrate your model on the very same data it was trained on. Calibration looks perfect. Why is this a mistake?`,
        options: [
          `\`A) It is not a mistake — the training set is the largest slice of data you have, so calibrating on it gives you the most stable and reliable correcting function possible.\``,
          `\`B) It only wastes computation, since the model has already seen those rows; the fix itself works fine, you just could have saved time by using a smaller sample of the same training data.\``,
          `\`C) The model has partly memorised its training rows, so its scores there already look artificially in line with the labels. The correcting function is fooled into thinking little needs fixing, then fails on new data. Calibrate on a separate held-out slice, and test on yet another.\``,
          `\`D) The only issue is speed: calibrating on training data makes the correcting function converge slowly, so it is better to use fresh data purely because it fits the calibrator faster.\``,
        ],
        answer: `C`,
      },
      {
        q: `Your model reports a low overall ECE, but a colleague says it might still be badly miscalibrated. How can both be true, and what is a richer single number?`,
        options: [
          `\`A) They can't both be true — a low ECE mathematically guarantees good calibration everywhere, so the colleague is simply wrong.\``,
          `\`B) ECE depends on the binning and can hide local miscalibration: a model overconfident in one region and underconfident in another averages out to a small ECE. It's also binning- and sample-size-sensitive. The Brier score is richer — it decomposes into reliability (calibration), resolution (discrimination), and uncertainty — and you should always read the reliability diagram, not just a scalar.\``,
          `\`C) The discrepancy means the ECE was computed on the training set; recomputing it on the test set will make it agree with the colleague's assessment and no other metric is needed.\``,
          `\`D) Low ECE with hidden miscalibration only happens for regression models, so the fix is to switch from ECE to R², which measures calibration correctly for probabilities.\``,
        ],
        answer: `B`,
      },
      {
        q: `Your neural network is overconfident. You apply temperature scaling. What does it do, and what does it deliberately leave untouched?`,
        options: [
          `\`A) It retrains the final layer on a calibration set, which changes both the probabilities and the model's ranking so that accuracy improves along with calibration.\``,
          `\`B) It divides the logits by a single learned scalar T before the softmax (T > 1 softens overconfident probabilities). Because it only rescales the logits, it leaves the ranking and accuracy completely unchanged while fixing the confidence — its one-parameter simplicity is why it rarely overfits.\``,
          `\`C) It clips every predicted probability to the range [0.05, 0.95], which removes overconfidence by brute force but also flattens the ranking between the clipped cases.\``,
          `\`D) It adds a temperature feature to the input and retrains the whole network, so both the decision boundary and the probabilities shift together.\``,
        ],
        answer: `B`,
      },
      {
        q: `An interviewer asks you to distinguish calibration from threshold tuning. What's the cleanest answer?`,
        options: [
          `\`A) They're the same operation — moving the decision threshold is exactly how you make probabilities honest, so calibrating a model just means picking the right cutoff.\``,
          `\`B) Calibration makes the probability truthful (0.7 should mean 70%); thresholding picks the decision cutoff that turns a probability into an action, chosen from business costs. They're related — honest probabilities make the threshold meaningful and transferable — but separate steps: calibrate first so the number is trustworthy, then threshold so the decision is optimal.\``,
          `\`C) Calibration sets the cutoff and thresholding fixes the probabilities — the two names are simply swapped in most textbooks, but they refer to one combined step done at training time.\``,
          `\`D) Thresholding is only needed for calibrated models and calibration is only needed for uncalibrated thresholds, so you never actually perform both on the same model.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `AUC tells you if a model ranks cases correctly; calibration tells you if its probabilities are actually true — when it says 0.7, does it happen 70% of the time? The two are separate, and most models (random forests, neural nets) come out overconfident. Whenever a decision uses the probability itself, plot the reliability diagram, and fix miscalibration with Platt scaling or isotonic regression on a separate calibration set — never on training or test.`,
    recap: [
      "**AUC = does it rank correctly. Calibration = are the probabilities literally true?** Separate properties.",
      "**Calibrated means: when it says 0.7, the thing happens ~70% of the time.**",
      "**Most models come out overconfident** (random forests, neural nets).",
      "**Whenever a decision uses the probability itself, plot the reliability diagram.**",
      "**Fix with Platt scaling or isotonic regression** on a separate calibration set — never train or test.",
      "**Don't trust ECE alone** — pair it with the reliability diagram and the Brier score.",
      "**Calibration ≠ thresholding, and it decays under drift.**",
    ],
    interactiveId: 'calibration_curve_viz',
    figures: {
      reliability_diagram: `<svg viewBox="0 0 280 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:280px;font-family:var(--font-sans,sans-serif)">
  <!-- axes -->
  <line x1="40" y1="220" x2="240" y2="220" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="40" y1="220" x2="40" y2="20" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="140" y="248" text-anchor="middle" fill="var(--ink-low)" font-size="10">predicted probability</text>
  <text x="14" y="120" text-anchor="middle" fill="var(--ink-low)" font-size="10" transform="rotate(-90 14 120)">actual rate</text>
  <!-- perfect calibration diagonal -->
  <line x1="40" y1="220" x2="240" y2="20" stroke="var(--ink-low)" stroke-width="1.2" stroke-dasharray="5,4"/>
  <text x="196" y="52" fill="var(--ink-low)" font-size="9">perfect</text>
  <!-- overconfident curve (sags below diagonal) -->
  <polyline points="60,210 100,184 140,154 180,120 220,96" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <circle cx="60" cy="210" r="3.5" fill="var(--prime)"/>
  <circle cx="100" cy="184" r="3.5" fill="var(--prime)"/>
  <circle cx="140" cy="154" r="3.5" fill="var(--prime)"/>
  <circle cx="180" cy="120" r="3.5" fill="var(--prime)"/>
  <circle cx="220" cy="96" r="3.5" fill="var(--prime)"/>
  <text x="150" y="200" fill="var(--prime)" font-size="9" font-weight="700">overconfident</text>
  <text x="150" y="212" fill="var(--prime)" font-size="8">(below the line)</text>
</svg>`,
    },
  },
  {
    id: 'class_imbalance',
    interactiveId: 'class_imbalance_viz',
    title: 'Class Imbalance',
    subtitle: 'SMOTE, threshold tuning, class weights, precision@K',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['imbalance', 'SMOTE', 'precision@K', 'threshold'],
    summary: `Imagine you are building a fraud detector for a bank. Out of every thousand transactions, only one is fraud. Here is a "model" that scores 99.9% accuracy: label *every* transaction as legitimate. It is right 999 times out of 1000 — and it is utterly worthless, because it never catches a single fraud, which was the whole point. This is the **accuracy trap**, and it makes **class imbalance** one of the sneakiest problems in machine learning: your headline number looks fantastic while the model does nothing useful.

The deeper issue is not really the imbalance itself — it is that **not all mistakes cost the same**. Missing a fraud (a false negative) might cost thousands of dollars; flagging a legit purchase (a false positive) costs a moment of annoyance. Accuracy quietly assumes those two mistakes are equally bad, and they never are. The imbalance just makes that mismatch impossible to ignore.

[FIGURE: imbalance_skew]

---

**Step one: stop measuring with accuracy.**

If accuracy lies, what do you look at instead? Two numbers that actually care about the rare class:

**Recall** (also called sensitivity): of all the real frauds, what fraction did the model catch? A recall of 0 exposes the "always legit" model instantly.

**Precision**: of all the transactions the model flagged as fraud, what fraction really were? This tells you how much of your fraud team's time is wasted chasing false alarms.

There is usually a tug-of-war between them — flag more aggressively and you catch more fraud (higher recall) but with more false alarms (lower precision). The **PR-AUC** (the precision-recall area) captures that whole tradeoff in one number, and it is far more honest than the more common ROC-AUC when the positive class is rare, because ROC-AUC hands the model easy credit for correctly ignoring the huge majority.

---

**Step two: make the model care about the rare class.**

By default, training treats every example as equally important, so the rare class gets drowned out — a thousand "legit" examples shout down the one "fraud." Two ways to fix that.

The simplest, and usually the first to try, is **class weights**: tell the loss function that getting a fraud example wrong costs (say) a thousand times more than getting a legit one wrong. Now the same gradient descent that was ignoring the rare class is forced to pay attention to it — no new data, just a reweighted loss.

Alternatively you can **rebalance the data itself**: **oversample** the rare class (duplicate it, or with **SMOTE**, create synthetic in-between examples) or **undersample** the majority (throw some of it away). These help distance-based models and neural nets, but for tree-based models class weights are usually cleaner and work just as well.

---

**Step three: choose the threshold on purpose.**

Here is the step almost everyone forgets. A classifier gives a *score*; turning it into a yes/no needs a **threshold**, and the default of 0.5 is almost never right for an imbalanced, unequal-cost problem. If missing a fraud is a thousand times worse than a false alarm, you want to flag on much weaker suspicion — a far lower threshold. So after training, pick the threshold *deliberately*: look at the precision and recall you get at each possible cutoff, and choose the one that matches what the problem actually costs. Train the model to rank well; then set the threshold to act well.

---

**Precision@K: when you can only act on a few.**

Often the real constraint isn't a threshold at all — it's *capacity*. A fraud team can investigate maybe 500 alerts a day; a doctor can review only so many flagged scans. In that world the question changes from "what's our recall?" to "of the **top 500** cases the model ranks as riskiest, how many are real fraud?" That's **precision@K** — precision measured on the top K by score. Its partners are **recall@K** (of all fraud, how much did the top K capture?) and **lift@K** (how much better than random is the top K?). When action is capacity-limited, optimise the ranking for precision@K, not a global threshold — the model just has to get the *worst* cases to the top of the list.

---

**The cost matrix, made explicit.**

"Missing a fraud is worse than a false alarm" can be written down precisely as a **cost matrix**: a dollar cost for each cell of the confusion matrix (a false negative costs \\$2,000, a false positive costs \\$5, true predictions cost 0). Once you have that, the optimal decision isn't a guessed threshold — it's the one that **minimises expected cost**: flag whenever the expected cost of flagging is below the expected cost of not flagging, which for a calibrated probability gives an exact optimal threshold. This is the rigorous version of "pick the threshold from the costs," and it's why calibrated probabilities matter here.

---

**SMOTE has sharp edges.**

SMOTE (synthesising in-between minority examples) is popular but easy to misuse. The cardinal rule: **apply it only inside cross-validation folds, after the split — never before.** Oversample first and copies of the same synthetic points land in both train and validation, leaking and inflating your score. Beyond that, SMOTE struggles in high-dimensional sparse data (its "in-between" points are meaningless), with noisy labels (it amplifies the noise), with overlapping classes (it synthesises into the other class's territory), and with time-series (it invents points that violate temporal order). It's a tool, not a default.

---

**Resampling distorts your probabilities.**

A subtle consequence interviewers love: oversampling or undersampling **changes the class balance the model trains on**, so its predicted probabilities no longer reflect the true base rate — they come out systematically too high for the minority class. SMOTE in particular tends to over-estimate minority-class probabilities. So if you resample *and* you need real probabilities (for cost-based thresholds or downstream use), you must **recalibrate** afterward, or correct the prior back to the true rate. Class weights avoid this problem, which is another reason to prefer them when probabilities matter.

---

**Match the fix to the model.**

The right lever depends on the algorithm. **Tree ensembles and boosting** usually do best with class weights / \`scale_pos_weight\` plus threshold tuning — resampling buys them little. **Linear and distance-based models** (logistic regression, k-NN, SVM) are more sensitive to the geometry, so sampling and careful feature scaling can help them more. Don't apply one imbalance recipe blindly across model families.

---

**The fuller metric menu.**

Beyond precision/recall/PR-AUC, know the wider toolkit: **balanced accuracy** (average recall across classes), **F1** and its **macro/micro/weighted** variants (macro treats classes equally, weighted accounts for size), **MCC** (Matthews correlation, robust on imbalance and often the best single summary), **specificity** and the **false-positive/false-negative rates**, and — always — the **confusion matrix read at your chosen threshold** so you see the actual counts, not just a summary.

---

**When imbalance gets extreme.**

At 1-in-100,000 (rare diseases, novel fraud), the classification framing itself starts to break, and you switch strategies. Frame it as **anomaly detection** (model "normal," flag deviations) rather than two-class classification. Use a **two-stage retrieval-then-rank** pipeline. Design explicitly around **human review capacity** (precision@K), **delayed labels** (the truth arrives weeks later), and **alert fatigue** (too many false positives and reviewers stop trusting the system). Extreme imbalance is a systems problem, not just a loss-function tweak.`,
    keyPoints: [
      `**On an imbalanced problem, accuracy is a trap — use precision, recall, and PR-AUC instead.**\n\nWhen 999 of 1000 cases are one class, a model that always guesses that class scores 99.9% and catches nothing. Recall (of the real positives, how many did you catch?) and precision (of your positive flags, how many were real?) actually track the rare class, and PR-AUC sums up their tradeoff in a single number. Prefer PR-AUC over the more common ROC-AUC when positives are rare, because ROC-AUC hands out easy credit for correctly ignoring the huge majority.`,
      `**The real problem is not the imbalance — it is that the two kinds of mistake cost different amounts.**\n\nMissing a fraud can cost thousands; a false alarm costs a moment. Accuracy pretends they are equal. The cheapest fix is class weights: tell the loss that a mistake on the rare class costs far more, and the same gradient descent that was ignoring it now focuses on it — no new data needed. Resampling the data (oversampling the rare class, SMOTE, or undersampling the majority) is an alternative, but for tree models class weights are usually cleaner and just as effective.`,
      `**The step everyone forgets: choose the decision threshold on purpose, not at the default 0.5.**\n\nA classifier gives a score; turning it into a yes/no needs a cutoff, and 0.5 almost never matches an imbalanced, unequal-cost problem. If missing a positive is far worse than a false alarm, flag on weaker suspicion — a lower threshold. After training, look at the precision and recall you get at each cutoff and pick the one that matches what the problem actually costs. Train the model to rank; then set the threshold to act.`,
      `**When action is capacity-limited, optimise precision@K and derive the threshold from an explicit cost matrix.**\n\nIf a team can only review the top 500 alerts, the metric is precision@K (of the top K by score, how many are real) with recall@K and lift@K — the model just needs the worst cases at the top of the list. And "pick the threshold from costs" has a rigorous form: write a cost matrix (dollar cost per confusion-matrix cell) and choose the threshold that minimises expected cost, which for a calibrated probability is exact — another reason calibrated probabilities matter. Round out judging with balanced accuracy, macro/weighted F1, MCC, and the confusion matrix at your chosen threshold.`,
      `**SMOTE has sharp edges, resampling distorts probabilities, and the right fix depends on the model.**\n\nApply SMOTE only inside CV folds after the split (before it leaks), and avoid it with high-dimensional sparse data, noisy or overlapping labels, and time-series. Resampling changes the training class balance, so predicted probabilities come out too high for the minority class — recalibrate afterward if you need real probabilities (class weights sidestep this). Match the lever to the family: tree/boosting → class weights + \`scale_pos_weight\` + threshold tuning; linear/distance models → sampling and scaling. And at extreme imbalance (1-in-100k), switch framing to anomaly detection, two-stage retrieval/ranking, and design around review capacity, delayed labels, and alert fatigue.`,
    ],
    interactivePrompt: `Before you touch the controls: on a dataset that is 99% one class, a model reports 99% accuracy. Does that tell you it is a good model, a useless one, or can you not tell yet?`,
    checkQuestions: [
      {
        q: `Your fraud model has a great ROC-AUC, but the ops team complains about too many false alarms. What is the real fix?`,
        options: [
          `\`A) Retrain with SMOTE to balance the classes; the false alarms come from the model defaulting to the majority class, and balancing the training data will bring the false-positive count down.\``,
          `\`B) Its ranking is already good (high AUC) — the real problem is the decision threshold, which at 0.5 does not match the true cost of a false alarm. Look at precision and recall across thresholds and raise the cutoff until the flagged alerts hit the precision the ops team needs.\``,
          `\`C) Add stronger regularisation; the false alarms come from an overfit boundary that is too sensitive near the edge, and smoothing that boundary will cut the false-positive rate down to size.\``,
          `\`D) Just report PR-AUC instead of ROC-AUC to the team; once they see the lower number they will accept the false alarms as unavoidable and adjust their expectations of the system accordingly.\``,
        ],
        answer: `B`,
      },
      {
        q: `On a dataset that is 99% negatives, your model reports 99% accuracy. What should you conclude?`,
        options: [
          `\`A) That it is an excellent model — 99% accuracy is close to the ceiling, so it is clearly capturing almost all of the real signal that exists in the data.\``,
          `\`B) That it is definitely broken, because no honest model can reach 99% accuracy on real-world data without a bug or a leak somewhere in the pipeline.\``,
          `\`C) Almost nothing yet — a model that simply always predicts "negative" also scores 99% while catching none of the positives. Look at recall and precision on the rare class before judging it at all.\``,
          `\`D) That the classes must actually be balanced, since a model can only reach 99% accuracy when both classes are roughly equally represented in the training data.\``,
        ],
        answer: `C`,
      },
      {
        q: `You are told that missing a positive is ten times worse than raising a false alarm. What is the most direct way to bake that into training?`,
        options: [
          `\`A) Set class weights so a mistake on the positive class costs ten times as much in the loss. Gradient descent then works harder to avoid missing positives, shifting the model toward higher recall — with no changes to the data at all.\``,
          `\`B) Duplicate every positive example exactly ten times before training, which is mathematically identical to class weights and is always the more reliable of the two approaches in practice.\``,
          `\`C) Leave the training untouched and only change the report afterward, since altering the loss introduces bias that lowers the model's overall accuracy on the held-out test set.\``,
          `\`D) Lower the decision threshold to 0.1 and stop there; that single change fully captures a ten-to-one cost ratio on its own, with no need to touch the loss or the class weights.\``,
        ],
        answer: `A`,
      },
      {
        q: `Your fraud team can investigate only 500 alerts per day out of millions of transactions. Which metric should you optimise, and why is a global threshold the wrong framing?`,
        options: [
          `\`A) Optimise overall accuracy — with only 500 reviews the model barely affects the accuracy number, so maximising it is the safest objective.\``,
          `\`B) Optimise precision@K (here K=500): of the top 500 transactions the model ranks riskiest, how many are real fraud. When action is capacity-limited, the model only needs to get the worst cases to the top of the list — recall@K and lift@K round out the picture — rather than committing to a single global cutoff that ignores the 500-per-day limit.\``,
          `\`C) Optimise recall across all thresholds, since catching every fraud is the only goal and the 500-alert limit can be raised later if needed.\``,
          `\`D) Optimise ROC-AUC, because it already accounts for review capacity by weighting the top-ranked predictions more heavily than the rest.\``,
        ],
        answer: `B`,
      },
      {
        q: `You apply SMOTE to your whole dataset and then do cross-validation. Validation scores look great but production is poor. What went wrong?`,
        options: [
          `\`A) SMOTE simply doesn't work for fraud; remove it entirely and rely on accuracy, which will now reflect true production performance.\``,
          `\`B) Oversampling before the split leaks: synthetic minority points (and near-duplicates of the same real points) land in both training and validation folds, so the model is partly evaluated on data related to what it trained on, inflating the scores. Apply SMOTE only inside each CV fold, after the split. Also note resampling distorts predicted probabilities, so recalibrate if you need them.\``,
          `\`C) The validation set was too small; increasing it will make the SMOTE-inflated scores match production without changing where SMOTE is applied.\``,
          `\`D) SMOTE needs more synthetic points; generating ten times as many minority examples before cross-validation will close the gap between validation and production.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `On an imbalanced problem, accuracy is a trap — a model that always guesses the majority class scores high and does nothing. The real issue is that the two kinds of mistake cost different amounts. Measure with precision, recall, and PR-AUC instead; make the model care about the rare class with class weights (or resampling); and set the decision threshold deliberately to match what the problem actually costs, rather than leaving it at 0.5.`,
    recap: [
      "**Accuracy is a trap** — always guessing the majority class scores high and does nothing.",
      "**Real issue: the two kinds of mistake cost different amounts.**",
      "**Measure with precision, recall, PR-AUC** — not accuracy.",
      "**Make the model care about the rare class** with class weights (or resampling).",
      "**Set the decision threshold deliberately** to match the cost — don't leave it at 0.5.",
      "**When action is capacity-limited, optimise precision@K** and derive the threshold from a cost matrix.",
      "**SMOTE has sharp edges;** resampling distorts probabilities — the right fix depends on the model.",
    ],
    interactiveId: 'class_imbalance_viz',
    figures: {
      imbalance_skew: `<svg viewBox="0 0 360 175" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">1 in 1000 is fraud</text>
  <g fill="var(--ink-low)" opacity="0.65">
    <circle cx="55" cy="48" r="5"/><circle cx="80" cy="42" r="5"/><circle cx="104" cy="52" r="5"/><circle cx="128" cy="44" r="5"/><circle cx="70" cy="66" r="5"/><circle cx="96" cy="70" r="5"/><circle cx="120" cy="64" r="5"/><circle cx="52" cy="82" r="5"/><circle cx="82" cy="90" r="5"/><circle cx="110" cy="86" r="5"/><circle cx="136" cy="78" r="5"/><circle cx="64" cy="104" r="5"/><circle cx="94" cy="108" r="5"/><circle cx="122" cy="104" r="5"/><circle cx="146" cy="96" r="5"/><circle cx="76" cy="122" r="5"/><circle cx="106" cy="124" r="5"/><circle cx="134" cy="120" r="5"/>
  </g>
  <text x="98" y="150" text-anchor="middle" fill="var(--ink-low)" font-size="9">majority: legit</text>
  <circle cx="268" cy="85" r="8" fill="var(--prime)"/>
  <text x="268" y="112" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">fraud</text>
  <text x="180" y="170" text-anchor="middle" fill="var(--ink-hi)" font-size="9">"always legit" = 99.9% accurate, catches 0 fraud</text>
</svg>`,
    },
  },
  {
    id: 'feature_selection',
    title: 'Feature Selection & Dimensionality',
    subtitle: 'Filter/wrapper/embedded, mutual information, RFE, SHAP',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['feature selection', 'mutual information', 'SHAP', 'RFE'],
    summary: `It feels obvious that more features should mean better predictions — more information about each house, each patient, each customer. For a while that is true. But there is a point where piling on features starts making the model *worse*, and the reason has a wonderful name, coined by the mathematician Richard Bellman in the 1950s: the **curse of dimensionality**.

Here is the curse in one picture. Imagine 100 data points spread along a single line (one feature) from 0 to 1 — they sit packed close together, a few hundredths apart. Now give each point a second feature: the same 100 points scatter across a square, and the gaps between them widen. Add a third feature and they float in a cube, mostly empty space around each one. Keep going, and in high dimensions the points drift so far apart that every point is roughly the same enormous distance from every other — there is simply not enough data to fill the space. Patterns that were obvious in a few dimensions dissolve into the emptiness.

[FIGURE: curse_of_dimensionality]

So extra features are not free. Irrelevant ones add noise for the model to trip over. Redundant ones (two features saying the same thing) add nothing but confusion. And every extra dimension thins out your data, which makes overfitting easier and real structure harder to find. The cure is to be deliberate about which features you keep — that is **feature selection**.

---

**Three families of ways to choose.**

There are three broad strategies, trading speed for smartness.

**Filter methods** are the quick screen. They score each feature on its own — how strongly does it relate to the target, using a measure like correlation or mutual information — and keep the top ones. Fast and simple, but blind: they judge each feature in isolation, so they can throw away two features that are useless alone yet powerful together.

**Wrapper methods** are the brute-force search. They actually train the model on different subsets of features and keep whichever subset scores best. A common version, **recursive feature elimination**, trains the model, drops the weakest feature, and repeats. Accurate, because the model itself is the judge — but slow, since it means training many times, which becomes impractical with thousands of features.

**Embedded methods** fold selection into training itself. **Lasso (L1 regularisation)** is the classic: as the model trains, its penalty drives useless features' weights all the way to zero, selecting and fitting at once. Tree-based importance — or better, SHAP values — does something similar: a single trained model ranks the features it actually leaned on, interactions included. For everyday tabular work this is the most reliable recipe: train one gradient-boosted model on everything, rank the features by importance, and keep the top ones.

---

**Selection versus reduction — a real distinction.**

There is a cousin of feature selection worth separating out: **dimensionality reduction**, of which **PCA** is the famous example. The difference matters. Selection *keeps a subset of your original features* — afterward you can still say "we used income, age, and debt." Reduction *invents new features* by blending the old ones into a handful of combined directions that capture most of the variation. Those directions are compact but no longer mean anything you can explain to a person ("0.4 × income minus 0.2 × age…"). So choose selection when you need to keep things explainable, and reduction when you only care about squeezing the information into fewer numbers.

---

**The one trap that fakes good results.**

Whatever method you use, there is a mistake that quietly inflates your numbers: **choosing features using the whole dataset, before you split off a test set.** If you pick features by how they relate to the label across *all* your data, you have let the test set's answers leak into the choice — the chosen features look more predictive than they really are, and your reported accuracy is a mirage. The fix is to do feature selection *inside* your cross-validation: choose features using only the training portion of each fold, and judge on the held-out portion. Select on the training data only. Always.

---

**SHAP is powerful but not gospel.**

SHAP is the best-known importance tool, and it's genuinely good — it fairly attributes a prediction across features with solid theory behind it. But two caveats keep you honest. First, under **correlated features** SHAP can *split* or *shuffle* credit between the correlated group in ways that mislead — a truly important feature can look weak because its correlated twin absorbed the attribution. Second, SHAP explains what the *model* used, not what *causes* the outcome — high SHAP importance is **not** evidence of causality. Treat SHAP as "what is this model leaning on," never as "what drives the world."

---

**Permutation importance, and its blind spot.**

A model-agnostic alternative worth naming: **permutation importance** shuffles one feature's values and measures how much accuracy drops — a big drop means the model really relied on it. It works on any fitted model and needs no retraining. Its blind spot is the same correlation trap that haunts forests: with two correlated features, shuffling one barely hurts because its twin still carries the signal, so both look unimportant. So read permutation importance with the correlation caveat, and consider dropping correlated groups together to test them jointly.

---

**Mutual information, read carefully.**

Correlation only catches *linear* relationships; **mutual information** catches *any* dependence, linear or not, which is why it's a better filter score. But mind its limits: as usually applied it's **univariate** (scores each feature against the target alone, missing features that only matter in combination), and its estimate is **sensitive to binning, the estimator, and sample size** — noisy MI values with little data can rank features almost at random. Useful as a fast screen, not a final verdict.

---

**RFE in practice: use RFECV.**

Recursive feature elimination is accurate but has practical costs: it's **expensive** (retrains repeatedly), **estimator-dependent** (the ranking changes with the model you wrap), and **unstable under correlated features**. And plain RFE makes you guess *how many* features to keep. The fix is **RFECV** — wrap RFE in cross-validation so it *selects the feature count* by held-out performance instead of you picking it by hand.

---

**PCA's fine print.**

If you do reach for PCA, know its assumptions. It's **unsupervised** — it keeps the directions of largest *variance*, which are **not necessarily the directions that predict your target** (a high-variance feature can be pure noise). It's scale-sensitive, so you **must standardise first** or the largest-unit feature dominates the components. And the components are linear blends of everything, so they're **hard to explain**. PCA reduces dimensions and decorrelates, but it can throw away exactly the low-variance signal that mattered.

---

**When dimensions explode: special regimes.**

The right strategy shifts sharply with the data type. For **text / sparse one-hot** features (tens of thousands of mostly-zero columns), L1/Lasso-style selection and sparse-aware methods fit naturally. For **genomics** (p ≫ n, thousands of genes, few samples), univariate screening plus stability selection is common. For **embeddings** (dense learned vectors), individual dimensions are meaningless, so you reduce or regularise rather than select individual columns. Don't apply a tabular feature-selection recipe blindly to text, genomic, or embedding data.

---

**Is the selection even stable?**

One last discipline: a feature set chosen from a single run can be a fluke of that particular sample. **Stability selection** checks this — rerun the selection on many bootstrap resamples (or CV folds) and keep the features that get chosen *consistently*. If a feature appears in 90% of runs, trust it; if it flickers in and out across runs, it's likely noise dressed up as signal. Stable selections generalise; one-run selections often don't.`,
    keyPoints: [
      `**More features is not always better — past a point they add noise and thin out your data (the curse of dimensionality).**\n\nIrrelevant features give the model more ways to trip; redundant ones add confusion; and every extra dimension spreads your data points further apart, which makes overfitting easier and real patterns harder to find. So be deliberate about which features you keep. A solid default recipe: train one gradient-boosted model on everything, rank the features by importance (SHAP is a strong choice, though read with care under correlated features), and keep the top ones.`,

      `**Know the three ways to choose, and their tradeoff of speed versus smartness.**\n\nFilter methods score each feature on its own — fast, but blind to features that only matter in combination. Wrapper methods train the model on different subsets and keep the best — accurate, but slow, and impractical with thousands of features. Embedded methods select while training: Lasso zeros out useless weights as it fits, and tree or SHAP importance ranks what a trained model actually used. For everyday tabular work, embedded methods give the best balance of the three.`,
      `**The trap that fakes good results: choosing features on the whole dataset before splitting off a test set.**\n\nIf you pick features by how they relate to the label across all your data, the test set's answers have leaked into the choice, and your reported accuracy is a mirage. Do feature selection inside cross-validation: choose features using only the training portion of each fold, then judge on the held-out portion. And keep selection (which preserves your original, explainable features) separate from dimensionality reduction like PCA (which blends them into compact but unexplainable new ones).`,
      `**Read every importance method with the correlation caveat, and don't confuse importance with cause.**\n\nSHAP fairly attributes predictions but splits credit between correlated features and shows what the *model* used, not what *causes* the outcome — high SHAP ≠ causal. Permutation importance is model-agnostic but hits the same correlation trap (shuffling one of a correlated pair barely hurts). Mutual information catches non-linear dependence but is univariate and binning/sample-sensitive. RFE is accurate but expensive, estimator-dependent, and unstable — use RFECV to pick the feature count. And PCA keeps high-variance directions, which aren't necessarily predictive, needs standardising, and yields unexplainable components.`,
      `**Confirm your selection is stable, and adapt to the data regime.**\n\nA feature set from one run can be a fluke — stability selection reruns the choice across bootstraps/folds and keeps features chosen consistently (appears in 90% of runs → trust it; flickers → noise). And the recipe shifts with the data: L1/sparse methods for text and one-hot, univariate screening plus stability selection for genomics (p ≫ n), and reduce/regularise rather than select individual columns for dense embeddings — a tabular recipe doesn't transfer blindly.`,
    ],
    interactivePrompt: `Before you touch the controls: you keep adding features and the model's training accuracy climbs, but its test accuracy starts to fall. What is most likely going on?`,
    checkQuestions: [
      {
        q: `You have 500 features and want to cut down to about 50 before tuning a model. What is a sound approach?`,
        options: [
          `\`A) Run cross-validation on all 500 features, average each feature's coefficient across the folds, and keep the top 50 — this leans on the model's own signal and is the single most reliable method available.\``,
          `\`B) Rank all 500 by their individual mutual information with the target and keep the top 50; since mutual information already handles redundancy and interactions on its own, no other steps are needed at all.\``,
          `\`C) First drop constant and near-constant features and one of each highly correlated pair (cheap, no model needed). Then train a model on what remains and rank features by an interaction-aware importance like permutation importance or SHAP, keeping the top 50. Check the smaller model matches the full one, and loosen to 75 if it drops.\``,
          `\`D) Use recursive feature elimination with Gini importance, dropping the 50 weakest features in a single shot and never retraining, since one pass is enough to identify which features can safely be removed.\``,
        ],
        answer: `C`,
      },
      {
        q: `A colleague ranks features by their correlation with the label across the entire dataset, then runs cross-validation to report accuracy. Why is the number misleading?`,
        options: [
          `\`A) The features were chosen using the whole dataset, including the rows that later serve as test folds — so the label information from those rows leaked into the selection, and the chosen features look more predictive than they are. Selection has to happen inside the CV loop, on each fold's training portion only.\``,
          `\`B) Correlation is a filter method and ignores interactions, so the real problem is that it misses features that only matter in combination; switching to Gini importance on the full dataset would fix the misleading number.\``,
          `\`C) The procedure is fine — correlation on the full dataset estimates a population-level quantity, so using it before cross-validation is just like standardising the features beforehand, which is entirely normal practice.\``,
          `\`D) Five folds is simply too few to evaluate a model with a reduced feature set; the number is misleading only because leave-one-out cross-validation was not used to measure the accuracy more precisely.\``,
        ],
        answer: `A`,
      },
      {
        q: `Your stakeholders need to explain each prediction ("we flagged this loan because of income and debt"). Should you use feature selection or PCA-style dimensionality reduction, and why?`,
        options: [
          `\`A) PCA — it compresses the features into fewer numbers, and fewer numbers are always easier for stakeholders to reason about than a long list of the original named features.\``,
          `\`B) Feature selection — it keeps a subset of your original, named features, so each prediction can still be explained in plain terms. PCA blends features into new combined directions that are compact but no longer mean anything a person can point to.\``,
          `\`C) Either one works equally well for explanation, since a PCA component can always simply be relabelled with the name of whichever original feature it happens to resemble most closely.\``,
          `\`D) PCA — dimensionality reduction is strictly more powerful than selection, and its components stay just as interpretable as the original features once you rotate them back into place.\``,
        ],
        answer: `B`,
      },
      {
        q: `A stakeholder points to a feature's high SHAP importance and concludes it "causes" the outcome, so the business should intervene on it. Why is that reasoning unsafe?`,
        options: [
          `\`A) It's completely safe — SHAP is grounded in game theory, so high SHAP importance is a mathematical proof of causation and intervening on the feature will change the outcome.\``,
          `\`B) SHAP explains what the trained model leaned on, not what causes the outcome in the world — high SHAP importance is associational, not causal. It can also mis-split credit among correlated features, so a truly important feature may look weak (or a proxy may look strong). Establishing causation needs an experiment or causal analysis, not a SHAP ranking.\``,
          `\`C) The reasoning fails only because SHAP values are random noise; averaging them over more background samples would turn them into valid causal estimates.\``,
          `\`D) SHAP is fine for causation but only for linear models, so the stakeholder is wrong purely because the model here is gradient-boosted rather than linear.\``,
        ],
        answer: `B`,
      },
      {
        q: `You want to be sure the features you selected aren't just an artifact of one particular training sample. What technique addresses this, and what does the mutual-information filter miss that it doesn't?`,
        options: [
          `\`A) Use leave-one-out cross-validation once; if accuracy is stable the feature set is automatically stable too, and mutual information already accounts for feature interactions so nothing is missed.\``,
          `\`B) Stability selection: rerun the selection across many bootstrap resamples or CV folds and keep features chosen consistently (e.g. in 90% of runs) — flickering features are likely noise. Mutual information, by contrast, is usually univariate: it scores each feature against the target alone and misses features that only matter in combination (and it's sensitive to binning and sample size).\``,
          `\`C) Use PCA to compress the features first, which guarantees stability because principal components never change across samples, and mutual information misses only linear relationships that PCA then recovers.\``,
          `\`D) Increase the number of features until the selection stabilises; more candidates always makes the chosen subset more robust, and mutual information misses nothing since it is fully multivariate by construction.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `More features is not always better — past a point they add noise and spread your data so thin that patterns vanish (the curse of dimensionality). Pick features deliberately: filter methods are fast but blind, wrapper methods are accurate but slow, and embedded methods (Lasso, tree or SHAP importance) usually give the best balance. Keep selection (which preserves your original, explainable features) separate from PCA-style reduction (which invents new ones). And always select inside cross-validation, or the test labels leak in and your results are a mirage.`,
    recap: [
      "**More features isn't always better** — past a point they add noise and thin your data out (curse of dimensionality).",
      "**Three ways to choose, speed vs smartness:** filter (fast, blind), wrapper (accurate, slow), embedded (best balance).",
      "**Embedded = Lasso, tree or SHAP importance** — usually the sweet spot.",
      "**Selection ≠ reduction:** selection keeps original explainable features; PCA invents new ones.",
      "**Always select inside cross-validation** — choose features on the whole dataset and test labels leak in (mirage results).",
      "**Read importances with the correlation caveat, and importance ≠ cause.**",
    ],
    figures: {
      curse_of_dimensionality: `<svg viewBox="0 0 470 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:470px;font-family:var(--font-sans,sans-serif)">
  <text x="75" y="20" text-anchor="middle" fill="var(--ink-hi)" font-size="12" font-weight="700">1D</text>
  <text x="235" y="20" text-anchor="middle" fill="var(--ink-hi)" font-size="12" font-weight="700">2D</text>
  <text x="395" y="20" text-anchor="middle" fill="var(--ink-hi)" font-size="12" font-weight="700">3D</text>
  <!-- 1D: packed line -->
  <line x1="25" y1="95" x2="140" y2="95" stroke="var(--ink-low)" stroke-width="1"/>
  <g fill="var(--prime)">
    <circle cx="40" cy="95" r="4"/><circle cx="52" cy="95" r="4"/><circle cx="63" cy="95" r="4"/><circle cx="76" cy="95" r="4"/><circle cx="88" cy="95" r="4"/><circle cx="99" cy="95" r="4"/><circle cx="112" cy="95" r="4"/><circle cx="125" cy="95" r="4"/>
  </g>
  <!-- 2D: square, more spread -->
  <rect x="180" y="42" width="110" height="105" fill="none" stroke="var(--ink-low)" stroke-width="1"/>
  <g fill="var(--prime)">
    <circle cx="200" cy="60" r="4"/><circle cx="255" cy="52" r="4"/><circle cx="230" cy="85" r="4"/><circle cx="275" cy="100" r="4"/><circle cx="195" cy="120" r="4"/><circle cx="240" cy="132" r="4"/><circle cx="210" cy="98" r="4"/><circle cx="268" cy="70" r="4"/>
  </g>
  <!-- 3D: cube, very sparse -->
  <g fill="none" stroke="var(--ink-low)" stroke-width="1">
    <rect x="345" y="55" width="80" height="80"/>
    <rect x="368" y="38" width="80" height="80"/>
    <line x1="345" y1="55" x2="368" y2="38"/><line x1="425" y1="55" x2="448" y2="38"/><line x1="345" y1="135" x2="368" y2="118"/><line x1="425" y1="135" x2="448" y2="118"/>
  </g>
  <g fill="var(--prime)">
    <circle cx="365" cy="72" r="4"/><circle cx="430" cy="60" r="4"/><circle cx="395" cy="100" r="4"/><circle cx="418" cy="120" r="4"/><circle cx="378" cy="128" r="4"/><circle cx="440" cy="95" r="4"/><circle cx="405" cy="65" r="4"/><circle cx="360" cy="105" r="4"/>
  </g>
  <text x="235" y="172" text-anchor="middle" fill="var(--ink-low)" font-size="10">same points, emptier space as dimensions grow</text>
</svg>`,
    },
  },
]
