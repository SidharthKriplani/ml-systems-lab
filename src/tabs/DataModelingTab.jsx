import { useState, useMemo } from 'react'
import { CheckMark, CrossMark } from '../components/Icons'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'

// ─────────────────────────────────────────────────────────────────────────────
// Module 1: Star vs OBT Judgment
// ─────────────────────────────────────────────────────────────────────────────

const PARAM_OPTIONS = {
  team: {
    label: 'Team size / SQL sophistication',
    choices: [
      { id: 'small',  label: 'Small team, junior analysts (avoid JOINs)' },
      { id: 'mixed',  label: 'Mixed team, some SQL fluency' },
      { id: 'large',  label: 'Large team, senior analysts + engineers' },
    ],
  },
  query: {
    label: 'Primary query pattern',
    choices: [
      { id: 'point',   label: 'Point lookups (single entity, few filters)' },
      { id: 'agg',     label: 'Aggregations across many dimensions' },
      { id: 'adhoc',   label: 'Ad-hoc exploration, unpredictable patterns' },
      { id: 'dash',    label: 'Pre-defined dashboards, fixed queries' },
    ],
  },
  volume: {
    label: 'Data volume',
    choices: [
      { id: 'small',  label: '<10 GB fact data' },
      { id: 'medium', label: '10 GB – 1 TB' },
      { id: 'large',  label: '>1 TB' },
    ],
  },
  update: {
    label: 'Update frequency',
    choices: [
      { id: 'append',  label: 'Append-only / immutable' },
      { id: 'daily',   label: 'Daily full refresh' },
      { id: 'realtime',label: 'Real-time / streaming updates' },
    ],
  },
  audit: {
    label: 'Regulatory / audit requirement',
    choices: [
      { id: 'none',    label: 'None' },
      { id: 'moderate',label: 'Moderate (retain history)' },
      { id: 'strict',  label: 'Strict (full audit trail, point-in-time)' },
    ],
  },
}

const OBT_SCHEMA = `-- orders_obt (one row per order line)
order_id, order_date, customer_id, customer_name,
customer_country, product_id, product_name, category,
unit_price, quantity, total_amount, discount_pct`

const STAR_SCHEMA = `-- fact_order_lines          -- dim_customer
order_line_id               customer_id (PK)
order_id                    customer_name
customer_id  (FK) ─────────► country
product_id   (FK) ──┐        segment
unit_price           │
quantity             │       -- dim_product
                     └──────► product_id (PK)
                              product_name
                              category
                              unit_price`

const HYBRID_SCHEMA = `-- orders_obt  (high-volume, append-only core)
order_id, order_date, customer_id, product_id,
unit_price, quantity, total_amount, discount_pct

-- dim_customer  (slowly-changing, join when needed)
customer_id (PK), customer_name, country, segment

-- dim_product   (low-cardinality, normalised)
product_id (PK), product_name, category`

