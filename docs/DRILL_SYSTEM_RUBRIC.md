# Drill-System Rubric (portable across BreakLabs labs)

_A lab is not a content library. It is an **interview gym**. This rubric audits whether a lab
lets a candidate repeatedly drill topics until they can answer under pressure — not just read
about them. Run it as **step one** on any lab (MSL, GSL, PAL, …), before adding more content._

---

## How to run it

1. Inventory the drill surfaces: drill pool(s), question bank(s), spoken practice, case/incident
   rooms, coding/bug surfaces, and the progress/repetition loop.
2. Score the seven dimensions below (0–10). Be strict — teaching content does **not** count as
   drilling content.
3. Produce: overall verdict → 7 scores → coverage matrix (topic → surfaces → missing type) →
   top-10 gaps by interview ROI → P0/P1/P2 patch plan.
4. **Do not recommend new theory topics** unless a truly critical interview gap exists. Gaps are
   almost always *drill-format* gaps, not content gaps.

---

## The seven dimensions

**1. S/A topic drill coverage.** For each S-/A-tier topic, does it have: cold-recall Qs,
conceptual MCQs, explain-aloud prompts, failure-mode Qs, case-based Qs, cross-topic Qs, and a
production/system-design angle where relevant? A foundation article is not a drill.

**2. L0 / L1 / L2 depth.**
- **L0** — definition / basic explanation ("What is boosting?")
- **L1** — internal mechanism / math / params / failure modes ("How does XGBoost use gradients & Hessians?")
- **L2** — cross-concept applied reasoning ("Imbalanced fraud + XGBoost + delayed labels + poor calibration + review-capacity limits — what do you do?")
The single most important thing to inspect is whether there are **enough L2 drills** — that is
where senior interviews expose weakness.

**3. Spoken interview readiness.** Is there a way to practise: a 30-second answer, a 2-minute
answer, a deep follow-up, an "interviewer pushes back" answer, and an "I don't fully know, but
here's how I'd reason" answer? If not, it's a drill-system gap.

**4. Case-chain completeness.** Are there realistic multi-step chained scenarios that force
sequential reasoning (high offline AUC but poor online; PR-AUC up but ops complains about false
alerts; train-serving skew after a pipeline change; data vs concept vs infra drift; XGBoost +
imbalance + calibration + threshold; target-encoding leakage; delayed labels & point-in-time;
silent model staleness; retrieval recall capping ranker quality; transformer fine-tuning
failure)? Isolated flashcards ≠ chains.

**5. Feedback & scoring loop.** Does each drill give: correct answer, explanation, why the wrong
options are wrong, interviewer-safe framing, anti-patterns, severity/priority, and what to
actually say in a real interview? "Correct/incorrect" alone is weak.

**6. Progress & repetition.** Does the app track completed drills, resurface weak topics, support
bookmarks/saved items, offer spaced repetition or a manual review loop, separate high-priority
(S/A) topics, and surface unfinished S-tier drills? Don't overbuild — just enough to close loops.

**7. Interactive usefulness.** Interactives matter only where they teach what prose cannot —
generalization/train-test error, gradient descent/SGD, attention, calibration, data drift, error
analysis, train-serving skew, dimensionality. Don't recommend an interactive for every topic.

---

## Scoring template

| Dimension | Score /10 | Notes |
|---|---|---|
| S/A drill coverage | | |
| L0 / L1 coverage | | |
| L2 case coverage | | |
| Spoken readiness | | |
| Feedback quality | | |
| Progress / repetition | | |
| Interactive usefulness | | |

**Verdict rule of thumb:** a lab is "gym-complete" only when **L2 case coverage ≥ 7** and
**spoken readiness ≥ 7** — those two are what convert "knows the material" into "passes the loop."
Everything else can be strong and the lab still won't convert if those two are weak.

---

## MSL baseline (2026-07, after the P0 pass)

Scores at audit time: S/A 7.5 · L0/L1 8.5 · **L2 5** · **spoken 3** · feedback 8.5 · progress 5.5 ·
interactive 6.5. The two weak dimensions were L2 and spoken — both P0.

**P0 shipped:** a tiered **Speak** mode (30s / 2-min / interviewer-pushback / reason-when-unsure,
Web-Speech engine) added to Interview Questions; **+15 authored L2 case-chain drills** (the exact
chains listed in dimension 4) added to the drill pool + Incident Room.

**Deferred (P1):** drill-completion tracking + "unfinished S-tier" surfacing in the drill browser;
extend the Review room (spaced-rep) to cover drills/Q&A, not just modules; 30s/2-min/deep
answer-length tiers on written model answers.

---

## Applying to a new lab (e.g. GSL)

Run dimensions 1–7 against the lab's own S/A topics **before** authoring new content. Expect the
same failure shape: content and feedback usually strong, **L2 and spoken usually weak**. Fix those
two first. Reuse this lab's Speak-mode pattern and case-chain drill schema rather than reinventing.
