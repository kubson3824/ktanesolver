package ktanesolver.module.modded.regular.buttongrid;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ButtonGridInput(List<Color> colors) implements ModuleInput {
	public enum Color { RED, BLUE, YELLOW, GREEN }
}
