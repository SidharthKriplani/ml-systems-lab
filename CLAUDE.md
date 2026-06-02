# CLAUDE.md — Session Briefing

Read this first, every session.

---

## What this project is

ML Systems Lab is a browser-only study tool for production ML judgment. It has 300+ interactive scenarios across 6 engineering domains (ML Engineering, Data Engineering, Deep Learning, Data Science, MLOps, Interview Tools) plus a 9-tool Interview simulation zone. No backend. No accounts. Everything in localStorage. Deployed on Vercel.

**Live:** https://ml-systems-lab-v9xe.vercel.app  
**Repo:** https://github.com/SidharthKriplani/ml-systems-lab

---

## Stack in one line

React 18 + Vite SPA · CSS variables design system · Pyodide (Python in-browser) · Web Speech API · localStorage only · Vercel auto-deploy on push to main

---

## Non-negotiable rules

1. **No Tailwind utility classes in tab files.** Use inline styles with CSS variable references only (e.g., `style={{ color: 'var(--prime)' }}`). Tailwind is in the config but deliberately not used in component files.
2. **All localStorage keys prefixed `msl_`.** Score keys follow `msl_score:{tabPrefix}`. Non-score keys are tab-specific (see METRICS.md for full registry).
3. **No `isolation: "worktree"` in Agent tool calls.** This repo has a persistent git issue where worktree isolation fails with "Failed to resolve base branch 'HEAD': git rev-parse failed". Always spawn agents without that parameter.
4. **Never hardcode colors.** Every color must be a CSS variable from `:root` in `index.css`.
5. **Every tab gets `onNavigate` prop.** Signature: `export default function XTab({ onNavigate }) {}`. Cross-tab navigation via `onNavigate(tabId)` / `goTo(tabId)` in App.jsx.
6. **No React hooks inside `.map()` callbacks.** Extract to named components if a card/item needs local state.

---

## File structure

```
src/
  App.jsx                  Zone routing, nav, all tab imports, grid components
  index.css                Design tokens, layout classes (no component styles)
  analytics.js             PostHog wrapper — env-var gated, autocapture: false
  tabs/
    HomeTab.jsx
    GradientTab.jsx
    AskTab.jsx
    InterviewPrepTab.jsx
    LandscapeTab.jsx
    ModelsMathTab.jsx
    FeatureEngTab.jsx
    ModelEvalTab.jsx
    SystemDesignTab.jsx
    ClassicalMLTab.jsx
    SparkLabTab.jsx
    AirflowTab.jsx
    dbtTab.jsx
    DataModelingTab.jsx
    DeepLearningTab.jsx
    DLFineTuningTab.jsx
    DLServingTab.jsx
    DataScienceTab.jsx
    CausalInferenceTab.jsx
    TimeSeriesTab.jsx
    MonitoringTab.jsx
    MLOpsDeployTab.jsx
    MLOpsPipelinesTab.jsx
    TakeHomeTab.jsx
    TrainerTab.jsx
    CombinatorTab.jsx
    CodeBugsTab.jsx
    CaseStudiesTab.jsx
    StaffLayerTab.jsx
    JDPrepTab.jsx
    DefenseDocTab.jsx
    VerbatimTab.jsx
    SpotTheFlawTab.jsx          ← Interview zone, added v4.28 (12 scenarios, 5 flaw categories)
    ProjectLabTab.jsx           ← ML Engineering, Pyodide sequential notebook, all 5 phases complete (v4.40)
                                   Phase 1: EDA · Phase 2: Features · Phase 3: Model · Phase 4: Monitoring · Phase 5: Deployment scaffold
                                   19 cells, 5 judgment checkpoints, Telco Churn dataset (synthetic 600-row for training phases)
    LoanDefaultTab.jsx          ← ML Engineering, second ProjectLab dataset — Loan Default (credit risk, ECOA). Phases 1–3 complete (v4.42–v4.43).
                                   Phase 1: Schema + EDA + Proxy Audit · Phase 2: Model Training + ECOA threshold · Phase 3: PSI/KS/Prediction Drift
                                   Phase 4 planned: Deployment Scaffold + Regulatory Model Card. `msl_projectlab_loan_data`.
    (PipelineBlogTab.jsx deleted — was dead code, replaced by GradientTab)
  data/
    testimonials.js             Admin-managed testimonials array. Displayed on HomeTab "What engineers say" section.
  components/
    PythonCell.jsx         Pyodide sandbox wrapper
    GlobalSearch.jsx       Global search component (retained, not wired — replaced by ContentMap)
    ContentMap.jsx         Cmd+K overlay — zone→domain→tab tree + search. Added v4.36.
    AccessGate.jsx         Premium content gate — renders on locked tabs, unlock animation. Added v4.34.
    FeedbackChip.jsx       Floating ★ Rate chip — Formspree POST, 3 rating questions, 30-day cooldown. Added v4.39.
```

