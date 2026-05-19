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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Training-Serving Skew Simulator</h3>
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
              background: bug === b.id ? 'rgba(244,63,94,0.05)' : 'var(--depth)',
              transition: 'all 0.15s',
            }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '10px' }}>
              ⚠ {b.label}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--ink-low)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Training</div>
              <code style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: "'JetBrains Mono',monospace", display: 'block' }}>{b.training}</code>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--ink-low)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Serving</div>
              <code style={{ fontSize: '11px', color: 'var(--rose)', fontFamily: "'JetBrains Mono',monospace", display: 'block' }}>{b.serving}</code>
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
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '16px', color: 'var(--ink-hi)', marginBottom: '12px' }}>⚠ {b.label}</div>
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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Feature Store Designer</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Design an online feature store for a real-time recommendation system. Choose feature type, freshness SLA, and storage backend.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {Object.entries(scenarios).map(([k, v]) => (
          <button key={k} onClick={() => setFeatureType(k)} className="card"
            style={{ textAlign: 'left', cursor: 'pointer', border: `1px solid ${featureType === k ? 'rgba(124,106,247,0.4)' : 'var(--rim)'}`, background: featureType === k ? 'var(--prime-faint)' : 'var(--depth)', transition: 'all 0.15s', padding: '14px' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: featureType === k ? 'var(--prime-hi)' : 'var(--ink-low)', background: featureType === k ? 'rgba(124,106,247,0.12)' : 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '4px', padding: '2px 7px', display: 'inline-block', marginBottom: '10px' }}>{v.icon}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '4px' }}>{v.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)' }}>{v.frequency}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '12px' }}>Example features for this type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {s.examples.map(ex => (
            <code key={ex} style={{ fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--violet)', borderRadius: '5px', padding: '4px 10px' }}>{ex}</code>
          ))}
        </div>
      </div>

      <div>
        <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Online storage backend</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
          {Object.entries(storageOptions).map(([k, v]) => (
            <button key={k} onClick={() => setStorage(k)} className="card"
              style={{ textAlign: 'center', cursor: 'pointer', border: `1px solid ${storage === k ? 'rgba(34,211,238,0.4)' : 'var(--rim)'}`, background: storage === k ? 'rgba(34,211,238,0.06)' : 'linear-gradient(135deg,#0b0d1a,#0e1122)', transition: 'all 0.15s', padding: '12px' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '14px', color: storage === k ? 'var(--sky)' : 'var(--ink-hi)', marginBottom: '4px' }}>{v.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)' }}>P50: {v.latency}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '18px', background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)' }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '15px', color: 'var(--sky)', marginBottom: '10px' }}>
          {st.label} for {s.label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div><div style={{ fontSize: '11px', color: 'var(--mint)', fontWeight: 600, marginBottom: '4px' }}>✓ PROS</div><div style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>{st.pros}</div></div>
          <div><div style={{ fontSize: '11px', color: 'var(--rose)', fontWeight: 600, marginBottom: '4px' }}>✗ CONS</div><div style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>{st.cons}</div></div>
        </div>
        {featureType === 'session' && storage !== 'redis' && (
          <p style={{ fontSize: '13px', color: 'var(--gold)', margin: 0 }}>⚠ For session features with sub-second staleness requirements, Redis is usually the right choice. {st.latency} P50 may violate your serving SLA.</p>
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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Window Aggregation Builder</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Configure a time-window feature and get production-ready SQL and PySpark — plus the gotchas that get teams in trouble.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>
        {/* Entity */}
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Entity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(ENTITIES).map(([k, v]) => (
              <button key={k} onClick={() => { setEntity(k); setMetric(v.metrics[0]) }}
                style={{ textAlign: 'left', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${entity === k ? 'rgba(6,214,160,0.4)' : 'transparent'}`, background: entity === k ? 'rgba(6,214,160,0.08)' : 'transparent', cursor: 'pointer', fontSize: '13px', color: entity === k ? 'var(--mint)' : 'var(--ink-mid)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500 }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric */}
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Metric</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {e.metrics.map(m => (
              <button key={m} onClick={() => setMetric(m)}
                style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${metric === m ? 'rgba(129,140,248,0.4)' : 'transparent'}`, background: metric === m ? 'rgba(129,140,248,0.08)' : 'transparent', cursor: 'pointer', fontSize: '11px', color: metric === m ? 'var(--violet)' : 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Aggregation */}
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Aggregation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(AGGS).map(([k, v]) => (
              <button key={k} onClick={() => setAgg(k)}
                style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${agg === k ? 'rgba(34,211,238,0.4)' : 'transparent'}`, background: agg === k ? 'rgba(34,211,238,0.06)' : 'transparent', cursor: 'pointer', fontSize: '11px', color: agg === k ? 'var(--sky)' : 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>
                {v.label}
                {v.warn && <span style={{ fontSize: '9px', color: 'var(--ember)', marginLeft: '4px' }}>⚠</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Window type + size */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Window type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(WINDOW_TYPES).map(([k, v]) => (
                <button key={k} onClick={() => setWindowType(k)}
                  style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${windowType === k ? 'rgba(245,158,11,0.4)' : 'transparent'}`, background: windowType === k ? 'rgba(245,158,11,0.06)' : 'transparent', cursor: 'pointer', fontSize: '12px', color: windowType === k ? 'var(--gold)' : 'var(--ink-low)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500 }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Window size</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SIZES.map(s => (
                <button key={s} onClick={() => setWindowSize(s)}
                  style={{ padding: '4px 10px', borderRadius: '5px', border: `1px solid ${windowSize === s ? 'rgba(245,158,11,0.4)' : 'var(--rim)'}`, background: windowSize === s ? 'rgba(245,158,11,0.08)' : 'transparent', cursor: 'pointer', fontSize: '12px', color: windowSize === s ? 'var(--gold)' : 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Window type note */}
      <div className="card" style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <span style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600 }}>{wt.label}: </span>
        <span style={{ fontSize: '12px', color: 'var(--ink-mid)' }}>{wt.desc}</span>
      </div>

      {/* Agg warning */}
      {a.warn && (
        <div className="card" style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <span style={{ fontSize: '12px', color: 'var(--ember)', fontWeight: 600 }}>⚠ {a.label}: </span>
          <span style={{ fontSize: '12px', color: 'var(--ink-mid)' }}>{a.warn}</span>
        </div>
      )}

      {/* Feature name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>Feature name:</span>
        <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: 'var(--mint)', background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: '6px', padding: '4px 12px' }}>
          {feat}
        </code>
      </div>

      {/* Code output */}
      <div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '-1px' }}>
          {[['sql', 'SQL'], ['spark', 'PySpark']].map(([t, lbl]) => (
            <button key={t} onClick={() => setCodeTab(t)}
              style={{ padding: '6px 16px', borderRadius: '6px 6px 0 0', border: '1px solid var(--rim)', borderBottom: codeTab === t ? '1px solid var(--depth)' : undefined, background: codeTab === t ? 'var(--depth)' : 'transparent', cursor: 'pointer', fontSize: '12px', color: codeTab === t ? 'var(--ink-hi)' : 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", fontWeight: codeTab === t ? 600 : 400 }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '0 6px 6px 6px', padding: '16px', overflowX: 'auto' }}>
          <pre style={{ margin: 0, fontSize: '12px', color: 'var(--ink-hi)', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {codeTab === 'sql' ? sqlCode : sparkCode}
          </pre>
        </div>
      </div>

      {/* Gotchas */}
      <div>
        <div style={{ fontSize: '13px', color: 'var(--ember)', fontWeight: 600, marginBottom: '10px', fontFamily: "'Space Grotesk',sans-serif" }}>⚠ Gotchas for this configuration</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {GOTCHAS.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 14px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--ember)', flexShrink: 0 }}>→</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{g}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'skew',     label: 'Skew Simulator',        icon: '[S]', component: SkewSimulator },
  { id: 'store',    label: 'Feature Store Designer', icon: '🏪', component: FeatureStoreDesigner },
  { id: 'window',   label: 'Window Aggregation',     icon: '⏱', component: WindowAggregationBuilder },
]

export default function FeatureEngTab() {
  const [active, setActive] = useState('skew')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? SkewSimulator

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>Feature Engineering</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '580px' }}>
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
