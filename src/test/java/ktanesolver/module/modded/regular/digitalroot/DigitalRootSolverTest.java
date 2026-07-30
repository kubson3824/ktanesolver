package ktanesolver.module.modded.regular.digitalroot;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class DigitalRootSolverTest {
	private final DigitalRootSolver solver = new DigitalRootSolver();

	@Test
	void identifiesTheDigitalRootAndRejectsNonDigits() {
		assertThat(solve(new DigitalRootInput(8, 9, 7, 6)))
			.isEqualTo(new DigitalRootOutput("YES", 6));
		assertThat(solve(new DigitalRootInput(0, 0, 0, 1)))
			.isEqualTo(new DigitalRootOutput("NO", 0));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new DigitalRootInput(10, 0, 0, 1))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private DigitalRootOutput solve(DigitalRootInput input) {
		return ((SolveSuccess<DigitalRootOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), input)).output();
	}
}
