package ktanesolver.module.modded.regular.caesarcipher;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.CAESAR_CIPHER,
	id = "caesar_cipher",
	name = "Caesar Cipher",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decipher the five-letter message by applying the offset determined from the bomb edgework.",
	tags = { "cipher", "letters", "edgework" }
)
public class CaesarCipherSolver extends AbstractModuleSolver<CaesarCipherInput, CaesarCipherOutput> {

	@Override
	protected SolveResult<CaesarCipherOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, CaesarCipherInput input) {
		if (input.ciphertext() == null || input.ciphertext().isBlank()) {
			return failure("Ciphertext is required");
		}

		String ciphertext = input.ciphertext().trim().toUpperCase();
		if (!ciphertext.matches("[A-Z]{5}")) {
			return failure("Ciphertext must be exactly 5 letters");
		}

		int offset = calculateOffset(bomb);
		String solution = shift(ciphertext, offset);

		storeState(module, "input", input);
		return success(new CaesarCipherOutput(solution, offset));
	}

	private int calculateOffset(BombEntity bomb) {
		if (bomb.hasPort(PortType.PARALLEL) && bomb.isIndicatorLit("NSA")) {
			return 0;
		}

		int offset = 0;
		if (bomb.serialHasVowel()) {
			offset -= 1;
		}
		offset += bomb.getBatteryCount();
		if (bomb.isLastDigitEven()) {
			offset += 1;
		}
		if (bomb.hasIndicator("CAR")) {
			offset += 1;
		}
		return offset;
	}

	private String shift(String ciphertext, int offset) {
		StringBuilder solution = new StringBuilder(ciphertext.length());
		for (int i = 0; i < ciphertext.length(); i++) {
			char letter = ciphertext.charAt(i);
			int shifted = Math.floorMod(letter - 'A' + offset, 26);
			solution.append((char) ('A' + shifted));
		}
		return solution.toString();
	}
}
