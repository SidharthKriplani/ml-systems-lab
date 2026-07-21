# STATUS.md — Cold-start view

Read this at session open alongside NEXT.md + CLAUDE.md. One screen of truth.

---

## TRACKER NOTE PERSISTENCE HARDENED (18 Jul 2026)

My Tracks notes are now stateful across close/refresh and across tabs. Three fixes, esbuild-verified, **LOCAL/uncommitted** (push on Mac, approve-first):
- **Close-flush** — `NoteEditor` flushes the 500ms autosave buffer on `visibilitychange`(hidden)+`pagehide` (unmount cleanup never ran on real page close). Type → Cmd-W → saved.
- **Cross-tab reconcile** — `MyTracksTab` now listens to `window 'storage'` (key `msl-tracks-v1`), so a 2nd tab no longer holds stale state and clobbers the 1st tab's writes. `msl_tracks` CustomEvent was same-tab only.
- **Editor keyed** — added `key={liveNote.id}` on `<NoteEditor>` (was missing in MSL only; GSL/PAL/PL already had it).

Files: `src/components/tracks/NoteEditor.jsx`, `src/tabs/MyTracksTab.jsx`. Additive only — existing saved notes untouched. **Residual:** same note in two editors at once = note-level last-writer-wins (no live block-merge, deliberate). **Still open:** PAL tracks never sync to Supabase (`pal-tracks-v1` not in `syncProgress.PROGRESS_KEYS`); PL tracks local-only. GSL got the same close-flush + cross-tab fix this pass.

---

## FINAL CLOSE (17 Jul 2026, late night)

**The staleness villain of the whole session was SERVICE WORKERS** — hard refresh bypasses
the HTTP cache, not a controlling SW's Cache Storage. MSL sw.js is now v3 (never intercepts
navigations, MIME-guarded asset cache, activate-time SELF-HEAL: purge → claim → re-navigate
every open tab). Every future deploy reaches users automatically.

Shipped after the earlier close, all esbuild-verified, committed + pushed as handed:
SlashMenu v3 (opaque portal, scroll-follow, Sub-bullet entry, ⇥⇤ beside list buttons) ·
one-press arrow navigation (visual-line aware; ←/→ cross blocks) · mobile pass (gutter
hidden ≤700, swipe toolbar, compact header, Export hidden) · mobile outline ☰ + slide-in
drawer (repositioned bottom:136 z:450 — first version hid UNDER the Rate chip z:400) ·
tracks sync CONFIRMED working cross-device (TEXT-column stringify fix; phone receipt).

**Open on Sidharth:** Vercel status filter 6/7 → check GSL red builds (MSL is fine) ·
JSS cherry-pick chain · delete PAL-broken · move BreakLabs out of iCloud.

---

## Where we are (16 Jul 2026 — session close)

**The notes/tracks UX wave (uncommitted → commit command handed to Sidharth, approve-first):**
- **NoteEditor (family file, see BreakLabs/CLAUDE.md rule):** whisper placeholder (0.18 opacity, focused/lone-only) · docs-style block-range selection (Shift+↑/↓, Cmd+A escalates, Cmd+C/X as markdown, Backspace deletes with focus-after) · range-aware toolbar formatting · **full undo/redo** (commit-level snapshots, 800ms typing coalesce, structural boundaries, Cmd+Z / Cmd+Shift+Z work inside textareas) · paste always splits multi-line (settled, do-not-relitigate) · **sub-bullets** (indent 0–2, Tab/Shift+Tab + ⇤⇥ toolbar buttons, • ◦ ▪ markers, 1./a./i. per-level numbering, bullets no longer reset numbered runs, md round-trip preserves indent) · **per-block edit timestamps** (editedAt stamped on substance change, hover shows "Jul 16, 11:49 PM") · header "Created … · Edited …".
- **In-place highlights:** `utils/localHighlights.js` + reworked `HighlightPopover.jsx` — swatch click = instant marker-pen highlight (text+nth-occurrence anchor, localStorage `msl_page_highlights_v1`, click mark → Remove); Save = separate save-to-track (gold default). Both ignore selections inside TEXTAREA/INPUT.
- **Tracks workspace:** dead-space ROOT CAUSE was `index.css` `.main-content { max-width: 860px }` clamping the inline-styled tracks branch → fixed with inline `maxWidth: 'none'`. Footer hidden on my_tracks; phantom scrollbar gone.
- **Tracks sync:** pull+merge now on INITIAL_SESSION too (phone fix); `msl-review-v1` + `msl_done_*` added to progress sync; **SyncStatusRow** in My Tracks ("✓ synced HH:MM" / "⚠ sync failed — msg" / "local only") + manual Sync now — sync failures no longer die silently.
- **Topbar duplicate "Ask / Search" removed** (sidebar entry + ⌘K remain).

