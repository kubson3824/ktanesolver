package ktanesolver.module.modded.regular.ledencryption;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class LedEncryptionSolverTest {
	private final LedEncryptionSolver solver = new LedEncryptionSolver();

	@Test
	void findsEveryCorrectButtonAndSolvesTheFinalStage() {
		ModuleEntity module = module();

		LedEncryptionOutput first = solve(module, new LedEncryptionInput("red", List.of("B", "D", "G", "C"), 2));
		assertThat(first.correctButtons()).containsExactly("TOP_LEFT", "TOP_RIGHT");
		assertThat(first.correctLetters()).containsExactly("B", "D");
		assertThat(module.isSolved()).isFalse();

		LedEncryptionOutput second = solve(module, new LedEncryptionInput("orange", List.of("B", "C", "O", "H"), 2));
		assertThat(second.stage()).isEqualTo(2);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("stageLetters")).isEqualTo(List.of(
			List.of("B", "D", "G", "C"), List.of("B", "C", "O", "H")
		));
	}

	@Test
	void rejectsAnImpossibleDisplayWithoutRecordingIt() {
		ModuleEntity module = module();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new LedEncryptionInput("red", List.of("A", "B", "D", "C"), 2)))
			.isInstanceOf(SolveFailure.class);
		assertThat(module.getState()).isEmpty();
	}

	@SuppressWarnings("unchecked")
	private LedEncryptionOutput solve(ModuleEntity module, LedEncryptionInput input) {
		return ((SolveSuccess<LedEncryptionOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input)).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
