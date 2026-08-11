package ktanesolver.module.modded.regular.functions;

import java.util.*;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.*;
import ktanesolver.enums.*;
import ktanesolver.logic.*;
import ktanesolver.module.modded.regular.functions.FunctionsInput.Observation;

@Service
@ModuleInfo(
	type = ModuleType.FUNCTIONS,
	id = "qFunctions",
	name = "Functions",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the hidden query function, apply the displayed letter's edgework offset, and calculate the final answer.",
	tags = {"math", "functions", "query", "edgework"}
)
public class FunctionsSolver extends AbstractModuleSolver<FunctionsInput, FunctionsOutput> {
	private static final long MAX_DISPLAY = 999_999_999_999L;
	private static final int[][] OFFSETS = {
		{6,-4},{2,-3},{5,-4},{8,-8},{6,-2},{6,-5},{1,-5},{1,-3},{1,5},{5,-3},{4,-1},{6,7},{3,-7},
		{3,-5},{6,-1},{2,-3},{1,-3},{3,-2},{2,4},{4,1},{2,-2},{7,1},{3,-5},{3,-3},{4,-1},{5,-1}
	};
	private static final List<String> NAMES = List.of(
		"Digital root of ((a + b) squared)", "a times b, even-position digits removed",
		"8 concatenated with the number of odd digits and the number of even digits", "Digital root of (a + b)",
		"(a + b) modulo 1000", "(a + b) squared", "Highest digit", "Number of different digits missing",
		"(Larger times 2) minus Smaller", "Sum of times each digit appears in the serial number", "Number of even numbers",
		"Dots found in digits when using Morse code", "a + b concatenated with |a - b|",
		"Integer of (Larger divided by Smaller) modulo 1000", "Digital root of |a - b|", "Lit indicators times 63",
		"a times b", "(a times b) modulo 1000", "(sum of digits in a) times (sum of digits in b)",
		"Smaller minus (Larger modulo Smaller)", "a times b, odd-position digits removed",
		"All missing digits concatenated from 1 through 0", "Lunar Addition", "a times b, odd digits removed",
		"Each distinct digit followed by 2 if even or 1 if odd", "sqrt(a) + sqrt(b)", "Digital root of (a times b)",
		"Number of digits in a and b times 202", "808", "810 minus the number of inputs below 100", "Larger modulo Smaller",
		"Sum of letters in each digit name", "Product of the first and last digits of a and b", "sqrt(a + b)",
		"Product of the first digit of a and last digit of b", "(a squared) + (b squared)", "(a + b) modulo 12",
		"|a - b|", "Each distinct digit followed by its occurrence count", "a + b", "Larger divided by Smaller",
		"(a + b) times (Larger divided by Smaller)"
	);
	private static final List<Integer> QUERY_VALUES = queryValues();

