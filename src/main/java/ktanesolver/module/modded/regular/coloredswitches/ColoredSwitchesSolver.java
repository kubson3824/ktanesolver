package ktanesolver.module.modded.regular.coloredswitches;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.coloredswitches.ColoredSwitchesInput.SwitchColor;

@Service
@ModuleInfo(
	type = ModuleType.COLORED_SWITCHES,
	id = "colored-switches",
	name = "Colored Switches",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find safe switch transitions using each switch's color",
	tags = {"switches", "colors", "pathfinding", "modded"}
)
public class ColoredSwitchesSolver extends AbstractModuleSolver<ColoredSwitchesInput, ColoredSwitchesOutput> {
	// Bit 0 = red through bit 5 = turquoise; columns are the module's right-to-left bit order.
	private static final int[][] ALLOWED_COLORS = {
		{0, 0, 0, 0, 63}, {0, 0, 63, 0, 0}, {0, 0, 63, 63, 0}, {6, 0, 63, 0, 0},
		{63, 0, 0, 0, 22}, {63, 8, 0, 0, 41}, {0, 63, 0, 0, 0}, {8, 0, 0, 63, 0},
		{0, 0, 0, 63, 0}, {0, 2, 63, 63, 0}, {0, 0, 0, 63, 0}, {0, 0, 0, 63, 0},
		{0, 63, 0, 0, 0}, {63, 0, 0, 0, 0}, {0, 0, 0, 0, 63}, {0, 0, 0, 0, 63},
		{63, 0, 0, 0, 0}, {0, 0, 0, 63, 0}, {63, 0, 0, 0, 52}, {0, 63, 0, 0, 0},
		{0, 63, 41, 0, 0}, {63, 0, 20, 0, 0}, {63, 0, 2, 0, 0}, {0, 63, 0, 0, 0},
		{0, 63, 0, 0, 63}, {14, 16, 0, 0, 63}, {0, 63, 0, 63, 11}, {49, 0, 0, 0, 63},
		{63, 26, 0, 36, 0}, {63, 37, 0, 24, 0}, {0, 63, 0, 3, 0}, {0, 0, 63, 0, 0}
	};

	@Override
	protected SolveResult<ColoredSwitchesOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ColoredSwitchesInput input
	) {
		if (input == null || input.switchColors() == null || input.switchColors().size() != 5
			|| input.switchColors().stream().anyMatch(color -> color == null)) {
			return failure("Select all five switch colors");
		}
		if (input.currentSwitches() == null || input.currentSwitches().length != 5) {
			return failure("Enter all five switch positions");
		}
		if (input.ledPositions() != null && input.ledPositions().length != 5) {
			return failure("Enter all five LED positions");
		}

		if (!module.getState().containsKey("initialPosition")) {
			storeState(module, "initialPosition", List.of(
				input.currentSwitches()[0], input.currentSwitches()[1], input.currentSwitches()[2],
				input.currentSwitches()[3], input.currentSwitches()[4]
			));
		}
		storeState(module, "switchColors", input.switchColors());

		int current = toState(input.currentSwitches());
		if (input.ledPositions() == null) {
			List<Integer> steps = initialSteps(current, input.switchColors());
			return success(new ColoredSwitchesOutput(
				steps, true, "Make these three safe toggles, then enter the LED positions"
			), false);
		}

		List<Integer> steps = findPath(current, toState(input.ledPositions()), input.switchColors());
		if (steps == null) return failure("The LED position is unreachable from this switch state");
		return success(new ColoredSwitchesOutput(steps, false,
			steps.isEmpty() ? "The switches already match the LEDs" : "Flip the switches in the shown order"));
	}

	private static List<Integer> initialSteps(int state, List<SwitchColor> colors) {
		List<Integer> steps = new ArrayList<>(3);
		for (int count = 0; count < 3; count++) {
			for (int playerIndex = 0; playerIndex < 5; playerIndex++) {
				if (!allowed(state, playerIndex, colors)) continue;
				steps.add(playerIndex + 1);
				state ^= 1 << (4 - playerIndex);
				break;
			}
		}
		return steps;
	}

	private static List<Integer> findPath(int start, int target, List<SwitchColor> colors) {
		if (start == target) return List.of();
		int[] parent = new int[32];
		int[] move = new int[32];
		Arrays.fill(parent, -2);
		parent[start] = -1;
		ArrayDeque<Integer> queue = new ArrayDeque<>();
		queue.add(start);
		while (!queue.isEmpty()) {
			int state = queue.remove();
			for (int playerIndex = 0; playerIndex < 5; playerIndex++) {
				if (!allowed(state, playerIndex, colors)) continue;
				int next = state ^ (1 << (4 - playerIndex));
				if (parent[next] != -2) continue;
				parent[next] = state;
				move[next] = playerIndex + 1;
				if (next == target) return reconstruct(parent, move, target);
				queue.add(next);
			}
		}
		return null;
	}

	private static boolean allowed(int state, int playerIndex, List<SwitchColor> colors) {
		int bit = 4 - playerIndex;
		return (ALLOWED_COLORS[state][bit] & (1 << colors.get(playerIndex).ordinal())) != 0;
	}

	private static List<Integer> reconstruct(int[] parent, int[] move, int target) {
		ArrayList<Integer> path = new ArrayList<>();
		for (int state = target; parent[state] != -1; state = parent[state]) path.addFirst(move[state]);
		return path;
	}

	private static int toState(boolean[] switches) {
		int state = 0;
		for (int i = 0; i < 5; i++) if (switches[i]) state |= 1 << (4 - i);
		return state;
	}
}
