# Alphabet Module Solver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full-stack solver for the Alphabet modded module — backend greedy-word solver + React frontend with 4 letter inputs.

**Architecture:** Backend computes the full press order in one shot using a greedy algorithm over a fixed 20-word bank (longest formable word first, alphabetically first on ties, remaining letters alphabetically). No state persistence needed. Frontend renders 4 individual letter inputs and displays the ordered press sequence as badges.

**Tech Stack:** Java 21 records, Spring Boot `@Service` + `@ModuleInfo`, JUnit 5 + AssertJ; React 18, TypeScript, Zustand, existing `useSolver` / `useSolverModulePersistence` hooks.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `src/main/java/ktanesolver/enums/ModuleType.java` |
| Create | `src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetInput.java` |
| Create | `src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetOutput.java` |
| Create | `src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetSolver.java` |
| Create | `src/test/java/ktanesolver/module/modded/regular/alphabet/AlphabetSolverTest.java` |
| Modify | `ktanesolver-frontend/src/types/index.ts` |
| Create | `ktanesolver-frontend/src/services/alphabetService.ts` |
| Modify | `ktanesolver-frontend/src/utils/twitchCommands.ts` |
| Create | `ktanesolver-frontend/src/components/solvers/AlphabetSolver.tsx` |

---

## Task 1: Backend data types and enum entry

**Files:**
- Modify: `src/main/java/ktanesolver/enums/ModuleType.java`
- Create: `src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetInput.java`
- Create: `src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetOutput.java`

- [ ] **Step 1: Add `ALPHABET` to the `ModuleType` enum**

In `src/main/java/ktanesolver/enums/ModuleType.java`, append `ALPHABET(false)` at the end of the enum values list (before the semicolon), after `PROBING(false)`:

```java
WIRES(false), BUTTON(false), /* … existing values … */ PROBING(false), ALPHABET(false);
```

- [ ] **Step 2: Create `AlphabetInput`**

Create `src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetInput.java`:

```java
package ktanesolver.module.modded.regular.alphabet;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record AlphabetInput(List<String> letters) implements ModuleInput {
}
```

- [ ] **Step 3: Create `AlphabetOutput`**

Create `src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetOutput.java`:

```java
package ktanesolver.module.modded.regular.alphabet;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record AlphabetOutput(List<String> pressOrder) implements ModuleOutput {
}
```

- [ ] **Step 4: Compile to verify**

Run: `./gradlew compileJava`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/ktanesolver/enums/ModuleType.java \
        src/main/java/ktanesolver/module/modded/regular/alphabet/
