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

  // ── Trainer ───────────────────────────────────────────────────────────────
  { id: 'trainer', tab: 'trainer', icon: '⚡', kind: 'tool', title: 'MCQ Trainer',
    desc: 'Flashcard-style drill across all 6 ML domains. Answer one question at a time, see explanation, track accuracy.' },
  { id: 'trainer-heat', tab: 'trainer', icon: '⚡', kind: 'tool', title: 'Domain Weakness Heatmap',
    desc: 'Post-session accuracy breakdown by domain — Feature Eng, Model Eval, MLOps, Deep Learning, Data Eng, System Design.' },

  // ── Combinator ────────────────────────────────────────────────────────────
  { id: 'combinator', tab: 'combinator', icon: '⏱', kind: 'tool', title: 'Full Mock Exam',
    desc: '30, 45, or 60-minute timed exam. Answers locked until you finish. Debrief shows weakest domains and score history.' },
  { id: 'combinator-debrief', tab: 'combinator', icon: '⏱', kind: 'tool', title: 'Exam Debrief & Score History',
    desc: 'Post-exam domain breakdown sorted by accuracy. Session history across all past exams. Share-score button.' },

  // ── Defense Plan ──────────────────────────────────────────────────────────
  { id: 'defense', tab: 'defense', icon: '🛡', kind: 'tool', title: 'Defense Plan',
    desc: 'Paste a JD, self-rate your gaps, get a personalized day-by-day study plan with round-by-round coverage.' },
  { id: 'defense-jd', tab: 'defense', icon: '🛡', kind: 'tool', title: 'JD Gap Analysis',
    desc: 'Extracts required skills, signals and competency expectations from any ML job description. Maps to prep surface.' },

  // ── Code Bugs ─────────────────────────────────────────────────────────────
  { id: 'bug-1',  tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Spark Job OOM — Skewed Join',
    desc: 'Identify the bug causing OOM in a Spark job due to uneven key distribution across partitions.' },
  { id: 'bug-2',  tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Spark Streaming — Data Loss on Restart',
    desc: 'Find the missing checkpoint configuration causing data loss when a Spark streaming job restarts.' },
  { id: 'bug-3',  tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Spark — Wrong Window Aggregation',
    desc: 'Spot the incorrect window function causing aggregation to include rows outside the intended time window.' },
  { id: 'bug-4',  tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Spark — UDF Performance Regression',
    desc: 'Identify why a Python UDF causes a 10x slowdown vs the same logic in native Spark SQL.' },
  { id: 'bug-5',  tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Target Encoding Data Leakage',
    desc: 'Find the leakage: target encoding applied before train/test split inflates validation AUC silently.' },
  { id: 'bug-6',  tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Feature Store Point-in-Time Leakage',
    desc: 'Spot the point-in-time join bug that allows future feature values into training data.' },
  { id: 'bug-7',  tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Imputation Fitted on Wrong Data',
    desc: 'Identify why fitting the imputer on the full dataset before splitting contaminates the validation set.' },
  { id: 'bug-8',  tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Infinite Values After Log Transform',
    desc: 'Find the missing guard causing log(0) to produce -inf and silently corrupt downstream features.' },
  { id: 'bug-9',  tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Wrong Cross-Validation on Time Series',
    desc: 'Spot the use of random k-fold CV on time series data — shuffles temporal order, leaks future into past.' },
  { id: 'bug-10', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Class Imbalance — Using Accuracy',
    desc: 'Identify why accuracy is the wrong metric for a 99:1 imbalanced classification problem.' },
  { id: 'bug-11', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Gradient Exploding — Missing Clipping',
    desc: 'Find the missing gradient clipping that causes loss to go NaN during training.' },
  { id: 'bug-12', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Eval Mode Not Set During Inference',
    desc: 'Spot the missing model.eval() call — dropout and batch norm behave incorrectly at inference time.' },
  { id: 'bug-13', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'NULL Handling in SQL Aggregation',
    desc: 'Find the NULL propagation bug causing aggregates to silently exclude rows rather than error.' },
  { id: 'bug-14', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Window Function Ordering Bug',
    desc: 'Identify the missing or wrong ORDER BY in a window function producing non-deterministic rankings.' },
  { id: 'bug-15', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Fanout in JOIN Inflating Metrics',
    desc: 'Find the many-to-many join producing duplicate rows that inflate downstream aggregation metrics.' },
  { id: 'bug-16', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Incorrect Cohort Retention Query',
    desc: 'Spot the cohort definition bug — retention query includes users who joined after the cohort window.' },
  { id: 'bug-17', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Model Loaded Inside Request Handler',
    desc: 'Identify why loading the model inside the request handler causes 10s cold-start on every prediction.' },
  { id: 'bug-18', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Silent Training Failure — No Validation',
    desc: 'Find the missing validation loop — model trains without any evaluation, loss curve looks fine, quality is garbage.' },
  { id: 'bug-19', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Race Condition in Feature Pipeline',
    desc: 'Spot the race condition causing non-deterministic feature values when parallel jobs write to the same partition.' },
  { id: 'bug-20', tab: 'codebugs', icon: '🐛', kind: 'bug', title: 'Unpinned Dependencies — Reproducibility Failure',
    desc: 'Identify why unpinned package versions in requirements.txt cause training results to drift across environments.' },

  // ── Case Studies ──────────────────────────────────────────────────────────
  { id: 'case-netflix', tab: 'casestudies', icon: '📺', kind: 'scenario', title: 'Netflix: Homepage Play Rate Drop',
    desc: 'Play rate drops 12% after 8,000 new titles added — offline NDCG unchanged. Cold-start, position bias, diversity metrics.' },
  { id: 'case-uber', tab: 'casestudies', icon: '🚗', kind: 'scenario', title: 'Uber: Surge Pricing Failure on NYE',
    desc: "Surge model predicts normal demand on New Year's Eve — 90-day rolling window misses annual events. Demand forecasting design." },
  { id: 'case-airbnb', tab: 'casestudies', icon: '🏠', kind: 'scenario', title: 'Airbnb: Search Ranking Proxy Bias',
    desc: 'Rankings discriminate by host demographics despite no demographic features used — proxy features, fairness interventions.' },
  { id: 'case-doordash', tab: 'casestudies', icon: '🍕', kind: 'scenario', title: 'DoorDash: ETA Model Accuracy',
    desc: 'Delivery ETA model degrades in new markets — training distribution mismatch, confounding signals, cold-start markets.' },
  { id: 'case-spotify', tab: 'casestudies', icon: '🎵', kind: 'scenario', title: 'Spotify: Podcast Discovery Cannibalization',
    desc: 'New podcast discovery feature cannibalizes music listening — experiment design, multi-objective optimization, guardrail metrics.' },

  // ── Staff Layer ───────────────────────────────────────────────────────────
  { id: 'sl-1',  tab: 'stafflayer', icon: '◈', kind: 'scenario', title: "Staff Layer: A/B test shows p=0.03 lift",
    desc: 'IC3 read vs Staff read — what the p-value actually means, practical significance, and the right next step.' },
  { id: 'sl-2',  tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Model accuracy dropped 3% overnight',
    desc: 'IC3 vs Staff diagnosis — triage order, segment analysis, pipeline vs model vs label root cause framework.' },
  { id: 'sl-3',  tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: PyTorch vs TensorFlow choice',
    desc: "How a Staff engineer frames a framework decision — it's not technical, it's about team, ecosystem and migration cost." },
  { id: 'sl-4',  tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Recommendation model returning same 10 items',
    desc: 'Popularity collapse diagnosis — IC vs Staff framing of diversity, exploration budget, feedback loop breaks.' },
  { id: 'sl-5',  tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: New ML feature requested in 2 weeks',
    desc: 'Scope negotiation and risk framing — what Staff pushes back on vs executes, fast-path vs sustainable build.' },
  { id: 'sl-6',  tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Top feature is proxy for demographics',
    desc: 'Fairness, proxy bias, legal risk — IC response vs Staff responsibility framing and escalation.' },
  { id: 'sl-7',  tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Latency spiked 50ms to 200ms after update',
    desc: 'IC triage vs Staff decision framework — rollback threshold, investigation vs ship calculus.' },
  { id: 'sl-8',  tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: DS wants to use latest SOTA model from a paper',
    desc: 'Research-to-production gap — how Staff evaluates novelty vs risk, replication burden, operational cost.' },
  { id: 'sl-9',  tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Training data sparse in new market',
    desc: 'Cold-start strategy — IC vs Staff framing of transfer learning, data acquisition, acceptable quality floor.' },
  { id: 'sl-10', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Stakeholder wants 50 new features',
    desc: 'Feature prioritization — how Staff reframes the conversation from feature count to signal value and maintenance cost.' },
  { id: 'sl-11', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Model 95% accurate but low adoption',
    desc: 'Accuracy vs trust gap — Staff diagnosis of why product teams ignore the model and what actually drives adoption.' },
  { id: 'sl-12', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Retrain daily vs weekly decision',
    desc: 'Retraining cadence — IC operational view vs Staff cost/benefit framing of staleness risk vs pipeline cost.' },
  { id: 'sl-13', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Churn prediction for retention email',
    desc: 'PM wants ML churn model — Staff flags ethical concerns, selection bias, and counterfactual evaluation gap.' },
  { id: 'sl-14', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Auto-categorize support tickets',
    desc: '8-category ticket classifier at low volume — when Staff says "this is not an ML problem" and what to build instead.' },
  { id: 'sl-15', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Fraud detection at 0.001% base rate',
    desc: 'Extreme class imbalance — IC vs Staff framing of precision/recall tradeoff, operational integration, false positive cost.' },
  { id: 'sl-16', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Semantic search to replace keyword search',
    desc: 'Embedding search migration — Staff scoping of recall regression risk, hybrid search, rollback strategy.' },
  { id: 'sl-17', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: HR wants employee churn prediction',
    desc: 'Ethical ML red flag — Staff responsibility when asked to build surveillance-adjacent models.' },
  { id: 'sl-18', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: SRM check flags p=0.001 on A/B test',
    desc: 'Sample ratio mismatch — IC troubleshooting vs Staff decision of whether results are usable at all.' },
  { id: 'sl-19', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Strong 7-day lift vanishes by day 30',
    desc: 'Novelty effect vs genuine treatment effect — Staff diagnosis and holdback design to separate them.' },
  { id: 'sl-20', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: 12 simultaneous A/B tests on same users',
    desc: 'Interaction effects, experiment pollution — Staff framing of sequential vs factorial design, experiment queue.' },
  { id: 'sl-21', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Network effect contaminates A/B test',
    desc: 'Social feature SUTVA violation — Staff-level recognition of when standard A/B is invalid and cluster RCT needed.' },
  { id: 'sl-22', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Model degrades after major product redesign',
    desc: 'Distribution shift from UI change — how Staff distinguishes feature drift from concept drift from logging breakage.' },
  { id: 'sl-23', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Feature 0.8 offline corr but no A/B lift',
    desc: 'Offline-online gap — Staff diagnosis of spurious correlation, selection bias in training data, overfitting to history.' },
  { id: 'sl-24', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Churn model for retention campaign (v2)',
    desc: 'Causal vs predictive confusion — Staff explains why a predictive churn model selects the wrong users to treat.' },
  { id: 'sl-25', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: 2 tickets/day ticket classifier',
    desc: 'Volume too low for ML — Staff recognises the "build a model" instinct is wrong; correct answer is a rules engine.' },
  { id: 'sl-26', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: 50-SKU recommendation engine',
    desc: 'Catalog too small for two-tower retrieval — Staff frames this as a ranking problem, not a retrieval problem.' },
  { id: 'sl-27', tab: 'stafflayer', icon: '◈', kind: 'scenario', title: 'Staff Layer: Fraud model at 1-in-100,000 transactions',
    desc: 'Precision at extreme rarity — Staff calculates FP cost, questions whether ML adds value over rule-based detection.' },

  // ── Verbal Practice ───────────────────────────────────────────────────────
  { id: 'v-1',  tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Design a real-time recommendation system',
    desc: 'Walk through a rec system for 100M users. Record out loud, get live transcript, rate on 4 dimensions.' },
  { id: 'v-2',  tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Bagging vs boosting',
    desc: 'Explain the difference and when to use each. Recorded verbal answer + self-rating.' },
  { id: 'v-3',  tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Feature store from scratch',
    desc: 'How would you build a feature store? Walk through the key components and architecture.' },
  { id: 'v-4',  tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Model failed in production',
    desc: 'Behavioral — tell me about a time a model you built failed in production.' },
  { id: 'v-5',  tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Gradient boosting algorithm',
    desc: 'Walk through the gradient boosting algorithm step by step. Recorded verbal practice.' },
  { id: 'v-6',  tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: A/B testing platform design',
    desc: 'Design an A/B testing platform for a company running 100 concurrent experiments.' },
  { id: 'v-7',  tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Simpler model vs complex model',
    desc: 'When would you choose a simpler model over a more complex one despite worse offline metrics?' },
  { id: 'v-8',  tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Attention mechanisms in transformers',
    desc: 'Explain self-attention and what problem it solves. Verbal + transcription.' },
  { id: 'v-9',  tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Production ML monitoring end-to-end',
    desc: 'Walk through how you would monitor a production ML model. All layers: data, features, predictions, business.' },
  { id: 'v-10', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Pushing back on a stakeholder',
    desc: 'Behavioral — describe a time you pushed back on a stakeholder request and how you handled it.' },
  { id: 'v-11', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Training-serving skew',
    desc: 'What is training-serving skew and how do you prevent it? Verbal explanation + self-rating.' },
  { id: 'v-12', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Fraud detection FPR spike investigation',
    desc: 'Case study — fraud detection false positive rate spiked overnight. Walk through your investigation.' },
  { id: 'v-13', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Online learning vs batch retraining',
    desc: 'Tradeoffs between online learning and batch retraining. Verbal answer + 4-axis self-rating.' },
  { id: 'v-14', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: NDCG vs AUC',
    desc: 'Explain how NDCG works and when to use it over AUC. Verbal + transcription + WPM.' },
  { id: 'v-15', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Point-in-time correct feature pipeline',
    desc: 'Design a data pipeline that ensures point-in-time correct features for model training.' },
  { id: 'v-16', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Most technically complex ML project',
    desc: 'Behavioral — tell me about the most technically complex ML project you have worked on.' },
  { id: 'v-17', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Causal inference in ML systems',
    desc: 'What is causal inference and why does it matter for ML systems? Verbal answer + self-rating.' },
  { id: 'v-18', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Neural network vs gradient boosting on tabular data',
    desc: 'When would you choose a neural network vs GBM for a tabular dataset? Verbal explanation.' },
  { id: 'v-19', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Multi-model serving infrastructure',
    desc: 'Design a model serving infra that handles multiple models with different latency SLOs.' },
  { id: 'v-20', tab: 'verbal', icon: '🎙', kind: 'tool', title: 'Verbal: Deciding when a model is ready to ship',
    desc: 'How do you decide when a model is ready to go to production? Verbal + transcript + self-rating.' },

  // ── Take-Home ─────────────────────────────────────────────────────────────
  { id: 'th-1',  tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: Feature store for ride-sharing',
    desc: 'Design a real-time feature store serving 50M daily rides — freshness, backfill, <10ms serving latency.' },
  { id: 'th-2',  tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: CTR dropped 15% overnight',
    desc: 'Complete investigation and remediation playbook for a recommendation model CTR drop.' },
  { id: 'th-3',  tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: A/B test 3% lift, p=0.04 — ship?',
    desc: 'PM wants to ship immediately. What concerns do you raise? Multiple comparisons, novelty effect, SUTVA.' },
  { id: 'th-4',  tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: Fraud detection <100ms at $10B volume',
    desc: 'Design ML fraud detection infra — <100ms decisions, <0.1% FPR, 10B daily transactions.' },
  { id: 'th-5',  tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: ML model versioning and reproducibility',
    desc: 'Describe your approach to model versioning, artifact management, and reproducible training pipelines.' },
  { id: 'th-6',  tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: Causal impact of push notification on LTV',
    desc: 'Design an experiment to measure the causal effect of a push notification on 30-day LTV.' },
  { id: 'th-7',  tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: Lambda vs Kappa vs Delta architecture',
    desc: 'Compare Lambda, Kappa, and Delta architectures for an ML feature pipeline. When would you choose each?' },
  { id: 'th-8',  tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: Two-tower retrieval at 100M items',
    desc: 'Design a two-tower retrieval system — cold-start, freshness, ANN serving for 100M items and 50M users.' },
  { id: 'th-9',  tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: Reduce inference cost 50%',
    desc: 'Reduce ML inference cost by 50% without degrading key metrics by more than 2%. Enumerate strategies.' },
  { id: 'th-10', tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: DiD for ML pricing algorithm',
    desc: 'Use difference-in-differences to evaluate the impact of a new ML-powered pricing algorithm.' },
  { id: 'th-11', tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: Daily retraining infra for 10TB logs',
    desc: 'Design training infrastructure for a large-scale ranking model requiring daily retraining on 10TB interaction logs.' },
  { id: 'th-12', tab: 'takehome', icon: '📝', kind: 'tool', title: 'Take-Home: Model calibration degrades over time',
    desc: 'How do you detect, diagnose, and fix calibration drift in a production model? ECE, Platt scaling, isotonic.' },
]

