# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KTANESolver is a full-stack web application for solving [Keep Talking and Nobody Explodes](https://keeptalkinggame.com/) bomb puzzle modules. It consists of a Spring Boot backend (solver engine + REST API) and a React/TypeScript frontend.

## Commands

### Backend (root directory)

```bash
./gradlew build          # Compile and package
./gradlew bootRun        # Run the application (requires PostgreSQL)
./gradlew test           # Run tests
docker-compose up        # Start PostgreSQL (required before bootRun)
```

### Frontend (`ktanesolver-frontend/`)

```bash
npm install   # Install dependencies
npm run dev   # Start Vite dev server
npm run build # TypeScript check + production build
npm run lint  # ESLint
```

Backend runs on port 8080. Frontend dev server proxies API calls to it.

## Architecture

### Backend Layer Structure

```
REST Controllers (/controller)
  → Services (/service)
    → ModuleSolverRegistry (auto-discovers all @Service solvers)
      → Module Solvers (/module/vanilla/ and /module/modded/)
        → JPA Entities (/entity) → PostgreSQL
```

**Core solver framework** lives in `src/main/java/ktanesolver/logic/`:
- `ModuleSolver<I, O>` — interface all solvers implement
- `AbstractModuleSolver<I, O>` — base class providing `success()`, `failure()`, `storeState()`, and reflection-based input deserialization
- `SolveResult<O>` → `SolveSuccess<O>` / `SolveFailure<O>` — result ADT

**Auto-registration:** any class annotated with both `@Service` and `@ModuleInfo` is automatically discovered by `ModuleSolverRegistry` at startup — no manual wiring needed.

### Domain Model

```
RoundEntity (1) → (many) BombEntity → (many) ModuleEntity
                                    → (many) PortPlateEntity
```

- `ModuleEntity.state` (JSONB) — persists intermediate state for multi-step modules
- `ModuleEntity.solution` (JSONB) — persists final solution
- `BombEntity` has helpers: `getSerialNumber()`, `isLastDigitOdd()`, `getIndicators()`, `getPortPlates()`, `getAaBatteryCount()`, `getDBatteryCount()`

### Events

`BombModuleUpdatedEvent` is published via Spring's `ApplicationEventPublisher` after each solve. `RoundEventBroadcastService` listens and forwards updates over WebSocket (STOMP).

### Frontend State

Zustand store (`useRoundStore`) holds global round/bomb/module context. Each module solver component reads `currentModule`, `round`, and `bomb` from this store and calls the corresponding service in `src/services/`.

## Adding a New Module Solver

**Backend (3 files):**

1. Add entry to `ModuleType.java` enum — `MY_MODULE(false)` for regular, `(true)` for needy
2. Create `MyModuleInput` record implementing `ModuleInput` and `MyModuleOutput` record implementing `ModuleOutput`
3. Create solver class:

```java
@Service
@ModuleInfo(
    type = ModuleType.MY_MODULE,
    id = "my-module",
    name = "My Module",
    category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,  // or VANILLA_NEEDY, MODDED_REGULAR
    description = "...",
    tags = {"tag1"}
)
public class MyModuleSolver extends AbstractModuleSolver<MyModuleInput, MyModuleOutput> {
    @Override
    protected SolveResult<MyModuleOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, MyModuleInput input
    ) {
        // Use success(output) to mark solved, success(output, false) to return without marking
        // Use failure("message") for validation errors
        // Use storeState(module, key, value) for multi-step modules
        return success(new MyModuleOutput(...));
    }
}
```

Place vanilla modules under `module/vanilla/regular/` or `module/vanilla/needy/`; modded under `module/modded/`.

**Frontend (2 files):**

1. Add `MY_MODULE = "MY_MODULE"` to the `ModuleType` enum in `src/types/index.ts`
2. Create a service in `src/services/` using `api.post(...)` with `withErrorWrapping`
3. Create a React component in `src/components/solvers/` following the same pattern as existing solvers (state: inputs + result + isSolved + isLoading + error + twitchCommand; reads from `useRoundStore`; calls `markModuleSolved` on success)

The module catalog endpoint (`/modules`) is fetched dynamically, so new backend modules appear in the frontend selector automatically once the solver class is registered.

## Key Files

| File | Purpose |
|---|---|
| `src/main/java/ktanesolver/logic/AbstractModuleSolver.java` | Base class all solvers extend |
| `src/main/java/ktanesolver/annotation/ModuleInfo.java` | Registration annotation |
| `src/main/java/ktanesolver/registry/ModuleSolverRegistry.java` | Solver discovery & dispatch |
| `src/main/java/ktanesolver/enums/ModuleType.java` | All 48+ module type enum values |
| `src/main/java/ktanesolver/entity/BombEntity.java` | Bomb domain model with helper methods |
| `src/main/resources/db/migration/` | Flyway migration scripts |
| `ktanesolver-frontend/src/store/useRoundStore.ts` | Global Zustand state |
| `ktanesolver-frontend/src/lib/api.ts` | Axios instance + error wrapper |
| `docs/implementing-new-module-solver.md` | Full implementation guide with complete examples |
