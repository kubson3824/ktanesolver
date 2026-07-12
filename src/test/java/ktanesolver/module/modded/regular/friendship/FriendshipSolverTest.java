package ktanesolver.module.modded.regular.friendship;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class FriendshipSolverTest {
	@Test
	void disregardsTheLeftmostAndUppermostUnalignedSymbols() {
		List<FriendshipSymbol> symbols = List.of(
			new FriendshipSymbol("Amethyst Star", 1, 7),
			new FriendshipSymbol("Apple Cinnamon", 3, 8),
			new FriendshipSymbol("Apple Fritter", 5, 9),
			new FriendshipSymbol("Coloratura", 2, 1),
			new FriendshipSymbol("Daisy", 4, 3),
			new FriendshipSymbol("Daring Do", 6, 5)
		);
		FriendshipInput input = new FriendshipInput(symbols, List.of("Patience", "Sympathy", "Fairness", "Courage", "Loyalty", "Support", "Honesty"));
		var result = (SolveSuccess<FriendshipOutput>)new FriendshipSolver().solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), input);

		assertThat(result.output().element()).isEqualTo("Sympathy");
		assertThat(result.output().possibleElements()).containsExactly("Kindness", "Sympathy", "Inspiration", "Conscientiousness");
	}
}
