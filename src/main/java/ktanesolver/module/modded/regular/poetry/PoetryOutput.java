package ktanesolver.module.modded.regular.poetry;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record PoetryOutput(int stage, List<String> correctWords, List<Integer> correctIndexes) implements ModuleOutput {}
