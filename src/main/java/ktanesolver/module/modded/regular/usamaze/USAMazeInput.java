package ktanesolver.module.modded.regular.usamaze;

import ktanesolver.logic.ModuleInput;

public record USAMazeInput(String currentState, String destinationState, String dayOfWeek) implements ModuleInput {}
