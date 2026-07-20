package ktanesolver.module.modded.regular.set;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.set.SetInput.Card;

class SetSolverTest {
	private final SetSolver solver = new SetSolver();

	@Test
	void findsTheUniqueTripletAndRejectsAmbiguousEntries() {
		SetInput unique = new SetInput(List.of(
			card("A1", 0, "filled"), card("B2", 1, "wavy"), card("C3", 2, "empty"),
			card("B1", 0, "filled"), card("A2", 0, "filled"), card("B2", 0, "filled"),
			card("A1", 1, "filled"), card("B1", 1, "filled"), card("A2", 1, "filled")
		));
		var result = solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), unique);
		assertThat(((SolveSuccess<SetOutput>) result).output().positions()).containsExactly("A1", "B1", "C1");

		List<Card> ambiguous = new ArrayList<>();
		for(int row = 1; row <= 3; row++) for(char column = 'A'; column <= 'C'; column++) {
			ambiguous.add(card("" + column + row, 0, "filled"));
		}
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new SetInput(ambiguous)))
			.isInstanceOf(SolveFailure.class);
	}

	private static Card card(String symbol, int dots, String shading) {
		return new Card(symbol, dots, shading);
	}
}