git commit -m "feat: add AlphabetInput, AlphabetOutput, and ALPHABET enum entry"
```

---

## Task 2: Backend solver (TDD)

**Files:**
- Create: `src/test/java/ktanesolver/module/modded/regular/alphabet/AlphabetSolverTest.java`
- Create: `src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetSolver.java`

- [ ] **Step 1: Write the failing test file**

Create `src/test/java/ktanesolver/module/modded/regular/alphabet/AlphabetSolverTest.java`:

```java
package ktanesolver.module.modded.regular.alphabet;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class AlphabetSolverTest {

    private final AlphabetSolver solver = new AlphabetSolver();

    @Test
    void catalogUsesAlphabetMetadata() {
        ModuleInfo info = AlphabetSolver.class.getAnnotation(ModuleInfo.class);

        assertThat(info).isNotNull();
        assertThat(info.name()).isEqualTo("Alphabet");
        assertThat(info.type()).isEqualTo(ModuleType.ALPHABET);
    }

    @Test
    void spellsOneWordWhenAllFourLettersFitABankEntry() {
        AlphabetOutput output = solve(List.of("A", "R", "G", "F"));

        assertThat(output.pressOrder()).containsExactly("ARGF");
    }

    @Test
    void spellsTwoWordsWhenLettersSplitAcrossTwoEntries() {
        AlphabetOutput output = solve(List.of("A", "C", "G", "S"));

        assertThat(output.pressOrder()).containsExactly("AC", "GS");
    }

    @Test
    void tieBreaksToAlphabeticallyFirstWordAmongSameLength() {
        // JR and OP are both 2-letter bank words; JR < OP alphabetically
        AlphabetOutput output = solve(List.of("J", "R", "O", "P"));

        assertThat(output.pressOrder()).containsExactly("JR", "OP");
    }

    @Test
    void pressesRemainingLettersAlphabeticallyWhenNoWordCanBeFormed() {
        AlphabetOutput output = solve(List.of("B", "E", "H", "X"));

        assertThat(output.pressOrder()).containsExactly("B", "E", "H", "X");
    }

    @Test
    void spellsWordThenPressesRemainingLettersAlphabetically() {
        // GS is a bank word; B and Z remain
        AlphabetOutput output = solve(List.of("G", "S", "B", "Z"));

        assertThat(output.pressOrder()).containsExactly("GS", "B", "Z");
    }

    @Test
    void failsWhenInputDoesNotContainExactlyFourLetters() {
        ModuleEntity module = module();
        SolveResult<AlphabetOutput> result = solver.solve(
            new RoundEntity(), new BombEntity(), module,
            new AlphabetInput(List.of("A", "B"))
        );

        assertThat(result).isInstanceOf(SolveFailure.class);
        assertThat(((SolveFailure<AlphabetOutput>) result).getReason())
            .isEqualTo("Alphabet requires exactly 4 letters");
        assertThat(module.isSolved()).isFalse();
    }

    @Test
    void failsWhenAnyLetterIsNotASingleCharacter() {
        ModuleEntity module = module();
        SolveResult<AlphabetOutput> result = solver.solve(
            new RoundEntity(), new BombEntity(), module,
            new AlphabetInput(List.of("A", "AB", "C", "D"))
        );

        assertThat(result).isInstanceOf(SolveFailure.class);
        assertThat(((SolveFailure<AlphabetOutput>) result).getReason())
            .isEqualTo("Each letter must be a single character");
        assertThat(module.isSolved()).isFalse();
    }

    // --- helpers ---

    private AlphabetOutput solve(List<String> letters) {
        ModuleEntity module = module();
        SolveResult<AlphabetOutput> result = solver.solve(
            new RoundEntity(), new BombEntity(), module,
            new AlphabetInput(letters)
        );

        assertThat(result).isInstanceOf(SolveSuccess.class);
        assertThat(module.isSolved()).isTrue();

        return ((SolveSuccess<AlphabetOutput>) result).output();
    }

    private static ModuleEntity module() {
        ModuleEntity module = new ModuleEntity();
        module.setType(ModuleType.ALPHABET);
        module.setSolution(new HashMap<>());
        module.setState(new HashMap<>());
        return module;
    }
}
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `./gradlew test --tests "ktanesolver.module.modded.regular.alphabet.*"`
Expected: compile error — `AlphabetSolver` does not exist yet.

- [ ] **Step 3: Implement `AlphabetSolver`**

Create `src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetSolver.java`:

```java
package ktanesolver.module.modded.regular.alphabet;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
    type = ModuleType.ALPHABET,
    id = "alphabet",
    name = "Alphabet",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Spell words from the bank using the four given letters, longest first",
    tags = {"word", "letters"}
)
public class AlphabetSolver extends AbstractModuleSolver<AlphabetInput, AlphabetOutput> {

    private static final List<String> WORD_BANK = List.of(
        "JQXZ", "QEW", "AC", "ZNY", "TJL", "OKBV", "DFW", "YKQ", "LXE", "GS",
        "VSI", "PQJS", "VCN", "JR", "IRNM", "OP", "QYDX", "HDU", "PKD", "ARGF"
    );

    @Override
    protected SolveResult<AlphabetOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, AlphabetInput input
    ) {
        List<String> letters = input.letters();

        if (letters.size() != 4) {
            return failure("Alphabet requires exactly 4 letters");
        }
        for (String letter : letters) {
            if (letter == null || letter.length() != 1) {
                return failure("Each letter must be a single character");
            }
        }

        List<String> pool = new ArrayList<>(
            letters.stream().map(String::toUpperCase).toList()
        );
        List<String> pressOrder = new ArrayList<>();

        while (true) {
            String chosen = WORD_BANK.stream()
                .filter(word -> canForm(word, pool))
                .min(Comparator.comparingInt(String::length).reversed()
                    .thenComparing(Comparator.naturalOrder()))
                .orElse(null);

            if (chosen == null) break;

            pressOrder.add(chosen);
            for (char c : chosen.toCharArray()) {
                pool.remove(String.valueOf(c));
            }
        }

        Collections.sort(pool);
        pressOrder.addAll(pool);

        return success(new AlphabetOutput(pressOrder));
    }

    private boolean canForm(String word, List<String> pool) {
        List<String> available = new ArrayList<>(pool);
        for (char c : word.toCharArray()) {
            if (!available.remove(String.valueOf(c))) return false;
        }
        return true;
    }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `./gradlew test --tests "ktanesolver.module.modded.regular.alphabet.*"`
Expected: `BUILD SUCCESSFUL`, all 8 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/ktanesolver/module/modded/regular/alphabet/AlphabetSolver.java \
        src/test/java/ktanesolver/module/modded/regular/alphabet/AlphabetSolverTest.java
git commit -m "feat: implement AlphabetSolver with greedy word-bank algorithm"
```

