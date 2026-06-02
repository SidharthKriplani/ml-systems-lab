import { useState, useEffect } from 'react'
import FidelityBadge from '../components/FidelityBadge.jsx'

const LS_KEY = 'msl_score:incidentroom'

// ── Incident scenarios ────────────────────────────────────────────────────────
// Each incident has 2–3 sequential diagnostic steps.
// Format: multi-step branching — choose first action, see finding, choose next action.

const INCIDENTS = [
  {
    id: 'inc1',
    title: 'AUC Drop + Latency Spike After Feature Migration',
    domain: 'Cross-domain: Feature Eng → Serving → MLOps',
    situation: `72 hours after a feature store migration, the production recommendation model shows:
• AUC dropped from 0.847 → 0.803 (–5.2%)
• Serving P95 latency increased from 48ms → 89ms
• No pipeline failures. No data quality alerts. Recsys team wants to rollback immediately.

Your on-call shift starts in 10 minutes. What do you check first?`,
    steps: [
      {
        question: 'First diagnostic action:',
        options: [
          { id: 'a', text: 'Roll back the feature store migration immediately — two simultaneous degradations always share a root cause' },
          { id: 'b', text: 'Run PSI on the migrated features to check if distribution shifted during migration' },
          { id: 'c', text: 'Check serving infrastructure — latency spike may be independent of the model degradation' },
          { id: 'd', text: 'Retrain the model on post-migration data to re-establish baseline' },
        ],
        correct: 'b',
        finding: `PSI results on migrated features:
• user_embedding: PSI = 0.34 (ALERT — significant shift)
• item_embedding: PSI = 0.31 (ALERT)
• session_features: PSI = 0.04 (stable)

The embedding features drifted during migration. Old embeddings were L2-normalised; the migration script omitted the normalisation step — raw dot products now score differently.`,
      },
      {
        question: 'Latency is also up 40ms. What explains it given the PSI finding?',
        options: [
          { id: 'a', text: 'Higher PSI = more computation per embedding lookup, increasing latency' },
          { id: 'b', text: 'The new embeddings are 512-dim vs 128-dim — ANN retrieval is slower and serving payload is larger' },
          { id: 'c', text: 'Latency is a coincidence — unrelated infra issue running in parallel' },
          { id: 'd', text: 'Model reranking is slower because scores are more uniform (less separation)' },
        ],
        correct: 'b',
        finding: `Confirmed: new feature store schema bumped embedding dimensions 128→512. ANN index (HNSW) query time scales roughly with dimension. Serving latency increased 41ms. The AUC drop and latency spike share the same root cause: the migration changed both normalisation and dimensionality.

Resolution: rollback the migration, fix the normalisation script and dimensionality, re-validate offline before re-deploying.`,
      },
    ],
    lesson: 'Two simultaneous degradations after a single change almost always share a root cause. Diagnose before rolling back — a rollback without root cause identification means you\'ll hit the same issue on the next migration.',
  },
  {
    id: 'inc2',
    title: 'Silent CTR Drop — No Alerts Fired',
    domain: 'Cross-domain: Monitoring → Feature Eng → Cold Start',
    situation: `Recommendation CTR has dropped 8.3% over 21 days. No alerts fired during this period:
• Feature pipeline: all green
• Model serving: all green
• PSI on all monitored features: < 0.10

The drop is gradual, not sudden. PM is escalating. What's your first diagnostic move?`,
    steps: [
      {
        question: 'No standard alerts fired. Where is the signal hiding?',
        options: [
          { id: 'a', text: 'Check prediction score distribution — a coverage collapse can appear as stable PSI while scores shift' },
          { id: 'b', text: 'Add more PSI monitors since existing ones are clearly misconfigured' },
          { id: 'c', text: 'Trigger a full model retrain — gradual drops are always concept drift' },
          { id: 'd', text: 'Check for a traffic composition change (new user cohorts diluting CTR average)' },
        ],
        correct: 'a',
        finding: `Score distribution analysis reveals:
• 23.4% of items are scoring exactly 0.000
• 3 weeks ago this was 4.1%
• The 0.000-scoring items are entirely new catalog items added in the last 3 weeks

New items have no interaction history → feature lookup returns null → null coerced to 0.0 → ranked last or not surfaced. 23% of catalog is effectively invisible to users.`,
      },
      {
        question: 'The cause is identified. What is the correct immediate fix?',
        options: [
          { id: 'a', text: 'Remove new items from the catalog until the model has enough data to score them' },
          { id: 'b', text: 'Implement a cold-start fallback: score new items using content embeddings + global popularity, bypass the interaction-history model' },
          { id: 'c', text: 'Set a floor score of 0.5 for all items with < 100 interactions' },
          { id: 'd', text: 'Retrain the model weekly to incorporate new items faster' },
        ],
        correct: 'b',
        finding: `Cold-start fallback implemented: items with < 50 interactions scored via content similarity (category + title embedding) + global CTR baseline. Score floor for new items set at P25 of active item distribution.

CTR recovered to –1.2% within 48 hours (residual gap = genuine quality difference between new and established items).

Monitoring added: "items scoring exactly 0.0" as a daily alert with threshold > 5%.`,
      },
    ],
    lesson: 'Coverage collapse is a monitoring blind spot — PSI on feature values stays stable because the affected items have no features to drift. Add explicit catalog coverage metrics: % items with scores above threshold, % items returned zero score.',
  },
  {
    id: 'inc3',
    title: 'A/B Test Shows 12% Lift — But Traffic Split Is Off',
    domain: 'Cross-domain: Experimentation → Frontend → Statistics',
    situation: `An experiment ran for 5 days shows:
• Control CTR: 4.21% | Treatment CTR: 4.73% — 12.4% relative lift, p = 0.003
• Control traffic: 48.2% | Treatment traffic: 51.8%
• Team wants to ship immediately based on the strong result.

You are reviewing before sign-off. What do you flag?`,
    steps: [
      {
        question: 'The traffic split is 48.2/51.8 instead of 50/50. Is this a problem?',
        options: [
          { id: 'a', text: 'Minor variance — traffic splits are never perfectly 50/50 in practice, result is still valid' },
          { id: 'b', text: 'Run a Sample Ratio Mismatch (SRM) check — a 3.6pp split deviation at this sample size requires a formal test before trusting any results' },
          { id: 'c', text: 'Re-weight the results by the traffic ratio to correct for the imbalance' },
          { id: 'd', text: 'Run the experiment for 2 more weeks to let the split stabilise naturally' },
        ],
        correct: 'b',
        finding: `SRM test result:
Chi-squared statistic: 14.2
p-value: 0.0002

SRM confirmed. The traffic split deviation is not random noise — it is statistically significant. This means the randomisation is broken. The measured 12.4% lift cannot be trusted: self-selection bias may explain part or all of the difference.

Stop analysis. Do not ship based on this result.`,
      },
      {
        question: 'SRM is confirmed. What caused it?',
        options: [
          { id: 'a', text: 'The experiment flagging logic ran on the server which creates timing-based assignment skew' },
          { id: 'b', text: 'The treatment variant is 200ms slower to render — mobile users bounce before the assignment event fires, so they are never counted as treatment' },
          { id: 'c', text: 'The control group was larger because it launched one hour earlier on the first day' },
          { id: 'd', text: 'Ad-blockers affect treatment and control differently due to different page structure' },
        ],
        correct: 'b',
        finding: `Performance profiling confirmed: treatment page renders 220ms slower on mobile (new image lazy-loading implementation). On mobile devices, 7.1% of users close the tab before the assignment event fires and the page load completes — these users are never recorded as treatment exposure.

The "lift" partially reflects the survivorship bias of mobile users who wait longer. After fixing the performance regression, re-running the experiment showed 3.1% CTR lift (genuine, ships).

Fix: assignment events must fire at page request, not at page-load completion.`,
      },
    ],
    lesson: 'Always run the SRM check before looking at your primary metric. A significant SRM means your randomisation is broken and any observed effect is untrustworthy — even if it looks like a win. Fixing performance regressions in experiments is part of the experiment discipline.',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
function IncidentCard({ incident, completed, onComplete }) {
  const [expanded, setExpanded]   = useState(false)
  const [stepIdx, setStepIdx]     = useState(0)
  const [picks, setPicks]         = useState([])
  const [revealed, setRevealed]   = useState([])
  const [done, setDone]           = useState(completed)

  const step      = incident.steps[stepIdx]
  const stepPick  = picks[stepIdx]
  const stepRevld = revealed[stepIdx]

  function pickOption(id) {
    if (stepPick) return
    const next = [...picks]
    next[stepIdx] = id
    setPicks(next)
  }

  function revealStep() {
    const next = [...revealed]
    next[stepIdx] = true
    setRevealed(next)
  }

  function nextStep() {
    if (stepIdx + 1 < incident.steps.length) {
      setStepIdx(stepIdx + 1)
    } else {
      setDone(true)
      onComplete(incident.id, picks)
    }
  }

  return (
    <div style={{ border: `1px solid ${done ? 'var(--mint)' : 'var(--rim)'}`, borderLeft: `3px solid ${done ? 'var(--mint)' : 'var(--prime)'}`, borderRadius: '10px', overflow: 'hidden', background: 'var(--surface)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            {incident.domain}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
            {incident.title}
          </div>
        </div>
        <span style={{ fontSize: '13px', color: done ? 'var(--mint)' : 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '2px' }}>
          {done ? '✓ done' : expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* Situation */}
          <div style={{ background: 'var(--card-scrim)', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', border: '1px solid var(--rim)' }}>
            <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Situation</div>
            <pre style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {incident.situation}
            </pre>
          </div>

          {/* Current step */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', marginBottom: '10px' }}>
              Step {stepIdx + 1} of {incident.steps.length}
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '12px', fontFamily: 'var(--font-sans)' }}>
              {step.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {step.options.map(opt => {
                const picked  = stepPick === opt.id
                const correct = opt.id === step.correct
                const right   = stepPick && picked && correct
                const wrong   = stepPick && picked && !correct
                return (
                  <button
                    key={opt.id}
                    className={`msl-option-btn${right ? ' correct' : wrong ? ' wrong' : ''}`}
                    onClick={() => pickOption(opt.id)}
                    disabled={!!stepPick}
                  >
                    {opt.text}
                  </button>
                )
              })}
            </div>

            {stepPick && !stepRevld && (
              <button className="btn-primary" onClick={revealStep} style={{ fontSize: '12px' }}>
                See finding →
              </button>
            )}

            {stepRevld && (
              <div style={{ marginTop: '12px' }}>
                <div className="msl-reveal-panel" style={{ padding: '14px 16px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: stepPick === step.correct ? 'var(--mint)' : 'var(--rose)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {stepPick === step.correct ? '✓ Correct action' : '✗ Suboptimal — here\'s what the data showed'}
                  </div>
                  <pre style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {step.finding}
                  </pre>
                </div>
                {!done && (
                  <button className="btn-primary" onClick={nextStep} style={{ fontSize: '12px' }}>
                    {stepIdx + 1 < incident.steps.length ? 'Next diagnostic step →' : 'Complete incident →'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Lesson (shown when complete) */}
          {done && (
            <div style={{ padding: '12px 16px', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '8px', marginTop: '8px' }}>
              <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Key lesson</div>
              <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{incident.lesson}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function IncidentRoomTab({ onNavigate }) {
  const [completedIds, setCompletedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(completedIds))
  }, [completedIds])

  function handleComplete(id) {
    setCompletedIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const done  = completedIds.length
  const total = INCIDENTS.length

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Interview zone</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 10px' }}>
          Incident Room
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '580px', margin: '0 0 4px' }}>
          Cross-domain production incidents — each requires reasoning across Feature Engineering, Monitoring, Serving, and Experimentation simultaneously. This is the judgment interviewers test when they ask "what would you check first?"
        </p>
        <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', margin: '4px 0 10px' }}>
          Not code bugs, not isolated domain MCQs — multi-step diagnosis with branching findings.
        </p>
        <div style={{ marginTop: '8px' }}><FidelityBadge tier="conceptual" /></div>
      </div>

      {/* Progress */}
      {done > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: 'var(--card-pad-primary)', background: 'var(--card-scrim)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Incidents resolved</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ width: `${Math.round((done / total) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{done}/{total}</span>
        </div>
      )}

      {/* Incidents */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {INCIDENTS.map(inc => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            completed={completedIds.includes(inc.id)}
            onComplete={handleComplete}
          />
        ))}
      </div>

      {/* Forward pointer */}
      {onNavigate && (
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
          <button
            onClick={() => onNavigate('combinator')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ fontSize: '12px', color: 'var(--prime)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Test cross-domain judgment in Combinator</span>
            <span style={{ fontSize: '12px', color: 'var(--prime)' }}>→</span>
          </button>
        </div>
      )}
    </div>
  )
}
