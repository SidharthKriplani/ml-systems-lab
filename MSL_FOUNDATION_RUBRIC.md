# MSL Foundation Content — Eval Rubric

**Version:** 1.0  
**Purpose:** Audit framework for all foundation rooms. Use before shipping any new room or revising existing content. Score every dimension honestly — this is a tool for improvement, not validation.  
**Scope:** Applies to all 15 current foundation rooms + any future rooms (Optimization, Data).

---

## How to Use

1. Score each **Room-Level** dimension once per room (covers the room as a whole).
2. Score each **Module-Level** dimension for every individual module in the room.
3. Average module scores to get the room's module score.
4. Check all **Red Flags** — any red flag overrides score and requires a fix before the room ships.
5. Fill out the **Room Summary Sheet** at the end.

**Scoring scale:**
| Score | Meaning |
|-------|---------|
| 5 | Exemplary — sets the bar |
| 4 | Strong — minor gaps only |
| 3 | Adequate — works but leaves value on the table |
| 2 | Weak — noticeable problems that hurt learners |
| 1 | Failing — must be reworked before shipping |

---

## Part 1: Room-Level Dimensions

*Score these once for the entire room.*

---

### R1 — Topic Coverage

**What it measures:** Are the right concepts in this room? Are critical subtopics present? Is anything included that doesn't belong?

| Score | Descriptor |
|-------|-----------|
| 5 | All essential topics covered; scope is tightly matched to room's domain; no important concept a practitioner would expect is missing |
| 4 | Core topics present; 1-2 non-critical gaps that won't mislead a learner |
| 3 | Major topics present but with meaningful gaps; some modules cover overlapping ground |
| 2 | Significant omissions — a learner finishing this room would have blind spots that hurt them in interviews |
| 1 | Coverage is random or heavily imbalanced; key foundation concepts absent |

**Audit questions:**
- If you drew a concept map of this domain, what percentage of nodes does this room cover?
- What would a senior practitioner say is missing?
- Are there modules that belong in a different room?
- Does the module list cover both the *what* and the *why* of the domain?

---

### R2 — Room Scope Justification (Merit)

**What it measures:** Does this room deserve to exist as its own room? Is the scope coherent and non-redundant with other rooms?

| Score | Descriptor |
|-------|-----------|
| 5 | Clearly distinct domain; content cannot be absorbed into another room without loss; scope is well-defined |
| 4 | Mostly distinct; minor overlap with one adjacent room |
| 3 | Scope is defensible but fuzzy at the edges; some modules could live elsewhere |
| 2 | Room feels like an extension of another room; hard to articulate what makes it distinct |
| 1 | Should be merged into another room or split into two different rooms |

---

### R3 — Module Count Proportionality

**What it measures:** Does the number of modules reflect the actual scope of the domain? Too few = gaps. Too many = bloat and false equivalences.

| Score | Descriptor |
|-------|-----------|
| 5 | Module count directly proportional to domain scope; each module is a clearly distinct concept |
| 4 | Count is appropriate; 1-2 modules could be merged or split but it's defensible |
| 3 | Slight mismatch — domain is either under-covered (needs 2-3 more) or over-fragmented |
| 2 | Material mismatch — domain needs significantly more coverage or has redundant modules |
| 1 | Arbitrary count with no relationship to actual domain scope |

**Reference baselines:**
- Narrow focused domain (Bandits, Graph ML): 8–12 modules
- Medium domain (RL, Time Series, Classical ML): 12–18 modules
- Wide foundational domain (Math & Stats, DL): 18–25 modules

---

### R4 — Cross-Room Depth Uniformity

**What it measures:** Relative to other rooms, is this room's depth consistent? A concept that's interview-critical should get similar treatment regardless of which room it's in.

| Score | Descriptor |
|-------|-----------|
| 5 | Depth is commensurate with importance; aligns with comparable rooms |
| 4 | Slight inconsistency — one or two modules thinner or thicker than peers in other rooms |
| 3 | Noticeable inconsistency — this room is clearly shallower or deeper than rooms of similar importance |
| 2 | Significant gap — this room would embarrass itself next to a comparable room |
| 1 | No relationship between depth and importance; effectively random |

---

### R5 — Pedagogical Layer Presence

**What it measures:** Does the room have at least one interactive/visual element that genuinely aids comprehension — not decoration, but explanation-through-interaction?

