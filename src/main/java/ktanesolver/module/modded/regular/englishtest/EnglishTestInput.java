package ktanesolver.module.modded.regular.englishtest;

import ktanesolver.logic.ModuleInput;

public record EnglishTestInput(String sentence, int questionNumber) implements ModuleInput {}
