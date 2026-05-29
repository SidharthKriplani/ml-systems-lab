# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. Oracle refactor — Batch 2 (remaining 21 tabs) (2–3 hours)
The following tabs still have decorative non-amber color hits (counts from grep, some will be semantic keeps):
Priority by hit count: MLOpsDeployTab (27), SparkLabTab (26), SystemDesignTab (21), ModelEvalTab (16), ModelsMathTab (15), MLOpsPipelinesTab (15), DeepLearningTab (13), DLServingTab (11), TimeSeriesTab (8), AirflowTab (8), dbtTab (7), DataModelingTab (7), DLFineTuningTab (7), DataScienceTab (6), DefenseDocTab (5), CaseStudiesTab (4), TrainerTab (3), CodeBugsTab (3), SpotTheFlawTab (2), InterviewPrepTab (2), CombinatorTab (not listed but check).
Apply same rules as Batch 1. Brace-balance each. Single commit per batch of ~5 files. DO NOT replace_all on whole files.

### 2. ProjectLab tab — Phase 1 skeleton (2–3 hours)
New tab `ProjectLabTab.jsx`. Sequential notebook. Phase 1: data ingestion + EDA — 3 Pyodide cells (load sklearn churn dataset → shape/dtypes/nulls → correlation heatmap via matplotlib). 2 AccordionMCQ judgment checkpoints between cells. LocalStorage key `msl_projectlab_churn_data`. Add to App.jsx (practice zone, premium). See IDEAS.md Tier 1 for full spec.

### 3. New user cold-state banner (45 min)
Detect first visit: no `msl_tab`, no `msl_score:*`, no `msl_access` in localStorage. Show one-time orientation banner at top of HomeTab: "New here? Start with Feature Engineering (free) or enter code DAI2026 for full access." Disappears after first tab visit (write `msl_onboarded: 1`). HomeTab only — not Today sidebar.

### 4. Role Readiness Score on HomeTab (1.5 hours)
Aggregate cross-tab scores into per-domain seniority signal. Read all `msl_score:*` keys + `msl_trainer_history` + `msl_combinator_history`. Compute a 0–100 "readiness" per domain (ML Eng, Data Eng, Deep Learning, MLOps, Data Science, Interview). Render as compact bar-per-domain on HomeTab below the TODAY row. No new localStorage keys needed — derives from existing data.

### 5. Audit #021 — post-v4.31 state check (1 hour)
Run a focused audit: (a) confirm all brace-balanced files from v4.29–v4.31 still pass, (b) check METRICS.md for any missing localStorage keys from v4.29/v4.30, (c) verify SpotTheFlaw scenario count in GlobalSearch matches 12, (d) spot-check `.msl-cloud-map` renders correctly in MonitoringTab on mobile (no overflow). Log findings in AUDITS.md.

---

## Blocked

Nothing currently blocked.

---

## Done this session

