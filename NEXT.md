# NEXT.md — Session Queue

Updated: 2026-06-05. Objective: Depth sprint — get Incident Room and ML Coding to 12 before first tester.

---

## ✅ DONE: Private-test readiness (P0) — v4.68

1. ~~Remove DAI2026 from public README~~ — done, committed
2. ~~Fix "Senior MLE in 4 weeks" guided path step 1~~ — changed to `classical` (free tab)
3. ~~Remove dead `ds` domain from PRACTICE_DOMAINS~~ — domain renamed `causal_ts`, DS tab removed
4. ~~Add first-session directive to Home~~ — amber callout, renders only when `totalAttempted === 0`

## ✅ DONE: MVP coherence (P1) — v4.69

1. ~~Skill-first nav restructure~~ — Features/Evaluation/Systems/Training/Data/Interview/Labs/Learn. Trainer moved to Labs.
2. ~~Code Bugs → Bug Hunt~~ — renamed in nav + README.
3. ~~Gating model decision~~ — tab-level AccessGate is the single model; isFree flags informational only. Logged in DECISIONS.md.
4. ~~README cleanup~~ — DS Fundamentals removed, Bug Hunt count corrected (20), Gradient posts updated (50).

---

## CURRENT SPRINT: Depth sprint (P1.5)

Do only after structure is cleaner. Content before breadth expansion.

1. **Incident Room → 12 scenarios** — currently 6. Practice minimum is 12 before a section can be called a feature. Add inc7–inc12 across cross-domain failure modes.

2. **ML Coding → 12 problems** — currently 7. Same minimum. Add mlc8–mlc12 targeting senior/staff difficulty.

3. **Three-tier pass: SpotTheFlawTab** — 12 scenarios, none have whatsTested/antiPattern/staffFraming yet.

4. **DLFineTuningTab + DLServingTab content audit** — neither was touched in the three-tier pass. Check scenario count and format consistency.

---

## DEFERRED (P2 — before public distribution, not now)

- Signed-out landing page (no sidebar, full-screen pitch)
- Per-section readiness badges (Developing/Proficient/Senior)
- Continue-your-path CTA on Home
- isFree scenario-level gating (only after one gating model is decided)
- Auth sprint (Supabase — see docs/PAL_ARCHITECTURE_REFERENCE.md)
- mlc8 feature pipeline health check
- SpotTheFlawTab three-tier pass

---

## Blockers

**Interview Experiences (v4.47 Item 3):** Awaiting Avinash signup for Formspree + Tally.so.

---

## Notes for next session

- All spine files fully updated after PM audit (2026-06-03)
- Do NOT start auth, new content domains, or new tabs before private-test readiness sprint is done
- README.md has DAI2026 on lines 7 and 67 — remove both
- Dead `ds` block in PRACTICE_DOMAINS is around App.jsx lines 156–162
- Guided path first step fix is in HomeTab.jsx GUIDED_PATHS constant
- BRAIN-TRANSFER.md + PENDING.md stubs still need `git rm` (open finding #030.6)
