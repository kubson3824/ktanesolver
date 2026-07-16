package ktanesolver.module.modded.regular.perspectivepegs;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record PerspectivePegsOutput(
	String keyColor,
	List<String> currentSequence,
	List<String> keySequence,
	String viewPosition,
	List<String> pressPositions
) implements ModuleOutput {
}
