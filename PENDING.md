# Pending Action Items

All tracked improvements, bugs, and feature work.
Last updated: May 2026

---

## Recently completed ✓

- [x] Bottom-nav 5-zone architecture (Today / Practice / Read / Interview / Ask)
- [x] TakeHomeTab — 15 open-ended questions, textarea, model answer reveal, self-score /20
- [x] TrainerTab — Setup/Drill/Results, 30-question MCQ bank, domain multi-select, weakness heatmap
- [x] CombinatorTab — Config/Session/Debrief, countdown timer (rose pulse <1 min), 50-question bank locked until time ends
- [x] CodeBugsTab — 20 Python/SQL production bugs, 5 domains, accordion MCQ with code blocks, domain filter pills
- [x] CaseStudiesTab — Netflix/Uber/Airbnb/DoorDash/Spotify, 4 escalating questions each (MCQ + open)
- [x] StaffLayerTab — 12 scenarios, IC3 → IC5 → Staff sequential reveals, gold Staff cards
- [x] JDPrepTab — paste JD → keyword-ranked Must Know / Important / Good to Have with nav links
- [x] DefenseDocTab — weighted study brief, @media print PDF export, guided checklist mode
- [x] VerbatimTab — Web Speech API voice practice, 25 questions, 4-criteria self-rating, history log
- [x] App.jsx wiring — all 9 new tabs imported, zone-mapped, Practice + Interview grids built
- [x] Mobile optimization — safe area inset, responsive grids, touch targets, topbar overflow, dead CSS removed
- [x] README, LINEAGE, PENDING updated with full current state

---

## High priority

### Content
- [ ] Add 5+ Gradient posts — priority: "feature store time-travel bug", "validation set leakage", "Forecast Failure Zoo"
- [ ] Add YouTube embed IDs to Gradient posts (currently only 3 have videos)
- [ ] Interview Q&A: expand to 100+ questions (currently ~77)
- [ ] TrainerTab: expand MCQ bank from 30 → 60 questions (2 per domain per difficulty tier)
- [ ] CombinatorTab: expand question bank from 50 → 100 (enables 90-min sessions)

### Modules
- [ ] Causal Inference: DAG editor — draw causal graph, identify confounders/colliders/mediators
- [ ] System Design: RAG architecture judgment module (chunk size, retrieval, reranking)
- [ ] Classical ML: Decision boundary visualizer (Pyodide — SVM kernels, tree depth)
- [ ] Behavioral question bank in Interview zone (ML-specific situations)

### Mobile fixes remaining
- [ ] CombinatorTab question navigator — pill buttons need larger touch targets on mobile
- [ ] VerbatimTab — test SpeechRecognition `onend` auto-restart on Chrome (fires unexpectedly after silence)
- [ ] DefenseDocTab — verify `@media print` PDF export works correctly on Safari/Firefox
- [ ] CombinatorTab — timer should pause or warn when user navigates to a different zone

---

## Medium priority

### Features
- [ ] Progress export — download full mastery snapshot as JSON (all `msl_*` localStorage keys)
- [ ] Module bookmarking — star a scenario to revisit (`msl_bookmarks`)
- [ ] Scenario difficulty filter in judgment modules (easy/medium/hard)
- [ ] Keyboard navigation: 1/2/3/4 to select options, Enter to confirm
- [ ] Gradient: "Mark as read" per post (localStorage)
- [ ] Global search: keyboard arrow-key navigation through results
- [ ] HomeTab: "Recommended first module" based on role (more opinionated than current CTA)

### Content
- [ ] Spark Lab: Memory pressure simulator — executor config + job → OOM prediction
- [ ] Deep Learning: Attention head visualization (Pyodide)
- [ ] MLOps: Model Registry Patterns module in CI/CD & Infra tab
- [ ] Monitoring: Alerting decision tree (page vs log vs auto-rollback)

### Design
- [ ] Gradient: "Start here" sort option within each domain (beginner-first)
- [ ] Practice zone: overall progress percentage on grid header
- [ ] Interview zone: session history summary on hub grid (X sessions run, avg score)
- [ ] VerbatimTab: add word count + speaking rate (words/min) in Review screen
- [ ] CombinatorTab: per-domain breakdown chart in Debrief screen
- [ ] StaffLayerTab: "Reset all reveals" button for re-study

---

## Low priority / nice to have

- [ ] Unified "Systems Engineer" cross-lab learning path (ML + GenAI + Experimentation — 6–8 weeks)
- [ ] Ecosystem cross-links: ML Systems Lab deep links from GenAI Lab and Experimentation Lab
- [ ] OG image for proper social preview (currently uses Vercel default)
- [ ] sitemap.xml for SEO
- [ ] "NEW" badge on tabs updated in last 30 days
- [ ] Dark/light mode toggle (currently dark-only)

---

## Known bugs

- [ ] `window.scrollTo` on zone switch can feel jarring mid-scroll — consider only triggering on user-initiated nav, not programmatic `onNavigate`
- [ ] Pyodide cold start (~3s first load) — no loading indicator during init in Math Foundations
- [ ] VerbatimTab: SpeechRecognition `onend` fires unexpectedly on some Chrome versions after silence — needs auto-restart
- [ ] CombinatorTab: countdown timer continues running if user switches zones — should pause
- [ ] DefenseDocTab: `@media print` PDF export — needs cross-browser verification (Safari, Firefox)

---

## Architecture notes for future contributors

### Adding a new tab
1. Create `src/tabs/YourTab.jsx` with `export default function YourTab({ onNavigate }) {}`
2. Import in `src/App.jsx`
3. Add `{ id: 'yourtab', component: YourTab }` to `ALL_TABS`
4. Add to `TAB_TO_ZONE` if not going to practice zone (practice is the default)
5. Add a card to `PRACTICE_DOMAINS` (for practice tabs) or `INTERVIEW_TOOLS` (for interview tabs)

### Zone routing rules
- `TAB_TO_ZONE`: omit a tabId to route it to `practice` by default
- `ZONE_DEFAULTS`: set to `null` for a zone to show a grid on fresh entry, or a tabId to land directly
- `goTo(tabId)`: available via `onNavigate` prop in every tab — use it for cross-tab navigation buttons

### localStorage conventions
- All keys prefixed `msl_`
- Score keys: `msl_score:{tabPrefix}_{moduleId}` — array of `{id, revealed, selectedOption}`
- `readTabProgress()` in App.jsx reads all score keys and aggregates into progress rings
- Non-score keys are tab-specific (see README for full list)

### CSS conventions
- Design tokens: CSS variables in `:root` inside `index.css` — never hardcode colors
- Component styles: inline styles on JSX elements using CSS variable references
- Layout classes: `.grid-cards`, `.grid-cards-wide`, `.main-content`, `.bottom-nav-safe` in `index.css`
- No Tailwind utility classes in new tab files — use inline styles with CSS variables only
