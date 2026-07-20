package ktanesolver.module.modded.regular.bigcircle;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class BigCircleSolverTest {
	private final BigCircleSolver solver = new BigCircleSolver();

	@Test
	void appliesAllDefaultEdgeworkRulesAndBouncesAcrossTheSerial() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("BOB", true, "FRK", false, "SIG", true, "NLL", false));
		bomb.setPortPlates(List.of(
			plate(PortType.PARALLEL),
			plate(PortType.PARALLEL, PortType.SERIAL),
			plate(PortType.DVI),
			plate(PortType.DVI, PortType.STEREO_RCA)
		));
		ModuleEntity module = module(ModuleType.BIG_CIRCLE, false);
		bomb.setModules(List.of(module, module(ModuleType.WIRES, true), module(ModuleType.BUTTON, true)));

		BigCircleOutput output = solve(bomb, module, new BigCircleInput("CLOCKWISE", List.of(123456, 900001), 0));

		assertThat(output).isEqualTo(new BigCircleOutput(
			25, 5, "3", List.of("ORANGE", "GREEN", "MAGENTA"), false, "clockwise"
		));
		assertThat(module.getState()).containsEntry("spinDirection", "clockwise");
	}

	@Test
	void bobExceptionAcceptsAReversedSequenceForAnySerialCharacter() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setAaBatteryCount(4);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("BOB", false));
		ModuleEntity module = module(ModuleType.BIG_CIRCLE, false);
		bomb.setModules(List.of(module));

		assertThat(solve(bomb, module, new BigCircleInput("COUNTERCLOCKWISE", List.of(), 0)))
			.isEqualTo(new BigCircleOutput(
				null, null, "A", List.of("ORANGE", "WHITE", "MAGENTA"), true, "counterclockwise"
			));
	}

	@SuppressWarnings("unchecked")
	private BigCircleOutput solve(BombEntity bomb, ModuleEntity module, BigCircleInput input) {
		return ((SolveSuccess<BigCircleOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static ModuleEntity module(ModuleType type, boolean solved) {
		ModuleEntity module = new ModuleEntity();
		module.setType(type);
		module.setSolved(solved);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}

	private static PortPlateEntity plate(PortType... ports) {
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(Set.of(ports));
		return plate;
	}
}
