import { useState, useEffect } from 'react'

const REVEALS_KEY = 'msl_staff_reveals'

const DOMAIN_COLORS = {
  'Experiment Design': 'var(--sky)',
  'MLOps': 'var(--rose)',
  'Architecture': 'var(--violet)',
  'Ranking': 'var(--prime)',
  'Systems': 'var(--sky)',
  'Ethics/Fairness': 'var(--rose)',
  'Feature Engineering': 'var(--mint)',
  'Problem Framing': 'var(--amber, #f59e0b)',
}

const SCENARIOS = [
  {
    id: 's1',
    title: "A model's A/B test shows p=0.03 lift.",
    domain: 'Experiment Design',
    ic3: 'Ship it — p < 0.05, statistically significant.',
    ic5: 'Check: multiple comparisons? Practical significance? Segment breakdowns? Minimum runtime met? CUPED applied? If all good, recommend shipping with monitoring.',
    staff: "Challenge the metric selection. Is completion rate the right proxy? Any guardrail violations? Network effects? Longer-term holdback needed? What's the cost of being wrong — can we roll back fast? Statistical significance is necessary but not sufficient. Write the rollout criteria before touching the p-value.",
  },
  {
    id: 's2',
    title: 'Production model accuracy dropped 3% overnight.',
    domain: 'MLOps',
    ic3: 'Retrain the model immediately with recent data.',
    ic5: 'Triage first: check data pipeline health (null rates, schema drift, volume), model serving health (latency, errors), feature PSI. Segment the drop. Understand root cause before retraining.',
    staff: "Who else needs to know right now? What's the customer impact in dollars? Is this a data contract violation — which upstream team owns the pipeline? Establish an incident, assign SEV level, run retro. Systemic fix: add automated data quality gates and rollback triggers so this doesn't require human intervention next time.",
  },
  {
    id: 's3',
    title: 'A junior engineer asks whether to use PyTorch or TensorFlow.',
    domain: 'Architecture',
    ic3: 'PyTorch for research/flexibility, TF for production/deployment.',
    ic5: 'Depends on the team ecosystem, existing infra, deployment target, existing model library, and team familiarity. Evaluate specific criteria, don\'t give a blanket answer.',
    staff: "The framework is the least important decision. What deployment infra does the org have? What's the model lifecycle — research or production? Who maintains it in 2 years? Standardize on one per use case. The answer is: use what the team already uses unless there's a compelling reason not to.",
  },
  {
    id: 's4',
    title: 'The recommendation model returns the same 10 items for most users.',
    domain: 'Ranking',
    ic3: 'Add diversity-promoting re-ranking or increase exploration epsilon.',
    ic5: 'Diagnose first: collapsed embeddings, homogeneous user features, or aggressive caching? Check embedding space clustering. Add ILD to monitoring.',
    staff: "This is a product strategy question masquerading as tech. Why are we optimizing completion rate alone? Diversity is a business goal. Define a diversity OEC. Add catalog coverage and ILD as guardrail metrics company-wide. The 10-item problem is a symptom — the real issue is the objective function.",
  },
  {
    id: 's5',
    title: 'Your team is asked to build a new ML feature in 2 weeks.',
    domain: 'Systems',
    ic3: 'Start coding immediately — tight deadline.',
    ic5: "Scope first: minimum viable version, data needed, available infra, reuse opportunities. Set expectations on what's doable vs. cut. Write a mini-spec.",
    staff: "Negotiate the deadline before accepting it. '2 weeks' often means 'we made a business commitment without asking engineering.' What does success look like? Can we do a rules-based v1 first, then ML v2? Rushing an ML feature creates technical debt that costs 5x to fix later. Push back with a credible alternative scope.",
  },
  {
    id: 's6',
    title: 'Feature importance shows the most important feature is a proxy for demographics.',
    domain: 'Ethics/Fairness',
    ic3: 'Remove the feature to avoid bias.',
    ic5: 'Audit: how correlated is it with demographics? Measure performance impact of removing it. Consider debiasing. Run fairness metrics with and without.',
    staff: "This is a legal and ethical decision, not just technical. Escalate to legal and policy. Removing the feature may not fix underlying bias if other proxies remain — audit all features. Define the org's fairness criteria before building the model. Document the decision for regulatory purposes.",
  },
  {
    id: 's7',
    title: 'Inference latency increased from 50ms to 200ms after a model update.',
    domain: 'MLOps',
    ic3: 'Optimize the model — quantize, prune, or use a smaller architecture.',
    ic5: 'Profile first: model inference, feature retrieval, network, or serialization? Use a profiler before optimizing.',
    staff: "What's the business impact? 200ms on which endpoint, for which segment? Did we breach an SLO contract? Immediate options: rollback, shadow the new model. Then: why wasn't this caught in performance testing? Add latency regression tests to CI/CD. P99 latency SLO must be part of model promotion criteria.",
  },
  {
    id: 's8',
    title: 'A data scientist wants to use the latest SOTA model from a paper.',
    domain: 'Architecture',
    ic3: 'Use it if it performs better on the benchmark.',
    ic5: "Can we reproduce results on our data? What's the inference cost? Maintained implementation? Migration path from current model?",
    staff: "Academic SOTA ≠ production SOTA. Who maintains this when the DS moves teams? Does it fit serving constraints? I'd rather have a boring well-understood model that's 2% worse but reliable than a cutting-edge model that's hard to debug at 3am. SOTA matters most when current model is clearly the bottleneck.",
  },
  {
    id: 's9',
    title: 'Training data for a new market is sparse.',
    domain: 'Systems',
    ic3: 'Collect more data before building the model.',
    ic5: 'Transfer learning from similar markets, global model + market fine-tuning layer, rules-based baseline while data accumulates, synthetic data. Instrument data collection as parallel workstream.',
    staff: "Data sparsity is a business decision. What's the cost of getting this wrong in a new market? Build cheapest thing that works (rules + global model), instrument it, set a trigger for 'enough data' to train market-specific model. Define 'enough data' upfront. Don't over-engineer for uncertain ROI.",
  },
  {
    id: 's10',
    title: 'Stakeholder wants to add 50 new features to improve the model.',
    domain: 'Feature Engineering',
    ic3: 'More features = better model, especially with regularization.',
    ic5: 'Measure marginal value: train with/without each feature, compare AUC. Penalize high-maintenance features. 50 features is a scope discussion.',
    staff: "50 features = 50 data dependencies = 50 potential SLA violations. Each feature has maintenance cost and on-call burden. Force prioritization: which 10 are highest ROI? We can add 10 well this quarter or 50 poorly. Also: does this require a new model architecture? That's a separate scoping conversation.",
  },
  {
    id: 's11',
    title: 'The model is 95% accurate but has low adoption from product teams.',
    domain: 'Systems',
    ic3: 'Improve model accuracy further — 5% error rate must be the issue.',
    ic5: "Adoption issues are rarely about accuracy. Is the output format hard to integrate? Are confidence scores calibrated? Does product trust the model? Talk to the product team.",
    staff: "Model adoption is a partnership problem. Technical excellence is table stakes. Joint session: show the product team exactly how the model works, where it fails, what monitoring we have. Trust comes from transparency and shared accountability, not accuracy numbers.",
  },
  {
    id: 's12',
    title: 'You need to decide whether to retrain daily vs. weekly.',
    domain: 'MLOps',
    ic3: 'Daily retraining is better — fresher data always helps.',
    ic5: 'Depends on performance decay curve. Measure how much metric degrades per day without retraining. Compare to training cost and deployment risk.',
    staff: "What's the cost of retraining (compute, on-call, deployment risk) vs. benefit? Measure performance decay empirically: run a holdback experiment, freeze a model for 2 weeks, measure divergence on business metrics. Daily retraining = daily deployment risk — add automated rollback and shadow evaluation to make it safe.",
  },
  {
    id: 's13',
    title: 'PM wants an ML model to predict which users will churn so we can send them a retention email.',
    domain: 'Problem Framing',
    ic3: 'Build a churn classifier on historical engagement data. Score users weekly, trigger email for top decile.',
    ic5: "What's the precision/recall target? What action threshold triggers the email? Do we have clean churn labels? How fresh does scoring need to be for the email to be actionable?",
    staff: "What do you do differently with users you predict won't churn? If the only action is 'send email,' just send everyone the email and A/B test it — you'll have results in a week. A churn model earns its place only when segmentation meaningfully changes the action: different message, different incentive, different channel. Until you can prove that, a model adds cost and delay. Start with the email. Measure. Then decide if ML-driven targeting moves the needle.",
  },
  {
    id: 's14',
    title: 'Support team wants ML to auto-categorize incoming tickets across 8 categories.',
    domain: 'Problem Framing',
    ic3: 'Fine-tune a text classifier on historical tickets. Deploy to production with a confidence threshold for human fallback.',
    ic5: "What's label quality on historical tickets? Training examples per category? Consequence of miscategorization — does a wrong category delay resolution or just route wrong? What's the current manual cost?",
    staff: "How many tickets per day? If it's under 100, a human categorizes them in minutes — ML ROI is negative. At 8 categories with sparse data, the classifier will be confidently wrong on rare classes. Ship regex + keyword rules in a day. Define the volume threshold at which ML makes sense — probably 500+ tickets/day — and revisit then. Don't build a data flywheel for a problem that doesn't need one.",
  },
  {
    id: 's15',
    title: 'Security team requests an ML fraud detection model. Current fraud rate is 0.001%.',
    domain: 'Problem Framing',
    ic3: 'Train a binary classifier with class imbalance techniques — SMOTE, class weights, focal loss. Optimize for recall.',
    ic5: "At 0.001% base rate, precision-recall tradeoff is brutal. What's the cost of a false positive (blocking a legitimate user) vs. false negative (missing fraud)? What volume are we talking?",
    staff: "Do the math before writing a line of code. At 0.001% base rate and 99% precision, you're still generating 1 false positive per fraudster caught. At 1M transactions/day that's thousands of legitimate users flagged daily. Calculate expected FP volume at your actual traffic. Start with velocity rules and device fingerprinting — these catch 80% of fraud patterns with zero training data and full explainability for disputes. ML earns its place when adversarial adaptation outpaces rules. Not before.",
  },
  {
    id: 's16',
    title: 'Product team wants semantic ML search across the catalog to replace keyword search.',
    domain: 'Problem Framing',
    ic3: 'Build embeddings with a transformer model. Implement vector similarity search with FAISS or Pinecone.',
    ic5: "Catalog size and query volume? Current search quality metrics and failure mode analysis? Latency and infrastructure requirements? What specific query types is keyword search failing on?",
    staff: "How many products? If it's under 5,000, BM25 with synonym expansion and typo tolerance beats semantic search on precision and is 10x easier to debug when it goes wrong. Semantic search wins on long-tail queries and conceptual matching — but only if you've measured that keyword search is actually failing there. Don't bring in embeddings, vector DB infra, and reranking complexity until you've run a failure analysis on current search logs and proved keyword search is the bottleneck. What does the query log say?",
  },
  {
    id: 's17',
    title: 'HR wants a model to predict which employees will quit in the next 6 months.',
    domain: 'Problem Framing',
    ic3: 'Train a survival model or binary classifier on HR data — tenure, performance ratings, compensation bands, manager changes.',
    ic5: "What's the base attrition rate? What features are available without violating privacy norms? What action does a positive prediction trigger? Do we have enough runway to act on predictions?",
    staff: "HR managers already know which employees are flight risks — they talk to people. The real question: what intervention changes based on a model score that isn't already happening through manager judgment? If the action (compensation review, role change, 1:1 escalation) requires discretion anyway, the model just adds a bureaucratic layer. Where a model earns its place is scale — when a manager has 40 reports and can't have 40 meaningful conversations. Define the intervention precisely, then check if manager judgment already routes it. Build the model only where that breaks down.",
  },
]

