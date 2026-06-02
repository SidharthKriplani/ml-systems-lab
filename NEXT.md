# NEXT.md — Session Queue

Next 5 items for v4.49 sprint. Updated: 2026-06-02 (end of v4.48 mega-batch)

---

## v4.49 — Blocking + Content Quality + Interview Experiences Complete

1. **Complete v4.47 Item 3: Interview Experiences Monitoring** (BLOCKED on external setup)
   - Avinash must sign up for Formspree (for feedback form collection in FeedbackChip) and Tally.so (for interview experience form in InterviewGrid)
   - Requires: Formspree account ID → `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx`
   - Requires: Tally.so account + form link → `REPLACE_WITH_YOUR_TALLY_ID` in `src/tabs/App.jsx` InterviewGrid
   - Once credentials provided: wire both forms, test submission flow, verify data flow to admin panel
   - Blockers all documented in code; unblocking only requires account signup + 10-min credential swap

2. **Module bookmarking: "Save for Later" feature** (v4.48 Item 4 infrastructure complete)
   - Add "Save" button to every scenario/module card (ModelsMath, FeatureEng, ModelEval, ClassicalML, etc.)
   - Persist to `msl_bookmarks` localStorage (already prepared)
   - Add "My Bookmarks" view on HomeTab showing all saved modules with navigation
   - Card state: filled heart (saved) vs outline heart (not saved), toggle on click
   - Estimated: 2 hours across 30 tab files + HomeTab

3. **Gradient posts 41–45: 5 new high-impact posts** (content quality pass)
   - Post 41: "Offline Evaluation ≠ Online Performance" (domain: eval, failure mode where offline metrics don't predict production)
   - Post 42: "Label Noise in Production: When Your Ground Truth Lies" (domain: features, data quality failure)
   - Post 43: "Concept Drift: The Invisible Enemy" (domain: monitoring, production failure mode)
   - Post 44: "Cold-Start Trap in Personalization" (domain: design, architecture failure)
   - Post 45: "Silent Model Staleness" (domain: monitoring, observability failure)
   - All must have verified YouTube IDs + practice module CTAs before shipping
   - Estimated: 4 hours (1 post = 45 min research + write + link)

4. **Interview zone accessibility audit**
   - Verify all 9 interview tools (Defense, Combinator, Verbal, Spot the Flaw, Interview Prep Q&A, Take-Home, Case Studies, Staff Layer, Trainer) are discoverable and have clear entry points
   - Check: all tools show in `INTERVIEW_TOOLS` array, all routed correctly in App.jsx, all have ForwardPointers/CTAs
   - Check: all descriptions clear on first visit (guidance text added v4.17, verify still accurate)
   - Check: mobile navigation works smoothly across all tools
   - Estimated: 1 hour

5. **NEXT.md → IDEAS.md → DECISIONS.md final sync**
   - Move this session's completed items (v4.47 + audits + v4.48 + 3 resolved findings) to LINEAGE.md "Done" section with dates
   - Finalize DECISIONS.md token enforcement section (grep checklist, pre-commit steps)
   - Finalize METRICS.md (4 new keys now documented)
   - Verify AUDITS.md has all 3 findings marked ✅ Resolved
   - Queue remaining Tier 1 items from IDEAS.md for v4.50+ planning
   - Estimated: 1 hour (mostly documentation)

---

## Blockers blocking this batch

**v4.47 Item 3 — Interview Experiences:** Awaiting Avinash account setup (Formspree + Tally).
- Cannot proceed without credentials.
- Does not count toward batch completion — marked blocked.
- Timeline: Avinash availability.

---

## Critical path

1. Unblock v4.47 Item 3 (interview experiences) — high-value feature for interview zone
2. Ship bookmarking + "My Bookmarks" view — improves retention/re-engagement
3. Add 5 new Gradient posts — content freshness + breadth
4. Interview zone audit — verify accessibility before any promotion

---

## Notes for next session

- All code changes from v4.48 are staged in git; user must clear locks locally (`rm -f .git/index.lock .git/HEAD.lock`) and push
- All spine files updated except NEXT.md (this file) and final IDEAS.md/"Done" section move
- No architectural debt identified; codebase health is clean (all brace-balanced, all CSS variables, no hardcoded colors)
- 35+ files modified, zero merge conflicts expected
- LoadingSpinner.jsx and export.js/read.js are new utility files — verify they're committed as part of bundle
