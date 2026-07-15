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

To make every step ahead checkable by hand, shrink this down to one fact — size — and five real houses. Sizes, in hundreds of square feet: House A = 10, B = 15, C = 20, D = 25, E = 30 (that's 1,000 to 3,000 sqft). Prices, in thousands of dollars: 200, 250, 280, 310, 360. These ten numbers are the running example for the rest of this module — every weight, every residual, every score below is computed from exactly this table, so you can check each one yourself.

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

For one feature, that matrix formula collapses into arithmetic you can run by hand — and this is where the five houses stop being a story and become a computation. First find the mean size, x̄ = (10+15+20+25+30)/5 = **20**, and the mean price, ȳ = (200+250+280+310+360)/5 = **280**. Now measure how size and price move together: multiply each house's distance from the mean size by its distance from the mean price, and add those up. House A: (10−20)×(200−280) = (−10)×(−80) = 800. B: (−5)×(−30) = 150. C: (0)×(0) = 0. D: (5)×(30) = 150. E: (10)×(80) = 800. Total: **Sxy = 1900** — call this the *co-movement* sum. Next measure how spread-out size alone is: square each house's distance from the mean size and add those up: 100+25+0+25+100 = **Sxx = 250** — the *size-spread* sum. The best-fit slope is just their ratio: slope = Sxy / Sxx = 1900 / 250 = **7.6** — every extra hundred square feet adds \\$7,600, or \\$76 per square foot. The intercept anchors the line at the means: intercept = ȳ − slope×x̄ = 280 − 7.6×20 = 280 − 152 = **128** — a house with (hypothetically) zero size would price at \\$128k. So OLS hands back one exact model: **price = 128 + 7.6 × size**, no searching required.

Check it against the houses it was fit on. House A (size 10): 128 + 7.6×10 = 204, but it actually sold for 200 — a **residual** of 200 − 204 = **−4**. B (15): 128+114=242 vs 250, residual **+8**. C (20): 128+152=280 vs 280, residual **0** — a perfect hit, because the line passes through the means exactly. D (25): 128+190=318 vs 310, residual **−8**. E (30): 128+228=356 vs 360, residual **+4**. Notice the residuals sum to exactly zero (−4+8+0−8+4=0) — no accident, it's a direct consequence of the flat-slope condition that produced this line in the first place.

---

**A warning about trusting the weights.**

Now a catch that trips up almost everyone. Suppose two of your facts move together — bigger houses usually have more bedrooms, so size and bedroom count rise and fall as a pair. The model wants to hand out credit for the price, some to size and some to bedrooms. But because the two always move together, it cannot tell which one is really doing the work. It might load most of the weight onto size, or most onto bedrooms, and both choices predict prices about equally well.

So the weights turn shaky. Train on a slightly different batch of houses and those two weights can jump around — one run gives size a positive weight, the next run gives it a negative weight, as if a bigger house should cost *less*. Meanwhile the actual price predictions barely change. This is called **collinearity**. And notice carefully what is and is not moving: the two facts are still exactly as correlated as before — that is a fixed fact about your data and it does not budge. It is the *weights* that have gone unreliable, not the correlation.

Why care? Because people read the weights to decide which fact matters. See a weight near zero and think "this one does nothing, drop it," and you can be badly wrong — the weight may be tiny only because its twin grabbed the credit. The usual fix is a method called **Ridge**, which keeps the weights from growing wild and shaky. The Regularisation module picks up exactly here — and reuses this module's own Sxy=1900 and Sxx=250 to show, in real numbers, how Ridge and Lasso each tame a weight like our slope of 7.6.

---

**How good is the fit, really?**

Say you have trained the model and its total squared error comes out to some big number. Is that good? On its own it means nothing. Fifty million squared-dollars — compared to what?

You need a yardstick, and the fairest one is the dumbest possible model: the one that ignores every fact about the house and just guesses the same number every time — the average price. Call it the lazy model. How wrong is the lazy model? Take each house's price, subtract the average, square it, and add it all up. On the five houses: (200−280)²+(250−280)²+(280−280)²+(310−280)²+(360−280)² = 6400+900+0+900+6400 = **14,600**. That total, 14,600, is the **sum of squared deviations** — add up how far every price sits from the average, squared. Divide it by how many houses you have (5) and you get the *average* squared spread, which has a famous name: the **variance**: 14,600 ÷ 5 = **2,920**. (Take its square root and you are back in real dollars — that is the **standard deviation**, ≈ **$54.0k**. And the average you started from is the **mean**. Mean, then variance, then standard deviation, each one built on the one before.)

Now compare it to your model's own squared error — the one you can compute right now, from the residuals worked out above (−4, +8, 0, −8, +4): 16+64+0+64+16 = **160**. Your model is stuck with 160; the lazy model was stuck with 14,600.

Now comes the clever comparison. **R²** just asks: of all the error the lazy mean-model was stuck with, how much did your model clear away?

R² = 1 − (your model's squared error ÷ the lazy model's squared error) = 1 − (160 ÷ 14,600) = 1 − 0.0110 = **0.989**

Read it straight off. R² = 0 means you are no better than guessing the average — useless. R² = 1 means you nailed every house. Our 0.989 means the size-only model wiped out 98.9% of the error the lazy model had — size alone very nearly explains these five prices. Now the number finally means something, because it is measured against a floor.

R² is the first thing to look at when you judge a linear regression — but it hides one trap. Add a new fact to the model, even one that is pure random noise, and R² never goes down. The model can always use junk to shave a sliver off the training error. So plain R² quietly rewards piling on useless features. The fix is **adjusted R²**, which charges a small fee for every fact you add: adjusted R² = 1 − (1−R²)×(n−1)/(n−p−1), where n is the number of houses and p the number of features. With n=5, p=1: 1 − (1−0.989)×(4/3) = 1 − 0.0110×1.333 = 1 − 0.0146 = **0.985** — a little lower than plain R², exactly the fee for spending one feature. Add a second feature that is pure noise and p becomes 2: even if R² ticks up to, say, 0.991, adjusted R² now pays a steeper fee (n−p−1 shrinks from 3 to 2) and can fall below 0.985 even as plain R² rises — that's the whole point of the adjustment. So when you are deciding whether a feature belongs, trust adjusted R², not plain R².

---

**One last habit — the most useful one.**

Even a high R² can fool you, and this final trick catches it. Our own R² of 0.989 is a great score — but suppose the real relationship actually curves, and you fit a straight line anyway. You can still score an impressive R² and still be wrong about the shape.

To catch it, take your misses and plot them against your predictions. If the straight line is right, the misses should scatter randomly around zero — no pattern at all. Plot our five: prediction 204 → residual −4; 242 → +8; 280 → 0; 318 → −8; 356 → +4. No trend, no U, no fan — small, sign-flipping misses with no relationship to the prediction size, exactly what a genuinely linear fit should look like. But if the truth was a curve, the misses fall into a clear shape — often a U, too low in the middle and too high at the ends. That U is the model quietly telling you the straight line is the wrong shape. R² will never warn you. The plot of the misses always will.

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

"What if a single data point changes your slope?" is a classic — and you can watch it happen to our own five-house line. Add a sixth house, F: 8,000 sqft (size 80 in our hundreds-of-sqft units), sold for \\$300k. Two different things are going on. **Leverage** is a point with an extreme *feature* value — F sits at size 80, far out past the other five, which cluster between 10 and 30. That alone gives it the *potential* to swing the line hard, just by being far out — under the original line (price = 128 + 7.6×size), F "should" cost 128+7.6×80 = 736k, but it sold for only 300k, a huge gap. **Influence** is when a point *actually* does swing the fit — high leverage *and* a price that fights the trend, which is exactly F's situation.

Refit with all six houses and watch it happen: the new means are x̄=30, ȳ≈283.3, and the same co-movement/spread calculation from before now gives Sxy=2,900 and Sxx=3,250, so slope = 2900/3250 ≈ **0.89** — down from 7.6. One added house out of six collapsed the slope by 88%, from "\\$76 per square foot" to "\\$9 per square foot." **Cook's distance** measures exactly this: how much every weight would move if you deleted that one house — and it would flag House F immediately. A point with big Cook's distance is one row quietly steering your whole model. You find these by looking, not by trusting the summary metrics — R² won't flinch.

---

**Reading the weights like a statistician: the inference layer.**

So far we've used the weights to *predict*. But often the real question is "does size actually matter, or did we imagine it?" That needs the inference layer, and our five houses (before House F showed up) have exactly enough numbers to compute it. Around each weight you compute a **standard error** — how much that weight would jitter across different samples. It's built from the residual variance: MSE_resid = SSE/(n−2) = 160/3 ≈ 53.33 (that "−2" spends one degree of freedom on the slope, one on the intercept), then SE(slope) = √(MSE_resid / Sxx) = √(53.33/250) ≈ **0.462**. Divide the weight by its standard error and you get a **t-statistic**: 7.6/0.462 ≈ **16.4** — with only 3 degrees of freedom left (n−2=3), a t this large is far out in the tail, giving a **p-value** well under 0.001 — the odds of seeing a slope this big by chance, if size truly had no effect on price, are vanishingly small. Wrap the weight in the 95% critical value for 3 degrees of freedom (t≈3.18) and you get a **confidence interval**: 7.6 ± 3.18×0.462 ≈ 7.6 ± 1.47, or **[6.13, 9.07]**. In dollars per square foot: size adds about \\$76/sqft, and we're 95% confident it's between \\$61/sqft and \\$91/sqft — that's the difference between "\\$76" and a number you can actually stand behind.

And why is OLS the natural tool for this? The **Gauss-Markov theorem**: when those assumptions hold, OLS is **BLUE** — the Best Linear Unbiased Estimator, meaning among all unbiased straight-line methods, none has smaller variance. That's the deep reason least squares earns its place, not just tradition. (Note: scikit-learn gives you the weights but not p-values or intervals — for those you reach for statsmodels.)

---

**How the computer actually solves it.**

We wrote the one-step answer as $θ̂ = (XᵀX)⁻¹Xᵀy$, but no careful library computes it that literally. Forming XᵀX and inverting it *squares* how sensitive the math is to nearly-collinear features, so it can blow up numerically. Real solvers (scikit-learn included) instead use **QR** or **SVD** decompositions — same answer in exact arithmetic, far more stable when features are correlated or poorly scaled. Worth knowing that the textbook formula and the production code disagree on purpose.

---

**Picking the right yardstick.**

R² tells you how much you beat the lazy mean-model, but for reporting error you'll usually quote one of a few — and our five houses give real numbers for each. **MAE** is the plain average dollar miss: (4+8+0+8+4)/5 = **\\$4,800** — easy to read, shrugs off a few wild houses. **RMSE** squares before averaging, so it punishes big misses harder and stays in dollars: √(SSE/n) = √(160/5) = √32 ≈ **\\$5,657** — noticeably above the \\$4,800 MAE, exactly because RMSE lets the two \\$8k misses (D and B) count for more than the two \\$4k misses. Use RMSE when large errors are especially costly. **MAPE** reports the miss as a *percentage* of each price: (4/200 + 8/250 + 0/280 + 8/310 + 4/360)/5 × 100 ≈ **1.78%** — this travels across scales but explodes when true values are near zero and punishes over-prediction unevenly. And **R²** (0.989, computed above) is the unitless "fraction of variance explained" for a quick sense of fit. Match the metric to the question: absolute dollars (MAE/RMSE), relative error (MAPE), or overall fit (R²).`,
    keyPoints: [
      `**In one line: OLS finds the weights that make the total squared miss as small as possible — slope = Sxy/Sxx, intercept = ȳ − slope×x̄.**\n\nUse linear regression first whenever you are predicting a number and "add up the facts, each with its own weight" is a sensible guess. Its big advantage is that you can read the weights straight off — on our five-house example, slope 7.6 means "+\\$7,600 per 100 sqft," computed directly from Sxy=1900 and Sxx=250, no search required. It is fast, it is simple, and it is the baseline every fancier model has to beat. Move to something else when the residual plot curves (the real shape is not a straight line), when facts clearly work together, or when the answer has to stay inside fixed limits — like a probability between 0 and 1, which a straight line cannot respect.`,
      `**The trap that catches people: when two facts move together, their weights stop being trustworthy — but the predictions still look fine, so nothing warns you.**\n\nIf size and total rooms almost always rise together, OLS splits the credit between them however it likes, and a different batch of houses splits it differently. The two weights wobble, but their combined effect stays steady — so the predictions look healthy. That is why "this weight is near zero, let us drop the fact" is dangerous: the weight may be small only because its twin took the credit. Add Ridge (a small penalty) before you trust any list of which facts matter.`,
      `**The one check to run every time: plot the misses against the predictions.**\n\nIf the misses scatter evenly around zero, the straight line fits. If they form a U or any clear pattern, the shape is wrong — and a curved plot with R² = 0.95 is worse than a messy one with R² = 0.60, because now you are confidently wrong. If the misses fan out wider as predictions grow, the errors get bigger for pricier houses; the predictions can still be fine, but any confidence range you quote is off. R² hides all of this. The plot of the misses shows it.`,
      `**Split the assumptions into two piles — predicting well needs less than trusting the weights.**\n\nTo *predict* you mainly need a genuinely linear relationship and no near-duplicate features. To also *trust the standard errors, p-values, and intervals*, you additionally need errors with zero mean given the features (exogeneity), equal spread (homoscedasticity), and independence (no autocorrelation). Heteroscedasticity is the classic gotcha: it leaves your weights unbiased but makes their uncertainty wrong, so predictions stay fine while every confidence interval quietly lies. Fix with robust standard errors or a log transform.`,
      `**Know the difference between leverage and influence — and that one row can steer the whole model.**\n\nLeverage is a point with an extreme *feature* value (it has the potential to swing the line); influence is when it actually does (extreme feature value *and* a target that fights the trend). Add one 8,000 sqft house priced at \\$300k to our five-house fit and the slope collapses from 7.6 to about 0.89 — an 88% drop from a single added row; Cook's distance is the number that would flag exactly that row. And this is what the inference layer buys you: on the original five houses, SE(slope)≈0.462, t≈16.4, giving a 95% confidence interval of [6.13, 9.07] — "+\\$76/sqft, 95% sure it's \\$61–\\$91/sqft" instead of a bare "\\$76." OLS is the natural tool because Gauss-Markov says it is BLUE — the minimum-variance unbiased linear estimator — when the assumptions hold. (scikit-learn gives weights only; use statsmodels for p-values and intervals.)`,
      `**Match the error metric to the question, and don't compute the normal equation literally.**\n\nOn our five houses: MAE = \\$4,800 (average dollar miss, robust, readable); RMSE = √32 ≈ \\$5,657 (squares first, so it punishes the two \\$8k misses harder than the two \\$4k ones — quote it when large errors are costly); MAPE ≈ 1.78% (percentage error, travels across scales but explodes near zero); R² = 0.989 (unitless fraction of variance explained). On implementation: nobody careful inverts XᵀX directly — squaring the condition number is numerically dangerous — so real solvers (scikit-learn included) use QR or SVD for the same answer with far more stability on correlated or badly scaled features.`,
    ],
    interactivePrompt: `Before you touch the controls: if you add a feature that is almost a perfect copy of one you already have, do you expect the model's predictions to get worse, stay about the same, or get better?`,
    checkQuestions: [
      {
        q: `In OLS, why do we square each miss before adding them up, instead of just adding the raw misses?`,
        options: [
          `\`A) Raw misses cancel — a too-high guess and a too-low one add to near zero, hiding bad weights. Squaring drops the sign so misses never cancel, and it weights big misses far more.\``,
          `\`B) Squaring turns the model non-linear, letting a straight-line fit bend around genuinely curved data instead of staying restricted to purely straight relationships between variables.\``,
          `\`C) It is mostly tradition — averaging the absolute values of the misses would land on the exact same optimal weights, just costing a little more arithmetic to work through.\``,
          `\`D) Squaring converts the error back into the target's real units, dollars rather than dollars-squared, so the reported loss reads as a plain average price miss.\``,
        ],
        answer: `A`,
      },
      {
        q: `Two of your features have correlation 0.99. What happens to the OLS weights, and how do Ridge and Lasso differ here?`,
        options: [
          `\`A) The weights are only mildly inflated but stay reliable — correlation causes real trouble only once it hits exactly 1.0. Ridge and Lasso both shrink them, Lasso just harder.\``,
          `\`B) OLS cannot run at all because the math turns singular; Ridge and Lasso both repair it and, for correlated features, hand back identical weight values.\``,
          `\`C) The weights turn shaky — a small data change swings them and can flip signs, while predictions barely move. Ridge shrinks both steadily; Lasso zeros one at random.\``,
          `\`D) Both OLS and Ridge quietly drop one of the two features to kill the redundancy; the only difference is which rule each uses to pick which one to drop.\``,
        ],
        answer: `C`,
      },
      {
        q: `Your model shows R² = 0.95, but the misses make a clear U-shape when plotted against the predictions. What does that tell you?`,
        options: [
          `\`A) It is just random noise — with R² this high the misses are bound to wander a little on their own, and there is nothing more you need to do here.\``,
          `\`B) The straight line is the wrong shape; a high R² can't catch that, since it only measures variance explained. Add curve terms, then re-check.\``,
          `\`C) It points to a few outliers at the extremes stretching the error; clip the target's top and bottom and both R² and the miss pattern settle right down.\``,
          `\`D) It means the errors run in time order, so switch to a dedicated time-series model even though the rows here are not actually ordered by time at all.\``,
        ],
        answer: `B`,
      },
      {
        q: `You add a brand-new feature that is really just random noise, and R² ticks up a little. Select the two true statements about what is happening.`,
        options: [
          `\`A) Plain R² almost always creeps up when a feature is added, even a useless one, because the model can always fit a sliver more of the training noise.\``,
          `\`B) Adjusted R² charges a fee per feature added to the model, so a genuinely useless feature makes adjusted R² fall even while plain R² rises.\``,
          `\`C) Extra random features act as a mild regulariser here, smoothing the fitted line and helping the model generalise better to houses it has not seen.\``,
          `\`D) The noise feature only fools plain R² once its scale is left unstandardised; scaling it to match the others makes plain R² fall along with adjusted R².\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Your residual plot fans out — tight errors for cheap houses, wide errors for expensive ones (heteroscedasticity). What is the real consequence?`,
        options: [
          `\`A) The weights themselves turn biased and point the wrong way, so predictions run systematically too high or too low and can no longer be trusted at all.\``,
          `\`B) Weights stay unbiased and predictions are fine, but the standard errors and confidence intervals turn unreliable. Fix with robust errors.\``,
          `\`C) Nothing meaningful — fanning residuals are a plotting artifact of using predictions as the x-axis, and switching to a single raw feature makes the fan vanish.\``,
          `\`D) It proves the underlying relationship is non-linear, so the only real remedy is to keep adding polynomial terms until the visible fan finally closes up.\``,
        ],
        answer: `B`,
      },
      {
        q: `An interviewer asks: "One data point has an extreme size value AND a price that fights the overall trend. What is it, and how would you catch it?"`,
        options: [
          `\`A) It is a leverage point but not an influential one, since leverage is defined purely from the target's value and never from the feature's position at all.\``,
          `\`B) It is simple label noise, so the fix is to average it together with its nearest neighbours before fitting, diluting its pull on the line's slope.\``,
          `\`C) It is an influential point — extreme leverage plus a trend-opposing target, so it swings the fitted line. Cook's distance flags it by weight-shift-if-deleted.\``,
          `\`D) It is a pure multicollinearity symptom, caught with the variance inflation factor, and cured by dropping one of a pair of correlated features entirely.\``,
        ],
        answer: `C`,
      },
      {
        q: `Why is OLS considered special under its assumptions, and what does the textbook formula θ̂ = (XᵀX)⁻¹Xᵀy hide about real solvers?`,
        options: [
          `\`A) It is special because it minimises absolute error, which is why it resists outliers; real solvers compute the inverse of XᵀX directly since that is fastest.\``,
          `\`B) Gauss-Markov: OLS is BLUE (minimum variance among unbiased linear estimators) when assumptions hold. Real solvers avoid inverting XᵀX and use QR or SVD.\``,
          `\`C) It is special only for being fast to compute — there is no real optimality theorem behind it, and the textbook formula is exactly what production code runs.\``,
          `\`D) The theorem guaranteeing its optimality is really the central limit theorem, and the formula turns unstable only once row count exceeds column count.\``,
        ],
        answer: `B`,
      },
      {
        q: `In the five-house example, Sxy = 1900 and Sxx = 250, giving slope = Sxy/Sxx = 7.6. What do Sxy and Sxx actually measure?`,
        options: [
          `\`A) Sxy measures how strongly size and price move together; Sxx measures how spread out size alone is. Their ratio is the slope that minimises squared error.\``,
          `\`B) Sxy is the total price of all five houses added up, and Sxx is the total size; dividing these grand totals is what the normal equation always computes.\``,
          `\`C) Sxy and Sxx are just other names for R² and adjusted R², so their ratio directly reports the fraction of variance the model explains, not a slope.\``,
          `\`D) Sxx is the lazy mean-model's own squared error, and Sxy is the trained model's residual sum of squares, so the ratio is really R² under a new name.\``,
        ],
        answer: `A`,
      },
      {
        q: `Adding one extreme house (8,000 sqft, sold for \\$300k) to the five-house fit drops the slope from 7.6 to about 0.89 — an 88% swing. Select the two true statements about this.`,
        options: [
          `\`A) The added house has high leverage (size 80 sits far past the other five) and turns out to be influential too, since its price fights the fitted trend.\``,
          `\`B) Cook's distance is built to catch exactly this: it measures how much every weight would move if that one house were deleted from the fit.\``,
          `\`C) The slope only changed because R² happened to drop below zero once the sixth house was added, which is what actually forces OLS to refit the line.\``,
          `\`D) This kind of swing is impossible in ordinary least squares by construction, so a slope change this large always signals a bug in the computation itself.\``,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `Least squares picks the weights that make the total squared miss smallest, and for a straight line one formula solves for them in a single step — the same trick Gauss used to find a lost planet. Judge the fit with R² (how much you beat the lazy "always guess the average" model), and switch to adjusted R² once you start adding features. Never trust a single weight when two facts move together, and always plot the misses — because R² cannot see a wrong shape, but the misses can.`,
    recap: [
      "**OLS = weights that minimise total squared miss.** Squaring: signs don't cancel, big misses dominate, loss is a smooth bowl.",
      "**One-step solve:** θ̂ = (XᵀX)⁻¹Xᵀy → for one feature, slope = Sxy/Sxx = 1900/250 = **7.6**, intercept = ȳ−slope·x̄ = **128** (5-house example).",
      "**R²** = fraction of the lazy mean-model's error you cleared → 1−160/14,600 = **0.989**; **adjusted R²** (0.985) charges a fee per feature (junk features never lower plain R²).",
      "**Always plot the misses vs predictions.** Our five residuals (−4,+8,0,−8,+4) scatter with no pattern — that's what a genuine linear fit looks like; a U-pattern says wrong shape, and R² can't see it.",
      "**Leverage vs influence:** one added extreme point (8,000 sqft, \\$300k) collapsed slope 7.6→0.89, an 88% swing — Cook's distance flags exactly this.",
      "**Inference layer:** SE(slope)≈0.462, t≈16.4, 95% CI [6.13, 9.07] — from MSE_resid=SSE/(n−2) and SE=√(MSE_resid/Sxx).",
      "**Two assumption piles:** predict well (linearity, no near-duplicate features) vs trust the weights (exogeneity, homoscedasticity, independence). Heteroscedasticity → weights unbiased but standard errors lie.",
      "**Real solvers use QR/SVD, not literal (XᵀX)⁻¹** — inverting squares the numerical sensitivity.",
    ],
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
    summary: `The linear regression module ended by picking the right yardstick for predicting a *number* — MAE, RMSE, R². But not every prediction is a number. Here is a question doctors have asked for a very long time: will this patient have a heart attack in the next ten years? You cannot answer that honestly with a flat yes or no — nobody knows the future. What you *can* give is a **probability**: this patient has a 12% chance. That is the real job. It is a **classification** problem — the outcome is one of two classes, heart attack or not — but we do not want a bare label, we want a number between 0 and 1 we can trust. Logistic regression is the tool that has quietly done this job for medicine, banking, and half the internet for decades. Let me show you how it pulls it off.

There is a nice bit of history hiding in the name. Almost two hundred years ago a mathematician named Verhulst was studying how populations grow — not in a straight line, but slow at first, then fast, then flattening out as food and space run low. He drew that S-shaped curve and called it the **logistic** curve. Decades later people noticed the very same S-curve is perfect for a completely different task: taking any number and gently squashing it into a probability between 0 and 1. That borrowed curve is the engine we are about to build.

---

**The setup.**

Start with what we already know how to build: a plain linear equation, w·x + b. Feed in the patient's numbers — age, blood pressure, cholesterol — and out comes a single number. But here is the snag. That number lives on the whole number line: it could be −4, or 3000. A linear equation will happily hand you 1.4 or −0.3, and those are nonsense as probabilities. So the one question that *defines* logistic regression is this: how do we bend the wide-open output of a linear equation down into the (0, 1) range of a probability?

---

**Building the bridge.**

The trick uses a pair of functions that undo each other. You already know one such pair: eˣ and its inverse, the natural log. eˣ takes any number and gives back a positive one — its output lives in (0, ∞). The natural log runs it backwards: hand it a positive number, it gives back any number at all. From that pair we build a second pair — the **logit** and the **sigmoid** — which also undo each other. The logit takes a probability in (0, 1) and stretches it out across the whole number line. The sigmoid, $σ(z) = 1/(1 + e^{-z})$, does the reverse: it takes any number and squashes it into (0, 1). That squash is exactly the bend we were hunting for — and yes, the sigmoid is the same S-curve Verhulst drew.

Now the move that makes everything click. A linear equation outputs a number on the whole line. A logit is also a number on the whole line. So instead of forcing the linear equation to spit out a probability directly, we let it predict the **logit**, then run that through the sigmoid to land on a clean probability. The linear part does what it is naturally good at; the sigmoid handles the bending.

[FIGURE: sigmoid_squash]

Make this concrete with numbers you can check by hand. Suppose the model has already been fit — trained by minimizing the loss we're about to define, via gradient descent, the same way any model learns its weights — and it has settled on a single feature x (a patient's cholesterol level, standardized so 0 is average), with weight w = 1.4 and bias b = −0.2. Patient 1 has x = 0.5. The linear part gives the logit: z = w·x + b = 1.4×0.5 − 0.2 = 0.7 − 0.2 = **0.5**. Run that through the sigmoid: σ(0.5) = 1/(1+e⁻⁰·⁵) = 1/(1+0.6065) = 1/1.6065 ≈ **0.622**. So this patient's predicted probability of a heart attack is about 62.2%. Patient 2 has x = −1.0: z = 1.4×(−1) − 0.2 = **−1.6**, and σ(−1.6) = 1/(1+e¹·⁶) = 1/(1+4.953) ≈ **0.168** — a 16.8% predicted risk. Same weights, same formula, two very different numbers — because the logit moved from 0.5 to −1.6.

---

**But what is a logit, really?**

Here is the part most courses rush past, and it is the heart of the whole thing. A logit is the **log of the odds**.

Odds are just a way of comparing the two outcomes: the chance of the event divided by the chance of no event. Take Patient 1's own probability, 0.622: the odds are 0.622 / (1−0.622) = 0.622/0.378 ≈ **1.65** — "about 1.65 to 1." Odds have an annoying lopsidedness, though. A probability of 0.99 gives odds of 99. Its mirror image, a probability of 0.01, gives odds of 0.01. Same distance from the middle, yet one number is 99 and the other a tiny sliver — you cannot line them up on a fair scale.

Wrapping the odds in a log fixes the lopsidedness at once. log(99) ≈ +4.6 and log(0.01) ≈ −4.6 — now they are clean mirror images around zero. That log-of-odds is the **logit**, and it is exactly the quantity our linear equation predicts: check it against Patient 1 — log(1.65) ≈ 0.5, matching the z = 0.5 computed above exactly, because that's what "logit" means. So the full pipeline is: linear equation → logit (log-odds) → sigmoid → probability.

And this hands us something lovely: one weight, read three ways — and you can watch all three happen at once. Give Patient 1 one more unit of x, from 0.5 to 1.5, everything else fixed. The logit goes up by exactly w = 1.4 — a clean, straight step, from 0.5 to 1.9. The odds get multiplied by $e^{w}$ = e¹·⁴ ≈ **4.055**: recompute directly at x=1.5, σ(1.9) = 1/(1+e⁻¹·⁹) ≈ **0.870**, so the new odds are 0.870/0.130 ≈ 6.69 — and 6.69/1.65 ≈ 4.05, matching e^1.4 almost exactly (the small gap is just rounding). And the probability itself moved from 0.622 to 0.870 — a jump of 0.248, far more than the same one-unit step would move a probability already near 0.99 or 0.01. One weight, three honest stories: +1.4 to the logit, ×4.05 to the odds, and a curved, context-dependent move in probability.

---

**The second half: what loss do we train it with?**

Reach for the obvious loss — mean squared error, the one linear regression uses — and watch it fail. Bring in two more patients, scored with the same w=1.4, b=−0.2, both of whom truly had a heart attack (y=1). Patient 3 has x=2.0: z=1.4×2−0.2=2.6, σ(2.6)≈**0.931**. The model was basically right, and the squared error shows it: (0.931−1)² ≈ **0.005** — tiny. Patient 4 has x=−2.0: z=1.4×(−2)−0.2=−3.0, σ(−3.0)≈**0.047**. The model insisted this person was low-risk, about someone who was not — confidently, badly wrong. Yet the squared error is only (0.047−1)² ≈ **0.908**. Push the prediction even further wrong, down to 0.0001, and MSE barely moves at all — (0.0001−1)² ≈ 0.9998, essentially the same number. MSE has a hard ceiling at 1 no matter how confidently wrong the model gets.

That is the whole problem. A loss is the *cost we attach to being wrong* — it is how we tell the model how badly it messed up. MSE tells the model that a confident disaster (0.047, or 0.0001, when the truth is 1) costs about the same as any other bad miss. So the model has no reason to fix its worst mistakes: the loss never screams past a certain point. The signal is too flat to be any use.

**Log loss** (also called cross-entropy) fixes this by making the cost blow up as a confident prediction turns out wrong, with no ceiling at all:

$L = -[\\,y\\log(\\hat{y}) + (1-y)\\log(1-\\hat{y})\\,]$

Because y is 0 or 1, only one of the two terms is ever active. For Patient 3 (y=1) the loss is just $-\\log(\\hat{y})$ = −log(0.931) ≈ **0.07** — a gentle cost for a basically-correct call. For Patient 4, −log(0.047) ≈ **3.05** — over 40× larger, for a prediction that was only about 14× further from the truth in raw probability terms (Patient 3 missed the truth by 1−0.931=0.069, Patient 4 by 1−0.047=0.953; 0.953/0.069 ≈ 13.8). And unlike MSE, log loss keeps climbing as the prediction gets worse: at 0.0001 it would be −log(0.0001) ≈ **9.21**, still three times Patient 4's cost, with no ceiling in sight. Log loss punishes confident wrongness without any ceiling, which is exactly the message the model needs to hear. That is why we train classification with log loss, not MSE.

---

**Under the hood (the deeper why).**

There is a cleaner reason log loss wins, and you can see it in the gradient. Work out how log loss changes as you nudge the logit z, and the messy sigmoid-slope term cancels out perfectly, leaving just $\\partial L/\\partial z = \\hat{y} - y$ — the plain prediction error. Check it on Patient 4: ŷ−y = 0.047−1 = **−0.953** — nearly the maximum possible gradient magnitude, exactly when the model most needs correcting. MSE-with-a-sigmoid instead leaves behind an extra $σ(z)(1-σ(z))$ factor: for Patient 4 that's 0.047×0.953 ≈ **0.045**, so the true MSE gradient $2(\hat{y}-y)σ(z)(1-σ(z))$ works out to ≈**0.086** — the gradient shrinks to about 9% of log loss's, precisely when the model is most confident and most wrong, so it barely learns from its worst mistakes. Log loss keeps a full-strength gradient no matter how wrong the model is.

Two failure modes are worth knowing. First, **perfect separation**: if some feature splits the two classes cleanly in the training data, the model can keep making its weights bigger to push every prediction toward a hard 0 or 1, and the weights run off toward infinity — training never settles (watch for exploding weights or a loss that turns into NaN). A small L2 penalty caps the weights and brings back a finite answer. Second, logistic regression tends to come out **well-calibrated when the model is correctly specified**: because it is trained to give high probability to what actually happened, a predicted 0.7 often really does mean about 70% in reality — something trees, SVMs, and boosting do not give you for free. But "well-calibrated" is a tendency, not a guarantee: heavy regularisation, class imbalance, a mis-specified model, or a shift between training and serving data can all break it, so you still verify calibration rather than assume it.

And it stretches past two classes: swap the sigmoid for the **softmax**, which turns a whole set of logits into probabilities that add up to 1, and train it with the same log-loss idea. The boundary it draws stays straight — a line in 2D, a flat plane in higher dimensions — so to bend it you must add curved or interaction features yourself. One practical habit: because the L2 penalty judges weights by size, standardise your features first, or a feature measured in the millions gets penalised on a completely different scale from one measured in single digits.

---

**Reading the weights the way a statistician does: odds ratios.**

We said a one-unit bump in a feature multiplies the odds by $e^{w}$. That number, $e^{w}$, is the **odds ratio**, and it is how logistic regression coefficients get reported in medicine and credit — "smokers have 2.3× the odds." Our own model reports it too: e^1.4 ≈ 4.05, so "one standard deviation of cholesterol multiplies the odds of a heart attack by about 4×" is the plain-English readout of w=1.4. Just like linear regression, each coefficient carries a **standard error**, so you can put a **confidence interval** around the odds ratio and a **p-value** on whether it differs from 1 (an odds ratio of 1 means "no effect"). This is the inference layer for classification. And the same tooling split applies: scikit-learn hands you the coefficients but not p-values or intervals — for those you use statsmodels' Logit on an unpenalised fit.

---

**The threshold is a business decision, not 0.5.**

Logistic regression's real output is a *probability*. Turning that probability into an action — flag this transaction, approve this loan — needs a **threshold**, and 0.5 is almost never the right one. Recall Patient 4: predicted probability 0.047, and yet y=1 — a real heart attack. At the default 0.5 threshold, this patient is called "low risk" and sent home: a **false negative**, and in this domain a costly one. The right threshold comes from the *cost of each mistake*. In fraud you can only review, say, 500 alerts a day, so you set the threshold to fill that queue with the highest-risk cases (a precision@K problem). In cancer or cardiac screening a missed case like Patient 4's is far worse than a false alarm, so you deliberately drop the threshold — flagging anyone above, say, 0.03 instead of 0.5 — to buy recall, even though that means more false alarms among the genuinely low-risk patients. In lending the costs are literally dollars. Separate the two steps cleanly: the model estimates probability, and *you* choose the decision threshold from the business costs.

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
      `**What logistic regression really is: a linear equation that predicts the log-odds, and a sigmoid that turns that into a probability.**\n\nUse it as your first model for any yes/no question where you want a probability you can trust, not just a label — fraud, churn, default, click-through. Its coefficients read cleanly: with w=1.4, b=−0.2, a patient at x=0.5 gets logit z=0.5 and probability σ(0.5)≈0.622; nudge x up by one unit and the logit rises by exactly 1.4 while the odds multiply by e^1.4≈4.05. It is fast, interpretable, and — uniquely among the common classifiers — calibrated out of the box. Reach for something heavier only when the boundary is clearly non-linear or the features interact in ways a straight line cannot capture.`,
      `**The trap that stops the model learning: training with MSE instead of log loss.**\n\nMSE caps the penalty for a confident wrong answer at around 1 — a prediction of 0.047 against a true label of 1 costs only ≈0.908, and pushing it further to 0.0001 barely moves that to ≈0.9998 — so the model shrugs off its worst mistakes; its gradient ($2(\hat y-y)σ(z)(1−σ(z)) ≈ 0.086$ in that case, versus log loss's ≈0.953) is only about 9% as large, precisely when the prediction is most confidently wrong, so it barely updates. Log loss on the same case costs ≈3.05, climbing toward infinity as the prediction gets worse, with a gradient (ŷ−y ≈ −0.953) that stays full-strength. Always train classification with cross-entropy. Watch too for perfect separation: a feature that splits the classes cleanly drives the weights toward infinity — a little L2 (in scikit-learn, a lower C) reins them back in.`,
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
          `\`A) A linear output isn't bounded — 1.4 or −0.3 make no sense as probabilities. Logistic regression predicts the log-odds, then squashes it via sigmoid.\``,
          `\`B) A linear output is always positive and can climb above 1 but never fall below 0; logistic regression just divides by the largest output seen so far to rescale it.\``,
          `\`C) A linear equation cannot capture how features interact, so the output is too plain to be a probability; the sigmoid's real job is adding those missing interaction terms.\``,
          `\`D) The only real issue is sign, since linear outputs can go negative; logistic regression takes the absolute value of the output and then simply caps it at one.\``,
        ],
        answer: `A`,
      },
      {
        q: `In a trained logistic regression, feature x₁ has weight w₁ = 0.7. If x₁ increases by one unit while everything else is held fixed, what happens?`,
        options: [
          `\`A) The predicted probability rises by exactly 0.7 — the same fixed jump every time, no matter what the starting probability happened to be beforehand.\``,
          `\`B) The log-odds rises by 0.7, multiplying the odds by e^0.7≈2.0; probability moves in a curve — a lot near the middle, little near 0 or 1.\``,
          `\`C) The odds rise by 0.7 and the probability rises by e^0.7, and both of these change in a perfectly straight line as the feature keeps climbing.\``,
          `\`D) Nothing you can actually read off it — unlike linear regression, logistic regression weights carry no meaning tied to any single feature at all.\``,
        ],
        answer: `B`,
      },
      {
        q: `For a sample whose true label is 1, the model predicts 0.0001 — confidently wrong. Why is log loss (cross-entropy) a better training signal than MSE in this case?`,
        options: [
          `\`A) MSE and log loss hand out roughly the same penalty here, so the only real reason to prefer log loss is that it is a little faster to compute in practice.\``,
          `\`B) MSE actually gives the larger penalty in this case, but log loss still wins purely because it produces a smoother, nicer-shaped curve to optimise over.\``,
          `\`C) MSE's squared error stays near 1 even for this disaster and its gradient nearly vanishes right here; log loss sends cost toward infinity and keeps a live gradient.\``,
          `\`D) MSE simply cannot be paired with a sigmoid output at all, mathematically incompatible, so log loss is the only loss a sigmoid model can ever train under.\``,
        ],
        answer: `C`,
      },
      {
        q: `While training on real patient data, the weights keep growing and the loss eventually becomes NaN. It turns out one feature separates the sick patients from the healthy ones perfectly in the training set. What is happening, and what is the fix?`,
        options: [
          `\`A) The features simply are not scaled, so gradient descent keeps overshooting the minimum; a smaller learning rate alone settles the weights and clears the NaN.\``,
          `\`B) Perfect separability lets the model cut loss further by growing weights toward hard 0/1 forever, so they diverge; a small L2 penalty caps them.\``,
          `\`C) A NaN loss means the label column has missing values on that one separating feature; filling in those missing labels alone stops the run from diverging.\``,
          `\`D) Perfect separation means the model has essentially already solved the task, so the NaN is just a harmless display glitch you can safely ignore and keep the model.\``,
        ],
        answer: `B`,
      },
      {
        q: `Only 1% of your transactions are fraud. Your logistic model reports 99% accuracy and 0.95 ROC-AUC, but the fraud team says it is useless. Select the two true statements about what to change.`,
        options: [
          `\`A) Under 1% imbalance, accuracy is meaningless — predicting "not fraud" always scores 99% — so it tells you nothing about actual fraud-catching ability here.\``,
          `\`B) Weight the rare class with class_weight='balanced' and set the decision threshold deliberately, judging with PR-AUC rather than trusting ROC-AUC or the default 0.5 cutoff.\``,
          `\`C) ROC-AUC of 0.95 alone already proves the model is production-ready, so the fraud team's complaint just reflects a misreading of the dashboard, not a real gap.\``,
          `\`D) Swap cross-entropy for MSE so the rare class gets weighted more heavily during training, which directly fixes both the accuracy and ROC-AUC readings.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You want L1-penalised logistic regression in scikit-learn and decide to make the penalty stronger. Which change is correct, and what must you check about the solver?`,
        options: [
          `\`A) Increase C to strengthen the penalty, and trust that any default solver handles L1 fine since penalty type is independent of which solver is chosen.\``,
          `\`B) Decrease C to strengthen the penalty (C=1/λ), and use a solver supporting L1, such as saga — the default lbfgs only handles L2.\``,
          `\`C) Increase C to strengthen the penalty, but switch to lbfgs, which is claimed to be the only solver supporting both the L1 penalty and Elastic Net together.\``,
          `\`D) The C value has no effect on penalty strength at all, only iteration count, so strengthen the penalty by raising max_iter with any solver you like.\``,
        ],
        answer: `B`,
      },
      {
        q: `An interviewer says: "Logistic regression only draws a straight decision boundary. How would you get it to separate two classes that are split by a curve?"`,
        options: [
          `\`A) You can't — a curved boundary is fundamentally impossible for logistic regression, so abandon it entirely and move straight to a neural network or kernel SVM.\``,
          `\`B) Switch the loss from cross-entropy to hinge loss, which is what actually bends the boundary into a curve while leaving the raw input features untouched.\``,
          `\`C) The boundary is linear only in the given feature space, so engineer richer terms — polynomial, interaction, binned — to let the same model curve.\``,
          `\`D) Raise the classification threshold above 0.5, which by itself reshapes the boundary from a straight line into a curve tracking the class split.\``,
        ],
        answer: `C`,
      },
      {
        q: `Patient 3 (x=2.0) has predicted probability σ(2.6)≈0.931 and true label y=1. Patient 4 (x=−2.0) has predicted probability σ(−3.0)≈0.047 and true label y=1. Select the two true statements comparing their loss.`,
        options: [
          `\`A) Patient 3's log loss ≈0.07 and squared error ≈0.005 are both small, since the model was basically correct about this patient.\``,
          `\`B) Patient 4's squared error (≈0.908) is barely worse than a maximally wrong prediction of 0.0001 would give (≈0.9998), because MSE has a hard ceiling near 1.\``,
          `\`C) Patient 4's log loss (≈3.05) is smaller than Patient 3's (≈0.07), since a confidently wrong prediction is penalised less than a confidently right one under cross-entropy.\``,
          `\`D) Both patients get the exact same log loss regardless of their predicted probability, since log loss only depends on the true label y, never on ŷ.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `A logit of z=0.5 gives odds of about 1.65 (Patient 1, w=1.4). If x rises from 0.5 to 1.5, what happens to the odds, and how does this connect to the logit?`,
        options: [
          `\`A) The odds multiply by e^1.4≈4.05, since a one-unit rise in x always adds exactly w to the logit, and the logit is exactly the log-odds.\``,
          `\`B) The odds simply add 1.4 to their previous value of 1.65, landing at about 3.05, the same additive step the logit takes.\``,
          `\`C) The odds are undefined once probability exceeds 0.8, so no further increase in x can be meaningfully converted into an odds ratio at all.\``,
          `\`D) The odds stay at 1.65 regardless of x, since odds are a property of the model's weight alone and never depend on the specific patient's feature value.\``,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Logistic regression lets a linear equation predict the log-odds, then a sigmoid turns that into a probability — so one weight reads three ways: it adds to the log-odds, multiplies the odds by e^w, and moves the probability non-linearly. Train it with log loss, not MSE: log loss makes a confident wrong answer cost enormously and keeps the gradient alive, while MSE goes flat exactly when the model most needs to learn.`,
    recap: [
      "**Logistic regression = linear equation predicts the log-odds, sigmoid turns it into a probability** in (0,1). Example: w=1.4,b=−0.2, x=0.5 → z=0.5 → σ(0.5)≈**0.622**.",
      "**One weight, three readings:** +w to the log-odds, ×e^w to the odds (e^1.4≈**4.05**), a curved move in probability (0.622→0.870 for a +1 step).",
      "**Train with log loss, not MSE.** On a confidently-wrong case (ŷ=0.047, y=1): MSE≈0.908 (capped near 1), log loss≈**3.05** (unbounded) — and the gradient gap (0.086 vs 0.953) is why MSE stalls.",
      "**Output is a probability; threshold is a separate business call.** A 0.047-probability true positive is a false negative at threshold 0.5 — under imbalance, 0.5 and accuracy both betray you.",
      "**Knobs:** C = inverse regularisation (small C = strong penalty); penalty must match the solver.",
      "**Boundary is linear in feature space** — engineer features to bend it; read coefficients as odds ratios.",
    ],
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

To see exactly how the fix works, don't stay in the abstract — go back to the five houses from the linear regression module. There, with size (hundreds of sqft) as the only feature, OLS solved slope = Sxy/Sxx = 1900/250 = **7.6** in one step, with no penalty attached at all: plain least squares has no reason to hold back, and with one feature and five houses there isn't even room for it to misbehave. The trouble starts once you're fitting a hundred features to two hundred houses instead of one feature to five — now there is enormous spare freedom, and least squares will use every bit of it to bend through noise. Watch what happens to that same slope of 7.6 once a penalty is added below; the arithmetic is exact, not illustrative.

---

**Why it overfits, and the one-line fix.**

Least squares has exactly one instruction: make the training error as small as possible, by any means. Nothing tells it to hold back. Give it 100 knobs to fit 200 points and it will use the spare freedom to bend through the noise — a giant positive weight here cancelled by a giant negative one there, contortions that fit these houses and no others.

So we change the instruction. We add a second piece to the loss: a penalty that grows with the size of the weights. The new loss is "training error **plus** lambda times the size of the weights," where lambda is a dial for how much we care.

Now watch the mechanism, because this is the whole thing. The model is trained by gradient descent, which does one job — nudge the weights, step by step, in whatever direction makes the loss smaller. The moment those big weights start adding a big number to the loss, gradient descent sees that cost and does the only thing it knows: it pushes the weights back down to bring the loss down again. Small weights are not a rule we impose from outside. They are what the model settles on by itself, once big weights start costing it. That is regularisation in one sentence: make big weights expensive, and gradient descent keeps them small.

---

**Two ways to measure "size", two different results.**

There are two honest ways to measure how big the weights are, and the choice matters more than you would guess — and now we can measure exactly how much, reusing the five-house slope.

Square each weight and add them up — that is **L2**, also called **Ridge**. For one feature, mean-centered exactly the way OLS was derived, Ridge's own one-step formula is slope = Sxy / (Sxx + λ) — the same Sxy/Sxx from OLS, just with λ added into the denominator before dividing. At λ=0 that's 1900/250=7.6, the untouched OLS slope, as it must be. Push λ=250 (equal to Sxx itself) and the slope becomes 1900/(250+250) = 1900/500 = **3.8** — exactly half, because doubling the denominator exactly halves the ratio. Push harder, λ=1900: 1900/(250+1900) = 1900/2150 ≈ **0.884** — small, but never zero, no matter how large λ gets. That is the geometric picture made numeric: Ridge shrinks the weight smoothly toward zero, but Sxy/(Sxx+λ) can only approach zero in the limit, never land on it for any finite λ.

Add up the plain sizes instead (ignoring sign) — that is **L1**, also called **Lasso**. Lasso's one-step formula for a single centered feature is a soft threshold: slope = sign(Sxy) × max(|Sxy| − λ/2, 0) / Sxx — subtract λ/2 straight off the co-movement sum Sxy before dividing, and clamp at zero if that goes negative. At λ=0 this also reduces to 1900/250=7.6, matching OLS exactly. At λ=500: max(1900−250,0)/250 = 1650/250 = **6.6** — a smaller absolute drop than Ridge's proportional shrink at a comparable penalty. But push λ to 3800 (so λ/2=1900, exactly cancelling Sxy): max(1900−1900,0)/250 = 0/250 = **0** — exactly zero, no rounding. The feature is switched off completely, at a specific, finite, computable λ. Compare the two at their own natural stopping points: Ridge at λ=1900 still reports 0.884, a live if small weight; Lasso at λ=3800 reports a hard 0 — gone. That is the entire "diamond vs. circle" geometry from a picture, now as two numbers you can check with a calculator.

[FIGURE: l1_l2_geometry]

There is a plainer way to say why the two land differently. L1's derivative with respect to the weight is a constant ±λ — a steady force, independent of how small the weight already is — so it can walk the weight all the way to zero and stop. L2's derivative is 2λ×weight — a force that shrinks along with the weight itself — so as the weight gets small the pull gets weaker too. It slows down and stalls just short of zero, which is exactly the 0.884 that never quite becomes 0.

---

**When to use which, and the trap.**

Use **Lasso (L1)** when you believe only a handful of features truly matter and you want the model to pick them out for you. Use **Ridge (L2)** when you think many features each add a little, or when features are correlated and you want to keep them together. (A blend called **elastic net** does a bit of both.)

And one trap falls straight out of "we penalise weight size": a feature measured in dollars needs a tiny weight, while a yes/no feature needs a big one. The same penalty hits them completely unequally — the big-scale feature barely feels it, the small-scale one gets hammered. So **standardise your features first** (put them all on the same scale), or the penalty is quietly punishing features for their units instead of judging how useful they are.

---

**Correlated features made concrete: the duplicate-column trap.**

Watch the "features clearly work together" case turn into hard numbers too. Suppose the five-house data gets a duplicate column by accident — someone adds size again, unchanged, as a second feature. Now the model is weight₁×size + weight₂×size = (weight₁+weight₂)×size: only the *sum* of the two weights affects any prediction, so plain OLS has infinitely many equally good answers — weight₁=7.6,weight₂=0, or weight₁=3.8,weight₂=3.8, or weight₁=−100,weight₂=107.6 all fit the five houses identically. Least squares has no preference among them; whichever numerical solver you run will simply return one of the infinitely many ties, and a slightly different solver, or a slightly different batch of houses, can return a wildly different split — exactly the "weights wobble but predictions stay fine" warning from the collinearity section of the linear regression module.

Ridge breaks the tie in a specific, checkable way: among every (weight₁, weight₂) pair summing to 7.6, it additionally picks the one that minimises weight₁²+weight₂² — and by symmetry that is the even split, weight₁=weight₂=3.8. (Write weight₁=3.8+d, weight₂=3.8−d: the sum of squares is 2×(3.8²+d²), minimised exactly at d=0.) As λ→0⁺, Ridge doesn't merely shrink the duplicated weight — it deterministically lands on the *minimum-norm* solution among all the tied OLS answers, and for two identical columns that minimum-norm answer is always the even split.

Lasso ties in a different way. Since both weights are non-negative here, |weight₁|+|weight₂| = weight₁+weight₂ = 7.6 for every single point on that same tied line — the L1 penalty is exactly the same number, 7.6×λ, no matter how the 7.6 is divided between the two columns. So Lasso's objective genuinely cannot prefer one split over another either — but unlike Ridge's bowl-shaped penalty, its penalty is flat along the whole tied line, so there is no unique minimum to fall back on. In practice a solver (coordinate descent) breaks that flat tie arbitrarily, typically landing on a corner: weight₁=7.6, weight₂=0, or the reverse, whichever column happens to get updated first. That is the mechanism behind "which correlated feature Lasso keeps can flip from one run to the next" — it isn't a bug, it's what an unpenalised flat direction in the loss does to any greedy solver.

---

**The real tradeoff underneath: bias for variance.**

Why does shrinking weights help at all? Because it trades one kind of error for another. An unconstrained model has *low bias* (it can fit any shape) but *high variance* (it swings wildly from one training sample to the next — that's the overfitting). Adding a penalty deliberately introduces a little **bias** — the weights are pulled away from the perfect training fit — in exchange for a large drop in **variance**. Ridge's own 3.8 at λ=250, versus OLS's 7.6, makes the bias concrete: a gap of exactly 3.8 has been deliberately introduced on this one example. Five hand-picked houses can't show the variance side of the trade (that needs repeated resampling), but it is the entire justification: on a genuinely noisy, high-dimensional dataset, that same shrinkage is what keeps the fitted weight from swinging wildly between training runs. The goal is never "small weights for their own sake"; it's *lower error on unseen data*. You accept some bias because the variance you kill is worth more. That framing — regularisation buys variance reduction at the price of bias — is the one interviewers want to hear.

---

**How you actually pick lambda.**

Lambda isn't guessed; it's *tuned*. Neither 250 nor 3800 above was chosen by looking at the five houses' own training error — training error would tell you to prefer λ=0 every time, since that's where it's smallest. Instead you sweep a range of values and, for each, measure error on held-out data with **cross-validation** — a **validation curve** of error versus lambda. Too little penalty and both train and validation error show the overfit gap; too much and the model underfits and both climb. The sweet spot is the lambda that minimises validation error. scikit-learn ships this as \`RidgeCV\` and \`LassoCV\` so the search is built in. Never pick lambda by looking at training error — it always prefers zero penalty.

---

**Ridge has a one-step formula too — and it explains why it helps.**

Just like OLS, Ridge has a closed form: $θ̂ = (XᵀX + λI)⁻¹Xᵀy$. That single-feature formula, slope = Sxy/(Sxx+λ), computed above is the p=1 special case of this same matrix formula — for one feature, XᵀX is just Sxx (a 1×1 matrix), and adding λI means adding λ to that single number, exactly the +λ that shrank 7.6 down to 3.8. Notice the only change from OLS is the $+λI$ added to the diagonal before inverting. That's not cosmetic — when features are correlated, XᵀX is nearly singular and blows up on inversion (the exact source of those wild, unstable weights). The duplicate-column example above is the extreme case of this in miniature: two identical columns make XᵀX exactly singular — literally uninvertible — which is why plain OLS has infinitely many tied solutions there. Adding $λI$ lifts the diagonal and makes the matrix cleanly invertible again, and as shown above it picks out the even split as that restored solution. So Ridge literally *stabilises the inversion*, which is why it tames collinearity.

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
      `**What regularisation does: it adds a penalty on weight size to the loss, so gradient descent keeps the weights small and the model simple.**\n\nReach for it any time you have many features relative to your data, or you see a big gap between training and test performance — the classic sign of overfitting. On the five-house example, plain OLS finds slope = Sxy/Sxx = 1900/250 = 7.6 with no penalty at all; Ridge's slope = Sxy/(Sxx+λ) pulls that down to 3.8 at λ=250. Use Ridge (L2) as your default; it shrinks everything gently and handles correlated features well. Use Lasso (L1) when you suspect most features are useless and you want the model to zero them out and hand you a short list. The dial is lambda (in scikit-learn often called alpha, or C = 1/lambda for logistic regression): more penalty means a simpler model.`,
      `**The trap: Lasso's feature picks get shaky when features are correlated.**\n\nIf two features carry nearly the same information, Lasso keeps one and zeros the other — but which one it keeps can flip from one training run to the next. Duplicate the five houses' size column exactly and OLS has infinitely many tied (weight₁,weight₂) splits summing to 7.6; Ridge deterministically settles on the even split (3.8, 3.8), the minimum-norm tie-break, while Lasso's flat penalty along that same tied line has no unique minimum, so a solver arbitrarily lands on a corner like (7.6, 0). So do not read Lasso's chosen features as gospel. If the selected set changes across cross-validation folds, switch to elastic net, which blends in a little Ridge and tends to keep correlated features together instead of picking one at random.`,
      `**The habit that is not optional: standardise your features before any regularised model.**\n\nBecause the penalty judges weights purely by size, a feature on a huge scale (income in dollars) needs a tiny weight and barely gets penalised, while a 0/1 flag needs a big weight and gets hammered — even if they are equally useful. Put every feature on the same scale first (subtract the mean, divide by the standard deviation). Skip this and the penalty punishes features for their units, not their usefulness, and the whole model tilts toward the large-scale ones.`,
      `**The framing to state out loud: regularisation trades a little bias for a big drop in variance, and lambda is tuned, not guessed.**\n\nAn unconstrained model is low-bias but high-variance (it overfits); the penalty adds bias to kill variance, and the target is lower error on unseen data, not small weights for their own sake. On the five houses, Ridge's slope of 3.8 versus OLS's 7.6 is exactly that bias, 3.8 worth, deliberately introduced — bought in exchange for a variance reduction that only shows up on noisier, higher-dimensional data. Pick lambda by cross-validation — sweep values and take the one that minimises validation error (\`RidgeCV\`/\`LassoCV\`) — never by training error, which always wants zero penalty. Too little penalty overfits; too much underfits; both raise validation error.`,
      `**Ridge has a closed form that shows why it works, and the library naming is a minefield.**\n\nRidge solves $θ̂ = (XᵀX + λI)⁻¹Xᵀy$; for one feature this collapses to slope = Sxy/(Sxx+λ) = 1900/(250+λ), reaching 3.8 at λ=250 and ≈0.884 at λ=1900, but never exactly 0. The $+λI$ lifts the diagonal so a near-singular XᵀX (from correlated or duplicated features) becomes cleanly invertible — that's literally how Ridge stabilises collinearity. On naming: scikit-learn's \`Ridge\`/\`Lasso\` use \`alpha\` (bigger = more penalty), \`LogisticRegression\`/\`LinearSVC\` use \`C\` = 1/λ (smaller = more penalty), and \`ElasticNet\` uses \`alpha\` plus \`l1_ratio\` to blend L1 and L2. Also: don't regularise the intercept — center features so it stays meaningful.`,
      `**Know Lasso's hard limits and that regularisation reaches far beyond linear regression.**\n\nWith more features than samples (p > n), Lasso can select at most about n features and its picks are unstable under correlation — elastic net was designed to fix both by keeping L1 sparsity while L2 lets it exceed n features and hold correlated groups together. Lasso's own soft-threshold, slope = sign(Sxy)×max(|Sxy|−λ/2,0)/Sxx, hits exactly 0 at λ=3800 on the five-house example — the hard-zero behaviour Ridge structurally can't match. And the same idea is everywhere: the \`C\` in logistic regression and SVMs, the soft margin in SVMs, and weight decay (L2) in neural networks — add a cost on complexity so the optimiser stops chasing training noise.`,
    ],
    interactivePrompt: `Before you touch the controls: with two features that are perfectly correlated, do you expect Lasso to zero out one of them, both of them, or neither — and does Ridge behave the same way?`,
    checkQuestions: [
      {
        q: `You add a penalty on the size of the weights to the loss. Select the two true statements about why the trained weights come out smaller.`,
        options: [
          `\`A) The model is trained by gradient descent to shrink the loss, and once big weights start inflating that loss, gradient descent pushes them back down again.\``,
          `\`B) Small weights are not a rule imposed from outside; they are what the model settles on once big weights start costing it more loss than they save.\``,
          `\`C) The penalty term mathematically caps each weight at a fixed maximum value, so no single weight is ever allowed to grow past a hard limit lambda sets.\``,
          `\`D) Adding the penalty deletes the features that carry the largest weights before training even starts, leaving only small-weight features to fit.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Ridge (L2) and Lasso (L1) both shrink weights, but only Lasso drives some all the way to exactly zero. Why?`,
        options: [
          `\`A) L2 is applied before training while L1 is applied afterward, so only L1 gets a final chance to round the smallest surviving weights to exactly zero.\``,
          `\`B) L1 pushes each weight toward zero with steady force regardless of size, landing on zero; L2's push fades and stalls short.\``,
          `\`C) L2 only ever shrinks the positive weights while L1 shrinks both signs, and it is specifically those negative weights driven down to zero.\``,
          `\`D) Lasso simply runs with a much larger lambda than Ridge by default, and any penalty large enough forces weights to zero regardless of L1 or L2.\``,
        ],
        answer: `B`,
      },
      {
        q: `You fit a regularised model on features in wildly different units — income in dollars, plus a few 0/1 flags. What must you do first, and why?`,
        options: [
          `\`A) Nothing special — regularised models rescale their inputs internally, so mixed units are handled automatically and standardising would undo that.\``,
          `\`B) Drop the 0/1 flags, since binary features cannot be regularised on the same footing as continuous ones and would otherwise dominate the penalty.\``,
          `\`C) Standardise every feature to a common scale first. A dollar feature needs a tiny weight and is barely penalised while a 0/1 flag gets hammered.\``,
          `\`D) Raise lambda until the dollar-scale feature's weight shrinks to match the flags' size, balancing the penalty without ever rescaling the raw data.\``,
        ],
        answer: `C`,
      },
      {
        q: `An interviewer asks: "What is regularisation doing in bias-variance terms, and how do you choose the penalty strength?"`,
        options: [
          `\`A) It reduces bias without touching variance at all, and you choose lambda by picking whichever value gives the lowest training error you can find.\``,
          `\`B) It reduces both bias and variance simultaneously, and lambda is a fixed constant near 1.0 that essentially never needs any changing at all.\``,
          `\`C) It trades a little added bias for a large drop in variance, aiming at lower unseen-data error. Choose lambda by cross-validation.\``,
          `\`D) It increases variance to reduce bias, which is exactly why heavily regularised models overfit; lambda is set as large as possible to maximise that.\``,
        ],
        answer: `C`,
      },
      {
        q: `Ridge regression's closed form is θ̂ = (XᵀX + λI)⁻¹Xᵀy. What does the +λI term accomplish beyond shrinking weights?`,
        options: [
          `\`A) It adds a bias column to the feature matrix so the intercept gets regularised along with the other weights, the main point of Ridge.\``,
          `\`B) Correlated features leave XᵀX nearly singular and explosive to invert; λI lifts the diagonal so it inverts cleanly, stabilising collinearity itself.\``,
          `\`C) It converts the L2 penalty into an L1 penalty internally, exactly what lets Ridge drive some weights to zero for feature selection purposes.\``,
          `\`D) It rescales the features to unit variance inside the closed-form solve, removing any need to standardise data before fitting a Ridge model.\``,
        ],
        answer: `B`,
      },
      {
        q: `You have 5,000 gene features but only 200 patients (p ≫ n) and want a sparse model. Why might plain Lasso disappoint, and what fixes it?`,
        options: [
          `\`A) Lasso cannot run at all when p > n; the only option is reducing features by hand with PCA before any L1 model can even be fit here.\``,
          `\`B) Lasso overfits because L1 simply has no shrinking effect in high dimensions; switching to a much larger training set is the only real remedy.\``,
          `\`C) Lasso saturates near n≈200 features and is unstable under correlated genes. Elastic net fixes both via added L2.\``,
          `\`D) Lasso works perfectly here since p≫n is exactly the regime L1 was designed for, so nothing needs to change beyond simply raising alpha further.\``,
        ],
        answer: `C`,
      },
      {
        q: `Using the linear-regression module's own Sxy=1900, Sxx=250 (OLS slope 7.6), what happens to the fitted slope under Ridge at λ=1900 versus Lasso at λ=3800?`,
        options: [
          `\`A) Both formulas give exactly zero at these λ values, since both penalties eventually force every weight to vanish once λ exceeds Sxy.\``,
          `\`B) Neither formula changes from the unpenalised slope of 7.6, since a single-feature model with only five houses is too small for either penalty to have any effect.\``,
          `\`C) Ridge gives slope=1900/(250+1900)≈0.884, still nonzero; Lasso gives slope=max(1900−1900,0)/250=0 exactly — Ridge approaches zero, Lasso can reach it.\``,
          `\`D) Ridge gives exactly zero because λ now exceeds Sxx, while Lasso still reports 6.6 since its threshold only activates once λ passes 4000.\``,
        ],
        answer: `C`,
      },
      {
        q: `Someone accidentally adds size to the five-house model twice (weight₁ and weight₂ both multiply the identical size column). Select the two true statements about how Ridge and Lasso handle the resulting tie.`,
        options: [
          `\`A) The duplicate column has no effect on which solution OLS reaches, since least squares always ignores exact copies of an existing feature automatically.\``,
          `\`B) OLS itself has infinitely many equally-good (weight₁,weight₂) pairs summing to 7.6, since only their sum affects any prediction on this duplicated pair.\``,
          `\`C) Lasso is guaranteed to also split evenly, weight₁=weight₂=3.8, because its penalty is convex and therefore always has one unique minimiser.\``,
          `\`D) Ridge deterministically settles on the even split weight₁=weight₂=3.8, the minimum-norm solution among all the tied OLS answers.\``,
        ],
        answer: ['B', 'D'],
      },
      {
        q: `Why does Lasso's soft-threshold formula, slope=sign(Sxy)×max(|Sxy|−λ/2,0)/Sxx, need a max(...,0) clamp, while Ridge's slope=Sxy/(Sxx+λ) doesn't need one?`,
        options: [
          `\`A) The clamp is purely a numerical-stability safeguard against accumulated floating-point error during training, and has nothing to do with any genuine difference between how the L1 and L2 penalty shapes actually behave near zero.\``,
          `\`B) Ridge's own formula secretly includes the exact same clamp internally, it is simply omitted from the notation for simplicity's sake, so in practice both formulas behave identically once the weight gets close to zero.\``,
          `\`C) L1's clamp exists only because the Lasso formula is mathematically undefined for any λ value below Sxx, whereas Ridge's formula stays valid for arbitrarily large or small λ without needing any such restriction.\``,
          `\`D) L1 pulls with constant force regardless of size, so subtracting enough overshoots past zero — the clamp stops the sign flip. L2's pull weakens as the weight shrinks, approaching zero without ever needing a clamp.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Regularisation adds a penalty on weight size to the loss, so gradient descent — which only ever chases a smaller loss — keeps the weights small and the model simple. L2 (Ridge) shrinks everything smoothly; L1 (Lasso) drives some weights to exactly zero and so selects features. Always standardise first, because the penalty judges weights by size, not by usefulness.`,
    recap: [
      "**Regularisation = penalty on weight size added to the loss.** Gradient descent chases smaller loss → weights stay small, model stays simple. Five-house example: OLS slope = Sxy/Sxx = 1900/250 = **7.6**, unpenalised.",
      "**L2 (Ridge):** slope = Sxy/(Sxx+λ) → **3.8** at λ=250, ≈**0.884** at λ=1900 — shrinks smoothly, never exactly zero. **L1 (Lasso):** slope = sign(Sxy)×max(|Sxy|−λ/2,0)/Sxx → **6.6** at λ=500, exactly **0** at λ=3800 — feature selection.",
      "**Always standardise first** — the penalty judges weights by size, not usefulness.",
      "**Duplicate/correlated feature (weight₁+weight₂=7.6, tied):** Ridge deterministically splits evenly (**3.8, 3.8** — minimum-norm tie-break); Lasso's flat penalty along the tied line has no unique minimum, so a solver arbitrarily lands on a corner (**7.6, 0**) — why Lasso's picks flip across runs.",
      "**Trades a little bias for a big drop in variance;** Ridge's 3.8 vs OLS's 7.6 on the five houses is exactly that bias, 3.8 worth. λ is tuned via cross-validation, not guessed.",
      "**Ridge has a closed form** $θ̂=(XᵀX+λI)⁻¹Xᵀy$, reducing to Sxy/(Sxx+λ) for one feature — λI restores invertibility exactly where duplicate/correlated columns make XᵀX singular. Library naming (C = 1/λ) is a minefield.",
    ],
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
        q: `A model gets 99% on the training data but 75% on test. Select the two true statements about what this means and what to do.`,
        options: [
          `\`A) This is low bias but high variance — it fits training beautifully yet fails to generalise, meaning it has memorised noise rather than real structure.\``,
          `\`B) Rein it in with more data (the most direct fix), stronger regularisation, or a simpler model — adding more capacity here would only widen the gap.\``,
          `\`C) A gap this size between training and test is perfectly normal and expected, and closing it further would only add bias and hurt real performance.\``,
          `\`D) It is high bias — the model is too simple, so the correct fix is adding capacity such as a deeper model until the test number climbs to match.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `A neural net does worse at 1,000 parameters than at 100, but better at 1,000,000 than at 100. How can piling on parameters help after it first hurt?`,
        options: [
          `\`A) At 1,000 it barely has enough capacity to memorise the data, landing on a jagged fit. At 1,000,000 descent picks a smooth fit — double descent.\``,
          `\`B) The 1,000,000-parameter model quietly deletes its unused parameters during training, collapsing back into a small 100-parameter model that generalises identically.\``,
          `\`C) More parameters always lower test error given a small enough learning rate; the dip at 1,000 was an unlucky seed that re-running would smooth away entirely.\``,
          `\`D) The huge model quietly memorises the test set through its shared weights, so its low test error is really leakage rather than genuine generalisation gains.\``,
        ],
        answer: `A`,
      },
      {
        q: `You add 400 new features to a linear model. Training accuracy rises but test accuracy drops. What happened, in terms of capacity?`,
        options: [
          `\`A) Extra features never change a linear model's capacity, only training-point count does, so the drop is a numerical glitch fixed purely by regularising it.\``,
          `\`B) The 400 new features are simply all noise; deleting any feature with low correlation to the target restores test accuracy with no other change needed.\``,
          `\`C) More features means more capacity to fit arbitrary noise; with fixed data the model overfits. Fixes: regularise, cut weak features, add data.\``,
          `\`D) Adding features shrinks capacity because each one explains a smaller target share, so the real fix is adding even more features until test accuracy recovers.\``,
        ],
        answer: `C`,
      },
      {
        q: `Your model looks great in cross-validation but fails in production, and the failure isn't explained by bias or variance. What is the most likely cause?`,
        options: [
          `\`A) The model simply has high variance that cross-validation somehow missed entirely; retraining on the same data with more folds will surface and fix it.\``,
          `\`B) Distribution shift: covariate shift (P(X) moved), concept drift (P(Y|X) changed), or train-serving skew (a feature computed differently at serving time).\``,
          `\`C) The test set was too small, so the production drop is really just sampling noise that will disappear once enough production data accumulates.\``,
          `\`D) Cross-validation always overestimates production performance by a roughly fixed margin, so this gap is expected and needs no further investigation.\``,
        ],
        answer: `B`,
      },
      {
        q: `An interviewer asks you to define PAC learning and why it is "probably" and "approximately" rather than a hard guarantee.`,
        options: [
          `\`A) PAC means the model is Perfectly And Completely correct once it has seen enough data; "probably" and "approximately" refer only to the phase before convergence.\``,
          `\`B) PAC = Probably Approximately Correct: error within tolerance ε with confidence 1−δ. It's probabilistic because a random sample could always mislead any learner.\``,
          `\`C) PAC learning is a specific algorithm, like SVM or k-NN, that trains models with probabilistic weights, and it is approximate because those weights are randomised.\``,
          `\`D) PAC guarantees exact correctness with probability 1 always, and the ε and δ terms are just tuning constants controlling the learning rate during training.\``,
        ],
        answer: `B`,
      },
      {
        q: `You reduce a big network's overfitting using dropout and early stopping without removing any parameters. In capacity terms, what changed?`,
        options: [
          `\`A) Nothing changed — capacity is fixed purely by parameter count, so dropout and early stopping only speed up training without touching overfitting at all.\``,
          `\`B) Parameter count is unchanged but effective capacity dropped — dropout, early stopping, and L2 all shrink expressible structure.\``,
          `\`C) Dropout increased capacity by adding randomness, and it only appeared to help because the test set happened to match that particular injected noise.\``,
          `\`D) Early stopping physically deletes the parameters that had not yet been trained, so the true parameter count fell despite the architecture looking unchanged.\``,
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
    summary: `The last module put a precise name on a kind of failure: **variance** — a model so twitchy that swapping a handful of training rows produces a completely different fit, even though nothing about the underlying problem changed. Decision trees are about to make that failure vivid and countable, on numbers small enough to check by hand — and, one module from now, they're also the fix.

Start with the game of twenty questions. Someone picks a secret — a person, a place, a thing — and you guess it with yes/no questions. A good player never asks at random, and a good question isn't just one that splits the field in half — it's one that leaves each half as *unambiguous* as possible, ideally sorting candidates cleanly into "clearly this" and "clearly not this" rather than an even split that's still a jumble of both. That is almost exactly what a **decision tree** does with data — and a moment from now, on real numbers, half-splitting and clean-splitting will turn out to give different answers.

Here is a job where it shines and a straight-line model struggles. Say you want to flag loan applicants likely to default, using their income and their debt-to-income ratio. The real pattern is a set of rules: "if income is low *and* debt is high, risky — but a big income excuses a fair bit of debt." That is not a smooth weighted sum. It is the space of applicants carved into regions, each with its own answer. A linear model draws one line and gives up. A tree carves.

[FIGURE: tree_partition]

---

**One question at a time.**

A decision tree asks a single yes/no question, splitting everyone into two groups, then asks the next question inside each group, and so on. The whole skill is choosing the *right* question at each step. And "right" has a clear meaning: the question that leaves the two groups as **pure** as possible — each side mostly one class.

So we need a way to measure how mixed a group is. Here's a natural way to do it: grab a random person from the group and guess their class from the group's own mix — how often would that guess be wrong? Take a group that's all defaulters: you would never be wrong, so call it perfectly pure. Take a group split 50/50: you would be wrong half the time, as messy as a two-class group can get. That guessing-error idea has a name and a formula: **Gini impurity**, $1 - Σpₖ²$, where pₖ is the share of class k — it comes out to 0 for the all-defaulters group and 0.5 for the 50/50 group, matching the guessing game exactly.

---

**Watching it pick a split, on numbers you can check by hand.**

Eight loan applicants, income in thousands and debt-to-income ratio, four defaulted and four didn't: Ann (28, 0.50, default), Bob (33, 0.45, default), Cid (40, 0.55, default), Dee (44, 0.20, safe), Eve (52, 0.60, default), Fay (58, 0.15, safe), Gus (63, 0.10, safe), Hal (70, 0.05, safe). Notice Dee (low income, low debt) and Eve (high income, high debt) don't fit a clean story — that's deliberate, so no single question gets this for free. Four of eight defaulted, so the starting mix has Gini = 1 − 0.5² − 0.5² = **0.5** — as messy as a group can be.

Pause and predict: two candidate questions are on the table, "is income below 48k?" and "is debt-to-income at or above 0.35?" — both come from the standard way a tree generates candidates: sort each feature's values and try the midpoint between every adjacent pair, so 48k sits between two neighbouring incomes and 0.35 between two neighbouring debt ratios, not picked by hand. Which one do you expect splits these eight people more purely?

Try income first. Below 48k: Ann, Bob, Cid, Dee — three defaulters, one safe (Dee), so p=0.75 and Gini = 1 − 0.75² − 0.25² = **0.375**. At or above 48k: Eve, Fay, Gus, Hal — one defaulter (Eve), three safe, same arithmetic by symmetry: Gini = **0.375**. Both groups land at 0.375, so the weighted Gini after this split is 0.375 — down from 0.5, but Dee and Eve are still sitting on the wrong side, muddying both halves.

Now try debt. At or above 0.35: Ann, Bob, Cid, Eve — every one of them defaulted, Gini = **0** (perfectly pure). Below 0.35: Dee, Fay, Gus, Hal — every one of them stayed safe, Gini = **0** (perfectly pure too). Weighted Gini after this split: 0. The debt question separates all four defaulters from all four safe applicants in one move — Dee's low income didn't matter, Eve's high income didn't matter, only the debt ratio decided their fate correctly. It wins by the full margin available (0.5 → 0), against income's partial win (0.5 → 0.375), so the tree keeps it as the root.

Both children are already pure, so the tree stops after one split. The resulting tree has exactly two leaves: **debt ≥ 0.35 → predict default (4 of 4 training rows, 100%)**; **debt < 0.35 → predict safe (0 of 4, 0%)**. That's the whole training algorithm on this data: at every node, try every candidate question, keep the one that purifies the most, recurse until a group is pure or too small to split.

---

**What a leaf says.**

A leaf just reports the mix of training points that landed in it — the debt≥0.35 leaf above says "100% chance of default" because all four training rows there defaulted. For predicting a number instead of a class — a loan amount, say — a regression leaf hands back the **average** of the training values that landed in it instead of a class vote.

That averaging hides a sharp limit worth remembering: a regression tree **cannot extrapolate**. If the priciest house it ever trained on was 800k, the tree can only ever answer with an average of prices it has already seen — it will never say 1.2M, no matter how big and fancy the new house is. Its answers are trapped inside the range of its training data.

---

**The catch: trees are twitchy.**

Now the deep part. A tree is **greedy** — at each step it grabs the single best question available right now, with no thought for what that locks in later. It does not find the best tree *overall*; searching for that truly best tree is hopeless, because the number of possible trees is astronomical. Greedy is fast, but it comes at a price, and the eight applicants above are about to show exactly what price.

Change the labels on just two of the eight rows — nothing else — and flip Dee from safe to defaulted and Eve from defaulted to safe. Six of eight rows, 75% of the data, are untouched. Rerun both candidate splits. Debt at or above 0.35 now catches Ann, Bob, Cid (still defaulters) and Eve (now safe) — three of four defaulted, Gini = 1 − 0.75² − 0.25² = **0.375**. Below 0.35 catches Dee (now defaulted), Fay, Gus, Hal — one of four defaulted, Gini = **0.375** too. Weighted Gini after the debt split: 0.375 — no longer the clean win it was. Income below 48k now catches Ann, Bob, Cid, Dee — and all four defaulted (Dee flipped to match them), Gini = **0** — pure. At or above 48k catches Eve, Fay, Gus, Hal, and all four are now safe, Gini = **0** — pure too. Weighted Gini after the income split: 0. The winner just reversed. Income is now the pure split; debt is the muddy one.

Here's the part that matters more than the flip itself: imagine a new applicant, Ivy, who was in neither training run — income 46k, debt-to-income 0.30. Feed her into the first tree (root: debt ≥ 0.35?): 0.30 is below the line, so the "safe" leaf fires — **predicted safe**. Feed the identical Ivy into the second tree (root: income < 48k?): 46 is below the line, so the "default" leaf fires — **predicted default**. Two trees, each 100% accurate on the data it was trained on, each built from data that agrees on 75% of its rows, hand Ivy opposite verdicts. Neither tree is *wrong* about its own training data — the disagreement is the variance the last module named, made concrete: which feature becomes the root is fragile, and everything downstream of the root inherits that fragility. This is **high variance**, and it is not a bug you can tune away — it is baked into greedy splitting.

Hold onto that fact, because next lesson it flips from weakness into superpower: a crowd of different, twitchy trees, averaged together, cancels out its own wobble. That is the whole idea behind **random forests**, built directly on top of the instability just measured here.

---

**Two more things to know.**

Trees cut one feature at a time, so every boundary they draw is a straight, **axis-aligned** line — a horizontal or vertical fence. If the real boundary runs on a diagonal ("income plus debt above some total"), a tree can only approximate it with a staircase of many little fences, while a linear model draws that diagonal in a single stroke. So trees are clumsy exactly where lines are graceful, and graceful (carving boxes) exactly where lines are clumsy.

And left unchecked, a tree keeps splitting until nearly every leaf holds a single training point — 100% right on the training data, and badly overfit. The cure is **pruning**. You either stop early (cap the depth, or refuse splits that would leave too few samples in a leaf) or grow the full tree and then cut back the branches that do not earn their keep. Either way you give up a little training accuracy for a lot of test accuracy, and you choose how hard to prune by trying a few levels and keeping the one that generalises best.

---

**Gini's cousin: entropy and information gain.**

Gini isn't the only way to measure mixedness, and the same eight applicants show why the alternative has a different name. Ask a different question about a group's mix: how many yes/no questions would it take, on average, to nail down one person's class? A perfectly pure group needs zero — you already know the answer before asking. A 50/50 group needs exactly one — a single fair coin-flip-style question settles it, and no cleverer strategy does better. That "average number of yes/no questions" is exactly what information theory calls **entropy** — the number of bits of surprise in the group's class mix — with formula −Σpₖ log₂pₖ. Score it on the eight applicants: the starting 4-defaulted/4-safe mix gives entropy = −(0.5 log₂0.5 + 0.5 log₂0.5) = **1 bit**, the maximum possible for a two-way split, matching the "exactly one question" intuition exactly.

Score the original (unflipped) debt split the same way. Both children are pure, so both have entropy 0, and the weighted entropy after the split is 0. The drop from parent to children, 1 − 0 = **1 full bit**, is called **information gain** — literally "how many bits of uncertainty did this question remove," and here the answer is all of it, in one question. Score the income split instead: each child is a 3-of-4 group, entropy = −(0.75 log₂0.75 + 0.25 log₂0.25) ≈ **0.811 bits** per side, so the weighted entropy after the split is also ≈0.811, and the information gain is only 1 − 0.811 ≈ **0.189 bits** — a small fraction of a bit, next to debt's full bit. Same ranking as Gini (debt still wins, income still second), because for a binary split the two measures nearly always agree on which question is best; entropy is the quantity ID3/C4.5-style trees maximise directly. Because of that near-agreement, the whole topic is often loosely titled "information gain" even when the tree underneath is actually scoring with Gini — there, "information gain" is shorthand for the *Gini-impurity drop*, not the literal bits-of-entropy quantity defined above; the two agree on which split wins far more often than they agree in value. Gini is slightly cheaper to compute (no logarithm) and is scikit-learn's default — pick either in practice.

---

**How regression trees actually choose splits.**

For classification the tree purifies class mix. For regression there are no classes, so it purifies *spread*: it picks the split that most reduces the **variance** (equivalently, mean squared error) of the target within each child. A split that cleanly separates cheap houses from expensive ones drops the within-group variance a lot, so the tree takes it. If you care about robustness to outliers you can instead split on **MAE** (mean absolute error in place of squared error, so one huge-priced outlier house can no longer dominate which split looks best the way it would under squaring), and count-style targets (claim counts, visit counts) use a **Poisson** criterion, which scores a split by how well each child's mean predicts its own spread — the assumption built into count data, where variance and mean move together — instead of squared distance from the mean. But variance/MSE reduction is the default and the one to name.

---

**The knobs: a hyperparameter map and real pruning.**

A single tree is controlled by a handful of parameters worth knowing by name. \`max_depth\` caps how deep it grows; \`min_samples_split\` and \`min_samples_leaf\` refuse splits that would leave too few examples; \`max_leaf_nodes\` caps total leaves; \`class_weight\` up-weights a rare class. Those are *pre-pruning* (stop early). The principled *post-pruning* is **cost-complexity pruning** (the CART method): grow the full tree, then minimise (impurity + \`ccp_alpha\` × number of leaves) — a penalty on tree size exactly analogous to regularisation. Bigger \`ccp_alpha\` means a smaller tree, and you pick it by cross-validation.

---

**Categoricals and missing values: mind the implementation.**

"Trees handle mixed types" is true in principle but depends on the library. scikit-learn's classic trees actually need **numeric input** — you must encode categories yourself (and one-hot encoding a high-cardinality category can fragment the tree). True native categorical splits and native missing-value handling live in specific implementations (LightGBM, CatBoost, and newer histogram-based trees). So don't claim "trees just take categoricals" in an interview without naming which implementation.

---

**When one class is rare.**

Under imbalance a tree happily chases the majority: it can make pure-looking leaves that are almost all the common class and score high accuracy while never catching the rare one. And its leaf probabilities become unreliable. Fixes are the usual family: \`class_weight='balanced'\` so rare examples count more at each split, threshold moving on the leaf probabilities, stratified CV so folds keep the rare class, and judging with PR-AUC rather than accuracy — the \`class_imbalance\` module ahead works this out with its own worked numbers.

---

**Leaf probabilities lie a little.**

A classification leaf reports the *frequency* of each class among its training points. The debt-split tree above said "100% chance of default" and "0% chance of default" from its two leaves — and that's exactly the failure mode to distrust: each leaf held only four training rows, so "100%" really means "4 out of 4 seen so far," not "certainty." A single deep tree tends to give overconfident near-0/near-1 probabilities precisely because small, pure-looking leaves are easy to produce and easy to over-trust. If you need trustworthy probabilities from a tree, enforce a minimum leaf size and calibrate (Platt or isotonic) on a held-out set rather than trusting the raw leaf fractions.`,
    keyPoints: [
      `**What a decision tree is, and when to reach for it: a flowchart of yes/no questions you can actually read.**\n\nTrees are the model to use when you need to explain every prediction in plain words — "debt-to-income at or above 0.35, so we flagged it." They take mixed feature types (numbers and categories) as they come, need no scaling, and pick up feature interactions on their own, since splitting on income and then on debt is exactly an income-and-debt rule. The catch: a single tree is twitchy and overfits easily. So use one tree when you need a human-readable explanation, and an ensemble (random forest or boosting) when you need the accuracy in production.`,
      `**The instability isn't hypothetical: flip two rows out of eight and the root question can reverse.**\n\nOn the worked applicant data, the root split is debt-to-income (Gini 0.5 → 0, a full 1 bit of information gain) with income a clear runner-up (Gini 0.5 → 0.375, ≈0.189 bits). Change just two of the eight labels and income becomes the pure split while debt becomes the muddy one — six of eight rows never moved. A brand-new applicant who wasn't in either training set can get opposite predictions from the two trees, even though each tree is 100% accurate on its own data. That's variance from the last module, made concrete: which feature lands at the root is fragile, and everything beneath the root inherits that fragility.`,
      `**The trap that fools people: trusting the tree's built-in feature-importance scores.**\n\nA tree's default importance counts how much each feature cut down impurity across all its splits. But a fine-grained number like income has many possible cut points, so it gets far more chances to split than a plain yes/no flag — and it ends up looking more important than it really is, just from having more opportunities. Do not rank features by this. Use permutation importance instead: shuffle one feature's values, measure how much accuracy drops, and repeat. A feature that truly mattered will hurt when scrambled; a useless one will not.`,
      `**The check to run: sweep how hard you prune, and watch train versus test accuracy.**\n\nWith no pruning a tree scores nearly perfectly on training data and poorly on test — pure overfitting. As you prune harder, test accuracy climbs (noise removed), peaks, then falls again (now you are cutting real structure). That peak is the right amount of pruning, and you find it with cross-validation, not by eyeballing a single split. Also watch leaf sizes: a leaf built from only two or three examples gives a probability you should not trust, so require a minimum number of samples per leaf.`,
      `**Know the split criteria and the hyperparameter map by name.**\n\nClassification splits maximise purity via Gini (1 − Σpₖ²) or entropy/information gain (−Σpₖ log₂pₖ) — on the eight-applicant example, the winning debt split took Gini from 0.5 to 0 and entropy's information gain was a full 1 bit, while the losing income split only reached Gini 0.375 and ≈0.189 bits of gain. The two measures nearly always rank splits the same way; Gini is cheaper (no logarithm) and is scikit-learn's default. Regression splits minimise variance/MSE within children (MAE or Poisson as alternatives). The knobs: \`max_depth\`, \`min_samples_split\`, \`min_samples_leaf\`, \`max_leaf_nodes\`, \`class_weight\` for pre-pruning, and \`ccp_alpha\` for cost-complexity post-pruning — minimise (impurity + ccp_alpha × #leaves), pick ccp_alpha by CV.`,
      `**Mind implementation limits, imbalance, and leaf-probability calibration.**\n\nscikit-learn's classic trees need numeric-encoded inputs — native categorical and missing-value handling lives in LightGBM/CatBoost/histogram trees, so don't claim "trees just take categoricals" without naming the library. Under imbalance a tree chases the majority and its leaf probabilities get unreliable — use \`class_weight='balanced'\`, threshold moving, stratified CV, and PR-AUC. And a leaf reports raw training frequencies (the debt-split leaves above reported 4/4 = 100% and 0/4 = 0%, from just four rows each), which are poorly calibrated for small leaves and overconfident overall, so enforce a minimum leaf size and calibrate on held-out data if you need trustworthy probabilities.`,
    ],
    interactivePrompt: `Before you touch the controls: if a decision tree perfectly memorises every training example (100% training accuracy), what do you expect its test accuracy to be relative to a shallower tree?`,
    checkQuestions: [
      {
        q: `Train a decision tree, then retrain it on data that differs by just a handful of rows — and the whole tree can come out looking completely different. Why does that happen, and why does it point toward random forests?`,
        options: [
          `\`A) The first split is chosen from the whole dataset, so a few changed rows can flip it, reshuffling every branch below. Averaging many trees cancels the wobble.\``,
          `\`B) The tree keeps re-sorting rows alphabetically as data changes, and reordering rebuilds branches from scratch; a forest fixes this by freezing that sort order once.\``,
          `\`C) Trees are sensitive to whether you use Gini or entropy, and swapping rows can tip which criterion wins the root; a forest averages trees built under both criteria.\``,
          `\`D) The wobble comes from the tree choosing splits at random on every run, so a fixed seed removes it entirely; a forest is one tree with a pinned seed.\``,
        ],
        answer: `A`,
      },
      {
        q: `When a decision tree picks its next yes/no question, what is it actually trying to do?`,
        options: [
          `\`A) Pick the question that splits the group into two halves of equal size, keeping the tree balanced so its overall depth ends up as small as possible.\``,
          `\`B) Pick the question that leaves the two groups as pure as possible, each side mostly one class, measuring purity with something like Gini impurity.\``,
          `\`C) Pick the feature with the highest overall correlation to the target, splitting it right at the average value since it carries the most signal alone.\``,
          `\`D) Pick the question that creates the largest number of leaves at once, since more leaves lets the tree represent more of the patterns hiding underneath.\``,
        ],
        answer: `B`,
      },
      {
        q: `A tree grown with no depth limit hits 100% training accuracy but 62% on test. Capping its depth gives 85% train and 80% test. What happened, and how do you find a good depth?`,
        options: [
          `\`A) The unlimited tree had high bias from splitting too little, fixed by the shallow one; find the best depth by picking the highest training accuracy under a 10% gap.\``,
          `\`B) The unlimited tree memorised training noise — great on train, poor on test, high variance. Find a good depth by cross-validation, keeping the best held-out score.\``,
          `\`C) Both trees share the same variance and differ only in bias, which only shrinks as depth grows, so the deeper tree is strictly better and 62% must be a fluke.\``,
          `\`D) The deep tree overfit because deep trees are unusually sensitive to mislabelled rows, so smoothing the labels is the real fix rather than limiting depth.\``,
        ],
        answer: `B`,
      },
      {
        q: `You train a regression tree on house prices that top out at 800k. A genuinely 1.2M house comes in. What does the tree predict, and why?`,
        options: [
          `\`A) About 1.2M — the tree follows the upward size-to-price trend it learned during training and simply extends that trend outward to price the larger house.\``,
          `\`B) Exactly 0, because the 1.2M house matches none of the leaves the tree built, so it falls through to a default empty-leaf prediction of zero dollars.\``,
          `\`C) At most 800k — a regression leaf just averages the training prices landing in it, so trees cannot extrapolate past the range they trained on.\``,
          `\`D) Roughly 1.2M, but only under extrapolate=True; by default the tree refuses to guess and returns a missing value for the out-of-range house instead.\``,
        ],
        answer: `C`,
      },
      {
        q: `The topic is titled "information gain," but the module measures splits with Gini. Select the two true statements about how entropy/information gain and Gini relate.`,
        options: [
          `\`A) Both measure how mixed a group is; the drop in entropy from a split is called information gain, and Gini is a cheaper proxy for the same underlying idea.\``,
          `\`B) In practice they yield very similar trees, and Gini is scikit-learn's default because computing it avoids taking a logarithm at every candidate split.\``,
          `\`C) They are unrelated — Gini measures class purity while information gain instead measures how many total features a candidate split actually uses.\``,
          `\`D) Gini only matches information gain when every class is equally frequent; under any imbalance the two always pick opposite, contradictory splits.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You grow a full decision tree and want to prune it back in a principled way rather than just capping depth. What is cost-complexity pruning doing?`,
        options: [
          `\`A) It removes whichever leaves have the fewest training samples until the tree reaches a preset total node count, ignoring impurity considerations entirely.\``,
          `\`B) It re-grows the tree from scratch with a smaller max_depth each time and keeps the first whose training accuracy drops below some chosen threshold.\``,
          `\`C) It minimises (impurity + ccp_alpha × leaf count), a size penalty directly analogous to regularisation; larger ccp_alpha means a smaller tree, tuned by CV.\``,
          `\`D) It converts the tree into a linear model and applies an L1 penalty to leaf values, zeroing out the least useful leaves the way Lasso zeroes weights.\``,
        ],
        answer: `C`,
      },
      {
        q: `Eight applicants split 4-defaulted/4-safe (Gini 0.5). The debt-to-income question sends every defaulter to one side and every safe applicant to the other; the income question leaves two applicants on the "wrong" side of each group. What is the weighted Gini after each split, and which does the tree pick?`,
        options: [
          `\`A) Debt reaches Gini 0 (both children pure); income only reaches Gini 0.375. The tree picks debt, since it purifies by the larger amount.\``,
          `\`B) Both splits reach exactly Gini 0.25, a tie, so the tree picks whichever candidate question was generated first during the search.\``,
          `\`C) Debt reaches Gini 0.5, unchanged, since separating by sign alone never lowers Gini; income reaches 0 and is the one the tree keeps.\``,
          `\`D) Income reaches Gini 0 because it is evaluated first alphabetically; debt is never actually scored once a pure split has been found.\``,
        ],
        answer: `A`,
      },
      {
        q: `On that same eight-applicant split, root entropy is 1 bit. The debt question yields two pure children; the income question yields two children at 3-of-4. Select the two true statements about the resulting information gain.`,
        options: [
          `\`A) Debt's information gain is a full 1 bit, since entropy drops from 1 to 0 — the question removed all the uncertainty about default in one step.\``,
          `\`B) Income's information gain is only about 0.189 bits, since each 3-of-4 child still carries roughly 0.811 bits of remaining uncertainty.\``,
          `\`C) Income's information gain is larger than debt's, because a 3-of-4 split is inherently more informative than a perfectly pure 4-of-4 split.\``,
          `\`D) Neither split has a defined information gain, since information gain only applies once a tree has grown past its first level.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You flip the labels on just 2 of the 8 applicants above (6 of 8 rows, 75%, are untouched), and the root question reverses — the split that used to be muddy is now pure, and vice versa. A brand-new applicant, unseen by either training run, now gets opposite predictions from the two trees. What does this demonstrate, and is either tree "wrong"?`,
        options: [
          `\`A) Neither tree is wrong about its own training data — each is 100% accurate there. The disagreement is variance: which feature lands at the root is fragile.\``,
          `\`B) One of the two trees must have a bug, since a correctly implemented Gini search always converges to the same root question regardless of the data.\``,
          `\`C) This shows Gini itself is an unreliable impurity measure, and switching to entropy for both training runs would have prevented the root from flipping.\``,
          `\`D) This only happens because the tree wasn't pruned; capping max_depth at 1 for both training runs would force the root question to agree.\``,
        ],
        answer: `A`,
      },
    ],
    takeaway: `A decision tree is a flowchart of yes/no questions, each chosen to split the data into purer groups (measured by Gini or, equivalently, entropy's information gain). It is easy to read but twitchy — on eight applicants, flipping just two labels reversed which question sat at the root, and a new, unseen applicant got opposite predictions from the two trees even though each was 100% accurate on its own data. It can only cut straight, axis-aligned lines, so diagonal boundaries need a clumsy staircase. That very instability is what makes trees the perfect building block for random forests, built directly on top of it.`,
    recap: [
      "**Decision tree = flowchart of yes/no questions,** each split chosen to make groups purer.",
      "**Gini = 1 − Σpₖ²; entropy = −Σpₖ log₂pₖ, its drop = information gain (bits).** Nearly always rank splits the same way.",
      "**Worked split:** 8 applicants, Gini 0.5 → debt split: Gini 0 (1 bit gained) vs income split: Gini 0.375 (≈0.189 bits) → debt wins, becomes root.",
      "**Twitchy, concretely:** flip 2 of 8 labels → root flips debt↔income → a new applicant gets opposite predictions from each tree, both 100% accurate on their own data.",
      "**That instability is a feature** — it makes trees the perfect base for random forests, built on canceling exactly this wobble.",
      "**Axis-aligned cuts only** — diagonal boundaries need a clumsy staircase.",
      "**Regression leaves = average of training values landing there → cannot extrapolate** past the training range.",
      "**Don't trust built-in feature importances** — biased toward high-cardinality features; use permutation importance.",
      "**Prune to control depth:** cost-complexity pruning minimises (impurity + ccp_alpha × leaves), tuned by CV.",
      "**Small pure leaves overstate confidence** — the debt-split leaves above hit 100%/0% from just 4 rows each; calibrate before trusting raw leaf fractions.",
    ],
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
    summary: `The last module ended on eight loan applicants and a hard number: flip 2 of 8 labels and the root question reverses, and a brand-new applicant gets opposite predictions from the two trees even though each is 100% accurate on its own data. That instability was called variance, and it was named as a bug, not fixed. Time to fix it.

In 1906 the scientist Francis Galton was at a country fair where a crowd was trying to guess the weight of an ox. Nearly eight hundred people wrote down a number. No single guess was right — some were wildly high, some wildly low. But when Galton averaged them all, the crowd's answer came out at 1197 pounds. The ox weighed 1198. The crowd as a whole beat almost every individual in it, cattle experts included. That is the **wisdom of the crowd**, and a **random forest** is exactly this trick applied to decision trees.

Recall the debt/income tree from last module: it is twitchy precisely because its very first split is chosen from the whole dataset at once, so a couple of changed rows can flip it. But look closer at that flaw. If different slices of data grow different trees that make *different* mistakes, then averaging a whole crowd of them should cancel those mistakes out — the errors point in random directions and wash away, while the real signal they mostly agree on survives. So: grow many trees, let them vote, and the group is far steadier than any single tree. The question is exactly how much steadier, and that turns out to be a number you can compute.

---

**A crowd only helps if it disagrees — put a number on "helps."**

Here is the crucial catch. The ox crowd worked because people guessed *independently* — their errors were unrelated. If everyone had copied their neighbour, the "crowd" would be one guess repeated eight hundred times, and averaging would do nothing. The same holds for trees: if income is the strongest predictor of default, every tree handed the full dataset will split on income first and come out nearly identical — all making the same mistakes.

Make that precise. Suppose each tree's prediction carries some error with variance σ² = 100 (in squared-price units — think an individual tree's typical miss is about √100 = 10k on a house-price task), and any two trees' errors share correlation ρ, because they overlap: bootstrap resampling and shared features mean two trees trained on the same dataset agree more than two trees trained on unrelated problems would. For n trees averaged together, each with variance σ² and pairwise correlation ρ, the variance of their average is:

Var(average) = σ²/n + ((n−1)/n)·ρσ²

Plug in n=100 trees at ρ=0.5 (typical for trees given the full feature set every time, so they keep finding the same top splits): Var = 100/100 + (99/100)·0.5·100 = 1 + 49.5 = **50.5**. Compare that to a single tree's variance of 100 — averaging did cut it roughly in half, but nowhere near the 100× a naive "more trees = less noise" intuition might expect. Push n to 1000: Var = 100/1000 + (999/1000)·50 = 0.1 + 49.95 = **50.05**. A tenfold increase in tree count bought a movement from 50.5 to 50.05 — essentially nothing. As n→∞, Var(average) → ρσ² = 0.5×100 = **50**, a floor set entirely by ρ that no amount of extra trees can push below.

Now change the *other* dial. Keep n=100 but cut ρ to 0.1 (decorrelated trees): Var = 100/100 + (99/100)·0.1·100 = 1 + 9.9 = **10.9** — down from 50.5, and the *asymptotic* floors themselves (ρσ²=50 vs ρσ²=10) are exactly 5× apart, a bigger swing than ten times the tree count bought. That's the whole justification for forcing trees to disagree: the lever that matters is ρ, not n.

A random forest drives ρ down with two tricks.

First: instead of handing every tree the whole dataset, give each one a random resample — draw rows with replacement until you have a fresh training set of the same size, where some rows repeat and others are left out. That resampling trick has a name, **bagging** (short for bootstrap aggregating).

[FIGURE: bagging_forest]

Second: at each split, do not let the tree look at all the features — show it only a random handful (a common choice is the square root of the total). Now even the trees that *would* have latched onto income are sometimes forced to find other patterns; this is **random feature selection**, the second decorrelation lever. It's the sharper move of the two — bagging alone only decorrelates trees mildly (bootstrap resamples still overlap heavily), while restricting features at every split is what actually pushes ρ from something like 0.5 down toward 0.1, because it stops every tree from making the same first cut. That difference — 50 versus 10 as the variance floor — is the entire reason "more trees" plateaus around a few hundred while "fewer features per split" keeps moving the needle.

---

**A free validation set, for nothing.**

That same row-resampling step that decorrelates the trees also hands you a bonus, and it has an exact source. A bootstrap resample of n rows drawn with replacement from n rows leaves some rows out entirely — the probability any single row is *never* drawn across n draws is (1−1/n)ⁿ, which converges to 1/e ≈ **0.368** as n grows. So roughly 36.8% of rows — "about a third" — never appear in a given tree's training set, and are that tree's **out-of-bag** rows. For each row you can ask only the trees that did *not* train on it to predict it, and check them against the truth. That gives an honest estimate of test performance — the **out-of-bag (OOB) error** — for free, with no separate validation set set aside. If the OOB error and your real test error disagree badly, that is a red flag for a distribution shift or a data leak.

---

**The one trap to remember.**

A random forest built for regression **cannot predict outside the range it has seen**. Every tree's answer is an average of training values in a leaf, and an average of a forest of averages is still boxed in by the training data. Return to that same house-price task from above: train on prices up to 800k and the forest will never output more than 800k, no matter how enormous the house. If your target drifts upward over time — prices rising year over year — the forest will quietly under-predict the future while looking perfectly healthy on past data. When the target trends, reach for a model that can extrapolate.

---

**The hyperparameters worth knowing.**

A forest has more knobs than "how many trees" — and now you can say precisely why \`n_estimators\` isn't the one to lean on. \`n_estimators\` is the tree count (more never hurts accuracy, just compute — recall it moved the variance floor from 50.5 to only 50.05 going from 100 to 1000 trees). \`max_features\` is the real diversity dial — how many features each split may consider (√p is a common default; fewer means lower ρ, and the arithmetic above showed dropping ρ from 0.5 to 0.1 cut the variance floor 5×). \`max_depth\` and \`min_samples_leaf\` control how deep each tree grows. \`bootstrap\` and \`max_samples\` control the resampling (turn bootstrap off and you lose OOB). \`class_weight\` up-weights a rare class, and \`criterion\` picks Gini/entropy or the regression split rule. In an interview, name \`n_estimators\`, \`max_features\`, \`max_depth\`, \`min_samples_leaf\`, and \`class_weight\` as the ones you'd actually tune — and lead with \`max_features\` as the one that moves the needle.

---

**What the forest fixes — and what it doesn't.**

Be precise about the bias-variance story. Averaging many de-correlated trees mainly **reduces variance** — that's the whole wisdom-of-the-crowd effect. It does *not* reduce bias much: if the individual trees are systematically wrong because the signal is weak or a key feature is missing, averaging a thousand of them just gives you a very stable version of the same wrong answer. So a forest of deep trees can still be biased. Variance is what the crowd kills; bias you fix by adding signal, not trees.

---

**OOB is handy but not bulletproof.**

Out-of-bag error is a free estimate, but it assumes rows are independent and identically distributed. It quietly *lies* when they're not. With time-series data, OOB lets a tree "see the future" (rows from later dates train a tree that scores earlier ones), so it's optimistic — you need a time-based split instead. With grouped data (many rows per customer), OOB leaks across the group. And under distribution shift or leakage, OOB reflects the training distribution, not production. So use OOB as a cheap sanity check, not as a replacement for a properly designed validation scheme.

---

**Reading importances, carefully.**

Two importance traps. The built-in **impurity importance** — a different use of "Gini" than the split criterion above; this one ranks features by how much they cut impurity across all their splits, after training, rather than choosing questions during it — is biased toward high-cardinality features, same issue as a single tree. Permutation importance is better but has its *own* correlated-feature trap: if two features carry the same information, shuffling one barely hurts accuracy because its twin still supplies the signal, so *both* look unimportant even though the information is vital. Don't read low permutation importance as "useless" when features are correlated. And a forest is far less interpretable than a single tree — for real explanation reach for permutation importance, partial-dependence/ICE plots, and SHAP, all read with the correlation caveat in mind.

---

**When the forest loses to boosting.**

A random forest is a fantastic *baseline*, but on tabular-accuracy leaderboards **gradient boosting usually wins.** The reason ties back to bias-variance: forests reduce variance but leave bias on the table, while boosting attacks bias by building trees sequentially, each correcting the last. The trade: boosting needs more careful tuning and is more sensitive to noise, outliers, and leakage (it will happily fit a leak that a forest partly averages away). So: forest for a fast, robust baseline; boosting when you'll invest tuning effort to squeeze out the last few points.

---

**Under imbalance.** A forest inherits the single tree's problem — it chases the majority class and its vote proportions get unreliable. Use \`class_weight='balanced'\` (or \`balanced_subsample\`), stratified CV so folds keep the rare class, threshold moving on the predicted probabilities, and judge with PR-AUC, balanced accuracy, or recall@K rather than raw accuracy.`,
    keyPoints: [
      `**Use a random forest when you want a strong, low-effort baseline on tabular data.**\n\nIt takes mixed feature types as they come, needs no scaling, shrugs off irrelevant features, and hands you free out-of-bag validation. Its defaults work well with almost no tuning, which makes it the reliable first thing to try on classification or regression. Reach for gradient boosting instead when you need to squeeze out the last couple of accuracy points and are willing to tune carefully — but for a fast, trustworthy baseline, the forest is hard to beat.`,
      `**The trap: thinking more trees is the lever. Past a couple hundred, adding trees barely moves anything.**\n\nFor n trees with per-tree error variance σ² and pairwise correlation ρ, Var(average) = σ²/n + ((n−1)/n)ρσ² — and as n→∞ that converges to a floor of ρσ², not zero. With σ²=100 and ρ=0.5, going from 100 to 1000 trees only moves the variance from 50.5 to 50.05, because the floor itself is 50. Cutting ρ to 0.1 instead — by restricting features per split — drops the floor to 10, a 5× win that ten times the tree count couldn't buy. Tune diversity (max_features), not quantity (n_estimators).`,
      `**The check: compare the out-of-bag error to your held-out test error.**\n\nOut-of-bag error is a free, honest estimate of how the forest does on data like its training set. If OOB says 10% but your real test error is 25%, something is off — usually the test data comes from a different distribution than training, or a leak made training look too easy. When the two disagree, compare the feature distributions of train and test before trusting the model in production.`,
      `**Be precise: the forest reduces variance, not bias — and OOB isn't bulletproof.**\n\nAveraging de-correlated trees kills variance (the wisdom-of-the-crowd effect) but barely touches bias, so a forest of weak or wrong trees is just a stable version of the same wrong answer — fix bias with signal, not more trees. And OOB assumes i.i.d. rows: it's optimistic on time-series (a tree sees the future), leaks across grouped data (many rows per customer), and reflects the training distribution under shift. Use OOB as a cheap check, not a substitute for a time- or group-aware validation split. Tune \`max_features\`, \`max_depth\`, \`min_samples_leaf\`, \`class_weight\` — not just \`n_estimators\`.`,
      `**Read importances with the correlation caveat, and know when boosting wins.**\n\nBuilt-in impurity importance is biased toward high-cardinality features; permutation importance is better but has its own trap — with two correlated features, shuffling one barely hurts (the twin still carries the signal), so both look unimportant even when vital. For real interpretation use permutation importance, PDP/ICE, and SHAP, all read cautiously. And a forest is a strong baseline but gradient boosting usually wins on tabular accuracy: boosting attacks the bias a forest leaves behind, at the cost of more tuning and more sensitivity to noise, outliers, and leakage. Under imbalance, use \`class_weight='balanced'\`, stratified CV, threshold moving, and PR-AUC.`,
    ],
    interactivePrompt: `Before you touch the controls: if you increase the number of trees from 100 to 1000 while keeping max_features fixed, how much do you expect the test accuracy to change?`,
    checkQuestions: [
      {
        q: `A random forest gives every tree the full dataset and all the features. Select the two true statements about why it barely beats a single tree and how to fix it.`,
        options: [
          `\`A) With full data and all features, every tree tends to make the same top splits, becoming near-copies that share the same mistakes, so averaging copies barely helps.\``,
          `\`B) Force diversity: give each tree a random resample of rows (bagging) and let each split see only a random subset of the available features.\``,
          `\`C) The trees are overfitting because they grow too deep; simply cap their depth and the forest will immediately pull far ahead of a single tree.\``,
          `\`D) A forest can never beat a single tree until it has thousands of trees; pushing tree count into the thousands opens the accuracy gap on its own.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Your forest's out-of-bag error is 10%, but its error on a fresh test set is 25%. What does that gap most likely mean?`,
        options: [
          `\`A) OOB estimates performance on data like the training set, so a big gap points to a distribution shift or a training-time leak.\``,
          `\`B) The gap is normal for forests, since out-of-bag rows are only a third of the data and always underestimate true error by roughly 15 points reliably.\``,
          `\`C) It means the forest simply has too few trees, so the OOB estimate is still noisy; pushing tree count to a few thousand converges the two numbers.\``,
          `\`D) It means the forest is underfitting on training and overfitting on test simultaneously, a contradiction that clears up once more trees are added.\``,
        ],
        answer: `A`,
      },
      {
        q: `You train a regression forest on house prices up to 800k and deploy it as prices keep climbing. What silent failure should you expect?`,
        options: [
          `\`A) None — a forest averages many trees, and that averaging naturally lets it extend the upward price trend beyond anything it saw during training.\``,
          `\`B) It will start predicting wildly high values, since out-of-range inputs push the trees into their deepest leaves, which then extrapolate aggressively.\``,
          `\`C) It will never predict above 800k, since every tree's answer is a training-price average, quietly under-predicting as prices climb.\``,
          `\`D) It will refuse to predict on any house priced above 800k and return a missing value instead, making the failure loud and obvious rather than silent.\``,
        ],
        answer: `C`,
      },
      {
        q: `Two of your forest's features are highly correlated. You compute permutation importance and both come out near zero, yet dropping both together tanks accuracy. What is going on?`,
        options: [
          `\`A) The features are genuinely useless; the accuracy drop from removing both is coincidental retraining noise, so trust the permutation scores and drop them.\``,
          `\`B) Shuffling one correlated feature barely hurts because its untouched twin still supplies the same information, so both look unimportant even though vital.\``,
          `\`C) The near-zero scores mean the forest never split on either feature, so they were dropped internally, and the accuracy drop comes from elsewhere.\``,
          `\`D) Correlated features always get inflated permutation importance, so near-zero scores prove they are irrelevant and the joint drop is a scoring bug.\``,
        ],
        answer: `B`,
      },
      {
        q: `On a tabular problem your random forest baseline is good but a colleague says gradient boosting will likely beat it. In bias-variance terms, why — and what's the catch?`,
        options: [
          `\`A) Boosting wins because it reduces variance even more aggressively than bagging does, with no real downsides, so you should always prefer it outright.\``,
          `\`B) Boosting wins because it uses deeper trees than a forest, and depth alone drives tabular accuracy; the catch is simply that training runs more slowly.\``,
          `\`C) A forest mainly reduces variance but leaves bias on the table; boosting attacks that bias — the catch is heavier tuning.\``,
          `\`D) There is no real reason — forests and boosting are mathematically equivalent, so the colleague is mistaken and the two always score identically on the same data.\``,
        ],
        answer: `C`,
      },
      {
        q: `With per-tree error variance σ²=100 and pairwise correlation ρ=0.5, you go from 100 trees to 1000 trees. Using Var(average) = σ²/n + ((n−1)/n)ρσ², what happens to the ensemble's variance, and why?`,
        options: [
          `\`A) It drops from about 50.5 to about 50.05 — a tiny move, because the formula converges to a floor of ρσ²=50 as n grows, which more trees cannot cross.\``,
          `\`B) It drops from 100 to 10, a full 10× reduction, since variance of an average of n things always falls in exact proportion to n regardless of correlation.\``,
          `\`C) It drops to exactly 0, since averaging enough independent-looking trees always drives correlated error all the way out given enough of them.\``,
          `\`D) It stays at 100 exactly, since correlation between trees completely cancels any benefit from averaging no matter how many trees are added.\``,
        ],
        answer: `A`,
      },
      {
        q: `Same setup (σ²=100), but now instead of adding trees you keep n=100 and cut the pairwise correlation from ρ=0.5 to ρ=0.1 by restricting features per split. What happens, and what does that imply about which knob to tune?`,
        options: [
          `\`A) The variance floor drops from 50 to 10, a 5× win — bigger than the 100→1000 tree-count change bought, so max_features matters more than n_estimators.\``,
          `\`B) Nothing changes, since the variance formula only depends on n and σ², and ρ was already folded into σ² by the time trees are being averaged.\``,
          `\`C) The variance floor rises to 90, since decorrelating trees makes each one individually noisier and that noise dominates the ensemble average.\``,
          `\`D) The floor drops to exactly 0, since ρ=0.1 is treated as "independent enough" for the formula to behave as if the trees were fully uncorrelated.\``,
        ],
        answer: `A`,
      },
      {
        q: `A bootstrap resample draws n rows with replacement from n original rows. Select the two true statements about why roughly a third of the rows end up out-of-bag.`,
        options: [
          `\`A) The chance a specific row is never drawn across n draws is (1−1/n)ⁿ, which converges to 1/e ≈ 0.368 as n grows — about 36.8% of rows, not exactly a third.\``,
          `\`B) Because bagging samples with replacement, some rows are drawn multiple times while others are drawn zero times — that's exactly what leaves rows out-of-bag.\``,
          `\`C) Exactly 33.3% of rows are excluded by design, because scikit-learn's bootstrap explicitly reserves a fixed one-third holdout before resampling begins.\``,
          `\`D) The out-of-bag fraction only holds for classification forests; regression forests bootstrap without replacement, so no rows are ever left out.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `A colleague argues bagging alone (random row resamples, all features visible at every split) should decorrelate trees just as well as also restricting features per split. Why is that usually wrong?`,
        options: [
          `\`A) Bootstrap resamples still overlap heavily with each other, so trees built on them tend to find the same strongest first split; restricting features forces real disagreement.\``,
          `\`B) Bagging and feature restriction are mathematically identical operations, so a colleague claiming otherwise has simply mislabelled which hyperparameter does what.\``,
          `\`C) Bagging alone actually increases correlation between trees, since resampling with replacement duplicates the majority pattern in every single tree it touches.\``,
          `\`D) Feature restriction only helps classification forests; for regression forests bagging alone already reaches the same ρ that feature restriction would reach.\``,
        ],
        answer: `A`,
      },
    ],
    takeaway: `A random forest is the wisdom of the crowd applied to decision trees: grow many trees, let them vote, and their errors cancel — but only if the trees are diverse. Made precise, Var(average) = σ²/n + ((n−1)/n)ρσ² converges to a floor of ρσ² as n grows, which is why n_estimators plateaus (50.5→50.05 going from 100 to 1000 trees at ρ=0.5) while max_features — the dial that actually lowers ρ — is what moves the floor itself (50→10 at ρ=0.1). It throws in free out-of-bag validation (≈36.8% of rows per tree, from (1−1/n)ⁿ→1/e), and its one silent trap is that a regression forest can never predict outside the range of values it trained on.`,
    recap: [
      "**Random forest = wisdom of the crowd on trees** — grow many, let them vote, errors cancel.",
      "**Only works if trees are diverse:** bagging (random resamples) + random feature subset at each split, to drive down ρ.",
      "**Var(average) = σ²/n + ((n−1)/n)ρσ² → ρσ² as n→∞** — a correlation floor, not zero.",
      "**Worked: σ²=100, ρ=0.5** — n=100→1000 moves variance 50.5→50.05 (n_estimators plateaus); ρ=0.5→0.1 at n=100 moves it 50.5→10.9 (max_features is the real lever).",
      "**Reduces variance, not bias** — a forest of biased trees is a stable version of the same wrong answer.",
      "**Free OOB validation** — (1−1/n)ⁿ→1/e≈36.8% of rows left out of each bootstrap, validate that tree for free.",
      "**OOB assumes i.i.d. rows** — optimistic on time-series/grouped data; use a time- or group-aware split instead.",
      "**Silent trap:** a regression forest can never predict outside its training range (no extrapolation).",
      "**Importances:** impurity importance biased toward high-cardinality features; permutation importance's own trap is correlated features looking falsely unimportant.",
    ],
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
    summary: [
`The random forest module ended on a specific limit, not a vague one: averaging many de-correlated trees kills **variance**, but it barely touches **bias**. If every tree in the forest is wrong in the same direction — a feature is missing, or the signal is genuinely subtle — a thousand of them just gives you a very stable version of the same wrong answer. Throwing more trees at a forest cannot fix that; recall that a forest's trees are all trained the same way, independently, on the full problem. So the question the forest left open is real: is there any way to train trees that attacks bias directly, instead of just averaging variance away?`,

`In 1988 two researchers, Michael Kearns and Leslie Valiant, turned that question into something sharper. Suppose all you have is a pile of *weak* learners — models barely better than a coin flip, individually far too weak to fix anyone's bias. Could you chain a pile of weak learners into one *strong* learner that is nearly always right? Nobody knew. Two years later Robert Schapire proved the answer is **yes**, and the construction he found is called **boosting**.`,

`Schapire's original construction, later refined into **AdaBoost**, does something concrete: it **reweights rows**, not trees. Train one weak tree. Look at which rows it got wrong, and make those rows *heavier* — literally increase how much they count — before training the next weak tree. That next tree, chasing the now-heavier misclassified rows, is forced to pay attention to exactly what the first tree missed. Repeat this a few hundred times, then combine all the trees, weighting each one by how accurate it was. Every tree is weak on its own; the chain of trees, each cleaning up the last one's blind spot, is strong.`,

`Gradient boosting keeps AdaBoost's core move — train sequentially, each tree fixing what's left over — but rebuilds the "fixing" step around something more general than reweighting rows: fitting each new tree to what the current prediction still gets wrong. Watch it happen on numbers you can check by hand.`,

`Four houses. House A: 800 sqft, 150k. House B: 1200 sqft, 200k. House C: 2000 sqft, 400k. House D: 3000 sqft, 600k. Start with the laziest possible model: predict the same number for every house, no matter its size. What number minimises the total squared error against four unequal targets? Calculus (or just recalling how the mean is defined) says the mean: (150+200+400+600)/4 = **337.5k**. Call this **F₀ = 337.5k** — the initial prediction, before any tree has been fit.`,

`Now name the **misses** — the residual at each house, true price minus F₀. House A: 150−337.5 = **−187.5k**. House B: 200−337.5 = **−137.5k**. House C: 400−337.5 = **+62.5k**. House D: 600−337.5 = **+262.5k**. Negative means the model over-guessed (the flat 337.5k prediction is too high for a cheap house); positive means it under-guessed. The two cheap houses were badly over-guessed; the two expensive ones badly under-guessed. Notice the residuals are the only information the next step gets — not the original prices.`,

`Pause and predict, before the arithmetic: a tiny tree (one split, two leaves) is about to be fit to those four residuals using house size as the question. Three thresholds are worth trying — separating the cheapest house alone (size < 1000), separating the two cheapest (size < 1600), or separating the three cheapest (size < 2500). Which grouping do you expect minimises the tree's error?`,

`Run all three, by hand. A tree fitting residuals picks the split that leaves each side's residuals as close to their own group average as possible — the same "minimise squared error within each leaf" objective a plain regression tree already uses. Split at size < 1000: left = {A: −187.5}, error 0 (a single point matches its own mean exactly); right = {B, C, D: −137.5, +62.5, +262.5}, mean 62.5, squared error ≈ **80,000**. Total ≈ 80,000. Split at size < 1600: left = {A, B: −187.5, −137.5}, mean −162.5, squared error 1,250; right = {C, D: +62.5, +262.5}, mean +162.5, squared error 20,000. Total = **21,250** — far lower. Split at size < 2500: left = {A, B, C}, mean −87.5, squared error 35,000; right = {D}, error 0. Total = **35,000**. The winner is size < 1600, by a wide margin — because it's the only split that separates the residuals by *sign* (A, B both over-guessed; C, D both under-guessed), where size < 1000 leaves a mixed-sign group of three on its right side.`,

`So tree 1's rule is: size < 1600 → predict −162.5k (the left group's own mean residual); size ≥ 1600 → predict +162.5k. That's the tree's raw output — but gradient boosting never adds a tree's raw output straight in. It scales it first by the **learning rate**, usually written η (eta) — a fraction, chosen before training, that shrinks every tree's contribution to keep any single step cautious. Use η = 0.5 here. Tree 1's actual contribution becomes 0.5 × ∓162.5 = **∓81.25k**.`,

`New predictions, F₁ = F₀ + tree 1's shrunk contribution: House A and B (size < 1600): 337.5 − 81.25 = **256.25k**. House C and D (size ≥ 1600): 337.5 + 81.25 = **418.75k**. New residuals: A: 150−256.25 = −106.25k. B: 200−256.25 = −56.25k. C: 400−418.75 = −18.75k. D: 600−418.75 = **+181.25k**. The average miss size (mean absolute error) drops from 162.5k to 90.625k — a 44% drop — and the mean squared error drops from 31,718.75 to 11,914.06, a **62.4%** drop, after touching only one shallow tree.`,

`Fit tree 2 to these new residuals — same three candidate thresholds, same size feature. Split at size < 1000: total squared error ≈ 32,603. Split at size < 1600 (tree 1's own split, tried again): 1,250 + 20,000 = 21,250 — identical arithmetic to before, because A/B and C/D's *within-group* spread hasn't changed even though the numbers themselves have. Split at size < 2500: left = {A, B, C: −106.25, −56.25, −18.75}, mean ≈ −60.42, squared error ≈ 2,101 + 17 + 1,736 ≈ 3,854; right = {D: +181.25}, error 0. Total ≈ **3,854** — now the clear winner, a full split away from where tree 1 drew its line.`,

`The split moved because the *residual pattern* moved. Tree 1 already fixed the small-vs-big gap; the biggest miss left standing is House D alone, still under-priced by 181.25k. Tree 2 isolates exactly that. This is the whole mechanism in miniature: **boosting never re-groups by the original target — only by whichever residual is currently largest.**`,

{ type: 'scene', sceneId: 'residual_relay' },

`Tree 2's leaves: left (A, B, C) mean ≈ −60.42, scaled by η=0.5 → −30.21k; right (D) mean = 181.25, scaled → +90.63k. New predictions F₂: A and B → 226.04k, C → 388.54k, D → **509.38k**. New residuals: −76.04, −26.04, +11.46, +90.63. Mean squared error falls to ≈3,701 — an **88.3%** cumulative drop from F₀'s 31,718.75, after exactly two shallow trees. Two careful steps closed most of the gap; this module's separate boosting-rounds interactive carries the same idea further on a new curve, running eight rounds total and letting you watch training and held-out error diverge once the steps get too large.`,

`Here is the idea that turns this from a neat trick into a general engine. You already know gradient descent: nudge a model's *numbers* a little in the direction that lowers the loss, repeat. Boosting does the same thing to a *function* instead — each round nudges the whole prediction function by bolting on one more small tree. And the "residual" fit at every round is not just intuitively the right target — for squared-error loss it *is* the negative gradient of the loss with respect to the current prediction, exactly. Swap in a different loss and only the formula for "residual" changes: for log loss it becomes (actual − predicted probability); for ranking or for a specific quantile it's something else again. The recipe itself never changes — fit a tree to the negative gradient, shrink it, add it on. That is why gradient boosting chases almost any goal you can write down as a loss.`,

`For binary classification, that swap looks like this: the trees never see the raw 0/1 label. They fit the gradient of log loss in **logit (log-odds) space**, which works out to (actual − predicted probability) — the same residual idea, just computed after the sigmoid. So the trees accumulate **margins/logits**, and only at the very end does a sigmoid function σ(z) = 1/(1+e⁻ᶻ) [maps any real logit into a probability between 0 and 1] turn the summed logit into a probability — the same final step logistic regression uses, but with a sum of trees producing the logit instead of a linear equation.`,

`Two dials, established above, keep this from wrecking itself, and recall why each exists: trees are kept deliberately shallow (depth 3–5) — the opposite of a random forest's "deeper is fine," because here each tree is one gradient step and a big greedy one overshoots the current residual's noise. And η, which you've now watched shrink two real contributions to ∓81.25k and then ∓30–90k, trades step size for step count — smaller η needs more trees but tends to land somewhere better. A third dial replaces guessing the tree count entirely: **early stopping** — keep adding trees, watch a held-out score, stop the moment it stops improving.`,

`Plain gradient boosting, exactly as run by hand above, already works. So what was left for XGBoost to invent? Two things: it doesn't fully trust the tree-fitting step used above (minimise within-leaf squared error), because that specific rule only works cleanly for squared-error loss — for log loss or ranking, "minimise squared error of the residual" isn't even the right objective. And it has no built-in brake on split-happy trees beyond depth and η. XGBoost fixes both with one **regularized objective**, made explicit rather than left implicit:`,

`$Obj = Σᵢ L(yᵢ, ŷᵢ) + Σₜ [γTₜ + ½λ‖wₜ‖²]$`,

`Tₜ is the number of leaves in tree t (a count XGBoost controls directly), wₜ its leaf values, γ a penalty per leaf and λ an L2 penalty shrinking leaf values — both are hyperparameters fixed before training, dials you set, not anything learned. To make this workable for *any* differentiable loss, XGBoost doesn't minimise the true loss at each step — it Taylor-expands the loss around the current prediction, keeping terms up to second order: L(yᵢ, Fₜ₋₁(xᵢ)+f) ≈ L(yᵢ,Fₜ₋₁(xᵢ)) + gᵢf + ½hᵢf². gᵢ is the **gradient** (first derivative) — the same residual-flavoured quantity used above. hᵢ is the **Hessian** (second derivative) — how sharply the loss curves at that prediction — new, and worth asking why it's needed at all.`,

`Recompute g and h for the four houses at F₀, using the convention L = ½(y−ŷ)² (chosen so the derivatives come out clean): gᵢ = ŷᵢ−yᵢ = −(residual), hᵢ = 1 for every sample, always, for squared-error loss. House A: g=187.5, h=1. House B: g=137.5, h=1. House C: g=−62.5, h=1. House D: g=−262.5, h=1. Every Hessian is exactly 1 — flat, carrying no information beyond "one sample counted here." So here's a fair objection: if the curvature term is just a constant 1, why does XGBoost bother computing it for regression at all?`,

`Two answers, both checkable. First: the gain formula that uses g and h must also work for losses where the Hessian is *not* constant — for log loss, hᵢ = pᵢ(1−pᵢ), the predicted probability's own variance. A confidently-classified row at p=0.95 has h = 0.95×0.05 = **0.0475**; a maximally uncertain row at p=0.50 has h = 0.5×0.5 = **0.25** — over 5× larger. The Hessian is measuring exactly how much the loss curves at that prediction, and for squared error it happens to curve the same everywhere (flat parabola, curvature 2 for every point, or 1 under the ½ convention used here) — the constant-1 case is the *boring* special case, not the general rule. Second, and directly checkable on the house data: XGBoost's split-scoring **gain formula**, expressed with g and h, has to reduce to exactly what tree 1 computed by hand above when h is constant — which is exactly the sanity check below.`,

`Gain(split) = ½[G²_L/(H_L+λ) + G²_R/(H_R+λ) − G²_root/(H_root+λ)] − γ, where G_L = Σ gᵢ over the left group, H_L = Σ hᵢ over the left group (same for R and root). Take λ=0, γ=0 and re-score tree 1's three candidate splits. Root: G=187.5+137.5−62.5−262.5=0, H=4. Split at size<1600 (A,B | C,D): G_L=325, H_L=2; G_R=−325, H_R=2. Gain = ½[325²/2 + 325²/2 − 0] = ½[52,812.5+52,812.5] = **52,812.5**. Split at size<1000: G_L=187.5,H_L=1; G_R=−187.5,H_R=3 → Gain = ½[35,156.25 + 11,718.75] = **23,437.5**. Split at size<2500: G_L=262.5,H_L=3; G_R=−262.5,H_R=1 → Gain = ½[22,968.75+68,906.25] = **45,937.5**. Same winner, same order, as the plain-SSE calculation above — because with h=1 and λ=0, Gain is exactly ½ × the SSE the split removes (52,812.5 = ½ × (126,875−21,250) = ½×105,625). The formula generalises the exact same idea "reduce squared error" so it still works when the loss isn't squared error.`,

{ type: 'scene', sceneId: 'gain_bars' },

`λ earns its keep once it's non-zero. The leaf's optimal weight, derived by minimising the Taylor expansion with respect to the leaf value, is w* = −G/(H+λ) — at λ=0 this is just −G/H, the plain group mean used above (−325/2 = −162.5, matching tree 1's left leaf exactly). Set λ=2: w*_L = −325/(2+2) = **−81.25** — half of the unregularized value. Set λ=6: w*_L = −325/(2+6) = **−40.625** — smaller still, and a leaf with more samples (higher H) resists the same λ more than a sparse one, since λ competes against H, not against a flat multiplier. This is a genuinely different mechanism from η: **η shrinks every tree's total output uniformly, after fitting; λ shrinks the optimal weight *inside* each leaf, during fitting, and shrinks sparse leaves harder than well-supported ones.** Both regularize, neither replaces the other.`,

`γ is the plainest of the three: a split must clear it or it doesn't happen. At λ=2, split at size<1600 scores Gain = ½[26,406.25+26,406.25−0] = 26,406.25. Set γ = 30,000 and that split is **refused** — the node stays a single leaf, even though a real residual pattern is sitting right there, because the improvement doesn't clear the cost of adding two more leaves to the tree. That is the "minimum-benefit bar" made numeric.`,

`One more engineering problem plain gradient boosting doesn't solve: what does a tree do with a feature value that's simply *missing*? Add a second, hypothetical feature to the four houses — renovation_year, recorded as 2010 for House B and 2015 for House D, missing for A and C. Try a candidate split at year < 2012. Rows B and D have a real value to compare; A and C do not. XGBoost's answer is **sparsity-aware split finding**: try sending every missing row left, score it; try sending them all right, score it; keep whichever direction scores higher as that split's permanent default. Missing → left: left = {A,B,C} (G=262.5,H=3), right = {D} (G=−262.5,H=1) → Gain = ½[68,906.25/3 + 68,906.25] = **45,937.5**. Missing → right: left = {B} (G=137.5,H=1), right = {A,C,D} (G=−137.5,H=3) → Gain = ½[18,906.25 + 6,302.08] = **12,604.17**. Missing-left wins by more than 3.6×, so "left" is stored as this split's learned default — any future row missing renovation_year is routed left automatically, with no imputation step at all.`,

{ type: 'scene', sceneId: 'missing_route' },

`Scale is the last piece. Four houses have only three candidate size-thresholds to test — cheap to try all of them exhaustively, which is exactly what was done above. A real feature column can carry millions of distinct values, and testing every one at every split, at every tree, is the actual bottleneck of training. XGBoost's **weighted quantile sketch** approximates the search: instead of every unique value, it buckets candidates into a few hundred thresholds, chosen as percentiles of the feature — but weighted by each row's **Hessian**, not by a plain row count. Recall the p=0.5 vs p=0.95 contrast above (h=0.25 vs h=0.0475): a row near p=0.5 carries roughly 5× the weight of a confident one in the sketch, so the limited bucket budget gets spent where the loss is most curved and least settled — exactly the region where getting the threshold right actually matters, not wasted on already-confident predictions.`,

`Two more dials borrow bagging's trick without renaming it: **subsample** gives each tree a random fraction of the *rows* (say 80%), and **colsample_bytree** gives each split a random fraction of the *columns* — so on a dataset with 20 features, one tree might only ever consider 16 of them per split. Neither changes the gain formula; both reduce how correlated consecutive trees' mistakes are, the same diversity argument the random forest module made for bagging, reused here for a different reason (speed and mild variance control, since bias-reduction is boosting's whole job already).`,

`Know the resulting hyperparameters by name: \`learning_rate\` (η) — step size; \`n_estimators\` — tree count (let early stopping set it); \`max_depth\` — shallow, 3–6; \`min_child_weight\` — minimum Σh per leaf, a stronger overfitting guard than a raw sample count since it accounts for each row's curvature; \`gamma\` — the minimum split gain; \`subsample\` / \`colsample_bytree\` — row/column sampling; \`reg_lambda\` (λ, L2) / \`reg_alpha\` (L1) on leaf weights; \`scale_pos_weight\` for imbalance; \`eval_metric\` for early stopping. The high-leverage trio to tune first is learning_rate × n_estimators (traded off against each other) plus max_depth.`,

`Because boosting relentlessly hunts whatever residual is largest, it will happily latch onto a leaky feature and inflate a validation score in a way a forest's averaging would partly wash out. Validation discipline matters more here than anywhere: **time-based splits** for temporal data, **group-based splits** when rows cluster per entity, and early stopping run on a genuine validation fold — never the test set, or the test set has leaked into model selection. A boosting model that looks suspiciously good usually has a leak.`,

`XGBoost exposes three importance types and they disagree: **weight** (how often a feature is split on), **cover** (how many samples its splits touch), and **gain** (how much its splits actually improved the loss — usually the most meaningful of the three). Never quote "feature importance" without saying which one. And as with forests, correlated features distort all three — cross-check with permutation importance or SHAP.`,

`XGBoost, LightGBM, and CatBoost are not interchangeable. **XGBoost** is the stable, general-purpose default — everything derived above is its mechanism. **LightGBM** grows trees leaf-wise instead of level-wise and buckets feature values more aggressively, so it's usually much faster on large data (at a slightly higher overfitting risk on small data). **CatBoost** handles categorical features natively via ordered target statistics and often wins on categorical-heavy data with less preprocessing. Rough guide: large data → LightGBM; lots of categoricals → CatBoost; safe default → XGBoost.`,

`Under class imbalance, boosting handles rare classes better than most models by default, but still tune \`scale_pos_weight\` (roughly negatives/positives) to up-weight the minority, move the decision threshold, and judge with PR-AUC or recall@K rather than raw accuracy. Check calibration too — heavy imbalance plus regularisation can leave predicted probabilities off even when the ranking of predictions is good.`,

`Zoom out to the crisis this module opened with. A random forest reduces variance and stops — it cannot touch bias, because every tree attacks the same problem independently. Gradient boosting attacks bias directly, by training trees in a sequence where each one's entire job is the residual the team has left over — and that residual is the negative gradient of whatever loss you hand it, so the same recipe reaches regression, classification, and ranking alike. XGBoost's contribution sits one layer beneath that: a Taylor-expanded, regularized objective that scores every candidate split with both gradient and Hessian, so the exact same gain formula that reduces cleanly to plain SSE-reduction for regression also holds together for losses where the curvature genuinely varies — which is precisely why it, and its descendants, still win most tabular-data competitions.`,
],
    keyPoints: [
      `**What gradient boosting is, and when to reach for it: trees trained in a line, each one fixing the team's leftover mistakes.**\n\nOnce it is tuned, gradient boosting is usually the most accurate thing you can run on tabular data — it chips away at both bias and variance, where a random forest only fights variance. That accuracy is why it wins most structured-data competitions. Use XGBoost or LightGBM instead of the basic scikit-learn version: both are faster, come with regularisation built in, and support early stopping out of the box. Lean on LightGBM for very large datasets (its leaf-by-leaf growth is quicker) and XGBoost for smaller ones, where the extra caution against overfitting helps.`,
      `**The trap: fixing the number of trees up front instead of letting early stopping choose it.**\n\nWith a learning rate of 0.1 and 1000 trees hard-coded, the held-out loss usually bottoms out somewhere around 200–400 trees and then starts climbing as the extra trees begin memorising noise. Hard-code the count and you sail right past the best point into an overfit model. Instead, always turn on early stopping (stop after about 50 rounds with no improvement) and let the model pick its own tree count. Then, to squeeze out a little more, lower the learning rate and re-run — smaller steps often reach a slightly better place.`,
      `**The check to run: plot the training loss and the held-out loss against the number of trees.**\n\nHeld-out loss still falling means you are underfitting — add trees or lower the learning rate. Held-out loss flat and close to the training loss means you are in good shape. Held-out loss creeping up while training loss keeps dropping means you are overfitting — stop earlier, use shallower trees, or let each tree see only a random subset of the rows. If the held-out loss never comes down at all, your learning rate is probably too high; start it around 0.05 to 0.1.`,
      `**Place it in the family and know the objective: AdaBoost reweights rows, gradient boosting fits the gradient of any loss, and XGBoost regularises explicitly.**\n\nAdaBoost up-weights misclassified rows; gradient boosting generalises that to fitting each tree to the negative gradient of a differentiable loss (AdaBoost ≈ gradient boosting with exponential loss). For binary classification the trees fit the log-loss gradient (actual − predicted probability) in logit space and are squashed to probabilities only at the end. XGBoost's objective is loss + γT + ½λ‖w‖², and it scores splits with gradients *and* Hessians minus γ — a split must clear γ to be made.`,
      `**Second-order matters even though squared-error's Hessian is a constant 1: the same gain formula must also work when it isn't.**\n\nXGBoost Taylor-expands the loss to second order per sample — gradient g and Hessian h — instead of only using the residual. For squared-error loss h=1 for every row, so the extra term looks pointless there; but for log loss h = p(1−p), which swings from 0.25 at maximum uncertainty (p=0.5) down to about 0.05 at high confidence (p=0.95). The Hessian is literally how much the loss curves at that prediction — flat and constant for squared error, sharply variable for log loss — and the gain formula, Gain = ½[G²_L/(H_L+λ) + G²_R/(H_R+λ) − G²_root/(H_root+λ)] − γ, has to hold together for both. With λ=0 it reduces to exactly half the squared-error reduction a plain regression-tree split removes — a checkable sanity floor, not just an assertion.`,
      `**λ and η are two different regularisers, not the same dial twice — and missing values get a learned route, not an imputed value.**\n\nη (learning rate) rescales every tree's total output uniformly, after the tree is fit. λ (L2 on leaf weights) shrinks the *optimal* leaf weight w*=−G/(H+λ) during fitting itself, and shrinks a sparsely-supported leaf harder than a well-populated one, since λ competes against each leaf's own Σh. Missing feature values get **sparsity-aware split finding**: XGBoost tries routing them both directions at each candidate split and keeps whichever scores higher gain as that split's permanent default — no imputation. And at scale, exhaustively testing every unique feature value is the real bottleneck, so XGBoost's **weighted quantile sketch** buckets candidates by Hessian-weighted percentiles instead, spending its resolution on the uncertain, high-curvature region of the data rather than treating every row equally.`,
      `**Boosting is leakage-sensitive, so tune the right knobs and validate honestly.**\n\nBecause it hunts the residual, boosting will exploit a leaky feature that a forest averages away — so use time-based or group-based splits and run early stopping on a validation fold, never the test set. Key knobs: \`learning_rate\`×\`n_estimators\` (traded off), \`max_depth\`, \`min_child_weight\`, \`gamma\`, \`subsample\`/\`colsample_bytree\`, \`reg_lambda\`/\`reg_alpha\`, and \`scale_pos_weight\` for imbalance. Rough library map: large data → LightGBM (leaf-wise, fast), categorical-heavy → CatBoost (native handling), safe default → XGBoost. And name which importance you mean — weight, cover, or gain (gain is usually most meaningful) — since they disagree and correlated features distort all three.`,
    ],
    interactivePrompt: `Before you touch the controls: if you halve the learning rate, do you expect the optimal number of trees to increase, decrease, or stay the same?`,
    checkQuestions: [
      {
        q: `A random forest on your data plateaus at 88% no matter how many trees you add. Why does boosting have a real shot at doing better?`,
        options: [
          `\`A) Boosting simply uses deeper trees than a forest, and deeper trees always capture more pattern, breaking past any ceiling a shallow-tree forest hits.\``,
          `\`B) In a forest every tree predicts from scratch and votes, sharing blind spots; boosting instead trains trees in sequence, each fixing what's left over.\``,
          `\`C) Boosting can train far more trees than a forest ever could, and past roughly 10,000 trees the sheer count averages away whatever error the forest had.\``,
          `\`D) Boosting uses a completely different base model, linear models instead of trees, which simply don't share the blind spots that make a tree forest plateau.\``,
        ],
        answer: `B`,
      },
      {
        q: `In gradient boosting for a regression problem, what is each new tree actually trained to predict?`,
        options: [
          `\`A) The true house price directly, exactly like every tree in a random forest, with trees then averaged together to smooth their individual errors out.\``,
          `\`B) A reweighted copy of the original target, where rows the team got wrong are duplicated many times so the next tree naturally pays them more attention.\``,
          `\`C) The current misses — how far off the running prediction is on each row — adding a shrunk correction so each tree chips away at leftover error.\``,
          `\`D) A yes/no flag for whether the current prediction is too high or too low, which the ensemble uses to nudge every prediction by one fixed amount.\``,
        ],
        answer: `C`,
      },
      {
        q: `You train XGBoost with 1000 trees at learning rate 0.1. The held-out loss bottoms out around tree 200, then starts rising. Select the two true statements about what is going on and what to do.`,
        options: [
          `\`A) The extra trees past 200 are memorising training noise — this is overfitting, and the real best tree count sits near 200, not the full 1000.\``,
          `\`B) Turn on early stopping (roughly 50 rounds without improvement) so the model picks its own stopping point instead of a hard-coded tree count.\``,
          `\`C) The rise after tree 200 means the learning rate is far too high; dropping it to 0.01 alone makes the loss fall smoothly all the way to tree 1000.\``,
          `\`D) The flattening at tree 200 means full convergence and the later rise is just noise in the estimate, so all 1000 trees should still be kept.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why is gradient boosting called "gradient descent in function space," and why does that let it handle classification, ranking, and custom goals with the same algorithm?`,
        options: [
          `\`A) Ordinary descent nudges numbers to lower loss; boosting nudges the whole prediction function by adding a tree fit to the negative gradient each step.\``,
          `\`B) Each tree literally stores the derivative of the loss in its leaves, so summing trees equals summing derivatives — exactly Newton's method for any loss.\``,
          `\`C) Boosting searches the space of every possible function at once and picks the single best one, jumping to the global optimum in a single pass.\``,
          `\`D) The trees are secretly linear models in a transformed feature space, and linear models train under any loss, which is what carries over here.\``,
        ],
        answer: `A`,
      },
      {
        q: `How does AdaBoost differ from gradient boosting, and how does gradient boosting do binary classification?`,
        options: [
          `\`A) AdaBoost and gradient boosting are the same algorithm under two names; both fit residuals, and both fit raw 0/1 labels with squared-error loss.\``,
          `\`B) AdaBoost reweights misclassified rows; gradient boosting instead fits each tree to the negative gradient of whatever loss it's handed.\``,
          `\`C) AdaBoost fits gradients of a general loss while gradient boosting only reweights rows, making gradient boosting the older and less flexible one.\``,
          `\`D) Gradient boosting cannot do classification at all, regression-only, which is why AdaBoost still has to be used separately for any yes/no task.\``,
        ],
        answer: `B`,
      },
      {
        q: `Your XGBoost model scores a suspiciously high 0.99 AUC on a random 80/20 split of time-ordered transaction data. What is the most likely problem?`,
        options: [
          `\`A) Nothing is wrong — XGBoost is simply that accurate on tabular data, so 0.99 on a random split is a trustworthy estimate of real production performance.\``,
          `\`B) The learning rate is too low, which artificially inflates AUC on the validation split; raising it settles the 0.99 down to a realistic number.\``,
          `\`C) A random split lets the model train on future rows and predict past ones; boosting exploits that leakage, so use a time-based split instead.\``,
          `\`D) The AUC is high purely because XGBoost has too many trees; capping n_estimators at 50 makes the leakage vanish along with the inflated score.\``,
        ],
        answer: `C`,
      },
      {
        q: `For squared-error loss, every sample's Hessian works out to a constant 1 — so why does XGBoost bother computing a Hessian at all, instead of using only the gradient like plain gradient boosting?`,
        options: [
          `\`A) For squared error the Hessian is flat and adds little; the same gain formula also has to hold for losses like log loss, where h=p(1−p) varies by row.\``,
          `\`B) The Hessian replaces the gradient entirely once a tree passes depth 3, letting XGBoost skip recomputing residuals for every later tree in the ensemble.\``,
          `\`C) Gradients alone can only ever point in one shared direction, so the Hessian's sign is what tells XGBoost whether to add or subtract a leaf's contribution.\``,
          `\`D) The Hessian is only applied after training finishes, as a pruning pass, and has no role in which split gets chosen while a tree is being actively fit.\``,
        ],
        answer: `A`,
      },
      {
        q: `You raise λ (leaf L2 regularisation) in XGBoost's gain formula while G and H stay fixed. What actually happens, and how is this different from lowering the learning rate η instead?`,
        options: [
          `\`A) Every split's gain shrinks and the leaf weight w*=−G/(H+λ) shrinks with it — regularising the fitted value itself, separately from η's post-fit rescale.\``,
          `\`B) Nothing changes about any split's gain, only γ's minimum-gain bar moves, so raising λ alone can never flip a split from passing to failing outright.\``,
          `\`C) G_L and G_R get rescaled directly by λ before the split search runs, which ends up mathematically identical to lowering η for every tree in the ensemble.\``,
          `\`D) Raising λ increases each leaf's optimal weight w*=−G/(H+λ), since a larger denominator paired with the same numerator always yields a larger result.\``,
        ],
        answer: `A`,
      },
      {
        q: `A future row is missing the feature a trained XGBoost split used. Select the two true statements about what happens and why the weighted quantile sketch is weighted by Hessian rather than by a plain row count.`,
        options: [
          `\`A) The row follows a default direction learned at training time — whichever side scored higher gain when missing rows were tried both ways during fitting.\``,
          `\`B) The sketch weights candidates by Hessian because that measures how sharply the loss curves at each row — more curvature earns finer split resolution.\``,
          `\`C) The row is re-imputed as the training mean of that feature just before prediction, then routed left or right using that filled-in, imputed value.\``,
          `\`D) The sketch buckets candidate thresholds uniformly by feature value, giving every row equal weight regardless of how confidently it's predicted.\``,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `Gradient boosting trains trees in a line, each fitting the team's current residual — and that residual is literally the loss gradient, so every tree is one careful step of gradient descent on the prediction function, reaching regression, classification, and ranking with the same recipe. XGBoost's edge sits one layer beneath that: a Taylor-expanded, regularized objective that scores every split with both gradient and Hessian, so the same gain formula that reduces to plain squared-error reduction for regression also holds together for losses where curvature genuinely varies — plus a learned default route for missing values and a Hessian-weighted sketch for finding splits at scale.`,
    recap: [
      "**Random forest fixes variance, not bias** — gradient boosting attacks bias directly: trees trained in a line, each fitting the team's current residual.",
      "**Residual = negative gradient of the loss** → fit a tree to it, shrink by η, add it in, repeat — gradient descent in function space.",
      "**Handles any differentiable loss** this way: regression residual, or (actual − predicted probability) in logit space for classification, squashed by sigmoid only at the end.",
      "**Two control dials, one recipe:** trees stay shallow (3–5) so no single step overshoots; η shrinks each step; early stopping (not a fixed tree count) sizes the ensemble.",
      "**XGBoost's objective:** Obj = Σ L(y,ŷ) + Σ[γT + ½λ‖w‖²] — Taylor-expand the loss to gradient g **and** Hessian h per sample (h=1 for squared error, h=p(1−p) for log loss).",
      "**Gain = ½[G²_L/(H_L+λ) + G²_R/(H_R+λ) − G²_root/(H_root+λ)] − γ** — reduces to ½×SSE-reduction when λ=0,h=1; a split must clear γ or the node stays a leaf.",
      "**λ ≠ η:** λ shrinks the optimal leaf weight w*=−G/(H+λ) during fitting (harder on sparse leaves); η rescales every tree's whole output after fitting.",
      "**Sparsity-aware routing:** missing values tried both directions per split, higher-gain direction becomes the learned default — no imputation.",
      "**Weighted quantile sketch:** approximates split search via Hessian-weighted buckets, spending resolution where the loss curves most.",
      "**Family:** AdaBoost reweights rows, gradient boosting fits the gradient, XGBoost regularises explicitly + uses curvature.",
      "**Leakage-sensitive** — tune the right knobs (learning_rate×n_estimators, max_depth, min_child_weight, subsample/colsample) and validate with time- or group-based splits.",
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
          `\`A) The meta-learner is too complex and simply memorised the base models' outputs; swap it for a plain unregularised linear model to close the gap.\``,
          `\`B) The base models are too similar, so correlated outputs confuse the meta-learner into chasing spurious patterns; drop all but one of them entirely.\``,
          `\`C) Leakage: base models partly memorised their own rows, so those predictions look too good. Fix with out-of-fold predictions.\``,
          `\`D) The training set is too big for the meta-learner, finding patterns that don't generalise; subsample to roughly ten times the base-model count.\``,
        ],
        answer: `C`,
      },
      {
        q: `Three so-so models combine into an ensemble that beats the best of them. What makes that possible?`,
        options: [
          `\`A) The ensemble quietly picks whichever single model is best on each example and copies its answer, so it never does worse than the strongest member.\``,
          `\`B) The models are wrong in different places, so voting outvotes each one's mistakes while correct answers agree; this fails when errors are correlated.\``,
          `\`C) Averaging always beats any single model mathematically regardless of which ones are involved, reducing error by a factor equal to the model count.\``,
          `\`D) Each model corrects the previous one's leftover errors in turn, so mistakes shrink step by step, which is why chained weak models beat the strongest one.\``,
        ],
        answer: `B`,
      },
      {
        q: `Two models are wrong on exactly the same examples. Select the two true statements about what combining them gets you.`,
        options: [
          `\`A) Nothing — with identical errors there is nothing to cancel, so the ensemble scores about the same as either model would alone on its own.\``,
          `\`B) It shows diversity, not model count, is what makes ensembles work: unrelated errors cancel out through voting, while identical ones simply do not.\``,
          `\`C) A big jump — combining two models always multiplies their strengths, so even identical-error models land comfortably above either one alone.\``,
          `\`D) The higher of the two accuracies, since probability averaging amplifies the more confident model's correct answers and discards the weaker model's mistakes.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You switch a voting ensemble from hard voting to soft voting (averaging probabilities) and it gets worse. One base model is badly overconfident. Why did soft voting hurt?`,
        options: [
          `\`A) Soft voting is always worse than hard voting because averaging probabilities discards the majority signal entirely; revert to hard voting as a rule.\``,
          `\`B) An uncalibrated, overconfident model pushes extreme probability values that dominate the average, dragging the ensemble toward its own mistakes.\``,
          `\`C) The overconfident model simply has too few trees, so its probabilities are noisy; adding more trees to just that model fixes soft voting entirely.\``,
          `\`D) Soft voting requires all base models to share the same algorithm; mixing a tree with a linear model is what actually broke it, not calibration.\``,
        ],
        answer: `B`,
      },
      {
        q: `You're stacking models on time-ordered transaction data and generate out-of-fold meta-features with a plain random K-fold split. What's the risk?`,
        options: [
          `\`A) No risk — out-of-fold predictions are leak-proof by construction, so a random split is always safe for stacking regardless of data type.\``,
          `\`B) The only risk is slower training; random folds are statistically fine for time-series stacking, just less compute-efficient than time-ordered ones.\``,
          `\`C) A random fold lets a base model train on future rows and predict a past row, leaking the future into meta-features; use time-ordered folds instead.\``,
          `\`D) The risk is the meta-learner overfits, fixed by using a more powerful meta-learner such as a boosting model stacked on the base predictions.\``,
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
        q: `Your SVM with RBF kernel underfits the training data. Select the two adjustments that would actually help, each with its risk.`,
        options: [
          `\`A) Increase C (fewer margin violations, tighter fit). Risk: the boundary turns wiggly and stops generalising past the training set — classic overfitting.\``,
          `\`B) Increase γ (a tighter, more localised RBF kernel). Risk: at high γ the model memorises training points inside tiny "bubbles," again overfitting.\``,
          `\`C) Switch from RBF to a degree-5 polynomial kernel, since higher-degree polynomial kernels always add more raw capacity with no numerical downside at all.\``,
          `\`D) Reduce C sharply (e.g. C=0.01), since underfitting with RBF always means C is too high, penalising slack variables far more than needed here.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Explain the kernel trick. Why does it work, and what mathematical condition must a function k(x,x') satisfy to be a valid kernel?`,
        options: [
          `\`A) It replaces each point xᵢ with φ(xᵢ) before the SVM runs; the condition is that φ be a bijection, guaranteeing the mapped problem has an equivalent solution.\``,
          `\`B) The dual SVM only needs dot products xᵢᵀxⱼ, so any k(x,x')=φ(x)ᵀφ(x') can substitute. Condition: k must be symmetric and positive semi-definite (Mercer's theorem).\``,
          `\`C) It approximates the feature-space inner product via a Taylor expansion of k(x,x'); the condition is that this series converges uniformly across the training set.\``,
          `\`D) It computes similarity k(xᵢ,xⱼ) directly from raw inputs; the condition is that k be a monotone decreasing function of the distance between the two points.\``,
        ],
        answer: `B`,
      },
      {
        q: `SVMs and logistic regression both find a linear separator. In what situations would you prefer one over the other?`,
        options: [
          `\`A) Prefer SVM for small, high-dimensional, well-separated data; prefer LR for calibrated probabilities, large n, or interpretability.\``,
          `\`B) Always prefer logistic regression: it learns the same weight vector as a linear SVM when separable, and additionally gives calibrated probabilities outright.\``,
          `\`C) Prefer SVM whenever class imbalance is present, since its margin criterion is fully independent of class frequency while LR's loss biases toward the majority.\``,
          `\`D) Prefer logistic regression for all practical applications now; every SVM advantage can be replicated with feature engineering, so SVMs are only academic today.\``,
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
          `\`A) Training data grows sparse — millions of points across 1000 dimensions leave most volume empty, so no neighbours exist within any radius; more data alone fixes it.\``,
          `\`B) KNN's O(nd) inference time becomes prohibitive at d=1000; the failure is purely computational, and approximate-neighbour indexes restore full accuracy instantly.\``,
          `\`C) Curse of dimensionality: nearest and farthest distances converge to nearly the same value, so local averaging breaks down here.\``,
          `\`D) At d=1000, Euclidean distance violates the triangle inequality entirely, so switching to cosine similarity alone restores a working metric without any reduction.\``,
        ],
        answer: `C`,
      },
      {
        q: `A production recommendation system uses KNN with n=50M items and d=256-dimensional embeddings. Brute-force KNN is too slow. Select the two correct parts of a sound architecture here.`,
        options: [
          `\`A) Build an ANN index offline (HNSW or FAISS IVF) over the 50M embeddings, then query it online for a shortlist of top-k approximate candidates per user.\``,
          `\`B) Re-rank that shortlist with a more expensive scoring function or learned ranker — the classic retrieve-and-rerank pattern used across production search.\``,
          `\`C) Reduce d=256 to d=16 with PCA and keep brute-force search, since compressing that aggressively at recommendation scale carries essentially no recall cost.\``,
          `\`D) Shard the 50M items across 100 machines and run brute-force KNN in parallel per shard, which reaches sub-100ms latency with zero accuracy loss.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `When would you choose KNN over a trained classifier like logistic regression or a decision tree?`,
        options: [
          `\`A) Choose it when n is very large (n > 1M), since KNN needs zero training time while logistic regression and trees scale with training-set size instead.\``,
          `\`B) Choose it when features are all categorical, since Hamming distance beats log-odds coefficients and consistently outperforms trees on categorical tabular data.\``,
          `\`C) Choose it when the boundary is irregular and non-linear, training data is small and low-dimensional, you need online learning, or instance-level explanations matter.\``,
          `\`D) Choose it whenever the positive class prior is below 10%, since local density estimation near rare classes is naturally unaffected by global imbalance.\``,
        ],
        answer: `C`,
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
        q: `In Multinomial NB for spam detection, a test email contains the word "win" which appears in 0% of spam emails in training. Without Laplace smoothing, select the two true statements about what happens.`,
        options: [
          `\`A) Since NB multiplies all feature probabilities, the whole product P(x|spam) becomes exactly 0, so the email can never be classified as spam regardless of other words.\``,
          `\`B) Laplace smoothing adds α=1 to counts so P("win"|spam) becomes small but non-zero, letting the other, genuinely spammy words still decide the classification.\``,
          `\`C) P("win"|spam)=0 gets skipped as a feature entirely, so the classifier proceeds using only the remaining words in the email to reach its final decision.\``,
          `\`D) The zero probability only makes the log-posterior for spam negative infinity while ham's stays finite, so the model classifies it as ham by strict default.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why does Naïve Bayes often outperform logistic regression on text classification when training data is small?`,
        options: [
          `\`A) NB benefits purely from words being actually independent in real text, which makes it the mathematically optimal Bayesian classifier whenever that holds true.\``,
          `\`B) Logistic regression's gradient descent converges slowly on sparse text vectors while NB's closed-form counting reaches its optimum in a single pass always.\``,
          `\`C) NB's independence assumption acts as strong regularisation, preventing it from memorising training-specific word co-occurrence patterns that LR would overfit.\``,
          `\`D) NB estimates generative per-class word counts, which stay stable with tiny n; LR must fit one weight per word discriminatively and overfits in high dimensions with little data.\``,
        ],
        answer: `D`,
      },
      {
        q: `Your Naïve Bayes classifier outputs P(spam)=0.99 for an email. How confident should you be, and what would you do if calibrated probabilities are required?`,
        options: [
          `\`A) P(spam)=0.99 is reliable exactly as a probability — use it directly as a confidence score and set the threshold from the acceptable false-positive rate alone.\``,
          `\`B) NB probabilities are well-calibrated for balanced binary classification specifically; the independence bias toward 0 and 1 only shows up in multiclass problems.\``,
          `\`C) NB posteriors are poorly calibrated, converging toward 0/1 faster than truth. Fix with Platt scaling or isotonic regression on a separate calibration set.\``,
          `\`D) The 0.99 is overconfident purely from double-counting repeated words; switching to a binary bag-of-words alone removes the bias with no calibration step needed.\``,
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
          `\`A) It is overconfident — 0.9 really means about 0.6 in reality. Fit a correcting function on a held-out calibration set.\``,
          `\`B) It is underconfident — since most of the 0.9 cases really are positive, the model is basically right, and you only need to act above a 0.15 error.\``,
          `\`C) Nothing is wrong with the probabilities; the network simply needs more training epochs so the outputs naturally settle closer to 0.6 with no other change.\``,
          `\`D) The labels on those cases are noisy; relabel the batch so its positive rate matches 0.9, and the reported probability becomes correct again untouched.\``,
        ],
        answer: `A`,
      },
      {
        q: `A credit model has a superb AUC of 0.95 but a bad calibration error. What does that combination actually mean?`,
        options: [
          `\`A) It is a contradiction — a high AUC guarantees good calibration, so one of the two numbers must be wrong and the evaluation should be redone.\``,
          `\`B) It ranks cases beautifully — riskier applicants score higher — but its probability numbers are off, confidently wrong about the odds.\``,
          `\`C) It means the model is underfitting: a strong ranker with poor probabilities simply hasn't trained long enough, and more epochs will fix calibration alone.\``,
          `\`D) It means the test set is too small, since AUC and calibration error always agree on large datasets and only diverge when the sample is tiny.\``,
        ],
        answer: `B`,
      },
      {
        q: `You calibrate your model on the very same data it was trained on. Calibration looks perfect. Why is this a mistake?`,
        options: [
          `\`A) It is not a mistake — the training set is the largest slice you have, giving the most stable and reliable correcting function possible in practice.\``,
          `\`B) It only wastes computation, since the model already saw those rows; the fix works fine, you just could have used a smaller sample of the same data.\``,
          `\`C) The model partly memorised training rows, so scores there look artificially aligned with labels, fooling the fix into failing on genuinely new data.\``,
          `\`D) The only real issue is speed — calibrating on training data makes the correcting function converge slowly, purely a computational inconvenience.\``,
        ],
        answer: `C`,
      },
      {
        q: `Your model reports a low overall ECE, but a colleague says it might still be badly miscalibrated. Select the two true statements explaining how both can be right.`,
        options: [
          `\`A) ECE depends heavily on binning choice and sample size, and it can hide local miscalibration where errors in opposite directions average out to a small number.\``,
          `\`B) The Brier score is richer, since it decomposes into reliability, resolution, and uncertainty — always pair a scalar metric with the reliability diagram.\``,
          `\`C) They can't both be true — a low ECE mathematically guarantees good calibration everywhere, so the colleague's concern must simply be mistaken here.\``,
          `\`D) The discrepancy always means ECE was computed on the training set by accident; recomputing on test data alone resolves the disagreement completely.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Your neural network is overconfident. You apply temperature scaling. What does it do, and what does it deliberately leave untouched?`,
        options: [
          `\`A) It retrains the final layer on a calibration set, changing both the probabilities and the model's ranking so accuracy improves along with calibration.\``,
          `\`B) It divides the logits by one learned scalar T before the softmax; because it only rescales logits, ranking and accuracy stay completely unchanged.\``,
          `\`C) It clips every predicted probability to the range [0.05, 0.95], removing overconfidence by brute force but flattening ranking between clipped cases.\``,
          `\`D) It adds a temperature feature to the raw input and retrains the whole network, so the decision boundary and probabilities shift together as one.\``,
        ],
        answer: `B`,
      },
      {
        q: `An interviewer asks you to distinguish calibration from threshold tuning. What's the cleanest answer?`,
        options: [
          `\`A) They're the same operation — moving the decision threshold is exactly how you make probabilities honest, so calibrating just means picking a cutoff.\``,
          `\`B) Calibration makes the probability truthful; thresholding picks the action cutoff from business costs — related but separate steps.\``,
          `\`C) Calibration sets the cutoff and thresholding fixes probabilities — the two names are simply swapped across textbooks, referring to one combined step.\``,
          `\`D) Thresholding is only needed for calibrated models and calibration only for uncalibrated thresholds, so both are never performed on one model.\``,
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
    summary: `The last module was about trusting a model's predicted probabilities — checking whether its batch of 0.7-confidence calls really come true about 70% of the time, and fixing it with Platt or isotonic scaling when they don't. Put that same trained model on an imbalanced problem and a second, nastier failure shows up before calibration even becomes the issue — one that hides in the headline number itself. Imagine you are building a fraud detector for a bank, and a thousand transactions come in: 950 legitimate, 50 fraud — a 5% positive rate, imbalanced but not exotically so. Here is a "model" that never looks at a single feature: label *every* transaction legitimate. Score it. True positives: 0. False positives: 0. False negatives: 50 (every real fraud, missed). True negatives: 950. Accuracy = (0+950)/1000 = **95.0%** — and it is utterly worthless, because it never catches a single fraud, which was the whole point. This is the **accuracy trap**, and it makes **class imbalance** one of the sneakiest problems in machine learning: your headline number looks fantastic while the model does nothing useful.

[FIGURE: imbalance_skew]

Now score a real classifier trained on the same 1000 transactions, at the default 0.5 threshold (the cutoff score above which the model calls something fraud): it flags 70 transactions, and 35 of those are genuine fraud. True positives = 35, false positives = 35, false negatives = 15 (fraud it missed), true negatives = 915. Accuracy = (35+915)/1000 = **95.0%** — *identical* to the do-nothing model, to the decimal point. Two models, same accuracy, and one of them is actually finding fraud. Accuracy cannot tell them apart, because it was never built to see the rare class at all.

---

**Step one: stop measuring with accuracy.**

If accuracy lies, what do you look at instead? Two numbers that actually care about the rare class, scored on the same real classifier above:

**Recall** (also called sensitivity): of all the real frauds, what fraction did the model catch? Here, 35 of the 50 real frauds = 35/50 = **70%**. The do-nothing model's recall is 0/50 = **0%** — instantly exposed, where accuracy hid it completely.

**Precision**: of all the transactions the model flagged as fraud, what fraction really were? Here, 35 of the 70 flags = 35/70 = **50%** — half the fraud team's alerts are false alarms. (The do-nothing model never flags anything, so its precision is undefined — 0 by convention — a second signal accuracy missed.)

**F1**, the harmonic mean of the two, folds them into one number: 2×(0.5×0.7)/(0.5+0.7) = 0.7/1.2 = **58.3%** for the real classifier, versus **0%** for the do-nothing one. F1 finally shows the gap that a 95.0%-vs-95.0% accuracy tie completely erased.

There is usually a tug-of-war between precision and recall — flag more aggressively and you catch more fraud (higher recall) but with more false alarms (lower precision). The **PR-AUC** (the precision-recall area) captures that whole tradeoff in one number, and it is far more honest than the more common ROC-AUC when the positive class is rare, because ROC-AUC hands the model easy credit for correctly ignoring the huge majority.

---

**Step two: make the model care about the rare class — and watch what the fix actually costs.**

By default, training treats every example as equally important, so the rare class gets drowned out — nineteen "legit" examples for every "fraud" shout it down. Two ways to fix that.

The simplest, and usually the first to try, is **class weights**: tell the loss function that getting a fraud example wrong costs roughly 19 times more than getting a legit one wrong (950:50, the actual ratio in this data) — no new data, just a reweighted loss. Pause and predict before the retrain: with fraud weighted 19× more heavily against a false alarm, do you expect precision to rise, fall, or stay about the same once the model is retrained under that weighting? Retrain the same classifier with that weighting, same threshold, and here's the real effect on this dataset: true positives rise to 45 (of 50), false negatives fall to 5, but false positives rise to 90 and true negatives fall to 860. Recall = 45/50 = **90%**, up sharply from 70%. Precision = 45/(45+90) = 45/135 = **33.3%**, down from 50%. F1 = 2×(0.333×0.9)/(0.333+0.9) = 0.6/1.233 ≈ **48.6%** — actually *lower* than the unweighted classifier's 58.3%, even though recall improved. And accuracy? (45+860)/1000 = **90.5%** — it went *down*. Every one of these numbers moved in a real direction: class weights bought +20 points of recall for −16.7 points of precision, at the cost of accuracy and even F1. Whether that trade is worth it depends entirely on whether a missed fraud actually costs more than 19× a false alarm — which is exactly the question the cost matrix below makes precise, because F1 alone can't answer it.

Alternatively you can **rebalance the data itself**: **oversample** the rare class (duplicate it, or with **SMOTE**, create synthetic in-between examples) or **undersample** the majority (throw some of it away). These help distance-based models and neural nets, but for tree-based models class weights are usually cleaner and reach a similar recall/precision trade.

---

**Step three: choose the threshold on purpose.**

Here is the step almost everyone forgets — recall that both models scored above used 0.5 as that cutoff without anyone actually deciding it was right. A classifier gives a *score*; turning it into a yes/no needs a **threshold**, and the default of 0.5 is almost never right for an imbalanced, unequal-cost problem. Recall that the class-weighted retrain above reached 90% recall at 0.5 — but the same recall gain is often reachable a cheaper way: keep the *original* unweighted classifier's scores, and simply lower the cutoff instead of retraining. If missing a fraud is far worse than a false alarm, you want to flag on much weaker suspicion — a far lower threshold. So after training, pick the threshold *deliberately*: look at the precision and recall you get at each possible cutoff, and choose the one that matches what the problem actually costs. Train the model to rank well; then set the threshold to act well.

---

**Precision@K: when you can only act on a few.**

Often the real constraint isn't a threshold at all — it's *capacity*. A fraud team can investigate maybe 500 alerts a day; a doctor can review only so many flagged scans. In that world the question changes from "what's our recall?" to "of the **top 500** cases the model ranks as riskiest, how many are real fraud?" That's **precision@K** — precision measured on the top K by score. Its partners are **recall@K** (of all fraud, how much did the top K capture?) and **lift@K** (how much better than random is the top K?). When action is capacity-limited, optimise the ranking for precision@K, not a global threshold — the model just has to get the *worst* cases to the top of the list.

---

**The cost matrix, made explicit.**

"Missing a fraud is worse than a false alarm" can be written down precisely as a **cost matrix**: a dollar cost for each cell of the confusion matrix, drawn from the business itself rather than guessed — suppose the bank's own loss data says a false negative costs \\$2,000 (the average unrecovered fraud amount) and a false positive costs \\$5 (an analyst's few minutes clearing the alert), with true predictions costing 0. That's the number that actually settles the class-weight trade above: at \\$2,000 per miss and \\$5 per false alarm, the unweighted classifier's 15 misses and 35 false alarms cost 15×\\$2,000 + 35×\\$5 = \\$30,175, while the class-weighted classifier's 5 misses and 90 false alarms cost 5×\\$2,000 + 90×\\$5 = \\$10,450 — the weighted model is cheaper by a wide margin, even though its F1 was lower. Once you have a cost matrix, the optimal decision isn't a guessed threshold — it's the one that **minimises expected cost**: flag whenever the expected cost of flagging is below the expected cost of not flagging, which for a calibrated probability gives an exact optimal threshold. This is the rigorous version of "pick the threshold from the costs," and it's why calibrated probabilities matter here.

---

**SMOTE has sharp edges.**

The cost-matrix math above assumed the rebalancing choice behind it — class weights or resampling — was already sound. One of those options, SMOTE, deserves its own warning: it's popular but easy to misuse. The cardinal rule: **apply it only inside cross-validation folds, after the split — never before.** Oversample first and copies of the same synthetic points land in both train and validation, leaking and inflating your score. Beyond that, SMOTE struggles in high-dimensional sparse data (its "in-between" points are meaningless), with noisy labels (it amplifies the noise), with overlapping classes (it synthesises into the other class's territory), and with time-series (it invents points that violate temporal order). It's a tool, not a default.

---

**Resampling distorts your probabilities.**

A subtle consequence interviewers love: oversampling or undersampling **changes the class balance the model trains on**, so its predicted probabilities no longer reflect the true base rate — they come out systematically too high for the minority class. SMOTE in particular tends to over-estimate minority-class probabilities. So if you resample *and* you need real probabilities (for cost-based thresholds or downstream use), you must **recalibrate** afterward, or correct the prior back to the true rate. Class weights avoid this problem, which is another reason to prefer them when probabilities matter.

---

**Match the fix to the model.**

The right lever depends on the algorithm. **Tree ensembles and boosting** usually do best with class weights / \`scale_pos_weight\` (the same reweighting knob named in the gradient boosting module, roughly negatives/positives) plus threshold tuning — resampling buys them little. **Linear and distance-based models** (logistic regression, k-NN, SVM) are more sensitive to the geometry, so sampling and careful feature scaling can help them more. Don't apply one imbalance recipe blindly across model families.

---

**The fuller metric menu — for when precision/recall/F1 alone don't settle an argument in a room.**

Beyond precision/recall/PR-AUC, know the wider toolkit: **balanced accuracy** (average recall across classes — useful when you need one number a non-technical audience can read as "how good," without precision and recall's two-number nuance), **F1** and its **macro/micro/weighted** variants (macro treats classes equally, weighted accounts for size), **MCC** (Matthews correlation — one number computed from all four confusion-matrix cells at once, from −1 to +1, so a model can't game it by ignoring the rare class the way accuracy can; robust on imbalance and often the best single summary when you want just one trustworthy figure), **specificity** (recall's mirror image: of the real negatives, what fraction did the model correctly call negative?) and the **false-positive/false-negative rates** (those same misses, read as fractions of the actual-negative and actual-positive totals instead), and — always — the **confusion matrix read at your chosen threshold** so you see the actual counts, not just a summary.

---

**When imbalance gets extreme.**

At 1-in-100,000 (rare diseases, novel fraud), the classification framing itself starts to break, and you switch strategies. Frame it as **anomaly detection** (model "normal," flag deviations) rather than two-class classification. Use a **two-stage retrieval-then-rank** pipeline. Design explicitly around **human review capacity** (precision@K), **delayed labels** (the truth arrives weeks later), and **alert fatigue** (too many false positives and reviewers stop trusting the system). Extreme imbalance is a systems problem, not just a loss-function tweak.`,
    keyPoints: [
      `**On an imbalanced problem, accuracy is a trap — use precision, recall, and PR-AUC instead.**\n\nOn 950 legitimate / 50 fraud, a model that always guesses "legitimate" scores 95.0% accuracy and catches nothing — and a real classifier catching 35 of the 50 frauds also scores exactly 95.0%, an identical tie that hides a real gap. Recall (35/50 = 70% vs 0%) and precision (35/70 = 50% vs undefined) actually track the rare class, and F1 (58.3% vs 0%) finally shows the difference accuracy erased. PR-AUC sums up the recall/precision tradeoff across every threshold in one number, and it's far more honest than the more common ROC-AUC when positives are rare, because ROC-AUC hands out easy credit for correctly ignoring the huge majority.`,
      `**The real problem is not the imbalance — it is that the two kinds of mistake cost different amounts, and fixing recall has a real, computable price.**\n\nMissing a fraud can cost thousands; a false alarm costs a moment. Accuracy pretends they are equal. Class weights (roughly 19:1, matching 950:50) push recall from 70% to 90% by retraining — but precision falls from 50% to 33.3%, F1 actually drops (58.3%→48.6%), and accuracy falls too (95.0%→90.5%). None of that means the fix failed: on a cost matrix of \\$2,000 per missed fraud and \\$5 per false alarm, the reweighted model costs \\$10,450 against the original's \\$30,175 — cheaper, despite the lower F1. The lesson: don't judge an imbalance fix by accuracy or even F1 alone — judge it against what the mistakes actually cost.`,
      `**The step everyone forgets: choose the decision threshold on purpose, not at the default 0.5.**\n\nA classifier gives a score; turning it into a yes/no needs a cutoff, and 0.5 almost never matches an imbalanced, unequal-cost problem. If missing a positive is far worse than a false alarm, flag on weaker suspicion — a lower threshold. After training, look at the precision and recall you get at each cutoff and pick the one that matches what the problem actually costs. Train the model to rank; then set the threshold to act.`,
      `**When action is capacity-limited, optimise precision@K and derive the threshold from an explicit cost matrix.**\n\nIf a team can only review the top 500 alerts, the metric is precision@K (of the top K by score, how many are real) with recall@K and lift@K — the model just needs the worst cases at the top of the list. And "pick the threshold from costs" has a rigorous form: write a cost matrix (dollar cost per confusion-matrix cell) and choose the threshold that minimises expected cost, which for a calibrated probability is exact — another reason calibrated probabilities matter. Round out judging with balanced accuracy, macro/weighted F1, MCC, and the confusion matrix at your chosen threshold.`,
      `**SMOTE has sharp edges, resampling distorts probabilities, and the right fix depends on the model.**\n\nApply SMOTE only inside CV folds after the split (before it leaks), and avoid it with high-dimensional sparse data, noisy or overlapping labels, and time-series. Resampling changes the training class balance, so predicted probabilities come out too high for the minority class — recalibrate afterward if you need real probabilities (class weights sidestep this). Match the lever to the family: tree/boosting → class weights + \`scale_pos_weight\` + threshold tuning; linear/distance models → sampling and scaling. And at extreme imbalance (1-in-100k), switch framing to anomaly detection, two-stage retrieval/ranking, and design around review capacity, delayed labels, and alert fatigue.`,
    ],
    interactivePrompt: `Before you touch the controls: on a dataset that is 99% one class, a model reports 99% accuracy. Does that tell you it is a good model, a useless one, or can you not tell yet?`,
    checkQuestions: [
      {
        q: `Your fraud model has a great ROC-AUC, but the ops team complains about too many false alarms. What is the real fix?`,
        options: [
          `\`A) Retrain with SMOTE to balance the classes; false alarms come from defaulting to the majority class, and balancing training data cuts the false-positive count.\``,
          `\`B) The ranking is already good — the real problem is the 0.5 threshold not matching the true cost of a false alarm; raise the cutoff until precision fits.\``,
          `\`C) Add stronger regularisation; false alarms come from an overfit boundary too sensitive near the edge, and smoothing it cuts the false-positive rate down.\``,
          `\`D) Just report PR-AUC instead of ROC-AUC to the team; the lower number alone will make them accept the false alarms as an unavoidable tradeoff.\``,
        ],
        answer: `B`,
      },
      {
        q: `On a dataset that is 99% negatives, your model reports 99% accuracy. What should you conclude?`,
        options: [
          `\`A) That it is an excellent model — 99% accuracy is near the ceiling, so it is clearly capturing almost all of the real signal present in the data.\``,
          `\`B) That it is definitely broken, since no honest model can reach 99% accuracy on real-world data without a bug or a leak somewhere in the pipeline.\``,
          `\`C) Almost nothing yet — a model that always predicts "negative" also scores 99% while catching none of the positives; check recall and precision first.\``,
          `\`D) That the classes must actually be balanced, since a model can only reach 99% accuracy when both classes are roughly equally represented in training.\``,
        ],
        answer: `C`,
      },
      {
        q: `You are told that missing a positive is ten times worse than raising a false alarm. Select the two true statements about baking that into training.`,
        options: [
          `\`A) Set class weights so a mistake on the positive class costs ten times as much in the loss, shifting the model toward higher recall with no data changes.\``,
          `\`B) Gradient descent then works harder to avoid missing positives once that reweighted loss makes those particular mistakes costlier during optimisation.\``,
          `\`C) Duplicating every positive example exactly ten times is mathematically identical to class weights and is always the strictly more reliable approach.\``,
          `\`D) Lowering the decision threshold to 0.1 alone fully captures the ten-to-one cost ratio, with no need to touch the loss function or class weights at all.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Your fraud team can investigate only 500 alerts per day out of millions of transactions. Which metric should you optimise, and why is a global threshold the wrong framing?`,
        options: [
          `\`A) Optimise overall accuracy — with only 500 reviews the model barely affects the accuracy number, so maximising it is the safest available objective.\``,
          `\`B) Optimise precision@K (K=500): of the top 500 ranked riskiest, how many are real fraud — the model just needs the worst cases at the top.\``,
          `\`C) Optimise recall across all thresholds, since catching every fraud is the only real goal and the 500-alert limit can be raised again later.\``,
          `\`D) Optimise ROC-AUC, since it already accounts for review capacity by weighting the top-ranked predictions more heavily than the rest of the list.\``,
        ],
        answer: `B`,
      },
      {
        q: `You apply SMOTE to your whole dataset and then do cross-validation. Validation scores look great but production is poor. What went wrong?`,
        options: [
          `\`A) SMOTE simply doesn't work for fraud detection at all; remove it entirely and rely on accuracy, which now reflects true production performance.\``,
          `\`B) Oversampling before the split leaks synthetic points into both train and validation; apply SMOTE inside each fold instead.\``,
          `\`C) The validation set was too small; increasing its size alone will make the SMOTE-inflated scores match production without moving SMOTE's placement.\``,
          `\`D) SMOTE needs more synthetic points; generating ten times as many minority examples before cross-validation closes the validation-production gap.\``,
        ],
        answer: `B`,
      },
      {
        q: `On 950 legit / 50 fraud, a do-nothing "always legitimate" model and a real classifier catching 35 of the 50 frauds (with 35 false alarms) both score exactly 95.0% accuracy. What does that tie actually show?`,
        options: [
          `\`A) Accuracy is blind to the rare class here: it weighs all 1000 rows equally, so 15 fewer errors among 950 easy negatives can exactly offset 35 real frauds caught.\``,
          `\`B) The tie is a coincidence specific to these two exact numbers; on almost any other imbalanced dataset accuracy would correctly separate the two models.\``,
          `\`C) It proves the real classifier is actually useless too, since matching a do-nothing baseline's accuracy means it isn't adding real predictive signal.\``,
          `\`D) It shows accuracy is the right metric here, since two models this different in behavior converging on one number reveals a deeper shared property.\``,
        ],
        answer: `A`,
      },
      {
        q: `The real classifier above (35 TP, 35 FP, 15 FN) has precision 50%, recall 70%, F1 58.3%. After retraining with class weights (45 TP, 90 FP, 5 FN), precision drops to 33.3% and F1 drops to about 48.6% — a lower F1 than before. Select the two true statements about what to conclude.`,
        options: [
          `\`A) A lower F1 does not automatically mean the reweighted model is worse — F1 doesn't know that a missed fraud may cost far more than a false alarm.\``,
          `\`B) Whether the reweighted model is actually better is a question a cost matrix answers, not F1 alone: compare total expected cost under each model's confusion matrix.\``,
          `\`C) F1 dropping proves class weighting is broken and should never be used, since a valid imbalance fix must always raise every aggregate metric at once.\``,
          `\`D) The two models are equivalent, since F1's harmonic mean is specifically designed to already account for any possible cost asymmetry between error types.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `With a cost matrix of \\$2,000 per missed fraud and \\$5 per false alarm, the unweighted classifier's 15 misses and 35 false alarms cost 15×\\$2,000 + 35×\\$5. The class-weighted classifier's 5 misses and 90 false alarms cost 5×\\$2,000 + 90×\\$5. Which model is cheaper, and by how much?`,
        options: [
          `\`A) The class-weighted model, \\$10,450 versus \\$30,175 — despite its lower F1, its far fewer misses dominate the cost even with three times as many false alarms.\``,
          `\`B) The unweighted model, \\$30,175 versus \\$10,450 — its higher F1 and higher precision translate directly into the lower total cost under this matrix.\``,
          `\`C) They cost the same, \\$20,000 each, since the two models' total error counts (50 combined mistakes each) happen to be identical under this data.\``,
          `\`D) The comparison can't be done from confusion-matrix counts alone; it requires the models' calibrated probabilities, not just true/false positive/negative counts.\``,
        ],
        answer: `A`,
      },
    ],
    takeaway: `On an imbalanced problem, accuracy is a trap — on 950 legit / 50 fraud, a do-nothing model and a real classifier catching 70% of fraud scored an identical 95.0% accuracy, a tie that precision, recall, and F1 immediately broke. The real issue is that the two kinds of mistake cost different amounts: class weights traded 20 points of recall for 16.7 points of precision and even a lower F1, yet came out \\$19,725 cheaper on a concrete cost matrix — proof that neither accuracy nor F1 alone settles whether an imbalance fix is worth it. Measure with precision, recall, and PR-AUC; make the model care about the rare class with class weights (or resampling); and set the decision threshold, or the cost matrix, deliberately rather than leaving it at 0.5.`,
    recap: [
      "**Accuracy is a trap** — 950/50 dataset: do-nothing model and a 70%-recall classifier both score 95.0% accuracy, identically.",
      "**Precision/recall/F1 break the tie:** do-nothing = 0%/0%/0%; real classifier = 50%/70%/58.3%.",
      "**Real issue: the two kinds of mistake cost different amounts** — not the imbalance itself.",
      "**Class weights (≈19:1) traded recall for precision:** 70%→90% recall, 50%→33.3% precision, F1 58.3%→48.6% (lower!), accuracy 95.0%→90.5%.",
      "**Cost matrix settles it:** at \\$2,000/miss, \\$5/false-alarm, the weighted model costs \\$10,450 vs \\$30,175 — cheaper despite the lower F1.",
      "**Set the decision threshold deliberately** to match the cost — don't leave it at 0.5.",
      "**When action is capacity-limited, optimise precision@K** and derive the threshold from a cost matrix.",
      "**SMOTE has sharp edges;** resampling distorts probabilities — the right fix depends on the model.",
    ],
    figures: {
      imbalance_skew: `<svg viewBox="0 0 360 175" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">950 legit / 50 fraud (5%)</text>
  <g fill="var(--ink-low)" opacity="0.65">
    <circle cx="55" cy="48" r="5"/><circle cx="80" cy="42" r="5"/><circle cx="104" cy="52" r="5"/><circle cx="128" cy="44" r="5"/><circle cx="70" cy="66" r="5"/><circle cx="96" cy="70" r="5"/><circle cx="120" cy="64" r="5"/><circle cx="52" cy="82" r="5"/><circle cx="82" cy="90" r="5"/><circle cx="110" cy="86" r="5"/><circle cx="136" cy="78" r="5"/><circle cx="64" cy="104" r="5"/><circle cx="94" cy="108" r="5"/><circle cx="122" cy="104" r="5"/><circle cx="146" cy="96" r="5"/><circle cx="76" cy="122" r="5"/><circle cx="106" cy="124" r="5"/><circle cx="134" cy="120" r="5"/>
  </g>
  <text x="98" y="150" text-anchor="middle" fill="var(--ink-low)" font-size="9">majority: legit</text>
  <circle cx="268" cy="85" r="8" fill="var(--prime)"/>
  <text x="268" y="112" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">fraud</text>
  <text x="180" y="170" text-anchor="middle" fill="var(--ink-hi)" font-size="9">"always legit" = 95.0% accurate, catches 0 fraud</text>
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
        q: `You have 500 features and want to cut down to about 50 before tuning a model. Select the two steps that belong in a sound approach.`,
        options: [
          `\`A) First drop constant and near-constant features and one of each highly correlated pair — a cheap screen that needs no trained model at all beforehand.\``,
          `\`B) Train a model on what remains and rank by an interaction-aware importance like permutation importance or SHAP, keeping the top 50 and checking it matches the full model.\``,
          `\`C) Rank all 500 by individual mutual information with the target and keep the top 50, since mutual information already handles redundancy and interactions alone.\``,
          `\`D) Use recursive feature elimination with Gini importance, dropping the 50 weakest features in a single shot and never retraining afterward at all.\``,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `A colleague ranks features by their correlation with the label across the entire dataset, then runs cross-validation to report accuracy. Why is the number misleading?`,
        options: [
          `\`A) Features were chosen using the whole dataset, including rows that later serve as test folds, so label information leaked into selection.\``,
          `\`B) Correlation is a filter method and ignores interactions, so the real problem is missing combination effects; Gini importance on the full data fixes it.\``,
          `\`C) The procedure is fine — correlation on the full dataset just estimates a population quantity, exactly like standardising features beforehand is normal.\``,
          `\`D) Five folds is simply too few to evaluate a reduced feature set; the number is misleading only because leave-one-out CV wasn't used here instead.\``,
        ],
        answer: `A`,
      },
      {
        q: `Your stakeholders need to explain each prediction ("we flagged this loan because of income and debt"). Should you use feature selection or PCA-style dimensionality reduction, and why?`,
        options: [
          `\`A) PCA — it compresses features into fewer numbers, and fewer numbers are always easier for stakeholders to reason about than a long named list.\``,
          `\`B) Feature selection — it keeps a subset of your original, named features so each prediction stays explainable; PCA blends features into unnamed directions.\``,
          `\`C) Either works equally well for explanation, since a PCA component can always simply be relabelled with whichever original feature it most resembles.\``,
          `\`D) PCA — dimensionality reduction is strictly more powerful than selection, and its components stay just as interpretable once rotated back into place.\``,
        ],
        answer: `B`,
      },
      {
        q: `A stakeholder points to a feature's high SHAP importance and concludes it "causes" the outcome, so the business should intervene on it. Why is that reasoning unsafe?`,
        options: [
          `\`A) It's completely safe — SHAP is grounded in game theory, so high importance is mathematical proof of causation and intervening will change the outcome.\``,
          `\`B) SHAP explains what the model leaned on, not what causes the outcome; it's associational, and correlated features can mis-split credit between them.\``,
          `\`C) The reasoning fails only because SHAP values are pure random noise; averaging over more background samples would turn them into valid causal estimates.\``,
          `\`D) SHAP is fine for causation but only for linear models, so the stakeholder is wrong purely because the model here is gradient-boosted rather than linear.\``,
        ],
        answer: `B`,
      },
      {
        q: `You want to be sure the features you selected aren't just an artifact of one particular training sample. What technique addresses this, and what does the mutual-information filter miss that it doesn't?`,
        options: [
          `\`A) Use leave-one-out cross-validation once; if accuracy is stable the feature set is automatically stable too, and mutual information already handles interactions.\``,
          `\`B) Stability selection reruns selection across bootstrap resamples, keeping consistent features; mutual information is univariate.\``,
          `\`C) Use PCA to compress features first, guaranteeing stability since components never change across samples, and mutual information only misses linear ties.\``,
          `\`D) Increase the number of candidate features until selection stabilises on its own; mutual information misses nothing since it is fully multivariate.\``,
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
