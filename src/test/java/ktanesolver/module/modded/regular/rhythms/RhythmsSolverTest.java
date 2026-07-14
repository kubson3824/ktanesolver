package ktanesolver.module.modded.regular.rhythms;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.rhythms.RhythmsOutput.Action;

class RhythmsSolverTest {
	private final RhythmsSolver solver = new RhythmsSolver();

	@Test
	void returnsTheTwoManualActions() {
		RhythmsOutput output = solve(0, "BLUE", new BombEntity());

		assertThat(output.mash()).isFalse();
		assertThat(output.actions()).containsExactly(new Action("♩", 2), new Action("♪", 0));
	}

	@Test
	void addsOneYellowBeepPerLitIndicator() {
		BombEntity bomb = new BombEntity();
		bomb.setIndicators(Map.of("CAR", true, "FRK", false, "NSA", true));

		assertThat(solve(1, "YELLOW", bomb).actions())
			.containsExactly(new Action("♫", 3), new Action("♬", 3));
	}

	@Test
	void repeatsTheFirstQuarterNoteActionWithMoreThanOneBattery() {
		BombEntity bomb = new BombEntity();
		bomb.setAaBatteryCount(2);

		assertThat(solve(6, "GREEN", bomb).actions())
			.containsExactly(new Action("♬", 0), new Action("♬", 0));
	}

	@Test
	void returnsMashForTheRedFirstPattern() {
		RhythmsOutput output = solve(0, "RED", new BombEntity());

		assertThat(output.mash()).isTrue();
		assertThat(output.actions()).isEmpty();
	}

	@SuppressWarnings("unchecked")
	private RhythmsOutput solve(int rhythm, String color, BombEntity bomb) {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.RHYTHMS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		RhythmsOutput output = ((SolveSuccess<RhythmsOutput>) solver.solve(
			new RoundEntity(), bomb, module, new RhythmsInput(rhythm, color))).output();

		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsEntry("lastSuccessfulColor", color);
		return output;
	}
}
