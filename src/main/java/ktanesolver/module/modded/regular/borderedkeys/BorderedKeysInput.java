package ktanesolver.module.modded.regular.borderedkeys;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record BorderedKeysInput(int pressedBeforeReset, List<Key> keys) implements ModuleInput {
	public record Key(
		boolean active,
		Color keyColor,
		Color labelColor,
		Color borderColor,
		Integer label,
		Integer display
	) {}

	public enum Color { RED, GREEN, BLUE, CYAN, MAGENTA, YELLOW }
}
