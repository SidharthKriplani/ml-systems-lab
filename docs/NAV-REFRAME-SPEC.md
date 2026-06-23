# NAV REFRAME SPEC — MSL under the four frames

_Build session, 2026-06-22. Implements `docs/FOUR-FRAME-AUDIT.md` §5: reorganize existing nav so every surface maps to its primary frame. **Reorg only — no new content, no new tabs, no scenario/data/post edits** (content freeze, `NEXT.md`)._

## ⛔ Why this is a SPEC, not a committed nav edit

Stopped at the spec on purpose, per the session's own off-ramp ("if implementing risks touching content under the freeze, stop at the concrete proposed nav spec for approval"). Three reasons:

1. **Can't build-verify here.** The reframe is a routing change in `App.jsx`; the sandbox can't `npm run build` (Rollup ARM64, per `BreakLabs/CLAUDE.md`), and `git push` auto-deploys to Vercel. Shipping unverified nav routing risks a broken live deploy.
2. **Not a contained edit.** It spans **six interdependent structures** + their consumers (see §4). This is a real IA change, not a one-array swap.
3. **Sequencing.** `HQ/COMPETENCE-MODEL.md` sequences the lab overhaul *after the distribution keystone + SQL/PSL coverage*. Doing it now jumps that order — a controller call worth making explicitly.

**On approval, implementation is mechanical** — every edit is spelled out below. Then Sidharth builds on macOS (the verification gate) and pushes (approve-first). No content is touched at any step.

---

## 1. Target IA — the four frames as the spine

```
MSL
├─ ① KNOW   (Recall + Depth)      the floor
├─ ② DO     (Fluency)             the THIN rung — marked, not filled
├─ ③ BUILD  (Ownership · scaffold)
├─ ④ JUDGE  (Judgment · 5D lives here)   the apex
│
├─ ⊕ SAY    (Communication)       a ribbon over all four — NOT a frame
└─ ⊗ ASSESS / TODAY               outside the ladder
```

The four frames replace today's domain-shaped sections (FEATURES / EVALUATION / SYSTEMS / TRAINING / DATA / LABS / LEARN / INTERVIEW). Domains (ML / DL / Data Science / Causal-TS / MLOps) become a **secondary "BY DOMAIN" nav axis (D-20)** — a lens that cuts across all four frames (GSL's built pattern: a second sidebar group). Picking a domain curates the KNOW→DO→BUILD→JUDGE ladder down to that topic (guided curation — e.g. a DS-only user sees only DS content across every frame). **This supersedes the earlier "optional filter inside JUDGE" framing** — domain is now its own cross-frame axis, not a JUDGE-only filter.

---

## 2. Complete tab → frame placement (every existing tab id)

Primary frame = its nav home. Secondary = cross-link chip only. **Nothing is created or deleted — only reparented.**

