package ktanesolver.module.modded.regular.englishtest;

import ktanesolver.logic.ModuleOutput;

public record EnglishTestOutput(String correctAnswer, int questionNumber) implements ModuleOutput {}
