# KTANESolver

Full-stack solver for Keep Talking and Nobody Explodes modules.

## Stack

- Backend: Spring Boot, Java 21, JPA, PostgreSQL, Flyway
- Frontend: React, TypeScript, Vite, Zustand

## Run Locally

Backend:

```bash
docker-compose up
./gradlew bootRun
```

Frontend:

```bash
cd ktanesolver-frontend
npm install
npm run dev
```

The backend listens on port `8080`. The frontend dev server talks to it through `VITE_API_BASE_URL` or `http://localhost:8080`.

## Common Checks

```bash
./gradlew test
cd ktanesolver-frontend && npm run build && npm run lint
```

## Add A Module

Start with [docs/implementing-new-module-solver.md](docs/implementing-new-module-solver.md).

Short version:

1. Add the backend `ModuleType`, input/output records, solver, and test.
2. Add a frontend service, solver component, and registry entry if the module has a UI.
3. Add a frontend `ModuleType` constant only when the UI/Twitch command code needs it.
4. Run the backend and frontend checks.

Backend solvers register automatically when annotated with both `@Service` and `@ModuleInfo`; do not manually wire `ModuleSolverRegistry`.
