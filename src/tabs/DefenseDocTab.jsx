import { useState, useEffect } from 'react';

const KEYWORD_MAP = [
  { keywords: ['feature store', 'feast', 'tecton'], topic: 'Feature Stores', tab: 'features', tier: 'must', weight: 3 },
  { keywords: ['recommendation', 'ranking', 'retrieval', 'two-tower', 'embedding'], topic: 'Recommendation Systems', tab: 'design', tier: 'must', weight: 3 },
  { keywords: ['mlops', 'ml platform', 'model deployment', 'serving', 'inference'], topic: 'MLOps & Deployment', tab: 'mlops_deploy', tier: 'must', weight: 3 },
  { keywords: ['spark', 'pyspark', 'distributed training', 'dataproc'], topic: 'Distributed Computing (Spark)', tab: 'spark', tier: 'must', weight: 3 },
  { keywords: ['experiment', 'a/b test', 'causal', 'uplift'], topic: 'Experimentation & Causal Inference', tab: 'causal', tier: 'must', weight: 3 },
  { keywords: ['monitoring', 'drift', 'data quality', 'observability'], topic: 'Model Monitoring', tab: 'monitor', tier: 'must', weight: 3 },
  { keywords: ['deep learning', 'neural network', 'pytorch', 'tensorflow', 'transformer'], topic: 'Deep Learning', tab: 'dl', tier: 'must', weight: 3 },
  { keywords: ['system design', 'architecture', 'scalable'], topic: 'ML System Design', tab: 'design', tier: 'must', weight: 3 },
  { keywords: ['gradient boosting', 'xgboost', 'lightgbm', 'gbm', 'trees'], topic: 'Classical ML & Tree Models', tab: 'classical', tier: 'important', weight: 2 },
  { keywords: ['evaluation', 'metrics', 'auc', 'ndcg', 'precision', 'recall'], topic: 'Model Evaluation', tab: 'eval', tier: 'important', weight: 2 },
  { keywords: ['pipeline', 'airflow', 'orchestration', 'dag', 'workflow'], topic: 'Pipelines & Orchestration', tab: 'airflow', tier: 'important', weight: 2 },
  { keywords: ['sql', 'query', 'warehouse', 'bigquery', 'snowflake', 'redshift'], topic: 'SQL & Data Modeling', tab: 'modeling', tier: 'important', weight: 2 },
  { keywords: ['fine-tuning', 'llm', 'language model', 'bert', 'gpt', 'rlhf'], topic: 'LLM Fine-Tuning', tab: 'dl_finetune', tier: 'important', weight: 2 },
  { keywords: ['data modeling', 'dbt', 'dimensional', 'star schema'], topic: 'Data Modeling & dbt', tab: 'dbt', tier: 'important', weight: 2 },
  { keywords: ['time series', 'forecasting', 'anomaly detection', 'arima'], topic: 'Time Series', tab: 'ts', tier: 'important', weight: 2 },
  { keywords: ['feature engineering', 'feature selection', 'imputation'], topic: 'Feature Engineering', tab: 'features', tier: 'important', weight: 2 },
  { keywords: ['statistics', 'hypothesis', 'bayesian', 'probability'], topic: 'Statistics & DS', tab: 'ds', tier: 'important', weight: 2 },
  { keywords: ['model math', 'optimization', 'gradient descent', 'backprop'], topic: 'Models & Math', tab: 'models', tier: 'good', weight: 1 },
  { keywords: ['triton', 'torchserve', 'bentoml', 'inference optimization'], topic: 'DL Serving', tab: 'dl_serving', tier: 'good', weight: 1 },
  { keywords: ['sklearn', 'logistic regression', 'svm'], topic: 'Classical ML', tab: 'classical', tier: 'good', weight: 1 },
  { keywords: ['causal inference', 'did', 'iv', 'regression discontinuity'], topic: 'Causal Inference', tab: 'causal', tier: 'good', weight: 1 },
  { keywords: ['knowledge graph', 'graph ml', 'gnn'], topic: 'ML System Design', tab: 'design', tier: 'good', weight: 1 },
];

