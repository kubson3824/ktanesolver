package ktanesolver.module.modded.regular.semaphore;

import ktanesolver.logic.ModuleOutput;

public record SemaphoreOutput(char missingCharacter, boolean resolved) implements ModuleOutput {
}
