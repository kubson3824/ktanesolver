package ktanesolver.module.modded.regular.morsebuttons;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MorseButtonsInput(List<Button> buttons) implements ModuleInput {
	public record Button(String color, String morse) {}
}
