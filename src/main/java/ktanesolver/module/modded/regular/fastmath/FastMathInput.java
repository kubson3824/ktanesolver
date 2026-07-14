package ktanesolver.module.modded.regular.fastmath;

import ktanesolver.logic.ModuleInput;

public record FastMathInput(Action action, String leftLetter, String rightLetter) implements ModuleInput {
	public enum Action { SOLVE_STAGE, RESET, COMPLETE }
}
