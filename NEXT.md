# NEXT.md — Session Queue

Next 5 items for v4.59 sprint. Updated: 2026-06-02 (end of v4.58 batch)

---

## v4.59 — Next sprint

1. **"What's being tested" + anti-pattern pass — InterviewPrepTab first**
   - Add `whatsTested` field to each question object → render as `.msl-hint` before reveal button
   - Add `antiPattern` field → render as rose-bordered callout inside reveal panel
   - InterviewPrepTab (128 questions) is the only tab this sprint — do one tab right, not 4 tabs rushed
   - Format decision: inline at bottom of `.msl-reveal-panel`, no new click required
   - Source: Quantiphi defense pack analysis, 2026-06-02

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

- All v4.58 changes committed and live on Vercel
- Brace balance: all files at 0
- No open build safety issues — all 4 recurring risks documented in AUDITS.md
- Pre-commit sweep before any future commit: see AUDITS.md "Recurring Build Safety risk" section
- Light mode fully functional — theme toggle in topbar, persists via msl_theme
- MD spine consolidated: docs/ folder added (ROLLOUT.md + TALLY_FORM_SPEC.md archived there)
