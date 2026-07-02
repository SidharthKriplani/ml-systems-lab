import { useState, useMemo } from 'react'
import { DRILL_POOL, SUBJECT_LABELS } from '../../data/drills/drillPool.js'

const LEVEL_ORDER = ['junior', 'mid', 'senior', 'staff']
const TYPE_ICON = { mcq: '◧', code: '⌘', multistep: '⑃', open: '✎', rubric: '▤' }

const selectStyle = {
  background: 'var(--surface)', color: 'var(--ink-hi)', border: '1px solid var(--rim)',
  borderRadius: 8, padding: '7px 10px', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', cursor: 'pointer',
}
const pill = (bg, color) => ({ fontSize: '0.62rem', padding: '1px 8px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' })

function Options({ options, answer, picked, revealed, onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }}>
      {options.map((opt, i) => {
        const isAns = i === answer, isPick = i === picked
        let bg = 'transparent', bd = 'var(--rim)', col = 'var(--ink-mid)'
        if (revealed) {
          if (isAns) { bg = 'rgba(34,197,94,0.12)'; bd = 'rgba(34,197,94,0.5)'; col = 'var(--ink-hi)' }
          else if (isPick) { bg = 'rgba(239,68,68,0.1)'; bd = 'rgba(239,68,68,0.4)'; col = 'var(--ink-hi)' }
        } else if (isPick) { bd = 'var(--prime)'; bg = 'var(--prime-faint)' }
        return (
          <button key={i} onClick={() => !revealed && onPick(i)} disabled={revealed}
            style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 7, border: `1px solid ${bd}`, background: bg, color: col,
              fontSize: '0.85rem', lineHeight: 1.5, cursor: revealed ? 'default' : 'pointer', fontFamily: 'var(--font-sans)' }}>
            <span style={{ opacity: 0.6, marginRight: 7, fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{String.fromCharCode(65 + i)}</span>{opt}
          </button>
        )
      })}
    </div>
  )
}

