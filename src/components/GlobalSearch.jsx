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
]

const KIND_COLORS = {
  module: { bg: 'rgba(52,211,153,0.10)', color: 'var(--mint)', border: 'rgba(52,211,153,0.25)' },
  post:   { bg: 'rgba(56,189,248,0.10)', color: 'var(--sky)',  border: 'rgba(56,189,248,0.25)' },
}

const TAB_LABELS = {
  spark: 'Spark Lab', features: 'Features', eval: 'Eval', models: 'Models & Math',
  design: 'System Design', monitor: 'Monitoring', interview: 'Interview', gradient: 'Gradient',
  landscape: 'ML Landscape',
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
