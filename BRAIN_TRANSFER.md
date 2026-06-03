# BRAIN_TRANSFER.md — Session Handoff for ML Systems Lab

**For the next agent/session:** Read this first. Then read CLAUDE.md, NEXT.md, DECISIONS.md, LINEAGE.md, IDEAS.md, AUDITS.md, METRICS.md in that order.

---

## What This Project Is

ML Systems Lab (MSL) is a browser-only production ML judgment practice tool. 300+ scenarios across 6 engineering domains + 9 interview tools. No backend, no accounts. React 18 + Vite SPA, localStorage-only persistence, deployed on Vercel. Live: https://ml-systems-lab-v9xe.vercel.app

---

## The State Model (CRITICAL)

**These 7 MD files ARE the source of truth. They must stay in sync.**

| File | What it tracks | Read when |
|------|---------------|-----------|
| `CLAUDE.md` | Session briefing, file structure, rules, stack overview | START OF EVERY SESSION |
| `NEXT.md` | What's queued next (max 5 items, ordered) | After CLAUDE.md |
| `DECISIONS.md` | Architectural rules, constraints, enforcement checklists | Before making any design decision |
| `LINEAGE.md` | Build history (design evolution + version entries) | Understanding why something exists |
| `IDEAS.md` | Backlog (Tier 1/2/3 + In Progress + Done) | Planning what to build next |
| `AUDITS.md` | Health findings (resolved + open, by severity) | Before touching anything |
| `METRICS.md` | Analytics/storage taxonomy (localStorage keys, PostHog events) | Before adding new events/keys |

**State enforcement rule:** When you build something, update the corresponding MD file immediately. Don't defer. At end of session, all 7 files must be consistent with each other and with the code.

---

## Reading Order (token-efficient)

**Mandatory at session open — read in full:**
1. **CLAUDE.md** — rules, stack, file structure (~200 lines)
2. **NEXT.md** — what's queued this session (~120 lines)

**On demand only — never read in full:**
3. **DECISIONS.md** — only before an architectural choice (240 lines, safe when needed)
4. **LINEAGE.md** — 1,300+ lines. `grep -n "v4\." LINEAGE.md | tail -5` → find latest entry → Read offset ±40 lines. Never read the whole file.
5. **IDEAS.md** — 570+ lines. Read Done + Tier 1 only. Skip Tier 2/3 unless planning.
6. **AUDITS.md** — 950+ lines. `grep -n "⚠️ Open" AUDITS.md | head -10` for open findings. `grep -n "^| 02[0-9]" AUDITS.md | tail -5` for latest audit entry. Never read in full.
7. **METRICS.md** — ~200 lines, safe to read in full only when adding a new key.

**Estimated token savings:** ~35k tokens per session vs reading all 7 files upfront.

---

## Git Workflow (NON-NEGOTIABLE)

**End of every session, before closing:**

```bash
cd ~/Documents/GitHub/ml-systems-lab
rm -f .git/index.lock .git/HEAD.lock
git add -A && git commit -m "v4.X: [what shipped — be specific]" && git push
```

**Known sandbox issue:** The AI sandbox cannot remove `.git/HEAD.lock` due to file permissions. If `git commit` fails with "cannot lock ref HEAD", the user must run the commit from their own terminal. Always provide the exact command.

**Why this matters:**
- Commit message documents what was built (appears in LINEAGE.md)
- Push auto-deploys to Vercel
- If you don't push, changes are staged but not live

---

## End-of-Session Checklist (BEFORE YOU CLOSE)

- [ ] **Code:** All changes brace-balanced (brace delta 0), all CSS variables (no hardcoded hex in JSX), no Tailwind utilities in tabs
- [ ] **Git:** Committed + pushed (or staged with exact push command given to user)
- [ ] **LINEAGE.md:** New version entry added with full build summary + date (v4.X format)
- [ ] **AUDITS.md:** New batch entry in summary table; open findings documented; resolved findings marked ✅
- [ ] **METRICS.md:** Every new localStorage key + PostHog event documented with schema
- [ ] **IDEAS.md:** Completed Tier 1 items moved to Done section with version + timestamps
- [ ] **NEXT.md:** Next 5 items queued for next session (v4.X+1 format)
- [ ] **DECISIONS.md:** Any new architectural rules documented
- [ ] **BRAIN_TRANSFER.md:** "Context for Next Agent" section updated to current state
- [ ] **Cross-check:** No contradictions across files

---

## Update Order (end of session — this order matters)

Later files reference earlier ones. Always update in this sequence:

1. **LINEAGE.md** — build history is foundational; write version entry first
2. **METRICS.md** — document all new localStorage keys + PostHog events
3. **DECISIONS.md** — update rules; flip any "planned" entries that shipped
4. **AUDITS.md** — log findings from this session
5. **IDEAS.md** — move completed items to Done section, promote audit findings to Tier 1
6. **NEXT.md** — queue 5 items for next session
7. **CLAUDE.md** — update last; only if something structural changed

