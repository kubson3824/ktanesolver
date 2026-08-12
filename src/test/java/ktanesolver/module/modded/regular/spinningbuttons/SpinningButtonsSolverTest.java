package ktanesolver.module.modded.regular.spinningbuttons;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.spinningbuttons.SpinningButtonsInput.Button;

class SpinningButtonsSolverTest {
	private final SpinningButtonsSolver solver = new SpinningButtonsSolver();

	@Test
	void mapsTheWholeManualTableAndOrdersButtonsWithStableTies() {
		for (int color = 0; color < SpinningButtonsSolver.COLORS.size(); color++) {
			for (int character = 0; character < SpinningButtonsSolver.CHARACTERS.size(); character++) {
				assertThat(SpinningButtonsSolver.value(
					SpinningButtonsSolver.COLORS.get(color), SpinningButtonsSolver.CHARACTERS.get(character)))
					.as("%s %s", SpinningButtonsSolver.COLORS.get(color), SpinningButtonsSolver.CHARACTERS.get(character))
					.isEqualTo(color + character);
			}
		}

		SolveSuccess<SpinningButtonsOutput> result = success(solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), new SpinningButtonsInput(List.of(
				new Button("blue", "f"),
				new Button("red", "d"),
				new Button("purple", "q"),
				new Button("orange", "l")
			))));
		assertThat(result.output().pressOrder()).extracting("position", "value")
			.containsExactly(tuple(3, 3), tuple(4, 3), tuple(1, 5), tuple(2, 5));

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new SpinningButtonsInput(List.of(
				new Button("red", "f"), new Button("red", "l"),
				new Button("orange", "q"), new Button("grey", "w")
			)))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private static SolveSuccess<SpinningButtonsOutput> success(Object result) {
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return (SolveSuccess<SpinningButtonsOutput>) result;
	}

	private static org.assertj.core.groups.Tuple tuple(Object... values) {
		return org.assertj.core.groups.Tuple.tuple(values);
	}
}
