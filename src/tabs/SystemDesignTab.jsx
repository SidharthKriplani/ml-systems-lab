import { useState } from 'react'

// ─── ML Incident Room ────────────────────────────────────────────────────────

const INCIDENTS = [
  {
    id: 'stale_embed',
    title: 'Silent Recommendation Degradation',
    severity: 'P1',
    severityColor: 'var(--rose)',
    tagline: 'CTR dropped 18% over 4 days. No alerts fired.',
    context: 'You run a two-tower recommendation system. Item embeddings are refreshed daily from a feature pipeline. User embeddings are refreshed hourly. Your monitoring tracks accuracy@10 and latency. It\'s Tuesday 2am — PagerDuty fires for the first time.',
    clues: [
      { id: 'metrics',   icon: '📉', label: 'Metrics dashboard',
        content: 'CTR: -18% (Day-over-day). Accuracy@10: -12%. P50 latency: 45ms (normal). P99 latency: 210ms (normal). Model version: v2.3 (deployed 5 days ago, no change since). A/B test running: no.' },
      { id: 'pipeline',  icon: '⚙️', label: 'Feature pipeline logs',
        content: 'Day 1: item_embedding_pipeline SUCCESS 02:14\nDay 2: item_embedding_pipeline SUCCESS 02:11\nDay 3: item_embedding_pipeline FAILED 02:18 — "S3 path not found: s3://features/items/2025-01-14/"\nDay 4: item_embedding_pipeline FAILED 02:09 — "S3 path not found"\nDay 5 (today): item_embedding_pipeline FAILED 02:21 — "S3 path not found"\n\n⚠ No alert was configured on pipeline failure. Serving fell back to last successful embeddings silently.' },
      { id: 'freshness', icon: '🕐', label: 'Feature freshness log',
        content: 'user_embeddings: last_updated=2h ago (FRESH)\nitem_embeddings: last_updated=3 days 21h ago (STALE ⚠)\nuser_context_features: last_updated=45m ago (FRESH)\nitem_metadata: last_updated=6h ago (FRESH)\n\nFreshness SLA breach: item_embeddings exceeded 26h threshold (3 days ago). No consumer alert configured.' },
      { id: 'drift',     icon: '📊', label: 'Item catalog drift',
        content: 'New items added last 3 days: 14,200\nItems with no embedding (added after last successful pipeline): 14,200\nCoverage: 73% of catalogue has fresh embeddings (down from 99%)\nImpact: 27% of eligible items cannot be retrieved — model defaults to popular-item fallback for all users.' },
    ],
    diagnosis: 'stale_pipeline',
    diagnosisOptions: [
      { id: 'model_bug',        label: 'Model regression — v2.3 introduced a bug' },
      { id: 'stale_pipeline',   label: 'Feature pipeline failure — item embeddings are 4 days stale' },
      { id: 'infra',            label: 'Infrastructure issue — serving cluster degraded' },
      { id: 'data_drift',       label: 'Input distribution shift — user behaviour changed' },
    ],
    fix: 'Immediately: re-run the item embedding pipeline with a manual backfill. Configure pipeline failure alerts. Add a feature freshness monitor that pages on-call if item_embeddings > 26h stale. Add a serving-layer health check that compares embedding coverage against catalogue size.',
    lesson: 'Silent fallbacks are silent failures. A serving system that degrades gracefully without alerting is worse than one that crashes loudly — you lose days of recovery time.',
  },
  {
    id: 'label_leak',
    title: 'Fraud Model Performance Cliff',
    severity: 'P0',
    severityColor: '#ff3b3b',
    tagline: 'Precision dropped from 0.91 to 0.43 in production overnight.',
    context: 'A gradient boosted fraud detection model was retrained last night on 60 days of data. Offline metrics were excellent: AUC 0.97, precision 0.91. It was promoted to production this morning. By noon, fraud operations is overwhelmed by false positives.',
    clues: [
      { id: 'metrics',   icon: '📉', label: 'Online vs offline metrics',
        content: 'Offline (validation): AUC 0.97 | Precision 0.91 | Recall 0.88\nOnline (production): AUC 0.61 | Precision 0.43 | Recall 0.71\n\nValidation set period: Jan 1 – Mar 1\nTraining cutoff: Mar 1\nProduction serving: Mar 2 onwards\n\nNote: Offline metrics computed on held-out validation set carved from same dataset.' },
      { id: 'features',  icon: '🧩', label: 'Feature list (top by importance)',
        content: '1. transaction_count_30d           (importance: 0.22)\n2. avg_txn_amount_30d              (importance: 0.19)\n3. is_disputed_resolved            (importance: 0.17) ← POST-EVENT FEATURE\n4. chargeback_filed_within_7d      (importance: 0.14) ← POST-EVENT FEATURE\n5. velocity_1h                     (importance: 0.11)\n6. device_fingerprint_match        (importance: 0.08)\n...\n\n⚠ Features #3 and #4 are derived from dispute outcomes — they are only available AFTER fraud is confirmed. During training they were accidentally joined using transaction_id without timestamp filtering.' },
      { id: 'pipeline',  icon: '⚙️', label: 'Feature engineering code diff',
        content: '# Previous version (correct)\nfeatures = transactions.join(\n    labels,\n    on="txn_id",\n    how="left"\n).join(\n    dispute_outcomes.filter(\n        F.col("resolved_at") < F.col("transaction_at")  # time guard\n    ),\n    on="txn_id",\n    how="left"\n)\n\n# New version (introduced in last retrain)\nfeatures = transactions.join(\n    labels, on="txn_id", how="left"\n).join(\n    dispute_outcomes,  # ← time guard removed in refactor\n    on="txn_id",\n    how="left"\n)' },
      { id: 'shadow',    icon: '🔮', label: 'Shadow model comparison',
        content: 'Previous model (v4.1, still serving shadow): AUC 0.93 | Precision 0.87\nNew model (v4.2, promoted this morning): AUC 0.43 | Precision 0.43\n\nNote: Shadow mode was running but was NOT configured to block promotion if shadow AUC < champion AUC. Promotion was manual.' },
    ],
    diagnosis: 'label_leak',
    diagnosisOptions: [
      { id: 'model_complexity',  label: 'Model overfitting — too many trees, too deep' },
      { id: 'label_leak',        label: 'Label leakage — post-event features used during training' },
      { id: 'distribution_shift',label: 'Distribution shift — March fraud patterns differ from Jan–Feb' },
      { id: 'threshold_wrong',   label: 'Decision threshold not calibrated for production' },
    ],
    fix: 'Immediately: rollback to v4.1. Re-run feature engineering with timestamp filtering on all dispute outcome joins. Retrain, validate on a time-ordered hold-out set (not random split). Add an automated leakage check: verify that no feature has > 0.3 correlation with the label in a causality-excluded window.',
    lesson: 'Label leakage shows up as suspiciously good offline metrics. If your model\'s top features are outcome-derived (disputes, chargebacks, resolutions), run a temporal validity check before training. Never use random train/test splits for fraud or churn — always use time-ordered splits.',
  },
  {
    id: 'skew_serving',
    title: 'Search Ranking Latency Explosion',
    severity: 'P1',
    severityColor: 'var(--ember)',
    tagline: 'P99 latency hit 8 seconds. P50 still fine at 120ms.',
    context: 'You run a two-stage search ranking system: ANN retrieval (fast) + cross-encoder reranking (slow). A new reranker model was deployed yesterday. P50 latency is fine but P99 started climbing 6 hours after deployment.',
    clues: [
      { id: 'latency',   icon: '⏱', label: 'Latency percentiles (last 24h)',
        content: 'P50: 120ms (baseline: 115ms) ✓\nP95: 890ms (baseline: 340ms) ⚠\nP99: 7,800ms (baseline: 450ms) ✗✗\nP99.9: 28,000ms ✗✗✗\n\nBreakdown by stage:\n  ANN retrieval P99: 45ms (normal)\n  Reranker P99: 7,750ms (up from 400ms baseline)\n  Feature fetch P99: 12ms (normal)\n\nQuery distribution:\n  Queries < 5 tokens: 67% of traffic — P99: 180ms ✓\n  Queries 5–20 tokens: 28% of traffic — P99: 650ms ⚠\n  Queries > 20 tokens: 5% of traffic — P99: 28,000ms ✗' },
      { id: 'model',     icon: '🤖', label: 'Model change log',
        content: 'v3.1 (yesterday, 14:00): New cross-encoder deployed\n  - Architecture: BERT-base → BERT-large (110M → 340M params)\n  - Sequence length: max_len=128 → max_len=512\n  - Batch size: fixed 32 → dynamic (fills to max_len)\n  - Reranking candidates: top-100 retrieval results (unchanged)\n\nkey change: dynamic batching fills sequences to max_len=512 — long queries trigger full 512-token computation for ALL 100 candidates.' },
      { id: 'infra',     icon: '🖥', label: 'Serving infrastructure',
        content: 'GPU: A10G (24GB) — 100% utilisation on long-query instances\nCPU fallback: triggered when GPU queue > 500ms\nTimeout: 10s hard cutoff (user sees error)\n\nQueue depth (last 6h):\n  Short queries: 0–2 items queued\n  Long queries: 40–120 items queued\n\nGPU memory: 21/24 GB used (up from 14 GB with v3.0)\nOOM events: 3 in last hour (restarted pod automatically)' },
      { id: 'traces',    icon: '🔍', label: 'Request traces (sample)',
        content: 'Query: "comfortable lightweight running shoes for wide feet flat arch support"\n  Token count: 13\n  Candidates: 100\n  Reranker time: 6,800ms\n  Padded sequence: 512 × 100 = 51,200 tokens processed\n\nQuery: "shoes"\n  Token count: 1\n  Candidates: 100\n  Reranker time: 145ms\n  Padded sequence: 512 × 100 = 51,200 tokens processed ← same!\n\nRoot cause: both queries process 51,200 tokens because batch is padded to max_len=512 regardless of actual query length.' },
    ],
    diagnosis: 'padding_batching',
    diagnosisOptions: [
      { id: 'model_too_large',   label: 'Model too large — BERT-large cannot fit on A10G' },
      { id: 'padding_batching',  label: 'Dynamic batching pads all sequences to max_len=512 — long queries create massive tensors' },
      { id: 'candidate_count',   label: 'Too many reranking candidates (100) for BERT-large' },
      { id: 'gpu_thermal',       label: 'GPU thermal throttling under sustained load' },
    ],
    fix: 'Short-term: rollback to BERT-base or reduce max_len to 128. Medium-term: implement sequence-length bucketing — batch queries of similar length together, pad only to the longest in the bucket. Add a per-query latency budget and a reranker bypass for queries already exceeding budget. Monitor P99 separately for each query-length bucket.',
    lesson: 'P99 latency issues are often distribution problems, not mean problems. Always segment latency by input characteristics (query length, candidate count, user tier). Padding-induced quadratic compute is a classic reranker trap — BERT attention scales as O(n²) in sequence length.',
  },
]

