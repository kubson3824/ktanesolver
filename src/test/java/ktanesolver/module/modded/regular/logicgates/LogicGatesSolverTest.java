package ktanesolver.module.modded.regular.logicgates;

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
import ktanesolver.module.modded.regular.logicgates.LogicGatesInput.Gate;

class LogicGatesSolverTest {
	private final LogicGatesSolver solver = new LogicGatesSolver();

	@Test
	void identifiesGatesAcrossObservationsAndFindsTheDisplayedSolution() {
		ModuleEntity module = module();
		assertThat(solve(module, bits(false), List.of(false, false, false, true)).solved()).isFalse();
		assertThat(solve(module, bits(true, false), List.of(false, true, true, true)).solved()).isFalse();

		SolveSuccess<LogicGatesOutput> identified = solve(module, bits(true), List.of(true, true, false, false));
		assertThat(identified.solved()).isFalse();
		assertThat(identified.output().gates()).containsExactly(
			Gate.AND, Gate.OR, Gate.XOR, Gate.NAND, Gate.XOR, Gate.XNOR, Gate.NOR);

		SolveSuccess<LogicGatesOutput> solution = solve(module, bits(false), List.of(false, false, false, true));
		assertThat(solution.solved()).isTrue();
		assertThat(solution.output().readyToCheck()).isTrue();
		assertThat(module.getState()).containsKeys("observations", "gates");

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new LogicGatesInput(List.of(true), List.of(false)))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<LogicGatesOutput> solve(ModuleEntity module, List<Boolean> inputs, List<Boolean> outputs) {
		return (SolveSuccess<LogicGatesOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new LogicGatesInput(inputs, outputs));
	}

	private static List<Boolean> bits(boolean value) {
		return java.util.Collections.nCopies(8, value);
	}

	private static List<Boolean> bits(boolean first, boolean second) {
		return List.of(first, second, first, second, first, second, first, second);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.LOGIC_GATES);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
