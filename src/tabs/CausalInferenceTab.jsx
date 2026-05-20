import { useState } from 'react'

// ── Causal vs Predictive Diagnosis ───────────────────────────────────────────
const CAUSAL_SCENARIOS = [
  {
    id: 'churn',
    scenario: 'A product team asks: "Which users are most likely to churn next month?" They want to send a discount to at-risk users.',
    options: ['Predictive modeling', 'Causal inference'],
    correct: 1,
    answer: 'Causal inference — specifically, you need to estimate the effect of sending a discount, not just predict who churns. A predictive model identifies at-risk users but tells you nothing about whether the discount will work. Users who churn regardless get free discounts. Users who would have stayed anyway get unnecessary discounts. You need to estimate the ITT (intention-to-treat) effect via experiment or uplift modeling.',
    method: 'Uplift modeling (meta-learners: T-learner, S-learner, X-learner) or randomized experiment with CUPED variance reduction.',
    trap: 'Sending discounts to the top-N predicted churners is the classic mistake. Prediction ≠ intervention effect.',
  },
  {
    id: 'recrank',
    scenario: 'You want to know: does showing users more diverse recommendations lead to higher long-term retention?',
    options: ['Predictive modeling', 'Causal inference'],
    correct: 1,
    answer: 'Causal inference. You want to measure the effect of an intervention (diversity) on an outcome (retention). Observational data will confound this — users who prefer diverse content differ systematically from users who prefer narrow content. You need either an A/B test or a quasi-experimental design.',
    method: 'Randomized A/B experiment is cleanest. If you can\'t randomize, use DiD if you have a policy change that affected some users and not others.',
    trap: 'Regressing retention on diversity scores from logs will find correlation but the direction of causality is unclear (retention → engagement → diverse behavior is plausible).',
  },
  {
    id: 'fraud_features',
    scenario: 'You want to build a system that scores every transaction 0–1 for fraud probability in real time.',
    options: ['Predictive modeling', 'Causal inference'],
    correct: 0,
    answer: 'Predictive modeling. You want to rank transactions by fraud likelihood — a supervised classification problem. You\'re not asking "what caused this fraud" or "what would happen if we intervened." You\'re asking "given these features right now, what is the probability this is fraud?"',
    method: 'GBM or neural net on labeled transaction data. Key: time-ordered train/test split, PSI monitoring, threshold tuning for precision/recall tradeoff.',
    trap: 'Be careful — if you later want to evaluate whether a new rule reduces fraud, that\'s a causal question. Prediction answers "is this fraud?" Causation answers "did this intervention reduce fraud?"',
  },
  {
    id: 'salary',
    scenario: 'An HR team wants to understand: does getting a performance bonus cause employees to stay longer?',
    options: ['Predictive modeling', 'Causal inference'],
    correct: 1,
    answer: 'Causal inference. The question is explicitly about effect of an intervention. With observational data, high performers receive both bonuses and are more likely to stay for unrelated reasons — massive confounding. Without accounting for this, you\'ll over-estimate the effect of bonuses.',
    method: 'Ideal: randomized experiment. Feasible alternative: propensity score matching to create comparable treated/control groups, or regression discontinuity if there\'s a sharp bonus threshold.',
    trap: 'Naive regression of tenure on bonus receipt will be heavily confounded by performance, manager quality, team culture — all correlated with both bonus likelihood and retention.',
  },
  {
    id: 'ltv_predict',
    scenario: 'Sales wants: "Score all current trials by predicted 90-day LTV so we can prioritize which accounts to call."',
    options: ['Predictive modeling', 'Causal inference'],
    correct: 0,
    answer: 'Predictive modeling. The goal is ranking and prioritization based on predicted future value — a regression problem. No intervention effect is being measured. Sales calls all high-LTV accounts; whether calling them changes their LTV is a separate causal question.',
    method: 'Gradient boosted regression on historical trial cohorts. Features: usage signals, firmographics, engagement velocity. Evaluate with calibration + rank correlation.',
    trap: 'If sales later asks "does our outreach actually increase LTV?" — that\'s causal. But the scoring task itself is purely predictive.',
  },
  {
    id: 'email_open',
    scenario: 'You notice that users who open your onboarding emails have 40% higher day-30 retention. The team says "great, let\'s send more onboarding emails."',
    options: ['Predictive modeling', 'Causal inference'],
    correct: 1,
    answer: 'Causal inference — and the team\'s reasoning is wrong. Email opens are a proxy for user engagement and intent. Users who open emails are already more motivated — they would have higher retention even without the email. Sending more emails to disengaged users won\'t replicate the correlation. You need to measure the effect of sending (not opening) emails, via an experiment.',
    method: 'Randomized send/no-send experiment. Analyze by intent-to-treat (sent vs not sent), not by open rate. Use CUPED on pre-experiment engagement to reduce variance.',
    trap: 'Conditioning on email opens is conditioning on a post-treatment variable — classic selection bias. The 40% lift is not the causal effect of sending emails.',
  },
  {
    id: 'ad_targeting',
    scenario: 'You want to build a model that predicts which ad creative (A or B) a given user is more likely to click.',
    options: ['Predictive modeling', 'Causal inference'],
    correct: 0,
    answer: 'Predictive modeling — specifically a contextual bandit or multi-arm recommendation. Given user features, predict which creative maximizes expected click. This is not a causal question about why users click; it\'s a preference prediction problem.',
    method: 'Contextual bandit (LinUCB, Thompson sampling) or offline-trained classifier with epsilon-greedy exploration. Evaluate with IPS (inverse propensity score) for offline policy evaluation.',
    trap: 'If you want to ask "does creative A cause more purchases downstream vs creative B?" — that\'s causal. If you just want to maximize immediate clicks, prediction is fine.',
  },
  {
    id: 'price_elasticity',
    scenario: 'Finance wants to know: if we reduce price by 10%, how much will demand increase?',
    options: ['Predictive modeling', 'Causal inference'],
    correct: 1,
    answer: 'Causal inference — price elasticity is fundamentally a causal quantity. You want the counterfactual: what demand would be at a different price, holding everything else constant. Observational data is heavily confounded (prices change during promotions, which affect demand independently; prices are higher in peak periods when demand is naturally higher).',
    method: 'Randomized price experiment (gold standard). Alternatively: instrumental variables (use wholesale cost changes as IV for price), or DiD around a regional price change.',
    trap: 'Regressing demand on price from historical data gives you a biased estimate. In most markets, you\'ll see positive price-demand correlation in the raw data (prices are higher when demand is high), which is the opposite of elasticity.',
  },
]

