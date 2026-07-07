#!/usr/bin/env node
// prerender-modules.cjs — build-time static HTML generation for foundation modules.
//
// MSL is a hash-routed SPA (`#tab`) — search engines only ever see one URL for the
// whole app. This script generates one static, fully-crawlable HTML page per
// foundation module (~200 modules across src/data/foundations/*Modules.js) with
// real semantic markup + a CTA back into the live interactive tab.
//
// Run before vite build:
//   node scripts/prerender-modules.cjs && vite build
//
// Outputs:
//   public/modules/<moduleId>.html  — one per module
//   public/sitemap.xml              — module URLs + static top-level pages (shared
//                                      with prerender-posts.cjs's sitemap section —
//                                      this script owns the "modules" URL block and
//                                      leaves the "posts" block for that script to
//                                      merge in; see mergeSitemap() below)
//
// Reference implementation: genai-systems-lab/scripts/prerender-gt.js (structure,
// vm-based data extraction, HTML template, sitemap generation).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data', 'foundations');
const TABS_DIR = path.join(ROOT, 'src', 'tabs', 'foundations');
const OUT_DIR = path.join(ROOT, 'public', 'modules');

const BASE_URL = process.env.SITE_BASE_URL || 'https://ml-systems-lab-v9xe.vercel.app';

// ── Balanced-bracket / string-aware scanner ──────────────────────────────────
// Extracts the substring `[ ... ]` (or `{ ... }`) starting at `startIdx`
// (which must point at the opening bracket), correctly skipping over the
// contents of '...' / "..." / `...` strings — including nested `${ ... }`
// template expressions, which some module files use to build SVG figures
// programmatically (e.g. `.map(x => \`<rect .../>\`).join('')`).
function findMatchingEnd(str, startIdx) {
  const stack = [str[startIdx]];
  let i = startIdx + 1;
  while (stack.length > 0 && i < str.length) {
    const c = str[i];
    const top = stack[stack.length - 1];
    if (top === "'" || top === '"' || top === '`') {
      if (c === '\\') { i += 2; continue; }
      if (top === '`' && c === '$' && str[i + 1] === '{') { stack.push('{'); i += 2; continue; }
      if (c === top) { stack.pop(); i++; continue; }
      i++; continue;
    }
    if (c === "'" || c === '"' || c === '`') { stack.push(c); i++; continue; }
    if (c === '[' || c === '{' || c === '(') { stack.push(c); i++; continue; }
    if (c === ']' || c === '}' || c === ')') { stack.pop(); i++; continue; }
    if (c === '/' && str[i + 1] === '/') { while (i < str.length && str[i] !== '\n') i++; continue; }
    if (c === '/' && str[i + 1] === '*') { i += 2; while (i < str.length && !(str[i] === '*' && str[i + 1] === '/')) i++; i += 2; continue; }
    i++;
  }
  return i; // index just past the matching close bracket
}

// Extracts `export const NAME = [ ... ]` as a live JS array via vm.
function evalExportedArray(filePath, varName) {
  const src = fs.readFileSync(filePath, 'utf8');
  const marker = `export const ${varName} = [`;
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`Could not find "${marker}" in ${filePath}`);
  const openBracket = start + marker.length - 1; // index of the '['
  const end = findMatchingEnd(src, openBracket); // index just past matching ']'
  const arrayText = src.slice(openBracket, end);
  const ctx = vm.createContext({ console });
  const result = vm.runInContext(`(${arrayText})`, ctx, { filename: filePath });
  return result;
}

// ── Discover data file → array export name ───────────────────────────────────
function toVarName(camelFileBase) {
  // classicalMLModules -> CLASSICAL_ML_MODULES style guess isn't reliable
  // (acronyms), so we instead read the actual `export const NAME` from the file.
  return null;
}

