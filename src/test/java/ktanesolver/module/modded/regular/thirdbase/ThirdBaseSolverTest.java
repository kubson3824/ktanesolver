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
		ThirdBaseInput input = new ThirdBaseInput("nhxs", Map.of(
			ButtonPosition.TOP_LEFT, "XOHZ",
			ButtonPosition.TOP_RIGHT, "I8O9",
			ButtonPosition.MIDDLE_LEFT, "XI8Z",
			ButtonPosition.MIDDLE_RIGHT, "H68S",
			ButtonPosition.BOTTOM_LEFT, "6NZH",
			ButtonPosition.BOTTOM_RIGHT, "66I8"
		));

		for (int stage = 1; stage <= 3; stage++) {
			var result = (SolveSuccess<ThirdBaseOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
			assertThat(result.output()).isEqualTo(new ThirdBaseOutput(ButtonPosition.TOP_RIGHT, "I8O9"));
			assertThat(result.solved()).isEqualTo(stage == 3);
		}

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, input)).isInstanceOf(SolveFailure.class);
	}

	@Test
	void supportsTheSecondLabelSetAndRejectsInvalidButtons() {
		ThirdBaseInput input = new ThirdBaseInput("SZN6", Map.of(
			ButtonPosition.TOP_LEFT, "9NZS",
			ButtonPosition.TOP_RIGHT, "ZHOX",
			ButtonPosition.MIDDLE_LEFT, "8I99",
			ButtonPosition.MIDDLE_RIGHT, "8NSZ",
			ButtonPosition.BOTTOM_LEFT, "X9HI",
			ButtonPosition.BOTTOM_RIGHT, "S89H"
		));
		var result = (SolveSuccess<ThirdBaseOutput>) solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), input);
		assertThat(result.output()).isEqualTo(new ThirdBaseOutput(ButtonPosition.MIDDLE_RIGHT, "8NSZ"));

		ThirdBaseInput duplicate = new ThirdBaseInput("SZN6", Map.of(
			ButtonPosition.TOP_LEFT, "9NZS",
			ButtonPosition.TOP_RIGHT, "9NZS",
			ButtonPosition.MIDDLE_LEFT, "8I99",
			ButtonPosition.MIDDLE_RIGHT, "8NSZ",
			ButtonPosition.BOTTOM_LEFT, "X9HI",
			ButtonPosition.BOTTOM_RIGHT, "S89H"
		));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), duplicate)).isInstanceOf(SolveFailure.class);

		assertThat(ThirdBaseRules.LABELS).hasSize(28).doesNotHaveDuplicates();
		for (int i = 0; i < ThirdBaseRules.LABELS.size(); i++) {
			assertThat(ThirdBaseRules.priorities(i)).hasSize(14).doesNotHaveDuplicates();
			assertThat(Arrays.stream(ThirdBaseRules.priorities(i)).allMatch(index -> index >= 0 && index < 28)).isTrue();
		}
	}
}
