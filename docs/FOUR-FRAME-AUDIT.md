# FOUR-FRAME AUDIT — ML Systems Lab

_Build session, 2026-06-22. **Read-only / propose-only.** Maps MSL's existing surface onto the Competence Model's four frames (`HQ/COMPETENCE-MODEL.md`, DEC-15) to see where the lab is strong, where it's thin, and how its IA would reorganize under the frames. **No nav rebuilt, no content added, no code touched.** Restructure in §5 is a proposal awaiting approval._

> **The model, in one line:** every lab is scoped by four frames in a dependency ladder — **recall+depth → fluency → ownership → judgment** — each gating the next. Communication is the cross-cutting layer, not a fifth frame. Ownership is scaffold+capture, not "taught." The 5D framework sits *under* judgment.

---

## 1. Inventory — MSL's full surface

MSL today routes through **5 bottom-nav zones** (`TAB_TO_ZONE` in `App.jsx`): Today, Practice, Read, Interview, Ask — and an 8-section nav (`NAV_SECTIONS`: Features, Evaluation, Systems, Training, Data, Interview, Labs, Learn). Below is every user-reachable surface, grouped as the product groups them, with grounded counts.

**TODAY (orientation / meta)**
- Home (dashboard: streak, continue strip, weak-area callouts)
- Landscape (ML tools & infra map)
- Plans (pricing) · Profile · Resources (curated links)

**READ / LEARN (the knowledge core)**
- **Gradient** — ~140+ long-form production-ML essays, sequenced as the **MLE Path** (57-post curriculum) + the **Foundations Path** (34-post first-principles ladder, `data/foundationsPath.js`) + the Ground-Up set (101–120). Each post augmented with a "production tell."
- **Foundations Simplify** — 132 plain-language versions of conceptual posts (`data/foundationsSimplify.js`)
- **Foundations Glossary** (`data/foundationsGlossary.js`)
- **Cheatsheet** — 4-tier last-minute prep: flashcards, formulas, trade-off comparisons, 7-day plan

**PRACTICE (scenario domains — "production failure modes")**
- _ML Engineering:_ Math Foundations (Pyodide explorations) · Feature Engineering · Model Evaluation · System Design · Classical ML · **Project Lab (Telco churn)** · **Loan Default** · **Fraud Detection** (the last three = full Pyodide end-to-end notebooks)
- _Data Engineering:_ Spark Lab (PySpark) · Airflow · dbt (SQL transforms) · Data Modeling
- _Deep Learning:_ Training Lab · Fine-tuning · DL Serving
- _Causal & Time Series:_ Causal Inference · Time Series
- _MLOps:_ Monitoring · Deployment · CI/CD & Infra
- _Drills:_ Trainer (MCQ drill over 378 questions in `data/quizData.js`) · Code Bugs (26 buried-flaw snippets, Python/SQL/Spark) · Case Studies (Netflix/Uber/Airbnb/DoorDash/Spotify) · Staff Layer (30 IC3→IC5→Staff reveals)

**INTERVIEW (simulation tools)**
- Mock Interview (JD → AI-interviewer system prompt) · Interview Q&A (~128–136 curated Q+model answers) · Take-Home Bank (15 open-ended system-design) · Defense Plan (JD → gap map → study plan; project-defense round) · Combinator (timed mixed exam) · Verbal Practice (Web Speech, say it out loud) · **Spot the Flaw** (12 buried methodological flaws) · **Incident Room** (3 cross-domain incidents, multi-step diagnosis) · **ML Coding** (≈13–15 ML-specific Python problems, live Pyodide) · Staff Layer

**ASK**
- Ask (search/Q&A over the corpus)

**Adjunct (not in the user nav):** ~50 SEO company-specific interview guides (PhonePe/Flipkart/Razorpay…), `interviewExperiences.js`, testimonials.

---

## 2. Frame tagging (primary · secondary)

Tagging rule from the model: **primary = the frame the surface chiefly trains; judgment content assumes recall+depth+fluency beneath it; ownership = scaffold+capture; communication = cross-cutting (not a frame).**

