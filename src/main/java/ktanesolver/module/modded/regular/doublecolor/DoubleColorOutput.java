package ktanesolver.module.modded.regular.doublecolor;

import ktanesolver.logic.ModuleOutput;

public record DoubleColorOutput(int stage, int digit, int nextStage) implements ModuleOutput {}
