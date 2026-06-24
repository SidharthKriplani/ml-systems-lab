# BRAIN_TRANSFER.md — Session Handoff for ML Systems Lab

**For the next agent/session:** Read this first. Then read:
1. **`docs/STRATEGY_CRITIQUE_2026-06-21.md`** — the gate doc, mandatory before any new build work.
2. **`CLAUDE.md`** — session rules.
3. **`NEXT.md`** — the active queue (currently LinkedIn-first, content-frozen).
4. **`/Users/ASUS/Documents/Professional/LinkedIn/docs/STATUS.md`** — cross-lab context. The LinkedIn project drives MSL's next 30 days.
5. **DECISIONS.md, LINEAGE.md (grep latest), IDEAS.md, AUDITS.md (grep open), METRICS.md** in that order, on demand.

---

## LATEST STATE (2026-06-24, v4.128–v4.130) — Component audit #033 + salvage

A full **component-tier audit + cleanup + salvage** ran on the frozen nav (freeze-overrides authorized inline by the user; no net-new content beyond recovered orphan content). Shipped to origin/main (`ea131eb` v4.128, `5b33892` v4.129, + pending loose-end v4.130):
- **`docs/COMPONENT_RUBRICS.md`** (new) — Existence Gate + Component Quality rubrics, the tier above `CONTENT_QUALITY_BAR.md`. Applied audit = `AUDITS.md #033`. Governance rules in `DECISIONS.md` ("Component governance", 6 rules incl. **"unwired ≠ redundant"**).
- **R1:** only real redundancy. `src/data/questionBank.js` = single source of truth; Trainer + Combinator import it (Combinator had ~31 verbatim copies of Trainer).
- **R9 DRY:** `src/components/TabHeader.jsx` (×16 of 17 tabs migrated), `src/utils/shuffle.js`.
- **Dead code → `_legacy/`:** GlobalSearch, JDPrepTab, testimonials.js (Icons.jsx kept — live shim).
- **Depth (R7) corrected:** core ML tabs 23–57; only DataModeling/dbt/DLServing (~10–11) thin (periphery).
- **Salvage:** the 3 orphans held UNIQUE content. DataScience → 13 MSL scenarios into ModelEval (Metric Pitfalls module + Calibration 6→14); experimentation = PAL (archived). **AskTab restored + merged with search** (KNOW frame). GlobalSearch INDEX → `src/data/searchIndex.js`.
- **Build note:** `npm run build` "# in root" error = inline `# comments` in pasted commands (zsh passes `#` as vite root arg); run it with NO comment. Repos live at `…/BreakLabs/labs/`.
- **Next:** distribution (GSC/sitemap, LinkedIn, email capture) — the audit was a freeze-safe detour, freeze still in force.

---

## PRIOR STATE (2026-06-23, v4.121–v4.127) — nav/brand reframe

The lab's **nav + brand were overhauled** since the v4.119 freeze, under a one-off HQ override (reorg/brand only, no content). All shipped to origin/main (latest `c515835`):
- Four-frame nav (KNOW/DO/BUILD/JUDGE + PREP·ASSESS), PAL-visual accordion + smooth animation + frame icons, 5-slot mobile bottom nav (mobile/desktop switch fixed in v4.127).
- BreakLabs **BrandMark** (D-19): stacked `break⌇labs / ML Systems` lockup, favicon, OG card, wired across the app; old assets in `_legacy/`.
- DO link-outs corrected (Python → PL repo, SQL → PAL `/#/sql-lab`).
- **By Domain axis explored then removed** (lopsided per-domain content); parked pending phase-2 content tagging.
- **The override is spent — content freeze is back in force.** Detail: `LINEAGE.md` v4.121–v4.127, `NEXT.md` "DONE & SHIPPED", `DECISIONS.md` DEC-2026-06-23-NAV.

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
cd "/Users/ASUS/Documents/Professional/GitHub/upskill platforms (4)/ml-systems-lab"
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

**⚠️ READ FIRST: MSL is in CONTENT FREEZE as of v4.119 (2026-06-21).**

Before doing anything: read `docs/STRATEGY_CRITIQUE_2026-06-21.md` in full. It captures the strategic pivot that gates this entire project. The next agent does NOT have permission to write new MCQs, Simplify versions, SEO guides, tabs, labs, or spine files. Only acceptable work is distribution (email capture, GSC submission, sitemap, UTM tags, LinkedIn-driven bug fixes). See "HARD RULE" in NEXT.md.

Also read the LinkedIn project mounted at `/Users/ASUS/Documents/Professional/LinkedIn/` — specifically `docs/README.md` and `docs/STATUS.md`. The LinkedIn project is the active driver for MSL right now. MSL is downstream.

---

**Current state (v4.119 complete — 2026-06-21):**

### What's true RIGHT NOW (top of the stack)

