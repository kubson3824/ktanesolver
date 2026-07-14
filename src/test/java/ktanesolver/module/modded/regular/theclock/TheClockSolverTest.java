package ktanesolver.module.modded.regular.theclock;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TheClockSolverTest {
	private final TheClockSolver solver = new TheClockSolver();

	@Test
	void calculatesBothTimerTargetsAcrossMidnightAndValidatesTime() {
		TheClockInput add = new TheClockInput(11, 50, TheClockInput.Period.PM,
			TheClockInput.NumeralStyle.ROMAN, TheClockInput.CasingColor.GOLD, false,
			TheClockInput.HandStyle.LINES, TheClockInput.NumeralColor.BLACK,
			TheClockInput.TextColor.WHITE, false);
		assertThat(solve(add).output()).isEqualTo(new TheClockOutput("2:00 AM", "9:40 PM", 2, 10));

		TheClockInput subtract = new TheClockInput(2, 5, TheClockInput.Period.AM,
			TheClockInput.NumeralStyle.NONE, TheClockInput.CasingColor.SILVER, true,
			TheClockInput.HandStyle.SPADES, TheClockInput.NumeralColor.RED,
			TheClockInput.TextColor.BLACK, true);
		assertThat(solve(subtract).output()).isEqualTo(new TheClockOutput("5:16 AM", "10:54 PM", 3, 11));

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new TheClockInput(13, 0, TheClockInput.Period.AM, TheClockInput.NumeralStyle.ARABIC,
				TheClockInput.CasingColor.GOLD, true, TheClockInput.HandStyle.ARROWS,
				TheClockInput.NumeralColor.BLUE, TheClockInput.TextColor.WHITE, true)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<TheClockOutput> solve(TheClockInput input) {
		return (SolveSuccess<TheClockOutput>) solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), input);
	}
}
