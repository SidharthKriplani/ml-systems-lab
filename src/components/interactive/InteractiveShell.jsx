import React, { useRef, useState, useEffect, useCallback } from 'react'

export function InteractiveShell({ children }) {
  const vizRef = useRef(null)
  const containerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const hasPlayedRef = useRef(false)

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

  // IntersectionObserver: auto-play when top edge enters viewport, pause when it leaves
  useEffect(() => {
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
  }, [play, pause, playing])

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
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {playing
          ? <button style={btnStyle(true)} onClick={pause}>⏸</button>
          : <button style={btnStyle(false)} onClick={play}>▶</button>
        }
        <button style={btnStyle(false)} onClick={step}>⏭</button>
        <button style={btnStyle(false)} onClick={reset}>↺</button>
      </div>
    </div>
  )
}
