
package ktanesolver.module.vanilla.regular.keypads;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record KeypadsOutput(List<KeypadSymbol> pressOrder) implements ModuleOutput {
}
