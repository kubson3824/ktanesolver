package ktanesolver.module.modded.regular.quizbuzz;

import ktanesolver.logic.ModuleInput;

public record QuizBuzzInput(int stageNumber, String fizzCategory, String buzzCategory, boolean resetPositions) implements ModuleInput {}
