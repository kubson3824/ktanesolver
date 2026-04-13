# Bomb Setup Dialog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-scroll bomb setup dialog with a full-screen two-panel layout (left: edgework, right: modules) and fix the AA batteries label misalignment.

**Architecture:** Two CSS-only changes — no logic, no API, no new components. `SetupPage.tsx` gets a new dialog shell and restructured body. `ModuleSelector.tsx` loses its inner height cap. On mobile the panels stack vertically into one scroll container; on desktop each panel scrolls independently.

**Tech Stack:** React, TypeScript, Tailwind CSS, Radix UI Dialog (`@radix-ui/react-dialog` via shadcn)

---

## File Map

| File | Change |
|---|---|
| `ktanesolver-frontend/src/pages/SetupPage.tsx` | Fix batteries grid; resize dialog; split body into two independent panels |
| `ktanesolver-frontend/src/components/ModuleSelector.tsx` | Remove `max-h-96 overflow-y-auto pr-1` from module grid |

---

### Task 1: Fix AA batteries alignment

**Files:**
- Modify: `ktanesolver-frontend/src/pages/SetupPage.tsx:463-512`

The current layout nests AA and D batteries in a 2-col sub-grid inside one column of a 2-col outer grid, so the serial number label and battery labels sit at different DOM levels. Replace both grids with a single flat 3-column grid.

- [ ] **Step 1: Replace the Serial & Batteries grid**

Find this block (starts around line 463):

```tsx
<div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
    <h3 className="text-base font-semibold text-foreground">Serial &amp; Batteries</h3>
    <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 w-full">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Serial number</span>
            <Input
                type="text"
                value={formState.serialNumber}
                onChange={(event) =>
                    setFormState((prev) => ({
                        ...prev,
                        serialNumber: event.target.value.toUpperCase(),
                    }))
                }
                required
            />
        </label>
        <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 w-full">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">AA batteries</span>
                <Input
                    type="number"
                    min={0}
                    step={2}
                    value={formState.aaBatteryCount}
                    onChange={(event) =>
                        setFormState((prev) => ({
                            ...prev,
                            aaBatteryCount: Number(event.target.value),
                        }))
                    }
                />
            </label>
            <label className="flex flex-col gap-1.5 w-full">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">D batteries</span>
                <Input
                    type="number"
                    min={0}
                    value={formState.dBatteryCount}
                    onChange={(event) =>
                        setFormState((prev) => ({
                            ...prev,
                            dBatteryCount: Number(event.target.value),
                        }))
                    }
                />
            </label>
        </div>
    </div>
</div>
```

Replace with:

```tsx
<div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
    <h3 className="text-base font-semibold text-foreground">Serial &amp; Batteries</h3>
    <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5 w-full">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Serial number</span>
            <Input
                type="text"
                value={formState.serialNumber}
                onChange={(event) =>
                    setFormState((prev) => ({
                        ...prev,
                        serialNumber: event.target.value.toUpperCase(),
                    }))
                }
                required
            />
        </label>
        <label className="flex flex-col gap-1.5 w-full">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">AA batteries</span>
            <Input
                type="number"
                min={0}
                step={2}
                value={formState.aaBatteryCount}
                onChange={(event) =>
                    setFormState((prev) => ({
                        ...prev,
                        aaBatteryCount: Number(event.target.value),
                    }))
                }
            />
        </label>
        <label className="flex flex-col gap-1.5 w-full">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">D batteries</span>
            <Input
                type="number"
                min={0}
                value={formState.dBatteryCount}
                onChange={(event) =>
                    setFormState((prev) => ({
                        ...prev,
                        dBatteryCount: Number(event.target.value),
                    }))
                }
            />
        </label>
    </div>
</div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ktanesolver-frontend && npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ktanesolver-frontend && git add src/pages/SetupPage.tsx
git commit -m "fix: flatten serial/batteries grid to align all three labels"
```

---

### Task 2: Restructure dialog to full-screen two-panel layout

**Files:**
- Modify: `ktanesolver-frontend/src/pages/SetupPage.tsx:444-682`

The `DialogContent` default from `dialog.tsx` has `max-w-lg rounded-xl overflow-hidden`. We override those in className. The form body changes from a single scrollable column to a flex row where each panel scrolls independently on desktop and the whole container scrolls on mobile.

