package ktanesolver.module.modded.regular.perspectivepegs;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record PerspectivePegsInput(
	List<Peg> pegs
) implements ModuleInput {
	public record Peg(List<String> sideColors) {
	}
}
