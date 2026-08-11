package ktanesolver.module.modded.regular.synchronization;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record SynchronizationOutput(String method, List<SynchronizationStep> steps, int timerDigit) implements ModuleOutput {}
