import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react'

// A single Transformer block's forward pass, computed live -- not a canned
// animation. Fixed, hand-picked weights (same "illustrative toy" convention
// as AttentionViz.jsx and the attention module's bank/river worked example --
// not a trained model; the point is to make the MECHANICS traceable, the way
// RingWarpViz's point was to show real TRAINING dynamics). Follows the exact
// block this module's own [FIGURE: transformer_block] diagram describes:
// LayerNorm -> Multi-Head Attention -> residual add -> LayerNorm -> FFN (4x
// wide) -> residual add -- Pre-LN, matching the module's stated modern
// default. Toggling encoder/decoder mode re-applies (or removes) the causal
// mask and recomputes everything downstream live, so the same architecture
// visibly produces the two different attention patterns the module's text
// describes.
//
// Design note on the two heads: Wq1=Wk1 (scaled) so head 1 leans toward
// "attend to tokens with similar embeddings to yourself"; head 2 uses an
// independent random projection so it picks up a different, less localized
// pattern -- concretely different attention weights per head, the point
// multi-head attention is making, verified by inspecting the actual computed
// matrices (not assumed) before shipping.

const TOKENS = ['The', 'cat', 'sat', 'down']
const N = 4
const D = 4

const W = {"TOKENS":["The","cat","sat","down"],"EMB":[[0.9,0.1,0.0,0.2],[0.1,0.9,0.2,0.1],[0.2,0.2,0.9,0.1],[0.1,0.3,0.2,0.9]],"PE":[[0.0,0.3,0.0,0.3],[0.252441,0.162091,0.003,0.299985],[0.272789,-0.124844,0.006,0.29994],[0.042336,-0.296998,0.008999,0.299865]],"Wq1":[[0.8,0.0],[0.0,0.8],[0.0,0.0],[0.0,0.0]],"Wk1":[[0.8,0.0],[0.0,0.8],[0.0,0.0],[0.0,0.0]],"Wv1":[[0.0,0.0],[0.0,0.0],[1.0,0.0],[0.0,1.0]],"Wq2":[[1.02046,-1.277833],[0.209049,-0.283885],[-0.226325,-0.107799],[-1.009993,-0.115966]],"Wk2":[[-0.432607,1.6615],[0.112893,-0.176315],[-0.140644,-0.334023],[-0.527575,-0.1954]],"Wv2":[[1.0,0.0],[0.0,1.0],[0.0,0.0],[0.0,0.0]],"Wo":[[1.0,0.0,0.0,0.0],[0.0,1.0,0.0,0.0],[0.0,0.0,1.0,0.0],[0.0,0.0,0.0,1.0]],"W1":[[0.000615,0.149373,-0.137069,-0.445296,-0.227335,-0.495823,0.030072,0.670108,-0.246103,-0.310237,0.244921,0.178444,0.052707,-0.465234,-0.014626,0.347652],[-0.672107,-0.228808,-0.950611,-0.644769,-0.920868,-0.117546,-0.633723,0.135632,0.078376,-0.093465,-1.25838,-0.269346,-0.02425,0.056654,-0.765068,-0.238877],[-0.48926,-0.404419,0.530449,-0.403767,-0.016261,0.442195,-0.2918,-0.055851,0.055232,0.031891,-0.612528,0.03807,0.679412,-0.773572,0.429691,0.059677],[-0.320735,1.000208,0.38113,-0.599644,0.037258,0.288345,-0.094391,0.341455,-0.033259,0.333624,0.719261,-0.337831,0.101569,-0.231654,0.063634,-0.593597]],"b1":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"W2":[[-0.17379,-0.058859,0.269629,0.343567],[-0.397058,-0.238393,0.194071,-0.597726],[-0.138951,-0.029186,0.377104,0.206821],[-0.098164,-0.110573,-0.075059,0.457059],[-0.128407,-0.091104,0.105777,-0.036231],[-0.059185,-0.33422,-0.003456,-0.133074],[0.349838,0.195927,-0.007243,0.200514],[-0.101961,0.315638,-0.00162,0.175015],[-0.387268,0.104004,-0.506461,-0.610599],[-0.091343,-0.269978,0.049216,0.673427],[-0.249517,-0.187183,0.061621,0.147904],[-0.052922,-0.061779,0.210739,0.155972],[-0.310103,-0.023754,0.010586,-0.316345],[0.077952,-0.257387,0.29162,0.057824],[0.026792,-0.177309,-0.035583,-0.599324],[-0.339422,0.108852,-0.63857,0.253983]],"b2":[0.0,0.0,0.0,0.0]}


