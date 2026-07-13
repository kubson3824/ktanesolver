package ktanesolver.module.modded.regular.modulesagainsthumanity;

import ktanesolver.logic.ModuleInput;

public record ModulesAgainstHumanityInput(
	String initialBlackText,
	String initialWhiteText,
	boolean blackOnLeft,
	Boolean secondaryBlackPresent,
	Boolean secondaryWhitePresent
) implements ModuleInput {}
