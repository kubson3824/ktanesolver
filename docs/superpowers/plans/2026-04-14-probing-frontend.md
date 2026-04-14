# Probing Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete frontend solver for the Probing KTANE module — frequency toggles for 6 wires, API call, result showing red/blue clip wire assignments.

**Architecture:** Follows the standard solver pattern: TypeScript enum entry → service → component → registry. The component uses `useSolver` + `useSolverModulePersistence` hooks for state/persistence, and 4 toggle buttons per wire row for frequency input (10, 22, 50, 60 Hz).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Zustand, Vitest

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `ktanesolver-frontend/src/types/index.ts` | Add `PROBING = "PROBING"` to `ModuleType` enum |
| Create | `ktanesolver-frontend/src/services/probingService.ts` | API types + `solveProbing` function |
| Create | `ktanesolver-frontend/src/components/solvers/ProbingSolver.tsx` | Solver UI component |
| Modify | `ktanesolver-frontend/src/components/solvers/registry.ts` | Register `PROBING` entry |
| Modify | `ktanesolver-frontend/src/utils/twitchCommands.ts` | Add `PROBING` Twitch command case |
| Modify | `ktanesolver-frontend/src/components/solvers/registry.test.ts` | Add registry presence test |

---

### Task 1: Add PROBING to the TypeScript ModuleType enum

**Files:**
- Modify: `ktanesolver-frontend/src/types/index.ts`

- [ ] **Step 1: Add the enum value**

Open `ktanesolver-frontend/src/types/index.ts`. The enum currently ends with `LAUNDRY = "LAUNDRY"`. Add `PROBING` after it:

```ts
  LAUNDRY = "LAUNDRY",
  PROBING = "PROBING",
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ktanesolver-frontend
npm run build 2>&1 | head -20
```

Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
git add ktanesolver-frontend/src/types/index.ts
git commit -m "feat: add PROBING to ModuleType enum"
```

---

### Task 2: Create probingService.ts

**Files:**
- Create: `ktanesolver-frontend/src/services/probingService.ts`

- [ ] **Step 1: Create the service file**

```ts
import { api, withErrorWrapping } from "../lib/api";

export interface ProbingOutput {
  redClipWire: number;
  blueClipWire: number;
  redClipCandidates: number[];
  blueClipCandidates: number[];
  redTargetFrequency: number;
  blueTargetFrequency: number;
  instruction: string;
}

export interface ProbingSolveResponse {
  output: ProbingOutput;
  solved?: boolean;
}

export const PROBING_FREQUENCIES = [10, 22, 50, 60] as const;
export type ProbingFrequency = (typeof PROBING_FREQUENCIES)[number];

export const solveProbing = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  missingFrequenciesByWire: number[],
): Promise<ProbingSolveResponse> => {
  return withErrorWrapping(async () => {
    const response = await api.post<ProbingSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input: { missingFrequenciesByWire } },
    );
    return response.data;
  });
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ktanesolver-frontend
npm run build 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add ktanesolver-frontend/src/services/probingService.ts
git commit -m "feat: add probingService"
```

---

### Task 3: Create ProbingSolver.tsx

**Files:**
- Create: `ktanesolver-frontend/src/components/solvers/ProbingSolver.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import {
  solveProbing,
  type ProbingOutput,
  type ProbingFrequency,
  PROBING_FREQUENCIES,
} from "../../services/probingService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { useRoundStore } from "../../store/useRoundStore";

interface ProbingSolverProps {
  bomb: BombEntity | null | undefined;
}

const WIRE_COUNT = 6;

