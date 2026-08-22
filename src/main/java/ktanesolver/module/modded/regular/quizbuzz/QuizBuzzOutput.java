package ktanesolver.module.modded.regular.quizbuzz;

import ktanesolver.logic.ModuleOutput;

public record QuizBuzzOutput(int stageNumber, StageType stageType, String answer, int fizzPosition, int buzzPosition, int completedStages) implements ModuleOutput {
    public enum StageType { NUMBER, FIZZ, BUZZ, FIZZ_BUZZ }
}
