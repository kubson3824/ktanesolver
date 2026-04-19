package ktanesolver.module.modded.regular.resistors;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class ResistorsSolverTest {

	private final ResistorsSolver solver = new ResistorsSolver();

	@Test
	void catalogUsesResistorsMetadata() {
		ModuleInfo info = ResistorsSolver.class.getAnnotation(ModuleInfo.class);

		assertThat(info).isNotNull();
		assertThat(info.name()).isEqualTo("Resistors");
		assertThat(info.type()).isEqualTo(ModuleType.RESISTORS);
	}

	@Test
	void solveChoosesSeriesPathWithinToleranceAndUsesFrkBranch() {
		BombEntity bomb = bomb("2E7X19", 1, 0, Map.of("FRK", true));
		ResistorsOutput output = solve(
			bomb,
			new ResistorsInput(
				bands(ResistorsColor.RED, ResistorsColor.RED, ResistorsColor.BROWN),
				bands(ResistorsColor.YELLOW, ResistorsColor.VIOLET, ResistorsColor.BLACK)
			)
		);

		assertThat(output.primaryInput()).isEqualTo(ResistorsPin.A);
		assertThat(output.primaryOutput()).isEqualTo(ResistorsPin.D);
		assertThat(output.secondaryInput()).isNull();
		assertThat(output.secondaryOutput()).isEqualTo(ResistorsPin.C);
		assertThat(output.targetResistanceOhms()).isEqualTo(270);
		assertThat(output.topResistanceOhms()).isEqualTo(220.0);
		assertThat(output.bottomResistanceOhms()).isEqualTo(47.0);
		assertThat(output.requiredConnections()).containsExactly(
			new ResistorsConnection(ResistorsPin.A, ResistorsPin.D, ResistorsPath.SERIES, 267.0),
			new ResistorsConnection(ResistorsPin.A, ResistorsPin.C, ResistorsPath.SERIES, 267.0)
		);
		assertThat(output.instruction()).contains("Target 270");
		assertThat(output.instruction()).contains("A to D");
		assertThat(output.instruction()).contains("A to C");
	}

	@Test
	void solveAddsSecondaryDirectConnectionWhenFrkIsAbsentAndDBatteryIsPresent() {
		BombEntity bomb = bomb("ABCDEF", 0, 1, Map.of());
		ResistorsOutput output = solve(
			bomb,
			new ResistorsInput(
				bands(ResistorsColor.BROWN, ResistorsColor.BLACK, ResistorsColor.BLACK),
				bands(ResistorsColor.RED, ResistorsColor.RED, ResistorsColor.BLACK)
			)
		);

		assertThat(output.primaryInput()).isEqualTo(ResistorsPin.A);
		assertThat(output.primaryOutput()).isEqualTo(ResistorsPin.C);
		assertThat(output.secondaryInput()).isEqualTo(ResistorsPin.B);
		assertThat(output.secondaryOutput()).isEqualTo(ResistorsPin.D);
		assertThat(output.targetResistanceOhms()).isZero();
		assertThat(output.requiredConnections()).containsExactly(
			new ResistorsConnection(ResistorsPin.A, ResistorsPin.C, ResistorsPath.DIRECT, 0.0),
			new ResistorsConnection(ResistorsPin.B, ResistorsPin.D, ResistorsPath.DIRECT, 0.0)
		);
	}

	@Test
	void solveRejectsInvalidBandRoles() {
		ModuleEntity module = module();
		SolveResult<ResistorsOutput> result = solver.solve(
			new RoundEntity(),
			bomb("ABC123", 0, 0, Map.of()),
			module,
			new ResistorsInput(
				bands(ResistorsColor.GOLD, ResistorsColor.RED, ResistorsColor.BROWN),
				bands(ResistorsColor.BROWN, ResistorsColor.BLACK, ResistorsColor.BLACK)
			)
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<ResistorsOutput>)result).getReason()).isEqualTo("GOLD cannot be used as the first band");
		assertThat(module.isSolved()).isFalse();
	}

	@Test
	void solveRejectsTargetsThatCannotBeMatchedWithinTolerance() {
		ModuleEntity module = module();
		SolveResult<ResistorsOutput> result = solver.solve(
			new RoundEntity(),
			bomb("1A0BCD", 1, 0, Map.of()),
			module,
			new ResistorsInput(
				bands(ResistorsColor.BROWN, ResistorsColor.BLACK, ResistorsColor.BLACK),
				bands(ResistorsColor.RED, ResistorsColor.BLACK, ResistorsColor.BLACK)
			)
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<ResistorsOutput>)result).getReason()).startsWith("No path produces 100Ω within 5% tolerance.");
		assertThat(module.isSolved()).isFalse();
	}

	private ResistorsOutput solve(BombEntity bomb, ResistorsInput input) {
		ModuleEntity module = module();
		SolveResult<ResistorsOutput> result = solver.solve(new RoundEntity(), bomb, module, input);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();

		ResistorsOutput output = ((SolveSuccess<ResistorsOutput>)result).output();
		assertThat(module.getSolution()).containsEntry("targetResistanceOhms", output.targetResistanceOhms());
		return output;
	}

	private static ResistorsBands bands(ResistorsColor firstBand, ResistorsColor secondBand, ResistorsColor multiplierBand) {
		return new ResistorsBands(firstBand, secondBand, multiplierBand);
	}

	private static BombEntity bomb(String serialNumber, int aaBatteryCount, int dBatteryCount, Map<String, Boolean> indicators) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serialNumber);
		bomb.setAaBatteryCount(aaBatteryCount);
		bomb.setDBatteryCount(dBatteryCount);
		bomb.setIndicators(new HashMap<>(indicators));
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.RESISTORS);
		module.setSolution(new HashMap<>());
		module.setState(new HashMap<>());
		return module;
	}
}
