package ktanesolver.module.modded.regular.mastermindcruel;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MastermindCruelInput(List<Attempt> attempts) implements ModuleInput {
	public record Attempt(
		List<String> guess,
		String leftColor,
		int leftNumber,
		String rightColor,
		int rightNumber,
		int solvedModules,
		int strikes
	) {
	}
}
