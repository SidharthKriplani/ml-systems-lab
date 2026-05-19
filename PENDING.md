# Pending Action Items

Tracked improvements, bugs, and feature work. Roughly prioritized top-to-bottom within each section.

---

## High priority

### Content
- [ ] Add 5+ Gradient posts (see LINEAGE.md backlog — start with "feature store time-travel bug" and "why your validation set leaks")
- [ ] Add domain field to any Gradient posts added after May 2026 (domain injection script in `/scripts/inject_domains.py`)
- [ ] Add YouTube embed IDs to remaining 16 posts (currently only 3 have videos)
- [ ] Write "Forecast Failure Zoo" Gradient post (links to Time Series tab)

### Modules
- [ ] Causal Inference: DAG editor module (draw graph → identify confounder/collider/mediator interactively)
- [ ] System Design: RAG architecture judgment module (chunk size, retrieval strategy, reranking)
- [ ] Classical ML: Decision boundary visualizer (Pyodide — SVM kernel comparison)
- [ ] Interview Prep: Add 20+ questions to reach 100 (current: ~77)

### UX
- [ ] LandscapeTab: Update DS role `pathId` to point to `ds_track` learning path
- [ ] Gradient posts: Add estimated reading time to each post card
- [ ] Mobile: Test sidebar overlay on iOS Safari — check touch scroll behavior

---

## Medium priority

### Features
- [ ] Progress export — download mastery snapshot as JSON (localStorage dump)
- [ ] Module bookmarking — star a scenario to revisit it later
- [ ] Scenario difficulty filter in judgment modules (easy / medium / hard)
- [ ] Keyboard navigation for judgment modules (1/2/3/4 to select options, Enter to confirm)
- [ ] Gradient: "Mark as read" per post (stored in localStorage)

### Content
- [ ] Spark Lab: Memory pressure simulator — given executor config, predict OOM vs success
- [ ] Deep Learning: Attention head visualization in Pyodide (transformer internals)
- [ ] Interview Prep: Behavioral question bank (ML-specific situations)
- [ ] MLOps: Add "Model Registry Patterns" module to CI/CD & Infra tab

### Design
- [ ] HomeTab: Replace role-based CTA box with a single "Recommended first module" based on role — more opinionated
- [ ] Gradient: "Start here" ordering within each domain (beginner-first sort option)
- [ ] Global search: Add keyboard arrow-key navigation through results

---

## Low priority / Nice to have

- [ ] Ecosystem cross-links: Add ML Systems Lab links from GenAI Lab and Experimentation Lab homepages
- [ ] Unified "Systems Engineer" cross-lab learning path (ML + GenAI + Experimentation — 6–8 weeks)
- [ ] OG image — generate a proper social preview image for the site (currently uses default Vercel)
- [ ] Dark/light mode toggle (currently dark-only)
- [ ] Changelog: surface changes in UI (small "NEW" badge on recently updated tabs)
- [ ] sitemap.xml for SEO

---

## Bugs / known issues

- [ ] `window.scrollTo` on tab switch causes jarring jump if user is mid-scroll in content — consider scroll-to-top only on sidebar nav clicks, not on programmatic `onNavigate` calls
- [ ] Pyodide cold start (~3s first load) — no loading indicator during Pyodide init in Math Foundations
- [ ] Mobile: Sidebar overlay doesn't close on outside click — only closes on nav item click or Escape key

---

## Done (recently completed)

- [x] Remove desktop topbar — logo + search moved into sidebar, full-width content area
- [x] Causal Inference tab — causal vs predictive, identification strategies, DAG types
- [x] Time Series tab — forecast failure zoo, stationarity selector, anomaly detection tiers
- [x] Gradient curriculum redesign — domain filter, YouTube embeds, domain badges on cards
- [x] System Design Judgment module in InterviewPrepTab
- [x] DS Track learning path added (7th path)
- [x] Sidebar nav replacing domain pill navigation
- [x] HomeTab space optimization — compact stats strip, slim continue bar
