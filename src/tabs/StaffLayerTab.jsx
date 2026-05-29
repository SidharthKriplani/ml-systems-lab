import { useState, useEffect } from 'react'
import { trackModuleComplete } from '../analytics'

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
  'ML Necessity': 'var(--gold)',
}

const SCENARIOS = [
  {
    id: 's1',
    title: "A model's A/B test shows p=0.03 lift.",
    domain: 'Experiment Design',
    ic3: "Check practical significance — is the effect size meaningful? Confirm minimum runtime was met and no segment regressions. Get PM alignment on the effect size, then ship with standard monitoring.",
    ic5: 'Check: multiple comparisons? Practical significance? Segment breakdowns? Minimum runtime met? CUPED applied? If all good, recommend shipping with monitoring.',
    staff: "Challenge the metric selection. Is completion rate the right proxy? Any guardrail violations? Network effects? Longer-term holdback needed? What's the cost of being wrong — can we roll back fast? Statistical significance is necessary but not sufficient. Write the rollout criteria before touching the p-value.",
  },
  {
    id: 's2',
    title: 'Production model accuracy dropped 3% overnight.',
    domain: 'MLOps',
    ic3: "Check recent data pipeline runs for failures or schema changes. If data looks healthy, retrain on the last 30 days and redeploy. Alert the team.",
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
  {
    id: 'ml_need_1',
    title: 'PM wants an ML churn model to decide who receives a retention email.',
    domain: 'ML Necessity',
    ic3: 'Build a churn classifier. Score users nightly, send retention email to the top-risk decile. Use logistic regression or gradient boosting on engagement features.',
    ic5: "Counterfactual first: what happens if we send to everyone? Email is cheap — calculate send cost vs. churn revenue at stake. Model earns its place only if (a) channel is capacity-constrained, (b) emails annoy non-churners and drive unsubscribes, or (c) personalization materially changes conversion. Socratic questions: 'What's the cost per email vs. the LTV of a retained user?', 'Does emailing non-churners hurt us?', 'Does the message change based on churn risk, or is it one template?'",
    staff: "Verdict: ML not justified unless you can answer yes to at least one of the three conditions above. The model only adds value if the action branches on the prediction. If the email is identical for everyone, you're training a classifier to sort a list you could just send in full. Start with a blanket send. A/B test the email itself. Measure unsubscribe rate on non-churners. If unsubscribes are material, now you have a business case for targeting. Until then, the model is cost and delay with no incremental upside. Revisit when personalization (different offer tiers, different channels) is on the table.",
  },
  {
    id: 'ml_need_2',
    title: 'Support team wants ML to auto-categorize tickets into 8 buckets. Current volume: 2 tickets/day.',
    domain: 'ML Necessity',
    ic3: 'Fine-tune a text classifier on historical tickets with a confidence threshold for human fallback. Deploy to the ticketing system via webhook.',
    ic5: "Volume math first: 2 tickets/day = 730/year. Human triage at 30 seconds each = 6 hours of work per year. ML requires: label curation, training, deployment, monitoring, retraining on drift. Socratic questions: 'How many tickets per day?', 'What's the human triage time per ticket?', 'What miscategorization rate is acceptable?', 'Do categories change over time?'",
    staff: "Verdict: ML not justified at this volume. Maintenance cost dominates benefit by a wide margin. Six hours of annual human work is not a bottleneck — it's a rounding error. Regex + keyword routing covers 90% of cases with zero ongoing cost and is fully auditable when a routing decision is disputed. Define the volume inflection point upfront: ML makes sense above roughly 500 tickets/day where human triage becomes a full-time role. Set that threshold in writing, track ticket growth, and revisit when you hit it. Don't build infrastructure for a problem that doesn't exist yet.",
  },
  {
    id: 'ml_need_3',
    title: 'Security wants an ML fraud detection model. Platform fraud rate: 0.001% (1 in 100,000 transactions).',
    domain: 'ML Necessity',
    ic3: 'Train a binary classifier with class imbalance handling — SMOTE, class weights, focal loss. Optimize for recall at a fixed false positive budget.',
    ic5: "Base rate math: at 0.001% and 99% precision, false positives still outnumber true positives. Calculate expected FP volume at actual traffic before any modeling. Socratic questions: 'What's the false positive cost — blocked legitimate transaction, support ticket, chargeback dispute?', 'Can you enumerate the current fraud patterns?', 'What does a rules engine miss that ML would catch?'",
    staff: "Verdict: ML as layer 2 only — not as the primary system. A rules engine (velocity checks, IP geolocation, device fingerprinting, card BIN patterns) catches 80–90% of fraud patterns explicitly, costs nothing to operate, and is fully explainable when a customer disputes a block. That matters: card network dispute processes require you to document the blocking reason. An ML model score is not a valid dispute reason. Build the rules layer first. Measure residual fraud that rules miss. That residual — the adversarial, adaptive, long-tail patterns — is where ML earns its place. Sequence matters: rules → measure residual → ML on the residual.",
  },
  {
    id: 'ml_need_4',
    title: 'PM wants an AI-powered recommendation engine to increase basket size. Catalog: 50 SKUs.',
    domain: 'ML Necessity',
    ic3: 'Build a collaborative filtering model or deploy a vector similarity recommender. Embed product features and user purchase history.',
    ic5: "Interaction matrix density check: with 50 SKUs, how many user-item interactions do you have per SKU? Collaborative filtering needs hundreds of interactions per item to learn meaningful associations. Content-based filtering on 50 items degenerates to category affinity. Socratic questions: 'How many interactions per SKU?', 'Can a merchant write the cross-sell rules manually?', 'What's the catalog growth trajectory — will it still be 50 SKUs in 12 months?'",
    staff: "Verdict: ML not justified at this catalog size. Collaborative filtering has no signal when the interaction matrix is near-empty per item — it will surface random or popularity-dominated results and look no better than a 'trending' list. Content-based filtering on 50 items is just category lookup dressed up as ML. A merchant can write 'frequently bought together' rules in an afternoon; those rules will match or beat any model you train. The engineering and maintenance cost is pure waste. Revisit when catalog exceeds 500 items with at least 100 interactions per item — at that scale, the interaction matrix has enough density for collaborative filtering to find non-obvious associations a human wouldn't write.",
  },
  {
    id: 'ed_2',
    title: "Your A/B test shows a 4% lift but the SRM check flags p=0.001.",
    domain: 'Experiment Design',
    ic3: "The SRM is probably a fluke — the lift is real, p < 0.05. Ship it and monitor.",
    ic5: "SRM (Sample Ratio Mismatch) invalidates the experiment. Do not read the metric results. Diagnose the cause first: bot traffic filtering asymmetry, logging bugs, assignment bucketing errors, or cache layer differences between variants. Fix and re-run.",
    staff: "SRM is a data integrity failure, not a statistical quirk. Any metric result from a mis-randomized experiment is uninterpretable — even the direction of lift is unreliable. The right call is to declare the experiment invalid, write up the root cause, and fix the randomization before re-running. The organizational risk: if you ship on a flawed experiment and the lift doesn't hold, you've lost credibility for the next five experiments. Treat SRM as a hard stop, not a soft warning. Add SRM checks to your pre-analysis checklist and gate results behind it automatically.",
  },
  {
    id: 'ed_3',
    title: "An experiment shows strong 7-day lift but the effect disappears by day 30.",
    domain: 'Experiment Design',
    ic3: "The experiment worked initially — ship the feature and monitor long-term retention separately.",
    ic5: "Novelty effect: users engage with new UI out of curiosity, not because it's better. 7-day window captures the novelty bump, not steady-state behavior. Hold the experiment until behavior stabilizes — typically 2-4 weeks for habit-forming features. Check if the effect decays monotonically or plateaus.",
    staff: "Novelty effect is a systematic bias, not a measurement error. The real question is: what's the steady-state effect size, and does it justify the shipping cost? If the feature costs nothing to maintain and even a 1% retained lift has positive NPV, ship with eyes open. If the feature has ongoing infra cost, you need a credible long-run estimate — either a longer holdback or a historical comparison against similar features. Document the novelty decay curve so future experiments in this surface have a baseline to compare against. Never cite 7-day lift for a long-term retention claim.",
  },
  {
    id: 'ed_4',
    title: "PM wants to run 12 simultaneous A/B tests on the same user population to move faster.",
    domain: 'Experiment Design',
    ic3: "Run them all — more experiments means faster learning. Just make sure each has p < 0.05.",
    ic5: "Multiple simultaneous experiments risk interaction effects if they touch overlapping surfaces. Use orthogonal layer design: experiments that modify independent parts of the stack (ranking vs UI vs notifications) can safely run in parallel. Experiments that touch the same user decision point cannot — they confound each other. Also: 12 tests at α=0.05 → expected 0.6 false positives by chance alone.",
    staff: "The velocity vs integrity tradeoff is real but usually the right answer is layered experimentation with explicit interaction checks, not serialization. Design the experiment taxonomy first: which layers are independent (ranking, UI, push, email, pricing), then run one experiment per layer per user simultaneously. The 12 tests problem is usually a product of not having a layered system — fix the infrastructure, not the experiment count. For the multiple comparisons risk: pre-register your primary metric per experiment and treat secondary metrics as exploratory. One primary metric per experiment, pre-registered, no peeking.",
  },
  {
    id: 'ed_5',
    title: "A social feature experiment shows lift in the treatment group but the control group's metrics also improved.",
    domain: 'Experiment Design',
    ic3: "Both groups improved — the feature works. Ship it.",
    ic5: "SUTVA violation: the Stable Unit Treatment Value Assumption is broken. Treated users interact with control users on the social graph, spreading the effect. Standard A/B testing assumes no interference between units. The measured lift is underestimated (spillover dilutes the control vs treatment difference).",
    staff: "Network interference means your experiment is measuring the wrong thing. The true effect size is larger than measured — control users benefited from treated neighbors. For social features, the right randomization unit is a cluster (friend group, geographic cluster, device type) not an individual user. Switch to cluster-based randomization: assign entire clusters to one variant so within-cluster spillover is contained and between-cluster comparisons remain valid. This reduces statistical power (fewer independent units) but gives you an unbiased estimate. The alternative — individual randomization knowing SUTVA is violated — systematically underestimates lift and may cause you to kill features that work.",
  },
  {
    id: 'fe_2',
    title: "After a major product redesign, model performance degrades sharply. The feature pipeline is unchanged.",
    domain: 'Feature Engineering',
    ic3: "Retrain the model on post-redesign data. The model just needs to see the new patterns.",
    ic5: "Covariate shift: P(X) changed because user behavior changed with the redesign. Features that were predictive before (e.g., session duration, click patterns) now have different distributions and different relationships to the label. Before retraining: check PSI on every feature. Features with PSI > 0.25 are suspects. Check if the label definition is still valid — did the redesign change what 'conversion' means?",
    staff: "This is a feature validity audit, not just a retraining trigger. The question is: which features survived the redesign (still predictive, same distribution) and which are broken (distribution shifted, relationship to label changed, or definition no longer maps to user reality)? Run a feature-by-feature PSI scan. Deprecate features that shifted beyond recovery. For features that shifted but are still conceptually valid, check whether the relationship to the label held (train a single-feature model pre and post redesign — did the AUC hold?). Retrain only after you've validated that your feature set is still coherent. Retraining on bad features gives you a confidently wrong model.",
  },
  {
    id: 'fe_3',
    title: "A new feature shows 0.8 correlation with the label in offline evaluation but adds no lift in the A/B test.",
    domain: 'Feature Engineering',
    ic3: "The feature must not be generalizing — try regularization or feature selection to reduce overfitting.",
    ic5: "High correlation with label in offline eval but zero online lift is the signature of label leakage or a feature that captures a downstream consequence of the label rather than a cause. Check: is this feature computed using information that wouldn't be available at prediction time? Is the timestamp on the feature data correct? Run a point-in-time audit.",
    staff: "0.8 correlation with zero online lift is almost always leakage — the feature is a consequence of the event you're trying to predict, not a precursor. The offline eval looks great because in historical data the feature value was recorded after the outcome. At serving time, the outcome hasn't happened yet, so the feature contains no signal. The fix: enforce strict point-in-time correctness in your feature join — for each training example (entity, event_timestamp), join feature values at max(feature_timestamp) ≤ event_timestamp. Then re-evaluate the feature offline with the corrected join. If the correlation drops to near-zero, the feature is pure leakage. If it drops but stays meaningful, you had partial leakage. Document this in your feature store's feature card — future engineers will try to add this feature again.",
  },

]

function initReveals() {
  try {
    const saved = JSON.parse(localStorage.getItem(REVEALS_KEY))
    if (saved && typeof saved === 'object') return saved
  } catch {}
  return {}
}

export default function StaffLayerTab({ onNavigate }) {
  const [reveals, setReveals] = useState(initReveals)
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    localStorage.setItem(REVEALS_KEY, JSON.stringify(reveals))
  }, [reveals])

  function revealLevel(id, level) {
    setReveals(prev => ({ ...prev, [id]: level }))
    if (level === 3) trackModuleComplete('staff_scenario', 'staff', id)
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
    <div style={{ padding: '24px', maxWidth: '920px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--ink-hi)' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Senior / Staff Layer</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-mid)', fontSize: '13px' }}>The same problem through IC3 → IC5 → Staff eyes</p>
          <span style={{ display: 'inline-block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--prime)', border: '1px solid rgba(240,165,0,0.35)', borderRadius: 4, padding: '0.15rem 0.5rem', marginTop: '6px', letterSpacing: '0.04em' }}>~ Simulated</span>
        </div>
        <button
          onClick={() => { setReveals({}); setExpanded(new Set()); }}
          style={{
            background: 'var(--surface)',
            color: 'var(--ink-low)',
            border: '1px solid var(--rim)',
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          ↺ Reset reveals
        </button>
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
                      bgColor="rgba(240,165,0,0.11)"
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
    1: { label: 'Reveal IC5', bg: 'rgba(34,211,238,0.15)', color: 'var(--sky)', border: '1px solid var(--sky)' },
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
        fontFamily: 'var(--font-sans)',
        transition: 'opacity 0.15s',
      }}
    >
      {cfg.label}
    </button>
  )
}
