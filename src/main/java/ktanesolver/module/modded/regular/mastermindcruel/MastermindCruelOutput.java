package ktanesolver.module.modded.regular.mastermindcruel;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MastermindCruelOutput(
	List<String> nextGuess,
	int remainingCandidates,
	boolean submit
) implements ModuleOutput {
}
