package ktanesolver.module.modded.regular.doublecolor;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class DoubleColorSolverTest {
	private static final List<String> COLORS = List.of("GREEN", "BLUE", "RED", "PINK", "YELLOW");
	private final DoubleColorSolver solver = new DoubleColorSolver();

	@Test
	void matchesEveryManualTableCell() {
		int[][][] expected = {
			{{1,0,9,8,7},{2,7,6,5,6},{3,8,1,4,5},{4,9,2,3,4},{5,0,1,2,3},{6,7,8,9,0}},
			{{0,2,6,8,5},{4,9,9,0,2},{1,7,5,9,6},{4,2,0,8,3},{6,8,4,7,1},{1,3,7,3,5}}
		};
		for (int stage = 1; stage <= 2; stage++)
			for (int batteries = 0; batteries <= 5; batteries++)
				for (int color = 0; color < COLORS.size(); color++)
					assertThat(DoubleColorSolver.correctDigit(stage, batteries, COLORS.get(color)))
						.isEqualTo(expected[stage - 1][batteries][color]);
		assertThat(DoubleColorSolver.correctDigit(1, 12, "YELLOW")).isZero();
	}

	@Test
	void advancesStagesPersistsSuccessfulColorsAndCanOverwriteAfterAStrike() {
		ModuleEntity module = module();
		BombEntity bomb = new BombEntity();
		bomb.setAaBatteryCount(2);
		assertThat(solve(module, bomb, new DoubleColorInput("red", false)).output())
			.isEqualTo(new DoubleColorOutput(1, 1, 2));
		assertThat(solve(module, bomb, new DoubleColorInput("Pink", false)).output())
			.isEqualTo(new DoubleColorOutput(2, 9, 2));
		assertThat(module.getState()).containsEntry("stage1Color", "Red").containsEntry("stage2Color", "Pink");
		assertThat(solve(module, bomb, new DoubleColorInput("Blue", true)).output().stage()).isEqualTo(1);
		assertThat(module.getState()).containsEntry("stage1Color", "Blue");
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<DoubleColorOutput> solve(ModuleEntity module, BombEntity bomb, DoubleColorInput input) {
		return (SolveSuccess<DoubleColorOutput>) solver.solve(new RoundEntity(), bomb, module, input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.DOUBLE_COLOR);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
