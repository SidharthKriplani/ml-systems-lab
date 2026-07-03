# MSL Whole-App Restructure Blueprint
**Date:** 2026-07-02 · Internal (do not push to public repo).
Built from item-level content audits of all four frames (KNOW done previously; JUDGE, DO, BUILD, PREP audited here). Companion detail for JUDGE lives in `JUDGE-REDISTRIBUTION-BLUEPRINT.md`.

---

## 0. The principle — refined by the audits

The spine is the **four things an interview assesses** (+ PREP as rehearsal):

```
KNOW   recall + depth   · concepts & fundamentals
DO     fluency          · code
BUILD  ownership        · ship an end-to-end project
JUDGE  judgment         · cases, hypotheticals, incidents, design
PREP   rehearsal        · mock / timed / spoken / plan   (spans all four)
```

**Refinement the audits forced:** "organize the insides by subject" is right only for the *knowledge* modes. Each mode has its own **natural internal axis**, and the fix is the same in spirit everywhere — *use the mode's natural axis, kill format-fragmentation, de-dupe, cut filler*:

| Mode | Natural internal axis |
|---|---|
| KNOW | **subject** (17 rooms — done) |
| JUDGE | **subject** (judgment drills per subject) + Incident Room |
| DO | **skill-lane** (ML-coding / SQL / data-eng-adjacent) |
| BUILD | **archetype** (tabular / ranking / time-series / NLP) |
| PREP | **mechanism** (browse / exam / mock / plan) + behavioral |

Subject-true where it's knowledge; skill/archetype/mechanism-true where it's activity.

---

## 1. Target IA (the whole picture)

```
Start Here      front door (built)
KNOW            by subject: 17 rooms, each Learn (done)
DO              3 lanes: ML-Coding · SQL/data-fluency · [Data-Eng adjacent shelf]
BUILD           by archetype: Tabular · Ranking · Time-Series · (NLP)
JUDGE           by subject: judgment drills per subject + Incident Room
PREP            4 surfaces: Interview · Exam · Mock · Plan  +  Behavioral/STAR (new)
```

Cross-frame links: KNOW room → "drill judgment → JUDGE" → "code it → DO"; PREP Plan routes into all.

---

## 2. Per-frame plans

### KNOW — done. 17 subject rooms, S-tier (figures, interactives, recap, 3 check-Qs).

### JUDGE — see `JUDGE-REDISTRIBUTION-BLUEPRINT.md` (v2).
Net: 14 format tabs → subject-organized judgment drills + one Incident Room. Bug Hunt exits to DO; teaching interactives exit to KNOW (mostly cut as dups); Staff Lens → a `{ic3,ic5,staff}` field; Case Studies → Incident Room. ~25–35 filler/dup items cut.

### DO — **role-confused today; only 1 of 5 tabs is real fluency.**
- **MLCodingTab is the spine** — 15 live-Pyodide problems, clean Implement/Debug/Optimise/Design taxonomy, judgment checkpoint each. Keep whole.
- **The 4 DE tabs (Spark, dbt, Airflow, DataModeling) are not fluency** — they're MCQs + slider "config toys" where you never write code, and they're self-badged "DE domain / conceptual." For an **MLE/DS** audience most is out of core.
- **SQL & Python fluency are delegated externally** — SQL → PAL SQL Lab, Python/DSA → Programming Lab (both already link-outs in DO, per the D-15/D-16 delegation). So DO needs **no in-house SQL/Python lane**; that "gap" is closed by the sibling labs.
- **Target: ML-Coding + the external link-outs + one Data-Eng adjacent shelf.** (1) **ML-Coding** (the 15 live problems — the in-house spine; this is the ML-specific coding the externals don't cover). (2) **Python → PL ↗ / SQL → PAL ↗** (keep the link-outs). (3) **Data-Eng adjacent** — ONE demoted shelf, clearly marked, keeping only the cross-over-valuable modules: dbt **Schema Drift Clinic** + **SCD Selector** + a single consolidated **"Spark failure modes"** module (merge Spark's OOM/skew MCQs + incoming Spark bugs).
- **Cut:** the 6 config-toy calculators (Partition Tuner, Memory Pressure, Shuffle-Hell math, Late Data Handler, OLAP Showdown, Materialization Oracle), Airflow ops trivia (`glue_vs_lambda`), and Airflow generally (near-zero MLE/DS yield). `mlc15` (Feature-Store *Design*) is misfiled → move to JUDGE/BUILD.
- **Incoming Bug-Hunt items:** ML/DL debug bugs → ML-Coding's **Debug** lane (alongside mlc13/mlc14); Spark bugs → the Spark-failure module on the adjacent shelf; **pure-SQL bugs are dropped** (SQL is PAL's job).