function findExportedArrayName(src) {
  const m = src.match(/export const ([A-Z0-9_]+)\s*=\s*\[/);
  return m ? m[1] : null;
}

// ── Discover moduleId → tabId map from src/tabs/foundations/*FoundationTab.jsx ─
function buildTabIdMap() {
  const map = {}; // dataFileBaseName (e.g. 'classicalMLModules.js') -> tabId
  const files = fs.readdirSync(TABS_DIR).filter(f => f.endsWith('FoundationTab.jsx'));
  for (const f of files) {
    const src = fs.readFileSync(path.join(TABS_DIR, f), 'utf8');
    const tabIdMatch = src.match(/const TAB_ID = '([^']+)'/);
    const importMatch = src.match(/from ['"]\.\.\/\.\.\/data\/foundations\/([\w.]+)['"]/);
    if (tabIdMatch && importMatch) {
      map[importMatch[1]] = tabIdMatch[1];
    }
  }
  return map;
}

// ── esc / markdown-lite helpers ───────────────────────────────────────────────
function esc(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Bold + escape, preserving **bold** as <strong>.
function inline(str) {
  const escaped = esc(str);
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// Strip `[FIGURE: xxx]` reference lines/tokens.
function stripFigureRefs(text) {
  return text
    .split('\n')
    .filter(line => !/^\s*\[FIGURE:[^\]]*\]\s*$/.test(line))
    .join('\n')
    .replace(/\[FIGURE:[^\]]*\]/g, '');
}

// Render a summary string (prose, "---" section dividers, occasional
// whole-line **Bold headers**) into semantic HTML.
function renderSummary(summary) {
  if (!summary) return '';
  const cleaned = stripFigureRefs(summary);
  const paras = cleaned.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const out = [];
  for (const p of paras) {
    if (/^-{3,}$/.test(p)) { out.push('<hr>'); continue; }
    const isHeading = /^\*\*[^*]+\*\*\.?$/.test(p) && p.length < 90;
    if (isHeading) {
      out.push(`<h3>${inline(p.replace(/^\*\*|\*\*\.?$/g, '').replace(/\.$/, ''))}</h3>`);
    } else {
      out.push(`<p>${inline(p)}</p>`);
    }
  }
  return out.join('\n    ');
}

function renderList(items) {
  if (!items || !items.length) return '';
  return `<ul>${items.map(i => `<li>${inline(stripFigureRefs(i))}</li>`).join('')}</ul>`;
}

function renderCheckQuestions(qs) {
  if (!qs || !qs.length) return '';
  const blocks = qs.map((q, idx) => {
    const opts = (q.options || []).map(o => {
      const isAnswer = q.answer && o.trim().startsWith(q.answer.trim());
      return `<li${isAnswer ? ' class="correct"' : ''}>${inline(o)}</li>`;
    }).join('');
    return `
    <div class="check-q">
      <p class="check-q-text"><strong>Q${idx + 1}.</strong> ${inline(q.q)}</p>
      <ul class="check-opts">${opts}</ul>
    </div>`;
  }).join('\n');
  return `
    <h2>Check your understanding</h2>
    ${blocks}`;
}

// ── HTML template ─────────────────────────────────────────────────────────────
const DIFF_LABEL = { foundational: 'Foundational', intermediate: 'Intermediate', advanced: 'Advanced' };
const COLOR = '#e8a030'; // --prime (dark mode), MSL's amber/gold accent — src/index.css line 20

function generateHtml(mod, tabId, slug) {
  const pageUrl = `${BASE_URL}/modules/${slug}.html`;
  const appUrl = tabId ? `${BASE_URL}/#${tabId}` : `${BASE_URL}/#progress`;
  const desc = (mod.subtitle || '').slice(0, 200);
  const difficulty = DIFF_LABEL[mod.difficulty] || mod.difficulty || '';
  const readMin = mod.estimatedMin ? `${mod.estimatedMin} min` : '';
  const tags = mod.tags || [];

  const summaryHtml = renderSummary(mod.summary);
  const keyPointsHtml = renderList(mod.keyPoints);
  const recapHtml = renderList(mod.recap);
  const checkQHtml = renderCheckQuestions(mod.checkQuestions);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(mod.title)} | ML Systems Lab</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${pageUrl}">

  <meta property="og:type" content="article">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${esc(mod.title)} | ML Systems Lab">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:site_name" content="ML Systems Lab">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(mod.title)}">
  <meta name="twitter:description" content="${esc(desc)}">

  <script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: mod.title,
  description: desc,
  proficiencyLevel: difficulty,
  author: { '@type': 'Organization', name: 'ML Systems Lab' },
  publisher: { '@type': 'Organization', name: 'ML Systems Lab' },
  mainEntityOfPage: pageUrl,
  keywords: tags.join(', '),
}, null, 2)}
  </script>

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; }
    body {
      background: #0c0a08;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.7;
    }
    a { color: ${COLOR}; text-decoration: none; }
    a:hover { text-decoration: underline; }

    .top-bar {
      background: #0f0d0b;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand {
      font-size: 13px;
      font-weight: 700;
      font-family: "Courier New", monospace;
      color: rgba(255,255,255,0.6);
      letter-spacing: 0.05em;
    }
    .open-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      background: ${COLOR}18;
      border: 1px solid ${COLOR}40;
      color: ${COLOR};
      white-space: nowrap;
      cursor: pointer;
    }
    .open-btn:hover { background: ${COLOR}28; text-decoration: none; }

    .accent-bar { height: 3px; background: linear-gradient(90deg, transparent, ${COLOR}cc 30%, ${COLOR}cc 70%, transparent); }

    article { max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
    .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 20px; }
    .badge {
      font-size: 10px;
      font-family: "Courier New", monospace;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: ${COLOR}18;
      border: 1px solid ${COLOR}30;
      color: ${COLOR};
    }
    .tag {
      font-size: 10px;
      font-family: "Courier New", monospace;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.5);
    }
    .read-time { font-size: 11px; font-family: "Courier New", monospace; color: rgba(255,255,255,0.3); }
    h1 { font-size: clamp(22px, 4vw, 34px); font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 12px; letter-spacing: -0.02em; }
    .subtitle { font-size: 15px; color: rgba(255,255,255,0.55); margin-bottom: 40px; line-height: 1.6; padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.06); }

    h2 { font-size: 20px; font-weight: 700; color: #fff; margin: 36px 0 12px; }
    h3 { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.9); margin: 28px 0 10px; }
    p { font-size: 15px; color: rgba(255,255,255,0.72); margin-bottom: 16px; }
    ul { padding-left: 20px; margin-bottom: 16px; }
    li { font-size: 15px; color: rgba(255,255,255,0.72); margin-bottom: 8px; }
    strong { color: rgba(255,255,255,0.92); }
    hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 32px 0; }

    .callout {
      background: rgba(255,255,255,0.03);
      border-left: 3px solid ${COLOR};
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin: 28px 0;
    }
    .callout .callout-label { font-size: 10px; color: ${COLOR}; font-family: "Courier New", monospace; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; font-weight: 700; }
    .callout p { margin-bottom: 0; color: rgba(255,255,255,0.85); font-size: 15px; }

    .check-q { margin-bottom: 20px; }
    .check-q-text { color: rgba(255,255,255,0.85); }
    .check-opts { list-style: none; padding-left: 0; }
    .check-opts li { padding: 6px 10px; border-radius: 6px; font-size: 13.5px; }
    .check-opts li.correct { background: rgba(52,211,153,0.10); border: 1px solid rgba(52,211,153,0.25); color: rgba(255,255,255,0.9); }

    .cta-card {
      margin-top: 56px;
      padding: 28px;
      border-radius: 16px;
      background: ${COLOR}0c;
      border: 1px solid ${COLOR}30;
      text-align: center;
    }
    .cta-card h2 { margin: 0 0 8px; font-size: 18px; color: #fff; }
    .cta-card p { margin-bottom: 20px; font-size: 13px; color: rgba(255,255,255,0.45); }
    .cta-card a { display: inline-block; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; background: ${COLOR}; color: #000; }
    .cta-card a:hover { opacity: 0.9; text-decoration: none; }

    footer { text-align: center; padding: 24px; font-size: 11px; font-family: "Courier New", monospace; color: rgba(255,255,255,0.2); border-top: 1px solid rgba(255,255,255,0.04); }
  </style>
</head>
<body>
  <div class="top-bar">
    <a href="${BASE_URL}" class="brand">ML Systems Lab</a>
    <a href="${appUrl}" class="open-btn">Open interactive version →</a>
  </div>
  <div class="accent-bar"></div>

  <article>
    <div class="meta">
      ${difficulty ? `<span class="badge">${esc(difficulty)}</span>` : ''}
      ${readMin ? `<span class="read-time">${esc(readMin)} read</span>` : ''}
      ${tags.slice(0, 5).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
    </div>
    <h1>${esc(mod.title)}</h1>
    ${mod.subtitle ? `<p class="subtitle">${esc(mod.subtitle)}</p>` : ''}

    ${summaryHtml}

    ${keyPointsHtml ? `<h2>Key points</h2>\n    ${keyPointsHtml}` : ''}

    ${mod.takeaway ? `
    <div class="callout">
      <div class="callout-label">Takeaway</div>
      <p>${inline(mod.takeaway)}</p>
    </div>` : ''}

    ${recapHtml ? `<h2>Recap</h2>\n    ${recapHtml}` : ''}

    ${checkQHtml}

    <div class="cta-card">
      <h2>Try it interactively</h2>
      <p>ML Systems Lab is a free interview-prep platform for ML engineers — work through the full interactive module, quizzes, and drills.</p>
      <a href="${appUrl}">Open ML Systems Lab →</a>
    </div>
  </article>

  <footer>
    ml-systems-lab-v9xe.vercel.app · Free ML interview prep
  </footer>
</body>
</html>`;
}

// ── Generate all pages ────────────────────────────────────────────────────────

fs.mkdirSync(OUT_DIR, { recursive: true });

const tabIdMap = buildTabIdMap(); // dataFileBaseName -> tabId
const dataFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('Modules.js'));

let generated = 0;
let skipped = 0;
const moduleUrls = [];
const seenIds = new Set();

for (const file of dataFiles) {
  const filePath = path.join(DATA_DIR, file);
  const src = fs.readFileSync(filePath, 'utf8');
  const varName = findExportedArrayName(src);
  if (!varName) {
    console.warn(`  ! ${file}: no "export const NAME = [" found, skipping file`);
    continue;
  }
  let modules;
  try {
    modules = evalExportedArray(filePath, varName);
  } catch (e) {
    console.warn(`  ! ${file}: failed to eval ${varName} — ${e.message}`);
    continue;
  }
  const tabId = tabIdMap[file] || null;
  if (!tabId) console.warn(`  ! ${file}: no matching FoundationTab.jsx found (no CTA tab)`);

  for (const mod of modules) {
    if (!mod || !mod.id || !mod.title) { skipped++; continue; }
    // A handful of module ids are reused across different foundation tracks
    // (e.g. "calibration" exists in classicalML, eval, AND probabilisticML —
    // each with genuinely different content). Rather than silently dropping
    // the collision, disambiguate with a `--<tabId>` suffix so no content is
    // lost; the first-seen id keeps the clean `<moduleId>.html` URL.
    let slug = mod.id;
    if (seenIds.has(slug)) {
      slug = `${mod.id}--${tabId || file.replace('Modules.js', '')}`;
      if (seenIds.has(slug)) { skipped++; continue; }
    }
    seenIds.add(slug);
    const html = generateHtml(mod, tabId, slug);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html, 'utf8');
    moduleUrls.push(`${BASE_URL}/modules/${slug}.html`);
    generated++;
  }
}

// ── Hand module URLs off to build-sitemap.mjs ────────────────────────────────
// public/sitemap.xml is already owned by scripts/build-sitemap.mjs (it merges
// in the Gradient post URLs + top-level static pages). Rather than have two
// scripts race to write the same file, this script writes a small JSON manifest
// that build-sitemap.mjs reads and merges in. Order-independent, no clobbering.

const MANIFEST_PATH = path.join(ROOT, 'public', 'module-sitemap-urls.json');
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(moduleUrls, null, 2), 'utf8');

console.log(`prerender-modules: ${generated} module pages written, ${skipped} skipped, ${moduleUrls.length} URLs handed to build-sitemap.mjs via module-sitemap-urls.json`);
