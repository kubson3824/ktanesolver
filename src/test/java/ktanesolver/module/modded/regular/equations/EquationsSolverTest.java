package ktanesolver.module.modded.regular.equations;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class EquationsSolverTest {
	private final EquationsSolver solver = new EquationsSolver();

	@Test
	void solvesAllSixSystemsExactlyAndTruncatesTowardZero() {
		assertPair(1, 1, 3, 7, 0, "-7", "7");
		assertPair(2, 2, 0, 3, 5, "2", "3.5");
		assertPair(3, 2, 3, 4, 0, "3", "1.666");
		assertPair(4, 2, 8, 3, 0, "2", "3");
		assertPair(5, 3, 0, 4, 2, "-1.666", "2.333");
		assertPair(6, 2, 1, 4, 5, "1", "2");
		assertThat(EquationsSolver.format(new EquationsSolver.Rational(-1, 6))).isEqualTo("-0.166");
	}

	@Test
	void rejectsUndefinedSystemsAndInvalidDisplays() {
		assertThat(EquationsSolver.solveSystem(1, 2, 4, 7, 0)).isNull();
		assertThat(EquationsSolver.solveSystem(2, 0, 1, 7, 2)).isNull();
		assertThat(EquationsSolver.solveSystem(3, 2, 1, 7, 0)).isNull();
		assertThat(EquationsSolver.solveSystem(5, 2, 1, -2, 3)).isNull();
		assertThat(EquationsSolver.solveSystem(6, 3, -3, 7, 2)).isNull();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new EquationsInput(List.of("BLUE"), List.of(true))))
			.isInstanceOf(SolveFailure.class);
	}

	@Test
	void appliesPriorityEdgeworkMonthAndVariableRules() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("AB1C2D");
		bomb.setIndicators(Map.of("CAR", true, "FRK", true, "NSA", true, "BOB", false));
		RoundEntity round = new RoundEntity();
		round.setStartTime(Instant.parse("2025-08-03T12:00:00Z"));
		EquationsInput input = new EquationsInput(
			List.of("BLUE", "RED", "PINK", "GREEN", "YELLOW", "RED", "BLUE", "GREEN", "YELLOW", "RED"),
			List.of(true, false, false));
		@SuppressWarnings("unchecked")
		SolveSuccess<EquationsOutput> result = (SolveSuccess<EquationsOutput>) solver.solve(round, bomb, module(), input);
		assertThat(result.output()).isEqualTo(new EquationsOutput(2, "x", 0, 1, 10, 2, "", true));
	}

	private static void assertPair(int system, int a, int b, int c, int d, String x, String y) {
		EquationsSolver.Solution solution = EquationsSolver.solveSystem(system, a, b, c, d);
		assertThat(EquationsSolver.format(solution.x())).isEqualTo(x);
		assertThat(EquationsSolver.format(solution.y())).isEqualTo(y);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.EQUATIONS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
