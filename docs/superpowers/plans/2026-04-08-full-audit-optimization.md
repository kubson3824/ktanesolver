# Full Audit & Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 15 identified issues across the KTANESolver codebase — correctness bugs, architectural inconsistencies, N+1 queries, and maintainability problems.

**Architecture:** Impact-ranked execution: correctness (Tasks 1–4) → performance (Tasks 5–7) → annotation caching (Task 8) → migration pattern (Task 9) → frontend catalog (Task 10) → service polish (Task 11) → entity helpers (Task 12) → transaction hints (Task 13).

**Tech Stack:** Java 21, Spring Boot 3.5, Spring Data JPA (Hibernate), PostgreSQL, Flyway, React 18, TypeScript 5, Zustand 4, Vite, Lombok

---

## File Map

**Created:**
- `src/main/java/ktanesolver/event/RoundStateChangedEvent.java`
- `src/main/resources/db/migration/V17__drop_module_type_check_constraint.sql`
- `src/test/java/ktanesolver/entity/BombEntityTest.java`
- `src/test/java/ktanesolver/logic/AbstractModuleSolverTest.java`
- `ktanesolver-frontend/src/store/useCatalogStore.ts`

**Modified:**
- `src/main/java/ktanesolver/repository/ModuleRepository.java`
- `src/main/java/ktanesolver/repository/RoundRepository.java`
- `src/main/java/ktanesolver/controller/ModuleController.java`
- `src/main/java/ktanesolver/controller/BombController.java`
- `src/main/java/ktanesolver/service/BombService.java`
- `src/main/java/ktanesolver/service/ModuleService.java`
- `src/main/java/ktanesolver/service/RoundService.java`
- `src/main/java/ktanesolver/service/RoundEventBroadcastService.java`
- `src/main/java/ktanesolver/logic/AbstractModuleSolver.java`
- `src/main/java/ktanesolver/service/ModuleCatalogService.java`
- `src/main/java/ktanesolver/entity/BombEntity.java`
- `ktanesolver-frontend/src/store/useRoundStore.ts`
- `ktanesolver-frontend/src/App.tsx`

---

## Task 1: Bomb ownership validation in `getModule`

**Problem:** `GET /bombs/{bombId}/modules/{moduleId}` returns any module regardless of whether it belongs to the specified bomb.

**Files:**
- Modify: `src/main/java/ktanesolver/repository/ModuleRepository.java`
- Modify: `src/main/java/ktanesolver/controller/ModuleController.java`

- [ ] **Step 1: Add a fetch-joined lookup to `ModuleRepository`**

Replace the entire file content:

```java
package ktanesolver.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ktanesolver.entity.ModuleEntity;

public interface ModuleRepository extends JpaRepository<ModuleEntity, UUID> {

    @Query("SELECT m FROM ModuleEntity m JOIN FETCH m.bomb WHERE m.id = :id")
    Optional<ModuleEntity> findByIdWithBomb(@Param("id") UUID id);
}
```

- [ ] **Step 2: Update `getModule` in `ModuleController` to validate bomb ownership**

Replace the existing `getModule` method (lines 51–53). No `@Transactional` needed — `findByIdWithBomb` uses `JOIN FETCH`, so `getBomb()` returns an already-initialized object:

```java
@GetMapping("/{moduleId}")
public ModuleEntity getModule(@PathVariable UUID bombId, @PathVariable UUID moduleId) {
    ModuleEntity module = moduleRepo.findByIdWithBomb(moduleId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
    if (!module.getBomb().getId().equals(bombId)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found");
    }
    return module;
}
```

- [ ] **Step 3: Verify compilation**

Run: `./gradlew build -x test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add src/main/java/ktanesolver/repository/ModuleRepository.java \
        src/main/java/ktanesolver/controller/ModuleController.java
git commit -m "fix: validate bomb ownership in getModule endpoint"
```

---

## Task 2: Extract bomb creation into `BombService`

**Problem:** `BombController.createBomb` contains business logic and directly accesses repositories, violating the layered architecture.

**Files:**
- Modify: `src/main/java/ktanesolver/service/BombService.java`
- Modify: `src/main/java/ktanesolver/controller/BombController.java`

- [ ] **Step 1: Add `createBomb` to `BombService`**

Current `BombService.java` has fields: `BombRepository bombRepo`, `ApplicationEventPublisher eventPublisher`, `RoundEventBroadcastService roundEventBroadcastService`.

Add `RoundRepository roundRepo` to the field list (via Lombok `@RequiredArgsConstructor`, just add the field) and add the `createBomb` method. Full updated file:

```java
package ktanesolver.service;

import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.BombConfig;
import ktanesolver.dto.CreateBombRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.BombStatus;
import ktanesolver.event.StrikeAddedEvent;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.RoundRepository;
import ktanesolver.service.RoundEventBroadcastService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BombService {

    private final BombRepository bombRepo;
    private final RoundRepository roundRepo;
    private final ApplicationEventPublisher eventPublisher;
    private final RoundEventBroadcastService roundEventBroadcastService;

    @Transactional
    public BombEntity createBomb(UUID roundId, CreateBombRequest req) {
        RoundEntity round = roundRepo.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        BombEntity bomb = new BombEntity();
        bomb.setRound(round);
        bomb.setSerialNumber(req.serialNumber());
        bomb.setAaBatteryCount(req.aaBatteryCount());
        bomb.setDBatteryCount(req.dBatteryCount());
        bomb.setIndicators(req.indicators());
        bomb.replacePortPlates(req.portPlates());
        bomb.setStatus(BombStatus.ACTIVE);
        bomb = bombRepo.save(bomb);
        roundEventBroadcastService.broadcastRoundUpdated(roundId);
        return bomb;
    }

    @Transactional
    public BombEntity configureBomb(UUID bombId, BombConfig config) {
        BombEntity bomb = bombRepo.findById(bombId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));

        if (config.serialNumber() != null) bomb.setSerialNumber(config.serialNumber());
        if (config.aaBatteryCount() != null) bomb.setAaBatteryCount(config.aaBatteryCount());
        if (config.dBatteryCount() != null) bomb.setDBatteryCount(config.dBatteryCount());
        if (config.indicators() != null) bomb.setIndicators(config.indicators());
        if (config.portPlates() != null) bomb.replacePortPlates(config.portPlates());

        bomb = bombRepo.save(bomb);
        roundEventBroadcastService.broadcastRoundUpdated(bomb.getRound().getId());
        return bomb;
    }

    @Transactional
    public BombEntity addStrike(UUID bombId) {
        BombEntity bomb = bombRepo.findById(bombId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));
        bomb.setStrikes(bomb.getStrikes() + 1);
        bomb = bombRepo.save(bomb);
        eventPublisher.publishEvent(new StrikeAddedEvent(this, bomb.getId(), bomb.getRound().getId(), bomb.getStrikes()));
        return bomb;
    }
}
```

