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
		assertThat(solve(center, "d7", "e10", "a1")).isEqualTo(new XRayOutput(2, 1, 1));
		assertThat(center.getState()).containsEntry("scannedSymbols", List.of("a1", "d7", "e10"));

		ModuleEntity diagonal = module();
		assertThat(solve(diagonal, "i9", "a1", "d7")).isEqualTo(new XRayOutput(5, 2, 2));
		assertThat(solve(module(), "a10", "j1", "a1 flipped")).isEqualTo(new XRayOutput(2, 1, 1));
	}

	@Test
	void rejectsIncompleteAndOffTableSelections() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new XRayInput(null)))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new XRayInput(List.of("a1", "a1 flipped", "d7"))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private XRayOutput solve(ModuleEntity module, String... symbols) {
		return ((SolveSuccess<XRayOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new XRayInput(List.of(symbols))
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
