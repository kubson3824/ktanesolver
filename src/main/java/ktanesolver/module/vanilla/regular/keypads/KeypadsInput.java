
package ktanesolver.module.vanilla.regular.keypads;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record KeypadsInput(List<KeypadSymbol> symbols) implements ModuleInput {
}
