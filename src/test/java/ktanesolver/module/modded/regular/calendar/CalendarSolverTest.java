package ktanesolver.module.modded.regular.calendar;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.souvenir.SouvenirInput;
import ktanesolver.module.modded.regular.souvenir.SouvenirOutput;
import ktanesolver.module.modded.regular.souvenir.SouvenirSolver;

class CalendarSolverTest {
	private final CalendarSolver solver = new CalendarSolver();

	@Test
	void resolvesMonthFallbackLeftmostDigitAndGroundhogPresses() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A42BC7");

		assertThat(solve(bomb, new CalendarInput(10, 5, "Green", "Australia Day", false)))
			.isEqualTo(new CalendarOutput(2, 4, 1, "Australia Day"));
		assertThat(solve(bomb, new CalendarInput(3, 22, "Red", "April Fools' Day", false)))
			.isEqualTo(new CalendarOutput(10, 5, 1, "April Fools’"));
		assertThat(solve(bomb, new CalendarInput(6, 22, "Blue", "Groundhog Day", false)))
			.isEqualTo(new CalendarOutput(11, 1, 3, "Groundhog Day"));
	}

	@Test
	void recordsTheCanonicalSouvenirHolidayAndSuppressesVisibleHolidays() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A42BC7");
		ModuleEntity souvenir = module(ModuleType.SOUVENIR);
		ModuleEntity eligible = module(ModuleType.CALENDAR);
		bomb.setModules(List.of(eligible, souvenir));
		solver.solve(new RoundEntity(), bomb, eligible, new CalendarInput(3, 22, "Red", "April Fools' Day", false));

		var answer = new SouvenirSolver().solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(eligible.getId(), "holiday", List.of(), false));
		assertThat(answer).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<SouvenirOutput>) answer).output().answer()).isEqualTo("April Fools’");

		ModuleEntity suppressed = module(ModuleType.CALENDAR);
		bomb.setModules(List.of(suppressed, souvenir));
		solver.solve(new RoundEntity(), bomb, suppressed, new CalendarInput(4, 5, "Green", "Australia Day", false));
		assertThat(new SouvenirSolver().solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(suppressed.getId(), "holiday", List.of(), false))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private CalendarOutput solve(BombEntity bomb, CalendarInput input) {
		ModuleEntity module = module(ModuleType.CALENDAR);
		return ((SolveSuccess<CalendarOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static ModuleEntity module(ModuleType type) {
		ModuleEntity module = new ModuleEntity();
		module.setId(UUID.randomUUID());
		module.setType(type);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
