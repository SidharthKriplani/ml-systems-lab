import { BrandMark } from '../components/BrandMark.jsx'

const COMMUNITY_URL = 'https://chat.whatsapp.com/JbIaqV87fwh8Ym3ufH5CFx?mode=gi_t'

const SIBLINGS = [
  { name: 'Product Analytics Lab', url: 'https://product-analytics-lab.vercel.app', desc: 'SQL, product sense, experimentation, and metrics.' },
  { name: 'Programming Lab', url: 'https://programming-lab.vercel.app', desc: 'SWE-for-data fluency — predict the output, keep the reflex.' },
  { name: 'GenAI Systems Lab', url: 'https://genai-systems-lab-ivory.vercel.app', desc: 'LLMs, RAG, agents, and GenAI system design.' },
]

export default function AboutTab({ onNavigate }) {
  const s = {
    wrap: { maxWidth: 760, margin: '0 auto', padding: '12px 6px 56px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' },
    h1: { fontSize: 28, fontWeight: 800, margin: '14px 0 8px', letterSpacing: '-0.02em' },
    lead: { fontSize: 15, color: 'var(--ink-mid)', lineHeight: 1.65, margin: '0 0 22px' },
    h2: { fontSize: 13, fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '26px 0 10px' },
    p: { fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.7, margin: '0 0 12px' },
    card: { background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: '16px 18px', marginBottom: 12 },
    cta: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--prime)', color: '#000', fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 9, padding: '11px 18px', cursor: 'pointer', textDecoration: 'none' },
    link: { color: 'var(--ink-hi)', textDecoration: 'underline', textUnderlineOffset: 3 },
  }

  return (
    <div style={s.wrap}>
      <BrandMark variant="wordmark" size={20} />
      <h1 style={s.h1}>ML Systems Lab</h1>
      <p style={s.lead}>
        A focused prep environment for senior & staff Machine Learning Engineer / Data Scientist interviews.
        It's organised around the four ways interviews actually assess you — <strong>KNOW</strong> (recall & depth),
        <strong> DO</strong> (coding fluency), <strong>BUILD</strong> (ownership), and <strong>JUDGE</strong> (judgment) —
        plus a rehearsal layer to practise and a readiness signal to tell you where you stand.
      </p>

      <h2 style={s.h2}>Join the community</h2>
      <div style={s.card}>
        <p style={{ ...s.p, marginBottom: 14 }}>
          Prep is better with people. Ask questions, share interview experiences, and get help from others going through the same loops.
        </p>
        <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" style={s.cta}>
          Join the WhatsApp community →
        </a>
      </div>

      <h2 style={s.h2}>How to use it</h2>
      <p style={s.p}>
        Start at <button onClick={() => onNavigate && onNavigate('start_here')} style={{ ...s.link, background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>Start Here</button> for
        a guided path, or jump straight into <strong>KNOW</strong> foundations to learn, <strong>JUDGE</strong> for judgment drills and Cross-Domain Challenges,
        and <strong>PREP &amp; ASSESS</strong> to rehearse interview questions. <strong>My Progress</strong> tracks your readiness and points you at your weakest area.
      </p>

      <h2 style={s.h2}>Part of BreakLabs</h2>
      <p style={s.p}>ML Systems Lab is one of a family of interview-prep labs. Each owns a domain and links out to the others:</p>
      {SIBLINGS.map(l => (
        <div key={l.name} style={s.card}>
          <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ ...s.link, fontWeight: 700, fontSize: 15 }}>{l.name} ↗</a>
          <div style={{ fontSize: 13, color: 'var(--ink-low)', marginTop: 4, lineHeight: 1.5 }}>{l.desc}</div>
        </div>
      ))}
    </div>
  )
}