| Score | Descriptor |
|-------|-----------|
| 5 | Multiple well-chosen interactive elements; each earns its presence by teaching something that prose cannot |
| 4 | At least one strong interactive element; more could help but what's there works |
| 3 | Interactive element exists but is thin (e.g., shows a formula without letting user manipulate it) |
| 2 | Planned but not implemented, or implemented but adds no explanatory value |
| 1 | No interactive layer at all |

**What counts:**
- Loss surface visualization where user can adjust learning rate and watch gradient descent path
- Attention weight heatmap that updates as the user changes input
- Exploration-exploitation slider showing cumulative regret over time
- Equation walkthrough: user inputs values, sees step-by-step computation
- Decision boundary that redraws as user adjusts hyperparameters

**What doesn't count:**
- Static diagrams that could be a screenshot
- Progress bars
- Collapsible sections

---

### R6 — Beginner Floor / Advanced Ceiling

**What it measures:** Does the room work for both a motivated college student with school-level math AND a working ML engineer who wants rigorous depth? These are different users; the room must serve both without watering down for the former or boring the latter.

| Score | Descriptor |
|-------|-----------|
| 5 | Core explanations build from first principles requiring only school math; advanced nuance lives in keyPoints and checkQuestions; neither user is left behind |
| 4 | Floor is solid; ceiling has minor gaps (some advanced nuance missing) or vice versa |
| 3 | Works for one audience well but fails the other (too jargon-heavy for beginners, or too basic for competent learners) |
| 2 | Tries to serve both but ends up mediocre for both |
| 1 | Written for one audience only with no thought for the other |

---

## Part 2: Module-Level Dimensions

*Score these for every individual module. Average across modules for room-level view.*

---

### M1 — First-Principles Grounding

**What it measures:** Can a motivated person with school-level math (algebra, basic calculus, probability) and first-year CS follow the reasoning chain from start to finish — without assumed ML vocabulary?

| Score | Descriptor |
|-------|-----------|
| 5 | Reasoning builds from scratch; terms introduced before use; math shown as intuition first, then formalized; no unexplained jargon |
| 4 | Mostly grounded; 1-2 terms used without definition that a diligent reader could infer from context |
| 3 | Core concept accessible but some steps skip the "why" and jump to "what"; a beginner would follow the surface but miss the mechanism |
| 2 | Requires prior ML vocabulary to make sense; a beginner would hit multiple walls |
| 1 | Written assuming the reader already knows the concept; no grounding at all |

**Audit questions:**
- Can you explain the concept using only: arithmetic, basic algebra, the idea of "fitting a curve to data", and common sense?
- Is every equation preceded by an intuition that makes the equation feel inevitable?
- Would a bright 19-year-old understand *why* this concept exists, not just *what* it is?

---

### M2 — Module Structure Completeness

**What it measures:** Does the module have all required structural fields, properly populated (not placeholder/thin)?

| Score | Descriptor |
|-------|-----------|
| 5 | All fields present and substantive: title, subtitle, difficulty, estimatedMin, tags, summary (6+ sentences), keyPoints (8+), checkQuestions (4+) with full answers |
| 4 | All fields present; one field slightly thin but not misleading |
| 3 | Missing 1 non-critical field, or 2+ fields are thin but present |
| 2 | Multiple fields missing or multiple fields are placeholder-quality |
| 1 | Module skeleton only; content not actually written |

**Required fields checklist:**
- [ ] `id` — unique, snake_case
- [ ] `title` — clear, specific (not "Introduction to X")
- [ ] `subtitle` — one sentence saying what the module delivers
- [ ] `difficulty` — foundational / intermediate / advanced (honestly calibrated)
- [ ] `estimatedMin` — honest (see M5)
- [ ] `tags` — 3-5 relevant tags
- [ ] `summary` — 6+ sentences, concept + mechanism + consequence
- [ ] `keyPoints` — 8+ points, practitioner-level (see M3)
- [ ] `checkQuestions` — 4+ questions with complete answers (see M6)

---

### M3 — Key Points Quality

**What it measures:** Are the key points things a practitioner would say to another practitioner — connecting mechanisms, trade-offs, failure modes, and real-world implications — rather than Wikipedia summaries?

