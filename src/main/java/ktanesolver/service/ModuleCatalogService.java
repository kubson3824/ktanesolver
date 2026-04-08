
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
