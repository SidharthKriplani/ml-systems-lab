import { useState, useEffect, useRef, useCallback } from 'react';

// Structured spoken-drill question bank. Reuses VerbatimTab's categories so the
// filter behaves the same across both tabs.
const QUESTIONS = [
  { id: 1, category: 'System Design', text: 'Walk me through how you would design a real-time recommendation system for a platform with 100 million users.', pushback: 'The interviewer says: "That two-tower setup doubles your serving cost. Defend it — why not a single ranker?"' },
  { id: 2, category: 'Technical', text: 'Explain the difference between bagging and boosting and when you\'d use each.', pushback: 'The interviewer says: "If boosting is so accurate, why would anyone ever bag? Give me a concrete case."' },
  { id: 3, category: 'System Design', text: 'How would you build a feature store from scratch? What are the key components?', pushback: 'The interviewer says: "You said point-in-time correctness matters. Prove your design actually prevents leakage."' },
  { id: 4, category: 'Behavioral', text: 'Tell me about a time a model you built failed in production. What happened and what did you learn?', pushback: 'The interviewer says: "It sounds like it was someone else\'s fault. What would YOU do differently?"' },
  { id: 5, category: 'Technical', text: 'What is gradient boosting? Walk me through the algorithm step by step.', pushback: 'The interviewer says: "You waved past the loss function. Write out what the residuals actually are."' },
  { id: 6, category: 'System Design', text: 'Design an A/B testing platform for a company running 100 concurrent experiments.', pushback: 'The interviewer says: "100 concurrent tests means interaction effects. How do you stop them corrupting each other?"' },
  { id: 7, category: 'Trade-offs', text: 'When would you choose a simpler model over a more complex one, even if the complex model has better offline metrics?', pushback: 'The interviewer says: "Better offline metrics is better, full stop. Convince me you\'re not just being lazy."' },
  { id: 8, category: 'Technical', text: 'Explain attention mechanisms in transformers. What problem do they solve?', pushback: 'The interviewer says: "Attention is O(n squared). At long context that\'s brutal — how do you make it viable?"' },
  { id: 9, category: 'System Design', text: 'How would you monitor a production ML model end-to-end?', pushback: 'The interviewer says: "Your dashboards are all green but users are complaining. What did your monitoring miss?"' },
  { id: 10, category: 'Behavioral', text: 'Describe a situation where you had to push back on a stakeholder\'s request. How did you handle it?', pushback: 'The interviewer says: "The stakeholder outranked you. Why should they have listened to you at all?"' },
  { id: 11, category: 'Technical', text: 'What is training-serving skew and how do you prevent it?', pushback: 'The interviewer says: "You claim your feature pipeline is shared. Where does skew still sneak in anyway?"' },
  { id: 12, category: 'Case Study', text: 'A fraud detection model\'s false positive rate spiked overnight. Walk through your investigation.', pushback: 'The interviewer says: "You checked the data first. What if the data looks perfectly fine — then what?"' },
  { id: 13, category: 'Trade-offs', text: 'What are the tradeoffs between online learning and batch retraining?', pushback: 'The interviewer says: "Online learning sounds strictly better — always fresh. What breaks in practice?"' },
  { id: 14, category: 'Technical', text: 'Explain how NDCG works and when you\'d use it over AUC.', pushback: 'The interviewer says: "AUC is simpler and everyone knows it. Justify the extra complexity of NDCG."' },
  { id: 15, category: 'System Design', text: 'Design a data pipeline that ensures point-in-time correct features for model training.', pushback: 'The interviewer says: "A backfill just landed late-arriving data. Does your design silently corrupt old labels?"' },
  { id: 16, category: 'Behavioral', text: 'Tell me about the most technically complex ML project you\'ve worked on.', pushback: 'The interviewer says: "Complexity for its own sake is a red flag. Was any of that complexity actually avoidable?"' },
  { id: 17, category: 'Technical', text: 'What is causal inference and why does it matter for ML systems?', pushback: 'The interviewer says: "Your model already predicts well. Why should I care whether the relationship is causal?"' },
  { id: 18, category: 'Trade-offs', text: 'When would you use a neural network vs. gradient boosting for a tabular dataset?', pushback: 'The interviewer says: "Deep learning wins everywhere now. Defend picking gradient boosting on tabular data."' },
  { id: 19, category: 'System Design', text: 'How would you design a model serving infrastructure that handles multiple models with different latency SLOs?', pushback: 'The interviewer says: "One heavy model is starving the fast ones. How does your design isolate them?"' },
  { id: 20, category: 'Behavioral', text: 'How do you decide when a model is ready to ship to production?', pushback: 'The interviewer says: "Offline metrics passed but you delayed the launch. Justify the cost of that delay."' },
  { id: 21, category: 'Technical', text: 'Explain the curse of dimensionality and its practical implications.', pushback: 'The interviewer says: "More features means more signal. Explain why that intuition is wrong here."' },
  { id: 22, category: 'Case Study', text: 'A recommendation model\'s diversity metrics dropped after a new training run. What do you investigate?', pushback: 'The interviewer says: "Engagement went UP though. Why not just ship the less-diverse model?"' },
  { id: 23, category: 'Trade-offs', text: 'What are the tradeoffs of using a large monolithic model vs. a cascade of smaller models?', pushback: 'The interviewer says: "A cascade means more moving parts to break. Is it really worth the operational cost?"' },
  { id: 24, category: 'Technical', text: 'How does dropout work and why does it reduce overfitting?', pushback: 'The interviewer says: "At inference you turn dropout off. Why doesn\'t that break everything you trained?"' },
  { id: 25, category: 'System Design', text: 'Design the ML infrastructure for a real-time pricing system.', pushback: 'The interviewer says: "Two users see different prices for the same item. How do you defend that isn\'t a bug or worse?"' },
  { id: 26, category: 'System Design', text: 'Design a real-time anomaly detection system for financial transactions processing 500k events per second.', pushback: 'The interviewer says: "At 500k eps your model adds latency to every transaction. How do you keep it under budget?"' },
  { id: 27, category: 'System Design', text: 'Walk me through the architecture of a two-tower retrieval system. How does it scale to 1 billion items?', pushback: 'The interviewer says: "A billion embeddings won\'t fit in memory. Where does your design actually break?"' },
  { id: 28, category: 'System Design', text: 'How would you design an ML platform that allows 200 data scientists to train and deploy models independently?', pushback: 'The interviewer says: "200 people deploying freely sounds like chaos. What stops a bad model reaching prod?"' },
  { id: 29, category: 'Technical', text: 'What is the difference between L1 and L2 regularization? When does L1 produce sparsity and why?', pushback: 'The interviewer says: "Explain geometrically WHY L1 hits zero and L2 doesn\'t. No hand-waving."' },
  { id: 30, category: 'Technical', text: 'Walk me through backpropagation. How does the chain rule apply across layers?', pushback: 'The interviewer says: "Ten layers deep, your gradients vanish. Show me exactly where the signal dies."' },
  { id: 31, category: 'Case Study', text: 'After deployment, your fraud model\'s precision dropped from 72% to 41% in 2 weeks. Walk through your investigation.', pushback: 'The interviewer says: "You blame drift. What if the training data was wrong from day one instead?"' },
  { id: 32, category: 'Trade-offs', text: 'When would you choose LightGBM over a deep learning model for a tabular prediction task?', pushback: 'The interviewer says: "The DL model had 3% higher AUC. Convince me LightGBM is still the right call."' },
];

