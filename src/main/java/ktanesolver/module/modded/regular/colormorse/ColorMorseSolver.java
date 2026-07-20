package ktanesolver.module.modded.regular.colormorse;

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
	type = ModuleType.COLOR_MORSE,
	id = "color-morse",
	name = "Color Morse",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode three Morse characters, apply their color rules, and evaluate the displayed expression.",
	tags = {"colors", "Morse", "math", "flashing lights"}
)
public class ColorMorseSolver extends AbstractModuleSolver<ColorMorseInput, ColorMorseOutput> {
	// ponytail: default rule seed only; add a rule-set input if non-default seeds need support.
	private static final List<String> COLORS = List.of("RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "PURPLE", "WHITE");
	private static final List<String> OPERATORS = List.of("ADD", "SUBTRACT", "MULTIPLY", "DIVIDE");
	private static final List<String> MORSE_DIGITS = List.of(
		"-----", ".----", "..---", "...--", "....-", ".....", "-....", "--...", "---..", "----."
	);

	@Override
	protected SolveResult<ColorMorseOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ColorMorseInput input
	) {
		if (input == null) return failure("Enter the three Color Morse lights and expression");
		List<String> characters = normalize(input.characters());
		List<String> colors = normalize(input.colors());
		List<String> operators = normalize(input.operators());
		String parentheses = normalize(input.parentheses());
		if (characters.size() != 3 || characters.stream().anyMatch(value -> !value.matches("[0-9A-Z]"))) {
			return failure("Enter one Morse character (0-9 or A-Z) for each light");
		}
		if (colors.size() != 3 || !colors.stream().allMatch(COLORS::contains)) return failure("Select a valid color for each light");
		if (operators.size() != 2 || !operators.stream().allMatch(OPERATORS::contains)) return failure("Select both operators");
		if (!List.of("FIRST_TWO", "LAST_TWO").contains(parentheses)) return failure("Select the displayed parentheses");

		int primaryColors = (int) colors.stream().filter(color -> List.of("RED", "YELLOW", "BLUE").contains(color)).count();
		List<Double> values = new ArrayList<>(3);
		boolean firstTwo = parentheses.equals("FIRST_TWO");
		for (int i = 0; i < 3; i++) {
			int value = Character.digit(characters.get(i).charAt(0), 36);
			switch (colors.get(i)) {
				case "RED" -> values.add(value % 2 == 1 ? value * 2d : value / 2d);
				case "ORANGE" -> values.add(value % 3 == 0 ? value / 3d : value + primaryColors);
				case "YELLOW" -> values.add((double) value * value);
				case "GREEN" -> {
					firstTwo = !firstTwo;
					values.add((double) value);
				}
				case "BLUE" -> values.add(value == 0 ? 0d : (double) ((value * 3 - 1) % 9 + 1));
				case "PURPLE" -> values.add(10d - value);
				default -> values.add((double) value);
			}
		}

		double result;
		try {
			result = firstTwo
				? apply(operators.get(1), apply(operators.get(0), values.get(0), values.get(1)), values.get(2))
				: operators.equals(List.of("DIVIDE", "DIVIDE"))
					? values.get(0) * values.get(2) / values.get(1)
					: apply(operators.get(0), values.get(0), apply(operators.get(1), values.get(1), values.get(2)));
		} catch (ArithmeticException exception) {
			return failure("The displayed expression divides by zero");
		}
		if (!Double.isFinite(result)) return failure("The displayed expression divides by zero");

		int magnitude = (int) Math.abs(result) % 1000;
		int answer = result < 0 && magnitude != 0 ? -magnitude : magnitude;
		List<String> souvenirColors = colors.stream()
			.map(color -> color.charAt(0) + color.substring(1).toLowerCase(Locale.ROOT)).toList();
		storeState(module, "colors", souvenirColors);
		storeState(module, "characters", characters);
		return success(new ColorMorseOutput(answer, values, expression(values, operators, firstTwo), morse(answer)));
	}

	private static List<String> normalize(List<String> values) {
		return values == null ? List.of() : values.stream().map(ColorMorseSolver::normalize).toList();
	}

	private static String normalize(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}

	private static double apply(String operator, double left, double right) {
		return switch (operator) {
			case "ADD" -> left + right;
			case "SUBTRACT" -> left - right;
			case "MULTIPLY" -> left * right;
			case "DIVIDE" -> {
				if (right == 0) throw new ArithmeticException();
				yield left / right;
			}
			default -> throw new IllegalArgumentException("Unknown operator");
		};
	}

	private static String expression(List<Double> values, List<String> operators, boolean firstTwo) {
		String first = format(values.get(0));
		String second = format(values.get(1));
		String third = format(values.get(2));
		String leftOperator = symbol(operators.get(0));
		String rightOperator = symbol(operators.get(1));
		return firstTwo
			? "(" + first + " " + leftOperator + " " + second + ") " + rightOperator + " " + third
			: first + " " + leftOperator + " (" + second + " " + rightOperator + " " + third + ")";
	}

	private static String format(double value) {
		return value == Math.rint(value) ? Long.toString((long) value) : Double.toString(value);
	}

	private static String symbol(String operator) {
		return switch (operator) {
			case "ADD" -> "+";
			case "SUBTRACT" -> "−";
			case "MULTIPLY" -> "×";
			default -> "÷";
		};
	}

	private static List<String> morse(int answer) {
		List<String> morse = new ArrayList<>();
		if (answer < 0) morse.add("-....-");
		for (char digit : Integer.toString(Math.abs(answer)).toCharArray()) morse.add(MORSE_DIGITS.get(digit - '0'));
		return morse;
	}
}
