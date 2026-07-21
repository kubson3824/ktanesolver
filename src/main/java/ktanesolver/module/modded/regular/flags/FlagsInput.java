package ktanesolver.module.modded.regular.flags;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record FlagsInput(
	FlagsCountry mainCountry,
	List<FlagsCountry> countries,
	int displayedNumber
) implements ModuleInput {
}