- [ ] **Step 2: Slim down `BombController` to delegate to `BombService`**

Replace the entire `BombController.java`:

```java
package ktanesolver.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.*;

import ktanesolver.dto.CreateBombRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.service.BombService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rounds/{roundId}/bombs")
@RequiredArgsConstructor
public class BombController {

    private final BombService bombService;

    @PostMapping
    public BombEntity createBomb(@PathVariable UUID roundId, @RequestBody CreateBombRequest req) {
        return bombService.createBomb(roundId, req);
    }
}
```

- [ ] **Step 3: Verify compilation**

Run: `./gradlew build -x test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add src/main/java/ktanesolver/service/BombService.java \
        src/main/java/ktanesolver/controller/BombController.java
git commit -m "refactor: extract bomb creation into BombService"
```

---

## Task 3: Extract module addition into `ModuleService` + create `RoundStateChangedEvent`

**Problem:** `ModuleController.addModules` contains business logic and has `@Transactional` directly on a controller method.

**Files:**
- Create: `src/main/java/ktanesolver/event/RoundStateChangedEvent.java`
- Modify: `src/main/java/ktanesolver/service/ModuleService.java`
- Modify: `src/main/java/ktanesolver/controller/ModuleController.java`

- [ ] **Step 1: Create `RoundStateChangedEvent`**

Create `src/main/java/ktanesolver/event/RoundStateChangedEvent.java`:

```java
package ktanesolver.event;

import java.util.UUID;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class RoundStateChangedEvent extends ApplicationEvent {

    private final UUID roundId;

    public RoundStateChangedEvent(Object source, UUID roundId) {
        super(source);
        this.roundId = roundId;
    }
}
```

- [ ] **Step 2: Add `addModules` to `ModuleService`**

`ModuleService` already has `bombRepo` and `eventPublisher`. Add `addModules` method. The full updated `ModuleService.java`:

```java
package ktanesolver.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.AddModulesRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.event.BombModuleUpdatedEvent;
import ktanesolver.event.RoundStateChangedEvent;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.registry.ModuleSolverRegistry;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.ModuleRepository;
import ktanesolver.repository.RoundRepository;
import ktanesolver.utils.Json;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final RoundRepository roundRepo;
    private final BombRepository bombRepo;
    private final ModuleRepository moduleRepo;
    private final ModuleSolverRegistry registry;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public List<ModuleEntity> addModules(UUID bombId, AddModulesRequest req) {
        BombEntity bomb = bombRepo.findById(bombId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));
        List<ModuleEntity> modules = new ArrayList<>();
        for (int i = 0; i < req.count(); i++) {
            ModuleEntity m = new ModuleEntity();
            m.setBomb(bomb);
            m.setType(req.type());
            m.setSolved(false);
            modules.add(m);
        }
        modules = moduleRepo.saveAll(modules);
        eventPublisher.publishEvent(new RoundStateChangedEvent(this, bomb.getRound().getId()));
        return modules;
    }

    private static void ensureModuleInBombAndRound(ModuleEntity module, UUID bombId, UUID roundId) {
        if (!module.getBomb().getId().equals(bombId) || !module.getBomb().getRound().getId().equals(roundId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found in this bomb/round");
        }
    }

    @Transactional
    public SolveResult<?> solveModule(UUID roundId, UUID bombId, UUID moduleId, Map<String, Object> rawInput) {
        RoundEntity round = roundRepo.findById(roundId).orElseThrow();
        BombEntity bomb = bombRepo.findById(bombId).orElseThrow();
        ModuleEntity module = moduleRepo.findById(moduleId).orElseThrow();
        ensureModuleInBombAndRound(module, bombId, roundId);
        ModuleSolver<?, ?> solver = registry.get(module.getType());
        ModuleInput input = Json.mapper().convertValue(rawInput, solver.inputType());
        SolveResult<?> result = invokeSolver(solver, round, bomb, module, input);
        moduleRepo.save(module);
        roundRepo.save(round);
        eventPublisher.publishEvent(new BombModuleUpdatedEvent(this, roundId, bombId, module.getId(), module.getType(), module.isSolved()));
        return result;
    }

    @SuppressWarnings("unchecked")
    private <I extends ModuleInput, O extends ModuleOutput> SolveResult<O> invokeSolver(ModuleSolver<I, O> solver, RoundEntity round, BombEntity bomb, ModuleEntity module, ModuleInput input) {
        return solver.solve(round, bomb, module, (I) input);
    }
}
```

Note: `solveModule` is kept unchanged here — it will be updated in Task 6.

- [ ] **Step 3: Update `ModuleController` to delegate `addModules` to service**

Replace `ModuleController.java`:

