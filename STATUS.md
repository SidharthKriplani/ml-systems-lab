# STATUS.md — Cold-start view

Read this at session open alongside NEXT.md + CLAUDE.md. One screen of truth.

---

## Where we are (25 Jun 2026)

**Vercel:** live at `ml-systems-lab.vercel.app`  
**Last meaningful push:** v4.130 (TimeSeriesTab fix + stale repo path)  
**Content freeze:** IN EFFECT — distribution-only until 100 email subs OR 100 weekly returning visitors

---

## What just shipped (this session, 25 Jun 2026)

**Icon system migration — monochrome Instrument design standard.**  
Full HQ canonical `Icon.jsx` (84 icons + GLYPH_TO_ICON map) deployed to `src/components/`, replacing the prior 15-icon `Icons.jsx` shim. Two new files added: `CompanyLogo.jsx` (Google favicon + initial-badge fallback, CSS vars adapted to MSL tokens `--depth`/`--rim`/`--ink-ghost`) and `companyDomains.js` (319-entry canonical domain resolver). All replaceable emoji in 16 source files converted to monochrome `<Icon name="..." />` components. No version bump — design/infra, not content. Commit pending (approve-first).

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
