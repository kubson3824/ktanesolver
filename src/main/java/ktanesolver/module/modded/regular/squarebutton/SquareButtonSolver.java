package ktanesolver.module.modded.regular.squarebutton;

import java.util.Map;
import java.util.Set;

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
	type = ModuleType.SQUARE_BUTTON,
	id = "square-button",
	name = "Square Button",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Press or hold the square button using its color, label, LED, and bomb edgework",
	tags = {"button", "timing", "color", "edgework", "modded"}
)
public class SquareButtonSolver extends AbstractModuleSolver<SquareButtonInput, SquareButtonOutput> {
	private static final Set<String> COLORS = Set.of("BLUE", "YELLOW", "DARK_GREY", "WHITE");
	private static final Set<String> LABELS = Set.of("PURPLE", "JADE", "MAROON", "INDIGO", "ELEVATE", "RUN", "DETONATE", "");
	private static final Set<String> LED_COLORS = Set.of("CYAN", "ORANGE", "GREEN");

	@Override
	protected SolveResult<SquareButtonOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SquareButtonInput input) {
		String color = normalize(input.color());
		String label = normalize(input.label());
		if (color == null || label == null || !COLORS.contains(color) || !LABELS.contains(label)) return failure("Invalid button color or label");
		storeState(module, Map.of("color", color, "label", label));

		String immediate = immediateInstruction(bomb, color, label);
		if (immediate != null) return success(new SquareButtonOutput(false, immediate));
		if (input.ledColor() == null || input.flickering() == null)
			return success(new SquareButtonOutput(true, "Hold the button and observe the LED"), false);

		String ledColor = normalize(input.ledColor());
		if (!LED_COLORS.contains(ledColor)) return failure("Invalid LED color");
		storeState(module, Map.of("ledColor", ledColor, "flickering", input.flickering()));
		return success(new SquareButtonOutput(false, releaseInstruction(ledColor, input.flickering())));
	}

	private static String immediateInstruction(BombEntity bomb, String color, String label) {
		if (color.equals("BLUE") && bomb.getAaBatteryCount() > bomb.getDBatteryCount()) return null;
		int highestSerialDigit = bomb.getSerialNumber().chars().filter(Character::isDigit).map(c -> c - '0').max().orElse(0);
		if ((color.equals("YELLOW") || color.equals("BLUE")) && label.length() >= highestSerialDigit)
			return "Press and immediately release";
		if ((color.equals("YELLOW") || color.equals("BLUE")) && Set.of("PURPLE", "JADE", "MAROON", "INDIGO").contains(label)) return null;
		if (label.isEmpty()) return "Press and immediately release when the two seconds digits match";
		long litIndicators = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		if (!color.equals("DARK_GREY") && label.length() > litIndicators) return "Press and immediately release";
		long unlitIndicators = bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
		if (unlitIndicators >= 2 && bomb.serialHasVowel()) return "Press and immediately release";
		return null;
	}

	private static String releaseInstruction(String ledColor, boolean flickering) {
		if (!flickering) return switch (ledColor) {
			case "CYAN" -> "Release when the two seconds digits add up to 7";
			case "ORANGE" -> "Release when the two seconds digits add up to 3 or 13";
			default -> "Release when the two seconds digits add up to 5";
		};
		return switch (ledColor) {
			case "CYAN" -> "Release when the number of seconds remaining is a multiple of 7";
			case "ORANGE" -> "Release when the displayed seconds are prime or 0";
			default -> "Release one second after the two seconds digits add up to a multiple of 4";
		};
	}

	private static String normalize(String value) {
		return value == null ? null : value.trim().toUpperCase();
	}
}
