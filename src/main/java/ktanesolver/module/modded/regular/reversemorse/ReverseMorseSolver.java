package ktanesolver.module.modded.regular.reversemorse;

import java.util.ArrayList;
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
import ktanesolver.module.modded.regular.reversemorse.ReverseMorseInput.Observation;

@Service
@ModuleInfo(
	type = ModuleType.REVERSE_MORSE,
	id = "reverseMorse",
	name = "Reverse Morse",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode two colored-symbol messages and transmit them as Morse code.",
	tags = {"morse", "symbols", "colors", "messages"}
)
public class ReverseMorseSolver extends AbstractModuleSolver<ReverseMorseInput, ReverseMorseOutput> {
	static final String SYMBOLS = "ALQTXZ";
	static final List<String> COLORS = List.of("RED", "GREEN", "BLUE", "PURPLE", "YELLOW", "ORANGE");
	static final String TABLE = "XKOY9E4P1BWJI8FNVZQUA50G7DHMT3SC62LR";
	private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	private static final List<String> MORSE = List.of(
		".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---", "-.-", ".-..", "--",
		"-.", "---", ".--.", "--.-", ".-.", "...", "-", "..-", "...-", ".--", "-..-", "-.--", "--..",
		"-----", ".----", "..---", "...--", "....-", ".....", "-....", "--...", "---..", "----."
	);

	@Override
	protected SolveResult<ReverseMorseOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ReverseMorseInput input
	) {
		if (input == null || input.currentStage() < 1 || input.currentStage() > 2)
			return failure("Current transmission must be the first or second message");
		String firstError = validate(input.firstMessage(), "first");
		if (firstError != null) return failure(firstError);
		String secondError = validate(input.secondMessage(), "second");
		if (secondError != null) return failure(secondError);

		String first = decode(input.firstMessage());
		String second = decode(input.secondMessage());
		storeState(module, Map.of(
			"message1Observations", facts(input.firstMessage()),
			"message2Observations", facts(input.secondMessage())
		));
		return success(new ReverseMorseOutput(
			first, second, transmission(first), transmission(second), input.currentStage()
		));
	}

	private static String validate(List<Observation> observations, String label) {
		if (observations == null || observations.size() != 6)
			return "Enter exactly six observations for the " + label + " message";
		for (Observation observation : observations) {
			if (observation == null || observation.symbol() == null || observation.color() == null)
				return "Enter a symbol and color for every " + label + " message position";
			String symbol = observation.symbol().trim().toUpperCase(Locale.ROOT);
			String color = observation.color().trim().toUpperCase(Locale.ROOT);
			if (symbol.length() != 1 || SYMBOLS.indexOf(symbol.charAt(0)) < 0)
				return "Unknown Reverse Morse symbol: " + observation.symbol();
			if (!COLORS.contains(color)) return "Unknown Reverse Morse color: " + observation.color();
		}
		return null;
	}

	static String decode(List<Observation> observations) {
		StringBuilder result = new StringBuilder(6);
		for (Observation observation : observations) {
			int row = SYMBOLS.indexOf(Character.toUpperCase(observation.symbol().trim().charAt(0)));
			int column = COLORS.indexOf(observation.color().trim().toUpperCase(Locale.ROOT));
			result.append(TABLE.charAt(row * 6 + column));
		}
		return result.toString();
	}

	private static List<Map<String, String>> facts(List<Observation> observations) {
		return observations.stream().map(observation -> Map.of(
			"symbol", observation.symbol().trim().toUpperCase(Locale.ROOT),
			"color", observation.color().trim().toLowerCase(Locale.ROOT)
		)).toList();
	}

	static List<String> transmission(String message) {
		List<String> tokens = new ArrayList<>(13);
		for (char character : message.toCharArray()) {
			tokens.add(MORSE.get(CHARACTERS.indexOf(character)));
			tokens.add("br");
		}
		tokens.add("tx");
		return List.copyOf(tokens);
	}
}
