
package ktanesolver.module.modded.regular.logic;

public enum LogicConnective {
	AND,    // ∧ Conjunction
	OR,     // ∨ Disjunction
	XOR,    // ⊻ Exclusive disjunction
	NAND,   // | Alternative denial
	NOR,    // ↓ Joint denial
	XNOR,   // ↔ Biconditional
	IMPL_LEFT,  // → Implication (left: A→B false when A true and B false)
	IMPL_RIGHT; // ← Implication (right: A←B false when A false and B true)

	public boolean apply(boolean left, boolean right) {
		return switch (this) {
			case AND -> left && right;
			case OR -> left || right;
			case XOR -> left != right;
			case NAND -> !(left && right);
			case NOR -> !(left || right);
			case XNOR -> left == right;
			case IMPL_LEFT -> !left || right;
			case IMPL_RIGHT -> left || !right;
		};
	}
}