const KIND_COLORS = {
  module:   { bg: 'rgba(52,211,153,0.10)',  color: 'var(--mint)',   border: 'rgba(52,211,153,0.25)' },
  post:     { bg: 'rgba(56,189,248,0.10)',  color: 'var(--sky)',    border: 'rgba(56,189,248,0.25)' },
  tool:     { bg: 'rgba(212,175,55,0.10)',  color: 'var(--prime)',  border: 'rgba(212,175,55,0.25)' },
  bug:      { bg: 'rgba(251,113,133,0.10)', color: 'var(--rose)',   border: 'rgba(251,113,133,0.25)' },
  scenario: { bg: 'rgba(167,139,250,0.10)', color: 'var(--violet)', border: 'rgba(167,139,250,0.25)' },
}

const TAB_LABELS = {
  spark: 'Spark Lab', features: 'Features', eval: 'Eval', models: 'Models & Math',
  design: 'System Design', monitor: 'Monitoring', interview: 'Interview Prep', gradient: 'Gradient',
  landscape: 'ML Landscape', classical: 'Classical ML',
  airflow: 'Airflow', dbt: 'dbt', modeling: 'Data Modeling',
  dl: 'Deep Learning', dl_finetune: 'Fine-tuning', dl_serving: 'DL Serving',
  mlops_deploy: 'Deployment', mlops_pipes: 'CI/CD & Infra',
  ds: 'Data Science', causal: 'Causal Inference', ts: 'Time Series',
  trainer: 'Trainer', combinator: 'Combinator', codebugs: 'Code Bugs',
  casestudies: 'Case Studies', stafflayer: 'Staff Layer',
  verbal: 'Verbal Practice', takehome: 'Take-Home', defense: 'Defense Plan',
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
                    <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: '14px', color: isActive ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '99px', fontWeight: 600, fontFamily: "var(--font-sans)", letterSpacing: '0.04em', textTransform: 'uppercase', background: kindStyle.bg, color: kindStyle.color, border: `1px solid ${kindStyle.border}`, flexShrink: 0 }}>
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
