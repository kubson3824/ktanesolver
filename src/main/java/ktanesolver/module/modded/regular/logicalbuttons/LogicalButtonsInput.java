package ktanesolver.module.modded.regular.logicalbuttons;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record LogicalButtonsInput(String operator, List<Button> buttons) implements ModuleInput {
	public record Button(String color, String label) {}
}
