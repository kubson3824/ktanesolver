package ktanesolver.module.modded.regular.pianokeys;

import ktanesolver.logic.ModuleInput;

import java.util.List;

public record PianoKeysInput(List<PianoKeysSymbol> symbols) implements ModuleInput {
}
