package ktanesolver.module.modded.regular.ledgrid;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record LedGridInput(List<Color> colors) implements ModuleInput {
	public enum Color { RED, BLUE, YELLOW, GREEN, ORANGE, PINK, PURPLE, WHITE, UNLIT }
}
