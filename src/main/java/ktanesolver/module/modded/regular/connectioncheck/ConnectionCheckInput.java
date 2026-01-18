package ktanesolver.module.modded.regular.connectioncheck;

import ktanesolver.logic.ModuleInput;

import java.util.List;

public record ConnectionCheckInput(List<NumberPair> pairs) implements ModuleInput {
    public record NumberPair(int one, int two) {}
}
