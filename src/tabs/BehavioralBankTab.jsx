import { useState } from 'react';
import { AddTrackBtn } from '../components/tracks/AddToTrackPopover.jsx';

const QUESTIONS = [
  // 1. Conflict & disagreement
  {
    id: 1,
    category: 'Conflict & disagreement',
    question:
      'Tell me about a time you disagreed with a PM or eng lead on the success metric for an ML launch. How did you resolve it?',
    testing: 'Whether you can hold a principled position on measurement while staying collaborative and shipping.',
    star: {
      situation: 'Set up the launch, the metric they proposed, and why it mattered to the business.',
      task: 'Explain what you believed the metric was missing (proxy vs. true outcome, gameability, guardrail gaps).',
      action: 'Describe how you argued it — data you pulled, an alternative metric or guardrail you proposed, how you kept it about the decision not the person.',
      result: 'State what metric shipped, whether the launch validated your concern, and the relationship afterward.',
    },
    signals: [
      'Names the specific failure of the proposed metric (e.g. optimizing CTR degraded long-term retention) with numbers.',
      'Proposed a concrete alternative or guardrail rather than just objecting.',
      'Disagreed, committed, and set up a way to be proven wrong (a holdback, a guardrail alert).',
    ],
    failure: 'Framing it as being "right" and the PM being wrong, with no evidence and no path to resolution.',
  },
  {
    id: 2,
    category: 'Conflict & disagreement',
    question:
      'Describe a time an engineer pushed back hard on your model in code review or design review. What did you do?',
    testing: 'Openness to technical critique and ability to separate ego from the work.',
    star: {
      situation: 'Describe the model or design under review and the nature of the pushback (latency, complexity, maintainability, correctness).',
      task: 'Clarify what was actually at stake and whether the objection was valid.',
      action: 'Explain how you engaged — reproduced their concern, ran the experiment, or defended a tradeoff you had already weighed.',
      result: 'Say what changed in the design and what you learned about your own blind spots.',
    },
    signals: [
      'Shows they treated the reviewer as a source of signal, not an obstacle.',
      'Distinguishes objections they conceded from ones they defended with data.',
      'Quantifies the cost of the accepted change (e.g. +8ms p99 for a 3% correctness gain).',
    ],
    failure: 'Winning the argument on seniority or volume instead of merit.',
  },
  {
    id: 3,
    category: 'Conflict & disagreement',
    question:
      'Tell me about a time leadership wanted to ship a model you thought was not ready. How did you handle it?',
    testing: 'Judgment under pressure and willingness to escalate risk to the right level.',
    star: {
      situation: 'Describe the deadline pressure and the specific readiness gap (calibration, fairness, eval coverage, monitoring).',
      task: 'Explain what you owned in the decision and what the real downside risk was.',
      action: 'Describe how you surfaced the risk — a quantified risk memo, a scoped-down launch, a canary, a rollback plan.',
      result: 'State the decision made and what actually happened in production.',
    },
    signals: [
      'Translated technical risk into business terms leadership could weigh.',
      'Offered a de-risked middle path (small canary, holdback) rather than a binary ship/no-ship.',
      'Disagreed and committed once the informed decision was made.',
    ],
    failure: 'Either caving silently or blocking the launch without offering a lower-risk alternative.',
  },

  // 2. Failure & learning
  {
    id: 4,
    category: 'Failure & learning',
    question:
      'Tell me about a model that performed well offline but failed in production. What went wrong and what did you do?',
    testing: 'Depth of production ML understanding and honest ownership of failure.',
    star: {
      situation: 'Describe the model, the strong offline metric, and how the production failure surfaced.',
      task: 'Explain what you were responsible for diagnosing and fixing.',
      action: 'Walk through root cause — train/serve skew, label leakage, feedback loops, distribution shift — and the fix.',
      result: 'Quantify the impact, the recovery, and the systemic guardrail you added so it could not recur.',
    },
    signals: [
      'Names a concrete root cause (e.g. a feature computed differently in the batch pipeline vs. the serving path).',
      'Owns their part without blaming the pipeline or the data team.',
      'Added a durable control — offline/online parity checks, shadow scoring — not just a one-off patch.',
    ],
    failure: 'A vague "the data was bad" with no mechanism and no prevention.',
  },
  {
    id: 5,
    category: 'Failure & learning',
    question:
      'Describe a modeling decision you made that you later realized was wrong. How did you catch it and correct course?',
    testing: 'Intellectual honesty and the feedback loops you build to catch your own errors.',
    star: {
      situation: 'Set up the decision — a model choice, a feature, an eval design — and the assumption behind it.',
      task: 'Explain what outcome you were accountable for.',
      action: 'Describe the signal that revealed the mistake and how you unwound or corrected it, including the cost of reversing.',
      result: 'State the corrected outcome and the habit or check you adopted afterward.',
    },
    signals: [
      'Caught the error through a deliberate check, not luck or an external escalation.',
      'Quantifies the cost of the wrong call and the value of fixing it.',
      'Generalizes the lesson into a repeatable practice.',
    ],
    failure: 'Presenting a "failure" that is secretly a humblebrag with no real cost or learning.',
  },
  {
    id: 6,
    category: 'Failure & learning',
    question:
      'Tell me about a project you invested months in that got killed or never shipped. How did you deal with it?',
    testing: 'Resilience and the ability to extract value and judgment from sunk effort.',
    star: {
      situation: 'Describe the project, the investment, and why it was cancelled (priorities, infeasibility, weak results).',
      task: 'Explain your role and how much of the outcome you controlled.',
      action: 'Describe how you responded — salvaged reusable components, documented the negative result, redirected the team.',
      result: 'State what you or the org kept from it and how it shaped your later scoping instincts.',
    },
    signals: [
      'Shows they can recognize a dead end and stop sinking cost rather than defending it.',
      'Salvaged reusable assets (a dataset, a library, a validated negative result).',
      'Reflects on an earlier signal they now would have acted on sooner.',
    ],
    failure: 'Bitterness or blaming leadership, with no reflection on their own scoping.',
  },

  // 3. Influence without authority
  {
    id: 7,
    category: 'Influence without authority',
    question:
      'Tell me about a time you got another team to adopt your model, feature, or standard when you had no authority over them.',
    testing: 'Cross-team influence and the ability to sell technical work on the other team\'s terms.',
    star: {
      situation: 'Describe the artifact and the team you needed, and why they had no obligation to adopt it.',
      task: 'Explain what adoption you were driving and the resistance you faced.',
      action: 'Describe how you won them over — a pilot on their data, framing in their metrics, removing their integration cost.',
      result: 'Quantify adoption and the value both sides realized.',
    },
    signals: [
      'Led with the other team\'s incentives, not the elegance of the solution.',
      'Reduced their switching cost (drop-in API, backfill, migration support).',
      'Ran a small proof on their turf before asking for full commitment.',
    ],
    failure: 'Assuming a technically superior solution sells itself, then blaming the other team for not adopting.',
  },
  {
    id: 8,
    category: 'Influence without authority',
    question:
      'Describe how you drove adoption of an ML best practice (e.g. experiment tracking, offline/online parity, model cards) across teams.',
    testing: 'Ability to raise engineering standards through influence rather than mandate.',
    star: {
      situation: 'Describe the practice, the current state, and the pain it was meant to solve.',
      task: 'Explain the scope of adoption you were pushing for.',
      action: 'Describe your approach — a lightweight reference implementation, early-adopter allies, making the right thing the easy default.',
      result: 'State adoption rate and the concrete incidents or waste it prevented.',
    },
    signals: [
      'Made the standard cheap to adopt (tooling, templates) rather than a policy memo.',
      'Recruited a respected early adopter to create social proof.',
      'Tied the practice to a real incident it would have prevented.',
    ],
    failure: 'Trying to enforce a standard top-down with no tooling, so it dies on contact.',
  },
  {
    id: 9,
    category: 'Influence without authority',
    question:
      'Tell me about a time you convinced skeptical stakeholders to trust a model\'s output for a high-stakes decision.',
    testing: 'Building trust in ML with non-technical decision-makers.',
    star: {
      situation: 'Describe the decision, the stakeholders, and the source of their skepticism (black box, prior burn, risk aversion).',
      task: 'Explain what you needed them to trust and act on.',
      action: 'Describe how you built confidence — interpretability, backtests against their intuition, a shadow period, clear failure bounds.',
      result: 'State the decision they made and whether the model earned continued trust.',
    },
    signals: [
      'Met skepticism with transparency and error bounds, not by overselling accuracy.',
      'Ran a shadow or backtest period so trust was earned on evidence.',
      'Was honest about where the model should not be trusted.',
    ],
    failure: 'Overstating certainty to win buy-in, then losing all credibility on the first miss.',
  },

  // 4. Ambiguity & scoping
  {
    id: 10,
    category: 'Ambiguity & scoping',
    question:
      'Tell me about a time you were handed a vague problem with no clear metric or definition of success. How did you scope it?',
    testing: 'Ability to convert ambiguity into a well-posed ML problem.',
    star: {
      situation: 'Describe the vague ask and why success was undefined.',
      task: 'Explain what you had to decide before any modeling could start.',
      action: 'Describe how you scoped it — stakeholder interviews, defining the target and label, choosing a metric, cutting scope to a v1.',
      result: 'State the concrete problem you landed on and what shipped.',
    },
    signals: [
      'Reframed a fuzzy business ask into a specific prediction target with a chosen metric.',
      'Made explicit tradeoffs about what was in and out of the v1 scope.',
      'Validated the framing with stakeholders before building.',
    ],
    failure: 'Jumping straight to modeling and building an accurate answer to the wrong question.',
  },
  {
    id: 11,
    category: 'Ambiguity & scoping',
    question:
      'Describe a time you had to decide whether a problem even needed ML, versus a simpler heuristic or rule.',
    testing: 'Engineering judgment about when ML is worth its cost and complexity.',
    star: {
      situation: 'Describe the problem and the pressure or assumption that it "needed" ML.',
      task: 'Explain what you were accountable for delivering.',
      action: 'Describe how you evaluated the options — a baseline heuristic, the data readiness, the maintenance cost of a model.',
      result: 'State what you shipped and why it was the right level of complexity.',
    },
    signals: [
      'Shipped or defended a simple baseline before reaching for a model.',
      'Weighed the total lifetime cost of an ML system, not just its accuracy.',
      'Can articulate the threshold at which ML would have become worth it.',
    ],
    failure: 'Reaching for a heavy model because it is interesting, when a rule would have solved it.',
  },
  {
    id: 12,
    category: 'Ambiguity & scoping',
    question:
      'Tell me about a time you had to define a label or ground truth that did not exist yet. How did you approach it?',
    testing: 'Rigor in the hardest and most overlooked part of applied ML — the label.',
    star: {
      situation: 'Describe the problem and why no clean label existed (delayed outcome, subjective judgment, no logging).',
      task: 'Explain what depended on getting the label right.',
      action: 'Describe how you constructed it — proxy selection, annotation guidelines, adjudication, measuring label noise.',
      result: 'State the label quality you achieved and how it held up downstream.',
    },
    signals: [
      'Explicitly reasoned about label noise and bias, not just label availability.',
      'Measured inter-annotator agreement or validated the proxy against a trusted outcome.',
      'Understood how label choices would bake into every downstream model.',
    ],
    failure: 'Accepting a convenient but biased proxy label without questioning what it actually measures.',
  },

  // 5. Prioritization & tradeoffs
  {
    id: 13,
    category: 'Prioritization & tradeoffs',
    question:
      'Tell me about a time you had to ship an ML feature under a hard deadline and cut scope. What did you cut and why?',
    testing: 'Ruthless, defensible prioritization under real constraints.',
    star: {
      situation: 'Describe the deadline, the full scope, and what was infeasible in the time.',
      task: 'Explain what outcome you were accountable for hitting.',
      action: 'Describe what you cut, what you kept, and the principle behind the cut (highest risk to the outcome first).',
      result: 'State what shipped on time and the follow-up plan for the deferred work.',
    },
    signals: [
      'Cut along a clear axis (risk, value, reversibility) rather than arbitrarily.',
      'Protected the parts that were hard to fix later (data logging, guardrails).',
      'Was explicit about the debt taken on and had a plan to repay it.',
    ],
    failure: 'Cutting testing, monitoring, or logging to hit the date, then paying for it in production.',
  },
  {
    id: 14,
    category: 'Prioritization & tradeoffs',
    question:
      'Describe a time you chose to pay down ML tech debt over shipping a new feature, or vice versa. How did you decide?',
    testing: 'Ability to weigh velocity against system health with an explicit argument.',
    star: {
      situation: 'Describe the debt (brittle pipeline, no reproducibility, drifting features) and the competing feature ask.',
      task: 'Explain what you owned and who was affected by the call.',
      action: 'Describe how you quantified the tradeoff — the cost of the debt compounding vs. the value of the feature — and made the call.',
      result: 'State the decision, the outcome, and whether you would make it again.',
    },
    signals: [
      'Quantified debt cost (e.g. hours per week lost, incident frequency) instead of arguing on vibes.',
      'Made a time-bounded, explicit decision rather than letting debt drift by default.',
      'Communicated the tradeoff to stakeholders so it was a shared decision.',
    ],
    failure: 'Always choosing shiny features and letting the platform rot, or gold-plating with no user impact.',
  },
  {
    id: 15,
    category: 'Prioritization & tradeoffs',
    question:
      'Tell me about a time you had to choose which of several models or approaches to invest the team\'s effort in.',
    testing: 'Portfolio-level judgment about where modeling effort pays off.',
    star: {
      situation: 'Describe the candidate approaches and the constraint that forced a choice.',
      task: 'Explain what you were optimizing for across the options.',
      action: 'Describe your evaluation — quick baselines, expected lift vs. cost, data and maintenance burden — and the bet you placed.',
      result: 'Quantify the outcome and whether the bet paid off.',
    },
    signals: [
      'Ran cheap experiments to de-risk the choice before committing the team.',
      'Weighed expected value against implementation and maintenance cost, not just peak accuracy.',
      'Was willing to kill a promising-but-costly approach in favor of a simpler win.',
    ],
    failure: 'Chasing the most sophisticated approach without checking whether a simpler one captured most of the value.',
  },

  // 6. Mentorship & collaboration
  {
    id: 16,
    category: 'Mentorship & collaboration',
    question:
      'Tell me about a time you leveled up a junior data scientist or engineer. What did you do and what changed?',
    testing: 'Investment in others\' growth and multiplying your impact through the team.',
    star: {
      situation: 'Describe the person, their starting point, and the gap you saw.',
      task: 'Explain your role in their development.',
      action: 'Describe how you coached — scoped stretch work, reviewed their reasoning not just their code, gave direct feedback.',
      result: 'State the concrete growth (ownership, promotion, a project they now lead) and how you measured it.',
    },
    signals: [
      'Grew their judgment, not just fixed their outputs — taught them to catch their own errors.',
      'Calibrated the challenge: stretch work with a safety net.',
      'Points to a durable outcome (they now mentor others, ship independently).',
    ],
    failure: 'Doing the hard parts for them, so they stayed dependent instead of growing.',
  },
  {
    id: 17,
    category: 'Mentorship & collaboration',
    question:
      'Describe your most effective cross-functional partnership on an ML project (with a PM, designer, or domain expert).',
    testing: 'Whether you treat non-ML partners as essential collaborators, not order-takers.',
    star: {
      situation: 'Describe the project and the partner, and why the collaboration mattered.',
      task: 'Explain the shared outcome you were both accountable for.',
      action: 'Describe how you worked together — shared context early, brought domain knowledge into features, translated model behavior for them.',
      result: 'State the outcome and what made the partnership better than working solo.',
    },
    signals: [
      'Used the partner\'s domain expertise to improve features, labels, or eval — not just for handoff.',
      'Built shared understanding of what the model could and could not do.',
      'Credits the partner\'s contribution to the technical outcome specifically.',
    ],
    failure: 'Treating the PM or domain expert as a requirements funnel rather than a collaborator.',
  },
  {
    id: 18,
    category: 'Mentorship & collaboration',
    question:
      'Tell me about a time you gave difficult feedback to a peer on their modeling or analysis, or received it.',
    testing: 'Ability to raise the bar through candid, respectful technical feedback.',
    star: {
      situation: 'Describe the situation and the flaw (leakage, a misread result, an overclaimed finding).',
      task: 'Explain why it mattered and your responsibility to raise or receive it.',
      action: 'Describe how you delivered or absorbed the feedback — specific, evidence-based, focused on the work.',
      result: 'State how the work changed and the effect on the working relationship.',
    },
    signals: [
      'Made the feedback specific and about the analysis, backed by evidence.',
      'Prioritized the correctness of the result over social comfort.',
      'Kept the relationship intact — the peer engaged rather than got defensive.',
    ],
    failure: 'Staying silent to avoid friction and letting a flawed result propagate.',
  },

  // 7. Ethics, fairness & risk
  {
    id: 19,
    category: 'Ethics, fairness & risk',
    question:
      'Tell me about a time you raised a fairness or bias concern about a model. What was the concern and what happened?',
    testing: 'Willingness to surface fairness risk and ability to act on it rigorously.',
    star: {
      situation: 'Describe the model, the use case, and the fairness concern you identified.',
      task: 'Explain your responsibility and what was at stake for affected users.',
      action: 'Describe how you investigated — subgroup metrics, the fairness definition you chose, the tradeoff with overall performance — and how you escalated.',
      result: 'State what changed in the model or launch and the residual risk you documented.',
    },
    signals: [
      'Chose and justified a specific fairness metric rather than waving at "bias".',
      'Quantified the disparate impact across subgroups with real numbers.',
      'Weighed the fairness/performance tradeoff explicitly and escalated appropriately.',
    ],
    failure: 'Raising a vague concern with no measurement, or ignoring it because the aggregate metric looked fine.',
  },
  {
    id: 20,
    category: 'Ethics, fairness & risk',
    question:
      'Describe a time you handled a privacy or data-sensitivity concern in an ML system. How did you balance it against utility?',
    testing: 'Judgment about privacy risk and the discipline to design for it upfront.',
    star: {
      situation: 'Describe the system, the sensitive data, and the privacy risk (PII in features, re-identification, retention).',
      task: 'Explain what you owned and the tension with model utility.',
      action: 'Describe your approach — minimization, aggregation, differential privacy, access controls — and the tradeoff you accepted.',
      result: 'State the outcome and the utility you preserved while reducing risk.',
    },
    signals: [
      'Applied data minimization by default rather than collecting everything possible.',
      'Quantified the utility cost of the privacy protection and found it acceptable.',
      'Designed the control into the system, not bolted on after an incident.',
    ],
    failure: 'Treating privacy as a compliance checkbox and only reacting after a problem surfaces.',
  },
  {
    id: 21,
    category: 'Ethics, fairness & risk',
    question:
      'Tell me about a time you identified a potential harm or misuse of a model before it shipped. What did you do?',
    testing: 'Proactive risk thinking — anticipating harm rather than reacting to it.',
    star: {
      situation: 'Describe the model and the harm or misuse you foresaw (feedback loop, gaming, harm to a subgroup).',
      task: 'Explain your responsibility to flag and mitigate it.',
      action: 'Describe how you assessed severity and likelihood and the mitigation you designed (guardrails, human-in-the-loop, scope limits).',
      result: 'State what shipped, the safeguards in place, and the monitoring for the harm.',
    },
    signals: [
      'Reasoned through second-order effects and feedback loops, not just direct accuracy.',
      'Designed a concrete mitigation and a monitoring signal for the harm.',
      'Balanced shipping value against risk instead of blocking or ignoring.',
    ],
    failure: 'Assuming harms are someone else\'s problem, or blocking everything out of abstract caution.',
  },

  // 8. Ownership & impact
  {
    id: 22,
    category: 'Ownership & impact',
    question:
      'Tell me about an ML project you drove end-to-end, from problem definition to production impact.',
    testing: 'End-to-end ownership and the ability to connect modeling to business outcomes.',
    star: {
      situation: 'Describe the problem, why it mattered, and the state before you started.',
      task: 'Explain what you owned across the lifecycle.',
      action: 'Walk through the arc — framing, data, modeling, deployment, monitoring — and the key decisions you made.',
      result: 'Quantify the business impact (revenue, retention, cost) and how you attributed it (an A/B test, a holdback).',
    },
    signals: [
      'Owned the full lifecycle including the unglamorous parts — data, deployment, monitoring.',
      'Attributed impact rigorously through a controlled comparison, not a before/after correlation.',
      'Connects the modeling choices to the business metric that moved.',
    ],
    failure: 'Claiming impact from a metric that moved without a clean way to attribute it to the model.',
  },
  {
    id: 23,
    category: 'Ownership & impact',
    question:
      'Describe a time you took ownership of a problem that was not formally yours because no one else would.',
    testing: 'Ownership instinct and willingness to fill gaps that block outcomes.',
    star: {
      situation: 'Describe the unowned problem and why it was falling through the cracks.',
      task: 'Explain why you stepped in and what you took on.',
      action: 'Describe how you drove it — rallied people, built the missing piece, made the case for resourcing it properly.',
      result: 'State the outcome and whether the problem got a durable owner afterward.',
    },
    signals: [
      'Stepped in because the outcome mattered, not to grab visible credit.',
      'Drove it to a real resolution rather than raising a flag and moving on.',
      'Set up durable ownership so it did not fall through the cracks again.',
    ],
    failure: 'Complaining that no one owns it while doing nothing, or grabbing it then dropping it.',
  },
  {
    id: 24,
    category: 'Ownership & impact',
    question:
      'Tell me about your highest-impact ML work and how you measured that impact. What would you do differently?',
    testing: 'Ability to judge and quantify impact honestly, including its limits.',
    star: {
      situation: 'Describe the work and why you consider it your highest-impact.',
      task: 'Explain your role and the outcome you were driving.',
      action: 'Describe how you measured impact — the metric, the counterfactual, the attribution method — and the key decisions.',
      result: 'State the quantified result and one concrete thing you would do differently with hindsight.',
    },
    signals: [
      'Quantifies impact with a defensible counterfactual, not an inflated headline number.',
      'Is candid about the limits of the measurement and confounders.',
      'Offers a specific, credible improvement rather than a non-answer like "nothing".',
    ],
    failure: 'Overclaiming impact with a number they cannot attribute, or dodging the "differently" question.',
  },
];

