package ktanesolver.module.modded.regular.fizzbuzz;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record FizzBuzzOutput(List<Action> actions) implements ModuleOutput {
	public enum Action { NUMBER, FIZZ, BUZZ, FIZZBUZZ }
}
