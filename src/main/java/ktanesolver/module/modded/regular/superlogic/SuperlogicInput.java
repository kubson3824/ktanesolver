package ktanesolver.module.modded.regular.superlogic;

import java.util.List;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.modded.regular.logic.LogicConnective;

public record SuperlogicInput(List<Equation> equations) implements ModuleInput {
	public record Equation(
		char operand1,
		char operand2,
		LogicConnective connective,
		boolean negated1,
		boolean negated2,
		boolean negatedExpression
	) {}
}
