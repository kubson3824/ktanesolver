# Full Audit & Optimization Design

**Date:** 2026-04-08  
**Scope:** Full-stack audit of KTANESolver — backend (Spring Boot / JPA) and frontend (React / Zustand)  
**Approach:** Impact-ranked (correctness → architecture → maintainability → cosmetic)

---

## Tier 1 — Correctness / Bugs

### 1. `ModuleController.getModule` does not validate bomb ownership

**Problem:** `GET /bombs/{bombId}/modules/{moduleId}` returns any module by ID, ignoring whether it belongs to the specified `bombId`. A request with a mismatched bomb ID silently succeeds.

**Fix:** After `moduleRepo.findById(moduleId)`, assert `module.getBomb().getId().equals(bombId)`, throwing `404` if not.

---

### 2. Business logic in controllers (`BombController`, `ModuleController`)

**Problem:** `BombController.createBomb` builds and saves a `BombEntity` inline. `ModuleController.addModules` loops, creates, and saves `ModuleEntity` objects. Both have `@Transactional` on controller methods, violating the controller → service → repository layering used everywhere else.

**Fix:**
- Extract `BombController.createBomb` logic into `BombService.createBomb(UUID roundId, CreateBombRequest req)`.
- Extract `ModuleController.addModules` logic into `ModuleService.addModules(UUID bombId, AddModulesRequest req)`.
- Controllers become thin delegators.

---

### 3. Inconsistent event publishing in `BombService`

**Problem:** `BombService` directly injects `RoundEventBroadcastService` to broadcast updates, while `ModuleService` uses `ApplicationEventPublisher`. Two different event paths for the same concern.

**Fix:** Replace the `RoundEventBroadcastService` injection in `BombService` with `ApplicationEventPublisher`. Introduce a `BombConfiguredEvent` and a `BombCreatedEvent` (mirroring `BombModuleUpdatedEvent`). `RoundEventBroadcastService` listens to these events.

---

## Tier 2 — Architecture / Performance

### 4. N+1 queries when loading a round

**Problem:** `RoundRepository.findById` returns a `RoundEntity` whose `bombs` collection is lazily loaded. Each bomb then lazily loads `modules`, `indicators`, and `portPlates`. A typical round with 2 bombs and 10 modules fires 20+ queries.

**Fix:** Add a custom JPQL query to `RoundRepository`:

```java
@Query("""
    SELECT DISTINCT r FROM RoundEntity r
    LEFT JOIN FETCH r.bombs b
    LEFT JOIN FETCH b.modules
    LEFT JOIN FETCH b.portPlates
    LEFT JOIN FETCH b.indicators
    WHERE r.id = :id
""")
Optional<RoundEntity> findByIdWithDetails(@Param("id") UUID id);
```

Use this query everywhere a full round graph is needed (round controller, refresh, WebSocket broadcast).

---

### 5. Three separate DB lookups per solve in `ModuleService.solveModule`

**Problem:** Every solve fires three independent `findById` queries: `roundRepo`, `bombRepo`, `moduleRepo`. The module already holds a `@ManyToOne bomb` and the bomb holds a `@ManyToOne round`.

**Fix:** Add a fetch-joined query to `ModuleRepository`:

```java
@Query("""
    SELECT m FROM ModuleEntity m
    JOIN FETCH m.bomb b
    JOIN FETCH b.round
    WHERE m.id = :id
""")
Optional<ModuleEntity> findByIdWithBombAndRound(@Param("id") UUID id);
```

Drop the separate `roundRepo.findById` and `bombRepo.findById` calls in `solveModule`. Derive `bomb` and `round` from the fetched module.

---

### 6. `solveModule` unconditionally saves `round` after every solve

**Problem:** `roundRepo.save(round)` is called on every module solve, even though most solvers only modify `module.state` and `module.solution`. This is a redundant write.

**Fix:** Remove `roundRepo.save(round)` from `ModuleService.solveModule`. The `moduleRepo.save(module)` is sufficient. The round's `@Version` field handles optimistic locking without an explicit save unless the round's own fields were mutated by the solver.

---

### 7. Redundant `refreshRound` calls from the frontend

**Problem:** `addBomb`, `configureBomb`, and `addModules` in `useRoundStore` each fire a full `GET /rounds/{id}` refresh after already patching local state from the API response. This is 2–3 extra roundtrips per setup flow with no benefit.

**Fix:** Remove the `void get().refreshRound(roundId)` calls from `addBomb`, `configureBomb`, and `addModules`. The store already applies the server response to local state. The WebSocket listener is responsible for keeping state in sync during active rounds.

---

### 8. `@ModuleInfo` annotation re-read on every `getType()` and `getCatalogInfo()` call

**Problem:** Both methods call `getClass().getAnnotation(ModuleInfo.class)` on every invocation, including during every solve dispatch. Annotation lookup is not free.