const CATEGORY_COLORS = {
  'System Design': 'var(--prime)',
  'Technical': 'var(--prime)',
  'Behavioral': 'var(--prime)',
  'Case Study': 'var(--prime)',
  'Trade-offs': 'var(--prime)',
};

const CATEGORY_BG = {
  'System Design': 'var(--prime-bg-light)',
  'Technical': 'var(--prime-bg-light)',
  'Behavioral': 'var(--prime-bg-light)',
  'Case Study': 'var(--prime-bg-light)',
  'Trade-offs': 'var(--prime-bg-light)',
};

// The 4-tier structured spoken drill. Each tier has a target time and a distinct
// coaching prompt. Tiers 3 and 4 replace the base question with a pointed prompt.
const TIERS = [
  {
    key: 'headline',
    label: '30-Second Answer',
    targetSec: 30,
    kicker: 'Tier 1 of 4',
    instruction: 'Give the crisp headline. If you only had 30 seconds, what is the single sharpest version of your answer?',
    check: 'Did you land the core point inside 30 seconds, with no rambling preamble?',
  },
  {
    key: 'full',
    label: '2-Minute Answer',
    targetSec: 120,
    kicker: 'Tier 2 of 4',
    instruction: 'Now give the full structured answer. State your framework, walk the key steps, and close with a tradeoff or decision.',
    check: 'Was it structured (framework, then steps, then a close) and did you finish near the 2-minute mark?',
  },
  {
    key: 'pushback',
    label: 'Interviewer Pushback',
    targetSec: 60,
    kicker: 'Tier 3 of 4',
    instruction: 'The interviewer just challenged you. Hold your ground or concede cleanly, but respond directly to the pushback.',
    check: 'Did you address the actual challenge head-on instead of repeating your first answer?',
    usePushback: true,
  },
  {
    key: 'reason',
    label: 'Reason When Unsure',
    targetSec: 90,
    kicker: 'Tier 4 of 4',
    instruction: 'Pretend you do not fully know the answer. Say out loud how you would reason toward one — what you would assume, test, and check. Reasoning under uncertainty is a senior signal.',
    check: 'Did you narrate a clear reasoning path (assumptions, checks, how you\'d verify) rather than bluffing certainty?',
    reasonPrompt: true,
  },
];

