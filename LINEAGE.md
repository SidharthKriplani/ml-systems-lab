# Lineage & Ideas

Design history, inspiration, and future directions for ML Systems Lab.

---

## Origin

Started as a personal study tool — a place to collect production ML judgment patterns that don't appear in textbooks or standard courses. The gap it targets: you can finish an ML course and still freeze when a model degrades silently in production, or when you're asked to choose between blue-green and canary deployment at 3am. The lab is the answer to "where do you practice that?"

---

## Inspiration

| Source | What it shaped |
|---|---|
| **Experimentation Lab** (own project) | Scenario-first judgment module pattern; room-based navigation; the "no slides, just calls" framing |
| **GenAI Systems Lab** (own project) | Confrontational hero headline; production failure as primary learning frame; free + no login philosophy |
| **Josh Starmer / StatQuest** | Concept → intuition → math order. Gradient posts follow this arc. |
| **3Blue1Brown** | Visual + animated math explanation. Aspiration for interactive visualizations in Pyodide cells. |
| **Chip Huyen's writing** | Production ML framing. What actually breaks vs what textbooks cover. |
| **Will Larson's Staff Engineer** | Staff/principal content — decisions at scale, cross-domain trade-offs, platform thinking. |
| **Airbnb/Uber/Spotify eng blogs** | Source material for scenarios. Real incidents, real architectures. |

---

## Design evolution

### v1 — Pill navigation
Two-level domain → tab navigation. Required 3 clicks to get to content. Cognitive load too high. Abandoned.

### v2 — Sidebar + topbar
Persistent left sidebar (220px) with domain groups and color-coded labels. Topbar with logo + search. Improved navigation significantly.

### v3 — Sidebar-only (current)
Removed topbar entirely on desktop. Logo + search moved into sidebar top section. Content area now uses full remaining width (no maxWidth cap). Mobile gets a minimal topbar with hamburger. This is the target state.

### Color system
Dark void background (`#0c0a08`). CSS variables: `--prime` (gold), `--mint`, `--rose`, `--ember`, `--violet`, `--sky`, `--gold`. Each domain has a consistent accent color throughout sidebar, card borders, and eyebrows.

---

## ∇ Gradient philosophy

Gradient is the curriculum entry point, not a blog. The intended flow:

1. User opens a Gradient post (e.g., "Why AUC can lie to you")
2. Post teaches the concept with embedded YouTube + explanation
3. Post ends with a CTA linking to the relevant practice module (e.g., Metric Selector in Evaluation tab)
4. User goes from reading → doing in one click

Posts are categorized by domain (features, eval, math, dl, design, etc.) and filterable via the domain bar at the top of the Gradient tab.

---

## Python sandbox philosophy

Pyodide runs real Python in the browser. The Math Foundations tab uses it for:
- PCA Explorer (actual sklearn PCA, matplotlib scatter)
- SVD Decomposer (numpy linalg.svd)
- Calibration Curves (sklearn calibration_curve)
- NumPy Internals (memory layout, strides)

The rule: Python cells build intuition, they don't replace reading. The modules always have explanatory text first.

Future: more Pyodide cells in Classical ML tab (decision boundary visualization), Causal Inference (propensity score matching visualization).

---

## Content ideas backlog

### New Gradient posts
- "The two failure modes of A/B tests" (links to Experimentation Lab)
- "Why your feature store probably has a time-travel bug"
- "Quantization from first principles: what FP16 actually throws away"
- "The 6 ways a recommendation system can silently stop recommending"
- "When DiD breaks: parallel trends violations in practice"
- "The myth of the validation set: how leakage hides there"

### New modules
- **Causal Inference**: DAG editor (draw your causal graph, identify confounders/colliders)
- **Spark Lab**: Memory pressure simulator — given executor config, predict OOM
- **System Design**: RAG architecture judgment (chunk size, retrieval strategy, reranking decisions)
- **Interview Prep**: Behavioral question bank (ML-specific: describe a time you disagreed with a metric)
- **Deep Learning**: Attention head visualization (transformer internals in Pyodide)
- **Classical ML**: Decision boundary visualizer (Pyodide — SVM kernel comparison, tree depth impact)

### UX improvements
- Progress export — download your mastery snapshot as JSON or share a URL
- Module bookmarking — save specific scenarios you want to revisit
- Scenario difficulty filter in judgment modules (currently hidden)
- Gradient post reading time estimate

---

## Ecosystem context

Three labs. Same production mindset.

```
ML Systems Lab          Core ML, DE, DL, MLOps, DS
GenAI Systems Lab       Prompt engineering, RAG, agents, LLM eval
Experimentation Lab     A/B testing, SRM, CUPED, power analysis, stats
```

The labs are intentionally independent — you can use any one without the others. But the cross-links on each home page are there because a senior engineer needs all three.

Future: a unified "Systems Engineer" learning path that spans all three labs. 6–8 weeks. Each week owns a domain. Final week: a cross-lab capstone (design a production ML system with experiment framework and GenAI component).
