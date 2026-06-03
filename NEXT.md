# NEXT.md — Session Queue

Next 5 items for v4.67 sprint. Updated: 2026-06-03 (v4.66 complete — Sprint A done)

---

## v4.67 — Sprint B (Progress/Profile + Guided Paths)

1. **HomeTab Progress/Profile page overhaul** — Replace thin HomeTab with proper progress dashboard: total completed count, per-section breakdown with bars, "Strongest section" / "Not started yet" callouts, streak counter, bookmarks panel, export/import. No auth required.

2. **Guided Paths** — 3 named paths hardcoded in HomeTab, localStorage-tracked: "Senior MLE in 4 weeks" (Defense → InterviewPrep → Combinator → IncidentRoom → MLCoding), "Data Eng Focus" (Spark → Airflow → dbt → DataModeling → MLCoding), "Quick Calibration" (ClassicalML → Trainer → Combinator). Shows X/N completion.

3. **Unblock Interview Experiences** (blocked on Avinash credentials — Formspree ID + Tally URL)

4. **isFree per-case gating** — Tag first 2 scenarios per module as free, show FREE badge inline on locked scenarios, update AccessGate to filter not block.

5. **Sprint C kickoff** — Three-tier audit: SpotTheFlawTab (12 scenarios), DLFineTuningTab, DLServingTab.

---

## Blockers

**Interview Experiences (v4.47 Item 3):** Awaiting Avinash signup for Formspree + Tally.so.

---

## Notes for next session

- v4.66 committed. Push: `cd ~/Documents/GitHub/ml-systems-lab && git push`
- Brace balance: all 5 changed tab files delta 0
- Sprint A complete: contrast fix (all 35+ tabs inherit), card metadata standard (5 tabs), "what to do next" (IncidentRoom + MLCoding)
- BRAIN-TRANSFER.md + PENDING.md stubs still need `git rm` (open finding #030.6)
