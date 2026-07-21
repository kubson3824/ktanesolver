package ktanesolver.module.modded.regular.poetry;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record PoetryInput(String girl, List<String> words, boolean resetStage) implements ModuleInput {}
