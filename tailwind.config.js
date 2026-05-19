/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        base:  '#05060f',
        card:  '#0b0d1a',
        layer: '#12152a',
        // Borders
        line:  '#1c2040',
        lineBright: '#2a2e5a',
        // Accents
        indigo: {
          DEFAULT: '#6366f1',
          bright:  '#818cf8',
          dim:     '#4338ca',
          glow:    'rgba(99,102,241,0.25)',
        },
        cyan: {
          DEFAULT: '#22d3ee',
          dim:     '#0891b2',
          glow:    'rgba(34,211,238,0.2)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          dim:     '#b45309',
          glow:    'rgba(245,158,11,0.2)',
        },
        rose: {
          DEFAULT: '#f43f5e',
          dim:     '#be123c',
          glow:    'rgba(244,63,94,0.2)',
        },
        emerald: {
          DEFAULT: '#10b981',
          dim:     '#047857',
          glow:    'rgba(16,185,129,0.2)',
        },
        violet: {
          DEFAULT: '#a855f7',
          dim:     '#7e22ce',
          glow:    'rgba(168,85,247,0.2)',
        },
        // Text scale
        ink: {
          high:   '#eaecff',
          medium: '#8891b8',
          low:    '#525a82',
          faint:  '#2d3260',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'dot-grid': `radial-gradient(circle, #1c2040 1px, transparent 1px)`,
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
        'gradient-card':  'linear-gradient(135deg, #0b0d1a 0%, #12152a 100%)',
      },
      backgroundSize: {
        'dot-grid': '28px 28px',
      },
      boxShadow: {
        'glow-indigo': '0 0 24px rgba(99,102,241,0.35)',
        'glow-cyan':   '0 0 24px rgba(34,211,238,0.25)',
        'card':        '0 1px 3px rgba(0,0,0,0.6), 0 0 0 1px rgba(28,32,64,0.8)',
        'card-hover':  '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(42,46,90,0.8)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                   to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
