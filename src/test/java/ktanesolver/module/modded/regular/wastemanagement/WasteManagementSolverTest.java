package ktanesolver.module.modded.regular.wastemanagement;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.wastemanagement.WasteManagementInput.TimerBand;
import ktanesolver.module.modded.regular.wastemanagement.WasteManagementOutput.Allocation;

class WasteManagementSolverTest {
	private final WasteManagementSolver solver = new WasteManagementSolver();

	@Test
	void appliesEdgeworkTimeStrikeAndRecycleEverythingRules() {
		BombEntity bomb = bomb("BCD123", 2, 1, Map.of(
			"IND", true, "SND", false, "TRN", false, "FRK", false, "FRQ", false,
			"BOB", true, "MSA", false, "CAR", false, "SIG", false
		));
		bomb.replacePortPlates(List.of(
			Set.of(PortType.PARALLEL, PortType.RJ45, PortType.SERIAL),
			Set.of(PortType.PARALLEL, PortType.PS2, PortType.STEREO_RCA),
			Set.of()
		));
		bomb.setModules(List.of(
			module(ModuleType.WASTE_MANAGEMENT), module(ModuleType.MORSE_CODE),
			module(ModuleType.FORGET_ME_NOT), module(ModuleType.WIRES)
		));

		WasteManagementOutput output = solve(bomb, new WasteManagementInput(TimerBand.HALF_OR_LESS, List.of()));

		assertThat(output).extracting(WasteManagementOutput::paperAmount, WasteManagementOutput::plasticAmount,
			WasteManagementOutput::metalAmount).containsExactly(36, 296, 642);
		assertThat(output.allocations()).containsExactly(
			new Allocation("Paper", 36, 36, 0, 0),
			new Allocation("Plastic", 296, 296, 0, 0),
			new Allocation("Metal", 642, 642, 0, 0),
			new Allocation("Leftovers", 0, 0, 0, 0)
		);
	}

	@Test
	void roundsQuarterAndHalfAwayFromZeroForTheMetalBelowPaperBranch() {
		BombEntity bomb = bomb("AEI123", 1, 0, Map.of("BOB", true));
		bomb.setModules(List.of(module(ModuleType.WASTE_MANAGEMENT)));

		WasteManagementOutput output = solve(bomb, new WasteManagementInput(TimerBand.MORE_THAN_HALF, List.of()));

		assertThat(output.allocations()).containsExactly(
			new Allocation("Paper", 200, 200, 0, 0),
			new Allocation("Plastic", 0, 0, 0, 0),
			new Allocation("Metal", 199, 0, 50, 149),
			new Allocation("Leftovers", 149, 75, 0, 74)
		);
	}

	@Test
	void continuesFromLargeMetalThroughPlasticPaperAndLeftoverRules() {
		BombEntity bomb = bomb("BCF123", 1, 0, Map.of("BOB", true, "MSA", false, "TRN", false, "FRK", false));
		bomb.setModules(List.of(module(ModuleType.WASTE_MANAGEMENT)));

		WasteManagementOutput output = solve(bomb, new WasteManagementInput(TimerBand.MORE_THAN_HALF, List.of()));

		assertThat(output.allocations()).containsExactly(
			new Allocation("Paper", 0, 0, 0, 0),
			new Allocation("Plastic", 160, 80, 0, 80),
			new Allocation("Metal", 291, 218, 73, 0),
			new Allocation("Leftovers", 80, 0, 80, 0)
		);
	}

	private WasteManagementOutput solve(BombEntity bomb, WasteManagementInput input) {
		ModuleEntity module = bomb.getModules().getFirst();
		return ((SolveSuccess<WasteManagementOutput>)solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static BombEntity bomb(String serial, int aa, int d, Map<String, Boolean> indicators) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		bomb.setIndicators(new LinkedHashMap<>(indicators));
		return bomb;
	}

	private static ModuleEntity module(ModuleType type) {
		ModuleEntity module = new ModuleEntity();
		module.setType(type);
		return module;
	}
}
