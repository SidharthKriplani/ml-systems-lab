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

**Current state (v4.74 complete — 2026-06-05):**

### Version history this session
- v4.68: P0 fixes (guided path, dead ds, first-session directive, README)
- v4.69: P1 MVP coherence (skill-first nav, Bug Hunt, gating decision, README cleanup)
- v4.70: PAL/GSL parity (unlock.js, outcome-framed AccessGate, Plans page, Recently Added, CONTENT_QUALITY_BAR.md)
- v4.71: 3-tier gating (scenario-level isFree enforced in 4 free tabs, guestMode bypass)
- v4.72: Auth sprint (Supabase, AuthModal, SignedOutHome, ProfilePage, App.jsx wiring)
- v4.73: Depth sprint (Incident Room 12/12, ML Coding 12/12)

### Tabs
- **42 tabs total**, all lazy-loaded with React.lazy() + Suspense
- New tabs added this session: PlansTab (`plans`), ProfilePage (`profile`), SignedOutHome (rendered conditionally, not a tab)
- Nav is now **skill-first**: Features / Evaluation / Systems / Training / Data / Interview / Labs / Learn
- Trainer moved to Labs section. Code Bugs renamed to Bug Hunt (`codebugs` tab id unchanged)
- `plans` and `profile` appear as top-level sidebar links (above the nav sections)

### Content
- **Incident Room: 12/12** — inc1–inc12. inc7–inc12 added v4.73.
- **ML Coding: 12/12** — mlc1–mlc12. mlc8–mlc12 added v4.73.
- **50 Gradient posts** — all with verified YouTube IDs
- **3 Project Labs:** Telco Churn (5 phases), Loan Default (4 phases), Fraud Detection (4 phases)

### Auth (v4.72)
- Supabase project: `bgwhbpjjlbgtiukaywnv.supabase.co` (ML Systems Lab project, sidharthkriplani@gmail.com's Org)
- Google OAuth: live (Client ID `98058433335-o80fg72s721fv851t98b3d3k22q20so5`)
- GitHub OAuth: configured in Supabase but not yet live-tested
- `authEnabled = !!(VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY)` — feature-flagged via env vars
- When `authEnabled=true && !user && !guestMode`: renders SignedOutHome full-screen (no sidebar)
- `guestMode` state in App.jsx: set to `true` when user clicks "Explore without signing in"
- `user` state synced via `onAuthStateChange` — handles SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED, SIGNED_OUT
- On SIGNED_IN: pulls progress from Supabase (`pullProgressFromSupabase`)
- `src/utils/supabase.js`, `auth.js`, `syncProgress.js` are the auth utility files
- Supabase table: `user_progress (user_id, key, value, updated_at)` — see `docs/SETUP_AUTH.md`

### Gating model (two-layer, locked v4.71)
- **Layer 1 — tab-level** (`PREMIUM_TABS` set in App.jsx): Full gate for Interview zone, Labs, advanced practice modules
- **Layer 2 — scenario-level** (4 free tabs): FeatureEngTab, ClassicalMLTab, ModelEvalTab, ModelsMathTab have `isFree` flags enforced. `const [unlocked, setUnlocked] = useState(() => isUnlocked())` in each. `onUnlock={() => setUnlocked(true)}` triggers immediate re-render.
- `src/utils/unlock.js` is the single source of truth: `isUnlocked()`, `unlock()`, `getAccessTier()`, `ACCESS_CODE`, `STORAGE_KEY`
- `GATE_COPY` map in App.jsx: 27 entries, outcome-framed copy per premium tab

### Monetization / Plans
- `PlansTab.jsx` (`plans` tab): 3-tier display (Guest / Free account coming soon / Full Lab). Feature table 22 rows. WhatsApp beta group + founder DM linked.
- WhatsApp: `https://chat.whatsapp.com/KqFoGxAW0XMF9hNllGyAo9`
- Founder WA: `https://wa.me/917838438784`

### Key files added this session
- `src/utils/unlock.js` — access tier single source of truth
- `src/utils/supabase.js` — Supabase client (env-var gated)
- `src/utils/auth.js` — OAuth + email sign-in helpers
- `src/utils/syncProgress.js` — push/pull msl_* to Supabase
- `src/components/auth/AuthModal.jsx` — 3-method sign-in modal
- `src/tabs/SignedOutHome.jsx` — full-screen landing with ghost snippets
- `src/tabs/PlansTab.jsx` — conversion surface, 3-tier
- `src/tabs/ProfilePage.jsx` — 5-card profile (identity, stats, sync, study plans, settings)
- `docs/SETUP_AUTH.md` — Supabase + OAuth setup guide
- `docs/CONTENT_QUALITY_BAR.md` — 4-check scenario quality standard

### Open audit findings (as of v4.73)
All high/medium findings resolved. Low findings remaining:
- **#001.6** — 56 array index `key` props (deferred)
- **#024.2** — AttentionHeadVisualizer rgba hex (intentional interpolation)
- **#024.4** — TrainerTab SR domain-level only
- **#024.8** — CausalDAGExplorer + StreamingStabilityLab missing fidelity badges
- **#025.5** — `.msl-cloud-map` mobile overflow unverified
- **#030.6** — `BRAIN-TRANSFER.md` + `PENDING.md` stubs need `git rm` from user terminal

### Blockers
- **Interview Experiences** — waiting on Avinash: `REPLACE_WITH_YOUR_FORMSPREE_ID` in FeedbackChip.jsx, `REPLACE_WITH_YOUR_TALLY_ID` in App.jsx InterviewGrid
- **Git lock** — sandbox cannot remove `.git/index.lock`. User must run `rm -f .git/index.lock .git/HEAD.lock` before every commit.
- **GitHub OAuth** — not yet live-tested (Supabase provider enabled, redirect URI not confirmed)

### v4.74 additions
- `src/components/HowToStrip.jsx` — reusable entry context strip, applied to 9 tabs
- Session memory keys: `msl_featureeng_active`, `msl_classical_active`, `msl_modeleval_active`, `msl_mathfound_active`
- AccessGate dispatches `CustomEvent('msl-unlock')` on success; App.jsx listener syncs `isUnlocked` state

### Next sprint
See NEXT.md. Remaining intuition items: forward pointers on scenario reveals, empty state improvements.

**Do NOT start:** new content domains, new tabs beyond what's in NEXT.md, public distribution, Stripe, SpotTheFlaw three-tier pass (secondary), auth expansion beyond Google OAuth.

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