- **MSL has 182 Gradient posts, 378 Quiz MCQs, 132 Simplify versions, 50 SEO interview guides, 174 prerendered static HTML files, 188 sitemap URLs.** Content backlog is closed. No more content batches.
- **The LinkedIn project (separate folder, mounted) is the active distribution engine.** 20 posts pre-drafted Mon Jun 22–Fri Jul 17. Style Bible locked. MSL acts as the destination lab for "MSL" engine posts (Bug Hunt, Spot the Flaw, Staff Layer) per the linkback policy.
- **A strategic critique was logged on 2026-06-21** (`docs/STRATEGY_CRITIQUE_2026-06-21.md`) identifying that the last three MSL sessions (v4.116-v4.118) shipped massive content with zero distribution. The pivot: stop building, start identity-capturing.
- **Cross-lab decision: "free forever" is BANNED in MSL copy.** Lab README badges still carry the literal phrase — flagged for removal. Linkback framing leads with experience and aims at identity capture (newsletter), never price.
- **Chat consolidation decision (2026-06-21):** previously running 3 parallel chats (MSL build, LinkedIn strategy, MSL/LinkedIn coordination). Decision: collapse to ONE coordination chat owning the ecosystem. Per-lab build chats spun up only for focused deep work, die when done. This file is part of the porting mechanism.

### What MSL session is ALLOWED to do (next 30 days)

Until MSL has either 100 verified email subscribers OR 100 weekly returning visitors:
1. Build email capture component on Home (Resend or LinkedIn Newsletter wiring)
2. Submit GSC verification + sitemap (replace `REPLACE_WITH_YOUR_GSC_CODE` in `index.html`)
3. UTM-tag any linkback URLs that LinkedIn project starts using
4. Set `VITE_POSTHOG_KEY` in Vercel env vars
5. Bug fixes / perf fixes on indexed surfaces (PostReader, OG card render)
6. Remove "free forever" badges/copy from README (decision DEC-2026-06-21-A)

### What MSL session is FORBIDDEN from doing

- Writing new MCQs, Simplify versions, SEO guides, scenarios
- Adding new tabs, labs, or zones
- Scaffolding PSL (Programming Systems Lab) or any 4th lab
- Adding new spine docs without explicit user approval
- Touching content the LinkedIn project depends on (the 50 SEO guides, the path posts) — they're now the soak content
- Reading LINEAGE.md, GradientTab.jsx, AUDITS.md, IDEAS.md in full (grep-first only)

### Version history (v4.116-v4.119, the content sessions)

