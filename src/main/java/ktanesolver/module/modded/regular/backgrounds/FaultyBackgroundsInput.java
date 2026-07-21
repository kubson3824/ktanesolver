package ktanesolver.module.modded.regular.backgrounds;

import ktanesolver.logic.ModuleInput;

public record FaultyBackgroundsInput(
	String backingColor,
	String leftButtonColor,
	String rightButtonColor,
	String leftButtonLabel,
	String rightButtonLabel,
	String counterBehavior
) implements ModuleInput {}
