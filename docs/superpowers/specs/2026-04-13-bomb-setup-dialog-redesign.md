# Bomb Setup Dialog Redesign

**Date:** 2026-04-13  
**Status:** Approved

## Problem

The "New Bomb Setup" dialog has two bugs:

1. **AA batteries misalignment** — The Serial & Batteries section uses a 2-col grid where the serial number occupies col 1 and both battery fields share col 2 in a nested 2-col sub-grid. The "AA batteries" label (longer text) can push its input lower than the D batteries input, creating visible misalignment.

2. **Module list overflow** — The module grid has `max-h-96 overflow-y-auto` nested inside a dialog that already has `max-h-[90vh] overflow-y-auto`. With many modules, double-nested scroll containers produce a broken layout.

## Chosen Approach: Full-screen two-panel split (Approach B)

Edgework and module selection are different concerns in terms of size and interaction. Splitting them side-by-side gives each its own scroll boundary and eliminates the overflow conflict.

## Design

### Dialog shell

- Size: `90vw × 90vh`, capped at `max-w-6xl`
- A single sticky header spans full width: title ("New Bomb Setup" / "Edgework Adjustments") + Close button
- A single sticky footer spans full width: Save / Cancel buttons
- Body between header and footer is a flex row (`flex-row`) split into two panels

### Left panel — Edgework (~40% width)

- Independently scrollable (`overflow-y-auto h-full`)
- Contains: Serial & Batteries, Indicators, Port Plates sections (unchanged content)
- **Batteries layout fix**: change the current nested-grid to a flat 3-column grid — `[Serial Number | AA Batteries | D Batteries]` — so all three labels and inputs align at the same vertical level

### Right panel — Modules (~60% width)

- Independently scrollable (`overflow-y-auto h-full`)
- Renders `ModuleSelector` unchanged, except the `max-h-96` cap on its inner module grid is removed — the panel is the scroll boundary now
- Only shown when `!isEditing` (editing mode only changes edgework, not modules)
- When editing, the left panel expands to fill the full dialog width

### Mobile (below `md` breakpoint)

- Dialog expands to `100vw × 100dvh`
- Panels stack vertically: edgework on top, modules below
- Both sections are part of one scroll container (no independent panel scroll on mobile)

## Files changed

| File | Change |
|---|---|
| `ktanesolver-frontend/src/pages/SetupPage.tsx` | Resize dialog, restructure body into two-panel flex layout, fix batteries grid |
| `ktanesolver-frontend/src/components/ModuleSelector.tsx` | Remove `max-h-96` from module grid |

## Out of scope

- No changes to form logic, validation, or API calls
- No changes to the separate "Add modules" drawer (module injection panel)
- No changes to `ModuleSelector` filtering/sorting/selection logic
