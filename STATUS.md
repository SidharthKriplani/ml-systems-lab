# STATUS.md — Cold-start view

Read this at session open alongside NEXT.md + CLAUDE.md. One screen of truth.

---

## Where we are (15 Jul 2026)

**Vercel:** live at `ml-systems-lab.vercel.app` (not re-confirmed live by direct fetch this refresh — see Active blockers)  
**Last meaningful push:** commit `ba62731` — 2 new content-verification scripts (`scripts/check-duplicate-keys.mjs`, `scripts/extract-numeric-claims.mjs`), 3 `contentStatus.js` "clean" entries corrected after real bugs were found in them, 74 stale `verifiedFileHash` entries refreshed.  
**Content freeze:** still not formally revised by the user — see 12 Jul entry below, still applies as historical strategy context.  
**Uncommitted local work:** none — `git status` clean as of HEAD `ba62731` (one pre-existing untracked `_to_delete/` folder, unrelated, not from this work).

---

## What just shipped (sessions through 15 Jul 2026)

**2026-07-15 — Two new interactives + a Phase 1 content-quality audit that found the "clean" tag itself was unreliable.** Shipped `RingWarpViz` (real trained 2→3→2→1 tanh network, 67 weight snapshots, replaces the broken `DonutCupViz` slot on the `neural_nets` module — `DonutCupViz.jsx` itself is now an orphaned file, fate undecided) and `TransformerBlockViz` (live-computed single Transformer block forward pass, 2-head attention, encoder/decoder toggle, for the `transformers` module). Then ran a blind adversarial re-audit on 12 modules already tagged `'clean'` in `contentStatus.js` (some with multiple prior audit rounds) as a spot-check on the tag's reliability — found genuine factual bugs in 3 of 12 (`linear_regression`: a variance-mislabeling error; `hypothesis_testing`: a fabricated p-value plus an impossible lift-magnitude claim in 3 locations; `mle_map`: an unlabeled figure that could be misread against the wrong worked example), all fixed. Root cause, confirmed from `contentStatus.js`'s own audit trail: prior "clean" verdicts claimed to have "recomputed every arithmetic/numeric claim" but their own itemized checklists skipped the exact broken sentence. Separately found and fixed **36 duplicate `interactiveId` keys** across 7 data files (dead code, invisible to any content-only audit) via a new exhaustive scanner. Built two new zero-dependency scripts to close both gaps going forward (`check-duplicate-keys.mjs`, `extract-numeric-claims.mjs`), wired as Recordkeeping rule 6 in the shared root `CLAUDE.md`. Full detail: `docs/BACKLOG.md`'s 2026-07-15 entries (four of them, ~12:50–14:41 IST).

**`contentStatus.js` current tally: 199 'clean' / 206 tracked (S: 36/40, A: 77/80).** This is a large jump from the 12 Jul snapshot below (13/115) — that number was stale; multiple Phase A batches landed between 12–15 Jul that this file was never updated to reflect. Don't trust either number without re-running `node scripts/validate-content-status.mjs` — it's the actual source of truth as of whenever it's run, this file is a snapshot.

**Still open from the 15 Jul audit:** 4 modules with voice-craft-only violations (`gradient_boosting`, `rct_design`, `training_serving_skew`, `data_splits_and_leakage`) found but not yet fixed. Whether to expand the 12-module sample to the remaining ~80 clean-tagged modules is in progress. `AttentionViz` "renders but unresponsive" bug reported by the user, still unresolved — blocked on a screenshot/console log, static code review found nothing. Nothing shipped this session has been confirmed live in a running dev server or on Vercel.

## 12 Jul 2026 entry (kept for history, now superseded by the above)

**3B1B Phase A content pipeline — CUT SHORT mid-run at user's direction, not resumed.** `src/data/contentStatus.js` was **13 'clean' / 115 tracked** (S: 4/38, A: 9/77) at this point — since superseded, see current tally above. 100 modules `in_progress`: 75 fixed-but-unverified, 23 fixed-verified-still-failing, 1 disputed (`thompson_sampling`), 1 audited-clean-unconfirmed (`learning_rate_schedules`). Full categorized breakdown: `docs/BACKLOG.md`'s 2026-07-12 08:59 IST entry.

**Interview QnA mode.** Third view tab (Full / Quick recap / Interview QnA) across all 19 foundation family tabs, `src/components/foundations/QnAPanel.jsx` + `src/data/qnaBank.js`. **195/200 modules now have a draft question set** (6408 questions) — 1 module (`logistic_regression`) is fully `answered` (31 questions, audited). **5 modules blocked** by a genuine id-collision bug (`calibration`, `class_imbalance`, `feature_selection`, `bayesian_inference`, `cold_start` — same id, different content, in 2-3 different source files) — not resolved. Per explicit user direction (2026-07-12), `draft`-status questions now RENDER in the UI (distinct DRAFT banner) instead of a coming-soon stub — only real-answer eligibility (still gated on narrative `clean` status) is unchanged. Rule detail: root `QNA-INTERVIEW-STANDARD.md`. **Owed, not done:** the standard's own light question-audit pass has never been run on these 6408 draft questions.

---

## The product in one line

MSL is a judgment + depth SPA for senior MLE interview prep: 130+ Gradient posts, a 57-post MLE Path, 6 practice tabs (IncidentRoom · MLCoding · SpotTheFlaw · FeatureEng · ModelEval · ClassicalML), CheatsheetTab, and Study Room (code live, Supabase activation pending).

---

## Active blockers

1. **Content freeze** — lift condition: 100 email subs OR 100 weekly returning visitors (PostHog)
2. **GSC verification** — `REPLACE_WITH_YOUR_GSC_CODE` in `index.html` still a placeholder
3. **PostHog key** — `VITE_POSTHOG_KEY` not set in Vercel → analytics blind
4. **Study Room activation** — Supabase schema + `import_anki.py` run needed (see NEXT.md)
5. **Git PAT revoked** — regenerate before next push (see NEXT.md notes)

---

## Scale snapshot

- 130+ Gradient posts (11 series); MLE Path: 57-post ladder, 11 tiers, 54 Simplify versions, 121-term glossary
- 150 Quiz Me MCQs (posts 1–50)
- 6 active practice tabs; CheatsheetTab (50 flashcards + 24 trade-off cards + 8-domain audit + 7-day plan + 7 company profiles)
- Icon system: 84-icon HQ canonical (`src/components/Icon.jsx`); 16+ consumers
- Study Room: code shipped (`src/study/StudyRoom.jsx`), Supabase activation pending

---

## Next session

Read NEXT.md. Short answer: distribution-only — GSC verification → email capture component → LinkedIn cadence.

---

## 2026-07-05 — MEGA-SESSION (full detail in root ../../CLAUDE.md)
- 3 modules finished (recsys_dl_architectures, recsys_representation_learning, online_experimentation_ml) + 3 interactives (dl_recsys_arch_viz, negative_sampling_viz, experiment_power_viz) registered in InteractivePanel + 14 TRAINER_QUESTIONS (ids 121-134).
- Difficulty ordering: NEW utils/foundations/sortByDifficulty.js wraps all 19 family tabs + coding drills. Mobile: MyTracksTab + Cheatsheet grids (index.css). Wave 3: Profile 5-card + company logos (28) + Progress reorder.
- Push via `git add src/`. **NEXT = SEO → ../../HANDOFF-SEO.md** (MSL has generate-rss but NO prerender yet — port GSL's scripts/prerender-gt.js pattern).
