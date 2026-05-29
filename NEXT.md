# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. Apply .msl-option-btn to remaining MCQ tabs (1 hour)
ClassicalMLTab got it in v4.28. Still missing: FeatureEngTab, ModelEvalTab, MonitoringTab, DataScienceTab. Each has 4-option MCQ buttons with ad-hoc inline styles. Replace with `className="msl-option-btn"` + conditional `correct`/`wrong`/`selected` modifier class. Check each tab's AccordionMCQ option rendering and apply. Verify with brace check after each file.

### 2. SpotTheFlawTab — expand to 12 scenarios + add 2 more flaw categories (1–2 hours)
Currently 10 scenarios across 5 categories. Add 2 more: stf11 (Metric Mismatch — online/offline metric gap, e.g. NDCG vs CTR divergence), stf12 (Labeling Artifact — annotator bias in ambiguous class boundary). Also audit existing 10 for explanation quality — every reveal must include (a) what breaks in production, (b) the signal that tells you you're in that situation. Flaw count strip shows `{attempted}/{total}` so the total will update automatically.

### 3. Project Lab tab — Phase 1 skeleton (2–3 hours)
New tab `ProjectLabTab.jsx`. Sequential notebook pattern. Phase 1 only: data ingestion + EDA. 3 Pyodide cells (load UCI/sklearn dataset → shape/dtypes/nulls → correlation heatmap via matplotlib). 2 judgment checkpoints as AccordionMCQ between cells (spotting skew → right transformation choice; null pattern → imputation strategy). LocalStorage key `msl_projectlab_p1`. No deployment scaffold yet — that's Phase 5. See IDEAS.md Tier 1 for full spec. Add to App.jsx (practice zone, premium), import in ALL_TABS.

### 4. New user cold-state banner (45 min)
Detect first visit: no `msl_tab`, `msl_score:*`, or `msl_access` in localStorage. Show a one-time orientation banner at top of HomeTab: "Start here → Feature Engineering (free) or enter access code DAI2026 for full access." Banner disappears after first tab visit (set `msl_onboarded: 1`). Do not add to Today zone sidebar — HomeTab only. See IDEAS.md Tier 1.

### 5. Emoji → SVG pass — HomeTab + CombinatorTab (1 hour)
HomeTab and CombinatorTab are the highest-traffic tabs still using decorative emoji. Grep both files for emoji codepoints (🎯🔥⚡🧪📊🎓 etc). Replace decorative ones with inline `<svg>` using `currentColor`. Functional glyphs (✓ ✗ →) stay as-is. Audit #016 in AUDITS.md has the full inventory. One commit per file.

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

---

## What comes after (not for this session)

- **Emoji → SVG — highest-traffic tabs only** — 1 hour. Target HomeTab, CombinatorTab, TrainerTab, StaffLayerTab. Grep for emoji codepoints, replace decorative ones with inline SVG using `currentColor`. Functional glyphs (✓ ✗ →) stay. Reference Audit #016 in AUDITS.md for the full list.
- **New user cold-state banner** — 45 min. Detect first visit (no `msl_tab`/`msl_score`/`msl_access`), show one-time "start here" orientation. Disappears after first tab visit. See IDEAS.md Tier 1.
- Pre-Eval Callout pattern — 5 target tabs (SystemDesign, ModelEval, Monitoring, MLOpsDeploy, CausalInference). Content work-heavy.
- Role Readiness Score — aggregate cross-tab scores into per-domain seniority signal on HomeTab.
- Slim scenario index + lazy content loading — bundle audit first (`npm run build` output), then implement if > 1.5 MB.
- DefenseDocTab v2 — gap-mapped prep plan, resume cross-reference, round-type selector.
