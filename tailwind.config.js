/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Abyss palette ─────────────────────────────────────────────────
        // Base surfaces — deep ocean black, tinted teal (not blue, not purple)
        void:   '#020b0d',   // page background
        depth:  '#041318',   // card background
        layer:  '#07202a',   // elevated / hover
        // Borders
        rim:    '#0e3040',   // default border
        rimHi:  '#175570',   // hover / active border
        // Electric mint — the primary accent
        mint: {
          DEFAULT: '#06d6a0',
          bright:  '#2effc0',
          dim:     '#0a9e78',
          glow:    'rgba(6,214,160,0.20)',
          faint:   'rgba(6,214,160,0.07)',
        },
        // Secondary accents
        ember: {
          DEFAULT: '#f97316',  // warm orange — Spark, fire, heat
          dim:     '#c2530a',
          glow:    'rgba(249,115,22,0.18)',
        },
        rose: {
          DEFAULT: '#f43f5e',
          dim:     '#be123c',
          glow:    'rgba(244,63,94,0.18)',
        },
        violet: {
          DEFAULT: '#a855f7',
          dim:     '#7e22ce',
          glow:    'rgba(168,85,247,0.18)',
        },
        sky: {
          DEFAULT: '#38bdf8',
          dim:     '#0369a1',
          glow:    'rgba(56,189,248,0.18)',
        },
        gold: {
          DEFAULT: '#fbbf24',
          dim:     '#b45309',
        },
        // Text scale — slightly mint-tinted
        ink: {
          hi:    '#dffff6',   // near white, mint cast
          mid:   '#4db89c',   // muted teal
          low:   '#1e6254',   // dim
          ghost: '#0d3830',   // barely visible
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-mint':  '0 0 28px rgba(6,214,160,0.30)',
        'glow-ember': '0 0 28px rgba(249,115,22,0.28)',
        'card':       '0 1px 3px rgba(0,0,0,0.7), 0 0 0 1px rgba(14,48,64,0.9)',
        'card-hi':    '0 4px 28px rgba(0,0,0,0.6), 0 0 0 1px rgba(23,85,112,0.8)',
      },
      backgroundImage: {
        'dot-grid':    'radial-gradient(circle, #0e3040 1px, transparent 1px)',
        'grad-mint':   'linear-gradient(135deg, #06d6a0 0%, #38bdf8 100%)',
        'grad-ember':  'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
      },
      backgroundSize: {
        'dot-grid': '28px 28px',
      },
    },
  },
  plugins: [],
}
