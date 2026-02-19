package ktanesolver.module.modded.regular.cruelpianokeys;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record CruelPianoKeysInput(
	List<CruelPianoKeysSymbol> symbols,
	Integer minutesRemaining
) implements ModuleInput {
}
