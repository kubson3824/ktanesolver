package ktanesolver.module.modded.regular.creation;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.creation.CreationInput.Element;

public record CreationOutput(
	int day,
	int totalSteps,
	Element target,
	Element first,
	Element second,
	Element creates
) implements ModuleOutput {}