**Staleness red flags — check before committing:**
1. **Version mismatch** — LINEAGE.md says "v4.5X" but DECISIONS.md still says "(planned)"
2. **Missing doc** — new tab added, no LINEAGE.md entry
3. **Incomplete status** — NEXT.md says "Done", IDEAS.md still has it "In Progress"
4. **Orphaned key** — new localStorage key created, METRICS.md has no row
5. **Audit gap** — bug fixed, not logged in AUDITS.md
6. **Wrong tense** — "v2 enhancement (planned)" when v2 shipped last session

---

## Three Rules You Cannot Break

**Rule 1: No hardcoded colors in component files**
- ✅ `color: 'var(--prime)'`
- ✅ `backgroundColor: 'rgba(240,165,0,0.1)'` (acceptable if no exact token exists)
- ❌ `color: '#f97316'`
- ❌ `backgroundColor: '#fff'`

**Rule 2: No Tailwind utilities in `/tabs/*.jsx`**
- ✅ `className="section-eyebrow"` (utility class from index.css)
- ✅ `style={{ color: 'var(--prime)' }}` (inline with CSS variables)
- ❌ `className="bg-amber-100 text-gray-900"`

**Rule 3: Spine files must be in sync**
- If LINEAGE says "v4.58 complete," IDEAS must show all v4.58 items in Done
- If METRICS says a key exists, LINEAGE must mention when it was added
- If AUDITS shows open findings, IDEAS must have them as backlog items
- No contradictions across files

---

## Common Pitfalls

**Pitfall 1: Forgetting to update METRICS.md when adding a localStorage key**
- Result: Next session doesn't know the key exists, duplicates it or uses wrong schema
- Prevention: Update METRICS.md same commit as code change

**Pitfall 2: Moving code but not updating LINEAGE.md**
- Result: Future sessions don't know when feature was added
- Prevention: LINEAGE entry written same session as code

**Pitfall 3: Closing session without pushing**
- Result: Code exists locally, not on Vercel, user sees old version
- Prevention: Last thing before closing: git push (or give exact command to user)

**Pitfall 4: Closing session without updating NEXT.md**
- Result: Next session has no priorities, wastes time re-reading IDEAS
- Prevention: Queue 5 items in NEXT.md at end of every session

**Pitfall 5: Not reading AUDITS.md at session start**
- Result: You fix something already fixed, or ignore a known open issue
- Prevention: `grep -n "⚠️ Open" AUDITS.md` at session open

**Pitfall 6: Reading large files in full (causes context blowup → 1M token gate)**
- Files that must never be read in full: LINEAGE.md (1,300+ lines), GradientTab.jsx (4,300+ lines), AUDITS.md (950+ lines), IDEAS.md (570+ lines)
- Always grep-first: find the section, then Read with offset+limit
- One session = one NEXT.md batch. Close the chat after committing.

**Pitfall 7: Spawning parallel agents**
- Parallel agents each inherit the full parent context → context triples instantly
- Always sequential: one agent or one direct operation at a time
- No `isolation: "worktree"` — repo has a persistent git issue with HEAD worktree detection

---

## Context for Next Agent

**Current state (v4.63 complete — 2026-06-03):**

### Tabs
- **38 tabs total**, all lazy-loaded with React.lazy() + Suspense
- 6 practice domains: ML Engineering (7 tabs), Data Engineering (4 tabs), Deep Learning (3 tabs), Data Science (3 tabs), MLOps (2 tabs), + models/eval/design/classical
- 9 interview zone tools: Defense Plan, Combinator, Verbal, Spot the Flaw, Incident Room (v4.58), ML Coding (v4.58), Case Studies, Staff Layer, Code Bugs
- Interview zone accessible at `incidentroom` and `mlcoding` tab IDs

### Content
- **50 Gradient posts** — all with verified YouTube IDs (0 empty arrays)
- **Code examples in posts:** 1, 4, 5, 7, 8, 11, 12, 15, 18, 22, 23, 24, 25, 35, 36, 37, 39 — 17 posts now have embedded Python code blocks
- **3 Project Lab datasets:** Telco Churn (5 phases complete), Loan Default (4 phases complete), Fraud Detection (4 phases complete)
- **Series taxonomy:** 5 named series across all 50 posts (Silent Failures, Production Diagnostics, Architecture Decisions, Math & Foundations, Interview & Career)

