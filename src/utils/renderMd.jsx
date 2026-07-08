import React from 'react'
import { GLOSSARY, GLOSSARY_PATTERN } from '../data/glossary'
import { GlossaryTerm } from '../components/foundations/GlossaryTerm'

// One shared alternation regex for the whole app lifetime — `.split()` on a
// global RegExp doesn't carry mutable state (unlike `.exec()`/`.test()`), so
// reuse across renderMd calls is safe. `\b` boundaries only work reliably
// because every glossary key starts/ends on a plain word character — see
// src/data/glossary.js header for why symbol-only terms are excluded.
const GLOSSARY_RE = GLOSSARY_PATTERN ? new RegExp(`\\b(${GLOSSARY_PATTERN})\\b`, 'gi') : null

// Convert LaTeX macros → Unicode symbols + HTML sup/sub tags
// Returns an HTML string safe to use with dangerouslySetInnerHTML
function texToHtml(str) {
  if (!str) return str
  // Escape HTML special chars first (before we add our own <sup>/<sub> tags)
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return str
    // ── Greek letters
    .replace(/\\partial/g, '∂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\Gamma/g, 'Γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\varepsilon/g, 'ε')
    .replace(/\\zeta/g, 'ζ')
    .replace(/\\eta/g, 'η')
    .replace(/\\theta/g, 'θ')
    .replace(/\\iota/g, 'ι')
    .replace(/\\kappa/g, 'κ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\Lambda/g, 'Λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\nu/g, 'ν')
    .replace(/\\xi/g, 'ξ')
    .replace(/\\pi/g, 'π')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\Sigma/g, 'Σ')
    .replace(/\\tau/g, 'τ')
    .replace(/\\upsilon/g, 'υ')
    .replace(/\\phi/g, 'φ')
    .replace(/\\chi/g, 'χ')
    .replace(/\\psi/g, 'ψ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Omega/g, 'Ω')
    // ── Operators & relations
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\approx/g, '≈')
    .replace(/\\geq/g, '≥')
    .replace(/\\leq/g, '≤')
    .replace(/\\neq/g, '≠')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\subseteq/g, '⊆')
    .replace(/\\propto/g, '∝')
    .replace(/\\sim/g, '~')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\Leftrightarrow/g, '⟺')
    .replace(/\\infty/g, '∞')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\neg/g, '¬')
    .replace(/\\land/g, '∧')
    .replace(/\\lor/g, '∨')
    // ── Functions
    .replace(/\\arg\s*max/g, 'argmax')
    .replace(/\\arg\s*min/g, 'argmin')
    .replace(/\\max/g, 'max')
    .replace(/\\min/g, 'min')
    .replace(/\\log/g, 'log')
    .replace(/\\ln/g, 'ln')
    .replace(/\\exp/g, 'exp')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\det/g, 'det')
    .replace(/\\tr/g, 'tr')
    .replace(/\\sum/g, 'Σ')
    .replace(/\\prod/g, 'Π')
    .replace(/\\int/g, '∫')
    // ── Structures — more specific first, before generic brace removal
    .replace(/\\underbrace\{([^}]*)\}_\{[^}]*\}/g, '$1')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt/g, '√')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    .replace(/\\mathbb\{([^}]*)\}/g, '$1')
    .replace(/\\mathcal\{([^}]*)\}/g, '$1')
    .replace(/\\boldsymbol\{([^}]*)\}/g, '$1')
    .replace(/\\hat\{([^}]*)\}/g, '$1&#x0302;')
    .replace(/\\bar\{([^}]*)\}/g, '$1&#x0304;')
    .replace(/\\tilde\{([^}]*)\}/g, '$1&#x0303;')
    .replace(/\\vec\{([^}]*)\}/g, '$1&#x20D7;')
    .replace(/\\overline\{([^}]*)\}/g, '$1&#x0304;')
    // ── Superscripts and subscripts — BEFORE generic brace removal
    .replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>')
    .replace(/\^([^{<\s])/g, '<sup>$1</sup>')
    .replace(/_\{([^}]*)\}/g, '<sub>$1</sub>')
    .replace(/_([^{<\s_,;:.])/g, '<sub>$1</sub>')
    // ── Remove any remaining braces
    .replace(/\{/g, '').replace(/\}/g, '')
}

