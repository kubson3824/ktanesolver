package ktanesolver.module.modded.regular.flags;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record FlagsOutput(
	FlagsCountry answerCountry,
	List<FlagsCountry> sortedCountries,
	String appliedRule
) implements ModuleOutput {
}
