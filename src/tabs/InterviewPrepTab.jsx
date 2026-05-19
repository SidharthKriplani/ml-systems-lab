import { useState, useMemo } from 'react'

const QUESTIONS = [
  // ─── ML System Design ────────────────────────────────────────────────────
  { id: 1,  cat: 'System Design', company: 'Meta',    level: 'Senior',   q: 'Design a feed ranking system for a social network with 1B users.', framework: ['Problem framing: relevance? engagement? diversity?', 'Data: user events, item metadata, social graph', 'Features: user–item interaction, freshness, social signals', 'Model: two-stage (retrieval → ranking), GBDT or neural ranker', 'Serving: <100ms P99, feature store for online features', 'Monitoring: CTR, dwell time, diversity metrics, position bias'] },
  { id: 2,  cat: 'System Design', company: 'Spotify', level: 'Senior',   q: 'Design a music recommendation system that personalises the home screen.', framework: ['Candidate generation: collaborative filtering + content-based', 'Two-tower model: user embedding + track embedding', 'Negative sampling: in-batch vs hard negatives', 'Freshness: re-rank for new releases, mood signals', 'A/B testing: metric choice (stream rate vs skip rate)', 'Cold start: popularity + genre for new users'] },
  { id: 3,  cat: 'System Design', company: 'Airbnb', level: 'Senior',   q: 'Design a search ranking system for property listings.', framework: ['Query understanding: location, dates, guests, price range', 'Candidate retrieval: ANN on listing embeddings', 'Ranking: LTR model (ListNet/LambdaMART)', 'Features: listing quality, host response rate, price competitiveness, user history', 'Exploration vs exploitation: ε-greedy or UCB', 'Business constraints: host fairness, availability filtering'] },
  { id: 4,  cat: 'System Design', company: 'Uber',    level: 'Mid',      q: 'Design a fraud detection system for payment transactions.', framework: ['Real-time constraints: <50ms decision latency', 'Features: transaction amount, velocity, device fingerprint, geo-velocity', 'Model: GBDT for tabular, threshold tuning for precision vs recall', 'Class imbalance: SMOTE? Cost-sensitive learning? Both are wrong. Threshold tuning.', 'Feedback loop: confirmed fraud labels, dispute resolution lag', 'Monitoring: fraud rate, false positive rate, chargeback rate'] },
  { id: 5,  cat: 'System Design', company: 'Google', level: 'Staff',    q: 'Design an ML platform for a company with 500 ML engineers.', framework: ['Feature store: offline (Hive/BQ) + online (Redis/Bigtable)', 'Training: managed jobs, experiment tracking (MLflow), hyperparameter tuning', 'Model registry: versioning, lineage, A/B routing', 'Serving: low-latency inference service, batch scoring pipeline', 'Monitoring: data quality, model performance, drift detection', 'Governance: feature sharing, model cards, access control'] },
  { id: 6,  cat: 'System Design', company: 'Netflix', level: 'Senior',   q: 'Design an A/B testing platform for ML model evaluation.', framework: ['Randomisation unit: user? session? item? (pick wrong → bias)', 'Metric selection: guardrail metrics vs success metrics', 'Sample size calculation: power, MDE, significance level', 'Novelty effect: burn-in period before measuring', 'Interaction effects: overlapping experiments', 'Analysis: t-test, delta method for ratio metrics, CUPED for variance reduction'] },

  // ─── Feature Engineering ─────────────────────────────────────────────────
  { id: 7,  cat: 'Features', company: 'Any',     level: 'Mid',      q: 'What is training-serving skew and how do you detect it?', answer: 'Training-serving skew is when features computed at training time have different distributions than at serving time. Causes: different code paths, different null handling, timestamp bugs, data leakage. Detection: log serving features → compare PSI/KS against training distribution. Fix: use a feature store with a single computation path for both.' },
  { id: 8,  cat: 'Features', company: 'Any',     level: 'Mid',      q: 'Explain the difference between online and offline features. When would you use each?', answer: 'Offline features (batch): computed over historical data, updated periodically (hours/days). E.g., user lifetime value, 30-day purchase count. Low latency to compute, stale by design. Online features (real-time): computed on-the-fly at serving time. E.g., current session page views, cart contents. Fresh but expensive. Hybrid: pre-compute aggregates offline, serve from feature store, update streaming.' },
  { id: 9,  cat: 'Features', company: 'Meta',    level: 'Senior',   q: 'How would you handle a feature with 40% missing values in production?', answer: 'Depends on the missing mechanism. MCAR: mean/median imputation fine. MAR: impute with conditional mean or model. MNAR (most dangerous): encode missingness as a feature itself (binary indicator), model the missing pattern. Never drop rows in production. Always store the imputation strategy computed at training time (in a feature store or artefact) and apply the same logic at serving. Monitor % missing over time as its own drift signal.' },
  { id: 10, cat: 'Features', company: 'Airbnb',  level: 'Senior',   q: 'Design a feature store for a real-time recommendation system serving 10K QPS.', answer: 'Two layers: (1) Offline store (Hive/BigQuery): historical features, training data generation, batch transforms. (2) Online store (Redis/DynamoDB): pre-computed features for sub-millisecond lookup at serving. Key design: materialise offline → online with a streaming pipeline (Flink/Spark Streaming). TTL per feature type. Single feature computation code used in both layers (Python UDFs or dbt). Monitor feature freshness and null rates in both layers.' },
  { id: 11, cat: 'Features', company: 'Any',     level: 'Mid',      q: 'What is target encoding and what are its risks?', answer: 'Target encoding replaces a categorical feature with the mean target value for that category. Risk: data leakage if computed on the full dataset before splitting (test labels influence training features). Fix: compute on training fold only (k-fold cross-validation style). Also: apply additive smoothing for low-frequency categories (blend with global mean). Never use in streaming/online settings without careful stale-value management.' },
  { id: 12, cat: 'Features', company: 'Any',     level: 'Mid',      q: 'How do you handle high-cardinality categorical features?', answer: 'Options by cardinality level: Low (< 20): one-hot. Medium (20–1000): target encoding (with smoothing), embedding layer. High (>1000): hashing trick (FeatureHasher), learned embeddings, frequency-based truncation. For entity IDs (user_id, product_id): always use embeddings in neural models. In tree models: target encoding or frequency encoding. Watch for: cardinality explosion across feature crosses.' },

  // ─── Model Evaluation ────────────────────────────────────────────────────
  { id: 13, cat: 'Evaluation', company: 'Any',     level: 'Mid',      q: 'When would you use PR-AUC over ROC-AUC?', answer: 'Use PR-AUC when positive class is rare (< 10–15% of data). ROC-AUC can be misleadingly high with class imbalance because it accounts for true negatives, which are abundant and easy to classify. PR-AUC focuses only on the positive class precision-recall tradeoff — better for fraud detection, medical diagnosis, spam filtering. Rule of thumb: if you care about the minority class, use PR-AUC.' },
  { id: 14, cat: 'Evaluation', company: 'Uber',    level: 'Senior',   q: 'How do you evaluate a model in shadow mode before promoting to production?', answer: 'Log challenger predictions alongside champion predictions (no user impact). Compare: (1) offline metrics on traffic sample, (2) prediction distribution similarity (KL divergence), (3) latency P50/P99, (4) error rate. Define promotion criteria upfront: e.g., PR-AUC ≥ champion + 2pp, latency ≤ 1.2× champion. Run for sufficient duration (2+ weeks) to cover weekly patterns. Watch for novelty effect if testing on clicked items.' },
  { id: 15, cat: 'Evaluation', company: 'Any',     level: 'Mid',      q: 'Explain calibration. When does a model need to be calibrated?', answer: 'A model is calibrated if P(y=1 | score=0.7) ≈ 0.7 in reality. Calibration matters when: (1) scores are used as probabilities for downstream decisions, (2) comparing scores across models, (3) setting business thresholds. Neural networks and boosted trees are often miscalibrated (overconfident). Methods: Platt scaling (logistic regression on scores), isotonic regression (non-parametric). Assess with reliability diagrams and expected calibration error (ECE).' },
  { id: 16, cat: 'Evaluation', company: 'Meta',    level: 'Senior',   q: 'How do you measure the impact of a ranking model change in production?', answer: 'Online A/B test with proper randomisation (user-level to avoid interference). Success metrics: business KPI (revenue, engagement). Guardrail metrics: latency, error rate, diversity. Watch: (1) novelty effect — users click more on novel items initially, (2) position bias — lower positions get fewer clicks regardless of quality (correct with IPW or cascade model), (3) delayed conversions — some outcomes take days/weeks to materialise (use holdout + long experiment window).' },

  // ─── PySpark & Data Engineering ──────────────────────────────────────────
  { id: 17, cat: 'Spark', company: 'Any',     level: 'Mid',      q: 'What causes a shuffle in Spark and why is it expensive?', answer: 'Wide transformations cause shuffles: groupBy, join (sort-merge), repartition, distinct, orderBy. Expensive because: data is serialised, written to disk, sent over the network, and read/deserialised on the other side. Each shuffle = disk write + network transfer + disk read. Minimise shuffles: broadcast joins for small tables, use partitioning hints, cache before multiple shuffles, enable AQE (spark.sql.adaptive.enabled=true).' },
  { id: 18, cat: 'Spark', company: 'Meta',    level: 'Senior',   q: 'How do you diagnose and fix data skew in a PySpark job?', answer: 'Diagnose: check Spark UI for tasks with >> median duration in a stage (stragglers). Print key distribution: df.groupBy("key").count().orderBy(desc("count")).show(20). Fixes: (1) Salting: add random suffix to hot key, duplicate join table with all salt values. (2) AQE skew join: spark.sql.adaptive.skewJoin.enabled=true. (3) Broadcast join if the other table is small. (4) repartition("less_skewed_key") before aggregation. Root cause: natural hot keys (e.g., "guest", country="US").' },
  { id: 19, cat: 'Spark', company: 'Any',     level: 'Mid',      q: 'What is the Catalyst optimizer and what does it do?', answer: 'Catalyst is Spark\'s query optimisation framework. Logical plan → Analysis → Logical optimisation (predicate pushdown, constant folding, projection pruning) → Physical planning (choose sort-merge vs broadcast join) → Code generation (Tungsten: JVM bytecode generation). Key optimisations: pushdown filters before shuffle, eliminate unused columns early, rewrite subqueries. You can inspect: df.explain(True) shows all four plan stages. AQE extends this with runtime statistics.' },
  { id: 20, cat: 'Spark', company: 'Uber',    level: 'Senior',   q: 'When would you use a broadcast join vs sort-merge join?', answer: 'Broadcast join: one table fits in executor memory (< autoBroadcastJoinThreshold, default 10MB). No shuffle — broadcaster sends full table to every executor. Set: spark.sql.autoBroadcastJoinThreshold = 500MB for medium tables. Sort-merge join: both tables large → sort both by join key, merge. Full shuffle. Explicit: df1.join(broadcast(df2), "key"). Anti-patterns: broadcasting a table that grows over time (silent failures when it exceeds threshold, falls back to sort-merge).' },
  { id: 21, cat: 'Spark', company: 'Any',     level: 'Mid',      q: 'What is the difference between repartition and coalesce?', answer: 'repartition(n): full shuffle, creates exactly n partitions. Use when increasing partitions or when current partitioning is skewed. coalesce(n): no shuffle, combines existing partitions (can only decrease). Use for reducing partitions before write (avoid many small files). Rule of thumb: 128–256 MB per partition for most workloads. After a filter that removes 80% of data: coalesce to avoid writing 5× too many small files.' },
  { id: 22, cat: 'Spark', company: 'Meta',    level: 'Senior',   q: 'How do you optimise a Spark job that reads 10TB of Parquet and runs out of memory?', answer: 'Checklist: (1) Increase shuffle partitions: spark.sql.shuffle.partitions=2000. (2) Enable AQE: adaptive partition coalescing. (3) Push predicates to Parquet reader (partition pruning, column pruning). (4) Increase spark.executor.memory, or add executors. (5) Spill config: spark.sql.shuffle.spill=true with adequate disk. (6) Check for skew: straggler tasks = data skew. (7) Use Delta Lake / partitioned tables to avoid full scan. (8) Increase cores per executor to share JVM overhead.' },

  // ─── Coding / ML Implementation ─────────────────────────────────────────
  { id: 23, cat: 'Coding', company: 'Any',     level: 'Mid',      q: 'Implement gradient descent for linear regression from scratch (numpy).', answer: 'W = np.zeros(X.shape[1]); b = 0\nfor _ in range(epochs):\n    y_hat = X @ W + b\n    loss = np.mean((y_hat - y)**2)\n    dW = (2/n) * X.T @ (y_hat - y)\n    db = (2/n) * np.sum(y_hat - y)\n    W -= lr * dW; b -= lr * db\nKey: vectorise with numpy, don\'t loop over samples. For mini-batch: sample indices before each step.' },
  { id: 24, cat: 'Coding', company: 'Any',     level: 'Mid',      q: 'Write a function to compute top-k precision and recall for a recommendation model.', answer: 'def precision_at_k(actual, predicted, k):\n    pred_k = predicted[:k]\n    hits = len(set(actual) & set(pred_k))\n    return hits / k\n\ndef recall_at_k(actual, predicted, k):\n    pred_k = predicted[:k]\n    hits = len(set(actual) & set(pred_k))\n    return hits / len(actual) if actual else 0\n\nNote: Average across users. For NDCG also weight by position.' },
  { id: 25, cat: 'Coding', company: 'Any',     level: 'Mid',      q: 'How would you implement feature normalisation that avoids data leakage?', answer: 'Always use sklearn Pipeline:\npipe = Pipeline([\n    ("scaler", StandardScaler()),\n    ("clf", LogisticRegression())\n])\npipe.fit(X_train, y_train)  # scaler fitted only on train\npipe.predict(X_test)        # transform uses train statistics\n\nFor cross-validation: use cross_val_score(pipe, X, y) — Pipeline handles fit/transform correctly within each fold.' },

  // ─── Behavioural / Architecture ──────────────────────────────────────────
  { id: 26, cat: 'Architecture', company: 'Any',     level: 'Senior',   q: 'Walk me through how you would debug a model that worked in staging but degrades in production.', answer: '1. Check feature parity: are all features available in prod? Any serving-training skew? 2. Check data volume: are edge cases underrepresented in staging? 3. Check label definition: same labelling logic in both? 4. Feature drift: run PSI on all features. 5. Model confidence distribution: are score distributions matching? 6. Slice analysis: is degradation in a specific segment (device, geo, user cohort)? 7. Check for data pipeline issues: late data, null spikes, schema changes.' },
  { id: 27, cat: 'Architecture', company: 'Google',  level: 'Staff',    q: 'How do you design an ML system that needs to serve 1M QPS with < 50ms P99 latency?', answer: 'Pre-compute wherever possible: run inference batch offline, cache results. For real-time: model compression (quantisation, distillation), ONNX runtime, GPU batching. Tiered serving: fast retrieval (ANN) → lightweight ranking → complex re-ranking only for top-N. Feature serving: dedicated low-latency feature store (Redis clusters). Model caching: cache predictions for frequent input patterns. Autoscaling: K8s HPA on GPU utilisation. Latency budget: feature lookup 5ms + model inference 20ms + overhead 25ms.' },
  { id: 28, cat: 'Architecture', company: 'Spotify', level: 'Senior',   q: 'How do you handle the cold start problem for new users and new items?', answer: 'New users: (1) Ask onboarding questions (genre preferences, artists). (2) Use demographic features if available. (3) Popularity-based recommendations with diversity constraints. (4) UCB/Thompson sampling to explore quickly. New items: (1) Content-based features (audio embeddings, metadata). (2) Publisher/artist popularity as proxy. (3) Promote in exploration buckets. (4) Hybrid model: collaborative for warm items, content-based for cold. Track when items "warm up" and transition strategies.' },
]

