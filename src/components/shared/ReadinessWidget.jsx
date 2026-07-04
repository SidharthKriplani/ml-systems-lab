import { useState } from 'react'
import { computeReadiness, readinessLabel, readinessColor } from '../../utils/readiness.js'
import { COMPANIES } from '../../data/companyTracks.js'

// ─── ReadinessWidget (MSL) ───────────────────────────────────────────────────
// Cross-lab-uniform readiness widget, mirroring PAL's canonical ReadinessWidget.
// MSL is a cram-to-a-date interview-prep tool, not a forever-streak app, so this
// surfaces a single headline "are you ready" reading plus an optional target
// company + interview-date countdown, and a one-click "work on your weakest area".
//
// The readiness SCORE and WEAKEST-AREA come from MSL's existing computeReadiness()
// (Path% + Practice% capped-mean, activity excluded) — this widget does NOT
// re-derive them, it presents them.
//
// localStorage:
//   msl-readiness-target — JSON { company, date } of the target interview.

const TARGET_KEY = 'msl-readiness-target'

// Where "work on your weakest area" should send the user. Mirrors HomeTab's map.
const WEAKEST_TAB = {
  foundations: 'gradient',
  practice: 'interview_questions',
}

function readTarget() {
  try {
    const raw = localStorage.getItem(TARGET_KEY)
    if (!raw) return { company: '', date: '' }
    const v = JSON.parse(raw)
    return { company: v.company || '', date: v.date || '' }
  } catch {
    return { company: '', date: '' }
  }
}

function writeTarget(next) {
  try {
    if (next && (next.company || next.date)) {
      localStorage.setItem(TARGET_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(TARGET_KEY)
    }
  } catch { /* ignore */ }
}

function daysUntil(isoDate) {
  if (!isoDate) return null
  const target = new Date(isoDate + 'T00:00:00')
  if (isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export default function ReadinessWidget({ onNavigate } = {}) {
  const r = computeReadiness()
  const label = readinessLabel(r.level)
  const color = readinessColor(r.level)
  const weakTab = r.weakest ? (WEAKEST_TAB[r.weakest.key] || 'gradient') : null

  const [target, setTarget] = useState(() => readTarget())
  const [editing, setEditing] = useState(false)

  function save(next) {
    setTarget(next)
    writeTarget(next)
  }

  const days = daysUntil(target.date)
  const companyLabel = target.company || null

  // Countdown text
  let countdownText
  if (days == null) {
    countdownText = 'Set a target interview →'
  } else if (days < 0) {
    countdownText = companyLabel ? 'Interview date passed · ' + companyLabel : 'Interview date passed'
  } else if (days === 0) {
    countdownText = companyLabel ? 'Interview today · ' + companyLabel : 'Interview is today'
  } else {
    countdownText = days + ' day' + (days === 1 ? '' : 's') +
      (companyLabel ? ' to your ' + companyLabel + ' interview' : ' to your interview')
  }

  return (
    <div style={{
      background: 'var(--depth)',
      border: '1px solid var(--rim)',
      borderRadius: '12px',
      padding: '18px 20px',
      marginBottom: '1.25rem',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Header row */}
      <div style={{
        fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)',
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 700,
      }}>Interview readiness</div>

      {/* Score + level */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '10px' }}>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: '44px', fontWeight: 900,
          letterSpacing: '-0.04em', color, lineHeight: 1,
        }}>
          {r.score}%
        </span>
        <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color, fontWeight: 600 }}>
          {label}
        </span>
      </div>

      {/* Amber progress bar */}
      <div style={{ width: '100%', height: '5px', background: 'var(--rim)', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
        <div style={{ width: `${r.score}%`, height: '100%', background: color, transition: 'width 0.5s' }} />
      </div>

      {/* Target countdown + weakest CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setEditing(e => !e)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: days != null ? 'rgba(240,165,0,0.1)' : 'var(--surface)',
            border: '1px solid ' + (days != null ? 'rgba(240,165,0,0.35)' : 'var(--rim)'),
            borderRadius: '999px', padding: '6px 14px',
            fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: days != null ? 'var(--prime)' : 'var(--ink-mid)',
            cursor: 'pointer',
          }}
        >
          <span>{countdownText}</span>
          {days != null && <span style={{ fontSize: '10px', color: 'var(--ink-ghost)' }}>{editing ? 'close' : 'edit'}</span>}
        </button>

        {r.weakest && weakTab && (
          <button
            onClick={() => onNavigate && onNavigate(weakTab)}
            style={{
              flexShrink: 0, fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: 'var(--void, #111)', background: 'var(--prime)', border: 'none',
              borderRadius: '7px', padding: '8px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Work on {r.weakest.label} next →
          </button>
        )}
      </div>

      {/* Target editor (collapsible) */}
      {editing && (
        <div style={{
          marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--rim)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
          gap: '12px', alignItems: 'flex-end',
        }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-low)' }}>Target company</span>
            <select
              value={target.company}
              onChange={e => save({ ...target, company: e.target.value })}
              style={{
                background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '7px',
                padding: '7px 9px', fontSize: '13px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)',
              }}
            >
              <option value="">No company set</option>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-low)' }}>Target interview date</span>
            <input
              type="date"
              value={target.date}
              onChange={e => save({ ...target, date: e.target.value })}
              style={{
                background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '7px',
                padding: '7px 9px', fontSize: '13px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)',
              }}
            />
          </label>
          {(target.company || target.date) && (
            <button
              onClick={() => save({ company: '', date: '' })}
              style={{
                background: 'transparent', border: '1px solid var(--rim)', borderRadius: '7px',
                padding: '7px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--ink-low)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)', justifySelf: 'flex-start',
              }}
            >
              Clear target
            </button>
          )}
        </div>
      )}

      {/* Gentle nudge when no target set */}
      {days == null && !editing && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--ink-ghost)', lineHeight: 1.5 }}>
          Set a target company and interview date to turn your prep into a countdown.
        </div>
      )}
    </div>
  )
}
