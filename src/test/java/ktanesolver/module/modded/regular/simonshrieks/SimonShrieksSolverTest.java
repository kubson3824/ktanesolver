package ktanesolver.module.modded.regular.simonshrieks;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class SimonShrieksSolverTest {
	private final SimonShrieksSolver solver = new SimonShrieksSolver();

	@Test
	void solvesAllStagesAndPersistsTheFinalSequenceForSouvenir() {
		BombEntity bomb = bomb("A1B2C3");
		ModuleEntity module = new ModuleEntity();

		assertThat(solve(bomb, module, 1, 0, 6, 1, 4).presses()).containsExactly("GREEN", "RED");
		assertThat(solve(bomb, module, 2, 0, 6, 1, 4, 2, 5).presses()).containsExactly("WHITE", "GREEN");
		assertThat(solve(bomb, module, 3, 0, 6, 1, 4, 2, 5, 3, 0).presses())
			.containsExactly("WHITE", "BLUE", "CYAN", "RED");

		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("flashes")).isEqualTo(List.of(0, 6, 1, 4, 2, 5, 3, 0));
		assertThat((List<?>) module.getState().get("pressHistory")).hasSize(3);
	}

	@Test
	void usesOddCountsWithoutASerialVowelAndRejectsBrokenStagePrefixes() {
		BombEntity bomb = bomb("BCD123");
		ModuleEntity module = new ModuleEntity();
		assertThat(solve(bomb, module, 1, 0, 6, 1, 4).presses())
			.containsExactly("WHITE", "BLUE", "YELLOW", "CYAN", "MAGENTA");

		assertThat(solver.solve(new RoundEntity(), bomb, module,
			new SimonShrieksInput(2, List.of(0, 5, 1, 4, 2, 5))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SimonShrieksOutput solve(BombEntity bomb, ModuleEntity module, int stage, Integer... flashes) {
		return ((SolveSuccess<SimonShrieksOutput>) solver.solve(
			new RoundEntity(), bomb, module, new SimonShrieksInput(stage, List.of(flashes)))).output();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		return bomb;
	}
}
