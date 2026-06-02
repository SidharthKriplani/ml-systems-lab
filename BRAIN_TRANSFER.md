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
4. **LINEAGE.md** — 1,200+ lines. `grep -n "v4\." LINEAGE.md | tail -5` → find latest entry → Read offset ±40 lines. Never read the whole file.
5. **IDEAS.md** — 550+ lines. Read Done + Tier 1 only. Skip Tier 2/3 unless planning.
6. **AUDITS.md** — 900+ lines. `grep -n "^### #" AUDITS.md | tail -3` → find last audit → read from there.
7. **METRICS.md** — 190 lines, safe to read in full only when adding a new key.

**Estimated token savings:** ~35k tokens per session vs reading all 7 files upfront.

---

## Git Workflow (NON-NEGOTIABLE)

**End of every session, before closing:**

```bash
cd /Users/ASUS/Documents/GitHub/ml-systems-lab && \
rm -f .git/index.lock .git/HEAD.lock && \
git commit -m "v4.X: [what shipped — be specific]" && \
git push
```

**Why this matters:**
- Clears sandbox git lock issue (user runs locally if needed)
- Commit message documents what was built (appears in LINEAGE.md)
- Push auto-deploys to Vercel
- If you don't push, changes are staged but not live

**Common git message patterns:**
- `v4.48: Freemium gating, difficulty filter, lazy loading, role readiness, keyboard nav, export, audits`
- `v4.47: Mobile fixes, Gradient posts 38–40, scenario-level gating`
- Never: `v4.X: stuff` (too vague)

---

## End-of-Session Checklist (BEFORE YOU CLOSE)

**These must all be done. Check off as you go:**

- [ ] **Code:** All changes compiled (brace-balanced), all CSS variables (no hardcoded colors), no Tailwind utilities in tabs
- [ ] **Git:** Committed + pushed (or staged with lock note if sandbox-bound)
- [ ] **LINEAGE.md:** New version entry added with full build summary + date (v4.X format)
- [ ] **AUDITS.md:** All open findings documented; resolved findings marked ✅ with what fixed them
- [ ] **METRICS.md:** Every new localStorage key + PostHog event documented with schema
- [ ] **IDEAS.md:** Completed Tier 1 items moved to Done section with timestamps
- [ ] **NEXT.md:** Next 5 items queued for next session (or updated if priorities shifted)
- [ ] **DECISIONS.md:** Any new architectural rules documented; enforcement checklists added
- [ ] **CLAUDE.md:** Date updated to current session
- [ ] **Cross-check:** Read through all 7 files for contradictions. If LINEAGE says "Item 5 done" but IDEAS still shows it in Tier 1, fix it.

**Do not close until all 8 checks are done.**

---

## State Sync Examples

### Adding a new localStorage key

**Code:** `const bookmarks = JSON.parse(localStorage.getItem('msl_bookmarks') || '[]')`

**Update METRICS.md:**
```
| `msl_bookmarks` | `JSON array` | HomeTab | Array of bookmarked tab IDs. User can save modules for later. |
```

**Update IDEAS.md:** If this was a Tier 1 item, move it to Done.

**Update LINEAGE.md:** Add line to current version entry: "New localStorage: `msl_bookmarks` for saved modules."

### Fixing an audit finding

**Audit #021.5:** Mobile overflow on `.msl-cloud-map`

**Fix in code:** Add `max-width: 100%; overflow-x: auto;` to CSS class

**Update AUDITS.md:**
```
| #021.5 | .msl-cloud-map mobile overflow | MonitoringTab | Low | ✅ Fixed v4.48 — added max-width + overflow-x |
```

**Update LINEAGE.md:** Add to current version entry: "Audit #021.5 resolved: mobile overflow fix"

**Update IDEAS.md:** If this was a backlog item, move to Done.

---

## Three Rules You Cannot Break

**Rule 1: No hardcoded colors in component files**
- ✅ `color: 'var(--prime)'`
- ✅ `backgroundColor: 'rgba(240,165,0,0.1)'` (amber tint, acceptable if no exact token exists)
- ❌ `color: '#f97316'`
- ❌ `backgroundColor: '#fff'`

**Rule 2: No Tailwind utilities in `/tabs/*.jsx`**
- ✅ `className="section-eyebrow"` (utility class from index.css)
- ✅ `style={{ color: 'var(--prime)' }}` (inline with CSS variables)
- ❌ `className="bg-amber-100 text-gray-900"` (Tailwind utilities forbidden in tabs)

**Rule 3: Spine files must be in sync**
- If LINEAGE says "v4.48 complete," IDEAS must show all v4.48 items in Done
- If METRICS says "msl_read localStorage," LINEAGE must mention when it was added
- If AUDITS shows open findings, IDEAS must have them as backlog items
- No contradictions across files

---

## Common Pitfalls

