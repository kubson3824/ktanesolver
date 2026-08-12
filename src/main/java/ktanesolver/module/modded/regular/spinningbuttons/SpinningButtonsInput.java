package ktanesolver.module.modded.regular.spinningbuttons;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SpinningButtonsInput(List<Button> buttons) implements ModuleInput {
	public record Button(String color, String character) {
	}
}
