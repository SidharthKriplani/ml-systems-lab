import { useState, useEffect } from 'react'

const STORAGE_KEY = 'msl_casestudies'

const CASES = [
  {
    id: 'netflix',
    company: 'Netflix',
    color: 'var(--prime)',
    summary: 'Homepage play rate drops 12% after 8,000 new titles added — offline NDCG unchanged.',
    situation: "Netflix's homepage recommendation model showed a 12% drop in play rate over 3 weeks following a content catalog refresh that added 8,000 new titles. The model's offline NDCG was unchanged. Customer satisfaction scores fell. The head of ML asked your team to investigate.",
    data: [
      'Play rate by content age (new vs. catalog)',
      'Feature importance rankings from model',
      'A/B test logs from past 6 months',
      'Canary deployment traffic split',
      'User engagement by recommendation position',
      'Content embedding similarity scores',
      'Production feature distribution stats (PSI logs)',
    ],
    questions: [
      {
        type: 'mcq',
        text: 'What is the most likely root cause of the play rate drop despite stable offline NDCG?',
        options: [
          'Model overfitting to training data',
          'New titles have sparse engagement history — model can\'t score them well, causing popularity bias toward known content',
          'NDCG is the wrong metric for this task',
          'Infrastructure latency from catalog expansion',
        ],
        answer: 1,
        explanation: 'Offline NDCG was evaluated on historical data with established items. New titles have no engagement history → cold-start problem. Model scores them low → they\'re never recommended → self-fulfilling loop.',
      },
      {
        type: 'open',
        text: 'Design a cold-start strategy for new title onboarding. How do you ensure new content gets fair exposure while protecting user experience?',
        modelAnswer: '1) Content-based embedding: encode new title using metadata (genre, cast, synopsis NLP embedding), find KNN established titles, bootstrap engagement score. 2) Exploration budget: dedicate 5-10% of homepage slots to exploration — randomly surface eligible new titles to a treatment cohort. 3) Contextual bandit: Thompson Sampling over new titles, update posteriors as early engagement signals arrive. 4) Position injection: force-promote new titles at positions 5-10 until sufficient signal. 5) Gating: only surface to users with compatible taste profile. 6) Success metric: coverage@100h (% new titles with 1000+ plays in first 100 hours).',
      },
      {
        type: 'open',
        text: 'The model has no position bias correction. How does this interact with the cold-start problem and what would you fix?',
        modelAnswer: 'Interaction: Model trained on logged clicks is biased toward top-position items. New titles start at low positions → few clicks → model never learns their quality. Compound feedback loop. Fix: 1) IPS (Inverse Propensity Scoring): re-weight training by 1/propensity(position). 2) Randomization: inject random ranking for 1% of requests. 3) Doubly Robust estimator for offline policy evaluation. 4) Separate content quality scorer from user-content affinity scorer.',
      },
      {
        type: 'mcq',
        text: 'After fixes are deployed, how do you measure long-term content diversity health?',
        options: [
          'Only track NDCG@10',
          'Catalog coverage, aggregate diversity (ILD), and tail content share',
          'Measure only new title play rate',
          'Compare to competitor recommendation quality',
        ],
        answer: 1,
        explanation: 'Catalog coverage + ILD (avg pairwise embedding distance) + tail content share (% plays from bottom 80% of catalog) together capture: are we surfacing enough? are lists diverse? are tail items getting exposure?',
      },
    ],
  },
  {
    id: 'uber',
    company: 'Uber',
    color: 'var(--prime)',
    summary: 'Surge pricing model fails New Year\'s Eve — 90-day training window misses annual events.',
    situation: "Uber's dynamic surge pricing model failed during New Year's Eve. The model predicted normal demand, surge was not applied early enough, and thousands of riders faced 45-minute waits. Post-incident, the model had never seen NYE data at this year's scale — it used a 90-day rolling training window.",
    data: [
      'Historical ride request time series (3 years)',
      'Event calendar metadata',
      'Weather data',
      'Model training log (90-day rolling window)',
      'Feature importance ranking',
      'Real-time demand spike logs',
      'Driver supply forecasts',
    ],
    questions: [
      {
        type: 'open',
        text: 'Why did a 90-day rolling training window cause this failure? What training data strategy would you recommend?',
        modelAnswer: 'Root cause: 90-day window trained in Nov-Dec has no NYE data (occurred 365+ days ago). Annual seasonality completely invisible. Strategy: 1) Stratified temporal sampling: recent 90 days + all historical holiday examples always included. 2) Event-aware training: tag samples with event type, oversample rare high-impact events. 3) Dual model: base demand model (short window) + event spike model (trained on all historical events, triggered by calendar lookup). 4) Cyclical calendar features: day-of-year sin/cos, event type embedding, holiday flag.',
      },
      {
        type: 'mcq',
        text: 'What monitoring would have caught this before New Year\'s Eve?',
        options: [
          'Track only model accuracy metrics',
          'Shadow-score upcoming high-risk dates using historical data; alert when forecast diverges from event-adjusted baseline',
          'Only monitor real-time prediction errors',
          'Check model version in production',
        ],
        answer: 1,
        explanation: 'Proactive shadow evaluation: 1 week before NYE, run the model on last year\'s NYE patterns. Compare output to expected surge. Alert if model predicts normal demand on a known high-event date.',
      },
      {
        type: 'open',
        text: 'Design a real-time demand forecasting system that can handle sudden unexpected spikes within 5 minutes of onset.',
        modelAnswer: '1) Anomaly detection layer: online CUSUM or Bayesian changepoint detection on real-time request rate (1-min bins). Trigger override when rate exceeds 2σ above forecast. 2) Fast path: rules engine override if actual demand/supply ratio > threshold — apply floor surge within 1 min. 3) Model path: retrain lightweight model on last 2-hour rolling window every 5 minutes. 4) Driver supply signal: real-time GPS + acceptance rate as separate model. 5) Hierarchical: city-level forecast + local hexagon-level adjustment.',
      },
      {
        type: 'mcq',
        text: 'How should surge pricing balance explore/exploit — accuracy vs. user experience?',
        options: [
          'Always maximize accuracy',
          'Use contextual bandits to test different surge levels, learning true elasticity curves',
          'Only apply surge during confirmed events',
          'Set surge manually during all major events',
        ],
        answer: 1,
        explanation: 'True demand elasticity is unknown. Contextual bandit: try different surge levels in similar contexts, observe supply response and rider cancellations. Balances exploration (learn elasticity) with exploitation (apply optimal surge).',
      },
    ],
  },
  {
    id: 'airbnb',
    company: 'Airbnb',
    color: 'var(--prime)',
    summary: 'Search ranking model surfaces certain host demographics lower — no demographic features used.',
    situation: "Airbnb's search ranking model was found to surface listings from hosts with certain demographic characteristics disproportionately lower in results, even controlling for price, rating, and availability. An independent audit found the correlation. The model uses 47 features — none are demographic directly.",
    data: [
      'Feature importance rankings',
      'Historical booking data (5 years)',
      'Demographic data (not in model features)',
      'Model predictions by host demographic segment',
      'Review text corpus',
      'A/B test results from 3 recent experiments',
      'Legal constraints: cannot use demographic features',
    ],
    questions: [
      {
        type: 'mcq',
        text: "How can a model that doesn't include demographic features still produce discriminatory outcomes?",
        options: [
          'It cannot — if demographics are excluded, bias is impossible',
          'Proxy features correlated with demographics (neighborhood, review language patterns) can encode demographic signal',
          'Only explicit demographic features cause bias',
          'Bias only occurs in output layers',
        ],
        answer: 1,
        explanation: 'Proxy discrimination: features correlated with protected attributes act as proxies. Neighborhood → racial composition. Response time → socioeconomic factors. Review sentiment → implicit bias from reviewers. Model learns these correlations from biased historical data.',
      },
      {
        type: 'open',
        text: 'Describe a systematic approach to auditing all 47 features for proxy discrimination risk.',
        modelAnswer: '1) Correlation analysis: mutual information between each feature and demographic variables. Flag |corr| > threshold. 2) Counterfactual fairness: for same listing, swap host demographic → does feature value change? 3) Subgroup performance analysis: disaggregate NDCG by host demographic segment. 4) SHAP by subgroup: do certain features disproportionately lower rank for specific segments? 5) Legal review: confirm permissibility per jurisdiction. 6) Fairness constraint testing: demographic parity, equalized odds — measure accuracy-fairness tradeoff.',
      },
      {
        type: 'open',
        text: 'The team wants to fix bias without degrading booking conversion. What interventions do you recommend?',
        modelAnswer: 'Interventions: 1) Pre-processing: remove/transform proxy features (review text → bias-corrected sentiment model with demographic parity constraint). 2) In-processing: fairness-aware training (add regularization term penalizing demographic performance gaps). 3) Post-processing: re-ranking with diversity constraints (minimum representation in top-K). Measurement: demographic parity gap (top-10 show rate), equalized opportunity, overall conversion, host earnings Gini coefficient. Online A/B with both fairness and business metrics as co-primary.',
      },
      {
        type: 'mcq',
        text: 'What is the fundamental tension in this fairness intervention?',
        options: [
          'There is no tension — fairness and accuracy always align',
          'Fairness interventions often reduce accuracy; practitioners use Pareto frontier analysis and set minimum fairness thresholds as constraints',
          'Fairness is always prioritized over accuracy',
          'Business metrics are always prioritized',
        ],
        answer: 1,
        explanation: 'Accuracy-fairness tradeoff: most interventions sacrifice some overall performance. Practitioners: define minimum fairness requirements (regulatory/ethical floor), optimize accuracy subject to constraints, present Pareto frontier to leadership.',
      },
    ],
  },
  {
    id: 'doordash',
    company: 'DoorDash',
    color: 'var(--prime)',
    summary: 'ETA model overestimates by 8 min in urban areas after batched delivery feature launches.',
    situation: "DoorDash's delivery ETA model showed systematic 8-minute overestimates in dense urban areas during lunch rush, causing order cancellations. A new 'batched delivery' feature (one driver picks up multiple orders) had recently launched, but the model had no batching features and was trained on pre-batching data.",
    data: [
      'Delivery time distribution before/after batching rollout',
      'Model feature list (distance, restaurant prep time, traffic, time of day, driver rating)',
      'Batched vs. non-batched delivery logs',
      'Driver GPS traces',
      'Restaurant-level prep time variance',
      'Order cancellation rates by ETA bucket',
    ],
    questions: [
      {
        type: 'mcq',
        text: "What type of distribution shift occurred and why didn't the model detect it?",
        options: [
          'Covariate shift only',
          "Concept drift — delivery mechanics changed, making P(delivery_time | features) different post-batching, with no batching features in the model",
          'Label shift only',
          'Sample selection bias',
        ],
        answer: 1,
        explanation: 'Batched delivery changes P(Y|X): same distance + same traffic now implies longer time due to multi-stop route. The model had no batching features, so this new causal mechanism was invisible to monitoring.',
      },
      {
        type: 'open',
        text: 'Design the feature engineering additions needed to make the ETA model aware of batched deliveries.',
        modelAnswer: 'New features: 1) is_batched (binary). 2) batch_size (number of orders). 3) batch_position (1st or 2nd stop). 4) co_delivery_distance (distance between batch stops). 5) batch_order_prep_variance (difference in prep times — affects synchronization wait). 6) route_detour_ratio (total route / direct distance). 7) restaurant_colocation (are batch restaurants within X meters). Historical: driver_batch_acceptance_rate, restaurant_batch_handling_history.',
      },
      {
        type: 'open',
        text: 'The model is deployed but ETAs are still wrong by 3 minutes for batched orders. How do you implement a fast hotfix without retraining?',
        modelAnswer: 'Fast hotfix options: 1) Rule-based override: compute mean residual by (batch_size, batch_position, urban/suburban) on recent 7 days. Apply as lookup table addition. 2) Isotonic regression calibration: fit on (model_prediction, actual_time) for batched orders in last 7 days. 3) Linear correction model: train on residuals using batch features only, add to base output. 4) Rolling correction: 30-min average of (predicted - actual) by (geo_region, hour, is_batched). Fastest to deploy: option 1 — no ML, deterministic, auditable.',
      },
      {
        type: 'mcq',
        text: 'How would you set up online monitoring to catch this within 30 minutes of onset?',
        options: [
          'Monitor overall RMSE daily',
          'Real-time tracking of prediction residuals by delivery type with CUSUM anomaly detection; alert when 30-min residual exceeds 2 minutes',
          'Monitor only driver ratings',
          'Check model version daily',
        ],
        answer: 1,
        explanation: 'CUSUM on 30-min residuals by segment (batched/non-batched, urban/suburban, time-of-day). Triggers within minutes of systematic shift. Segmented monitoring ensures urban/batched degradation doesn\'t get averaged away.',
      },
    ],
  },
  {
    id: 'spotify',
    company: 'Spotify',
    color: 'var(--prime)',
    summary: 'Optimizing 30s completion rate raises it 8% but drives 15% churn — filter bubble effect.',
    situation: "Spotify's recommendation engine was optimized for 30-second listen completion rate. Over 18 months, completion rate rose 8%, but user churn increased 15% and qualitative research showed users feeling 'stuck in a filter bubble' and 'bored.' The ML team faces criticism that optimizing the proxy metric caused the problem.",
    data: [
      'Completion rate time series (18 months)',
      'Churn rate by user cohort and tenure',
      'Feature usage: Discover Weekly, Radio, Search, Liked Songs',
      'User survey responses (NPS, satisfaction)',
      'Listening diversity score (genre spread, artist spread)',
      'Social sharing data',
    ],
    questions: [
      {
        type: 'mcq',
        text: 'This is an example of which known ML/product problem?',
        options: [
          'Training-serving skew',
          "Goodhart's Law — when a measure becomes a target, it ceases to be a good measure; optimizing completion gamed the proxy, harming the true objective",
          'Overfitting to the training set',
          'Cold-start problem',
        ],
        answer: 1,
        explanation: "Goodhart's Law: optimizing completion rate → model learns familiar easy-to-complete content → users complete more but discover less → filter bubble → boredom → churn. The proxy detached from the goal.",
      },
      {
        type: 'open',
        text: 'Design a better objective function that balances engagement, satisfaction, and diversity.',
        modelAnswer: 'Objective: maximize long-term user value subject to diversity ≥ D_min. Components: 1) Engagement: completion rate, skip rate (negative), replay rate (strong positive), save to library. 2) Satisfaction: post-session NPS (1% sampling). 3) Diversity: Intra-session ILD (avg embedding distance), genre entropy, new artist discovery rate. 4) Long-term: D30 retention, listening hours trend. Weighted OEC = α×engagement + β×satisfaction_proxy + γ×diversity, where guardrails enforce diversity ≥ threshold.',
      },
      {
        type: 'mcq',
        text: 'How do you measure serendipity in recommendations?',
        options: [
          "Count of new tracks played",
          'Unexpectedness × Relevance: tracks far from user\'s history embedding but receiving high completion/positive signal',
          'Number of genre switches',
          'Total listening hours',
        ],
        answer: 1,
        explanation: "Serendipity = Unexpectedness × Usefulness. Unexpectedness: cosine distance from user history centroid to item embedding. Usefulness: user completed/saved/replayed. High-serendipity: user wouldn't have searched for it but loved it.",
      },
      {
        type: 'open',
        text: 'The team wants to A/B test a diversity-aware model for long-term outcomes. What are the challenges and how do you design the experiment?',
        modelAnswer: 'Challenges: 1) Long horizon: churn effects take weeks — minimum 4-8 week runtime. 2) Novelty effect: initial boost may not sustain. 3) Interference: users share music socially. 4) Metric sensitivity: diversity metrics must be pre-defined. Design: 1) Stratified randomization by user tenure and genre diversity baseline. 2) Primary metrics: D30/D60 retention, weekly listening hours at weeks 4 and 8. 3) Secondary: NPS proxy, ILD. 4) Guardrails: completion rate must not drop >2%. 5) CUPED on pre-experiment listening hours. 6) Post-experiment: HTE by user segment (diversity seekers vs. comfort listeners).',
      },
    ],
  },
]

function initProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved) return saved
  } catch {}
  return {}
}

export default function CaseStudiesTab({ onNavigate }) {
  const [openCase, setOpenCase] = useState(null)
  const [progress, setProgress] = useState(initProgress)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  function getQ(caseId, qIdx) {
    return progress[caseId]?.[qIdx] || { answer: '', revealed: false, selfRating: 3 }
  }

  function setQ(caseId, qIdx, patch) {
    setProgress(prev => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        [qIdx]: { ...getQ(caseId, qIdx), ...patch },
      },
    }))
  }

  function countAnswered(caseId) {
    return CASES.find(c => c.id === caseId)?.questions.reduce((acc, _, i) => {
      const q = getQ(caseId, i)
      return acc + (q.revealed ? 1 : 0)
    }, 0) || 0
  }

  const completedCases = CASES.filter(c => countAnswered(c.id) === 4).length

  return (
    <div style={{ padding: '24px', maxWidth: '860px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--ink-hi)' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Case Studies</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-mid)', fontSize: '13px' }}>Real ML system failures — multi-part analysis</p>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-low)', fontSize: '12px', lineHeight: 1.5, fontFamily: 'var(--font-sans)', maxWidth: '540px' }}>Expand a case, read the situation, then work through 4 connected diagnostic questions — each one builds on the last. Answer all 4 to complete the case.</p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-mid)', marginBottom: '6px' }}>
          <span>{completedCases}/5 cases completed</span>
          <span>{Math.round((completedCases / 5) * 100)}%</span>
        </div>
        <div style={{ background: 'var(--rim)', borderRadius: '4px', height: '6px' }}>
          <div style={{ background: 'var(--prime)', borderRadius: '4px', height: '6px', width: `${(completedCases / 5) * 100}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Case cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {CASES.map(c => {
          const isOpen = openCase === c.id
          const answered = countAnswered(c.id)
          return (
            <div key={c.id} style={{ background: 'var(--surface)', border: `1px solid var(--rim)`, borderRadius: '10px', overflow: 'hidden' }}>
              {/* Card header */}
              <button
                onClick={() => setOpenCase(isOpen ? null : c.id)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}
              >
                <span style={{ background: c.color + '20', color: c.color, border: `1px solid ${c.color}40`, borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  {c.company}
                </span>
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--ink-mid)' }}>{c.summary}</span>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {[0, 1, 2, 3].map(i => (
                    <span key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < answered ? c.color : 'var(--rim)' }} />
                  ))}
                </div>
                <span style={{ color: 'var(--ink-ghost)', fontSize: '12px', marginLeft: '4px' }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ padding: '0 20px 20px' }}>
                  {/* Situation */}
                  <div style={{ background: 'var(--depth)', borderRadius: '8px', padding: '14px', marginBottom: '12px', borderLeft: `3px solid ${c.color}` }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: c.color, letterSpacing: '0.08em', marginBottom: '6px' }}>SITUATION</div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{c.situation}</p>
                  </div>

                  {/* Data available */}
                  <div style={{ background: 'var(--depth)', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.08em', marginBottom: '8px' }}>DATA AVAILABLE</div>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      {c.data.map((d, i) => (
                        <li key={i} style={{ fontSize: '12px', color: 'var(--ink-mid)', marginBottom: '3px' }}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Questions */}
                  {c.questions.map((q, qIdx) => (
                    <QuestionBlock
                      key={qIdx}
                      q={q}
                      qIdx={qIdx}
                      state={getQ(c.id, qIdx)}
                      caseColor={c.color}
                      onChange={patch => setQ(c.id, qIdx, patch)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {onNavigate && (
        <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>How Netflix Became an ML Company (and What Every Engineer Can Learn From It)</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}
    </div>
  )
}

function QuestionBlock({ q, qIdx, state, caseColor, onChange }) {
  return (
    <div style={{ marginBottom: '16px', background: 'var(--depth)', borderRadius: '8px', padding: 'var(--card-pad-secondary)' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ink-ghost)', letterSpacing: '0.08em', marginBottom: '8px' }}>
        Q{qIdx + 1} — {q.type === 'mcq' ? 'MULTIPLE CHOICE' : 'OPEN ENDED'}
      </div>
      <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{q.text}</p>

      {q.type === 'mcq' ? (
        <MCQOptions q={q} state={state} onChange={onChange} />
      ) : (
        <OpenQuestion q={q} state={state} caseColor={caseColor} onChange={onChange} />
      )}
    </div>
  )
}

function MCQOptions({ q, state, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {q.options.map((opt, i) => {
        const isCorrect = i === q.answer
        const isPicked = state.answer === String(i)
        const revealed = state.revealed

        let bg = 'var(--surface)'
        let border = '1px solid var(--rim)'
        let color = 'var(--ink-mid)'

        if (revealed) {
          if (isCorrect) { bg = 'rgba(52,211,153,0.15)'; border = '1px solid var(--mint)'; color = 'var(--mint)' }
          else if (isPicked && !isCorrect) { bg = 'rgba(244,63,94,0.15)'; border = '1px solid var(--rose)'; color = 'var(--rose)' }
        } else if (isPicked) {
          border = '1px solid var(--prime)'
        }

        return (
          <button
            key={i}
            disabled={revealed}
            onClick={() => onChange({ answer: String(i), revealed: true })}
            style={{ background: bg, border, borderRadius: '6px', padding: 'var(--card-pad-primary)', cursor: revealed ? 'default' : 'pointer', textAlign: 'left', fontSize: '13px', color, transition: 'all 0.15s' }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', marginRight: '8px', opacity: 0.6 }}>{['A', 'B', 'C', 'D'][i]}</span>
            {opt}
          </button>
        )
      })}
      {state.revealed && (
        <div style={{ marginTop: '8px', background: 'rgba(52,211,153,0.13)', borderLeft: '3px solid var(--mint)', borderRadius: '4px', padding: '10px 12px', fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--mint)', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em' }}>EXPLANATION — </span>
          {q.explanation}
        </div>
      )}
    </div>
  )
}

function OpenQuestion({ q, state, caseColor, onChange }) {
  return (
    <div>
      <textarea
        value={state.answer || ''}
        onChange={e => onChange({ answer: e.target.value })}
        placeholder="Write your answer here..."
        style={{
          width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '6px',
          padding: '10px 12px', fontSize: '13px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)',
          resize: 'vertical', minHeight: '90px', outline: 'none', lineHeight: 1.5,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
        <button
          onClick={() => onChange({ revealed: !state.revealed })}
          style={{ fontSize: '12px', padding: '6px 14px', background: state.revealed ? 'var(--prime-bg-light)' : 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '6px', color: 'var(--prime)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
        >
          {state.revealed ? 'Hide Answer' : 'Reveal Model Answer'}
        </button>

        {state.revealed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ink-mid)' }}>
            <span>Self-rate:</span>
            <input
              type="range" min={1} max={5} value={state.selfRating || 3}
              onChange={e => onChange({ selfRating: Number(e.target.value) })}
              style={{ accentColor: caseColor, width: '80px' }}
            />
            <span style={{ color: caseColor, fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              {state.selfRating || 3}/5
            </span>
          </div>
        )}
      </div>

      {state.revealed && (
        <div style={{ marginTop: '10px', background: 'rgba(240,165,0,0.11)', borderLeft: '3px solid var(--prime)', borderRadius: '4px', padding: '12px 14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--prime)', letterSpacing: '0.08em', marginBottom: '6px' }}>MODEL ANSWER</div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{q.modelAnswer}</p>
        </div>
      )}
    </div>
  )
}
