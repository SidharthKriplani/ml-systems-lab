import { useState } from 'react'
import { loadPython, runPython } from '../python.js'
import { sortByDifficulty } from '../utils/foundations/sortByDifficulty.js'

/**
 * GradedCell — auto-graded runnable coding exercise for MSL.
 *
 * Two exports:
 *   MLImplementBrowser — lists exercises as cards, opens one on click.
 *   GradedCell (default) — the runner: prompt + editor + Run + Check (auto-grade)
 *                          + reveal-solution + progressive hints.
 *
 * Grading contract: exercise.tests is pure Python asserts referencing what the
 * user defines in exercise.starter. Raises AssertionError on failure, silent on
 * success. Check composes userCode + "\n\n" + tests and runs via runPython;
 * res.ok === true (no exception raised) means every assert passed.
 */

/* ─── tiny inline markdown renderer (**bold**, `code`, \n\n paragraphs) ─── */
function renderInline(text) {
  // split on `code` and **bold**, keep delimiters
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={i} style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>
          {p.slice(2, -2)}
        </strong>
      )
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <code
          key={i}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.92em',
            background: 'var(--depth)',
            border: '1px solid var(--rim)',
            borderRadius: '4px',
            padding: '1px 5px',
            color: 'var(--prime-hi)',
          }}
        >
          {p.slice(1, -1)}
        </code>
      )
    }
    return p
  })
}

