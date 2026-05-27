import { useState, useRef } from 'react'
import { loadPython, runPython, runPythonWithPlot } from '../python.js'

/**
 * PythonCell — editable code cell with stdout + matplotlib plot output.
 * Props:
 *   initialCode   string  — starter code
 *   height        number  — textarea height in px (default 220)
 *   withPlot      bool    — if true, captures matplotlib figure as PNG
 *   readOnly      bool    — hide editor, just show run button
 *   label         string  — cell label
 *   onResult      fn      — callback with { ok, result, stdout, imgSrc }
 */
export default function PythonCell({
  initialCode = '',
  height = 220,
  withPlot = false,
  readOnly = false,
  label = 'Python',
  onResult,
}) {
  const [code, setCode]         = useState(initialCode)
  const [status, setStatus]     = useState('idle')   // idle | loading | running | done | error
  const [progress, setProgress] = useState('')
  const [stdout, setStdout]     = useState('')
  const [imgSrc, setImgSrc]     = useState(null)
  const [errMsg, setErrMsg]     = useState('')
  const abortRef = useRef(false)

  async function handleRun() {
    abortRef.current = false
    setStatus('loading')
    setStdout('')
    setImgSrc(null)
    setErrMsg('')

    try {
      await loadPython(msg => {
        if (!abortRef.current) setProgress(msg)
      })
    } catch (e) {
      setStatus('error')
      setErrMsg('Failed to load Python runtime: ' + e.message)
      return
    }

    setStatus('running')
    setProgress('')

    const res = withPlot
      ? await runPythonWithPlot(code)
      : await runPython(code)

    if (abortRef.current) return

    if (res.ok) {
      setStatus('done')
      setStdout(res.stdout || '')
      if (withPlot && typeof res.result === 'string') {
        setImgSrc('data:image/png;base64,' + res.result)
      }
      onResult?.({ ok: true, result: res.result, stdout: res.stdout, imgSrc: res.result })
    } else {
      setStatus('error')
      setErrMsg(res.error || 'Unknown error')
      setStdout(res.stdout || '')
      onResult?.({ ok: false, error: res.error })
    }
  }

  const isRunning = status === 'loading' || status === 'running'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid var(--rim)', borderRadius: '12px', overflow: 'hidden' }}>

      {/* Cell header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--depth)', borderBottom: '1px solid var(--rim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#525a82' }}>⌁</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#525a82', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
          {status === 'done' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block' }} />}
          {status === 'error' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isRunning && progress && (
            <span style={{ fontSize: '11px', color: '#6366f1', fontFamily: "'JetBrains Mono', monospace" }}>
              {progress}
            </span>
          )}
          <button
            className="btn-run"
            onClick={handleRun}
            disabled={isRunning}
            style={{ fontSize: '12px', padding: '5px 14px' }}
          >
            {isRunning
              ? <><span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span> Running…</>
              : '▶ Run'
            }
          </button>
        </div>
      </div>

      {/* Code editor */}
      {!readOnly && (
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          spellCheck={false}
          style={{
            width: '100%',
            height: `${height}px`,
            resize: 'vertical',
            background: '#070810',
            color: '#8891b8',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            lineHeight: 1.7,
            padding: '16px',
            border: 'none',
            outline: 'none',
            borderBottom: '1px solid var(--rim)',
          }}
        />
      )}

      {/* Loading panel — visible during Pyodide cold start */}
      {status === 'loading' && (
        <div style={{ background: '#030408', padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--rim)' }}>
          <span style={{ fontSize: '18px', display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--violet)', fontWeight: 600 }}>
              {progress || 'Loading Python runtime…'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)', marginTop: '3px' }}>
              First run takes ~3s to load Pyodide + numpy/sklearn
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      {(stdout || imgSrc || errMsg) && (
        <div style={{ background: '#030408', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stdout && (
            <pre className={`py-output ${status === 'error' ? 'py-error' : ''}`} style={{ margin: 0 }}>
              {stdout}
            </pre>
          )}
          {errMsg && !stdout && (
            <pre className="py-output py-error" style={{ margin: 0 }}>
              {errMsg}
            </pre>
          )}
          {imgSrc && (
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--rim)' }}>
              <img src={imgSrc} alt="plot output" style={{ width: '100%', display: 'block' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
