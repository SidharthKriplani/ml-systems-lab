import { useState, useEffect } from 'react'
import { getAllProgress, getNextRecommendation, TRACK_MODULES } from '../utils/progress.js'

const ROLES = [
  { key: 'interview',   label: 'MLE Interview Prep',         desc: 'Preparing for system design & ML rounds at top companies',    cta1: { label: 'Go to Interview Prep →', tab: 'interview' }, cta2: { label: '⏱ Timed Practice', tab: 'interview' } },
  { key: 'production',  label: 'Production ML Skills',       desc: 'Deepening Spark, feature pipelines, monitoring in prod',       cta1: { label: 'Start with Spark Lab →', tab: 'spark' },    cta2: { label: '📡 Monitoring & Drift', tab: 'monitor' } },
  { key: 'staff',       label: 'Staff-Level System Design',  desc: 'ML platform design, trade-offs, and cross-team thinking',     cta1: { label: 'ML System Design →', tab: 'design' },       cta2: { label: '∇ Gradient Posts', tab: 'gradient' } },
  { key: 'new',         label: 'New to Production ML',       desc: 'Coming from notebooks, learning how real systems work',        cta1: { label: 'Start with Spark Lab →', tab: 'spark' },    cta2: { label: '⌁ Run Python in Browser', tab: 'models' } },
]

const CHANGELOG = [
  { date: 'May 2026',  text: '77 interview questions added — Statistics, Trees, SQL, Regression.' },
  { date: 'May 2026',  text: 'Fluency Drills: 30 weak→strong vocabulary pairs for ML vocabulary.' },
  { date: 'May 2026',  text: '4-tier self-assessment added to Timed Practice sessions.' },
  { date: 'Apr 2026',  text: 'Timed Practice mode with 45-min countdown timer.' },
  { date: 'Apr 2026',  text: 'Gradient tab: long-form posts on feature engineering and Spark.' },
  { date: 'Mar 2026',  text: 'Python in browser via Pyodide — sklearn, numpy, matplotlib.' },
]

const ECOSYSTEM = [
  { name: 'GenAI Systems Lab', desc: 'Prompt engineering, RAG pipelines, LLM evaluation, hallucination measurement. The production GenAI counterpart.', accent: 'var(--violet)', border: 'rgba(167,139,250,0.25)', url: '#' },
  { name: 'Experimentation Lab', desc: 'A/B testing mechanics, SRM detection, CUPED, power analysis. Experiment design for product and ML teams.', accent: 'var(--sky)', border: 'rgba(34,211,238,0.25)', url: '#' },
]

const TRACKS = [
  {
    id: 'spark',     icon: '🔥', label: 'Spark Lab',
    accent: 'var(--ember)', border: 'rgba(249,115,22,0.2)', bg: 'rgba(249,115,22,0.04)',
    modules: ['Shuffle Hell', 'Skew Doctor', 'Partition Tuner'],
    description: 'PySpark execution mechanics. Configure shuffles, diagnose skew, read DAGs, watch jobs die.',
  },
  {
    id: 'features',  icon: '🧩', label: 'Feature Engineering',
    accent: 'var(--violet)', border: 'rgba(168,85,247,0.2)', bg: 'rgba(168,85,247,0.04)',
    modules: ['Skew Simulator', 'Feature Store Designer'],
    description: 'Training-serving skew, feature stores, window aggregations. The bugs that silently corrupt production models.',
  },
  {
    id: 'eval',      icon: '📊', label: 'Model Evaluation',
    accent: 'var(--mint)', border: 'rgba(240,165,0,0.18)', bg: 'rgba(52,211,153,0.04)',
    modules: ['Metric Selector', 'A/B Test Designer', 'Shadow Mode Sim'],
    description: 'AUC vs PR, calibration, A/B design, shadow mode. Pick the wrong metric — watch it mislead you.',
  },
  {
    id: 'models',    icon: '∑', label: 'Models & Math',
    accent: 'var(--violet)', border: 'rgba(168,85,247,0.2)', bg: 'rgba(168,85,247,0.04)',
    modules: ['PCA Explorer', 'SVD Decomposer', 'NumPy Internals', 'Calibration Curves', 'Regularization Lab'],
    description: 'Run real Python in the browser. PCA, SVD, sklearn pipelines, calibration, numpy.',
    python: true,
  },
  {
    id: 'design',    icon: '🏗', label: 'ML System Design',
    accent: 'var(--sky)', border: 'rgba(56,189,248,0.2)', bg: 'rgba(56,189,248,0.04)',
    modules: ['ML Incident Room', 'Design Canvas', 'Two-Tower Explorer'],
    description: 'End-to-end ML platform design. Rec systems, fraud, search ranking. Plus: the ML Incident Room.',
  },
  {
    id: 'monitor',   icon: '📡', label: 'Monitoring & Drift',
    accent: 'var(--rose)', border: 'rgba(244,63,94,0.2)', bg: 'rgba(244,63,94,0.04)',
    modules: ['Drift Dashboard', 'PSI Lab'],
    description: 'Configure PSI/KS thresholds. Watch a model silently degrade. Build alerts before it costs you.',
  },
  {
    id: 'interview', icon: '🎯', label: 'Interview Prep',
    accent: 'var(--gold)', border: 'rgba(251,191,36,0.2)', bg: 'rgba(251,191,36,0.04)',
    modules: ['System Design Qs', 'Feature Qs', 'Evaluation Qs', 'Spark Qs'],
    description: 'MLE interview bank for Spotify, Meta, Google, Airbnb, Uber, Netflix.',
  },
  {
    id: 'gradient',  icon: '∇', label: 'Gradient',
    accent: 'var(--sky)', border: 'rgba(56,189,248,0.2)', bg: 'rgba(56,189,248,0.04)',
    modules: ['Training-serving skew', 'Spark shuffle', 'AUC vs F1', 'PCA intuition'],
    description: 'Long-form posts. Feature engineering, Spark, system design, model evaluation.',
  },
]

