package ktanesolver.module.vanilla.regular.memory;

import java.util.List;

public record MemoryState(List<Integer> displayHistory, List<MemoryStep> solutionHistory) {

}