| Surface | Primary frame | Secondary | Note |
|---|---|---|---|
| Gradient (MLE Path, Foundations Path, Ground-Up) | **Recall+Depth** | Judgment (production tells) | The depth engine. The "why underneath." |
| Foundations Simplify / Glossary | **Recall+Depth** | — | Recall scaffolding. |
| Cheatsheet | **Recall+Depth** | — | Recall-heavy (flashcards/formulas). |
| Interview Q&A (128+) | **Recall+Depth** | Judgment | Curated knowledge w/ model answers. |
| Landscape / Resources | **Recall+Depth** | — | Map/links. |
| Math Foundations (Pyodide) | **Recall+Depth** | Fluency | Concepts *and* you run the code. |
| **ML Coding (Pyodide)** | **Fluency** | — | The one true write-from-scratch coding bank. ≈13–15 problems. |
| dbt (SQL transforms) | Fluency | Judgment | SQL execution, but framed as scenarios. |
| Spark Lab (PySpark) | Fluency | Judgment | Optimization coding + decisions. |
| Trainer (378 MCQ) | **Recall+Depth** | — | Spaced-repetition recall drill. |
| Code Bugs (26) | **Judgment** | Fluency | Spot-the-flaw = diagnosis, not authoring. |
| Project Lab / Loan Default / Fraud Detection | **Ownership (scaffold)** | Fluency, Judgment | Guided end-to-end builds — the only ownership scaffold. |
| Defense Plan | **Ownership (capture-ish)** | Judgment, Comms | Project-defense + study-plan; ownership framing. |
| Feature Eng / Model Eval / System Design / Classical ML | **Judgment** | Recall+Depth | Scenario "where it breaks" tabs. |
| Causal / Time Series / Monitoring / Deployment / CI-CD / DL×3 / Data Modeling / Airflow | **Judgment** | Recall+Depth | Production-decision scenarios. |
| Case Studies | **Judgment** | Recall+Depth | Worked timeline+diagnosis+fix. |
| Spot the Flaw (12) | **Judgment** | — | Pure diagnosis. |
| Incident Room (3) | **Judgment** | Fluency | Cross-domain diagnosis. |
| Staff Layer (30) | **Judgment** (apex) | Comms | IC3→IC5→Staff. |
| Combinator (timed exam) | **Assessment** (mixed) | all | Tests all frames under pressure — not a teaching surface. |
| Verbal Practice | **Communication** (cross-cutting) | — | The layer over all frames, productised. |
| Mock Interview (JD→prompt) | tool/harness | Judgment | Generates a practice environment. |
| Home / Plans / Profile / Ask | meta / navigation | — | Not a frame. |

---

## 3. Coverage table — per frame

| Frame | Strength | What exists | Standout pieces |
|---|---|---|---|
| **1 · Recall + Depth** | **DEEP** (strongest floor in the BreakLabs system) | Gradient ~140+ essays, MLE Path (57), Foundations Path (34), Ground-Up (20), 132 Simplify versions, glossary, 378-MCQ Trainer, Cheatsheet, 128+ Q&A | The **Foundations Path** (first-principles ladder w/ production tells) + Gradient. World-class. |
| **2 · Fluency** | **THIN** | **ML Coding ≈13–15 problems** (ML-specific only), Math Foundations Pyodide cells, Spark/dbt scenario coding | ML Coding's 4-type framing (implement/debug/optimise/design) is good — but tiny, and *ML-only*. |
| **3 · Ownership (scaffold)** | **THIN / NARROW** | 3 guided Pyodide notebooks (Telco churn, Loan default, Fraud) + Defense Plan | Fraud Detection notebook (1:200 imbalance, precision@K, ops capacity) is excellent — but it's 1 of only 3, all tabular. Capture lives in Career OS, not here (correct per model). |
| **4 · Judgment** | **DEEP → OVER-INDEXED** | ~20 scenario tabs + Spot the Flaw + Incident Room + Staff Layer (30) + Case Studies + Code Bugs (26); the 5D framework underneath | Staff Layer (IC3→IC5→Staff) + Incident Room (cross-domain) — the apex content the rest of the market lacks. |
| _Communication (cross-cutting)_ | present, single-surface | Verbal Practice; Staff Layer's "say it" framing | Verbal Practice is the only dedicated comms surface — thin for a "half the job" standard. |

