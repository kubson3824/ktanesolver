package ktanesolver.module.vanilla.regular.memory;

import java.util.List;

public record MemoryState(int stage, List<MemoryEntry> history) {
}