// ── Identification Strategy Selector ─────────────────────────────────────────
const IDENTIFICATION_SCENARIOS = [
  {
    id: 'rct',
    situation: 'You can randomly assign users to treatment and control groups with no interference between groups.',
    constraints: 'Budget available, users are independent (no network effects), treatment rollout is feasible.',
    strategy: 'Randomized Controlled Trial (A/B Test)',
    strength: 'Gold standard — unbiased estimate of ATE with no assumptions about confounders.',
    when_breaks: 'When treatment and control users interact (network effects — one user\'s behavior affects another\'s). Also fails when the randomization unit is wrong (randomizing sessions instead of users creates cross-contamination).',
    accent: 'var(--mint)',
  },
  {
    id: 'did',
    situation: 'A policy changed for one group but not another, and you have pre/post data for both.',
    constraints: 'Cannot randomize. Have historical data. Treatment was applied to a defined group at a specific time.',
    strategy: 'Difference-in-Differences (DiD)',
    strength: 'Controls for time-invariant confounders and secular trends. Does not require perfect matching.',
    when_breaks: 'When the parallel trends assumption fails — i.e., the treatment and control groups were trending differently before the policy change. Always plot pre-treatment trends to verify.',
    accent: 'var(--sky)',
  },
  {
    id: 'psm',
    situation: 'Treatment was self-selected (users opted in) but you have rich pre-treatment covariates for everyone.',
    constraints: 'Observational data only. No clear policy cutoff. Assignment was based on observable characteristics.',
    strategy: 'Propensity Score Matching / Weighting (IPW)',
    strength: 'Creates a pseudo-randomized comparison group. Handles many observed confounders simultaneously.',
    when_breaks: 'Unobserved confounders — variables that affected both treatment selection and the outcome but weren\'t in your data. This is the fundamental limitation: you can only control for what you measured.',
    accent: 'var(--violet)',
  },
  {
    id: 'iv',
    situation: 'An external factor (instrument) affected treatment take-up but has no direct effect on the outcome.',
    constraints: 'Can\'t randomize. Treatment is endogenous. But you can find a valid instrument.',
    strategy: 'Instrumental Variables (IV)',
    strength: 'Can identify causal effects even with unobserved confounding, if the instrument is valid.',
    when_breaks: 'If the instrument is weak (low F-statistic < 10) or has a direct effect on the outcome (exclusion restriction violated). Bad instruments give worse estimates than no instrument at all.',
    accent: 'var(--ember)',
  },
  {
    id: 'rdd',
    situation: 'Treatment was assigned based on a score crossing a threshold (e.g., users above score 70 get premium; below get standard).',
    constraints: 'Sharp or fuzzy discontinuity in treatment assignment around a known cutoff.',
    strategy: 'Regression Discontinuity Design (RDD)',
    strength: 'Identifies local causal effect at the cutoff with minimal assumptions. No need for explicit counterfactual.',
    when_breaks: 'When units can manipulate their score to just above/below the threshold (density test: McCrary density test). Also: effect is only identified locally at the cutoff — external validity to other points on the score is an assumption.',
    accent: 'var(--rose)',
  },
  {
    id: 'synth',
    situation: 'A policy was applied to a single unit (one country, one city, one business unit) and you want to construct a counterfactual.',
    constraints: 'Only one treated unit. Panel data with several pre-treatment periods for a donor pool of untreated units.',
    strategy: 'Synthetic Control',
    strength: 'Constructs a weighted average of untreated units that best matches the treated unit pre-treatment. Transparent and auditable.',
    when_breaks: 'When the treated unit has no good match in the donor pool. When there are too few pre-treatment periods to fit the synthetic control. Does not scale well to many treated units.',
    accent: 'var(--gold)',
  },
]

