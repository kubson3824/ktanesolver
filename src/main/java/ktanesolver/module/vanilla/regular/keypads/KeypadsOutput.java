package ktanesolver.module.vanilla.regular.keypads;

import ktanesolver.logic.ModuleOutput;

import java.util.List;

public record KeypadsOutput(List<KeypadSymbol> pressOrder) implements ModuleOutput {
}
