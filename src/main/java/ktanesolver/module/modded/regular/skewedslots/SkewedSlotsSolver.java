package ktanesolver.module.modded.regular.skewedslots;

import java.util.List;

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
	type = ModuleType.SKEWED_SLOTS,
	id = "skewed-slots",
	name = "Skewed Slots",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Apply the shared and slot-specific arithmetic rules to determine the three digits to submit.",
	tags = {"modded", "slots", "math", "edgework"}
)
public class SkewedSlotsSolver extends AbstractModuleSolver<SkewedSlotsInput, SkewedSlotsOutput> {

	@Override
	protected SolveResult<SkewedSlotsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SkewedSlotsInput input) {
		if(input == null || input.digits() == null || input.digits().size() != 3) {
			return failure("Skewed Slots requires exactly 3 digits");
		}

		List<Integer> originalDigits = List.copyOf(input.digits());
		for(Integer digit : originalDigits) {
			if(digit == null || digit < 0 || digit > 9) {
				return failure("Skewed Slots digits must each be between 0 and 9");
			}
		}

		if(BombEdgeworkUtils.countSerialDigits(bomb) == 0) {
			return failure("Skewed Slots requires a serial number with at least one digit");
		}

		int litIndicatorCount = (int) BombEdgeworkUtils.getLitIndicatorCount(bomb);
		int unlitIndicatorCount = (int) BombEdgeworkUtils.getUnlitIndicatorCount(bomb);
		int batteryCount = bomb.getBatteryCount();
		int rightmostSerialDigit = bomb.getLastDigit();
		int largestSerialDigit = largestDigitInSerial(bomb);
		boolean hasRcaOrPs2 = bomb.hasPort(PortType.STEREO_RCA) || bomb.hasPort(PortType.PS2);

		int firstSlot = applyAllSlots(originalDigits.get(0), litIndicatorCount, unlitIndicatorCount, batteryCount, hasRcaOrPs2);
		int secondSlot = applyAllSlots(originalDigits.get(1), litIndicatorCount, unlitIndicatorCount, batteryCount, hasRcaOrPs2);
		int thirdSlot = applyAllSlots(originalDigits.get(2), litIndicatorCount, unlitIndicatorCount, batteryCount, hasRcaOrPs2);

		firstSlot = applyFirstSlotRules(firstSlot, originalDigits.get(1), rightmostSerialDigit, bomb.hasPort(PortType.PARALLEL));
		secondSlot = applySecondSlotRules(secondSlot, originalDigits.get(0), bomb.isIndicatorUnlit("BOB"));
		thirdSlot = applyThirdSlotRules(thirdSlot, originalDigits.get(2), originalDigits, bomb.hasPort(PortType.SERIAL), largestSerialDigit);

		List<Integer> solvedDigits = List.of(
			normalize(firstSlot),
			normalize(secondSlot),
			normalize(thirdSlot)
		);
		String code = solvedDigits.stream()
			.map(String::valueOf)
			.reduce("", String::concat);

		return success(new SkewedSlotsOutput(solvedDigits, code));
	}

	private static int applyAllSlots(int originalDigit, int litIndicatorCount, int unlitIndicatorCount, int batteryCount, boolean hasRcaOrPs2) {
		int number = switch(originalDigit) {
			case 2 -> 5;
			case 7 -> 0;
			default -> originalDigit;
		};

		number += litIndicatorCount;
		number -= unlitIndicatorCount;

		if(number % 3 == 0) {
			return number + 4;
		}
		if(number > 7) {
			return number * 2;
		}
		if(number < 3 && number % 2 == 0) {
			return number / 2;
		}
		if(hasRcaOrPs2) {
			return number;
		}
		return originalDigit + batteryCount;
	}

	private static int applyFirstSlotRules(int number, int originalDigitToTheRight, int rightmostSerialDigit, boolean hasParallelPort) {
		if(number % 2 == 0 && number > 5) {
			return number / 2;
		}
		if(isPrime(number)) {
			return number + rightmostSerialDigit;
		}
		if(hasParallelPort) {
			return number * -1;
		}
		if(originalDigitToTheRight % 2 == 1) {
			return number;
		}
		return number - 2;
	}

	private static int applySecondSlotRules(int number, int firstOriginalDigit, boolean hasUnlitBob) {
		if(hasUnlitBob) {
			return number;
		}
		if(number == 0) {
			return number + firstOriginalDigit;
		}

		Integer nextFibonacci = nextFibonacciFirstOccurrence(number);
		if(nextFibonacci != null) {
			return number + nextFibonacci;
		}
		if(number >= 7) {
			return number + 4;
		}
		return number * 3;
	}

	private static int applyThirdSlotRules(int number, int originalDigit, List<Integer> originalDigits, boolean hasSerialPort, int largestSerialDigit) {
		if(hasSerialPort) {
			return number + largestSerialDigit;
		}
		if(originalDigits.stream().filter(digit -> digit == originalDigit).count() >= 2) {
			return number;
		}
		if(number >= 5) {
			return Integer.bitCount(originalDigit);
		}
		return number + 1;
	}

	private static boolean isPrime(int number) {
		if(number < 2) {
			return false;
		}
		for(int divisor = 2; divisor * divisor <= number; divisor++) {
			if(number % divisor == 0) {
				return false;
			}
		}
		return true;
	}

	private static Integer nextFibonacciFirstOccurrence(int number) {
		if(number <= 0) {
			return null;
		}
		if(number == 1) {
			return 1;
		}

		int previous = 1;
		int current = 1;
		while(current < number) {
			int next = previous + current;
			previous = current;
			current = next;
		}
		if(current == number) {
			return previous + current;
		}
		return null;
	}

	private static int largestDigitInSerial(BombEntity bomb) {
		return bomb.getSerialNumber().chars()
			.filter(Character::isDigit)
			.map(character -> character - '0')
			.max()
			.orElse(0);
	}

	private static int normalize(int number) {
		return Math.floorMod(number, 10);
	}
}
