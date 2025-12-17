package ktanesolver.registry;

import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.logic.ModuleSolver;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ModuleSolverRegistry {

    private final Map<ModuleType, ModuleSolver<?, ?>> solvers;

    public ModuleSolverRegistry(List<ModuleSolver<?, ?>> solverList) {
        this.solvers = solverList.stream().collect(Collectors.toMap(ModuleSolver::getType, s -> s));
    }

    @SuppressWarnings("unchecked")
    public <I extends ModuleInput, O extends ModuleOutput> ModuleSolver<I, O> get(ModuleType type) {
        return (ModuleSolver<I, O>) solvers.get(type);
    }
}
