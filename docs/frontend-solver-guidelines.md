# Frontend Solver Guidelines

Design and implementation rules for new module-solver components in
`ktanesolver-frontend/src/components/solvers/`.

These guidelines distill the conventions established by the vanilla and modded
rewrite passes (see `docs/modded-solver-rewrite-plan.md` for the historical
context). Every new solver MUST follow them so the UI stays visually
consistent across the ~50 modules.

For backend-side wiring (registry, JPA entities, services), see
`docs/implementing-new-module-solver.md` — this doc only covers the React
component.

---

## 1. Layout skeleton

Every solver component returns the same top-level shape:

```tsx
<SolverLayout>
  <SolverSection title="…" description="…" actions={…}>
    {/* primary inputs */}
  </SolverSection>

  {/* additional sections as needed */}

  <SolverControls
    onSolve={handleSolve}
    onReset={reset}
    isSolveDisabled={…}
    isLoading={isLoading}
    isSolved={isSolved}
    solveText="Solve"
  />

  <ErrorAlert error={error} />

  {result && (
    <SolverResult variant="success" title="…" description="…" />
  )}

  {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

  <SolverInstructions>…short hint…</SolverInstructions>
</SolverLayout>
```

Order is non-negotiable:

1. `SolverLayout` (always the outer)
2. One or more `SolverSection`s for inputs + intermediate state
3. `SolverControls` (Solve / Reset row)
4. `ErrorAlert`
5. `SolverResult` (if there's a definitive answer)
6. `TwitchCommandDisplay` (if a Twitch command was generated)
7. `SolverInstructions` (always last)

Do not introduce custom outer wrappers, raw `<div className="card">`s, or
`Card`/`CardHeader`/`CardTitle` primitives — they were removed during the
rewrite passes and must not come back.

---

## 2. Shared primitives

All live in `src/components/common/` and are exported from the barrel
`../common`. Use them — do not roll your own.

| Primitive | Purpose |
|---|---|
| `SolverLayout` | Outer vertical stack, provides consistent gap spacing |
| `SolverSection` | Titled card container. Header stacks vertically (title → description → actions) |
| `SolverInstructions` | Muted footer hint (`text-xs text-muted-foreground`) |
| `SolverControls` | Standard Solve / Reset button row |
| `SolverResult` | Standard success/info/warning/error callout |
| `ErrorAlert` | Inline error banner |
| `TwitchCommandDisplay` | Command strip; accepts `string` or `string[]` |
| `SegmentedControl` | Typed segmented button group for small enumerated picks |
| `StageIndicator` | Circle+line progress (current, completedThrough, total) |
| `ColorSwatchPicker` | Row of circular color swatches with optional clear |

Hooks (also from `../common`):

| Hook | Purpose |
|---|---|
| `useSolver()` | Aggregates `isLoading`, `error`, `isSolved`, setters, `clearError`, `reset`, `currentModule`, `round`, `markModuleSolved` |
| `useSolverModulePersistence({...})` | Wires backend-persisted state and solution into the component on mount and on round/module change |

**Section header rules:**
- The `SolverSection` header always stacks vertically. **Never** introduce
  `sm:flex-row` or other side-by-side title+actions layouts.
- Title is a short noun ("Wires", "Display", "Stage progress").
- Description is a single sentence in sentence case; drop the trailing period
  if it is under 6 words.
- `actions` is for compact controls only (a `SegmentedControl`, a Play button) —
  not the primary Solve/Reset (those go in `SolverControls`).

---

## 3. Color tokens

**Forbidden:** any daisyUI token. This includes `bg-info`, `text-success`,
`bg-warning`, `bg-error`, `text-base-content`, `bg-base-100/200/300`,
`border-base-300`, `text-primary-content`, etc.

**Allowed neutral chrome (design tokens):**
- Surfaces: `bg-card`, `bg-muted`, `bg-muted/40`, `bg-background`
- Borders: `border-border`, `border-ring`
- Text: `text-foreground`, `text-muted-foreground`, `text-card-foreground`
- Accent: `bg-accent`, `bg-accent/15`, `bg-accent/20`, `ring-ring`,
  `ring-offset-card`

**Allowed semantic palettes (Tailwind):**
- Success / cut / lit-correct: `emerald-*`
- Warning / lit-indicator: `amber-*` (e.g. `bg-amber-400` for the canonical "LED on")
- Danger / cut / error: `red-*`
- Info / active step: `blue-*`
- Special / star / unique: `fuchsia-*` or `purple-*`

**Quick reference:**

| Meaning | Idle | Active / Selected | Success / Solved |
|---|---|---|---|
| Neutral chrome | `border-border bg-muted/40` | `border-ring ring-2 ring-ring ring-offset-1 ring-offset-card bg-accent/15` | `border-emerald-500 bg-emerald-500/10` |
| Lit indicator | `bg-muted text-muted-foreground` | `bg-amber-400 text-amber-950 shadow` | — |
| Danger / cut / error | — | `border-red-500 bg-red-500/10 text-red-700 dark:text-red-400` | — |
| Active step | `text-muted-foreground` | `text-foreground bg-accent/20 border-accent` | `bg-emerald-600 text-white` (with Check icon) |

Use these consistently — do not invent new semantic colors per solver.

---

## 4. Tooling rules

- **Always use `cn()`** from `src/lib/cn.ts` for conditional classes. Never
  string-concatenate or use array-`.join(" ")` for class composition.
- **Icons** come from `lucide-react` only. No inline SVGs unless the visual
  is genuinely module-specific (e.g. a chess piece, a maze cell, a dial face).
- **Inputs** use the shared `<Input>` from `../ui/input` — do not import raw
  `<input>`.
- **Buttons** prefer the shared `<Button>` from `../ui/button` for generic
  actions; raw `<button>` is fine for purpose-built widgets (color swatches,
  numpad keys), but they MUST be styled with design tokens via `cn()`.

---

## 5. State, persistence, behavior

These rules protect backend contracts and round-restoration semantics. They
were the most error-prone area during the rewrite — do not deviate.

1. **Use `useSolver()` and `useSolverModulePersistence()`.** Do not pull
   loading / error / solved state from custom hooks.
2. **Preserve service-call shape verbatim.** Inputs are wrapped in
   `{ input: { … } }`; outputs come back as `{ output: { … }, solved }`. Do
   not flatten or rename.
3. **Always call `markModuleSolved(bomb.id, currentModule.id)`** after a
   successful single-shot solve, OR `updateModuleAfterSolve(...)` for
   multi-stage modules that need explicit state sync (Keypads, Wire
   Sequences, Number Pad pattern). If the existing solver uses both, keep
   both.
4. **`onRestoreState` MUST handle backward-compat shapes.** The backend may
   still emit older payload formats (e.g. nested `state.input.wires` vs flat
   `state.wires`). Accept all branches; never collapse them away.
5. **`extractSolution` MUST handle nested `output` AND flat formats.** Same
   reason as above.
6. **`reset()` MUST call `resetSolverState()` (the one returned from
   `useSolver`).** This clears `error` and `isSolved`. Forgetting this is the
   single most common bug — a "Reset" that leaves the module looking solved.
7. **`twitchCommand` may be `string` OR `string[]`.** `TwitchCommandDisplay`
   accepts both, but the local state type and prop must agree at the call
   site.
8. **Build twitch commands at solve-time and on solution-restore.** If the
   existing solver builds them in a `useEffect` keyed on `result.length`,
   preserve that — do not collapse into render-time work.

---

## 6. Spacing and grid conventions

- Within a `SolverSection`'s body, prefer:
  - `gap-2` between tightly grouped controls (color swatches, toggle row)
  - `gap-3` between form rows
  - `gap-4` between logical groups
- Sections themselves stack via `SolverLayout` — do not add `mt-*`/`mb-*`
  margins between sections.
- Grids use Tailwind responsive prefixes, never raw pixel widths:
  - 4-wide inputs: `grid-cols-2 sm:grid-cols-4`
  - 6×N symbol pickers: `grid-cols-6 sm:grid-cols-8`
  - Pair lists: `grid-cols-1 sm:grid-cols-2`
- Always test on a narrow viewport (<400px) — no horizontal scroll, no
  one-word-per-line wraps. This was the headline issue that triggered the
  rewrite.

---

## 7. Accessibility

- Every icon-only button needs `aria-label`.
- Every `SegmentedControl` needs `ariaLabel`.
- Toggle-style buttons need `aria-pressed`.
- Stage / step indicators need `role="img"` with a descriptive
  `aria-label` (`StageIndicator` already does this).
- Status callouts use `role="status"` and `aria-live="polite"`
  (`SolverResult` already does this).

---

## 8. SolverResult variants

Pick the variant that matches the meaning, not the visual you happen to want:

| Variant | Use when |
|---|---|
| `success` | A definitive action / value to apply ("Cut wire #3", "Code: 4729") |
| `info` | Intermediate state / read-out, no action implied |
| `warning` | Action is "do nothing" / "wait" ("Don't cut any wires") |
| `error` | A solver-recoverable failure that's not an exception (rare; usually use `ErrorAlert`) |

Do not use `success` for warnings — the green callout implies "do this."

---

## 9. Twitch command conventions

- The component never adds its own wrapper title — `TwitchCommandDisplay`
  provides one.
- For multi-step solutions emit one command per step and pass them as a
  `string[]`, not a comma-joined string. Comma-joining is only acceptable
  when the receiver intentionally bundles them (Complicated Wires).
- Generate commands via `generateTwitchCommand({ moduleType, result })`
  from `src/utils/twitchCommands.ts`; never hand-craft the strings.

---

## 10. Component structure

A well-formed solver file has roughly this skeleton:

```tsx
// 1. Imports, grouped: react, lucide, types, services, utils, common, lib
// 2. Props interface
// 3. Module-local types and constants (color specs, layouts, defaults)
// 4. Pure helpers (no React inside)
// 5. The component:
//    - state
//    - useSolver() destructure
//    - useMemo for moduleState
//    - useCallback onRestoreState / onRestoreSolution
//    - useSolverModulePersistence({...})
//    - input handlers (clear error, clear stale solution)
//    - handleSolve (validate → service → setState → markModuleSolved)
//    - reset (clear local state, then resetSolverState())
//    - derived render values
//    - return JSX following the Layout skeleton in §1
```

Do not interleave service calls into render. Do not call setState in render.
Do not put presentational subcomponents in separate files unless they're
shared with another solver — local helper components (e.g. a `DialFace`)
live at the top of the same file.

---

## 11. Pre-commit checklist

Before opening a PR for a new solver:

1. `npx tsc -b` from `ktanesolver-frontend/` — must exit 0.
2. `npx eslint src/components/solvers/MyNewSolver.tsx` — must exit 0.
3. Spot-check in the dev server at <400px width — no horizontal scroll.
4. Verify Solve → Reset round-trip clears the success/error UI.
5. Verify the new module appears in the catalog selector (it should
   automatically once the backend `@Service @ModuleInfo` solver is registered).
6. If multi-stage: refresh mid-stage and confirm `onRestoreState` rehydrates
   inputs and `extractSolution` rehydrates the answer.

---

## 12. When in doubt

Look at a structurally-similar existing solver and copy its structure:

| Archetype | Reference |
|---|---|
| Simple input → answer | `AlphabetSolver`, `MathSolver`, `CombinationLockSolver` |
| Color/LED grid | `SimonSolver`, `KnobsSolver`, `SwitchesSolver` |
| Multi-stage with `StageIndicator` | `MemorySolver`, `SimonStatesSolver`, `WireSequencesSolver` |
| Wire row metaphor | `WireSolver`, `ComplicatedWiresSolver`, `WireSequencesSolver` |
| Numeric pair inputs | `ConnectionCheckSolver` |
| Numpad / button grid | `NumberPadSolver`, `KeypadsSolver` |
| Dial / rotational display | `SafetySafeSolver`, `CombinationLockSolver` |
| Audio playback | `MorseCodeSolver`, `ListeningSolver` |
| Game board / grid | `MazeSolver`, `ChessSolver`, `MysticSquareSolver` |
| Symbol picker grid | `KeypadsSolver`, `AdventureGameSolver` |

Match the pattern. Do not invent a new layout for a problem that's already
been solved twice in the codebase.
