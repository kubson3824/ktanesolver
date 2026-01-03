package ktanesolver.module.modded.regular.semaphore;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SemaphoreInput(List<FlagAngles> sequence) implements ModuleInput {
}
