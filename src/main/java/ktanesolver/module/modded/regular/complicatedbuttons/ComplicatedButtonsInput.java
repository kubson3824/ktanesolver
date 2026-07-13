package ktanesolver.module.modded.regular.complicatedbuttons;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ComplicatedButtonsInput(List<Button> buttons) implements ModuleInput {
	public record Button(Label label, boolean red, boolean blue) {}

	public enum Label {
		PRESS, HOLD, DETONATE
	}
}
