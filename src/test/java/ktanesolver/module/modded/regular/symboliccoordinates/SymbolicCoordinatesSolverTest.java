package ktanesolver.module.modded.regular.symboliccoordinates;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class SymbolicCoordinatesSolverTest {
	private final SymbolicCoordinatesSolver solver = new SymbolicCoordinatesSolver();

	@Test
	void decodesThreeStagesAndUsesStarsForUnlistedPatterns() {
		ModuleEntity module = module();

		assertThat(calculate(module, List.of("P", "L", "A"), List.of("AQUA", "GREEN", "YELLOW")))
			.isEqualTo(new SymbolicCoordinatesOutput(1, "A0", false));
		assertThat(module.isSolved()).isFalse();
		assertThat(confirm(module, List.of("P", "L", "A"), List.of("AQUA", "GREEN", "YELLOW")))
			.isEqualTo(new SymbolicCoordinatesOutput(1, "A0", true));

		assertThat(calculate(module, List.of("E", "C", "P"), List.of("PURPLE", "GREEN", "AQUA")))
			.isEqualTo(new SymbolicCoordinatesOutput(2, "Z9", false));
		assertThat(confirm(module, List.of("E", "C", "P"), List.of("PURPLE", "GREEN", "AQUA")))
			.isEqualTo(new SymbolicCoordinatesOutput(2, "Z9", true));

		assertThat(calculate(module, List.of("A", "A", "A"), List.of("AQUA", "AQUA", "AQUA")))
			.isEqualTo(new SymbolicCoordinatesOutput(3, "**", false));
		assertThat(module.isSolved()).isFalse();
		assertThat(confirm(module, List.of("A", "A", "A"), List.of("AQUA", "AQUA", "AQUA")))
			.isEqualTo(new SymbolicCoordinatesOutput(3, "**", true));
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("stageSymbols")).isEqualTo(List.of(
			List.of("P", "L", "A"), List.of("E", "C", "P"), List.of("A", "A", "A")
		));
	}

	@Test
	void rejectsUnknownSymbolsWithoutRecordingAStage() {
		ModuleEntity module = module();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new SymbolicCoordinatesInput(List.of("A", "?", "P"), List.of("AQUA", "GREEN", "YELLOW"), false)))
			.isInstanceOf(SolveFailure.class);
		assertThat(module.getState()).isEmpty();
	}

	@Test
	void recalculatesTheSameStageAfterAReportedStrike() {
		ModuleEntity module = module();
		calculate(module, List.of("P", "L", "A"), List.of("AQUA", "GREEN", "YELLOW"));

		SymbolicCoordinatesOutput replacement = calculate(
			module,
			List.of("E", "C", "P"),
			List.of("PURPLE", "GREEN", "AQUA")
		);

		assertThat(replacement).isEqualTo(new SymbolicCoordinatesOutput(1, "Z9", false));
		assertThat(module.getState()).doesNotContainKey("stageSymbols");
		assertThat(confirm(module, List.of("E", "C", "P"), List.of("PURPLE", "GREEN", "AQUA")))
			.isEqualTo(new SymbolicCoordinatesOutput(1, "Z9", true));
		assertThat(module.getState().get("stageSymbols")).isEqualTo(List.of(List.of("E", "C", "P")));
	}

	@SuppressWarnings("unchecked")
	private SymbolicCoordinatesOutput calculate(ModuleEntity module, List<String> symbols, List<String> colors) {
		return solve(module, symbols, colors, false);
	}

	@SuppressWarnings("unchecked")
	private SymbolicCoordinatesOutput confirm(ModuleEntity module, List<String> symbols, List<String> colors) {
		return solve(module, symbols, colors, true);
	}

	@SuppressWarnings("unchecked")
	private SymbolicCoordinatesOutput solve(ModuleEntity module, List<String> symbols, List<String> colors, boolean confirmStage) {
		return ((SolveSuccess<SymbolicCoordinatesOutput>) solver.solve(new RoundEntity(), new BombEntity(), module,
			new SymbolicCoordinatesInput(symbols, colors, confirmStage))).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
