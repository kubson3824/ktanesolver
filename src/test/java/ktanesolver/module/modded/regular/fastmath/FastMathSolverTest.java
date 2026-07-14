package ktanesolver.module.modded.regular.fastmath;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.fastmath.FastMathInput.Action;

class FastMathSolverTest {
	private final FastMathSolver solver = new FastMathSolver();

	@Test
	void appliesTheTableAndAllEdgeworkAdjustmentsAcrossResets() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		BombEntity positive = new BombEntity();
		positive.setSerialNumber("ABC123");
		positive.setIndicators(Map.of("MSA", true));
		positive.setAaBatteryCount(4);
		positive.replacePortPlates(List.of(Set.of(PortType.SERIAL, PortType.RJ45)));
		assertThat(solve(positive, module, new FastMathInput(Action.SOLVE_STAGE, "E", "A")))
			.isEqualTo(new FastMathOutput("40", 1));

		solve(positive, module, new FastMathInput(Action.RESET, null, null));
		BombEntity negative = new BombEntity();
		negative.setSerialNumber("FAS123");
		negative.setAaBatteryCount(4);
		assertThat(solve(negative, module, new FastMathInput(Action.SOLVE_STAGE, "D", "G")))
			.isEqualTo(new FastMathOutput("30", 1));
		assertThat(solve(negative, module, new FastMathInput(Action.COMPLETE, null, null)))
			.isEqualTo(new FastMathOutput("30", 1));
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("lastPair")).isEqualTo("DG");
		assertThat(module.getState().get("pairHistory")).isEqualTo(List.of("EA", "DG"));
	}

	@SuppressWarnings("unchecked")
	private FastMathOutput solve(BombEntity bomb, ModuleEntity module, FastMathInput input) {
		return ((SolveSuccess<FastMathOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}
}
