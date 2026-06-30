import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

const RELEVANCE_GRADES = [3, 0, 2, 1, 3, 0, 1, 2]
const ITEM_LABELS = ['Item A', 'Item B', 'Item C', 'Item D', 'Item E', 'Item F', 'Item G', 'Item H']
const INITIAL_ORDER = [0, 1, 2, 3, 4, 5, 6, 7]

function dcg(grades, k) {
  let score = 0
  for (let i = 0; i < Math.min(k, grades.length); i++) {
    score += (Math.pow(2, grades[i]) - 1) / Math.log2(i + 2)
  }
  return score
}

function ndcg(grades, k) {
  const ideal = [...grades].sort((a, b) => b - a)
  const idcg = dcg(ideal, k)
  return idcg === 0 ? 0 : dcg(grades, k) / idcg
}

function precisionAtK(grades, k, threshold = 1) {
  const topK = grades.slice(0, k)
  return topK.filter(g => g >= threshold).length / k
}

function mapAtK(grades, k, threshold = 1) {
  let ap = 0, hits = 0
  for (let i = 0; i < Math.min(k, grades.length); i++) {
    if (grades[i] >= threshold) {
      hits++
      ap += hits / (i + 1)
    }
  }
  const totalRelevant = grades.filter(g => g >= threshold).length
  return totalRelevant === 0 ? 0 : ap / Math.min(totalRelevant, k)
}

const GRADE_COLORS = {
  0: 'var(--ink-ghost)',
  1: '#c4a000',
  2: '#d97706',
  3: 'var(--prime)',
}

const GRADE_LABELS = { 0: 'Irrel', 1: 'Fair', 2: 'Good', 3: 'Perfect' }

function gradeBg(g) {
  const map = {
    0: 'rgba(120,120,120,0.15)',
    1: 'rgba(196,160,0,0.15)',
    2: 'rgba(217,119,6,0.15)',
    3: 'rgba(var(--prime-rgb, 212,175,55),0.15)',
  }
  return map[g] ?? 'transparent'
}

function ndcgColor(val) {
  if (val >= 0.8) return '#22c55e'
  if (val >= 0.5) return '#f59e0b'
  return '#ef4444'
}

function fmt(val) {
  return val.toFixed(3)
}

