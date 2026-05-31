# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. ProjectLabTab Phase 4 — Monitoring (2.5 hours)
Continue `ProjectLabTab.jsx`. Phase 4: 4 cells + 1 checkpoint. Cell IDs: `cell11`–`cell14`. Checkpoint: `cp5`. Steps: (cell11) PSI per feature on held-out split — compute Population Stability Index, print per-feature breakdown; (cell12) KS test — Kolmogorov-Smirnov distribution shift detection, p-value interpretation; (cell13) Prediction drift — score distribution before vs. after a simulated deployment shift; (cell14) Label drift — delayed feedback problem, proxy signal patterns; (cp5) judgment checkpoint: "PSI=0.18 on tenure, KS p=0.03 on monthly_charges — alert or wait?" Correct: alert + investigate (both signals above threshold; PSI > 0.2 is critical but 0.18 warrants triage, KS p=0.03 below alpha=0.05 is statistically significant). Same synthetic data generation pattern as Phase 3 (fixed seed, 600 rows). Progress bar: `phase4TotalSteps = 5`. Phase 4 roadmap card → remove from roadmap after building.

### 2. ProjectLabTab Phase 5 — Deployment Scaffold (2 hours)
Phase 5: 5 cells, no checkpoint. Cell IDs: `cell15`–`cell19`. Content is reference/educational (no Pyodide execution — these cells show code templates the user reads, not runs): (cell15) FastAPI `/predict` endpoint — pydantic schema, response model, async handler; (cell16) Dockerfile — multi-stage build, model artifact bake-in, uvicorn CMD; (cell17) Kubernetes manifest — Deployment + Service + HPA stub; (cell18) CI/CD — GitHub Actions: lint → test → build → push to ECR; (cell19) AWS mapping callout — ECR/ECS vs EKS vs SageMaker Batch tradeoffs. Cells use `PythonCell` with `initialCode` (static code template) but no `onResult` (display only, no execution). Mark done via a "Mark as read" button instead of run-to-complete. Phase 5 roadmap card → remove. Roadmap section disappears when Phase 5 complete.

### 3. Domain completion bars on HomeTab (1 hour)
In `HomeTab.jsx`, add per-tab progress bars inside the "All tracks" grid section. Each track card shows: tab name, `X / N scenarios` completed, a thin 2px progress bar. Data source: read `msl_score:{tabPrefix}` keys from localStorage (already exist per-tab), map against a hardcoded `TAB_SCENARIO_COUNTS` object in HomeTab (approximate counts — 10 scenarios per basic tab, exact counts where known). Only show the bar if `N > 0`. No new localStorage keys. ~1 hour. This surfaces the domain-progress data that already exists but isn't visible on HomeTab.

### 4. GradientTab — add 2 new posts (1 hour)
Add to `src/data/gradientPosts.js`: (1) "Feature Store Time-Travel Bug" — covers temporal leakage via point-in-time joins, correct vs incorrect feature retrieval, Feast/Hopsworks pattern. Practice CTA → FeatureEngTab. (2) "Validation Set Leakage — Why Your AUC Lied" — covers train-test contamination vs target leakage distinction, the avg_spend example from ProjectLab cp3, split-first discipline. Practice CTA → ProjectLabTab. Follow the existing `gradientPosts.js` schema: `{id, title, subtitle, date, readTime, tags, youtubeId:'', body, practiceLink}`. Body format: 4–6 paragraphs, inline `<code>` tags. Both posts tie directly to existing checkpoints in the lab.

### 5. Emoji → SVG — top 3 traffic tabs only (45 min)
Replace remaining rendered-UI emoji in `HomeTab.jsx`, `CombinatorTab.jsx`, `TrainerTab.jsx`. Pattern: grep each file for emoji codepoints in JSX strings/labels. Decorative emoji → inline SVG referencing `currentColor` or CSS variables (simple shapes only — no external assets). Functional glyphs (✓ ✗ · →) stay as text characters. Brace balance check on each file. Scope-limited to these 3 files — don't expand.

---

## Blocked

Nothing currently blocked.

---

## Done this session (v4.38)

- ~~ProjectLabTab Phase 3 — Model Training & Evaluation: cell7 (stratified split), cell8 (LR+RF+GBC training), cell9 (ROC/PR/confusion matrix/threshold), cell10 (reliability diagram/ECE/Platt scaling), cp4 (ship-or-not: AUC=0.81, ECE=0.12, probability-gated downstream). Synthetic 600-row dataset.~~
- ~~Pre-eval callouts — MonitoringTab (5 scenarios) + MLOpsDeployTab (5 scenarios): `.msl-hint` wired pre-pick. 5-tab coverage complete.~~
- ~~Premium unlock animation — confirmed already done in prior session (AccessGate.jsx has showMoment, ag-unlock-in, ag-prime-glow). No action needed.~~
- ~~HomeTab visual hierarchy divider: `paddingTop` 28px → 40px, `<hr var(--rim)>` above "All tracks" eyebrow.~~
- ~~Housekeeping #017.1 + #017.2: App.jsx font-mono tokens + void/white hex fixes. AskTab.jsx font-sans. InterviewPrepTab.jsx #000→var(--void). dbtTab already clean.~~

---

## What comes after (not for this session)

- **Testimonials & Feedback system** — floating "Rate this" chip → Tally/Formspree → admin reviews → `src/data/testimonials.js` → HomeTab social proof section. Full spec in IDEAS.md. Pre-requisite: select Tally vs Formspree, confirm 3 rating questions.
- **Interview Experiences — v1 (submit + curate)** — Tally form with company/role/level/round fields → admin reviews → tags with fixed 10-skill taxonomy → adds to `src/data/interviewExperiences.js`. Full spec in IDEAS.md. Do NOT build the frequency chart until 15+ approved submissions exist.
- **Interview Experiences — v2 (skills frequency chart)** — bubble/bar chart from `interviewExperiences.js`, filtered by role/level/company tier. Build only after N≥15.
- **Datamart-based ML practice** — build after ProjectLabTab phases 4–5 complete.
- **DefenseDocTab v2** — gap-mapped prep plan, resume cross-reference, round-type selector.
- **Freemium gate v2** — difficulty tags on scenarios, PremiumGate wrapper per-tab.
- **Social proof signal** — single line in README when verifiable usage numbers exist.
- **ModelEvalTab gradient hex** — last open #017.2 finding (`#6366f1`/`#22d3ee` in progress bar gradient).
