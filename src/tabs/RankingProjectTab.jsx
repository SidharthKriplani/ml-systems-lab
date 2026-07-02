import React from 'react'
import { ProjectLabSkeleton } from './ProjectLabSkeleton.jsx'

const SPEC = {
  kicker: 'Project Lab · Ranking',
  title: 'Build a Recommender: Retrieve → Rank → Serve',
  subtitle: 'The archetype every RecSys / ranking DS interview probes, end to end — candidate generation, a learning-to-rank model, offline NDCG, and an online A/B with guardrails.',
  archetype: 'Ranking / recommender systems (two-stage retrieval + LTR). Distinct from the tabular-classification labs — the metric, the leakage traps, and the offline↔online gap are all different.',
  why: 'Tabular classification labs never exercise the things ranking interviews actually test: why you retrieve before you rank, how a pairwise/listwise loss differs from log-loss, why offline NDCG and online engagement diverge, and how position bias quietly corrupts your labels. This lab makes each of those a decision you have to make and defend.',
  phases: [
    { name: 'Candidate generation', desc: 'Two-tower / co-occurrence retrieval over a catalog; measure recall@K against a held-out relevant set and find the recall ceiling the ranker inherits.' },
    { name: 'Feature & label construction', desc: 'Build ranking features and implicit-feedback labels from logged interactions — confront position bias and the "clicks aren’t relevance" problem before training.' },
    { name: 'Learning to rank', desc: 'Train pointwise vs pairwise vs listwise (LambdaMART / softmax) and watch NDCG@10 move; decide which loss the objective actually calls for.' },
    { name: 'Offline evaluation', desc: 'NDCG, MAP, recall@K, and calibration; slice by cold vs warm items and by popularity to expose where the model is weak.' },
    { name: 'Online design & guardrails', desc: 'Design the A/B: primary engagement metric, retention guardrail, interleaving option, and an exploration slice so the feedback loop doesn’t collapse to popularity.' },
  ],
  checkpoints: [
    'Retrieval recall@K caps ranker quality — if recall is 0.55, no ranker can exceed it. Do you diagnose the funnel or blame the model?',
    'Choosing the ranking loss: when does listwise (NDCG-aligned) beat pairwise, and when is pointwise good enough?',
    'Position bias in implicit labels — inverse-propensity weighting or a bias tower, and how you’d validate the correction.',
    'The offline-online gap: your NDCG went up but engagement didn’t. Where do you look first?',
    'Exploration vs exploitation in serving — how much traffic to explore, and what breaks if you explore zero.',
  ],
  datasetNote: 'Planned dataset: a MovieLens-style or synthetic audio-catalog interaction log, runnable in-browser via Pyodide. Small enough to train live, real enough to show the traps.',
}

export function RankingProjectTab() {
  return <ProjectLabSkeleton spec={SPEC} />
}

export default RankingProjectTab