```java
package ktanesolver.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.AddModulesRequest;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.repository.ModuleRepository;
import ktanesolver.service.ModuleService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/bombs/{bombId}/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleRepository moduleRepo;
    private final ModuleService moduleService;

    @PostMapping
    public List<ModuleEntity> addModules(@PathVariable UUID bombId, @RequestBody AddModulesRequest req) {
        return moduleService.addModules(bombId, req);
    }

    @GetMapping("/{moduleId}")
    public ModuleEntity getModule(@PathVariable UUID bombId, @PathVariable UUID moduleId) {
        ModuleEntity module = moduleRepo.findByIdWithBomb(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        if (!module.getBomb().getId().equals(bombId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found");
        }
        return module;
    }
}
```

- [ ] **Step 4: Verify compilation**

Run: `./gradlew build -x test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/ktanesolver/event/RoundStateChangedEvent.java \
        src/main/java/ktanesolver/service/ModuleService.java \
        src/main/java/ktanesolver/controller/ModuleController.java
git commit -m "refactor: extract module addition into ModuleService, introduce RoundStateChangedEvent"
```

---

## Task 4: Unify event publishing — remove direct `RoundEventBroadcastService` calls from `BombService`

**Problem:** `BombService` directly calls `RoundEventBroadcastService`, while everything else uses `ApplicationEventPublisher`. After this task, `BombService` publishes events and `RoundEventBroadcastService` listens.

**Files:**
- Modify: `src/main/java/ktanesolver/service/BombService.java`
- Modify: `src/main/java/ktanesolver/service/RoundEventBroadcastService.java`

- [ ] **Step 1: Update `BombService` to publish `RoundStateChangedEvent` instead of calling broadcast service directly**

Replace `BombService.java`:

```java
package ktanesolver.service;

import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.BombConfig;
import ktanesolver.dto.CreateBombRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.BombStatus;
import ktanesolver.event.RoundStateChangedEvent;
import ktanesolver.event.StrikeAddedEvent;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.RoundRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BombService {

    private final BombRepository bombRepo;
    private final RoundRepository roundRepo;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public BombEntity createBomb(UUID roundId, CreateBombRequest req) {
        RoundEntity round = roundRepo.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
        BombEntity bomb = new BombEntity();
        bomb.setRound(round);
        bomb.setSerialNumber(req.serialNumber());
        bomb.setAaBatteryCount(req.aaBatteryCount());
        bomb.setDBatteryCount(req.dBatteryCount());
        bomb.setIndicators(req.indicators());
        bomb.replacePortPlates(req.portPlates());
        bomb.setStatus(BombStatus.ACTIVE);
        bomb = bombRepo.save(bomb);
        eventPublisher.publishEvent(new RoundStateChangedEvent(this, roundId));
        return bomb;
    }

    @Transactional
    public BombEntity configureBomb(UUID bombId, BombConfig config) {
        BombEntity bomb = bombRepo.findById(bombId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));

        if (config.serialNumber() != null) bomb.setSerialNumber(config.serialNumber());
        if (config.aaBatteryCount() != null) bomb.setAaBatteryCount(config.aaBatteryCount());
        if (config.dBatteryCount() != null) bomb.setDBatteryCount(config.dBatteryCount());
        if (config.indicators() != null) bomb.setIndicators(config.indicators());
        if (config.portPlates() != null) bomb.replacePortPlates(config.portPlates());

        bomb = bombRepo.save(bomb);
        eventPublisher.publishEvent(new RoundStateChangedEvent(this, bomb.getRound().getId()));
        return bomb;
    }

    @Transactional
    public BombEntity addStrike(UUID bombId) {
        BombEntity bomb = bombRepo.findById(bombId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));
        bomb.setStrikes(bomb.getStrikes() + 1);
        bomb = bombRepo.save(bomb);
        eventPublisher.publishEvent(new StrikeAddedEvent(this, bomb.getId(), bomb.getRound().getId(), bomb.getStrikes()));
        return bomb;
    }
}
```

- [ ] **Step 2: Add a `@TransactionalEventListener` for `RoundStateChangedEvent` to `RoundEventBroadcastService`**

Replace `RoundEventBroadcastService.java`:

```java
package ktanesolver.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import ktanesolver.dto.RoundEventDto;
import ktanesolver.enums.EventType;
import ktanesolver.event.RoundStateChangedEvent;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoundEventBroadcastService {

    private static final String ROUND_TOPIC_PREFIX = "/topic/rounds/";

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRoundStateChanged(RoundStateChangedEvent event) {
        broadcastRoundUpdated(event.getRoundId());
    }

    public void broadcastRoundEvent(UUID roundId, RoundEventDto event) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", event.type().name());
        message.put("timestamp", event.timestamp().toString());
        message.put("payload", event.payload());
        if (event.id() != null) message.put("id", event.id().toString());
        messagingTemplate.convertAndSend(ROUND_TOPIC_PREFIX + roundId, message);
    }

    public void broadcastRoundUpdated(UUID roundId) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "ROUND_UPDATED");
        message.put("timestamp", Instant.now().toString());
        Map<String, Object> payload = new HashMap<>();
        payload.put("roundId", roundId.toString());
        message.put("payload", payload);
        messagingTemplate.convertAndSend(ROUND_TOPIC_PREFIX + roundId, message);
    }
}
```

- [ ] **Step 3: Verify compilation**

Run: `./gradlew build -x test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add src/main/java/ktanesolver/service/BombService.java \
        src/main/java/ktanesolver/service/RoundEventBroadcastService.java
git commit -m "refactor: unify event publishing — BombService uses ApplicationEventPublisher"
```

---

## Task 5: Add fetch-join query for round loading (N+1 fix)

**Problem:** `GET /rounds/{id}` triggers an N+1 query storm — one query per bomb, plus one per collection (modules, indicators, portPlates).

