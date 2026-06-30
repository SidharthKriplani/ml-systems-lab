# MSL Quality Gate System

_Last updated: 2026-07-01. Apply before every batch. These gates exist because we shipped blurry canvases, blank interactives, and content walls that looked nothing like how humans learn. Never again._

---

## The Standard

Every module and interactive on MSL should clear this bar:

> A person who knows only mean/median/mode reads the module and understands not just what the concept is but WHY it exists, what broke without it, and what it costs. The interactive makes that mechanism visible, not decorative.

---

## GATE 1 — Before any batch starts

Run these before writing a single file.

1. **Read the renderer first.** If content is being formatted, open the component that renders it and read it. Never write markdown for a raw-string renderer.
2. **Look at the live product.** Open the deployed URL. What does a real user see right now? Not an agent summary — the actual page.
3. **Read the interface contract.** If building a component that plugs into a system (InteractivePanel, renderMd, InteractiveShell), read that system's code before writing to it.
4. **State "done" concretely.** What specific visible thing will be different when this batch is done? If you can't state it, don't start.

---

## GATE 2 — Content quality (every foundation module)

### The causal chain template

Every module must trace this chain explicitly. If any link is missing, the content fails:

```
NEED        → What real problem requires this concept?
NAIVE FAIL  → What simpler approach breaks here, and how specifically?
MECHANISM   → What does this concept do that fixes that failure?
COST        → What does the mechanism give up or require?
NEXT        → What new problem does this solution expose?
```

### Content checks

| # | Check | Pass condition |
|---|---|---|
| C1 | Opens with a failure | First sentence names what breaks without this concept. Not a definition. |
| C2 | Full chain is traceable | All 5 links (Need → Naive fail → Mechanism → Cost → Next) are present and each pulls the next causally, not just thematically |
| C3 | Depth is earned | Covers the concept at the depth a senior ML engineer uses in an interview. Derives the core mechanism, doesn't just summarize it |
| C4 | Patient explanation | Each step assumes only what came before. No "as you know" moments. A person who has seen mean/median/mode but nothing more can follow the chain from the start |
| C5 | "Why this formula" answered | Not just what the formula is — why this formula and not a simpler one? What would break with the simpler version? |
| C6 | Non-technical stakeholder test | Read the summary as if you're a PM with no ML background. Could you explain the concept's purpose to your VP? If you'd lose them, the chain didn't start early enough |
| C7 | No buried equations | Every math expression is in `$...$` on its own displayed block. Zero exceptions. |
| C8 | Paragraph breaks | `\n\n` between each distinct logical move. Never a wall of prose. |
| C9 | keyPoints: bold claim + 1 sentence | `**Bold claim.**` opens each bullet. One supporting sentence follows. If it's 3+ sentences it's a paragraph, not a bullet. |
| C10 | No "which means" | Zero occurrences. Find another way to connect the logic. |
| C11 | Takeaway names a tradeoff | Something gained AND something paid, both stated. Not "X is important." |
| C12 | checkQuestions are MCQs | Every check question has 4 options, one correct, three plausible wrong. No open-ended prompts. The correct answer isn't always option A. |

---

## GATE 3 — Interactive quality (every component)

### Step 0: Decide the format first

Before building, decide which format fits the concept:

| Format | When to use |
|---|---|
| **Interactive** | Concept has a parameter the user should explore (k in KNN, η in gradient descent, C in SVM). Changing the parameter should produce visibly different, conceptually important behavior. |
| **Step-through animation** | Concept is a process that unfolds over time (backprop, message passing, EM algorithm). User controls pace but not parameters. |
| **Side-by-side animation** | Concept is a comparison (GD vs momentum, train vs test loss). Both sides animate together, the contrast IS the lesson. |

The choice is intentional and documented in the component's header comment.

### Visual quality checks

