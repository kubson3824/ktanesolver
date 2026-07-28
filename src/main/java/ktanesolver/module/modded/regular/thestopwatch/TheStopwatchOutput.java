package ktanesolver.module.modded.regular.thestopwatch;

import ktanesolver.logic.ModuleOutput;

public record TheStopwatchOutput(
	int baseRuntimeSeconds,
	int runtimeSeconds,
	String formattedRuntime
) implements ModuleOutput {}
