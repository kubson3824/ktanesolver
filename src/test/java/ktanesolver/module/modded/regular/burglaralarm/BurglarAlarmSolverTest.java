package ktanesolver.module.modded.regular.burglaralarm;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class BurglarAlarmSolverTest {
	private final BurglarAlarmSolver solver = new BurglarAlarmSolver();

	@Test
	void calculatesCodesAcrossOppositeEdgeworkBranches() {
		BombEntity first = bomb("AB1CD2", 2, 2,
			Map.of("BOB", true, "FRQ", true, "CAR", false),
			List.of(Set.of(PortType.PS2, PortType.RJ45), Set.of(PortType.PARALLEL, PortType.SERIAL)), 2);
		ModuleEntity firstModule = module(false);
		first.getModules().add(firstModule);

		BombEntity second = bomb("Z9Y8X7", 6, 0, Map.of(), List.of(Set.of(PortType.RJ45)), 7);
		ModuleEntity secondModule = module(false);
		second.getModules().add(secondModule);

		assertThat(solve(first, firstModule, "12345678").code()).isEqualTo("42762768");
		assertThat(firstModule.getState().get("moduleNumber")).isEqualTo(List.of(1, 2, 3, 4, 5, 6, 7, 8));
		assertThat(solve(second, secondModule, "90817263").code()).isEqualTo("02730681");
	}

	@Test
	void rejectsAnythingOtherThanEightDigits() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new BurglarAlarmInput("1234A678")))
			.isInstanceOf(SolveFailure.class);
	}

	private BurglarAlarmOutput solve(BombEntity bomb, ModuleEntity module, String number) {
		return ((SolveSuccess<BurglarAlarmOutput>) solver.solve(
			new RoundEntity(), bomb, module, new BurglarAlarmInput(number))).output();
	}

	private static BombEntity bomb(
		String serial, int aa, int d, Map<String, Boolean> indicators, List<Set<PortType>> plates, int solved
	) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		bomb.setIndicators(indicators);
		bomb.replacePortPlates(plates);
		for (int i = 0; i < solved; i++) bomb.getModules().add(module(true));
		return bomb;
	}

	private static ModuleEntity module(boolean solved) {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.WIRES);
		module.setSolved(solved);
		return module;
	}
}
