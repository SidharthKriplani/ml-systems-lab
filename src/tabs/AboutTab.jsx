import { BrandMark } from '../components/BrandMark.jsx'

const COMMUNITY_URL = 'https://chat.whatsapp.com/JbIaqV87fwh8Ym3ufH5CFx?mode=gi_t'
const EMAIL = 'sidharthkriplani@gmail.com'
const LINKEDIN = 'https://www.linkedin.com/in/sidharth-kriplani'

const SIBLINGS = [
  { name: 'Product Analytics Lab', url: 'https://product-analytics-lab.vercel.app', desc: 'SQL, product sense, experimentation, and metrics.' },
  { name: 'Programming Lab', url: 'https://programming-lab.vercel.app', desc: 'SWE-for-data fluency — predict the output, keep the reflex.' },
  { name: 'GenAI Systems Lab', url: 'https://genai-systems-lab-ivory.vercel.app', desc: 'LLMs, RAG, agents, and GenAI system design.' },
]

const SECTIONS = [
  {
    title: 'What this is',
    body: `ML Systems Lab (MSL) is a focused prep environment for senior and staff Machine Learning Engineer and Data Scientist interviews — the classical ML, deep learning, evaluation, production-engineering, and system-design work those loops actually test.

The gap MSL fills: most ML prep teaches you what gradient boosting, cross-validation, or a serving architecture is. Very few give you practice making the calls that decide real interviews — which model to reach for under a latency budget, how to catch the leakage that inflated your offline AUC, when a simpler baseline beats the deep model, how to defend a training/serving-skew fix under questioning. MSL puts you in the decision, not the definition.

The MLE Path — a guided curriculum of interactive foundation modules across observation discipline, math, classical ML, evaluation, production engineering, MLOps, and system design — plus a large practice bank, judgment drills, cross-domain challenges, runnable coding rounds, whiteboard design drills, per-company tracks, and a readiness signal that tells you where you stand.`,
  },
  {
    title: 'The four things interviews test',
    body: `MSL is part of BreakLabs, built around the four competencies an MLE/DS loop — and the job itself — actually tests:

KNOW — do you know the field cold? Bias/variance, generalization bounds, boosting mechanics, AUC and calibration, backprop, regularization, serving and MLOps. (In MSL: the KNOW foundations and the MLE Path.)

DO — can you execute, not just recite? Turn a spec into working numpy — implement a loss, a metric, a training step — and get it graded against hidden tests. (In MSL: the Implement drills in the coding rounds, plus the Programming Lab sibling for raw code fluency.)

BUILD — can you own an ML system end to end and defend the architecture? Data, features, training, serving, monitoring, and the failure modes at each seam. (In MSL: the System Design modules and whiteboard Design Drills.)

JUDGE — given real constraints and ambiguity, do you make the right call? Simpler-vs-deeper, offline-vs-online metrics, when to ship, what to cut. (In MSL: the JUDGE drills, Spot the Flaw, Code Bugs, and Cross-Domain Challenges.)

Judgment and system design are the moat. Recall is table stakes and models can do it; the reason MSL exists is that judgment and design are what decide senior and staff loops — and almost nothing else practices them systematically.`,
  },
  {
    title: 'How the lab is organised',
    body: `MSL groups its surfaces into the frames you move through as you prep, plus an interview layer on top:

KNOW — build recall and depth. Foundations spans the full MLE curriculum: observation discipline and math, classical ML, deep learning, evaluation and validation, optimization, production engineering, MLOps, recsys, and pricing/economics. The MLE Path stitches these into an ordered, guided walk with completion tracking.

DO — get fluent. The coding rounds run in two modes: read-and-reason walkthroughs, and runnable Implement drills that grade your numpy against hidden assertions in the browser.

BUILD — own the system. System Design modules teach the components and tradeoffs; the whiteboard Design Drills stage an attempt-then-reveal exercise scored against a multi-dimension rubric.

JUDGE — pressure-test judgment. Judgment drills, Spot the Flaw, Code Bugs, Case Studies, and Cross-Domain Challenges each put you in a decision under realistic constraints rather than a definition check.

PREP & ASSESS — rehearse under interview conditions. Interview Prep questions, the Cheatsheet for rapid revision, Behavioral Bank, and Company Tracks (per-company interview intel and question slices).

A personal strip ties it together: Home, Start Here, My Progress, My Tracks (save items into custom study lists), Profile, Leaderboard, and this About page.`,
  },
  {
    title: 'How you answer — the depth model',
    body: `MSL content is pitched at how a good interviewer actually pushes: state it, then reason past the definition, then make a call under constraints.

Every foundation module runs a causal chain — a scene, the mechanism, the numbers worked through by hand, and the takeaway — so you understand why a method behaves the way it does, not just what it is. Where a module has a Quick-recap, you can toggle to a distilled one-line-per-point view once you have read the full version.

The judgment surfaces hide the answer until you commit. You reason first, then reveal — the way a real loop makes you defend a call before it tells you whether you were right. The debrief explains not just the correct answer but the failure mode that traps most candidates.`,
  },
  {
    title: 'Community',
    body: `Prep is better with people. The WhatsApp community is where people ask questions, share interview experiences, and help each other through the same MLE and DS loops.

Sign in (optional) to sync your progress across devices and appear on the Leaderboard. Your Profile carries your readiness score, MLE Path progress, and practice stats; the Leaderboard ranks by total solved across the lab.`,
  },
  {
    title: 'How it differs',
    body: `Generic ML courses (Coursera, fast.ai, YouTube crash courses): excellent for learning what the pieces are. MSL is not a course — it is a judgment and design gym. It assumes you can learn the math elsewhere and drills the part courses skip: making the modeling, evaluation, and architecture calls that decide the loop.

ML question banks and flashcard decks: strong for recall. MSL treats recall as the floor. The Implement drills, Design Drills, Spot the Flaw, and Cross-Domain Challenges exist to push you into execution, system design, and tradeoffs — the questions that are actually asked once the interviewer knows you can define the terms.

Bootcamps and generalist prep platforms: broad but shallow on senior ML. MSL is narrow on purpose — classical ML depth, evaluation instinct, production failure modes, and ML system design, practiced as judgment and design rather than definitions. That specific gap is what MSL targets.`,
  },
  {
    title: 'Difficulty & tiers',
    body: `Content across MSL is pitched at the level a senior-toward-staff loop operates at, and practice is tagged by difficulty:

Foundational — the entry check. Know the concept and apply it correctly in context. Good for warming up or scanning a weak area.

Senior — chain concepts or handle a data trap. The level most senior IC interviews operate at. This is where most MSL prep time should go.

Staff — judgment calls with incomplete information, tradeoff decisions, and system-design ownership beyond the immediate technical answer. Used for staff+ prep, the Design Drills, and the harder Cross-Domain Challenges.

Filter by difficulty in the practice browsers, and use the Design Drills and Cross-Domain Challenges when you want the top tier under pressure.`,
  },
  {
    title: 'Technical details',
    body: `React + Vite single-page app. Content ships as JavaScript data files and interactive components; your progress is stored in your browser's localStorage. Sign in (optional) to sync across devices and appear on the Leaderboard.

The runnable coding rounds execute Python in the browser via Pyodide (WASM) — no server-side execution. Everything runs client-side.

Deployed on Vercel; works offline once loaded. Currently in beta — free with an access code.`,
  },
]

