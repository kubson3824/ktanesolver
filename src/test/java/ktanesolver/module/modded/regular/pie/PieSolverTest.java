package ktanesolver.module.modded.regular.pie;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import org.junit.jupiter.api.Test;

class PieSolverTest {

	private final PieSolver solver = new PieSolver();

	@Test
	void appliesTheRulesInOrderAndStoresTheDisplayedDigitsForSouvenir() {
		ModuleEntity module = module();
		var result = solver.solve(new RoundEntity(), new BombEntity(), module, new PieInput("31415"));

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<PieOutput>) result).output())
			.isEqualTo(new PieOutput(1, 16, 4, List.of(2, 4, 5, 3, 1)));
		assertThat(module.getState()).containsEntry("displayedDigits", List.of(3, 1, 4, 1, 5));

		var primeResult = solver.solve(new RoundEntity(), new BombEntity(), module(), new PieInput("14159"));
		assertThat(((SolveSuccess<PieOutput>) primeResult).output().pressOrder())
			.containsExactly(1, 5, 4, 3, 2);
	}

	@Test
	void rejectsDigitsOutsideTheManualReference() {
		var result = solver.solve(new RoundEntity(), new BombEntity(), module(), new PieInput("99999"));

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<PieOutput>) result).getReason())
			.isEqualTo("The displayed digits do not occur in the first 500 digits of pi");
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.PIE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