function layernorm(x) {
  const mu = x.reduce((a, b) => a + b, 0) / x.length
  const variance = x.reduce((a, b) => a + (b - mu) * (b - mu), 0) / x.length
  return x.map(v => (v - mu) / Math.sqrt(variance + 1e-5))
}
function matmulRow(row, mat) {
  // row: [inDim], mat: [inDim][outDim] -> [outDim]
  const outDim = mat[0].length
  const out = new Array(outDim).fill(0)
  for (let j = 0; j < outDim; j++) {
    let s = 0
    for (let i = 0; i < row.length; i++) s += row[i] * mat[i][j]
    out[j] = s
  }
  return out
}
function dot(a, b) { return a.reduce((s, x, i) => s + x * b[i], 0) }
function softmaxRow(xs) {
  const finite = xs.filter(v => v > -Infinity)
  const m = finite.length ? Math.max(...finite) : 0
  const e = xs.map(v => (v === -Infinity ? 0 : Math.exp(v - m)))
  const s = e.reduce((a, b) => a + b, 0) || 1
  return e.map(v => v / s)
}
function addVec(a, b) { return a.map((v, i) => v + b[i]) }

// x0: embeddings + positional encoding, per token -- fixed, precomputed.
const X0 = TOKENS.map((_, i) => addVec(W.EMB[i], W.PE[i]))

function headAttention(ln1, Wq, Wk, Wv, causal) {
  const Q = ln1.map(row => matmulRow(row, Wq))
  const K = ln1.map(row => matmulRow(row, Wk))
  const V = ln1.map(row => matmulRow(row, Wv))
  const scores = Q.map((q, i) => K.map((k, j) => (causal && j > i) ? -Infinity : dot(q, k) / Math.sqrt(2)))
  const weights = scores.map(softmaxRow)
  const out = weights.map(wRow => {
    const outDim = V[0].length
    const o = new Array(outDim).fill(0)
    wRow.forEach((wij, j) => { for (let d = 0; d < outDim; d++) o[d] += wij * V[j][d] })
    return o
  })
  return { weights, out, scores }
}

// Full block forward pass -- mirrors the Python reference exactly (see
// BACKLOG.md for the cross-check). Recomputed on every causal toggle.
function forwardBlock(causal) {
  const ln1 = X0.map(layernorm)
  const head1 = headAttention(ln1, W.Wq1, W.Wk1, W.Wv1, causal)
  const head2 = headAttention(ln1, W.Wq2, W.Wk2, W.Wv2, causal)
  const concat = ln1.map((_, i) => [...head1.out[i], ...head2.out[i]])
  const attnOut = concat.map(row => matmulRow(row, W.Wo))
  const res1 = X0.map((x, i) => addVec(x, attnOut[i]))
  const ln2 = res1.map(layernorm)
  const ffnHidden = ln2.map(row => matmulRow(row, W.W1).map((v, j) => Math.max(0, v + W.b1[j])))
  const ffnOut = ffnHidden.map(row => matmulRow(row, W.W2).map((v, j) => v + W.b2[j]))
  const res2 = res1.map((x, i) => addVec(x, ffnOut[i]))
  return { ln1, head1, head2, attnOut, res1, ln2, ffnHidden, ffnOut, res2 }
}

// ---- rendering helpers ----
function vecRange(vecs) {
  let lo = Infinity, hi = -Infinity
  for (const v of vecs) for (const x of v) { if (x < lo) lo = x; if (x > hi) hi = x }
  if (lo === hi) { lo -= 1; hi += 1 }
  return [lo, hi]
}
function cellColor(v, lo, hi) {
  const t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)))
  // negative -> blue, positive -> amber, through a dark middle -- matches
  // this app's existing two-color-family convention (amber=prime, blue=cool).
  if (v >= 0) return `rgba(240,165,0,${(0.15 + t * 0.7).toFixed(3)})`
  return `rgba(80,128,220,${(0.15 + (1 - t) * 0.7).toFixed(3)})`
}
function VectorRow({ vec, lo, hi, cellW = 22 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {vec.map((v, i) => (
        <div key={i} title={v.toFixed(3)} style={{
          width: cellW, height: 18, background: cellColor(v, lo, hi),
          border: '1px solid var(--rim)', borderRadius: 2,
        }} />
      ))}
    </div>
  )
}
function Stage({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 92 }}>
      <div style={{ fontSize: '0.56rem', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center', height: 26 }}>{label}</div>
      {children}
    </div>
  )
}
function Arrow() {
  return <div style={{ color: 'var(--ink-ghost)', fontSize: '1rem', alignSelf: 'center', marginTop: 12 }}>&rarr;</div>
}
function PlusBadge() {
  return (
    <div style={{ alignSelf: 'center', marginTop: 12, width: 18, height: 18, borderRadius: '50%', border: '1.5px solid var(--amber, #F0A500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--amber, #F0A500)', fontWeight: 700 }}>+</div>
  )
}

const heat = (w) => `rgba(240,182,20,${(w * 0.85 + 0.05).toFixed(3)})`