const STATS = [
  { n: '8',    label: 'Learning tracks' },
  { n: '40+',  label: 'Interactive modules' },
  { n: 'Real', label: 'Python in browser' },
  { n: '0',    label: 'Logins required' },
]

// SVG progress ring
function Ring({ pct, size = 44, stroke = 3.5, accent = 'var(--mint)' }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--rim)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={accent} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  )
}

export default function HomeTab({ onNavigate }) {
  const [progress, setProgress] = useState([])
  const [nextUp,   setNextUp]   = useState(null)
  const [role,     setRole]     = useState(() => localStorage.getItem('msl_role') || null)

  function refresh() {
    setProgress(getAllProgress())
    setNextUp(getNextRecommendation())
  }

  useEffect(() => {
    refresh()
    window.addEventListener('msl_progress', refresh)
    return () => window.removeEventListener('msl_progress', refresh)
  }, [])

  function pickRole(key) {
    setRole(key)
    localStorage.setItem('msl_role', key)
  }

  const getTrackPct = id => progress.find(p => p.tab === id)?.pct ?? 0
  const activeRole = ROLES.find(r => r.key === role)

  const TAB_ACCENT = {
    spark: 'var(--ember)', features: 'var(--violet)', eval: 'var(--mint)',
    models: 'var(--violet)', design: 'var(--sky)', monitor: 'var(--rose)',
    interview: 'var(--gold)', gradient: 'var(--sky)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '72px' }}>

      {/* ── Hero ── */}
      <section style={{ paddingTop: '16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-mint">Beta · Free · No login required</span>
        </div>

        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: 700, lineHeight: 1.1,
          letterSpacing: '-0.04em', marginBottom: '20px',
        }}>
          The training ground for<br />
          <span className="text-gradient">production ML engineers.</span>
        </h1>

        {/* Role selector */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>
            I'm here to →
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ROLES.map(r => (
              <button key={r.key} onClick={() => pickRole(r.key)}
                title={r.desc}
                style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${role === r.key ? 'var(--prime)' : 'var(--rim)'}`, background: role === r.key ? 'rgba(240,165,0,0.10)' : 'transparent', color: role === r.key ? 'var(--prime)' : 'var(--ink-mid)', fontSize: '12px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '16px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '560px', marginBottom: '32px' }}>
          {activeRole?.desc ?? 'Most ML courses tell you what to do. This lab makes you configure the system and watch it break — then fix it. PySpark, feature pipelines, model evaluation, system design. Real Python in the browser.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {activeRole ? (
            <>
              <button className="btn-primary" onClick={() => onNavigate(activeRole.cta1.tab)}>{activeRole.cta1.label}</button>
              <button className="btn-secondary" onClick={() => onNavigate(activeRole.cta2.tab)}>{activeRole.cta2.label}</button>
              <button className="btn-ghost" onClick={() => onNavigate('gradient')}>∇ Gradient posts</button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={() => onNavigate('spark')}>Start with Spark Lab →</button>
              <button className="btn-secondary" onClick={() => onNavigate('models')}>⌁ Run Python in browser</button>
              <button className="btn-ghost" onClick={() => onNavigate('gradient')}>∇ Gradient posts</button>
            </>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", marginBottom: '6px' }} className="text-gradient">
              {s.n}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── What to study next ── */}
      {nextUp && (
        <section>
          <div className="eyebrow">Your progress</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: 0 }}>
              What to study next
            </h2>
          </div>

          {/* Progress rings row */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {TRACKS.map(t => {
              const pct = getTrackPct(t.id)
              return (
                <button key={t.id} onClick={() => onNavigate(t.id)}
                  title={`${t.label} — ${pct}% complete`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <div style={{ position: 'relative' }}>
                    <Ring pct={pct} accent={TAB_ACCENT[t.id]} />
                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{t.icon}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: pct > 0 ? 'var(--ink-mid)' : 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>{pct}%</span>
                </button>
              )
            })}
          </div>

          {/* Next up card */}
          <div className="card card-glow" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px', cursor: 'pointer', flexWrap: 'wrap' }}
            onClick={() => onNavigate(nextUp.tab)}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Ring pct={nextUp.pct} size={52} accent={TAB_ACCENT[nextUp.tab]} />
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                {TRACKS.find(t => t.id === nextUp.tab)?.icon}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                {nextUp.done === 0 ? 'Not started yet' : `${nextUp.done} / ${nextUp.total} done`}
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '16px', color: 'var(--ink-hi)' }}>
                {TRACKS.find(t => t.id === nextUp.tab)?.label}
              </div>
            </div>
            <span style={{ color: 'var(--mint)', fontSize: '18px' }}>→</span>
          </div>
        </section>
      )}

      {/* ── Python callout ── */}
      <section className="card-border-gradient" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '40px', lineHeight: 1 }}>⌁</div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div className="eyebrow" style={{ marginBottom: '6px' }}>New · Python in the browser</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '10px', letterSpacing: '-0.03em' }}>
              Run sklearn, numpy, matplotlib — no server, no install.
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '520px', marginBottom: '16px' }}>
              The Models &amp; Math track uses Pyodide to execute real Python directly in your browser.
              PCA, SVD, calibration, preprocessing pipelines — configure them, run them, see the output and plots instantly.
            </p>
            <button className="btn-primary" onClick={() => onNavigate('models')}>
              Open Models &amp; Math →
            </button>
          </div>
        </div>
      </section>

      {/* ── Track grid ── */}
      <section>
        <div className="eyebrow">Learning tracks</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', marginBottom: '6px' }}>
          Pick a track. Break things. Learn why.
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', marginBottom: '28px' }}>All tracks are free and require no account.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {TRACKS.map(t => {
            const pct = getTrackPct(t.id)
            return (
              <button key={t.id} onClick={() => onNavigate(t.id)} className="card"
                style={{ textAlign: 'left', background: `linear-gradient(135deg, var(--depth) 0%, ${t.bg} 100%)`, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${t.border}` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{t.icon}</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '15px', color: t.accent }}>{t.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {t.python && <span className="badge badge-mint" style={{ fontSize: '10px' }}>Python</span>}
                    {pct > 0 && (
                      <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--ink-low)' }}>{pct}%</span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--ink-low)' }}>
                      <span className="dot-live" />
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, marginBottom: '14px' }}>
                  {t.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {t.modules.map(m => (
                    <span key={m} style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', color: 'var(--ink-low)', borderRadius: '5px', padding: '2px 8px' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── For whom ── */}
      <section>
        <div className="eyebrow">Who it's for</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {[
            { who: 'MLE candidates', icon: '🎯', desc: 'Preparing for system design and coding rounds at ML-heavy companies. The depth here matches what Spotify and Meta actually ask.' },
            { who: 'Data engineers',  icon: '⚙️', desc: 'Who need to go deeper on Spark internals, feature pipelines, distributed processing, and production debugging.' },
            { who: 'ML practitioners',icon: '🔬', desc: 'Closing gaps in model evaluation, drift detection, or ML platform design — not just sklearn tutorials.' },
          ].map(item => (
            <div key={item.who} className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{item.icon}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '15px', color: 'var(--ink-hi)', marginBottom: '8px' }}>{item.who}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ecosystem bridge ── */}
      <section>
        <div className="eyebrow">Part of an ecosystem</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', marginBottom: '6px' }}>Three labs. One production mindset.</h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', marginBottom: '20px', maxWidth: '520px', lineHeight: 1.65 }}>ML Systems Lab covers core ML engineering. The companion labs handle GenAI and experimentation — same depth, same format.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {ECOSYSTEM.map(lab => (
            <div key={lab.name} className="card" style={{ padding: '22px', border: `1px solid ${lab.border}`, background: 'var(--depth)' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: lab.accent, marginBottom: '8px' }}>{lab.name}</div>
              <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0, marginBottom: '14px' }}>{lab.desc}</p>
              <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: "'JetBrains Mono',monospace" }}>Coming soon</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Changelog ── */}
      <section>
        <div className="eyebrow">Changelog</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {CHANGELOG.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: i < CHANGELOG.length - 1 ? '1px solid var(--rim)' : 'none', alignItems: 'baseline' }}>
              <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", minWidth: '72px', flexShrink: 0 }}>{entry.date}</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{entry.text}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
