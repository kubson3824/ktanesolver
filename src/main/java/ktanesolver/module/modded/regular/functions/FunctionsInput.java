package ktanesolver.module.modded.regular.functions;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record FunctionsInput(
	Integer leftNumber,
	String letter,
	Integer rightNumber,
	List<Observation> observations
) implements ModuleInput {
	public record Observation(Integer a, Integer b, Long result) {}
}
