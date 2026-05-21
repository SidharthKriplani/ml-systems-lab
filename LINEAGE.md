# Lineage & Ideas

Design history, inspiration, and future directions for ML Systems Lab.
Last updated: May 2026

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
| **Chip Huyen's writing** | Production ML framing — what actually breaks vs what textbooks cover. |
| **Will Larson's Staff Engineer** | Staff/principal content — decisions at scale, cross-domain trade-offs, platform thinking. |
| **Airbnb/Uber/Spotify eng blogs** | Source material for scenarios. Real incidents, real architectures. |

---

## Design evolution

### v1 — Pill navigation
Two-level domain → tab navigation. Required 3 clicks to reach content. Cognitive load too high. Abandoned.

### v2 — Topbar + content area
Horizontal tab bar. Scrolled off screen on mobile. Didn't scale past 10 tabs. Abandoned.

### v3 — Sidebar + topbar (long-running)
Persistent 220px left sidebar with domain groups and color-coded labels. Topbar with logo + search. Worked well on desktop, poor on mobile. Ran for many versions.

### v4 — Bottom-nav 5-zone (current)
Replaced sidebar entirely with a fixed bottom nav bar — 5 zones: Today / Practice / Read / Interview / Ask. Each zone has its own drill-down state. Practice shows a domain grid → module. Interview shows a tool hub → tool. Topbar shows breadcrumb and back button when inside a sub-tab. Mobile-first, works well on desktop too.

Key routing architecture:
- `TAB_TO_ZONE`: maps every tabId → zone (omit = defaults to `practice`)
- `ZONE_DEFAULTS`: what each zone shows fresh (`null` = grid, string = specific tabId)
- `zoneTab`: per-zone active tab state — zones are independent
- Tapping active zone button resets it to its default (Practice → domain grid, Interview → tool hub)
- `goTo(tabId)`: programmatic navigation from any tab via `onNavigate` prop

### v4.1 — Mobile optimization
- `env(safe-area-inset-bottom)` on bottom nav for iPhone home indicator
- Responsive grids: `minmax(min(210px, 100%), 1fr)` — no horizontal scroll on 375px
- Touch targets: `min-height: 36px`, 20px slider thumbs on touch devices
- Topbar overflow: breadcrumb truncates with ellipsis
- `WebkitTapHighlightColor: transparent` removes grey tap flash on iOS Safari
- Dead sidebar CSS removed from index.css

### Color system
Dark void background (`#0c0a08`). CSS variables:
- `--prime` (#f0a500) — gold, primary accent
- `--mint` (#34d399) — success/green
- `--sky` (#22d3ee) — data/cyan
- `--ember` (#f97316) — warning/orange
- `--rose` (#f43f5e) — error/red
- `--violet` (#a78bfa) — secondary accent

Each domain has a consistent accent throughout card borders, eyebrows, and badges.

---

## ∇ Gradient philosophy

Gradient is the curriculum entry point, not a blog. Intended flow:
1. User opens a Gradient post (e.g., "Why AUC can lie to you")
2. Post teaches the concept — explanation + embedded YouTube
3. Post ends with CTA linking to the practice module
4. User goes from reading → doing in one click

Posts are categorized by domain and filterable via domain bar.

---

## Python sandbox philosophy

Pyodide runs real Python in the browser. Math Foundations tab uses it for PCA Explorer, SVD Decomposer, Calibration Curves, and NumPy Internals.

Rule: Python cells build intuition, they don't replace reading. Explanatory text always comes first.

Future cells: decision boundary visualizer (ClassicalML), propensity score matching (CausalInference), attention head heatmap (DeepLearning).

---

## Interview zone philosophy

The Interview zone is a simulation layer, not just a Q&A bank. Built for the 2–4 weeks before an interview:

- **Take-Home Bank** — async deep thinking, model answer comparison, self-calibration
- **Trainer** — spaced drilling on weak domains, MCQ + heatmap feedback loop
- **Combinator** — full exam simulation under time pressure; answers locked until done
- **Code Bugs** — production code reading, not algorithm puzzles
- **Case Studies** — multi-part company scenarios (Netflix/Uber/Airbnb/DoorDash/Spotify)
- **Staff Layer** — IC3 → IC5 → Staff reveals teach how seniority changes your answer
- **JD Prep** — makes the study plan adaptive to the actual job description
- **Defense Doc** — structured output (PDF brief) for self-accountability
- **Verbal Practice** — closes the gap between knowing the answer and saying it out loud

Philosophy: by the time you've run through all 9 tools against a specific JD, you're not cramming — you're simulating.

---

## Ecosystem context

```
ML Systems Lab          Core ML, DE, DL, MLOps, DS + 9 interview simulation tools
GenAI Systems Lab       Prompt engineering, RAG, agents, LLM eval
Experimentation Lab     A/B testing, SRM, CUPED, power analysis, stats
```

The labs are intentionally independent — you can use any one without the others. Cross-links exist on each homepage. The unified learning path is the long-term north star.
