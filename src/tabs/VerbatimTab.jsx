import { useState, useEffect, useRef, useCallback } from 'react';
import FidelityBadge from '../components/FidelityBadge.jsx'
import HowToStrip from '../components/HowToStrip.jsx'

const QUESTIONS = [
  { id: 1, category: 'System Design', text: 'Walk me through how you would design a real-time recommendation system for a platform with 100 million users.' },
  { id: 2, category: 'Technical', text: 'Explain the difference between bagging and boosting and when you\'d use each.' },
  { id: 3, category: 'System Design', text: 'How would you build a feature store from scratch? What are the key components?' },
  { id: 4, category: 'Behavioral', text: 'Tell me about a time a model you built failed in production. What happened and what did you learn?' },
  { id: 5, category: 'Technical', text: 'What is gradient boosting? Walk me through the algorithm step by step.' },
  { id: 6, category: 'System Design', text: 'Design an A/B testing platform for a company running 100 concurrent experiments.' },
  { id: 7, category: 'Trade-offs', text: 'When would you choose a simpler model over a more complex one, even if the complex model has better offline metrics?' },
  { id: 8, category: 'Technical', text: 'Explain attention mechanisms in transformers. What problem do they solve?' },
  { id: 9, category: 'System Design', text: 'How would you monitor a production ML model end-to-end?' },
  { id: 10, category: 'Behavioral', text: 'Describe a situation where you had to push back on a stakeholder\'s request. How did you handle it?' },
  { id: 11, category: 'Technical', text: 'What is training-serving skew and how do you prevent it?' },
  { id: 12, category: 'Case Study', text: 'A fraud detection model\'s false positive rate spiked overnight. Walk through your investigation.' },
  { id: 13, category: 'Trade-offs', text: 'What are the tradeoffs between online learning and batch retraining?' },
  { id: 14, category: 'Technical', text: 'Explain how NDCG works and when you\'d use it over AUC.' },
  { id: 15, category: 'System Design', text: 'Design a data pipeline that ensures point-in-time correct features for model training.' },
  { id: 16, category: 'Behavioral', text: 'Tell me about the most technically complex ML project you\'ve worked on.' },
  { id: 17, category: 'Technical', text: 'What is causal inference and why does it matter for ML systems?' },
  { id: 18, category: 'Trade-offs', text: 'When would you use a neural network vs. gradient boosting for a tabular dataset?' },
  { id: 19, category: 'System Design', text: 'How would you design a model serving infrastructure that handles multiple models with different latency SLOs?' },
  { id: 20, category: 'Behavioral', text: 'How do you decide when a model is ready to ship to production?' },
  { id: 21, category: 'Technical', text: 'Explain the curse of dimensionality and its practical implications.' },
  { id: 22, category: 'Case Study', text: 'A recommendation model\'s diversity metrics dropped after a new training run. What do you investigate?' },
  { id: 23, category: 'Trade-offs', text: 'What are the tradeoffs of using a large monolithic model vs. a cascade of smaller models?' },
  { id: 24, category: 'Technical', text: 'How does dropout work and why does it reduce overfitting?' },
  { id: 25, category: 'System Design', text: 'Design the ML infrastructure for a real-time pricing system.' },
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

const RATING_CRITERIA = [
  { key: 'clarity', label: 'Clarity', desc: 'Was the answer easy to follow?' },
  { key: 'completeness', label: 'Completeness', desc: 'Did you cover the key points?' },
  { key: 'conciseness', label: 'Conciseness', desc: 'Was it appropriately brief?' },
  { key: 'confidence', label: 'Confidence', desc: 'How confident did you sound?' },
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

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: 20,
            color: star <= value ? 'var(--prime)' : 'var(--rim)',
            transition: 'color 0.1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function VerbatimTab({ onNavigate }) {
  const [screen, setScreen] = useState('select');
  const [selectedQ, setSelectedQ] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [fallbackText, setFallbackText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ratings, setRatings] = useState({ clarity: 0, completeness: 0, conciseness: 0, confidence: 0 });
  const [history, setHistory] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const recognitionRef = useRef(null);
  const recordingStartRef = useRef(null);
  const isStoppingRef = useRef(false); // guard against onend double-fire
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hoveredQId, setHoveredQId] = useState(null);

  useEffect(() => {
    try {
      // iOS Safari does not support Web Speech API
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition || isIOS) setSpeechSupported(false);
    } catch {
      setSpeechSupported(false);
    }

    try {
      const saved = localStorage.getItem('msl_verbal_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const stopRecording = useCallback(() => {
    isStoppingRef.current = true; // signal that this is an intentional stop
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    } catch {}
    if (recordingStartRef.current) {
      setRecordingDuration(prev => prev + Math.round((Date.now() - recordingStartRef.current) / 1000));
      recordingStartRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript('');
    setTimeout(() => { isStoppingRef.current = false; }, 300); // reset after Chrome fires onend
  }, []);

  const startRecording = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }

        if (finalText) {
          setFinalTranscript(prev => prev + finalText);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        if (isStoppingRef.current) return; // intentional stop — don't double-fire
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      recordingStartRef.current = Date.now();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }, []);

  function handleSelectQuestion(q) {
    setSelectedQ(q);
    setFinalTranscript('');
    setInterimTranscript('');
    setFallbackText('');
    setRatings({ clarity: 0, completeness: 0, conciseness: 0, confidence: 0 });
    setRecordingDuration(0);
    setScreen('practice');
  }

  function handleGoToReview() {
    stopRecording();
    setScreen('review');
  }

  function handleSaveSession() {
    const transcript = speechSupported ? finalTranscript.trim() : fallbackText.trim();
    if (!transcript) return;

    const score = Object.values(ratings).reduce((s, v) => s + v, 0);
    const entry = {
      date: new Date().toISOString(),
      questionId: selectedQ.id,
      question: selectedQ.text,
      category: selectedQ.category,
      transcript,
      ratings: { ...ratings },
      score,
    };

    const updated = [entry, ...history];
    setHistory(updated);
    try { localStorage.setItem('msl_verbal_history', JSON.stringify(updated)); } catch {}
    setScreen('select');
  }

  function handleDiscardAndBack() {
    stopRecording();
    setScreen('select');
  }

  const avgScore = history.length > 0
    ? (history.reduce((s, h) => s + h.score, 0) / history.length).toFixed(1)
    : null;

  const categories = ['All', ...Array.from(new Set(QUESTIONS.map(q => q.category)))];
  const filteredQuestions = filterCategory === 'All' ? QUESTIONS : QUESTIONS.filter(q => q.category === filterCategory);

  // Select screen
  if (screen === 'select') {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 8px' }}>
            Verbatim Practice
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-mid)', margin: '0 0 4px' }}>
            Record yourself answering interview questions, then self-rate.
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-low)', margin: '0 0 4px', lineHeight: 1.5 }}>Pick a question, speak your answer aloud, then rate yourself on clarity, completeness, conciseness, and confidence. Your transcript is saved so you can compare takes over time.</p>
          <div style={{ marginTop: '8px' }}><FidelityBadge tier="faithful" /></div>
          {history.length > 0 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-low)', margin: 0 }}>
              {history.length} session{history.length !== 1 ? 's' : ''} recorded · avg score {avgScore}/20
            </p>
          )}
        </div>
        <HowToStrip
          skill="Closing the gap between knowing and saying"
          steps={['Pick a question', 'Record yourself answering out loud', 'Self-rate on clarity, completeness, conciseness, confidence']}
        />

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
          {filteredQuestions.map(q => {
            const sessionCount = history.filter(h => h.questionId === q.id).length;
            return (
              <button
                key={q.id}
                onClick={() => handleSelectQuestion(q)}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${hoveredQId === q.id ? (CATEGORY_COLORS[q.category] || 'var(--prime)') : 'var(--rim)'}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={() => setHoveredQId(q.id)}
                onMouseLeave={() => setHoveredQId(null)}
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
                    {sessionCount > 0 && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-ghost)' }}>
                        {sessionCount}× practiced
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Practice screen
  if (screen === 'practice') {
    const transcript = speechSupported ? finalTranscript : fallbackText;
    const hasContent = transcript.trim().length > 0;

    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={handleDiscardAndBack}
            style={{ background: 'var(--surface)', color: 'var(--ink-mid)', border: '1px solid var(--rim)', borderRadius: 8, padding: '7px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}
          >
            ← Back
          </button>
          <CategoryBadge category={selectedQ.category} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-ghost)' }}>
            Q{String(selectedQ.id).padStart(2, '0')}
          </span>
        </div>

        {/* Question */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, fontWeight: 600, color: 'var(--ink-hi)', margin: 0, lineHeight: 1.6 }}>
            {selectedQ.text}
          </p>
        </div>

        {/* Speech not supported fallback */}
        {!speechSupported && (
          <div style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--prime)' }}>
            {/iPad|iPhone|iPod/.test(navigator.userAgent)
              ? 'Voice recording is not supported on iOS Safari. Type your answer in the text box below instead.'
              : 'Web Speech API not supported in this browser. Use Chrome or Edge for voice input.'
            }
          </div>
        )}

        {/* Transcript area */}
        {speechSupported ? (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--rim)',
            borderRadius: 10,
            padding: 18,
            minHeight: 180,
            marginBottom: 20,
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--ink-hi)',
            position: 'relative',
          }}>
            {!finalTranscript && !interimTranscript && (
              <span style={{ color: 'var(--ink-ghost)' }}>
                {isRecording ? 'Listening...' : 'Press Record to start speaking.'}
              </span>
            )}
            <span>{finalTranscript}</span>
            {interimTranscript && (
              <span style={{ color: 'var(--ink-low)' }}>{interimTranscript}</span>
            )}
          </div>
        ) : (
          <textarea
            value={fallbackText}
            onChange={e => setFallbackText(e.target.value)}
            placeholder="Type your answer here..."
            style={{
              width: '100%',
              minHeight: 180,
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
              marginBottom: 20,
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
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--prime)', display: 'inline-block', animation: 'none' }} />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--ink-low)', display: 'inline-block' }} />
                    Record
                  </>
                )}
              </button>

              {(finalTranscript || isRecording) && (
                <button
                  onClick={() => { setFinalTranscript(''); setInterimTranscript(''); stopRecording(); }}
                  style={{ background: 'var(--surface)', color: 'var(--ink-low)', border: '1px solid var(--rim)', borderRadius: 8, padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}
                >
                  Clear
                </button>
              )}
            </>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={handleGoToReview}
            disabled={!hasContent}
            style={{
              background: hasContent ? 'var(--prime)' : 'var(--rim)',
              color: hasContent ? 'var(--void)' : 'var(--ink-low)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 14,
              cursor: hasContent ? 'pointer' : 'not-allowed',
            }}
          >
            Review & Rate →
          </button>
        </div>
      </div>
    );
  }

  // Review screen
  if (screen === 'review') {
    const transcript = speechSupported ? finalTranscript.trim() : fallbackText.trim();
    const totalRating = Object.values(ratings).reduce((s, v) => s + v, 0);
    const allRated = Object.values(ratings).every(v => v > 0);

    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setScreen('practice')}
            style={{ background: 'var(--surface)', color: 'var(--ink-mid)', border: '1px solid var(--rim)', borderRadius: 8, padding: '7px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}
          >
            ← Edit Answer
          </button>
          <CategoryBadge category={selectedQ.category} />
        </div>

        {/* Question recap */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div className="section-eyebrow" style={{ marginBottom: 6 }}>Question</div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-hi)', margin: 0, lineHeight: 1.55 }}>{selectedQ.text}</p>
        </div>

        {/* Transcript */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <div className="section-eyebrow">Your Answer</div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-hi)', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{transcript || '(no transcript)'}</p>
          {transcript && (() => {
            const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
            const wpm = recordingDuration > 0 ? Math.round(wordCount / (recordingDuration / 60)) : null;
            const paceLabel = wpm === null ? null : wpm >= 120 && wpm <= 160 ? '· good pace' : wpm < 120 ? '· slow pace' : '· fast pace';
            const paceColor = wpm === null ? 'var(--ink-ghost)' : 'var(--prime)';
            return (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--rim)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-low)' }}>{wordCount} words</span>
                {wpm !== null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: paceColor }}>{wpm} wpm {paceLabel}</span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Rating */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 10, padding: '20px 20px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--ink-hi)', marginBottom: 18 }}>
            Self-Rating
            {allRated && (
              <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--prime)' }}>
                {totalRating}/20
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {RATING_CRITERIA.map(({ key, label, desc }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink-hi)' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-ghost)' }}>{desc}</div>
                </div>
                <StarRating
                  value={ratings[key]}
                  onChange={val => setRatings(r => ({ ...r, [key]: val }))}
                />
                {ratings[key] > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-low)' }}>
                    {ratings[key]}/5
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleDiscardAndBack}
            style={{ background: 'var(--surface)', color: 'var(--ink-low)', border: '1px solid var(--rim)', borderRadius: 8, padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}
          >
            Discard
          </button>
          <button
            onClick={handleSaveSession}
            disabled={!allRated || !transcript}
            style={{
              background: allRated && transcript ? 'var(--prime)' : 'var(--rim)',
              color: allRated && transcript ? 'var(--void)' : 'var(--ink-low)',
              border: 'none',
              borderRadius: 8,
              padding: '11px 26px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: 15,
              cursor: allRated && transcript ? 'pointer' : 'not-allowed',
            }}
          >
            Save Session →
          </button>
        </div>
      </div>
    );
  }

  return null;
}
