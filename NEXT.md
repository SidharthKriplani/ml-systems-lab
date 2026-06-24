# NEXT.md — Session Queue

---

## ✅ DONE & SHIPPED — Four-Frame Nav Reframe arc (2026-06-23, origin/main)

The whole nav/brand arc below is **complete and pushed to origin/main** (Vercel live). In order:
- `e1b7fd0` — **four-frame nav** (KNOW / DO / BUILD / JUDGE + PREP·ASSESS), PAL-visual sidebar (retokenized), one-open-per-level accordion + measured-height animation, frame icons, `aria-current`, BottomNav 5-slot ladder. DO rung link-outs: Python → PL repo, SQL → PAL.
- `73be7a2` — **BreakLabs BrandMark (D-19)** across slots 1–7: stacked `break⌇labs / ML Systems` (gold) sidebar lockup, favicon monogram, OG card (1200×630), wired into hero/auth/gate/footer/loader; old assets archived to `_legacy/`.
- `d23e97a` — **By Domain axis REMOVED** (explored as filter `296b922` then DomainHub page `a978b09`; both surfaced mostly placeholders — MSL per-domain content is lopsided, audience self-selects by frame not topic → dropped, see `LINEAGE.md` v4.124–v4.126). **SQL link-out fixed** to `product-analytics-lab.vercel.app/#/sql-lab`.
- Best-of-breed component adoptions (D-16): PAL `Icon.jsx`, merged `HowToStrip` API, `FidelityBadge` aria. The **sidebar interaction standard** is codified in `HQ/DESIGN-STANDARD.md` ("THE SIDEBAR STANDARD") + MSL's UI inventory.

- `c515835` — **mobile nav fix (v4.127):** the sidebar was stuck open on phones (an inline `display:flex` overrode the responsive hide); dropped it so the CSS governs. Mobile = bottom nav only; desktop = sidebar only.

**Net state:** clean four-frame nav, BreakLabs lockup, honest DO link-outs. No domain axis. Only loose item: `public/rss.xml` (build artifact) — ignore or fold into next commit.

**Parked (only if revisited):** the domain hub needs **phase-2 content tagging** (a `domain` tag on every Gradient post / MCQ / scenario) to show real filtered content like GSL — a content build, not worth it pre-distribution.

**Back to the standing rule:** the HQ reframe override is **spent**. The **content freeze below is back in force** — distribution-first only.

---

## ▶ ACTIVE DISPATCH (HQ, 2026-06-23) — DONE ✅ (four-frame reframe shipped; see "DONE & SHIPPED" above)

**Authorized by Sidharth.** This overrides the content-freeze below *for this one piece of work only* (it's reorg-only — no new content, so it respects the freeze's spirit). **Condition: the daily LinkedIn post keeps running** — the reframe does not replace the keystone. Everything else in the freeze still holds.

