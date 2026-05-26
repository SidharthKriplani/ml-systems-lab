# IDEAS.md — Build Backlog

Future-facing. Prioritized. Feeds from AUDITS.md findings and creative sessions.  
Last updated: May 2026

**Rule:** AUDITS.md feeds this file, not the reverse. Audit findings that are buildable features go into Tier 1 here. Features you want to build don't go into AUDITS.md.

---

## In Progress

*Move items here from Tier 1 at the start of a session. Strike through and move to LINEAGE.md when done.*

— nothing in progress —

---

## Tier 1 — High impact, buildable now

### Content
- [ ] **StaffLayerTab or SystemDesignTab: "Do we even need ML?" scenario type** — present a business request framed as an ML problem, user must judge whether ML is actually warranted or if a simpler solution dominates. Seed scenarios: (1) churn prediction where the action is "send an email" → correct answer is just send everyone the email; (2) support ticket auto-categoriser, 8 categories, 2 tickets/day → ML ROI is negative, regex + human triage wins; (3) "AI-powered" fraud flag where the fraud rate is 0.001% → precision/recall economics make a rules engine better. Core judgment: what's the counterfactual action? What volume justifies the model? What's the real cost of a false positive vs. a simpler system? Reveal should model the PM/engineer dialogue cadence from the post — short Socratic questions that expose the assumption. Ties directly into StaffLayerTab's "kill more projects than you ship" ethos. (Source: LinkedIn post, May 2026)
- [ ] Add 5+ Gradient posts — priority order: "feature store time-travel bug" → Feature Engineering, "validation set leakage" → Feature Engineering, "Forecast Failure Zoo" → Time Series, "two failure modes of A/B tests" → Experimentation cross-link, "quantization from first principles: what FP16 throws away" → DL Serving
- [ ] Add YouTube embed IDs to remaining Gradient posts (currently only 3 have videos)
- [ ] Interview Q&A: expand to 100+ questions (currently ~77)
- [ ] TrainerTab: expand MCQ bank from 30 → 60 questions (2 per domain per difficulty tier)
- [ ] CombinatorTab: expand question bank from 50 → 100 (enables 90-min sessions)

### First-Time User friction (from Audit #007)
- [ ] **Rename "Ask" zone → "Search" and add explainer copy** — bottom nav label "Ask" implies AI assistant; AskTab is keyword search over a hardcoded KB. Rename nav label. Add one line above search input: "Search the ML Systems KB — concepts, patterns, failure modes." ~15 min.
- [ ] **Rename Practice-zone "Interview Tools" domain card to "Drills" or "Scenario Drills"** — having an "Interview Tools" domain in Practice AND an "Interview" zone in bottom nav is a naming collision for first-timers. Rename the domain card. ~5 min.
- [ ] **Add numbered sequence labels to Interview zone hub cards** — intended flow JD Prep → Defense → Combinator → Verbal is not communicated. Add step numbers (①②③④) to the relevant tool cards in the hub grid. ~15 min.
- [ ] **Add "Start here" pinned row to GradientTab** — Read zone lands on 25+ posts with no entry point. Pin 2–3 recommended beginner posts per domain, or add a single "Start here" row above the filter bar. ~20 min.

### Mobile fixes
- [ ] CombinatorTab question navigator — pill buttons need larger touch targets on mobile
- [ ] CombinatorTab — countdown timer should pause or warn when user navigates to a different zone
- [ ] VerbatimTab — test SpeechRecognition `onend` auto-restart on Chrome (fires unexpectedly after silence)
- [ ] DefenseDocTab — verify `@media print` PDF export works correctly on Safari and Firefox

### Modules
- [ ] Behavioral question bank in Interview zone — ML-specific situations (disagreed with a metric, shipped despite uncertainty, stakeholder conflict over model decision)
- [ ] Causal Inference: DAG editor — draw causal graph, identify confounders/colliders/mediators interactively (Pyodide)

---

## Tier 2 — High impact, more effort

### Modules
- [ ] Classical ML: Decision boundary visualizer (Pyodide — SVM kernel comparison, tree depth impact)
- [ ] Spark Lab: Memory pressure simulator — given executor config + job spec, predict OOM vs success
- [ ] Deep Learning: Attention head visualization (Pyodide — transformer internals)
- [ ] MLOps: Model Registry Patterns module in CI/CD & Infra tab
- [ ] Monitoring: Alerting decision tree (when to page vs log vs auto-rollback)

### Features
- [ ] Progress export — download full mastery snapshot as JSON (all `msl_*` localStorage keys)
- [ ] Module bookmarking — star a scenario to revisit (`msl_bookmarks`)
- [ ] Scenario difficulty filter in judgment modules (easy/medium/hard)
- [ ] Keyboard navigation: 1/2/3/4 to select options, Enter to confirm
- [ ] Gradient: "Mark as read" per post (localStorage)
- [ ] Global search: keyboard arrow-key navigation through results
- [ ] HomeTab: "Recommended first module" based on role (more opinionated than current CTA)

### Design
- [ ] VerbatimTab: add word count + speaking rate (words/min) in Review screen
- [ ] CombinatorTab: per-domain breakdown chart in Debrief screen
- [ ] StaffLayerTab: "Reset all reveals" button for re-study
- [ ] Practice zone: overall progress percentage on grid header
- [ ] Interview zone: session history summary on hub grid (X sessions run, avg score)
- [ ] Gradient: "Start here" sort option within each domain (beginner-first)

### Gradient posts (remaining from ideation)
- [ ] "The 6 ways a recommendation system can silently stop recommending" → System Design
- [ ] "When DiD breaks: parallel trends violations in practice" → Causal Inference
- [ ] "Cold-start is not a model problem, it's a product problem" → System Design

---

## Tier 3 — Interesting, lower priority

- [ ] Unified "Systems Engineer" cross-lab learning path spanning ML + GenAI + Experimentation (6–8 weeks, cross-lab capstone)
- [ ] Ecosystem cross-links: deep links from GenAI Lab and Experimentation Lab into this project
- [x] ~~OG image for proper social preview~~ — done (2026-05-26, public/og-image.png)
- [x] ~~sitemap.xml for SEO~~ — done (2026-05-26, public/sitemap.xml)
- [ ] "NEW" badge on tabs updated within last 30 days
- [ ] Dark/light mode toggle (currently dark-only — see DECISIONS.md for why this is excluded for now)

---

## Known Bugs

- [ ] `window.scrollTo` on zone switch can feel jarring mid-scroll — consider only triggering on user-initiated nav, not programmatic `onNavigate`
- [ ] Pyodide cold start (~3s first load) — no loading indicator during init in Math Foundations
- [ ] VerbatimTab: SpeechRecognition `onend` fires unexpectedly on some Chrome versions after silence — needs auto-restart
- [ ] CombinatorTab: countdown timer continues running if user switches zones — should pause
- [ ] DefenseDocTab: `@media print` PDF export — needs cross-browser verification (Safari, Firefox)

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
