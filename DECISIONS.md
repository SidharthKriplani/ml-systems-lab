# DECISIONS.md — Architectural Rulebook

Prescriptive. Present-tense. Read before making any choice that affects the whole system.  
This is the "why this works this way" file — not build history (that's LINEAGE.md).

---

## Stack

**React 18 + Vite, no backend, no database — current architecture, not a permanent constraint.**  
All progress is localStorage-only. Zero friction, no accounts, instant deploy, nothing to break server-side. A backend will be added eventually — scoped tightly to the first feature that genuinely requires it (tracked in IDEAS.md Tier 3). Until then, do not add one speculatively. Every backend-dependent feature idea goes into Ideas; it does not change the current implementation.

**Vercel auto-deploy on push to main.**  
No staging environment. Main is always live. Test locally before pushing.

**No Tailwind utility classes in tab files.**  
Tailwind is in the config for historical reasons. All component styling uses inline styles with CSS variable references. This keeps the design system centralized in `index.css` and makes theming consistent. Exception: layout utility classes defined in `index.css` (`.grid-cards`, `.grid-cards-wide`, `.main-content`, `.bottom-nav-safe`) are used via `className`.

**CSS variables for every color and spacing token.**  
Defined in `:root` in `index.css`. Never hardcode hex values in component files. Adding a new color = add it to `:root` first, then reference it.

**Single amber accent — no decorative domain colors.**  
All decorative UI accents (card borders, section eyebrows, badge backgrounds, progress fills, navigation highlights) use `var(--prime)` (#F0A500) only. Domain-specific color differentiation is explicitly prohibited — it creates visual noise and dilutes the Oracle identity. Established v4.31 after a full 36-file sweep. **Exempt from this rule (semantic, not decorative):** MCQ correct/wrong state (mint=correct, rose=wrong), chart data series (multi-color is required for readability), severity indicators (P0/P1 rose, PSI red/amber), PROS/CONS pairs, fidelity badges, video/read status tags in GradientTab.

**Transition, shadow, and radius tokens — use the system variables.**  
`--t-fast: 0.10s ease`, `--t: 0.16s ease`, `--t-slow: 0.26s ease`. Shadow: `--shadow-sm/md/lg`. Radius: `--r-sm: 5px`, `--r: 9px`, `--r-lg: 14px`. Never write hardcoded `transition: 0.2s` or `border-radius: 8px` in component files — reference the tokens.

**Design token enforcement — pre-commit grep habit.**  
The build succeeds regardless of hardcoded values; enforcement must be manual. Before any commit touching component files, run these checks:

1. **Hardcoded hex colors:** `grep -rn --include="*.jsx" "#[0-9a-fA-F]\{3,6\}" src/tabs/` — catches all 3 and 6-digit hex values. Any hit is a violation.
2. **Hardcoded font strings:** `grep -rn --include="*.jsx" "fontFamily:.*['\"]" src/tabs/` — catches inline font family assignments. Any hit is a violation.

Fix violations by adding the value to `:root` in `index.css` as a named token, then reference it as `var(--token-name)`. This is the enforcement complement to the "never hardcode colors" and "Satoshi + JetBrains Mono only" rules; without it, violations compound silently across sessions.

**Structural token extraction threshold — 5+ repetitions.**  
When the same raw CSS value (padding, gap, background, border-radius) appears 5 or more times across tab files with identical intent, extract it to a `:root` variable. Current extraction candidates identified (v4.47 audit):

1. **`--card-pad-primary`** — `padding: '10px 14px'` (46 occurrences) — card/item inner padding, used across AccordionMCQ option buttons, scenario cards, and hint blocks.
2. **`--card-pad-secondary`** — `padding: '16px'` (63 occurrences) — uniform padding on larger cards, panels, and reveal sections. Most common padding value across tabs.
3. **`--prime-bg-light`** — `background: 'rgba(240,165,0,0.12)'` (39 occurrences) — light amber background for cards, hint blocks, selected states. The most frequent prime-color background opacity.

Audit snapshot: 606 total `rgba(240,165,0,...)` values across 41 files, with the above three tokens accounting for 148 instances (24% of total amber usage). Do not extract speculatively — wait for the repetition threshold to be hit; these three candidates exceed it and should be extracted in the next session.

**Shared utility classes for repeated UI patterns.**  
Defined in `index.css`, never redefined inline in tab files:
- `.section-eyebrow` — 10px monospace uppercase label with `--ink-low` color and 0.09em spacing. Apply to section headings that match this exact pattern. Colour overrides stay inline.
- `.msl-option-btn` — standard MCQ option button with `.correct` / `.wrong` / `.selected` modifier classes. Use for all 4-option practice buttons.
- `.msl-reveal-panel` — animated reveal panel with fadeSlideDown, used for answer explanations.
- `.msl-scenario-card` — standard scenario card with hover border + shadow transition.
- `.msl-hint` — hint/tip callout block.
- `.card-interactive` — hover lift (translateY(-2px)) for interactive card elements.
- `.progress-fill-animated` — cubic-bezier width transition for progress bars.
- `.sidebar-item-active` — left-border accent on active sidebar nav items (PAL pattern).

**No lock icons in sidebar or navigation.**  
Premium items show a subtle inline `pro` text tag (styled faintly) — not SVG padlocks. Lock icons add visual noise and make the product feel restrictive. The freemium gate renders `AccessGate.jsx` at the tab level; the nav itself should feel open.

**Satoshi for UI, JetBrains Mono for code/labels.**  
Do not introduce additional fonts. These two cover every case. Font families are exposed as CSS variables — `--font-sans` (`'Satoshi', 'Inter', system-ui, sans-serif`) loaded from Fontshare CDN, and `--font-mono` (`'JetBrains Mono', 'Fira Code', monospace`) from Google Fonts — defined in `:root` in `index.css`. Always reference these variables; never hardcode font family strings inline. (Changed from Space Grotesk in v4.14.)

**`--white` (#ffffff) is a named CSS variable, not a hardcoded hex.**  
Use `var(--white)` for contrast text on colored badge backgrounds or anywhere pure white is needed. Do not write `#fff` or `#ffffff` in component files.

---

## Architecture

**Responsive dual-nav: bottom nav on mobile, flat sidebar on desktop.**  
Zones: Today / Practice / Read / Interview / Ask. On mobile (≤768px): 5-zone bottom nav. On desktop (≥769px): fixed left sidebar (220px) with flat domain sections — Practice domain groups shown inline (no accordion), active item indicated by `.sidebar-item-active` left-border accent. Same zone/tab routing state for both. Bottom nav is hidden on desktop via CSS; sidebar is hidden on mobile. Do not add a 6th zone without strong justification.

**Zone routing via `TAB_TO_ZONE` + `ZONE_DEFAULTS` in App.jsx.**  
- `TAB_TO_ZONE`: omit a tabId to default it to `practice`. Only add entries for non-practice tabs.
- `ZONE_DEFAULTS`: `null` = show grid, string = land directly on a tab. Practice and Interview zones use `null` (grid entry). Other zones use a direct tabId.
- Do not manage zone state anywhere except App.jsx. No zone state in individual tab files.

**`goTo(tabId)` / `onNavigate` is the only cross-tab navigation mechanism.**  
Every tab receives `onNavigate` as a prop. Call `onNavigate(tabId)` to navigate programmatically. Do not import or call zone state setters from inside tab files.

**Practice zone uses domain cards → module drill-down.**  
`PRACTICE_DOMAINS` array in App.jsx defines the cards. Each domain has an `id`, `label`, `desc`, `icon`, `accent`, and `tabs[]` array listing the tabs in that domain.

**Interview zone uses tool cards → tool drill-down.**  
`INTERVIEW_TOOLS` array in App.jsx defines the 6 tool cards. Same card structure as domains. The Interview zone is a simulation layer — tools work together (JD Prep → Defense Doc → Combinator → Verbal) not just independently.

**`InterviewToolCard` and `PracticeDomainCard` are standalone named components in App.jsx.**  
Do not inline card rendering inside `.map()` if the card needs local state — that would violate React's rules of hooks.

---

## Content

**Scenario-first in every module.**  
Every module opens with a real situation (a broken system, a metric gone wrong, a design choice). No module starts with definitions or theory. Theory comes after the scenario, if at all.

**AccordionMCQ pattern for judgment modules.**  
Closed = title + domain badge. Open = description + code/context + 4 options. After answer: reveal correct/wrong with color border + explanation. This is the standard interaction pattern — use it for all new judgment modules.

**Sequential notebook pattern for execution modules (Project Lab).**  
A second interaction pattern exists for tabs where the user runs code step-by-step through a complete workflow (Project Lab: data → features → model → monitoring → deployment scaffold). Format: numbered cells run in order, each cell's output feeds the next, judgment checkpoints (`msl-option-btn` + `msl-reveal-panel`) woven between execution phases. Do not mix this pattern with AccordionMCQ in the same tab — they serve different learning modes. Pyodide (`PythonCell.jsx`) handles execution for data/model/monitoring cells. Deployment scaffold cells are display-only (mark-as-read pattern — no execution button, no `onResult`, user reads and marks done) — the backend dependency is bypassed by showing annotated reference code rather than running it. Three complete notebooks exist: Telco Churn (v4.33–v4.40), Loan Default (v4.42–v4.44), Fraud Detection Phase 1 (v4.44).

**Fixed notebook ships before open cells — always.**  
For any execution-mode feature (Project Lab, datamart practice, future Pyodide modules), the fixed notebook with pre-written cells is v1. Open cells ("write it yourself" mode) are v2, added as a toggle on the same content after v1 ships. Reason: fixed notebook requires no output validation infrastructure, no test case authoring, no arbitrary-code error handling. Open cells require all three. Building both simultaneously produces one done and one half-built. The pre-written cell in the fixed notebook IS the solution that gets revealed in open cell mode — no duplicate content work.

**Pyodide is the execution layer for all in-browser ML computation.**  
`PythonCell.jsx` is the single abstraction. numpy, pandas, matplotlib, sklearn, scipy all run natively via Pyodide WASM. Data ships as JS arrays, loaded as `pd.DataFrame(DATA)` inside cells. Cold start ~4–6s on first load; acceptable for practice sessions. Do not introduce a second execution runtime (sql.js, etc.) while Pyodide usage is still being established — one runtime, measured first. **Package loading rule:** every package used in any cell must be explicitly loaded in `python.js` `loadPython()` — Pyodide does not auto-install. Current load list: `numpy`, `pandas`, `scikit-learn`, `matplotlib`, `scipy`. Add new packages there before writing cell code that imports them.

**Execution content must test judgment, not syntax.**  
Pyodide cells run code and produce output. The product value is the judgment checkpoint that fires after the output — "given this correlation matrix, which feature do you drop?" not "write the code to compute a correlation matrix." The cell is the vehicle; the checkpoint is the product. Any execution module where the hard part is remembering the API call, not interpreting the result, is in the wrong category.

**Per-option explanations, not just "correct answer" reveals.**  
Every wrong option gets an explanation of why it's wrong. This is the core learning mechanism.

**Gradient posts end with a CTA linking to the practice module.**  
Read → practice in one click. Every new Gradient post must identify its target tab and include the link.

**Do not build a standalone ProjectPro-style notebooks track.**  
ProjectLabTab is the end-to-end notebook. Gradient posts are the narrative layer. These two together cover the same user outcome — runnable pipeline + explanatory content — without a separate content track. The differentiator over ProjectPro is judgment checkpoints woven inside execution, not breadth of projects.

**Optimization objective for all content decisions: learning quality, not engagement.**  
The metric is mental model transfer — can the user recognize and reason about this failure mode in a real codebase or incident? Not time-on-site, not question count, not session length. Concretely: every MCQ explanation must include (a) what breaks in production if you get this wrong, and (b) the signal that tells you you're in that situation. Every scenario reveal must model the reasoning process, not just the conclusion. When choosing between adding more content and deepening existing content, prefer depth.

---

## Code conventions

**Every tab exports a default function with `onNavigate` prop.**  
Signature: `export default function XTab({ onNavigate }) {}`. Even if the tab doesn't currently use `onNavigate`, include it for future cross-tab navigation.

**localStorage keys prefixed `msl_`.**  
Score keys: `msl_score:{tabPrefix}`. Tab-specific keys: `msl_{tabname}`. Never write to localStorage without the prefix. Full key registry is in **METRICS.md** (not README.md — METRICS.md is the canonical source).

**No `isolation: "worktree"` in Agent tool calls.**  
This repo has a recurring git issue where worktree isolation fails. Agents must write directly to the workspace path.

**Brace balance check before committing.**  
Run `node -e "..."` brace counter on any new or heavily edited `.jsx` file. Output must be `0`.

---

## HomeTab

**HomeTab is a dashboard for returning users, not a landing page.**  
The primary audience is someone who has already seen the product and is coming back to practice. Every section added to HomeTab must pass: "does a daily returning user need this?" If the honest answer is "it impresses new visitors" or "it explains what the product is", it does not belong on HomeTab. Landing-page content (hero, stats strips, ecosystem ads, feature callouts) has been removed and must not return. The Today zone's sidebar nav is the correct place for first-time orientation.

**HomeTab section budget (v4.16 baseline):**  
Jump Back In pill → TODAY row (case + activity) → Role → Continue → Bookmarks → Track grid → Changelog. This is the ceiling. New sections need to displace something, not just append.

**Activity widget shows last 4 weeks (28 days), not 91.**  
91 days of mostly-empty squares is visually meaningless for a new or casual user. 4 weeks is the right window — dense enough to show a pattern when there is one, honest when there isn't.

---

## Product framing

**ML Systems Lab is an ML judgment simulator, not an ML systems platform.**  
The name "ML Systems Lab" can imply infrastructure — pipelines, Kubernetes, distributed training, real vector databases. The product delivers something different: it trains the pattern recognition and decision-making that lets you work *with* those systems under production pressure. "I built a systems lab" and "I built a judgment simulator for ML practitioners" create completely different expectations, and the product only meets the second. Every copy and positioning decision should be grounded in the second framing.

Concretely, this means:
- README opening: describes the judgment gap (you can finish an ML course and still freeze when a model degrades silently in production), not the feature inventory
- Tab and CTA language: "train your judgment" not "learn ML systems"
- Scenario framing: "a real incident broke this way" not "here is a concept about X"
- External descriptions: "production ML judgment simulator" not "ML systems learning platform"

**The product has four differentiators that are genuinely hard to replicate:**  
Pyodide (Python execution in-browser, no server), Web Speech API (verbal practice with live transcription), StaffLayer (IC5→Staff gap scenarios — almost nowhere else covers this), CodeBugs (production ML code with exactly one buried flaw). These must be surface-visible in the README and first-load experience — they are the moat, and they are currently buried.

**The no-backend architecture is correct for this product type — it is not a limitation.**  
A user who opens the app in 3 seconds and starts a 45-min mock exam has a better experience than a user who creates an account, verifies email, and navigates an onboarding flow. The right comparison is not "this vs. a SaaS platform" — it is "this vs. doing nothing, using YouTube, or hoping your interviewer mentions the right failure modes." For that comparison, frictionless wins. The no-backend decision must not be re-litigated without a feature that is genuinely impossible without one.

---

## What is deliberately excluded

**Dual theme system (✅ shipped v4.55).** Parchment light + charcoal dark. Sun/moon toggle in topbar, persists via `msl_theme` localStorage. Both themes defined via CSS variables — `[data-theme="light"]` overrides in `index.css`. All color tokens respond in both themes. The prior "dark-only" constraint was deliberately removed when v4.55 shipped.

**No backend or server-side storage — current constraint, not a permanent one.** See Stack section above. The no-backend architecture is correct for this product's current phase: zero friction, no accounts, instant deploy, nothing to break server-side. This will eventually be reversed when a feature genuinely requires it (e.g., a real end-to-end ML execution demo, collaborative features, or server-side model inference). When that time comes, add a minimal backend scoped to exactly that feature — do not retrofit the whole product. The first backend feature is tracked in IDEAS.md Tier 3.

**No account system.** Zero-friction access is a core principle. Progress lives in localStorage and can be exported to JSON.

---

## Freemium gating

**Free tier:** HomeTab, LandscapeTab, GradientTab, AskTab, and four intro Practice modules (Math Foundations, Feature Engineering, Model Evaluation, Classical ML). Enough to understand the product and build genuine value.

**Premium tier (access code gated):** All Interview zone tools, all Interview drill tools (TrainerTab, CodeBugsTab, CaseStudiesTab, StaffLayerTab), and all advanced Practice modules (SystemDesign, Spark, Airflow, dbt, DataModeling, DeepLearning, DLFineTuning, DLServing, DataScience, CausalInference, TimeSeries, Monitoring, Deployment, CICD). These are the moat — the exam simulation, interview prep, and advanced production scenarios.

**Access code:** `DAI2026`. Permanent once entered — stored in `msl_access` in localStorage. Access code is currently shared freely during beta. The split is free = learn (intro content), premium = perform (exam simulation + advanced modules).

**Gate implementation:** `src/components/AccessGate.jsx` — rendered in `renderContent()` in App.jsx when a premium tab is requested and `msl_access !== 'DAI2026'`. Premium tabs are defined in the `PREMIUM_TABS` set in App.jsx. Lock indicators (SVG padlock) are shown on PracticeCard and InterviewToolCard when locked. Grids remain visible — FOMO is the conversion mechanism.

**Two-gate model (canonical — v4.79):**

Three tiers: Guest → Signed-in Free → Signed-in + Access Code (Full).

Sign-in is mandatory for all non-preview content. The access code is an upgrade on top of sign-in, not a replacement for it. Gates fire in strict sequence — auth first, content second.

Gate logic for premium tabs (App.jsx renderContent):
1. `authEnabled && !user` → inline "Sign in to access" card (auth gate)
2. `!isUnlocked` → `<AccessGate />` (content gate)

Gate logic for free tabs (per-module):
1. `authEnabled && !user && !module.guestPreview` → inline "Sign in to access free scenarios" card
2. `!unlocked && !module.isFree` → `<AccessGate />` (content gate)

Two case-level flags per module in free tabs:
- `guestPreview: true` — one module per free tab; accessible without sign-in. Guest preview modules MUST also have `isFree: true` to prevent the contradictory "no account needed → sign in needed" flow.
- `isFree: true` — accessible to signed-in free users; auth required but no access code needed.

`guestPreview` modules (one per free tab): store (FeatureEng), zoo (ClassicalML), metric (ModelEval), pca (ModelsMath).

When `authEnabled = false` (no Supabase env vars): auth gate is a no-op. App runs in localStorage-only mode — treat everyone as signed-in free. Only content gate applies.

Copy rule: never use "no account needed" on any surface. Correct footer language: "Sign in separately to access free cases and save progress."

**v2 enhancement (✅ completed v4.46):** Granular scenario-level difficulty gating within free Practice modules — easy/junior scenarios free, medium/senior/staff gated. 46 scenarios tagged in 4 free modules (Math Foundations, Feature Engineering, Model Evaluation, Classical ML). AccessGate.jsx ready for scenario-level checks at render time.

**Two-layer gating model (✅ locked v4.71 — 3-tier from PAL MONETIZATION.md):**
- **Layer 1 — tab-level gate** (`PREMIUM_TABS` in App.jsx): All Interview zone tools, all Labs, all advanced practice modules are fully gated. A user without a code cannot enter these tabs at all.
- **Layer 2 — scenario-level gate** (the 4 free tabs: FeatureEngTab, ClassicalMLTab, ModelEvalTab, ModelsMathTab): These tabs are NOT in PREMIUM_TABS. They're always accessible. But within each tab, scenarios with `isFree: false` render an inline `<AccessGate>` at the module level. Junior/free scenarios play without a code; mid/senior/staff scenarios gate.
- This maps to PAL's Guest → Free → Premium tier structure. Guest = no code (junior scenarios only). Full Lab = code stored (everything).
- The `isFree` flags in these 4 tabs ARE enforced — they are not informational. The flags in other data files (SparkLabTab etc.) are informational since those tabs are tab-level gated.
- Two gating systems DO coexist by design — one at the tab shell level, one at the scenario level within free tabs. They target different tiers and must not be collapsed.

**No Tailwind utilities in component files.** See Stack section above.

**All modal/overlay inputs must use `fontSize: '16px'` minimum.**  
iOS Safari auto-zooms the viewport on focus when an input's font-size is below 16px. This breaks overlay positioning and is disorienting on mobile. Applies to any `<input>` or `<textarea>` rendered inside a fixed overlay (ContentMap, GlobalSearch, any future modal). Body font-size is already set to 16px in `index.css` — override for inputs must not go below this.

**No mobile sidebar.** The v3 persistent sidebar scaled poorly on mobile and was replaced with the bottom-nav 5-zone architecture in v4. A desktop-only accordion sidebar was re-added alongside the bottom nav (≥769px breakpoint) as a secondary navigation aid — it mirrors the same zone/tab state. Bottom-nav is the primary navigation and is permanent.

**No external component libraries (MUI, shadcn, etc.)** All UI is custom — inline styles + CSS variables. This keeps the visual language consistent and the bundle lean.

---

## Private Study Room

**The study room is a private app that shares MSL's auth and Supabase project, not a feature addition to the public lab.**  
All study content (card text, progress state) lives in Supabase behind Row Level Security. Zero card text ships in the JS bundle. If someone inspects the bundle, they find Supabase fetch calls — not card content. RLS ensures those calls return nothing without a valid session.

**Entry: Shift+Ctrl+K keypress only. No nav link, no route, no sidebar item.**  
The keypress is a UX shortcut for the authenticated owner. It is not a security mechanism. Never describe it as such. Real security = Supabase RLS + `if (!user || !supabase) return null` guard in StudyRoom. If the keypress is ever advertised publicly, the content is still protected — unauthenticated users can trigger the shortcut but the component renders nothing.

**Content stays in Supabase — never in localStorage, never in JS constants.**  
Unlike MSL's public tabs (which hardcode scenarios as JSX constants), the study room has no hardcoded content. This distinction is structural. Violating it — even for one card — breaks the privacy model.

**SR engine: 4-bucket fixed intervals, not full SM-2.**  
Intervals: Again=1d, Hard=3d, Good=7d, Easy=14d. The `ease_factor` column exists in `card_progress` for a future SM-2 upgrade — leave it null. 4-bucket captures ~90% of SM-2's scheduling benefit with zero drift complexity. Do not add ease-factor adjustment before reviewing actual skip/fail rates.

**Import runs once from terminal, never from the frontend.**  
`scripts/import_anki.py` uses the Supabase service key (bypasses RLS) to seed `study_cards` and initial `card_progress` rows. This key never goes in the frontend bundle or in any committed file. The import is idempotent per lane — re-running on an already-imported lane creates duplicates. Run it once per lane and check the verification query in `study_schema.sql` before proceeding.

**Lane assignment is permanent:**  
MSL owns lane1 (RecSys), lane2 (DL/PyTorch), lane3 (MLOps), lane4 (Spark), lane5 (Cloud), lane6 (sklearn/pandas). GAL owns lane7 (LLMs). PAL owns lane8 (Experimentation). Do not import cross-lab lanes into MSL — the card content will be out of context in the SR loop.

**v1 scope is concept cards only.** Code execution cards (Pyodide cells), system design drills, and debug scenarios are v2. Adding them prematurely before the concept loop is proven closes no loop — it just adds complexity.

---

## Community features

**Community features route through form services, not a backend.**  
Any feature that requires collecting user-generated content (feedback, testimonials, interview experiences) uses a free external form service (Tally.so or Formspree) as the intake layer — not a backend API or database. The form service emails the submission to the admin. Admin reviews, edits if needed, and manually adds approved entries to a hardcoded JS data file in `src/data/`. Vercel deploys the file on next push. This is not a limitation — it is the correct v1 architecture for a solo-maintained product with no ops overhead and no risk of spam, PII exposure, or unreviewed content reaching production.

**Admin approval = editing a data file and pushing to main.**  
There is no admin panel. Approval is the act of adding an entry to `src/data/testimonials.js` or `src/data/interviewExperiences.js` and deploying. Rejection is the act of not adding it. This is intentional — admin tooling would be over-engineering for the current scale.

**Feedback entry point is a floating chip, not end-of-tab.**  
A persistent "Rate this" floating chip (bottom-right, visible across all tabs) is the correct UX pattern for feedback collection. "At the end of every tab" was evaluated and rejected: it disrupts flow, it is intrusive on short sessions, and it creates inconsistent UI across 30+ tabs. One global entry point is easier to build, easier to maintain, and less annoying.

**Maximum 3 rating questions in any feedback form.**  
Completion rate on in-app feedback drops sharply after 3 questions. Rating questions for ML Systems Lab: (1) session usefulness for interview prep, (2) difficulty realism vs. actual interviews, (3) likelihood to recommend. These three are fixed — do not add more without removing one.

**Interview Experiences use a fixed skill taxonomy, not free-form tags.**  
The 10-tag taxonomy (`ml_fundamentals`, `statistics`, `system_design`, `coding_ml`, `coding_general`, `experimentation`, `product_sense`, `deep_learning`, `sql`, `behavioral`) is agreed and fixed. Tags are assigned by admin during review — not by submitters. This prevents taxonomy drift and keeps the frequency chart meaningful. Do not expand the taxonomy without auditing the existing distribution first.

## Product identity rules (from PM audit, 2026-06-03)

**MSL's primary use case is interview prep for senior MLE roles.**
Every content and feature decision is evaluated against this first. If something doesn't serve a user preparing for a senior MLE interview, it needs a strong independent reason to exist. This does not mean the product is only an interview tool — production judgment training is the method, interview readiness is the outcome.

**MSL optimizes for production ML judgment, not generic ML learning.**
Content belongs if it requires production judgment to answer correctly. Definitions, tutorials, and recall-based questions do not belong unless they are steps in a judgment scenario. If a user can answer correctly without having shipped a model, the question is probably wrong for this product.

**The first session must always prescribe one action.**
Home must always have a visible "do this first" directive without scrolling. A user who arrives cold must know exactly what to do in the next 10 minutes. Do not add features to the home page that make the entry path less obvious.

**Every scenario must contain a production tell.**
The "In production, this breaks as…" pattern is mandatory for all MCQ explanations. This is what distinguishes MSL from a flashcard deck. No scenario ships without a production tell in its explanation.

**The three-tier format is the product's methodology. Non-negotiable.**
Every content piece in a judgment-testing context must have: `whatsTested` (amber), `antiPattern` (rose), `staffFraming` (violet). All three fields, every scenario. Treat a missing field as a bug, not a deferred task.

**The access code is a private beta mechanism. It must not be published publicly.**
`DAI2026` (or any successor code) must not appear in README.md, marketing copy, social posts, or any public-facing document. The code is distributed only through direct contact with testers. A gate that is publicly documented is not a gate.

**Practice areas require depth before they are treated as full features.**
Minimum: 12 scenarios per practice area before a section is considered complete. Below 12 is a preview. Do not add a new practice area until the existing ones reach 12. Current status: Incident Room (6), ML Coding (7) — both below threshold.

**Navigation is skill-first, not role-first or domain-first. Decided 2026-06-03.**
Roles get renamed constantly across companies and assume the user already knows where they fit. "ML Engineer" at Google is not "ML Engineer" at a startup. Skill labels don't have this problem — "Feature Engineering" means the same thing everywhere. The nav top-level is: Features / Evaluation / Systems / Training / Data / Interview / Labs / Learn. Do not add a role-based section (e.g. "ML Engineering", "MLOps") without reverting this decision first. This applies to sidebar labels, section headers, and guided path descriptions.

**MSL vs GAL content boundary — retrieval and generative AI scenarios.**  
MSL covers production ML for traditional/statistical ML systems. GAL (GenAI Systems Lab) covers LLM-based and generative AI systems. The boundary applies to retrieval scenarios specifically: ANN / vector search for recommendation at scale (HNSW, IVF, index staleness, candidate generation quality) belongs in MSL — these are infrastructure decisions every platform MLE faces. RAG-specific scenarios (chunking strategy, embedding drift, hallucination from retrieval gaps, context window allocation) belong in GAL — these are LLM-systems concerns. When a scenario involves both (e.g., a recommendation system migrating to embedding-based retrieval), classify by the primary judgment being tested. Any new scenario that touches LLM inference, prompt engineering, or generation quality defaults to GAL unless the judgment is clearly about the ML pipeline (training, serving latency, drift) rather than the LLM behavior.

## Monetization plumbing (adopted from PAL, 2026-06-05)

**Three tiers: Free → Premium (access code) → Stripe (future).**
Free tier: home, landscape, gradient, ask, models, features, eval, classical. Enough to understand the product and build genuine value. Premium tier (access code): everything — all Interview zone tools, all Labs, all advanced practice modules. Stripe tier (future): same as Premium, validated server-side. The access code community tier coexists with Stripe — it does not go away when Stripe ships.

**`src/utils/unlock.js` is the single source of truth for access logic.**
`isUnlocked()`, `unlock()`, `getAccessTier()`, `ACCESS_CODE`, and `STORAGE_KEY` all live there. Do not read `localStorage` directly for access state anywhere else in the codebase. Any future Stripe validation is added here only.

**`AccessGate` is the single gate component.**
No inline gate logic in tab components. Every locked surface uses `<AccessGate title="" body="" ctaLabel="" onUnlock={} />`. Copy is surface-specific and outcome-framed — not feature-listed. The `GATE_COPY` map in App.jsx is the authoritative source of gate copy per tab. Consistent visual language, contextual copy via props.

**Gate copy must be outcome-framed, not feature-listed.**
Wrong: "Unlock 7 ML coding problems." Right: "7 Python problems from real senior/staff loops. Live Pyodide execution. The format most engineers skip and then fail on." The copy must describe what the user achieves, not what the feature does. Apply this rule to all new gate copy and any revision of existing copy.

**`Plans & Access` tab is the canonical conversion surface.**
All "unlock" CTAs in the app navigate to the `plans` tab. The Plans page shows the Free vs Premium tier breakdown and the access code input field. Do not add a second access-code entry point anywhere else in the app.

**`GATE_COPY` in App.jsx must have an entry for every tab in `PREMIUM_TABS`.**
When adding a new premium tab, add the entry to `GATE_COPY` in the same commit. A tab without a `GATE_COPY` entry falls back to the generic default — acceptable temporarily, not acceptable at launch.

**No 10-question session gates. Ever.**
Session-based content limits add friction without conversion benefit. A guest who hits a limit thinks the product is broken, not that they should get access. The access code model already scopes access cleanly.

## Content quality rules (from PAL/GSL audit, 2026-06-05)

**Decision-first, never definition-first.**
Every scenario, module, and Gradient post opens with a situation — not a definition. The scenario on feature store drift starts with "Your model accuracy dropped 4% on Tuesday with no deployment" — not "Feature drift occurs when...". This applies to every new scenario and every revision.

**Every interactive module must meet the Configure → Logic → Outcome → Diagnosis standard.**
A module that presents information without requiring user input is a reference table, not an interactive. Reference tables belong in Gradient posts, not in tabs. Every module in IncidentRoom, MLCoding, and the Project Labs already meets this bar. New modules must too.

**Every module must end with a forward pointer.**
At minimum, one of: a related Gradient post link, the next logical tab to visit, or a specific scenario in another tab that builds on this one. Silent module endings break the learn loop at the most important moment. See `docs/CONTENT_QUALITY_BAR.md`.

**`RECENTLY_ADDED` in HomeTab.jsx must be updated when content ships.**
When new scenarios, posts, or features ship, add an entry to `RECENTLY_ADDED` in the same commit. Returning users must be able to see what changed since their last visit. Maximum 5 items shown at a time; array can grow indefinitely.

**Build the visualization only after 15+ approved submissions.**  
A frequency chart built from fewer than 15 data points is misleading — one outlier submission can skew a category by 10+ percentage points. The submission form and admin curation process (v1) ships independently of the visualization (v2). The chart is not built until the corpus is large enough to tell a real story.

**Structural token extraction — v4.48 Tier 1 candidates:**

Three padding/spacing values identified in v4.48 Item 2 audit as exceeding 5+ repetition threshold. Extract when next refactor touches these areas:

| Token | Current repetitions | Value | Recommendation |
|-------|-------------------|-------|-----------------|
| `--card-pad-primary` | 46 | `16px` (typical card padding) | Extract to `:root`, replace all `padding: '16px'` on card containers |
| `--card-pad-secondary` | 63 | `12px` (compact card padding) | Extract to `:root`, replace all `padding: '12px'` on nested elements |
| `--prime-bg-light` | 39 | `rgba(240,165,0,0.1)` (amber tint bg) | Extract to `:root`, replace all light amber backgrounds |

**Extraction trigger:** When refactoring any tab file and touching card/section padding, extract these tokens first. Prevents future drift.

## LLM integration boundary (2026-06-06)

**MSL does not embed LLM calls. MSL is a context generator; the LLM is the trainer.**

Decided after evaluating whether to add the Interview Trainer system prompt (a versioned, timed, scored interview prep control system built by Avinash) directly into MSL. Decision: no.

Rationale:
- MSL's "no backend" constraint means LLM calls require either a backend proxy or user-supplied API keys, both of which introduce trust/security surface and account complexity MSL explicitly avoids.
- The trainer prompt works correctly standalone (Claude / ChatGPT + resume + JD). Embedding it in MSL gains nothing architecturally and loses the portability that makes it useful.
- The correct integration is a "Start Interview Sim" export button — MSL reads localStorage (scores, weak modules, session memory), assembles a pre-filled context block, and the user pastes it into their LLM of choice alongside the trainer prompt and their resume/JD. Zero infrastructure change. Pure string template.

**What this means for future decisions:**
- Do not add LLM API calls to MSL speculatively. The first legitimate case (e.g., AskTab with user-supplied key, or a backend feature in Ideas Tier 3) will be evaluated on its own merits.
- `AskTab` is exempt from this rule — it already uses the Web Speech API and is a distinct interaction mode. An LLM integration there (user-supplied key) is tracked separately in Ideas.
- Any prompt, template, or trainer tool that works standalone stays standalone. MSL's job is to generate the context, not run the trainer.

