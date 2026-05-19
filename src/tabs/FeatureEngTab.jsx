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
              {b.label}
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
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '16px', color: 'var(--ink-hi)', marginBottom: '12px' }}>{b.label}</div>
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
            style={{ textAlign: 'left', cursor: 'pointer', border: `1px solid ${featureType === k ? 'rgba(240,165,0,0.35)' : 'var(--rim)'}`, background: featureType === k ? 'var(--prime-faint)' : 'var(--depth)', transition: 'all 0.15s', padding: '14px' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: featureType === k ? 'var(--prime-hi)' : 'var(--ink-low)', background: featureType === k ? 'rgba(240,165,0,0.10)' : 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '4px', padding: '2px 7px', display: 'inline-block', marginBottom: '10px' }}>{v.icon}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '4px' }}>{v.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)' }}>{v.frequency}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '12px' }}>Example features for this type</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {s.examples.map(ex => (
            <code key={ex} style={{ fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.18)', color: 'var(--violet)', borderRadius: '5px', padding: '4px 10px' }}>{ex}</code>
          ))}
        </div>
      </div>

      <div>
        <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Online storage backend</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
          {Object.entries(storageOptions).map(([k, v]) => (
            <button key={k} onClick={() => setStorage(k)} className="card"
              style={{ textAlign: 'center', cursor: 'pointer', border: `1px solid ${storage === k ? 'rgba(34,211,238,0.4)' : 'var(--rim)'}`, background: storage === k ? 'rgba(34,211,238,0.06)' : 'var(--depth)', transition: 'all 0.15s', padding: '12px' }}>
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
          <p style={{ fontSize: '13px', color: 'var(--gold)', margin: 0 }}>Note: For session features with sub-second staleness requirements, Redis is usually the right choice. {st.latency} P50 may violate your serving SLA.</p>
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
                style={{ textAlign: 'left', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${entity === k ? 'rgba(240,165,0,0.35)' : 'transparent'}`, background: entity === k ? 'rgba(240,165,0,0.07)' : 'transparent', cursor: 'pointer', fontSize: '13px', color: entity === k ? 'var(--mint)' : 'var(--ink-mid)', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500 }}>
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
          <span style={{ fontSize: '12px', color: 'var(--ember)', fontWeight: 600 }}>{a.label}: </span>
          <span style={{ fontSize: '12px', color: 'var(--ink-mid)' }}>{a.warn}</span>
        </div>
      )}

      {/* Feature name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>Feature name:</span>
        <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: 'var(--mint)', background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '6px', padding: '4px 12px' }}>
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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Feature Leakage Zoo</h3>
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
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)' }}>{s.type}</span>
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
          <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '15px', color: scenario.color, marginBottom: '16px' }}>
            {scenario.type} — Severity: {scenario.severity}
          </h4>

          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Example</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6, fontStyle: 'italic' }}>{scenario.example}</div>
            </div>

            <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Silent Failure Signature</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{scenario.silentFailure}</div>
            </div>

            {!revealed ? (
              <button onClick={() => setRevealed(true)} className="card"
                style={{ cursor: 'pointer', background: 'rgba(240,165,0,0.08)', border: '1px dashed rgba(240,165,0,0.4)', padding: '12px', textAlign: 'center' }}>
                <span style={{ color: 'var(--prime)', fontWeight: 600, fontSize: '13px' }}>Reveal Detection + Fix →</span>
              </button>
            ) : (
              <>
                <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Detection</div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{scenario.detection}</div>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Fix</div>
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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Online vs Offline Feature Decision</h3>
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
              border: `1px solid ${selected === s.id ? 'var(--mint)' : 'var(--rim)'}`,
              background: selected === s.id ? 'rgba(52,211,153,0.06)' : 'var(--depth)',
              transition: 'all 0.15s',
            }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '10px' }}>{s.label}</div>
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
        <div className="card" style={{ border: '1px solid var(--mint)', background: 'rgba(52,211,153,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)', margin: 0 }}>{scenario.label}</h4>
            <div style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '6px', padding: '4px 10px' }}>
              <span style={{ color: 'var(--mint)', fontWeight: 700, fontSize: '13px' }}>{scenario.verdict}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Why</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{scenario.reasoning}</div>
            </div>
            <div style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Anti-pattern</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{scenario.antipattern}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {scenario.tags.map(t => (
                <span key={t} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: 'var(--violet)', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'skew',     label: 'Skew Simulator',        icon: '[S]', component: SkewSimulator },
  { id: 'store',    label: 'Feature Store Designer', icon: '🏪', component: FeatureStoreDesigner },
  { id: 'window',   label: 'Window Aggregation',     icon: '⏱', component: WindowAggregationBuilder },
  { id: 'leakage',  label: 'Leakage Zoo',            icon: '🔍', component: FeatureLeakageZoo },
  { id: 'serving',  label: 'Online vs Offline',      icon: '⚡', component: OnlineOfflineDecider },
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
          <button key={m.id} onClick={() => setActive(m.id)} className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>{m.label}
          </button>
        ))}
      </div>
      <ActiveModule />
    </div>
  )
}
