package ktanesolver.module.modded.regular.marbletumble;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.marbletumble.MarbleTumbleInput.CylinderColor;

class MarbleTumbleSolverTest {
	private final MarbleTumbleSolver solver = new MarbleTumbleSolver();

	@Test
	void findsTheShortestStrikeFreeTimerSequence() {
		MarbleTumbleInput input = new MarbleTumbleInput(
			List.of(CylinderColor.RED, CylinderColor.YELLOW, CylinderColor.GREEN, CylinderColor.BLUE, CylinderColor.SILVER),
			List.of(1, 2, 3, 4, 5),
			List.of(4, 5, 6, 7, 8)
		);

		SolveSuccess<?> result = (SolveSuccess<?>)solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), input);

		assertThat(((MarbleTumbleOutput)result.output()).timerDigits()).containsExactly(0, 5, 5, 9);
		assertThat(result.solved()).isTrue();
	}

	@Test
	void rejectsDuplicateCylinderColors() {
		MarbleTumbleInput input = new MarbleTumbleInput(
			List.of(CylinderColor.RED, CylinderColor.RED, CylinderColor.GREEN, CylinderColor.BLUE, CylinderColor.SILVER),
			List.of(1, 2, 3, 4, 5),
			List.of(4, 5, 6, 7, 8)
		);

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), input))
			.isInstanceOf(SolveFailure.class);
	}
}