- **v4.116** — 123 Quiz MCQs (posts 86-126) + 30 Simplify versions + 10 SEO interview guides (PhonePe-style format expanded to Razorpay/Flipkart/Swiggy/Meesho/Zomato/Dream11/InMobi/Razorpay-DS/Junglee-MPL/Paytm/MakeMyTrip/CRED — wait, those were earlier; v4.116 added HDFC/ICICI/Ola/Nykaa/ShareChat/PharmEasy/BYJU's/Groww/Zerodha/Tata Digital). Sitemap → 161 URLs.
- **v4.117** — 27 more Simplify versions covering remaining non-path posts with conceptual ML content (6, 28-29, 31-32, 34-37, 44-45, 49, 78-79, 83-85, 94, 109-110, 116, 121-126) + 10 more SEO guides (BharatPe/Slice/Practo/Urban Company/Navi/Acko/Cleartax/Lenskart/Apna/Mamaearth). Sitemap → 171 URLs.
- **v4.118** — 17 more SEO interview guides hitting STRATEGY target of 50 (Uber/Amazon/Microsoft/Google/Adobe/Walmart/Salesforce/Oracle/IBM/BookMyShow/boAt/AJIO/PolicyBazaar/Meesho-DS/BigBasket/Tata-1mg/Zepto). Total: 50 SEO guides ✓. Total Gradient posts: 182. Sitemap → 188 URLs. 174 prerendered HTML files.
- **v4.119** — STRATEGY_CRITIQUE_2026-06-21.md created. Content freeze rule added to NEXT.md. LINEAGE entry. **NO CODE CHANGES.** Spine-only pivot.

### Key files for v4.116-v4.119 (DO NOT regenerate — read state from them)

- `src/data/quizData.js` — 378 MCQs total (1-126)
- `src/data/foundationsSimplify.js` — 132 Simplify entries
- `src/tabs/GradientTab.jsx` — 182 posts (1-182). DO NOT add posts 183+. Don't edit existing posts unless fixing bug.
- `public/post/*.html` — 174 prerendered files. Regenerate ONLY if existing posts change.
- `public/sitemap.xml` — 188 URLs. Regenerate via `node scripts/build-sitemap.mjs` only if existing posts change.
- `docs/STRATEGY_CRITIQUE_2026-06-21.md` — **the gate doc.** Any session deciding to build new content reads this first.

### LinkedIn project (mounted folder, READ-ONLY from MSL's perspective)

Location: `/Users/ASUS/Documents/Professional/LinkedIn/`

What's there:
- `Content Style Bible.md` — voice + structure + 1,300-1,800 char rule
- `LinkedIn Growth Playbook 2026.md` — cited research on algo/formats/cadence
- `Launch Pack - Weeks 1-2.md` and `Launch Pack - Weeks 3-4.md` — 20 posts pre-drafted (Jun 22 - Jul 17), char-count-verified
- `docs/` — STATUS, NEXT, PROCESS, PATTERNS, INSIGHTS, DECISIONS, AUDITS, IDEAS, LINEAGE, README
- `LinkedIn Cards/` — 51 pre-made visual cards
- `Content Master Tracker.xlsx` — calendar + performance log

What MSL needs to know:
- LinkedIn project's first post ships Mon Jun 22 8:00 AM IST
- Linkback policy: 1-2 lab links per week, FIRST COMMENT (never body, kills reach by ~60%), only when post has a direct interactive counterpart in a lab. Weeks 1-2 are link-free.
- Best funnel = post → newsletter → lab. Newsletter isn't built yet. CRITICAL: until newsletter ships, every linkback dumps a visitor into the ghost-collector that is current MSL.
- The 50 SEO interview guides are the soak content for any visitor MSL receives.

### Earlier baseline (kept for reference, v4.115 and prior)

[Existing path/Simplify/glossary/SEO infrastructure remains — see v4.105-v4.115 entries in LINEAGE.md. Nothing in those subsystems changes in v4.116-v4.119. They are now "frozen content," not active build areas.]

### The MLE Path is the major shipped subsystem of June 19, 2026
A complete senior-MLE preparation curriculum built across v4.105–v4.111 in a single working day. Originally launched as "Foundations Path" in v4.105; renamed to "The MLE Path" in v4.111 when the scope expanded from pure first-principles to full senior-MLE-interview coverage (production engineering, MLOps, system design, interview bridge).

Key files:
- `src/data/foundationsPath.js` — 57-post ladder across 11 tiers (54 ready, 3 deferred). PATH_RELATIONS holds 54 prereq/successor entries. Exports `PATH_NAME = 'The MLE Path'` and `PATH_TAGLINE` as single source of truth for any future renames. `msl_foundations_read` and `msl_foundations_tier` localStorage keys (internal identifiers preserved across rename to keep user progress intact).
- `src/data/foundationsSimplify.js` — 54 hand-written Simplify versions, ~500-700 words each. Keyed by postId. Includes Tier 7-10 absorbed posts (1, 7, 38, 41, 43, 5, 23, 39, 40, 46, 24, 4, 72, 71, 80, 8, 13, 18) and the 5 new posts (128, 129, 130, 131, 132). Toggled via the "Simplify" button (top-right of PostReader).
- `src/data/foundationsGlossary.js` — 121 canonical concept entries, 226 lookup keys including aliases. Longest-first regex. Active inside renderInline() on Rigorous view only. Coverage spans math foundations through production engineering, MLOps, system design, and interview-specific terms.
- `src/tabs/GradientTab.jsx` — FoundationsPathView (ladder, rendered with the "MLE Path" name), PostReader path strip with prev/next + clickable ToC dropdown + prereq/successor pills, GlossaryTerm component with viewport-aware popover positioning, IN THIS POST box, Test yourself CTA, Simplify toggle. Posts 128-132 written this day. ~12,500 lines.

URL deep link: `?path=foundations#gradient` opens the ladder (URL identifier preserved across rename). `?post=<slug>#gradient` opens a specific post. Cross-tab signal `msl-open-foundations-path` event lets HomeTab, SignedOutHome, ProfilePage, and ContentMap trigger the path view when GradientTab is already mounted.

Three deferred path posts (KNN, Naive Bayes, Manifold Learning) are explicitly off the roadmap. They render in the ladder as muted italic "· deferred" labels.

### Version history this day
- v4.105: Path scaffolding + UI (Foundations Path)
- v4.106: Ensemble Methods post (127) + production-tell audit on 73/74/76 + 4 postId bug fixes
- v4.107: Forward pointers + Cmd+K + ProfilePage badge
- v4.108: ToC dropdown + keyboard nav
- v4.109: Simplify content (31 versions) + prereq graph + IN THIS POST + Test yourself CTA
- v4.110: Concept inline glossary (87 terms)
- v4.110b: Mobile hotfix (glossary popover) + spine MD sync
- v4.111: The MLE Path expansion + rename. 4 new tiers, 5 new Rigorous posts, 23 new Simplify versions, 25 new glossary terms.

### The path structure (after v4.111)
- Tier 0: Observation Discipline & Pure Math (7 posts, all ready)
- Tier 1: Statistics & Estimation (4 ready)
- Tier 2: Linear Models (4 ready)
- Tier 3: Classical Algorithms (9 total, 7 ready, 2 deferred — KNN/NB)
- Tier 4: Unsupervised & Dim Reduction (3 total, 2 ready, 1 deferred — Manifold)
- Tier 5: Evaluation & Diagnostics (7 ready)
- Tier 6: Sequence & Specialised (5 ready)
- Tier 7: Production Engineering (5 ready — posts 1, 7, 38, 41, 43)
- Tier 8: Monitoring & MLOps (5 ready — posts 5, 23, 39, 40, 46)
- Tier 9: System Design (5 ready — posts 24, 4, 72, 71, 80)
- Tier 10: Interview Bridge (3 ready — posts 8, 13, 18)

### Earlier baseline (v4.74 — 2026-06-05, kept for reference):

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
