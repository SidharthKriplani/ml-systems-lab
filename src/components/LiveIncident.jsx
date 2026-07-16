// src/components/LiveIncident.jsx — the Live Incident engine (2026-07-16).
//
// Runs the stateful, time-budgeted sev-1 simulations in data/liveIncidents.js:
// every action costs minutes against a budget; wrong paths reveal consequences
// and can make things worse; running out of time escalates the incident on its
// own. Endings are graded (resolved / mitigated / escalated) with a debrief and
// a replayable action timeline. First completion per incident is the Elo-scored
// attempt (domain "Incident Response").

import { useState, useMemo } from 'react'
import { recordAttempt } from '../utils/ratings.js'
import { LIVE_INCIDENTS } from '../data/liveIncidents.js'

const LS_KEY = 'msl_score:liveincidents'

function readDone() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function writeDone(d) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch { /* ignore */ }
}

const OUTCOME_STYLE = {
  resolved:  { label: 'RESOLVED',  color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.35)' },
  mitigated: { label: 'MITIGATED', color: 'var(--prime)', bg: 'rgba(240,165,0,0.08)', border: 'rgba(240,165,0,0.35)' },
  escalated: { label: 'ESCALATED', color: '#e05050', bg: 'rgba(224,80,80,0.08)',   border: 'rgba(224,80,80,0.35)' },
}

function TimeBar({ elapsed, budget }) {
  const pct = Math.min(100, (elapsed / budget) * 100)
  const danger = pct > 75
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: danger ? '#e05050' : 'var(--ink-low)', flexShrink: 0, fontWeight: 700 }}>
        ⏱ {elapsed}m / {budget}m
      </span>
      <div style={{ flex: 1, height: 4, background: 'var(--rim)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 2, transition: 'width 0.5s var(--mo-settle, ease)',
          background: danger ? '#e05050' : pct > 50 ? 'var(--prime)' : '#34d399',
        }} />
      </div>
    </div>
  )
}

