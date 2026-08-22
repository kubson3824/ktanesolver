package ktanesolver.module.modded.regular.digitstring;

import ktanesolver.logic.ModuleOutput;

public record DigitStringOutput(long answer, String expression, int serialPosition, String rule) implements ModuleOutput {}
