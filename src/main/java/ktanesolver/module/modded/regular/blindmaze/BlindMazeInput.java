package ktanesolver.module.modded.regular.blindmaze;

import ktanesolver.logic.ModuleInput;

public record BlindMazeInput(
	ButtonColor north,
	ButtonColor east,
	ButtonColor south,
	ButtonColor west
) implements ModuleInput {
	public enum ButtonColor { RED, GREEN, BLUE, GRAY, YELLOW }
}
