package ktanesolver.module.modded.regular.tapcode;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
	type = ModuleType.TAP_CODE,
	id = "tapCode",
	name = "Tap Code",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Move the received word through the word table and encode the result in tap code.",
	tags = { "word", "tap code", "serial number" }
)
public class TapCodeSolver extends AbstractModuleSolver<TapCodeInput, TapCodeOutput> {

	private static final List<String> WORDS = List.of(
		"child", "style", "shake", "alive", "axion", "wreck", "cause", "pupil", "cheat", "watch",
		"jelly", "clock", "quark", "grass", "laser", "jeans", "yacht", "rumor", "fault", "hover",
		"sheet", "aware", "shell", "jolly", "giant", "vague", "image", "acute", "arena", "visit",
		"table", "force", "chair", "quick", "suite", "large", "chord", "power", "aloof", "attic",
		"cover", "prize", "trail", "cycle", "sight", "zeros", "glare", "angle", "ranch", "upset",
		"mixer", "drive", "xenon", "water", "venom", "right", "sweet", "gloom", "clash", "abbey",
		"level", "quilt", "climb", "tease", "knock", "fairy", "queen", "zebra", "guide", "south",
		"funny", "proud", "young", "jumpy", "staff", "query", "trunk", "zooms", "smart", "ghost",
		"judge", "yield", "brain", "helix", "small", "noise", "seize", "robot", "stain", "where",
		"world", "shark", "beard", "disco", "yummy", "title", "story", "color", "short", "fresh"
	);

	@Override
	protected SolveResult<TapCodeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TapCodeInput input) {
		if (input.receivedWord() == null || input.receivedWord().isBlank()) {
			return failure("Received word is required");
		}

		String receivedWord = input.receivedWord().trim().toLowerCase(Locale.ROOT);
		int wordIndex = WORDS.indexOf(receivedWord);
		if (wordIndex < 0) {
			return failure("Received word is not in the Tap Code word table");
		}

		String serial = bomb.getSerialNumber();
		int movement = serial.indexOf('0') >= 0
			? serial.chars().filter(Character::isDigit).map(character -> character - '0').sum() % 10
			: bomb.getLastDigit();
		int row = wordIndex / 10;
		int column = wordIndex % 10;
		boolean firstDigit = Character.isDigit(serial.charAt(0));
		boolean secondDigit = Character.isDigit(serial.charAt(1));

		if (firstDigit == secondDigit) {
			row = Math.floorMod(row + (firstDigit ? movement : -movement), 10);
		} else {
			column = Math.floorMod(column + (firstDigit ? movement : -movement), 10);
		}

		String solutionWord = WORDS.get(row * 10 + column);
		storeState(module, "receivedWord", receivedWord);
		return success(new TapCodeOutput(solutionWord, encode(solutionWord)));
	}

	private static List<String> encode(String word) {
		List<String> taps = new ArrayList<>(word.length());
		for (char letter : word.toUpperCase(Locale.ROOT).replace('K', 'C').toCharArray()) {
			int index = letter - 'A' - (letter > 'K' ? 1 : 0);
			taps.add("" + (index / 5 + 1) + (index % 5 + 1));
		}
		return taps;
	}
}