**The shape:** MSL is an **hourglass** — a very deep recall+depth floor (Gradient) and a very deep judgment apex (scenarios/Staff Layer), pinched hard in the middle at **fluency** and **ownership**. By count, judgment surfaces dominate the Practice + Interview zones (the MSL lean the prompt predicted — heavy on the diagnose/spot-the-break kind). Recall+depth is carried almost entirely by one engine (Gradient).

---

## 4. Gap report — what breaks for a user climbing the ladder

The ladder is an **elimination sequence**: recall+depth → fluency → ownership → judgment. A user can only reach a frame if the one before it holds. MSL's thin middle is therefore the most damaging place to be thin.

1. **FLUENCY is the critical gap (the pinch that breaks the ladder).** A user finishes the Foundations Path with deep recall, walks into a real loop, and the *first* live round is usually "code this" — write the SQL, write the Python, implement the function. MSL offers ≈13–15 ML-specific Python problems and **no general Python/DSA bank and no consolidated SQL problem bank** (SQL exists only as 26 bug-hunt snippets + dbt scenarios — *reading* SQL, not *writing* it from a blank editor). So MSL trains the floor and the apex but **skips the rung between them**. The judgment content silently assumes a fluency the lab never built — exactly the failure the model warns about ("if you can't code the basics, you never reach the round where judgment is tested"). _This is the gap the proposed Python-DSA + SQL build fills; the audit independently confirms its priority._
2. **OWNERSHIP scaffold is narrow.** Three tabular Pyodide notebooks is a real start, but ownership is the credibility frame and 3 guided builds (all tabular classification/risk) under-cover it — no NLP/recsys/CV/streaming project scaffold, no "bring your own project" defense loop beyond Defense Plan. The lab leans on Career OS for capture (correct), but its *scaffold* half is thin.
3. **JUDGMENT is over-indexed — not a gap, but a rebalancing signal.** ~20 scenario tabs plus four dedicated judgment engines is more judgment surface than a user with thin fluency can actually *use*. Over-supplying the apex while the middle is pinched means much of this content is gated behind fluency the user doesn't have yet. Freeze net-new judgment until fluency catches up (consistent with the 5D audit's "stop adding #3").
4. **RECALL+DEPTH is single-engine concentration risk.** It's deep, but ~all of it is Gradient. Fine for coverage; worth noting that fluency/ownership have nothing of Gradient's density to point *down* to.
5. **COMMUNICATION is one surface.** Verbal Practice alone carries the cross-cutting layer; for a brand that says "presentation is half the job," that's light — but it's a layer concern, not a ladder rung, so lower priority than fluency.

**One-line verdict:** _MSL has built the floor and the ceiling and under-built the staircase. The thin rung is **fluency**, and it's load-bearing._

---

## 5. Proposed restructure (PROPOSE-ONLY — not built)

Reorganize the top-level nav so every surface declares its frame. The four frames become the **primary spine**; the existing domain groupings (ML Eng, Data Eng, DL, MLOps…) become *filters within* a frame, not top-level peers. Communication is a ribbon across all four; assessment (Combinator) and orientation (Home) sit outside the ladder.

**Proposed top-level IA:**

```
MSL
├─ ① KNOW   (Recall + Depth)      ← the floor
│    Gradient · Foundations Path · Ground-Up · Simplify · Glossary
│    Cheatsheet · Q&A Bank · Landscape · Resources
│    [filter by domain: ML / DE / DL / Causal-TS / MLOps]
│
├─ ② DO     (Fluency)             ← the thin rung — grows here
│    ML Coding · [NEW: Python & DSA bank] · [NEW: SQL problem bank]
│    Math-Foundations Pyodide · Spark coding · dbt SQL
│    Code Bugs* (read-and-fix → fluency-adjacent)
│
├─ ③ BUILD  (Ownership — scaffold)
│    Project Lab (Telco) · Loan Default · Fraud Detection
│    Defense Plan · [→ hands off to Career OS for capture]
│
├─ ④ JUDGE  (Judgment — apex; 5D lives here)
│    Feature Eng · Model Eval · System Design · Classical ML
│    Causal · Time Series · Monitoring · Deployment · CI-CD · DL×3 · Data Modeling
│    Spot the Flaw · Incident Room · Case Studies · Staff Layer
│    [organized by the 5 dimensions underneath]
│
├─ ⊕ SAY    (Communication — ribbon over all four)
│    Verbal Practice · "explain it" prompts surfaced inside every frame
│
└─ ⊗ ASSESS / TODAY (outside the ladder)
     Combinator (tests all four) · Mock Interview · Home · Profile · Plans · Ask
```

