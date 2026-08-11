package ktanesolver.module.modded.regular.accumulation;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record AccumulationOutput(List<Integer> answers, int currentAnswer, int currentStage, List<String> actions) implements ModuleOutput {}
