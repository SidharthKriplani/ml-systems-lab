# NEXT.md — Session Queue

Next 5 items for v4.66 sprint. Updated: 2026-06-03 (v4.65 complete)

---

## v4.66 — Next sprint

1. **isFree per-case gating first pass** — tag first 2 scenarios per module across 5 highest-traffic tabs (FeatureEng, ModelEval, ClassicalML, InterviewPrep, Combinator). Update AccessGate to filter not block.

2. **Unblock Interview Experiences** (blocked on Avinash credentials)
   - Requires: Formspree account ID → `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx`
   - Requires: Tally.so form URL → `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx`

3. **MLCodingTab mlc8 — Feature pipeline health check** — Python problem: assert no nulls above threshold, no zero-variance columns, no distribution shift vs reference snapshot (KS test). Senior difficulty.

4. **SpotTheFlawTab three-tier pass** — 12 scenarios, 5 flaw categories. Check current format and wire whatsTested/antiPattern/staffFraming if not present.

5. **DLFineTuningTab + DLServingTab content audit** — not touched in the three-tier pass. Check scenario count and whether three-tier is needed.

---

## Blockers

**Interview Experiences (v4.47 Item 3):** Awaiting Avinash signup for Formspree + Tally.so.

---

## Notes for next session

- v4.65 committed. Push: `cd ~/Documents/GitHub/ml-systems-lab && git push`
- Brace balance: all 3 changed files delta 0
- ENSEMBLE_SCENARIOS: 7 scenarios, three-tier wired + data complete
- MLCoding: 7 problems (mlc1–mlc7, added PySpark skew/salting)
- SHAP video: title corrected, video valid (3032t--_wsg, A Data Odyssey)
- BRAIN-TRANSFER.md + PENDING.md stubs still need `git rm` (open finding #030.6)
