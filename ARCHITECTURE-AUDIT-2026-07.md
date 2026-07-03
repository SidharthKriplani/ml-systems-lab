# MSL Architecture Audit — KNOW / DO / BUILD / JUDGE / PREP·ASSESS / Start Here
**Date:** 2026-07-02 · **Frame:** ground-up review as a senior/staff MLE·DS·AIE mentor
**Status:** investigative report — no code changed. Internal (do not push to public repo).

**Decisions locked (2026-07-02):** (1) Audience = **MLE + DS only** — *tighten*, do NOT build the AIE/LLM/RAG track. This voids the AIE recommendations in §3 (AIE DO home), §4 (RAG capstone), and §8.2; the non-tabular BUILD capstone should be **ranking/recsys**, not RAG. (2) Next step = report only; await direction before any rebuild.

---

## 0. How this was investigated
Read the real IA from `App.jsx` (`ALL_TABS`, `TAB_TO_ZONE`, `NAV_SECTIONS`), then content-depth audits of every JUDGE, DO, BUILD, PREP/ASSESS and front-door tab (item counts, formats, overlaps), plus 2026 role/interview research (MLE vs DS vs AIE; staff-loop structure). Counts below are from the actual component files, not the nav labels.

---

## 1. The core diagnosis (one root cause)

**MSL grew by domain-cloning, so the same domain appears 2–3 times across layers.** `deep_learning` exists as a KNOW room, *and* a JUDGE scenario tab, *and* is split again into fine-tune/serving tabs. `causal`, `eval`, `time_series`, `monitoring`, `feature-eng`, `system_design` each exist as both a KNOW room **and** a JUDGE scenario tab. The layer labels are supposed to mean **modes of engagement** (learn → write code → build a project → exercise judgment), but the nav is actually organized as *domain-within-mode*, which produces:

- a flat **14-item JUDGE → SCENARIOS** list that is ~1:1 with KNOW,
- the same reveal-scenario engine reimplemented in ~8 tabs (so "layer" is a UI grouping, not a content type),
- and no single place where a learner feels a **learn-it-then-drill-it** loop.

**The fix is not more tabs — it's making layer = cognitive mode, and populating every layer from ONE shared domain taxonomy (the KNOW taxonomy).** JUDGE should mirror KNOW's three groups, and each domain's drill should hang off its KNOW room, not float as a separate top-level tab.

The two genuinely *missing* things (Section 8) are a **behavioral/leadership layer** and an **AI-Engineer (LLM/RAG) track** — both are core to the 2026 senior/staff loop and MSL currently has neither.

---

## 2. KNOW — strong, minor taxonomy nits

17 foundation rooms (now all S-tier + recap) in 3 groups + Library. This is the best layer. Nits:

- **Group boundaries aren't quite MECE.** `bandits` and `graph_ml` sit under "Systems & Applied," but bandits is exploration *theory* and graph ML is *neural/representation*. `probabilistic_ml` under Theory is fine. Consider: Theory (math, classical, probabilistic, optimization, eval, unsupervised, causal, bandits), Representation & Neural (deep learning, self-supervised, graph, RL), Systems & Applied (data & features, feature-eng/prod, monitoring, system design, time series). Not urgent — cosmetic.
- **KNOW has no explicit hook to its JUDGE twin.** A learner finishing the `causal` room has no "now drill causal judgment →" pointer, even though `CausalInferenceTab` (41 scenarios) exists. Wiring this learn→drill edge is the highest-leverage cheap win and it dissolves half the "duplication" complaint by *reframing* the JUDGE tab as the KNOW room's practice mode.

**Verdict:** keep content; add the learn→drill pointer; optionally re-group. No rebuild.

---

## 3. DO — role-confused; the layer's axis is wrong

Current DO = `ML Coding` (15 live Pyodide problems) + `Spark Lab` (7 modules) + `dbt` (3 live + 3 "coming soon") + link-outs to PL (Python) and PAL (SQL).

- **The mix conflates two roles.** ML-implementation coding (custom loss, CV from scratch, permutation importance — genuinely MLE/DS) is grouped under the same verb as data-engineering *tooling* (Spark shuffle/skew, dbt materialization). Putting them under one "DO" implies an equivalence they don't have, and the **AI-Engineer audience gets nothing** (no serving/inference coding, no prompt/eval harness, no RAG build).
- **The real content-type axis cuts across your labels.** The honest distinction in the whole product is **live-code (MLCoding + the BUILD notebooks) vs decision-scenario (everything else)** — not DO vs JUDGE. Spark/dbt in DO use the *same* reveal-scenario engine as JUDGE scenarios; only MLCoding is format-distinct in DO.
- **dbt is half-built** (3 of 6 modules are "coming soon").

**Recommendation:** relabel DO into two honest sub-groups — **CODE** (ML Coding; surface the PL/SQL link-outs here) and **DATA ENGINEERING** (Spark, dbt, + move Airflow and Data Modeling here from JUDGE — see §5). Then decide whether DE belongs in an *MLE·DS·AIE* product at all, or should be demoted to a labeled "adjacent skills" shelf. Give AIE a real DO home (an LLM serving / eval-harness / RAG coding surface).

