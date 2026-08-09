package ktanesolver.module.modded.regular.binarytree;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record BinaryTreeOutput(
	List<Integer> presses,
	List<Integer> referenceNodes,
	List<String> orderings
) implements ModuleOutput {
}
