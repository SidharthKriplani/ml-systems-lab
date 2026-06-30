import React from 'react'

export function renderMd(text, containerStyle = {}) {
  if (!text) return null
  // Split on blank lines for paragraphs
  const blocks = text.split(/\n\n+/)
  return (
    <div style={containerStyle}>
      {blocks.map((block, i) => {
        // Equation block: entire paragraph is $...$
        const eqMatch = block.trim().match(/^\$(.+)\$$/s)
        if (eqMatch) {
          return (
            <div key={i} style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              color: 'var(--prime)',
              background: 'var(--depth)',
              borderLeft: '3px solid var(--prime)',
              padding: '0.5rem 0.75rem',
              margin: '0.75rem 0',
              borderRadius: '0 4px 4px 0',
              overflowX: 'auto',
              fontSize: '0.9rem',
            }}>
              {eqMatch[1].trim()}
            </div>
          )
        }
        // Regular paragraph — process inline markdown
        return <p key={i} style={{ marginBottom: '0.75rem', lineHeight: 1.65 }}>{renderInline(block)}</p>
      })}
    </div>
  )
}

function renderInline(text) {
  // Split on **bold** and `code` tokens
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--ink-hi)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'var(--depth)', padding: '0.1em 0.3em', borderRadius: '3px', fontSize: '0.88em' }}>{part.slice(1, -1)}</code>
    }
    return part
  })
}
