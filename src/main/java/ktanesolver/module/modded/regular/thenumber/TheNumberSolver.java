package ktanesolver.module.modded.regular.thenumber;

import java.time.DayOfWeek;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

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
	type = ModuleType.THE_NUMBER,
	id = "theNumber",
	name = "The Number",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine a four-digit code from the keypad, bomb state, and submission time.",
	tags = {"numbers", "keypad", "edgework", "time"}
)
public class TheNumberSolver extends AbstractModuleSolver<TheNumberInput, TheNumberOutput> {
	private static final Set<ModuleType> THIRD_DIGIT_PRESENT = Set.of(ModuleType.GAMEPAD, ModuleType.NUMBER_PAD);
	private static final Set<ModuleType> THIRD_DIGIT_SOLVED = Set.of(ModuleType.TIMEZONE, ModuleType.THE_BULB, ModuleType.SEMAPHORE);
	private static final Set<ModuleType> THIRD_DIGIT_UNSOLVED = Set.of(ModuleType.CRYPTOGRAPHY, ModuleType.LIGHT_CYCLE, ModuleType.PIANO_KEYS);

	@Override
	protected SolveResult<TheNumberOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TheNumberInput input
	) {
		if(input == null) return failure("Enter the keypad and submission snapshot");
		if(input.buttons() == null || input.buttons().size() != 10
			|| input.buttons().stream().anyMatch(value -> value == null || value < 0 || value > 9)
			|| Set.copyOf(input.buttons()).size() != 10) {
			return failure("Enter each digit from 0 to 9 exactly once");
		}
		if(input.hasTwoFactor() == null) return failure("Specify whether Two Factor is present");
		if(input.startingTimeMinutes() == null || input.startingTimeMinutes() <= 0) {
			return failure("Enter the bomb's starting time in minutes");
		}
		if(input.startDay() == null) return failure("Select the weekday when the bomb started");
		if(input.currentHour() == null || input.currentHour() < 0 || input.currentHour() > 23) {
			return failure("Enter the current hour from 0 to 23");
		}
		if(input.timerBelowHalf() == null) return failure("Specify whether the timer is below half");
		if(bomb.getSerialNumber() == null || bomb.getSerialNumber().isBlank()) {
			return failure("The bomb needs a serial number");
		}

		int first = firstDigit(bomb, input.hasTwoFactor());
		int second = secondDigit(input.buttons());
		int third = thirdDigit(bomb, input.startingTimeMinutes());
		int fourth = fourthDigit(bomb, input.startDay(), input.currentHour(), input.timerBelowHalf(), first, second, third);
		List<Integer> digits = List.of(first, second, third, fourth);
		String code = digits.stream().map(String::valueOf).collect(Collectors.joining());
		List<Integer> positions = digits.stream().map(digit -> input.buttons().indexOf(digit) + 1).toList();
		return success(new TheNumberOutput(code, positions));
	}

	private static int firstDigit(BombEntity bomb, boolean hasTwoFactor) {
		if(hasTwoFactor) return 7;
		if(bomb.getBatteryHolders() >= 3) return 0;
		if(BombEdgeworkUtils.hasEmptyPortPlate(bomb)) return 9;
		if(!BombEdgeworkUtils.hasDuplicatePorts(bomb)) return 5;
		if(bomb.getBatteryCount() == 0) return 3;
		if(bomb.getSerialNumber().toUpperCase(Locale.ROOT).chars().anyMatch(character -> "OMZ6L5".indexOf(character) >= 0)) return 1;
		if(bomb.getBatteryCount() < BombEdgeworkUtils.countUnsolvedRegularModules(bomb)) return 6;
		if(BombEdgeworkUtils.getLitIndicatorCount(bomb) >= 2) return 8;
		if(BombEdgeworkUtils.getUnlitIndicatorCount(bomb) == 1) return 2;
		return 4;
	}

	private static int secondDigit(List<Integer> buttons) {
		List<Integer> firstRow = buttons.subList(0, 5);
		List<Integer> secondRow = buttons.subList(5, 10);
		if(oddCount(firstRow) > firstRow.size() - oddCount(firstRow)) return 2;
		if(isAscendingConsecutive(firstRow) || isAscendingConsecutive(secondRow)) return 9;
		if(secondRow.stream().mapToInt(Integer::intValue).sum() > 16) return 8;
		if(firstRow.stream().mapToInt(Integer::intValue).sum() < 15) return 3;
		if(firstRow.get(2) % 2 == secondRow.get(2) % 2) return 0;
		if(firstRow.containsAll(List.of(2, 3, 7))) return 5;
		if(oddCount(secondRow) == 2) return 1;
		if(firstRow.containsAll(List.of(0, 1, 7, 8, 9)) || secondRow.containsAll(List.of(0, 1, 7, 8, 9))) return 6;
		if(secondRow.contains(7)) return 7;
		return 4;
	}

	private static int thirdDigit(BombEntity bomb, int startingTimeMinutes) {
		List<ModuleEntity> modules = bomb.getModules();
		int solved = BombEdgeworkUtils.countSolvedModules(bomb);
		if(solved == 7) return 7;
		if(modules.size() == 9) return 9;
		if(modules.stream().anyMatch(candidate -> THIRD_DIGIT_PRESENT.contains(candidate.getType()))) return 6;
		if(startingTimeMinutes < modules.size()) return 0;
		if(solved > modules.size() - solved) return 1;
		if(modules.stream().anyMatch(candidate -> candidate.isSolved() && THIRD_DIGIT_SOLVED.contains(candidate.getType()))) return 2;
		if(modules.stream().anyMatch(candidate -> !candidate.isSolved() && THIRD_DIGIT_UNSOLVED.contains(candidate.getType()))) return 8;
		if(bomb.getStrikes() >= 1) return 3;
		if(modules.stream().anyMatch(candidate -> candidate.getType().isNeedy())) return 5;
		return 4;
	}

	private static int fourthDigit(
		BombEntity bomb, DayOfWeek startDay, int currentHour, boolean timerBelowHalf,
		int first, int second, int third
	) {
		if(startDay == DayOfWeek.MONDAY || startDay == DayOfWeek.WEDNESDAY || startDay == DayOfWeek.FRIDAY) return 1;
		if(currentHour >= 12 && currentHour < 17) return 0;
		if(first % 2 == 1 && third % 2 == 1) return 8;
		if(bomb.getModules().stream().anyMatch(candidate -> candidate.getType() == ModuleType.FORGET_ME_NOT)) return 9;
		if(Arrays.stream(PortType.values()).anyMatch(type -> BombEdgeworkUtils.countPortPlatesWithPortType(bomb, type) >= 3)) return 7;
		if(first * second * third > 100) return 5;
		if(first + second + third > 19) return 3;
		if(first == 2 || second == 2 || third == 2) return 2;
		if(timerBelowHalf) return 6;
		return 4;
	}

	private static long oddCount(List<Integer> row) {
		return row.stream().filter(value -> value % 2 != 0).count();
	}

	private static boolean isAscendingConsecutive(List<Integer> row) {
		return IntStream.range(1, row.size()).allMatch(index -> row.get(index) == row.get(index - 1) + 1);
	}
}
