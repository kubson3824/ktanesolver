
package ktanesolver.module.modded.regular.roundkeypad;

import java.util.List;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.shared.keypad.KeypadSymbol;

public record RoundKeypadInput(List<KeypadSymbol> symbols) implements ModuleInput {
}
