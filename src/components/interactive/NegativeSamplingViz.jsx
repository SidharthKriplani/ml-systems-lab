import React, { useState, useImperativeHandle, forwardRef } from 'react'

// Toggle in-batch / hard / popularity-corrected negatives over a small item set with a
// popularity skew, and see which items get PUSHED APART and a recall proxy — making the
// in-batch popularity-collapse visible (the popular item is a negative for everyone → its
// recall craters; hard negatives sharpen the boundary; logQ correction repairs the head).

// items: popularity drives how often each shows up as an in-batch negative.
const ITEMS = [
  { id: 'Head A', pop: 0.34, relevant: true },   // popular AND genuinely relevant to many
  { id: 'Head B', pop: 0.26, relevant: true },
  { id: 'Mid C', pop: 0.14, relevant: true },
  { id: 'Mid D', pop: 0.10, relevant: false },
  { id: 'Tail E', pop: 0.06, relevant: true },
  { id: 'Tail F', pop: 0.05, relevant: false },
  { id: 'Tail G', pop: 0.03, relevant: true },
  { id: 'Tail H', pop: 0.02, relevant: false },
]

const SCHEMES = {
  inbatch: {
    name: 'In-batch (naive)',
    desc: 'Every other user\'s positive is a negative — sampled from the interaction distribution, so popular items are negatives for almost everyone.',
    // push force ∝ popularity (over-penalised); hard-negative sharpening = none
    push: it => it.pop,
    hard: false,
    corrected: false,
  },
  hard: {
    name: '+ Hard negatives',
    desc: 'Add mined high-scoring non-clicks near the boundary. Random negatives give ~0 gradient; hard ones sharpen relevant-vs-near-relevant.',
    push: it => it.pop * 0.7 + (it.relevant ? 0 : 0.22),
    hard: true,
    corrected: false,
  },
  logq: {
    name: '+ logQ correction',
    desc: 'Subtract each item\'s log sampling prob (u·v − log Q) so popular items stop being over-penalised. Repairs the head.',
    push: it => it.pop * 0.7 + (it.relevant ? 0 : 0.22) - it.pop * 0.62,
    hard: true,
    corrected: true,
  },
}

export const NegativeSamplingViz = forwardRef(function NegativeSamplingViz(props, ref) {
  const [key, setKey] = useState('inbatch')
  useImperativeHandle(ref, () => ({ reset: () => setKey('inbatch') }))
  const s = SCHEMES[key]

  const rows = ITEMS.map(it => {
    const push = Math.max(0, s.push(it))
    // recall proxy: relevant items retrieved unless over-pushed away from users.
    // popular relevant items suffer most under naive in-batch (the collapse).
    let recall
    if (!it.relevant) recall = 0
    else recall = Math.max(0.05, 1 - push * 1.7)
    return { ...it, push, recall }
  })
  const relevant = rows.filter(r => r.relevant)
  const avgRecall = relevant.reduce((a, b) => a + b.recall, 0) / relevant.length
  const headRecall = rows.filter(r => r.relevant && r.pop >= 0.2)
  const headAvg = headRecall.reduce((a, b) => a + b.recall, 0) / headRecall.length

  const maxPush = Math.max(...rows.map(r => r.push), 0.4)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        {Object.entries(SCHEMES).map(([k, v]) => (
          <button key={k} onClick={() => setKey(k)} style={{
            flex: 1, padding: '5px 6px', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700,
            border: `1px solid ${k === key ? 'var(--prime)' : 'var(--rim)'}`,
            background: k === key ? 'var(--prime-faint)' : 'var(--depth)',
            color: k === key ? 'var(--prime)' : 'var(--ink-mid)',
          }}>{v.name}</button>
        ))}
      </div>

      <svg viewBox="0 0 360 168" style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <text x="4" y="10" fill="var(--ink-low)" fontSize="7.5">how hard each item is pushed away from users (red = over-penalised)  ·  recall proxy for relevant items</text>
        {rows.map((r, i) => {
          const y = 18 + i * 18
          const pushW = (r.push / maxPush) * 130
          const overPushed = r.relevant && r.push > 0.18
          return (
            <g key={r.id}>
              <text x="4" y={y + 9} fontSize="7.5" fill={r.relevant ? 'var(--ink-hi)' : 'var(--ink-low)'}>{r.id}{r.relevant ? '' : ' (irrel)'}</text>
              {/* push bar */}
              <rect x="58" y={y} width={pushW} height="11" rx="2"
                fill={overPushed ? '#ef4444' : 'var(--amber)'} opacity="0.85" />
              {/* recall dot bar (relevant only) */}
              {r.relevant && (
                <>
                  <rect x="210" y={y} width="120" height="11" rx="2" fill="var(--depth)" stroke="var(--rim)" />
                  <rect x="210" y={y} width={r.recall * 120} height="11" rx="2"
                    fill={r.recall > 0.6 ? 'var(--prime)' : (r.recall > 0.3 ? 'var(--amber)' : '#ef4444')} opacity="0.9" />
                  <text x="334" y={y + 9} fontSize="6.6" fill="var(--ink-low)">{(r.recall * 100).toFixed(0)}%</text>
                </>
              )}
            </g>
          )
        })}
        <text x="58" y="164" fontSize="6.5" fill="var(--ink-low)">← push force (∝ popularity for in-batch)</text>
        <text x="210" y="164" fontSize="6.5" fill="var(--ink-low)">recall proxy (relevant items) →</text>
      </svg>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={statBox}><div style={statLbl}>Recall (all relevant)</div><div style={{ ...statVal, color: avgRecall > 0.6 ? 'var(--prime)' : '#ef4444' }}>{(avgRecall * 100).toFixed(0)}%</div></div>
        <div style={statBox}><div style={statLbl}>Recall on the HEAD</div><div style={{ ...statVal, color: headAvg > 0.5 ? 'var(--prime)' : '#ef4444' }}>{(headAvg * 100).toFixed(0)}%</div></div>
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', lineHeight: 1.5, padding: '6px 8px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 6 }}>
        {s.desc}
      </div>
      <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        <b>Naive in-batch</b>: the popular <i>relevant</i> Head items are pushed away from everyone (red) — "popular = negative" — and head recall collapses even though those are the items most users want. <b>Hard negatives</b> add boundary gradient; the <b>logQ correction</b> stops over-penalising popular items and repairs the head. Same encoder throughout — the sampling scheme is what moves recall.
      </div>
    </div>
  )
})

const statBox = { flex: 1, padding: '6px 8px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 6, textAlign: 'center' }
const statLbl = { fontSize: '0.58rem', color: 'var(--ink-low)', textTransform: 'uppercase' }
const statVal = { fontSize: '1.1rem', fontWeight: 800 }
