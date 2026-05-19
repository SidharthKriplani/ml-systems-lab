const TRACKS = [
  {
    id: 'spark',    icon: '🔥', label: 'Spark Lab',
    accent: '#f59e0b', border: 'rgba(245,158,11,0.2)', bg: 'rgba(245,158,11,0.04)',
    modules: ['Shuffle Hell', 'Skew Doctor', 'Partition Tuner', 'Broadcast Join Picker'],
    status: 'live',
    description: 'PySpark execution mechanics. Configure shuffles, diagnose skew, read DAGs, watch jobs die and fix them.',
  },
  {
    id: 'features', icon: '🧩', label: 'Feature Engineering',
    accent: '#6366f1', border: 'rgba(99,102,241,0.2)', bg: 'rgba(99,102,241,0.04)',
    modules: ['Skew Simulator', 'Feature Store Designer', 'Window Agg Builder', 'Lag Feature Lab'],
    status: 'live',
    description: 'Training-serving skew, feature stores, window aggregations. The bugs that silently corrupt production models.',
  },
  {
    id: 'eval',     icon: '📊', label: 'Model Evaluation',
    accent: '#10b981', border: 'rgba(16,185,129,0.2)', bg: 'rgba(16,185,129,0.04)',
    modules: ['Metric Selector', 'A/B Test Designer', 'Calibration Lab', 'Shadow Mode Sim'],
    status: 'live',
    description: 'AUC vs PR, calibration, A/B design, shadow mode. Pick the wrong metric — watch it mislead you.',
  },
  {
    id: 'models',   icon: '∑', label: 'Models & Math',
    accent: '#a855f7', border: 'rgba(168,85,247,0.2)', bg: 'rgba(168,85,247,0.04)',
    modules: ['PCA Explorer', 'SVD Decomposer', 'Preprocessing Lab', 'Calibration Curves', 'NumPy Internals', 'Regularization Lab'],
    status: 'live',
    description: 'Run real Python in the browser. PCA, SVD, sklearn pipelines, calibration, numpy — math you can actually touch.',
    python: true,
  },
  {
    id: 'design',   icon: '🏗', label: 'ML System Design',
    accent: '#22d3ee', border: 'rgba(34,211,238,0.2)', bg: 'rgba(34,211,238,0.04)',
    modules: ['Design Canvas', 'Rec System Builder', 'ML Incident Room', 'Two-Tower Explorer'],
    status: 'live',
    description: 'End-to-end ML platform design. Rec systems, fraud, search ranking. Plus: the ML Incident Room.',
  },
  {
    id: 'monitor',  icon: '📡', label: 'Monitoring & Drift',
    accent: '#f43f5e', border: 'rgba(244,63,94,0.2)', bg: 'rgba(244,63,94,0.04)',
    modules: ['Drift Dashboard', 'PSI Lab', 'KS Test Explorer', 'Alert Tuner'],
    status: 'live',
    description: 'Configure PSI/KS thresholds. Watch a model silently degrade. Build alerts that catch drift before it costs you.',
  },
  {
    id: 'interview',icon: '🎯', label: 'Interview Prep',
    accent: '#f59e0b', border: 'rgba(245,158,11,0.2)', bg: 'rgba(245,158,11,0.04)',
    modules: ['50+ MLE Questions', 'System Design Framework', 'Company Patterns', 'Timed Practice'],
    status: 'live',
    description: 'MLE interview bank for Spotify, Meta, Google, Airbnb, Uber, Netflix. The exact questions — with frameworks.',
  },
  {
    id: 'gradient', icon: '∇', label: 'Gradient',
    accent: '#818cf8', border: 'rgba(129,140,248,0.2)', bg: 'rgba(129,140,248,0.04)',
    modules: ['Feature Eng Deep Dives', 'Spark Patterns', 'System Design Walkthroughs', 'Paper Breakdowns'],
    status: 'live',
    description: 'Long-form posts. Feature engineering, PySpark optimization, system design, model evaluation, paper breakdowns.',
  },
]

const STATS = [
  { n: '8',    label: 'Learning tracks' },
  { n: '40+',  label: 'Interactive modules' },
  { n: 'Real', label: 'Python in browser' },
  { n: '0',    label: 'Logins required' },
]

