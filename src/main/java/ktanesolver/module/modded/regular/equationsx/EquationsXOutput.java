package ktanesolver.module.modded.regular.equationsx;

import ktanesolver.logic.ModuleOutput;

public record EquationsXOutput(Integer answer, boolean submitNothing, String displayedSymbol, String twitchCommand) implements ModuleOutput {}
