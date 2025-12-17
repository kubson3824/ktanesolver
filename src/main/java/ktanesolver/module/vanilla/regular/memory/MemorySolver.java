package ktanesolver.module.vanilla.regular.memory;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
public class MemorySolver implements ModuleSolver<MemoryInput, MemoryOutput> {

    @Override
    public ModuleType getType() {
        return ModuleType.MEMORY;
    }

    @Override
    public Class<MemoryInput> inputType() {
        return MemoryInput.class;
    }

    @Override
    public SolveResult<MemoryOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, MemoryInput input) {
        // load state
        // compute instruction
        // update state
        // emit events
        // return output
        return null;
    }
}
