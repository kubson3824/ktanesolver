# KTANESolver Backend

Backend service for solving "Keep Talking and Nobody Explodes" puzzles. The legacy Swing UI has been retired in favor of a REST API that a modern React frontend can consume.

## Stack

- Java 21
- Spring Boot 3 (Web starter)
- Gradle 8 (wrapper included)

## Getting Started

```bash
# Build and run tests
./gradlew clean build

# Launch backend locally (defaults to http://localhost:8080)
./gradlew bootRun
```

### Configuration

- **CORS** is currently open (`@CrossOrigin(origins = "*")`) for rapid frontend iteration. Lock this down before production.
- Application properties can be added under `src/main/resources/application.yml`.

## API Surface

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/bomb/summarize` | Accepts a bomb description and returns derived information (battery totals, indicator counts, etc.). |

Sample request:

```json
POST /api/bomb/summarize
{
  "serialNumber": "ABC123",
  "litIndicators": ["CAR"],
  "unlitIndicators": ["NSA"],
  "batteriesAA": 2,
  "batteriesD": 1,
  "portRJ45": 1,
  "totalModules": 11,
  "solvedModules": 3
}
```

## Project Layout

- `src/main/java/ktanesolver/KtaneSolverApplication.java` – Spring Boot entry point
- `src/main/java/ktanesolver/api/` – REST controller and service layer
- `src/main/java/ktanesolver/api/dto/` – Request/response records for the API
- `src/ktanesolver` – Existing model and puzzle-solving logic (to be incrementally ported into the service layer)
- `src/KTANEResources` – Legacy resources, still available for reuse

## Frontend Prep (React)

1. **Create React app** in a sibling folder, e.g. `frontend/`.
2. Configure environment variables:
   - `VITE_API_BASE=http://localhost:8080` (Vite example)
3. Implement API client (fetch/Axios) targeting `/api/bomb/...` endpoints.
4. For local development, run both apps:
   ```bash
   # backend
   ./gradlew bootRun

   # frontend (from frontend directory)
   npm install
   npm run dev
   ```
5. For production, either:
   - Deploy frontend separately (static hosting) and point it to the backend API URL, or
   - Build the React app and serve it from Spring Boot's `src/main/resources/static` folder.

## Migration Notes

- Legacy Swing `MenuUI` remains in `src/ktanesolver/ui` for reference but is no longer the entry point.
- Gradle now uses Spring Boot plugins; jar/manifest configuration is handled automatically.

## Next Steps

1. Port module-solving logic into Spring services.
2. Design React components that map to bomb setup and solver outputs.
3. Add authentication/authorization if the service will be exposed publicly.
