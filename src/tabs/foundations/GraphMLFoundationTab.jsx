import { useState, useEffect, useRef } from 'react'
import { tierOf, TIER_STYLE } from '../../data/moduleTiers.js'
import { AddToTrackPopover } from '../../components/tracks/AddToTrackPopover.jsx'
import { getTracksForModule } from '../../utils/tracks.js'
import { renderMd } from '../../utils/renderMd'
import { GRAPH_ML_MODULES } from '../../data/foundations/graphMLModules.js'
import { InteractivePanel } from '../../components/interactive/InteractivePanel'
import { markModuleDone, isModuleDone, getDoneCount, unmarkModuleDone } from '../../utils/foundations/graphMLFoundationProgress.js'

const MODULES = GRAPH_ML_MODULES

const TAB_ID = 'graph_ml_foundation'

function difficultyBadge(d) {
  const map = {
    foundational: { label: 'Foundational', color: 'var(--ink-low)' },
    intermediate:  { label: 'Intermediate', color: 'var(--prime)' },
    advanced:      { label: 'Advanced',     color: '#e05050' },
  }
  const cfg = map[d] || map.foundational
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: cfg.color,
      border: `1px solid ${cfg.color}`, borderRadius: '4px',
      padding: '0.1rem 0.4rem', opacity: 0.85 }}>
      {cfg.label}
    </span>
  )
}

