package ktanesolver.module.modded.regular.superlogic;

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
import ktanesolver.module.modded.regular.logic.LogicConnective;
import ktanesolver.module.modded.regular.superlogic.SuperlogicInput.Equation;

class SuperlogicSolverTest {
	private final SuperlogicSolver solver = new SuperlogicSolver();

	@Test
	void solvesTheThreeEquationsAndRejectsInvalidInput() {
		ModuleEntity module = module();
		SuperlogicInput input = new SuperlogicInput(List.of(
			new Equation('B', 'C', LogicConnective.XOR, false, false, false),
			new Equation('A', 'C', LogicConnective.XOR, false, false, false),
			new Equation('A', 'B', LogicConnective.OR, false, true, false)
		));

		@SuppressWarnings("unchecked")
		SolveSuccess<SuperlogicOutput> result = (SolveSuccess<SuperlogicOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, input);

		assertThat(result.output().values()).containsExactly(true, false, true);
		assertThat(result.solved()).isTrue();
		assertThat(module.getState()).containsKey("input");
		assertThat(solver.solve(
			new RoundEntity(),
			new BombEntity(),
			module(),
			new SuperlogicInput(List.of(input.equations().getFirst()))
		)).isInstanceOf(SolveFailure.class);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.SUPERLOGIC);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
