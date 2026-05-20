# Pending Action Items

Tracked improvements, bugs, and feature work. Roughly prioritized top-to-bottom within each section.

Last updated: May 2026

---

## Recently completed ✓

- [x] Bottom-nav 5-zone architecture (Today/Practice/Read/Interview/Ask)
- [x] TakeHomeTab — 15 open-ended questions, textarea, model answer reveal, self-score /20
- [x] TrainerTab — Setup/Drill/Results, domain multi-select, 30-question MCQ bank, weakness heatmap
- [x] CombinatorTab — Config/Session/Debrief, countdown timer, 50-question bank, locked until time ends
- [x] CodeBugsTab — 20 Python/SQL production bugs, 5 domains, AccordionMCQ with code blocks
- [x] CaseStudiesTab — Netflix/Uber/Airbnb/DoorDash/Spotify, 4 escalating questions each
- [x] StaffLayerTab — 12 scenarios, IC3 → IC5 → Staff sequential reveals
- [x] JDPrepTab — paste JD → keyword-ranked Must Know/Important/Good to Have topics
- [x] DefenseDocTab — weighted study brief, @media print PDF export, guided checklist mode
- [x] VerbatimTab — Web Speech API voice practice, 25 questions, 4-criteria self-rating
- [x] App.jsx wiring — all 9 tabs imported, zone-mapped, Practice + Interview grids updated
- [x] Causal Inference tab — causal vs predictive, identification strategies, DAG types
- [x] Time Series tab — forecast failure zoo, stationarity selector, anomaly detection
- [x] InterviewPrepTab system design judgment module
- [x] Sidebar → bottom-nav redesign

---

## High priority

### Content
- [ ] Add 5+ Gradient posts (priority order: "feature store time-travel bug", "why your validation set leaks", "Forecast Failure Zoo")
- [ ] Add YouTube embed IDs to remaining Gradient posts (currently only 3 have videos)
- [ ] Interview Q&A: expand to 100+ questions (currently ~77)
- [ ] TrainerTab: expand MCQ bank from 30 to 60 questions (2 questions per domain per difficulty tier)
- [ ] CombinatorTab: expand question bank from 50 to 100 (enable 90-min sessions)

### Modules
- [ ] Causal Inference: DAG editor — draw causal graph, identify confounders/colliders/mediators
- [ ] System Design: RAG architecture judgment (chunk size, retrieval strategy, reranking decisions)
- [ ] Classical ML: Decision boundary visualizer (Pyodide — SVM kernel comparison, tree depth)
- [ ] Behavioral question bank in Interview zone (ML-specific situations: disagreed with a metric, shipped despite uncertainty)

### UX
- [ ] VerbatimTab: show transcript word count + speaking rate (words/min) in Review screen
- [ ] CombinatorTab: add per-domain breakdown chart in Debrief screen
- [ ] StaffLayerTab: add "Reset all reveals" button for re-study
- [ ] Mobile test: bottom-nav safe-area inset on iPhone (env(safe-area-inset-bottom))

---

## Medium priority

### Features
- [ ] Progress export — download full mastery snapshot as JSON (all localStorage msl_* keys)
- [ ] Module bookmarking — star a scenario to revisit later (localStorage msl_bookmarks)
- [ ] Scenario difficulty filter in judgment modules (easy/medium/hard — hidden metadata already exists)
- [ ] Keyboard navigation for judgment modules (1/2/3/4 to select options, Enter to confirm)
- [ ] Gradient: "Mark as read" per post
- [ ] Global search: keyboard arrow-key navigation through results
- [ ] HomeTab: "Recommended first module" based on selected role (more opinionated CTA)

### Content
- [ ] Spark Lab: Memory pressure simulator — executor config + job → OOM prediction
- [ ] Deep Learning: Attention head visualization (Pyodide)
- [ ] MLOps: Model Registry Patterns module in CI/CD & Infra tab
- [ ] Monitoring: Alerting decision tree (page vs log vs auto-rollback)

### Design
- [ ] Gradient: "Start here" sort option within each domain (beginner-first ordering)
- [ ] Practice zone: overall progress percentage on grid header (currently shows raw counts)
- [ ] Interview zone: session history summary on hub grid (X sessions run, avg score)

---

## Low priority / Nice to have

- [ ] Unified "Systems Engineer" cross-lab learning path (ML + GenAI + Experimentation — 6–8 weeks, cross-lab capstone)
- [ ] Ecosystem cross-links: add ML Systems Lab deep links from GenAI Lab and Experimentation Lab homepages
- [ ] OG image for social preview (currently uses Vercel default)
- [ ] sitemap.xml for SEO
- [ ] Dark/light mode toggle (currently dark-only)
- [ ] "NEW" badge on tabs updated within last 30 days
- [ ] Changelog visible in HomeTab (currently exists in data, not surfaced prominently)

---

## Bugs / known issues

- [ ] `window.scrollTo` on tab switch causes jarring jump if user is mid-scroll — consider only triggering on zone nav clicks, not programmatic `onNavigate`
- [ ] Pyodide cold start (~3s first load) — no loading indicator during Pyodide init in Math Foundations
- [ ] Mobile: test bottom-nav touch behavior on iOS Safari — verify tap targets and safe-area spacing
- [ ] VerbatimTab: SpeechRecognition `onend` fires unexpectedly on some Chrome versions after silence — need auto-restart logic
- [ ] DefenseDocTab: `@media print` hides everything except `.defense-doc-print` — verify this works correctly in all browsers before advertising PDF as a feature
- [ ] CombinatorTab: timer continues if user navigates away (zone switch) — should pause or warn

---

## Architecture notes for future contributors

### Adding a new tab
1. Create `src/tabs/YourTab.jsx` — export default `function YourTab({ onNavigate }) {}`
2. Import in `src/App.jsx`
3. Add to `ALL_TABS` array
4. Add to `TAB_TO_ZONE` if not going to practice zone (default)
5. Add a card to the relevant domain in `PRACTICE_DOMAINS` or `INTERVIEW_TOOLS`

### localStorage conventions
All keys prefixed with `msl_`. Score keys: `msl_score:{tabPrefix}_{moduleId}`.
Format: array of `{id, revealed, selectedOption}` items.
Progress rings read from this format via `readTabProgress()` in App.jsx.

### Zone routing
- `TAB_TO_ZONE`: maps tabId → zone (omit to default to `practice`)
- `ZONE_DEFAULTS`: what each zone shows fresh (null = grid, string = specific tabId)
- `goTo(tabId)`: navigate programmatically from any tab via `onNavigate` prop
