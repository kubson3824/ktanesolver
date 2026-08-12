package ktanesolver.module.modded.regular.spinningbuttons;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SpinningButtonsOutput(List<ButtonResult> pressOrder) implements ModuleOutput {
	public record ButtonResult(int position, String color, String character, int value) {
	}
}