// ── Confounder or Collider ────────────────────────────────────────────────────
const DAG_SCENARIOS = [
  {
    id: 'conf1',
    q: 'You are studying whether ice cream sales cause drowning deaths. Ice cream sales and drowning are positively correlated. What is the confounding variable?',
    options: ['Temperature / Season', 'Location (coastal vs inland)', 'Age of buyers', 'Marketing spend'],
    correct: 0,
    answer: 'Temperature is the confounder — it causes both more ice cream sales and more swimming (and drowning). Both variables have a common cause. If you control for temperature, the association between ice cream and drowning disappears.',
    type: 'confounder',
    lesson: 'Classic common-cause confounder. Both X and Y have a third cause Z. Control for Z, correlation disappears.',
  },
  {
    id: 'conf2',
    q: 'You study whether taking a painkiller causes faster recovery. But sick people are more likely to take painkillers AND recover more slowly. What variable should you control for?',
    options: ['Illness severity', 'Age', 'Doctor quality', 'Time of day'],
    correct: 0,
    answer: 'Illness severity confounds the relationship. Sicker people take more painkillers and also take longer to recover — even if painkillers have zero effect, you\'d see a negative correlation between taking them and recovery speed. Control for illness severity (e.g., via stratification or matching).',
    type: 'confounder',
    lesson: 'Selection into treatment is correlated with the outcome. This is why observational drug studies are hard — sick people self-select into treatment.',
  },
  {
    id: 'coll1',
    q: 'You study whether coding ability causes job offers. You sample only from people who were interviewed at top tech companies. Coding ability and job offers seem weakly correlated. Is something wrong?',
    options: ['You\'re conditioning on a collider (interview invitation)', 'The sample size is too small', 'Coding ability is mismeasured', 'There is no confounding here'],
    correct: 0,
    answer: 'Collider bias. "Got an interview" is caused by BOTH coding ability AND other factors (referrals, connections, strong portfolio). By restricting to interviewed people, you\'ve conditioned on this collider. Within the interviewed population, high coding ability and strong connections are negatively correlated (you can get in without great coding if you have connections), masking the real positive causal effect.',
    type: 'collider',
    lesson: 'Conditioning on a collider opens a spurious association between its causes. Never restrict your sample on a variable that is caused by your treatment or outcome.',
  },
  {
    id: 'conf3',
    q: 'You study whether using a feature store improves ML model performance. Teams with larger ML budgets both adopt feature stores and build better models. What is the confounder?',
    options: ['ML team budget / maturity', 'Feature store vendor', 'Number of models', 'Model framework (PyTorch vs sklearn)'],
    correct: 0,
    answer: 'ML team maturity/budget is the confounder. Mature teams both adopt tooling like feature stores AND build better models for many reasons. Even if feature stores had zero effect, you\'d see a positive correlation in observational data. To estimate the true effect, you\'d need to control for team maturity — or run an experiment.',
    type: 'confounder',
    lesson: 'Survivorship / maturity bias is pervasive in tech observational studies. Companies that adopt best practices also have better teams. Disentangling the tool effect from the team effect requires causal methods.',
  },
  {
    id: 'med1',
    q: 'You study whether exercise causes lower blood pressure. Exercise reduces weight, and lower weight reduces blood pressure. You include weight in your regression. What did you just do?',
    options: ['Controlled for a mediator — this blocks part of the causal path', 'Correctly removed a confounder', 'Added instrumental variable', 'Reduced multicollinearity'],
    correct: 0,
    answer: 'You controlled for a mediator, which is a mistake if you want the total effect of exercise. Weight is ON the causal path from exercise to blood pressure (exercise → weight → BP). Controlling for it gives you only the direct effect of exercise (bypassing weight), not the total effect. This is called "over-controlling" or "mediator bias."',
    type: 'mediator',
    lesson: 'Mediators are different from confounders. Control for confounders (common causes); do NOT control for mediators if you want the total causal effect. Mediators are on the causal path from treatment to outcome.',
  },
  {
    id: 'conf4',
    q: 'You want to estimate whether having a PhD causes higher ML engineer salaries. But PhD holders tend to work at research labs vs product companies, which have different pay scales. What should you do?',
    options: ['Control for company type — it confounds both PhD likelihood and salary', 'Do not control for company type — it is a mediator on the causal path', 'Both are equally valid', 'Neither — just use raw salary comparison'],
    correct: 1,
    answer: 'Company type is likely a mediator (PhD → works at research lab → higher salary) AND partially a confounder. This is the classic mediation/confounding ambiguity. If you control for company type, you block part of the causal path (the PhD advantage that comes from working at better-paying places). If you want the total effect of a PhD on salary, do NOT control for company type. If you want only the direct effect beyond career path selection, then control for it — but be explicit about which question you\'re answering.',
    type: 'mediator/confounder',
    lesson: 'Some variables are both mediator and confounder depending on the causal structure. Always draw the DAG explicitly before deciding what to control for. The question "what is the total effect?" and "what is the direct effect?" require different adjustment sets.',
  },
]

