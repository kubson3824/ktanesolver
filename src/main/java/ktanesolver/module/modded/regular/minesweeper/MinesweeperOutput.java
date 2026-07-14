package ktanesolver.module.modded.regular.minesweeper;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MinesweeperOutput(
	String startingCell,
	String startingColor,
	List<String> mines,
	List<String> safeCells
) implements ModuleOutput {}
