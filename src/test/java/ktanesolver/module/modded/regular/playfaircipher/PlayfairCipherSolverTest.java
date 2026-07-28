package ktanesolver.module.modded.regular.playfaircipher;

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
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class PlayfairCipherSolverTest {
	private final PlayfairCipherSolver solver = new PlayfairCipherSolver();

	@Test
	void decryptsManualPromptsAcrossKeyModifiersAndRecordsSouvenirFacts() {
		BombEntity primeBomb = bomb("AB1CD2", 0);
		ModuleEntity primeModule = module();
		assertThat(solve(primeBomb, primeModule, "MRXRDM", "Magenta", "Monday"))
			.isEqualTo(new PlayfairCipherOutput("STRIKE", "ABCD", "EGASSEMYALP", "MRXRDM", "Magenta"));
		assertThat(primeModule.getState()).containsEntry("encryptedMessage", "MRXRDM").containsEntry("screenColor", "Magenta");

		BombEntity modifiedBomb = bomb("BC1DF4", 1);
		modifiedBomb.getIndicators().put("BOB", true);
		PortPlateEntity plate = new PortPlateEntity();
		plate.setBomb(modifiedBomb);
		plate.setPorts(Set.of(PortType.SERIAL, PortType.PARALLEL));
		modifiedBomb.getPortPlates().add(plate);
		assertThat(solve(modifiedBomb, module(), "XPOPMU", "Yellow", "Friday"))
			.isEqualTo(new PlayfairCipherOutput("ZTRYK", "BDAC", "ENODRAHYTRAPEVOORG", "XPOPMU", "Yellow"));
	}

	@Test
	void rejectsInvalidDisplayedMessages() {
		assertThat(solver.solve(new RoundEntity(), bomb("AB1CD2", 0), module(),
			new PlayfairCipherInput("ABC", "Blue", "Monday"))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private PlayfairCipherOutput solve(BombEntity bomb, ModuleEntity module, String message, String color, String day) {
		return ((SolveSuccess<PlayfairCipherOutput>) solver.solve(
			new RoundEntity(), bomb, module, new PlayfairCipherInput(message, color, day))).output();
	}

	private static BombEntity bomb(String serial, int strikes) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setStrikes(strikes);
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.PLAYFAIR_CIPHER);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