**Files:**
- Modify: `src/main/java/ktanesolver/repository/RoundRepository.java`
- Modify: `src/main/java/ktanesolver/service/RoundService.java`
- Modify: `src/main/java/ktanesolver/controller/RoundController.java`

- [ ] **Step 1: Add `findByIdWithDetails` to `RoundRepository`**

Replace `RoundRepository.java`:

```java
package ktanesolver.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ktanesolver.entity.RoundEntity;

public interface RoundRepository extends JpaRepository<RoundEntity, UUID> {

    @Query("""
            SELECT DISTINCT r FROM RoundEntity r
            LEFT JOIN FETCH r.bombs b
            LEFT JOIN FETCH b.modules
            LEFT JOIN FETCH b.portPlates
            LEFT JOIN FETCH b.indicators
            WHERE r.id = :id
            """)
    Optional<RoundEntity> findByIdWithDetails(@Param("id") UUID id);
}
```

- [ ] **Step 2: Add `getRoundWithDetails` to `RoundService`**

In `RoundService.java`, add the following method after `getRound`:

```java
@Transactional(readOnly = true)
public RoundEntity getRoundWithDetails(UUID roundId) {
    return roundRepo.findByIdWithDetails(roundId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
}
```

- [ ] **Step 3: Update `RoundController.getRound` to use the new method**

In `RoundController.java`, change the `getRound` endpoint:

Old:
```java
@GetMapping("/{roundId}")
public RoundEntity getRound(@PathVariable UUID roundId) {
    return roundService.getRound(roundId);
}
```

New:
```java
@GetMapping("/{roundId}")
public RoundEntity getRound(@PathVariable UUID roundId) {
    return roundService.getRoundWithDetails(roundId);
}
```

- [ ] **Step 4: Verify compilation**

Run: `./gradlew build -x test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/ktanesolver/repository/RoundRepository.java \
        src/main/java/ktanesolver/service/RoundService.java \
        src/main/java/ktanesolver/controller/RoundController.java
git commit -m "perf: eliminate N+1 queries on GET /rounds/{id} with fetch join"
```

---

## Task 6: Single DB lookup per solve + remove redundant `roundRepo.save`

**Problem:** `ModuleService.solveModule` issues 3 separate queries (round, bomb, module) and then unconditionally saves the round even if solvers don't modify it.

**Files:**
- Modify: `src/main/java/ktanesolver/repository/ModuleRepository.java`
- Modify: `src/main/java/ktanesolver/service/ModuleService.java`

- [ ] **Step 1: Add `findByIdWithBombAndRound` to `ModuleRepository`**

Replace `ModuleRepository.java` (keep `findByIdWithBomb` from Task 1, add new query):

```java
package ktanesolver.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ktanesolver.entity.ModuleEntity;

public interface ModuleRepository extends JpaRepository<ModuleEntity, UUID> {

    @Query("SELECT m FROM ModuleEntity m JOIN FETCH m.bomb WHERE m.id = :id")
    Optional<ModuleEntity> findByIdWithBomb(@Param("id") UUID id);

    @Query("""
            SELECT m FROM ModuleEntity m
            JOIN FETCH m.bomb b
            JOIN FETCH b.round
            WHERE m.id = :id
            """)
    Optional<ModuleEntity> findByIdWithBombAndRound(@Param("id") UUID id);
}
```

- [ ] **Step 2: Update `ModuleService.solveModule` to use a single DB lookup and drop `roundRepo.save`**

Replace the `solveModule` method in `ModuleService.java`. The full updated class (note: `roundRepo` and `bombRepo` are removed from fields since `solveModule` no longer needs them directly — `bombRepo` stays for `addModules`):

```java
package ktanesolver.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.AddModulesRequest;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.event.BombModuleUpdatedEvent;
import ktanesolver.event.RoundStateChangedEvent;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.registry.ModuleSolverRegistry;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.ModuleRepository;
import ktanesolver.utils.Json;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final BombRepository bombRepo;
    private final ModuleRepository moduleRepo;
    private final ModuleSolverRegistry registry;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public List<ModuleEntity> addModules(UUID bombId, AddModulesRequest req) {
        BombEntity bomb = bombRepo.findById(bombId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bomb not found"));
        List<ModuleEntity> modules = new ArrayList<>();
        for (int i = 0; i < req.count(); i++) {
            ModuleEntity m = new ModuleEntity();
            m.setBomb(bomb);
            m.setType(req.type());
            m.setSolved(false);
            modules.add(m);
        }
        modules = moduleRepo.saveAll(modules);
        eventPublisher.publishEvent(new RoundStateChangedEvent(this, bomb.getRound().getId()));
        return modules;
    }

    private static void ensureModuleInBombAndRound(ModuleEntity module, UUID bombId, UUID roundId) {
        if (!module.getBomb().getId().equals(bombId) || !module.getBomb().getRound().getId().equals(roundId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found in this bomb/round");
        }
    }

    @Transactional
    public SolveResult<?> solveModule(UUID roundId, UUID bombId, UUID moduleId, Map<String, Object> rawInput) {
        ModuleEntity module = moduleRepo.findByIdWithBombAndRound(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        BombEntity bomb = module.getBomb();
        RoundEntity round = bomb.getRound();
        ensureModuleInBombAndRound(module, bombId, roundId);
        ModuleSolver<?, ?> solver = registry.get(module.getType());
        ModuleInput input = Json.mapper().convertValue(rawInput, solver.inputType());
        SolveResult<?> result = invokeSolver(solver, round, bomb, module, input);
        moduleRepo.save(module);
        eventPublisher.publishEvent(new BombModuleUpdatedEvent(this, round.getId(), bombId, module.getId(), module.getType(), module.isSolved()));
        return result;
    }

    @SuppressWarnings("unchecked")
    private <I extends ModuleInput, O extends ModuleOutput> SolveResult<O> invokeSolver(ModuleSolver<I, O> solver, RoundEntity round, BombEntity bomb, ModuleEntity module, ModuleInput input) {
        return solver.solve(round, bomb, module, (I) input);
    }
}
```

