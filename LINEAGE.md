# Lineage & Ideas

Design history, inspiration, and future directions for ML Systems Lab.

---

## Origin

Started as a personal study tool — a place to collect production ML judgment patterns that don't appear in textbooks or standard courses. The gap it targets: you can finish an ML course and still freeze when a model degrades silently in production, or when asked to choose between blue-green and canary at 3am. This lab is the answer to "where do you practice that?"

---

## Inspiration

| Source | What it shaped |
|---|---|
| **Experimentation Lab** (own project) | Scenario-first judgment module pattern; room-based navigation; "no slides, just calls" framing |
| **GenAI Systems Lab** (own project) | Confrontational hero headline; production failure as primary learning frame; free + no login philosophy |
| **Josh Starmer / StatQuest** | Concept → intuition → math order. Gradient posts follow this arc. |
| **3Blue1Brown** | Visual + animated math. Aspiration for interactive visualizations in Pyodide cells. |
| **Chip Huyen's writing** | Production ML framing. What actually breaks vs what textbooks cover. |
| **Will Larson's Staff Engineer** | Staff/principal content — decisions at scale, cross-domain trade-offs, platform thinking. |
| **Airbnb/Uber/Spotify eng blogs** | Source material for scenarios. Real incidents, real architectures. |

---

## Design evolution

### v1 — Pill navigation
Two-level domain → tab navigation. Required 3 clicks to reach content. Cognitive load too high. Abandoned.

### v2 — Topbar + content area
Horizontal tab bar. Scrolled off screen on mobile. Didn't scale past 10 tabs. Abandoned.

### v3 — Sidebar + topbar (long-running)
Persistent 220px left sidebar with domain groups, color-coded labels. Topbar with logo + search. Worked well on desktop, poor on mobile. Ran for many versions.

### v4 — Bottom-nav 5-zone (current)
Replaced sidebar entirely with a bottom nav bar (5 zones: Today / Practice / Read / Interview / Ask). Each zone has its own drill-down state — Practice has a domain grid → tab, Interview has a tool hub → tool. Back breadcrumbs in topbar. Mobile-first but works on desktop. Unlocks the Interview zone as a distinct simulation layer separate from Practice.

Key architectural decisions:
- `TAB_TO_ZONE` maps every tabId to a zone (default: practice)
- `ZONE_DEFAULTS` defines what each zone shows when entered fresh (practice/interview → null = grid)
- Tapping active zone resets to grid (Practice → domain grid, Interview → tool hub)
- `zoneTab` state tracks active sub-tab per zone independently

### Color system
Dark void background (`#0c0a08`). CSS variables: `--prime` (gold), `--mint` (green), `--sky` (cyan), `--ember` (orange), `--rose` (red/pink), `--violet` (purple). Each domain has a consistent accent throughout cards, badges, and eyebrows.

---

## ∇ Gradient philosophy

Gradient is the curriculum entry point, not a blog. Intended flow:

1. User opens a Gradient post (e.g., "Why AUC can lie to you")
2. Post teaches the concept with embedded YouTube + explanation
3. Post ends with CTA linking to the relevant practice module
4. User goes from reading → doing in one click

Posts are categorized by domain and filterable via the domain bar.

---

## Python sandbox philosophy

Pyodide runs real Python in the browser. Math Foundations tab uses it for:
- PCA Explorer (sklearn PCA, matplotlib scatter)
- SVD Decomposer (numpy linalg.svd)
- Calibration Curves (sklearn calibration_curve)
- NumPy Internals (memory layout, strides)

Rule: Python cells build intuition, they don't replace reading. Explanatory text always comes first.

Future cells: decision boundary visualizer (ClassicalML), propensity score matching (CausalInference), attention head heatmap (DeepLearning).

---

## Interview zone philosophy

The Interview zone is a simulation layer, not just Q&A. Built for the 2–4 weeks before an interview:

- **Take-Home Bank** — async thinking, model answer comparison, self-calibration
- **Trainer** — spaced drilling on weak domains via MCQ + heatmap feedback
- **Combinator** — full exam simulation under time pressure (answers locked until done)
- **Code Bugs** — production code reading, not algorithm puzzles
- **Case Studies** — multi-part company scenarios (Netflix/Uber/Airbnb/DoorDash/Spotify)
- **Staff Layer** — IC3 → IC5 → Staff reveals teach how seniority changes your answer
- **JD Prep** — makes the study plan adaptive to the actual JD
- **Defense Doc** — structured output (PDF brief) for self-accountability
- **Verbal Practice** — closes the gap between knowing and saying it out loud

The philosophy: by the time you've run through all 9 tools against a specific JD, you're not cramming — you're simulating.

---

## Content ideas backlog

### New Gradient posts
- "The two failure modes of A/B tests" → links to Experimentation Lab
- "Why your feature store probably has a time-travel bug" → links to Feature Engineering tab
- "Quantization from first principles: what FP16 actually throws away" → links to DL Serving tab
- "The 6 ways a recommendation system can silently stop recommending" → links to System Design tab
- "When DiD breaks: parallel trends violations in practice" → links to Causal Inference tab
- "The myth of the validation set: how leakage hides there" → links to Feature Engineering tab
- "Forecast Failure Zoo: 8 ways time series models fail in production" → links to Time Series tab
- "Cold-start is not a model problem, it's a product problem" → links to System Design tab

### New modules
- **Causal Inference**: DAG editor — draw your causal graph, identify confounders/colliders/mediators interactively
- **Spark Lab**: Memory pressure simulator — given executor config + job description, predict OOM vs success
- **System Design**: RAG architecture judgment — chunk size, retrieval strategy, reranking decision
- **Deep Learning**: Attention head visualization (Pyodide — transformer internals)
- **Classical ML**: Decision boundary visualizer (Pyodide — SVM kernel comparison, tree depth impact)
- **Interview Prep**: Behavioral question bank — ML-specific situations (disagreed with a metric, shipped despite uncertainty)
- **MLOps**: Model Registry Patterns module in CI/CD tab
- **Monitoring**: Alerting decision tree (when to page, when to log, when to rollback automatically)

### UX improvements
- Progress export — download mastery snapshot as JSON
- Module bookmarking — star scenarios to revisit
- Scenario difficulty filter in judgment modules (easy/medium/hard)
- Keyboard navigation for judgment modules (1/2/3/4 to pick, Enter to confirm)
- Gradient "mark as read" per post (localStorage)
- Global search: keyboard arrow-key navigation through results
- HomeTab "Recommended first module" based on selected role (more opinionated than current)
- Gradient "Start here" ordering within each domain (beginner-first sort)

### Platform ideas
- Unified "Systems Engineer" cross-lab learning path (ML + GenAI + Experimentation — 6–8 weeks)
- Ecosystem cross-links: add ML Systems Lab links from GenAI and Experimentation homepages
- OG image for proper social preview
- sitemap.xml for SEO
- Dark/light mode toggle
- "NEW" badges on recently updated tabs

---

## Ecosystem context

```
ML Systems Lab          Core ML, DE, DL, MLOps, DS + interview simulation
GenAI Systems Lab       Prompt engineering, RAG, agents, LLM eval
Experimentation Lab     A/B testing, SRM, CUPED, power analysis, stats
```

The labs are intentionally independent. But a senior engineer needs all three — which is why cross-links exist on each homepage and the unified learning path is the long-term north star.
