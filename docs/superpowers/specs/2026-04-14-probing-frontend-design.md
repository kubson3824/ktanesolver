# Probing Module Frontend Design

**Date:** 2026-04-14  
**Module:** Probing (modded regular)  
**Backend:** Already implemented — `ProbingSolver`, `ProbingInput`, `ProbingOutput`

---

## Overview

Add the frontend solver for the Probing KTANE module. The user enters the missing frequency for each of the 6 wires, submits, and the solver returns which wire to attach the red clip and which to attach the blue clip.

---

## Input Model

`ProbingInput` sends `{ input: { missingFrequenciesByWire: number[] } }` — a list of exactly 6 integers, each one of: `10`, `22`, `50`, `60`.

`ProbingOutput` returns:
- `redClipWire: number` — 1-based wire index for red clip
- `blueClipWire: number` — 1-based wire index for blue clip
- `redClipCandidates: number[]` — all wires that matched the red target frequency
- `blueClipCandidates: number[]` — all wires that matched the blue target frequency
- `redTargetFrequency: number`
- `blueTargetFrequency: number`
- `instruction: string` — full instruction text from backend

---

## UI Design

### Wire Input

A dark card panel with 6 rows. Each row:
- Label: "Wire 1" through "Wire 6"
- 4 toggle buttons: `10`, `22`, `50`, `60` (Hz)
- Selecting one deselects the others; initial state is unselected (null)

Solve button is disabled until all 6 wires have a frequency selected.

### Result Display

On success, a result card showing:
- **Red clip → Wire N** (red-tinted)
- **Blue clip → Wire N** (blue-tinted)
- Instruction text (e.g. "Leave both connected for at least 6 seconds.")
- If `redClipCandidates.length > 1`: small note "Other red candidates: X, Y"
- If `blueClipCandidates.length > 1`: small note "Other blue candidates: X, Y"

### Twitch Command

Format: `!number probing red N blue M`  
Added as a new case in `twitchCommands.ts`.

---

## Files

| Action | File |
|--------|------|
| Edit | `ktanesolver-frontend/src/types/index.ts` — add `PROBING = "PROBING"` |
| Create | `ktanesolver-frontend/src/services/probingService.ts` |
| Create | `ktanesolver-frontend/src/components/solvers/ProbingSolver.tsx` |
| Edit | `ktanesolver-frontend/src/components/solvers/registry.ts` — register entry |
| Edit | `ktanesolver-frontend/src/utils/twitchCommands.ts` — add PROBING case |

---

## State

```ts
frequencies: (number | null)[]   // length 6, null = not yet selected
result: ProbingOutput | null
twitchCommand: string
// plus standard: isLoading, error, isSolved
```

Module persistence follows the same pattern as other solvers (`useSolverModulePersistence`).