**Pitfall 1: Forgetting to update METRICS.md when adding a localStorage key**
- Result: Next session doesn't know the key exists, duplicates it or uses wrong schema
- Prevention: Update METRICS.md same commit as code change

**Pitfall 2: Moving code but not updating LINEAGE.md**
- Result: Future sessions don't know when feature was added, history is lost
- Prevention: LINEAGE is written to same session you write code

**Pitfall 3: Closing session without pushing**
- Result: Code exists locally, not on Vercel, user sees old version
- Prevention: Last thing before closing: git push

**Pitfall 4: Closing session without updating NEXT.md**
- Result: Next session has no priorities, wastes time re-reading IDEAS to figure out what's next
- Prevention: Queue 5 items in NEXT.md at end of every session

**Pitfall 5: Not reading AUDITS.md at session start**
- Result: You fix something that was already fixed, or ignore a known open issue
- Prevention: Read AUDITS.md in the mandatory reading order

---

## Context for Next Agent

**Current state (v4.48 complete):**
- 36 tabs, all lazy-loaded with React.lazy() + Suspense
- Freemium gating at scenario level (`isFree` flag + AccessGate component)
- Difficulty filter pills on domain cards (`msl_difficulty_filter` localStorage)
- 3 audits resolved (index keys, mobile overflow, YouTube backfill)
- Role readiness aggregation showing seniority badges per domain
- Keyboard navigation on MCQ (1–4 keys), global search (arrows + Enter), Gradient posts (mark as read)
- Progress export utility (download localStorage as JSON)
- 40 Gradient posts with verified YouTube IDs

**Last completed batch:** v4.48 (mega-batch: v4.47 + v4.48 + 3 audit resolutions)
- Scenario-level freemium gating (AccessGate wires per-scenario `isFree` checks)
- Difficulty filter pills on domain cards (`msl_difficulty_filter`)
- React.lazy() code splitting — all 36 tabs + LoadingSpinner
- Mobile touch targets + icon fixes (9 icons, 44px targets, 375px viewport)
- Gradient posts 38–40 (Feature Drift, Training-Serving Skew, Calibration Loss)
- MCQ keyboard navigation (1–4 keys + Enter in ClassicalMLTab)
- Gradient post read marking (toggle + msl_read localStorage)
- Global search keyboard nav (arrows + Enter + Escape in ContentMap)
- HomeTab recommended module ("Start here" role-specific card)
- Role readiness aggregation (seniority badges on HomeTab)
- Progress export utility (HomeTab button + export.js)
- Audits #001, #021.5, #023.1 all resolved

**Files modified:** 35+ tab files + 3 new utility files
**Brace balance:** All verified at 0
**All 7 spine files:** Updated and consistent, no stale entries

**Open audit findings:** 0 — all findings resolved as of v4.48

**Blockers for v4.49:**
- v4.47 Item 3 (interview experiences monitoring) blocked on Avinash account setup (Formspree + Tally.so)
- Once unblocked: wire feedback form + experience submission form, test end-to-end

**Next batch (v4.49):** 5 items queued in NEXT.md
1. Interview Experiences (BLOCKED — awaiting Formspree + Tally credentials)
2. Module bookmarking "Save for Later"
3. Gradient posts 41–45
4. Interview zone accessibility audit
5. MD sync + NEXT.md v4.50 queue

---

## How to Use This File

- **First read:** At start of next session, after reading CLAUDE.md, read this entire file
- **Reference:** When you're unsure about the state model or end-of-session checklist, refer back here
- **Update:** If you discover a new pitfall or a rule that wasn't documented, add it to this file

**This file is the bridge between sessions. Treat it as truth.**


---

## CRITICAL: Folder & Repo Verification (FIRST THING EVERY SESSION)

**Before reading any MD files, verify you're in the correct repo:**

1. **Ask user:** "Which folder/repo are we working on?" 
   - Expected answer: `/Users/ASUS/Documents/GitHub/ml-systems-lab`
   - If different: clarify which repo before proceeding

2. **Verify folder has the spine files:**
   ```bash
   ls -la /path/to/repo | grep -E "CLAUDE.md|NEXT.md|DECISIONS.md|LINEAGE.md|IDEAS.md|AUDITS.md|METRICS.md|BRAIN_TRANSFER.md"
   ```
   - All 8 files must exist
   - If any missing: STOP. Wrong repo or corrupted state. Ask user.

3. **Verify git state:**
   ```bash
   cd /path/to/repo && git status
   ```
   - Should show "On branch main" and "working tree clean" (or staged changes from prior session)
   - If detached HEAD or merge conflict: STOP. Ask user to resolve.

4. **Only then:** Proceed to read BRAIN_TRANSFER.md → CLAUDE.md → NEXT.md → ...

**Do not assume the folder. Ask. Verify. Proceed.**

