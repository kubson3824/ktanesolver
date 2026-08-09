package ktanesolver.module.modded.regular.timekeeper;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record TimeKeeperInput(
	Integer displayedNumber,
	Color displayedColor,
	List<Color> ledColors,
	Integer activationMonth
) implements ModuleInput {
	public enum Color { RED, YELLOW, BLUE, GREEN, BLACK, WHITE }
}