**What to build:** implement `docs/NAV-REFRAME-SPEC.md` (it's implementation-ready — every `App.jsx` edit is spelled out in its §4). Reorg nav to **KNOW / DO / BUILD / JUDGE** (D-15, not "DEC-15"). Apply these **three correction overlays** on top of that spec:

**1. Delegation fix (the spec has a bug).** The spec's two `⊘` "to-build" rows — "Python & DSA bank" and "SQL problem bank" (§2 table + §3) — are **NOT MSL's to build**. Per D-15 + D-16, Python fluency lives in **PL** (now live, GitHub repo `programming-lab`) and SQL fluency in **PAL**. Re-label those rows as **link-outs to the sibling labs** ("Python fluency → PL ↗", "SQL fluency → PAL ↗"), not "TO BUILD". MSL keeps its own `mlcoding` (ML-specific coding, `PythonCell`-based) as real DO content; `spark`/`dbt` stay too. _True in-MSL rendering of the sibling banks is a later build gated on the shared content contract (not built yet) — for this pass, link out, don't embed._

**2. Adopt the best-of-breed components (D-16) while you're in the nav code.** The reframe is the moment to swap — don't reinvent:
- **Nav → PAL `Sidebar` visual**, but **keep MSL's derived `getTabSection` active-state + MSL's `BottomNav`** (MSL is the ideal adopter — it already has the two fixes PAL's nav lacks). Add `aria-current="page"`. Net: PAL's look on MSL's engine + mobile.
- **Icons → PAL `Icon.jsx`** (retire MSL's 3-mark `Icons.jsx`; PAL covers check/cross/warning).
- **Frame-setter → the merged component:** PAL `HowTo`'s API (`skill` prop, `steps.slice(0,3)` cap, `color` prop) on MSL's `HowToStrip` chip visual. MSL owns the visual, so MSL builds the merge.
- **Keep (MSL owns these canonical):** `FidelityBadge` (add `aria-expanded`), `GlobalSearch`+`ContentMap`, `PythonCell`, `GradientVisuals`.
- **DEFER (not this pass — real work, off the reframe's critical path):** paywall swap (`AccessGate` → PAL `GateOverlay`), progress swap (→ GSL `readiness.js`/heatmap), KNOW-renderer (→ GSL `GroundTruth`).
- **BreakLabs logo (D-19, spec `docs/BRANDMARK-ROLLOUT.md` — local copy; canonical in HQ):** the nav-header lockup **rides this reframe** (slot 1 — you're rebuilding the sidebar anyway). Do the other slots too (favicon, OG, hero, gate header, footer, loading/404). Descriptor = **`ML Systems`**, accent = **gold `#F0A500`**. Wordmark + red seam are the cross-lab constant. Old favicon/og → `_legacy/`.

**3. Archive, never delete (D-18).** Git-tag the pre-reframe state, and move any replaced file (e.g. `Icons.jsx`) to `_legacy/` — do not `rm`.

**HQ's calls on the spec's open decisions (§ "Open decisions"):**
- **Approve the nav spec** — yes, implement it.
- **Bottom-nav shape** — 5-slot ladder (Home·Know·Do·Build·Judge); ASSESS+SAY live in the Home/Today zone. No 6th slot — keep mobile clean.
- **`PRACTICE_DOMAINS`** — **repurpose as the secondary "BY DOMAIN" axis (D-20)**, not deleted: a second sidebar group (GSL's pattern) that filters/curates all four frames to one domain (ML / DL / Data Science / Causal-TS / MLOps). Each tab carries a `domain` tag alongside its frame. See spec §1 + §4.4 (updated).
- **Sequencing override** — yes, do it now (ahead of the "after distribution keystone" sequencing), because it's reorg-only and unblocks everything downstream. Conditioned on the daily post continuing.

**Scope discipline:** IA reframe + delegation fix + the three component adoptions (nav/icons/frame-setter). Nothing else. Don't bundle the deferred swaps; don't write new content.

**Build rules (CLAUDE.md):** macOS-only build (verify clean before deploy), **approve-first / never auto-push** (prepare commands, Sidharth runs them), `rm -f .git/index.lock .git/HEAD.lock` before staging, full repo path. Write MSL's own STATUS/LINEAGE on close.

---

Updated: 2026-06-21. **CONTENT FREEZE — DISTRIBUTION ONLY.** _(Superseded for the reframe only — see ACTIVE DISPATCH above.)_

After three back-to-back content sessions (v4.116, v4.117, v4.118) shipping 123 MCQs + 57 Simplify versions + 50 SEO interview guides, an outside strategy critique correctly identified that we have been **building because building is safe, and avoiding distribution because distribution can fail visibly.** See `docs/STRATEGY_CRITIQUE_2026-06-21.md` for the full critique + decision log. **Read it before opening any new MSL session.**

## HARD RULE (until reversed by user)

Until MSL has **either** 100 verified email subscribers **or** sustained 100 weekly returning visitors (PostHog measurable), the only acceptable MSL session work is:

1. Distribution (LinkedIn posts, GSC submission, sitemap submission, email capture component, UTM tagging).
2. Bug fixes that affect distribution surfaces (PostReader on indexed URLs, OG card render, etc.).
3. Performance fixes on first-load for indexed pages.

**Rejected at session-open:** new MCQs, new Simplify versions, new SEO guides, new tabs, new labs, new spine files, new strategy docs.

If a session asks "should I write content X?" the answer is "what does that move toward the 100-email or 100-return-visit goal?" If it doesn't, it doesn't ship.

## User decisions (2026-06-21)

> "log all of this for now / I am going to do exposure through linkedin first"
> "ensure statefulness for MSL, update all md files as best as you can — you will be deleted after it"

LinkedIn exposure is the priority. Build sessions are paused. v4.120 finalized the spine port.

---

## STATUS (2026-06-22) — Four-Frame Audit done (propose-only)

Two HQ-directed, **read-only/propose-only** doc builds landed since v4.120 (neither violates the freeze — no tabs/content/features built):

- **5D content audit + framework** (`docs/CONTENT-AUDIT-5D.md`, `docs/CONTENT-FRAMEWORK.md`, `docs/linkedin/batch_03_msl.md`) — committed `a828dad`.
- **Four-Frame Audit** (`docs/FOUR-FRAME-AUDIT.md`) — maps MSL's surface onto the Competence Model (`HQ/COMPETENCE-MODEL.md`, DEC-15). **Awaiting approval** (see `PENDING_APPROVALS.md`).
- **Nav Reframe Spec** (`docs/NAV-REFRAME-SPEC.md`) — implementation-ready spec for reorganizing nav under the 4 frames (KNOW/DO/BUILD/JUDGE + SAY ribbon + ASSESS), every tab placed, Fluency rung marked thin/to-build.
- **Nav Reframe IMPLEMENTED (v4.123, 2026-06-23)** — per HQ ACTIVE DISPATCH. `App.jsx` reframed to KNOW/DO/BUILD/JUDGE + PREP·ASSESS; 5-slot bottom-nav ladder; DO rung links out to PL (Python) + PAL (SQL) per D-16 delegation (no stubs); `aria-current` added (sidebar + bottom nav). Component adoptions (D-16): icons → PAL `Icon.jsx` (MSL `Icons.jsx` now a shim; original archived to `src/_legacy/`, D-18), frame-setter `HowToStrip` merged with PAL `HowTo` API (color + 3-step cap), `FidelityBadge` got `aria-expanded`. **esbuild full-bundle clean (EXIT 0); NOT yet `npm run build` (macOS-only) — Sidharth runs on Mac.** Prepared approve-first, **not pushed.** See `PENDING_APPROVALS.md`. Daily LinkedIn post continues (dispatch condition). _Deferred (not this pass): full PAL Sidebar visual transplant (kept MSL's sidebar + aria-current; render-gated), paywall/progress/KNOW-renderer swaps._

**Headline finding:** MSL is an **hourglass** — deep recall+depth floor (Gradient) + over-indexed judgment apex, **pinched at FLUENCY** (only ≈13–15 ML-coding problems; no Python/DSA bank, no consolidated SQL bank) and thin at ownership-scaffold (3 tabular ProjectLabs). The load-bearing gap is **fluency** — exactly the Python-DSA + SQL build already requested. Confirmed priority for when the freeze lifts.

**Sequence (per DEC-15, behind the freeze):** distribution keystone → fluency-coverage build (the new "DO" frame: Python/DSA + SQL, SQL to a variety standard) → IA reframe to the four frames → judgment rebalance (no net-new, reorganize under the 5D). No restructure built yet.

---

## The 5 allowed Tier 1 items (do in this order — distribution work only)

These are pulled from IDEAS.md. ANY other build work is rejected at session-open until distribution proves out.

1. **Email capture component on Home** (highest leverage). New `msl_email_captured` localStorage key + Resend/LinkedIn Newsletter API integration. Single CTA, single input. Update METRICS.md. Estimated 2-4 hours.
2. **GSC verification + sitemap submission.** Replace `REPLACE_WITH_YOUR_GSC_CODE` in `index.html`. Submit `public/sitemap.xml` in Search Console. Manual + 30 min.
3. **UTM-tag linkback URLs for LinkedIn Week 3+.** Add helper to MSL routing. 1 hour.
4. **Set `VITE_POSTHOG_KEY` in Vercel env vars.** Without it, no analytics. Manual.
5. **Remove "free forever" copy from README badges** per DEC-2026-06-21-B. Plans page too. 30 min.

---

## The handoff contract for the next session

This chat will close after the spine port. The next session (likely a unified coordination chat per DEC-2026-06-21-E) should:

1. Read `CLAUDE.md` (now has the gate at the top)
2. Read `docs/STRATEGY_CRITIQUE_2026-06-21.md` in full — mandatory
3. Read `BRAIN_TRANSFER.md` (now current to v4.119)
4. Read this `NEXT.md` for the active queue
5. If LinkedIn cross-lab context is relevant: read `/Users/ASUS/Documents/Professional/LinkedIn/docs/STATUS.md` (~50 lines)
6. Pick from the 5 allowed Tier 1 items above
7. Build OR delegate to a focused sub-chat
8. Update LINEAGE + relevant spine files at end
9. Commit + push

**Forbidden until the 100-email or 100-return-visit gate clears:** new MCQs, new Simplify, new SEO guides, new tabs, new labs, PSL scaffolding, new spine docs without user approval.

---

## NEXT 30 DAYS — LinkedIn-first exposure plan

### Week 1 (Days 1–7)

1. **Post #1 from `docs/linkedin/batch_02_msl.md`** — Mon morning IST (Tue if Mon is a holiday). UTM-tagged link to MSL.
2. **Submit GSC verification + sitemap.** Replace `REPLACE_WITH_YOUR_GSC_CODE` in `index.html` with the real GSC code. Submit `public/sitemap.xml` (188 URLs) in Search Console.
3. **Post #2 from `batch_02_msl.md`** — Wed.
4. **Post #3 from `batch_02_msl.md`** — Fri.
5. **End of week:** check PostHog for new unique visitors. Note baseline.

### Week 2 (Days 8–14)

1. **Posts #4 and #5 from `batch_02_msl.md`** — Mon and Wed.
2. **GSC indexing check** — how many of the 174 prerendered URLs has Google crawled? If <20%, the sitemap may need resubmission or crawl-quota investigation.
3. **End of week:** decision point — is LinkedIn driving any MSL traffic? PostHog dashboard answers.

### Week 3 (Days 15–21)

1. **Write batch_03_msl.md** (5 more drafts) if Week 1-2 showed any traction.
2. **Begin email-capture component design.** Single CTA on Home: "Get one production-ML judgment scenario in your inbox every week." One input, Resend or Mailchimp integration. No login.

### Week 4 (Days 22–30)

1. **Ship email capture.** Wire to backend (Resend recommended — generous free tier, simple API).
2. **Post batch_03_msl.md** — 5 posts Mon-Fri.
3. **Week 4 review:** how many emails captured? How many return visits? Decide if PSL becomes defensible (likely answer: not yet).

---

---

## ✅ DONE: The MLE Path — expansion + rename (v4.111, 2026-06-19)

**Restructure:** 7 → 11 tiers. 34 → 57 posts. 31 → 54 ready. 3 deferred unchanged. Renamed "Foundations Path" → "The MLE Path" throughout UI; internal identifiers (`foundations-path` event, `msl_foundations_read` key) preserved so existing user progress survives.

- **4 new tiers absorbing existing Gradient posts:** Tier 7 Production Engineering (posts 1, 7, 38, 41, 43), Tier 8 Monitoring & MLOps (5, 23, 39, 40, 46), Tier 9 System Design (24, 4, 72, 71, 80), Tier 10 Interview Bridge (8, 13, 18).
- **5 new Rigorous posts** written into GradientTab.jsx POSTS array: 128 Observation Discipline, 129 Class Imbalance, 130 Data Leakage Taxonomy (the 11 types), 131 Error Analysis, 132 Model Explainability.
- **23 new Simplify versions** written into foundationsSimplify.js — 5 for new posts, 18 for absorbed posts in Tier 7-10. Total Simplify entries: 54.
- **25 new glossary terms** in foundationsGlossary.js. Total: 121 canonical / 226 lookup keys with aliases.
- **PATH_RELATIONS** overhauled. 54 entries with prereq/successor edges threading the full 11-tier graph.
- **UI rename:** HomeTab card, SignedOutHome teaser, ProfilePage card, ContentMap entry, GradientTab path view, path strip, mode button — all show "The MLE Path."

## ✅ DONE: Foundations Path full subsystem (v4.105–v4.110, 2026-06-19)

**One coherent unit shipped across 6 patch versions in a single working day.**

- **v4.105** — Scaffolding: 34-post ladder in 7 tiers, `foundationsPath.js` data file, FoundationsPathView UI, PostReader path strip with prev/next, HomeTab card, SignedOutHome teaser, GradientTab mode-switch + `?path=foundations` deep link, localStorage state (`msl_foundations_read`, `msl_foundations_tier`).
- **v4.106** — Ensemble Methods post (#127) written; production-tell audits on posts 73 (XGBoost), 74 (Bias-Variance), 76 (Calibration); KNN/Naive Bayes/Manifold marked `deferred`; postId bug fix.
- **v4.107** — Forward pointer audit (POST_PRACTICE entries for all 30 path posts), Cmd+K integration (`foundations-path` STATIC_TABS entry with custom event handler), ProfilePage Foundations badge with in-progress and complete states.
- **v4.108** — Clickable ToC dropdown on the "Tier · Post N of 34" chip (groups all 34 posts by tier with current highlighted); keyboard nav within path (`[` previous, `]` next, `Esc` close).
- **v4.109** — Phase 1-3 progression model: Simplify toggle (Simplify ↔ Rigorous), IN THIS POST auto-generated section navigation, Test yourself CTA scrolling to Quiz Me. 31 Simplify versions written (~600-700 words each) in `foundationsSimplify.js`. PATH_RELATIONS prereq/successor graph with helper functions; rendered as a dashed-border strip in PostReader.
- **v4.110** — Phase 4: concept inline glossary. 87 canonical terms (166 lookup keys including aliases) in `foundationsGlossary.js`. GlossaryTerm hover-card component with viewport-aware anchor positioning (overflows fixed for right-side terms on narrow screens), Escape-to-dismiss, click-outside detection. Wired into renderInline() via wrapGlossary() helper. Active only on Rigorous view in path posts.

---

## DEFERRED — Foundations Path extensions (revisit on signal)

1. **PAL URL placeholder** — `PAL_URL` constant in `foundationsPath.js`. Update when PAL ships publicly.
2. **Production-tell audit on the other ~28 absorbed posts** — Ground Up posts (101–120) likely already have tells from initial drafting. Run verification scan if quality issues surface.
3. **Expand glossary beyond 87 terms** — 87 is a strong v1. Add more linear-algebra / DL / time-series terms when gaps surface in actual reading.
4. **"Continue from last unread" deep link on Home** — currently Home opens the ladder; could deep-link directly to the next unread post. Polish, not core.

---

## General MSL backlog (separate from Foundations Path)

1. **LinkedIn batch_01_msl.md** — drafted in v4.108 turn but unreviewed. Decide PAL vs MSL version before campaign launch.
2. **Quiz Me MCQs for posts 51–126** — 228 mechanical content questions. Was queued before the Foundations Path pivot.
3. **Extend Simplify to non-path Gradient posts** — originally framed as "ELI5 for posts 1-30." Simplify pattern from v4.109 is the canonical answer; can be applied to more posts incrementally.

---

## Explicitly off the roadmap (user decision)

- KNN, Naive Bayes, Manifold Learning posts — deferred indefinitely. Low leverage for senior MLE interview prep.

---

## Older completed sprints (kept for history)

Updated: 2026-06-17. Study Room v1 code shipped (activation pending). Current focus: intuition sprint (HowTo framing, forward pointers, UX clarity).

---

## ✅ DONE: Private-test readiness (P0) — v4.68
1. ~~Remove DAI2026 from public README~~
2. ~~Fix "Senior MLE in 4 weeks" guided path step 1~~ — changed to `classical`
3. ~~Remove dead `ds` domain from PRACTICE_DOMAINS~~
4. ~~Add first-session directive to Home~~

## ✅ DONE: MVP coherence (P1) — v4.69
1. ~~Skill-first nav~~ — Features/Evaluation/Systems/Training/Data/Interview/Labs/Learn
2. ~~Code Bugs → Bug Hunt~~
3. ~~Gating model decision~~ — tab-level is single enforcement; isFree flags enforced in 4 free tabs only
4. ~~README cleanup~~

## ✅ DONE: PAL/GSL parity sprint — v4.70
1. ~~`src/utils/unlock.js`~~ — single source of truth
2. ~~AccessGate outcome-framed copy~~ — GATE_COPY map, 27 entries
3. ~~Plans & Access tab~~
4. ~~Recently Added strip on Home~~
5. ~~`docs/CONTENT_QUALITY_BAR.md`~~
6. ~~DECISIONS.md monetization + content quality rules~~

## ✅ DONE: 3-tier gating — v4.71
1. ~~Scenario-level gate re-render fixed~~ — `isUnlocked()` + useState in all 4 free tabs
2. ~~PlansTab true 3-tier~~ — Guest / Free (coming soon) / Full Lab + feature table
3. ~~guestMode bypass~~ — "Explore without signing in" works
4. ~~DECISIONS.md two-layer gating model documented~~

## ✅ DONE: Auth sprint — v4.72
1. ~~`src/utils/supabase.js`~~ — env-var gated client
2. ~~`src/utils/auth.js`~~ — Google, GitHub, email magic link
3. ~~`src/utils/syncProgress.js`~~ — push/pull all msl_* keys
4. ~~`src/components/auth/AuthModal.jsx`~~ — 3-method sign-in modal
5. ~~`src/tabs/SignedOutHome.jsx`~~ — full-screen landing, ghost snippets
6. ~~`src/tabs/ProfilePage.jsx`~~ — 5 cards
7. ~~App.jsx wiring~~ — user state, topbar sign-in/avatar, AuthModal at root
8. ~~`docs/SETUP_AUTH.md`~~ — full setup guide
9. ~~Google OAuth live~~ — Supabase project bgwhbpjjlbgtiukaywnv

## ✅ DONE: Depth sprint — v4.73
1. ~~Incident Room → 12/12~~ — inc7–inc12 shipped (stale data, train/serve skew, cold start, GPU OOM, label leakage, canary miss)
2. ~~ML Coding → 12/12~~ — mlc8–mlc12 shipped (time-safe split, weighted P@K, Welford, early stopping, permutation importance)
3. ~~RECENTLY_ADDED updated~~

---

## ✅ DONE: Intuition sprint (v4.74)

1. ~~Unlock statefulness~~ — `CustomEvent('msl-unlock')` from AccessGate; App.jsx listener calls `setIsUnlocked(true)`
2. ~~HowToStrip component~~ — applied to 9 tabs: IncidentRoom, MLCoding, SpotTheFlaw, FeatureEng, ClassicalML, ModelEval, ModelsMath, Combinator, Verbal
3. ~~Session memory~~ — `msl_featureeng_active`, `msl_classical_active`, `msl_modeleval_active`, `msl_mathfound_active` keys; module persisted on every switch

---

## ✅ DONE: Two-gate access model (v4.79)
1. ~~Auth gate before content gate in App.jsx (premium tabs)~~
2. ~~`guestPreview` flag on one module per free tab (store/zoo/metric/pca)~~
3. ~~Two-gate logic in 4 free tabs: auth check → content check~~
4. ~~PlansTab footer copy fixed — "sign in separately to access free cases"~~
5. ~~DECISIONS.md updated with canonical gate model~~

## ✅ DONE: PlansTab pricing redesign (v4.78)
1. ~~4-plan cards: Monthly/Quarterly/Annual/Sprint with ₹ pricing~~
2. ~~Beta banner: inline sign-in + access code~~
3. ~~Feature table updated to 20 rows~~

## ✅ DONE: ResourcesTab + nav fixes (v4.77)
1. ~~"Deep Dives" → "Gradient" in NAV_SECTIONS~~
2. ~~`src/tabs/ResourcesTab.jsx` — Interview Trainer Prompt with copy button~~
3. ~~"Resources" NavItem in left sidebar~~
4. ~~Trainer prompt removed from PlansTab~~

---

## ✅ DONE: Gap-fill sprint — 5 Gradient posts 122–126 (v4.96, 2026-06-18)

Post 122: Graph ML for Fraud (GNN message passing, fraud rings, inductive learning, over-smoothing). Post 123: Real-Time Feature Engineering (latency budget, point-in-time correctness, streaming skew patterns, feature store). Post 124: LLM Production Engineering (KV cache, continuous batching, speculative decoding, INT8 vs INT4). Post 125: Hierarchical Forecasting (MinT reconciliation, THIEF, intermittent demand). Post 126: Auction Theory for Ads ML (GSP vs VCG, pCTR two jobs, floor price optimisation). All 4 interviewQs. dl series +122/124, arch +123, ds +125/126. Total: 126 posts. Brace diff 0.

---

## ✅ DONE: ML Coding 4-type + Search scenarios + CUPED post (v4.94, 2026-06-18)

**MLCodingTab:** 4-type framework (Implement / Debug / Optimise / Design) with TYPE_META constant and colored badges. 3 new problems: mlc13 Debug leaking cross-validator (2 leakage bugs to find), mlc14 Optimise pandas 10× (iterrows→groupby), mlc15 Design feature store 100K QPS (reference architecture). Type filter pills added. `filtered` array replaces `PROBLEMS.map`. Brace diff 0.

**SystemDesignTab RETRIEVAL_SCENARIOS:** +4 scenarios: ret4 BM25 AND-semantics recall collapse, ret5 embedding upgrade distribution mismatch, ret6 query intent drift morning vs evening. Total: 7 scenarios. Brace diff 0.

**GradientTab post 121 CUPED:** Full derivation, Y_cuped formula, MLRATE, 4 interviewQs, implementation at scale. Added to 'ds' series. Total: 121 posts. Brace diff 0.

---

## ✅ DONE: Left sidebar nav + 9 inline visualizations (v4.91, 2026-06-18)

`src/components/GradientVisuals.jsx` — 9 React SVG components (BiasVariancePlot, NDCGVisual, AttentionHeatmap, L1L2Geometry, PRThresholdSlider, TransformerBlock, CalibrationPlot, TwoTowerDiagram, GradientDescentPath). Each wired to a specific post via `POST_VISUALS` map; imported into GradientTab PostDetail. GradientTab list view now has a sticky left sidebar (176px) with Mode / Series / Domain as vertical nav, replacing the horizontal filter pills. Active filter label + clear button above posts grid. Brace diff 0.

---

## ✅ DONE: Interview Cheatsheet tab (v4.89, 2026-06-18)

`src/tabs/CheatsheetTab.jsx` — 4-tier last-minute prep tab:
- Tier 0 "Last Few Hours": 50 flashcard Q&As grouped by Core ML / DL / RecSys / Fraud / Experimentation / Causal / Systems
- Tier 1 "Last Day": 12 key formulas (NDCG, BM25, UCB, CUPED, PSI, etc.) + 12 common traps + 8 decision frameworks
- Tier 2 "3 Days": 8-domain audit with must-know concepts, probe questions, Gradient post links
- Tier 3 "1 Week": 7-day prep plan + 7 company profiles (Flipkart, Swiggy/Zomato, PhonePe/Razorpay, Meesho/Walmart, InMobi/Google, Dream11, GenAI startups)
Wired into App.jsx (lazy import, ALL_TABS, TAB_TO_ZONE, NAV_SECTIONS learn group). RECENTLY_ADDED updated. Brace diff 0.

---

## ✅ DONE: Interview questions on posts 51-100 (v4.88, 2026-06-18)

200 structured Q&A pairs (4 per post × 50 posts) injected into posts 51-100. Rendered via InterviewQsSection collapsible accordion. Brace diff 0.

---

## ✅ DONE: Gradient Ground Up series complete — 10 more posts (v4.87, 2026-06-18)

Posts 111–120. Ground Up series now 20 posts total (101–120). Every foundational layer covered.
OLS/Normal Equations · Regularisation geometry · Hypothesis Testing · Evaluation Metrics · Convex Optimisation · NN Initialisation · Data Preprocessing · Survival Analysis · Generalisation Theory · Matrix Calculus.
Each post: full derivation + 4 interview Qs with answers + Colab challenge.
Total: 120 posts, 12 series, ~11,500 lines. Brace diff 0.

---

## ✅ DONE: Gradient "From Ground Up" series — 10 foundational posts (v4.86, 2026-06-17)

Posts 101–110. New SERIES 'ground' (From Ground Up). Each post includes 4 interview Qs with full answers + Colab challenge.
Probability · Linear Algebra · Calculus · Information Theory · MLE/MAP · EM Algorithm · Logistic Regression · Decision Trees/RF · Word2Vec · CV Before ViTs.
Total: 110 posts, 12 series. File ~9,200 lines. Brace diff 0.

---

## ✅ DONE: Gradient 100 posts milestone — 5 final posts (v4.85, 2026-06-17)

Posts 96–100. GradientTab complete at 100 posts:
Multi-Armed Bandits (Thompson/UCB) · SVMs + Kernel Trick · Fairness in ML (impossibility theorem, Fairlearn) · RLHF + DPO · Federated Learning (FedAvg, DP, SecAgg).
New SERIES 'ethics' (Fairness & Ethics). All 11 series updated.

---

## ✅ DONE: Gradient complete FAANG DS/ML curriculum — 17 more posts (v4.84, 2026-06-17)

Posts 79–95. Gradient now has 95 posts covering the complete staff DS/ML interview surface:
BM25/TF-IDF · Semantic Search Stack · Price Elasticity · LTV/Churn · Attribution/MMM · Uplift Modeling · Multiple Testing/FDR · PCA · Clustering · Time Series · Ads CTR · RAG · Network Effects/SUTVA · DiD/RDD · Metrics Definition · Concept Drift · Anomaly Detection.
New SERIES: 'search' (Search & IR), 'ds' (DS & Causal). Total: 95 posts, 8 series.

---

## ✅ DONE: Gradient staff-level curriculum — 15 more posts (v4.83, 2026-06-17)

Posts 64–78. Full FAANG staff DS/ML interview coverage now in Gradient:
Diffusion Models · GANs · Transfer Learning · BERT vs GPT · Tokenization · Contrastive/CLIP · Two-Tower · Learning to Rank · RecSys Stack · XGBoost · Bias-Variance · Bayesian Inference · Calibration · Feature Stores · Distillation.
New SERIES: 'recsys' (RecSys & Ranking). Total Gradient posts: 78.

---

## ✅ DONE: Gradient DL expansion — 10 more posts (v4.82, 2026-06-17)

Posts 54–63 added. Full DL curriculum in Gradient now covers 13 posts across the 'Deep Learning' series (ids 30,37,51–63):
Self-Attention · Transformer Architecture · Optimization (SGD→Adam) · RNNs + LSTMs · Batch/Layer Norm · Dropout + Regularization · Loss Functions · Embeddings · VAEs · Reinforcement Learning.
New SERIES 'dl' (Deep Learning) created in GradientTab. Brace balance verified.

---

## ✅ DONE: Gradient DL deep-dive sprint (v4.81, 2026-06-17)

3 new foundational Deep Learning posts in GradientTab. Written at "deep enough to have your own Colab ideas" level — not production failure modes. All tagged domain: 'dl', added to Math & Foundations series.

- Post 51: Backpropagation: What the Chain Rule Is Actually Doing (featured, 14 min)
- Post 52: CNNs: What the Layers Are Actually Computing (13 min)
- Post 53: Graph Neural Networks: From Message Passing to PinSage (15 min)

Domain coverage: NN/Backprop, CNN/ResNet, GNN/PinSage. Each ends with a concrete Colab challenge.

---

## ✅ DONE: Study Room v1 — code shipped (v4.80, 2026-06-17)

All code is merged. The feature is NOT yet live because the Supabase tables haven't been created and the Anki cards haven't been imported. That's manual one-time setup, deferred.

Files shipped:
- `src/study/sr.js` — 4-bucket SR engine (1/3/7/14 days)
- `src/study/StudyRoom.jsx` — full-screen overlay, Supabase-fetched queue, flip/rate loop, Shift+Ctrl+K entry
- `supabase/study_schema.sql` — schema to run in Supabase SQL editor (study_cards + card_progress + RLS)
- `scripts/import_anki.py` — APKG → Supabase seeder (988 MSL cards across lane1–lane6)
- `src/App.jsx` — Shift+Ctrl+K wired, studyOpen state, StudyRoom rendered as overlay

## ⏳ PENDING: Study Room activation (one-time manual setup, ~20 min)

Do this when there's time. In order:

1. **Supabase schema** — paste `supabase/study_schema.sql` into Supabase dashboard → SQL Editor → Run
2. **Env vars in Terminal:**
   ```
   export SUPABASE_URL="https://yourproject.supabase.co"
   export SUPABASE_SERVICE_KEY="eyJ..."   # Settings → API → service_role key
   export MSL_USER_ID="your-uuid"        # Authentication → Users → your row
   export ANKI_DIR="/Users/ASUS/Documents/Professional/Anki Files/active work (claude)/batch 1"
   ```
3. **Install dep:** `pip install supabase`
4. **Navigate:** `cd "/Users/ASUS/Documents/Professional/BreakLabs/labs/ml-systems-lab"`
5. **Dry run:** `python scripts/import_anki.py --dry-run --lane lane4`
6. **Import:** `python scripts/import_anki.py --lane lane4` (Spark, 146 cards — start here)
7. **Verify:** run the verification query at the bottom of `study_schema.sql`
8. **Test:** open MSL → sign in → Shift+Ctrl+K

Start with lane4 only. Import lane3 + lane6 once lane4 loop feels right.

## STUDY ROOM v2 (after activation is confirmed — P3)
- Code drill cards (Pyodide cell in back, assertion-based auto-rating)
- System design drills (timed textarea + rubric reveal, self-rating)
- Weak topic tracker (per-lane mastery score, surface overdue lanes)
- Import lane1 (RecSys, 387 cards) + lane2 (DL, 150) + lane5 (Cloud, 75)
- "Copy queue as checklist" for manual paste into To Do / Notion

---

## CURRENT SPRINT: Intuition sprint continued (P2)

MSL is now at private-test threshold. The highest-leverage work is UX clarity — making every tab self-explanatory without a tutorial.

1. **HowTo framing strip on every tab** — borrow GSL pattern: "What you're building / Steps: 3 / 1. Configure 2. Observe 3. Diagnose." Always visible at tab entry. Applies to: IncidentRoomTab, MLCodingTab, SpotTheFlawTab, FeatureEngTab, ModelEvalTab, ClassicalMLTab, SystemDesignTab, MonitoringTab. Pure copy + layout work in each tab file.

2. **Forward pointers on scenario reveals** — at the end of every scenario reveal, link to the most relevant Gradient post. "Go deeper → [post title] in ∇ Gradient." Add `relatedPost: { id, title }` field to scenario data in FeatureEngTab, ClassicalMLTab, ModelEvalTab. Render after staffFraming. Closes the read→practice loop that GSL identified as mandatory.

3. **Unlock state propagation fix** — when a user unlocks via scenario-level gate in a free tab (e.g. FeatureEngTab), App.jsx `isUnlocked` state doesn't update. Premium tabs still show gates. Fix: dispatch `CustomEvent('msl-unlock')` from AccessGate on success; App.jsx listens and calls `setIsUnlocked(true)`. One event, no prop threading.

4. **SpotTheFlawTab audit** — 12 scenarios exist with `reveal` + `fix`. Check whether the reveal quality meets CONTENT_QUALITY_BAR.md standard (scenario-specific, production tell present). Strengthen any reveals that are too generic.

5. **DLFineTuningTab + DLServingTab content audit** — neither was touched in the three-tier pass. Check scenario count and staffFraming coverage.

---

## ✅ DONE: UX loop sprint (v4.97, 2026-06-18)

1. ~~Challenge Log on Home~~ — wrong-answer count + tab coverage cards + not-started chip list. `readChallengeStats()`.
2. ~~91-day activity heatmap~~ — 13×7 grid, `msl_activity_YYYY-MM-DD` keys. `readAndUpdateStreak()` now writes activity key.
3. ~~Interview Sim export~~ — "Start Interview Sim" toggle button → copyable trainer prompt with score summary + weak areas.
4. ~~Quiz Me posts 1–50~~ — `src/data/quizData.js` (150 MCQs, 3/post). `QuizMeSection` in GradientTab PostReader. Score in `msl_quiz_{postId}`.

## ✅ DONE: Mobile fix + METRICS sync (v4.100, 2026-06-18)

1. ~~GradientTab sidebar breaks on mobile~~ — sidebar hides at < 640px; scrollable series pill strip shown instead. METRICS.md updated for `msl_activity_*` (91-day, 7 writers) and `msl_quiz_{postId}` added.

## ✅ DONE: Activity heatmap wiring + ContentMap fix (v4.99, 2026-06-18)

1. ~~Write activity on scenario completion~~ — `src/utils/activity.js` created. `markActivity()` wired into FeatureEng, ClassicalML, ModelEval, IncidentRoom, MLCoding, GradientTab (Quiz Me reveal). Heatmap now reflects actual practice.
2. ~~ContentMap missing tabs~~ — `cheatsheet` and `resources` added to STATIC_TABS in ContentMap.jsx. Both now appear in Cmd+K search.
3. ~~Dead `jdprep` in TAB_TO_ZONE~~ — removed.

## ✅ DONE: Full-repo 10-point audit (v4.98, 2026-06-18)

All 57 JSX files clean. Root cause of repeated build failures confirmed and fixed (apostrophe scanner in CLAUDE.md). Hooks-in-map false positive cleared with correct brace-depth scanner. 444 pre-existing rgba() hardcoded colors logged as accepted debt (AUDITS.md #032) — not a build issue.

---

## ✅ DONE: Universal deep links (v4.104, 2026-06-18)

Every discrete content item in MSL now has a shareable URL. 7 tabs updated with `URLSearchParams` + `replaceState`:
- CheatsheetTab: `?tier=N#cheatsheet` + `?tier=1&section=X#cheatsheet`
- IncidentRoomTab: `?scenario=incN#incidentroom` (autoExpand prop)
- MLCodingTab: `?problem=mlcN#mlcoding` (autoExpand prop)
- SpotTheFlawTab: `?scenario=stfN#spottheflaw` (state + write-back)
- FeatureEngTab: `?module=X#features` (URL overrides localStorage)
- ModelEvalTab: `?module=X#eval`
- ClassicalMLTab: `?module=X#classical`
All brace diff 0, string audit OK.

---

## ✅ DONE: Gradient post deep links (v4.103, 2026-06-18)

Every Gradient post now has a shareable URL: `?post={slug}#gradient`. `useEffect` on mount reads `window.location.search`, finds post by slug, opens PostReader directly. `openPost(id)` + `closePost()` helpers update URL via `replaceState`. All 4 `setReading` call sites updated. No App.jsx changes needed. Brace diff 0, schema audit OK. Prerequisite for LinkedIn post campaign.

---

## ✅ DONE: Cheatsheet accordion + trade-off cards (v4.102 + v4.102b, 2026-06-18)

v4.102: 24 comparison cards in CheatsheetTab "Trade-offs ⇄" section (Last Day tier). 6 categories: Training, Architecture, Metrics, Data, MLOps, Retrieval. Each card: mechanism, USE, WATCH, collapsible interviewer probe. Category filter pills. CLAUDE.md schema validator added. Brace diff 0.

v4.102b: Redesigned to single-open accordion. Collapsed: title + colored dots + category tag. Open: full options grid + inline probe. `openIdx` state, amber border highlight. Brace diff 0.

---

## ✅ DONE: GradientTab crash fix (v4.101, 2026-06-18)

Posts 122–126 were missing `excerpt` field. `post.excerpt.slice(...)` in PostReader threw TypeError on undefined → black screen. Added excerpts to all 5 posts. 126/126 confirmed. Brace diff 0.

---

## ✅ DONE: Foundations Path Session 2 — UI scaffolding (v4.105, 2026-06-19)

1. ~~`src/data/foundationsPath.js` — 34-post ladder, 7 tiers, helpers~~
2. ~~`FoundationsPathView` component in GradientTab~~
3. ~~PostReader path strip + prev/next that walks path order~~
4. ~~HomeTab "Foundations Path" card~~
5. ~~SignedOutHome teaser~~
6. ~~GradientTab mode-switch entry + `?path=foundations#gradient` deep link~~
7. ~~PAL cross-link on Tier 1 + Tier 5~~
8. ~~METRICS.md updated (`msl_foundations_read`, `msl_foundations_tier`)~~

---

## ✅ DONE: Foundations Path Session 3 — Ensemble post + tree/linear audits (v4.106, 2026-06-19)

1. ~~Bug fix: 4 wrong postIds in foundationsPath.js (v4.105 regression) — Bayesian, XGBoost, Bias-Variance, Calibration~~
2. ~~Post 127 written: Ensemble Methods (Bagging vs Boosting vs Stacking)~~
3. ~~Production-tell audit on post 73 (XGBoost) — 4 failure modes + new interview Q on ntree_limit bug~~
4. ~~Production-tell audit on post 74 (Bias-Variance) — 4 patterns mapping bias/variance to production tells~~
5. ~~Production-tell audit on post 76 (Calibration) — 4 patterns ECE dashboards miss~~
6. ~~KNN, Naive Bayes, Manifold Learning marked `status: 'deferred'` — explicitly not on roadmap~~

---

## ✅ DONE: Foundations Path Session 4 — UI polish (v4.107, 2026-06-19)

1. ~~Forward pointer audit — POST_PRACTICE expanded with 30 entries covering every path post (73, 74, 75, 76, 86, 87, 88, 95, 96, 97, 101–108, 111–120, 127)~~
2. ~~Cmd+K integration — `foundations-path` entry in ContentMap STATIC_TABS with custom event-dispatching handler~~
3. ~~ProfilePage badge — in-progress card with progress bar OR mint-bordered "✓ Complete" badge when all posts read~~

---

## DEFERRED — MLE Path extensions (revisit on signal)

- **PAL URL placeholder.** `PAL_URL` constant in `foundationsPath.js` is `https://product-analytics-lab.vercel.app`. Update when PAL ships publicly.
- **Production-tell audit on remaining absorbed posts** (107, 108, 111, 112, 119, 75, 86, 87, 88, 95, 96, 97). Posts 73, 74, 76 done in v4.106. Posts 1, 7, 38, 41, 43, 5, 23, 39, 40, 46, 24, 4, 72, 71, 80, 8, 13, 18 all have production tells already (these are production-failure / system-design / interview posts by nature). Most Ground Up posts likely have tells from initial drafting. Run verification scan only if quality issues surface.
- **ToC dropdown density.** 57 posts in one scrollable list may feel dense. Consider a "collapse all tiers except current" default.
- **Glossary coverage in Tier 7-10 Simplify versions** is good but not exhaustive — add terms as gaps surface in actual reading.
- **Tier-progress bar inside each post** (not just inside the path view). Polish item; build if usage demands it.
- **"Continue from last unread post" deep link on Home** — currently the Home button opens the ladder; could deep-link directly to the next unread post.
- **KNN, Naive Bayes, Manifold Learning posts** — explicitly off the roadmap per user direction. Low leverage for senior MLE interview prep.

---

## General MSL backlog (separate from The MLE Path)

- **`docs/linkedin/batch_01_msl.md`** — drafted in v4.108-era session but unreviewed. PAL has a separate version. Decide on PAL vs MSL version before any LinkedIn campaign goes live.
- **Quiz Me MCQs for posts 51–126** — 228 mechanical content questions. Was originally queued before the MLE Path pivot.
- **Extend Simplify pattern to non-path Gradient posts** — originally framed as "ELI5 for posts 1-30." Simplify pattern from v4.109/v4.111 is the canonical answer; could be applied to more posts incrementally.

---

## Strategic direction logged for reference

- **`docs/STRATEGY.md`** — full competitive analysis (Dataford, Practicai/PracHub, Final Round AI, Pramp, Scaler, Interviewing.io, DataLemur, StrataScratch, Interview Query) + strategic argument for India-first senior MLE positioning + category creation around "Production ML Judgment" + 90-day execution plan. Drafted 2026-06-19. Not a spine file — working document for go-to-market planning. The eight build gaps it identifies (company-specific SEO guides, AI mock interview, ₹499 pricing tier, LinkedIn presence, certificate + LinkedIn integration, WhatsApp community, mobile polish, resume-aware path) are the candidate roadmap if MSL pursues commercial trajectory.
- **`docs/MSL_EXPOSURE_PLAN.md`** — tactical execution doc from the cross-lab operating decision (judgment-first labs, content goes public before product is perfect, backlinks wait until paths are ready). Classifies MSL surfaces into GREEN / YELLOW / RED, identifies first public CTA (The MLE Path ladder view), lists 15 LinkedIn post ideas across Judgment Challenges / India Insider / Expert Debriefs, calls out the single highest-leverage ship for backlink-readiness (Open Graph card for the path landing). Drafted 2026-06-19. This is the immediately actionable LinkedIn batch; `STRATEGY.md` is the broader strategic frame.
- **`docs/FEEDBACK_LOG.md`** — feedback aggregation. First theme logged 2026-06-19: "Onboarding overwhelm for new users" (cross-lab applicability, PAL beta tester source). Full verbatim quote + 7 proposed actions + gating decision (items 1+2 → next session, items 3-7 → deferred until real users surface). This file is the truth source for what beginners actually said vs what we assume they want.
- **`docs/COLD_HOME_SPEC.md`** — build spec for the "Your Next 30 Minutes" Home redesign. Closes feedback theme above. Replaces current Home with one card for new users: 2-question inline quiz (skippable) → single specific recommendation (post + practice + time) → "Start" CTA + "show me everything" escape hatch. Three render modes (quiz / next30 / dashboard) derived from behaviour thresholds. New `recommendationEngine.js` with 10-entry recommendation table by (level × urgency). 10 PostHog events for success metric tracking. 4 new localStorage keys. ~250 lines new code + ~30 lines edits. Single focused session (~4 hours). Spec is build-ready. Awaits decision: ship or iterate spec.

---

## NEXT: Other queued (P2)

1. ~~**Slug duplicate fix — `ab-test-failure-modes`**~~ — ✅ Fixed 2026-06-18.
2. ~~**LinkedIn drafts collision**~~ — ✅ Fixed 2026-06-18.
3. **Quiz Me posts 51–126** — 228 more MCQs (3 × 76 posts). Same format as quizData.js. Add to same file, append to QUIZ export.
4. **ELI5 mode on Gradient posts** — simplified 3-sentence summary toggle per post. Start with posts 1–30 only. Store as static data in `src/data/eliData.js`. Toggle button in PostReader header.

---

## DEFERRED (P3 — post private-test signal)

- GitHub OAuth (Supabase config exists, not yet tested)
- Per-section readiness badges (Developing/Proficient/Senior)
- Continue-your-path CTA on Home
- Stripe integration
- Company-specific tracks in Combinator
- Interview Experiences tab (blocked on Formspree + Tally credentials from Avinash)

---

## Blockers

- **Interview Experiences:** Awaiting Avinash signup for Formspree + Tally.so (`REPLACE_WITH_YOUR_FORMSPREE_ID` in FeedbackChip.jsx, `REPLACE_WITH_YOUR_TALLY_ID` in App.jsx InterviewGrid)
- **Git lock:** User must run `rm -f .git/index.lock .git/HEAD.lock` before each commit (sandbox cannot remove lock files)
- **GitHub OAuth:** Supabase provider enabled but Google Cloud Console redirect URI may need a second entry for GitHub — not yet verified live

---

## Notes for next session

- Read CLAUDE.md + this file first. Then grep AUDITS.md for open findings before touching code.
- v4.103 and v4.104 fully pushed to GitHub (universal deep links). MSL is live at v4.104.
- GitHub PAT used this session was exposed — user revoked it. Generate a fresh one before next push.
- Git remote on MSL was switched to HTTPS with PAT. After revoke+regenerate: `git remote set-url origin https://SidharthKriplani:NEW_TOKEN@github.com/SidharthKriplani/ml-systems-lab.git`
- `RECENTLY_ADDED` in HomeTab.jsx must be updated every time content ships (5-item static array)
- `GATE_COPY` in App.jsx must have an entry for any new premium tab
- `BRAIN-TRANSFER.md` + `PENDING.md` stubs still need `git rm` — open finding #030.6
- LinkedIn post campaign: 5 posts drafted with deep links — pending Sidharth to publish