| Score | Descriptor |
|-------|-----------|
| 5 | Every key point contains a *connection* or *consequence* — not just a fact. A senior engineer reading these would nod and say "yes, exactly." |
| 4 | Most points are practitioner-level; 1-2 are factual summaries that don't advance understanding |
| 3 | Mix of good points and surface-level facts; reader comes away knowing *what* but not always *why it matters* |
| 2 | Most points read like a textbook summary — factual but passive; no connections, no trade-offs, no "so what" |
| 1 | Key points are bullet-point Wikipedia; no insight a practitioner would value |

**The test:** For each key point, ask: "Would knowing this change how I'd design a system or answer an interview question?" If no, rewrite it.

**Example of failing (score 1-2):**
> "Batch normalization normalizes activations across the batch dimension."

**Example of passing (score 4-5):**
> "Batch normalization's effectiveness is tied to batch size: below ~16 samples, batch statistics become too noisy and performance degrades — this is why layer norm replaced it in transformers and small-batch fine-tuning scenarios. The 'batch' in BN is not incidental; it's the mechanism."

---

### M4 — Takeaway Clarity

**What it measures:** After completing this module, is there one concrete insight that sticks — something you could state in one sentence and remember three months later?

| Score | Descriptor |
|-------|-----------|
| 5 | Takeaway is implicit in the summary and keyPoints; a reader can immediately articulate "the thing this module taught me" |
| 4 | Takeaway is clear but requires a careful read to extract |
| 3 | Module has interesting content but the "so what" is buried or absent |
| 2 | Module teaches facts but leaves no lasting mental model |
| 1 | No clear point; reader knows slightly more facts but has no new understanding |

**Test:** Can you complete this sentence after reading the module?  
*"The key insight of [module] is that ____, which means in practice you ____."*

---

### M5 — Time Estimate Honesty

**What it measures:** Does the `estimatedMin` reflect actual engaged reading + thinking time for an average motivated learner? Not skimming time. Not expert-reads-fast time.

| Score | Descriptor |
|-------|-----------|
| 5 | Estimate matches reality within ±5 minutes for an engaged learner |
| 4 | Off by 5-10 minutes in either direction |
| 3 | Off by 10-15 minutes — module is under-estimated (too shallow) or over-estimated (padded) |
| 2 | Estimate is systematically dishonest — module claims 40min but delivers 15min of real content |
| 1 | Arbitrary; no relationship to actual content depth |

**Calibration guide:**
- 1 sentence of summary ≈ 30 seconds to read + absorb
- 1 substantive key point ≈ 90 seconds (read, understand, make connection)
- 1 check question with full answer ≈ 3-4 minutes (read, think, read answer, reflect)
- A 40-minute module should have: ~8-sentence summary + 10 key points + 5 check questions = legitimately 40 min

---

### M6 — Check Question Quality

**What it measures:** Do the check questions separate people who read the module from people who actually understood it? Do the answers demonstrate the mechanism, not just restate the definition?

| Score | Descriptor |
|-------|-----------|
| 5 | Every question probes mechanism, trade-off, or failure mode; answers contain the "why" not just the "what"; a strong answer would impress in a real interview |
| 4 | Most questions are strong; 1 is too definitional |
| 3 | Mix — some questions probe understanding, some just test recall |
| 2 | Most questions are definitional ("what is X?") — a reader who memorized without understanding could pass |
| 1 | Questions are trivially answered by rereading the summary; no real check of comprehension |

**Question type hierarchy (ascending quality):**
1. Recall: "What is dropout?" — worst
2. Explanation: "Why does dropout work as regularization?" — mediocre
3. Mechanism: "Why does dropout at test time use all weights scaled by p, and what goes wrong if you don't?" — good
4. Trade-off: "When would you choose dropout over L2 regularization?" — strong
5. Edge case / failure: "Under what conditions does dropout hurt performance?" — best

---

### M7 — Equation and Visual Integration

**What it measures:** When an equation appears, is it walked through step-by-step with intuition? Are there visual elements (or hooks for them) that make the mechanism graspable without being a mathematician?

| Score | Descriptor |
|-------|-----------|
| 5 | Every equation is preceded by plain-English motivation, followed by a term-by-term breakdown, and connected to what the update *does* (e.g., "the gradient points uphill, so subtracting it moves us downhill toward lower loss") |
| 4 | Equations explained well; one is dropped in without sufficient walkthrough |
| 3 | Equations present but treated as definitions rather than explanations; reader can see the formula but not feel why it has the shape it does |
| 2 | Equations appear with minimal context; a reader without prior exposure would not understand what they're looking at |
| 1 | No equations where equations would help, or equations with no explanation at all |

