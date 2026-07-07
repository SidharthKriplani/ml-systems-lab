// build-prerendered-posts.mjs — Generate static SEO-indexable HTML files for every Gradient post.
//
// Why: MSL is a Vite SPA. Googlebot can execute JS but indexes SPAs poorly.
// Pre-rendering each post body as static HTML at public/post/<slug>.html gives
// Google clean indexable content with title, meta description, OG tags, and the
// post body as plain HTML. Each file also includes a tiny inline script that
// redirects human users to the SPA URL (?post=<slug>#gradient) for the full
// interactive experience while bots see the static content.
//
// Run whenever new posts ship:
//   node scripts/build-prerendered-posts.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const GRADIENT_PATH = join(ROOT, 'src/tabs/GradientTab.jsx')
const OUT_DIR = join(ROOT, 'public/post')
const DOMAIN = process.env.SITE_BASE_URL || 'https://ml-systems-lab-v9xe.vercel.app'

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const source = readFileSync(GRADIENT_PATH, 'utf8')

// ── Balanced-bracket / string-aware scanner ──────────────────────────────────
// Regex-based field extraction broke on posts using double-quoted title/excerpt
// strings (needed when the text itself contains an apostrophe, e.g. "It's a
// Product Problem"). This scans real bracket/string structure instead — same
// approach as scripts/prerender-modules.cjs — so it's robust to quote style,
// and also to real duplicate `id`/`slug` values that exist in the source data
// (deduped by slug below rather than silently keeping only the regex-matched
// subset).
function findMatchingEnd(str, startIdx) {
  const stack = [str[startIdx]]
  let i = startIdx + 1
  while (stack.length > 0 && i < str.length) {
    const c = str[i]
    const top = stack[stack.length - 1]
    if (top === "'" || top === '"' || top === '`') {
      if (c === '\\') { i += 2; continue }
      if (top === '`' && c === '$' && str[i + 1] === '{') { stack.push('{'); i += 2; continue }
      if (c === top) { stack.pop(); i++; continue }
      i++; continue
    }
    if (c === "'" || c === '"' || c === '`') { stack.push(c); i++; continue }
    if (c === '[' || c === '{' || c === '(') { stack.push(c); i++; continue }
    if (c === ']' || c === '}' || c === ')') { stack.pop(); i++; continue }
    i++
  }
  return i
}

const postsMarker = 'const POSTS = ['
const postsStart = source.indexOf(postsMarker)
if (postsStart === -1) {
  console.error('Could not find "const POSTS = [" in GradientTab.jsx')
  process.exit(1)
}
const openBracket = postsStart + postsMarker.length - 1
const postsEnd = findMatchingEnd(source, openBracket)
const postsArrayText = source.slice(openBracket, postsEnd)
const rawPosts = vm.runInNewContext(`(${postsArrayText})`, { console })

// Dedupe by slug (two ids share a slug in the source data — keep first).
const posts = []
const seenSlugs = new Set()
for (const p of rawPosts) {
  if (!p || !p.slug || !p.title || !p.body) continue
  if (seenSlugs.has(p.slug)) continue
  seenSlugs.add(p.slug)
  posts.push({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || '',
    category: p.category || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    body: p.body,
  })
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function bodyToHtml(body) {
  const lines = body.split('\n')
  const out = []
  let para = []
  function flushPara() {
    if (para.length === 0) return
    const text = para.join(' ').trim()
    if (text) {
      const withBold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      out.push(`<p>${withBold}</p>`)
    }
    para = []
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') { flushPara(); continue }
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      flushPara()
      out.push(`<h2>${escapeHtml(line.slice(2, -2))}</h2>`)
      continue
    }
    if (line.startsWith('> ')) {
      flushPara()
      const t = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      out.push(`<blockquote>${t}</blockquote>`)
      continue
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushPara()
      out.push(`<li>${line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`)
      continue
    }
    para.push(line)
  }
  flushPara()
  return out.join('\n')
}

const today = new Date().toISOString().slice(0, 10)

