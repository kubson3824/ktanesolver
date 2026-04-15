# Alphabet Module Solver — Design Spec

**Date:** 2026-04-16  
**Module:** Alphabet (modded regular)  
**Reference:** https://ktane.timwi.de/HTML/Alphabet.html

---

## Overview

The Alphabet module presents the player with 4 lettered buttons. The goal is to press the buttons in the correct order by spelling words from a fixed 20-word bank, then pressing any remaining buttons alphabetically.

---

## Rules

1. Given 4 available letters, find all words from the word bank that can be formed using those letters (each letter used at most once).
2. Select the longest formable word; on a tie, pick the one that comes first alphabetically.
3. Remove the used letters from the pool and repeat.
4. When no more words can be formed, press the remaining buttons in alphabetical order.

**Word bank (20 entries):**
`JQXZ, QEW, AC, ZNY, TJL, OKBV, DFW, YKQ, LXE, GS, VSI, PQJS, VCN, JR, IRNM, OP, QYDX, HDU, PKD, ARGF`

---

## Architecture

Single-step module — no state persistence needed. One API call returns the full press sequence.

---

## Backend

**Package:** `ktanesolver.module.modded.regular.alphabet`

### `AlphabetInput`
```
record AlphabetInput(List<String> letters) implements ModuleInput
```
- `letters`: exactly 4 single-character uppercase strings

### `AlphabetOutput`
```
record AlphabetOutput(List<String> pressOrder) implements ModuleOutput
```
- `pressOrder`: ordered list of strings representing button press groups.
  - Each entry is either a word from the bank (press those letters in word order) or a single remaining letter.
  - Example: letters [A, C, G, S] → `["AC", "GS"]`
  - Example: letters [A, B, C, D] → `["AC", "B", "D"]`

### `AlphabetSolver`
- Annotation: `@Service @ModuleInfo(type = ALPHABET, id = "alphabet", name = "Alphabet", category = MODDED_REGULAR, ...)`
- Algorithm:
  1. Normalize input letters to uppercase; copy into mutable list
  2. Loop: find all bank words formable from remaining letters
  3. Sort candidates by length desc, then alphabetically asc; pick first
  4. Add winner to `pressOrder`, remove its letters from pool
  5. When no candidates remain, sort remaining letters alphabetically and add each as individual entry
  6. Return `success(new AlphabetOutput(pressOrder))`

---

## Frontend

### `alphabetService.ts` (`src/services/`)
```ts
interface AlphabetSolveRequest { input: { letters: string[] } }
interface AlphabetSolveResponse { output: { pressOrder: string[] } }
export const solveAlphabet = async (...): Promise<AlphabetSolveResponse>
```
Standard `api.post` with `withErrorWrapping`.

### `AlphabetSolver.tsx` (`src/components/solvers/`)
- **Input:** 4 individual letter input boxes (auto-uppercase, max 1 char each, auto-advance focus)
- **State:** `letters[4]`, `result`, `twitchCommand`, plus `useSolver()` hook state
- **On solve:** calls `solveAlphabet`, displays result, marks module solved, generates twitch command
- **Result display:** ordered list of press-step badges (e.g. `AC` → `GS`)
- **Twitch command:** `!<placeholder> alphabet AC GS`
- **Reset:** clears all inputs and result

### `ModuleType` enum addition (`src/types/index.ts`)
```ts
ALPHABET = "ALPHABET"
```

### Twitch command (`src/utils/twitchCommands.ts`)
```ts
case ModuleType.ALPHABET:
  return `!${TWITCH_PLACEHOLDER} alphabet ${getStringArray(raw.pressOrder)?.join(' ')}`;
```

---

## Error Handling

- Validate that exactly 4 single letters are provided (backend returns `failure(...)` otherwise)
- Frontend disables solve button until all 4 inputs are filled

---

## Testing

- Backend unit tests for the greedy algorithm: all-words-formable, tie-breaking by length, tie-breaking alphabetically, remaining letters sorted, no valid words case
- No state persistence needed — no multi-step test cases
