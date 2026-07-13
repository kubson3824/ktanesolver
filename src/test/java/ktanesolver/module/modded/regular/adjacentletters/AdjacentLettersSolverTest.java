package ktanesolver.module.modded.regular.adjacentletters;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import org.junit.jupiter.api.Test;

class AdjacentLettersSolverTest {

	private final AdjacentLettersSolver solver = new AdjacentLettersSolver();

	@Test
	void findsHorizontalAndVerticalMatchesWithoutSelectingNonMatches() {
		ModuleEntity module = module();
		var result = solver.solve(
			new RoundEntity(), new BombEntity(), module,
			new AdjacentLettersInput(List.of("a", "g", "x", "z", "c", "d", "y", "n", "b", "p", "h", "l"))
		);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<AdjacentLettersOutput>) result).output().pressLetters())
			.containsExactly("A", "G", "N", "B", "H");
		assertThat(module.getState()).containsKey("input");
		assertThat(module.isSolved()).isTrue();
	}

	@Test
	void rejectsDuplicateLetters() {
		var result = solver.solve(
			new RoundEntity(), new BombEntity(), module(),
			new AdjacentLettersInput(List.of("A", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"))
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<AdjacentLettersOutput>) result).getReason())
			.isEqualTo("All 12 letters must be different");
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.ADJACENT_LETTERS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
