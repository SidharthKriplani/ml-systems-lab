import { useState, useMemo } from 'react'

// ── Model Selection Oracle ────────────────────────────────────────────────────
const MODELS = [
  {
    id: 'logreg',
    name: 'Logistic Regression',
    when: { taskType: ['binary', 'multiclass'], dataSize: ['small', 'medium'], interpretability: ['high'], featureType: ['tabular'] },
    score: { small: 3, medium: 2, large: 0 },
    strengths: ['Fully interpretable — coefficients are odds ratios', 'Calibrated probabilities out of the box', 'Fast to train, no hyperparameter tuning needed', 'Works well as a baseline and in ensembles'],
    risks: ['Assumes linear decision boundary — will miss interactions', 'Sensitive to feature scale (always normalise)', 'Breaks under multicollinearity'],
    prodNote: 'Default first model for any tabular binary classification. If a logistic regression can\'t beat random, your features are the problem, not the model.',
    color: 'var(--sky)',
  },
  {
    id: 'rf',
    name: 'Random Forest',
    when: { taskType: ['binary', 'multiclass', 'regression'], dataSize: ['small', 'medium', 'large'], interpretability: ['medium', 'high'], featureType: ['tabular'] },
    score: { small: 3, medium: 3, large: 2 },
    strengths: ['Handles mixed feature types natively', 'Robust to outliers and missing data', 'Feature importances for interpretability', 'No feature scaling required'],
    risks: ['Memory-hungry for large n_estimators', 'Slow prediction with many trees', 'Poor extrapolation beyond training range (regression)'],
    prodNote: 'Strong default for tabular data, especially with mixed types or messy data. Slower than GBMs to train at scale but simpler to tune.',
    color: 'var(--mint)',
  },
  {
    id: 'xgboost',
    name: 'XGBoost / LightGBM',
    when: { taskType: ['binary', 'multiclass', 'regression'], dataSize: ['medium', 'large'], interpretability: ['medium'], featureType: ['tabular'] },
    score: { small: 1, medium: 3, large: 3 },
    strengths: ['State-of-the-art on structured/tabular data', 'Built-in regularisation (L1/L2)', 'SHAP values for production explainability', 'Handles missing values natively'],
    risks: ['Over 20 hyperparameters — easy to over-tune on val set', 'Can overfit small datasets aggressively', 'Harder to explain individual predictions without SHAP'],
    prodNote: 'The default go-to for competitive tabular ML. LightGBM is ~3x faster than XGBoost for large datasets. Always use early stopping to prevent overfitting.',
    color: 'var(--prime)',
  },
  {
    id: 'svm',
    name: 'SVM',
    when: { taskType: ['binary', 'multiclass'], dataSize: ['small', 'medium'], interpretability: ['low', 'medium'], featureType: ['tabular'] },
    score: { small: 3, medium: 2, large: 0 },
    strengths: ['Effective in high-dimensional spaces (text, genomics)', 'Works well when n < p', 'Only support vectors matter — memory efficient post-training'],
    risks: ['O(n²) to O(n³) training time — unusable above ~50k samples', 'Sensitive to feature scale', 'Probability calibration requires additional Platt scaling'],
    prodNote: 'Niche use case in 2025: text classification with small data, or any problem where kernel tricks matter. Otherwise, gradient boosting dominates.',
    color: 'var(--ember)',
  },
  {
    id: 'knn',
    name: 'k-NN',
    when: { taskType: ['binary', 'multiclass', 'regression'], dataSize: ['small'], interpretability: ['high'], featureType: ['tabular'] },
    score: { small: 2, medium: 1, large: 0 },
    strengths: ['Zero training time', 'Naturally handles multi-class', 'Interpretable — "similar to these training examples"'],
    risks: ['O(n) prediction time — scales catastrophically', 'Curse of dimensionality above ~20 features', 'Requires careful distance metric choice'],
    prodNote: 'Useful as an exploratory baseline or for recommendation cold-start. Never deploy raw k-NN at scale — use ANN (Faiss, ScaNN) if you need nearest-neighbour lookup in production.',
    color: 'var(--rose)',
  },
  {
    id: 'linear_reg',
    name: 'Linear / Ridge / Lasso Regression',
    when: { taskType: ['regression'], dataSize: ['small', 'medium'], interpretability: ['high'], featureType: ['tabular'] },
    score: { small: 3, medium: 2, large: 1 },
    strengths: ['Interpretable coefficients', 'Ridge handles multicollinearity', 'Lasso does feature selection implicitly', 'Fast and no hyperparameter tuning (Ridge λ aside)'],
    risks: ['Linear assumption — misses non-linear relationships', 'Sensitive to outliers (use Huber loss if needed)', 'Extrapolation outside training range is risky'],
    prodNote: 'Start here for any regression task. If residuals are non-random, you need a more complex model. Lasso is your friend when you have 100+ features.',
    color: 'var(--violet)',
  },
  {
    id: 'tabnet',
    name: 'Neural Net (MLP / TabNet)',
    when: { taskType: ['binary', 'multiclass', 'regression'], dataSize: ['large'], interpretability: ['low'], featureType: ['tabular'] },
    score: { small: 0, medium: 1, large: 2 },
    strengths: ['Can learn complex interactions without feature engineering', 'Scales with data', 'TabNet: attention-based, interpretable for neural net'],
    risks: ['Rarely beats GBMs on structured data with same n', 'Requires more hyperparameter tuning', 'Longer training time, needs GPU for large datasets'],
    prodNote: 'Neural nets on tabular data are almost never the right call unless: (1) you have millions of rows, (2) you\'re already in a DL serving stack and want to unify, or (3) you need joint embeddings with text/images.',
    color: 'var(--gold)',
  },
]

