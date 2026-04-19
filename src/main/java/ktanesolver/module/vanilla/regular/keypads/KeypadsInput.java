
package ktanesolver.module.vanilla.regular.keypads;

import java.util.List;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.shared.keypad.KeypadSymbol;

public record KeypadsInput(List<KeypadSymbol> symbols) implements ModuleInput {
}
