// build-sitemap.mjs — Regenerate public/sitemap.xml from GradientTab.jsx + path data.
//
// Run whenever new posts ship:
//   node scripts/build-sitemap.mjs
//
// What this generates:
//   - Root URL
//   - The MLE Path landing
//   - Cheatsheet, Plans, Resources (static-route pages worth indexing)
//   - One <url> per Gradient post via ?post=<slug>#gradient deep-link
//
// Why this matters: every Gradient post has a unique stable URL. Without the
// sitemap, Google's SPA crawler has to discover them via internal navigation,
// which produces patchy coverage. The sitemap explicitly tells Google all 142+
// URLs.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const GRADIENT_PATH = join(ROOT, 'src/tabs/GradientTab.jsx')
const SITEMAP_PATH = join(ROOT, 'public/sitemap.xml')
const MODULE_URLS_PATH = join(ROOT, 'public/module-sitemap-urls.json')

const DOMAIN = process.env.SITE_BASE_URL || 'https://ml-systems-lab-v9xe.vercel.app'

// Extract every `slug: '…'` value from the Gradient POSTS array. Uses the same
// balanced-bracket/string-aware scan as build-prerendered-posts.mjs (plain
// line-anchored regex missed posts with double-quoted title/excerpt strings).
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

const source = readFileSync(GRADIENT_PATH, 'utf8')
const postsMarker = 'const POSTS = ['
const postsStart = source.indexOf(postsMarker)
const openBracket = postsStart + postsMarker.length - 1
const postsEnd = findMatchingEnd(source, openBracket)
const rawPosts = vm.runInNewContext(`(${source.slice(openBracket, postsEnd)})`, { console })
const slugs = new Set(rawPosts.filter(p => p && p.slug).map(p => p.slug))

// Module URLs, written by scripts/prerender-modules.cjs (order-independent —
// if that script hasn't run yet, this block is just empty).
let moduleUrls = []
if (existsSync(MODULE_URLS_PATH)) {
  try {
    moduleUrls = JSON.parse(readFileSync(MODULE_URLS_PATH, 'utf8'))
  } catch {
    moduleUrls = []
  }
}

const today = new Date().toISOString().slice(0, 10)

const lines = []
lines.push('<?xml version="1.0" encoding="UTF-8"?>')
lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

// Top-level pages
const topLevel = [
  { loc: '/',                                 priority: 1.0, changefreq: 'daily' },
  { loc: '/?path=foundations#gradient',       priority: 1.0, changefreq: 'weekly' },
  { loc: '/#gradient',                        priority: 0.9, changefreq: 'daily' },
  { loc: '/#cheatsheet',                      priority: 0.8, changefreq: 'weekly' },
  { loc: '/#plans',                           priority: 0.7, changefreq: 'monthly' },
  { loc: '/#resources',                       priority: 0.6, changefreq: 'monthly' },
  { loc: '/#landscape',                       priority: 0.5, changefreq: 'monthly' },
  { loc: '/#mock_interview',                  priority: 0.8, changefreq: 'monthly' },
  { loc: '/#progress',                        priority: 0.5, changefreq: 'weekly' },
  { loc: '/#leaderboard',                     priority: 0.4, changefreq: 'weekly' },
]

for (const u of topLevel) {
  lines.push('  <url>')
  lines.push(`    <loc>${DOMAIN}${u.loc}</loc>`)
  lines.push(`    <lastmod>${today}</lastmod>`)
  lines.push(`    <changefreq>${u.changefreq}</changefreq>`)
  lines.push(`    <priority>${u.priority}</priority>`)
  lines.push('  </url>')
}

// Every Gradient post by slug — point Google at the pre-rendered static HTML
// at /post/<slug>.html (which has SEO content + redirects users to the SPA).
for (const slug of [...slugs].sort()) {
  lines.push('  <url>')
  lines.push(`    <loc>${DOMAIN}/post/${slug}.html</loc>`)
  lines.push(`    <lastmod>${today}</lastmod>`)
  lines.push('    <changefreq>monthly</changefreq>')
  lines.push('    <priority>0.7</priority>')
  lines.push('  </url>')
}

// Every foundation module — pre-rendered by scripts/prerender-modules.cjs at
// public/modules/<slug>.html.
for (const url of moduleUrls) {
  lines.push('  <url>')
  lines.push(`    <loc>${url}</loc>`)
  lines.push(`    <lastmod>${today}</lastmod>`)
  lines.push('    <changefreq>monthly</changefreq>')
  lines.push('    <priority>0.7</priority>')
  lines.push('  </url>')
}

lines.push('</urlset>')

writeFileSync(SITEMAP_PATH, lines.join('\n') + '\n')

console.log(`✓ Wrote ${SITEMAP_PATH}`)
console.log(`  - ${topLevel.length} top-level pages`)
console.log(`  - ${slugs.size} Gradient post URLs`)
console.log(`  - ${moduleUrls.length} foundation module URLs`)
console.log(`  Total: ${topLevel.length + slugs.size + moduleUrls.length} URLs`)
