package ktanesolver.module.modded.regular.graffitinumbers;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record GraffitiNumbersInput(List<Integer> numbers, List<Color> colors) implements ModuleInput {
	public enum Color { RED, GREEN, BLUE, YELLOW }
}
