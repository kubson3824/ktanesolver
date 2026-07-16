package ktanesolver.module.modded.regular.yahtzee;

import java.util.ArrayList;
import java.util.HashSet;
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
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.YAHTZEE,
	id = "yahtzee",
	name = "Yahtzee",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Choose which color-coded dice to keep after each roll until all five match.",
	tags = {"dice", "rerolling", "edgework", "Souvenir"}
)
public class YahtzeeSolver extends AbstractModuleSolver<YahtzeeInput, YahtzeeOutput> {
	private static final List<String> COLORS = List.of("PURPLE", "YELLOW", "BLUE", "WHITE", "BLACK");

	@Override
	protected SolveResult<YahtzeeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, YahtzeeInput input
	) {
		if (input == null || input.dice() == null || input.dice().size() != 5
			|| input.dice().stream().anyMatch(value -> value == null || value < 1 || value > 6)) {
			return failure("Enter one value from 1 to 6 for each of the five dice");
		}

		List<Integer> dice = List.copyOf(input.dice());
		int rollNumber = number(module.getState().get("rollNumber"), 0) + 1;
		int lastRolled = rollNumber == 1 ? 5 : number(module.getState().get("nextRollCount"), -1);
		List<Integer> previousDice = integers(module.getState().get("dice"));
		List<Integer> previousKept = colorIndexes(module.getState().get("keptColors"));
		if (rollNumber > 1 && (lastRolled < 1 || previousDice.size() != 5)) {
			return failure("The saved Yahtzee roll state is incomplete; reset this module and enter the current roll again");
		}
		for (int index : previousKept) {
			if (!previousDice.get(index).equals(dice.get(index))) {
				return failure(COLORS.get(index).toLowerCase(Locale.ROOT) + " was kept and must still show " + previousDice.get(index));
			}
		}

		String initialCategory = category(dice);
		if (rollNumber == 1) storeState(module, "initialRollCategory", initialCategory);

		boolean solved = dice.stream().distinct().count() == 1;
		List<Integer> keep = solved ? List.of(0, 1, 2, 3, 4)
			: lastRolled == 1 ? previousKept
			: bestLegalKeep(dice, lastRolled, previousKept, bomb);
		if (keep == null) return failure("No legal keep could be found; check the dice and previous roll");

		List<String> keepColors = keep.stream().map(COLORS::get).toList();
		List<String> rerollColors = java.util.stream.IntStream.range(0, 5)
			.filter(index -> !keep.contains(index)).mapToObj(COLORS::get).toList();
		String action = solved ? "SOLVED" : keep.isEmpty() ? "ROLL_ALL" : "KEEP_AND_ROLL";

		storeState(module, "dice", dice);
		storeState(module, "rollNumber", rollNumber);
		storeState(module, "keptColors", keepColors);
		storeState(module, "nextRollCount", rerollColors.size());
		return success(new YahtzeeOutput(rollNumber, action, keepColors, rerollColors), solved);
	}

	private static List<Integer> bestLegalKeep(List<Integer> dice, int lastRolled, List<Integer> previousKept, BombEntity bomb) {
		List<Integer> best = null;
		for (int mask = 0; mask < 31; mask++) {
			List<Integer> candidate = new ArrayList<>();
			for (int index = 0; index < 5; index++) if ((mask & (1 << index)) != 0) candidate.add(index);
			if (legal(dice, candidate, lastRolled, previousKept, bomb)
				&& (best == null || candidate.size() > best.size())) best = candidate;
		}
		return best;
	}

	private static boolean legal(
		List<Integer> dice, List<Integer> keep, int lastRolled, List<Integer> previousKept, BombEntity bomb
	) {
		Integer keptValue = keep.isEmpty() ? null : dice.get(keep.getFirst());
		if (keep.stream().anyMatch(index -> !dice.get(index).equals(keptValue))) return false;
		List<Integer> unkept = java.util.stream.IntStream.range(0, 5)
			.filter(index -> !keep.contains(index)).mapToObj(dice::get).toList();

		if (lastRolled == 5) return java.util.Objects.equals(keptValue, requiredFirstRollValue(dice, bomb));
		if (lastRolled == 4) {
			if (isStraight(dice)) {
				Integer previousValue = previousKept.isEmpty() ? null : dice.get(previousKept.getFirst());
				return keptValue != null && !keptValue.equals(previousValue);
			}
			if (keep.isEmpty()) return true;
			if (keep.size() == bomb.getPortPlates().size() && keep.size() > 2) return false;
			if (keep.size() == 1) return keep.getFirst() != color("BLACK");
			if (keep.size() == 2) return !keep.contains(color("BLUE"));
			if (keep.size() == 3) return unkept.stream().noneMatch(value -> serialDigits(bomb).contains(value));
			return keep.size() == 4 && unkept.getFirst() > keptValue;
		}
		if (lastRolled == 3) {
			if ("full house".equals(category(dice))) {
				int required = BombEdgeworkUtils.hasDuplicatePorts(bomb) ? 3 : 2;
				return keep.size() == required && unkept.stream().noneMatch(keptValue::equals);
			}
			if (keep.isEmpty() || serialDigits(bomb).contains(keptValue) || keep.size() <= 2) return true;
			if (keep.size() == 3) return previousKept.contains(color("PURPLE")) || previousKept.contains(color("WHITE"));
			return keep.size() == 4 && unkept.getFirst() < keptValue;
		}
		if (lastRolled == 2) {
			if (keep.size() <= 3) return true;
			return keep.size() == 4 && (previousKept.contains(color("YELLOW")) || previousKept.contains(color("BLUE"))
				|| Math.abs(unkept.getFirst() - keptValue) == 1);
		}
		return false;
	}

	private static Integer requiredFirstRollValue(List<Integer> dice, BombEntity bomb) {
		String category = category(dice);
		if ("large straight".equals(category)) {
			return serialDigits(bomb).stream().filter(dice::contains).max(Integer::compareTo).orElse(dice.get(color("PURPLE")));
		}
		if ("small straight".equals(category)) return smallStraightOutlier(dice);
		if ("three of a kind".equals(category) || "full house".equals(category)) {
			if (BombEdgeworkUtils.getLitIndicatorCount(bomb) >= 2) return dice.get(color("WHITE"));
			if (BombEdgeworkUtils.getUnlitIndicatorCount(bomb) >= 2) return dice.get(color("BLACK"));
			return dice.stream().filter(value -> count(dice, value) < 3).max(Integer::compareTo).orElseThrow();
		}
		if ("four of a kind".equals(category) || "two pairs".equals(category)) {
			if (dice.contains(bomb.getBatteryCount())) return bomb.getBatteryCount();
			if (dice.contains(bomb.getBatteryHolders())) return bomb.getBatteryHolders();
			return dice.get(color("YELLOW"));
		}
		if ("pair".equals(category)) {
			String selected = bomb.hasPort(PortType.PARALLEL) ? "PURPLE"
				: bomb.hasPort(PortType.PS2) ? "BLUE"
				: bomb.hasPort(PortType.STEREO_RCA) ? "WHITE"
				: bomb.hasPort(PortType.RJ45) ? "BLACK" : "YELLOW";
			return dice.get(color(selected));
		}
		return null;
	}

	static String category(List<Integer> dice) {
		if (dice.stream().distinct().count() == 1) return "yahtzee";
		if (isLargeStraight(dice)) return "large straight";
		if (isSmallStraight(dice)) return "small straight";
		if (dice.stream().anyMatch(value -> count(dice, value) == 4)) return "four of a kind";
		boolean three = dice.stream().anyMatch(value -> count(dice, value) == 3);
		boolean pair = dice.stream().anyMatch(value -> count(dice, value) == 2);
		if (three && pair) return "full house";
		if (three) return "three of a kind";
		if (dice.stream().filter(value -> count(dice, value) == 2).distinct().count() == 2) return "two pairs";
		if (pair) return "pair";
		return "nothing";
	}

	private static boolean isStraight(List<Integer> dice) {
		return isLargeStraight(dice) || isSmallStraight(dice);
	}

	private static boolean isLargeStraight(List<Integer> dice) {
		return dice.containsAll(List.of(2, 3, 4, 5)) && (dice.contains(1) || dice.contains(6));
	}

	private static boolean isSmallStraight(List<Integer> dice) {
		for (int start = 1; start <= 3; start++) if (dice.containsAll(List.of(start, start + 1, start + 2, start + 3))) return true;
		return false;
	}

	private static int smallStraightOutlier(List<Integer> dice) {
		for (int start = 1; start <= 3; start++) {
			List<Integer> remainder = new ArrayList<>(dice);
			for (int value = start; value < start + 4; value++) if (!remainder.remove(Integer.valueOf(value))) break;
			if (remainder.size() == 1) return remainder.getFirst();
		}
		throw new IllegalArgumentException("Not a small straight");
	}

	private static long count(List<Integer> dice, int value) {
		return dice.stream().filter(candidate -> candidate == value).count();
	}

	private static int color(String name) {
		return COLORS.indexOf(name);
	}

	private static Set<Integer> serialDigits(BombEntity bomb) {
		String serial = bomb.getSerialNumber();
		if (serial == null) return Set.of();
		Set<Integer> digits = new HashSet<>();
		serial.chars().filter(Character::isDigit).forEach(character -> digits.add(character - '0'));
		return digits;
	}

	private static int number(Object value, int fallback) {
		return value instanceof Number number ? number.intValue() : fallback;
	}

	private static List<Integer> integers(Object value) {
		if (!(value instanceof List<?> list) || list.stream().anyMatch(item -> !(item instanceof Number))) return List.of();
		return list.stream().map(item -> ((Number) item).intValue()).toList();
	}

	private static List<Integer> colorIndexes(Object value) {
		if (!(value instanceof List<?> list)) return List.of();
		return list.stream().map(String::valueOf).map(COLORS::indexOf).filter(index -> index >= 0).toList();
	}

}