- [ ] **Step 3: Verify compilation**

Run: `./gradlew build -x test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add src/main/java/ktanesolver/repository/ModuleRepository.java \
        src/main/java/ktanesolver/service/ModuleService.java
git commit -m "perf: single DB lookup per solve, remove redundant roundRepo.save"
```

---

## Task 7: Remove redundant `refreshRound` calls from the frontend store

**Problem:** `addBomb`, `configureBomb`, and `addModules` in `useRoundStore` each fire a full `GET /rounds/{id}` after already updating local state from the API response, causing 2–3 unnecessary roundtrips per setup flow.

**Files:**
- Modify: `ktanesolver-frontend/src/store/useRoundStore.ts`

- [ ] **Step 1: Remove `void get().refreshRound(roundId)` from `addBomb`**

In `useRoundStore.ts`, find `addBomb`. Remove these lines (around line 329–330):

```typescript
const roundId = get().round?.id;
if (roundId) void get().refreshRound(roundId);
```

The method after the change ends with `return bomb;` directly inside the try block.

- [ ] **Step 2: Remove `void get().refreshRound(roundIdAfterConfig)` from `configureBomb`**

In `useRoundStore.ts`, find `configureBomb`. Remove these lines (around line 368–369):

```typescript
const roundIdAfterConfig = get().round?.id;
if (roundIdAfterConfig) void get().refreshRound(roundIdAfterConfig);
```

- [ ] **Step 3: Remove `void get().refreshRound(roundIdAfterModules)` from `addModules`**

In `useRoundStore.ts`, find `addModules`. Remove these lines (around line 414–415):

```typescript
const roundIdAfterModules = get().round?.id;
if (roundIdAfterModules) void get().refreshRound(roundIdAfterModules);
```

- [ ] **Step 4: Verify TypeScript build**

```bash
cd ktanesolver-frontend && npm run build
```

Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
cd .. && git add ktanesolver-frontend/src/store/useRoundStore.ts
git commit -m "perf: remove redundant refreshRound calls after addBomb/configureBomb/addModules"
```

---

## Task 8: Cache `@ModuleInfo` annotation in `AbstractModuleSolver`

**Problem:** `getType()` and `getCatalogInfo()` both call `getClass().getAnnotation(ModuleInfo.class)` on every invocation, including during every solve dispatch.

**Files:**
- Create: `src/test/java/ktanesolver/logic/AbstractModuleSolverTest.java`
- Modify: `src/main/java/ktanesolver/logic/AbstractModuleSolver.java`

- [ ] **Step 1: Write a failing test for annotation caching**

Create `src/test/java/ktanesolver/logic/AbstractModuleSolverTest.java`:

```java
package ktanesolver.logic;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;

class AbstractModuleSolverTest {

    @ModuleInfo(
        type = ModuleType.WIRES,
        id = "wires",
        name = "Wires",
        category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
        description = "Cut the right wire",
        tags = {}
    )
    static class AnnotatedSolver extends AbstractModuleSolver<ModuleInput, ModuleOutput> {
        @Override
        protected SolveResult<ModuleOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ModuleInput input) {
            return success(new ModuleOutput() {});
        }
    }

    static class UnannotatedSolver extends AbstractModuleSolver<ModuleInput, ModuleOutput> {
        @Override
        protected SolveResult<ModuleOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ModuleInput input) {
            return success(new ModuleOutput() {});
        }
    }

    @Test
    void getType_returnsModuleTypeFromAnnotation() {
        AnnotatedSolver solver = new AnnotatedSolver();
        assertThat(solver.getType()).isEqualTo(ModuleType.WIRES);
    }

    @Test
    void getType_calledMultipleTimes_returnsConsistentResult() {
        AnnotatedSolver solver = new AnnotatedSolver();
        assertThat(solver.getType()).isEqualTo(solver.getType());
    }

    @Test
    void getCatalogInfo_returnsCorrectName() {
        AnnotatedSolver solver = new AnnotatedSolver();
        assertThat(solver.getCatalogInfo().name()).isEqualTo("Wires");
    }

    @Test
    void unannotatedSolver_throwsIllegalStateExceptionOnConstruction() {
        assertThatThrownBy(UnannotatedSolver::new)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("ModuleSolver must be annotated with @ModuleInfo");
    }
}
```

- [ ] **Step 2: Run the test to verify it fails (unannotated case passes, others fail because annotation is re-read rather than cached — tests run but `UnannotatedSolver` doesn't throw on construction yet)**

Run: `./gradlew test --tests "ktanesolver.logic.AbstractModuleSolverTest"`
Expected: `unannotatedSolver_throwsIllegalStateExceptionOnConstruction` FAILS (no exception on construction currently).

- [ ] **Step 3: Cache `ModuleInfo` in `AbstractModuleSolver` and validate at construction time**

Replace `AbstractModuleSolver.java`:

```java
package ktanesolver.logic;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.utils.Json;

public abstract class AbstractModuleSolver<I extends ModuleInput, O extends ModuleOutput> implements ModuleSolver<I, O> {

    private final ModuleInfo moduleInfo;

    protected AbstractModuleSolver() {
        ModuleInfo info = getClass().getAnnotation(ModuleInfo.class);
        if (info == null) {
            throw new IllegalStateException("ModuleSolver must be annotated with @ModuleInfo: " + getClass().getName());
        }
        this.moduleInfo = info;
    }

