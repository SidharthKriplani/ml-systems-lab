# ML Systems Lab

> **You can train a model. Can you debug it in production?**

200+ interactive production failure scenarios, 9 interview simulation tools, and a timed mock exam system — across 6 engineering domains. No slides, no quizzes — just real system decisions, trade-off judgment, and the reasoning that separates mid-level from senior.

**Live →** [ml-systems-lab-v9xe.vercel.app](https://ml-systems-lab-v9xe.vercel.app)

---

## What it is

Most ML courses teach you to build. This lab teaches you to **judge** — diagnose failures, make trade-off decisions, and reason about production systems the way a senior engineer does.

Every module is scenario-first. You see a broken system, a metric gone wrong, or a design choice with no obvious answer — and you reason through it. Then you see how a senior engineer would read it and why.

**No account. No install. Free.**

---

## Navigation — 5 zones

The app uses a bottom-nav with 5 zones:

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
Math Foundations (PCA/SVD/calibration in Python) · Feature Engineering · Model Evaluation · System Design · Classical ML

### Data Engineering
Spark Lab · Airflow · dbt · Data Modeling

### Deep Learning
Training Lab · Fine-tuning (LoRA/freeze) · DL Serving (quantization/GPU)

### Data Science
DS Fundamentals · Causal Inference · Time Series

### MLOps
Monitoring · Deployment · CI/CD & Infra

### Interview Tools *(in Practice zone)*
Trainer (MCQ drill + weakness heatmap) · Code Bugs (20 Python/SQL bugs) · Case Studies (Netflix/Uber/Airbnb/DoorDash/Spotify) · Staff Layer (IC3 → IC5 → Staff reveals)

---

## Interview zone — 6 tools

| Tool | What it does |
|---|---|
| **Interview Q&A** | 50+ curated MLE questions, model answers, 4-tier scoring |
| **Take-Home Bank** | 15 open-ended system design questions, textarea, model answer reveal, self-score /20 |
| **Combinator** | Timed mock (30/45/60 min) — 50 questions locked until time ends, full debrief |
| **JD Prep** | Paste JD → ranked Must Know / Important / Good to Have topics with nav links |
| **Defense Doc** | Weighted study brief from JD, PDF export, guided checklist mode |
| **Verbal Practice** | Web Speech API voice recording (Chrome/Edge), 25 questions, 4-criteria self-rating |

---

## Module types

- **Judgment** — scenario → multi-choice → reveal with answer + trap + senior reasoning
- **Sandbox** — real Python (Pyodide in-browser): sklearn, numpy, matplotlib
- **Case Study** — multi-part company dossiers with escalating questions
- **Timed Mock** — full exam under countdown, answers locked, debrief after
- **Verbal** — speech-to-text practice with transcript and self-scoring
- **Doc Generator** — JD analysis → PDF study brief

---

## Learning paths

Seven guided sequences (2–4 weeks each):
MLE Interview Ready · Data Engineering Track · Deep Learning for Production ·
Production ML Fundamentals · Staff-Level System Design · Data Scientist Track · MLOps & Deployment

---

## Tech stack

```
React 18 + Vite        SPA, fast HMR
CSS variables          Design system (--void/--depth/--surface/--rim + 6 accent colors)
Space Grotesk          UI font
JetBrains Mono         Code/label font
Pyodide                Python in browser (Math Foundations)
Web Speech API         Voice recording (Verbal Practice)
PostHog                Analytics
Vercel                 Auto-deploy on push to main
```

No backend. No database. All progress in `localStorage`.

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
| **GenAI Systems Lab** | Prompt engineering, RAG, LLM evaluation | [genai-systems-lab-ivory.vercel.app](https://genai-systems-lab-ivory.vercel.app) |
| **Experimentation Lab** | A/B testing, SRM, CUPED, power analysis | [experimentation-systems-lab.vercel.app](https://experimentation-systems-lab.vercel.app) |

Future: a unified "Systems Engineer" path spanning all three labs (6–8 weeks, cross-lab capstone).

---

## Design principles

- **Dark, dense, terminal-adjacent** — feels native to engineers, not educational
- **Scenario-first** — every module opens with a real situation before asking anything
- **No accounts** — localStorage progress, zero friction
- **Bottom-nav 5-zone architecture** — drill-down with breadcrumb nav per zone
- **∇ Gradient as curriculum entry** — read concept → click to practice module
- **Interview zone as simulation layer** — timed exams, voice practice, JD-specific study plans

---

## Author

Built by [Sidharth Kriplani](https://github.com/SidharthKriplani).