function deriveRecommendation(params) {
  const { team, query, volume, update, audit } = params

  const obtScore = [
    team === 'small' ? 2 : team === 'mixed' ? 1 : 0,
    (query === 'point' || query === 'dash') ? 2 : query === 'adhoc' ? 1 : 0,
    volume === 'small' ? 2 : volume === 'medium' ? 1 : 0,
    update === 'append' ? 2 : update === 'daily' ? 1 : 0,
    audit === 'none' ? 2 : audit === 'moderate' ? 0 : -2,
  ].reduce((a, b) => a + b, 0)

  const starScore = [
    team === 'large' ? 2 : team === 'mixed' ? 1 : 0,
    query === 'agg' ? 2 : query === 'adhoc' ? 1 : 0,
    volume === 'large' ? 2 : volume === 'medium' ? 1 : 0,
    audit === 'strict' ? 2 : audit === 'moderate' ? 1 : 0,
    update === 'realtime' ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  if (obtScore >= 7 && obtScore > starScore + 2) return 'obt'
  if (starScore >= 7 && starScore > obtScore + 2) return 'star'
  return 'hybrid'
}

const RECS = {
  obt: {
    label: 'One Big Table (OBT)',
    color: 'var(--prime)',
    fits: [
      'Small team avoids costly JOIN debugging',
      'Append-only writes — no update fan-out problem',
      'Dashboard queries are pre-known — denorm is safe',
      'Volume under 1TB — storage cost is manageable',
      'No audit trail needed — no row proliferation from history',
    ],
    breaks: [
      'As dimensions grow, the table widens and cache efficiency drops',
      'Multiple fact granularities (orders + returns) force UNION hacks',
      'Streaming updates cause exponential rewrite amplification',
      'Schema changes ripple — you touch one big surface, not a small dim table',
      'Strict audits require point-in-time versioning you can\'t retrofit cheaply',
    ],
    schema: OBT_SCHEMA,
  },
  star: {
    label: 'Star Schema',
    color: 'var(--prime)',
    fits: [
      'Senior engineers write correct multi-dimension JOINs',
      'Aggregations over large fact tables benefit from narrow fact rows',
      'Audit requirements need clean dim versioning (SCD Type 2 on dims)',
      '>1TB facts — partitioned fact table scans are far cheaper',
      'Different teams query different dim combinations — schema is composable',
    ],
    breaks: [
      'Junior analysts stumble on fan traps when joining multiple facts',
      'Ad-hoc explorers hate having to learn the schema before querying',
      'If dims are rarely reused, the normalisation overhead is pure cost',
      'Real-time updates to dim tables require careful SCD handling',
      'BI tools that auto-join can produce wrong results on many-to-many dims',
    ],
    schema: STAR_SCHEMA,
  },
  hybrid: {
    label: 'Hybrid (Selective Denorm)',
    color: 'var(--prime)',
    fits: [
      'Mixed-sophistication team — OBT for analysts, star for engineers',
      'High-volume core facts stay denormed; low-cardinality dims stay normalised',
      'Moderate audit needs handled via dim-level SCD, not full OBT rewrite',
      'Ad-hoc patterns served by pre-denormed table; complex queries JOIN as needed',
    ],
    breaks: [
      'Two design patterns in one warehouse = onboarding confusion',
      'Which tables are OBT and which are star? Needs strong documentation discipline',
      'Consistency risk: denormed and normalised copies of the same fact can diverge',
      'As team grows, the informal hybrid rule breaks — needs formal governance',
    ],
    schema: HYBRID_SCHEMA,
  },
}

function StarOBT() {
  const defaultParams = { team: null, query: null, volume: null, update: null, audit: null }
  const [params, setParams] = useState(defaultParams)

  const allSet = Object.values(params).every(v => v !== null)
  const rec = useMemo(() => allSet ? deriveRecommendation(params) : null, [params, allSet])
  const result = rec ? RECS[rec] : null

  function pick(key, val) {
    setParams(p => ({ ...p, [key]: p[key] === val ? null : val }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Star vs OBT Judgment</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Set your constraints. Which model breaks first?
        </p>
      </div>

      {/* Parameter pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {Object.entries(PARAM_OPTIONS).map(([key, param]) => (
          <div key={key}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>{param.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {param.choices.map(c => {
                const active = params[key] === c.id
                return (
                  <button key={c.id} onClick={() => pick(key, c.id)}
                    style={{
                      padding: '7px 13px', borderRadius: '20px', fontSize: '12px',
                      fontFamily: 'var(--font-sans)', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                      border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
                      background: active ? 'var(--prime-bg-light)' : 'transparent',
                      color: active ? 'var(--prime)' : 'var(--ink-mid)',
                    }}>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!allSet && (
        <div style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', padding: 'var(--card-pad-primary)', border: '1px dashed var(--rim)', borderRadius: '8px' }}>
          Set all 5 parameters to get a recommendation.
        </div>
      )}

      {/* Recommendation */}
      {result && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px', borderLeft: `3px solid ${result.color}` }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: result.color, marginBottom: '16px' }}>
              Recommendation: {result.label}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>Why this fits</div>
                <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {result.fits.map((f, i) => (
                    <li key={i} style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>Where this breaks</div>
                <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {result.breaks.map((b, i) => (
                    <li key={i} style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--card-pad-secondary)' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '10px' }}>Schema sketch</div>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--rim)' }}>
              {result.schema}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 2: SCD Type Selector
// ─────────────────────────────────────────────────────────────────────────────

const SCD_REFERENCE = [
  { type: 'Type 1', desc: 'Overwrite. No history. Simple.' },
  { type: 'Type 2', desc: 'New row with effective dates. Full history. Complex queries.' },
  { type: 'Type 3', desc: 'Add "previous value" column. Limited history. Simple.' },
  { type: 'Type 4', desc: 'Separate history table. Current in main, history in audit.' },
  { type: 'Type 6', desc: 'Type 1 + 2 + 3 combined. Current value + full history + flag.' },
]

const SCD_OPTIONS = [1, 2, 3, 4, 6]

const SCD_SCENARIOS = [
  {
    id: 'email',
    title: 'Customer email changed',
    desc: 'User updates their email. Marketing team only needs the current email for campaigns. No analytics tie to historical email.',
    answer: 1,
    reasoning: 'Email is contact info, not an analytical dimension. History of email addresses has zero business value here — nobody needs to know what email a customer had when they placed an order in 2022.',
    tradeoff: 'If the business later needs to trace phishing/fraud by email, Type 1 loses that trail permanently. Lock in the decision with a data contract that states email changes are non-auditable.',
  },
  {
    id: 'region',
    title: 'Customer moved to new region',
    desc: 'Sales performance is tracked by region. When a customer places an order, it must be attributed to the region they were in at that time — not their current region.',
    answer: 2,
    reasoning: 'Historical attribution requires point-in-time correctness. If a customer was in EMEA when the $50k deal closed, that revenue belongs to EMEA — even if they moved to APAC later. Type 1 would rewrite history.',
    tradeoff: 'Type 2 doubles (or more) the dim table rows over time. Queries must always filter on is_current = TRUE or use effective date range joins — one forgotten filter gives wrong results silently.',
  },
  {
    id: 'price',
    title: 'Product price change',
    desc: 'Product prices change frequently. Finance runs a weekly report comparing current price vs. previous price — a simple delta, not full history.',
    answer: 3,
    reasoning: 'Only one previous value is needed, not full history. Adding prev_price and price_changed_at columns is far simpler than versioning rows. Type 2 would create thousands of rows for a high-churn catalog.',
    tradeoff: 'Type 3 cannot answer "what was the price 6 months ago?" — only "what was the price before the last change?" If the business ever needs more history, migration is painful.',
  },
  {
    id: 'department',
    title: 'Employee department change',
    desc: 'HR needs full org chart history for headcount reporting, compliance audits, and approval chain reconstruction. Who approved what, from which department, on which date?',
    answer: 2,
    reasoning: 'Compliance + full history = Type 2 only. No other type supports "who was in which department on a specific past date" at scale. Type 4 works but complicates queries by requiring joins to audit table.',
    tradeoff: 'Employee dimensions in large enterprises generate massive Type 2 tables. Partition by effective_date and add surrogate keys. Ensure BI tools use the surrogate, not the natural key.',
  },
  {
    id: 'address_correction',
    title: 'Store address correction',
    desc: 'The data team found a typo — "Streeet" instead of "Street". The address was always the same; it was just entered wrong.',
    answer: 1,
    reasoning: 'This is a correction of an error, not a real-world change. Keeping the typo as history has negative value — it will corrupt any audit that reads historical records. Overwrite and document the correction.',
    tradeoff: 'A blanket Type 1 policy on address fields can mask actual moves. Document clearly: "corrections = Type 1, actual address changes = Type 2." Ambiguity here is the real risk.',
  },
  {
    id: 'subscription',
    title: 'Subscription tier change',
    desc: 'SaaS product. Customers upgrade and downgrade. Revenue team needs cohort analysis by the original signup tier AND current tier. They also flag accounts that have ever been on a premium plan.',
    answer: 6,
    reasoning: 'Three business needs simultaneously: original tier (Type 2 history), current tier (Type 1 current value), has-ever-been-premium flag (Type 3 style). Type 6 is the only SCD designed for this combination.',
    tradeoff: 'Type 6 is the most complex to implement and test. Ingestion pipelines must set current_value, maintain versioned rows, and update the previous_value column atomically. One bug corrupts all three columns at once.',
  },
  {
    id: 'supplier_rating',
    title: 'Supplier rating change',
    desc: 'Procurement tracks quality ratings for 200 suppliers. They need the last 3 ratings for trend analysis — no need for full history, and the table is small.',
    answer: 3,
    reasoning: 'Bounded history (exactly 3 values) on a small lookup table. Type 2 would create up to 600+ rows for 200 suppliers — still small, but the rolling-3-window query is harder. Three columns (current_rating, prev_rating_1, prev_rating_2) is explicit and fast.',
    tradeoff: 'If the business decides "actually we want the last 5 ratings," you need a migration. Type 2 would have given this for free. For small tables, Type 2 is often the safer long-term bet even when the current ask is bounded.',
  },
  {
    id: 'category',
    title: 'Product category reclassification',
    desc: '10,000 products reclassified by merchandising. Analytics needs both old and new category for a 90-day transition window, then only the new category for all future reporting.',
    answer: 2,
    reasoning: 'Time-bounded dual-category reporting suggests Type 2 with an expiry date, or Type 3 if the 90-day window is the only requirement. The key question: will anyone ever ask "what was category X called in 2023?" after the window closes? If yes, Type 2. If no, Type 3 is simpler.',
    tradeoff: 'Type 3 here means adding old_category and reclassification_date columns. Simple. But if reclassifications happen repeatedly, Type 3 columns proliferate. Type 2 with a status column scales better for recurring reclassifications.',
  },
]

function SCDSelector() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [refOpen, setRefOpen] = useState(true)

  const scenario = SCD_SCENARIOS[idx]

  function choose(type) {
    if (revealed) return
    setPicked(type)
    setRevealed(true)
    setScore(s => ({ correct: s.correct + (type === scenario.answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % SCD_SCENARIOS.length)
    setPicked(null)
    setRevealed(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>SCD Type Selector</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
            Business scenario → correct SCD type. Wrong choices have production consequences.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {SCD_SCENARIOS.length}</span>
          {score.total > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(52,211,153,0.10)', color: 'var(--mint)' }}>
              {score.correct}/{score.total} correct
            </span>
          )}
        </div>
      </div>

      {/* Quick reference */}
      <div className="card" style={{ padding: '14px' }}>
        <button onClick={() => setRefOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>SCD Quick Reference</span>
          <span style={{ fontSize: '10px', color: 'var(--ink-low)', marginLeft: 'auto' }}>{refOpen ? '▲ collapse' : '▼ expand'}</span>
        </button>
        {refOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
            {SCD_REFERENCE.map(r => (
              <div key={r.type} style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--prime)', fontWeight: 700, minWidth: '50px' }}>{r.type}</span>
                <span style={{ fontSize: '12px', color: 'var(--ink-mid)' }}>{r.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scenario */}
      <div className="card" style={{ padding: '22px', borderLeft: '3px solid var(--prime)' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '10px' }}>{scenario.title}</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{scenario.desc}</p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {SCD_OPTIONS.map(type => {
          let bg = 'var(--surface)', border = 'var(--rim)', color = 'var(--ink-mid)'
          if (revealed) {
            if (type === scenario.answer) { bg = 'rgba(52,211,153,0.15)'; border = 'var(--mint)'; color = 'var(--mint)' }
            else if (type === picked) { bg = 'rgba(244,63,94,0.15)'; border = 'var(--rose)'; color = 'var(--rose)' }
          } else if (type === picked) {
            bg = 'rgba(240,165,0,0.15)'; border = 'var(--prime)'; color = 'var(--prime)'
          }
          return (
            <button key={type} onClick={() => choose(type)} disabled={revealed}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: `1px solid ${border}`,
                background: bg, color, fontSize: '14px',
                fontFamily: 'var(--font-mono)', fontWeight: 700,
                cursor: revealed ? 'default' : 'pointer', transition: 'all 0.15s',
              }}>
              {revealed && type === scenario.answer && <CheckMark />}
              {revealed && type === picked && type !== scenario.answer && <CrossMark />}
              Type {type}
            </button>
          )
        })}
      </div>

      {/* Reveal */}
      {revealed && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: picked === scenario.answer ? 'var(--mint)' : 'var(--rose)', marginBottom: '10px' }}>
              {picked === scenario.answer ? <><CheckMark /> Correct — </> : <><CrossMark /> Wrong — </>}Type {scenario.answer} is correct
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: '0 0 12px 0' }}>{scenario.reasoning}</p>
            <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.13)', border: '1px solid rgba(240,165,0,0.20)', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Production tradeoff</div>
              <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.tradeoff}</p>
            </div>
            <button className="btn-primary" onClick={next} style={{ alignSelf: 'flex-start', marginTop: '14px' }}>Next scenario →</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Module 3: OLAP Format Showdown
// ─────────────────────────────────────────────────────────────────────────────

const OLAP_PARAMS = {
  engine: {
    label: 'Warehouse / engine',
    choices: [
      { id: 'spark',       label: 'Spark + HDFS/S3' },
      { id: 'databricks',  label: 'Databricks Delta' },
      { id: 'snowflake',   label: 'Snowflake (external tables)' },
      { id: 'trino',       label: 'Trino / Athena' },
      { id: 'bigquery',    label: 'BigQuery' },
    ],
  },
  operation: {
    label: 'Primary operation',
    choices: [
      { id: 'append',    label: 'Bulk append (ETL loads)' },
      { id: 'upsert',    label: 'Upserts / CDC' },
      { id: 'timetravel',label: 'Time travel / audit' },
      { id: 'random',    label: 'Small random updates' },
      { id: 'streaming', label: 'Streaming micro-batch' },
    ],
  },
  scale: {
    label: 'Scale',
    choices: [
      { id: 'small',  label: '<100 GB' },
      { id: 'medium', label: '100 GB – 10 TB' },
      { id: 'large',  label: '>10 TB' },
    ],
  },
  familiarity: {
    label: 'Team familiarity',
    choices: [
      { id: 'hive',      label: 'Hive/Parquet only' },
      { id: 'delta_exp', label: 'Some Delta experience' },
      { id: 'polyglot',  label: 'Polyglot team' },
    ],
  },
}

const FORMATS = [
  {
    id: 'iceberg',
    name: 'Apache Iceberg',
    color: 'var(--prime)',
    tagline: 'ACID, schema evolution, time travel, engine-agnostic',
    bestFor: 'Polyglot environments, Trino/Athena, avoiding vendor lock-in. Works with Spark, Trino, Flink, Dremio.',
    features: { acid: true, timetravel: true, upserts: true, engines: 'Spark, Trino, Flink, Dremio', compaction: 'Periodic' },
    prodNote: 'Metadata layer grows large at scale — use metadata compaction and expireSnapshots() regularly. Trino reads Iceberg natively; Databricks support is solid but Delta is still smoother there.',
    scores: {
      spark: 3, databricks: 2, snowflake: 2, trino: 4, bigquery: 1,
      append: 3, upsert: 3, timetravel: 4, random: 2, streaming: 3,
      small: 2, medium: 3, large: 4,
      hive: 1, delta_exp: 2, polyglot: 4,
    },
  },
  {
    id: 'delta',
    name: 'Delta Lake',
    color: 'var(--prime)',
    tagline: 'ACID, time travel, Z-ordering, native Databricks DML',
    bestFor: 'Databricks shops, Spark-heavy teams, merge-heavy workloads. Z-ordering for skewed queries.',
    features: { acid: true, timetravel: true, upserts: true, engines: 'Spark, Databricks', compaction: 'OPTIMIZE + ZORDER' },
    prodNote: 'OPTIMIZE + ZORDER is powerful but expensive — run off-peak. Delta on non-Databricks (open source) misses Photon acceleration. If you\'re not on Databricks, Iceberg often wins on engine neutrality.',
    scores: {
      spark: 4, databricks: 5, snowflake: 1, trino: 2, bigquery: 1,
      append: 3, upsert: 4, timetravel: 4, random: 3, streaming: 3,
      small: 2, medium: 3, large: 4,
      hive: 1, delta_exp: 4, polyglot: 2,
    },
  },
  {
    id: 'hudi',
    name: 'Apache Hudi',
    color: 'var(--prime)',
    tagline: 'CDC-optimized, copy-on-write vs merge-on-read, record-level upserts',
    bestFor: 'Streaming CDC pipelines, high-frequency upserts, Spark near-real-time. Kafka → Hudi → query is a common pattern.',
    features: { acid: true, timetravel: true, upserts: true, engines: 'Spark, Flink, Hive', compaction: 'Inline / async' },
    prodNote: 'Merge-on-read (MOR) gives fast writes but slow reads — schedule compaction or your query latency will creep. COW is simpler but writes amplify on large tables. Steeper learning curve than Delta.',
    scores: {
      spark: 4, databricks: 3, snowflake: 1, trino: 2, bigquery: 1,
      append: 2, upsert: 5, timetravel: 3, random: 4, streaming: 5,
      small: 2, medium: 3, large: 4,
      hive: 2, delta_exp: 2, polyglot: 3,
    },
  },
  {
    id: 'hive',
    name: 'Hive + Parquet',
    color: 'var(--prime)',
    tagline: 'No ACID, no time travel, no upserts. Append-only. Simple.',
    bestFor: 'Legacy pipelines, read-heavy analytics where data is never updated. Maximum engine compatibility.',
    features: { acid: false, timetravel: false, upserts: false, engines: 'Spark, Hive, Presto, Athena', compaction: 'Manual rewrite' },
    prodNote: 'Without ACID, concurrent writes create corrupt partitions. At >1TB with no compaction, small-file problem degrades Spark job times dramatically. Safe only for pure-append, read-heavy, batch workloads.',
    scores: {
      spark: 3, databricks: 2, snowflake: 2, trino: 3, bigquery: 2,
      append: 5, upsert: 0, timetravel: 0, random: 0, streaming: 1,
      small: 4, medium: 3, large: 1,
      hive: 5, delta_exp: 2, polyglot: 2,
    },
  },
]

function scoreFormat(fmt, params) {
  let total = 0
  for (const [key, val] of Object.entries(params)) {
    if (val && fmt.scores[val] !== undefined) total += fmt.scores[val]
  }
  return total
}

function OLAPShowdown() {
  const defaultParams = { engine: null, operation: null, scale: null, familiarity: null }
  const [params, setParams] = useState(defaultParams)

  const allSet = Object.values(params).every(v => v !== null)

  const ranked = useMemo(() => {
    if (!allSet) return FORMATS
    return [...FORMATS]
      .map(f => ({ ...f, score: scoreFormat(f, params) }))
      .sort((a, b) => b.score - a.score)
  }, [params, allSet])

  function pick(key, val) {
    setParams(p => ({ ...p, [key]: p[key] === val ? null : val }))
  }

  const FEAT_COLS = ['ACID', 'Time travel', 'Upserts', 'Compaction needed']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>OLAP Format Showdown</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Set your constraints — get a ranked format recommendation with production tradeoffs.
        </p>
      </div>

      {/* Parameters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {Object.entries(OLAP_PARAMS).map(([key, param]) => (
          <div key={key}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '8px' }}>{param.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {param.choices.map(c => {
                const active = params[key] === c.id
                return (
                  <button key={c.id} onClick={() => pick(key, c.id)}
                    style={{
                      padding: '7px 13px', borderRadius: '20px', fontSize: '12px',
                      fontFamily: 'var(--font-sans)', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                      border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
                      background: active ? 'var(--prime-bg-light)' : 'transparent',
                      color: active ? 'var(--prime)' : 'var(--ink-mid)',
                    }}>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Ranked cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {ranked.map((fmt, i) => {
          const isTop = allSet && i === 0
          return (
            <div key={fmt.id} className={isTop ? 'card animate-slide-up' : 'card'}
              style={{
                padding: '20px',
                borderLeft: `3px solid ${isTop ? fmt.color : 'var(--rim)'}`,
                opacity: allSet && i > 0 ? Math.max(0.55, 1 - i * 0.15) : 1,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: fmt.color }}>{fmt.name}</span>
                {isTop && (
                  <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '3px', background: `color-mix(in srgb, ${fmt.color} 15%, transparent)`, color: fmt.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>RECOMMENDED</span>
                )}
                {allSet && (
                  <span style={{ marginLeft: 'auto', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)' }}>score: {fmt.score}</span>
                )}
              </div>

              <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: '0 0 12px 0' }}>
                <strong style={{ color: 'var(--ink-hi)' }}>Best for:</strong> {fmt.bestFor}
              </p>

              {/* Feature grid */}
              <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                <table style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', borderCollapse: 'collapse', width: '100%', minWidth: '480px' }}>
                  <thead>
                    <tr>
                      {FEAT_COLS.map(col => (
                        <th key={col} style={{ textAlign: 'left', padding: '4px 10px', color: 'var(--ink-low)', fontWeight: 600, borderBottom: '1px solid var(--rim)', whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                      <th style={{ textAlign: 'left', padding: '4px 10px', color: 'var(--ink-low)', fontWeight: 600, borderBottom: '1px solid var(--rim)' }}>Engine support</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 10px', color: fmt.features.acid ? 'var(--mint)' : 'var(--rose)' }}>{fmt.features.acid ? <><CheckMark /> Yes</> : <><CrossMark /> No</>}</td>
                      <td style={{ padding: '6px 10px', color: fmt.features.timetravel ? 'var(--mint)' : 'var(--rose)' }}>{fmt.features.timetravel ? <><CheckMark /> Yes</> : <><CrossMark /> No</>}</td>
                      <td style={{ padding: '6px 10px', color: fmt.features.upserts ? 'var(--mint)' : 'var(--rose)' }}>{fmt.features.upserts ? <><CheckMark /> Yes</> : <><CrossMark /> No</>}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--ink-mid)' }}>{fmt.features.compaction}</td>
                      <td style={{ padding: '6px 10px', color: 'var(--ink-mid)' }}>{fmt.features.engines}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '10px 12px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '5px' }}>Production note</div>
                <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{fmt.prodNote}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Roadmap
// ─────────────────────────────────────────────────────────────────────────────

const ROADMAP = [
  { icon: '', label: 'Star vs OBT Judgment',    desc: 'Set team + query + volume + audit constraints. Get a reasoned schema recommendation with where it breaks.', status: 'live' },
  { icon: '', label: 'SCD Type Selector',       desc: '8 business scenarios. Pick the correct SCD type. Reveal explains production tradeoffs.', status: 'live' },
  { icon: '', label: 'OLAP Format Showdown',    desc: 'Iceberg vs Delta vs Hudi vs Hive+Parquet. Ranked by your engine, operation, and team constraints.', status: 'live' },
  { icon: '', label: 'Grain Decision Lab',      desc: 'Choosing fact table grain, fan trap and chasm trap diagnosis.', status: 'soon', devBrief: { micro: 'AccordionMCQ, 3 scenarios. Choosing fact grain under conflicting requirements, diagnosing fan traps and chasm traps from an ERD, fixing grain ambiguity before it corrupts aggregations. Focus: production consequence of wrong grain.', macro: 'Grain is the most consequential decision in dimensional modeling and the hardest to fix after the fact. Star vs OBT Oracle covers schema type; this covers internal structure — the judgment that determines whether a star schema is actually correct.' } },
  { icon: '', label: 'Denormalization Pressure',desc: 'When to denorm — query performance vs flexibility tradeoff under load.', status: 'soon', devBrief: { micro: 'Decision-matrix format. Inputs: query pattern (aggregations vs joins vs point lookups), update frequency, team skill, query engine. Output: normalized vs denormalized recommendation with the production tradeoff. ~4 scenarios.', macro: 'Complements OLAP Format Showdown (file format) with the modeling-level version of the same tension. Performance vs flexibility is the core Data Modeling interview question and needs an interactive decision scenario.' } },
  { icon: '',  label: 'Data Vault Patterns',    desc: 'Hub/satellite/link architecture for regulated industries. When raw vault beats star schema.', status: 'soon', devBrief: { micro: 'AccordionMCQ, 3 scenarios. Hub/satellite/link structure, when raw vault beats star schema (audit requirements, late-arriving attributes, enterprise keys), load pattern differences and their operational overhead.', macro: 'Data Vault is niche but standard in regulated industries (finance, healthcare). Adds coverage for candidates at non-FAANG companies where compliance-driven modeling is the norm, not the exception.' } },
]

// ─────────────────────────────────────────────────────────────────────────────
// Modules registry + Tab shell
// ─────────────────────────────────────────────────────────────────────────────

const DM_MODULES = [
  { id: 'star_obt', label: 'Star vs OBT',         icon: '', component: StarOBT },
  { id: 'scd',      label: 'SCD Type Selector',    icon: '', component: SCDSelector },
  { id: 'olap',     label: 'OLAP Format Showdown', icon: '', component: OLAPShowdown },
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

export default function DataModelingTab({ onNavigate }) {
  const [active, setActive] = useState('star_obt')
  const ActiveModule = DM_MODULES.find(m => m.id === active)?.component ?? StarOBT
  const activeModuleData = DM_MODULES.find(m => m.id === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Data Modeling & Storage</h1>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'var(--prime-bg-light)', color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>DE domain</span>
        </div>
        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '640px' }}>
          Star schema or OBT? Which SCD type for this business rule? What breaks when you put 10TB through Hive without compaction? Real decisions, not definitions.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {DM_MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
              fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              border: `1px solid ${active === m.id ? 'var(--prime)' : 'var(--rim)'}`,
              background: active === m.id ? 'rgba(240,165,0,0.10)' : 'transparent',
              color: active === m.id ? 'var(--prime)' : 'var(--ink-low)',
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {activeModuleData && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <BookmarkButton tabId="modeling" moduleId={active} label={activeModuleData.label} />
        </div>
      )}

      {/* Active module */}
      <div key={active} className="tab-enter"><ActiveModule /></div>

      {/* Roadmap */}
      <div>
        <div className="eyebrow" style={{ marginBottom: '16px' }}>What's being built</div>
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
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>The Real ML Stack: From Jupyter Notebook to $10B Infrastructure</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}

    </div>
  )
}
