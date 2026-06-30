import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

const SEED_POINTS = [
  [0.15, 0.75], [0.22, 0.82], [0.18, 0.68], [0.28, 0.78],
  [0.45, 0.25], [0.52, 0.18], [0.48, 0.32], [0.38, 0.22],
  [0.78, 0.55], [0.85, 0.62], [0.72, 0.48], [0.82, 0.70],
];

const CLUSTER_COLORS = ['#4a9ebb', '#e85d4a', '#4eb87c', 'var(--prime)', '#9b7fd4', '#e8a23a'];

function euclidean(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function agglomerativeClustering(points, linkage) {
  const n = points.length;
  const merges = [];
  let clusters = points.map((p, i) => ({ id: i, members: [i] }));
  let nextId = n;

  while (clusters.length > 1) {
    let bestDist = Infinity, bestI = 0, bestJ = 1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        let dist;
        const dists = [];
        for (const a of clusters[i].members) {
          for (const b of clusters[j].members) {
            dists.push(euclidean(points[a], points[b]));
          }
        }
        if (linkage === 'single') {
          dist = Math.min(...dists);
        } else if (linkage === 'average') {
          dist = dists.reduce((s, d) => s + d, 0) / dists.length;
        } else {
          // complete (default)
          dist = Math.max(...dists);
        }
        if (dist < bestDist) { bestDist = dist; bestI = i; bestJ = j; }
      }
    }

    const merged = {
      id: nextId++,
      members: [...clusters[bestI].members, ...clusters[bestJ].members],
    };
    merges.push({
      left: clusters[bestI].id,
      right: clusters[bestJ].id,
      leftMembers: clusters[bestI].members,
      rightMembers: clusters[bestJ].members,
      height: bestDist,
      newId: merged.id,
      allMembers: merged.members,
    });
    clusters = clusters.filter((_, k) => k !== bestI && k !== bestJ);
    clusters.push(merged);
  }
  return merges;
}

// Depth-first leaf ordering from merge tree
function getLeafOrder(merges, n) {
  if (merges.length === 0) return Array.from({ length: n }, (_, i) => i);
  const lastMerge = merges[merges.length - 1];

  function dfs(nodeId) {
    if (nodeId < n) return [nodeId];
    const merge = merges.find(m => m.newId === nodeId);
    if (!merge) return [nodeId];
    return [...dfs(merge.left), ...dfs(merge.right)];
  }

  return dfs(lastMerge.newId);
}

// Get cluster assignments at a given threshold
function getClusters(merges, threshold, n) {
  // Start: each point is its own cluster
  const clusterOf = {};
  for (let i = 0; i < n; i++) clusterOf[i] = i;

  // Build a union-find style mapping via merge tree
  // Apply merges whose height <= threshold
  const nodeMembers = {};
  for (let i = 0; i < n; i++) nodeMembers[i] = [i];

  for (const m of merges) {
    if (m.height <= threshold) {
      nodeMembers[m.newId] = m.allMembers;
      for (const idx of m.allMembers) {
        clusterOf[idx] = m.newId;
      }
    }
  }

  // Normalize cluster IDs to 0-based integers
  const seen = new Map();
  let nextCluster = 0;
  const assignment = new Array(n);
  for (let i = 0; i < n; i++) {
    const root = clusterOf[i];
    if (!seen.has(root)) {
      seen.set(root, nextCluster++);
    }
    assignment[i] = seen.get(root);
  }
  return assignment;
}

