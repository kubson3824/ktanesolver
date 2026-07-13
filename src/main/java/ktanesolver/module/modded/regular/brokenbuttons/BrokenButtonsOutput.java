package ktanesolver.module.modded.regular.brokenbuttons;

import ktanesolver.logic.ModuleOutput;

public record BrokenButtonsOutput(
	String action,
	Integer row,
	Integer column,
	String label,
	String submitSide,
	int pressedCount
) implements ModuleOutput {}