// ── Components ────────────────────────────────────────────────────────────────
function CausalVsPredictive() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const s = CAUSAL_SCENARIOS[idx]

  function pick(i) {
    if (revealed) return
    setPicked(i)
  }

  function reveal() {
    if (picked === null) return
    setRevealed(true)
    if (picked === s.correct) setScore(sc => sc + 1)
  }

  function next() {
    if (idx < CAUSAL_SCENARIOS.length - 1) {
      setIdx(i => i + 1)
      setPicked(null)
      setRevealed(false)
    } else {
      setDone(true)
    }
  }

  if (done) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--rim)' }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--sky)', marginBottom: '8px' }}>{score}/{CAUSAL_SCENARIOS.length}</div>
        <div style={{ fontSize: '14px', color: 'var(--ink-low)', marginBottom: '20px' }}>
          {score >= 7 ? 'Strong causal reasoning. You distinguish prediction from inference correctly.' : score >= 5 ? 'Solid foundation. Review the scenarios you missed — the framing of the question is the key signal.' : 'The hardest part is seeing that "predictive" questions can hide causal assumptions. Work through each trap explanation.'}
        </div>
        <button className="btn-primary" onClick={() => { setIdx(0); setPicked(null); setRevealed(false); setScore(0); setDone(false) }}>Try again</button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)' }}>Scenario {idx + 1} of {CAUSAL_SCENARIOS.length}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--sky)' }}>{score} correct</span>
      </div>

      <div className="card" style={{ padding: '24px 28px', border: '1px solid var(--rim)' }}>
        <div style={{ fontSize: '10px', color: 'var(--sky)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>The ask</div>
        <p style={{ fontSize: '14px', color: 'var(--ink-hi)', lineHeight: 1.75, margin: 0 }}>{s.scenario}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {s.options.map((opt, i) => {
          const isCorrect = i === s.correct
          const isPicked = i === picked
          let border = 'var(--rim)', bg = 'transparent', color = 'var(--ink-mid)'
          if (revealed) {
            if (isCorrect) { border = 'rgba(52,211,153,0.5)'; bg = 'rgba(52,211,153,0.07)'; color = 'var(--mint)' }
            else if (isPicked && !isCorrect) { border = 'rgba(244,63,94,0.5)'; bg = 'rgba(244,63,94,0.07)'; color = 'var(--rose)' }
          } else if (isPicked) {
            border = 'rgba(34,211,238,0.5)'; bg = 'rgba(34,211,238,0.07)'; color = 'var(--sky)'
          }
          return (
            <button key={i} onClick={() => pick(i)} disabled={revealed}
              style={{ padding: '16px', borderRadius: '10px', border: `1px solid ${border}`, background: bg, color, fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px', fontWeight: 600, cursor: revealed ? 'default' : 'pointer', transition: 'all 0.15s', textAlign: 'center' }}>
              {opt}
            </button>
          )
        })}
      </div>

      {!revealed && (
        <button className="btn-primary" onClick={reveal} disabled={picked === null}>Reveal answer</button>
      )}

      {revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '20px', border: `1px solid ${picked === s.correct ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`, background: picked === s.correct ? 'rgba(52,211,153,0.04)' : 'rgba(244,63,94,0.04)' }}>
            <div style={{ fontSize: '10px', color: picked === s.correct ? 'var(--mint)' : 'var(--rose)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{picked === s.correct ? 'Correct' : 'Incorrect'}</div>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0, marginBottom: '12px' }}>{s.answer}</p>
            <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--rim)' }}>
              <span style={{ fontSize: '10px', color: 'var(--sky)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Method: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.method}</span>
            </div>
            <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(244,63,94,0.04)', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.15)' }}>
              <span style={{ fontSize: '10px', color: 'var(--rose)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Common trap: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.trap}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={next}>{idx < CAUSAL_SCENARIOS.length - 1 ? 'Next scenario →' : 'See results'}</button>
        </div>
      )}
    </div>
  )
}

function IdentificationStrategies() {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0 }}>
        Six identification strategies for causal inference. Each is appropriate for specific data conditions. Click a strategy to see when it works and when it breaks.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {IDENTIFICATION_SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setSelected(selected === s.id ? null : s.id)}
            style={{ textAlign: 'left', padding: '18px 20px', borderRadius: '12px', border: `1px solid ${selected === s.id ? s.accent + '50' : 'var(--rim)'}`, background: selected === s.id ? s.accent + '08' : 'var(--depth)', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '14px', color: selected === s.id ? s.accent : 'var(--ink-hi)', marginBottom: '6px' }}>{s.strategy}</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{s.situation}</p>
          </button>
        ))}
      </div>
      {selected && (() => {
        const s = IDENTIFICATION_SCENARIOS.find(x => x.id === selected)
        return (
          <div className="card" style={{ padding: '24px 28px', border: `1px solid ${s.accent}30`, background: s.accent + '06' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '16px', color: s.accent, marginBottom: '16px' }}>{s.strategy}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--mint)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>When to use</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{s.constraints}</p>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--rose)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>When it breaks</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{s.when_breaks}</p>
              </div>
            </div>
            <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--rim)' }}>
              <span style={{ fontSize: '10px', color: s.accent, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Strength: </span>
              <span style={{ fontSize: '12.5px', color: 'var(--ink-low)' }}>{s.strength}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function ConfounderOrCollider() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const s = DAG_SCENARIOS[idx]

  function pick(i) { if (!revealed) setPicked(i) }

  function reveal() {
    if (picked === null) return
    setRevealed(true)
    if (picked === s.correct) setScore(sc => sc + 1)
  }

  function next() {
    if (idx < DAG_SCENARIOS.length - 1) {
      setIdx(i => i + 1); setPicked(null); setRevealed(false)
    } else { setDone(true) }
  }

  const TYPE_COLORS = { confounder: 'var(--ember)', collider: 'var(--violet)', mediator: 'var(--sky)', 'mediator/confounder': 'var(--gold)' }

  if (done) return (
    <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--sky)', marginBottom: '8px' }}>{score}/{DAG_SCENARIOS.length}</div>
      <p style={{ fontSize: '14px', color: 'var(--ink-low)', marginBottom: '20px' }}>
        {score >= 5 ? 'Solid DAG intuition.' : 'Focus on the mediator vs confounder distinction — that\'s where most practitioners go wrong.'}
      </p>
      <button className="btn-primary" onClick={() => { setIdx(0); setPicked(null); setRevealed(false); setScore(0); setDone(false) }}>Try again</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {DAG_SCENARIOS.length}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--sky)' }}>{score} correct</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['confounder','collider','mediator'].map(t => (
          <span key={t} style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '999px', background: TYPE_COLORS[t] + '15', color: TYPE_COLORS[t], fontFamily: "'JetBrains Mono',monospace", border: `1px solid ${TYPE_COLORS[t]}30` }}>{t}</span>
        ))}
      </div>
      <div className="card" style={{ padding: '24px 28px' }}>
        <p style={{ fontSize: '14px', color: 'var(--ink-hi)', lineHeight: 1.75, margin: 0 }}>{s.q}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {s.options.map((opt, i) => {
          const isCorrect = i === s.correct
          const isPicked = i === picked
          let border = 'var(--rim)', bg = 'transparent', color = 'var(--ink-mid)'
          if (revealed) {
            if (isCorrect) { border = 'rgba(52,211,153,0.5)'; bg = 'rgba(52,211,153,0.06)'; color = 'var(--mint)' }
            else if (isPicked) { border = 'rgba(244,63,94,0.5)'; bg = 'rgba(244,63,94,0.06)'; color = 'var(--rose)' }
          } else if (isPicked) { border = 'rgba(34,211,238,0.5)'; bg = 'rgba(34,211,238,0.06)'; color = 'var(--sky)' }
          return (
            <button key={i} onClick={() => pick(i)} disabled={revealed}
              style={{ padding: '13px 16px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {opt}
            </button>
          )
        })}
      </div>
      {!revealed && <button className="btn-primary" onClick={reveal} disabled={picked === null}>Reveal</button>}
      {revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '20px', border: `1px solid ${TYPE_COLORS[s.type]}30`, background: TYPE_COLORS[s.type] + '06' }}>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: TYPE_COLORS[s.type] + '20', color: TYPE_COLORS[s.type], fontFamily: "'JetBrains Mono',monospace", display: 'inline-block', marginBottom: '10px' }}>{s.type}</span>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0, marginBottom: '12px' }}>{s.answer}</p>
            <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--rim)' }}>
              <span style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>Lesson: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.lesson}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={next}>{idx < DAG_SCENARIOS.length - 1 ? 'Next →' : 'See results'}</button>
        </div>
      )}
    </div>
  )
}

