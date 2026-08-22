package ktanesolver.module.modded.regular.trianglebutton;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TriangleButtonSolverTest {
	private final TriangleButtonSolver solver = new TriangleButtonSolver();

	@Test
	void appliesDirectionAndLetterValuesForEveryActionFamily() {
		assertThat(solve(new TriangleButtonInput("Red", "up", 0, "A"))).isEqualTo(new TriangleButtonOutput("TAP", 2, 2, 2));
		assertThat(solve(new TriangleButtonInput("Green", "up", 4, "HOLD"))).isEqualTo(new TriangleButtonOutput("HOLD", 3, 3, 0));
		assertThat(solve(new TriangleButtonInput("Red", "right", 9, "EXPERT"))).isEqualTo(new TriangleButtonOutput("RELEASE", 2, 0, 2));
	}

	@Test
	void rejectsValuesTheModuleCannotDisplay() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new TriangleButtonInput("Teal", "up", 3, "PRESS")))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private TriangleButtonOutput solve(TriangleButtonInput input) {
		var result = solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), input);
		assertThat(result).withFailMessage(() -> result instanceof SolveFailure<?> failure ? failure.getReason() : "Expected a successful result").isInstanceOf(SolveSuccess.class);
		return ((SolveSuccess<TriangleButtonOutput>) result).output();
	}
}
