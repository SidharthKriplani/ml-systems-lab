import { useState, useEffect } from 'react';

const KEYWORD_MAP = [
  // MUST KNOW
  { keywords: ['feature store', 'feast', 'tecton'], topic: 'Feature Stores', tab: 'features', tier: 'must' },
  { keywords: ['recommendation', 'ranking', 'retrieval', 'two-tower', 'embedding'], topic: 'Recommendation Systems', tab: 'design', tier: 'must' },
  { keywords: ['mlops', 'ml platform', 'model deployment', 'serving', 'inference'], topic: 'MLOps & Deployment', tab: 'mlops_deploy', tier: 'must' },
  { keywords: ['spark', 'pyspark', 'distributed training', 'dataproc'], topic: 'Distributed Computing (Spark)', tab: 'spark', tier: 'must' },
  { keywords: ['experiment', 'a/b test', 'causal', 'uplift'], topic: 'Experimentation & Causal Inference', tab: 'causal', tier: 'must' },
  { keywords: ['monitoring', 'drift', 'data quality', 'observability'], topic: 'Model Monitoring', tab: 'monitor', tier: 'must' },
  { keywords: ['deep learning', 'neural network', 'pytorch', 'tensorflow', 'transformer'], topic: 'Deep Learning', tab: 'dl', tier: 'must' },
  { keywords: ['system design', 'architecture', 'scalable'], topic: 'ML System Design', tab: 'design', tier: 'must' },
  // IMPORTANT
  { keywords: ['gradient boosting', 'xgboost', 'lightgbm', 'gbm', 'trees'], topic: 'Classical ML & Tree Models', tab: 'classical', tier: 'important' },
  { keywords: ['evaluation', 'metrics', 'auc', 'ndcg', 'precision', 'recall'], topic: 'Model Evaluation', tab: 'eval', tier: 'important' },
  { keywords: ['pipeline', 'airflow', 'orchestration', 'dag', 'workflow'], topic: 'Pipelines & Orchestration', tab: 'airflow', tier: 'important' },
  { keywords: ['sql', 'query', 'warehouse', 'bigquery', 'snowflake', 'redshift'], topic: 'SQL & Data Modeling', tab: 'modeling', tier: 'important' },
  { keywords: ['fine-tuning', 'llm', 'language model', 'bert', 'gpt', 'rlhf'], topic: 'LLM Fine-Tuning', tab: 'dl_finetune', tier: 'important' },
  { keywords: ['data modeling', 'dbt', 'dimensional', 'star schema'], topic: 'Data Modeling & dbt', tab: 'dbt', tier: 'important' },
  { keywords: ['time series', 'forecasting', 'anomaly detection', 'arima'], topic: 'Time Series', tab: 'ts', tier: 'important' },
  { keywords: ['feature engineering', 'feature selection', 'imputation'], topic: 'Feature Engineering', tab: 'features', tier: 'important' },
  { keywords: ['statistics', 'hypothesis', 'bayesian', 'probability'], topic: 'Statistics & DS', tab: 'ds', tier: 'important' },
  // GOOD TO HAVE
  { keywords: ['model math', 'optimization', 'gradient descent', 'backprop'], topic: 'Models & Math', tab: 'models', tier: 'good' },
  { keywords: ['triton', 'torchserve', 'bentoml', 'inference optimization'], topic: 'DL Serving', tab: 'dl_serving', tier: 'good' },
  { keywords: ['sklearn', 'logistic regression', 'svm'], topic: 'Classical ML', tab: 'classical', tier: 'good' },
  { keywords: ['causal inference', 'did', 'iv', 'regression discontinuity'], topic: 'Causal Inference', tab: 'causal', tier: 'good' },
  { keywords: ['knowledge graph', 'graph ml', 'gnn'], topic: 'ML System Design', tab: 'design', tier: 'good' },
];

const TIER_CONFIG = {
  must: { label: 'Must Know', emoji: '🔴', color: 'var(--rose)', bg: 'rgba(244,63,94,0.12)' },
  important: { label: 'Important', emoji: '🟡', color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)' },
  good: { label: 'Good to Have', emoji: '🟢', color: 'var(--mint)', bg: 'rgba(52,211,153,0.12)' },
};

