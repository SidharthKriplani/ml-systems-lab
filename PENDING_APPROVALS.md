# PENDING_APPROVALS

_Controller-facing approval queue. Each entry is a completed build awaiting Sidharth's review + push (or a render go-ahead). Nothing here has been auto-pushed. Read the linked files, approve, then run the proposed commands. Append new entries on top; move to the History section once actioned._

---

## ⏳ AWAITING APPROVAL — Nav Reframe IMPLEMENTED + best-of-breed adoption (23 Jun 2026)

**Scope:** Implemented the four-frame nav reframe (`docs/NAV-REFRAME-SPEC.md`) per the HQ ACTIVE DISPATCH in `NEXT.md`, with its three correction overlays (delegation link-outs, D-16 component adoptions, D-18 archive). **Reorg only — no tab/data/content edited.** Authorized override of the freeze for this one reorg; daily LinkedIn post continues.

**Status:** **Code written + esbuild full-bundle clean (EXIT 0).** NOT yet `npm run build` (macOS-only) — Sidharth runs it as the deploy gate. **Approve-first, not pushed.**

### What was done
- **`src/App.jsx`** — `NAV_SECTIONS` → KNOW/DO/BUILD/JUDGE (+ PREP·ASSESS for Combinator/Mock/Take-Home/Verbal); `BOTTOM_NAV_ITEMS` → 5-slot ladder; DO rung **links out** to PL (Python) + PAL (SQL), no stubs; `NavItem` external-link branch; `aria-current` on sidebar + bottom nav. All 40 routable tabs verified reachable (0 orphans).
- **Components (D-16):** `src/components/Icon.jsx` adopted from PAL (+`x` glyph); `Icons.jsx` now a shim → PAL Icon (11 call-sites untouched); `HowToStrip` merged with PAL `HowTo` API (`color` + 3-step cap); `FidelityBadge` `aria-expanded`.
- **Archive (D-18):** original `Icons.jsx` → `src/_legacy/Icons.jsx` (not deleted).
- **Deferred (scope discipline):** wholesale PAL Sidebar visual transplant (kept MSL sidebar + aria-current; render-gated), paywall/progress/KNOW-renderer swaps.

### Read these for approval (in order)
- `git diff src/App.jsx` — the reframe (main read).
- `src/components/{Icon.jsx, Icons.jsx, HowToStrip.jsx, FidelityBadge.jsx}` + `src/_legacy/Icons.jsx`.
- `docs/NAV-REFRAME-SPEC.md` §2 (placement) for the intended mapping.

### ⚠️ Must verify on macOS before deploy (sandbox can't run Rollup/Vite)
Run `npm run build` + `npm run dev`, then this QA: 5 bottom-nav items render/highlight; each frame opens its tabs; DO shows ML Coding/Spark/dbt + the two `↗` sibling-lab link-outs (open PL repo / PAL); Icons render everywhere (check/cross/warning via PAL Icon); HowToStrip + FidelityBadge intact.

