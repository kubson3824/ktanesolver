package ktanesolver.module.modded.regular.backgrounds;

import ktanesolver.logic.ModuleOutput;

public record FaultyBackgroundsOutput(
	String correctButton,
	int targetCount,
	int faultyRule,
	String letterPair,
	int firstBackgroundsRule,
	int secondBackgroundsRule
) implements ModuleOutput {}
