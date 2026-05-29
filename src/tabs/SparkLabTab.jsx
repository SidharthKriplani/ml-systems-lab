import { useState, useEffect } from 'react'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'
import { trackModuleStart, trackModuleComplete } from '../analytics.js'

// ─── Shuffle Hell (simulation engine) ───────────────────────────────────────
function computeShuffleResult({ dataGB, partitions, joinStrategy, broadcastThresholdMB, skewFactor }) {
  const dataMB       = dataGB * 1024
  const rightTableMB = 512
  const executorHeapMB   = 4096
  const spillThresholdMB = executorHeapMB * 0.6
  const partitionSizeMB  = dataMB / partitions
  const skewedPartitionMB = partitionSizeMB * skewFactor
  const canBroadcast = rightTableMB <= broadcastThresholdMB

  const actualStrategy = joinStrategy === 'broadcast' && canBroadcast
    ? 'broadcast'
    : joinStrategy === 'broadcast' && !canBroadcast
    ? 'sort_merge_fallback'
    : joinStrategy

  const oomRisk   = skewedPartitionMB > executorHeapMB * 0.8
  const spillRisk = skewedPartitionMB > spillThresholdMB && !oomRisk

  let baseDuration = (dataMB / 1024) * 2
  if (actualStrategy === 'sort_merge')          baseDuration *= 2
  if (actualStrategy === 'sort_merge_fallback') baseDuration *= 2.5
  if (oomRisk)    baseDuration = null
  if (spillRisk)  baseDuration *= 1.8
  if (partitions < 50)  baseDuration = baseDuration && baseDuration * 1.5
  if (partitions > 500) baseDuration = baseDuration && baseDuration * 1.2

  const shuffleWriteMB = actualStrategy === 'broadcast' ? 0 : (dataMB * 1.8)

  return {
    actualStrategy, canBroadcast,
    partitionSizeMB: +partitionSizeMB.toFixed(1),
    skewedPartitionMB: +skewedPartitionMB.toFixed(1),
    oomRisk, spillRisk,
    durationMin: baseDuration ? +baseDuration.toFixed(1) : null,
    shuffleWriteMB: +shuffleWriteMB.toFixed(0),
    healthy: !oomRisk && !spillRisk && partitions >= 100 && partitions <= 400,
  }
}

function DagVis({ result, partitions }) {
  const bars = Math.min(partitions, 24)
  const durations = Array.from({ length: bars }, (_, i) => {
    if (i === 0 && result.skewFactor > 3) return 1.0
    const base = result.skewedPartitionMB > 200 ? 0.6 : 0.25
    return base + Math.random() * 0.2
  })
  const max = Math.max(...durations)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '64px', marginBottom: '6px' }}>
        {durations.map((d, i) => {
          const pct = (d / max) * 100
          const isStraggler = i === 0 && result.straggler > 0
          const bg = isStraggler ? 'var(--rose)' : result.spillRisk ? 'var(--gold)' : 'var(--prime)'
          return <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', background: bg, height: `${pct}%`, opacity: 0.8, transition: 'height 0.3s', minHeight: '4px' }} />
        })}
        {partitions > 24 && <div style={{ fontSize: '10px', color: 'var(--ink-low)', alignSelf: 'flex-end', paddingLeft: '4px' }}>+{partitions - 24}</div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-ghost)' }}>
        <span>Task 1</span><span>Task distribution ({partitions} partitions)</span>
      </div>
    </div>
  )
}

