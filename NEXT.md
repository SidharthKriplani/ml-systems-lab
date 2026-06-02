# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. Fraud Detection Phase 2 — Model Training + SMOTE (2 hours)
Continue `FraudDetectionTab.jsx`. Phase 2: 3 cells + 1 checkpoint. Cell IDs: `fraud_cell4`, `fraud_cell5`, `fraud_cell6`, checkpoint `cpF2`. (fraud_cell4) stratified split — at 1:200 ratio, stratify is critical to preserve fraud cases in val/test; print fraud count per split with imbalance note; (fraud_cell5) compare two approaches side-by-side: (a) `class_weight='balanced'` — upweights each fraud case ~200x, (b) SMOTE on training set only — print val AUC and P@100 for both with LR/RF/GBC; (fraud_cell6) precision@K curve — plot P@K for K=10 to K=500 for best model, annotate K=100 (team capacity); checkpoint cpF2: "GBC with class_weight: AUC=0.93, P@100=0.64. GBC with SMOTE: AUC=0.91, P@100=0.71. Fraud ops team reviews 100 transactions/day. Which model do you deploy?" Correct: SMOTE model — lower AUC but higher P@100. Key judgment: AUC selects the model architecture; precision@K drives the deployment decision.

### 2. Fraud Detection Phase 3 — Monitoring (1.5 hours)
Phase 3: 3 cells + 1 checkpoint. Cell IDs: `fraud_cell7`, `fraud_cell8`, `fraud_cell9`, checkpoint `cpF3`. PSI on transaction amount and merchant category (as encoded int). KS test on amount, user_tenure_days, device_fingerprint_age. Prediction drift histogram. Checkpoint cpF3: "PSI=0.31 on transaction amount (red zone — above 0.25 retrain threshold), 48h after model deployment. KS test on other features not significant. Fraud rate in production appears unchanged based on analyst feedback (they only see flagged transactions). What do you do?" Correct: alert + investigate immediately — PSI=0.31 is above the retrain threshold; analyst feedback is not reliable (they cannot see what the model is missing); a shift in the amount distribution may be moving fraud cases below the model's score threshold, making them invisible to analysts.

### 3. Fraud Detection Phase 4 — Deployment Scaffold + Ops Runbook (1 hour)
Phase 4: 4–5 display-only reference cells, mark-as-read. Key differentiator from Loan Default: Fraud Ops Runbook instead of Regulatory Model Card. Cells: FastAPI `/score` with <100ms latency requirement (sync, not async); Dockerfile; K8s with latency annotations; Ops Runbook (real-time vs batch scoring decision, escalation path: auto-block vs flag-for-review vs allow, analyst feedback loop feeding retraining, alert suppression protocol for known FP patterns like merchant X always triggering). No ECOA model card — fraud scoring is not a credit decision — but does need a bias audit cell checking whether the model disproportionately flags certain merchant categories or geographic regions. Completion card on `phase4Complete`.

### 4. LandscapeTab — fix open AUDITS finding #017.3 (30 min)
AUDITS.md #017.3: `LandscapeTab.jsx` (a 684-line career intelligence tab covering roles, salaries, market data, ML timeline) has no LINEAGE.md entry — its build history is completely undocumented. Read LandscapeTab.jsx to understand what it contains, when it was likely built, and what its feature set is. Add a LINEAGE.md entry covering: what it contains, which zone (Today), when it was added. Then mark #017.3 resolved in AUDITS.md and update the open findings summary table.

### 5. ModelEvalTab gradient hex — close AUDITS #017.2 (20 min)
Open finding: `ModelEvalTab.jsx` has `#6366f1` and `#22d3ee` hardcoded in a progress bar gradient. Replace with CSS variables: `#6366f1` → `var(--violet)` (if defined in `:root`) or add `--violet: #6366f1` to index.css `:root`. `#22d3ee` → `var(--sky)` (if defined) or add `--sky: #22d3ee`. Check index.css `:root` first — if the vars already exist, just fix the inline style. Brace balance check, commit. Mark #017.2 fully resolved in AUDITS.md.

---

## Pending from Avinash's side

- **Formspree ID** — sign up at formspree.io, replace `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx` line 5.
- **Tally form ID** — create form at tally.so, replace `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid.

---

## Blocked

Nothing currently blocked.

---

## Done this session (v4.42 → v4.44)

- ~~Loan Default Phase 1 — schema + EDA + proxy audit (4/5ths) + cpL1 ECOA judgment.~~
- ~~Loan Default Phase 2 — split + model training + eval/threshold + cpL2 ECOA threshold check.~~
- ~~Loan Default Phase 3 — PSI + KS + prediction drift + denial rate shift + cpL3 alert-or-wait.~~
- ~~Loan Default Phase 4 — deployment scaffold + regulatory model card (7 ECOA fields) — lab complete.~~
- ~~Fraud Detection Phase 1 — schema + EDA + precision@K comparison + cpF1 metric selection judgment.~~
- ~~SystemDesign RAG audit — rag1–rag6 removed (GAL), RetrievalFailures kept (MSL).~~
- ~~Two new Gradient posts — Feature Store Time-Travel Bug + Validation Set Leakage.~~
- ~~HomeTab domain bars + changelog June 2026 entry + testimonials section.~~
- ~~AUDITS #024, CLAUDE.md file structure + session model, METRICS.md keys updated, IDEAS/LINEAGE/DECISIONS staleness fixed.~~

---

## What comes after (not for this session)

- **Difficulty + industry filter** — tag 200+ scenarios; content work prerequisite.
- **Freemium gate v2** — per-scenario `isFree` flags.
- **Interview Experiences v2** — frequency chart (after N≥15 Tally submissions).
- **LandscapeTab country filter** — India/UK/US/EU region field.
- **Simplify toggle for Gradient posts** — build trigger: ≥10 complete posts.
