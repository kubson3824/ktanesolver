package ktanesolver.module.modded.regular.polyhedralmaze;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class PolyhedralMazeSolverTest {
	private final PolyhedralMazeSolver solver = new PolyhedralMazeSolver();

	@Test
	void preservesTheManualTopologyAndFindsTheDefaultMazeRoute() {
		assertThat(PolyhedralMazeDefinitions.SOLIDS).hasSize(14);
		assertThat(PolyhedralMazeDefinitions.topologyHash())
			.isEqualTo("fbb5a5e1e09b33ceab6990515efd233e854cb861fc1f7e32fc1a3b8645a3e3b1");
		assertThat(PolyhedralMazeDefinitions.SOLIDS.get("Disdyakis Dodecahedron").neighbors()[0])
			.containsExactly(7, 23, 1);

		ModuleEntity module = new ModuleEntity();
		var result = solver.solve(new RoundEntity(), new BombEntity(), module,
			new PolyhedralMazeInput("Disdyakis Dodecahedron", 0, 41));

		assertThat(result).isEqualTo(new SolveSuccess<>(
			new PolyhedralMazeOutput(List.of(0, 7, 6, 5, 42, 41), List.of(2, 2, 1, 1)), true));
		assertThat(module.getState().get("startPosition")).isEqualTo(0);
	}

	@Test
	void rejectsInputsThatCouldNotAppearUnderTheDefaultRules() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new PolyhedralMazeInput("Disdyakis Dodecahedron", 6, 41))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new PolyhedralMazeInput("Disdyakis Dodecahedron", 0, 7))).isInstanceOf(SolveFailure.class);
	}
}
