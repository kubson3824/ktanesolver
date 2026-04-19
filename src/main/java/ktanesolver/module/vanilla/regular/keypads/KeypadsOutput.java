
package ktanesolver.module.vanilla.regular.keypads;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.shared.keypad.KeypadSymbol;

public record KeypadsOutput(List<KeypadSymbol> pressOrder) implements ModuleOutput {
}