function AttnMatrix({ weights, selected, label }) {
  return (
    <div>
      <div style={{ fontSize: '0.56rem', color: 'var(--ink-low)', marginBottom: 3, textAlign: 'center' }}>{label}</div>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {weights.map((row, i) => (
            <tr key={i}>
              {row.map((w, j) => (
                <td key={j} title={`${TOKENS[i]}\u2192${TOKENS[j]}: ${w.toFixed(2)}`} style={{
                  width: 20, height: 16, textAlign: 'center', fontSize: '0.48rem', fontFamily: 'var(--font-mono)',
                  background: w === 0 ? 'transparent' : heat(w),
                  color: w > 0.5 ? '#000' : 'var(--ink-hi)',
                  border: i === selected ? '1px solid var(--prime)' : '1px solid var(--rim)',
                }}>{w < 0.005 ? '\u00b7' : w.toFixed(1).replace('0.', '.')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const TransformerBlockViz = forwardRef(function TransformerBlockViz(props, ref) {
  const [selected, setSelected] = useState(1) // default to "cat"
  const [causal, setCausal] = useState(false) // false = encoder (bidirectional), true = decoder (causal)

  const reset = useCallback(() => { setSelected(1); setCausal(false) }, [])
  useImperativeHandle(ref, () => ({ reset }), [reset])

  const block = useMemo(() => forwardBlock(causal), [causal])

  const rangeX0 = vecRange(X0)
  const rangeLn1 = vecRange(block.ln1)
  const rangeAttn = vecRange(block.attnOut)
  const rangeRes1 = vecRange(block.res1)
  const rangeLn2 = vecRange(block.ln2)
  const rangeFfn = vecRange(block.ffnOut)
  const rangeRes2 = vecRange(block.res2)

  const btn = (active) => ({
    padding: '6px 11px', minHeight: 32, borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-sans)',
    fontWeight: active ? 700 : 500, background: active ? 'var(--prime)' : 'var(--depth)',
    color: active ? '#000' : 'var(--ink-mid)', border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
  })

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--ink-low)' }}>trace token:</span>
        {TOKENS.map((t, i) => <button key={t} style={btn(selected === i)} onClick={() => setSelected(i)}>{t}</button>)}
        <span style={{ flex: 1 }} />
        <button style={btn(!causal)} onClick={() => setCausal(false)}>encoder (BERT, sees all)</button>
        <button style={btn(causal)} onClick={() => setCausal(true)}>decoder (GPT, causal)</button>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 780 }}>
          <Stage label={`"${TOKENS[selected]}" + pos.enc`}>
            <VectorRow vec={X0[selected]} lo={rangeX0[0]} hi={rangeX0[1]} />
          </Stage>
          <Arrow />
          <Stage label="LayerNorm">
            <VectorRow vec={block.ln1[selected]} lo={rangeLn1[0]} hi={rangeLn1[1]} />
          </Stage>
          <Arrow />
          <Stage label="head 1 attn">
            <AttnMatrix weights={block.head1.weights} selected={selected} label="Q\u00b7K \u2192 softmax" />
          </Stage>
          <Stage label="head 2 attn">
            <AttnMatrix weights={block.head2.weights} selected={selected} label="Q\u00b7K \u2192 softmax" />
          </Stage>
          <Arrow />
          <Stage label="concat + Wo">
            <VectorRow vec={block.attnOut[selected]} lo={rangeAttn[0]} hi={rangeAttn[1]} />
          </Stage>
          <PlusBadge />
          <Stage label="residual add">
            <VectorRow vec={block.res1[selected]} lo={rangeRes1[0]} hi={rangeRes1[1]} />
          </Stage>
          <Arrow />
          <Stage label="LayerNorm">
            <VectorRow vec={block.ln2[selected]} lo={rangeLn2[0]} hi={rangeLn2[1]} />
          </Stage>
          <Arrow />
          <Stage label="FFN (4\u00d7 wide, ReLU)">
            <VectorRow vec={block.ffnOut[selected]} lo={rangeFfn[0]} hi={rangeFfn[1]} />
          </Stage>
          <PlusBadge />
          <Stage label="block output">
            <VectorRow vec={block.res2[selected]} lo={rangeRes2[0]} hi={rangeRes2[1]} />
          </Stage>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-low)', marginBottom: 5 }}>
          all 4 tokens, block output (res2)
        </div>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {block.res2.map((row, i) => (
              <tr key={i}>
                <td style={{ fontSize: '0.64rem', color: i === selected ? 'var(--prime)' : 'var(--ink-low)', fontWeight: i === selected ? 700 : 500, paddingRight: 6, textAlign: 'right' }}>{TOKENS[i]}</td>
                <td><VectorRow vec={row} lo={rangeRes2[0]} hi={rangeRes2[1]} cellW={26} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 12, lineHeight: 1.5 }}>
        This is one full Transformer block's forward pass, computed live from fixed illustrative weights (not trained -- the point is to make the mechanics traceable). Pick a token above to trace its vector as it moves through the block: LayerNorm, two attention heads (each with its own learned-in-spirit Q/K/V, computing a different pattern from the same input), the residual add that lets the original vector skip past attention entirely, a second LayerNorm, the 4&times;-wide feed-forward network, and a second residual add. Toggle <b>encoder</b>/<b>decoder</b> to see the causal mask zero out (and renormalise away) every future-token weight in both attention heads at once -- the entire difference between BERT-style and GPT-style attention is that one mask. This block repeats N times in a real Transformer; each block's output becomes the next block's input.
      </p>
    </div>
  )
})
