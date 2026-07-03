import { useState, useMemo } from 'react'
import TabHeader from '../components/TabHeader.jsx'
import { CheckMark, CrossMark } from '../components/Icons'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'
import FidelityBadge from '../components/FidelityBadge.jsx'

// ── DAG Failure Room ───────────────────────────────────────────────────────────
const DAG_SCENARIOS = [
  {
    id: 'zombie',
    title: 'Zombie tasks stuck in "running" for 6 hours',
    symptoms: [
      'Task state: running  (6h 14m elapsed)',
      'Worker pod restarted 6h ago (OOMKilled)',
      'No heartbeat from task since pod restart',
      'Scheduler shows task_id as active — slot occupied',
    ],
    options: ['dagrun_timeout too long — the run never expires', 'Zombie task from dead worker', 'Heartbeat interval too short — scheduler loses track of fast tasks', 'Scheduler is down'],
    answer: 1,
    diagnosis: 'Zombie task from dead worker',
    explanation: 'When a worker pod is killed mid-task (OOM, eviction, preemption) the task process dies but the metadata DB still shows it as running. No heartbeat is updated, but the scheduler does not automatically clean it up without explicit zombie detection config. The slot is held indefinitely. A missing dagrun_timeout (option A) would let the whole run run forever, but the symptom here is a specific task with no heartbeat — not a timeout issue. A short heartbeat interval (option C) actually helps detect zombies faster, not cause them.',
    fix: 'Enable zombie detection: set [scheduler] job_heartbeat_sec = 5 and scheduler_zombie_task_threshold = 300 in airflow.cfg. Set dagrun_timeout on the DAG to cap max run time. For immediate recovery: use airflow tasks clear <dag_id> -t <task_id> to reset the stuck instance, then re-queue.',
  },
  {
    id: 'trigger_rule',
    title: 'Downstream task runs even after upstream failure',
    symptoms: [
      'upstream_task: FAILED',
      'downstream_task: SUCCESS  ← unexpected',
      'downstream_task trigger_rule = "one_success"',
      'DAG has 3 upstream branches; one succeeded',
    ],
    options: ['Wrong trigger_rule (one_success instead of all_success)', 'Missing depends_on_past', 'Concurrency limit hit', 'Wrong DAG schedule interval'],
    answer: 0,
    diagnosis: 'Wrong trigger_rule — set to one_success',
    explanation: 'Airflow\'s default trigger_rule is all_success, but this task was explicitly overridden to one_success. With 3 upstream branches and 1 succeeding, the condition is met and the downstream task fires despite failures in the other branches. This is a silent misconfiguration that passes code review easily.',
    fix: 'Remove the explicit trigger_rule or set trigger_rule="all_success" explicitly. Audit all tasks in DAGs with fan-in patterns. If partial success is intentional (e.g., best-effort pipelines), use trigger_rule="all_done" with explicit failure checks inside the task.',
  },
  {
    id: 'timezone',
    title: 'DAG scheduled for 9am runs at 2pm in production',
    symptoms: [
      'schedule_interval: "0 9 * * *"',
      'Expected: 09:00 America/New_York',
      'Actual first run: 14:00 America/New_York (13:00 UTC in summer)',
      'airflow.cfg default_timezone not set',
    ],
    options: ['Timezone not set — cron runs in UTC', 'Wrong cron expression', 'Catchup is creating a backlog', 'DST change shifted the schedule'],
    answer: 0,
    diagnosis: 'Timezone defaults to UTC — cron is interpreted as UTC time',
    explanation: 'Airflow interprets cron schedules in UTC by default unless a timezone is explicitly configured. "0 9 * * *" means 09:00 UTC, which is 14:00 EDT (UTC-5 in winter, UTC-4 in summer). The DAG appears to run 5 hours late to users expecting local time.',
    fix: 'Set timezone in the DAG: dag = DAG(..., timezone="America/New_York"). Or globally in airflow.cfg: [core] default_timezone = America/New_York. Use pendulum.timezone for DST-aware schedules. Always document assumed timezone in DAG description.',
  },
  {
    id: 'catchup',
    title: '14 DAG runs fire simultaneously after re-enabling',
    symptoms: [
      'DAG disabled: 2024-01-01 to 2024-01-14',
      'Re-enabled: 2024-01-15',
      'Immediately: 14 DagRun objects created',
      'Database CPU: 100%, connection pool exhausted',
    ],
    options: ['catchup=True not disabled', 'max_active_runs not set — all 14 run simultaneously with no concurrency cap', 'Wrong schedule_interval — daily should be hourly to spread the backfill load', 'Parallelism limit exceeded — worker pool has fewer than 14 slots'],
    answer: 0,
    diagnosis: 'catchup=True — Airflow backfilled all missed runs on re-enable',
    explanation: 'Airflow\'s catchup=True (the default) causes the scheduler to create DagRun objects for every missed interval since the last successful run. 14 days of daily runs = 14 concurrent DagRuns, each spawning its tasks simultaneously. This overwhelms the metadata DB and worker pool. Option B (max_active_runs not set) is a real contributing factor — if max_active_runs were set to 1, the 14 DagRuns would still be created but execute serially. However, the root cause is catchup=True creating them in the first place. Option D (parallelism) is a symptom constraint, not the root cause.',
    fix: 'Before re-enabling: set catchup=False on the DAG to prevent historical backfill. Set max_active_runs=1 as a safety cap. If you do need historical runs, re-enable with catchup=True but set max_active_runs=2 and increase gradually. Update the start_date to the re-enable date if history is not needed.',
  },
  {
    id: 'sensor',
    title: 'ExternalTaskSensor has waited 7 days — upstream never found',
    symptoms: [
      'ExternalTaskSensor: waiting...',
      'external_dag_id: "daily_ingestion"',
      'Upstream DAG renamed to "daily_ingestion_v2" 8 days ago',
      'Sensor poke_interval: 60s, timeout: not set',
    ],
    options: ['Upstream DAG was renamed — external_dag_id mismatch', 'Sensor timeout not set — sensor waits forever even when upstream runs successfully but late', 'Wrong execution_date_fn — sensor is looking at the wrong execution date for the upstream run', 'Upstream DAG paused — sensor cannot find a successful run in a paused DAG'],
    answer: 0,
    diagnosis: 'external_dag_id mismatch — upstream DAG was renamed',
    explanation: 'ExternalTaskSensor polls the metadata DB for a DagRun/TaskInstance matching the exact external_dag_id and external_task_id strings. After the upstream DAG was renamed, no matching run is ever found. Without a timeout, the sensor occupies a worker slot forever. This is a silent dependency break. Option B (no timeout) is a real operational problem that would compound the issue, but it is the symptom, not the cause — even with a timeout the sensor would expire and need re-investigation. Option C (wrong execution_date_fn) is a real failure mode when sensor and upstream DAG run on different schedules, but the symptom here is 7+ days of continuous waiting with zero successful matches, not occasional misses.',
    fix: 'Always parameterise sensor dependencies: use Airflow Variables or Connections for dag_id references so renames don\'t silently break sensors. Set a timeout: ExternalTaskSensor(..., timeout=3600, mode="reschedule"). Use mode="reschedule" (not "poke") to free worker slots during wait. Add a monitoring alert for sensors idle > N hours.',
  },
  {
    id: 'depends_on_past',
    title: 'All future runs for a task are skipped after one failure',
    symptoms: [
      'Task: process_daily_batch',
      'depends_on_past: True',
      '2024-01-10: FAILED (disk full)',
      '2024-01-11 through today: all SKIPPED',
      'No operator error in downstream tasks',
    ],
    options: ['depends_on_past=True blocking all subsequent runs', 'wait_for_downstream=True propagating the skip state from a shared downstream task', 'max_active_tasks=1 creating a sequential queue that starved when the failed run never cleared', 'Wrong retry policy — retries exhausted and no alert triggered'],
    answer: 0,
    diagnosis: 'depends_on_past=True — one failure blocks all future runs indefinitely',
    explanation: 'With depends_on_past=True, each task instance requires the previous day\'s instance for the same task to have succeeded. One failure cascades forward: every subsequent run sees a failed predecessor and skips itself. This can silently halt a pipeline for days if not monitored. Option B (wait_for_downstream) is a related but distinct parameter: it waits for a task\'s downstream tasks to finish before the next dagrun can run the same task. Option C (max_active_tasks=1) would cause queuing, not skipping — tasks would pile up in a queue, not silently skip. Option D (retries exhausted) would cause FAILED states, not SKIPPED states across 7 days.',
    fix: 'Immediate fix: airflow tasks clear <dag_id> -t process_daily_batch --start-date 2024-01-10 to reset the failed instance. Then re-run. Longer term: only use depends_on_past=True when temporal ordering genuinely matters (e.g., rolling aggregations). Add SLA miss alerts to catch silent skip cascades early.',
  },
  {
    id: 'pool_starvation',
    title: '50 tasks queued, 0 running, workers idle',
    symptoms: [
      'Queued tasks: 50',
      'Running tasks: 0',
      'Worker utilisation: 0%',
      'All tasks assigned to pool: "default_pool"',
      'default_pool slots: 5',
      'Active pool occupants: 5 (all stuck in state=queued)',
    ],
    options: ['Pool starvation — all tasks competing for same pool slots', 'Wrong queue name', 'Scheduler not running', 'Executor misconfiguration'],
    answer: 0,
    diagnosis: 'Pool starvation — default_pool slots exhausted',
    explanation: 'Airflow pools limit concurrency by resource bucket. All 50 tasks are in default_pool which has only 5 slots. With 5 slots already occupied (possibly by stuck or long-running tasks), the remaining 45 are permanently queued. Workers are idle because tasks are not being scheduled — they\'re blocked at the pool layer, not the executor layer.',
    fix: 'Increase default_pool slots to match worker capacity (Admin > Pools in the UI, or airflow pools set default_pool <n>). Better: split tasks into domain-specific pools (db_pool, api_pool, ml_pool) with appropriate slot counts per resource type. This prevents one heavy task type from starving fast ones.',
  },
  {
    id: 'xcom_blowout',
    title: 'Task fails with "metadata database write failed" on large datasets',
    symptoms: [
      'Task: transform_daily_data',
      'Error: sqlalchemy.exc.DataError: value too large for column',
      'Fails only when input dataset > 50k rows',
      'Task uses: return df  (XCom auto-push)',
      'XCom max size in MySQL metadata DB: ~64KB',
    ],
    options: ['XCom storing a large DataFrame — exceeds DB column limit', 'Pickle serialization is unstable across Python versions — use JSON-serializable types in XCom', 'SQLAlchemy connection pool exhausted — the metadata DB write failed due to concurrent task pressure', 'Task timeout too short — the DB write for large XCom is timing out'],
    answer: 0,
    diagnosis: 'XCom storing a DataFrame — data exceeds metadata DB column size',
    explanation: 'Airflow\'s XCom is stored in the metadata database (MySQL/Postgres). MySQL TEXT columns cap at ~64KB. Returning a DataFrame from a PythonOperator auto-pushes it to XCom via pickle/JSON. On small datasets this works accidentally. On large datasets it exceeds the column limit and throws a DB write error. XCom is for metadata, not data. Option B (pickle instability) is a real operational concern in Airflow upgrades, but would surface as deserialization errors on the receiving side, not a write failure keyed to dataset size. Option C (connection pool exhaustion) is a plausible cause of DB write failures under load, but the symptom here is size-correlated — it fails only when input > 50k rows.',
    fix: 'Never push DataFrames through XCom. Instead: write the DataFrame to S3/GCS/local path and push only the path string. Use do_xcom_push=False if the return value is not consumed downstream. For Airflow 2.x, configure a custom XCom backend (S3XComBackend) if large object passing is genuinely required.',
  },
]

