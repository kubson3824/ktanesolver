package ktanesolver.module.modded.regular.manometers;

import ktanesolver.logic.ModuleOutput;

public record ManometersOutput(
	int stage,
	int targetPressure,
	Integer topMaximum,
	Integer bottomLeftMaximum,
	Integer bottomRightMaximum,
	Integer topPressure,
	Integer bottomLeftPressure,
	Integer bottomRightPressure,
	boolean useValve
) implements ModuleOutput {}