---

## Task 3: Frontend service, types, and Twitch command

**Files:**
- Modify: `ktanesolver-frontend/src/types/index.ts`
- Create: `ktanesolver-frontend/src/services/alphabetService.ts`
- Modify: `ktanesolver-frontend/src/utils/twitchCommands.ts`

- [ ] **Step 1: Add `ALPHABET` to the frontend `ModuleType` enum**

In `ktanesolver-frontend/src/types/index.ts`, add after `PROBING = "PROBING"`:

```ts
  PROBING = "PROBING",
  ALPHABET = "ALPHABET",
```

- [ ] **Step 2: Create `alphabetService.ts`**

Create `ktanesolver-frontend/src/services/alphabetService.ts`:

```ts
import { api, withErrorWrapping } from "../lib/api";

export interface AlphabetSolveRequest {
    input: {
        letters: string[];
    };
}

export interface AlphabetSolveResponse {
    output: {
        pressOrder: string[];
    };
}

export const solveAlphabet = async (
    roundId: string,
    bombId: string,
    moduleId: string,
    input: AlphabetSolveRequest
): Promise<AlphabetSolveResponse> => {
    return withErrorWrapping(async () => {
        const response = await api.post<AlphabetSolveResponse>(
            `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
            input
        );
        return response.data;
    });
};
```

- [ ] **Step 3: Add Twitch command case**

In `ktanesolver-frontend/src/utils/twitchCommands.ts`, add before the `default:` case at the end of the switch:

```ts
    case ModuleType.ALPHABET: {
      const pressOrder = getStringArray(raw.pressOrder);
      if (pressOrder?.length) {
        return `!${TWITCH_PLACEHOLDER} alphabet ${pressOrder.join(' ')}`;
      }
      return `!${TWITCH_PLACEHOLDER} alphabet unknown`;
    }
```

- [ ] **Step 4: TypeScript check**

Run from `ktanesolver-frontend/`: `npm run build`
Expected: no type errors, `BUILD SUCCESSFUL`.

- [ ] **Step 5: Commit**

```bash
git add ktanesolver-frontend/src/types/index.ts \
        ktanesolver-frontend/src/services/alphabetService.ts \
        ktanesolver-frontend/src/utils/twitchCommands.ts
git commit -m "feat: add Alphabet frontend service, ModuleType entry, and Twitch command"
```

---

## Task 4: Frontend component

**Files:**
- Create: `ktanesolver-frontend/src/components/solvers/AlphabetSolver.tsx`

- [ ] **Step 1: Create `AlphabetSolver.tsx`**

Create `ktanesolver-frontend/src/components/solvers/AlphabetSolver.tsx`:

```tsx
import { useCallback, useMemo, useRef, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveAlphabet, type AlphabetSolveResponse } from "../../services/alphabetService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Input } from "../ui/input";
import { Alert } from "../ui/alert";
import { Badge } from "../ui/badge";

interface AlphabetSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function AlphabetSolver({ bomb }: AlphabetSolverProps) {
  const [letters, setLetters] = useState<string[]>(["", "", "", ""]);
  const [result, setResult] = useState<AlphabetSolveResponse["output"] | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

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

