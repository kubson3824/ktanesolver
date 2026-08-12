package ktanesolver.module.modded.regular.symboliccoordinates;

import ktanesolver.logic.ModuleOutput;

public record SymbolicCoordinatesOutput(int stage, String coordinate, boolean confirmed) implements ModuleOutput {}
