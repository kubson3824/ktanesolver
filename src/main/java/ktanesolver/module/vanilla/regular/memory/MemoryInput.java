package ktanesolver.module.vanilla.regular.memory;

import ktanesolver.logic.ModuleInput;

import java.util.List;

public record MemoryInput(int stage, int display, List<Integer> labels) implements ModuleInput {
}
