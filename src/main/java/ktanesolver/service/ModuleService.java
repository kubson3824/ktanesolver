
package ktanesolver.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ktanesolver.dto.AddModulesRequest;
import ktanesolver.dto.CompleteModuleRequest;
import ktanesolver.dto.UpdateTwitchCodeRequest;
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

    @Transactional
    public void removeModule(UUID bombId, UUID moduleId) {
        ModuleEntity module = moduleRepo.findByIdWithBomb(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        BombEntity bomb = module.getBomb();
        if (!bomb.getId().equals(bombId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found");
        }

        moduleRepo.delete(module);
        eventPublisher.publishEvent(new RoundStateChangedEvent(this, bomb.getRound().getId()));
    }

    @Transactional
    public void resetModule(UUID bombId, UUID moduleId) {
        ModuleEntity module = moduleRepo.findByIdWithBomb(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        BombEntity bomb = module.getBomb();
        if (!bomb.getId().equals(bombId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found");
        }

        module.setSolved(false);
        module.getState().clear();
        module.getSolution().clear();
        moduleRepo.save(module);
        eventPublisher.publishEvent(new RoundStateChangedEvent(this, bomb.getRound().getId()));
    }

    private static void ensureModuleInBombAndRound(ModuleEntity module, UUID bombId, UUID roundId) {
        if (!module.getBomb().getId().equals(bombId) || !module.getBomb().getRound().getId().equals(roundId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found in this bomb/round");
        }
    }

    private ModuleEntity findModule(UUID bombId, UUID moduleId) {
        ModuleEntity module = moduleRepo.findByIdWithBomb(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        if (!module.getBomb().getId().equals(bombId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found");
        }
        return module;
    }

    private static void ensureVersion(ModuleEntity module, long version) {
        if (module.getVersion() != version) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Module changed; refresh and try again");
        }
    }

    @Transactional
    public ModuleEntity completeModule(UUID bombId, UUID moduleId, CompleteModuleRequest req) {
        ModuleEntity module = findModule(bombId, moduleId);
        if (module.isSolved()) return module;
        ensureVersion(module, req.version());
        module.setSolved(true);
        module = moduleRepo.saveAndFlush(module);
        BombEntity bomb = module.getBomb();
        eventPublisher.publishEvent(new BombModuleUpdatedEvent(this, bomb.getRound().getId(), bombId, moduleId, module.getType(), true));
        return module;
    }

    @Transactional
    public ModuleEntity updateTwitchCode(UUID bombId, UUID moduleId, UpdateTwitchCodeRequest req) {
        ModuleEntity module = findModule(bombId, moduleId);
        ensureVersion(module, req.version());
        String twitchCode = req.twitchCode() == null || req.twitchCode().isBlank()
                ? null
                : req.twitchCode().toLowerCase(Locale.ROOT);
        if (twitchCode != null && moduleRepo.existsByBombIdAndTwitchCodeAndIdNot(bombId, twitchCode, moduleId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Twitch selector is already assigned on this bomb");
        }
        module.setTwitchCode(twitchCode);
        module = moduleRepo.saveAndFlush(module);
        eventPublisher.publishEvent(new RoundStateChangedEvent(this, module.getBomb().getRound().getId()));
        return module;
    }

    @Transactional
    public SolveResult<?> solveModule(UUID roundId, UUID bombId, UUID moduleId, Map<String, Object> rawInput) {
        ModuleEntity module = moduleRepo.findByIdWithBombAndRound(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        BombEntity bomb = module.getBomb();
        RoundEntity round = bomb.getRound();
        ensureModuleInBombAndRound(module, bombId, roundId);
        ModuleSolver<?, ?> solver = registry.get(module.getType());
        if (solver == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_IMPLEMENTED,
                    "No solver is registered for module type " + module.getType());
        }
        ModuleInput input;
        try {
            input = Json.mapper().convertValue(rawInput, solver.inputType());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid solve input for module type " + module.getType(),
                    exception);
        }
        boolean physicallySolved = module.isSolved();
        SolveResult<?> result = invokeSolver(solver, round, bomb, module, input);
        module.setSolved(physicallySolved);
        moduleRepo.saveAndFlush(module);
        eventPublisher.publishEvent(new BombModuleUpdatedEvent(this, round.getId(), bombId, module.getId(), module.getType(), module.isSolved()));
        return result;
    }

    @SuppressWarnings("unchecked")
    private <I extends ModuleInput, O extends ModuleOutput> SolveResult<O> invokeSolver(ModuleSolver<I, O> solver, RoundEntity round, BombEntity bomb, ModuleEntity module, ModuleInput input) {
        return solver.solve(round, bomb, module, (I) input);
    }
}
