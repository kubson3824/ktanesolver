package ktanesolver.module.modded.regular.graffitinumbers;

import static ktanesolver.module.modded.regular.graffitinumbers.GraffitiNumbersInput.Color.*;

import java.util.ArrayList;
import java.util.List;
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
import ktanesolver.module.modded.regular.graffitinumbers.GraffitiNumbersInput.Color;

@Service
@ModuleInfo(
	type = ModuleType.GRAFFITI_NUMBERS,
	id = "graffitiNumbers",
	name = "Graffiti Numbers",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Spray the rule numbers that match a shuffled 3×3 grid",
	tags = {"numbers", "colors", "grid", "rules", "modded"}
)
public class GraffitiNumbersSolver extends AbstractModuleSolver<GraffitiNumbersInput, GraffitiNumbersOutput> {
	private static final Set<Integer> PRIMES = Set.of(2, 3, 5, 7);

	@Override
	protected SolveResult<GraffitiNumbersOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, GraffitiNumbersInput input
	) {
		List<Integer> numbers = input.numbers();
		if (numbers == null || numbers.size() != 9 || numbers.stream().anyMatch(
			number -> number == null || number < 1 || number > 9
		) || numbers.stream().distinct().count() != 9) {
			return failure("Enter each number from 1 to 9 exactly once");
		}

		List<Color> colors = input.colors();
		if (colors == null || colors.size() != 9 || colors.stream().anyMatch(java.util.Objects::isNull)) {
			return failure("Select a color for all 9 numbers");
		}

		long red = colors.stream().filter(RED::equals).count();
		long green = colors.stream().filter(GREEN::equals).count();
		long blue = colors.stream().filter(BLUE::equals).count();
		long yellow = colors.stream().filter(YELLOW::equals).count();
		int start;
		int direction;
		if (red > green) {
			start = 8;
			direction = -1;
		} else if (blue > yellow) {
			start = 6;
			direction = 1;
		} else if (green > blue) {
			start = 4;
			direction = -1;
		} else {
			start = 1;
			direction = 1;
		}

		List<Integer> pressNumbers = new ArrayList<>();
		List<Integer> buttonPositions = new ArrayList<>();
		for (int offset = 0; offset < 9; offset++) {
			int rule = Math.floorMod(start - 1 + offset * direction, 9) + 1;
			if (matchesRule(rule, numbers, colors, pressNumbers.size())) {
				pressNumbers.add(rule);
				buttonPositions.add(numbers.indexOf(rule) + 1);
			}
		}
		return success(new GraffitiNumbersOutput(List.copyOf(pressNumbers), List.copyOf(buttonPositions)));
	}

	private static boolean matchesRule(int rule, List<Integer> numbers, List<Color> colors, int trueRules) {
		return switch (rule) {
			case 1 -> numbers.get(0) < numbers.get(3) && numbers.get(3) < numbers.get(6);
			case 2 -> numbers.get(0) > numbers.get(1) && numbers.get(1) > numbers.get(2);
			case 3 -> numbers.get(0) + numbers.get(2) + numbers.get(6) + numbers.get(8)
				> numbers.get(1) + numbers.get(3) + numbers.get(4) + numbers.get(5) + numbers.get(7);
			case 4 -> colors.get(numbers.indexOf(1)) == BLUE;
			case 5 -> numbers.subList(0, 3).stream().filter(PRIMES::contains).count() >= 2;
			case 6 -> (numbers.get(0) + numbers.get(3)) % 10 == numbers.get(6)
				|| (numbers.get(1) + numbers.get(4)) % 10 == numbers.get(7)
				|| (numbers.get(2) + numbers.get(5)) % 10 == numbers.get(8);
			case 7 -> numbers.get(0) + numbers.get(8) != numbers.get(2) + numbers.get(6);
			case 8 -> List.of(colors.get(0), colors.get(2), colors.get(6), colors.get(8))
				.stream().distinct().count() <= 2;
			case 9 -> trueRules < 3;
			default -> throw new IllegalArgumentException("Unknown rule: " + rule);
		};
	}
}
