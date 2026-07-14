package ktanesolver.module.modded.regular.neutralization;

import ktanesolver.logic.ModuleOutput;

public record NeutralizationOutput(
	String acidFormula,
	String baseName,
	String baseFormula,
	double acidConcentration,
	int baseConcentration,
	int drops,
	boolean filterOn
) implements ModuleOutput {}
