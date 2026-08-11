package ktanesolver.module.modded.regular.synchronization;

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

class SynchronizationSolverTest {
	private final SynchronizationSolver solver = new SynchronizationSolver();

	@Test
	void coversEveryManualChartCellWithoutShifting() {
		int[][][] expected = {
			{{1,1},{0,1},{2,2},{0,2},{2,2},{0,1},{2,1},{2,1},{2,0}},
			{{0,0},{2,2},{1,2},{1,0},{1,2},{1,0},{0,1},{0,0},{0,2}},
			{{1,1},{1,2},{2,1},{2,0},{1,0},{0,2},{0,0},{1,1},{2,0}}
		};
		int[] columnToLight = {0,1,2,5,8,7,6,3,4};
		for (int row = 0; row < 3; row++) for (int column = 0; column < 9; column++)
			assertThat(SynchronizationSolver.method(row * 3 + 1, columnToLight[column], 4, 0)).containsExactly(expected[row][column]);
	}

	@Test
	void shiftsByCenterSpeedAndBuildsAllFourAlternatingPairs() {
		List<Integer> speeds = List.of(1, 0, 3, 0, 2, 0, 4, 0, 5);
		ModuleEntity module = module();
		SolveSuccess<SynchronizationOutput> result = solve(module, new SynchronizationInput(8, speeds));
		assertThat(result.output().method()).isEqualTo("OPP_ALT");
		assertThat(result.output().steps()).hasSize(4);
		assertThat(result.output().steps()).extracting(SynchronizationStep::firstState).containsExactly("ON", "OFF", "ON", "OFF");
		assertThat(result.output().timerDigit()).isEqualTo(8);
		assertThat(module.getState()).containsEntry("fastestLight", "C3").containsEntry("centerSpeed", 2);
	}

	@Test
	void implementsAscendingDescendingAndOppositeGroupSelection() {
		List<Integer> speeds = List.of(1,2,3,4,5,0,0,0,0);
		assertThat(SynchronizationSolver.steps(speeds, new int[]{0,0})).extracting(SynchronizationStep::firstPosition, SynchronizationStep::secondPosition)
			.containsExactly(tuple(1,2), tuple(3,4), tuple(1,3), tuple(1,5));
		assertThat(SynchronizationSolver.steps(speeds, new int[]{1,1})).extracting(SynchronizationStep::firstPosition, SynchronizationStep::secondPosition)
			.containsExactly(tuple(5,4), tuple(3,2), tuple(4,2), tuple(2,1));
		assertThat(SynchronizationSolver.steps(speeds, new int[]{2,0})).extracting(SynchronizationStep::firstPosition, SynchronizationStep::secondPosition)
			.containsExactly(tuple(1,5), tuple(2,4), tuple(3,1), tuple(2,1));
	}

	@Test
	void validatesTheInitialSpeedPermutation() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new SynchronizationInput(5, List.of(0,1,2,3,4,4,0,0,0))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked") private SolveSuccess<SynchronizationOutput> solve(ModuleEntity module, SynchronizationInput input) { return (SolveSuccess<SynchronizationOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input); }
	private static ModuleEntity module() { ModuleEntity module = new ModuleEntity(); module.setType(ModuleType.SYNCHRONIZATION); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module; }
	private static org.assertj.core.groups.Tuple tuple(Object... values) { return org.assertj.core.groups.Tuple.tuple(values); }
}