function ClueCard({ clue, isOpen, onToggle }) {
  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s', borderColor: isOpen ? 'rgba(52,211,153,0.35)' : undefined }}
      onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>{clue.icon}</span>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: isOpen ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{clue.label}</span>
        </div>
        <span style={{ color: 'var(--ink-low)', fontSize: '12px' }}>{isOpen ? '▲ hide' : '▼ reveal'}</span>
      </div>
      {isOpen && (
        <pre style={{ marginTop: '14px', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.75, whiteSpace: 'pre-wrap', overflowX: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', borderRadius: '8px', padding: '12px', margin: 0 }}>
          {clue.content}
        </pre>
      )}
    </div>
  )
}

function IncidentRoom() {
  const [incidentIdx, setIncidentIdx] = useState(0)
  const [openClues,   setOpenClues]   = useState({})
  const [selected,    setSelected]    = useState(null)
  const [showFix,     setShowFix]     = useState(false)

  const inc = INCIDENTS[incidentIdx]

  function selectIncident(i) {
    setIncidentIdx(i)
    setOpenClues({})
    setSelected(null)
    setShowFix(false)
  }

  function toggleClue(id) {
    setOpenClues(o => ({ ...o, [id]: !o[id] }))
  }

  const revealedCount = Object.values(openClues).filter(Boolean).length
  const isCorrect = selected === inc.diagnosis

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Incident selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {INCIDENTS.map((inc, i) => (
          <button key={inc.id} onClick={() => selectIncident(i)}
            className={`sub-tab ${incidentIdx === i ? 'active' : 'inactive'}`}>
            <span style={{ marginRight: '6px', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: inc.severityColor, color: '#fff', fontWeight: 700 }}>{inc.severity}</span>
            {inc.title}
          </button>
        ))}
      </div>

      {/* Incident brief */}
      <div className="card" style={{ borderColor: inc.severityColor + '66', background: `linear-gradient(135deg, var(--depth), rgba(0,0,0,0.1))` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: inc.severityColor, color: '#fff', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{inc.severity}</span>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '18px', color: 'var(--ink-hi)' }}>{inc.title}</span>
        </div>
        <p style={{ fontSize: '14px', color: inc.severityColor, fontWeight: 600, marginBottom: '10px' }}>"{inc.tagline}"</p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0 }}>{inc.context}</p>
      </div>

      {/* Evidence */}
      <div>
        <div style={{ fontSize: '13px', color: 'var(--ink-low)', marginBottom: '12px' }}>
          Explore the evidence below. Reveal what you need — don't peek at everything at once.
          <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: "'JetBrains Mono',monospace" }}>{revealedCount}/{inc.clues.length} revealed</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {inc.clues.map(clue => (
            <ClueCard key={clue.id} clue={clue} isOpen={!!openClues[clue.id]} onToggle={() => toggleClue(clue.id)} />
          ))}
        </div>
      </div>

      {/* Diagnosis */}
      <div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '15px', color: 'var(--ink-hi)', marginBottom: '12px' }}>
          What's the root cause?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {inc.diagnosisOptions.map(opt => {
            const isSelected = selected === opt.id
            const isRight    = isSelected && opt.id === inc.diagnosis
            const isWrong    = isSelected && opt.id !== inc.diagnosis
            return (
              <button key={opt.id}
                onClick={() => { if (!selected) { setSelected(opt.id); if (opt.id === inc.diagnosis) setShowFix(true) } }}
                disabled={!!selected && !isSelected}
                style={{
                  textAlign: 'left', padding: '12px 16px', borderRadius: '8px', cursor: selected ? (isSelected ? 'default' : 'not-allowed') : 'pointer',
                  border: `1px solid ${isRight ? 'rgba(52,211,153,0.50)' : isWrong ? 'rgba(244,63,94,0.5)' : 'var(--rim)'}`,
                  background: isRight ? 'rgba(240,165,0,0.07)' : isWrong ? 'rgba(244,63,94,0.08)' : 'var(--depth)',
                  color: isRight ? 'var(--mint)' : isWrong ? 'var(--rose)' : isSelected ? 'var(--ink-hi)' : 'var(--ink-low)',
                  fontFamily: "'Inter',sans-serif", fontSize: '13.5px', opacity: selected && !isSelected ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}>
                {isRight && '✓ '}{isWrong && '✗ '}{opt.label}
              </button>
            )
          })}
        </div>

        {selected && !isCorrect && (
          <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '8px', fontSize: '13px', color: 'var(--rose)' }}>
            Not quite. Review the evidence again — particularly the feature pipeline logs and freshness data.
            <button onClick={() => { setSelected(null); setShowFix(false) }}
              style={{ marginLeft: '12px', background: 'none', border: '1px solid rgba(244,63,94,0.4)', color: 'var(--rose)', borderRadius: '6px', padding: '2px 10px', cursor: 'pointer', fontSize: '12px' }}>
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Fix + lesson */}
      {showFix && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ borderColor: 'rgba(52,211,153,0.30)', background: 'rgba(52,211,153,0.04)' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--mint)', marginBottom: '8px' }}>✓ Correct diagnosis. Here's the fix:</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.75, margin: 0 }}>{inc.fix}</p>
          </div>
          <div className="card" style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--sky)', marginBottom: '8px' }}>Lesson</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.75, margin: 0 }}>{inc.lesson}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DS Ownership Chain ──────────────────────────────────────────────────────

