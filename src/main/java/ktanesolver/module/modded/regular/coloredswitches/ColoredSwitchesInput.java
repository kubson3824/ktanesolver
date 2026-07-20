package ktanesolver.module.modded.regular.coloredswitches;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ColoredSwitchesInput(
	List<SwitchColor> switchColors,
	boolean[] currentSwitches,
	boolean[] ledPositions
) implements ModuleInput {
	public enum SwitchColor { RED, GREEN, BLUE, PURPLE, ORANGE, TURQUOISE }
}
