package ktanesolver.module.modded.regular.tictactoe;

import ktanesolver.logic.ModuleOutput;

public record TicTacToeOutput(String action, Integer position, Integer number, int row, boolean automaticPlacement) implements ModuleOutput {}