    @Override
    public ModuleType getType() {
        return moduleInfo.type();
    }

    @Override
    @SuppressWarnings("unchecked")
    public Class<I> inputType() {
        return (Class<I>) extractGenericType(getClass(), 0);
    }

    @Override
    public ModuleCatalogDto getCatalogInfo() {
        return new ModuleCatalogDto(
            moduleInfo.id(),
            moduleInfo.name(),
            moduleInfo.category(),
            moduleInfo.type().name(),
            List.of(moduleInfo.tags()),
            moduleInfo.description(),
            moduleInfo.hasInput(),
            moduleInfo.hasOutput(),
            moduleInfo.checkFirst()
        );
    }

    @Override
    public final SolveResult<O> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, I input) {
        SolveResult<O> result = doSolve(round, bomb, module, input);
        if (result instanceof SolveSuccess<O> success) {
            handleSuccess(module, success);
        }
        return result;
    }

    protected abstract SolveResult<O> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, I input);

    protected final SolveResult<O> success(O output) {
        return new SolveSuccess<>(output, true);
    }

    protected final SolveResult<O> success(O output, boolean solved) {
        return new SolveSuccess<>(output, solved);
    }

    protected final SolveResult<O> failure(String message) {
        return new SolveFailure<>(message);
    }

    private void handleSuccess(ModuleEntity module, SolveSuccess<O> success) {
        Map<String, Object> convertedValue = Json.mapper().convertValue(success.output(), new TypeReference<>() {});
        convertedValue.forEach(module.getSolution()::put);
        module.setSolved(success.solved());
    }

    protected final void storeState(ModuleEntity module, String key, Object value) {
        if (value != null) {
            module.getState().put(key, value);
        }
    }

    protected final void storeState(ModuleEntity module, Map<String, Object> stateMap) {
        if (stateMap != null) {
            stateMap.forEach((key, value) -> storeState(module, key, value));
        }
    }

    protected final <T> void storeTypedState(ModuleEntity module, T state) {
        if (state != null) {
            module.setState(state);
        }
    }

    @SuppressWarnings("unchecked")
    private static Class<?> extractGenericType(Class<?> clazz, int index) {
        Type superclass = clazz.getGenericSuperclass();
        while (superclass instanceof Class<?>) {
            superclass = ((Class<?>) superclass).getGenericSuperclass();
        }
        if (superclass instanceof ParameterizedType parameterizedType) {
            Type[] typeArgs = parameterizedType.getActualTypeArguments();
            if (index < typeArgs.length && typeArgs[index] instanceof Class<?> typeClass) {
                return typeClass;
            }
        }
        throw new IllegalStateException("Cannot determine generic type for " + clazz.getName());
    }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `./gradlew test --tests "ktanesolver.logic.AbstractModuleSolverTest"`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/test/java/ktanesolver/logic/AbstractModuleSolverTest.java \
        src/main/java/ktanesolver/logic/AbstractModuleSolver.java
git commit -m "perf: cache @ModuleInfo annotation in AbstractModuleSolver, validate at construction"
```

---

## Task 9: Drop the per-module-type check constraint migration pattern

**Problem:** Every new module type requires a migration that drops and re-creates the full `modules_type_check` constraint. There are 16 such files (V2–V16). One final migration removes it permanently — Hibernate's enum mapping handles type validation at the application layer.

**Files:**
- Create: `src/main/resources/db/migration/V17__drop_module_type_check_constraint.sql`

- [ ] **Step 1: Create the migration file**

Create `src/main/resources/db/migration/V17__drop_module_type_check_constraint.sql`:

```sql
-- Drop the manually maintained modules_type_check constraint.
-- @Enumerated(EnumType.STRING) in ModuleEntity rejects unknown values at the application
-- layer before they reach the database, making the DB-level constraint redundant.
-- Future module types no longer require a dedicated migration file.
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_type_check;
```

- [ ] **Step 2: Verify Flyway picks it up**

Start PostgreSQL (`docker-compose up -d`), then run:

```bash
./gradlew bootRun
```

Watch for: `Successfully applied 1 migration to schema "public"` with version `17`.
Stop the app after verifying (`Ctrl+C`).

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/migration/V17__drop_module_type_check_constraint.sql
git commit -m "chore: drop modules_type_check constraint — no more per-module-type migrations needed"
```

---

## Task 10: Replace hardcoded `moduleManualNames` with catalog store

**Problem:** `useRoundStore.ts` has a 50-entry hardcoded map of module type → display name used to build manual URLs. The module catalog (`GET /modules`) already returns this name for every module. The two can drift out of sync.

**Files:**
- Create: `ktanesolver-frontend/src/store/useCatalogStore.ts`
- Modify: `ktanesolver-frontend/src/store/useRoundStore.ts`
- Modify: `ktanesolver-frontend/src/App.tsx`

- [ ] **Step 1: Create `useCatalogStore.ts`**

Create `ktanesolver-frontend/src/store/useCatalogStore.ts`:

```typescript
import { create } from "zustand";
import { type ModuleCatalogItem } from "../types";
import { api } from "../lib/api";

type CatalogStoreState = {
    catalog: ModuleCatalogItem[];
    loaded: boolean;
};

type CatalogStoreActions = {
    fetchCatalog: () => Promise<void>;
};

export const useCatalogStore = create<CatalogStoreState & CatalogStoreActions>()((set) => ({
    catalog: [],
    loaded: false,
    fetchCatalog: async () => {
        const { data } = await api.get<ModuleCatalogItem[]>("/modules");
        set({ catalog: data, loaded: true });
    },
}));
```

- [ ] **Step 2: Initialize the catalog store in `App.tsx`**

In `App.tsx`, add the import and a `useEffect` to trigger the fetch. Updated `App.tsx`:

