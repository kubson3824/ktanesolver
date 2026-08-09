package ktanesolver.module.modded.regular.simonsstar;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.simonsstar.SimonsStarInput.Color;

class SimonsStarSolverTest {
	private final SimonsStarSolver solver = new SimonsStarSolver();
	private final List<Color> buttons = List.of(Color.BLUE, Color.GREEN, Color.PURPLE, Color.RED, Color.YELLOW);

	@Test
	void solvesAllFiveStagesAndPersistsEverySouvenirFlash() {
		ModuleEntity module = module();
		List<Color> flashes = List.of(Color.RED, Color.GREEN, Color.BLUE, Color.YELLOW, Color.PURPLE);
		List<Integer> digits = List.of(0, 0, 2, 1, 4);
		List<Color> expected = List.of(Color.RED, Color.RED, Color.PURPLE, Color.RED, Color.GREEN);

		for (int stage = 0; stage < 5; stage++) {
			SolveResult<SimonsStarOutput> result = solver.solve(new RoundEntity(), new BombEntity(), module,
				new SimonsStarInput(buttons, flashes.get(stage), digits.get(stage)));
			assertThat(result).isInstanceOf(SolveSuccess.class);
			assertThat(((SolveSuccess<SimonsStarOutput>) result).output().presses())
				.isEqualTo(expected.subList(0, stage + 1));
			assertThat(module.isSolved()).isEqualTo(stage == 4);
		}
		assertThat(module.getState().get("flashes"))
			.isEqualTo(List.of("RED", "GREEN", "BLUE", "YELLOW", "PURPLE"));
	}

	@Test
	void rejectsDuplicateAndChangedButtonArrangements() {
		ModuleEntity module = module();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new SimonsStarInput(List.of(Color.RED, Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW), Color.RED, 0)))
			.isInstanceOf(SolveFailure.class);

		solver.solve(new RoundEntity(), new BombEntity(), module, new SimonsStarInput(buttons, Color.RED, 0));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new SimonsStarInput(List.of(Color.GREEN, Color.BLUE, Color.PURPLE, Color.RED, Color.YELLOW), Color.GREEN, 0)))
			.isInstanceOf(SolveFailure.class);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.SIMONS_STAR);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
