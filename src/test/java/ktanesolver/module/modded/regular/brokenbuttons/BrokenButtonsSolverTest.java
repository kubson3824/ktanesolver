package ktanesolver.module.modded.regular.brokenbuttons;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class BrokenButtonsSolverTest {
	private final BrokenButtonsSolver solver = new BrokenButtonsSolver();

	@Test
	void followsRulePriorityAndTracksSubmitChanges() {
		ModuleEntity module = module();
		BrokenButtonsOutput sea = solve(module, List.of(
			"this", "blast", "wire", "switch", "sea", "abort",
			"thing", "broken", "five", "column", "submit", "first"
		));
		assertThat(sea).isEqualTo(new BrokenButtonsOutput("PRESS_BUTTON", 2, 2, "sea", null, 1));

		BrokenButtonsOutput other = solve(module, List.of(
			"blast", "wire", "light", "switch", "other", "abort",
			"boom", "broken", "five", "column", "submit", "first"
		));
		assertThat(other.label()).isEqualTo("other");
		assertThat(module.getState()).containsEntry("submitRight", true);

		BrokenButtonsOutput one = solve(module, List.of(
			"blast", "wire", "light", "switch", "one", "abort",
			"boom", "broken", "five", "column", "submit", "first"
		));
		assertThat(one.label()).isEqualTo("one");
		assertThat(module.getState()).containsEntry("submitRight", false);
	}

	@Test
	void firstFallbackWordContainingEForcesRightSubmit() {
		ModuleEntity module = module();
		BrokenButtonsOutput first = solve(module, fallbackLabels());
		assertThat(first).isEqualTo(new BrokenButtonsOutput("PRESS_BUTTON", 2, 3, "broken", null, 1));

		List<String> changed = new java.util.ArrayList<>(fallbackLabels());
		changed.set(5, "size");
		BrokenButtonsOutput submit = solve(module, changed);
		assertThat(submit).isEqualTo(new BrokenButtonsOutput("SUBMIT", null, null, null, "RIGHT", 1));
		assertThat(module.isSolved()).isTrue();
	}

	@Test
	void fifthButtonIncludesTheFinalSubmitSide() {
		ModuleEntity module = module();
		module.getState().put("pressedCount", 4);
		module.getState().put("submitRight", true);

		BrokenButtonsOutput output = solve(module, List.of(
			"blast", "wire", "light", "switch", "sea", "abort",
			"thing", "broken", "five", "column", "submit", "first"
		));
		assertThat(output).isEqualTo(new BrokenButtonsOutput("PRESS_BUTTON", 2, 2, "sea", "RIGHT", 5));
		assertThat(module.isSolved()).isTrue();
	}

	@Test
	void rejectsAnythingOtherThanTwelveLabels() {
		var result = solver.solve(new RoundEntity(), new BombEntity(), module(), new BrokenButtonsInput(List.of("sea")));
		assertThat(result).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private BrokenButtonsOutput solve(ModuleEntity module, List<String> labels) {
		return ((SolveSuccess<BrokenButtonsOutput>)solver.solve(
			new RoundEntity(), new BombEntity(), module, new BrokenButtonsInput(labels)
		)).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.BROKEN_BUTTONS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}

	private static List<String> fallbackLabels() {
		return List.of(
			"blast", "wire", "light", "switch", "abort", "broken",
			"boom", "column", "five", "submit", "module", "first"
		);
	}
}
