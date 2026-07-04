import React, { useState, useImperativeHandle, forwardRef } from 'react'

// Pick a DL RecSys architecture and see, on ONE shared example (a user with an id,
// a category, and a click history, scoring a candidate item), what that architecture
// actually models: embedding tables, the cross/interaction mechanism, attention over
// history (DIN), or sequence order (SASRec). The point is which interaction each represents.

const HISTORY = ['run shoes', 'cookbook', 'phone case', 'yoga mat', 'headphones']
const CANDIDATE = 'sneaker'

const ARCHS = {
  wide_deep: {
    name: 'Wide & Deep',
    tag: 'memorise + generalise',
    interaction: 'wide: hand-crafted crosses  ·  deep: embedding MLP',
    candidateDependent: false,
    ordered: false,
    note: 'Wide side memorises specific user×item crosses YOU specify; deep side generalises. Crosses are hand-engineered.',
  },
  deepfm: {
    name: 'DeepFM',
    tag: 'FM learns all 2nd-order crosses',
    interaction: 'FM: all pairwise crosses (auto)  +  deep MLP',
    candidateDependent: false,
    ordered: false,
    note: 'Factorization Machine learns every pairwise feature cross through shared embeddings — no manual cross engineering.',
  },
  dlrm: {
    name: 'DLRM',
    tag: 'explicit pairwise dot-products',
    interaction: 'dot(eᵢ, eⱼ) over all embedding pairs → MLP',
    candidateDependent: false,
    ordered: false,
    note: 'Embed every categorical, take explicit pairwise dot products, concat dense, MLP. Embedding tables dominate memory.',
  },
  din: {
    name: 'DIN',
    tag: 'attention over history w.r.t. candidate',
    interaction: 'attn(history, candidate) → candidate-dependent user vector',
    candidateDependent: true,
    ordered: false,
    note: 'Local activation: history items relevant to the CANDIDATE get up-weighted. User vector changes per candidate.',
  },
  sasrec: {
    name: 'SASRec',
    tag: 'unidirectional sequence',
    interaction: 'causal self-attention over ordered history → next item',
    candidateDependent: true,
    ordered: true,
    note: 'Left-to-right self-attention over the ORDER of interactions. Naturally autoregressive next-item prediction.',
  },
}

// crude per-history-item relevance to the candidate (sneaker) for the DIN attention demo
const RELEVANCE = { 'run shoes': 0.92, 'cookbook': 0.05, 'phone case': 0.08, 'yoga mat': 0.55, 'headphones': 0.18 }

export const DLRecSysArchViz = forwardRef(function DLRecSysArchViz(props, ref) {
  const [key, setKey] = useState('din')
  useImperativeHandle(ref, () => ({ reset: () => setKey('din') }))
  const a = ARCHS[key]

  // attention weights over history: DIN/SASRec use relevance; others = uniform pool
  const raw = HISTORY.map(h => (a.candidateDependent ? RELEVANCE[h] : 1))
  const sum = raw.reduce((x, y) => x + y, 0)
  const attn = raw.map(r => r / sum)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        {Object.entries(ARCHS).map(([k, v]) => (
          <button key={k} onClick={() => setKey(k)} style={{
            padding: '4px 9px', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
            border: `1px solid ${k === key ? 'var(--prime)' : 'var(--rim)'}`,
            background: k === key ? 'var(--prime-faint)' : 'var(--depth)',
            color: k === key ? 'var(--prime)' : 'var(--ink-mid)',
          }}>{v.name}</button>
        ))}
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: 6 }}>
        Shared example — user (id 4412, category <b>sport</b>) with click history, scoring candidate <b style={{ color: 'var(--amber)' }}>{CANDIDATE}</b>.
      </div>

      <svg viewBox="0 0 360 150" style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        {/* embedding tables row */}
        <text x="6" y="11" fill="var(--ink-low)" fontSize="7.5">embedding-table lookups (every architecture starts here)</text>
        {['user_id', 'category', CANDIDATE].map((f, i) => (
          <g key={f}>
            <rect x={8 + i * 66} y="16" width="60" height="18" rx="3" fill="var(--depth)" stroke="var(--rim)" />
            <text x={38 + i * 66} y="28" textAnchor="middle" fontSize="7.5" fill="var(--ink-hi)">{f}</text>
          </g>
        ))}

        {/* history sequence with attention weights */}
        <text x="6" y="52" fill="var(--ink-low)" fontSize="7.5">
          click history {a.ordered ? '(ORDER matters →)' : (a.candidateDependent ? '(attention vs candidate)' : '(pooled, uniform)')}
        </text>
        {HISTORY.map((h, i) => {
          const w = attn[i]
          const col = a.candidateDependent ? (w > 0.25 ? 'var(--prime)' : (w > 0.1 ? 'var(--amber)' : 'var(--rim)')) : 'var(--rim)'
          return (
            <g key={h}>
              <rect x={8 + i * 70} y="58" width="64" height={16 + w * 34} rx="3"
                fill={a.candidateDependent ? col : 'var(--depth)'} opacity={a.candidateDependent ? 0.85 : 1}
                stroke={col} />
              <text x={40 + i * 70} y="70" textAnchor="middle" fontSize="6.6" fill="var(--ink-hi)">{h}</text>
              {a.candidateDependent && <text x={40 + i * 70} y={80 + w * 30} textAnchor="middle" fontSize="6" fill="var(--ink-low)">{(w * 100).toFixed(0)}%</text>}
              {a.ordered && i < HISTORY.length - 1 && <text x={74 + i * 70} y="66" fontSize="8" fill="var(--ink-low)">→</text>}
            </g>
          )
        })}

        {/* interaction / mechanism box */}
        <rect x="8" y="118" width="344" height="24" rx="5" fill="none" stroke="var(--amber)" />
        <text x="180" y="133" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--amber)">{a.interaction}</text>
      </svg>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '4px 0 8px' }}>
        <span style={pill(a.candidateDependent)}>{a.candidateDependent ? 'user vector depends on candidate' : 'one fixed user vector'}</span>
        <span style={pill(a.ordered)}>{a.ordered ? 'models sequence ORDER' : 'order-agnostic'}</span>
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', lineHeight: 1.5, padding: '6px 8px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 6 }}>
        <b style={{ color: 'var(--ink-hi)' }}>{a.name}</b> — {a.tag}. {a.note}
      </div>
      <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Watch the history bars: only <b>DIN</b> and <b>SASRec</b> re-weight the history against the candidate, so the user's representation becomes candidate-dependent. Wide&Deep / DeepFM / DLRM pool the history into one fixed vector. That single distinction is DIN's reason to exist.
      </div>
    </div>
  )
})

const pill = (on) => ({
  fontSize: '0.62rem', padding: '2px 7px', borderRadius: 10, fontWeight: 700,
  border: `1px solid ${on ? 'var(--prime)' : 'var(--rim)'}`,
  color: on ? 'var(--prime)' : 'var(--ink-low)',
  background: on ? 'var(--prime-faint)' : 'transparent',
})
