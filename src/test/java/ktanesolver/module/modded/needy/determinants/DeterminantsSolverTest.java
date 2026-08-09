package ktanesolver.module.modded.needy.determinants;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class DeterminantsSolverTest {
	private final DeterminantsSolver solver = new DeterminantsSolver();

	@Test
	void calculatesSignedDeterminantsAndKeepsTheNeedyRepeatable() {
		assertThat(solve(new DeterminantsInput(3, -2, 5, 4)).output().determinant()).isEqualTo(22);
		assertThat(solve(new DeterminantsInput(-9, 9, 9, 9)).output().determinant()).isEqualTo(-162);
		assertThat(solve(new DeterminantsInput(0, 0, 0, 0)).solved()).isFalse();
	}

	@Test
	void rejectsMissingAndOutOfRangeMatrixValues() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new DeterminantsInput(10, 0, 0, 0)))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new DeterminantsInput(null, 0, 0, 0)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<DeterminantsOutput> solve(DeterminantsInput input) {
		return (SolveSuccess<DeterminantsOutput>) solver.solve(new RoundEntity(), new BombEntity(), module(), input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.DETERMINANTS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