const CATEGORIES = ['All', 'System Design', 'Features', 'Evaluation', 'Spark', 'Coding', 'Architecture']
const COMPANIES   = ['All', 'Meta', 'Spotify', 'Google', 'Airbnb', 'Uber', 'Netflix', 'Any']
const LEVELS      = ['All', 'Mid', 'Senior', 'Staff']

export default function InterviewPrepTab() {
  const [cat,     setCat]     = useState('All')
  const [company, setCompany] = useState('All')
  const [level,   setLevel]   = useState('All')
  const [open,    setOpen]    = useState(null)
  const [search,  setSearch]  = useState('')

  const filtered = useMemo(() => QUESTIONS.filter(q => {
    if (cat !== 'All' && q.cat !== cat) return false
    if (company !== 'All' && q.company !== company) return false
    if (level !== 'All' && q.level !== level) return false
    if (search && !q.q.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [cat, company, level, search])

  const CAT_COLORS = {
    'System Design': { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.2)' },
    'Features':      { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee', border: 'rgba(34,211,238,0.2)' },
    'Evaluation':    { bg: 'rgba(16,185,129,0.1)', text: '#10b981', border: 'rgba(16,185,129,0.2)' },
    'Spark':         { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
    'Coding':        { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', border: 'rgba(168,85,247,0.2)' },
    'Architecture':  { bg: 'rgba(244,63,94,0.1)', text: '#f43f5e', border: 'rgba(244,63,94,0.2)' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>🎯</span>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: '#eaecff', letterSpacing: '-0.04em' }}>Interview Prep</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#525a82', lineHeight: 1.6, maxWidth: '580px' }}>
          {QUESTIONS.length} MLE interview questions from Spotify, Meta, Google, Airbnb, Uber, Netflix.
          System design, feature engineering, Spark, evaluation, coding. Each with a framework or model answer.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search questions..."
          style={{ background: '#0b0d1a', border: '1px solid #1c2040', borderRadius: '8px', padding: '10px 16px', color: '#eaecff', fontSize: '14px', fontFamily: "'Inter',sans-serif", outline: 'none', width: '100%', maxWidth: '400px' }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} className={`sub-tab ${cat === c ? 'active' : 'inactive'}`} style={{ fontSize: '12px' }}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {COMPANIES.map(c => (
            <button key={c} onClick={() => setCompany(c)} className={`sub-tab ${company === c ? 'active' : 'inactive'}`} style={{ fontSize: '12px' }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#525a82' }}>{filtered.length} question{filtered.length !== 1 ? 's' : ''}</div>

      {/* Question list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(q => {
          const cc = CAT_COLORS[q.cat] || CAT_COLORS['Architecture']
          const isOpen = open === q.id
          return (
            <div key={q.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', border: isOpen ? `1px solid ${cc.border}` : '1px solid #1c2040' }}
              onClick={() => setOpen(isOpen ? null : q.id)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 18px' }}>
                <span style={{ fontSize: '11px', color: '#2d3260', fontFamily: "'JetBrains Mono',monospace", paddingTop: '2px', minWidth: '24px' }}>
                  {String(q.id).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: cc.bg, color: cc.text, border: `1px solid ${cc.border}`, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '0.02em' }}>{q.cat}</span>
                    {q.company !== 'Any' && <span className="badge badge-ghost" style={{ fontSize: '10px' }}>{q.company}</span>}
                    <span className={`badge ${q.level === 'Staff' ? 'badge-rose' : q.level === 'Senior' ? 'badge-amber' : 'badge-ghost'}`} style={{ fontSize: '10px' }}>{q.level}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#8891b8', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{q.q}</p>
                </div>
                <span style={{ color: '#525a82', fontSize: '14px', paddingTop: '2px', transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
              </div>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${cc.border}`, padding: '16px 18px 18px 56px', background: `${cc.bg}`, animation: 'slideUp 0.2s ease-out' }}>
                  {q.framework && (
                    <div>
                      <div style={{ fontSize: '11px', color: cc.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Framework</div>
                      <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {q.framework.map((f, i) => (
                          <li key={i} style={{ fontSize: '13px', color: '#8891b8', lineHeight: 1.6 }}>{f}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {q.answer && (
                    <div>
                      <div style={{ fontSize: '11px', color: cc.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Model Answer</div>
                      <p style={{ fontSize: '13px', color: '#8891b8', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{q.answer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
