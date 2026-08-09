package ktanesolver.module.modded.regular.lasers;

import java.util.Arrays;
import java.util.HashSet;
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

@Service
@ModuleInfo(
	type = ModuleType.LASERS,
	id = "lasers",
	name = "Lasers",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Choose a safe hatch for each of seven colored laser stages.",
	tags = {"grid", "numbers", "stages", "modded"}
)
public class LasersSolver extends AbstractModuleSolver<LasersInput, LasersOutput> {
	private static final Set<Integer> LABELS = Set.of(1, 2, 3, 4, 5, 6, 7, 8, 9);

	@Override
	protected SolveResult<LasersOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LasersInput input
	) {
		if (input == null || input.labels() == null || input.labels().size() != 9
			|| !new HashSet<>(input.labels()).equals(LABELS)) {
			return failure("Enter each hatch label from 1 to 9 exactly once");
		}
		if (input.startingTimeMinutes() == null || input.startingTimeMinutes() < 0) {
			return failure("Enter the bomb's starting time in whole minutes");
		}

		List<Integer> labels = input.labels();
		int rowRoot = digitalRoot(labels.get(0) + labels.get(1) + labels.get(2));
		int columnRoot = digitalRoot(labels.get(1) + labels.get(2) + labels.get(4)
			+ labels.get(5) + labels.get(7) + labels.get(8));
		int timeRoot = input.startingTimeMinutes() % 9 + 1;
		int[] rulePositions = {labels.indexOf(rowRoot), labels.indexOf(columnRoot), labels.indexOf(timeRoot)};
		int[] path = new int[7];
		if (!search(labels, rulePositions, bomb.getModules().size() % 2, path, new boolean[9], 0)) {
			return failure("No safe seven-stage path exists for these hatches");
		}

		return success(new LasersOutput(
			Arrays.stream(path).map(position -> position + 1).boxed().toList(),
			Arrays.stream(path).map(labels::get).boxed().toList()
		));
	}

	private static int digitalRoot(int value) {
		return (value - 1) % 9 + 1;
	}

	private static boolean search(
		List<Integer> labels, int[] rulePositions, int moduleParity,
		int[] path, boolean[] used, int stage
	) {
		if (stage == path.length) return true;
		for (int position = 0; position < 9; position++) {
			if (!isValid(labels, rulePositions, moduleParity, path, used, stage, position)) continue;
			path[stage] = position;
			used[position] = true;
			if (search(labels, rulePositions, moduleParity, path, used, stage + 1)) return true;
			used[position] = false;
		}
		return false;
	}

	private static boolean isValid(
		List<Integer> labels, int[] rulePositions, int moduleParity,
		int[] path, boolean[] used, int stage, int position
	) {
		if (used[position]) return false;
		return switch (stage) {
			case 0 -> row(position) != row(rulePositions[0]);
			case 1 -> !orthogonallyAdjacent(position, path[0]);
			case 2 -> column(position) != column(rulePositions[1]);
			case 3 -> diagonallyAdjacent(position, path[2]);
			case 4 -> row(position) != row(rulePositions[2]) && column(position) != column(rulePositions[2]);
			case 5 -> labels.get(position) % 2 != moduleParity;
			case 6 -> Math.abs(row(position) - row(path[4])) > 1
				|| Math.abs(column(position) - column(path[4])) > 1;
			default -> false;
		};
	}

	private static int row(int position) { return position / 3; }
	private static int column(int position) { return position % 3; }
	private static boolean orthogonallyAdjacent(int first, int second) {
		return Math.abs(row(first) - row(second)) + Math.abs(column(first) - column(second)) == 1;
	}
	private static boolean diagonallyAdjacent(int first, int second) {
		return Math.abs(row(first) - row(second)) == 1 && Math.abs(column(first) - column(second)) == 1;
	}
}
