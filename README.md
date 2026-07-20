# KTANESolver

KTANESolver is a browser-based companion for **Keep Talking and Nobody Explodes**. It keeps the bomb's edgework, modules, strikes, and solve state together so an expert team can move quickly without losing context.

{% hint style="info" %}
KTANESolver complements the official and community manuals. The defuser still performs every action on the bomb and confirms when a module is physically solved.
{% endhint %}

## What it does

- Guides a round from bomb setup through live defusal.
- Uses serial numbers, batteries, indicators, and port plates in solver logic.
- Supports vanilla and modded regular and needy modules.
- Shows the relevant manual beside each solver.
- Preserves multi-stage progress and completed solutions in PostgreSQL.
- Synchronizes open clients through WebSocket events.
- Generates audited KTaNE Twitch Plays commands.

## Start here

| I want to… | Read… |
|---|---|
| Run the application locally | [Getting started](docs/getting-started.md) |
| Set up and solve a bomb | [Using KTANESolver](docs/using-ktanesolver.md) |
| See the interface | [Visual tour](docs/visual-tour.md) |
| See available solvers | [Supported modules](docs/supported-modules.md) |
| Understand the codebase | [Architecture](docs/architecture.md) |
| Call the backend directly | [API reference](docs/api-reference.md) |
| Add another module | [Implementing a module solver](docs/implementing-new-module-solver.md) |
| Build a consistent solver UI | [Frontend solver guidelines](docs/frontend-solver-guidelines.md) |
| Work with Twitch Plays | [Twitch Plays commands](docs/twitch-plays-command-audit.md) |

## Technology

| Layer | Stack |
|---|---|
| Backend | Java 21, Spring Boot, JPA, Flyway |
| Database | PostgreSQL 16 |
| Frontend | React, TypeScript, Vite, Zustand |
| Live updates | STOMP over SockJS/WebSocket |

## Quick start

```bash
docker compose up -d
./gradlew bootRun
```

In a second terminal:

```bash
cd ktanesolver-frontend
npm install
npm run dev
```

Open the URL printed by Vite. The backend listens on `http://localhost:8080`.

{% hint style="success" %}
If `http://localhost:8080/api/modules` returns JSON, the database, migrations, backend, and solver registry are ready.
{% endhint %}
