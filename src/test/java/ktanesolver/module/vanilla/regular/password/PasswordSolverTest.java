package ktanesolver.module.vanilla.regular.password;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class PasswordSolverTest {
	@Test
	void resolvesGermanPassword() {
		ModuleEntity module = module();
		Map<Integer, Set<String>> letters = Map.of(
			1, Set.of("A"), 2, Set.of("N"), 3, Set.of("G"), 4, Set.of("S"), 5, Set.of("T"));

		SolveSuccess<PasswordOutput> result = (SolveSuccess<PasswordOutput>) new PasswordSolver().solve(
			new RoundEntity(), new BombEntity(), module, new PasswordInput(letters, "DE"));

		assertThat(result.output().possibleWords()).containsExactly("ANGST");
		assertThat(result.output().resolved()).isTrue();
	}

	private ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.PASSWORDS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