export default function AboutTab({ onNavigate }) {
  const go = (v) => { if (onNavigate) onNavigate(v) }

  const s = {
    wrap: { maxWidth: 760, margin: '0 auto', padding: '32px 20px 80px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' },
    h1: { fontSize: 28, fontWeight: 800, margin: '14px 0 6px', letterSpacing: '-0.02em', color: 'var(--ink-hi)' },
    sub: { fontSize: 14, color: 'var(--ink-low)', lineHeight: 1.6, margin: '0 0 28px' },
    jumpRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 30 },
    jump: { fontSize: 12, fontWeight: 700, borderRadius: 8, padding: '6px 12px', background: 'var(--prime)', color: '#000', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)' },
    section: { marginBottom: 30 },
    h2: { fontSize: 15, fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 12px', paddingBottom: 8, borderBottom: '1px solid var(--rim)' },
    body: { fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.75, whiteSpace: 'pre-line' },
    card: { background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: '18px 20px', marginBottom: 12 },
    cardH2: { fontSize: 15, fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 8px' },
    cardP: { fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.7, margin: '0 0 14px' },
    ctaPrime: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--prime)', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', textDecoration: 'none' },
    ctaGhost: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--depth)', color: 'var(--ink-hi)', fontWeight: 700, fontSize: 13, border: '1px solid var(--rim-hi)', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', textDecoration: 'none' },
    contactMeta: { fontSize: 11, color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', margin: '14px 0 0' },
    sibLabel: { fontSize: 11, fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '36px 0 8px' },
    sibIntro: { fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.6, margin: '0 0 14px' },
    sibLink: { color: 'var(--ink-hi)', textDecoration: 'none', fontWeight: 700, fontSize: 15 },
    sibDesc: { fontSize: 13, color: 'var(--ink-low)', marginTop: 4, lineHeight: 1.5 },
  }

  return (
    <div style={s.wrap}>
      <BrandMark variant="full" descriptor="ML Systems" size={20} />
      <h1 style={s.h1}>About ML Systems Lab</h1>
      <p style={s.sub}>What it is, how it's organised, and how to get value from it.</p>

      {/* Quick jumps */}
      <div style={s.jumpRow}>
        <button onClick={() => go('start_here')} style={s.jump}>Start Here →</button>
        <button onClick={() => go('gradient')} style={s.jump}>Foundations →</button>
        <button onClick={() => go('company_tracks')} style={s.jump}>Company Tracks →</button>
        <button onClick={() => go('home')} style={s.jump}>My Progress →</button>
      </div>

      {SECTIONS.map((sec, i) => (
        <div key={i} style={s.section}>
          <h2 style={s.h2}>{sec.title}</h2>
          <div style={s.body}>{sec.body}</div>
        </div>
      ))}

      {/* Community */}
      <div style={s.card}>
        <h2 style={s.cardH2}>Join the community</h2>
        <p style={s.cardP}>
          Prep is better with people. Ask questions, share interview experiences, and get help from others going through the same loops.
        </p>
        <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" style={s.ctaPrime}>
          Join the WhatsApp community →
        </a>
      </div>

      {/* Feedback & contact */}
      <div style={s.card}>
        <h2 style={s.cardH2}>Feedback, issues & suggestions</h2>
        <p style={s.cardP}>
          MSL is built and maintained by Sidharth Kriplani. Found a bug, have feedback, or want to
          suggest a question or a module? Reach out — every message is read.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <a href={`mailto:${EMAIL}`} style={s.ctaPrime}>Email Sidharth</a>
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" style={s.ctaGhost}>Connect on LinkedIn</a>
          <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" style={s.ctaGhost}>Join the community</a>
        </div>
        <p style={s.contactMeta}>{EMAIL} · linkedin.com/in/sidharth-kriplani</p>
      </div>

      {/* Siblings */}
      <div style={s.sibLabel}>Part of BreakLabs</div>
      <p style={s.sibIntro}>
        ML Systems Lab is one of a family of interview-prep labs. Each owns a domain and links out to the others:
      </p>
      {SIBLINGS.map(l => (
        <div key={l.name} style={s.card}>
          <a href={l.url} target="_blank" rel="noopener noreferrer" style={s.sibLink}>{l.name} ↗</a>
          <div style={s.sibDesc}>{l.desc}</div>
        </div>
      ))}
    </div>
  )
}
