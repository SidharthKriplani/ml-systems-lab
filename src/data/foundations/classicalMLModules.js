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

So before you trust any straight-line model: plot the misses and look. Gauss would have.`,
    keyPoints: [
      `**In one line: OLS finds the weights that make the total squared miss as small as possible.**\n\nUse linear regression first whenever you are predicting a number and "add up the facts, each with its own weight" is a sensible guess. Its big advantage is that you can read the weights straight off — one more bedroom adds about so many dollars. It is fast, it is simple, and it is the baseline every fancier model has to beat. Move to something else when the residual plot curves (the real shape is not a straight line), when facts clearly work together, or when the answer has to stay inside fixed limits — like a probability between 0 and 1, which a straight line cannot respect.`,
      `**The trap that catches people: when two facts move together, their weights stop being trustworthy — but the predictions still look fine, so nothing warns you.**\n\nIf size and total rooms almost always rise together, OLS splits the credit between them however it likes, and a different batch of houses splits it differently. The two weights wobble, but their combined effect stays steady — so the predictions look healthy. That is why "this weight is near zero, let us drop the fact" is dangerous: the weight may be small only because its twin took the credit. Add Ridge (a small penalty) before you trust any list of which facts matter.`,
      `**The one check to run every time: plot the misses against the predictions.**\n\nIf the misses scatter evenly around zero, the straight line fits. If they form a U or any clear pattern, the shape is wrong — and a curved plot with R² = 0.95 is worse than a messy one with R² = 0.60, because now you are confidently wrong. If the misses fan out wider as predictions grow, the errors get bigger for pricier houses; the predictions can still be fine, but any confidence range you quote is off. R² hides all of this. The plot of the misses shows it.`,
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
    ],
    takeaway: `Least squares picks the weights that make the total squared miss smallest, and for a straight line one formula solves for them in a single step — the same trick Gauss used to find a lost planet. Judge the fit with R² (how much you beat the lazy "always guess the average" model), and switch to adjusted R² once you start adding features. Never trust a single weight when two facts move together, and always plot the misses — because R² cannot see a wrong shape, but the misses can.`,
    interactiveId: 'linear_regression_viz',
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

Two failure modes are worth knowing. First, **perfect separation**: if some feature splits the two classes cleanly in the training data, the model can keep making its weights bigger to push every prediction toward a hard 0 or 1, and the weights run off toward infinity — training never settles (watch for exploding weights or a loss that turns into NaN). A small L2 penalty caps the weights and brings back a finite answer. Second, logistic regression comes out **calibrated by construction**: because it is trained to give high probability to what actually happened, a predicted 0.7 really does tend to mean about 70% in reality — something trees, SVMs, and boosting do not give you for free.

And it stretches past two classes: swap the sigmoid for the **softmax**, which turns a whole set of logits into probabilities that add up to 1, and train it with the same log-loss idea. The boundary it draws stays straight — a line in 2D, a flat plane in higher dimensions — so to bend it you must add curved or interaction features yourself. One practical habit: because the L2 penalty judges weights by size, standardise your features first, or a feature measured in the millions gets penalised on a completely different scale from one measured in single digits.`,
    keyPoints: [
      `**What logistic regression really is: a linear equation that predicts the log-odds, and a sigmoid that turns that into a probability.**\n\nUse it as your first model for any yes/no question where you want a probability you can trust, not just a label — fraud, churn, default, click-through. Its coefficients read cleanly: a one-unit bump in a feature adds its weight to the log-odds and multiplies the odds by $e^{weight}$. It is fast, interpretable, and — uniquely among the common classifiers — calibrated out of the box. Reach for something heavier only when the boundary is clearly non-linear or the features interact in ways a straight line cannot capture.`,
      `**The trap that stops the model learning: training with MSE instead of log loss.**\n\nMSE caps the penalty for a confident wrong answer at around 1, so the model shrugs off its worst mistakes — and worse, its gradient shrinks to near zero exactly when the prediction is most confidently wrong, so it barely updates. Log loss (cross-entropy) makes the cost climb toward infinity as a confident prediction turns out wrong, and its gradient stays full-strength. Always train classification with cross-entropy. Watch too for perfect separation: a feature that splits the classes cleanly drives the weights toward infinity — a little L2 (in scikit-learn, a lower C) reins them back in.`,
      `**The diagnostic: read the reliability diagram — when the model says 0.7, is the real rate about 70%?**\n\nLogistic regression starts well-calibrated, but strong regularisation shrinks the logits and pulls probabilities toward the middle, and class imbalance can distort them. On a held-out set, bucket the predictions and compare each bucket's predicted probability against its actual positive rate. If the model says 0.8 where the truth is 0.55, it is overconfident — fix it with Platt scaling or isotonic regression fit on a *separate* calibration set, never the training set. And standardise features before fitting, since L2 is scale-sensitive.`,
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
    ],
    takeaway: `Logistic regression lets a linear equation predict the log-odds, then a sigmoid turns that into a probability — so one weight reads three ways: it adds to the log-odds, multiplies the odds by e^w, and moves the probability non-linearly. Train it with log loss, not MSE: log loss makes a confident wrong answer cost enormously and keeps the gradient alive, while MSE goes flat exactly when the model most needs to learn.`,
    interactiveId: 'logistic_regression_viz',
  },
  {
    id: 'regularization',
    interactiveId: 'regularization_viz',
    title: 'Regularisation Geometry',
    subtitle: 'L1 vs L2 geometry, Lasso sparsity, Ridge shrinkage, elastic net',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['regularisation', 'L1', 'L2', 'Lasso', 'Ridge'],
    summary: `You are predicting house prices and someone gives you 100 features — square footage, number of rooms, lot size, distance to school, neighbourhood income, and 95 others. Many are correlated. You fit OLS and the training R² is 0.98. The test R² is 0.51. The model memorised the training data.

The core problem: OLS minimises training error with no regard for how large the weights get. Give it 100 features for 200 houses and it will find weights that fit the training data perfectly, including all the noise. The fix is to make large weights expensive: add a penalty on weight magnitude to the loss, and the optimiser now balances fitting the data against keeping weights small.

The first question is what kind of penalty. Penalise the squared magnitude — Ridge (L2). The optimiser shrinks all weights smoothly toward zero, but no weight ever reaches exactly zero. Visualise this geometrically: in the constrained form, the L2 constraint is a sphere. The loss function's level curves are ellipses centred at the OLS solution. Expand those ellipses outward until they touch the sphere. A sphere is smooth — the contact point almost never falls on a coordinate axis, so Ridge almost never zeroes a weight. Now swap the sphere for a diamond — the L1 constraint. The L1 ball in 2D is a diamond with four corners, one on each axis. Expand the loss ellipses from the OLS solution. They hit the diamond's corner first, almost always. At a corner, one weight is exactly zero. That is Lasso, and that geometric corner is why it performs feature selection while Ridge cannot.

[FIGURE: l1_l2_geometry]

The geometry has an algebraic counterpart. The L2 gradient contribution from weight $w_j$ is $2\\lambda w_j$ — proportional to the current weight size. Large weights are pushed hard; weights near zero get a proportionally tiny push. The gradient never overcomes the pull toward zero exactly: as $w_j \\to 0$, the push $\\to 0$ too. The L1 gradient contribution is $\\lambda \\cdot \\text{sign}(w_j)$ — constant magnitude regardless of weight size. The push toward zero is the same whether $w_j = 0.001$ or $w_j = 10$. At $w_j = 0$ the L1 function is non-differentiable; the subgradient is any value in $[-\\lambda, \\lambda]$. If the data gradient at $w_j = 0$ is smaller than $\\lambda$ in magnitude, the net subgradient can be zero — meaning $w_j = 0$ is a stable solution. That is the mechanism.

The Lasso coordinate descent update makes this concrete. Holding all other weights fixed, the optimal $w_j$ is given by the soft-thresholding operator: $w_j \\leftarrow \\text{sign}(\\rho_j) \\cdot \\max(0, |\\rho_j| - \\lambda)$, where $\\rho_j = x_j^T(y - X_{-j} w_{-j})$ is the partial residual — what the target looks like after removing all other features' contributions. If $|\\rho_j| < \\lambda$ (the feature's signal is smaller than the penalty), $w_j$ is set to exactly zero. If $|\\rho_j| > \\lambda$, the weight is shrunk by $\\lambda$ toward zero but not past it. This is the dead zone at the origin.

Both regularisers penalise weight magnitude, not feature contribution. This creates a scale sensitivity that is easy to miss. A feature measured in dollars (range 0–100,000) needs a tiny weight (e.g., 0.00002) to fit the data; the L2 penalty $\\lambda \\times (0.00002)^2$ is negligible. A binary feature (0 or 1) needs a large weight (e.g., 3.0); the penalty $\\lambda \\times 9$ is substantial. Same $\\lambda$, radically different effective regularisation. A large-scale feature is systematically under-regularised. Fix: standardise all features (subtract mean, divide by std) before fitting any regularised model. This is not optional — it changes which features get penalised and by how much.

The Bayesian interpretation connects regularisation to prior beliefs. Ridge = MAP estimation with a Gaussian prior $P(w_j) = \\mathcal{N}(0, 1/\\lambda)$ on each weight. Multiplying the Gaussian likelihood by the Gaussian prior and taking the log gives exactly the Ridge objective. The Gaussian prior spreads probability continuously across all weight values — it has zero mass at any single point including zero. This is why Ridge can never produce exactly-zero weights: the prior never bets on a specific value. Lasso = MAP with a Laplace prior $P(w_j) \\propto e^{-\\lambda|w_j|}$. The Laplace distribution has a sharp spike at zero — it actively bets that many weights are exactly zero. MAP estimation then sets weights to exactly zero when the data evidence is not strong enough to overcome this prior. The geometry (corners on axes) and the prior (spike at zero) are two views of the same mechanism.

Elastic net combines both: $L + \\lambda[(1-\\alpha)\\|w\\|_2^2/2 + \\alpha\\|w\\|_1]$. At $\\alpha=0$: pure Ridge. At $\\alpha=1$: pure Lasso. The elastic net grouping effect: when two features are perfectly correlated, Lasso arbitrarily picks one and zeros the other (which one changes across random seeds). Elastic net gives both correlated features similar non-zero coefficients — the L2 component stabilises the selection.

One more trap in neural network training. With SGD optimiser, L2 regularisation on the loss is mathematically equivalent to weight decay: adding $\\lambda w_j^2$ to the loss adds $2\\lambda w_j$ to the gradient, which is equivalent to multiplying $w_j$ by $(1 - 2\\alpha\\lambda)$ at each step — uniform shrinkage. With Adam, this equivalence breaks. Adam's adaptive per-parameter scaling changes the effective penalty each weight receives; parameters with high gradient variance get smaller effective regularisation than intended. AdamW implements true weight decay as a multiplicative step separate from the gradient update: $w \\leftarrow (1-\\alpha\\lambda)w - \\alpha \\cdot \\hat{m}/\\sqrt{\\hat{v}}$. This restores uniform weight decay regardless of Adam's adaptive scaling. Always use AdamW, not Adam + L2 loss, when you want weight decay in neural networks.

**NOT this.** Most people think "regularisation just reduces overfitting by making the model simpler." This is imprecise enough to be misleading. Lasso zeros weights not because "simpler is better" — it zeros them because the L1 ball's geometry has corners on the coordinate axes, the loss ellipses hit those corners, and the coordinate descent update produces a hard dead zone at the origin. The sparsity is a consequence of geometry and algebra, not philosophy. Choose L1 vs L2 based on your prior belief about the weight distribution: sparse true signal → L1; dense small effects → L2; correlated features you want to keep together → elastic net.

Formally: Ridge solves $\\hat{\\theta}_{\\text{ridge}} = (X^TX + \\lambda I)^{-1}X^Ty$. Adding $\\lambda I$ makes the matrix invertible even for perfectly correlated features (multicollinearity collapses to zero eigenvalues in OLS; $\\lambda$ pushes all eigenvalues above $\\lambda$). Lasso has no closed form and uses coordinate descent with the soft-thresholding operator above.`,
    keyPoints: [
      `**Use L1 (Lasso) when you believe the true signal is sparse — a few features matter, most do not. Use L2 (Ridge) when many features contribute small effects or when correlated features should survive together.**\n\nA practical rule: if you have 100 features and expect ~10 to be predictive, start with Lasso. If domain knowledge says all 100 contribute (e.g., genomics with many small-effect SNPs), use Ridge. If features are correlated and you want sparsity without instability in which feature gets selected, use elastic net. In sklearn: Ridge (alpha=λ), Lasso (alpha=λ), ElasticNet (alpha=λ, l1_ratio=mixing).`,
      `**The production trap: Lasso\`s feature selection is unstable when features are correlated.**\n\nOn the 100-feature house price dataset, if square footage and total floor area have correlation 0.95, Lasso will pick one and zero the other — but which one it picks can flip entirely across different training samples. Re-run with a different random seed for the train/test split and the selected feature changes. This is not a bug; it is the expected behavior of L1 on a near-degenerate problem. Elastic net adds L2 to stabilise the selection: correlated features get similar non-zero coefficients rather than one being arbitrarily killed. If Lasso\`s selected features change across cross-validation folds, switch to elastic net.`,
      `**The diagnostic: plot the regularization path — watch how each coefficient evolves as λ increases from 0 to large.**\n\nThe features that survive longest as λ grows are the most robustly predictive. Features that die first are either noise or redundant. For Lasso, sklearn\`s LassoCV traces this path efficiently. For Ridge, the path is smooth and monotone. A feature that enters the model early (at large λ) and stays is the one you should trust. One that only appears at very small λ is probably capturing noise. This diagnostic reveals which features are genuinely load-bearing before you commit to a final λ.`,
    ],
    interactivePrompt: `Before you touch the controls: with two features that are perfectly correlated, do you expect Lasso to zero out one of them, both of them, or neither — and does Ridge behave the same way?`,
    checkQuestions: [
      {
        q: `You have 200 samples and 500 features. Many features are likely irrelevant. Which regulariser do you choose and why?`,
        options: [
          `\`A) Ridge (L2) is preferred: with n=200 << p=500 the system is underdetermined, and Ridge's closed-form solution (XᵀX + λI)⁻¹Xᵀy is numerically stable for any λ > 0. It avoids the instability of Lasso's coordinate descent in highly underdetermined settings.\``,
          `\`B) L1 (Lasso) is preferred: it performs automatic feature selection by driving irrelevant feature weights to exactly zero, giving a sparse interpretable model. With n=200 << p=500, the problem is underdetermined (infinitely many OLS solutions). Sparsity is a reasonable assumption and helps generalisation. If features are highly correlated, elastic net is better than pure Lasso — Lasso arbitrarily picks among correlated features, while elastic net applies the grouping effect. Start with Lasso (sklearn's LogisticRegression with penalty='l1'), then try elastic net if Lasso's selected features are unstable across cross-validation folds.\``,
          `\`C) No regularisation is needed: with 200 samples and 500 features, cross-validation will automatically prevent overfitting by selecting the model complexity that minimises validation error. Regularisation would introduce unnecessary bias.\``,
          `\`D) Principal component regression is the correct approach: first reduce the 500 features to ~20 principal components explaining 95% of variance, then apply OLS on the reduced features. This is strictly better than L1 or L2 because it uses the actual data structure rather than an arbitrary penalty.\``,
        ],
        answer: `B`,
      },
      {
        q: `Explain geometrically why Lasso produces sparse solutions but Ridge does not, using the constrained optimisation formulation.`,
        options: [
          `\`A) Constrained form: minimise loss(w) subject to ‖w‖_p ≤ r. The loss L(w) has elliptical level curves centred at θ̂_OLS. We want the point on the constraint boundary closest to θ̂_OLS. L1 constraint: ‖w‖₁ ≤ r is a diamond (in 2D) with corners at (r,0), (0,r), (−r,0), (0,−r). As we expand the ellipse from θ̂_OLS outward, it first hits a corner of the diamond where one coordinate is exactly zero. L2 constraint: ‖w‖₂ ≤ r is a circle (sphere in high-D) with no corners — the ellipse hits the sphere at a smooth point, almost never on an axis, so almost no coefficient is exactly zero.\``,
          `\`B) In the penalised form, the L1 subgradient at zero equals the sign of the coefficient while the L2 gradient equals 2λw. The subgradient being a constant at zero means the Lasso update always overshoots zero, landing at exactly zero before bouncing back; the L2 gradient being proportional to w means Ridge always undershoots zero slightly and never reaches it.\``,
          `\`C) Lasso uses an L1 ball as constraint, and in high dimensions the volume of the L1 ball concentrates on the coordinate axes — most of the ball's surface area is near a corner. Ridge uses an L2 ball whose surface area is uniformly distributed. Consequently, random projection of the OLS solution onto the Lasso ball lands on a corner axis with high probability but never on a Ridge axis.\``,
          `\`D) The L1 penalty ‖w‖₁ is discontinuous at w=0 which creates an attraction point: the gradient pushes weights below a threshold to exactly zero. The L2 penalty ‖w‖₂² is differentiable everywhere including at zero, meaning its gradient points away from zero and never creates the same hard attraction point.\``,
        ],
        answer: `A`,
      },
      {
        q: `A Lasso model selects 10 features, but when you rerun with a different random seed (for data splitting), it selects a completely different 10 features. What does this mean and what should you do?`,
        options: [
          `\`A) The Lasso implementation has a bug — coordinate descent with different random seeds should converge to the same global minimum because the Lasso objective is convex. Try fixing the random seed and increasing max_iter; the selection should stabilise once the solver converges.\``,
          `\`B) The λ value is too large, causing the Lasso to select near-zero features by chance. Different train/test splits expose different noise patterns, each giving a different set of near-zero features above the threshold. Decrease λ (increase C in sklearn) to select features that are more robustly predictive.\``,
          `\`C) This instability signals that many non-selected features are nearly equally predictive and correlated with the 10 selected ones. Lasso's feature selection is unstable when multiple features share similar predictive power — it arbitrarily picks one from each correlated group. Remedies: (1) Switch to elastic net (grouping effect stabilises correlated feature selection). (2) Use stability selection: run Lasso on many bootstrap subsamples, keep only features selected in > 80% of runs — these are the truly stable predictors. (3) Use permutation importance or SHAP on a Random Forest to identify the genuinely important features without assuming sparsity.\``,
          `\`D) The dataset is too small — with n=200 the train/test splits differ enough that the 10 best features genuinely change across splits. The instability reflects real uncertainty in the data, not a model problem; report all features that appear in at least one split and let domain knowledge decide.\``,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Ridge shrinks all weights smoothly; Lasso zeroes some exactly — the difference is geometry: L2\`s sphere has no corners, L1\`s diamond does, and loss ellipses hit corners first.`,
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
    summary: `You train a model on house prices. Training error: 2%. Test error: 20%. The model is useless in production, but nothing in the training loop warned you — it was doing its job perfectly. The gap is the real problem, and understanding it requires asking a harder question than "did it overfit?" You need to know why.

The bias-variance decomposition splits the test error into three pieces. The first is irreducible noise — measurement error, random fluctuations in house prices that no model could ever capture. This is a floor. The second is bias: the model\`s systematic tendency to miss in the same direction, because its assumptions are wrong. The third is variance: how much the model\`s predictions swing when you retrain it on a different sample of houses. A high-capacity model — say, a deep tree — will fit the training data beautifully and have near-zero bias, but swap out ten training houses and the fitted tree looks completely different. High variance. A linear model with strong regularisation will be stable across resampling but will consistently miss the non-linear parts of the true price curve. High bias.

The cure for one makes the other worse. Add regularisation to reduce variance and you introduce bias. Add model capacity to reduce bias and you raise variance. This is the tradeoff, and every architectural choice you make is a position on this curve.

The classical question is: how much capacity is too much? VC theory gives a formal answer. The VC dimension of a hypothesis class is the size of the largest set of points the class can shatter — that is, correctly classify in every possible labeling. For a linear classifier in $\\mathbb{R}^d$, VC-dim = $d + 1$: you can always find $d+1$ points in general position that a hyperplane can shatter, but no $d+2$ points. Add the VC dimension to the generalization bound: test error $\\leq$ train error $+ \\sqrt{\\text{VC-dim} \\cdot \\log(n) / n}$. What this says concretely: add 400 features to a linear model (increasing VC-dim by 400) and you need $400 \\cdot \\log(n)$ additional training examples just to maintain the same generalization gap. Double the features; roughly double the data requirement. This is not intuition — it is the formal price of capacity. The bound also tells you what to do when your train error is near-zero but test error is high: VC-dim is too large relative to $n$. Either reduce model complexity (feature selection, regularization) or acquire more training examples proportional to the added capacity.

Classical theory says test error follows a U-shape as model complexity grows. That is real. But it is also incomplete. Extremely overparameterised models — far past the point where they can memorise the training data — often do better than models right at the interpolation threshold. The classical U-curve rises again at the threshold, then descends a second time in the massively overparameterised regime. This is double descent. The interpolation threshold is the point where the model has just enough capacity to fit the training data with zero error. At this threshold, the only solution that achieves zero training error is often a highly irregular, non-smooth function — it contorts to pass exactly through every training point. In the massively overparameterised regime, gradient descent finds the minimum-norm solution among infinitely many that fit the training data: the smoothest function consistent with the training labels. Smooth functions generalise better.

**NOT this.** Most people think "more data always reduces test error." If the model is correctly specified — if its assumptions match the true process — then yes, more data reduces variance and test error improves. But if the model is misspecified — if it assumes a linear relationship and the truth is a curve — then more data just confirms the wrong assumption more confidently. Bias does not shrink with data. A linear model fit to 100 house prices and a linear model fit to 100,000 house prices will both miss a U-shaped price-size relationship by roughly the same amount. More data fixes variance, not bias. You need to fix the model, not gather more samples.

The formal statement: $E[(y - \\hat{y})^2] = \\sigma^2 + \\text{Bias}^2(\\hat{y}) + \\text{Var}(\\hat{y})$. The irreducible noise $\\sigma^2$ cannot be removed. Bias and variance both contribute to test error, and regularisation is a dial that trades one for the other.`,
    keyPoints: [
      `**Use the bias-variance lens to diagnose a gap: large train error → high bias (wrong model family or too much regularisation); small train error and large test error → high variance (model memorised noise).**\n\nIn the house price setting: training error 2%, test error 20% = high variance. The model fit the training set noise rather than the true price function. Start by reducing complexity or increasing regularisation. If training error is also high (say 15%, test 18%) that is high bias — the model cannot even fit the training data, so adding data or reducing regularisation is the fix. Both diagnoses require measuring training error explicitly, not just test error.`,
      `**The production trap: mistaking "more data" as a universal fix for poor test performance.**\n\nMore data reduces variance — it is the most reliable fix for the high-variance / low-bias case. But if your model is misspecified (linear on non-linear data, missing key features), more data will reduce confidence intervals but not prediction error. Before scaling data collection, fit a flexible model (gradient boosting) on the same training data. If the flexible model\`s test error is also high, you have a data problem. If it is much lower, your original model is misspecified — fix the model, not the data.`,
      `**The diagnostic: learning curves — plot training and validation error as a function of training set size.**\n\nHigh bias: both training and validation error are high and converge close together. Adding data barely moves either curve. Fix: more capacity. High variance: training error is low, validation error is much higher, and they have not converged — the gap persists even with many training samples. Fix: regularisation, simpler model, or more data if you have it. If the two curves converge but at a high error level: you have hit irreducible noise or genuine misspecification.`,
    ],
    interactivePrompt: `Before you touch the controls: if you doubled the size of the training set without changing the model, do you expect the training error to go up, down, or stay the same?`,
    checkQuestions: [
      {
        q: `A model achieves 99% training accuracy and 75% test accuracy. What does this tell you about bias and variance, and what would you do?`,
        options: [
          `\`A) High training accuracy + much lower test accuracy = high bias (the model makes strong incorrect assumptions) + high variance. The model is underfitting AND overfitting simultaneously, which means the architecture is fundamentally misspecified. Completely change the model family rather than tuning hyperparameters.\``,
          `\`B) High training accuracy + much lower test accuracy = low bias + high variance. The model is overfitting. The 24% gap suggests the test set comes from a different distribution than training — check for distribution shift before any architecture changes.\``,
          `\`C) This is expected behaviour for a well-trained model: some gap between training and test accuracy is healthy. The 75% test accuracy is acceptable; attempting to close the gap further would introduce regularisation bias and reduce the model's expressiveness.\``,
          `\`D) High training accuracy + much lower test accuracy = low bias (the model fits training data well) + high variance (does not generalise — sensitive to the specific training set). The model is overfitting. Remedies in priority order: (1) More training data — reduces variance most directly. (2) Stronger regularisation (L2, dropout, weight decay). (3) Simpler architecture (fewer parameters, shallower network). (4) Ensemble methods (bagging averages out variance). Increasing model capacity would worsen the problem. The 24% gap is large — start with data augmentation or getting more labels before architectural changes.\``,
        ],
        answer: `D`,
      },
      {
        q: `Explain the double descent phenomenon. A neural network's test error is worse at 1000 parameters than at 100 parameters, but better at 1,000,000 parameters than at 100. How is this possible?`,
        options: [
          `\`A) The 1000-parameter model is near the interpolation threshold — it has just enough capacity to memorise the training data, but the solution it finds has high variance (sensitive to the specific training set). The 100-parameter model is underparameterised and underfits — higher bias. The 1,000,000-parameter model is highly overparameterised: gradient descent finds the minimum-norm interpolating solution among infinitely many zero-training-error solutions. Minimum-norm solutions correspond to smoother, more generalising functions. The "implicit regularisation" of gradient descent prefers these smooth solutions. Classical bias-variance theory predicts the U-curve (100 → 1000); double descent adds the second descent (1000 → 1,000,000). Early stopping at 100 would have been a worse choice than using the massively overparameterised model.\``,
          `\`B) The 1000-parameter model is overfitting because it has too many parameters for the training set size. The 100-parameter model underfits. The 1,000,000-parameter model works better simply because more parameters always improve performance when trained with sufficiently small learning rate and early stopping — this is the standard bias-variance tradeoff extended to large models.\``,
          `\`C) The improvement at 1,000,000 parameters is due to the lottery ticket hypothesis: among 1,000,000 parameters, random initialisation finds a sparse subnetwork that is already close to the optimal solution. This subnetwork is effectively a small model, which is why the 1,000,000-parameter model generalises like the 100-parameter model.\``,
          `\`D) The 1,000,000-parameter model implicitly performs ensemble learning — different subnetworks specialise on different subsets of training examples and their predictions are averaged through the shared output layer. This averaging reduces variance in the same way bagging does, which is why test error falls back below the 100-parameter baseline.\``,
        ],
        answer: `A`,
      },
      {
        q: `You increase a linear classifier's feature count from d=100 to d=500 (adding new features). Training accuracy improves but test accuracy degrades. Explain in terms of VC dimension and what you should do.`,
        options: [
          `\`A) VC dimension measures model complexity only for non-linear classifiers. For a linear classifier, adding features from d=100 to d=500 does not change VC dimension — only the number of training points matters. The test accuracy degradation is a numerical issue: more features means a larger XᵀX matrix that is harder to invert stably. Regularise with Ridge to stabilise the inversion.\``,
          `\`B) Linear classifiers in ℝᵈ have VC-dim = d+1. Increasing d from 100 to 500 increases VC-dim from 101 to 501 — the hypothesis class can now shatter more points, meaning it can fit more arbitrary patterns including noise in the training set. The generalisation bound increases: test error ≤ train error + √(500·log(n)/n) > √(100·log(n)/n). With the same n, the model now needs 5× more data to maintain the same generalisation gap. Fixes: (1) Regularise more strongly (larger λ for Ridge/Lasso to reduce effective complexity). (2) Apply feature selection — keep only features with genuine predictive value. (3) Collect more data proportional to the increased VC dimension.\``,
          `\`C) VC dimension applies to binary classifiers in the worst case. For practical data, training accuracy improving while test accuracy degrades at d=500 is simply a sign that the new 400 features are noisy. Remove features with low correlation to the target label — mutual information filtering will restore test accuracy without any regularisation.\``,
          `\`D) The degradation is a threshold effect specific to linear models: linear classifiers have VC-dim = d only when d is a power of 2. At d=500 (non-power-of-2), the effective VC dimension is d²=250,000, massively inflating the generalisation gap. Use a non-linear model at d=500 which has a more predictable VC-dim growth rate.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Test error = irreducible noise + bias² + variance; bias is wrong assumptions (more data won\`t fix it), variance is sensitivity to the training sample (more data will); and every regularisation decision is a move along the bias-variance curve.`,
    interactiveId: 'bias_variance_viz',
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

And left unchecked, a tree keeps splitting until nearly every leaf holds a single training point — 100% right on the training data, and badly overfit. The cure is **pruning**. You either stop early (cap the depth, or refuse splits that would leave too few samples in a leaf) or grow the full tree and then cut back the branches that do not earn their keep. Either way you give up a little training accuracy for a lot of test accuracy, and you choose how hard to prune by trying a few levels and keeping the one that generalises best.`,
    keyPoints: [
      `**What a decision tree is, and when to reach for it: a flowchart of yes/no questions you can actually read.**\n\nTrees are the model to use when you need to explain every prediction in plain words — "income below 42k and debt above 0.35, so we flagged it." They take mixed feature types (numbers and categories) as they come, need no scaling, and pick up feature interactions on their own, since splitting on income and then on debt is exactly an income-and-debt rule. The catch: a single tree is twitchy and overfits easily. So use one tree when you need a human-readable explanation, and an ensemble (random forest or boosting) when you need the accuracy in production.`,
      `**The trap that fools people: trusting the tree's built-in feature-importance scores.**\n\nA tree's default importance counts how much each feature cut down impurity across all its splits. But a fine-grained number like income has many possible cut points, so it gets far more chances to split than a plain yes/no flag — and it ends up looking more important than it really is, just from having more opportunities. Do not rank features by this. Use permutation importance instead: shuffle one feature's values, measure how much accuracy drops, and repeat. A feature that truly mattered will hurt when scrambled; a useless one will not.`,
      `**The check to run: sweep how hard you prune, and watch train versus test accuracy.**\n\nWith no pruning a tree scores nearly perfectly on training data and poorly on test — pure overfitting. As you prune harder, test accuracy climbs (noise removed), peaks, then falls again (now you are cutting real structure). That peak is the right amount of pruning, and you find it with cross-validation, not by eyeballing a single split. Also watch leaf sizes: a leaf built from only two or three examples gives a probability you should not trust, so require a minimum number of samples per leaf.`,
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
    ],
    takeaway: `A decision tree is a flowchart of yes/no questions, each chosen to split the data into purer groups (measured by Gini). It is easy to read but twitchy — change a few rows and the whole tree can change — and it can only cut straight, axis-aligned lines, so diagonal boundaries need a clumsy staircase. That very instability is what makes trees the perfect building block for random forests and boosting.`,
    interactiveId: 'decision_tree_viz',
  },
  {
    id: 'random_forest',
    interactiveId: 'random_forest_viz',
    title: 'Random Forests',
    subtitle: 'Bagging, OOB error, feature importance, hyperparameter sensitivity',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['random forest', 'bagging', 'ensemble'],
    summary: `A single decision tree has a structural problem: change ten training examples and the root split may change, cascading a completely different tree structure at every level. The model is fragile. But notice what the fragility means — different training samples produce different trees. If you train many trees on slightly different samples and average their predictions, the errors partially cancel and the correct predictions reinforce. That is the key insight behind random forests.

Here is how it works. Each of T trees is trained on a bootstrap sample — draw n examples with replacement from the training set. Why does each bootstrap sample contain roughly 63% unique examples? The probability that a specific example is not selected in a single draw is $(1 - 1/n)$. The probability it is missed across all n draws is $(1 - 1/n)^n$, which converges to $e^{-1} \\approx 0.368$ as $n \\to \\infty$. So ~36.8% of examples are left out of each bootstrap sample — the out-of-bag (OOB) examples — and ~63.2% appear at least once. Each tree is trained on a genuinely different slice of the data.

But bootstrap sampling alone is not enough. If income is the strongest predictor of loan default, every tree will place it at or near the root. All trees make the same root split and their predictions remain highly correlated. Averaging correlated predictions helps far less than averaging uncorrelated ones. The exact formula: ensemble variance $= \\rho\\sigma^2 + \\frac{(1-\\rho)\\sigma^2}{T}$, where $\\rho$ is pairwise inter-tree correlation and $\\sigma^2$ is a single tree's variance. As T grows, the second term shrinks to zero — the variance floor is $\\rho\\sigma^2$, set entirely by inter-tree correlation. Past roughly 200–500 trees the floor is already reached; adding more trees costs compute without reducing variance further.

The fix is random feature subsampling. At each split — not just each tree, but each individual split decision — consider only a random subset of $\\sqrt{p}$ features (classification) or $p/3$ (regression) rather than all $p$. Even if income dominates, trees that do not see it at a given split must discover other predictive structure. Different trees find different patterns. Correlation $\\rho$ drops. The variance floor drops. This is also why random forests handle $p >> n$ well: with $p$ = 10,000 features and $n$ = 500 samples, any single tree fitting all features would overfit catastrophically. Each split sees only $\\sqrt{10000} = 100$ randomly selected features, and averaging across many different random subsets effectively covers all features without any single tree memorising them.

A regression random forest has a critical production limitation: it cannot extrapolate beyond the range of training targets. Every leaf prediction is a mean of training targets in that leaf, bounded by the training minimum and maximum. A forest trained on house prices from 2015–2020 (training max: 800k) returns at most 800k for any 2024 input — regardless of the input features. The model does not know prices have risen. For time-series regression where the target trends upward over time, this failure is systematic and silent: cross-validation within the training window looks healthy while the deployed model systematically underpredicts.

Random forests outperform gradient boosting in four situations. First, noisy labels: averaging multiple independent predictions is inherently more robust to label noise than sequential residual fitting, which corrects each mistake aggressively and can amplify noise. Second, sparse high-dimensional features (text-derived, one-hot encoded categoricals): random feature subsampling finds the rare informative features even in very high dimensions. Third, no tuning budget: RF defaults (n_estimators=100, max_features='sqrt') are competitive on many datasets; XGBoost defaults are often worse than RF defaults and require meaningful tuning to outperform a simple forest. Fourth, parallel training required: each RF tree is fully independent and trains simultaneously on a separate core; gradient boosting is inherently sequential.

**NOT this.** Most people think "more trees always help." Past roughly 100–500 trees, the variance reduction from adding another tree is negligible — the $(1-\\rho)\\sigma^2/T$ term is already near zero. Adding more trees spends compute without moving accuracy. The parameter that actually moves the variance floor is max_features, which controls $\\rho$. Halving max_features continues to reduce variance even with 1000 trees already. The most impactful hyperparameter is the one that controls inter-tree diversity, not quantity.

The OOB error exploits bootstrap sampling. For each training example, average only the predictions of trees that did not include it in their bootstrap sample — those trees have truly never seen this example. The OOB error is a genuine out-of-sample estimate at no extra computational cost, equivalent in reliability to 5-fold CV for datasets with n > 1000. Enable it with oob_score=True. A large gap between OOB error and held-out test error signals either distribution shift or data leakage.`,
    keyPoints: [
      `**Use random forests when you need a strong tabular baseline with minimal tuning, especially when interactions matter and you cannot specify them in advance.**\n\nRandom forests are the right first ensemble for classification and regression on tabular data. They handle mixed feature types, require no scaling, are robust to irrelevant features, and provide free OOB validation. Default hyperparameters (max_features=\`sqrt\`, n_estimators=100) are competitive on many datasets without any tuning. Prefer gradient boosting when you need the last 1–2% of accuracy and are willing to tune; prefer random forests when you need a reliable baseline fast.`,
      `**The production trap: using Gini importance to rank features. It is systematically biased toward high-cardinality and continuous features.**\n\nGini importance accumulates total impurity reduction across all splits on a feature. A continuous income feature with 10,000 candidate thresholds gets far more split opportunities than a binary flag — inflating income's apparent importance regardless of actual predictive value. Fix: use permutation importance. For each feature j, shuffle its values across all test (or OOB) samples, breaking the relationship between that feature and the target. Measure the accuracy drop. A large drop means the feature was load-bearing; near-zero drop means the forest predicted just as well without it. Repeat 5–10 times and average to reduce variance. SHAP values are an alternative that also correctly handles correlated features (Gini double-counts correlated features; SHAP allocates shared credit correctly).`,
      `**The diagnostic: compare OOB error to held-out test error. A large gap signals distribution shift or data leakage.**\n\nOOB error is a reliable estimate of performance on data drawn from the same distribution as training. If OOB error is 10% and test error is 25%, the test set comes from a different distribution — or there was leakage that made training too easy. Run a feature distribution check (KS-test or histogram comparison) between train and test. If distributions differ, the model was not trained on the right data for the deployment context.`,
    ],
    interactivePrompt: `Before you touch the controls: if you increase the number of trees from 100 to 1000 while keeping max_features fixed, how much do you expect the test accuracy to change?`,
    checkQuestions: [
      {
        q: `A random forest with 500 trees takes too long to train. What do you tune first, and what accuracy tradeoff do you expect?`,
        options: [
          `\`A) Reduce max_depth first — shallower trees train faster and the accuracy loss is minimal because deep trees in a random forest overfit anyway. Set max_depth=10 as a starting point and tune downward until training time is acceptable.\``,
          `\`B) First: check n_jobs=-1 (parallelise across cores) — this is free and often gives 4-16× speedup with no accuracy loss. Second: reduce n_estimators to 100 — the OOB error curve is typically flat past ~100-200 trees; accuracy loss is usually <0.5%. Third: reduce max_features (fewer features evaluated per split — faster splits). Fourth: increase min_samples_leaf (stops growing leaves with few samples — shallower trees, faster). For very large datasets (n > 1M): set max_samples < 1.0 to subsample without replacement per tree. Always verify with the OOB error that the reduced model is within 1% of the full model.\``,
          `\`C) Switch to a gradient boosted model (XGBoost or LightGBM) — they achieve the same or better accuracy as a random forest with far fewer trees (typically 100-300) because each tree corrects the previous one rather than being independent. Training time drops proportionally.\``,
          `\`D) Reduce max_features to 1 — this gives maximum tree diversity and fastest split selection, and since random forests benefit from diverse trees, reducing max_features always improves both speed and accuracy simultaneously.\``,
        ],
        answer: `B`,
      },
      {
        q: `Your random forest's OOB error is 10% but test error is 25%. What does this mean?`,
        options: [
          `\`A) Large OOB-test gap indicates distribution shift or data leakage. OOB error estimates performance on training distribution (same X distribution as training data). A 15% gap means the test data comes from a different distribution than training data — or there was data leakage that made OOB unrealistically optimistic. Investigate: (1) Compare feature distributions between train and test (histogram, KS-test). (2) Check for temporal leakage: if test data is future data and training data includes features computed from the future. (3) Check for target leakage: features that encode the label. OOB error is a reliable estimate only when train and test are iid draws from the same distribution.\``,
          `\`B) The 15% gap is within expected variance for random forests — OOB samples are a biased subsample (only ~37% of training data per tree), which systematically underestimates true test error. A gap up to 20% is normal and does not indicate a problem; report test error and ignore OOB for final evaluation.\``,
          `\`C) The OOB error of 10% means the model is slightly underfitting (train error too high) while the 25% test error means it is simultaneously overfitting. This contradictory result indicates the random forest's n_estimators is at a transition point; add more trees until OOB and test errors converge.\``,
          `\`D) The gap means the number of trees is insufficient — with 500 trees OOB samples are still noisy; the 15% gap shrinks as n_estimators grows. Increase n_estimators to 2000 and the OOB estimate will approach the true test error.\``,
        ],
        answer: `A`,
      },
      {
        q: `Two features both have high Gini importance in a random forest, but when you remove either one individually, model performance barely changes. Explain and fix.`,
        options: [
          `\`A) High Gini importance with minimal impact on removal means the features are important for early splits but redundant for final leaf predictions. The tree's top-level structure depends on them but the leaves can recover accuracy without them. Use partial dependence plots to confirm that both features have flat marginal effects.\``,
          `\`B) The features are important but their effect is non-linear — Gini importance correctly identifies them as important, but your performance metric (e.g., accuracy) is insensitive to their contribution. Measure feature impact using AUC or F1 rather than accuracy, and you will see the expected performance drop.\``,
          `\`C) The result confirms both features are genuinely important and the model is robust — a good random forest should be resilient to removing any single feature because it distributes predictive weight across many features. High individual importance combined with removal resilience is expected for well-trained ensembles.\``,
          `\`D) The two features are highly correlated — they carry the same information. When both are present, the random forest splits on each when the other is unavailable (due to max_features subsampling), giving both high total impurity reduction. But each feature alone is sufficient. Gini importance double-counts correlated features. Fix: (1) Use permutation importance — shuffle each feature while keeping the other, measure accuracy drop. A redundant feature's permutation importance will be near zero when its correlated partner is present. (2) Use SHAP values, which correctly attribute importance in the presence of correlated features. (3) Remove one of the pair: measure OOB error with and without each; keep the one whose removal hurts more.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Random forest variance floor is $\\rho\\sigma^2$ — set by inter-tree correlation not tree count; reducing max_features lowers $\\rho$ and the floor; but regression forests cannot extrapolate beyond training target range, a silent failure when the target trends over time in production.`,
    interactiveId: 'random_forest_viz',
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

So the map is simple. Reach for a **random forest** when you want a strong, hands-off baseline that shrugs off noise and needs almost no tuning. Reach for **gradient boosting (XGBoost or LightGBM)** when you want the last few points of accuracy and are willing to tune the learning rate, the tree depth, and the stopping carefully — because here each tree is a step, and steps can overshoot.`,
    keyPoints: [
      `**What gradient boosting is, and when to reach for it: trees trained in a line, each one fixing the team's leftover mistakes.**\n\nOnce it is tuned, gradient boosting is usually the most accurate thing you can run on tabular data — it chips away at both bias and variance, where a random forest only fights variance. That accuracy is why it wins most structured-data competitions. Use XGBoost or LightGBM instead of the basic scikit-learn version: both are faster, come with regularisation built in, and support early stopping out of the box. Lean on LightGBM for very large datasets (its leaf-by-leaf growth is quicker) and XGBoost for smaller ones, where the extra caution against overfitting helps.`,
      `**The trap: fixing the number of trees up front instead of letting early stopping choose it.**\n\nWith a learning rate of 0.1 and 1000 trees hard-coded, the held-out loss usually bottoms out somewhere around 200–400 trees and then starts climbing as the extra trees begin memorising noise. Hard-code the count and you sail right past the best point into an overfit model. Instead, always turn on early stopping (stop after about 50 rounds with no improvement) and let the model pick its own tree count. Then, to squeeze out a little more, lower the learning rate and re-run — smaller steps often reach a slightly better place.`,
      `**The check to run: plot the training loss and the held-out loss against the number of trees.**\n\nHeld-out loss still falling means you are underfitting — add trees or lower the learning rate. Held-out loss flat and close to the training loss means you are in good shape. Held-out loss creeping up while training loss keeps dropping means you are overfitting — stop earlier, use shallower trees, or let each tree see only a random subset of the rows. If the held-out loss never comes down at all, your learning rate is probably too high; start it around 0.05 to 0.1.`,
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
    ],
    takeaway: `Gradient boosting trains trees in a line, each one fitting the team's current misses — and those misses are literally the loss gradient, so every tree is one careful step of gradient descent on the prediction function. That is why it handles any goal you can write as a loss, why the trees stay shallow and the steps small, and why early stopping (not a fixed tree count) is how you size it. XGBoost won by baking regularisation and curvature into every split.`,
  },
  {
    id: 'ensembles',
    interactiveId: 'ensemble_viz',
    title: 'Ensemble Methods',
    subtitle: 'Bagging vs boosting vs stacking, diversity principle',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['ensembles', 'stacking', 'bagging', 'boosting'],
    summary: `A bank wants to predict loan default. They train a decision tree: 76% accuracy. They try logistic regression: 78%. They try a random forest: 84%. Good, but not good enough. Then they combine all three — majority vote on the binary prediction. The ensemble reaches 86%. The best single model was 84%. Why does combining weaker models beat the best single model?

The answer is that model A is wrong on examples where models B and C happen to be right. When you average their predictions, the errors partially cancel. The correct predictions reinforce. This only works if the errors are not fully correlated — if A fails on exactly the same examples as B and C, averaging does nothing. The diversity principle makes this precise: ensemble error ≈ ε(1 + (T−1)ρ) / T, where ε is individual model error and ρ is pairwise error correlation. With T = 10 models at 20% error: if ρ = 0.9, ensemble error ≈ 18.2%. If ρ = 0.1, ensemble error ≈ 3.8%. The same models, radically different results. Diversity is the only lever that actually moves the floor.

Bagging, boosting, and stacking are three strategies for building diverse ensembles on the loan default problem. Bagging trains T models on T bootstrap samples of the training data and averages predictions — each model sees a different slice of the data, which decorrelates their errors and reduces variance. Random forest is bagging applied to decision trees with an additional feature-subsampling trick at each split. Boosting trains models sequentially: each new model focuses on the examples the current ensemble gets wrong. This targets bias rather than variance, and is why gradient boosting often beats random forest on hard tabular tasks. Stacking is the most general approach: train diverse base models (a tree, a logistic regression, a neural net), use their out-of-fold predictions as features, and train a meta-learner to combine them. The meta-learner learns which base model to trust in which region of the input space.

The stacking trap is subtle. If you train base models on the full training set, then feed their training-set predictions to the meta-learner, the meta-learner sees information-leaked inputs — each base model perfectly predicts its own training examples, and those near-perfect outputs train the meta-learner to trust a signal that will not exist at test time. The fix is out-of-fold predictions: train each base model on k−1 folds, predict on fold k. These held-out predictions represent genuine generalization, not memorization.

**NOT this.** More models always improve an ensemble. Diversity, not quantity. Adding a model that is perfectly correlated with an existing one contributes nothing — the marginal value of adding model M to ensemble E is proportional to (1 − correlation between M's errors and E's errors). Two models with 80% accuracy but uncorrelated errors can ensemble to 96%. Two models with 80% accuracy and fully correlated errors ensemble to 80%. This is why running five random forests with different random seeds gives almost no gain, but adding a logistic regression to one random forest can give a meaningful lift.

The formal statement for the ensemble variance floor: Var(ensemble) = ρσ² + (1 − ρ)σ²/T. As T grows, the second term shrinks to zero and the floor is ρσ². Adding more trees past ~200 does not reduce ρ — only adding qualitatively different model families does.`,
    keyPoints: [
      `**Build a stacking ensemble when you have multiple model families (trees, linear, neural nets) and a large enough dataset for out-of-fold predictions — it almost always beats any individual model by 1–3 points at the cost of training time.**\n\nIn the loan default setting: combine random forest (AUC 0.83), gradient boosting (AUC 0.85), and logistic regression (AUC 0.79) with a ridge-regularized meta-learner on OOF predictions. The meta-learner discovers that gradient boosting dominates on high-income applicants while logistic regression is more reliable on thin-file applicants — their complementary strengths produce a stacked AUC of 0.88.`,
      `**Trap: evaluating base models on training data before training the meta-learner creates leakage — the meta-learner memorizes which model was overfit on which examples.**\n\nIn the loan default stack: if the decision tree's training-set predictions are used as meta-features, the tree achieves near-perfect accuracy on its training examples (it memorized them). The meta-learner learns to trust the tree's very-high-confidence outputs, which only exist because of memorization. At test time, those outputs are calibrated to the training distribution, not the test distribution. The meta-learner has been trained on a lie. Always use out-of-fold predictions. sklearn's cross_val_predict with method='predict_proba' generates them in one call.`,
      `**Diagnostic: measure the per-model error correlation matrix on validation set errors. If all ensemble members have error correlation > 0.9, you are not gaining diversity — add a qualitatively different model family or apply feature subsampling.**\n\nFor the loan default ensemble: compute the binary error vector (1 = wrong, 0 = correct) for each model on a held-out validation set. Compute pairwise Pearson correlation. If the decision tree and the random forest have error correlation 0.95, they are essentially the same model for ensemble purposes. Adding a 50th random forest to the ensemble would raise correlation further and help nothing. The solution is to add a model trained on a fundamentally different feature representation — for example, adding interaction features that the tree family never sees.`,
    ],
    interactivePrompt: `Before you touch the controls: if you replace one model in the ensemble with an identical copy of an existing model (same algorithm, same hyperparameters, same training data), do you expect the ensemble accuracy to go up, stay the same, or go down?`,
    checkQuestions: [
      {
        q: `Your stacking ensemble overfits: high training accuracy but low CV accuracy on the meta-learner. What is the likely cause and fix?`,
        options: [
          `\`A) The meta-learner is too complex — a deep neural network or high-capacity model as meta-learner will memorise the base model output patterns from training data. Replace the meta-learner with a simple linear model (logistic regression with no regularisation) to prevent it from overfitting the base model outputs.\``,
          `\`B) The base models are too similar — if multiple random forests are in the stack, they produce correlated outputs that confuse the meta-learner into finding spurious patterns. Remove all but one random forest and replace with a qualitatively different model class to increase diversity.\``,
          `\`C) Data leakage in meta-features. If base models were trained on the full training set and their training-set predictions were used as meta-features, the meta-learner sees optimistically good predictions — base models have memorised the training labels, so their training-set outputs are near-perfect even for hard examples. The meta-learner learns to trust these over-optimistic signals and fails on validation data. Fix: generate meta-features using out-of-fold (OOF) predictions — each base model is trained on k-1 folds and predicts on the held-out fold k. These OOF predictions represent what the base models can genuinely generalise to, not what they memorised.\``,
          `\`D) The training set is too large relative to the meta-learner's capacity. With many training examples, the meta-learner finds complex patterns in the base model outputs that do not generalise. Subsample the training set to roughly 10× the number of base models before fitting the meta-learner.\``,
        ],
        answer: `C`,
      },
      {
        q: `You have three diverse models: a random forest (AUC=0.82), gradient boosting (AUC=0.85), and logistic regression (AUC=0.78). How would you build an ensemble, and what AUC would you expect?`,
        options: [
          `\`A) Start with simple averaging of probability outputs: ensemble_score = (0.33×RF_prob + 0.33×GBM_prob + 0.33×LR_prob). Evaluate on a held-out set — simple averaging often achieves AUC 0.86-0.87, slightly above the best single model. Next try weighted averaging: weights proportional to individual AUCs, optimised on a validation set (e.g., 0.25×RF + 0.50×GBM + 0.25×LR). If that helps, try stacking with OOF predictions as meta-features and a ridge-regularised logistic regression as meta-learner. The gain comes from diversity: RF and GBM make different errors (RF uses random feature subsets, GBM does sequential residual fitting), so their errors partially cancel.\``,
          `\`B) Drop logistic regression (AUC=0.78) — it is the weakest model and including it will drag down the ensemble below GBM's 0.85 AUC. Build the ensemble with RF and GBM only using a weighted average with weights proportional to AUC² (0.40×RF + 0.60×GBM). Expected AUC: 0.87-0.88.\``,
          `\`C) Build a boosting ensemble where the residuals of GBM (the best single model) are passed as the target for RF and logistic regression sequentially. This extends the boosting principle from trees to different model classes and should achieve AUC ~0.91 by targeting the specific examples GBM gets wrong.\``,
          `\`D) Use majority voting: the prediction is the class that at least 2 of the 3 models agree on. This is more robust than probability averaging because it is not affected by probability miscalibration. Expected AUC: equal to the median model (0.82), since majority voting cannot exceed the middle-ranking model's performance.\``,
        ],
        answer: `A`,
      },
      {
        q: `Two models make identical errors on the test set: wherever model A is wrong, model B is wrong on the same examples. What is the ensemble's test accuracy, and what does this illustrate about diversity?`,
        options: [
          `\`A) Ensemble accuracy = average of the two models' accuracies. Since both models make errors on the same examples but may disagree on the correct label, the ensemble averages their probabilities — this always improves over the weaker model and matches the stronger model at best.\``,
          `\`B) Ensemble accuracy = individual model accuracy — no improvement at all. The diversity principle: if models make identical errors (correlation ρ=1), averaging does nothing because the errors do not cancel. The ensemble error formula: ε_ensemble ≈ ε(1+(T-1)ρ)/T. With ρ=1 and T=2: ε_ensemble ≈ ε(1+1)/2 = ε. This is why using the same algorithm with different random seeds gives minimal gain (high ρ), while combining a neural network and a gradient boosted tree gives more gain (different inductive biases lead to different error patterns, lower ρ).\``,
          `\`C) Ensemble accuracy = higher of the two models' individual accuracies. Identical errors mean both models agree on mistakes, but the confidence of the correct model is higher on examples it gets right — probability averaging amplifies the signal from correct predictions and the ensemble attains max(acc_A, acc_B).\``,
          `\`D) The ensemble has undefined accuracy — if both models make identical errors they both agree on wrong labels, meaning the ensemble's probability output is confidently wrong on those examples. This creates a systematic bias that can only be corrected by adding a third model with independent errors.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Ensemble gains come from error diversity, not model count — the variance floor is ρσ², set entirely by inter-model error correlation, so adding more copies of the same algorithm does almost nothing while adding a qualitatively different model family can drop error by several points.`,
    interactiveId: 'ensemble_viz',
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
      `**Use kernel SVMs when n < 50K, the feature space is moderate-dimensional, and you have reason to believe the data is separable with a wide margin (e.g., clean binary classification with low noise).**\n\nSVMs excel on small, clean datasets with well-defined boundaries — classic use cases include bioinformatics, text classification with TF-IDF features (linear SVM), and image patches. For n > 50K, switch to sklearn\`s LinearSVC (liblinear solver, O(nd) time) or SGDClassifier with hinge loss. Always StandardScaler before any SVM — the RBF kernel uses Euclidean distance and an unscaled feature with range [0, 1000] will dominate a feature with range [0, 1] regardless of predictive value.`,
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

Feature scaling is not optional. Age ranges from 0 to 100. Income ranges from 0 to 500,000. Without standardization, a $1 difference in income contributes 5,000× more to Euclidean distance than a 1-year age difference. The nearest neighbors are found entirely in the income dimension. A 50-year-old on $50K looks identical to a 1-year-old on $50K. StandardScaler before kNN is non-negotiable.

The deeper failure mode is dimensionality. kNN works because nearby points in feature space share labels — local homogeneity. In high dimensions, that assumption breaks. As the number of dimensions grows, the ratio of the distance to the nearest neighbor versus the farthest neighbor converges toward 1. Every point becomes approximately equidistant from every other. The neighborhood concept collapses: there is no meaningful local structure, only a global average. With d = 100, k = 10 nearest neighbors are barely more similar to the query than randomly drawn points.

The production resurrection of kNN is approximate nearest neighbor search. FAISS, HNSW, and ScaNN build indexes that find approximate nearest neighbors in O(log n) instead of O(n). HNSW at 95% recall@10 queries 10 million vectors in under 1 millisecond. Every embedding-based recommendation system, every vector database (Pinecone, Weaviate, Chroma), and every dense retrieval system in a RAG pipeline is kNN with an approximate index. The algorithm is from the 1960s; the implementation is state of the art.

**NOT this.** kNN is a toy algorithm that does not scale. Nearest-neighbor search is the production architecture for modern retrieval. When a language model generates a query embedding and retrieves relevant documents, it is running kNN against an index of millions of passage embeddings. When a recommendation system finds the top-50 similar users to target for a new item, it is running kNN against a user embedding matrix. The algorithm is ancient. The feature spaces it operates on — dense embeddings from transformers — are not.

The formal statement: exact kNN is O(nd) per query where n is the number of indexed vectors and d is the dimensionality. ANN indexes reduce this to O(d log n) or better, with recall controlled by a search parameter. For the digit classifier: n = 60,000, d = 784, brute force takes ~47M ops. For a production recommendation system: n = 10M, d = 256, brute force takes ~2.56B ops per query — ANN takes ~600K ops at 95% recall.`,
    keyPoints: [
      `**Always use ANN (FAISS, HNSW) when n > 100K — exact kNN is O(n) per query and completely infeasible at scale. HNSW gives sub-millisecond search over 100M vectors at 95%+ recall.**\n\nFor the digit classifier at 60K training images, brute-force kNN runs in ~1ms per query on modern hardware — acceptable. Scale to 10M items and exact kNN takes ~160ms per query, which kills any real-time system. HNSW reduces this to under 1ms at 95% recall@10. The transition point: once n exceeds ~100K, reach for FAISS or HNSW before any other optimization. The recall-speed tradeoff is controllable via the ef (search width) parameter — set it higher for better recall, lower for lower latency.`,
      `**Trap: forgetting to scale features. If feature ranges differ by 1000×, kNN sees only the largest-range feature. StandardScaler or L2-normalize embeddings before indexing — this mistake silently destroys retrieval quality with no obvious error.**\n\nFor the digit classifier: pixel values range from 0 to 255, so scaling is uniform and kNN works correctly. For a user-feature matrix with age (0–100) and annual income (0–500,000), raw Euclidean distance finds "nearest neighbors" by income alone. A 20-year-old earning $80K is identified as nearest to a 65-year-old earning $80,001, ignoring the 45-year age gap. StandardScaler brings both features to unit variance. For embedding vectors from transformers: L2-normalize before indexing so that cosine similarity equals the dot product — the default in FAISS's IndexFlatIP.`,
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

The "naive" assumption is that words are conditionally independent given the class. This is obviously false. "Stock" and "market" co-occur constantly. "Credit" and "card" cluster together. The joint P(stock, market|spam) is nothing like P(stock|spam) × P(market|spam). The model is provably wrong about the joint distribution. Yet it works. The reason: you do not need the correct probability, only the correct ranking. Is P(spam|words) > P(ham|words)? Naive Bayes gets the ordering right even when the individual probabilities are wrong, because the errors in the independence assumption tend to be symmetric — both classes' probabilities are over-estimated by roughly the same factor.

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
  },
  {
    id: 'calibration',
    interactiveId: 'calibration_curve_viz',
    title: 'Model Calibration',
    subtitle: 'Reliability diagrams, ECE, Platt scaling, isotonic regression',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['calibration', 'ECE', 'Platt scaling', 'reliability'],
    summary: `A model with high AUC ranks examples correctly — it scores true positives above false positives. But a ranking and a probability are different things.

A model that outputs 0.9 for a group of patients where the true disease rate is 0.6 is confidently wrong: the ranking may be correct (the 0.9 patients are higher risk than the 0.5 patients) but the probability is useless for any downstream decision that asks "how likely is this specific patient to have the disease?" Miscalibration is the rule, not the exception: random forests push predictions toward 0 and 1 because averaging many trees concentrates the vote; SVMs output distances, not probabilities; naive Bayes over-counts correlated evidence and saturates. Calibration matters whenever the probability itself is used — risk scoring, insurance pricing, medical decisions, or as input to a meta-learner in stacking.

The fix is post-hoc: hold out a calibration set, fit a mapping from raw model scores to empirical probabilities, and validate the fix on the test set.`,
    keyPoints: [
      `**A reliability diagram reveals miscalibration: bin predictions into M buckets, and for each bin plot the mean predicted probability against the actual fraction of positives.** Perfect calibration is the diagonal y=x. A curve below the diagonal means the model is overconfident — it predicts 0.8 for events that occur 0.6 of the time. A curve above the diagonal means underconfidence. The shape (S-curve, monotone shift) determines which calibration method to apply.`,
      `**ECE (Expected Calibration Error) quantifies miscalibration as the weighted average of |confidence_b − accuracy_b| across bins, weighted by bin size.** It collapses a reliability diagram to a single number — lower is better, 0 is perfect calibration. MCE (Maximum Calibration Error) measures the worst-bin deviation and matters when a single miscalibrated region has high stakes. Use ECE for overall summary and MCE when tail miscalibration is critical.`,
      `**Tree-based models are systematically overconfident because the prediction at each leaf is the training fraction in that leaf.** With small leaves, those fractions are near 0 or 1 regardless of the true class probability. Random forests average many leaves, but the average of many near-extreme values is still extreme. This is not a bug — it is a consequence of how trees split. Platt scaling or isotonic regression are the standard post-hoc fixes.`,
      `**Platt scaling fits logistic regression σ(af+b) on a held-out calibration set, where f is the model's raw score or logit.** Two parameters, fast to fit, appropriate when miscalibration is monotone — the reliability curve is sigmoid-shaped relative to the diagonal. It is the first calibration method to try. The risk is that logistic calibration cannot fix non-monotone miscalibration, where the model is overconfident in some score ranges and underconfident in others.`,
      `**Isotonic regression fits a non-decreasing step function mapping raw scores to calibrated probabilities, with no parametric form assumed.** It can correct any shape of miscalibration, including non-monotone patterns. The cost is that it requires at least 1000 calibration samples to avoid overfitting — with fewer samples, isotonic regression just memorises the calibration set. Use Platt when data is scarce; isotonic when you have sufficient calibration data and the miscalibration is clearly non-monotone.`,
      `**Temperature scaling for neural networks divides all logits by a scalar T before the softmax: P(y=k|x) = softmax(z/T).** T > 1 flattens the output distribution — reducing overconfidence without changing the ranking (AUC is preserved). T < 1 sharpens it. Only one parameter is fit on the validation set, making overfitting impossible even with a small calibration set. Temperature scaling is remarkably effective because neural network miscalibration is predominantly a uniform scaling issue, not a non-monotone one.`,
      `**Calibration and discrimination are orthogonal.** A model can have excellent AUC (perfect ranking) but terrible calibration (the probabilities are wrong), or be perfectly calibrated (each probability is empirically correct) but poor AUC (the probabilities barely separate classes). A credit model might correctly rank 10,000 applicants by default risk while systematically underestimating the absolute probability — great for ranking decisions, useless for setting loan loss reserves. You need both metrics to fully evaluate a probabilistic model.`,
      `**The calibration set must be separate from both training and test sets.** Using the training set to calibrate produces a degenerate calibrator that memorises training outputs — the calibrated model appears perfect on training data and fails on test data. Using the test set to calibrate contaminates your generalisation estimate — you are fitting to test data, and the resulting ECE on the test set is optimistically biased. The correct setup: split data into train / calibration / test, calibrate on the calibration set, evaluate calibration quality on the test set.`,
    ],
    checkQuestions: [
      {
        q: `A Random Forest predicts P(y=1) = 0.9 for many samples, but only 60% of those samples are actually positive. What calibration technique would you apply and how?`,
        options: [
          `\`A) The model is overconfident — predictions near 0.9 correspond to actual frequency of 0.6. Apply isotonic regression or Platt scaling on a held-out calibration set (not the training set). Isotonic regression is preferred here if the calibration set has > 1000 samples, because the miscalibration may be non-monotone across the full probability range. Steps: (1) Hold out a calibration set during training. (2) Obtain raw model scores on the calibration set. (3) Fit isotonic regression mapping scores to labels. (4) At test time, pass raw scores through the isotonic regressor to get calibrated probabilities. Validate on a separate test set — never on the calibration set used to fit the calibrator.\``,
          `\`B) The model is overconfident. Retrain with stronger regularisation (increase min_samples_leaf in the random forest) — this prevents leaves from reaching near-pure class probabilities during training, which is the root cause of overconfident predictions at 0.9. No post-hoc calibration is needed.\``,
          `\`C) The model is underconfident: if 60% of samples at P=0.9 are positive, the model is actually correct that most are positive — the reliability diagram shows the model is slightly overconfident but within the expected range. Only calibrate if ECE > 0.15 on the full validation set.\``,
          `\`D) Apply temperature scaling: divide all random forest probability outputs by a temperature T > 1 before making predictions. T=1.5 typically corrects overconfidence in tree-based models. Temperature scaling is preferred over isotonic regression because it has only one parameter and cannot overfit the calibration set.\``,
        ],
        answer: `A`,
      },
      {
        q: `Your neural network is overconfident (ECE = 0.15). You apply temperature scaling and get ECE = 0.03. The temperature T chosen is 2.5. What does T=2.5 mean mechanically?`,
        options: [
          `\`A) T=2.5 means the softmax output is averaged over 2.5 training epochs at the end of training — temperature annealing smooths the final probability distribution by mixing predictions from recent and earlier checkpoints, reducing overconfidence without changing the model weights.\``,
          `\`B) T=2.5 is a multiplicative penalty applied to the cross-entropy loss during training: L_scaled = L / T. Dividing the loss by 2.5 reduces the gradient magnitude, slowing learning and preventing the network from converging to overconfident predictions. Temperature scaling modifies training, not inference.\``,
          `\`C) Temperature scaling divides the logit vector z by T before softmax: P(y=k|x) = softmax(z/T)_k. T=2.5 > 1 means the logit vector is scaled down by a factor of 2.5 — the differences between classes are reduced, making the softmax distribution flatter (less confident). Before scaling: if the top logit is 5.0 and second is 2.0 (difference 3.0), the network is very confident. After scaling by 2.5: the logits become 2.0 and 0.8 (difference 1.2), softmax gives a less extreme distribution. Mechanically, T scales the confidence of every prediction uniformly — it is a single parameter that can correct systematic overconfidence without changing the model's ranking (AUC is preserved).\``,
          `\`D) T=2.5 means 2.5 calibration parameters were fitted — temperature scaling is a generalisation of Platt scaling that fits T independent scalar parameters, one per output class. For a 2-class problem T is a scalar; for K classes T is a K-dimensional vector. T=2.5 for K=2 indicates the positive and negative class logits are scaled by 2.5 and 1.0 respectively.\``,
        ],
        answer: `C`,
      },
      {
        q: `You have a stacking ensemble where a miscalibrated base model is one of the inputs to the meta-learner. Why is calibration critical here, and what happens if you do not calibrate?`,
        options: [
          `\`A) Calibration is not critical for stacking — the meta-learner's job is precisely to learn the relationship between base model outputs and the true label. A miscalibrated base model just means its outputs are on a different scale, and the meta-learner learns to compensate by adjusting its weights. Calibration before stacking is redundant work.\``,
          `\`B) The meta-learner uses base model probability outputs as features. If a base model is overconfident (outputs 0.95 when the true probability is 0.65), the meta-learner receives a feature value of 0.95 for what is actually a moderate-confidence example. The meta-learner tries to learn the relationship between these features and the true label — but miscalibrated features have a different scale than calibrated ones, making the meta-learner's job harder. In the worst case: the meta-learner trusts the overconfident model too much (the feature 0.95 looks like a strong signal) and under-weights the other base models. After calibration, all base models' outputs are on the same probability scale, and the meta-learner can correctly learn their relative reliability.\``,
          `\`C) Miscalibration in a base model causes the meta-learner to overfit — the meta-learner tries to correct the miscalibration by learning a complex mapping from the distorted outputs to the true labels, using up its capacity that should be spent on combining base model predictions. Calibration is critical for preventing meta-learner overfitting.\``,
          `\`D) A miscalibrated base model has lower AUC than a calibrated one, so the meta-learner assigns it less weight. Calibration is critical because it directly improves each base model's AUC, and the meta-learner's weighted average will be better overall when all base models have higher individual AUC.\``,
        ],
        answer: `B`,
      },
    ],
    takeaway: `AUC measures ranking; calibration measures whether the probabilities themselves are right. A model with AUC=0.95 and ECE=0.20 ranks examples correctly but its probability outputs are wrong — it is confidently wrong, not confidently right. Any time the downstream decision uses the probability — not just the rank — plot the reliability diagram before trusting the model.`,
  },
  {
    id: 'class_imbalance',
    interactiveId: 'class_imbalance_viz',
    title: 'Class Imbalance',
    subtitle: 'SMOTE, threshold tuning, class weights, precision@K',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['imbalance', 'SMOTE', 'precision@K', 'threshold'],
    summary: `A classifier on a 99:1 dataset can achieve 99% accuracy by predicting the majority class for every single example. It never makes a prediction about the rare class and it is completely useless — yet standard training procedures optimise exactly this metric. The root problem is that accuracy assumes false positives and false negatives cost the same; in fraud detection, cancer screening, and equipment failure prediction, they do not. The imbalance is not the problem: unequal class costs are the problem, and the imbalance is just what exposes them. Fix it at the right level. Class weights reweight the loss function so that misclassifying a minority example costs more, using the same gradient descent that was ignoring the minority class to now focus on it — no data changes, no new samples, just a different loss. Threshold tuning at deployment is always necessary regardless of training procedure, because the cost ratio of false positives to false negatives is problem-specific and the default 0.5 threshold almost never matches it.`,
    keyPoints: [
      `**Accuracy is the wrong metric for imbalanced problems.** On a 99:1 dataset, a model predicting majority class always achieves 99% accuracy while capturing 0% of the minority class. Precision, recall, F1, PR-AUC, and business cost metrics expose what accuracy hides. The choice of evaluation metric is not less important than the choice of model — a bad metric will lead you to select the wrong model every time.`,
      `**Class weights reweight the loss so minority class errors are penalised more heavily: wₖ = n/(K·nₖ), which sklearn computes automatically with class_weight="balanced".** Each minority example contributes more to the gradient update than a majority example. This shifts the decision boundary toward better minority class recall without modifying the training data or generating synthetic points. It is the cheapest first intervention and should always be tried before any data-level method.`,
      `**SMOTE generates synthetic minority samples by interpolating between a minority point and one of its k nearest minority neighbours — creating new points in the minority class region rather than duplicating existing ones.** The failure mode is placing synthetic points in regions where the minority and majority classes overlap, creating confusing training examples. SMOTE works best when the minority class has a compact, well-separated region; it hurts when minority and majority regions interleave.`,
      `**Undersampling removes majority class samples to restore balance.** Random undersampling is fast but discards information. Tomek links removal is smarter: it removes majority samples that are the nearest neighbour of a minority sample — cleaning the class boundary without random information loss. Combining SMOTE (oversample minority) with Tomek link removal (clean boundary) is often better than either alone because you add minority-class signal and simultaneously remove boundary ambiguity.`,
      `**Threshold tuning is always required at deployment because the default 0.5 threshold assumes equal costs for false positives and false negatives.** In fraud detection, missing a fraud (false negative) costs far more than flagging a legitimate transaction (false positive). The optimal threshold minimises expected business cost: cost = FP_count × cost_FP + FN_count × cost_FN. Plot the PR curve, identify the threshold achieving the required precision or recall, and validate on a held-out set.`,
      `**Precision@K is the right metric when you act on a fixed budget: among the top-K highest-confidence positive predictions, what fraction are true positives?** If your fraud team reviews K=50 alerts per day, Precision@50 directly measures how many reviews produce actual fraud cases. AUC-ROC measures the model across all thresholds; Precision@K measures the model at the specific operating point you actually use. They often diverge dramatically for very imbalanced problems.`,
      `**PR-AUC is more informative than ROC-AUC for severely imbalanced data.** ROC-AUC inflates because the true negative rate (specificity) is easy to maintain when negatives dominate — even a bad classifier gets credit for correctly classifying the 99% majority. PR-AUC focuses on precision and recall — both of which are sensitive to the minority class performance. On a 0.1% positive rate, ROC-AUC of 0.99 can coexist with Precision@1000 of 5% — the ROC number hides the practical failure.`,
      `**SMOTE with tree-based models frequently hurts performance.** Trees use class weights directly in their impurity calculations — the split criterion already down-weights majority class errors. SMOTE adds synthetic minority samples in regions the tree would have already learned to split correctly, introducing noise without adding signal. Class weights are the correct intervention for trees; SMOTE is primarily useful for distance-based models (KNN, SVM) and neural networks where the data distribution directly shapes the learned representation.`,
    ],
    checkQuestions: [
      {
        q: `You build a fraud detector with 0.1% fraud rate. Your model achieves 99.5% AUC-ROC but the ops team says too many false positives. What do you change?`,
        options: [
          `\`A) Retrain the model with SMOTE: the high false-positive rate is caused by class imbalance — the model defaults to predicting majority class (non-fraud) too often, generating false positives when it guesses fraud. SMOTE will balance the training set and reduce false positives.\``,
          `\`B) Report AUC-PR instead of AUC-ROC to the ops team — AUC-ROC is the wrong metric for imbalanced fraud detection and will always appear misleadingly high. Once ops sees the true AUC-PR, they will understand the model is performing at a lower level than reported and set realistic expectations.\``,
          `\`C) Retrain with a higher regularisation penalty (reduce C in logistic regression) — the model's false positives are caused by overfitting, where the decision boundary is too sensitive to training examples near the boundary. Stronger regularisation will smooth the boundary and reduce false positive rate.\``,
          `\`D) High AUC-ROC but too many false positives = threshold is too low for the cost structure. The model's ranking is good (AUC 0.99+) but the default threshold of 0.5 is not calibrated to the 1000:1 cost ratio. Actions: (1) Compute PR curve — find threshold achieving the precision the ops team needs (e.g., 50% precision means 1 in 2 alerts is real fraud). (2) Frame as Precision@K — if ops reviews K=100 alerts/day, tune threshold to maximise precision of top-100 predictions. (3) Check PR-AUC — if it is also high, your model is genuinely good and you just need threshold calibration. If PR-AUC is low, the model needs improvement in the high-precision region.\``,
        ],
        answer: `D`,
      },
      {
        q: `Your dataset has 1000 positive and 100,000 negative samples. You apply SMOTE to balance it to 50,000:100,000 and train a logistic regression. The test PR-AUC is lower than with class weights. Why?`,
        options: [
          `\`A) SMOTE generated 49,000 synthetic minority samples — far more than the original 1,000. With 49× more synthetic than real minority examples, the model fits synthetic patterns rather than real ones, causing performance degradation. Use moderate SMOTE ratios (e.g., 5,000:100,000) to avoid drowning out real minority patterns.\``,
          `\`B) SMOTE with logistic regression often hurts for several reasons: (1) SMOTE generates synthetic minority samples by interpolating between existing minority samples in feature space. For logistic regression (a linear model), the minority region may not be linearly separable from the majority — synthetic points in this region reinforce an incorrect linear boundary. (2) Class weights achieve the same reweighting effect as SMOTE for logistic regression but without adding noise. (3) SMOTE's interpolation can place synthetic points in the majority region, creating noisy examples that confuse the model. Class weights are the correct intervention for logistic regression on imbalanced data.\``,
          `\`C) The PR-AUC degradation is caused by the evaluation metric, not the training method. SMOTE changes the data distribution so that the test set (which preserves the original 1000:100,000 ratio) no longer matches the training distribution. PR-AUC should be computed on a SMOTE-balanced test set to get a fair comparison.\``,
          `\`D) SMOTE interpolates between minority examples, which are themselves rare and noisy. The synthetic examples inherit the noise from their nearest neighbours, amplifying label noise 50× during training. Class weights avoid this by not creating new examples — they work directly on the real minority examples.\``,
        ],
        answer: `B`,
      },
      {
        q: `You have a binary classifier for cancer screening. False negatives (missing cancer) are 10× more costly than false positives (unnecessary follow-up). How do you incorporate this into training and evaluation?`,
        options: [
          `\`A) Training: set class_weight = {0: 1, 1: 10} — the loss for misclassifying a positive (cancer) sample is 10× the loss for misclassifying a negative. This shifts the decision boundary toward higher recall. Threshold: at deployment, tune the threshold on a calibration set to achieve the cost-optimal tradeoff: expected cost = FP_rate × 1 + FN_rate × 10. Find threshold minimising this. Evaluation: use F_β with β=√10 ≈ 3.16 (F_β weighs recall β times more than precision); also report Precision, Recall, and the cost metric directly. Never report only accuracy — it hides the critical false-negative rate.\``,
          `\`B) Lower the classification threshold from 0.5 to 0.1 — this is the only change needed. A lower threshold increases recall without any training changes. Evaluation: report sensitivity (recall) as the primary metric; specificity is secondary since false positives are acceptable. No changes to the loss function or class weights are required.\``,
          `\`C) Incorporate cost asymmetry only at evaluation time: train with balanced classes and default threshold (0.5) to get the most accurate model, then compute expected cost = FP × 1 + FN × 10 on the test set. Report this cost metric to stakeholders. Changing the training objective introduces bias that reduces overall model accuracy.\``,
          `\`D) Use SMOTE to oversample the cancer-positive class by 10× before training — this is equivalent to class_weight={0:1, 1:10} and is more principled because it explicitly creates the data distribution that matches the cost structure. Evaluation: use AUC-ROC, which is threshold-independent and correctly captures the 10× cost asymmetry.\``,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Class imbalance is a cost asymmetry problem masquerading as a data problem. The real issue is that standard training treats false positives and false negatives as equally bad, and they never are in high-stakes applications. Class weights fix the training in seconds. The threshold at deployment fixes the operating point. What you cannot skip is measuring with the right metric — accuracy on an imbalanced problem is not a metric, it is a way to miss the whole problem.`,
    interactiveId: 'class_imbalance_viz',
  },
  {
    id: 'feature_selection',
    title: 'Feature Selection & Dimensionality',
    subtitle: 'Filter/wrapper/embedded, mutual information, RFE, SHAP',
    difficulty: 'intermediate',
    estimatedMin: 28,
    tags: ['feature selection', 'mutual information', 'SHAP', 'RFE'],
    summary: `Adding more features seems like it should always help — more information about the target means better predictions.

In practice, irrelevant and redundant features add noise, inflate the effective dimensionality the model must search, increase training time, and make the model harder to interpret. The question is not "should I include this feature" but "does this feature reduce test error, or does it only reduce training error?" Selecting features based on test set performance is not an answer — it inflates apparent accuracy because the selected features were chosen to match the test labels. Feature selection must happen inside cross-validation. Among selection methods, filter methods evaluate features independently and miss interactions; wrapper methods search subsets using the model directly and are too slow for large feature sets; embedded methods like L1 regularisation and SHAP importance do selection as part of training and account for interactions.

In practice, the most reliable pipeline is: train one gradient boosted model on all features, rank by SHAP importance, select the top-k — one training run, interactions accounted for, selection bias avoided.`,
    keyPoints: [
      `**Filter methods score each feature independently of the model and of other features.** Mutual information I(X;y) captures non-linear dependencies and is the most general criterion. ANOVA F-test handles linear continuous-target relationships. Chi-squared handles categorical features and targets. Filter methods are fast — O(nd) — but they miss multivariate interactions: two features that are each individually uncorrelated with the target can jointly be perfectly predictive, and filter methods will eliminate both.`,
      `**Variance thresholding removes features with near-zero variance — they carry no information regardless of any model.** A constant feature (var=0) contributes nothing to any split criterion or gradient. This is the cheapest possible first pass and should always run before any other selection method. In real datasets, near-constant features often appear from dummy variables for rare categories, features that were computed but never triggered, or data pipeline errors.`,
      `**Mutual information estimation from finite samples is noisy — binning-based estimators introduce bias that depends on bin width.** Sklearn's mutual_info_classif uses a k-nearest-neighbour estimator that avoids this bias and gives more accurate MI estimates with fewer samples. The tradeoff is that MI captures each feature's individual relationship with the target — two features with high MI might be redundant (they carry the same information), and MI does not reveal this.`,
      `**RFE (Recursive Feature Elimination) trains the model, removes the lowest-importance feature, and repeats.** It captures interactions because the model sees all remaining features at each step — the importance of feature A changes when feature B is removed if they were correlated. The cost is O(d) model fits, making it practical for small feature sets (d < 100) and prohibitive for large ones (d = 10,000 would require 10,000 training runs).`,
      `**Embedded methods do selection as part of training.** L1 regularisation drives irrelevant feature weights to exactly zero during gradient descent — the same optimiser that was causing overfitting now simultaneously selects features. Tree Gini importance and SHAP values rank features post-hoc from a trained model that already saw all features together, so interactions are reflected in the scores. Embedded methods are both faster than wrapper methods and more accurate than filter methods for correlated feature spaces.`,
      `**Feature selection bias is a common source of inflated published results: compute feature importance on the full dataset (including test examples), select the top-k features, then evaluate on the test set.** The test set labels were used to select features, making the selected features appear more predictive than they really are. Correct procedure: feature selection must be nested inside cross-validation — compute importance on training folds only, evaluate on the held-out fold. This adds complexity but is the only way to get an unbiased estimate.`,
      `**SHAP-based selection trains one gradient boosted model on all features and computes mean |SHAP value| per feature.** SHAP values decompose each prediction into per-feature contributions that correctly account for feature interactions — unlike Gini importance, which treats each split independently. A feature with high SHAP importance genuinely moves predictions, not just impurity. Train once, get reliable interaction-aware importance, select top-k: this is the most reliable selection pipeline for tabular data.`,
      `**Correlated features inflate apparent feature count without adding independent information.** If two features have |corr| > 0.95, they are nearly redundant — a model that uses both is not learning twice as much signal, it is learning the same signal with noise. Keep the one with higher mutual information with the target and remove the other. This also stabilises model fitting: correlated features compete for coefficient estimates in linear models and split credit in tree models, causing importance estimates to be unreliable for either feature individually.`,
    ],
    checkQuestions: [
      {
        q: `You have 500 features and want to reduce to ~50 before tuning a Random Forest. What is your step-by-step approach?`,
        options: [
          `\`A) Run 5-fold cross-validation with the full 500 features, compute each feature's average coefficient magnitude across folds, and keep the top-50. This is the most reliable approach because it uses the model's own learning signal to identify important features while accounting for cross-validation noise.\``,
          `\`B) Apply mutual information filtering: compute MI between each feature and the target, rank all 500 features, keep the top-50 with highest MI. This is both fast (O(nd)) and directly targets features with high predictive value. No preliminary steps are needed since MI handles correlated and irrelevant features automatically.\``,
          `\`C) Step 1: remove constant and near-zero variance features (VarianceThreshold in sklearn — fast, no label needed). Step 2: remove highly correlated pairs (|corr|>0.95) — keep the one with higher MI with target. Step 3: train an initial Random Forest with all remaining features, compute permutation importance (or SHAP) on a validation fold. Select top-50 by importance. Step 4: verify that the 50-feature model achieves similar OOB or CV performance to the full-feature model (within 0.5%). Step 5: if performance drops, iterate with top-75 or top-100. Avoid pure filter methods (they miss interactions); embedded methods (permutation importance, SHAP) are preferred for RF because they account for feature interactions.\``,
          `\`D) Use RFE (Recursive Feature Elimination) with the Random Forest as the estimator: train on all 500 features, remove the 50 features with lowest Gini importance, retrain, repeat until 50 remain. RFE accounts for interactions at each step and is the most principled selection method for tree-based models.\``,
        ],
        answer: `C`,
      },
      {
        q: `A colleague selects the top-20 features using mutual information with the target label, then performs 5-fold CV to evaluate the model. What is wrong with this procedure?`,
        options: [
          `\`A) Feature selection bias: mutual information was computed on the full dataset (including what becomes the test fold). The selected features were chosen because they happen to correlate with the label in all 5 folds — including the test fold. This inflates apparent performance because the features were selected using test-set label information. Correct procedure: feature selection must be nested inside the CV loop. For each fold: (1) train MI on the k-1 training folds only; (2) select top-20 features using that MI; (3) train model on training folds with those 20 features; (4) evaluate on the held-out test fold. This gives an unbiased estimate of both the selection procedure and the model.\``,
          `\`B) Mutual information is a filter method that ignores feature interactions — selecting top-20 by individual MI will miss features that are only predictive in combination. The correct approach is to run 5-fold CV first and use Gini importance from the full-feature model to select features, because Gini captures interactions.\``,
          `\`C) The procedure is correct — mutual information computed on the full dataset is an estimate of the population-level MI, not specific to any fold. Using it as a preprocessing step before CV is equivalent to standardising features before CV, which is standard practice.\``,
          `\`D) 5-fold CV is insufficient for evaluating a model that uses only 20 features — with 20 features, each fold's test set sees at most 20/d of the feature variance. Use leave-one-out CV (LOOCV) to get an unbiased estimate of generalisation for small feature counts.\``,
        ],
        answer: `A`,
      },
      {
        q: `You select 20 features with Gini importance from a Random Forest and find that removing any single selected feature barely changes test performance. What does this suggest?`,
        options: [
          `\`A) The 20 features are all equally important and the model is well-distributed: no single feature dominates, which is a sign of a robust and generalising model. Removing any one feature only costs 1/20 of the total information, so the impact per feature is correctly small. No action needed.\``,
          `\`B) The model has memorised the training data — when a model truly overfits, removing any feature has no effect on test performance because test performance is already at chance. Retrain with stronger regularisation (deeper min_samples_leaf) and re-evaluate feature importance.\``,
          `\`C) The 20 features all have near-zero Gini importance that was mistakenly ranked as high due to a bug in the importance calculation. Verify that oob_score=True is set and that importances were computed on the OOB set, not the training set — training-set Gini importance is always artificially inflated.\``,
          `\`D) Two likely explanations: (1) Many of the 20 features are correlated — the information they collectively provide is redundant, and any individual feature can be replaced by a correlated substitute. Gini importance distributes credit among correlated features, making each look moderately important. True importance only appears when all correlated partners are removed simultaneously. (2) The model is robust to feature removal and individual features contribute marginally. Fix: (1) Use permutation importance or SHAP instead of Gini. (2) Try sequential ablation: remove subsets of correlated features together and measure the group's collective importance. (3) Check feature correlations among the 20 selected features — groups with |corr|>0.8 are likely providing redundant information.\``,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Feature selection on the full dataset before splitting is data leakage — the selected features were chosen partly because they happened to correlate with the test labels, and the apparent performance gain is artefactual. Selection must be nested inside cross-validation. In practice: train one gradient boosting model, rank by SHAP, take the top-k. One run, no leakage, interactions accounted for. That is the reliable pipeline.`,
  },
]
