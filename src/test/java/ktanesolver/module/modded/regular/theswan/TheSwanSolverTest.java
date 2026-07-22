package ktanesolver.module.modded.regular.theswan;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TheSwanSolverTest {
	private final TheSwanSolver solver = new TheSwanSolver();

	@Test
	void mapsEveryResetCountAndPersistsTheSouvenirAnswer() {
		List<String> expected = List.of(
			"SWAN", "HATCH", "HATCH", "SWN", "SWAN", "HATCH", "SWAN", "DARMA", "DHARMA", "SWN",
			"DHARMA", "HATCH", "SWAN", "DARMA", "DHARMA", "HTCH", "DHARMA", "SWAN", "HATCH", "HTCH",
			"HATCH", "HTCH", "HTCH", "SWAN", "DHARMA"
		);
		for (int resetCount = 0; resetCount < expected.size(); resetCount++) {
			assertThat(TheSwanSolver.codeFor(resetCount)).isEqualTo(expected.get(resetCount));
		}
		assertThat(TheSwanSolver.codeFor(25)).isEqualTo("77");
		assertThat(TheSwanSolver.codeFor(108)).isEqualTo("77");

		ModuleEntity module = new ModuleEntity();
		SolveSuccess<TheSwanOutput> result = (SolveSuccess<TheSwanOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new TheSwanInput(13));
		assertThat(result.output()).isEqualTo(new TheSwanOutput("DARMA", 13));
		assertThat(module.getState().get("resetCount")).isEqualTo(13);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new TheSwanInput(-1)))
			.isInstanceOf(SolveFailure.class);
	}
}
