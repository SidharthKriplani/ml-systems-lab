import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'

const EDGES = [[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[3,6],[4,6],[5,6]]
const POS = [[0.12,0.5],[0.33,0.22],[0.33,0.78],[0.55,0.1],[0.55,0.5],[0.55,0.9],[0.78,0.5]]
const INIT_FEATURES = [0.9, 0.2, 0.7, 0.5, 0.1, 0.8, 0.4]
const ADJ = [[1,2],[0,3,4],[0,4,5],[1,6],[1,2,6],[2,6],[3,4,5]]
const N_NODES = 7
const NODE_R = 22
const ANIM_FRAMES = 40

function computeRounds(init) {
  const rounds = [init.slice()]
  for (let r = 0; r < 3; r++) {
    const prev = rounds[r]
    const next = prev.map((v, i) => {
      const neighbors = ADJ[i]
      const val = (v + neighbors.reduce((s, n) => s + prev[n], 0)) / (1 + neighbors.length)
      return Math.max(0, Math.min(1, val))
    })
    rounds.push(next)
  }
  return rounds
}

function lerpColor(t) {
  // dark (#1a1a2e) to var(--prime) (#7c6bff fallback)
  const r0 = 0x1a, g0 = 0x1a, b0 = 0x2e
  const r1 = 0x7c, g1 = 0x6b, b1 = 0xff
  const r = Math.round(r0 + (r1 - r0) * t)
  const g = Math.round(g0 + (g1 - g0) * t)
  const b = Math.round(b0 + (b1 - b0) * t)
  return `rgb(${r},${g},${b})`
}

function drawGraph(canvas, features, particleProgress, animRound) {
  const ctx = canvas.getContext('2d')
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)

  // Background
  ctx.fillStyle = 'var(--depth)'
  ctx.fillRect(0, 0, W, H)

  // Left panel: 65% width
  const graphW = W * 0.65
  const graphH = H

  function nx(i) { return POS[i][0] * graphW }
  function ny(i) { return POS[i][1] * graphH }

  // Draw edges
  ctx.strokeStyle = 'rgba(150,150,170,0.35)'
  ctx.lineWidth = 1.5
  for (const [a, b] of EDGES) {
    ctx.beginPath()
    ctx.moveTo(nx(a), ny(a))
    ctx.lineTo(nx(b), ny(b))
    ctx.stroke()
  }

  // Draw message particles if animating
  if (particleProgress !== null && particleProgress >= 0) {
    const t = particleProgress // 0..1
    for (const [a, b] of EDGES) {
      // Particle a -> b
      const x1 = nx(a) + (nx(b) - nx(a)) * t
      const y1 = ny(a) + (ny(b) - ny(a)) * t
      ctx.beginPath()
      ctx.arc(x1, y1, 5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(124,107,255,0.85)'
      ctx.fill()
      // Particle b -> a
      const x2 = nx(b) + (nx(a) - nx(b)) * t
      const y2 = ny(b) + (ny(a) - ny(b)) * t
      ctx.beginPath()
      ctx.arc(x2, y2, 5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(124,107,255,0.85)'
      ctx.fill()
    }
  }

  // Draw nodes
  for (let i = 0; i < N_NODES; i++) {
    const x = nx(i)
    const y = ny(i)
    const f = features[i]
    ctx.beginPath()
    ctx.arc(x, y, NODE_R, 0, Math.PI * 2)
    ctx.fillStyle = lerpColor(f)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(NODE_R * 0.52)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(f.toFixed(2), x, y)
  }

  // Right panel: feature table
  const tableX = graphW + 4
  const tableW = W - tableX - 4
  const tableH = H
  const colW = tableW / 5
  const rowH = (tableH - 28) / (N_NODES + 1)
  const headers = ['', 'R0', 'R1', 'R2', 'R3']

  ctx.font = `bold 11px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Header row
  for (let c = 0; c < 5; c++) {
    if (c > 0 && c - 1 === animRound) {
      ctx.fillStyle = 'rgba(124,107,255,0.18)'
      ctx.fillRect(tableX + c * colW, 4, colW, rowH)
    }
    ctx.fillStyle = c > 0 && c - 1 === animRound ? 'var(--prime, #7c6bff)' : 'rgba(200,200,220,0.7)'
    ctx.fillText(headers[c], tableX + c * colW + colW / 2, 4 + rowH / 2)
  }

  // Data rows
  for (let r = 0; r < N_NODES; r++) {
    const yRow = 4 + (r + 1) * rowH
    for (let c = 0; c < 5; c++) {
      if (c > 0 && c - 1 === animRound) {
        ctx.fillStyle = 'rgba(124,107,255,0.18)'
        ctx.fillRect(tableX + c * colW, yRow, colW, rowH)
      }
      if (c === 0) {
        ctx.fillStyle = 'rgba(180,180,200,0.6)'
        ctx.fillText(`N${r}`, tableX + colW / 2, yRow + rowH / 2)
      } else {
        ctx.fillStyle = c - 1 === animRound ? 'rgba(255,255,255,0.92)' : 'rgba(180,180,200,0.55)'
        ctx.fillText('--', tableX + c * colW + colW / 2, yRow + rowH / 2)
      }
    }
  }
}

function drawGraphWithTable(canvas, allRounds, currentRound, particleProgress) {
  const ctx = canvas.getContext('2d')
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)

  ctx.fillStyle = 'var(--depth)'
  ctx.fillRect(0, 0, W, H)

  const graphW = W * 0.65
  const graphH = H

  function nx(i) { return POS[i][0] * graphW }
  function ny(i) { return POS[i][1] * graphH }

  // Which features to show: if animating, show pre-round features; otherwise current round
  const displayFeatures = allRounds[currentRound]

  // Edges
  ctx.strokeStyle = 'rgba(150,150,170,0.35)'
  ctx.lineWidth = 1.5
  for (const [a, b] of EDGES) {
    ctx.beginPath()
    ctx.moveTo(nx(a), ny(a))
    ctx.lineTo(nx(b), ny(b))
    ctx.stroke()
  }

  // Particles
  if (particleProgress !== null && particleProgress >= 0) {
    const t = particleProgress
    for (const [a, b] of EDGES) {
      const x1 = nx(a) + (nx(b) - nx(a)) * t
      const y1 = ny(a) + (ny(b) - ny(a)) * t
      ctx.beginPath()
      ctx.arc(x1, y1, 5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(124,107,255,0.85)'
      ctx.fill()

      const x2 = nx(b) + (nx(a) - nx(b)) * t
      const y2 = ny(b) + (ny(a) - ny(b)) * t
      ctx.beginPath()
      ctx.arc(x2, y2, 5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(124,107,255,0.85)'
      ctx.fill()
    }
  }

  // Nodes
  for (let i = 0; i < N_NODES; i++) {
    const x = nx(i)
    const y = ny(i)
    const f = displayFeatures[i]
    ctx.beginPath()
    ctx.arc(x, y, NODE_R, 0, Math.PI * 2)
    ctx.fillStyle = lerpColor(f)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(NODE_R * 0.52)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(f.toFixed(2), x, y)
  }

  // Right: feature table
  const tableX = graphW + 4
  const tableW = W - tableX - 4
  const nCols = 5 // label + R0..R3
  const colW = tableW / nCols
  const headerH = 24
  const rowH = (H - headerH) / (N_NODES + 0.5)
  const headers = ['', 'R0', 'R1', 'R2', 'R3']

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Vertical separator
  ctx.strokeStyle = 'rgba(150,150,180,0.18)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(tableX, 0); ctx.lineTo(tableX, H)
  ctx.stroke()

  for (let c = 0; c < nCols; c++) {
    const cx = tableX + c * colW + colW / 2
    // Highlight current round column
    const isActive = c > 0 && c - 1 === currentRound
    if (isActive) {
      ctx.fillStyle = 'rgba(124,107,255,0.15)'
      ctx.fillRect(tableX + c * colW, 0, colW, H)
    }
    ctx.font = `bold 10px monospace`
    ctx.fillStyle = isActive ? '#7c6bff' : 'rgba(180,180,210,0.7)'
    ctx.fillText(headers[c], cx, headerH / 2)
  }

  // Horizontal header separator
  ctx.strokeStyle = 'rgba(150,150,180,0.18)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(tableX, headerH); ctx.lineTo(W, headerH)
  ctx.stroke()

  for (let r = 0; r < N_NODES; r++) {
    const yRow = headerH + r * rowH + rowH / 2
    for (let c = 0; c < nCols; c++) {
      const cx = tableX + c * colW + colW / 2
      const isActive = c > 0 && c - 1 === currentRound
      if (c === 0) {
        ctx.font = `bold 10px monospace`
        ctx.fillStyle = 'rgba(170,170,200,0.6)'
        ctx.fillText(`N${r}`, cx, yRow)
      } else {
        const roundIdx = c - 1
        const hasData = roundIdx <= currentRound
        ctx.font = `${hasData ? 'bold' : 'normal'} 10px monospace`
        ctx.fillStyle = isActive
          ? 'rgba(255,255,255,0.95)'
          : hasData
            ? 'rgba(200,200,220,0.55)'
            : 'rgba(120,120,150,0.3)'
        ctx.fillText(hasData ? allRounds[roundIdx][r].toFixed(2) : '--', cx, yRow)
      }
    }
  }
}

export const GNNMessagePassingViz = forwardRef(function GNNMessagePassingViz(props, ref) {
  const canvasRef = useRef(null)
  const roRef = useRef(null)
  const rafRef = useRef(null)
  const autoPlayRef = useRef(false)

  const allRoundsRef = useRef(computeRounds(INIT_FEATURES))
  const [currentRound, setCurrentRound] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const particleRef = useRef(null) // null or 0..1

  const redraw = useCallback((round, particleProgress) => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawGraphWithTable(canvas, allRoundsRef.current, round, particleProgress ?? null)
  }, [])

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    roRef.current = new ResizeObserver(() => {
      redraw(currentRound, particleRef.current)
    })
    roRef.current.observe(canvas)
    return () => roRef.current?.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redraw])

  // Initial draw
  useEffect(() => { redraw(0, null) }, [redraw])

  const nextRound = useCallback(() => {
    if (isAnimating || currentRound >= 3) return
    setIsAnimating(true)
    let frame = 0
    const targetRound = currentRound + 1
    const tick = () => {
      frame++
      const t = Math.min(frame / ANIM_FRAMES, 1)
      particleRef.current = t
      // During animation show pre-round features (currentRound), after show next
      redraw(currentRound, t)
      if (frame < ANIM_FRAMES) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        particleRef.current = null
        setCurrentRound(targetRound)
        redraw(targetRound, null)
        setIsAnimating(false)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [isAnimating, currentRound, redraw])

  // Auto-advance when autoPlayRef is true and not currently animating.
  // NOTE: must be declared AFTER nextRound — referencing it earlier throws a
  // temporal-dead-zone ReferenceError at render (blanks the whole app).
  useEffect(() => {
    if (autoPlayRef.current && !isAnimating && currentRound < 3) {
      const t = setTimeout(() => nextRound(), 300)
      return () => clearTimeout(t)
    }
    if (currentRound >= 3) autoPlayRef.current = false
  }, [isAnimating, currentRound, nextRound])

  const reset = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    particleRef.current = null
    allRoundsRef.current = computeRounds(INIT_FEATURES)
    setCurrentRound(0)
    setIsAnimating(false)
    redraw(0, null)
  }, [redraw])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const play = useCallback(() => {
    if (currentRound >= 3) return
    autoPlayRef.current = true
    if (!isAnimating) nextRound()
  }, [currentRound, isAnimating, nextRound])

  const pause = useCallback(() => {
    autoPlayRef.current = false
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }, [])

  useImperativeHandle(ref, () => ({
    play,
    pause,
    reset,
    step: () => { autoPlayRef.current = false; nextRound(); },
  }), [play, pause, reset, nextRound])

  const btnStyle = (disabled) => ({
    padding: '0.3rem 0.75rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    background: disabled ? 'var(--rim)' : 'var(--prime)',
    color: disabled ? 'var(--ink-ghost)' : '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s',
  })

  const nextDisabled = isAnimating || currentRound >= 3

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '340px', display: 'block', borderRadius: '6px' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <button style={btnStyle(nextDisabled)} disabled={nextDisabled} onClick={nextRound}>
          Next Round
        </button>
        <button style={btnStyle(false)} onClick={reset}>Reset</button>
        <span style={{ fontSize: '0.8rem', color: 'var(--ink-dim)', fontVariantNumeric: 'tabular-nums' }}>
          {`Round ${currentRound} / 3`}
        </span>
      </div>
    </div>
  )
})
