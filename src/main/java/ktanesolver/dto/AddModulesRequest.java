package ktanesolver.dto;

import ktanesolver.enums.ModuleType;

public record AddModulesRequest(ModuleType type, int count) {
}
