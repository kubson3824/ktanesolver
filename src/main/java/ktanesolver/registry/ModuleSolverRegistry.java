
package ktanesolver.registry;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.logic.ModuleSolver;

@Component
public class ModuleSolverRegistry {

	private final Map<ModuleType, ModuleSolver<?, ?>> solvers;
	private static Map<ModuleType, ModuleCatalogDto> catalog = Map.of();

	public ModuleSolverRegistry(List<ModuleSolver<?, ?>> solverList) {
		this.solvers = solverList.stream().collect(Collectors.toMap(ModuleSolver::getType, s -> s));
		catalog = solverList.stream().collect(Collectors.toUnmodifiableMap(ModuleSolver::getType, ModuleSolver::getCatalogInfo));
	}

	@SuppressWarnings ("unchecked")
	public <I extends ModuleInput, O extends ModuleOutput> ModuleSolver<I, O> get(ModuleType type) {
		return (ModuleSolver<I, O>)solvers.get(type);
	}

	public Collection<ModuleSolver<?, ?>> getAllSolvers() {
		return solvers.values();
	}

	public static ModuleCatalogDto catalogInfo(ModuleType type) {
		return catalog.get(type);
	}
}
