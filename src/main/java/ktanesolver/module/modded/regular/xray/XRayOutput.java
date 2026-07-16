package ktanesolver.module.modded.regular.xray;

import ktanesolver.logic.ModuleOutput;

public record XRayOutput(int button, int destinationRow, int destinationColumn) implements ModuleOutput {}