const DS_CHAIN = [
  {
    id: 'problem_framing',
    title: 'Problem Framing',
    short: 'Define the prediction target, not the engineering task.',
    what: 'Translate a business ask ("reduce churn") into a precise ML problem: prediction target, entity grain, prediction horizon, and decision it feeds.',
    own: 'You own the framing document — and the right to push back if the framing will produce a useless model. A model that predicts what no one can act on is a waste.',
    failure: 'Building a regression when a classification threshold was needed. Or predicting 30-day churn when the retention team can only act on 7-day signals.',
    tiers: {
      junior:  'Can restate the business goal as a prediction problem.',
      analyst: 'Identifies the entity, grain, and prediction horizon. Flags if the target is unactionable.',
      senior:  'Writes a 1-page framing doc including failure modes of the framing itself.',
      staff:   'Challenges the business ask, proposes alternative framings, and defines the decision criteria for choosing between them.',
    },
  },
  {
    id: 'success_metric',
    title: 'Success Metric Definition',
    short: 'Translate business KPI into an ML objective with constraints.',
    what: 'Choose the ML metric that best proxies the business KPI, and define constraints (e.g., FPR < 5%). Document why accuracy is wrong for this problem.',
    own: 'The metric choice is a commitment. If you choose AUC and the team ships based on precision, someone made a disconnect you need to have caught.',
    failure: 'Optimising AUC on an imbalanced dataset and declaring victory. Reporting RMSE without context on what error magnitude is operationally meaningful.',
    tiers: {
      junior:  'Knows AUC, F1, precision/recall. Can compute them.',
      analyst: 'Selects metric based on class imbalance and cost structure. Explains why accuracy fails.',
      senior:  'Defines a metric + constraint pair. Documents business cost ratio of FP vs FN. Sets the threshold policy.',
      staff:   'Aligns metric to the business decision function. Defines a multi-metric evaluation framework and negotiates with stakeholders on acceptable tradeoff zones.',
    },
  },
  {
    id: 'data_grain',
    title: 'Data Sourcing & Grain',
    short: 'Define row-level granularity before touching any data.',
    what: 'Specify the grain (one row = one what?) before writing any SQL. Identify every data source and the join keys. Document the population of eligible training examples.',
    own: 'The grain definition is the contract. Everything downstream — features, labels, evaluation — is contaminated if the grain is wrong.',
    failure: 'Training on (user, session) but serving at (user, day). Accidentally fan-out joining a many-to-many table and getting row duplication without noticing.',
    tiers: {
      junior:  'Can define what a row represents in a given table.',
      analyst: 'Defines the grain before querying. Detects fan-out joins in SQL.',
      senior:  'Documents the population definition, eligibility criteria, and possible sampling biases. Validates grain consistency across all feature sources.',
      staff:   'Audits grain consistency across the full data lineage. Establishes grain contracts for the feature store and training pipelines.',
    },
  },
  {
    id: 'label_construction',
    title: 'Label Construction',
    short: 'Define what counts as a positive — and when you can know it.',
    what: 'Write the exact label definition: what event, at what timestamp, relative to the prediction time. Account for the observation window (delayed labels).',
    own: 'The label is the ground truth you are training toward. Sloppy labels = sloppy model. The gap between prediction time and label observation time is your model\'s minimum production latency.',
    failure: 'Using labels from after the prediction timestamp (label leakage). Ignoring that only 60% of events resolve within 7 days, training on an unrepresentative positive set.',
    tiers: {
      junior:  'Can identify the target column in a dataset.',
      analyst: 'Writes a point-in-time correct label definition. Identifies the observation window.',
      senior:  'Handles delayed labels — uses only aged labels, documents the label distribution curve over time.',
      staff:   'Defines a label policy for the organisation: what observation window to use, how to handle label noise, and how to retrain as the label distribution shifts.',
    },
  },
  {
    id: 'point_in_time',
    title: 'Point-in-Time Correctness',
    short: 'Every feature must be computed from data available before prediction_ts.',
    what: 'For each event (entity, event_ts), join the feature table on max(feature_ts) ≤ event_ts. This is an asof join — not a standard date join.',
    own: 'The most common silent killer of model validity. A standard join uses the feature value as of today, not as of prediction time, introducing future information into training.',
    failure: 'Joining on user_id without a timestamp guard. Using a feature whose value is retrospectively updated (e.g., "did the user eventually convert?") as a training feature.',
    tiers: {
      junior:  'Understands what future leakage means.',
      analyst: 'Implements asof joins. Audits feature timestamps against prediction timestamps.',
      senior:  'Writes a feature leakage check — validates that no feature has > 0.3 correlation with the label in a causality-excluded window.',
      staff:   'Enforces point-in-time correctness at the feature store level. No consumer can inadvertently bypass temporal guards.',
    },
  },
  {
    id: 'feature_engineering',
    title: 'Feature Engineering',
    short: 'Transform raw events into model inputs — and own every transformation.',
    what: 'Choose aggregation windows, encoding strategies, imputation approaches, and normalisations. Write them in a way that can be reproduced identically at serving time.',
    own: 'You own the transformation code, not just the notebook. If the serving system recomputes features differently, you own the divergence.',
    failure: 'Fitting a scaler on the full dataset before CV splits. Using the test set mean for imputation. Hardcoding aggregation logic that diverges from what the feature store computes.',
    tiers: {
      junior:  'Can one-hot encode, scale, and aggregate features.',
      analyst: 'Uses sklearn Pipelines to prevent leakage. Documents every transformation.',
      senior:  'Validates that training features = serving features with a parity test. Handles MCAR/MAR/MNAR missing data correctly.',
      staff:   'Defines feature engineering standards for the team. Builds reusable feature library that serves both training and production.',
    },
  },
  {
    id: 'training_pipeline',
    title: 'Training Pipeline Design',
    short: 'Reproducible end-to-end: data → features → train → evaluate → register.',
    what: 'Orchestrate the full pipeline with parameterised, versioned steps. Every run should be reproducible with pinned seeds, dependencies, and data snapshots.',
    own: 'You own the pipeline code, not just the model artifact. "It worked on my laptop" is a pipeline ownership failure.',
    failure: 'Notebooks as pipelines. Non-reproducible runs due to unfixed random seeds. Pipeline steps that silently succeed but produce different outputs depending on environment.',
    tiers: {
      junior:  'Can run a training script end to end.',
      analyst: 'Parameterises pipeline runs. Pins seeds and library versions. Logs all hyperparameters.',
      senior:  'Builds a pipeline with explicit DAG dependencies, failure retry, and data validation steps.',
      staff:   'Designs a training infrastructure that supports parallel experimentation, data versioning, and lineage tracking.',
    },
  },
  {
    id: 'validation_strategy',
    title: 'Validation Strategy',
    short: 'Choose the evaluation protocol before you see a single number.',
    what: 'Stratified k-fold for classification on i.i.d. data. Forward-chained (expanding window) split for time series. Group-aware split when entity observations are correlated.',
    own: 'The validation strategy determines whether your offline metrics mean anything. Choose it before training, not after to make numbers look good.',
    failure: 'Random 80/20 split on time-series data. Random split when the same user appears in train and test. Choosing k-fold after seeing that one split gave better numbers.',
    tiers: {
      junior:  'Can split data into train/val/test.',
      analyst: 'Selects the correct split strategy for the data structure. Explains why random split fails for time series.',
      senior:  'Implements group-aware and time-aware splits. Documents the validation protocol before running experiments.',
      staff:   'Defines team-wide validation standards. Audits existing models for split correctness.',
    },
  },
  {
    id: 'baseline',
    title: 'Baseline Model',
    short: 'Build the simplest possible model before the complex one.',
    what: 'Business rule → majority-class heuristic → single-feature logistic regression → full model. Each step must beat the previous to justify complexity.',
    own: 'A baseline is not a formality — it is evidence. Without a documented baseline, you cannot prove your model adds value over naive strategies.',
    failure: 'Skipping baselines and reporting AUC=0.85 without context. A majority-class classifier might achieve AUC=0.83 on your imbalanced dataset.',
    tiers: {
      junior:  'Can implement a majority-class baseline.',
      analyst: 'Builds a hierarchy: rule → heuristic → logistic regression → model. Documents each step.',
      senior:  'Uses baselines to bound the complexity budget: if LR achieves 90% of the gain, the complex model must justify its operational cost.',
      staff:   'Defines baseline standards for the team. Establishes that no complex model ships without documented baseline comparison.',
    },
  },
  {
    id: 'model_training',
    title: 'Model Selection & Training',
    short: 'Own the training loop, not just the API call.',
    what: 'Choose architecture based on feature types, data volume, and latency budget. Tune hyperparameters with principled search. Handle class imbalance explicitly.',
    own: 'Selecting XGBoost because "it usually works" without understanding its assumptions is not ownership. You must know why each choice was made.',
    failure: 'Grid search on all hyperparameters simultaneously without fixing n_estimators first. Using SMOTE without understanding its geometric assumptions.',
    tiers: {
      junior:  'Can fit an sklearn model with default parameters.',
      analyst: 'Makes deliberate architecture and hyperparameter choices. Handles imbalance with threshold tuning or class weights.',
      senior:  'Profiles training time vs performance tradeoffs. Fixes the most expensive hyperparameter (n_estimators) with early stopping, then optimises the rest.',
      staff:   'Designs the model selection process as a systematic comparison with documented decision criteria and compute budget constraints.',
    },
  },
  {
    id: 'offline_eval',
    title: 'Offline Evaluation',
    short: 'Disaggregate performance by slice before calling it ready.',
    what: 'Compute the right primary metric, then disaggregate by slice (demographics, geography, value tier). Check calibration. Compare against all baselines.',
    own: 'Aggregate AUC is a lie. A model that performs well on 80% of users but catastrophically on a key segment is not ready.',
    failure: 'Reporting only AUC. No slice analysis. No calibration check. Promotion to production based on aggregate metrics on a biased validation set.',
    tiers: {
      junior:  'Can compute precision, recall, AUC.',
      analyst: 'Runs slice analysis. Checks calibration with a reliability diagram. Validates against all baselines.',
      senior:  'Defines the minimum acceptable per-slice performance bar. Flags failure modes before they reach production.',
      staff:   'Establishes org-wide evaluation standards. Defines what "production ready" means quantitatively for every model type.',
    },
  },
  {
    id: 'shadow_deploy',
    title: 'Shadow Deployment',
    short: 'Run the challenger in parallel before it touches real traffic.',
    what: 'Deploy the new model to receive production traffic without serving its predictions. Compare score distributions, latency, and downstream feature patterns against the champion.',
    own: 'Shadow mode is your insurance policy. If you skip it, the first feedback loop on your model is a production incident.',
    failure: 'Promoting a model to production directly from offline evaluation. Missing that the score distribution shifted even though AUC looked fine in shadow.',
    tiers: {
      junior:  'Understands what shadow mode is.',
      analyst: 'Sets up shadow instrumentation and compares score distributions.',
      senior:  'Defines shadow exit criteria: what score distribution delta or AUC gap triggers a block on promotion.',
      staff:   'Builds shadow mode into the standard deployment protocol. Defines automated gates that block promotion if shadow metrics diverge.',
    },
  },
  {
    id: 'ab_design',
    title: 'A/B Experiment Design',
    short: 'Pre-register MDE, power, and guardrails before flipping any flag.',
    what: 'Define the primary metric, MDE, power (≥80%), expected duration, randomisation unit, and guardrail metrics before the experiment starts.',
    own: 'The experiment design is a commitment. Post-hoc adjustments based on results are p-hacking. You own the statistical validity of the test.',
    failure: 'Peeking and stopping early. Using the wrong randomisation unit (user vs device vs session). No SRM check. Declaring significance at p=0.049 after 3 peeks.',
    tiers: {
      junior:  'Knows what a p-value and significance level mean.',
      analyst: 'Pre-registers MDE, power, duration. Runs SRM check before reading results.',
      senior:  'Designs the randomisation unit based on SUTVA violation risk. Uses sequential testing if early stopping is needed.',
      staff:   'Owns the experimentation platform standards. Defines what constitutes a valid experiment for the org. Handles network effects and interference.',
    },
  },
  {
    id: 'prod_serving',
    title: 'Production Serving',
    short: 'Own the latency budget from feature fetch to prediction.',
    what: 'Decompose the end-to-end latency: feature lookup + model inference + postprocessing + I/O overhead. Validate against the SLA. Define the serving degradation strategy.',
    own: 'Handing off a model artifact and calling it "done" is not ownership. The serving path — feature store integration, batching, caching — is yours.',
    failure: 'Not knowing the P99 latency of your model in production. No graceful degradation when the feature store is down. Serving a model whose features take 800ms to compute for a 200ms SLA.',
    tiers: {
      junior:  'Can deploy a model behind a REST endpoint.',
      analyst: 'Profiles and decomposes latency. Validates against SLA.',
      senior:  'Designs graceful degradation (fallback scores, simplified model). Owns the serving SLA formally.',
      staff:   'Designs the serving architecture — online feature store, model server, caching strategy, traffic shaping. Defines serving SLAs as engineering contracts.',
    },
  },
  {
    id: 'feature_store',
    title: 'Feature Store Integration',
    short: 'Training features must equal serving features — single computation code.',
    what: 'Implement features once, run them both in training (offline store / Hive) and serving (online store / Redis). Any divergence is training-serving skew.',
    own: 'The feature store integration is the hardest part of keeping a model honest. You own the parity contract — training and serving compute the same numbers.',
    failure: 'Python feature logic in training, Java/SQL feature logic in serving, slight timestamp handling difference. Result: model trained on one distribution, served on another. Silent, persistent, hard to detect.',
    tiers: {
      junior:  'Understands why training and serving features must match.',
      analyst: 'Implements features in the feature store and validates training/serving parity with a test set.',
      senior:  'Builds a continuous skew monitor that compares training distribution to serving distribution for each feature.',
      staff:   'Designs the feature registry and enforces a single-compute-path principle as an architectural standard.',
    },
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Alerting',
    short: 'Three-layer monitoring: data quality → feature drift → model performance.',
    what: 'Layer 1: data quality (null rates, schema drift). Layer 2: feature drift (PSI/KS vs training baseline, alert on PSI > 0.2). Layer 3: model performance (proxy metrics if labels are delayed).',
    own: 'Monitoring is not "set up a dashboard." It is a configured alert system with known thresholds and documented on-call runbooks.',
    failure: 'No alerts on feature pipeline failure. No PSI monitoring. Model silently degrading because item embeddings went stale (see: Silent Recommendation Degradation incident).',
    tiers: {
      junior:  'Knows PSI and KS exist. Can compute them.',
      analyst: 'Configures PSI/KS monitors with thresholds. Sets up data quality alerts.',
      senior:  'Builds a monitoring system covering all three layers. Documents runbook for each alert type.',
      staff:   'Designs the monitoring architecture for a model portfolio. Defines organisational alerting standards and incident response protocols.',
    },
  },
  {
    id: 'retraining',
    title: 'Retraining & Model Lifecycle',
    short: 'Define retraining triggers, rollback criteria, and the champion/challenger protocol.',
    what: 'Specify retraining cadence triggers (schedule vs drift-triggered). Define champion/challenger protocol for promotion. Document rollback criteria and execution procedure.',
    own: 'Retraining is not running a cron job. You own the decision policy: when to retrain, when to promote, and when to roll back — in writing, before a crisis.',
    failure: 'No rollback procedure. Retraining on all available data without considering label delay. Automatic promotion without a shadow or canary gate.',
    tiers: {
      junior:  'Can retrain a model with new data.',
      analyst: 'Defines retraining triggers (drift threshold, schedule). Documents the promotion checklist.',
      senior:  'Designs the champion/challenger protocol with automated gates. Defines rollback SLA (time-to-rollback < 30min).',
      staff:   'Owns the model lifecycle policy for the platform. Designs automated retraining infrastructure with drift-triggered pipelines and safety gates.',
    },
  },
]

