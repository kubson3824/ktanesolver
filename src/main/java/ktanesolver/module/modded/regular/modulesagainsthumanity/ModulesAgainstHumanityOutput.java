package ktanesolver.module.modded.regular.modulesagainsthumanity;

import ktanesolver.logic.ModuleOutput;

public record ModulesAgainstHumanityOutput(
	String phase,
	int secondaryBlackPosition,
	int secondaryWhitePosition,
	Integer finalBlackPosition,
	Integer finalWhitePosition
) implements ModuleOutput {}
