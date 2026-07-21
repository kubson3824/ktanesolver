package ktanesolver.module.modded.regular.jukebox;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class JukeboxSolverTest {
	private final JukeboxSolver solver = new JukeboxSolver();

	@Test
	void identifiesTheSongAndOrdersTheDisplayedButtons() {
		ModuleEntity module = module();

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new JukeboxInput(List.of("Away", "We're", "Talking"))))
			.isEqualTo(new SolveSuccess<>(new JukeboxOutput("Take on Me", List.of(2, 3, 1)), true));
		assertThat(module.getState()).containsKey("input");
	}

	@Test
	void rejectsLyricsThatCannotBeOneDisplayedSet() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new JukeboxInput(List.of("Away", "Away", "Talking"))))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new JukeboxInput(List.of("Away", "Talking", "Drums"))))
			.isInstanceOf(SolveFailure.class);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
