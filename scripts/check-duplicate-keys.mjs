#!/usr/bin/env node
// scripts/check-duplicate-keys.mjs
//
// Exhaustive duplicate-top-level-key scanner for MSL's content data files
// (src/data/**/*.js).
//
// WHY THIS EXISTS: on 2026-07-15, 26 instances of a repeated `interactiveId`
// key inside a single module object were found across 6 files -- each one
// valid JS (the second occurrence silently wins, the first is dead code) so
// `node --check` never flags it, and no content-audit round ever caught it
// either, because CONTENT-AUDIT-RUBRIC.md / 3B1B-STANDARD.md govern prose and
// numeric correctness, not object-literal structure. This script closes that
// gap mechanically, with zero dependencies (no esbuild, no network needed --
// works identically in the cloud sandbox and over the on-device bridge, where
// esbuild's native binary is broken).
//
// USAGE:  node scripts/check-duplicate-keys.mjs
// Exit 0 = clean. Exit 1 = duplicate key(s) found, with file/key/line detail.
//
// HOW IT WORKS: this codebase's module-array files are consistently formatted
// -- each module is a `  {` at exactly 2-space indent, and its direct fields
// are `    key: value,` at exactly 4-space indent. This walks every file,
// splits it into per-module chunks on the 2-space `{` boundary, and inside
// each chunk counts 4-space-indented key names, flagging any that repeat.
// It deliberately does NOT descend into nested objects (figures:{...}, SVG
// strings, etc.) since those sit at 6+ space indent and won't match the
// 4-space anchor -- so it only ever flags real direct-child key duplicates,
// not incidental "key:"-shaped text inside prose or SVG.
//
// LIMITATION: this is a formatting-convention heuristic, not a real JS
// parser -- if a module's fields are ever reformatted to a different indent
// style this script needs updating too. It was cross-checked against
// esbuild's own (network/binary-dependent, cloud-only) duplicate-key warnings
// on 2026-07-15 and produced an identical result set on all 20 files checked.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');

function walk(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function findDuplicateKeysInFile(text) {
  const lines = text.split('\n');
  const issues = [];
  let inChunk = false;
  let currentKeys = new Map();

  function flush() {
    if (!inChunk) return;
    for (const [key, lineNums] of currentKeys) {
      if (lineNums.length > 1) issues.push({ key, lines: lineNums });
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^ {2}\{\s*$/.test(line)) {
      flush();
      inChunk = true;
      currentKeys = new Map();
      continue;
    }
    if (inChunk) {
      const m = line.match(/^ {4}(\w+):/);
      if (m) {
        const key = m[1];
        if (!currentKeys.has(key)) currentKeys.set(key, []);
        currentKeys.get(key).push(i + 1);
      }
    }
  }
  flush();
  return issues;
}

const files = walk(DATA_DIR);
let totalIssues = 0;
const offenders = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const issues = findDuplicateKeysInFile(text);
  if (issues.length > 0) {
    totalIssues += issues.length;
    offenders.push({ file: path.relative(ROOT, file), issues });
  }
}

if (totalIssues === 0) {
  console.log(`OK: 0 duplicate top-level keys across ${files.length} files in src/data/.`);
  process.exit(0);
} else {
  console.error(`FAIL: ${totalIssues} duplicate top-level key(s) found:`);
  for (const o of offenders) {
    console.error(`  ${o.file}:`);
    for (const iss of o.issues) {
      console.error(`    key "${iss.key}" appears ${iss.lines.length}x at lines ${iss.lines.join(', ')}`);
    }
  }
  process.exit(1);
}
