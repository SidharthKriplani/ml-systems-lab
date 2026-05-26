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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Training-Serving Skew Simulator</h3>
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
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '10px' }}>
              {b.label}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--ink-low)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Training</div>
              <code style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)', display: 'block' }}>{b.training}</code>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--ink-low)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Serving</div>
              <code style={{ fontSize: '11px', color: 'var(--rose)', fontFamily: 'var(--font-mono)', display: 'block' }}>{b.serving}</code>
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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Feature Store Designer</h3>
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
            <code key={ex} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.18)', color: 'var(--violet)', borderRadius: '5px', padding: '4px 10px' }}>{ex}</code>
          ))}
        </div>
      </div>

      <div>
        <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Online storage backend</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
          {Object.entries(storageOptions).map(([k, v]) => (
            <button key={k} onClick={() => setStorage(k)} className="card"
              style={{ textAlign: 'center', cursor: 'pointer', border: `1px solid ${storage === k ? 'rgba(34,211,238,0.4)' : 'var(--rim)'}`, background: storage === k ? 'rgba(34,211,238,0.06)' : 'var(--depth)', transition: 'all 0.15s', padding: '12px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: storage === k ? 'var(--sky)' : 'var(--ink-hi)', marginBottom: '4px' }}>{v.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)' }}>P50: {v.latency}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '18px', background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--sky)', marginBottom: '10px' }}>
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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Window Aggregation Builder</h3>
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
                style={{ textAlign: 'left', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${entity === k ? 'rgba(240,165,0,0.35)' : 'transparent'}`, background: entity === k ? 'rgba(240,165,0,0.07)' : 'transparent', cursor: 'pointer', fontSize: '13px', color: entity === k ? 'var(--mint)' : 'var(--ink-mid)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
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
                style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${metric === m ? 'rgba(129,140,248,0.4)' : 'transparent'}`, background: metric === m ? 'rgba(129,140,248,0.08)' : 'transparent', cursor: 'pointer', fontSize: '11px', color: metric === m ? 'var(--violet)' : 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
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
                style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${agg === k ? 'rgba(34,211,238,0.4)' : 'transparent'}`, background: agg === k ? 'rgba(34,211,238,0.06)' : 'transparent', cursor: 'pointer', fontSize: '11px', color: agg === k ? 'var(--sky)' : 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
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
                  style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${windowType === k ? 'rgba(245,158,11,0.4)' : 'transparent'}`, background: windowType === k ? 'rgba(245,158,11,0.06)' : 'transparent', cursor: 'pointer', fontSize: '12px', color: windowType === k ? 'var(--gold)' : 'var(--ink-low)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
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
                  style={{ padding: '4px 10px', borderRadius: '5px', border: `1px solid ${windowSize === s ? 'rgba(245,158,11,0.4)' : 'var(--rim)'}`, background: windowSize === s ? 'rgba(245,158,11,0.08)' : 'transparent', cursor: 'pointer', fontSize: '12px', color: windowSize === s ? 'var(--gold)' : 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
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
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--mint)', background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '6px', padding: '4px 12px' }}>
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
        <div style={{ fontSize: '13px', color: 'var(--ember)', fontWeight: 600, marginBottom: '10px', fontFamily: 'var(--font-sans)' }}>⚠ Gotchas for this configuration</div>
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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Feature Leakage Zoo</h3>
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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Online vs Offline Feature Decision</h3>
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
        <div className="card" style={{ border: '1px solid var(--mint)', background: 'rgba(52,211,153,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)', margin: 0 }}>{scenario.label}</h4>
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
// ─── Feature Store Architecture Diagram ──────────────────────────────────────
const ARCH_NODES = [
  {
    id: 'sources', label: 'Data Sources', sub: 'DBs · event logs · CDC streams',
    color: 'var(--ink-mid)', bg: 'rgba(255,255,255,0.04)',
    what: 'The raw inputs to your feature pipeline: transactional databases (user profiles, orders), event logs (clicks, page views), and change-data-capture (CDC) streams from upstream systems.',
    decisions: 'Decide the ingestion pattern per source type: database → batch export or CDC (Debezium); events → Kafka; files → S3/GCS drop zone. This choice determines freshness and operational cost.',
    failures: 'Schema changes upstream break downstream pipelines silently. Always register schemas in a schema registry (Confluent, Glue) and version them.',
    signal: 'Senior engineers discuss schema governance and upstream coupling — not just "we read from Kafka."',
  },
  {
    id: 'batch', label: 'Batch ETL', sub: 'Spark · dbt · hourly/daily jobs',
    color: 'var(--ember)', bg: 'rgba(249,115,22,0.08)',
    what: 'Scheduled jobs (Spark, dbt, SQL) that compute aggregated features over historical data windows. Example: "user\'s 30-day purchase count", "listing\'s 90-day average review score."',
    decisions: 'Materialization strategy: full recompute vs incremental. Full is safe and simple; incremental is cheaper but requires a reliable watermark. Partition by entity + date for efficient backfill.',
    failures: 'Recomputing on every run without partitioning scans the full table daily. At scale, this becomes the most expensive job in your org. Incremental updates with proper partitioning are non-negotiable.',
    signal: 'Know the difference between full recompute and incremental strategies. Explain how you\'d design backfill.',
  },
  {
    id: 'stream', label: 'Streaming Ingest', sub: 'Kafka → Flink / Spark Streaming',
    color: 'var(--sky)', bg: 'rgba(34,211,238,0.08)',
    what: 'Real-time event processing pipeline that computes features as events arrive. Example: "session click count in last 10 minutes", "transaction velocity in last 60 seconds."',
    decisions: 'Exactly-once vs at-least-once semantics. Windowing strategy: tumbling (non-overlapping), sliding (overlapping), session (gap-based). Late data handling: watermarks define how long to wait.',
    failures: 'Watermark too tight → late events dropped silently. Watermark too wide → high latency. No exactly-once → duplicate feature updates corrupt aggregates. Test late-data scenarios explicitly.',
    signal: 'Discuss watermarks and late-data handling specifically — this separates engineers who\'ve operated streaming systems from those who\'ve only read about them.',
  },
  {
    id: 'offline', label: 'Offline Store', sub: 'S3 / Hive / BigQuery / Iceberg',
    color: 'var(--mint)', bg: 'rgba(52,211,153,0.08)',
    what: 'Columnar storage of historical feature values, partitioned by entity and timestamp. This is the source of truth for generating training datasets via point-in-time correct joins.',
    decisions: 'File format: Parquet or Iceberg (prefer Iceberg for time-travel). Partitioning: by entity_id + date is most common. Retention: keep enough history for retraining windows (typically 1–2 years).',
    failures: 'Storing only the latest feature value (no history) makes point-in-time correct retrieval impossible. This is the most common feature store implementation mistake.',
    signal: 'Point-in-time correctness is the key concept. If the candidate doesn\'t know what it is, they haven\'t operated a real feature store.',
  },
  {
    id: 'online', label: 'Online Store', sub: 'Redis · Cassandra · DynamoDB · <5ms',
    color: 'var(--mint)', bg: 'rgba(52,211,153,0.08)',
    what: 'Low-latency key-value store holding the most recent pre-computed feature values for each entity. Queried at request time during model inference. Must return values in <5ms P99.',
    decisions: 'Storage system: Redis for <1ms latency + small data; Cassandra/DynamoDB for >10M entities or higher durability requirements. TTL per feature type (session features: 30min; user profile: 24h).',
    failures: 'No TTL on features → stale values served indefinitely. Cache stampede under load when many keys expire simultaneously. Hot partitions for popular entities in Cassandra.',
    signal: 'Discuss TTL design explicitly. Engineers who\'ve built online stores worry about stale features and eviction policies — not just the happy path.',
  },
  {
    id: 'pit', label: 'Point-in-Time Join', sub: 'as-of query · training data gen',
    color: 'var(--violet)', bg: 'rgba(139,92,246,0.08)',
    what: 'For each (entity, label_timestamp) pair in your training dataset, retrieves the feature value that was valid at label_timestamp — not the current value. Prevents future data leakage into training.',
    decisions: 'Implementation: range join on (entity_id, feature_ts <= label_ts ORDER BY feature_ts DESC LIMIT 1). Feast calls this a point-in-time join. Without this, your offline metrics are inflated.',
    failures: 'Using latest-value join for training data is the single most common cause of inflated offline metrics that don\'t hold up in production. The gap can be 5–20% AUC.',
    signal: 'If a candidate can explain point-in-time joins without prompting, they\'ve been burned by this bug before. This is a senior-level concept.',
  },
  {
    id: 'servapi', label: 'Feature Serving API', sub: 'batch lookup · entity keys',
    color: 'var(--violet)', bg: 'rgba(139,92,246,0.08)',
    what: 'The API layer that retrieves pre-computed features from the online store at inference time. Accepts entity keys (user_id, item_id), returns feature vectors. Must be sub-5ms P99.',
    decisions: 'Batch vs single lookup: fetch all features for an entity in one call to minimize round trips. Fallback strategy: what to return if a feature is missing (default value, or flag the request).',
    failures: 'Fallback to recompute on cache miss is a latency timebomb — works fine at low QPS, blows P99 at 10K+ QPS. Design explicit fallback values and test the miss path under load.',
    signal: 'Ask about the cache miss strategy. Engineers who haven\'t operated serving systems give vague answers. The correct answer is "explicit fallback values defined per feature, never recompute at request time."',
  },
  {
    id: 'training', label: 'Model Training', sub: 'offline features → artifacts',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.08)',
    what: 'Consumes the point-in-time correct training dataset from the offline store. Outputs a trained model artifact plus the feature pipeline version used — both must be versioned together.',
    decisions: 'The training pipeline must record which feature pipeline version was used. A model artifact alone is incomplete — you also need the exact feature computation logic that was used to train it.',
    failures: 'Feature pipeline is updated after training but before the model is promoted. Now training and serving compute features differently. Always tie model version to feature pipeline version.',
    signal: 'Mention co-versioning model artifacts with feature pipeline versions. This is the production ML hygiene that separates researchers from engineers.',
  },
  {
    id: 'inference', label: 'Model Serving', sub: 'online features + inference',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.08)',
    what: 'At request time: fetch features from online store, run model inference, return prediction. The model must use the same feature computation logic as was used at training time.',
    decisions: 'Synchronous (real-time) vs pre-compute (batch score + cache). Real-time: fresh features but adds latency. Pre-computed: fast but stale. Right choice depends on feature freshness requirements.',
    failures: 'Training used feature_version=2, serving fetches feature_version=1 from online store because the migration was incomplete. This is silent — no error, just degraded model performance.',
    signal: 'Strong candidates discuss the training-serving feature version alignment and how they\'d validate it before promotion.',
  },
  {
    id: 'monitor', label: 'Feature Monitoring', sub: 'PSI · freshness · null rates',
    color: 'var(--rose)', bg: 'rgba(244,63,94,0.08)',
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
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
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
                    fill={isSelected ? n.bg : 'rgba(255,255,255,0.03)'}
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
              { label: 'Key decisions', text: node.decisions, col: 'var(--sky)' },
              { label: 'Failure modes', text: node.failures, col: 'var(--rose)' },
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
        <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'rgba(240,165,0,0.05)', border: '1px solid rgba(240,165,0,0.15)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Key insight</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
            The offline store and online store must compute features using the same code. The offline store generates training data via point-in-time joins. The online store serves pre-computed values at inference. If they diverge — different logic, different versions, different null handling — you have training-serving skew, and your model silently degrades.
          </p>
        </div>
      )}
    </div>
  )
}

const MODULES = [
  { id: 'skew',     label: 'Skew Simulator',        icon: '[S]', component: SkewSimulator },
  { id: 'store',    label: 'Feature Store Designer', icon: '🏪', component: FeatureStoreDesigner },
  { id: 'window',   label: 'Window Aggregation',     icon: '⏱', component: WindowAggregationBuilder },
  { id: 'leakage',  label: 'Leakage Zoo',            icon: '🔍', component: FeatureLeakageZoo },
  { id: 'serving',  label: 'Online vs Offline',      icon: '⚡', component: OnlineOfflineDecider },
  { id: 'arch',     label: 'Architecture Diagram',   icon: '◈', component: FeatureStoreArchitecture },
]

export default function FeatureEngTab({ onNavigate }) {
  const [active, setActive] = useState('skew')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? SkewSimulator

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>Feature Engineering</h1>
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
