package ktanesolver.module.modded.regular.skewedslots;

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

class SkewedSlotsSolverTest {

	private final SkewedSlotsSolver solver = new SkewedSlotsSolver();

	@Test
	void catalogUsesSkewedSlotsMetadata() {
		ModuleInfo info = SkewedSlotsSolver.class.getAnnotation(ModuleInfo.class);

		assertThat(info).isNotNull();
		assertThat(info.name()).isEqualTo("Skewed Slots");
		assertThat(info.type()).isEqualTo(ModuleType.SKEWED_SLOTS);
		assertThat(info.id()).isEqualTo("skewed-slots");
	}

	@Test
	void solveAppliesPrimeFibonacciAndBinaryBranches() {
		BombEntity bomb = bomb("ABCD16", 1, 0, Map.of(), List.of());

		SkewedSlotsOutput output = solve(bomb, new SkewedSlotsInput(List.of(2, 1, 9)));

		assertThat(output.digits()).containsExactly(9, 5, 2);
		assertThat(output.code()).isEqualTo("952");
	}

	@Test
	void solveUsesPs2ParallelBobAndSerialBranchesWithWraparound() {
		BombEntity bomb = bomb(
			"AB8C15",
			0,
			0,
			Map.of("BOB", false),
			List.of(Set.of(PortType.PS2, PortType.PARALLEL), Set.of(PortType.SERIAL))
		);

		SkewedSlotsOutput output = solve(bomb, new SkewedSlotsInput(List.of(0, 7, 4)));

		assertThat(output.digits()).containsExactly(1, 9, 5);
		assertThat(output.code()).isEqualTo("195");
	}

	@Test
	void solveLeavesFirstSlotWhenRightOriginalDigitIsOddAndPreservesDuplicateThirdOriginalDigit() {
		BombEntity bomb = bomb("QZ1W23", 3, 0, Map.of(), List.of());

		SkewedSlotsOutput output = solve(bomb, new SkewedSlotsInput(List.of(1, 5, 5)));

		assertThat(output.digits()).containsExactly(4, 1, 8);
		assertThat(output.code()).isEqualTo("418");
	}

	@Test
	void solveRejectsMissingSerialDigits() {
		ModuleEntity module = module();
		SolveResult<SkewedSlotsOutput> result = solver.solve(
			new RoundEntity(),
			bomb("ABCDEF", 0, 0, Map.of(), List.of()),
			module,
			new SkewedSlotsInput(List.of(1, 2, 3))
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<SkewedSlotsOutput>) result).getReason()).isEqualTo("Skewed Slots requires a serial number with at least one digit");
		assertThat(module.isSolved()).isFalse();
	}

	@Test
	void solveRejectsDigitsOutsideSingleDigitRange() {
		ModuleEntity module = module();
		SolveResult<SkewedSlotsOutput> result = solver.solve(
			new RoundEntity(),
			bomb("A1BC23", 0, 0, Map.of(), List.of()),
			module,
			new SkewedSlotsInput(List.of(1, 10, 3))
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<SkewedSlotsOutput>) result).getReason()).isEqualTo("Skewed Slots digits must each be between 0 and 9");
		assertThat(module.isSolved()).isFalse();
	}

	private SkewedSlotsOutput solve(BombEntity bomb, SkewedSlotsInput input) {
		ModuleEntity module = module();
		SolveResult<SkewedSlotsOutput> result = solver.solve(new RoundEntity(), bomb, module, input);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();

		SkewedSlotsOutput output = ((SolveSuccess<SkewedSlotsOutput>) result).output();
		assertThat(module.getSolution()).containsEntry("code", output.code());
		return output;
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
		module.setType(ModuleType.SKEWED_SLOTS);
		module.setSolution(new HashMap<>());
		module.setState(new HashMap<>());
		return module;
	}
}
