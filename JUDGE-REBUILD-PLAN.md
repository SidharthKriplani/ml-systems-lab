# JUDGE Rebuild Plan — scrapyard → armor
**Date:** 2026-07-02 · Internal. Based on a complete item-level read of all 14 JUDGE tabs (every module, every data shape, every defect). Supersedes the earlier JUDGE blueprints.

---

## 0. The one-sentence realization

JUDGE isn't 14 tabs — it's **one kind of content** (a judgment scenario: *here's a situation, what do you do, here's why*) that got authored in **3 different answer encodings**, wrapped in **5 different UI shells**, polluted with **~15 copies of the same rendering bug** and **a layer of teaching toys that aren't drills at all**. The armor is: **one content schema, one drill component, the toys moved to KNOW, the duplication cut.**

---

## 1. Complete inventory (proof of read)

Every module, classified. **DRILL** = real judgment question(s). **SIM** = teaching simulator (config builder / calculator / diagram / viz → belongs in KNOW, not JUDGE). **PROSE** = tiered text, no question.

| Tab | Module | # | Kind | Answer encoding | Verdict |
|---|---|---|---|---|---|
| **ModelEval** | Metric Selector | 4 | SIM (sliders+confusion matrix) | — | → KNOW · **has SVG bug** |
| | Shadow Mode Sim | 1 | SIM (14-day sim) | — | → KNOW · **has SVG bug** |
| | Calibration Clinic | 14 | DRILL (AccordionMCQ) | int | keep 6, **cut 8 `dsc-*` clones** |
| | Metric Pitfalls | 8 | DRILL (AccordionMCQ) | int | keep |
| | Threshold / Ranking | ~12 | DRILL (AccordionMCQ) | int | keep |
| **FeatureEng** | Skew Sim · Leakage Zoo · Online/Offline | 4·8·6 | DRILL (reveal-card, **unscored**) | none (`verdict`) | convert → add correct-option |
| | Feature-Store Designer · Window Builder · Arch Diagram | — | SIM | — | → KNOW |
| | Time-Travel Bug · Interaction Leakage | 3·3 | DRILL (AccordionMCQ) | int | keep |
| **ClassicalML** | Model Failure Zoo | 9 | SIM (exposition) | — | → KNOW |
| | Ensemble Lab · Hyperparam Priority | 7·8 | DRILL | **string** | convert · rich fields to preserve |
| | Naive Bayes | 3 | DRILL (AccordionMCQ) | int | keep |
| | Decision Boundary · Bias-Variance | — | SIM | — | → KNOW (Bias-Var **dup of a KNOW viz we built**) |
| **Causal** | Causal-vs-Predictive · Uplift · Identification · DAG · Backdoor · Obs-vs-Exp · Exp-Failures | ~41 | DRILL (bespoke reveal) | mixed | keep, normalize; consolidate 3 DAG modules → 1 |
| | DAG Explorer · Simpson's | — | SIM | — | → KNOW |
| **TimeSeries** | Forecast Zoo · Stationarity · Anomaly · Model Selector · TS Features | ~32 | DRILL (bespoke steppers) | int/string | keep, normalize |
| **SystemDesign** | ML Incident Room | 3 | DRILL (clues→diagnose) | **string diagnosis** | → merge into Incident capstone |
| | DS Ownership Chain | 17 | PROSE (tiers) | — | → KNOW / dissolve to level field |
| | Incident Scenarios | 6 | DRILL (self-assessed) | none | convert or → Incident capstone |
| | Design Review | 5 | DRILL (**tier-rubric**, no single right answer) | tiered | keep as its own "rubric" type |
| | Do-We-Need-ML · Retrieval Failures | 3·6 | DRILL (AccordionMCQ) | int | keep (`context` is array\|string) |
| | Two-Tower Explorer/Diagram · Serving Tradeoffs | — | SIM | — | → KNOW |
| **DeepLearning** | Training Failures · Backprop | 8·8 | DRILL (bespoke stepper, `symptoms[]`) | int | keep, normalize |
| | Optimizer · Regularization · Transformer · Arch Decisions | 6·6·6·3 | DRILL (AccordionMCQ) | int | keep |
| | LR Strategy · Serving Arch | 8·6 | DRILL (bespoke) | int / string | keep, normalize |
| | Attention Viz · Freeze/LoRA · PEFT · Quant · GPU-Memory · Pipeline Diagram | — | SIM | — | → KNOW |
| **Monitoring** | Coverage · Alerting | 5·3 | DRILL | int | keep |
| | Drift Dashboard · PSI · KS · Alert Tuner · Drift Attribution · Live Drift | — | SIM | — | → KNOW (several **dup KNOW interactives we built**) |
| **MLOps** | Deployment · Rollback · Registry · Champion-Challenger | 8·8·6·4 | DRILL | **string `correct` + `awsCallout`** | convert |
| | Model Registry · Schema Cascade | 3·3 | DRILL (AccordionMCQ) | int | keep |
| | CI/CD Gates · Infra | — | SIM | — | → KNOW / DO |
| **Incident Room** | 12 incidents | 12 | DRILL (**multi-step `steps[]`**) | string id | the cross-domain capstone |
| **Case Studies** | 5 cases | 5 | DRILL (**mixed mcq+open**, `data[]`, `modelAnswer`) | int/open | merge unique (uber, doordash) into Incident capstone |
| **Staff Layer** | 28 scenarios | 28 | PROSE (`ic3/ic5/staff`) | none | **dissolve into a per-item `levels` field** |
| **Code Bugs** | 26 bugs | 26 | DRILL (**`code` + object A–D**) | string key | → **DO** (it's fluency), normalize |

---

## 2. The defect that's live in production right now

**~15 stringified-`<svg>` sites.** A past bulk find/replace turned `<CheckMark/>`/`<CrossMark/>` JSX into raw `<svg>…</svg>` **inside string-literal ternaries**, so they render as visible code text (this is your `<svg…>Good choice` screenshot). Every "ternary returns a string" site broke; every "JSX `<span>` wrap" site is fine.

Exact map: ModelEval 182/228/230/244/284/346-349 · ClassicalML 468/780/943/1081 · SystemDesign 217/238/535/575/1697 · DeepLearning 146/241/327 · MLOpsDeploy 177/247/438/510/645/707 · MLOpsPipelines 106/311/663/723 · CodeBugs 925.

**Why it matters for the plan:** these live in the *bespoke* widgets and in **three near-duplicate copies of `AccordionMCQ`** (one each in ModelEval/ClassicalML/SystemDesign/DeepLearning/MLOpsPipelines — not byte-identical). Collapsing to **one** drill component **deletes this entire bug class by construction.** That's the single strongest argument for the rebuild.

Other real defects: `getDiff()` derives Easy/Med/Hard from array *position*, disconnected from each item's authored `tier` — the difficulty filter is fake. Hardcoded denominators (CaseStudies `/5`,`/4`; CodeBugs `/26` — currently correct but magic numbers). IncidentRoom hardcodes a 'senior' badge on every card. (The `/26` you may have suspected is actually right — the array holds exactly 26.)

---

## 3. Three encodings, five types, one schema

**Three answer encodings today** (this is the fragmentation, in data terms):
1. `answer` = **int index** (AccordionMCQ, TrainingFailures, LRStrategy…)
2. `correct`/`answer` = **string** (Ensemble, Hyperparam, Deploy, Rollback, Registry, Serving, IncidentRoom diagnosis)
3. `options` = **object A–D** + `correct` = **string key** (CodeBugs)

**Five genuine content types** (everything reduces to these):
- **mcq** — one situation, options, one right answer, why. (~80% of all content.)
- **code** — mcq + a `code` block. (CodeBugs → DO.)
- **multistep** — a chain of mcqs. (Incident Room.)
- **open** — free-text + `modelAnswer` + self-rating. (Case Studies' open questions.)
- **rubric** — every option valid at some level, no single right answer. (Design Review.)

Plus one orthogonal thing that is **not a type but a field**: **level framing** (`ic3/ic5/staff`) — that's Staff Layer, dissolved onto items.

---

## 4. The unified content schema (the armor's chassis)

One normalized item shape, a discriminated union on `type`. Authored as plain data, no UI baked in:

```
Drill {
  id
  subject        // eval | causal | deep_learning | production | ...  (drives filtering)
  type           // 'mcq' | 'code' | 'multistep' | 'open' | 'rubric'
  difficulty     // authored: junior | mid | senior | staff   (NOT positional)
  title
  context        // string | string[]   (telemetry / situation / data-available list)
  question
  hint?

  // mcq / code:
  options[]      // canonical: array of {label, note?}
  answer         // canonical: int index (all 3 encodings normalize to this)
  code?          // code type only

  // multistep:
  steps[]        // [{question, options[], answer, finding, whatsTested?, antiPattern?}]

  // open:
  modelAnswer?

  // rubric:
  optionTiers?   // [{text, level, feedback}]

  // shared pedagogy (surfaced in the reveal):
  diagnosis?  explanation?  fix?  lesson?  whatsTested?  antiPattern?  staffFraming?
  awsCallout?    // optional {service, desc}

  // dissolved Staff Layer:
  levels?        // {ic3, ic5, staff}
}
```

Everything currently in JUDGE maps into exactly one of these. Nothing is lost; the *encodings* converge, the *pedagogy* fields are preserved (they're richer than the old AccordionMCQ, which only showed `diagnosis`+`fix`).

---

## 5. The one Drill component

A single `<Drill item={…}/>` that renders any `type` consistently:
- **mcq/code** → context → (code block if present) → options → pick → reveal (diagnosis · explanation · fix · pedagogy callouts) · optional `levels` expander · optional `awsCallout`.
- **multistep** → the same, looped over `steps[]` with a progress rail.
- **open** → textarea + reveal `modelAnswer` + self-rate.
- **rubric** → options tagged by level, verdict = which level you're operating at.
- Icons are **real JSX** (`<CheckMark/>`), so the SVG-string bug cannot exist.
- Difficulty comes from the **authored** field; the filter is finally real.
- Score denominators derive from `items.length` — no magic numbers.

The surface is then just: **pick a subject → get its drills**, one consistent experience, plus the **Incident Room** capstone (multistep, cross-domain). Subject is a filter, not 14 hand-built tabs.

---

## 6. Where every piece goes

- **Stays in JUDGE, normalized into the schema:** all the mcq/code(minus code→DO)/multistep drills — ModelEval (minus sims), FeatureEng #7/#8 + converted #1/#4/#5, ClassicalML Ensemble/Hyperparam/NaiveBayes, Causal (all), TimeSeries (all), SystemDesign Do-We-Need/Retrieval/Design-Review/Incident-Scenarios, DL drills, Monitoring Coverage/Alerting, MLOps drills.
- **→ Incident Room capstone (multistep):** IncidentRoom's 12 (deduped to ~9), + SystemDesign's ML Incident Room (3), + Case Studies' 2 unique (uber, doordash), + Monitoring's incident triage. One cross-domain surface.
- **→ KNOW (teaching sims):** every SIM row above (Metric Selector, Shadow Sim, Feature-Store Designer/Window/Arch, Model Failure Zoo, Decision Boundary, Bias-Variance, Two-Tower Explorer/Diagram, Serving Tradeoffs, Attention/PEFT/Quant/GPU-mem/Pipeline diagrams, DAG Explorer, Simpson's, all the Monitoring labs). Several **duplicate KNOW interactives we already built** → cut on arrival.
- **→ DO (code/fluency):** Code Bugs (26), normalized to `code` type. Spark bugs → the DO data-eng shelf.
- **Dissolved to a field:** Staff Layer's `ic3/ic5/staff` → `levels` on the matching drills. DS Ownership Chain tiers likewise.

---

## 7. The cut list (what we don't need)

- **8 `dsc-*` Calibration clones** in ModelEval — auto-generated, "Use X for this case" filler; keep the 6 hand-written.
- **StaffLayer `s13/s14/s15` = `ml_need_1/2/3`** — exact triple-duplication; keep the richer `ml_need_*`.
- **IncidentRoom `inc4`≈`inc7`** (retrain-worse) and **`inc2`≈`inc9`** (cold-start) → merge.
- **CaseStudies netflix/airbnb/spotify** — conceptual dups of StaffLayer `s4/s6/s1` + IncidentRoom incidents; keep only **uber, doordash** (unique).
- **StaffLayer `incident_room`/`cross_team_drift`/`ed_2`/`fe_3`** — dups of IncidentRoom inc1/inc5/inc3 + CodeBugs F2.
- **Bias-Variance viz** and the **Monitoring drift/PSI/DAG labs** that duplicate KNOW interactives we built.
- Dead scaffold: StaffLayer `COMING_SOON=[]` grid; multiline `TabHeader` titles.

Net: **~25–35 filler/duplicate items removed** out of ~450, **~15 SVG defects fixed by construction**, **3 encodings → 1**, **5 AccordionMCQ copies → 1 component**. No unique, valuable content lost.

---

## 8. Sequencing (staged, verifiable — nothing executed yet)

1. **Fix the ~15 SVG-string defects** — isolated, ships immediately, un-breaks live reveals. (Can go before anything structural.)
2. **Define the schema + build the one `<Drill>` component** against 2 subjects (eval + causal) as the reference.
3. **Write a converter per encoding** (int / string / object-A–D → canonical) and normalize each tab's drill data into the schema.
4. **Route:** subject-filtered Drill surface + Incident Room capstone; move SIMs → KNOW, Code Bugs → DO, dissolve Staff Layer → `levels`.
5. **Cut list + dedupe.** Retire the old tabs.

Step 1 is a standalone bug-fix. Steps 2–5 are the rebuild, each parse-verified, each eyeballable on your Mac build before the next.

---

## 9. Net result
14 fragmented tabs, 5 UI shells, 3 encodings, 15 live bugs → **one schema, one Drill component, subject-filtered, plus one Incident Room capstone**, with teaching toys in KNOW and code in DO. That's the armor: the content you built, surfaced once, consistently, correctly.
