# NEXT.md — Session Queue

Next 5 items for v4.64 sprint. Updated: 2026-06-03 (v4.63 complete)

---

## v4.64 — Next sprint

1. **Three-tier format pass on IncidentRoomTab** — inc1–inc6 steps have `finding` but no `whatsTested`, `antiPattern`, `staffFraming`. Add these to each step for format consistency with Combinator + Trainer.

2. **isFree per-case gating first pass** — tag first 2 scenarios per module across 5 highest-traffic tabs (FeatureEng, ModelEval, ClassicalML, InterviewPrep, Combinator). Update AccessGate to filter not block.

3. **Unblock Interview Experiences** (blocked on Avinash credentials)
   - Requires: Formspree account ID → `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx`
   - Requires: Tally.so form URL → `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx`

4. **HyperparamScenarios three-tier pass** — ClassicalMLTab HYPERPARAM_SCENARIOS (6 scenarios) have no whatsTested/antiPattern/staffFraming. Add to complete consistency across all MCQ tabs.

5. **MLOpsDeploy scenario 8** — Batch inference at scale: 500M users, Spark on EMR vs SageMaker Batch Transform vs Step Functions fan-out. Completes the SageMaker coverage gap.

---

## Blockers

**Interview Experiences (v4.47 Item 3):** Awaiting Avinash signup for Formspree + Tally.so.

---

## Notes for next session

- v4.63 committed. Push: `cd ~/Documents/GitHub/ml-systems-lab && git push`
- Brace balance: all 8 changed files delta 0
- Three-tier MCQ: 100/100 Combinator + 60/60 Trainer — fully covered
- Incident Room: 6 scenarios (inc1–inc6)
- ML Coding: 6 problems (mlc1–mlc6)
- Dead code removed: PracticeGrid, InterviewGrid, InterviewToolCard, TagFrequencyChart, ALL_PRACTICE_TABS, INTERVIEW_EXPERIENCES import
- BRAIN-TRANSFER.md + PENDING.md stubs still need `git rm` (open finding #030.6)
