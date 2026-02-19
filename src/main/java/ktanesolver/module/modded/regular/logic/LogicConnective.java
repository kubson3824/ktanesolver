
package ktanesolver.module.modded.regular.logic;

public enum LogicConnective {
	AND,    // ∧ Conjunction
	OR,     // ∨ Disjunction
	XOR,    // ⊻ Exclusive disjunction
	NAND,   // | Alternative denial
	NOR,    // ↓ Joint denial
	XNOR,   // ↔ Biconditional
	IMPL_LEFT,  // → Implication (left: A→B false when A true and B false)
	IMPL_RIGHT  // ← Implication (right: A←B false when A false and B true)
}
