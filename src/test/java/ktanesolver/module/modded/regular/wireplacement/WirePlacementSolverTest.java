package ktanesolver.module.modded.regular.wireplacement;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.wireplacement.WirePlacementInput.Wire;
import ktanesolver.module.modded.regular.wireplacement.WirePlacementInput.WireColor;

class WirePlacementSolverTest {
	private final WirePlacementSolver solver = new WirePlacementSolver();

	@Test
	void solvesDefaultManualLookupAndStoresInput() {
		ModuleEntity module = module();
		var result = solver.solve(new RoundEntity(), new BombEntity(), module, new WirePlacementInput(List.of(
			new Wire("A1", "B1", WireColor.BLUE),
			new Wire("C1", "D1", WireColor.YELLOW),
			new Wire("A2", "B2", WireColor.WHITE),
			new Wire("C2", "D2", WireColor.BLACK),
			new Wire("A3", "B3", WireColor.RED),
			new Wire("C3", "D3", WireColor.BLUE),
			new Wire("A4", "B4", WireColor.WHITE),
			new Wire("C4", "D4", WireColor.BLACK)
		)));

		assertThat(result).isInstanceOf(SolveSuccess.class);
		WirePlacementOutput output = ((SolveSuccess<WirePlacementOutput>) result).output();
		assertThat(output.referenceColor()).isEqualTo(WireColor.BLUE);
		assertThat(output.cutWires()).extracting(WirePlacementOutput.CutWire::number).containsExactly(2, 5, 8);
		assertThat(output.cutWires()).extracting(WirePlacementOutput.CutWire::coordinate).containsExactly("D1", "B3", "D4");
		assertThat(module.getState()).containsKey("wires");
	}

	@Test
	void rejectsCoordinatesUsedByMultipleWires() {
		ModuleEntity module = module();
		var repeated = new Wire("A1", "B1", WireColor.RED);
		var result = solver.solve(new RoundEntity(), new BombEntity(), module,
			new WirePlacementInput(List.of(repeated, repeated, repeated, repeated, repeated, repeated, repeated, repeated)));

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(module.isSolved()).isFalse();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
