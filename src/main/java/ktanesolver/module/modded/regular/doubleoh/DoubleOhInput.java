package ktanesolver.module.modded.regular.doubleoh;

import java.util.Map;

import ktanesolver.logic.ModuleInput;

public record DoubleOhInput(
	int displayedNumber,
	Map<Button, Integer> observations
) implements ModuleInput {
	public enum Button {
		SINGLE_VERTICAL, SINGLE_HORIZONTAL, DOUBLE_HORIZONTAL, DOUBLE_VERTICAL, SQUARE
	}
}
