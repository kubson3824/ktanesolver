package ktanesolver.module.modded.regular.radiator;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class RadiatorSolverTest {
	private final RadiatorSolver solver = new RadiatorSolver();

	@Test
	void appliesEveryNormalEdgeworkRule() {
		BombEntity bomb = bomb("R4Z999", 4, 1,
			Map.of("CAR", true, "BOB", false, "NSA", false, "FRQ", false, "MSA", false, "FRK", false));
		bomb.replacePortPlates(List.of(Set.of(PortType.RJ45)));

		assertThat(solve(bomb)).isEqualTo(new RadiatorOutput(25, 34));
	}

	@Test
	void usesTheLitFrkAndBobOverride() {
		assertThat(solve(bomb("ZZ9999", 0, 6, Map.of("FRK", true, "BOB", true))))
			.isEqualTo(new RadiatorOutput(13, 37));
	}

	@Test
	void makesNegativeValuesPositiveAndUsesTheFullTemperatureForWater() {
		assertThat(solve(bomb("ZZ9999", 50, 0, Map.of())))
			.isEqualTo(new RadiatorOutput(25, 41));
		assertThat(solve(bomb("ZZ9999", 0, 0, Map.of("NSA", false))))
			.isEqualTo(new RadiatorOutput(0, 10));
	}

	private RadiatorOutput solve(BombEntity bomb) {
		var result = (SolveSuccess<RadiatorOutput>) solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new RadiatorInput());
		return result.output();
	}

	private static BombEntity bomb(String serial, int aaBatteries, int dBatteries, Map<String, Boolean> indicators) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aaBatteries);
		bomb.setDBatteryCount(dBatteries);
		bomb.setIndicators(indicators);
		return bomb;
	}
}
