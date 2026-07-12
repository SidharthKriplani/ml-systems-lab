# STATUS.md — Cold-start view

Read this at session open alongside NEXT.md + CLAUDE.md. One screen of truth.

---

## Where we are (12 Jul 2026)

**Vercel:** live at `ml-systems-lab.vercel.app`  
**Last meaningful push:** commit `ba171e2` — MSL qnaBank.js now covers 195/200 modules; draft QnA questions render in the UI  
**Content freeze:** the v4.119 "distribution-only" freeze (below) was superseded in practice by an owner-directed 3B1B/Phase-A content-quality pass + the QnA interview-mode build across `src/data/foundations/*.js` — real work landed there this session; treat the freeze section further down as historical strategy context, not current scope, until the user formally revises it. See `docs/BACKLOG.md`'s 2026-07-12 08:59 IST entry for the authoritative current state.  
**Uncommitted local work:** none — `git status` is clean as of HEAD `ba171e2`.

---

## What just shipped (sessions through 12 Jul 2026)

**3B1B Phase A content pipeline — CUT SHORT mid-run at user's direction, not resumed.** `src/data/contentStatus.js` — **13 'clean' / 115 tracked** (S: 4/38, A: 9/77). 100 modules `in_progress`: 75 fixed-but-unverified, 23 fixed-verified-still-failing, 1 disputed (`thompson_sampling`), 1 audited-clean-unconfirmed (`learning_rate_schedules`). Full categorized breakdown + concrete resume plan: `docs/BACKLOG.md`'s 2026-07-12 08:59 IST entry — read that before touching Phase A again, don't re-derive from the workflow journal.

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
