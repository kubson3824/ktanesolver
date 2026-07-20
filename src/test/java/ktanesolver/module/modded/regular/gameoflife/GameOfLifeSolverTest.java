package ktanesolver.module.modded.regular.gameoflife;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.gameoflife.GameOfLifeInput.Cell;
import ktanesolver.module.modded.regular.gameoflife.GameOfLifeInput.Color;

class GameOfLifeSolverTest {
	@Test
	void appliesTheSimultaneousNonWrappingGeneration() {
		List<Cell> cells = grid();
		for (int index : List.of(7, 8, 9)) cells.set(index, cell(Color.WHITE));

		GameOfLifeOutput output = output(new GameOfLifeSimpleSolver(), bomb(), new ModuleEntity(), new GameOfLifeInput(cells, false));

		assertThat(whiteIndexes(output)).containsExactly(2, 8, 14);
	}

	@Test
	void convertsCruelColorsStoresSouvenirAndHonorsBob() {
		BombEntity bomb = bomb();
		bomb.setAaBatteryCount(1);
		bomb.setStrikes(1);
		bomb.setIndicators(Map.of("FRK", true));
		List<Cell> cells = grid();
		cells.set(7, cell(Color.RED));
		cells.set(8, new Cell(Color.BLACK, Color.ORANGE));
		cells.set(9, cell(Color.YELLOW));
		ModuleEntity module = new ModuleEntity();

		GameOfLifeOutput output = output(new GameOfLifeCruelSolver(), bomb, module, new GameOfLifeInput(cells, false));

		assertThat(whiteIndexes(output)).containsExactly(2, 8, 14);
		assertThat(module.getState().get("colorCombinations"))
			.isEqualTo(List.of("Solid Red", "Black/Orange", "Solid Yellow"));

		BombEntity bob = bomb();
		bob.setAaBatteryCount(6);
		bob.setIndicators(Map.of("BOB", false));
		assertThat(output(new GameOfLifeCruelSolver(), bob, new ModuleEntity(), new GameOfLifeInput(grid(), null)).submitInitial()).isTrue();
	}

	private static List<Cell> grid() {
		return new ArrayList<>(java.util.Collections.nCopies(48, cell(Color.BLACK)));
	}

	private static Cell cell(Color color) {
		return new Cell(color, color);
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setIndicators(new HashMap<>());
		return bomb;
	}

	private static List<Integer> whiteIndexes(GameOfLifeOutput output) {
		return java.util.stream.IntStream.range(0, output.whiteCells().size()).filter(output.whiteCells()::get).boxed().toList();
	}

	@SuppressWarnings("unchecked")
	private static GameOfLifeOutput output(
		ktanesolver.logic.ModuleSolver<GameOfLifeInput, GameOfLifeOutput> solver,
		BombEntity bomb, ModuleEntity module, GameOfLifeInput input
	) {
		return ((SolveSuccess<GameOfLifeOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}
}
