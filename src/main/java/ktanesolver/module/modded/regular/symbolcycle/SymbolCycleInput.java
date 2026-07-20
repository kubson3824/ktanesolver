package ktanesolver.module.modded.regular.symbolcycle;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SymbolCycleInput(
	Mode mode,
	long referenceCycle,
	List<String> leftCycle,
	List<String> rightCycle,
	long displayedCycle,
	List<String> leftSelectable,
	List<String> rightSelectable,
	String leftSymbol,
	String rightSymbol,
	Screen incrementScreen
) implements ModuleInput {
	public enum Mode { RETROTRANSPHASIC, ANTERODIAMETRIC }
	public enum Screen { LEFT, RIGHT }
}
