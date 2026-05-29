# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. README positioning rewrite (30 min)
The current README leads with domain breadth ("6 engineering domains, 200+ scenarios"). That buries the wedge. Rewrite to open with the product thesis and lead with "Can you debug it in production?" Hook: one sharp paragraph up top. Then: 4 differentiators (Pyodide in-browser Python, Web Speech verbal practice, StaffLayer IC5→Staff scenarios, CodeBugs debugging), flagship foregrounded (Interview zone / 45-min mock interview). Cut or move the domain/tab grid lower. One commit, README.md only.

### 2. Mobile verification — HomeTab TODAY row (15 min + fix if broken)
The two-column `gridTemplateColumns: 'minmax(0, 1fr) auto'` TODAY row was never tested on narrow screens. Open DevTools → 375px and 320px. If the case card text is unreadably compressed, add `@media (max-width: 480px)` to stack columns vertically (`gridTemplateColumns: '1fr'`, activity widget full width below case card). Fix in `HomeTab.jsx` inline with a `<style>` tag or conditional style object.

### 3. Apply .msl-option-btn to MCQ tabs (1–2 hours)
The `.msl-option-btn` class is defined in index.css and was applied to CodeBugsTab and InterviewPrepTab last session. Extend to the core MCQ practice tabs: FeatureEngTab, ModelEvalTab, MonitoringTab, ClassicalMLTab, DataScienceTab. Each has 4-option MCQ buttons rendered with ad-hoc inline styles. Replace with `className="msl-option-btn"` + conditional `correct`/`wrong`/`selected` class. This unifies the most user-facing interactive element across all practice tabs.

### 4. Module forward pointers — remaining tabs (1 hour)
SystemDesignTab, FeatureEngTab, ModelEvalTab, MonitoringTab, DeepLearningTab are done. Extend to: ClassicalMLTab, MLOpsDeployTab, SparkLabTab, DataScienceTab, CombinatorTab. Same `ForwardPointer` component pattern. Guard with `{onNavigate && ...}`.

### 5. Spot the Flaw tab — full build (3–4 hours)
Interview zone, 12 scenarios. Each scenario: a real ML code block or metric summary with exactly one subtle flaw — user picks the flaw category from 5 options, then sees the breakdown. Flaw taxonomy: Data Leakage, Evaluation Error, Distribution Shift, Metric Mismatch, Labeling Artifact. Routing: `tabId: 'spottheflaw'`, zone: `interview`. See IDEAS.md Tier 1 for full spec.

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

---

## What comes after (not for this session)

- **Emoji → SVG — highest-traffic tabs only** — 1 hour. Target HomeTab, CombinatorTab, TrainerTab, StaffLayerTab. Grep for emoji codepoints, replace decorative ones with inline SVG using `currentColor`. Functional glyphs (✓ ✗ →) stay. Reference Audit #016 in AUDITS.md for the full list.
- **New user cold-state banner** — 45 min. Detect first visit (no `msl_tab`/`msl_score`/`msl_access`), show one-time "start here" orientation. Disappears after first tab visit. See IDEAS.md Tier 1.
- Pre-Eval Callout pattern — 5 target tabs (SystemDesign, ModelEval, Monitoring, MLOpsDeploy, CausalInference). Content work-heavy.
- Role Readiness Score — aggregate cross-tab scores into per-domain seniority signal on HomeTab.
- Slim scenario index + lazy content loading — bundle audit first (`npm run build` output), then implement if > 1.5 MB.
- DefenseDocTab v2 — gap-mapped prep plan, resume cross-reference, round-type selector.
