import { lazy } from 'react'

// ── Why this exists (2026-07-16) ──────────────────────────────────────────────
// Every git push auto-deploys to Vercel, and each deploy replaces the hashed
// chunk files (assets/SomeTab-<hash>.js) with new hashes. Any user who already
// has the app open (or a cached index.html) and then navigates to a tab whose
// chunk they haven't loaded yet requests the OLD hash → the CDN returns the
// SPA fallback HTML → "Failed to fetch dynamically imported module" → the
// ErrorBoundary's "Something went wrong" card. Reproduced deterministically in
// Playwright by deleting one chunk from dist/ mid-session — the exact card and
// console error users reported on #monitoring_foundation / #production_foundation
// / My Tracks (any lazy tab can hit it; those were just the ones visited).
//
// Fix: when a dynamic import fails, force ONE automatic full reload — the fresh
// index.html references the new hashes, so the retry succeeds. A sessionStorage
// timestamp guards against reload loops (e.g. genuinely offline): at most one
// auto-reload per RELOAD_WINDOW_MS; within the window the error is re-thrown so
// the ErrorBoundary still catches real failures.

const RELOAD_KEY = 'msl_chunk_reload_ts'
const RELOAD_WINDOW_MS = 30_000

export function reloadOnceOnChunkError() {
  let last = 0
  try { last = Number(sessionStorage.getItem(RELOAD_KEY) || 0) } catch { /* ignore */ }
  if (Date.now() - last < RELOAD_WINDOW_MS) return false
  try { sessionStorage.setItem(RELOAD_KEY, String(Date.now())) } catch { /* ignore */ }
  window.location.reload()
  return true
}

export function lazyReload(importFn) {
  return lazy(() =>
    importFn().catch((err) => {
      if (reloadOnceOnChunkError()) {
        // Page is reloading — return a promise that never settles so React
        // just keeps showing the Suspense fallback for the last few ms.
        return new Promise(() => {})
      }
      throw err
    })
  )
}
