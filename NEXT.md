# NEXT.md — Session Queue

Next 5 items for v4.51 sprint. Updated: 2026-06-02 (end of v4.50 batch)

---

## v4.49 — Done this session

- [x] ~~Gradient posts 41–45~~ — done (GradientTab.jsx, 5 posts, POST_PRACTICE wired, brace delta 0)
- [x] ~~Module bookmarking — Save for Later~~ — done (BookmarkButton in 8 tabs, HomeTab section already rendered, all brace delta 0)
- [x] ~~Design token extraction~~ — done (3 tokens in :root, 237 total replacements across tabs/App/components)
- [x] ~~Emoji sweep~~ — done (⚡ → SVG in CombinatorTab ×4, 🎉 → SVG star in ProjectLabTab; country flags kept)
- [x] ~~Interview zone audit~~ — done (all 9 tools verified; 2 description fixes in App.jsx)
- [x] ~~MD sync~~ — done (METRICS.md table fixed, IDEAS.md dupe removed, BRAIN_TRANSFER.md updated)
- [x] ~~LINEAGE.md v4.49 entry~~ — done

---

## v4.50 done this session

- [x] ~~Gradient posts 46–48~~ — done (recsys silent failures, DiD parallel trends, cold-start product framing)
- [x] ~~YouTube IDs posts 43+44~~ — done (jRM5_Z31y5U concept drift, UFpF108gyaw cold-start; posts 41/42/45 remain [])
- [x] ~~Distractor quality pass~~ — done (23 questions improved: 12 CombinatorTab + 11 TrainerTab; Audit #008.2 closed)
- [x] ~~BookmarkButton ×10 more tabs~~ — done (all 18 practice tabs now have BookmarkButton)
- [x] ~~Series taxonomy~~ — done (5 series mapped across 48 posts in IDEAS.md; UI build deferred until 50+)
- [x] ~~AUDITS.md #027+028~~ — done (interview audit + full batch documented; Summary Table updated)
- [x] ~~LINEAGE.md v4.50~~ — done

---

## v4.51 — Done this session

- [x] ~~Gradient posts 49–50~~ — done (recsys feedback loop, CUPED failures; 50 posts milestone reached)
- [x] ~~YouTube ID post 50~~ — done (W0kDiJiDcEE verified; posts 41/42/45 remain [])
- [x] ~~Series + Tags UI~~ — done (SERIES constant, activeSeries state, filter row above domain pills, AND-filtering)
- [x] ~~Posts 31–34 differentiation~~ — done (4 distinct angles; API trap, group contamination, retroactive data, walk-forward)
- [x] ~~LINEAGE v4.51~~ — done

---

## v4.52 — Next sprint

1. **Unblock Interview Experiences** (blocked on Avinash credentials)
   - Requires: Formspree account ID → `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx`
   - Requires: Tally.so form URL → `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid

2. **YouTube IDs backfill — posts 41, 42, 45**
   - Posts 41 (Offline Eval ≠ Online), 42 (Label Noise), 45 (Silent Model Staleness) still have `youtube: []`
   - Good search angles: Evidently AI channel for monitoring/staleness; Confident Learning (Curtis Northcutt) for label noise; RecSys conference talks for offline vs online eval

3. **Series filter — assign unassigned posts 20, 26, 27**
   - These 3 posts (Validation Set Leakage variants + Feature Store extended) currently only visible under "All Series"
   - Post 20 → Silent Failures; Post 26 → Silent Failures; Post 27 → Silent Failures
   - Update SERIES arrays in GradientTab.jsx

4. **Distractor quality pass — round 2**
   - 23 questions improved in v4.50. Remaining tabs not yet touched: SparkLabTab, AirflowTab, dbtTab, DeepLearningTab
   - Run same audit: identify obviously-wrong options, replace with plausibly-wrong ones

5. **ROLLOUT.md Batch 0 checklist update**
   - Several checklist items reference features added since last ROLLOUT.md edit (bookmarking, series filter, 50 posts, design tokens)
   - Update checklist to reflect current surface area before any external tester access

---

## Blockers

**Interview Experiences (v4.47 Item 3):** Awaiting Avinash signup for Formspree + Tally.so.

---

## Notes for next session

- All v4.49–v4.51 changes staged but NOT committed — run from terminal:
  `rm -f .git/index.lock .git/HEAD.lock && git add -A && git commit -m "v4.51: Posts 49-50, series UI, post 31-34 rewrite, CUPED YouTube ID" && git push`
- Brace balance: GradientTab at delta 0; all other files clean
- 50 Gradient posts total
- Series UI live — posts 20/26/27 still need series assignment (v4.52 Item 3)
