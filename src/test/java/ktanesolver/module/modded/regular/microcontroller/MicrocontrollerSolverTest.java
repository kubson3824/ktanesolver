package ktanesolver.module.modded.regular.microcontroller;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class MicrocontrollerSolverTest {

	private final MicrocontrollerSolver solver = new MicrocontrollerSolver();

	@Test
	void catalogUsesMicrocontrollerMetadata() {
		ModuleInfo info = MicrocontrollerSolver.class.getAnnotation(ModuleInfo.class);

		assertThat(info).isNotNull();
		assertThat(info.type()).isEqualTo(ModuleType.MICROCONTROLLER);
		assertThat(info.id()).isEqualTo("microcontroller");
		assertThat(info.name()).isEqualTo("Microcontroller");
	}

	@Test
	void solvesPinsUsingControllerLastDigitRule() {
		MicrocontrollerOutput output = solve(
			bomb("AB2D35", 0, 0, Map.of(), List.of()),
			new MicrocontrollerInput(MicrocontrollerType.STRK, 6, "MC-214")
		);

		assertThat(output.colorRule()).isEqualTo("controller serial last digit is 1 or 4");
		assertThat(output.pins()).containsExactly(
			new MicrocontrollerPinSolution(1, MicrocontrollerComponent.AIN, MicrocontrollerColor.MAGENTA),
			new MicrocontrollerPinSolution(2, MicrocontrollerComponent.VCC, MicrocontrollerColor.YELLOW),
			new MicrocontrollerPinSolution(3, MicrocontrollerComponent.RST, MicrocontrollerColor.RED),
			new MicrocontrollerPinSolution(4, MicrocontrollerComponent.DIN, MicrocontrollerColor.GREEN),
			new MicrocontrollerPinSolution(5, MicrocontrollerComponent.PWM, MicrocontrollerColor.BLUE),
			new MicrocontrollerPinSolution(6, MicrocontrollerComponent.GND, MicrocontrollerColor.WHITE)
		);
	}

	@Test
	void litSigOrRj45RuleHasPriorityOverBombSerialRule() {
		MicrocontrollerOutput output = solve(
			bomb("CRX181", 1, 0, Map.of("sig", true), List.of(Set.of(PortType.RJ45))),
			new MicrocontrollerInput(MicrocontrollerType.LEDS, 8, "MC-230")
		);

		assertThat(output.colorRule()).isEqualTo("lit SIG indicator or RJ-45 port");
		assertThat(output.pins()).containsExactly(
			new MicrocontrollerPinSolution(1, MicrocontrollerComponent.PWM, MicrocontrollerColor.GREEN),
			new MicrocontrollerPinSolution(2, MicrocontrollerComponent.DIN, MicrocontrollerColor.MAGENTA),
			new MicrocontrollerPinSolution(3, MicrocontrollerComponent.VCC, MicrocontrollerColor.YELLOW),
			new MicrocontrollerPinSolution(4, MicrocontrollerComponent.GND, MicrocontrollerColor.WHITE),
			new MicrocontrollerPinSolution(5, MicrocontrollerComponent.AIN, MicrocontrollerColor.RED),
			new MicrocontrollerPinSolution(6, MicrocontrollerComponent.GND, MicrocontrollerColor.WHITE),
			new MicrocontrollerPinSolution(7, MicrocontrollerComponent.RST, MicrocontrollerColor.BLUE),
			new MicrocontrollerPinSolution(8, MicrocontrollerComponent.GND, MicrocontrollerColor.WHITE)
		);
	}

	@Test
	void bombSerialRuleUsesStoredBombSerialNumber() {
		MicrocontrollerOutput output = solve(
			bomb("ABCD25", 0, 0, Map.of(), List.of()),
			new MicrocontrollerInput(MicrocontrollerType.CNTD, 10, "MC-230")
		);

		assertThat(output.colorRule()).isEqualTo("bomb serial contains C, L, R, X, 1, or 8");
		assertThat(colors(output)).containsExactly(
			MicrocontrollerColor.BLUE,
			MicrocontrollerColor.GREEN,
			MicrocontrollerColor.MAGENTA,
			MicrocontrollerColor.WHITE,
			MicrocontrollerColor.WHITE,
			MicrocontrollerColor.RED,
			MicrocontrollerColor.WHITE,
			MicrocontrollerColor.WHITE,
			MicrocontrollerColor.YELLOW,
			MicrocontrollerColor.WHITE
		);
	}

	@Test
	void secondControllerDigitRuleUsesTotalBatteryCount() {
		MicrocontrollerOutput output = solve(
			bomb("AB2D35", 2, 1, Map.of(), List.of()),
			new MicrocontrollerInput(MicrocontrollerType.EXPL, 8, "M23C0")
		);

		assertThat(output.colorRule()).isEqualTo("controller serial second digit matches the battery count");
		assertThat(output.pins()).containsExactly(
			new MicrocontrollerPinSolution(1, MicrocontrollerComponent.AIN, MicrocontrollerColor.BLUE),
			new MicrocontrollerPinSolution(2, MicrocontrollerComponent.GND, MicrocontrollerColor.WHITE),
			new MicrocontrollerPinSolution(3, MicrocontrollerComponent.RST, MicrocontrollerColor.MAGENTA),
			new MicrocontrollerPinSolution(4, MicrocontrollerComponent.GND, MicrocontrollerColor.WHITE),
			new MicrocontrollerPinSolution(5, MicrocontrollerComponent.VCC, MicrocontrollerColor.RED),
			new MicrocontrollerPinSolution(6, MicrocontrollerComponent.GND, MicrocontrollerColor.WHITE),
			new MicrocontrollerPinSolution(7, MicrocontrollerComponent.DIN, MicrocontrollerColor.YELLOW),
			new MicrocontrollerPinSolution(8, MicrocontrollerComponent.PWM, MicrocontrollerColor.GREEN)
		);
	}

	@Test
	void defaultRuleAppliesWhenNoConditionMatches() {
		MicrocontrollerOutput output = solve(
			bomb("AB2D35", 0, 0, Map.of(), List.of()),
			new MicrocontrollerInput(MicrocontrollerType.LEDS, 6, "MC-230")
		);

		assertThat(output.colorRule()).isEqualTo("default color row");
		assertThat(output.pins()).containsExactly(
			new MicrocontrollerPinSolution(1, MicrocontrollerComponent.PWM, MicrocontrollerColor.BLUE),
			new MicrocontrollerPinSolution(2, MicrocontrollerComponent.RST, MicrocontrollerColor.MAGENTA),
			new MicrocontrollerPinSolution(3, MicrocontrollerComponent.VCC, MicrocontrollerColor.GREEN),
			new MicrocontrollerPinSolution(4, MicrocontrollerComponent.DIN, MicrocontrollerColor.YELLOW),
			new MicrocontrollerPinSolution(5, MicrocontrollerComponent.AIN, MicrocontrollerColor.RED),
			new MicrocontrollerPinSolution(6, MicrocontrollerComponent.GND, MicrocontrollerColor.WHITE)
		);
	}

	@Test
	void rejectsUnsupportedPinCount() {
		ModuleEntity module = module();
		SolveResult<MicrocontrollerOutput> result = solver.solve(
			new RoundEntity(),
			bomb("AB2D35", 0, 0, Map.of(), List.of()),
			module,
			new MicrocontrollerInput(MicrocontrollerType.STRK, 7, "MC-230")
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<MicrocontrollerOutput>) result).getReason())
			.isEqualTo("Pin count must be 6, 8, or 10 for the selected controller type");
		assertThat(module.isSolved()).isFalse();
	}

	private MicrocontrollerOutput solve(BombEntity bomb, MicrocontrollerInput input) {
		ModuleEntity module = module();
		SolveResult<MicrocontrollerOutput> result = solver.solve(new RoundEntity(), bomb, module, input);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();

		MicrocontrollerOutput output = ((SolveSuccess<MicrocontrollerOutput>) result).output();
		assertThat(module.getSolution()).containsEntry("colorRule", output.colorRule());
		return output;
	}

	private static List<MicrocontrollerColor> colors(MicrocontrollerOutput output) {
		return output.pins().stream().map(MicrocontrollerPinSolution::color).toList();
	}

	private static BombEntity bomb(
		String serialNumber,
		int aaBatteryCount,
		int dBatteryCount,
		Map<String, Boolean> indicators,
		List<Set<PortType>> portPlates
	) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serialNumber);
		bomb.setAaBatteryCount(aaBatteryCount);
		bomb.setDBatteryCount(dBatteryCount);
		bomb.setIndicators(new HashMap<>(indicators));

		for(Set<PortType> ports : portPlates) {
			PortPlateEntity plate = new PortPlateEntity();
			plate.setBomb(bomb);
			plate.setPorts(ports);
			bomb.getPortPlates().add(plate);
		}

		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MICROCONTROLLER);
		module.setSolution(new HashMap<>());
		module.setState(new HashMap<>());
		return module;
	}
}
