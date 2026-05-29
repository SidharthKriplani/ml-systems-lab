import { useState, useEffect, useRef, useMemo } from 'react'

const INDEX = [
  // ── Spark Lab ──────────────────────────────────────────────────────────
  { id: 'spark', tab: 'spark', icon: '🔥', kind: 'module', title: 'Shuffle Hell Simulator',
    desc: 'Diagnose OOM, spill and skew in Spark shuffle with live DAG visualisation' },
  { id: 'spark', tab: 'spark', icon: '🔥', kind: 'module', title: 'Skew Doctor',
    desc: 'Fix data skew with salting, AQE and repartition — before/after task duration chart' },

  // ── Features ────────────────────────────────────────────────────────────
  { id: 'features', tab: 'features', icon: '🧩', kind: 'module', title: 'Training-Serving Skew Simulator',
    desc: 'Four real skew bugs: time leak, fillna mismatch, scaler version, timezone shift' },
  { id: 'features', tab: 'features', icon: '🧩', kind: 'module', title: 'Feature Store Designer',
    desc: 'Choose storage backends for real-time, near-real-time and batch feature types' },

  // ── Model Eval ──────────────────────────────────────────────────────────
  { id: 'eval', tab: 'eval', icon: '📊', kind: 'module', title: 'Metric Selector',
    desc: 'Pick the right metric under class imbalance — precision, recall, F1, AUC' },
  { id: 'eval', tab: 'eval', icon: '📊', kind: 'module', title: 'A/B Test Designer',
    desc: 'Compute sample size and experiment duration from MDE, power and significance' },
  { id: 'eval', tab: 'eval', icon: '📊', kind: 'module', title: 'Shadow Mode Simulator',
    desc: 'Animated 14-day champion vs challenger comparison with before/after metrics' },

  // ── Models & Math ───────────────────────────────────────────────────────
  { id: 'models', tab: 'models', icon: '∑', kind: 'module', title: 'PCA Explorer',
    desc: 'Real sklearn PCA with scree plot and 2D projection — tune samples, features, noise' },
  { id: 'models', tab: 'models', icon: '∑', kind: 'module', title: 'SVD Decomposer',
    desc: 'Rank-k approximation with singular value spectrum — numpy in the browser' },
  { id: 'models', tab: 'models', icon: '∑', kind: 'module', title: 'Preprocessing Pipeline Lab',
    desc: 'Side-by-side correct vs leaky sklearn pipeline — spot the data leakage' },
  { id: 'models', tab: 'models', icon: '∑', kind: 'module', title: 'Regularization Lab',
    desc: 'L1, L2, ElasticNet on a real dataset — watch coefficients shrink as alpha grows' },
  { id: 'models', tab: 'models', icon: '∑', kind: 'module', title: 'NumPy Internals',
    desc: 'Broadcasting rules, views vs copies, vectorisation benchmark — real Python cells' },
  { id: 'models', tab: 'models', icon: '∑', kind: 'module', title: 'Calibration Curves',
    desc: 'Reliability diagrams, ECE score, Platt scaling vs isotonic regression comparison' },
  { id: 'models', tab: 'models', icon: '∑', kind: 'module', title: 'Python Sandbox',
    desc: 'Free REPL — numpy, sklearn, matplotlib, scipy all available in browser' },

  // ── System Design ───────────────────────────────────────────────────────
  { id: 'design', tab: 'design', icon: '🏗', kind: 'module', title: 'ML Incident Room',
    desc: 'Diagnose a live ML incident: stale embeddings, feature pipeline failure, silent degradation' },
  { id: 'design', tab: 'design', icon: '🏗', kind: 'module', title: 'ML System Design Canvas',
    desc: 'Structured framework — problem framing, data, features, training, serving, monitoring' },
  { id: 'design', tab: 'design', icon: '🏗', kind: 'module', title: 'Two-Tower Explorer',
    desc: 'Design a retrieval model — embedding dims, negative sampling, ANN index tradeoffs' },

  // ── Features ── new ─────────────────────────────────────────────────────
  { id: 'features', tab: 'features', icon: '🧩', kind: 'module', title: 'Window Aggregation Builder',
    desc: 'Generate SQL and PySpark for tumbling, sliding, session windows — with gotchas per config' },

  // ── Monitoring ──────────────────────────────────────────────────────────
  { id: 'monitor', tab: 'monitor', icon: '📡', kind: 'module', title: 'Drift Dashboard',
    desc: 'Synthetic 60-day time series with hidden drift onset — tune PSI threshold to catch it' },
  { id: 'monitor', tab: 'monitor', icon: '📡', kind: 'module', title: 'PSI Lab',
    desc: 'Real-time PSI calculation with distribution shift slider and bin-by-bin chart' },
  { id: 'monitor', tab: 'monitor', icon: '📡', kind: 'module', title: 'KS Test Explorer',
    desc: 'Interactive KS statistic and p-value visualization — shift mean and variance to see D move' },
  { id: 'monitor', tab: 'monitor', icon: '📡', kind: 'module', title: 'Alert Tuner',
    desc: 'Configure PSI/KS/accuracy alert rules and simulate detection delay vs false positive rate' },

  // ── Interview ───────────────────────────────────────────────────────────
  { id: 'interview', tab: 'interview', icon: '🎯', kind: 'module', title: 'System Design Questions',
    desc: '52 questions across system design, features, evaluation, Spark, coding, architecture' },
  { id: 'interview', tab: 'interview', icon: '🎯', kind: 'module', title: 'Timed Practice Mode',
    desc: '45-minute interview simulation with shuffled questions, reveal/skip flow, overtime detection' },
  { id: 'interview', tab: 'interview', icon: '🎯', kind: 'module', title: 'Meta / Google / Airbnb / Uber / Amazon',
    desc: 'Company-tagged ML interview questions with model answers and frameworks' },

  // ── ML Landscape ────────────────────────────────────────────────────────
  { id: 'landscape', tab: 'landscape', icon: '🌍', kind: 'module', title: 'Roles & Specialisations',
    desc: 'MLE, MLOps, Research, Applied Scientist, Data Scientist, ML Platform — demand, salary, day-in-life' },
  { id: 'landscape', tab: 'landscape', icon: '🌍', kind: 'module', title: 'Salary by Level & Region',
    desc: 'L3–L7 base vs TC for US, UK, Germany, India — animated bars with region toggle' },
  { id: 'landscape', tab: 'landscape', icon: '🌍', kind: 'module', title: 'ML Stack by Company Stage',
    desc: 'Seed to Big Tech — how infra, tooling and philosophy changes as you scale' },
  { id: 'landscape', tab: 'landscape', icon: '🌍', kind: 'module', title: 'Company ML Systems',
    desc: 'Netflix, Spotify, Uber, Airbnb, Google, Meta — key ML systems and what makes them interesting' },
  { id: 'landscape', tab: 'landscape', icon: '🌍', kind: 'module', title: 'ML History Timeline',
    desc: 'AlexNet 2012 to agents 2025 — the twelve inflection points that defined modern ML engineering' },
  { id: 'landscape', tab: 'landscape', icon: '🌍', kind: 'module', title: 'Global Job Markets',
    desc: 'San Francisco, London, Berlin, Amsterdam, Toronto, Singapore, Bangalore — where and why' },

  // ── Spark Lab ── new ──────────────────────────────────────────────────────
  { id: 'spark', tab: 'spark', icon: '🔥', kind: 'module', title: 'Partition Tuner',
    desc: 'Choose optimal partition count — coalesce vs repartition, AQE config, file-size targets' },
  { id: 'spark', tab: 'spark', icon: '🔥', kind: 'module', title: 'Broadcast Join Decisions',
    desc: '6 scenarios: when to broadcast, autoBroadcastJoinThreshold, skewJoin hints, join strategy selection' },
  { id: 'spark', tab: 'spark', icon: '🔥', kind: 'module', title: 'OOM Diagnosis',
    desc: 'Diagnose out-of-memory failures: driver OOM vs executor OOM, memory fractions, spill to disk' },

  // ── System Design ── new ────────────────────────────────────────────────
  { id: 'design', tab: 'design', icon: '🏗', kind: 'module', title: 'DS Ownership Chain',
    desc: '17-node production ML lifecycle — interactive map of who owns which decision at each stage' },
  { id: 'design', tab: 'design', icon: '🏗', kind: 'module', title: 'Serving Tradeoffs',
    desc: 'Batch vs online vs streaming serving decisions, latency SLA, throughput math' },
  // ── Classical ML ─────────────────────────────────────────────────────────
  { id: 'classical', tab: 'classical', icon: '🌲', kind: 'module', title: 'Model Failure Zoo',
    desc: 'Silent production failure modes for 8 classical models — when linear regression, SVM, or trees quietly break' },
  { id: 'classical', tab: 'classical', icon: '🌲', kind: 'module', title: 'Ensemble Lab',
    desc: 'Bagging vs boosting vs stacking decisions — when each helps and when it hurts in production' },
  { id: 'classical', tab: 'classical', icon: '🌲', kind: 'module', title: 'Hyperparameter Priority',
    desc: 'Which hyperparameters matter most per model type — and why tuning them all is a waste' },

  // ── Airflow ───────────────────────────────────────────────────────────────
  { id: 'airflow', tab: 'airflow', icon: '⚙️', kind: 'module', title: 'DAG Failure Room',
    desc: 'Diagnose 8 types of broken Airflow DAGs: trigger rules, timezone bugs, zombie tasks, upstream failures' },
  { id: 'airflow', tab: 'airflow', icon: '⚙️', kind: 'module', title: 'Backfill Decision Lab',
    desc: 'When to backfill, from when, in what order — and the downstream risks most teams skip' },
  { id: 'airflow', tab: 'airflow', icon: '⚙️', kind: 'module', title: 'Late Data Handler',
    desc: 'SLA miss detection, deferred evaluation windows, late data handling patterns for batch and streaming' },

  // ── dbt ───────────────────────────────────────────────────────────────────
  { id: 'dbt', tab: 'dbt', icon: '🔧', kind: 'module', title: 'Materialization Oracle',
    desc: 'Table vs view vs incremental vs ephemeral — when each breaks in production and why' },
  { id: 'dbt', tab: 'dbt', icon: '🔧', kind: 'module', title: 'Schema Drift Clinic',
    desc: 'What breaks downstream when upstream columns change — and how to catch it before prod' },
  { id: 'dbt', tab: 'dbt', icon: '🔧', kind: 'module', title: 'Incremental Decisions',
    desc: 'is_incremental(), unique_key, full-refresh triggers, late data handling in dbt incremental models' },

  // ── Data Modeling ─────────────────────────────────────────────────────────
  { id: 'modeling', tab: 'modeling', icon: '🗄️', kind: 'module', title: 'Star vs OBT Selector',
    desc: 'Star schema vs One Big Table tradeoffs — query performance, maintenance, and team skill requirements' },
  { id: 'modeling', tab: 'modeling', icon: '🗄️', kind: 'module', title: 'SCD Type Selector',
    desc: 'SCD Types 1/2/3 decisions — when to overwrite, when to preserve history, when to add a column' },
  { id: 'modeling', tab: 'modeling', icon: '🗄️', kind: 'module', title: 'OLAP Format Showdown',
    desc: 'Iceberg vs Delta Lake vs Hive — time travel, ACID, schema evolution, engine compatibility tradeoffs' },

  // ── Deep Learning ─────────────────────────────────────────────────────────
  { id: 'dl', tab: 'dl', icon: '🧠', kind: 'module', title: 'Training Failure Diagnosis',
    desc: 'Diagnose 8 training failure types from telemetry: NaN loss, vanishing gradients, dead ReLUs, data leakage' },
  { id: 'dl', tab: 'dl', icon: '🧠', kind: 'module', title: 'Backprop Debugging',
    desc: 'Per-layer gradient norms, weight histograms — identify dead layers and unstable training dynamics' },

  // ── DL Fine-tuning ────────────────────────────────────────────────────────
  { id: 'dl_finetune', tab: 'dl_finetune', icon: '🔬', kind: 'module', title: 'Freeze vs Full Fine-tune vs LoRA',
    desc: 'Given model size and labeled data budget — which fine-tuning approach and why' },
  { id: 'dl_finetune', tab: 'dl_finetune', icon: '🔬', kind: 'module', title: 'Learning Rate Strategy',
    desc: '8 scenarios on LR warmup, decay schedules, and layer-wise LR — the knob that matters most' },
  { id: 'dl_finetune', tab: 'dl_finetune', icon: '🔬', kind: 'module', title: 'PEFT Methods Comparison',
    desc: 'LoRA vs prefix tuning vs adapter layers — parameter efficiency vs performance tradeoffs' },

  // ── DL Serving ────────────────────────────────────────────────────────────
  { id: 'dl_serving', tab: 'dl_serving', icon: '🚀', kind: 'module', title: 'Quantization Tradeoffs',
    desc: 'FP32 vs FP16 vs INT8 vs INT4 — accuracy loss vs latency gain under your hardware constraints' },
  { id: 'dl_serving', tab: 'dl_serving', icon: '🚀', kind: 'module', title: 'GPU Memory Calculator',
    desc: 'Will the model fit? KV cache sizing, batch size math, multi-GPU tensor parallelism tradeoffs' },
  { id: 'dl_serving', tab: 'dl_serving', icon: '🚀', kind: 'module', title: 'Serving Architecture Selector',
    desc: 'REST vs Triton vs Ray Serve vs vLLM — given your model type, latency SLA, and traffic shape' },

  // ── MLOps: Deployment ─────────────────────────────────────────────────────
  { id: 'mlops_deploy', tab: 'mlops_deploy', icon: '🚢', kind: 'module', title: 'Deployment Strategy Selector',
    desc: 'Blue-green vs canary vs shadow vs feature flag — which strategy for which production scenario' },
  { id: 'mlops_deploy', tab: 'mlops_deploy', icon: '🚢', kind: 'module', title: 'Champion-Challenger Decisions',
    desc: 'The 4-decision promotion framework — metrics threshold, latency SLA, rollback trigger design' },
  { id: 'mlops_deploy', tab: 'mlops_deploy', icon: '🚢', kind: 'module', title: 'Rollback Decisions',
    desc: '8 production alert scenarios — rollback immediately, investigate first, or monitor only?' },

  // ── MLOps: CI/CD & Infra ──────────────────────────────────────────────────
  { id: 'mlops_pipes', tab: 'mlops_pipes', icon: '🔩', kind: 'module', title: 'CI/CD Gate Design',
    desc: 'Which CI gates block the pipeline vs warn only — how ML CI/CD differs from software CI/CD' },
  { id: 'mlops_pipes', tab: 'mlops_pipes', icon: '🔩', kind: 'module', title: 'Infrastructure Decisions',
    desc: 'REST API vs Triton Inference Server vs Ray Serve vs vLLM — given scale and model type' },
  { id: 'mlops_pipes', tab: 'mlops_pipes', icon: '🔩', kind: 'module', title: 'Model Registry Patterns',
    desc: 'Version management, lineage tracking, approval workflows — model registry design decisions' },

  // ── Data Science ──────────────────────────────────────────────────────────
  { id: 'ds', tab: 'ds', icon: '📈', kind: 'module', title: 'Model Selection Oracle',
    desc: 'When linear vs tree vs neural — the decision framework that gets you 80% of the way' },
  { id: 'ds', tab: 'ds', icon: '📈', kind: 'module', title: 'Analysis Mistakes',
    desc: "8 statistical antipatterns: p-hacking, Simpson's paradox, survivorship bias, Goodhart's Law" },
  { id: 'ds', tab: 'ds', icon: '📈', kind: 'module', title: 'Calibration Clinic',
    desc: 'When predicted probabilities are lying — reliability diagrams, ECE, Platt scaling vs isotonic' },
  { id: 'ds', tab: 'ds', icon: '📈', kind: 'module', title: 'Metric Design Pitfalls',
    desc: "Goodhart's Law, proxy metrics, leading vs lagging indicators, and metric decomposition" },

  // ── Causal Inference ──────────────────────────────────────────────────────
  { id: 'causal', tab: 'causal', icon: '🔀', kind: 'module', title: 'Causal vs Predictive',
    desc: '8 scenarios: identify whether a problem needs causal inference or prediction — and why it matters' },
  { id: 'causal', tab: 'causal', icon: '🔀', kind: 'module', title: 'Identification Strategies',
    desc: 'RCT, DiD, PSM/IPW, IV, RDD, Synthetic Control — match strategy to your data constraints' },
  { id: 'causal', tab: 'causal', icon: '🔀', kind: 'module', title: 'Confounder or Collider',
    desc: '6 DAG scenarios: identify confounders, colliders, mediators, and when to control for each' },
  { id: 'causal', tab: 'causal', icon: '🔀', kind: 'module', title: 'Backdoor Criterion',
    desc: '6 DAG questions: front-door criterion, unobserved confounding, partial adjustment bias' },
  { id: 'causal', tab: 'causal', icon: '🔀', kind: 'module', title: 'Uplift Modeling',
    desc: 'CATE estimation: T-learner, X-learner, Qini evaluation, doubly-robust AIPW — who actually responds' },
  { id: 'causal', tab: 'causal', icon: '🔀', kind: 'module', title: 'Obs vs Experimental',
    desc: 'When observational data is sufficient vs when you need an experiment — DiD, holdout designs, ethics' },

  // ── Time Series ───────────────────────────────────────────────────────────
  { id: 'ts', tab: 'ts', icon: '📉', kind: 'module', title: 'Forecast Failure Zoo',
    desc: 'Why forecasts fail in production: temporal leakage, nonstationarity, structural breaks, sparse series' },
  { id: 'ts', tab: 'ts', icon: '📉', kind: 'module', title: 'Stationarity & Transforms',
    desc: 'ADF test, differencing, log transforms — how to diagnose and fix non-stationary time series' },
  { id: 'ts', tab: 'ts', icon: '📉', kind: 'module', title: 'Anomaly Detection Tiers',
    desc: 'Statistical thresholds vs isolation forest vs LSTM autoencoders — tiered detection strategy' },
  { id: 'ts', tab: 'ts', icon: '📉', kind: 'module', title: 'TS Model Selector',
    desc: '6 scenarios: ARIMA vs Prophet vs LSTM vs NeuralProphet — match model to your series properties' },
  { id: 'ts', tab: 'ts', icon: '📉', kind: 'module', title: 'TS Feature Engineering',
    desc: 'Lag features, rolling windows, Fourier terms, holiday encoding — production-grade TS feature patterns' },

  // ── Gradient posts ──────────────────────────────────────────────────────
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Why Your Model Works in Training but Fails in Production',
    desc: 'The four most common training-serving skew bugs and how to catch them before they cost you' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Spark Shuffle: The Silent Job Killer',
    desc: 'What really happens during a shuffle, why it kills your jobs, and how to fix it' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'AUC vs F1 vs Precision@K: Choosing the Right Eval Metric',
    desc: 'The metric you optimise during training is a contract with your business objective' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Building a Recommendation System That Doesn\'t Embarrass You',
    desc: 'Two-tower retrieval, HNSW indexing, and the parts of rec system design interviews skip' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Concept Drift Is Not Your Model\'s Fault',
    desc: 'PSI, KS test, and the monitoring strategy that actually catches drift before users complain' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'PCA Isn\'t Magic — Here\'s What It Actually Does',
    desc: 'Eigenvectors, explained variance, and why you should always check the scree plot' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Feature Stores: Why Everyone Gets the Architecture Wrong',
    desc: 'The four-layer architecture that separates good feature stores from maintenance nightmares' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'The ML Engineer Interview: A Brutally Honest Framework',
    desc: 'What Staff engineers actually look for, the most common mistakes, and how to fix them' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Gradient Descent: What Your Intuition Gets Wrong',
    desc: 'SGD vs Adam vs RMSProp — loss landscapes, saddle points, and why momentum matters' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'SHAP Values: Feature Importance That Actually Makes Sense',
    desc: 'Game-theoretic attribution, Shapley values, and how to use SHAP without lying to stakeholders' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'The Cold Start Problem: Beyond Popularity Heuristics',
    desc: 'Content-based bootstrapping, user onboarding signals, and the meta-learning angle' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Distributed Training: Data Parallel vs Model Parallel',
    desc: 'AllReduce, gradient accumulation, pipeline parallelism — when to use which pattern' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: '10 ML Interview Mistakes Even Senior Engineers Make',
    desc: 'The subtle errors that tank otherwise-strong candidates — and exactly how to avoid them' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'The ML Engineer Salary Map 2025',
    desc: 'Where the money is, why it\'s there, and what L3–L7 means in TC across US, UK, EU and Asia' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'How Netflix Became an ML Company',
    desc: 'From DVD recommendations to personalization at scale — what every engineer can learn from it' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'The Real ML Stack: From Jupyter to $10B Infrastructure',
    desc: 'How the tools, processes and people change as you go from notebook to production at scale' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'AlexNet to Agents: The Twelve Years That Rewrote Everything',
    desc: '2012–2025: twelve inflection points that changed what ML engineering means in practice' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Where in the World to Be an ML Engineer in 2025',
    desc: 'San Francisco, London, Berlin, Singapore, Bangalore — real tradeoffs, real salary and visa data' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'The MLE Career Ladder: What L3 to L7 Actually Means',
    desc: 'What changes at each level, what "impact" means in practice, and what trips up the L4→L5 jump' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'The Validation Set Is Lying to You',
    desc: 'Four leakage patterns nobody warns you about — and how each one inflates validation metrics silently' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'The Feature Store Time-Travel Bug',
    desc: 'How point-in-time join errors quietly corrupt models — and how to build joins that are correct by construction' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Reading the Spark Execution DAG',
    desc: 'The diagnostic skill nobody teaches — how to read plans, stages, and task metrics to find the real bottleneck' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Three Drift Signals That Predict Model Failure',
    desc: 'PSI, population-level shift, and label drift — leading indicators that give you 2 weeks of warning' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'The 6-Step ML System Design Framework',
    desc: 'The structured framework that answers any ML system design question in an interview or on the job' },
  { id: 'gradient', tab: 'gradient', icon: '∇', kind: 'post', title: 'Why Your Forecast Was Wrong Before It Ran',
    desc: 'The 8 silent killers of production forecasting — from temporal leakage to sparse series collapse' },
]

