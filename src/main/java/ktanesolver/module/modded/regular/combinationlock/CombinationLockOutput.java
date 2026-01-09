package ktanesolver.module.modded.regular.combinationlock;

import ktanesolver.logic.ModuleOutput;

public record CombinationLockOutput(
    boolean solved,
    String instruction,
    int firstNumber,     // First number of combination (0-19)
    int secondNumber,    // Second number of combination (0-19)
    int thirdNumber      // Third number of combination (0-19)
) implements ModuleOutput {
}
