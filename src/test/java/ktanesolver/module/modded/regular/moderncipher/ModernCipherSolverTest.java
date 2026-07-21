package ktanesolver.module.modded.regular.moderncipher;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class ModernCipherSolverTest {
	private final ModernCipherSolver solver = new ModernCipherSolver();

	@Test
	void appliesPriorityRulesAndGenerationTimeCounts() {
		assertThat(solve(module(), bomb("AE1B2C", 4, false), "YYYY", 2, 0).solution()).isEqualTo("QQQQ");
		assertThat(solve(module(), bomb("BCDF12", 4, false), "QQQQ", 1, 0).solution()).isEqualTo("TTTT");

		BombEntity defaultBomb = bomb("BCDF12", 3, false);
		defaultBomb.getModules().add(module(true));
		defaultBomb.getModules().add(module(true));
		assertThat(solve(module(), defaultBomb, "QQQQ", 0, 2).solution()).isEqualTo("YYYY");
	}

	@Test
	void serialPortUsesPreviousWordLengthAndSolvesOnStageThree() {
		BombEntity bomb = bomb("BCDF12", 3, true);
		ModuleEntity module = module();

		ModernCipherOutput first = solve(module, bomb, "RRRR", 0, 0);
		ModernCipherOutput second = solve(module, bomb, "IIII", 0, 0);
		ModernCipherOutput third = solve(module, bomb, "IIII", 0, 0);

		assertThat(first).isEqualTo(new ModernCipherOutput("QQQQ", 1, 3, "backward"));
		assertThat(second).isEqualTo(new ModernCipherOutput("QQQQ", 2, 7, "backward"));
		assertThat(third.stage()).isEqualTo(3);
		assertThat(module.getState()).containsEntry("nextStage", 4).containsEntry("previousWordLength", 4);
		assertThat(module.isSolved()).isTrue();
	}

	@SuppressWarnings("unchecked")
	private ModernCipherOutput solve(ModuleEntity module, BombEntity bomb, String ciphertext, int strikes, int solved) {
		return ((SolveSuccess<ModernCipherOutput>) solver.solve(new RoundEntity(), bomb, module,
			new ModernCipherInput(ciphertext, strikes, solved))).output();
	}

	private static ModuleEntity module() {
		return module(false);
	}

	private static ModuleEntity module(boolean solved) {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MODERN_CIPHER);
		module.setSolved(solved);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}

	private static BombEntity bomb(String serial, int batteries, boolean serialPort) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(batteries);
		if (serialPort) {
			PortPlateEntity plate = new PortPlateEntity();
			plate.setBomb(bomb);
			plate.setPorts(Set.of(PortType.SERIAL));
			bomb.getPortPlates().add(plate);
		}
		return bomb;
	}
}