**The iterative loop test:** For any loss/gradient/optimization content — does the module show (or clearly hook to a visual that shows) what happens across multiple steps? One gradient step is a formula. Three steps with changing values is understanding.

---

### M8 — Interview Importance Calibration

**What it measures:** Is the depth of this module proportional to how often and how deeply interviewers probe this concept at senior ML roles?

| Score | Descriptor |
|-------|-----------|
| 5 | Depth matches interview frequency precisely; high-signal topics get thorough treatment; low-signal topics are covered efficiently without bloat |
| 4 | Mostly calibrated; one topic slightly over- or under-treated |
| 3 | One important topic is thin, or a less-important topic takes disproportionate space |
| 2 | Significant miscalibration — a concept interviewers hammer is surface-level, or a niche topic takes 70min |
| 1 | No apparent relationship between depth and interview importance |

**High interview signal topics (examples):**
- Bias-variance tradeoff, regularization, overfitting diagnosis
- Backprop mechanics, vanishing gradients, normalization choices
- Evaluation metrics for imbalanced data, proper train/val/test splits
- Attention mechanism, why transformers work, positional encoding
- Feature importance, tree ensemble mechanics, boosting vs. bagging
- Production: latency vs. accuracy tradeoffs, serving patterns

**Lower signal (efficient coverage fine):**
- Historical context, original paper authors, naming conventions
- Exhaustive hyperparameter lists without tradeoff reasoning
- Implementation details that have been abstracted by modern frameworks

---

### M9 — Difficulty Honest Calibration

**What it measures:** Is the `difficulty` tag (foundational / intermediate / advanced) accurate for this module relative to other modules in the same room?

| Score | Descriptor |
|-------|-----------|
| 5 | Tag is accurate; module sequencing respects the difficulty ladder (foundational before intermediate before advanced) |
| 4 | Tag is accurate; minor sequencing issue |
| 3 | Tag is slightly off (intermediate content tagged foundational, or vice versa) |
| 2 | Tag is wrong — creates false confidence (easy content tagged advanced) or false intimidation (advanced content tagged foundational) |
| 1 | Tags are arbitrary or all the same regardless of actual difficulty |

---

## Part 3: Red Flags

*Any red flag below blocks a room from shipping regardless of score. Fix before proceeding.*

**Content red flags:**
- [ ] **Unescaped apostrophes** in single-quoted JS strings (build breaker)
- [ ] **Module with < 5 keyPoints** — not enough substance regardless of topic size
- [ ] **Check question with answer < 3 sentences** — insufficient to demonstrate understanding
- [ ] **`estimatedMin` ≤ 15 for any module** — almost certainly too shallow
- [ ] **All modules in a room tagged same difficulty** — impossible; all domains have a ramp
- [ ] **Summary is ≤ 3 sentences** — placeholder, not a module

**Structural red flags:**
- [ ] **Duplicate module IDs** anywhere across rooms
- [ ] **Module references a concept from a later room** without defining it
- [ ] **Room has no module tagged `foundational`** — every room needs an entry point
- [ ] **Room has no module tagged `advanced`** — every room should have a ceiling

**Pedagogical red flags:**
- [ ] **No check question that asks "why" or "when" or "what breaks if"** — room only tests recall
- [ ] **Loss/gradient concept in room with no iterative explanation** — core mechanism missing
- [ ] **Room assumes knowledge of another room's advanced content** — dependency not declared

**Coverage red flags:**
- [ ] **Domain has a canonical known failure mode not covered** (e.g., RL room with no coverage of reward hacking)
- [ ] **Room covers theory but no production/practical implication** — every room should close with "so what for real systems"

---

## Part 4: Skeleton Completeness Audit

*Is the set of 15 rooms itself complete? Score each.*

