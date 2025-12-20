
package ktanesolver.module.vanilla.regular.memory;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MemoryInput(int stage, int display, List<Integer> labels) implements ModuleInput {
}
