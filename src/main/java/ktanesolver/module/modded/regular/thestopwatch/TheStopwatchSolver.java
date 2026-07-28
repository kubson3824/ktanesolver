package ktanesolver.module.modded.regular.thestopwatch;

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
	type = ModuleType.THE_STOPWATCH,
	id = "stopwatch",
	name = "The Stopwatch",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate how long to run the stopwatch from the serial number and starting bomb time",
	tags = {"stopwatch", "time", "serial", "batteries", "modded"}
)
public class TheStopwatchSolver extends AbstractModuleSolver<TheStopwatchInput, TheStopwatchOutput> {
	private static final int[][] TABLE_ONE = {
		{260, 66, 164, 152},
		{73, 194, 99, 202},
		{116, 158, 240, 195},
		{269, 204, 121, 1}
	};

	@Override
	protected SolveResult<TheStopwatchOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TheStopwatchInput input
	) {
		if (input == null || input.bombStartTimeSeconds() == null || input.bombStartTimeSeconds() <= 0) {
			return failure("Bomb start time must be greater than zero");
		}
		if (bomb == null || bomb.getSerialNumber() == null) return failure("Bomb serial number is required");

		int[] digits = bomb.getSerialNumber().chars()
			.filter(Character::isDigit)
			.map(character -> character - '0')
			.toArray();
		if (digits.length < 2 || digits.length > 4) {
			return failure("Serial number must contain two, three, or four digits");
		}

		int baseRuntime = switch (digits.length) {
			case 2 -> twoDigitRuntime(digits);
			case 3 -> threeDigitRuntime(digits, bomb.getBatteryCount());
			case 4 -> fourDigitRuntime(digits);
			default -> throw new IllegalStateException();
		};
		int runtime = baseRuntime;
		if (baseRuntime > 30) {
			if (input.bombStartTimeSeconds() <= 60) runtime /= 20;
			else if (input.bombStartTimeSeconds() <= 300) runtime /= 10;
		}

		return success(new TheStopwatchOutput(
			baseRuntime,
			runtime,
			"%d:%02d".formatted(runtime / 60, runtime % 60)
		));
	}

	private static int twoDigitRuntime(int[] digits) {
		int product = digits[0] * digits[1];
		int forward = digits[0] * 10 + digits[1] - product;
		int reverse = digits[1] * 10 + digits[0] - product;
		int first = Math.min(forward, reverse);
		int second = Math.max(forward, reverse);
		return TABLE_ONE[Math.floorMod(second, 4)][Math.floorMod(first, 3)];
	}

	private static int threeDigitRuntime(int[] source, int batteries) {
		int[] digits = source.clone();
		if (digits[0] * digits[1] > digits[2] * digits[1] - digits[0]) {
			for (int index = 0; index < digits.length; index++) digits[index] += batteries;
		}

		long evens = java.util.Arrays.stream(digits).filter(value -> value % 2 == 0).count();
		int[] selected;
		if (evens == 2) selected = java.util.Arrays.stream(digits).filter(value -> value % 2 == 0).toArray();
		else if (evens == 3) selected = new int[] {digits[1], digits[2]};
		else {
			if (evens == 0) digits[1] += 2;
			selected = twoLargestInOriginalOrder(digits);
		}

		boolean firstEven = selected[0] % 2 == 0;
		boolean secondEven = selected[1] % 2 == 0;
		if (firstEven) return secondEven ? 220 : 252;
		return secondEven ? 155 : 87;
	}

	private static int fourDigitRuntime(int[] source) {
		int[] digits = source.clone();
		if (digits[1] == 0) digits[1] = 1;
		if (digits[3] == 0) digits[3] = 1;
		int first = digits[0] % digits[1] == 0 ? digits[0] / digits[1] : digits[0] + digits[1];
		int second = digits[2] % digits[3] == 0 ? digits[2] / digits[3] : digits[2] + digits[3];
		return TABLE_ONE[Math.floorMod(second, 4)][Math.floorMod(first, 4)];
	}

	private static int[] twoLargestInOriginalOrder(int[] values) {
		int drop = 0;
		for (int index = 1; index < values.length; index++) {
			if (values[index] <= values[drop]) drop = index;
		}
		return drop == 0 ? new int[] {values[1], values[2]}
			: drop == 1 ? new int[] {values[0], values[2]}
			: new int[] {values[0], values[1]};
	}
}
