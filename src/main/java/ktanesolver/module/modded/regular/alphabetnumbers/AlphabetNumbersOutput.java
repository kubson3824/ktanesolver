package ktanesolver.module.modded.regular.alphabetnumbers;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record AlphabetNumbersOutput(int stage, List<Integer> presses, int nextStage) implements ModuleOutput {}
