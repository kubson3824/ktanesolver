package ktanesolver.module.modded.regular.colormath;

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
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.COLOR_MATH,
	id = "colormath",
	name = "Color Math",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode the LED numbers, perform the displayed operation, and convert the answer back to colors.",
	tags = {"colors", "math", "LEDs", "edgework"}
)
public class ColorMathSolver extends AbstractModuleSolver<ColorMathInput, ColorMathOutput> {
	private static final List<String> COLORS = List.of(
		"BLUE", "GREEN", "PURPLE", "YELLOW", "WHITE", "MAGENTA", "RED", "ORANGE", "GRAY", "BLACK"
	);
	private static final int[][] LEFT_DIGITS = {
		{6, 1, 2, 4, 9, 0, 8, 5, 3, 7},
		{8, 1, 9, 4, 3, 6, 0, 5, 7, 2},
		{4, 1, 9, 7, 0, 2, 5, 3, 8, 6},
		{6, 8, 7, 5, 4, 9, 1, 3, 0, 2}
	};
	private static final int[][] RIGHT_DIGITS = {
		{0, 6, 5, 4, 3, 7, 9, 8, 1, 2},
		{2, 9, 8, 0, 5, 3, 4, 7, 1, 6},
		{5, 0, 6, 4, 2, 7, 9, 3, 8, 1},
		{5, 4, 2, 9, 8, 6, 7, 1, 3, 0}
	};
	private static final String[][] ANSWER_COLORS = {
		{"GRAY", "GREEN", "ORANGE", "WHITE", "PURPLE", "BLUE", "MAGENTA", "BLACK", "YELLOW", "RED"},
		{"BLUE", "GREEN", "BLACK", "PURPLE", "MAGENTA", "RED", "GRAY", "YELLOW", "ORANGE", "WHITE"},
		{"MAGENTA", "YELLOW", "BLUE", "GRAY", "RED", "BLACK", "GREEN", "PURPLE", "ORANGE", "WHITE"},
		{"GRAY", "BLUE", "PURPLE", "RED", "YELLOW", "MAGENTA", "BLACK", "ORANGE", "GREEN", "WHITE"}
	};

	@Override
	protected SolveResult<ColorMathOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ColorMathInput input
	) {
		if (input == null) return failure("Enter the Color Math display and LED colors");

		List<String> left = normalizeColors(input.leftColors());
		if (left == null) return failure("Select all four left LED colors");

		String displayColor = normalize(input.displayColor());
		if (!displayColor.equals("GREEN") && !displayColor.equals("RED")) {
			return failure("Display color must be green or red");
		}
		String operation = normalize(input.operation());
		if (!List.of("A", "S", "M", "D").contains(operation)) {
			return failure("Operation must be A, S, M, or D");
		}

		List<String> right = normalizeColors(input.rightColors());
		if (displayColor.equals("GREEN") && right == null) return failure("Select all four right LED colors");

		int baseNumber = decode(left, LEFT_DIGITS);
		int operand = displayColor.equals("GREEN") ? decode(right, RIGHT_DIGITS) : redOperand(bomb);
		if (operation.equals("D") && operand == 0) return failure("Cannot divide by zero");

		int answer = switch (operation) {
			case "A" -> baseNumber + operand;
			case "S" -> Math.abs(baseNumber - operand);
			case "M" -> baseNumber * operand;
			default -> baseNumber / operand;
		};
		answer %= 10_000;

		List<String> answerColors = new ArrayList<>(4);
		int divisor = 1000;
		for (int position = 0; position < 4; position++) {
			answerColors.add(ANSWER_COLORS[position][answer / divisor % 10]);
			divisor /= 10;
		}

		storeState(module, "input", new ColorMathInput(
			left, displayColor.equals("GREEN") ? right : List.of(), displayColor, operation
		));
		return success(new ColorMathOutput(baseNumber, operand, answer, answerColors));
	}

	private static List<String> normalizeColors(List<String> colors) {
		if (colors == null || colors.size() != 4) return null;
		List<String> normalized = colors.stream().map(ColorMathSolver::normalize).toList();
		return normalized.stream().allMatch(COLORS::contains) ? normalized : null;
	}

	private static String normalize(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}

	private static int decode(List<String> colors, int[][] table) {
		int number = 0;
		for (int position = 0; position < 4; position++) {
			number = number * 10 + table[position][COLORS.indexOf(colors.get(position))];
		}
		return number;
	}

	private static int redOperand(BombEntity bomb) {
		String serial = normalize(bomb.getSerialNumber());
		int batteries = bomb.getBatteryCount();
		int letters = (int) serial.chars().filter(Character::isLetter).count();
		int vowels = (int) serial.chars().filter(c -> "AEIOU".indexOf(c) >= 0).count();
		if (batteries <= 1) {
			int firstDigit = serial.chars().filter(Character::isDigit).map(c -> c - '0').findFirst().orElse(0);
			return firstDigit * 1000
				+ (int) BombEdgeworkUtils.getUnlitIndicatorCount(bomb) * 100
				+ 90
				+ countPorts(bomb, PortType.RJ45);
		}
		if (batteries <= 3) {
			return countPorts(bomb, PortType.PS2) * 100 + letters * 10 + bomb.getLastDigit();
		}
		if (batteries <= 5) {
			return vowels * 1000 + bomb.getBatteryHolders() * 100 + countPorts(bomb, PortType.SERIAL) * 10 + 4;
		}
		return countPorts(bomb, PortType.DVI) * 1000
			+ 500
			+ (letters - vowels) * 10
			+ (int) BombEdgeworkUtils.getLitIndicatorCount(bomb);
	}

	private static int countPorts(BombEntity bomb, PortType type) {
		return (int) BombEdgeworkUtils.countPortPlatesWithPortType(bomb, type);
	}
}
