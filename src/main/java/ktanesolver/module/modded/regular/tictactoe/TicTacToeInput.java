package ktanesolver.module.modded.regular.tictactoe;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record TicTacToeInput(List<String> board, String nextPiece, boolean strike) implements ModuleInput {}
