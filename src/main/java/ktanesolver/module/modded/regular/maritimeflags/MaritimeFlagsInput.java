package ktanesolver.module.modded.regular.maritimeflags;

import ktanesolver.logic.ModuleInput;

public record MaritimeFlagsInput(String callsign, Integer signalledBearing) implements ModuleInput {}
