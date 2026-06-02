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

## v4.54 — Done this session

- [x] ~~Revise mode v2~~ — done (HISTORY_DOMAIN_MAP + trainer/combinator aggregation; weak domain detection now real)
- [x] ~~Fidelity badge ×10 remaining tabs~~ — done (all 20 practice tabs now have badges)
- [x] ~~Code examples in posts 22/23/25/39~~ — done (Spark metrics, PSI+KS, temporal features, skew detection)
- [x] ~~Distractor round 4~~ — done (12: StaffLayer×3 + InterviewPrep×9; VerbatimTab confirmed no MCQ; total 77 across 13 files)
- [x] ~~ForwardPointers remaining~~ — done (DLFineTune, DLServing, ModelsMath, InterviewPrep, SpotTheFlaw, CodeBugs; all 20 tabs now covered)
- [x] ~~METRICS.md~~ — done (domainBreakdown schemas + FidelityBadge tier table)
- [x] ~~LINEAGE v4.54~~ — done

---

## v4.53 — Done this session

- [x] ~~YouTube IDs posts 46/47/48/49~~ — done; all 50 posts now have YouTube IDs (0 empty arrays)
- [x] ~~Distractor quality round 3~~ — done (21 questions: DS×4, Causal×4, TS×5, Pipelines×4, Deploy×4; total 65 across 11 files)
- [x] ~~ForwardPointers ×8 tabs~~ — done (Airflow, dbt, DataModeling, Causal, TimeSeries, Staff, Trainer, CaseStudies)
- [x] ~~Fidelity badge 3-tier upgrade~~ — done (FidelityBadge.jsx + 8 tabs; faithful/simplified/conceptual)
- [x] ~~Revise mode smoke test~~ — done (logic verified; v1 limitation: trainer/combinator history not in msl_score:* namespace)
- [x] ~~LINEAGE v4.53~~ — done

---

## v4.52 — Done this session

- [x] ~~YouTube IDs posts 41/42/45~~ — done (rjGGSHhKDMM, 7iaCLi0Kdd4, cgc3dSEAel0; all oEmbed verified)
- [x] ~~Series assignment posts 20/26/27~~ — done (Silent Failures now 13 posts)
- [x] ~~Distractor quality pass round 2~~ — done (21 questions: Spark×5, Airflow×5, dbt×5, DeepLearning×6)
- [x] ~~ROLLOUT.md Batch 0 update~~ — done (7 new rows + 2 test sections)
- [x] ~~Revise/Learn/What's Next reading mode~~ — done (3 lenses, msl_score:* driven, graceful fallback)
- [x] ~~LINEAGE v4.52~~ — done

---

## v4.51 — Done this session

- [x] ~~Gradient posts 49–50~~ — done (recsys feedback loop, CUPED failures; 50 posts milestone reached)
- [x] ~~YouTube ID post 50~~ — done (W0kDiJiDcEE verified; posts 41/42/45 remain [])
- [x] ~~Series + Tags UI~~ — done (SERIES constant, activeSeries state, filter row above domain pills, AND-filtering)
- [x] ~~Posts 31–34 differentiation~~ — done (4 distinct angles; API trap, group contamination, retroactive data, walk-forward)
- [x] ~~LINEAGE v4.51~~ — done

---

## v4.55 — Next sprint

1. **Unblock Interview Experiences** (blocked on Avinash credentials)
   - Requires: Formspree account ID → `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx`
   - Requires: Tally.so form URL → `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid

2. **Gradient post code pass — remaining posts without code**
   - Posts 4, 5, 7, 11, 15, 24 are high-value but have no code blocks
   - Add 1 snippet per post: two-tower architecture (4), PSI drift (5), feature store API (7), cold-start routing (11), Netflix ML stack (15), system design checklist (24)

3. **Gradient post body pass — add code examples to 5 posts**
   - Posts 4, 7, 11 are highest value (rec system, feature store, cold start)
   - 1 Python snippet each

4. **HomeTab changelog — update entry**
   - Jun 2026 entry is stale (references v4.44 features)
   - Update to reflect 50 posts, bookmarking ×18 tabs, series UI, Revise mode, fidelity badges, ForwardPointers on all tabs

5. **ROLLOUT.md — Batch 1 readiness check**
   - Batch 0 checklist is updated; run through it manually before inviting Batch 1 testers
   - Batch 1 tester brief is written; confirm it still reflects current product

---

## Blockers

**Interview Experiences (v4.47 Item 3):** Awaiting Avinash signup for Formspree + Tally.so.

---

## Notes for next session

- All changes staged but NOT committed — run from terminal:
  `cd ~/Documents/GitHub/ml-systems-lab && rm -f .git/index.lock .git/HEAD.lock && git add -A && git commit -m "v4.54: Revise v2, fidelity x10, post code examples, distractor r4 x12, ForwardPointers all tabs" && git push`
- Brace balance: all files at 0
- All 20 practice tabs now have ForwardPointers + fidelity badges
- 77 total distractor questions improved across 13 tab files (4 rounds)
- Revise mode v2 now draws from trainer/combinator history — much more useful for active users
- HomeTab changelog is stale — update as v4.55 Item 4
