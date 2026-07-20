# Implement a module solver

Add a solver end to end without duplicating framework code. A typical regular module needs one backend package, one focused backend test, one frontend service, one component, and one registry entry.

{% hint style="info" %}
Start from the closest existing module. The shared solver framework, API wrapper, state hooks, and UI primitives already cover the common cases.
{% endhint %}

## Before you code

Read the module manual completely and identify:

- every visible input the expert must enter;
- edgework used by the rules;
- whether the module is regular or needy;
- whether solving takes one request or several stages;
- the final action and any Twitch Plays command grammar;
- state that must survive a refresh.

## Backend

### 1. Add the module type

Add the enum value in `src/main/java/ktanesolver/enums/ModuleType.java`:

```java
YOUR_MODULE(false)
```

Use `true` only for a needy module. No Flyway migration is required just to add an enum value; the old database type constraint has been removed.

### 2. Create input and output records

Place the records in the same package as the solver:

```java
public record YourModuleInput(
        String display,
        int stage
) implements ModuleInput {
}
```

```java
public record YourModuleOutput(
        String action
) implements ModuleOutput {
}
```

Use domain names from the manual. Do not expose UI-only concepts in the backend contract.

### 3. Implement the solver

Choose the matching package:

- `module/vanilla/regular/`
- `module/vanilla/needy/`
- `module/modded/regular/`
- `module/modded/needy/`

```java
@Service
@ModuleInfo(
        type = ModuleType.YOUR_MODULE,
        id = "your-module",
        name = "Your Module",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Calculate the next required action.",
        tags = {"logic"},
        hasInput = true,
        hasOutput = true
)
public class YourModuleSolver
        extends AbstractModuleSolver<YourModuleInput, YourModuleOutput> {

    @Override
    protected SolveResult<YourModuleOutput> doSolve(
            RoundEntity round,
            BombEntity bomb,
            ModuleEntity module,
            YourModuleInput input
    ) {
        if (input.display() == null || input.display().isBlank()) {
            return failure("Display is required");
        }

        return success(new YourModuleOutput("press 2"));
    }
}
```

`@Service` and `@ModuleInfo` are both required. Spring supplies the solver list to `ModuleSolverRegistry`; do not add manual wiring.

### 4. Use framework helpers

| Helper | Meaning |
|---|---|
| `success(output)` | Return a final calculation with `solved: true` |
| `success(output, false)` | Return an intermediate calculation |
| `failure(message)` | Return a user-correctable rule or validation failure |
| `storeState(module, key, value)` | Merge one value into persisted stage state |
| `storeTypedState(module, value)` | Replace stage state with a typed object |

A final calculation does not confirm that the physical game module is solved. The user performs the action and confirms completion separately.

### 5. Set catalog metadata

`@ModuleInfo` drives the module selector and solve layout:

| Field | Effect |
|---|---|
| `type` | Links the solver to the persisted enum value |
| `id` | Matches the KTaNE module/manual identifier |
| `category` | Places the module in vanilla/modded and regular/needy groups |
| `tags` | Improves catalog search |
| `hasInput` / `hasOutput` | Describes the solver contract |
| `checkFirst` | Adds an early-round reminder |

### 6. Add one focused test

Create `YourModuleSolverTest` under the matching `src/test/java` package. Cover:

- one representative valid solve;
- the most important edgework branch;
- one invalid boundary input;
- stage persistence if the module is multi-step.

Prefer table-driven cases when the manual is a lookup table. Avoid one test method per row.

## Frontend

### 1. Add a module constant when needed

Add `YOUR_MODULE = "YOUR_MODULE"` to `ktanesolver-frontend/src/types/index.ts` when the custom UI or Twitch generator references it. The catalog itself comes from the backend.

### 2. Add the API service

Use the shared `solveModule` helper so every request keeps the `{ input: ... }` envelope:

```ts
import { solveModule } from "../lib/api";

export type YourModuleInput = {
  display: string;
  stage: number;
};

export type YourModuleResponse = {
  output: { action: string };
  solved: boolean;
};

export const solveYourModule = (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: YourModuleInput,
) => solveModule<YourModuleInput, YourModuleResponse>(
  roundId,
  bombId,
  moduleId,
  input,
);
```

### 3. Build the component

Create `ktanesolver-frontend/src/components/solvers/YourModuleSolver.tsx`. Follow [Frontend solver guidelines](frontend-solver-guidelines.md) and copy a matching archetype:

| Need | Reference |
|---|---|
| Simple input to answer | `AlphabetSolver`, `MathSolver`, `CombinationLockSolver` |
| Multi-stage progress | `MemorySolver`, `WireSequencesSolver`, `SimonStatesSolver` |
| Needy interaction | `KnobsSolver`, `VentingGasSolver` |
| Color or symbol selection | `SimonSolver`, `KeypadsSolver`, `RoundKeypadSolver` |
| Grid or path | `MazeSolver`, `ChessSolver`, `ThreeDMazeSolver` |

### 4. Register the UI

Add one entry to `src/components/solvers/registry.ts`:

```ts
[ModuleType.YOUR_MODULE]: { load: () => import("./YourModuleSolver") }
```

For a needy fallback, include `isNeedy: true`. Catalog category remains the primary classification when it is available.

### 5. Add Twitch Plays support

Add the module's verified command grammar to `src/utils/twitchCommands.ts` and an exact expected command to `src/utils/twitchCommands.test.ts`. Never generate guessed prose or an incomplete command.

With the backend running, refresh the public support table:

```bash
node scripts/generate-supported-modules.mjs
```

## Verification

```bash
./gradlew test
```

```bash
cd ktanesolver-frontend
npm run test
npm run build
npm run lint
```

Then verify the actual flow:

1. The module appears under the correct catalog category.
2. Its custom solver loads from the module grid.
3. Valid input produces the expected action.
4. Invalid input produces a readable error.
5. Solve, refresh, and reset restore the correct state.
6. A narrow viewport has no horizontal scrolling.
7. The generated Twitch command matches the module parser.

## Common failures

| Symptom | Check |
|---|---|
| Catalog entry is missing | Java enum, `@Service`, and `@ModuleInfo` |
| Catalog entry opens “Coming soon” | Frontend registry entry and module constant |
| Backend returns `501` | Solver registration and matching `ModuleInfo.type` |
| Module appears in the wrong panel | Backend `category`; registry `isNeedy` is only a fallback |
| Reset still looks solved | Local reset must call the shared `resetSolverState()` |
| Refresh loses a stage | Persisted state shape and `onRestoreState` |