export const NDCGViz = forwardRef(function NDCGViz(props, ref) {
  const [ranking, setRanking] = useState([...INITIAL_ORDER])

  const currentGrades = ranking.map(idx => RELEVANCE_GRADES[idx])

  const moveUp = useCallback((pos) => {
    if (pos === 0) return
    setRanking(prev => {
      const next = [...prev]
      ;[next[pos - 1], next[pos]] = [next[pos], next[pos - 1]]
      return next
    })
  }, [])

  const moveDown = useCallback((pos) => {
    if (pos === ranking.length - 1) return
    setRanking(prev => {
      const next = [...prev]
      ;[next[pos], next[pos + 1]] = [next[pos + 1], next[pos]]
      return next
    })
  }, [ranking.length])

  const shuffle = useCallback(() => {
    setRanking(prev => {
      const next = [...prev]
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
      }
      return next
    })
  }, [])

  const sortOptimal = useCallback(() => {
    const indexed = RELEVANCE_GRADES.map((g, i) => ({ g, i }))
    indexed.sort((a, b) => b.g - a.g || a.i - b.i)
    setRanking(indexed.map(x => x.i))
  }, [])

  const animRef = useRef(null)

  const play = useCallback(() => {
    if (animRef.current) return
    animRef.current = setInterval(() => {
      shuffle()
    }, 1000)
  }, [shuffle])

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
  }, [])

  const reset = useCallback(() => {
    pause()
    setRanking([...INITIAL_ORDER])
  }, [pause])

  const step = useCallback(() => {
    pause()
    shuffle()
  }, [pause, shuffle])

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step])

  useEffect(() => {
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [])

  const KS = [3, 5, 8]

  const dcgVals = KS.map(k => dcg(currentGrades, k))
  const ndcgVals = KS.map(k => ndcg(currentGrades, k))
  const precVals = KS.map(k => precisionAtK(currentGrades, k))
  const mapVals = KS.map(k => mapAtK(currentGrades, k))

  const ndcg5 = ndcgVals[1]
  const isIdeal = ndcg5 >= 0.9999

  const cellStyle = {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.82rem',
    padding: '0.35rem 0.6rem',
    textAlign: 'center',
    borderBottom: '1px solid var(--rim)',
    color: 'var(--ink)',
  }

  const headerCellStyle = {
    ...cellStyle,
    color: 'var(--ink-low)',
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    background: 'var(--depth)',
  }

  const labelCellStyle = {
    ...cellStyle,
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--ink-low)',
    paddingLeft: '0',
  }

  return (
    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
      {/* LEFT: Ranked list */}
      <div style={{ flex: '1 1 260px', minWidth: 220 }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--ink-low)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: '0.6rem',
        }}>
          Ranked List — drag to reorder
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {ranking.map((itemIdx, pos) => {
            const grade = RELEVANCE_GRADES[itemIdx]
            const discount = (1 / Math.log2(pos + 2)).toFixed(3)
            const contribution = ((Math.pow(2, grade) - 1) / Math.log2(pos + 2)).toFixed(3)
            return (
              <div
                key={itemIdx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--rim)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.55rem',
                  transition: 'all 0.15s',
                }}
              >
                {/* Position number */}
                <span style={{
                  fontSize: '0.68rem',
                  color: 'var(--ink-ghost)',
                  width: '1.1rem',
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  {pos + 1}
                </span>

                {/* Item label */}
                <span style={{
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  flex: 1,
                  minWidth: 0,
                }}>
                  {ITEM_LABELS[itemIdx]}
                </span>

                {/* Grade badge */}
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: GRADE_COLORS[grade],
                  background: gradeBg(grade),
                  border: `1px solid ${GRADE_COLORS[grade]}`,
                  borderRadius: '4px',
                  padding: '0.1rem 0.35rem',
                  flexShrink: 0,
                }}>
                  {grade} · {GRADE_LABELS[grade]}
                </span>

                {/* Discount */}
                <span style={{
                  fontSize: '0.65rem',
                  color: 'var(--ink-ghost)',
                  fontFamily: 'var(--font-mono, monospace)',
                  flexShrink: 0,
                  minWidth: '3.5rem',
                  textAlign: 'right',
                }}>
                  {`d=${discount}`}
                </span>

                {/* Up/Down buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
                  <button
                    onClick={() => moveUp(pos)}
                    disabled={pos === 0}
                    style={{
                      background: 'none',
                      border: '1px solid var(--rim)',
                      borderRadius: '3px',
                      width: '1.35rem',
                      height: '1.1rem',
                      cursor: pos === 0 ? 'default' : 'pointer',
                      color: pos === 0 ? 'var(--ink-ghost)' : 'var(--ink-low)',
                      fontSize: '0.6rem',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'all 0.1s',
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(pos)}
                    disabled={pos === ranking.length - 1}
                    style={{
                      background: 'none',
                      border: '1px solid var(--rim)',
                      borderRadius: '3px',
                      width: '1.35rem',
                      height: '1.1rem',
                      cursor: pos === ranking.length - 1 ? 'default' : 'pointer',
                      color: pos === ranking.length - 1 ? 'var(--ink-ghost)' : 'var(--ink-low)',
                      fontSize: '0.6rem',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'all 0.1s',
                    }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT: Metrics panel */}
      <div style={{ flex: '1 1 260px', minWidth: 220 }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--ink-low)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: '0.6rem',
        }}>
          Ranking Metrics
        </div>

        {/* Metrics table */}
        <div style={{
          border: '1px solid var(--rim)',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '1rem',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...headerCellStyle, textAlign: 'left', paddingLeft: '0' }}></th>
                {KS.map(k => (
                  <th key={k} style={headerCellStyle}>K={k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* DCG row */}
              <tr>
                <td style={labelCellStyle}>DCG</td>
                {dcgVals.map((v, i) => (
                  <td key={i} style={cellStyle}>{fmt(v)}</td>
                ))}
              </tr>
              {/* NDCG row */}
              <tr>
                <td style={labelCellStyle}>NDCG</td>
                {ndcgVals.map((v, i) => (
                  <td key={i} style={{ ...cellStyle, color: ndcgColor(v), fontWeight: 700 }}>
                    {fmt(v)}
                  </td>
                ))}
              </tr>
              {/* P@K row */}
              <tr>
                <td style={labelCellStyle}>P@K</td>
                {precVals.map((v, i) => (
                  <td key={i} style={cellStyle}>{fmt(v)}</td>
                ))}
              </tr>
              {/* MAP row */}
              <tr style={{ borderBottom: 'none' }}>
                <td style={{ ...labelCellStyle, borderBottom: 'none' }}>MAP</td>
                {mapVals.map((v, i) => (
                  <td key={i} style={{ ...cellStyle, borderBottom: 'none' }}>{fmt(v)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* NDCG@5 gauge */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.3rem',
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-low)', fontWeight: 600 }}>
              NDCG@5 gauge
            </span>
            <span style={{
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              color: ndcgColor(ndcg5),
            }}>
              {fmt(ndcg5)}
            </span>
          </div>
          <div style={{
            height: '10px',
            background: 'var(--depth)',
            border: '1px solid var(--rim)',
            borderRadius: '5px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${ndcg5 * 100}%`,
              background: ndcgColor(ndcg5),
              borderRadius: '5px',
              transition: 'width 0.2s ease, background 0.2s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.6rem',
            color: 'var(--ink-ghost)',
            marginTop: '0.2rem',
          }}>
            <span>0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
        </div>

        {/* Status note */}
        <div style={{
          fontSize: '0.78rem',
          color: isIdeal ? '#22c55e' : 'var(--ink-low)',
          background: isIdeal ? 'rgba(34,197,94,0.08)' : 'var(--depth)',
          border: `1px solid ${isIdeal ? 'rgba(34,197,94,0.3)' : 'var(--rim)'}`,
          borderRadius: '6px',
          padding: '0.5rem 0.7rem',
          marginBottom: '0.85rem',
          fontFamily: 'var(--font-mono, monospace)',
          transition: 'all 0.2s',
        }}>
          {isIdeal
            ? 'Perfect ranking! NDCG@5 = 1.0'
            : `NDCG@5 = ${fmt(ndcg5)} — ideal = 1.000 (sort for max)`}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={shuffle}
            style={{
              flex: 1,
              padding: '0.45rem 0.6rem',
              background: 'var(--depth)',
              border: '1px solid var(--rim)',
              borderRadius: '6px',
              color: 'var(--ink)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Shuffle
          </button>
          <button
            onClick={sortOptimal}
            style={{
              flex: 1,
              padding: '0.45rem 0.6rem',
              background: 'var(--prime)',
              border: '1px solid var(--prime)',
              borderRadius: '6px',
              color: '#000',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Sort Optimal
          </button>
        </div>

        {/* Formula reminder */}
        <div style={{
          marginTop: '0.85rem',
          padding: '0.55rem 0.7rem',
          background: 'var(--depth)',
          border: '1px solid var(--rim)',
          borderRadius: '6px',
          fontSize: '0.7rem',
          color: 'var(--ink-low)',
          fontFamily: 'var(--font-mono, monospace)',
          lineHeight: 1.6,
        }}>
          <div>DCG@K = sum( (2^rel - 1) / log2(pos+1) )</div>
          <div>NDCG@K = DCG@K / IDCG@K</div>
          <div style={{ color: 'var(--ink-ghost)', marginTop: '0.25rem' }}>
            Discount at pos: {ranking.slice(0, 5).map((_, i) => (1 / Math.log2(i + 2)).toFixed(2)).join(', ')}...
          </div>
        </div>
      </div>
    </div>
  )
})