const CHECKLISTS = {
  'Feature Stores': [
    'Understand online vs. offline store architecture',
    'Know point-in-time correct joins',
    'Explain training-serving skew',
    'Compare Feast vs. Tecton',
  ],
  'Recommendation Systems': [
    'Two-tower retrieval architecture',
    'Cold-start strategies',
    'ANN serving (FAISS/HNSW)',
    'Re-ranking stage design',
    'Evaluation: offline recall@K vs. online CTR',
  ],
  'MLOps & Deployment': [
    'CI/CD for ML models',
    'Canary vs. shadow deployment',
    'Model versioning and registry',
    'Rollback triggers',
    'A/B test integration',
  ],
  'Distributed Computing (Spark)': [
    'Spark RDD vs. DataFrame API',
    'Shuffle optimization and broadcast joins',
    'Structured Streaming checkpointing',
    'Partitioning strategies',
  ],
  'Experimentation & Causal Inference': [
    'A/B test design: power analysis, MDE',
    'CUPED variance reduction',
    'Network effects and SUTVA',
    'Sequential testing (mSPRT)',
  ],
  'Model Monitoring': [
    'Feature drift: PSI and KL divergence',
    'Prediction distribution monitoring',
    'Label feedback loops',
    'Alerting and escalation paths',
  ],
  'Deep Learning': [
    'Transformer attention mechanism',
    'Training stability: gradient clipping, warmup',
    'Regularization: dropout, weight decay',
    'Mixed precision training',
  ],
  'ML System Design': [
    'Feature store + model serving architecture',
    'Latency budget allocation',
    'Training pipeline design',
    'Online learning vs. batch',
  ],
  'Classical ML & Tree Models': [
    'Bias-variance tradeoff',
    'Tree ensemble methods',
    'Regularization (L1/L2)',
    'Feature selection techniques',
  ],
  'Classical ML': [
    'Bias-variance tradeoff',
    'Tree ensemble methods',
    'Regularization (L1/L2)',
    'Feature selection techniques',
  ],
  'Model Evaluation': [
    'Calibration vs. discrimination',
    'NDCG@K for ranking',
    'Precision-recall at threshold',
    'Offline vs. online metrics',
  ],
  'SQL & Data Modeling': [
    'Window functions',
    'CTEs and query optimization',
    'Partitioning strategies',
    'SCD Type 2',
  ],
};

const DEFAULT_CHECKLIST = ['Review core concepts', 'Practice interview questions', 'Study production examples'];

const TIER_CONFIG = {
  must: { label: 'Must Know', color: 'var(--rose)', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.3)' },
  important: { label: 'Important', color: 'var(--prime)', bg: 'rgba(240,165,0,0.15)', border: 'rgba(240,165,0,0.3)' },
  good: { label: 'Good to Have', color: 'var(--mint)', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)' },
};

function analyzeJD(jdText) {
  const lower = jdText.toLowerCase();
  const topicsMap = new Map();

  for (const entry of KEYWORD_MAP) {
    const matched = entry.keywords.filter(kw => lower.includes(kw));
    if (matched.length > 0) {
      const key = `${entry.topic}-${entry.tier}`;
      if (topicsMap.has(key)) {
        const existing = topicsMap.get(key);
        matched.forEach(kw => {
          if (!existing.matched.includes(kw)) existing.matched.push(kw);
        });
      } else {
        topicsMap.set(key, { ...entry, matched: [...matched] });
      }
    }
  }

  return Array.from(topicsMap.values()).sort((a, b) => b.weight - a.weight);
}

function buildTopicsWithChecklists(topics) {
  return topics.map((t, i) => ({
    id: `${t.topic}-${i}`,
    name: t.topic,
    tier: t.tier,
    keywords: t.matched,
    checklist: (CHECKLISTS[t.topic] || DEFAULT_CHECKLIST).map(text => ({ text, done: false })),
  }));
}

