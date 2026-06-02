# BRAIN TRANSFER — Complete Session Context & Rules

**This file IS the project state. Chat history is not needed. Read this at the start of every session.**

---

## Session Operating Model

**One session = one NEXT.md batch. Never carry a chat across multiple batches.**

1. Open new chat (fresh context)
2. Read the 7 spine files in order (see checklist below)
3. Execute the 5 queued items in NEXT.md
4. Update all 7 MD files (see statefulness enforcement rules below)
5. Run git commands to commit + push
6. Close the chat

Token consumption grows exponentially with conversation length. The MD files preserve all state. A new instance reading these 7 files will know exactly where to pick up.

---

## The 7 Spine Files (Read in This Order)

### 1. CLAUDE.md — Session Briefing
- Stack, rules, file structure, session workflow
- **When starting:** Read top to bottom. Confirm the stack description matches current reality.
- **When updating:** Only update after major architectural changes or when LINEAGE.md documents a significant shift.

### 2. NEXT.md — Next Session Queue
- Max 5 items, specific and ordered
- **When starting:** Read the current 5 items. These are what you execute.
- **When updating:** At end of session, wipe the entire "Next session" section and rewrite with NEW 5 items for the NEXT session. Move completed items to "Done this session (vX.XX)" with timestamps.

### 3. DECISIONS.md — Architectural Rulebook
- Present-tense rules. Prescriptive. Governs code decisions.
- **When starting:** Skim for any "planned" features that might be complete by now.
- **When updating:** Change "planned" to "complete vX.XX" when a feature ships. Add any new rules that emerge.

### 4. LINEAGE.md — Build History
- Narrative, past-tense. Why does this exist? When was it built?
- **When starting:** Read the last 2-3 entries to understand recent changes.
- **When updating:** Add a v-entry AFTER every major feature batch. Include: version number, date, what was built, which files were modified, why it matters.

### 5. IDEAS.md — Build Backlog
- Tier 1/2/3 + In Progress + Retired + Done this session
- **When starting:** Skim Tier 1 to understand what's coming next.
- **When updating:** Move completed items from "In Progress" → "Done this session (vX.XX)" with timestamp. Promote audit findings to Tier 1 if buildable.

