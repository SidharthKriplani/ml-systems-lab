// DesignStudioTab.jsx — Design Studio (MSL). Produce -> reveal reference -> self-critique.
// Renders authored roots + variations (and flaw briefs) with a readable name, a reveal-able
// worked reference, and the GradePack attempt/self-score/BYO-LLM-grade workspace.
import { useState } from 'react'
import { DESIGN_STUDIO_MSL } from '../data/designStudioBriefs.js'
import { DESIGN_STUDIO_FLAWS } from '../data/designStudioFlaws.js'
import GradePack from '../components/GradePack.jsx'

const PRIME = 'var(--prime, #f59e0b)'
const SPEC = { S1: 'S1 · full brief', S2: 'S2 · derive half', S3: 'S3 · derive most', S4: 'S4 · own it' }

const ALL = [
  ...(DESIGN_STUDIO_MSL || []).map(b => ({ ...b, _kind: 'brief' })),
  ...(DESIGN_STUDIO_FLAWS || []).map(b => ({ ...b, _kind: 'flaw' })),
]

function nameOf(b) {
  if (b.title) return b.title
  let s = b.id.replace(/^ds-/, '').replace(/^mlsd-/, '').replace(/-root$/, '').replace(/-var-/, ' — ').replace(/-/g, ' ')
  s = s.replace(/\b\w/g, c => c.toUpperCase())
  return b.isRoot ? s + '  (root)' : s
}

function Sec({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: 4 }}>{title}</div>
      <div style={{ color: '#d4d4d8', fontSize: '0.85rem', lineHeight: 1.5 }}>{children}</div>
    </div>
  )
}

export default function DesignStudioTab() {
  const [selId, setSelId] = useState(ALL[0]?.id || null)
  const [showRef, setShowRef] = useState(false)
  const sel = ALL.find(b => b.id === selId) || ALL[0]
  const pick = (id) => { setSelId(id); setShowRef(false) }
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1rem', color: '#d4d4d8' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fafafa', marginBottom: 2 }}>
        Design Studio <span style={{ color: PRIME, fontSize: '0.85rem', fontWeight: 400 }}>· build it yourself, then self-critique</span>
      </h1>
      <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '1.25rem' }}>Produce the artifact, self-score the anchors, then export a grade pack to any LLM.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        <div style={{ maxHeight: '80vh', overflow: 'auto', paddingRight: 4 }}>
          {ALL.map(b => {
            const active = b.id === sel?.id
            return (
              <button key={b.id} onClick={() => pick(b.id)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.7rem', marginBottom: 4,
                borderRadius: 8, border: `1px solid ${active ? PRIME : '#27272a'}`,
                background: active ? 'rgba(245,158,11,0.10)' : 'transparent', color: active ? '#fafafa' : '#d4d4d8', cursor: 'pointer',
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: b.isRoot ? PRIME : undefined }}>{nameOf(b)}</div>
                <div style={{ fontSize: '0.68rem', color: '#71717a', marginTop: 2 }}>
                  {b.domain} · {b._kind === 'flaw' ? `flaw ${b.flawMode}` : (SPEC[b.specLevel] || b.specLevel)} · {b.modality}
                </div>
              </button>
            )
          })}
        </div>
        {sel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6, fontSize: '0.68rem' }}>
                <span style={{ padding: '2px 8px', borderRadius: 5, background: '#27272a', color: '#a1a1aa' }}>{sel.domain}</span>
                <span style={{ padding: '2px 8px', borderRadius: 5, background: '#27272a', color: PRIME }}>{SPEC[sel.specLevel] || sel.specLevel}</span>
                {sel.isRoot && <span style={{ padding: '2px 8px', borderRadius: 5, background: 'rgba(245,158,11,0.15)', color: PRIME }}>root</span>}
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fafafa' }}>{nameOf(sel)}</h2>
              <p style={{ color: '#d4d4d8', marginTop: 4 }}>{sel.prompt}</p>
            </div>
            <Sec title="Context">{sel.context}</Sec>
            <Sec title="You produce (this is the work)">
              <div>{sel.produce?.artifact}</div>
              <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: 4 }}>format: {sel.produce?.format} · workspace: {sel.produce?.workspace}</div>
            </Sec>
            {sel.flawGraph && (
              <Sec title="Flaw graph (reveal only after you write your diagnosis)">
                {sel.flawGraph.map(f => (
                  <div key={f.flawId} style={{ fontSize: '0.82rem', marginBottom: 3 }}>
                    <span style={{ color: f.root ? PRIME : '#a1a1aa', fontWeight: f.root ? 600 : 400 }}>
                      {f.flawId}{f.root ? ' (root)' : ` ← ${(f.dependsOn || []).join(', ')}`}:
                    </span> <span>{f.symptom}</span>
                  </div>
                ))}
              </Sec>
            )}
            <Sec title={`Self-critique rubric — grade your own artifact (reference: ${sel.reference?.type || 'n/a'})`}>
              {(sel.rubric || []).map((r, i) => (
                <div key={i} style={{ border: '1px solid #27272a', borderRadius: 8, padding: '0.6rem', marginBottom: 6 }}>
                  <div style={{ fontSize: '0.83rem', fontWeight: 500, color: '#e4e4e7' }}>{r.dim}</div>
                  <div style={{ fontSize: '0.82rem', color: '#d4d4d8', marginTop: 2 }}>{'✓'} {r.anchor}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(251,113,133,0.85)', marginTop: 2 }}>{'✗'} cost if missed: {r.cost}</div>
                </div>
              ))}
            </Sec>
            {sel.reference?.worked && (
              <div>
                <button onClick={() => setShowRef(!showRef)} style={{
                  fontSize: '0.8rem', padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  border: '1px solid rgba(245,158,11,0.5)', background: 'transparent', color: PRIME,
                }}>
                  {showRef ? 'Hide worked reference' : 'Reveal worked reference (attempt first)'}
                </button>
                {showRef && (
                  <div style={{ marginTop: 8, border: '1px solid #27272a', borderRadius: 8, padding: '0.7rem', whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: '#d4d4d8', lineHeight: 1.5 }}>
                    {sel.reference.worked}
                  </div>
                )}
              </div>
            )}
            <GradePack brief={sel} />
            {sel.status === 'skeleton' && (
              <div style={{ fontSize: '0.7rem', color: '#52525b', borderTop: '1px solid #18181b', paddingTop: 10 }}>
                Reference prose is still being authored for some briefs — the grade pack anchors on the checklist, which is the bar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