function Reveal({ d }) {
  return (
    <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {d.diagnosis && <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--prime)' }}>{d.diagnosis}</div>}
      {d.explanation && <div style={{ fontSize: '0.82rem', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{d.explanation}</div>}
      {d.fix && <div style={{ fontSize: '0.78rem', color: 'var(--ink-low)', lineHeight: 1.55 }}><b style={{ color: 'var(--ink-mid)' }}>Fix — </b>{d.fix}</div>}
    </div>
  )
}

function LevelFraming({ levels }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{ fontSize: '0.72rem', color: 'var(--ink-low)', background: 'none', border: '1px solid var(--rim)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        {open ? 'Hide' : 'IC3 · IC5 · Staff'} framing
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['ic3', 'ic5', 'staff'].map(k => levels[k] && (
            <div key={k} style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', lineHeight: 1.55 }}>
              <span style={{ ...pill('var(--prime-faint)', 'var(--prime)'), textTransform: 'uppercase', marginRight: 7 }}>{k}</span>{levels[k]}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Ctx({ context }) {
  if (!context) return null
  return (
    <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '10px 12px' }}>
      {Array.isArray(context)
        ? context.map((l, i) => <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-mid)', padding: '2px 0', lineHeight: 1.5 }}>{l}</div>)
        : <div style={{ fontSize: '0.84rem', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{context}</div>}
    </div>
  )
}

function MultiStep({ steps }) {
  const [state, setState] = useState(steps.map(() => ({ picked: null, revealed: false })))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {steps.map((st, si) => {
        const s = state[si]
        return (
          <div key={si} style={{ borderLeft: '2px solid var(--prime)', paddingLeft: 12 }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Step {si + 1}</div>
            <div style={{ fontSize: '0.86rem', color: 'var(--ink-hi)', fontWeight: 600, marginBottom: 4 }}>{st.question}</div>
            <Options options={st.options} answer={st.answer} picked={s.picked} revealed={s.revealed}
              onPick={(i) => setState(prev => prev.map((x, j) => j === si ? { picked: i, revealed: true } : x))} />
            {s.revealed && <div style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', lineHeight: 1.6, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '9px 12px' }}>{st.finding}</div>}
          </div>
        )
      })}
    </div>
  )
}

function DrillCard({ d }) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const lvlColor = { junior: 'var(--ink-low)', mid: 'var(--prime)', senior: '#f59e0b', staff: '#a78bfa' }[d.level] || 'var(--ink-low)'
  return (
    <div style={{ border: '1px solid var(--rim)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ color: 'var(--ink-low)', fontSize: '0.9rem', width: 16 }}>{TYPE_ICON[d.type] || '•'}</span>
        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.35 }}>{d.title}</span>
        <span style={pill('var(--prime-faint)', 'var(--prime)')}>{SUBJECT_LABELS[d.subject] || d.subject}</span>
        <span style={{ fontSize: '0.62rem', color: lvlColor, border: `1px solid ${lvlColor}`, borderRadius: 20, padding: '1px 8px' }}>{d.level}</span>
        <span style={{ color: 'var(--ink-ghost)', fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <Ctx context={d.context} />
          {d.code && <pre style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '11px 13px', fontSize: '0.76rem', color: 'var(--ink-mid)', overflowX: 'auto', margin: 0, fontFamily: 'var(--font-mono)', lineHeight: 1.55 }}>{d.code}</pre>}
          {d.question && <div style={{ fontSize: '0.88rem', color: 'var(--ink-hi)', fontWeight: 600 }}>{d.question}</div>}
          {d.type === 'multistep'
            ? <MultiStep steps={d.steps} />
            : <>
                <Options options={d.options} answer={d.answer} picked={picked} revealed={revealed} onPick={(i) => { setPicked(i); setRevealed(true) }} />
                {revealed && <Reveal d={d} />}
              </>}
          {d.levels && <LevelFraming levels={d.levels} />}
          {d.source && <div style={{ fontSize: '0.66rem', color: 'var(--ink-ghost)' }}>from {d.source}</div>}
        </div>
      )}
    </div>
  )
}

export default function DrillBrowser() {
  const [subject, setSubject] = useState('all')
  const [level, setLevel] = useState('all')

  const subjects = useMemo(() => Array.from(new Set(DRILL_POOL.map(d => d.subject))), [])
  const levels = useMemo(() => LEVEL_ORDER.filter(l => DRILL_POOL.some(d => d.level === l)), [])
  const filtered = DRILL_POOL.filter(d => (subject === 'all' || d.subject === subject) && (level === 'all' || d.level === level))

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '1.75rem 1.5rem', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--prime)' }}>Judge</span>
        <span style={{ fontSize: '0.66rem', color: 'var(--ink-ghost)' }}>preview · tag-driven drill pool</span>
      </div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-hi)', margin: '0 0 0.3rem', letterSpacing: '-0.02em' }}>Judgment drills</h1>
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-mid)', margin: '0 0 1.4rem', lineHeight: 1.55 }}>One pool, filtered by tags. Subjects are generated from the data — add a tag, it appears.</p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--ink-low)' }}>
          Subject
          <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>
            <option value="all">All subjects</option>
            {subjects.map(s => <option key={s} value={s}>{SUBJECT_LABELS[s] || s}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--ink-low)' }}>
          Level
          <select value={level} onChange={e => setLevel(e.target.value)} style={selectStyle}>
            <option value="all">All levels</option>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-ghost)', marginLeft: 'auto' }}>{filtered.length} drill{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(d => <DrillCard key={d.id} d={d} />)}
        {filtered.length === 0 && <div style={{ fontSize: '0.85rem', color: 'var(--ink-low)', padding: '1.5rem', textAlign: 'center' }}>No drills match this filter yet.</div>}
      </div>
    </div>
  )
}
