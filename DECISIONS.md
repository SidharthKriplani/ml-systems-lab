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

**Space Grotesk for UI, JetBrains Mono for code/labels.**  
Do not introduce additional fonts. These two cover every case.

---

## Architecture

**5-zone bottom-nav is the permanent navigation model.**  
Zones: Today / Practice / Read / Interview / Ask. Each zone has independent drill-down state (`zoneTab`). This replaced sidebar navigation in v4 and will not revert. Do not add a 6th zone without strong justification — the bottom nav fits exactly 5.

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

---

## Code conventions

**Every tab exports a default function with `onNavigate` prop.**  
Signature: `export default function XTab({ onNavigate }) {}`. Even if the tab doesn't currently use `onNavigate`, include it for future cross-tab navigation.

**localStorage keys prefixed `msl_`.**  
Score keys: `msl_score:{tabPrefix}`. Tab-specific keys: `msl_{tabname}`. Never write to localStorage without the prefix. Full key registry is in README.md.

**No `isolation: "worktree"` in Agent tool calls.**  
This repo has a recurring git issue where worktree isolation fails. Agents must write directly to the workspace path.

**Brace balance check before committing.**  
Run `node -e "..."` brace counter on any new or heavily edited `.jsx` file. Output must be `0`.

---

## What is deliberately excluded

**No dark/light mode toggle.** Dark-only is a product decision, not an oversight. The design system is built around `--void` (`#0c0a08`) and does not have a light-mode token set. Adding one requires a full design system audit — defer until there's user demand.

**No backend or server-side storage.** See Stack section above.

**No account system.** Zero-friction access is a core principle. Progress lives in localStorage and can be exported to JSON.

**No Tailwind utilities in component files.** See Stack section above.

**No sidebar navigation.** Replaced in v4. The sidebar scaled poorly on mobile and required too many clicks. Bottom-nav is permanent.

**No external component libraries (MUI, shadcn, etc.)** All UI is custom — inline styles + CSS variables. This keeps the visual language consistent and the bundle lean.
