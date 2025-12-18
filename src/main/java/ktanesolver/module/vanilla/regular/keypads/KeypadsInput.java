package ktanesolver.module.vanilla.regular.keypads;

import ktanesolver.logic.ModuleInput;

import java.util.List;

public record KeypadsInput(List<KeypadSymbol> symbols) implements ModuleInput {
}
