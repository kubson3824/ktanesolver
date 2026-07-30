package ktanesolver.module.modded.regular.graffitinumbers;

import static ktanesolver.module.modded.regular.graffitinumbers.GraffitiNumbersInput.Color.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.graffitinumbers.GraffitiNumbersInput.Color;

class GraffitiNumbersSolverTest {
	private final GraffitiNumbersSolver solver = new GraffitiNumbersSolver();

	@Test
	void appliesAllRulesInEachPossibleTraversalAndValidatesTheGrid() {
		List<Integer> firstGrid = List.of(1, 9, 8, 2, 7, 6, 3, 5, 4);
		List<Integer> secondGrid = List.of(9, 7, 5, 1, 2, 3, 8, 4, 6);

		assertResult(firstGrid, colors(BLUE, RED, BLUE, GREEN, GREEN, BLUE, YELLOW, YELLOW, YELLOW),
			List.of(1, 4, 6, 7, 8), List.of(1, 9, 6, 5, 3));
		assertResult(secondGrid, colors(RED, RED, GREEN, RED, RED, BLUE, BLUE, YELLOW, YELLOW),
			List.of(7, 5, 3, 2), List.of(2, 3, 6, 5));
		assertResult(firstGrid, colors(RED, GREEN, GREEN, GREEN, BLUE, BLUE, BLUE, BLUE, YELLOW),
			List.of(6, 7, 9, 1), List.of(6, 5, 2, 1));
		assertResult(secondGrid, colors(GREEN, BLUE, GREEN, RED, GREEN, BLUE, YELLOW, GREEN, YELLOW),
			List.of(3, 2, 9, 8, 7, 5), List.of(6, 5, 1, 7, 2, 3));

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new GraffitiNumbersInput(List.of(1, 1, 2, 3, 4, 5, 6, 7, 8),
				colors(RED, GREEN, BLUE, YELLOW, RED, GREEN, BLUE, YELLOW, RED))))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new GraffitiNumbersInput(firstGrid, null))).isInstanceOf(SolveFailure.class);
	}

	private void assertResult(
		List<Integer> numbers, List<Color> colors, List<Integer> expectedNumbers, List<Integer> expectedPositions
	) {
		@SuppressWarnings("unchecked")
		GraffitiNumbersOutput output = ((SolveSuccess<GraffitiNumbersOutput>)solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), new GraffitiNumbersInput(numbers, colors)
		)).output();
		assertThat(output.pressNumbers()).containsExactlyElementsOf(expectedNumbers);
		assertThat(output.buttonPositions()).containsExactlyElementsOf(expectedPositions);
	}

	private static List<Color> colors(Color... colors) {
		return List.of(colors);
	}
}
