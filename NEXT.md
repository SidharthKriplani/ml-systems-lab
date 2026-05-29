# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. Apply .msl-option-btn to remaining MCQ tabs (1 hour)
FeatureEngTab, ModelEvalTab, MonitoringTab, DataScienceTab still have AccordionMCQ option buttons with ad-hoc inline styles. Replace with `className="msl-option-btn"` + conditional `.correct`/`.wrong`/`.selected`. Each file: search for the AccordionMCQ component's option button rendering (look for `onClick` + `background:` + `border:` inline style combo), replace with className approach. Brace-check each file after edit.

### 2. Cloud/service mapping callouts — 3 tabs (1.5 hours)
Add `.msl-cloud-map` reveal panels (styled like `.msl-reveal-panel`) inside relevant AccordionMCQ reveals in MonitoringTab, MLOpsDeployTab, MLOpsPipelinesTab. Each scenario that involves a technology choice gets a "In production, this maps to:" AWS service callout. E.g., "PSI drift → SageMaker Model Monitor + CloudWatch alarm", "Model promotion gate → SageMaker Model Registry approval workflow". Pure content work — no architectural change. Closes the gap between judgment simulation and interview-ready AWS fluency. Add `.msl-cloud-map` class to index.css first (same base as `.msl-reveal-panel` but with a cloud/enterprise accent).

### 3. SpotTheFlawTab — expand to 12 scenarios (1 hour)
Add stf11 (Metric Mismatch — NDCG vs CTR divergence: offline ranking metric improves but online CTR drops) and stf12 (Labeling Artifact — annotator bias: 3 annotators, majority-vote labels on medical imaging → systematic error on ambiguous boundary cases). Flaw count strip updates automatically as total increases.

### 4. Project Lab tab — Phase 1 skeleton (2–3 hours)
New tab `ProjectLabTab.jsx`. Sequential notebook. Phase 1: data ingestion + EDA — 3 Pyodide cells (load sklearn churn dataset → shape/dtypes/nulls → correlation heatmap via matplotlib). 2 AccordionMCQ judgment checkpoints between cells. LocalStorage key `msl_projectlab_churn_data`. Add to App.jsx (practice zone, premium). See IDEAS.md Tier 1 for full spec.

### 5. New user cold-state banner (45 min)
Detect first visit: no `msl_tab`, no `msl_score:*`, no `msl_access` in localStorage. Show one-time orientation banner at top of HomeTab: "New here? Start with Feature Engineering (free) or enter code DAI2026 for full access." Disappears after first tab visit (write `msl_onboarded: 1`). HomeTab only — not Today sidebar.

---

## Blocked

Nothing currently blocked.

---

## Done this session

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
- **New user cold-state banner** — 45 min. Detect first visit (no `msl_tab`/`msl_score`/`msl_access`), show one-time "start here" orientation. Disappears after first tab visit. See IDEAS.md Tier 1.
- Pre-Eval Callout pattern — 5 target tabs (SystemDesign, ModelEval, Monitoring, MLOpsDeploy, CausalInference). Content work-heavy.
- Role Readiness Score — aggregate cross-tab scores into per-domain seniority signal on HomeTab.
- Slim scenario index + lazy content loading — bundle audit first (`npm run build` output), then implement if > 1.5 MB.
- DefenseDocTab v2 — gap-mapped prep plan, resume cross-reference, round-type selector.
