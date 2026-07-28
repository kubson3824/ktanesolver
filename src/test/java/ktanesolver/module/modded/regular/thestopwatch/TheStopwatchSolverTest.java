package ktanesolver.module.modded.regular.thestopwatch;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TheStopwatchSolverTest {
	private final TheStopwatchSolver solver = new TheStopwatchSolver();

	@Test
	void calculatesEverySerialVariantAndAppliesShortBombScaling() {
		assertThat(solve("AB12CD", 0, 600)).isEqualTo(new TheStopwatchOutput(204, 204, "3:24"));
		assertThat(solve("AB321C", 2, 300)).isEqualTo(new TheStopwatchOutput(155, 15, "0:15"));
		assertThat(solve("A1203B", 0, 60)).isEqualTo(new TheStopwatchOutput(152, 7, "0:07"));

		assertThat(solver.solve(new RoundEntity(), bomb("ABC1", 0), new ModuleEntity(), new TheStopwatchInput(300)))
			.isInstanceOf(SolveFailure.class);
	}

	private TheStopwatchOutput solve(String serial, int batteries, int startTime) {
		return ((SolveSuccess<TheStopwatchOutput>)solver.solve(
			new RoundEntity(), bomb(serial, batteries), new ModuleEntity(), new TheStopwatchInput(startTime)
		)).output();
	}

	private static BombEntity bomb(String serial, int batteries) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(batteries);
		return bomb;
	}
}
