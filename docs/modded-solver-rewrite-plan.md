# Modded Solver Visual Rewrite — Instructions

This document describes how to rewrite the ~40 modded module solvers in
`ktanesolver-frontend/src/components/solvers/` to match the unified design
system already applied to the 12 vanilla solvers.

## Context: what the vanilla pass established

5 shared primitives now live in `src/components/common/`:

| Primitive | Purpose |
|---|---|
| `SolverLayout` | Outer vertical stack (already existed) |
| `SolverSection` | Titled card container. Header stacks: title → description → actions, always vertical |
| `SolverInstructions` | Muted footer-hint wrapper (`text-xs text-muted-foreground`) |
| `SolverControls` | Standard Solve / Reset button row (already existed) |
| `SolverResult` | Standard success/info callout (already existed) |
| `ErrorAlert` | Inline error banner (already existed) |
| `TwitchCommandDisplay` | Command strip, accepts string or string[] |
| `SegmentedControl` | Generic typed segmented button group. Props: `value`, `onChange`, `options: ReadonlyArray<{value,label}>`, `size`, `disabled`, `ariaLabel`, `className` |
| `StageIndicator` | Circle+line progress (current, completedThrough, total) |
| `ColorSwatchPicker` | Row of circular color swatches + optional clear X |

Every vanilla solver now follows this layout skeleton:

```tsx
<SolverLayout>
  <SolverSection title="…" description="…" actions={…}>
    {/* primary inputs */}
  </SolverSection>

  {/* more sections as needed */}

  <SolverControls onSolve={…} onReset={…} isSolveDisabled={…} isLoading={…} isSolved={…} solveText="…" />
  <ErrorAlert error={error} />

  {result && <SolverResult variant="success" title="…" description="…" />}
  {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

  <SolverInstructions>…short hint…</SolverInstructions>
</SolverLayout>
```

## Non-negotiable constraints

1. **Preserve all behavior**: service calls, `useSolver`, `useSolverModulePersistence`,
   `markModuleSolved`, `updateModuleAfterSolve`, `generateTwitchCommand`, state-blob
   shapes (including backward-compat `onRestoreState` branches).
2. **No API / service / type changes** unless clearly needed. This is a visual pass.
3. **Use design tokens**, never daisyUI classes. Forbidden: `bg-info`, `text-success`,
   `bg-warning`, `bg-error`, `text-base-content`, `bg-base-100/200/300`. Use:
   - Neutral: `bg-card`, `bg-muted`, `bg-muted/40`, `border-border`, `text-foreground`, `text-muted-foreground`
   - Accent: `bg-accent`, `ring-ring`, `border-ring`
   - Semantic colors via tailwind palettes: `emerald-*` (success), `amber-*` (warning/lit),
     `red-*` (danger), `blue-*` (info/active), `fuchsia-*`/`purple-*` (special).
4. **Always use `cn()`** from `src/lib/cn.ts` for conditional classes.
5. **Icons** from `lucide-react` only.
6. **Every section header stacks vertically** — do not introduce `sm:flex-row` on
   `SolverSection` header. This was deliberately removed during the vanilla pass.
7. Keep `TwitchCommandDisplay` near the bottom, `SolverInstructions` last.
8. **Run `npx tsc -b`** from `ktanesolver-frontend/` after each solver. Must exit 0.

## Recommended batching

40+ files is too many to rewrite in one session. Batch by visual archetype so
each batch reuses the same mental model and primitives.

### Batch 1 — Simple picker / segmented input (fast, low risk)
- `AlphabetSolver` — letter input
- `EmojiMathSolver` — expression input
- `WordScrambleSolver` — letters input
- `AnagramsSolver` — word input
- `CaesarCipherSolver` — text + shift number
- `ForeignExchangeSolver` — currency pair
- `CryptographySolver` — cipher text input
- `MathSolver` — numeric expression
- `LetterKeysSolver` — 4 buttons, a label each — reuse `SegmentedControl` or custom swatches

Pattern: one `SolverSection` with an `<Input>` or `<SegmentedControl>`, result
in `SolverResult`, twitch command, instructions.

### Batch 2 — Color / LED grids (reuse Simon / Knobs feel)
- `ColorFlashSolver` — flash sequence of word+color pairs; render as chip pills like
  SimonSolver's flash sequence (colored bg per color, text = word).
