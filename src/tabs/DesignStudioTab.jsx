// DesignStudioTab.jsx — Design Studio (MSL), redesigned to match GSL.
// Roots map (not a flat list) + a staged compounding engine with produce-before-reveal
// gating, tier-aware grounding badges, and variations that reveal their root's reference.
// Legacy/flaw skeletons retired from the surface (kept in data).
import { useState } from 'react'
import { DESIGN_STUDIO_MSL } from '../data/designStudioBriefs.js'
import GradePack from '../components/GradePack.jsx'

const PRIME = 'var(--prime, #f59e0b)'
const SPEC = { S1: 'S1 · full brief', S2: 'S2 · derive half', S3: 'S3 · derive most', S4: 'S4 · own it' }
const MARKS = [{ id: 'hit', label: 'Hit' }, { id: 'partial', label: 'Partial' }, { id: 'miss', label: 'Miss' }]

function nameOf(b) {
  if (b.title) return b.title
  let s = b.id.replace(/^mlsd-/, '').replace(/-root$/, '').replace(/-var-/, ' — ').replace(/-/g, ' ')
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

function lsGet(k, f) { try { const v = localStorage.getItem(k); return v == null ? f : v } catch { return f } }
function lsSet(k, v) { try { localStorage.setItem(k, v) } catch {} }
function markAttempted(id) {
  try { const p = JSON.parse(localStorage.getItem('msl_ds_progress') || '{}'); if (!p[id]) { p[id] = { attempted: true }; localStorage.setItem('msl_ds_progress', JSON.stringify(p)) } } catch {}
}
function readProgress() { try { return JSON.parse(localStorage.getItem('msl_ds_progress') || '{}') } catch { return {} } }

function Ring({ frac }) {
  const r = 9, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, frac)))
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r={r} fill="none" stroke="#27272a" strokeWidth="3" />
      <circle cx="12" cy="12" r={r} fill="none" stroke={PRIME} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 12 12)" />
    </svg>
  )
}

function Labeled({ label, color, children }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: color || '#a1a1aa', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.83rem', color: '#d4d4d8', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{children}</div>
    </div>
  )
}

