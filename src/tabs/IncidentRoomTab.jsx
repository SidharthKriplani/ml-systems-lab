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
    readMin: 10,
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
        whatsTested: 'Whether you run PSI on migrated features before rolling back — diagnosing before acting.',
        antiPattern: 'Rolling back immediately without diagnosis means you will hit the same issue on the next migration attempt.',
        staffFraming: 'Two metrics degrading simultaneously after one change = shared root cause. Diagnose first, then decide whether to rollback.',
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
        whatsTested: 'Whether you understand that ANN query time scales with embedding dimension, linking the latency spike to the migration.',
        antiPattern: 'Treating the latency spike as an unrelated infra issue delays diagnosis by hours — concurrent degradations after a single change almost never coincide by accident.',
        staffFraming: 'Schema migration checklist: normalisation, dimensionality, data type, null handling. Miss one and you get a production incident.',
      },
    ],
    lesson: 'Two simultaneous degradations after a single change almost always share a root cause. Diagnose before rolling back — a rollback without root cause identification means you\'ll hit the same issue on the next migration.',
  },
  {
    id: 'inc2',
    title: 'Silent CTR Drop — No Alerts Fired',
    domain: 'Cross-domain: Monitoring → Feature Eng → Cold Start',
    readMin: 10,
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
        whatsTested: 'Whether you check prediction score distributions for coverage collapse — PSI on feature values will stay stable because affected items have no features to drift.',
        antiPattern: 'Adding more PSI monitors when existing ones show green is the wrong move — the monitoring gap is a coverage metric, not a feature metric.',
        staffFraming: 'PSI monitors features. Coverage monitors items. A 23% catalog blind spot shows up in neither until you explicitly track % items scoring above threshold.',
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
        whatsTested: 'Whether you know cold-start fallback is the right fix — removing items or setting floor scores are both wrong.',
        antiPattern: 'Setting a score floor of 0.5 for new items is dangerous — it artificially elevates unscored items above known-good items without any signal.',
        staffFraming: 'Cold-start is a product design decision, not a monitoring fix. Content embeddings + global popularity baseline is the standard solution. The monitoring alert on 0.0 scores is the prevention layer.',
      },
    ],
    lesson: 'Coverage collapse is a monitoring blind spot — PSI on feature values stays stable because the affected items have no features to drift. Add explicit catalog coverage metrics: % items with scores above threshold, % items returned zero score.',
  },
  {
    id: 'inc3',
    title: 'A/B Test Shows 12% Lift — But Traffic Split Is Off',
    domain: 'Cross-domain: Experimentation → Frontend → Statistics',
    readMin: 10,
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
        whatsTested: 'Whether you run the SRM check before reading the primary metric — a significant SRM invalidates all downstream analysis.',
        antiPattern: 'Correcting for the traffic imbalance by reweighting does not fix an SRM — if randomisation is broken, the groups differ in unknown ways that cannot be reweighted away.',
        staffFraming: 'SRM check is gate zero. If it fails, stop reading your primary metric. Investigate randomisation first, then rerun.',
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
        whatsTested: 'Whether you can trace SRM to an assignment event timing bug — mobile page-load latency causing 7% of treatment users to be unrecorded.',
        antiPattern: 'Running the experiment longer to let the split stabilise will not fix a structural assignment bug — more data compounds the systematic bias.',
        staffFraming: 'Assignment event fires at page request, not page load. This is a standard implementation pattern that prevents mobile drop-off from contaminating the exposure log.',
      },
    ],
    lesson: 'Always run the SRM check before looking at your primary metric. A significant SRM means your randomisation is broken and any observed effect is untrustworthy — even if it looks like a win. Fixing performance regressions in experiments is part of the experiment discipline.',
  },
  {
    id: 'inc4',
    title: 'Model Retrain Made Predictions Worse Overnight',
    domain: 'Cross-domain: Training Pipeline → Data Quality → Monitoring',
    readMin: 12,
    situation: `Weekly retrain ran successfully at 2am. By 6am, the fraud detection model's precision dropped from 0.91 → 0.67, recall from 0.84 → 0.89. No pipeline alerts fired. The retrain log shows no errors.

• Model artifact: successfully uploaded to S3
• Serving endpoint: updated to new version
• Training data window: last 90 days

What is your first diagnostic action?`,
    steps: [
      {
        question: 'Precision dropped 24 points, recall improved slightly. What failure mode does this suggest?',
        options: [
          { id: 'a', text: 'Data leakage — a feature correlated with the label was accidentally included in training' },
          { id: 'b', text: 'Class imbalance shifted — the training set now has proportionally more negatives, biasing the model toward precision' },
          { id: 'c', text: 'Label contamination — recent fraudulent transactions were incorrectly resolved as legitimate in the training data' },
          { id: 'd', text: 'Model serialization error — the wrong model weights were loaded onto the endpoint' },
        ],
        correct: 'c',
        finding: `Investigation of the last 90-day training window:
• Fraud labels come from a case management system that resolves investigations
• Resolution lag: genuine fraud cases take 30–90 days to confirm
• The most recent 30 days of training data contains many true fraud cases still labeled "unresolved" → treated as negative
• Model learned that recent transactions = not fraud (because confirmed fraud hasn't been labeled yet)

This is label leakage via resolution lag — a classic supervised learning failure mode in fraud.`,
        whatsTested: 'Whether you recognise precision drop + recall rise as a label contamination pattern — true positives being mislabeled as negatives.',
        antiPattern: 'Suspecting class imbalance or serialization error before checking the training label distribution — the retrain log showing SUCCESS does not validate label quality.',
        staffFraming: 'Precision drop with recall rise = model shifted toward predicting negative. In fraud with investigation lag, that means recent true fraud was relabeled as legitimate during training.',
      },
      {
        question: 'Resolution lag is confirmed. What is the correct training data fix?',
        options: [
          { id: 'a', text: 'Exclude the last 30 days from training — use only fully resolved cases' },
          { id: 'b', text: 'Add a "days_since_transaction" feature to let the model learn to discount recent transactions' },
          { id: 'c', text: 'Use only the most recent 30 days — more recent data = better signal' },
          { id: 'd', text: 'Upsample confirmed fraud cases from the recent 30-day window' },
        ],
        correct: 'a',
        finding: `Training data corrected: exclude all transactions with created_at within 45 days of training cutoff (conservative buffer above the 30-day resolution lag). Retrained model achieved precision 0.89, recall 0.83 — back to baseline.

Monitoring added: label resolution rate by cohort (week). If resolution rate for the most recent 30-day cohort < 60%, trigger an alert and skip the weekly retrain until labels stabilise.`,
        whatsTested: 'Whether you know to exclude the most recent unresolved window from training, not just add a feature for recency.',
        antiPattern: 'Adding days_since_transaction as a feature cannot fix the problem — the model still trains on mislabeled examples and learns a fundamentally wrong relationship.',
        staffFraming: 'Label cutoff = training cutoff minus resolution lag buffer. This is non-negotiable in any domain where ground truth is confirmed retrospectively.',
      },
    ],
    lesson: 'In fraud and any domain with investigation lag, the most recent data is the most dangerous for training. Labels take time to be confirmed. Always check resolution rate by cohort before including recent data in a training set.',
  },
  {
    id: 'inc5',
    title: 'Feature Store Returns Stale Values in Production',
    domain: 'Cross-domain: Feature Engineering → Serving → Data Engineering',
    readMin: 12,
    situation: `Your real-time fraud model uses a feature store for online serving. Two days after a schema migration in the upstream event pipeline, alerts show:

• user_txn_count_1h: values are uniformly 0 for all users
• user_avg_amount_7d: values are at their defaults (–1.0)
• Fraud catch rate: dropped 31% overnight
• Feature store write jobs: all show "SUCCESS" in logs

What is your first diagnostic step?`,
    steps: [
      {
        question: 'Feature store writes succeed but values are wrong. What do you check first?',
        options: [
          { id: 'a', text: 'Check if the serving endpoint is using cached features from before the migration' },
          { id: 'b', text: 'Inspect the feature store write job logs for schema mismatch warnings (not errors)' },
          { id: 'c', text: 'Verify the feature store TTL — values may have expired and fallen back to defaults' },
          { id: 'd', text: 'Roll back the upstream schema migration immediately' },
        ],
        correct: 'b',
        finding: `Feature store write job logs (full, not just status):
• WARNING: column "user_txn_count_1h" not found in source schema — defaulting to 0
• WARNING: column "user_avg_amount_7d" not found in source schema — defaulting to -1.0
• Job status: SUCCESS (warnings do not fail the job)

The upstream event pipeline migration renamed the columns (txn_count_1h → transaction_count_1h). The feature store write job silently defaulted the missing columns and reported SUCCESS. No error was raised.`,
        whatsTested: 'Whether you inspect full job logs for WARNING lines — a SUCCESS status with schema warnings is the most dangerous pipeline failure mode.',
        antiPattern: 'Rolling back the upstream migration before checking logs destroys evidence and skips diagnosis — you will not know the root cause until you read the warnings.',
        staffFraming: 'Job status SUCCESS ≠ data correctness. After any schema migration, scan pipeline logs for WARNING, not just ERROR. Silent defaults write garbage and report green.',
      },
      {
        question: 'Silent schema mismatch is confirmed. What is the systemic fix beyond patching the column names?',
        options: [
          { id: 'a', text: 'Add a post-write validation step: assert that feature distributions match the last 24h baseline before marking the job successful' },
          { id: 'b', text: 'Fail the write job on any unrecognised column — never default silently' },
          { id: 'c', text: 'Add schema version pinning on the feature store write contract — the job should fail if the source schema version changes' },
          { id: 'd', text: 'All of the above — each catches a different failure mode' },
        ],
        correct: 'd',
        finding: `Three-layer fix implemented:
1. Schema contract: write job fails if source schema version != expected version (catch upstream renames before they write)
2. Fail on unknown column (option B): write job fails, not warns, if expected feature columns are absent
3. Post-write distribution check (option A): automated check comparing feature mean ± 3σ vs rolling 7-day baseline — fires a P1 alert if deviation > 20%

All three are needed: schema contract catches renaming, fail-on-unknown catches deletion, distribution check catches silent value corruption (e.g., a column present but computed incorrectly).`,
        whatsTested: 'Whether you recognise that no single check is sufficient — schema contract, fail-on-unknown, and distribution validation each catch a different failure class.',
        antiPattern: 'Adding only schema version pinning misses column deletion and silent value corruption — a column can be present with the right name but computed incorrectly.',
        staffFraming: 'Defense in depth for feature pipelines: schema contract (catch renames), fail-on-unknown (catch deletions), post-write distribution check (catch value corruption). All three required.',
      },
    ],
    lesson: 'Feature store write jobs that warn but succeed are the most dangerous failure mode — all health checks show green while the model silently receives garbage. Add post-write distribution assertions as a mandatory step in any feature pipeline that feeds a production model.',
  },
  {
    id: 'inc6',
    title: 'Batch Scoring Job Produces Identical Predictions for All Users',
    domain: 'Cross-domain: Training Pipeline → Serving → Feature Engineering',
    readMin: 10,
    situation: `Your daily batch scoring job completed in 40 minutes (normal). But when the downstream email campaign team queries predicted scores:

• All 2.1M users have score = 0.493
• Score variance: 0.000 (literally zero)
• Model accuracy on holdout: 0.84 (still looks correct in MLflow)
• No serving errors, no pipeline failures

The campaign launches in 3 hours. What do you check first?`,
    steps: [
      {
        question: 'Model accuracy is fine but all predictions are the same. What is the likely cause?',
        options: [
          { id: 'a', text: 'The model is outputting the mean of its calibration distribution — calibration step has a bug' },
          { id: 'b', text: 'All input features are the same value — the batch scoring job read the wrong feature snapshot' },
          { id: 'c', text: 'The sigmoid output layer saturated — all logits are near 0, producing 0.5 output' },
          { id: 'd', text: 'The model file is corrupt — the scores are random noise that happens to cluster near 0.493' },
        ],
        correct: 'b',
        finding: `Inspect the feature snapshot used by the batch job:
• job_config.feature_snapshot_date = 2024-01-01 (hardcoded in the config file)
• Today's date: 2024-04-15
• All 2.1M users have features from Jan 1 — a 3.5 month old snapshot
• user_recency_days = 1 for all users (Jan 1 data treated as "yesterday")
• The constant features produced a near-constant output from the model

Root cause: a config file was not updated when the batch scoring job was templated from an old run.`,
        whatsTested: 'Whether your first reflex on zero-variance predictions is to check input features, not the model.',
        antiPattern: 'Suspecting sigmoid saturation or a corrupt model file before checking inputs wastes hours — the model is correct, it is receiving constant inputs.',
        staffFraming: 'Zero-variance predictions = identical inputs. Check feature snapshot date before anything else. The model cannot discriminate on features it never sees vary.',
      },
      {
        question: 'Stale snapshot confirmed. The campaign launches in 2.5 hours. What do you do?',
        options: [
          { id: 'a', text: 'Delay the campaign — never send based on known-bad scores' },
          { id: 'b', text: 'Re-run the batch job against the correct snapshot; monitor closely; launch only if job completes with non-trivial score variance' },
          { id: 'c', text: 'Use last week\'s valid scores — better than stale features from January' },
          { id: 'd', text: 'Randomly sample 50% of users as a control; use last week\'s scores for treatment — run it as an experiment' },
        ],
        correct: 'b',
        finding: `Batch job re-run against correct feature snapshot (today's date):
• Runtime: 38 minutes (completed with 52 minutes to spare)
• Score variance: 0.041 (normal range: 0.035–0.055)
• P10: 0.31, P50: 0.49, P90: 0.71 — healthy distribution

Campaign launched on time. Post-mortem: feature_snapshot_date must be a runtime parameter, not hardcoded in config. Added CI check: fail the job if snapshot_date is > 7 days stale.`,
        whatsTested: 'Whether you re-run immediately with the correct snapshot rather than falling back to last week\'s scores, given you have time.',
        antiPattern: 'Using last week\'s valid scores avoids the immediate problem but sends the campaign on 7-day-old propensity scores — cohorts shift weekly in most products.',
        staffFraming: 'Re-run is always the right call if you have runway. Document the config bug and add the stale-date CI check to prevent recurrence — that is the post-mortem, not just the fix.',
      },
    ],
    lesson: 'Zero-variance predictions are always a data problem, not a model problem. The model is working correctly on constant inputs and producing constant outputs. The diagnostic reflex: check the input feature distribution first, before touching the model.',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
function IncidentCard({ incident, completed, onComplete, onNavigate }) {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {incident.domain}
            </span>
            {incident.readMin && (
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>~{incident.readMin} min</span>
            )}
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--rose)', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '4px', padding: '1px 6px' }}>senior</span>
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
                  {step.whatsTested && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>What this tests · </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>{step.whatsTested}</span>
                    </div>
                  )}
                  {step.antiPattern && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--rose)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Anti-pattern · </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>{step.antiPattern}</span>
                    </div>
                  )}
                  {step.staffFraming && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--violet)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>How a senior frames this · </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>{step.staffFraming}</span>
                    </div>
                  )}
                </div>
                {!done && (
                  <button className="btn-primary" onClick={nextStep} style={{ fontSize: '12px' }}>
                    {stepIdx + 1 < incident.steps.length ? 'Next diagnostic step →' : 'Complete incident →'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Lesson + What to do next (shown when complete) */}
          {done && (
            <>
              <div style={{ padding: '12px 16px', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '8px', marginTop: '8px' }}>
                <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Key lesson</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{incident.lesson}</p>
              </div>
              <div style={{ marginTop: '12px', padding: '12px 16px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>What to do next</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {onNavigate && (
                    <button onClick={() => onNavigate('combinator')} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                      Test in Combinator →
                    </button>
                  )}
                  {onNavigate && (
                    <button onClick={() => onNavigate('mlcoding')} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                      ML Coding Lab →
                    </button>
                  )}
                </div>
              </div>
            </>
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
            onNavigate={onNavigate}
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
