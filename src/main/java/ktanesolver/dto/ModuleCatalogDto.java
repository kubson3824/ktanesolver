
package ktanesolver.dto;

import java.util.List;

public record ModuleCatalogDto(
        String id,
        String name,
        ModuleCategory category,
        String type,
        List<String> tags,
        String description,
        boolean hasInput,
        boolean hasOutput,
        boolean checkFirst
) {
    public enum ModuleCategory {
        VANILLA_REGULAR, VANILLA_NEEDY, MODDED_REGULAR, MODDED_NEEDY
    }
}
