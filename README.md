# ML Systems Lab

> **You can train a model. Can you debug it in production?**

200+ interactive production failure scenarios, 9 interview simulation tools, a timed mock exam system, and full mobile optimization — across 6 engineering domains. No slides, no quizzes — just real system decisions, trade-off judgment, and the reasoning that separates mid-level from senior.

**Live →** [ml-systems-lab-v9xe.vercel.app](https://ml-systems-lab-v9xe.vercel.app)

---

## What it is

Most ML courses teach you to build. This lab teaches you to **judge** — diagnose failures, make trade-off decisions, and reason about production systems the way a senior engineer does.

Every module is scenario-first. You see a broken system, a metric gone wrong, or a design choice with no obvious answer — and you reason through it. Then you see how a senior engineer would read it and why.

**No account. No install. Free. Works on mobile.**

---

## Navigation — 5 zones

Bottom nav bar. Each zone has its own drill-down with breadcrumb nav.

| Zone | What's here |
|---|---|
| **Today** | Home dashboard · ML Landscape & careers |
| **Practice** | 6 domain groups · 20+ modules · 200+ scenarios |
| **Read** | ∇ Gradient — long-form posts linked to practice |
| **Interview** | 6 interview simulation tools |
| **Ask** | Consultation space — judgment questions with structured answers |

---

## Practice domains

### ML Engineering
Math Foundations · Feature Engineering · Model Evaluation · System Design · Classical ML

### Data Engineering
Spark Lab · Airflow · dbt · Data Modeling

### Deep Learning
Training Lab · Fine-tuning (LoRA/freeze) · DL Serving (quantization/GPU)

### Data Science
DS Fundamentals · Causal Inference · Time Series

### MLOps
Monitoring · Deployment · CI/CD & Infra

### Interview Tools *(inside Practice)*
Trainer (MCQ drill + weakness heatmap) · Code Bugs (20 Python/SQL production bugs) · Case Studies (Netflix/Uber/Airbnb/DoorDash/Spotify) · Staff Layer (IC3 → IC5 → Staff reveals)

---

## Interview zone — 6 simulation tools

| Tool | What it does |
|---|---|
| **Interview Q&A** | 50+ curated MLE questions, model answers, 4-tier scoring |
| **Take-Home Bank** | 15 open-ended system design questions · textarea · model answer reveal · self-score /20 |
| **Combinator** | Timed mock (30/45/60 min) · 50 questions locked until time ends · full debrief |
| **JD Prep** | Paste a JD → ranked Must Know / Important / Good to Have topics with direct nav links |
| **Defense Doc** | Weighted study brief from JD · PDF export · guided checklist mode |
| **Verbal Practice** | Web Speech API voice recording (Chrome/Edge) · 25 questions · 4-criteria self-rating |

---

## Module types

| Type | Description |
|---|---|
| **Judgment** | Scenario → multi-choice → reveal with answer + trap + senior reasoning |
| **Sandbox** | Real Python in-browser (Pyodide): sklearn, numpy, matplotlib — no server |
| **Case Study** | Multi-part company dossiers (Netflix/Uber/Airbnb/DoorDash/Spotify) with escalating questions |
| **Timed Mock** | Full exam under countdown, answers locked, per-domain debrief after |
| **Verbal** | Speech-to-text practice with transcript and self-scoring |
| **Doc Generator** | JD keyword analysis → weighted PDF study brief |

---

## Learning paths

Seven guided sequences (2–4 weeks each):

- MLE Interview Ready
- Data Engineering Track
- Deep Learning for Production
- Production ML Fundamentals
- Staff-Level System Design
- Data Scientist Track
- MLOps & Deployment

Each step links directly to the right module and builds on the previous one.

---

## Tech stack

```
React 18 + Vite        SPA, fast HMR, Vercel auto-deploy
CSS variables          Design system — --void/--depth/--surface/--rim + 6 accent colors
Space Grotesk          UI font
JetBrains Mono         Code/label font
Pyodide                Python in-browser (Math Foundations tab)
Web Speech API         Voice recording (Verbal Practice tab — Chrome/Edge)
PostHog                Analytics (tab switches, module completions)
Vercel                 Auto-deploy on push to main
```

No backend. No database. All progress in `localStorage`.

**localStorage keys:**
```
msl_tab                    last active tab
msl_score:{prefix}         module scores (revealed/attempted)
msl_takehome               take-home exam drafts + scores
msl_trainer_history        trainer session results
msl_combinator_session     active timed session state (cleared on end)
msl_combinator_history     combinator session results
msl_staff_reveals          staff layer reveal state
msl_jdprep_last            last JD prep analysis
msl_defense_progress       defense doc checklist state
msl_verbal_history         verbal practice sessions
msl_read                   set of Gradient post IDs marked as read
msl_role                   selected role for personalization
msl_path_progress          learning path step completion state
```

---

## Mobile

Fully optimized for mobile:
- Bottom nav with `env(safe-area-inset-bottom)` for iPhone home indicator
- Responsive card grids (`minmax(min(210px, 100%), 1fr)`) — single column on 375px
- Touch-friendly tap targets (min 44px for nav/back button per WCAG 2.5.5)
- `WebkitTapHighlightColor: transparent` — no grey flash on iOS Safari
- Topbar breadcrumb truncates with ellipsis — can't push search button off-screen
- `overflow-x: hidden` on html/body — prevents horizontal scroll from overflow children
- Fixed SVG diagrams (SystemDesign, DLServing) scroll horizontally inside `overflow-x: auto` containers — diagram layout preserved, phone doesn't overflow
- Input `font-size: 16px` — prevents iOS Safari page-zoom on input tap
- iOS Safari: SpeechRecognition unsupported — VerbatimTab shows platform-specific fallback
- High-contrast ink scale — readable at low phone brightness (tested to dark mode minimum)

---

## Run locally

```bash
git clone https://github.com/SidharthKriplani/ml-systems-lab
cd ml-systems-lab
npm install
npm run dev      # → http://localhost:5173
npm run build    # production build
```

---

## Ecosystem

Three labs. One production mindset.

| Lab | Focus | Link |
|---|---|---|
| **ML Systems Lab** | Core ML, DE, DL, MLOps + interview simulation | This repo |
| **GenAI Systems Lab** | Prompt engineering, RAG, LLM evaluation, agents | [genai-systems-lab-ivory.vercel.app](https://genai-systems-lab-ivory.vercel.app) |
| **Experimentation Lab** | A/B testing, SRM, CUPED, power analysis | [experimentation-systems-lab.vercel.app](https://experimentation-systems-lab.vercel.app) |

Long-term north star: a unified "Systems Engineer" learning path spanning all three labs — 6–8 weeks, cross-lab capstone.

---

## Design principles

- **Dark, dense, terminal-adjacent** — feels native to engineers, not educational
- **Scenario-first** — every module opens with a real situation before asking anything
- **No accounts** — localStorage progress, zero friction
- **Bottom-nav 5-zone architecture** — drill-down with breadcrumb per zone; tapping active zone resets to grid
- **∇ Gradient as curriculum entry** — read concept → click to practice module in one step
- **Interview zone as simulation layer** — not just Q&A, but timed exams, voice practice, JD-specific study plans

---

## Author

Built by [Sidharth Kriplani](https://github.com/SidharthKriplani).