function CategoryBadge({ category }) {
  return (
    <span style={{
      background: CATEGORY_BG[category] || 'rgba(255,255,255,0.15)',
      color: CATEGORY_COLORS[category] || 'var(--ink-mid)',
      border: `1px solid ${CATEGORY_COLORS[category] || 'var(--rim)'}33`,
      borderRadius: 20,
      padding: '3px 10px',
      fontSize: 11,
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {category}
    </span>
  );
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SpokenPracticeTab({ onNavigate }) {
  const [screen, setScreen] = useState('select');
  const [selectedQ, setSelectedQ] = useState(null);
  const [tierIndex, setTierIndex] = useState(0);
  const [filterCategory, setFilterCategory] = useState('All');

  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [fallbackText, setFallbackText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [selfCheck, setSelfCheck] = useState(null); // true | false | null
  const [practiced, setPracticed] = useState({}); // { [qId]: true }

  const recognitionRef = useRef(null);
  const isStoppingRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition || isIOS) setSpeechSupported(false);
    } catch {
      setSpeechSupported(false);
    }
    try {
      const saved = localStorage.getItem('msl_spoken_practiced');
      if (saved) setPracticed(JSON.parse(saved));
    } catch {}
  }, []);

  // Live timer that runs only while recording.
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    isStoppingRef.current = true;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } catch {}
    setIsRecording(false);
    setInterimTranscript('');
    setTimeout(() => { isStoppingRef.current = false; }, 300);
  }, []);

  // Same Web Speech engine as VerbatimTab: continuous + interimResults, append
  // finals to the transcript, guard onend double-fire.
  const startRecording = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        // Start at event.resultIndex so only NEW results are processed. With
        // continuous=true, event.results accumulates the whole session; looping
        // from 0 would re-append every finalized result on every event (runaway
        // duplication). resultIndex points at the first result changed this event.
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }
        if (finalText) setFinalTranscript(prev => prev + finalText);
        setInterimTranscript(interim);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        if (isStoppingRef.current) return;
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }, []);

  function resetTierState() {
    stopRecording();
    setFinalTranscript('');
    setInterimTranscript('');
    setFallbackText('');
    setElapsed(0);
    setSelfCheck(null);
  }

  function handleSelectQuestion(q) {
    setSelectedQ(q);
    setTierIndex(0);
    resetTierState();
    setScreen('drill');
  }

  function handleNextTier() {
    if (tierIndex < TIERS.length - 1) {
      setTierIndex(i => i + 1);
      resetTierState();
    } else {
      // Finished all 4 tiers — mark practiced and return to list.
      if (selectedQ) {
        const updated = { ...practiced, [selectedQ.id]: true };
        setPracticed(updated);
        try { localStorage.setItem('msl_spoken_practiced', JSON.stringify(updated)); } catch {}
      }
      resetTierState();
      setScreen('select');
    }
  }

  function handleBackToList() {
    resetTierState();
    setScreen('select');
  }

  const categories = ['All', ...Array.from(new Set(QUESTIONS.map(q => q.category)))];
  const filteredQuestions = filterCategory === 'All' ? QUESTIONS : QUESTIONS.filter(q => q.category === filterCategory);
  const practicedCount = Object.keys(practiced).length;

  // ---- Select screen ----
  if (screen === 'select') {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 8px' }}>
            Spoken Practice
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-mid)', margin: '0 0 4px' }}>
            Answer aloud, under pressure, in a structured 4-tier drill.
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-low)', margin: '0 0 4px', lineHeight: 1.5 }}>
            For each question you run four spoken reps against a timer: a 30-second headline, a 2-minute full answer, an interviewer pushback, and a reason-when-unsure rep. This trains the gap between knowing the answer and saying it well.
          </p>
          {practicedCount > 0 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-low)', margin: 0 }}>
              {practicedCount} question{practicedCount !== 1 ? 's' : ''} drilled
            </p>
          )}
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                background: filterCategory === cat ? (CATEGORY_BG[cat] || 'rgba(240,165,0,0.15)') : 'var(--surface)',
                color: filterCategory === cat ? (CATEGORY_COLORS[cat] || 'var(--prime)') : 'var(--ink-mid)',
                border: `1px solid ${filterCategory === cat ? (CATEGORY_COLORS[cat] || 'var(--prime)') + '55' : 'var(--rim)'}`,
                borderRadius: 20,
                padding: '5px 14px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: filterCategory === cat ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredQuestions.map(q => (
            <button
              key={q.id}
              onClick={() => handleSelectQuestion(q)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--rim)',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-ghost)', flexShrink: 0, paddingTop: 2 }}>
                {String(q.id).padStart(2, '0')}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-hi)', lineHeight: 1.5, marginBottom: 6 }}>
                  {q.text}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CategoryBadge category={q.category} />
                  {practiced[q.id] && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--prime)' }}>
                      drilled
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---- Drill screen ----
  const tier = TIERS[tierIndex];
  const transcript = speechSupported ? finalTranscript : fallbackText;
  const hasContent = transcript.trim().length > 0;
  const target = tier.targetSec;
  const overTarget = elapsed > target;
  const isLastTier = tierIndex === TIERS.length - 1;

  // The prompt shown to the user changes per tier: pushback and reason tiers
  // reframe the base question.
  let promptText = selectedQ.text;
  if (tier.usePushback) promptText = selectedQ.pushback;
  if (tier.reasonPrompt) promptText = `${selectedQ.text}  —  but pretend you don't fully know: reason it out loud.`;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={handleBackToList}
          style={{ background: 'var(--surface)', color: 'var(--ink-mid)', border: '1px solid var(--rim)', borderRadius: 8, padding: '7px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}
        >
          ← Back
        </button>
        <CategoryBadge category={selectedQ.category} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-ghost)' }}>
          Q{String(selectedQ.id).padStart(2, '0')}
        </span>
      </div>

      {/* Tier progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {TIERS.map((t, i) => (
          <div
            key={t.key}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= tierIndex ? 'var(--prime)' : 'var(--rim)',
              opacity: i === tierIndex ? 1 : (i < tierIndex ? 0.6 : 1),
            }}
          />
        ))}
      </div>

      {/* Tier header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          {tier.kicker} · target {fmt(tier.targetSec)}
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 700, color: 'var(--ink-hi)' }}>
          {tier.label}
        </div>
      </div>

      {/* Prompt card */}
      <div style={{ background: 'var(--surface)', border: `1px solid ${tier.usePushback ? 'rgba(240,165,0,0.4)' : 'var(--rim)'}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--ink-hi)', margin: '0 0 10px', lineHeight: 1.55 }}>
          {promptText}
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>
          {tier.instruction}
        </p>
      </div>

      {/* Timer vs target */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 28,
          fontWeight: 700,
          color: overTarget ? 'var(--prime)' : 'var(--ink-hi)',
        }}>
          {fmt(elapsed)}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-low)' }}>
          / {fmt(target)} target
          {overTarget && <span style={{ color: 'var(--prime)', marginLeft: 8 }}>over target</span>}
        </div>
        {/* target progress bar */}
        <div style={{ flex: 1, height: 6, background: 'var(--rim)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, (elapsed / target) * 100)}%`,
            height: '100%',
            background: overTarget ? 'var(--prime)' : 'var(--ink-low)',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* No-speech fallback notice */}
      {!speechSupported && (
        <div style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--prime)' }}>
          {/iPad|iPhone|iPod/.test(navigator.userAgent)
            ? 'Voice recording is not supported on iOS Safari. Still practise aloud against the timer, then type what you said below.'
            : 'Web Speech API not supported in this browser (use Chrome or Edge for voice). Practise aloud against the timer, then type what you said below.'}
        </div>
      )}

      {/* Transcript / textarea */}
      {speechSupported ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: 10,
          padding: 18,
          minHeight: 140,
          marginBottom: 16,
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--ink-hi)',
        }}>
          {!finalTranscript && !interimTranscript && (
            <span style={{ color: 'var(--ink-ghost)' }}>
              {isRecording ? 'Listening...' : 'Press Start to speak your answer aloud.'}
            </span>
          )}
          <span>{finalTranscript}</span>
          {interimTranscript && <span style={{ color: 'var(--ink-low)' }}>{interimTranscript}</span>}
        </div>
      ) : (
        <textarea
          value={fallbackText}
          onChange={e => setFallbackText(e.target.value)}
          placeholder="Type what you said aloud..."
          style={{
            width: '100%',
            minHeight: 140,
            background: 'var(--surface)',
            border: '1px solid var(--rim)',
            borderRadius: 10,
            padding: 18,
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--ink-hi)',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.7,
            marginBottom: 16,
          }}
        />
      )}

      {/* Recording controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {speechSupported && (
          <>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                background: isRecording ? 'rgba(240,165,0,0.15)' : 'rgba(240,165,0,0.10)',
                color: isRecording ? 'var(--prime)' : 'var(--ink-low)',
                border: `1px solid ${isRecording ? 'rgba(240,165,0,0.4)' : 'var(--rim)'}`,
                borderRadius: 8,
                padding: '10px 20px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isRecording ? (
                <>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--prime)', display: 'inline-block' }} />
                  Stop
                </>
              ) : (
                <>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ink-low)', display: 'inline-block' }} />
                  Start
                </>
              )}
            </button>

            {(finalTranscript || interimTranscript || isRecording || elapsed > 0) && (
              <button
                onClick={() => { stopRecording(); setFinalTranscript(''); setInterimTranscript(''); setElapsed(0); }}
                style={{ background: 'var(--surface)', color: 'var(--ink-low)', border: '1px solid var(--rim)', borderRadius: 8, padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}
              >
                Reset
              </button>
            )}
          </>
        )}
      </div>

      {/* Self-check */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink-hi)', marginBottom: 10 }}>
          {tier.check}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ v: true, label: 'Yes, hit it' }, { v: false, label: 'Not yet' }].map(opt => (
            <button
              key={String(opt.v)}
              onClick={() => setSelfCheck(opt.v)}
              style={{
                background: selfCheck === opt.v ? (opt.v ? 'rgba(240,165,0,0.15)' : 'var(--surface)') : 'var(--surface)',
                color: selfCheck === opt.v ? (opt.v ? 'var(--prime)' : 'var(--ink-hi)') : 'var(--ink-mid)',
                border: `1px solid ${selfCheck === opt.v ? (opt.v ? 'rgba(240,165,0,0.4)' : 'var(--ink-low)') : 'var(--rim)'}`,
                borderRadius: 8,
                padding: '8px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: selfCheck === opt.v ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advance */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleNextTier}
          style={{
            background: 'var(--prime)',
            color: 'var(--void)',
            border: 'none',
            borderRadius: 8,
            padding: '11px 26px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          {isLastTier ? 'Finish Drill →' : `Next: ${TIERS[tierIndex + 1].label} →`}
        </button>
      </div>
    </div>
  );
}
