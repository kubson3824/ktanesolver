package ktanesolver.module.modded.regular.splittingtheloot;

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

class SplittingTheLootSolverTest {
	private final SplittingTheLootSolver solver = new SplittingTheLootSolver();

	@Test
	void containsTheCompleteDiamondLookupTable() {
		int[][] expected = {
			{20, 19, 13, 26, 23, 34, 12, 14, 35, 16}, {10, 21, 13, 25, 24, 11, 11, 30, 19, 39},
			{39, 38, 25, 30, 24, 23, 28, 34, 15, 36}, {14, 18, 33, 22, 31, 32, 22, 37, 36, 31},
			{40, 20, 26, 12, 32, 33, 28, 15, 38, 17}, {19, 29, 18, 16, 17, 21, 35, 27, 27, 37}
		};
		for (int row = 0; row < 6; row++) for (int column = 0; column < 10; column++)
			assertThat(SplittingTheLootSolver.value("ABCDEFGHIJ".charAt(column) + String.valueOf(row + 1)))
				.isEqualTo(expected[row][column]);
	}

	@Test
	void findsAnAcceptedSplitAndRecordsTheLockedBagLabel() {
		ModuleEntity module = module();
		SplittingTheLootOutput output = solve(module,
			new SplittingTheLootInput(List.of("A1", "B1", "C1", "20", "19", "13", "99"), 1, "red")).output();
		assertThat(output.colors().get(0)).isEqualTo("RED");
		assertThat(output.colors().subList(0, 3)).doesNotContain("NORMAL");
		int red = 0, blue = 0;
		for (int i = 0; i < 7; i++) {
			if (output.colors().get(i).equals("RED")) red += output.values().get(i);
			if (output.colors().get(i).equals("BLUE")) blue += output.values().get(i);
		}
		assertThat(red).isEqualTo(blue).isEqualTo(output.totalPerTeam());
		assertThat(module.getState()).containsEntry("initiallyColoredBag", "A1");
	}

	@Test
	void validatesBagCompositionAndLockedColor() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new SplittingTheLootInput(List.of("A1", "B1", "10", "20", "30", "40", "50"), 1, "RED")))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new SplittingTheLootInput(List.of("A1", "A1", "C1", "20", "30", "40", "50"), 1, "RED")))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new SplittingTheLootInput(List.of("A1", "B1", "C1", "20", "30", "40", "50"), 0, "GREEN")))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<SplittingTheLootOutput> solve(ModuleEntity module, SplittingTheLootInput input) {
		return (SolveSuccess<SplittingTheLootOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.SPLITTING_THE_LOOT);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