---

## Zone routing architecture (App.jsx)

```
TAB_TO_ZONE       maps tabId → zone ('today'|'practice'|'read'|'interview'|'ask')
                  omit a tabId to default it to 'practice'

ZONE_DEFAULTS     what each zone shows on fresh entry
                  null   = show domain/tool grid
                  string = go directly to that tabId

zoneTab           per-zone active tab state (zones are independent)

goTo(tabId)       programmatic navigation, available as onNavigate prop in every tab
```

Zones: `today`, `practice`, `read`, `interview`, `ask`

`ZONE_DEFAULTS.practice = null` → shows PracticeGrid (domain cards)  
`ZONE_DEFAULTS.interview = null` → shows InterviewGrid (tool cards)  
Tapping the active bottom-nav zone button resets it to its default.

---

## Dev and commit workflow

```bash
# Run locally
npm run dev       # → http://localhost:5173
npm run build     # production build (runs on macOS — sandbox builds fail due to ARM64 rollup mismatch)

# Before any git operation — fix recurring lock file issue:
rm -f .git/index.lock .git/HEAD.lock

# Standard commit
git add -A
git commit -m "your message"
git push          # auto-deploys to Vercel
```

**Known git quirk:** `.git/index.lock` and `.git/HEAD.lock` appear frequently and block commits. Always run the `rm -f` line before staging. If push says "Everything up-to-date" after a lock error, the commit itself failed — re-run `git add -A && git commit` after clearing locks.

**Sandbox limitation:** The AI sandbox cannot run `npm run build` successfully (Rollup ARM64 platform mismatch). Use Node.js brace-counting as a build proxy: `node -e "const f=require('fs').readFileSync('src/tabs/X.jsx','utf8'); const o=(f.match(/\{/g)||[]).length, c=(f.match(/\}/g)||[]).length; console.log(o-c)"` — should output `0`.

---

## Working relationship

Act as a product and engineering partner, not an assistant. This means:
- Push back when something doesn't belong, doesn't clear the bar, or is being added out of momentum rather than merit.
- Give a real opinion before executing. If the direction seems wrong, say so first.
- Don't add to IDEAS.md, DECISIONS.md, or any spine file just because something was discussed. Only write it down if it genuinely earns a place.
- "Yes, and—" is not always the right response. Sometimes the right response is "no, here's why."

---

## LinkedIn post protocol

When a screenshot of a LinkedIn post (or any external content) is dropped into a session, evaluate critically before acting. Most posts don't become ideas — that's the default.

1. **Assess** — what is the core practitioner insight? Is it a genuinely testable skill, a failure mode, a judgment call? Or is it just a relatable story with no buildable structure?
2. **Gap-map** — does the app already cover this? If yes, does the post offer a meaningfully different angle, or just more of the same?
3. **Only add to IDEAS.md if** it is differentiated from existing content AND maps to a concrete, buildable scenario. Include: scenario skeleton, seed questions, which tab it belongs in, source note `(Source: LinkedIn post, MMM YYYY)`.
4. **Say so if it doesn't clear the bar** — and explain why. Silence or automatic agreement is not helpful.

The goal is a high-signal IDEAS.md backlog, not a long one.

---

## MD spine files

| File | Purpose | Read when |
|------|---------|-----------|
| `CLAUDE.md` | This file — session briefing | Start of every session |
| `NEXT.md` | Next session queue — max 5 items, specific, ordered. Updated at end of every session. | Immediately after CLAUDE.md, every session |
| `DECISIONS.md` | Architectural rulebook — prescriptive, present-tense | Before making any architectural choice |
| `LINEAGE.md` | Build history — narrative, past-tense | Understanding why something exists |
| `IDEAS.md` | Build backlog — Tier 1/2/3 + In Progress + Retired | Planning what to build next |
| `AUDITS.md` | Health log — findings, resolved/open | Before touching anything; after any audit |
| `METRICS.md` | Analytics & storage taxonomy — PostHog events, localStorage key registry | Before adding any new event or localStorage key |
| `README.md` | External-facing project overview | For new visitors / contributors |
| `ROLLOUT.md` | Beta rollout plan — batches, self-vet checklists, tester briefs, feedback tracking. Operational only; not a backlog. | Before opening any batch to testers |