```typescript
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useCatalogStore } from "./store/useCatalogStore";

const MainPage = lazy(() => import("./pages/MainPage"));
const SetupPage = lazy(() => import("./pages/SetupPage"));
const SolvePage = lazy(() => import("./pages/SolvePage"));
const RoundsPage = lazy(() => import("./pages/RoundsPage"));

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm text-base-content/70">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const fetchCatalog = useCatalogStore((s) => s.fetchCatalog);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <MainPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/round/:roundId/setup"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SetupPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/setup"
              element={<Navigate to="/" replace />}
            />
            <Route
              path="/rounds"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <RoundsPage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route
              path="/solve/:roundId"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoadingFallback />}>
                    <SolvePage />
                  </Suspense>
                </ErrorBoundary>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 3: Replace `moduleManualNames` and `attachManualUrl` in `useRoundStore.ts`**

In `useRoundStore.ts`:

a) Add this import at the top of the file (after existing imports):

```typescript
import { useCatalogStore } from "./useCatalogStore";
```

b) Delete the entire `moduleManualNames` constant (lines 62–110 in the original file — the `Record<ModuleType, string>` object).

c) Replace the `attachManualUrl` function:

Old:
```typescript
const attachManualUrl = (moduleType: ModuleType) => {
    const moduleName = moduleManualNames[moduleType];
    if (!moduleName) {
        console.warn(`No manual name found for module type: ${moduleType}`);
        return undefined;
    }
    return `https://ktane.timwi.de/HTML/${moduleName.replaceAll(" ", "%20")}.html`;
};
```

New:
```typescript
const attachManualUrl = (moduleType: ModuleType): string | undefined => {
    const { catalog } = useCatalogStore.getState();
    const item = catalog.find((m) => m.type === moduleType);
    if (!item) {
        console.warn(`No catalog entry found for module type: ${moduleType}`);
        return undefined;
    }
    return `https://ktane.timwi.de/HTML/${item.name.replaceAll(" ", "%20")}.html`;
};
```

- [ ] **Step 4: Verify TypeScript build**

```bash
cd ktanesolver-frontend && npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
cd .. && git add ktanesolver-frontend/src/store/useCatalogStore.ts \
                 ktanesolver-frontend/src/store/useRoundStore.ts \
                 ktanesolver-frontend/src/App.tsx
git commit -m "refactor: replace hardcoded moduleManualNames with catalog store"
```

---

## Task 11: Replace DCL with `@PostConstruct` + use `.toList()` in `ModuleCatalogService`

**Problem:** The service uses manual double-checked locking (`volatile` + `synchronized`) to lazily initialize a list that is fully deterministic at startup. Two `.collect(Collectors.toList())` calls can use Java 16's `.toList()`.

**Files:**
- Modify: `src/main/java/ktanesolver/service/ModuleCatalogService.java`

- [ ] **Step 1: Replace `ModuleCatalogService.java`**

```java
package ktanesolver.service;

import jakarta.annotation.PostConstruct;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.registry.ModuleSolverRegistry;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModuleCatalogService {

    private final ModuleSolverRegistry solverRegistry;
    private List<ModuleCatalogDto> cachedModules;

    public ModuleCatalogService(ModuleSolverRegistry solverRegistry) {
        this.solverRegistry = solverRegistry;
    }

    @PostConstruct
    private void init() {
        this.cachedModules = solverRegistry.getAllSolvers().stream()
                .map(ModuleSolver::getCatalogInfo)
                .toList();
    }

    public List<ModuleCatalogDto> getAllModules(String categoryFilter, String searchTerm) {
        List<ModuleCatalogDto> filtered = cachedModules;

        if (categoryFilter != null && !categoryFilter.isEmpty()) {
            ModuleCatalogDto.ModuleCategory category = ModuleCatalogDto.ModuleCategory.valueOf(categoryFilter.toUpperCase());
            filtered = filtered.stream()
                    .filter(m -> m.category() == category)
                    .toList();
        }

        if (searchTerm != null && !searchTerm.isEmpty()) {
            String searchLower = searchTerm.toLowerCase();
            filtered = filtered.stream()
                    .filter(m -> m.name().toLowerCase().contains(searchLower)
                            || m.description().toLowerCase().contains(searchLower)
                            || m.tags().stream().anyMatch(t -> t.toLowerCase().contains(searchLower)))
                    .toList();
        }

        return filtered;
    }
}
```

- [ ] **Step 2: Verify compilation**

Run: `./gradlew build -x test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add src/main/java/ktanesolver/service/ModuleCatalogService.java
git commit -m "refactor: replace double-checked locking with @PostConstruct in ModuleCatalogService"
```

---

## Task 12: `BombEntity` helper cleanup

**Problem 1:** `isLastDigitOdd()` duplicates the stream logic already in `getLastDigit()`.
**Problem 2:** `isIndicatorLit`/`isIndicatorUnlit` use a null-check pattern that can be expressed more cleanly with `Boolean.TRUE.equals`.

**Files:**
- Create: `src/test/java/ktanesolver/entity/BombEntityTest.java`
- Modify: `src/main/java/ktanesolver/entity/BombEntity.java`

- [ ] **Step 1: Write failing tests**

Create `src/test/java/ktanesolver/entity/BombEntityTest.java`:

```java
package ktanesolver.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

class BombEntityTest {

    private BombEntity bomb(String serial) {
        BombEntity b = new BombEntity();
        b.setSerialNumber(serial);
        b.setIndicators(Map.of());
        return b;
    }

    @Test
    void getLastDigit_returnsLastNumericCharacter() {
        assertThat(bomb("AB1CD2").getLastDigit()).isEqualTo(2);
    }

    @Test
    void getLastDigit_serialWithNoDigits_returnsZero() {
        assertThat(bomb("ABCDEF").getLastDigit()).isEqualTo(0);
    }

