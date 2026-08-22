package ktanesolver.module.modded.regular.purgatory;

import ktanesolver.logic.ModuleOutput;

public record PurgatoryOutput(Destination destination, Timing timing, int clickCount) implements ModuleOutput {
    public enum Destination { HEAVEN, HELL, EITHER }
    public enum Timing { NOW, ON_TWO, AT_END }
}
