import { useState } from 'react'
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

  const statusBg    = result?.oomRisk ? 'rgba(244,63,94,0.08)'    : result?.spillRisk ? 'rgba(245,158,11,0.08)'  : result?.healthy ? 'rgba(16,185,129,0.08)'    : 'rgba(255,255,255,0.03)'
  const statusBorder = result?.oomRisk ? 'rgba(244,63,94,0.3)'    : result?.spillRisk ? 'rgba(245,158,11,0.3)'  : result?.healthy ? 'rgba(16,185,129,0.3)'    : 'var(--rim)'
  const statusMsg    = result?.oomRisk ? '💥 JOB FAILED — OutOfMemoryError' : result?.spillRisk ? '⚠ Significant spill to disk' : result?.healthy ? '✅ Job looks healthy' : '🟡 Suboptimal — will run'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Shuffle Hell</h3>
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
            <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '10px' }}>
              {c.label}: <span style={{ color: c.warn ? 'var(--rose)' : 'var(--violet)', fontWeight: 600 }}>{c.value}{c.unit}</span>
            </label>
            <input type="range" min={c.min} max={c.max} step={c.step} value={c.value} onChange={e => { c.set(+e.target.value); setResult(null) }} />
          </div>
        ))}
      </div>

      {/* Join strategy */}
      <div className="card" style={{ padding: '16px' }}>
        <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '12px' }}>Join strategy hint</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { val: 'sort_merge', label: 'Sort-Merge', desc: 'Default. Always works. Full shuffle.' },
            { val: 'broadcast',  label: 'Broadcast Hash', desc: 'No shuffle. Right table must fit in memory.' },
          ].map(opt => (
            <button key={opt.val} onClick={() => { setJoinStrategy(opt.val); setResult(null) }}
              style={{ flex: 1, minWidth: '180px', padding: '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', border: `1px solid ${joinStrategy === opt.val ? 'rgba(240,165,0,0.4)' : 'var(--rim)'}`, background: joinStrategy === opt.val ? 'rgba(240,165,0,0.07)' : 'var(--void)', transition: 'all 0.15s' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '4px' }}>{opt.label}</div>
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
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", marginBottom: '12px' }}>Execution DAG — task duration distribution</div>
            <DagVis result={result} partitions={partitions} />
          </div>

          <div style={{ background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: '12px', padding: '18px' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: '13px', marginBottom: '14px', color: 'var(--ink-hi)' }}>{statusMsg}</div>
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
                  <div style={{ fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: m.warn ? 'var(--rose)' : m.good ? 'var(--mint)' : 'var(--ink-hi)' }}>{m.value}</div>
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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Skew Doctor</h3>
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
          <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>Task duration (Stage: shuffle read → aggregate)</span>
          <span style={{ fontSize: '13px', fontFamily: "'JetBrains Mono',monospace', fontWeight: 600, color: +skewRatio > 10 ? 'var(--rose)' : +skewRatio > 3 ? 'var(--gold)' : 'var(--mint)'" }}>
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
              style={{ textAlign: 'left', cursor: 'pointer', border: `1px solid ${fix === k ? 'rgba(240,165,0,0.4)' : 'var(--rim)'}`, background: fix === k ? 'rgba(240,165,0,0.07)' : 'var(--depth)', transition: 'all 0.15s', padding: '14px' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '8px' }}>{v.label}</div>
              <div className="code-block" style={{ fontSize: '11px', padding: '8px', whiteSpace: 'pre-wrap' }}>{v.code}</div>
            </button>
          ))}
        </div>
      </div>

      {revealed && fix && fixedDist && (
        <div className="card animate-slide-up" style={{ padding: '16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '15px', color: 'var(--mint)', marginBottom: '12px' }}>After fix: {FIXES[fix].label}</div>
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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Partition Tuner</h3>
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
                <span style={{ color: 'var(--ink-mid)', fontFamily: "'JetBrains Mono',monospace" }}>{val}{unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(Number(e.target.value))} />
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)' }}>Recommendation</div>

          <div style={{ padding: '16px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', marginBottom: '4px' }}>
              spark.sql.shuffle.partitions
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: 'var(--mint)' }}>
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
              <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--ink-mid)', fontSize: '12px' }}>{v} <span style={{ color: isSmall && k==='Partition size' ? 'var(--ember)' : isLarge && k==='Partition size' ? 'var(--rose)' : 'var(--ink-ghost)', fontSize: '11px' }}>{hint}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Partition size distribution */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '4px' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ink-ghost)', marginTop: '6px', fontFamily: "'JetBrains Mono',monospace" }}>
          <span>partition 1</span>
          <span style={{ color: partSizeMB < 64 ? 'var(--ember)' : partSizeMB > 256 ? 'var(--rose)' : 'var(--mint)' }}>
            avg {partSizeMB.toFixed(0)} MB {isSmall ? '← too small' : isLarge ? '← too large' : '← good'}
          </span>
          <span>partition {barHeights.length}</span>
        </div>
      </div>

      {/* Tips */}
      <div className="card" style={{ padding: '16px 20px', background: 'rgba(249,115,22,0.04)', borderColor: 'rgba(249,115,22,0.2)' }}>
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

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'shuffle',   label: 'Shuffle Hell',    icon: '🌪', component: ShuffleHell },
  { id: 'skew',      label: 'Skew Doctor',     icon: '🩺', component: SkewDoctor },
  { id: 'partition', label: 'Partition Tuner', icon: '⚡', component: PartitionTuner },
]

export default function SparkLabTab() {
  const [active, setActive] = useState('shuffle')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? ShuffleHell

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>Spark Lab</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '580px' }}>
          Interactive PySpark execution mechanics. Configure shuffles, diagnose skew, tune partitions, watch jobs fail.
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