const TASK_TYPES  = [{ v: 'binary', l: 'Binary classification' }, { v: 'multiclass', l: 'Multiclass' }, { v: 'regression', l: 'Regression' }]
const DATA_SIZES  = [{ v: 'small', l: 'Small (<10k rows)' }, { v: 'medium', l: 'Medium (10k–1M)' }, { v: 'large', l: 'Large (>1M)' }]
const INTERP      = [{ v: 'high', l: 'High — explain to stakeholders' }, { v: 'medium', l: 'Medium — SHAP is acceptable' }, { v: 'low', l: 'Low — accuracy only' }]
const FEAT_TYPES  = [{ v: 'tabular', l: 'Tabular / structured' }, { v: 'text', l: 'Text / NLP' }, { v: 'image', l: 'Images' }]

function pill(label, active, onClick, activeColor = 'var(--sky)') {
  return (
    <button key={label} onClick={onClick}
      style={{ padding: '6px 13px', borderRadius: '7px', border: `1px solid ${active ? activeColor : 'var(--rim)'}`, background: active ? activeColor + '18' : 'transparent', color: active ? activeColor : 'var(--ink-low)', fontSize: '12px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.14s', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}

function ModelSelectionOracle() {
  const [taskType, setTaskType] = useState('binary')
  const [dataSize, setDataSize] = useState('medium')
  const [interp,   setInterp]   = useState('medium')
  const [featType, setFeatType] = useState('tabular')
  const [expanded, setExpanded] = useState(null)

  const ranked = useMemo(() => {
    if (featType !== 'tabular') return []
    return MODELS
      .filter(m => m.when.taskType.includes(taskType) && m.when.featureType.includes(featType))
      .filter(m => {
        if (interp === 'high') return m.when.interpretability.includes('high') || m.when.interpretability.includes('medium')
        if (interp === 'medium') return true
        return true
      })
      .map(m => ({ ...m, rank: m.score[dataSize] }))
      .sort((a, b) => b.rank - a.rank)
  }, [taskType, dataSize, interp, featType])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Model Selection Oracle</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Set your problem constraints. Get ranked model recommendations with production tradeoffs.
        </p>
      </div>

      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Task type', items: TASK_TYPES, val: taskType, set: setTaskType, color: 'var(--sky)' },
          { label: 'Data size', items: DATA_SIZES, val: dataSize, set: setDataSize, color: 'var(--ember)' },
          { label: 'Interpretability requirement', items: INTERP, val: interp, set: setInterp, color: 'var(--violet)' },
          { label: 'Feature type', items: FEAT_TYPES, val: featType, set: setFeatType, color: 'var(--mint)' },
        ].map(g => (
          <div key={g.label} className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{g.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {g.items.map(item => pill(item.l, g.val === item.v, () => g.set(item.v), g.color))}
            </div>
          </div>
        ))}
      </div>

      {/* Non-tabular notice */}
      {featType !== 'tabular' && (
        <div className="card" style={{ padding: '20px', border: '1px solid var(--rim)', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>{featType === 'text' ? '📝' : '🖼'}</div>
          <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
            {featType === 'text'
              ? 'Text data: go to the Deep Learning domain. Transformer-based models (BERT, RoBERTa, DistilBERT) are the correct starting point. Classical ML on TF-IDF features is a valid baseline for small datasets.'
              : 'Image data: go to the Deep Learning domain. Pretrained CNNs (ResNet, EfficientNet) or ViTs are the correct approach. Classical ML is not competitive on raw pixels.'}
          </p>
        </div>
      )}

      {/* Ranked results */}
      {featType === 'tabular' && ranked.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="eyebrow">Ranked recommendations</div>
          {ranked.map((m, i) => (
            <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden', border: i === 0 ? `1px solid ${m.color}50` : undefined }}>
              <button onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: i === 0 ? m.color : 'var(--ink-low)', fontWeight: 700, minWidth: '24px' }}>#{i + 1}</span>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px', fontWeight: 600, color: i === 0 ? m.color : 'var(--ink-hi)', flex: 1 }}>{m.name}</span>
                {i === 0 && <span style={{ fontSize: '10px', padding: '2px 7px', background: m.color + '18', color: m.color, borderRadius: '4px', fontFamily: "'JetBrains Mono',monospace" }}>RECOMMENDED</span>}
                <span style={{ fontSize: '12px', color: 'var(--ink-low)', transition: 'transform 0.15s', transform: expanded === m.id ? 'rotate(90deg)' : 'none' }}>›</span>
              </button>

              {expanded === m.id && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--rim)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '14px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--mint)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Strengths</div>
                      {m.strengths.map((s, j) => <div key={j} style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, marginBottom: '3px' }}>✓ {s}</div>)}
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--rose)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Watch out for</div>
                      {m.risks.map((r, j) => <div key={j} style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, marginBottom: '3px' }}>⚠ {r}</div>)}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.05)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Production note</div>
                    <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{m.prodNote}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Roadmap ───────────────────────────────────────────────────────────────────
const ROADMAP = [
  { icon: '🎯', label: 'Model Selection Oracle',         desc: 'Given constraints, get ranked model recommendations with production tradeoffs.',              status: 'live' },
  { icon: '📊', label: 'Statistical Testing Pitfalls',   desc: 'p-hacking, multiple comparisons, base rate neglect — the tests your team is running wrong.',  status: 'soon' },
  { icon: '🌿', label: 'Feature Importance vs Causation', desc: 'When SHAP values lie. Spurious correlations in production. Causal inference basics.',         status: 'soon' },
  { icon: '🎛', label: 'Calibration in Practice',        desc: 'When Platt scaling helps, when it doesn\'t, and why your model\'s 80% confidence means 60%.',  status: 'soon' },
  { icon: '🧪', label: 'Experiment Design Framework',    desc: 'Sample size, power, variance reduction (CUPED), avoiding SRM — without a calculator.',        status: 'soon' },
  { icon: '💀', label: 'Classical ML Failure Modes',     desc: '15 ways gradient boosting, random forests, and SVMs silently fail in production.',            status: 'soon' },
]

// ── Modules ───────────────────────────────────────────────────────────────────
const DS_MODULES = [
  { id: 'oracle', label: 'Model Selection Oracle', icon: '🎯', component: ModelSelectionOracle },
]

export default function DataScienceTab() {
  const [active, setActive] = useState('oracle')
  const ActiveModule = DS_MODULES.find(m => m.id === active)?.component ?? ModelSelectionOracle

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>Data Science</h1>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'rgba(34,211,238,0.12)', color: 'var(--sky)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>New domain</span>
        </div>
        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '600px' }}>
          Statistics courses teach you the math. This domain teaches you the judgment — when each model is the wrong choice, which tests are being misused, and why your calibration is broken.
        </p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {DS_MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${active === m.id ? 'var(--sky)' : 'var(--rim)'}`, background: active === m.id ? 'rgba(34,211,238,0.10)' : 'transparent', color: active === m.id ? 'var(--sky)' : 'var(--ink-low)', fontSize: '13px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Active module */}
      <ActiveModule />

      {/* Roadmap */}
      <div>
        <div className="eyebrow" style={{ marginBottom: '16px' }}>What's being built</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {ROADMAP.map(m => (
            <div key={m.label} className="card" style={{ padding: '16px', opacity: m.status === 'live' ? 1 : 0.6, borderLeft: m.status === 'live' ? '2px solid var(--sky)' : '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px' }}>{m.icon}</span>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', fontWeight: 600, color: m.status === 'live' ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{m.label}</span>
                {m.status === 'live' && <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'rgba(52,211,153,0.12)', color: 'var(--mint)', borderRadius: '3px', fontFamily: "'JetBrains Mono',monospace" }}>LIVE</span>}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
