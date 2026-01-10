package ktanesolver.dto;

import java.util.List;

public record ModuleCatalogDto(
    String id,
    String name,
    ModuleCategory category,
    String type,  // Changed from enum to string to support dynamic modules
    List<String> tags,
    String description,
    boolean isSolvable,
    boolean hasSolver  // Indicates if this module has a solver implementation
) {
    public enum ModuleCategory {
        VANILLA_REGULAR,
        VANILLA_NEEDY,
        MODDED_REGULAR,
        MODDED_NEEDY
    }
}
