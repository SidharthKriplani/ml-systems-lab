# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. Fraud Detection Phase 2 — Model Training + SMOTE (2 hours)
Continue `FraudDetectionTab.jsx`. Phase 2: 3 cells + 1 checkpoint. Cell IDs: `fraud_cell4`, `fraud_cell5`, `fraud_cell6`, checkpoint `cpF2`. (fraud_cell4) stratified split — note that at 1:200 ratio, stratify is critical to preserve fraud cases in val/test; print fraud count per split; (fraud_cell5) compare two approaches: (a) class_weight='balanced' (upweights each fraud case 200x), (b) SMOTE (Synthetic Minority Oversampling) on training set only — print val AUC and P@100 for both approaches with 3 model classes; (fraud_cell6) precision@K curves — plot P@K for K=10 to K=500 for the best model, annotate the team's review capacity (K=100); checkpoint cpF2: "GBC with class_weight achieves AUC=0.93, P@100=0.64. GBC with SMOTE achieves AUC=0.91, P@100=0.71. The fraud ops team reviews 100 transactions/day and measures success by the fraction of reviewed transactions that are real fraud. Which model do you deploy?" Correct: SMOTE model — lower AUC but higher P@100 (the operational metric). This is the key judgment: don't confuse model selection metric (AUC) with deployment metric (precision@K).

### 2. CLAUDE.md — add FraudDetectionTab entry (5 min)
`CLAUDE.md` file structure section is missing `FraudDetectionTab.jsx`. Add after `LoanDefaultTab.jsx` entry: `FraudDetectionTab.jsx ← ML Engineering, third ProjectLab dataset — Fraud Detection (1:200 imbalance, precision@K). Phase 1 complete (v4.44). `msl_projectlab_fraud_data`.`

### 3. METRICS.md — add msl_projectlab_fraud_data key (5 min)
`METRICS.md` localStorage key table is missing `msl_projectlab_fraud_data`. Add: `{ cellsDone: string[], checkpointsDone: string[] }`, set by FraudDetectionTab, same schema as churn and loan default keys. fraud_cell1–fraud_cell(N) + cpF1–cpF(N).

### 4. Fraud Detection Phase 3 — Monitoring (1.5 hours)
Phase 3: PSI + KS test on transaction amount and merchant category distribution. Prediction drift. Checkpoint cpF3: "PSI=0.31 on transaction amount (red zone), 48h after model deployment. No KS significance on other features. Fraud rate in production appears unchanged based on analyst feedback. What do you do?" Correct: alert + investigate — PSI=0.31 is above the 0.25 retrain threshold, even if analyst feedback is positive (they only see what the model flags, not what it misses). Must check if the amount distribution shift is moving fraud cases above or below the model's operating threshold.

### 5. Fraud Detection Phase 4 — Deployment Scaffold (1 hour)
Same pattern as Loan Default Phase 4: display-only cells, mark-as-read. Key differentiator cell: Fraud Ops Runbook — real-time vs batch scoring decision (transactions need <100ms response), escalation path (auto-deny vs flag-for-review vs allow), feedback loop (analyst decisions feed back into retraining data), latency budget. No regulatory model card (fraud is not a credit decision under ECOA) but does need an alert suppression protocol for known false-positive patterns.

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
- ~~AUDITS #024, CLAUDE.md staleness sweep, METRICS.md keys updated.~~

---

## What comes after (not for this session)

- **Difficulty + industry filter** — tag 200+ scenarios; content work prerequisite.
- **Freemium gate v2** — per-scenario `isFree` flags.
- **Interview Experiences v2** — frequency chart (after N≥15 Tally submissions).
- **LandscapeTab country filter** — India/UK/US/EU region field.
- **ModelEvalTab gradient hex** — `#6366f1`/`#22d3ee` (open AUDITS #017.2).
- **Simplify toggle for Gradient posts** — build trigger: ≥10 complete posts.