export const HierarchicalClusteringViz = forwardRef(function HierarchicalClusteringViz(props, ref) {
  const scatterRef = useRef(null);
  const dendroRef = useRef(null);
  const animRef = useRef(null);
  const mergesRef = useRef([]);
  const leafOrderRef = useRef([]);
  const maxHeightRef = useRef(1);
  const isDraggingRef = useRef(false);

  const [linkage, setLinkage] = useState('complete');
  const [threshold, setThreshold] = useState(null); // null = not yet initialized
  const [clusterCount, setClusterCount] = useState(1);

  // Compute merges whenever linkage changes
  const computeMerges = useCallback((lnk) => {
    const merges = agglomerativeClustering(SEED_POINTS, lnk);
    const leafOrder = getLeafOrder(merges, SEED_POINTS.length);
    const maxH = merges.length > 0 ? merges[merges.length - 1].height : 1;
    mergesRef.current = merges;
    leafOrderRef.current = leafOrder;
    maxHeightRef.current = maxH;
    return { merges, leafOrder, maxH };
  }, []);

  // Initialize
  useEffect(() => {
    const { maxH } = computeMerges(linkage);
    setThreshold(maxH * 0.5);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recompute when linkage changes (keep threshold proportional)
  const prevLinkageRef = useRef(linkage);
  useEffect(() => {
    if (prevLinkageRef.current === linkage) return;
    prevLinkageRef.current = linkage;
    const oldMax = maxHeightRef.current;
    const { maxH } = computeMerges(linkage);
    setThreshold(prev => {
      const ratio = oldMax > 0 ? (prev / oldMax) : 0.5;
      return maxH * ratio;
    });
  }, [linkage, computeMerges]);

  const drawScatter = useCallback((thresh) => {
    const canvas = scatterRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.scale(dpr, dpr);
    }

    const PAD = 28;
    const dw = W - 2 * PAD;
    const dh = H - 2 * PAD;

    const toC = (x, y) => [PAD + x * dw, PAD + (1 - y) * dh];

    const bg = getComputedStyle(document.documentElement).getPropertyValue('--depth').trim() || '#0f1117';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const rim = getComputedStyle(document.documentElement).getPropertyValue('--rim').trim() || '#2a2d3a';
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.5;
    for (let g = 0; g <= 5; g++) {
      const t = g / 5;
      ctx.beginPath();
      const [x0, y0] = toC(t, 0); const [x1, y1] = toC(t, 1);
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const [x2, y2] = toC(0, t); const [x3, y3] = toC(1, t);
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
    }

    const n = SEED_POINTS.length;
    const merges = mergesRef.current;
    const assignment = thresh !== null ? getClusters(merges, thresh, n) : Array(n).fill(0);
    const numClusters = new Set(assignment).size;
    setClusterCount(numClusters);

    for (let i = 0; i < n; i++) {
      const [x, y] = SEED_POINTS[i];
      const [cx, cy] = toC(x, y);
      const colorStr = CLUSTER_COLORS[assignment[i] % CLUSTER_COLORS.length];
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
      ctx.fillStyle = colorStr;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Point label
      const inkLow = getComputedStyle(document.documentElement).getPropertyValue('--ink-low').trim() || '#888';
      ctx.fillStyle = inkLow;
      ctx.font = `9px var(--font-mono, monospace)`;
      ctx.textAlign = 'center';
      ctx.fillText(`P${i}`, cx, cy - 10);
    }

    // Axis labels
    const inkMid = getComputedStyle(document.documentElement).getPropertyValue('--ink-mid').trim() || '#aaa';
    ctx.fillStyle = inkMid;
    ctx.font = `10px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'center';
    ctx.fillText('Scatter Plot', W / 2, H - 4);
  }, []);

  const drawDendro = useCallback((thresh) => {
    const canvas = dendroRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.scale(dpr, dpr);
    }

    const LPAD = 20, RPAD = 12, TPAD = 14, BPAD = 28;
    const dw = W - LPAD - RPAD;
    const dh = H - TPAD - BPAD;

    const merges = mergesRef.current;
    const leafOrder = leafOrderRef.current;
    const maxH = maxHeightRef.current;
    const n = SEED_POINTS.length;

    const bg = getComputedStyle(document.documentElement).getPropertyValue('--depth').trim() || '#0f1117';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (merges.length === 0 || leafOrder.length === 0) return;

    // Leaf X positions (evenly spaced)
    const leafX = {};
    for (let i = 0; i < leafOrder.length; i++) {
      leafX[leafOrder[i]] = LPAD + (i + 0.5) * (dw / n);
    }

    // Map nodeId → X position (center of subtree leaves)
    const nodeX = { ...leafX };
    for (const m of merges) {
      nodeX[m.newId] = (nodeX[m.left] + nodeX[m.right]) / 2;
    }

    // Y: height 0 = bottom (TPAD + dh), maxH = top (TPAD)
    const toY = (h) => TPAD + dh - (h / maxH) * dh;

    const rim = getComputedStyle(document.documentElement).getPropertyValue('--rim').trim() || '#2a2d3a';
    const inkLow = getComputedStyle(document.documentElement).getPropertyValue('--ink-low').trim() || '#888';
    const inkMid = getComputedStyle(document.documentElement).getPropertyValue('--ink-mid').trim() || '#aaa';

    // Cluster assignments at threshold
    const assignment = thresh !== null ? getClusters(merges, thresh, n) : Array(n).fill(0);

    // Colored background bands for each cluster group at leaf level
    const clusterGroups = {};
    for (let i = 0; i < n; i++) {
      const cid = assignment[i];
      if (!clusterGroups[cid]) clusterGroups[cid] = [];
      clusterGroups[cid].push(i);
    }
    const leafBottom = toY(0);
    const bandH = 16;
    for (const [cid, members] of Object.entries(clusterGroups)) {
      const color = CLUSTER_COLORS[parseInt(cid) % CLUSTER_COLORS.length];
      for (const pt of members) {
        const lx = leafX[pt];
        const slotW = dw / n;
        ctx.fillStyle = color + '28';
        ctx.fillRect(lx - slotW / 2, leafBottom, slotW, bandH);
      }
    }

    // Draw dendrogram lines
    for (const m of merges) {
      const lx = nodeX[m.left];
      const rx = nodeX[m.right];
      const my = toY(m.height);
      const ly = toY(m.left < n ? 0 : merges.find(mm => mm.newId === m.left)?.height ?? 0);
      const ry = toY(m.right < n ? 0 : merges.find(mm => mm.newId === m.right)?.height ?? 0);

      const isCutAbove = thresh !== null && m.height > thresh;
      ctx.strokeStyle = isCutAbove ? inkLow : '#6a9fd8';
      ctx.lineWidth = isCutAbove ? 1 : 1.8;
      ctx.globalAlpha = isCutAbove ? 0.45 : 0.9;

      // Vertical from left child up to merge height
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, my); ctx.stroke();
      // Vertical from right child up to merge height
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx, my); ctx.stroke();
      // Horizontal connector at merge height
      ctx.beginPath(); ctx.moveTo(lx, my); ctx.lineTo(rx, my); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Leaf labels
    ctx.fillStyle = inkLow;
    ctx.font = `8.5px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const pt = leafOrder[i];
      const lx = LPAD + (i + 0.5) * (dw / n);
      ctx.fillText(`P${pt}`, lx, leafBottom + bandH + 10);
    }

    // Y-axis ticks
    ctx.fillStyle = inkLow;
    ctx.font = `8px var(--font-mono, monospace)`;
    ctx.textAlign = 'right';
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) {
      const h = (t / ticks) * maxH;
      const ty = toY(h);
      ctx.fillStyle = rim;
      ctx.fillRect(LPAD - 4, ty, 3, 1);
      ctx.fillStyle = inkLow;
      ctx.fillText(h.toFixed(2), LPAD - 6, ty + 3);
    }

    // Threshold line (draggable red line)
    if (thresh !== null) {
      const ty = toY(thresh);
      ctx.strokeStyle = '#e85d4a';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(LPAD, ty);
      ctx.lineTo(W - RPAD, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      // Handle grip
      ctx.fillStyle = '#e85d4a';
      ctx.beginPath();
      ctx.arc(W - RPAD - 6, ty, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Label on line
      ctx.fillStyle = '#e85d4a';
      ctx.font = `bold 9px var(--font-mono, monospace)`;
      ctx.textAlign = 'left';
      ctx.fillText(`${thresh.toFixed(3)}`, LPAD + 4, ty - 4);
    }

    // Title
    ctx.fillStyle = inkMid;
    ctx.font = `10px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'center';
    ctx.fillText('Dendrogram', W / 2, TPAD - 2);
  }, []);

  // Draw whenever threshold changes
  useEffect(() => {
    if (threshold === null) return;
    drawScatter(threshold);
    drawDendro(threshold);
  }, [threshold, drawScatter, drawDendro, linkage]);

  // ResizeObserver
  useEffect(() => {
    const observers = [];
    const handle = () => {
      if (threshold !== null) {
        drawScatter(threshold);
        drawDendro(threshold);
      }
    };
    [scatterRef, dendroRef].forEach(ref => {
      if (!ref.current) return;
      const ro = new ResizeObserver(handle);
      ro.observe(ref.current);
      observers.push(ro);
    });
    return () => observers.forEach(ro => ro.disconnect());
  }, [threshold, drawScatter, drawDendro]);

  // Drag threshold on dendrogram
  const getThreshFromY = useCallback((clientY) => {
    const canvas = dendroRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const TPAD = 14, BPAD = 28;
    const H = canvas.clientHeight;
    const dh = H - TPAD - BPAD;
    const relY = clientY - rect.top;
    const frac = 1 - (relY - TPAD) / dh;
    const h = Math.max(0, Math.min(maxHeightRef.current, frac * maxHeightRef.current));
    return h;
  }, []);

  const handleDendroMouseDown = useCallback((e) => {
    isDraggingRef.current = true;
    const h = getThreshFromY(e.clientY);
    if (h !== null) setThreshold(h);
  }, [getThreshFromY]);

  const handleDendroMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const h = getThreshFromY(e.clientY);
    if (h !== null) setThreshold(h);
  }, [getThreshFromY]);

  const handleDendroMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleDendroMouseUp);
    window.addEventListener('mousemove', (e) => {
      if (isDraggingRef.current) {
        const h = getThreshFromY(e.clientY);
        if (h !== null) setThreshold(h);
      }
    });
    return () => {
      window.removeEventListener('mouseup', handleDendroMouseUp);
    };
  }, [handleDendroMouseUp, getThreshFromY]);

  const handleReset = useCallback(() => {
    const maxH = maxHeightRef.current;
    setThreshold(maxH * 0.5);
  }, []);

  const play = useCallback(() => {
    if (animRef.current) return
    let lastTime = 0
    const tick = (time) => {
      if (time - lastTime >= 600) {
        lastTime = time
        setThreshold(t => {
          const maxH = maxHeightRef.current
          const current = t ?? maxH * 0.5
          const next = Math.max(0, current - maxH * 0.1)
          if (next <= 0) { animRef.current = null; return 0 }
          return next
        })
      }
      if (animRef.current !== null) animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [])

  const pause = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
  }, [])

  const step = useCallback(() => {
    pause()
    setThreshold(t => {
      const maxH = maxHeightRef.current
      const current = t ?? maxH * 0.5
      return Math.max(0, current - maxH * 0.1)
    })
  }, [pause])

  useImperativeHandle(ref, () => ({
    play,
    pause,
    reset: handleReset,
    step,
  }), [play, pause, handleReset, step])

  const btnBase = {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid var(--rim)',
    background: 'var(--depth)',
    color: 'var(--ink-mid)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'var(--font-mono, monospace)',
    transition: 'all 0.15s',
  };
  const btnActive = {
    ...btnBase,
    background: 'var(--prime)',
    color: '#fff',
    borderColor: 'var(--prime)',
    fontWeight: 700,
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, sans-serif)' }}>
      <h3 style={{ margin: '0 0 3px', color: 'var(--ink-hi)', fontSize: 17, fontWeight: 700 }}>
        Hierarchical Clustering
      </h3>
      <p style={{ margin: '0 0 14px', color: 'var(--ink-mid)', fontSize: 12.5 }}>
        Drag the red threshold line on the dendrogram to cut at different heights.
      </p>

      {/* Two-panel canvas row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        {/* Scatter plot (45%) */}
        <div style={{ flex: '0 0 45%' }}>
          <canvas
            ref={scatterRef}
            style={{
              width: '100%',
              height: '360px',
              display: 'block',
              borderRadius: 8,
              border: '1px solid var(--rim)',
            }}
          />
        </div>
        {/* Dendrogram (55%) */}
        <div style={{ flex: '0 0 calc(55% - 10px)' }}>
          <canvas
            ref={dendroRef}
            style={{
              width: '100%',
              height: '360px',
              display: 'block',
              borderRadius: 8,
              border: '1px solid var(--rim)',
              cursor: 'ns-resize',
            }}
            onMouseDown={handleDendroMouseDown}
            onMouseMove={handleDendroMouseMove}
            onMouseUp={handleDendroMouseUp}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Threshold info */}
        <div style={{ fontSize: 13, color: 'var(--ink-mid)', fontFamily: 'var(--font-mono, monospace)' }}>
          Cut height:{' '}
          <span style={{ color: '#e85d4a', fontWeight: 700 }}>
            {threshold !== null ? threshold.toFixed(3) : '—'}
          </span>
          {' → '}
          <span style={{ color: 'var(--prime)', fontWeight: 700 }}>{clusterCount}</span>
          {' '}cluster{clusterCount !== 1 ? 's' : ''}
        </div>

        {/* Linkage selector */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>Linkage:</span>
          {['complete', 'single', 'average'].map(lnk => (
            <button
              key={lnk}
              onClick={() => setLinkage(lnk)}
              style={linkage === lnk ? btnActive : btnBase}
            >
              {lnk.charAt(0).toUpperCase() + lnk.slice(1)}
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          style={{ ...btnBase, borderColor: 'var(--prime)', color: 'var(--prime)' }}
        >
          Reset threshold
        </button>
      </div>

      <p style={{ marginTop: 12, fontSize: 11.5, color: 'var(--ink-low)', lineHeight: 1.6, borderTop: '1px solid var(--rim)', paddingTop: 10 }}>
        Complete linkage merges by max pairwise distance (compact clusters). Single linkage uses min distance (prone to chaining). Average uses mean distance.
        Long vertical gaps in the dendrogram mark natural cluster boundaries — cut there for the most stable k.
      </p>
    </div>
  );
})
