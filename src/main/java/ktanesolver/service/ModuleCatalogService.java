
package ktanesolver.service;

import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.registry.ModuleSolverRegistry;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ModuleCatalogService {

	private final ModuleSolverRegistry solverRegistry;
	private volatile List<ModuleCatalogDto> cachedModules;

	public ModuleCatalogService(ModuleSolverRegistry solverRegistry) {
		this.solverRegistry = solverRegistry;
	}

	public List<ModuleCatalogDto> getAllModules(String categoryFilter, String searchTerm) {
        List<ModuleCatalogDto> filtered = getCachedModules();

		if(categoryFilter != null && !categoryFilter.isEmpty()) {
			ModuleCatalogDto.ModuleCategory category = ModuleCatalogDto.ModuleCategory.valueOf(categoryFilter.toUpperCase());
			filtered = filtered.stream().filter(m -> m.category() == category).collect(Collectors.toList());
		}

		if(searchTerm != null && !searchTerm.isEmpty()) {
			String searchLower = searchTerm.toLowerCase();
			filtered = filtered.stream()
				.filter(
					m -> m.name().toLowerCase().contains(searchLower) || m.description().toLowerCase().contains(searchLower) || m.tags().stream().anyMatch(t -> t.toLowerCase().contains(searchLower)))
				.collect(Collectors.toList());
		}

		return filtered;
	}

	private List<ModuleCatalogDto> getCachedModules() {
		if(cachedModules == null) {
			synchronized(this) {
				if(cachedModules == null) {
                    cachedModules = new ArrayList<>(getSolverModules());
				}
			}
		}
		return cachedModules;
	}

	private List<ModuleCatalogDto> getSolverModules() {
		return solverRegistry.getAllSolvers().stream().map(ModuleSolver::getCatalogInfo).collect(Collectors.toList());
	}

}
