package ktanesolver.module.modded.regular.englishtest;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class EnglishTestSolverTest {
	private final EnglishTestSolver solver = new EnglishTestSolver();

	@Test
	void looksUpDisplayedVariantsAndUsesVisibleQuestionNumberForProgress() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		EnglishTestOutput first = solve(module, new EnglishTestInput("  YOU NEED TO BE AT there WEDDING.  ", 1));
		assertThat(first.correctAnswer()).isEqualTo("their");
		assertThat(module.isSolved()).isFalse();

		EnglishTestOutput second = solve(module, new EnglishTestInput("I wouldn’t have done that if I were you.", 2));
		assertThat(second.correctAnswer()).isEqualTo("have");
		assertThat(module.isSolved()).isFalse();

		EnglishTestOutput third = solve(module, new EnglishTestInput("I rowed the boat as hard as I can!", 3));
		assertThat(third.correctAnswer()).isEqualTo("rowed");
		assertThat(module.isSolved()).isTrue();

		SolveResult<EnglishTestOutput> unknown = solver.solve(new RoundEntity(), new BombEntity(), module, new EnglishTestInput("Not a real question.", 1));
		assertThat(unknown).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private EnglishTestOutput solve(ModuleEntity module, EnglishTestInput input) {
		return ((SolveSuccess<EnglishTestOutput>)solver.solve(new RoundEntity(), new BombEntity(), module, input)).output();
	}
}
