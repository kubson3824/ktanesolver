package ktanesolver.module.modded.regular.xray;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class XRaySolverTest {
	private final XRaySolver solver = new XRaySolver();

	@Test
	void appliesAllMovementAxesAndRecordsSouvenirSymbols() {
		ModuleEntity center = module();
		assertThat(solve(center, 0, 0, 4)).isEqualTo(new XRayOutput(2, 1, 1));
		assertThat(center.getState()).containsEntry("scannedSymbols", List.of("a1", "d7", "e10"));

		ModuleEntity diagonal = module();
		assertThat(solve(diagonal, 0, 0, 8)).isEqualTo(new XRayOutput(5, 2, 2));
		assertThat(solve(module(), 1, 1, 0)).isEqualTo(new XRayOutput(2, 1, 1));
	}

	@Test
	void rejectsIncompleteAndOffTableSelections() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new XRayInput(null, 0, 4)))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new XRayInput(0, 0, 0)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private XRayOutput solve(ModuleEntity module, int column, int row, int movement) {
		return ((SolveSuccess<XRayOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new XRayInput(column, row, movement)
		)).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.X_RAY);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
