package ktanesolver.module.modded.regular.trianglebutton;

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
	type = ModuleType.THE_TRIANGLE_BUTTON,
	id = "theTriangleButton",
	name = "The Triangle Button",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine how and when to operate the colored triangular button.",
	tags = {"button", "colors", "directions", "timer"}
)
public class TriangleButtonSolver extends AbstractModuleSolver<TriangleButtonInput, TriangleButtonOutput> {
	private static final String[] COLORS = {"RED", "GREEN", "PURPLE", "BROWN", "ORANGE", "BLUE", "GREY", "PINK", "WHITE"};
	private static final String[] DIRECTIONS = {"UP", "UP-RIGHT", "RIGHT", "DOWN-RIGHT", "DOWN", "DOWN-LEFT", "LEFT", "UP-LEFT"};
	private static final int[][] ACTIONS = {{1, 2, 0}, {2, 0, 1}, {0, 1, 2}};
	private static final Map<Character, Integer> LETTER_VALUES = Map.ofEntries(
		Map.entry('A', 1), Map.entry('B', 5), Map.entry('C', 5), Map.entry('D', 5), Map.entry('E', 1), Map.entry('F', 5),
		Map.entry('G', 5), Map.entry('H', 6), Map.entry('I', 1), Map.entry('J', 3), Map.entry('K', 6), Map.entry('L', 4),
		Map.entry('M', 6), Map.entry('N', 4), Map.entry('O', 1), Map.entry('P', 6), Map.entry('Q', 3), Map.entry('R', 4),
		Map.entry('S', 4), Map.entry('T', 4), Map.entry('U', 1), Map.entry('V', 6), Map.entry('W', 2), Map.entry('X', 3),
		Map.entry('Y', 2), Map.entry('Z', 3));
	@Override
	protected SolveResult<TriangleButtonOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TriangleButtonInput input) {
		if (input == null || input.color() == null || input.direction() == null || input.label() == null || input.digit() < 0 || input.digit() > 9) {
			return failure("Enter the button color, direction, digit, and label");
		}
		String color = input.color().trim().toUpperCase(Locale.ROOT);
		String direction = input.direction().trim().toUpperCase(Locale.ROOT).replace('_', '-').replace(' ', '-');
		String label = input.label().trim().toUpperCase(Locale.ROOT);
		int colorIndex = indexOf(COLORS, color);
		int directionIndex = indexOf(DIRECTIONS, direction);
		if (colorIndex < 0 || directionIndex < 0 || label.isEmpty() || !label.chars().allMatch(Character::isLetter)) return failure("The displayed color, direction, or label is invalid");

		int row = colorIndex / 3;
		int column = colorIndex % 3;
		if (directionIndex == 7 || directionIndex <= 1) row = (row + 2) % 3;
		else if (directionIndex >= 3 && directionIndex <= 5) row = (row + 1) % 3;
		if (directionIndex >= 5 && directionIndex <= 7) column = (column + 2) % 3;
		else if (directionIndex >= 1 && directionIndex <= 3) column = (column + 1) % 3;

		int target = (input.digit() + label.chars().map(c -> LETTER_VALUES.get((char) c)).sum()) % 9 + 1;
		return switch (ACTIONS[row][column]) {
			case 0 -> success(new TriangleButtonOutput("TAP", target, target, target));
			case 1 -> success(new TriangleButtonOutput("HOLD", target, target, 0));
			default -> success(new TriangleButtonOutput("RELEASE", target, 0, target));
		};
	}

	private static int indexOf(String[] values, String value) {
		for (int i = 0; i < values.length; i++) if (values[i].equals(value)) return i;
		return -1;
	}
}