---

## 4. BUILD — deep but narrow, and one tab is misfiled

- Three real end-to-end notebooks: **Telco churn** (14 cells + 5 checkpoints), **Fraud** (14 + 3, incl. FastAPI/Docker/k8s/runbook), **Loan default** (9 + 3, fairness/ECOA). Substantial — *not* thin on depth.
- **But they're the same archetype three times:** tabular binary classification (churn/default/fraud), near-identical scaffolding (schema→EDA→split→train→eval→PSI/KS drift). No ranking/recsys, no time-series, no NLP/**LLM/RAG** build. That's the real "thinness" — narrow breadth, not shallow depth.
- **`Defense Plan` is misfiled.** It has zero build artifacts — it's a JD-paste → skill-gap → day-plan *planning tool*. It belongs in PREP & ASSESS. Its presence is what makes BUILD look like "4 items" when it's really 3 projects + 1 study planner.
- `Loan default` (9 cells) is the leanest — bring to Telco/Fraud parity.

**Recommendation:** move Defense Plan → PREP/ASSESS. Add one **non-tabular capstone** — highest-value is an **LLM eval-harness / RAG build** (serves AIE and de-duplicates the churn/default/fraud sameness). A ranking/recsys notebook is the second candidate.

---

## 5. JUDGE — the fragmentation is real; here's the MECE fix

~467 practice items across **19 tabs**, but the structure is the problem.

**SCENARIOS (14 tabs) — the counts:**
FeatureEng 24 · ModelEval 24 · ClassicalML 18 · Causal 41 · TimeSeries 32 · SystemDesign 33 · DeepLearning 35 · **DLFineTuning 8** · **DLServing 6** · Monitoring 14 · MLOpsDeploy 20 · MLOpsPipelines 20 · **Airflow 15** · **DataModeling 8**.

**Non-MECE / fragmentation findings:**
- **11 of 14 shadow a KNOW room by name.** Reframe them as each KNOW room's "drill" mode (see §2) instead of parallel top-level tabs.
- **The DL 3-way split is the worst offender.** DeepLearning (35) + DLFineTuning (8) + DLServing (6) all map to one KNOW room; the two children are thin and overlap each other (precision/GPU-mem) and SystemDesign (serving). **Collapse to one Deep Learning room with train/finetune/serve sub-modules** (the tabs already use internal sub-modules).
- **MLOps is split for no reason.** Deploy (20) + Pipelines (20) both = "promote/rollback/gate a model," share format and registry/rollback overlap. **Merge into one MLOps room.**
- **Airflow (15) + Data Modeling (8) are data-engineering tools stranded in JUDGE.** They have no KNOW partner and are decision *tools*, not adversarial reveals. **Move to DO's Data-Engineering group** next to Spark/dbt.

**ADVERSARIAL (5 tabs):** SpotTheFlaw 27 · IncidentRoom 12 · CodeBugs 26 · CaseStudies 5 · StaffLayer 30.
- **3 are genuinely distinct formats worth protecting:** CodeBugs (live-code bug-hunt), SpotTheFlaw (find-the-error inversion), StaffLayer (IC3→IC5→Staff leveling lens).
- **2 are redundant:** IncidentRoom (12) duplicates Monitoring's Incidents module *and* SystemDesign's own incident module (same staffFraming/steps engine in all three); CaseStudies (5) is too thin to stand alone and overlaps IncidentRoom's multi-step format. **Consolidate incident/case content into one "Incident & Cases" surface; grow it or merge into StaffLayer.**

**Target JUDGE:** two axes. (a) **Domain drills** = one per KNOW domain, grouped exactly like KNOW's 3 groups, reached from the KNOW room (learn→drill). (b) **Adversarial formats** = the 3 distinct formats (CodeBugs, SpotTheFlaw, StaffLayer) + one consolidated Incident/Cases. That turns a flat 19-item list into ~3 grouped domain shelves + 4 format tools.

---

## 6. PREP & ASSESS — heavy, structural redundancy

- **Trainer is a strict subset of Combinator.** Both import the same `TRAINER_QUESTIONS` (120 MCQs); Combinator = those 120 + 99 exam-only + 10 short-answer + a timer. → **Fold Trainer into Combinator as an "Untimed practice" mode.**
- **Interview Q&A (128) and Verbatim (65) are the same question space, read vs spoken.** → **Merge Verbatim into Interview as a "practice spoken" toggle** per card.
- **Mock Interview is the one genuinely distinct surface** (a JD→LLM-interviewer-prompt generator, no item bank). Keep it — make it the **capstone the others funnel into.**
- **Two MCQ banks can drift:** Interview's inline 128 vs `questionBank.js`. → make `questionBank.js` the single source of truth.
- **Take-Home (15 open-ended)** is fine and distinct.
- **Add Defense Plan here** (from BUILD).

---

## 7. START HERE + the front-door problem

