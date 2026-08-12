package ktanesolver.module.modded.regular.buttonsequence;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ButtonSequenceInput(int panel, List<Button> buttons) implements ModuleInput {
	public enum Color { RED, YELLOW, BLUE, WHITE }
	public enum Label { ABORT, DETONATE, HOLD, PRESS }
	public enum Shape { CIRCLE, SQUARE, HEXAGON }

	public record Button(Color color, Label label, Shape shape) {}
}
