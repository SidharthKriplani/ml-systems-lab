# Archived tabs

Components moved here are retired from the live nav but kept on disk (absorb-never-delete)
in case a future feature wants to reuse the code or reference the approach.

- `MockInterviewTab.jsx` — archived 2026-07-22 (DS-1b). Was registered in App.jsx's ALL_TABS
  and TAB_TO_ZONE ('interview') but wired into zero nav surface (NAV_SECTIONS, PRACTICE_DOMAINS,
  INTERVIEW_TOOLS all omit it) -- a true orphan per DS-1's IA audit. The underlying "JD -> prep
  route" concept is logged as a future idea in IDEAS.md (Tier 3) rather than rebuilding this
  component as-is.
