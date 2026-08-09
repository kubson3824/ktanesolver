package ktanesolver.module.modded.regular.maritimeflags;

import ktanesolver.logic.ModuleOutput;

public record MaritimeFlagsOutput(int callsignBearing, int finalBearing, String direction) implements ModuleOutput {}