function initReveals() {
  try {
    const saved = JSON.parse(localStorage.getItem(REVEALS_KEY))
    if (saved && typeof saved === 'object') return saved
  } catch {}
  return {}
}

export default function StaffLayerTab() {
  const [reveals, setReveals] = useState(initReveals)
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    localStorage.setItem(REVEALS_KEY, JSON.stringify(reveals))
  }, [reveals])

  function revealLevel(id, level) {
    setReveals(prev => ({ ...prev, [id]: level }))
  }

  function toggleExpanded(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const total = SCENARIOS.length
  const staffCount = SCENARIOS.filter(s => (reveals[s.id] || 0) >= 3).length

  return (
    <div style={{ padding: '24px', maxWidth: '920px', margin: '0 auto', fontFamily: "'Space Grotesk', sans-serif", color: 'var(--ink-hi)' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Senior / Staff Layer</h2>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-mid)', fontSize: '13px' }}>The same problem through IC3 → IC5 → Staff eyes</p>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-mid)', marginBottom: '6px' }}>
          <span>{staffCount} / {total} staff-level reached</span>
          <span>{Math.round((staffCount / total) * 100)}%</span>
        </div>
        <div style={{ background: 'var(--rim)', borderRadius: '4px', height: '6px' }}>
          <div style={{ background: 'var(--prime)', borderRadius: '4px', height: '6px', width: `${(staffCount / total) * 100}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
        {SCENARIOS.map(s => {
          const level = reveals[s.id] || 0
          const isOpen = expanded.has(s.id)
          const domainColor = DOMAIN_COLORS[s.domain] || 'var(--ink-mid)'

          return (
            <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px', overflow: 'hidden' }}>
              {/* Card header */}
              <button
                onClick={() => toggleExpanded(s.id)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: domainColor, background: domainColor + '18', border: `1px solid ${domainColor}30`, borderRadius: '4px', padding: '2px 8px', letterSpacing: '0.06em' }}>
                    {s.domain}
                  </span>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[1, 2, 3].map(dot => (
                      <span
                        key={dot}
                        style={{
                          width: '9px', height: '9px', borderRadius: '50%',
                          background: level >= dot
                            ? dot === 3 ? 'var(--prime)' : dot === 2 ? 'var(--sky)' : 'var(--ink-ghost)'
                            : 'transparent',
                          border: `2px solid ${level >= dot ? (dot === 3 ? 'var(--prime)' : dot === 2 ? 'var(--sky)' : 'var(--ink-ghost)') : 'var(--rim)'}`,
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                    <span style={{ color: 'var(--ink-ghost)', fontSize: '11px', marginLeft: '2px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.5 }}>{s.title}</p>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* IC3 block */}
                  {level >= 1 && (
                    <LevelBlock
                      label="IC3"
                      text={s.ic3}
                      bgColor="var(--surface)"
                      borderColor="var(--ink-ghost)"
                      labelColor="var(--ink-ghost)"
                      borderWidth="2px"
                    />
                  )}

                  {/* IC5 block */}
                  {level >= 2 && (
                    <LevelBlock
                      label="IC5"
                      text={s.ic5}
                      bgColor="var(--depth)"
                      borderColor="var(--sky)"
                      labelColor="var(--sky)"
                      borderWidth="2px"
                    />
                  )}

                  {/* Staff block */}
                  {level >= 3 && (
                    <LevelBlock
                      label="Staff"
                      text={s.staff}
                      bgColor="rgba(240,165,0,0.05)"
                      borderColor="var(--prime)"
                      labelColor="var(--prime)"
                      borderWidth="3px"
                    />
                  )}

                  {/* Reveal button */}
                  {level < 3 && (
                    <RevealButton level={level} onReveal={() => revealLevel(s.id, level + 1)} />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LevelBlock({ label, text, bgColor, borderColor, labelColor, borderWidth }) {
  return (
    <div style={{ background: bgColor, borderLeft: `${borderWidth} solid ${borderColor}`, borderRadius: '4px', padding: '10px 12px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: labelColor, letterSpacing: '0.08em', marginBottom: '5px' }}>{label.toUpperCase()}</div>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>{text}</p>
    </div>
  )
}

function RevealButton({ level, onReveal }) {
  const configs = {
    0: { label: 'Reveal IC3', bg: 'var(--surface)', color: 'var(--ink-mid)', border: '1px solid var(--rim)' },
    1: { label: 'Reveal IC5', bg: 'rgba(34,211,238,0.08)', color: 'var(--sky)', border: '1px solid var(--sky)' },
    2: { label: 'Reveal Staff', bg: 'rgba(240,165,0,0.15)', color: 'var(--prime)', border: '1px solid var(--prime)' },
  }
  const cfg = configs[level]
  return (
    <button
      onClick={onReveal}
      style={{
        alignSelf: 'flex-start',
        fontSize: '12px', fontWeight: 600, padding: '7px 16px',
        background: cfg.bg, color: cfg.color, border: cfg.border,
        borderRadius: '6px', cursor: 'pointer',
        fontFamily: "'Space Grotesk', sans-serif",
        transition: 'opacity 0.15s',
      }}
    >
      {cfg.label}
    </button>
  )
}
