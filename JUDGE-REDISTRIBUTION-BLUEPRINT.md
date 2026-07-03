# JUDGE Reorganization Blueprint — v2 (corrected principle)
**Date:** 2026-07-02 · **Supersedes v1.** Internal (do not push to public repo).
Based on an item-level content audit of all 14 JUDGE tabs (~450 items).

---

## 0. The corrected principle

The four frames are **not** topic buckets — they are the **four things an interview assesses**:

```
KNOW   = recall + depth        concepts & fundamentals   ("do you understand it")
DO     = fluency               code                      ("can you write it")
BUILD  = ownership / ship it   end-to-end projects        ("can you deliver it")
JUDGE  = judgment              cases, hypotheticals, incidents, design  ("what would you do")
PREP   = rehearse the interview  mock / timed / verbal / JD-gap plan  (spans all four)
```

**This axis is the product's spine. Keep it.** KNOW and JUDGE share *subjects* but test *different muscles* (recall ≠ judgment), so they must NOT merge — that's the exact distinction the product exists to train.

**The rule:** top level = the four assessment modes (+ Start Here, + PREP). **Inside each mode, organize by subject.**

- KNOW is already subject-organized (17 rooms).
- JUDGE must *become* subject-organized — today it's organized by **format** (spot-the-flaw / bug-hunt / incident / staff-lens), and that format-cut is the fragmentation.

## 0.1 What changed from v1

