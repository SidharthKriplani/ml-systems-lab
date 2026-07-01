# STATUS.md — Cold-start view

Read this at session open alongside NEXT.md + CLAUDE.md. One screen of truth.

---

## Where we are (1 Jul 2026)

**Vercel:** live at `ml-systems-lab.vercel.app`  
**Last meaningful push:** v4.130 (TimeSeriesTab fix + stale repo path)  
**Content freeze:** IN EFFECT — distribution-only until 100 email subs OR 100 weekly returning visitors  
**⚠️ Uncommitted local work:** foundations interview-depth gap-fill (5 content files) + mobile master-detail fix (index.css + 17 foundation tabs) + prior S-tier rewrite (10 content files + 10 interactives). **Push commands staged in CLAUDE.md LATEST + PREV — Sidharth runs on Mac.**

---

## What just shipped (this session, 1 Jul 2026 — LOCAL, uncommitted)

**Foundations interview-depth gap-fill + mobile fix.**  
Owner-directed content-quality pass driven by an external interview-coverage gap analysis. ~40 foundation modules across 5 `src/data/foundations/` files (classicalML, eval, unsupervised, optimization, data) each got new prose sections in `summary`, new `keyPoints`, and new `checkQuestions` closing senior-MLE interview gaps. Factual fixes: RF calibration direction (away from 0/1 → sigmoid), backwards augmentation diagnostic, softened overclaims, one wrong quiz key. Render fixes: currency-`$`/KaTeX collisions and backtick-apostrophes. **Mobile:** the 17 `foundations/*FoundationTab.jsx` two-pane layouts squeezed the reader to a sliver on phones once a module opened — fixed via a `.foundation-split` master-detail media query in `index.css` + a `className`/`data-open` tag on all 17 (hide list when open, full-width reader). All files parse clean (acorn-jsx 17/17, JS import-parse), brace-balanced, string-audit OK. See CLAUDE.md LATEST for full detail + the two push commands.

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