| # | Check | Pass condition |
|---|---|---|
| I1 | It actually renders | On first load, something is visible. No blank canvas. No silent error. If it needs an Initialize step, the button is prominent and its purpose is obvious. |
| I2 | Color contrast | Decision boundaries, lines, axes: ≥ 3:1 contrast against background. Text labels: ≥ 4.5:1. Test on `var(--depth)` dark background. Boundary lines must be clearly visible — not faint dashes on a similar-hue background. |
| I3 | No layout jank on tab open | Canvas container has CSS `min-height` set. No expand-then-settle behavior. If the canvas is inside a tab that starts hidden, `min-height` prevents the 0px → full-height jump. |
| I4 | Breathing room | Panels have clear separation. Text labels don't clip or squish. Title text has enough width to not wrap awkwardly. Multiple charts aren't competing for the same space. |
| I5 | Self-labeling | Every axis, every cluster, every panel has a visible title. Legend if there are multiple series. A user who doesn't know the concept can orient without reading external text. |
| I6 | Side-by-side comparisons are legible | When showing two processes simultaneously (e.g. vanilla GD vs momentum), the two trajectories must be distinguishable. Different colors + a clear winner visible by the end. Not a tangle of overlapping lines. |

### Interface contract checks

| # | Check | Pass condition |
|---|---|---|
| I7 | `useImperativeHandle` present | Exposes `{ play, pause, reset, step }` via `forwardRef` |
| I8 | No auto-play on mount | Component does not start animation without an external trigger. Waits for InteractiveShell to call `play()`. |
| I9 | `step()` is conceptually meaningful | Advances one epoch / one EM round / one tree / one message-passing round. Not just one animation frame. |
| I10 | Parameters exposed | At least one control (slider or toggle) that changes a conceptually important parameter and produces visibly different behavior. |
| I11 | DPR-safe | After `ctx.scale(dpr, dpr)`, all drawing uses `canvas.clientWidth` / `canvas.clientHeight`. Zero uses of `canvas.width` or `canvas.height` as logical coordinates. |
| I12 | Rubric score ≥ 12 | Score on 5-dimension rubric (Fidelity × Interactivity × Clarity × DPR × Teaching, each 1–3). Flag if ≤ 9. Update INTERACTIVE_RUBRIC.md. |

---

## GATE 4 — Interactive coverage (every module)

Every foundation module must have one of:

- **Interactive** — controls that expose a concept parameter
- **Step-through animation** — process unfolds with user controlling pace
- **Justified exception** — documented reason why neither helps (rare; e.g. a pure derivation module where the insight is algebraic)

"I didn't build one yet" is not a justified exception. The decision is made before the module ships.

---

## GATE 5 — InteractiveShell behavior

| # | Check | Pass condition |
|---|---|---|
| S1 | Auto-play trigger | IntersectionObserver fires when component's top edge enters viewport |
| S2 | Auto-pause on exit | When component leaves viewport, Shell calls `pause()`. No background rAF loops. |
| S3 | Control symbols | Buttons render `▶` `⏸` `↺` `⏭` — Unicode symbols, not text strings |
| S4 | Shell is layout-agnostic | Shell has zero knowledge of viz internals. Purely calls the ref interface. |
| S5 | Graceful before ref ready | If ref is null, control clicks are no-ops. No thrown errors. |

---

## GATE 6 — Post-batch verification

After any batch of file writes, before moving on:

1. **Spot-check 3 random items** — read the actual written files, not the agent's summary of them
2. **Verify wiring** — new component imported and registered in InteractivePanel.jsx; renderMd wired into tab renderer
3. **Syntax scan** — grep for: missing `export`, unclosed JSX, template literals not closed, `canvas.width`/`canvas.height` used as drawing coordinates
4. **Deployed verification** — after a push, open the live URL and load at least 2 spot-checked modules. Confirm they render. A passing file check is not a passing deployed check.
5. **Update rubric** — if an interactive changed, update its row in INTERACTIVE_RUBRIC.md

---

## Quick reference — the full chain

```
GATE 1  Pre-batch    Read renderer → look at live product → read interface contract → state "done"
GATE 2  Content      Chain complete → patient → depth → equations isolated → MCQ checks
GATE 3  Interactive  Renders → contrast → no jank → breathing room → useImperativeHandle → DPR safe
GATE 4  Coverage     Every module has interactive / animation / documented exception
GATE 5  Shell        Auto-play → auto-pause → correct symbols → layout-agnostic
GATE 6  Post-batch   Spot-check files → verify wiring → syntax scan → deployed verification → update rubric
```
