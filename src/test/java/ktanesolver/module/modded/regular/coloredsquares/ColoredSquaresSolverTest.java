package ktanesolver.module.modded.regular.coloredsquares;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.module.modded.regular.coloredsquares.ColoredSquaresOutput.Group;

class ColoredSquaresSolverTest {
	private final ColoredSquaresSolver solver = new ColoredSquaresSolver();

	@Test
	void followsTheTableAndValidatesTheWhiteCount() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new ColoredSquaresInput(2, Group.RED)))
			.extracting(result -> ((ktanesolver.logic.SolveSuccess<?>)result).output())
			.isEqualTo(new ColoredSquaresOutput(Group.ROW));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new ColoredSquaresInput(1, Group.BLUE)))
			.extracting(result -> ((ktanesolver.logic.SolveSuccess<?>)result).output())
			.isEqualTo(new ColoredSquaresOutput(Group.COLUMN));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new ColoredSquaresInput(16, Group.COLUMN)))
			.matches(result -> result instanceof ktanesolver.logic.SolveSuccess<?> success && success.solved());
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new ColoredSquaresInput(0, Group.RED)))
			.isInstanceOf(SolveFailure.class);
	}
}
