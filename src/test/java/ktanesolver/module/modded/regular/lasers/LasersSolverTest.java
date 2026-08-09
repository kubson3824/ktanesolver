package ktanesolver.module.modded.regular.lasers;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class LasersSolverTest {
	private final LasersSolver solver = new LasersSolver();

	@Test
	void findsCompletePathsForBothModuleParitiesAndRejectsMalformedInput() {
		BombEntity oddModules = new BombEntity();
		oddModules.getModules().add(new ModuleEntity());
		assertThat(solve(oddModules, List.of(1, 2, 3, 4, 5, 6, 7, 8, 9), 5))
			.isEqualTo(new LasersOutput(
				List.of(1, 3, 2, 4, 7, 6, 9),
				List.of(1, 3, 2, 4, 7, 6, 9)
			));
		assertThat(solve(new BombEntity(), List.of(9, 8, 7, 6, 5, 4, 3, 2, 1), 8))
			.isEqualTo(new LasersOutput(
				List.of(1, 3, 2, 4, 6, 5, 7),
				List.of(9, 7, 8, 6, 4, 5, 3)
			));

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new LasersInput(List.of(1, 1, 2, 3, 4, 5, 6, 7, 8), 5))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new LasersInput(List.of(1, 2, 3, 4, 5, 6, 7, 8, 9), -1))).isInstanceOf(SolveFailure.class);
	}

	private LasersOutput solve(BombEntity bomb, List<Integer> labels, int startingTimeMinutes) {
		return ((SolveSuccess<LasersOutput>) solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new LasersInput(labels, startingTimeMinutes)
		)).output();
	}
}
