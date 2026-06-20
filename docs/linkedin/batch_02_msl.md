# LinkedIn Batch 02 — MSL

Drafted 2026-06-19. Five polished posts ready to publish in sequence over 2 weeks. No product backlinks (cold Home + OG card not shipped yet — see `docs/MSL_EXPOSURE_PLAN.md` for the gating sequence). All authority-only, comment-driving.

Tone: first person, Avinash's voice. Never the corporate MSL "we." Specific over generic.

Suggested cadence: 1 Judgment Challenge → 2 days later 1 India Insider → 2 days later 1 Judgment Challenge → and so on. Comment on every comment within 12 hours for the first 72 hours per post — algorithm rewards founder engagement.

---

## Post 1 — Judgment Challenge

Your offline AUC just went from 0.89 to 0.92.

You ship it.

The same model in production loses 8% of revenue per week.

Engineering wants to roll back. Product wants to wait. Leadership wants an answer.

Three diagnostic hypotheses, in order of what you'd check first.

What's your move?

(Senior MLEs — I'm specifically asking for the ORDER of your hypotheses. The order is the answer. The list isn't.)

#MachineLearning #MLEngineering #DataScience

---

## Post 2 — India Insider

Razorpay's senior MLE loop has changed shape in the last 18 months.

Two years ago, Round 2 was "explain bias-variance" or "how does XGBoost work." Reciting the formulas got you through.

Today, the same round is "your model's calibration drifted overnight. Walk me through what you'd check, and in what order."

Same role. Different judgment being tested.

The shift isn't unique to Razorpay. PhonePe, Flipkart, Swiggy, Meesho — every Indian unicorn's senior ML loop has quietly tilted from "do you know ML" to "have you debugged production ML." The candidates failing rounds aren't the ones who don't know the math. They're the ones who've only learned the math.

If you've prepared by grinding LeetCode and going deep on derivations, you have half of what these interviews now test. The other half — the half that distinguishes seniors who can ship from juniors who can derive — is rarely taught and almost never on YouTube.

I'm curious — anyone interviewed at one of these in the last 6 months: what was your Round 2 actually about? And was it what you expected from the JD?

#MachineLearning #InterviewPreparation #IndianTech

---

## Post 3 — Judgment Challenge

Your fraud detection model says: this transaction has a 94% probability of fraud.

The human reviewer agrees with the model. They block.

The customer was a real customer. The block flags their account. Their salary deposit bounces. They lose their job.

You read about it in a customer complaint forwarded by the CEO.

What do you fix?

A. The model — clearly it's not accurate enough.
B. The threshold — 94% should not have been a block decision.
C. The calibration — maybe 0.94 doesn't actually mean 94%.
D. The process — the human in the loop should have had context the model didn't have.

There's a right answer here and most candidates pick the wrong one.

Which would you fix first, and why?

#FraudDetection #MachineLearning #MLE

---

## Post 4 — India Insider

I've watched a pattern across ~40 Indian senior MLE interview loops in the last year.

The candidates who passed had production stories. The candidates who failed had project stories.

The distinction:

A **project story** is "I built a churn model. Used XGBoost. Got 0.87 AUC. Validated with 5-fold CV. Deployed via Flask API."

A **production story** is "I built a churn model. Two weeks after launch, AUC was holding at 0.87 but business metrics dropped. Traced it to feature freshness — our daily batch was actually 36 hours behind for 8% of users due to a Kafka backlog. Fixed the SLA, monitoring caught the next drift event in 4 hours instead of 4 weeks."

The interviewer doesn't care about your project. They care about your judgment under production constraint.

If your most recent ML project is a Kaggle notebook or a course capstone, you don't have a production story yet. That's fine — but it changes how you should prepare. You can't fake production judgment, but you can borrow it from people who have it.

The senior candidates I see passing Indian unicorn loops have either (a) shipped at least one ML system into production with monitoring, or (b) deeply studied other people's failure cases until they internalised the pattern recognition.

Most prep platforms train (a). Few train (b).

Which one are you doing?

#MachineLearning #MLE #CareerGrowth

---

## Post 5 — Judgment Challenge

A junior teammate just submitted a PR.

They fit a StandardScaler on the full dataset. Then they split into train and test. Then they train an XGBoost. Test AUC is 0.94.

You ask them to refit the scaler inside the cross-validation fold instead. They push the change. Test AUC drops to 0.81.

The release is on Friday. The 0.94 version is still in the branch.

Do you ship 0.94, ship 0.81, or hold the release?

(Bonus question — what do you tell the junior, after?)

#MachineLearning #MLE #DataLeakage

---

## Notes on linking

None of these 5 posts include a product backlink. Reasoning per `MSL_EXPOSURE_PLAN.md`: the cold Home + onboarding quiz haven't shipped yet, so a 500-visitor LinkedIn spike would bounce on the current overwhelming Home. Authority-only posts now; link posts go live once the launch-readiness sequence ships.

When the OG card + cold Home + onboarding quiz are in place, the second batch can include backlinks to:
- Post 76 (Calibration) from a debrief of #3 above
- Post 130 (Leakage Taxonomy) from a debrief of #5
- Post 1 (Training-Serving Skew) from a debrief of #1

The Expert Debrief follow-ups are pre-loaded as link opportunities — write them in advance, ship after launch-readiness completes.

---

## Engagement metrics to watch

For each post, track at 72 hours:
- Impressions (algorithm signal — anything below 1,000 means the post under-performed)
- Comments (the actual currency — target 15+ for Judgment Challenges, 8+ for India Insider)
- Saves (proxy for "I'll come back to this")
- Profile views (the actual conversion to MSL-aware audience)
- DMs (the highest-quality signal)

A Judgment Challenge that gets 25+ comments is a hit; tag the thoughtful commenters in the Expert Debrief follow-up 3-4 days later.
