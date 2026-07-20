package ktanesolver.module.modded.regular.mastermindsimple;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MastermindSimpleOutput(
	List<String> nextGuess,
	int remainingCandidates,
	boolean submit
) implements ModuleOutput {
}
