# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. ProjectLabTab Phase 3 — Model Training & Evaluation (2.5 hours)
Continue `ProjectLabTab.jsx`. Phase 3: 4 cells (train/val/test split → LogisticRegression + RandomForest + XGBoost → evaluation metrics (precision/recall/AUC/F1/confusion matrix) → calibration (reliability diagram, ECE, Platt scaling)) + 1 judgment checkpoint ("AUC=0.81, ECE=0.12, p95 latency=38ms, class imbalance 1:20 — would you ship?"). `checkpointsDone` adds `cp4`. Cell IDs: `cell7`, `cell8`, `cell9`, `cell10`. Phase 3 header shows "Phase 3 of 5". `phase3TotalSteps = 5`.

### 2. Pre-Eval callouts — MonitoringTab + MLOpsDeployTab (1 hour)
Complete the 5-tab Pre-Eval Callout coverage from IDEAS.md. Add `.msl-hint` between option pick and reveal button in MonitoringTab (~5 scenarios) and MLOpsDeployTab (~5 scenarios). Same pattern as v4.35: one diagnostic sentence per scenario pointing at the most common reasoning error. `{picked && !revealed && hint && <div className="msl-hint">...</div>}`. Brace balance check after each file.

### 3. Premium unlock animation (30 min)
After valid DAI2026 code entry in `AccessGate.jsx` (or wherever confirm fires), replace the current text confirmation with: scale + fade-in transition (~300ms) on the unlocked content, glow pulse on `var(--prime)`, "You're in" heading before content renders. No new localStorage keys. No navigation change.

### 4. HomeTab visual hierarchy divider (20 min)
In `HomeTab.jsx`, signal the shift from session-context sections (TODAY, Role, Guided Paths, Continue, Bookmarks) to the browse section. Increase `paddingTop` on the "All tracks" outer section from `28px` to `40px`, and add a 1px `var(--rim)` horizontal rule above the "All tracks" eyebrow label. Minimal — this is a hierarchy clarification, not a new feature.

### 5. Housekeeping — close #017.1 + #017.2 (30 min)
Fix two open audit findings:
- **#017.1:** `App.jsx` — replace `"'Space Grotesk',sans-serif"` → `var(--font-sans)`, `"'JetBrains Mono',monospace"` → `var(--font-mono)`. `AskTab.jsx` — replace `'Inter, sans-serif'` → `var(--font-sans)`.
- **#017.2:** `App.jsx` `'#000'`/`'#fff'` → `var(--void)`/`var(--white)`. `dbtTab.jsx` `#f97316` → `var(--ember)`. `InterviewPrepTab.jsx` `'#000'` → `var(--void)`.
Brace balance on each modified file. Mark resolved in AUDITS.md summary table.

---

## Blocked

Nothing currently blocked.

---

## Done this session

- ~~ProjectLabTab build hotfixes (v4.35.2) — escaped f-string `${` in CELL_2_CODE and CELL_1_CODE template literals; Vercel parse errors resolved.~~
- ~~ContentMap — visual content map overlay (v4.36) — `Cmd+K` opens domain-grouped tab inventory. Replaces GlobalSearch. Filters live on type. `src/components/ContentMap.jsx`.~~
- ~~pandas + maxWidth + ContentMap mobile (v4.36.2) — pandas added to Pyodide init; maxWidth 900→1080px; ContentMap `.map-grid` CSS class collapses to 1-col ≤480px; input font-size 16px (iOS zoom fix).~~
- ~~ContentMap tree view + ProjectLab roadmap expansion (v4.37) — ContentMap rewritten as zone→domain→tab tree with amber zone spines, connecting lines, inline desc truncation; ProjectLab phase 3/4/5 cards expanded with numbered cell/checkpoint skeletons.~~
- ~~ContentMap mobile polish (v4.37.1) — touch targets minHeight 40/44px, desc hidden <480px via .map-leaf-desc CSS class, kbd hints hidden via .map-kbd-hints, overlay top padding compressed on narrow screens, flex truncation fixed with minWidth:0.~~

---

## What comes after (not for this session)

- **ProjectLabTab Phase 4 — Monitoring** — PSI, KS test, prediction drift, label drift, alerting checkpoint.
- **ProjectLabTab Phase 5 — Deployment Scaffold** — FastAPI, Dockerfile, K8s, CI/CD, AWS mapping callout.
- **Emoji → SVG — highest-traffic tabs only** — HomeTab, CombinatorTab, TrainerTab, StaffLayerTab.
- **Datamart-based ML practice** — build after ProjectLabTab phases 3-5 complete.
- **DefenseDocTab v2** — gap-mapped prep plan, resume cross-reference, round-type selector.