### Features
- Freemium gating at scenario level (`isFree` flag + AccessGate component)
- Difficulty filter pills on domain cards (`msl_difficulty_filter`)
- React.lazy() + Suspense on all 38 tabs (initial bundle is lightweight)
- Dual theme system: parchment light + charcoal dark (sun/moon toggle, `msl_theme`)
- Module bookmarking (BookmarkButton on 18 tabs, `msl_bookmarks`)
- Progress export utility (HomeTab, downloads all `msl_*` localStorage as JSON)
- MCQ keyboard nav (1–4 keys + Enter in ClassicalMLTab)
- Gradient post read marking (`msl_read` localStorage)
- Global search keyboard nav (arrows + Enter + Escape in ContentMap)
- FidelityBadge 3-tier system on all 27 practice + interview tabs (faithful/simplified/conceptual)
- Role readiness aggregation (seniority badges on HomeTab)
- Company logos via Clearbit API in CombinatorTab company tracks + LandscapeTab (6 companies)
- RSS feed: `public/rss.xml` (50 posts, auto-regenerated on build via `scripts/generate-rss.cjs`)
- PWA: `public/manifest.json` + `public/sw.js` (installable on iOS/Android)
- Live Drift Lab in MonitoringTab: real PSI + KS computation via Pyodide (`faithful` tier)
- Practice zone: overall % + per-domain % on grid headers
- Interview zone: session history pills (sessions run, avg score) from `msl_combinator_history`

### Design system
- CSS tokens: `--card-pad-primary`, `--card-pad-secondary`, `--prime-bg-light`, `--card-tint`, `--card-scrim` all in `:root` and `[data-theme="light"]`
- No stray hex in rendered JSX (all remaining hex are in print CSS or Python matplotlib strings)
- No decorative emoji in rendered UI (country flags + functional glyphs ✓ ✗ ★ ✕ kept)

### Open audit findings (as of v4.59)
- **#001.6** Low — 56 array index `key` props (not fixed, deferred)
- **#024.2** Low — AttentionHeadVisualizer uses `rgba(99,102,241,...)` — intentional interpolation
- **#024.4** Low — TrainerTab SR is domain-level only, not per-scenario
- **#024.8** Low — CausalDAGExplorer + StreamingStabilityLab have no fidelity badges
- **#025.5** Low — `.msl-cloud-map` overflow-x needs mobile browser verification
- **#030.6** Low — `BRAIN-TRANSFER.md` + `PENDING.md` still present as stubs; need `git rm` from user terminal
- All high/medium findings resolved

### Blockers
- **Interview Experiences** — waiting on Avinash Formspree + Tally.so credentials
  - Formspree: wire `REPLACE_WITH_YOUR_FORMSPREE_ID` in `src/components/FeedbackChip.jsx`
  - Tally.so: wire `REPLACE_WITH_YOUR_TALLY_ID` in `src/App.jsx` InterviewGrid card

### v4.63 sprint — DONE
1. ~~**Three-tier completion**~~ — 100/100 Combinator + 60/60 Trainer, all 8 missing questions filled.
2. ~~**Dead code removal**~~ — PracticeGrid, InterviewGrid, InterviewToolCard, TagFrequencyChart, ALL_PRACTICE_TABS, INTERVIEW_EXPERIENCES import all removed from App.jsx.
3. ~~**Defense pack scenarios**~~ — ClassicalML +1 (stacking judgment), MLOpsDeploy +1 (SageMaker register→canary), AirflowTab +1 (Glue vs Lambda), MLCoding +3 (retry decorator, Pydantic ModelConfig, CDC dedup).
4. ~~**Incident Room → 6 scenarios**~~ — inc4 (resolution lag), inc5 (feature store silent schema mismatch), inc6 (zero-variance predictions from stale snapshot).
5. ~~**ML Coding → 6 problems**~~ — mlc4–mlc6 added above.

### v4.64 sprint — queued (see NEXT.md)
1. Three-tier format pass on IncidentRoomTab steps (whatsTested/antiPattern/staffFraming).
2. isFree per-case gating first pass (5 highest-traffic tabs).
3. Unblock Interview Experiences (awaiting credentials).
4. HyperparamScenarios three-tier pass (ClassicalMLTab).
5. MLOpsDeploy scenario 8 — batch inference at scale.

---

## CRITICAL: Folder & Repo Verification (FIRST THING EVERY SESSION)

**Before reading any MD files, verify you're in the correct repo:**

1. **Verify folder has spine files:**
   ```bash
   ls /path/to/repo | grep -E "CLAUDE.md|NEXT.md|LINEAGE.md|BRAIN_TRANSFER.md"
   ```

2. **Verify git state:**
   ```bash
   cd /path/to/repo && git log --oneline -3
   ```
   Latest commit should be v4.58 or later.

3. **Clear git locks before any git operation:**
   ```bash
   rm -f .git/index.lock .git/HEAD.lock
   ```

4. **Only then:** Proceed to read CLAUDE.md → NEXT.md → build.

---

## How to Use This File

- **First read:** At start of next session, after confirming repo, read this entire file
- **Reference:** When unsure about state model or end-of-session checklist, refer back here
- **Update:** At end of every session, update "Context for Next Agent" section to current state

**This file is the bridge between sessions. Treat it as truth.**