function LiveIncidentRunner({ incident, onDone, onExit }) {
  const [nodeId, setNodeId] = useState(incident.start)
  const [elapsed, setElapsed] = useState(0)
  const [trail, setTrail] = useState([]) // [{ text, costMin, tone }]
  const [finished, setFinished] = useState(null) // { outcome, debrief, timedOut }

  const node = incident.nodes[nodeId]

  function pick(action) {
    const nextElapsed = elapsed + action.costMin
    const nextTrail = [...trail, action]
    setTrail(nextTrail)
    setElapsed(nextElapsed)
    const target = incident.nodes[action.goto]
    if (nextElapsed >= incident.budgetMin && !target.outcome) {
      // Out of time mid-investigation: the incident escalates on its own.
      const result = {
        outcome: 'escalated', timedOut: true,
        debrief:
          `Time expired at ${nextElapsed} minutes — the incident escalated before you reached a root cause. ` +
          `The path you were on may have been correct; on-call is a race against the budget, and every detour (traps, redundant checks) is paid in minutes. ` +
          `Replay and watch where the minutes went.`,
      }
      finish(result, nextTrail)
      return
    }
    if (target.outcome) {
      finish({ outcome: target.outcome, debrief: target.debrief, timedOut: false }, nextTrail)
      return
    }
    setNodeId(action.goto)
  }

  function finish(result, finalTrail) {
    setFinished(result)
    const done = readDone()
    if (!done[incident.id]) {
      // First completion is the rated attempt.
      recordAttempt('Incident Response', result.outcome === 'resolved', 'staff')
    }
    const prev = done[incident.id]
    const rank = { resolved: 3, mitigated: 2, escalated: 1 }
    if (!prev || rank[result.outcome] > rank[prev.outcome]) {
      done[incident.id] = { outcome: result.outcome, steps: finalTrail.length }
      writeDone(done)
    }
    onDone?.()
  }

  function replay() {
    setNodeId(incident.start)
    setElapsed(0)
    setTrail([])
    setFinished(null)
  }

  const os = finished ? OUTCOME_STYLE[finished.outcome] : null

  return (
    <div style={{ border: '1px solid var(--rim)', borderRadius: 10, background: 'var(--surface)', padding: '18px 20px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e05050' }}>
          🔴 live incident
        </span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>{incident.domain}</span>
        <button onClick={onExit} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: 12 }}>✕ exit</button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <TimeBar elapsed={elapsed} budget={incident.budgetMin} />
      </div>

      {!finished ? (
        <>
          <p className="mo-rise" key={nodeId} style={{ fontSize: 13.5, color: 'var(--ink-mid)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '0 0 14px' }}>
            {node.situation}
          </p>
          <div className="mo-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {node.actions.map((a, i) => (
              <button
                key={i}
                onClick={() => pick(a)}
                style={{
                  textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.55,
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--depth)', border: '1px solid var(--rim)', color: 'var(--ink-mid)',
                  display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline',
                  transition: 'border-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--prime)'; e.currentTarget.style.color = 'var(--ink-hi)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
              >
                <span>{a.text}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-ghost)', flexShrink: 0 }}>−{a.costMin}m</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mo-pop">
          <div style={{ padding: '14px 16px', borderRadius: 10, background: os.bg, border: `1px solid ${os.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', color: os.color, marginBottom: 6 }}>
              {os.label} · {elapsed}m of {incident.budgetMin}m · {trail.length} action{trail.length !== 1 ? 's' : ''}
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{finished.debrief}</p>
          </div>

          {/* action timeline */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-ghost)', marginBottom: 6 }}>
              Your timeline
            </div>
            <div className="mo-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {trail.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 12, color: a.tone === 'trap' ? '#e05050' : 'var(--ink-low)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, flexShrink: 0, width: 34, textAlign: 'right' }}>+{a.costMin}m</span>
                  <span>{a.text}{a.tone === 'trap' ? '  ⚠ trap' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={replay}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, background: 'var(--prime-faint, rgba(240,165,0,0.1))', border: '1px solid var(--prime)', color: 'var(--prime)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}>
              ↺ Replay — find a better path
            </button>
            <button onClick={onExit}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'none', border: '1px solid var(--rim)', color: 'var(--ink-low)', borderRadius: 7, padding: '8px 14px', cursor: 'pointer' }}>
              Back to incidents
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LiveIncidentSection() {
  const [openId, setOpenId] = useState(null)
  const [doneMap, setDoneMap] = useState(() => readDone())

  const open = useMemo(() => LIVE_INCIDENTS.find(i => i.id === openId) || null, [openId])

  if (open) {
    return (
      <div style={{ marginBottom: 24 }}>
        <LiveIncidentRunner
          incident={open}
          onDone={() => setDoneMap(readDone())}
          onExit={() => setOpenId(null)}
        />
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#e05050' }}>
          🔴 Live incidents
        </span>
        <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>
          timed · stateful · wrong moves cost real minutes
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LIVE_INCIDENTS.map(inc => {
          const done = doneMap[inc.id]
          const os = done ? OUTCOME_STYLE[done.outcome] : null
          return (
            <button
              key={inc.id}
              onClick={() => setOpenId(inc.id)}
              style={{
                textAlign: 'left', fontFamily: 'var(--font-sans)', cursor: 'pointer',
                padding: '14px 16px', borderRadius: 10,
                background: 'var(--surface)', border: '1px solid var(--rim)',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#e05050' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>{inc.domain}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>· {inc.budgetMin}m budget</span>
                {os && (
                  <span style={{ marginLeft: 'auto', fontSize: 9.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: os.color, border: `1px solid ${os.border}`, borderRadius: 4, padding: '1px 6px', letterSpacing: '0.06em' }}>
                    {os.label}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-hi)', lineHeight: 1.4 }}>{inc.title}</div>
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11.5, fontFamily: 'var(--font-mono)', color: '#e05050' }}>
                {done ? 'Replay — beat your outcome →' : 'Take the pager →'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
