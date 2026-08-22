package ktanesolver.module.modded.regular.stackem;

import java.util.List;
import java.util.Map;
import ktanesolver.logic.ModuleOutput;

public record StackemOutput(Map<String, Integer> cubeValues, List<List<String>> stacks) implements ModuleOutput {}