export default function HomeTab({ onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '72px' }}>

      {/* ── Hero ── */}
      <section style={{ paddingTop: '16px' }}>
        <div style={{ marginBottom: '20px' }}>
          <span className="badge badge-indigo">Beta · Free · No login required</span>
        </div>

        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          marginBottom: '20px',
          color: '#eaecff',
        }}>
          The training ground for<br />
          <span className="text-gradient">production ML engineers.</span>
        </h1>

        <p style={{ fontSize: '16px', color: '#525a82', lineHeight: 1.7, maxWidth: '560px', marginBottom: '32px' }}>
          Most ML courses tell you what to do. This lab makes you configure the system
          and watch it break — then fix it. PySpark, feature pipelines, sklearn, model
          evaluation, drift detection, system design. Run real Python in the browser.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => onNavigate('spark')} style={{ fontSize: '14px', padding: '11px 24px' }}>
            Start with Spark Lab →
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('models')} style={{ fontSize: '14px', padding: '11px 24px' }}>
            ⌁ Run Python in browser
          </button>
          <button className="btn-ghost" onClick={() => onNavigate('gradient')} style={{ fontSize: '14px', padding: '11px 16px' }}>
            ∇ Gradient posts
          </button>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", background: 'linear-gradient(135deg,#818cf8,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '6px' }}>
              {s.n}
            </div>
            <div style={{ fontSize: '12px', color: '#525a82', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Python callout ── */}
      <section className="card-gradient-border" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '40px', lineHeight: 1 }}>⌁</div>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <div className="section-eyebrow" style={{ marginBottom: '6px' }}>New · Python in the browser</div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: '#eaecff', marginBottom: '10px', letterSpacing: '-0.03em' }}>
              Run sklearn, numpy, matplotlib — no server, no install.
            </h2>
            <p style={{ fontSize: '14px', color: '#525a82', lineHeight: 1.7, maxWidth: '520px', marginBottom: '16px' }}>
              The Models &amp; Math track uses Pyodide to execute real Python directly in your browser.
              PCA, SVD, calibration, preprocessing pipelines — configure them, run them, see the output and plots instantly.
            </p>
            <button className="btn-primary" onClick={() => onNavigate('models')} style={{ fontSize: '13px' }}>
              Open Models &amp; Math →
            </button>
          </div>
        </div>
      </section>

      {/* ── Track grid ── */}
      <section>
        <div className="section-eyebrow">Learning tracks</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: 700, color: '#eaecff', letterSpacing: '-0.03em', marginBottom: '6px' }}>
          Pick a track. Break things. Learn why.
        </h2>
        <p style={{ fontSize: '14px', color: '#525a82', marginBottom: '28px' }}>All tracks are free and require no account.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {TRACKS.map(t => (
            <button
              key={t.id}
              onClick={() => onNavigate(t.id)}
              className="card"
              style={{
                textAlign: 'left',
                background: `linear-gradient(135deg, #0b0d1a 0%, ${t.bg} 100%)`,
                border: `1px solid ${t.border}`,
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${t.border}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{t.icon}</span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '15px', color: t.accent }}>
                    {t.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {t.python && <span className="badge badge-emerald" style={{ fontSize: '10px' }}>Python</span>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#525a82' }}>
                    <span className="status-live" />
                    live
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6, marginBottom: '14px' }}>
                {t.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {t.modules.map(m => (
                  <span key={m} style={{
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#525a82',
                    borderRadius: '5px',
                    padding: '2px 8px',
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── For whom ── */}
      <section>
        <div className="section-eyebrow">Who it's for</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {[
            { who: 'MLE candidates', icon: '🎯', desc: 'Preparing for system design and coding rounds at ML-heavy companies. The depth here matches what Spotify and Meta actually ask.' },
            { who: 'Data engineers', icon: '⚙️', desc: 'Who need to go deeper on Spark internals, feature pipelines, distributed processing, and production debugging.' },
            { who: 'ML practitioners', icon: '🔬', desc: 'Closing gaps in model evaluation, drift detection, or ML platform design — not just sklearn tutorials.' },
          ].map(item => (
            <div key={item.who} className="card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{item.icon}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '15px', color: '#eaecff', marginBottom: '8px' }}>{item.who}</div>
              <div style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
