package ktanesolver.module.modded.regular.equations;

import ktanesolver.logic.ModuleOutput;

public record EquationsOutput(
	int system, String variable, int a, int b, int c, int d, String answer, boolean blank
) implements ModuleOutput {}
