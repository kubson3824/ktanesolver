package ktanesolver.module.vanilla.regular.memory;

import ktanesolver.logic.ModuleInput;

import java.util.List;

public record MemoryInput(int display, List<Integer> labels) implements ModuleInput {
}
