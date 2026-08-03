package ktanesolver.module.modded.regular.simonsends;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.SIMON_SENDS,
	id = "SimonSendsModule",
	name = "Simon Sends",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode the three received Morse letters and calculate a valid color transmission.",
	tags = {"Simon", "Morse", "colors", "transmission"}
)
public class SimonSendsSolver extends AbstractModuleSolver<SimonSendsInput, SimonSendsOutput> {
	private static final List<List<String>> MANUAL = Arrays.stream((
		"THIS IS THE FIRST WORD FOR PURPOSES OF COUNTING WORDS AND PARAGRAPHS IN THIS TEXT THE FLAVOR TEXT AND APPENDIX ARE EXCLUDED|" +
		"HYPHENATED WORDS EQUATE TO JUST ONE WORD PUNCTUATION MARKS DO NOT COUNT AS LETTERS|" +
		"A SIMON SENDS PUZZLE IS EQUIPPED WITH COLORIZED LIGHTS WHICH FLASH UNIQUE LETTERS IN MORSE CODE SIMULTANEOUSLY AND A DIAL FOR ADJUSTING THE FREQUENCY OF FLASHING|" +
		"OWING TO THEIR PROXIMITY THE LIGHTS RED GREEN AND BLUE MIX BY WAY OF ADDITIVE COLOR MIXING WORK OUT THE INDIVIDUAL COLORS|" +
		"CONVERT EACH RECOGNIZED LETTER INTO A NUMBER USING ITS ALPHABETIC POSITION CALL YOUR THUSLY ACQUIRED NUMBERS R G AND B DERIVE NEW LETTERS AS FOLLOWS|" +
		"COUNT R LETTERS FROM THE START OF THE GTH WORD FROM THE START OF THE BTH PARAGRAPH IN THIS MANUAL AND MAKE IT YOUR NEW RED LETTER|" +
		"COUNT G LETTERS FROM THE START OF THE BTH WORD FROM THE START OF THE RTH PARAGRAPH IN THIS MANUAL AND MAKE IT YOUR NEW GREEN LETTER|" +
		"COUNT B LETTERS FROM THE START OF THE RTH WORD FROM THE START OF THE GTH PARAGRAPH IN THIS MANUAL AND MAKE IT YOUR NEW BLUE LETTER|" +
		"REALIZE A NEW COLOR SEQUENCE BY JUXTAPOSING AGAIN USING KNOWN ADDITIVE COLOR MIXING ONE COPY OF EACH NEW LETTERS MORSE CODE|" +
		"ACKNOWLEDGE A DOT AND A DASH IN MORSE CODE HAVE SIZES OF ONE AND THREE UNITS RESPECTIVELY GAPS BETWEEN THEM ALSO HAVE A SIZE OF JUST ONE UNIT|" +
		"INPUT YOUR ACQUIRED COLOR SEQUENCE USING EACH QUALIFYING COLOR BUTTON|" +
		"A MISTAKE IS REJECTED WITH A STRIKE ON SUCH AN OCCASION ADJUST AND FINISH YOUR ANSWER LOOK AT THE DISPLAY TO JUDGE YOUR INPUT THUS FAR|" +
		"JUMP BACK TO THE FIRST WORD IF WHILE COUNTING YOU ADVANCE BEYOND THE LAST WORD WHICH IS THIS"
	).split("\\|"))
		.map(paragraph -> List.of(paragraph.split(" "))).toList();
	private static final List<String> MORSE = List.of(
		".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---", "-.-", ".-..", "--",
		"-.", "---", ".--.", "--.-", ".-.", "...", "-", "..-", "...-", ".--", "-..-", "-.--", "--.."
	);
	private static final String COLOR_CODES = "KBGCRMYW";

	@Override
	protected SolveResult<SimonSendsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SimonSendsInput input
	) {
		if (input == null) return failure("Enter the red, green, and blue received letters");
		String red = normalize(input.redLetter());
		String green = normalize(input.greenLetter());
		String blue = normalize(input.blueLetter());
		if (!validLetter(red) || !validLetter(green) || !validLetter(blue)) {
			return failure("Each received letter must be A-Z");
		}
		if (List.of(red, green, blue).stream().distinct().count() != 3) {
			return failure("The three received letters must be different");
		}

		char redSolution = letter(blue.charAt(0) - 'A', green.charAt(0) - 'A', red.charAt(0) - 'A');
		char greenSolution = letter(red.charAt(0) - 'A', blue.charAt(0) - 'A', green.charAt(0) - 'A');
		char blueSolution = letter(green.charAt(0) - 'A', red.charAt(0) - 'A', blue.charAt(0) - 'A');
		String transmission = transmission(redSolution, greenSolution, blueSolution);

		storeState(module, "receivedLetters", Map.of("red", red, "green", green, "blue", blue));
		return success(new SimonSendsOutput("" + redSolution + greenSolution + blueSolution, transmission));
	}

	private static String normalize(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}

	private static boolean validLetter(String value) {
		return value.matches("[A-Z]");
	}

	private static char letter(int paragraphCount, int wordCount, int letterCount) {
		int paragraph = paragraphCount % MANUAL.size();
		int word = 0;
		for (int i = 0; i < wordCount; i++) {
			word++;
			if (word == MANUAL.get(paragraph).size()) {
				word = 0;
				paragraph = (paragraph + 1) % MANUAL.size();
			}
		}
		int letter = 0;
		for (int i = 0; i < letterCount; i++) {
			letter++;
			if (letter == MANUAL.get(paragraph).get(word).length()) {
				letter = 0;
				word++;
				if (word == MANUAL.get(paragraph).size()) {
					word = 0;
					paragraph = (paragraph + 1) % MANUAL.size();
				}
			}
		}
		return MANUAL.get(paragraph).get(word).charAt(letter);
	}

	private static String transmission(char red, char green, char blue) {
		String redMorse = units(red);
		String greenMorse = units(green);
		String blueMorse = units(blue);
		int length = Math.max(redMorse.length(), Math.max(greenMorse.length(), blueMorse.length()));
		StringBuilder result = new StringBuilder(length);
		for (int i = 0; i < length; i++) {
			int color = (on(redMorse, i) ? 4 : 0) + (on(greenMorse, i) ? 2 : 0) + (on(blueMorse, i) ? 1 : 0);
			result.append(COLOR_CODES.charAt(color));
		}
		return result.toString();
	}

	private static String units(char letter) {
		return MORSE.get(letter - 'A').chars()
			.mapToObj(symbol -> symbol == '.' ? "#" : "###")
			.reduce((left, right) -> left + "_" + right).orElse("");
	}

	private static boolean on(String morse, int index) {
		return index < morse.length() && morse.charAt(index) == '#';
	}
}
