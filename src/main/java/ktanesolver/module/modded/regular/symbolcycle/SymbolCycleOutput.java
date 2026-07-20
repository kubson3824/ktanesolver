package ktanesolver.module.modded.regular.symbolcycle;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.symbolcycle.SymbolCycleInput.Mode;
import ktanesolver.module.modded.regular.symbolcycle.SymbolCycleInput.Screen;

public record SymbolCycleOutput(
	Mode mode,
	String leftSymbol,
	String rightSymbol,
	Long targetCycle,
	Screen clickScreen,
	Integer clicks,
	Integer leftClicks,
	Integer rightClicks
) implements ModuleOutput {
}
