package ktanesolver.module.vanilla.regular.memory;

import ktanesolver.logic.ModuleOutput;

public record MemoryOutput(int stage, String instruction, boolean completed) implements ModuleOutput {
}
