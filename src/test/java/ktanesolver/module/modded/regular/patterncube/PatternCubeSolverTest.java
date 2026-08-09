package ktanesolver.module.modded.regular.patterncube;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class PatternCubeSolverTest {
	private final PatternCubeSolver solver = new PatternCubeSolver();

	@Test
	void foldsTheNetUsesTheHighlightAndProducesEveryPlacement() {
		PatternCubeInput input = new PatternCubeInput(
			1, 3,
			List.of("B1", "A2", "B2", "C2", "B3", "B4"),
			Map.of("B1", "C", "A2", "D", "B2", "E", "C2", "F", "B3", "G", "B4", "H"),
			"B1", "H", 3, "B2", "X",
			List.of(symbol("X"), symbol("A"), symbol("B"), symbol("G"), symbol("F"))
		);
		ModuleEntity module = module();
		var raw = solver.solve(new RoundEntity(), new BombEntity(), module, input);
		assertThat(raw).withFailMessage(raw instanceof SolveFailure<?> failure ? failure.getReason() : raw.toString()).isInstanceOf(SolveSuccess.class);
		@SuppressWarnings("unchecked")
		SolveSuccess<PatternCubeOutput> result = (SolveSuccess<PatternCubeOutput>) raw;

		assertThat(result.output().placements()).containsExactly(
			new PatternCubePlacement(1, "X", "B2", "E", 0, 1, "cw"),
			new PatternCubePlacement(2, "A", "A2", "D", 0, 0, "none"),
			new PatternCubePlacement(3, "B", "B3", "G", 0, 1, "cw"),
			new PatternCubePlacement(4, "G", "C2", "F", 0, 1, "cw"),
			new PatternCubePlacement(5, "F", "B4", "H", 0, 3, "ccw")
		);
		assertThat(module.getState()).containsEntry("highlightedSymbol", "X");
	}

	@Test
	void rejectsDisconnectedNetsAndNonMatchingReferenceCubes() {
		PatternCubeInput disconnected = new PatternCubeInput(
			1, 3, List.of("A1", "A2", "A3", "A4", "A5", "E5"),
			Map.of("A1", "A", "A2", "B", "A3", "C", "A4", "D", "A5", "E", "E5", "F"),
			"A1", "A", 0, "A2", "X",
			List.of(symbol("X"), symbol("B"), symbol("H"), symbol("G"), symbol("F")));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), disconnected)).isInstanceOf(SolveFailure.class);

		PatternCubeInput overlapping = new PatternCubeInput(
			1, 1, disconnected.netCells(), disconnected.cellLetters(), "A1", "A", 0, "A2", "X", disconnected.selections());
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), overlapping)).isInstanceOf(SolveFailure.class);
	}

	private static PatternCubeSymbolInput symbol(String symbol) { return new PatternCubeSymbolInput(symbol, 0); }

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.PATTERN_CUBE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
