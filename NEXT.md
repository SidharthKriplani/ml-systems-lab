# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. Freemium gate v2 — implement per-scenario `isFree` flags (2.5 hours)
Upgrade freemium from tab-level (free = 4 intro tabs) to scenario-level gating (easy/junior free, mid/senior/staff gated). (a) Add `isFree` field to each scenario in 4 free modules (true for easy/junior, false for mid/senior/staff). (b) Update `AccessGate.jsx` to check `isFree` per scenario instead of per-tab. (c) Hide answer options + checkpoint buttons based on `isFree` + access code. (d) Show gate message: "Unlock with access code for senior-level scenarios." Input: `difficulty` tags from v4.45 (easy/junior → true, mid/senior/staff → false).

### 2. Add YouTube IDs to Gradient posts (1 hour)
Find and add YouTube video IDs to the 5 new posts from v4.45 (Feature Store, Leakage, Forecast Zoo, A/B Tests, Quantization). Search YouTube for StatQuest/3Blue1Brown/Chip Huyen videos; verify with oEmbed API (200=live, 404=broken); update `youtubeId` in `src/tabs/GradientTab.jsx`. Backfill existing Gradient posts missing YouTube IDs (quick scan). ~10–15 min per video.

### 3. Behavioral question bank — add 5-8 Interview scenarios (1.5 hours)
Add new module to `InterviewPrepTab.jsx` covering ML-specific behavioral: (1) disagreement over metric with stakeholder, (2) shipped model that degraded silently 2 weeks, (3) resource conflict (10-day training, 5-day deadline), (4) architect disagreement with teammate, (5) critical bug in production during pause — revert or fix?, (6) explain model decision to non-technical exec. Use `.msl-option-btn` / `.msl-reveal-panel` pattern. 4 options per scenario + per-option explanations. Score stored in `msl_score:behavioral`.

### 4. Interview Experiences — wire Tally form (1 hour)
Connect real Tally.so submission form to Interview Experiences. (a) Create/publish Tally form (10 fields: name, company, role, yearsExp, round, date, tags checkboxes, prepSource, result). (b) Add iframe or "Submit" button in InterviewGrid linking to Tally. (c) Admin workflow: download Tally JSON → format into INTERVIEW_EXPERIENCES array → redeploy. Growth trigger: when N≥15 real submissions arrive, visualizations auto-update. Pre-req for social proof.

### 5. Emoji → SVG sweep — replace residual emoji (1.5 hours)
Systematic pass to replace decorative emoji with inline SVGs. (1) Grep all tabs for emoji codepoints. (2) Categorize: decorative (replace), functional glyphs ✓ ✗ (keep), flags (keep). (3) Replace with simple SVGs using CSS variables. Focus: rendered UI (buttons, labels, headers), not data fields. Output: zero emoji in rendered UI except flags/semantic glyphs.

---

## Pending from Avinash's side

- **Formspree ID** — sign up at formspree.io, replace `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx` line 5.
- **Tally form ID** — create form at tally.so, replace `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid.

---

## Blocked

Nothing currently blocked.

---

## Done this session (v4.46)

- ~~Freemium gate v2 — per-scenario `isFree` flags (46 scenarios tagged easy/junior=true, mid/senior/staff=false)~~
- ~~YouTube IDs for Gradient posts — 5 new + 2 backfill, all verified via oEmbed~~
- ~~Behavioral question bank — 8 scenarios covering production judgment (metrics, degradation, resources, architecture, bugs, leadership)~~
- ~~Tally form wiring — submit button, form spec, admin workflow documented~~
- ~~Emoji → SVG sweep — 97 replacements across 8 tabs, new Icons.jsx component~~
- ~~LINEAGE.md v4.46 entry, IDEAS.md items marked done, METRICS.md keys added, NEXT.md batch complete~~

---

## Done this session (v4.45)

- ~~Fraud Detection phases 2–4 (3 cells per phase + checkpoints) — SMOTE vs class_weight, PSI/KS drift, FastAPI + K8s + Ops Runbook~~
- ~~LandscapeTab LINEAGE entry — documented build history, closed AUDITS #017.3~~
- ~~ModelEvalTab hex colors — verified CSS var compliance, closed AUDITS #017.2~~
- ~~5 Gradient posts (Feature Store, Leakage, Forecast Zoo, A/B Tests, Quantization) — added to GradientTab, CTAs linked~~
- ~~LandscapeTab country/region filter — Global/India/UK/US/EU selector, Salary filtering, localStorage persist~~
- ~~HomeTab domain completion bars — "Your Progress" section, 5 domains, animated bars, clickable nav~~
- ~~Interview Experiences v2 — 15 seed records, TagFrequencyChart in InterviewGrid~~
- ~~Difficulty tagging — all scenarios in ModelsMath/FeatureEng/ModelEval/ClassicalML tagged (easy/junior/mid/senior/staff)~~
- ~~LINEAGE.md v4.45 entry, IDEAS.md In Progress items updated, NEXT.md batch complete~~

---

## Next session (v4.47+)

### 1. Polish freemium gate integration (1.5 hours)
Wire scenario-level gating into tab renders. Check scenario `isFree` at render time; wrap answer reveals with gate logic: show gate if `!isFree && accessCode !== 'DAI2026'`. Update 4 free modules to use new gating. Test: easy/junior flow free, mid/senior require code.

### 2. Difficulty filter UI — practice zone sidebar (2 hours)
Add difficulty filter pills (easy/junior/mid/senior/staff) to PracticeDomainCard sidebar. Filter visible modules by difficulty. Persist selection in localStorage (`msl_difficulty_filter`). Chains with freemium gate v2 (users see difficulty before hitting paywall).

### 3. Interview Experiences — real Tally submissions (1.5 hours)
Monitor Tally form for submissions. When N≥15 real submissions collected: download as JSON, format to INTERVIEW_EXPERIENCES schema, merge into array, commit + deploy. TagFrequencyChart auto-updates. Growth metric: track submission velocity.

### 4. Mobile responsiveness audit + fixes (1.5 hours)
Test all v4.46 changes on mobile (375px, 768px breakpoints). Check: domain bars layout, emoji icon sizing, Tally button tap target, behavioral scenarios overflow, frequency chart responsiveness. Fix any layout breaks.

### 5. Gradient posts — add 3 more posts (2 hours)
Priority from IDEAS.md backlog: "Feature Importance Drift" (FeatureEngTab), "Training-Serving Skew" (SystemDesignTab), "Calibration Loss in Production" (ModelEvalTab). Each post: scenario, production consequence, practice tab link, YouTube ID if found.

---

## What comes after (not for this session)
