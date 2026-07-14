package ktanesolver.module.modded.regular.colormath;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ColorMathOutput(int baseNumber, int operand, int answer, List<String> colors) implements ModuleOutput {
}