### What was done
### Proposed push (Sidharth runs after review — never auto-pushed; D-18 tag first)
**zsh note:** do NOT paste lines with inline `#` notes — interactive zsh passes `#…` to git as bad pathspecs (that's what caused the misleading "working tree clean" + `fatal: #: no such path`). The block below is `#`-free.

Step 1 — tag + build + smoke-test:
```bash
cd ~/Documents/Professional/BreakLabs/labs/ml-systems-lab
rm -f .git/index.lock .git/HEAD.lock
git tag pre-four-frame-reframe
npm run build
npm run dev
```
Smoke-test the QA list above, then Ctrl-C. Step 2 — only if the build is clean AND QA passes:
```bash
cd ~/Documents/Professional/BreakLabs/labs/ml-systems-lab
rm -f .git/index.lock .git/HEAD.lock
git add src/App.jsx src/components/Icon.jsx src/components/Icons.jsx src/components/HowToStrip.jsx src/components/FidelityBadge.jsx src/_legacy/Icons.jsx docs/NAV-REFRAME-SPEC.md NEXT.md LINEAGE.md PENDING_APPROVALS.md
git commit -m "nav(reframe): MSL IA under four frames (KNOW/DO/BUILD/JUDGE) + D-16 component adoption — reorg only, no content"
git push origin main
```
_`git tag pre-four-frame-reframe` is the D-18 recoverable point (push it with `git push origin pre-four-frame-reframe` if you want it on origin)._

### Notes / gotchas
- **esbuild full-bundle of the app passed in-sandbox (EXIT 0)** — but Rollup/Vite is macOS-only, so your `npm run build` is the real deploy gate.
- The two DO link-outs open **external** sibling labs in a new tab: PL = `github.com/SidharthKriplani/programming-lab` (no live Vercel URL yet — points at the repo), PAL = `experimentation-systems-lab.vercel.app`. Swap to PL's live URL once it deploys.
- Per `BreakLabs/CLAUDE.md`: full repo path, clear `.git/*.lock` before staging, build on macOS, approve-first, never auto-push.

---

## ⏳ AWAITING APPROVAL — Four-Frame Reframe Audit (22 Jun 2026)

**Scope:** Map MSL's existing surface onto the Competence Model's four frames (`HQ/COMPETENCE-MODEL.md`, DEC-15) — recall+depth → fluency → ownership → judgment. **Read-only / propose-only. No nav rebuilt, no content added, no code touched — content freeze respected** (the audit builds nothing; it's a docs artifact + a proposed IA).

**Status:** One audit doc written; spine docs updated. Prepared as a PROPOSED PUSH. **Not pushed. No restructure built.**

### What was done
1. **`docs/FOUR-FRAME-AUDIT.md`** (new) — full surface inventory; per-surface frame tags (primary + optional secondary); per-frame coverage table (deep/thin/missing + standouts); gap report; a **propose-only** IA restructure under the four frames (KNOW / DO / BUILD / JUDGE + SAY ribbon + ASSESS); and a build-order note per DEC-15.
2. **`NEXT.md`** — added a STATUS (2026-06-22) block recording the audit + the headline finding, freeze kept intact.
3. **`LINEAGE.md`** — appended v4.121 entry.

### The finding (one paragraph)
MSL is an **hourglass**: a deep **recall+depth** floor (Gradient ~140+ essays / Foundations Path 34 / Ground-Up 20 / 378-MCQ Trainer) and an over-indexed **judgment** apex (~20 scenario tabs + Spot-the-Flaw 12 + Incident Room + Staff Layer 30 + Code Bugs 26), **pinched at FLUENCY** (only ≈13–15 ML-coding problems; no Python/DSA bank, no consolidated SQL bank — SQL exists only as bug-hunt snippets + dbt) and thin at **ownership-scaffold** (3 tabular ProjectLabs). The ladder is an elimination sequence, so the thin middle is the worst place to be thin: judgment content silently assumes a fluency the lab never built. **Load-bearing gap = fluency** — which is exactly the Python-DSA + SQL build already requested. The audit independently confirms it as priority #1 for when the freeze lifts.

### Read these for approval (in order)
- `docs/FOUR-FRAME-AUDIT.md` — the audit (main read). §3 coverage table, §4 gap report, §5 proposed IA, §6 build order.
- `HQ/COMPETENCE-MODEL.md` — the model it maps to (context).
- `NEXT.md` → STATUS (2026-06-22) block · `LINEAGE.md` → v4.121 (close-out).

### Open decisions (need your call)
- [ ] **Approve the audit** + the propose-only IA direction (KNOW / DO / BUILD / JUDGE).
- [ ] **Green-light the fluency build first** (Python+DSA + SQL banks → the new "DO" frame) when the freeze lifts, SQL held to a researched variety standard.
- [ ] **STATUS file:** MSL still has no `STATUS.md` (status lives in `NEXT.md` / `CLAUDE.md` / `BRAIN_TRANSFER.md`). Create a real `STATUS.md`, or keep status in `NEXT.md`? (Unresolved from the prior session.)
- [ ] **Approve the proposed push** (commands below) — never auto-pushed.

### Proposed push (Sidharth runs after review — never auto-pushed)
```bash
cd ~/Documents/Professional/BreakLabs/labs/ml-systems-lab && \
rm -f .git/index.lock .git/HEAD.lock && \
git add docs/FOUR-FRAME-AUDIT.md NEXT.md LINEAGE.md PENDING_APPROVALS.md && \
git commit -m "docs(audit): Four-Frame (Competence Model) audit of MSL — propose-only, no code, freeze respected" && \
git push origin main
```

### Notes / gotchas
- Per `BreakLabs/CLAUDE.md`: full repo path, clear `.git/*.lock` before staging, build runs on macOS only (no build needed here — docs only), approve-first, never auto-push.
- Working tree was clean apart from these docs (Session-B 5D build already committed at `a828dad`).

---

## ✅ History (approved / actioned)

- **5D content audit + framework + batch_03 LinkedIn drafts (22 Jun 2026)** — `docs/CONTENT-AUDIT-5D.md`, `docs/CONTENT-FRAMEWORK.md`, `docs/linkedin/batch_03_msl.md` + 3 unscheduled MSL tracker rows. Committed `a828dad`. (3 gap-filler post drafts remain unrendered, held at the content-first gate — render on go-ahead.)
