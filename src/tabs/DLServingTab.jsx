import { useState, useMemo } from 'react'

// ─── Shared styles ─────────────────────────────────────────────────────────────
const ACCENT = 'var(--violet)'

const pillBase = {
  padding: '6px 14px',
  borderRadius: '999px',
  fontSize: '13px',
  fontFamily: 'var(--font-sans)',
  fontWeight: 500,
  cursor: 'pointer',
  border: '1.5px solid var(--rim)',
  background: 'transparent',
  color: 'var(--ink-mid)',
  transition: 'all 0.15s ease',
}
const pillActive = {
  ...pillBase,
  background: ACCENT,
  borderColor: ACCENT,
  color: 'var(--white)',
}

function Pill({ label, active, onClick }) {
  return (
    <button style={active ? pillActive : pillBase} onClick={onClick}>
      {label}
    </button>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '680px' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function CodeBlock({ code }) {
  return (
    <pre style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      lineHeight: 1.7,
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderRadius: '8px',
      padding: '14px 16px',
      overflowX: 'auto',
      color: 'var(--ink-mid)',
      margin: 0,
    }}>
      <code>{code}</code>
    </pre>
  )
}

// ─── Module 1: Quantization Tradeoff ──────────────────────────────────────────

const SENSITIVITIES = ['Low', 'Medium', 'High']
const HARDWARES = ['CPU only', 'GPU <16GB VRAM', 'GPU 16–40GB', 'Multi-GPU / A100+']
const LATENCIES = ['Relaxed (>500ms OK)', 'Moderate (100–500ms)', 'Strict (<100ms)']

const CODE_SNIPPETS = {
  fp16: `model = model.half()  # or .to(torch.float16)
# For inference stability with bfloat16:
model = model.to(torch.bfloat16)  # preferred for Ampere+ GPUs`,
  int8: `from transformers import AutoModelForCausalLM
import torch

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    load_in_8bit=True,
    device_map="auto"
)`,
  int4: `from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    "model-id-gptq",   # pre-quantized checkpoint
    device_map="auto",
    torch_dtype=torch.float16
)`,
  int8_dynamic: `import torch
from torch.quantization import quantize_dynamic

# Dynamic INT8 — no calibration data needed
model_int8 = quantize_dynamic(
    model,
    {torch.nn.Linear},
    dtype=torch.qint8
)`,
  fp32: `# FP32 is the default — no changes needed
# Only use for training or debugging
model = model.float()  # explicit cast if needed`,
}

const PRECISIONS = [
  { id: 'fp32',   label: 'FP32' },
  { id: 'fp16',   label: 'FP16/BF16' },
  { id: 'int8d',  label: 'INT8 (dynamic)' },
  { id: 'int8s',  label: 'INT8 (static, calibrated)' },
  { id: 'int4',   label: 'INT4 (GPTQ/AWQ)' },
  { id: 'mixed',  label: 'Mixed precision' },
]

const PRECISION_META = {
  fp32:  { speedup: '1×',    accuracyDelta: '0%',    vramSave: '0%',  codeKey: 'fp32' },
  fp16:  { speedup: '1.5–2×', accuracyDelta: '<0.1%', vramSave: '50%', codeKey: 'fp16' },
  int8d: { speedup: '1.5–3×', accuracyDelta: '0.5–1%', vramSave: '75%', codeKey: 'int8_dynamic' },
  int8s: { speedup: '2–4×',  accuracyDelta: '0.3–0.8%', vramSave: '75%', codeKey: 'int8' },
  int4:  { speedup: '2–5×',  accuracyDelta: '1–3%',  vramSave: '87.5%', codeKey: 'int4' },
  mixed: { speedup: '1.5–2×', accuracyDelta: '<0.1%', vramSave: '40–50%', codeKey: 'fp16' },
}

