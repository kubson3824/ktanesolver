package ktanesolver.module.modded.regular.sequences;

import ktanesolver.logic.ModuleOutput;

public record SequencesOutput(int coefficient, int constant, String formula) implements ModuleOutput {}
