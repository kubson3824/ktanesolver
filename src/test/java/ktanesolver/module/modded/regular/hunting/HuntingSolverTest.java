package ktanesolver.module.modded.regular.hunting;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class HuntingSolverTest {
	private final HuntingSolver solver = new HuntingSolver();
	private final ModuleEntity module = new ModuleEntity();

	@Test
	void appliesBothTablesToEveryAccumulatedClueAndFindsASafeButton() {
		assertThat(solve(1, "o_", "M", List.of()).decoys()).containsExactly("h_");
		assertThat(solve(2, "U", "W", List.of("Q", "v_", "h_", "R", "K")))
			.isEqualTo(new HuntingOutput(2, List.of("t_", "v_"), 1));
		assertThat(solve(3, "z_", "f_", List.of()).decoys()).containsExactly("t_", "v_", "Q");
		assertThat(solve(4, "H", "A", List.of()).decoys()).containsExactly("h_", "Q", "u_", "I");
		assertThat(module.isSolved()).isTrue();
	}

	@Test
	void aNewFirstStageReplacesTheStruckAttemptForSouvenir() {
		solve(1, "o_", "M", List.of());
		solve(2, "U", "W", List.of());
		assertThat(solve(1, "H", "A", List.of()).decoys()).containsExactly("u_");
		assertThat(module.getState().get("clueHistory")).isEqualTo(List.of(List.of("H", "A")));
	}

	@Test
	void rejectsSkippedStagesAndInvalidCluePairs() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, new HuntingInput(2, "M", "o_", List.of())))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, new HuntingInput(1, "M", "U", List.of())))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private HuntingOutput solve(int stage, String left, String right, List<String> buttons) {
		return ((SolveSuccess<HuntingOutput>) solver.solve(new RoundEntity(), new BombEntity(), module,
			new HuntingInput(stage, left, right, buttons))).output();
	}
}
