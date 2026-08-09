package ktanesolver.module.modded.regular.mazescrambler;

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

class MazeScramblerSolverTest {
	private final MazeScramblerSolver solver = new MazeScramblerSolver();

	@Test
	void identifiesTheMazeAndSolvesAcrossChangingDirectionRows() {
		ModuleEntity module = module();
		SolveSuccess<MazeScramblerOutput> result = solve(module, new MazeScramblerInput(1, 9, List.of(7, 2)));
		assertThat(result.output().maze()).isEqualTo(1);
		assertThat(result.output().presses()).isNotEmpty();
		assertThat(result.output().presses()).hasSameSizeAs(result.output().moves());
		assertThat(module.getState()).containsEntry("startPosition", "top-left")
			.containsEntry("goalPosition", "bottom-right")
			.containsEntry("mazeMarkings", List.of("top-middle", "bottom-left"));
	}

	@Test
	void rejectsUnknownMarkingPairsAndEqualEndpoints() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new MazeScramblerInput(1, 1, List.of(2, 7)))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new MazeScramblerInput(1, 9, List.of(1, 2)))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<MazeScramblerOutput> solve(ModuleEntity module, MazeScramblerInput input) {
		return (SolveSuccess<MazeScramblerOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MAZE_SCRAMBLER);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