function ShuffleHell() {
  const [dataGB,      setDataGB]      = useState(100)
  const [partitions,  setPartitions]  = useState(200)
  const [joinStrategy,setJoinStrategy]= useState('sort_merge')
  const [broadcastMB, setBroadcastMB] = useState(10)
  const [skewFactor,  setSkewFactor]  = useState(1)
  const [result,      setResult]      = useState(null)
  const [ran,         setRan]         = useState(false)
  const [started,     setStarted]     = useState(false)

  function handleRun() {
    if (!started) { setStarted(true); trackModuleStart('Shuffle Hell', 'spark') }
    const r = computeShuffleResult({ dataGB, partitions, joinStrategy, broadcastThresholdMB: broadcastMB, skewFactor })
    setResult(r); setRan(true)
    if (r.healthy) trackModuleComplete('Shuffle Hell', 'spark', 100)
  }

  const statusBg    = result?.oomRisk ? 'rgba(244,63,94,0.15)'    : result?.spillRisk ? 'rgba(245,158,11,0.15)'  : result?.healthy ? 'rgba(16,185,129,0.15)'    : 'rgba(255,255,255,0.07)'
  const statusBorder = result?.oomRisk ? 'rgba(244,63,94,0.3)'    : result?.spillRisk ? 'rgba(245,158,11,0.3)'  : result?.healthy ? 'rgba(16,185,129,0.3)'    : 'var(--rim)'
  const statusMsg    = result?.oomRisk ? 'JOB FAILED — OutOfMemoryError' : result?.spillRisk ? '⚠ Significant spill to disk' : result?.healthy ? '✓ Job looks healthy' : '~ Suboptimal — will run'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--ember)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Shuffle Hell</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          You're joining a {dataGB}GB fact table to a 512MB dimension table. Configure the job — then run it.
        </p>
      </div>

      {/* Code preview */}
      <div className="code-block">
        <span className="kw">fact_table</span> = spark.read.parquet(<span className="str">"s3://data/events/"</span>)  <span className="cmt">// {dataGB} GB</span>{'\n'}
        <span className="kw">dim_table</span>  = spark.read.parquet(<span className="str">"s3://data/users/"</span>)   <span className="cmt">// 512 MB</span>{'\n'}
        <span className="kw">result</span>     = fact_table.join(dim_table, <span className="str">"user_id"</span>)
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Fact table size', value: dataGB, set: setDataGB, min: 10, max: 500, step: 10, unit: 'GB', warn: false },
          { label: 'shuffle.partitions', value: partitions, set: setPartitions, min: 10, max: 2000, step: 10, unit: '', warn: partitions < 50 || partitions > 600 },
          { label: 'Broadcast threshold', value: broadcastMB, set: setBroadcastMB, min: 1, max: 1024, step: 1, unit: 'MB', warn: false },
          { label: 'Skew factor', value: skewFactor, set: setSkewFactor, min: 1, max: 20, step: 0.5, unit: '×', warn: skewFactor > 5 },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
              {c.label}: <span style={{ color: c.warn ? 'var(--rose)' : 'var(--violet)', fontWeight: 600 }}>{c.value}{c.unit}</span>
            </label>
            <input type="range" min={c.min} max={c.max} step={c.step} value={c.value} onChange={e => { c.set(+e.target.value); setResult(null) }} />
          </div>
        ))}
      </div>

      {/* Join strategy */}
      <div className="card" style={{ padding: '16px' }}>
        <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '12px' }}>Join strategy hint</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { val: 'sort_merge', label: 'Sort-Merge', desc: 'Default. Always works. Full shuffle.' },
            { val: 'broadcast',  label: 'Broadcast Hash', desc: 'No shuffle. Right table must fit in memory.' },
          ].map(opt => (
            <button key={opt.val} onClick={() => { setJoinStrategy(opt.val); setResult(null) }}
              style={{ flex: 1, minWidth: '180px', padding: '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', border: `1px solid ${joinStrategy === opt.val ? 'rgba(240,165,0,0.4)' : 'var(--rim)'}`, background: joinStrategy === opt.val ? 'rgba(240,165,0,0.14)' : 'var(--void)', transition: 'all 0.15s' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '4px' }}>{opt.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={handleRun} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
        ▶ Run Job
      </button>

      {ran && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'slideUp 0.3s ease-out' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>Execution DAG — task duration distribution</div>
            <DagVis result={result} partitions={partitions} />
          </div>

          <div style={{ background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: '12px', padding: '18px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '13px', marginBottom: '14px', color: 'var(--ink-hi)' }}>{statusMsg}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Strategy', value: result.actualStrategy.replace('_', ' '), warn: result.actualStrategy === 'sort_merge_fallback' },
                { label: 'Avg partition', value: `${result.partitionSizeMB} MB`, good: result.partitionSizeMB >= 64 && result.partitionSizeMB <= 256 },
                { label: 'Max partition (skew)', value: `${result.skewedPartitionMB} MB`, warn: result.skewedPartitionMB > 1000 },
                { label: 'Shuffle write', value: result.shuffleWriteMB === 0 ? 'None' : `${result.shuffleWriteMB.toLocaleString()} MB`, good: result.shuffleWriteMB === 0 },
                { label: 'Est. duration', value: result.durationMin ? `~${result.durationMin} min` : 'FAILED', warn: !result.durationMin },
                { label: 'Disk spill', value: result.spillRisk ? 'Yes' : 'No', warn: result.spillRisk },
              ].map(m => (
                <div key={m.label} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: m.warn ? 'var(--rose)' : m.good ? 'var(--mint)' : 'var(--ink-hi)' }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7 }}>
              {result.oomRisk && <p style={{ color: 'var(--rose)', margin: '0 0 6px' }}>OOM: Skewed partition ({result.skewedPartitionMB} MB) exceeds executor heap. Fix: salting, AQE (spark.sql.adaptive.enabled=true), or increase partitions.</p>}
              {result.spillRisk && <p style={{ color: 'var(--gold)', margin: '0 0 6px' }}>Spill: Largest partition exceeds 60% of executor heap. Expect 1.5–3× slowdown. Reduce skew factor or increase shuffle.partitions.</p>}
              {result.actualStrategy === 'sort_merge_fallback' && <p style={{ color: 'var(--gold)', margin: '0 0 6px' }}>Broadcast fallback: threshold ({broadcastMB} MB) &lt; dim table (512 MB). Raise autoBroadcastJoinThreshold or accept shuffle cost.</p>}
              {result.healthy && <p style={{ color: 'var(--mint)', margin: 0 }}>Partition size in sweet spot, no spill, skew manageable. Nice.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Skew Doctor ─────────────────────────────────────────────────────────────
function SkewDoctor() {
  const [keyDist,  setKeyDist]  = useState('moderate')
  const [fix,      setFix]      = useState(null)
  const [revealed, setRevealed] = useState(false)

  const DISTRIBUTIONS = {
    uniform:  { label: 'Uniform', tasks: Array.from({length:16},()=> 40 + Math.random()*20), desc:'Well-distributed. No skew.' },
    moderate: { label: 'Moderate skew', tasks: [280, 220, 190, 160, ...Array.from({length:12},()=> 30 + Math.random()*15)], desc:'Some hot keys. 3-4 stragglers.' },
    severe:   { label: 'Severe skew (hot key)', tasks: [800, 680, 120, 100, ...Array.from({length:12},()=> 15 + Math.random()*10)], desc: '"guest" user_id has 60% of traffic. Job is bottlenecked on 2 tasks.' },
  }

  const FIXES = {
    salting: {
      label: 'Key Salting',
      code: `# Add random salt to hot keys\ndf = df.withColumn("salt", F.when(\n    F.col("user_id") == "guest",\n    (F.rand() * 10).cast("int")\n).otherwise(F.lit(0)))\ndf = df.withColumn("salted_key",\n    F.concat("user_id", F.lit("_"), "salt"))`,
      outcome: 'uniform',
      desc: 'Distributes hot key traffic across 10 synthetic buckets. Must also replicate the join side with all salt values.'
    },
    aqe: {
      label: 'AQE Skew Join',
      code: `spark.conf.set(\n    "spark.sql.adaptive.enabled", True)\nspark.conf.set(\n    "spark.sql.adaptive.skewJoin.enabled", True)\n# Spark splits large partitions automatically`,
      outcome: 'moderate',
      desc: 'Adaptive Query Execution detects and splits skewed partitions at runtime. Less control but zero code change.'
    },
    repartition: {
      label: 'Repartition on less-skewed key',
      code: `# Repartition by a less-skewed column\ndf = df.repartition(400, "session_id")\n# session_id has more uniform distribution\n# than user_id for anonymous traffic`,
      outcome: 'moderate',
      desc: 'Effective when there\'s a correlated column with better distribution. Adds a shuffle but reduces per-partition skew.'
    },
  }

  const dist = DISTRIBUTIONS[keyDist]
  const maxTask = Math.max(...dist.tasks)
  const medianTask = [...dist.tasks].sort((a,b)=>a-b)[Math.floor(dist.tasks.length/2)]
  const skewRatio = (maxTask / medianTask).toFixed(1)

  const fixedDist = fix ? DISTRIBUTIONS[FIXES[fix].outcome] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--ember)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Skew Doctor</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Select a skew scenario. Diagnose it via the task duration chart. Then apply a fix and see the result.
        </p>
      </div>

      {/* Scenario picker */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {Object.entries(DISTRIBUTIONS).map(([k, v]) => (
          <button key={k} onClick={() => { setKeyDist(k); setFix(null); setRevealed(false) }}
            className={`sub-tab ${keyDist === k ? 'active' : 'inactive'}`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Task chart */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Task duration (Stage: shuffle read → aggregate)</span>
          <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: +skewRatio > 10 ? 'var(--rose)' : +skewRatio > 3 ? 'var(--gold)' : 'var(--mint)' }}>
            max/median: {skewRatio}×
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px', marginBottom: '8px' }}>
          {dist.tasks.map((t, i) => {
            const pct = (t / maxTask) * 100
            const isStraggler = t > medianTask * 4
            return <div key={i} style={{ flex: 1, background: isStraggler ? 'var(--rose)' : 'var(--prime)', opacity: 0.8, height: `${pct}%`, borderRadius: '2px 2px 0 0', minHeight: '3px', transition: 'height 0.4s' }} />
          })}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink-low)', margin: 0 }}>{dist.desc}</p>
      </div>

      {/* Fix picker */}
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Apply a fix</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {Object.entries(FIXES).map(([k, v]) => (
            <button key={k} onClick={() => { setFix(k); setRevealed(true) }}
              className="card"
              style={{ textAlign: 'left', cursor: 'pointer', border: `1px solid ${fix === k ? 'rgba(240,165,0,0.4)' : 'var(--rim)'}`, background: fix === k ? 'rgba(240,165,0,0.14)' : 'var(--depth)', transition: 'all 0.15s', padding: '14px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '8px' }}>{v.label}</div>
              <div className="code-block" style={{ fontSize: '11px', padding: '8px', whiteSpace: 'pre-wrap' }}>{v.code}</div>
            </button>
          ))}
        </div>
      </div>

      {revealed && fix && fixedDist && (
        <div className="card animate-slide-up" style={{ padding: '16px', background: 'rgba(16,185,129,0.11)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--mint)', marginBottom: '12px' }}>After fix: {FIXES[fix].label}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '60px', marginBottom: '8px' }}>
            {fixedDist.tasks.map((t, i) => {
              const max2 = Math.max(...fixedDist.tasks)
              return <div key={i} style={{ flex: 1, background: 'var(--mint)', opacity: 0.7, height: `${(t/max2)*100}%`, borderRadius: '2px 2px 0 0', minHeight: '3px', transition: 'height 0.4s' }} />
            })}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{FIXES[fix].desc}</p>
        </div>
      )}
    </div>
  )
}

// ─── Partition Tuner ─────────────────────────────────────────────────────────
function PartitionTuner() {
  const [dataGB,      setDataGB]      = useState(50)
  const [targetSizeMB,setTargetSizeMB]= useState(128)
  const [executors,   setExecutors]   = useState(20)
  const [coresPerExec,setCoresPerExec]= useState(4)

  const totalSlots    = executors * coresPerExec
  const dataMB        = dataGB * 1024
  const bySize        = Math.ceil(dataMB / targetSizeMB)
  const byParallelism = totalSlots * 2
  const recommended   = Math.max(bySize, byParallelism)
  const roundedRec    = Math.ceil(recommended / totalSlots) * totalSlots  // multiple of total slots
  const partSizeMB    = dataMB / roundedRec
  const isSmall       = partSizeMB < 64
  const isLarge       = partSizeMB > 256
  const waveCount     = Math.ceil(roundedRec / totalSlots)

  // Distribution bars: simulate skew-free partition sizes near target
  const barHeights = Array.from({ length: Math.min(roundedRec, 40) }, (_, i) =>
    partSizeMB * (0.9 + Math.sin(i * 2.3) * 0.08)
  )
  const maxBar = Math.max(...barHeights)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--ember)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Partition Tuner</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Find the optimal <code style={{ color: 'var(--sky)' }}>spark.sql.shuffle.partitions</code> value for your cluster and dataset.
          Tune until partition size hits the 128–256 MB sweet spot and parallelism matches your slots.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {/* Controls */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {[
            { label: 'Dataset size', val: dataGB, set: setDataGB, min: 1, max: 500, unit: 'GB', step: 1 },
            { label: 'Target partition size', val: targetSizeMB, set: setTargetSizeMB, min: 32, max: 512, unit: 'MB', step: 32 },
            { label: 'Executors', val: executors, set: setExecutors, min: 2, max: 200, unit: '', step: 1 },
            { label: 'Cores per executor', val: coresPerExec, set: setCoresPerExec, min: 1, max: 16, unit: '', step: 1 },
          ].map(({ label, val, set, min, max, unit, step }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-low)', marginBottom: '6px' }}>
                <span>{label}</span>
                <span style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)' }}>{val}{unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(Number(e.target.value))} />
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)' }}>Recommendation</div>

          <div style={{ padding: '16px', background: 'rgba(52,211,153,0.13)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '4px' }}>
              spark.sql.shuffle.partitions
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, fontFamily: 'var(--font-sans)', color: 'var(--mint)' }}>
              {roundedRec}
            </div>
          </div>

          {[
            ['By data size', bySize, 'partitions to hit target size'],
            ['By parallelism', byParallelism, '2× total executor slots'],
            ['Total slots', totalSlots, `${executors} execs × ${coresPerExec} cores`],
            ['Partition size', `${partSizeMB.toFixed(0)} MB`, isSmall ? '⚠ too small — task overhead' : isLarge ? '⚠ too large — spill risk' : '✓ good'],
            ['Wave count', waveCount, 'stages per shuffle'],
          ].map(([k, v, hint]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', borderBottom: '1px solid var(--rim)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--ink-low)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', fontSize: '12px' }}>{v} <span style={{ color: isSmall && k==='Partition size' ? 'var(--ember)' : isLarge && k==='Partition size' ? 'var(--rose)' : 'var(--ink-ghost)', fontSize: '11px' }}>{hint}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Partition size distribution */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '4px' }}>
          Partition size distribution (first {barHeights.length} of {roundedRec})
        </div>
        <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginBottom: '14px' }}>
          Target: {targetSizeMB} MB · Ideal range: 64–256 MB
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
          {barHeights.map((h, i) => {
            const pct = (h / maxBar) * 100
            const color = h < 64 ? 'var(--ember)' : h > 256 ? 'var(--rose)' : 'var(--mint)'
            return <div key={i} style={{ flex: 1, background: color, opacity: 0.7, height: `${pct}%`, borderRadius: '2px 2px 0 0', minHeight: '3px', transition: 'height 0.3s' }} />
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ink-ghost)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
          <span>partition 1</span>
          <span style={{ color: partSizeMB < 64 ? 'var(--ember)' : partSizeMB > 256 ? 'var(--rose)' : 'var(--mint)' }}>
            avg {partSizeMB.toFixed(0)} MB {isSmall ? '← too small' : isLarge ? '← too large' : '← good'}
          </span>
          <span>partition {barHeights.length}</span>
        </div>
      </div>

      {/* Tips */}
      <div className="card" style={{ padding: '16px 20px', background: 'rgba(249,115,22,0.10)', borderColor: 'rgba(249,115,22,0.2)' }}>
        <div style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.75 }}>
          <strong style={{ color: 'var(--ember)' }}>Rules of thumb:</strong><br />
          • Default is 200 — fine for small jobs, catastrophic for large datasets.<br />
          • Target 128–200 MB per partition after shuffle (tune with AQE if on Spark 3+).<br />
          • Keep partitions as a multiple of total executor slots to avoid stragglers.<br />
          • More waves = longer wall time; fewer waves = larger, spill-prone partitions.<br />
          • With <strong>Adaptive Query Execution (AQE)</strong>: set a high upper bound and let Spark coalesce automatically.
        </div>
      </div>
    </div>
  )
}

// ─── Shared AccordionMCQ ─────────────────────────────────────────────────────
function AccordionMCQ({ scenarios, accentColor = 'var(--ember)', storageKey = null }) {
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
      {/* Difficulty filter */}
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

      {/* Score strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, var(--depth) 40%)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 4px 14px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.11)' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{attempted}/{scenarios.length} attempted</span>
        {attempted > 0 && <span style={{ fontSize: '11px', color: pct >= 70 ? 'var(--mint)' : 'var(--ember)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{correct} correct ({pct}%)</span>}
        <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
          <div style={{ width: `${(attempted / scenarios.length) * 100}%`, height: '100%', background: accentColor, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
      </div>

      {scenarios.map((sc, i) => { if (diffFilter !== 'all' && getDiff(i, scenarios.length) !== diffFilter) return null;
        const it = items[i]
        const isCorrect = it.revealed && it.picked === sc.answer
        return (
          <div key={sc.id} style={{ border: `1px solid ${it.open ? accentColor + '55' : 'rgba(255,255,255,0.15)'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
            {/* Header row */}
            <button onClick={() => toggle(i)} style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: it.open ? accentColor + '08' : 'var(--depth)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.15s' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '20px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', textAlign: 'left' }}>{sc.title}</span>
              {it.revealed && <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>{isCorrect ? '✓' : '✗'}</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--ink-ghost)', transition: 'transform 0.2s', transform: it.open ? 'rotate(90deg)' : 'rotate(0deg)' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 2l4 3-4 3"/></svg></span>
            </button>

            {/* Body */}
            {it.open && (
              <div className="accordion-enter" style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Context */}
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.30)', marginTop: '4px' }}>
                  {Array.isArray(sc.context) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {sc.context.map((line, li) => <p key={li} style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{line}</p>)}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{sc.context}</p>
                  )}
                </div>

                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', margin: 0 }}>{sc.question}</p>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {sc.options.map((opt, oi) => {
                    const isPicked = it.picked === oi
                    const isAns    = sc.answer === oi
                    let bg = 'var(--depth)', border = 'var(--rim)', color = 'var(--ink-mid)'
                    if (it.revealed) {
                      if (isAns)          { bg = 'rgba(52,211,153,0.15)'; border = 'rgba(52,211,153,0.35)'; color = 'var(--ink-hi)' }
                      else if (isPicked)  { bg = 'rgba(239,68,68,0.15)';  border = 'rgba(239,68,68,0.35)'; color = 'var(--ink-mid)' }
                    } else if (isPicked)  { bg = accentColor + '10'; border = accentColor + '50'; color = 'var(--ink-hi)' }
                    return (
                      <button key={oi} disabled={it.revealed} onClick={() => pick(i, oi)}
                        style={{ textAlign: 'left', padding: '10px 14px', borderRadius: '8px', background: bg, border: `1px solid ${border}`, cursor: it.revealed ? 'default' : 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start', transition: 'all 0.12s' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '14px', paddingTop: '2px' }}>{['A','B','C','D'][oi]}</span>
                        <span style={{ fontSize: '13px', color, lineHeight: 1.5 }}>{opt}</span>
                        {it.revealed && isAns && <span style={{ marginLeft: 'auto', color: 'var(--mint)', fontSize: '12px' }}>✓</span>}
                      </button>
                    )
                  })}
                </div>

                {/* Explanation */}
                {it.revealed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.11)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>Diagnosis</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.diagnosis}</p>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>Production fix</div>
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

