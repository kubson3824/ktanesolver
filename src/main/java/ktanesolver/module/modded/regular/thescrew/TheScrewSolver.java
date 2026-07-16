package ktanesolver.module.modded.regular.thescrew;

import java.util.List;
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
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(type = ModuleType.THE_SCREW, id = "screw", name = "The Screw", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Move the screw to the correct colored hole and press the correct button across three stages.", tags = {"buttons", "colors", "edgework", "multi-stage"})
public class TheScrewSolver extends AbstractModuleSolver<TheScrewInput, TheScrewOutput> {
	private static final Set<String> COLORS = Set.of("RED", "YELLOW", "GREEN", "BLUE", "MAGENTA", "WHITE");
	private static final Set<String> BUTTONS = Set.of("A", "B", "C", "D");
	private static final Set<String> WARM_COLORS = Set.of("RED", "YELLOW", "GREEN");

	@Override
	protected SolveResult<TheScrewOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TheScrewInput input) {
		if (input == null || input.holeColors() == null || input.buttonLabels() == null) return failure("Enter all hole colors and button labels");
		List<String> colors = normalize(input.holeColors());
		List<String> buttons = normalize(input.buttonLabels());
		if (colors.size() != 6 || !Set.copyOf(colors).equals(COLORS)) return failure("Use each hole color exactly once");
		if (buttons.size() != 4 || !Set.copyOf(buttons).equals(BUTTONS)) return failure("Use each button label exactly once");

		Object storedColors = module.getState().get("holeColors");
		if (storedColors instanceof List<?> list && !list.equals(colors)) return failure("The hole color layout cannot change between stages");

		int stage = ((Number) module.getState().getOrDefault("stage", 0)).intValue() + 1;
		if (stage > 3) return failure("All The Screw stages are already complete");
		int currentHole = ((Number) module.getState().getOrDefault("screwPosition", 1)).intValue();
		int rawHole = switch (stage) {
			case 1 -> bomb.getBatteryCount() + (int) BombEdgeworkUtils.getUnlitIndicatorCount(bomb);
			case 2 -> bomb.getLastDigit() + (int) BombEdgeworkUtils.getLitIndicatorCount(bomb);
			default -> BombEdgeworkUtils.getTotalPortCount(bomb) + bomb.getBatteryHolders();
		};
		int hole = normalizeHole(rawHole);
		if (hole == currentHole) hole = hole % 6 + 1;
		int buttonPosition = findButtonPosition(bomb, colors, buttons, hole);
		TheScrewOutput output = new TheScrewOutput(stage, hole, colors.get(hole - 1), buttonPosition, buttons.get(buttonPosition - 1));

		storeState(module, Map.of("stage", stage, "screwPosition", hole, "holeColors", colors, "input", input));
		return success(output, stage == 3);
	}

	private static List<String> normalize(List<String> values) {
		return values.stream().map(value -> value == null ? "" : value.trim().toUpperCase()).toList();
	}

	private static int normalizeHole(int value) {
		return value == 0 ? 1 : (value - 1) % 6 + 1;
	}

	private static int findButtonPosition(BombEntity bomb, List<String> colors, List<String> buttons, int hole) {
		String color = colors.get(hole - 1);
		int rowPosition = (hole - 1) % 3 + 1;
		boolean top = hole <= 3;
		if (WARM_COLORS.contains(color)) {
			if (top) {
				if (rowPosition == bomb.getBatteryHolders()) return 4;
				if (isAt(buttons, "A", 1, 3)) return positionOf(buttons, "C");
				if (hasAnyIndicator(bomb, "CLR", "FRK", "TRN")) return 3;
				if (sameRow(hole, positionOf(colors, "BLUE"))) return 1;
				return positionOf(buttons, "B");
			}
			if (rowPosition == BombEdgeworkUtils.getDistinctPortTypeCount(bomb)) return 2;
			if (rowPosition == bomb.getBatteryCount()) return positionOf(buttons, "D");
			if (!verticallyOpposite(hole, positionOf(colors, "WHITE"))) return positionOf(buttons, "A");
			if (horizontallyAdjacent(hole, positionOf(colors, "MAGENTA"))) return positionOf(buttons, "C");
			return 1;
		}

		if (top) {
			if (rowPosition == BombEdgeworkUtils.getDistinctPortTypeCount(bomb)) return positionOf(buttons, "D");
			if (isAt(buttons, "C", 2, 4)) return positionOf(buttons, "B");
			if (hasAnyIndicator(bomb, "CAR", "FRQ", "SND")) return 4;
			if (sameRow(hole, positionOf(colors, "RED"))) return 2;
			return positionOf(buttons, "A");
		}
		if (rowPosition == bomb.getPortPlates().size()) return 2;
		if (rowPosition == bomb.getIndicators().size()) return positionOf(buttons, "A");
		if (horizontallyAdjacent(hole, positionOf(colors, "YELLOW"))) return positionOf(buttons, "C");
		if (!verticallyOpposite(hole, positionOf(colors, "GREEN"))) return positionOf(buttons, "D");
		return 4;
	}

	private static int positionOf(List<String> values, String value) {
		return values.indexOf(value) + 1;
	}

	private static boolean isAt(List<String> values, String value, int first, int second) {
		int position = positionOf(values, value);
		return position == first || position == second;
	}

	private static boolean hasAnyIndicator(BombEntity bomb, String... labels) {
		for (String label : labels) if (bomb.hasIndicator(label)) return true;
		return false;
	}

	private static boolean sameRow(int first, int second) {
		return (first - 1) / 3 == (second - 1) / 3;
	}

	private static boolean verticallyOpposite(int first, int second) {
		return Math.abs(first - second) == 3;
	}

	private static boolean horizontallyAdjacent(int first, int second) {
		return sameRow(first, second) && Math.abs(first - second) == 1;
	}
}
