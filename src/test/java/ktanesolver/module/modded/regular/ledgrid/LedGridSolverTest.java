package ktanesolver.module.modded.regular.ledgrid;

import static ktanesolver.module.modded.regular.ledgrid.LedGridInput.Color.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.ledgrid.LedGridInput.Color;

class LedGridSolverTest {
	private final LedGridSolver solver = new LedGridSolver();

	@Test
	void followsEveryManualRuleInPriorityOrder() {
		assertAnswers(
			"CDAB", colors(RED, BLUE, YELLOW, GREEN, PINK, PURPLE, WHITE, RED, BLUE),
			"DACB", colors(ORANGE, RED, RED, RED, BLUE, YELLOW, GREEN, PINK, WHITE),
			"BACD", colors(ORANGE, ORANGE, BLUE, BLUE, RED, YELLOW, GREEN, PINK, WHITE),
			"ACDB", colors(ORANGE, RED, BLUE, YELLOW, GREEN, PINK, WHITE, WHITE, WHITE),
			"BCDA", colors(ORANGE, RED, BLUE, YELLOW, GREEN, PINK, PURPLE, WHITE, RED),

			"DCBA", colors(UNLIT, RED, BLUE, YELLOW, GREEN, ORANGE, PINK, PURPLE, WHITE),
			"ADBC", colors(RED, RED, RED, UNLIT, ORANGE, BLUE, YELLOW, GREEN, WHITE),
			"CBAD", colors(RED, BLUE, RED, UNLIT, RED, ORANGE, YELLOW, GREEN, WHITE),
			"BADC", colors(UNLIT, WHITE, ORANGE, ORANGE, GREEN, GREEN, RED, BLUE, PINK),
			"DBAC", colors(UNLIT, ORANGE, ORANGE, GREEN, GREEN, WHITE, WHITE, BLUE, YELLOW),

			"ADCB", colors(UNLIT, UNLIT, PURPLE, PURPLE, PURPLE, RED, BLUE, YELLOW, GREEN),
			"BCAD", colors(UNLIT, UNLIT, ORANGE, ORANGE, RED, BLUE, YELLOW, GREEN, WHITE),
			"DBCA", colors(UNLIT, UNLIT, WHITE, ORANGE, PINK, RED, BLUE, YELLOW, GREEN),
			"CADB", colors(UNLIT, UNLIT, GREEN, RED, RED, RED, YELLOW, YELLOW, YELLOW),
			"CDBA", colors(UNLIT, UNLIT, RED, RED, GREEN, GREEN, ORANGE, ORANGE, ORANGE),

			"BDAC", colors(UNLIT, UNLIT, UNLIT, ORANGE, ORANGE, RED, BLUE, YELLOW, GREEN),
			"CABD", colors(UNLIT, UNLIT, UNLIT, ORANGE, YELLOW, RED, RED, BLUE, BLUE),
			"DCAB", colors(UNLIT, UNLIT, UNLIT, ORANGE, ORANGE, ORANGE, RED, BLUE, YELLOW),
			"ACBD", colors(UNLIT, UNLIT, UNLIT, PURPLE, RED, YELLOW, ORANGE, GREEN, BLUE),
			"BDCA", colors(UNLIT, UNLIT, UNLIT, PURPLE, PURPLE, PURPLE, ORANGE, RED, GREEN),

			"BCDA", colors(UNLIT, RED, BLUE, UNLIT, UNLIT, UNLIT, ORANGE, GREEN, WHITE),
			"ABDC", colors(UNLIT, UNLIT, RED, UNLIT, GREEN, BLUE, UNLIT, GREEN, ORANGE),
			"CBDA", colors(UNLIT, UNLIT, UNLIT, UNLIT, RED, RED, BLUE, BLUE, ORANGE),
			"DABC", colors(UNLIT, UNLIT, UNLIT, UNLIT, RED, RED, RED, BLUE, ORANGE),
			"ABCD", colors(UNLIT, UNLIT, UNLIT, UNLIT, PINK, PINK, PINK, RED, ORANGE)
		);
	}

	@Test
	void rejectsImpossibleGridAndRecordsSouvenirFact() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new LedGridInput(colors(UNLIT, UNLIT, UNLIT, UNLIT, UNLIT, RED, BLUE, GREEN, WHITE))))
			.isInstanceOf(SolveFailure.class);

		ModuleEntity module = new ModuleEntity();
		solve(module, colors(UNLIT, RED, BLUE, YELLOW, GREEN, ORANGE, PINK, PURPLE, WHITE));
		assertThat(module.getState()).containsEntry("unlitCount", 1);
	}

	private void assertAnswers(Object... cases) {
		for (int i = 0; i < cases.length; i += 2) {
			String expected = (String)cases[i];
			LedGridOutput output = solve(new ModuleEntity(), cast(cases[i + 1]));
			assertThat(String.join("", output.pressOrder())).as("case %d", i / 2 + 1).isEqualTo(expected);
		}
	}

	@SuppressWarnings("unchecked")
	private static List<Color> cast(Object value) { return (List<Color>)value; }
	private static List<Color> colors(Color... colors) { return List.of(colors); }

	@SuppressWarnings("unchecked")
	private LedGridOutput solve(ModuleEntity module, List<Color> colors) {
		return ((SolveSuccess<LedGridOutput>)solver.solve(
			new RoundEntity(), new BombEntity(), module, new LedGridInput(colors))).output();
	}
}
