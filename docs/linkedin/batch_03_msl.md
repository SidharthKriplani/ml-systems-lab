# LinkedIn Batch 03 — MSL gap-fillers (5D coverage)

Drafted 2026-06-22 (Build Session B). **Content-first: these are copy + diagram plans for approval. Nothing rendered yet** (per DECISIONS "render once" + visual-as-hook rule). Each clears `CONTENT-DEPTH-STANDARD.md` and the no-dead-frame visual rule, and SHOWS its dimension per `docs/CONTENT-FRAMEWORK.md`.

**Why these three:** the audit (`docs/CONTENT-AUDIT-5D.md`) found #3 over-indexed (7 posts) and the real holes at **#2 (math shown — absent), #4 (tool-fit shown — 1, asserted), #5 (decision SHOWN — 0, only posed), #1 (why-it-works — 1).** These three posts fill #2+#4, #5, and #1 respectively. No new #3 added (already over-indexed).

Voice = Avinash's, honest learner-to-peer. Length target 1,300–1,800 chars. Fixed sign-off on every post. 5 hashtags. No body links.

---

## Post 1 — fills Dimension 2 (math) + Dimension 4 (tool-fit) — UPGRADE of batch_01 Post 2 "AUC Is Not Your Friend"

**Dim:** 4 primary, 2 secondary. **Replaces the asserted version with a shown one.**
**Engine:** Problem-of-the-day / explainer. **Track accent:** ML gold.

### Visual (HOOK — pose, don't summarise)
Carbon/INSTRUMENT card, void background. One line of code + a provocation, no answer:
```
fraud_rate = 0.001          # 0.1% of traffic
reviewers_per_day = 100
auc = 0.95                  # looks elite
# ship on AUC?  ❌
```
Gold annotation arrow from `auc = 0.95` to a mono callout: **"0.95 over the 99.9% you'll never touch."** The question is the hook; the arithmetic is the caption. Fills the frame: code block centre, annotation lower-right, fault-glyph seam.

### Caption
AUC 0.95 and you still can't tell if the model is shippable. Here's the number that decides it 👇

━━━━━━━━━━━━━━━━━━━━━━━
AUC measures rank-ordering across *all* cases — pick a random fraud and a random legit transaction, it's the chance the model scores the fraud higher. Sounds great. But fraud runs at ~0.1%, and your reviewers can only check the top 100 flags a day. You never act on the middle of the ranking. So the metric has to match the *action*, not the paper.

Work it. At 0.1% prevalence, 100 flags a day, a 0.95-AUC model might land **precision@100 ≈ 35%** — 35 real catches, 65 wasted reviews. Is that shippable? Depends on the cost ratio: if a missed fraud costs ~50× a wasted review, then a review is "worth it" as long as the next flag's hit-rate beats 1-in-50 (2%). At precision@100 = 35%, you're miles above that line — ship, and *push the cutoff deeper* until marginal precision falls toward 2%.

That's the senior move AUC can't give you: AUC averaged over the 99.9% of transactions you'll never review. Precision@K speaks the language of a reviewer budget. Recall@precision is its screening twin — fix precision where the budget tolerates it, then ask what fraction of fraud you actually catch.

💡 The tell in an interview is *which metric a candidate reaches for first*. "AUC 0.95" is a report. "Precision@100, because reviewers check 100 and a miss is 50× a review" is a decision.
━━━━━━━━━━━━━━━━━━━━━━━

Pick the metric that matches the action, then show the arithmetic that the action implies.

What's the action-budget on the last model you shipped — and did your metric respect it? 👇

One concept at a time, repeated until it's reflex. Consistency is the only edge that compounds. Be consistent with me.

#MachineLearning #MLE #DataScience #FraudDetection #InterviewPrep

> **Honesty/accuracy note:** precision@100 ≈ 35% is an *illustrative* figure (depends on the score distribution) — labelled illustrative per L-13; the 2% break-even is exact arithmetic from the 50× ratio. No overclaim.

---

## Post 2 — fills Dimension 5 (decision across the pipeline, SHOWN) — DEBRIEF companion to batch_02 Post 1

**Dim:** 5 primary, 3 secondary. **The missing "shown" half of the Judgment Challenge.** Ship 3–4 days after the B2-1 challenge runs, tagging the sharp commenters (per batch_02 debrief plan).
**Engine:** Junior→Senior / debrief. **Track accent:** ML gold.

### Visual (HOOK)
INSTRUMENT card. A three-node vertical chain, each node a hypothesis, with a gold "cost-to-check" tag and the nodes *numbered but unordered-looking* — provoking "is this the right order?":
```
AUC 0.89 → 0.92 shipped.  Revenue −8%/wk.
 ┌─ skew?         check: 20 min, no rollback
 ┌─ label drift?  check: backtest on labelled window
 └─ calibration?  check: reliability curve
which FIRST? →
```
Gold arrow to callout: **"the order is the answer."** Red fault-glyph only at "Revenue −8%". Frame filled top-to-bottom by the chain.

### Caption
Offline AUC went 0.89 → 0.92. You shipped. Production is losing 8% revenue a week. Three hypotheses — but the *order* you check them in is the whole answer 👇

━━━━━━━━━━━━━━━━━━━━━━━
Naming the three suspects is junior. Sequencing them by cost-to-check is the staff move. Here's the order and why.

