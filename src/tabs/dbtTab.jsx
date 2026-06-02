import { useState, useMemo } from 'react'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'
import FidelityBadge from '../components/FidelityBadge.jsx'

// ── Shared pill helper ─────────────────────────────────────────────────────────
function pill(label, active, onClick, activeColor = 'var(--prime)') {
  return (
    <button key={label} onClick={onClick}
      style={{ padding: '6px 13px', borderRadius: '7px', border: `1px solid ${active ? activeColor : 'var(--rim)'}`, background: active ? activeColor + '18' : 'transparent', color: active ? activeColor : 'var(--ink-low)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.14s', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}

function CodeBlock({ children }) {
  return (
    <pre style={{ margin: 0, padding: '14px 16px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--rim)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre' }}>
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
    color: 'var(--prime)',
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
    color: 'var(--prime)',
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
    color: 'var(--prime)',
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
    color: 'var(--prime)',
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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Materialization Oracle</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Set your model constraints. Get ranked materialization recommendations with production gotchas and ready-to-paste config blocks.
        </p>
      </div>

      {/* Parameter selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Query frequency',       items: QUERY_FREQ_OPTIONS, val: freq,      set: setFreq,      color: 'var(--prime)' },
          { label: 'Data volume',           items: VOLUME_OPTIONS,     val: volume,    set: setVolume,    color: 'var(--prime)' },
          { label: 'Freshness requirement', items: FRESHNESS_OPTIONS,  val: freshness, set: setFreshness, color: 'var(--prime)' },
          { label: 'Downstream consumers',  items: CONSUMER_OPTIONS,   val: consumer,  set: setConsumer,  color: 'var(--prime)' },
        ].map(g => (
          <div key={g.label} className="card" style={{ padding: '14px' }}>
            <div className="section-eyebrow" style={{ marginBottom: '10px' }}>{g.label}</div>
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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: i === 0 ? m.color : 'var(--ink-low)', fontWeight: 700, minWidth: '24px' }}>#{i + 1}</span>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: i === 0 ? m.color : 'var(--ink-hi)', flex: 1 }}>materialized='{m.name}'</code>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{m.label}</span>
              {i === 0 && <span style={{ fontSize: '10px', padding: '2px 7px', background: m.color + '18', color: m.color, borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>RECOMMENDED</span>}
              <span style={{ fontSize: '12px', color: 'var(--ink-low)', transition: 'transform 0.15s', transform: expanded === m.id ? 'rotate(90deg)' : 'none' }}>›</span>
            </button>

            {expanded === m.id && (
              <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--rim)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Why it fits your constraints</div>
                  {m.reasons.map((r, j) => (
                    <div key={j} style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>&#10003; {r}</div>
                  ))}
                </div>
                <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Production gotcha</div>
                  <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{m.gotcha}</p>
                </div>
                <div>
                  <div className="section-eyebrow">Config block</div>
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
      'Silent NULL column in output — warehouse coerces missing column to NULL',
      'Test failure only — not_null test fires but the model still runs and loads data',
      'Nothing breaks — dbt resolves column aliases automatically',
    ],
    answer: 0,
    explanation: 'When you explicitly reference `user_id` in your SELECT, the warehouse throws a column-not-found error at runtime (or compile time if dbt can resolve it). However, if your model used `SELECT *`, the new column `customer_id` would appear but `user_id` would silently vanish — no error, just wrong data. Option B is wrong because most warehouses do not coerce missing columns to NULL — they throw a hard error. Option C is wrong because dbt tests run after the model executes successfully; if the model fails with a column error, tests never run.',
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
      'dbt compile error — type mismatch detected at compile time',
      'The DECIMAL-to-INTEGER cast raises a warehouse precision loss warning that appears in dbt logs',
      'Nothing if all values happen to be whole numbers',
    ],
    answer: 0,
    explanation: 'Most warehouses will silently truncate decimal values when cast to INTEGER. You get wrong numbers with no error. This is the most dangerous class of schema drift because everything appears healthy — dbt runs green, dashboards load, the numbers are just wrong. Option B is wrong: dbt does not inspect runtime types at compile time — it compiles SQL templates, not type-checks column semantics. Option C is plausible but wrong: most production warehouses (BigQuery, Snowflake, Redshift) perform the truncation silently without warning. Option D is a true statement — if all values are whole numbers there is no observable impact — which is why this drift can hide for months until the first fractional order total appears.',
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
      'dbt compile error — SELECT order_id is ambiguous when order_id appears on multiple rows',
      'Test failure if you have unique tests on order_id — the test catches duplicate order_ids before data is written',
      'Nothing breaks — COUNT(*) and COUNT(order_id) both count rows, result is still valid',
    ],
    answer: 0,
    explanation: 'This is the most dangerous schema drift. No error, no warning, no test failure — unless you explicitly test for grain. `COUNT(order_id)` now returns (orders x avg_lines_per_order). Every metric downstream is wrong. Dashboards look plausible. The bug can go undetected for weeks. Option B is wrong: SQL has no concept of "ambiguous column count" — it will count all rows regardless of duplicates. Option C is the most dangerous distractor: a `unique` test on order_id WOULD catch that order_id now repeats, firing before data is written. This is why unique tests are worth adding — but many models lack them, making option A the common production outcome. Option D sounds logical but is wrong: "valid" depends entirely on what the metric represents. If the business cares about distinct orders, inflated counts are wrong by definition.',
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
      'Freshness test failure — the max(updated_at) value appears 5 hours stale and triggers the error_after threshold',
      'dbt compile error',
      'Immediate run failure',
    ],
    answer: 0,
    explanation: 'Timezone changes are completely invisible to dbt. The column type has not changed, the column is not missing, values are still timestamps — they are just 5 hours off. Rows near midnight shift to the wrong date partition. Aggregate metrics by date are wrong, especially for the boundary hours. Option B is a genuinely tricky distractor: a freshness check on `loaded_at_field` compares the source max(updated_at) against the current wall-clock time. If the timestamps shifted from UTC to local time (US/Eastern, UTC-5), the max timestamp in the source would appear 5 hours older than it actually is — which could trip a 6-hour error threshold. However, the primary and always-present symptom is the silent partition misalignment, not a freshness alert (which depends on exact threshold settings).',
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
      'Silent data inflation — hard deletes already removed the rows, so the filter on is_deleted = false becomes a no-op and all remaining rows pass',
      'All records returned — filter on missing column is silently ignored by the warehouse',
      'Model runs fine — hard deletes are transparent to SELECT statements',
    ],
    answer: 0,
    explanation: 'When `is_deleted` is dropped and you reference it explicitly, the warehouse throws a column-not-found error at runtime. If you had used a `SELECT *` pattern, the column disappears from your output and the downstream filter on `is_deleted = false` would error. Either way this breaks — but it does break loudly rather than silently inflating data. Option B is the subtle trap: a practitioner might reason "since records are now physically deleted, the soft-delete column is gone and deleted rows are gone too, so the net effect is correct." But the WHERE clause still explicitly references a non-existent column — the query fails before evaluating any rows. Option C is wrong: no major warehouse silently ignores a WHERE reference to a dropped column.',
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

const DANGER_COLORS = { CRITICAL: 'var(--prime)', HIGH: 'var(--prime)', MEDIUM: 'var(--ink-low)', LOW: 'var(--ink-low)' }

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
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Schema Drift Clinic</h3>
        </div>
        <div className="card" style={{ padding: '32px', textAlign: 'center', borderColor: 'var(--prime)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>
            {score >= 7 ? 'Excellent' : score >= 5 ? 'Good' : 'Review'}
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px' }}>
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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Schema Drift Clinic</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          8 real drift scenarios. Upstream changes — what breaks in your dbt model, and how do you fix it?
        </p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {DRIFT_SCENARIOS.map((_, i) => (
            <div key={i} style={{ width: '24px', height: '4px', borderRadius: '2px', background: i < current ? 'var(--prime)' : i === current ? 'var(--ink-low)' : 'var(--rim)' }} />
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{current + 1} / {DRIFT_SCENARIOS.length}</span>
        <span style={{ fontSize: '12px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{score} correct</span>
      </div>

      {/* Scenario card */}
      <div className="card animate-slide-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', margin: 0, lineHeight: 1.4 }}>{scenario.title}</h4>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: DANGER_COLORS[scenario.danger] + '18', color: DANGER_COLORS[scenario.danger], fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>{scenario.danger}</span>
        </div>
        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
          <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Scenario</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{scenario.context}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', color: 'var(--ink-hi)', fontWeight: 600 }}>What happens?</div>
          {scenario.options.map((opt, i) => {
            let bg = 'transparent'
            let border = 'var(--rim)'
            let color = 'var(--ink-mid)'
            if (selected === i && !revealed) { bg = 'rgba(240,165,0,0.15)'; border = 'var(--prime)'; color = 'var(--prime)' }
            if (revealed && i === scenario.answer) { bg = 'rgba(52,211,153,0.15)'; border = 'var(--mint)'; color = 'var(--mint)' }
            if (revealed && selected === i && i !== scenario.answer) { bg = 'rgba(251,113,133,0.15)'; border = 'var(--rose)'; color = 'var(--rose)' }
            return (
              <button key={i} onClick={() => handleSelect(i)}
                style={{ padding: '12px 16px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: 'var(--font-sans)', textAlign: 'left', cursor: revealed ? 'default' : 'pointer', transition: 'all 0.12s', lineHeight: 1.5 }}>
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
            <div style={{ padding: '14px 16px', background: selected === scenario.answer ? 'rgba(52,211,153,0.13)' : 'rgba(251,113,133,0.13)', border: `1px solid ${selected === scenario.answer ? 'rgba(52,211,153,0.25)' : 'rgba(251,113,133,0.25)'}`, borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: selected === scenario.answer ? 'var(--mint)' : 'var(--rose)', marginBottom: '6px' }}>
                {selected === scenario.answer ? 'Correct' : 'Incorrect — here is why'}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{scenario.explanation}</p>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>How to fix it</div>
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
    color: 'var(--prime)',
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
    color: 'var(--prime)',
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
    color: 'var(--prime)',
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
    color: 'var(--prime)',
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
    color: 'var(--prime)',
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
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Incremental Model Decisions</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Answer 4 questions about your data. Get the right incremental pattern with a copy-paste config and production gotchas.
        </p>
      </div>

      {/* Parameter selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Data pattern',                 items: DATA_PATTERN_OPTIONS,  val: pattern,     set: setPattern,     color: 'var(--prime)' },
          { label: 'unique_key available?',        items: UNIQUE_KEY_OPTIONS,    val: uniqueKey,   set: setUniqueKey,   color: 'var(--prime)' },
          { label: 'How often full refresh?',      items: FULL_REFRESH_OPTIONS,  val: refreshFreq, set: setRefreshFreq, color: 'var(--prime)' },
          { label: 'Late data / out-of-order?',    items: LATE_DATA_OPTIONS,     val: lateData,    set: setLateData,    color: 'var(--prime)' },
        ].map(g => (
          <div key={g.label} className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{g.label}</div>
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
            <div style={{ fontSize: '10px', color: rec.color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Recommended pattern</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)' }}>{rec.title}</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-low)', marginTop: '2px' }}>{rec.label}</div>
          </div>
          <span style={{ fontSize: '11px', padding: '3px 10px', background: rec.color + '18', color: rec.color, borderRadius: '5px', fontFamily: 'var(--font-mono)' }}>RECOMMENDED</span>
        </div>

        <div>
          <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Why this pattern</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{rec.explanation}</p>
        </div>

        <div>
          <div className="section-eyebrow">Config</div>
          <CodeBlock>{rec.config}</CodeBlock>
        </div>

        <div>
          <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Production gotchas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rec.gotchas.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--prime)', fontSize: '12px', marginTop: '2px', flexShrink: 0 }}>&#9651;</span>
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
  { icon: '', label: 'Materialization Oracle',      desc: 'Set 4 constraints, get ranked materialization recommendations with gotchas and config snippets.',  status: 'live' },
  { icon: '', label: 'Schema Drift Clinic',         desc: '8 scenarios: upstream breaks — what fails in your dbt model and how to defend against it.',          status: 'live' },
  { icon: '', label: 'Incremental Model Decisions', desc: 'Answer 4 questions about your data pattern, get the right incremental config with gotchas.',         status: 'live' },
  { icon: '', label: 'Model Testing Strategy',      desc: 'What to test, what is overkill, the test pyramid for dbt — not everything needs a generic test.',    status: 'soon', devBrief: { micro: 'AccordionMCQ, 4 scenarios. The dbt test pyramid: generic tests (not_null, unique) vs schema tests vs custom singular tests vs dbt-expectations. When each layer earns its place vs. is overhead. CI speed vs. coverage framing.', macro: 'Testing is the most common interview gap in DE: everyone knows tests exist, few articulate the trade-off. Fills the "why not test everything?" judgment that distinguishes a mid-level from a senior DE.' } },
  { icon: '', label: 'DAG Dependency Patterns',     desc: 'ref() vs source(), when to split models, avoiding monoliths, layer architecture decisions.',         status: 'soon', devBrief: { micro: 'AccordionMCQ, 3 scenarios. ref() vs source() decision, model granularity (when to split), avoiding monolith models, staging → intermediate → mart layer architecture. Each scenario has a real production consequence.', macro: 'Materialization and incremental patterns cover how models run. This covers how they are connected — the structural decisions that determine whether a dbt DAG is maintainable at 500+ models.' } },
  { icon: '', label: 'dbt at Scale',                desc: 'Model selection, defer, slim CI, partial parsing — running dbt efficiently on 1000+ model projects.', status: 'soon', devBrief: { micro: 'Decision-matrix + AccordionMCQ hybrid. Model selection flags, defer pattern for CI cost reduction, slim CI, partial parsing. Scenario: 1000+ model project with 45-min full run — which features cut it to under 10min?', macro: 'Capstone dbt module. Small-project patterns (covered in earlier modules) break at scale. Distinguishes a DE who built a dbt project from one who runs it in production at an org with 40 engineers.' } },
]

// ── Module registry ────────────────────────────────────────────────────────────
const DBT_MODULES = [
  { id: 'materialization', label: 'Materialization Oracle',      icon: '', component: MaterializationOracle },
  { id: 'schema_drift',    label: 'Schema Drift Clinic',         icon: '', component: SchemaDriftClinic },
  { id: 'incremental',     label: 'Incremental Model Decisions', icon: '', component: IncrementalModelDecisions },
]

// ── BookmarkButton ─────────────────────────────────────────────────────────────
function BookmarkButton({ tabId, moduleId, label }) {
  const [saved, setSaved] = useState(() => isBookmarked(tabId, moduleId))
  function handle() {
    toggleBookmark(tabId, moduleId, label)
    setSaved(isBookmarked(tabId, moduleId))
  }
  return (
    <button onClick={handle} style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
      background: saved ? 'var(--prime-bg-light)' : 'transparent',
      border: saved ? '1px solid rgba(240,165,0,0.35)' : '1px solid var(--rim)',
      color: saved ? 'var(--prime)' : 'var(--ink-ghost)',
      fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600,
      transition: 'all 0.15s'
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

// ── Tab shell ──────────────────────────────────────────────────────────────────
export default function DbtTab({ onNavigate }) {
  const [active, setActive] = useState('materialization')
  const ActiveModule = DBT_MODULES.find(m => m.id === active)?.component ?? MaterializationOracle
  const activeModuleData = DBT_MODULES.find(m => m.id === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>dbt &amp; Transformations</h1>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'var(--prime-bg-light)', color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>DE domain</span>
          <FidelityBadge tier="conceptual" />
        </div>
        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '640px' }}>
          Transformation bugs are silent. Wrong materialization costs 10x. Schema drift breaks downstream without warning. This lab teaches you to make the right call before it is a 3am incident.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {DBT_MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${active === m.id ? 'var(--prime)' : 'var(--rim)'}`, background: active === m.id ? 'rgba(240,165,0,0.10)' : 'transparent', color: active === m.id ? 'var(--prime)' : 'var(--ink-low)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
            {m.label}
          </button>
        ))}
      </div>

      {activeModuleData && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <BookmarkButton tabId="dbt" moduleId={active} label={activeModuleData.label} />
        </div>
      )}

      {/* Active module */}
      <div key={active} className="tab-enter"><ActiveModule /></div>

      {/* Roadmap */}
      <div>
        <div className="eyebrow" style={{ marginBottom: '16px' }}>What is being built</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {ROADMAP.map(m => (
            <div key={m.label} className="card" style={{ padding: 'var(--card-pad-secondary)', opacity: m.status === 'live' ? 1 : 0.6, borderLeft: m.status === 'live' ? '2px solid var(--prime)' : '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: m.status === 'live' ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{m.label}</span>
                {m.status === 'live' && <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'var(--prime-bg-light)', color: 'var(--prime)', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>LIVE</span>}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {onNavigate && (
        <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>The Feature Store Time-Travel Bug: How Point-in-Time Joins Break Under Load</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}

    </div>
  )
}