**Where each current piece lands:** mapping is in §2's tagging column — primary frame = its home, secondary = cross-link. The big moves: the scattered Practice "domain" tabs collapse **into JUDGE** (they're judgment scenarios), the Pyodide notebooks consolidate **into BUILD**, and **DO is mostly empty today** — it's where the Python-DSA + SQL banks slot in.

**Content that doesn't fit / cut-or-reframe candidates:**
- **Combinator, Mock Interview** — not a frame; reframe as a cross-frame *Assessment* surface (don't force into JUDGE).
- **Code Bugs** — sits on the DO/JUDGE seam; it's read-and-diagnose (judgment) more than author-from-scratch (fluency). Keep, but tag honestly; don't let it stand in for a real fluency bank.
- **Plans / Profile / Home / Ask** — meta; keep outside the ladder.
- **Landscape** — recall-adjacent map; low usage signal worth checking before it earns top-level space.
- **Defense Plan** does double duty (study-planner + project-defense). Split conceptually: the planner is orientation; the defense loop is BUILD/ownership.

This is an **IA reframe of existing content**, not new content (except the two NEW fluency banks already flagged) — exactly the "mostly information-architecture overhaul" the model describes.

---

## 6. Build-order note (per DEC-15: A-then-B)

The model mandates covering **recall+depth + fluency first**, then layering judgment. MSL's actual state inverts the back half — judgment is over-built, fluency is under-built — so the corrective order is:

1. **First — close FLUENCY (the load-bearing gap).** Build the Python + DSA bank and the SQL problem bank into the new **DO** frame. This is the highest-leverage move in the lab: it unlocks the judgment content that's currently gated behind missing fluency. (Independently requested; this audit confirms it as priority #1.) SQL especially must hit a **variety standard** — benchmark its type-coverage before claiming breadth.
2. **Second — widen OWNERSHIP scaffold.** Add 1–2 non-tabular guided ProjectLabs (e.g. an NLP or recsys end-to-end), and tighten the Defense → Career OS capture handoff.
3. **Then — rebalance, don't expand, JUDGMENT.** Freeze net-new judgment scenarios; reorganize the existing ~20 tabs under the 5 dimensions (the 5D framework as JUDGE's internal structure). Quality/IA pass, not volume.
4. **Throughout — treat COMMUNICATION as a ribbon.** Surface "now say it out loud / explain to a junior" prompts inside KNOW/DO/JUDGE rather than only in the standalone Verbal tab.
5. **Sequence vs. the freeze.** Per DEC-15 this whole overhaul is sequenced *after the distribution keystone + the SQL/PSL coverage build*. So: this audit now (done) → fluency-coverage build (DO) when the freeze lifts → IA reframe → judgment rebalance. Nothing here jumps the freeze; it sets the target so the build order is unambiguous when distribution proves out.

---

## Appendix — method & honesty notes
- Read-only: no tab/data/code modified. Counts are grepped from source (`title:`/`id:`/`question:` occurrences) and cross-checked against nav descriptions; where a nav label was stale (ML Coding nav says "3", data array holds ≈13–15) the source count is used and flagged.
- Frame tags are judgment calls against `HQ/COMPETENCE-MODEL.md`; each surface declares one primary per the model's "one primary, optional secondary" rule.
- "Over-indexed judgment" is consistent with the prior 5D content audit (`docs/CONTENT-AUDIT-5D.md`) and with the prompt's expectation that each lab is lopsided.
