package ktanesolver.module.modded.regular.playfaircipher;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Locale;
import java.util.Set;

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
	type = ModuleType.PLAYFAIR_CIPHER,
	id = "Playfair",
	name = "Playfair Cipher",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decrypt the displayed Playfair message and determine the four-button press order.",
	tags = {"cipher", "Playfair", "buttons", "modded"}
)
public class PlayfairCipherSolver extends AbstractModuleSolver<PlayfairCipherInput, PlayfairCipherOutput> {
	private static final String ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
	private static final Set<Integer> PRIMES = Set.of(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47);
	private static final String[] PROMPTS = {"STRIKE", "STRIK", "STRYKE", "STRYK", "ZTRIKE", "ZTRIK", "ZTRYKE", "ZTRYK"};
	private static final String[][] PRESS_SEQUENCES = {
		{"ABCD", "BCDA", "CDAB", "DABC", "ABDC", "BDCA", "CABD", "DCAB"},
		{"CDAB", "DACB", "ACBD", "CBDA", "BDAC", "DBCA", "BCAD", "CADB"},
		{"BADC", "ADCB", "DCBA", "CBAD", "BACD", "ACDB", "CDBA", "DBAC"},
		{"DABC", "ABCD", "BCDA", "CDAB", "DACB", "ACBD", "CBDA", "BDAC"}
	};

	@Override
	protected SolveResult<PlayfairCipherOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PlayfairCipherInput input
	) {
		if (input == null || input.encryptedMessage() == null) return failure("Encrypted message is required");
		String encryptedMessage = input.encryptedMessage().trim().toUpperCase(Locale.ROOT).replaceFirst("\\?$", "");
		if (!encryptedMessage.matches("[A-Z]{6}") || encryptedMessage.indexOf('J') >= 0) {
			return failure("Encrypted message must be six letters (I is used instead of J)");
		}

		int color = colorIndex(input.screenColor());
		if (color < 0) return failure("Screen color must be Magenta, Blue, Orange, or Yellow");

		DayOfWeek day;
		try {
			day = DayOfWeek.valueOf(String.valueOf(input.dayOfWeek()).trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			return failure("Select the day on which the module was generated");
		}

		String first = firstKeyPart(day, bomb.isIndicatorLit("BOB"));
		String second = secondKeyPart(bomb, color);
		if (!bomb.serialHasVowel()) {
			String swap = first;
			first = second;
			second = swap;
		}

		String key = first + second + strikeKeyPart(bomb.getStrikes());
		int serialDigitSum = bomb.getSerialNumber().chars().filter(Character::isDigit).map(character -> character - '0').sum();
		if (PRIMES.contains(serialDigitSum)) key = new StringBuilder(key).reverse().toString();

		String prompt = prompt(decrypt(key, encryptedMessage));
		if (prompt == null) return failure("The message does not decrypt to a valid Playfair Cipher prompt");
		String pressSequence = PRESS_SEQUENCES[color][List.of(PROMPTS).indexOf(prompt)];
		String screenColor = titleCase(input.screenColor());

		storeState(module, "encryptedMessage", encryptedMessage);
		storeState(module, "screenColor", screenColor);
		return success(new PlayfairCipherOutput(prompt, pressSequence, key, encryptedMessage, screenColor));
	}

	private static int colorIndex(String value) {
		if (value == null) return -1;
		return switch (value.trim().toUpperCase(Locale.ROOT)) {
			case "MAGENTA" -> 0;
			case "BLUE" -> 1;
			case "ORANGE" -> 2;
			case "YELLOW" -> 3;
			default -> -1;
		};
	}

	private static String titleCase(String value) {
		String lower = value.trim().toLowerCase(Locale.ROOT);
		return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
	}

	private static String firstKeyPart(DayOfWeek day, boolean litBob) {
		return switch (day) {
			case MONDAY -> litBob ? "HIDDEN" : "PLAY";
			case TUESDAY -> "HIDDEN";
			case WEDNESDAY -> litBob ? "CIPHER" : "SECRET";
			case THURSDAY -> "CIPHER";
			case FRIDAY -> litBob ? "PARTYHARD" : "FAIL";
			case SATURDAY -> "PARTYHARD";
			case SUNDAY -> "BECOZY";
		};
	}

	private static String secondKeyPart(BombEntity bomb, int color) {
		if (bomb.hasPort(PortType.SERIAL) && bomb.hasPort(PortType.PARALLEL)) {
			return new String[]{"SAFE", "EFAS", "MESSAGE", "GROOVE"}[color];
		}
		int serialDigitSum = bomb.getSerialNumber().chars().filter(Character::isDigit).map(character -> character - '0').sum();
		if (serialDigitSum > 10) return new String[]{"CODE", "EDOC", "QUIET", "ETIUQ"}[color];
		if (bomb.getDBatteryCount() > bomb.getAaBatteryCount()) {
			return new String[]{"GROOVE", "EVOORG", "TEIUQ", "QUITE"}[color];
		}
		return new String[]{"MESSAGE", "EGASSEM", "SAFE", "EDOC"}[color];
	}

	private static String strikeKeyPart(int strikes) {
		if (strikes <= 0) return "";
		if (strikes == 1) return "ONE";
		return strikes == 2 ? "TWO" : "MANY";
	}

	private static String decrypt(String key, String encryptedMessage) {
		StringBuilder matrix = new StringBuilder(ALPHABET.length());
		for (char letter : (key.replace('J', 'I') + ALPHABET).toCharArray()) {
			if (matrix.indexOf(String.valueOf(letter)) < 0) matrix.append(letter);
		}

		StringBuilder decrypted = new StringBuilder(encryptedMessage.length());
		for (int index = 0; index < encryptedMessage.length(); index += 2) {
			int first = matrix.indexOf(String.valueOf(encryptedMessage.charAt(index)));
			int second = matrix.indexOf(String.valueOf(encryptedMessage.charAt(index + 1)));
			int firstRow = first / 5;
			int firstColumn = first % 5;
			int secondRow = second / 5;
			int secondColumn = second % 5;
			if (firstRow == secondRow) {
				decrypted.append(matrix.charAt(firstRow * 5 + Math.floorMod(firstColumn - 1, 5)));
				decrypted.append(matrix.charAt(secondRow * 5 + Math.floorMod(secondColumn - 1, 5)));
			} else if (firstColumn == secondColumn) {
				decrypted.append(matrix.charAt(Math.floorMod(firstRow - 1, 5) * 5 + firstColumn));
				decrypted.append(matrix.charAt(Math.floorMod(secondRow - 1, 5) * 5 + secondColumn));
			} else {
				decrypted.append(matrix.charAt(firstRow * 5 + secondColumn));
				decrypted.append(matrix.charAt(secondRow * 5 + firstColumn));
			}
		}
		return decrypted.toString();
	}

	private static String prompt(String decrypted) {
		for (String prompt : PROMPTS) {
			if (decrypted.equals(prompt) || decrypted.equals(prompt + "X")) return prompt;
		}
		return null;
	}
}
