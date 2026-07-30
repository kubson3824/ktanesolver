package ktanesolver.module.modded.regular.marbletumble;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.marbletumble.MarbleTumbleInput.CylinderColor;

@Service
@ModuleInfo(
	type = ModuleType.MARBLE_TUMBLE,
	id = "MarbleTumbleModule",
	name = "Marble Tumble",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Guide the marble through five rotating cylinders without hitting a trap",
	tags = {"timing", "colors", "pathfinding", "modded"}
)
public class MarbleTumbleSolver extends AbstractModuleSolver<MarbleTumbleInput, MarbleTumbleOutput> {
	private static final int POSITION_STATES = 100_000;
	private static final int STATE_COUNT = 6 * POSITION_STATES;
	private static final int[][] ROTATIONS = {
		{-1, 1, -2, 0, 2},
		{-2, 1, 2, -1, 0},
		{1, 0, 2, -2, -1},
		{0, -1, -2, 1, 2},
		{2, 0, 1, -1, -2},
		{1, -2, -1, 2, 0},
		{-2, 2, 0, 1, -1},
		{0, -1, 1, 2, -2},
		{-1, 2, 0, -2, 1},
		{2, -2, -1, 0, 1}
	};

	@Override
	protected SolveResult<MarbleTumbleOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MarbleTumbleInput input
	) {
		if (input == null || !hasFiveValues(input.colors()) || !hasFiveValues(input.safeGaps())
			|| !hasFiveValues(input.trapPositions())) {
			return failure("Enter all five cylinder colors, safe gaps, and traps");
		}
		if (input.colors().stream().distinct().count() != 5) {
			return failure("Each cylinder color must be used exactly once");
		}
		if (!validPositions(input.safeGaps()) || !validPositions(input.trapPositions())) {
			return failure("Gap and trap positions must be digits from 0 to 9");
		}
		for (int i = 0; i < 5; i++) {
			if (input.safeGaps().get(i).equals(input.trapPositions().get(i))) {
				return failure("A cylinder's safe gap and trap cannot share a position");
			}
		}

		List<Integer> timerDigits = findPath(input.colors(), input.safeGaps(), input.trapPositions());
		if (timerDigits == null) return failure("No strike-free route exists from this layout");
		String sequence = timerDigits.stream().map(String::valueOf).collect(Collectors.joining(" → "));
		return success(new MarbleTumbleOutput(timerDigits,
			"Press the module in order when the timer's last digit is " + sequence));
	}

	private static boolean hasFiveValues(List<?> values) {
		return values != null && values.size() == 5 && values.stream().noneMatch(value -> value == null);
	}

	private static boolean validPositions(List<Integer> positions) {
		return positions.stream().allMatch(position -> position >= 0 && position <= 9);
	}

	private static List<Integer> findPath(
		List<CylinderColor> colors, List<Integer> safeGaps, List<Integer> trapPositions
	) {
		int[] trapOffsets = new int[5];
		for (int i = 0; i < 5; i++) {
			trapOffsets[i] = Math.floorMod(trapPositions.get(i) - safeGaps.get(i), 10);
		}

		int start = pack(safeGaps);
		int[] parent = new int[STATE_COUNT];
		byte[] move = new byte[STATE_COUNT];
		Arrays.fill(parent, -2);
		parent[start] = -1;
		ArrayDeque<Integer> queue = new ArrayDeque<>();
		queue.add(start);

		while (!queue.isEmpty()) {
			int state = queue.remove();
			int level = state / POSITION_STATES;
			int[] gaps = unpack(state % POSITION_STATES);
			for (int timerDigit = 0; timerDigit < 10; timerDigit++) {
				int[] nextGaps = new int[5];
				for (int i = 0; i < 5; i++) {
					nextGaps[i] = Math.floorMod(gaps[i] + ROTATIONS[timerDigit][colors.get(i).ordinal()], 10);
				}

				int position = level == 0 ? 0 : nextGaps[level - 1];
				int nextLevel = level;
				while (nextLevel < 5 && nextGaps[nextLevel] == position) nextLevel++;
				if (nextLevel < 5
					&& Math.floorMod(nextGaps[nextLevel] + trapOffsets[nextLevel], 10) == position) {
					continue;
				}

				int nextState = nextLevel * POSITION_STATES + pack(nextGaps);
				if (parent[nextState] != -2) continue;
				parent[nextState] = state;
				move[nextState] = (byte)timerDigit;
				if (nextLevel == 5) return reconstruct(parent, move, nextState);
				queue.add(nextState);
			}
		}
		return null;
	}

	private static int pack(List<Integer> positions) {
		int packed = 0;
		for (int position : positions) packed = packed * 10 + position;
		return packed;
	}

	private static int pack(int[] positions) {
		int packed = 0;
		for (int position : positions) packed = packed * 10 + position;
		return packed;
	}

	private static int[] unpack(int packed) {
		int[] positions = new int[5];
		for (int i = 4; i >= 0; i--) {
			positions[i] = packed % 10;
			packed /= 10;
		}
		return positions;
	}

	private static List<Integer> reconstruct(int[] parent, byte[] move, int state) {
		ArrayList<Integer> path = new ArrayList<>();
		while (parent[state] != -1) {
			path.addFirst((int)move[state]);
			state = parent[state];
		}
		return path;
	}
}