- ~~Oracle identity refactor Batch 1 (v4.31) — 5 tabs (MonitoringTab 73 hits, CausalInferenceTab 57, FeatureEngTab 62, ClassicalMLTab 66, GradientTab 41). All decorative mint/sky/ember/rose/violet/gold replaced with prime/amber/ink-low. Brace balance 0 on all 5. All 30 POSTS catColor in GradientTab unified. Semantic data-series colors preserved throughout.~~
- ~~Apply .msl-option-btn to remaining MCQ tabs (v4.30) — FeatureEngTab, ModelEvalTab, MonitoringTab, DataScienceTab all migrated from inline styles~~
- ~~Cloud/AWS callouts — 3 tabs (v4.30) — .msl-cloud-map + .msl-cloud-chip added to index.css; 30+ scenario reveals in MonitoringTab, MLOpsDeployTab, MLOpsPipelinesTab got AWS service callouts~~
- ~~SpotTheFlawTab → 12 scenarios (v4.30) — stf11 (NDCG/CTR divergence) + stf12 (annotator majority-vote bias) added~~
- ~~BiasVarianceVisualizer in ClassicalMLTab (v4.30) — animated SVG, slider, Bias²/Variance regions, regime diagnosis~~
- ~~SimpsonsParadoxViz in CausalInferenceTab (v4.30) — aggregate/segmented toggle, animated bars, confounding explanation~~
- ~~Footer cross-links — added to App.jsx, copy "Also by the same team:", LINEAGE.md v4.18, committed~~
- ~~Interaction guidance pass — all 23 tabs, LINEAGE.md v4.17, AUDITS.md #010~~
- ~~Audit #017 — full codebase health sweep; CLAUDE.md filenames fixed, AUDITS.md numbering fixed, 5 new findings logged, LINEAGE.md v4.19~~
- ~~Audit #018 — mobile hover sticky bug sweep; PAL fix pattern applied to InterviewPrepTab, VerbatimTab, AskTab (3 fixes), GradientTab crash guard; LINEAGE.md v4.20~~
- ~~GlobalSearch expansion — went from ~70 to 192 entries; entire Interview zone was invisible; all 9 Interview tools + scenarios now indexed~~
- ~~Audit #019 — guidance completeness final sweep; 4 gaps fixed (TakeHome, Landscape, Combinator, Ask); 27 tabs confirmed clean; LINEAGE.md v4.21~~
- ~~Skeleton mode — COMING_SOON stubs across 16 tabs (24 new + 11 upgraded); userBrief rendered to users, devBrief{micro,macro} in-code dev guidance; LINEAGE.md v4.22~~
- ~~Nav + progress overhaul — flat sidebar, guided paths, domain bars, HomeTab polish, ForwardPointer CTAs on 5 tabs; LINEAGE.md v4.23~~
- ~~PAL-modeled polish (v4.24+v4.25) — transition/shadow/radius tokens, sidebar-item-active left-border, lock icons removed, role pills collapsed, progress bar animations, Space Grotesk dropped, shared utility classes (.msl-option-btn, .msl-reveal-panel, .msl-scenario-card, .msl-hint), .section-eyebrow applied to 17 instances across 4 tabs, dark theme token audit (6 replacements)~~
- ~~Systematic design-system pass (v4.26) — .section-eyebrow (~44 instances), .msl-option-btn, .msl-reveal-panel applied across remaining 14 tabs; all 30 tabs brace-balanced~~
- ~~Fill 10 COMING_SOON stubs (v4.27) — SystemDesign, MLOpsPipelines, Monitoring, FeatureEng, CodeBugs; 18 new scenarios + 6 new bugs; all COMING_SOON arrays cleared~~
- ~~README rewrite (v4.28) — judgment-gap hook, 4 differentiators foregrounded, Interview zone flagship, domain grid moved lower~~
- ~~HomeTab mobile fix (v4.28) — @media 480px TODAY row stacks vertically; sparse heatmap guard~~
- ~~Apply .msl-option-btn to ClassicalMLTab (v4.28) — NaiveBayes module + option-btn + ForwardPointer~~
- ~~ForwardPointers to MLOpsDeployTab, CombinatorTab, DataScienceTab (v4.28)~~
- ~~Spot the Flaw tab full build (v4.28) — 10 scenarios, 5 flaw categories, Interview zone routing, GlobalSearch indexed~~
- ~~All COMING_SOON stubs cleared (v4.29) — 10 modules across 6 tabs: AttentionHeadVisualizer, ArchDecisionLab, ExperimentDesignFailures, CausalDAGExplorer, StreamingStabilityLab, DecisionBoundaryLab, CompanyTracks, CrossDomainChallenge, SpacedRepQueue, WeakDomainDrill~~

---

## What comes after (not for this session)

- **Emoji → SVG — highest-traffic tabs only** — 1 hour. Target HomeTab, CombinatorTab, TrainerTab, StaffLayerTab. Grep for emoji codepoints, replace decorative ones with inline SVG using `currentColor`. Functional glyphs (✓ ✗ →) stay. Reference Audit #016 in AUDITS.md for the full list.
- Pre-Eval Callout pattern — 5 target tabs (SystemDesign, ModelEval, Monitoring, MLOpsDeploy, CausalInference). Content work-heavy.
- Slim scenario index + lazy content loading — bundle audit first (`npm run build` output), then implement if > 1.5 MB.
- DefenseDocTab v2 — gap-mapped prep plan, resume cross-reference, round-type selector.
