package ktanesolver.module.modded.regular.colordecoding;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ColorDecodingInput(
	int stage,
	Pattern pattern,
	List<Color> indicatorColors,
	List<Color> display
) implements ModuleInput {
	public enum Color { RED, GREEN, BLUE, YELLOW, PURPLE }
	public enum Pattern { CHECKERED, VERTICAL, HORIZONTAL, SOLID }
}