export function renderMd(text, containerStyle = {}, figures = {}) {
  if (!text) return null
  // Module-scoped "wrap only the first occurrence" tracking — one Set per
  // renderMd() call. Each module body is a single renderMd invocation, so
  // this naturally resets per module render and is shared across every
  // renderInline() call within it (lede, regular paragraphs, callouts).
  const usedGlossaryTerms = new Set()
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
            // Scale figures up (authored max-width is ~360px, too small in a wide reader pane)
            const scaled = svgStr.replace(/max-width:\s*\d+px/, 'max-width:560px')
            return (
              <div key={i} style={{
                margin: '1.5rem 0',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '10px',
                background: 'var(--depth)',
                border: '1px solid var(--rim)',
                padding: '1.1rem 1.25rem',
              }} dangerouslySetInnerHTML={{ __html: scaled }} />
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
              fontSize: '0.9rem',
            }}
              dangerouslySetInnerHTML={{ __html: texToHtml(eqMatch[1].trim()) }}
            />
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
                {renderInline(trimmed, usedGlossaryTerms)}
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
                {renderInline(trimmed, usedGlossaryTerms)}
              </p>
            </div>
          )
        }

        // ── First paragraph: lede treatment
        if (i === 0) {
          return (
            <p key={i} style={{ marginBottom: '1rem', lineHeight: 1.75, color: 'var(--ink-hi)' }}>
              {renderInline(trimmed, usedGlossaryTerms)}
            </p>
          )
        }

        // ── Regular paragraph
        return (
          <p key={i} style={{ marginBottom: '1rem', lineHeight: 1.7 }}>
            {renderInline(trimmed, usedGlossaryTerms)}
          </p>
        )
      })}
    </div>
  )
}

// Inline math style — shared between block and inline equation renderers
const mathStyle = {
  fontFamily: 'var(--font-mono)',
  color: 'var(--prime)',
  background: 'var(--depth)',
  padding: '0.1em 0.35em',
  borderRadius: '3px',
  fontSize: '0.88em',
  whiteSpace: 'nowrap',
  display: 'inline',
}

function renderInline(text, usedGlossaryTerms) {
  // Split on **bold**, `code`, and $equation$
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
        <span
          key={i}
          style={mathStyle}
          dangerouslySetInnerHTML={{ __html: texToHtml(part.slice(1, -1)) }}
        />
      )
    }
    // Plain-text piece (not bold/code/math) — second pass: glossary terms.
    return applyGlossary(part, i, usedGlossaryTerms)
  })
}

// Second regex pass over a plain-text piece of renderInline's split, run
// ONLY on pieces that are not already **bold**/`code`/$math$ JSX. Wraps the
// FIRST occurrence of each glossary term (tracked via the `usedGlossaryTerms`
// Set that renderMd() creates once per module render) in <GlossaryTerm>;
// every later occurrence — of that same term, in that same module — passes
// through as plain text so the prose doesn't get cluttered with repeats.
function applyGlossary(text, keyPrefix, usedGlossaryTerms) {
  if (!GLOSSARY_RE || !text || !usedGlossaryTerms) return text
  const pieces = text.split(GLOSSARY_RE)
  if (pieces.length === 1) return text
  return pieces.map((piece, j) => {
    const lower = piece.toLowerCase()
    const entry = GLOSSARY[lower]
    if (entry && !usedGlossaryTerms.has(lower)) {
      usedGlossaryTerms.add(lower)
      return <GlossaryTerm key={`${keyPrefix}-gt-${j}`} display={piece} entry={entry} />
    }
    return piece
  })
}
