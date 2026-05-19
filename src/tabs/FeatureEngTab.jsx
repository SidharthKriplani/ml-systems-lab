import { useState, useMemo } from 'react'

// ─── Training-Serving Skew Simulator ─────────────────────────────────────────
function SkewSimulator() {
  const [bug, setBug]         = useState(null)
  const [revealed, setRevealed] = useState(false)

  const BUGS = [
    {
      id: 'time_leak',
      label: 'Future data leak',
      training: 'feature = avg(purchase_amount OVER last_7_days)',
      serving:  'feature = avg(purchase_amount OVER last_7_days WHERE ts <= NOW())',
      desc: 'Training uses a window that accidentally includes future events (wrong boundary condition in the SQL). At serving time, future data doesn\'t exist, so the feature distribution shifts dramatically.',
      impact: 'High. Model trained on leaked features sees different distributions at serve time. AUC drops 8–15pp.',
      fix: 'Always use RANGE BETWEEN N PRECEDING AND CURRENT ROW with explicit ts < event_ts. Unit test feature values against known-good historical examples.',
    },
    {
      id: 'fillna',
      label: 'Different null handling',
      training: 'df["age"].fillna(df["age"].mean())',
      serving:  'if age is None: age = 0  # quick fix in serving code',
      desc: 'Training imputes missing age with mean (~34). Serving imputes with 0. A 0-age customer looks like a child to the model — completely different score.',
      impact: 'Medium-high. Affects all users with missing age. Score distribution shifts for ~12% of traffic.',
      fix: 'Store imputation values computed at training time (e.g., in a feature store or artefact). Serving must load and apply the same values.',
    },
    {
      id: 'scaler',
      label: 'Scaler fitted on wrong data',
      training: 'scaler.fit_transform(X_train)',
      serving:  'scaler.fit_transform([single_row])  # re-fitting every request!',
      desc: 'The StandardScaler is re-fitted on each serving request. A single row has mean = its own value, std = 0 (or 1 after jitter). Every feature becomes 0 or undefined.',
      impact: 'Critical. All scaled features are wrong for every request. Model is essentially random.',
      fix: 'Serialise and store the fitted scaler (joblib.dump). Serving loads it once at startup and calls scaler.transform() (not fit_transform).',
    },
    {
      id: 'window',
      label: 'Window aggregation timezone mismatch',
      training: 'events WHERE DATE_TRUNC("day", created_at) >= CURRENT_DATE - 7',
      serving:  'events WHERE created_at >= NOW() - INTERVAL "7 days"  -- UTC vs local',
      desc: 'Training uses a calendar-day window (midnight boundaries). Serving uses a rolling 7×24h window. At midnight UTC, serving may include 8 days of data while training expected 7.',
      impact: 'Low-medium. Creates subtle distribution shift on temporal features. Hard to detect — metrics look fine, behaviour is wrong.',
      fix: 'Standardise all timestamps to UTC at ingest. Define windows in code (not SQL) using explicit UTC boundaries. Add feature-level monitoring with PSI.',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: '#eaecff', marginBottom: '6px', letterSpacing: '-0.02em' }}>Training-Serving Skew Simulator</h3>
        <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6 }}>
          Four real skew bugs. Pick the one you think will hurt model performance the most. Then see the impact.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {BUGS.map(b => (
          <button key={b.id} onClick={() => { setBug(b.id); setRevealed(false) }}
            className="card"
            style={{
              textAlign: 'left', cursor: 'pointer',
              border: `1px solid ${bug === b.id ? 'rgba(244,63,94,0.4)' : '#1c2040'}`,
              background: bug === b.id ? 'rgba(244,63,94,0.05)' : 'linear-gradient(135deg,#0b0d1a,#0e1122)',
              transition: 'all 0.15s',
            }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: '#eaecff', marginBottom: '10px' }}>
              ⚠ {b.label}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', color: '#525a82', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Training</div>
              <code style={{ fontSize: '11px', color: '#10b981', fontFamily: "'JetBrains Mono',monospace", display: 'block' }}>{b.training}</code>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#525a82', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Serving</div>
              <code style={{ fontSize: '11px', color: '#f43f5e', fontFamily: "'JetBrains Mono',monospace", display: 'block' }}>{b.serving}</code>
            </div>
          </button>
        ))}
      </div>

      {bug && !revealed && (
        <button className="btn-primary" onClick={() => setRevealed(true)} style={{ alignSelf: 'flex-start' }}>
          Show impact & fix →
        </button>
      )}

      {revealed && bug && (() => {
        const b = BUGS.find(x => x.id === bug)
        return (
          <div className="card animate-slide-up" style={{ padding: '20px', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.25)' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '16px', color: '#eaecff', marginBottom: '12px' }}>⚠ {b.label}</div>
            <p style={{ fontSize: '13px', color: '#8891b8', lineHeight: 1.7, marginBottom: '12px' }}>{b.desc}</p>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f43f5e', fontWeight: 600 }}>Impact: </span>
              <span style={{ fontSize: '13px', color: '#f43f5e' }}>{b.impact}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', fontWeight: 600 }}>Fix: </span>
              <span style={{ fontSize: '13px', color: '#10b981' }}>{b.fix}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Feature Store Designer ───────────────────────────────────────────────────
function FeatureStoreDesigner() {
  const [featureType, setFeatureType] = useState('user')
  const [freshness, setFreshness]     = useState('realtime')
  const [storage, setStorage]         = useState('redis')

  const scenarios = {
    user: { icon: '👤', label: 'User profile features', examples: ['age', 'account_age_days', 'lifetime_value', 'country'], frequency: 'Low-medium (hours-days)' },
    session: { icon: '⚡', label: 'Session features', examples: ['page_views_last_30m', 'cart_value', 'device_type', 'referrer'], frequency: 'High (seconds-minutes)' },
    item: { icon: '📦', label: 'Item/product features', examples: ['price', 'stock_level', 'avg_rating', 'purchase_count_7d'], frequency: 'Medium (minutes-hours)' },
  }

  const storageOptions = {
    redis: { label: 'Redis', pros: 'Sub-ms reads. Simple. Native TTL.', cons: 'Memory-bound. Not great for large embeddings.', latency: '<1ms', cost: '$$' },
    dynamodb: { label: 'DynamoDB', pros: 'Fully managed. Scales automatically. Single-digit ms.', cons: 'Higher latency than Redis. Complex pricing.', latency: '2-5ms', cost: '$$$' },
    bigtable: { label: 'Bigtable', pros: 'Petabyte scale. Consistent low latency. Good for wide rows.', cons: 'GCP-only. Complex setup. Minimum node cost.', latency: '2-10ms', cost: '$$$' },
    cassandra: { label: 'Cassandra', pros: 'Multi-region. Tunable consistency. No single point of failure.', cons: 'Operationally complex. Eventual consistency by default.', latency: '3-10ms', cost: '$$' },
  }

  const s = scenarios[featureType]
  const st = storageOptions[storage]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: '#eaecff', marginBottom: '6px', letterSpacing: '-0.02em' }}>Feature Store Designer</h3>
        <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6 }}>
          Design an online feature store for a real-time recommendation system. Choose feature type, freshness SLA, and storage backend.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {Object.entries(scenarios).map(([k, v]) => (
          <button key={k} onClick={() => setFeatureType(k)} className="card"
            style={{ textAlign: 'left', cursor: 'pointer', border: `1px solid ${featureType === k ? 'rgba(99,102,241,0.4)' : '#1c2040'}`, background: featureType === k ? 'rgba(99,102,241,0.08)' : 'linear-gradient(135deg,#0b0d1a,#0e1122)', transition: 'all 0.15s', padding: '14px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{v.icon}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: '#eaecff', marginBottom: '4px' }}>{v.label}</div>
            <div style={{ fontSize: '11px', color: '#525a82' }}>{v.frequency}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '12px' }}>Example features for this type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {s.examples.map(ex => (
            <code key={ex} style={{ fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '5px', padding: '4px 10px' }}>{ex}</code>
          ))}
        </div>
      </div>

      <div>
        <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Online storage backend</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
          {Object.entries(storageOptions).map(([k, v]) => (
            <button key={k} onClick={() => setStorage(k)} className="card"
              style={{ textAlign: 'center', cursor: 'pointer', border: `1px solid ${storage === k ? 'rgba(34,211,238,0.4)' : '#1c2040'}`, background: storage === k ? 'rgba(34,211,238,0.06)' : 'linear-gradient(135deg,#0b0d1a,#0e1122)', transition: 'all 0.15s', padding: '12px' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '14px', color: storage === k ? '#22d3ee' : '#eaecff', marginBottom: '4px' }}>{v.label}</div>
              <div style={{ fontSize: '11px', color: '#525a82' }}>P50: {v.latency}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '18px', background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)' }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '15px', color: '#22d3ee', marginBottom: '10px' }}>
          {st.label} for {s.label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div><div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>✓ PROS</div><div style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6 }}>{st.pros}</div></div>
          <div><div style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 600, marginBottom: '4px' }}>✗ CONS</div><div style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6 }}>{st.cons}</div></div>
        </div>
        {featureType === 'session' && storage !== 'redis' && (
          <p style={{ fontSize: '13px', color: '#f59e0b', margin: 0 }}>⚠ For session features with sub-second staleness requirements, Redis is usually the right choice. {st.latency} P50 may violate your serving SLA.</p>
        )}
      </div>
    </div>
  )
}

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'skew',     label: 'Skew Simulator',       icon: '⚡', component: SkewSimulator },
  { id: 'store',    label: 'Feature Store Designer', icon: '🏪', component: FeatureStoreDesigner },
]

export default function FeatureEngTab() {
  const [active, setActive] = useState('skew')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? SkewSimulator

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>🧩</span>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: '#eaecff', letterSpacing: '-0.04em' }}>Feature Engineering</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#525a82', lineHeight: 1.6, maxWidth: '580px' }}>
          The gap between a model that works in a notebook and one that works in production is almost always a feature engineering problem.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)} className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>
            <span style={{ marginRight: '6px' }}>{m.icon}</span>{m.label}
          </button>
        ))}
      </div>
      <ActiveModule />
    </div>
  )
}
