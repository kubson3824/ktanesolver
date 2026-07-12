package ktanesolver.module.modded.regular.tictactoe;

import java.util.List;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.TIC_TAC_TOE,
	id = "tic_tac_toe",
	name = "Tic Tac Toe",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine whether to place the next X or O or press PASS",
	tags = {"grid", "x", "o", "pass", "modded"}
)
public class TicTacToeSolver extends AbstractModuleSolver<TicTacToeInput, TicTacToeOutput> {
	private static final int[][] TABLE = {
		{9, 3, 3, 9, 8, 1},
		{5, 6, 6, 7, 1, 2},
		{7, 8, 2, 1, 5, 8},
		{4, 5, 7, 8, 9, 6},
		{1, 4, 1, 6, 7, 3},
		{8, 7, 5, 2, 4, 4},
		{6, 1, 8, 4, 3, 9},
		{2, 2, 9, 5, 2, 5},
		{3, 9, 4, 3, 6, 7},
	};
	private static final int[][] LINES = {
		{0, 1, 2}, {3, 4, 5}, {6, 7, 8},
		{0, 3, 6}, {1, 4, 7}, {2, 5, 8},
		{0, 4, 8}, {2, 4, 6},
	};

	@Override
	protected SolveResult<TicTacToeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TicTacToeInput input
	) {
		if (input.board() == null || input.board().size() != 9) return failure("Board must have exactly 9 cells");
		List<String> board = input.board().stream().map(cell -> cell == null ? "" : cell.trim().toUpperCase()).toList();
		if (board.stream().anyMatch(cell -> !cell.matches("[1-9]|X|O"))) {
			return failure("Every board cell must be X, O, or a number from 1 to 9");
		}
		List<String> numbers = board.stream().filter(cell -> cell.matches("[1-9]")).toList();
		if (numbers.stream().distinct().count() != numbers.size()) {
			return failure("Numbers on the board must be unique");
		}
		String piece = input.nextPiece() == null ? "" : input.nextPiece().trim().toUpperCase();
		if (!piece.equals("X") && !piece.equals("O")) return failure("Next piece must be X or O");

		int filled = (int)board.stream().filter(cell -> cell.equals("X") || cell.equals("O")).count();
		if (filled == 9) return failure("Board is already full");
		int startingRow = startingRow(bomb);
		int row = input.strike() ? startingRow : stateNumber(module, "row", startingRow);
		int passes = input.strike() ? 0 : stateNumber(module, "passes", 0);
		module.getState().put("board", board);
		module.getState().put("nextPiece", piece);
		int column = column(board, piece);
		int number = 0;
		int position = -1;
		int selectedRow = row;
		for (int offset = 0; offset < 9; offset++) {
			selectedRow = (row - 1 + offset) % 9 + 1;
			number = TABLE[selectedRow - 1][column];
			position = board.indexOf(String.valueOf(number));
			if (position >= 0) break;
		}

		if (makesLine(board, position, piece)) {
			boolean automatic = passes == 1;
			module.getState().put("row", automatic ? selectedRow % 9 + 1 : selectedRow);
			module.getState().put("passes", automatic ? 0 : 1);
			if (automatic && filled == 8) {
				List<String> completedBoard = new java.util.ArrayList<>(board);
				completedBoard.set(position, piece);
				module.getState().put("board", completedBoard);
			}
			return success(new TicTacToeOutput("PASS", null, null, selectedRow, automatic), automatic && filled == 8);
		}

		module.getState().put("row", selectedRow % 9 + 1);
		module.getState().put("passes", 0);
		return success(new TicTacToeOutput("PRESS", position + 1, number, selectedRow, false), filled == 8);
	}

	private int startingRow(BombEntity bomb) {
		int[] candidates = bomb.isLastDigitEven()
			? (bomb.hasPort(PortType.PARALLEL) ? new int[]{6, 8} : new int[]{5, 7, 9})
			: (bomb.hasPort(PortType.PARALLEL) ? new int[]{2, 4} : new int[]{1, 3});
		long lit = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		long unlit = bomb.getIndicators().size() - lit;
		return unlit > lit ? candidates[0] : lit > unlit ? candidates[candidates.length - 1] : (candidates[0] + candidates[candidates.length - 1]) / 2;
	}

	private int column(List<String> board, String piece) {
		long xs = board.stream().filter("X"::equals).count();
		long os = board.stream().filter("O"::equals).count();
		return (xs > os ? 0 : xs == os ? 2 : 4) + (piece.equals("O") ? 1 : 0);
	}

	private boolean makesLine(List<String> board, int position, String piece) {
		return java.util.Arrays.stream(LINES).anyMatch(line -> java.util.Arrays.stream(line)
			.allMatch(cell -> cell == position || board.get(cell).equals(piece)));
	}

	private int stateNumber(ModuleEntity module, String key, int fallback) {
		Object value = module.getState().get(key);
		return value instanceof Number number ? number.intValue() : fallback;
	}
}
