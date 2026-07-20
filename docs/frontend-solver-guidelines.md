# Frontend solver guidelines

Solver components share one visual language and one persistence model. Reuse the common primitives instead of creating module-specific cards and state machinery.

## Required layout

```tsx
<SolverLayout>
  <SolverSection title="Display" description="Enter the visible value">
    {/* inputs */}
  </SolverSection>

  <SolverControls
    onSolve={handleSolve}
    onReset={reset}
    isSolveDisabled={isSolveDisabled}
    isLoading={isLoading}
    isSolved={isSolved}
  />

  <ErrorAlert error={error} />
  {result && <SolverResult variant="success" title="Action" description={result} />}
  {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
  <SolverInstructions>Short module-specific hint.</SolverInstructions>
</SolverLayout>
```

Keep this order: inputs, controls, error, result, Twitch command, instructions.

## Shared primitives

Import these from `src/components/common/`:

| Primitive | Use |
|---|---|
| `SolverLayout` | Outer vertical spacing |
| `SolverSection` | Titled input or stage card |
| `SolverControls` | Standard Solve and Reset actions |
| `SolverResult` | Success, information, warning, or error callout |
| `ErrorAlert` | Request or validation error |
| `TwitchCommandDisplay` | Copyable command or command sequence |
| `SolverInstructions` | Final muted hint |
| `SegmentedControl` | Small enumerated choice |
| `StageIndicator` | Multi-stage progress |
| `ColorSwatchPicker` | Accessible color selection |

Do not add custom outer cards or reintroduce removed card primitives.

## State and persistence

Use `useSolver()` for loading, errors, solved state, reset behavior, current context, and completion helpers.

Use `useSolverModulePersistence()` when state or a solution must survive module changes and refreshes.

Rules that prevent the common bugs:

1. Keep service inputs wrapped in `{ input: ... }` by using `solveModule`.
2. Clear stale output when a user changes an input.
3. Call the shared `resetSolverState()` after clearing local fields.
4. Restore both legacy and current backend state shapes when an existing solver already supports them.
5. Extract solutions from both nested `output` and flat persisted shapes where required.
6. Build Twitch commands when solving and when restoring a solution.
7. Use `updateModuleAfterSolve` only for multi-stage modules that need immediate local state merging.

{% hint style="warning" %}
A calculated final answer is not the same as physical completion. Do not mark the persisted module solved until the defuser confirms the game accepted the action.
{% endhint %}

## Inputs and actions

- Use the shared `Input` and `Button` components for ordinary controls.
- Use `cn()` from `src/lib/cn.ts` for conditional class names.
- Use `lucide-react` icons; inline SVG is reserved for genuinely module-specific visuals.
- Raw buttons are acceptable for purpose-built widgets such as swatches or keypad cells, but they still need shared design tokens and accessible state.
- Put compact secondary controls in `SolverSection.actions`; keep Solve and Reset in `SolverControls`.

## Color and result semantics

Use design tokens for neutral chrome and Tailwind semantic palettes for meaning.

| Meaning | Palette or variant |
|---|---|
| Neutral surfaces and borders | `card`, `muted`, `background`, `border`, `ring` tokens |
| Success or completed action | `emerald-*`, `SolverResult success` |
| Warning or “do nothing” | `amber-*`, `SolverResult warning` |
| Error or destructive action | `red-*`, `ErrorAlert` |
| Current stage or information | `blue-*`, `SolverResult info` |

Do not use daisyUI tokens such as `bg-info`, `text-success`, or `bg-base-200`.

## Responsive layout

- Let `SolverLayout` space sections; avoid section-level `mt-*` and `mb-*` margins.
- Use `gap-2` for tight controls, `gap-3` for form rows, and `gap-4` for logical groups.
- Prefer responsive grids such as `grid-cols-2 sm:grid-cols-4`.
- Test below `400px` width. No horizontal scrolling or one-word-per-line labels.

## Accessibility

- Give every icon-only button an `aria-label`.
- Give every `SegmentedControl` an `ariaLabel`.
- Use `aria-pressed` for toggle buttons.
- Use existing `StageIndicator` and `SolverResult` live-region behavior.
- Preserve visible focus states and keyboard operation on custom widgets.

## Component shape

Keep a solver file in this order:

1. imports;
2. props and local types;
3. constants and pure helpers;
4. component state and shared hooks;
5. restore callbacks and persistence hook;
6. input handlers;
7. solve and reset handlers;
8. derived render values;
9. JSX in the required layout.

Local visual helpers can remain in the same file. Split them out only when another solver reuses them.

## Twitch commands

Generate commands through `generateTwitchCommand({ moduleType, result })`. Do not hand-build command strings inside components.

Pass multi-step commands as `string[]`. Only keep a combined string when the receiving module intentionally accepts a bundled command.

## Before committing

```bash
cd ktanesolver-frontend
npm run test
npm run build
npm run lint
```

Also verify:

- Solve then Reset clears results and errors.
- Refresh restores multi-stage input and output.
- The module appears in the expected regular or needy area.
- The UI remains usable below `400px`.
- Every icon-only or toggle control has an accessible name and state.
