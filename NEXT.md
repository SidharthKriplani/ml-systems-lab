# NEXT.md — Session Queue

Next 5 items for v4.64 sprint. Updated: 2026-06-03 (v4.63 complete)

---

## v4.65 — Next sprint

1. **isFree per-case gating first pass** — tag first 2 scenarios per module across 5 highest-traffic tabs (FeatureEng, ModelEval, ClassicalML, InterviewPrep, Combinator). Update AccessGate to filter not block.

2. **Unblock Interview Experiences** (blocked on Avinash credentials)
   - Requires: Formspree account ID → `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx`
   - Requires: Tally.so form URL → `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx`

3. **ENSEMBLE_SCENARIOS three-tier pass** — ClassicalMLTab ENSEMBLE_SCENARIOS (7 scenarios) render via AccordionMCQ which uses `reasoning` + `whyNot` but not the amber/rose/violet callout format. Decide: add three-tier to AccordionMCQ render, or leave as-is since HyperparamPriority now has it.

4. **MLCodingTab — add mlc7 (Spark skew handling)** — write a PySpark scenario covering salting strategy for data skew. Fits the Spark Lab → ML Coding cross-domain gap.

5. **SHAP video replacement** — open finding: GradientTab SHAP post has no valid YouTube ID (cleared to `[]` in v4.39). Find and wire a valid StatQuest SHAP video ID.

---

## Blockers

**Interview Experiences (v4.47 Item 3):** Awaiting Avinash signup for Formspree + Tally.so.

---

## Notes for next session

- v4.64 committed. Push: `cd ~/Documents/GitHub/ml-systems-lab && git push`
- Brace balance: all 3 changed files delta 0
- IncidentRoom: 12 steps across 6 incidents — all have whatsTested/antiPattern/staffFraming
- ClassicalML: 8 HYPERPARAM_SCENARIOS — all have three-tier fields + render wired
- MLOpsDeploy: 8 DEPLOY_SCENARIOS (added batch inference at scale)
- BRAIN-TRANSFER.md + PENDING.md stubs still need `git rm` (open finding #030.6)