- `SwitchesSolver` — 5 on/off toggles, target pattern vs current pattern. Use the
  `KnobsSolver` LED-button pattern (amber-400 lit / muted dim).
- `SemaphoreSolver` — two flags per step. Render stick-figure flag directions with
  SVG or CSS transforms, one card per step.
- `CrazyTalkSolver` — paired display text / footer word input.
- `ForgetMeNotSolver` — numeric stage list; reuse `StageIndicator` + history list.
- `TwoBitsSolver` — query/response pairs.

### Batch 3 — Multi-stage (reuse StageIndicator)
- `SimonStatesSolver` — 4 stages of colored flash sets → reuse StageIndicator + Simon chip styling.
- `MorsematicsSolver` — 3 stages, each a morse pattern → reuse `MorseCodeSolver`'s pattern card.
- `SillySlotsSolver` — 4 stages of 3 slot symbols.
- `ProbingSolver` — stepwise wire pair probing.
- `TurnTheKeysSolver` — multi-key ordering; stage list of which key first.
- `TurnTheKeySolver` — timer-based single-key (closer to needy feel).

### Batch 4 — Grid / board modules (reuse Maze grid)
- `MysticSquareSolver` — 3×3 slide puzzle. Grid cells + number labels. Solution shown as arrow sequence.
- `MouseInTheMazeSolver` — 3×3 colored spheres. Reuse Maze cell styling; goal color swatch.
- `ThreeDMazeSolver` — pseudo-3D maze. Keep the ASCII/letter grid; restyle borders & labels.
- `OrientationCubeSolver` — 3D cube preview (keep existing three.js / canvas if any, just wrap in `SolverSection`).
- `PlumbingSolver` — pipe grid. Preserve SVG; restyle chrome.
- `ChessSolver` — chess board (8×8 or subset). Light/dark squares via `bg-muted` / `bg-muted/40`, piece text in `text-foreground`.

### Batch 5 — Keyboard / music
- `PianoKeysSolver`, `CruelPianoKeysSolver` — piano layout. Keep white/black key
  arrangement; white = `bg-card border-border`, black = `bg-foreground text-background`.
  Feature matches rendered as badges below.
- `RoundKeypadSolver` — like KeypadsSolver but the 4 keys arranged in a circle.
  Reuse the symbol picker pattern from `KeypadsSolver`, then render layout
  positions as `absolute`-positioned buttons on a circular container (`rounded-full` outer div, 4 children at N/E/S/W).

### Batch 6 — Text-heavy / narrative
- `AdventureGameSolver` — enemy + items selection. Two sections: enemy picker
  (`SegmentedControl` of enemy types), item multi-select (like Keypads symbol grid).
- `AstrologySolver` — 3 dropdowns (planet, sign, house). Use `Select` components.
- `LogicSolver` — 3 logic gates with inputs. Render as connected nodes with SVG lines, or as a table.
- `ListeningSolver` — play audio then pick sequence. Keep `<audio>` element;
  wrap play in section actions like `MorseCodeSolver`.
- `LaundrySolver` — clothing attributes (material/color/size). Three
  `SegmentedControl`s; solution card shows wash/dry/iron/special icons.

### Batch 7 — Wire & connector variants
- `ComplicatedWiresSolver` — 6 wires, each with 4 independent attrs (red/blue/star/led).
  Reuse `WireSolver` row layout; replace "color chips below" with 4 toggle icons per wire.
- `WireSequencesSolver` — 12+ wires across pages. Per-wire row: ordinal, color swatch,
  target letter `SegmentedControl` (A/B/C). Solution badge = cut/don't cut.
- `ConnectionCheckSolver` — digit pairs; Input pairs, solution boolean per pair.

### Batch 8 — Misc
- `CombinationLockSolver` — dial display; use a monospaced Input and nudge buttons.
- `NumberPadSolver` — 10 numeric buttons grid (3×3 + 0). Reuse Simon button styling.
- `SafetySafeSolver` — 4 numeric dials; Input array.

## Per-solver procedure

For each solver:

1. **Read the current file**. Note:
   - state variables (inputs, result, twitchCommand, per-stage history)
   - persistence shape in `onRestoreState` (keep unchanged)
   - which service it calls and the exact output shape
   - whether it calls `updateModuleAfterSolve` or just `markModuleSolved`