function DAGFailureRoom() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const scenario = DAG_SCENARIOS[idx]

  function choose(i) {
    if (revealed) return
    setPicked(i)
    setRevealed(true)
    setScore(s => ({ correct: s.correct + (i === scenario.answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % DAG_SCENARIOS.length)
    setPicked(null)
    setRevealed(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>DAG Failure Room</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
            Read the symptoms. Diagnose the root cause before revealing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {DAG_SCENARIOS.length}</span>
          {score.total > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(52,211,153,0.10)', color: 'var(--mint)' }}>
              {score.correct}/{score.total} correct
            </span>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '22px', borderLeft: '3px solid var(--prime)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>

          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)' }}>{scenario.title}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {scenario.symptoms.map((s, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', padding: '4px 10px', background: 'var(--card-tint)', borderRadius: '4px' }}>
              {s}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {scenario.options.map((opt, i) => {
          let bg = 'var(--surface)', border = 'var(--rim)', color = 'var(--ink-mid)'
          if (revealed) {
            if (i === scenario.answer) { bg = 'rgba(52,211,153,0.15)'; border = 'var(--mint)'; color = 'var(--mint)' }
            else if (i === picked) { bg = 'rgba(244,63,94,0.15)'; border = 'var(--rose)'; color = 'var(--rose)' }
          } else if (i === picked) {
            bg = 'rgba(240,165,0,0.15)'; border = 'var(--prime)'; color = 'var(--prime)'
          }
          return (
            <button key={i} onClick={() => choose(i)} disabled={revealed}
              style={{ padding: '12px 14px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {revealed && i === scenario.answer && <CheckMark />}
              {revealed && i === picked && i !== scenario.answer && <CrossMark />}
              {opt}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="card animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: picked === scenario.answer ? 'var(--mint)' : 'var(--rose)' }}>
            {picked === scenario.answer ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg> Correct — ' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Wrong — '}{scenario.diagnosis}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.explanation}</p>
          <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.13)', border: '1px solid rgba(240,165,0,0.20)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Airflow Fix</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.fix}</p>
          </div>
          <button className="btn-primary" onClick={next} style={{ alignSelf: 'flex-start' }}>Next scenario →</button>
        </div>
      )}
    </div>
  )
}

// ── Backfill Decision Lab ──────────────────────────────────────────────────────
const BACKFILL_SCENARIOS = [
  {
    id: 'pipeline_down',
    title: 'Pipeline down 3 days — rolling-window dashboard affected',
    what_happened: 'Daily aggregate pipeline failed silently for 3 days. No alerts fired. The failure was a schema change in the source that caused rows to be silently dropped (no error, just 0 rows written).',
    downstream: 'BI dashboard using last-7-day rolling window. Data team runs ad-hoc queries off the same aggregate table.',
    options: [
      'Backfill all 3 days sequentially (one day at a time)',
      'Backfill all 3 days in parallel',
      'Backfill only the most recent day (rolling window will self-heal)',
      'No backfill needed — dashboard users will not notice',
    ],
    answer: 0,
    diagnosis: 'Backfill all 3 days sequentially',
    explanation: 'The rolling window needs all 3 days to be accurate — missing any day causes the 7-day window to show wrong totals for 3 days after recovery. Parallel backfill risks write conflicts if the aggregate table uses INSERT (non-idempotent) — two runs could double-count or conflict on the same partition. Sequential backfill is slower but safe. Fix the schema issue first, then backfill oldest-to-newest.',
  },
  {
    id: 'source_corrected',
    title: 'Upstream corrected a 6-month-old data bug',
    what_happened: 'Upstream engineering team found and fixed a bug in their event tracking: click events were double-counted for 6 months (Jan–Jun). They have corrected the source tables in place.',
    downstream: 'Your pipeline computed correct aggregates given the (bad) source data. Downstream ML model trained on these aggregates.',
    options: [
      'Full 6-month backfill — reprocess everything',
      'Targeted backfill of affected date partitions only (Jan–Jun)',
      'No backfill — downstream only uses current-month data',
      'Snapshot current state and only correct going forward',
    ],
    answer: 1,
    diagnosis: 'Targeted backfill of affected date partitions only',
    explanation: 'A full 6-month backfill reprocesses correct data (Jul–Dec) unnecessarily — expensive and risky. The bug has a known date range. Identify the exact affected partitions (Jan 1 – Jun 30), backfill only those, and validate output counts. Also: re-trigger ML training after backfill completes so the model trains on corrected data. Document the incident with before/after row counts.',
  },
  {
    id: 'new_column',
    title: 'New enrichment column added — historical records are NULL',
    what_happened: 'You added a geo_region column to the fact_orders table by joining to a lookup table. The pipeline now populates it going forward. Historical records (2+ years) have NULL for this column.',
    downstream: 'Reporting team wants geo_region breakdowns. Their queries span 24 months of history.',
    options: [
      'Backfill all history with NULL explicitly (safe, no-op)',
      'Re-run pipeline against historical source data to populate geo_region',
      'Leave NULLs, document in data dictionary, add NOT NULL constraint going forward',
      'Drop and recreate the table with the new schema from scratch',
    ],
    answer: 1,
    diagnosis: 'Re-run pipeline against historical source — if source is available',
    explanation: 'This is a "it depends" decision: if the historical source data (orders + lookup table) is available and stable, re-running the pipeline against it produces accurate historical geo_region values. If source is unavailable or has changed, backfill with NULL and document. Never drop-recreate a 2-year fact table without a tested restore plan. Key question before deciding: is the lookup table\'s historical state preserved, or does it reflect current mappings?',
  },
  {
    id: 'schema_broke',
    title: '2 days of data dropped silently by a type change',
    what_happened: 'Source changed a field from STRING to INT. Your parser cast it to string, compared against an INT, and the WHERE clause never matched — so 0 rows were written for 2 days with no error.',
    downstream: 'Fraud detection pipeline reads this table hourly. Two days of transactions are missing.',
    options: [
      'Immediately backfill the 2 missing days from source',
      'Investigate whether records were truly lost or just filtered incorrectly',
      'Check dead letter queue and raw landing zone first — data may be recoverable',
      'File an incident and escalate to data governance before touching anything',
    ],
    answer: 2,
    diagnosis: 'Check the dead letter queue and raw landing zone first',
    explanation: 'Before re-pulling from source, check whether your pipeline has a raw landing zone (e.g., S3 raw prefix, Kafka DLQ, or GCS raw bucket). If the data was ingested before the type-cast filter, it may already be in storage — you can reprocess it without re-pulling from the upstream system, which is slower and may not be possible (e.g., source retains only 7 days). Fix the type cast first, then reprocess from raw. Only re-pull from source if raw data is not available.',
  },
  {
    id: 'idempotency',
    title: 'You want to backfill but the pipeline uses INSERT, not UPSERT',
    what_happened: 'The pipeline appends rows with INSERT INTO ... SELECT. There is no deduplication logic. You need to backfill 5 days of data that was incorrectly processed due to a join bug.',
    downstream: 'Downstream runs COUNT(DISTINCT order_id) so duplicates would corrupt metrics.',
    options: [
      'Run backfill as-is — COUNT DISTINCT will handle duplicates',
      'Fix INSERT to UPSERT/MERGE first, then backfill',
      'Truncate affected partitions then run INSERT backfill',
      'Use a MERGE statement at backfill time only, leave pipeline unchanged',
    ],
    answer: 1,
    diagnosis: 'Fix INSERT to UPSERT/MERGE first, then backfill',
    explanation: 'Backfilling a non-idempotent pipeline creates duplicates. Even if COUNT DISTINCT handles some queries, any SUM or AVG over duplicated rows will be wrong. Truncate + INSERT is acceptable if you can guarantee atomic partition replacement and no concurrent reads. But the right fix is making the pipeline idempotent permanently — use MERGE/UPSERT with order_id as the key, then backfill. Never patch idempotency only at backfill time and leave the production pipeline broken.',
  },
  {
    id: 'glue_vs_lambda',
    title: 'ETL tool choice: AWS Glue vs Lambda for a new pipeline',
    what_happened: 'You are designing a new ETL pipeline: read 50M rows/day from S3 (JSON, variable schema), apply 12 transformation rules, write Parquet to a data warehouse. The pipeline must complete within 90 minutes. Budget is a constraint.',
    downstream: 'Downstream: a dbt model that reads the Parquet output, plus an ML feature pipeline that ingests 3 columns from the result.',
    options: [
      'AWS Glue (PySpark) — managed Spark, handles 50M rows, schema-on-read, native Parquet write',
      'AWS Lambda — serverless functions, partition the 50M rows into batches per Lambda invocation',
      'EMR on EC2 — full Spark cluster, maximum control, lowest cost at scale',
      'Lambda + SQS fan-out — event-driven, auto-scales to zero between runs',
    ],
    answer: 0,
    diagnosis: 'AWS Glue (PySpark) — the right fit for volume + schema flexibility + Parquet output',
    explanation: '50M rows/day with variable schema and a 90-minute SLA is exactly Glue\'s target. Glue DynamicFrames handle schema drift without explicit struct definitions; Spark Parquet writer is native and optimised. Lambda has a 15-minute execution limit and 10GB memory cap — batching 50M rows across invocations adds fan-out coordination complexity and risks partial-failure scenarios that are hard to recover from. Lambda + SQS fan-out (Option D) shares the same 15-min limit problem and adds queue management overhead. EMR is more cost-effective at very high scale (500M+ rows/day) but requires cluster management, node sizing, and spot interruption handling — over-engineered for this volume. The downstream dbt + ML feature pipeline integration is also native via Glue catalog + Parquet, requiring no translation layer.',
  },
  {
    id: 'sla_conflict',
    title: 'Full backfill takes 8 hours — ML training runs in 4 hours',
    what_happened: '5 days of data need backfilling. Estimated time: 8 hours. The ML feature pipeline reads the same tables and kicks off in 4 hours to meet a training SLA.',
    downstream: 'ML training job (weekly cadence, must run tonight). BI reporting (next morning). Compliance audit (next week).',
    options: [
      'Delay ML training job — data completeness is more important than SLA',
      'Run partial backfill for ML job\'s date range first, then complete full backfill',
      'Skip backfill entirely and let ML train on stale data this cycle',
      'Run parallel backfill at max concurrency to finish before ML job',
    ],
    answer: 1,
    diagnosis: 'Partial backfill for ML date range first, then full backfill',
    explanation: 'Prioritise by consumer SLA. The ML training job has the tightest window. Identify which date partitions the feature pipeline reads, backfill those first (likely 1–2 days of features), then continue the full backfill for BI/compliance at lower priority. Parallel max-concurrency backfill risks DB contention and may slow everything down. Skipping backfill means training on known-bad data. Delaying ML training may violate a business SLA. The right answer is ordered, prioritised backfill.',
  },
]

function BackfillDecisionLab() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const scenario = BACKFILL_SCENARIOS[idx]

  function choose(i) {
    if (revealed) return
    setPicked(i)
    setRevealed(true)
    setScore(s => ({ correct: s.correct + (i === scenario.answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % BACKFILL_SCENARIOS.length)
    setPicked(null)
    setRevealed(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Backfill Decision Lab</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
            Data is wrong or missing. What is your backfill strategy?
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {BACKFILL_SCENARIOS.length}</span>
          {score.total > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(52,211,153,0.10)', color: 'var(--mint)' }}>
              {score.correct}/{score.total} correct
            </span>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '22px', borderLeft: '3px solid var(--prime)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '18px' }}>⏪</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)' }}>{scenario.title}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '5px' }}>What happened</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{scenario.what_happened}</p>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '5px' }}>Downstream consumers</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{scenario.downstream}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {scenario.options.map((opt, i) => {
          let bg = 'var(--surface)', border = 'var(--rim)', color = 'var(--ink-mid)'
          if (revealed) {
            if (i === scenario.answer) { bg = 'rgba(52,211,153,0.15)'; border = 'var(--mint)'; color = 'var(--mint)' }
            else if (i === picked) { bg = 'rgba(244,63,94,0.15)'; border = 'var(--rose)'; color = 'var(--rose)' }
          } else if (i === picked) {
            bg = 'rgba(240,165,0,0.15)'; border = 'var(--prime)'; color = 'var(--prime)'
          }
          return (
            <button key={i} onClick={() => choose(i)} disabled={revealed}
              style={{ padding: '13px 16px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {revealed && i === scenario.answer && <CheckMark />}
              {revealed && i === picked && i !== scenario.answer && <CrossMark />}
              {opt}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="card animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: picked === scenario.answer ? 'var(--mint)' : 'var(--rose)' }}>
            {picked === scenario.answer ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg> Correct — ' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Wrong — '}{scenario.diagnosis}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.explanation}</p>
          <button className="btn-primary" onClick={next} style={{ alignSelf: 'flex-start' }}>Next scenario →</button>
        </div>
      )}
    </div>
  )
}

// ── Late Data Handler ─────────────────────────────────────────────────────────
const ARRIVAL_PATTERNS = [
  { id: 'early', label: 'Early', desc: '99% arrives within 1h' },
  { id: 'moderate', label: 'Moderate', desc: '99% arrives within 6h' },
  { id: 'late', label: 'Late', desc: '99% arrives within 24h' },
  { id: 'variable', label: 'Highly variable', desc: 'Long tail — days late possible' },
]

const REPROCESS_TOLERANCES = [
  { id: 'none', label: 'None', desc: 'Reprocess is expensive or impossible' },
  { id: 'low', label: 'Low', desc: 'Can reprocess occasionally' },
  { id: 'high', label: 'High', desc: 'Can reprocess freely' },
]

const DOWNSTREAM_TYPES = [
  { id: 'realtime', label: 'Real-time dashboard' },
  { id: 'daily', label: 'Daily reports' },
  { id: 'ml', label: 'ML training (weekly)' },
  { id: 'compliance', label: 'Compliance / audit' },
]

const STRATEGIES = {
  fixed_window: {
    name: 'Fixed window, no late handling',
    icon: '',
    color: 'var(--prime)',
    why: (params) => `Your data arrives predictably early and you ${params.reprocess === 'high' ? 'can' : 'cannot'} reprocess. A fixed window closes at a defined time and moves on. Simple to reason about and operate.`,
    risks: 'Silent incompleteness if data is occasionally late. No automatic correction. Works only when arrival pattern is truly reliable.',
    config: `# DAG config\nschedule_interval = "@daily"\ncatchup = False\n\n# Task\ndef process(execution_date, **ctx):\n    window_start = execution_date\n    window_end   = execution_date + timedelta(days=1)\n    # data outside this window is ignored`,
  },
  watermark: {
    name: 'Watermark + allowed lateness',
    icon: '',
    color: 'var(--prime)',
    why: (params) => `Data arrives ${params.arrival} with moderate lateness. Watermarks let you emit results as data arrives while still correcting for late events up to a defined threshold.`,
    risks: 'Requires streaming infrastructure (Spark Structured Streaming or Flink). Window results are emitted multiple times (retract-correct pattern). Downstream must handle updates.',
    config: `# Spark Structured Streaming\ndf.withWatermark("event_time", "6 hours") \\\n  .groupBy(\n    window("event_time", "1 hour"),\n    "user_id"\n  ) \\\n  .agg(count("*").alias("events")) \\\n  .writeStream \\\n  .outputMode("update") \\\n  .trigger(processingTime="5 minutes") \\\n  .start()`,
  },
  lambda: {
    name: 'Lambda architecture',
    icon: 'λ',
    color: 'var(--prime)',
    why: (params) => `Highly variable arrival with compliance/audit requirements demands correctness at all lateness levels. Lambda serves a real-time speed layer for dashboards and a batch accuracy layer that corrects the record.`,
    risks: 'Operationally heavy — two code paths to maintain. Batch layer reprocesses large windows. Risk of divergence between layers if logic is not kept in sync. Consider Kappa architecture as a simpler alternative.',
    config: `# Speed layer (streaming)\nspark.readStream.kafka(...)\n  .withWatermark("ts", "1 hour")\n  .writeStream.table("speed_layer")\n\n# Batch layer (daily correction)\nairflow DAG: recompute_truth\n  schedule: "@daily"\n  task: spark_submit(\n    "SELECT * FROM raw WHERE dt = {{ ds }}",\n    output="batch_layer"\n  )\n\n# Serving layer merges both`,
  },
  microbatch: {
    name: 'Micro-batch with idempotent reprocessing',
    icon: '',
    color: 'var(--prime)',
    why: (params) => `Moderate lateness + ability to reprocess maps well to scheduled micro-batches. Re-run the last N hours on a schedule — each run is idempotent so overlaps are safe.`,
    risks: 'Data is always slightly stale (one micro-batch interval behind). Late data beyond the reprocessing window is permanently missed. Must ensure pipeline is truly idempotent (UPSERT, not INSERT).',
    config: `# Airflow DAG — runs every 2h, reprocesses last 8h\ndefault_args = {"retries": 2}\nwith DAG("micro_batch", schedule_interval="0 */2 * * *",\n         catchup=False) as dag:\n\n    reprocess = PythonOperator(\n        task_id="reprocess_window",\n        python_callable=upsert_last_n_hours,\n        op_kwargs={"lookback_hours": 8},\n    )\n\n# In your SQL: use MERGE ON event_id`,
  },
  sla_only: {
    name: 'SLA + alerting only',
    icon: '',
    color: 'var(--prime)',
    why: (params) => `When reprocessing is impossible and the data pattern is unpredictable, automated late-handling may cause more harm than good. Alert humans when data is late and let them decide whether to wait, impute, or proceed.`,
    risks: 'Requires disciplined on-call response. Late data is never automatically corrected. Only appropriate when human review is fast and business can tolerate a manual process.',
    config: `# Airflow SLA miss callback\ndef sla_miss_callback(dag, task_list, blocking_task_list,\n                      slas, blocking_tis):\n    send_pagerduty_alert(\n        title=f"SLA missed: {dag.dag_id}",\n        details=str(slas)\n    )\n\ndag = DAG(...,\n    sla_miss_callback=sla_miss_callback,\n    default_args={"sla": timedelta(hours=2)}\n)`,
  },
}

function pickStrategy(arrival, reprocess, consumers) {
  const hasCompliance = consumers.includes('compliance')
  const hasRealtime = consumers.includes('realtime')
  const hasML = consumers.includes('ml')

  if (arrival === 'variable' || hasCompliance) return 'lambda'
  if (arrival === 'early' && reprocess === 'none') return 'fixed_window'
  if (arrival === 'early' && !hasRealtime) return 'fixed_window'
  if ((arrival === 'moderate' || arrival === 'late') && reprocess === 'high') return 'microbatch'
  if ((arrival === 'moderate' || arrival === 'late') && hasRealtime) return 'watermark'
  if (reprocess === 'none') return 'sla_only'
  if (arrival === 'moderate') return 'microbatch'
  return 'watermark'
}

function LateDataHandler() {
  const [arrival, setArrival] = useState('moderate')
  const [reprocess, setReprocess] = useState('low')
  const [consumers, setConsumers] = useState(['daily'])

  function toggleConsumer(id) {
    setConsumers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const stratKey = useMemo(() => pickStrategy(arrival, reprocess, consumers), [arrival, reprocess, consumers])
  const strat = STRATEGIES[stratKey]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Late Data Handler</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Set your pipeline constraints and get a recommended late-data strategy with production config.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {/* Arrival pattern */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '12px' }}>Arrival pattern</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ARRIVAL_PATTERNS.map(p => (
              <button key={p.id} onClick={() => setArrival(p.id)}
                style={{ padding: '9px 12px', borderRadius: '6px', border: `1px solid ${arrival === p.id ? 'var(--prime)' : 'var(--rim)'}`, background: arrival === p.id ? 'rgba(240,165,0,0.15)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: arrival === p.id ? 'var(--prime)' : 'var(--ink-mid)' }}>{p.label}</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginTop: '2px' }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Reprocess tolerance */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '12px' }}>Reprocessing tolerance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {REPROCESS_TOLERANCES.map(t => (
              <button key={t.id} onClick={() => setReprocess(t.id)}
                style={{ padding: '9px 12px', borderRadius: '6px', border: `1px solid ${reprocess === t.id ? 'var(--prime)' : 'var(--rim)'}`, background: reprocess === t.id ? 'rgba(240,165,0,0.15)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: reprocess === t.id ? 'var(--prime)' : 'var(--ink-mid)' }}>{t.label}</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginTop: '2px' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Downstream consumers */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '12px' }}>Downstream consumers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {DOWNSTREAM_TYPES.map(d => {
              const active = consumers.includes(d.id)
              return (
                <button key={d.id} onClick={() => toggleConsumer(d.id)}
                  style={{ padding: '9px 12px', borderRadius: '6px', border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`, background: active ? 'rgba(240,165,0,0.15)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: `2px solid ${active ? 'var(--prime)' : 'var(--rim)'}`, background: active ? 'var(--prime)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {active && <span style={{ color: 'white', fontSize: '9px', fontWeight: 700 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
                    </div>
                    <span style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, color: active ? 'var(--prime)' : 'var(--ink-mid)' }}>{d.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="card animate-fade-in" style={{ padding: '24px', borderLeft: `3px solid ${strat.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          
          <div>
            <div style={{ fontSize: '10px', color: strat.color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '2px' }}>Recommended strategy</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 700, color: 'var(--ink-hi)' }}>{strat.name}</div>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: '0 0 16px' }}>{strat.why({ arrival, reprocess, consumers })}</p>

        <div style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--rim)', borderRadius: '8px', marginBottom: '14px' }}>
          <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Production config</div>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{strat.config}</pre>
        </div>

        <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.13)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '5px' }}>Risks</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{strat.risks}</p>
        </div>
      </div>
    </div>
  )
}

// ── Roadmap ───────────────────────────────────────────────────────────────────
const ROADMAP = [
  { icon: '', label: 'DAG Failure Room', desc: 'Zombie tasks, trigger_rule bugs, catchup backlog, pool starvation, XCom blowouts — diagnose from symptoms.', status: 'live' },
  { icon: '', label: 'Backfill Decision Lab', desc: 'Pipeline down, source corrections, idempotency — when to backfill, how much, in what order.', status: 'live' },
  { icon: '', label: 'Late Data Handler', desc: 'Set arrival pattern and reprocessing tolerance; get a recommended strategy with production config.', status: 'live' },
  { icon: '', label: 'Operator Selection Guide', desc: 'BashOperator vs PythonOperator vs sensors, when TaskGroups beat SubDAGs, choosing the right execution primitive.', status: 'soon', devBrief: { micro: 'AccordionMCQ, 4 scenarios. Each gives a constraint set (external dependency, Python-heavy logic, parallel branching, retry behaviour) — user picks the right operator. Reveals include concrete config examples.', macro: 'Fills the gap between DAGs failing (DAG Failure Room) and building them correctly — operator selection is the first decision in any new DAG and the most common correctness-bug source.' } },
  { icon: '', label: 'Dynamic DAG Patterns', desc: 'Parameterised DAGs, DAG factories, config-driven pipelines — avoiding copy-paste DAG sprawl.', status: 'soon', devBrief: { micro: 'AccordionMCQ, 3 scenarios. Config-driven DAGs with Airflow Variables/Params, DAG factory with a common_dag pattern, API-triggered parameterised runs. Focus: version drift and copy-paste sprawl prevention.', macro: 'Advanced Airflow pattern that appears in Staff+ DE interviews at scale. Pairs with Airflow at Scale to complete the "building for growth" half of the tab.' } },
  { icon: '', label: 'Airflow at Scale', desc: 'CeleryExecutor vs KubernetesExecutor, scheduler HA, metadata DB sizing, performance tuning.', status: 'soon', devBrief: { micro: 'Decision-matrix format. CeleryExecutor vs KubernetesExecutor vs LocalExecutor mapped to scale breakpoints. Scheduler HA scenarios (multi-worker + DB HA). Metadata DB sizing rules of thumb. ~3 scenarios.', macro: 'Airflow at Scale — the final module in the arc. After failure modes and correct build patterns, this covers the infrastructure layer. Completes the orchestration arc.' } },
]

// ── Module nav ────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'dag_failure', label: 'DAG Failure Room', icon: '', component: DAGFailureRoom },
  { id: 'backfill', label: 'Backfill Decision Lab', icon: '', component: BackfillDecisionLab },
  { id: 'late_data', label: 'Late Data Handler', icon: '', component: LateDataHandler },
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

// ── Tab shell ─────────────────────────────────────────────────────────────────
export default function AirflowTab({ onNavigate }) {
  const [active, setActive] = useState('dag_failure')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? DAGFailureRoom
  const activeModuleData = MODULES.find(m => m.id === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <TabHeader title="Airflow & Orchestration" />
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'var(--prime-bg-light)', color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Data Engineering</span>
          <FidelityBadge tier="conceptual" />
        </div>
        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '640px' }}>
          Pipeline failures are silent by default. This domain teaches you to diagnose DAG failures, design backfill strategies, and handle late-arriving data — before your 3am incident.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${active === m.id ? 'var(--prime)' : 'var(--rim)'}`, background: active === m.id ? 'rgba(240,165,0,0.10)' : 'transparent', color: active === m.id ? 'var(--prime)' : 'var(--ink-low)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
            {m.label}
          </button>
        ))}
      </div>

      {activeModuleData && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <BookmarkButton tabId="airflow" moduleId={active} label={activeModuleData.label} />
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
                {m.status === 'soon' && <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'rgba(255,255,255,0.11)', color: 'var(--ink-low)', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>soon</span>}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {onNavigate && (
        <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>Three Drift Signals That Predict Model Failure Before It Happens</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}

    </div>
  )
}