### 6. AUDITS.md — Health Log
- Findings from audit runs. Resolved/open status. Dates.
- **When starting:** Check the last entry number and date. See which findings are open.
- **When updating:** Add a new audit entry (e.g., #025) after every build sprint. Include: scope, trigger, findings, resolution status.

### 7. METRICS.md — Analytics & Storage Taxonomy
- PostHog events + localStorage key registry. This is the single source of truth.
- **When starting:** Scan to see what's tracked and what keys exist.
- **When updating:** Add a row for EVERY new localStorage key or PostHog event. Prefix all keys with `msl_`.

---

## CRITICAL: Statefulness Enforcement Rules (DO NOT SKIP)

### Rule 1: Read ALL 7 Files Before Editing Any

**This is non-negotiable.** Partial reads cause cross-file contradictions and staleness.

```
Read CLAUDE.md (full)
Read NEXT.md (full)
Read DECISIONS.md (full)
Read LINEAGE.md (full)
Read IDEAS.md (full)
Read AUDITS.md (full)
Read METRICS.md (full)
```

Only then start editing.

### Rule 2: Check Every File for Staleness

Staleness compounds. One uncaught stale entry becomes five by next session.

**Staleness red flags (watch for these):**

1. **Version mismatch** — LINEAGE.md says "v4.46", but DECISIONS.md still says "v2 enhancement (planned)"
2. **Missing documentation** — New tab added, but LINEAGE.md has no entry for it
3. **Incomplete feature status** — NEXT.md says "Done", but IDEAS.md still has it in "In Progress"
4. **Orphaned storage keys** — New localStorage key created, but METRICS.md has no row
5. **Audit findings not tracked** — You fixed a bug, but didn't add it to AUDITS.md
6. **Future-tense for completed work** — "v2 enhancement (planned)" when v2 shipped last session

**How to check:**
- For each file, ask: "Is this entry still accurate?" 
- If a version number appears, verify it matches other files
- If an item says "planned", check AUDITS.md to see if it's actually done
- If a feature was added, ensure LINEAGE.md documents it

### Rule 3: Update ALL Files That Need It (No Shortcuts)

Never think "it's probably fine" and skip a file. Stale entries are silent failures.

**Update order (this order matters):**
1. LINEAGE.md (build history is foundational)
2. METRICS.md (storage taxonomy is infrastructure)
3. DECISIONS.md (rules that govern everything)
4. AUDITS.md (findings from this session)
5. IDEAS.md (backlog consequences)
6. NEXT.md (queue for next session)
7. CLAUDE.md (summary, update last if at all)

### Rule 4: Use Correct Tense

- **Past tense for completed work:** "v4.46 — Freemium gate v2 shipped; 46 scenarios tagged (easy/junior=free, mid/senior=gated)"
- **NOT future tense:** "v2 enhancement (planned)" after it's shipped
- **NOT vague:** Change "coming soon" to a specific version number or "deferred to v4.YY"

### Rule 5: Verify No Cross-File Contradictions

Before committing, spot-check:
- Version numbers align across LINEAGE, AUDITS, NEXT
- Item names don't appear twice (e.g., "Behavioral bank" in IDEAS.md, LINEAGE.md, and AUDITS.md should all be the SAME version)
- All new localStorage keys in METRICS.md are prefixed `msl_`
- File paths in documentation are correct (e.g., `ModelsMathTab.jsx`, not `MathFoundationsTab.jsx`)
- DECISIONS.md "planned" items either match AUDITS.md findings or are still truly planned

---

## Workflow: How to Update MD Files (Step by Step)

### Scenario: You Just Completed v4.46 (5 items)

**Step 1: Read all 7 files (no exceptions)**
- Open each file, read it top to bottom
- Note what's stale: "Oh, DECISIONS.md line 182 says 'planned' but we just shipped v2"
- Note what's missing: "LINEAGE.md has no v4.46 entry yet"
- Note what's inconsistent: "IDEAS.md still has 'Behavioral bank' in In Progress, but we shipped it"

**Step 2: Update in the correct order**

**LINEAGE.md:** Add new v-entry (template below)
```markdown
### v4.46 — Freemium gate v2, YouTube IDs, behavioral bank, Tally wiring, emoji→SVG (2026-06-02)

**Freemium monetization upgrade:**
- 46 scenarios tagged with `isFree: true/false` across 4 free modules (easy/junior→true, mid/senior/staff→false)

**YouTube video enrichment:**
- Added YouTube IDs to 5 new Gradient posts + 2 backfill; all verified via oEmbed

**Interview behavioral content:**
- 8 behavioral scenarios in InterviewPrepTab covering production judgment

**Community submission infrastructure:**
- Tally form wiring complete; submit button + admin workflow documented

**Visual polish:**
- 97 emoji→SVG replacements across 8 tabs; new Icons.jsx component
```

**METRICS.md:** Add new rows (template below)
```markdown
| `msl_landscape_region` | `string` | `LandscapeTab` — Region selector | Selected region for filtering: 'Global' (default) or 'India'/'UK'/'US'/'EU'. Persists across sessions. |
| `msl_score:behavioral` | `JSON {completed:true, ts:number}` | `InterviewPrepTab` — Behavioral scenarios | Interview behavioral judgment score. Written when behavioral scenario is completed. |
```

**DECISIONS.md:** Update "planned" entries (template below)
```markdown
**v2 enhancement (✅ completed v4.46):** Granular scenario-level difficulty gating within free Practice modules — easy/junior free, mid/senior/staff gated. 46 scenarios tagged in 4 free modules. AccessGate.jsx ready for scenario-level checks at render time.
```

**AUDITS.md:** Add new audit entry (template below)
```markdown
### #025 — 2026-06-02 · v4.46 Batch Build

**Scope:** All 5 agents executing Freemium gate v2, YouTube IDs, behavioral bank, Tally wiring, emoji→SVG sweep  
**Trigger:** NEXT.md items 1–5  
**Output:** All 5 items complete, 0 blockers, all MD files verified for staleness

| # | Finding | File(s) | Severity | Status |
|---|---------|---------|----------|--------|
| 1 | Freemium gate v2: 46 scenarios tagged with `isFree` across 4 free modules | 4 tab files | — | ✅ Complete |
| 2 | YouTube IDs: 5 new + 2 backfill verified via oEmbed | `GradientTab.jsx` | — | ✅ Complete |
| 3 | Behavioral bank: 8 scenarios in InterviewPrepTab | `InterviewPrepTab.jsx` | — | ✅ Complete |
| 4 | Tally wiring: submit button + admin workflow documented | `App.jsx` | — | ✅ Complete |
| 5 | Emoji→SVG: 97 replacements across 8 tabs + Icons.jsx | 8 files + component | — | ✅ Complete |
| 6 | Brace balance verified at 0 on all modified files | All 16 files | — | ✅ Clean |
| 7 | CSS variables used throughout; no hardcoded colors | All new code | — | ✅ Clean |
| 8 | All 7 spine files read and checked for staleness | All 7 files | — | ✅ Verified |

**All MD spine files verified for staleness; no contradictions found.**
```

**IDEAS.md:** Move completed items (template below)
```markdown
### Done this session (v4.46)

- [x] ~~**Freemium gate v2 — per-scenario `isFree` flags**~~ — done (v4.46, 2026-06-02)
- [x] ~~**YouTube IDs on Gradient posts**~~ — done (v4.46, 2026-06-02)
- [x] ~~**Behavioral question bank for Interview zone**~~ — done (v4.46, 2026-06-02)
- [x] ~~**Interview Experiences — Tally form wiring**~~ — done (v4.46, 2026-06-02)
- [x] ~~**Emoji → SVG sweep**~~ — done (v4.46, 2026-06-02)
```

**NEXT.md:** Wipe "Next session" and rewrite with NEW 5 items (template below)
```markdown
## Done this session (v4.46)

- ~~Freemium gate v2 — per-scenario `isFree` flags (46 scenarios tagged)~~
- ~~YouTube IDs for Gradient posts (5 new + 2 backfill, all verified via oEmbed)~~
- ~~Behavioral question bank (8 scenarios covering production judgment)~~
- ~~Tally form wiring (submit button, form spec, admin workflow documented)~~
- ~~Emoji → SVG sweep (97 replacements across 8 tabs, new Icons.jsx component)~~
- ~~All 7 spine files read and verified for staleness; LINEAGE/METRICS/DECISIONS/AUDITS/IDEAS/NEXT/CLAUDE updated~~

---

## Next session (v4.47+)

### 1. Polish freemium gate integration (1.5 hours)
Wire scenario-level gating into tab renders. Check scenario `isFree` at render time.

### 2. Difficulty filter UI — practice zone sidebar (2 hours)
Add difficulty filter pills (easy/junior/mid/senior/staff) to PracticeDomainCard sidebar.

### 3. Interview Experiences — real Tally submissions (1.5 hours)
Monitor Tally form. When N≥15 real submissions: download JSON, merge into INTERVIEW_EXPERIENCES, deploy.

### 4. Mobile responsiveness audit + fixes (1.5 hours)
Test all v4.46 changes on mobile (375px, 768px). Fix layout breaks.

### 5. Gradient posts — add 3 more posts (2 hours)
Add "Feature Importance Drift", "Training-Serving Skew", "Calibration Loss in Production" posts.
```

**CLAUDE.md:** Minor updates only (usually just version/date info)
- If any architectural change, update relevant sections
- Otherwise, just timestamp the last session

**Step 3: Verify consistency**

Before committing, grep/check:
```
grep -r "v4.46" src/tabs/ LINEAGE.md AUDITS.md NEXT.md → all match
grep -rn "msl_" METRICS.md → all keys prefixed
grep "planned" DECISIONS.md → only truly-planned items remain
```

**Step 4: Commit and push**

```bash
cd /Users/ASUS/Documents/GitHub/ml-systems-lab

# Clear git locks (always do this first)
rm -f .git/index.lock .git/HEAD.lock

# Stage all changes
git add -A

# Commit with clear message: version + 5 items shipped
git commit -m "v4.46: Freemium gate v2, YouTube IDs, behavioral bank, Tally wiring, emoji→SVG"

# Push to main (auto-deploys to Vercel)
git push
```

---

## Current Project State (as of 2026-06-02)

**Last completed batch:** v4.46
- Freemium gate v2 (46 scenarios tagged `isFree`)
- YouTube IDs (5 new + 2 backfill, verified via oEmbed)
- Behavioral bank (8 scenarios in InterviewPrepTab)
- Tally wiring (submit button + admin workflow)
- Emoji→SVG sweep (97 replacements, Icons.jsx component)

**Files modified:** 16 tab files, 1 new component, 1 new data file  
**Brace balance:** All verified at 0  
**All 7 spine files:** Updated and consistent, no stale entries

**Next batch (v4.47+):** 5 items queued in NEXT.md
1. Polish freemium gate integration
2. Difficulty filter UI
3. Interview Experiences — real Tally submissions
4. Mobile responsiveness audit
5. Gradient posts — 3 new posts

**Open audit findings:** 3 low-severity (carry forward)
- #001: Index keys as React `key` props
- #021.5: `.msl-cloud-map` mobile overflow (needs browser test)
- #023.1: SHAP YouTube backfill (marked in NEXT.md)

---

## Non-Negotiable Rules (Summary)

1. **Read all 7 spine files before editing any of them.**
2. **Check every file for staleness.** Don't assume "it's probably fine".
3. **Update all files that need it.** No shortcuts. Stale entries compound.
4. **Update in order:** LINEAGE → METRICS → DECISIONS → AUDITS → IDEAS → NEXT → CLAUDE
5. **Use correct tense.** Past for done, not future. Change "planned" to "complete vX.XX".
6. **Verify no contradictions.** Version numbers, item names, statuses must align across all 7 files.
7. **Commit with version number + 5 items:** `git commit -m "vX.XX: Item1, Item2, Item3, Item4, Item5"`

---

## What to Do at the Start of the Next Session

Open a new chat and say:

> Read CLAUDE.md, NEXT.md, DECISIONS.md, LINEAGE.md, IDEAS.md, AUDITS.md, and METRICS.md from the workspace folder. Check all 7 for staleness. Confirm the current state and what's next.

The files will tell you everything. No chat history needed. Execute the 5 items in NEXT.md. At the end of the session, update all 7 files using the workflow above. Commit + push. Close the chat.

---

## Glossary

| Term | Meaning |
|------|---------|
| **Spine** | The 7 MD files. These ARE the project state. Breaking the spine = allowing staleness to compound. |
| **Stale** | An MD entry that describes the past but hasn't been updated. Example: "Phase 2–4 planned" when they shipped. |
| **Brain transfer** | This file. It documents everything the next session needs. Chat history is not needed. |
| **Batch** | One NEXT.md queue of 5 items, typically one session. |
| **Spine update** | Reading all 7 files, checking for staleness, updating all that need it. Must be thorough. |
| **Lock files** | `.git/index.lock` and `.git/HEAD.lock` block commits. Always clear with `rm -f` before `git add`. |

---

**This file is the complete context. When you close this chat, all work is captured in the MD files. Next session reads this file + the 7 spine files and picks up exactly where you left off. No chat history needed. The spine holds.**
