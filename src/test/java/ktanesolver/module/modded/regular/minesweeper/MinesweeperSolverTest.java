package ktanesolver.module.modded.regular.minesweeper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class MinesweeperSolverTest {
	private final MinesweeperSolver solver = new MinesweeperSolver();

	@Test
	void findsTheStartingCellAndBothKindsOfForcedMove() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("AB1CD0");
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		List<String> colors = new ArrayList<>(java.util.Collections.nCopies(80, ""));
		colors.set(0, "red");
		colors.set(1, "orange");
		colors.set(2, "yellow");
		colors.set(3, "green");
		colors.set(4, "blue");

		SolveSuccess<MinesweeperOutput> start = success(solver.solve(
			new RoundEntity(), bomb, module, new MinesweeperInput(colors, null)));
		assertThat(start.solved()).isFalse();
		assertThat(start.output().startingCell()).isEqualTo("D1");
		assertThat(start.output().startingColor()).isEqualTo("green");

		SolveSuccess<MinesweeperOutput> moves = success(solver.solve(new RoundEntity(), bomb, module,
			new MinesweeperInput(colors, List.of(
				"11??????", "1???????", "????????", "????????", "????????",
				"????????", "????????", "????????", "????????", "????????"))));
		assertThat(moves.output().mines()).containsExactly("B2");
		assertThat(moves.output().safeCells()).containsExactly("C1", "C2", "A3", "B3");
		assertThat(moves.solved()).isFalse();
	}

	@SuppressWarnings("unchecked")
	private static SolveSuccess<MinesweeperOutput> success(Object result) {
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return (SolveSuccess<MinesweeperOutput>)result;
	}
}
