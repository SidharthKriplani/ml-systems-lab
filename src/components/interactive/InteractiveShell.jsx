import React, { useRef, useState, useEffect, useCallback } from 'react'

export function InteractiveShell({ children }) {
  const vizRef = useRef(null)
  const containerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const hasPlayedRef = useRef(false)

  // Capability detection — the child (often lazy-loaded) exposes some subset of
  // play/pause/reset/step via useImperativeHandle. Slider-driven interactives
  // expose NONE. We only render controls for the methods that actually exist,
  // so a Play button never appears on something that can't play.
  const [caps, setCaps] = useState({ play: false, pause: false, reset: false, step: false })
  useEffect(() => {
    let raf
    let attempts = 0
    const check = () => {
      const v = vizRef.current
      if (v && (v.play || v.pause || v.reset || v.step)) {
        setCaps({ play: !!v.play, pause: !!v.pause, reset: !!v.reset, step: !!v.step })
        return
      }
      // keep polling briefly while a lazy child mounts, then give up (no controls)
      if (attempts++ < 40) raf = requestAnimationFrame(check)
    }
    check()
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [])

  const hasControls = caps.play || caps.pause || caps.reset || caps.step

  const play = useCallback(() => {
    if (vizRef.current?.play) {
      vizRef.current.play()
      setPlaying(true)
    }
  }, [])

  const pause = useCallback(() => {
    if (vizRef.current?.pause) {
      vizRef.current.pause()
      setPlaying(false)
    }
  }, [])

  const reset = useCallback(() => {
    if (vizRef.current?.reset) {
      vizRef.current.reset()
      setPlaying(false)
    }
  }, [])

  const step = useCallback(() => {
    if (vizRef.current?.step) {
      vizRef.current.step()
      setPlaying(false)
    }
  }, [])

  // IntersectionObserver: auto-play when top edge enters viewport, pause when it
  // leaves — but only for interactives that can actually play.
  useEffect(() => {
    if (!caps.play) return
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayedRef.current) {
          hasPlayedRef.current = true
          play()
        } else if (!entry.isIntersecting && playing) {
          pause()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [caps.play, play, pause, playing])

  const btnStyle = (active) => ({
    background: active ? 'var(--prime)' : 'var(--depth)',
    color: active ? '#000' : 'var(--ink-mid)',
    border: '1px solid var(--rim)',
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
  })

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {React.cloneElement(children, { ref: vizRef })}
      {hasControls && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {(caps.play || caps.pause) && (
            playing
              ? <button style={btnStyle(true)} onClick={pause} title="Pause">⏸</button>
              : <button style={btnStyle(false)} onClick={play} title="Play">▶</button>
          )}
          {caps.step && <button style={btnStyle(false)} onClick={step} title="Step">⏭</button>}
          {caps.reset && <button style={btnStyle(false)} onClick={reset} title="Reset">↺</button>}
        </div>
      )}
    </div>
  )
}
