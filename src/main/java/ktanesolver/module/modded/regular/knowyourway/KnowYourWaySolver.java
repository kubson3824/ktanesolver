package ktanesolver.module.modded.regular.knowyourway;

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
	type = ModuleType.KNOW_YOUR_WAY,
	id = "KnowYourWay",
	name = "Know Your Way",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Combine the green LED, arrow, and button labels to find a four-button sequence.",
	tags = {"directions", "arrow", "led", "buttons"}
)
public class KnowYourWaySolver extends AbstractModuleSolver<KnowYourWayInput, KnowYourWayOutput> {
	private static final String DIRECTIONS = "ULDR";
	private static final List<String> NAMES = List.of("UP", "LEFT", "DOWN", "RIGHT");

	@Override
	protected SolveResult<KnowYourWayOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, KnowYourWayInput input
	) {
		if (input == null) return failure("Enter the green LED, arrow direction, and upper button label");
		int led = direction(input.ledPosition());
		int arrow = direction(input.arrowDirection());
		int upper = label(input.upperButtonLabel());
		if (led < 0 || arrow < 0) return failure("LED position and arrow direction must be up, left, down, or right");
		if (upper < 0) return failure("Upper button label must be U, L, D, or R");
		int uButton = (4 - upper) % 4;

		int ledInd = uButton == 1 ? 2 : arrow == 3 ? 0 : led != arrow ? 1 : 3;
		int arrowInd = arrow == (led + 2) % 4 ? 2 : led == (uButton + 3) % 4 ? 0 : led != 3 ? 1 : 3;
		int upperInd = led == 2 ? 2
			: arrow != (uButton + 1) % 4 && arrow != (uButton + 3) % 4 ? 0 : uButton != 0 ? 1 : 3;
		int uButtonInd = arrow == uButton ? 2
			: led != (uButton + 2) % 4 && led != uButton ? 0 : arrow != 2 ? 1 : 3;

		int ledOri = arrowInd == ledInd ? 0 : upperInd == ledInd ? 3 : uButtonInd == ledInd ? 2 : 1;
		int arrowOri = upperInd == arrowInd ? 3 : uButtonInd == arrowInd ? 2 : ledInd == arrowInd ? 1 : 0;
		int upperOri = uButtonInd == upperInd ? 2 : ledInd == upperInd ? 1 : arrowInd == upperInd ? 0 : 3;
		int uButtonOri = ledInd == uButtonInd ? 1 : arrowInd == uButtonInd ? 0 : upperInd == uButtonInd ? 3 : 2;

		List<String> presses = new ArrayList<>();
		presses.add(answer(led, ledInd, ledOri, uButton));
		presses.add(answer(arrow, arrowInd, arrowOri, uButton));
		presses.add(answer(upper, upperInd, upperOri + 4 - upper, uButton));
		presses.add(answer(uButton, uButtonInd, uButtonOri, uButton));
		storeState(module, "arrowDirection", title(NAMES.get(arrow)));
		storeState(module, "greenLed", List.of("Top", "Left", "Bottom", "Right").get(led));
		return success(new KnowYourWayOutput(presses,
			List.of(NAMES.get(ledInd), NAMES.get(arrowInd), NAMES.get(upperInd), NAMES.get(uButtonInd)),
			List.of(NAMES.get(ledOri), NAMES.get(arrowOri), NAMES.get(upperOri), NAMES.get(uButtonOri))));
	}

	private static int direction(String value) {
		if (value == null) return -1;
		String normalized = value.trim().toUpperCase(Locale.ROOT);
		int named = NAMES.indexOf(normalized);
		return named >= 0 ? named : normalized.length() == 1 ? DIRECTIONS.indexOf(normalized.charAt(0)) : -1;
	}

	private static int label(String value) {
		if (value == null) return -1;
		String normalized = value.trim().toUpperCase(Locale.ROOT);
		return normalized.length() == 1 ? DIRECTIONS.indexOf(normalized.charAt(0)) : NAMES.indexOf(normalized);
	}

	private static String answer(int location, int indication, int orientation, int uButton) {
		return String.valueOf(DIRECTIONS.charAt(Math.floorMod(location - indication + orientation - uButton, 4)));
	}

	private static String title(String value) {
		return value.charAt(0) + value.substring(1).toLowerCase(Locale.ROOT);
	}
}