v1 said "dissolve JUDGE into subjects." That was an over-reach: it conflated *topical* redundancy (KNOW and JUDGE cover the same subjects) with *functional* redundancy (they don't — recall vs judgment). **JUDGE stays as a frame.** The content-redistribution findings from the audit are still correct — they just land **inside JUDGE, reorganized by subject**, not inside KNOW.

---

## 1. Target: what JUDGE becomes

JUDGE stops being 14 format tabs. It becomes:

1. **Judgment drills, organized by subject** — pick a subject, get its judgment scenarios. Each subject's drill set is assembled from: its old scenario tab + the **flaws** for that subject (from Spot-the-Flaw) + hard cases, each carrying a staff-level framing ladder.
2. **Incident Room** — the one cross-subject capstone (multi-domain "what do you check first"), absorbing Case Studies + the incident modules currently buried inside System Design and Monitoring.

Everything else **exits JUDGE** to the mode it actually belongs to:
- **Bug Hunt → DO.** Reading code to find a planted bug is a *fluency* skill, not judgment. Its items go to DO, by subject (Spark→data-eng, SQL/Python→code); the few "bugs" that are really methodology flaws fold into the subject's JUDGE flaws or get cut as duplicates.
- **Teaching interactives / config toys → KNOW.** Drift dashboards, PSI lab, KS test, two-tower explorer, DAG explorer, decision-boundary viz are *learn-mode* aids. Most **duplicate KNOW interactives we already built → cut**; the few unique ones move to the matching KNOW room.
- **Staff Lens → a field, not a tab.** The `{ic3, ic5, staff}` ladder becomes a `levels` property on hard JUDGE items (it's a superset of the existing `staffFraming` string). Delete the tab.

---

## 2. JUDGE drill sources, by subject

What each subject's judgment-drill set is assembled from (scenario-tab modules + Spot-the-Flaw items). Bug Hunt and interactives are excluded here (they exit — see §1).

| Subject (JUDGE drills) | Assembled from |
|---|---|
| **eval** | ModelEval: Threshold Tuner (6), Ranking Metrics (6), Calibration (trim 14→~4) · Spot-the-Flaw eval set (11) |
| **data** | FeatureEng: Leakage Zoo (8), Window gotchas (6), Skew Sim (4), Interaction (2) · Spot-the-Flaw data (4) · MLOps Schema Cascade (3) |
| **classical_ml** | ClassicalML: Model Failure Zoo (8), Ensemble Lab (7), Naive Bayes (3→absorb) · Spot-the-Flaw stf20 |
| **optimization** | ClassicalML Hyperparameter Priority (8) · DL Optimizer Comparison (6) · DL LR Strategy |
| **causal** | Causal tab (Causal-vs-Predictive 8, Uplift 6, Identification 6, DAG trio→consolidate, Experiment Failures 3) · Spot-the-Flaw stf2/stf15 |
| **time_series** | TimeSeries (Forecast Zoo 8, Stationarity 6, Anomaly Tiers 6, Model Selector 6, TS Feature Eng 6) · Spot-the-Flaw stf14/stf23 |
| **monitoring** | Monitoring (Coverage 5, Alerting 3) · ModelEval Metric Pitfalls (8) · Spot-the-Flaw stf7/9/24/26/27 |
| **deep_learning** | DeepLearning (Training Failures 8, Backprop 8, Regularization 6, Transformer 7, Arch 3, Freeze/LoRA 8+PEFT, Quant+Memory, Serving 6) |
| **system_design** | SystemDesign (Design Review 5, Two-Tower merged, Do-We-Need-ML 3, Retrieval 6, Serving Tradeoffs) · DL Pipeline Diagram |
| **production** | MLOps (Deployment 8, Champion-Challenger, Rollback 8, CI/CD 5, Infra 5, Registry ×2→merge) · SysDesign DS Ownership Chain (17), Incident Scenarios (6) |

Subjects with no JUDGE drills (math_stats, probabilistic_ml, unsupervised, self_supervised, rl, graph_ml, bandits) are learn-only in KNOW — honest and fine.

---

## 3. Incident Room (JUDGE's cross-subject capstone)

Dedupe 12 → ~8–9 (fold inc7→inc6 "stale data", inc9→inc2 "cold-start", inc11→inc4 "leakage"), **absorb Case Studies' 5** (Netflix cold-start, Uber seasonality, Airbnb fairness, Spotify Goodhart, DoorDash concept-drift — all complementary), and **absorb the 3 System-Design incidents + Monitoring's unique symptoms** (P99 tail latency, volume crash). Delete Case Studies + the two embedded incident modules.

---

## 4. What we don't need — the cut list

- **Bias-Variance viz** (ClassicalML) — duplicates the KNOW BiasVarianceViz.
- **Metric Selector** (ModelEval) — fake-math slider re-teaching AUC/PR concept.
- **8 of 14 Calibration Clinic items** — near-clones; keep ~4.
- **Feature Store Designer** toy — absorb into the Architecture Diagram.
- **Spot-the-Flaw stf18** (dup of stf5); **one of stf6/stf14** (identical KFold-TS).
- **Code Bugs F3, M1, M2** — duplicate Spot-the-Flaw items; **Q1** (AVG-ignores-NULL) borderline.
- **Staff Layer ml_need_1/2/3, ed_2, fe_3, incident_room** — internal duplicates.
- **JUDGE interactives that duplicate a KNOW interactive** — DAG explorer, PSI lab, drift dashboards, two-tower explorer, etc.
- **Fix in passing:** Code Bugs UI scores `/26` but the array has **23**.

**Net:** ~25–35 low-value/duplicate items removed of ~450; ~6 near-dup modules merged. No unique, valuable content lost — only filler, clones, and tab shells.

---

## 5. Cross-frame links (the learn→judge→do loop)

Because modes are separate frames, the pedagogical loop is a **link**, not a merge:
- KNOW room → "Now test your judgment → JUDGE (this subject)."
- JUDGE drill → "Now code it → DO (this subject)."
- BUILD project → pulls from all three.

This preserves recall-mode vs judgment-mode separation (the way the interview keeps them separate) while keeping the path obvious.

---

## 6. Build sequencing (staged, verifiable)

- **Stage 1 — reorganize JUDGE by subject (structural).** Replace the two JUDGE groups (9 scenario + 5 format tabs) with **subject-organized judgment drills + Incident Room**. Mechanically: a subject selector that renders the matching scenario content (the DL/MLOps merge playbook), Incident Room absorbs Case Studies, Staff Lens tab deleted, Bug Hunt removed from JUDGE (parked for the DO pass). No content rewritten.
- **Stage 2 — redistribute Spot-the-Flaw into subject drills; run the dedupe (§4).**
- **Stage 3 — staff-framing field** `{ic3, ic5, staff}` on hard items; retire Staff Layer content.
- **Stage 4 — cuts + consolidation + polish** (serving-infra ×4→1, registry ×2→1, `/26` fix, interactives→KNOW or cut).

Stage 1 alone makes JUDGE feel coherent and subject-true.

---

## 7. Next: the same deep read for DO, BUILD, PREP

Each frame gets the identical treatment — an item-level content audit, then "organize by subject inside the mode, de-dupe, cut filler":
- **DO** (fluency): ML coding + data-eng + the incoming Bug Hunt items — organized by subject/skill; kill duplicates.
- **BUILD** (ownership): the notebooks — are they too same-y (3× tabular binary classification)? what's the right project spread?
- **PREP** (rehearsal): Trainer/Combinator/Verbatim/Q&A/Mock — heavy redundancy (Trainer ⊂ Combinator; Verbalis is Q&A spoken); collapse the rehearsal surfaces.

The blueprint above is the JUDGE instance of a repeatable pattern: **keep the assessment mode, organize its insides by subject, cut the format-fragmentation.**
