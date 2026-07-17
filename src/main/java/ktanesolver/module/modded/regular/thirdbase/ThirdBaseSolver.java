package ktanesolver.module.modded.regular.thirdbase;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashSet;
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
import ktanesolver.module.vanilla.regular.whosonfirst.ButtonPosition;

@Service
@ModuleInfo(
	type = ModuleType.THIRD_BASE,
	id = "third_base",
	name = "Third Base",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the correct four-character button across three stages",
	tags = {"6-buttons", "display", "3-stages", "symbols"}
)
public class ThirdBaseSolver extends AbstractModuleSolver<ThirdBaseInput, ThirdBaseOutput> {
	@Override
	protected SolveResult<ThirdBaseOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ThirdBaseInput input) {
		ThirdBaseState state = module.getStateAs(ThirdBaseState.class, () -> new ThirdBaseState(new ArrayList<>(), new ArrayList<>(), new ArrayList<>()));
		if (state.buttonPressHistory().size() >= 3) {
			return failure("Module already completed (maximum 3 stages).");
		}
		if (input == null || input.buttons() == null) {
			return failure("Display and all six button labels are required.");
		}

		String display = normalize(input.displayWord());
		int displayIndex = ThirdBaseRules.LABELS.indexOf(rotateLabel(display));
		if (displayIndex < 0) {
			return failure("Unknown display label: " + display);
		}

		Map<ButtonPosition, String> buttons = new EnumMap<>(ButtonPosition.class);
		input.buttons().forEach((position, label) -> {
			if (position != null) buttons.put(position, normalize(label));
		});
		if (buttons.size() != ButtonPosition.values().length || buttons.values().stream().anyMatch(label -> !ThirdBaseRules.LABELS.contains(label))) {
			return failure("Enter one valid label for each of the six button positions.");
		}
		if (new HashSet<>(buttons.values()).size() != buttons.size()) {
			return failure("Button labels must be unique.");
		}

		Map<ButtonPosition, String> rotatedButtons = new EnumMap<>(ButtonPosition.class);
		buttons.forEach((position, label) -> rotatedButtons.put(rotatePosition(position), rotateLabel(label)));
		String readLabel = rotatedButtons.get(ThirdBaseRules.displayPosition(displayIndex));
		for (int candidateIndex : ThirdBaseRules.priorities(ThirdBaseRules.LABELS.indexOf(readLabel))) {
			String candidate = ThirdBaseRules.LABELS.get(candidateIndex);
			for (Map.Entry<ButtonPosition, String> button : rotatedButtons.entrySet()) {
				if (button.getValue().equals(candidate)) {
					ButtonPosition visiblePosition = rotatePosition(button.getKey());
					String visibleLabel = rotateLabel(button.getValue());
					var displays = new ArrayList<>(state.displayHistory());
					var buttonHistory = new ArrayList<>(state.buttonHistory());
					var presses = new ArrayList<>(state.buttonPressHistory());
					displays.add(display);
					buttonHistory.add(Map.copyOf(buttons));
					presses.add(Map.of(visiblePosition, visibleLabel));
					module.setState(new ThirdBaseState(displays, buttonHistory, presses));
					return success(new ThirdBaseOutput(visiblePosition, visibleLabel), presses.size() == 3);
				}
			}
		}
		return failure("No matching button found.");
	}

	private static String normalize(String value) {
		return value == null ? "" : value.trim().toUpperCase();
	}

	public static String rotateLabel(String label) {
		StringBuilder rotated = new StringBuilder(label.length());
		for (int i = label.length() - 1; i >= 0; i--) {
			rotated.append(switch (label.charAt(i)) {
				case '6' -> '9';
				case '9' -> '6';
				default -> label.charAt(i);
			});
		}
		return rotated.toString();
	}

	private static ButtonPosition rotatePosition(ButtonPosition position) {
		return switch (position) {
			case TOP_LEFT -> ButtonPosition.BOTTOM_RIGHT;
			case TOP_RIGHT -> ButtonPosition.BOTTOM_LEFT;
			case MIDDLE_LEFT -> ButtonPosition.MIDDLE_RIGHT;
			case MIDDLE_RIGHT -> ButtonPosition.MIDDLE_LEFT;
			case BOTTOM_LEFT -> ButtonPosition.TOP_RIGHT;
			case BOTTOM_RIGHT -> ButtonPosition.TOP_LEFT;
		};
	}
}
