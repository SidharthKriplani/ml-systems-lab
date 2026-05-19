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
  { id: 'incident', label: 'ML Incident Room', icon: '🚨', component: IncidentRoom },
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
