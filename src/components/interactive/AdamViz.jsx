import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// ── Optimizer implementations ─────────────────────────────────────────────────

function runSGD(lr = 0.08) {
  let w1 = -1.8, w2 = 2.8
  const path = [[w1, w2]]
  for (let i = 0; i < 200; i++) {
    const g1 = 8 * w1, g2 = 0.5 * w2
    w1 -= lr * g1; w2 -= lr * g2
    path.push([w1, w2])
    if (Math.hypot(w1, w2) < 0.01) break
  }
  return path
}

function runMomentum(lr = 0.08, beta = 0.9) {
  let w1 = -1.8, w2 = 2.8, v1 = 0, v2 = 0
  const path = [[w1, w2]]
  for (let i = 0; i < 200; i++) {
    const g1 = 8 * w1, g2 = 0.5 * w2
    v1 = beta * v1 + lr * g1; v2 = beta * v2 + lr * g2
    w1 -= v1; w2 -= v2
    path.push([w1, w2])
    if (Math.hypot(w1, w2) < 0.01) break
  }
  return path
}

function runRMSProp(lr = 0.08, beta = 0.99, eps = 1e-8) {
  let w1 = -1.8, w2 = 2.8, v1 = 0, v2 = 0
  const path = [[w1, w2]]
  for (let i = 0; i < 200; i++) {
    const g1 = 8 * w1, g2 = 0.5 * w2
    v1 = beta * v1 + (1 - beta) * g1 * g1; v2 = beta * v2 + (1 - beta) * g2 * g2
    w1 -= lr * g1 / (Math.sqrt(v1) + eps); w2 -= lr * g2 / (Math.sqrt(v2) + eps)
    path.push([w1, w2])
    if (Math.hypot(w1, w2) < 0.01) break
  }
  return path
}

function runAdam(lr = 0.08, b1 = 0.9, b2 = 0.999, eps = 1e-8) {
  let w1 = -1.8, w2 = 2.8, m1 = 0, m2 = 0, v1 = 0, v2 = 0
  const path = [[w1, w2]]
  for (let t = 1; t <= 200; t++) {
    const g1 = 8 * w1, g2 = 0.5 * w2
    m1 = b1 * m1 + (1 - b1) * g1; m2 = b1 * m2 + (1 - b1) * g2
    v1 = b2 * v1 + (1 - b2) * g1 * g1; v2 = b2 * v2 + (1 - b2) * g2 * g2
    const mc1 = m1 / (1 - Math.pow(b1, t)), mc2 = m2 / (1 - Math.pow(b1, t))
    const vc1 = v1 / (1 - Math.pow(b2, t)), vc2 = v2 / (1 - Math.pow(b2, t))
    w1 -= lr * mc1 / (Math.sqrt(vc1) + eps); w2 -= lr * mc2 / (Math.sqrt(vc2) + eps)
    path.push([w1, w2])
    if (Math.hypot(w1, w2) < 0.01) break
  }
  return path
}

// ── Effective LR computation ──────────────────────────────────────────────────

const GRAD_HISTORY = [
  [2.1, 1.8, 2.3, 1.9, 2.0, 2.2, 1.7, 2.1, 1.8, 2.0],
  [0.1, 0.2, 0.1, 0.3, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2],
  [3.0, -2.5, 2.8, -3.1, 2.9, -2.7, 3.1, -2.8, 2.9, -3.0],
  [0.5, 0.0, 0.0, 0.6, 0.0, 0.0, 0.5, 0.0, 0.0, 0.6],
  [1.0, 1.5, 0.8, 1.2, 1.1, 1.4, 0.9, 1.3, 1.0, 1.2],
  [0.0, 0.0, 4.0, 0.0, 0.0, 4.5, 0.0, 0.0, 4.2, 0.0],
  [0.3, 0.4, 0.3, 0.4, 0.3, 0.4, 0.3, 0.4, 0.3, 0.4],
  [1.8, 1.9, 2.0, 1.7, 1.8, 1.9, 2.0, 1.8, 1.7, 1.9],
]

function computeAdamEffectiveLR(paramIdx, step, b2 = 0.999, eps = 1e-8, lr = 0.08) {
  const grads = GRAD_HISTORY[paramIdx]
  let v = 0
  const k = Math.min(step, grads.length)
  for (let t = 1; t <= k; t++) {
    const g = grads[t - 1]
    v = b2 * v + (1 - b2) * g * g
  }
  if (k === 0) return lr
  const vHat = v / (1 - Math.pow(b2, k))
  return lr / (Math.sqrt(vHat) + eps)
}

