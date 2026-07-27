package ktanesolver.module.modded.regular.fontselect;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class FontSelectSolverTest {
	private final FontSelectSolver solver = new FontSelectSolver();

	@Test
	void selectsEachTablePriorityAndReturnsParserValidActions() {
		assertThat(solve("Eight Ate 8", List.of("Special Elite", "Chewy", "Karma"), "Karma"))
			.isEqualTo(new FontSelectOutput("Special Elite", List.of("right", "submit")));
		assertThat(solve("888", List.of("Special Elite", "Ostrich Sans", "Chewy"), "Special Elite"))
			.isEqualTo(new FontSelectOutput("Chewy", List.of("left", "submit")));
		assertThat(solve("U.R. 1", List.of("Karma", "Indie Flower", "Rock Salt"), "Indie Flower"))
			.isEqualTo(new FontSelectOutput("Indie Flower", List.of("submit")));
		assertThat(solve("8 ate eight", List.of("Chewy", "Karma", "Gochi Hand"), "Gochi Hand"))
			.isEqualTo(new FontSelectOutput("Karma", List.of("left", "submit")));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new FontSelectInput("888", List.of("Chewy", "Chewy", "Karma"), "Chewy")))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private FontSelectOutput solve(String phrase, List<String> fonts, String currentFont) {
		SolveResult<FontSelectOutput> result = solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), new FontSelectInput(phrase, fonts, currentFont)
		);
		return ((SolveSuccess<FontSelectOutput>) result).output();
	}
}
