# NEXT.md — Next Session Queue

**Rule:** Max 5 items. Specific enough to start without re-reading IDEAS.md.  
Updated at the END of every session. Wiped and rewritten — not appended.  
Read this immediately after CLAUDE.md. Work only what's listed here.

---

## Next session

### 1. HomeTab polish — 3 small fixes (30 min)
All three together, one commit.

- **Activity widget: hide when sparse** — if `activityGrid.filter(d => d.count > 0).length < 7`, don't render the heatmap grid at all. Show "Day N" text instead (just the streak number and a label like "Keep going"). The 27-empty-square grid looks broken for new users.
- **Continue bar: hide at 0%** — in the Continue section, only render if `nextUp.pct > 0`. A 0% bar signals no progress. Suppress it entirely until the user has actually started a track.
- **Visual hierarchy divider** — add `borderTop: '1px solid var(--rim)'` + increased `paddingTop` before the "All tracks" section to separate the "your session" context (Jump Back In, Today, Role, Continue) from the "browse everything" section below.

### 2. Mobile verification — HomeTab TODAY row (15 min + fix if broken)
The two-column `gridTemplateColumns: 'minmax(0, 1fr) auto'` TODAY row was never tested on narrow screens. Open DevTools → 375px and 320px. If the case card text is unreadably compressed, add `@media (max-width: 480px)` to stack columns vertically (`gridTemplateColumns: '1fr'`, activity widget full width below case card). Fix in `HomeTab.jsx` inline with a `<style>` tag or conditional style object.

### 3. Module forward pointers — systematic pass (2–3 hours)
Every tab/module currently ends silently. After the guidance pass (which added hints at the TOP), this closes the learn loop at the BOTTOM. Pattern: a small `ForwardPointer` div at the end of each module's rendered content — consistent style, one link per module. Two types:

- **Gradient post link** (for tabs that already have a "Go deeper" CTA — just ensure every module has one, not just the tab header)
- **CombinatorTab or TrainerTab link** ("Test this domain in Combinator →")

Start with the highest-traffic tabs: SystemDesignTab, FeatureEngTab, ModelEvalTab, MonitoringTab, DeepLearningTab. Use the existing "Go deeper → Read X in Gradient" CTA pattern — it's already in FeatureEngTab and MonitoringTab. Standardise it and add to the rest. Don't invent new CTAs, just make the existing pattern consistent.

### 4. Emoji → SVG — highest-traffic tabs only (1 hour)
Don't do the full sweep yet (that's a longer audit session). Target the 4 tabs users land on most: HomeTab, CombinatorTab, TrainerTab, StaffLayerTab. Grep each for emoji codepoints, replace decorative ones with inline SVG using `currentColor`. Functional glyphs (✓ ✗ →) stay. Reference Audit #016 in AUDITS.md for the full list when doing the complete pass.

### 5. Spot the Flaw tab — full build (3–4 hours)
Interview zone, 12 scenarios. See IDEAS.md Tier 1 for full spec. Each scenario: a real ML code block or metric summary with exactly one subtle flaw — user picks the flaw category from 5 options, then sees the breakdown. Flaw taxonomy: Data Leakage, Evaluation Error, Distribution Shift, Metric Mismatch, Labeling Artifact. Routing: `tabId: 'spottheflaw'`, zone: `interview`.

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

---

## What comes after (not for this session)

- **README positioning rewrite** — 30 min, high external-perception return. Opens with product thesis, surfaces 4 differentiators (Pyodide, Web Speech, StaffLayer, CodeBugs), foregrounds flagship (Interview zone / 45-min mock). See IDEAS.md Tier 1.
- **New user cold-state banner** — 45 min. Detect first visit (no `msl_tab`/`msl_score`/`msl_access`), show one-time "start here" orientation. Disappears after first tab visit. See IDEAS.md Tier 1.
- Pre-Eval Callout pattern — 5 target tabs (SystemDesign, ModelEval, Monitoring, MLOpsDeploy, CausalInference). Content work-heavy.
- Role Readiness Score — aggregate cross-tab scores into per-domain seniority signal on HomeTab.
- Slim scenario index + lazy content loading — bundle audit first (`npm run build` output), then implement if > 1.5 MB.
- DefenseDocTab v2 — gap-mapped prep plan, resume cross-reference, round-type selector.
