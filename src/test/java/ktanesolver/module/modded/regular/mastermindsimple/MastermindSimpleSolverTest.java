package ktanesolver.module.modded.regular.mastermindsimple;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.mastermindsimple.MastermindSimpleInput.Attempt;

class MastermindSimpleSolverTest {
	private static final List<String> COLORS = List.of("WHITE", "MAGENTA", "YELLOW", "GREEN", "RED", "BLUE");
	private final MastermindSimpleSolver solver = new MastermindSimpleSolver();

	@Test
	void solvesARepeatedColorCodeFromQueryFeedback() {
		List<String> secret = List.of("RED", "BLUE", "RED", "GREEN", "WHITE");
		List<Attempt> attempts = new ArrayList<>();
		ModuleEntity module = new ModuleEntity();

		SolveSuccess<MastermindSimpleOutput> result = success(solver.solve(
			new RoundEntity(), new BombEntity(), module, new MastermindSimpleInput(attempts)));
		assertThat(result.output().nextGuess()).containsExactly("WHITE", "WHITE", "MAGENTA", "MAGENTA", "YELLOW");
		assertThat(result.output().remainingCandidates()).isEqualTo(7776);

		for (int query = 0; query < 20 && !result.solved(); query++) {
			int[] feedback = score(secret, result.output().nextGuess());
			attempts.add(new Attempt(result.output().nextGuess(), feedback[0], feedback[1]));
			result = success(solver.solve(new RoundEntity(), new BombEntity(), module, new MastermindSimpleInput(attempts)));
		}

		assertThat(result.solved()).isTrue();
		assertThat(result.output().nextGuess()).isEqualTo(secret);
		assertThat(result.output().remainingCandidates()).isOne();
		assertThat(module.getState()).containsKey("attempts");
	}

	@Test
	void rejectsImpossibleFeedback() {
		Object result = solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new MastermindSimpleInput(List.of(new Attempt(List.of("WHITE", "WHITE", "WHITE", "WHITE", "WHITE"), 4, 1))));
		assertThat(result).isInstanceOf(SolveFailure.class);
	}

	private static int[] score(List<String> code, List<String> guess) {
		int exact = 0;
		int[] codeCounts = new int[COLORS.size()];
		int[] guessCounts = new int[COLORS.size()];
		for (int i = 0; i < 5; i++) {
			if (code.get(i).equals(guess.get(i))) exact++;
			else {
				codeCounts[COLORS.indexOf(code.get(i))]++;
				guessCounts[COLORS.indexOf(guess.get(i))]++;
			}
		}
		int misplaced = 0;
		for (int i = 0; i < COLORS.size(); i++) misplaced += Math.min(codeCounts[i], guessCounts[i]);
		return new int[] {exact, misplaced};
	}

	@SuppressWarnings("unchecked")
	private static SolveSuccess<MastermindSimpleOutput> success(Object result) {
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return (SolveSuccess<MastermindSimpleOutput>) result;
	}
}
