import { useState, useEffect } from 'react';

const QUESTIONS = [
  {
    id: 1,
    category: 'System Design',
    question:
      'Design a real-time feature store for a ride-sharing platform serving 50M daily rides. How would you handle feature freshness, backfill, and serving latency under 10ms?',
    modelAnswer:
      'Cover: dual-store architecture (online Redis/Cassandra + offline Hive/Delta), feature versioning via metadata registry (Feast/Tecton patterns), point-in-time correct joins for training, streaming ingestion via Kafka+Flink for real-time features, backfill job using Spark with time-travel, SLO monitoring per feature, cache warming strategies, TTL policies per feature group. Trade-offs: consistency vs. latency (eventual vs. strong), storage cost vs. freshness, centralized vs. decentralized ownership.',
  },
  {
    id: 2,
    category: 'Production',
    question:
      "Your recommendation model's CTR dropped 15% overnight. Walk through your complete investigation and remediation playbook.",
    modelAnswer:
      'Step 1 – Triage: check data pipeline health (null rates, volume drops, schema drift), model serving health (latency p99, error rates), A/B assignment integrity. Step 2 – Segment: break down by platform, user cohort, item category to isolate. Step 3 – Feature drift: compute PSI/KL divergence on input features vs. baseline. Step 4 – Label shift: check if CTR ground truth collection changed (logging bug, UI change). Step 5 – Remediation options: rollback to prior checkpoint, re-score with fresh features, retrain on recent window. Step 6 – Postmortem: add monitoring for feature drift, shadow scoring, canary deployments.',
  },
  {
    id: 3,
    category: 'Statistical Reasoning',
    question:
      'An A/B test shows a 3% lift in 7-day retention with p=0.04. Your PM wants to ship immediately. What concerns do you raise?',
    modelAnswer:
      'Concerns: (1) Multiple comparisons – was this the only metric or did you test many? (2) Novelty effect – 7 days may not capture long-run behavior. (3) Network effects – if users interact, SUTVA is violated. (4) Segment heterogeneity – lift may be concentrated in a small subgroup. (5) Practical significance vs. statistical – 3% lift on what base rate? (6) CUPED/variance reduction not applied? (7) p=0.04 is marginal; request sequential testing or holdback. Recommendation: run a 14-day holdback on 5% of traffic before full launch.',
  },
  {
    id: 4,
    category: 'System Design',
    question:
      'Design the ML infrastructure for a fraud detection system that must make decisions in <100ms with <0.1% false positive rate at $10B daily transaction volume.',
    modelAnswer:
      'Architecture: (1) Synchronous scoring path: feature retrieval from Redis (<5ms) → lightweight gradient boosted tree model (<10ms) → rules engine → decision. (2) Async enrichment: async graph features (device fingerprint, velocity, social graph) fed to a secondary ensemble within 500ms for review queue. (3) Model stack: fast GBT for latency SLO + deep model for high-value transactions. (4) Feedback loop: confirmed fraud labels → daily retraining pipeline → shadow deployment → canary → full rollout. (5) Monitoring: PSI on features, FPR/TPR in real-time, concept drift detection. Trade-offs: precision vs. recall asymmetry (FP costs customer trust, FN costs money), model complexity vs. latency.',
  },
  {
    id: 5,
    category: 'Production',
    question:
      'Describe your approach to ML model versioning, artifact management, and reproducible training pipelines.',
    modelAnswer:
      'Cover: (1) Experiment tracking (MLflow/W&B): log hyperparams, metrics, git SHA, data version. (2) Data versioning: DVC or Delta Lake time-travel, hash training set. (3) Model registry: staging → production promotion with approval gates. (4) Container-based training: Docker image pinned, pip requirements.txt frozen. (5) Feature pipeline versioning: feature transformations versioned alongside model. (6) Reproducibility: seed all RNG, deterministic data ordering, record hardware env. (7) Rollback: keep N prior model versions in registry, automated regression tests on new candidates. (8) Lineage: track data → features → model → serving artifact chain.',
  },
  {
    id: 6,
    category: 'Causal / Experimental',
    question:
      'Your company wants to measure the causal impact of sending a push notification on 30-day LTV. Design the experiment.',
    modelAnswer:
      'Challenges: (1) Interference – users who receive notif may influence control users. (2) Compliance – not all treated users open the notif (ITT vs. LATE). (3) LTV is long-horizon – 30 days means delayed feedback. Design: (1) Cluster-based randomization if network effects suspected. (2) Intent-to-treat analysis as primary; LATE via IV if compliance is low. (3) CUPED on pre-experiment LTV to reduce variance. (4) Holdout group (never-treat) for long-run measurement. (5) Power analysis: 30-day LTV has high variance; compute MDE and required N. (6) Guardrail metrics: short-term engagement, unsubscribe rate. (7) Regression discontinuity or diff-in-diff as alternative if RCT is infeasible.',
  },
  {
    id: 7,
    category: 'Architecture',
    question:
      'Compare Lambda, Kappa, and Delta architectures for an ML feature pipeline. When would you choose each?',
    modelAnswer:
      'Lambda: batch layer (Spark) + speed layer (Flink/Storm) + serving layer. Pro: fault-tolerant, reprocessing easy. Con: dual codebases, consistency issues. Use when: complex batch transforms + low-latency serving needed. Kappa: streaming-only (Kafka + Flink), reprocess by replaying Kafka. Pro: single codebase. Con: reprocessing expensive, stateful joins complex. Use when: all features can be computed from event stream. Delta/Lakehouse: unified batch+stream on Delta Lake/Iceberg with time-travel. Pro: ACID, schema enforcement, unified. Con: newer, tooling still maturing. Use when: on cloud, want simplicity, strong consistency, and ML training data management. In practice: Delta architecture is becoming default for ML platforms.',
  },
  {
    id: 8,
    category: 'System Design',
    question:
      'Design a two-tower retrieval system for a content platform with 100M items and 50M users. How do you handle cold-start, freshness, and ANN serving?',
    modelAnswer:
      'Architecture: (1) User tower: embedding from user history, demographics, context (device, time). (2) Item tower: embedding from content features, engagement history. (3) Training: in-batch negative sampling + hard negatives from popularity-sampled pool. (4) Cold-start: content-based fallback for new items (text/image embeddings), new user → demographic/contextual initialization. (5) Freshness: streaming item embedding updates via online learning or periodic retraining (daily). (6) ANN: FAISS HNSW index, quantized (PQ) for memory. Incremental index updates for new items without full rebuild. (7) Serving: user embedding computed at request time, ANN lookup, post-filter by rules. (8) Evaluation: offline recall@K, online CTR/engagement, coverage metrics.',
  },
  {
    id: 9,
    category: 'Production',
    question:
      "You're tasked with reducing ML inference cost by 50% without degrading key metrics by more than 2%. What strategies do you explore?",
    modelAnswer:
      '(1) Quantization: INT8/FP16 quantization – typically 2-4x speedup, <1% accuracy drop. (2) Pruning: structured pruning of attention heads or neurons. (3) Knowledge distillation: train smaller student model on teacher logits. (4) Caching: cache embeddings for repeat inputs (user/item vectors), result caching for identical requests. (5) Batching: dynamic batching to maximize GPU utilization. (6) Model selection: route simple requests to lighter model (cascade/mixture-of-experts). (7) Hardware: move to more cost-efficient instance types (A10G vs. A100 for inference). (8) Request filtering: rule-based pre-filter before model call. Measure: latency p50/p99, throughput, cost-per-prediction, business metric delta.',
  },
  {
    id: 10,
    category: 'Causal / Experimental',
    question:
      'Explain how you would use difference-in-differences to evaluate the impact of a new ML-powered pricing algorithm.',
    modelAnswer:
      'Setup: (1) Treatment group: markets where new pricing deployed. Control group: comparable markets (matched on size, category mix, historical trends). (2) Parallel trends assumption: verify pre-treatment trends are parallel using placebo tests. (3) DiD estimator: (Y_treated_post - Y_treated_pre) - (Y_control_post - Y_control_pre). (4) Staggered rollout: use Callaway-Sant\'Anna or Sun-Abraham estimators to avoid negative weighting bias. (5) Covariates: include market-level controls (competition index, seasonality). (6) Metrics: GMV, margin, customer satisfaction (NPS proxy). (7) Threats: anticipation effects (markets change behavior pre-treatment), spillover (control markets affected by treated market pricing). (8) Robustness: event study plot showing no pre-trend, placebo outcome test.',
  },
  {
    id: 11,
    category: 'Architecture',
    question:
      'Design the training infrastructure for a large-scale ranking model that requires daily retraining on 10TB of interaction logs.',
    modelAnswer:
      '(1) Data pipeline: Kafka → Spark structured streaming → Delta Lake partitioned by date. Training sample creation: negative sampling, label assignment (delayed feedback handling). (2) Distributed training: PyTorch DDP on 8-32 GPUs, gradient checkpointing for memory, mixed precision. (3) Orchestration: Airflow/Metaflow DAG: data validation → feature engineering → train → evaluate → register → deploy. (4) Evaluation gate: offline metrics (AUC, NDCG) must exceed threshold; shadow traffic A/B before canary. (5) Incremental training: warm-start from prior day\'s checkpoint vs. full retraining – compare divergence. (6) Data quality: Great Expectations checks on training data, feature drift alerts. (7) Infrastructure: spot instances for training, reserved for serving. Total pipeline SLO: complete within 4 hours to ensure daily cadence.',
  },
  {
    id: 12,
    category: 'Statistical Reasoning',
    question:
      "Your model's calibration degrades over time. How do you detect, diagnose, and fix it?",
    modelAnswer:
      'Detection: (1) Calibration curves (reliability diagrams) comparing predicted probability bins vs. observed frequency. (2) Expected Calibration Error (ECE), Maximum Calibration Error (MCE) tracked in production. (3) Hosmer-Lemeshow test for binary outcomes. Diagnosis: (1) Check if label distribution shifted (label noise, selection bias). (2) Feature covariate shift (PSI on input features). (3) Model architecture issue (sigmoid saturation, temperature scaling needed). Fix: (1) Platt scaling or isotonic regression as post-hoc calibration layer. (2) Temperature scaling (scales logits by learned T). (3) Retrain with recent data if drift is the cause. (4) For online models: maintain separate calibration layer updated more frequently than full model.',
  },
  {
    id: 13,
    category: 'System Design',
    question:
      'Design a multi-armed bandit system for personalizing onboarding flows for new users where you have zero user history.',
    modelAnswer:
      "(1) Exploration strategy: Thompson Sampling (Beta-Binomial for binary reward) preferred over ε-greedy for cold-start. (2) Context: use observable features (device, referral source, signup time, country) → Contextual Bandit (LinUCB or Neural Bandit). (3) Arms: 4-8 onboarding flow variants. (4) Reward: short-term proxy (completed step 3, <10 min) for fast feedback; delayed reward (D7 retention) as secondary. (5) Batched updates: update posterior every 1000 impressions to reduce variance. (6) Warm-start: prior from historical user clusters. (7) Constraints: enforce minimum exploration (never below 5% for any arm) to avoid arm starvation. (8) Evaluation: cumulative regret, A/B test final winner vs. uniform random baseline. (9) Gradual shift to exploitation once posterior confidence is high.",
  },
  {
    id: 14,
    category: 'Production',
    question:
      'How do you monitor a production ML system end-to-end? List the signals, tools, and escalation paths.',
    modelAnswer:
      'Layers: (1) Infrastructure: CPU/GPU utilization, memory, latency p50/p99/p999, error rate, pod restarts (Datadog/CloudWatch). (2) Data quality: schema validation, null rates, volume anomalies (Great Expectations, custom checks). (3) Feature drift: PSI/KL divergence on input features vs. training distribution, alerted daily. (4) Prediction distribution: score distribution shift, % predictions above threshold. (5) Business metrics: CTR, conversion, revenue per request – lagged but most important. (6) Label feedback loop: ground truth labels arriving with delay – monitor label rate, coverage. Tools: MLflow for model metrics, Grafana for infra, custom Airflow pipelines for drift. Escalation: automated rollback if error rate >1%, on-call page if p99 latency >2x baseline, model owner alert if PSI >0.2 on critical features.',
  },
  {
    id: 15,
    category: 'Architecture',
    question:
      'You need to serve 20 different ML models with varying latency SLOs (10ms to 2s), hardware requirements (CPU vs. GPU), and traffic patterns. Design the serving platform.',
    modelAnswer:
      '(1) Model classification: group by SLO tier – Tier 1 (<50ms, always-on, GPU), Tier 2 (50-500ms, burstable, CPU/GPU), Tier 3 (>500ms, batch-friendly, CPU). (2) Serving framework: TorchServe/Triton for GPU models, FastAPI/BentoML for CPU. (3) Infrastructure: K8s with node pools per tier, HPA for Tier 2/3, dedicated nodes for Tier 1. (4) Model registry integration: auto-deploy on registry promotion, canary via traffic split (Istio/Envoy). (5) Shared components: feature store client, auth middleware, logging sidecar, rate limiter. (6) Batching: dynamic batching for throughput-sensitive models. (7) Multi-tenancy: namespace isolation, resource quotas per team. (8) Cost optimization: spot for Tier 3, reserved for Tier 1, preemptible for batch. (9) Observability: per-model latency, throughput, cost-per-prediction dashboard.',
  },
];

