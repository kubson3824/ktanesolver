package ktanesolver.module.modded.regular.simonstops;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SimonStopsInput(List<Color> flashedColors, Integer normalPressesCompleted) implements ModuleInput {
	public enum Color { RED, ORANGE, YELLOW, GREEN, BLUE, VIOLET }
}