export default function ProbingSolver({ bomb }: ProbingSolverProps) {
  const [frequencies, setFrequencies] = useState<(ProbingFrequency | null)[]>(
    Array(WIRE_COUNT).fill(null),
  );
  const [result, setResult] = useState<ProbingOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ frequencies, result, twitchCommand }),
    [frequencies, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      frequencies?: (ProbingFrequency | null)[];
      result?: ProbingOutput | null;
      twitchCommand?: string;
    }) => {
      if (state.frequencies && Array.isArray(state.frequencies))
        setFrequencies(state.frequencies);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: ProbingOutput) => {
    setResult(solution);
    setTwitchCommand(
      generateTwitchCommand({ moduleType: ModuleType.PROBING, result: solution }),
    );
  }, []);

  useSolverModulePersistence<
    { frequencies: (ProbingFrequency | null)[]; result: ProbingOutput | null; twitchCommand: string },
    ProbingOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const v = raw as Partial<ProbingOutput>;
      if (
        typeof v.redClipWire === "number" &&
        typeof v.blueClipWire === "number" &&
        typeof v.instruction === "string"
      ) {
        return raw as ProbingOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) =>
      Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    if (frequencies.some((f) => f === null)) {
      setError("Select a frequency for every wire.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveProbing(
        round.id,
        bomb.id,
        currentModule.id,
        frequencies as number[],
      );
      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.PROBING,
        result: output,
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { frequencies, result: output, twitchCommand: command },
        output,
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFrequencies(Array(WIRE_COUNT).fill(null));
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const setWireFrequency = (wireIndex: number, freq: ProbingFrequency) => {
    setFrequencies((prev) => {
      const next = [...prev];
      next[wireIndex] = freq;
      return next;
    });
    if (isSolved) resetSolverState();
  };

  const allSelected = frequencies.every((f) => f !== null);

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100 space-y-3">
        {Array.from({ length: WIRE_COUNT }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 w-12 shrink-0 uppercase tracking-wide">
              Wire {i + 1}
            </span>
            <div className="flex gap-1 flex-wrap">
              {PROBING_FREQUENCIES.map((freq) => {
                const selected = frequencies[i] === freq;
                return (
                  <button
                    key={freq}
                    onClick={() => setWireFrequency(i, freq)}
                    disabled={isSolved}
                    className={`px-3 py-1 rounded text-sm font-mono font-medium transition-colors ${
                      selected
                        ? "bg-sky-500 text-white"
                        : "bg-neutral-600 text-neutral-300 hover:bg-neutral-500"
                    }`}
                  >
                    {freq}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className="mt-4 rounded-xl border-2 border-neutral-600 bg-neutral-800/80 p-5 space-y-3">
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span className="text-sm text-neutral-200">
                Red clip → <span className="font-bold text-red-300">Wire {result.redClipWire}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <span className="text-sm text-neutral-200">
                Blue clip → <span className="font-bold text-blue-300">Wire {result.blueClipWire}</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-400">{result.instruction}</p>

          {result.redClipCandidates.length > 1 && (
            <p className="text-xs text-neutral-500">
              Other red candidates:{" "}
              {result.redClipCandidates
                .filter((w) => w !== result.redClipWire)
                .join(", ")}
            </p>
          )}
          {result.blueClipCandidates.length > 1 && (
            <p className="text-xs text-neutral-500">
              Other blue candidates:{" "}
              {result.blueClipCandidates
                .filter((w) => w !== result.blueClipWire)
                .join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="mt-4">
        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isSolveDisabled={!allSelected}
          isLoading={isLoading}
          isSolved={isSolved}
          solveText="Solve"
        />
      </div>

      <ErrorAlert error={error} />
      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ktanesolver-frontend
npm run build 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add ktanesolver-frontend/src/components/solvers/ProbingSolver.tsx
git commit -m "feat: add ProbingSolver component"
```

---

### Task 4: Register solver, add Twitch command, add test

**Files:**
- Modify: `ktanesolver-frontend/src/components/solvers/registry.ts`
- Modify: `ktanesolver-frontend/src/utils/twitchCommands.ts`
- Modify: `ktanesolver-frontend/src/components/solvers/registry.test.ts`

- [ ] **Step 1: Write the failing test first**

In `ktanesolver-frontend/src/components/solvers/registry.test.ts`, add this test inside the `describe("solver registry", ...)` block after the Laundry test:

```ts
  it("registers the Probing solver in the shared registry", () => {
    expect(getLazySolver(ModuleType.PROBING)).not.toBeNull();
  });
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd ktanesolver-frontend
npx vitest run src/components/solvers/registry.test.ts 2>&1 | tail -20
```

Expected: FAIL — `getLazySolver(ModuleType.PROBING)` returns `undefined` (and `ModuleType.PROBING` may be a type error until Task 1 is done, but Task 1 is already committed by now so it compiles).

- [ ] **Step 3: Register the solver in registry.ts**

In `ktanesolver-frontend/src/components/solvers/registry.ts`, add after the Laundry line:

```ts
  [ModuleType.LAUNDRY]: { load: () => import("./LaundrySolver") },
  [ModuleType.PROBING]: { load: () => import("./ProbingSolver") },
```

- [ ] **Step 4: Add PROBING case to twitchCommands.ts**

In `ktanesolver-frontend/src/utils/twitchCommands.ts`, inside the `switch (moduleType)` block (e.g. after the LAUNDRY case or at the end before the `default`):

```ts
    case ModuleType.PROBING: {
      const r = raw as { redClipWire?: number; blueClipWire?: number };
      if (typeof r.redClipWire === "number" && typeof r.blueClipWire === "number") {
        return `!${TWITCH_PLACEHOLDER} probing red ${r.redClipWire} blue ${r.blueClipWire}`;
      }
      return "";
    }
```

- [ ] **Step 5: Run the test to confirm it passes**

```bash
cd ktanesolver-frontend
npx vitest run src/components/solvers/registry.test.ts 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 6: Full build check**

```bash
cd ktanesolver-frontend
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add ktanesolver-frontend/src/components/solvers/registry.ts \
        ktanesolver-frontend/src/utils/twitchCommands.ts \
        ktanesolver-frontend/src/components/solvers/registry.test.ts
git commit -m "feat: register ProbingSolver and add Twitch command"
```
