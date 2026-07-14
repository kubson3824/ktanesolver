package ktanesolver.module.modded.regular.symbolicpassword;

import static ktanesolver.module.shared.keypad.KeypadSymbol.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.shared.keypad.KeypadSymbol;

class SymbolicPasswordSolverTest {
	private final SymbolicPasswordSolver solver = new SymbolicPasswordSolver();

	@Test
	void findsTheManualRegionAndShortestMovesIncludingDuplicateSymbols() {
		ModuleEntity module = new ModuleEntity();
		List<KeypadSymbol> shuffled = List.of(COPYRIGHT, BALLOON, EURO, AT, BALLOON, PUMPKIN);
		var result = (SolveSuccess<SymbolicPasswordOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new SymbolicPasswordInput(shuffled));

		assertThat(result.output()).isEqualTo(new SymbolicPasswordOutput(
			List.of(BALLOON, EURO, COPYRIGHT, AT, BALLOON, PUMPKIN), List.of("TOP_LEFT")));
		assertThat(module.getState()).containsEntry("symbols", shuffled);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new SymbolicPasswordInput(List.of(BALLOON, AT, LAMBDA, LIGHTNING, SQUID_KNIFE, OMEGA))))
			.isInstanceOf(SolveFailure.class);
	}
}
