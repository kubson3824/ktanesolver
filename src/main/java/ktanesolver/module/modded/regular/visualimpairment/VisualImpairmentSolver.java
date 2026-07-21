package ktanesolver.module.modded.regular.visualimpairment;

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
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.VISUAL_IMPAIRMENT,
	id = "visual_impairment",
	name = "Visual Impairment",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the transformed grayscale picture and press the desired color",
	tags = {"grid", "colors", "rotation", "reflection", "stages", "modded"}
)
public class VisualImpairmentSolver extends AbstractModuleSolver<VisualImpairmentInput, VisualImpairmentOutput> {
	private static final Map<String, Character> COLORS = Map.of(
		"BLUE", 'B', "GREEN", 'G', "RED", 'R', "WHITE", 'W'
	);
	private static final List<String> PICTURES = List.of(
		"RGRWGBWBRRGBRBGBWWGBRBWGR",
		"GBRBRGGGRWWWWWWWRGGGRBRBG",
		"BBBRRRBGRRRGGGBRWWWBRBWBB",
		"BRWWBWRBRBWBRWRGWBWGBGGGB",
		"RGRGWWBRRBBBRWWWGGWBBRGRG",
		"WGWBGBGRBWBGRGWRWBGBRWRRB",
		"GRWRWRWRWBBRWBGWGBGBRWGBG",
		"BBRWWBGWGWRRGWRBGGGRRGWGB",
		"WBRWGBGWGWRWBWRGBGGBWRGRB"
	);

	@Override
	protected SolveResult<VisualImpairmentOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, VisualImpairmentInput input
	) {
		if (input == null || input.shades() == null || input.shades().size() != 25) {
			return failure("Enter all 25 grid shades");
		}
		if (input.shades().stream().anyMatch(shade -> shade == null || shade < 1 || shade > 4)) {
			return failure("Each square must use a shade from 1 to 4");
		}
		if (input.desiredColor() == null) return failure("Select the indicator color");
		String desiredColor = input.desiredColor().strip().toUpperCase(Locale.ROOT);
		Character desired = COLORS.get(desiredColor);
		if (desired == null) return failure("Indicator color must be blue, green, red, or white");
		if (input.moduleSolved() && !input.stageComplete()) return failure("Complete the stage before marking the module solved");

		Match match = findMatch(input.shades());
		if (match == null) return failure("The grid does not match any Visual Impairment picture");

		List<String> desiredColors = desiredColors(module);
		if (desiredColors.size() >= 3 && !input.stageComplete()) return failure("Visual Impairment has at most three stages");
		int stage = desiredColors.size() + 1;
		List<String> positions = new ArrayList<>();
		String picture = PICTURES.get(match.picture());
		for (int original = 0; original < 25; original++) {
			if (picture.charAt(original) == desired) positions.add(coordinate(displayedIndex(original, match.orientation())));
		}
		positions.sort((left, right) -> Integer.compare(coordinateIndex(left), coordinateIndex(right)));
		VisualImpairmentOutput output = new VisualImpairmentOutput(List.copyOf(positions), match.picture() + 1, stage);

		if (!input.stageComplete()) return success(output, false);
		if (desiredColors.size() >= 3) return failure("Visual Impairment has at most three stages");
		desiredColors.add(displayColor(desiredColor));
		storeState(module, "desiredColors", List.copyOf(desiredColors));
		if (input.moduleSolved() && desiredColors.size() < 2) return failure("Visual Impairment always has at least two stages");
		return success(output, input.moduleSolved());
	}

	private static Match findMatch(List<Integer> shades) {
		for (int picture = 0; picture < PICTURES.size(); picture++) {
			for (int orientation = 1; orientation <= 8; orientation++) {
				if (matches(PICTURES.get(picture), orientation, shades)) return new Match(picture, orientation);
			}
		}
		return null;
	}

	private static boolean matches(String picture, int orientation, List<Integer> shades) {
		Map<Character, Integer> shadeByColor = new HashMap<>();
		char[] colorByShade = new char[5];
		for (int original = 0; original < 25; original++) {
			char color = picture.charAt(original);
			int shade = shades.get(displayedIndex(original, orientation));
			Integer mappedShade = shadeByColor.putIfAbsent(color, shade);
			if (mappedShade != null && mappedShade != shade) return false;
			if (colorByShade[shade] != 0 && colorByShade[shade] != color) return false;
			colorByShade[shade] = color;
		}
		return shadeByColor.size() == 4;
	}

	private static int displayedIndex(int original, int orientation) {
		int x = original % 5;
		int y = original / 5;
		return switch (orientation) {
			case 1 -> original;
			case 2 -> 5 * x + 4 - y;
			case 3 -> 5 * (4 - y) + 4 - x;
			case 4 -> 5 * (4 - x) + y;
			case 5 -> 5 * y + 4 - x;
			case 6 -> 5 * (4 - x) + 4 - y;
			case 7 -> 5 * (4 - y) + x;
			default -> 5 * x + y;
		};
	}

	private static String coordinate(int index) {
		return Character.toString((char)('A' + index % 5)) + (index / 5 + 1);
	}

	private static int coordinateIndex(String coordinate) {
		return (coordinate.charAt(1) - '1') * 5 + coordinate.charAt(0) - 'A';
	}

	private static String displayColor(String color) {
		return color.substring(0, 1) + color.substring(1).toLowerCase(Locale.ROOT);
	}

	private static List<String> desiredColors(ModuleEntity module) {
		Object stored = module.getState().get("desiredColors");
		if (!(stored instanceof List<?> values)) return new ArrayList<>();
		return new ArrayList<>(values.stream().map(String::valueOf).toList());
	}

	private record Match(int picture, int orientation) {}
}
