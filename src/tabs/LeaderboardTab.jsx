import { useState, useEffect } from 'react';
import { fetchLeaderboard, computeWeightedScore, getDisplayName, upsertLeaderboardRow } from '../utils/leaderboard.js';
import { supabase } from '../utils/supabase.js';

function rankColor(rank) {
  if (rank === 1) return '#f5c518'; // gold
  if (rank === 2) return '#c0c5ce'; // silver
  if (rank === 3) return '#cd7f32'; // bronze
  return 'var(--ink-low)';
}

// ─── "vs field" benchmark ─────────────────────────────────────────────────────
// Computed from the fetched board rows. Guards an empty board (returns null).
//   avg     — mean total_solved across all rows
//   p90     — the 90th-percentile score (the "Top 10%" bar to beat)
//   aheadOf — % of participants strictly below `myScore`
function computeBenchmark(rows, myScore) {
  if (!rows || rows.length === 0) return null;
  const scores = rows.map(r => r.total_solved || 0);
  const n = scores.length;
  const avg = Math.round(scores.reduce((s, v) => s + v, 0) / n);
  const sorted = [...scores].sort((a, b) => a - b);
  // p90 by nearest-rank on the ascending sort.
  const idx = Math.min(n - 1, Math.ceil(0.9 * n) - 1);
  const p90 = sorted[Math.max(0, idx)];
  const below = scores.filter(v => v < myScore).length;
  const aheadOf = Math.round((below / n) * 100);
  const max = Math.max(1, ...scores, myScore);
  return { avg, p90, aheadOf, max };
}

export function LeaderboardTab({ user, onOpenProfile }) {
  const [rows, setRows] = useState(null); // null = loading
  const [error, setError] = useState(false);

  function openProfile(userId) {
    if (!userId) return;
    if (onOpenProfile) onOpenProfile(userId);
    else window.location.hash = '#/u/' + userId;
  }

  useEffect(() => {
    let cancelled = false;
    // upsertLeaderboardRow was never actually wired up anywhere (dead export) —
    // opening the Leaderboard was documented as one of its two triggers but never
    // called it, so a signed-in user with real progress could open this page
    // repeatedly and still never get a row written for herself to appear in.
    if (user) upsertLeaderboardRow(user);
    fetchLeaderboard(100).then(data => {
      if (cancelled) return;
      if (data === null) setError(true);
      setRows(data || []);
    });
    return () => { cancelled = true; };
  }, [user]);

  const myIndex = (rows && user) ? rows.findIndex(r => r.user_id === user.id) : -1;
  const myRank  = myIndex >= 0 ? myIndex + 1 : null;
  const myTotal = myIndex >= 0 ? rows[myIndex].total_solved : (user ? computeWeightedScore() : 0);
  const benchmark = (user && rows) ? computeBenchmark(rows, myTotal) : null;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.025em', marginBottom: '0.35rem' }}>
          Leaderboard
        </h1>
        <p style={{ color: 'var(--ink-low)', fontSize: '0.875rem', margin: 0 }}>
          Ranked by weighted score — harder domains (system design, optimization, RL) count for more. Sign in to appear here.
        </p>
      </div>

      {/* Your standing */}
      {user && (
        <div style={{
          padding: '0.9rem 1.1rem', marginBottom: '1.25rem',
          background: 'rgba(240,165,0,0.08)',
          border: '1px solid rgba(240,165,0,0.3)',
          borderRadius: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-mid)' }}>Your standing</div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: myRank ? 'var(--prime)' : 'var(--ink-hi)' }}>
                  {myRank ? '#' + myRank : '—'}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rank</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink-hi)' }}>{myTotal}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
              </div>
            </div>
          </div>

          {/* vs field benchmark */}
          {benchmark && (
            <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(240,165,0,0.25)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink-hi)' }}>You: {myTotal}</span>
                {'  ·  '}Field avg: {benchmark.avg}
                {'  ·  '}Top 10%: {benchmark.p90}
              </div>
              {/* Marker bar: field avg + top-10% ticks, your position filled */}
              <div style={{ position: 'relative', height: '8px', background: 'var(--rim)', borderRadius: '4px', overflow: 'visible' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${Math.min(100, (myTotal / benchmark.max) * 100)}%`,
                  background: 'var(--prime)', borderRadius: '4px', transition: 'width 0.4s ease',
                }} />
                {/* avg tick */}
                <div title={'Field avg ' + benchmark.avg} style={{
                  position: 'absolute', top: '-2px', bottom: '-2px',
                  left: `${Math.min(100, (benchmark.avg / benchmark.max) * 100)}%`,
                  width: '2px', background: 'var(--ink-mid)',
                }} />
                {/* top-10% tick */}
                <div title={'Top 10% ' + benchmark.p90} style={{
                  position: 'absolute', top: '-2px', bottom: '-2px',
                  left: `${Math.min(100, (benchmark.p90 / benchmark.max) * 100)}%`,
                  width: '2px', background: 'var(--ink-hi)',
                }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--prime)', fontWeight: 700, marginTop: '0.5rem' }}>
                Ahead of {benchmark.aheadOf}% of participants
              </div>
            </div>
          )}
        </div>
      )}

      {/* Board */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '12px', overflow: 'hidden' }}>
        {rows === null ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--ink-low)' }}>
            Loading the board…
          </div>
        ) : error || !supabase ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--ink-low)' }}>
            The leaderboard isn't available right now.
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--ink-low)' }}>
            No one's on the board yet. Solve a problem to claim the top spot.
          </div>
        ) : (
          rows.map((r, i) => {
            const rank = i + 1;
            const isMe = user && r.user_id === user.id;
            return (
              <div
                key={r.user_id}
                style={{
                  display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr) auto',
                  alignItems: 'center', gap: '0.75rem',
                  padding: '0.7rem 1.1rem',
                  borderBottom: i < rows.length - 1 ? '1px solid var(--rim)' : 'none',
                  background: isMe ? 'rgba(240,165,0,0.08)' : 'transparent',
                }}
              >
                <span style={{ fontSize: rank <= 3 ? '1rem' : '0.85rem', fontWeight: 800, color: rankColor(rank), textAlign: 'center' }}>
                  {rank}
                </span>
                <button
                  type="button"
                  onClick={() => openProfile(r.user_id)}
                  title={'View ' + r.display_name + '\'s profile'}
                  style={{
                    fontSize: '0.9rem', fontWeight: isMe ? 700 : 500, color: 'var(--ink-hi)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    background: 'none', border: 'none', padding: 0, margin: 0,
                    textAlign: 'left', cursor: 'pointer', font: 'inherit', minWidth: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--prime)'; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-hi)'; e.currentTarget.style.textDecoration = 'none'; }}
                >
                  {r.display_name}{isMe ? ' (you)' : ''}
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-hi)' }}>
                  {r.total_solved}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--ink-low)', marginTop: '0.9rem', textAlign: 'center' }}>
        Your score updates when you sign in and as you practice.
      </p>
    </div>
  );
}
