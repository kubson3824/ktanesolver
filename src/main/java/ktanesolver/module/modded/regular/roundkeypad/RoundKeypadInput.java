
package ktanesolver.module.modded.regular.roundkeypad;

import java.util.List;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.vanilla.regular.keypads.KeypadSymbol;

public record RoundKeypadInput(List<KeypadSymbol> symbols) implements ModuleInput {
}
