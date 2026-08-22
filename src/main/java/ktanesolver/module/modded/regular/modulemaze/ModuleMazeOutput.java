package ktanesolver.module.modded.regular.modulemaze;

import ktanesolver.logic.ModuleOutput;

public record ModuleMazeOutput(String startingIcon, String destinationIcon, String route, int moveCount) implements ModuleOutput {}
