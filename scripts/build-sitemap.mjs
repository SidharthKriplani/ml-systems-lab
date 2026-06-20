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

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const GRADIENT_PATH = join(ROOT, 'src/tabs/GradientTab.jsx')
const SITEMAP_PATH = join(ROOT, 'public/sitemap.xml')

const DOMAIN = 'https://ml-systems-lab-v9xe.vercel.app'

// Extract every `slug: '…'` value from the Gradient POSTS array.
const source = readFileSync(GRADIENT_PATH, 'utf8')
const slugRegex = /^\s+slug:\s+'([^']+)',\s*$/gm
const slugs = new Set()
let match
while ((match = slugRegex.exec(source)) !== null) {
  slugs.add(match[1])
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
]

for (const u of topLevel) {
  lines.push('  <url>')
  lines.push(`    <loc>${DOMAIN}${u.loc}</loc>`)
  lines.push(`    <lastmod>${today}</lastmod>`)
  lines.push(`    <changefreq>${u.changefreq}</changefreq>`)
  lines.push(`    <priority>${u.priority}</priority>`)
  lines.push('  </url>')
}

// Every Gradient post by slug
for (const slug of [...slugs].sort()) {
  lines.push('  <url>')
  lines.push(`    <loc>${DOMAIN}/?post=${slug}#gradient</loc>`)
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
console.log(`  Total: ${topLevel.length + slugs.size} URLs`)