// ─── Broadcast Join Decisions ─────────────────────────────────────────────────
const BROADCAST_SCENARIOS = [
  {
    id: 'bj1',
    title: 'Dimension table join',
    context: 'You have a 500 GB fact table and a 2 MB country_codes lookup table. The job runs a filter-then-join pattern.',
    question: 'Which join strategy should you use?',
    options: [
      'Sort-merge join — always safer for large datasets.',
      'Broadcast join the 2 MB table — fits easily in executor memory.',
      'Broadcast join the fact table — it triggers faster.',
      'Repartition both tables to the same key before joining.',
    ],
    answer: 1,
    diagnosis: 'A 2 MB table is a textbook broadcast candidate. Spark\'s default autoBroadcastJoinThreshold is 10 MB. Broadcasting eliminates the shuffle entirely — the small table is sent to every executor and the join becomes a local hash lookup.',
    fix: 'Either rely on Spark\'s AQE auto-broadcast, or set spark.sql.autoBroadcastJoinThreshold = 20971520 (20 MB). Explicitly: spark.sql.functions.broadcast(dim_df). Verify with EXPLAIN — look for BroadcastHashJoin in the plan.',
  },
  {
    id: 'bj2',
    title: 'Broadcast threshold exceeded',
    context: 'A team sets autoBroadcastJoinThreshold to 500 MB to "always broadcast dimension tables." One of their dimensions has grown to 480 MB. The job now gets OOM errors on executors.',
    question: 'What went wrong and what is the correct fix?',
    options: [
      'Reduce autoBroadcastJoinThreshold back to default (10 MB).',
      'The 480 MB table is too large to broadcast safely — each executor holds a full copy, exhausting heap.',
      'Increase executor memory to 128 GB to accommodate the broadcast.',
      'Switch to a bucketed join instead.',
    ],
    answer: 1,
    diagnosis: 'Broadcasting a 480 MB table means every executor receives a full 480 MB copy. With 20 executors, that\'s 9.6 GB of broadcast data total. Executor heap overflow is the inevitable result. A static high threshold is an anti-pattern.',
    fix: 'Cap autoBroadcastJoinThreshold at a value safe for your executor heap size — typically executor_memory_mb * 0.1. For 8 GB executors, cap at 800 MB total but be conservative. Audit dimension tables periodically — broadcast decisions made at pipeline build time can break as data grows.',
  },
  {
    id: 'bj3',
    title: 'Skewed sort-merge candidate',
    context: 'A join between two large tables (10 GB and 8 GB) is producing 3 straggler tasks that take 45 minutes while the other 197 tasks finish in 2 minutes. Neither table is small enough to broadcast.',
    question: 'What is the correct approach?',
    options: [
      'Force broadcast of the 8 GB table to eliminate the shuffle.',
      'Increase spark.sql.shuffle.partitions to 2000.',
      'Use salting: add a random prefix to the skewed key, replicate the non-skewed side.',
      'Switch to a Cartesian join to avoid the skew issue.',
    ],
    answer: 2,
    diagnosis: 'The straggler pattern is data skew — a small number of join keys have disproportionate rows. Broadcasting 8 GB would cause OOM. Increasing partition count just splits non-skewed partitions; the skewed key still lands in one task. Salting is the correct fix.',
    fix: 'Identify the skewed keys (value_counts on join key). Add a random integer suffix 0-N to the key in the large table, replicate matching rows N+1 times in the smaller table with each suffix. After join, aggregate back. AQE\'s skew join optimization does this automatically in Spark 3+ — enable with spark.sql.adaptive.skewJoin.enabled = true.',
  },
  {
    id: 'bj4',
    title: 'BroadcastNestedLoopJoin surprise',
    context: 'A developer runs a join with no join condition (a cross join). Spark chooses BroadcastNestedLoopJoin and the job runs for 6 hours before OOM.',
    question: 'Why did Spark choose BroadcastNestedLoopJoin and how do you prevent it?',
    options: [
      'Spark should have used SortMergeJoin — file a bug.',
      'BroadcastNestedLoopJoin is chosen for non-equi joins or joins without keys — it broadcasts one side and nested-loops the other. It is O(n²).',
      'The developer should set spark.sql.join.preferSortMergeJoin = true.',
      'The join needed more partitions to avoid OOM.',
    ],
    answer: 1,
    diagnosis: 'BroadcastNestedLoopJoin (BNLJ) is Spark\'s fallback for joins it cannot push into a hash or sort-merge join — typically cross joins or non-equi conditions. With no join key, both sides must be checked for every row combination: O(n×m) complexity. Even moderate tables produce billions of comparisons.',
    fix: 'Audit join conditions — if you see BNLJ in EXPLAIN, you likely have a missing or incorrect join key. If a cross join is truly intended, add CROSS JOIN explicitly and validate cardinality first. For non-equi range joins (e.g., time interval joins), consider range-partitioning or using IntervalTree joins instead.',
  },
  {
    id: 'bj5',
    title: 'AQE broadcast upgrade',
    context: 'A join starts with sort-merge join (both tables estimated at 500 MB each). At runtime, after filtering, the right table shrinks to 8 MB. With AQE enabled, Spark switches to BroadcastHashJoin mid-plan.',
    question: 'Is this behavior correct, and should you rely on it?',
    options: [
      'This is a bug — Spark should not change the join type after planning.',
      'This is AQE dynamic join optimization — correct and recommended. The runtime statistics trigger a broadcast upgrade.',
      'You should disable AQE and explicitly set the broadcast threshold instead.',
      'The 8 MB table should have been broadcast statically — fix the autoBroadcastJoinThreshold.',
    ],
    answer: 1,
    diagnosis: 'Adaptive Query Execution (Spark 3.0+) collects runtime statistics after each shuffle and can re-optimize the remaining plan. Converting a sort-merge join to a broadcast join when a table filters down is a major performance win — it eliminates a shuffle that was estimated based on pre-filter sizes.',
    fix: 'Enable AQE: spark.sql.adaptive.enabled = true (default in Spark 3.2+). Trust runtime broadcast upgrades — they are more accurate than static threshold guesses. Still set a reasonable autoBroadcastJoinThreshold as a cap to prevent accidental large broadcasts.',
  },
  {
    id: 'bj6',
    title: 'Bucketed join optimization',
    context: 'Two tables are joined daily on user_id. Both are large (50 GB each). The join causes a full shuffle of both tables on every run, taking 40 minutes.',
    question: 'How can you eliminate the shuffle permanently?',
    options: [
      'Broadcast one of the tables — 50 GB is manageable with enough executor memory.',
      'Increase spark.sql.shuffle.partitions to 4000.',
      'Bucket both tables on user_id with the same number of buckets — pre-sort eliminates the shuffle.',
      'Use a salted join to distribute the data evenly.',
    ],
    answer: 2,
    diagnosis: 'Bucketing writes data pre-partitioned and pre-sorted on the join key. When both sides are bucketed on the same key with the same bucket count, Spark can skip the shuffle entirely — it just reads matching bucket files together. This is a permanent optimization for repeated joins.',
    fix: 'df.write.bucketBy(256, "user_id").sortBy("user_id").saveAsTable("user_events_bucketed"). Both sides must use the same number of buckets. Spark will use SortMergeJoin without a shuffle stage. Verify with EXPLAIN — you should see no Exchange node before the join. Maintenance cost: writes are slower (they sort data); only worth it for tables joined repeatedly.',
  },
]

