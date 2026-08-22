package ktanesolver.module.modded.regular.stackem;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record StackemInput(List<Integer> targetSums) implements ModuleInput {}
