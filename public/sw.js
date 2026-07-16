// ML Systems Lab — Service Worker (v2, 2026-07-16)
//
// v1 ('msl-v1') caused the recurring "Something went wrong" card and made it
// survive hard refresh:
//   1. It served EVERYTHING cache-first — including index.html — so after every
//      Vercel deploy users kept running a stale index.html that referenced
//      chunk hashes that no longer exist on the CDN.
//   2. When a stale chunk URL was requested, Vercel's SPA fallback answered
//      200 + text/html. res.ok was true, so v1 PERMANENTLY cached that HTML
//      under the .js URL — every later visit to that tab failed the module
//      MIME check, even after Ctrl+Shift+R (hard refresh bypasses the HTTP
//      cache, not a controlling service worker's Cache Storage).
//
// v2 strategy:
//   - Bumped cache name → activate purges every v1 cache (heals poisoned users).
//   - Navigations are NOT intercepted at all: the browser loads index.html
//     with its normal semantics (Vercel serves it must-revalidate → always
//     current chunk hashes). SW-piped navigations also proved fragile —
//     a JS-initiated location.reload() through respondWith(fetch(...)) can
//     leave the parser hung — so the safest correct behavior is to stay out
//     of the navigation path entirely.
//   - /assets/* hashed files: cache-first (immutable by construction), but a
//     response is only cached when its content-type matches what the URL asks
//     for — an HTML body under a .js/.css URL is never cached.
//   - Everything else: network-first with same-type-checked opportunistic cache.

const CACHE = 'msl-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

function cacheable(url, res) {
  if (!res.ok || res.status !== 200 || res.type !== 'basic') return false
  const type = (res.headers.get('content-type') || '').toLowerCase()
  // Never cache an HTML body under a code/data asset URL (SPA-fallback poisoning).
  if (/\.(js|mjs|css|json|svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname) && type.includes('text/html')) return false
  return true
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return
  // Never intercept navigations — see header comment.
  if (e.request.mode === 'navigate') return

  // Hashed build assets: immutable → cache-first for speed/offline.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          if (cacheable(url, res)) {
            const clone = res.clone()
            e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, clone)))
          }
          return res
        })
      })
    )
    return
  }

  // Everything else same-origin: network-first, cache as offline fallback.
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (cacheable(url, res)) {
          const clone = res.clone()
          e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, clone)))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
