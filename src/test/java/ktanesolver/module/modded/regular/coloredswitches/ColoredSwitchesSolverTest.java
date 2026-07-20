package ktanesolver.module.modded.regular.coloredswitches;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.coloredswitches.ColoredSwitchesInput.SwitchColor;

class ColoredSwitchesSolverTest {
	private final ColoredSwitchesSolver solver = new ColoredSwitchesSolver();

	@Test
	void findsOnlyColorPermittedTransitionsAndRecordsTheInitialPosition() {
		ModuleEntity module = new ModuleEntity();
		boolean[] initial = {false, false, false, false, false};
		List<SwitchColor> colors = List.of(
			SwitchColor.RED, SwitchColor.GREEN, SwitchColor.BLUE, SwitchColor.PURPLE, SwitchColor.ORANGE
		);
		SolveSuccess<?> first = (SolveSuccess<?>)solver.solve(
			new RoundEntity(), new BombEntity(), module, new ColoredSwitchesInput(colors, initial, null));
		assertThat(((ColoredSwitchesOutput)first.output()).solutionSteps()).hasSize(3).startsWith(1);
		assertThat(first.solved()).isFalse();
		assertThat(module.getState().get("initialPosition")).isEqualTo(List.of(false, false, false, false, false));

		boolean[] afterThree = {true, false, false, false, false};
		boolean[] target = {true, false, false, false, true};
		SolveSuccess<?> finalResult = (SolveSuccess<?>)solver.solve(
			new RoundEntity(), new BombEntity(), module, new ColoredSwitchesInput(colors, afterThree, target));
		assertThat(((ColoredSwitchesOutput)finalResult.output()).solutionSteps()).isNotEmpty();
		assertThat(finalResult.solved()).isTrue();
		assertThat(module.getState().get("initialPosition")).isEqualTo(List.of(false, false, false, false, false));
	}
}
