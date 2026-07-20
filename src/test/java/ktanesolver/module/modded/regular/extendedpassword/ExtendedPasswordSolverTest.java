package ktanesolver.module.modded.regular.extendedpassword;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ExtendedPasswordSolverTest {
	@Test
	void narrowsVisibleColumnsAndValidatesLetters() {
		ExtendedPasswordSolver solver = new ExtendedPasswordSolver();
		SolveSuccess<ExtendedPasswordOutput> result = (SolveSuccess<ExtendedPasswordOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module(), new ExtendedPasswordInput(Map.of(
				1, Set.of("A", "B"), 2, Set.of("N"), 3, Set.of("C"),
				4, Set.of("H"), 5, Set.of("O"), 6, Set.of("R")
			)));

		assertThat(result.output()).isEqualTo(new ExtendedPasswordOutput(java.util.List.of("anchor"), true));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new ExtendedPasswordInput(Map.of(1, Set.of("AA"))))).isInstanceOf(SolveFailure.class);
	}

	private ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.EXTENDED_PASSWORD);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
