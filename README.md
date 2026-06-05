# ML Systems Lab

You can finish every ML course and still freeze when a model degrades silently in production. Nobody teaches you to debug a stale feature store, or explain a confidence calibration failure, or reason about a latency spike under a new traffic pattern. ML Systems Lab is where you train that. Start with a broken system. Reason through it. See how a senior engineer reads it.

**Can you debug it in production?** Used by 500+ engineers in interview prep and production triage.

**Live →** [ml-systems-lab-v9xe.vercel.app](https://ml-systems-lab-v9xe.vercel.app) · Private beta — email for access

---

## What makes it different

**Pyodide** — Python runs in your browser. No server, no setup. Spark jobs, model training, drift calculations execute for real.

**Web Speech API** — Verbal practice with live transcription. Say your answer out loud. Hear it back. Close the gap between knowing and saying.

**StaffLayer** — IC3 → IC5 → Staff reveals on the same scenario. The only place that shows you what "Staff-level thinking" actually means in ML.

**CodeBugs** — Real production ML code with exactly one buried flaw. Find it before the interviewer does.

---

## Flagship experience: Interview zone

Ten simulation tools built around one goal — walk into the room ready.

- **Combinator** — 45-min timed mock. 100 questions locked until time ends. Full per-domain debrief.
- **Defense Plan** — Paste a JD → gap map → day-by-day study plan. PDF export.
- **Verbal Practice** — Web Speech API voice recording · 25 questions · 4-criteria self-rating.
- **Interview Q&A** — 128 curated MLE questions with model answers and 4-tier scoring.
- **Take-Home Bank** — 15 open-ended system design questions · model answer reveal · self-score /20.
- **Spot the Flaw** — 12 adversarial analyses with a buried methodological error. Find it before the interviewer does.
- **Trainer** — MCQ drill with weakness heatmap and spaced repetition queue.
- **Staff Layer** — IC3 → IC5 → Staff answer reveals on the same question.
- **Code Bugs** — 30 Python/SQL production bugs. One flaw per snippet.

---

## What's inside

300+ scenarios · 6 domains · 10 interview tools

### ML Engineering
Math Foundations (Pyodide sandbox) · Feature Engineering · Model Evaluation · System Design · Classical ML · Project Lab (Pyodide end-to-end notebook)

### Data Engineering
Spark Lab · Airflow · dbt · Data Modeling

### Deep Learning
Training Lab · Fine-tuning (LoRA/freeze) · DL Serving (quantization/GPU)

### Data Science
DS Fundamentals · Causal Inference · Time Series

### MLOps
Monitoring · Deployment · CI/CD & Infra

### Read
∇ Gradient — 25 long-form production ML posts linked directly to practice modules

---

## Quick start

**Live:** [ml-systems-lab-v9xe.vercel.app](https://ml-systems-lab-v9xe.vercel.app)
Private beta. Email for access.

No account. No install. All progress in `localStorage`.

```bash
# Run locally
git clone https://github.com/SidharthKriplani/ml-systems-lab
cd ml-systems-lab
npm install
npm run dev      # → http://localhost:5173
```

---

## Stack

React 18 + Vite SPA · CSS variables design system · Pyodide (Python in-browser) · Web Speech API · localStorage only · Vercel auto-deploy on push to main

---

## Ecosystem

| Lab | Focus | Link |
|---|---|---|
| **ML Systems Lab** | Core ML, DE, DL, MLOps + interview simulation | This repo |
| **GenAI Systems Lab** | Prompt engineering, RAG, LLM evaluation, agents | [genai-systems-lab-ivory.vercel.app](https://genai-systems-lab-ivory.vercel.app) |
| **Experimentation Lab** | A/B testing, SRM, CUPED, power analysis | [experimentation-systems-lab.vercel.app](https://experimentation-systems-lab.vercel.app) |

---

Built by [Sidharth Kriplani](https://github.com/SidharthKriplani).
