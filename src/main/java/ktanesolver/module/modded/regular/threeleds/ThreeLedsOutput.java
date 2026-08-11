package ktanesolver.module.modded.regular.threeleds;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ThreeLedsOutput(List<Boolean> targetStates, List<Integer> togglePositions) implements ModuleOutput {}
