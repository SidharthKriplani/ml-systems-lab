# PENDING_APPROVALS

_Controller-facing approval queue. Each entry is a completed build awaiting Sidharth's review + push (or a render go-ahead). Nothing here has been auto-pushed. Read the linked files, approve, then run the proposed commands. Append new entries on top; move to the History section once actioned._

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
