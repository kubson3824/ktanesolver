package ktanesolver.module.modded.regular.modulusmanipulation;

import ktanesolver.logic.ModuleOutput;

public record ModulusManipulationOutput(int startingNumber, int otherUnsolvedModules, int answer, String submission, int minutesRemaining) implements ModuleOutput {}
