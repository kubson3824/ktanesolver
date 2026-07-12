package ktanesolver.module.modded.regular.squarebutton;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class SquareButtonSolverTest {
	private final SquareButtonSolver solver = new SquareButtonSolver();

	@Test
	void followsPriorityRulesAndHeldLedRules() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A9BC12");
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("CAR", true, "FRK", false, "NSA", false));
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		var hold = solve(bomb, module, new SquareButtonInput("BLUE", "DETONATE", null, null));
		assertThat(hold.output().hold()).isTrue();
		assertThat(module.isSolved()).isFalse();

		var release = solve(bomb, module, new SquareButtonInput("BLUE", "DETONATE", "ORANGE", true));
		assertThat(release.output().instruction()).contains("prime or 0");
		assertThat(module.isSolved()).isTrue();

		module.setSolved(false);
		var blank = solve(bomb, module, new SquareButtonInput("DARK_GREY", "", null, null));
		assertThat(blank.output().instruction()).contains("digits match");
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<SquareButtonOutput> solve(BombEntity bomb, ModuleEntity module, SquareButtonInput input) {
		return (SolveSuccess<SquareButtonOutput>) solver.solve(new RoundEntity(), bomb, module, input);
	}
}
