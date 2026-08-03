package ktanesolver.module.modded.regular.greekcalculus;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.greekcalculus.GreekCalculusInput.DataPoint;
import ktanesolver.module.modded.regular.greekcalculus.GreekCalculusInput.LedColor;

@Service
@ModuleInfo(
	type = ModuleType.GREEK_CALCULUS,
	id = "greekCalculus",
	name = "Greek Calculus",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode Greek values and calculate the displayed function estimate",
	tags = {"calculus", "greek", "data points", "edgework", "modded"}
)
public class GreekCalculusSolver extends AbstractModuleSolver<GreekCalculusInput, GreekCalculusOutput> {
	private static final Pattern INTEGER = Pattern.compile("[+-]?\\d+");
	private static final Pattern SYMBOLIC = Pattern.compile("([αβγδεζηθικλμνξοπρστυφχψω])([+-]\\d+)?");

	@Override
	protected SolveResult<GreekCalculusOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, GreekCalculusInput input
	) {
		if (input.dataPoints() == null || input.dataPoints().size() < 2) return failure("Enter at least two data points");
		if (input.ledColor() == null) return failure("Select the LED color");
		if (input.blueParameter() == null || input.blueParameter().isBlank()
			|| input.yellowParameter() == null || input.yellowParameter().isBlank()) {
			return failure("Enter both parameters");
		}
		if (input.dataPoints().stream().anyMatch(point -> point == null || point.y() == null || point.y().isBlank())) {
			return failure("Every data point needs an x and y value");
		}
		Set<Integer> xValues = new HashSet<>();
		if (input.dataPoints().stream().anyMatch(point -> !xValues.add(point.x()))) {
			return failure("Data point x values must be unique");
		}

		try {
			List<DataPoint> displayed = input.dataPoints().stream().sorted(Comparator.comparingInt(DataPoint::x)).toList();
			List<Long> numericYValues = displayed.stream()
				.map(DataPoint::y).map(GreekCalculusSolver::numericValue).filter(value -> value != null).toList();
			Map<Character, Long> greekValues = greekValues(bomb, displayed, numericYValues);
			long blueParameter = decode(input.blueParameter(), greekValues);
			long yellowParameter = decode(input.yellowParameter(), greekValues);
			if (displayed.stream().noneMatch(point -> point.x() == blueParameter)
				|| displayed.stream().noneMatch(point -> point.x() == yellowParameter)) {
				return failure("Both parameters must match data point x values");
			}

			greekValues.put('λ', Math.absExact(Math.subtractExact(blueParameter, yellowParameter)));
			greekValues.put('χ', Math.addExact(blueParameter, yellowParameter));
			List<Point> points = new ArrayList<>(displayed.size());
			for (DataPoint point : displayed) points.add(new Point(point.x(), decode(point.y(), greekValues)));

			long answer = calculate(points, blueParameter, yellowParameter, input.ledColor());
			return success(new GreekCalculusOutput(Math.toIntExact(answer)));
		} catch (NumberFormatException exception) {
			return failure("Displayed values must fit within a signed 64-bit integer");
		} catch (ArithmeticException exception) {
			return failure("The decoded values or answer exceed the supported range");
		} catch (IllegalArgumentException exception) {
			return failure(exception.getMessage());
		}
	}

	private static Map<Character, Long> greekValues(BombEntity bomb, List<DataPoint> points, List<Long> numericYValues) {
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber();
		long litIndicators = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		long unlitIndicators = bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
		long portCount = bomb.getPortPlates().stream().mapToLong(plate -> plate.getPorts().size()).sum();
		long distinctPorts = bomb.getPortPlates().stream().flatMap(plate -> plate.getPorts().stream()).distinct().count();

		Map<Character, Long> values = new HashMap<>();
		values.put('α', litIndicators);
		values.put('β', (long)bomb.getAaBatteryCount());
		values.put('γ', portCount);
		values.put('δ', (long)bomb.getLastDigit());
		if (!numericYValues.isEmpty()) {
			values.put('ε', numericYValues.stream().mapToLong(Long::longValue).max().orElseThrow());
			values.put('θ', numericYValues.stream().mapToLong(Long::longValue).min().orElseThrow());
		}
		values.put('ζ', (long)points.size());
		values.put('η', (long)points.getFirst().x());
		values.put('ι', unlitIndicators);
		values.put('κ', serial.chars().filter(Character::isDigit).count()
			* serial.chars().filter(Character::isLetter).count());
		values.put('μ', (long)bomb.getBatteryHolders());
		values.put('ν', (long)bomb.getDBatteryCount());
		values.put('ξ', (long)points.getLast().x());
		values.put('ο', (long)bomb.getPortPlates().size());
		values.put('π', 3L);
		values.put('ρ', distinctPorts);
		values.put('σ', serial.chars().filter(Character::isDigit).map(character -> character - '0').asLongStream().sum());
		values.put('τ', 6L);
		values.put('υ', (long)bomb.getBatteryCount());
		values.put('φ', 2L);
		values.put('ψ', (long)bomb.getIndicators().size());
		values.put('ω', (long)serial.chars().filter(Character::isDigit).map(character -> character - '0').findFirst().orElse(0));
		return values;
	}

	private static long calculate(List<Point> points, long blue, long yellow, LedColor color) {
		return switch (color) {
			case GREEN -> derivative(points, blue, yellow);
			case RED, BLUE, YELLOW -> integral(points, blue, yellow, color);
			case OTHER -> points.stream()
				.filter(point -> point.x() >= Math.min(blue, yellow) && point.x() <= Math.max(blue, yellow))
				.mapToLong(Point::y).reduce(0L, Math::addExact);
		};
	}

	private static long derivative(List<Point> points, long blue, long yellow) {
		long doubledAverage = Math.addExact(blue, yellow);
		Point below = null;
		Point above = null;
		for (Point point : points) {
			long doubledX = 2L * point.x();
			if (doubledX < doubledAverage) below = point;
			else if (doubledX > doubledAverage && above == null) above = point;
		}
		if (below == null || above == null) throw new IllegalArgumentException("The parameter average needs data points on both sides");
		return round(Math.subtractExact(above.y(), below.y()), (long)above.x() - below.x());
	}

	private static long integral(List<Point> points, long blue, long yellow, LedColor color) {
		if (blue == yellow) return 0;
		long lower = Math.min(blue, yellow);
		long higher = Math.max(blue, yellow);
		long doubledArea = 0;
		for (int index = 0; index < points.size() - 1; index++) {
			Point left = points.get(index);
			Point right = points.get(index + 1);
			if (left.x() < lower || right.x() > higher) continue;
			long width = (long)right.x() - left.x();
			long height = switch (color) {
				case RED -> Math.multiplyExact(2, left.y());
				case BLUE -> Math.multiplyExact(2, right.y());
				case YELLOW -> Math.addExact(left.y(), right.y());
				default -> throw new IllegalArgumentException("Invalid integral LED color");
			};
			doubledArea = Math.addExact(doubledArea, Math.multiplyExact(width, height));
		}
		if (blue > yellow) doubledArea = Math.negateExact(doubledArea);
		return round(doubledArea, 2);
	}

	private static long round(long numerator, long positiveDenominator) {
		long quotient = Math.floorDiv(numerator, positiveDenominator);
		long remainder = Math.floorMod(numerator, positiveDenominator);
		long threshold = positiveDenominator / 2 + positiveDenominator % 2;
		return remainder >= threshold ? Math.addExact(quotient, 1) : quotient;
	}

	private static Long numericValue(String display) {
		String normalized = display.replaceAll("\\s+", "");
		return INTEGER.matcher(normalized).matches() ? Long.parseLong(normalized) : null;
	}

	private static long decode(String display, Map<Character, Long> greekValues) {
		String normalized = display.replaceAll("\\s+", "");
		if (INTEGER.matcher(normalized).matches()) return Long.parseLong(normalized);
		Matcher matcher = SYMBOLIC.matcher(normalized);
		if (!matcher.matches()) throw new IllegalArgumentException("Use an integer or a Greek letter with an optional offset");
		char symbol = matcher.group(1).charAt(0);
		Long base = greekValues.get(symbol);
		if (base == null) throw new IllegalArgumentException("Cannot decode " + symbol + " from the entered values");
		long offset = matcher.group(2) == null ? 0 : Long.parseLong(matcher.group(2));
		return Math.addExact(base, offset);
	}

	private record Point(int x, long y) {}
}
