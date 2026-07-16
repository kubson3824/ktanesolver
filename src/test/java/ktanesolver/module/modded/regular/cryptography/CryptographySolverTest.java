package ktanesolver.module.modded.regular.cryptography;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class CryptographySolverTest {

	private static final String NON_E_LETTERS = "ABCDFGHIJKLMNOPQRSTUVWXYZ";

	@Test
	void solvesAsSoonAsAUniquePrefixContainsAllKeyLetters() {
		String plaintext = "SCROOGE KNEW HE";
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		var result = new CryptographySolver().solve(
			new RoundEntity(), new BombEntity(), module,
			new CryptographyInput(encrypt(plaintext), List.of("S", "C", "R", "O", "G"))
		);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<CryptographyOutput>)result).output())
			.isEqualTo(new CryptographyOutput(plaintext, List.of("S", "C", "R", "O", "G")));
	}

	private static String encrypt(String plaintext) {
		StringBuilder ciphertext = new StringBuilder();
		for (char plain : plaintext.toCharArray()) {
			if (plain == ' ' || plain == 'E') {
				ciphertext.append(plain);
				continue;
			}
			int index = NON_E_LETTERS.indexOf(plain);
			ciphertext.append(NON_E_LETTERS.charAt((index + NON_E_LETTERS.length() - 1) % NON_E_LETTERS.length()));
		}
		return ciphertext.toString();
	}
}
