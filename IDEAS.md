# IDEAS.md — Build Backlog

Future-facing. Prioritized. Feeds from AUDITS.md findings and creative sessions.  
Last updated: 2026-05-31

**Rule:** AUDITS.md feeds this file, not the reverse. Audit findings that are buildable features go into Tier 1 here. Features you want to build don't go into AUDITS.md.

---

## In Progress

*Move items here from Tier 1 at the start of a session. Strike through and move to LINEAGE.md when done.*

- [x] ~~**Improve distractor quality**~~ — done (2026-05-29, 14 questions across CombinatorTab + TrainerTab, replaced trivially-eliminable wrong options with plausibly-wrong options requiring real reasoning)
- [x] ~~**Share Score clipboard button**~~ — done (2026-05-29, CombinatorTab debrief + TrainerTab ResultsScreen, navigator.clipboard, copied/setCopied 2s toggle)
- [x] ~~**Fidelity/simulation badges**~~ — done (2026-05-29, 6 tabs: ✓ Real execution on SparkLab + ModelsMath, ~ Simulated on Combinator/Trainer/Verbatim/StaffLayer)
- [x] ~~**Streak tracking + 91-day heatmap**~~ — done (2026-05-29, HomeTab — msl_streak/msl_last_visit/msl_activity_YYYY-MM-DD, 7×13 GitHub-style grid, streak pill)
- [x] ~~**ProjectLabTab Phase 1 — Telco Churn notebook**~~ — done (v4.33, 2026-05-30). Cell 1 schema inspection, Checkpoint 1 data quality, Cell 2 EDA dashboard (matplotlib), Cell 3 correlation heatmap + outlier flags, Checkpoint 2 collinearity decision. `msl_projectlab_churn_data`. App.jsx wired. Phases 2–5 remain (see NEXT.md item #3).
- [x] ~~**Oracle identity refactor — single amber accent end-to-end**~~ — done (v4.31–v4.32, 2026-05-30). All 36 files. All decorative multi-color accents (mint/sky/ember/rose/violet/gold) → `var(--prime)`. index.css, HomeTab, App.jsx structural changes + 30 tab files. See LINEAGE.md v4.31.

---

## Tier 1 — High impact, buildable now

### Emoji → SVG replacement (identified 2026-05-29, post v4.14 partial audit)
- [ ] **Full emoji sweep + SVG replacement** — v4.14 cleaned `icon:` data fields and prefix emoji across 18 tabs. Residual emoji remain in rendered UI copy, button labels, section headers, and inline content. Next pass: grep all tab files for emoji codepoints, categorise (decorative → replace with inline SVG using CSS variable colors; functional glyphs like ✓ ✗ → keep; country flags → keep), then replace. SVGs should reference `currentColor` or CSS vars so they theme correctly. Run audit #009 first to get the full per-tab list before starting.

### Mobile layout verification (identified 2026-05-29, after v4.16)
- [x] ~~**HomeTab TODAY row on narrow screens**~~ — done (v4.28) — `@media (max-width: 480px)` stacks TODAY row columns vertically via `.today-row` class + `<style>` block in HomeTab.jsx.

### Positioning & Discoverability (from external review, May 2026)
- [x] ~~**README positioning rewrite**~~ — done (v4.28) — judgment-gap hook opens, 4 differentiators foregrounded (Pyodide, Web Speech, StaffLayer, CodeBugs), Interview zone flagship section, domain grid moved lower.
- [x] ~~**New user cold-state entry path**~~ — done (v4.35, 2026-05-31). `msl_onboarded` key, amber banner with Feature Engineering link + DAI2026 badge, dismisses permanently on click or tab visit.
- [ ] **Social proof signal** — the repo looks identical with 0 users or 10,000. When there are verifiable numbers (beta signups, tester count, any usage metric), add a single line to the README. Even "used by N engineers in their interview prep" changes the perception from "is this maintained?" to "real users exist." ~10 min whenever the data is available. (Source: external review, May 2026)

### HomeTab polish (identified 2026-05-29, post v4.16)
- [x] ~~**Activity widget: hide heatmap when sparse**~~ — done (v4.28) — ≤3 active days shows "Day {streak} — keep going" text instead of mostly-empty grid.
- [x] ~~**Continue bar: only show if pct > 0**~~ — done (v4.23) — bar suppressed when `pct === 0`.
- [x] ~~**HomeTab visual hierarchy**~~ — done (v4.38). `paddingTop` on "All tracks" section `28px` → `40px`; `<hr style={{ borderTop: '1px solid var(--rim)' }} />` added above section eyebrow.
- [ ] **Domain completion bars on HomeTab** — PAL's Progress page shows per-room completion bars (e.g., "Stats 1/20", "RCA 1/24") which makes domain progress instantly readable. MSL's HomeTab has streak and activity data but doesn't show "X of Y scenarios completed in this domain." Implementation: read `msl_score:*` keys (already exist per-tab), map to known scenario counts per tab, render compact bars in the "All tracks" section — tab name, X/total count, thin progress bar. ~1 hour. The data is already in localStorage; this is purely a display change. (Source: PAL comparison, May 2026)

### Learning Path
- [x] ~~**Guided learning paths with sequenced module order**~~ — done then removed (built 2026-05-27; removed v4.15 2026-05-29 — duplicated Practice zone nav, role selector 3-step sequence covers the same job more lightly)

### Learning Quality (from Audit #008)
- [x] ~~**Expand MCQ explanations to include production failure mode + recognition signal**~~ — done (2026-05-27, 190 explanations expanded across CombinatorTab + TrainerTab with "In production, this breaks as: [X]. The tell: [Y]." pattern)
- [x] ~~**Improve distractor quality in CombinatorTab and TrainerTab**~~ — done (2026-05-29, 14 questions fixed, 2-of-3 wrong options now require genuine judgment)
- [x] ~~**Add StaffLayerTab scenarios in thin domains**~~ — done (2026-05-27, 6 new scenarios: Experiment Design ×4 (SRM, novelty effect, 12 simultaneous tests, SUTVA), Feature Engineering ×2 (covariate shift, leakage). Total 17 → 23)
- [x] ~~**Fix IC3 strawman reveals in StaffLayerTab**~~ — done (2026-05-27, s1 and s2 IC3 revised to competent-but-incomplete responses)

### Content
- [x] ~~**"Do we even need ML?" scenario type**~~ — done (v4.27) — SystemDesignTab "Do We Need ML?" module: 3 scenarios (churn email ROI, support ticket classifier, fraud at 0.001% base rate). See LINEAGE.md v4.27. Seed scenarios: (1) churn prediction where the action is "send an email" → correct answer is just send everyone the email; (2) support ticket auto-categoriser, 8 categories, 2 tickets/day → ML ROI is negative, regex + human triage wins; (3) "AI-powered" fraud flag where the fraud rate is 0.001% → precision/recall economics make a rules engine better. Core judgment: what's the counterfactual action? What volume justifies the model? What's the real cost of a false positive vs. a simpler system? Reveal should model the PM/engineer dialogue cadence from the post — short Socratic questions that expose the assumption. Ties directly into StaffLayerTab's "kill more projects than you ship" ethos. (Source: LinkedIn post, May 2026)
- [ ] Add 5+ Gradient posts — priority order: "feature store time-travel bug" → Feature Engineering, "validation set leakage" → Feature Engineering, "Forecast Failure Zoo" → Time Series, "two failure modes of A/B tests" → Experimentation cross-link, "quantization from first principles: what FP16 throws away" → DL Serving
- [ ] Add YouTube embed IDs to remaining Gradient posts (currently only 3 have videos)
- [x] ~~**Interview Q&A: expand to 100+**~~ — already at 128 questions (confirmed 2026-05-29)
- [x] ~~**TrainerTab: expand MCQ bank from 30 → 60**~~ — already at 60 questions (confirmed 2026-05-29)
- [x] ~~**CombinatorTab: expand question bank from 50 → 100**~~ — already at 100 questions (confirmed 2026-05-29)

### First-Time User friction (from Audit #007)
- [x] ~~**Rename "Ask" zone → "Search"**~~ — done (nav label is 'Search', zone id stays 'ask')
- [x] ~~**Rename Practice-zone "Interview Tools" domain card to "Drills"**~~ — done (domain label is 'Drills')
- [x] ~~**Add numbered sequence labels to Interview zone hub cards**~~ — done (v4.10, steps 01/02/03 on Defense Plan/Combinator/Verbal)
- [x] ~~**Add "Start here" pinned row to GradientTab**~~ — explicitly rejected (2026-05-29). "Start here" is prescriptive and adds friction. The Series + Tags redesign (see Tier 2) replaces this with user-driven navigation.

### HomeTab redesign (from PAL screenshot review, May 2026)
- [x] ~~**"Jump Back In" chip**~~ — done (2026-05-29, amber pill top of HomeTab, reads msl_tab, navigates on click)
- [x] ~~**"Today's Case" featured card**~~ — done (2026-05-29, DAILY_CASES array 15 scenarios, date-seeded rotation, domain badge + scenario text + nav)
- [x] ~~**HomeTab hero copy fixes**~~ — done (2026-05-29, dropped "You can train a model.", new headline "Production ML breaks in silence. / Can you find it?", tightened sub-headline)
- [x] ~~**Role selector CTA labels**~~ — done (2026-05-29, ROLE_SEQUENCES map, numbered 3-step path shown in active role panel)

### Freemium gate v2 — granular scenario-level difficulty gating
- [ ] **Tag all 200+ scenarios by difficulty (easy/junior/mid/senior/staff)** — v1 gate is tab-level (free = 4 intro tabs, premium = everything else). v2 should gate within free tabs too: easy/junior scenarios free, medium/hard gated. Requires a `difficulty` field on every scenario object and a `PremiumGate` wrapper in each tab that slices to free content. ~3-4 hours content work + 2 hours implementation. (Source: freemium architecture decision, May 2026)

### Mobile fixes (from Audit #015, 2026-05-27) — v4.8 sprint complete
- [x] iOS input zoom — `font-size: 16px` in `index.css` ✅
- [x] SVG diagrams fixed-width overflow — `maxWidth: '100%'` on both SVGs ✅
- [x] MLOpsDeployTab metrics table clipped — wrapped in `overflowX: auto` ✅
- [x] VerbatimTab iOS Safari fallback — UA detection + platform-specific message ✅
- [x] Topbar back button tap target — padding `10px 8px`, negative margin ✅
- [x] CombinatorTab timer drift after zone switch — `savedAt` timestamp, elapsed subtraction on restore ✅
- [x] VerbatimTab onend double-fire — `isStoppingRef` guard ✅
- [x] DefenseDocTab print CSS — visibility pattern, `@page` margins ✅
- [ ] Pyodide mobile warning — cold start / OOM risk on low-end phones (Source: Audit #015.7) — deferred
- [ ] InterviewPrepTab line length — `maxWidth` + `lineHeight` cap on mobile (Source: Audit #015.10) — deferred

### Modules
- [ ] Behavioral question bank in Interview zone — ML-specific situations (disagreed with a metric, shipped despite uncertainty, stakeholder conflict over model decision)
- [ ] Causal Inference: DAG editor — draw causal graph, identify confounders/colliders/mediators interactively (Pyodide)
- [ ] **ML Interview Coding Rounds** — problem bank scoped tightly to ML-specific Python that appears in real senior/staff interviews: implement a custom loss function, write vectorized feature engineering without a loop, build cross-validation from scratch, debug a broadcasting error, write a custom sklearn transformer. Explicitly NOT generic Python (no algorithms, no string manipulation) and NOT LeetCode-style DSA. Runs in Pyodide with real output validation; judgment checkpoint fires after each correct solution ("your implementation is correct — but what breaks if the input has NaN?"). The gap this fills: StrataScratch owns SQL, LeetCode owns DSA, nothing owns ML-specific Python execution for interview prep. **Build trigger:** open-cell infrastructure exists (ProjectLabTab v2) AND problem set is validated against documented ML interview failure modes — don't build until both conditions hold. (Source: session discussion, 2026-05-30)

### Project Lab — end-to-end DS/MLE notebook tab (identified 2026-05-29)

- [x] ~~**`ProjectLabTab` — ALL 5 PHASES COMPLETE (v4.33–v4.40).**~~ Full end-to-end Telco Churn pipeline: Phase 1 (data ingestion + EDA), Phase 2 (feature engineering), Phase 3 (model training + calibration), Phase 4 (monitoring — PSI, KS, prediction drift, label drift), Phase 5 (deployment scaffold — FastAPI, Dockerfile, K8s, CI/CD, AWS mapping). 19 cells, 5 judgment checkpoints. Second dataset (Loan Default) is next — see Tier 1 above. Sequential Pyodide notebook, Telco Churn dataset, practice zone ML Engineering. Phase 1 = data ingestion + EDA (3 cells + 2 checkpoints). Phase 2 = feature engineering (3 cells + 1 checkpoint). Phase 3 = model training & evaluation (4 cells + 1 checkpoint, synthetic 600-row data, v4.38). Remaining phases:

**Why this is Tier 1:** DS and MLE roles increasingly expect candidates to demonstrate the full loop — not just "what would you do?" (judgment) but "show me the code" (execution). MSL currently has the judgment layer. Project Lab adds the execution layer, with Pyodide handling data science and annotated scaffolds covering deployment.

**Format:** Sequential notebook — cells run in order, each cell's output feeds the next. Not AccordionMCQ. Closest analogy: a Jupyter notebook embedded in MSL with judgment checkpoints between sections.

**Datasets (3–4, fixed, pre-loaded in JS):**
- Churn prediction (telco): binary classification, class imbalance, business interpretation
- Loan default (credit): risk scoring, calibration-critical, regulatory framing
- Fraud detection (transactions): extreme imbalance, precision/recall tradeoff, latency constraint
- House price regression: continuous target, feature importance, residual diagnostics

**Cell sequence per project:**

*Phase 1 — Data (Pyodide, real execution):*
1. Schema inspection — dtypes, nulls, cardinality, duplicates
2. EDA — distribution plots (matplotlib), class balance, correlation heatmap, outlier flags
3. Data quality judgment checkpoint: "3 issues found — which would you fix before training?"

*Phase 2 — Features (Pyodide, real execution):*
4. Feature engineering — encoding (OHE/target), scaling, imputation strategy, interaction terms
5. Feature importance — permutation importance or SHAP values (sklearn)
6. Leakage check judgment checkpoint: "Does feature X constitute leakage for this use case?"

*Phase 3 — Model (Pyodide, real execution):*
7. Train/val/test split — stratified, correct ordering (no future leakage)
8. Model training — LogisticRegression + RandomForest + XGBoost, side-by-side
9. Evaluation — precision/recall/AUC/F1, confusion matrix, threshold selection
10. Calibration — reliability diagram, ECE (Expected Calibration Error), Platt scaling vs. isotonic regression
11. Deployment judgment checkpoint: "AUC = 0.81, ECE = 0.12, p95 latency = 38ms, class imbalance 1:20 — would you ship this?"

*Phase 4 — Monitoring (Pyodide, real execution):*
12. PSI (Population Stability Index) — compute on held-out "production" split, interpret bands (<0.1 stable, 0.1–0.25 monitor, >0.25 retrain)
13. KS test — Kolmogorov-Smirnov for distribution shift on numerical features
14. Prediction drift — output score distribution shift over time
15. Label drift (conceptual + code stub) — when ground truth labels arrive, how to detect and act
16. Data quality monitoring — null rate drift, out-of-range values, schema violations
17. Alerting judgment checkpoint: "PSI = 0.19 on user_age, KS p-value = 0.03 on income — page immediately, log and watch, or auto-rollback?"

*Phase 5 — Deployment scaffold (code blocks, annotated, not runnable until backend lands):*
18. FastAPI app — model loading, `/predict` endpoint, input validation (Pydantic), response schema, error handling
19. Dockerfile — multi-stage build, model artifact copy, uvicorn entrypoint, health check
20. Kubernetes manifest — Deployment + Service + HPA (horizontal pod autoscaler), resource limits, liveness/readiness probes
21. CI/CD stub — GitHub Actions workflow: test → build → push to ECR → apply manifest
22. AWS mapping callout: FastAPI → ECS/ECR or Lambda, K8s → EKS, monitoring → CloudWatch + SageMaker Model Monitor

**Judgment layer (woven throughout):** At each checkpoint, user selects from 3–4 options and sees a reveal explaining the production reasoning. Same `.msl-option-btn` + `.msl-reveal-panel` pattern. These are the interview moments — not the code, but the decisions the code surfaces.

**Implementation notes:**
- New tab `ProjectLabTab.jsx` in Practice zone, zone: `practice`, domain: ML Engineering
- Pyodide cells use existing `PythonCell.jsx` wrapper
- Datasets bundled as JS arrays (small enough: 500–1000 rows, 10–15 features)
- Deployment phase: static code blocks with syntax highlighting, copy button, annotation overlays
- Each phase completable independently — progress stored in `msl_projectlab_{dataset}_{phase}` localStorage keys
- Estimated build: 2–3 days. Content (Python scripts, annotations, judgment questions) is the long pole.

**What this is not:** A Jupyter replacement or a generic coding sandbox. Every cell has a purpose tied to a production decision. The notebook is the vehicle; the judgment checkpoints are the product.

**Companion Gradient posts:** Each ProjectLabTab phase ships with a corresponding Gradient post — narrative walkthrough of the same pipeline phase, ending with a CTA back to the tab. This is the ProjectPro read→run loop, correctly scoped: ProjectLabTab IS the end-to-end notebook, Gradient posts ARE the explanatory layer. No separate "ProjectPro-style notebooks track" needed.

(Source: lab diagnosis + DS/MLE role analysis, May 2026)

### Cloud/service mapping layer (identified 2026-05-29, post lab diagnosis)
- [x] ~~**AWS/cloud service callouts on MLOps/deployment/monitoring scenarios**~~ — done (v4.30, 2026-05-30). `.msl-cloud-map` + `.msl-cloud-chip` added to index.css. 30+ scenario reveals across MonitoringTab (8 callouts), MLOpsDeployTab (18+ callouts), MLOpsPipelinesTab (12+ callouts) received AWS service panels. SageMaker Model Monitor, CloudWatch, SageMaker Pipelines, Feature Store, Clarify, ECR, CodeDeploy, Step Functions, MWAA, etc. StaffLayerTab and SystemDesignTab remain targets if cloud coverage is extended in a future pass.

### "Spot the Flaw" adversarial format (new tab in Interview zone)
- [x] ~~**New format: Spot the Flaw**~~ — done (v4.28) — 10 scenarios across 5 flaw categories (Data Leakage, Evaluation Error, Distribution Shift, Metric Mismatch, Labeling Artifact). Interview zone, premium, full App.jsx routing + GlobalSearch. See LINEAGE.md v4.28.

Original spec (archived):
**Show a real-looking ML analysis/pipeline with a buried methodological flaw — user must find it.** Critical distinction: CodeBugsTab covers code-level bugs (syntax, logic, wrong API call). Spot the Flaw covers methodology-level errors — the system doesn't tell you there's a flaw, you have to find it. This is the higher-order judgment skill interviewers actually test when they say "what would you check first?" Flaw types: data leakage in evaluation, train/test split after imputation, wrong metric for class imbalance, SRM in A/B test, silent feature drift, imputer fit on full dataset, eval metric computed before target lag, peeking at results early, multiple testing without correction, Simpson's paradox in segmented metrics, novelty effect misread as treatment effect, selection bias in experiment enrollment, SUTVA violation, p-hacking via subgroup search, regression to the mean. Format: show analysis with context (code snippet or narrative), ask "what's wrong here?", user selects from 4-6 options (flaw category + location), reveal shows exact failure mode and production impact. Seed: 12 scenarios across Feature Eng, Model Eval, Experimentation, Monitoring. Tab: new "Spot the Flaw" tool in Interview zone (sits between CodeBugsTab and CaseStudiesTab). PAL (experimentation-systems-lab) confirmed this format works — 12 adversarial cases with strong engagement. (Source: PAL experimentation-systems-lab, confirmed May 2026)

### Learning loop completeness (from GenAI Systems Lab + PAL, May 2026)
- [x] ~~**Pre-Eval Callout pattern**~~ — done (v4.35 + v4.38). `.msl-hint` callout present in all 5 tabs: SystemDesignTab, ModelEvalTab, CausalInferenceTab (v4.35), MonitoringTab, MLOpsDeployTab (v4.38). 5 scenarios each. Fires before pick in MonitoringTab/MLOpsDeployTab (immediate reveal on pick); fires before reveal button in other tabs.
- [x] ~~**Module endings with forward pointer**~~ — partially done (v4.23 + v4.28). ForwardPointer component exists in 10 tabs: SystemDesignTab, FeatureEngTab, ModelEvalTab, MonitoringTab, DeepLearningTab, ClassicalMLTab, MLOpsDeployTab, CombinatorTab, DataScienceTab, SparkLabTab. Remaining: FeatureEngTab all modules, ClassicalMLTab all modules, CausalInferenceTab, TimeSeriesTab, AirflowTab, dbtTab, DataModelingTab, StaffLayerTab, TrainerTab, CaseStudiesTab.

### Architecture (from PAL, May 2026)
- [ ] **Design token enforcement + structural token extraction** — Color token system is ~80% done but hardcoded hex/font values keep creeping in because nothing stops them at write time. Two-part fix: (1) Pre-commit grep habit — run `grep -rn --include="*.jsx" "#[0-9a-fA-F]\{3,6\}" src/tabs/` for stray hex before every commit. Catches violations the build never would. (2) Structural token extraction — three raw values repeat 5+ times across tab files with identical intent and should become `:root` variables: `--card-bg` (repeated card background), `--section-gap` (top-of-section paddingTop), `--card-pad` (card inner padding). These are the highest-ROI additions beyond colors — change one value, all 30 tabs update. Do NOT attempt to tokenize every spacing value (every `padding: '16px 24px'`, etc.) — that's a 2,000-line refactor with marginal benefit on a solo project. Scope: colors fully enforced + 3 structural tokens + grep check = 90% of the system-wide-change benefit at ~2 hours of work. **Build trigger:** #017 housekeeping complete AND a grep scan shows 5+ repetitions on candidate token values. (Session discussion, 2026-05-31)

- [ ] **Slim scenario index + lazy content loading** — PAL separates scenario routing/paywall metadata (id, isFree, title, domain) from full scenario content (question, options, explanation, code snippets). Full content loads only when a case is opened. At 200+ scenarios across 30 tabs, ML Systems Lab likely bundles all scenario data on initial load — every `SCENARIOS`, `QUESTIONS`, `BUGS` constant in every tab file is eagerly imported. Run a bundle size audit first (`npm run build -- --reportCompressedSize` or check Vite bundle analyzer output). If bundle > 1.5 MB, this architectural split is the fix. PAL fixed this in V4.20 and it was listed as P0. (Source: PAL App.jsx architecture, May 2026)

### Features
- [x] ~~**"Share Score" clipboard button on CombinatorTab debrief and TrainerTab session end**~~ — done (2026-05-29)
- [x] ~~**91-day practice heatmap**~~ — done (2026-05-29, HomeTab, 7×13 grid, msl_activity_YYYY-MM-DD)
- [x] ~~**Streak tracking**~~ — done (2026-05-29, HomeTab, msl_streak / msl_last_visit)
- [x] ~~**Fidelity/simulation badges on module headers**~~ — done (2026-05-29, 6 tabs)
- [x] ~~**Premium unlock moment**~~ — confirmed done in prior session (pre-v4.38). `AccessGate.jsx` has `showMoment` state, `ag-unlock-in` CSS animation (scale 0.88→1, fade-in 0.35s cubic-bezier), `ag-prime-glow` animation (amber glow pulse 1.1s), "You're in." heading, "Everything is unlocked on this device." message. No additional work needed.
- [ ] **RSS feed for Gradient posts** — generate `/rss.xml` at build time from `gradientPosts.js` metadata. 20 most recent posts. Adds a distribution channel for free. ~30 min to write a Vite plugin or pre-build script. (Source: GenAI Systems Lab, May 2026)

---

## Upgrades — rewrites and merges of existing components

*Items here affect existing UX and have a different risk profile from new features. Different from bug fixes (those go in Known Bugs) and new content (those go in Tier 1). Spin this section out into UPGRADES.md if it grows past 5 items.*

### ~~JDPrepTab + DefenseDocTab → unified Interview Strategy tool~~ — done (2026-05-29, Defense Plan, v4.10)

Merged into **Defense Plan** (DefenseDocTab). 3-screen flow: JD parse → self-rate + horizon → gated day plan. Internal gate at 35% of plan sections. JDPrepTab retired (redirect stub). See LINEAGE.md v4.10.

### Second ProjectLab dataset — Loan Default (Phases 1–3 done v4.42–v4.43, Phase 4 in queue)

**Phase 1 shipped (v4.42):** `LoanDefaultTab.jsx` — schema inspection, EDA, proxy feature audit (4/5ths rule on home_ownership + employment_length), cpL1 ECOA judgment checkpoint. Synthetic 800-row dataset. Wired into App.jsx as premium tab in ML Engineering domain. Phases 2–4 remain.

### Second ProjectLab dataset — Loan Default (original spec, phases 2–4 remain)

**Ordering rationale (from session discussion, 2026-06-02):** Finish all 5 phases of Telco Churn first. Do not add a new dataset while Phase 4 or 5 are unbuilt — one complete pipeline is more valuable than two incomplete ones. After Phase 5: **Loan Default** is the highest-value next dataset, not Fraud Detection. Reasons: (1) introduces regulatory framing (fairness, disparate impact, model card requirements) that nothing in MSL currently covers, (2) business cost asymmetry (false negative = bad loan issued, false positive = credit denied) teaches threshold selection more viscerally than churn does, (3) calibration-critical context — a 5% ECE gap has compliance consequences here, not just business ones. Fraud Detection is strong for extreme imbalance (1:200) but that judgment is partially addressed in the churn cp4 checkpoint. Loan Default adds a genuinely new judgment dimension.

**Ordering:** Churn (done through Phase 5) → Loan Default → Fraud Detection. Not all three simultaneously.

**Build trigger:** ProjectLab Phase 5 (Deployment Scaffold) shipped. Loan Default dataset selected and bundled (~500 rows, 18 features). ~2–3 sessions. (Source: session discussion, 2026-06-02)

---

### ~~Content boundary audit — SystemDesign retrieval scenarios vs GAL~~ — done (v4.43)

**Finding (session discussion, 2026-06-02):** SystemDesignTab contains scenarios about retrieval systems. Some of these belong in MSL; some belong in GAL (GenAI Systems Lab). The distinction:

- **Belongs in MSL:** ANN / vector search for recommendation at scale — candidate generation, approximate nearest neighbor, HNSW vs IVF tradeoffs, index staleness, retrieval quality degradation. These are production ML infrastructure decisions that every MLE at a platform company faces.
- **Belongs in GAL:** RAG-specific scenarios — chunking strategy, embedding drift, hallucination rate from retrieval gaps, context window budget allocation. These are LLM-systems concerns and belong in a GenAI-focused product.

**Action required:** Audit every retrieval-related scenario in SystemDesignTab individually. Classify per-scenario (MSL vs GAL). Scenarios classified as GAL get removed from MSL on next SystemDesignTab content pass. Do not remove the whole retrieval module — the ANN/recommendation content is core MSL. (Source: session discussion, 2026-06-02)

---

### AttentionHeadVisualizer — audit and retirement candidate

**Finding (session discussion, 2026-06-02):** The `AttentionHeadVisualizer` in DeepLearningTab (v4.29) is the weakest content in that tab from a production-judgment standpoint. Understanding what each attention head specializes in (local syntax, semantic clustering, boundary detection, subject-predicate) is research-level intuition, not a decision a production ML practitioner makes. It's impressive to look at but doesn't teach a choice you'd make in a real system.

**What to keep:** Architecture Decision Lab (CNN vs ViT, TFT vs LSTM, MoE vs dense) is solid MSL content — these are real architecture choices practitioners make. DLFineTuning and DLServing content belongs. Transformers-in-production is absolutely MSL territory; pure attention visualization is not.

**Recommended action:** Don't remove this sprint — it's built and working and not causing harm. Revisit when a replacement interactive module is ready (e.g., a "Fine-tuning cost vs. performance" judgment scenario, or a "when to quantize vs distil" decision tree). The retirement candidate is the `AttentionHeadVisualizer` module specifically, not all transformer content. (Source: session discussion, 2026-06-02)

---

### Company logos in LandscapeTab

**Concept (session discussion, 2026-06-02):** Add company logos to LandscapeTab company cards (companies that hire ML engineers). Visual credibility — a user browsing "who hires ML engineers" sees recognisable logos next to role/salary data.

**Implementation:** Use Clearbit Logo API (`https://logo.clearbit.com/{domain}`) — free for low-volume usage, returns a PNG given a company domain. Alternatively Simple Icons (open source SVGs). Fallback: first-letter monogram on `var(--prime)` background if logo fails to load.

**Scope:** LandscapeTab company cards only — not Interview Experiences (logos there are fragile, companies rebrand) and not Defense Plan (too complex). One placement, one implementation pattern, evaluate before expanding.

**Trademark note:** Every major job board (LinkedIn, Glassdoor, Levels.fyi) displays employer logos without issue. Risk is theoretical for a non-commercial learning tool.

**Build trigger:** LandscapeTab company cards have domain name data available. ~1 hour. (Source: session discussion, 2026-06-02)

---

### Simplify toggle for Gradient posts (pre-generate at build time)

**Concept (session discussion, 2026-06-02):** A toggle on each Gradient post that renders a simplified version of the content — same insight, plainer language, less assumed background. Borrowed from GAL's Ground Truth "Simplify" button.

**Why MSL implementation differs from GAL:** GAL likely calls an AI API at runtime (exposes a key or requires a backend). MSL has neither. Correct approach: run a one-time build script that calls Claude API per post, stores `simplifiedBody` alongside `body` in `gradientPosts.js`, toggle just swaps which string renders. Zero runtime cost, zero API exposure. Pre-generate once per post, regenerate only if the post content changes.

**Build trigger:** Post backlog reaches ≥10 complete posts. Do not build the toggle infrastructure while only 5 posts exist — the overhead outweighs the payoff. (Source: session discussion, 2026-06-02)

---

### Testimonials & User Feedback system (session discussion, 2026-05-31)

**Concept:** In-app feedback form (3 rating questions + written comment) → external form service → admin review → hardcoded `src/data/testimonials.js` → public testimonials section in the app.

**Why this matters now:** The product has no social proof signal. A user arriving from a cold referral sees nothing that tells them other engineers have used and found this valuable. A single curated testimonials section (even 4–5 real quotes) changes the trust signal completely. This is the minimum viable credibility layer.

**Implementation architecture (no backend required):**
- In-app form: floating "Rate this" chip (bottom-right of screen, persistent across all tabs) — not "at the end of every tab" (too aggressive, disrupts flow). Chip opens a modal with: (1) 3 rating sliders on 1–5 scale — "How useful was this session?", "How close to real interview difficulty?", "Would you recommend to a peer?"; (2) optional written comment field (min 20 chars, max 500). Form submits to **Tally.so** (free, embeddable, no backend) or **Formspree** — both support JSON/form-POST to email + spreadsheet.
- Admin flow: Tally/Formspree forwards submission to Avinash's email → review for quality and substance → add approved entries to `src/data/testimonials.js` array with fields `{ name, role, company, rating, text, date, approved: true }` → Vercel deploy picks up the change automatically.
- Testimonials display: new section on HomeTab (or a standalone card in the Today zone) — reads from `src/data/testimonials.js`, shows 3–5 rotating quotes, amber accent, name + role + company. Zero localStorage keys. Zero backend.

**Rating questions (final, max 3):**
1. "How useful was this session for your interview prep?" (1–5)
2. "How realistic is the difficulty compared to actual interviews?" (1–5)
3. "Would you recommend ML Systems Lab to a peer?" (1–5)

**What makes a submission approvable:** Specific mention of a feature or scenario, actual use context (e.g. "prepping for [company]"), non-generic text. Generic ("great app!") gets discarded. Edited for brevity before publishing — name field allows first-name-only or anonymous.

**Build trigger:** Tally/Formspree service selected, 3 rating questions finalized, testimonials.js schema agreed. ~2 hours total. (Source: session discussion, 2026-05-31)

---

### Interview Experiences — submission, curation, and skills frequency visualization (session discussion, 2026-05-31)

**Concept:** Community-sourced interview experience database. Users paste their interview experience as free text → completeness check → admin processes and tags → structured data base → bubble/radar chart showing which skills appear most frequently across real ML interviews.

**Why this is valuable:** No existing resource aggregates ML interview skill frequency from actual reported experiences in a structured, visual way. Glassdoor is noise. Reddit is scattered. A curated, visually-represented frequency map ("45% of ML interviews in this dataset covered system design; 72% covered statistics") built from real reports is a defensible data moat that gets richer over time.

**Implementation architecture (no backend required, manual curation v1):**
- **Submission:** User clicks "Submit Interview Experience" (button in Interview zone or Today zone) → redirects to a Tally form with fields: company (dropdown + freetext), role (MLE/DS/MLS/Research), level (L3/L4/L5/Staff/Principal/Other), round type (phone screen/take-home/virtual onsite/onsite), experience text (freetext, 100–1500 words). Tally sends to Avinash's email.
- **Completeness heuristic (client-side pre-filter):** Before opening the external form, a brief client-side check: minimum 50 words in the preview text field, at least one of a short keyword list present (`question`, `round`, `asked`, `interview`, `problem`, `assessment`). Completeness check is advisory — it tells the user "this looks thin, are you sure?" rather than hard-blocking. The real filter is admin review.
- **Admin processing:** Avinash reads submission → if substantive (specific questions asked, round type clear, company identifiable) → extracts skill tags from a fixed taxonomy → adds to `src/data/interviewExperiences.js` with schema `{ id, company, role, level, roundType, skills: string[], rawText: string, date, approved: true }`. Skill taxonomy (fixed, agreed before build): `ml_fundamentals`, `statistics`, `system_design`, `coding_ml`, `coding_general`, `experimentation`, `product_sense`, `deep_learning`, `sql`, `behavioral`.
- **Skills frequency visualization:** React component reading from `interviewExperiences.js` — counts skill tag frequency across all approved entries, normalizes, renders as a horizontal bar chart or bubble chart (bubble size = frequency). Filters: by role, level, company tier (FAANG / growth / startup). Shows "based on N interview reports." Updates automatically as more entries are approved and deployed. No real-time, no backend — just a Vite build picking up the updated data file.

**Schema decision — required before build:**
```js
{ id: 'exp_001', company: 'Google', companyTier: 'faang', role: 'MLE', level: 'L5',
  roundType: 'virtual_onsite', skills: ['system_design', 'ml_fundamentals', 'coding_ml'],
  rawText: '...', date: '2026-05-31', approved: true }
```

**What makes a submission processable:** Company named (anonymous ok if role + level clear), round type identified, at least 2 distinct question topics mentioned. Pure sentiment ("the interviewer was nice") without technical content = discarded.

**What "complete enough" means in practice:** If Avinash can extract ≥2 skill tags from it, it's processable. If it's one sentence or purely emotional content, it's discarded. No AI processing in v1 — manual extraction is fast once the taxonomy is fixed.

**Phase gating:**
- v1 (submit + curate): Tally form + admin adds to data file + no visualization yet. Start collecting before building the chart — wait for 15–20 real submissions before the chart has signal.
- v2 (visualization): Bubble/bar chart component, filters by role/level/company tier. Build when N≥15 approved entries.
- v3 (open): Consider showing individual experience cards (with permission) alongside the aggregate chart.

**Build trigger:** Tally form schema agreed, skill taxonomy finalized, `interviewExperiences.js` schema confirmed. v1 ~1 hour. v2 ~2 hours. (Source: session discussion, 2026-05-31)

---

## Tier 2 — High impact, more effort

### ~~Content map / command palette~~ — done (v4.36, 2026-05-31)

`Cmd+K` now opens `ContentMap.jsx` — domain-grouped visual inventory of all 30+ tabs. Default state: grouped by Practice domains, Interview tools, Read·Today. Filtered state: live filter on label/desc/domain string. Pro badge on locked tabs. Replaces GlobalSearch as primary Cmd+K target. GlobalSearch retained in codebase but no longer wired. (Source: session discussion, 2026-05-31)

---

### Datamart-based ML practice (identified 2026-05-30)

**Concept:** Wide, low-cardinality datamarts (100–200 rows, 15–25 columns, 3–5 tables) as the grounding layer for ML judgment modules. Instead of reading "the dataset has a column `avg_spend_last_7d` computed before the split," users see the actual schema, sample rows, null counts, and dtypes before answering. The data is the scenario.

**Why it fits MSL:** Judgment questions grounded in real-ish data are harder and more realistic than prose descriptions. A user inspecting a 22-column SaaS datamart with a `plan_cancelled_at` column before answering "which feature constitutes leakage for churn?" is doing real ML reasoning. Pure MCQ against a text description is not.

**Datamart inventory (target: 10–15):**
- E-commerce — orders, users, sessions, products (wide, denormalized)
- SaaS — subscriptions, feature_usage, accounts, churned_users
- Fintech — transactions, wallets, fraud_signals, user_profiles
- Consumer app — events, dau_snapshots, content, follows
- Healthtech — appointments, outcomes, engagement, providers

Each datamart: 3–5 tables, 100–200 rows, 15–25 columns, deliberate messiness baked in — nulls in meaningful places, one dtype issue, one obvious leakage column, edge cases in the target distribution.

**Execution layer:** Pyodide (already in codebase via `PythonCell.jsx`). Data ships as a JS array, loaded as `pd.DataFrame(DATA)` in the cell. numpy, pandas, matplotlib, sklearn, scipy all supported natively. Cold start ~4-6s on first load; negligible after that given tiny dataset size.

**Format — v1 (fixed notebook with judgment checkpoints):**
Same architecture as ProjectLabTab. 2–3 short notebooks per datamart, each covering one ML phase (feature engineering, or model selection, or calibration/monitoring). Cells run pre-written code and show output; judgment checkpoints fire after each cell asking what you'd do with that output. Format owns the difficulty — it's on the decision, not the implementation.

**Format — v2 (open cell challenge mode):**
Toggle on the same problems. "Write it yourself" mode — blank cell, same expected output. User submits, pre-written solution revealed for comparison. Same StrataScratch "attempt → reveal" pattern. Costs almost nothing to add once fixed notebook exists, because the pre-written cell IS the solution.

**Problems that work per datamart (same schema, escalating judgment):**
- Feature Engineering: which columns constitute leakage for target Y? which encoding strategy for this cardinality?
- Model Selection: given this class imbalance, what metric do you optimise? what split strategy?
- Calibration: reliability diagram shows ECE=0.14 — does this model ship?
- Monitoring: which feature in this schema drifts first if the business changes pricing tier?

**Scope constraint (critical):** ML pipeline problems only — feature engineering, model selection, calibration, drift detection. NOT analytics SQL (DAU, funnels, cohort analysis) — that belongs in PAL, not MSL.

**Sequencing:** Build after ProjectLabTab phases 2–5 are shipped. Those phases are the prototype — modeling, calibration, monitoring on Telco Churn. Datamart practice is that architecture generalised to multiple datasets. Don't build in parallel. Establish user engagement signal on ProjectLab first.

**Build trigger:** ProjectLabTab Phase 3 (modeling + calibration) shipped and at least one user engagement data point from PostHog. One datamart sprint = 1 datamart designed + 2–3 fixed notebooks + v1 judgment checkpoints. Estimate: 2–3 sessions.

(Source: session discussion, 2026-05-30)

### Modules
- [x] ~~**Classical ML: Decision boundary visualizer**~~ — done (v4.29) — `DecisionBoundaryLab` in ClassicalMLTab. Pure React SVG (not Pyodide). XOR-structure 2D dataset (47 points), 5 classifier modes (Linear SVM, RBF SVM, DT depth=1, DT depth=5, Random Forest), 20×20 grid of `GridCell` named components with fill colors, accuracy badge. `msl_score:classical_boundary`. Stores `{completed:true, ts}` on completion.
- [x] ~~**Spark Lab: Memory pressure simulator**~~ — done (v4.28) — `MemoryPressureSimulator` in SparkLabTab. Pure React (not Pyodide). 5 controls: executor memory, cores, dataset size, shuffle partitions, join type. Full Spark memory model chain (reserved→usable→user pool→Spark pool→execution budget→per-task). 4 verdicts (OOM Risk/Spill/OOM-Undersized/Healthy). Memory breakdown table.
- [x] ~~**Deep Learning: Attention head visualizer**~~ — done (v4.29) — `AttentionHeadVisualizer` in DeepLearningTab. Pure React (not Pyodide). 7-token input ("The model drift was silent until deployment"), 4 pre-computed attention heads (local/syntactic, semantic clustering, boundary detection, subject-predicate). CSS-grid heatmap, `AHVCell` named component, row-click + hover tooltip. Per-head insight card + `.msl-hint` callout.
- [x] ~~**MLOps: Model Registry Patterns module**~~ — done (v4.27) — `ModelRegistryPatterns` in MLOpsPipelinesTab. AccordionMCQ, 3 scenarios (hash versioning, shadow mode provenance, rollback vs retrain).
- [x] ~~**Monitoring: Alerting decision tree**~~ — done (v4.27) — `AlertingDecisionTree` in MonitoringTab. AccordionMCQ format (3 linear scenarios, not branching MCQ as originally spec'd — simpler and equally effective for the judgment goal). PSI during maintenance, coverage gap vs input drift, latency at promotion.

### Features
- [ ] Progress export — download full mastery snapshot as JSON (all `msl_*` localStorage keys)
- [ ] Module bookmarking — star a scenario to revisit (`msl_bookmarks`)
- [ ] Scenario difficulty filter in judgment modules (easy/medium/hard)
- [ ] Keyboard navigation: 1/2/3/4 to select options, Enter to confirm
- [ ] Gradient: "Mark as read" per post (localStorage)
- [ ] Global search: keyboard arrow-key navigation through results
- [ ] HomeTab: "Recommended first module" based on role (more opinionated than current CTA)
- [ ] **React.lazy() + Suspense code splitting across all 30+ tabs** — currently all tabs are eagerly imported in App.jsx, which inflates the initial JS bundle. Wrap each tab in `React.lazy()` and add a `<Suspense fallback={<LoadingSpinner />}>` wrapper in the router. Each tab loads only on first visit, then cached. Significant improvement to first-load performance, especially on mobile. ~1–2 hours to wire correctly. (Source: PAL architecture, May 2026)
- [ ] **Role Readiness Score** — compute a Junior / Mid / Senior / Staff readiness signal from cross-tab completion and score data. PAL's implementation: per-domain breakdown (not just overall %), mapped to seniority levels, surfaces study recommendations ("You're reading as Senior-Ready in MLOps, Junior-Ready in Experimentation — prioritise CausalInference and ModelEval next"). Input signals: CombinatorTab session score (domain breakdown), TrainerTab accuracy per domain, StaffLayerTab staff-level reveal count, ModelEval completion, SparkLab exercises run. Store as `msl_readiness_score` (JSON object, per-domain). Display on HomeTab alongside Continue bar. The gap from current state: ML Systems Lab produces scenario-level grades; this aggregates them into a study-direction signal. (Source: PAL role readiness dashboard, May 2026)
- [~] **Spaced repetition queue** — partially done (v4.29). TrainerTab now has a "Review Queue" panel that identifies 2 weakest recent domains from the last 5 sessions and surfaces a focused 10-question drill. Domain-level only — not per-scenario SR with intervals. Full per-scenario SR (1/3/7/14/30-day intervals, `msl_sr_log` key) is still unbuilt and would be the proper version. The domain-level implementation closes the most common use case: "what should I drill today?" (Source: PAL Progress view with spaced rep queue, May 2026)
- [ ] **`isFree` per-case gating** — upgrade freemium from tab-level to case-level. PAL's model: every scenario/case object has an `isFree: boolean` flag; the first 2–3 cases per tab are free to sample, the rest gate. Better acquisition experience than ML Systems Lab's current all-or-nothing tab lock — users can try any domain before hitting the gate. Implementation: add `isFree` to every scenario object in every tab (bulk tagging: first 2 scenarios per module = `isFree: true`), update `AccessGate` to filter rather than fully block when `isFree` cases exist. Subsumes the "granular difficulty gating" Tier 1 item — both require case-level tagging. (Source: PAL freemium architecture, May 2026)
- [ ] **"Next scenario" sticky CTA** — after completing any scenario, a sticky or inline CTA that links directly to the next scenario in the module without requiring the user to return to the module nav. PAL added this in V4.24–V4.25 across all runners. ML Systems Lab has "Next" buttons in some tabs but not consistently. Low effort, measurable friction reduction for users doing consecutive scenarios. (Source: PAL V4.24–V4.25 changelog, May 2026)

### Design
- [x] ~~VerbatimTab: add word count + speaking rate (words/min) in Review screen~~ — done (2026-05-27, word count + WPM with 120–160 wpm callout)
- [x] ~~CombinatorTab: per-domain breakdown chart in Debrief screen~~ — done (2026-05-27, horizontal bars sorted weakest-first, mint/ember/rose coloring)
- [x] ~~StaffLayerTab: "Reset all reveals" button for re-study~~ — done (2026-05-27, "↺ Reset reveals" button)
- [ ] Practice zone: overall progress percentage on grid header
- [ ] Interview zone: session history summary on hub grid (X sessions run, avg score)
- [ ] Gradient: "Start here" sort option within each domain (beginner-first)
- [ ] **Fidelity badge upgrade: 3-tier honesty system** — current badges are binary (✓ Real execution / ~ Simulated) on 6 tabs. GenAI Systems Lab runs a 3-tier system on every module: **Mathematically Faithful** (exact algorithm, real computation), **Simplified** (correct concept, illustrative numbers or reduced dimensionality), **Conceptual** (analogy or demo — builds intuition, not a working implementation). The current binary is ambiguous — "~ Simulated" covers both "simplified but correct" and "demo that skips real math." The 3-tier system is honest infrastructure: users know exactly what they're learning from. Audit every interactive module in SparkLab, ModelsMath, FeatureEng, ModelEval to assign the right tier, then update the badge. (Source: GenAI Systems Lab DECISIONS.md, May 2026)

### Pyodide execution expansion — MLOps/monitoring modules (identified 2026-05-29)
- [ ] **Close the "simulation vs. real execution" gap using Pyodide** — MSL already runs Python in-browser (Pyodide, used in SparkLabTab and ModelsMathTab). The gap isn't Python execution — it's that MLOps/monitoring/deployment modules are pure simulated judgment with no live computation. Target: add Pyodide cells to MonitoringTab (actually compute PSI/KS drift on a sample dataset), MLOpsDeployTab (run a batch prediction script + generate a monitoring report), and ModelEvalTab (compute precision/recall/AUC on a held-out set). Each cell runs real sklearn/pandas logic and returns real output — not a curated config response. This partially closes the "only judgment simulation, no real execution" gap without requiring a backend. ~2–3 hours per tab. Implementation note: Pyodide cells are already abstracted into `PythonCell.jsx` — wiring a new cell to an existing module is ~30 min once the Python script is written. (Source: lab diagnosis, May 2026)

### Company Tracks (from PAL, May 2026)
- [~] **Curated scenario sequences by company interview pattern** — partially done (v4.29). CombinatorTab now has a "Company-Calibrated Tracks" section on the config screen: 4 track cards (Google MLE, Meta MLE, Stripe DS, Startup/Growth), each auto-filtering the session to a domain subset. This is a session-level domain filter, not a curated cross-tab sequence. The PAL-equivalent implementation (cross-tab sequences pulling specific modules from specific tabs) is still unbuilt — requires a `COMPANY_TRACKS` constant in App.jsx with `[{tabId, moduleId}]` sequences and a dedicated Tracks view in the Interview zone. That would be the full version. (Source: PAL Company Tracks, May 2026)

### Cross-domain scenarios
- [ ] **"Production Incident" cross-tab scenarios** — a single scenario that requires reasoning across multiple domains simultaneously. E.g., "Model AUC dropped 4 points 72 hours after a feature store migration. Serving P95 latency increased 40ms. What do you check first, in what order, and what's the most likely root cause?" Correct answer requires: Feature Engineering (store migration → feature drift), Monitoring (latency signal = schema mismatch or embedding recomputation), MLOps (was the migration rolled forward or is there a rollback option). Format: multi-step diagnosis with branching — choose your first action, see what that reveals, choose next. 6–8 scenarios. Tab: could be a new "Incident Room" tool in Interview zone. (Source: PAL cross-room challenges concept, May 2026)

### DefenseDocTab v2 — Gap-mapped, cost-weighted prep plan (identified 2026-05-29)

**Concept:** Full rebuild of Defense Plan around the core insight that the only prep that matters is the gap between what the JD requires and what the user can already evidence from their resume. Everything else is noise.

**5-step flow (fast path + optional enrichment):**

1. **JD input** — already exists. Parse required skills, signals, and competencies.
2. **Resume input** *(optional enrichment)* — paste-as-text or file upload (PDF with text-paste fallback for edge cases — column layouts, icon-heavy resumes, non-standard encodings). Map resume signals against JD requirements. Output: the delta — skills/signals in JD not evidenced in resume. This is the actual prep surface. Without resume, default to rating on all JD signals (current behavior).
3. **Self-rating on gaps only** — not "rate yourself on everything the JD mentions" (current behavior), but "rate yourself on the things your resume doesn't cover." Fewer questions, more targeted, doesn't waste time on things already proven.
4. **Round context** — two inputs: (a) round type selector: Technical / Hiring Manager / Behavioral / HR; (b) time horizon: 3 / 7 / 14 days. These two together determine the weighting of the output plan — a 3-day behavioral prep and a 14-day technical prep are completely different documents.
5. **Previous round history** *(optional enrichment)* — if the user is mid-process (already completed a screen or two), they can describe what happened and any feedback received. This is the real personalization signal. Example: "first technical went well but got dinged on scale estimation" → upweight scale estimation questions in the plan regardless of self-rating. No other tool captures this because it requires the user to be mid-loop, not starting fresh.

**Output:** Gated day-by-day prep plan. Gate logic same as v1 (35% threshold). Plan sections weighted by: gap severity (self-rating score) + round type + time horizon + round history signals (if provided).

**Key design constraints:**
- Fast path must exist: JD only → plan in 2 steps (same as v1). Resume + round history are optional enrichment; the plan degrades gracefully without them — don't gate on completing all 5 steps.
- This is DefenseDocTab v2, not a new tab. Same tab, same place in the Interview zone flow.
- localStorage only — resume text, JD text, self-ratings, round history all storable without a backend.

**Build trigger:** Current Defense Plan completion rate shows users actually finishing the 3-step flow regularly. Don't rebuild an underused feature with 5 steps before the 3-step version has traction. (Decided 2026-05-29)

**Risk:** Form fatigue. 5-6 steps before seeing output is a lot of upfront investment. Fast path is non-negotiable — not optional.

### GradientTab UX (identified 2026-05-29)
- [ ] **Series + Tags redesign** — group the 25 posts into 4–5 named series (e.g., "Silent Failures", "Production Diagnostics"); add per-post tags (domains + concepts). Tags filter collapses to a filtered post list with sort options (newest / most relevant to current practice activity). Default sort when no filter: most relevant to user's active domains. Build trigger: when post count hits 50+. Below that threshold the flat list is navigable and series groupings would just add overhead. (Decided 2026-05-29)
- [ ] **Revise / Learn / What's Next — state-aware reading mode** — three reading lenses powered by existing localStorage data: (1) **Revise** = posts in domains where practice scores are weak (`msl_score:*` < 60%); (2) **Learn** = unread posts in domains the user is actively practicing; (3) **What's Next** = unread posts in domains not yet touched. Data source: `msl_read` (read post IDs) + `msl_score:*` keys. Most valuable of the three — turns the feed from chronological browse into a personalized study queue without any backend. Pagination ("view more after N") explicitly decided against — not needed at 25 posts, reassess at 100+. (Decided 2026-05-29)

### Gradient posts (remaining from ideation)
- [ ] "The 6 ways a recommendation system can silently stop recommending" → System Design
- [ ] "When DiD breaks: parallel trends violations in practice" → Causal Inference
- [ ] "Cold-start is not a model problem, it's a product problem" → System Design

---

## Tier 3 — Interesting, lower priority

- [ ] **End-to-end backend execution module** — when the no-backend architecture is eventually reversed, build one complete working ML system demo: CSV → feature engineering → model training → saved artifact → FastAPI/Docker inference endpoint → batch prediction script → drift + accuracy monitoring report. One module, done properly. Not six tabs — one tightly scoped end-to-end flow that proves the SageMaker mental model locally (or on AWS). This is the ceiling of what the lab can become: not just "here's what would break" but "here's a working system and here's what broke." (Source: lab diagnosis, May 2026)
- [ ] Unified "Systems Engineer" cross-lab learning path spanning ML + GenAI + Experimentation (6–8 weeks, cross-lab capstone)
- [ ] Ecosystem cross-links: deep links from GenAI Lab and Experimentation Lab into this project
- [x] ~~OG image for proper social preview~~ — done (2026-05-26, public/og-image.png)
- [x] ~~sitemap.xml for SEO~~ — done (2026-05-26, public/sitemap.xml)
- [ ] "NEW" badge on tabs updated within last 30 days
- [ ] Dark/light mode toggle (currently dark-only — see DECISIONS.md for why this is excluded for now)
- [ ] **PWA manifest + service worker** — add `manifest.json` to `public/` (name, icons, theme color, display: standalone) and a minimal service worker that caches the app shell. Makes the app installable on mobile from Chrome/Safari. ~30 min. (Source: GenAI Systems Lab, May 2026)

---

## Cross-lab learnings — patterns from PAL, GAL, India Wealth Architecture (session 2026-06-02)

Ideas observed in sibling labs that have potential MSL application. Logged here for reference — evaluate each for fit before building. Not all are right for MSL even if they work elsewhere.

### From India Wealth Architecture (`github.com/SidharthKriplani/india-wealth-architecture`)
- [ ] **Animation and visual cue patterns** — the wealth architecture project uses animated transitions and visual metaphors to make abstract concepts (asset allocation, compounding) tangible and memorable. MSL's interactive modules (DeepLearningTab visualizer, ClassicalML decision boundary) are static or minimally animated. Study the animation approach from that repo before building any new interactive module — there are likely patterns (enter/exit transitions, state-driven SVG animations, stepped reveals) directly applicable to making MSL's Pyodide cell outputs and judgment reveals more viscerally clear. Review the repo specifically for: (a) how transitions are keyed to data state, (b) how visual metaphors are chosen for abstract quantities, (c) what CSS/React animation approach is used.
- [ ] **Country-curated content angle** — the wealth architecture is India-specific. MSL's LandscapeTab has US-centric salary and hiring data. A country filter or region toggle (India / UK / US / EU) on LandscapeTab salary and company data would make the product meaningfully more useful for non-US users. Implementation: extend each LandscapeTab company/salary entry with a `region` field; add a region filter chip row. Data is the hard part — requires research per region. Low-effort UI, significant content work.

### From PAL (Experimentation/Experimentation Systems Lab)
- [ ] **About / why-this-is-different onboarding section** — PAL #6. PAL identified the need for a brief "what is this, why is it different from LeetCode/StatQuest/Chip's book, how to get maximum value from 30 minutes" explainer. For MSL, this is partially addressed by the cold-state banner (v4.35), but a more structured one-time walkthrough or persistent "How to use MSL" callout in the Today zone would reduce new-user friction. Content: (a) MSL trains judgment, not memory; (b) the right path for a user's specific role (Data Scientist vs MLE vs Research); (c) how to use the lab most effectively (30-min deep session > 5 min scattered). Candidate format: a collapsible card in HomeTab's Today row, visible until dismissed.
- [ ] **Difficulty + industry filter on practice tabs** — PAL #10. MSL's practice tabs currently assume intermediate-level users. Adding a difficulty filter (Foundational / Practitioner / Staff) and optionally an industry filter (Fintech / Consumer / Platform / Research) to the AccordionMCQ modules would widen the accessible user base. The difficulty filter is already in the Features Tier 2 list; industry is new. Implementation note: scenarios need a `difficulty` and optionally an `industry` tag before filters are useful — content tagging is the prerequisite, not the UI.
- [x] ~~**Question framing quality pass**~~ — done (v4.40). 20 scenarios rewritten across MonitoringTab (6), FeatureEngTab (6), SystemDesignTab (9). All now situation-first with specific numbers, timing, and business context. Options and explanations unchanged. The framing of MSL scenario questions could be substantially improved. Compare an MSL scenario prompt with a DataLemur or StrataScratch problem: the latter gives you a business context, a specific decision to make, and optionally sample input/output. MSL prompts are often good but sometimes too abstract or too "textbook setup." A content audit pass specifically on question framing — rewording scenario setup text to match the specificity and business grounding of best-in-class platforms — would increase perceived difficulty realism. Target: every scenario prompt should name a specific situation, not a category.
- [ ] **Chart interpretation scenarios for DataScience / BI content** — PAL #5 (BI and reporting should be visual because BI is inherently visual). For MSL, this applies to DataScienceTab and any future datamart content: scenarios where the user is shown an actual chart (confusion matrix, calibration curve, feature importance bar, drift histogram) and must interpret it, not just answer an MCQ about what the chart "means in theory." Pyodide cells already produce matplotlib output — the gap is judgment checkpoints that fire on that visual output and ask "given this chart, what do you do next?" This is what Phase 3 cell9 started (ROC/PR curves + confusion matrix → threshold selection). Extend this pattern to DataScienceTab and MonitoringTab modules.
- [ ] **Guesstimates bank in InterviewPrepTab** — PAL #14 (Guesstimates). Fermi estimation / guesstimate questions appear frequently in DS/MLE interviews at FAANG and growth companies. MSL currently has no guesstimate content. A bank of 15–20 guesstimate problems (market sizing, product estimation, capacity planning) with a structured approach reveal (given assumptions → calculation path → sanity check) would extend the Interview zone without requiring Pyodide. Format: plain text reveal, same `.msl-reveal-panel` pattern. Could be a new mode in InterviewPrepTab or a standalone mini-tab. Low build effort, real interview coverage gap.
- [ ] **Autocomplete / code assist for Pyodide cells on mobile** — PAL #9. MSL's ProjectLab cells are editable but typing Python on mobile is painful without autocomplete. Integrating CodeMirror 6 (lightweight, has mobile touch support + basic Python completion) would make the cells usable on phones. Trade-off: CodeMirror adds bundle weight. Evaluate only after ProjectLab Phase 5 is complete and mobile usage data exists. Don't pre-optimize for mobile Pyodide before validating that users actually edit cells on mobile.

### From GAL (GenAI Systems Lab)
- [ ] **Simplify toggle for blog posts** — already specced in Tier 1 above (pre-generate at build time, not runtime API call).
- [ ] **Fidelity badge 3-tier system** — already in Tier 2 Design section above.
- [ ] **Company logos** — already specced in Tier 1 above (LandscapeTab, Clearbit/Simple Icons).
- [ ] **Cross-repo learning sessions** — GAL and MSL have diverged architecturally (different component patterns, different animation approaches, different content structures). A periodic sync pass — reading each other's LINEAGE.md and IDEAS.md — would surface patterns applicable to both. Candidate cross-pollination: GAL's Simplify toggle → MSL Gradient posts; MSL's Pyodide execution layer → GAL's code examples; MSL's judgment checkpoint pattern → GAL's concept exercises; GAL's visual design patterns → MSL's interactive modules. **Schedule:** at the start of any new feature sprint, spend 20 min reading the other lab's LINEAGE since last sync.

---

## Known Bugs

- [ ] `window.scrollTo` on zone switch can feel jarring mid-scroll — consider only triggering on user-initiated nav, not programmatic `onNavigate`
- [ ] Pyodide cold start (~3s first load) — no loading indicator during init in Math Foundations
- [x] ~~VerbatimTab: SpeechRecognition `onend` fires unexpectedly on some Chrome versions after silence — needs auto-restart~~ — fixed v4.8 (isStoppingRef guard)
- [x] ~~CombinatorTab: countdown timer continues running if user switches zones — should pause~~ — fixed v4.8 (savedAt timestamp + elapsed subtraction on restore)
- [x] ~~DefenseDocTab: `@media print` PDF export — needs cross-browser verification (Safari, Firefox)~~ — fixed v4.8 (visibility pattern + @page margins)
- [ ] **SHAP values Gradient post — YouTube embed shows "video unavailable"** despite a `youtubeId` being set. Likely causes: video set to private/unlisted after being linked, region-blocked, or embed disabled by uploader. Fix: read `gradientPosts.js`, verify every `youtubeId` by loading `youtube.com/embed/{id}` — remove or replace IDs for unavailable videos. Run this check for all posts in one pass, not just SHAP. (Identified: session 2026-06-02)

---

## Retired

Ideas consciously decided against. Don't re-propose without new justification.

| Idea | Reason retired |
|------|---------------|
| RAG architecture judgment module | RAG is GenAI Lab territory (prompt engineering, retrieval, reranking). Wrong lab. |
| Backend / server-side storage | Zero-friction access is a core principle. localStorage + JSON export covers the need. |
| Account system / login | Same as above. Adds friction, adds infra, solves no current problem. |
| Sidebar navigation | Replaced in v4. Scaled poorly on mobile, too many clicks. Bottom-nav is permanent. |
| External component libraries (MUI, shadcn) | Custom inline styles keep the visual language consistent and the bundle lean. |
| Tailwind utilities in component files | Design system must live in CSS variables. Tailwind in components creates drift. |
| Pill navigation (v1) | Required 3 clicks to content. Too much cognitive load. |
| Topbar tab bar (v2) | Scrolled off screen on mobile. Didn't scale past 10 tabs. |
