package ktanesolver.module.modded.regular.synonyms;

import ktanesolver.logic.ModuleOutput;

public record SynonymsOutput(String targetWord, int pairNumber, boolean noMatch) implements ModuleOutput {}