function analyzeJD(jdText) {
  const lower = jdText.toLowerCase();
  const matchedTopics = [];
  const seenTopics = new Set();
  const allMatchedKeywords = new Set();

  for (const entry of KEYWORD_MAP) {
    const matched = entry.keywords.filter(kw => lower.includes(kw));
    if (matched.length > 0) {
      const key = `${entry.topic}-${entry.tier}`;
      if (!seenTopics.has(key)) {
        seenTopics.add(key);
        matchedTopics.push({ ...entry, matched });
        matched.forEach(kw => allMatchedKeywords.add(kw));
      } else {
        // merge matched keywords into existing
        const existing = matchedTopics.find(t => t.topic === entry.topic && t.tier === entry.tier);
        if (existing) {
          matched.forEach(kw => {
            if (!existing.matched.includes(kw)) existing.matched.push(kw);
            allMatchedKeywords.add(kw);
          });
        }
      }
    }
  }

  return { topics: matchedTopics, totalKeywords: allMatchedKeywords.size };
}

export default function JDPrepTab({ onNavigate }) {
  const [screen, setScreen] = useState('input');
  const [jdText, setJdText] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('msl_jdprep_last');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.jd) setJdText(parsed.jd);
        if (parsed.results) {
          setResults(parsed.results);
          setScreen('results');
        }
      }
    } catch {}
  }, []);

  function handleAnalyze() {
    if (!jdText.trim()) return;
    const { topics, totalKeywords } = analyzeJD(jdText);
    const data = { topics, totalKeywords };
    setResults(data);
    setScreen('results');
    try {
      localStorage.setItem('msl_jdprep_last', JSON.stringify({ jd: jdText, results: data }));
    } catch {}
  }

  function handleNewJD() {
    setScreen('input');
    setResults(null);
    setJdText('');
    try { localStorage.removeItem('msl_jdprep_last'); } catch {}
  }

  const mustTopics = results?.topics.filter(t => t.tier === 'must') ?? [];
  const importantTopics = results?.topics.filter(t => t.tier === 'important') ?? [];
  const goodTopics = results?.topics.filter(t => t.tier === 'good') ?? [];

  if (screen === 'input') {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 8px' }}>
            JD Analyzer
          </h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: 'var(--ink-mid)', margin: 0 }}>
            Paste a job description and get a ranked study plan tailored to what they're actually looking for.
          </p>
        </div>

        <textarea
          value={jdText}
          onChange={e => setJdText(e.target.value)}
          placeholder="Paste the full job description here..."
          style={{
            width: '100%',
            minHeight: 320,
            background: 'var(--surface)',
            border: '1px solid var(--rim)',
            borderRadius: 10,
            padding: 16,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
            color: 'var(--ink-hi)',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.6,
          }}
        />

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleAnalyze}
            disabled={!jdText.trim()}
            style={{
              background: jdText.trim() ? 'var(--prime)' : 'var(--rim)',
              color: jdText.trim() ? 'var(--void)' : 'var(--ink-low)',
              border: 'none',
              borderRadius: 8,
              padding: '12px 28px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: jdText.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            Analyze JD →
          </button>
        </div>
      </div>
    );
  }

  // Results screen
  const tierGroups = [
    { tier: 'must', topics: mustTopics },
    { tier: 'important', topics: importantTopics },
    { tier: 'good', topics: goodTopics },
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 4px' }}>
            Study Plan
          </h2>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: 'var(--ink-mid)', margin: 0 }}>
            {results.topics.length} topic{results.topics.length !== 1 ? 's' : ''} identified across {results.totalKeywords} unique keyword{results.totalKeywords !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleNewJD}
          style={{
            background: 'var(--surface)',
            color: 'var(--ink-mid)',
            border: '1px solid var(--rim)',
            borderRadius: 8,
            padding: '8px 16px',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ← New JD
        </button>
      </div>

      {results.topics.length === 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: 10,
          padding: 32,
          textAlign: 'center',
          color: 'var(--ink-mid)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          No known ML keywords detected. Try a more detailed job description.
        </div>
      )}

      {tierGroups.map(({ tier, topics }) => {
        if (topics.length === 0) return null;
        const config = TIER_CONFIG[tier];
        return (
          <div key={tier} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>{config.emoji}</span>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: config.color,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                {config.label}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topics.map((topic, idx) => (
                <div
                  key={`${topic.topic}-${idx}`}
                  style={{
                    background: config.bg,
                    border: `1px solid ${config.color}33`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--ink-hi)', marginBottom: 4 }}>
                      {topic.topic}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--ink-low)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      matched: {topic.matched.join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate && onNavigate(topic.tab)}
                    style={{
                      background: config.color,
                      color: 'var(--void)',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Go Study →
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
