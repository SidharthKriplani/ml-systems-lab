# NEXT.md — Session Queue

Updated: 2026-06-03. Objective: MVP coherence before distribution. PM audit complete.

---

## CURRENT SPRINT: Private-test readiness (P0)

All four items are S complexity. Do in one session before showing MSL to anyone.

1. **Remove DAI2026 from public README** — access code appears twice in README.md (lines 7 and 67). Replace with "Email for access." The gate is meaningless if the code is published.

2. **Fix "Senior MLE in 4 weeks" guided path** — step 1 is Defense Plan which immediately hits AccessGate for users without a code. Change step 1 to a free tab (e.g. ClassicalML or InterviewPrep Q&A). HomeTab.jsx GUIDED_PATHS.

3. **Remove dead `ds` domain from PRACTICE_DOMAINS** — App.jsx still references `id: 'ds'` (Data Science tab deleted in v4.61). Dead data in the domain config. Remove the entire `ds` domain block from PRACTICE_DOMAINS array.

4. **Add first-session directive to Home** — one visible block above entry paths on HomeTab: "New here? Start with the 10-min calibration" → link to ClassicalML or free Combinator questions. Without this, new users have no prescribed starting point.

---

## NEXT SPRINT: MVP coherence (P1)

Do after P0 is done and at least 2 testers have confirmed the product works.

1. **Skill-first nav restructure** — replace current FOUNDATIONS/SCENARIOS/PRACTICE/INTERVIEW/LEARN with skill-first taxonomy: Features / Evaluation / Systems / Training / Data / Interview / Labs / Learn. Already decided in DECISIONS.md. App.jsx NAV_SECTIONS + BottomNav + DesktopSidebar.

2. **Move Trainer out of INTERVIEW** — Trainer is a drill tool (MCQ flashcard), not an interview simulation. Move to a Drills sub-section within the new skill nav or under Labs. Current placement creates wrong expectations.

3. **Differentiate Code Bugs from ML Coding** — both in PRACTICE, similar names, different formats (Code Bugs = 20 static snippets, ML Coding = 7 live Pyodide problems). Rename Code Bugs → "Bug Hunt" and add a format subtitle on the card. 

4. **Pick one gating model** — currently tab-level AccessGate conflicts with scenario-level isFree flags. Decision: keep tab-level gating (simpler, already working), strip isFree scenario-level enforcement that isn't wired. Log the decision in DECISIONS.md. App.jsx + FeatureEngTab + ModelEvalTab.

5. **README cleanup** — remove JD Prep reference (deleted v4.61), update Incident Room count (6 not 3), update ML Coding count (7 not 3), verify "500+ engineers" claim or soften to "engineers."

---

## AFTER MVP COHERENCE: Depth sprint (P1.5)

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
