# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. New user cold-state banner (45 min)
Detect first visit: no `msl_tab`, no `msl_score:*`, no `msl_access` in localStorage. Show one-time orientation banner at top of HomeTab: "New here? Start with Feature Engineering (free) or enter code DAI2026 for full access." Disappears after first tab visit (write `msl_onboarded: 1`). HomeTab only — not Today sidebar.

### 2. Role Readiness Score on HomeTab (1.5 hours)
Aggregate cross-tab scores into per-domain seniority signal. Read all `msl_score:*` keys + `msl_trainer_history` + `msl_combinator_history`. Compute a 0–100 "readiness" per domain (ML Eng, Data Eng, Deep Learning, MLOps, Data Science, Interview). Render as compact bar-per-domain on HomeTab below the TODAY row. No new localStorage keys needed — derives from existing data.

### 3. Project Lab Phase 2 — Feature Engineering (2 hours)
Continue `ProjectLabTab.jsx`. Phase 2: 3 cells (OHE + target encoding → feature scaling + imputation → permutation importance) + 1 judgment checkpoint (leakage: does `avg_spend_last_7d` computed on full dataset before split constitute leakage?). LocalStorage key extension: `checkpointsDone` adds `cp3`. Cell IDs: `cell4`, `cell5`, `cell6`.

### 4. Audit #021 — post-v4.33 state check (1 hour)
Run a focused audit: (a) confirm ProjectLabTab brace-balance and routing correct, (b) verify `msl_projectlab_churn_data` key registered in METRICS.md, (c) check SpotTheFlaw scenario count in GlobalSearch matches 12, (d) spot-check `.msl-cloud-map` renders in MonitoringTab on mobile. Log findings in AUDITS.md.

### 5. Pre-Eval callouts — 3 tabs (1.5 hours)
Add per-scenario diagnostic hint between "option selected" and "explanation revealed" in SystemDesignTab, ModelEvalTab, CausalInferenceTab. Fires as an inline `.msl-hint` callout after pick, before reveal click. Content: one sentence pointing at the most common reasoning error for that specific scenario. ~5 scenarios each tab.

---

## Blocked

Nothing currently blocked.

---

## Done this session

- ~~LINEAGE.md — core Oracle structural changes (index.css, HomeTab.jsx, App.jsx) documented and committed (92fc5e0). Completes the v4.31 entry which agents had left incomplete.~~

---

## What comes after (not for this session)

- **Emoji → SVG — highest-traffic tabs only** — 1 hour. Target HomeTab, CombinatorTab, TrainerTab, StaffLayerTab. Grep for emoji codepoints, replace decorative ones with inline SVG using `currentColor`. Functional glyphs (✓ ✗ →) stay. Reference Audit #016 in AUDITS.md for the full list.
- Pre-Eval Callout pattern — 5 target tabs (SystemDesign, ModelEval, Monitoring, MLOpsDeploy, CausalInference). Content work-heavy.
- Slim scenario index + lazy content loading — bundle audit first (`npm run build` output), then implement if > 1.5 MB.
- DefenseDocTab v2 — gap-mapped prep plan, resume cross-reference, round-type selector.
