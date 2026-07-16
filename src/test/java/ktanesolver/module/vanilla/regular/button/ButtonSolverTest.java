package ktanesolver.module.vanilla.regular.button;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class ButtonSolverTest {
	private final ButtonSolver solver = new ButtonSolver();

	@Test
	void holdWaitsForStripColorBeforeSolving() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.BUTTON);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		SolveSuccess<ButtonOutput> hold = (SolveSuccess<ButtonOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new ButtonInput("BLUE", "ABORT", null));

		assertThat(hold.output().hold()).isTrue();
		assertThat(module.isSolved()).isFalse();

		SolveSuccess<ButtonOutput> release = (SolveSuccess<ButtonOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new ButtonInput("BLUE", "ABORT", "YELLOW"));

		assertThat(release.output().releaseDigit()).isEqualTo(5);
		assertThat(module.isSolved()).isTrue();
	}

	@Test
	void translatesButtonLabelsBeforeApplyingRules() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.BUTTON);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		SolveSuccess<ButtonOutput> result = (SolveSuccess<ButtonOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new ButtonInput("BLUE", "Abbrechen", null, "DE"));

		assertThat(result.output().hold()).isTrue();
		assertThat(module.getState()).containsEntry("language", "DE");
	}
}
