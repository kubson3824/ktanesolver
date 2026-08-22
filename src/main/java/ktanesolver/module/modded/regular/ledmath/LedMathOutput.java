package ktanesolver.module.modded.regular.ledmath;

import ktanesolver.logic.ModuleOutput;

public record LedMathOutput(int valueA, int valueB, String operator, int answer) implements ModuleOutput {}
