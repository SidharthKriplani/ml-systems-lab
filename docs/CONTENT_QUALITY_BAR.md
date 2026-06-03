# Content Quality Bar — ML Systems Lab

**What makes a scenario good enough to ship.**

Every playable scenario in MSL must pass this bar before publishing. A scenario that fails any of these criteria should not ship regardless of how complete it looks.

*Adapted from PAL (Product Analytics Lab) content quality standard. Calibrated for production ML judgment scenarios.*

---

## The Core Test

**Would a senior ML/data engineer reading this scenario learn something that changes how they approach real production work?**

If the answer is "probably not" — because the scenario is too easy, too obvious, too textbook, or because the reveal doesn't add anything beyond what common sense would suggest — it does not ship.

---

## 1. The Decision Must Be Genuinely Hard

The right answer should not be obvious on first glance. A good scenario has one of:

- A metric that looks healthy but hides a production failure mode
- A genuine tension between two valid approaches (e.g., both are defensible, but one fails in a specific production condition)
- A structural issue that invalidates a common assumption (e.g., SMOTE doesn't fix class imbalance — threshold tuning does)
- A contextual factor that changes what the right call is (e.g., same PSI threshold means different things at different model risk levels)

If someone with two years of ML experience would get it right on first pass without reading carefully, the scenario is too easy. If it requires domain knowledge that only a narrow specialist has, it's too hard. Calibrate to the target level (Mid / Senior / Staff).

---

## 2. The Question Must Create a Production Situation

Every scenario opens with a real situation — not a definition, not a taxonomy, not "explain X." Format:

- Named system or context (e.g., "Your fraud detection model deployed 2 weeks ago")
- Specific numbers where possible (e.g., "precision dropped from 0.75 to 0.52")
- A decision the practitioner actually faces (not "what is PSI?" but "PSI = 0.19 — do you page?")

Abstract questions ("what is the difference between X and Y?") belong in InterviewPrepTab only. Practice modules (ClassicalML, SystemDesign, Monitoring, etc.) must be situation-first.

---

## 3. The Four Option Levels Must Be Calibrated

Every scenario has 4 options representing distinct judgment levels:

| Level | What it represents |
|-------|-------------------|
| **Junior miss** | Defensible on surface read. Misses a critical production consideration. Should feel like a reasonable answer to someone without production experience. NOT obviously wrong. |
| **Mid-level** | Gets the right call but is incomplete. Identifies the problem correctly, makes the right decision, but doesn't articulate the full mechanism or production implication. |
| **Senior-ready** | Correct decision with correct reasoning. Names the failure mode, explains why it happens in this specific context, specifies a concrete next step. |
| **Staff-level** | Adds precision, forward-looking framing, and stakeholder-aware language. Not just "this is data drift" but "here's why it happened, what it means for the downstream model, how to explain it to the PM, and what the monitoring fix is." |

**Calibration check:** At least one person who didn't write the scenario should independently assign the four levels. If reviewers disagree on which is senior vs staff, revise.

The junior miss must be tempting — if it's obviously wrong, there's no learning.

---

## 4. The Reveal Must Earn Its Space

The reveal (answer explanation) is the learning payoff, not a summary of what happened. It must:

- Name the failure mode explicitly and define it briefly in the MSL context
- Explain why it matters specifically in this scenario (not generically)
- Address the most common wrong answer (the junior miss) and explain what it misses
- Connect the issue to a downstream production consequence
- Give a concrete next step or monitoring signal

The reveal must not:
- Simply restate the question or what the correct option says
- Be generic enough to apply to any scenario with this failure mode
- Use hedge language that avoids a position ("it depends" without saying what it depends on)
- Exceed what's necessary for clarity — production reasoning, not a textbook chapter

**Length target:** 150–400 words for standard AccordionMCQ reveals. Incident Room and StaffLayer reveals can be longer (400–700 words) because the scenarios are more complex.

---

## 5. `whatsTested` Must Be Specific to This Question

The `whatsTested` field (amber hint before the reveal button) must name what the interviewer is actually evaluating — not what topic the question covers.

Good: "Whether you know that class imbalance in fraud is solved primarily by threshold tuning, not SMOTE — and whether you think about the label delay problem."

Bad: "Knowledge of class imbalance handling in fraud detection."

The test is: could this `whatsTested` apply to a different question in the same category? If yes, it's too generic.

---

## 6. `antiPattern` Must Name the Exact Wrong Answer

The `antiPattern` field (rose callout inside the reveal) must quote or closely paraphrase the actual wrong answer candidates give — not describe the category of error.

Good: `"'I'd use SMOTE to handle the class imbalance.' SMOTE can help in narrow cases but the real lever is threshold calibration based on cost asymmetry..."`

Bad: `"Don't rely on oversampling techniques alone for class imbalance."`

The test is: does this antiPattern describe what a real candidate would actually say in an interview? If it sounds like a textbook warning rather than a real candidate answer, revise.

---

## 7. Each Scenario Teaches Exactly One Failure Mode

If a scenario straddles two failure modes (e.g., both label leakage AND point-in-time incorrectness), either:
- Simplify it so one failure mode is clearly dominant, OR
- Split it into two separate scenarios

Teaching one thing well is more valuable than teaching two things in one scenario. The `whatsTested` field is the test: if you can't write a single-sentence `whatsTested`, the scenario is trying to teach too much.

---

## 8. Business Context Must Be Specific

The company, system, and production pressure must feel real.

Bad: "A model deployed to production."
Good: "Your fraud detection model serving 50K transactions/day has been live for 2 weeks. Precision dropped from 0.75 to 0.52 in the last 48 hours and the ops team is getting merchant complaints."

The business context is not flavor text — it changes what the right answer is. Vague contexts produce vague reasoning.

---

## Difficulty Tiers

| Tier | Target audience | What it means |
|------|----------------|---------------|
| Mid | 2–4 years production ML experience | Failure mode is recognisable if you know what to look for. Well-known pattern. |
| Senior | 4–7 years, has shipped ML in production | Requires contextual interpretation or involves interacting factors. |
| Staff | 7+ years, owns system design decisions | Requires statistical precision, trade-off reasoning, or knowing when the standard playbook doesn't apply. |

If practitioners at the target level consistently miss the right call, the scenario is mis-tiered or poorly constructed. If everyone gets it right, it's probably too easy.

---

## Pre-Ship Checklist

- [ ] Decision is genuinely hard — surface read differs from correct read
- [ ] Opens with a specific production situation, not an abstract question
- [ ] All four options represent distinct, calibrated judgment levels
- [ ] Junior miss is tempting — not obviously wrong
- [ ] Reveal is scenario-specific, not generic (150–400 words)
- [ ] `whatsTested` names what the interviewer is evaluating, not just the topic
- [ ] `antiPattern` quotes what a real candidate would actually say
- [ ] Scenario teaches exactly one failure mode
- [ ] Business context creates real production pressure
- [ ] Difficulty tier is consistent with target audience
- [ ] At least one reviewer who didn't write it has checked the reveal
- [ ] Brace balance verified (delta 0 after adding to JSX)
- [ ] No hardcoded colors — all via CSS variables
