package ktanesolver.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.registry.ModuleSolverRegistry;
import ktanesolver.repository.BombRepository;
import ktanesolver.repository.ModuleRepository;
import ktanesolver.repository.RoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final RoundRepository roundRepo;
    private final BombRepository bombRepo;
    private final ModuleRepository moduleRepo;
    private final ModuleSolverRegistry registry;
    private final ObjectMapper mapper;

    @Transactional
    public SolveResult<?> solveModule(UUID roundId, UUID bombId, UUID moduleId, Map<String, Object> rawInput) {
        RoundEntity round = roundRepo.findById(roundId).orElseThrow();

        BombEntity bomb = bombRepo.findById(bombId).orElseThrow();

        ModuleEntity module = moduleRepo.findById(moduleId).orElseThrow();

        ModuleSolver<?, ?> solver = registry.get(module.getType());

        ModuleInput input = mapper.convertValue(rawInput, solver.inputType());

        SolveResult<?> result = invokeSolver(solver, round, bomb, module, input);

        moduleRepo.save(module);
        roundRepo.save(round);

        return result;
    }

    @SuppressWarnings("unchecked")
    private <I extends ModuleInput, O extends ModuleOutput> SolveResult<O> invokeSolver(ModuleSolver<I, O> solver, RoundEntity round, BombEntity bomb, ModuleEntity module, ModuleInput input) {
        return solver.solve(round, bomb, module, (I) input);
    }
}