- [ ] **Step 1: Replace the DialogContent opening tag**

Find:

```tsx
<DialogContent className="max-h-[90vh] flex flex-col gap-0 p-0">
```

Replace with:

```tsx
<DialogContent className="h-[100dvh] md:h-[90vh] max-w-none md:max-w-6xl md:w-[90vw] flex flex-col gap-0 p-0 rounded-none md:rounded-xl">
```

- [ ] **Step 2: Replace the form body**

Find the entire form body wrapper (the div that contains all sections and the modules section):

```tsx
<div className="overflow-y-auto px-4 sm:px-6 space-y-6 pb-4 pt-4">
    <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Serial &amp; Batteries</h3>
        ...
    </div>

    <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Indicators</h3>
        ...
    </div>

    <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">Port Plates</h3>
            ...
        </div>
        ...
    </div>

    {!isEditing && (
        <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Modules for this bomb</h3>
            <ModuleSelector
                onSelectionChange={handleModuleSelectionChange}
                initialCounts={formState.modules}
            />
        </div>
    )}
</div>
```

Replace with (keep the three inner section divs — Serial & Batteries, Indicators, Port Plates — unchanged inside the left panel):

```tsx
<div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-y-auto md:overflow-hidden">
    {/* Left panel — edgework */}
    <div className={cn(
        "md:overflow-y-auto px-4 sm:px-6 py-4 space-y-6",
        !isEditing && "md:w-2/5 md:border-r md:border-border"
    )}>
        <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Serial &amp; Batteries</h3>
            {/* ← paste the batteries section from Task 1 here, unchanged */}
        </div>

        <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Indicators</h3>
            {/* ← paste the indicators section here, unchanged */}
        </div>

        <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-foreground">Port Plates</h3>
                {/* ← paste the port plates section here, unchanged */}
            </div>
        </div>
    </div>

    {/* Right panel — modules (create mode only) */}
    {!isEditing && (
        <div className="md:overflow-y-auto md:w-3/5 px-4 sm:px-6 py-4 border-t border-border md:border-t-0">
            <div className="rounded-sm border border-border bg-muted/30 p-4 space-y-4">
                <h3 className="text-base font-semibold text-foreground">Modules for this bomb</h3>
                <ModuleSelector
                    onSelectionChange={handleModuleSelectionChange}
                    initialCounts={formState.modules}
                />
            </div>
        </div>
    )}
</div>
```

**Layout behaviour summary:**

| Breakpoint | Container scroll | Left panel | Right panel |
|---|---|---|---|
| Mobile | `overflow-y-auto` (single scroll) | stacks on top, no own scroll | stacks below, `border-t` separator, no own scroll |
| Desktop (`md:`) | `overflow-hidden` | `overflow-y-auto w-2/5 border-r` | `overflow-y-auto w-3/5` |
| Desktop + editing | `overflow-hidden` | `overflow-y-auto` full width | hidden |

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd ktanesolver-frontend && npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ktanesolver-frontend && git add src/pages/SetupPage.tsx
git commit -m "feat: expand bomb setup dialog to full-screen two-panel layout"
```

---

### Task 3: Remove module grid height cap from ModuleSelector

**Files:**
- Modify: `ktanesolver-frontend/src/components/ModuleSelector.tsx:212`

The `max-h-96 overflow-y-auto pr-1` classes were the only scroll boundary for the module grid. Now the right panel is the scroll boundary, so these classes serve no purpose.

- [ ] **Step 1: Remove the cap from the module grid**

Find:

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
```

Replace with:

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ktanesolver-frontend && npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ktanesolver-frontend && git add src/components/ModuleSelector.tsx
git commit -m "fix: remove max-h-96 cap from module grid — panel is now the scroll boundary"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Dialog expands to 90vw × 90vh max-w-6xl | Task 2 Step 1 |
| Left panel: edgework, independently scrollable on desktop | Task 2 Step 2 |
| Right panel: modules, independently scrollable on desktop | Task 2 Step 2 |
| Flat 3-col grid for serial / AA / D batteries | Task 1 |
| max-h-96 removed from module grid | Task 3 |
| Mobile: panels stack vertically, single scroll | Task 2 Step 2 |
| Editing mode: left panel fills full width, no right panel | Task 2 Step 2 |
