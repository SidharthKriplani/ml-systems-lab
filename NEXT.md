# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. Loan Default Phase 2 — Model Training & Evaluation (2 hours)
Continue `LoanDefaultTab.jsx`. Phase 2: 3 cells + 1 checkpoint. Cell IDs: `loan_cell4`, `loan_cell5`, `loan_cell6`, checkpoint `cpL2`. Same synthetic 800-row dataset (seed 42). Steps: (loan_cell4) stratified train/val/test split 60/20/20 — same pattern as ProjectLab cell7, note class imbalance 14.2%, discuss SMOTE vs class_weight; (loan_cell5) LR + RF + GradientBoosting training with `class_weight='balanced'`, val AUC + F1; (loan_cell6) ROC / PR curves + confusion matrix + threshold selection — emphasis on cost asymmetry (false negative = bad loan issued vs false positive = credit denied); checkpoint cpL2: "AUC=0.77, ECE=0.14, the bank wants to use a probability threshold of >0.35 to deny loans automatically. Given ECOA requirements, what must you verify before deploying this threshold?" Correct: disparate impact analysis — verify the threshold does not produce adverse impact (>20% difference in denial rate) across demographic groups. AUC and ECE alone are insufficient for deployment sign-off on a credit model. Update phase2 state derivations and progress bar.

### 2. CLAUDE.md file structure — add LoanDefaultTab + data directory (10 min)
`CLAUDE.md` file structure section is missing `LoanDefaultTab.jsx` and `src/data/testimonials.js`. Add both under the correct locations. Also confirm `src/data/` directory entry exists in the file structure block.

### 3. SystemDesign retrieval content boundary audit (45 min)
Read `SystemDesignTab.jsx`. Find all retrieval-related scenarios. Classify each as MSL (ANN / recommendation at scale — HNSW, IVF, candidate generation) vs GAL (RAG-specific — chunking, embedding drift, hallucination from retrieval gaps). Remove or clearly comment out GAL scenarios. Do NOT remove the entire retrieval module — the recommendation-scale ANN content is core MSL. After removal, brace balance check, commit.

### 4. Loan Default Phase 3 — Monitoring (1.5 hours)
Phase 3: 3 cells + 1 checkpoint. Cell IDs: `loan_cell7`–`loan_cell9`, checkpoint `cpL3`. PSI on income/credit_score between training and a "shifted" production sample. KS test on the same features. Prediction drift histogram. Checkpoint cpL3: "PSI=0.22 on annual_income (amber-to-red boundary), 72 hours post-deployment of the loan default model. KS p=0.01 on credit_score. No known business events. Alert or wait?" Correct: alert + investigate — two signals simultaneously post-deployment, one near the red threshold.

### 5. GradientTab — SHAP post video (open/deferred)
StatQuest has no public SHAP-specific video. Leave `youtube: []` on the SHAP post. If a high-quality alternative video (not StatQuest) is found, add it. Otherwise skip.

---

## Pending from Avinash's side

- **Formspree ID** — sign up at formspree.io, create a new form, copy the ID (part after `/f/`), replace `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx` line 5, then push.
- **Tally form ID** — create form at tally.so with fields: Company, Role (MLE/DS/MLS/Research), Level (L3/L4/L5/Staff/Principal), Round Type (phone screen/take-home/virtual onsite/onsite), Experience text (paragraph). Publish → copy ID from share URL (part after `/r/`), replace `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid, then push.

---

## Blocked

Nothing currently blocked.

---

## Done this session (v4.41 + v4.42)

- ~~MD staleness sweep — CLAUDE.md (9-tool count, ProjectLabTab note, components list, SpotTheFlaw count), ROLLOUT.md (Phase 5 check, FeedbackChip, Interview Experience card), AUDITS.md (file path refs).~~
- ~~Testimonials: `src/data/testimonials.js` + HomeTab "What engineers say" section (auto-hides when empty).~~
- ~~Loan Default tab Phase 1 — schema inspection, EDA, proxy feature audit (4/5ths rule), cpL1 ECOA judgment. Wired into App.jsx.~~
- ~~Two new Gradient posts: "Feature Store Time-Travel Bug" + "Validation Set Leakage — Why Your AUC Lied".~~
- ~~HomeTab domain completion bars — 2px amber fill bar + done/total count on each track card when pct > 0.~~

---

## What comes after (not for this session)

- **Fraud Detection ProjectLab** — extreme imbalance (1:200), threshold economics, after Loan Default complete.
- **SystemDesign retrieval content boundary** — RAG scenarios → remove (GAL), ANN/recommendation → keep.
- **Difficulty + industry filter** — requires tagging 200+ scenarios first.
- **Freemium gate v2** — per-scenario `isFree` flags.
- **Interview Experiences v2** — frequency chart (build only after N≥15 approved submissions).
- **ModelEvalTab gradient hex** — `#6366f1`/`#22d3ee` open #017.2 finding.
- **LandscapeTab country filter** — India/UK/US/EU region field.
