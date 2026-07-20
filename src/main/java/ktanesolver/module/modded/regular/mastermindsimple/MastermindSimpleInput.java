package ktanesolver.module.modded.regular.mastermindsimple;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MastermindSimpleInput(List<Attempt> attempts) implements ModuleInput {
	public record Attempt(List<String> guess, int exact, int misplaced) {
	}
}