| Tab id | Label | New primary frame | Secondary | Was (section) |
|---|---|---|---|---|
| `gradient` | Gradient (MLE Path, Foundations Path, Ground-Up, Simplify, Glossary) | **KNOW** | Judgment | learn |
| `cheatsheet` | Cheatsheet | **KNOW** | — | learn |
| `interview` | Q&A Bank (128+) | **KNOW** | Judgment | interview |
| `trainer` | Trainer (378 MCQ) | **KNOW** | — | labs |
| `models` | Math Foundations (Pyodide) | **KNOW** | Fluency | training |
| `landscape` | Landscape | **KNOW** | — | today/learn |
| `resources` | Resources | **KNOW** | — | today |
| `mlcoding` | ML Coding (≈13–15 Pyodide problems) | **DO** | — | labs |
| `spark` | Spark Lab (PySpark) | **DO** | Judgment | data |
| `dbt` | dbt (SQL transforms) | **DO** | Judgment | data |
| _(link-out)_ | **Python fluency → PL** ↗ | **DO** | — | delegated to PL (`programming-lab`, live), NOT built in MSL (D-16) |
| _(link-out)_ | **SQL fluency → PAL** ↗ | **DO** | — | delegated to PAL, NOT built in MSL (D-16) |
| `projectlab` | Project Lab · Telco | **BUILD** | Fluency, Judgment | labs/mle |
| `loan_default` | Project Lab · Loans | **BUILD** | Judgment | labs/mle |
| `fraud_detection` | Project Lab · Fraud | **BUILD** | Judgment | labs/mle |
| `defense` | Defense Plan | **BUILD** | Judgment, Comms | interview |
| `features` | Feature Engineering | **JUDGE** | Recall+Depth | features |
| `eval` | Model Evaluation | **JUDGE** | Recall+Depth | evaluation |
| `classical` | Classical ML | **JUDGE** | Recall+Depth | evaluation |
| `causal` | Causal Inference | **JUDGE** | Recall+Depth | evaluation |
| `ts` | Time Series | **JUDGE** | Recall+Depth | evaluation |
| `design` | System Design | **JUDGE** | — | systems |
| `dl_serving` | DL Serving | **JUDGE** | — | systems |
| `mlops_deploy` | Deployment | **JUDGE** | — | systems |
| `mlops_pipes` | CI/CD & Infra | **JUDGE** | — | systems |
| `monitor` | Monitoring | **JUDGE** | — | systems |
| `dl` | Deep Learning (Training Lab) | **JUDGE** | Recall+Depth | training |
| `dl_finetune` | Fine-tuning | **JUDGE** | — | training |
| `airflow` | Airflow | **JUDGE** | — | data |
| `modeling` | Data Modeling | **JUDGE** | Recall+Depth | data |
| `spottheflaw` | Spot the Flaw (12) | **JUDGE** | — | interview |
| `incidentroom` | Incident Room (3) | **JUDGE** | Fluency | labs |
| `codebugs` | Bug Hunt (26) | **JUDGE** | Fluency | labs |
| `casestudies` | Case Studies | **JUDGE** | Recall+Depth | labs |
| `stafflayer` | Staff Layer (30) | **JUDGE** (apex) | Comms | labs |
| `verbal` | Verbal Practice | **SAY** (ribbon) | — | interview |
| `combinator` | Timed Exam | **ASSESS** | all | interview |
| `mock_interview` | Mock Interview (JD→prompt) | **ASSESS** | Judgment | interview |
| `home` | Home | TODAY (meta) | — | today |
| `profile` | Profile | TODAY (meta) | — | today |
| `plans` | Plans | TODAY (meta) | — | today |
| `ask` | Ask | TODAY (meta) | — | ask |

---

## 3. The Fluency (DO) rung — MSL's own surfaces + link-outs (corrected per D-16)

**Correction (2026-06-23, D-16 delegation rule):** the general Python and SQL banks are **not MSL's to build** — Python lives in **PL** (`programming-lab`, live), SQL in **PAL**. MSL's DO rung ships its **own** ML-specific surfaces (`mlcoding`, `spark`, `dbt`) and **links out** to the sibling labs for general fluency. No "to-build" stubs; no duplicated banks.

Concrete UI: render the DO section with its 3 real MSL items, then two **link-out** cards to the sibling labs (external nav, clearly marked):

```
DO · Fluency
  ◳ ML Coding      (live — MSL's own, PythonCell)
  ◳ Spark Lab      (live)
  ◳ dbt / SQL transforms (live)
  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
  ↗ Python fluency  → PL   (the canonical Python/DSA bank — sibling lab)
  ↗ SQL fluency     → PAL  (the canonical SQL bank — sibling lab)
```

The two `↗` rows are link-outs to the sibling labs (open PL / PAL). _Future: when the shared content contract ships (problems-as-data + global IDs + shared progress), these banks render in-place inside MSL instead of linking out — that's a later build, not this pass._

---

## 4. Exact `App.jsx` edits (the six structures + consumers)

All line numbers vs. current `src/App.jsx`. **No other files change.**

1. **`NAV_SECTIONS`** (≈258–343) — replace the 8 domain sections with 4 frame sections `know / do / build / judge` (+ optional `say`), using the §2 mapping. Add a `disabled: true` field support for the two DO to-build rows. Keep every `id` string identical to the live tab ids (so routing is untouched).
2. **`BOTTOM_NAV_ITEMS`** (771–777) — replace `[home, practice, labs, interview, learn]` with the ladder:
   ```js
   const BOTTOM_NAV_ITEMS = [
     { id: 'home',  icon: '◎', label: 'Home',  defaultTab: 'home',     sections: [] },
     { id: 'know',  icon: '▤', label: 'Know',  defaultTab: 'gradient', sections: ['know'] },
     { id: 'do',    icon: '◳', label: 'Do',    defaultTab: 'mlcoding', sections: ['do'] },
     { id: 'build', icon: '⚒', label: 'Build', defaultTab: 'projectlab', sections: ['build'] },
     { id: 'judge', icon: '◈', label: 'Judge', defaultTab: 'spottheflaw', sections: ['judge'] },
   ]
   ```
   ASSESS (`combinator`, `mock_interview`) + SAY (`verbal`) surface as a "Prep" cluster inside the Home/Today zone (cross-cutting), not as a bottom-nav frame — keeps the ladder clean on mobile's 5 slots.
