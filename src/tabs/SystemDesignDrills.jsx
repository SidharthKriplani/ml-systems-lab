import React, { useState } from 'react'
import { SD_SCENARIOS_MSL } from '../data/foundations/sdScenariosMSL.js'
import { AddTrackBtn } from '../components/tracks/AddToTrackPopover.jsx'

const LS_KEY = 'msl-sd-drills-last'

function saveLast(id) {
  try { localStorage.setItem(LS_KEY, id) } catch { /* ignore */ }
}

const RATINGS = [
  { key: 'weak',   label: 'Weak',   color: 'var(--rose)' },
  { key: 'ok',     label: 'OK',     color: 'var(--ink-low)' },
  { key: 'strong', label: 'Strong', color: 'var(--mint)' },
]

// ─── Small shared UI bits ────────────────────────────────────────────────────

function Eyebrow({ children, color = 'var(--ink-low)' }) {
  return (
    <div style={{ fontSize: '10px', color, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
      {children}
    </div>
  )
}

function CheckMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Scenario picker ─────────────────────────────────────────────────────────

function ScenarioPicker({ scenarios, onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.65, maxWidth: '620px' }}>
        Staged ML system-design drills. Each scenario walks through 5 stages — attempt each one from memory using the self-check, then reveal the model coverage. Finish with a rubric scorecard to see where you are interview-ready and where to focus.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {scenarios.map(sc => (
          <div
            key={sc.id}
            role="button"
            tabIndex={0}
            onClick={() => onPick(sc.id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(sc.id) } }}
            className="card"
            style={{ textAlign: 'left', cursor: 'pointer', width: '100%', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'border-color 0.12s' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)' }}>{sc.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>{(sc.stages || []).length} stages →</span>
                <span onClick={e => e.stopPropagation()}>
                  <AddTrackBtn itemType="sd_drill" itemId={sc.id} label={sc.title} itemMeta={{ tag: (sc.tags || [])[0] }} />
                </span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.prompt}</p>
            {sc.tags && sc.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {sc.tags.map(t => (
                  <span key={t} style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '999px', background: 'var(--depth)', border: '1px solid var(--rim)', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Single stage ────────────────────────────────────────────────────────────

function StageView({ stage, checks, onToggleCheck, revealed, onReveal }) {
  const considerations = stage.considerations || []
  const checkedCount = considerations.filter((_, i) => checks[i]).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Ask */}
      <div className="card" style={{ padding: '18px 20px', borderColor: 'rgba(240,165,0,0.30)', background: 'rgba(240,165,0,0.07)' }}>
        <Eyebrow color="var(--prime)">Your task</Eyebrow>
        <p style={{ fontSize: '14px', color: 'var(--ink-hi)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{stage.ask}</p>
      </div>

      {/* Attempt-first self-check */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>
            Answer out loud first. Then tick the points you actually covered.
          </div>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{checkedCount}/{considerations.length} covered</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {considerations.map((c, i) => {
            const on = !!checks[i]
            return (
              <button
                key={i}
                onClick={() => onToggleCheck(i)}
                style={{
                  textAlign: 'left', padding: '11px 14px', borderRadius: '8px', cursor: 'pointer',
                  border: `1px solid ${on ? 'rgba(52,211,153,0.45)' : 'var(--rim)'}`,
                  background: on ? 'rgba(52,211,153,0.10)' : 'var(--depth)',
                  display: 'flex', alignItems: 'flex-start', gap: '10px', transition: 'all 0.12s',
                }}
              >
                <span style={{ width: '17px', height: '17px', borderRadius: '5px', border: `2px solid ${on ? 'var(--mint)' : 'var(--rim)'}`, background: on ? 'var(--mint)' : 'transparent', color: 'var(--void)', flexShrink: 0, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <CheckMark />}
                </span>
                <span style={{ fontSize: '13px', color: on ? 'var(--ink-hi)' : 'var(--ink-mid)', lineHeight: 1.55 }}>{c}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Reveal */}
      {!revealed ? (
        <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={onReveal}>
          Reveal model coverage →
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Strong */}
          <div className="card" style={{ padding: '16px 18px', borderColor: 'rgba(52,211,153,0.30)', background: 'rgba(52,211,153,0.07)' }}>
            <Eyebrow color="var(--mint)">What strong answers cover</Eyebrow>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {(stage.strong || []).map((s, i) => (
                <li key={i} style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Traps */}
          <div className="card" style={{ padding: '16px 18px', borderColor: 'rgba(244,63,94,0.28)', background: 'rgba(244,63,94,0.07)' }}>
            <Eyebrow color="var(--rose)">Traps that sink the answer</Eyebrow>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {(stage.traps || []).map((t, i) => (
                <li key={i} style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{t}</li>
              ))}
            </ul>
          </div>

          {/* Probes */}
          <div className="card" style={{ padding: '16px 18px', borderColor: 'var(--rim)', background: 'var(--depth)' }}>
            <Eyebrow color="var(--prime)">Interviewer follow-ups to expect</Eyebrow>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {(stage.probes || []).map((p, i) => (
                <li key={i} style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, fontStyle: 'italic' }}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Rubric scorecard ────────────────────────────────────────────────────────

function Scorecard({ rubric, ratings, onRate, onRestart, onTryAnother }) {
  const rated = rubric.filter((_, i) => ratings[i])
  const allRated = rated.length === rubric.length
  const strongCount = rubric.filter((_, i) => ratings[i] === 'strong').length
  const okCount = rubric.filter((_, i) => ratings[i] === 'ok').length
  const belowStrong = rubric.filter((_, i) => ratings[i] && ratings[i] !== 'strong')

  let verdict = null
  if (allRated) {
    if (strongCount === rubric.length) verdict = { text: 'Interview-ready across the board. This is a hire-signal answer.', color: 'var(--mint)' }
    else if (strongCount >= 5) verdict = { text: 'Strong overall — tighten the remaining dimensions and this is a clear pass.', color: 'var(--prime)' }
    else if (strongCount + okCount >= 5) verdict = { text: 'Solid foundation with real gaps. Drill the weak dimensions before the loop.', color: 'var(--prime)' }
    else verdict = { text: 'Early — the structure is there but the depth is not yet at interview bar.', color: 'var(--ink-low)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <Eyebrow color="var(--prime)">Rubric scorecard</Eyebrow>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.6, maxWidth: '600px' }}>
          Rate your own answer honestly on each dimension. Weak/OK dimensions become your focus list.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rubric.map((r, i) => {
          const chosen = ratings[i]
          return (
            <div key={i} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--ink-hi)' }}>{r.dim}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--mint)', lineHeight: 1.55 }}><strong style={{ color: 'var(--mint)' }}>Strong:</strong> <span style={{ color: 'var(--ink-mid)' }}>{r.strong}</span></div>
                <div style={{ fontSize: '12.5px', color: 'var(--rose)', lineHeight: 1.55 }}><strong style={{ color: 'var(--rose)' }}>Weak:</strong> <span style={{ color: 'var(--ink-mid)' }}>{r.weak}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {RATINGS.map(rt => {
                  const active = chosen === rt.key
                  return (
                    <button
                      key={rt.key}
                      onClick={() => onRate(i, rt.key)}
                      style={{
                        fontSize: '12px', padding: '6px 16px', borderRadius: '7px', cursor: 'pointer',
                        border: `1px solid ${active ? rt.color : 'var(--rim)'}`,
                        background: active ? `${rt.color === 'var(--ink-low)' ? 'rgba(255,255,255,0.05)' : rt.color + '18'}` : 'transparent',
                        color: active ? rt.color : 'var(--ink-low)',
                        fontFamily: 'var(--font-sans)', fontWeight: 600, transition: 'all 0.12s',
                      }}
                    >
                      {rt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Verdict */}
      {allRated && verdict && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Strong', count: strongCount, color: 'var(--mint)' },
              { label: 'OK', count: okCount, color: 'var(--ink-low)' },
              { label: 'Weak', count: rubric.length - strongCount - okCount, color: 'var(--rose)' },
            ].filter(b => b.count > 0).map(b => (
              <div key={b.label} style={{ padding: '8px 16px', borderRadius: '8px', background: `${b.color === 'var(--ink-low)' ? 'rgba(255,255,255,0.05)' : b.color + '12'}`, border: `1px solid ${b.color}35`, textAlign: 'center', minWidth: '64px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: b.color, fontFamily: 'var(--font-sans)' }}>{b.count}</div>
                <div style={{ fontSize: '11px', color: b.color, fontFamily: 'var(--font-sans)' }}>{b.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px 18px', background: `${verdict.color === 'var(--ink-low)' ? 'rgba(255,255,255,0.04)' : verdict.color + '0d'}`, border: `1px solid ${verdict.color}35`, borderRadius: '10px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: verdict.color, margin: 0, fontFamily: 'var(--font-sans)', lineHeight: 1.55 }}>{verdict.text}</p>
          </div>

          {belowStrong.length > 0 && (
            <div className="card" style={{ padding: '16px 18px', borderColor: 'rgba(244,63,94,0.25)' }}>
              <Eyebrow color="var(--rose)">Focus on these</Eyebrow>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {belowStrong.map((r, i) => (
                  <li key={i} style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>{r.dim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={onRestart}>Restart this scenario</button>
        <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={onTryAnother}>Try another scenario</button>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function SystemDesignDrills() {
  const scenarios = Array.isArray(SD_SCENARIOS_MSL) ? SD_SCENARIOS_MSL : []

  const [activeId, setActiveId] = useState(null) // always start at the picker
  const [stageIdx, setStageIdx] = useState(0)
  const [checksByStage, setChecksByStage] = useState({})   // stageIdx -> { [i]: bool }
  const [revealedStages, setRevealedStages] = useState({}) // stageIdx -> bool
  const [phase, setPhase] = useState('picker')             // 'picker' | 'stages' | 'scorecard'
  const [ratings, setRatings] = useState({})               // rubricIdx -> 'weak'|'ok'|'strong'

  const active = scenarios.find(s => s.id === activeId) || null
  const stages = active?.stages || []
  const rubric = active?.rubric || []

  function pick(id) {
    setActiveId(id)
    setStageIdx(0)
    setChecksByStage({})
    setRevealedStages({})
    setRatings({})
    setPhase('stages')
    saveLast(id)
  }

  function backToPicker() {
    setPhase('picker')
    setActiveId(null)
  }

  function restartScenario() {
    setStageIdx(0)
    setChecksByStage({})
    setRevealedStages({})
    setRatings({})
    setPhase('stages')
  }

  function toggleCheck(i) {
    setChecksByStage(prev => {
      const cur = prev[stageIdx] || {}
      return { ...prev, [stageIdx]: { ...cur, [i]: !cur[i] } }
    })
  }

  function reveal() {
    setRevealedStages(prev => ({ ...prev, [stageIdx]: true }))
  }

  function nextStage() {
    if (stageIdx < stages.length - 1) setStageIdx(stageIdx + 1)
    else setPhase('scorecard')
  }

  function prevStage() {
    if (stageIdx > 0) setStageIdx(stageIdx - 1)
  }

  // ── Picker ──
  if (phase === 'picker' || !active) {
    if (scenarios.length === 0) {
      return (
        <div style={{ padding: '20px', border: '1px solid var(--rim)', borderRadius: '10px', color: 'var(--ink-low)', fontSize: '13px' }}>
          No design drill scenarios are loaded yet.
        </div>
      )
    }
    return <ScenarioPicker scenarios={scenarios} onPick={pick} />
  }

  const stage = stages[stageIdx]

  // ── Header (shared by stages + scorecard) ──
  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={backToPicker}>← Back to scenarios</button>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
          {phase === 'scorecard' ? 'Scorecard' : `Stage ${stageIdx + 1} / ${stages.length}`}
        </span>
      </div>

      <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '17px', color: 'var(--prime)' }}>{active.title}</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{active.prompt}</p>
        {active.context && <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0 }}>{active.context}</p>}
      </div>

      {/* Stage progress dots */}
      {phase === 'stages' && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {stages.map((s, i) => {
            const isCur = i === stageIdx
            const done = !!revealedStages[i]
            return (
              <button
                key={s.id || i}
                onClick={() => setStageIdx(i)}
                title={s.title}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', cursor: 'pointer',
                  border: `1px solid ${isCur ? 'var(--prime)' : done ? 'rgba(52,211,153,0.4)' : 'var(--rim)'}`,
                  background: isCur ? 'rgba(240,165,0,0.12)' : 'transparent',
                  color: isCur ? 'var(--prime)' : done ? 'var(--mint)' : 'var(--ink-low)',
                  fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600, transition: 'all 0.12s',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)' }}>{String(i + 1).padStart(2, '0')}</span>
                <span>{s.title}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Scorecard phase ──
  if (phase === 'scorecard') {
    return (
      <div>
        {header}
        <Scorecard
          rubric={rubric}
          ratings={ratings}
          onRate={(i, key) => setRatings(prev => ({ ...prev, [i]: key }))}
          onRestart={restartScenario}
          onTryAnother={backToPicker}
        />
      </div>
    )
  }

  // ── Stages phase ──
  const revealed = !!revealedStages[stageIdx]
  const isLast = stageIdx === stages.length - 1

  return (
    <div>
      {header}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)', marginBottom: '4px' }}>
          {stage.title}
        </div>
      </div>

      <StageView
        stage={stage}
        checks={checksByStage[stageIdx] || {}}
        onToggleCheck={toggleCheck}
        revealed={revealed}
        onReveal={reveal}
      />

      {/* Stage nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '26px', flexWrap: 'wrap' }}>
        <button
          className="btn-ghost"
          style={{ fontSize: '12px', opacity: stageIdx === 0 ? 0.4 : 1, cursor: stageIdx === 0 ? 'not-allowed' : 'pointer' }}
          disabled={stageIdx === 0}
          onClick={prevStage}
        >
          ← Previous stage
        </button>
        <button className="btn-primary" onClick={nextStage}>
          {isLast ? 'Finish → Rubric scorecard' : 'Next stage →'}
        </button>
      </div>
    </div>
  )
}
