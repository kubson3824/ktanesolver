package ktanesolver.module.modded.regular.daylightdirections;

import ktanesolver.logic.ModuleInput;

public record DaylightDirectionsInput(String activeSun, String arrowColor, String currentDirection) implements ModuleInput {}
