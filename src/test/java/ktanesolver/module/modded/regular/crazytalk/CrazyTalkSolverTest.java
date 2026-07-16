package ktanesolver.module.modded.regular.crazytalk;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class CrazyTalkSolverTest {

	@Test
	void acceptsLowercaseAndExposesDisplaySuggestions() {
		CrazyTalkSolver solver = new CrazyTalkSolver();
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		var result = (SolveSuccess<CrazyTalkOutput>)solver.solve(
			new RoundEntity(), new BombEntity(), module, new CrazyTalkInput("literally blank")
		);

		assertThat(result.output()).isEqualTo(new CrazyTalkOutput(1, 5));
		assertThat(solver.displays()).contains("LITERALLY BLANK");
	}
}
