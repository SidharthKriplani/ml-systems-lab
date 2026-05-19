import { useState } from 'react'

const MODULES = [
  {
    icon: '🗺', name: 'ML System Design Canvas',
    status: 'coming',
    desc: 'Structured framework for designing end-to-end ML systems. Problem framing → data → features → training → serving → monitoring. Work through a rec system or fraud detector with guided prompts at each stage.',
  },
  {
    icon: '🚨', name: 'ML Incident Room',
    status: 'coming',
    desc: 'A recommendation system is silently serving stale embeddings after a feature pipeline failure. You get a metrics dashboard, drift alert, feature freshness log, and serving latency graph. Diagnose the root cause by exploring evidence — not reading a walkthrough.',
  },
  {
    icon: '🗼', name: 'Two-Tower Explorer',
    status: 'coming',
    desc: 'Design a two-tower retrieval model for a real-time recommendation system. Configure embedding dimensions, negative sampling strategy, and ANN index. Understand the retrieval-ranking tradeoff.',
  },
  {
    icon: '⚡', name: 'Serving Tradeoff Lab',
    status: 'coming',
    desc: 'Real-time vs near-real-time vs batch inference. Latency vs throughput. Batching strategies. Quantisation tradeoffs. Configure for a given SLA and see cost implications.',
  },
]

export default function SystemDesignTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>🏗</span>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: '#eaecff', letterSpacing: '-0.04em' }}>ML System Design</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#525a82', lineHeight: 1.6, maxWidth: '580px' }}>
          End-to-end ML platform design — rec systems, fraud detection, search ranking — and the kind of failure diagnosis you face at 2am when something breaks.
        </p>
      </div>

      <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', fontSize: '13px', color: '#f59e0b' }}>
        🚧 Under construction — the ML Incident Room is the first hero module planned for this track. In the meantime, use the Interview Prep → System Design questions for ML system design practice.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {MODULES.map(m => (
          <div key={m.name} className="card" style={{ opacity: 0.75, border: '1px dashed #1c2040' }}>
            <div style={{ fontSize: '22px', marginBottom: '10px' }}>{m.icon}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '15px', color: '#eaecff' }}>{m.name}</span>
              <span className="badge badge-amber" style={{ fontSize: '10px' }}>Coming soon</span>
            </div>
            <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.65, margin: 0 }}>{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
