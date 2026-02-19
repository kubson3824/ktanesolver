
package ktanesolver.module.modded.regular.logic;

public record LogicRowInput(
	char letter1,
	char letter2,
	char letter3,
	LogicConnective connective1,
	LogicConnective connective2,
	boolean negated1,
	boolean negated2,
	boolean negated3,
	boolean leftGrouped  // true = (A op1 B) op2 C, false = A op1 (B op2 C)
) {}
