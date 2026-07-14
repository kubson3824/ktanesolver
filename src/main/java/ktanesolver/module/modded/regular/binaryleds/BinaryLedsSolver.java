package ktanesolver.module.modded.regular.binaryleds;

import java.util.List;
import java.util.stream.IntStream;

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
	type = ModuleType.BINARY_LEDS,
	id = "binary-leds",
	name = "Binary LEDs",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the oscillating LED sequence and its wire-cut timings.",
	tags = {"binary", "LEDs", "wires", "sequence"}
)
public class BinaryLedsSolver extends AbstractModuleSolver<BinaryLedsInput, BinaryLedsOutput> {
	private static final int[][] SEQUENCES = {
		{17, 15, 6, 2, 24, 8, 26, 25, 21, 24, 1, 15, 18, 8},
		{18, 15, 19, 31, 12, 6, 19, 21, 11, 16, 19, 2, 1, 29},
		{8, 25, 1, 15, 20, 15, 9, 3, 6, 24, 1, 24, 5, 26},
		{21, 27, 6, 12, 27, 20, 7, 1, 19, 15, 3, 13, 9, 28},
		{3, 21, 14, 22, 7, 28, 16, 27, 22, 17, 26, 2, 31, 15},
		{8, 22, 30, 19, 1, 25, 31, 16, 9, 7, 6, 13, 9, 7},
		{5, 18, 12, 7, 5, 12, 31, 16, 10, 15, 17, 9, 12, 25},
		{4, 20, 18, 25, 20, 4, 24, 29, 17, 16, 12, 16, 29, 19}
	};
	private static final int[][] TARGET_INDEXES = {
		{5, 3, 7}, {11, 8, 4}, {9, 1, 2}, {8, 12, 7},
		{10, 5, 8}, {0, 10, 6}, {2, 5, 9}, {9, 5, 10}
	};
	private static final String[] COLORS = {"RED", "GREEN", "BLUE"};

	@Override
	protected SolveResult<BinaryLedsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BinaryLedsInput input
	) {
		if (input == null || input.observations() == null || input.observations().size() != 3) {
			return failure("Record exactly three consecutive LED values");
		}
		List<Integer> observations = input.observations();
		if (observations.stream().anyMatch(value -> value == null || value < 1 || value > 31)) {
			return failure("LED values must be between 1 and 31");
		}

		List<Integer> matches = IntStream.range(0, SEQUENCES.length)
			.filter(sequence -> matches(sequence, observations))
			.boxed()
			.toList();
		if (matches.size() != 1) {
			return failure("Those readings do not match a Binary LEDs sequence");
		}

		int sequence = matches.getFirst();
		int[] targets = IntStream.range(0, COLORS.length)
			.map(color -> SEQUENCES[sequence][TARGET_INDEXES[sequence][color]])
			.toArray();
		int recommended = IntStream.range(0, COLORS.length)
			.filter(color -> IntStream.of(SEQUENCES[sequence]).filter(value -> value == targets[color]).count() == 1)
			.findFirst()
			.orElse(0);

		storeState(module, "input", new BinaryLedsInput(List.copyOf(observations)));
		return success(new BinaryLedsOutput(
			sequence + 1, targets[0], targets[1], targets[2], COLORS[recommended], targets[recommended]
		));
	}

	private static boolean matches(int sequence, List<Integer> observations) {
		return IntStream.range(0, 26).anyMatch(start ->
			IntStream.range(0, observations.size()).allMatch(offset ->
				SEQUENCES[sequence][sequenceIndex(start + offset)] == observations.get(offset)
			)
		);
	}

	private static int sequenceIndex(int cycleIndex) {
		int index = cycleIndex % 26;
		return index < 14 ? index : 26 - index;
	}
}
