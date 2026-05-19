import { useState, useMemo } from 'react'

// ── Shared pill helper ─────────────────────────────────────────────────────────
function pill(label, active, onClick, activeColor = 'var(--ember)') {
  return (
    <button key={label} onClick={onClick}
      style={{ padding: '6px 13px', borderRadius: '7px', border: `1px solid ${active ? activeColor : 'var(--rim)'}`, background: active ? activeColor + '18' : 'transparent', color: active ? activeColor : 'var(--ink-low)', fontSize: '12px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.14s', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}

function CodeBlock({ children }) {
  return (
    <pre style={{ margin: 0, padding: '14px 16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--rim)', borderRadius: '8px', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre' }}>
      {children}
    </pre>
  )
}

// ── Module 1: Materialization Oracle ──────────────────────────────────────────

const QUERY_FREQ_OPTIONS  = [{ v: 'rarely',   l: 'Rarely (<1x/day)' }, { v: 'daily',    l: 'Daily' }, { v: 'hourly',   l: 'Hourly' }, { v: 'realtime', l: 'Real-time / streaming' }]
const VOLUME_OPTIONS      = [{ v: 'small',    l: 'Small (<1M rows)' }, { v: 'medium',   l: 'Medium (1M–100M)' }, { v: 'large',    l: 'Large (>100M rows)' }]
const FRESHNESS_OPTIONS   = [{ v: 'stale',    l: 'Can be hours stale' }, { v: 'sameday',  l: 'Must be same-day fresh' }, { v: 'nearrt',   l: 'Must be near-real-time' }]
const CONSUMER_OPTIONS    = [{ v: 'bi',       l: 'BI dashboards' }, { v: 'ml',       l: 'ML features' }, { v: 'dbt',      l: 'Other dbt models' }, { v: 'api',      l: 'Application API' }]

const MATERIALIZATIONS = [
  {
    id: 'table',
    name: 'table',
    label: 'Full table refresh',
    why: (f, v, fr, c) => {
      const reasons = []
      if (v === 'small' || v === 'medium') reasons.push('Data volume is manageable for full refresh')
      if (f === 'daily') reasons.push('Daily query frequency justifies computed storage')
      if (c === 'bi') reasons.push('BI tools benefit from pre-computed, fast-reading tables')
      if (fr === 'sameday') reasons.push('Same-day freshness aligns well with scheduled table rebuilds')
      return reasons.length > 0 ? reasons : ['Baseline choice for most medium-scale analytical models']
    },
    gotcha: 'Full scan every run. At >100M rows, this becomes expensive fast — costs blow up and run times extend. Warehouse credits are not free.',
    config: `{{ config(
    materialized='table'
) }}`,
    score: (f, v, fr, c) => {
      let s = 0
      if (v === 'medium') s += 3
      if (v === 'small')  s += 2
      if (v === 'large')  s -= 2
      if (f === 'daily')  s += 2
      if (f === 'hourly') s += 1
      if (c === 'bi')     s += 2
      if (fr === 'sameday') s += 1
      if (fr === 'nearrt')  s -= 1
      return s
    },
    color: 'var(--sky)',
  },
  {
    id: 'view',
    name: 'view',
    label: 'Computed at query time',
    why: (f, v, fr, c) => {
      const reasons = []
      if (f === 'rarely') reasons.push('Low query frequency — no point materialising to storage')
      if (v === 'small')  reasons.push('Small data makes compute-on-read cheap')
      if (c === 'dbt')    reasons.push('Intermediate dbt models that are never queried directly are ideal as views')
      return reasons.length > 0 ? reasons : ['Zero storage overhead, always up to date with source']
    },
    gotcha: 'Every query reruns the SQL from scratch. With complex joins over large tables, downstream BI tools will time out. Never use views for heavy analytical queries.',
    config: `{{ config(
    materialized='view'
) }}`,
    score: (f, v, fr, c) => {
      let s = 0
      if (f === 'rarely')  s += 3
      if (v === 'small')   s += 3
      if (v === 'medium')  s += 1
      if (v === 'large')   s -= 3
      if (c === 'dbt')     s += 2
      if (fr === 'nearrt') s += 1
      return s
    },
    color: 'var(--mint)',
  },
  {
    id: 'incremental',
    name: 'incremental',
    label: 'Append / upsert new rows only',
    why: (f, v, fr, c) => {
      const reasons = []
      if (v === 'large')   reasons.push('Large data volume — full refresh is prohibitively expensive')
      if (f === 'daily' || f === 'hourly') reasons.push('Frequent runs benefit from processing only new data')
      if (c === 'ml')      reasons.push('ML feature tables are often event-stream style — incrementals fit naturally')
      if (fr === 'sameday' || fr === 'nearrt') reasons.push('Frequent incremental runs can achieve near-real-time freshness')
      return reasons.length > 0 ? reasons : ['Cost-efficient for any append-heavy event data']
    },
    gotcha: 'Late-arriving data will be missed unless you use a lookback window. Incremental models also drift from `table` results silently — always schedule periodic full refreshes and add row-count tests.',
    config: `{{ config(
    materialized='incremental',
    unique_key='event_id',
    on_schema_change='fail'
) }}

{% if is_incremental() %}
  WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
{% endif %}`,
    score: (f, v, fr, c) => {
      let s = 0
      if (v === 'large')   s += 4
      if (v === 'medium')  s += 2
      if (f === 'daily')   s += 2
      if (f === 'hourly')  s += 3
      if (c === 'ml')      s += 2
      if (fr === 'sameday') s += 2
      if (fr === 'nearrt')  s += 1
      return s
    },
    color: 'var(--ember)',
  },
  {
    id: 'ephemeral',
    name: 'ephemeral',
    label: 'CTE compiled into downstream queries',
    why: (f, v, fr, c) => {
      const reasons = []
      if (c === 'dbt') reasons.push('Pure intermediate logic used only by other dbt models')
      if (v === 'small') reasons.push('Small data — CTE overhead is acceptable')
      return reasons.length > 0 ? reasons : ['Useful for DRY intermediate transforms with no direct consumers']
    },
    gotcha: 'Ephemeral models are invisible in the warehouse — no table, no view, no lineage in query history. Debugging is painful. If more than 2 downstream models depend on the same ephemeral, refactor to a view or table.',
    config: `{{ config(
    materialized='ephemeral'
) }}`,
    score: (f, v, fr, c) => {
      let s = 0
      if (c === 'dbt')    s += 4
      if (v === 'small')  s += 2
      if (c !== 'dbt')    s -= 2
      if (v === 'large')  s -= 3
      return s
    },
    color: 'var(--violet)',
  },
]

function MaterializationOracle() {
  const [freq,      setFreq]      = useState('daily')
  const [volume,    setVolume]    = useState('medium')
  const [freshness, setFreshness] = useState('sameday')
  const [consumer,  setConsumer]  = useState('bi')
  const [expanded,  setExpanded]  = useState(null)

  const ranked = useMemo(() => {
    return MATERIALIZATIONS
      .map(m => ({ ...m, rank: m.score(freq, volume, freshness, consumer), reasons: m.why(freq, volume, freshness, consumer) }))
      .sort((a, b) => b.rank - a.rank)
  }, [freq, volume, freshness, consumer])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Materialization Oracle</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Set your model constraints. Get ranked materialization recommendations with production gotchas and ready-to-paste config blocks.
        </p>
      </div>

      {/* Parameter selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Query frequency',       items: QUERY_FREQ_OPTIONS, val: freq,      set: setFreq,      color: 'var(--ember)' },
          { label: 'Data volume',           items: VOLUME_OPTIONS,     val: volume,    set: setVolume,    color: 'var(--sky)' },
          { label: 'Freshness requirement', items: FRESHNESS_OPTIONS,  val: freshness, set: setFreshness, color: 'var(--mint)' },
          { label: 'Downstream consumers',  items: CONSUMER_OPTIONS,   val: consumer,  set: setConsumer,  color: 'var(--violet)' },
        ].map(g => (
          <div key={g.label} className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{g.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {g.items.map(item => pill(item.l, g.val === item.v, () => g.set(item.v), g.color))}
            </div>
          </div>
        ))}
      </div>

      {/* Ranked results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="eyebrow">Ranked recommendations</div>
        {ranked.map((m, i) => (
          <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden', border: i === 0 ? `1px solid ${m.color}50` : undefined }}>
            <button onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: i === 0 ? m.color : 'var(--ink-low)', fontWeight: 700, minWidth: '24px' }}>#{i + 1}</span>
              <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '14px', fontWeight: 700, color: i === 0 ? m.color : 'var(--ink-hi)', flex: 1 }}>materialized='{m.name}'</code>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{m.label}</span>
              {i === 0 && <span style={{ fontSize: '10px', padding: '2px 7px', background: m.color + '18', color: m.color, borderRadius: '4px', fontFamily: "'JetBrains Mono',monospace" }}>RECOMMENDED</span>}
              <span style={{ fontSize: '12px', color: 'var(--ink-low)', transition: 'transform 0.15s', transform: expanded === m.id ? 'rotate(90deg)' : 'none' }}>›</span>
            </button>

            {expanded === m.id && (
              <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--rim)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--mint)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Why it fits your constraints</div>
                  {m.reasons.map((r, j) => (
                    <div key={j} style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>&#10003; {r}</div>
                  ))}
                </div>
                <div style={{ padding: '12px 14px', background: 'rgba(251,113,133,0.05)', border: '1px solid rgba(251,113,133,0.2)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--rose)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Production gotcha</div>
                  <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{m.gotcha}</p>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Config block</div>
                  <CodeBlock>{m.config}</CodeBlock>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Module 2: Schema Drift Clinic ─────────────────────────────────────────────

const DRIFT_SCENARIOS = [
  {
    id: 'col_renamed',
    title: 'Column renamed upstream',
    context: 'Upstream table: `user_id` renamed to `customer_id` by the source team. Your dbt model: `SELECT user_id, email, created_at FROM {{ source(...) }}`.',
    options: [
      'dbt compile error — column not found',
      'Silent NULL column in output',
      'Test failure only — model still runs',
      'Nothing breaks',
    ],
    answer: 0,
    explanation: 'When you explicitly reference `user_id` in your SELECT, the warehouse throws a column-not-found error at runtime (or compile time if dbt can resolve it). However, if your model used `SELECT *`, the new column `customer_id` would appear but `user_id` would silently vanish — no error, just wrong data.',
    fix: `-- Always reference columns explicitly. Add not_null tests:
-- schema.yml
columns:
  - name: user_id
    tests:
      - not_null

-- Also add on_schema_change to incremental models:
{{ config(
    materialized='incremental',
    on_schema_change='fail'
) }}`,
    danger: 'HIGH',
  },
  {
    id: 'type_changed',
    title: 'Column type changed',
    context: '`order_total` changed from INTEGER to DECIMAL(18,2) by the source team. Your downstream model casts it to INTEGER for an aggregation.',
    options: [
      'Silent data truncation — decimals silently lost',
      'dbt compile error',
      'Test failure — model still runs',
      'Nothing if all values happen to be whole numbers',
    ],
    answer: 0,
    explanation: 'Most warehouses will silently truncate decimal values when cast to INTEGER. You get wrong numbers with no error. This is the most dangerous class of schema drift because everything appears healthy — dbt runs green, dashboards load, the numbers are just wrong.',
    fix: `-- Cast explicitly and defensively:
SELECT
    CAST(order_total AS DECIMAL(18,2)) AS order_total,
    ...

-- Add range tests in schema.yml:
columns:
  - name: order_total
    tests:
      - dbt_utils.expression_is_true:
          expression: ">= 0"`,
    danger: 'HIGH',
  },
  {
    id: 'notnull_added',
    title: 'New NOT NULL column added',
    context: 'Source adds a required column `region_code` (NOT NULL, no default). Historical rows have NULL from your incremental model perspective. You have `on_schema_change="ignore"`.',
    options: [
      'New column silently missing from your incremental model',
      'Full refresh required — dbt forces it',
      'dbt run fails immediately',
      'Model runs fine, column populated',
    ],
    answer: 0,
    explanation: 'With `on_schema_change="ignore"`, dbt ignores new columns entirely. Your incremental model will keep running against the old schema — the new `region_code` column simply will not exist in your model output. Downstream consumers expecting it get NULL or an error depending on their logic.',
    fix: `{{ config(
    materialized='incremental',
    -- 'append_new_columns' adds new cols with NULL for old rows
    -- 'fail' stops the run so you review manually (preferred)
    on_schema_change='fail'
) }}

-- After reviewing: run with --full-refresh once
-- dbt run --select my_model --full-refresh`,
    danger: 'MEDIUM',
  },
  {
    id: 'col_dropped',
    title: 'Column dropped upstream',
    context: 'Source drops `legacy_status` — a column you reference in your WHERE clause: `WHERE legacy_status != "deleted"`. You notice in your next scheduled run.',
    options: [
      'Runtime SQL error from the warehouse',
      'Compile-time error — dbt catches it before running',
      'Silent NULL — filter ignored',
      'Depends on warehouse',
    ],
    answer: 0,
    explanation: 'dbt does not validate column existence against live warehouse schema during compile (unless you use dbt-osmosis or similar). The error surfaces at runtime when the warehouse executes the SQL and cannot find the column. If the column was only in a WHERE clause, it is a runtime error, not a compile error.',
    fix: `-- Column-level lineage tools (dbt-osmosis, Montecarlo) catch this in CI.
-- Minimum viable protection: add tests for columns you depend on:

-- schema.yml
sources:
  - name: raw
    tables:
      - name: orders
        columns:
          - name: legacy_status
            tests:
              - not_null  # will fail if column disappears`,
    danger: 'HIGH',
  },
  {
    id: 'table_renamed',
    title: 'Source table renamed',
    context: 'Upstream renames `raw.events` to `raw.user_events`. Your model uses `{{ source("raw", "events") }}`.',
    options: [
      'dbt run fails at compile time',
      'Silent empty table returned',
      'Fails at runtime only',
      'Depends on materialization type',
    ],
    answer: 0,
    explanation: 'dbt resolves `source()` references by looking up your `schema.yml` source definitions. If the source definition points to a table that no longer exists, dbt will throw a compile-time error before any SQL is run. This is one case where dbt actually protects you early.',
    fix: `-- Update schema.yml to the new table name:
sources:
  - name: raw
    tables:
      - name: user_events   # was: events

-- Add dbt source freshness tests to catch stale/missing sources:
      freshness:
        warn_after: {count: 12, period: hour}
        error_after: {count: 24, period: hour}`,
    danger: 'LOW',
  },
  {
    id: 'grain_change',
    title: 'Table grain changed',
    context: 'Upstream fact table changes from order-level (1 row per order) to order-line-level (N rows per order). Your model: `SELECT order_id, COUNT(*) AS order_count`.',
    options: [
      'Silent metric inflation — counts multiply by avg line items',
      'dbt compile error',
      'Test failure if you have unique tests on order_id',
      'Nothing breaks',
    ],
    answer: 0,
    explanation: 'This is the most dangerous schema drift. No error, no warning, no test failure — unless you explicitly test for grain. `COUNT(order_id)` now returns (orders x avg_lines_per_order). Every metric downstream is wrong. Dashboards look plausible. The bug can go undetected for weeks.',
    fix: `-- Add row count assertion tests that alert on large changes:
-- packages.yml: add dbt_utils

-- schema.yml
tests:
  - dbt_utils.expression_is_true:
      expression: "COUNT(*) = COUNT(DISTINCT order_id)"
      # if this fails, grain has changed

-- Also: monitor row count change % in CI:
-- warn if row count changes >20% between runs`,
    danger: 'CRITICAL',
  },
  {
    id: 'timezone_change',
    title: 'Timezone change — silent partition drift',
    context: 'Source team switches event timestamps from UTC to local time (US/Eastern, UTC-5) without announcement. Your date partition key is `DATE(event_timestamp)`.',
    options: [
      'Silent partition misalignment — rows land in wrong date buckets',
      'Test failure — freshness checks catch it',
      'dbt compile error',
      'Immediate run failure',
    ],
    answer: 0,
    explanation: 'Timezone changes are completely invisible to dbt. The column type has not changed, the column is not missing, values are still timestamps — they are just 5 hours off. Rows near midnight shift to the wrong date partition. Aggregate metrics by date are wrong, especially for the boundary hours.',
    fix: `-- Store source timestamps as UTC always. Convert at read time:
SELECT
    CONVERT_TIMEZONE('UTC', 'America/New_York', event_timestamp)
        AS event_timestamp_utc,
    ...

-- Add a freshness check that validates max(updated_at) is recent:
-- If timestamps are 5 hours stale-looking, something shifted.
sources:
  - name: raw
    loaded_at_field: updated_at
    freshness:
      error_after: {count: 6, period: hour}`,
    danger: 'HIGH',
  },
  {
    id: 'soft_delete_change',
    title: 'Soft delete pattern changed to hard delete',
    context: 'Source switches from `is_deleted=true` flag to physically deleting records. Your model: `SELECT * FROM {{ source(...) }} WHERE is_deleted = false`.',
    options: [
      'Compile error — is_deleted column no longer exists',
      'All records returned — filter on missing column ignored',
      'Silent data inflation — deleted records reappear',
      'Model runs fine — nothing changes',
    ],
    answer: 0,
    explanation: 'When `is_deleted` is dropped and you reference it explicitly, the warehouse throws a column-not-found error at runtime. If you had used a `SELECT *` pattern, the column disappears from your output and the downstream filter on `is_deleted = false` would error. Either way this breaks — but it does break loudly rather than silently inflating data.',
    fix: `-- Use dbt snapshots for entities that can be deleted.
-- Snapshots apply SCD Type 2 — you keep history even when source rows disappear:

-- snapshots/orders_snapshot.sql
{% snapshot orders_snapshot %}
  {{ config(
      target_schema='snapshots',
      unique_key='order_id',
      strategy='check',
      check_cols=['status', 'updated_at']
  ) }}
  SELECT * FROM {{ source('raw', 'orders') }}
{% endsnapshot %}`,
    danger: 'MEDIUM',
  },
]

const DANGER_COLORS = { CRITICAL: 'var(--rose)', HIGH: '#f97316', MEDIUM: 'var(--gold)', LOW: 'var(--mint)' }

function SchemaDriftClinic() {
  const [current, setCurrent]   = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore]       = useState(0)
  const [done, setDone]         = useState(false)

  const scenario = DRIFT_SCENARIOS[current]

  function handleSelect(idx) {
    if (revealed) return
    setSelected(idx)
  }

  function handleReveal() {
    if (selected === null) return
    if (selected === scenario.answer) setScore(s => s + 1)
    setRevealed(true)
  }

  function handleNext() {
    if (current + 1 >= DRIFT_SCENARIOS.length) {
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  function handleReset() {
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setDone(false)
  }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Schema Drift Clinic</h3>
        </div>
        <div className="card" style={{ padding: '32px', textAlign: 'center', borderColor: 'var(--ember)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>
            {score >= 7 ? '🏆' : score >= 5 ? '🎯' : '📚'}
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px' }}>
            {score} / {DRIFT_SCENARIOS.length}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto 20px' }}>
            {score >= 7
              ? 'Strong awareness of schema drift failure modes. You would catch these in code review.'
              : score >= 5
              ? 'Good foundation. The silent failures (grain change, timezone drift) are the ones that burn teams.'
              : 'These are the bugs that cause 3am pages. Study the silent ones — grain changes and type coercions are especially dangerous.'}
          </p>
          <button className="btn-primary" onClick={handleReset}>Restart clinic</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Schema Drift Clinic</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          8 real drift scenarios. Upstream changes — what breaks in your dbt model, and how do you fix it?
        </p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {DRIFT_SCENARIOS.map((_, i) => (
            <div key={i} style={{ width: '24px', height: '4px', borderRadius: '2px', background: i < current ? 'var(--ember)' : i === current ? 'var(--ink-low)' : 'var(--rim)' }} />
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>{current + 1} / {DRIFT_SCENARIOS.length}</span>
        <span style={{ fontSize: '12px', color: 'var(--ember)', fontFamily: "'JetBrains Mono',monospace", marginLeft: 'auto' }}>{score} correct</span>
      </div>

      {/* Scenario card */}
      <div className="card animate-slide-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', margin: 0, lineHeight: 1.4 }}>{scenario.title}</h4>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: DANGER_COLORS[scenario.danger] + '18', color: DANGER_COLORS[scenario.danger], fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap', flexShrink: 0 }}>{scenario.danger}</span>
        </div>
        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Scenario</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{scenario.context}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', color: 'var(--ink-hi)', fontWeight: 600 }}>What happens?</div>
          {scenario.options.map((opt, i) => {
            let bg = 'transparent'
            let border = 'var(--rim)'
            let color = 'var(--ink-mid)'
            if (selected === i && !revealed) { bg = 'rgba(255,160,50,0.08)'; border = 'var(--ember)'; color = 'var(--ember)' }
            if (revealed && i === scenario.answer) { bg = 'rgba(52,211,153,0.08)'; border = 'var(--mint)'; color = 'var(--mint)' }
            if (revealed && selected === i && i !== scenario.answer) { bg = 'rgba(251,113,133,0.08)'; border = 'var(--rose)'; color = 'var(--rose)' }
            return (
              <button key={i} onClick={() => handleSelect(i)}
                style={{ padding: '12px 16px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: "'Space Grotesk',sans-serif", textAlign: 'left', cursor: revealed ? 'default' : 'pointer', transition: 'all 0.12s', lineHeight: 1.5 }}>
                {opt}
              </button>
            )
          })}
        </div>

        {!revealed && (
          <button className="btn-primary" onClick={handleReveal} disabled={selected === null}
            style={{ alignSelf: 'flex-start', opacity: selected === null ? 0.4 : 1 }}>
            Reveal answer
          </button>
        )}

        {revealed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '14px 16px', background: selected === scenario.answer ? 'rgba(52,211,153,0.06)' : 'rgba(251,113,133,0.06)', border: `1px solid ${selected === scenario.answer ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)'}`, borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: selected === scenario.answer ? 'var(--mint)' : 'var(--rose)', marginBottom: '6px' }}>
                {selected === scenario.answer ? 'Correct' : 'Incorrect — here is why'}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{scenario.explanation}</p>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--sky)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>How to fix it</div>
              <CodeBlock>{scenario.fix}</CodeBlock>
            </div>
            <button className="btn-primary" onClick={handleNext} style={{ alignSelf: 'flex-start' }}>
              {current + 1 >= DRIFT_SCENARIOS.length ? 'See results' : 'Next scenario'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Module 3: Incremental Model Decisions ─────────────────────────────────────

const DATA_PATTERN_OPTIONS  = [{ v: 'append',  l: 'Append-only events' }, { v: 'updates', l: 'Updates to existing rows' }, { v: 'deletes', l: 'Deletes happen' }, { v: 'mixed',   l: 'Mixed (inserts + updates)' }]
const UNIQUE_KEY_OPTIONS    = [{ v: 'yes',     l: 'Yes — stable ID exists' }, { v: 'no',      l: 'No — no reliable unique key' }, { v: 'composite', l: 'Composite key only' }]
const FULL_REFRESH_OPTIONS  = [{ v: 'never',   l: 'Never (source is immutable)' }, { v: 'rarely',  l: 'Rarely (manual trigger)' }, { v: 'monthly',  l: 'Monthly' }, { v: 'frequent', l: 'Frequently' }]
const LATE_DATA_OPTIONS     = [{ v: 'none',    l: 'No — data arrives in order' }, { v: 'day',     l: 'Yes — up to 1 day late' }, { v: 'week',     l: 'Yes — up to 1 week late' }]

const INCREMENTAL_RECOMMENDATIONS = {
  snapshot: {
    title: 'dbt Snapshot (SCD Type 2)',
    label: 'For full historical record',
    color: 'var(--violet)',
    config: `-- snapshots/entity_snapshot.sql
{% snapshot entity_snapshot %}
{{ config(
    target_schema='snapshots',
    unique_key='entity_id',
    strategy='check',
    check_cols=['status', 'updated_at']
) }}
SELECT * FROM {{ source('raw', 'entities') }}
{% endsnapshot %}`,
    explanation: 'When deletes happen or you need to track full history of changes, a dbt snapshot is the right tool — not an incremental model. Snapshots apply SCD Type 2: every version of every row is preserved with valid_from / valid_to timestamps.',
    gotchas: [
      'Snapshots grow indefinitely — plan your retention strategy',
      'Snapshot runs are sequential by default — can be slow for large tables',
      'Querying snapshots requires filtering on dbt_valid_to IS NULL for current records',
      'Cannot snapshot sources that truncate-reload (use the source table, not a snapshot of it)',
    ],
  },
  full_refresh: {
    title: 'materialized=\'table\' (always full refresh)',
    label: 'Correctness over cost',
    color: 'var(--sky)',
    config: `{{ config(
    materialized='table'
) }}

-- No incremental filter needed.
-- Every run is a full rebuild.
-- Simplest possible model.`,
    explanation: 'If you need full refreshes frequently or correctness is more important than cost, a regular table materialization is the right answer. Incremental complexity adds bugs without benefit if you are rebuilding the table most of the time anyway.',
    gotchas: [
      'At large volumes, run times may exceed your schedule window',
      'Full table locks during build can block downstream reads (warehouse dependent)',
      'If source data is mutable, this is your only safe option without a unique_key',
    ],
  },
  simple_append: {
    title: 'Incremental — simple append',
    label: 'Append-only, ordered data',
    color: 'var(--mint)',
    config: `{{ config(
    materialized='incremental'
) }}

SELECT
    event_id,
    user_id,
    event_type,
    created_at
FROM {{ source('raw', 'events') }}

{% if is_incremental() %}
    WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
{% endif %}`,
    explanation: 'The simplest incremental pattern. No unique_key needed — just filter to rows newer than the current max timestamp. Works well for immutable event streams where data arrives in order.',
    gotchas: [
      'Fails silently if source data is late — rows with old timestamps are skipped forever',
      'If the source is ever corrected (backfill), you will miss the corrections',
      'One failed run + a gap in created_at timestamps can cause data loss — add monitoring',
      'MAX(created_at) scan on a large table can be slow — consider partitioned lookback instead',
    ],
  },
  upsert: {
    title: 'Incremental — upsert with unique_key',
    label: 'Handles inserts and updates',
    color: 'var(--ember)',
    config: `{{ config(
    materialized='incremental',
    unique_key='order_id',
    on_schema_change='fail'
) }}

SELECT
    order_id,
    customer_id,
    status,
    order_total,
    updated_at
FROM {{ source('raw', 'orders') }}

{% if is_incremental() %}
    WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}`,
    explanation: 'When rows can be updated, you need a unique_key so dbt can MERGE (upsert) rather than just append. The warehouse will update existing rows with matching keys and insert new ones. Snowflake and BigQuery use MERGE statements; Spark uses Delta Lake merge.',
    gotchas: [
      'MERGE is significantly more expensive than INSERT — expect 2–5x cost vs append-only',
      'Composite unique keys (array of strings) are supported but add query complexity',
      'If updated_at is not reliably maintained, you may miss updates — consider a broader lookback window',
      'on_schema_change=\'fail\' is critical here — upstream column changes will break the MERGE key logic',
    ],
  },
  lookback: {
    title: 'Incremental — lookback window',
    label: 'Late-arriving data protection',
    color: 'var(--gold)',
    config: `{{ config(
    materialized='incremental',
    unique_key='event_id',
    on_schema_change='fail'
) }}

SELECT
    event_id,
    user_id,
    event_type,
    event_date,
    created_at
FROM {{ source('raw', 'events') }}

{% if is_incremental() %}
    WHERE event_date >= (
        SELECT DATEADD(day, -7, MAX(event_date)) FROM {{ this }}
    )
{% endif %}`,
    explanation: 'When data can arrive late (out-of-order events, delayed ETL from source systems), a fixed lookback window ensures late rows are captured. You reprocess the last N days on every run, accepting some redundant work to avoid data gaps. Combined with a unique_key, this prevents duplicate rows.',
    gotchas: [
      'Lookback window must be longer than your worst-case latency — measure it, do not guess',
      'A 7-day lookback on a 500M row table reprocesses 7/365 of your data every run — model the cost',
      'unique_key is mandatory with a lookback — without it you get duplicate rows',
      'If source data is corrected beyond the lookback window, those corrections are permanently missed',
    ],
  },
}

function getIncrementalRecommendation(pattern, uniqueKey, refreshFreq, lateData) {
  if (pattern === 'deletes') return 'snapshot'
  if (pattern === 'updates' && uniqueKey === 'no') return 'full_refresh'
  if (refreshFreq === 'frequent') return 'full_refresh'
  if (pattern === 'append' && lateData === 'none' && uniqueKey !== 'yes') return 'simple_append'
  if (lateData === 'week') return 'lookback'
  if (lateData === 'day') return 'lookback'
  if (pattern === 'updates' || pattern === 'mixed') return 'upsert'
  if (uniqueKey === 'yes' && pattern === 'append') return 'simple_append'
  return 'simple_append'
}

function IncrementalModelDecisions() {
  const [pattern,      setPattern]      = useState('append')
  const [uniqueKey,    setUniqueKey]    = useState('yes')
  const [refreshFreq,  setRefreshFreq]  = useState('rarely')
  const [lateData,     setLateData]     = useState('none')

  const recKey = useMemo(() => getIncrementalRecommendation(pattern, uniqueKey, refreshFreq, lateData), [pattern, uniqueKey, refreshFreq, lateData])
  const rec    = INCREMENTAL_RECOMMENDATIONS[recKey]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Incremental Model Decisions</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Answer 4 questions about your data. Get the right incremental pattern with a copy-paste config and production gotchas.
        </p>
      </div>

      {/* Parameter selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Data pattern',                 items: DATA_PATTERN_OPTIONS,  val: pattern,     set: setPattern,     color: 'var(--ember)' },
          { label: 'unique_key available?',        items: UNIQUE_KEY_OPTIONS,    val: uniqueKey,   set: setUniqueKey,   color: 'var(--sky)' },
          { label: 'How often full refresh?',      items: FULL_REFRESH_OPTIONS,  val: refreshFreq, set: setRefreshFreq, color: 'var(--violet)' },
          { label: 'Late data / out-of-order?',    items: LATE_DATA_OPTIONS,     val: lateData,    set: setLateData,    color: 'var(--gold)' },
        ].map(g => (
          <div key={g.label} className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{g.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {g.items.map(item => pill(item.l, g.val === item.v, () => g.set(item.v), g.color))}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="card animate-slide-up" style={{ padding: '24px', border: `1px solid ${rec.color}40`, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: rec.color, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Recommended pattern</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)' }}>{rec.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-low)', marginTop: '2px' }}>{rec.label}</div>
          </div>
          <span style={{ fontSize: '11px', padding: '3px 10px', background: rec.color + '18', color: rec.color, borderRadius: '5px', fontFamily: "'JetBrains Mono',monospace" }}>RECOMMENDED</span>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Why this pattern</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{rec.explanation}</p>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Config</div>
          <CodeBlock>{rec.config}</CodeBlock>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--rose)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Production gotchas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rec.gotchas.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--rose)', fontSize: '12px', marginTop: '2px', flexShrink: 0 }}>&#9651;</span>
                <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Roadmap ────────────────────────────────────────────────────────────────────
const ROADMAP = [
  { icon: '🧱', label: 'Materialization Oracle',      desc: 'Set 4 constraints, get ranked materialization recommendations with gotchas and config snippets.',  status: 'live' },
  { icon: '🌊', label: 'Schema Drift Clinic',         desc: '8 scenarios: upstream breaks — what fails in your dbt model and how to defend against it.',          status: 'live' },
  { icon: '📈', label: 'Incremental Model Decisions', desc: 'Answer 4 questions about your data pattern, get the right incremental config with gotchas.',         status: 'live' },
  { icon: '🧪', label: 'Model Testing Strategy',      desc: 'What to test, what is overkill, the test pyramid for dbt — not everything needs a generic test.',    status: 'soon' },
  { icon: '🔗', label: 'DAG Dependency Patterns',     desc: 'ref() vs source(), when to split models, avoiding monoliths, layer architecture decisions.',         status: 'soon' },
  { icon: '🚀', label: 'dbt at Scale',                desc: 'Model selection, defer, slim CI, partial parsing — running dbt efficiently on 1000+ model projects.', status: 'soon' },
]

// ── Module registry ────────────────────────────────────────────────────────────
const DBT_MODULES = [
  { id: 'materialization', label: 'Materialization Oracle',      icon: '🧱', component: MaterializationOracle },
  { id: 'schema_drift',    label: 'Schema Drift Clinic',         icon: '🌊', component: SchemaDriftClinic },
  { id: 'incremental',     label: 'Incremental Model Decisions', icon: '📈', component: IncrementalModelDecisions },
]

// ── Tab shell ──────────────────────────────────────────────────────────────────
export default function DbtTab() {
  const [active, setActive] = useState('materialization')
  const ActiveModule = DBT_MODULES.find(m => m.id === active)?.component ?? MaterializationOracle

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>dbt &amp; Transformations</h1>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'rgba(255,160,50,0.12)', color: 'var(--ember)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>DE domain</span>
        </div>
        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '640px' }}>
          Transformation bugs are silent. Wrong materialization costs 10x. Schema drift breaks downstream without warning. This lab teaches you to make the right call before it is a 3am incident.
        </p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {DBT_MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${active === m.id ? 'var(--ember)' : 'var(--rim)'}`, background: active === m.id ? 'rgba(255,160,50,0.10)' : 'transparent', color: active === m.id ? 'var(--ember)' : 'var(--ink-low)', fontSize: '13px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Active module */}
      <ActiveModule />

      {/* Roadmap */}
      <div>
        <div className="eyebrow" style={{ marginBottom: '16px' }}>What is being built</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {ROADMAP.map(m => (
            <div key={m.label} className="card" style={{ padding: '16px', opacity: m.status === 'live' ? 1 : 0.6, borderLeft: m.status === 'live' ? '2px solid var(--ember)' : '2px solid var(--rim)' }}>
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
