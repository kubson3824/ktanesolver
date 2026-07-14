package ktanesolver.module.modded.regular.webdesign;

import ktanesolver.logic.ModuleOutput;

public record WebDesignOutput(
	String site,
	String colorTarget,
	int rawScore,
	int adjustedScore,
	int digitalRoot,
	String answer
) implements ModuleOutput {}