// ── Backdoor Criterion ────────────────────────────────────────────────────────
const BACKDOOR_SCENARIOS = [
  {
    id: 'bd1',
    dag: 'Z → X → Y\nZ ────→ Y',
    question: 'Z causes both X (treatment) and Y (outcome). You want the causal effect of X on Y. Should you control for Z?',
    options: [
      'Yes — Z is a confounder, controlling for it blocks the backdoor path X ← Z → Y',
      'No — Z is on the causal path from X to Y (mediator)',
      'No — Z is a collider, conditioning would create bias',
      'It doesn\'t matter since X→Y has a direct path',
    ],
    correct: 0,
    answer: 'Z is a confounder: it causes both treatment X and outcome Y, opening the backdoor path X ← Z → Y. This path injects spurious association. Controlling for Z blocks it and isolates the X → Y causal effect. This is the textbook application of the backdoor criterion.',
    lesson: 'Rule: any variable that causes both treatment and outcome is a confounder. You must control for it (or match on it) to identify the causal effect.',
    nodeType: 'confounder',
  },
  {
    id: 'bd2',
    dag: 'X → M → Y\n(M is the only path from X to Y)',
    question: 'M lies between X and Y and is the only mechanism through which X affects Y. You want the TOTAL causal effect of X. Should you control for M?',
    options: [
      'Yes — M lies between X and Y and should be blocked',
      'No — controlling for M blocks the only causal path, making X appear to have zero effect',
      'Yes — M confounds the X→Y relationship',
      'Depends on how strongly M correlates with Y',
    ],
    correct: 1,
    answer: 'M is a mediator — it is ON the causal path from X to Y. Controlling for it blocks the very mechanism you are estimating. The model will then show X has zero total effect (because you\'ve absorbed all of X\'s effect into M). For the total causal effect, never control for mediators. For the direct effect only (X→Y bypassing M), you would control for M — but that\'s a different question.',
    lesson: 'Confounders are common causes — control them. Mediators are on the causal path — don\'t control for total effect. The classic mistake is misidentifying a mediator as a confounder.',
    nodeType: 'mediator',
  },
  {
    id: 'bd3',
    dag: 'X → C ← Y\n(X and Y have no direct connection)',
    question: 'C is caused by both X and Y. You restrict your sample to cases where C = 1 (e.g., selected applicants, hospitalised patients). What happens?',
    options: [
      'Nothing — no causal path exists between X and Y, so there\'s no bias',
      'A spurious X–Y association appears even though X has no causal effect on Y',
      'The causal X→Y effect is correctly identified',
      'C blocks a confounding path between X and Y',
    ],
    correct: 1,
    answer: 'C is a collider — both X and Y point into it. Conditioning on a collider (restricting to C=1, including it as a regression covariate, or selecting on it) opens a spurious association between X and Y that doesn\'t reflect any causal relationship. This is collider bias, also called Berkson\'s paradox. Classic examples: sampling hospitalised patients (both disease A and disease B lead to hospitalisation — within hospitals they look negatively correlated), or studying tech startup success (talent and luck both cause success — within successful startups they appear to substitute for each other).',
    lesson: 'Never condition on, filter by, or control for a collider. Selecting on an outcome variable (users who churned, patients who were hospitalised, startups that IPO\'d) introduces collider bias in all covariates that influenced selection.',
    nodeType: 'collider',
  },
  {
    id: 'bd4',
    dag: 'U (unobserved) → X\nU ──────────→ Y\nX ──────────→ Y',
    question: 'U is an unobserved confounder — you can\'t measure it. Can you identify the causal effect of X on Y from observational data alone?',
    options: [
      'Yes — just control for all the observed variables you have',
      'No — the backdoor path X ← U → Y cannot be blocked, so the effect is not identified',
      'Yes — X→Y is a direct path so its effect is always identified',
      'Yes — the front-door criterion works automatically here',
    ],
    correct: 1,
    answer: 'Unobserved confounding is the core problem in causal inference. The backdoor path X ← U → Y cannot be blocked because U is not measured. Controlling for observed variables that aren\'t U does nothing to close this path. Solutions: (1) Randomize (breaks U→X by design). (2) Find an instrument Z that affects X but not Y directly (IV). (3) Use front-door criterion if a mediator M exists on X→M→Y that is not caused by U. Without one of these, the causal effect is not identified.',
    lesson: 'Observational data with unobserved confounding cannot identify causal effects without additional structure. This is why RCTs are the gold standard — randomisation makes U independent of X.',
    nodeType: 'unobserved',
  },
  {
    id: 'bd5',
    dag: 'A → X,  A → Y\nB → X,  B → Y\nX ──────────→ Y',
    question: 'Two confounders A and B both affect X and Y. In your regression, you control for A only. Is the X→Y effect identified?',
    options: [
      'Yes — controlling for one confounder removes most of the bias',
      'No — the backdoor path X ← B → Y is still open, leaving residual confounding',
      'Yes — partial adjustment is sufficient when confounders are independent',
      'Depends on the relative effect sizes of A and B',
    ],
    correct: 1,
    answer: 'Controlling for A blocks X ← A → Y, but B remains unblocked. The path X ← B → Y still injects bias into your X→Y estimate. Partial confounding adjustment gives a biased (not merely noisy) estimate. You must block ALL backdoor paths. The minimal adjustment set here is {A, B}. This is why propensity score models must include all measured confounders — each omission is a source of bias, not just variance.',
    lesson: 'The adjustment set must close ALL backdoor paths. Controlling for some confounders but not others does not give an unbiased estimate — it gives a partially-corrected biased estimate. Each uncontrolled backdoor path is a separate source of bias.',
    nodeType: 'multiple',
  },
  {
    id: 'bd6',
    dag: 'X → M → Y\nU (unobserved) → X,  U → Y\n(M is NOT caused by U)',
    question: 'U confounds X and Y but is unobserved. However, mediator M (on path X→M→Y) is not caused by U. Can you identify the X→Y effect?',
    options: [
      'No — U is unobserved, so identification is impossible regardless of M',
      'Yes — via the front-door criterion: identify X→M then M→Y, then compose them',
      'Only if you have an instrument Z for X',
      'Yes — control for M to block the U confounding path',
    ],
    correct: 1,
    answer: 'This is the front-door criterion (Pearl, 1995). Even with unobserved U confounding X and Y, you can identify X→Y by: (1) Estimating X→M — since M has no backdoor paths through U, this is identified. (2) Estimating M→Y — controlling for X blocks all M→Y confounders. (3) Composing: P(Y|do(X)) = Σ_m P(M=m|X) × Σ_x P(Y|X=x, M=m) × P(X=x). The canonical example: smoking (X) → tar in lungs (M) → cancer (Y), with unobserved genetic confounders (U) affecting both smoking and cancer — identified via tar even without genotype data.',
    lesson: 'The front-door criterion is a powerful result: unobserved confounding is not always fatal if a suitable mediator exists. It\'s rare in practice but important to know — it means the answer to "can I identify this effect?" depends on the full DAG structure, not just whether confounders are observed.',
    nodeType: 'front-door',
  },
]

