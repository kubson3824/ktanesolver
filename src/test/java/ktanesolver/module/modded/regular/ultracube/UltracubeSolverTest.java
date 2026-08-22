package ktanesolver.module.modded.regular.ultracube;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class UltracubeSolverTest {
	private final UltracubeSolver solver = new UltracubeSolver();

	@Test
	void mapsEveryDimensionAndPersistsRotationsForSouvenir() {
		List<String> rotations = List.of("XY", "XZ", "XW", "XV", "VZ");
		List<String> colors = new ArrayList<>(Collections.nCopies(32, "Green"));
		colors.set(11, "Red");
		ModuleEntity module = new ModuleEntity();

		var first = (SolveSuccess<UltracubeOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new UltracubeInput(rotations, 1, colors));

		assertThat(first.solved()).isFalse();
		assertThat(first.output().face()).isEqualTo("zag-top-right");
		assertThat(first.output().targetColor()).isEqualTo("RED");
		assertThat(first.output().vertex()).isEqualTo("ping-zag-top-front-right");
		assertThat(module.getState().get("ultracubeRotations")).isEqualTo(rotations);

		colors.set(5, "Yellow");
		var last = (SolveSuccess<UltracubeOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new UltracubeInput(rotations, 4, colors));
		assertThat(last.solved()).isTrue();
	}

	@Test
	void rejectsAmbiguousTargetColors() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new UltracubeInput(List.of("XY", "XZ", "XW", "XV", "VZ"), 1, Collections.nCopies(32, "Red"))))
			.isInstanceOf(SolveFailure.class);
	}
}