**RESOLVED same night (17 Jul):** tracks sync CONFIRMED working cross-device (phone shows the MacBook's note, edited on the phone) — root cause was `user_progress.value` being TEXT while the code pushed a raw object (stringify/parse fix in tracksSync.js). Editor wave 2 also shipped: SlashMenu v3 (opaque portal, scroll-follow, sub-bullet entry), one-press arrow navigation, mobile pass (gutter hidden ≤700px, swipe toolbar, compact header).

**Still verify on deploy:** dead space gone at full width · Daily Rep/Review visible · highlights paint/remove/persist · GSL-style slash ghost gone after Vercel rebuilds each lab (code is pushed; ghosts in screenshots = stale bundles).

---

## Where we are (15 Jul 2026)

**Vercel:** live at `ml-systems-lab.vercel.app` (not re-confirmed live by direct fetch this refresh — see Active blockers)  
**Last meaningful push:** commit `ba62731` — 2 new content-verification scripts (`scripts/check-duplicate-keys.mjs`, `scripts/extract-numeric-claims.mjs`), 3 `contentStatus.js` "clean" entries corrected after real bugs were found in them, 74 stale `verifiedFileHash` entries refreshed.  
**Content freeze:** still not formally revised by the user — see 12 Jul entry below, still applies as historical strategy context.  
**Uncommitted local work:** none — `git status` clean as of HEAD `ba62731` (one pre-existing untracked `_to_delete/` folder, unrelated, not from this work).

---

## What just shipped (sessions through 15 Jul 2026)

**2026-07-15 — Two new interactives + a Phase 1 content-quality audit that found the "clean" tag itself was unreliable.** Shipped `RingWarpViz` (real trained 2→3→2→1 tanh network, 67 weight snapshots, replaces the broken `DonutCupViz` slot on the `neural_nets` module — `DonutCupViz.jsx` itself is now an orphaned file, fate undecided) and `TransformerBlockViz` (live-computed single Transformer block forward pass, 2-head attention, encoder/decoder toggle, for the `transformers` module). Then ran a blind adversarial re-audit on 12 modules already tagged `'clean'` in `contentStatus.js` (some with multiple prior audit rounds) as a spot-check on the tag's reliability — found genuine factual bugs in 3 of 12 (`linear_regression`: a variance-mislabeling error; `hypothesis_testing`: a fabricated p-value plus an impossible lift-magnitude claim in 3 locations; `mle_map`: an unlabeled figure that could be misread against the wrong worked example), all fixed. Root cause, confirmed from `contentStatus.js`'s own audit trail: prior "clean" verdicts claimed to have "recomputed every arithmetic/numeric claim" but their own itemized checklists skipped the exact broken sentence. Separately found and fixed **36 duplicate `interactiveId` keys** across 7 data files (dead code, invisible to any content-only audit) via a new exhaustive scanner. Built two new zero-dependency scripts to close both gaps going forward (`check-duplicate-keys.mjs`, `extract-numeric-claims.mjs`), wired as Recordkeeping rule 6 in the shared root `CLAUDE.md`. Full detail: `docs/BACKLOG.md`'s 2026-07-15 entries (four of them, ~12:50–14:41 IST).

**`contentStatus.js` current tally: 199 'clean' / 206 tracked (S: 36/40, A: 77/80).** This is a large jump from the 12 Jul snapshot below (13/115) — that number was stale; multiple Phase A batches landed between 12–15 Jul that this file was never updated to reflect. Don't trust either number without re-running `node scripts/validate-content-status.mjs` — it's the actual source of truth as of whenever it's run, this file is a snapshot.

**Still open from the 15 Jul audit:** 4 modules with voice-craft-only violations (`gradient_boosting`, `rct_design`, `training_serving_skew`, `data_splits_and_leakage`) found but not yet fixed. Whether to expand the 12-module sample to the remaining ~80 clean-tagged modules is in progress. `AttentionViz` "renders but unresponsive" bug reported by the user, still unresolved — blocked on a screenshot/console log, static code review found nothing. Nothing shipped this session has been confirmed live in a running dev server or on Vercel.

## 12 Jul 2026 entry (kept for history, now superseded by the above)

**3B1B Phase A content pipeline — CUT SHORT mid-run at user's direction, not resumed.** `src/data/contentStatus.js` was **13 'clean' / 115 tracked** (S: 4/38, A: 9/77) at this point — since superseded, see current tally above. 100 modules `in_progress`: 75 fixed-but-unverified, 23 fixed-verified-still-failing, 1 disputed (`thompson_sampling`), 1 audited-clean-unconfirmed (`learning_rate_schedules`). Full categorized breakdown: `docs/BACKLOG.md`'s 2026-07-12 08:59 IST entry.

**Interview QnA mode.** Third view tab (Full / Quick recap / Interview QnA) across all 19 foundation family tabs, `src/components/foundations/QnAPanel.jsx` + `src/data/qnaBank.js`. **195/200 modules now have a draft question set** (6408 questions) — 1 module (`logistic_regression`) is fully `answered` (31 questions, audited). **5 modules blocked** by a genuine id-collision bug (`calibration`, `class_imbalance`, `feature_selection`, `bayesian_inference`, `cold_start` — same id, different content, in 2-3 different source files) — not resolved. Per explicit user direction (2026-07-12), `draft`-status questions now RENDER in the UI (distinct DRAFT banner) instead of a coming-soon stub — only real-answer eligibility (still gated on narrative `clean` status) is unchanged. Rule detail: root `QNA-INTERVIEW-STANDARD.md`. **Owed, not done:** the standard's own light question-audit pass has never been run on these 6408 draft questions.

---

## The product in one line

MSL is a judgment + depth SPA for senior MLE interview prep: 130+ Gradient posts, a 57-post MLE Path, 6 practice tabs (IncidentRoom · MLCoding · SpotTheFlaw · FeatureEng · ModelEval · ClassicalML), CheatsheetTab, and Study Room (code live, Supabase activation pending).

---

## Active blockers

1. **Content freeze** — lift condition: 100 email subs OR 100 weekly returning visitors (PostHog)
2. **GSC verification** — `REPLACE_WITH_YOUR_GSC_CODE` in `index.html` still a placeholder
3. **PostHog key** — `VITE_POSTHOG_KEY` not set in Vercel → analytics blind
4. **Study Room activation** — Supabase schema + `import_anki.py` run needed (see NEXT.md)
5. **Git PAT revoked** — regenerate before next push (see NEXT.md notes)

---

## Scale snapshot

- 130+ Gradient posts (11 series); MLE Path: 57-post ladder, 11 tiers, 54 Simplify versions, 121-term glossary
- 150 Quiz Me MCQs (posts 1–50)
- 6 active practice tabs; CheatsheetTab (50 flashcards + 24 trade-off cards + 8-domain audit + 7-day plan + 7 company profiles)
- Icon system: 84-icon HQ canonical (`src/components/Icon.jsx`); 16+ consumers
- Study Room: code shipped (`src/study/StudyRoom.jsx`), Supabase activation pending

---

## Next session

Read NEXT.md. Short answer: distribution-only — GSC verification → email capture component → LinkedIn cadence.

---

## 2026-07-05 — MEGA-SESSION (full detail in root ../../CLAUDE.md)
- 3 modules finished (recsys_dl_architectures, recsys_representation_learning, online_experimentation_ml) + 3 interactives (dl_recsys_arch_viz, negative_sampling_viz, experiment_power_viz) registered in InteractivePanel + 14 TRAINER_QUESTIONS (ids 121-134).
- Difficulty ordering: NEW utils/foundations/sortByDifficulty.js wraps all 19 family tabs + coding drills. Mobile: MyTracksTab + Cheatsheet grids (index.css). Wave 3: Profile 5-card + company logos (28) + Progress reorder.
- Push via `git add src/`. **NEXT = SEO → ../../HANDOFF-SEO.md** (MSL has generate-rss but NO prerender yet — port GSL's scripts/prerender-gt.js pattern).

---

## 2026-07-17 11:10 IST — spine reconciliation (post session-close-v3)

Session-close-v3 (spine commit 99a3e42) is stale — a large amount shipped after it. Current state, verified against git log:
- **QnA answer rollout: Tier A COMPLETE — 80/80 modules** (final batch 44, bandits, commit 47fe688). Tier B underway:
  batches 45-48 done — RL part1/2 (23b1a37 / 8d45597), GraphML part1/2 (c3dccdd / 749862b), pause-logged (f358dfc).
  **NEXT QnA batch = 49 (Time Series part 1, 5 modules, 165q)** — see docs/BACKLOG.md tail + root QNA-ANSWER-ROLLOUT-PLAN.md.
- **Design Studio skeletons added** (commit c284e99): silentDataBugs-chains.js (F2/F3 flaw dial) + mlSystemDesignBriefs.js
  (NEW open-ended design/notebook brief surface). Skeletons only, unwired. See docs/BACKLOG.md same-date entry + root DESIGN-STUDIO-SPEC.md.
- Also shipped 17 Jul (per LINEAGE): notes family waves, page highlights, SlashMenu v3, mobile pass, SW v3 self-heal,
  tracks-sync TEXT-column fix (confirmed cross-device).
(The top-of-file snapshot block predates all the above; this dated entry is the current-state reconciliation.)

## 2026-07-17 12:29 IST (Friday) — Design Studio SHIPPED (live, read-only)
Deployed under the JUDGE frame (HEAD 7c133c8). `src/tabs/DesignStudioTab.jsx` renders `DESIGN_STUDIO_MSL` (11 design/notebook briefs: recsys/search/pricing/mlops/causal/anomaly design S2-S3 + churn/fraud/forecast/uplift notebook-builds) **plus** `DESIGN_STUDIO_FLAWS` (7 flaw-diagnosis briefs, F2/F3). Mechanic = **produce artifact/diagnosis -> reveal reference/flaw-graph -> self-critique** against an anchored rubric. NO LLM (MSL simulates the real no-LLM condition). Read-only viewer for now; briefs are skeletons (reference/rubric prose deferred via `_flesh`). Old MCQ/tick files (`silentDataBugs-chains.js`, `mlSystemDesignBriefs.js`) superseded -> `_to_delete/`. Commit arc: c284e99 -> 5ab1aa1 -> 44bc582 -> a429627 -> 7c133c8. Wired via `ALL_TABS` lookup + a new "DESIGN STUDIO" group in the JUDGE frame (mirrors incidentroom). NEXT: (1) flesh proof cell `mlsd-recsys-feed` + rubric-critic at N=1; (2) interactive workspace (notebook = bring-your-own-env + self-check harness); (3) F3 stateful reveal via LiveIncident. NOTE: uncommitted `public/modules/*.html` prerender diff in tree is pre-existing SEO prerender, not Design Studio.

## 2026-07-22 03:49 IST (Wednesday) — Doc reconciliation: Design Studio + content-freeze status (T1, EXECUTION-RUNBOOK)

Two corrections to entries above:

1. **Design Studio moved past the 12:29 IST SHIPPED entry.** Two more commits landed since (this account, `Avinash <claudesubscription12@gmail.com>` — same Cowork account, different/parallel session, not this execution thread): `c15adcb` ("complete root catalog — 12 roots, 36 variations": Forecasting, Churn, Pricing, GBDT-selection, Imbalance, Moderation) and `d42ecd9` ("Design Studio renderer — readable names, reveal worked reference, grade-pack workspace" — this is no longer a plain read-only viewer; it now has an interactive grade-pack workspace, contradicting the "Read-only viewer for now" line in the 12:29 IST entry above). **Enumerated this turn**: `src/data/designStudioBriefs.js` has **59 total briefs** (`grep -o 'id: "[a-z0-9_-]*"' ... | sort -u | wc -l`), of which **12 have authored `worked:` reference prose** (the 12 roots — matches brainstorm §8b's "12 roots / 36 variations / 11 skeleton" 1:1, unchanged by the new commits, which were renderer/workspace not brief-content). `src/data/designStudioFlaws.js` — **still 7 entries, all `code: ""` still empty** (`grep -c 'code: ""'` = 7 of 7) — the flaw wing brainstorm §8b called "dead" is confirmed STILL dead as of this check, not fixed by the recent commits. `node --check` clean on both files. Git: local HEAD `d42ecd9` is 0 ahead / 0 behind `origin/main`.

2. **Content-freeze contradiction, surfaced not resolved.** The freeze note earlier in this file ("still not formally revised by the user... still applies as historical strategy context") sits directly above entries describing new post-freeze content (QnA Tier B batches, Design Studio root catalog, this session's renderer work) shipping anyway. This is the exact tension brainstorm §8's preamble names ("DEC-2026-06-21-A content freeze is formally in force while post-freeze content shipped"). Not resolving this here — lifting or reaffirming the freeze is Sidharth's call, not a doc-reconciliation decision. Flagging it so the next session doesn't read the freeze note as settled.
