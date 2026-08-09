package ktanesolver.module.modded.regular.turtlerobot;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record TurtleRobotInput(List<String> commands) implements ModuleInput {}
