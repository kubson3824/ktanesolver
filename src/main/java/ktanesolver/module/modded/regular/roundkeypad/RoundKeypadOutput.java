package ktanesolver.module.modded.regular.roundkeypad;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.vanilla.regular.keypads.KeypadSymbol;

public record RoundKeypadOutput(List<KeypadSymbol> symbolsToPress) implements ModuleOutput {
}
