package ktanesolver.module.modded.regular.timezone;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TimezoneSolverTest {
	private final TimezoneSolver solver = new TimezoneSolver();

	@Test
	void convertsWrappedTimesAndRejectsInvalidInput() {
		TimezoneInput twelveHour = new TimezoneInput("Alofi", "Tarawa", 1, 5, "AM", true);
		ModuleEntity module = new ModuleEntity();
		assertThat(solve(module, twelveHour)).isEqualTo(new TimezoneOutput("1205"));
		assertThat(module.getState()).containsEntry("input", twelveHour);

		assertThat(solve(new ModuleEntity(), new TimezoneInput("Tarawa", "Alofi", 1, 5, "AM", false)))
			.isEqualTo(new TimezoneOutput("0205"));
		assertThat(solve(new ModuleEntity(), new TimezoneInput("Tarawa", "Alofi", 10, 5, "PM", true)))
			.isEqualTo(new TimezoneOutput("1105"));

		List<TimezoneInput> invalid = List.of(
			new TimezoneInput(null, "Tarawa", 1, 0, "AM", true),
			new TimezoneInput("alofi", "Tarawa", 1, 0, "AM", true),
			new TimezoneInput("Alofi", "Alofi", 1, 0, "AM", true),
			new TimezoneInput("Alofi", "Tarawa", null, 0, "AM", true),
			new TimezoneInput("Alofi", "Tarawa", 0, 0, "AM", true),
			new TimezoneInput("Alofi", "Tarawa", 13, 0, "AM", true),
			new TimezoneInput("Alofi", "Tarawa", 1, null, "AM", true),
			new TimezoneInput("Alofi", "Tarawa", 1, 1, "AM", true),
			new TimezoneInput("Alofi", "Tarawa", 1, 60, "AM", true),
			new TimezoneInput("Alofi", "Tarawa", 1, 0, "am", true),
			new TimezoneInput("Alofi", "Tarawa", 1, 0, "AM", null)
		);
		for (TimezoneInput input : invalid) {
			ModuleEntity invalidModule = new ModuleEntity();
			assertThat(solver.solve(new RoundEntity(), new BombEntity(), invalidModule, input))
				.isInstanceOf(SolveFailure.class);
			assertThat(invalidModule.getState()).isEmpty();
		}
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), null))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private TimezoneOutput solve(ModuleEntity module, TimezoneInput input) {
		return ((SolveSuccess<TimezoneOutput>)solver.solve(
			new RoundEntity(), new BombEntity(), module, input
		)).output();
	}
}
