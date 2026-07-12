package ktanesolver.module.modded.regular.tictactoe;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class TicTacToeSolverTest {
	private final TicTacToeSolver solver = new TicTacToeSolver();

	@Test
	void followsTheTableAndTracksPasses() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setIndicators(new HashMap<>());
		ModuleEntity module = new ModuleEntity();
		List<String> board = List.of("5", "4", "6", "3", "1", "2", "9", "7", "8");

		TicTacToeOutput first = solve(bomb, module, board, "X");
		assertThat(first).isEqualTo(new TicTacToeOutput("PRESS", 3, 6, 2, false));

		module.getState().put("row", 1);
		List<String> almostLine = List.of("X", "X", "3", "O", "4", "5", "6", "O", "7");
		assertThat(solve(bomb, module, almostLine, "X").action()).isEqualTo("PASS");
		assertThat(solve(bomb, module, almostLine, "X").automaticPlacement()).isTrue();
		assertThat(module.getState()).containsEntry("row", 2).containsEntry("passes", 0);

		ModuleEntity finalModule = new ModuleEntity();
		finalModule.getState().put("row", 1);
		finalModule.getState().put("passes", 1);
		List<String> finalBoard = List.of("X", "X", "3", "O", "O", "O", "X", "X", "O");
		assertThat(solve(bomb, finalModule, finalBoard, "X").automaticPlacement()).isTrue();
		assertThat(finalModule.getState().get("board")).isEqualTo(List.of("X", "X", "X", "O", "O", "O", "X", "X", "O"));
	}

	@SuppressWarnings("unchecked")
	private TicTacToeOutput solve(BombEntity bomb, ModuleEntity module, List<String> board, String piece) {
		return ((SolveSuccess<TicTacToeOutput>)solver.solve(
			new RoundEntity(), bomb, module, new TicTacToeInput(board, piece, false))).output();
	}
}