function getQuantRecommendation(sensitivity, hardware, latency) {
  if (hardware === 'CPU only') {
    return {
      top: 'int8d',
      rank: ['int8d', 'int8s', 'fp32', 'fp16', 'int4', 'mixed'],
      reason: 'CPU has no FP16 hardware acceleration. INT8 dynamic quantization via ONNX Runtime gives the best CPU throughput without requiring calibration data.',
    }
  }
  if (hardware === 'GPU <16GB VRAM') {
    if ((sensitivity === 'Low' || sensitivity === 'Medium') && latency === 'Strict (<100ms)') {
      return {
        top: 'int4',
        rank: ['int4', 'int8s', 'int8d', 'mixed', 'fp16', 'fp32'],
        reason: 'INT4 (GPTQ/AWQ) is the only way to fit large models on sub-16GB GPUs at strict latency. Low/medium sensitivity tasks can absorb the 1–3% accuracy degradation.',
      }
    }
    return {
      top: 'int8s',
      rank: ['int8s', 'int4', 'int8d', 'fp16', 'mixed', 'fp32'],
      reason: 'INT8 static with calibration balances accuracy and memory on small GPUs. Reserve INT4 for the strictest latency or very large models.',
    }
  }
  if (hardware === 'GPU 16–40GB') {
    if (sensitivity === 'High') {
      return {
        top: 'fp16',
        rank: ['fp16', 'mixed', 'int8s', 'int8d', 'int4', 'fp32'],
        reason: "High-stakes tasks (medical, legal, financial) — don't sacrifice accuracy for speed. FP16/BF16 gives 50% VRAM savings with near-zero accuracy loss.",
      }
    }
    if (sensitivity === 'Medium' && (latency === 'Moderate (100–500ms)' || latency === 'Relaxed (>500ms OK)')) {
      return {
        top: 'int8s',
        rank: ['int8s', 'fp16', 'mixed', 'int8d', 'int4', 'fp32'],
        reason: 'INT8 static calibrated on representative data gives the best accuracy/speed balance on mid-tier GPUs for medium-sensitivity workloads.',
      }
    }
    return {
      top: 'fp16',
      rank: ['fp16', 'mixed', 'int8s', 'int8d', 'int4', 'fp32'],
      reason: 'FP16/BF16 is the safe default for 16–40GB GPUs. Good throughput, minimal accuracy cost.',
    }
  }
  // Multi-GPU / A100+
  return {
    top: 'fp16',
    rank: ['fp16', 'mixed', 'int8s', 'int8d', 'int4', 'fp32'],
    reason: 'Multi-GPU clusters have sufficient VRAM. FP16/BF16 with tensor parallelism is the standard approach — latency comes from model parallelism, not quantization.',
  }
}