function BroadcastJoinDecisions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13.5px', color: 'var(--ink-low)', lineHeight: 1.65, maxWidth: '600px', margin: 0 }}>
        Broadcast joins eliminate shuffles but carry memory risks. Each scenario tests when to broadcast, when to avoid it, and what Spark chooses at runtime.
      </p>
      <AccordionMCQ scenarios={BROADCAST_SCENARIOS} accentColor="var(--ember)" storageKey="spark_broadcast" />
    </div>
  )
}

// ─── OOM Diagnosis ───────────────────────────────────────────────────────────
const OOM_SCENARIOS = [
  {
    id: 'oom1',
    title: 'Collect on large RDD',
    context: 'A Spark job calls df.collect() on a 20 GB DataFrame to process results in the driver. The driver gets java.lang.OutOfMemoryError: Java heap space.',
    question: 'What is the root cause and the correct fix?',
    options: [
      'The executor memory is too low — increase spark.executor.memory.',
      'collect() pulls all data into driver memory — 20 GB exceeds driver heap. Never collect large DataFrames.',
      'The DataFrame needs to be repartitioned before collecting.',
      'Switch to df.show(1000) instead.',
    ],
    answer: 1,
    diagnosis: 'collect() materialises the entire DataFrame on the driver JVM. The driver heap is typically much smaller than aggregate executor memory (often 2–4 GB). This is one of the most common Spark anti-patterns. Even if you increase driver memory, this approach scales O(n) with data size.',
    fix: 'Never collect large DataFrames. Use df.write to persist results. For aggregations, push the computation into Spark and only collect the aggregate. If you need a small sample: df.limit(1000).collect() or df.sample(0.001).collect(). If you must collect for downstream processing, verify cardinality first with df.count().',
  },
  {
    id: 'oom2',
    title: 'Executor OOM from data skew',
    context: 'A groupBy aggregation crashes with "GC overhead limit exceeded" on 2 out of 200 executor tasks. The other 198 tasks finish in 30 seconds.',
    question: 'What is causing the OOM and how do you fix it?',
    options: [
      'Increase spark.executor.memory from 4g to 32g to handle large tasks.',
      'The groupBy key is skewed — a small number of keys have millions of rows, concentrating data in 2 tasks.',
      'Use df.coalesce(1) before the groupBy to reduce task overhead.',
      'Switch to RDD-based aggregation for more control over memory.',
    ],
    answer: 1,
    diagnosis: 'Two tasks crashing while 198 succeed is the signature of data skew, not insufficient memory. The skewed keys accumulate rows that overflow executor heap during the shuffle read phase. Increasing executor memory for all tasks just to handle 2 skewed keys is wasteful and doesn\'t fix the root cause.',
    fix: 'Enable AQE skew join: spark.sql.adaptive.skewJoin.enabled = true (Spark 3+). For groupBy specifically, use two-phase aggregation: (1) pre-aggregate with a salt key to spread load, (2) aggregate again dropping the salt. Identify skewed keys with df.groupBy(key).count().orderBy(F.desc("count")).show(20).',
  },
  {
    id: 'oom3',
    title: 'Broadcast OOM',
    context: 'A developer sets spark.sql.autoBroadcastJoinThreshold = 2147483647 (2 GB) to "make sure all small tables are broadcast." The next day, a join with a 1.5 GB dimension table causes executor OOM across the cluster.',
    question: 'Why did every executor OOM and what is the fix?',
    options: [
      'The 1.5 GB table exceeded the broadcast threshold — the job fell back to sort-merge join which used more memory.',
      'Every executor received a full 1.5 GB copy of the broadcast table. With 50 executors, that is 75 GB of broadcast traffic and per-executor heap is exceeded.',
      'The broadcast threshold should be set to 4 GB instead.',
      'The dimension table needs to be repartitioned before broadcasting.',
    ],
    answer: 1,
    diagnosis: 'Broadcasting distributes a full copy of the table to each executor. A 1.5 GB broadcast with 50 executors means 75 GB total memory consumed in broadcast data alone. Each executor holds 1.5 GB in its JVM heap simultaneously with its working data — this blows up any reasonable heap size.',
    fix: 'Set autoBroadcastJoinThreshold conservatively: a rule of thumb is ≤10% of executor memory for the broadcast table. For 8 GB executors: 800 MB max. Better: leave it at the Spark default (10 MB) and selectively use broadcast() on tables you have verified are small. Never set a blanket high threshold.',
  },
  {
    id: 'oom4',
    title: 'Shuffle spill vs OOM',
    context: 'A large sort job is running slowly with frequent GC pauses and disk spill warnings in the Spark UI. It completes but takes 3× longer than expected.',
    question: 'What is happening and how do you address it?',
    options: [
      'The job is about to OOM — stop it and increase executor memory immediately.',
      'Spark is spilling shuffle data to disk because executors cannot hold the full shuffle in memory. This is safe but slow.',
      'The job needs more shuffle partitions to prevent the spill.',
      'Disk spill means the executor storage is full — clean up cached DataFrames.',
    ],
    answer: 1,
    diagnosis: 'Shuffle spill is Spark\'s safety valve: when executor memory for shuffle data is exhausted, it spills to disk and reads back when needed. The job completes correctly but with significant I/O overhead. Spill is not a crash — it is a performance problem. GC pauses compound the issue as memory pressure is high.',
    fix: 'Three levers: (1) Increase spark.sql.shuffle.partitions to reduce data per partition. (2) Increase spark.executor.memoryFraction or total executor memory. (3) Enable AQE coalescing to merge small post-spill partitions. Monitor spill with Spark UI → Stages → Shuffle Spill (Memory) and Shuffle Spill (Disk) columns.',
  },
  {
    id: 'oom5',
    title: 'Python UDF memory leak',
    context: 'A PySpark job applies a Python UDF to 500 million rows. The job runs for hours, gradually slowing, then OOMs. Memory usage in Spark UI shows executor memory climbing continuously.',
    question: 'What is the most likely cause and the best fix?',
    options: [
      'Python UDFs are run in a separate Python process per executor — a memory leak in the UDF accumulates over 500 million invocations.',
      'The UDF should be applied with df.map() instead of df.withColumn().',
      'Spark is caching intermediate results — call df.unpersist() between UDF batches.',
      'Python UDFs cannot be applied to more than 100 million rows — use SQL instead.',
    ],
    answer: 0,
    diagnosis: 'Python UDFs run in a Python subprocess (via Py4J). Each invocation serialises data from JVM to Python, runs the UDF, and returns results. A common pattern is a UDF that accumulates state or holds references — a global list or model object that grows with each call. Over 500 million rows, small leaks compound to fatal sizes.',
    fix: 'First choice: rewrite the UDF as a Spark SQL function or use vectorised pandas UDF (F.pandas_udf) — these operate on Arrow batches and are 10–100x faster with far less overhead. Second: if you must use a Python UDF, ensure it is stateless and releases all references. Third: use df.mapPartitions() instead of row-level UDF to amortise the Python process startup cost.',
  },
  {
    id: 'oom6',
    title: 'Cache invalidation and memory pressure',
    context: 'A job caches a 50 GB DataFrame early in the pipeline with df.cache(). Later stages add 4 more cached DataFrames. The job starts spilling and eventually OOMs, even though each individual DataFrame fits in memory.',
    question: 'What is the problem and how do you manage it?',
    options: [
      'DataFrames should use df.persist(StorageLevel.DISK_ONLY) instead of cache() for large DataFrames.',
      'Cache memory is shared — multiple cached DataFrames compete for the storage fraction. Total cached data exceeds available storage memory.',
      'The job should call df.checkpoint() instead of cache() to write to HDFS.',
      'Spark cannot cache more than 2 DataFrames simultaneously — use one cache() at a time.',
    ],
    answer: 1,
    diagnosis: 'Spark divides executor memory into execution fraction (shuffle, sort) and storage fraction (cache). By default, storage is 50% of (total - reserved). Five large caches competing for this pool cause LRU eviction — evicted data must be recomputed, causing cascading slowdowns and eventually execution memory starvation.',
    fix: 'Explicit lifecycle management: call df.unpersist() as soon as the cached DataFrame is no longer needed downstream. Only cache DataFrames that are reused ≥2 times. For DataFrames used once, do not cache. Use df.persist(StorageLevel.MEMORY_AND_DISK) to spill to disk gracefully instead of OOM. Monitor Spark Storage UI tab to see actual cache memory usage.',
  },
]

