import { useState, useMemo, useEffect } from 'react'
import AccessGate from '../components/AccessGate.jsx'

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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Training-Serving Skew Simulator</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Four real skew bugs. Pick the one you think will hurt model performance the most. Then see the impact.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {BUGS.map(b => (
          <button key={b.id} onClick={() => { setBug(b.id); setRevealed(false) }}
            className="card"
            style={{
              textAlign: 'left', cursor: 'pointer',
              border: `1px solid ${bug === b.id ? 'rgba(244,63,94,0.4)' : 'var(--rim)'}`,
              background: bug === b.id ? 'rgba(244,63,94,0.11)' : 'var(--depth)',
              transition: 'all 0.15s',
            }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '10px' }}>
              {b.label}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <div className="section-eyebrow" style={{ marginBottom: '3px' }}>Training</div>
              <code style={{ fontSize: '11px', color: 'var(--ink-hi)', fontFamily: 'var(--font-mono)', display: 'block' }}>{b.training}</code>
            </div>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '3px' }}>Serving</div>
              <code style={{ fontSize: '11px', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)', display: 'block' }}>{b.serving}</code>
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
          <div className="card animate-slide-up" style={{ padding: '20px', background: 'rgba(244,63,94,0.11)', border: '1px solid rgba(244,63,94,0.25)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: 'var(--ink-hi)', marginBottom: '12px' }}>{b.label}</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, marginBottom: '12px' }}>{b.desc}</p>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--rose)', fontWeight: 600 }}>Impact: </span>
              <span style={{ fontSize: '13px', color: 'var(--rose)' }}>{b.impact}</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--mint)', fontWeight: 600 }}>Fix: </span>
              <span style={{ fontSize: '13px', color: 'var(--mint)' }}>{b.fix}</span>
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
    user: { icon: '[U]', label: 'User profile features', examples: ['age', 'account_age_days', 'lifetime_value', 'country'], frequency: 'Low-medium (hours-days)' },
    session: { icon: '[S]', label: 'Session features', examples: ['page_views_last_30m', 'cart_value', 'device_type', 'referrer'], frequency: 'High (seconds-minutes)' },
    item: { icon: '[I]', label: 'Item/product features', examples: ['price', 'stock_level', 'avg_rating', 'purchase_count_7d'], frequency: 'Medium (minutes-hours)' },
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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Feature Store Designer</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Design an online feature store for a real-time recommendation system. Choose feature type, freshness SLA, and storage backend.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {Object.entries(scenarios).map(([k, v]) => (
          <button key={k} onClick={() => setFeatureType(k)} className="card"
            style={{ textAlign: 'left', cursor: 'pointer', border: `1px solid ${featureType === k ? 'rgba(240,165,0,0.35)' : 'var(--rim)'}`, background: featureType === k ? 'var(--prime-faint)' : 'var(--depth)', transition: 'all 0.15s', padding: '14px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: featureType === k ? 'var(--prime-hi)' : 'var(--ink-low)', background: featureType === k ? 'rgba(240,165,0,0.10)' : 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '4px', padding: '2px 7px', display: 'inline-block', marginBottom: '10px' }}>{v.icon}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '4px' }}>{v.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)' }}>{v.frequency}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '12px' }}>Example features for this type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {s.examples.map(ex => (
            <code key={ex} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.18)', color: 'var(--prime)', borderRadius: '5px', padding: '4px 10px' }}>{ex}</code>
          ))}
        </div>
      </div>

      <div>
        <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Online storage backend</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
          {Object.entries(storageOptions).map(([k, v]) => (
            <button key={k} onClick={() => setStorage(k)} className="card"
              style={{ textAlign: 'center', cursor: 'pointer', border: `1px solid ${storage === k ? 'rgba(34,211,238,0.4)' : 'var(--rim)'}`, background: storage === k ? 'rgba(34,211,238,0.13)' : 'var(--depth)', transition: 'all 0.15s', padding: '12px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: storage === k ? 'var(--prime)' : 'var(--ink-hi)', marginBottom: '4px' }}>{v.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)' }}>P50: {v.latency}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '18px', background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.15)' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--prime)', marginBottom: '10px' }}>
          {st.label} for {s.label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div><div style={{ fontSize: '11px', color: 'var(--mint)', fontWeight: 600, marginBottom: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>PROS</div><div style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>{st.pros}</div></div>
          <div><div style={{ fontSize: '11px', color: 'var(--rose)', fontWeight: 600, marginBottom: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>CONS</div><div style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>{st.cons}</div></div>
        </div>
        {featureType === 'session' && storage !== 'redis' && (
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0 }}>Note: For session features with sub-second staleness requirements, Redis is usually the right choice. {st.latency} P50 may violate your serving SLA.</p>
        )}
      </div>
    </div>
  )
}

// ─── Window Aggregation Builder ──────────────────────────────────────────────
function WindowAggregationBuilder() {
  const [entity, setEntity]         = useState('user')
  const [metric, setMetric]         = useState('purchase_amount')
  const [agg, setAgg]               = useState('sum')
  const [windowType, setWindowType] = useState('tumbling')
  const [windowSize, setWindowSize] = useState('7d')
  const [codeTab, setCodeTab]       = useState('sql')

  const ENTITIES = {
    user:    { label: 'User',    icon: '[U]', metrics: ['purchase_amount', 'page_views', 'session_duration', 'items_clicked', 'search_queries'] },
    item:    { label: 'Item',    icon: '[I]', metrics: ['view_count', 'add_to_cart_count', 'purchase_count', 'rating_sum', 'return_count'] },
    session: { label: 'Session', icon: '[S]', metrics: ['events', 'duration_seconds', 'pages_visited', 'cart_value', 'scroll_depth'] },
  }

  const AGGS = {
    sum:            { label: 'SUM',            spark: 'sum',            warn: null },
    avg:            { label: 'AVG',            spark: 'avg',            warn: 'avg over sliding window ≠ running avg' },
    count:          { label: 'COUNT',          spark: 'count',          warn: null },
    max:            { label: 'MAX',            spark: 'max',            warn: null },
    stddev:         { label: 'STDDEV',         spark: 'stddev',         warn: 'Returns null with < 2 rows in window' },
    last:           { label: 'LAST VALUE',     spark: 'last',           warn: 'Add ignoreNulls=true in Spark' },
    distinct_count: { label: 'COUNT DISTINCT', spark: 'countDistinct',  warn: 'Expensive at scale — use approx_count_distinct (HyperLogLog)' },
  }

  const WINDOW_TYPES = {
    tumbling: { label: 'Tumbling', desc: 'Fixed non-overlapping intervals. Best for daily/hourly batch features.' },
    sliding:  { label: 'Sliding',  desc: 'Rolling window. Every event belongs to multiple windows — more compute.' },
    session:  { label: 'Session',  desc: 'Inactivity gap defines boundary. Needs a gap timeout parameter.' },
  }

  const SIZES = ['1h', '6h', '24h', '7d', '30d']

  const e   = ENTITIES[entity]
  const a   = AGGS[agg]
  const wt  = WINDOW_TYPES[windowType]
  const feat = `${entity}_${agg}_${metric}_${windowSize}`

  const sqlCode = windowType === 'session'
    ? `-- Session window (Spark Structured Streaming / Flink)
SELECT
  ${entity}_id,
  SESSION_START(event_time, INTERVAL '30' MINUTE) AS window_start,
  SESSION_END(event_time,   INTERVAL '30' MINUTE) AS window_end,
  ${agg.toUpperCase()}(${metric}) AS ${feat}
FROM events
GROUP BY
  ${entity}_id,
  SESSION(event_time, INTERVAL '30' MINUTE);`
    : windowType === 'sliding'
    ? `-- Sliding window (1-hour slide)
SELECT
  ${entity}_id,
  window.start,
  window.end,
  ${agg.toUpperCase()}(${metric}) AS ${feat}
FROM events
GROUP BY
  ${entity}_id,
  SLIDE(event_time, INTERVAL '1' HOUR, INTERVAL '${windowSize}');`
    : `-- Tumbling window (Spark SQL)
SELECT
  ${entity}_id,
  window(event_time, '${windowSize}').start AS window_start,
  ${agg.toUpperCase()}(${metric})           AS ${feat}
FROM events
GROUP BY
  ${entity}_id,
  window(event_time, '${windowSize}');`

  const sparkCode = windowType === 'session'
    ? `from pyspark.sql import functions as F
from pyspark.sql.window import Window

GAP_SECONDS = 30 * 60

w = Window.partitionBy("${entity}_id").orderBy("event_time")

df = (df
  .withColumn("prev_ts", F.lag("event_time").over(w))
  .withColumn("gap_sec",
    F.col("event_time").cast("long") - F.col("prev_ts").cast("long"))
  .withColumn("new_session",
    (F.col("gap_sec") > GAP_SECONDS) | F.col("prev_ts").isNull())
  .withColumn("session_id", F.sum("new_session").over(w))
)

result = df.groupBy("${entity}_id", "session_id").agg(
    F.${a.spark}("${metric}").alias("${feat}")
)`
    : `from pyspark.sql import functions as F

result = (df
  .groupBy(
    F.col("${entity}_id"),
    F.window("event_time", "${windowSize}"${windowType === 'sliding' ? ', "1 hour"' : ''})
  )
  .agg(F.${a.spark}("${metric}").alias("${feat}"))
  .select(
    "${entity}_id",
    F.col("window.start").alias("window_start"),
    "${feat}"
  )
)`

  const GOTCHAS = [
    ...(agg === 'distinct_count' ? ['Exact COUNT DISTINCT triggers a full shuffle. Use approx_count_distinct() for > 10M rows (HyperLogLog, ~2% error).'] : []),
    ...(windowType === 'sliding'  ? ['Sliding windows multiply data volume: a 7d window with 1h slide = 168 copies per event. Partition by entity before windowing.'] : []),
    ...(windowType === 'session'  ? ['Session windows are stateful. In Spark Streaming, set withWatermark("event_time", "2 hours") to bound state store size.'] : []),
    ...(agg === 'avg' || agg === 'stddev' ? [`${a.label} returns null when the window has < 2 rows. Wrap with COALESCE(${feat}, 0).`] : []),
    'Point-in-time correctness: features must only use data available at prediction time. Use AS-OF joins when backfilling historical features.',
    'Timezone traps: calendar-day boundaries differ from rolling 24h windows. Standardise all timestamps to UTC at ingest.',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Window Aggregation Builder</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Configure a time-window feature and get production-ready SQL and PySpark — plus the gotchas that get teams in trouble.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>
        {/* Entity */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Entity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(ENTITIES).map(([k, v]) => (
              <button key={k} onClick={() => { setEntity(k); setMetric(v.metrics[0]) }}
                style={{ textAlign: 'left', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${entity === k ? 'rgba(240,165,0,0.35)' : 'transparent'}`, background: entity === k ? 'rgba(240,165,0,0.14)' : 'transparent', cursor: 'pointer', fontSize: '13px', color: entity === k ? 'var(--prime)' : 'var(--ink-mid)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Metric</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {e.metrics.map(m => (
              <button key={m} onClick={() => setMetric(m)}
                style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${metric === m ? 'rgba(240,165,0,0.4)' : 'transparent'}`, background: metric === m ? 'rgba(240,165,0,0.13)' : 'transparent', cursor: 'pointer', fontSize: '11px', color: metric === m ? 'var(--prime)' : 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Aggregation */}
        <div className="card" style={{ padding: '14px' }}>
          <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Aggregation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(AGGS).map(([k, v]) => (
              <button key={k} onClick={() => setAgg(k)}
                style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${agg === k ? 'rgba(240,165,0,0.4)' : 'transparent'}`, background: agg === k ? 'rgba(240,165,0,0.13)' : 'transparent', cursor: 'pointer', fontSize: '11px', color: agg === k ? 'var(--prime)' : 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
                {v.label}
                {v.warn && <span style={{ fontSize: '9px', color: 'var(--ink-low)', marginLeft: '4px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>}
              </button>
            ))}
          </div>
        </div>

        {/* Window type + size */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card" style={{ padding: '14px' }}>
            <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Window type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(WINDOW_TYPES).map(([k, v]) => (
                <button key={k} onClick={() => setWindowType(k)}
                  style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${windowType === k ? 'rgba(240,165,0,0.4)' : 'transparent'}`, background: windowType === k ? 'rgba(240,165,0,0.13)' : 'transparent', cursor: 'pointer', fontSize: '12px', color: windowType === k ? 'var(--prime)' : 'var(--ink-low)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: '14px' }}>
            <div className="section-eyebrow">Window size</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SIZES.map(s => (
                <button key={s} onClick={() => setWindowSize(s)}
                  style={{ padding: '4px 10px', borderRadius: '5px', border: `1px solid ${windowSize === s ? 'rgba(240,165,0,0.4)' : 'var(--rim)'}`, background: windowSize === s ? 'rgba(240,165,0,0.15)' : 'transparent', cursor: 'pointer', fontSize: '12px', color: windowSize === s ? 'var(--prime)' : 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Window type note */}
      <div className="card" style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <span style={{ fontSize: '12px', color: 'var(--prime)', fontWeight: 600 }}>{wt.label}: </span>
        <span style={{ fontSize: '12px', color: 'var(--ink-mid)' }}>{wt.desc}</span>
      </div>

      {/* Agg warning */}
      {a.warn && (
        <div className="card" style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <span style={{ fontSize: '12px', color: 'var(--prime)', fontWeight: 600 }}>{a.label}: </span>
          <span style={{ fontSize: '12px', color: 'var(--ink-mid)' }}>{a.warn}</span>
        </div>
      )}

      {/* Feature name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>Feature name:</span>
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--prime)', background: 'rgba(240,165,0,0.14)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '6px', padding: '4px 12px' }}>
          {feat}
        </code>
      </div>

      {/* Code output */}
      <div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '-1px' }}>
          {[['sql', 'SQL'], ['spark', 'PySpark']].map(([t, lbl]) => (
            <button key={t} onClick={() => setCodeTab(t)}
              style={{ padding: '6px 16px', borderRadius: '6px 6px 0 0', border: '1px solid var(--rim)', borderBottom: codeTab === t ? '1px solid var(--depth)' : undefined, background: codeTab === t ? 'var(--depth)' : 'transparent', cursor: 'pointer', fontSize: '12px', color: codeTab === t ? 'var(--ink-hi)' : 'var(--ink-low)', fontFamily: 'var(--font-mono)', fontWeight: codeTab === t ? 600 : 400 }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '0 6px 6px 6px', padding: '16px', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontSize: '12px', color: 'var(--ink-hi)', fontFamily: 'var(--font-mono)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {codeTab === 'sql' ? sqlCode : sparkCode}
          </pre>
        </div>
      </div>

      {/* Gotchas */}
      <div>
        <div style={{ fontSize: '13px', color: 'var(--prime)', fontWeight: 600, marginBottom: '10px', fontFamily: 'var(--font-sans)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Gotchas for this configuration</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {GOTCHAS.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 14px', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--ink-low)', flexShrink: 0 }}>→</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{g}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Feature Leakage Zoo ─────────────────────────────────────────────────────
const LEAKAGE_SCENARIOS = [
  {
    id: 'target',
    type: 'Target Leakage',
    color: 'var(--rose)',
    example: 'Predicting fraud: including `is_flagged_by_ops` (set after fraud review) as a feature',
    silentFailure: 'Training AUC 0.99, production AUC 0.62. Model only works when the label-adjacent signal is available.',
    detection: 'Feature importance audit — if a feature has implausibly high importance, check its generation timestamp vs label timestamp.',
    fix: 'Enforce a strict point-in-time join. Every feature must be computable using only data available before the prediction event.',
    severity: 'Critical',
  },
  {
    id: 'temporal',
    type: 'Temporal Leakage',
    color: 'var(--rose)',
    example: 'Rolling 7-day avg computed using future rows due to wrong sort order before window',
    silentFailure: 'Backtest P&L looks great. Live trading loses money from day 1. No error thrown.',
    detection: 'Sort your dataset by time and recompute features row-by-row. Compare against batch-computed values. Any mismatch is leakage.',
    fix: 'Compute time-based features with explicit ORDER BY + ROWS BETWEEN N PRECEDING AND CURRENT ROW. Never use RANGE unless you understand the boundary semantics.',
    severity: 'Critical',
  },
  {
    id: 'group',
    type: 'Group / Split Leakage',
    color: 'var(--ember)',
    example: 'User appears in both train and test set — model memorizes user-level signal',
    silentFailure: 'Offline eval looks strong. Production metrics are 10-15pp lower. A/B test shows no lift.',
    detection: 'Check overlap between train and test entity IDs. For recommendation systems, always split by user, not by interaction.',
    fix: 'Use group-aware splits (GroupKFold, time-based split, entity-based split). Never random-split when rows share an entity.',
    severity: 'High',
  },
  {
    id: 'proxy',
    type: 'Proxy Label Leakage',
    color: 'var(--ember)',
    example: 'Predicting churn using `support_tickets_last_30d` — tickets spike because user is already churning',
    silentFailure: 'Model performance is fine at launch, degrades as user behavior changes and ticket patterns shift.',
    detection: 'Plot feature values stratified by label. A feature with near-perfect separation between labels is suspicious — understand why.',
    fix: 'Distinguish leading indicators (available before outcome) from lagging indicators (correlated with outcome but caused by it). Only use leading indicators.',
    severity: 'High',
  },
  {
    id: 'aggregation',
    type: 'Aggregation Leakage',
    color: 'var(--gold)',
    example: 'Mean-encoding target variable across all rows including the current row',
    silentFailure: 'Target-encoded features look great in training. Encoding at serving time requires a lookup that doesn\'t exist — silent fallback to global mean.',
    detection: 'Check if your encoding uses the target column. If yes, it must use out-of-fold estimates only.',
    fix: 'Use out-of-fold target encoding (fit on k-1 folds, encode fold k). At serving time, use the held-out global estimate only.',
    severity: 'Medium',
  },
  {
    id: 'meta',
    type: 'Meta-feature Leakage',
    color: 'var(--gold)',
    example: 'Including row index, file path, or dataset ID as a feature — model learns dataset split identity',
    silentFailure: 'Model appears to generalize during CV. Fails on new data source. Feature importance shows row_id in top 10.',
    detection: 'Audit all features including auto-generated or index columns. Drop anything that encodes dataset identity.',
    fix: 'Before training, explicitly drop: row IDs, file metadata, timestamps used for splitting, data source identifiers.',
    severity: 'Medium',
  },
  {
    id: 'join_fanout',
    type: 'Join Fanout Leakage',
    color: 'var(--sky)',
    example: 'Left-joining events to a slowly changing dim without snapshotting — gets today\'s dim value for historical events',
    silentFailure: 'Model trained on historical events uses current attribute values. At serving time, behavior matches training — but only because serving also uses current values.',
    detection: 'Compare feature distributions for old events vs new events. If old events have "current" attribute values, you have fanout leakage.',
    fix: 'Snapshot dimension tables or use SCD Type 2. Always join on (entity_id, event_ts) with dim.valid_from <= event_ts < dim.valid_to.',
    severity: 'Medium',
  },
  {
    id: 'imputation',
    type: 'Imputation Leakage',
    color: 'var(--sky)',
    example: 'Imputing missing values using statistics computed on the full dataset (including test rows)',
    silentFailure: 'Cross-validation shows stable metrics. When deployed on future data, null handling differs — score distribution shifts.',
    detection: 'Trace where imputation statistics (mean, median, mode) are computed. They should only see training data.',
    fix: 'Always fit imputers inside a Pipeline or explicitly on train split only. Store fitted imputers as artifacts. Serving loads and applies them.',
    severity: 'Low-Medium',
  },
]

function FeatureLeakageZoo() {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const scenario = LEAKAGE_SCENARIOS.find(s => s.id === selected)

  const severityOrder = { Critical: 0, High: 1, Medium: 2, 'Low-Medium': 3 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Feature Leakage Zoo</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          8 leakage patterns that silently inflate offline metrics. Pick one — identify the silent failure before reading the diagnosis.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
        {LEAKAGE_SCENARIOS.map(s => (
          <button key={s.id} onClick={() => { setSelected(s.id); setRevealed(false) }}
            className="card"
            style={{
              textAlign: 'left', cursor: 'pointer',
              border: `1px solid ${selected === s.id ? s.color : 'var(--rim)'}`,
              background: selected === s.id ? `color-mix(in srgb, ${s.color} 8%, var(--depth))` : 'var(--depth)',
              transition: 'all 0.15s',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)' }}>{s.type}</span>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                background: `color-mix(in srgb, ${s.color} 15%, transparent)`,
                color: s.color, letterSpacing: '0.05em',
              }}>{s.severity}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.5, margin: 0 }}>{s.example}</p>
          </button>
        ))}
      </div>

      {scenario && (
        <div className="card" style={{ border: `1px solid ${scenario.color}`, background: `color-mix(in srgb, ${scenario.color} 5%, var(--depth))` }}>
          <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: scenario.color, marginBottom: '16px' }}>
            {scenario.type} — Severity: {scenario.severity}
          </h4>

          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '4px' }}>Example</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6, fontStyle: 'italic' }}>{scenario.example}</div>
            </div>

            <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Silent Failure Signature</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{scenario.silentFailure}</div>
            </div>

            {!revealed ? (
              <button onClick={() => setRevealed(true)} className="card"
                style={{ cursor: 'pointer', background: 'rgba(240,165,0,0.15)', border: '1px dashed rgba(240,165,0,0.4)', padding: '12px', textAlign: 'center' }}>
                <span style={{ color: 'var(--prime)', fontWeight: 600, fontSize: '13px' }}>Reveal Detection + Fix →</span>
              </button>
            ) : (
              <>
                <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Detection</div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{scenario.detection}</div>
                </div>
                <div style={{ background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Fix</div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{scenario.fix}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Online vs Offline Feature Decision ──────────────────────────────────────
const ONLINE_OFFLINE_SCENARIOS = [
  {
    id: 'reco_ctr',
    label: 'Real-time recommendation CTR',
    latency: '<50ms', freshness: 'seconds', load: 'high', complexity: 'medium',
    verdict: 'Online feature store (Redis/DynamoDB)',
    reasoning: 'CTR models need fresh user session context (last click, dwell time). Sub-50ms budget leaves no time for batch reads. Pre-compute aggregates in streaming (Flink/Kafka) and push to an online store.',
    antipattern: 'Calling a feature computation service synchronously at inference time — adds 20-40ms and a failure mode.',
    tags: ['Redis', 'Flink', 'Feast'],
  },
  {
    id: 'fraud_txn',
    label: 'Fraud scoring at payment',
    latency: '<100ms', freshness: 'seconds', load: 'very high', complexity: 'high',
    verdict: 'Dual-write: stream to online store + async to offline',
    reasoning: 'Fraud needs both fresh signals (last 5 transactions, velocity) and historical signals (30-day spend pattern). Pre-compute historical nightly. Stream velocity features in real-time. Join at serving time from online store only.',
    antipattern: 'Computing velocity counts in the serving path — unbounded latency under spike traffic. One slow DB query and the payment times out.',
    tags: ['Dual-write', 'Kafka', 'Redis', 'Snowflake'],
  },
  {
    id: 'batch_risk',
    label: 'Monthly credit risk scoring',
    latency: 'hours', freshness: 'daily', load: 'low', complexity: 'high',
    verdict: 'Offline batch only (data warehouse)',
    reasoning: 'Monthly batch scoring has no latency constraint. Complex features (12-month payment history, peer comparisons) are expensive to compute — run once nightly in the warehouse. No online store needed.',
    antipattern: 'Building an online store for a batch use case — operational overhead with zero latency benefit.',
    tags: ['Snowflake', 'dbt', 'Spark'],
  },
  {
    id: 'search_rank',
    label: 'Search result ranking',
    latency: '<200ms', freshness: 'hours', load: 'high', complexity: 'medium',
    verdict: 'Precompute + cache (CDN/local cache)',
    reasoning: 'Query-independent features (document popularity, quality score) change slowly. Precompute daily and cache at edge. Query-dependent features (BM25 score, personalization) computed at request time from precomputed signals.',
    antipattern: 'Recomputing document-level features at query time — O(docs) computation per request kills latency.',
    tags: ['CDN cache', 'Elasticsearch', 'Redis'],
  },
  {
    id: 'churn_pred',
    label: 'Daily churn propensity',
    latency: 'minutes', freshness: 'daily', load: 'medium', complexity: 'high',
    verdict: 'Offline batch + feature snapshot table',
    reasoning: 'Churn scores are consumed by CRM tools, not real-time serving. Run full feature pipeline nightly, write scores + feature snapshot to a table. Downstream systems read from the table.',
    antipattern: 'Serving churn scores through an API with live feature computation — daily-fresh model doesn\'t benefit, but you pay for online infra.',
    tags: ['Airflow', 'dbt', 'BigQuery'],
  },
  {
    id: 'llm_rag',
    label: 'LLM retrieval-augmented generation',
    latency: '<500ms', freshness: 'hours-days', load: 'medium', complexity: 'high',
    verdict: 'Offline embedding index + online vector search',
    reasoning: 'Document embeddings are expensive to compute but change infrequently. Compute embeddings in batch, index in a vector DB (Pinecone, Weaviate, pgvector). At query time, embed the user query online and search the precomputed index.',
    antipattern: 'Recomputing document embeddings at query time — 100ms+ per doc × corpus size = unusable latency.',
    tags: ['Pinecone', 'pgvector', 'Batch embed'],
  },
]

function OnlineOfflineDecider() {
  const [selected, setSelected] = useState(null)
  const scenario = ONLINE_OFFLINE_SCENARIOS.find(s => s.id === selected)

  const BADGE_COLORS = {
    '<50ms': 'var(--rose)', '<100ms': 'var(--ember)', '<200ms': 'var(--gold)',
    '<500ms': 'var(--mint)', 'minutes': 'var(--sky)', 'hours': 'var(--violet)',
    'seconds': 'var(--rose)', 'hours-days': 'var(--violet)', 'daily': 'var(--mint)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Online vs Offline Feature Decision</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          The most expensive mistake in MLOps: over-engineering feature serving. Choose a scenario — decide the architecture before reading the answer.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
        {ONLINE_OFFLINE_SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            className="card"
            style={{
              textAlign: 'left', cursor: 'pointer',
              border: `1px solid ${selected === s.id ? 'var(--prime)' : 'var(--rim)'}`,
              background: selected === s.id ? 'rgba(240,165,0,0.10)' : 'var(--depth)',
              transition: 'all 0.15s',
            }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '10px' }}>{s.label}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: `Latency: ${s.latency}`, color: BADGE_COLORS[s.latency] || 'var(--ink-low)' },
                { label: `Freshness: ${s.freshness}`, color: BADGE_COLORS[s.freshness] || 'var(--ink-low)' },
                { label: `Load: ${s.load}`, color: s.load === 'very high' ? 'var(--rose)' : s.load === 'high' ? 'var(--ember)' : 'var(--mint)' },
              ].map(b => (
                <span key={b.label} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `color-mix(in srgb, ${b.color} 15%, transparent)`, color: b.color, fontWeight: 600 }}>
                  {b.label}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {scenario && (
        <div className="card" style={{ border: '1px solid rgba(240,165,0,0.35)', background: 'rgba(240,165,0,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)', margin: 0 }}>{scenario.label}</h4>
            <div style={{ background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', padding: '4px 10px' }}>
              <span style={{ color: 'var(--prime)', fontWeight: 700, fontSize: '13px' }}>{scenario.verdict}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '4px' }}>Why</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{scenario.reasoning}</div>
            </div>
            <div style={{ background: 'rgba(244,63,94,0.14)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Anti-pattern</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{scenario.antipattern}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {scenario.tags.map(t => (
                <span key={t} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(240,165,0,0.1)', color: 'var(--prime)', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab shell ───────────────────────────────────────────────────────────────
// ─── Feature Store Architecture Diagram ──────────────────────────────────────
const ARCH_NODES = [
  {
    id: 'sources', label: 'Data Sources', sub: 'DBs · event logs · CDC streams',
    color: 'var(--ink-mid)', bg: 'rgba(255,255,255,0.10)',
    what: 'The raw inputs to your feature pipeline: transactional databases (user profiles, orders), event logs (clicks, page views), and change-data-capture (CDC) streams from upstream systems.',
    decisions: 'Decide the ingestion pattern per source type: database → batch export or CDC (Debezium); events → Kafka; files → S3/GCS drop zone. This choice determines freshness and operational cost.',
    failures: 'Schema changes upstream break downstream pipelines silently. Always register schemas in a schema registry (Confluent, Glue) and version them.',
    signal: 'Senior engineers discuss schema governance and upstream coupling — not just "we read from Kafka."',
  },
  {
    id: 'batch', label: 'Batch ETL', sub: 'Spark · dbt · hourly/daily jobs',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)',
    what: 'Scheduled jobs (Spark, dbt, SQL) that compute aggregated features over historical data windows. Example: "user\'s 30-day purchase count", "listing\'s 90-day average review score."',
    decisions: 'Materialization strategy: full recompute vs incremental. Full is safe and simple; incremental is cheaper but requires a reliable watermark. Partition by entity + date for efficient backfill.',
    failures: 'Recomputing on every run without partitioning scans the full table daily. At scale, this becomes the most expensive job in your org. Incremental updates with proper partitioning are non-negotiable.',
    signal: 'Know the difference between full recompute and incremental strategies. Explain how you\'d design backfill.',
  },
  {
    id: 'stream', label: 'Streaming Ingest', sub: 'Kafka → Flink / Spark Streaming',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)',
    what: 'Real-time event processing pipeline that computes features as events arrive. Example: "session click count in last 10 minutes", "transaction velocity in last 60 seconds."',
    decisions: 'Exactly-once vs at-least-once semantics. Windowing strategy: tumbling (non-overlapping), sliding (overlapping), session (gap-based). Late data handling: watermarks define how long to wait.',
    failures: 'Watermark too tight → late events dropped silently. Watermark too wide → high latency. No exactly-once → duplicate feature updates corrupt aggregates. Test late-data scenarios explicitly.',
    signal: 'Discuss watermarks and late-data handling specifically — this separates engineers who\'ve operated streaming systems from those who\'ve only read about them.',
  },
  {
    id: 'offline', label: 'Offline Store', sub: 'S3 / Hive / BigQuery / Iceberg',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)',
    what: 'Columnar storage of historical feature values, partitioned by entity and timestamp. This is the source of truth for generating training datasets via point-in-time correct joins.',
    decisions: 'File format: Parquet or Iceberg (prefer Iceberg for time-travel). Partitioning: by entity_id + date is most common. Retention: keep enough history for retraining windows (typically 1–2 years).',
    failures: 'Storing only the latest feature value (no history) makes point-in-time correct retrieval impossible. This is the most common feature store implementation mistake.',
    signal: 'Point-in-time correctness is the key concept. If the candidate doesn\'t know what it is, they haven\'t operated a real feature store.',
  },
  {
    id: 'online', label: 'Online Store', sub: 'Redis · Cassandra · DynamoDB · <5ms',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)',
    what: 'Low-latency key-value store holding the most recent pre-computed feature values for each entity. Queried at request time during model inference. Must return values in <5ms P99.',
    decisions: 'Storage system: Redis for <1ms latency + small data; Cassandra/DynamoDB for >10M entities or higher durability requirements. TTL per feature type (session features: 30min; user profile: 24h).',
    failures: 'No TTL on features → stale values served indefinitely. Cache stampede under load when many keys expire simultaneously. Hot partitions for popular entities in Cassandra.',
    signal: 'Discuss TTL design explicitly. Engineers who\'ve built online stores worry about stale features and eviction policies — not just the happy path.',
  },
  {
    id: 'pit', label: 'Point-in-Time Join', sub: 'as-of query · training data gen',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)',
    what: 'For each (entity, label_timestamp) pair in your training dataset, retrieves the feature value that was valid at label_timestamp — not the current value. Prevents future data leakage into training.',
    decisions: 'Implementation: range join on (entity_id, feature_ts <= label_ts ORDER BY feature_ts DESC LIMIT 1). Feast calls this a point-in-time join. Without this, your offline metrics are inflated.',
    failures: 'Using latest-value join for training data is the single most common cause of inflated offline metrics that don\'t hold up in production. The gap can be 5–20% AUC.',
    signal: 'If a candidate can explain point-in-time joins without prompting, they\'ve been burned by this bug before. This is a senior-level concept.',
  },
  {
    id: 'servapi', label: 'Feature Serving API', sub: 'batch lookup · entity keys',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)',
    what: 'The API layer that retrieves pre-computed features from the online store at inference time. Accepts entity keys (user_id, item_id), returns feature vectors. Must be sub-5ms P99.',
    decisions: 'Batch vs single lookup: fetch all features for an entity in one call to minimize round trips. Fallback strategy: what to return if a feature is missing (default value, or flag the request).',
    failures: 'Fallback to recompute on cache miss is a latency timebomb — works fine at low QPS, blows P99 at 10K+ QPS. Design explicit fallback values and test the miss path under load.',
    signal: 'Ask about the cache miss strategy. Engineers who haven\'t operated serving systems give vague answers. The correct answer is "explicit fallback values defined per feature, never recompute at request time."',
  },
  {
    id: 'training', label: 'Model Training', sub: 'offline features → artifacts',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.15)',
    what: 'Consumes the point-in-time correct training dataset from the offline store. Outputs a trained model artifact plus the feature pipeline version used — both must be versioned together.',
    decisions: 'The training pipeline must record which feature pipeline version was used. A model artifact alone is incomplete — you also need the exact feature computation logic that was used to train it.',
    failures: 'Feature pipeline is updated after training but before the model is promoted. Now training and serving compute features differently. Always tie model version to feature pipeline version.',
    signal: 'Mention co-versioning model artifacts with feature pipeline versions. This is the production ML hygiene that separates researchers from engineers.',
  },
  {
    id: 'inference', label: 'Model Serving', sub: 'online features + inference',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.15)',
    what: 'At request time: fetch features from online store, run model inference, return prediction. The model must use the same feature computation logic as was used at training time.',
    decisions: 'Synchronous (real-time) vs pre-compute (batch score + cache). Real-time: fresh features but adds latency. Pre-computed: fast but stale. Right choice depends on feature freshness requirements.',
    failures: 'Training used feature_version=2, serving fetches feature_version=1 from online store because the migration was incomplete. This is silent — no error, just degraded model performance.',
    signal: 'Strong candidates discuss the training-serving feature version alignment and how they\'d validate it before promotion.',
  },
  {
    id: 'monitor', label: 'Feature Monitoring', sub: 'PSI · freshness · null rates',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)',
    what: 'Continuous monitoring of feature health across both stores: PSI to detect distribution drift, null rate tracking, freshness lag monitoring (how stale are online store values?), and schema drift alerts.',
    decisions: 'Monitor at the feature level, not just model level. PSI > 0.2 on any feature triggers investigation before it affects model performance. Set separate alerts for offline store freshness vs online store TTL.',
    failures: 'Monitoring only model output metrics (CTR, conversion) catches problems too late. Feature-level monitoring catches upstream data issues hours before they impact model performance.',
    signal: 'Ask "what would you monitor beyond model output metrics?" Weak answer: "accuracy and latency." Strong answer: per-feature PSI, null rates, serving freshness, schema version drift.',
  },
]

const ARCH_EDGES = [
  { from: 'sources', to: 'batch' },
  { from: 'sources', to: 'stream' },
  { from: 'batch',   to: 'offline' },
  { from: 'stream',  to: 'online' },
  { from: 'offline', to: 'pit' },
  { from: 'online',  to: 'servapi' },
  { from: 'pit',     to: 'training' },
  { from: 'servapi', to: 'inference' },
  { from: 'offline', to: 'monitor' },
  { from: 'online',  to: 'monitor' },
]

// Layout: [col, row] — col 0..4, row 0..2
const ARCH_LAYOUT = {
  sources:  [0, 1],
  batch:    [1, 0],
  stream:   [1, 2],
  offline:  [2, 0],
  online:   [2, 2],
  pit:      [3, 0],
  servapi:  [3, 2],
  training: [4, 0],
  inference:[4, 2],
  monitor:  [4, 1],
}

function FeatureStoreArchitecture() {
  const [selected, setSelected] = useState(null)
  const node = ARCH_NODES.find(n => n.id === selected)

  const COL_W = 160
  const ROW_H = 110
  const NODE_W = 148
  const NODE_H = 60
  const PAD = 8
  const SVG_W = 5 * COL_W + PAD * 2
  const SVG_H = 3 * ROW_H + PAD * 2

  function cx(col) { return PAD + col * COL_W + NODE_W / 2 }
  function cy(row) { return PAD + row * ROW_H + NODE_H / 2 }
  function nx(col) { return PAD + col * COL_W }
  function ny(row) { return PAD + row * ROW_H }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow">
          Click any block to explore
        </div>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width={SVG_W}
            height={SVG_H}
            style={{ display: 'block', minWidth: SVG_W }}
          >
            {/* Edges */}
            {ARCH_EDGES.map((e, i) => {
              const [fc, fr] = ARCH_LAYOUT[e.from]
              const [tc, tr] = ARCH_LAYOUT[e.to]
              const x1 = cx(fc) + (tc > fc ? NODE_W / 2 : -NODE_W / 2)
              const y1 = cy(fr)
              const x2 = cx(tc) - (tc > fc ? NODE_W / 2 : -NODE_W / 2)
              const y2 = cy(tr)
              const mx = (x1 + x2) / 2
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
              )
            })}

            {/* Arrow marker */}
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.25)" />
              </marker>
            </defs>

            {/* Nodes */}
            {ARCH_NODES.map(n => {
              const [col, row] = ARCH_LAYOUT[n.id]
              const x = nx(col)
              const y = ny(row)
              const isSelected = selected === n.id
              return (
                <g key={n.id} onClick={() => setSelected(isSelected ? null : n.id)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={x} y={y} width={NODE_W} height={NODE_H} rx="8"
                    fill={isSelected ? n.bg : 'rgba(255,255,255,0.07)'}
                    stroke={isSelected ? n.color : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text x={x + NODE_W / 2} y={y + 22} textAnchor="middle"
                    fill={isSelected ? n.color : 'rgba(255,255,255,0.75)'}
                    fontSize="12" fontFamily="var(--font-sans)" fontWeight="600">
                    {n.label}
                  </text>
                  <text x={x + NODE_W / 2} y={y + 38} textAnchor="middle"
                    fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="var(--font-mono)">
                    {n.sub}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Detail panel */}
      {node ? (
        <div style={{ padding: '20px', borderRadius: '10px', background: node.bg, border: `1px solid ${node.color}30` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: node.color }}>{node.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{node.sub}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              { label: 'What it is', text: node.what, col: 'var(--ink-mid)' },
              { label: 'Key decisions', text: node.decisions, col: 'var(--prime)' },
              { label: 'Failure modes', text: node.failures, col: 'var(--ink-low)' },
              { label: 'Interview signal', text: node.signal, col: 'var(--prime)' },
            ].map(row => (
              <div key={row.label}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: row.col, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{row.label}</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{row.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.15)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Key insight</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
            The offline store and online store must compute features using the same code. The offline store generates training data via point-in-time joins. The online store serves pre-computed values at inference. If they diverge — different logic, different versions, different null handling — you have training-serving skew, and your model silently degrades.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Shared AccordionMCQ ─────────────────────────────────────────────────────
function AccordionMCQ({ scenarios, accentColor = 'var(--prime)', storageKey = null }) {
  const [items, setItems] = useState(() => {
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem('msl_score:' + storageKey))
        if (saved && saved.length === scenarios.length) return saved
      } catch {}
    }
    return scenarios.map(() => ({ open: false, picked: null, revealed: false }))
  })
  const [diffFilter, setDiffFilter] = useState('all')

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem('msl_score:' + storageKey, JSON.stringify(items))
      window.dispatchEvent(new CustomEvent('msl_score_updated'))
    }
  }, [items, storageKey])

  function getDiff(i, total) {
    const t = total / 3
    return i < t ? 'easy' : i < 2 * t ? 'medium' : 'hard'
  }

  function toggle(i) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, open: !it.open } : it))
  }
  function pick(i, opt) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, picked: opt, revealed: true } : it))
  }

  useEffect(() => {
    function handleKey(e) {
      const n = parseInt(e.key)
      if (n >= 1 && n <= 4) {
        const openIdx = items.findIndex(it => it.open && !it.revealed)
        if (openIdx !== -1 && n - 1 < scenarios[openIdx].options.length) pick(openIdx, n - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [items])

  const attempted = items.filter(it => it.revealed).length
  const correct   = items.filter((it, i) => it.revealed && it.picked === scenarios[i].answer).length
  const pct       = attempted === 0 ? 0 : Math.round((correct / attempted) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        {['all','easy','medium','hard'].map(d => (
          <button key={d} onClick={() => setDiffFilter(d)} style={{
            fontSize: '10px', padding: '3px 10px', borderRadius: '999px',
            background: diffFilter === d ? accentColor + '15' : 'transparent',
            border: `1px solid ${diffFilter === d ? accentColor : 'var(--rim)'}`,
            color: diffFilter === d ? accentColor : 'var(--ink-ghost)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {d === 'all' ? 'All' : d === 'easy' ? 'Easy' : d === 'medium' ? 'Med' : 'Hard'}
          </button>
        ))}
        <span style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginLeft: '4px' }}>
          {diffFilter === 'all' ? scenarios.length : scenarios.filter((_,i) => getDiff(i, scenarios.length) === diffFilter).length} scenarios
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, var(--depth) 40%)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 4px 14px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.11)' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{attempted}/{scenarios.length} attempted</span>
        {attempted > 0 && <span style={{ fontSize: '11px', color: pct >= 70 ? 'var(--mint)' : 'var(--ember)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{correct} correct ({pct}%)</span>}
        <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
          <div style={{ width: `${(attempted / scenarios.length) * 100}%`, height: '100%', background: accentColor, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
      </div>

      {scenarios.map((sc, i) => {
        if (diffFilter !== 'all' && getDiff(i, scenarios.length) !== diffFilter) return null
        const it = items[i]
        const isCorrect = it.revealed && it.picked === sc.answer
        return (
          <div key={sc.id} style={{ border: `1px solid ${it.open ? accentColor + '55' : 'rgba(255,255,255,0.15)'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
            <button onClick={() => toggle(i)} style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: it.open ? accentColor + '08' : 'var(--depth)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.15s' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '20px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', textAlign: 'left' }}>{sc.title}</span>
              {it.revealed && <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>{isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--ink-ghost)', transition: 'transform 0.2s', transform: it.open ? 'rotate(90deg)' : 'rotate(0deg)' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 2l4 3-4 3"/></svg></span>
            </button>
            {it.open && (
              <div className="accordion-enter" style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.30)', marginTop: '4px' }}>
                  <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{sc.context}</p>
                </div>
                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', margin: 0 }}>{sc.question}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {sc.options.map((opt, oi) => {
                    const isPicked = it.picked === oi
                    const isAns    = sc.answer === oi
                    const optClass = it.revealed
                      ? (isAns ? ' correct' : (isPicked ? ' wrong' : ''))
                      : (isPicked ? ' selected' : '')
                    return (
                      <button key={oi} disabled={it.revealed} onClick={() => pick(i, oi)}
                        className={`msl-option-btn${optClass}`}
                        style={{ marginBottom: '0px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '14px', paddingTop: '2px' }}>{['A','B','C','D'][oi]}</span>
                        <span style={{ fontSize: '13px', lineHeight: 1.5 }}>{opt}</span>
                        {it.revealed && isAns && <span style={{ marginLeft: 'auto', color: 'var(--mint)', fontSize: '12px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
                      </button>
                    )
                  })}
                </div>
                {it.revealed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="msl-reveal-panel" style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>Diagnosis</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.diagnosis}</p>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>Production fix</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.fix}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Feature Store Time-Travel Bug ───────────────────────────────────────────
const FEATURE_STORE_SCENARIOS = [
  {
    id: 'fst1',
    title: 'Point-in-time join returns future features',
    context: 'A credit risk model is trained using a feature store with point-in-time correct joins. Training data spans 24 months. Each row is a loan application with a label (default/no-default) known 90 days after application. The feature store is queried with `as_of = application_date`. Offline evaluation shows AUC = 0.89 — much higher than the previous model\'s 0.81.',
    question: 'AUC jumped from 0.81 to 0.89 — an 8-point gain on a model that claims point-in-time correct joins. That gain is unusually large. What is the single check that determines whether this lift is real or leakage before you promote it?',
    options: [
      'Verify that AUC > 0.85 on the held-out test set.',
      'Confirm that the feature store\'s point-in-time join is using the application_date, not the label_date. If the join uses any timestamp derived from the outcome window, features computed after default events would be available at training time — this is look-ahead leakage disguised as feature store correctness.',
      'Retrain with a larger dataset to confirm the AUC holds.',
      'Check that the feature store has no missing values for the training period.',
    ],
    answer: 1,
    difficulty: 'mid',
    isFree: false,
    diagnosis: 'Point-in-time correctness is only as good as the timestamp used. If the feature store is accidentally joining on `label_available_date` instead of `application_date`, post-outcome features (e.g., account behaviour after default) are included in training. The 8-point AUC jump is a red flag — legitimate feature improvements rarely produce gains this large without leakage.',
    fix: 'Audit every feature\'s computation timestamp against the event timestamp used in the join. For each feature, verify: (1) the feature was computed using only data available before the application date, and (2) the feature store join key is the application event timestamp, not any derived timestamp. A temporal holdout test — train on months 1–18, evaluate on months 19–24 — should produce similar AUC to the full-period evaluation if no leakage exists.',
  },
  {
    id: 'fst2',
    title: 'Feature store staleness in real-time serving',
    context: 'A real-time fraud model uses features from an online feature store. One feature, `user_transaction_count_24h`, is updated every 5 minutes via a streaming pipeline. The model was trained with this feature reflecting exact transaction counts at prediction time. In production, P&L team reports false negative rate is 40% higher than offline evaluation predicted.',
    question: 'False negative rate is 40% higher than offline predicted. The feature store refreshes `user_transaction_count_24h` every 5 minutes, but card-testing attacks complete in under 2 minutes. Offline training used exact counts at prediction time. What is failing, and why didn\'t offline eval catch it?',
    options: [
      'The model was trained on too little data.',
      'The online feature store has a 5-minute lag — for high-velocity fraud (card testing attacks happen in under 2 minutes), `user_transaction_count_24h` is stale at prediction time. The model trained on exact counts but serves on lagged counts, creating systematic offline-online skew.',
      'False negative rate increases as fraud patterns evolve.',
      'The feature store needs to be replaced with a real-time database.',
    ],
    answer: 1,
    difficulty: 'mid',
    isFree: false,
    diagnosis: 'Training-serving skew from feature staleness: the model learned that `user_transaction_count_24h = 15` is highly predictive of card testing. In production, by the time the fraud detection fires, the stale feature store still shows count = 3 from 5 minutes ago. The fraud signal is invisible to the model in real-time serving.',
    fix: 'For latency-sensitive fraud features: (1) measure actual feature staleness at serving time — log the delta between feature computation time and serving time, (2) if staleness exceeds the fraud attack window, add a direct database lookup at inference time bypassing the feature store cache for high-velocity features, (3) in training, inject realistic staleness by artificially lagging feature values by the observed serving lag — this trains the model on the actual distribution it will see in production.',
  },
  {
    id: 'fst3',
    title: 'Backfill overwrites historical point-in-time features',
    context: 'The data engineering team backfills 6 months of `user_lifetime_value` features using an improved computation method. The backfill writes updated values into the feature store with the original event timestamps. A model that was trained last month and is currently in production now has its offline evaluation invalidated.',
    question: 'The data engineering team just overwrote 6 months of `user_lifetime_value` history in the feature store using a new computation method, preserving original event timestamps. Your currently-deployed model was promoted based on offline eval using the old LTV values. What has actually broken?',
    options: [
      'The model will need to be retrained to use the improved LTV computation.',
      'The backfill invalidates the offline evaluation that justified the model\'s promotion. If the backfilled feature values differ significantly from the originals, the model was selected and tuned based on a feature distribution that no longer exists in the feature store. Online performance predictions are now unreliable.',
      'Backfills have no effect on models already deployed to production.',
      'The model\'s AUC will improve because LTV computation is now more accurate.',
    ],
    answer: 1,
    difficulty: 'senior',
    isFree: false,
    diagnosis: 'Immutability violation: the feature store should be append-only for historical data. Backfilling with updated values using original timestamps breaks the audit trail and invalidates all model evaluations that used those historical features. You can no longer reproduce the exact training or evaluation dataset the model was promoted on.',
    fix: 'Implement feature store immutability for historical records: backfills should write new records with a `backfill_timestamp` alongside the original `event_timestamp`, not overwrite. Models that need the improved LTV computation should be retrained and re-evaluated on the new backfilled data explicitly. The currently deployed model\'s offline evaluation should remain reproducible using the original feature values.',
  },
]

function FeatureStoreTimeTravelBug() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Feature Store</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Feature Store Time-Travel Bug</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          Your feature store claims to return point-in-time correct features. It doesn't. Trace the leakage, the staleness, and the backfill violation — the three ways temporal correctness breaks in production.
        </p>
      </div>
      <AccordionMCQ scenarios={FEATURE_STORE_SCENARIOS} accentColor="var(--prime)" storageKey="featureeng_featstore" />
    </div>
  )
}

// ─── Interaction Features & Leakage ──────────────────────────────────────────
const INTERACTION_LEAKAGE_SCENARIOS = [
  {
    id: 'ifl1',
    title: 'Manual interaction feature introduces label leakage',
    context: 'For a churn prediction model, a feature engineer adds `support_calls_per_dollar_spent` = `support_call_count / revenue_30d`. This interaction feature tests as the #1 feature by importance (SHAP). Model AUC improves from 0.74 to 0.82.',
    question: '`support_calls_per_dollar_spent` just became your #1 SHAP feature and AUC jumped 8 points. A jump that large from a single hand-crafted ratio is a red flag. What specifically in the construction of this feature causes it to partially encode the label you\'re trying to predict?',
    options: [
      'There is no leakage — the feature uses legitimate historical data.',
      'Customers who are about to churn often reduce spending before churning. `revenue_30d` in the denominator captures end-of-tenure behaviour. The interaction amplifies a post-churn signal that would not be available at the time a retention action should be taken.',
      'The feature should be computed as revenue_per_call, not calls_per_revenue.',
      'SHAP importance does not indicate leakage.',
    ],
    answer: 1,
    difficulty: 'junior',
    isFree: true,
    diagnosis: 'Near-future leakage: churning customers often stop spending in the 30 days before cancelling. `revenue_30d` decreases, making `support_calls_per_dollar_spent` spike — but this spike occurs because the customer is already leaving, not because they are at risk. The model is partly learning post-churn behaviour rather than pre-churn risk signals.',
    fix: 'Shift revenue features to earlier windows: use `revenue_60d` or `revenue_90d` to reduce sensitivity to end-of-tenure spend reduction. Alternatively, use `support_call_count` and `revenue_30d` as separate features and let the model learn the interaction — if the interaction is genuine, the model will find it without needing a manually constructed ratio that amplifies the leakage.',
  },
  {
    id: 'ifl2',
    title: 'Let the model learn interactions vs. manual engineering',
    context: 'A senior engineer argues that for a gradient boosting model, manually engineering `age × income` and `tenure × product_count` interactions is unnecessary — tree-based models learn interactions automatically. A junior engineer counters that explicit interaction features always improve performance.',
    question: 'The senior engineer says to drop `age × income` — GBM will learn it automatically. The junior insists explicit interactions always help. Who is right, and in what specific scenario would manually adding this interaction actually matter?',
    options: [
      'Always — explicit interactions reduce the number of splits the model needs, improving training speed and generalisation.',
      'Never — gradient boosting always discovers interactions at least as well as manual engineering.',
      'When the interaction requires a transformation (ratio, product, difference) that splits cannot approximate well, or when the interaction involves features with high cardinality that would require exponentially many splits to capture jointly.',
      'Only when the dataset has fewer than 10,000 rows.',
    ],
    answer: 2,
    difficulty: 'mid',
    isFree: false,
    diagnosis: 'Tree-based models learn piecewise interactions via splits — they can approximate `age × income` through a sequence of splits but may need many splits to do so accurately, especially with continuous features. Ratio and difference features are harder for splits to approximate. Manual engineering is justified when the transformation is non-linear and the tree would need exponential depth to learn it.',
    fix: 'Guideline: for gradient boosting, manually engineer ratio and difference features where the ratio has known business meaning and is hard to approximate via splits. Avoid engineering polynomial products — trees handle these naturally. Always compare: train with and without the engineered feature, evaluate on a held-out set, and keep it only if it provides consistent lift across folds. SHAP analysis should confirm the feature is learning signal, not noise.',
  },
  {
    id: 'ifl3',
    title: 'Target encoding leaks label into cross-validation',
    context: 'A feature engineer applies target encoding to a high-cardinality categorical feature (`merchant_id`, 8,000 unique values) using the full training dataset before cross-validation. Validation AUC appears excellent at 0.91. When the model is deployed, production AUC is 0.76.',
    question: 'Validation AUC is 0.91. Production AUC is 0.76 — a 15-point gap that appeared on day one of deployment. The only unusual thing in preprocessing was target-encoding `merchant_id` (8,000 values) on the full training set before cross-validation. What broke, and why did your CV not catch it?',
    options: [
      'The model overfits to the training data due to high cardinality.',
      'Target encoding computed on the full training set before cross-validation leaks label information into the validation folds — the encoded values for validation-set merchants already incorporate those merchants\' labels. This inflates validation AUC and produces an overoptimistic evaluation.',
      'High-cardinality categoricals should always use one-hot encoding.',
      'The production data has different merchant IDs than the training data.',
    ],
    answer: 1,
    difficulty: 'junior',
    isFree: true,
    diagnosis: 'Target encoding leakage: when you compute `mean(target | merchant_id)` on the full training set, the encoding for any given merchant already incorporates that merchant\'s labels in the validation fold. The model sees a "contaminated" feature during validation — one that implicitly encodes the label. This makes the encoded feature appear extremely predictive during cross-validation but is unavailable in production for new or rare merchants.',
    fix: 'Apply target encoding inside the cross-validation loop: for each fold, compute encodings only from the training portion of that fold, not the full dataset. Use smoothed target encoding (blend fold-level mean with global mean) to handle low-frequency merchants. For production, apply the encoding learned from the full training set — but always evaluate on out-of-fold predictions to get an honest AUC estimate.',
  },
]

function InteractionLeakage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Feature Engineering</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Interaction Features & Leakage</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          When to manually engineer interaction features, when to let the model learn them, and when manually engineering interactions introduces the leakage you were trying to prevent.
        </p>
      </div>
      <AccordionMCQ scenarios={INTERACTION_LEAKAGE_SCENARIOS} accentColor="var(--prime)" storageKey="featureeng_interaction" />
    </div>
  )
}

const MODULES = [
  { id: 'skew',                  label: 'Skew Simulator',              icon: '[S]', component: SkewSimulator, difficulty: 'senior', isFree: false },
  { id: 'store',                 label: 'Feature Store Designer',      icon: '',    component: FeatureStoreDesigner, difficulty: 'junior', isFree: true },
  { id: 'window',                label: 'Window Aggregation',          icon: '⏱',  component: WindowAggregationBuilder, difficulty: 'mid', isFree: false },
  { id: 'leakage',               label: 'Leakage Zoo',                 icon: '',    component: FeatureLeakageZoo, difficulty: 'mid', isFree: false },
  { id: 'serving',               label: 'Online vs Offline',           icon: '',    component: OnlineOfflineDecider, difficulty: 'senior', isFree: false },
  { id: 'arch',                  label: 'Architecture Diagram',        icon: '◈',  component: FeatureStoreArchitecture, difficulty: 'senior', isFree: false },
  { id: 'feature_store_timetavel', label: 'Feature Store Time-Travel', icon: '',    component: FeatureStoreTimeTravelBug, difficulty: 'mid', isFree: false },
  { id: 'interaction_leakage',   label: 'Interaction & Leakage',       icon: '',    component: InteractionLeakage, difficulty: 'junior', isFree: true },
]

// ── Coming Soon ───────────────────────────────────────────────────────────────
// devBrief fields are internal build guidance only — not rendered to users.
const COMING_SOON = []


function ForwardPointer({ label, tab, onNavigate, accent = 'var(--ink-low)' }) {
  return (
    <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
      <button
        onClick={() => onNavigate(tab)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '12px', color: accent, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '12px', color: accent }}>→</span>
      </button>
    </div>
  )
}

export default function FeatureEngTab({ onNavigate, accessCode = null }) {
  const [active, setActive] = useState('skew')
  const accessCodeFromStorage = accessCode ?? localStorage.getItem('msl_access')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? SkewSimulator
  const activeModuleData = MODULES.find(m => m.id === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Feature Engineering</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '580px' }}>
          The gap between a model that works in a notebook and one that works in production is almost always a feature engineering problem.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)} className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>{m.label}
          </button>
        ))}
      </div>
      <div key={active} className="tab-enter">
        {activeModuleData && activeModuleData.isFree === false && accessCodeFromStorage !== 'DAI2026' ? (
          <AccessGate onUnlock={() => localStorage.setItem('msl_access', 'DAI2026')} />
        ) : (
          <ActiveModule />
        )}
      </div>
      {onNavigate && (
        <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>Feature Store Architecture: What the Tutorials Skip</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}
      {onNavigate && <ForwardPointer label="Test this in Combinator" tab="combinator" onNavigate={onNavigate} accent="var(--prime)" />}
      {/* ── Coming Soon ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '48px' }}>
        <div className="eyebrow" style={{ marginBottom: '12px' }}>What's building</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {COMING_SOON.map(m => (
            <div key={m.label} className="card" style={{ padding: '16px', opacity: 0.65, borderLeft: '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--ink-mid)' }}>{m.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'rgba(255,255,255,0.07)', color: 'var(--ink-ghost)', borderRadius: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>soon</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.userBrief}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