export default function DefenseDocTab({ onNavigate }) {
  const [screen, setScreen] = useState('input');
  const [jdText, setJdText] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [topics, setTopics] = useState([]);
  const [guidedIdx, setGuidedIdx] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('msl_defense_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.jd) setJdText(parsed.jd);
        if (parsed.topics && parsed.topics.length > 0) {
          setTopics(parsed.topics);
          setScreen('brief');
        }
      }
    } catch {}
  }, []);

  function saveProgress(updatedTopics, jd) {
    try {
      localStorage.setItem('msl_defense_progress', JSON.stringify({ jd: jd ?? jdText, topics: updatedTopics }));
    } catch {}
  }

  function handleGenerate() {
    if (!jdText.trim()) return;
    const analyzed = analyzeJD(jdText);
    const built = buildTopicsWithChecklists(analyzed);
    setTopics(built);
    setScreen('brief');
    saveProgress(built, jdText);
  }

  function handleReset() {
    setScreen('input');
    setTopics([]);
    setJdText('');
    setCandidateName('');
    try { localStorage.removeItem('msl_defense_progress'); } catch {}
  }

  function handleChecklistToggle(topicId, itemIdx) {
    const updated = topics.map(t => {
      if (t.id !== topicId) return t;
      return {
        ...t,
        checklist: t.checklist.map((item, i) => i === itemIdx ? { ...item, done: !item.done } : item),
      };
    });
    setTopics(updated);
    saveProgress(updated);
  }

  function handlePrint() {
    window.print();
  }

  const mustTopics = topics.filter(t => t.tier === 'must');
  const importantTopics = topics.filter(t => t.tier === 'important');
  const goodTopics = topics.filter(t => t.tier === 'good');
  const totalItems = topics.reduce((s, t) => s + t.checklist.length, 0);
  const doneItems = topics.reduce((s, t) => s + t.checklist.filter(c => c.done).length, 0);

  // Input screen
  if (screen === 'input') {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 8px' }}>
            Defense Brief
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-mid)', margin: 0 }}>
            Generate a weighted study brief from a job description — exportable as PDF or workable in guided mode.
          </p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink-mid)', display: 'block', marginBottom: 6 }}>
            Your name (optional — for PDF header)
          </label>
          <input
            value={candidateName}
            onChange={e => setCandidateName(e.target.value)}
            placeholder="e.g. Alex Chen"
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: '1px solid var(--rim)',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink-hi)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink-mid)', display: 'block', marginBottom: 6 }}>
            Job Description
          </label>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here..."
            style={{
              width: '100%',
              minHeight: 300,
              background: 'var(--surface)',
              border: '1px solid var(--rim)',
              borderRadius: 10,
              padding: 16,
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink-hi)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleGenerate}
            disabled={!jdText.trim()}
            style={{
              background: jdText.trim() ? 'var(--prime)' : 'var(--rim)',
              color: jdText.trim() ? 'var(--void)' : 'var(--ink-low)',
              border: 'none',
              borderRadius: 8,
              padding: '12px 28px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 15,
              cursor: jdText.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Generate Brief →
          </button>
        </div>
      </div>
    );
  }

  // Guided mode screen
  if (screen === 'guided') {
    const topic = topics[guidedIdx];
    const topicDone = topic.checklist.filter(c => c.done).length;
    const topicTotal = topic.checklist.length;
    const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    const config = TIER_CONFIG[topic.tier];

    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <button
            onClick={() => setScreen('brief')}
            style={{ background: 'var(--surface)', color: 'var(--ink-mid)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}
          >
            ← Back to Brief
          </button>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-mid)' }}>
            Topic {guidedIdx + 1} of {topics.length} · {overallPct}% checklist complete
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--rim)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${overallPct}%`, background: 'var(--mint)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>

        <div style={{ background: 'var(--surface)', border: `1px solid ${config.border}`, borderRadius: 12, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, color: 'var(--ink-hi)', margin: 0, flex: 1 }}>
              {topic.name}
            </h2>
            <span style={{
              background: config.bg,
              color: config.color,
              border: `1px solid ${config.border}`,
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {config.label}
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-low)', marginBottom: 20 }}>
            keywords: {topic.keywords.join(', ')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {topic.checklist.map((item, i) => (
              <label
                key={i}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '10px 14px', background: item.done ? 'rgba(52,211,153,0.15)' : 'var(--depth)', borderRadius: 8, border: `1px solid ${item.done ? 'rgba(52,211,153,0.3)' : 'var(--rim)'}`, transition: 'all 0.15s' }}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => handleChecklistToggle(topic.id, i)}
                  style={{ marginTop: 1, accentColor: 'var(--mint)', width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: item.done ? 'var(--ink-mid)' : 'var(--ink-hi)', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', marginBottom: 20, textAlign: 'right' }}>
            {topicDone}/{topicTotal} items checked
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setGuidedIdx(i => Math.max(0, i - 1))}
              disabled={guidedIdx === 0}
              style={{ background: 'var(--rim)', color: guidedIdx === 0 ? 'var(--ink-ghost)' : 'var(--ink-hi)', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, cursor: guidedIdx === 0 ? 'not-allowed' : 'pointer' }}
            >
              ← Prev Topic
            </button>
            <button
              onClick={() => setGuidedIdx(i => Math.min(topics.length - 1, i + 1))}
              disabled={guidedIdx === topics.length - 1}
              style={{ background: guidedIdx === topics.length - 1 ? 'var(--rim)' : 'var(--prime)', color: guidedIdx === topics.length - 1 ? 'var(--ink-ghost)' : 'var(--void)', border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, cursor: guidedIdx === topics.length - 1 ? 'not-allowed' : 'pointer' }}
            >
              Next Topic →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Brief screen
  const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      {/* Print styles injected */}
      <style>{`
        @media print {
          @page { margin: 1.2cm; size: A4; }
          * { visibility: hidden !important; }
          .defense-doc-print,
          .defense-doc-print * { visibility: visible !important; }
          .defense-doc-print {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            background: #fff !important;
            color: #000 !important;
            font-size: 12pt !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .defense-doc-print * {
            color: #000 !important;
            background: transparent !important;
            border-color: #ccc !important;
            box-shadow: none !important;
          }
          .defense-doc-print a::after { content: none !important; }
        }
        @media screen {
          .defense-doc-print { display: block; }
        }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 24, fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 4px' }}>
            Defense Brief
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-mid)', margin: 0 }}>
            {topics.length} topics · {doneItems}/{totalItems} checklist items done
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleReset} style={{ background: 'var(--surface)', color: 'var(--ink-mid)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}>
            ← New JD
          </button>
          <button onClick={handlePrint} style={{ background: 'var(--surface)', color: 'var(--sky)', border: '1px solid rgba(34,211,238,0.4)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Download PDF
          </button>
          <button onClick={() => { setGuidedIdx(0); setScreen('guided'); }} style={{ background: 'var(--prime)', color: 'var(--void)', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Start Guided Mode →
          </button>
        </div>
      </div>

      {/* Printable document */}
      <div className="defense-doc-print" style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: 32 }}>
        {/* Header */}
        <div style={{ borderBottom: '2px solid var(--prime)', paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Interview Defense Brief
          </div>
          {candidateName && (
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, color: 'var(--ink-hi)', marginBottom: 4 }}>
              {candidateName}
            </div>
          )}
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-low)' }}>
            Generated {printDate} · {topics.length} topics · weighted by signal strength
          </div>
        </div>

        {/* Topic groups */}
        {[
          { tier: 'must', label: 'Must Know', list: mustTopics },
          { tier: 'important', label: 'Important', list: importantTopics },
          { tier: 'good', label: 'Good to Have', list: goodTopics },
        ].map(({ tier, label, list }) => {
          if (list.length === 0) return null;
          const config = TIER_CONFIG[tier];
          return (
            <div key={tier} style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: config.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                {label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {list.map(topic => (
                  <div key={topic.id} style={{ background: config.bg, border: `1px solid ${config.border}`, borderRadius: 10, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--ink-hi)' }}>
                        {topic.name}
                      </span>
                      <span style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}`, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-low)', marginBottom: 12 }}>
                      {topic.keywords.join(', ')}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {topic.checklist.map((item, i) => (
                        <li key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: item.done ? 'var(--ink-low)' : 'var(--ink-hi)', textDecoration: item.done ? 'line-through' : 'none' }}>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