function Prose({ text }) {
  const paras = String(text).split(/\n\n+/)
  return (
    <div>
      {paras.map((para, i) => (
        <p
          key={i}
          style={{
            margin: i === 0 ? '0 0 10px' : '0 0 10px',
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'var(--ink-low)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {renderInline(para)}
        </p>
      ))}
    </div>
  )
}

/* ─── difficulty chip ─── */
function DiffChip({ difficulty }) {
  const map = {
    Easy: 'var(--mint)',
    Medium: 'var(--prime-hi)',
    Hard: 'var(--rose)',
  }
  const color = map[difficulty] || 'var(--ink-low)'
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color,
        border: `1px solid ${color}`,
        borderRadius: '999px',
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {difficulty || 'Exercise'}
    </span>
  )
}

/* ─── EXPORT 1: the browser / list view ─── */
export function MLImplementBrowser({ exercises = [], doneSet, onOpen }) {
  const isDone = id =>
    doneSet && (typeof doneSet.has === 'function' ? doneSet.has(id) : !!doneSet[id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sortByDifficulty(exercises).map(ex => {
        const done = isDone(ex.id)
        return (
          <button
            key={ex.id}
            onClick={() => onOpen?.(ex)}
            style={{
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: 'var(--card-pad-secondary, 16px)',
              background: 'var(--depth)',
              border: `1px solid ${done ? 'var(--mint)' : 'var(--rim)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--ink-hi)',
                  lineHeight: 1.3,
                }}
              >
                {ex.title}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {done && (
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--mint)',
                    }}
                  >
                    ✓ Solved
                  </span>
                )}
                <DiffChip difficulty={ex.difficulty} />
              </span>
            </div>
            {ex.topic && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#525a82',
                }}
              >
                {ex.topic}
              </span>
            )}
          </button>
        )
      })}
      {exercises.length === 0 && (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--ink-low)',
            fontSize: '13px',
            border: '1px dashed var(--rim)',
            borderRadius: '12px',
          }}
        >
          No exercises available.
        </div>
      )}
    </div>
  )
}

/* ─── EXPORT 2 (default): the graded runner ─── */
export default function GradedCell({ exercise, onBack, onSolved }) {
  const [code, setCode] = useState(exercise?.starter || '')
  const [status, setStatus] = useState('idle') // idle | loading | running | ok | fail | error
  const [progress, setProgress] = useState('')
  const [stdout, setStdout] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const [passed, setPassed] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [hintsShown, setHintsShown] = useState(0)

  const hints = exercise?.hints || []
  const isBusy = status === 'loading' || status === 'running'

  async function ensurePython() {
    setStatus('loading')
    setProgress('Loading Python runtime ~3s')
    try {
      await loadPython(msg => setProgress(msg))
      return true
    } catch (e) {
      setStatus('error')
      setErrMsg('Failed to load Python runtime: ' + e.message)
      return false
    }
  }

  // Run the user's code alone — just show stdout/errors, no grading.
  async function handleRun() {
    setStdout('')
    setErrMsg('')
    setPassed(false)
    if (!(await ensurePython())) return

    setStatus('running')
    setProgress('')
    const res = await runPython(code)
    if (res.ok) {
      setStatus('idle')
      setStdout(res.stdout || '(no output)')
      setErrMsg('')
    } else {
      setStatus('error')
      setStdout(res.stdout || '')
      setErrMsg(res.error || 'Unknown error')
    }
  }

  // Check — compose user code + tests, grade on res.ok.
  async function handleCheck() {
    setStdout('')
    setErrMsg('')
    setPassed(false)
    if (!(await ensurePython())) return

    setStatus('running')
    setProgress('')
    const graded = code + '\n\n' + (exercise?.tests || '')
    const res = await runPython(graded)

    if (res.ok) {
      setStatus('ok')
      setPassed(true)
      setStdout(res.stdout || '')
      setErrMsg('')
      onSolved?.(exercise?.id)
    } else {
      setStatus('fail')
      setPassed(false)
      setStdout(res.stdout || '')
      setErrMsg(res.error || 'A test failed.')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = code.slice(0, start) + '    ' + code.slice(end)
      setCode(next)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4
      })
    }
  }

  function handleReset() {
    setCode(exercise?.starter || '')
    setStatus('idle')
    setStdout('')
    setErrMsg('')
    setPassed(false)
  }

  if (!exercise) {
    return (
      <div style={{ padding: '24px', color: 'var(--ink-low)' }}>No exercise selected.</div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header row: back + title + difficulty */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: '1px solid var(--rim)',
                borderRadius: '8px',
                color: 'var(--ink-low)',
                fontSize: '12px',
                padding: '5px 12px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          )}
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--ink-hi)' }}>
            {exercise.title}
          </h3>
        </div>
        <DiffChip difficulty={exercise.difficulty} />
      </div>

      {/* Prompt */}
      <div
        style={{
          padding: 'var(--card-pad-secondary, 16px)',
          background: 'var(--depth)',
          border: '1px solid var(--rim)',
          borderRadius: '12px',
        }}
      >
        <Prose text={exercise.prompt || ''} />
      </div>

      {/* Editor cell */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--rim)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* cell header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'var(--depth)',
            borderBottom: '1px solid var(--rim)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#525a82',
              }}
            >
              ⌁
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#525a82',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Your solution
            </span>
            {status === 'ok' && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--mint)',
                  boxShadow: '0 0 6px var(--mint)',
                  display: 'inline-block',
                }}
              />
            )}
            {(status === 'fail' || status === 'error') && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--rose)',
                  display: 'inline-block',
                }}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isBusy && progress && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--violet, #6366f1)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {progress}
              </span>
            )}
            <button
              onClick={handleReset}
              disabled={isBusy}
              style={{
                background: 'none',
                border: '1px solid var(--rim)',
                borderRadius: '6px',
                color: 'var(--ink-low)',
                fontSize: '11px',
                padding: '4px 10px',
                cursor: isBusy ? 'default' : 'pointer',
                opacity: isBusy ? 0.5 : 1,
              }}
            >
              ↺ Reset
            </button>
            <button
              onClick={handleRun}
              disabled={isBusy}
              className="btn-run"
              style={{ fontSize: '12px', padding: '5px 14px' }}
            >
              {isBusy ? '⟳ Running…' : '▶ Run'}
            </button>
            <button
              onClick={handleCheck}
              disabled={isBusy}
              style={{
                fontSize: '12px',
                padding: '5px 16px',
                borderRadius: '8px',
                border: '1px solid var(--mint)',
                background: 'var(--mint)',
                color: '#05060f',
                fontWeight: 700,
                cursor: isBusy ? 'default' : 'pointer',
                opacity: isBusy ? 0.6 : 1,
              }}
            >
              ✓ Check
            </button>
          </div>
        </div>

        {/* editor */}
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          style={{
            width: '100%',
            height: '300px',
            resize: 'vertical',
            background: '#070810',
            color: '#8891b8',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            lineHeight: 1.7,
            padding: 'var(--card-pad-secondary, 16px)',
            border: 'none',
            outline: 'none',
          }}
        />
      </div>

      {/* Loading panel — Pyodide cold start */}
      {status === 'loading' && (
        <div
          style={{
            background: '#030408',
            padding: '18px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid var(--rim)',
            borderRadius: '12px',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              display: 'inline-block',
              animation: 'spin 1s linear infinite',
            }}
          >
            ⟳
          </span>
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: 'var(--violet, #6366f1)',
                fontWeight: 600,
              }}
            >
              {progress || 'Loading Python runtime ~3s'}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: 'var(--ink-low)',
                marginTop: '3px',
              }}
            >
              First run loads Pyodide + numpy/pandas/sklearn (~3s)
            </div>
          </div>
        </div>
      )}

      {/* Grade banner */}
      {passed && (
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(52,211,153,0.10)',
            border: '1px solid var(--mint)',
            borderRadius: '12px',
            color: 'var(--mint)',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ✓ All tests passed
        </div>
      )}
      {status === 'fail' && (
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid var(--rose)',
            borderRadius: '12px',
            color: 'var(--rose)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          ✗ Tests failed — check the output below.
        </div>
      )}

      {/* Output (stdout / error) */}
      {(stdout || errMsg) && (
        <div
          style={{
            background: '#030408',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            border: '1px solid var(--rim)',
            borderRadius: '12px',
          }}
        >
          {stdout && (
            <pre className="py-output" style={{ margin: 0 }}>
              {stdout}
            </pre>
          )}
          {errMsg && (
            <pre className="py-output py-error" style={{ margin: 0 }}>
              {errMsg}
            </pre>
          )}
        </div>
      )}

      {/* Hints */}
      {hints.length > 0 && (
        <div
          style={{
            padding: 'var(--card-pad-secondary, 16px)',
            background: 'var(--depth)',
            border: '1px solid var(--rim)',
            borderRadius: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#525a82',
              }}
            >
              Hints ({hintsShown}/{hints.length})
            </span>
            {hintsShown < hints.length && (
              <button
                onClick={() => setHintsShown(n => n + 1)}
                style={{
                  background: 'none',
                  border: '1px solid var(--rim)',
                  borderRadius: '8px',
                  color: 'var(--prime-hi)',
                  fontSize: '12px',
                  padding: '5px 12px',
                  cursor: 'pointer',
                }}
              >
                {hintsShown === 0 ? 'Show a hint' : 'Show next hint'}
              </button>
            )}
          </div>
          {hintsShown > 0 && (
            <ol style={{ margin: '10px 0 0', paddingLeft: '20px' }}>
              {hints.slice(0, hintsShown).map((h, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.6,
                    color: 'var(--ink-low)',
                    marginBottom: '6px',
                  }}
                >
                  {renderInline(h)}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Reveal solution */}
      {exercise.solution && (
        <div>
          <button
            onClick={() => setShowSolution(s => !s)}
            style={{
              background: 'none',
              border: '1px solid var(--rim)',
              borderRadius: '8px',
              color: 'var(--ink-low)',
              fontSize: '12px',
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            {showSolution ? '▾ Hide solution' : '▸ Reveal solution'}
          </button>
          {showSolution && (
            <pre
              className="py-output"
              style={{
                margin: '10px 0 0',
                background: '#070810',
                border: '1px solid var(--rim)',
                borderRadius: '12px',
                padding: 'var(--card-pad-secondary, 16px)',
              }}
            >
              {exercise.solution}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