- **`StartHereTab` is a pure stub** — 4 hardcoded placeholder cards and a literal "Content coming soon." No state, no routing, unused `onNavigate`. It isn't wired into `NAV_SECTIONS` at all.
- **The front-door role is split across three tabs with no owner:** Home already does onboarding (level/urgency → `recommendNext()`), Progress owns the streak/heatmap, and Start Here claims onboarding but does nothing. Home duplicates both.
- **What Start Here must become:** the real entry router. Capture **goal (MLE/DS/AIE), level (junior/senior/staff), timeline-to-interview**, then route into KNOW/DO/BUILD/JUDGE using the machinery that already exists (`readOnboarding`, `recommendNext`, `foundationsPath` gap state — currently feeding Home and Mock Interview but never Start Here). Then **demote Home to a returning-user dashboard** and give **streak a single owner (Progress)**.

---

## 8. The missing pillars (vs 2026 senior/staff reality)

Research on the 2026 loop (Meta MLE: coding 45m + AI-assisted coding 60m + **behavioral 45m** + ML design; "design a RAG system" now a *baseline* opener; staff = 7+ rounds with a behavioral story bank + present-a-proud-project):

1. **No behavioral / leadership layer.** Staff loops always include behavioral, and MSL has nothing — no story-bank builder, no leadership-scenario drills, no "present your project" rehearsal. This is a clean, high-value addition (and Defense Plan / Mock Interview are natural neighbors).
2. **AI-Engineer track is nearly absent.** KNOW touches fine-tuning/self-supervised, but there is **no RAG, no LLM eval/guardrails, no prompt/agent, no vector-DB** content in DO/BUILD/JUDGE — despite RAG being the single most common 2026 opener. If MSL wants the AIE audience (highest-paid, fastest-growing), this is the biggest content gap in the product.

**Strategic call for you:** stay a focused **MLE/DS** product, or expand to **AIE**. Everything in §3–§5 is easier if you decide this first.

---

## 9. Proposed target architecture (one MECE map)

```
START HERE   → goal × level × timeline → routes everywhere (real front door)

KNOW         Theory · Representation&Neural · Systems&Applied   (17 rooms + Library)
             └ each room ends with → "Drill this in JUDGE →"

DO (CODE)        ML Coding (live) · [PL Python ↗] · [PAL SQL ↗] · (AIE: LLM/eval coding)
DO (DATA ENG)    Spark · dbt · Airflow · Data Modeling         (moved out of JUDGE)

BUILD        Telco · Loan · Fraud · + one non-tabular capstone (RAG/LLM or ranking)

JUDGE (DRILLS)      grouped like KNOW; DL 3→1, MLOps 2→1; reached from KNOW rooms
JUDGE (ADVERSARIAL) CodeBugs · SpotTheFlaw · StaffLayer · Incident&Cases (merged)

PREP & ASSESS   Q&A(+spoken) · Combinator(±timer, absorbs Trainer) · Mock(capstone)
                · Take-Home · Defense Plan (moved from BUILD) · [NEW] Behavioral

EXTRAS       Landscape · Leaderboard · Progress(owns streak) · My Tracks
```

**Net tab-count change:** JUDGE 19 → ~10 (via DL 3→1, MLOps 2→1, Airflow+Modeling→DO, Incident/Cases merge); PREP 6 → ~5 (Trainer→Combinator, Verbatim→Q&A) + Behavioral; BUILD stays 3 +1 capstone, −Defense. Fewer tabs, clearer modes, no lost content.

---

## 10. Open decisions for you (before any building)
1. **Audience:** MLE/DS only, or add the AIE (LLM/RAG) track? (Drives §3, §4, §8.)
2. **JUDGE reframe:** make domain-drills reachable *from* KNOW rooms (learn→drill), or keep them as a standalone grouped shelf?
3. **DE scope:** keep Spark/dbt/Airflow/Modeling as a first-class DO group, or demote to an "adjacent skills" shelf?
4. **Behavioral layer:** in scope now, or later?
5. **Sequencing vs the content freeze:** this is a structural/IA rebuild — do it behind the freeze, or ship distribution first?

---

### Sources (2026 role/interview research)
- [Meta MLE Interview Guide — Exponent](https://www.tryexponent.com/guides/meta-machine-learning-engineer-interview)
- [Amazon MLE Interview Guide — Exponent](https://www.tryexponent.com/guides/amazon-machine-learning-engineer-interview)
- [AI Engineer vs ML Engineer vs Data Scientist (2026) — Foundrole](https://www.foundrole.com/blog/ai-engineer-vs-ml-engineer-vs-data-scientist-which-career-path-pays-more)
- [DS vs MLE vs AIE 2026 — Let's Data Science](https://letsdatascience.com/blog/data-scientist-vs-ml-engineer-vs-ai-engineer-in-2026)
- [Every AI Engineer Interview Question 2026 — Medium](https://adilshamim8.medium.com/every-ai-engineer-interview-question-you-need-to-know-in-2026-from-100-real-interviews-b5b7ae4b961a)
- [ML System Design Interview — IGotAnOffer](https://igotanoffer.com/en/advice/machine-learning-system-design-interview)
