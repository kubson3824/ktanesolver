package ktanesolver.module.modded.regular.hunting;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record HuntingInput(int stage, String leftSymbol, String rightSymbol, List<String> buttonSymbols) implements ModuleInput {}