function OOMDiagnosis() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13.5px', color: 'var(--ink-low)', lineHeight: 1.65, maxWidth: '600px', margin: 0 }}>
        OOM errors in Spark have distinct signatures. Each scenario presents a real failure mode — diagnose the cause and pick the correct fix.
      </p>
      <AccordionMCQ scenarios={OOM_SCENARIOS} accentColor="var(--rose)" storageKey="spark_oom" />
    </div>
  )
}

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'shuffle',   label: 'Shuffle Hell',         icon: '', component: ShuffleHell },
  { id: 'skew',      label: 'Skew Doctor',          icon: '', component: SkewDoctor },
  { id: 'partition', label: 'Partition Tuner',      icon: '', component: PartitionTuner },
  { id: 'broadcast', label: 'Broadcast Joins',      icon: '', component: BroadcastJoinDecisions },
  { id: 'oom',       label: 'OOM Diagnosis',        icon: '', component: OOMDiagnosis },
]

export default function SparkLabTab({ onNavigate }) {
  const [active, setActive] = useState('shuffle')
  const [, forceUpdate] = useState(0)
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? ShuffleHell

  useEffect(() => {
    const goto = localStorage.getItem('msl_goto_module')
    if (goto) {
      const found = MODULES.find(m => m.id === goto)
      if (found) {
        setActive(goto)
        localStorage.removeItem('msl_goto_module')
      }
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--ember) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Spark Lab</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '580px' }}>
          Interactive PySpark execution mechanics. Configure shuffles, diagnose skew, tune partitions, watch jobs fail.
        </p>
        <span style={{ display: 'inline-block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--mint)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 4, padding: '0.15rem 0.5rem', marginTop: '0.5rem', letterSpacing: '0.04em' }}>✓ Real execution</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button onClick={() => setActive(m.id)} className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`} style={{ paddingRight: '8px' }}>{m.label}</button>
            <button onClick={(e) => { e.stopPropagation(); toggleBookmark('spark', m.id, m.label); forceUpdate(n => n+1) }}
              title={isBookmarked('spark', m.id) ? 'Remove bookmark' : 'Bookmark module'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '12px', color: isBookmarked('spark', m.id) ? 'var(--prime)' : 'var(--ink-ghost)', lineHeight: 1 }}>
              {isBookmarked('spark', m.id) ? <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 0.5h8a1 1 0 011 1v11.25l-5-2.917-5 2.917V1.5a1 1 0 011-1z"/></svg> : <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M2 1h8a.5.5 0 01.5.5v11L6 9.75 1.5 12.5V1.5A.5.5 0 012 1z"/></svg>}
            </button>
          </div>
        ))}
      </div>
      <div key={active} className="tab-enter"><ActiveModule /></div>
    </div>
  )
}
