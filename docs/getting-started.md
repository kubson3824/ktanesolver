# Install and run

Run PostgreSQL, the Spring Boot API, and the Vite frontend locally.

## Prerequisites

| Tool | Requirement |
|---|---|
| Java | JDK 21 |
| Node.js | `20.19+` or `22.12+` |
| Docker | Docker Desktop or Docker Engine with Compose |

The Node.js ranges come from the [Vite compatibility requirements](https://vite.dev/guide/#scaffolding-your-first-vite-project).

## 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d
```

The Compose file creates a PostgreSQL 16 database on `localhost:5432` with the development credentials already used by Spring Boot.

## 2. Start the backend

{% tabs %}
{% tab title="Windows" %}
```powershell
.\gradlew.bat bootRun
```
{% endtab %}

{% tab title="macOS or Linux" %}
```bash
./gradlew bootRun
```
{% endtab %}
{% endtabs %}

Flyway applies pending migrations during startup. The API listens on `http://localhost:8080`.

Verify it in another terminal:

```bash
curl http://localhost:8080/api/modules
```

## 3. Start the frontend

```bash
cd ktanesolver-frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Configuration

The default development setup needs no environment file.

| Setting | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend URL used by Axios and SockJS |
| `VITE_DEBUG_MODULE_SYNC` | `false` | Enables module synchronization logs in the browser console |
| `server.port` | `8080` | Backend HTTP port in `application.properties` |

Create `ktanesolver-frontend/.env.local` only when overriding a frontend value:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_DEBUG_MODULE_SYNC=true
```

Restart Vite after changing an environment variable.

## Checks

Run the smallest relevant checks before committing:

```bash
./gradlew test
```

```bash
cd ktanesolver-frontend
npm run test
npm run build
npm run lint
```

## Troubleshooting

### The backend cannot connect to PostgreSQL

Check that the container is running and port `5432` is available:

```bash
docker compose ps
```

### The module selector is empty

Open `http://localhost:8080/api/modules`. If that request fails, fix the backend before debugging the frontend.

### The frontend cannot reach the API

Confirm the backend is on port `8080`, check `VITE_API_BASE_URL`, and restart the Vite process.

### A migration fails

Read the first Flyway error in the backend log. Do not let Hibernate modify the schema; this project intentionally uses `spring.jpa.hibernate.ddl-auto=none`.

