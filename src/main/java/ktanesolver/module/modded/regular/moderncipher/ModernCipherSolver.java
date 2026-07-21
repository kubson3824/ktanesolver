package ktanesolver.module.modded.regular.moderncipher;

import java.util.Locale;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.MODERN_CIPHER,
	id = "modern-cipher",
	name = "Modern Cipher",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decrypt three QWERTY-alphabet Caesar-cipher words using their generation-time bomb state.",
	tags = {"cipher", "QWERTY", "stages", "modded"}
)
public class ModernCipherSolver extends AbstractModuleSolver<ModernCipherInput, ModernCipherOutput> {
	private static final String ALPHABET = "QWERTYUIOPASDFGHJKLZXCVBNM";

	@Override
	protected SolveResult<ModernCipherOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ModernCipherInput input
	) {
		if (input == null || input.ciphertext() == null || input.ciphertext().isBlank()) return failure("Ciphertext is required");
		String ciphertext = input.ciphertext().trim().toUpperCase(Locale.ROOT);
		if (!ciphertext.matches("[A-Z]{4,8}")) return failure("Ciphertext must be 4 to 8 letters");
		if (input.strikesAtGeneration() < 0 || input.solvedModulesAtGeneration() < 0
			|| input.solvedModulesAtGeneration() > bomb.getModules().size()) {
			return failure("Generation-time strikes and solved-module count must match the bomb");
		}

		int stage = number(module, "nextStage", 1);
		if (stage < 1 || stage > 3) return failure("All three stages have already been decoded; reset after a strike");
		int key = bomb.getSerialNumber().chars().filter(Character::isDigit).map(character -> character - '0').sum()
			+ input.strikesAtGeneration();
		boolean backward;
		if (bomb.serialHasVowel()) backward = true;
		else if (bomb.getBatteryCount() > 3) backward = false;
		else if (bomb.hasPort(PortType.SERIAL)) {
			backward = true;
			if (stage > 1) key += number(module, "previousWordLength", 0);
		} else {
			backward = false;
			key += input.solvedModulesAtGeneration();
		}

		StringBuilder solution = new StringBuilder(ciphertext.length());
		for (char letter : ciphertext.toCharArray()) {
			int position = ALPHABET.indexOf(letter) + (backward ? -key : key);
			solution.append(ALPHABET.charAt(Math.floorMod(position, ALPHABET.length())));
		}

		storeState(module, "nextStage", stage + 1);
		storeState(module, "previousWordLength", solution.length());
		return success(new ModernCipherOutput(solution.toString(), stage, key, backward ? "backward" : "forward"), stage == 3);
	}

	private static int number(ModuleEntity module, String key, int fallback) {
		Object value = module.getState().get(key);
		return value instanceof Number number ? number.intValue() : fallback;
	}
}
