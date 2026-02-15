# Solver Schema Updates

This document tracks which module solvers have been updated to follow the new schema defined in `implementing-new-module-solver.md`.

## Schema Requirements

The new schema requires solvers to:
- Use the `useSolver` hook for shared state management
- Use `SolverLayout` as the main wrapper component
- Use common UI components:
  - `BombInfoDisplay` for bomb information
  - `SolverControls` for solve/reset buttons
  - `ErrorAlert` for error display
  - `TwitchCommandDisplay` for Twitch commands
- Implement state persistence by saving input state to `currentModule.state`
- Restore state from `currentModule.state` and `currentModule.solution` on load

## Updated Solvers

### ✅ WireSolver
- **Status**: Already compliant with the schema
- **File**: `src/components/solvers/WireSolver.tsx`
- **Notes**: Used as the reference implementation

### ✅ ComplicatedWiresSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/ComplicatedWiresSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for wires and wire count
  - Added solution restoration logic

### ✅ ButtonSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/ButtonSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for button color, label, strip color
  - Added solution restoration logic

### ✅ KeypadsSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/KeypadsSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for selected symbols
  - Added solution restoration logic

### ✅ MazeSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/MazeSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for maze location and offsets
  - Added solution restoration logic

### ✅ MemorySolver
- **Status**: Fully updated
- **File**: `src/components/solvers/MemorySolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for display numbers and button labels
  - Added solution restoration logic

### ✅ MorseCodeSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/MorseCodeSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for morse code frequency
  - Added solution restoration logic

### ✅ PasswordSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/PasswordSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for password columns and selected letters
  - Added solution restoration logic

### ✅ SimonSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/SimonSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for simon says and strikes
  - Added solution restoration logic

### ✅ WhosOnFirstSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/WhosOnFirstSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for display word
  - Added solution restoration logic

### ✅ WireSequencesSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/WireSequencesSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for wire sequences
  - Added solution restoration logic

### ✅ ColorFlashSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/ColorFlashSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for color sequences
  - Added solution restoration logic

### ✅ PianoKeysSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/PianoKeysSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for piano key states
  - Added solution restoration logic

### ✅ SemaphoreSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/SemaphoreSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for semaphore positions
  - Added solution restoration logic

### ✅ MathSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/MathSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for equation
  - Added solution restoration logic

### ✅ EmojiMathSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/EmojiMathSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for emoji equation
  - Added solution restoration logic

### ✅ SwitchesSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/SwitchesSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for switch positions and LED positions
  - Added solution restoration logic

### ✅ TwoBitsSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/TwoBitsSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for current stage and input number
  - Added solution restoration logic

### ✅ WordScrambleSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/WordScrambleSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for letters input
  - Added solution restoration logic

### ✅ AnagramsSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/AnagramsSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for display word
  - Added solution restoration logic

### ✅ CombinationLockSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/CombinationLockSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state restoration logic
  - Note: State persistence not implemented (no inputs to save)

### ✅ RoundKeypadSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/RoundKeypadSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for selected symbols
  - Added solution restoration logic

### ✅ ListeningSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/ListeningSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for sound selection and custom sound
  - Added solution restoration logic

### ✅ ForeignExchangeSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/ForeignExchangeSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for currency inputs and LED status
  - Added solution restoration logic

### ✅ OrientationCubeSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/OrientationCubeSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for face selections
  - Added solution restoration logic

### ✅ MorsematicsSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/MorsematicsSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for letter inputs
  - Added solution restoration logic

### ✅ ForgetMeNotSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/ForgetMeNotSolver.tsx`
- **Changes Made**:
  - Replaced `useSolverState` with `useSolver` hook
  - Added `isSolved` state management
  - Updated solve completion logic to set `isSolved`
  - Already using other common components

### ✅ ConnectionCheckSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/ConnectionCheckSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for wire pairs
  - Added solution restoration logic

### ✅ KnobsSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/KnobsSolver.tsx`
- **Changes Made**:
  - Complete rewrite to follow the schema
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Added `BombInfoDisplay`, `SolverControls`, `ErrorAlert`, `TwitchCommandDisplay`
  - Added state persistence for indicator selections
  - Added solution restoration logic
  - Updated component props to match schema

### ✅ LetterKeysSolver
- **Status**: Fully updated
- **File**: `src/components/solvers/LetterKeysSolver.tsx`
- **Changes Made**:
  - Replaced manual state with `useSolver` hook
  - Wrapped UI in `SolverLayout`
  - Replaced custom bomb info with `BombInfoDisplay`
  - Replaced custom controls with `SolverControls`
  - Replaced custom error display with `ErrorAlert`
  - Replaced custom Twitch command display with `TwitchCommandDisplay`
  - Added state persistence for number input
  - Added solution restoration logic

## Remaining Solvers

The following solvers still need to be updated (2 remaining):

1. ~~ConnectionCheckSolver~~ ✅
2. ~~KnobSolver~~ ✅ (now KnobsSolver)
3. VentGasSolver - Not implemented (placeholder only)

Note: 
- NavigationSolver does not exist and has been removed from the list.
- CapacitorDischargeSolver is not implemented (placeholder only).
- VentGasSolver is not implemented (placeholder only).

## Update Pattern

For each remaining solver, the following changes need to be applied:

1. **Import Updates**:
   ```tsx
   import { useState, useEffect } from "react";
   import { 
     useSolver,
     SolverLayout,
     ErrorAlert,
     TwitchCommandDisplay,
     BombInfoDisplay,
     SolverControls
   } from "../common";
   ```