2. **Map inputs to primitives** using the batch archetype above.
3. **Rewrite the JSX** top-to-bottom:
   - Replace any existing `Card`/`CardHeader`/`CardTitle` wrappers with `SolverSection`.
   - Replace inline segmented radios / toggle buttons with `SegmentedControl`.
   - Replace multi-stage state list headers with `StageIndicator`.
   - Replace bespoke twitch command strips with `TwitchCommandDisplay`.
   - Replace trailing `<p>` hints with `<SolverInstructions>`.
4. **Preserve state/handlers verbatim**. Only the JSX and local presentational
   subcomponents change. Handlers like `handleSolve`, `reset`, `onRestoreState`,
   `extractSolution`, `inferSolved` keep their bodies.
5. **Remove unused imports** (`Card*`, `Label`, old icons, daisyUI class
   strings). ESLint will flag these; easier to do as you go.
6. **Run `npx tsc -b`**. Fix any type errors before moving on.
7. **Visually spot-check** in the dev server on a narrow viewport (<400px) —
   no horizontal scroll, no 1-word-per-line wraps. This was the main issue
   during the vanilla pass.

## Naming & layout conventions to keep consistent

- Section titles are short nouns: "Wires", "Display", "Button labels",
  "Stage progress", "Press in this order".
- Descriptions are one sentence, sentence-case, no trailing period if under 6 words.
- Result variant: `success` when a definitive action is known, `info` when showing intermediate data.
- Twitch command strip title is provided by the `TwitchCommandDisplay` component —
  do not add your own wrapper title.
- Always include `aria-label` on icon-only buttons and on `SegmentedControl`s.
- Input spacing: prefer `gap-2` between controls, `gap-3` between form rows,
  `gap-4` between logical section bodies. Sections themselves stack via
  `SolverLayout` (already provides vertical gap).
- Grids: `grid-cols-2 sm:grid-cols-4` for 4-wide inputs, `grid-cols-6 sm:grid-cols-8`
  for symbol pickers, never raw pixel widths.

## Color palette quick reference

| Meaning | Idle | Active / Selected | Success / Solved |
|---|---|---|---|
| Neutral chrome | `border-border bg-muted/40` | `border-ring ring-2 ring-ring ring-offset-1 ring-offset-card bg-accent/15` | `border-emerald-500 bg-emerald-500/10` |
| Lit indicator | `bg-muted text-muted-foreground` | `bg-amber-400 text-amber-950 shadow` | — |
| Danger / cut / error | — | `border-red-500 bg-red-500/10 text-red-700 dark:text-red-400` | — |
| Active step | `text-muted-foreground` | `text-foreground bg-accent/20 border-accent` | `bg-emerald-600 text-white` (with Check icon) |

## Checkpoints

After each batch (1 through 8):

1. Run `npx tsc -b` — must exit 0.
2. Run `npm run lint` — should be clean on touched files (warnings from
   untouched files are acceptable).
3. Commit with message `visual: rewrite modded solver batch N (<list>)`.
4. Ask the user to eyeball one representative solver from the batch in the dev
   server before moving on.

## Common pitfalls observed during vanilla pass

- **`SolverSection` header wrapping**: don't revive `sm:flex-row` — the user
  explicitly rejected side-by-side title+actions.
- **`useEffect` + twitch commands**: some solvers build commands in a `useEffect`
  keyed on `result.length`. Preserve this; do not collapse into render-time work.
- **Backward-compat restore branches** (e.g. Memory's `displayHistory` /
  `solutionHistory`): keep untouched — backend may still emit old shape.
- **`updateModuleAfterSolve` vs `markModuleSolved`**: some solvers use both for
  explicit state sync (Keypads). Keep whichever was there.
- **Twitch command may be `string` OR `string[]`** — `TwitchCommandDisplay`
  accepts both but double-check each call site.
- **Reset must also call `resetSolverState()`** (or equivalent) so error and
  solved flags clear — easy to forget when restructuring.

## Expected total effort

At ~5–10 minutes per solver with this scaffolding, the full modded pass is
roughly 4–6 focused hours spread across 8 batches. Do not attempt all batches
in one session — context window and visual-fatigue errors compound.
