// BuildHubTab — the BUILD landing page. Right-pane projects grid that lists the
// six Project Labs. Clicking BUILD in the sidebar routes here (instead of the
// accordion opening); each card deep-links to its own project tab via onNavigate.
//
// Source of truth for the project list is BUILD_PROJECTS, exported so App.jsx can
// mirror it into the NAV_SECTIONS 'build' entry — one list, two consumers.

const BUILD_ACCENT = '#22c55e' // BUILD frame green (matches StartHereTab BUILD layer)

export const BUILD_PROJECTS = [
  { id: 'projectlab',         label: 'Project Lab · Telco',       desc: 'End-to-end churn notebook (Pyodide) with 5 judgment checkpoints.' },
  { id: 'loan_default',       label: 'Project Lab · Loans',       desc: 'Loan-default notebook — fairness audit, ECOA, disparate impact.' },
  { id: 'fraud_detection',    label: 'Project Lab · Fraud',       desc: 'Fraud notebook — 1:200 imbalance, precision@K, ops capacity.' },
  { id: 'ranking_project',    label: 'Project Lab · Ranking',     desc: 'Retrieve→rank→serve recommender — LTR, NDCG, online A/B. In development.', wip: true },
  { id: 'forecast_project',   label: 'Project Lab · Forecasting', desc: 'Demand forecasting with walk-forward backtesting and intervals. In development.', wip: true },
  { id: 'nlp_content_project',label: 'Project Lab · NLP/Content', desc: 'Content-embedding cold-start for a new catalog. In development.', wip: true },
]

export default function BuildHubTab({ onNavigate }) {
  const go = (tab) => onNavigate && onNavigate(tab)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.2rem 1.5rem', fontFamily: 'var(--font-sans)' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: BUILD_ACCENT, opacity: 0.9, marginBottom: '0.4rem' }}>
        Build
      </p>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--ink-hi)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
        Project Labs
      </h1>
      <p style={{ fontSize: '0.92rem', color: 'var(--ink-mid)', margin: '0 0 1.8rem', lineHeight: 1.6, maxWidth: 620 }}>
        Ship an end-to-end ML project in the browser. Each lab is a full notebook (Pyodide) with real
        judgment checkpoints at every phase — EDA, features, model, monitoring, deployment. Pick one and start building.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: '0.75rem' }}>
        {BUILD_PROJECTS.map(p => (
          <button
            key={p.id}
            onClick={() => go(p.id)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 10,
              padding: '1rem 1.1rem', textAlign: 'left', cursor: 'pointer',
              transition: 'border-color var(--t-fast), transform var(--t-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BUILD_ACCENT; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.01em' }}>{p.label}</span>
              {p.wip
                ? <span style={{
                    fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--ink-low)', background: 'var(--depth)', border: '1px solid var(--rim)',
                    borderRadius: 999, padding: '2px 8px', flexShrink: 0, whiteSpace: 'nowrap',
                  }}>In development</span>
                : <span style={{ fontSize: '0.9rem', color: 'var(--ink-low)', flexShrink: 0 }}>→</span>}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.55 }}>{p.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