3. **`TAB_TO_ZONE`** (157–168) + **`ZONE_DEFAULTS`** (169–171) — collapse zone routing onto the new sections, or retire in favor of `getTabSection` if zones become redundant. Map `verbal/combinator/mock_interview → assess`, the rest per §2.
4. **`PRACTICE_DOMAINS`** (178–233) — **repurpose as the secondary "BY DOMAIN" axis (D-20), do NOT delete.** Tabs still reparent to their primary frame (scenarios → JUDGE, notebooks → BUILD), but the domain labels now power a **second sidebar group** (like GSL's "BY DOMAIN": Retrieval/Eval/…) that filters/curates all four frames to one domain. MSL domains = **ML / DL / Data Science / Causal-TS / MLOps**. Each tab must carry a `domain` tag (alongside its frame) so the lens can scope it. This is guided curation, not a JUDGE-only filter.
5. **`INTERVIEW_TOOLS`** (236–253) — split by frame: `interview/takehome → KNOW/JUDGE`, `spottheflaw/incidentroom → JUDGE`, `mlcoding → DO`, `defense → BUILD`, `verbal → SAY`, `combinator → ASSESS`. The SVG icons carry over.
6. **Consumers to re-check after the edits** (must stay green):
   - `getTabSection` (345–351) & `getNavLabel` (353–359) — still resolve every tab id to a section/label (they iterate `NAV_SECTIONS`, so they "just work" once the sections are renamed, **provided every tab id is present in exactly one section**).
   - `getZoneForTab` (172) and the renders at **584–592, 689 (`NAV_SECTIONS.map`), 780–792 (`BottomNav`), 948 (`getNavLabel`)** — verify against the new sections.
   - **`PRACTICE_DOMAINS`/`INTERVIEW_TOOLS` consumers at 1177–1178** — update or remove the props if those constants are retired.
   - **Premium gating list (104–124)** — references tab ids, not sections, so it's unaffected; confirm no section-name string is hardcoded there.

**Invariant to hold:** every routable tab id in the `TABS` registry (59–99) appears in exactly one `NAV_SECTIONS` section. A missing id → `getTabSection` returns `null` → blank bottom-nav highlight. A QA checklist of all 41 ids is in §6.

---

## 5. What does NOT change (freeze guard)

- No tab **component** edited (`src/tabs/*`). No **data** file edited (`src/data/*`, scenario arrays, posts, MCQs). No new tab added to the `TABS` registry. No content written.
- The reframe is **labels, grouping, and routing config only.** A user reaches the exact same 41 surfaces; they're organized by frame instead of by domain.
- The two DO "to-build" rows are inert presentational markers, not content.

---

## 6. Build / verify / push (Sidharth runs on macOS — approve-first)

After approval, I make the §4 edits in-sandbox (no build), then hand these over:

```bash
cd ~/Documents/Professional/BreakLabs/labs/ml-systems-lab && \
rm -f .git/index.lock .git/HEAD.lock && \
npm run build            # the verification gate — must pass clean on macOS
npm run dev              # smoke-test: click Home/Know/Do/Build/Judge; open one tab in each
```

QA checklist before commit (manual, on the running dev server):
- [ ] All 5 bottom-nav items render and highlight correctly.
- [ ] Each of the 41 tab ids opens from its new frame (no blank/dead nav state).
- [ ] DO shows ML Coding / Spark / dbt **live** + the 2 greyed "TO BUILD" rows (non-clickable).
- [ ] JUDGE lists all scenario tabs; BUILD lists the 3 notebooks + Defense; KNOW lists Gradient/Cheatsheet/Q&A/Trainer/Math/Landscape/Resources.
- [ ] `getTabSection` returns non-null for every id (no orphan).

Then, only if green:
```bash
git add src/App.jsx docs/NAV-REFRAME-SPEC.md NEXT.md LINEAGE.md PENDING_APPROVALS.md && \
git commit -m "nav(reframe): MSL IA under the four frames (KNOW/DO/BUILD/JUDGE) — reorg only, no content (DEC-15)" && \
git push origin main
```

---

## Open decisions (need your call)
- [ ] **Approve this nav spec** → I make the `App.jsx` edits and hand you the build/push (above).
- [ ] **Bottom-nav shape:** the 5-slot ladder (Home·Know·Do·Build·Judge) with ASSESS+SAY in the Home zone — or do you want a 6th "Prep" slot for Combinator/Mock/Verbal?
- [ ] **Retire `PRACTICE_DOMAINS` entirely**, or keep domain labels as the optional in-JUDGE filter?
- [ ] **Freeze/sequencing override:** confirm we're doing this IA reframe now (ahead of DEC-15's "after distribution keystone" sequencing), since it's reorg-only and unblocks the later fluency build.
```