  const moduleState = useMemo(
    () => ({ letters, result, twitchCommand }),
    [letters, result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: { letters?: string[]; result?: AlphabetSolveResponse["output"] | null; twitchCommand?: string } | { input?: { letters?: string[] } }) => {
      if ("input" in state && state.input?.letters) {
        setLetters(state.input.letters);
      } else if ("letters" in state && state.letters !== undefined) {
        setLetters(state.letters);
      }
      if ("result" in state && state.result !== undefined) setResult(state.result);
      if ("twitchCommand" in state && state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback(
    (solution: AlphabetSolveResponse["output"]) => {
      if (!solution?.pressOrder) return;
      setResult(solution);
      const command = generateTwitchCommand({ moduleType: ModuleType.ALPHABET, result: solution });
      setTwitchCommand(command);
    },
    []
  );

  useSolverModulePersistence<
    { letters: string[]; result: AlphabetSolveResponse["output"] | null; twitchCommand: string },
    AlphabetSolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown };
        if ("result" in anyRaw) return anyRaw.result as AlphabetSolveResponse["output"];
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as AlphabetSolveResponse["output"];
        return raw as AlphabetSolveResponse["output"];
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleLetterChange = (index: number, value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z]/g, "");
    const updated = [...letters];
    updated[index] = upper.slice(-1); // keep only the last typed char
    setLetters(updated);
    if (error) clearError();
    if (upper && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const solveAlphabetModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    if (letters.some((l) => l.length !== 1)) {
      setError("Please enter all 4 letters");
      return;
    }

    clearError();
    setIsLoading(true);

    try {
      const response = await solveAlphabet(round.id, bomb.id, currentModule.id, {
        input: { letters },
      });

      setResult(response.output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.ALPHABET,
        result: response.output,
      });
      setTwitchCommand(command);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Alphabet");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setLetters(["", "", "", ""]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const allFilled = letters.every((l) => l.length === 1);

  return (
    <SolverLayout>
      {/* Module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">ALPHABET MODULE</h3>

        {/* 4 letter button slots */}
        <div className="flex justify-center gap-3 mb-6">
          {letters.map((letter, i) => (
            <div
              key={i}
              className={`h-14 w-12 border-2 rounded flex items-center justify-center text-2xl font-bold ${
                letter
                  ? "bg-blue-600 border-blue-400 text-white"
                  : "bg-gray-700 border-gray-600 text-gray-400"
              }`}
            >
              {letter || "?"}
            </div>
          ))}
        </div>

        {/* Inputs */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
            Enter the 4 letters shown on the module:
          </label>
          <div className="flex justify-center gap-2">
            {letters.map((letter, i) => (
              <Input
                key={i}
                ref={inputRefs[i]}
                type="text"
                value={letter}
                onChange={(e) => handleLetterChange(i, e.target.value)}
                className="w-12 text-center text-xl tracking-widest"
                maxLength={1}
                disabled={isLoading || isSolved}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={solveAlphabetModule}
        onReset={reset}
        isSolveDisabled={!allFilled}
        isLoading={isLoading}
        solveText="Solve"
      />

      {/* Error */}
      <ErrorAlert error={error} />

      {/* Result */}
      {result && (
        <Alert variant="success" className="mb-4">
          <p className="font-semibold mb-2">Press order:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {result.pressOrder.map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-400">→</span>}
                <Badge variant="default">{step}</Badge>
              </div>
            ))}
          </div>
        </Alert>
      )}

      {/* Twitch */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the 4 letter buttons shown on the Alphabet module.</p>
        <p>• The solver spells the longest possible word from the bank first</p>
        <p>• On ties, it picks the alphabetically earlier word</p>
        <p>• Remaining letters are pressed in alphabetical order</p>
      </div>
    </SolverLayout>
  );
}
```

- [ ] **Step 2: TypeScript check**

Run from `ktanesolver-frontend/`: `npm run build`
Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add ktanesolver-frontend/src/components/solvers/AlphabetSolver.tsx
git commit -m "feat: add AlphabetSolver React component"
```
