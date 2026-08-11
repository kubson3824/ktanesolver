package ktanesolver.module.modded.regular.horriblememory;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record HorribleMemoryInput(int stage, int display, List<Button> buttons, boolean restartAttempt) implements ModuleInput {
	public record Button(int label, HorribleMemoryColor color) {}
}
