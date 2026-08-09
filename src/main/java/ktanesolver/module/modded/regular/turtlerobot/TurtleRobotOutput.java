package ktanesolver.module.modded.regular.turtlerobot;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record TurtleRobotOutput(String shape, List<Integer> bugLines) implements ModuleOutput {}
