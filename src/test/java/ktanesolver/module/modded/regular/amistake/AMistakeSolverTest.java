package ktanesolver.module.modded.regular.amistake;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class AMistakeSolverTest {
	private final AMistakeSolver solver = new AMistakeSolver();

	@Test
	void advancesThroughAllThreeUpstreamTouchGrammars() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("A1B2C3"); ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>());
		assertThat(solve(bomb, module)).isEqualTo(new AMistakeOutput(1, "Touch immediately", "touch", 2));
		assertThat(solve(bomb, module).twitchCommand()).isEqualTo("touch 3");
		assertThat(solve(bomb, module).twitchCommand()).isEqualTo("touch 06");
		assertThat(module.getState()).containsEntry("mistakeNextStage", 3);
	}

	@SuppressWarnings("unchecked") private AMistakeOutput solve(BombEntity bomb, ModuleEntity module) { return ((SolveSuccess<AMistakeOutput>) solver.solve(new RoundEntity(), bomb, module, new AMistakeInput())).output(); }
}