**1. Training-serving skew — first, because it's cheapest and most common.** Diff the *served* feature distribution against training for one hour of live traffic. ~20 minutes, no rollback. If "days_since_order" is computed off `now()` in serving but `order_completed_at` in training, the mean is visibly off and you're done. Most "AUC up, revenue down" stories end here.

**2. Label / concept drift — second.** Backtest the *new* model on a fresh **labelled** window. If precision and calibration hold, the input→label relationship is intact — the model is fine, keep looking. If they dropped, the world moved and the offline lift was measured against a stale reality.

**3. Calibration — third.** AUC is rank-order; it can rise while the *scores* drift. If a downstream bidder or loan-limit calc multiplies the score, a better-ranked-but-miscalibrated model loses money. Check a reliability curve only after 1 and 2 clear.

Why this order and not any order: each check is more expensive than the last, and you **stop at the first hit**. Check calibration first and you might spend a day on a reliability curve when a 20-minute feature diff would've caught it.
━━━━━━━━━━━━━━━━━━━━━━━

The list isn't the answer. The order is — because the order is what it costs to be wrong about the order.

What's your check-order, and what's the cheapest check you start with? 👇

One concept at a time, repeated until it's reflex. Consistency is the only edge that compounds. Be consistent with me.

#MachineLearning #MLOps #MLE #DataScience #InterviewPrep

---

## Post 3 — fills Dimension 1 (why a model works, SHOWN)

**Dim:** 1 primary. **The positive-intuition post the set lacks.** Topic: why gradient boosting actually drives error down — residual-fitting, shown with one tiny worked step.
**Engine:** "How I'd explain it" explainer. **Track accent:** ML gold.

### Visual (HOOK)
INSTRUMENT card. A residual shrinking across 2 stumps — pose "why does adding weak models help?":
```
target      = 10
f0 (mean)   = 7      → residual = +3
+ tree₁ fits the 3   → predicts +2.4  → residual = +0.6
+ tree₂ fits the 0.6 → predicts +0.5  → residual = +0.1
why does this converge? →
```
Gold arrow to callout: **"each tree learns what's left, not the target."** Green "+0.1" at the end = the resolution colour. Frame filled by the descent.

### Caption
A single decision tree at depth 2 is a weak model. Chain 200 of them and you get XGBoost — the thing that wins half of Kaggle and runs real fraud and credit systems. Why does stacking weak models work? 👇

━━━━━━━━━━━━━━━━━━━━━━━
The trick: each tree doesn't predict the target. It predicts the **residual** — what the model so far got *wrong*.

Walk one example. Target = 10. Start with the mean, f₀ = 7. Residual = 10 − 7 = **+3**. Now fit tree₁ not to "10" but to that +3; say it predicts +2.4. New prediction 9.4, residual = **+0.6**. Fit tree₂ to the 0.6; it predicts +0.5. Now 9.9, residual **+0.1**. Each tree chips at the *remaining* error, so the ensemble walks downhill toward the target.

That's gradient *boosting* literally: the residual is the negative gradient of squared-error loss, so "fit the residual" = "take a step in the steepest-downhill direction in function space." A learning rate (XGBoost's `eta`, ~0.1) shrinks each step so no single tree overshoots — many small correct steps beat a few greedy ones (same reason small-LR SGD generalises).

💡 Why *weak* learners specifically: a deep tree would fit the residual perfectly in one shot and memorise the noise. Shallow stumps can only capture a *little* structure each, so boosting adds signal slowly and stops before it fits noise — bias falls, variance stays controlled. Strength is built from many disciplined weak steps, not one strong guess.
━━━━━━━━━━━━━━━━━━━━━━━

Boosting works because each model learns what's *left over*, not the answer — error you can still see is just the next model's training target.

How would you explain to a junior why boosting uses weak trees, not strong ones? 👇

One concept at a time, repeated until it's reflex. Consistency is the only edge that compounds. Be consistent with me.

#MachineLearning #DataScience #MLE #XGBoost #InterviewPrep

> **Honesty/accuracy note:** the +3 / +2.4 / +0.6 values are *illustrative* (hand-set to show the descent), labelled per L-13. The residual = negative gradient of squared-error claim is exact and verified. `eta ≈ 0.1` is a typical default, not a universal.

---

## Coverage after Batch 03 (projected)

| Dim | Before | After B03 | 
|---|:---:|:---:|
| 1 — why it works | 1 | **2** |
| 2 — math underneath | 0 shown | **1 shown** (Post 1) |
| 3 — why it's wrong | 7 | 7 (unchanged — deliberate) |
| 4 — tool-fit | 1 asserted | **1 shown** (Post 1 upgrade) |
| 5 — decision SHOWN | 0 (3 posed) | **1 shown** (Post 2) + 3 posed |

Still light on #1 and #2 long-term — but the worst holes (a math-shown post; a tool-fit-shown post; a decision-shown post) are now plugged. Next pass should keep adding #1/#2/#4 and freeze #3 until the portfolio balances.

## Render plan (AFTER approval only)
- Reuse `growth/linkedin/visuals/build_*.py` + `_brand/TOKENS.md` (INSTRUMENT register, void/gold, mono).
- Each card passes the 4 QA gates (400px legible, greyscale, token-compliant, correct mode).
- Batch finals into `growth/linkedin/visuals/weeks/W{n}_{daterange}/` once dates are assigned (see tracker — dates not assumed here).
