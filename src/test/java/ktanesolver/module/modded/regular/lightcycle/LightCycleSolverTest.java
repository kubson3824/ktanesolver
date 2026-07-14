package ktanesolver.module.modded.regular.lightcycle;

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

class LightCycleSolverTest {
	private final LightCycleSolver solver = new LightCycleSolver();

	@Test
	void appliesAllSixSerialPairSwaps() {
		LightCycleOutput output = solve("ABC123", List.of("RED", "YELLOW", "GREEN", "BLUE", "MAGENTA", "WHITE"));

		assertThat(output.sequence()).containsExactly("WHITE", "YELLOW", "RED", "MAGENTA", "GREEN", "BLUE");
	}

	@Test
	void appliesSwapsToTheDisplayedPermutation() {
		LightCycleOutput output = solve("9Z8Y7X", List.of("WHITE", "MAGENTA", "BLUE", "GREEN", "YELLOW", "RED"));

		assertThat(output.sequence()).containsExactly("GREEN", "RED", "BLUE", "WHITE", "YELLOW", "MAGENTA");
	}

	@Test
	void rejectsRepeatedColors() {
		ModuleEntity module = module();
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");

		SolveResult<LightCycleOutput> result = solver.solve(
			new RoundEntity(), bomb, module,
			new LightCycleInput(List.of("RED", "RED", "GREEN", "BLUE", "MAGENTA", "WHITE"))
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(module.isSolved()).isFalse();
	}

	private LightCycleOutput solve(String serial, List<String> colors) {
		ModuleEntity module = module();
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		SolveResult<LightCycleOutput> result = solver.solve(
			new RoundEntity(), bomb, module, new LightCycleInput(colors)
		);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsKey("input");
		return ((SolveSuccess<LightCycleOutput>) result).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.LIGHT_CYCLE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