let count = 0
for (const post of posts) {
  const spaUrl = `${DOMAIN}/?post=${post.slug}#gradient`
  const canonicalUrl = `${DOMAIN}/post/${post.slug}.html`
  const ogImageUrl = `${DOMAIN}/og-image.png`
  const description = post.excerpt.slice(0, 200) + (post.excerpt.length > 200 ? '…' : '')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(post.title)} — ML Systems Lab</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="keywords" content="${post.tags.map(t => escapeHtml(t)).join(', ')}, ML Systems Lab, senior MLE, machine learning interview" />
  <link rel="canonical" href="${canonicalUrl}" />

  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${escapeHtml(post.title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="article:section" content="${escapeHtml(post.category)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(post.title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${ogImageUrl}" />

  <script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: description,
  author: { '@type': 'Person', name: 'ML Systems Lab' },
  publisher: { '@type': 'Organization', name: 'ML Systems Lab', logo: { '@type': 'ImageObject', url: ogImageUrl } },
  datePublished: today,
  dateModified: today,
  mainEntityOfPage: canonicalUrl,
  image: ogImageUrl,
  keywords: post.tags.join(', '),
}, null, 2)}
  </script>

  <style>
    body { max-width: 720px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; color: #1a1a1c; background: #fafaf7; }
    h1 { font-size: 32px; font-weight: 900; letter-spacing: -0.04em; margin: 0 0 12px; color: #d28a00; }
    h2 { font-size: 18px; font-weight: 700; margin: 28px 0 10px; color: #1a1a1c; }
    .meta { font-size: 12px; color: #6a6a6e; font-family: monospace; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.1em; }
    .excerpt { font-style: italic; border-left: 3px solid #d28a00; padding-left: 14px; color: #4a4a4e; margin: 0 0 28px; font-size: 15px; }
    p { margin: 0 0 16px; }
    blockquote { border-left: 3px solid #d28a00; padding: 8px 14px; background: rgba(240,165,0,0.06); margin: 16px 0; font-style: italic; }
    li { margin: 0 0 6px; }
    .cta { margin-top: 40px; padding: 16px 18px; background: rgba(240,165,0,0.10); border: 1px solid rgba(240,165,0,0.30); border-radius: 10px; }
    .cta a { display: inline-block; padding: 10px 20px; background: #d28a00; color: white; text-decoration: none; border-radius: 7px; font-weight: 700; font-family: monospace; font-size: 13px; margin-top: 8px; }
    .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; }
    .footer a { color: #d28a00; }
  </style>

  <script>
    if (!/bot|crawl|spider|googlebot|bingbot/i.test(navigator.userAgent)) {
      setTimeout(function() { window.location.replace('${spaUrl}') }, 200)
    }
  </script>
</head>
<body>
  <article>
    <div class="meta">${escapeHtml(post.category)} &middot; ML Systems Lab</div>
    <h1>${escapeHtml(post.title)}</h1>
    <p class="excerpt">${escapeHtml(post.excerpt)}</p>
    ${bodyToHtml(post.body)}

    <div class="cta">
      <div style="font-size: 12px; color: #5a5a5e; font-family: monospace; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Continue interactively</div>
      <div style="font-size: 14px; color: #1a1a1c; margin-bottom: 4px;">Read this post inside ML Systems Lab &mdash; with Simplify toggle, interview Q&amp;As, inline glossary, and the MLE Path forward pointer.</div>
      <a href="${spaUrl}">Open in MSL &rarr;</a>
    </div>

    <div class="footer">
      Part of <a href="${DOMAIN}">The MLE Path</a> &mdash; 57-post senior MLE interview prep curriculum, free, no signup.
    </div>
  </article>
</body>
</html>
`

  writeFileSync(join(OUT_DIR, `${post.slug}.html`), html)
  count++
}

console.log(`Wrote ${count} pre-rendered post HTML files to public/post/`)
console.log(`Domain: ${DOMAIN}`)
console.log(`Each file: title, meta description, OG tags, JSON-LD structured data, full post body as static HTML.`)
console.log(`Bots see static content. Users get redirected to the SPA after 200ms.`)
