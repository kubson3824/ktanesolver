package ktanesolver.module.modded.regular.logicgates;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record LogicGatesInput(List<Boolean> inputs, List<Boolean> outputs) implements ModuleInput {
	public enum Gate { AND, OR, XOR, NAND, NOR, XNOR }
}
