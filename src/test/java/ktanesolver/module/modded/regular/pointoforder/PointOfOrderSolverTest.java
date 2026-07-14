package ktanesolver.module.modded.regular.pointoforder;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class PointOfOrderSolverTest {
	private final PointOfOrderSolver solver = new PointOfOrderSolver();

	@Test
	void findsEveryRulePairIncludingSuitTypesAndRankWraparound() {
		assertThat(solve("ABXDE1", "AS", "4S", "AH", "4H", "AC"))
			.isEqualTo(new PointOfOrderOutput(List.of(1, 2), List.of("4C", "4D", "8C", "8D", "QC", "QD")));
		assertThat(solve("1AXDE1", "AS", "5H", "AC", "5S", "AH"))
			.isEqualTo(new PointOfOrderOutput(List.of(1, 3), List.of("5C", "5D", "6C", "6D", "9C", "9D", "10C", "10D")));
		assertThat(solve("A1XDE1", "3S", "8S", "3H", "8H", "3C"))
			.isEqualTo(new PointOfOrderOutput(List.of(2, 3), List.of("8C", "8D", "QS", "QH", "QC", "QD")));
		assertThat(solve("12XDE1", "AS", "5C", "AH", "5S", "AC").validCards()).contains("10S", "10H");
	}

	@Test
	void rejectsDuplicateCards() {
		SolveResult<PointOfOrderOutput> result = solver.solve(
			new RoundEntity(), bomb("ABXDE1"), module(), new PointOfOrderInput(List.of("AS", "AS", "4H", "AC", "4C"))
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
	}

	private PointOfOrderOutput solve(String serial, String... cards) {
		ModuleEntity module = module();
		SolveResult<PointOfOrderOutput> result = solver.solve(
			new RoundEntity(), bomb(serial), module, new PointOfOrderInput(List.of(cards))
		);
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsKeys("input", "activeRules");
		return ((SolveSuccess<PointOfOrderOutput>) result).output();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.POINT_OF_ORDER);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
