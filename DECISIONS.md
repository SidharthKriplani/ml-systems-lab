# DECISIONS.md — Architectural Rulebook

Prescriptive. Present-tense. Read before making any choice that affects the whole system.  
This is the "why this works this way" file — not build history (that's LINEAGE.md).

---

## Stack

**React 18 + Vite, no backend, no database.**  
All progress is localStorage-only. This is deliberate — zero friction, no accounts, instant deploy, nothing to break server-side. Do not add a backend unless there is a feature that is genuinely impossible without one (e.g., real-time multiplayer, server-side auth). Adding a backend would break the "no login, works offline" principle.

**Vercel auto-deploy on push to main.**  
No staging environment. Main is always live. Test locally before pushing.

**No Tailwind utility classes in tab files.**  
Tailwind is in the config for historical reasons. All component styling uses inline styles with CSS variable references. This keeps the design system centralized in `index.css` and makes theming consistent. Exception: layout utility classes defined in `index.css` (`.grid-cards`, `.grid-cards-wide`, `.main-content`, `.bottom-nav-safe`) are used via `className`.

**CSS variables for every color and spacing token.**  
Defined in `:root` in `index.css`. Never hardcode hex values in component files. Adding a new color = add it to `:root` first, then reference it.

**Transition, shadow, and radius tokens — use the system variables.**  
`--t-fast: 0.10s ease`, `--t: 0.16s ease`, `--t-slow: 0.26s ease`. Shadow: `--shadow-sm/md/lg`. Radius: `--r-sm: 5px`, `--r: 9px`, `--r-lg: 14px`. Never write hardcoded `transition: 0.2s` or `border-radius: 8px` in component files — reference the tokens.

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

**Per-option explanations, not just "correct answer" reveals.**  
Every wrong option gets an explanation of why it's wrong. This is the core learning mechanism.

**Gradient posts end with a CTA linking to the practice module.**  
Read → practice in one click. Every new Gradient post must identify its target tab and include the link.

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

**No dark/light mode toggle.** Dark-only is a product decision, not an oversight. The design system is built around `--void` (`#0c0a08`) and does not have a light-mode token set. Adding one requires a full design system audit — defer until there's user demand.

**No backend or server-side storage — current constraint, not a permanent one.** See Stack section above. The no-backend architecture is correct for this product's current phase: zero friction, no accounts, instant deploy, nothing to break server-side. This will eventually be reversed when a feature genuinely requires it (e.g., a real end-to-end ML execution demo, collaborative features, or server-side model inference). When that time comes, add a minimal backend scoped to exactly that feature — do not retrofit the whole product. The first backend feature is tracked in IDEAS.md Tier 3.

**No account system.** Zero-friction access is a core principle. Progress lives in localStorage and can be exported to JSON.

---

## Freemium gating

**Free tier:** HomeTab, LandscapeTab, GradientTab, AskTab, and four intro Practice modules (Math Foundations, Feature Engineering, Model Evaluation, Classical ML). Enough to understand the product and build genuine value.

**Premium tier (access code gated):** All Interview zone tools, all Interview drill tools (TrainerTab, CodeBugsTab, CaseStudiesTab, StaffLayerTab), and all advanced Practice modules (SystemDesign, Spark, Airflow, dbt, DataModeling, DeepLearning, DLFineTuning, DLServing, DataScience, CausalInference, TimeSeries, Monitoring, Deployment, CICD). These are the moat — the exam simulation, interview prep, and advanced production scenarios.

**Access code:** `DAI2026`. Permanent once entered — stored in `msl_access` in localStorage. Access code is currently shared freely during beta. The split is free = learn (intro content), premium = perform (exam simulation + advanced modules).

**Gate implementation:** `src/components/AccessGate.jsx` — rendered in `renderContent()` in App.jsx when a premium tab is requested and `msl_access !== 'DAI2026'`. Premium tabs are defined in the `PREMIUM_TABS` set in App.jsx. Lock indicators (SVG padlock) are shown on PracticeCard and InterviewToolCard when locked. Grids remain visible — FOMO is the conversion mechanism.

**v2 enhancement (planned):** Granular scenario-level difficulty gating within free Practice modules (first N easy scenarios free, medium/hard gated). Requires difficulty tagging on 200+ scenarios — logged in IDEAS.md.

**No Tailwind utilities in component files.** See Stack section above.

**No mobile sidebar.** The v3 persistent sidebar scaled poorly on mobile and was replaced with the bottom-nav 5-zone architecture in v4. A desktop-only accordion sidebar was re-added alongside the bottom nav (≥769px breakpoint) as a secondary navigation aid — it mirrors the same zone/tab state. Bottom-nav is the primary navigation and is permanent.

**No external component libraries (MUI, shadcn, etc.)** All UI is custom — inline styles + CSS variables. This keeps the visual language consistent and the bundle lean.