function QuantModule() {
  const [sensitivity, setSensitivity] = useState('Medium')
  const [hardware, setHardware] = useState('GPU 16–40GB')
  const [latency, setLatency] = useState('Moderate (100–500ms)')

  const rec = useMemo(
    () => getQuantRecommendation(sensitivity, hardware, latency),
    [sensitivity, hardware, latency]
  )

  const topMeta = PRECISION_META[rec.top]
  const topLabel = PRECISIONS.find(p => p.id === rec.top)?.label

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionHeader
        title="Quantization Tradeoff"
        subtitle="Set your constraints. Get a ranked precision recommendation with expected speedup, accuracy delta, and implementation code."
      />

      {/* Parameter selectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { label: 'Task sensitivity', options: SENSITIVITIES, value: sensitivity, set: setSensitivity },
          { label: 'Inference hardware', options: HARDWARES, value: hardware, set: setHardware },
          { label: 'Latency target', options: LATENCIES, value: latency, set: setLatency },
        ].map(({ label, options, value, set }) => (
          <div key={label}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {options.map(opt => (
                <Pill key={opt} label={opt} active={value === opt} onClick={() => set(opt)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ranked list */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
          Ranked recommendations
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rec.rank.map((id, i) => {
            const prec = PRECISIONS.find(p => p.id === id)
            const isTop = i === 0
            return (
              <div key={id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: isTop ? `${ACCENT}18` : 'transparent',
                border: isTop ? `1.5px solid ${ACCENT}` : '1px solid var(--rim)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isTop ? ACCENT : 'var(--ink-low)',
                  minWidth: '20px',
                }}>
                  {i === 0 ? '★' : `${i + 1}`}
                </span>
                <span style={{ fontWeight: isTop ? 700 : 500, color: isTop ? 'var(--ink-hi)' : 'var(--ink-mid)', fontSize: '14px' }}>
                  {prec?.label}
                </span>
                {isTop && (
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: ACCENT, fontFamily: 'var(--font-mono)' }}>
                    recommended
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Top recommendation detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Speedup vs FP32', value: topMeta.speedup, color: 'var(--mint)' },
          { label: 'Accuracy delta', value: topMeta.accuracyDelta, color: 'var(--ember)' },
          { label: 'VRAM savings', value: topMeta.vramSave, color: 'var(--sky)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{value}</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Reasoning callout */}
      <div style={{
        padding: '14px 16px',
        background: `${ACCENT}10`,
        borderLeft: `3px solid ${ACCENT}`,
        borderRadius: '0 8px 8px 0',
        fontSize: '13px',
        color: 'var(--ink-mid)',
        lineHeight: 1.7,
      }}>
        <strong style={{ color: 'var(--ink-hi)' }}>Why {topLabel}?</strong> {rec.reason}
      </div>

      {/* Code snippet */}
      <div>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Implementation ({topLabel})
        </div>
        <CodeBlock code={CODE_SNIPPETS[topMeta.codeKey]} />
      </div>
    </div>
  )
}

// ─── Module 2: GPU Memory Calculator ──────────────────────────────────────────

const PARAM_PRESETS = ['125M', '1.3B', '7B', '13B', '70B', 'Custom']
const PRECISION_BYTES = { 'FP32': 4, 'FP16/BF16': 2, 'INT8': 1, 'INT4': 0.5 }
const BATCH_SIZES = [1, 4, 8, 16, 32]
const SEQ_LENGTHS = [512, 1024, 2048, 4096, 8192]
const MODES = ['Inference only', 'Training (with Adam optimizer)']

const GPU_TIERS = [
  { label: 'RTX 3070',      vram: 8 },
  { label: 'RTX 4080',      vram: 16 },
  { label: 'RTX 4090/A10',  vram: 24 },
  { label: 'A100-40',       vram: 40 },
  { label: 'A100-80/H100',  vram: 80 },
]

function parseParams(str) {
  if (!str) return 0
  const s = str.replace(/,/g, '').toUpperCase()
  if (s.endsWith('B')) return parseFloat(s) * 1e9
  if (s.endsWith('M')) return parseFloat(s) * 1e6
  return parseFloat(s) || 0
}

function estimateLayers(params) {
  if (params <= 125e6) return 12
  if (params <= 350e6) return 24
  if (params <= 1.3e9) return 24
  if (params <= 7e9) return 32
  if (params <= 13e9) return 40
  if (params <= 30e9) return 60
  return 80
}

function fmtGB(bytes) {
  return (bytes / 1e9).toFixed(2) + ' GB'
}

function MemoryModule() {
  const [paramPreset, setParamPreset] = useState('7B')
  const [customParams, setCustomParams] = useState('')
  const [precision, setPrecision] = useState('FP16/BF16')
  const [batchSize, setBatchSize] = useState(1)
  const [seqLen, setSeqLen] = useState(2048)
  const [mode, setMode] = useState('Inference only')

  const params = useMemo(() => {
    if (paramPreset === 'Custom') return parseParams(customParams)
    return parseParams(paramPreset)
  }, [paramPreset, customParams])

  const bytesPerParam = PRECISION_BYTES[precision] ?? 2

  const memory = useMemo(() => {
    if (!params) return null
    const nLayers = estimateLayers(params)
    const nHeads = nLayers <= 24 ? 16 : nLayers <= 40 ? 32 : 64
    const headDim = 64

    const modelWeights = params * bytesPerParam
    // KV cache: 2 tensors × layers × heads × head_dim × seq_len × batch × bytes
    const kvCache = 2 * nLayers * nHeads * headDim * seqLen * batchSize * bytesPerParam
    const activations = mode === 'Training (with Adam optimizer)' ? 2 * modelWeights : modelWeights * 0.1
    const optimizerStates = mode === 'Training (with Adam optimizer)' ? 3 * modelWeights : 0
    const total = modelWeights + kvCache + activations + optimizerStates

    return { modelWeights, kvCache, activations, optimizerStates, total, nLayers }
  }, [params, bytesPerParam, seqLen, batchSize, mode])

  const int4Estimate = useMemo(() => {
    if (!params) return null
    const nLayers = estimateLayers(params)
    const nHeads = nLayers <= 24 ? 16 : nLayers <= 40 ? 32 : 64
    const headDim = 64
    const mw = params * 0.5
    const kv = 2 * nLayers * nHeads * headDim * seqLen * batchSize * 0.5
    return mw + kv + mw * 0.1
  }, [params, seqLen, batchSize])

  const noGPUFits = memory && GPU_TIERS.every(g => g.vram * 1e9 < memory.total)
  const gpuCount = memory ? Math.ceil(memory.total / (80 * 1e9)) : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionHeader
        title="GPU Memory Calculator"
        subtitle="Will this fit? Configure your model and serving scenario to see a full memory breakdown, GPU tier compatibility, and options when it doesn't fit."
      />

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Model parameters */}
        <div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Model parameters
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PARAM_PRESETS.map(p => (
              <Pill key={p} label={p} active={paramPreset === p} onClick={() => setParamPreset(p)} />
            ))}
          </div>
          {paramPreset === 'Custom' && (
            <input
              type="text"
              placeholder="e.g. 6.7B or 345M"
              value={customParams}
              onChange={e => setCustomParams(e.target.value)}
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1.5px solid var(--rim)',
                background: 'var(--surface)',
                color: 'var(--ink-hi)',
                width: '200px',
                outline: 'none',
              }}
            />
          )}
        </div>

        {/* Precision */}
        <div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Precision
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.keys(PRECISION_BYTES).map(p => (
              <Pill key={p} label={p} active={precision === p} onClick={() => setPrecision(p)} />
            ))}
          </div>
        </div>

        {/* Batch size + Seq length side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Batch size
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {BATCH_SIZES.map(b => (
                <Pill key={b} label={String(b)} active={batchSize === b} onClick={() => setBatchSize(b)} />
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sequence length
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SEQ_LENGTHS.map(s => (
                <Pill key={s} label={String(s)} active={seqLen === s} onClick={() => setSeqLen(s)} />
              ))}
            </div>
          </div>
        </div>

        {/* Mode */}
        <div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Mode
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {MODES.map(m => (
              <Pill key={m} label={m} active={mode === m} onClick={() => setMode(m)} />
            ))}
          </div>
        </div>
      </div>

      {/* KV cache quadratic warning */}
      {seqLen > 2048 && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--ember)18',
          borderLeft: '3px solid var(--ember)',
          borderRadius: '0 8px 8px 0',
          fontSize: '13px',
          color: 'var(--ink-mid)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--ember)' }}>KV cache grows quadratically with sequence length.</strong>{' '}
          At {seqLen.toLocaleString()} tokens the KV cache is {(seqLen / 2048).toFixed(1)}× larger than at 2048. Long contexts are the #1 cause of OOM in LLM serving.
        </div>
      )}

      {/* Memory breakdown */}
      {memory && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
            Memory breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Model weights', value: memory.modelWeights, note: `${params.toExponential(2)} params × ${bytesPerParam} bytes` },
              { label: 'KV cache', value: memory.kvCache, note: `batch ${batchSize} × seq ${seqLen.toLocaleString()} × ${estimateLayers(params)} layers` },
              ...(mode === 'Training (with Adam optimizer)' ? [
                { label: 'Activations (training)', value: memory.activations, note: '≈ 2× model weights' },
                { label: 'Optimizer states (Adam)', value: memory.optimizerStates, note: '≈ 3× model weights in FP32' },
              ] : [
                { label: 'Activations (inference)', value: memory.activations, note: '≈ 10% of model weights' },
              ]),
            ].map(({ label, value, note }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--rim)' }}>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--ink-hi)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--ink-low)', marginLeft: '10px', fontFamily: 'var(--font-mono)' }}>{note}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--ink-hi)', minWidth: '90px', textAlign: 'right' }}>
                  {fmtGB(value)}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: ACCENT }}>
                {fmtGB(memory.total)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* GPU tier bar */}
      {memory && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
            GPU VRAM compatibility
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {GPU_TIERS.map(({ label, vram }) => {
              const fits = vram * 1e9 >= memory.total
              const pct = Math.min(100, (memory.total / (vram * 1e9)) * 100)
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--ink-mid)', minWidth: '130px', fontFamily: 'var(--font-sans)' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', minWidth: '40px' }}>
                    {vram}GB
                  </span>
                  <div style={{ flex: 1, height: '10px', borderRadius: '999px', background: 'var(--rim)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: '999px',
                      background: fits ? 'var(--mint)' : 'var(--rose)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: fits ? 'var(--mint)' : 'var(--rose)', minWidth: '50px', textAlign: 'right' }}>
                    {fits ? 'fits' : 'no fit'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Options when nothing fits */}
      {noGPUFits && int4Estimate && (
        <div style={{
          padding: '16px',
          background: 'var(--rose)12',
          border: '1.5px solid var(--rose)',
          borderRadius: '10px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--rose)', marginBottom: '10px' }}>
            Does not fit on any single GPU — your options:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7 }}>
            <div>
              <strong style={{ color: 'var(--ink-hi)' }}>1. Use INT4 quantization</strong> → estimated{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: ACCENT }}>{fmtGB(int4Estimate)}</span>
              {int4Estimate < 80e9 ? ` — fits on A100-80/H100` : ` — still requires multi-GPU`}
            </div>
            <div>
              <strong style={{ color: 'var(--ink-hi)' }}>2. Tensor parallelism</strong> → split across{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: ACCENT }}>{gpuCount}× A100-80GB</span>
              {' '}GPUs using NVLink
            </div>
            <div>
              <strong style={{ color: 'var(--ink-hi)' }}>3. CPU offloading</strong> → possible via Accelerate/DeepSpeed, expect 5–10× latency penalty
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Module 3: Serving Architecture ───────────────────────────────────────────

const ARCHITECTURES = [
  'Single model instance, synchronous',
  'Dynamic batching (batch requests, fixed max_batch_size)',
  'Continuous batching (vLLM-style, token-level scheduling)',
  'Model parallelism (tensor parallel across GPUs)',
  'Pipeline parallelism (layers split across GPUs)',
  'Speculative decoding (draft model + verifier)',
]

const SCENARIOS = [
  {
    id: 's1',
    title: 'LLM chatbot, 100 concurrent users',
    tags: ['LLM', 'High concurrency', 'A100-80GB'],
    detail: 'Model: Llama 13B. p99 < 2s SLA. Single A100-80GB. Autoregressive generation.',
    answer: 'Continuous batching (vLLM-style, token-level scheduling)',
    reasoning: 'Token-level scheduling maximises GPU utilisation. With 100 concurrent users and autoregressive decoding, dynamic batching stalls — it waits for the slowest request in a batch before advancing. vLLM-style continuous batching interleaves tokens from all active requests, keeping the GPU busy at all times.',
    tradeoff: 'Dynamic batching at sequence level wastes GPU cycles waiting for the slowest request in each batch.',
  },
  {
    id: 's2',
    title: 'Image classification API, 50k req/min',
    tags: ['CV', 'High throughput', '4× A10'],
    detail: 'Model: EfficientNet-B4. Latency < 50ms. 4× A10 GPUs. Fixed-shape inputs.',
    answer: 'Dynamic batching (batch requests, fixed max_batch_size)',
    reasoning: 'Fixed-shape inputs batch efficiently with zero padding overhead. NVIDIA Triton with max_queue_delay tuning saturates GPU compute. The model fits easily on one GPU — there is no need for model parallelism. Run one instance per GPU.',
    tradeoff: 'Continuous batching adds complexity without benefit for non-autoregressive, fixed-shape workloads.',
  },
  {
    id: 's3',
    title: '70B LLM, internal tool, 2× A100-80GB',
    tags: ['LLM', 'Model too large', 'Single request'],
    detail: 'Model does not fit on one GPU. Internal tool — single request at a time.',
    answer: 'Model parallelism (tensor parallel across GPUs)',
    reasoning: 'Tensor parallelism splits attention heads across both GPUs, keeping inter-GPU communication at the attention layer level. For single requests, tensor parallel gives lower latency than pipeline parallel because pipeline parallel has pipeline bubbles (GPU idle time waiting for the previous stage).',
    tradeoff: 'Pipeline parallelism is better for throughput-oriented workloads, not single-request latency.',
  },
  {
    id: 's4',
    title: 'Real-time recommendation scoring, 1M req/day',
    tags: ['Embeddings', 'p99 < 10ms', 'BERT-base'],
    detail: 'Embedding model only (BERT-base, 110M params). p99 < 10ms. No autoregressive decoding.',
    answer: 'Single model instance, synchronous',
    reasoning: 'BERT-base is tiny. At 10ms p99, batching latency overhead exceeds any throughput benefit. Just serve fast with INT8 quantization. Batching increases queueing delay and variability — the opposite of what you need at this latency target.',
    tradeoff: 'INT8 quantization on the side cuts compute cost without any architectural complexity.',
  },
  {
    id: 's5',
    title: 'Code completion (Copilot-style), low TTFT target',
    tags: ['LLM', 'Low TTFT', 'Code'],
    detail: 'Short prompts. Low time-to-first-token required. Small draft answers acceptable if occasionally wrong.',
    answer: 'Speculative decoding (draft model + verifier)',
    reasoning: 'A small draft model (e.g. CodeT5-small) proposes several tokens in parallel. The large verifier model checks them in a single forward pass. Accepted tokens arrive much earlier, slashing TTFT. The accuracy cost is bounded — the verifier rejects bad draft tokens.',
    tradeoff: 'Requires maintaining two models and adds complexity. Best when TTFT matters more than throughput.',
  },
  {
    id: 's6',
    title: 'Multi-modal model, 50B params, 8× H100 batch jobs',
    tags: ['Multi-modal', '8× H100', 'Throughput'],
    detail: 'Vision encoder + LLM decoder. Maximise throughput for offline batch inference.',
    answer: 'Pipeline parallelism (layers split across GPUs)',
    reasoning: 'Split the vision encoder on the first 4 GPUs and the LLM decoder on the last 4. Pipeline parallelism minimises inter-GPU communication for non-interactive workloads — each stage receives activations once per forward pass. For batch jobs, pipeline bubbles are amortised over large batch queues.',
    tradeoff: 'Tensor parallel requires all-reduce communication at every attention layer — expensive at 8-GPU scale for throughput jobs.',
  },
]

function ServingModule() {
  const [selected, setSelected] = useState(null)
  const [picks, setPicks] = useState({})
  const [revealed, setRevealed] = useState({})

  function handlePick(scenarioId, arch) {
    setPicks(p => ({ ...p, [scenarioId]: arch }))
    setRevealed(r => ({ ...r, [scenarioId]: false }))
    setSelected(scenarioId)
  }

  function handleReveal(scenarioId) {
    setRevealed(r => ({ ...r, [scenarioId]: true }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionHeader
        title="Serving Architecture"
        subtitle="Six production scenarios. Given the serving requirements, pick the right architecture — then reveal the reasoning and the tradeoff you traded away."
      />

      {SCENARIOS.map(scenario => {
        const pick = picks[scenario.id]
        const isRevealed = !!revealed[scenario.id]
        const isCorrect = pick === scenario.answer

        return (
          <div key={scenario.id} className="card" style={{ padding: '20px' }}>
            {/* Scenario header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>
                  {scenario.title}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {scenario.tags.map(t => (
                    <span key={t} style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: `${ACCENT}15`,
                      color: ACCENT,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6, marginBottom: '14px' }}>
              {scenario.detail}
            </p>

            {/* Architecture picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
              {ARCHITECTURES.map(arch => {
                const isPicked = pick === arch
                const isAnswer = arch === scenario.answer
                let borderColor = 'var(--rim)'
                let bg = 'transparent'
                let textColor = 'var(--ink-mid)'

                if (isRevealed) {
                  if (isAnswer) { borderColor = 'var(--mint)'; bg = 'var(--mint)18'; textColor = 'var(--ink-hi)' }
                  else if (isPicked && !isAnswer) { borderColor = 'var(--rose)'; bg = 'var(--rose)12'; textColor = 'var(--ink-mid)' }
                } else if (isPicked) {
                  borderColor = ACCENT; bg = `${ACCENT}18`; textColor = 'var(--ink-hi)'
                }

                return (
                  <button
                    key={arch}
                    onClick={() => handlePick(scenario.id, arch)}
                    style={{
                      textAlign: 'left',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: `1.5px solid ${borderColor}`,
                      background: bg,
                      color: textColor,
                      fontSize: '13px',
                      fontFamily: 'var(--font-sans)',
                      cursor: 'pointer',
                      fontWeight: isPicked || (isRevealed && isAnswer) ? 600 : 400,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {isRevealed && isAnswer && <span style={{ color: 'var(--mint)' }}>✓</span>}
                    {isRevealed && isPicked && !isAnswer && <span style={{ color: 'var(--rose)' }}>✗</span>}
                    {arch}
                  </button>
                )
              })}
            </div>

            {/* Reveal button */}
            {pick && !isRevealed && (
              <button
                className="btn-primary"
                onClick={() => handleReveal(scenario.id)}
                style={{ fontSize: '13px', padding: '8px 18px' }}
              >
                Reveal reasoning
              </button>
            )}

            {/* Reveal panel */}
            {isRevealed && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  padding: '12px 14px',
                  background: isCorrect ? 'var(--mint)12' : 'var(--rose)10',
                  borderLeft: `3px solid ${isCorrect ? 'var(--mint)' : 'var(--rose)'}`,
                  borderRadius: '0 8px 8px 0',
                  fontSize: '13px',
                  color: 'var(--ink-hi)',
                  fontWeight: 600,
                }}>
                  {isCorrect ? '✓ Correct.' : `✗ Not quite. Correct: ${scenario.answer}`}
                </div>
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--rim)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--ink-mid)',
                  lineHeight: 1.7,
                }}>
                  <strong style={{ color: 'var(--ink-hi)' }}>Why: </strong>{scenario.reasoning}
                </div>
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--ember)10',
                  borderLeft: '3px solid var(--ember)',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '12px',
                  color: 'var(--ink-mid)',
                  lineHeight: 1.6,
                }}>
                  <strong style={{ color: 'var(--ember)' }}>Tradeoff: </strong>{scenario.tradeoff}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Module nav config ─────────────────────────────────────────────────────────
const MODULES = [
  { id: 'quant',   icon: '🔢', label: 'Quantization Tradeoff',  Component: QuantModule },
  { id: 'memory',  icon: '🧮', label: 'GPU Memory Calculator',  Component: MemoryModule },
  { id: 'serving', icon: '🏗',  label: 'Serving Architecture',   Component: ServingModule },
]

// ─── Tab shell ─────────────────────────────────────────────────────────────────
export default function DLServingTab({ onNavigate }) {
  const [activeModule, setActiveModule] = useState('quant')
  const active = MODULES.find(m => m.id === activeModule)
  const ActiveComponent = active?.Component

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div className="animate-slide-up">
        <div className="eyebrow" style={{ color: ACCENT, marginBottom: '8px' }}>
          Deep Learning · Production Serving
        </div>
        <h2 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--ink-hi)',
          letterSpacing: '-0.03em',
          marginBottom: '10px',
        }}>
          Production Serving
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '640px' }}>
          The model works in notebooks. It fails in production at p99. Quantization decisions, memory math, and serving architecture — before your first oncall.
        </p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveModule(m.id)}
            style={{
              ...(activeModule === m.id ? pillActive : pillBase),
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontSize: '13px',
              padding: '8px 16px',
            }}
          >
            
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Active module */}
      <div className="animate-slide-up">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}
