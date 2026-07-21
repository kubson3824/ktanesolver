package ktanesolver.module.modded.regular.visualimpairment;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class VisualImpairmentSolverTest {
	private static final String FIRST_PICTURE = "RGRWGBWBRRGBRBGBWWGBRBWGR";
	private static final String SYMMETRICAL_PICTURE = "GBRBRGGGRWWWWWWWRGGGRBRBG";
	private final VisualImpairmentSolver solver = new VisualImpairmentSolver();

	@Test
	void findsRotatedPictureAndRecordsOnlyCompletedStages() {
		ModuleEntity module = new ModuleEntity();
		List<Integer> shades = displayed(FIRST_PICTURE, 2);

		SolveSuccess<VisualImpairmentOutput> pending = solve(module, shades, "red", false, false);
		assertThat(pending.output()).isEqualTo(new VisualImpairmentOutput(
			List.of("A1", "E1", "C3", "E3", "D4", "A5", "D5"), 1, 1
		));
		assertThat(pending.solved()).isFalse();
		assertThat(module.getState()).doesNotContainKey("desiredColors");

		SolveSuccess<VisualImpairmentOutput> completed = solve(module, shades, "red", true, false);
		assertThat(completed.solved()).isFalse();
		assertThat(module.getState().get("desiredColors")).isEqualTo(List.of("Red"));

		solve(module, displayed(FIRST_PICTURE, 7), "white", false, false);
		assertThat(module.getState().get("desiredColors")).isEqualTo(List.of("Red"));
		SolveSuccess<VisualImpairmentOutput> solved = solve(module, displayed(FIRST_PICTURE, 7), "white", true, true);
		assertThat(solved.solved()).isTrue();
		assertThat(module.getState().get("desiredColors")).isEqualTo(List.of("Red", "White"));
	}

	@Test
	void rejectsIncompleteAndUnknownGrids() {
		assertThat(solve(new ModuleEntity(), displayed(SYMMETRICAL_PICTURE, 1), "green", false, false).output().pictureNumber())
			.isEqualTo(2);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new VisualImpairmentInput(List.of(1, 2), "blue", false, false))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new VisualImpairmentInput(List.of(
				1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
			), "blue", false, false))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<VisualImpairmentOutput> solve(
		ModuleEntity module, List<Integer> shades, String color, boolean stageComplete, boolean moduleSolved
	) {
		return (SolveSuccess<VisualImpairmentOutput>)solver.solve(new RoundEntity(), new BombEntity(), module,
			new VisualImpairmentInput(shades, color, stageComplete, moduleSolved));
	}

	private static List<Integer> displayed(String picture, int orientation) {
		int[] shadeByColor = new int[128];
		shadeByColor['R'] = 4;
		shadeByColor['G'] = 1;
		shadeByColor['B'] = 2;
		shadeByColor['W'] = 3;
		List<Integer> shades = new ArrayList<>(java.util.Collections.nCopies(25, 0));
		for (int original = 0; original < 25; original++) {
			int x = original % 5;
			int y = original / 5;
			int displayed = switch (orientation) {
				case 2 -> 5 * x + 4 - y;
				case 7 -> 5 * (4 - y) + x;
				default -> original;
			};
			shades.set(displayed, shadeByColor[picture.charAt(original)]);
		}
		return shades;
	}
}
