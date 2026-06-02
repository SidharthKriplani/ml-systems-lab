# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. SHAP YouTube replacement ID (open — StatQuest has no public SHAP video)
`GradientTab.jsx` line ~394: `youtube: []` — the original `VaIXMiNMEJU` was cleared (video private). Find the correct live StatQuest SHAP video ID. Best candidate: search YouTube for "StatQuest SHAP values" and verify via `youtube.com/oembed?url=https://www.youtube.com/watch?v={id}&format=json` (200 = live). Replace the empty array with `[{ id: 'CORRECT_ID', title: 'SHAP Values, Clearly Explained — StatQuest' }]`. Also AUDITS.md: mark #023.1 resolved.

### 2. Loan Default ProjectLab dataset — Phase 1 (2.5 hours)
New ProjectLab notebook: Loan Default (credit risk). New tab file or extend existing `ProjectLabTab.jsx` with a dataset selector (Churn / Loan Default) — decision pending. If extending: add a dataset toggle at the top, separate localStorage key `msl_projectlab_loan_data`, separate cell IDs (loan_cell1–loan_cell3 etc). Phase 1 only: schema inspection (a 25-feature loan dataset with `annual_income`, `loan_amount`, `credit_score`, `employment_length`, `default` target), EDA (class imbalance ~15% default, correlation heatmap), and Checkpoint L1 ("which two columns would you inspect for regulatory fairness risk before training?"). Correct: `annual_income` + any demographic proxy. Synthetic 800-row dataset generated in-cell (numpy, fixed seed). Regulatory framing is the differentiator — mention disparate impact doctrine in explanation.

### 3. GradientTab — add 2 new posts (1 hour)
Add to `GradientTab.jsx` POSTS array: (1) "Feature Store Time-Travel Bug" — covers temporal leakage via point-in-time joins, correct vs. incorrect feature retrieval at prediction time, Feast/Hopsworks `as_of` parameter. Category: Feature Engineering. CTA: FeatureEngTab. (2) "Validation Set Leakage — Why Your AUC Lied" — train-test contamination vs. target leakage distinction, the avg_spend example from ProjectLab cp3, split-first discipline. Category: Model Evaluation. CTA: ProjectLabTab. Both follow the existing post schema: `{ slug, title, category, catColor, readMin, featured: false, excerpt, body, tags, domain, youtube: [] }`. Body: 4–5 `**bold section header:**` paragraphs, same length as existing posts (~600 words each).

### 4. Domain completion bars on HomeTab (1 hour)
In `HomeTab.jsx`, add per-tab progress bars inside the "All tracks" grid section. Each track card shows: tab name, `X / N scenarios` count, 2px progress bar. Data: read `msl_score:{tabPrefix}` keys from localStorage, map against a hardcoded `TAB_SCENARIO_COUNTS` object (approximate counts per tab — use 10 as default, exact where known: CombinatorTab=100, TrainerTab=60, InterviewPrepTab=128, SpotTheFlawTab=12). Bar only renders if `N > 0`. No new localStorage keys. Inline styles, CSS vars only.

### 5. Testimonials display section on HomeTab (1 hour)
Create `src/data/testimonials.js` with 2–3 placeholder entries (name, role, company, rating, text, date, approved:true) so the section renders immediately — replace placeholders with real entries as they arrive via Formspree. In `HomeTab.jsx`, add a testimonials section after the "All tracks" grid: section eyebrow "What engineers say", 2–3 quote cards in a grid (name + role + company + text + star display). Reads from `testimonials.js`. If array is empty, section is hidden. Amber left-border card style, same design language as the rest of HomeTab.

---

## Pending from Avinash's side

- **Formspree ID** — sign up at formspree.io, create a new form, copy the ID (part after `/f/`), replace `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx` line 5, then push.
- **Tally form ID** — create form at tally.so with fields: Company, Role (MLE/DS/MLS/Research), Level (L3/L4/L5/Staff/Principal), Round Type (phone screen/take-home/virtual onsite/onsite), Experience text (paragraph). Publish → copy ID from share URL (part after `/r/`), replace `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid, then push.

---

## Blocked

Nothing currently blocked.

---

## Done this session (v4.39 + v4.40)

- ~~SHAP YouTube embed cleared (VaIXMiNMEJU was private — verified via oEmbed API, all other 12 IDs live).~~
- ~~FeedbackChip.jsx built — floating ★ Rate chip, Formspree POST, 3 star-rating questions, msl_feedback_last cooldown. Wired globally into App.jsx.~~
- ~~Interview Experience card added to InterviewGrid in App.jsx — links to Tally form placeholder.~~
- ~~ProjectLab Phase 4 (Monitoring): cell11 PSI, cell12 KS test, cell13 prediction drift, cell14 label drift + blind zone, cp5 alert-or-wait checkpoint.~~
- ~~ProjectLab Phase 5 (Deployment Scaffold): cell15 FastAPI, cell16 Dockerfile, cell17 K8s manifest, cell18 GitHub Actions CI/CD, cell19 AWS mapping. Mark-as-read pattern. Completion card.~~
- ~~Question framing quality pass: 20 scenarios rewritten across MonitoringTab (6), FeatureEngTab (6), SystemDesignTab (9) — specific, situation-first, production-decision-grounded.~~
- ~~Testimonials: `src/data/testimonials.js` created (3 placeholder entries). HomeTab "What engineers say" section — auto-hides when empty, amber left-border cards, star rating display.~~

---

## What comes after (not for this session)

- **Loan Default Phase 2–5** — feature engineering, model, monitoring, deployment scaffold (same 5-phase structure as Churn).
- **Fraud Detection ProjectLab** — after Loan Default complete.
- **SystemDesign retrieval content boundary audit** — classify each retrieval scenario as MSL (ANN) vs GAL (RAG). Remove GAL scenarios.
- **Difficulty + industry filter** — requires tagging 200+ scenarios first; content work is the prerequisite.
- **Freemium gate v2** — per-scenario `isFree` flags, first 2 cases per module free.
- **ModelEvalTab gradient hex** — last open #017.2 finding.
- **LandscapeTab country filter** — region field on company/salary data; India/UK/US/EU toggle.
