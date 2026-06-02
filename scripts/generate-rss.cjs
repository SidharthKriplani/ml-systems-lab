#!/usr/bin/env node
/**
 * generate-rss.js
 * Parses GradientTab.jsx to extract post metadata and writes public/rss.xml.
 * Run: node scripts/generate-rss.js
 * Auto-runs before build via package.json prebuild hook.
 */

const fs   = require('fs')
const path = require('path')

const src = fs.readFileSync(
  path.join(__dirname, '../src/tabs/GradientTab.jsx'), 'utf8'
)

// Match each post block: id → slug → title
// Handles both single-quoted and double-quoted title strings
const blockRe = /id:\s*(\d+),\s*\n\s+slug:\s*'([\w-]+)',\s*\n\s+title:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g

const posts = []
const seen  = new Set()
let m
while ((m = blockRe.exec(src)) !== null) {
  const id = parseInt(m[1], 10)
  if (seen.has(id)) continue   // deduplicate (some slugs repeat across rewritten posts)
  seen.add(id)
  const raw = m[3] !== undefined ? m[3] : m[4]
  posts.push({
    id,
    slug:  m[2],
    title: raw.replace(/\\'/g, "'").replace(/\\"/g, '"'),
  })
}

posts.sort((a, b) => b.id - a.id)  // newest-first for feed readers

const BASE      = 'https://ml-systems-lab-v9xe.vercel.app'
const BASE_DATE = new Date('2025-07-01T00:00:00Z')

function pubDate(id) {
  const d = new Date(BASE_DATE)
  d.setDate(d.getDate() + id * 5)   // synthetic: ~1 post per 5 days from Jul 2025
  return d.toUTCString()
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const items = posts.map(p => `
  <item>
    <title><![CDATA[${p.title}]]></title>
    <link>${BASE}/?post=${encodeURIComponent(p.slug)}</link>
    <guid isPermaLink="true">${BASE}/?post=${encodeURIComponent(p.slug)}</guid>
    <pubDate>${pubDate(p.id)}</pubDate>
  </item>`).join('')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ML Systems Lab — Gradient</title>
    <link>${BASE}</link>
    <description>Production ML judgment patterns for engineers who ship models. 50 posts on drift, retrieval, feature engineering, system design, and ML careers.</description>
    <language>en-us</language>
    <ttl>1440</ttl>
    <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

const outPath = path.join(__dirname, '../public/rss.xml')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, xml.trim() + '\n')
console.log(`RSS: wrote ${posts.length} posts → public/rss.xml`)
