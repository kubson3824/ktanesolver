package ktanesolver.module.modded.regular.horriblememory;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.horriblememory.HorribleMemoryInput.Button;

class HorribleMemorySolverTest {
	private final HorribleMemorySolver solver = new HorribleMemorySolver();
	private static final List<Button> CURRENT = buttons(
		new int[]{1,2,3,4,5,6}, new HorribleMemoryColor[]{HorribleMemoryColor.BLUE,HorribleMemoryColor.GREEN,HorribleMemoryColor.RED,HorribleMemoryColor.ORANGE,HorribleMemoryColor.PURPLE,HorribleMemoryColor.PINK});
	private static final List<Map<String, Object>> HISTORY = List.of(
		observation(1, buttons(new int[]{3,6,1,5,2,4}, colors("blue","red","green","pink","orange","purple")), 2),
		observation(2, buttons(new int[]{6,5,4,3,2,1}, colors("pink","purple","orange","red","green","blue")), 5),
		observation(3, buttons(new int[]{2,3,4,5,6,1}, colors("orange","pink","purple","blue","red","green")), 4),
		observation(4, buttons(new int[]{5,4,3,2,1,6}, colors("red","orange","pink","purple","blue","green")), 1));

	@Test void coversAllThirtyDefaultRules() {
		int[][] expectedPositions = {
			{6,1,2,3,2,4},
			{2,5,1,6,6,3},
			{5,5,5,3,5,2},
			{5,3,2,4,5,1},
			{6,5,5,6,1,6}
		};
		for (int stage = 1; stage <= 5; stage++) for (int display = 1; display <= 6; display++) {
			ModuleEntity module = new ModuleEntity();
			module.setState(new HashMap<>(Map.of("completedStages", stage - 1, "stages", new ArrayList<>(HISTORY.subList(0, stage - 1)))));
			var result = solver.solve(new RoundEntity(), new BombEntity(), module, new HorribleMemoryInput(stage, display, CURRENT, false));
			assertThat(result).as("stage %s display %s", stage, display).isInstanceOf(SolveSuccess.class);
			assertThat(((SolveSuccess<HorribleMemoryOutput>) result).output().position()).isEqualTo(expectedPositions[stage - 1][display - 1]);
			assertThat(module.isSolved()).isEqualTo(stage == 5);
		}
	}

	@Test void restartReplacesAllEarlierAttemptFacts() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>(Map.of("completedStages", 3, "stages", new ArrayList<>(HISTORY.subList(0, 3)))));
		var result = solver.solve(new RoundEntity(), new BombEntity(), module, new HorribleMemoryInput(1, 2, CURRENT, true));
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.getState().get("completedStages")).isEqualTo(1);
		assertThat((List<?>) module.getState().get("stages")).hasSize(1);
	}

	@Test void validatesStageOrderAndPermutations() {
		ModuleEntity module = new ModuleEntity();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, new HorribleMemoryInput(2, 1, CURRENT, false))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, new HorribleMemoryInput(1, 1,
			buttons(new int[]{1,1,2,3,4,5}, colors("blue","green","red","orange","purple","pink")), true))).isInstanceOf(SolveFailure.class);
	}

	private static Map<String, Object> observation(int display, List<Button> buttons, int pressedPosition) {
		Button pressed = buttons.get(pressedPosition - 1);
		return new HashMap<>(Map.of(
			"display", display,
			"buttons", buttons.stream().map(button -> Map.<String,Object>of("label", button.label(), "color", button.color().name().toLowerCase())).toList(),
			"pressedPosition", pressedPosition, "pressedLabel", pressed.label(), "pressedColor", pressed.color().name().toLowerCase()));
	}
	private static List<Button> buttons(int[] labels, HorribleMemoryColor[] colors) { List<Button> result = new ArrayList<>(); for (int i=0;i<6;i++) result.add(new Button(labels[i], colors[i])); return result; }
	private static HorribleMemoryColor[] colors(String... values) { return java.util.Arrays.stream(values).map(value -> HorribleMemoryColor.valueOf(value.toUpperCase())).toArray(HorribleMemoryColor[]::new); }
}