const TIER_COLORS = { junior: 'var(--ink-mid)', analyst: 'var(--sky)', senior: 'var(--mint)', staff: 'var(--prime)' }

function DSOwnershipChain() {
  const [openId,    setOpenId]    = useState(null)
  const [reviewed,  setReviewed]  = useState({})
  const [activeTier,setActiveTier]= useState('senior')

  const reviewedCount = Object.values(reviewed).filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.6, maxWidth: '560px' }}>
            17 concepts a production DS/MLE must personally own — not delegate, not half-understand. In the sequence they appear in a real project.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>{reviewedCount}/{DS_CHAIN.length} reviewed</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['junior','analyst','senior','staff'].map(t => (
              <button key={t} onClick={() => setActiveTier(t)}
                style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', border: `1px solid ${activeTier === t ? TIER_COLORS[t] : 'var(--rim)'}`, background: activeTier === t ? `${TIER_COLORS[t]}15` : 'transparent', color: activeTier === t ? TIER_COLORS[t] : 'var(--ink-low)', cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500 }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chain */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {DS_CHAIN.map((node, i) => {
          const isOpen = openId === node.id
          const isDone = !!reviewed[node.id]
          return (
            <div key={node.id} style={{ display: 'flex', gap: '0' }}>
              {/* Spine */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px', flexShrink: 0 }}>
                <button onClick={() => setReviewed(r => ({ ...r, [node.id]: !r[node.id] }))}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isDone ? 'var(--mint)' : isOpen ? 'var(--prime)' : 'var(--rim)'}`, background: isDone ? 'var(--mint)' : 'var(--depth)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: isDone ? '#000' : 'var(--ink-low)', fontWeight: 700, zIndex: 1 }}>
                  {isDone ? '✓' : String(i + 1).padStart(2,'0').slice(-2)}
                </button>
                {i < DS_CHAIN.length - 1 && (
                  <div style={{ width: '2px', flex: 1, minHeight: '16px', background: isDone ? 'rgba(52,211,153,0.35)' : 'var(--rim)', marginTop: '2px', marginBottom: '2px' }} />
                )}
              </div>

              {/* Node card */}
              <div style={{ flex: 1, marginBottom: i < DS_CHAIN.length - 1 ? '6px' : '0', marginLeft: '10px' }}>
                <button onClick={() => setOpenId(isOpen ? null : node.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: isOpen ? 'rgba(240,165,0,0.05)' : 'transparent', border: `1px solid ${isOpen ? 'rgba(240,165,0,0.20)' : 'var(--rim)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.12s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: isOpen ? 'var(--prime)' : isDone ? 'var(--mint)' : 'var(--ink-hi)' }}>{node.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-low)', marginLeft: '10px' }}>{node.short}</span>
                    </div>
                    <span style={{ color: 'var(--ink-low)', fontSize: '11px', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div style={{ margin: '4px 0 6px', padding: '16px 18px', background: 'var(--depth)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--sky)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '5px' }}>What it means</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{node.what}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--ember)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '5px' }}>Common failure if skipped</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{node.failure}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: TIER_COLORS[activeTier], textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '5px' }}>{activeTier.charAt(0).toUpperCase() + activeTier.slice(1)} ownership</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.7, margin: 0 }}>{node.tiers[activeTier]}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '6px' }}>Ownership means</div>
                      <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>{node.own}</p>
                    </div>
                    <button onClick={() => setReviewed(r => ({ ...r, [node.id]: !r[node.id] }))}
                      style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '5px 14px', borderRadius: '6px', border: `1px solid ${isDone ? 'var(--mint)' : 'var(--rim)'}`, background: isDone ? 'rgba(52,211,153,0.08)' : 'transparent', color: isDone ? 'var(--mint)' : 'var(--ink-low)', cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}>
                      {isDone ? '✓ Marked as reviewed' : 'Mark as reviewed'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Incident Scenarios (business pressure) ──────────────────────────────────

const SCENARIOS = [
  {
    id: 'late_pipeline',
    title: 'Feature Pipeline Late',
    pressure: 'Launch is in 2 hours. Your feature pipeline failed 3 hours ago. The model is serving 6-hour-old features. The PM is asking if it\'s fine to proceed.',
    context: 'You run a real-time fraud model. Features include transaction velocity (1h, 24h windows), device fingerprint match, and user risk score. The pipeline that refreshes user risk scores failed silently at 04:00. Serving is using a stale fallback. Traffic is 40% of daily peak.',
    decision: 'What do you do?',
    tiers: {
      junior:  'Restart the pipeline and wait. Tell the PM "we\'re working on it."',
      analyst: 'Quantify staleness impact: which features are affected, by how much. Estimate expected precision degradation. Give the PM a risk number, not just "working on it."',
      senior:  'Implement a serving bypass that flags stale-feature predictions as low-confidence. Enforce a conservative threshold for flagged predictions. Communicate: "risk score features are 6h stale, we\'re increasing the fraud threshold temporarily to compensate, expected FP rate increases by ~X%."',
      staff:   'All of the above plus: escalate the silent failure root cause (why did no alert fire?). Post-incident: require pipeline health gates before any serving traffic is allowed. Define a "feature freshness SLA breach" protocol in the runbook.',
    },
    lesson: 'Quantify degradation before deciding. A confident "here\'s the risk number" is more useful than "we\'re fixing it." Degraded service with known bounds beats unknown service.',
  },
  {
    id: 'srm_failure',
    title: 'A/B Test SRM Failure',
    pressure: 'Your A/B test shows +2.1% CTR (p=0.002). The PM wants to ship today. You notice the SRM check shows a 52:48 split instead of 50:50.',
    context: 'The experiment ran for 14 days. Primary metric: CTR. Secondary metrics: add-to-cart (+0.8%, ns), revenue per user (+1.2%, ns). Experiment population: all users in the US. SRM p-value: 0.003.',
    decision: 'Do you ship? What do you tell the PM?',
    tiers: {
      junior:  '"The test passed, let\'s ship."',
      analyst: '"We have an SRM — the assignment ratio is wrong. The result is statistically invalid. We need to find the cause and rerun before shipping."',
      senior:  'Investigates SRM cause before deciding direction: logging bug (affects metric), assignment bug (biased sample), or novelty effect (unlikely at 14 days). Tells PM: "The test result cannot be trusted as-is. We have a 2% assignment imbalance. If it\'s a logging bug on the control side, the CTR lift may be inflated. Recommend: fix and rerun, 7-day minimum. I can give you a bias-corrected point estimate while we wait, but I won\'t call it valid."',
      staff:   'All of the above plus: root-causes the SRM systematically, fixes the assignment or logging system, establishes a mandatory SRM-check gate in the experimentation platform that blocks result reads if SRM p < 0.01, and creates an org-wide policy: "SRM = invalid experiment, no exceptions."',
    },
    lesson: 'SRM invalidates the randomisation assumption of the test. A significant p-value on a biased sample is not evidence — it\'s noise. The correct answer is always "rerun," not "ship."',
  },
  {
    id: 'offline_online_gap',
    title: 'Offline/Online Performance Gap',
    pressure: 'Your new model scores AUC=0.94 offline. After 6 hours in production, precision is 0.31 (down from champion\'s 0.71). Fraud ops is overwhelmed.',
    context: 'The new model was trained on 90 days of data and promoted this morning after shadow metrics looked comparable. Offline validation: AUC 0.94, precision 0.88. Production (6h): AUC 0.62, precision 0.31. Champion (still in shadow): AUC 0.92, precision 0.69.',
    decision: 'What do you do right now and what was the likely cause?',
    tiers: {
      junior:  'Roll back. Investigate later.',
      analyst: 'Roll back immediately. The champion is still in shadow and performing correctly — rollback risk is low. Likely cause: label leakage (offline precision 0.88 was too good) or a feature that\'s available in training but not at serving time.',
      senior:  'Rollback in <15 min. Immediately compare top feature importances between champion and challenger. Check if any feature has >0.15 importance and was derived from post-event data. Run a calibration check — a model with AUC 0.94 offline and 0.62 online has fundamentally different score distributions, pointing to feature leakage or serving-training skew. Post-mortem in 24h.',
      staff:   'All of the above plus: establish a promotion gate — if shadow AUC < champion AUC * 0.95, block automated promotion. Require an offline-to-online parity test before any fraud model promotion. Review the shadow instrumentation to understand why it didn\'t catch this.',
    },
    lesson: 'Offline AUC 0.94 → online AUC 0.62 is not a generalisation gap — it\'s a data integrity failure. Suspiciously good offline metrics are a red flag, not a green light.',
  },
  {
    id: 'drift_alert',
    title: 'Feature Drift Alert',
    pressure: 'PSI alert fires: input feature user_age_bucket has PSI=0.41 (alert threshold: 0.2). Product says no changes were made. Business metrics look normal.',
    context: 'The model is a 6-month-old churn predictor. user_age_bucket is the 3rd most important feature. PSI has been stable at 0.05–0.08 for 5 months. The spike happened overnight. Labels are delayed by 14 days so no performance signal yet.',
    decision: 'How do you respond? What are the possible causes and what do you investigate first?',
    tiers: {
      junior:  '"Alert fired, looking into it."',
      analyst: 'Checks the feature computation code and the upstream data source. Plots the distribution shift — is it a new bucket, a missing bucket, or a shift in proportions? Rules out pipeline bug before concluding it\'s real drift.',
      senior:  'Systematic triage: (1) Is this a data pipeline bug? Check upstream table row counts and schema. (2) Is this a population composition change? Check if a new user cohort was onboarded. (3) Is this a real behavioural shift? Check if the distribution change tracks with a product launch or external event. Only escalate to model team after ruling out pipeline cause. Sets a 14-day monitoring watch for model performance given label delay.',
      staff:   'All of the above plus: if this is real drift, initiates the retraining protocol. Defines a "PSI triage playbook" so any analyst can follow the same steps. Reviews whether the monitoring thresholds need calibration given this model\'s feature distributions.',
    },
    lesson: 'High PSI does not automatically mean model degradation — it means something changed. Pipeline bugs cause more high-PSI alerts than real drift. Always rule out instrumentation before concluding the world changed.',
  },
  {
    id: 'delayed_labels',
    title: 'Retraining with Delayed Labels',
    pressure: 'You\'re asked to retrain the model. 40% of events from the last 30 days don\'t have resolved labels yet (they\'re still in a 30-day observation window). Your manager says "just use what\'s available."',
    context: 'The model predicts 30-day conversion. Labels resolve 30 days after the event. Training data spans 12 months. The most recent 30 days have 40% label coverage. The model hasn\'t been retrained in 90 days and PSI alerts are firing on two features.',
    decision: 'How do you handle the label delay? What do you tell your manager?',
    tiers: {
      junior:  'Train on the 40% labelled subset from the last 30 days.',
      analyst: 'Exclude the last 30 days of events from training (not enough labels resolved). Train on events from 30+ days ago where labels are fully resolved. Tell manager: "Using partial labels introduces a survivorship bias — the 40% that resolved early may be the easiest cases. I\'ll use t-30 as the training cutoff."',
      senior:  'Uses t-30 cutoff for label completeness. But also checks the label distribution curve: how many labels resolve by day 7, 14, 21, 30? If 80% resolve by day 7, can train a proxy model on day-7 labels with a recalibration on fully-resolved labels. Quantifies the bias from using partial labels vs the staleness cost of using t-30 cutoff. Gives manager a concrete recommendation with tradeoff.',
      staff:   'All of the above plus: defines an organisational standard for label readiness (minimum 90% resolved before any event is used in training). Designs a two-model architecture: early-signal model (day-7 labels) + full-window model (day-30 labels), serving the early model where latency matters and the full model for long-horizon decisions.',
    },
    lesson: 'Training on partially-resolved labels is not "using what\'s available" — it\'s training on a biased sample. The models that resolve early are systematically different from the full population.',
  },
  {
    id: 'model_rollback',
    title: 'Model Rollback Decision',
    pressure: 'Your new model has been live for 8 hours (50% traffic). Primary A/B metric (CTR) is neutral (+0.1%, p=0.8). Secondary metric: support ticket volume is up 34% since launch. On-call is asking if you should roll back.',
    context: 'The new model is a recommendation system update. Training included 6 new item features. The support tickets are about "irrelevant recommendations." 50% of users are on the new model. The old champion is still serving the other 50%.',
    decision: 'Do you roll back? What is your decision framework?',
    tiers: {
      junior:  '"Primary metric is neutral, let it run."',
      analyst: '"Support tickets +34% is a guardrail metric breach. Roll back. Primary metric being neutral doesn\'t override a significant user-harm signal."',
      senior:  'Rolls back within 30 minutes. Defines the decision: guardrail metrics trump primary metric neutrality when there is a significant user harm signal (support tickets are a lagging but real signal). Post-rollback investigation: was the support ticket increase concentrated on a specific user segment or item category? Which of the 6 new features most correlates with low-quality recommendations?',
      staff:   'All of the above plus: enforces that guardrail metrics are pre-registered and blocking (not advisory). Adds support ticket rate as a formal guardrail metric for all recommendation experiments going forward. Defines rollback SLA: guardrail breach → rollback decision within 30 min, execution within 60 min.',
    },
    lesson: 'A neutral primary metric with a breached guardrail metric means "we stopped something bad, not proved something good." Roll back and understand before redeploying.',
  },
]

const SCENARIO_TIERS = [
  { key: 'junior',  label: 'Junior',  color: 'var(--ink-mid)' },
  { key: 'analyst', label: 'Analyst', color: 'var(--sky)' },
  { key: 'senior',  label: 'Senior',  color: 'var(--mint)' },
  { key: 'staff',   label: 'Staff',   color: 'var(--prime)' },
]

function IncidentScenarios() {
  const [idx,          setIdx]          = useState(0)
  const [showTiers,    setShowTiers]    = useState(false)
  const [selfAssessed, setSelfAssessed] = useState(null)

  const sc = SCENARIOS[idx]

  function nextScenario() {
    setIdx(i => Math.min(i + 1, SCENARIOS.length - 1))
    setShowTiers(false)
    setSelfAssessed(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.6, maxWidth: '560px' }}>
          Six real scenarios with business pressure. Read the situation, form your response, then reveal the tier breakdown.
        </p>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>{idx + 1} / {SCENARIOS.length}</span>
      </div>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {SCENARIOS.map((s, i) => (
          <button key={s.id} onClick={() => { setIdx(i); setShowTiers(false); setSelfAssessed(null) }}
            className={`sub-tab ${idx === i ? 'active' : 'inactive'}`} style={{ fontSize: '12px' }}>
            {s.title}
          </button>
        ))}
      </div>

      {/* Pressure card */}
      <div style={{ padding: '20px 24px', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.22)', borderRadius: '12px' }}>
        <div style={{ fontSize: '10px', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '8px' }}>Business pressure</div>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '15px', fontWeight: 500, color: 'var(--ink-hi)', lineHeight: 1.55, margin: 0 }}>"{sc.pressure}"</p>
      </div>

      {/* Context */}
      <div style={{ padding: '16px 20px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '10px' }}>
        <div style={{ fontSize: '10px', color: 'var(--sky)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '8px' }}>Context</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{sc.context}</p>
      </div>

      {/* Decision prompt */}
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: "'Space Grotesk',sans-serif" }}>
        {sc.decision}
      </div>
      <p style={{ fontSize: '12px', color: 'var(--ink-low)', margin: '-14px 0 0', fontStyle: 'italic' }}>Think through your answer first, then reveal the tier breakdown below.</p>

      {/* Reveal tiers */}
      {!showTiers ? (
        <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setShowTiers(true)}>Reveal tier breakdown →</button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SCENARIO_TIERS.map(t => (
            <div key={t.key} style={{ padding: '14px 18px', background: selfAssessed === t.key ? `${t.color}0f` : 'var(--depth)', border: `1px solid ${selfAssessed === t.key ? t.color + '40' : 'var(--rim)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.12s' }}
              onClick={() => setSelfAssessed(t.key)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '12px', color: t.color, minWidth: '50px' }}>{t.label}</span>
                {selfAssessed === t.key && <span style={{ fontSize: '10px', color: t.color, fontFamily: "'JetBrains Mono',monospace" }}>← your level</span>}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.tiers[t.key]}</p>
            </div>
          ))}

          {/* Lesson */}
          <div style={{ marginTop: '4px', padding: '14px 18px', background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.20)', borderRadius: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--sky)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '6px' }}>Key lesson</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{sc.lesson}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
            <button className="btn-primary" onClick={nextScenario} disabled={idx === SCENARIOS.length - 1}>Next scenario →</button>
            <button className="btn-ghost" onClick={() => { setIdx(0); setShowTiers(false); setSelfAssessed(null) }}>↺ Restart</button>
          </div>
        </div>
      )}

      {/* Dot progress */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {SCENARIOS.map((_, i) => (
          <button key={i} onClick={() => { setIdx(i); setShowTiers(false); setSelfAssessed(null) }}
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < idx ? 'var(--mint)' : i === idx ? 'var(--prime)' : 'var(--rim)', border: 'none', cursor: 'pointer', padding: 0 }} />
        ))}
      </div>
    </div>
  )
}

// ─── Coming-soon modules ──────────────────────────────────────────────────────
const COMING_SOON = [
  {
    icon: '🗺', name: 'ML System Design Canvas',
    desc: 'Structured framework for designing end-to-end ML systems. Problem framing → data → features → training → serving → monitoring.',
  },
  {
    icon: '🗼', name: 'Two-Tower Explorer',
    desc: 'Design a two-tower retrieval model for a real-time recommendation system. Embedding dims, negative sampling, ANN index tradeoffs.',
  },
  {
    icon: '⚡', name: 'Serving Tradeoff Lab',
    desc: 'Real-time vs near-real-time vs batch inference. Latency vs throughput. Batching strategies. Quantisation tradeoffs.',
  },
]

// ─── Tab shell ────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'incident',   label: 'ML Incident Room',      icon: '🚨', component: IncidentRoom },
  { id: 'ownership',  label: 'DS Ownership Chain',    icon: '⛓',  component: DSOwnershipChain },
  { id: 'scenarios',  label: 'Incident Scenarios',    icon: '🔥', component: IncidentScenarios },
]

export default function SystemDesignTab() {
  const [active, setActive] = useState('incident')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? IncidentRoom

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>🏗</span>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em' }}>ML System Design</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '580px' }}>
          End-to-end ML platform design — rec systems, fraud detection, search ranking — and the kind of failure diagnosis you face at 2am when something breaks.
        </p>
      </div>

      {/* Module tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>
            <span style={{ marginRight: '6px' }}>{m.icon}</span>{m.label}
          </button>
        ))}
        {COMING_SOON.map(m => (
          <button key={m.name} disabled className="sub-tab inactive" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
            {m.icon} {m.name} <span style={{ fontSize: '10px', marginLeft: '4px', color: 'var(--ink-ghost)' }}>soon</span>
          </button>
        ))}
      </div>

      <ActiveModule />
    </div>
  )
}
