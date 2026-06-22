# CONTENT AUDIT — MSL LinkedIn content vs. the 5-Dimension framework

_Build Session B. Created 2026-06-22. This is the audit + coverage/gap report. Resumable state lives in the "Tagging table" below — if a batch is interrupted, re-read that table and continue. Pairs with `docs/CONTENT-FRAMEWORK.md` (the 5D, documented) and nests under `growth/linkedin/docs/CONTENT-DEPTH-STANDARD.md`._

---

## The 5 dimensions (the lens)

A BreakLabs MSL post should, over the body of work, train all five kinds of judgment. Each post primarily **shows** one:

1. **WHY A MODEL WORKS** — the mechanism/intuition for why a method is correct (e.g. the L1 diamond-corner geometry).
2. **THE STATS/MATH UNDERNEATH** — the actual formula/test/derivation, worked with numbers (H0, the statistic, df, p, the verdict).
3. **WHY IT'S WRONG** — the failure mode, bug, or trap; what silently breaks.
4. **TOOL-FIT & WHY** — choosing the right metric/library/algorithm/infra for the action, and justifying the choice.
5. **DECISION-MAKING ACROSS THE PIPELINE** — judgment under production constraint: ordering hypotheses, where to fix, ship/hold, stakeholder-aware calls.

**Scoring note (matters for the gap call):** a post can *pose* a dimension (ask a question about it) without *showing* it. Per the depth standard ("show, don't name") and the visual rule ("the visual is a HOOK, the depth is in the caption"), only a post that **works the dimension through with numbers/mechanism in the caption** counts as SHOWING it. Pure question posts are tagged `poses` not `shows`.

---

## Inventory tagged (the audit subjects)