const CATEGORIES = [
  'All',
  'Conflict & disagreement',
  'Failure & learning',
  'Influence without authority',
  'Ambiguity & scoping',
  'Prioritization & tradeoffs',
  'Mentorship & collaboration',
  'Ethics, fairness & risk',
  'Ownership & impact',
];

const STAR_STEPS = [
  { key: 'situation', label: 'S — Situation' },
  { key: 'task', label: 'T — Task' },
  { key: 'action', label: 'A — Action' },
  { key: 'result', label: 'R — Result' },
];

export function BehavioralBankTab() {
  const [expanded, setExpanded] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState('All');

  function toggleExpanded(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const visibleQuestions =
    activeCategory === 'All'
      ? QUESTIONS
      : QUESTIONS.filter(q => q.category === activeCategory);

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-hi)', padding: '0 0 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--ink-hi)' }}>
          Behavioral &amp; STAR Bank
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)' }}>
          24 questions · senior &amp; staff ML / DS behavioral + project deep-dive
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-low)', lineHeight: 1.55, maxWidth: 620 }}>
          The behavioral round every senior loop runs and most prep skips. Each card gives you what the
          question is really testing, a STAR scaffold to structure your own story, the signals a
          staff-level answer hits, and the failure mode that sinks most candidates. Bring your own
          stories — these are the frames, not the answers.
        </p>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          const color = 'var(--prime)';
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: isActive ? color : 'transparent',
                color: isActive ? 'var(--void)' : color,
                border: `1px solid ${color}`,
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Question cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {visibleQuestions.map(q => {
          const isExpanded = expanded.has(q.id);
          return (
            <div
              key={q.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--rim)',
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', top: 10, right: 12, zIndex: 2 }}>
                <AddTrackBtn itemType="behavioral" itemId={String(q.id)} label={q.question.slice(0, 80)} itemMeta={{ category: q.category }} />
              </div>
              {/* Card header — clickable */}
              <button
                onClick={() => toggleExpanded(q.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '16px 20px',
                  display: 'block',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background: 'var(--prime)22',
                      color: 'var(--prime)',
                      border: '1px solid var(--prime)55',
                      borderRadius: 6,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {q.category}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
                    Q{q.id}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      color: 'var(--ink-ghost)',
                      transition: 'transform 0.15s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 2l4 3-4 3" />
                    </svg>
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.55, color: 'var(--ink-hi)' }}>
                  {q.question}
                </p>
              </button>

              {/* Expanded body */}
              {isExpanded && (
                <div style={{ padding: '0 20px 20px' }}>
                  {/* What they're testing */}
                  <div
                    style={{
                      background: 'var(--depth)',
                      borderLeft: '3px solid var(--prime)',
                      borderRadius: '0 6px 6px 0',
                      padding: '10px 14px',
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--prime)',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: 4,
                      }}
                    >
                      What they&rsquo;re testing
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-mid)' }}>
                      {q.testing}
                    </div>
                  </div>

                  {/* STAR scaffold */}
                  <div style={{ marginBottom: 18 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-ghost)',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: 10,
                      }}
                    >
                      STAR scaffold
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {STAR_STEPS.map(step => (
                        <div key={step.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span
                            style={{
                              flexShrink: 0,
                              width: 96,
                              fontSize: 11,
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--prime)',
                              paddingTop: 1,
                            }}
                          >
                            {step.label}
                          </span>
                          <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-mid)' }}>
                            {q.star[step.key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strong-answer signals */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--green)',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: 8,
                      }}
                    >
                      Strong-answer signals
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {q.signals.map((s, i) => (
                        <li key={i} style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-mid)' }}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common failure */}
                  <div
                    style={{
                      background: 'var(--depth)',
                      border: '1px solid var(--rim)',
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-ghost)',
                        fontFamily: 'var(--font-mono)',
                        marginBottom: 4,
                      }}
                    >
                      Common failure
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-low)' }}>
                      {q.failure}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BehavioralBankTab;
