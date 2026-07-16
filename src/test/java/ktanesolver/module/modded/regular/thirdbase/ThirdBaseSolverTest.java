package ktanesolver.module.modded.regular.thirdbase;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.vanilla.regular.whosonfirst.ButtonPosition;

class ThirdBaseSolverTest {
	private final ThirdBaseSolver solver = new ThirdBaseSolver();

	@Test
	void followsDisplayAndPriorityTablesAcrossThreeStages() {
		ModuleEntity module = new ModuleEntity();
		ThirdBaseInput input = new ThirdBaseInput("sxhn", Map.of(
			ButtonPosition.TOP_LEFT, "8I99",
			ButtonPosition.TOP_RIGHT, "HZN9",
			ButtonPosition.MIDDLE_LEFT, "S89H",
			ButtonPosition.MIDDLE_RIGHT, "Z8IX",
			ButtonPosition.BOTTOM_LEFT, "6O8I",
			ButtonPosition.BOTTOM_RIGHT, "ZHOX"
		));

		for (int stage = 1; stage <= 3; stage++) {
			var result = (SolveSuccess<ThirdBaseOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
			assertThat(result.output()).isEqualTo(new ThirdBaseOutput(ButtonPosition.BOTTOM_LEFT, "6O8I"));
			assertThat(result.solved()).isEqualTo(stage == 3);
		}

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, input)).isInstanceOf(SolveFailure.class);
	}

	@Test
	void supportsTheSecondLabelSetAndRejectsInvalidButtons() {
		ThirdBaseInput input = new ThirdBaseInput("9NZS", Map.of(
			ButtonPosition.TOP_LEFT, "H68S",
			ButtonPosition.TOP_RIGHT, "IH6X",
			ButtonPosition.MIDDLE_LEFT, "ZSN8",
			ButtonPosition.MIDDLE_RIGHT, "66I8",
			ButtonPosition.BOTTOM_LEFT, "XOHZ",
			ButtonPosition.BOTTOM_RIGHT, "SZN6"
		));
		var result = (SolveSuccess<ThirdBaseOutput>) solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), input);
		assertThat(result.output()).isEqualTo(new ThirdBaseOutput(ButtonPosition.MIDDLE_LEFT, "ZSN8"));

		ThirdBaseInput duplicate = new ThirdBaseInput("9NZS", Map.of(
			ButtonPosition.TOP_LEFT, "9NZS",
			ButtonPosition.TOP_RIGHT, "9NZS",
			ButtonPosition.MIDDLE_LEFT, "8I99",
			ButtonPosition.MIDDLE_RIGHT, "8NSZ",
			ButtonPosition.BOTTOM_LEFT, "X9HI",
			ButtonPosition.BOTTOM_RIGHT, "S89H"
		));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), duplicate)).isInstanceOf(SolveFailure.class);

		ThirdBaseInput screenshot = new ThirdBaseInput("SXHN", Map.of(
			ButtonPosition.TOP_LEFT, "6O8I",
			ButtonPosition.TOP_RIGHT, "IH6X",
			ButtonPosition.MIDDLE_LEFT, "H68S",
			ButtonPosition.MIDDLE_RIGHT, "8OXN",
			ButtonPosition.BOTTOM_LEFT, "66I8",
			ButtonPosition.BOTTOM_RIGHT, "HZN9"
		));
		var screenshotResult = (SolveSuccess<ThirdBaseOutput>) solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), screenshot);
		assertThat(screenshotResult.output()).isEqualTo(new ThirdBaseOutput(ButtonPosition.TOP_LEFT, "6O8I"));

		assertThat(ThirdBaseRules.LABELS).hasSize(28).doesNotHaveDuplicates();
		for (int i = 0; i < ThirdBaseRules.LABELS.size(); i++) {
			assertThat(ThirdBaseRules.priorities(i)).hasSize(14).doesNotHaveDuplicates();
			assertThat(Arrays.stream(ThirdBaseRules.priorities(i)).allMatch(index -> index >= 0 && index < 28)).isTrue();
		}
	}
}
