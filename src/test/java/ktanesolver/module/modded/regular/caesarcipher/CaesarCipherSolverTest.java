package ktanesolver.module.modded.regular.caesarcipher;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
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

class CaesarCipherSolverTest {

	private final CaesarCipherSolver solver = new CaesarCipherSolver();

	@Test
	void catalogUsesManualCompatibleMetadata() {
		ModuleInfo info = CaesarCipherSolver.class.getAnnotation(ModuleInfo.class);

		assertThat(info).isNotNull();
		assertThat(info.name()).isEqualTo("Caesar Cipher");
		assertThat(info.type()).isEqualTo(ModuleType.CAESAR_CIPHER);
	}

	@Test
	void solveAppliesAllNonOverrideOffsetRules() {
		BombEntity bomb = bomb("AE1B2C", 2, Map.of("CAR", false), false);

		CaesarCipherOutput output = solve("HELLO", bomb);

		assertThat(output.offset()).isEqualTo(3);
		assertThat(output.solution()).isEqualTo("KHOOR");
	}

	@Test
	void solveWrapsAroundAlphabetForNegativeOffsets() {
		BombEntity bomb = bomb("BCDF13", 0, Map.of(), false);

		CaesarCipherOutput output = solve("DOLLY", bomb);

		assertThat(output.offset()).isEqualTo(0);
		assertThat(output.solution()).isEqualTo("DOLLY");
	}

	@Test
	void solveUsesZeroWhenParallelPortAndLitNsaArePresent() {
		BombEntity bomb = bomb("AE1B2C", 3, Map.of("CAR", true, "NSA", true), true);

		CaesarCipherOutput output = solve("ZEBRA", bomb);

		assertThat(output.offset()).isZero();
		assertThat(output.solution()).isEqualTo("ZEBRA");
	}

	@Test
	void solveHandlesNegativeOffsetWrapping() {
		BombEntity bomb = bomb("ABCD13", 0, Map.of(), false);

		CaesarCipherOutput output = solve("DOLLY", bomb);

		assertThat(output.offset()).isEqualTo(-1);
		assertThat(output.solution()).isEqualTo("CNKKX");
	}

	@Test
	void solveRejectsMissingCiphertext() {
		ModuleEntity module = module();
		SolveResult<CaesarCipherOutput> result = solver.solve(
			new RoundEntity(), bomb("ABCD12", 1, Map.of(), false), module,
			new CaesarCipherInput(" ")
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<CaesarCipherOutput>) result).getReason()).isEqualTo("Ciphertext is required");
		assertThat(module.isSolved()).isFalse();
	}

	@Test
	void solveRejectsNonAlphabeticOrWrongLengthCiphertext() {
		ModuleEntity module = module();
		SolveResult<CaesarCipherOutput> result = solver.solve(
			new RoundEntity(), bomb("ABCD12", 1, Map.of(), false), module,
			new CaesarCipherInput("AB12")
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<CaesarCipherOutput>) result).getReason()).isEqualTo("Ciphertext must be exactly 5 letters");
		assertThat(module.isSolved()).isFalse();
	}

	private CaesarCipherOutput solve(String ciphertext, BombEntity bomb) {
		ModuleEntity module = module();
		SolveResult<CaesarCipherOutput> result = solver.solve(
			new RoundEntity(), bomb, module, new CaesarCipherInput(ciphertext)
		);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();

		CaesarCipherOutput output = ((SolveSuccess<CaesarCipherOutput>) result).output();
		assertThat(module.getSolution()).containsEntry("solution", output.solution());
		assertThat(module.getSolution()).containsEntry("offset", output.offset());
		return output;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.CAESAR_CIPHER);
		module.setSolution(new HashMap<>());
		module.setState(new HashMap<>());
		return module;
	}

	private static BombEntity bomb(String serialNumber, int batteryCount, Map<String, Boolean> indicators, boolean withParallelPort) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serialNumber);
		bomb.setAaBatteryCount(batteryCount);
		bomb.setDBatteryCount(0);
		bomb.setIndicators(new HashMap<>(indicators));

		if (withParallelPort) {
			PortPlateEntity plate = new PortPlateEntity();
			plate.setBomb(bomb);
			plate.setPorts(Set.of(PortType.PARALLEL));
			bomb.getPortPlates().add(plate);
		}

		return bomb;
	}
}