2. **State Management**:
   - Replace manual state variables with `useSolver` hook
   - Keep module-specific state variables

3. **State Restoration**:
   ```tsx
   useEffect(() => {
     // Restore state from currentModule.state
     // Restore solution from currentModule.solution
   }, [currentModule, moduleNumber, setIsSolved]);
   ```

4. **State Persistence**:
   - Create `saveState()` function to update `currentModule.state`
   - Call `saveState()` when inputs change

5. **UI Updates**:
   - Replace `ModuleNumberInput` with `SolverLayout`
   - Replace custom bomb info with `BombInfoDisplay`
   - Replace custom controls with `SolverControls`
   - Replace custom error with `ErrorAlert`
   - Replace custom Twitch commands with `TwitchCommandDisplay`

6. **Function Updates**:
   - Use `clearError()` instead of `setError("")`
   - Use `resetSolverState()` in reset function

## Java Backend vs Frontend State/Solution Alignment

When the round is loaded from the API (e.g. after refresh), each module’s `state` and `solution` come from the Java backend. The frontend must restore from those shapes.

### How the backend stores data

- **Solution**: After a successful solve, `AbstractModuleSolver.handleSuccess` converts the output record to a `Map` and merges it into `module.getSolution()`. So `module.solution` in the API is the **flat output DTO** (e.g. Button: `{ hold, instruction, releaseDigit }`, Memory: `{ position, label }`). There is no `"output"` wrapper.
- **State**: Either:
  - **Key-value**: `storeState(module, "key", value)` → `module.state = { key: value, ... }`, or
  - **Full object**: `module.setState(object)` → `module.state = { displayHistory, solutionHistory }` (e.g. Memory, ForgetMeNot).

### Solve API response

The solve endpoint returns `SolveSuccess<O>` serialized as `{ output: O, solved: boolean }`. The frontend uses `response.data.output` when handling the solve call. That same output shape is what gets stored in `module.solution` on the backend; when the frontend later loads the module from the round, `currentModule.solution` is that flat map, not `{ output: ... }`.

### Frontend restoration requirements

- **extractSolution(raw)**: `raw` is `currentModule.solution`, i.e. the flat output map. Handlers should:
  1. Optionally accept a wrapped shape (e.g. `raw.output`) for compatibility.
  2. **Accept the flat shape** when the backend stores it (e.g. `raw.position` and `raw.label` for Memory, `raw.letter` for LetterKeys). Many solvers already do this with a final `return raw as T` or an explicit check for the output fields.
- **onRestoreState(state)**: `state` is `currentModule.state`. Keys must match what the backend stores (e.g. Button: `color`, `label`, `stripColor`; modules using `storeState(module, "input", input)` use `state.input` with the same structure as the solve request input).

### Per-module notes

| Module | Backend state keys / shape | Backend solution (output) | Frontend restoration |
|--------|----------------------------|---------------------------|----------------------|
| Button | `color`, `label`, `stripColor` | `hold`, `instruction`, `releaseDigit` | ✅ State: accepts `color`/`label`/`stripColor` (and legacy names). Solution: accepts flat and wrapped. |
| Memory | `setState(MemoryState)` → `displayHistory`, `solutionHistory` | `position`, `label` | ✅ Solution: fixed to accept flat `{ position, label }`. State: frontend expects `currentStage`, `stageHistory`, etc.; backend stores `displayHistory`/`solutionHistory` — different shape (state restore from API not fully aligned). |
| LetterKeys | (none) | `letter` | ✅ extractSolution accepts `raw.letter`. |
| Simon Says | `input` | `presses` (list) | Frontend should accept `raw.presses` / flat object. |
| Complicated Wires | `input` | `cutWires` (list) | Frontend should accept `raw.cutWires` or raw as list. |
| Piano Keys | `input` | `notes` (list) | Frontend accepts `raw` with `notes`. |
| WhosOnFirst | `storeTypedState(WhosOnFirstState)` (displayHistory, buttonHistory, buttonPressHistory) | `position`, `buttonText` | Solution: backend stores `{ position, buttonText }`; frontend currently expects `output`/`finalStage` or number — restoration from API may not apply. |
| Others | Various `storeState("input", input)` or specific keys | Same as output record fields | Each solver’s `extractSolution` should handle flat `raw` (and optionally `raw.output`). |

### Fix applied

- **MemorySolver**: `extractSolution` now treats flat `{ position, label }` (as stored by the backend) as the solution, so restoring from the bomb/round works after refresh.

## Last Updated

Date: January 22, 2026
Updated by: Assistant
Total Updated: 27/32 solvers (5 not implemented)

## Update Summary

- **High Priority**: 10/10 completed ✅
- **Medium Priority**: 17/16 completed ✅ (all done!)
- **Low Priority**: 0/6 completed ⏳

Recently Completed (Jan 22, 2026):
- ✅ CombinationLockSolver
- ✅ RoundKeypadSolver
- ✅ ListeningSolver
- ✅ ForeignExchangeSolver
- ✅ OrientationCubeSolver
- ✅ MorsematicsSolver
- ✅ ConnectionCheckSolver
- ✅ KnobsSolver
- ✅ LetterKeysSolver
- ✅ ForgetMeNotSolver
- ✅ AnagramsSolver

Remaining (not implemented):
- ⏳ VentGasSolver (placeholder)
- ⏳ CapacitorDischargeSolver (placeholder)
- ⏳ 4 other low priority modules (not yet created)
