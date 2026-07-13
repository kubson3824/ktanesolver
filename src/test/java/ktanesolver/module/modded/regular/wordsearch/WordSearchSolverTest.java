package ktanesolver.module.modded.regular.wordsearch;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class WordSearchSolverTest {
	private final WordSearchSolver solver = new WordSearchSolver();

	@Test
	void returnsParityWordsAndOnlySolvesAfterConfirmation() {
		SolveSuccess<WordSearchOutput> odd = solve("ABC123", "LJIK", false);
		assertThat(odd.output()).isEqualTo(new WordSearchOutput(List.of("LISTEN", "SPELL", "LOOK", "BEEP")));
		assertThat(odd.solved()).isFalse();

		SolveSuccess<WordSearchOutput> even = solve("ABC124", "LJIK", true);
		assertThat(even.output()).isEqualTo(new WordSearchOutput(List.of("READ", "MODULE", "NUMBER", "ROMEO")));
		assertThat(even.solved()).isTrue();
	}

	@Test
	void rejectsInvalidCorners() {
		assertThat(solver.solve(new RoundEntity(), bomb("ABC123"), new ModuleEntity(), new WordSearchInput("ABC", false)))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), bomb("ABC124"), new ModuleEntity(), new WordSearchInput("LJ1K", false)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<WordSearchOutput> solve(String serial, String corners, boolean confirmed) {
		return (SolveSuccess<WordSearchOutput>) solver.solve(
			new RoundEntity(), bomb(serial), new ModuleEntity(), new WordSearchInput(corners, confirmed));
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		return bomb;
	}
}
