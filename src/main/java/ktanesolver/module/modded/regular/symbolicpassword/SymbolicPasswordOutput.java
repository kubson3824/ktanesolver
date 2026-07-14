package ktanesolver.module.modded.regular.symbolicpassword;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.shared.keypad.KeypadSymbol;

public record SymbolicPasswordOutput(List<KeypadSymbol> targetSymbols, List<String> moves) implements ModuleOutput {
}
