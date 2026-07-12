package ktanesolver.module.modded.regular.gamepad;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class GamepadSolverTest {
	private final GamepadSolver solver = new GamepadSolver();

	@Test
	void appliesFirstMatchesAndGlobalOverrides() {
		assertThat(solve(3, 7)).containsExactly("UP", "UP", "DOWN", "DOWN", "LEFT", "RIGHT", "LEFT", "RIGHT");
		assertThat(solve(22, 17)).containsExactly("LEFT", "A", "B", "RIGHT", "LEFT", "RIGHT", "LEFT", "RIGHT");
		assertThat(solve(30, 32)).containsExactly("A", "B", "RIGHT", "A", "DOWN", "UP", "B", "RIGHT");
		assertThat(solve(36, 64)).containsExactly("LEFT", "LEFT", "A", "UP", "UP", "B", "RIGHT", "DOWN");
	}

	@SuppressWarnings("unchecked")
	private java.util.List<String> solve(int x, int y) {
		ModuleEntity module = new ModuleEntity();
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		SolveSuccess<GamepadOutput> result = (SolveSuccess<GamepadOutput>)solver.solve(
			new RoundEntity(), bomb, module, new GamepadInput(x, y));
		return result.output().sequence();
	}
}