const CATEGORIES = ['All', 'System Design', 'Production', 'Statistical Reasoning', 'Causal / Experimental', 'Architecture'];

const CATEGORY_COLORS = {
  'System Design': 'var(--sky)',
  'Production': 'var(--rose)',
  'Statistical Reasoning': 'var(--mint)',
  'Causal / Experimental': 'var(--violet)',
  'Architecture': 'var(--ember)',
};

const SCORE_CRITERIA = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'depth', label: 'Depth & Detail' },
  { key: 'tradeoffs', label: 'Trade-off Analysis' },
  { key: 'communication', label: 'Communication Clarity' },
];

function scoreTotal(scores) {
  if (!scores) return 0;
  return (scores.relevance || 0) + (scores.depth || 0) + (scores.tradeoffs || 0) + (scores.communication || 0);
}

function scoreBadgeColor(total) {
  if (total >= 19) return 'var(--prime)';
  if (total >= 15) return 'var(--mint)';
  if (total >= 10) return 'var(--ember)';
  return 'var(--rose)';
}

export default function TakeHomeTab({ onNavigate }) {
  const [expanded, setExpanded] = useState(new Set());
  const [scores, setScores] = useState({});
  const [drafts, setDrafts] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('msl_takehome');
      if (saved) {
        const { scores: s, drafts: d } = JSON.parse(saved);
        if (s) setScores(s);
        if (d) setDrafts(d);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('msl_takehome', JSON.stringify({ scores, drafts }));
    } catch (_) {}
  }, [scores, drafts]);

  function toggleExpanded(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateDraft(id, value) {
    setDrafts(prev => ({ ...prev, [id]: value }));
  }

  function updateScore(id, key, value) {
    setScores(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: Number(value) },
    }));
  }

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10);
    const payload = {
      questions: QUESTIONS.map(q => ({
        id: q.id,
        category: q.category,
        question: q.question,
        draft: drafts[q.id] || '',
        scores: scores[q.id] || {},
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `takehome_answers_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const visibleQuestions = activeCategory === 'All'
    ? QUESTIONS
    : QUESTIONS.filter(q => q.category === activeCategory);

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-hi)', padding: '0 0 48px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--ink-hi)' }}>
            Take-Home Bank
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)' }}>
            15 open-ended questions · self-scored · export your answers
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-low)', lineHeight: 1.55, fontFamily: 'var(--font-sans)', maxWidth: '560px' }}>
            Expand a question, write your answer in the text box, then reveal the model response to compare. Self-score on four dimensions when done. Export your answers as JSON to review later.
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{
            background: 'var(--prime)',
            color: 'var(--void)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Export JSON
        </button>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          const color = cat === 'All' ? 'var(--prime)' : CATEGORY_COLORS[cat] || 'var(--ink-mid)';
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: isActive ? color : 'transparent',
                color: isActive ? 'var(--void)' : color,
                border: `1px solid ${color}`,
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Question cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {visibleQuestions.map(q => {
          const isExpanded = expanded.has(q.id);
          const qScores = scores[q.id];
          const total = scoreTotal(qScores);
          const hasScores = qScores && Object.values(qScores).some(v => v > 0);
          const catColor = CATEGORY_COLORS[q.category] || 'var(--ink-mid)';

          return (
            <div
              key={q.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--rim)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: catColor + '22',
                      color: catColor,
                      border: `1px solid ${catColor}55`,
                      borderRadius: 6,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {q.category}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
                    Q{q.id}
                  </span>
                  {hasScores && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        background: scoreBadgeColor(total) + '22',
                        color: scoreBadgeColor(total),
                        border: `1px solid ${scoreBadgeColor(total)}55`,
                        borderRadius: 20,
                        padding: '2px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {total}/20
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, lineHeight: 1.55, color: 'var(--ink-hi)' }}>
                  {q.question}
                </p>
              </div>

              {/* Textarea */}
              <div style={{ padding: '0 20px 14px' }}>
                <textarea
                  value={drafts[q.id] || ''}
                  onChange={e => updateDraft(q.id, e.target.value)}
                  placeholder="Write your answer here…"
                  style={{
                    width: '100%',
                    minHeight: 120,
                    background: 'var(--depth)',
                    border: '1px solid var(--rim)',
                    borderRadius: 8,
                    color: 'var(--ink-hi)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    padding: '10px 12px',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Toggle model answer */}
              <div style={{ padding: '0 20px 14px' }}>
                <button
                  onClick={() => toggleExpanded(q.id)}
                  style={{
                    background: 'transparent',
                    border: `1px solid var(--rim)`,
                    borderRadius: 7,
                    color: 'var(--ink-mid)',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    padding: '5px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--ink-ghost)', transition: 'transform 0.15s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 2l4 3-4 3"/></svg></span>
                  {isExpanded ? 'Hide Model Answer' : 'Show Model Answer'}
                </button>
              </div>

              {/* Model answer */}
              {isExpanded && (
                <div style={{ margin: '0 20px 16px' }}>
                  <div
                    style={{
                      background: 'var(--depth)',
                      borderLeft: '3px solid var(--prime)',
                      borderRadius: '0 6px 6px 0',
                      padding: '12px 16px',
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: 'var(--ink-mid)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {q.modelAnswer}
                  </div>
                </div>
              )}

              {/* Scoring sliders */}
              <div
                style={{
                  borderTop: '1px solid var(--rim)',
                  padding: '14px 20px 18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px 24px',
                }}
              >
                {SCORE_CRITERIA.map(({ key, label }) => {
                  const val = qScores?.[key] || 1;
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {label}
                        </label>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>
                          {val}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={val}
                        onChange={e => updateScore(q.id, key, e.target.value)}
                        style={{
                          width: '100%',
                          accentColor: 'var(--prime)',
                          cursor: 'pointer',
                          height: 4,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
