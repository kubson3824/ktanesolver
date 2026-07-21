package ktanesolver.module.modded.regular.festivepianokeys;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record FestivePianoKeysInput(List<FestivePianoKeysSymbol> symbols) implements ModuleInput {
}
