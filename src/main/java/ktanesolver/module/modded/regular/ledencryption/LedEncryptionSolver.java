package ktanesolver.module.modded.regular.ledencryption;

import java.util.ArrayList;
import java.util.HashSet;
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
	type = ModuleType.LED_ENCRYPTION,
	id = "LEDEnc",
	name = "LED Encryption",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find letters whose multiplied value matches the diagonally opposite button.",
	tags = {"letters", "colors", "math", "multi-stage", "souvenir"}
)
public class LedEncryptionSolver extends AbstractModuleSolver<LedEncryptionInput, LedEncryptionOutput> {
	private static final Map<String, Integer> MULTIPLIERS = Map.of(
		"RED", 2, "GREEN", 3, "BLUE", 4, "YELLOW", 5, "PURPLE", 6, "ORANGE", 7
	);
	private static final List<String> BUTTONS = List.of("TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT");

	@Override
	protected SolveResult<LedEncryptionOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LedEncryptionInput input
	) {
		if (input == null) return failure("Enter the LED color, four letters, and total stage count");
		Integer multiplier = input.ledColor() == null ? null
			: MULTIPLIERS.get(input.ledColor().trim().toUpperCase(Locale.ROOT));
		if (multiplier == null) return failure("Select a valid LED color");
		if (input.totalStages() < 2 || input.totalStages() > 5) return failure("LED Encryption has 2 to 5 stages");
		if (input.letters() == null || input.letters().size() != 4
			|| input.letters().stream().anyMatch(letter -> letter == null || !letter.matches("[A-Za-z]"))) {
			return failure("Enter exactly four letters from A to Z");
		}

		List<String> letters = input.letters().stream().map(letter -> letter.toUpperCase(Locale.ROOT)).toList();
		if (new HashSet<>(letters).size() != 4) return failure("The four letters must be different");
		Object savedTotal = module.getState().get("totalStages");
		if (savedTotal instanceof Number number && number.intValue() != input.totalStages()) {
			return failure("The total stage count cannot change after stage 1");
		}

		List<Object> stageLetters = history(module, "stageLetters");
		int stage = stageLetters.size() + 1;
		if (stage > input.totalStages()) return failure("All LED Encryption stages are already complete");

		List<String> correctButtons = new ArrayList<>();
		List<String> correctLetters = new ArrayList<>();
		for (int i = 0; i < 4; i++) {
			int value = letters.get(i).charAt(0) - 'A';
			int opposite = letters.get(3 - i).charAt(0) - 'A';
			if (value * multiplier % 26 == opposite) {
				correctButtons.add(BUTTONS.get(i));
				correctLetters.add(letters.get(i));
			}
		}
		if (correctButtons.isEmpty()) return failure("No button satisfies the rule; check the letters and LED color");

		stageLetters.add(letters);
		List<Object> stageColors = history(module, "stageColors");
		stageColors.add(input.ledColor().trim().toUpperCase(Locale.ROOT));
		storeState(module, "totalStages", input.totalStages());
		storeState(module, "stageLetters", stageLetters);
		storeState(module, "stageColors", stageColors);
		return success(new LedEncryptionOutput(stage, correctButtons, correctLetters), stage == input.totalStages());
	}

	private static List<Object> history(ModuleEntity module, String key) {
		return module.getState().get(key) instanceof List<?> list ? new ArrayList<>(list) : new ArrayList<>();
	}
}
