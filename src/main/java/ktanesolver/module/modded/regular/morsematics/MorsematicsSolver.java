
package ktanesolver.module.modded.regular.morsematics;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.utils.StringUtils;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Service
@ModuleInfo (type = ModuleType.MORSEMATICS, id = "morsematics", name = "Morsematics", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Decode letters shown as sequences of short and long flashes and perform awkward calculations. Respond by transmitting the answer in the same code.", tags = {
	"red-module", "6-blinking-lights", "3-columns", "grey-rectangle", "white-rectangle"})
public class MorsematicsSolver extends AbstractModuleSolver<MorsematicsInput, MorsematicsOutput> {

	private static final Set<Integer> SQUARE_NUMBERS = Set.of(1, 4, 9, 16, 25);
	private static final Set<Integer> PRIME_NUMBERS = Set.of(2, 3, 5, 7, 11, 13, 17, 19, 23);

	@Override
	protected SolveResult<MorsematicsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MorsematicsInput input) {
		String letters = input.letters().toUpperCase();

		if(letters == null || letters.length() != 3) {
			return failure("Input must contain exactly 3 letters");
		}

		// Get the 4th and 5th character of the serial number
		String serial = bomb.getSerialNumber();
		if(serial == null || serial.length() < 5) {
			return failure("Serial number must be at least 5 characters long");
		}

		char firstChar = serial.charAt(3);
		char secondChar = serial.charAt(4);

		// Convert to numeric values (A=1, B=2, ..., Z=26)
		int firstValue = charToValue(firstChar);
		int secondValue = charToValue(secondChar);

		// Step 1: For each indicator that has a matching letter in the received letters
		for(int i = 0; i < letters.length(); i++) {
			char letter = letters.charAt(i);
            for (Map.Entry<String, Boolean> entry : bomb.getIndicators().entrySet()) {
                String indicator = entry.getKey();
                Boolean lit = entry.getValue();
                if (indicator.contains(String.valueOf(letter))) {
                    if (lit) {
                        firstValue = wrapValue(firstValue + 1);
                    } else {
                        secondValue = wrapValue(secondValue + 1);
                    }
                }
            }
        }

		// Step 2: If the sum of your character pair is a square number
		int sum = firstValue + secondValue;
		if(SQUARE_NUMBERS.contains(wrapValue(sum))) {
			firstValue = wrapValue(firstValue + 4);
		}
		else {
			secondValue = wrapValue(secondValue - 4);
		}

		// Step 3: Add the largest received letter to the first character
		int maxReceivedValue = 0;
		for(char letter: letters.toCharArray()) {
			int value = charToValue(letter);
			if(value > maxReceivedValue) {
				maxReceivedValue = value;
			}
		}
		firstValue = wrapValue(firstValue + maxReceivedValue);

		// Step 4: If any received letters are prime, subtract them from the first character
		for(char letter: letters.toCharArray()) {
			int value = charToValue(letter);
			if(PRIME_NUMBERS.contains(value)) {
				firstValue = wrapValue(firstValue - value);
			}
		}

		// Step 5: If any received letters are square, subtract them from the second character
		for(char letter: letters.toCharArray()) {
			int value = charToValue(letter);
			if(SQUARE_NUMBERS.contains(value)) {
				secondValue = wrapValue(secondValue - value);
			}
		}

		// Step 6: If batteries are present and any received letters are divisible by the number of batteries
		int batteryCount = bomb.getBatteryCount();
		if(batteryCount > 0) {
			for(char letter: letters.toCharArray()) {
				int value = charToValue(letter);
				if(value % batteryCount == 0) {
					firstValue = wrapValue(firstValue - value);
					secondValue = wrapValue(secondValue - value);
				}
			}
		}

		// Final step: Determine which character to transmit
		int resultValue;
		if(firstValue == secondValue) {
			// Characters are equal: Transmit the first character
			resultValue = firstValue;
		}
		else if(firstValue > secondValue) {
			// First character larger: Transmit the difference
			resultValue = wrapValue(firstValue - secondValue);
		}
		else {
			// Second character larger: Transmit the sum
			resultValue = wrapValue(firstValue + secondValue);
		}

		char resultChar = valueToChar(resultValue);

		return success(new MorsematicsOutput(String.valueOf(resultChar)));
	}

	/**
	 * Convert a character to its numeric value (A=1, B=2, ..., Z=26)
	 */
	private int charToValue(char c) {
		if(c >= 'A' && c <= 'Z') {
			return StringUtils.upperLetterToNumber1Based(c);
		}
		if(c >= 'a' && c <= 'z') {
			return StringUtils.lowerLetterToNumber1Based(c);
		}
		if(c >= '0' && c <= '9') {
			// For digits, use the digit value directly (0=0, 1=1, ..., 9=9)
			// But since we need 1-26 range, we'll wrap it
			int digitValue = c - '0';
			return digitValue == 0 ? 26 : digitValue; // 0 becomes 26 (Z), others stay as is
		}
		return 1; // Default to A for other characters
	}

	/**
	 * Convert a numeric value to a character (1=A, 2=B, ..., 26=Z)
	 */
	private char valueToChar(int value) {
		int wrappedValue = wrapValue(value);
		return StringUtils.numberToUpperLetter1Based(wrappedValue);
	}

	/**
	 * Wrap values to stay within 1-26 range
	 */
	private int wrapValue(int value) {
		while(value < 1) {
			value += 26;
		}
		while(value > 26) {
			value -= 26;
		}
		return value;
	}
}
