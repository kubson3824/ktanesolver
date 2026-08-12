package ktanesolver.module.modded.regular.labyrinth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class LabyrinthSolverTest {
	private final LabyrinthSolver solver = new LabyrinthSolver();

	@Test
	void routesAllFiveAscentsThenTheRememberedDescent() {
		ModuleEntity module = new ModuleEntity();
		assertThat(solve(module, 1, "A1", "C1", "F7").output().steps().getFirst().directions()).containsExactly("RIGHT", "RIGHT");
		assertThat(solve(module, 2, "C1", "D1", "F7").output().steps().getFirst().directions()).containsExactly("RIGHT");
		assertThat(solve(module, 3, "D1", "C1", "F7").output().steps().getFirst().directions()).containsExactly("LEFT");
		assertThat(solve(module, 4, "C1", "D1", "F7").output().steps().getFirst().directions()).containsExactly("RIGHT");
		SolveSuccess<LabyrinthOutput> result = solve(module, 5, "D1", "E1", "F7");

		assertThat(result.solved()).isTrue();
		assertThat(result.output().steps()).extracting(LabyrinthOutput.Step::phase)
			.containsExactly("ASCENT", "DESCENT", "DESCENT", "DESCENT", "DESCENT");
		assertThat(result.output().steps().getFirst().directions()).containsExactly("RIGHT");
		assertThat(module.getState().get("labyrinthPortals")).isEqualTo(List.of(
			List.of("C1", "F7"), List.of("D1", "F7"), List.of("C1", "F7"), List.of("D1", "F7"), List.of("E1", "F7")
		));
	}

	@Test
	void everyPublishedLayerContainsItsExpectedConnectedRegions() {
		for (int layer = 1; layer <= 5; layer++) {
			int currentLayer = layer;
			Set<String> remaining = new HashSet<>(LabyrinthSolver.positions());
			int regions = 0;
			while (!remaining.isEmpty()) {
				String start = remaining.iterator().next();
				remaining.removeIf(target -> LabyrinthSolver.route(currentLayer, start, Set.of(target)) != null);
				regions++;
			}
			assertThat(regions).as("layer %s", currentLayer).isEqualTo(currentLayer == 5 ? 1 : 2);
		}
	}

	@Test
	void rejectsMissingCoordinatesAndOutOfOrderLayers() {
		ModuleEntity module = new ModuleEntity();
		assertThat(result(module, 1, "F1", "A2", "F2")).isInstanceOf(SolveFailure.class);
		assertThat(result(module, 1, "A1", "A2", "A2")).isInstanceOf(SolveFailure.class);
		assertThat(result(module, 2, "A1", "A2", "F2")).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<LabyrinthOutput> solve(ModuleEntity module, int layer, String current, String portal1, String portal2) {
		return (SolveSuccess<LabyrinthOutput>) result(module, layer, current, portal1, portal2);
	}

	private Object result(ModuleEntity module, int layer, String current, String portal1, String portal2) {
		return solver.solve(new RoundEntity(), new BombEntity(), module, new LabyrinthInput(layer, current, portal1, portal2));
	}
}