const KIND_COLORS = {
  module: { bg: 'rgba(52,211,153,0.10)', color: 'var(--mint)', border: 'rgba(52,211,153,0.25)' },
  post:   { bg: 'rgba(56,189,248,0.10)', color: 'var(--sky)',  border: 'rgba(56,189,248,0.25)' },
}

const TAB_LABELS = {
  spark: 'Spark Lab', features: 'Features', eval: 'Eval', models: 'Models & Math',
  design: 'System Design', monitor: 'Monitoring', interview: 'Interview', gradient: 'Gradient',
  landscape: 'ML Landscape', classical: 'Classical ML',
  airflow: 'Airflow', dbt: 'dbt', modeling: 'Data Modeling',
  dl: 'Deep Learning', dl_finetune: 'Fine-tuning', dl_serving: 'DL Serving',
  mlops_deploy: 'Deployment', mlops_pipes: 'CI/CD & Infra',
  ds: 'Data Science', causal: 'Causal Inference', ts: 'Time Series',
}

function match(item, q) {
  if (!q) return true
  const s = q.toLowerCase()
  return item.title.toLowerCase().includes(s) || item.desc.toLowerCase().includes(s) || (TAB_LABELS[item.tab] || '').toLowerCase().includes(s)
}

export default function GlobalSearch({ onClose, onNavigate }) {
  const [query, setQuery]   = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef  = useRef(null)
  const listRef   = useRef(null)

  const results = useMemo(() => INDEX.filter(item => match(item, query)).slice(0, 12), [query])

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setCursor(0) }, [query])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    if (e.key === 'Enter' && results[cursor]) { onNavigate(results[cursor].tab); onClose() }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-box slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', width: 'calc(100% - 32px)' }}>

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid var(--rim)' }}>
          <span style={{ fontSize: '16px', color: 'var(--ink-low)', flexShrink: 0 }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search modules, posts, topics…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--ink-hi)', fontSize: '15px', fontFamily: "'Inter',sans-serif" }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--ink-low)', cursor: 'pointer', fontSize: '13px', padding: '2px 6px', borderRadius: '4px' }}>
              ✕
            </button>
          )}
          <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', background: 'var(--rim)', padding: '2px 7px', borderRadius: '4px', color: 'var(--ink-low)', flexShrink: 0 }}>Esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-low)', fontSize: '14px' }}>
              No results for <span style={{ color: 'var(--ink-mid)' }}>"{query}"</span>
            </div>
          ) : results.map((item, i) => {
            const isActive = i === cursor
            const kindStyle = KIND_COLORS[item.kind]
            return (
              <button
                key={`${item.tab}-${item.title}`}
                data-active={isActive}
                onMouseEnter={() => setCursor(i)}
                onClick={() => { onNavigate(item.tab); onClose() }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(52,211,153,0.06)' : 'none',
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: 1, marginTop: '1px', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: isActive ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '99px', fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase', background: kindStyle.bg, color: kindStyle.color, border: `1px solid ${kindStyle.border}`, flexShrink: 0 }}>
                      {item.kind}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-low)', marginLeft: 'auto', flexShrink: 0 }}>
                      {TAB_LABELS[item.tab]}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer hints */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 16px', borderTop: '1px solid var(--rim)', fontSize: '11px', color: 'var(--ink-ghost)' }}>
          {[['↑↓', 'navigate'], ['↵', 'open'], ['Esc', 'close']].map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <kbd style={{ fontFamily: "'JetBrains Mono',monospace", background: 'var(--rim)', padding: '1px 5px', borderRadius: '3px', fontSize: '10px', color: 'var(--ink-low)' }}>{k}</kbd>
              {v}
            </span>
          ))}
          <span style={{ marginLeft: 'auto' }}>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
