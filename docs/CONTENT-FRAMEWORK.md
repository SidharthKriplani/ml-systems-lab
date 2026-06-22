# MSL CONTENT FRAMEWORK — the 5 Dimensions

_Created 2026-06-22 (Build Session B). This is MSL's documented post-writing framework. It **nests under** `growth/linkedin/docs/CONTENT-DEPTH-STANDARD.md` — the depth standard says *how deep* every post goes; this says *which kind of judgment* each post trains. The audit that produced it: `docs/CONTENT-AUDIT-5D.md`._

> **The rule of this doc:** every dimension below is **SHOWN with a worked example, never asserted.** If you can't show it with a number, a formula, or a mechanism, it isn't ready. That is the whole MSL bar — "being right isn't the job; showing it is."

---

## Why MSL needs a content framework (not just a depth standard)

The depth standard fixed *shallowness* — it forces every post to show the math, fill the frame, tie to the business. But it's dimension-blind: a body of work can clear the depth bar on every post and still be lopsided. MSL's audit proved it — 64% of posts were failure-mode posts (#3), with the math-shown dimension (#2) absent entirely. The depth standard couldn't catch that, because each individual post passed. This framework is the **portfolio-level** lens the depth standard lacks: it asks "across all MSL content, are we training all five kinds of production-ML judgment, or just one?"

Production ML judgment is not one skill. It is five. An engineer who can only spot bugs (#3) but can't show the math (#2), choose the tool (#4), explain why a method works (#1), or sequence a decision (#5) is not senior. The content has to train all five — so the content has to track all five.

---

## The five dimensions, each SHOWN

For each: the definition, the **tell** that a post is really in this dimension, and a **worked example** (the proof — short, with real numbers/mechanism, exactly as a caption would carry it). The examples are illustrative teaching numbers, labelled as such per L-13.

### Dimension 1 — WHY A MODEL WORKS

**Definition.** The mechanism or intuition that makes a method *correct* — not how to use it, why it's right. The positive case.

**The tell.** The reader finishes able to say "*oh, that's WHY it does that*" about a method that works — not a bug, a choice.

**Shown (worked example — L1 sparsity):**
> Both L1 and L2 shrink weights. Only L1 zeroes them. Why? Geometry, shown. Minimise loss subject to a budget on the weights. L2's budget `w₁² + w₂² ≤ t` is a **circle** — smooth, no corners. The loss contours (ellipses) touch it at a generic point: both weights small, neither exactly 0. L1's budget `|w₁| + |w₂| ≤ t` is a **diamond** with corners *on the axes*. An ellipse growing outward almost always hits a **corner first** — and a corner *is* a coordinate axis, i.e. `w₂ = 0`. Take a 2-D case, loss minimised at `(0.4, 0.05)`: the L1 diamond's nearest contact is the corner `(0.42, 0)` — the small weight collapses to exactly zero. That's feature selection, falling straight out of the shape of the constraint. Not a memorised line — the corner is the reason.

**Anti-pattern (asserted, banned):** "L1 does feature selection because it uses absolute values." Names the cause, shows nothing.

---

### Dimension 2 — THE STATS/MATH UNDERNEATH

**Definition.** The actual formula, test, or derivation — worked through with numbers to a verdict. The dimension MSL was missing entirely.

**The tell.** There is a computation on the slide: H0, a statistic, a threshold, a number, a verdict. Never a check *named* without being *run*.

**Shown (worked example — peeking false-positive rate):**
> "Checking early inflates your false-positive rate" — by how much? Show it. One look at α = 0.05 → 5% false-positive rate. The looks aren't independent (the data accumulates), so it's not `1 − 0.95ⁿ` — but simulate 14 daily looks with a fixed effect of zero and the probability you cross p < 0.05 *at least once* lands around **20–25%** (the exact figure depends on the look correlation — state the range, don't fake a point estimate, per the depth standard). So "12% lift, p = 0.03 on day 8 of 14" isn't a 1-in-20 fluke — it's a 1-in-4 one. The math is the argument; "that's peeking" is not.

**Anti-pattern (asserted, banned):** "Peeking inflates your error rate, so don't do it." True, unshown, worthless. This was MSL's most common silent failure.

---

### Dimension 3 — WHY IT'S WRONG

**Definition.** The failure mode, bug, or trap — what silently breaks and the mechanism behind it. MSL's strongest, most over-used dimension. **Keep the quality, stop adding volume** until the others catch up.

**The tell.** "Looks fine, silently wrong." A clean, confident, incorrect number.

**Shown (worked example — float32 on money):**
> Your fraud filter passes a $10,000,000.01 transaction as if it were $9,999,999.99. No error. A `float32` holds ~7 significant digits. Up near $10M, all 7 are spent on the dollars — the gap between two representable values grows to ≈ $1. So `9_999_999.99` and `10_000_000.01` round to the **same stored value**. Run `df[df.amount > 10_000_000]` and a boundary transaction lands on the wrong side, silently. Fix: `float64`, or store integer cents in `int64` (exact to ≈ $92T). "Use float32, it saves memory" is reflexive advice nobody connects to a compliance-breaking miss.

**Anti-pattern:** a bug post with no mechanism — "always use float64 for money" with no digit-counting. Shows the fix, hides the why.

---

### Dimension 4 — TOOL-FIT & WHY

**Definition.** Choosing the right metric/library/algorithm/infra **for the action**, and justifying the choice against alternatives with numbers. Thin in MSL — 1 post, and it asserted.

**The tell.** A *choice* is made and *defended by the cost function of the action*, with the rejected option's number shown too.

**Shown (worked example — metric choice for a fraud queue):**
> AUC 0.95 doesn't tell you which metric to ship on — the *action* does. Fraud base rate ≈ 0.1%. Reviewers can check **100 cases/day**; a missed fraud costs ≈ 50× a wasted review. So optimise **precision@100**: of the top 100 the model flags, how many are real? At 0.1% prevalence and AUC 0.95, precision@100 might be ~35% — i.e. 35 catches, 65 wasted reviews/day; tune the cutoff until the 50× cost ratio says the marginal review still pays. Recall@precision is the screening twin: fix precision at the level the reviewer budget tolerates, then ask what fraction of fraud you catch. AUC averaged over the 99.9% of cases you never action — which is why it's what you report, not what you ship on. The choice is shown, not named.

**Anti-pattern (this was the AUC post's flaw):** listing precision@K, recall@precision, calibration as options without computing any of them against a stated budget.

---

### Dimension 5 — DECISION-MAKING ACROSS THE PIPELINE

**Definition.** Judgment under production constraint — ordering hypotheses, deciding *where* to fix, ship/hold, handling the stakeholder/room. The senior move, end to end. In MSL today this is **posed** (great Judgment Challenge questions) but never **shown** (no worked resolution).

**The tell.** A sequence of decisions, each justified, each tied to the business cost of getting the order wrong.

**Shown (worked example — AUC up, revenue down, in what order):**
> Offline AUC 0.89 → 0.92, you ship, production loses 8% revenue/week. Order matters because each check has a cost. **(1) Training-serving skew first** — cheapest, most common: diff the served feature distribution against training for one hour of traffic (20 min, no rollback). If a feature's mean is off, you're done. **(2) Label/concept drift second** — backtest the new model on a fresh *labelled* window: if precision holds, the relationship is intact and you keep looking. **(3) Calibration third** — if rank-order (AUC) rose but the *scores* are miscalibrated and a downstream bidder multiplies them, a better AUC can still lose money; check a reliability curve. The order is the answer: skew before drift before calibration, because checking them in cost order means you stop at the first hit instead of paying for all three. Naming the three hypotheses is junior; sequencing them by cost-to-check is the staff signal.

**Anti-pattern:** stopping at the question ("what's your move?"). The challenge *poses* #5; the debrief is what *shows* it. Both have a place — but the body of work needs the shown half.

---

## How to use this framework

1. **Tag every new post to its primary dimension** before writing (add a `Dim:` line in the draft). One primary; note secondaries.
2. **Balance the portfolio, not the post.** Before shipping a week, check the running tally in `CONTENT-AUDIT-5D.md`. If you're about to add a 8th #3 post while #2 sits at zero, swap it. Over-indexing one dimension is now a flagged defect, not a neutral choice.
3. **Show or it doesn't count.** A post that *poses* a dimension (a pure question) earns reach but does **not** advance coverage of that dimension. Pair reach posts (poses) with debrief posts (shows).
4. **Every dimension obeys the depth standard.** The 4-beat arc (THE MOMENT → WHERE IT BREAKS → THE MATH → THE SENIOR MOVE) and the no-dead-frame visual rule apply inside whichever dimension the post sits in.
5. **The visual is a HOOK, the dimension lives in the caption.** Per DECISIONS: the card poses/provokes; the worked example that *shows* the dimension is the caption's job.

## Relationship to the other spine docs

- `HQ/MANIFESTO.md` — *why* depth is the only moat. This framework is depth made checkable.
- `growth/linkedin/docs/CONTENT-DEPTH-STANDARD.md` — *how deep* each post goes (per-post). This framework — *which judgment* each post trains (per-portfolio). Read both; this one nests under that one.
- `HQ/CONTENT-LESSONS.md` — L-03 (pay off every abstraction) and the "show, don't name" rule are the per-dimension enforcement of this framework.
- `docs/CONTENT-AUDIT-5D.md` — the live coverage tally. Update it when content ships.
