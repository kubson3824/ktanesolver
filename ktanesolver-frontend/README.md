# KTANESolver Frontend

React/Vite frontend for the KTANESolver backend.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
```

## Add A Solver UI

Use the root guide first: [../docs/implementing-new-module-solver.md](../docs/implementing-new-module-solver.md).

Frontend files usually touched:

1. `src/services/yourModuleService.ts`
2. `src/components/solvers/YourModuleSolver.tsx`
3. `src/components/solvers/registry.ts`
4. `src/types/index.ts` only when the UI/Twitch command code needs a `ModuleType` constant

Use `solveModule` from `src/lib/api.ts` for new services so every solver keeps the same `{ input: ... }` request shape.