const BD_NODE_COLORS = {
  confounder: 'var(--ember)',
  mediator: 'var(--sky)',
  collider: 'var(--violet)',
  unobserved: 'var(--rose)',
  multiple: 'var(--gold)',
  'front-door': 'var(--mint)',
}

function BackdoorCriterion() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const s = BACKDOOR_SCENARIOS[idx]
  const accent = BD_NODE_COLORS[s.nodeType]

  function pick(i) { if (!revealed) setPicked(i) }
  function reveal() { if (picked === null) return; setRevealed(true); if (picked === s.correct) setScore(sc => sc + 1) }
  function next() {
    if (idx < BACKDOOR_SCENARIOS.length - 1) { setIdx(i => i + 1); setPicked(null); setRevealed(false) }
    else setDone(true)
  }

  if (done) return (
    <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--sky)', marginBottom: '8px' }}>{score}/{BACKDOOR_SCENARIOS.length}</div>
      <p style={{ fontSize: '14px', color: 'var(--ink-low)', marginBottom: '20px' }}>
        {score >= 5 ? 'Solid backdoor criterion intuition. The front-door result is the hardest.' : 'Focus on the collider and mediator cases — those are where most practitioners go wrong.'}
      </p>
      <button className="btn-primary" onClick={() => { setIdx(0); setPicked(null); setRevealed(false); setScore(0); setDone(false) }}>Try again</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {BACKDOOR_SCENARIOS.length}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--sky)' }}>{score} correct</span>
      </div>

      {/* DAG visualization */}
      <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${accent}30`, borderRadius: '10px' }}>
        <div style={{ fontSize: '10px', color: accent, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>DAG</div>
        <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{s.dag}</pre>
      </div>

      <div className="card" style={{ padding: '20px 24px' }}>
        <p style={{ fontSize: '14px', color: 'var(--ink-hi)', lineHeight: 1.75, margin: 0 }}>{s.question}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {s.options.map((opt, i) => {
          const isCorrect = i === s.correct
          const isPicked = i === picked
          let border = 'var(--rim)', bg = 'transparent', color = 'var(--ink-mid)'
          if (revealed) {
            if (isCorrect) { border = 'rgba(52,211,153,0.5)'; bg = 'rgba(52,211,153,0.06)'; color = 'var(--mint)' }
            else if (isPicked && !isCorrect) { border = 'rgba(244,63,94,0.5)'; bg = 'rgba(244,63,94,0.06)'; color = 'var(--rose)' }
          } else if (isPicked) { border = 'rgba(34,211,238,0.5)'; bg = 'rgba(34,211,238,0.06)'; color = 'var(--sky)' }
          return (
            <button key={i} onClick={() => pick(i)} disabled={revealed}
              style={{ padding: '13px 16px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {opt}
            </button>
          )
        })}
      </div>

      {!revealed && <button className="btn-primary" onClick={reveal} disabled={picked === null}>Reveal</button>}
      {revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '20px', border: `1px solid ${accent}30`, background: accent + '06' }}>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: accent + '20', color: accent, fontFamily: "'JetBrains Mono',monospace", display: 'inline-block', marginBottom: '10px' }}>{s.nodeType}</span>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0, marginBottom: '12px' }}>{s.answer}</p>
            <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--rim)' }}>
              <span style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>Lesson: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.lesson}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={next}>{idx < BACKDOOR_SCENARIOS.length - 1 ? 'Next →' : 'See results'}</button>
        </div>
      )}
    </div>
  )
}

// ── Tab shell ─────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'causal_vs_pred', label: 'Causal vs Predictive', component: CausalVsPredictive },
  { id: 'identification', label: 'Identification Strategies', component: IdentificationStrategies },
  { id: 'dag',            label: 'Confounder or Collider', component: ConfounderOrCollider },
  { id: 'backdoor',       label: 'Backdoor Criterion', component: BackdoorCriterion },
]

export default function CausalInferenceTab() {
  const [active, setActive] = useState('causal_vs_pred')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? CausalVsPredictive

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '24px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: 0 }}>Causal Inference</h2>
          <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(34,211,238,0.1)', color: 'var(--sky)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: '4px', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>judgment</span>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-low)', lineHeight: 1.65, maxWidth: '580px', margin: 0 }}>
          The question that trips up most practitioners: is this a prediction problem or a causal inference problem? Getting this wrong leads to the wrong method and misleading conclusions.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>
            {m.label}
          </button>
        ))}
      </div>

      <ActiveModule />
    </div>
  )
}
