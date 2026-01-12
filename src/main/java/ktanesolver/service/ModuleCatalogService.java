package ktanesolver.service;

import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.registry.ModuleSolverRegistry;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ModuleCatalogService {
    
    private final ModuleSolverRegistry solverRegistry;
    private volatile List<ModuleCatalogDto> cachedModules;
    
    public ModuleCatalogService(ModuleSolverRegistry solverRegistry) {
        this.solverRegistry = solverRegistry;
    }
    
    public List<ModuleCatalogDto> getAllModules(String categoryFilter, String searchTerm) {
        List<ModuleCatalogDto> allModules = getCachedModules();
        
        List<ModuleCatalogDto> filtered = allModules;
        
        if (categoryFilter != null && !categoryFilter.isEmpty()) {
            ModuleCatalogDto.ModuleCategory category = 
                ModuleCatalogDto.ModuleCategory.valueOf(categoryFilter.toUpperCase());
            filtered = filtered.stream()
                .filter(m -> m.category() == category)
                .collect(Collectors.toList());
        }
        
        if (searchTerm != null && !searchTerm.isEmpty()) {
            String searchLower = searchTerm.toLowerCase();
            filtered = filtered.stream()
                .filter(m -> m.name().toLowerCase().contains(searchLower) ||
                           m.description().toLowerCase().contains(searchLower) ||
                           m.tags().stream().anyMatch(t -> t.toLowerCase().contains(searchLower)))
                .collect(Collectors.toList());
        }
        
        return filtered;
    }
    
    private List<ModuleCatalogDto> getCachedModules() {
        if (cachedModules == null) {
            synchronized (this) {
                if (cachedModules == null) {
                    List<ModuleCatalogDto> modules = new ArrayList<>();
                    modules.addAll(getSolverModules());
                    modules.addAll(getPlannedModules());
                    cachedModules = modules;
                }
            }
        }
        return cachedModules;
    }
    
    private List<ModuleCatalogDto> getSolverModules() {
        return solverRegistry.getAllSolvers().stream()
            .map(ModuleSolver::getCatalogInfo)
            .collect(Collectors.toList());
    }
    
    private List<ModuleCatalogDto> getPlannedModules() {
        return List.of(
            // Example modded modules - no solvers yet
            new ModuleCatalogDto("bigButton", "Big Button", ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
                "BIG_BUTTON", List.of("modded", "timing"),
                "A modded version of The Button with extra features", true, false),
            new ModuleCatalogDto("alphabets", "Alphabets", ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
                "ALPHABETS", List.of("modded", "puzzle", "word"),
                "Match the alphabets to their correct positions", true, false),
            new ModuleCatalogDto("tChess", "T-Chess", ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
                "T_CHESS", List.of("modded", "puzzle", "strategy"),
                "Solve chess puzzles on the bomb", true, false),
            new ModuleCatalogDto("needyKnobs", "Needy Knobs", ModuleCatalogDto.ModuleCategory.MODDED_NEEDY,
                "NEEDY_KNOBS", List.of("modded", "timing", "rotation"),
                "Turn the knobs to match the pattern before time runs out", true, false),
            new ModuleCatalogDto("safetySafe", "Safety Safe", ModuleCatalogDto.ModuleCategory.MODDED_NEEDY,
                "SAFETY_SAFE", List.of("modded", "timing", "puzzle"),
                "Enter the correct combination before the safe opens", true, false)
        );
    }
}
