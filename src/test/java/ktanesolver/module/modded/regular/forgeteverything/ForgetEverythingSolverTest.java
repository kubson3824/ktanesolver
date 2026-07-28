package ktanesolver.module.modded.regular.forgeteverything;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.forgeteverything.ForgetEverythingInput.Action;
import ktanesolver.module.modded.regular.forgeteverything.ForgetEverythingInput.Color;

class ForgetEverythingSolverTest {
	private final ForgetEverythingSolver solver = new ForgetEverythingSolver();

	@Test
	void sortsStagesAppliesValidityAndStoresTheSouvenirDisplay() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		record(module, 5, "0000200000", "99", Color.RED, Color.YELLOW, Color.GREEN);
		record(module, 2, "1300000000", "13", Color.RED, Color.RED, Color.BLUE);
		record(module, 4, "0000000000", "99", Color.BLUE, Color.BLUE, Color.RED);
		record(module, 1, "1234567890", "00", Color.RED, Color.YELLOW, Color.GREEN);
		record(module, 3, "0000000000", "00", Color.GREEN, Color.GREEN, Color.BLUE);

		ForgetEverythingOutput output = solve(module, new ForgetEverythingInput(Action.FINISH, null, null, null, null));

		assertThat(output).isEqualTo(new ForgetEverythingOutput("1534767890", 5));
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("firstStageDigits")).isEqualTo(List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 0));
	}

	private void record(ModuleEntity module, int stage, String dials, String nixies, Color... colors) {
		solve(module, new ForgetEverythingInput(Action.RECORD_STAGE, stage, dials, nixies, List.of(colors)));
	}

	@SuppressWarnings("unchecked")
	private ForgetEverythingOutput solve(ModuleEntity module, ForgetEverythingInput input) {
		return ((SolveSuccess<ForgetEverythingOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, input
		)).output();
	}
}
