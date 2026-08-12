package ktanesolver.module.modded.regular.factorymaze;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record FactoryMazeInput(Integer maze, Integer startRoom, List<String> roomNames, List<Boolean> leftUsesFirstExit) implements ModuleInput {}
