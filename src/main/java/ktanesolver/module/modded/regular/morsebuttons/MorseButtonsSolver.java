package ktanesolver.module.modded.regular.morsebuttons;

import java.util.ArrayList;
import java.util.HashMap;
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
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.MORSE_BUTTONS,
	id = "morseButtons",
	name = "Morse Buttons",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode six flashing Morse characters and evaluate their numbered button rules.",
	tags = {"morse", "colors", "buttons", "souvenir"}
)
public class MorseButtonsSolver extends AbstractModuleSolver<MorseButtonsInput, MorseButtonsOutput> {
	private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	private static final String[] MORSE = {".-","-...","-.-.","-..",".","..-.","--.","....","..",".---","-.-",".-..","--","-.","---",".--.","--.-",".-.","...","-","..-","...-",".--","-..-","-.--","--..","-----",".----","..---","...--","....-",".....","-....","--...","---..","----."};
	private static final List<String> VALID_COLORS = List.of("RED", "BLUE", "GREEN", "YELLOW", "ORANGE", "PURPLE");

	@Override
	protected SolveResult<MorseButtonsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MorseButtonsInput input) {
		if (input == null || input.buttons() == null || input.buttons().size() != 6) return failure("Enter all six buttons in reading order");
		String serial = bomb.getSerialNumber();
		if (serial == null || serial.length() != 6) return failure("A six-character serial number is required");
		List<String> colors = new ArrayList<>(6), characters = new ArrayList<>(6), morse = new ArrayList<>(6);
		for (MorseButtonsInput.Button button : input.buttons()) {
			if (button == null || button.color() == null || button.morse() == null) return failure("Every button needs a color and Morse character");
			String color = button.color().trim().toUpperCase(Locale.ROOT), code = button.morse().replaceAll("\\s", "");
			int index = indexOf(MORSE, code);
			if (!VALID_COLORS.contains(color) || index < 0) return failure("A button has an invalid color or Morse sequence");
			colors.add(color); characters.add(String.valueOf(ALPHABET.charAt(index))); morse.add(code);
		}
		Map<String, Integer> colorCounts = counts(colors), characterCounts = counts(characters);
		List<Integer> rules = new ArrayList<>(6), presses = new ArrayList<>();
		for (int i = 0; i < 6; i++) {
			int rule = Math.floorMod(value(serial.charAt(i)) + value(characters.get(i).charAt(0)) - 1, 30) + 1;
			rules.add(rule);
			if (matches(rule, i, colors, characters, morse, colorCounts, characterCounts, bomb, serial)) presses.add(i + 1);
		}
		if (presses.isEmpty()) {
			char lowest = characters.stream().map(value -> value.charAt(0)).min((a, b) -> Integer.compare(ALPHABET.indexOf(a), ALPHABET.indexOf(b))).orElseThrow();
			for (int i = 0; i < 6; i++) if (characters.get(i).charAt(0) == lowest) presses.add(i + 1);
		}
		storeState(module, "morseButtonsCharacters", List.copyOf(characters));
		storeState(module, "morseButtonsColors", colors.stream().map(value -> value.toLowerCase(Locale.ROOT)).toList());
		return success(new MorseButtonsOutput(List.copyOf(presses), List.copyOf(rules), List.copyOf(characters), List.copyOf(colors)));
	}

	private static boolean matches(int rule, int i, List<String> colors, List<String> chars, List<String> morse,
		Map<String, Integer> colorCounts, Map<String, Integer> charCounts, BombEntity bomb, String serial) {
		char c = chars.get(i).charAt(0); String color = colors.get(i), code = morse.get(i);
		return switch (rule) {
			case 1 -> "MORSE".indexOf(c) >= 0; case 2 -> colorCounts.get(color) > 1; case 3 -> Character.isDigit(c);
			case 4 -> BombEdgeworkUtils.getTotalPortCount(bomb) >= 4; case 5 -> List.of("YELLOW","ORANGE","PURPLE").contains(color);
			case 6 -> BombEdgeworkUtils.hasEmptyPortPlate(bomb); case 7 -> colorCounts.values().stream().anyMatch(count -> count >= 3);
			case 8 -> color.indexOf(c) >= 0; case 9 -> serial.chars().distinct().count() != serial.length(); case 10 -> bomb.hasPort(PortType.SERIAL);
			case 11 -> "FLASH".indexOf(c) >= 0; case 12 -> bomb.hasPort(PortType.PS2); case 13 -> count(code, '-') > count(code, '.');
			case 14 -> i >= 3; case 15 -> BombEdgeworkUtils.getTotalPortCount(bomb) == 0; case 16 -> List.of("RED","GREEN","BLUE").contains(color);
			case 17 -> i % 2 == 0; case 18 -> bomb.hasPort(PortType.DVI); case 19 -> "AEIOU".indexOf(c) >= 0; case 20 -> "BUTON".indexOf(c) >= 0;
			case 21 -> i % 2 == 1; case 22 -> bomb.hasPort(PortType.STEREO_RCA); case 23 -> charCounts.get(chars.get(i)) > 1;
			case 24 -> "PRES".indexOf(c) >= 0; case 25 -> BombEdgeworkUtils.hasDuplicatePorts(bomb); case 26 -> count(code, '.') > count(code, '-');
			case 27 -> i <= 2; case 28 -> serial.indexOf(c) >= 0; case 29 -> bomb.hasPort(PortType.RJ45); case 30 -> colorCounts.get(color) == 1;
			default -> false;
		};
	}

	private static int value(char c) { return Character.isDigit(c) ? c - '0' : Character.toUpperCase(c) - 'A' + 1; }
	private static int count(String value, char c) { return (int) value.chars().filter(x -> x == c).count(); }
	private static int indexOf(String[] values, String value) { for (int i = 0; i < values.length; i++) if (values[i].equals(value)) return i; return -1; }
	private static Map<String, Integer> counts(List<String> values) { Map<String, Integer> counts = new HashMap<>(); values.forEach(value -> counts.merge(value, 1, Integer::sum)); return counts; }
}
