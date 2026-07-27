package ktanesolver.module.modded.regular.pressx;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class PressXSolverTest {
	private final PressXSolver solver = new PressXSolver();

	@Test
	void followsTheButtonTableAndTimingRulePriority() {
		BombEntity anyTime = bomb("ABC123", 0, Map.of("CAR", true, "BOB", false), 2);
		assertThat(solve(anyTime)).isEqualTo(
			new PressXOutput("ANY", "Any time", java.util.List.of(), true, "Press any button at any time."));

		BombEntity batteries = bomb("AB7C12", 3, Map.of("CAR", false), 0);
		assertThat(solve(batteries).validSeconds()).containsExactly(7, 17, 27, 37, 47, 57);

		BombEntity specialA = bomb("AB2C34", 0, Map.of(), 1);
		assertThat(solve(specialA).validSeconds()).containsExactly(5, 30);

		BombEntity nsa = bomb("ABC123", 0, Map.of("NSA", true), 0);
		assertThat(solve(nsa).validSeconds()).containsExactly(0, 11, 22, 33, 44, 55);

		BombEntity fallback = bomb("ABC123", 0, Map.of(), 0);
		assertThat(solve(fallback)).extracting(PressXOutput::button, PressXOutput::validSeconds)
			.containsExactly("Y", java.util.List.of(9, 18, 27, 36, 45, 54));
	}

	@Test
	void rejectsAFlatSerialWithoutDigits() {
		assertThat(solver.solve(new RoundEntity(), bomb("ABCDEF", 0, Map.of(), 0),
			new ModuleEntity(), new PressXInput())).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private PressXOutput solve(BombEntity bomb) {
		return ((SolveSuccess<PressXOutput>) solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new PressXInput())).output();
	}

	private static BombEntity bomb(String serial, int batteries, Map<String, Boolean> indicators, int solvedModules) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(batteries);
		bomb.setIndicators(new HashMap<>(indicators));
		bomb.setModules(new ArrayList<>());
		for (int i = 0; i < solvedModules; i++) {
			ModuleEntity module = new ModuleEntity();
			module.setSolved(true);
			bomb.getModules().add(module);
		}
		return bomb;
	}
}
