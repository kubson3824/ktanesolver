package ktanesolver.module.modded.regular.equations;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
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
	type = ModuleType.EQUATIONS,
	id = "equations",
	name = "Equations",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Solve the selected simultaneous-equation system from the key colors, LEDs, and bomb edgework.",
	tags = {"equations", "math", "colors", "leds"}
)
public class EquationsSolver extends AbstractModuleSolver<EquationsInput, EquationsOutput> {
	private static final Set<String> COLORS = Set.of("BLUE", "RED", "PINK", "YELLOW", "GREEN");

	@Override
	protected SolveResult<EquationsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, EquationsInput input
	) {
		if (input == null || input.keyColors() == null || input.leds() == null
			|| input.keyColors().size() != 10 || input.leds().size() != 3) {
			return failure("Enter the colors of all ten digit keys and the state of all three LEDs");
		}
		List<String> colors = input.keyColors().stream()
			.map(color -> color == null ? "" : color.trim().toUpperCase(Locale.ROOT)).toList();
		if (colors.stream().anyMatch(color -> !COLORS.contains(color)) || input.leds().stream().anyMatch(value -> value == null)) {
			return failure("Key colors must be blue, red, pink, yellow, or green, and every LED must be set");
		}

		int litLeds = (int) input.leds().stream().filter(Boolean.TRUE::equals).count();
		int litIndicators = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		int indicatorCount = bomb.getIndicators().size();
		int serialSum = bomb.getSerialNumber() == null ? 0
			: bomb.getSerialNumber().chars().filter(Character::isDigit).map(ch -> ch - '0').sum();
		int a = litIndicators % 3;
		int b = serialSum - 2 * litLeds;
		int month = round.getStartTime() == null ? LocalDate.now().getMonthValue()
			: round.getStartTime().atZone(ZoneId.systemDefault()).getMonthValue();
		int c = month + 3 - litLeds;
		int blue = count(colors, "BLUE");
		int d = blue * (count(colors, "RED") - count(colors, "YELLOW"));
		int system = litIndicators > 2 ? 2
			: colors.get(1).equals(colors.get(5)) && colors.get(1).equals(colors.get(9)) ? 5
			: count(colors, "PINK") > count(colors, "GREEN") ? 3
			: litLeds > 1 ? 1
			: serialSum >= 16 ? 6 : 4;
		String variable = (indicatorCount + litLeds) % 4 < 2 ? "x" : "y";
		Solution solution = solveSystem(system, a, b, c, d);
		Rational value = solution == null ? null : variable.equals("x") ? solution.x() : solution.y();
		String answer = value == null ? "" : format(value);
		return success(new EquationsOutput(system, variable, a, b, c, d, answer, value == null));
	}

	private static int count(List<String> colors, String color) {
		return (int) colors.stream().filter(color::equals).count();
	}

	static Solution solveSystem(int system, long a, long b, long c, long d) {
		return switch (system) {
			case 1 -> solution(c, 2 * a - b, c * (a - b), 2 * (2 * a - b));
			case 2 -> solution(d - c, 1, 2 * d - c, a);
			case 3 -> solution(a + c, b - 1, a + c + a * (b - 1), b * (b - 1));
			case 4 -> solution(-b + 2 * a + 2 * c, 1, b - a - c, 1);
			case 5 -> solution(2 * a - 2 * c * d, 2 + c, 2 * d * (2 + c) + 2 * a - 2 * c * d, 2 + c);
			case 6 -> {
				long determinant = a * a - b * b;
				yield solution(a * c - b * d, determinant, a * d - b * c, determinant);
			}
			default -> null;
		};
	}

	private static Solution solution(long xNumerator, long xDenominator, long yNumerator, long yDenominator) {
		if (xDenominator == 0 || yDenominator == 0) return null;
		return new Solution(new Rational(xNumerator, xDenominator), new Rational(yNumerator, yDenominator));
	}

	static String format(Rational value) {
		return BigDecimal.valueOf(value.numerator()).divide(BigDecimal.valueOf(value.denominator()), 3, RoundingMode.DOWN)
			.stripTrailingZeros().toPlainString();
	}

	record Rational(long numerator, long denominator) {
		Rational {
			if (denominator < 0) { numerator = -numerator; denominator = -denominator; }
		}
	}
	record Solution(Rational x, Rational y) {}
}