13 MSL LinkedIn pieces across three sources:
- `docs/linkedin/batch_01_msl.md` — 5 deep-link authority posts (full answer in post).
- `docs/linkedin/batch_02_msl.md` — 5 judgment/insider posts (questions + market commentary).
- `growth/linkedin/Content Master Tracker.xlsx` → Content Calendar — 3 MSL code-break captions (#4, #14, #21).

### Tagging table (STATE — resume from here)

| # | Source | Post | Primary dim | Also touches | Shows or poses | Notes |
|---|--------|------|:---:|:---:|---|---|
| B1-1 | batch_01 | Training-Serving Skew | **3** | 5 | shows | Failure mode; fix is structural (pipeline), so leans 5. Math: none shown. |
| B1-2 | batch_01 | AUC Is Not Your Friend | **4** | 2 | shows | Metric-fit to the action's cost function. Names precision@K / recall@precision / calibration but **shows no worked number** — asserts the math. |
| B1-3 | batch_01 | A/B Failure Modes (peeking + SRM) | **3** | 2 | shows | 5%→~25% stated; χ² *named* not worked. Failure-mode framing dominates. |
| B1-4 | batch_01 | Concept Drift (PSI) | **3** | 5 | shows | "PSI>0.2 is a terrible default" = why-it's-wrong; tiered monitor = pipeline decision. PSI formula not shown. |
| B1-5 | batch_01 | L1 vs L2 | **1** | 4 | shows | The one true #1 post: diamond-vs-sphere geometry *is* why it works. Tool-fit (when each) is the #4 half. **Still no formula rendered.** |
| B2-1 | batch_02 | Judgment Challenge — order of hypotheses | **5** | 3 | poses | "The order is the answer." Pure question; no worked resolution in-post. |
| B2-2 | batch_02 | India Insider — Razorpay loop shift | meta | 5 | poses | Market commentary, not a teaching dimension. Sets up the thesis. |
| B2-3 | batch_02 | Judgment Challenge — fraud 94% block | **5** | 3 | poses | Where-to-fix (model/threshold/calibration/process). Question only. |
| B2-4 | batch_02 | India Insider — production vs project story | meta | 5 | poses | Career/positioning commentary. Not dimension-bearing. |
| B2-5 | batch_02 | Judgment Challenge — StandardScaler leakage | **3** | 5 | poses | Concept = leakage (#3); framing = ship/hold decision (#5). Question only. |
| T-4 | tracker #4 | Feature-order scramble (dict order) | **3** | — | shows | Code-break. Bug + one-line fix. |
| T-14 | tracker #14 | float32 money threshold | **3** | 2 | shows | Code-break. float32 ≈7 sig-digits → $1 gap. Closest thing to *shown numeric math* in the set. |
| T-21 | tracker #21 | Temporal leakage (`.last()`) | **3** | 5 | shows | Code-break. Point-in-time correctness. |

---

## Coverage tally

**By primary dimension (13 pieces; 2 are meta):**

| Dim | Primary count | Pieces | SHOWS count |
|---|:---:|---|:---:|
| 1 — why it works | **1** | B1-5 | 1 |
| 2 — math underneath | **0** | (none primary) | **0 shown anywhere** |
| 3 — why it's wrong | **7** | B1-1, B1-3, B1-4, B2-5, T-4, T-14, T-21 | 6 shows / 1 poses |
| 4 — tool-fit & why | **1** | B1-2 | 1 (but math asserted) |
| 5 — decision across pipeline | **3** | B2-1, B2-3, B2-5* | 0 shows / 3 poses |
| meta (not a dimension) | 2 | B2-2, B2-4 | — |

\* B2-5 double-counted conceptually; counted once under #3 primary.

**Secondary touches** add weight to #5 (5 posts touch it) and #2 (4 posts *reference* math), but a touch is not coverage — secondary mentions assert; they don't show.

---

## The gap report

**Hypothesis going in:** over-indexed on #3, thin on #4 and #5.

**Verdict: confirmed, with two refinements that change the build plan.**

1. **#3 (why it's wrong) is heavily over-indexed — 7 of 11 teaching pieces (~64%).** Every code-break and most authority posts are failure-mode posts. This is on-brand ("systems break, we show how") but it has crowded out the other four kinds of judgment. The risk: the body of work teaches *spotting* breakage far more than *building correctly*, *proving with math*, or *choosing well*.

2. **#4 (tool-fit) is thin — exactly 1 post (AUC), and even that one asserts the math instead of showing it.** Confirmed. There is no post that works a real *choice* end to end with numbers (e.g. "reviewers check 100/day, a miss costs 50× a review → here is the precision@100 vs recall@precision arithmetic that picks the metric").

3. **#5 (decision across pipeline) is NOT thin in count — but it is thin in DEPTH.** This is the refinement. All three #5 posts are batch_02 **Judgment Challenges: pure questions**. They *pose* the decision and never show the worked resolution. They are excellent reach/comment engines, but against the depth standard they SHOW nothing — there is currently **zero #5 content that works the senior answer through** (the order, the reasoning, the business gate). The gap isn't "more #5 posts"; it's "a #5 post that SHOWS the resolution," i.e. a debrief/teach companion to the challenges.

4. **#2 (the math underneath) is the deepest gap of all — and the hypothesis missed it.** Across all 13 pieces, **not one shows a formula/test worked through with numbers.** AUC, χ², PSI, the L1/L2 geometry — all *named*, none *derived or computed on the slide*. This directly violates depth-standard rule #3 ("THE MATH — never name a check without showing it") and is the single clearest "show, don't tell" failure in the MSL set. float32 (T-14) is the closest, and it only does digit-counting.

5. **#1 (why it works) is thin — 1 post.** L1/L2 is the lone "mechanism that makes it correct" post. The set leans on breakage and judgment; it rarely builds the positive intuition for *why a working method works*.

**Restated priority of gaps (worst first):**
> **#2 (math shown) — absent · #4 (tool-fit shown) — 1, asserts math · #5 (decision SHOWN) — 0 (3 posed) · #1 (why-it-works) — 1**, against **#3 — 7.**

---

## What this implies for Batch 4 (the build)

Fill the gaps by **showing** the missing dimensions — each as a worked example, never asserted — while staying inside the content freeze (distribution/content only, no lab features). Candidate drafts, mapped to gaps:

- **#2 + #4 combined — "AUC is not your friend, with the arithmetic":** upgrade B1-2 (or a new code-break) to actually *compute* precision@100 vs recall@precision on a stated fraud base rate and reviewer budget. Turns an asserted post into a shown one and fills both the thinnest dims.
- **#5 SHOWN — the Judgment Challenge debrief:** take B2-1 (order of hypotheses) and write the companion that *works the order*: hypothesis 1 (skew) → the 2-min check → hypothesis 2 (label drift) → the check → hypothesis 3 (calibration) → the check, each tied to the business cost of checking it later. This is the missing "senior move, shown."
- **#1 SHOWN — a "why it works" post:** e.g. why gradient boosting actually reduces error (residual-fitting intuition with a tiny worked step), or render the L1/L2 geometry as the diagram it deserves.
- **#3 stays** as the backbone but is **not added to** in this pass — it's already over-indexed.

Full drafts (copy + diagram plan) live in `docs/linkedin/batch_03_msl.md`, content-first for approval before any render.
