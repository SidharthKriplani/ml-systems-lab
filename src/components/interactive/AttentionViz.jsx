import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react'

// Self-attention that ACTUALLY computes: pick a query token, adjust its vector,
// and watch score = q·kⱼ/√d → softmax → weights → output = Σ wⱼ·vⱼ update live.
// Toggles for √d scaling (why we divide) and the causal mask (GPT vs BERT).
// Simplification (noted in UI): Q = K = V = the token embedding (no learned W).

const TOKENS = ['The', 'cat', 'sat', 'on', 'mat']
const D = 4
// Hand-picked so structure is visible: "cat" and "mat" are similar → attend to each other.
const EMB = {
  The: [0.9, 0.1, 0.1, 0.2],
  cat: [0.2, 0.9, 0.3, 0.1],
  sat: [0.1, 0.3, 0.9, 0.2],
  on:  [0.3, 0.1, 0.2, 0.8],
  mat: [0.2, 0.8, 0.2, 0.3],
}
const K = TOKENS.map(t => EMB[t])           // keys  = embeddings
const V = TOKENS.map(t => EMB[t])           // values = embeddings
const SQRT_D = Math.sqrt(D)

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
function softmax(xs) {
  const m = Math.max(...xs.filter(v => v > -Infinity))
  const e = xs.map(v => (v === -Infinity ? 0 : Math.exp(v - m)))
  const s = e.reduce((a, b) => a + b, 0) || 1
  return e.map(v => v / s)
}

const heat = (w) => `rgba(240,182,20,${(w * 0.9 + 0.05).toFixed(3)})`

export const AttentionViz = forwardRef(function AttentionViz(props, ref) {
  const [qi, setQi] = useState(1)                 // selected query token (cat)
  const [q, setQ] = useState([...EMB[TOKENS[1]]])  // editable query vector
  const [scaled, setScaled] = useState(true)
  const [causal, setCausal] = useState(false)

  const selectToken = useCallback((i) => { setQi(i); setQ([...EMB[TOKENS[i]]]) }, [])
  const reset = useCallback(() => { setQi(1); setQ([...EMB[TOKENS[1]]]); setScaled(true); setCausal(false) }, [])
  useImperativeHandle(ref, () => ({ reset }), [reset])

  const setDim = (d, v) => setQ(prev => { const n = [...prev]; n[d] = v; return n })

  // query vector per row: selected row uses the (editable) q; others use their embedding
  const queries = TOKENS.map((t, i) => (i === qi ? q : EMB[t]))

  const matrix = useMemo(() => queries.map((qv, i) => {
    const raw = K.map((k, j) => {
      if (causal && j > i) return -Infinity
      return dot(qv, k) / (scaled ? SQRT_D : 1)
    })
    return softmax(raw)
  }), [queries, scaled, causal])

  // detail for the selected query row
  const rawScores = K.map((k, j) => (causal && j > qi) ? -Infinity : dot(q, k) / (scaled ? SQRT_D : 1))
  const weights = softmax(rawScores)
  const output = Array.from({ length: D }, (_, d) => weights.reduce((s, w, j) => s + w * V[j][d], 0))

  const btn = (active) => ({
    padding: '8px 12px', minHeight: 36, borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'var(--font-sans)',
    fontWeight: active ? 700 : 500, background: active ? 'var(--prime)' : 'var(--depth)',
    color: active ? '#000' : 'var(--ink-mid)', border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
  })

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      {/* query selector + toggles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--ink-low)' }}>query:</span>
        {TOKENS.map((t, i) => <button key={t} style={btn(qi === i)} onClick={() => selectToken(i)}>{t}</button>)}
        <span style={{ flex: 1 }} />
        <button style={btn(scaled)} onClick={() => setScaled(s => !s)}>÷√d</button>
        <button style={btn(causal)} onClick={() => setCausal(c => !c)}>{causal ? 'causal (GPT)' : 'full (BERT)'}</button>
      </div>

      {/* editable query vector */}
      <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)', marginBottom: 6 }}>
          query vector q for <b style={{ color: 'var(--prime)' }}>{TOKENS[qi]}</b> — drag to change what it looks for
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {q.map((v, d) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>q{d + 1}</span>
              <input type="range" min={0} max={1} step={0.05} value={v} onChange={e => setDim(d, +e.target.value)} style={{ width: 74 }} />
              <span style={{ fontSize: '0.62rem', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)', width: 26 }}>{v.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* full attention matrix */}
        <div>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-low)', marginBottom: 5 }}>attention weights (row → cols)</div>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead><tr><th></th>{TOKENS.map(t => <th key={t} style={{ fontSize: '0.62rem', color: 'var(--ink-low)', fontWeight: 500, padding: '0 3px' }}>{t}</th>)}</tr></thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '0.66rem', color: i === qi ? 'var(--prime)' : 'var(--ink-low)', fontWeight: i === qi ? 700 : 500, paddingRight: 5, textAlign: 'right' }}>{TOKENS[i]}</td>
                  {row.map((w, j) => {
                    const masked = causal && j > i
                    return <td key={j} title={`${TOKENS[i]}→${TOKENS[j]}: ${w.toFixed(2)}`} style={{
                      width: 34, height: 26, textAlign: 'center', fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                      color: w > 0.5 ? '#000' : 'var(--ink-hi)', background: masked ? 'transparent' : heat(w),
                      border: i === qi ? '1px solid var(--prime)' : '1px solid var(--rim)' }}>{masked ? '·' : w.toFixed(2)}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* selected-row pipeline */}
        <div style={{ minWidth: 190 }}>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-low)', marginBottom: 5 }}>{TOKENS[qi]} → each key</div>
          {TOKENS.map((t, j) => {
            const masked = causal && j > qi
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, opacity: masked ? 0.35 : 1 }}>
                <span style={{ width: 26, fontSize: '0.66rem', textAlign: 'right', color: 'var(--ink-mid)' }}>{t}</span>
                <span style={{ width: 60, fontSize: '0.58rem', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>
                  {masked ? '−∞' : (dot(q, K[j]) / (scaled ? SQRT_D : 1)).toFixed(2)}
                </span>
                <div style={{ flex: 1, height: 12, background: 'var(--depth)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${weights[j] * 100}%`, height: '100%', background: 'var(--prime)' }} />
                </div>
                <span style={{ width: 30, fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)' }}>{weights[j].toFixed(2)}</span>
              </div>
            )
          })}
          <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--rim)', fontSize: '0.62rem', color: 'var(--ink-low)' }}>
            output = Σ wⱼ·vⱼ = [{output.map(x => x.toFixed(2)).join(', ')}]
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 12, lineHeight: 1.5 }}>
        Turn <b>÷√d</b> off: raw dot products grow with dimension, the softmax saturates onto one token, and gradients
        to the rest vanish — that's why attention divides by √d. Turn on <b>causal</b>: each token can only see itself and
        the past (upper triangle → −∞ → 0), the difference between BERT (sees all) and GPT (generates left-to-right).
        Real attention learns separate Wq/Wk/Wv projections and runs several heads in parallel; here Q=K=V=embedding so the mechanism is visible.
      </div>
    </div>
  )
})
