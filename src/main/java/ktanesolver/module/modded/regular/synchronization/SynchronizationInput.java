package ktanesolver.module.modded.regular.synchronization;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SynchronizationInput(int displayNumber, List<Integer> speeds) implements ModuleInput {}