	@Override
	protected SolveResult<FunctionsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, FunctionsInput input) {
		if (input == null || input.leftNumber() == null || input.rightNumber() == null || input.letter() == null)
			return failure("Enter both displayed numbers and the letter");
		if (input.leftNumber() < 1 || input.leftNumber() > 999 || input.rightNumber() < 1 || input.rightNumber() > 999 || input.leftNumber().equals(input.rightNumber()))
			return failure("Displayed numbers must be distinct values from 1 through 999");
		String letter = input.letter().trim().toUpperCase(Locale.ROOT);
		if (!letter.matches("[A-Z]")) return failure("Displayed letter must be A through Z");
		if (bomb == null || bomb.getSerialNumber() == null || !bomb.getSerialNumber().toUpperCase(Locale.ROOT).matches("[A-Z0-9]{6}"))
			return failure("Bomb serial number must contain six letters/digits");

		List<Observation> observations = input.observations() == null ? List.of() : input.observations();
		for (Observation observation : observations) {
			if (observation == null || observation.a() == null || observation.b() == null || observation.result() == null)
				return failure("Every query observation needs a, b, and the displayed result");
			if (observation.a() < 1 || observation.a() > 9999 || observation.b() < 1 || observation.b() > 9999 || observation.a().equals(observation.b()))
				return failure("Query inputs must be distinct values from 1 through 9999");
			if (observation.result() < 0 || observation.result() > MAX_DISPLAY)
				return failure("Query results must contain at most twelve digits");
		}

		storeState(module, Map.of(
			"functionsLeftNumber", input.leftNumber(),
			"functionsLetter", letter,
			"functionsRightNumber", input.rightNumber()
		));
		if (!observations.isEmpty()) storeState(module, "functionsFirstQueryLastDigit", observations.getFirst().result() % 10);

		List<Integer> candidates = new ArrayList<>();
		for (int function = 0; function < 42; function++) {
			boolean matches = true;
			for (Observation observation : observations) {
				if (evaluate(function, observation.a(), observation.b(), bomb) != observation.result()) {
					matches = false;
					break;
				}
			}
			if (matches) candidates.add(function);
		}
		if (candidates.isEmpty()) return failure("No query function matches those observations");
		if (candidates.size() > 1) {
			List<Integer> suggested = bestQuery(candidates, observations, bomb);
			if (suggested == null) return failure("The remaining functions could not be distinguished; verify the observations");
			return success(new FunctionsOutput(null, null, null, null, null, List.copyOf(candidates), suggested), false);
		}

		int queryFunction = candidates.getFirst();
		int letterIndex = letter.charAt(0) - 'A';
		int finalFunction = Math.floorMod(queryFunction + OFFSETS[letterIndex][condition(letterIndex, bomb) ? 0 : 1], 42);
		long answer = evaluate(finalFunction, input.leftNumber(), input.rightNumber(), bomb);
		return success(new FunctionsOutput(queryFunction, NAMES.get(queryFunction), finalFunction, NAMES.get(finalFunction), answer, List.copyOf(candidates), null));
	}

	static long evaluate(int function, int a, int b, BombEntity bomb) {
		String digits = "" + a + b;
		long product = (long) a * b;
		int larger = Math.max(a, b), smaller = Math.min(a, b);
		long value = switch (function) {
			case 0 -> digitalRoot((long) (a + b) * (a + b));
			case 1 -> positions(Long.toString(product), 0);
			case 2 -> 800L + 10L * digits.chars().filter(c -> ((c - '0') & 1) == 1).count() + digits.chars().filter(c -> ((c - '0') & 1) == 0).count();
			case 3 -> digitalRoot(a + b);
			case 4 -> (a + b) % 1000L;
			case 5 -> (long) (a + b) * (a + b);
			case 6 -> digits.chars().map(c -> c - '0').max().orElse(0);
			case 7 -> 10 - (int) digits.chars().distinct().count();
			case 8 -> 2L * larger - smaller;
			case 9 -> serialDigitMatches(digits, bomb);
			case 10 -> (a % 2 == 0 ? 1 : 0) + (b % 2 == 0 ? 1 : 0);
			case 11 -> digits.chars().map(c -> new int[]{0,1,2,3,4,5,4,3,2,1}[c - '0']).sum();
			case 12 -> parse((a + b) + Long.toString(Math.abs(a - b)));
			case 13 -> (larger / smaller) % 1000L;
			case 14 -> digitalRoot(Math.abs(a - b));
			case 15 -> 63L * bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
			case 16 -> product;
			case 17 -> product % 1000;
			case 18 -> (long) digitSum(a) * digitSum(b);
			case 19 -> smaller - larger % smaller;
			case 20 -> positions(Long.toString(product), 1);
			case 21 -> missingDigits(digits);
			case 22 -> lunar(a, b);
			case 23 -> parseOrZero(Long.toString(product).chars().filter(c -> ((c - '0') & 1) == 0).collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append).toString());
			case 24 -> digitPairs(digits, false);
			case 25 -> (long) (Math.sqrt(a) + Math.sqrt(b));
			case 26 -> digitalRoot(product);
			case 27 -> digits.length() * 202L;
			case 28 -> 808;
			case 29 -> 810L - (a < 100 ? 1 : 0) - (b < 100 ? 1 : 0);
			case 30 -> larger % smaller;
			case 31 -> digits.chars().map(c -> new int[]{4,3,3,5,4,4,3,5,5,4}[c - '0']).sum();
			case 32 -> (long) firstDigit(a) * lastDigit(a) * firstDigit(b) * lastDigit(b);
			case 33 -> (long) Math.sqrt(a + b);
			case 34 -> (long) firstDigit(a) * lastDigit(b);
			case 35 -> (long) a * a + (long) b * b;
			case 36 -> (a + b) % 12L;
			case 37 -> Math.abs(a - b);
			case 38 -> digitPairs(digits, true);
			case 39 -> a + b;
			case 40 -> larger / smaller;
			case 41 -> (long) (a + b) * larger / smaller;
			default -> throw new IllegalArgumentException("Unknown function " + function);
		};
		return truncate(value);
	}

	static int offset(char letter, BombEntity bomb) {
		int index = Character.toUpperCase(letter) - 'A';
		if (index < 0 || index >= 26) throw new IllegalArgumentException("Letter must be A-Z");
		return OFFSETS[index][condition(index, bomb) ? 0 : 1];
	}

	private static boolean condition(int index, BombEntity bomb) {
		String serial = bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		int batteries = bomb.getBatteryCount(), indicators = bomb.getIndicators().size(), ports = portCount(bomb);
		long lit = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		long unlit = bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
		return switch (index) {
			case 0 -> containsAny(serial, "KBUM");
			case 1 -> batteries == 2 || indicators == 2 || ports == 2;
			case 2 -> Character.isDigit(serial.charAt(0));
			case 3 -> bomb.isIndicatorLit("BOB");
			case 4 -> bomb.isIndicatorUnlit("BOB");
			case 5 -> Character.isLetter(serial.charAt(0));
			case 6 -> bomb.hasPort(PortType.PARALLEL) && !bomb.hasPort(PortType.SERIAL);
			case 7 -> bomb.getPortPlates().stream().anyMatch(plate -> plate.getPorts().isEmpty());
			case 8 -> batteries == 0;
			case 9 -> containsAny(serial, "AEIOU");
			case 10 -> indicators > 3;
			case 11 -> batteries % 2 == 0;
			case 12 -> ports > indicators;
			case 13 -> lit > unlit;
			case 14 -> indicators > batteries;
			case 15 -> indicators % 2 == 0;
			case 16 -> containsAny(serial, "ERIS");
			case 17 -> serial.chars().filter(Character::isLetter).count() == 3;
			case 18 -> batteries > ports;
			case 19 -> batteries > 4;
			case 20 -> lit == unlit;
			case 21 -> containsAny(serial, "JQXZ");
			case 22 -> ports >= 3;
			case 23 -> indicators == 0;
			case 24 -> serial.chars().filter(Character::isDigit).count() >= 4;
			case 25 -> ports == 0;
			default -> false;
		};
	}

	private static List<Integer> bestQuery(List<Integer> candidates, List<Observation> observations, BombEntity bomb) {
		Set<String> used = new HashSet<>();
		for (Observation observation : observations) used.add(observation.a() + ":" + observation.b());
		List<Integer> best = null;
		int bestWorst = candidates.size(), bestDistinct = 0;
		for (int a : QUERY_VALUES) for (int b : QUERY_VALUES) {
			if (a == b || used.contains(a + ":" + b)) continue;
			Map<Long, Integer> buckets = new HashMap<>();
			for (int candidate : candidates) buckets.merge(evaluate(candidate, a, b, bomb), 1, Integer::sum);
			int worst = buckets.values().stream().mapToInt(Integer::intValue).max().orElse(candidates.size());
			if (worst < bestWorst || worst == bestWorst && buckets.size() > bestDistinct) {
				bestWorst = worst;
				bestDistinct = buckets.size();
				best = List.of(a, b);
			}
		}
		return bestWorst < candidates.size() ? best : null;
	}

	private static List<Integer> queryValues() {
		LinkedHashSet<Integer> values = new LinkedHashSet<>();
		for (int i = 1; i <= 20; i++) values.add(i);
		values.addAll(List.of(37, 42, 63, 99, 100, 101, 123, 246, 808, 999, 1000, 1234, 5678, 9876, 9999));
		return List.copyOf(values);
	}

	private static long positions(String value, int parity) {
		StringBuilder kept = new StringBuilder();
		for (int i = 0; i < value.length(); i++) if (i % 2 == parity) kept.append(value.charAt(i));
		return parseOrZero(kept.toString());
	}

	private static long missingDigits(String digits) {
		StringBuilder missing = new StringBuilder();
		for (char digit : "1234567890".toCharArray()) if (digits.indexOf(digit) < 0) missing.append(digit);
		return parseOrZero(missing.toString());
	}

	private static long lunar(int a, int b) {
		String x = String.format("%04d", a), y = String.format("%04d", b);
		StringBuilder result = new StringBuilder();
		for (int i = 0; i < 4; i++) result.append((char) Math.max(x.charAt(i), y.charAt(i)));
		return parse(result.toString());
	}

	private static long digitPairs(String digits, boolean counts) {
		LinkedHashMap<Character, Integer> seen = new LinkedHashMap<>();
		for (char digit : digits.toCharArray()) seen.merge(digit, 1, Integer::sum);
		StringBuilder result = new StringBuilder();
		for (Map.Entry<Character, Integer> entry : seen.entrySet())
			result.append(entry.getKey()).append(counts ? entry.getValue() : ((entry.getKey() - '0') % 2 == 0 ? 2 : 1));
		return parse(result.substring(0, Math.min(12, result.length())));
	}

	private static long serialDigitMatches(String digits, BombEntity bomb) {
		String serial = bomb.getSerialNumber();
		long matches = 0;
		for (char digit : digits.toCharArray()) matches += serial.chars().filter(c -> c == digit).count();
		return matches;
	}

	private static int portCount(BombEntity bomb) {
		return bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
	}

	private static boolean containsAny(String value, String characters) {
		return value.chars().anyMatch(c -> characters.indexOf(c) >= 0);
	}

	private static long digitalRoot(long value) {
		while (value > 9) {
			long sum = 0;
			while (value > 0) { sum += value % 10; value /= 10; }
			value = sum;
		}
		return value;
	}

	private static int digitSum(int value) {
		return Integer.toString(value).chars().map(c -> c - '0').sum();
	}

	private static int firstDigit(int value) { return Integer.toString(value).charAt(0) - '0'; }
	private static int lastDigit(int value) { return value % 10; }
	private static long parseOrZero(String value) { return value.isEmpty() ? 0 : parse(value); }
	private static long parse(String value) { return Long.parseLong(value); }
	private static long truncate(long value) {
		String text = Long.toString(value);
		return text.length() <= 12 ? value : Long.parseLong(text.substring(0, 12));
	}
}
