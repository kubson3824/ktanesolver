package ktanesolver.module.modded.regular.minesweeper;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MinesweeperInput(List<String> colors, List<String> board) implements ModuleInput {}
