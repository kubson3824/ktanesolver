package ktanesolver.module.modded.regular.seashells;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class SeaShellsSolverTest {
	private final SeaShellsSolver solver = new SeaShellsSolver();

	@Test
	void translatesTablesAndSolvesAfterThreeStages() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		SeaShellsOutput first = solve(module, new SeaShellsInput("she sells", "sea shells", "on the sea shore"));
		assertThat(first.pressOrder()).containsExactly("shih tzu", "sit", "shoe", "shih tzu", "sit", "shoe", "shih tzu");
		assertThat(first.stage()).isEqualTo(1);
		assertThat(module.isSolved()).isFalse();

		solve(module, new SeaShellsInput("sea shells", "she sells", "on the seesaw"));
		SeaShellsOutput third = solve(module, new SeaShellsInput("sea sells", "sea sells", "on the she sure"));
		assertThat(third.stage()).isEqualTo(3);
		assertThat(module.isSolved()).isTrue();
	}

	@SuppressWarnings("unchecked")
	private SeaShellsOutput solve(ModuleEntity module, SeaShellsInput input) {
		return ((SolveSuccess<SeaShellsOutput>)solver.solve(new RoundEntity(), new BombEntity(), module, input)).output();
	}
}
