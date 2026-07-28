package ktanesolver.module.modded.regular.thewire;

import ktanesolver.logic.ModuleInput;

public record TheWireInput(
	WireColor dial1Color,
	WireColor dial2Color,
	WireColor dial3Color,
	WireColor wireColor,
	Integer displayedNumber,
	Integer initiationCount
) implements ModuleInput {
	public enum WireColor { BLUE, GREEN, GREY, ORANGE, PURPLE, RED }
}
