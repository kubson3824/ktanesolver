package ktanesolver.module.modded.regular.synchronization;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

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
	type = ModuleType.SYNCHRONIZATION,
	id = "SynchronizationModule",
	name = "Synchronization",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Derive the sync method, merge all flashing-light groups, then sync to the timer.",
	tags = {"lights", "timing", "grid", "sequences"}
)
public class SynchronizationSolver extends AbstractModuleSolver<SynchronizationInput, SynchronizationOutput> {
	private static final int[][][] CHART = {
		{{1,1},{0,1},{2,2},{0,2},{2,2},{0,1},{2,1},{2,1},{2,0}},
		{{0,0},{2,2},{1,2},{1,0},{1,2},{1,0},{0,1},{0,0},{0,2}},
		{{1,1},{1,2},{2,1},{2,0},{1,0},{0,2},{0,0},{1,1},{2,0}}
	};
	private static final int[] LIGHT_TO_COLUMN = {0,1,2,7,8,3,6,5,4};
	private static final String[] ORDER = {"ASC", "DES", "OPP"};
	private static final String[] STATE = {"ON", "OFF", "ALT"};

	@Override
	protected SolveResult<SynchronizationOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SynchronizationInput input
	) {
		if (input == null || input.displayNumber() < 1 || input.displayNumber() > 9) return failure("Display number must be 1–9");
		if (input.speeds() == null || input.speeds().size() != 9 || input.speeds().stream().anyMatch(speed -> speed == null || speed < 0 || speed > 5))
			return failure("Enter all nine speed ratings from 0 to 5");
		List<Integer> flashing = input.speeds().stream().filter(speed -> speed > 0).sorted().toList();
		if (!flashing.equals(List.of(1, 2, 3, 4, 5))) return failure("The flashing lights must use speeds 1, 2, 3, 4, and 5 exactly once");

		int fastest = input.speeds().indexOf(5), slowest = input.speeds().indexOf(1);
		int[] method = method(input.displayNumber(), fastest, slowest, input.speeds().get(4));
		List<SynchronizationStep> steps = steps(input.speeds(), method);
		storeState(module, Map.of("fastestLight", coordinate(fastest), "centerSpeed", input.speeds().get(4)));
		return success(new SynchronizationOutput(ORDER[method[0]] + "_" + STATE[method[1]], steps, input.displayNumber()));
	}

	static int[] method(int display, int fastest, int slowest, int centerSpeed) {
		int column = LIGHT_TO_COLUMN[fastest], row = (display - 1) / 3;
		int dx = slowest % 3 - 1, dy = slowest / 3 - 1;
		column = Math.floorMod(column + dx * centerSpeed, 9);
		row = Math.floorMod(row + dy * centerSpeed, 3);
		return CHART[row][column].clone();
	}

	static List<SynchronizationStep> steps(List<Integer> speeds, int[] method) {
		List<Group> groups = new ArrayList<>();
		for (int position = 0; position < 9; position++) if (speeds.get(position) > 0)
			groups.add(new Group(speeds.get(position), new ArrayList<>(List.of(position + 1))));
		List<SynchronizationStep> result = new ArrayList<>(); boolean on = true;
		while (groups.size() > 1) {
			List<Group> eligible = groups.stream().filter(group -> group.positions.size() == 1).count() >= 2
				? groups.stream().filter(group -> group.positions.size() == 1).sorted(Comparator.comparingInt(Group::speed)).toList()
				: groups.stream().sorted(Comparator.comparingInt(Group::speed)).toList();
			Group first = switch (method[0]) { case 0 -> eligible.get(0); case 1 -> eligible.get(eligible.size() - 1); default -> eligible.get(0); };
			Group second = switch (method[0]) { case 0 -> eligible.get(1); case 1 -> eligible.get(eligible.size() - 2); default -> eligible.get(eligible.size() - 1); };
			String state = method[1] == 0 ? "ON" : method[1] == 1 ? "OFF" : on ? "ON" : "OFF";
			result.add(new SynchronizationStep(first.position(), state, second.position(), state));
			if (method[1] == 2) on = !on;
			ArrayList<Integer> merged = new ArrayList<>(second.positions); merged.addAll(first.positions);
			groups.remove(first); groups.remove(second); groups.add(new Group(second.speed, merged));
		}
		return result;
	}

	private static String coordinate(int position) { return Character.toString((char) ('A' + position % 3)) + (position / 3 + 1); }
	private static final class Group {
		private final int speed; private final List<Integer> positions;
		private Group(int speed, List<Integer> positions) { this.speed = speed; this.positions = positions; }
		private int speed() { return speed; }
		private int position() { return positions.stream().mapToInt(Integer::intValue).min().orElseThrow(); }
	}
}