// ── Loss surface coloring ─────────────────────────────────────────────────────

function lossColor(w1, w2) {
  const L = 4 * w1 * w1 + 0.25 * w2 * w2
  const maxL = 4 * 4 + 0.25 * 9
  const t = Math.min(L / maxL, 1)
  const r = Math.round(10 + t * 30)
  const g = Math.round(15 + t * 40)
  const b = Math.round(40 + t * 80)
  return [r, g, b]
}

// ── Static data ───────────────────────────────────────────────────────────────

const PATHS = {
  sgd:      runSGD(),
  momentum: runMomentum(),
  rmsprop:  runRMSProp(),
  adam:     runAdam(),
}

const OPTIMIZERS = [
  { key: 'sgd',      label: 'SGD',      color: '#e85d4a' },
  { key: 'momentum', label: 'Momentum', color: '#4a9ebb' },
  { key: 'rmsprop',  label: 'RMSProp',  color: '#4eb87c' },
  { key: 'adam',     label: 'Adam',     color: 'var(--prime)' },
]

const MAX_STEPS = 200

// ── Main component ────────────────────────────────────────────────────────────

export const AdamViz = forwardRef(function AdamViz(props, ref) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const lastStepTimeRef = useRef(0)

  const [step,    setStep]    = useState(50)
  const [visible, setVisible] = useState({ sgd: true, momentum: true, rmsprop: true, adam: true })
  const [running, setRunning] = useState(false)

  // Map world coords → canvas pixels (left panel)
  const worldToCanvas = useCallback((w1, w2, cw, ch) => {
    const W1_MIN = -2, W1_MAX = 2
    const W2_MIN = -3, W2_MAX = 3
    const panelW = cw * 0.55
    const x = ((w1 - W1_MIN) / (W1_MAX - W1_MIN)) * panelW
    const y = ch - ((w2 - W2_MIN) / (W2_MAX - W2_MIN)) * ch
    return [x, y]
  }, [])

  // Draw everything
  const draw = useCallback((stepVal) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    if (canvas.width !== cw * devicePixelRatio || canvas.height !== ch * devicePixelRatio) {
      canvas.width  = cw * devicePixelRatio
      canvas.height = ch * devicePixelRatio
    }
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.clearRect(0, 0, cw, ch)

    const leftW  = Math.round(cw * 0.55)
    const rightW = cw - leftW
    const divX   = leftW

    // ── Left panel: loss surface heatmap ──────────────────────────────────────
    const imgData = ctx.createImageData(leftW, ch)
    const W1_MIN = -2, W1_MAX = 2, W2_MIN = -3, W2_MAX = 3
    for (let py = 0; py < ch; py++) {
      for (let px = 0; px < leftW; px++) {
        const w1 = W1_MIN + (px / leftW) * (W1_MAX - W1_MIN)
        const w2 = W2_MAX - (py / ch) * (W2_MAX - W2_MIN)
        const [r, g, b] = lossColor(w1, w2)
        const idx = (py * leftW + px) * 4
        imgData.data[idx]     = r
        imgData.data[idx + 1] = g
        imgData.data[idx + 2] = b
        imgData.data[idx + 3] = 255
      }
    }
    ctx.putImageData(imgData, 0, 0)

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth   = 1
    ctx.beginPath(); ctx.moveTo(divX, 0); ctx.lineTo(divX, ch); ctx.stroke()

    // Contour lines (10 levels)
    for (let level = 1; level <= 10; level++) {
      const targetL = (level / 10) * (4 * 4 + 0.25 * 9)
      ctx.beginPath()
      ctx.strokeStyle = `rgba(255,255,255,${0.06 + level * 0.03})`
      ctx.lineWidth = 0.5
      // approximate ellipse: 4w1² + 0.25w2² = targetL
      // w1 axis: w1 = sqrt(targetL/4), w2 axis: w2 = sqrt(targetL/0.25)
      const a = Math.sqrt(targetL / 4)    // semi-axis in w1 direction
      const b = Math.sqrt(targetL / 0.25) // semi-axis in w2 direction
      if (a > (W1_MAX - W1_MIN) / 2 && b > (W2_MAX - W2_MIN) / 2) continue
      for (let angle = 0; angle <= 2 * Math.PI + 0.01; angle += 0.05) {
        const w1 = a * Math.cos(angle)
        const w2 = b * Math.sin(angle)
        if (w1 < W1_MIN || w1 > W1_MAX || w2 < W2_MIN || w2 > W2_MAX) continue
        const [px, py] = worldToCanvas(w1, w2, cw, ch)
        if (angle === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
    }

    // Origin marker
    const [ox, oy] = worldToCanvas(0, 0, cw, ch)
    ctx.beginPath()
    ctx.arc(ox, oy, 4, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fill()

    // Draw optimizer paths
    OPTIMIZERS.forEach(({ key, color }) => {
      if (!visible[key]) return
      const path = PATHS[key]
      const nSteps = Math.min(stepVal, path.length - 1)
      if (nSteps < 1) return

      ctx.beginPath()
      ctx.strokeStyle = color === 'var(--prime)'
        ? getComputedStyle(document.documentElement).getPropertyValue('--prime').trim() || '#7c6ef5'
        : color
      ctx.lineWidth   = 1.8
      ctx.globalAlpha = 0.85
      const [sx, sy] = worldToCanvas(path[0][0], path[0][1], cw, ch)
      ctx.moveTo(sx, sy)
      for (let i = 1; i <= nSteps; i++) {
        const [px, py] = worldToCanvas(path[i][0], path[i][1], cw, ch)
        ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.globalAlpha = 1

      // Current position dot
      const [cx2, cy2] = worldToCanvas(path[nSteps][0], path[nSteps][1], cw, ch)
      ctx.beginPath()
      ctx.arc(cx2, cy2, 4, 0, 2 * Math.PI)
      ctx.fillStyle = ctx.strokeStyle
      ctx.fill()
    })

    // ── Right panel: effective learning rate bar chart ─────────────────────────
    const rX  = divX + 12
    const rW  = rightW - 24
    const rH  = ch
    const N   = 8
    const barH  = Math.floor((rH - 60) / N) - 4
    const SGD_LR = 0.08

    // title
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font      = `bold ${Math.max(10, Math.floor(rW / 22))}px sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText('Effective Learning Rate per Parameter', rX, 18)

    ctx.font      = `${Math.max(9, Math.floor(rW / 26))}px sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillText(`(step ${Math.max(1, stepVal)})`, rX, 32)

    const maxEffLR = 0.4 // scale cap for bar chart

    // SGD label
    ctx.fillStyle = '#e85d4a'
    ctx.font      = `${Math.max(9, Math.floor(rW / 28))}px sans-serif`
    ctx.fillText(`SGD flat = ${SGD_LR.toFixed(3)}`, rX + rW - 90, 18)

    const PARAM_LABELS = ['P0 large', 'P1 small', 'P2 osc', 'P3 sparse', 'P4 med', 'P5 spikes', 'P6 period', 'P7 large']

    for (let p = 0; p < N; p++) {
      const yBar = 44 + p * (barH + 4)
      const adamLR = computeAdamEffectiveLR(p, Math.max(1, stepVal))
      const sgdLR  = SGD_LR

      // background track
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.fillRect(rX + 52, yBar, rW - 52, barH)

      // SGD line (flat reference)
      const sgdBarW = Math.min((sgdLR / maxEffLR) * (rW - 52), rW - 52)
      ctx.fillStyle = 'rgba(232,93,74,0.25)'
      ctx.fillRect(rX + 52, yBar, sgdBarW, barH)
      ctx.strokeStyle = '#e85d4a'
      ctx.lineWidth   = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(rX + 52 + sgdBarW, yBar)
      ctx.lineTo(rX + 52 + sgdBarW, yBar + barH)
      ctx.stroke()
      ctx.setLineDash([])

      // Adam bar
      const adamColor = adamLR > sgdLR ? '#4eb87c' : '#4a9ebb'
      const adamBarW  = Math.min((adamLR / maxEffLR) * (rW - 52), rW - 52)
      ctx.fillStyle   = adamColor
      ctx.globalAlpha = 0.75
      ctx.fillRect(rX + 52, yBar + Math.floor(barH * 0.3), adamBarW, Math.floor(barH * 0.4))
      ctx.globalAlpha = 1

      // param label
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font      = `${Math.max(9, Math.floor(rW / 30))}px sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(PARAM_LABELS[p], rX + 50, yBar + Math.ceil(barH * 0.65))

      // value
      ctx.fillStyle = adamColor
      ctx.textAlign = 'left'
      ctx.fillText(adamLR.toFixed(4), rX + 52 + adamBarW + 3, yBar + Math.ceil(barH * 0.65))
    }

    // Legend
    ctx.textAlign = 'left'
    const legY = rH - 22
    ctx.fillStyle = 'rgba(232,93,74,0.8)'
    ctx.fillRect(rX, legY, 10, 10)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font      = '10px sans-serif'
    ctx.fillText('SGD (flat)', rX + 14, legY + 9)

    ctx.fillStyle = '#4eb87c'
    ctx.fillRect(rX + 80, legY, 10, 10)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('Adam > SGD', rX + 94, legY + 9)

    ctx.fillStyle = '#4a9ebb'
    ctx.fillRect(rX + 170, legY, 10, 10)
    ctx.fillText('Adam < SGD', rX + 184, legY + 9)

    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }, [visible, worldToCanvas])

  // Animate — time-gated so a full 200-step run takes ~5s and is observable.
  const STEP_INTERVAL = 150 // ms between gated advances
  const STEPS_PER_TICK = 6  // steps advanced each gated tick (200/6 ≈ 33 ticks × 150ms ≈ 5s)

  const startAnimation = useCallback(() => {
    if (running) return
    setRunning(true)
    let s = 0
    lastStepTimeRef.current = performance.now()
    const tick = (now) => {
      const t = typeof now === 'number' ? now : performance.now()
      if (t - lastStepTimeRef.current >= STEP_INTERVAL) {
        lastStepTimeRef.current = t
        s = Math.min(s + STEPS_PER_TICK, MAX_STEPS)
        setStep(s)
        draw(s)
      }
      if (s < MAX_STEPS) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        animRef.current = null
        setRunning(false)
      }
    }
    animRef.current = requestAnimationFrame(tick)
  }, [running, draw])

  // Draw on step/visible change
  useEffect(() => {
    draw(step)
  }, [step, visible, draw])

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => draw(step))
    ro.observe(canvas)
    draw(step)
    return () => {
      ro.disconnect()
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, []) // eslint-disable-line

  const play = useCallback(() => {
    if (animRef.current) return;
    let s = step;
    lastStepTimeRef.current = performance.now();
    const tick = (now) => {
      const t = typeof now === 'number' ? now : performance.now();
      if (t - lastStepTimeRef.current >= STEP_INTERVAL) {
        lastStepTimeRef.current = t;
        s = Math.min(s + STEPS_PER_TICK, MAX_STEPS);
        setStep(s);
        draw(s);
      }
      if (s < MAX_STEPS) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
        setRunning(false);
      }
    };
    setRunning(true);
    animRef.current = requestAnimationFrame(tick);
  }, [step, draw]);

  const pause = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    pause();
    setStep(0);
    draw(0);
  }, [pause, draw]);

  const stepOne = useCallback(() => {
    pause();
    setStep(s => {
      const ns = Math.min(s + 1, MAX_STEPS);
      draw(ns);
      return ns;
    });
  }, [pause, draw]);

  useImperativeHandle(ref, () => ({ play, pause, reset, step: stepOne }), [play, pause, reset, stepOne]);

  const toggleVisible = (key) =>
    setVisible(v => ({ ...v, [key]: !v[key] }))

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        <button
          onClick={startAnimation}
          disabled={running}
          style={{
            padding: '0.3rem 0.9rem', borderRadius: '5px', border: 'none',
            background: running ? 'var(--rim, #333)' : 'var(--prime, #7c6ef5)',
            color: '#fff', cursor: running ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
          }}
        >
          {running ? 'Running…' : 'Run'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '160px' }}>
          <span style={{ color: 'var(--ink-ghost, #888)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            Step {step}
          </span>
          <input
            type="range" min={0} max={MAX_STEPS} value={step}
            onChange={e => { if (animRef.current) cancelAnimationFrame(animRef.current); setRunning(false); setStep(+e.target.value) }}
            style={{ flex: 1 }}
          />
        </div>

        {OPTIMIZERS.map(({ key, label, color }) => {
          const resolvedColor = color === 'var(--prime)'
            ? (typeof document !== 'undefined'
                ? getComputedStyle(document.documentElement).getPropertyValue('--prime').trim() || '#7c6ef5'
                : '#7c6ef5')
            : color
          return (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontSize: '0.78rem' }}>
              <input
                type="checkbox" checked={visible[key]}
                onChange={() => toggleVisible(key)}
                style={{ accentColor: resolvedColor }}
              />
              <span style={{ color: visible[key] ? resolvedColor : 'var(--ink-ghost, #888)' }}>{label}</span>
            </label>
          )
        })}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '340px', display: 'block', borderRadius: '6px' }}
      />

      {/* Caption */}
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--ink-ghost, #888)', lineHeight: 1.4 }}>
        Left: convergence paths on L(w₁,w₂) = 4w₁² + 0.25w₂² (condition number 16).
        Right: Adam's effective lr = α/(√v̂ + ε) varies per parameter — sparse/rare-gradient params get larger steps.
      </p>
    </div>
  )
})