    @Test
    void isLastDigitOdd_delegatesToGetLastDigit() {
        assertThat(bomb("AB3").isLastDigitOdd()).isTrue();
        assertThat(bomb("AB4").isLastDigitOdd()).isFalse();
    }

    @Test
    void isLastDigitEven_isOppositeOfOdd() {
        assertThat(bomb("AB4").isLastDigitEven()).isTrue();
        assertThat(bomb("AB3").isLastDigitEven()).isFalse();
    }

    @Test
    void isIndicatorLit_trueWhenLit() {
        BombEntity b = new BombEntity();
        b.setSerialNumber("AA1AA1");
        b.setIndicators(Map.of("SND", true, "CLR", false));
        assertThat(b.isIndicatorLit("SND")).isTrue();
        assertThat(b.isIndicatorLit("CLR")).isFalse();
        assertThat(b.isIndicatorLit("BOB")).isFalse();
    }

    @Test
    void isIndicatorUnlit_trueWhenUnlit() {
        BombEntity b = new BombEntity();
        b.setSerialNumber("AA1AA1");
        b.setIndicators(Map.of("SND", true, "CLR", false));
        assertThat(b.isIndicatorUnlit("CLR")).isTrue();
        assertThat(b.isIndicatorUnlit("SND")).isFalse();
        assertThat(b.isIndicatorUnlit("BOB")).isFalse();
    }
}
```

- [ ] **Step 2: Run to confirm tests pass with current code (they should — verifying baseline)**

Run: `./gradlew test --tests "ktanesolver.entity.BombEntityTest"`
Expected: all tests PASS (the logic is already correct, we're just cleaning up the implementation).

- [ ] **Step 3: Update `BombEntity` helpers**

In `BombEntity.java`, replace `isLastDigitOdd`, `isLastDigitEven`, `isIndicatorLit`, and `isIndicatorUnlit`:

Old:
```java
@JsonIgnore
public boolean isLastDigitOdd() {
    return serialNumber.chars().filter(Character::isDigit).map(c -> c - '0').reduce((a, b) -> b).orElse(0) % 2 == 1;
}

@JsonIgnore
public boolean isLastDigitEven() {
    return !isLastDigitOdd();
}
```

New:
```java
@JsonIgnore
public boolean isLastDigitOdd() {
    return getLastDigit() % 2 == 1;
}

@JsonIgnore
public boolean isLastDigitEven() {
    return getLastDigit() % 2 == 0;
}
```

Old:
```java
@JsonIgnore
public boolean isIndicatorLit(String indicator) {
    Boolean indicatorStatus = indicators.getOrDefault(indicator, null);
    return indicatorStatus != null && indicatorStatus;
}

@JsonIgnore
public boolean isIndicatorUnlit(String indicator) {
    Boolean indicatorStatus = indicators.getOrDefault(indicator, null);
    return indicatorStatus != null && !indicatorStatus;
}
```

New:
```java
@JsonIgnore
public boolean isIndicatorLit(String indicator) {
    return Boolean.TRUE.equals(indicators.get(indicator));
}

@JsonIgnore
public boolean isIndicatorUnlit(String indicator) {
    return Boolean.FALSE.equals(indicators.get(indicator));
}
```

- [ ] **Step 4: Run tests again to confirm they still pass**

Run: `./gradlew test --tests "ktanesolver.entity.BombEntityTest"`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/test/java/ktanesolver/entity/BombEntityTest.java \
        src/main/java/ktanesolver/entity/BombEntity.java
git commit -m "refactor: simplify BombEntity digit and indicator helper methods"
```

---

## Task 13: `@Transactional(readOnly = true)` on read methods in `RoundService`

**Problem:** `getRound` and `getAllRounds` are annotated `@Transactional` without `readOnly = true`, missing an optimization hint to the JDBC driver and connection pool.

**Files:**
- Modify: `src/main/java/ktanesolver/service/RoundService.java`

- [ ] **Step 1: Add `readOnly = true` to read-only methods in `RoundService`**

In `RoundService.java`, update the three read-only transaction annotations:

Find and replace:

```java
@Transactional
public RoundEntity getRound(UUID roundId) {
```
→
```java
@Transactional(readOnly = true)
public RoundEntity getRound(UUID roundId) {
```

```java
@Transactional
public List<RoundEntity> getAllRounds() {
```
→
```java
@Transactional(readOnly = true)
public List<RoundEntity> getAllRounds() {
```

```java
@Transactional
public RoundEntity getRoundWithDetails(UUID roundId) {
```
→
```java
@Transactional(readOnly = true)
public RoundEntity getRoundWithDetails(UUID roundId) {
```

- [ ] **Step 2: Verify compilation**

Run: `./gradlew build -x test`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Run all tests**

Run: `./gradlew test`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/main/java/ktanesolver/service/RoundService.java
git commit -m "chore: use readOnly = true on read-only transactions in RoundService"
```

---

## Self-Review Notes

- Task 1 adds `findByIdWithBomb`; Task 6 adds `findByIdWithBombAndRound`. Both are present in the final `ModuleRepository` shown in Task 6's Step 1.
- `RoundStateChangedEvent` is created in Task 3 and used in both Task 3 (`ModuleService.addModules`) and Task 4 (`BombService`). The listener is wired in Task 4.
- `ModuleService` loses `RoundRepository` as a dependency in Task 6 (it was the last user of `roundRepo` in the solve path; `addModules` accesses round ID via lazy-loaded `bomb.getRound()` within its own `@Transactional`).
- `RoundService.getRoundWithDetails` added in Task 5 needs `readOnly = true` added in Task 13 — apply both annotations when you reach Task 13.
- The `BombEntityTest` in Task 12 tests both old and new implementation — tests pass before and after the change (they verify behavior, not implementation).