**Fix:** Cache the annotation in `AbstractModuleSolver`:

```java
private final ModuleInfo moduleInfo = getClass().getAnnotation(ModuleInfo.class);
```

Replace all `getClass().getAnnotation(ModuleInfo.class)` calls with `this.moduleInfo`. Add a null check in the field initializer or constructor and throw `IllegalStateException` eagerly at startup.

---

## Tier 3 — Maintainability

### 9. Migration-per-module-type pattern

**Problem:** Each new module type requires a dedicated Flyway migration file that drops and re-creates the `modules_type_check` constraint with every enum value listed. There are 16 such files (V2–V16). This is tedious, error-prone (a missed value silently corrupts data), and grows without bound.

**Fix:** Drop the check constraint permanently in a new migration (V17). Rely on `@Enumerated(EnumType.STRING)` — Hibernate rejects unknown enum values at the application layer before they reach the database. No further per-module-type migrations are needed.

```sql
-- V17__drop_module_type_check_constraint.sql
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_type_check;
```

---

### 10. `moduleManualNames` hardcoded in frontend

**Problem:** `useRoundStore.ts` contains a 50-entry `Record<ModuleType, string>` mapping module types to manual page names. This duplicates the `name` field already returned by every `ModuleCatalogDto` from `GET /modules`. When a new module is added, both the backend annotation and this map must be updated, or the manual link silently breaks.

**Fix:** Store the fetched module catalog in the Zustand store (or a separate lightweight store/context). Derive the manual URL from `catalog[moduleType].name` instead of the hardcoded map. Remove `moduleManualNames` and `attachManualUrl` entirely.

---

### 11. `ModuleCatalogService` uses unnecessary double-checked locking

**Problem:** The service uses `volatile` + `synchronized` DCL to lazily initialize the module list. The data is derived from Spring beans that are fully ready before any request arrives, so lazy initialization provides no benefit.

**Fix:** Replace with `@PostConstruct`:

```java
@PostConstruct
private void init() {
    this.cachedModules = List.copyOf(getSolverModules());
}
```

Drop the `volatile` field modifier and `synchronized` block.

---

### 12. `BombEntity` streams serial number twice for digit operations

**Problem:** `isLastDigitOdd()` and `getLastDigit()` both independently stream `serialNumber.chars()` to extract the last digit.

**Fix:** Rewrite `isLastDigitOdd()` to delegate to `getLastDigit()`:

```java
public boolean isLastDigitOdd() {
    return getLastDigit() % 2 == 1;
}
```

---

## Tier 4 — Cosmetic / Minor

### 13. `@Transactional` on read-only methods in `RoundService`

`getRound` and `getAllRounds` are `@Transactional` without `readOnly = true`. Change to `@Transactional(readOnly = true)` to allow the driver and connection pool to optimize.

---

### 14. `Collectors.toList()` → `.toList()` in `ModuleCatalogService`

Two `.collect(Collectors.toList())` calls can be replaced with `.toList()` (Java 16+), which is shorter and returns an unmodifiable list consistent with the catalog's static nature.

---

### 15. `BombEntity.isIndicatorLit/isIndicatorUnlit` null-check pattern

Current pattern uses `getOrDefault(indicator, null)` then manually null-checks. Cleaner:

```java
public boolean isIndicatorLit(String indicator) {
    return Boolean.TRUE.equals(indicators.get(indicator));
}

public boolean isIndicatorUnlit(String indicator) {
    return Boolean.FALSE.equals(indicators.get(indicator));
}
```

---

## Implementation Order

| # | Item | Tier | Layer |
|---|------|------|-------|
| 1 | Bomb ownership validation in `getModule` | Correctness | Backend |
| 2 | Extract controller logic into services | Correctness | Backend |
| 3 | Unify event publishing in `BombService` | Correctness | Backend |
| 4 | Fetch-join query for round loading (N+1) | Architecture | Backend |
| 5 | Single DB lookup per solve | Architecture | Backend |
| 6 | Remove redundant `roundRepo.save` in solve | Architecture | Backend |
| 7 | Remove redundant `refreshRound` calls | Architecture | Frontend |
| 8 | Cache `@ModuleInfo` annotation | Architecture | Backend |
| 9 | Drop `modules_type_check` constraint | Maintainability | Backend |
| 10 | Replace hardcoded `moduleManualNames` | Maintainability | Frontend |
| 11 | Replace DCL with `@PostConstruct` | Maintainability | Backend |
| 12 | `isLastDigitOdd` delegates to `getLastDigit` | Maintainability | Backend |
| 13 | `readOnly = true` on read transactions | Cosmetic | Backend |
| 14 | `.toList()` in `ModuleCatalogService` | Cosmetic | Backend |
| 15 | `Boolean.TRUE.equals` indicator helpers | Cosmetic | Backend |
