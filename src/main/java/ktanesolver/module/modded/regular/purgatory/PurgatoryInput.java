package ktanesolver.module.modded.regular.purgatory;

import ktanesolver.logic.ModuleInput;

public record PurgatoryInput(int stage, String ledColor, String personName, boolean flickering) implements ModuleInput {}
