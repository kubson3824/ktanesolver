package ktanesolver.module.modded.regular.coordinates;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.coordinates.CoordinatesSolver.Cell;
import ktanesolver.module.modded.regular.coordinates.CoordinatesSolver.GridSize;

class CoordinatesSolverTest {
	private final CoordinatesSolver solver = new CoordinatesSolver();

	@Test
	void parsesEveryManualLocationFormat() {
		Cell target = new Cell(2, 3);
		assertThat(List.of(
			"1 up from 6 o'clock",
			"2 east, 1 north from south-west corner",
			"1 down from middle center",
			"[2,3]", "C4", "<3, 2>", "4, 3", "(2,1)", "C-2", "“1, 2”", "2/3",
			"[17]", "18th", "#8", "十四"
		).stream().map(clue -> CoordinatesSolver.parseCell(clue, 5, 5))).containsOnly(target);
	}

	@Test
	void parsesEveryGridSizeFormat() {
		assertThat(CoordinatesSolver.parseSize("15")).isEqualTo(new GridSize(5, 3, "15"));
		assertThat(CoordinatesSolver.parseSize("(15)")).isEqualTo(new GridSize(3, 5, "(15)"));
		assertThat(CoordinatesSolver.parseSize("4x7")).isEqualTo(new GridSize(4, 7, "4×7"));
		assertThat(CoordinatesSolver.parseSize("5 by 4")).isEqualTo(new GridSize(4, 5, "5 by 4"));
		assertThat(CoordinatesSolver.parseSize("30*5")).isEqualTo(new GridSize(6, 5, "30*5"));
		assertThat(CoordinatesSolver.parseSize("35:7")).isEqualTo(new GridSize(7, 5, "35 : 7"));
	}

	@Test
	void findsTheDuplicateAndStoresTheSouvenirGridSize() {
		ModuleEntity module = new ModuleEntity();
		CoordinatesInput input = new CoordinatesInput(List.of(
			"25*5", "C4", "#8", "[0,0]", "A2", "<2, 1>", "2, 3", "(4,0)", "B-1"
		));

		var result = solver.solve(new RoundEntity(), new BombEntity(), module, input);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<CoordinatesOutput>) result).output())
			.isEqualTo(new CoordinatesOutput(5, 5, List.of("C4", "#8")));
		assertThat(module.getState()).containsEntry("gridSizeClue", "25*5");
	}
}
