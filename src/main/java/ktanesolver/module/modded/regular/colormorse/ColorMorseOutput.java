package ktanesolver.module.modded.regular.colormorse;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ColorMorseOutput(
	int answer,
	List<Double> transformedValues,
	String evaluatedExpression,
	List<String> morse
) implements ModuleOutput {
}
