package ktanesolver.module.modded.regular.daylightdirections;

import ktanesolver.logic.ModuleOutput;

public record DaylightDirectionsOutput(String targetDirection, String turnDirection, int turnCount) implements ModuleOutput {}
