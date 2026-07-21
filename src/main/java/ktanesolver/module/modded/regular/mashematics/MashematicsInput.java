package ktanesolver.module.modded.regular.mashematics;

import ktanesolver.logic.ModuleInput;

public record MashematicsInput(
	Integer first,
	Operator firstOperator,
	Integer second,
	Operator secondOperator,
	Integer third
) implements ModuleInput {
	public enum Operator { ADD, SUBTRACT, MULTIPLY }
}
