// StartHereTab — onboarding skeleton. Content TBD.
// This is a placeholder wired into the sidebar; fill in content later.

export default function StartHereTab({ onNavigate }) {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--prime)', opacity: 0.7, marginBottom: '0.4rem' }}>
          Getting started
        </p>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)',
          margin: '0 0 0.6rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Start Here
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.6, maxWidth: 520 }}>
          New to ML Systems Lab? This guide walks you through the lab structure
          and suggests a learning path based on where you are.
        </p>
      </div>

      {/* Placeholder sections */}
      {[
        { label: 'What is this lab?',      desc: 'Overview of the lab structure and how rooms connect.' },
        { label: 'Pick your level',        desc: 'Not sure where to start? Use this to find your entry point.' },
        { label: 'Suggested path',         desc: 'A recommended order through Foundations → Practice → Interviews.' },
        { label: 'How to use the tracker', desc: 'Track progress, save items, and revisit later.' },
      ].map(({ label, desc }) => (
        <div key={label} style={{
          background: 'var(--surface)', border: '1px solid var(--rim)',
          borderRadius: 10, padding: '1rem 1.1rem', marginBottom: '0.65rem',
        }}>
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.25rem' }}>
            {label}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
            {desc}
          </p>
        </div>
      ))}

      <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-dim)', opacity: 0.5 }}>
        Content coming soon.
      </p>
    </div>
  );
}
