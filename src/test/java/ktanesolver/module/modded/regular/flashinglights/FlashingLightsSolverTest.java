package ktanesolver.module.modded.regular.flashinglights;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class FlashingLightsSolverTest {
	private final FlashingLightsSolver solver = new FlashingLightsSolver();

	@Test
	void appliesEveryWeightAndRecordsSuccessfulCounts() {
		List<FlashingLightsColor> top = List.of(CYAN, GREEN, RED, PURPLE, ORANGE, CYAN, GREEN, RED, PURPLE, ORANGE, CYAN, GREEN);
		List<FlashingLightsColor> bottom = List.of(ORANGE, ORANGE, PURPLE, RED, GREEN, CYAN, ORANGE, PURPLE, RED, GREEN, CYAN, ORANGE);
		ModuleEntity module = module();
		SolveSuccess<FlashingLightsOutput> result = solve(module, top, bottom);
		assertThat(result.output().presses()).containsExactly(4, 1);
		assertThat(result.output().topCounts()).containsEntry(CYAN, 3).containsEntry(GREEN, 3).containsEntry(RED, 2).containsEntry(PURPLE, 2).containsEntry(ORANGE, 2);
		assertThat(module.getState()).containsEntry("topCyan", 3).containsEntry("bottomOrange", 4);
	}

	@Test
	void aRetryReplacesBothSequencesAndValidatesLength() {
		ModuleEntity module = module();
		solve(module, repeated(CYAN), repeated(GREEN));
		solve(module, repeated(RED), repeated(ORANGE));
		assertThat(module.getState()).containsEntry("topRed", 12).containsEntry("topCyan", 0);
		assertThat(module.getState()).containsEntry("bottomOrange", 12).containsEntry("bottomGreen", 0);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new FlashingLightsInput(List.of(CYAN), repeated(RED)))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<FlashingLightsOutput> solve(ModuleEntity module, List<FlashingLightsColor> top, List<FlashingLightsColor> bottom) {
		return (SolveSuccess<FlashingLightsOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, new FlashingLightsInput(top, bottom));
	}
	private static List<FlashingLightsColor> repeated(FlashingLightsColor color) { return new ArrayList<>(java.util.Collections.nCopies(12, color)); }
	private static ModuleEntity module() { ModuleEntity module = new ModuleEntity(); module.setType(ModuleType.FLASHING_LIGHTS); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module; }
	private static final FlashingLightsColor CYAN = FlashingLightsColor.CYAN, GREEN = FlashingLightsColor.GREEN, RED = FlashingLightsColor.RED, PURPLE = FlashingLightsColor.PURPLE, ORANGE = FlashingLightsColor.ORANGE;
}
