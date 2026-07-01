import React, { useState, useMemo, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

const N_SAMPLES = 30;

// For stratified CV: assign class labels (5% positive rate = 1/20 chance → ~2 positives in 30)
// Use a fixed pattern: indices 4, 14, 24 are class 1, rest class 0 (10% positive for visibility)
const SAMPLE_CLASSES = Array.from({ length: N_SAMPLES }, (_, i) => (i % 10 === 4 ? 1 : 0));
// For group CV: assign group IDs (6 groups of 5 samples each)
const SAMPLE_GROUPS = Array.from({ length: N_SAMPLES }, (_, i) => Math.floor(i / 5));
const N_GROUPS = 6;

// Hardcoded simulated validation accuracies per k value
const FOLD_ACCURACIES = {
  3: [0.82, 0.79, 0.85],
  5: [0.82, 0.79, 0.85, 0.81, 0.83],
  10: [0.82, 0.79, 0.85, 0.81, 0.83, 0.80, 0.84, 0.78, 0.86, 0.82],
};

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function getFoldIndices(k, foldIdx) {
  // Returns which sample indices are in the validation set for foldIdx (0-based)
  const foldSize = Math.floor(N_SAMPLES / k);
  const remainder = N_SAMPLES % k;
  let start = 0;
  for (let f = 0; f < foldIdx; f++) {
    start += foldSize + (f < remainder ? 1 : 0);
  }
  const size = foldSize + (foldIdx < remainder ? 1 : 0);
  const valSet = new Set();
  for (let i = start; i < start + size; i++) valSet.add(i);
  return valSet;
}

const K_INFO = {
  3:  { label: 'k=3',  note: 'Faster, higher variance per fold' },
  5:  { label: 'k=5',  note: 'Standard choice — good bias-variance tradeoff' },
  10: { label: 'k=10', note: 'Expensive but low-variance estimate' },
};

// Stratified fold indices: ensure class distribution preserved in each fold
function getStratifiedFoldIndices(k, foldIdx) {
  const class0 = Array.from({ length: N_SAMPLES }, (_, i) => i).filter(i => SAMPLE_CLASSES[i] === 0);
  const class1 = Array.from({ length: N_SAMPLES }, (_, i) => i).filter(i => SAMPLE_CLASSES[i] === 1);
  const valSet = new Set();
  // Each class split independently across folds
  [class0, class1].forEach(indices => {
    const fSize = Math.floor(indices.length / k);
    const start = foldIdx * fSize;
    indices.slice(start, start + fSize).forEach(i => valSet.add(i));
  });
  return valSet;
}

// Group fold indices: entire groups go into one fold
function getGroupFoldIndices(k, foldIdx) {
  // Assign groups to folds: 6 groups into k folds
  const groupsPerFold = Math.ceil(N_GROUPS / k);
  const valGroups = new Set();
  for (let g = foldIdx * groupsPerFold; g < Math.min((foldIdx + 1) * groupsPerFold, N_GROUPS); g++) {
    valGroups.add(g);
  }
  return new Set(Array.from({ length: N_SAMPLES }, (_, i) => i).filter(i => valGroups.has(SAMPLE_GROUPS[i])));
}

// Walk-forward: training is always historical, validation is always future
function getWalkForwardIndices(k, foldIdx) {
  // Train on [0..splitPt-1], validate on [splitPt..splitPt+foldSize-1]
  const foldSize = Math.floor(N_SAMPLES / (k + 1));
  const splitPt = (foldIdx + 1) * foldSize;
  const valEnd = Math.min(splitPt + foldSize, N_SAMPLES);
  return new Set(Array.from({ length: valEnd - splitPt }, (_, i) => splitPt + i));
}

const CV_TYPES = ['Standard', 'Stratified', 'Group', 'Walk-forward'];

const CV_INFO = {
  'Standard': 'Samples assigned to folds in order. Does not account for class distribution or entity grouping.',
  'Stratified': 'Each fold preserves the class ratio (~10% positive). Critical for imbalanced datasets — prevents a fold from having no positives.',
  'Group': '5 samples share a group (e.g., visits from the same patient). All group members stay together. Prevents data leakage from memorizing patient history.',
  'Walk-forward': 'Time-series CV: train on past, validate on future. No data from the future leaks into training.',
};

export const CrossValidationViz = forwardRef(function CrossValidationViz(props, ref) {
  const [k, setK] = useState(5);
  const [foldIdx, setFoldIdx] = useState(0); // 0-based
  const [cvType, setCvType] = useState('Standard');
  const animRef = useRef(null);

  const valSet = useMemo(() => {
    if (cvType === 'Stratified') return getStratifiedFoldIndices(k, foldIdx);
    if (cvType === 'Group') return getGroupFoldIndices(k, foldIdx);
    if (cvType === 'Walk-forward') return getWalkForwardIndices(k, foldIdx);
    return getFoldIndices(k, foldIdx);
  }, [k, foldIdx, cvType]);
  const accs = FOLD_ACCURACIES[k];
  const cvMean = mean(accs);
  const cvStd = std(accs);

  const nVal = valSet.size;
  const nTrain = N_SAMPLES - nVal;
  const trainFrac = nTrain / N_SAMPLES;
  const valFrac = nVal / N_SAMPLES;

  function changeK(newK) {
    setK(newK);
    setFoldIdx(0);
  }

  function prev() {
    setFoldIdx(f => (f - 1 + k) % k);
  }

  function next() {
    setFoldIdx(f => (f + 1) % k);
  }

  const play = useCallback(() => {
    if (animRef.current) return;
    animRef.current = setInterval(() => {
      setFoldIdx(f => (f + 1) % k);
    }, 800);
  }, [k]);

  const pause = useCallback(() => {
    clearInterval(animRef.current);
    animRef.current = null;
  }, []);

  const resetCV = useCallback(() => {
    pause();
    setK(5);
    setFoldIdx(0);
  }, [pause]);

  const stepCV = useCallback(() => {
    pause();
    setFoldIdx(f => (f + 1) % k);
  }, [pause, k]);

  useImperativeHandle(ref, () => ({ play, pause, reset: resetCV, step: stepCV }), [play, pause, resetCV, stepCV]);

  // Arrange 30 squares: 2 rows of 15
  const rows = [[...Array(15).keys()], [...Array(15).keys()].map(i => i + 15)];

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* CV type selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {CV_TYPES.map(ct => (
          <button
            key={ct}
            onClick={() => { setCvType(ct); setFoldIdx(0); }}
            style={{
              padding: '4px 11px', borderRadius: '6px',
              border: '1px solid var(--rim, #2a2a2a)',
              background: cvType === ct ? 'var(--prime, #F0A500)' : 'var(--depth, #111)',
              color: cvType === ct ? '#000' : 'var(--ink-mid, #888)',
              fontFamily: 'var(--font-mono, monospace)', fontSize: '11px',
              fontWeight: cvType === ct ? 700 : 400, cursor: 'pointer',
            }}
          >
            {ct}
          </button>
        ))}
      </div>

      {/* CV type explanation */}
      <div style={{
        fontSize: '11px', color: 'var(--ink-mid, #888)', lineHeight: 1.6,
        background: 'var(--depth, #111)', border: '1px solid var(--rim)', borderRadius: 6,
        padding: '8px 12px',
      }}>
        {CV_INFO[cvType]}
      </div>

      {/* k selector */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--ink-mid, #888)', fontFamily: 'var(--font-mono, monospace)' }}>
          k-folds:
        </span>
        {[3, 5, 10].map(kv => (
          <button
            key={kv}
            onClick={() => changeK(kv)}
            style={{
              padding: '4px 14px',
              borderRadius: '6px',
              border: '1px solid var(--rim, #2a2a2a)',
              background: k === kv ? 'var(--prime, #F0A500)' : 'var(--depth, #111)',
              color: k === kv ? '#000' : 'var(--ink-mid, #888)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {kv}
          </button>
        ))}
      </div>

      {/* Sample grid */}
      <div style={{
        background: 'var(--depth, #111)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: '4px' }}>
            {row.map(idx => {
              const isVal = valSet.has(idx);
              const isPos = SAMPLE_CLASSES[idx] === 1;
              const groupColors = ['#60a5fa','#a78bfa','#34d399','#fb923c','#f87171','#22d3ee'];
              const groupColor = groupColors[SAMPLE_GROUPS[idx]];
              // Walk-forward: show whether sample is in any future training zone
              const wfTrainOnly = cvType === 'Walk-forward' && !isVal;
              return (
                <div
                  key={idx}
                  title={`Sample ${idx + 1} | class:${SAMPLE_CLASSES[idx]} | group:${SAMPLE_GROUPS[idx]}${isVal ? ' — VALIDATION' : ' — training'}`}
                  style={{
                    width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
                    background: isVal ? '#ef4444'
                      : cvType === 'Group' ? groupColor
                      : 'var(--prime, #F0A500)',
                    opacity: isVal ? 1 : cvType === 'Walk-forward' ? (idx < (foldIdx + 1) * Math.floor(N_SAMPLES / (k + 1)) ? 0.8 : 0.25) : 0.7,
                    border: isVal ? '2px solid #ff6b6b'
                      : cvType === 'Stratified' && isPos ? '2px solid #fff'
                      : '1px solid rgba(240,165,0,0.3)',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--prime, #F0A500)', opacity: 0.7 }} />
            <span style={{ fontSize: '11px', color: 'var(--ink-mid, #888)' }}>Training</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444' }} />
            <span style={{ fontSize: '11px', color: 'var(--ink-mid, #888)' }}>Validation</span>
          </div>
          {cvType === 'Stratified' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--prime)', border: '2px solid #fff' }} />
              <span style={{ fontSize: '11px', color: 'var(--ink-mid, #888)' }}>Positive class</span>
            </div>
          )}
          {cvType === 'Group' && (
            <span style={{ fontSize: '11px', color: 'var(--ink-mid, #888)' }}>Colors = groups (e.g., patients)</span>
          )}
        </div>
      </div>

      {/* Fold navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={prev}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            border: '1px solid var(--rim, #2a2a2a)',
            background: 'var(--depth, #111)',
            color: 'var(--ink-mid, #888)',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {'<'}
        </button>
        <span style={{
          fontSize: '13px',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--ink-hi, #e5e5e5)',
          minWidth: '140px',
          textAlign: 'center',
        }}>
          {`Fold ${foldIdx + 1} of ${k}`}
        </span>
        <button
          onClick={next}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            border: '1px solid var(--rim, #2a2a2a)',
            background: 'var(--depth, #111)',
            color: 'var(--ink-mid, #888)',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {'>'}
        </button>
        <span style={{
          fontSize: '12px',
          color: 'var(--ink-low, #555)',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          {`train: ${nTrain}   val: ${nVal}`}
        </span>
      </div>

      {/* Train/val bar */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '4px' }}>
          Split ratio
        </div>
        <div style={{ display: 'flex', height: '14px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--rim, #2a2a2a)' }}>
          <div style={{
            width: `${trainFrac * 100}%`,
            background: 'var(--prime, #F0A500)',
            opacity: 0.7,
            transition: 'width 0.2s',
          }} />
          <div style={{
            width: `${valFrac * 100}%`,
            background: '#ef4444',
            transition: 'width 0.2s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginTop: '3px' }}>
          <span>Training {(trainFrac * 100).toFixed(0)}%</span>
          <span>Validation {(valFrac * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Per-fold accuracies */}
      <div style={{
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '12px 16px',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
          Validation accuracy per fold
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {accs.map((acc, fi) => (
            <div key={fi} style={{
              background: fi === foldIdx ? 'var(--prime, #F0A500)' : 'var(--depth, #111)',
              border: `1px solid ${fi === foldIdx ? 'var(--prime, #F0A500)' : 'var(--rim, #2a2a2a)'}`,
              borderRadius: '6px',
              padding: '6px 10px',
              textAlign: 'center',
              minWidth: '48px',
            }}>
              <div style={{ fontSize: '10px', color: fi === foldIdx ? '#000' : 'var(--ink-low, #555)', marginBottom: '2px' }}>
                {`Fold ${fi + 1}`}
              </div>
              <div style={{
                fontSize: '14px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: fi === foldIdx ? '#000' : 'var(--ink-hi, #e5e5e5)',
              }}>
                {(acc * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CV score */}
      <div style={{
        background: 'var(--depth, #111)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--ink-low, #555)', marginBottom: '3px' }}>Final CV score</div>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--prime, #F0A500)' }}>
            {`${(cvMean * 100).toFixed(1)}%`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--ink-low, #555)', marginBottom: '3px' }}>Std dev</div>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--ink-hi, #e5e5e5)' }}>
            {`±${(cvStd * 100).toFixed(1)}%`}
          </div>
        </div>
        <div style={{ flex: 1, fontSize: '12px', color: 'var(--ink-mid, #888)', lineHeight: '1.5' }}>
          Each sample is used exactly once as validation. Unbiased estimate of generalization performance.
        </div>
      </div>

      {/* k comparison */}
      <div style={{
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '12px 16px',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
          Tradeoffs by k value
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[3, 5, 10].map(kv => (
            <div key={kv} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                background: kv === k ? 'var(--prime, #F0A500)' : 'var(--depth, #111)',
                color: kv === k ? '#000' : 'var(--ink-mid, #888)',
                border: '1px solid var(--rim, #2a2a2a)',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                minWidth: '32px',
                textAlign: 'center',
              }}>
                {kv}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--ink-mid, #888)' }}>
                {K_INFO[kv].note}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
})
