# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. Loan Default Phase 4 — Deployment Scaffold (1.5 hours)
Final phase of `LoanDefaultTab.jsx`. Phase 4: 5 display-only reference cells, mark-as-read pattern (no PythonCell execution — same as ProjectLab Phase 5). Cell IDs: `loan_cell10`–`loan_cell14`. (loan_cell10) FastAPI `/predict` endpoint with Pydantic request schema including all 6 loan features + response model with `default_probability`, `decision`, `model_version`; (loan_cell11) Dockerfile — same multi-stage pattern as ProjectLab but with loan model artifact; (loan_cell12) K8s Deployment + HPA; (loan_cell13) CI/CD GitHub Actions; (loan_cell14) Regulatory compliance callout — ECOA model card fields: training data demographics, disparate impact test results, threshold documentation, monitoring cadence, appeal process. This last cell is the key differentiator from the Churn lab — no credit model ships without a model card covering regulatory requirements. After Phase 4: render full completion card ("Loan Default Lab Complete"), phase4 state derivations, remove Phase 4 roadmap card.

### 2. Loan Default — CLAUDE.md update (5 min)
`CLAUDE.md` file structure section shows `LoanDefaultTab.jsx` as "Phase 1 complete (v4.42)". Update to reflect Phases 1–3 complete (v4.43), Phase 4 in queue.

### 3. Fraud Detection ProjectLab — Phase 1 (2 hours)
Third ProjectLab dataset. New file `FraudDetectionTab.jsx`. Synthetic 10,000-row transaction dataset (class imbalance 1:200 — 50 fraud out of 10,000). Features: `amount`, `merchant_category`, `hour_of_day`, `user_tenure_days`, `is_international`, `device_fingerprint_age`, `fraud` (binary). Phase 1: schema inspection (note extreme imbalance — SMOTE alone insufficient at 1:200, must use precision/recall tradeoff framing), EDA (fraud distribution by amount tier and merchant category), imbalance audit checkpoint ("with 50 fraud cases in training, which evaluation metric is most informative — AUC, accuracy, F1, or precision@K?"). Correct: precision@K — at 1:200 imbalance, accuracy is misleading (99.5% by predicting all negative), AUC can look good while recall is unusable, F1 at default threshold is meaningless. Precision@K (top K transactions by score that are actually fraud) is the business metric for a fraud operations team with finite review capacity.

### 4. GradientTab changelog entry (10 min)
Add a June 2026 entry to the `CHANGELOG` constant in `HomeTab.jsx` to reflect the major additions this session: Project Lab complete (5 phases), Loan Default lab (3 phases), 2 new Gradient posts, RAG scenarios removed from SystemDesign. Keep entries concise (one sentence each).

### 5. AUDITS.md — log SystemDesign RAG removal as resolved finding (10 min)
Add audit #024 to AUDITS.md documenting the RAG content boundary audit: 6 RAGArchitecture scenarios (`rag1`–`rag6`) removed from SystemDesignTab, transferred to GAL. RetrievalFailures module (HNSW, embedding drift in recommendation) confirmed MSL. Update open findings summary table.

---

## Pending from Avinash's side

- **Formspree ID** — sign up at formspree.io, create a new form, copy the ID (part after `/f/`), replace `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx` line 5, then push.
- **Tally form ID** — create form at tally.so with fields: Company, Role (MLE/DS/MLS/Research), Level (L3/L4/L5/Staff/Principal), Round Type (phone screen/take-home/virtual onsite/onsite), Experience text (paragraph). Publish → copy ID from share URL (part after `/r/`), replace `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid, then push.

---

## Blocked

Nothing currently blocked.

---

## Done this session (v4.42 + v4.43)

- ~~CLAUDE.md + ROLLOUT.md staleness sweep — LoanDefaultTab, data/ dir, FeedbackChip check, Phase 5 check.~~
- ~~Loan Default Phase 1 — schema + EDA + proxy audit (4/5ths rule) + cpL1 ECOA judgment.~~
- ~~Loan Default Phase 2 — split + LR/RF/GBC training + eval/threshold + cpL2 ECOA threshold check.~~
- ~~Loan Default Phase 3 — PSI + KS + prediction drift + denial rate shift + cpL3 alert-or-wait.~~
- ~~SystemDesign RAG audit — 6 rag1–rag6 scenarios removed (LLM context retrieval = GAL). RetrievalFailures kept.~~
- ~~Two new Gradient posts — Feature Store Time-Travel Bug + Validation Set Leakage.~~
- ~~HomeTab domain completion bars — 2px amber fill + done/total count on each track card.~~
- ~~Testimonials section on HomeTab — src/data/testimonials.js + "What engineers say" card grid.~~

---

## What comes after (not for this session)

- **Fraud Detection ProjectLab** (extreme imbalance, precision@K, threshold economics) — after Loan Default Phase 4.
- **Difficulty + industry filter** — requires tagging 200+ scenarios; content work is prerequisite.
- **Freemium gate v2** — per-scenario `isFree` flags, first 2 per module free.
- **Interview Experiences v2** — frequency chart (after N≥15 approved Tally submissions).
- **LandscapeTab country filter** — India/UK/US/EU region field.
- **ModelEvalTab gradient hex** — `#6366f1`/`#22d3ee` (open AUDITS #017.2 finding).
