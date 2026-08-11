package ktanesolver.module.modded.regular.reversemorse;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ReverseMorseInput(
	List<Observation> firstMessage,
	List<Observation> secondMessage,
	int currentStage
) implements ModuleInput {
	public record Observation(String symbol, String color) {}
}
