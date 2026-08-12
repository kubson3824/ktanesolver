package ktanesolver.module.modded.regular.factorymaze;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record FactoryMazeOutput(String startRoom, List<String> actions, List<String> route) implements ModuleOutput {}
