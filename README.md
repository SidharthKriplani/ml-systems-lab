# ML Systems Lab

> **You can train a model. Can you debug it in production?**

100+ interactive production failure scenarios across 7 engineering domains. No slides, no quizzes — just real system decisions, trade-off judgment, and the kind of reasoning that separates mid-level from senior.

**Live →** [ml-systems-lab-v9xe.vercel.app](https://ml-systems-lab-v9xe.vercel.app)

---

## What it is

Most ML courses teach you to build. This lab teaches you to **judge** — diagnose failures, make trade-off decisions, and reason about production systems the way a senior engineer does.

Every module is a scenario-first interactive. You see a broken system, a metric gone wrong, or a design choice with no obvious answer — and you pick. Then you see how a senior engineer would read it and why.

No account required. No install. Free.

---

## Domains

| Domain | Modules | Coverage |
|---|---|---|
| **ML Engineering** | Math Foundations, Features, Evaluation, System Design, Classical ML | PCA, training-serving skew, metric selection, two-tower retrieval, model failure zoo |
| **Data Engineering** | Spark Lab, Airflow, dbt, Data Modeling | Shuffle hell, DAG failure room, schema drift, OLAP format decisions |
| **Deep Learning** | Training Lab, Fine-tuning, Serving | Vanishing gradients, LoRA vs freeze, quantization tradeoffs, GPU memory math |
| **Data Science** | DS Fundamentals, Causal Inference, Time Series | Simpson's paradox, identification strategies, forecast failure zoo |
| **MLOps** | Monitoring, Deployment, CI/CD & Infra | Drift detection, champion-challenger, blue-green vs canary, rollback decisions |
| **Interview Prep** | Question Bank, Fluency Drills, Timed Practice | 77+ MLE interview questions, weak→strong vocabulary, 4-tier scoring |
| **∇ Gradient** | Long-form posts | Production architecture write-ups, YouTube embeds, linked to practice |

---

## Module types

- **Judgment** — scenario → multi-choice → reveal with answer + trap + reasoning method
- **Sandbox** — real Python (Pyodide in-browser): sklearn, numpy, matplotlib, no server
- **Design** — open-ended system design with a structured framework and reference answer
- **Reference** — curated flashcards, vocabulary drills, timed practice sessions

---

## Learning paths

Seven guided sequences with clear outcomes:

- MLE Interview Ready (2 weeks)
- Data Engineering Track (3 weeks)
- Deep Learning for Production (2 weeks)
- Production ML Fundamentals (3 weeks)
- Staff-Level System Design (4 weeks)
- Data Scientist Track (2 weeks)
- MLOps & Deployment (2 weeks)

Each step links directly to the right module and builds on the previous one.

---

## Tech stack

```
React 18 + Vite          SPA, fast HMR
Tailwind CSS             Utility-first styling
Pyodide                  Python in browser (Math Foundations tab)
PostHog                  Analytics (tab switches, module completions)
Vercel                   Deployment (auto-deploy on push to main)
```

No backend. No database. Progress stored in `localStorage`.

---

## Run locally

```bash
git clone https://github.com/SidharthKriplani/ml-systems-lab
cd ml-systems-lab
npm install
npm run dev
```

Open `http://localhost:5173`.

To build for production:
```bash
npm run build
```

---

## Part of an ecosystem

Three labs. One production mindset.

| Lab | Focus | Link |
|---|---|---|
| **ML Systems Lab** | Core ML, DE, DL, MLOps | This repo |
| **GenAI Systems Lab** | Prompt engineering, RAG, LLM evaluation | [genai-systems-lab-ivory.vercel.app](https://genai-systems-lab-ivory.vercel.app) |
| **Experimentation Lab** | A/B testing, SRM, CUPED, power analysis | [experimentation-systems-lab.vercel.app](https://experimentation-systems-lab.vercel.app) |

---

## Design decisions

- **Dark, dense, terminal-adjacent** — engineers spend their lives in dark UIs. The lab should feel native, not educational.
- **Scenario-first** — every module opens with a real situation before asking anything. No context-free MCQs.
- **No accounts** — localStorage for progress. Lower friction = more usage.
- **Sidebar nav** — replaced domain pill navigation. Single persistent nav tree removes the 3-click depth problem.
- **∇ Gradient as entry point** — long-form posts teach concepts first, then link to the practice module. Read → practice is the intended flow.

---

## Author

Built by [Sidharth Kriplani](https://github.com/SidharthKriplani).
