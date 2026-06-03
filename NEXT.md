# NEXT.md — Session Queue

Next 5 items for v4.62 sprint. Updated: 2026-06-03 (v4.61 complete)

---

## v4.63 — Next sprint

1. **Complete three-tier coverage on CombinatorTab + TrainerTab** — 2 Combinator questions (C9, C20) and 6 Trainer questions (T5, T9, T31, T32, T33, T36) still missing fields. Small targeted pass.

2. **Remove PracticeGrid + InterviewGrid dead code** — both components still exist in App.jsx but are no longer reachable. Safe to delete.

3. **New scenarios from defense pack** — Bagging/Boosting (ClassicalML), SageMaker flow (MLOpsDeploy), Glue vs Lambda (Airflow), P6/P9/P10 Python problems (MLCoding).

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

- v4.62 committed and live on Vercel after user runs commit command
- Brace balance: all 4 changed files delta 0
- Routing simplified: single activeTab state, zone concept removed
- Three-tier MCQ: 98/100 Combinator + 54/60 Trainer covered
- 8 questions missing three-tier fields — render is conditional, no breakage
- BRAIN-TRANSFER.md + PENDING.md stubs still need `git rm` (open finding #030.6)
