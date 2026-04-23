package ktanesolver.module.modded.regular.perspectivepegs;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record PerspectivePegsInput(
	List<Peg> pegs,
	List<List<String>> candidateSequences
) implements ModuleInput {
	public record Peg(String color, Integer sides) {
	}
}
