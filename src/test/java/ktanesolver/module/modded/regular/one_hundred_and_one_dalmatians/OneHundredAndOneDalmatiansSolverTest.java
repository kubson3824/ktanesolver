package ktanesolver.module.modded.regular.one_hundred_and_one_dalmatians;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class OneHundredAndOneDalmatiansSolverTest {
	private final OneHundredAndOneDalmatiansSolver solver = new OneHundredAndOneDalmatiansSolver();

	@Test void mapsEveryOfficialManualPatternInSourceOrder() {
		assertThat(OneHundredAndOneDalmatiansSolver.NAMES).hasSize(101).doesNotHaveDuplicates();
		assertThat(solve(1)).isEqualTo(new OneHundredAndOneDalmatiansOutput("Blackear", 1));
		assertThat(solve(60)).isEqualTo(new OneHundredAndOneDalmatiansOutput("Perdita", 60));
		assertThat(solve(101)).isEqualTo(new OneHundredAndOneDalmatiansOutput("Yoyo", 101));
	}

	@Test void validatesPatternNumber() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new OneHundredAndOneDalmatiansInput(0))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new OneHundredAndOneDalmatiansInput(102))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private OneHundredAndOneDalmatiansOutput solve(int patternNumber) {
		return ((SolveSuccess<OneHundredAndOneDalmatiansOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), new OneHundredAndOneDalmatiansInput(patternNumber))).output();
	}
}
