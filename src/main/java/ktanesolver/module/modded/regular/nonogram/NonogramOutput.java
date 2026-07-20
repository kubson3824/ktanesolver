package ktanesolver.module.modded.regular.nonogram;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record NonogramOutput(
	List<List<Integer>> columnClues,
	List<List<Integer>> rowClues,
	List<String> filledCells
) implements ModuleOutput {}
