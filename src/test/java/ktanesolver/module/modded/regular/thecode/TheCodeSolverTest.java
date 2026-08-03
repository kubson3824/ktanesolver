package ktanesolver.module.modded.regular.thecode;

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

class TheCodeSolverTest {
	private final TheCodeSolver solver = new TheCodeSolver();

	@Test
	void appliesEveryPriorityRuleTruncatesAndStoresTheDisplayedNumber() {
		BombEntity matchingDigits = bomb("A1BC1D", 0);
		matchingDigits.setIndicators(Map.of("CLR", true));
		assertThat(solve(matchingDigits, 1234).code()).isEqualTo(1234);

		BombEntity clear = bomb("A1BC1D", 1);
		clear.setIndicators(Map.of("CLR", false));
		assertThat(solve(clear, 9999).code()).isEqualTo(1249);

		assertThat(solve(bomb("X1AB2C", 1), 9999).code()).isEqualTo(499);

		BombEntity ports = bomb("A1BC2D", 1);
		ports.replacePortPlates(List.of(Set.of(
			PortType.DVI, PortType.PARALLEL, PortType.PS2, PortType.RJ45, PortType.SERIAL
		)));
		assertThat(solve(ports, 9999).code()).isEqualTo(333);

		assertThat(solve(bomb("A1BC2D", 0), 9999).code()).isEqualTo(238);

		BombEntity indicators = bomb("A1BC2D", 1);
		indicators.setIndicators(Map.of("BOB", true, "CAR", false, "FRK", true));
		assertThat(solve(indicators, 9999).code()).isEqualTo(144);

		BombEntity fallback = bomb("A1BC2D", 1);
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.THE_CODE);
		assertThat(((SolveSuccess<TheCodeOutput>) solver.solve(
			new RoundEntity(), fallback, module, new TheCodeInput(9999)
		)).output().code()).isEqualTo(3333);
		assertThat(module.getState()).containsEntry("displayedNumber", 9999);

		assertThat(solver.solve(new RoundEntity(), fallback, module, new TheCodeInput(998)))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), bomb("ABCDEF", 1), module, new TheCodeInput(999)))
			.isInstanceOf(SolveFailure.class);
	}

	private TheCodeOutput solve(BombEntity bomb, int displayedNumber) {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.THE_CODE);
		return ((SolveSuccess<TheCodeOutput>) solver.solve(
			new RoundEntity(), bomb, module, new TheCodeInput(displayedNumber)
		)).output();
	}

	private static BombEntity bomb(String serial, int batteries) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(batteries);
		return bomb;
	}
}