export function GraphMLFoundationTab({ onNavigate, openModuleId }) {
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (openModuleId && MODULES.some(m => m.id === openModuleId)) {
      setSelectedId(openModuleId)
    }
  }, [openModuleId])
  const [tick, setTick] = useState(0)
  const [trackPopoverOpen, setTrackPopoverOpen] = useState(false)
  const [recapMode, setRecapMode] = useState(false)
  const trackBtnRef = useRef(null)

  useEffect(() => {
    const h = () => setTick(t => t + 1)
    window.addEventListener('msl_progress', h)
    return () => window.removeEventListener('msl_progress', h)
  }, [])

  // Close track popover when module selection changes
  useEffect(() => { setTrackPopoverOpen(false); setRecapMode(false) }, [selectedId])

  const doneCount = getDoneCount(MODULES)
  const selected = MODULES.find(m => m.id === selectedId)

  return (
    <div className="foundation-split" data-open={selected ? '1' : '0'} style={{ display: 'flex', height: '100%', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
      <div style={{
        width: selected ? '280px' : '100%',
        minWidth: selected ? '220px' : undefined,
        flexShrink: 0,
        borderRight: selected ? '1px solid var(--rim)' : 'none',
        overflowY: 'auto',
        padding: '1.5rem 1rem',
        background: 'var(--depth)',
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink-hi)', margin: 0, letterSpacing: '-0.02em' }}>
            Graph ML Foundations
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-low)', margin: '0.4rem 0 0', lineHeight: 1.4 }}>
            GCNs, GraphSAGE, GAT, message passing, link prediction, and GNNs at FAANG scale.
          </p>
          <div style={{ marginTop: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-low)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', fontWeight: 700 }}>{doneCount}/{MODULES.length}</span>
            </div>
            <div style={{ height: '4px', background: 'var(--rim)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${MODULES.length ? (doneCount/MODULES.length)*100 : 0}%`, background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {MODULES.map(m => {
          const done = isModuleDone(m.id)
          const isActive = m.id === selectedId
          return (
            <div key={m.id} onClick={() => setSelectedId(isActive ? null : m.id)}
              style={{
                padding: '0.6rem 0.75rem', marginBottom: '0.3rem', borderRadius: '8px', cursor: 'pointer',
                background: isActive ? 'var(--prime-faint)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--prime)' : 'transparent'}`,
                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                background: done ? 'var(--prime)' : 'transparent',
                border: `2px solid ${done ? 'var(--prime)' : 'var(--rim)'}` }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ fontSize: '0.83rem', fontWeight: 600, color: done ? 'var(--ink-mid)' : 'var(--ink-hi)', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>{(() => { const _s = TIER_STYLE[tierOf(m.id)]; return (<span title={tierOf(m.id) + ' tier — interview frequency'} style={{ fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: _s.color, background: _s.bg, border: `1px solid ${_s.border}`, borderRadius: '3px', padding: '0.02rem 0.28rem', flexShrink: 0, lineHeight: 1.2 }}>{_s.label}</span>); })()}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-low)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.estimatedMin} min · {m.difficulty}</div>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', background: 'var(--depth)', minWidth: 0 }}>
          <button onClick={() => setSelectedId(null)}
            style={{ fontSize: '0.78rem', color: 'var(--ink-low)', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', padding: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ← All modules
          </button>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              {difficultyBadge(selected.difficulty)}
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-ghost)', fontWeight: 500 }}>~{selected.estimatedMin} min</span>
              {selected.tags?.map(t => (
                <span key={t} style={{ fontSize: '0.65rem', color: 'var(--ink-ghost)', background: 'var(--surface)',
                  border: '1px solid var(--rim)', borderRadius: '4px', padding: '0.1rem 0.35rem' }}>{t}</span>
              ))}
              <div style={{ marginLeft: 'auto', position: 'relative', flexShrink: 0 }}>
                <button
                  ref={trackBtnRef}
                  onClick={() => setTrackPopoverOpen(o => !o)}
                  title="Add to Track"
                  style={{
                    background: getTracksForModule(TAB_ID, selected.id).length > 0 ? 'var(--prime)' : 'var(--surface)',
                    color: getTracksForModule(TAB_ID, selected.id).length > 0 ? '#fff' : 'var(--ink-low)',
                    border: '1px solid var(--rim)', borderRadius: '4px',
                    width: 22, height: 22, cursor: 'pointer', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s',
                  }}
                >
                  {getTracksForModule(TAB_ID, selected.id).length > 0 ? '✓' : '+'}
                </button>
                {trackPopoverOpen && (
                  <AddToTrackPopover
                    tabId={TAB_ID}
                    moduleId={selected.id}
                    label={selected.title}
                    difficulty={selected.difficulty}
                    onClose={() => setTrackPopoverOpen(false)}
                    anchorRef={trackBtnRef}
                  />
                )}
              </div>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink-hi)', margin: '0 0 0.4rem', letterSpacing: '-0.025em' }}>{selected.title}</h1>
            <p style={{ fontSize: '0.925rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>{selected.subtitle}</p>
          </div>

          {selected.recap && (
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setRecapMode(false)}
                style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-sans)', cursor: 'pointer',
                  padding: '0.4rem 0.9rem', borderRadius: '7px',
                  background: !recapMode ? 'var(--prime)' : 'var(--surface)',
                  color: !recapMode ? '#000' : 'var(--ink-mid)',
                  border: `1px solid ${!recapMode ? 'var(--prime)' : 'var(--rim)'}` }}>
                Full module
              </button>
              <button
                onClick={() => setRecapMode(true)}
                style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-sans)', cursor: 'pointer',
                  padding: '0.4rem 0.9rem', borderRadius: '7px',
                  background: recapMode ? 'var(--prime)' : 'var(--surface)',
                  color: recapMode ? '#000' : 'var(--ink-mid)',
                  border: `1px solid ${recapMode ? 'var(--prime)' : 'var(--rim)'}` }}>
                ⚡ Quick recap
              </button>
            </div>
          )}

          {recapMode && selected.recap && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px',
              padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: '0.9rem' }}>Quick Recap · {selected.title}</div>
              {selected.recap.map((pt, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.7rem', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--prime)', fontWeight: 800, flexShrink: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>›</span>
                  <div style={{ fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.55 }}>{renderMd(pt)}</div>
                </div>
              ))}
            </div>
          )}

          {!recapMode && (<>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Concept</div>
            {renderMd(selected.summary, { fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }, selected.figures || {})}
          </div>
          {selected.takeaway && (
            <div style={{ background: 'var(--prime-faint)', border: '1px solid var(--prime)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Key Insight</div>
              {renderMd(selected.takeaway, { fontSize: '0.925rem', color: 'var(--ink-hi)', lineHeight: 1.6, margin: 0, fontWeight: 500 })}
            </div>
          )}
          {selected.interactivePrompt && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '10px',
              padding: '1.1rem 1.25rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700, color: '#b45309',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem',
              }}>Before you touch the controls</div>
              {renderMd(selected.interactivePrompt, {
                fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0, fontStyle: 'italic',
              })}
            </div>
          )}

          {selected.interactiveId && <InteractivePanel interactiveId={selected.interactiveId} />}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Key Points</div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', listStyle: 'none' }}>
              {selected.keyPoints?.map((pt, i) => (
                <li key={i} style={{ fontSize: '0.88rem', color: 'var(--ink-mid)', lineHeight: 1.6, marginBottom: '0.5rem',
                  paddingLeft: '0.75rem', borderLeft: '2px solid var(--prime)', display: 'flex', alignItems: 'flex-start' }}>
                  <span>{renderMd(pt)}</span>
                </li>
              ))}
            </ul>
          </div>
          {selected.checkQuestions?.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Check Questions</div>
              {selected.checkQuestions.map((cq, i) => <CheckQuestion key={i} q={cq.q} options={cq.options} answer={cq.answer} />)}
            </div>
          )}
          </>)}

          <MarkDoneButton moduleId={selected.id} onDone={() => setTick(t => t + 1)} />
        </div>
      )}
    </div>
  )
}

function CheckQuestion({ q, options, answer }) {
  const [selected, setSelected] = useState(null)
  const letters = ['A', 'B', 'C', 'D']
  return (
    <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--rim)' }}>
      {renderMd(q, { fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '0.65rem', lineHeight: 1.5 })}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {options?.map((opt, i) => {
          const letter = letters[i]
          const isCorrect = letter === answer
          const isChosen = selected === letter
          let bg = 'transparent'
          let border = '1px solid var(--rim)'
          let color = 'var(--ink-mid)'
          if (selected) {
            if (isChosen && isCorrect)  { bg = 'rgba(34,197,94,0.12)'; border = '1px solid rgba(34,197,94,0.5)'; color = 'var(--ink-hi)' }
            if (isChosen && !isCorrect) { bg = 'rgba(239,68,68,0.1)';  border = '1px solid rgba(239,68,68,0.4)';  color = 'var(--ink-hi)' }
            if (!isChosen && isCorrect) { bg = 'rgba(34,197,94,0.08)'; border = '1px solid rgba(34,197,94,0.35)'; color = 'var(--ink-mid)' }
          }
          return (
            <div
              key={letter}
              onClick={() => { if (!selected) setSelected(letter) }}
              style={{
                padding: '0.5rem 0.75rem', borderRadius: '7px', cursor: selected ? 'default' : 'pointer',
                background: bg, border, color, fontSize: '0.85rem', lineHeight: 1.5, transition: 'all 0.15s',
                display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
              }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--surface)' }}
              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontWeight: 700, flexShrink: 0, opacity: 0.7 }}>{letter}</span>
              {renderMd(opt.replace(/^`?[ABCD]\)\s*/, '').replace(/`$/, ''), {})}
            </div>
          )
        })}
      </div>
      {selected && (
        <button
          onClick={() => setSelected(null)}
          style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--ink-low)', background: 'none',
            border: '1px solid var(--rim)', borderRadius: '5px', padding: '0.25rem 0.6rem',
            cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Try again
        </button>
      )}
    </div>
  )
}

function MarkDoneButton({ moduleId, onDone }) {
  const done = isModuleDone(moduleId)
  return done ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'var(--prime-faint)', border: '1px solid var(--prime)', borderRadius: '8px', padding: '0.6rem 1.1rem' }}>
        <span style={{ color: 'var(--prime)', fontSize: '0.9rem', fontWeight: 700 }}>✓ Completed</span>
      </div>
      <button onClick={() => { unmarkModuleDone(moduleId); onDone() }}
        style={{ fontSize: '0.75rem', color: 'var(--ink-low)', background: 'none',
          border: '1px solid var(--rim)', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        Undo
      </button>
    </div>
  ) : (
    <button onClick={() => { markModuleDone(moduleId); onDone() }}
      style={{ background: 'var(--prime)', color: '#000', fontWeight: 700, fontSize: '0.9rem',
        border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}>
      Mark as complete →
    </button>
  )
}
