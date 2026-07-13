package ktanesolver.module.modded.regular.simonscreams;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SimonScreamsInput(
	int stage,
	List<SimonScreamsColor> clockwiseColors,
	List<SimonScreamsColor> flashes
) implements ModuleInput {}
