# Implementing a New Module Solver

This is the current end-to-end checklist for adding a module safely in this repo.

## What Changed Recently

- The backend now returns explicit errors for unsupported module types and invalid solve input.
- The module catalog contract now uses `hasInput` and `hasOutput`.
- The frontend uses one shared catalog store and one shared solver registry.
- New module types no longer require a Flyway migration just to satisfy the old `modules.type` check constraint. That constraint was removed in `V17__drop_module_type_check_constraint.sql`.

## Backend Checklist

### 1. Add the module type

Add the enum entry in `src/main/java/ktanesolver/enums/ModuleType.java`.

```java
public enum ModuleType {
    // ...
    YOUR_NEW_MODULE(false)
}
```

- Use `true` only if the module belongs in the needy panel.
- The enum is still the backend source of truth for persisted module types.

### 2. Create the input and output types

Add a `ModuleInput` record and a `ModuleOutput` record in the module package.

```java
public record YourModuleInput(
        String field1,
        int field2
) implements ModuleInput {
}
```

```java
public record YourModuleOutput(
        String solution
) implements ModuleOutput {
}
```

### 3. Create the solver class

Place the solver under the matching package:

- `src/main/java/ktanesolver/module/vanilla/regular/...`
- `src/main/java/ktanesolver/module/vanilla/needy/...`
- `src/main/java/ktanesolver/module/modded/regular/...`
- `src/main/java/ktanesolver/module/modded/needy/...`

Use `@Service` and `@ModuleInfo`.

```java
@Service
@ModuleInfo(
        type = ModuleType.YOUR_NEW_MODULE,
        id = "your-module",
        name = "Your Module",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Brief description",
        tags = {"tag1", "tag2"},
        hasInput = true,
        hasOutput = true
)
public class YourModuleSolver extends AbstractModuleSolver<YourModuleInput, YourModuleOutput> {

    @Override
    protected SolveResult<YourModuleOutput> doSolve(
            RoundEntity round,
            BombEntity bomb,
            ModuleEntity module,
            YourModuleInput input
    ) {
        if (input.field1() == null || input.field1().isBlank()) {
            return failure("Field 1 is required");
        }

        return success(new YourModuleOutput("solution"));
    }
}
```

### 4. Use the solver helpers correctly

- `success(output)` marks the module solved.
- `success(output, false)` returns output without marking the module solved.
- `failure(message)` returns a user-facing validation failure.
- `storeState(module, key, value)` and `storeTypedState(module, value)` persist multi-step progress.

### 5. Decide the catalog metadata carefully

The `@ModuleInfo` values now feed the frontend more directly:

- `category` decides where the module appears in the UI.
- `hasInput` and `hasOutput` describe the solver contract.
- `checkFirst` controls the Solve page reminder strip.

If those values are wrong, the frontend layout will be wrong even if the solve logic works.

## Frontend Checklist

### 1. Add the frontend enum entry

Add the module in `ktanesolver-frontend/src/types/index.ts`.

```ts
export enum ModuleType {
  // ...
  YOUR_NEW_MODULE = "YOUR_NEW_MODULE",
}
```

### 2. Add the service

Create a module service under `ktanesolver-frontend/src/services/`.

```ts
import { api, withErrorWrapping } from "../lib/api";

export interface YourModuleSolveRequest {
  input: {
    field1: string;
    field2: number;
  };
}

export interface YourModuleSolveResponse {
  output: {
    solution: string;
  };
  solved?: boolean;
}

export const solveYourModule = async (
  roundId: string,
  bombId: string,
  moduleId: string,
  input: YourModuleSolveRequest["input"],
): Promise<YourModuleSolveResponse> =>
  withErrorWrapping(async () => {
    const response = await api.post<YourModuleSolveResponse>(
      `/rounds/${roundId}/bombs/${bombId}/modules/${moduleId}/solve`,
      { input },
    );
    return response.data;
  });
```

### 3. Add the solver component

Create `ktanesolver-frontend/src/components/solvers/YourModuleSolver.tsx`.

Follow the existing solver pattern:

- accept `SolverProps` / `bomb`
- read `round` and `currentModule` from `useRoundStore`
- use the shared solver helpers from `src/components/common/`
- persist stage state for multi-step modules with `useSolverModulePersistence`
- call `updateModuleAfterSolve` or `markModuleSolved` when appropriate

For a good reference:

- `ButtonSolver` for a straightforward regular solver
- `ForgetMeNotSolver` for a multi-step solver
- `KnobsSolver` for a needy solver component that uses the shared props contract

### 4. Register the solver in one place

Add the component to `ktanesolver-frontend/src/components/solvers/registry.ts`.

That file is now the shared source for:

- lazy solver loading
- stable component identity
- fallback needy metadata for placeholder solvers

Regular solver:

```ts
[ModuleType.YOUR_NEW_MODULE]: { load: () => import("./YourModuleSolver") }
```

Needy solver:

```ts
[ModuleType.YOUR_NEW_MODULE]: {
  load: () => import("./YourModuleSolver"),
  isNeedy: true,
}
```

Do not add a separate switch anywhere else for new solvers.

### 5. Let the catalog drive placement

The setup and solve flows now consume the shared catalog store from `ktanesolver-frontend/src/store/useCatalogStore.ts`.

- The catalog is fetched from `/api/modules`.
- `SolvePage` and `ModuleSelector` both use that shared store.
- Solve-page regular vs needy grouping is driven by catalog category when available, with registry metadata only as a fallback.

If the backend `@ModuleInfo.category` is correct and the frontend registry entry exists, the module should land in the right place.

## Database Notes

- You still need the `ModuleType` enum value in Java because `ModuleEntity.type` is persisted as `EnumType.STRING`.
- You do not need a Flyway migration just to update the old `modules_type_check` constraint. That constraint is gone.
- Add a migration only when your module needs actual schema changes.

## Testing Checklist

### Backend

- Add or update a focused test under `src/test/java`.
- Verify the solver is in `/api/modules`.
- Verify valid solve input succeeds.
- Verify invalid input produces a clear `400` when appropriate.

### Frontend

- Add or update a focused Vitest test under `ktanesolver-frontend/src`.
- Registering a solver should be covered through the shared registry.
- If the module changes placement behavior, cover that metadata-driven classification.

### Manual verification

1. Start the backend and frontend.
2. Open setup and confirm the module appears in the selector.
3. Add it to a bomb and verify it appears in the correct solve area.
4. Open the solver, submit valid input, and confirm the UI updates correctly.
5. Submit invalid input and confirm the error message is readable.

## Common Failure Modes

### Module appears in the backend catalog but not the UI

Check:

- `ModuleType` was added in both backend and frontend.
- The solver component was added to `src/components/solvers/registry.ts`.
- The frontend is using the shared catalog store successfully.

### Module exists in the database but solve fails immediately

Check:

- The backend solver class has both `@Service` and `@ModuleInfo`.
- The `ModuleInfo.type` matches the enum entry exactly.

If no solver is registered, the backend now returns a controlled `501` instead of crashing.

### Module lands in the wrong panel

Check:

- `@ModuleInfo.category`
- the registry entry's `isNeedy` flag for fallback-only placeholder behavior

Prefer fixing the backend category rather than relying on fallback metadata.
