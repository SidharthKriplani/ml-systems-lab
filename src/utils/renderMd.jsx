import React from 'react'

export function renderMd(text, containerStyle = {}, figures = {}) {
  if (!text) return null
  const blocks = text.split(/\n\n+/)
  return (
    <div style={containerStyle}>
      {blocks.map((block, i) => {
        const trimmed = block.trim()

        // ── [FIGURE: figureId] inline figure
        const figMatch = trimmed.match(/^\[FIGURE:\s*(\S+)\]/)
        if (figMatch) {
          const figId = figMatch[1]
          const svgStr = figures[figId]
          if (svgStr) {
            return (
              <div key={i} style={{
                margin: '1.5rem 0',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '8px',
              }} dangerouslySetInnerHTML={{ __html: svgStr }} />
            )
          }
          return (
            <div key={i} style={{
              margin: '1.5rem 0', padding: '1rem',
              background: 'var(--depth)', borderRadius: '8px',
              border: '1px dashed var(--rim)', textAlign: 'center',
              color: 'var(--ink-low)', fontSize: '0.8rem',
            }}>
              [figure: {figId}]
            </div>
          )
        }

        // ── Standalone equation block: entire paragraph is $...$
        const eqMatch = trimmed.match(/^\$(.+)\$$/s)
        if (eqMatch) {
          return (
            <div key={i} style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              color: 'var(--prime)',
              background: 'var(--depth)',
              borderLeft: '3px solid var(--prime)',
              padding: '0.5rem 0.75rem',
              margin: '1rem 0',
              borderRadius: '0 4px 4px 0',
              overflowX: 'auto',
              fontSize: '0.88rem',
            }}>
              {eqMatch[1].trim()}
            </div>
          )
        }

        // ── NOT-this paragraph → amber misconception callout
        if (trimmed.startsWith('**NOT this.') || trimmed.startsWith('**NOT this:')) {
          return (
            <div key={i} style={{
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              margin: '1.1rem 0',
            }}>
              <div style={{
                fontSize: '0.62rem', fontWeight: 800, color: '#b45309',
                textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '0.4rem',
              }}>Common Misconception</div>
              <div style={{ fontSize: 'inherit', lineHeight: 1.65, color: 'var(--ink-mid)' }}>
                {renderInline(trimmed)}
              </div>
            </div>
          )
        }

        // ── Formal statement paragraph → definition callout
        if (
          trimmed.startsWith('The formal statement:') ||
          trimmed.startsWith('**Formally') ||
          trimmed.startsWith('**The formal')
        ) {
          return (
            <div key={i} style={{
              background: 'var(--prime-faint)',
              borderLeft: '3px solid var(--prime)',
              borderRadius: '0 6px 6px 0',
              padding: '0.65rem 1rem',
              margin: '1.1rem 0',
            }}>
              <p style={{ margin: 0, fontSize: 'inherit', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                {renderInline(trimmed)}
              </p>
            </div>
          )
        }

        // ── First paragraph: lede treatment
        if (i === 0) {
          return (
            <p key={i} style={{ marginBottom: '1rem', lineHeight: 1.75, color: 'var(--ink-hi)' }}>
              {renderInline(trimmed)}
            </p>
          )
        }

        // ── Regular paragraph
        return (
          <p key={i} style={{ marginBottom: '1rem', lineHeight: 1.7 }}>
            {renderInline(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

function renderInline(text) {
  // Split on **bold**, `code`, and $equation$ — order matters: try longer patterns first
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^\$\n]+\$)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: 'var(--ink-hi)', fontWeight: 650 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          fontFamily: 'var(--font-mono)', color: 'var(--prime)',
          background: 'var(--depth)', padding: '0.1em 0.3em',
          borderRadius: '3px', fontSize: '0.88em',
        }}>
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      return (
        <code key={i} style={{
          fontFamily: 'var(--font-mono)', color: 'var(--prime)',
          background: 'var(--depth)', padding: '0.1em 0.35em',
          borderRadius: '3px', fontSize: '0.88em', whiteSpace: 'nowrap',
        }}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
