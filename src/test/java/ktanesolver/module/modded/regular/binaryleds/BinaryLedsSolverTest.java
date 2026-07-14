package ktanesolver.module.modded.regular.binaryleds;

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

class BinaryLedsSolverTest {
	private final BinaryLedsSolver solver = new BinaryLedsSolver();

	@Test
	void identifiesForwardReverseAndCycleBoundaryReadings() {
		assertThat(solve(17, 15, 6))
			.isEqualTo(new BinaryLedsOutput(1, 8, 2, 25, "GREEN", 2));
		assertThat(solve(9, 13, 6))
			.isEqualTo(new BinaryLedsOutput(6, 8, 6, 31, "RED", 8));
		assertThat(solve(20, 4, 20))
			.isEqualTo(new BinaryLedsOutput(8, 16, 4, 12, "BLUE", 12));
	}

	@Test
	void rejectsReadingsThatAreNotASequence() {
		ModuleEntity module = module();
		SolveResult<BinaryLedsOutput> result = solver.solve(
			new RoundEntity(), new BombEntity(), module, new BinaryLedsInput(List.of(1, 1, 1))
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(module.isSolved()).isFalse();
	}

	private BinaryLedsOutput solve(Integer... observations) {
		ModuleEntity module = module();
		SolveResult<BinaryLedsOutput> result = solver.solve(
			new RoundEntity(), new BombEntity(), module, new BinaryLedsInput(List.of(observations))
		);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsKey("input");
		return ((SolveSuccess<BinaryLedsOutput>) result).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.BINARY_LEDS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
