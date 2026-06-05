# CONTENT_QUALITY_BAR.md — MSL Scenario Quality Standard

Every scenario must pass all four checks before shipping. No exceptions.

---

## The four checks

### 1. One failure mode per scenario
Each scenario teaches exactly one production failure mode. If a scenario requires understanding two different concepts to answer correctly, it straddles. Split it or simplify it.

**Test:** Cover the `staffFraming`. Can you state the single failure mode in one sentence? If not, the scenario is doing too much.

### 2. The antiPattern must be genuinely tempting
The wrong answer must be something a real engineer — not a student — would pick with confidence. If the distractor is obviously wrong to anyone with ML experience, it's testing recall, not judgment.

**Test:** Would a mid-level engineer at a real company pick this wrong answer during a loop? If yes, it's a good distractor. If only a complete novice would pick it, the scenario is too easy and doesn't belong.

### 3. staffFraming must be scenario-specific
The `staffFraming` reveal cannot be a general principle that applies to any scenario of this type. It must name the specific failure, the specific context, and what the promoted answer does differently *here*.

Wrong: "Senior engineers always consider the full data pipeline before choosing a metric."

Right: "The tell here is that the feature store snapshot date precedes the label cutoff by 6 days — a senior engineer sees that gap and asks about the refresh cadence before touching the model."

**Test:** Remove the scenario title. Does the `staffFraming` still make sense? If yes, it's too generic. Rewrite it to be specific to this scenario.

### 4. Every scenario needs a production tell
The `staffFraming` must include at least one "in production, this manifests as..." statement. This is what separates MSL from a flashcard deck. The user should finish knowing what the failure looks like in a real system.

**Test:** Does the reveal reference something observable — a monitoring dashboard signal, a data quality alert, a model degradation pattern, a system log entry? If not, add it.

---

## Format requirements

All MCQ scenarios must have all three fields populated:

| Field | What it is | Length |
|-------|-----------|--------|
| `whatsTested` | One phrase naming the judgment being tested | 4–10 words |
| `antiPattern` | The wrong answer and why it's tempting | 1–3 sentences |
| `staffFraming` | Scenario-specific, production-tell-included reveal | 80–300 words |

A scenario missing any field is incomplete and must not ship.

---

## Interactive module standard (from GSL — Configure → Logic → Outcome → Diagnosis)

Every interactive module (not MCQ scenarios) must meet this standard:

1. **Configure** — user sets a parameter or makes a choice
2. **Logic** — code derives an outcome from that specific choice, not from a lookup table
3. **Outcome** — the result is specific: a recommendation, a failure mode, a cost
4. **Diagnosis** — the outcome explains WHY, not just what happened

A module that presents information without requiring user input is a reference table, not an interactive. Reference tables belong in Gradient posts, not in tabs.

---

## What does NOT belong in MSL

- Definition-first questions ("What is feature drift?")
- Recall questions answerable without having shipped a model
- Scenarios where the correct answer is obvious to a bootcamp graduate
- Generic staffFraming that applies to all scenarios of the same type
- Scenarios where the production tell is absent

If a user can answer correctly without production ML experience, the question probably doesn't belong.

---

## Content depth thresholds (standing rule from DECISIONS.md)

| Section | Minimum before it's a feature |
|---------|-------------------------------|
| Incident Room | 12 scenarios |
| ML Coding | 12 problems |
| Any new practice area | 12 items |

Below 12 is a preview. Do not surface or market a section until it hits the threshold.