### BUILD — **three notebooks, one archetype, run three times.**
- Churn / Loan / Fraud are all **tabular binary classification** on the same spine (schema→EDA→LR/RF/GBC bake-off→threshold→**identical PSI+KS+pred-drift trio**→FastAPI/Docker/K8s). The three drift checkpoints are near-verbatim clones; the deploy scaffold is triplicated.
- **Unique, worth keeping:** Churn = **calibration + leakage**; Loan = **fairness/ECOA + cost-threshold**; Fraud = **extreme imbalance + precision@K + deepest deploy**.
- **Target: organize by archetype, author the spine once.** Keep **Churn** (canonical tabular, owns calibration/leakage). Keep **Fraud** (imbalance exemplar). **Fold Loan → a "Responsible ML" checkpoint** on the shared spine rather than a full 3rd notebook. **Add the missing capstones:** a **Ranking/RecSys** build (candidate-gen→ranking, NDCG/recall@K, offline↔online) — the single biggest gap and core MLE work; and a **Time-Series Forecasting** build (walk-forward backtesting, temporal leakage, MASE/pinball). Optional: an **NLP/embedding** build for the LLM-era MLE.
- **Dedupe:** collapse the 3 drift checkpoints → 1 (make Fraud's about feedback-loop blindness, its real point); extract one shared **Deployment + Monitoring Scaffold** module; one shared **model-comparison** lesson. Trims ~15–20 redundant cells.
- Role (MLE vs DS) is a **lens** (which checkpoints to emphasize), not a top-level axis.

### PREP — **7 surfaces, heavy bank-drift, and no behavioral layer.**
- **5 distinct mechanisms, keep:** Interview (128-Q&A browse hub), Combinator (timed exam), MockInterview (JD→LLM-interviewer generator), DefenseDoc (JD→gap→day-plan planner), and Verbatim's **speech engine**.
- **Fold:** **Trainer ⊂ Combinator** (confirmed — same 120-MCQ bank) → Combinator "Untimed/Drill" mode, porting Trainer's weak-spot + spaced-rep panels. **Verbatim = Q&A-spoken** → a **"Speak" toggle** on the Interview bank (keep the Web-Speech/WPM engine, delete the duplicate 65-item list). **TakeHome** (15) → a "Written" companion to Interview's `design` mode (borderline; or keep standalone).
- **Structural debt:** only the MCQ layer has a single source of truth (`questionBank.js`). Interview's 128 Q&A, Verbatim's 65, TakeHome's 15, Combinator's 10 SA are **separate hardcoded banks that will drift.** Target: one `interviewBank` keyed by category + modality flags (mcq / discuss / speak / design).
- **Biggest gap in the whole app:** there is **no behavioral / STAR story-bank anywhere.** Behavioral is asserted as important (DefenseDoc flags it) but never scaffolded — Interview's `behavioral` mode is 8 MCQ judgment scenarios, not a place to draft/store/rehearse "tell me about a time" stories. For staff-level prep this must be built.
- **Target: 4 surfaces + behavioral** — Interview (hub, absorbs Verbatim speak + TakeHome written) · Exam (Combinator, absorbs Trainer) · Mock · Plan · **Behavioral/STAR (new)**.

---

## 3. New content to create (the gaps the audits exposed)
1. **BUILD:** a Ranking/RecSys capstone + a Time-Series forecasting capstone (replaces the 3rd redundant tabular notebook).
2. **PREP:** a Behavioral/STAR story-bank (draft → store → rehearse; the #1 PREP gap).
   (DO's SQL/Python fluency is NOT a gap — delegated to PAL SQL Lab + Programming Lab via existing link-outs.)

## 4. Whole-app cut list
- JUDGE: ~25–35 filler/dup items (see v2 blueprint), incl. Bias-Variance viz, Metric Selector, 8/14 calibration clones, Staff-Layer dupes, the `/26`-vs-23 bug.
- DO: 6 config-toy calculators, Airflow ops trivia + Airflow tab, OLAP Showdown; demote the rest of Spark/dbt/DataModeling to one adjacent shelf.
- BUILD: Loan as a full notebook (→ fairness checkpoint), 2 duplicate drift checkpoints, triplicated deploy scaffold + bake-off cells (~15–20 cells).
- PREP: Trainer tab (→ Combinator mode), Verbatim's duplicate 65-item list (keep engine), maybe TakeHome tab.

## 5. Scope decision applied — MLE + DS (not Data-Eng)
Data-engineering (Spark/dbt/Airflow/DataModeling) collapses from 4 first-class DO tabs to **one clearly-marked "adjacent skills" shelf** holding only the ML-crossover modules (schema-drift, SCD/point-in-time, one Spark-failure reference). Airflow ops + warehouse-format trivia are cut. This is the biggest surface reduction in DO.

## 6. Sequencing (staged program — parse/verify each, eyeball on Mac between)
1. **JUDGE Stage 1** — reorganize by subject + Incident Room (structural shell).
2. **DO** — 3 lanes; demote DE to the adjacent shelf; wire incoming bug-hunt SQL/Spark items; cut config toys.
3. **PREP** — fold Trainer→Exam, Verbatim→Interview speak; unify the bank; build the Behavioral/STAR layer.
4. **BUILD** — extract shared scaffold + dedupe; fold Loan→checkpoint; add Ranking + Time-Series capstones.
5. **JUDGE Stages 2–4** — redistribute flaws, staff-framing field, cuts/consolidation.
6. Content authoring for the 3 new gaps (ranking build, TS build, behavioral bank).

Structural moves (1–3 shells) are low-risk wrapping/nav work — same playbook as the DL/MLOps merges. New-content authoring (capstones, behavioral) is the larger, additive lift.

## 7. Open calls for you
- **DO's data-eng shelf:** keep the one adjacent shelf, or cut DE entirely for MLE/DS focus?
- **BUILD spread:** confirm Churn + Fraud + Ranking + Time-Series (+ optional NLP) as the four archetypes; Loan → fairness checkpoint.
- **PREP behavioral:** in scope to build now (it's net-new content), or after the structural consolidation?
- **TakeHome:** fold into Interview, or keep standalone?