| Room | Current | Modules | Coverage Gap | Priority |
|------|---------|---------|-------------|----------|
| Math & Stats | ✅ | 18 | Optimization (SGD, Adam) arguably missing | High |
| Classical ML | ✅ | 14 | — | — |
| Probabilistic ML | ✅ | 9 | Approximate inference could go deeper | Medium |
| Eval | ✅ | 10 | — | — |
| Unsupervised | ✅ | 8 | — | — |
| Causal | ✅ | 8 | — | — |
| Deep Learning | ✅ | 12 | — | — |
| Self-supervised | ✅ | 9 | — | — |
| RL | ✅ | 10 | — | — |
| Production | ✅ | 10 | — | — |
| Monitoring | ✅ | 8 | — | — |
| System Design | ✅ | 8 | — | — |
| Time Series | ✅ | 9 | — | — |
| Graph ML | ✅ | 9 | — | — |
| Bandits | ✅ | 9 | — | — |
| **Optimization** | ❌ MISSING | — | SGD/Adam/schedules/gradient flow/loss landscapes — currently scattered across DL and Math, owned by neither | High |
| **Data** | ❌ MISSING | — | Feature engineering, data quality, distribution shift, imbalance, preprocessing — the unglamorous half of real ML; nowhere in current skeleton | High |

**Verdict:** 15/17 rooms exist. Optimization and Data are genuine gaps, not nice-to-haves. Without them, a learner finishes all 15 rooms and still doesn't know why Adam beats SGD or what to do with a 99:1 class imbalance.

---

## Part 5: Room Summary Sheet Template

*Copy and fill for each room audit.*

```
ROOM: ___________________
Auditor: ___________________
Date: ___________________

ROOM-LEVEL SCORES
-----------------
R1 Topic Coverage:              _/5  Notes:
R2 Scope Justification:         _/5  Notes:
R3 Module Count:                _/5  Notes:
R4 Cross-Room Uniformity:       _/5  Notes:
R5 Pedagogical Layer:           _/5  Notes:
R6 Beginner/Advanced Dual:      _/5  Notes:

Room Average: _/5

MODULE-LEVEL SCORES (average across all modules)
-------------------------------------------------
M1 First-Principles Grounding:  _/5
M2 Structure Completeness:      _/5
M3 Key Points Quality:          _/5
M4 Takeaway Clarity:            _/5
M5 Time Estimate Honesty:       _/5
M6 Check Question Quality:      _/5
M7 Equation/Visual Integration: _/5
M8 Interview Importance:        _/5
M9 Difficulty Calibration:      _/5

Module Average: _/5

WORST MODULE: ___________ (score _/5 on M___)
BEST MODULE:  ___________ (score _/5 on M___)

RED FLAGS TRIGGERED
-------------------
[ ] None
[ ] _______________________________
[ ] _______________________________

PRIORITY FIXES (ordered)
-------------------------
1.
2.
3.

OVERALL ROOM SCORE: _/5
SHIP-READY: YES / NO (No if any red flag OR overall < 3.5)
```

---

## Part 6: Scoring Summary Across All Rooms

*Fill after all rooms are audited. Identify systemic issues.*

| Room | R-Avg | M-Avg | Overall | Ship? | Worst Dim |
|------|-------|-------|---------|-------|-----------|
| Math & Stats | | | | | |
| Classical ML | | | | | |
| Probabilistic ML | | | | | |
| Eval | | | | | |
| Unsupervised | | | | | |
| Causal | | | | | |
| Deep Learning | | | | | |
| Self-supervised | | | | | |
| RL | | | | | |
| Production | | | | | |
| Monitoring | | | | | |
| System Design | | | | | |
| Time Series | | | | | |
| Graph ML | | | | | |
| Bandits | | | | | |

**Systemic failure** = same dimension scores ≤ 2 across 3+ rooms → that dimension needs a global pass, not room-by-room fixes.

---

## Part 7: Dimension Priority Ordering

When time is limited and you can only fix some things, fix in this order:

1. **Red flags first** — build breakers and structural corruption block everything else
2. **M6 Check Questions** — the fastest signal of whether content has real depth
3. **M3 Key Points Quality** — the bulk of learning happens here
4. **M1 First-Principles Grounding** — gates the beginner audience
5. **M5 Time Estimate Honesty** — trust signal; dishonest estimates erode credibility
6. **M4 Takeaway Clarity** — retention multiplier
7. **R5 Pedagogical Layer** — high value but high effort; do after prose is solid
8. **M7 Equation Integration** — dependent on R5 being in place
9. **R4 Cross-Room Uniformity** — polish pass, last
