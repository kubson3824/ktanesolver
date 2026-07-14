package ktanesolver.module.modded.regular.symbolicpassword;

import java.util.List;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.shared.keypad.KeypadSymbol;

public record SymbolicPasswordInput(List<KeypadSymbol> symbols) implements ModuleInput {
}
