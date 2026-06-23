# PENDING_APPROVALS

_Controller-facing approval queue. Each entry is a completed build awaiting Sidharth's review + push (or a render go-ahead). Nothing here has been auto-pushed. Read the linked files, approve, then run the proposed commands. Append new entries on top; move to the History section once actioned._

---

## ⏳ AWAITING APPROVAL

**Queue clear.** Nothing pending. (Session closed 2026-06-23 — the four-frame nav reframe + BrandMark arc is shipped to origin/main; see History.)

_Only loose item: `public/rss.xml` shows modified (a `npm run build` artifact) — ignore or fold into the next commit._

---

## ✅ History (approved / actioned)

- **Mobile nav regression fix (23 Jun 2026)** — the v4.123 sidebar rewrite added an inline `display:flex` to `<aside class="desktop-sidebar">`, overriding the responsive `display:none` that hides it on phones (sidebar stuck open over the bottom nav). Dropped the inline `display`. Committed + pushed **`c515835`** (with close-out docs). Detail: `LINEAGE.md` v4.127.
- **By Domain axis removed + PAL SQL link fix (23 Jun 2026)** — explored as a sidebar filter (`296b922`) then a DomainHub page (`a978b09`); both surfaced mostly `SOON` placeholders (MSL per-domain content is lopsided; audience self-selects by frame, not topic), so dropped per Sidharth. Reverted to clean four-frame nav; SQL link-out → `product-analytics-lab.vercel.app/#/sql-lab`. Committed + pushed **`d23e97a`**. Detail: `LINEAGE.md` v4.124–v4.126.
- **BreakLabs BrandMark rollout, D-19 (23 Jun 2026)** — `src/components/BrandMark.jsx` (full/wordmark/monogram/stacked), wired slots 1–7 (sidebar stacked lockup, hero, auth/gate, footer, loader), new favicon + OG (1200×630), old assets archived to `_legacy/`. Committed + pushed **`73be7a2`**.
- **Four-frame nav reframe + best-of-breed adoption (23 Jun 2026)** — `NAV_SECTIONS` → KNOW/DO/BUILD/JUDGE + PREP·ASSESS, PAL-visual accordion (retokenized) + measured-height animation + frame icons + `aria-current`, 5-slot BottomNav, DO link-outs to PL/PAL, D-16 components (PAL `Icon`, merged `HowToStrip`, `FidelityBadge` aria), D-18 archive. Committed + pushed **`e1b7fd0`**. Spec: `docs/NAV-REFRAME-SPEC.md`. Pre-reframe tag: `pre-four-frame-reframe`.
- **Four-Frame (Competence Model) audit + Nav Reframe Spec (22–23 Jun 2026)** — `docs/FOUR-FRAME-AUDIT.md`, `docs/NAV-REFRAME-SPEC.md`. Committed `b0f26bf` / spec docs.
- **5D content audit + framework + batch_03 LinkedIn drafts (22 Jun 2026)** — `docs/CONTENT-AUDIT-5D.md`, `docs/CONTENT-FRAMEWORK.md`, `docs/linkedin/batch_03_msl.md` + 3 unscheduled MSL tracker rows. Committed `a828dad`. _(3 gap-filler post drafts remain unrendered — render on a future go-ahead.)_

_HQ-level artifacts from this arc (not in this repo): `HQ/DESIGN-STANDARD.md` ("THE SIDEBAR STANDARD" + MSL UI inventory) and the BY-DOMAIN-deferred note._
