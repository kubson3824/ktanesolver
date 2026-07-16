package ktanesolver.module.modded.regular.doubleoh;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.EnumMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.doubleoh.DoubleOhInput.Button;

class DoubleOhSolverTest {
	private final DoubleOhSolver solver = new DoubleOhSolver();

	@Test
	void infersTheUnobservedRandomButtonAsSubmitAndFindsShortestRouteToZero() {
		var observations = new EnumMap<Button, Integer>(Button.class);
		observations.put(Button.SINGLE_HORIZONTAL, 15);
		observations.put(Button.DOUBLE_HORIZONTAL, 48);
		observations.put(Button.DOUBLE_VERTICAL, 6);
		observations.put(Button.SQUARE, 74);
		var module = new ModuleEntity();

		var result = solver.solve(new RoundEntity(), new BombEntity(), module, new DoubleOhInput(60, observations));

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<DoubleOhOutput>) result).output().presses()).containsExactly(
			Button.DOUBLE_VERTICAL, Button.DOUBLE_VERTICAL,
			Button.SQUARE, Button.SQUARE,
			Button.DOUBLE_HORIZONTAL, Button.DOUBLE_HORIZONTAL,
			Button.SINGLE_HORIZONTAL, Button.SINGLE_HORIZONTAL,
			Button.SINGLE_VERTICAL);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsKey("input");
	}

	@Test
	void rejectsAnObservationThatIsNotOneButtonPressAway() {
		var observations = new EnumMap<Button, Integer>(Button.class);
		observations.put(Button.SINGLE_VERTICAL, 74);
		observations.put(Button.SINGLE_HORIZONTAL, 15);
		observations.put(Button.DOUBLE_HORIZONTAL, 48);
		observations.put(Button.DOUBLE_VERTICAL, 22);

		var result = solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new DoubleOhInput(60, observations));

		assertThat(result).isInstanceOf(SolveFailure.class);
	}
}
