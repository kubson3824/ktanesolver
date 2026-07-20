package ktanesolver.module.modded.regular.symbolcycle;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.symbolcycle.SymbolCycleInput.Mode;
import ktanesolver.module.modded.regular.symbolcycle.SymbolCycleInput.Screen;

class SymbolCycleSolverTest {
	private final SymbolCycleSolver solver = new SymbolCycleSolver();

	@Test
	void solvesBothStatesAndKeepsSuccessfulCycleLengthsForSouvenir() {
		ModuleEntity retroModule = module();
		SymbolCycleOutput retro = solve(retroModule, new SymbolCycleInput(
			Mode.RETROTRANSPHASIC, 40,
			List.of("crescent", "star", "wave"), List.of("eye", "hook", "cross", "loop"),
			1_000_007, List.of("decoy", "wave", "crescent", "star"), List.of("hook", "cross", "loop", "eye", "other"),
			null, null, null
		));
		assertThat(retro.leftSymbol()).isEqualTo("star");
		assertThat(retro.rightSymbol()).isEqualTo("loop");
		assertThat(retro.leftClicks()).isEqualTo(3);
		assertThat(retro.rightClicks()).isEqualTo(2);
		assertThat(retroModule.getState()).containsEntry("leftCycleLength", 3).containsEntry("rightCycleLength", 4);

		SymbolCycleOutput antero = solve(module(), new SymbolCycleInput(
			Mode.ANTERODIAMETRIC, 40,
			List.of("crescent", "star", "wave"), List.of("eye", "hook", "cross", "loop"),
			1_000_007, null, null, "crescent", "loop", Screen.LEFT
		));
		assertThat(antero.targetCycle()).isEqualTo(1_000_003);
		assertThat(antero.clickScreen()).isEqualTo(Screen.RIGHT);
		assertThat(antero.clicks()).isEqualTo(4);
	}

	@Test
	void rejectsImpossibleCycleLengthPair() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new SymbolCycleInput(
			Mode.ANTERODIAMETRIC, 10, List.of("a", "b"), List.of("c", "d", "e", "f"),
			1_000_000, null, null, "a", "c", Screen.LEFT
		))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SymbolCycleOutput solve(ModuleEntity module, SymbolCycleInput input) {
		var result = solver.solve(new RoundEntity(), new BombEntity(), module, input);
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();
		return ((SolveSuccess<SymbolCycleOutput>) result).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
