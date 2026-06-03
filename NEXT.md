# NEXT.md — Session Queue

Next 5 items for v4.62 sprint. Updated: 2026-06-03 (v4.61 complete)

---

## v4.62 — Next sprint

1. **Simplify routing: replace activeZone + zoneTab with single activeTab** — removes PracticeGrid/InterviewGrid, cleans up App() state. v4.61 kept zone routing intact for safety; this finishes the job.

2. **Extend `staffFraming` to CombinatorTab + TrainerTab** — same field, same render pattern. ~90 questions combined. InterviewPrepTab is the proven template (128 q done).

2. **New scenarios from defense pack** — add to respective tabs:
   - Bagging vs Boosting + hyperparameter judgment → ClassicalMLTab
   - SageMaker train→register→endpoint flow → MLOpsDeployTab (currently has no SageMaker content)
   - Glue vs Lambda ETL decision → AirflowTab
   - P6 retry decorator, P9 ModelConfig/Pydantic, P10 Pandas CDC dedup → MLCodingTab (3 new problems)

3. **Incident Room + ML Coding — expand to 6 scenarios each** — 3 more incidents + 3 more coding problems.

4. **Unblock Interview Experiences** (blocked on Avinash credentials)
   - Requires: Formspree account ID → `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx`
   - Requires: Tally.so form URL → `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid

5. **isFree per-case gating first pass** — tag first 2 scenarios per module across 5 highest-traffic tabs. Update AccessGate to filter not block.

---

## Blockers

**Interview Experiences (v4.47 Item 3):** Awaiting Avinash signup for Formspree + Tally.so.

---

## Notes for next session

- v4.61 committed and live on Vercel after user runs commit command
- Brace balance: App.jsx delta 0, HomeTab.jsx delta 0
- Structural redesign shipped: collapsible sidebar, new 5-section nav, HomeTab rewritten
- Zone routing (activeZone + zoneTab) still in place — simplification deferred to v4.62
- PracticeGrid + InterviewGrid still present — will be removed when routing is simplified
- BRAIN-TRANSFER.md + PENDING.md stubs still need `git rm` (open finding #030.6)