function StageBlock({ stage, briefId, index, total }) {
  const akey = `msl_ds_attempt_${briefId}_${stage.id}`
  const [attempt, setAttempt] = useState(() => lsGet(akey, ''))
  const [revealed, setRevealed] = useState(false)
  const [scores, setScores] = useState({})
  const onType = (v) => { setAttempt(v); lsSet(akey, v); markAttempted(briefId) }
  const markCls = (active) => ({
    fontSize: '0.68rem', padding: '2px 8px', borderRadius: 5, cursor: 'pointer',
    border: `1px solid ${active ? PRIME : '#3f3f46'}`, background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
    color: active ? PRIME : '#71717a',
  })
  return (
    <div style={{ border: '1px solid #27272a', borderRadius: 12, padding: '1rem' }}>
      <div style={{ fontSize: '0.68rem', color: '#71717a', marginBottom: 2 }}>Stage {index + 1} / {total}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fafafa' }}>{stage.title}</div>
      <div style={{ marginTop: 6, fontSize: '0.85rem', color: PRIME, lineHeight: 1.5 }}><span style={{ color: '#71717a' }}>Interviewer:</span> {stage.ask}</div>
      {stage.attemptHint && <div style={{ marginTop: 4, fontSize: '0.72rem', color: '#71717a' }}>{stage.attemptHint}</div>}
      <textarea value={attempt} onChange={e => onType(e.target.value)} rows={4}
        placeholder="Your answer to this push — write it before revealing. This is the rep."
        style={{ marginTop: 8, width: '100%', boxSizing: 'border-box', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#e4e4e7', fontSize: '0.83rem', lineHeight: 1.5, padding: '0.6rem', resize: 'vertical', fontFamily: 'inherit' }} />
      {!revealed ? (
        <button onClick={() => { setRevealed(true); markAttempted(briefId) }}
          style={{ marginTop: 8, fontSize: '0.8rem', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid rgba(245,158,11,0.5)`, background: 'transparent', color: PRIME }}>
          Reveal model coverage (attempt first)
        </button>
      ) : (
        <div style={{ marginTop: 12, borderTop: '1px solid #18181b', paddingTop: 12 }}>
          <Labeled label="How a staff engineer reasons">{stage.model}</Labeled>
          {stage.heuristic && <Labeled label="The tell (heuristic)" color={PRIME}>{stage.heuristic}</Labeled>}
          {stage.control && <Labeled label="What to monitor / when to switch">{stage.control}</Labeled>}
          {stage.trap && <Labeled label="Tempting wrong move (a senior falls here)" color="#fb7185">{stage.trap}</Labeled>}
          {stage.tell && <Labeled label="In production this looks like" color="#a3e635">{stage.tell}</Labeled>}
          {Array.isArray(stage.anchors) && stage.anchors.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '0.68rem', color: '#71717a', marginBottom: 4 }}>Self-score — point to the line in YOUR answer that does each:</div>
              {stage.anchors.map((a, i) => (
                <div key={i} style={{ border: '1px solid #27272a', borderRadius: 8, padding: '0.55rem', marginBottom: 6 }}>
                  <div style={{ fontSize: '0.82rem', color: '#e4e4e7' }}>{a.anchor}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(251,113,133,0.85)', marginTop: 2 }}>✗ if missed: {a.cost}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {MARKS.map(m => <button key={m.id} onClick={() => setScores({ ...scores, [i]: m.id })} style={markCls(scores[i] === m.id)}>{m.label}</button>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GroundBadge({ prov, companies, small }) {
  if (!prov) return null
  const g1 = prov.tier === 'G1'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: small ? '0.6rem' : '0.66rem', padding: '2px 6px', borderRadius: 5, border: `1px solid ${g1 ? '#065f46' : '#075985'}`, background: g1 ? 'rgba(6,95,70,0.25)' : 'rgba(7,89,133,0.25)', color: g1 ? '#6ee7b7' : '#7dd3fc' }}>
      {g1 ? `● Grounded · ${(prov.companies || companies || [])[0] || 'real'}` : '◇ Commonly asked'}
    </span>
  )
}

export default function DesignStudioTab() {
  const briefs = DESIGN_STUDIO_MSL || []
  const [selId, setSelId] = useState(null)
  const [showRef, setShowRef] = useState(false)
  const [progress, setProgress] = useState(() => readProgress())

  const roots = briefs.filter(b => b.isRoot)
  const childrenOf = id => briefs.filter(b => b.parentRoot === id)
  const sel = briefs.find(b => b.id === selId)
  const open = id => { setSelId(id); setShowRef(false); if (typeof window !== 'undefined') window.scrollTo?.(0, 0) }
  const backToMap = () => { setSelId(null); setProgress(readProgress()) }
  const attempted = id => !!progress[id]?.attempted
  const rootFrac = root => { const set = [root, ...childrenOf(root.id)]; return set.length ? set.filter(b => attempted(b.id)).length / set.length : 0 }

  // ── MAP ──
  if (!sel) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1rem', color: '#d4d4d8' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fafafa', marginBottom: 2 }}>Design Studio</h1>
        <p style={{ fontSize: '0.82rem', color: '#a1a1aa', marginBottom: '1.25rem', lineHeight: 1.5, maxWidth: 640 }}>
          {roots.length} fundamental ML-system problems. Master the <span style={{ color: PRIME }}>root</span>, then survive its
          variations as the scaffolding fades (S1 full brief → S4 own it). You attempt first; the model answer and anchors
          unlock only after you commit — that gate is the point.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
          {roots.map(root => {
            const kids = childrenOf(root.id)
            return (
              <div key={root.id} style={{ border: '1px solid #27272a', borderRadius: 12, padding: '1rem' }}>
                <button onClick={() => open(root.id)} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Ring frac={rootFrac(root)} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: PRIME, lineHeight: 1.3 }}>{nameOf(root)}</div>
                      <div style={{ fontSize: '0.68rem', color: '#71717a', marginTop: 2 }}>{root.domain} · {kids.length} variations{root.stages ? ` · ${root.stages.length}-stage` : ''}</div>
                      <div style={{ marginTop: 6 }}><GroundBadge prov={root.provenance} companies={root.companies} /></div>
                    </div>
                  </div>
                </button>
                {kids.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingLeft: 34 }}>
                    {kids.map(k => (
                      <button key={k.id} onClick={() => open(k.id)} title={nameOf(k)}
                        style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 5, cursor: 'pointer', border: `1px solid ${attempted(k.id) ? PRIME : '#3f3f46'}`, background: attempted(k.id) ? 'rgba(245,158,11,0.12)' : 'transparent', color: attempted(k.id) ? PRIME : '#a1a1aa' }}>
                        {k.specLevel}{attempted(k.id) ? ' ✓' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── DETAIL ──
  const staged = Array.isArray(sel.stages) && sel.stages.length > 0
  const parentRoot = sel.parentRoot ? briefs.find(b => b.id === sel.parentRoot) : null
  const workedRef = (sel.reference && sel.reference.worked) || (parentRoot && parentRoot.reference && parentRoot.reference.worked)
  const workedFromParent = !(sel.reference && sel.reference.worked) && !!workedRef
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem', color: '#d4d4d8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, fontSize: '0.85rem' }}>
        <button onClick={backToMap} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>← All problems</button>
        {sel.parentRoot && <span style={{ color: '#52525b' }}>variation of {nameOf(roots.find(r => r.id === sel.parentRoot) || {})}</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6, fontSize: '0.66rem', alignItems: 'center' }}>
        <span style={{ padding: '2px 8px', borderRadius: 5, background: '#27272a', color: '#a1a1aa' }}>{sel.domain}</span>
        <span style={{ padding: '2px 8px', borderRadius: 5, background: '#27272a', color: PRIME }}>{SPEC[sel.specLevel] || sel.specLevel}</span>
        {sel.isRoot && <span style={{ padding: '2px 8px', borderRadius: 5, background: 'rgba(245,158,11,0.15)', color: PRIME }}>root</span>}
        <GroundBadge prov={sel.provenance || (parentRoot && parentRoot.provenance)} companies={sel.companies || (parentRoot && parentRoot.companies)} />
      </div>
      <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fafafa' }}>{nameOf(sel)}</h1>
      {(sel.provenance || (parentRoot && parentRoot.provenance)) && (() => {
        const p = sel.provenance || parentRoot.provenance
        return <div style={{ marginTop: 5, fontSize: '0.68rem', color: p.tier === 'G1' ? 'rgba(110,231,183,0.9)' : 'rgba(125,211,252,0.9)' }}>
          {p.tier === 'G1' ? '● Grounded' : '◇ Commonly asked'} ({p.tier}){p.companies && p.companies.length ? ` — reported at ${p.companies.join(', ')}` : ''}{p.sources && p.sources.length ? ` · ${p.sources.join('; ')}` : ''}
        </div>
      })()}
      <p style={{ color: '#d4d4d8', marginTop: 8, lineHeight: 1.55 }}>{sel.prompt}</p>
      {sel.context && <p style={{ fontSize: '0.82rem', color: '#a1a1aa', marginTop: 8, lineHeight: 1.5 }}>{sel.context}</p>}
      {sel.produce?.artifact && (
        <div style={{ marginTop: 12, border: '1px solid #27272a', borderRadius: 8, padding: '0.7rem' }}>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: 3 }}>You produce (this is the work)</div>
          <div style={{ fontSize: '0.85rem', color: '#d4d4d8' }}>{sel.produce.artifact}</div>
        </div>
      )}

      {staged ? (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.72rem', color: '#71717a' }}>A compounding interview — each answer surfaces the next push. Attempt each stage before revealing.</div>
          {sel.stages.map((st, i) => <StageBlock key={st.id} stage={st} briefId={sel.id} index={i} total={sel.stages.length} />)}
        </div>
      ) : (
        <div style={{ marginTop: 18 }}><GradePack brief={sel} /></div>
      )}

      {workedRef && (
        <div style={{ marginTop: 18 }}>
          <button onClick={() => setShowRef(!showRef)} style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid rgba(245,158,11,0.5)`, background: 'transparent', color: PRIME }}>
            {showRef ? 'Hide worked reference' : (workedFromParent ? 'Reveal the canonical reference for this problem family' : 'Reveal full worked reference (attempt everything first)')}
          </button>
          {showRef && (
            <div style={{ marginTop: 8, border: '1px solid #27272a', borderRadius: 8, padding: '0.7rem', whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: '#d4d4d8', lineHeight: 1.55 }}>
              {workedFromParent && <div style={{ fontSize: '0.68rem', color: '#71717a', marginBottom: 8 }}>Canonical solution for the root problem — adapt it to this variation's twist.</div>}
              {workedRef}
            </div>
          )}
        </div>
      )}

      {staged && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: '0.72rem', color: '#71717a', marginBottom: 8 }}>Export the whole attempt for an adversarial grade from any LLM:</div>
          <GradePack brief={sel} />
        </div>
      )}
    </div>
  )
}
